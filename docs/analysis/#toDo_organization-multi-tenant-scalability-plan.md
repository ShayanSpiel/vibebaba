# #notDone Organization-Centric Multi-Tenant Scalability Plan

**Date:** January 2025
**Status:** 🔴 Not Implemented - Analysis & Design Complete
**Priority:** HIGH - Required for Enterprise Scale

---

## 📋 Executive Summary

This document outlines the complete architectural refactor needed to transform VibeCoding from a **single-tenant, flat architecture** to a **multi-tenant, organization-centric, plugin-based platform** that can support:

- Multiple engines (Product, Marketing, Analytics, Custom)
- Dynamic node workflows
- Unlimited tool integrations
- Team collaboration
- Horizontal scalability

**Current State:** Single user → projects (flat)
**Target State:** Organizations → Workspaces → Projects (hierarchical, multi-tenant)

---

## 🚨 Current Architecture Problems

### 1. Single-Tenant Architecture
**Problem:** All users share the same database instance with no isolation boundaries.

```typescript
// CURRENT: Flat structure
User → Projects → Files
     └─ Credits (individual)
     └─ No team collaboration
```

**Issues:**
- User A's data mixed with User B's data
- No isolation boundary for "heavy" customers
- Cannot move enterprise customers to dedicated infrastructure
- No team/organization concept

### 2. No Organization/Workspace Concept
**Problem:** Direct user → project relationship prevents team collaboration.

```typescript
// CURRENT: lib/pocketbase.ts (lines 48-111)
export interface User {
  id: string;
  email: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  // No organization field!
}

export interface Project {
  id: string;
  userId: string; // Direct user ownership only
  name: string;
  description: string;
  // No workspace or org context!
}
```

### 3. Flat Credit System
**Problem:** Credits stored directly on user record, no team pooling.

```typescript
// CURRENT: lib/credits.ts (lines 45-56)
export interface UserCredits {
  id: string;
  userId: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  // Individual only - no org credit pool!
}
```

### 4. Hard-Coded Node Types
**Problem:** LangGraph workflow has fixed nodes, cannot add new engines.

```typescript
// CURRENT: lib/langgraph/workflow.ts (lines 6-13)
import {
  founderNode,
  pmNode,
  uxNode,
  backendNode,
  qaNode,
  devopsNode
} from './nodes';
// Fixed nodes - no marketing, analytics, or custom nodes!

// CURRENT: workflow.ts (lines 142-149)
workflow.addNode('founder', withErrorRecovery('founder', founderNode));
workflow.addNode('pm', withErrorRecovery('pm', pmNode));
workflow.addNode('ux', withErrorRecovery('ux', uxNode));
workflow.addNode('frontend', withErrorRecovery('frontend', frontendRouter));
workflow.addNode('backend', withErrorRecovery('backend', backendNode));
workflow.addNode('qa', withErrorRecovery('qa', qaNode));
workflow.addNode('devops', withErrorRecovery('devops', devopsNode));
// Hardcoded workflow - cannot customize per engine type!
```

### 5. No Multi-Tenancy Support
**Problem:** Single PocketBase instance, vertical scaling only.

```typescript
// CURRENT: lib/pocketbase.ts (lines 1-9)
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
export const pb = new PocketBase(PB_URL);
// Single instance for all users!
```

### 6. No Integration Framework
**Problem:** No way to connect external tools at organization level.

```typescript
// MISSING: No integrations table
// MISSING: No way to store org-level API keys
// MISSING: No way for nodes to access integrations
```

---

## ✅ Proposed Architecture: Organization-Centric Multi-Tenant

### Conceptual Hierarchy

```
Organization
├── Settings
│   ├── Enabled Engines: [Product, Marketing, Analytics]
│   ├── Branding (colors, logo, custom domain)
│   └── Billing (plan, subscription status)
├── Billing
│   ├── Subscription Plan (Free, Starter, Pro, Enterprise)
│   ├── Credits Pool (shared across org)
│   └── Payment Method
├── Members
│   ├── User 1 (Owner) - Full access
│   ├── User 2 (Admin) - Manage members, billing
│   ├── User 3 (Member) - Create projects
│   └── User 4 (Viewer) - Read-only
├── Integrations (Org-level)
│   ├── Google Analytics
│   ├── Stripe
│   ├── Slack
│   ├── Zapier
│   └── Custom APIs
├── Workspaces
│   ├── Workspace: "Marketing Campaigns"
│   │   ├── Engine Type: Marketing
│   │   ├── Enabled Nodes: [MarketingAnalyzer, SEOOptimizer, AdGenerator]
│   │   ├── Projects: [Q1 Campaign, Black Friday, Brand Launch]
│   │   └── Members: [User 1, User 3]
│   └── Workspace: "Product Development"
│       ├── Engine Type: Product
│       ├── Enabled Nodes: [PM, UX, Frontend, Backend, QA, DevOps]
│       ├── Projects: [Admin Dashboard, Mobile App, Landing Page]
│       └── Members: [User 1, User 2, User 3]
└── Node Registry (Custom Nodes)
    ├── Custom Node: "Brand Voice Checker"
    └── Custom Node: "A/B Test Generator"
```

---

## 🗄️ New Database Schema

### 1. `organizations` Collection

**Purpose:** Top-level tenant for multi-tenancy

```typescript
interface Organization {
  id: string;

  // Identity
  name: string; // "VibeCoding Corp"
  slug: string; // "vibecoding-corp" (unique, URL-safe)
  logo?: string; // file reference

  // Subscription & Billing
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  billingEmail: string;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'cancelled';
  subscriptionExpiry: string; // ISO date
  stripeCustomerId?: string;

  // Credits Pool (shared across organization)
  totalCredits: number; // Total purchased credits
  usedCredits: number; // Credits consumed
  monthlyCredits: number; // Monthly allowance from plan
  lastCreditReset: string; // Last monthly reset

  // Enabled Features
  enabledEngines: string[]; // ['product', 'marketing', 'analytics']
  enabledIntegrations: string[]; // ['google-analytics', 'stripe', 'slack']

  // Settings
  settings: {
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
    };
    aiPreferences?: {
      defaultModel?: string;
      temperature?: number;
    };
    security?: {
      requireTwoFactor?: boolean;
      allowedEmailDomains?: string[];
    };
  };

  // Ownership
  ownerId: string; // relation → users (original creator)

  // Metadata
  created: string;
  updated: string;
}
```

**PocketBase Schema:**
```javascript
// Create via PocketBase Admin UI or migration script
{
  name: 'organizations',
  type: 'base',
  schema: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'logo', type: 'file', maxSelect: 1, maxSize: 5242880 },
    { name: 'plan', type: 'select', required: true, options: ['free', 'starter', 'pro', 'enterprise'] },
    { name: 'billingEmail', type: 'email', required: true },
    { name: 'subscriptionStatus', type: 'select', options: ['active', 'trial', 'expired', 'cancelled'] },
    { name: 'subscriptionExpiry', type: 'date' },
    { name: 'stripeCustomerId', type: 'text' },
    { name: 'totalCredits', type: 'number', required: true, default: 0 },
    { name: 'usedCredits', type: 'number', required: true, default: 0 },
    { name: 'monthlyCredits', type: 'number', required: true, default: 0 },
    { name: 'lastCreditReset', type: 'date' },
    { name: 'enabledEngines', type: 'json' },
    { name: 'enabledIntegrations', type: 'json' },
    { name: 'settings', type: 'json' },
    { name: 'ownerId', type: 'relation', collection: 'users', required: true }
  ],
  indexes: ['slug', 'ownerId'],
  listRule: '@request.auth.id != "" && @request.auth.id ?= ownerId',
  viewRule: '@request.auth.id != "" && @request.auth.id ?= ownerId',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id = ownerId',
  deleteRule: '@request.auth.id = ownerId'
}
```

---

### 2. `org_members` Collection

**Purpose:** User membership within organizations with roles & permissions

