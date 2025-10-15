#!/bin/bash

# ===================================
# ROI Systems - Stop Demo Script
# ===================================

echo "🛑 Stopping ROI Systems Demo..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Stop backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        print_success "Backend stopped (PID: $BACKEND_PID)"
    else
        print_error "Backend process not found"
    fi
    rm backend.pid
fi

# Stop frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "Frontend stopped (PID: $FRONTEND_PID)"
    else
        print_error "Frontend process not found"
    fi
    rm frontend.pid
fi

# Kill any remaining processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null && print_success "Cleaned up port 3000" || true
lsof -ti:5051 | xargs kill -9 2>/dev/null && print_success "Cleaned up port 5051" || true

echo ""
print_success "Demo environment stopped"
echo ""
