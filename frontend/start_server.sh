#!/bin/bash

# PaleoLocal Frontend Startup Script
# This script starts the Vite development server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="3002"

echo -e "${BLUE}🌐 PaleoLocal Frontend Startup${NC}"
echo -e "${BLUE}==================================${NC}"

# Check if we're in the right directory
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "${RED}❌ Error: Cannot find package.json in $FRONTEND_DIR${NC}"
    echo -e "${RED}   Make sure you're running this script from the frontend directory${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    echo -e "${YELLOW}   Attempting to kill existing process...${NC}"
    pkill -f "vite" || true
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Change to frontend directory
cd "$FRONTEND_DIR"

# Start the development server
echo -e "${GREEN}🚀 Starting Vite development server...${NC}"
echo -e "${GREEN}   Port: $PORT${NC}"
echo -e "${GREEN}   URL: http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}📝 Server logs will appear below...${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
echo ""

# Start the dev server
exec npm run dev