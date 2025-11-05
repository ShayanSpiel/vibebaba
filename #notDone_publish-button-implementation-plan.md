# #notDone Publish Button Implementation Plan

## Overview
Make the publish button actually work - deploy projects to subdomains and support custom domains. **Realistic timeline: 2-3 days max.**

---

## Current State
- ✅ Publish button exists in `components/project/PublishModal.tsx`
- ✅ Deployment server works (`deployment-server/server.js`)
- ✅ Apps deploy to `localhost:4000/apps/project-{id}/`
- ❌ Subdomain routing doesn't exist
- ❌ Publish button does nothing (just UI mockup)
- ❌ No DNS/domain management

---

## What Actually Needs to Be Done

### 1. Database Schema (30 minutes)
**File:** `pb_migrations/[timestamp]_add_publish_fields.js`

Add to projects table:
```javascript
{
  defaultName: "text",        // AI-generated: "todo-app-2k3f"
  subdomain: "text",          // Same as defaultName initially
  customDomain: "text",       // Optional: "myapp.com"
  isPublished: "bool",        // false by default
  publishedAt: "date"         // timestamp
}
```

### 2. AI-Generated Project Names (1 hour)
**File:** `lib/langgraph/nodes/planner.ts` (or wherever project creation happens)

Add simple name generation:
```typescript
async function generateProjectName(description: string): Promise<string> {
  // Use GPT-4 to extract meaningful name
  const prompt = `Extract a short URL-friendly name from: "${description}".
  Rules: lowercase, hyphens only, 2-4 words max. Example: "todo-app"`;

  const baseName = await callGPT4(prompt);
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const uniqueId = Math.random().toString(36).substring(2, 6);

  return `${sanitized}-${uniqueId}`; // e.g., "todo-app-2k3f"
}
```

Update `lib/project-helpers.ts`:
```typescript
export async function createProject(userId: string, description: string) {
  const defaultName = await generateProjectName(description);

  return pb.collection('projects').create({
    userId,
    name: description, // Display name (user can edit)
    defaultName,       // Generated name (fixed)
    subdomain: defaultName, // Initial subdomain
    isPublished: false,
    // ... other fields
  });
}
```

### 3. Project Name in UI (30 minutes)
**File:** `components/project/ProjectHeader.tsx`

Show project name with inline edit:
```typescript
<div className="flex items-center gap-2">
  <h1 className="text-xl font-semibold">
    {isEditingName ? (
      <input
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onBlur={handleSaveName}
        autoFocus
      />
    ) : (
      <span onClick={() => setIsEditingName(true)}>
        {project.name || project.defaultName}
      </span>
    )}
  </h1>
  <Badge variant="secondary">{project.subdomain}.vibebaba.com</Badge>
</div>
```

### 4. Publish API Endpoint (2 hours)
**File:** `app/api/subdomains/publish/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function POST(req: NextRequest) {
  const { projectId, subdomain, customDomain } = await req.json();

  // 1. Check subdomain availability
  const existing = await pb.collection('projects')
    .getFirstListItem(`subdomain="${subdomain}" && id!="${projectId}"`);

  if (existing) {
    return NextResponse.json({ error: 'Subdomain taken' }, { status: 409 });
  }

  // 2. Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp'];
  if (reserved.includes(subdomain)) {
    return NextResponse.json({ error: 'Reserved subdomain' }, { status: 400 });
  }

  // 3. Update project
  await pb.collection('projects').update(projectId, {
    subdomain,
    customDomain: customDomain || '',
    isPublished: true,
    publishedAt: new Date().toISOString(),
  });

  // 4. Tell deployment server to create subdomain route
  await fetch('http://localhost:4000/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, subdomain }),
  });

  return NextResponse.json({
    success: true,
    url: `https://${subdomain}.vibebaba.com`,
    customUrl: customDomain ? `https://${customDomain}` : null,
  });
}
```

**File:** `app/api/subdomains/check/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const subdomain = req.nextUrl.searchParams.get('subdomain');

  const exists = await pb.collection('projects')
    .getFirstListItem(`subdomain="${subdomain}"`);

  return NextResponse.json({ available: !exists });
}
```

### 5. Update Publish Modal (1 hour)
**File:** `components/project/PublishModal.tsx`

```typescript
const [subdomain, setSubdomain] = useState(project.subdomain || project.defaultName);
const [customDomain, setCustomDomain] = useState(project.customDomain || '');
const [checking, setChecking] = useState(false);
const [available, setAvailable] = useState<boolean | null>(null);