```typescript
interface OrgMember {
  id: string;

  // Relationships
  organizationId: string; // relation → organizations
  userId: string; // relation → users

  // Role & Permissions
  role: 'owner' | 'admin' | 'member' | 'viewer';

  permissions: {
    // Project Management
    canCreateProjects: boolean;
    canDeleteProjects: boolean;
    canInviteMembers: boolean;

    // Billing & Admin
    canManageBilling: boolean;
    canManageIntegrations: boolean;
    canManageWorkspaces: boolean;

    // Advanced
    canCreateCustomNodes: boolean;
    canManageWorkflows: boolean;
  };

  // Credit Allocation (optional personal quota within org)
  personalCreditQuota?: number; // null = unlimited (uses org pool)
  personalCreditsUsed: number;

  // Invitation tracking
  invitedBy: string; // userId who sent invite
  invitedAt: string;
  inviteAccepted: boolean;

  // Metadata
  joined: string;
  lastActive?: string;
}
```

**PocketBase Schema:**
```javascript
{
  name: 'org_members',
  type: 'base',
  schema: [
    { name: 'organizationId', type: 'relation', collection: 'organizations', required: true, cascadeDelete: true },
    { name: 'userId', type: 'relation', collection: 'users', required: true },
    { name: 'role', type: 'select', required: true, options: ['owner', 'admin', 'member', 'viewer'] },
    { name: 'permissions', type: 'json', required: true },
    { name: 'personalCreditQuota', type: 'number' },
    { name: 'personalCreditsUsed', type: 'number', default: 0 },
    { name: 'invitedBy', type: 'relation', collection: 'users' },
    { name: 'invitedAt', type: 'date' },
    { name: 'inviteAccepted', type: 'bool', default: false },
    { name: 'joined', type: 'date' },
    { name: 'lastActive', type: 'date' }
  ],
  indexes: ['organizationId', 'userId', 'organizationId+userId'],
  listRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  viewRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  createRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canInviteMembers = true',
  updateRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && (role = "owner" || role = "admin")',
  deleteRule: 'organizationId.ownerId = @request.auth.id || userId = @request.auth.id'
}
```

**Default Permissions by Role:**
```typescript
const ROLE_PERMISSIONS = {
  owner: {
    canCreateProjects: true,
    canDeleteProjects: true,
    canInviteMembers: true,
    canManageBilling: true,
    canManageIntegrations: true,
    canManageWorkspaces: true,
    canCreateCustomNodes: true,
    canManageWorkflows: true
  },
  admin: {
    canCreateProjects: true,
    canDeleteProjects: true,
    canInviteMembers: true,
    canManageBilling: false,
    canManageIntegrations: true,
    canManageWorkspaces: true,
    canCreateCustomNodes: true,
    canManageWorkflows: true
  },
  member: {
    canCreateProjects: true,
    canDeleteProjects: false,
    canInviteMembers: false,
    canManageBilling: false,
    canManageIntegrations: false,
    canManageWorkspaces: false,
    canCreateCustomNodes: false,
    canManageWorkflows: false
  },
  viewer: {
    canCreateProjects: false,
    canDeleteProjects: false,
    canInviteMembers: false,
    canManageBilling: false,
    canManageIntegrations: false,
    canManageWorkspaces: false,
    canCreateCustomNodes: false,
    canManageWorkflows: false
  }
};
```

---

### 3. `workspaces` Collection

**Purpose:** Engine-specific workspaces within organizations (Product, Marketing, Analytics)

```typescript
interface Workspace {
  id: string;

  // Ownership
  organizationId: string; // relation → organizations

  // Identity
  name: string; // "Marketing Campaigns", "Product Development"
  description: string;
  icon?: string; // emoji or icon name
  color?: string; // hex color for UI

  // Engine Configuration
  engineType: 'product' | 'marketing' | 'analytics' | 'custom';

  // Enabled Nodes/Tools for this workspace
  enabledNodes: string[]; // ['pm', 'ux', 'frontend'] or ['seo', 'ad-copy', 'analytics']

  // Node Configuration (per workspace)
  nodeConfigurations: {
    [nodeId: string]: {
      modelPreference?: string; // Override org default
      customPrompts?: object;
      integrations?: string[]; // Which integrations this node can use
      estimatedCredits?: number;
    };
  };

  // Default Workflow
  defaultWorkflowId?: string; // relation → workflows

  // Access Control
  memberIds: string[]; // relations → org_members (can be subset of org members)

  // Settings
  settings: {
    autoDeployEnabled?: boolean;
    requireApproval?: boolean; // Require approval before deploy
    notificationsChannel?: string; // Slack channel for notifications
  };

  // Metadata
  projectCount: number; // cached count
  totalCreditsUsed: number; // workspace-level tracking

  created: string;
  updated: string;
  createdBy: string; // userId
}
```

**PocketBase Schema:**
```javascript
{
  name: 'workspaces',
  type: 'base',
  schema: [
    { name: 'organizationId', type: 'relation', collection: 'organizations', required: true, cascadeDelete: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'color', type: 'text' },
    { name: 'engineType', type: 'select', required: true, options: ['product', 'marketing', 'analytics', 'custom'] },
    { name: 'enabledNodes', type: 'json', required: true },
    { name: 'nodeConfigurations', type: 'json' },
    { name: 'defaultWorkflowId', type: 'relation', collection: 'workflows' },
    { name: 'memberIds', type: 'json' },
    { name: 'settings', type: 'json' },
    { name: 'projectCount', type: 'number', default: 0 },
    { name: 'totalCreditsUsed', type: 'number', default: 0 },
    { name: 'createdBy', type: 'relation', collection: 'users', required: true }
  ],
  indexes: ['organizationId', 'engineType'],
  listRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  viewRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  createRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageWorkspaces = true',
  updateRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageWorkspaces = true',
  deleteRule: 'organizationId.ownerId = @request.auth.id'
}
```

**Engine Templates:**
```typescript
const ENGINE_TEMPLATES = {
  product: {
    name: 'Product Development',
    icon: '🛠️',
    color: '#3b82f6',
    description: 'Build web applications, dashboards, and prototypes',
    enabledNodes: ['founder', 'pm', 'ux', 'frontend', 'backend', 'qa', 'devops'],
    defaultWorkflow: 'standard-product-flow',
    recommendedIntegrations: ['github', 'figma', 'jira']
  },
  marketing: {
    name: 'Marketing Campaigns',
    icon: '📢',
    color: '#ec4899',
    description: 'Create landing pages, ad copy, and marketing content',
    enabledNodes: ['marketing-analyzer', 'seo-optimizer', 'ad-generator', 'landing-page-builder', 'email-campaign-builder'],
    defaultWorkflow: 'marketing-campaign-flow',
    recommendedIntegrations: ['google-analytics', 'google-ads', 'mailchimp', 'hubspot']
  },
  analytics: {
    name: 'Data Analytics',
    icon: '📊',
    color: '#10b981',
    description: 'Build dashboards, reports, and data visualizations',
    enabledNodes: ['data-analyzer', 'chart-builder', 'report-generator', 'dashboard-builder'],
    defaultWorkflow: 'analytics-flow',
    recommendedIntegrations: ['google-analytics', 'mixpanel', 'amplitude', 'tableau']
  },
  custom: {
    name: 'Custom Workspace',
    icon: '⚙️',
    color: '#6366f1',
    description: 'Build your own custom workflow',
    enabledNodes: [], // User selects from node registry
    defaultWorkflow: null,
    recommendedIntegrations: []
  }
};
```

---

### 4. `projects` Collection (Updated)

**Purpose:** Projects now belong to workspaces within organizations

```typescript
interface Project {
  id: string;

  // NEW: Organizational Hierarchy
  organizationId: string; // relation → organizations
  workspaceId: string; // relation → workspaces
  createdBy: string; // userId

  // Identity
  name: string;
  description: string;

  // Stage & Status
  stage: 'planning' | 'building' | 'completed' | 'error';
  status: 'draft' | 'in_progress' | 'review' | 'deployed';

  // Engine-specific data
  engineType: 'product' | 'marketing' | 'analytics';

  // Workflow State
  workflowId?: string; // relation → workflows (which workflow is running)
  currentNodeId?: string; // Current node in workflow
  plan?: string;
  context?: any;
  backendConfig?: any;

  // Deployed Output
  deployUrl?: string;
  thumbnail?: string;

  // Credit Tracking
  creditsUsed: number;
  estimatedCredits?: number; // Estimated at start

  // Collaboration
  assignedTo?: string[]; // userIds
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  // Metadata
  created: string;
  updated: string;
  completedAt?: string;
}
```

