// @ts-nocheck
/**
 * TYPESCRIPT VALIDATOR
 *
 * Catches common TypeScript errors that would fail during build
 * Focuses on patterns that cause "implicitly has 'any' type" errors
 */

import type { ValidationError } from './types';

export function validateTypeScript(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate .ts and .tsx files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return errors;
  }

  const lines = content.split('\n');

  // Pattern 1: Untyped function parameters (most common)
  // Matches: function foo(param) or const foo = (param) =>
  const untypedParamPattern = /(?:function\s+\w+|const\s+\w+\s*=)\s*\(([^)]*)\)\s*(?:=>|{)/g;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for untyped parameters
    const match = untypedParamPattern.exec(line);
    if (match) {
      const params = match[1];

      // Skip if parameters are empty or already typed
      if (params && !params.includes(':') && params.trim().length > 0) {
        // Check if it looks like an event handler
        const isEventHandler = params.match(/\b(e|event|ev)\b/);

        if (isEventHandler) {
          errors.push({
            type: 'typescript',
            message: `Parameter '${params.trim()}' implicitly has an 'any' type. Add type annotation like: (e: React.ChangeEvent<HTMLInputElement>)`,
            line: lineNumber,
            column: line.indexOf(params),
            file: filePath,
            severity: 'error',
            rule: 'no-implicit-any',
          });
        } else {
          errors.push({
            type: 'typescript',
            message: `Parameter '${params.trim()}' needs a type annotation`,
            line: lineNumber,
            column: line.indexOf(params),
            file: filePath,
            severity: 'warning',
            rule: 'explicit-types',
          });
        }
      }
    }

    // Pattern 2: Arrow functions with untyped parameters
    // const handleClick = (e) => { ... }
    const arrowFuncPattern = /const\s+(\w+)\s*=\s*\(([^)]+)\)\s*=>/;
    const arrowMatch = arrowFuncPattern.exec(line);

    if (arrowMatch) {
      const funcName = arrowMatch[1];
      const params = arrowMatch[2];

      if (params && !params.includes(':')) {
        // Detect common event handler patterns
        const eventHandlers = {
          Change: /change/i.test(funcName),
          Click: /click/i.test(funcName),
          Submit: /submit/i.test(funcName),
          Input: /input/i.test(funcName),
          Mouse: /mouse|hover/i.test(funcName),
        };

        let suggestedType = 'any';
        for (const [event, matches] of Object.entries(eventHandlers)) {
          if (matches) {
            if (event === 'Change' || event === 'Input') {
              suggestedType = 'React.ChangeEvent<HTMLInputElement>';
            } else if (event === 'Click' || event === 'Mouse') {
              suggestedType = 'React.MouseEvent';
            } else if (event === 'Submit') {
              suggestedType = 'React.FormEvent<HTMLFormElement>';
            }
            break;
          }
        }

        errors.push({
          type: 'typescript',
          message: `Parameter '${params.trim()}' implicitly has an 'any' type. Suggested: (${params.trim()}: ${suggestedType}) => void`,
          line: lineNumber,
          column: line.indexOf(params),
          file: filePath,
          severity: 'error',
          rule: 'no-implicit-any',
        });
      }
    }

    // Pattern 3: useState without explicit type (less critical but good practice)
    const useStatePattern = /useState\(\s*([^)]+)\s*\)/;
    const stateMatch = useStatePattern.exec(line);

    if (stateMatch && !line.includes('useState<')) {
      const initialValue = stateMatch[1];

      // Only warn for non-primitive initial values
      if (
        !['true', 'false', 'null', 'undefined'].includes(initialValue.trim()) &&
        !initialValue.match(/^['"`]/) && // not a string literal
        !initialValue.match(/^\d/) && // not a number
        !initialValue.match(/^\[/) && // not an array literal
        !initialValue.match(/^\{/)
      ) {
        // not an object literal

        errors.push({
          type: 'typescript',
          message: `Consider adding explicit type to useState: useState<YourType>(${initialValue})`,
          line: lineNumber,
          column: line.indexOf('useState'),
          file: filePath,
          severity: 'warning',
          rule: 'explicit-state-types',
        });
      }
    }

    // Pattern 4: Missing 'use client' directive for client components
    const hasUseClientDirective =
      content.includes("'use client'") || content.includes('"use client"');

    // 🔧 FIX: Exclude API routes from 'use client' check (they are server-side)
    const isApiRoute = filePath.includes('/api/') || filePath.endsWith('/route.ts');

    if (index === 0 && filePath.includes('app/') && !isApiRoute && !hasUseClientDirective) {
      // Check if component uses client-side features
      const usesClientFeatures =
        content.includes('useState') ||
        content.includes('useEffect') ||
        content.includes('onClick') ||
        content.includes('onChange');

      if (usesClientFeatures) {
        errors.push({
          type: 'typescript',
          message:
            "Component uses client-side features but missing 'use client' directive at the top of the file",
          line: 1,
          column: 0,
          file: filePath,
          severity: 'error',
          rule: 'use-client-directive',
        });
      }
    }
  });

  // Pattern 5: JSX tag mismatch detection (CRITICAL - prevents build failures)
  // FIXED: Now handles multiline JSX tags (e.g., <button\n  className="..."\n>)
  // ⚠️ TEMPORARILY DISABLED FOR TESTING - Remove false && to re-enable
  if (false && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) {
    const tagStack: Array<{ tag: string; line: number }> = [];

    // Helper: Get line number from character position
    const getLineNumber = (pos: number): number => {
      return content.substring(0, pos).split('\n').length;
    };

    // Remove comments and strings to avoid false matches
    let cleanedContent = content;
    cleanedContent = cleanedContent.replace(/\/\/.*$/gm, ''); // Single-line comments
    cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
    cleanedContent = cleanedContent.replace(/"(?:[^"\\]|\\.)*"/g, '""'); // Double-quoted strings
    cleanedContent = cleanedContent.replace(/'(?:[^'\\]|\\.)*'/g, "''"); // Single-quoted strings
    cleanedContent = cleanedContent.replace(/`(?:[^`\\]|\\[\s\S])*`/g, '``'); // Template literals

    // CRITICAL FIX: Remove JSX expressions {...} to avoid false matches with < > operators
    // This handles cases like: <button disabled={count > 5}>, {items.map((item) => <div>)}
    cleanedContent = cleanedContent.replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '{}');

    // Find all opening tags (MULTILINE-AWARE using 's' flag)
    // Matches: <tagname> or <tagname attr="value"> even across multiple lines
    const openTagRegex = /<(\w+)(?:\s[^>]*)?>/gs;
    let match;

    const allTags: Array<{ type: 'open' | 'close'; tag: string; line: number; pos: number }> = [];

    // Find all opening tags
    while ((match = openTagRegex.exec(cleanedContent)) !== null) {
      const tagName = match[1];
      const fullMatch = match[0];
      const position = match.index;

      // Skip TypeScript generic types (e.g., useState<string>, Promise<void>)
      const beforeTag = cleanedContent.substring(Math.max(0, position - 30), position);
      const isTypeAnnotation =
        /:\s*$/.test(beforeTag) || // After : (type annotation)
        /<\s*$/.test(beforeTag) || // After < (generic type)
        /\bPromise\s*$/.test(beforeTag) ||
        /\bArray\s*$/.test(beforeTag) ||
        /\bRecord\s*$/.test(beforeTag) ||
        /\bMap\s*$/.test(beforeTag) ||
        /\bSet\s*$/.test(beforeTag) ||
        /\buseState\s*$/.test(beforeTag) ||
        /\buseRef\s*$/.test(beforeTag) ||
        // React event types
        /\bReact\.ChangeEvent\s*$/.test(beforeTag) ||
        /\bReact\.MouseEvent\s*$/.test(beforeTag) ||
        /\bReact\.FormEvent\s*$/.test(beforeTag) ||
        /\bReact\.KeyboardEvent\s*$/.test(beforeTag) ||
        /\bReact\.FocusEvent\s*$/.test(beforeTag) ||
        /\bChangeEvent\s*$/.test(beforeTag) ||
        /\bMouseEvent\s*$/.test(beforeTag) ||
        /\bFormEvent\s*$/.test(beforeTag) ||
        /\bKeyboardEvent\s*$/.test(beforeTag) ||
        /\bFocusEvent\s*$/.test(beforeTag);

      if (isTypeAnnotation) {
        continue;
      }

      // Skip self-closing tags (e.g., <Icon ... />, <input />)
      // NOTE: Only treat lowercase HTML tags as self-closing, NOT React components (Link, Button, etc.)
      const isSelfClosing =
        fullMatch.trim().endsWith('/>') ||
        (tagName === tagName.toLowerCase() &&
          ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName));

      if (!isSelfClosing) {
        allTags.push({
          type: 'open',
          tag: tagName,
          line: getLineNumber(position),
          pos: position,
        });
      }
    }

    // Find all closing tags
    const closeTagRegex = /<\/(\w+)>/g;
    while ((match = closeTagRegex.exec(cleanedContent)) !== null) {
      const tagName = match[1];
      const position = match.index;

      allTags.push({
        type: 'close',
        tag: tagName,
        line: getLineNumber(position),
        pos: position,
      });
    }

    // Sort tags by position to process them in order
    allTags.sort((a, b) => a.pos - b.pos);

    // Process tags in order
    for (const tag of allTags) {
      if (tag.type === 'open') {
        tagStack.push({ tag: tag.tag, line: tag.line });
      } else {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push({
            type: 'typescript',
            message: `Unexpected closing tag </${tag.tag}> with no matching opening tag`,
            line: tag.line,
            column: 0,
            file: filePath,
            severity: 'error',
            rule: 'jsx-tag-mismatch',
          });
          continue;
        }

        const lastOpened = tagStack[tagStack.length - 1];
        if (tag.tag !== lastOpened.tag) {
          errors.push({
            type: 'typescript',
            message: `JSX tag mismatch: expected </${lastOpened.tag}> (opened on line ${lastOpened.line}) but found </${tag.tag}>`,
            line: tag.line,
            column: 0,
            file: filePath,
            severity: 'error',
            rule: 'jsx-tag-mismatch',
          });
        } else {
          tagStack.pop(); // Correct match, remove from stack
        }
      }
    }

    // Check for unclosed tags at end of file
    if (tagStack.length > 0) {
      const unclosed = tagStack[tagStack.length - 1];
      errors.push({
        type: 'typescript',
        message: `Unclosed JSX tag <${unclosed.tag}> opened on line ${unclosed.line}`,
        line: unclosed.line,
        column: 0,
        file: filePath,
        severity: 'error',
        rule: 'jsx-unclosed-tag',
      });
    }
  }

  return errors;
}

/**
 * Type Mismatch Detector
 * Catches cases where generated code tries to access properties that don't exist
 * in the type definitions BEFORE running TypeScript compilation.
 */
export interface TypeDefinition {
  name: string;
  properties: Array<{ name: string; type: string; optional: boolean }>;
}

export interface TypeMismatchIssue {
  line: number;
  column: number;
  code: string;
  type: string;
  property: string;
  availableProperties: string[];
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Detect property access on types that don't have those properties
 */
export function detectTypeMismatches(
  content: string,
  typeDefinitions: TypeDefinition[],
  filePath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[TypeMismatchDetector] 🔍 Analyzing ${filePath}`);
  console.log(
    `[TypeMismatchDetector] 📋 Available types: ${typeDefinitions.map((t) => t.name).join(', ')}`
  );

  // Log all available properties for each type
  for (const type of typeDefinitions) {
    const propList = type.properties.map((p) => `${p.name}: ${p.type}`).join(', ');
    console.log(`[TypeMismatchDetector] 📊 ${type.name} = { ${propList} }`);
  }

  // Build a map of type names to their properties for quick lookup
  const typePropertyMap = new Map<string, Map<string, string>>();
  for (const type of typeDefinitions) {
    const propMap = new Map<string, string>();
    for (const prop of type.properties) {
      propMap.set(prop.name, prop.type);
    }
    typePropertyMap.set(type.name, propMap);
  }

  // Track variable names and their types
  // Format: variableName => typeName
  const variableTypes = new Map<string, string>();

  lines.forEach((line, lineIndex) => {
    // Pattern 1: Find variable declarations with type annotations
    // Examples:
    //   const product: Products = ...
    //   const item: CartItems = ...
    //   items.map((item: Products) => ...)
    //   const { data }: { data: Products[] } = ...
    const typeAnnotationPatterns = [
      /(?:const|let|var)\s+(\w+)\s*:\s*(\w+)(?:\[\])?\s*(?:=|;)/g,
      /\((\w+)\s*:\s*(\w+)(?:\[\])?\s*\)/g, // Function parameters
      /\.map\(\s*\((\w+)\s*:\s*(\w+)(?:\[\])?\s*\)/g, // Map callbacks
    ];

    for (const pattern of typeAnnotationPatterns) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(line)) !== null) {
        const [, varName, typeName] = match;
        const cleanTypeName = typeName.replace(/\[\]$/, '');

        if (typePropertyMap.has(cleanTypeName)) {
          variableTypes.set(varName, cleanTypeName);
          console.log(
            `[TypeMismatchDetector] 📝 Line ${lineIndex + 1}: Found '${varName}: ${cleanTypeName}'`
          );
        }
      }
    }

    // Pattern 2: Check for property access on typed variables
    // Examples:
    //   product.price
    //   item.product.name (DANGER: if 'product' is a string ID)
    for (const [varName, typeName] of variableTypes.entries()) {
      const propertyAccessPattern = new RegExp(`\\b${varName}\\.([a-zA-Z_][a-zA-Z0-9_]*)`, 'g');
      let propertyMatch;

      while ((propertyMatch = propertyAccessPattern.exec(line)) !== null) {
        const propertyName = propertyMatch[1];
        const propMap = typePropertyMap.get(typeName);
        const availableProperties = Array.from(propMap?.keys() || []);

        // Check if the property exists in the type definition
        if (!propMap?.has(propertyName)) {
          const column = propertyMatch.index;
          const code = line.trim();

          console.log(
            `[TypeMismatchDetector] ⚠️  Line ${lineIndex + 1}: Property '${propertyName}' not found on '${typeName}'`
          );
          console.log(`[TypeMismatchDetector]     Code: ${code}`);
          console.log(`[TypeMismatchDetector]     Available: ${availableProperties.join(', ')}`);

          errors.push({
            type: 'typescript',
            message: `Property '${propertyName}' does not exist on type '${typeName}'. Available properties: ${availableProperties.join(', ')}`,
            line: lineIndex + 1,
            column,
            file: filePath,
            severity: 'error',
            rule: 'type-property-mismatch',
          });
        }
      }
    }

    // Pattern 3: Detect chained property access that looks suspicious
    // Example: item.product.price (where 'product' is likely a string ID, not an object)
    const chainedPropertyPattern = /(\w+)\.(\w+)\.(\w+)/g;
    let chainMatch;

    while ((chainMatch = chainedPropertyPattern.exec(line)) !== null) {
      const [fullMatch, obj, field, property] = chainMatch;

      // Check if obj is a known typed variable
      const objType = variableTypes.get(obj);
      if (objType) {
        const propMap = typePropertyMap.get(objType);
        const fieldType = propMap?.get(field);

        // If the field type is 'string', warn about accessing properties on it
        if (fieldType === 'string') {
          console.log(
            `[TypeMismatchDetector] ⚠️  Line ${lineIndex + 1}: Suspicious chain: ${fullMatch}`
          );
          console.log(
            `[TypeMismatchDetector]     '${field}' is type 'string', cannot access '.${property}'`
          );

          errors.push({
            type: 'typescript',
            message: `Property '${property}' does not exist on type 'string'. The field '${field}' is a string (likely an ID), not an object. You may need to fetch the full ${field} object first.`,
            line: lineIndex + 1,
            column: chainMatch.index,
            file: filePath,
            severity: 'error',
            rule: 'string-property-access',
          });
        }
      }
    }
  });

  if (errors.length > 0) {
    console.log(`[TypeMismatchDetector] ❌ Found ${errors.length} type mismatch issue(s)`);
  } else {
    console.log(`[TypeMismatchDetector] ✅ No type mismatches detected`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  return errors;
}
