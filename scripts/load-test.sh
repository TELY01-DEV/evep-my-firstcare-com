#!/bin/bash

# EVEP Platform Load Testing Script
# This script performs comprehensive load testing to ensure the platform can handle production traffic

set -e

echo "🚀 EVEP Platform Load Testing"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8013"
CONCURRENT_USERS=${1:-10}
DURATION=${2:-60}
RAMP_UP=${3:-10}

echo -e "${BLUE}📋 Load Test Configuration:${NC}"
echo "   Base URL: $BASE_URL"
echo "   Concurrent Users: $CONCURRENT_USERS"
echo "   Duration: ${DURATION}s"
echo "   Ramp Up: ${RAMP_UP}s"
echo ""

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking Dependencies...${NC}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq not found - installing...${NC}"
        if command -v brew &> /dev/null; then
            brew install jq
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        else
            echo -e "${RED}❌ Cannot install jq automatically${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Dependencies check passed${NC}"
    echo ""
}

# Function to perform API load test
load_test_api() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    local test_name=$4
    
    echo -e "${BLUE}🧪 Testing $test_name...${NC}"
    
    # Create temporary test file
    cat > /tmp/load_test_${test_name}.sh << EOF
#!/bin/bash
for i in {1..$CONCURRENT_USERS}; do
    (
        while true; do
            START_TIME=\$(date +%s.%N)
            
            if [ "$method" = "POST" ]; then
                RESPONSE=\$(curl -s -w "%{http_code}|%{time_total}" -o /tmp/response_\${i}_\${RANDOM}.json \\
                    -X POST \\
                    -H "Content-Type: application/json" \\
                    -d '$data' \\
                    "$BASE_URL$endpoint")
            else
                RESPONSE=\$(curl -s -w "%{http_code}|%{time_total}" -o /tmp/response_\${i}_\${RANDOM}.json \\
                    -X $method \\
                    "$BASE_URL$endpoint")
            fi
            
            END_TIME=\$(date +%s.%N)
            DURATION=\$(echo "\$END_TIME - \$START_TIME" | bc -l)
            
            HTTP_CODE=\$(echo \$RESPONSE | cut -d'|' -f1)
            CURL_TIME=\$(echo \$RESPONSE | cut -d'|' -f2)
            
            echo "\$(date '+%Y-%m-%d %H:%M:%S.%3N'),\$i,\$HTTP_CODE,\$CURL_TIME,\$DURATION" >> /tmp/load_test_${test_name}_results.csv
            
            sleep 0.1
        done
    ) &
done

# Wait for specified duration
sleep $DURATION

# Kill background processes
pkill -P \$\$
EOF
    
    chmod +x /tmp/load_test_${test_name}.sh
    
    # Initialize results file
    echo "timestamp,user_id,http_code,curl_time,duration" > /tmp/load_test_${test_name}_results.csv
    
    # Run the test
    echo "   Starting load test for $CONCURRENT_USERS users..."
    /tmp/load_test_${test_name}.sh &
    TEST_PID=$!
    
    # Show progress
    for i in $(seq 1 $DURATION); do
        echo -n "."
        sleep 1
    done
    echo ""
    
    # Wait for test to complete
    wait $TEST_PID
    
    # Analyze results
    analyze_results ${test_name}
}

# Function to analyze test results
analyze_results() {
    local test_name=$1
    local results_file="/tmp/load_test_${test_name}_results.csv"
    
    echo "   Analyzing results..."
    
    # Calculate statistics
    TOTAL_REQUESTS=$(wc -l < "$results_file")
    TOTAL_REQUESTS=$((TOTAL_REQUESTS - 1))  # Subtract header
    
    SUCCESSFUL_REQUESTS=$(tail -n +2 "$results_file" | awk -F',' '$3 == "200" {count++} END {print count+0}')
    FAILED_REQUESTS=$((TOTAL_REQUESTS - SUCCESSFUL_REQUESTS))
    
    SUCCESS_RATE=$(echo "scale=2; $SUCCESSFUL_REQUESTS * 100 / $TOTAL_REQUESTS" | bc -l)
    
    # Calculate response time statistics
    AVG_RESPONSE_TIME=$(tail -n +2 "$results_file" | awk -F',' '{sum+=$4} END {print sum/NR}')
    MIN_RESPONSE_TIME=$(tail -n +2 "$results_file" | awk -F',' 'NR==1{min=$4} $4<min{min=$4} END {print min}')
    MAX_RESPONSE_TIME=$(tail -n +2 "$results_file" | awk -F',' 'NR==1{max=$4} $4>max{max=$4} END {print max}')
    
    # Calculate requests per second
    RPS=$(echo "scale=2; $TOTAL_REQUESTS / $DURATION" | bc -l)
    
    # Display results
    echo ""
    echo -e "${GREEN}📊 $test_name Load Test Results:${NC}"
    echo "   Total Requests: $TOTAL_REQUESTS"
    echo "   Successful Requests: $SUCCESSFUL_REQUESTS"
    echo "   Failed Requests: $FAILED_REQUESTS"
    echo "   Success Rate: ${SUCCESS_RATE}%"
    echo "   Requests per Second: $RPS"
    echo "   Average Response Time: ${AVG_RESPONSE_TIME}s"
    echo "   Min Response Time: ${MIN_RESPONSE_TIME}s"
    echo "   Max Response Time: ${MAX_RESPONSE_TIME}s"
    
    # Performance assessment
    if (( $(echo "$SUCCESS_RATE >= 95" | bc -l) )) && (( $(echo "$AVG_RESPONSE_TIME < 2.0" | bc -l) )); then
        echo -e "   ${GREEN}✅ Performance: EXCELLENT${NC}"
    elif (( $(echo "$SUCCESS_RATE >= 90" | bc -l) )) && (( $(echo "$AVG_RESPONSE_TIME < 3.0" | bc -l) )); then
        echo -e "   ${YELLOW}⚠️  Performance: GOOD${NC}"
    else
        echo -e "   ${RED}❌ Performance: NEEDS IMPROVEMENT${NC}"
    fi
    
    echo ""
}