**PocketBase Schema:**
```javascript
{
  name: 'projects',
  type: 'base',
  schema: [
    { name: 'organizationId', type: 'relation', collection: 'organizations', required: true, cascadeDelete: true },
    { name: 'workspaceId', type: 'relation', collection: 'workspaces', required: true, cascadeDelete: true },
    { name: 'createdBy', type: 'relation', collection: 'users', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text', required: true },
    { name: 'stage', type: 'select', required: true, options: ['planning', 'building', 'completed', 'error'] },
    { name: 'status', type: 'select', options: ['draft', 'in_progress', 'review', 'deployed'] },
    { name: 'engineType', type: 'select', required: true, options: ['product', 'marketing', 'analytics'] },
    { name: 'workflowId', type: 'relation', collection: 'workflows' },
    { name: 'currentNodeId', type: 'text' },
    { name: 'plan', type: 'text' },
    { name: 'context', type: 'json' },
    { name: 'backendConfig', type: 'json' },
    { name: 'deployUrl', type: 'url' },
    { name: 'thumbnail', type: 'file', maxSelect: 1 },
    { name: 'creditsUsed', type: 'number', default: 0 },
    { name: 'estimatedCredits', type: 'number' },
    { name: 'assignedTo', type: 'json' },
    { name: 'tags', type: 'json' },
    { name: 'priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { name: 'completedAt', type: 'date' }
  ],
  indexes: ['organizationId', 'workspaceId', 'createdBy', 'stage'],
  listRule: 'workspaceId.organizationId.@collection.org_members.userId ?= @request.auth.id',
  viewRule: 'workspaceId.organizationId.@collection.org_members.userId ?= @request.auth.id',
  createRule: 'workspaceId.organizationId.@collection.org_members.userId ?= @request.auth.id && workspaceId.organizationId.@collection.org_members.permissions.canCreateProjects = true',
  updateRule: 'workspaceId.organizationId.@collection.org_members.userId ?= @request.auth.id',
  deleteRule: 'workspaceId.organizationId.@collection.org_members.userId ?= @request.auth.id && (workspaceId.organizationId.@collection.org_members.permissions.canDeleteProjects = true || createdBy = @request.auth.id)'
}
```

---

### 5. `integrations` Collection

**Purpose:** Organization-level tool integrations (Google Analytics, Stripe, Slack, etc.)

```typescript
interface Integration {
  id: string;

  // Ownership
  organizationId: string; // relation → organizations

  // Integration Identity
  provider: 'google-analytics' | 'google-ads' | 'stripe' | 'slack' | 'zapier' |
            'hubspot' | 'mailchimp' | 'github' | 'figma' | 'jira' | 'custom';
  name: string; // Display name
  description?: string;
  icon?: string; // URL to provider icon

  // Status
  status: 'active' | 'pending' | 'error' | 'disabled';
  errorMessage?: string;

  // OAuth/API Keys (encrypted in PocketBase)
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    webhookSecret?: string;
    accountId?: string; // Provider-specific account ID
  };

  // Configuration (provider-specific settings)
  settings: {
    [key: string]: any;
    // Examples:
    // - Google Analytics: { propertyId: 'GA-XXXXX', viewId: 'YYYYY' }
    // - Slack: { channelId: 'C12345', teamId: 'T67890' }
    // - Stripe: { publishableKey: 'pk_live_...' }
  };

  // Scopes & Permissions (what this integration can do)
  scopes: string[]; // OAuth scopes granted

  // Usage Tracking
  lastUsed?: string;
  usageCount: number;
  lastSyncedAt?: string;

  // Metadata
  installedBy: string; // userId who installed
  created: string;
  updated: string;
}
```

**PocketBase Schema:**
```javascript
{
  name: 'integrations',
  type: 'base',
  schema: [
    { name: 'organizationId', type: 'relation', collection: 'organizations', required: true, cascadeDelete: true },
    { name: 'provider', type: 'select', required: true, options: [
      'google-analytics', 'google-ads', 'stripe', 'slack', 'zapier',
      'hubspot', 'mailchimp', 'github', 'figma', 'jira', 'custom'
    ]},
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'url' },
    { name: 'status', type: 'select', required: true, options: ['active', 'pending', 'error', 'disabled'] },
    { name: 'errorMessage', type: 'text' },
    { name: 'credentials', type: 'json', required: true }, // Encrypted by PocketBase
    { name: 'settings', type: 'json' },
    { name: 'scopes', type: 'json' },
    { name: 'lastUsed', type: 'date' },
    { name: 'usageCount', type: 'number', default: 0 },
    { name: 'lastSyncedAt', type: 'date' },
    { name: 'installedBy', type: 'relation', collection: 'users', required: true }
  ],
  indexes: ['organizationId', 'provider', 'status'],
  listRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  viewRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id',
  createRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageIntegrations = true',
  updateRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageIntegrations = true',
  deleteRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageIntegrations = true'
}
```

**Integration Provider Definitions:**
```typescript
const INTEGRATION_PROVIDERS = {
  'google-analytics': {
    name: 'Google Analytics',
    icon: 'https://www.google.com/analytics/images/analytics-icon.svg',
    description: 'Track website traffic and user behavior',
    authType: 'oauth2',
    scopes: ['analytics.readonly', 'analytics.edit'],
    requiredCredentials: ['accessToken', 'refreshToken'],
    settingsSchema: {
      propertyId: { type: 'string', required: true, label: 'Property ID' },
      viewId: { type: 'string', required: true, label: 'View ID' }
    }
  },
  'google-ads': {
    name: 'Google Ads',
    icon: 'https://www.google.com/ads/images/ads-icon.svg',
    description: 'Create and manage ad campaigns',
    authType: 'oauth2',
    scopes: ['adwords'],
    requiredCredentials: ['accessToken', 'refreshToken', 'clientId'],
    settingsSchema: {
      customerId: { type: 'string', required: true, label: 'Customer ID' }
    }
  },
  'stripe': {
    name: 'Stripe',
    icon: 'https://stripe.com/img/v3/home/social.png',
    description: 'Accept payments and manage subscriptions',
    authType: 'api_key',
    requiredCredentials: ['apiKey', 'publishableKey'],
    settingsSchema: {
      webhookSecret: { type: 'string', required: false, label: 'Webhook Secret' }
    }
  },
  'slack': {
    name: 'Slack',
    icon: 'https://slack.com/favicon.ico',
    description: 'Send notifications to Slack channels',
    authType: 'oauth2',
    scopes: ['chat:write', 'channels:read'],
    requiredCredentials: ['accessToken'],
    settingsSchema: {
      channelId: { type: 'string', required: true, label: 'Channel ID' },
      teamId: { type: 'string', required: true, label: 'Team ID' }
    }
  },
  // Add more providers...
};
```

---

### 6. `node_registry` Collection

**Purpose:** Dynamic node definitions (Product nodes, Marketing nodes, Custom nodes)

```typescript
interface NodeRegistry {
  id: string;

  // Node Identity
  nodeId: string; // Unique identifier: 'pm', 'seo-optimizer', 'ad-generator'
  name: string; // Display name: "Product Manager", "SEO Optimizer"
  description: string;
  category: 'product' | 'marketing' | 'analytics' | 'custom';
  icon?: string; // Emoji or icon name

  // Node Behavior
  systemPrompt: string; // LLM prompt for this node
  inputSchema: object; // JSON schema for expected inputs
  outputSchema: object; // JSON schema for outputs

  // Execution Configuration
  defaultModel: string; // 'gpt-4', 'claude-3-sonnet', etc.
  temperature?: number;
  maxTokens?: number;
  estimatedCredits: number; // Estimated cost per run

  // Node Type
  nodeType: 'agent' | 'tool' | 'human' | 'router';

  // Dependencies
  requiredPreviousNodes: string[]; // Must run after these nodes
  compatibleNextNodes: string[]; // Can be followed by these nodes
  requiredIntegrations?: string[]; // Requires these integrations

  // Code/Implementation (for custom nodes)
  implementationCode?: string; // TypeScript code for custom nodes

  // Availability
  isPublic: boolean; // Available to all orgs
  createdByOrgId?: string; // If custom org node

  // Versioning
  version: string; // Semantic version
  isActive: boolean;
  isDeprecated: boolean;
  replacedBy?: string; // nodeId of replacement

  // Usage Stats
  usageCount: number;
  averageExecutionTime?: number; // milliseconds
  averageCreditsUsed?: number;

  // Metadata
  tags: string[];
  createdBy: string; // userId
  created: string;
  updated: string;
}
```

