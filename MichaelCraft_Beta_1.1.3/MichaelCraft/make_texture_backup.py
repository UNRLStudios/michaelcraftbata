# Refreshes the backup copy of the textures that's baked into index.html.
# Run it after you change any texture:  python make_texture_backup.py
# (The game always uses the real files in Textures/ when it can reach them;
#  the backup is only for when it can't, e.g. opened from a phone's file manager.)
import os, base64, json, re
here = os.path.dirname(os.path.abspath(__file__)); os.chdir(here)
B = {}
for root, _, files in os.walk('Textures'):
    if '_originals' in root: continue
    for f in files:
        if f.lower().endswith('.png'):
            p = os.path.join(root, f).replace(os.sep, '/')
            B[p] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
html = open('index.html', encoding='utf-8').read()
new = 'window.TEXTURE_BUNDLE = ' + json.dumps(B, separators=(',', ':')) + ';'
html, n = re.subn(r'window\.TEXTURE_BUNDLE = \{.*?\};', lambda m: new, html, count=1, flags=re.S)
open('index.html', 'w', encoding='utf-8').write(html)
print('Backed up', len(B), 'textures' if n else '(could not find the backup in index.html!)')
