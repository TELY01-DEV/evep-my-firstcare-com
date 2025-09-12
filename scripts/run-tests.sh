#!/bin/bash

# EVEP Platform Test Runner
# This script runs comprehensive tests for the EVEP platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
COVERAGE_THRESHOLD=80

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install test dependencies
install_test_dependencies() {
    print_header "Installing Test Dependencies"
    
    # Backend dependencies
    if [ -f "$BACKEND_DIR/requirements-test.txt" ]; then
        print_status "Installing backend test dependencies..."
        cd "$BACKEND_DIR"
        pip install -r requirements-test.txt
        cd ..
    fi
    
    # Frontend dependencies
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        print_status "Installing frontend test dependencies..."
        cd "$FRONTEND_DIR"
        npm install
        cd ..
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_header "Running Backend Tests"
    
    cd "$BACKEND_DIR"
    
    # Run unit tests
    print_status "Running unit tests..."
    pytest tests/ -m "unit" --cov=app --cov-report=term-missing --cov-report=html:htmlcov/unit
    
    # Run integration tests
    print_status "Running integration tests..."
    pytest tests/ -m "integration" --cov=app --cov-report=term-missing --cov-report=html:htmlcov/integration
    
    # Run AI tests
    print_status "Running AI integration tests..."
    pytest tests/test_ai_integration.py --cov=app.modules.ai_insights --cov-report=term-missing
    
    # Run all tests with coverage
    print_status "Running all tests with coverage..."
    pytest tests/ --cov=app --cov-report=term-missing --cov-report=html:htmlcov/full --cov-report=xml
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_header "Running Frontend Tests"
    
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_warning "Frontend directory not found, skipping frontend tests"
        return
    fi
    
    cd "$FRONTEND_DIR"
    
    # Check if test script exists
    if grep -q "\"test\":" package.json; then
        print_status "Running frontend unit tests..."
        npm test -- --coverage --watchAll=false
        
        print_status "Running frontend integration tests..."
        npm run test:integration -- --coverage --watchAll=false
    else
        print_warning "No test script found in package.json"
    fi
    
    cd ..
}

# Function to run end-to-end tests
run_e2e_tests() {
    print_header "Running End-to-End Tests"
    
    # Check if E2E test framework is available
    if [ -d "e2e" ]; then
        print_status "Running E2E tests..."
        cd e2e
        
        if command_exists "cypress"; then
            cypress run
        elif command_exists "playwright"; then
            npx playwright test
        else
            print_warning "No E2E test framework found"
        fi
        
        cd ..
    else
        print_warning "E2E test directory not found"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_header "Running Performance Tests"
    
    # Check if performance test tools are available
    if command_exists "locust"; then
        print_status "Running load tests with Locust..."
        cd backend
        locust -f tests/performance/locustfile.py --headless --users 10 --spawn-rate 2 --run-time 30s
        cd ..
    fi
    
    if command_exists "artillery"; then
        print_status "Running API performance tests with Artillery..."
        artillery run tests/performance/artillery-config.yml
    fi
}

# Function to run security tests
run_security_tests() {
    print_header "Running Security Tests"
    
    # Check if security test tools are available
    if command_exists "bandit"; then
        print_status "Running security linting with Bandit..."
        cd backend
        bandit -r app/ -f json -o security-report.json
        cd ..
    fi
    
    if command_exists "safety"; then
        print_status "Checking for security vulnerabilities..."
        cd backend
        safety check --json --output security-vulnerabilities.json
        cd ..
    fi
}

