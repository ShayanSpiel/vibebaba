// @ts-nocheck
/**
 * TYPESCRIPT COMPILATION VALIDATOR
 *
 * Runs actual TypeScript compilation to catch type errors BEFORE deployment
 * Prevents build failures at deployment time
 */

import * as ts from 'typescript';
import type { ValidationError } from './types';

export interface CompilationResult {
  success: boolean;
  errors: ValidationError[];
  diagnostics: ts.Diagnostic[];
}

/**
 * Compile TypeScript files to catch type errors
 * @param files - Map of file paths to content
 * @param tsConfigPath - Optional path to tsconfig.json
 */
export function compileTypeScript(
  files: Map<string, string>,
  tsConfigPath?: string
): CompilationResult {
  const errors: ValidationError[] = [];

  // Create TypeScript compiler host
  const host: ts.CompilerHost = {
    getSourceFile: (fileName, languageVersion) => {
      const content = files.get(fileName);
      if (content) {
        return ts.createSourceFile(fileName, content, languageVersion, true);
      }
      // Fallback to default FS read for library files
      try {
        const fs = require('fs');
        const fileContent = fs.readFileSync(fileName, 'utf-8');
        return ts.createSourceFile(fileName, fileContent, languageVersion, true);
      } catch {
        return undefined;
      }
    },
    writeFile: () => {}, // We don't write files, just validate
    getCurrentDirectory: () => process.cwd(),
    getDirectories: () => [],
    fileExists: (fileName) => {
      if (files.has(fileName)) return true;
      try {
        const fs = require('fs');
        return fs.existsSync(fileName);
      } catch {
        return false;
      }
    },
    readFile: (fileName) => {
      const content = files.get(fileName);
      if (content) return content;
      try {
        const fs = require('fs');
        return fs.readFileSync(fileName, 'utf-8');
      } catch {
        return undefined;
      }
    },
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: (options) => {
      // Return path to TypeScript's default lib files
      return require('typescript').getDefaultLibFilePath(options);
    },
  };

  // Compiler options (Next.js + React defaults)
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    allowJs: true,
    incremental: false,
    baseUrl: '.',
    paths: {
      '@/*': ['./src/*'],
    },
  };

  // Create program
  const fileNames = Array.from(files.keys());
  const program = ts.createProgram(fileNames, compilerOptions, host);

  // Get diagnostics
  const allDiagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
  ];

  // Filter to only errors from our generated files (not node_modules)
  const relevantDiagnostics = allDiagnostics.filter(diagnostic => {
    if (!diagnostic.file) return false;
    return files.has(diagnostic.file.fileName);
  });

  // Convert TypeScript diagnostics to ValidationErrors
  for (const diagnostic of relevantDiagnostics) {
    if (!diagnostic.file) continue;

    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start!
    );

    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    errors.push({
      type: 'typescript',
      message,
      line: line + 1, // TS uses 0-indexed lines
      column: character + 1,
      file: diagnostic.file.fileName,
      severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
      rule: `TS${diagnostic.code}`,
    });
  }

  return {
    success: errors.length === 0,
    errors,
    diagnostics: relevantDiagnostics,
  };
}

/**
 * Quick validation for single file (lightweight, no full compilation)
 * Use this during generation, full compilation during final validation
 */
export function validateSingleFile(
  filePath: string,
  content: string,
  allFiles?: Map<string, string>
): ValidationError[] {
  // If allFiles provided, include them for better type resolution
  const files = allFiles ? new Map(allFiles) : new Map();
  files.set(filePath, content);

  const result = compileTypeScript(files);
  // Only return errors for the target file, not other files
  return result.errors.filter(err => err.file === filePath);
}
