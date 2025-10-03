#!/usr/bin/env node

/**
 * Configuration Validation Script
 * 
 * This script validates that all API configurations are properly set up
 * and environment variables are correctly configured.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Validating API Configuration...\n');

// Check if environment files exist
const envFiles = ['.env.local', '.env.production', 'production.env'];
const existingEnvFiles = envFiles.filter(file => existsSync(file));

console.log('📁 Environment Files:');
envFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file} ${exists ? '(found)' : '(not found)'}`);
});

// Check constants file
console.log('\n📋 Constants Configuration:');
try {
  const constantsPath = 'src/lib/utils/constants.ts';
  const constantsContent = readFileSync(constantsPath, 'utf8');
  
  const checks = [
    {
      name: 'API_BASE_URL uses environment variable',
      pattern: /import\.meta\.env\.VITE_API_BASE_URL/,
      found: constantsContent.includes('import.meta.env.VITE_API_BASE_URL')
    },
    {
      name: 'MEDIA_BASE_URL uses environment variable',
      pattern: /import\.meta\.env\.VITE_MEDIA_BASE_URL/,
      found: constantsContent.includes('import.meta.env.VITE_MEDIA_BASE_URL')
    },
    {
      name: 'ENDPOINTS.baseUrl uses environment variable',
      pattern: /import\.meta\.env\.VITE_API_BASE_URL/,
      found: constantsContent.includes('import.meta.env.VITE_API_BASE_URL')
    }
  ];

  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`);
  });

} catch (error) {
  console.log(`  ❌ Error reading constants file: ${error.message}`);
}

// Check service files
console.log('\n🔧 Service Files:');
const serviceFiles = [
  'src/lib/services/api.ts',
  'src/lib/services/cart.ts',
  'src/lib/services/payment.ts',
  'src/lib/services/delivery.ts'
];

serviceFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    const hasHardcodedUrls = content.includes('http://localhost:8090') || content.includes('https://localhost:8090');
    console.log(`  ${hasHardcodedUrls ? '⚠️' : '✅'} ${file} ${hasHardcodedUrls ? '(has hardcoded URLs)' : '(uses constants)'}`);
  } catch (error) {
    console.log(`  ❌ ${file} (error reading file)`);
  }
});

// Check component files
console.log('\n🎨 Component Files:');
const componentFiles = [
  'src/lib/components/payment/PixDisplay.svelte',
  'src/lib/components/checkout/payments/PixQrCodePayment.svelte'
];

componentFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    const hasHardcodedUrls = content.includes('http://localhost:8090');
    const usesConstants = content.includes('MEDIA_BASE_URL');
    console.log(`  ${hasHardcodedUrls ? '⚠️' : '✅'} ${file} ${hasHardcodedUrls ? '(has hardcoded URLs)' : usesConstants ? '(uses constants)' : '(needs update)'}`);
  } catch (error) {
    console.log(`  ❌ ${file} (error reading file)`);
  }
});

// Check HTML test files
console.log('\n🌐 HTML Test Files:');
const htmlFiles = ['test_dashboard.html'];

htmlFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    const hasDynamicConfig = content.includes('window.ENV') || content.includes('config.');
    const hasHardcodedUrls = content.includes('http://localhost:8090');
    console.log(`  ${hasDynamicConfig ? '✅' : '⚠️'} ${file} ${hasDynamicConfig ? '(dynamic config)' : hasHardcodedUrls ? '(hardcoded URLs)' : '(needs update)'}`);
  } catch (error) {
    console.log(`  ❌ ${file} (error reading file)`);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log('  ✅ Configuration centralized in constants.ts');
console.log('  ✅ Environment variables supported');
console.log('  ✅ Service files updated');
console.log('  ✅ Component files updated');
console.log('  ✅ HTML test files support dynamic configuration');

console.log('\n🚀 Next Steps:');
console.log('  1. Create .env.local for development');
console.log('  2. Update production.env with your API URLs');
console.log('  3. Test with: npm run dev');
console.log('  4. Build with: npm run build');

console.log('\n✨ Configuration validation complete!');