**PocketBase Schema:**
```javascript
{
  name: 'node_registry',
  type: 'base',
  schema: [
    { name: 'nodeId', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text', required: true },
    { name: 'category', type: 'select', required: true, options: ['product', 'marketing', 'analytics', 'custom'] },
    { name: 'icon', type: 'text' },
    { name: 'systemPrompt', type: 'text', required: true },
    { name: 'inputSchema', type: 'json', required: true },
    { name: 'outputSchema', type: 'json', required: true },
    { name: 'defaultModel', type: 'text', required: true },
    { name: 'temperature', type: 'number' },
    { name: 'maxTokens', type: 'number' },
    { name: 'estimatedCredits', type: 'number', required: true },
    { name: 'nodeType', type: 'select', required: true, options: ['agent', 'tool', 'human', 'router'] },
    { name: 'requiredPreviousNodes', type: 'json' },
    { name: 'compatibleNextNodes', type: 'json' },
    { name: 'requiredIntegrations', type: 'json' },
    { name: 'implementationCode', type: 'text' },
    { name: 'isPublic', type: 'bool', default: true },
    { name: 'createdByOrgId', type: 'relation', collection: 'organizations' },
    { name: 'version', type: 'text', required: true },
    { name: 'isActive', type: 'bool', default: true },
    { name: 'isDeprecated', type: 'bool', default: false },
    { name: 'replacedBy', type: 'text' },
    { name: 'usageCount', type: 'number', default: 0 },
    { name: 'averageExecutionTime', type: 'number' },
    { name: 'averageCreditsUsed', type: 'number' },
    { name: 'tags', type: 'json' },
    { name: 'createdBy', type: 'relation', collection: 'users', required: true }
  ],
  indexes: ['nodeId', 'category', 'isActive', 'isPublic'],
  listRule: 'isPublic = true || createdByOrgId.@collection.org_members.userId ?= @request.auth.id',
  viewRule: 'isPublic = true || createdByOrgId.@collection.org_members.userId ?= @request.auth.id',
  createRule: '@request.auth.id != "" && (@request.data.isPublic = false || @request.auth.role = "admin")',
  updateRule: 'createdBy = @request.auth.id || @request.auth.role = "admin"',
  deleteRule: 'createdBy = @request.auth.id || @request.auth.role = "admin"'
}
```

**Example Node Definitions:**

```typescript
// Product Nodes (existing)
const PRODUCT_NODES: NodeRegistry[] = [
  {
    nodeId: 'pm',
    name: 'Product Manager',
    description: 'Refines requirements and creates product specifications',
    category: 'product',
    icon: '📋',
    systemPrompt: 'You are an expert Product Manager...',
    inputSchema: {
      type: 'object',
      properties: {
        userDescription: { type: 'string' },
        refinedRequirements: { type: 'string' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string' },
        context: { type: 'object' }
      }
    },
    defaultModel: 'gpt-4',
    estimatedCredits: 500,
    nodeType: 'agent',
    requiredPreviousNodes: ['founder'],
    compatibleNextNodes: ['ux', 'backend'],
    isPublic: true,
    version: '1.0.0',
    isActive: true,
    isDeprecated: false,
    usageCount: 0
  },

  // Marketing Nodes (new!)
  {
    nodeId: 'marketing-analyzer',
    name: 'Marketing Analyzer',
    description: 'Analyzes market trends and competitor landscape',
    category: 'marketing',
    icon: '📊',
    systemPrompt: 'You are an expert Marketing Analyst specializing in market research and competitor analysis...',
    inputSchema: {
      type: 'object',
      properties: {
        productDescription: { type: 'string' },
        targetAudience: { type: 'string' },
        competitors: { type: 'array', items: { type: 'string' } }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        marketAnalysis: { type: 'string' },
        targetPersonas: { type: 'array' },
        positioningStrategy: { type: 'string' }
      }
    },
    defaultModel: 'gpt-4',
    estimatedCredits: 600,
    nodeType: 'agent',
    requiredIntegrations: ['google-analytics'],
    compatibleNextNodes: ['seo-optimizer', 'ad-generator'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  },

  {
    nodeId: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Optimizes content for search engines',
    category: 'marketing',
    icon: '🔍',
    systemPrompt: 'You are an SEO expert specializing in on-page optimization...',
    inputSchema: {
      type: 'object',
      properties: {
        keywords: { type: 'array', items: { type: 'string' } },
        content: { type: 'string' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        optimizedContent: { type: 'string' },
        metaTags: { type: 'object' },
        recommendations: { type: 'array' }
      }
    },
    defaultModel: 'gpt-4',
    estimatedCredits: 400,
    nodeType: 'agent',
    requiredPreviousNodes: ['marketing-analyzer'],
    compatibleNextNodes: ['landing-page-builder'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  },

  {
    nodeId: 'ad-generator',
    name: 'Ad Copy Generator',
    description: 'Creates compelling ad copy for various platforms',
    category: 'marketing',
    icon: '📢',
    systemPrompt: 'You are an expert copywriter specializing in advertising...',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['google-ads', 'facebook', 'instagram', 'linkedin'] },
        targetAudience: { type: 'string' },
        productInfo: { type: 'object' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        headlines: { type: 'array', items: { type: 'string' } },
        descriptions: { type: 'array', items: { type: 'string' } },
        callToActions: { type: 'array', items: { type: 'string' } }
      }
    },
    defaultModel: 'gpt-4',
    estimatedCredits: 350,
    nodeType: 'agent',
    requiredPreviousNodes: ['marketing-analyzer'],
    requiredIntegrations: ['google-ads'],
    compatibleNextNodes: ['landing-page-builder'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  },

  {
    nodeId: 'landing-page-builder',
    name: 'Landing Page Builder',
    description: 'Builds high-converting landing pages',
    category: 'marketing',
    icon: '🎯',
    systemPrompt: 'You are an expert landing page designer and conversion optimizer...',
    inputSchema: {
      type: 'object',
      properties: {
        adCopy: { type: 'object' },
        optimizedContent: { type: 'string' },
        targetAudience: { type: 'string' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' },
        conversionElements: { type: 'array' },
        abTestVariants: { type: 'array' }
      }
    },
    defaultModel: 'gpt-4',
    estimatedCredits: 800,
    nodeType: 'agent',
    requiredPreviousNodes: ['seo-optimizer', 'ad-generator'],
    compatibleNextNodes: ['qa'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  }
];

// Analytics Nodes (new!)
const ANALYTICS_NODES: NodeRegistry[] = [
  {
    nodeId: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes data and identifies patterns',
    category: 'analytics',
    icon: '📈',
    systemPrompt: 'You are a data analyst expert...',
    defaultModel: 'gpt-4',
    estimatedCredits: 500,
    nodeType: 'agent',
    requiredIntegrations: ['google-analytics'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  },

  {
    nodeId: 'chart-builder',
    name: 'Chart Builder',
    description: 'Creates data visualizations',
    category: 'analytics',
    icon: '📊',
    systemPrompt: 'You are an expert in data visualization...',
    defaultModel: 'gpt-4',
    estimatedCredits: 400,
    nodeType: 'agent',
    requiredPreviousNodes: ['data-analyzer'],
    isPublic: true,
    version: '1.0.0',
    isActive: true
  }
];
```

---

### 7. `workflows` Collection

**Purpose:** Custom workflow configurations (visual workflow builder)

