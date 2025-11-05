'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Code2,
  AlertCircle,
  Edit,
  Rocket,
  CreditCard,
  DollarSign,
  Users,
  Key,
  Brain,
  Settings,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Palette,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Workflow Health',
    href: '/admin/workflow-health',
    icon: Activity,
    children: [
      {
        title: 'App Generation',
        href: '/admin/workflow-health/app-generation',
        icon: Code2,
      },
      {
        title: 'Validation',
        href: '/admin/workflow-health/validation',
        icon: AlertCircle,
      },
      {
        title: 'Editor',
        href: '/admin/workflow-health/editor',
        icon: Edit,
      },
      {
        title: 'Deployment',
        href: '/admin/workflow-health/deployment',
        icon: Rocket,
      },
    ],
  },
  {
    title: 'Credits',
    href: '/admin/credits',
    icon: CreditCard,
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: DollarSign,
  },
  {
    title: 'Pricing',
    href: '/admin/pricing',
    icon: DollarSign,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
  },
  {
    title: 'AI Config',
    href: '/admin/ai-config',
    icon: Brain,
  },
  {
    title: 'LLM Test',
    href: '/admin/llm',
    icon: MessageSquare,
  },
  {
    title: 'Design System',
    href: '/admin/design-system',
    icon: Palette,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border-light bg-background-raised">
      <div className="flex h-16 items-center px-6 border-b border-border-light">
        <h2 className="text-xl font-bold text-text-primary">Admin Panel</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-border-light p-4">
        <Link
          href="/"
          className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to Site
        </Link>
      </div>
    </div>
  );
}

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children?.some(child => pathname === child.href);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive || isChildActive
            ? 'bg-brand-primary-subtle text-brand-primary border border-border-light'
            : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.title}</span>
        {hasChildren && (
          (isActive || isChildActive) ?
            <ChevronDown className="h-4 w-4" /> :
            <ChevronRight className="h-4 w-4" />
        )}
      </Link>

      {hasChildren && (isActive || isChildActive) && (
        <ul className="ml-6 mt-1 space-y-1 border-l border-border-light pl-4">
          {item.children!.map((child) => {
            const ChildIcon = child.icon;
            const isChildItemActive = pathname === child.href;

            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isChildItemActive
                      ? 'bg-brand-primary-subtle text-brand-primary border border-border-light'
                      : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
