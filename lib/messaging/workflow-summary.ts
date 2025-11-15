/**
 * Generate dynamic workflow completion summary message
 * Based on actual workflow data - no hardcoding!
 */

export interface WorkflowCompleteData {
  projectId: string;
  success: boolean;
  duration: number; // milliseconds
  addedFeatures?: string[];
  fileChanges?: {
    added?: string[];
    edited?: string[];
    deleted?: string[];
  };
  allRequestedFeatures?: Array<{
    id: string;
    name: string;
    description: string;
    phase: number;
    included_in_mvp: boolean;
    completed: boolean;
    suggested: boolean;
    userRequested: boolean;
    priority?: 'high' | 'medium' | 'low';
  }>;
  metadata?: {
    totalLines?: number;
    collectionsCreated?: number;
    routesCreated?: number;
  };
}

/**
 * Generate the main success message with dynamic data
 */
export function generateSuccessMessage(data: WorkflowCompleteData): string {
  const durationSec = (data.duration / 1000).toFixed(1);
  return `✅ Success! Your app is ready in ${durationSec} seconds!`;
}

/**
 * Generate the file summary section
 */
export function generateFilesSummary(data: WorkflowCompleteData): string | null {
  const { fileChanges, metadata } = data;

  if (!fileChanges || (!fileChanges.added?.length && !fileChanges.edited?.length)) {
    return null;
  }

  const addedCount = fileChanges.added?.length || 0;
  const editedCount = fileChanges.edited?.length || 0;
  const totalLines = metadata?.totalLines || 0;
  const collections = metadata?.collectionsCreated || 0;
  const routes = metadata?.routesCreated || 0;

  const parts: string[] = [];

  if (addedCount > 0) {
    const linesText = totalLines > 0 ? ` (${totalLines} lines)` : '';
    parts.push(`• Created ${addedCount} ${addedCount === 1 ? 'file' : 'files'}${linesText}`);
  }

  if (editedCount > 0) {
    parts.push(`• Updated ${editedCount} ${editedCount === 1 ? 'file' : 'files'}`);
  }

  if (collections > 0) {
    parts.push(
      `• Set up ${collections} database ${collections === 1 ? 'collection' : 'collections'}`
    );
  }

  if (routes > 0) {
    parts.push(`• Configured ${routes} ${routes === 1 ? 'route' : 'routes'}`);
  }

  return parts.length > 0 ? `📦 **Generated Files**\n${parts.join('\n')}` : null;
}

/**
 * Generate the implemented features section
 */
export function generateImplementedFeatures(data: WorkflowCompleteData): string | null {
  const implementedFeatures =
    data.allRequestedFeatures?.filter((f) => f.included_in_mvp && f.completed) || [];

  if (implementedFeatures.length === 0) {
    return null;
  }

  const featureList = implementedFeatures.map((f) => `  ✅ ${f.name}`).join('\n');

  return `🎯 I have implemented core features:\n${featureList}`;
}

/**
 * Generate the suggested features section (for +Add Feature buttons)
 */
export function generateSuggestedFeatures(data: WorkflowCompleteData): Array<{
  featureId: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const suggestedFeatures =
    data.allRequestedFeatures?.filter((f) => !f.included_in_mvp && (f.suggested || f.phase > 1)) ||
    [];

  return suggestedFeatures.map((f) => ({
    featureId: f.id,
    label: f.name,
    description: f.description,
    priority: f.priority || 'medium',
  }));
}

/**
 * Generate the complete workflow summary message
 */
export function generateWorkflowSummary(data: WorkflowCompleteData): {
  message: string;
  suggestedFeatures: Array<{
    featureId: string;
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
} {
  const parts: string[] = [];

  // Main success message
  parts.push(generateSuccessMessage(data));
  parts.push(''); // Empty line
  parts.push(''); // Extra empty line for spacing

  // Implemented features
  const implementedFeatures = generateImplementedFeatures(data);
  if (implementedFeatures) {
    parts.push(implementedFeatures);
    parts.push(''); // Empty line
    parts.push(''); // Extra empty line for spacing
  }

  // Suggested features section header (if any exist)
  const suggestedFeatures = generateSuggestedFeatures(data);
  if (suggestedFeatures.length > 0) {
    parts.push('**Following features are still remaining.** Check the app in preview first... and add on to it:');
    parts.push(''); // Empty line
  }

  return {
    message: parts.join('\n').trim(),
    suggestedFeatures,
  };
}
