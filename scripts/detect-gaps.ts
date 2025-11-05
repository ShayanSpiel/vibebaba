/**
 * Detect Gaps Script
 * Runs gap detection and optionally creates generation tasks
 */

import PocketBase from 'pocketbase';
import { autoDetectAndQueue, formatGapReport } from '../lib/gap-detector';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

// Temporarily set pb for gap detector
import * as pocketbaseModule from '../lib/pocketbase';
(pocketbaseModule as any).pb = new PocketBase(PB_URL);

interface Options {
  createTasks?: boolean;
  reportOnly?: boolean;
}

async function runGapDetection(options: Options = {}) {
  console.log('\n🔍 GAP DETECTION SCRIPT\n');
  console.log(`PocketBase URL: ${PB_URL}\n`);
  console.log('Options:');
  console.log(`  Create tasks: ${options.createTasks || false}`);
  console.log(`  Report only: ${options.reportOnly || false}\n`);

  try {
    if (options.reportOnly) {
      // Just run detection, don't create tasks
      const { detectAllGaps } = await import('../lib/gap-detector');
      const report = await detectAllGaps();

      const formatted = formatGapReport(report);
      console.log(formatted);

      return;
    }

    // Run detection and create tasks
    const { report, tasksCreated } = await autoDetectAndQueue();

    const formatted = formatGapReport(report);
    console.log(formatted);

    console.log(`\n📋 Tasks Created: ${tasksCreated}\n`);

    if (tasksCreated > 0 && !options.createTasks) {
      console.log('ℹ️  Tasks were created but not executed. Use --create-tasks to execute them.\n');
    }
  } catch (error) {
    console.error('❌ Gap detection failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: Options = {};

for (const arg of args) {
  if (arg === '--create-tasks') {
    options.createTasks = true;
  } else if (arg === '--report-only') {
    options.reportOnly = true;
  }
}

// Run gap detection
runGapDetection(options).catch(console.error);
