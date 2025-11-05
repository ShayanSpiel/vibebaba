#!/usr/bin/env node
/**
 * Test Gemini API connectivity
 */

import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }

  console.log(`✅ API Key found: ${GEMINI_API_KEY.substring(0, 10)}...`);

  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

  for (const model of models) {
    console.log(`\n🤖 Testing ${model}...`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say "Hello" in one word' }]
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`   ✅ ${model}: "${text?.trim()}"`);
      } else {
        const error = await response.json();
        console.log(`   ❌ ${model}: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ ${model}: ${error.message}`);
    }
  }
}

testGeminiAPI();
