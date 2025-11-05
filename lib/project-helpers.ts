import { pb, ensureAuth } from './pocketbase';
import { getUserOrganizationSafe } from './services/org-auto-create';

export interface ProjectData {
  id: string;
  description: string;
  createdAt: string;
  stage: 'planning' | 'building';
  plan?: string;
  userId: string | null;
  messages?: Array<{ role: string; content: string }>;
  backendConfig?: any;
  context?: any;
  stylingConfig?: any; // ✨ Brand assets from UX node (colors, typography, iconography, etc.)
  prototypeCode?: string;
  files?: any[];
  deployUrl?: string;
  workflowLogs?: any[]; // Workflow execution logs with role messages
  allRequestedFeatures?: any[]; // CRITICAL: All features for MVP + follow-up
  defaultName?: string; // AI-generated URL-friendly name
  subdomain?: string; // Subdomain for publishing
  customDomain?: string; // Optional custom domain
  isPublished?: boolean; // Publishing status
  publishedAt?: string; // Publication timestamp
}

/**
 * Create a new project in PocketBase
 * FIXED: No longer silently falls back to localStorage-only
 */
export async function createProject(data: Omit<ProjectData, 'createdAt'>): Promise<string> {
  // FIXED: Ensure auth is ready before attempting to save
  await ensureAuth();

  // Generate AI-powered project name via API (server-side only)
  let defaultName: string;
  try {
    // Call server-side API to generate name
    const response = await fetch('/api/projects/generate-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: data.description })
    });

    if (response.ok) {
      const result = await response.json();
      defaultName = result.name;
      console.log('✅ Generated project name:', defaultName);
    } else {
      throw new Error('Failed to generate name via API');
    }
  } catch (error) {
    console.error('Failed to generate project name, using fallback:', error);
    // Fallback to simple ID-based name
    defaultName = `project-${data.id}`;
  }

  // ✨ NEW: Get user's organization (backwards compatible)
  let organizationId: string | null = null;
  if (data.userId) {
    try {
      const org = await getUserOrganizationSafe(data.userId);
      organizationId = org?.id || null;
    } catch (error) {
      console.warn('Could not get organization for user, continuing without org:', error);
    }
  }

  // CRITICAL: Force PocketBase to use the same ID to avoid mapping confusion
  // This ensures consistency between workflow ID, PocketBase ID, and collection prefixes
  const project = await pb.collection('projects').create({
    id: data.id,  // Force this exact ID (must be 15 chars)
    userId: data.userId,
    organizationId: organizationId, // ✨ NEW: Auto-assigned to user's org
    name: data.description.substring(0, 100), // Use first 100 chars as name
    description: data.description,
    stage: data.stage,
    plan: data.plan || '',
    planMessages: data.messages ? JSON.stringify(data.messages) : '[]',
    backendConfig: data.backendConfig || null,
    context: data.context || null,
    deployUrl: data.deployUrl || '',
    workflowLogs: data.workflowLogs ? JSON.stringify(data.workflowLogs) : '[]',
    allRequestedFeatures: data.allRequestedFeatures ? JSON.stringify(data.allRequestedFeatures) : '[]',
    defaultName: defaultName,
    subdomain: defaultName, // Initially same as defaultName
    customDomain: '',
    isPublished: false,
    publishedAt: null
  });

  console.log('✅ Project created in PocketBase with ID:', project.id);

  // Cache to localStorage for offline access
  localStorage.setItem(
    `project_${data.id}`,
    JSON.stringify({
      ...data,
      pbId: project.id, // Store PocketBase ID (same as data.id now)
      createdAt: new Date().toISOString()
    })
  );

  // Map localStorage ID to PocketBase ID (now they're the same!)
  localStorage.setItem(`pb_project_map_${data.id}`, project.id);

  return project.id;
}

/**
 * Get a project by ID
 * FIXED: PocketBase is now the primary source of truth
 */
