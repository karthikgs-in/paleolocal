#!/bin/bash

# PaleoLocal Backend Startup Script
# This script starts the FastAPI backend server with proper configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$BACKEND_DIR/venv"
APP_MODULE="app.main:app"
HOST="127.0.0.1"
PORT="8000"

echo -e "${BLUE}🦕 PaleoLocal Backend Startup${NC}"
echo -e "${BLUE}================================${NC}"

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/app/main.py" ]; then
    echo -e "${RED}❌ Error: Cannot find app/main.py in $BACKEND_DIR${NC}"
    echo -e "${RED}   Make sure you're running this script from the backend directory${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}❌ Error: Virtual environment not found at $VENV_PATH${NC}"
    echo -e "${YELLOW}   Please create a virtual environment first:${NC}"
    echo -e "${YELLOW}   python -m venv venv${NC}"
    exit 1
fi

# Check if virtual environment has the right Python
if [ ! -f "$VENV_PATH/bin/python" ]; then
    echo -e "${RED}❌ Error: Python executable not found in virtual environment${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source "$VENV_PATH/bin/activate"

# Verify activation worked
if [ "$VIRTUAL_ENV" != "$VENV_PATH" ]; then
    echo -e "${RED}❌ Error: Failed to activate virtual environment${NC}"
    exit 1
fi

# Check if uvicorn is installed
if ! python -c "import uvicorn" 2>/dev/null; then
    echo -e "${RED}❌ Error: uvicorn not found in virtual environment${NC}"
    echo -e "${YELLOW}   Installing requirements...${NC}"
    
    if [ -f "$BACKEND_DIR/app/requirements.txt" ]; then
        pip install -r "$BACKEND_DIR/app/requirements.txt"
    else
        echo -e "${RED}❌ Error: requirements.txt not found${NC}"
        exit 1
    fi
fi

# Check if curl is available for health checks
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}⚠️  curl not found - health check will be skipped${NC}"
    HEALTH_CHECK_ENABLED=false
else
    HEALTH_CHECK_ENABLED=true
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    echo -e "${YELLOW}   Attempting to kill existing process...${NC}"
    pkill -f "uvicorn.*$APP_MODULE" || true
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Set PYTHONPATH to include the backend directory
export PYTHONPATH="${BACKEND_DIR}:$PYTHONPATH"

# Start the server
echo -e "${GREEN}🚀 Starting FastAPI server...${NC}"
echo -e "${GREEN}   Host: $HOST${NC}"
echo -e "${GREEN}   Port: $PORT${NC}"
echo -e "${GREEN}   Module: $APP_MODULE${NC}"
echo -e "${GREEN}   URL: http://$HOST:$PORT${NC}"
echo ""
echo -e "${YELLOW}📝 Server logs will appear below...${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
echo ""

# Change to backend directory to ensure relative imports work
cd "$BACKEND_DIR"

# Start uvicorn with proper configuration
python -m uvicorn "$APP_MODULE" \
    --host "$HOST" \
    --port "$PORT" \
    --reload \
    --log-level info \
    --access-log &

# Get the PID of the uvicorn process
UVICORN_PID=$!

# Wait a moment for server to start
sleep 3

# Health check (if curl is available)
if [ "$HEALTH_CHECK_ENABLED" = true ]; then
    echo -e "${YELLOW}🔍 Performing health check...${NC}"
    if curl -s "http://$HOST:$PORT/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is responding successfully!${NC}"
        echo -e "${GREEN}🌐 API is available at: http://$HOST:$PORT${NC}"
    else
        echo -e "${RED}❌ Health check failed - server not responding${NC}"
        echo -e "${RED}   Killing server process...${NC}"
        kill $UVICORN_PID 2>/dev/null || true
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Health check skipped (curl not available)${NC}"
    echo -e "${GREEN}🌐 Server should be available at: http://$HOST:$PORT${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Server logs will appear below...${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
echo ""

# Wait for the uvicorn process to finish or be interrupted
wait $UVICORN_PID