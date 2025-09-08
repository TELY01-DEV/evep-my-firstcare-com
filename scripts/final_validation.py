#!/usr/bin/env python3
"""
EVEP Medical Portal - Final Production Validation
Comprehensive validation of all system components for production readiness
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class FinalValidator:
    def __init__(self):
        self.session = None
        self.token = None
        self.user_id = None
        self.validation_results = {}
        self.start_time = time.time()
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def validate_authentication(self):
        """Validate authentication system"""
        print("🔐 Validating Authentication System...")
        
        # Test login
        login_data = {
            "email": "admin@evep.com",
            "password": "admin123"
        }
        
        try:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json=login_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("access_token")
                    
                    # Extract user info from JWT
                    import base64
                    parts = self.token.split('.')
                    payload = parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.b64decode(payload)
                    payload_data = json.loads(decoded)
                    self.user_id = payload_data.get("user_id")
                    self.user_role = payload_data.get("role")
                    
                    self.validation_results["authentication"] = {
                        "status": "PASS",
                        "login": "SUCCESS",
                        "token_valid": True,
                        "user_id": self.user_id,
                        "role": self.user_role
                    }
                    print(f"   ✅ Login successful - User: {self.user_id}, Role: {self.user_role}")
                    return True
                else:
                    self.validation_results["authentication"] = {
                        "status": "FAIL",
                        "login": f"FAILED ({response.status})",
                        "token_valid": False
                    }
                    print(f"   ❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            self.validation_results["authentication"] = {
                "status": "FAIL",
                "login": f"ERROR: {str(e)}",
                "token_valid": False
            }
            print(f"   ❌ Authentication error: {e}")
            return False
    
    async def validate_core_apis(self):
        """Validate all core API endpoints"""
        print("\n🔧 Validating Core API Endpoints...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        core_endpoints = [
            ("Dashboard Stats", f"{API_BASE_URL}/api/v1/dashboard/stats"),
            ("Students", f"{API_BASE_URL}/api/v1/evep/students"),
            ("Teachers", f"{API_BASE_URL}/api/v1/evep/teachers"),
            ("Schools", f"{API_BASE_URL}/api/v1/evep/schools"),
            ("User Management", f"{API_BASE_URL}/api/v1/user-management/"),
            ("Patients", f"{API_BASE_URL}/api/v1/patients/"),
            ("Screenings", f"{API_BASE_URL}/api/v1/screenings/sessions"),
            ("Glasses Inventory", f"{API_BASE_URL}/api/v1/inventory/glasses"),
        ]
        
        passed = 0
        results = {}
        
        for name, url in core_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(url, headers=headers) as response:
                    end_time = time.time()
                    response_time = end_time - start_time
                    
                    if response.status == 200:
                        try:
                            data = await response.json()
                            results[name] = {
                                "status": "PASS",
                                "response_time": f"{response_time:.3f}s",
                                "data_size": len(json.dumps(data))
                            }
                            passed += 1
                            print(f"   ✅ {name}: {response_time:.3f}s")
                        except:
                            results[name] = {
                                "status": "PASS",
                                "response_time": f"{response_time:.3f}s",
                                "data_size": "unknown"
                            }
                            passed += 1
                            print(f"   ✅ {name}: {response_time:.3f}s")
                    else:
                        results[name] = {
                            "status": "FAIL",
                            "response_time": f"{response_time:.3f}s",
                            "error": f"Status {response.status}"
                        }
                        print(f"   ❌ {name}: {response_time:.3f}s (Status {response.status})")
            except Exception as e:
                results[name] = {
                    "status": "FAIL",
                    "response_time": "0.000s",
                    "error": str(e)
                }
                print(f"   ❌ {name}: Error - {e}")
        
        self.validation_results["core_apis"] = {
            "status": "PASS" if passed == len(core_endpoints) else "FAIL",
            "passed": passed,
            "total": len(core_endpoints),
            "success_rate": f"{(passed/len(core_endpoints)*100):.1f}%",
            "endpoints": results
        }
        
        return passed == len(core_endpoints)
    
    async def validate_rbac_system(self):
        """Validate RBAC system"""
        print("\n🔐 Validating RBAC System...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        rbac_endpoints = [
            ("File-based Roles", f"{API_BASE_URL}/api/v1/rbac/roles/"),
            ("File-based Permissions", f"{API_BASE_URL}/api/v1/rbac/permissions/"),
            ("MongoDB Roles", f"{API_BASE_URL}/api/v1/rbac-mongodb/roles/"),
            ("MongoDB Permissions", f"{API_BASE_URL}/api/v1/rbac-mongodb/permissions/"),
        ]
        
        passed = 0
        results = {}
        
        for name, url in rbac_endpoints:
            try:
                async with self.session.get(url, headers=headers) as response:
                    if response.status == 200:
                        results[name] = {"status": "PASS"}
                        passed += 1
                        print(f"   ✅ {name}: Working")
                    else:
                        results[name] = {"status": "FAIL", "error": f"Status {response.status}"}
                        print(f"   ❌ {name}: Status {response.status}")
            except Exception as e:
                results[name] = {"status": "FAIL", "error": str(e)}
                print(f"   ❌ {name}: Error - {e}")
        
        self.validation_results["rbac_system"] = {
            "status": "PASS" if passed == len(rbac_endpoints) else "FAIL",
            "passed": passed,
            "total": len(rbac_endpoints),
            "success_rate": f"{(passed/len(rbac_endpoints)*100):.1f}%",
            "endpoints": results
        }
        
        return passed == len(rbac_endpoints)
    
    async def validate_export_system(self):
        """Validate CSV export system"""
        print("\n📄 Validating Export System...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        export_endpoints = [
            ("Dashboard CSV Export", f"{API_BASE_URL}/api/v1/csv-export/dashboard-summary"),
            ("Students CSV Export", f"{API_BASE_URL}/api/v1/csv-export/students"),
            ("Teachers CSV Export", f"{API_BASE_URL}/api/v1/csv-export/teachers"),
            ("Schools CSV Export", f"{API_BASE_URL}/api/v1/csv-export/schools"),
        ]
        
        passed = 0
        results = {}
        
        for name, url in export_endpoints:
            try:
                async with self.session.get(url, headers=headers) as response:
                    if response.status == 200:
                        results[name] = {"status": "PASS"}
                        passed += 1
                        print(f"   ✅ {name}: Working")
                    else:
                        results[name] = {"status": "FAIL", "error": f"Status {response.status}"}
                        print(f"   ❌ {name}: Status {response.status}")
            except Exception as e:
                results[name] = {"status": "FAIL", "error": str(e)}
                print(f"   ❌ {name}: Error - {e}")
        
        self.validation_results["export_system"] = {
            "status": "PASS" if passed == len(export_endpoints) else "FAIL",
            "passed": passed,
            "total": len(export_endpoints),
            "success_rate": f"{(passed/len(export_endpoints)*100):.1f}%",
            "endpoints": results
        }
        
        return passed == len(export_endpoints)
    
    async def validate_ai_system(self):
        """Validate AI and chat bot system"""
        print("\n🤖 Validating AI System...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        ai_endpoints = [
            ("AI Chat Health", f"{API_BASE_URL}/api/v1/chat-bot/health"),
            ("AI Agent Configs", f"{API_BASE_URL}/api/v1/chat-bot/agent-configs"),
        ]
        
        passed = 0
        results = {}
        
        for name, url in ai_endpoints:
            try:
                async with self.session.get(url, headers=headers) as response:
                    if response.status == 200:
                        results[name] = {"status": "PASS"}
                        passed += 1
                        print(f"   ✅ {name}: Working")
                    else:
                        results[name] = {"status": "FAIL", "error": f"Status {response.status}"}
                        print(f"   ❌ {name}: Status {response.status}")
            except Exception as e:
                results[name] = {"status": "FAIL", "error": str(e)}
                print(f"   ❌ {name}: Error - {e}")
        
        self.validation_results["ai_system"] = {
            "status": "PASS" if passed == len(ai_endpoints) else "FAIL",
            "passed": passed,
            "total": len(ai_endpoints),
            "success_rate": f"{(passed/len(ai_endpoints)*100):.1f}%",
            "endpoints": results
        }
        
        return passed == len(ai_endpoints)
    
    async def validate_performance(self):
        """Validate system performance"""
        print("\n⚡ Validating System Performance...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test multiple endpoints for performance
        test_endpoints = [
            f"{API_BASE_URL}/api/v1/dashboard/stats",
            f"{API_BASE_URL}/api/v1/evep/students",
            f"{API_BASE_URL}/api/v1/evep/teachers",
            f"{API_BASE_URL}/api/v1/evep/schools",
        ]
        
        response_times = []
        
        for url in test_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(url, headers=headers) as response:
                    end_time = time.time()
                    response_time = end_time - start_time
                    response_times.append(response_time)
            except:
                pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            performance_status = "PASS" if avg_response_time < 0.1 else "WARN" if avg_response_time < 0.5 else "FAIL"
            
            self.validation_results["performance"] = {
                "status": performance_status,
                "average_response_time": f"{avg_response_time:.3f}s",
                "max_response_time": f"{max_response_time:.3f}s",
                "min_response_time": f"{min_response_time:.3f}s",
                "samples": len(response_times)
            }
            
            print(f"   📊 Average Response Time: {avg_response_time:.3f}s")
            print(f"   🐌 Slowest Response: {max_response_time:.3f}s")
            print(f"   ⚡ Fastest Response: {min_response_time:.3f}s")
            
            return performance_status in ["PASS", "WARN"]
        else:
            self.validation_results["performance"] = {
                "status": "FAIL",
                "error": "No response times recorded"
            }
            print("   ❌ Performance validation failed")
            return False
    
    async def validate_security(self):
        """Validate security measures"""
        print("\n🔒 Validating Security Measures...")
        
        security_checks = {
            "https_enabled": False,
            "jwt_authentication": False,
            "rbac_enabled": False,
            "input_validation": False
        }
        
        # Check HTTPS
        if API_BASE_URL.startswith("https://"):
            security_checks["https_enabled"] = True
            print("   ✅ HTTPS enabled")
        else:
            print("   ❌ HTTPS not enabled")
        
        # Check JWT authentication
        if self.token:
            security_checks["jwt_authentication"] = True
            print("   ✅ JWT authentication working")
        else:
            print("   ❌ JWT authentication failed")
        
        # Check RBAC
        if self.validation_results.get("rbac_system", {}).get("status") == "PASS":
            security_checks["rbac_enabled"] = True
            print("   ✅ RBAC system working")
        else:
            print("   ❌ RBAC system failed")
        
        # Check input validation (test with invalid data)
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/students",
                headers=headers,
                json={"invalid": "data"}
            ) as response:
                if response.status == 422:  # Validation error
                    security_checks["input_validation"] = True
                    print("   ✅ Input validation working")
                else:
                    print("   ⚠️ Input validation status unclear")
        except:
            print("   ⚠️ Could not test input validation")
        
        passed_checks = sum(security_checks.values())
        total_checks = len(security_checks)
        
        self.validation_results["security"] = {
            "status": "PASS" if passed_checks == total_checks else "WARN" if passed_checks >= total_checks * 0.75 else "FAIL",
            "passed": passed_checks,
            "total": total_checks,
            "success_rate": f"{(passed_checks/total_checks*100):.1f}%",
            "checks": security_checks
        }
        
        return passed_checks >= total_checks * 0.75
    
    async def run_final_validation(self):
        """Run complete final validation"""
        print("🚀 EVEP Medical Portal - Final Production Validation")
        print("=" * 70)
        
        # Run all validations
        auth_valid = await self.validate_authentication()
        if not auth_valid:
            print("\n❌ Authentication validation failed. Cannot proceed with other validations.")
            return False
        
        core_valid = await self.validate_core_apis()
        rbac_valid = await self.validate_rbac_system()
        export_valid = await self.validate_export_system()
        ai_valid = await self.validate_ai_system()
        performance_valid = await self.validate_performance()
        security_valid = await self.validate_security()
        
        # Calculate overall results
        total_time = time.time() - self.start_time
        
        # Count passed validations
        validations = [
            ("Authentication", auth_valid),
            ("Core APIs", core_valid),
            ("RBAC System", rbac_valid),
            ("Export System", export_valid),
            ("AI System", ai_valid),
            ("Performance", performance_valid),
            ("Security", security_valid)
        ]
        
        passed_validations = sum(1 for _, valid in validations if valid)
        total_validations = len(validations)
        
        # Final report
        print("\n" + "=" * 70)
        print("📋 FINAL PRODUCTION VALIDATION REPORT")
        print("=" * 70)
        
        print(f"⏱️ Total Validation Time: {total_time:.2f}s")
        print(f"📊 Overall Success Rate: {passed_validations}/{total_validations} ({(passed_validations/total_validations*100):.1f}%)")
        
        print("\n🔍 Validation Results:")
        for name, valid in validations:
            status = "✅ PASS" if valid else "❌ FAIL"
            print(f"   {status} {name}")
        
        # Performance summary
        if "performance" in self.validation_results:
            perf = self.validation_results["performance"]
            print(f"\n⚡ Performance Summary:")
            print(f"   📈 Average Response Time: {perf.get('average_response_time', 'N/A')}")
            print(f"   🐌 Slowest Response: {perf.get('max_response_time', 'N/A')}")
            print(f"   ⚡ Fastest Response: {perf.get('min_response_time', 'N/A')}")
        
        # Security summary
        if "security" in self.validation_results:
            sec = self.validation_results["security"]
            print(f"\n🔒 Security Summary:")
            print(f"   📊 Security Score: {sec.get('success_rate', 'N/A')}")
            print(f"   ✅ Passed Checks: {sec.get('passed', 0)}/{sec.get('total', 0)}")
        
        # Final assessment
        if passed_validations == total_validations:
            print("\n🎉 PRODUCTION READINESS: EXCELLENT")
            print("   ✅ All validations passed")
            print("   ✅ System is production-ready")
            print("   ✅ Ready for immediate deployment")
        elif passed_validations >= total_validations * 0.9:
            print("\n✅ PRODUCTION READINESS: GOOD")
            print("   ✅ Most validations passed")
            print("   ⚠️ Minor issues to address")
            print("   ✅ System is production-ready")
        elif passed_validations >= total_validations * 0.75:
            print("\n⚠️ PRODUCTION READINESS: NEEDS ATTENTION")
            print("   ⚠️ Some validations failed")
            print("   🔧 Issues need to be addressed")
            print("   ⚠️ System needs fixes before production")
        else:
            print("\n❌ PRODUCTION READINESS: NOT READY")
            print("   ❌ Multiple validations failed")
            print("   🔧 Significant issues need to be addressed")
            print("   ❌ System is not production-ready")
        
        # Save detailed results
        self.validation_results["summary"] = {
            "total_time": total_time,
            "passed_validations": passed_validations,
            "total_validations": total_validations,
            "success_rate": f"{(passed_validations/total_validations*100):.1f}%",
            "production_ready": passed_validations >= total_validations * 0.9,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return passed_validations >= total_validations * 0.9

async def main():
    async with FinalValidator() as validator:
        await validator.run_final_validation()

if __name__ == "__main__":
    asyncio.run(main())