// Real-time availability check
useEffect(() => {
  const checkAvailability = async () => {
    if (!subdomain || subdomain === project.subdomain) return;

    setChecking(true);
    const res = await fetch(`/api/subdomains/check?subdomain=${subdomain}`);
    const { available } = await res.json();
    setAvailable(available);
    setChecking(false);
  };

  const timer = setTimeout(checkAvailability, 500);
  return () => clearTimeout(timer);
}, [subdomain]);

const handlePublish = async () => {
  const res = await fetch('/api/subdomains/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: project.id,
      subdomain,
      customDomain,
    }),
  });

  if (res.ok) {
    const { url, customUrl } = await res.json();
    toast.success(`Published to ${url}`);
    if (customUrl) toast.info(`Custom domain: ${customUrl}`);
    onClose();
  } else {
    const { error } = await res.json();
    toast.error(error);
  }
};

return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Publish Your App</DialogTitle>
      </DialogHeader>

      {/* Subdomain Section */}
      <div className="space-y-2">
        <Label>Subdomain</Label>
        <div className="flex items-center gap-2">
          <Input
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="my-app"
          />
          <span className="text-sm text-muted-foreground">.vibebaba.com</span>
        </div>
        {checking && <p className="text-sm text-muted-foreground">Checking...</p>}
        {available === true && <p className="text-sm text-green-600">✓ Available</p>}
        {available === false && <p className="text-sm text-red-600">✗ Already taken</p>}
      </div>

      {/* Custom Domain Section */}
      <div className="space-y-2">
        <Label>Custom Domain (Optional)</Label>
        <Input
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="myapp.com"
        />
        {customDomain && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Add these DNS records:</p>
            <code className="block bg-muted p-2 rounded">
              A     @     [YOUR_SERVER_IP]<br/>
              CNAME www   vibebaba.com
            </code>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handlePublish}
          disabled={!available && subdomain !== project.subdomain}
        >
          Publish
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
```

### 6. Add DNS Settings to Project Page (1 hour)
**File:** `app/project/[id]/page.tsx`

Add new section under the Publish button:
```typescript
{project.isPublished && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Published URLs</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Default Subdomain */}
      <div>
        <Label>Default URL</Label>
        <div className="flex items-center gap-2">
          <Input
            value={`https://${project.subdomain}.vibebaba.com`}
            readOnly
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(`https://${project.subdomain}.vibebaba.com`);
              toast.success('Copied!');
            }}
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Custom Domain */}
      <div>
        <Label>Custom Domain</Label>
        <div className="flex items-center gap-2">
          <Input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="myapp.com"
          />
          <Button
            size="sm"
            onClick={handleUpdateDomain}
          >
            Update
          </Button>
        </div>

        {project.customDomain && (
          <div className="mt-2 p-3 bg-muted rounded text-xs">
            <p className="font-semibold mb-2">DNS Configuration:</p>
            <div className="space-y-1 font-mono">
              <div>A     @     {SERVER_IP}</div>
              <div>CNAME www   vibebaba.com</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleVerifyDNS}
            >
              Verify DNS
            </Button>
          </div>
        )}
      </div>

      {/* Unpublish */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleUnpublish}
      >
        Unpublish App
      </Button>
    </CardContent>
  </Card>
)}
```

### 7. Deployment Server Updates (2 hours)
**File:** `deployment-server/server.js`

Add publish endpoint:
```javascript
// In-memory subdomain mapping
const subdomainMap = new Map(); // subdomain -> projectId

app.post('/publish', async (req, res) => {
  const { projectId, subdomain } = req.body;

  // Add to mapping
  subdomainMap.set(subdomain, projectId);

  // Save to file for persistence
  fs.writeFileSync(
    './subdomain-map.json',
    JSON.stringify(Object.fromEntries(subdomainMap))
  );

  res.json({ success: true });
});

// Load mappings on startup
const savedMappings = JSON.parse(
  fs.readFileSync('./subdomain-map.json', 'utf-8')
);
Object.entries(savedMappings).forEach(([sub, id]) => {
  subdomainMap.set(sub, id);
});

