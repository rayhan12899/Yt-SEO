#!/bin/bash
echo ""
echo " ===================================="
echo "  YouTube SEO Tools 2.0 - Server"
echo " ===================================="
echo ""

PORT=8080

if command -v python3 &>/dev/null; then
    echo " [OK] Python3 found! Starting server..."
    echo ""
    echo " Open your browser and go to:"
    echo " http://localhost:$PORT"
    echo ""
    echo " Press CTRL+C to stop."
    echo ""
    python3 -m http.server $PORT
elif command -v python &>/dev/null; then
    echo " [OK] Python found! Starting server..."
    echo ""
    echo " http://localhost:$PORT"
    echo ""
    python -m http.server $PORT
elif command -v npx &>/dev/null; then
    echo " [OK] Node.js found! Starting server..."
    echo ""
    echo " http://localhost:$PORT"
    echo ""
    npx http-server -p $PORT -o
else
    echo " [ERROR] Python or Node.js not found!"
    echo " Install Python: https://www.python.org/downloads/"
fi
