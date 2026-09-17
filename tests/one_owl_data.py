"""Check the companion's evidence, original photograph bytes and deploy output.

Run after npm run build:deploy: python3 tests/one_owl_data.py
Uses only the standard library. Does not authenticate the coin, verify external
research independently, or substitute for hosted image and browser checks.
"""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import re

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = 'https://theowlatlas.com/one-owl/'
# Independently recorded from the four owner-supplied originals, 17 Sep 2026.
ORIGINALS = {
    'owner-athena': ('bcb5410fae9d60fe7b2cbbf26802089c269d337eb76abc4ae1b132c0114ec492', 960, 1280),
    'owner-owl': ('8b370dcbfaf06128dcb705c65b0411d48e9ad9fa24a45076152fb8dfdf5a4d72', 960, 1280),
    'owner-holder-obverse': ('dcaa724150ecb275e34b938628d6261f6a3976e38e05691900ccefbcb2bbb1cb', 968, 1280),
    'owner-holder-reverse': ('71db37d43503a3a2d5a0d93a4e42cf358e8d54c58244edb609c98c60f9230aa2', 962, 1280),
}
checks = []


def check(condition, message):
    if not condition:
        raise AssertionError(message)
    checks.append(message)


def jpeg_dimensions(content):
    """Read the JPEG frame without decoding or relying on EXIF dimensions."""
    if content[:2] != b'\xff\xd8':
        raise ValueError('Not a JPEG')
    offset = 2
    while offset < len(content):
        if content[offset] != 0xff:
            raise ValueError('Invalid JPEG marker')
        while content[offset] == 0xff:
            offset += 1
        marker = content[offset]
        offset += 1
        if marker in (0xda, 0xd9):
            break
        if marker == 0x01 or 0xd0 <= marker <= 0xd8:
            continue
        length = int.from_bytes(content[offset:offset + 2], 'big')
        segment = content[offset + 2:offset + length]
        if marker in (0xc0, 0xc1, 0xc2):
            return (int.from_bytes(segment[3:5], 'big'),
                    int.from_bytes(segment[1:3], 'big'))
        offset += length
    raise ValueError('No JPEG frame found')


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = []
        self.parts = []
        self.omit = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))
        if tag in ('script', 'style'):
            self.omit += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.omit -= 1

    def handle_data(self, value):
        if not self.omit:
            self.parts.append(value)


def inline_data(html):
    match = re.search(r'<script\b[^>]*\bid="atlas-data"[^>]*>([\s\S]*?)</script>', html)
    check(bool(match), 'Built page contains viewer data')
    return json.loads(match[1])


atlas = json.loads((ROOT / 'src/content.json').read_text())
journey = json.loads((ROOT / 'src/one-owl.json').read_text())
main_html = (ROOT / 'index.html').read_text()
html = (ROOT / 'one-owl/index.html').read_text()
document = Document(html)
main_data = inline_data(main_html)
page_data = inline_data(html)
text = re.sub(r'\s+', ' ', ' '.join(document.parts))
ids = [attrs['id'] for _, attrs in document.elements if attrs.get('id')]

check(len(atlas['images']) == 17, 'The 17 atlas photographs remain a separate collection')
check(sum(i.get('reuseStatus') == 'review-pending' for i in atlas['images'].values()) == 6,
      'All six original unresolved reuse flags remain')
check(set(journey['images']) == set(ORIGINALS), 'Companion has exactly the four supplied photos')
check(not (set(main_data['images']) & set(ORIGINALS)), 'Owner photos are absent from main viewer data')
check(set(page_data['images']) == set(atlas['images']) | set(ORIGINALS),
      'Companion viewer includes the original atlas and four owner records')
check(not any(source['id'].startswith('journey-') for source in main_data['sources']),
      'Personal source records remain outside the main bibliography')

for image_id, (digest, width, height) in ORIGINALS.items():
    image = journey['images'][image_id]
    local = image['localUrl']
    check(bool(re.fullmatch(r'public/images/[a-zA-Z0-9_-]+\.jpg', local)), f'{image_id}: safe local asset path')
    content = (ROOT / local).read_bytes()
    check(sha256(content).hexdigest() == digest == image['sha256'], f'{image_id}: original JPEG preserved')
    check(jpeg_dimensions(content) == (width, height) == (image['width'], image['height']),
          f'{image_id}: real JPEG dimensions match metadata')
    check((ROOT / 'dist' / local).read_bytes() == content, f'{image_id}: deployed bytes match original')
    check(image['reuseStatus'] == 'owner-permission' and 'MIT' in image['rightsNote'],
          f'{image_id}: scoped permission and software-license exclusion retained')
    check(image['credit'] == 'Photographs courtesy of the owner', f'{image_id}: anonymous credit retained')
    check(image['crop'] == 'none', f'{image_id}: complete original remains available')
    viewer_url = urljoin(CANONICAL, page_data['images'][image_id]['localUrl'])
    check(viewer_url == image['url'], f'{image_id}: nested-page viewer resolves the published original')

