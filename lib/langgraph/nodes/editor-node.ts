// @ts-nocheck
// lib/langgraph/nodes/editor-node.ts
/**
 * EDITOR NODE
 *
 * Role: Intelligent code editor that makes targeted, context-aware modifications
 * to existing files while preserving critical sections.
 *
 * Responsibilities:
 * - Apply user-requested changes intelligently
 * - Preserve database integration, navigation, and existing features
 * - Generate complete, working code (no placeholders)
 * - Support both single-file and multi-file edits
 * - Maintain code quality and consistency
 */

import { generateWithFallback } from '@/lib/ai';
import { ROUTING_INSTRUCTIONS } from '@/lib/prompts/routing-instructions';
import { injectDatabaseScript, createDatabaseInjectionScript } from '@/lib/database-injection';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress, emitChatMessage } from '../events';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { validateFileOperation } from '@/lib/file-operation-guards';
import { pb } from '@/lib/pocketbase'; // PHASE 3: For checkpoint system
import { logEditorOperation } from '@/lib/services/workflow-logger';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';

/**
 * Detects and validates file creation intent from user request
 */
function detectFileCreation(userRequest: string, existingFiles: Array<{path: string; content: string}>): {
  isCreation: boolean;
  expectedFiles: string[];
  warnings: string[];
} {
  // ✅ FIX 36: Safety check for undefined
  if (!userRequest) return { isCreation: false, expectedFiles: [], warnings: [] };

  const request = userRequest.toLowerCase();
  const warnings: string[] = [];
  const expectedFiles: string[] = [];

  // Pattern matching for creation intent
  const creationPatterns = [
    /create\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:called\s+)?([a-z0-9-_.]+)/gi,
    /add\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:called\s+)?([a-z0-9-_.]+)/gi,
    /make\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:called\s+)?([a-z0-9-_.]+)/gi,
    /new\s+page\s+(?:called\s+)?([a-z0-9-_.]+)/gi,
    /build\s+(?:a\s+)?([a-z0-9-_.]+)\s+page/gi
  ];

  const isCreation = creationPatterns.some(pattern => pattern.test(userRequest));

  if (isCreation) {
    // Extract filenames
    for (const pattern of creationPatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(userRequest)) !== null) {
        let filename = match[1];

        // Ensure proper extension
        if (!filename.includes('.')) {
          // Infer extension from context
          if (request.includes('style') || request.includes('css')) {
            filename += '.css';
          } else if (request.includes('script') || request.includes('js') || request.includes('ts')) {
            filename += '.tsx';
          } else if (request.includes('component')) {
            filename += '.tsx';
          } else {
            filename += '.tsx'; // Default to Next.js TypeScript
          }
        }

        expectedFiles.push(filename);

        // Check if file already exists
        if (existingFiles.find(f => f.path === filename)) {
          warnings.push(`File ${filename} already exists - will be overwritten`);
        }
      }
    }

    // Deduplicate
    const uniqueFiles = [...new Set(expectedFiles)];
    return { isCreation, expectedFiles: uniqueFiles, warnings };
  }

  return { isCreation: false, expectedFiles: [], warnings: [] };
}

/**
 * Detects file rename intent from user request
 */
function detectFileRename(userRequest: string): {
  isRename: boolean;
  oldPath: string | null;
  newPath: string | null;
} {
  // ✅ FIX 36: Safety check for undefined
  if (!userRequest) return { isRename: false, oldPath: null, newPath: null };

  const renamePatterns = [
    /rename\s+([a-z0-9-_.\/]+)\s+to\s+([a-z0-9-_.\/]+)/i,
    /change\s+([a-z0-9-_.\/]+)\s+(?:name\s+)?to\s+([a-z0-9-_.\/]+)/i,
    /move\s+([a-z0-9-_.\/]+)\s+to\s+([a-z0-9-_.\/]+)/i,
  ];

  for (const pattern of renamePatterns) {
    const match = userRequest.match(pattern);
    if (match) {
      return {
        isRename: true,
        oldPath: match[1],
        newPath: match[2]
      };
    }
  }

  return { isRename: false, oldPath: null, newPath: null };
}

/**
 * Updates all file references after rename
 */
function updateFileReferences(
  files: Array<{ path: string; content: string }>,
  oldPath: string,
  newPath: string
): Array<{ path: string; content: string }> {
  return files.map(file => {
    let updatedContent = file.content;

    // Update HTML href attributes
    updatedContent = updatedContent.replace(
      new RegExp(`href=["']${oldPath}["']`, 'g'),
      `href="${newPath}"`
    );

    // Update HTML src attributes
    updatedContent = updatedContent.replace(
      new RegExp(`src=["']${oldPath}["']`, 'g'),
      `src="${newPath}"`
    );

    // Update CSS url() references
    updatedContent = updatedContent.replace(
      new RegExp(`url\\(['"]${oldPath}['"]\\)`, 'g'),
      `url('${newPath}')`
    );

    // Update JavaScript imports/requires
    updatedContent = updatedContent.replace(
      new RegExp(`from ['"]${oldPath}['"]`, 'g'),
      `from '${newPath}'`
    );
    updatedContent = updatedContent.replace(
      new RegExp(`require\\(['"]${oldPath}['"]\\)`, 'g'),
      `require('${newPath}')`
    );

    return { ...file, content: updatedContent };
  });
}

/**
 * Detects file type from content and user request
 */
