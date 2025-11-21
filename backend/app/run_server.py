#!/usr/bin/env python3

import sys
import os

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import and run the app
if __name__ == "__main__":
    import uvicorn
    from main import app
    
    print("🚀 Starting FastAPI server on http://localhost:8003")
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=False)