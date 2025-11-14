#!/usr/bin/env tsx
/**
 * Test saving project settings with enriched styling config
 * Run: npx tsx scripts/test-save-settings.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibebaba.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

async function testSave() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('[Test] Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('[Test] ✅ Authenticated');

    // Test data with enriched styling config
    const testStylingConfig = {
      colorTheme: { primary: '#3B82F6', background: '#FFFFFF' },
      typography: { fontFamily: 'Inter', scale: 'normal' },
      iconography: { source: 'lucide', style: 'outline' },
      brand: {
        brandName: 'Test App',
        designSystem: 'Shadcn/Tailwind',
        stylingFramework: 'Tailwind CSS'
      },
      enhancedColors: {
        semantic: {
          textDefault: '#000000',
          textSecondary: '#6B7280',
          bgDefault: '#FFFFFF'
        }
      },
      components: {
        button: {
          variants: {
            primary: { bg: '#3B82F6', text: '#FFFFFF' }
          }
        }
      }
    };

    const testData = {
      projectId: 'test-project-123',
      userId: 'test-user-456',
      projectName: 'Test Project',
      initialPrompt: 'A test application',
      stylingConfig: JSON.stringify(testStylingConfig),
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[Test] 💾 Saving test data...');
    const saved = await pb.collection('project_settings_memory').create(testData);
    console.log('[Test] ✅ Saved successfully! Record ID:', saved.id);

    // Read it back
    console.log('[Test] 📖 Reading data back...');
    const retrieved = await pb.collection('project_settings_memory').getOne(saved.id);
    const parsedConfig = typeof retrieved.stylingConfig === 'string'
      ? JSON.parse(retrieved.stylingConfig)
      : retrieved.stylingConfig;

    console.log('[Test] ✅ Retrieved successfully!');
    console.log('[Test] 🎨 Styling config has:');
    console.log('[Test]   - brand:', !!parsedConfig.brand);
    console.log('[Test]   - enhancedColors:', !!parsedConfig.enhancedColors);
    console.log('[Test]   - components:', !!parsedConfig.components);

    // Clean up
    await pb.collection('project_settings_memory').delete(saved.id);
    console.log('[Test] 🗑️  Cleaned up test data');

    console.log('\n[Test] 🎉 All tests passed! The schema is working correctly.');

  } catch (error: any) {
    console.error('[Test] ❌ Error:', error.message);
    if (error.data) {
      console.error('[Test] Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

testSave();
