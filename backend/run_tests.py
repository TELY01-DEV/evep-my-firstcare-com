#!/usr/bin/env python3
"""
Comprehensive Test Runner for EVEP Backend
Provides different test modes and reporting options.
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(command)}")
    print(f"{'='*60}")
    
    start_time = time.time()
    result = subprocess.run(command, capture_output=True, text=True)
    end_time = time.time()
    
    print(f"\nExit Code: {result.returncode}")
    print(f"Duration: {end_time - start_time:.2f} seconds")
    
    if result.stdout:
        print("\nSTDOUT:")
        print(result.stdout)
    
    if result.stderr:
        print("\nSTDERR:")
        print(result.stderr)
    
    return result.returncode == 0

def run_unit_tests():
    """Run unit tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "unit",
        "--cov=app",
        "--cov-report=html:htmlcov/unit",
        "--cov-report=term-missing",
        "--cov-fail-under=95",
        "-v"
    ]
    return run_command(command, "Unit Tests")

def run_integration_tests():
    """Run integration tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "integration",
        "--cov=app",
        "--cov-report=html:htmlcov/integration",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Integration Tests")

def run_auth_tests():
    """Run authentication tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "auth",
        "--cov=app.core.security",
        "--cov=app.api.auth",
        "--cov-report=html:htmlcov/auth",
        "--cov-report=term-missing",
        "--cov-fail-under=95",
        "-v"
    ]
    return run_command(command, "Authentication Tests")

def run_patient_tests():
    """Run patient management tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "patient",
        "--cov=app.api.patients",
        "--cov=app.models.evep_models",
        "--cov-report=html:htmlcov/patient",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Patient Management Tests")

def run_screening_tests():
    """Run screening tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "screening",
        "--cov=app.api.screenings",
        "--cov-report=html:htmlcov/screening",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Screening Tests")

def run_ai_tests():
    """Run AI integration tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "ai",
        "--cov=app.modules.ai_insights",
        "--cov-report=html:htmlcov/ai",
        "--cov-report=term-missing",
        "--cov-fail-under=85",
        "-v"
    ]
    return run_command(command, "AI Integration Tests")

def run_admin_tests():
    """Run admin functionality tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "admin",
        "--cov=app.api.admin",
        "--cov-report=html:htmlcov/admin",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Admin Functionality Tests")

def run_security_tests():
    """Run security tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "security",
        "--cov=app.core.security",
        "--cov-report=html:htmlcov/security",
        "--cov-report=term-missing",
        "--cov-fail-under=95",
        "-v"
    ]
    return run_command(command, "Security Tests")

def run_performance_tests():
    """Run performance tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "performance",
        "-v",
        "--durations=10"
    ]
    return run_command(command, "Performance Tests")

def run_error_handling_tests():
    """Run error handling tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "error_handling",
        "--cov=app.core.error_handlers",
        "--cov-report=html:htmlcov/error_handling",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Error Handling Tests")

def run_data_integrity_tests():
    """Run data integrity tests only."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "data_integrity",
        "--cov=app.core.database",
        "--cov-report=html:htmlcov/data_integrity",
        "--cov-report=term-missing",
        "--cov-fail-under=90",
        "-v"
    ]
    return run_command(command, "Data Integrity Tests")