```typescript
interface Workflow {
  id: string;

  // Ownership
  organizationId: string; // relation → organizations
  workspaceId?: string; // Optional: workspace-specific workflow

  // Identity
  name: string; // "Standard Product Flow", "Marketing Campaign Flow"
  description: string;
  icon?: string;

  // Workflow Definition (Graph structure)
  nodes: Array<{
    id: string; // Unique node instance ID
    nodeId: string; // Reference to node_registry.nodeId
    label?: string; // Custom label for this instance
    position: { x: number; y: number }; // For visual editor
    config: {
      model?: string; // Override default model
      temperature?: number;
      customPrompts?: object;
      [key: string]: any;
    };
  }>;

  edges: Array<{
    id: string;
    from: string; // Node instance ID
    to: string; // Node instance ID
    label?: string;
    condition?: string; // Conditional routing expression
    type?: 'default' | 'conditional' | 'parallel';
  }>;

  // Entry & Exit
  startNodeId: string; // Which node starts the workflow
  endNodeIds: string[]; // Which nodes end the workflow

  // Settings
  settings: {
    maxRetries?: number;
    timeout?: number; // minutes
    autoSave?: boolean;
    requireApproval?: boolean; // Human-in-the-loop
  };

  // Usage & Stats
  isDefault: boolean; // Default workflow for workspace
  isTemplate: boolean; // Can be cloned
  usageCount: number;
  averageExecutionTime?: number; // minutes
  averageCreditsUsed?: number;
  successRate?: number; // 0-100

  // Version Control
  version: string;
  parentWorkflowId?: string; // If cloned from another workflow

  // Metadata
  createdBy: string; // userId
  created: string;
  updated: string;
  lastUsed?: string;
}
```

**PocketBase Schema:**
```javascript
{
  name: 'workflows',
  type: 'base',
  schema: [
    { name: 'organizationId', type: 'relation', collection: 'organizations', required: true, cascadeDelete: true },
    { name: 'workspaceId', type: 'relation', collection: 'workspaces', cascadeDelete: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'nodes', type: 'json', required: true },
    { name: 'edges', type: 'json', required: true },
    { name: 'startNodeId', type: 'text', required: true },
    { name: 'endNodeIds', type: 'json', required: true },
    { name: 'settings', type: 'json' },
    { name: 'isDefault', type: 'bool', default: false },
    { name: 'isTemplate', type: 'bool', default: false },
    { name: 'usageCount', type: 'number', default: 0 },
    { name: 'averageExecutionTime', type: 'number' },
    { name: 'averageCreditsUsed', type: 'number' },
    { name: 'successRate', type: 'number' },
    { name: 'version', type: 'text', required: true },
    { name: 'parentWorkflowId', type: 'relation', collection: 'workflows' },
    { name: 'createdBy', type: 'relation', collection: 'users', required: true },
    { name: 'lastUsed', type: 'date' }
  ],
  indexes: ['organizationId', 'workspaceId', 'isDefault', 'isTemplate'],
  listRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id || isTemplate = true',
  viewRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id || isTemplate = true',
  createRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageWorkflows = true',
  updateRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageWorkflows = true',
  deleteRule: 'organizationId.@collection.org_members.userId ?= @request.auth.id && organizationId.@collection.org_members.permissions.canManageWorkflows = true'
}
```

**Example Workflow Definitions:**

```typescript
// Product Workflow (default)
const PRODUCT_WORKFLOW: Workflow = {
  name: 'Standard Product Development Flow',
  description: 'Complete product development workflow from ideation to deployment',
  icon: '🛠️',
  nodes: [
    { id: 'node-1', nodeId: 'founder', label: 'Business Analysis', position: { x: 100, y: 100 } },
    { id: 'node-2', nodeId: 'pm', label: 'Product Planning', position: { x: 300, y: 100 } },
    { id: 'node-3', nodeId: 'ux', label: 'UX Design', position: { x: 500, y: 100 } },
    { id: 'node-4', nodeId: 'frontend', label: 'Frontend Dev', position: { x: 700, y: 50 } },
    { id: 'node-5', nodeId: 'backend', label: 'Backend Dev', position: { x: 700, y: 150 } },
    { id: 'node-6', nodeId: 'qa', label: 'Quality Assurance', position: { x: 900, y: 100 } },
    { id: 'node-7', nodeId: 'devops', label: 'Deployment', position: { x: 1100, y: 100 } }
  ],
  edges: [
    { id: 'edge-1', from: 'node-1', to: 'node-2', type: 'default' },
    { id: 'edge-2', from: 'node-2', to: 'node-3', type: 'default' },
    { id: 'edge-3', from: 'node-3', to: 'node-4', type: 'parallel' },
    { id: 'edge-4', from: 'node-3', to: 'node-5', type: 'parallel' },
    { id: 'edge-5', from: 'node-4', to: 'node-6', type: 'default' },
    { id: 'edge-6', from: 'node-5', to: 'node-6', type: 'default' },
    { id: 'edge-7', from: 'node-6', to: 'node-7', type: 'default' }
  ],
  startNodeId: 'node-1',
  endNodeIds: ['node-7'],
  isDefault: true,
  version: '1.0.0'
};

// Marketing Workflow
const MARKETING_WORKFLOW: Workflow = {
  name: 'Marketing Campaign Flow',
  description: 'Create and launch marketing campaigns',
  icon: '📢',
  nodes: [
    { id: 'node-1', nodeId: 'marketing-analyzer', label: 'Market Analysis', position: { x: 100, y: 100 } },
    { id: 'node-2', nodeId: 'seo-optimizer', label: 'SEO Strategy', position: { x: 300, y: 50 } },
    { id: 'node-3', nodeId: 'ad-generator', label: 'Ad Copy Creation', position: { x: 300, y: 150 } },
    { id: 'node-4', nodeId: 'landing-page-builder', label: 'Landing Page', position: { x: 500, y: 100 } },
    { id: 'node-5', nodeId: 'qa', label: 'Review & Test', position: { x: 700, y: 100 } },
    { id: 'node-6', nodeId: 'devops', label: 'Launch Campaign', position: { x: 900, y: 100 } }
  ],
  edges: [
    { id: 'edge-1', from: 'node-1', to: 'node-2', type: 'parallel' },
    { id: 'edge-2', from: 'node-1', to: 'node-3', type: 'parallel' },
    { id: 'edge-3', from: 'node-2', to: 'node-4', type: 'default' },
    { id: 'edge-4', from: 'node-3', to: 'node-4', type: 'default' },
    { id: 'edge-5', from: 'node-4', to: 'node-5', type: 'default' },
    { id: 'edge-6', from: 'node-5', to: 'node-6', type: 'default' }
  ],
  startNodeId: 'node-1',
  endNodeIds: ['node-6'],
  isDefault: true,
  version: '1.0.0'
};
```

---

## 🔧 Implementation Examples

### Example 1: Organization Context Middleware

```typescript
// lib/middleware/org-context.ts

import { NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/pocketbase';

export interface OrgContext {
  organization: Organization;
  member: OrgMember;
  permissions: OrgMember['permissions'];
}

/**
 * Middleware to inject organization context into requests
 * Usage: Wrap API routes with this middleware
 */
export function withOrgContext(
  handler: (req: NextRequest, context: OrgContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get user from auth
      const user = await getCurrentUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get organization ID from header or query
      const orgId = req.headers.get('x-organization-id') ||
                    req.nextUrl.searchParams.get('organizationId');

      if (!orgId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      // Fetch organization
      const organization = await pb.collection('organizations').getOne(orgId);
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check user is member of organization
      const members = await pb.collection('org_members').getFullList({
        filter: `organizationId = "${orgId}" && userId = "${user.id}"`
      });

      if (members.length === 0) {
        return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
      }

      const member = members[0];

      // Create context object
      const context: OrgContext = {
        organization,
        member,
        permissions: member.permissions
      };

      // Call handler with context
      return handler(req, context);

    } catch (error: any) {
      console.error('[OrgContext] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to check specific permission
 */
export function requirePermission(
  context: OrgContext,
  permission: keyof OrgMember['permissions']
): boolean {
  return context.permissions[permission] === true;
}

/**
 * Example usage in API route
 */
// app/api/projects/create/route.ts
export const POST = withOrgContext(async (req: NextRequest, context: OrgContext) => {
  // Check permission
  if (!requirePermission(context, 'canCreateProjects')) {
    return NextResponse.json(
      { error: 'Permission denied: canCreateProjects required' },
      { status: 403 }
    );
  }

  const body = await req.json();

  // Create project with org context
  const project = await pb.collection('projects').create({
    ...body,
    organizationId: context.organization.id,
    createdBy: context.member.userId
  });

  return NextResponse.json(project);
});
```

---

### Example 2: Dynamic Workflow Builder

