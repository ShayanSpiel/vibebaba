/**
 * Component Catalog System - MINIMAL VERSION
 * Provides concise component reference for AI
 * Philosophy: List what's available, AI builds with Tailwind
 */

import type { DesignSystemId } from '@/lib/design-systems/index';

export function getComponentCatalog(designSystem: DesignSystemId): string {
  switch (designSystem) {
    case 'ant-design':
      return getAntDesignCatalog();
    case 'tailwind-shadcn':
    case 'v0-inspired':
    case 'enhanced-2025':
    default:
      return getTailwindShadcnCatalog();
  }
}

function getAntDesignCatalog(): string {
  return `ANT DESIGN COMPONENTS:

DATA ENTRY: Button, Checkbox, DatePicker, Form, Input, Radio, Select, Slider, Switch, Upload
DATA DISPLAY: Avatar, Badge, Card, Carousel, List, Table, Tabs, Tag, Tooltip
FEEDBACK: Alert, Message, Modal, Notification, Progress, Spin
LAYOUT: Divider, Grid, Layout, Space
NAVIGATION: Breadcrumb, Dropdown, Menu, Pagination, Steps

import { Button, Modal, Input } from 'antd'
`;
}

function getTailwindShadcnCatalog(): string {
  return `TAILWIND UTILITIES (globals.css):

BUTTONS: btn btn-primary, btn btn-outline, btn btn-ghost (sizes: btn-sm, btn-lg)
CARDS: card card-padding card-hover
SPACING: section, container, p-4, p-6, p-8, gap-4, gap-6
TYPOGRAPHY: text-h1, text-h2, text-h3, text-body
ANIMATIONS: animate-fade-in, animate-slide-up, transition-all

DESIGN TOKENS:
Colors: bg-background, text-foreground, bg-primary, text-primary-foreground, bg-muted, text-muted-foreground
Borders: border-border, rounded-lg, rounded-md
Effects: hover:opacity-90, hover:bg-muted, active:scale-95

ICONS (lucide-react):
Navigation: Menu, X, ChevronRight, ChevronDown, ChevronLeft, ArrowRight, ArrowLeft, Home
Actions: Plus, Minus, Edit, Trash, Save, Check, Loader2
Forms: Mail, Lock, User, Search, Eye, EyeOff, Calendar, Clock
Status: CheckCircle, AlertCircle, Info, XCircle
Common: Heart, Star, Settings, Filter, Zap, Folder, Inbox, Play

PATTERNS (build inline with Tailwind):
Forms: label + input with border-border, focus:ring-2 focus:ring-primary
Buttons: bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90
Cards: rounded-lg border border-border bg-card p-6 shadow-sm
Modals: fixed inset-0 z-50, overlay bg-black/50, content bg-card rounded-lg p-6
Navigation: sticky top-0 z-50 border-b border-border bg-background
Hero: py-24 text-center with gradient text (bg-gradient-to-r from-primary to-accent bg-clip-text)

Use className utilities directly - all patterns available through Tailwind + globals.css
`;
}

export function getCatalogTokenEstimate(designSystem: DesignSystemId): number {
  const catalog = getComponentCatalog(designSystem);
  return Math.ceil(catalog.length / 4); // Rough estimate: 4 chars per token
}
