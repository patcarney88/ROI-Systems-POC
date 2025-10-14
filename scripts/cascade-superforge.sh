#!/bin/bash

# Cascade-Superforge Integration Manager
# Helps coordinate between Cascade and Superforge agents

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_DIR="$PROJECT_ROOT/team-dashboard"
CONFIG_FILE="$PROJECT_ROOT/.cascade/agent-coordination.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}Cascade ↔ Superforge Integration Manager${NC}              ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_dashboard() {
    if curl -s http://localhost:4000/api/progress > /dev/null 2>&1; then
        print_status "Dashboard is running at http://localhost:4000"
        return 0
    else
        print_warning "Dashboard is not running"
        return 1
    fi
}

start_dashboard() {
    echo -e "${BLUE}Starting team dashboard...${NC}"
    cd "$DASHBOARD_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dashboard dependencies..."
        npm install
    fi
    
    npm start &
    DASHBOARD_PID=$!
    
    echo "Waiting for dashboard to start..."
    sleep 3
    
    if check_dashboard; then
        print_status "Dashboard started successfully (PID: $DASHBOARD_PID)"
        echo "$DASHBOARD_PID" > "$PROJECT_ROOT/.cascade/dashboard.pid"
    else
        print_error "Failed to start dashboard"
        exit 1
    fi
}

stop_dashboard() {
    if [ -f "$PROJECT_ROOT/.cascade/dashboard.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.cascade/dashboard.pid")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${BLUE}Stopping dashboard (PID: $PID)...${NC}"
            kill $PID
            rm "$PROJECT_ROOT/.cascade/dashboard.pid"
            print_status "Dashboard stopped"
        else
            print_warning "Dashboard process not found"
            rm "$PROJECT_ROOT/.cascade/dashboard.pid"
        fi
    else
        print_warning "No dashboard PID file found"
    fi
}

show_status() {
    print_header
    
    echo -e "${BLUE}Configuration:${NC}"
    if [ -f "$CONFIG_FILE" ]; then
        print_status "Integration config found"
        MODE=$(jq -r '.cascade_superforge_integration.mode' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
        AGENTS=$(jq -r '.superforge_agents.total_agents' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
        echo "  Mode: $MODE"
        echo "  Superforge Agents: $AGENTS"
    else
        print_error "Integration config not found"
    fi
    
    echo ""
    echo -e "${BLUE}Dashboard:${NC}"
    if check_dashboard; then
        # Get current stats
        STATS=$(curl -s http://localhost:4000/api/progress)
        COMPLETED=$(echo "$STATS" | jq -r '[.data.dev.completedTasks, .data.qa.completedTasks] | add' 2>/dev/null || echo "0")
        IN_PROGRESS=$(echo "$STATS" | jq -r '[.data.dev.inProgressTasks, .data.qa.inProgressTasks] | add' 2>/dev/null || echo "0")
        PENDING=$(echo "$STATS" | jq -r '[.data.dev.pendingTasks, .data.qa.pendingTasks] | add' 2>/dev/null || echo "0")
        
        echo "  URL: http://localhost:4000"
        echo "  Tasks Completed: $COMPLETED"
        echo "  Tasks In Progress: $IN_PROGRESS"
        echo "  Tasks Pending: $PENDING"
    fi
    
    echo ""
    echo -e "${BLUE}Superforge:${NC}"
    if [ -f "$PROJECT_ROOT/.superforge/config.json" ]; then
        print_status "Superforge config found"
        SF_AGENTS=$(jq -r '.project.agents' "$PROJECT_ROOT/.superforge/config.json" 2>/dev/null || echo "unknown")
        echo "  Configured Agents: $SF_AGENTS"
    else
        print_warning "Superforge config not found"
    fi
    
    echo ""
    echo -e "${BLUE}Virtual Team:${NC}"
    if [ -f "$PROJECT_ROOT/virtual-team-config.json" ]; then
        print_status "Virtual team config found"
        PERSONAS=$(jq -r '.personas | keys | length' "$PROJECT_ROOT/virtual-team-config.json" 2>/dev/null || echo "unknown")
        echo "  Personas: $PERSONAS"
    else
        print_warning "Virtual team config not found"
    fi
}

delegate_task() {
    local TASK_DESC="$1"
    local TEAM="${2:-dev}"
    
    if ! check_dashboard; then
        print_error "Dashboard must be running to delegate tasks"
        exit 1
    fi
    
    echo -e "${BLUE}Delegating task to $TEAM team...${NC}"
    
    # Find an idle agent
    RESPONSE=$(curl -s http://localhost:4000/api/progress)
    TEAM_DATA=$(echo "$RESPONSE" | jq -r ".data.$TEAM")
    
    # Start task for first idle member
    MEMBER_ID=$(echo "$TEAM_DATA" | jq -r '.members[] | select(.status == "idle") | .id' | head -1)
    
    if [ -z "$MEMBER_ID" ]; then
        print_warning "No idle agents available in $TEAM team"
        exit 1
    fi
    
    curl -s -X POST http://localhost:4000/api/start-task \
        -H 'Content-Type: application/json' \
        -d "{\"team\":\"$TEAM\",\"memberId\":$MEMBER_ID,\"taskName\":\"$TASK_DESC\"}" > /dev/null
    
    print_status "Task delegated to $TEAM team member $MEMBER_ID"
    echo "Monitor progress at: http://localhost:4000"
}

show_activity() {
    if ! check_dashboard; then
        print_error "Dashboard must be running to view activity"
        exit 1
    fi
    
    echo -e "${BLUE}Recent Activity:${NC}"
    echo ""
    
    ACTIVITY=$(curl -s http://localhost:4000/api/activity)
    echo "$ACTIVITY" | jq -r '.data[] | "\(.timestamp | split("T")[1] | split(".")[0]) [\(.team)] \(.member): \(.action)"' | head -20
}

show_help() {
    print_header
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status              Show integration status"
    echo "  start               Start the team dashboard"
    echo "  stop                Stop the team dashboard"
    echo "  restart             Restart the team dashboard"
    echo "  delegate <task>     Delegate a task to dev team"
    echo "  delegate <task> qa  Delegate a task to QA team"
    echo "  activity            Show recent activity"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 start"
    echo "  $0 delegate 'Implement user authentication'"
    echo "  $0 delegate 'Test login flow' qa"
    echo "  $0 activity"
}

# Main
case "${1:-status}" in
    status)
        show_status
        ;;
    start)
        print_header
        start_dashboard
        echo ""
        show_status
        ;;
    stop)
        print_header
        stop_dashboard
        ;;
    restart)
        print_header
        stop_dashboard
        sleep 2
        start_dashboard
        ;;
    delegate)
        if [ -z "$2" ]; then
            print_error "Task description required"
            echo "Usage: $0 delegate <task> [team]"
            exit 1
        fi
        delegate_task "$2" "${3:-dev}"
        ;;
    activity)
        show_activity
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
