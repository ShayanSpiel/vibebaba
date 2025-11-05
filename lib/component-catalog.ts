/**
 * Component Catalog System
 *
 * Provides concise component reference (~75 tokens vs ~4,000 tokens)
 * Gives AI same decision-making power with 98% less tokens
 *
 * Philosophy: Show WHAT'S AVAILABLE, not full code
 * Like a restaurant menu, not a cookbook
 */

import type { DesignSystemId } from '@/lib/design-systems/index';

/**
 * Get compact component catalog for AI
 * Returns ~75 tokens of context vs ~4,000 tokens for full library
 */
export function getComponentCatalog(designSystem: DesignSystemId): string {
  switch (designSystem) {
    case 'ant-design':
      return getAntDesignCatalog();
    case 'tailwind-shadcn':
      return getTailwindShadcnCatalog();
    case 'v0-inspired':
    case 'enhanced-2025':
    default:
      return getTailwindShadcnCatalog(); // Default to shadcn/ui
  }
}

/**
 * Ant Design Component Catalog
 * ~75 tokens, provides full decision context
 */
function getAntDesignCatalog(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ANT DESIGN COMPONENT CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA ENTRY:
Button, Checkbox, DatePicker, Form, Input, InputNumber,
Radio, Rate, Select, Slider, Switch, TimePicker, Transfer,
TreeSelect, Upload

DATA DISPLAY:
Avatar, Badge, Calendar, Card, Carousel, Collapse,
Descriptions, Empty, Image, List, Popover, Segmented,
Statistic, Table, Tabs, Tag, Timeline, Tooltip, Tree

FEEDBACK:
Alert, Drawer, Message, Modal, Notification, Popconfirm,
Progress, Result, Skeleton, Spin

LAYOUT:
Divider, Grid, Layout (Header, Content, Footer, Sider),
Space, Flex

NAVIGATION:
Affix, Breadcrumb, Dropdown, Menu, Pagination, Steps

USAGE:
import { Button, Modal, Input } from 'antd'

Choose components based on UI requirements.
Refer to Ant Design docs for props if needed.
`;
}

/**
 * Material UI Component Catalog
 * ~75 tokens
 */
function getMaterialUICatalog(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 MATERIAL UI COMPONENT CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INPUTS:
Button, Checkbox, Fab, Radio, Rating, Select, Slider,
Switch, TextField, ToggleButton, Autocomplete

DATA DISPLAY:
Avatar, Badge, Chip, Divider, List, Table, Tooltip,
Typography

FEEDBACK:
Alert, Backdrop, Dialog, Progress, Skeleton, Snackbar

SURFACES:
Accordion, AppBar, Card, Paper

NAVIGATION:
BottomNavigation, Breadcrumbs, Drawer, Link, Menu,
Pagination, Stepper, Tabs

LAYOUT:
Box, Container, Grid, Stack

USAGE:
import { Button, Dialog, TextField } from '@mui/material'

Choose components based on UI requirements.
`;
}

/**
 * Tailwind CSS UI Patterns Catalog
 * PREMIUM VERSION - Production-ready patterns with high polish (~900 tokens)
 * Includes: shadcn/ui inspired components, proper state management, WCAG contrast
 */
