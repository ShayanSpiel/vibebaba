#!/usr/bin/env node
/**
 * Test Gemini API with detailed error logging
 */

import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
  console.log('🧪 Testing Gemini API with detailed logging...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    return;
  }

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  console.log(`📡 Testing: ${model}`);
  console.log(`🔗 URL: ${url.replace(GEMINI_API_KEY, 'API_KEY')}\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test' }]
        }]
      })
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    console.log(`\n📦 Content-Type: ${contentType}`);

    const text = await response.text();
    console.log(`\n📄 Response (first 1000 chars):`);
    console.log(text.substring(0, 1000));

    if (contentType?.includes('application/json')) {
      const data = JSON.parse(text);
      console.log('\n✅ Valid JSON response');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ Response is not JSON!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testGemini();
