/**
 * Shadcn/UI Component Usage Guide
 *
 * This guide teaches the AI how to use actual shadcn/ui components
 * instead of generating raw HTML with Tailwind classes.
 *
 * WHY: Using actual components guarantees:
 * - Perfect spacing (no more p-3, p-5, p-7 violations)
 * - Perfect contrast (components enforce WCAG standards)
 * - Perfect visual hierarchy (preset sizes and weights)
 * - Consistent styling across all generated apps
 */

export function getShadcnComponentGuide(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SHADCN/UI COMPONENTS (Optional - Use for Complex Interactions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE: Shadcn components are available but NOT required.
The design framework above teaches you to build stunning UIs with native HTML + Tailwind.
Use Shadcn for complex interactions (modals, dropdowns, forms with validation).

Available at: @/components/ui/* (Button, Input, Card, Dialog, Select, Table, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 BUTTON COMPONENT (Use ALWAYS for buttons)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Button } from "@/components/ui/button"

Variants:
- default/primary: Brand gradient, main CTAs
- outline: Secondary actions, cancel buttons
- ghost: Subtle actions, icon buttons
- destructive: Delete, remove actions
- link: Text links that look like buttons

Sizes: sm, default, lg, icon

Examples:

// Primary CTA
<Button variant="primary" size="lg">
  Get Started
</Button>

// With icon
<Button variant="default">
  <Send className="mr-2 h-4 w-4" />
  Send Message
</Button>

// Loading state (built-in!)
<Button loading={isSubmitting}>
  Submit Form
</Button>

// Outline variant
<Button variant="outline">
  Cancel
</Button>

// Icon only
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// Full width
<Button fullWidth>
  Continue
</Button>

❌ NEVER write raw buttons:
<button className="bg-primary text-primary-foreground px-4 py-2..."> ❌

✅ ALWAYS use Button component:
<Button variant="primary">Click Me</Button> ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 INPUT COMPONENT (Use ALWAYS for form inputs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Input } from "@/components/ui/input"

Features: Built-in label, error handling, helper text, perfect spacing

Examples:

// Basic input with label
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Input with error
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error={errors.password}
/>

// Input with helper text
<Input
  label="Username"
  helperText="Choose a unique username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

❌ NEVER write raw inputs:
<div className="space-y-2">
  <label className="text-sm...">Email</label>
  <input className="w-full px-3 py-2..." />
</div> ❌

✅ ALWAYS use Input component:
<Input label="Email" type="email" value={email} onChange={...} /> ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CARD COMPONENT (Use ALWAYS for cards)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

Features: Perfect spacing, consistent shadows, proper structure

Examples:

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Feature card with icon
<Card>
  <CardHeader>
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
      <Zap className="h-6 w-6 text-primary" />
    </div>
    <CardTitle>Fast Performance</CardTitle>
    <CardDescription>Lightning-quick load times</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Optimized for speed with 99.9% uptime.
    </p>
  </CardContent>
</Card>

// Pricing card (example assumes you have a pricingPlan object)
<Card className="relative">
  {pricingPlan.popular && (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
      <Badge variant="default">Most Popular</Badge>
    </div>
  )}
  <CardHeader>
    <CardTitle>{pricingPlan.name}</CardTitle>
    <CardDescription>
      <span className="text-4xl font-bold text-foreground">{'$'}{pricingPlan.price}</span>
      <span className="text-muted-foreground">/month</span>
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2">
      {pricingPlan.features.map(feature => (
        <li key={feature} className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  </CardContent>
  <CardFooter>
    <Button fullWidth variant={pricingPlan.popular ? "primary" : "outline"}>
      Choose Plan
    </Button>
  </CardFooter>
</Card>

❌ NEVER write raw cards:
<div className="rounded-lg border p-6 shadow-sm"> ❌

✅ ALWAYS use Card components:
<Card><CardHeader>...</CardHeader></Card> ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ BADGE COMPONENT (Use for status, tags, labels)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Badge } from "@/components/ui/badge"

Variants: default, secondary, destructive, outline

Examples:

<Badge>New</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="destructive">Urgent</Badge>
<Badge variant="outline">Draft</Badge>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗨️ DIALOG/MODAL COMPONENT (Use for modals)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

Example:

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <div className="flex gap-3 justify-end mt-4">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SELECT COMPONENT (Use for dropdowns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

Example:

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="tech">Technology</SelectItem>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="marketing">Marketing</SelectItem>
  </SelectContent>
</Select>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TABLE COMPONENT (Use for data tables)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

Example:

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Badge variant={user.active ? "default" : "secondary"}>
            {user.active ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 TEXTAREA COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import: import { Textarea } from "@/components/ui/textarea"
Import: import { Label } from "@/components/ui/label"

Example:

<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea
    id="message"
    placeholder="Type your message..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    rows={4}
  />
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 WHEN TO COMBINE WITH CUSTOM STYLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You CAN add custom Tailwind classes to shadcn components:

✅ Adding backgrounds:
<Card className="bg-gradient-to-r from-primary/10 to-accent/10">

✅ Adding animations:
<Button className="animate-pulse">

✅ Adding layout:
<div className="grid md:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

✅ Creative gradients on text:
<CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  Gradient Title
</CardTitle>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS import components at the top:
   import { Button } from "@/components/ui/button"
   import { Input } from "@/components/ui/input"
   import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

2. PREFER shadcn components over raw HTML:
   ❌ <button className="...">Click</button>
   ✅ <Button>Click</Button>

3. Use component variants instead of custom classes:
   ❌ <Button className="bg-red-500 text-white">Delete</Button>
   ✅ <Button variant="destructive">Delete</Button>

4. Still add creative touches:
   ✅ Gradients, animations, unique layouts
   ✅ Custom icons, images, creative content
   ✅ But use shadcn components as the foundation

5. ALWAYS include required imports in generated files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RESULT: SERIES A QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By using shadcn/ui components, you automatically get:
✅ Perfect spacing (no more p-3, p-5, p-7)
✅ Perfect contrast (WCAG AA compliant)
✅ Perfect visual hierarchy (preset sizes)
✅ Consistent styling across all pages
✅ Production-ready accessibility
✅ Professional polish

Still be CREATIVE with:
- Layout arrangements
- Gradient overlays
- Custom animations
- Icon choices
- Content structure
- Image usage

Think: "shadcn foundation + creative customization"
`;
}

/**
 * Get list of available shadcn components for import detection
 */
export const AVAILABLE_SHADCN_COMPONENTS = {
  button: ['Button', 'buttonVariants'],
  input: ['Input'],
  card: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
  badge: ['Badge'],
  dialog: ['Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogTrigger', 'DialogFooter'],
  select: ['Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'SelectGroup', 'SelectLabel'],
  table: ['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'],
  textarea: ['Textarea'],
  label: ['Label'],
  tabs: ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'],
  'dropdown-menu': ['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger', 'DropdownMenuLabel', 'DropdownMenuSeparator']
} as const;

/**
 * Auto-detect which components are used in generated code
 * and add necessary imports
 */
export function addShadcnImports(code: string): string {
  const imports: string[] = [];

  // Check which components are used
  for (const [file, components] of Object.entries(AVAILABLE_SHADCN_COMPONENTS)) {
    const usedComponents = components.filter(comp => {
      const regex = new RegExp(`<${comp}[\\s>]`, 'g');
      return regex.test(code);
    });

    if (usedComponents.length > 0) {
      imports.push(`import { ${usedComponents.join(', ')} } from "@/components/ui/${file}"`);
    }
  }

  if (imports.length === 0) return code;

  // Find existing imports
  const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
  const existingImports = code.match(importRegex) || [];

  // Find where to insert (after 'use client' and existing imports)
  const useClientMatch = code.match(/^['"]use client['"];?\s*\n/m);
  const lastImportIndex = existingImports.length > 0
    ? code.lastIndexOf(existingImports[existingImports.length - 1]) + existingImports[existingImports.length - 1].length
    : useClientMatch
      ? useClientMatch.index! + useClientMatch[0].length
      : 0;

  // Insert new imports
  const importBlock = '\n' + imports.join('\n') + '\n';
  return code.slice(0, lastImportIndex) + importBlock + code.slice(lastImportIndex);
}
