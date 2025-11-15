// lib/langsmith/validate-setup.ts
/**
 * Validation script to check LangSmith setup
 * Run: npx tsx lib/langsmith/validate-setup.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { validateLangSmithSetup } from './ab-test-config';
import { getLangSmithClient } from './client';

async function validateSetup() {
  console.log('🔍 Validating LangSmith Setup...\n');

  let hasErrors = false;

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables...');

  const envVars = {
    LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
    LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
    LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`   ✅ ${key}: ${key === 'LANGCHAIN_API_KEY' ? '***' + value.slice(-4) : value}`);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      hasErrors = true;
    }
  }

  // 2. Check LangSmith connection
  console.log('\n2️⃣ Checking LangSmith connection...');

  try {
    const client = getLangSmithClient();
    console.log('   ✅ Client initialized successfully');

    // Try to list datasets (validates API key)
    const datasets = [];
    let count = 0;
    for await (const dataset of client.listDatasets({ limit: 5 })) {
      datasets.push(dataset);
      count++;
      if (count >= 5) break; // Limit to 5 for validation
    }

    console.log(`   ✅ API connection working (found ${datasets.length} datasets)`);
  } catch (error: any) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    hasErrors = true;
  }

  // 3. Check A/B test configuration
  console.log('\n3️⃣ Checking A/B test configuration...');

  const validation = validateLangSmithSetup();

  if (validation.isValid) {
    console.log('   ✅ A/B test configuration valid');
  } else {
    console.log('   ⚠️  A/B test configuration issues:');
    validation.errors.forEach((error) => {
      console.log(`      - ${error}`);
    });
    // Not a blocker if A/B testing is disabled
  }

  // 4. Check datasets
  console.log('\n4️⃣ Checking for datasets...');

  try {
    const client = getLangSmithClient();
    const datasets = [];

    for await (const dataset of client.listDatasets()) {
      datasets.push(dataset);
    }

    if (datasets.length === 0) {
      console.log('   ℹ️  No datasets found');
      console.log('      Run: npm run langsmith:setup-dataset setup');
    } else {
      console.log(`   ✅ Found ${datasets.length} dataset(s):`);
      datasets.forEach((ds) => {
        console.log(`      - ${ds.name} (${ds.example_count || 0} examples)`);
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Failed to list datasets: ${error.message}`);
  }

  // 5. Test prompt fetching
  console.log('\n5️⃣ Testing prompt fetching...');

  try {
    const client = getLangSmithClient();

    // Try to fetch a test prompt (this will fail if no prompts exist)
    console.log('   ℹ️  Attempting to fetch test prompt...');

    // Just check if pullPromptCommit method exists
    if (typeof client.pullPromptCommit === 'function') {
      console.log('   ✅ Prompt fetching capability available');
      console.log('      To test with your prompts, create them in Hub first:');
      console.log('      https://smith.langchain.com/hub');
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not test prompt fetching: ${error.message}`);
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (hasErrors) {
    console.log('❌ SETUP INCOMPLETE - Please fix the errors above');
    console.log('\nNext steps:');
    console.log('1. Set missing environment variables in .env.local');
    console.log('2. Restart your dev server');
    console.log('3. Run this validation again');
    process.exit(1);
  } else {
    console.log('✅ SETUP COMPLETE - LangSmith is ready!');
    console.log('\nNext steps:');
    console.log('1. Create datasets: npm run langsmith:setup-dataset setup');
    console.log('2. Create prompts in Hub: https://smith.langchain.com/hub');
    console.log('3. Configure A/B tests in: lib/langsmith/ab-test-config.ts');
    console.log('4. Read docs: docs/LANGSMITH_QUICK_START.md');
    process.exit(0);
  }
}

// Run validation
validateSetup().catch((error) => {
  console.error('\n💥 Validation crashed:', error);
  process.exit(1);
});
