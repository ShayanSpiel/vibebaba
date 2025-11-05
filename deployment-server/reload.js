#!/usr/bin/env node

/**
 * Reload Helper Script
 * Triggers a reload notification to the deployment server
 * Useful when running in manual mode (npm run dev:manual)
 */

const http = require('http');

const PORT = 4000;

console.log('🔄 Sending reload signal to deployment server...');

const postData = JSON.stringify({
  timestamp: new Date().toISOString()
});

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/reload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅', response.message);
    } catch (e) {
      console.log('✅ Reload signal sent');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Failed to send reload signal:', error.message);
  console.error('   Make sure the deployment server is running on port', PORT);
  process.exit(1);
});

req.write(postData);
req.end();
