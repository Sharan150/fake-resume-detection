from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from models import COMMON_TUTORIAL_PROJECTS, MAJOR_COMPANIES, is_common_project, extract_year_from_text
import numpy as np
from datetime import datetime
from difflib import SequenceMatcher

app = Flask(__name__)
CORS(app)

# Load spacy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("Warning: spacy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None


def simple_similarity(text1, text2):
    """Simple text similarity using SequenceMatcher"""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def calculate_project_similarity(project_description):
    """
    Calculate similarity to common cloned projects using simple string matching
    Returns a score between 0 and 1 (higher = more similar to tutorial projects)
    """
    if not project_description or len(project_description.strip()) < 5:
        return 0.0
    
    max_similarity = 0.0
    for common_project in COMMON_TUTORIAL_PROJECTS:
        sim = simple_similarity(project_description, common_project)
        max_similarity = max(max_similarity, sim)
    
    return min(max_similarity, 1.0)


def extract_entities(text):
    """Extract companies and dates using spacy NER"""
    if not nlp:
        return [], []
    
    doc = nlp(text)
    companies = []
    dates = []
    
    for ent in doc.ents:
        if ent.label_ == "ORG":
            companies.append(ent.text)
        elif ent.label_ == "DATE":
            dates.append(ent.text)
    
    return companies, dates


def check_date_anomalies(resume_text, graduation_year):
    """
    Check for logical anomalies in dates
    Returns a score between 0 and 1 (higher = more anomalies)
    """
    anomaly_score = 0.0
    current_year = datetime.now().year
    
    try:
        grad_year = int(graduation_year)
    except:
        return 0.0
    
    # Extract all years from resume
    years = extract_year_from_text(resume_text)
    
    if not years:
        return 0.0
    
    # Check for work experience before graduation
    work_years = [y for y in years if y < grad_year and y > grad_year - 20]
    if work_years:
        anomaly_score += 0.3  # Experience before graduation
    
    # Check for unrealistic dates (more than 40 years of experience)
    oldest_year = min(years)
    if grad_year - oldest_year > 40:
        anomaly_score += 0.3
    
    # Check for future dates
    future_years = [y for y in years if y > current_year]
    if future_years:
        anomaly_score += 0.2
    
    # Check for graduation year being recent but claiming old experience
    if grad_year > current_year - 5 and (grad_year - oldest_year) > 15:
        anomaly_score += 0.2
    
    return min(anomaly_score, 1.0)


def check_company_legitimacy(companies_list):
    """
    Check if mentioned companies are real/major companies
    Returns a score (higher = more suspicious, less known companies)
    """
    if not companies_list:
        return 0.0
    
    unknown_count = sum(1 for company in companies_list 
                       if company not in MAJOR_COMPANIES and len(company) < 50)
    
    # Lower score = more known companies = less suspicious
    return min(unknown_count / len(companies_list), 1.0) * 0.2


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route('/calculate_risk', methods=['POST'])
def calculate_risk():
    """
    Calculate fraud risk score for a resume
    
    Expected JSON payload:
    {
        "resume_text": "full resume text",
        "graduation_year": "2020",
        "project_descriptions": ["project 1 desc", "project 2 desc", ...]
    }
    
    Returns:
    {
        "risk_score": 0.0-1.0,
        "details": {
            "project_similarity": 0.0-1.0,
            "date_anomalies": 0.0-1.0,
            "company_legitimacy": 0.0-1.0,
            "red_flags": [list of detected issues]
        }
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
    
    resume_text = data.get('resume_text', '')
    graduation_year = data.get('graduation_year', '')
    project_descriptions = data.get('project_descriptions', [])
    
    if not resume_text:
        return jsonify({"error": "resume_text is required"}), 400
    
    red_flags = []
    
    # 1. Check project similarity to common clones
    project_similarity_scores = []
    for project in project_descriptions:
        score = calculate_project_similarity(project)
        project_similarity_scores.append(score)
        if score > 0.7:
            red_flags.append(f"Project '{project[:50]}...' is highly similar to common tutorial projects")
    
    project_similarity = np.mean(project_similarity_scores) if project_similarity_scores else 0.0
    
    # 2. Check date anomalies
    date_anomaly_score = check_date_anomalies(resume_text, graduation_year)
    if date_anomaly_score > 0.3:
        red_flags.append("Suspicious date patterns detected in experience timeline")
    
    # 3. Extract and check company legitimacy
    companies, dates = extract_entities(resume_text)
    company_legitimacy_score = check_company_legitimacy(companies)
    if company_legitimacy_score > 0.3:
        red_flags.append("Resume mentions unknown or suspicious companies")
    
    # 4. Check for common cloned projects in text
    for project in COMMON_TUTORIAL_PROJECTS:
        if project.lower() in resume_text.lower():
            red_flags.append(f"Resume mentions well-known tutorial project: {project}")
    
    # Calculate weighted risk score
    risk_score = (
        0.4 * project_similarity +      # Project similarity: 40%
        0.35 * date_anomaly_score +     # Date anomalies: 35%
        0.25 * company_legitimacy_score # Company legitimacy: 25%
    )
    
    risk_score = min(risk_score, 1.0)
    
    return jsonify({
        "risk_score": round(risk_score, 3),
        "details": {
            "project_similarity": round(project_similarity, 3),
            "date_anomalies": round(date_anomaly_score, 3),
            "company_legitimacy": round(company_legitimacy_score, 3)
        },
        "red_flags": red_flags,
        "extracted_companies": companies[:10],  # Return first 10 companies
        "resume_length": len(resume_text)
    }), 200


@app.route('/analyze_projects', methods=['POST'])
def analyze_projects():
    """Analyze individual projects"""
    data = request.get_json()
    
    if not data or 'projects' not in data:
        return jsonify({"error": "projects array is required"}), 400
    
    projects = data.get('projects', [])
    results = []
    
    for project in projects:
        similarity = calculate_project_similarity(project)
        results.append({
            "project": project[:100],
            "similarity_score": round(similarity, 3),
            "is_suspicious": similarity > 0.7
        })
    
    return jsonify({"projects": results}), 200


if __name__ == '__main__':
    print("Starting Flask ML Service...")
    print("Models loaded. Available endpoints:")
    print("  - GET  /health")
    print("  - POST /calculate_risk")
    print("  - POST /analyze_projects")
    app.run(host='0.0.0.0', port=5000, debug=True)
