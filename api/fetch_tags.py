"""
fetch_tags.py - Backend Automation Helper for GSoC Org Finder

Purpose:
    Assists users in discovering "Good First Issues" tailored to their 
    specifically requested programming languages or tech stacks.

Functionality:
    Automatically queries the GitHub Search API to fetch the latest "Good First Issues" 
    from a repository, then filters and extracts the relevant technology tags.

How to Run:
    python3 api/fetch_tags.py

Output:
    Generates or returns a structured data payload containing:
    {
        "count": total_open_issues,
        "tags": ["list", "of", "detected", "tech", "stacks"]
    }
"""

import json
import urllib.request
import urllib.parse
import traceback

def get_gfi_tech_stack(repo_name):
    # 1. Define target technologies and categories to filter
    tech_keywords = [
        'python', 'javascript', 'typescript', 'react', 'node', 
        'html', 'css', 'go', 'rust', 'docker', 'java', 'c++', 
        'backend', 'frontend'
    ]
    
    # 2. Setup the search query parameters for GitHub API
    query = f'repo:{repo_name} label:"good first issue" state:open'
    encoded_query = urllib.parse.quote(query)
    url = f'https://api.github.com/search/issues?q={encoded_query}&per_page=30'
    
    # 3. Construct the HTTP request payload with a custom User-Agent header
    req = urllib.request.Request(url, headers={'User-Agent': 'gsoc-org-finder'})
    
    try:
        # Open an automated network stream using a secure Context Manager
        with urllib.request.urlopen(req) as response:
            # Safely parse raw binary stream into a clean Python dictionary
            data = json.loads(response.read().decode())
            
            # Safely retrieve the issue metrics with a fallback value
            total_count = data.get('total_count', 0)
            detected_tags = set()
            
            # 4. Multi-layered structural filtering to isolate tech labels
            if 'items' in data:
                for issue in data['items']:
                    if 'labels' in issue:
                        for label in issue['labels']:
                            label_name = label['name'].lower()
                            
                            # Match found labels against our defined tech keywords
                            for tech in tech_keywords:
                                if tech in label_name:
                                    detected_tags.add(tech)
            
            # 5. Serve the clean payload transformed back into standard JSON format
            return {
                "count": total_count,
                "tags": list(detected_tags)
            }
            
    except Exception as e:
        # Graceful degradation: capture trace metrics internally without crashing production
        print("=== BACKEND ERROR DETECTED ===")
        traceback.print_exc()
        print("==============================")
        return {"count": 0, "tags": []}

# Local sandbox testing execution block
if __name__ == "__main__":
    test_repo = "facebook/react"
    hasil = get_gfi_tech_stack(test_repo)
    print(json.dumps(hasil, indent=4))

