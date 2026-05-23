import os

files = {
    '.github/workflows/update-mentor-leaderboard.yml': '        uses: actions/checkout@v4\n        with:\n          persist-credentials: false\n          fetch-depth: 0',
    '.github/workflows/detect-ai-slop.yml': '        uses: actions/checkout@v4\n        with:\n          persist-credentials: false\n          ref: refs/pull/${{ github.event.pull_request.number }}/merge',
    '.github/workflows/leaderboard.yml': '        uses: actions/checkout@v4\n        with:\n          persist-credentials: false'
}

for path, new_checkout in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if path == '.github/workflows/update-mentor-leaderboard.yml':
        content = content.replace('        uses: actions/checkout@v4\n        with:\n          fetch-depth: 0', new_checkout)
    elif path == '.github/workflows/detect-ai-slop.yml':
        content = content.replace('        uses: actions/checkout@v4\n        with:\n          ref: refs/pull/${{ github.event.pull_request.number }}/merge', new_checkout)
    elif path == '.github/workflows/leaderboard.yml':
        content = content.replace('        uses: actions/checkout@v4\n', new_checkout + '\n')
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed', path)
