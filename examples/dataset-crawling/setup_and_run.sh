#!/bin/bash

# setup_and_run.sh
# Script to setup and deploy the Bindu Dashboard (Backend + Frontend)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Bindu Dashboard Setup ===${NC}"

# 1. Backend Setup
echo -e "${GREEN}--> Setting up Backend...${NC}"
cd dashboard/backend

# Check if uv is installed, otherwise use pip
if command -v uv &> /dev/null; then
    echo "Using uv for installation..."
    # uv pip install -r requirements.txt # Optional if managing venv manually
    # For simplicity in this script, assuming user has a venv or is okay with system/user install
    # Or just use uv run which handles venvs nicely
    echo "Backend dependencies will be handled by 'uv run' or installed manually if preferred."
else
    echo "Using pip for installation..."
    pip install -r requirements.txt
    pip install "uvicorn[standard]"
fi

cd ../..

# 2. Frontend Setup
echo -e "${GREEN}--> Setting up Frontend...${NC}"
cd dashboard/frontend
if [ ! -d "node_modules" ]; then
    echo "Installing node modules..."
    npm install
fi
cd ../..

# 3. Run Application
echo -e "${BLUE}=== Starting Services ===${NC}"

# Function to kill background processes on exit
cleanup() {
    echo -e "${BLUE}Shutting down services...${NC}"
    kill $(jobs -p)
}
trap cleanup EXIT

# Start Backend
echo -e "${GREEN}Starting Backend (localhost:8000)...${NC}"
if command -v uv &> /dev/null; then
    cd dashboard/backend
    uv run --with fastapi --with uvicorn --with jinja2 --with pydantic --with httpx uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ../..
else
    cd dashboard/backend
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ../..
fi

# Wait for backend to be ready (rudimentary check)
sleep 3

# Start Frontend
echo -e "${GREEN}Starting Frontend (localhost:3000)...${NC}"
cd dashboard/frontend
npm run dev

# Wait for processes
wait $BACKEND_PID
