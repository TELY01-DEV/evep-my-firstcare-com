#!/usr/bin/env node
/**
 * EVEP Platform - E2E Test Runner
 * Comprehensive E2E test runner for all user workflows
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
  constructor() {
    this.testResults = {};
    this.startTime = null;
    this.endTime = null;
    
    // Test categories
    this.testCategories = {
      'authentication': {
        file: 'tests/e2e/authentication.spec.ts',
        description: 'Authentication Workflows',
        critical: true
      },
      'patient-management': {
        file: 'tests/e2e/patient-management.spec.ts',
        description: 'Patient Management Workflows',
        critical: true
      },
      'screening-workflows': {
        file: 'tests/e2e/screening-workflows.spec.ts',
        description: 'Screening Workflows',
        critical: true
      },
      'admin-panel': {
        file: 'tests/e2e/admin-panel.spec.ts',
        description: 'Admin Panel Workflows',
        critical: true
      }
    };
  }

  async runTests() {
    console.log('🚀 Starting EVEP Platform E2E Tests...\n');
    this.startTime = Date.now();

    // Create test results directory
    const resultsDir = 'test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Run tests for each category
    for (const [category, config] of Object.entries(this.testCategories)) {
      try {
        console.log(`📋 Running ${config.description}...`);
        
        const result = await this.runTestCategory(category, config);
        this.testResults[category] = result;
        
        console.log(`✅ ${config.description} - ${result.success ? 'PASSED' : 'FAILED'}\n`);
        
      } catch (error) {
        console.error(`❌ Error running ${config.description}:`, error.message);
        this.testResults[category] = {
          category,
          description: config.description,
          critical: config.critical,
          success: false,
          error: error.message
        };
      }
    }

    this.endTime = Date.now();
    this.generateReport();
  }

  async runTestCategory(category, config) {
    const startTime = Date.now();
    
    try {
      // Run Playwright tests for the category
      const command = `npx playwright test ${config.file} --reporter=json`;
      
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        category,
        description: config.description,
        critical: config.critical,
        success: true,
        duration,
        output: result
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        category,
        description: config.description,
        critical: config.critical,
        success: false,
        duration,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  generateReport() {
    const totalDuration = this.endTime - this.startTime;
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const criticalFailures = Object.values(this.testResults)
      .filter(r => r.critical && !r.success).length;

    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalDuration,
      totalTests,
      passedTests,
      failedTests,
      criticalFailures,
      successRate: totalTests > 0 ? (passedTests / totalTests * 100) : 0,
      overallSuccess: criticalFailures === 0 && failedTests === 0,
      testResults: this.testResults
    };

    // Save detailed report
    const reportPath = path.join('test-results', 'e2e_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

    // Generate markdown report
    this.generateMarkdownReport(summary);

    // Print summary
    this.printSummary(summary);
  }

  generateMarkdownReport(summary) {
    let reportContent = `# EVEP Platform - E2E Test Report

## Test Summary

- **Timestamp**: ${summary.timestamp}
- **Total Duration**: ${(summary.totalDuration / 1000).toFixed(2)} seconds
- **Total Test Categories**: ${summary.totalTests}
- **Passed Tests**: ${summary.passedTests}
- **Failed Tests**: ${summary.failedTests}
- **Critical Failures**: ${summary.criticalFailures}
- **Success Rate**: ${summary.successRate.toFixed(1)}%
- **Overall Status**: ${summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}

## Test Results

`;

    for (const [category, result] of Object.entries(this.testResults)) {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const critical = result.critical ? '🔴 CRITICAL' : '🟡 NON-CRITICAL';
      
      reportContent += `### ${result.description}

- **Status**: ${status}
- **Priority**: ${critical}
- **Duration**: ${(result.duration / 1000).toFixed(2)} seconds

`;

      if (!result.success && result.error) {
        reportContent += `**Error Details**:\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
      }
    }

    reportContent += `## Recommendations

`;

    if (summary.criticalFailures > 0) {
      reportContent += '- 🔴 **CRITICAL**: Fix critical test failures before deployment\n';
    }

    if (summary.failedTests > 0) {
      reportContent += '- 🟡 **IMPORTANT**: Review and fix failed tests\n';
    }

    if (summary.successRate < 90) {
      reportContent += '- 📊 **COVERAGE**: Improve test coverage\n';
    }

    reportContent += `
- 📈 **PERFORMANCE**: Total test duration: ${(summary.totalDuration / 1000).toFixed(2)}s
- 🧪 **QUALITY**: Success rate: ${summary.successRate.toFixed(1)}%

## Next Steps

1. Review failed tests and fix issues
2. Address critical failures immediately
3. Improve test coverage if needed
4. Run tests again to verify fixes
5. Proceed with deployment if all tests pass

---
*Generated by EVEP Platform E2E Test Runner*
`;

    const reportPath = path.join('test-results', 'e2e_test_report.md');
    fs.writeFileSync(reportPath, reportContent);
  }

  printSummary(summary) {
    console.log('\n' + '='.repeat(80));
    console.log('EVEP PLATFORM - E2E TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`Timestamp: ${summary.timestamp}`);
    console.log(`Total Duration: ${(summary.totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Test Categories: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} | Failed: ${summary.failedTests}`);
    console.log(`Critical Failures: ${summary.criticalFailures}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    
    const status = summary.overallSuccess ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED';
    console.log(`Overall Status: ${status}`);
    
    console.log('\nDetailed Results:');
    console.log('-'.repeat(80));
    
    for (const [category, result] of Object.entries(this.testResults)) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const critical = result.critical ? '🔴' : '🟡';
      console.log(`${critical} ${result.description.padEnd(40)} ${status.padEnd(8)} ${(result.duration / 1000).toFixed(2).padStart(6)}s`);
    }
    
    console.log('='.repeat(80));
    
    if (summary.criticalFailures > 0) {
      console.log(`\n🔴 CRITICAL: ${summary.criticalFailures} critical test failures detected!`);
      console.log('   Fix these issues before proceeding with deployment.');
    }
    
    if (summary.failedTests > 0) {
      console.log(`\n🟡 WARNING: ${summary.failedTests} test failures detected.`);
      console.log('   Review and fix these issues.');
    }
    
    if (summary.overallSuccess) {
      console.log('\n✅ SUCCESS: All E2E tests passed!');
      console.log('   Ready for deployment.');
    }
    
    console.log(`\n📊 Reports saved to: test-results/`);
    console.log(`📈 HTML report: test-results/html/index.html`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
EVEP Platform E2E Test Runner

Usage:
  node run_e2e_tests.js [options]

Options:
  --category <category>    Run specific test category
  --help, -h              Show this help message

Available Categories:
  - authentication
  - patient-management
  - screening-workflows
  - admin-panel

Examples:
  node run_e2e_tests.js                    # Run all tests
  node run_e2e_tests.js --category auth    # Run authentication tests only
`);
    return;
  }

  const runner = new E2ETestRunner();
  
  // Check if specific category is requested
  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && categoryIndex + 1 < args.length) {
    const category = args[categoryIndex + 1];
    
    if (runner.testCategories[category]) {
      console.log(`🎯 Running ${runner.testCategories[category].description} only...\n`);
      
      const config = runner.testCategories[category];
      const result = await runner.runTestCategory(category, config);
      runner.testResults[category] = result;
      
      runner.endTime = Date.now();
      runner.generateReport();
    } else {
      console.error(`❌ Unknown test category: ${category}`);
      console.log(`Available categories: ${Object.keys(runner.testCategories).join(', ')}`);
      process.exit(1);
    }
  } else {
    // Run all tests
    await runner.runTests();
  }
  
  // Exit with appropriate code
  const summary = runner.testResults;
  if (Object.keys(summary).length > 0) {
    const overallSuccess = Object.values(summary).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  } else {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner;

