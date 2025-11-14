/**
 * Valid Lucide React Icons
 * Single source of truth for icon constraints
 */

export const VALID_LUCIDE_ICONS = [
  // Navigation
  'Menu', 'X', 'ChevronRight', 'ChevronDown', 'ChevronUp', 'ChevronLeft',
  'ArrowRight', 'ArrowLeft', 'Home',

  // Actions
  'Plus', 'Minus', 'Edit', 'Trash', 'Trash2', 'Save', 'Download', 'Upload',
  'Share2', 'Check',

  // Forms
  'Mail', 'Lock', 'User', 'Search', 'Eye', 'EyeOff', 'Calendar', 'Clock',

  // Status
  'CheckCircle', 'AlertCircle', 'Loader2', 'Info', 'XCircle',

  // Common
  'Heart', 'Star', 'Settings', 'Filter', 'Image', 'File', 'Zap', 'Folder',
  'Inbox', 'Play',

  // E-commerce (Note: Use Square for cart/bag icons - ShoppingCart/ShoppingBag are deprecated)
  'Square', 'CreditCard', 'Package', 'DollarSign',
  'Tag', 'Gift', 'Truck',

  // Social/Content
  'MessageCircle', 'Send', 'Bell', 'Users', 'LogOut', 'LogIn'
];

export const LUCIDE_ICON_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LUCIDE ICONS - CRITICAL IMPORT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 MANDATORY: Import EVERY icon you use in the file!
✅ Valid icons ONLY: ${VALID_LUCIDE_ICONS.slice(0, 20).join(', ')}, etc.

EXAMPLES:
✅ CORRECT:
import { Plus, Minus, Check, X } from 'lucide-react'
<Plus className="h-4 w-4" />
<Check className="h-5 w-5" />

❌ WRONG (Missing imports):
import { X } from 'lucide-react'  // Missing Plus!
<Plus className="h-4 w-4" />      // ❌ NOT IMPORTED = BUILD ERROR

🚨 CRITICAL CONSTRAINTS:
1. Import EVERY icon you reference in JSX
2. ONLY use icons from this list: ${VALID_LUCIDE_ICONS.join(', ')}
3. DO NOT invent icon names (CartItem, ProductIcon, BlogIcon, ShoppingCart, ShoppingBag, etc.)
4. For shopping/cart features, use: Square, Package, or CreditCard
5. lucide-react exports icons ONLY (no types like Product, BlogPost, FormData)
6. Never import interface names from lucide-react
7. ShoppingCart and ShoppingBag are DEPRECATED - use Square instead

❌ WRONG: import { ShoppingCart } from 'lucide-react'  // DEPRECATED!
✅ CORRECT: import { Square } from 'lucide-react'

BUILD WILL FAIL if you use icons without importing them!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
