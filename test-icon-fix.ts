/**
 * Test script to verify icon import validation and auto-fix
 */

import fs from 'fs';
import path from 'path';
import {
  fixImportErrors,
  validateImports,
} from './lib/langgraph/validation/post-gen/import-validator';
import type { FileToValidate } from './lib/langgraph/validation/post-gen/types';

// Load the failed file
const failedFilePath =
  '/Users/shayan/Desktop/Projects/VB/deployment-server/builds/project-ua5R7C2ZHhqNIzN/src/app/page.tsx';

console.log('🧪 Testing Icon Import Validation & Auto-Fix\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!fs.existsSync(failedFilePath)) {
  console.error('❌ Failed file not found:', failedFilePath);
  process.exit(1);
}

const content = fs.readFileSync(failedFilePath, 'utf-8');

const files: FileToValidate[] = [
  {
    path: failedFilePath,
    content,
  },
];

console.log('📄 File:', failedFilePath);
console.log('📏 Lines:', content.split('\n').length);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Validate
console.log('Step 1: Running validation...\n');
const errors = validateImports(files);

console.log(`\n Found ${errors.length} validation errors:\n`);
errors.forEach((error, index) => {
  console.log(`${index + 1}. [${error.severity}] ${error.rule}`);
  console.log(`   ${error.message}`);
  console.log(`   ${error.suggestion}`);
  console.log(`   Auto-fixable: ${error.autoFixable ? '✅' : '❌'}\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 2: Auto-fix
console.log('Step 2: Running auto-fix...\n');
const fixedFiles = fixImportErrors(files, errors);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 3: Verify fix
console.log('Step 3: Verifying fixes...\n');
const fixedErrors = validateImports(fixedFiles);

console.log(`Remaining errors: ${fixedErrors.length}\n`);

if (fixedErrors.length === 0) {
  console.log('✅ All errors fixed!\n');

  // Show the fixed import line
  const fixedContent = fixedFiles[0].content;
  const lines = fixedContent.split('\n');
  const lucideImportLine = lines.find((line) => line.includes('lucide-react'));

  console.log('Fixed lucide-react import:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(lucideImportLine);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save the fixed file
  const outputPath = failedFilePath.replace('.tsx', '.fixed.tsx');
  fs.writeFileSync(outputPath, fixedContent);
  console.log(`💾 Fixed file saved to: ${outputPath}\n`);
} else {
  console.log('❌ Some errors could not be fixed:\n');
  fixedErrors.forEach((error, index) => {
    console.log(`${index + 1}. [${error.severity}] ${error.rule}`);
    console.log(`   ${error.message}\n`);
  });
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🏁 Test complete!\n');
