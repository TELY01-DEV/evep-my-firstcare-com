#!/usr/bin/env python3
"""
EVEP Platform - API Integration Test Runner
Comprehensive test runner for all API integration tests
"""

import os
import sys
import subprocess
import time
import json
import argparse
from pathlib import Path
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_tests.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class APITestRunner:
    """API Integration Test Runner"""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.test_results = {}
        self.start_time = None
        self.end_time = None
        
        # Test configuration
        self.test_config = {
            'parallel': self.config.get('parallel', False),
            'verbose': self.config.get('verbose', True),
            'coverage': self.config.get('coverage', True),
            'html_report': self.config.get('html_report', True),
            'xml_report': self.config.get('xml_report', True),
            'timeout': self.config.get('timeout', 300),  # 5 minutes
            'retries': self.config.get('retries', 2),
            'stop_on_failure': self.config.get('stop_on_failure', False)
        }
        
        # Test categories
        self.test_categories = {
            'authentication': {
                'file': 'tests/test_api_integration.py::TestAuthenticationAPI',
                'description': 'Authentication API Tests',
                'critical': True
            },
            'patient_management': {
                'file': 'tests/test_api_integration.py::TestPatientManagementAPI',
                'description': 'Patient Management API Tests',
                'critical': True
            },
            'screening': {
                'file': 'tests/test_api_integration.py::TestScreeningAPI',
                'description': 'Screening API Tests',
                'critical': True
            },
            'evep_management': {
                'file': 'tests/test_api_integration.py::TestEVEPManagementAPI',
                'description': 'EVEP Management API Tests',
                'critical': True
            },
            'admin': {
                'file': 'tests/test_api_integration.py::TestAdminAPI',
                'description': 'Admin API Tests',
                'critical': True
            },
            'ai_insights': {
                'file': 'tests/test_api_integration.py::TestAIInsightsAPI',
                'description': 'AI Insights API Tests',
                'critical': False
            },
            'medical_security': {
                'file': 'tests/test_api_integration.py::TestMedicalSecurityAPI',
                'description': 'Medical Security API Tests',
                'critical': True
            },
            'performance': {
                'file': 'tests/test_api_integration.py::TestAPIPerformance',
                'description': 'API Performance Tests',
                'critical': False
            },
            'error_handling': {
                'file': 'tests/test_api_integration.py::TestAPIErrorHandling',
                'description': 'API Error Handling Tests',
                'critical': True
            },
            'data_validation': {
                'file': 'tests/test_api_integration.py::TestDataValidation',
                'description': 'Data Validation Tests',
                'critical': True
            },
            'security': {
                'file': 'tests/test_api_integration.py::TestAPISecurity',
                'description': 'API Security Tests',
                'critical': True
            }
        }
    
    def setup_environment(self):
        """Setup test environment"""
        logger.info("Setting up test environment...")
        
        # Set environment variables for testing
        os.environ['TESTING'] = 'true'
        os.environ['MONGODB_URL'] = os.getenv('TEST_MONGODB_URL', 'mongodb://localhost:27017/evep_test')
        os.environ['REDIS_URL'] = os.getenv('TEST_REDIS_URL', 'redis://localhost:6379/1')
        os.environ['JWT_SECRET'] = 'test_secret_key_for_testing_only'
        
        # Create test directories
        test_dirs = ['test_reports', 'test_coverage', 'test_logs']
        for dir_name in test_dirs:
            Path(dir_name).mkdir(exist_ok=True)
        
        logger.info("Test environment setup complete")
    
    def run_single_test_category(self, category_name, category_config):
        """Run tests for a single category"""
        logger.info(f"Running {category_config['description']}...")
        
        start_time = time.time()
        
        # Build pytest command
        cmd = [
            sys.executable, '-m', 'pytest',
            category_config['file'],
            '-v',
            '--tb=short',
            f'--timeout={self.test_config["timeout"]}',
            '--durations=10'
        ]
        
        # Add coverage if enabled
        if self.test_config['coverage']:
            cmd.extend([
                '--cov=app',
                '--cov-report=html:test_coverage/html',
                '--cov-report=xml:test_coverage/coverage.xml',
                '--cov-report=term-missing'
            ])
        
        # Add HTML report if enabled
        if self.test_config['html_report']:
            cmd.extend([
                '--html=test_reports/report.html',
                '--self-contained-html'
            ])
        
        # Add XML report if enabled
        if self.test_config['xml_report']:
            cmd.extend([
                '--junitxml=test_reports/junit.xml'
            ])
        
        # Run the test
        result = None
        for attempt in range(self.test_config['retries'] + 1):
            try:
                logger.info(f"Attempt {attempt + 1} for {category_name}")
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.test_config['timeout']
                )
                break
            except subprocess.TimeoutExpired:
                logger.warning(f"Test timeout for {category_name} (attempt {attempt + 1})")
                if attempt == self.test_config['retries']:
                    result = subprocess.CompletedProcess(
                        cmd, 1, "", "Test timeout exceeded"
                    )
            except Exception as e:
                logger.error(f"Test execution error for {category_name}: {e}")
                result = subprocess.CompletedProcess(cmd, 1, "", str(e))
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Parse results
        test_result = {
            'category': category_name,
            'description': category_config['description'],
            'critical': category_config['critical'],
            'success': result.returncode == 0,
            'duration': duration,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'return_code': result.returncode
        }
        
        # Log result
        status = "✅ PASSED" if test_result['success'] else "❌ FAILED"
        logger.info(f"{status} {category_config['description']} ({duration:.2f}s)")
        
        if not test_result['success'] and self.test_config['verbose']:
            logger.error(f"Test output: {result.stdout}")
            logger.error(f"Test errors: {result.stderr}")
        
        return test_result
    
    def run_all_tests(self):
        """Run all API integration tests"""
        logger.info("Starting API Integration Tests...")
        self.start_time = time.time()
        
        # Setup environment
        self.setup_environment()
        
        # Run tests by category
        for category_name, category_config in self.test_categories.items():
            try:
                result = self.run_single_test_category(category_name, category_config)
                self.test_results[category_name] = result
                
                # Stop on failure if configured
                if not result['success'] and self.test_config['stop_on_failure']:
                    logger.error(f"Stopping tests due to failure in {category_name}")
                    break
                    
            except Exception as e:
                logger.error(f"Error running tests for {category_name}: {e}")
                self.test_results[category_name] = {
                    'category': category_name,
                    'description': category_config['description'],
                    'critical': category_config['critical'],
                    'success': False,
                    'duration': 0,
                    'stdout': '',
                    'stderr': str(e),
                    'return_code': 1
                }
        
        self.end_time = time.time()
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        logger.info("Generating test report...")
        
        total_duration = self.end_time - self.start_time
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results.values() if r['success'])
        failed_tests = total_tests - passed_tests
        critical_failures = sum(1 for r in self.test_results.values() 
                              if r['critical'] and not r['success'])
        
        # Generate summary
        summary = {
            'timestamp': datetime.now().isoformat(),
            'total_duration': total_duration,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'critical_failures': critical_failures,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            'overall_success': critical_failures == 0 and failed_tests == 0,
            'test_results': self.test_results
        }
        
        # Save detailed report
        with open('test_reports/api_integration_report.json', 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        # Generate markdown report
        self.generate_markdown_report(summary)
        
        # Print summary
        self.print_summary(summary)
        
        return summary
    
    def generate_markdown_report(self, summary):
        """Generate markdown test report"""
        report_content = f"""# EVEP Platform - API Integration Test Report

## Test Summary

- **Timestamp**: {summary['timestamp']}
- **Total Duration**: {summary['total_duration']:.2f} seconds
- **Total Test Categories**: {summary['total_tests']}
- **Passed Tests**: {summary['passed_tests']}
- **Failed Tests**: {summary['failed_tests']}
- **Critical Failures**: {summary['critical_failures']}
- **Success Rate**: {summary['success_rate']:.1f}%
- **Overall Status**: {'✅ PASSED' if summary['overall_success'] else '❌ FAILED'}

## Test Results

"""
        
        for category_name, result in self.test_results.items():
            status = "✅ PASSED" if result['success'] else "❌ FAILED"
            critical = "🔴 CRITICAL" if result['critical'] else "🟡 NON-CRITICAL"
            
            report_content += f"""### {result['description']}

- **Status**: {status}
- **Priority**: {critical}
- **Duration**: {result['duration']:.2f} seconds
- **Return Code**: {result['return_code']}

"""
            
            if not result['success'] and result['stderr']:
                report_content += f"**Error Details**:\n```\n{result['stderr']}\n```\n\n"
        
        # Add recommendations
        report_content += """## Recommendations

"""
        
        if summary['critical_failures'] > 0:
            report_content += "- 🔴 **CRITICAL**: Fix critical test failures before deployment\n"
        
        if summary['failed_tests'] > 0:
            report_content += "- 🟡 **IMPORTANT**: Review and fix failed tests\n"
        
        if summary['success_rate'] < 90:
            report_content += "- 📊 **COVERAGE**: Improve test coverage\n"
        
        report_content += f"""
- 📈 **PERFORMANCE**: Total test duration: {summary['total_duration']:.2f}s
- 🧪 **QUALITY**: Success rate: {summary['success_rate']:.1f}%

## Next Steps

1. Review failed tests and fix issues
2. Address critical failures immediately
3. Improve test coverage if needed
4. Run tests again to verify fixes
5. Proceed with deployment if all tests pass

---
*Generated by EVEP Platform Test Runner*
"""
        
        with open('test_reports/api_integration_report.md', 'w') as f:
            f.write(report_content)
    
    def print_summary(self, summary):
        """Print test summary to console"""
        print("\n" + "="*80)
        print("EVEP PLATFORM - API INTEGRATION TEST SUMMARY")
        print("="*80)
        
        print(f"Timestamp: {summary['timestamp']}")
        print(f"Total Duration: {summary['total_duration']:.2f} seconds")
        print(f"Test Categories: {summary['total_tests']}")
        print(f"Passed: {summary['passed_tests']} | Failed: {summary['failed_tests']}")
        print(f"Critical Failures: {summary['critical_failures']}")
        print(f"Success Rate: {summary['success_rate']:.1f}%")
        
        status = "✅ ALL TESTS PASSED" if summary['overall_success'] else "❌ TESTS FAILED"
        print(f"Overall Status: {status}")
        
        print("\nDetailed Results:")
        print("-" * 80)
        
        for category_name, result in self.test_results.items():
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            critical = "🔴" if result['critical'] else "🟡"
            print(f"{critical} {result['description']:<40} {status:<8} {result['duration']:>6.2f}s")
        
        print("="*80)
        
        if summary['critical_failures'] > 0:
            print(f"\n🔴 CRITICAL: {summary['critical_failures']} critical test failures detected!")
            print("   Fix these issues before proceeding with deployment.")
        
        if summary['failed_tests'] > 0:
            print(f"\n🟡 WARNING: {summary['failed_tests']} test failures detected.")
            print("   Review and fix these issues.")
        
        if summary['overall_success']:
            print(f"\n✅ SUCCESS: All API integration tests passed!")
            print("   Ready for deployment.")
        
        print(f"\n📊 Reports saved to: test_reports/")
        print(f"📈 Coverage report: test_coverage/html/index.html")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='EVEP Platform API Integration Test Runner')
    parser.add_argument('--parallel', action='store_true', help='Run tests in parallel')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage reporting')
    parser.add_argument('--no-html', action='store_true', help='Disable HTML reports')
    parser.add_argument('--no-xml', action='store_true', help='Disable XML reports')
    parser.add_argument('--timeout', type=int, default=300, help='Test timeout in seconds')
    parser.add_argument('--retries', type=int, default=2, help='Number of retries for failed tests')
    parser.add_argument('--stop-on-failure', action='store_true', help='Stop on first failure')
    parser.add_argument('--category', help='Run specific test category')
    
    args = parser.parse_args()
    
    # Configuration
    config = {
        'parallel': args.parallel,
        'verbose': args.verbose,
        'coverage': not args.no_coverage,
        'html_report': not args.no_html,
        'xml_report': not args.no_xml,
        'timeout': args.timeout,
        'retries': args.retries,
        'stop_on_failure': args.stop_on_failure
    }
    
    # Create test runner
    runner = APITestRunner(config)
    
    # Run specific category if specified
    if args.category:
        if args.category in runner.test_categories:
            category_config = runner.test_categories[args.category]
            result = runner.run_single_test_category(args.category, category_config)
            runner.test_results[args.category] = result
            runner.generate_report()
        else:
            logger.error(f"Unknown test category: {args.category}")
            logger.info(f"Available categories: {', '.join(runner.test_categories.keys())}")
            sys.exit(1)
    else:
        # Run all tests
        runner.run_all_tests()
    
    # Exit with appropriate code
    summary = runner.test_results
    if summary:
        overall_success = all(r['success'] for r in summary.values())
        sys.exit(0 if overall_success else 1)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

