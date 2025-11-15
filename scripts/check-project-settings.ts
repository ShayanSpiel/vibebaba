#!/usr/bin/env tsx
/**
 * Check existing project_settings_memory records
 * Run: npx tsx scripts/check-project-settings.ts [projectId]
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibebaba.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

async function checkSettings() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('[Check] Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('[Check] ✅ Authenticated\n');

    // Get project ID from command line or fetch all
    const projectId = process.argv[2];

    if (projectId) {
      console.log(`[Check] Looking for project: ${projectId}\n`);
      const records = await pb.collection('project_settings_memory').getFullList({
        filter: `projectId = "${projectId}"`,
      });

      if (records.length === 0) {
        console.log('[Check] ❌ No settings found for this project');
        return;
      }

      const record = records[0];
      const stylingConfig = JSON.parse(record.stylingConfig || '{}');

      console.log('[Check] ✅ Found settings:');
      console.log('[Check] Record ID:', record.id);
      console.log('[Check] Project Name:', record.projectName);
      console.log('[Check] Initial Prompt:', record.initialPrompt?.substring(0, 100) + '...');
      console.log('[Check] Timestamp:', record.timestamp);
      console.log('[Check] Updated At:', record.updatedAt);
      console.log('\n[Check] 🎨 Styling Config Structure:');
      console.log('[Check]   - Keys:', Object.keys(stylingConfig));
      console.log('[Check]   - Has brand?', !!stylingConfig.brand);
      console.log('[Check]   - Has enhancedColors?', !!stylingConfig.enhancedColors);
      console.log('[Check]   - Has enhancedTypography?', !!stylingConfig.enhancedTypography);
      console.log('[Check]   - Has components?', !!stylingConfig.components);
      console.log('[Check]   - Has spacing?', !!stylingConfig.spacing);
      console.log('[Check]   - Has shadows?', !!stylingConfig.shadows);

      if (stylingConfig.brand) {
        console.log('\n[Check] 🏷️  Brand Config:');
        console.log('[Check]   - Brand Name:', stylingConfig.brand.brandName);
        console.log('[Check]   - Design System:', stylingConfig.brand.designSystem);
        console.log('[Check]   - Styling Framework:', stylingConfig.brand.stylingFramework);
      }

      if (stylingConfig.enhancedColors) {
        console.log('\n[Check] 🎨 Enhanced Colors:');
        console.log(
          '[Check]   - Semantic colors:',
          Object.keys(stylingConfig.enhancedColors.semantic || {}).length
        );
        console.log('[Check]   - Dark mode overrides?', !!stylingConfig.enhancedColors.darkMode);
      }

      if (stylingConfig.components) {
        console.log('\n[Check] 🧩 Components:');
        console.log('[Check]   - Component types:', Object.keys(stylingConfig.components));
      }

      console.log('\n[Check] 📄 Full Config (first 500 chars):');
      console.log(JSON.stringify(stylingConfig, null, 2).substring(0, 500) + '...');
    } else {
      // Show all projects
      console.log('[Check] Fetching all project settings...\n');
      const allRecords = await pb.collection('project_settings_memory').getFullList();

      console.log(`[Check] Found ${allRecords.length} project(s):\n`);

      for (const record of allRecords) {
        try {
          // Check if stylingConfig is already an object or needs parsing
          let stylingConfig;
          if (typeof record.stylingConfig === 'string') {
            stylingConfig = JSON.parse(record.stylingConfig);
          } else if (typeof record.stylingConfig === 'object') {
            stylingConfig = record.stylingConfig || {};
          } else {
            stylingConfig = {};
          }

          console.log(`📦 Project: ${record.projectName || 'Unnamed'}`);
          console.log(`   ID: ${record.projectId}`);
          console.log(`   Updated: ${record.updatedAt}`);
          console.log(`   Config type: ${typeof record.stylingConfig}`);
          console.log(
            `   Has enriched config? ${!!stylingConfig.brand && !!stylingConfig.enhancedColors}`
          );
          console.log(`   Config keys: ${Object.keys(stylingConfig).join(', ')}`);
          console.log('');
        } catch (err: any) {
          console.log(`📦 Project: ${record.projectName || 'Unnamed'} - ERROR parsing config`);
          console.log(`   ID: ${record.projectId}`);
          console.log(`   Error: ${err.message}`);
          console.log(`   Raw config type: ${typeof record.stylingConfig}`);
          console.log('');
        }
      }
    }
  } catch (error: any) {
    console.error('[Check] ❌ Error:', error.message);
    if (error.data) {
      console.error('[Check] Details:', error.data);
    }
  }
}

checkSettings();
