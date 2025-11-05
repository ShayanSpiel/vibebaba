// Test API Keys Authentication
// Usage: npx tsx lib/test-api-keys.ts

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

interface TestResult {
  provider: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
}

const results: TestResult[] = [];

async function testGeminiAuth() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    results.push({
      provider: 'Gemini',
      status: 'skipped',
      message: 'API key not configured'
    });
    return;
  }

  try {
    // Try the v1 endpoint instead of v1beta
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (response.ok) {
      results.push({
        provider: 'Gemini',
        status: 'success',
        message: '✅ Authentication successful'
      });
    } else if (response.status === 403) {
      results.push({
        provider: 'Gemini',
        status: 'failed',
        message: `❌ API key invalid or API not enabled. Visit https://aistudio.google.com/apikey`
      });
    } else {
      const errorText = await response.text();
      results.push({
        provider: 'Gemini',
        status: 'failed',
        message: `❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`
      });
    }
  } catch (error: any) {
    results.push({
      provider: 'Gemini',
      status: 'failed',
      message: `❌ Error: ${error.message}`
    });
  }
}

async function testMistralAuth() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey || apiKey === 'your-mistral-api-key') {
    results.push({
      provider: 'Mistral',
      status: 'skipped',
      message: 'API key not configured'
    });
    return;
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      results.push({
        provider: 'Mistral',
        status: 'success',
        message: '✅ Authentication successful'
      });
    } else {
      const errorText = await response.text();
      results.push({
        provider: 'Mistral',
        status: 'failed',
        message: `❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`
      });
    }
  } catch (error: any) {
    results.push({
      provider: 'Mistral',
      status: 'failed',
      message: `❌ Error: ${error.message}`
    });
  }
}

async function testCodestralAuth() {
  const apiKey = process.env.CODESTRAL_API_KEY;

  if (!apiKey || apiKey === 'your-codestral-api-key') {
    results.push({
      provider: 'Codestral',
      status: 'skipped',
      message: 'API key not configured'
    });
    return;
  }

  try {
    // Codestral uses the regular Mistral API endpoint
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      results.push({
        provider: 'Codestral',
        status: 'success',
        message: '✅ Authentication successful'
      });
    } else {
      const errorText = await response.text();
      results.push({
        provider: 'Codestral',
        status: 'failed',
        message: `❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`
      });
    }
  } catch (error: any) {
    results.push({
      provider: 'Codestral',
      status: 'failed',
      message: `❌ Error: ${error.message}`
    });
  }
}

async function testOpenRouterAuth() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your-openrouter-api-key') {
    results.push({
      provider: 'OpenRouter',
      status: 'skipped',
      message: 'API key not configured'
    });
    return;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vibebaba.app',
        'X-Title': 'Vibebaba',
      },
    });

    if (response.ok) {
      results.push({
        provider: 'OpenRouter',
        status: 'success',
        message: '✅ Authentication successful'
      });
    } else {
      const errorText = await response.text();
      results.push({
        provider: 'OpenRouter',
        status: 'failed',
        message: `❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`
      });
    }
  } catch (error: any) {
    results.push({
      provider: 'OpenRouter',
      status: 'failed',
      message: `❌ Error: ${error.message}`
    });
  }
}

async function testGroqAuth() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'your-groq-api-key') {
    results.push({
      provider: 'Groq',
      status: 'skipped',
      message: 'API key not configured'
    });
    return;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      results.push({
        provider: 'Groq',
        status: 'success',
        message: '✅ Authentication successful'
      });
    } else if (response.status === 403) {
      results.push({
        provider: 'Groq',
        status: 'failed',
        message: `❌ API key invalid or expired. Get new key from https://console.groq.com/keys`
      });
    } else {
      const errorText = await response.text();
      results.push({
        provider: 'Groq',
        status: 'failed',
        message: `❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`
      });
    }
  } catch (error: any) {
    results.push({
      provider: 'Groq',
      status: 'failed',
      message: `❌ Error: ${error.message}`
    });
  }
}

async function checkAPIKeyFormat() {
  console.log('\n🔍 Checking API Key Format...\n');

  const keys = [
    { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
    { name: 'MISTRAL_API_KEY', value: process.env.MISTRAL_API_KEY },
    { name: 'CODESTRAL_API_KEY', value: process.env.CODESTRAL_API_KEY },
    { name: 'OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY },
    { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY },
  ];

  for (const key of keys) {
    if (!key.value) {
      console.log(`❌ ${key.name}: Not set`);
    } else if (key.value === `your-${key.name.toLowerCase().replace('_', '-')}`) {
      console.log(`⚠️  ${key.name}: Still using example value`);
    } else {
      const hasWhitespace = key.value.trim() !== key.value;
      const length = key.value.length;
      console.log(`✅ ${key.name}: Set (${length} chars)${hasWhitespace ? ' ⚠️ HAS WHITESPACE!' : ''}`);
    }
  }
}

async function main() {
  console.log('🧪 Testing AI API Authentication\n');
  console.log('='.repeat(60));

  await checkAPIKeyFormat();

  console.log('\n' + '='.repeat(60));
  console.log('\n🌐 Testing API Endpoints...\n');

  await testGeminiAuth();
  await testMistralAuth();
  await testCodestralAuth();
  await testOpenRouterAuth();
  await testGroqAuth();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results:\n');

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const result of results) {
    console.log(`${result.provider.padEnd(15)} ${result.message}`);
    if (result.status === 'success') successCount++;
    else if (result.status === 'failed') failedCount++;
    else skippedCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Success: ${successCount}  ❌ Failed: ${failedCount}  ⏭️  Skipped: ${skippedCount}\n`);

  if (failedCount > 0) {
    console.log('💡 How to Fix Failed Providers:\n');

    for (const result of results) {
      if (result.status === 'failed') {
        console.log(`${result.provider}:`);

        switch (result.provider) {
          case 'Gemini':
            console.log('  1. Visit https://aistudio.google.com/apikey');
            console.log('  2. Sign in with your Google account');
            console.log('  3. Click "Create API Key"');
            console.log('  4. Copy the key and update GEMINI_API_KEY in .env.local\n');
            break;

          case 'Codestral':
            console.log('  Note: Codestral uses the same endpoint as Mistral');
            console.log('  1. If you have Mistral access, try using the same key');
            console.log('  2. Or visit https://console.mistral.ai/');
            console.log('  3. Check if you have Codestral access enabled');
            console.log('  4. Update CODESTRAL_API_KEY in .env.local\n');
            break;

          case 'Groq':
            console.log('  1. Visit https://console.groq.com/keys');
            console.log('  2. Sign in to your Groq account');
            console.log('  3. Create a new API key');
            console.log('  4. Copy the key and update GROQ_API_KEY in .env.local\n');
            break;

          default:
            console.log('  Check the provider console and regenerate your API key\n');
        }
      }
    }

    console.log('\nGeneral Tips:');
    console.log('  • Ensure keys have no whitespace or newlines');
    console.log('  • Verify you have credits/quota for each provider');
    console.log('  • Some providers require enabling APIs in their console');
  }

  process.exit(failedCount > 0 ? 1 : 0);
}

main();