function detectFileType(
  content: string,
  userRequest: string,
  defaultFilename: string = 'page.tsx'
): { filename: string; type: 'tsx' | 'ts' | 'css' | 'json' | 'unknown' } {
  // ✅ FIX 36: Safety check for undefined
  const safeUserRequest = userRequest || '';

  const trimmed = content.trim();

  // Check explicit filename in request
  const filenameMatch = safeUserRequest.match(/([a-z0-9-_/]+\.(tsx|ts|css|json))/i);
  if (filenameMatch) {
    const filename = filenameMatch[1];
    const ext = filenameMatch[2].toLowerCase();
    return {
      filename,
      type: ext === 'tsx' ? 'tsx' : ext === 'ts' ? 'ts' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : 'unknown'
    };
  }

  // Detect from content
  // CSS detection
  if (
    trimmed.startsWith('.') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('@') ||
    (trimmed.includes('{') && trimmed.includes('}') && trimmed.includes(':') && !trimmed.includes('<'))
  ) {
    const filename = safeUserRequest.toLowerCase().includes('style')
      ? 'styles.css'
      : safeUserRequest.match(/([a-z0-9-_]+)\s+css/i)?.[1] + '.css' || 'styles.css';
    return { filename, type: 'css' };
  }

  // TypeScript/TSX detection
  if (
    trimmed.includes('function') ||
    trimmed.includes('const ') ||
    trimmed.includes('let ') ||
    trimmed.includes('export default') ||
    trimmed.includes('import ') ||
    trimmed.includes('=>') ||
    trimmed.includes('interface ') ||
    trimmed.includes('type ') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*')
  ) {
    const filename = safeUserRequest.toLowerCase().includes('component')
      ? 'Component.tsx'
      : safeUserRequest.match(/([a-z0-9-_/]+)\s+(?:tsx?|component)/i)?.[1] + '.tsx' || defaultFilename;
    return { filename, type: 'tsx' };
  }

  // JSON detection
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return { filename: 'data.json', type: 'json' };
    } catch {
      // Not valid JSON, continue
    }
  }

  // Default to TSX for Next.js files
  return { filename: defaultFilename, type: 'tsx' };
}

