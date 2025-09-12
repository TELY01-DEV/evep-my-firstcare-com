#!/bin/bash

# EVEP Platform Production Readiness Checklist
# This script performs comprehensive checks to ensure the platform is ready for production

set -e

echo "🔍 EVEP Platform Production Readiness Checklist"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Function to perform checks
check_service() {
    local service_name=$1
    local service_url=$2
    local expected_status=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "   Checking $service_name... "
    
    if curl -f -s "$service_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

check_database() {
    local db_name=$1
    local connection_string=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "   Checking $db_name connection... "
    
    if docker exec evep-backend python -c "
import pymongo
try:
    client = pymongo.MongoClient('$connection_string', serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print('SUCCESS')
except Exception as e:
    print('FAIL')
" | grep -q "SUCCESS"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

check_environment() {
    local env_var=$1
    local description=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "   Checking $description... "
    
    if [ ! -z "${!env_var}" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# 1. System Services Check
echo -e "${BLUE}1. System Services Health Check${NC}"
echo "----------------------------------------"

check_service "Backend API" "http://localhost:8013/health"
check_service "Frontend Application" "http://localhost:3013"
check_service "Admin Panel" "http://localhost:3015"
check_service "Grafana Monitoring" "http://localhost:3001"
check_service "Kibana Logs" "http://localhost:5601"
check_service "Prometheus Metrics" "http://localhost:9090"

echo ""

# 2. Database Connectivity Check
echo -e "${BLUE}2. Database Connectivity Check${NC}"
echo "--------------------------------------"

check_database "MongoDB Primary" "mongodb://mongo-primary:27017"
check_database "MongoDB Replica Set" "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0"

echo ""

# 3. Environment Configuration Check
echo -e "${BLUE}3. Environment Configuration Check${NC}"
echo "-------------------------------------------"

check_environment "JWT_SECRET" "JWT Secret"
check_environment "MONGO_URI" "MongoDB URI"
check_environment "REDIS_URL" "Redis URL"
check_environment "LINE_CHANNEL_ACCESS_TOKEN" "LINE Bot Access Token"
check_environment "LINE_CHANNEL_SECRET" "LINE Bot Secret"
check_environment "OPENAI_API_KEY" "OpenAI API Key"

echo ""

# 4. API Endpoints Check
echo -e "${BLUE}4. API Endpoints Check${NC}"
echo "---------------------------"

check_service "Auth API" "http://localhost:8013/api/v1/auth/health"
check_service "Patient Management API" "http://localhost:8013/api/v1/patient_management/api/v1/patients/health"
check_service "Screening API" "http://localhost:8013/api/v1/screening/api/v1/screenings/health"
check_service "AI/ML API" "http://localhost:8013/api/v1/ai_ml/health"
check_service "LINE Integration API" "http://localhost:8013/api/v1/line_integration/health"
check_service "LINE Bot Manager API" "http://localhost:8013/api/v1/line_integration/bot/bot/settings"

echo ""

# 5. Security Check
echo -e "${BLUE}5. Security Configuration Check${NC}"
echo "----------------------------------------"

# Check if JWT is properly configured
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking JWT configuration... "
if [ ! -z "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check CORS configuration
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking CORS configuration... "
if curl -s -H "Origin: http://localhost:3013" http://localhost:8013/health | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 6. Performance Check
echo -e "${BLUE}6. Performance Check${NC}"
echo "----------------------"

# Check API response time
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking API response time... "
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:8013/health)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASS (${RESPONSE_TIME}s)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  WARNING (${RESPONSE_TIME}s)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check memory usage
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking memory usage... "
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.MemUsage}}" evep-backend | tail -1 | awk '{print $1}' | sed 's/MiB//')
if [ "$MEMORY_USAGE" -lt 1000 ]; then
    echo -e "${GREEN}✅ PASS (${MEMORY_USAGE}MB)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  WARNING (${MEMORY_USAGE}MB)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 7. Docker Services Check
echo -e "${BLUE}7. Docker Services Check${NC}"
echo "---------------------------"

# Check if all containers are running
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking all containers are running... "
RUNNING_CONTAINERS=$(docker-compose ps -q | wc -l)
EXPECTED_CONTAINERS=13  # Adjust based on your docker-compose.yml
if [ "$RUNNING_CONTAINERS" -eq "$EXPECTED_CONTAINERS" ]; then
    echo -e "${GREEN}✅ PASS (${RUNNING_CONTAINERS}/${EXPECTED_CONTAINERS})${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ FAIL (${RUNNING_CONTAINERS}/${EXPECTED_CONTAINERS})${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Check container health
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo -n "   Checking container health... "
UNHEALTHY_CONTAINERS=$(docker-compose ps | grep -c "unhealthy" || true)
if [ "$UNHEALTHY_CONTAINERS" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ FAIL (${UNHEALTHY_CONTAINERS} unhealthy)${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""

# 8. LINE Bot Integration Check
echo -e "${BLUE}8. LINE Bot Integration Check${NC}"
echo "-----------------------------------"

check_service "LINE Bot Settings API" "http://localhost:8013/api/v1/line_integration/bot/bot/settings"
check_service "LINE Bot Keyword Replies API" "http://localhost:8013/api/v1/line_integration/bot/bot/keyword-replies"
check_service "LINE Bot Flex Messages API" "http://localhost:8013/api/v1/line_integration/bot/bot/flex-messages"
check_service "LINE Bot Rich Menus API" "http://localhost:8013/api/v1/line_integration/bot/bot/rich-menus"

echo ""

# 9. AI/ML Integration Check
echo -e "${BLUE}9. AI/ML Integration Check${NC}"
echo "--------------------------------"

check_service "AI/ML Health Check" "http://localhost:8013/api/v1/ai_ml/health"
check_service "AI/ML Prompts API" "http://localhost:8013/api/v1/ai_ml/prompts"
check_service "AI/ML Analytics API" "http://localhost:8013/api/v1/ai_ml/analytics/insights"

echo ""

# 10. Monitoring Check
echo -e "${BLUE}10. Monitoring & Logging Check${NC}"
echo "-------------------------------------"

check_service "Prometheus Metrics" "http://localhost:9090/api/v1/query?query=up"
check_service "Grafana Dashboard" "http://localhost:3001/api/health"
check_service "Elasticsearch" "http://localhost:9200/_cluster/health"
check_service "Kibana" "http://localhost:5601/api/status"

echo ""

# Summary
echo -e "${BLUE}📊 PRODUCTION READINESS SUMMARY${NC}"
echo "======================================"
echo ""
echo -e "Total Checks: ${TOTAL_CHECKS}"
echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed: ${RED}${FAILED_CHECKS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "Success Rate: ${PASS_PERCENTAGE}%"
    echo ""
fi

# Recommendations
if [ $FAILED_CHECKS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 PRODUCTION READY!${NC}"
    echo "All checks passed. The EVEP Platform is ready for production deployment."
elif [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PRODUCTION READY WITH WARNINGS${NC}"
    echo "All critical checks passed, but there are some warnings to address."
else
    echo -e "${RED}❌ NOT PRODUCTION READY${NC}"
    echo "Some critical checks failed. Please address the issues before deployment."
fi

echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo "1. Address any failed checks"
echo "2. Review warnings and optimize if needed"
echo "3. Run load testing"
echo "4. Configure backup and monitoring alerts"
echo "5. Deploy to production using: ./scripts/deploy-production-with-line-bot.sh"
echo "6. Set up LINE Bot following: documents/LINE_Bot_Setup_Guide.md"

echo ""
echo -e "${GREEN}✅ Production readiness check completed!${NC}"
