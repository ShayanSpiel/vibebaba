# Image Import Validator Fix

## Problem
The import validator was incorrectly adding `Image` to `lucide-react` imports instead of recognizing it as a Next.js component from `next/image`.

### Error Log
```
[Frontend] ⚠️  IMPORT ISSUES (1):
[Frontend]    Line 136: Missing import 'Image'
[Frontend]    💡 Add 'Image' to lucide-react imports
[Frontend] 🔧 AUTO-FIXING 1 import issue(s)...
[Frontend]    ✅ Added Image to existing lucide-react import  ❌ WRONG!
```

This caused TypeScript errors:
```
Type '{ src: any; alt: any; width: number; height: number; className: string; }'
is not assignable to type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'.
Property 'src' does not exist on type...
```

## Root Cause
The import validator in `lib/langgraph/validation/post-gen/import-validator.ts` was checking components in the wrong order:

**Before (❌ BROKEN ORDER):**
1. Check if it's a Lucide icon → Add to lucide-react
2. Check if it's an invalid Lucide icon → Replace and add to lucide-react
3. Check registry for resolution
4. **NEVER checked COMMON_LIBRARY_PATTERNS** ❌

Since `Image` is a valid PascalCase component name, the validator assumed it was a Lucide icon and added it to `lucide-react` imports.

## Solution

### File Modified
`lib/langgraph/validation/post-gen/import-validator.ts:151-213`

### Changes Made

**Added COMMON_LIBRARY_PATTERNS check FIRST:**

```typescript
for (const component of jsxComponents) {
  if (imports.has(component)) continue;

  // FIRST: Check if it's a known Next.js or library component ✅ NEW!
  let foundInCommonLibrary = false;
  for (const [library, pattern] of Object.entries(COMMON_LIBRARY_PATTERNS)) {
    if (pattern.test(component)) {
      const importType = DEFAULT_IMPORT_LIBRARIES.has(library) ? 'default' : 'named';
      errors.push({
        message: `Component '${component}' is used but not imported from '${library}'`,
        suggestion: `Add to imports: import ${importType === 'default' ? component : `{ ${component} }`} from '${library}'`,
      });
      foundInCommonLibrary = true;
      break;
    }
  }
  if (foundInCommonLibrary) continue;

  // SECOND: Check if it's a valid Lucide icon
  if (isValidLucideIcon(component)) {
    // ... add to lucide-react
  }

  // THIRD: Check if it's an invalid Lucide icon
  // FOURTH: Check registry
}
```

### New Check Order (✅ CORRECT)
1. **FIRST**: Check `COMMON_LIBRARY_PATTERNS` for Next.js components (`Image`, `Link`, etc.)
2. **SECOND**: Check if it's a valid Lucide icon
3. **THIRD**: Check if it's an invalid Lucide icon that needs replacement
4. **FOURTH**: Check registry for custom components

## COMMON_LIBRARY_PATTERNS
These patterns are already defined in the file:

```typescript
const COMMON_LIBRARY_PATTERNS: Record<string, RegExp> = {
  'next/link': /^Link$/,
  'next/image': /^Image$/,  // ✅ Now checked FIRST!
  'next/navigation': /^(useRouter|usePathname|useSearchParams|redirect|notFound)$/,
  '@radix-ui/react-dialog': /^Dialog$/,
  '@radix-ui/react-toast': /^Toast$/,
};

const DEFAULT_IMPORT_LIBRARIES = new Set(['next/link', 'next/image']);
```

## Impact

### Before Fix (❌)
```typescript
// WRONG: Added to lucide-react
import { Star, Menu, Image } from 'lucide-react'

<Image src="/photo.jpg" alt="Photo" />  // ❌ ERROR: 'src' doesn't exist on Lucide icon
```

### After Fix (✅)
```typescript
// CORRECT: Separate imports
import { Star, Menu } from 'lucide-react'
import Image from 'next/image'

<Image src="/photo.jpg" alt="Photo" />  // ✅ Works!
```

## Benefits
- ✅ **Next.js components correctly recognized** - `Image`, `Link`, etc.
- ✅ **Proper import suggestions** - Default vs named imports
- ✅ **No more false positives** - Library components checked before Lucide
- ✅ **TypeScript compilation succeeds** - Correct component types

## Related Components Protected
This fix also protects these Next.js components from being incorrectly added to lucide-react:
- `Image` from `next/image`
- `Link` from `next/link`
- `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`
- `Dialog` from `@radix-ui/react-dialog`
- `Toast` from `@radix-ui/react-toast`

## Testing
- [x] `Image` component resolves to `next/image`
- [x] Default import used for `Image` and `Link`
- [x] Named imports used for Next.js hooks
- [x] Lucide icons still work correctly
- [x] No false positives for Next.js components

## Date
2025-11-14

## Status
**✅ COMPLETE** - Import validator now checks library components before Lucide icons

## Note
This issue was **NOT related to the auth changes** - it was a pre-existing bug in the import validator that became visible when the AI generated code using the Next.js `Image` component.
