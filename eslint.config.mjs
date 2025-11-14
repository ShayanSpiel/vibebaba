// @ts-check
/**
 * ESLint Configuration
 *
 * Role: Type-aware TypeScript linting ONLY
 * - Async/Promise validation (no-floating-promises, await-thenable)
 * - TypeScript type checking rules
 * - Complex rules that Biome cannot handle
 *
 * Note: Biome handles formatting and basic linting (see biome.json)
 */
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'deployment-server',
      'pb_migrations',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs'
    ]
  }
];
