import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      if (files[0].type === 'application/pdf') {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await axios.post('/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to analyze resume. Make sure both servers are running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Resume Fraud Detector</h1>
        <p>Analyze resumes for fraudulent claims and cloned projects</p>
      </header>

      <main className="main">
        {!analysis ? (
          <div className="upload-card">
            <h2>Upload Resume</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {file ? `Selected: ${file.name}` : 'Choose PDF File'}
              </label>

              <button
                type="submit"
                disabled={loading || !file}
                className="submit-btn"
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </form>

            {error && <div className="error">{error}</div>}
          </div>
        ) : (
          <div className="results-card">
            <h2>Analysis Results</h2>

            <div className="risk-box">
              <div className="risk-score-display">
                <div className="score-number">{(analysis.risk_score * 100).toFixed(1)}%</div>
                <div className={`risk-badge ${analysis.risk_level.toLowerCase()}`}>
                  {analysis.risk_level} Risk
                </div>
              </div>
            </div>

            <div className="metrics">
              <div className="metric">
                <h3>Project Similarity</h3>
                <div className="metric-value">{(analysis.details.project_similarity * 100).toFixed(1)}%</div>
                <p>Similarity to tutorial projects</p>
              </div>
              <div className="metric">
                <h3>Date Anomalies</h3>
                <div className="metric-value">{(analysis.details.date_anomalies * 100).toFixed(1)}%</div>
                <p>Timeline inconsistencies</p>
              </div>
              <div className="metric">
                <h3>Company Legitimacy</h3>
                <div className="metric-value">{(analysis.details.company_legitimacy * 100).toFixed(1)}%</div>
                <p>Unknown companies</p>
              </div>
            </div>

            {analysis.red_flags && analysis.red_flags.length > 0 && (
              <div className="red-flags">
                <h3>Red Flags</h3>
                <ul>
                  {analysis.red_flags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="extracted">
              <h3>Extracted Information</h3>
              <div className="info-items">
                <div className="info-item">
                  <span className="label">Graduation Year:</span>
                  <span className="value">{analysis.extracted_info.graduation_year || 'Not found'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Projects Analyzed:</span>
                  <span className="value">{analysis.extracted_info.projects_analyzed}</span>
                </div>
                <div className="info-item">
                  <span className="label">Companies Found:</span>
                  <span className="value">{analysis.extracted_info.companies.length}</span>
                </div>
                <div className="info-item">
                  <span className="label">Resume Length:</span>
                  <span className="value">{analysis.extracted_info.resume_length} characters</span>
                </div>
              </div>

              {analysis.extracted_info.companies.length > 0 && (
                <div className="companies">
                  <strong>Companies Mentioned:</strong>
                  <p>{analysis.extracted_info.companies.join(', ')}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setAnalysis(null);
                setFile(null);
              }}
              className="reset-btn"
            >
              Analyze Another Resume
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

