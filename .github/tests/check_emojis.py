import glob
import re

# We will just look for non-ASCII characters that might be emojis
def check_emojis():
    for fpath in glob.glob('.github/**/*.yml', recursive=True) + glob.glob('.github/scripts/*.js') + glob.glob('docs/*.md'):
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove emojis (quick hack: replace common emoji ranges)
            # or just find them
            emojis_found = 0
            new_content = ""
            for char in content:
                if char in ('🚀', '🏆', '👀', '⏳', '✨', '🛑', '⚠️', '🚨', '✅', '❌', '🤖'):
                    emojis_found += 1
                else:
                    new_content += char
            
            if emojis_found > 0:
                print(f'{fpath} has {emojis_found} emojis.')
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
        except Exception as e:
            pass

check_emojis()
