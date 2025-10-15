#!/bin/bash

# ===================================
# ROI Systems - Demo Startup Script
# ===================================

set -e

echo "🚀 Starting ROI Systems Demo..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

# Step 1: Setup Backend
echo "1. Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    print_info "Creating backend .env file..."
    cp .env.demo .env
    print_success "Backend .env created"
else
    print_warning "Backend .env already exists"
fi

if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

cd ..

# Step 2: Setup Frontend
echo ""
echo "2. Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    print_info "Creating frontend .env file..."
    cp .env.demo .env
    print_success "Frontend .env created"
else
    print_warning "Frontend .env already exists"
fi

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

cd ..

# Step 3: Start Backend
echo ""
echo "3. Starting backend server..."
cd backend

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start backend in background
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

print_info "Backend starting (PID: $BACKEND_PID)..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "Backend is running at http://localhost:3000"
else
    print_warning "Backend may still be starting..."
fi

cd ..

# Step 4: Start Frontend
echo ""
echo "4. Starting frontend server..."
cd frontend

# Kill any existing process on port 5051
lsof -ti:5051 | xargs kill -9 2>/dev/null || true

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

print_info "Frontend starting (PID: $FRONTEND_PID)..."
sleep 3

print_success "Frontend is running at http://localhost:5051"

cd ..

# Summary
echo ""
echo "================================"
echo "✓ Demo Environment Ready!"
echo "================================"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:5051"
echo "  Backend:  http://localhost:3000"
echo "  Health:   http://localhost:3000/health"
echo ""
echo "Demo Accounts:"
echo "  Email:    demo@roisystems.com"
echo "  Password: Demo2025!"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop:"
echo "  ./stop-demo.sh"
echo ""
print_success "Ready for demo! Open http://localhost:5051/login"
echo ""
