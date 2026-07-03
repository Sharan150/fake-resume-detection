const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});


/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
    throw new Error('Failed to parse PDF file');
  }
}


/**
 * Extract projects from resume text (simple heuristic approach)
 */
function extractProjects(text) {
  const projects = [];
  
  // Look for common project section headers
  const projectSectionRegex = /(?:projects?|work\s+samples?|portfolio|projects?:)([\s\S]*?)(?:education|experience|skills|references|$)/i;
  const match = text.match(projectSectionRegex);
  
  if (match && match[1]) {
    const projectText = match[1];
    // Split by line breaks and filter
    const lines = projectText.split('\n').filter(line => line.trim().length > 10);
    
    for (const line of lines) {
      if (line.trim().length > 15 && line.trim().length < 500) {
        projects.push(line.trim());
      }
    }
  }
  
  return projects.slice(0, 10); // Return max 10 projects
}


/**
 * Extract graduation year from resume text
 */
function extractGraduationYear(text) {
  // Look for "graduated XXXX" or "class of XXXX" or "XXXX - B.S."
  const patterns = [
    /(?:graduated|graduation|class of)\s+(\d{4})/i,
    /(\d{4})\s*-\s*(?:B\.|M\.|Ph\.D|Bachelor|Master)/i,
    /(?:B\.|M\.).*?(\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1]);
      if (year >= 1980 && year <= new Date().getFullYear()) {
        return year.toString();
      }
    }
  }
  
  return null;
}


/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'resume-detector-server' });
});


/**
 * Upload and analyze resume
 */
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${req.file.filename}`);

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(req.file.path);
    
    // Extract information from resume
    const projects = extractProjects(resumeText);
    const graduationYear = extractGraduationYear(resumeText);

    console.log(`Extracted ${projects.length} projects and graduation year: ${graduationYear}`);

    // Send to ML service for analysis
    const mlPayload = {
      resume_text: resumeText,
      graduation_year: graduationYear || '',
      project_descriptions: projects
    };

    console.log('Sending to ML service:', ML_SERVICE_URL);

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/calculate_risk`, mlPayload, {
      timeout: 30000
    });

    const riskData = mlResponse.data;

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    // Return analysis result
    res.json({
      success: true,
      analysis: {
        risk_score: riskData.risk_score,
        risk_level: riskData.risk_score > 0.7 ? 'High' : riskData.risk_score > 0.4 ? 'Medium' : 'Low',
        details: riskData.details,
        red_flags: riskData.red_flags,
        extracted_info: {
          companies: riskData.extracted_companies,
          projects_analyzed: projects.length,
          graduation_year: graduationYear,
          resume_length: riskData.resume_length
        }
      }
    });

  } catch (error) {
    console.error('Error processing resume:', error.message);

    // Clean up file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    if (error.message.includes('Only PDF files')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'ML service unavailable. Make sure the Python Flask service is running on port 5000.' 
      });
    }

    res.status(500).json({ error: error.message });
  }
});


/**
 * Direct text analysis endpoint (no file upload)
 */
app.post('/api/analyze-text', async (req, res) => {
  try {
    const { resume_text, graduation_year, projects } = req.body;

    if (!resume_text) {
      return res.status(400).json({ error: 'resume_text is required' });
    }

    const mlPayload = {
      resume_text,
      graduation_year: graduation_year || '',
      project_descriptions: projects || []
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/calculate_risk`, mlPayload, {
      timeout: 30000
    });

    const riskData = mlResponse.data;

    res.json({
      success: true,
      analysis: {
        risk_score: riskData.risk_score,
        risk_level: riskData.risk_score > 0.7 ? 'High' : riskData.risk_score > 0.4 ? 'Medium' : 'Low',
        details: riskData.details,
        red_flags: riskData.red_flags
      }
    });

  } catch (error) {
    console.error('Error analyzing text:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'ML service unavailable. Make sure the Python Flask service is running on port 5000.' 
      });
    }

    res.status(500).json({ error: error.message });
  }
});


/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});


/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📌 Available endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze (file upload)`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-text (direct text)`);
  console.log(`\n🔗 ML Service URL: ${ML_SERVICE_URL}`);
  console.log('Make sure the Python Flask ML service is running!\n');
});

module.exports = app;
