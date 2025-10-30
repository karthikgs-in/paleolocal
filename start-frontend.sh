#!/bin/bash

# PaleoLocal Frontend Startup Script
# This script ensures the frontend is always started from the correct directory

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🦕 PaleoLocal Frontend Startup Script${NC}"
echo -e "${BLUE}=====================================${NC}"

# Get the script directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo -e "${YELLOW}📁 Project root: $SCRIPT_DIR${NC}"
echo -e "${YELLOW}📁 Frontend directory: $FRONTEND_DIR${NC}"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found in $FRONTEND_DIR${NC}"
    exit 1
fi

# Change to frontend directory
cd "$FRONTEND_DIR"
echo -e "${GREEN}✅ Changed to frontend directory${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if port 3002 is already in use
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3002 is already in use. Killing existing process...${NC}"
    pkill -f "vite" || true
    sleep 2
fi

echo -e "${GREEN}🚀 Starting development server on http://localhost:3002${NC}"
echo -e "${GREEN}💡 HMR enabled with polling for macOS compatibility${NC}"
echo -e "${BLUE}=====================================${NC}"

# Start the development server
npm run dev