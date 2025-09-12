#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="backend/logs"

echo -e "${PURPLE}🔍 EVEP Logging System${NC}"
echo "================================"
echo ""

# Function to check if logs directory exists
check_logs_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        echo -e "${YELLOW}⚠️  Logs directory not found. Creating...${NC}"
        mkdir -p "$LOG_DIR"
        echo -e "${GREEN}✅ Logs directory created: $LOG_DIR${NC}"
    fi
}

# Function to show log file sizes
show_log_sizes() {
    echo -e "${BLUE}📊 Log File Sizes:${NC}"
    echo "-------------------"
    if [ -d "$LOG_DIR" ]; then
        for log_file in "$LOG_DIR"/*.log; do
            if [ -f "$log_file" ]; then
                size=$(du -h "$log_file" | cut -f1)
                lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
                echo -e "  $(basename "$log_file"): ${CYAN}$size${NC} (${YELLOW}$lines lines${NC})"
            fi
        done
    else
        echo -e "${RED}❌ Logs directory not found${NC}"
    fi
    echo ""
}

# Function to tail logs in real-time
tail_logs() {
    local log_type=${1:-"all"}
    echo -e "${GREEN}📺 Tailing logs (Press Ctrl+C to stop)...${NC}"
    echo ""
    
    case $log_type in
        "all")
            tail -f "$LOG_DIR"/*.log 2>/dev/null | grep --line-buffered -E ".*"
            ;;
        "api")
            tail -f "$LOG_DIR/evep_api.log" 2>/dev/null
            ;;
        "errors")
            tail -f "$LOG_DIR/evep_errors.log" 2>/dev/null
            ;;
        "main")
            tail -f "$LOG_DIR/evep.log" 2>/dev/null
            ;;
        *)
            echo -e "${RED}❌ Invalid log type. Use: all, api, errors, main${NC}"
            exit 1
            ;;
    esac
}

# Function to search logs
search_logs() {
    local search_term=$1
    local log_type=${2:-"all"}
    
    if [ -z "$search_term" ]; then
        echo -e "${RED}❌ Please provide a search term${NC}"
        echo "Usage: $0 search <term> [log_type]"
        exit 1
    fi
    
    echo -e "${GREEN}🔍 Searching for: '$search_term'${NC}"
    echo ""
    
    case $log_type in
        "all")
            grep -r "$search_term" "$LOG_DIR"/*.log 2>/dev/null
            ;;
        "api")
            grep "$search_term" "$LOG_DIR/evep_api.log" 2>/dev/null
            ;;
        "errors")
            grep "$search_term" "$LOG_DIR/evep_errors.log" 2>/dev/null
            ;;
        "main")
            grep "$search_term" "$LOG_DIR/evep.log" 2>/dev/null
            ;;
        *)
            echo -e "${RED}❌ Invalid log type. Use: all, api, errors, main${NC}"
            exit 1
            ;;
    esac
}

# Function to show recent logs
show_recent() {
    local lines=${1:-50}
    local log_type=${2:-"main"}
    
    echo -e "${GREEN}📋 Recent logs (last $lines lines):${NC}"
    echo "----------------------------------------"
    
    case $log_type in
        "all")
            for log_file in "$LOG_DIR"/*.log; do
                if [ -f "$log_file" ]; then
                    echo -e "${BLUE}=== $(basename "$log_file") ===${NC}"
                    tail -n "$lines" "$log_file"
                    echo ""
                fi
            done
            ;;
        "api")
            tail -n "$lines" "$LOG_DIR/evep_api.log" 2>/dev/null
            ;;
        "errors")
            tail -n "$lines" "$LOG_DIR/evep_errors.log" 2>/dev/null
            ;;
        "main")
            tail -n "$lines" "$LOG_DIR/evep.log" 2>/dev/null
            ;;
        *)
            echo -e "${RED}❌ Invalid log type. Use: all, api, errors, main${NC}"
            exit 1
            ;;
    esac
}

# Function to clear logs
clear_logs() {
    local log_type=${1:-"all"}
    
    echo -e "${YELLOW}⚠️  Are you sure you want to clear logs? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        case $log_type in
            "all")
                rm -f "$LOG_DIR"/*.log
                echo -e "${GREEN}✅ All logs cleared${NC}"
                ;;
            "api")
                rm -f "$LOG_DIR/evep_api.log"
                echo -e "${GREEN}✅ API logs cleared${NC}"
                ;;
            "errors")
                rm -f "$LOG_DIR/evep_errors.log"
                echo -e "${GREEN}✅ Error logs cleared${NC}"
                ;;
            "main")
                rm -f "$LOG_DIR/evep.log"
                echo -e "${GREEN}✅ Main logs cleared${NC}"
                ;;
            *)
                echo -e "${RED}❌ Invalid log type. Use: all, api, errors, main${NC}"
                exit 1
                ;;
        esac
    else
        echo -e "${BLUE}❌ Log clearing cancelled${NC}"
    fi
}

# Function to show help
show_help() {
    echo -e "${CYAN}📖 EVEP Logging System Help${NC}"
    echo "================================"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status     - Show log file sizes and status"
    echo "  tail       - Tail logs in real-time"
    echo "  search     - Search logs for specific terms"
    echo "  recent     - Show recent log entries"
    echo "  clear      - Clear log files"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 tail api"
    echo "  $0 search 'error' errors"
    echo "  $0 recent 100 main"
    echo "  $0 clear api"
    echo ""
    echo "Log Types:"
    echo "  all        - All log files"
    echo "  api        - API-specific logs"
    echo "  errors     - Error logs only"
    echo "  main       - Main application logs"
    echo ""
}

# Main script logic
check_logs_dir

case ${1:-"help"} in
    "status")
        show_log_sizes
        ;;
    "tail")
        tail_logs "$2"
        ;;
    "search")
        search_logs "$2" "$3"
        ;;
    "recent")
        show_recent "$2" "$3"
        ;;
    "clear")
        clear_logs "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
