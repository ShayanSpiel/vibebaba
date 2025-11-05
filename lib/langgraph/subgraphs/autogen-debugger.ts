// lib/langgraph/subgraphs/autogen-debugger.ts
import { validateCode } from '@/lib/validation';
import { detectPlaceholders } from '@/lib/validation/placeholder-detector';
import { generateWithFallback } from '@/lib/ai';
import type { FileOperation } from '@/lib/file-operation-guards';
import {
  validateFileOperation,
  filterOperations,
  logFileOperation,
} from '@/lib/file-operation-guards';
import {
  emitAutoGenAttemptStart,
  emitAutoGenAgentStart,
  emitAutoGenAgentComplete,
  emitAutoGenErrorDiff,
  emitProgress
} from '../events';
import { generateWithLogging, estimateTokens } from '../ai-with-logging';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';

interface DebugContext {
  files: Array<{ path: string; content: string }>;
  validationResult: any;
  projectContext: {
    projectId: string;
    userId: string;
    plan: string;
    description: string;
    backendConfig?: any;
    context?: any;
    isMultiPage: boolean;
    expectedPages: string[];
    designSystemPrompt?: string;
  };
}

interface DebugResult {
  success: boolean;
  files: Array<{ path: string; content: string }>;
  validationResult: any;
  attempts: number;
  collaborationLog: string[];
  fileOperations?: FileOperation[]; // ✅ ADD FILE OPERATIONS
}