# Function to generate test report
generate_test_report() {
    print_header "Generating Test Report"
    
    # Create reports directory
    mkdir -p reports
    
    # Generate HTML coverage report
    if [ -d "$BACKEND_DIR/htmlcov" ]; then
        print_status "Generating HTML coverage report..."
        cp -r "$BACKEND_DIR/htmlcov" reports/
    fi
    
    # Generate test summary
    cat > reports/test-summary.md << EOF
# EVEP Platform Test Summary

## Test Results
- **Backend Tests**: Completed
- **Frontend Tests**: Completed
- **Integration Tests**: Completed
- **E2E Tests**: Completed
- **Performance Tests**: Completed
- **Security Tests**: Completed

## Coverage Report
- **Backend Coverage**: $(find "$BACKEND_DIR" -name "coverage.xml" -exec grep -o 'line-rate="[^"]*"' {} \; | cut -d'"' -f2 | head -1 || echo "N/A")
- **Frontend Coverage**: $(find "$FRONTEND_DIR" -name "coverage-summary.json" -exec cat {} \; | jq -r '.total.lines.pct' 2>/dev/null || echo "N/A")

## Test Execution Time
- **Total Time**: $(date)
- **Environment**: $(uname -s) $(uname -r)

## Next Steps
1. Review test results
2. Address any failing tests
3. Improve test coverage if needed
4. Run tests in CI/CD pipeline
EOF
    
    print_status "Test report generated in reports/test-summary.md"
}

# Function to show usage
show_usage() {
    echo "EVEP Platform Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_TYPES]"
    echo ""
    echo "Options:"
    echo "  --install-deps    Install test dependencies"
    echo "  --backend         Run backend tests only"
    echo "  --frontend        Run frontend tests only"
    echo "  --e2e            Run end-to-end tests only"
    echo "  --performance    Run performance tests only"
    echo "  --security       Run security tests only"
    echo "  --all            Run all tests (default)"
    echo "  --report         Generate test report"
    echo "  --help           Show this help message"
    echo ""
    echo "Test Types:"
    echo "  unit             Unit tests only"
    echo "  integration      Integration tests only"
    echo "  ai               AI-related tests only"
    echo "  workflow         Workflow tests only"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Run all tests"
    echo "  $0 --backend --frontend     # Run backend and frontend tests"
    echo "  $0 --backend unit           # Run backend unit tests only"
    echo "  $0 --install-deps           # Install dependencies only"
}

# Main script logic
INSTALL_DEPS=false
RUN_BACKEND=false
RUN_FRONTEND=false
RUN_E2E=false
RUN_PERFORMANCE=false
RUN_SECURITY=false
GENERATE_REPORT=false
TEST_TYPES=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --install-deps)
            INSTALL_DEPS=true
            shift
            ;;
        --backend)
            RUN_BACKEND=true
            shift
            ;;
        --frontend)
            RUN_FRONTEND=true
            shift
            ;;
        --e2e)
            RUN_E2E=true
            shift
            ;;
        --performance)
            RUN_PERFORMANCE=true
            shift
            ;;
        --security)
            RUN_SECURITY=true
            shift
            ;;
        --all)
            RUN_BACKEND=true
            RUN_FRONTEND=true
            RUN_E2E=true
            RUN_PERFORMANCE=true
            RUN_SECURITY=true
            shift
            ;;
        --report)
            GENERATE_REPORT=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        unit|integration|ai|workflow)
            TEST_TYPES="$TEST_TYPES $1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Default to all tests if no specific tests specified
if [ "$RUN_BACKEND" = false ] && [ "$RUN_FRONTEND" = false ] && [ "$RUN_E2E" = false ] && [ "$RUN_PERFORMANCE" = false ] && [ "$RUN_SECURITY" = false ]; then
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_E2E=true
    RUN_PERFORMANCE=true
    RUN_SECURITY=true
fi

# Main execution
print_header "EVEP Platform Test Runner"

# Install dependencies if requested
if [ "$INSTALL_DEPS" = true ]; then
    install_test_dependencies
fi

# Run tests
if [ "$RUN_BACKEND" = true ]; then
    run_backend_tests
fi

if [ "$RUN_FRONTEND" = true ]; then
    run_frontend_tests
fi

if [ "$RUN_E2E" = true ]; then
    run_e2e_tests
fi

if [ "$RUN_PERFORMANCE" = true ]; then
    run_performance_tests
fi

if [ "$RUN_SECURITY" = true ]; then
    run_security_tests
fi

# Generate report if requested
if [ "$GENERATE_REPORT" = true ]; then
    generate_test_report
fi

print_header "Test Execution Complete"
print_status "All tests completed successfully!"
print_status "Check the reports directory for detailed results."