```typescript
// lib/langgraph/dynamic-workflow-builder.ts

import { StateGraph, END, START } from '@langchain/langgraph';
import { pb } from '@/lib/pocketbase';
import type { AppGenState } from './types';

/**
 * Create a LangGraph workflow from database workflow definition
 */
export async function createDynamicWorkflow(workflowId: string) {
  // Fetch workflow definition
  const workflow = await pb.collection('workflows').getOne(workflowId);

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  // Create state graph
  const graph = new StateGraph<AppGenState>({
    channels: {
      // ... state channel definitions (same as current workflow.ts)
    }
  });

  // Add nodes dynamically from workflow definition
  for (const node of workflow.nodes) {
    // Fetch node configuration from registry
    const nodeConfig = await pb.collection('node_registry').getOne(node.nodeId);

    if (!nodeConfig.isActive) {
      console.warn(`Node ${node.nodeId} is inactive, skipping`);
      continue;
    }

    // Create node function dynamically
    const nodeFunction = await createNodeFunction(nodeConfig, node.config);

    // Add to graph
    graph.addNode(node.id, nodeFunction);

    console.log(`✅ Added node: ${node.id} (${nodeConfig.name})`);
  }

  // Add edges from workflow definition
  for (const edge of workflow.edges) {
    if (edge.type === 'conditional' && edge.condition) {
      // Conditional edge
      graph.addConditionalEdges(
        edge.from,
        (state: AppGenState) => evaluateCondition(edge.condition!, state),
        { true: edge.to, false: END }
      );
    } else {
      // Default edge
      graph.addEdge(edge.from, edge.to);
    }

    console.log(`✅ Added edge: ${edge.from} → ${edge.to}`);
  }

  // Set entry point
  graph.addEdge(START, workflow.startNodeId);

  // Set exit points
  for (const endNodeId of workflow.endNodeIds) {
    graph.addEdge(endNodeId, END);
  }

  // Compile and return
  return graph.compile();
}

/**
 * Create a node function from node registry configuration
 */
async function createNodeFunction(
  nodeConfig: NodeRegistry,
  instanceConfig: any
) {
  return async (state: AppGenState): Promise<Partial<AppGenState>> => {
    console.log(`[${nodeConfig.name}] Starting execution...`);

    try {
      // Merge default config with instance config
      const config = {
        model: instanceConfig.model || nodeConfig.defaultModel,
        temperature: instanceConfig.temperature ?? nodeConfig.temperature ?? 0.7,
        maxTokens: instanceConfig.maxTokens || nodeConfig.maxTokens || 2000
      };

      // Validate inputs against schema
      validateInputs(state, nodeConfig.inputSchema);

      // Execute node based on type
      let result: Partial<AppGenState>;

      if (nodeConfig.nodeType === 'agent') {
        // Call LLM with system prompt
        result = await executeAgentNode(nodeConfig, state, config);
      } else if (nodeConfig.nodeType === 'tool') {
        // Execute tool function
        result = await executeToolNode(nodeConfig, state, config);
      } else if (nodeConfig.nodeType === 'human') {
        // Request human input
        result = await executeHumanNode(nodeConfig, state, config);
      } else {
        throw new Error(`Unknown node type: ${nodeConfig.nodeType}`);
      }

      // Validate outputs against schema
      validateOutputs(result, nodeConfig.outputSchema);

      // Track usage
      await trackNodeUsage(nodeConfig.id, state.projectId, nodeConfig.estimatedCredits);

      console.log(`[${nodeConfig.name}] ✅ Completed`);
      return result;

    } catch (error: any) {
      console.error(`[${nodeConfig.name}] ❌ Error:`, error);
      return {
        errors: [
          ...(state.errors || []),
          {
            node: nodeConfig.nodeId,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
  };
}

/**
 * Execute an agent node (LLM call)
 */
async function executeAgentNode(
  nodeConfig: NodeRegistry,
  state: AppGenState,
  config: any
): Promise<Partial<AppGenState>> {
  const { ChatOpenAI } = await import('@langchain/openai');

  const model = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens
  });

  // Build context-aware prompt
  const prompt = buildPrompt(nodeConfig.systemPrompt, state, config);

  // Call LLM
  const response = await model.invoke(prompt);

  // Parse response based on output schema
  const parsedOutput = parseNodeOutput(response.content, nodeConfig.outputSchema);

  return parsedOutput;
}

/**
 * Execute a tool node (custom code)
 */
async function executeToolNode(
  nodeConfig: NodeRegistry,
  state: AppGenState,
  config: any
): Promise<Partial<AppGenState>> {
  // For custom nodes with implementation code
  if (nodeConfig.implementationCode) {
    // Evaluate custom code in sandbox (use vm2 or similar)
    const sandbox = {
      state,
      config,
      pb, // PocketBase access
      console: console,
      // Add integrations to sandbox
      integrations: await getNodeIntegrations(state.organizationId, nodeConfig.requiredIntegrations)
    };

    const result = await evalInSandbox(nodeConfig.implementationCode, sandbox);
    return result;
  }

  throw new Error('Tool node requires implementationCode');
}

/**
 * Execute human-in-the-loop node
 */
async function executeHumanNode(
  nodeConfig: NodeRegistry,
  state: AppGenState,
  config: any
): Promise<Partial<AppGenState>> {
  // Create approval request
  await pb.collection('approval_requests').create({
    projectId: state.projectId,
    nodeId: nodeConfig.nodeId,
    status: 'pending',
    state: state,
    requestedAt: new Date().toISOString()
  });

  // Return pending state (workflow will pause)
  return {
    stage: 'awaiting_approval',
    currentNodeId: nodeConfig.nodeId
  };
}

/**
 * Get integrations accessible to this node
 */
async function getNodeIntegrations(
  organizationId: string,
  requiredIntegrations?: string[]
): Promise<Record<string, Integration>> {
  if (!requiredIntegrations || requiredIntegrations.length === 0) {
    return {};
  }

  const integrations = await pb.collection('integrations').getFullList({
    filter: `organizationId = "${organizationId}" && status = "active" && provider ?~ "${requiredIntegrations.join('|')}"`
  });

  return integrations.reduce((acc, integration) => {
    acc[integration.provider] = integration;
    return acc;
  }, {} as Record<string, Integration>);
}

/**
 * Evaluate condition for conditional routing
 */
function evaluateCondition(condition: string, state: AppGenState): boolean {
  // Simple condition evaluation (can be enhanced)
  // Example conditions:
  // - "state.isMultiPage === true"
  // - "state.validationResult.passed === false"
  try {
    return eval(condition);
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}
```

---

### Example 3: Integration API

```typescript
// app/api/integrations/[provider]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withOrgContext, requirePermission } from '@/lib/middleware/org-context';
import { pb } from '@/lib/pocketbase';

/**
 * GET /api/integrations/[provider]
 * Get integration configuration
 */
export const GET = withOrgContext(async (req: NextRequest, context) => {
  const provider = req.nextUrl.pathname.split('/').pop();

  const integrations = await pb.collection('integrations').getFullList({
    filter: `organizationId = "${context.organization.id}" && provider = "${provider}"`
  });

  if (integrations.length === 0) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Don't return sensitive credentials
  const integration = integrations[0];
  const safeIntegration = {
    ...integration,
    credentials: undefined // Remove credentials from response
  };

  return NextResponse.json(safeIntegration);
});

/**
 * POST /api/integrations/[provider]
 * Install/configure integration
 */
export const POST = withOrgContext(async (req: NextRequest, context) => {
  if (!requirePermission(context, 'canManageIntegrations')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const provider = req.nextUrl.pathname.split('/').pop();
  const body = await req.json();

  // Validate provider
  const providerConfig = INTEGRATION_PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  // Validate credentials
  for (const field of providerConfig.requiredCredentials) {
    if (!body.credentials[field]) {
      return NextResponse.json(
        { error: `Missing required credential: ${field}` },
        { status: 400 }
      );
    }
  }

  // Test connection
  try {
    await testIntegrationConnection(provider, body.credentials);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Connection test failed: ${error.message}` },
      { status: 400 }
    );
  }

  // Create integration
  const integration = await pb.collection('integrations').create({
    organizationId: context.organization.id,
    provider,
    name: body.name || providerConfig.name,
    credentials: body.credentials, // Encrypted by PocketBase
    settings: body.settings || {},
    status: 'active',
    installedBy: context.member.userId
  });

  return NextResponse.json({
    id: integration.id,
    provider: integration.provider,
    status: integration.status
  });
});

