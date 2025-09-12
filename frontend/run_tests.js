#!/usr/bin/env node
/**
 * Comprehensive Test Runner for EVEP Frontend
 * Provides different test modes and reporting options.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  coverage: {
    unit: 90,
    integration: 85,
    e2e: 80,
    overall: 85
  },
  timeouts: {
    unit: 30000,
    integration: 60000,
    e2e: 120000
  }
};

// Test categories
const TEST_CATEGORIES = {
  unit: {
    pattern: '**/*.test.{ts,tsx}',
    coverage: TEST_CONFIG.coverage.unit,
    timeout: TEST_CONFIG.timeouts.unit
  },
  integration: {
    pattern: '**/*.integration.test.{ts,tsx}',
    coverage: TEST_CONFIG.coverage.integration,
    timeout: TEST_CONFIG.timeouts.integration
  },
  e2e: {
    pattern: '**/*.e2e.test.{ts,tsx}',
    coverage: TEST_CONFIG.coverage.e2e,
    timeout: TEST_CONFIG.timeouts.e2e
  }
};

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function createCoverageReport() {
  const coverageDir = path.join(__dirname, 'coverage');
  const reportsDir = path.join(__dirname, 'test-reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: 0
    },
    categories: {},
    details: []
  };

  // Read coverage data if exists
  if (fs.existsSync(path.join(coverageDir, 'coverage-summary.json'))) {
    const coverageData = JSON.parse(
      fs.readFileSync(path.join(coverageDir, 'coverage-summary.json'), 'utf8')
    );
    report.summary.coverage = coverageData.total.lines.pct;
  }

  // Write report
  fs.writeFileSync(
    path.join(reportsDir, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('✅ Test report generated successfully');
  return report;
}

async function runUnitTests() {
  console.log('\n🧪 Running Unit Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--coverage', '--watchAll=false', '--passWithNoTests'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Unit tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Unit tests failed:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('\n🔗 Running Integration Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=integration', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Integration tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    return false;
  }
}

async function runE2ETests() {
  console.log('\n🌐 Running E2E Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=e2e', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ E2E tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ E2E tests failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Running All Tests...');
  
  const results = {
    unit: await runUnitTests(),
    integration: await runIntegrationTests(),
    e2e: await runE2ETests()
  };

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }

  return allPassed;
}

async function runLinting() {
  console.log('\n🔍 Running Code Linting...');
  
  try {
    await runCommand('npm', ['run', 'lint']);
    console.log('✅ Linting completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Linting failed:', error.message);
    return false;
  }
}

async function runTypeChecking() {
  console.log('\n📝 Running Type Checking...');
  
  try {
    await runCommand('npm', ['run', 'type-check']);
    console.log('✅ Type checking completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Type checking failed:', error.message);
    return false;
  }
}

async function runAccessibilityTests() {
  console.log('\n♿ Running Accessibility Tests...');
  
  try {
    // Run accessibility tests using jest-axe or similar
    await runCommand('npm', ['test', '--', '--testPathPattern=accessibility', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Accessibility tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Accessibility tests failed:', error.message);
    return false;
  }
}

async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  try {
    // Run performance tests
    await runCommand('npm', ['test', '--', '--testPathPattern=performance', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Performance tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Performance tests failed:', error.message);
    return false;
  }
}

async function runSecurityTests() {
  console.log('\n🔒 Running Security Tests...');
  
  try {
    // Run security tests
    await runCommand('npm', ['test', '--', '--testPathPattern=security', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Security tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Security tests failed:', error.message);
    return false;
  }
}

async function runComponentTests() {
  console.log('\n🧩 Running Component Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=components', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Component tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Component tests failed:', error.message);
    return false;
  }
}

async function runHookTests() {
  console.log('\n🎣 Running Hook Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=hooks', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Hook tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Hook tests failed:', error.message);
    return false;
  }
}

async function runUtilityTests() {
  console.log('\n🛠️ Running Utility Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=utils', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Utility tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Utility tests failed:', error.message);
    return false;
  }
}

async function runPageTests() {
  console.log('\n📄 Running Page Tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=pages', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Page tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Page tests failed:', error.message);
    return false;
  }
}

async function runQuickTests() {
  console.log('\n⚡ Running Quick Tests (excluding slow tests)...');
  
  try {
    await runCommand('npm', ['test', '--', '--testPathIgnorePatterns=slow', '--coverage', '--watchAll=false'], {
      env: { ...process.env, CI: 'true' }
    });
    console.log('✅ Quick tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Quick tests failed:', error.message);
    return false;
  }
}

async function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  
  try {
    const report = createCoverageReport();
    console.log('✅ Test report generated successfully');
    return report;
  } catch (error) {
    console.error('❌ Failed to generate test report:', error.message);
    return null;
  }
}

async function runQualityChecks() {
  console.log('\n🔍 Running Quality Checks...');
  
  const results = {
    linting: await runLinting(),
    typeChecking: await runTypeChecking(),
    accessibility: await runAccessibilityTests(),
    performance: await runPerformanceTests(),
    security: await runSecurityTests()
  };

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All quality checks passed!');
  } else {
    console.log('\n❌ Some quality checks failed');
  }

  return allPassed;
}

async function runComprehensiveTests() {
  console.log('\n🎯 Running Comprehensive Test Suite...');
  
  const results = {
    unit: await runUnitTests(),
    component: await runComponentTests(),
    hook: await runHookTests(),
    utility: await runUtilityTests(),
    page: await runPageTests(),
    integration: await runIntegrationTests(),
    e2e: await runE2ETests(),
    quality: await runQualityChecks()
  };

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Comprehensive test suite completed successfully!');
    await generateTestReport();
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }

  return allPassed;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  const generateReport = args.includes('--generate-report');

  console.log('🧪 EVEP Frontend Test Runner');
  console.log('============================');

  let success = false;

  switch (mode) {
    case 'unit':
      success = await runUnitTests();
      break;
    case 'component':
      success = await runComponentTests();
      break;
    case 'hook':
      success = await runHookTests();
      break;
    case 'utility':
      success = await runUtilityTests();
      break;
    case 'page':
      success = await runPageTests();
      break;
    case 'integration':
      success = await runIntegrationTests();
      break;
    case 'e2e':
      success = await runE2ETests();
      break;
    case 'accessibility':
      success = await runAccessibilityTests();
      break;
    case 'performance':
      success = await runPerformanceTests();
      break;
    case 'security':
      success = await runSecurityTests();
      break;
    case 'quality':
      success = await runQualityChecks();
      break;
    case 'quick':
      success = await runQuickTests();
      break;
    case 'all':
      success = await runComprehensiveTests();
      break;
    case 'report':
      await generateTestReport();
      return;
    default:
      console.error(`❌ Unknown test mode: ${mode}`);
      console.log('Available modes: unit, component, hook, utility, page, integration, e2e, accessibility, performance, security, quality, quick, all, report');
      process.exit(1);
  }

  if (generateReport && success) {
    await generateTestReport();
  }

  if (!success) {
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  runAllTests,
  runLinting,
  runTypeChecking,
  runAccessibilityTests,
  runPerformanceTests,
  runSecurityTests,
  runComponentTests,
  runHookTests,
  runUtilityTests,
  runPageTests,
  runQuickTests,
  runQualityChecks,
  runComprehensiveTests,
  generateTestReport
};
