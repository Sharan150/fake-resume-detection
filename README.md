# 🔍 Fraudulent Resume Detection System

A comprehensive system to identify fake experience and cloned projects in resumes using ML-powered analysis.

## Architecture

The system consists of three main components:

- **ML Service** (Python Flask): Analyzes resume content using NLP and machine learning
- **Server** (Node.js/Express): Handles file uploads and orchestrates analysis
- **Client** (React): User-friendly interface with risk visualization

```
┌─────────────────────────────────────────────────────────────┐
│                     React Client                            │
│              (File Upload + Risk Meter UI)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js/Express Server                        │
│  (PDF Parsing, File Uploads, Route Orchestration)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Flask ML Service                        │
│   (NER, Text Embeddings, Risk Calculation)                  │
└─────────────────────────────────────────────────────────────┘
```

## Features

### ML Analysis Engine (app.py)

1. **Project Similarity Detection**
   - Compares project descriptions against 30+ common tutorial projects
   - Uses sentence-transformers (all-MiniLM-L6-v2) for semantic similarity
   - Flags projects matching tutorials like "Netflix Clone", "MERN Chat App", etc.

2. **Date Anomaly Detection**
   - Checks for work experience before graduation
   - Detects unrealistic experience timelines (>40 years)
   - Identifies future dates and inconsistencies
   - Validates graduation year against work history

3. **Company Legitimacy Check**
   - Extracts company names using spaCy NER
   - Compares against list of ~30 major known companies
   - Flags unknown/suspicious companies mentioned

4. **Risk Scoring**
   - **Project Similarity**: 40% weight
   - **Date Anomalies**: 35% weight  
   - **Company Legitimacy**: 25% weight
   - Final score: 0.0 (safe) to 1.0 (fraudulent)

### Server Features (server.js)

- PDF file upload with validation (10MB max)
- Text extraction from PDFs using pdf-parse
- Automatic project and graduation year extraction
- Direct text analysis endpoint (no file required)
- CORS enabled for frontend integration
- Error handling and timeout management

### Client Features (React)

- Drag-and-drop PDF upload
- Beautiful risk meter gauge with color coding
  - 🟢 Green (0-33%): Low Risk
  - 🟠 Orange (33-67%): Medium Risk
  - 🔴 Red (67-100%): High Risk
- Detailed analysis breakdown
- Red flags and warnings display
- Extracted company information
- Responsive design

## Project Structure

```
fake resume detector/
├── ml-service/
│   ├── app.py                 # Flask ML service
│   ├── models.py              # Helper functions & common projects data
│   └── requirements.txt        # Python dependencies
├── server/
│   ├── server.js              # Express server
│   ├── package.json           # Node.js dependencies
│   └── .env                   # Environment configuration
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── RiskMeter.js   # Risk gauge visualization
│   │       └── RiskMeter.css
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites

- **Python 3.8+** (for ML service)
- **Node.js 14+** (for server and client)
- **npm or yarn** (for JavaScript dependencies)

### Step 1: Python ML Service Setup

```bash
# Navigate to ml-service directory
cd ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy language model (required for NER)
python -m spacy download en_core_web_sm
```

### Step 2: Node.js Server Setup

```bash
# Navigate to server directory
cd server

# Install Node.js dependencies
npm install

# Verify .env file exists (default settings work for local development)
# If not present, create one with proper settings
```

### Step 3: React Client Setup

```bash
# Navigate to client directory
cd client

# Install React dependencies
npm install

# Build for production (optional)
# npm run build
```

## Running the Application

### Terminal 1: Start ML Service

```bash
cd ml-service

# Activate virtual environment (if not already active)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Start Flask server
python app.py
```

Expected output:
```
✅ Running on http://0.0.0.0:5000
📌 Available endpoints:
   - GET  /health
   - POST /calculate_risk
   - POST /analyze_projects
```

### Terminal 2: Start Node.js Server

```bash
cd server

# Start Express server
npm start
# or with nodemon for development:
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:4000

📌 Available endpoints:
   - GET  http://localhost:4000/health
   - POST http://localhost:4000/api/analyze (file upload)
   - POST http://localhost:4000/api/analyze-text (direct text)

🔗 ML Service URL: http://localhost:5000
```

### Terminal 3: Start React client

```bash
cd client

# Start development server
npm start
```

The client will automatically open at `http://localhost:3000`

## API Endpoints

### ML Service (Flask) - Port 5000

#### GET /health
Health check endpoint
```bash
curl http://localhost:5000/health
```

#### POST /calculate_risk
Calculate fraud risk for a resume

