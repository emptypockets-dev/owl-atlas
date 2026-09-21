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
# "A familiar owl, a changing Athens" was removed on 21 September 2026 at the
# owner's request. Its fourth-century reading moved into the close reading; its
# specimens, presets and caveats moved to /atlas/. "The owl takes shape" was
# removed the same day: its archaic and early classical plates stay on /atlas/,
# and what it argued is now the classical chapter's opening deck, one clause in
# the close reading, and a glossary entry.
for anchor in ['origins', 'classical', '404', 'new-style', 'beyond', 'evidence']:
    check(f'id="{anchor}"' in home_html, f'Preserved homepage chapter anchor: {anchor}')
check('id="after-athens"' not in home_html, 'The withdrawn fourth-century chapter is gone')
check('id="first-owls"' not in home_html, 'The withdrawn early-owls chapter is gone')
# What that chapter carried alone keeps a home, briefly and in one place each.
check('Wappenm\u00fcnzen' in visible_copy, 'The heraldic-coin note opens the classical chapter')
check('#family-archaic' in home_html, 'The earliest owls stay one link away')
check('c. 520\u2013510 BCE' in all_copy, 'The archaic frontal eye survives in the close reading')
check(any(term == 'Transitional' for term, *_ in data['glossary']),
      'The two senses of "transitional" survive in the glossary')
check('id="close-reading"' in home_html, 'The chapter 02 close reading is restored')
for reading in data['closeReading']['readings']:
    check(f'id="close-reading-{reading["id"]}"' in home_html, f'Close reading is in the document: {reading["id"]}')
    check(reading['title'] in visible_copy, f'Close reading is readable without JavaScript: {reading["id"]}')
check(data['closeReading']['coda']['links'][0]['href'] == '/atlas/?compare=pi-pair#atlas'
      and data['closeReading']['coda']['links'][1]['href'] == '/atlas/?compare=late-bridge#atlas',
      'Both comparison presets stay reachable from the story')
# The statements the withdrawn chapter carried alone keep a visible home.
check('A classification is not a date.' in visible_copy, 'The Pi II dating caveat survives on /atlas/')
check('Heterogeneous Group C' in all_copy, 'The heterogeneous third-century groups survive on /atlas/')
check('SOURCED IMAGES / REUSE REVIEW PENDING' in visible_copy,
      'The BnF reuse notice stays where those photographs are shown')
check(data['edition'] == 'Research edition 03', 'Data edition updated')
check(len(data['sources']) == 50, 'All 41 earlier sources retained plus the nine shareable-fact references')
check(len(data['images']) == 17, 'Original 16 image records retained plus the researched early-classical reverse')
check(len(data['specimens']) == 3, 'All three BnF specimens retained')
check(sum(i.get('reuseStatus') == 'review-pending' for i in data['images'].values()) == 6,
      'All six BnF reuse caveats retained')

report = {'result': 'pass', 'checks': len(checks), 'items': checks,
          'limitations': ['Editorial regression checks only; not a new source, rights or accessibility audit.']}
(ROOT / 'research/editorial-qa.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'PASS: {len(checks)} editorial copy checks.')