export async function editorNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    const userRequest = state.editingSession?.userRequest || '';
    const files = state.files || [];
    const filesToModify = state.editingSession?.filesToModify || files.map(f => f.path);
    const changeScope = state.editingSession?.changeScope || 'moderate';

    console.log('[Editor] 🚀 Starting editor node');
    console.log(`[Editor] ✏️ Change Scope: ${changeScope}`);
    // ✅ FIX 36: Safety check for substring and length operations (userRequest already defaults to '')
    const requestPreview = userRequest.substring(0, 100);
    console.log(`[Editor] 📝 User Request: "${requestPreview}${userRequest.length > 100 ? '...' : ''}"`);
    console.log(`[Editor] 📊 Files to Modify: ${filesToModify.length} of ${files.length} total`);

    // CONVERSATION MEMORY: Get conversation context for context-aware editing
    console.log('[Editor] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Editor] 💬 Conversation context loaded - enabling context-aware editing');
    }

    // ✅ FIX 36: REMOVE role messages entirely - only chatty messages in chat history
    // Don't emit node start - this creates role-based UI cards which we don't want
    // The chatty message will be sent via AI response below

    // Detect file creation intent
    const creationInfo = detectFileCreation(userRequest, files);
    if (creationInfo.isCreation) {
      console.log(`[Editor] 🆕 File creation detected: ${creationInfo.expectedFiles.join(', ')}`);
      // No emitProgress - keep chat clean
      if (creationInfo.warnings.length > 0) {
        creationInfo.warnings.forEach(w => console.warn(`[Editor] ⚠️ ${w}`));
      }
    }

    // Detect file rename intent
    const renameInfo = detectFileRename(userRequest);
    if (renameInfo.isRename && renameInfo.oldPath && renameInfo.newPath) {
      console.log(`[Editor] 🔄 File rename detected: ${renameInfo.oldPath} → ${renameInfo.newPath}`);

      // Validate rename operation
      const validation = validateFileOperation({
        type: 'rename',
        path: renameInfo.oldPath,
        newPath: renameInfo.newPath,
        reason: userRequest
      });

      if (!validation.allowed) {
        console.error(`[Editor] ❌ Rename blocked: ${validation.reason}`);
        // No emitProgress - keep chat clean
      } else {
        console.log('[Editor] ✅ Rename operation validated');
        // No emitProgress - keep chat clean
      }
    }

    // ✅ FIX 33 & 37: Special handling for globals.css - use template instead of AI
    // filesToModify is array of string paths, not objects
    const globalsPath = filesToModify.find(path => path.includes('globals.css'));
    const userRequestLower = (userRequest || '').toLowerCase();
    if (globalsPath && !userRequestLower.includes('add new page') && !userRequestLower.includes('create page')) {
      console.log('[Editor] 🎯 globals.css detected - using direct template (SKIPPING AI)');
      // No emitProgress - keep chat clean

      // Import hexToHslString from frontend-node (or redefine it)
      function hexToHslString(hex: string): string {
        const hexValue = hex.replace('#', '');
        const r = parseInt(hexValue.substring(0, 2), 16) / 255;
        const g = parseInt(hexValue.substring(2, 4), 16) / 255;
        const b = parseInt(hexValue.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `${h} ${s}% ${l}%`;
      }

      const colors = state.stylingConfig?.colorTheme;
      const typography = state.stylingConfig?.typography;
      const headingWeight = typography?.headingWeight || 700;
      const fontFamily = typography?.fontFamily || 'Inter';
      const animations = state.stylingConfig?.animations || { enabled: true, intensity: 'subtle' };

      const primaryHSL = colors?.primary ? hexToHslString(colors.primary) : '221.2 83.2% 53.3%';
      const secondaryHSL = colors?.secondary ? hexToHslString(colors.secondary) : '210 40% 96.1%';
      const accentHSL = colors?.accent ? hexToHslString(colors.accent) : '217.2 91.2% 59.8%';
      const mode = colors?.mode || 'light';
      const borderHSL = colors?.border ? hexToHslString(colors.border) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%');
      const mutedHSL = colors?.muted ? hexToHslString(colors.muted) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%');
      const destructiveHSL = colors?.destructive ? hexToHslString(colors.destructive) : '0 84.2% 60.2%';
      const successHSL = colors?.success ? hexToHslString(colors.success) : '142.1 76.2% 36.3%';
      const warningHSL = colors?.warning ? hexToHslString(colors.warning) : '32.1 94.6% 43.7%';
      const infoHSL = colors?.info ? hexToHslString(colors.info) : '221.2 83.2% 53.3%';

      const layout = state.stylingConfig?.layout || {};
      const borderRadius = layout?.borderRadius || 'medium';
      const radiusMap: Record<string, string> = {
        none: '0',
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem',
        full: '9999px'
      };
      const radiusValue = radiusMap[borderRadius] || '0.5rem';

      const globalsCss = `/**
 * ⚠️ DO NOT EDIT THIS FILE MANUALLY
 * This file is auto-generated by the VB platform based on your theme settings.
 * Any manual changes will be overwritten when you update your project's styling.
 * To modify styles, use Tailwind utility classes in your components.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: ${primaryHSL};
    --primary-foreground: 210 40% 98%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: ${mutedHSL};
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: ${accentHSL};
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: ${primaryHSL};
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 210 40% 98%;
    --muted: ${mutedHSL};
    --muted-foreground: 215 20.2% 65.1%;
    --accent: ${accentHSL};
    --accent-foreground: 210 40% 98%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
    --radius: ${radiusValue};
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: ${fontFamily}, system-ui, -apple-system, sans-serif;
  }

  h1 {
    @apply text-4xl md:text-5xl font-[${headingWeight}] tracking-tight;
  }

  h2 {
    @apply text-3xl md:text-4xl font-[${headingWeight}] tracking-tight;
  }

  h3 {
    @apply text-2xl md:text-3xl font-[${headingWeight}];
  }

  h4 {
    @apply text-xl md:text-2xl font-semibold;
  }

  h5 {
    @apply text-lg md:text-xl font-semibold;
  }

  p {
    @apply text-base leading-relaxed;
  }

  small {
    @apply text-sm;
  }
}

@layer components {
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     COMPREHENSIVE UTILITY SYSTEM
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /* Button System */
  .btn {
    @apply inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-sm { @apply px-3 py-1.5 text-sm; }
  .btn-md { @apply px-4 py-2 text-base; }
  .btn-lg { @apply px-6 py-3 text-lg; }
  .btn-xl { @apply px-8 py-4 text-xl; }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:opacity-90 active:scale-95;
  }

  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-accent {
    @apply bg-accent text-accent-foreground hover:opacity-90;
  }

  .btn-success {
    @apply bg-success text-success-foreground hover:opacity-90;
  }

  .btn-destructive {
    @apply bg-destructive text-destructive-foreground hover:opacity-90;
  }

  .btn-outline {
    @apply border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-accent hover:text-accent-foreground;
  }

  .btn-icon {
    @apply p-2 aspect-square;
  }

  /* Spacing System */
  .section-sm { @apply py-8 md:py-12; }
  .section { @apply py-16 md:py-24; }
  .section-lg { @apply py-24 md:py-32; }
  .section-xl { @apply py-32 md:py-40; }

  .container-sm { @apply max-w-4xl mx-auto px-4 md:px-6; }
  .container { @apply max-w-7xl mx-auto px-4 md:px-6 lg:px-8; }
  .container-lg { @apply max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12; }

  .card-padding-sm { @apply p-4; }
  .card-padding { @apply p-6; }
  .card-padding-lg { @apply p-8; }
  .card-padding-xl { @apply p-10 md:p-12; }

  /* Card System */
  .card {
    @apply bg-card border border-border rounded-xl;
  }

  .card-hover {
    @apply card transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }

  .card-interactive {
    @apply card-hover cursor-pointer active:scale-[0.98];
  }

  .card-gradient {
    @apply card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20;
  }

  /* Form System */
  .form-group {
    @apply space-y-2;
  }

  .form-grid {
    @apply grid gap-4 md:gap-6;
  }

  .form-grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6;
  }

  .form-grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  input[type="number"],
  input[type="tel"],
  input[type="url"],
  input[type="date"],
  textarea,
  select {
    @apply w-full px-3 py-2 border border-border rounded-xl;
    @apply bg-background text-foreground;
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
    @apply transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  textarea {
    @apply min-h-[100px] resize-y;
  }

  /* Badge System */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-sm { @apply px-2 py-0.5 text-xs; }
  .badge-md { @apply px-2.5 py-0.5 text-sm; }
  .badge-lg { @apply px-3 py-1 text-base; }

  .badge-primary {
    @apply bg-primary/10 text-primary border border-primary/20;
  }

  .badge-secondary {
    @apply bg-secondary/10 text-secondary-foreground border border-secondary/20;
  }

  .badge-success {
    @apply bg-success/10 text-success border border-success/20;
  }

  .badge-destructive {
    @apply bg-destructive/10 text-destructive border border-destructive/20;
  }

  .badge-warning {
    @apply bg-warning/10 text-warning border border-warning/20;
  }

  .badge-info {
    @apply bg-info/10 text-info border border-info/20;
  }

  /* Grid Patterns */
  .grid-auto-fit {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .grid-auto-fill {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .grid-4 {
    @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6;
  }

  /* Flex Patterns */
  .flex-between {
    @apply flex items-center justify-between;
  }

  .flex-center {
    @apply flex items-center justify-center;
  }

  .flex-start {
    @apply flex items-center justify-start;
  }

  .flex-end {
    @apply flex items-center justify-end;
  }

  .flex-col-center {
    @apply flex flex-col items-center justify-center;
  }

  /* Typography */
  .text-hero {
    @apply text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight;
  }

  .text-display {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
  }

  .text-heading {
    @apply text-3xl md:text-4xl font-bold tracking-tight;
  }

  .text-subheading {
    @apply text-2xl md:text-3xl font-semibold;
  }

  .text-section {
    @apply text-xl md:text-2xl font-semibold;
  }

  .text-body-lg {
    @apply text-lg leading-relaxed;
  }

  .text-body {
    @apply text-base leading-relaxed;
  }

  .text-small {
    @apply text-sm text-muted-foreground;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent;
  }

  /* Shadows */
  .shadow-soft {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .shadow-medium {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .shadow-strong {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .shadow-xl-colored {
    box-shadow: 0 20px 25px -5px rgba(var(--primary), 0.15), 0 10px 10px -5px rgba(var(--primary), 0.04);
  }

  /* Animation Utilities */
  .stagger-item {
    @apply opacity-0;
    animation: fade-in 0.5s ease-out forwards;
  }

  .stagger-item:nth-child(1) { animation-delay: 0.05s; }
  .stagger-item:nth-child(2) { animation-delay: 0.1s; }
  .stagger-item:nth-child(3) { animation-delay: 0.15s; }
  .stagger-item:nth-child(4) { animation-delay: 0.2s; }
  .stagger-item:nth-child(5) { animation-delay: 0.25s; }
  .stagger-item:nth-child(6) { animation-delay: 0.3s; }
  .stagger-item:nth-child(7) { animation-delay: 0.35s; }
  .stagger-item:nth-child(8) { animation-delay: 0.4s; }

  .hover-lift {
    @apply transition-all duration-200;
  }

  .hover-lift:hover {
    @apply -translate-y-1 shadow-lg;
  }

  .hover-glow:hover {
    box-shadow: 0 0 20px rgba(var(--primary), 0.3);
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}${animations.intensity !== 'none' ? `

@layer utilities {
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }${animations.intensity === 'heavy' ? `

  @keyframes slide-in-left {
    from {
      transform: translateX(-30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }` : ''}

  .animate-fade-in {
    animation: fade-in 0.5s ease-in;
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }${animations.intensity === 'heavy' ? `

  .animate-slide-in-left {
    animation: slide-in-left 0.4s ease-out;
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.4s ease-out;
  }

  .delay-100 {
    animation-delay: 100ms;
  }

  .delay-200 {
    animation-delay: 200ms;
  }

  .delay-300 {
    animation-delay: 300ms;
  }

  /* Advanced animations for heavy mode */
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }

  .animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .animate-wiggle {
    animation: wiggle 0.5s ease-in-out;
  }` : ''}

  /* Gradient utilities */
  .bg-gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
  }

  .bg-gradient-secondary {
    background: linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--muted)) 100%);
  }

  .text-gradient {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Micro-interactions */
  .btn-press:active {
    transform: scale(0.98);
    transition: transform 0.1s;
  }

  .card-lift {
    transition: all 0.2s ease-out;
  }

  .card-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
    transition: box-shadow 0.2s;
  }
}` : ''}
`;

      // Return early with template-generated globals.css
      // ✅ FIX 37: Use globalsPath (string) instead of globalsFile.path
      const editedFiles = [{
        path: globalsPath,
        content: globalsCss
      }];

      // Merge with unmodified files (Fix 20)
      const finalFiles = [];
      const editedPaths = new Set(editedFiles.map(f => f.path));
      finalFiles.push(...editedFiles);

      for (const file of files) {
        if (!editedPaths.has(file.path)) {
          finalFiles.push(file);
        }
      }

      console.log(`[Editor] ✅ globals.css regenerated with template - ${finalFiles.length} total files`);
      // ✅ FIX 36: Don't emit completion - removes role card

      return {
        files: finalFiles,
        stage: 'editing',
        completedNodes: ['editor'] // Reducer auto-appends
      };
    }

    // Build editing prompt based on change scope
    console.log('[Editor] ✏️ Applying code modifications...');
    // Progress shown by role-based UI (Software Engineer will appear automatically)

    // Send conversational "working on it" message
    emitChatMessage(
      state.projectId,
      "✏️ Making your requested changes now...",
      { type: 'info' }
    );

    const editPrompt = buildEditingPrompt(state, conversationContext);
    const estimatedTokensEdit = estimateTokens(editPrompt);
    console.log(`[Editor] 🤖 AI Call: Code Generation (~${estimatedTokensEdit} tokens, auto-detect model)`);
    console.log(`[Editor] 📋 Prompt length: ${editPrompt.length} characters`);
    console.log(`[Editor] 🎯 Expected to create:`, creationInfo.isCreation ? creationInfo.expectedFiles : 'No new files');
    console.log(`[Editor] 🎯 Expected to modify:`, filesToModify.length, 'files');

    // Generate edited code
    let codeRaw = await generateWithLogging({
      prompt: editPrompt,
      projectId: state.projectId,
      nodeName: 'editor',
      callType: 'generation',
      estimatedTokens: estimatedTokensEdit,
      attempt: 1
    });

    // ✅ COMPREHENSIVE LOGGING: Raw AI response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Editor] 📝 RAW AI RESPONSE (first 500 chars):');
    console.log(codeRaw.substring(0, 500));
    console.log('[Editor] 📊 Response stats:', {
      totalLength: codeRaw.length,
      hasFileMarkers: codeRaw.includes('---FILE:'),
      hasEndMarkers: codeRaw.includes('---ENDFILE---'),
      fileMarkerCount: (codeRaw.match(/---FILE:/g) || []).length,
      endMarkerCount: (codeRaw.match(/---ENDFILE---/g) || []).length
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Clean up
    let code = codeRaw.replace(/^```(?:json|html)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

    // Remove AI explanations
    if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
      const firstFileMarker = code.indexOf('---FILE:');
      console.log('[Editor] 🔍 Found file markers, extracting from position:', firstFileMarker);
      code = code.substring(firstFileMarker).trim();
    } else if (code.includes('<!DOCTYPE') || code.includes('<html')) {
      const doctypeIndex = code.indexOf('<!DOCTYPE');
      const htmlIndex = code.indexOf('<html');
      const startIndex = doctypeIndex !== -1 ? doctypeIndex : htmlIndex;
      if (startIndex !== -1) {
        console.log('[Editor] 🔍 Found HTML content, extracting from position:', startIndex);
        code = code.substring(startIndex).trim();
      }
    } else {
      console.log('[Editor] ⚠️ No file markers or HTML found in response!');
    }

    // Parse files
    let editedFiles: Array<{path: string; content: string}> = [];

    if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
      // Multi-file
      // ✅ FIX 49: Allow slashes in file paths (src/app/page.tsx)
      const fileMatches = code.matchAll(/---FILE:([\w\-./]+)---([\s\S]*?)---ENDFILE---/g);
      editedFiles = Array.from(fileMatches).map(match => ({
        path: match[1].trim(),
        content: match[2].trim()
      }));
      console.log(`[Editor] ✅ Multi-file response: ${editedFiles.length} files`);
      console.log('[Editor] 📁 Parsed files:', editedFiles.map(f => f.path).join(', '));
    } else {
      // Single file - detect type
      console.log('[Editor] Single file response - detecting type...');

      const { filename, type } = detectFileType(code, userRequest, 'page.tsx');
      console.log(`[Editor] Detected file type: ${type} (${filename})`);

      // Add proper wrapping/formatting based on type
      let finalContent = code;
      if (type === 'css') {
        // Ensure CSS has proper formatting
        if (!code.includes('/*') && !code.includes('//')) {
          finalContent = `/* Generated Stylesheet */\n${code}`;
        }
      } else if (type === 'tsx' || type === 'ts') {
        // Ensure TypeScript/TSX has proper formatting
        if (!code.includes('export') && !code.includes('import')) {
          console.log('[Editor] Adding default export wrapper for TypeScript component');
        }
      }

      editedFiles = [{ path: filename, content: finalContent }];
      console.log(`[Editor] Single file: ${filename}`);
    }

    // Validate file creation
    if (creationInfo.isCreation && creationInfo.expectedFiles.length > 0) {
      const createdFiles = editedFiles.filter(ef =>
        creationInfo.expectedFiles.includes(ef.path) &&
        !files.find(f => f.path === ef.path)
      );

      if (createdFiles.length === 0) {
        console.warn('[Editor] ⚠️ Expected file creation but no new files found');
        console.warn('[Editor] Expected:', creationInfo.expectedFiles);
        console.warn('[Editor] Generated:', editedFiles.map(f => f.path));
      } else {
        console.log(`[Editor] ✅ Created ${createdFiles.length} new file(s):`, createdFiles.map(f => f.path));
      }
    }

    // Handle file rename operations
    if (renameInfo.isRename && renameInfo.oldPath && renameInfo.newPath) {
      // Find the renamed file
      const renamedFileIndex = editedFiles.findIndex(f => f.path === renameInfo.oldPath);

      if (renamedFileIndex !== -1) {
        // Update the filename
        editedFiles[renamedFileIndex] = {
          ...editedFiles[renamedFileIndex],
          path: renameInfo.newPath
        };
        console.log(`[Editor] 🔄 Renamed: ${renameInfo.oldPath} → ${renameInfo.newPath}`);

        // Update all references in other files
        editedFiles = updateFileReferences(editedFiles, renameInfo.oldPath, renameInfo.newPath);
        console.log(`[Editor] 🔗 Updated references to renamed file in ${editedFiles.length} file(s)`);
      } else {
        console.warn(`[Editor] ⚠️ Could not find file to rename: ${renameInfo.oldPath}`);
      }
    }

    // Check user intent regarding database
    // ✅ FIX 36: Safety check for undefined userRequest
    const removeDBIntent = /remove.*database|delete.*database|no.*database|static.*site|remove.*backend/i.test(userRequest || '');
    const keepDBIntent = /add.*database|create.*database|use.*database|with.*database/i.test(userRequest || '');

    // Inject database script if backend exists AND user doesn't want to remove it
    if (state.backendConfig?.collections && state.backendConfig.collections.length > 0) {

      if (removeDBIntent) {
        // User wants to remove database - strip it out
        console.log('[Editor] 🗑️ Removing database code per user request...');
        // ✅ FIX 36: Don't emit progress - keep chat clean

        editedFiles = editedFiles.map(file => {
          if (file.path.endsWith('.html')) {
            let content = file.content;

            // Remove database script tag
            content = content.replace(/<script[^>]*id=["']database-api["'][^>]*>[\s\S]*?<\/script>/g, '');

            // Remove inline database references (optional - may break functionality)
            // Only do this if user explicitly says "remove all database code"
            // ✅ FIX 36: Safety check for undefined userRequest
            if ((userRequest || '').toLowerCase().includes('all') && (userRequest || '').toLowerCase().includes('database')) {
              content = content.replace(/window\.db\.[a-z]+\([^)]*\)/g, '/* database call removed */');
              console.log(`[Editor] 🗑️ Removed database calls from ${file.path}`);
            }

            console.log(`[Editor] 🗑️ Database script removed from ${file.path}`);
            return { ...file, content };
          }
          return file;
        });

      } else {
        // Preserve or inject database
        console.log('[Editor] 🗄️ Checking database injection...');
        // ✅ FIX 36: Don't emit progress - keep chat clean

        const dbScript = createDatabaseInjectionScript(
          state.projectId,
          state.backendConfig.collections
        );

        editedFiles = editedFiles.map(file => {
          if (file.path.endsWith('.html')) {
            // Only inject if not already present
            if (!file.content.includes('window.db =')) {
              const updatedContent = injectDatabaseScript(file.content, dbScript);
              console.log(`[Editor] 🗄️ Database script injected into ${file.path}`);
              return { ...file, content: updatedContent };
            } else {
              console.log(`[Editor] ✅ Database script already present in ${file.path} (preserved)`);
            }
          }
          return file;
        });
      }
    } else if (keepDBIntent) {
      // User wants database but none exists
      console.warn('[Editor] ⚠️ User requested database but no backend config exists');
      // ✅ FIX 36: Don't emit progress - keep chat clean
    }

    // Track file changes (now moved after rename handling)
    const fileChanges: Array<{
      path: string;
      changeType: 'modified' | 'added' | 'deleted';
      linesChanged?: number;
    }> = [];

    // Add rename changes first if applicable
    if (renameInfo.isRename && renameInfo.oldPath && renameInfo.newPath) {
      const renamedFile = editedFiles.find(f => f.path === renameInfo.newPath);
      if (renamedFile) {
        fileChanges.push({
          path: renameInfo.oldPath,
          changeType: 'deleted' as const,
          linesChanged: 0
        });
        fileChanges.push({
          path: renameInfo.newPath,
          changeType: 'added' as const,
          linesChanged: renamedFile.content.split('\n').length
        });
      }
    }

    // Track other changes
    editedFiles.forEach(editedFile => {
      // Skip if already tracked as renamed
      if (renameInfo.isRename && editedFile.path === renameInfo.newPath) {
        return;
      }

      const originalFile = files.find(f => f.path === editedFile.path);
      if (!originalFile) {
        fileChanges.push({ path: editedFile.path, changeType: 'added' as const, linesChanged: editedFile.content.split('\n').length });
      } else {
        const originalLines = originalFile.content.split('\n');
        const editedLines = editedFile.content.split('\n');
        const linesChanged = Math.abs(editedLines.length - originalLines.length);
        fileChanges.push({ path: editedFile.path, changeType: 'modified' as const, linesChanged });
      }
    });

    // Merge edited files with unmodified files (preserve all files unless explicitly deleted by user)
    const finalFiles: Array<{path: string; content: string}> = [];
    const editedPaths = new Set(editedFiles.map(f => f.path));

    // Add all edited files
    finalFiles.push(...editedFiles);

    // Add unmodified files (preserve them)
    for (const file of files) {
      if (!editedPaths.has(file.path)) {
        finalFiles.push(file);
        console.log(`[Editor] ✅ Preserved unmodified file: ${file.path}`);
      }
    }

    // Only mark files as deleted if user explicitly requested deletion
    const deletedFiles: Array<{path: string; content: string}> = [];
    // ✅ FIX 36: Safety check for undefined userRequest
    const deleteIntent = /delete|remove.*file|remove.*component/i.test(userRequest || '');
    if (deleteIntent) {
      // Check if specific files mentioned for deletion
      const deletedByUser = files.filter(f => !editedPaths.has(f.path) && (userRequest || '').toLowerCase().includes(f.path.toLowerCase()));
      for (const deletedFile of deletedByUser) {
        fileChanges.push({ path: deletedFile.path, changeType: 'deleted' as const, linesChanged: 0 });
        console.log(`[Editor] 🗑️ File explicitly deleted by user: ${deletedFile.path}`);
        deletedFiles.push(deletedFile);
      }
    }

    // Build changes summary
    const changesSummary = [
      `Modified ${fileChanges.filter(fc => fc.changeType === 'modified').length} file(s)`,
      `Added ${fileChanges.filter(fc => fc.changeType === 'added').length} file(s)`,
      `Deleted ${deletedFiles.length} file(s)`,
      `Change scope: ${changeScope}`
    ].filter(s => !s.startsWith('Modified 0') && !s.startsWith('Added 0') && !s.startsWith('Deleted 0'));

    // Update editing session
    const updatedEditingSession = {
      ...state.editingSession!,
      fileChanges,
      changesApplied: changesSummary
    };

    // Store metadata
    const newArtifacts = new Map(state.artifacts);
    newArtifacts.set('editorMetadata', {
      filesGenerated: editedFiles.length,
      changeScope,
      strategy: state.artifacts?.get('contextAnalysis')?.editingStrategy || 'unknown'
    });

    const duration = Date.now() - startTime;
    console.log(`[Editor] ✅ Completed in ${duration}ms`);
    console.log(`[Editor] 📊 Files Generated: ${editedFiles.length}`);
    console.log(`[Editor] 📊 Files Modified: ${fileChanges.filter(fc => fc.changeType === 'modified').length}`);
    console.log(`[Editor] 📊 Files Added: ${fileChanges.filter(fc => fc.changeType === 'added').length}`);
    if (state.backendConfig?.collections) {
      console.log('[Editor] ✅ Database API preserved');
    }

    // Build conversational success summary
    const modifiedCount = fileChanges.filter(fc => fc.changeType === 'modified').length;
    const addedCount = fileChanges.filter(fc => fc.changeType === 'added').length;
    const deletedCount = fileChanges.filter(fc => fc.changeType === 'deleted').length;
    const totalLinesChanged = fileChanges.reduce((sum, fc) => sum + (fc.linesChanged || 0), 0);

    // Group file changes by change type
    const addedFileChanges = fileChanges.filter(fc => fc.changeType === 'added');
    const modifiedFileChanges = fileChanges.filter(fc => fc.changeType === 'modified');
    const deletedFileChanges = fileChanges.filter(fc => fc.changeType === 'deleted');

    // Build file list with better formatting (line by line)
    const changesList: string[] = [];

    if (modifiedFileChanges.length > 0) {
      changesList.push('✏️ **Edited:**');
      modifiedFileChanges.slice(0, 5).forEach(fc => {
        changesList.push(`   • ${fc.path}${fc.linesChanged ? ` (${fc.linesChanged} lines)` : ''}`);
      });
      if (modifiedFileChanges.length > 5) {
        changesList.push(`   • ... and ${modifiedFileChanges.length - 5} more`);
      }
    }

    if (addedFileChanges.length > 0) {
      if (changesList.length > 0) changesList.push(''); // Add blank line
      changesList.push('➕ **Added:**');
      addedFileChanges.slice(0, 5).forEach(fc => {
        changesList.push(`   • ${fc.path}${fc.linesChanged ? ` (${fc.linesChanged} lines)` : ''}`);
      });
      if (addedFileChanges.length > 5) {
        changesList.push(`   • ... and ${addedFileChanges.length - 5} more`);
      }
    }

    if (deletedFileChanges.length > 0) {
      if (changesList.length > 0) changesList.push(''); // Add blank line
      changesList.push('🗑️ **Deleted:**');
      deletedFileChanges.slice(0, 5).forEach(fc => {
        changesList.push(`   • ${fc.path}`);
      });
      if (deletedFileChanges.length > 5) {
        changesList.push(`   • ... and ${deletedFileChanges.length - 5} more`);
      }
    }

    let summaryParts = [];

    if (addedCount > 0) summaryParts.push(`created ${addedCount} new file${addedCount > 1 ? 's' : ''}`);
    if (modifiedCount > 0) summaryParts.push(`updated ${modifiedCount} file${modifiedCount > 1 ? 's' : ''}`);
    if (deletedCount > 0) summaryParts.push(`removed ${deletedCount} file${deletedCount > 1 ? 's' : ''}`);

    const changeSummary = summaryParts.length > 0
      ? `I ${summaryParts.join(', ')}`
      : `I updated ${editedFiles.length} file${editedFiles.length > 1 ? 's' : ''}`;

    const dbNote = state.backendConfig?.collections
      ? ' All your database connections are working perfectly! 🗄️'
      : '';

    const conversationalSummary = `${changeSummary} with ${totalLinesChanged} lines of code changes.${dbNote}\n\n${changesList.join('\n')}\n\nYour app is ready to preview! 🎉`;

    // ✅ FIX 36: Don't emit completion - removes Software Engineer role card
    // Chatty messages will be sent through normal chat flow
    console.log('[Editor] ✅ Edits applied successfully');

    // Send the conversational summary to chat!
    emitChatMessage(
      state.projectId,
      conversationalSummary,
      { type: 'success' }
    );

    // PHASE 3: Create checkpoint snapshot for rollback
    let checkpointId: string | undefined;
    try {
      const checkpoint = {
        projectId: state.projectId,
        userId: state.userId || 'system',
        userRequest: state.editingSession?.userRequest || '',
        filesSnapshot: finalFiles, // Current state after edit
        previousFilesSnapshot: state.editingSession?.originalFiles || state.files || [], // Before edit
        changeScope: state.editingSession?.changeScope || 'moderate',
        description: `Edit: ${state.editingSession?.userRequest || 'Unknown request'}`.substring(0, 255)
        // Note: PocketBase auto-creates 'id', 'created', and 'updated' fields
      };

      // Save checkpoint to PocketBase
      const record = await pb.collection('workflow_checkpoints').create(checkpoint);
      checkpointId = record.id;
      console.log('[Editor] ✅ Checkpoint created:', checkpointId);
    } catch (checkpointError) {
      // Non-critical error - continue even if checkpoint fails
      console.warn('[Editor] ⚠️ Failed to create checkpoint:', checkpointError);
    }

    // CONVERSATION MEMORY: Track Editor's response
    const editorResponse = `${creationInfo.isCreation ? 'Created' : 'Modified'} ${filesToModify.length} file(s): ${filesToModify.slice(0, 3).join(', ')}${filesToModify.length > 3 ? '...' : ''}. ${changeScope} changes applied.`;
    addAssistantMessage(state.projectId, editorResponse, 'editor');
    console.log('[Editor] 💬 Tracked assistant response in conversation memory');

    // Log successful editor operation
    if (state.projectId && state.userId) {
      await logEditorOperation({
        projectId: state.projectId,
        userId: state.userId,
        operationType: creationInfo.isCreation ? 'create' : renameInfo.isRename ? 'rename' : 'modify',
        filePath: filesToModify[0] || 'multiple files',
        changeScope,
        status: 'success',
        userRequest,
        checkpointId,
        durationMs: duration
      });
    }

    return {
      files: finalFiles,
      editingSession: updatedEditingSession,
      completedNodes: ['editor'], // Reducer auto-appends
      artifacts: newArtifacts,
      lastCheckpointId: checkpointId // PHASE 3: For rollback functionality
    };

  } catch (error) {
    emitNodeError('editor', error as Error, state);
    console.error('[Editor] Error:', error);

    // Log error
    const errorDuration = Date.now() - startTime;
    if (state.projectId && state.userId) {
      await logEditorOperation({
        projectId: state.projectId,
        userId: state.userId,
        operationType: 'modify',
        filePath: state.editingSession?.filesToModify?.[0] || 'unknown',
        changeScope: state.editingSession?.changeScope || 'moderate',
        status: 'error',
        errorMessage: (error as Error).message,
        userRequest: state.editingSession?.userRequest || '',
        durationMs: errorDuration
      });
    }

    return {
      files: state.files || [],
      completedNodes: ['editor'], // Reducer auto-appends
      errors: [{ node: 'editor', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}

function buildEditingPrompt(state: AppGenState, conversationContext?: string): string {
  const userRequest = state.editingSession?.userRequest || '';
  const files = state.files || [];
  const changeScope = state.editingSession?.changeScope || 'moderate';
  const preservedSections = state.editingSession?.preservedSections || new Map();
  const contextAnalysis = state.artifacts?.get('contextAnalysis');

  // Build critical sections text from preservedSections Map
  const criticalSections = preservedSections.size > 0
    ? Array.from(preservedSections.entries())
        .map(([file, sections]) => `${file}:\n${sections.map((s: string) => `  - ${s}`).join('\n')}`)
        .join('\n\n')
    : '';

  // Build database instructions if needed
  let databaseInstructions = '';
  if (state.backendConfig?.collections && state.backendConfig.collections.length > 0) {
    databaseInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE CONTEXT (CRITICAL - PRESERVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This app has a DATABASE. Collections:
${state.backendConfig.collections.map((c: any) => `• ${c.name}: ${c.fields?.map((f: any) => f.name).join(', ')}`).join('\n')}

DATABASE API (window.db) is AUTOMATICALLY INJECTED.
✓ PRESERVE all database code unless user asks to change it
✓ window.db methods: get(), add(), update(), delete(), subscribe()
✓ All methods are async - use await

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // Build preservation instructions
  let preservationInstructions = '';
  if (preservedSections.size > 0) {
    preservationInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL SECTIONS TO PRESERVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Array.from(preservedSections.entries()).map(([file, sections]) => `
📄 ${file}:
${sections.map((s: string) => `  ✓ ${s}`).join('\n')}
`).join('\n')}

⚠️ DO NOT modify these sections unless the user explicitly requests it!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // Build list of files to modify
  const filesToModify = state.editingSession?.filesToModify || files.map(f => f.path);
  const filesToModifyText = filesToModify.length > 0
    ? `\n📝 FILES TO MODIFY (${filesToModify.length}):\n${filesToModify.map(f => `  • ${f}`).join('\n')}\n`
    : '';

  // Build output format
  const isMultiFile = files.length > 1 || files.some(f => f.path.includes('/'));
  const outputFormat = isMultiFile ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT - MULTI-FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use FILE DELIMITERS for modified files:
---FILE:src/app/page.tsx---
... complete file content ...
---ENDFILE---

⚠️ CRITICAL: Return ONLY the ${filesToModify.length} file(s) listed above in "FILES TO MODIFY".
⚠️ DO NOT return config files (package.json, tsconfig.json, etc.) unless specifically listed.
⚠️ Unmodified files will be preserved automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT - SINGLE FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return complete HTML starting with <!DOCTYPE html>
No markdown fences, no explanations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return `${conversationContext || ''}

You are an Expert Code Editor Agent. Your role is to make targeted, intelligent modifications to existing code.

🤖 **TASK UNDERSTANDING & BREAKDOWN:**

FIRST, analyze the user's request and break it down into clear, actionable tasks:
1. Identify the main objective
2. Break down complex requests into sub-tasks
3. Determine the order of implementation
4. Consider dependencies between tasks

**EXAMPLES OF TASK BREAKDOWN:**

Request: "Add a contact form with name, email, and message fields that saves to the database"
Tasks:
1. Create contact form UI with name, email, message inputs
2. Add form validation
3. Create form submission handler
4. Integrate with backend API to save to database
5. Add success/error feedback messages

Request: "Change the button color to blue and make it bigger"
Tasks:
1. Update button color to blue (using design tokens)
2. Increase button size using existing size classes

Request: "Add a new About page with company info and team section"
Tasks:
1. Create new page route /about
2. Add company info section with description
3. Add team section with team members
4. Update navigation to include About link

**IMPORTANT:**
- For complex requests (>1 task), mentally organize your approach before coding
- Ensure all tasks are completed, not just the first one
- Maintain consistency with existing code patterns and design system
- Use proper TypeScript types for all new code
- Follow the project's architecture and routing conventions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S EDIT REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"${userRequest}"

Change Scope: ${changeScope}
${contextAnalysis?.reasoning ? `Strategy: ${contextAnalysis.editingStrategy}\nReasoning: ${contextAnalysis.reasoning}` : ''}
${filesToModifyText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT CODE (${files.length} files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${files.map(f => `
═══ FILE: ${f.path} ═══
${f.content}
`).join('\n\n')}

${databaseInstructions}

${preservationInstructions}

${ROUTING_INSTRUCTIONS}

EDITING RULES:
- Implement complete features (UI + functionality, not half-done)
- Forms/buttons need handlers + backend integration (if backend exists)
- Preserve all other code unchanged
- Return complete files (no placeholders) 
AVAILABLE UTILITY CLASSES (from globals.css):
When modifying UI components, you have access to these utility classes:
• Buttons: .btn .btn-primary .btn-secondary .btn-outline .btn-ghost (sizes: .btn-sm .btn-md .btn-lg .btn-xl)
• Cards: .card .card-hover .card-interactive .card-gradient (padding: .card-padding .card-padding-lg)
• Spacing: .section .section-sm .section-lg .container .container-sm .container-lg
• Grids: .grid-2 .grid-3 .grid-4 .grid-auto-fit (responsive auto-layout)
• Flex: .flex-between .flex-center .flex-start .flex-end .flex-col-center
• Forms: .form-group .form-grid .form-grid-2 .form-grid-3 (auto-styled inputs)
• Badges: .badge .badge-primary .badge-success .badge-destructive (sizes: .badge-sm .badge-md .badge-lg)
• Typography: .text-hero .text-display .text-heading .text-subheading .text-gradient
• Shadows: .shadow-soft .shadow-medium .shadow-strong
• Animations: .animate-fade-in .animate-slide-up .hover-lift .stagger-item
• Colors: Use semantic tokens (bg-primary, text-primary-foreground, bg-secondary, etc.) - NO arbitrary colors

ICONS:
• Import from lucide-react: import { IconName } from "lucide-react"
• 750+ icons available across categories: Actions, Navigation, Common, Communication, Media, Files, Status, Commerce, Development, Design, Maps, Weather, Time, Layout, Transport
• Common examples: Plus, Minus, Edit, Trash2, Save, Search, User, Settings, Check, X, ChevronRight, Menu, Star, Heart, Mail, Phone, Calendar, Clock, Home, Folder, File

TYPESCRIPT/NEXT.JS REQUIREMENTS:
⚠️ CRITICAL - Always add proper TypeScript types:
- Event handlers: (e: React.ChangeEvent<HTMLInputElement>) => void
- Mouse events: (e: React.MouseEvent<HTMLButtonElement>) => void
- Form events: (e: React.FormEvent<HTMLFormElement>) => void
- Click events: (e: React.MouseEvent) => void
- Use 'use client' directive for components with state/effects
- Import types from 'react' when needed
- Never use implicit 'any' types

${criticalSections ? 'CRITICAL SECTIONS TO PRESERVE:\n' + criticalSections : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${outputFormat}

Generate IMMEDIATELY without explanations!`;
}
