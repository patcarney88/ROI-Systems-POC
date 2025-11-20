#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes build output and provides actionable insights
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist');
const statsFile = path.join(distPath, 'stats.html');

console.log('\n📦 Bundle Analysis Report\n');
console.log('═'.repeat(60));

// Check if build exists
if (!fs.existsSync(distPath)) {
  console.error('❌ No build found. Run `npm run build` first.');
  process.exit(1);
}

// Get all JS files
const jsFiles = [];
const cssFiles = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'stats.html') {
      scanDir(filePath);
    } else if (file.endsWith('.js')) {
      jsFiles.push({ name: file, size: stat.size, path: filePath });
    } else if (file.endsWith('.css')) {
      cssFiles.push({ name: file, size: stat.size, path: filePath });
    }
  });
}

// Check if assets directory exists
if (fs.existsSync(path.join(distPath, 'assets'))) {
  scanDir(path.join(distPath, 'assets'));
} else {
  console.error('❌ No assets directory found in build output.');
  process.exit(1);
}

// Sort by size
jsFiles.sort((a, b) => b.size - a.size);
cssFiles.sort((a, b) => b.size - a.size);

// Calculate totals
const totalJS = jsFiles.reduce((sum, f) => sum + f.size, 0);
const totalCSS = cssFiles.reduce((sum, f) => sum + f.size, 0);
const total = totalJS + totalCSS;

// Display results
console.log('\n📊 JavaScript Bundles:');
if (jsFiles.length > 0) {
  jsFiles.forEach(file => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const percentage = totalJS > 0 ? ((file.size / totalJS) * 100).toFixed(1) : '0.0';
    const barLength = Math.round(parseFloat(percentage) / 2);
    const bar = '█'.repeat(Math.max(0, barLength));
    console.log(`  ${file.name.substring(0, 30).padEnd(30)} ${sizeKB.padStart(8)} KB ${percentage.padStart(5)}% ${bar}`);
  });
  console.log(`\n  Total JavaScript: ${(totalJS / 1024).toFixed(2)} KB`);
} else {
  console.log('  No JavaScript files found');
}

console.log('\n🎨 CSS Bundles:');
if (cssFiles.length > 0) {
  cssFiles.forEach(file => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const percentage = totalCSS > 0 ? ((file.size / totalCSS) * 100).toFixed(1) : '0.0';
    const barLength = Math.round(parseFloat(percentage) / 2);
    const bar = '█'.repeat(Math.max(0, barLength));
    console.log(`  ${file.name.substring(0, 30).padEnd(30)} ${sizeKB.padStart(8)} KB ${percentage.padStart(5)}% ${bar}`);
  });
  console.log(`\n  Total CSS: ${(totalCSS / 1024).toFixed(2)} KB`);
} else {
  console.log('  No CSS files found');
}

console.log('\n📦 Overall Summary:');
console.log(`  Total Bundle Size: ${(total / 1024).toFixed(2)} KB`);
console.log(`  Estimated Gzip (~70%): ${(total * 0.3 / 1024).toFixed(2)} KB`);

// Budget checks
const budgets = {
  js: 500 * 1024, // 500 KB
  css: 150 * 1024, // 150 KB
  total: 2000 * 1024, // 2 MB
};

console.log('\n💰 Budget Status:');
console.log(`  JavaScript: ${totalJS > budgets.js ? '❌' : '✅'} ${(totalJS / 1024).toFixed(2)} / ${(budgets.js / 1024).toFixed(2)} KB`);
console.log(`  CSS: ${totalCSS > budgets.css ? '❌' : '✅'} ${(totalCSS / 1024).toFixed(2)} / ${(budgets.css / 1024).toFixed(2)} KB`);
console.log(`  Total: ${total > budgets.total ? '❌' : '✅'} ${(total / 1024).toFixed(2)} / ${(budgets.total / 1024).toFixed(2)} KB`);

// Recommendations
console.log('\n💡 Recommendations:');

if (totalJS > budgets.js) {
  console.log('  ⚠️  JavaScript bundle exceeds budget');
  console.log('     - Consider code splitting with React.lazy()');
  console.log('     - Analyze large dependencies');
  console.log('     - Enable tree-shaking for unused code');
}

if (totalCSS > budgets.css) {
  console.log('  ⚠️  CSS bundle exceeds budget');
  console.log('     - Remove unused CSS with PurgeCSS');
  console.log('     - Consider CSS-in-JS for critical styles only');
}

const largeFiles = jsFiles.filter(f => f.size > 200 * 1024);
if (largeFiles.length > 0) {
  console.log('  ⚠️  Large JavaScript files detected:');
  largeFiles.forEach(f => {
    console.log(`     - ${f.name}: ${(f.size / 1024).toFixed(2)} KB`);
  });
  console.log('     Consider splitting these files');
}

// Check for vendor chunks
const vendorFiles = jsFiles.filter(f => f.name.includes('vendor'));
if (vendorFiles.length === 0) {
  console.log('  ℹ️  No vendor chunks detected');
  console.log('     - Consider splitting vendor code for better caching');
} else {
  const vendorSize = vendorFiles.reduce((sum, f) => sum + f.size, 0);
  console.log(`  ✅ Vendor chunks: ${vendorFiles.length} files, ${(vendorSize / 1024).toFixed(2)} KB total`);
}

console.log('\n📈 Visual Analysis:');
if (fs.existsSync(statsFile)) {
  console.log(`  ✅ Open ${statsFile} in your browser for interactive visualization`);
} else {
  console.log(`  ℹ️  Run 'npm run build:analyze' to generate visual report`);
}

console.log('\n' + '═'.repeat(60) + '\n');