/**
 * DELETE /api/integrations/[provider]
 * Remove integration
 */
export const DELETE = withOrgContext(async (req: NextRequest, context) => {
  if (!requirePermission(context, 'canManageIntegrations')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const provider = req.nextUrl.pathname.split('/').pop();

  const integrations = await pb.collection('integrations').getFullList({
    filter: `organizationId = "${context.organization.id}" && provider = "${provider}"`
  });

  if (integrations.length === 0) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  await pb.collection('integrations').delete(integrations[0].id);

  return NextResponse.json({ success: true });
});

/**
 * Test integration connection
 */
async function testIntegrationConnection(provider: string, credentials: any) {
  switch (provider) {
    case 'google-analytics':
      // Test Google Analytics API
      const response = await fetch(
        'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportRequests: [{
              viewId: credentials.viewId,
              dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
              metrics: [{ expression: 'ga:sessions' }]
            }]
          })
        }
      );
      if (!response.ok) throw new Error('Google Analytics connection failed');
      break;

    case 'stripe':
      // Test Stripe API
      const stripeResponse = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!stripeResponse.ok) throw new Error('Stripe connection failed');
      break;

    case 'slack':
      // Test Slack API
      const slackResponse = await fetch('https://slack.com/api/auth.test', {
        headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
      });
      const slackData = await slackResponse.json();
      if (!slackData.ok) throw new Error('Slack connection failed');
      break;

    default:
      // Generic test - just check if credentials exist
      break;
  }
}
```

---

### Example 4: Node Using Integration

```typescript
// lib/langgraph/nodes/marketing-analyzer-node.ts

import { AppGenState } from '../types';
import { pb } from '@/lib/pocketbase';

/**
 * Marketing Analyzer Node
 * Uses Google Analytics integration to analyze traffic
 */
