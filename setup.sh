#!/bin/bash
# Fraudulent Resume Detection System - macOS/Linux Setup Script

echo ""
echo "========================================"
echo "Fraudulent Resume Detector Setup"
echo "========================================"
echo ""

# Check Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3.8+ is required but not installed!"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 14+ is required but not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Python and Node.js detected"
echo ""
echo "Setting up ML Service..."
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m spacy download en_core_web_sm
deactivate
cd ..

echo ""
echo "Setting up Node.js Server..."
cd server
npm install
cd ..

echo ""
echo "Setting up React Client..."
cd client
npm install
cd ..

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "📌 To run the application, open 3 terminals:"
echo ""
echo "Terminal 1 - ML Service:"
echo "  cd ml-service"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Terminal 2 - Server:"
echo "  cd server"
echo "  npm start"
echo ""
echo "Terminal 3 - Client:"
echo "  cd client"
echo "  npm start"
echo ""
echo "🌐 Client will open at http://localhost:3000"
echo ""
