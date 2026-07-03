# Common cloned/tutorial projects for comparison
COMMON_TUTORIAL_PROJECTS = [
    "MERN Chat Application",
    "Netflix Clone",
    "Twitter Clone",
    "Instagram Clone",
    "E-commerce Website",
    "Todo App",
    "Weather App",
    "Blog Platform",
    "Social Media Platform",
    "Video Streaming App",
    "Uber Clone",
    "Airbnb Clone",
    "Amazon Clone",
    "Spotify Clone",
    "Discord Clone",
    "Slack Clone",
    "GitHub Clone",
    "LinkedIn Clone",
    "Facebook Clone",
    "WhatsApp Clone",
    "Telegram Clone",
    "Google Drive Clone",
    "Dropbox Clone",
    "Trello Clone",
    "Notion Clone",
    "Figma Clone",
    "Canva Clone",
    "Medium Clone",
    "Dev.to Clone",
    "Stack Overflow Clone"
]

# Common company names for validation
MAJOR_COMPANIES = [
    "Google", "Meta", "Apple", "Amazon", "Microsoft", "Tesla", "Netflix",
    "Adobe", "Oracle", "Salesforce", "IBM", "Intel", "Nvidia", "Cisco",
    "JPMorgan", "Goldman Sachs", "McKinsey", "Boston Consulting Group",
    "Accenture", "Deloitte", "PwC", "EY", "KPMG", "LinkedIn", "Uber",
    "Airbnb", "Spotify", "Slack", "Dropbox", "Stripe", "Square", "Zoom"
]

def is_common_project(project_name):
    """Check if project description matches common cloned projects"""
    project_lower = project_name.lower()
    return any(clone.lower() in project_lower for clone in COMMON_TUTORIAL_PROJECTS)

def extract_year_from_text(text):
    """Extract 4-digit years from text"""
    import re
    years = re.findall(r'\b(19|20)\d{2}\b', text)
    return [int(year) for year in years]
