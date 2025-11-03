#!/bin/bash

# PaleoLocal Frontend Stop Script
# This script stops the Vite development server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping PaleoLocal Frontend Server...${NC}"

# Kill vite processes
KILLED_VITE=false
if pkill -f "vite" 2>/dev/null; then
    echo -e "${GREEN}✅ Stopped Vite process${NC}"
    KILLED_VITE=true
fi

# Kill any process on port 3002
if lsof -ti:3002 >/dev/null 2>&1; then
    echo -e "${YELLOW}   Killing process on port 3002...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Freed port 3002${NC}"
    KILLED_VITE=true
fi

if [ "$KILLED_VITE" = true ]; then
    echo -e "${GREEN}🎉 Frontend server stopped successfully${NC}"
else
    echo -e "${YELLOW}ℹ️  No frontend server was running${NC}"
fi