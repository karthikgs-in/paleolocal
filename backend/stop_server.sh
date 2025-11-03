#!/bin/bash

# PaleoLocal Backend Stop Script
# This script stops the FastAPI backend server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping PaleoLocal Backend Server...${NC}"

# Kill uvicorn processes
KILLED_UVICORN=false
if pkill -f "uvicorn.*app.main:app" 2>/dev/null; then
    echo -e "${GREEN}✅ Stopped uvicorn process${NC}"
    KILLED_UVICORN=true
fi

# Kill any process on port 8000
if lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}   Killing process on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Freed port 8000${NC}"
    KILLED_UVICORN=true
fi

if [ "$KILLED_UVICORN" = true ]; then
    echo -e "${GREEN}🎉 Backend server stopped successfully${NC}"
else
    echo -e "${YELLOW}ℹ️  No backend server was running${NC}"
fi