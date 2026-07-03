@echo off
REM Fraudulent Resume Detection System - Windows Setup Script

echo.
echo ========================================
echo Fraudulent Resume Detector Setup
echo ========================================
echo.

REM Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3.8+ is required but not installed!
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js is installed  
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 14+ is required but not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Python and Node.js detected
echo.
echo Setting up ML Service...
cd ml-service
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd ..

echo.
echo Setting up Node.js Server...
cd server
call npm install
cd ..

echo.
echo Setting up React Client...
cd client
call npm install
cd ..

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo 📌 To run the application, open 3 terminals:
echo.
echo Terminal 1 - ML Service:
echo   cd ml-service
echo   venv\Scripts\activate
echo   python app.py
echo.
echo Terminal 2 - Server:
echo   cd server
echo   npm start
echo.
echo Terminal 3 - Client:
echo   cd client
echo   npm start
echo.
echo 🌐 Client will open at http://localhost:3000
echo.
pause