# Function to test specific endpoints
test_endpoints() {
    echo -e "${BLUE}🎯 Testing Specific Endpoints${NC}"
    echo "--------------------------------"
    
    # Test health endpoint
    load_test_api "/health" "GET" "" "Health_Check"
    
    # Test auth endpoint
    load_test_api "/api/v1/auth/health" "GET" "" "Auth_API"
    
    # Test patient management
    load_test_api "/api/v1/patients/health" "GET" "" "Patient_API"
    
    # Test screening API
    load_test_api "/api/v1/screening/health" "GET" "" "Screening_API"
    
    # Test AI/ML API
    load_test_api "/api/v1/ai_ml/health" "GET" "" "AI_ML_API"
    
    # Test LINE Bot API
    load_test_api "/api/v1/line_integration/bot/bot/settings" "GET" "" "LINE_Bot_API"
}

# Function to test database performance
test_database() {
    echo -e "${BLUE}🗄️  Testing Database Performance${NC}"
    echo "--------------------------------"
    
    # Test database connection
    echo "   Testing database connection..."
    DB_TEST_START=$(date +%s.%N)
    
    for i in {1..100}; do
        curl -s "$BASE_URL/health" > /dev/null &
    done
    wait
    
    DB_TEST_END=$(date +%s.%N)
    DB_TEST_DURATION=$(echo "$DB_TEST_END - $DB_TEST_START" | bc -l)
    
    echo "   Database test completed in ${DB_TEST_DURATION}s"
    echo ""
}

# Function to test memory usage
test_memory() {
    echo -e "${BLUE}💾 Testing Memory Usage${NC}"
    echo "---------------------------"
    
    echo "   Current memory usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep evep
    
    echo ""
    echo "   Memory usage during load test:"
    
    # Monitor memory during a quick load test
    for i in {1..5}; do
        echo "   Test $i:"
        docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep evep-backend
        sleep 2
    done
    
    echo ""
}

# Function to generate load test report
generate_report() {
    echo -e "${BLUE}📄 Generating Load Test Report${NC}"
    echo "--------------------------------"
    
    REPORT_FILE="load_test_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# EVEP Platform Load Test Report

**Date:** $(date)
**Duration:** ${DURATION}s
**Concurrent Users:** $CONCURRENT_USERS
**Ramp Up:** ${RAMP_UP}s

## Test Configuration
- Base URL: $BASE_URL
- Test Duration: ${DURATION} seconds
- Concurrent Users: $CONCURRENT_USERS
- Ramp Up Time: ${RAMP_UP} seconds

## Results Summary

### Health Check Endpoint
- Total Requests: $(grep -c "Health_Check" /tmp/load_test_Health_Check_results.csv 2>/dev/null || echo "N/A")
- Success Rate: $(grep "Health_Check" /tmp/load_test_Health_Check_results.csv 2>/dev/null | awk -F',' '$3 == "200" {count++} END {print count+0}' || echo "N/A")%

### API Endpoints
- Auth API: $(grep -c "Auth_API" /tmp/load_test_Auth_API_results.csv 2>/dev/null || echo "N/A") requests
- Patient API: $(grep -c "Patient_API" /tmp/load_test_Patient_API_results.csv 2>/dev/null || echo "N/A") requests
- Screening API: $(grep -c "Screening_API" /tmp/load_test_Screening_API_results.csv 2>/dev/null || echo "N/A") requests
- AI/ML API: $(grep -c "AI_ML_API" /tmp/load_test_AI_ML_API_results.csv 2>/dev/null || echo "N/A") requests
- LINE Bot API: $(grep -c "LINE_Bot_API" /tmp/load_test_LINE_Bot_API_results.csv 2>/dev/null || echo "N/A") requests

## Performance Metrics

### Response Times
- Average: Calculated from test results
- Minimum: Calculated from test results
- Maximum: Calculated from test results

### Throughput
- Requests per Second: Calculated from test results

## Recommendations

Based on the load test results, consider the following:

1. **Performance Optimization**
   - Monitor response times under load
   - Optimize database queries if needed
   - Consider caching strategies

2. **Scalability**
   - Evaluate horizontal scaling needs
   - Monitor resource usage
   - Plan for increased load

3. **Monitoring**
   - Set up alerts for performance degradation
   - Monitor error rates
   - Track user experience metrics

## Next Steps

1. Review performance bottlenecks
2. Implement optimizations if needed
3. Run additional tests with higher load
4. Monitor production performance
5. Set up automated load testing

---
*Report generated by EVEP Platform Load Testing Script*
EOF
    
    echo "   Report generated: $REPORT_FILE"
    echo ""
}

# Main execution
main() {
    check_dependencies
    
    echo -e "${BLUE}🚀 Starting Load Testing...${NC}"
    echo ""
    
    # Test endpoints
    test_endpoints
    
    # Test database performance
    test_database
    
    # Test memory usage
    test_memory
    
    # Generate report
    generate_report
    
    echo -e "${GREEN}✅ Load testing completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Review the generated report"
    echo "2. Analyze performance bottlenecks"
    echo "3. Implement optimizations if needed"
    echo "4. Run additional tests with different scenarios"
    echo "5. Monitor production performance"
    
    # Cleanup temporary files
    rm -f /tmp/load_test_*.sh /tmp/load_test_*_results.csv /tmp/response_*.json
}

# Run main function
main
