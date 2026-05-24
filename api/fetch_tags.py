import json
import urllib.request
import urllib.parse
import traceback

def get_gfi_tech_stack(repo_name):
    tech_keywords = [
        'python', 'javascript', 'typescript', 'react', 'node', 
        'html', 'css', 'go', 'rust', 'docker', 'java', 'c++', 
        'backend', 'frontend'
    ]
    
    query = f'repo:{repo_name} label:"good first issue" state:open'
    encoded_query = urllib.parse.quote(query)
    url = f'https://api.github.com/search/issues?q={encoded_query}&per_page=30'
    req = urllib.request.Request(url, headers={'User-Agent': 'gsoc-org-finder'})
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())   
            total_count = data.get('total_count', 0)
            detected_tags = set()
            
            for issue in data.get('items', []):
                label_names = [str(l.get('name', '')).lower() for l in issue.get('labels', [])]
                
                for tech in tech_keywords:
                    if any(tech in name for name in label_names):
                        detected_tags.add(tech)
          
            return {
                "count": total_count,
                "tags": list(detected_tags)
            }
            
    except Exception:
        traceback.print_exc()
        return {"count": 0, "tags": []}

if __name__ == "__main__":
    test_repo = "facebook/react"
    hasil = get_gfi_tech_stack(test_repo)
    print(json.dumps(hasil, indent=4))