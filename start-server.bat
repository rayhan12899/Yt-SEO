@echo off
title YouTube SEO Tools - Local Server
color 0A
echo.
echo  ====================================
echo   YouTube SEO Tools 2.0 - Server
echo  ====================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python found! Starting server...
    echo.
    echo  Open your browser and go to:
    echo  http://localhost:8080
    echo.
    echo  Press CTRL+C to stop the server.
    echo.
    python -m http.server 8080
    goto :end
)

REM Check Python3
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python3 found! Starting server...
    echo.
    echo  Open your browser and go to:
    echo  http://localhost:8080
    echo.
    python3 -m http.server 8080
    goto :end
)

REM Check Node.js / npx
npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Node.js found! Starting server...
    echo.
    echo  Open your browser and go to:
    echo  http://localhost:8080
    echo.
    npx http-server -p 8080 -o
    goto :end
)

echo  [ERROR] Python or Node.js not found!
echo.
echo  Please install one of these:
echo  - Python: https://www.python.org/downloads/
echo  - Node.js: https://nodejs.org/
echo.
pause
:end
