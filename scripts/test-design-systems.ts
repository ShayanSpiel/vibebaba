/**
 * Test script for design system configuration
 *
 * Usage: npx tsx scripts/test-design-systems.ts
 */

import {
  COMPONENT_LIBRARIES,
  getActiveLibraries,
  getConfigSummary,
  applyPreset,
  toggleLibrary,
} from '../lib/component-library-config';
import { buildComponentLibraryFromNeeds } from '../lib/component-builder';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('DESIGN SYSTEM CONFIGURATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Default Configuration
console.log('✅ TEST 1: Default Configuration');
console.log(getConfigSummary());

// Test 2: Switch to Ant Design Only
console.log('\n✅ TEST 2: Switch to Ant Design Only');
applyPreset('antDesignOnly');
console.log(getConfigSummary());

// Test 3: Switch to DaisyUI Only
console.log('\n✅ TEST 3: Switch to DaisyUI Only');
applyPreset('daisyuiOnly');
console.log(getConfigSummary());

// Test 4: Switch to shadcn Only
console.log('\n✅ TEST 4: Switch to shadcn Only');
applyPreset('shadcnOnly');
console.log(getConfigSummary());

// Test 5: All Libraries
console.log('\n✅ TEST 5: All Libraries Enabled');
applyPreset('all');
console.log(getConfigSummary());

// Test 6: Component Building with Default Config
console.log('\n✅ TEST 6: Component Building Test (Default Config)');
applyPreset('default');

const componentNeeds = {
  navigation: 'main',
  hero: 'main',
  features: 'grid',
  pricing: 'threeTier',
  footer: 'main',
};

const componentLibrary = buildComponentLibraryFromNeeds(componentNeeds);
const componentPreview = componentLibrary.substring(0, 500) + '...';
console.log('Component library section (preview):');
console.log(componentPreview);

// Test 7: Component Building with Ant Design Only
console.log('\n✅ TEST 7: Component Building with Ant Design Only');
applyPreset('antDesignOnly');
const antdComponentLibrary = buildComponentLibraryFromNeeds(componentNeeds);
const antdPreview = antdComponentLibrary.substring(0, 500) + '...';
console.log('Ant Design component library section (preview):');
console.log(antdPreview);

// Test 8: Restore Default
console.log('\n✅ TEST 8: Restore Default Configuration');
applyPreset('default');
console.log(getConfigSummary());

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('ALL TESTS COMPLETED SUCCESSFULLY ✨');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