def run_all_tests():
    """Run all tests with comprehensive coverage."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "--cov=app",
        "--cov-report=html:htmlcov/all",
        "--cov-report=term-missing",
        "--cov-report=xml:coverage.xml",
        "--cov-fail-under=90",
        "--durations=20",
        "--maxfail=10",
        "-v"
    ]
    return run_command(command, "All Tests")

def run_quick_tests():
    """Run quick tests (excluding slow tests)."""
    command = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-m", "not slow",
        "--cov=app",
        "--cov-report=html:htmlcov/quick",
        "--cov-report=term-missing",
        "--cov-fail-under=85",
        "-v"
    ]
    return run_command(command, "Quick Tests (Excluding Slow Tests)")

def run_linting():
    """Run code linting."""
    command = [
        sys.executable, "-m", "flake8",
        "app/",
        "--max-line-length=100",
        "--ignore=E203,W503",
        "--count",
        "--statistics"
    ]
    return run_command(command, "Code Linting (flake8)")

def run_type_checking():
    """Run type checking."""
    command = [
        sys.executable, "-m", "mypy",
        "app/",
        "--ignore-missing-imports",
        "--disallow-untyped-defs",
        "--disallow-incomplete-defs",
        "--check-untyped-defs",
        "--disallow-untyped-decorators",
        "--no-implicit-optional",
        "--warn-redundant-casts",
        "--warn-unused-ignores",
        "--warn-return-any",
        "--warn-unreachable",
        "--strict-equality"
    ]
    return run_command(command, "Type Checking (mypy)")

def run_security_scan():
    """Run security scanning."""
    command = [
        sys.executable, "-m", "bandit",
        "-r", "app/",
        "-f", "json",
        "-o", "security_scan.json"
    ]
    return run_command(command, "Security Scanning (bandit)")

def generate_test_report():
    """Generate comprehensive test report."""
    print("\n" + "="*80)
    print("GENERATING COMPREHENSIVE TEST REPORT")
    print("="*80)
    
    # Check if coverage reports exist
    coverage_dirs = [
        "htmlcov/unit",
        "htmlcov/integration", 
        "htmlcov/auth",
        "htmlcov/patient",
        "htmlcov/screening",
        "htmlcov/ai",
        "htmlcov/admin",
        "htmlcov/security",
        "htmlcov/error_handling",
        "htmlcov/data_integrity",
        "htmlcov/all",
        "htmlcov/quick"
    ]
    
    print("\nCoverage Reports Generated:")
    for dir_path in coverage_dirs:
        if os.path.exists(dir_path):
            print(f"✅ {dir_path}")
        else:
            print(f"❌ {dir_path} (not found)")
    
    # Check for other reports
    other_reports = [
        "coverage.xml",
        "security_scan.json"
    ]
    
    print("\nOther Reports Generated:")
    for report in other_reports:
        if os.path.exists(report):
            print(f"✅ {report}")
        else:
            print(f"❌ {report} (not found)")
    
    print("\n" + "="*80)
    print("TEST REPORT GENERATION COMPLETE")
    print("="*80)

def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(description="EVEP Backend Test Runner")
    parser.add_argument(
        "--mode",
        choices=[
            "unit", "integration", "auth", "patient", "screening", "ai", "admin",
            "security", "performance", "error_handling", "data_integrity",
            "all", "quick", "lint", "types", "security-scan", "report"
        ],
        default="all",
        help="Test mode to run"
    )
    parser.add_argument(
        "--generate-report",
        action="store_true",
        help="Generate comprehensive test report"
    )
    
    args = parser.parse_args()
    
    # Create coverage directory
    os.makedirs("htmlcov", exist_ok=True)
    
    success = True
    
    if args.mode == "unit":
        success = run_unit_tests()
    elif args.mode == "integration":
        success = run_integration_tests()
    elif args.mode == "auth":
        success = run_auth_tests()
    elif args.mode == "patient":
        success = run_patient_tests()
    elif args.mode == "screening":
        success = run_screening_tests()
    elif args.mode == "ai":
        success = run_ai_tests()
    elif args.mode == "admin":
        success = run_admin_tests()
    elif args.mode == "security":
        success = run_security_tests()
    elif args.mode == "performance":
        success = run_performance_tests()
    elif args.mode == "error_handling":
        success = run_error_handling_tests()
    elif args.mode == "data_integrity":
        success = run_data_integrity_tests()
    elif args.mode == "all":
        success = run_all_tests()
    elif args.mode == "quick":
        success = run_quick_tests()
    elif args.mode == "lint":
        success = run_linting()
    elif args.mode == "types":
        success = run_type_checking()
    elif args.mode == "security-scan":
        success = run_security_scan()
    elif args.mode == "report":
        generate_test_report()
        return
    
    if args.generate_report or args.mode == "all":
        generate_test_report()
    
    if success:
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED SUCCESSFULLY!")
        print("="*60)
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ SOME TESTS FAILED!")
        print("="*60)
        sys.exit(1)

if __name__ == "__main__":
    main()