export async function getProject(projectId: string): Promise<ProjectData | null> {
  try {
    // FIXED: Check PocketBase FIRST (primary source of truth)
    await ensureAuth();
    const pbId = localStorage.getItem(`pb_project_map_${projectId}`) || projectId;
    const project = await pb.collection('projects').getOne(pbId);

    const projectData = {
      id: projectId,
      description: project.description,
      createdAt: project.created,
      stage: project.stage,
      plan: project.plan || undefined,
      userId: project.userId,
      messages: project.planMessages ? JSON.parse(project.planMessages) : undefined,
      backendConfig: project.backendConfig || undefined,
      context: project.context || undefined,
      stylingConfig: project.stylingConfig || undefined, // ✨ Brand assets from UX node
      deployUrl: project.deployUrl || undefined,
      files: project.files || undefined,
      prototypeCode: project.prototypeCode || undefined,
      workflowLogs: project.workflowLogs ? JSON.parse(project.workflowLogs) : undefined,
      allRequestedFeatures: project.allRequestedFeatures ? JSON.parse(project.allRequestedFeatures) : undefined,
      defaultName: project.defaultName || undefined,
      subdomain: project.subdomain || undefined,
      customDomain: project.customDomain || undefined,
      isPublished: project.isPublished || false,
      publishedAt: project.publishedAt || undefined
    };

    // Update localStorage cache with fresh data from database
    localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData));

    console.log('✅ Project loaded from PocketBase:', projectId);
    return projectData;
  } catch (error: any) {
    // Fallback to localStorage cache ONLY if PocketBase is unavailable
    console.warn('Could not fetch from PocketBase, trying localStorage cache:', error?.message || error);

    const stored = localStorage.getItem(`project_${projectId}`);
    if (stored) {
      try {
        const cachedProject = JSON.parse(stored);
        console.log('📦 Using cached project from localStorage (database unavailable)');
        return cachedProject;
      } catch (parseError) {
        console.error('Failed to parse localStorage project:', parseError);
      }
    }

    // No data found in either source
    console.error('❌ Project not found in PocketBase or localStorage:', projectId);
    return null;
  }
}

/**
 * Clear old projects from localStorage to free up space
 * Keeps the current project and the 5 most recent others
 */
function clearOldProjects(currentProjectId: string): void {
  try {
    const projectKeys: { key: string; timestamp: number }[] = [];

    // Find all project keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('project_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const project = JSON.parse(data);
            projectKeys.push({
              key,
              timestamp: new Date(project.createdAt || 0).getTime()
            });
          }
        } catch (e) {
          // Invalid JSON, mark for deletion
          projectKeys.push({ key, timestamp: 0 });
        }
      }
    }

    // Sort by timestamp (newest first)
    projectKeys.sort((a, b) => b.timestamp - a.timestamp);

    // Keep current project + 5 most recent, remove the rest
    const toKeep = new Set([`project_${currentProjectId}`]);
    projectKeys.slice(0, 5).forEach(p => toKeep.add(p.key));

    // Remove old projects
    let removed = 0;
    projectKeys.forEach(p => {
      if (!toKeep.has(p.key)) {
        localStorage.removeItem(p.key);
        removed++;
      }
    });

    console.log(`[Storage] Cleared ${removed} old projects from localStorage`);
  } catch (error) {
    console.error('[Storage] Error clearing old projects:', error);
  }
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, updates: Partial<ProjectData>): Promise<void> {
  // First update localStorage immediately
  const stored = localStorage.getItem(`project_${projectId}`);
  if (stored) {
    try {
      const project = JSON.parse(stored);
      localStorage.setItem(
        `project_${projectId}`,
        JSON.stringify({ ...project, ...updates })
      );
    } catch (error) {
      // Handle QuotaExceededError gracefully
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[Storage] localStorage quota exceeded, clearing old projects...');
        // Clear old project data to make room
        clearOldProjects(projectId);
        // Retry once after cleanup
        try {
          const project = JSON.parse(stored);
          localStorage.setItem(
            `project_${projectId}`,
            JSON.stringify({ ...project, ...updates })
          );
        } catch (retryError) {
          console.error('[Storage] Failed to save even after cleanup:', retryError);
          // Continue anyway - PocketBase sync will handle persistence
        }
      } else {
        throw error;
      }
    }
  }

  // Then sync to PocketBase in the background
  try {
    // FIXED: Await ensureAuth to make sure auth is ready
    await ensureAuth();

    // Check for PocketBase ID mapping
    const pbId = localStorage.getItem(`pb_project_map_${projectId}`) || projectId;

    const pbUpdates: any = {};
    if (updates.description !== undefined) pbUpdates.description = updates.description;
    if (updates.stage !== undefined) pbUpdates.stage = updates.stage;
    if (updates.plan !== undefined) pbUpdates.plan = updates.plan;
    if (updates.messages !== undefined) pbUpdates.planMessages = JSON.stringify(updates.messages);
    if (updates.backendConfig !== undefined) pbUpdates.backendConfig = updates.backendConfig;
    if (updates.context !== undefined) pbUpdates.context = updates.context;
    if (updates.stylingConfig !== undefined) pbUpdates.stylingConfig = updates.stylingConfig; // ✨ Brand assets
    if (updates.deployUrl !== undefined) pbUpdates.deployUrl = updates.deployUrl;
    if (updates.files !== undefined) pbUpdates.files = updates.files;
    if (updates.prototypeCode !== undefined) pbUpdates.prototypeCode = updates.prototypeCode;
    if (updates.workflowLogs !== undefined) pbUpdates.workflowLogs = JSON.stringify(updates.workflowLogs);
    if (updates.allRequestedFeatures !== undefined) pbUpdates.allRequestedFeatures = JSON.stringify(updates.allRequestedFeatures);
    if (updates.defaultName !== undefined) pbUpdates.defaultName = updates.defaultName;
    if (updates.subdomain !== undefined) pbUpdates.subdomain = updates.subdomain;
    if (updates.customDomain !== undefined) pbUpdates.customDomain = updates.customDomain;
    if (updates.isPublished !== undefined) pbUpdates.isPublished = updates.isPublished;
    if (updates.publishedAt !== undefined) pbUpdates.publishedAt = updates.publishedAt;

    // Update name if description changed
    if (updates.description !== undefined) {
      pbUpdates.name = updates.description.substring(0, 100);
    }

    await pb.collection('projects').update(pbId, pbUpdates);
    console.log('✅ Project updated in PocketBase:', pbId);
  } catch (error: any) {
    // Only log non-404 errors
    if (error?.status !== 404) {
      console.warn('Could not update project in PocketBase, using localStorage:', error?.message || error);
    }
  }
}