photos = [attrs for tag, attrs in document.elements if tag == 'img' and attrs.get('src')]
expected_paths = {urlsplit(image['url']).path for image in journey['images'].values()}
check(len(photos) == 4, 'Four photograph elements appear in the static story')
for photo in photos:
    url = urlsplit(urljoin(CANONICAL, photo['src']))
    check(url.netloc == 'theowlatlas.com' and url.path in expected_paths,
          'Every embedded photo is a supplied original, never an NGC or auction-house image')
    check(bool(photo.get('alt')), 'Every photograph has alternative text')

coin = journey['coin']
check(coin['certificate'] == '2086328-049' and coin['weightG'] == 17.21,
      'Specimen certificate and weight agree with the supplied label')
check((coin['grade'], coin['strike'], coin['surface']) == ('MS', 4, 4),
      'NGC grade and separate strike/surface scores are preserved')
check(coin['gradeDate'] == '2018-10-12', 'NGC record date is preserved')
model = journey['generationModel']
elapsed = sorted(model['asOfYear'] + year - 1 for year in coin['mintYearBceRange'])
check(model['asOfYear'] == 2026 and elapsed == model['elapsedYears'] == [2429, 2465],
      'BCE-to-CE elapsed range excludes year zero')
years = sorted(model['yearsPerGeneration'])
generation_range = (elapsed[0] / years[-1], elapsed[-1] / years[0])
check(years == [25, 30] and 80 < generation_range[0] < 82 and 98 < generation_range[1] < 100,
      'Illustrative generation calculation uses both ends of both ranges')
check(model['roundedGenerations'] == [80, 100], 'Rounded generation range encloses the calculation')
check('not a count of owners' in model['meaning'] and 'not a count of owners' in text,
      'Elapsed generations are explicitly distinguished from ownership')
marks = re.search(r'<div class="journey-generation-marks"[^>]*>(.*?)</div>', html, re.S)
check(bool(marks) and len(re.findall(r'<span\b', marks[1])) == 100
      and marks[1].count('class="range-end"') == 20,
      'Generation illustration shows 80 solid marks and 20 range marks')

check(len(journey['sources']) == 6 and len(journey['sourceIds']) == 8,
      'Six specimen/context sources and two existing atlas references are retained')
source_lookup = {source['id']: source for source in page_data['sources']}
for source_id in journey['sourceIds']:
    check(source_id in source_lookup and f'source-{source_id}' in ids,
          f'{source_id}: source resolves in this page’s bibliography')
citations = [attrs for tag, attrs in document.elements if tag == 'a' and attrs.get('data-source')]
for citation in citations:
    check(citation['href'] == f'#source-{citation["data-source"]}'
          and citation['data-source'] in journey['sourceIds'], 'Citation has a local source target')
check(len(ids) == len(set(ids)), 'Page anchors are unique')
check(sum(tag == 'h1' for tag, _ in document.elements) == 1, 'Companion has one main heading')
for tag, attrs in document.elements:
    # Native dialog links use a bare # until an image/source is selected.
    if tag == 'a' and attrs.get('href', '').startswith('#') and len(attrs['href']) > 1:
        check(unquote(attrs['href'][1:]) in ids, f'Local link resolves: {attrs["href"]}')
check(any(tag == 'link' and attrs.get('rel') == 'canonical' and attrs.get('href') == CANONICAL
          for tag, attrs in document.elements), 'Companion has its own canonical URL')
check(any(tag == 'meta' and attrs.get('property') == 'og:url' and attrs.get('content') == CANONICAL
          for tag, attrs in document.elements), 'Social metadata points to the companion route')
check(CANONICAL in (ROOT / 'dist/sitemap.xml').read_text(), 'Published sitemap includes the companion')
check(any(tag == 'a' and urljoin('https://theowlatlas.com/', attrs.get('href', '')) == CANONICAL
          for tag, attrs in Document(main_html).elements), 'Main story links to the companion')
check((ROOT / 'dist/one-owl/index.html').read_text() == html, 'Deploy output contains the rebuilt companion')
check((ROOT / 'dist/pricing/index.html').read_bytes() == (ROOT / 'pricing/index.html').read_bytes(),
      'Detailed pricing page remains in deployment output')
check(json.loads((ROOT / 'research/one-owl-manifest.json').read_text()) == journey,
      'Exported companion evidence manifest matches canonical data')
check('{{' not in html, 'No unresolved template token remains')
print(f'PASS: {len(checks)} companion evidence, photograph-integrity and deployment checks.')