export async function autoGenDebugWorkflow(context: DebugContext): Promise<DebugResult> {
  console.log('[AutoGen Debugger] Initializing multi-agent debugging workflow...');
  console.log('[AutoGen Debugger] 📊 Prompt Strategy: SIMPLIFIED (trust AI, minimal rules)');

  // CONVERSATION MEMORY: Get conversation context for debugging
  console.log('[AutoGen Debugger] 💬 Loading conversation memory...');
  const conversationContext = getConversationContext(context.projectContext.projectId);
  if (conversationContext) {
    console.log('[AutoGen Debugger] 💬 Conversation context loaded - will pass to all debugging agents');
  }

  // Check if errors are too severe to fix (structural HTML issues)
  // INCREASED from 15 to 100 to handle cases with many minor validation issues
  // AutoGen is effective at fixing validation errors, even in bulk
  const errorCount = context.validationResult.report?.errors?.length || 0;
  const MAX_ERRORS_THRESHOLD = 100;

  if (errorCount > MAX_ERRORS_THRESHOLD) {
    console.log(`[AutoGen Debugger] ⚠️  ${errorCount} errors detected - likely severe structural issues from initial generation`);
    console.log('[AutoGen Debugger] 💡 Skipping AutoGen - recommend regenerating with improved prompt');
    return {
      success: false,
      files: context.files,
      validationResult: context.validationResult,
      attempts: 0,
      collaborationLog: [`Skipped AutoGen: Too many structural errors (>${MAX_ERRORS_THRESHOLD}). Root cause is poor initial HTML generation.`],
      fileOperations: []
    };
  }

  // OPTIMIZATION: Configurable max attempts with environment variable
  const MAX_ATTEMPTS = parseInt(process.env.AUTOGEN_MAX_ATTEMPTS || '3', 10);
  const collaborationLog: string[] = [];
  const allFileOperations: FileOperation[] = []; // ✅ TRACK FILE OPERATIONS
  let currentFiles = context.files;
  let currentValidation = context.validationResult;
  let attempt = 0;

  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[AutoGen Debugger] Attempt ${attempt}/${MAX_ATTEMPTS}`);

    // Emit attempt start event
    emitAutoGenAttemptStart(
      context.projectContext.projectId,
      attempt,
      MAX_ATTEMPTS,
      currentValidation.report.errors.length
    );

    // Step 1: Code Analyst Agent analyzes errors
    const agentStartTime1 = Date.now();
    const errorCount = currentValidation.report.errors.length;
    emitAutoGenAgentStart(
      context.projectContext.projectId,
      attempt,
      'analyst',
      `Inspecting code to find ${errorCount} issue${errorCount > 1 ? 's' : ''}...`
    );

    const analysisPrompt = buildAnalysisPrompt(currentFiles, currentValidation, context.projectContext);
    const analysis = await generateWithLogging({
      prompt: analysisPrompt,
      projectId: context.projectContext.projectId,
      nodeName: 'qa-autogen-analyst',
      callType: 'analysis',
      estimatedTokens: estimateTokens(analysisPrompt),
      attempt
    });

    collaborationLog.push(`[Attempt ${attempt}] Analyst: ${analysis.substring(0, 200)}...`);

    emitAutoGenAgentComplete(
      context.projectContext.projectId,
      attempt,
      'analyst',
      Date.now() - agentStartTime1,
      { summary: analysis.substring(0, 500) }
    );

    // Step 2: Code Fixer Agent generates fixes
    const agentStartTime2 = Date.now();
    emitAutoGenAgentStart(
      context.projectContext.projectId,
      attempt,
      'fixer',
      `Fixing ${errorCount} code issue${errorCount > 1 ? 's' : ''}...`
    );

    const fixPrompt = buildFixPrompt(currentFiles, analysis, context.projectContext);
    const fixedCodeText = await generateWithLogging({
      prompt: fixPrompt,
      projectId: context.projectContext.projectId,
      nodeName: 'qa-autogen-fixer',
      callType: 'fix',
      estimatedTokens: estimateTokens(fixPrompt),
      attempt
    });

    // Parse fixed files
    const fixedFiles = parseFixedFiles(fixedCodeText, currentFiles);
    collaborationLog.push(`[Attempt ${attempt}] Fixer: Generated ${fixedFiles.length} fixed files`);

    // CRITICAL: Check for reasoning tags leaking into output
    const reasoningTagPattern = /<\/?(?:think|thinking|reasoning|analysis)>/gi;
    const hasReasoningTags = fixedFiles.some(file => reasoningTagPattern.test(file.content));
    if (hasReasoningTags) {
      console.error(`[AutoGen Debugger] ❌ REJECTED: Fixer included reasoning tags (</think>, </reasoning>, etc.)!`);
      collaborationLog.push(`[Attempt ${attempt}] REJECTED: Reasoning tags leaked into output`);
      continue;
    }

    // CRITICAL: Check for placeholder/nonsense content before validation using the official detector
    const placeholderErrors = fixedFiles.flatMap(file => detectPlaceholders(file.content, file.path));
    if (placeholderErrors.length > 0) {
      console.error(`[AutoGen Debugger] ❌ REJECTED: Fixer generated ${placeholderErrors.length} placeholder/nonsense content!`);
      const errorMessages = placeholderErrors.slice(0, 3).map(e => `${e.file}:${e.line} - ${e.message}`);
      console.error(`[AutoGen Debugger] Found: ${errorMessages.join(', ')}`);
      collaborationLog.push(`[Attempt ${attempt}] REJECTED: Placeholder content detected - ${errorMessages[0]}`);

      // Continue to next attempt without using these files
      continue;
    }

    // CRITICAL: Check for duplicate imports
    const duplicateImportErrors: string[] = [];
    for (const file of fixedFiles) {
      // Check for duplicate named imports in single statement: import { X, X } from 'y'
      const duplicateNamedImports = file.content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"]/g);
      if (duplicateNamedImports) {
        for (const importStatement of duplicateNamedImports) {
          const names = importStatement.match(/{\s*([^}]+)\s*}/)?.[1]
            .split(',')
            .map(n => n.trim())
            .filter(n => n.length > 0);
          if (names) {
            const unique = new Set(names);
            if (unique.size < names.length) {
              duplicateImportErrors.push(`${file.path}: Duplicate named imports in statement: ${importStatement.substring(0, 100)}`);
            }
          }
        }
      }

      // Check for multiple import statements from same module
      const importLines = file.content.split('\n').filter(line => /^import\s+.*from\s+['"]/.test(line.trim()));
      const moduleImports = new Map<string, number>();
      for (const line of importLines) {
        const moduleMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch) {
          const module = moduleMatch[1];
          moduleImports.set(module, (moduleImports.get(module) || 0) + 1);
        }
      }
      for (const [module, count] of moduleImports.entries()) {
        if (count > 1) {
          duplicateImportErrors.push(`${file.path}: ${count} separate import statements from '${module}' (should be merged into one)`);
        }
      }
    }

    if (duplicateImportErrors.length > 0) {
      console.error(`[AutoGen Debugger] ❌ REJECTED: Fixer generated ${duplicateImportErrors.length} duplicate import errors!`);
      duplicateImportErrors.slice(0, 3).forEach(err => console.error(`[AutoGen Debugger]   ${err}`));
      collaborationLog.push(`[Attempt ${attempt}] REJECTED: Duplicate imports detected - ${duplicateImportErrors[0]}`);

      // Continue to next attempt without using these files
      continue;
    }

    emitAutoGenAgentComplete(
      context.projectContext.projectId,
      attempt,
      'fixer',
      Date.now() - agentStartTime2,
      { filesGenerated: fixedFiles.length }
    );

    // Step 2.5: File Operations Agent (check if files need to be created/deleted)
    const agentStartTime3 = Date.now();
    emitAutoGenAgentStart(
      context.projectContext.projectId,
      attempt,
      'fileops',
      'Checking if files need updates...'
    );

    const fileOpsPrompt = buildFileOperationsPrompt(currentFiles, fixedFiles, analysis, context.projectContext);
    const fileOpsResponse = await generateWithLogging({
      prompt: fileOpsPrompt,
      projectId: context.projectContext.projectId,
      nodeName: 'qa-autogen-fileops',
      callType: 'analysis',
      estimatedTokens: estimateTokens(fileOpsPrompt),
      attempt
    });
    const proposedOperations = parseFileOperations(fileOpsResponse);

    emitAutoGenAgentComplete(
      context.projectContext.projectId,
      attempt,
      'fileops',
      Date.now() - agentStartTime3,
      {
        operationsProposed: proposedOperations.length,
        operations: proposedOperations.map(op => `${op.type}: ${op.path}`)
      }
    );

    if (proposedOperations.length > 0) {
      // Validate and filter operations
      const { allowed, rejected } = filterOperations(proposedOperations);

      if (rejected.length > 0) {
        console.log(`[AutoGen Debugger] ⚠️ Rejected ${rejected.length} unsafe file operations`);
        rejected.forEach((r) => {
          console.log(`  - ${r.operation.type} ${r.operation.path}: ${r.reason}`);
        });
      }

      if (allowed.length > 0) {
        console.log(`[AutoGen Debugger] ✅ Executing ${allowed.length} file operations`);
        const operationResults = executeFileOperations(allowed, currentFiles);
        currentFiles = operationResults.files;
        allFileOperations.push(...allowed);
        collaborationLog.push(`[Attempt ${attempt}] FileOps: Executed ${allowed.length} operations (${rejected.length} rejected)`);
      }
    }

    // Step 3: Reviewer Agent reviews fixes
    const agentStartTime4 = Date.now();
    emitAutoGenAgentStart(
      context.projectContext.projectId,
      attempt,
      'reviewer',
      'Reviewing fixes to ensure quality...'
    );

    const reviewPrompt = buildReviewPrompt(currentFiles, fixedFiles, analysis);
    const review = await generateWithLogging({
      prompt: reviewPrompt,
      projectId: context.projectContext.projectId,
      nodeName: 'qa-autogen-reviewer',
      callType: 'review',
      estimatedTokens: estimateTokens(reviewPrompt),
      attempt
    });
    collaborationLog.push(`[Attempt ${attempt}] Reviewer: ${review.substring(0, 200)}...`);

    emitAutoGenAgentComplete(
      context.projectContext.projectId,
      attempt,
      'reviewer',
      Date.now() - agentStartTime4,
      { reviewSummary: review.substring(0, 300) }
    );

    // Step 4: Validate fixed code
    emitProgress('qa', context.projectContext.projectId, `Re-validating code after fixes...`);

    const newValidation = await validateCode(fixedFiles, {
      autoFix: true,
      strict: false,
      isMultiPage: context.projectContext.isMultiPage
    });

    console.log(`[AutoGen Debugger] Attempt ${attempt} validation: ${newValidation.report.errors.length} errors`);

    // Calculate error diff
    const errorDiff = compareValidationResults(currentValidation, newValidation);

    // Emit error diff event
    emitAutoGenErrorDiff(
      context.projectContext.projectId,
      attempt,
      {
        count: currentValidation.report.errors.length,
        errors: currentValidation.report.errors.slice(0, 10) // Only send first 10 for brevity
      },
      {
        count: newValidation.report.errors.length,
        errors: newValidation.report.errors.slice(0, 10)
      },
      errorDiff
    );

    // Update state
    currentFiles = newValidation.files;
    currentValidation = newValidation;

    // Check if debugging succeeded
    if (newValidation.report.errors.length === 0) {
      console.log(`[AutoGen Debugger] ✅ SUCCESS after ${attempt} attempts`);

      // CONVERSATION MEMORY: Track successful debugging
      addAssistantMessage(context.projectContext.projectId, `Fixed all code errors after ${attempt} debugging attempt(s)`, 'autogen-debugger');
      console.log('[AutoGen Debugger] 💬 Tracked successful debugging in conversation memory');

      return {
        success: true,
        files: currentFiles,
        validationResult: newValidation,
        attempts: attempt,
        collaborationLog,
        fileOperations: allFileOperations // ✅ RETURN FILE OPERATIONS
      };
    }

    // If errors reduced significantly, log progress
    const errorReduction = context.validationResult.report.errors.length - newValidation.report.errors.length;
    if (errorReduction > 0) {
      console.log(`[AutoGen Debugger] Progress: Reduced errors by ${errorReduction}`);
    }
  }

  // Max attempts reached
  console.log(`[AutoGen Debugger] ❌ FAILED after ${MAX_ATTEMPTS} attempts`);

  // CONVERSATION MEMORY: Track failed debugging
  addAssistantMessage(context.projectContext.projectId, `Attempted to fix errors ${MAX_ATTEMPTS} times but ${currentValidation.report.errors.length} error(s) remain`, 'autogen-debugger');
  console.log('[AutoGen Debugger] 💬 Tracked failed debugging attempts in conversation memory');

  return {
    success: false,
    files: currentFiles,
    validationResult: currentValidation,
    attempts: MAX_ATTEMPTS,
    collaborationLog,
    fileOperations: allFileOperations // ✅ RETURN FILE OPERATIONS
  };
}

/**
 * SIMPLIFIED ANALYSIS PROMPT
 * Trust AI to analyze errors without excessive examples
 */
function buildAnalysisPrompt(files: any[], validation: any, context: any): string {
  const errors = validation.report.errors || [];
  const errorSummary = errors.slice(0, 20).map((e: any) =>
    `Line ${e.line || '?'}: ${e.message || e.type || 'Error'}${e.rule ? ` [${e.rule}]` : ''}`
  ).join('\n');
  const moreErrors = errors.length > 20 ? `\n...${errors.length - 20} more` : '';

  return `Analyze errors. Find pattern.

PROJECT: ${context.description.substring(0, 100)}
FILES: ${files.map((f: any) => f.path).join(', ')}

ERRORS (${errors.length}):
${errorSummary}${moreErrors}

Root cause + fix strategy (50 words max):`;
}

/**
 * SIMPLIFIED FIX PROMPT
 * Trust AI to fix HTML/CSS/JS errors without 200 lines of rules
 */
function buildFixPrompt(files: any[], analysis: string, context: any): string {
  // Detect framework
  const isNextJS = files.some(f =>
    f.path.startsWith('src/app/') ||
    f.path === 'next.config.js' ||
    f.path.includes('layout.tsx') ||
    f.path.includes('page.tsx')
  );

  // Truncate very large files to avoid token limits
  const truncatedFiles = files.map((f: any) => {
    const MAX_FILE_SIZE = 30000;
    if (f.content.length > MAX_FILE_SIZE) {
      console.log(`[AutoGen] ⚠️  File ${f.path} is ${f.content.length} chars, truncating to ${MAX_FILE_SIZE}`);
      const firstPart = Math.floor(MAX_FILE_SIZE * 0.6);
      const lastPart = MAX_FILE_SIZE - firstPart;
      return {
        ...f,
        content: f.content.substring(0, firstPart) + '\n\n... [TRUNCATED] ...\n\n' + f.content.substring(f.content.length - lastPart)
      };
    }
    return f;
  });

  if (isNextJS) {
    // Next.js specific prompt - NO HTML conversion
    return `Fix the errors in this Next.js app.

ANALYSIS:
${analysis}

CURRENT FILES (${truncatedFiles.length} total):
${truncatedFiles.map((f: any) => `=== ${f.path} ===\n${f.content}`).join('\n\n')}

${context.backendConfig ? `
DATABASE: PocketBase collections available:
${context.backendConfig.collections?.map((c: any) => c.name).join(', ')}
` : ''}

CRITICAL FIXES:
🚨 JSX TAGS: Every <button> needs </button>, <form> needs </form>, <div> needs </div>. Count tags. Match exactly.

🚨 ABSOLUTE NO PLACEHOLDERS RULE:
❌ NEVER use: /* ... */, /* rest of code */, /* existing */, /* keep existing */, /* same as before */
❌ NEVER use: // ..., // rest of code, // existing code, // keep existing
❌ NEVER use: {/* Existing Posts List */}, {/* ... */}, <!-- ... -->
✅ ALWAYS write complete, functional code for every section
✅ If a section is working, copy it EXACTLY - don't comment it out
✅ If you don't know what code should be there, write a simple working implementation

✅ IMPORTS: Merge duplicate imports from same module into single statement. NEVER write: import { useState, useState } or import { X } from 'y'; import { Z } from 'y'
   - CORRECT: import { useState, useEffect } from 'react'
   - WRONG: import { useState } from 'react'; import { useEffect } from 'react'
   - WRONG: import { useState, useState, useState } from 'react'
✅ Remove unused imports completely.

Return ALL ${truncatedFiles.length} files (even if unchanged).

⚠️ MANDATORY FORMAT (MUST FOLLOW EXACTLY):

---FILE:src/app/layout.tsx---
import { Inter } from 'next/font/google'
...complete code...
---ENDFILE---

---FILE:src/app/page.tsx---
'use client'
...complete code...
---ENDFILE---

Do NOT return raw code. MUST wrap each file with ---FILE:path--- and ---ENDFILE---.`;
  }

  // HTML app prompt
  return `Fix the errors.

ANALYSIS:
${analysis}

CURRENT FILES:
${truncatedFiles.map((f: any) => `=== ${f.path} ===\n${f.content}`).join('\n\n')}

${context.backendConfig ? `
DATABASE: Collections: ${context.backendConfig.collections?.map((c: any) => c.name).join(', ')}
` : ''}

CRITICAL:
🚨 HTML TAGS: Every <button> needs </button>, <form> needs </form>, <div> needs </div>. Count. Match exactly.
✅ NO placeholders, NO "...", write COMPLETE code.
✅ Proper nesting. Close tags in reverse order.

${context.isMultiPage ? `
FORMAT:
---FILE:filename.html---
<!DOCTYPE html>
<html>...</html>
---ENDFILE---
` : `
FORMAT: Return complete HTML from <!DOCTYPE html> to </html>
`}

Code only.`;
}

/**
 * SIMPLIFIED REVIEW PROMPT
 */
function buildReviewPrompt(originalFiles: any[], fixedFiles: any[], analysis: string): string {
  return `Review: ${fixedFiles.length} files fixed.

Does fix solve root cause? (10 words):`;
}

function parseFixedFiles(code: string, originalFiles: any[]): Array<{ path: string; content: string }> {
  // Clean up code
  code = code.replace(/^```(?:json|html)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

  // CRITICAL FIX: Unescape JSON escape sequences if AI generated escaped HTML
  if (code.includes('\\n') || code.includes('\\"')) {
    console.log('[AutoGen] ⚠️ Detected JSON-escaped HTML, unescaping...');
    try {
      if ((code.startsWith('"') && code.endsWith('"')) || (code.startsWith("'") && code.endsWith("'"))) {
        code = JSON.parse(code);
        console.log('[AutoGen] ✅ Successfully unescaped JSON-quoted HTML');
      } else {
        code = code
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
        console.log('[AutoGen] ✅ Manually unescaped HTML escape sequences');
      }
    } catch (e) {
      code = code
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
    }
  }

  let files: Array<{ path: string; content: string }> = [];

  if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
    // Multi-file response - support paths with slashes (e.g., app/layout.tsx)
    const fileMatches = code.matchAll(/---FILE:([\w\/\-.]+)---([\s\S]*?)---ENDFILE---/g);
    files = Array.from(fileMatches).map(match => ({
      path: match[1].trim(),
      content: match[2].trim()
    }));
  } else {
    // ❌ AI FORGOT FORMAT - try to recover instead of assuming HTML
    console.warn('[AutoGen] ⚠️  AI did not use ---FILE:--- format, attempting recovery...');

    // Detect if this is TSX/JSX code (React components)
    const isTSX = code.includes('export default') ||
                  code.includes('from "react"') ||
                  code.includes("from 'react'") ||
                  code.includes('useState') ||
                  code.includes('useEffect') ||
                  code.includes('className=') ||
                  code.includes('import {') ||
                  code.startsWith("'use client'") ||
                  code.startsWith('"use client"');

    if (isTSX) {
      // This is TSX but AI forgot format - find the file with errors and use that path
      const fileWithError = originalFiles.find(f =>
        f.path.endsWith('.tsx') || f.path.endsWith('.jsx')
      );

      if (fileWithError) {
        console.log(`[AutoGen] ✅ Recovered TSX code, assigning to: ${fileWithError.path}`);
        files = [{ path: fileWithError.path, content: code }];
      } else {
        console.error('[AutoGen] ❌ TSX code detected but no .tsx file in originals');
        return originalFiles; // Give up and return originals
      }
    } else {
      // Assume HTML (legacy fallback for HTML apps)
      if (!code.startsWith('<!DOCTYPE') && !code.startsWith('<html')) {
        code = '<!DOCTYPE html>\n' + code;
      }
      files = [{ path: 'index.html', content: code }];
    }
  }

  // Ensure we have at least the original file count
  if (files.length === 0) {
    console.warn('[AutoGen Debugger] No files parsed, using original files');
    return originalFiles;
  }

  // CRITICAL: Merge strategy - preserve original files AI didn't return
  // This prevents file loss if AI forgets to include some files
  const parsedPaths = new Set(files.map(f => f.path));
  const missingFiles: string[] = [];

  for (const originalFile of originalFiles) {
    if (!parsedPaths.has(originalFile.path)) {
      console.log(`[AutoGen] ⚠️  AI didn't return ${originalFile.path} - preserving original`);
      files.push(originalFile);
      missingFiles.push(originalFile.path);
    }
  }

  if (missingFiles.length > 0) {
    console.warn(`[AutoGen Debugger] AI forgot ${missingFiles.length} file(s): ${missingFiles.slice(0, 5).join(', ')}${missingFiles.length > 5 ? '...' : ''}`);
    console.warn(`[AutoGen Debugger] Merged with originals: ${files.length} total files (${files.length - missingFiles.length} from AI + ${missingFiles.length} preserved)`);
  }

  return files;
}

