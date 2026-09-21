"""Guard the public-facing narrative against purchase-specific framing.

This checks copy and presentation, not the historical validity of source claims.
Run: python3 tests/editorial_copy.py
"""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
home_html = (ROOT / 'index.html').read_text()
html = home_html + '\n' + (ROOT / 'atlas/index.html').read_text()
data = json.loads((ROOT / 'src/content.json').read_text())
checks = []

class TextReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.omit = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('style', 'script'):
            self.omit += 1
    def handle_endtag(self, tag):
        if tag in ('style', 'script'):
            self.omit -= 1
    def handle_data(self, value):
        if not self.omit:
            self.parts.append(value)

reader = TextReader()
reader.feed(html)
visible_copy = re.sub(r'\s+', ' ', ' '.join(reader.parts))
all_copy = visible_copy + ' ' + json.dumps(data, ensure_ascii=False)

def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)

for pattern in [
    r'\byour\s+(?:(?:own|new|purchased|individual|specific)\s+)*(?:coin|owl|label|slab|purchase)\b',
    r'\bthe\s+range\s+on\s+your\s+label\b',
    r'\bvisitor[’\']s\s+coin\b',
    r'\bcommissioning\s+collector\b',
    r'\bwhat\s+the\s+label\s+cannot\s+tell\s+you\b',
    r'\bread\s+the\s+label\s+without\s+overreading\s+it\b',
]:
    check(not re.search(pattern, all_copy, flags=re.I), f'No purchase-specific framing: {pattern}')

check('An owl becomes an icon.' in visible_copy, 'Classical chapter uses general-interest framing')
check('The end of the Peloponnesian War'.upper() in visible_copy, '404 chapter is historically framed')
check('Follow the evidence.' in visible_copy, 'Evidence chapter is not label-centered')
check('THE RANGE ON YOUR LABEL' not in html, 'Personal specimen callout retired')
check('Mature fifth-century design' in all_copy, 'Classical comparison status is audience-neutral')
check('Understanding coin descriptions' in visible_copy, 'Catalogue literacy remains available')
check('class="reading-label' not in html, 'Prominent label-reading layout removed')
match = re.search(r'<details\b[^>]*\bid="coin-descriptions"[^>]*>', html)
check(bool(match), 'Reference guide is a native disclosure')
check(bool(match) and not re.search(r'\bopen\b', match.group()), 'Reference guide is collapsed by default')
for anchor in ['origins', 'first-owls', 'classical', '404', 'after-athens', 'new-style', 'beyond', 'evidence']:
    check(f'id="{anchor}"' in home_html, f'Preserved homepage chapter anchor: {anchor}')
check(data['edition'] == 'Research edition 03', 'Data edition updated')
check(len(data['sources']) == 43, 'All 41 earlier sources retained plus the two shareable-fact references')
check(len(data['images']) == 17, 'Original 16 image records retained plus the researched early-classical reverse')
check(len(data['specimens']) == 3, 'All three BnF specimens retained')
check(sum(i.get('reuseStatus') == 'review-pending' for i in data['images'].values()) == 6,
      'All six BnF reuse caveats retained')

report = {'result': 'pass', 'checks': len(checks), 'items': checks,
          'limitations': ['Editorial regression checks only; not a new source, rights or accessibility audit.']}
(ROOT / 'research/editorial-qa.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'PASS: {len(checks)} editorial copy checks.')
