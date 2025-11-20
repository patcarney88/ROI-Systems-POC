#!/usr/bin/env node
/**
 * ROI Systems Codebase Analysis using Superforge 8.0
 *
 * Uses the Discoverer meta-agent to perform comprehensive codebase analysis
 */

// Use direct path to dist files since packages may not be published
const path = require('path');
const fs = require('fs');
const superforgeRoot = path.resolve(__dirname, '../../../Superforge-8.0-node');

// Load the built modules
const { Discoverer } = require(path.join(superforgeRoot, 'dist/packages/meta-agents/src/Discoverer.js'));
const { DiscovererAgent } = require(path.join(superforgeRoot, 'dist/packages/meta-agents/src/DiscovererAgent.js'));

async function analyzeROISystemsCodebase() {
  console.log('🔍 Starting ROI Systems Codebase Analysis with Superforge 8.0...\n');

  try {
    // Initialize Discoverer agent
    const discoverer = new Discoverer({
      name: 'ROI-Systems-Discoverer',
      capabilities: ['codebase-analysis', 'pattern-detection', 'tech-debt-analysis'],
      environment: 'production'
    });

    console.log('📊 Phase 1: Analyzing codebase structure...');

    // Analyze the codebase
    const analysisTask = {
      id: 'roi-systems-analysis',
      type: 'discovery',
      input: {
        path: process.cwd(),
        depth: 3,
        format: 'detailed',
        includePatterns: true,
        includeTechDebt: true,
        streamingMode: false
      },
      metadata: {
        project: 'ROI Systems POC',
        timestamp: new Date().toISOString()
      }
    };

    // Execute discovery
    const result = await discoverer.execute(analysisTask);

    console.log('\n✅ Analysis Complete!\n');
    console.log('='.repeat(80));
    console.log('PROJECT SUMMARY');
    console.log('='.repeat(80));

    if (result.summary) {
      console.log(`\n📁 Project: ${result.summary.project.name}`);
      console.log(`📍 Path: ${result.summary.project.path}`);
      console.log(`📦 Size: ${result.summary.project.size}`);

      console.log(`\n📈 Metrics:`);
      console.log(`   - Files: ${result.summary.metrics.files}`);
      console.log(`   - Directories: ${result.summary.metrics.directories}`);
      console.log(`   - Total Lines: ${result.summary.metrics.totalLines.toLocaleString()}`);

      console.log(`\n🔤 Languages:`);
      Object.entries(result.summary.metrics.languages || {})
        .sort((a, b) => b[1] - a[1])
        .forEach(([lang, count]) => {
          console.log(`   - ${lang}: ${count.toLocaleString()} lines`);
        });

      console.log(`\n💚 Health Score: ${result.summary.health.score}/100 (Grade: ${result.summary.health.grade})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('CODE QUALITY & ARCHITECTURE');
    console.log('='.repeat(80));

    if (result.insights) {
      console.log(`\n🎯 Code Quality Score: ${result.insights.codeQuality.score}/100`);

      if (result.insights.codeQuality.factors && result.insights.codeQuality.factors.length > 0) {
        console.log('\n✨ Quality Factors:');
        result.insights.codeQuality.factors.forEach(factor => {
          console.log(`   - ${factor}`);
        });
      }

      if (result.insights.codeQuality.recommendations && result.insights.codeQuality.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.insights.codeQuality.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }

      console.log(`\n🏗️  Architecture Type: ${result.insights.architecture.type}`);
      console.log(`   Quality: ${result.insights.architecture.quality}`);

      if (result.insights.architecture.recommendations && result.insights.architecture.recommendations.length > 0) {
        console.log('\n📐 Architecture Recommendations:');
        result.insights.architecture.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }

      if (result.insights.frameworks && result.insights.frameworks.detected) {
        console.log('\n🔧 Detected Frameworks:');
        result.insights.frameworks.detected.forEach(fw => {
          console.log(`   - ${fw.name} ${fw.version || ''} (${fw.confidence}% confidence)`);
        });
      }

      console.log('\n⚠️  Tech Debt:');
      console.log(`   - Total Items: ${result.insights.techDebt.totalItems}`);
      console.log(`   - Estimated Effort: ${result.insights.techDebt.estimatedEffort} hours`);

      if (result.insights.techDebt.priorityBreakdown) {
        console.log('   - Priority Breakdown:');
        Object.entries(result.insights.techDebt.priorityBreakdown).forEach(([priority, count]) => {
          console.log(`     • ${priority}: ${count} items`);
        });
      }

      console.log(`\n🚨 Risk Level: ${result.insights.risks.level.toUpperCase()}`);
      if (result.insights.risks.items && result.insights.risks.items.length > 0) {
        console.log('   Risk Items:');
        result.insights.risks.items.forEach(risk => {
          console.log(`   - ${risk}`);
        });
      }
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'SUPERFORGE_ANALYSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Generate OpenSpec if requirements are found
    if (result.requirements) {
      console.log('\n' + '='.repeat(80));
      console.log('GENERATING OPENSPEC');
      console.log('='.repeat(80));

      console.log('\n📝 Extracting requirements from codebase...');
      console.log(`   - Functional: ${result.requirements.functional?.length || 0}`);
      console.log(`   - Non-Functional: ${result.requirements.nonFunctional?.length || 0}`);
      console.log(`   - Tech Debt: ${result.requirements.techDebt?.length || 0}`);

      // Note: OpenSpec generation would happen here
      console.log('\n💡 Next Step: Use RequirementParser and SpecGenerator to create OpenSpec');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Analysis Complete!');
    console.log('='.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run analysis
if (require.main === module) {
  analyzeROISystemsCodebase()
    .then(() => {
      console.log('✅ Analysis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { analyzeROISystemsCodebase };