/**
 * Build prompt for File Operations Agent
 */
function buildFileOperationsPrompt(
  currentFiles: any[],
  fixedFiles: any[],
  analysis: string,
  context: any
): string {
  // Detect framework
  const isNextJS = currentFiles.some(f =>
    f.path.startsWith('src/app/') ||
    f.path === 'next.config.js' ||
    f.path.includes('layout.tsx') ||
    f.path.includes('page.tsx')
  );

  if (isNextJS) {
    return `File Operations Agent: Determine file operations needed for Next.js app.

Current: ${currentFiles.map((f) => f.path).join(', ')}
Fixed: ${fixedFiles.map((f) => f.path).join(', ')}

IMPORTANT: This is a Next.js App Router project. DO NOT delete:
- app/layout.tsx (root layout - required)
- app/page.tsx (home page - required)
- app/globals.css (global styles)
- lib/types.ts (TypeScript types)
- lib/db.ts (database client)
- app/**/page.tsx (all pages)
- app/api/**/route.ts (all API routes)
- components/** (all components)
- hooks/** (all hooks)

Only propose operations if:
1. Files have INCORRECT names/paths (e.g., wrong.html instead of correct.tsx)
2. Truly duplicate files exist
3. Test/demo files need cleanup

Return JSON array of operations (or [] if none):
[{"type":"create|delete|rename","path":"file.tsx","newPath":"new.tsx","content":"...","reason":"why"}]

JSON only:`;
  }

  // HTML multi-page app
  return `File Operations Agent: Determine file operations needed.

Current: ${currentFiles.map((f) => f.path).join(', ')}
Fixed: ${fixedFiles.map((f) => f.path).join(', ')}
Multi-Page: ${context.isMultiPage}
${context.expectedPages?.length > 0 ? `Expected: ${context.expectedPages.join(', ')}` : ''}

Return JSON array of operations (or [] if none):
[{"type":"create|delete|rename","path":"file.html","newPath":"new.html","content":"...","reason":"why"}]

JSON only:`;
}

