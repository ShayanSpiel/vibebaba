#!/usr/bin/env node
/**
 * Test script to debug app generation issues
 */

async function testAppGeneration() {
  const testDescription = "Create a simple todo list app";

  console.log('🧪 Testing app generation workflow...\n');
  console.log(`Description: "${testDescription}"\n`);

  try {
    console.log('1️⃣  Calling /api/langgraph/execute...');

    const response = await fetch('http://localhost:3000/api/langgraph/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth, but we can see the error
      },
      body: JSON.stringify({
        description: testDescription
      })
    });

    const contentType = response.headers.get('content-type');
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📊 Content-Type: ${contentType}`);

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('\n📦 Response Data:');
      console.log(JSON.stringify(data, null, 2));

      if (data.error) {
        console.log('\n❌ ERROR:', data.error);
      }

      if (data.success) {
        console.log('\n✅ SUCCESS!');
        console.log(`   - Files: ${data.files?.length || 0}`);
        console.log(`   - Backend: ${data.backendConfig ? 'YES' : 'NO'}`);
        console.log(`   - Completed nodes: ${data.completedNodes?.join(' → ')}`);
      }
    } else {
      const text = await response.text();
      console.log('\n❌ Non-JSON response:');
      console.log(text.substring(0, 500));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAppGeneration();