// Subdomain routing middleware
app.use((req, res, next) => {
  const host = req.headers.host;

  // Check if subdomain
  const match = host.match(/^(.+)\.vibebaba\.com$/);
  if (match) {
    const subdomain = match[1];
    const projectId = subdomainMap.get(subdomain);

    if (projectId) {
      // Rewrite URL to project path
      req.url = `/apps/project-${projectId}${req.url}`;
    }
  }

  next();
});
```

### 8. Nginx Configuration (1 hour)
**File:** `deployment-server/nginx/vibebaba.conf`

Simple wildcard proxy:
```nginx
server {
  listen 80;
  server_name *.vibebaba.com vibebaba.com;

  location / {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}

# SSL (after domain is live)
server {
  listen 443 ssl;
  server_name *.vibebaba.com vibebaba.com;

  ssl_certificate /etc/letsencrypt/live/vibebaba.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/vibebaba.com/privkey.pem;

  location / {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
  }
}
```

**SSL Setup:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard cert (requires DNS challenge)
sudo certbot certonly --manual --preferred-challenges dns \
  -d vibebaba.com -d *.vibebaba.com

# Add TXT record as instructed, then verify
# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

### 9. Toast Notifications (30 minutes)
**Install:**
```bash
npm install sonner
```

**File:** `app/layout.tsx`
```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
```

**Usage in PublishModal:**
```typescript
import { toast } from 'sonner';

toast.success('Published successfully!');
toast.error('Subdomain already taken');
toast.loading('Publishing...', { id: 'publish' });
toast.success('Done!', { id: 'publish' });
```

---

## DNS Settings Location

**Answer: Project Page, under Publish button**

Structure in `/app/project/[id]/page.tsx`:
```
┌─────────────────────────────────────┐
│ ProjectHeader                       │
│  ├─ Project Name (editable)         │
│  ├─ [Deploy] [Publish] buttons      │
│  └─ Status badges                   │
├─────────────────────────────────────┤
│ ▼ Published URLs (if published)     │
│   ├─ Default URL (copy button)      │
│   ├─ Custom Domain (input + update) │
│   ├─ DNS Instructions (if custom)   │
│   └─ [Unpublish] button             │
├─────────────────────────────────────┤
│ PreviewTabs                         │
│  ├─ Preview                         │
│  ├─ Code                            │
│  └─ Database                        │
└─────────────────────────────────────┘
```

**Why not in Settings page?**
- User may have multiple projects with different domains
- Domain is project-specific, not account-specific
- Better UX to manage domain where you manage the project

---

## Realistic Timeline

### Day 1 (Backend - 4 hours)
- [ ] Database migration (30 min)
- [ ] AI name generation (1 hour)
- [ ] Publish API endpoints (2 hours)
- [ ] Deployment server updates (30 min)

### Day 2 (Frontend - 4 hours)
- [ ] Project name UI (30 min)
- [ ] Enhanced PublishModal (1.5 hours)
- [ ] DNS section in project page (1.5 hours)
- [ ] Toast notifications (30 min)

### Day 3 (Infrastructure - 3 hours)
- [ ] Nginx configuration (1 hour)
- [ ] SSL setup (1 hour)
- [ ] Testing (1 hour)

**Total: 2-3 days (11 hours of actual work)**

---

## Production Checklist

- [ ] Domain registered (vibebaba.com)
- [ ] DNS A record: `*.vibebaba.com` → server IP
- [ ] Nginx installed and configured
- [ ] SSL certificate (wildcard)
- [ ] Subdomain blacklist (www, api, admin, etc.)
- [ ] Rate limiting on publish endpoint
- [ ] Input sanitization
- [ ] Test full publish flow
- [ ] Test custom domain flow
- [ ] Test subdomain conflicts

---

## Files Changed Summary

**New files (4):**
1. `pb_migrations/[timestamp]_add_publish_fields.js`
2. `app/api/subdomains/publish/route.ts`
3. `app/api/subdomains/check/route.ts`
4. `deployment-server/nginx/vibebaba.conf`

**Modified files (5):**
1. `components/project/PublishModal.tsx`
2. `components/project/ProjectHeader.tsx`
3. `app/project/[id]/page.tsx`
4. `lib/project-helpers.ts`
5. `deployment-server/server.js`
6. `app/layout.tsx` (add Toaster)

**New dependencies (1):**
- `sonner`

---

## Example Flow

1. User creates app: "I want a todo app"
2. AI generates name: `todo-app-2k3f`
3. User clicks Deploy → app builds → localhost:4000/apps/project-abc123
4. User clicks Publish → modal opens with `todo-app-2k3f` pre-filled
5. User optionally edits subdomain or adds custom domain
6. Clicks Publish → API updates DB + deployment server
7. Toast: "Published to todo-app-2k3f.vibebaba.com"
8. DNS section appears under Publish button
9. User can add/update custom domain anytime
10. User can unpublish (removes subdomain routing)

---

## Notes

- Both subdomain AND custom domain work simultaneously
- Subdomain never becomes inactive (always accessible)
- Custom domain is optional add-on
- DNS instructions shown only when custom domain is set
- All domain management happens in project page (not Settings)
- Simple, fast, works

**No need for 15 days. This is a 2-3 day job maximum.** 🚀
