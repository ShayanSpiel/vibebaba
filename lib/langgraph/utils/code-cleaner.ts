/**
 * Code Cleaner Utilities
 * Fixes common AI-generated code issues
 */

/**
 * Strip AI explanatory text and markdown from generated code
 * CRITICAL: AI often includes explanations like "Here's the implementation..."
 * This MUST be removed before writing files
 */
export function stripMarkdownCodeBlocks(code: string): string {
  let cleaned = code;

  // 🔥 CRITICAL: Remove AI explanatory text BEFORE code
  // Common patterns:
  // - "Here's the implementation for..."
  // - "Here's the code for..."
  // - "This is the implementation..."
  // - "Below is the code..."
  cleaned = removeExplanatoryText(cleaned);

  // Remove opening markdown code fences with language specifiers
  // Matches: ```typescript, ```javascript, ```tsx, ```jsx, ```ts, ```js, or just ```
  cleaned = cleaned.replace(/^```(?:typescript|javascript|tsx|jsx|ts|js|json|html|css)?\s*\n/gm, '');

  // Remove closing markdown code fences
  // Matches: ``` at end of line or end of string
  cleaned = cleaned.replace(/\n```\s*$/gm, '');
  cleaned = cleaned.replace(/^```\s*$/gm, '');

  // Trim any remaining whitespace
  cleaned = cleaned.trim();

  // Log if we stripped markdown (helps debugging)
  if (cleaned !== code.trim()) {
    console.log('[CodeCleaner] 🧹 Stripped markdown code block wrappers');
  }

  return cleaned;
}

/**
 * Remove AI explanatory text that appears anywhere in code
 * CRITICAL FIX: AI often writes "Here's the implementation..." mixed with code
 */
function removeExplanatoryText(code: string): string {
  const lines = code.split('\n');
  const cleanedLines: string[] = [];

  // Explanatory text patterns to detect and remove
  const explanatoryPatterns = [
    /^Here'?s? (the|an?) (implementation|code|component|page|file)/i,
    /^This is (the|an?) (implementation|code|component)/i,
    /^Below is (the|an?) (code|component)/i,
    /^I'?ve? (created|implemented|built)/i,
    /^Let'?s? (create|implement|build)/i,
    /^Now (let'?s?|we) (create|implement)/i,
    /^First,? (let'?s?|we) (create|implement)/i,
    /^The (following|above) (is|are|code|implementation)/i,
    /^In (this|the) (file|implementation|code)/i,
  ];

  let removedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this line is explanatory text
    const isExplanation = explanatoryPatterns.some(pattern => pattern.test(trimmed));

    if (isExplanation) {
      console.warn(`[CodeCleaner] 🚨 Removing AI explanation: "${trimmed.substring(0, 80)}..."`);
      removedCount++;
      continue; // Skip this line
    }

    // Keep this line
    cleanedLines.push(line);
  }

  if (removedCount > 0) {
    console.log(`[CodeCleaner] ✅ Removed ${removedCount} lines of AI explanatory text`);
  }

  return cleanedLines.join('\n');
}

/**
 * Remove duplicate icon component definitions
 * AI sometimes creates custom components with same names as imported icons
 * Example: imports { Sparkles } from 'lucide-react' then defines const Sparkles = () => (...)
 */
function removeDuplicateIconDefinitions(code: string): string {
  // Extract lucide-react imports
  const lucideImportMatch = code.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
  if (!lucideImportMatch) {
    return code;
  }

  const importedIcons = lucideImportMatch[1]
    .split(',')
    .map(icon => icon.trim())
    .filter(icon => icon.length > 0);

  if (importedIcons.length === 0) {
    return code;
  }

  console.log(`[CodeCleaner] 🔍 Checking for duplicate icon definitions: ${importedIcons.join(', ')}`);

  let cleaned = code;
  let removedCount = 0;

  // For each imported icon, remove any custom component definition
  for (const iconName of importedIcons) {
    // Pattern: const IconName = () => ( ... SVG ... );
    // Match from "const IconName" to the closing ");"
    const duplicatePattern = new RegExp(
      `const\\s+${iconName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\([\\s\\S]*?<svg[\\s\\S]*?<\\/svg>[\\s\\S]*?\\);`,
      'g'
    );

    const matches = cleaned.match(duplicatePattern);
    if (matches) {
      console.warn(`[CodeCleaner] 🚨 Removing duplicate ${iconName} component definition (already imported from lucide-react)`);
      cleaned = cleaned.replace(duplicatePattern, '');
      removedCount += matches.length;
    }
  }

  if (removedCount > 0) {
    console.log(`[CodeCleaner] ✅ Removed ${removedCount} duplicate icon component definitions`);
  }

  return cleaned;
}

/**
 * Clean invalid import statements
 * Fixes issues like: import { Foo, , Bar } from 'lib'
 */
export function cleanImports(code: string): string {
  let cleaned = code;

  // Fix empty destructured imports (e.g., "{ Foo, , Bar }")
  // Pattern: matches commas with only whitespace between them
  cleaned = cleaned.replace(/,(\s*),/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');

  // CRITICAL: Fix lucide-react imports (remove non-icon component names)
  cleaned = fixLucideImports(cleaned);

  // Remove backend-only imports from frontend code
  cleaned = removeBackendImports(cleaned);

  // 🚨 NEW: Remove duplicate icon component definitions
  cleaned = removeDuplicateIconDefinitions(cleaned);

  return cleaned;
}

/**
 * Remove backend-only package imports from frontend code
 * These packages should NEVER be in Next.js frontend files
 */
function removeBackendImports(code: string): string {
  const backendPackages = [
    'express',
    'cors',
    'body-parser',
    'mongoose',
    'sequelize',
    'pg',
    'mysql',
    'redis',
    'nodemailer',
    'bcrypt',
    'jsonwebtoken',
    'passport'
  ];

  const backendImportRegex = new RegExp(
    `import\\s+.*?\\s+from\\s+['"](?:${backendPackages.join('|')})['"].*?\\n`,
    'g'
  );

  const cleaned = code.replace(backendImportRegex, '');

  // Log if we removed any imports
  const removed = code.match(backendImportRegex);
  if (removed) {
    console.warn('[CodeCleaner] ⚠️ Removed backend imports from frontend code:', removed);
  }

  return cleaned;
}

/**
 * Fix lucide-react imports - remove non-icon component names
 * CRITICAL: lucide-react ONLY exports icons, not custom components!
 *
 * Valid icons: Zap, Shield, User, Lock, Mail, Send, etc.
 * Invalid: AnimatedLogo, ChatInterface, AuthForm (these are custom components)
 */
function fixLucideImports(code: string): string {
  // List of VALID lucide-react icons (common ones AI uses)
  const validLucideIcons = new Set([
    // Navigation & UI
    'Menu', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',

    // Actions
    'Check', 'CheckCircle', 'CheckSquare', 'Square', 'Circle', 'Plus', 'Minus',
    'Edit', 'Edit2', 'Edit3', 'Trash', 'Trash2', 'Save', 'Download', 'Upload', 'Copy', 'Share', 'Share2',
    'Send', 'LogOut', 'LogIn', 'Search', 'Filter', 'SlidersHorizontal', 'MoreVertical', 'MoreHorizontal',

    // Common icons
    'User', 'Users', 'Mail', 'Lock', 'Unlock', 'Eye', 'EyeOff',
    'Heart', 'Star', 'Bell', 'Calendar', 'Clock', 'MapPin',
    'Home', 'Settings', 'Info', 'HelpCircle', 'AlertCircle',
    'AlertTriangle', 'Loader', 'Loader2',

    // Business/Tech
    'Zap', 'Shield', 'Rocket', 'Trophy', 'Target', 'Crown', 'Gem',
    'Lightbulb', 'Sparkles', 'Flame', 'Award', 'TrendingUp', 'TrendingDown',
    'BarChart', 'PieChart', 'DollarSign', 'CreditCard',

    // Communication
    'MessageSquare', 'MessageCircle', 'Phone', 'Video', 'Mic', 'Volume2',

    // Files & Folders
    'File', 'FileText', 'Folder', 'FolderOpen', 'Image', 'Film',

    // Code & Tech
    'Code', 'Terminal', 'Database', 'Server', 'Cpu', 'HardDrive',
    'Wifi', 'WifiOff', 'Bluetooth', 'Battery', 'BatteryCharging',

    // Shopping
    'ShoppingCart', 'ShoppingBag', 'Package', 'Tag',

    // Social
    'ThumbsUp', 'ThumbsDown', 'Smile', 'Frown', 'Meh',

    // Weather
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow'
  ]);

  // Find lucide-react import line
  const lucideImportRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]lucide-react['"]/;
  const match = code.match(lucideImportRegex);

  if (!match) return code;  // No lucide import found

  const [fullImport, importsString] = match;
  const imports = importsString.split(',').map(i => i.trim()).filter(i => i);

  // Separate valid icons from invalid component names
  const validImports: string[] = [];
  const invalidImports: string[] = [];

  imports.forEach(importName => {
    if (validLucideIcons.has(importName)) {
      validImports.push(importName);
    } else {
      invalidImports.push(importName);
    }
  });

  // If no invalid imports, return as-is
  if (invalidImports.length === 0) return code;

  console.warn(`[CodeCleaner] 🔧 Removing invalid lucide-react imports: ${invalidImports.join(', ')}`);
  console.log(`[CodeCleaner] ✅ Keeping valid icons: ${validImports.join(', ')}`);

  // Replace import line with only valid icons
  let cleaned = code;
  if (validImports.length > 0) {
    const newImport = `import { ${validImports.join(', ')} } from 'lucide-react'`;
    cleaned = code.replace(fullImport, newImport);
  } else {
    // No valid imports, remove the entire line
    cleaned = code.replace(fullImport + '\n', '');
  }

  return cleaned;
}

/**
 * Fix 'use client' directive position
 * CRITICAL: Must be FIRST line, before all imports
 */
function fixUseClientPosition(code: string): string {
  // Check if 'use client' exists anywhere in the code
  const hasUseClient = code.includes("'use client'") || code.includes('"use client"');

  if (!hasUseClient) return code;

  // Remove all instances of 'use client' (with optional semicolon)
  let cleaned = code.replace(/['"]use client['"];?\s*\n?/g, '');

  // Add 'use client' as the FIRST line
  cleaned = `'use client';\n\n${cleaned}`;

  console.log('[CodeCleaner] 📍 Moved \'use client\' directive to first line');

  return cleaned;
}

/**
 * Remove file delimiter markers that AI mistakenly includes in code
 * CRITICAL: AI sometimes appends multiple files with delimiters
 * Example: ---FILE:src/app/page.tsx---
 */
function removeFileDelimiterMarkers(code: string): string {
  let cleaned = code;

  // Remove file markers: ---FILE:path---
  const fileMarkerPattern = /---FILE:[^\n]+---\s*/g;
  const endMarkerPattern = /---ENDFILE---\s*/g;

  const beforeLength = cleaned.length;

  // Remove all file delimiter markers
  cleaned = cleaned.replace(fileMarkerPattern, '');
  cleaned = cleaned.replace(endMarkerPattern, '');

  if (cleaned.length !== beforeLength) {
    console.warn('[CodeCleaner] 🚨 Removed file delimiter markers from code (AI appended multiple files)');
    console.warn('[CodeCleaner] 📏 Removed', beforeLength - cleaned.length, 'characters of delimiter markers');
  }

  return cleaned;
}

/**
 * Clean all common code issues
 * CRITICAL: Order matters! Each step builds on previous fixes.
 */
export function cleanGeneratedCode(code: string, filename: string): string {
  let cleaned = code;

  // 0. FIRST: Strip markdown code block wrappers (CRITICAL - must be first!)
  cleaned = stripMarkdownCodeBlocks(cleaned);

  // 0.5: CRITICAL: Remove file delimiter markers that shouldn't be in code
  // AI sometimes includes ---FILE:--- markers inside files
  cleaned = removeFileDelimiterMarkers(cleaned);

  // 1. Fix 'use client' position (must be before imports)
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    cleaned = fixUseClientPosition(cleaned);
  }

  // 2. Fix import statements
  cleaned = cleanImports(cleaned);

  // 3. Remove duplicate imports of the same module
  cleaned = removeDuplicateImports(cleaned);

  // 4. Fix common TypeScript issues
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    cleaned = fixTypeScriptIssues(cleaned);
  }

  // 5. CRITICAL: Validate dependencies before writing
  const depValidation = validateFileDependencies(cleaned, filename);
  if (!depValidation.valid) {
    console.error(`[CodeCleaner] 🚨 Missing dependencies in ${filename}:`, depValidation.missingPackages);
    console.error(`[CodeCleaner] 💡 Add these to package.json or AI needs to use different packages`);
  }

  // 6. CRITICAL: Validate TypeScript syntax before returning
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    const validation = validateTypeScriptSyntax(cleaned, filename);
    if (!validation.valid) {
      console.error(`[CodeCleaner] 🚨 FATAL: TypeScript syntax errors in ${filename}:`, validation.errors);
      console.error(`[CodeCleaner] 🚨 Will attempt to write file anyway, but deployment will fail`);
      // Still return the cleaned code - let the deployment fail with clear error
    }
  }

  return cleaned;
}

/**
 * Remove duplicate imports from the same module
 * Example:
 *   import { Foo } from 'lib'
 *   import { Bar } from 'lib'
 * Becomes:
 *   import { Foo, Bar } from 'lib'
 */
function removeDuplicateImports(code: string): string {
  const lines = code.split('\n');
  const imports: Map<string, Set<string>> = new Map();
  const otherLines: string[] = [];
  let firstImportIndex = -1;

  lines.forEach((line, index) => {
    // Match: import { ... } from '...'
    const match = line.match(/^import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);

    if (match) {
      if (firstImportIndex === -1) firstImportIndex = index;
      const [, items, source] = match;
      const importsSet = imports.get(source) || new Set<string>();

      // Add all imported items
      items.split(',').forEach(item => {
        const cleaned = item.trim();
        if (cleaned) importsSet.add(cleaned);
      });

      imports.set(source, importsSet);
    } else {
      otherLines.push(line);
    }
  });

  // Rebuild code with consolidated imports
  const consolidatedImports: string[] = [];
  imports.forEach((items, source) => {
    const itemsList = Array.from(items).join(', ');
    consolidatedImports.push(`import { ${itemsList} } from '${source}'`);
  });

  // Insert consolidated imports at the position of the first import
  if (firstImportIndex !== -1) {
    otherLines.splice(firstImportIndex, 0, ...consolidatedImports);
  }

  return otherLines.join('\n');
}

/**
 * Fix common TypeScript issues
 */
function fixTypeScriptIssues(code: string): string {
  let fixed = code;

  // Fix: useState hook type inference issues
  // Pattern: const [value, setValue] = useState('...')
  // When value is used in numeric contexts, add proper typing
  fixed = fixUseStateTypes(fixed);

  // Fix: Incorrect hook destructuring patterns
  fixed = fixHookDestructuring(fixed);

  return fixed;
}

/**
 * Fix common hook destructuring issues
 */
function fixHookDestructuring(code: string): string {
  let fixed = code;

  // Fix: useToast() returns { showToast }, not { toast }
  fixed = fixed.replace(
    /const\s*{\s*toast\s*}\s*=\s*useToast\(\)/g,
    'const { showToast } = useToast()'
  );

  // Fix: Any remaining usage of 'toast(' should be 'showToast('
  // But only if we made the replacement above
  if (fixed !== code) {
    fixed = fixed.replace(/\btoast\(/g, 'showToast(');
  }

  return fixed;
}

/**
 * Fix useState type inference issues
 * Detects when useState is initialized without proper types
 */
function fixUseStateTypes(code: string): string {
  let fixed = code;

  // 🔥 CRITICAL FIX: useState([]) without type -> useState<any[]>([])
  // This is the #1 cause of "Property does not exist on type 'never'" errors
  fixed = fixed.replace(
    /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\(\[\]\)/g,
    'const [$1, set$1] = useState<any[]>([])'
  );

  // Fix useState(null) -> useState<any>(null)
  fixed = fixed.replace(
    /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\(null\)/g,
    'const [$1, set$1] = useState<any>(null)'
  );

  // Fix useState({}) -> useState<any>({})
  fixed = fixed.replace(
    /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\({}\)/g,
    'const [$1, set$1] = useState<any>({})'
  );

  // Pattern: useState with quoted number that's used numerically
  // const [month, setMonth] = useState('1') -> useState<number>(1)
  const quotedNumberRegex = /const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState\((['"`])(\d+)\3\)/g;

  fixed = fixed.replace(quotedNumberRegex, (match, varName, setterName, quote, value) => {
    // Check if variable is used in numeric contexts
    const numericUsageRegex = new RegExp(
      `(new Date\\([^)]*,?\\s*${varName}|${varName}\\s*[+\\-*/]|parseInt\\(${varName}|Number\\(${varName}|${varName}\\s*[<>]=?)`,
      'g'
    );

    if (numericUsageRegex.test(code)) {
      console.log(`[CodeCleaner] 🔧 Fixed useState type: ${varName} string → number`);
      return `const [${varName}, ${setterName}] = useState<number>(${value})`;
    }

    return match;
  });

  // Fix any remaining Date constructor calls with string month/year
  fixed = fixed.replace(
    /new\s+Date\(([^,)]+),\s*([^,)]+)(?:,\s*([^)]+))?\)/g,
    (match, year, month, day) => {
      const needsYearConversion = /^[a-z]\w*$/i.test(year.trim()) && !year.includes('Number(');
      const needsMonthConversion = /^[a-z]\w*$/i.test(month.trim()) && !month.includes('Number(');

      const fixedYear = needsYearConversion ? `Number(${year})` : year;
      const fixedMonth = needsMonthConversion ? `Number(${month})` : month;

      if (day) {
        return `new Date(${fixedYear}, ${fixedMonth}, ${day})`;
      }
      return `new Date(${fixedYear}, ${fixedMonth})`;
    }
  );

  return fixed;
}

/**
 * Validate generated code for common issues
 * Returns array of errors found
 */
export function validateGeneratedCode(code: string, filename: string): string[] {
  const errors: string[] = [];

  // Check for empty destructured imports
  if (/,\s*,/.test(code) || /{(\s*),/.test(code) || /,(\s*)}/.test(code)) {
    errors.push(`${filename}: Contains invalid import syntax (empty comma)`);
  }

  // Check for missing closing braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`${filename}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
  }

  // Check for missing closing parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`${filename}: Mismatched parentheses (${openParens} open, ${closeParens} close)`);
  }

  // Check for backend imports in frontend code
  const backendImports = code.match(/import\s+.*?\s+from\s+['"](express|cors|body-parser)['"]/);
  if (backendImports) {
    errors.push(`${filename}: Contains backend-only imports (${backendImports[0]})`);
  }

  // Check for useState with quoted numbers used in Date()
  const quotedNumberState = code.match(/useState\(['"]\d+['"]\)/);
  const dateConstructor = code.match(/new\s+Date\(/);
  if (quotedNumberState && dateConstructor) {
    errors.push(`${filename}: useState may have incorrect type (number as string used in Date)`);
  }

  // Check for incorrect useToast destructuring
  if (code.includes('const { toast } = useToast()')) {
    errors.push(`${filename}: Incorrect useToast destructuring - should be { showToast }`);
  }

  // 🚨 CRITICAL: Check for useEffect without dependency array (causes infinite loops)
  const useEffectWithoutDeps = /useEffect\(\s*\(\s*\)\s*=>\s*{[\s\S]*?}\s*\)(?!\s*,)/g;
  const missingDeps = code.match(useEffectWithoutDeps);
  if (missingDeps && missingDeps.length > 0) {
    errors.push(`${filename}: useEffect without dependency array detected (${missingDeps.length} occurrence(s)) - WILL CAUSE INFINITE LOOP! Add empty [] for mount-only, or specify dependencies.`);
  }

  // 🚨 CRITICAL: Check for dangerous useEffect patterns that cause loops
  // Pattern: useEffect that updates state variables in its dependency array
  const useEffectPattern = /useEffect\(\s*\(\s*\)\s*=>\s*{([\s\S]*?)}\s*,\s*\[([\s\S]*?)\]\)/g;
  let effectMatch: RegExpExecArray | null;
  while ((effectMatch = useEffectPattern.exec(code)) !== null) {
    const effectBody = effectMatch[1];
    const depsArray = effectMatch[2];

    // Extract state setters called in the effect body
    const setterCalls = effectBody.match(/set(\w+)\s*\(/g) || [];
    const stateVarsModified = setterCalls.map(call => call.match(/set(\w+)/)?.[1]?.toLowerCase());

    // Extract dependencies
    const deps = depsArray.split(',').map(d => d.trim().toLowerCase());

    // Check if effect modifies variables that are in its dependencies
    for (const stateVar of stateVarsModified) {
      if (stateVar && deps.some(dep => dep.includes(stateVar.toLowerCase()))) {
        errors.push(`${filename}: useEffect modifies '${stateVar}' which is in its dependency array - WILL CAUSE INFINITE LOOP!`);
      }
    }
  }

  // Check for window.location.reload() in useEffect
  if (code.includes('useEffect') && code.includes('window.location.reload()')) {
    errors.push(`${filename}: window.location.reload() found in useEffect - may cause refresh loops`);
  }

  // Check for router.refresh() in useEffect without proper dependencies
  if (code.includes('useEffect') && code.includes('router.refresh()')) {
    errors.push(`${filename}: router.refresh() found in useEffect - may cause refresh loops. Ensure proper dependencies or remove.`);
  }

  // 🚨 CRITICAL: Check for background colors without matching foreground colors (bad contrast)
  const bgPatterns = [
    { bg: 'bg-primary', fg: 'text-primary-foreground' },
    { bg: 'bg-secondary', fg: 'text-secondary-foreground' },
    { bg: 'bg-accent', fg: 'text-accent-foreground' },
    { bg: 'bg-destructive', fg: 'text-destructive-foreground' },
    { bg: 'bg-success', fg: 'text-success-foreground' },
    { bg: 'bg-warning', fg: 'text-warning-foreground' },
    { bg: 'bg-muted', fg: 'text-muted-foreground' }
  ];

  for (const { bg, fg } of bgPatterns) {
    // Find elements with this background
    const bgRegex = new RegExp(`className="[^"]*${bg}[^"]*"`, 'g');
    let match: RegExpExecArray | null;
    while ((match = bgRegex.exec(code)) !== null) {
      const className = match[0];
      // Check if matching foreground is present in the same className
      if (!className.includes(fg) && !className.includes('text-foreground')) {
        errors.push(`${filename}: Found '${bg}' without matching '${fg}' in className - WILL HAVE BAD CONTRAST! Always pair background with foreground.`);
        break; // Only report once per bg color to avoid spam
      }
    }
  }

  // Check for hardcoded color values (bg-[#xxx], text-[#xxx], bg-blue-500, etc.)
  const hardcodedColorPattern = /(bg|text|border)-(\\[#[0-9a-fA-F]{3,6}\\]|blue-|red-|green-|yellow-|purple-|pink-|gray-|slate-|zinc-|neutral-|stone-|orange-|amber-|lime-|emerald-|teal-|cyan-|sky-|indigo-|violet-|fuchsia-|rose-)/;
  if (hardcodedColorPattern.test(code)) {
    const matches = code.match(hardcodedColorPattern);
    if (matches) {
      errors.push(`${filename}: Hardcoded color values detected (${matches[0]}) - Use semantic tokens instead (bg-primary, text-foreground, etc.)`);
    }
  }

  // Check for bg-white, bg-black, text-white, text-black (should use semantic tokens)
  if (/(bg|text)-(white|black)/.test(code)) {
    errors.push(`${filename}: Direct white/black colors detected - Use semantic tokens (bg-background, text-foreground) for proper theme support`);
  }

  // 🚨 CRITICAL: Check for buttons without utility classes (causes inconsistent styling)
  const buttonPattern = /<button[^>]*className="([^"]*)"[^>]*>/g;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonPattern.exec(code)) !== null) {
    const className = buttonMatch[1];
    // Check if button uses .btn utility class
    if (!className.includes('btn')) {
      // Check if it's using inline styles instead (px-*, py-*, rounded-*, bg-primary, etc.)
      const hasInlineStyles = /px-|py-|rounded-|bg-primary|bg-secondary|bg-accent/.test(className);
      if (hasInlineStyles) {
        errors.push(`${filename}: Button found with inline styles instead of utility classes - Use .btn .btn-primary .btn-lg pattern for consistency. Found: className="${className}"`);
        break; // Only report once to avoid spam
      }
    }
  }

  // 🚨 CRITICAL: Check for non-functional buttons (no onClick handler)
  const nonFunctionalButtonPattern = /<button(?![^>]*onClick)(?![^>]*type="submit")[^>]*>/g;
  const nonFunctionalButtons = code.match(nonFunctionalButtonPattern);
  if (nonFunctionalButtons && nonFunctionalButtons.length > 0) {
    errors.push(`${filename}: Found ${nonFunctionalButtons.length} button(s) without onClick handler or type="submit" - ALL buttons must be functional!`);
  }

  // Check for empty onClick handlers
  if (/onClick=\{(?:\(\s*\)\s*=>)?\s*\{\s*\}\s*\}/.test(code)) {
    errors.push(`${filename}: Found button(s) with empty onClick handler - Implement actual functionality!`);
  }

  // Check for Link components without href
  if (/<Link(?![^>]*href)[^>]*>/.test(code)) {
    errors.push(`${filename}: Found Link component(s) without href attribute - ALL links must have destinations!`);
  }

  // 🚨 CRITICAL: Check for wrong navigation patterns (causes 404 and bad UX)
  // Pattern 1: Using <a href="/..."> for internal navigation instead of <Link>
  const internalAnchorPattern = /<a\s+href="\/[^"]*"/g;
  const internalAnchors = code.match(internalAnchorPattern);
  if (internalAnchors && internalAnchors.length > 0) {
    errors.push(`${filename}: Found internal navigation using <a href="/..."> (${internalAnchors.length} occurrence(s)) - Use <Link href="/..."> from 'next/link' for client-side navigation!`);
  }

  // Pattern 2: Using window.location for navigation
  if (/window\.location\.(href|pathname)\s*=/.test(code)) {
    errors.push(`${filename}: Found window.location navigation - Use Next.js router.push() or <Link> for better UX!`);
  }

  // Pattern 3: Buttons that navigate but don't use router
  const buttonNavPattern = /<button[^>]*onClick=.*?(href|location|navigate)[^>]*>/;
  if (buttonNavPattern.test(code) && !code.includes('useRouter')) {
    errors.push(`${filename}: Buttons seem to navigate but useRouter not imported - Import { useRouter } from 'next/navigation' and use router.push()`);
  }

  // Check for lucide-react icons used as full components (common mistake)
  // Pattern: Icon names from lucide-react used with large size classes
  const lucideIconPattern = /<(LineChart|AreaChart|BarChart|PieChart|Calendar|Table|Grid)\s+className="[^"]*(?:w-full|h-full|h-\d{2,}|w-\d{2,})"/g;
  const largeIconUsage = code.match(lucideIconPattern);
  if (largeIconUsage) {
    errors.push(`${filename}: Icons used as full components (${largeIconUsage.map(m => m.match(/<(\w+)/)?.[1]).join(', ')}). Icons are SVGs, not full components! Use small sizes (h-4, h-5, h-6) or create placeholder divs.`);
  }

  // 🚨 CRITICAL: Check for useState without generic types (TypeScript inference errors)
  // Pattern: const [varName, setVarName] = useState(initialValue)
  const useStatePattern = /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\((.*?)\)/g;
  let stateMatch: RegExpExecArray | null;
  const inferenceIssues: string[] = [];

  while ((stateMatch = useStatePattern.exec(code)) !== null) {
    const varName = stateMatch[1];
    const initialValue = stateMatch[2].trim();

    // Check if useState has generic type parameter by looking backward
    const beforeUseState = code.substring(Math.max(0, stateMatch.index - 30), stateMatch.index);
    const hasGeneric = /useState<[^>]+>$/.test(beforeUseState + 'useState');

    if (!hasGeneric) {
      // Check for problematic initial values that cause wrong type inference
      if (initialValue === '[]') {
        errors.push(`${filename}: useState([]) without generic will infer 'never[]'. Fix: useState<TypeName[]>([])`);
        inferenceIssues.push(varName);
      } else if (initialValue === 'null') {
        errors.push(`${filename}: useState(null) without generic will infer 'null'. Fix: useState<TypeName | null>(null)`);
        inferenceIssues.push(varName);
      } else if (initialValue === '{}') {
        errors.push(`${filename}: useState({}) without generic may cause type issues. Fix: useState<TypeName>({})`);
        inferenceIssues.push(varName);
      } else if (/^['"`]\d+['"`]$/.test(initialValue)) {
        // String numbers like '1', "1", `1` - might be used in numeric contexts
        // This is already handled by fixUseStateTypes, but warn if not fixed
        const numericUsageRegex = new RegExp(
          `(new Date\\([^)]*,?\\s*${varName}|${varName}\\s*[+\\-*/]|parseInt\\(${varName}|Number\\(${varName})`,
          'g'
        );
        if (numericUsageRegex.test(code)) {
          errors.push(`${filename}: useState(${initialValue}) used in numeric context without type. Fix: useState<number>(${initialValue.replace(/['"`]/g, '')})`);
          inferenceIssues.push(varName);
        }
      }
    }
  }

  if (inferenceIssues.length > 0) {
    console.warn(`[CodeCleaner] 🚨 TypeScript inference issues in ${filename}: ${inferenceIssues.join(', ')}`);
  }

  // 🚨 CRITICAL: Check for card/component alignment issues in same section
  // Pattern 1: Cards in grid without h-full (causes height misalignment)
  const gridSectionPattern = /<div[^>]*className="[^"]*grid[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let gridMatch: RegExpExecArray | null;

  while ((gridMatch = gridSectionPattern.exec(code)) !== null) {
    const gridContent = gridMatch[1];

    // Check if grid has cards/divs without h-full
    const cardsInGrid = gridContent.match(/<div[^>]*className="[^"]*card[^"]*"[^>]*>/g);
    if (cardsInGrid && cardsInGrid.length > 1) {
      // Check if any card is missing h-full
      const missingHeightFull = cardsInGrid.some(card => !card.includes('h-full'));
      if (missingHeightFull) {
        errors.push(`${filename}: Cards in grid without 'h-full' will have inconsistent heights. Add h-full to all cards in the same grid for proper alignment.`);
      }
    }
  }

  // Pattern 2: Inconsistent padding in same section (p-4 vs p-6 vs p-8)
  const sectionPattern = /<section[^>]*>([\s\S]*?)<\/section>/g;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionPattern.exec(code)) !== null) {
    const sectionContent = sectionMatch[1];

    // Find all padding values used in this section
    const paddingMatches = sectionContent.match(/\bp-(\d+)\b/g);
    if (paddingMatches && paddingMatches.length > 2) {
      const uniquePaddings = [...new Set(paddingMatches)];
      if (uniquePaddings.length > 2) {
        errors.push(`${filename}: Inconsistent padding in section - found ${uniquePaddings.join(', ')}. Use consistent padding (same p-value) for all cards in a section.`);
      }
    }
  }

  // Pattern 3: Mixed grid column counts in same component (grid-cols-2 vs grid-cols-3)
  const componentPattern = /(?:function|const)\s+\w+.*?\{([\s\S]*?)(?:return|export)/g;
  let componentMatch: RegExpExecArray | null;

  while ((componentMatch = componentPattern.exec(code)) !== null) {
    const componentContent = componentMatch[1];

    // Find all grid column definitions
    const gridColMatches = componentContent.match(/grid-cols-(\d+)/g);
    if (gridColMatches && gridColMatches.length > 1) {
      const uniqueGridCols = [...new Set(gridColMatches)];
      if (uniqueGridCols.length > 1) {
        errors.push(`${filename}: Inconsistent grid columns in component - found ${uniqueGridCols.join(', ')}. Use same grid-cols-N value throughout each section for alignment.`);
      }
    }
  }

  return errors;
}

/**
 * Validate dependencies for a single file
 * Checks if all imported packages are available
 * CRITICAL: Prevents deployment failures from missing dependencies
 */
export function validateFileDependencies(code: string, filename: string): { valid: boolean; errors: string[]; missingPackages: string[] } {
  const errors: string[] = [];
  const missingPackages: string[] = [];

  // Extract all import statements
  const importRegex = /import\s+(?:(?:{[^}]+}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:{[^}]+}|\w+))*\s+)?from\s+['"]([@\w\-\/]+)['"]/g;
  let match: RegExpExecArray | null;

  const packages = new Set<string>();
  while ((match = importRegex.exec(code)) !== null) {
    const packageName = match[1];

    // Skip relative imports (starting with . or @/ for Next.js path aliases)
    if (packageName.startsWith('.') || packageName.startsWith('@/')) {
      continue;
    }

    // Extract package name (handle scoped packages like @radix-ui/react-dialog)
    const pkgBase = packageName.startsWith('@')
      ? packageName.split('/').slice(0, 2).join('/')
      : packageName.split('/')[0];

    packages.add(pkgBase);
  }

  if (packages.size === 0) {
    return { valid: true, errors: [], missingPackages: [] };
  }

  try {
    // Read package.json to check available dependencies
    const fs = require('fs');
    const path = require('path');

    // Try to find package.json in parent directories
    let currentDir = process.cwd();
    let packageJsonPath = path.join(currentDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.warn(`[CodeCleaner] ⚠️ package.json not found, skipping dependency validation for ${filename}`);
      return { valid: true, errors: [], missingPackages: [] };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    // Check each package
    for (const pkg of packages) {
      if (!allDeps[pkg]) {
        missingPackages.push(pkg);
        errors.push(`${filename}: Missing dependency '${pkg}' - not in package.json`);
      }
    }

    if (missingPackages.length > 0) {
      console.error(`[CodeCleaner] 🚨 Missing dependencies in ${filename}:`, missingPackages);
      return { valid: false, errors, missingPackages };
    }

    console.log(`[CodeCleaner] ✅ Dependency validation passed for ${filename} (${packages.size} packages)`);
    return { valid: true, errors: [], missingPackages: [] };

  } catch (error: any) {
    console.error(`[CodeCleaner] ⚠️ Dependency validation error for ${filename}:`, error.message);
    // Don't block if validation fails
    return { valid: true, errors: [], missingPackages: [] };
  }
}

/**
 * Validate TypeScript syntax before writing file
 * Uses TypeScript compiler API to detect syntax errors
 * CRITICAL: Prevents writing files with compilation errors
 */
export function validateTypeScriptSyntax(code: string, filename: string): { valid: boolean; errors: string[] } {
  try {
    const ts = require('typescript');

    // Transpile to check for syntax errors
    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        strict: false, // Don't fail on type errors, only syntax errors
        skipLibCheck: true,
        noEmit: true,
      },
      reportDiagnostics: true,
    });

    // Check for syntax errors (not type errors)
    const syntaxErrors = result.diagnostics?.filter(d => {
      // Only include syntax errors (1xxx category)
      return d.code >= 1000 && d.code < 2000;
    }) || [];

    if (syntaxErrors.length > 0) {
      const errorMessages = syntaxErrors.map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const line = diagnostic.file ?
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start || 0).line + 1 :
          'unknown';
        return `Line ${line}: ${message}`;
      });

      console.error(`[CodeCleaner] 🚨 TypeScript syntax errors in ${filename}:`, errorMessages);
      return { valid: false, errors: errorMessages };
    }

    console.log(`[CodeCleaner] ✅ TypeScript syntax validation passed for ${filename}`);
    return { valid: true, errors: [] };

  } catch (error: any) {
    console.error(`[CodeCleaner] ⚠️ TypeScript validation error for ${filename}:`, error.message);
    // Don't block file write if validation itself fails - log and continue
    return { valid: true, errors: [] };
  }
}