function getTailwindShadcnCatalog(): string {
  return `✅ PREMIUM TAILWIND COMPONENTS (globals.css pre-built):

TYPOGRAPHY: text-h1, text-h2, text-h3, text-body, text-small
BUTTONS: btn btn-primary, btn btn-outline, btn btn-ghost (sizes: btn-sm, btn-md, btn-lg)
CARDS: card card-padding card-hover (with proper shadows and borders)
SPACING: section, container, gap-4, gap-6, gap-8, p-4, p-6, p-8, mb-4, mb-8
ANIMATIONS: animate-fade-in, animate-slide-up, card-hover, hover:scale-105, transition-all

ICONS (lucide-react):
- Navigation: Menu, X, ChevronRight, ChevronDown, ArrowRight
- Actions: Plus, Edit, Trash2, Save, Download, Upload, Share2, Check
- Forms: Mail, Lock, User, Search, Eye, EyeOff, Calendar, Clock
- Status: CheckCircle, AlertCircle, Loader2, Info, XCircle
- Common: Heart, Star, Settings, Filter, Image, File

COMMON PATTERNS:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PREMIUM FORM COMPONENTS (Production-Ready)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORM INPUT (High Contrast, Proper Focus States):
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
  <input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
    placeholder="you@example.com"
  />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>

TEXTAREA (With Character Count):
<div className="space-y-2">
  <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
  <textarea
    id="message"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    rows={5}
    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
    placeholder="Tell us more..."
  />
  <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
</div>

SELECT DROPDOWN (Styled):
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
>
  <option value="">Select category</option>
  <option value="tech">Technology</option>
  <option value="design">Design</option>
</select>

BUTTON WITH LOADING STATE:
<button
  onClick={handleSubmit}
  disabled={loading}
  className="w-full bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 active:scale-95 focus:ring-2 focus:ring-primary focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      Processing...
    </span>
  ) : (
    'Submit'
  )}
</button>

BUTTON GROUP:
<div className="flex items-center gap-3">
  <button className="px-6 py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-all">
    Cancel
  </button>
  <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-95 transition-all">
    Save Changes
  </button>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PREMIUM CARD COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASIC CARD (Clean, High Contrast):
<div className="p-6 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-xl font-semibold text-foreground mb-2">Card Title</h3>
  <p className="text-muted-foreground mb-4">Supporting description text goes here.</p>
  <button className="btn btn-primary">Action</button>
</div>

FEATURE CARD WITH ICON:
<div className="group p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:border-primary/50 transition-all">
  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
    <Zap className="h-6 w-6" />
  </div>
  <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast</h3>
  <p className="text-muted-foreground">Built for speed with optimized performance.</p>
</div>

PRICING CARD:
<div className="p-8 rounded-lg border-2 border-primary bg-card shadow-lg">
  <div className="mb-4">
    <h3 className="text-xl font-semibold text-foreground mb-2">Pro Plan</h3>
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-bold text-foreground">$29</span>
      <span className="text-muted-foreground">/month</span>
    </div>
  </div>
  <ul className="space-y-3 mb-6">
    <li className="flex items-center gap-2 text-foreground">
      <Check className="h-5 w-5 text-primary" />
      Unlimited projects
    </li>
    <li className="flex items-center gap-2 text-foreground">
      <Check className="h-5 w-5 text-primary" />
      Priority support
    </li>
  </ul>
  <button className="w-full btn btn-primary">Get Started</button>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STATS & DATA DISPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STAT CARD:
<div className="p-6 rounded-lg border border-border bg-card">
  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
  <p className="text-3xl font-bold text-foreground">$45,231</p>
  <p className="text-sm text-success mt-2">+12.5% from last month</p>
</div>

DATA TABLE ROW:
<tr className="border-b border-border hover:bg-muted/50 transition-colors">
  <td className="px-6 py-4 text-sm text-foreground font-medium">John Doe</td>
  <td className="px-6 py-4 text-sm text-muted-foreground">john@example.com</td>
  <td className="px-6 py-4">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
      Active
    </span>
  </td>
  <td className="px-6 py-4 text-right">
    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
      <Edit className="h-4 w-4 text-muted-foreground" />
    </button>
  </td>
</tr>

EMPTY STATE:
<div className="text-center py-16">
  <div className="inline-flex p-4 rounded-full bg-muted mb-4">
    <Inbox className="h-12 w-12 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
  <p className="text-muted-foreground mb-6">Get started by creating your first item.</p>
  <button className="btn btn-primary">
    <Plus className="h-5 w-5 mr-2" />
    Create Item
  </button>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 NAVIGATION COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEADER WITH LOGO & NAVIGATION:
<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container mx-auto px-4">
    <div className="flex h-16 items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Brand</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Home</a>
        <a href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm">Sign In</button>
        <button className="btn btn-primary btn-sm">Get Started</button>
      </div>
    </div>
  </div>
</header>

SIDEBAR NAVIGATION:
<aside className="w-64 border-r border-border bg-card h-screen sticky top-0">
  <div className="p-6">
    <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard</h2>
    <nav className="space-y-1">
      <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
        <Home className="h-5 w-5" />
        Home
      </a>
      <a href="/projects" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
        <Folder className="h-5 w-5" />
        Projects
      </a>
      <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
        <Settings className="h-5 w-5" />
        Settings
      </a>
    </nav>
  </div>
</aside>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 HERO SECTIONS (Premium Landing Pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HERO WITH CTA:
<section className="py-24 md:py-32 bg-background">
  <div className="container mx-auto px-4 text-center">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      Now Available
    </div>

    {/* Heading */}
    <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
      Build Something
      <br />
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Extraordinary
      </span>
    </h1>

    {/* Description */}
    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
      Transform your ideas into reality with our powerful platform.
      Join thousands of creators building the future.
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button className="btn btn-primary btn-lg">
        Get Started
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
      <button className="btn btn-outline btn-lg">
        <Play className="mr-2 h-5 w-5" />
        Watch Demo
      </button>
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 INTERACTIVE COMPONENTS (Modals, Toasts, Badges)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODAL DIALOG:
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div
      onClick={() => setShowModal(false)}
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    />

    {/* Modal Content */}
    <div className="relative z-10 w-full max-w-lg mx-4 p-6 rounded-lg border border-border bg-card shadow-2xl animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Modal Title</h2>
        <button
          onClick={() => setShowModal(false)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <p className="text-muted-foreground mb-6">
        Modal content goes here. This is a production-ready modal with proper backdrop and animations.
      </p>
      <div className="flex items-center gap-3 justify-end">
        <button onClick={() => setShowModal(false)} className="btn btn-ghost">
          Cancel
        </button>
        <button onClick={handleConfirm} className="btn btn-primary">
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

TOAST NOTIFICATION:
{toast && (
  <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up">
    <div className="p-4 rounded-lg border border-border bg-card shadow-lg flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-foreground">Success</p>
        <p className="text-sm text-muted-foreground">{toast.message}</p>
      </div>
      <button
        onClick={() => setToast(null)}
        className="p-1 rounded hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  </div>
)}

BADGES & STATUS INDICATORS:
{/* Status Badge */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
  Active
</span>

{/* Count Badge */}
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
  12
</span>

{/* Notification Dot */}
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
</span>

DROPDOWN MENU:
{dropdownOpen && (
  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg py-1 z-50 animate-fade-in">
    <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2">
      <User className="h-4 w-4" />
      Profile
    </button>
    <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2">
      <Settings className="h-4 w-4" />
      Settings
    </button>
    <div className="border-t border-border my-1"></div>
    <button className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2">
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  </div>
)}

LOADING STATES:
{/* Spinner */}
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
</div>

{/* Skeleton Loader */}
<div className="space-y-3">
  <div className="h-4 bg-muted rounded animate-pulse"></div>
  <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
  <div className="h-4 bg-muted rounded animate-pulse w-4/6"></div>
</div>

{/* Progress Bar */}
<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary transition-all duration-300"
    style={{ width: \`\${progress}%\` }}
  />
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 LOGO PATTERNS (Varied Designs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pattern #1 - Icon in Box + Text (Modern/Tech):
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-primary">
    <Zap className="h-6 w-6 text-primary-foreground" />
  </div>
  <span className="text-xl font-bold text-foreground">Brand Name</span>
</div>

Pattern #2 - Circular Icon + Text (Minimal/Clean):
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
    <Rocket className="h-5 w-5 text-primary-foreground" />
  </div>
  <span className="text-xl font-bold text-foreground">Brand</span>
</div>

Pattern #3 - Gradient Text (Bold/Startup):
<h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
  Brand Name
</h1>

BUTTON COMBINATIONS:

Button + Input (Search Bar):
<div className="flex gap-2">
  <input className="flex-1 px-4 py-2.5 rounded-lg border border-border" placeholder="Search..." />
  <button className="btn btn-primary px-6 py-2.5">Search</button>
</div>

Button Group (Form Actions):
<div className="flex items-center gap-3">
  <button className="btn btn-secondary">Cancel</button>
  <button className="btn btn-primary">Save Changes</button>
</div>

Icon Button (Tables/Cards):
<button className="p-2 rounded-lg hover:bg-muted transition-colors">
  <Edit className="h-4 w-4 text-muted-foreground" />
</button>

ANIMATION USAGE:

Staggered Card Grid:
{items.map((item, i) => (
  <div
    key={i}
    className="card card-padding card-hover animate-fade-in"
    style={{ animationDelay: \`\${i * 100}ms\` }}
  >
    <h3>{item.title}</h3>
  </div>
))}

Success Messages:
{success && (
  <div className="bg-success/10 border border-success rounded-lg p-4 animate-fade-in">
    <CheckCircle className="h-5 w-5 text-success inline mr-2" />
    <span className="text-success">Success!</span>
  </div>
)}

Hover Scale Effect:
<div className="card hover:scale-105 transition-transform duration-300">
  Interactive card content
</div>

CONTRAST-SAFE COLOR PAIRINGS:

✅ GOOD CONTRAST (Always Readable):
<div className="bg-background"><p className="text-foreground">Main content</p></div>
<div className="bg-secondary"><h2 className="text-foreground">Heading</h2></div>
<div className="bg-muted"><p className="text-foreground">Readable text</p></div>
<div className="bg-primary"><span className="text-primary-foreground">Button text</span></div>

❌ AVOID LOW CONTRAST (Hard to Read):
<div className="bg-secondary"><p className="text-muted-foreground">Grey on grey ❌</p></div>
<div className="bg-muted"><p className="text-muted-foreground">Too subtle ❌</p></div>

RULE: Use text-foreground for all main content. Only use text-muted-foreground
for truly secondary text on bg-background.

Build clean, modern UIs with these patterns. Combine freely.`;
}