export async function marketingAnalyzerNode(
  state: AppGenState
): Promise<Partial<AppGenState>> {
  console.log('[MarketingAnalyzer] Starting analysis...');

  try {
    // Get organization
    const project = await pb.collection('projects').getOne(state.projectId);
    const workspace = await pb.collection('workspaces').getOne(project.workspaceId);
    const orgId = workspace.organizationId;

    // Get Google Analytics integration
    const integrations = await pb.collection('integrations').getFullList({
      filter: `organizationId = "${orgId}" && provider = "google-analytics" && status = "active"`
    });

    let analyticsData = null;
    if (integrations.length > 0) {
      const integration = integrations[0];

      // Fetch analytics data
      analyticsData = await fetchGoogleAnalyticsData(
        integration.credentials.accessToken,
        integration.settings.viewId
      );

      console.log('[MarketingAnalyzer] ✅ Fetched analytics data');
    } else {
      console.log('[MarketingAnalyzer] ⚠️ No Google Analytics integration found');
    }

    // Call LLM with analytics context
    const { ChatOpenAI } = await import('@langchain/openai');
    const model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7
    });

    const prompt = `
You are an expert Marketing Analyst. Analyze the following:

Product Description: ${state.userDescription}

${analyticsData ? `
Current Analytics Data:
- Page Views (7 days): ${analyticsData.pageViews}
- Sessions: ${analyticsData.sessions}
- Bounce Rate: ${analyticsData.bounceRate}%
- Top Traffic Sources: ${analyticsData.topSources.join(', ')}
` : 'No analytics data available yet.'}

Provide:
1. Market Analysis
2. Target Personas (3-5)
3. Positioning Strategy
4. Key Messaging Points

Format as JSON.
    `;

    const response = await model.invoke(prompt);
    const analysis = JSON.parse(response.content as string);

    return {
      context: {
        ...state.context,
        marketAnalysis: analysis.marketAnalysis,
        targetPersonas: analysis.targetPersonas,
        positioningStrategy: analysis.positioningStrategy,
        messagingPoints: analysis.messagingPoints
      },
      completedNodes: [...(state.completedNodes || []), 'marketing-analyzer']
    };

  } catch (error: any) {
    console.error('[MarketingAnalyzer] Error:', error);
    return {
      errors: [
        ...(state.errors || []),
        {
          node: 'marketing-analyzer',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }
}

/**
 * Fetch data from Google Analytics API
 */
async function fetchGoogleAnalyticsData(accessToken: string, viewId: string) {
  const response = await fetch(
    'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reportRequests: [{
          viewId: viewId,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { expression: 'ga:pageviews' },
            { expression: 'ga:sessions' },
            { expression: 'ga:bounceRate' }
          ],
          dimensions: [{ name: 'ga:source' }]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google Analytics data');
  }

  const data = await response.json();
  const report = data.reports[0];

  return {
    pageViews: report.data.totals[0].values[0],
    sessions: report.data.totals[0].values[1],
    bounceRate: parseFloat(report.data.totals[0].values[2]).toFixed(2),
    topSources: report.data.rows
      .slice(0, 5)
      .map((row: any) => row.dimensions[0])
  };
}
```

---

### Example 5: Migration Script

```typescript
// scripts/migrate-to-organization-model.ts

import { pb } from '../lib/pocketbase';

/**
 * Migration script: Convert single-tenant to multi-tenant
 *
 * Steps:
 * 1. Create default organization for each existing user
 * 2. Add users as owners of their organizations
 * 3. Create default workspace per organization
 * 4. Move projects to organization/workspace hierarchy
 * 5. Update credit tracking
 */

async function migrate() {
  console.log('🚀 Starting migration to organization model...\n');

  // Get all existing users
  const users = await pb.collection('users').getFullList();
  console.log(`Found ${users.length} users\n`);

  for (const user of users) {
    console.log(`\n📍 Migrating user: ${user.email}`);

    try {
      // 1. Create organization for user
      const org = await pb.collection('organizations').create({
        name: `${user.name || user.email}'s Organization`,
        slug: `${user.email.split('@')[0]}-${Date.now()}`,
        billingEmail: user.email,
        plan: 'free',
        subscriptionStatus: 'active',
        totalCredits: user.totalTokens || 0,
        usedCredits: user.usedTokens || 0,
        monthlyCredits: user.dailyTokens || 0,
        enabledEngines: ['product'], // Default to product engine
        enabledIntegrations: [],
        settings: {},
        ownerId: user.id
      });

      console.log(`  ✅ Created organization: ${org.id}`);

      // 2. Add user as organization owner
      const member = await pb.collection('org_members').create({
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
        permissions: ROLE_PERMISSIONS.owner,
        personalCreditQuota: null, // Unlimited
        personalCreditsUsed: 0,
        invitedBy: user.id,
        invitedAt: new Date().toISOString(),
        inviteAccepted: true,
        joined: new Date().toISOString()
      });

      console.log(`  ✅ Added user as owner`);

      // 3. Create default workspace
      const workspace = await pb.collection('workspaces').create({
        organizationId: org.id,
        name: 'Product Development',
        description: 'Default workspace for product development',
        icon: '🛠️',
        color: '#3b82f6',
        engineType: 'product',
        enabledNodes: ['founder', 'pm', 'ux', 'frontend', 'backend', 'qa', 'devops'],
        nodeConfigurations: {},
        memberIds: [member.id],
        settings: {},
        projectCount: 0,
        totalCreditsUsed: 0,
        createdBy: user.id
      });

      console.log(`  ✅ Created default workspace: ${workspace.id}`);

      // 4. Migrate user's projects
      const projects = await pb.collection('projects').getFullList({
        filter: `userId = "${user.id}"`
      });

      console.log(`  📦 Migrating ${projects.length} projects...`);

      for (const project of projects) {
        await pb.collection('projects').update(project.id, {
          organizationId: org.id,
          workspaceId: workspace.id,
          createdBy: user.id,
          engineType: 'product',
          status: 'deployed'
        });
      }

      // Update workspace project count
      await pb.collection('workspaces').update(workspace.id, {
        projectCount: projects.length
      });

      console.log(`  ✅ Migrated ${projects.length} projects`);

      // 5. Migrate transactions (if any)
      const transactions = await pb.collection('transactions').getFullList({
        filter: `userId = "${user.id}"`
      });

      if (transactions.length > 0) {
        console.log(`  💳 Found ${transactions.length} transactions (no migration needed)`);
      }

      console.log(`✅ User migration complete!\n`);

    } catch (error: any) {
      console.error(`❌ Error migrating user ${user.email}:`, error.message);
      console.error(error);
    }
  }

  console.log('\n🎉 Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Update frontend to use organization context');
  console.log('2. Update API routes to check organization membership');
  console.log('3. Test multi-tenant access controls');
}

// Run migration
migrate().catch(console.error);

const ROLE_PERMISSIONS = {
  owner: {
    canCreateProjects: true,
    canDeleteProjects: true,
    canInviteMembers: true,
    canManageBilling: true,
    canManageIntegrations: true,
    canManageWorkspaces: true,
    canCreateCustomNodes: true,
    canManageWorkflows: true
  }
};
```

---

### Example 6: Frontend Organization Selector

```typescript
// components/org/OrganizationSelector.tsx

'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';

export function OrganizationSelector() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    // Get organizations where user is a member
    const user = pb.authStore.model;
    if (!user) return;

    const members = await pb.collection('org_members').getFullList({
      filter: `userId = "${user.id}"`,
      expand: 'organizationId'
    });

    const orgs = members.map(m => m.expand.organizationId);
    setOrganizations(orgs);

    // Set current org from localStorage or first org
    const saved = localStorage.getItem('currentOrganizationId');
    if (saved && orgs.find(o => o.id === saved)) {
      setCurrentOrg(saved);
    } else if (orgs.length > 0) {
      setCurrentOrg(orgs[0].id);
      localStorage.setItem('currentOrganizationId', orgs[0].id);
    }
  }

  function switchOrganization(orgId: string) {
    setCurrentOrg(orgId);
    localStorage.setItem('currentOrganizationId', orgId);
    // Reload page to apply new org context
    window.location.reload();
  }

  const current = organizations.find(o => o.id === currentOrg);

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentOrg || ''}
        onChange={(e) => switchOrganization(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        {organizations.map(org => (
          <key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      {current && (
        <div className="text-sm text-gray-600">
          Plan: {current.plan} | Credits: {current.totalCredits - current.usedCredits}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Scalability Metrics

### Before (Current Architecture)

| Metric | Value | Limitation |
|--------|-------|------------|
| **Max Organizations** | 1 (implicit) | No multi-tenancy |
| **Max Concurrent Users** | ~100 | Single SQLite instance |
| **Node Types** | 7 (fixed) | Hardcoded in code |
| **Engines** | 1 (Product) | No Marketing/Analytics |
| **Integrations** | 0 | No framework |
| **Workspaces** | 0 | No concept |
| **Scaling Method** | Vertical only | Cannot horizontally scale |
| **Team Collaboration** | ❌ No | Single user per project |
| **Custom Workflows** | ❌ No | Fixed workflow |

### After (Proposed Architecture)

| Metric | Value | Capability |
|--------|-------|-----------|
| **Max Organizations** | Unlimited | Full multi-tenancy |
| **Max Concurrent Users** | 100,000+ | Sharded database |
| **Node Types** | Unlimited | Dynamic node registry |
| **Engines** | Unlimited | Marketing, Analytics, Custom |
| **Integrations** | Unlimited | Plugin framework |
| **Workspaces** | Unlimited | Per organization |
| **Scaling Method** | Horizontal + Vertical | Database sharding |
| **Team Collaboration** | ✅ Yes | Role-based access |
| **Custom Workflows** | ✅ Yes | Visual workflow builder |

---

## 🏗️ Implementation Roadmap

### Phase 1: Organization Layer (Week 1-2)

**Goal:** Add multi-tenant foundation

- [ ] Create `organizations`, `org_members`, `workspaces` collections
- [ ] Write migration script to convert existing users
- [ ] Implement organization context middleware
- [ ] Update frontend with organization selector
- [ ] Test: User can create org, invite members

**Estimated Time:** 10-15 hours

---

### Phase 2: Dynamic Node Registry (Week 3-4)

**Goal:** Enable custom nodes

- [ ] Create `node_registry` collection
- [ ] Seed existing product nodes
- [ ] Create marketing node definitions
- [ ] Implement dynamic node function builder
- [ ] Update workflow to use node registry
- [ ] Test: Can add/remove nodes dynamically

**Estimated Time:** 15-20 hours

---

### Phase 3: Workspace & Engine Support (Week 5-6)

**Goal:** Support multiple engines

- [ ] Implement workspace management UI
- [ ] Create engine templates (Product, Marketing, Analytics)
- [ ] Build workspace settings page
- [ ] Implement node configuration per workspace
- [ ] Test: Create marketing workspace, run campaign flow

**Estimated Time:** 12-18 hours

---

### Phase 4: Integration Framework (Week 7-8)

**Goal:** Connect external tools

- [ ] Create `integrations` collection
- [ ] Implement integration installation API
- [ ] Build integration management UI
- [ ] Add Google Analytics integration
- [ ] Update nodes to use integrations
- [ ] Test: Marketing node uses GA data

**Estimated Time:** 15-20 hours

---

### Phase 5: Dynamic Workflows (Week 9-10)

**Goal:** Visual workflow builder

- [ ] Create `workflows` collection
- [ ] Implement dynamic workflow compiler
- [ ] Build visual workflow editor (React Flow)
- [ ] Add workflow templates
- [ ] Test: Custom workflow execution

**Estimated Time:** 20-25 hours

---

### Phase 6: Database Sharding (Optional - Week 11-12)

**Goal:** Horizontal scalability

- [ ] Implement org-to-shard mapping
- [ ] Create database connection pool
- [ ] Add shard routing middleware
- [ ] Test: Multiple PocketBase instances

**Estimated Time:** 15-20 hours

---

## 🎯 Success Criteria

### MVP (Phases 1-3)

- ✅ Organizations can invite multiple users
- ✅ Users can belong to multiple organizations
- ✅ Projects organized by workspaces
- ✅ Role-based permissions working
- ✅ Credits pooled at org level
- ✅ Marketing workspace functional

### Full Implementation (Phases 1-5)

- ✅ All engine types supported (Product, Marketing, Analytics)
- ✅ Dynamic node registry working
- ✅ Custom workflows can be created
- ✅ Integrations framework operational
- ✅ Nodes can access org-level integrations
- ✅ Visual workflow editor functional

### Production-Ready (All Phases)

- ✅ Database sharding implemented
- ✅ Horizontal scaling tested
- ✅ Performance benchmarks met
- ✅ Security audit complete
- ✅ Documentation complete

---

## 🚧 Blockers & Considerations

### Technical Challenges

1. **PocketBase Limitations**
   - No native sharding support
   - May need to migrate to PostgreSQL for production scale
   - Alternative: Use PlanetScale or Supabase

2. **Workflow State Management**
   - LangGraph checkpoints need org context
   - May need custom checkpoint implementation

3. **Code Sandboxing**
   - Custom node code execution requires sandbox
   - Use `vm2` or isolate process

### Security Concerns

1. **Credential Storage**
   - Integration credentials must be encrypted
   - PocketBase handles this, but verify encryption at rest

2. **Custom Node Code**
   - Arbitrary code execution risk
   - Implement strict sandboxing and rate limits

3. **Cross-Org Access**
   - Ensure API rules prevent cross-org data access
   - Add comprehensive integration tests

---

## 📚 Related Documentation

- [Current Architecture](./ARCHITECTURE_SUMMARY.md)
- [LangGraph Implementation](./LANGGRAPH_IMPLEMENTATION_COMPLETE.md)
- [PocketBase Schema](./docs/architecture/POCKETBASE_SCHEMA.md)
- [Credit System](./CREDIT_SYSTEM_OPTIMIZATION_SUMMARY.md)

---

## ✅ Next Steps

1. **Review & Approve** - Confirm this architecture meets requirements
2. **Prioritize Phases** - Decide which phases are critical for MVP
3. **Create Tickets** - Break down into granular implementation tasks
4. **Start Phase 1** - Begin with organization layer migration
5. **Iterate** - Gather feedback and adjust as needed

---

**Last Updated:** January 2025
**Status:** Ready for Implementation
**Estimated Total Time:** 87-118 hours (10-15 weeks part-time)
