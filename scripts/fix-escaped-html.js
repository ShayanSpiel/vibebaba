#!/usr/bin/env node

/**
 * Fix Escaped HTML in Deployed Projects
 *
 * This script fixes HTML files that have escaped quotes (\") and other
 * escape sequences that prevent CSS/JS from loading properly.
 *
 * Usage: node scripts/fix-escaped-html.js
 */

const fs = require('fs-extra');
const path = require('path');

const DEPLOYMENTS_DIR = path.join(__dirname, '../deployment-server/deployments');

/**
 * Unescape HTML content
 */
function unescapeContent(content) {
  return content
    .replace(/\\n/g, '\n') // Fix newlines
    .replace(/\\"/g, '"') // Fix double quotes
    .replace(/\\'/g, "'") // Fix single quotes
    .replace(/\\t/g, '\t') // Fix tabs
    .replace(/\\\\/g, '\\'); // Fix escaped backslashes
}

/**
 * Process a single HTML file
 */
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    // Check if file has escaped content
    if (content.includes('\\"') || content.includes('\\n')) {
      console.log(`📝 Fixing: ${path.relative(DEPLOYMENTS_DIR, filePath)}`);

      const fixed = unescapeContent(content);
      await fs.writeFile(filePath, fixed, 'utf8');

      console.log(`✅ Fixed: ${path.relative(DEPLOYMENTS_DIR, filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Process all projects
 */
async function fixAllProjects() {
  console.log('🔍 Scanning deployment directory...\n');

  if (!(await fs.pathExists(DEPLOYMENTS_DIR))) {
    console.log('❌ Deployments directory not found:', DEPLOYMENTS_DIR);
    return;
  }

  const projects = await fs.readdir(DEPLOYMENTS_DIR);
  let totalFixed = 0;
  let totalScanned = 0;

  for (const projectDir of projects) {
    if (!projectDir.startsWith('project-')) continue;

    const projectPath = path.join(DEPLOYMENTS_DIR, projectDir);
    const stat = await fs.stat(projectPath);

    if (!stat.isDirectory()) continue;

    console.log(`\n📂 Project: ${projectDir}`);

    // Find all HTML files in the project
    const files = await fs.readdir(projectPath);

    for (const file of files) {
      if (file.endsWith('.html')) {
        const filePath = path.join(projectPath, file);
        totalScanned++;

        const fixed = await processFile(filePath);
        if (fixed) totalFixed++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Files scanned: ${totalScanned}`);
  console.log(`   Files fixed: ${totalFixed}`);
  console.log(`   Files unchanged: ${totalScanned - totalFixed}`);
  console.log('='.repeat(50));
}

// Run the script
fixAllProjects()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