/**
 * Chakra UI Component Catalog
 * ~75 tokens
 */
function getChakraUICatalog(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 CHAKRA UI COMPONENT CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMS:
Button, Checkbox, Input, NumberInput, PinInput, Radio,
RangeSlider, Select, Slider, Switch, Textarea

DATA DISPLAY:
Avatar, Badge, Card, Code, Divider, Kbd, List, Stat,
Table, Tag

FEEDBACK:
Alert, CircularProgress, Progress, Skeleton, Spinner,
Toast

OVERLAY:
AlertDialog, Drawer, Menu, Modal, Popover, Tooltip

DISCLOSURE:
Accordion, Tabs, VisuallyHidden

NAVIGATION:
Breadcrumb, Link, LinkOverlay, Stepper

LAYOUT:
AspectRatio, Box, Center, Container, Flex, Grid,
SimpleGrid, Stack, Wrap

USAGE:
import { Button, Modal, Input } from '@chakra-ui/react'

Choose components based on UI requirements.
`;
}

/**
 * Get component count for a design system
 * Useful for logging/debugging
 */
export function getComponentCount(designSystem: DesignSystemId): number {
  const catalog = getComponentCatalog(designSystem);
  // Count component names (rough estimate)
  const matches = catalog.match(/[A-Z][a-zA-Z]+/g);
  return matches ? new Set(matches).size : 0;
}

/**
 * Get token estimate for catalog
 * Should be ~75 tokens for any design system
 */
export function getCatalogTokenEstimate(designSystem: DesignSystemId): number {
  const catalog = getComponentCatalog(designSystem);
  // Rough token estimate: 4 chars per token
  return Math.ceil(catalog.length / 4);
}