**Request:**
```json
{
  "resume_text": "Full resume text here...",
  "graduation_year": "2020",
  "project_descriptions": [
    "Built a Netflix Clone with React and Firebase",
    "Created a TODO app using MERN stack"
  ]
}
```

**Response:**
```json
{
  "risk_score": 0.65,
  "details": {
    "project_similarity": 0.72,
    "date_anomalies": 0.3,
    "company_legitimacy": 0.15
  },
  "red_flags": [
    "Project 'Netflix Clone' is highly similar to common tutorial projects",
    "Resume mentions well-known tutorial project: Netflix Clone"
  ],
  "extracted_companies": ["Google", "Meta"],
  "resume_length": 5432
}
```

#### POST /analyze_projects
Analyze individual projects for similarity

**Request:**
```json
{
  "projects": [
    "Netflix Clone with React",
    "Custom E-commerce Platform"
  ]
}
```

**Response:**
```json
{
  "projects": [
    {
      "project": "Netflix Clone with React",
      "similarity_score": 0.82,
      "is_suspicious": true
    },
    {
      "project": "Custom E-commerce Platform",
      "similarity_score": 0.21,
      "is_suspicious": false
    }
  ]
}
```

### Server (Express) - Port 4000

#### GET /health
Server health check

#### POST /api/analyze
Upload and analyze PDF resume

**Request:** 
```bash
curl -X POST -F "resume=@path/to/resume.pdf" http://localhost:4000/api/analyze
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "risk_score": 0.65,
    "risk_level": "Medium",
    "details": {...},
    "red_flags": [...],
    "extracted_info": {
      "companies": ["Google", "Meta"],
      "projects_analyzed": 3,
      "graduation_year": "2020",
      "resume_length": 5432
    }
  }
}
```

#### POST /api/analyze-text
Analyze resume text directly (no file upload)

**Request:**
```json
{
  "resume_text": "Full resume text...",
  "graduation_year": "2020",
  "projects": ["Project 1", "Project 2"]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {...}
}
```

## Common Tutorial Projects Detected

The system flags these common cloned projects:

Email, Netflix Clone, Twitter Clone, Instagram Clone, E-commerce Website, Todo App, Weather App, Blog Platform, Social Media Platform, Video Streaming App, Uber Clone, Airbnb Clone, Amazon Clone, Spotify Clone, Discord Clone, Slack Clone, GitHub Clone, LinkedIn Clone, Facebook Clone, WhatsApp Clone, Telegram Clone, Google Drive Clone, Dropbox Clone, Trello Clone, Notion Clone, Figma Clone, Canva Clone, Medium Clone, Dev.to Clone, Stack Overflow Clone

## Troubleshooting

### Port Already in Use
If a port is already in use:
- Flask (5000): `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)
- Express (4000): `netstat -ano | findstr :4000` (Windows) or `lsof -i :4000` (Mac/Linux)
- React (3000): Kill it via Task Manager or `lsof -i :3000` (Mac/Linux)

### "ML service unavailable" Error
- Ensure Flask service is running on port 5000
- Check that `python -m spacy download en_core_web_sm` was executed
- Verify no firewall is blocking localhost communication

### "Only PDF files allowed" Error
- Ensure you're uploading a valid PDF file
- Check file size is under 10MB

### ImportError for sentence-transformers
```bash
pip install --upgrade sentence-transformers
```

### spaCy Model Not Found
```bash
python -m spacy download en_core_web_sm
```

## Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=4000

# ML Service Configuration
ML_SERVICE_URL=http://localhost:5000

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads
```

## Performance Notes

- **First Request**: May take 5-10 seconds as models load into memory
- **Subsequent Requests**: <2 seconds typical
- **PDF Processing**: Depends on file size and complexity
- **Model Size**: ~500MB for sentence-transformers + spaCy models

## Security Notes

- The system is designed for local development
- For production:
  - Add authentication (JWT)
  - Implement rate limiting
  - Use HTTPS
  - Validate all inputs
  - Implement file scanning
  - Use environment-based configuration

## Future Enhancements

- [ ] Database integration for storing analysis history
- [ ] User authentication and role-based access
- [ ] Advanced NLP for detecting GPT-written resumes
- [ ] Integration with LinkedIn/GitHub APIs for real verification
- [ ] Batch processing for multiple resumes
- [ ] Download analysis reports as PDF
- [ ] Real-time notifications for high-risk resumes
- [ ] Custom whitelist for legitimate projects

## License

MIT License - Feel free to use and modify

## Support

For issues or questions, please create an issue or contact the development team.

---

**Made with ❤️ for fraud detection**
