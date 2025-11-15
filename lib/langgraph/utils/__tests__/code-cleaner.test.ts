/**
 * Tests for code cleaner utilities
 */

import {
  cleanGeneratedCode,
  stripMarkdownCodeBlocks,
  validateGeneratedCode,
} from '../code-cleaner';

describe('Code Cleaner', () => {
  describe('stripMarkdownCodeBlocks', () => {
    it('should strip typescript markdown wrapper', () => {
      const code = `\`\`\`typescript
'use client'

export default function Page() {
  return <div>Hello</div>
}
\`\`\``;
      const cleaned = stripMarkdownCodeBlocks(code);
      expect(cleaned).not.toContain('```');
      expect(cleaned).toContain("'use client'");
      expect(cleaned).toContain('export default function');
    });

    it('should strip javascript markdown wrapper', () => {
      const code = `\`\`\`javascript
const foo = 'bar'
\`\`\``;
      const cleaned = stripMarkdownCodeBlocks(code);
      expect(cleaned).toBe("const foo = 'bar'");
    });

    it('should strip generic markdown wrapper', () => {
      const code = `\`\`\`
function test() {
  return true
}
\`\`\``;
      const cleaned = stripMarkdownCodeBlocks(code);
      expect(cleaned).not.toContain('```');
      expect(cleaned).toContain('function test()');
    });

    it('should handle code without markdown wrappers', () => {
      const code = `const x = 1;`;
      const cleaned = stripMarkdownCodeBlocks(code);
      expect(cleaned).toBe('const x = 1;');
    });
  });

  describe('cleanImports', () => {
    it('should remove empty commas in imports', () => {
      const code = `import { Square, MapPin, , Camera, ChevronRight } from 'lucide-react'`;
      const cleaned = cleanGeneratedCode(code, 'test.tsx');
      expect(cleaned).not.toContain('MapPin, ,');
      expect(cleaned).toContain('MapPin, Camera');
    });

    it('should remove backend imports from frontend code', () => {
      const code = `
import express from 'express'
import cors from 'cors'
import { useState } from 'react'
      `;
      const cleaned = cleanGeneratedCode(code, 'test.tsx');
      expect(cleaned).not.toContain('express');
      expect(cleaned).not.toContain('cors');
      expect(cleaned).toContain('react');
    });
  });

  describe('fixUseStateTypes', () => {
    it('should fix useState with quoted numbers used in Date()', () => {
      const code = `
const [currentMonth, setCurrentMonth] = useState('1')
const [currentYear, setCurrentYear] = useState('2024')

const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
      `;
      const cleaned = cleanGeneratedCode(code, 'test.tsx');
      expect(cleaned).toContain('useState<number>(1)');
      expect(cleaned).toContain('useState<number>(2024)');
    });

    it('should wrap variables in Number() for Date constructor', () => {
      const code = `
const month = '1'
const year = '2024'
const date = new Date(year, month, 0)
      `;
      const cleaned = cleanGeneratedCode(code, 'test.tsx');
      expect(cleaned).toContain('new Date(Number(year), Number(month), 0)');
    });
  });

  describe('validateGeneratedCode', () => {
    it('should detect backend imports', () => {
      const code = `import express from 'express'`;
      const errors = validateGeneratedCode(code, 'test.tsx');
      expect(errors.some((e) => e.includes('backend-only imports'))).toBe(true);
    });

    it('should detect useState type issues', () => {
      const code = `
const [month, setMonth] = useState('1')
const date = new Date(2024, month)
      `;
      const errors = validateGeneratedCode(code, 'test.tsx');
      expect(errors.some((e) => e.includes('incorrect type'))).toBe(true);
    });

    it('should detect empty import commas', () => {
      const code = `import { Foo, , Bar } from 'lib'`;
      const errors = validateGeneratedCode(code, 'test.tsx');
      expect(errors.some((e) => e.includes('invalid import syntax'))).toBe(true);
    });
  });
});
