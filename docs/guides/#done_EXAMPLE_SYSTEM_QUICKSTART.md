# 🚀 Example System Quick Start

## One-Time Setup

### 1. Create PocketBase Collections

Access PocketBase Admin: `http://localhost:8090/_/`

Create 4 collections: `example_categories`, `design_examples`, `example_generation_queue`, `user_contributions`

(See EXAMPLE_SYSTEM_GUIDE.md for detailed field definitions)

### 2. Seed Categories

```bash
npx tsx scripts/seed-categories.ts
```

**Output:** ✅ 55 categories created

---

## Generate Initial Examples

### High Priority Categories (Recommended)

```bash
npx tsx scripts/generate-examples.ts --high-priority --count 5
```

**Time:** ~30-45 minutes
**Examples:** ~100 (20 categories × 5 examples)

### Specific Category

```bash
npx tsx scripts/generate-examples.ts --category primary-navigation --count 5
```

---

## Monitor & Maintain

### Check Coverage

```bash
# Gap detection report
npx tsx scripts/detect-gaps.ts --report-only

# Create tasks for gaps
npx tsx scripts/detect-gaps.ts --create-tasks
```

### Admin Dashboard

```
http://localhost:3000/admin/examples
```

---

## Usage in Code

### Automatic (Recommended)

```typescript
import { getSmartDesignPrompt } from '@/lib/enhanced-design-prompt';

const prompt = await getSmartDesignPrompt(
  'Build a modern SaaS landing page',
  ['hero-with-cta', 'feature-grids']
);
```

### Manual API Query

```typescript
const response = await fetch('/api/examples/query', {
  method: 'POST',
  body: JSON.stringify({
    categorySlug: 'hero-with-cta',
    context: { projectDescription: 'Modern SaaS app' },
    limit: 3,
  }),
});
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Seed categories | `npx tsx scripts/seed-categories.ts` |
| Generate examples (all) | `npx tsx scripts/generate-examples.ts --count 5` |
| Generate (high priority) | `npx tsx scripts/generate-examples.ts --high-priority --count 5` |
| Generate (specific category) | `npx tsx scripts/generate-examples.ts --category buttons --count 5` |
| Detect gaps | `npx tsx scripts/detect-gaps.ts --report-only` |
| Create tasks | `npx tsx scripts/detect-gaps.ts --create-tasks` |
| Admin dashboard | Open `http://localhost:3000/admin/examples` |

---

## Category Slugs (Top 20 by Priority)

**Priority 10 (Critical):**
- `primary-navigation`
- `hero-with-cta`
- `buttons`

**Priority 9:**
- `mobile-navigation`
- `hero-with-media`
- `feature-grids`
- `section-cta`
- `contact-forms`
- `authentication-forms`
- `pricing-tables`
- `multi-column-footer`

**Priority 8:**
- `feature-lists`
- `testimonials`
- `inline-cta`
- `newsletter-signup`
- `product-grids`
- `product-detail`
- `dashboard-cards`
- `data-tables`
- `article-cards`
- `modals-dialogs`
- `loading-states`
- `dropdowns`

---

## Quality Standards

- **Quality Score:** ≥85 (world-class)
- **Performance:** ≥80
- **Accessibility:** ≥90
- **Design Trends:** ≥85

---

## Troubleshooting

**Examples not generating?**
- Check OpenAI API key
- Verify PocketBase is running
- Check console for errors

**Low quality scores?**
- Increase `--max-retries 5`
- Adjust `--min-quality 75` temporarily

**Database connection errors?**
- Verify `NEXT_PUBLIC_POCKETBASE_URL` in .env
- Check PocketBase is running on port 8090

---

## File Locations

| Type | Path |
|------|------|
| Library files | `/lib/example-*.ts` |
| Scripts | `/scripts/*.ts` |
| API routes | `/app/api/examples/*/route.ts` |
| Admin UI | `/app/admin/examples/page.tsx` |
| Documentation | `/EXAMPLE_SYSTEM_GUIDE.md` |

---

## Success Checklist

- [ ] PocketBase collections created
- [ ] Categories seeded (55 total)
- [ ] High priority examples generated
- [ ] Gap detection shows <5 critical gaps
- [ ] Admin dashboard accessible
- [ ] Example queries working in API

---

## Need Help?

Read the full guide: [EXAMPLE_SYSTEM_GUIDE.md](./EXAMPLE_SYSTEM_GUIDE.md)