/**
 * Parse file operations from AI response
 */
function parseFileOperations(response: string): FileOperation[] {
  try {
    // Clean up response
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

    // Extract JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('[AutoGen Debugger] No file operations found in response');
      return [];
    }

    const operations = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(operations)) {
      console.warn('[AutoGen Debugger] Invalid operations format');
      return [];
    }

    return operations.filter((op: any) => {
      return (
        op.type &&
        ['create', 'delete', 'rename', 'move'].includes(op.type) &&
        op.path &&
        op.reason
      );
    });
  } catch (error) {
    console.error('[AutoGen Debugger] Failed to parse file operations:', error);
    return [];
  }
}

/**
 * Execute validated file operations
 */
function executeFileOperations(
  operations: FileOperation[],
  currentFiles: Array<{ path: string; content: string }>
): { files: Array<{ path: string; content: string }>; errors: string[] } {
  const files = [...currentFiles];
  const errors: string[] = [];

  for (const op of operations) {
    try {
      switch (op.type) {
        case 'create':
          if (!op.content) {
            errors.push(`Cannot create ${op.path}: no content provided`);
            break;
          }
          // Check if file already exists - if so, REPLACE it (treat as update)
          const existingIndex = files.findIndex((f) => f.path === op.path);
          if (existingIndex !== -1) {
            console.log(`[AutoGen Debugger] File ${op.path} exists, replacing (create→update)`);
            files[existingIndex].content = op.content;
            logFileOperation({...op, type: 'update'}, true, 'Replaced existing file');
          } else {
            files.push({ path: op.path, content: op.content });
            console.log(`[AutoGen Debugger] ✅ Created: ${op.path}`);
            logFileOperation(op, true);
          }
          break;

        case 'delete':
          const deleteIndex = files.findIndex((f) => f.path === op.path);
          if (deleteIndex === -1) {
            errors.push(`Cannot delete ${op.path}: file not found`);
            logFileOperation(op, false, 'File not found');
          } else {
            files.splice(deleteIndex, 1);
            console.log(`[AutoGen Debugger] 🗑️ Deleted: ${op.path}`);
            logFileOperation(op, true);
          }
          break;

        case 'rename':
        case 'move':
          if (!op.newPath) {
            errors.push(`Cannot rename ${op.path}: no new path provided`);
            break;
          }
          const renameIndex = files.findIndex((f) => f.path === op.path);
          if (renameIndex === -1) {
            errors.push(`Cannot rename ${op.path}: file not found`);
            logFileOperation(op, false, 'File not found');
          } else {
            files[renameIndex].path = op.newPath;
            console.log(`[AutoGen Debugger] ✏️ Renamed: ${op.path} → ${op.newPath}`);
            logFileOperation(op, true);
          }
          break;

        default:
          errors.push(`Unknown operation type: ${op.type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to execute ${op.type} on ${op.path}: ${errorMsg}`);
      logFileOperation(op, false, errorMsg);
    }
  }

  return { files, errors };
}

/**
 * Compare validation results to track error changes
 */
function compareValidationResults(before: any, after: any): {
  fixed: any[];
  new: any[];
  remaining: any[];
} {
  const beforeErrors = before.report?.errors || [];
  const afterErrors = after.report?.errors || [];

  // Create unique keys for errors (line + message)
  const createErrorKey = (error: any) =>
    `${error.line || '?'}:${error.message || error.type || 'error'}`;

  const beforeKeys = new Set(beforeErrors.map(createErrorKey));
  const afterKeys = new Set(afterErrors.map(createErrorKey));

  // Fixed: errors in before but not in after
  const fixed = beforeErrors.filter((err: any) => {
    const key = createErrorKey(err);
    return !afterKeys.has(key);
  });

  // New: errors in after but not in before
  const newErrors = afterErrors.filter((err: any) => {
    const key = createErrorKey(err);
    return !beforeKeys.has(key);
  });

  // Remaining: errors in both
  const remaining = afterErrors.filter((err: any) => {
    const key = createErrorKey(err);
    return beforeKeys.has(key);
  });

  return { fixed, new: newErrors, remaining };
}

/**
 * DEPRECATED: checkForPlaceholderContent() has been removed.
 * Use detectPlaceholders() from '@/lib/validation/placeholder-detector' instead.
 */
