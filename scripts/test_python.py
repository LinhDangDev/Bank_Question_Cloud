#!/usr/bin/env python3
"""
Simple test script to verify Python execution from Node.js
"""
import sys
import json

# Output a simple JSON object
result = {
    "success": True,
    "message": "Python execution successful!",
    "pythonVersion": sys.version,
    "args": sys.argv[1:] if len(sys.argv) > 1 else []
}

print(json.dumps(result))