/**
 * List user's projects
 */
export async function listUserProjects(userId: string): Promise<ProjectData[]> {
  try {
    // FIXED: Await ensureAuth to make sure auth is ready
    await ensureAuth();

    // Check if we have valid auth - silently return empty if not
    if (!pb.authStore.isValid || !pb.authStore.token) {
      // Don't log here - this is expected for unauthenticated users
      return [];
    }

    // Validate userId before making the request
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn('[listUserProjects] Invalid userId:', userId);
      return [];
    }

    let records;
    try {
      records = await pb.collection('projects').getFullList({
        filter: `userId = "${userId}"`,
        sort: '-created'
      });
    } catch (pbError: any) {
      // Handle PocketBase-specific errors
      if (pbError?.status === 0 || pbError?.name === 'ClientResponseError') {
        // Network error or PocketBase not ready - silently return empty
        return [];
      }
      throw pbError; // Re-throw to be caught by outer catch
    }

    if (records.length > 0) {
      console.log(`[listUserProjects] Found ${records.length} projects for user ${userId}`);
    }

    return records.map(project => ({
      id: project.id,
      description: project.description,
      createdAt: project.created,
      stage: project.stage,
      plan: project.plan || undefined,
      userId: project.userId,
      messages: project.planMessages ? JSON.parse(project.planMessages) : undefined,
      backendConfig: project.backendConfig || undefined,
      context: project.context || undefined,
      stylingConfig: project.stylingConfig || undefined, // ✨ Brand assets
      deployUrl: project.deployUrl || undefined,
      files: project.files || undefined,
      prototypeCode: project.prototypeCode || undefined,
      workflowLogs: project.workflowLogs ? JSON.parse(project.workflowLogs) : undefined,
      allRequestedFeatures: project.allRequestedFeatures ? JSON.parse(project.allRequestedFeatures) : undefined,
      defaultName: project.defaultName || undefined,
      subdomain: project.subdomain || undefined,
      customDomain: project.customDomain || undefined,
      isPublished: project.isPublished || false,
      publishedAt: project.publishedAt || undefined
    }));
  } catch (error: any) {
    // Silently handle common expected errors
    const status = error?.status || error?.code;

    // Auth errors (user not logged in)
    if (status === 401 || status === 403) {
      return [];
    }

    // 404 (no projects collection yet)
    if (status === 404) {
      return [];
    }

    // Network errors or PocketBase not ready
    if (status === 0 || !error || typeof error !== 'object') {
      return [];
    }

    // Check if error has any meaningful properties
    const errorKeys = Object.keys(error);
    const hasMeaningfulData = errorKeys.some(key =>
      error[key] !== undefined &&
      error[key] !== null &&
      error[key] !== ''
    );

    // Only log errors with meaningful information
    if (hasMeaningfulData) {
      console.error('[listUserProjects] Unexpected error:', {
        status: error?.status || error?.code,
        message: error?.message,
        data: error?.data,
        keys: errorKeys
      });
    }

    return [];
  }
}
