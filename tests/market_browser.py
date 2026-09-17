"""Market interactions and responsive regression checks; external images blocked.

Optional Python Playwright + Chromium, like browser_smoke.py. The hosted run
additionally checks that HTML and downloadable observations match the build.
"""
from pathlib import Path
import csv, io, json, os, functools, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'dist/pricing/index.html').read_text()
DATA = json.loads((ROOT / 'src/content.json').read_text())
URL = os.environ.get('MARKET_URL')
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = None
if not URL:
    server = ThreadingHTTPServer(('127.0.0.1',0), functools.partial(QuietHandler,directory=str(ROOT/'dist')))
    threading.Thread(target=server.serve_forever,daemon=True).start()
BASE = (URL or f'http://127.0.0.1:{server.server_port}').rstrip('/')
checks, errors = [], []

def check(value, label):
    if not value:
        raise AssertionError(label)
    checks.append(label)

def load(browser, width=1440, js=True, path='/pricing/'):
    page = browser.new_page(viewport={'width':width,'height':1000}, java_script_enabled=js, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('**/*', lambda route: route.abort() if route.request.resource_type == 'image' else route.continue_())
    response = page.goto(BASE+path, wait_until='load')
    check(response.status == 200, f'{path}: page returns 200')
    expected = HTML if path == '/pricing/' else (ROOT/'dist/index.html').read_text()
    check(response.text() == expected, f'{path}: served HTML matches staged file')
    check(page.locator('h1').count() == 1, f'{path}: one main heading')
    return page

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), headless=True)
    home = load(browser,path='/')
    check(home.locator('.market-summary-prices article').count() == 3, 'Homepage has three price examples')
    check(len(home.locator('#pricing').inner_text().split()) < 250, 'Homepage pricing story is under 250 words')
    check(home.locator('[data-market-row],.market-history-chart,.market-calculator').count() == 0, 'Full analysis and controls removed from main scroll')
    check(home.locator('.family-market').count() == 6, 'Six family pricing notes retained')
    home.locator('.market-summary-link').click()
    home.wait_for_url(BASE+'/pricing/')
    check(home.locator('.market-band').count() == 5, 'Homepage link opens the full pricing page')
    home.locator('.pricing-breadcrumb a').click()
    home.wait_for_url(BASE+'/#pricing')
    check(home.locator('#pricing-title').inner_text() == 'One owl.\nMany prices.', 'Return link resumes main story')
    home.goto(BASE+'/#sale-Heritage-61626-23039',wait_until='load')
    home.wait_for_url(BASE+'/pricing/#sale-Heritage-61626-23039')
    check(home.locator('#sale-Heritage-61626-23039').is_visible(), 'Existing sale bookmarks follow the moved chapter')
    home.goto(BASE+'/#market-ledger',wait_until='load')
    home.wait_for_url(BASE+'/pricing/#market-ledger')
    check(home.locator('#market-ledger').evaluate('e=>e.open'), 'Existing ledger bookmark opens the full-page ledger')
    page = load(browser)
    levels = page.locator('main h1,main h2,main h3,main h4').evaluate_all('es=>es.map(e=>Number(e.tagName.slice(1)))')
    check(all(levels[i+1] <= levels[i]+1 for i in range(len(levels)-1)), 'Standalone research page has a sequential heading outline')
    check(page.locator('.market-band').count() == 5, 'Five current comparison groups')
    check(page.locator('.market-history-chart:visible circle').count() == 24, 'All matched-grade observations plotted')
    check(page.locator('.source-entry').count() == 8, 'Dedicated pricing bibliography retains all eight references')
    citation = page.locator('#pricing [data-source]').first
    citation.focus()
    page.keyboard.press('Enter')
    check(page.locator('#source-dialog').evaluate('e=>e.open'), 'Full-page source dialog opens with keyboard')
    page.keyboard.press('Escape')
    check(citation.evaluate('e=>e===document.activeElement'), 'Full-page source dialog returns focus')
    citation.click()
    page.locator('[data-bibliography-jump]').click()
    check(not page.locator('#source-dialog').evaluate('e=>e.open') and page.locator('#source-market-ha-may h3 a').evaluate('e=>e===document.activeElement'), 'Source jump opens the matching local bibliography entry')
    check(page.locator('#market-total').inner_text() == '$1,464', 'Initial fee illustration')
    for hammer, premium, total in [('1000','20','$1,200'),('999.99','22','$1,219.99'),('0','22','$0'),('100','0','$100'),('-1','22','—'),('100','101','—'),('','22','—')]:
        page.locator('#market-hammer').fill(hammer)
        page.locator('#market-premium').fill(premium)
        check(page.locator('#market-total').inner_text() == total, f'Fee calculation: {hammer} + {premium}%')
    page.locator('#market-hammer').fill('1200')
    page.locator('#market-premium').fill('22')
    page.locator('#market-hammer').press('Enter')
    check(page.locator('#market-total').inner_text() == '$1,464', 'Enter does not navigate or submit data')
    page.locator('#market-ledger>summary').focus()
    page.keyboard.press('Enter')
    check(page.locator('[data-market-row]:visible').count() == 66, 'Keyboard opens all 66 records')
    page.locator('#market-venue').select_option('eBay')
    check(page.locator('[data-market-row]:visible').count() == 2, 'eBay filter isolates two observations')
    check(page.locator('[data-market-row]:visible .market-unverified').count() == 2, 'Both eBay prices visibly unverified')
    page.locator('#market-family').select_option('pi')
    check(page.locator('[data-market-row]:visible').count() == 1, 'Family and venue filters combine')
    page.locator('#market-search').fill('NO SUCH LOT xyz')
    check(page.locator('[data-market-row]:visible').count() == 0 and 'No matching' in page.locator('#market-results').inner_text(), 'Empty search has clear status')
    page.locator('#market-reset').click()
    check(page.locator('[data-market-row]:visible').count() == 66, 'Reset restores every record')
    page.locator('#market-search').fill('FULL CREST')
    check(page.locator('[data-market-row]:visible').count() == 3, 'Case-insensitive detail search')
    page.locator('#market-ledger>summary').click()
    page.locator('a[href="#sale-Heritage-61626-23039"]').click()
    page.wait_for_function("document.getElementById('market-ledger').open")
    check(page.locator('#sale-Heritage-61626-23039').is_visible(), 'Sale deep link opens disclosure and clears incompatible filters')
    for width in [320,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'No page overflow at {width}px')
        boxes = page.locator('.primary-nav a:visible').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right}})')
        check(all(boxes[i]['right'] <= boxes[i+1]['left'] for i in range(len(boxes)-1)), f'Navigation links do not overlap at {width}px')
        check(page.locator('.market-scroll').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().right <= innerWidth+1)'), f'Tables and chart scroll within viewport at {width}px')
        home.goto(BASE+'/#pricing',wait_until='load')
        home.set_viewport_size({'width':width,'height':1000})
        check(home.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'Homepage summary fits at {width}px')
    page.set_viewport_size({'width':1440,'height':1000})
    page.locator('#market-venue').select_option('eBay')
    page.evaluate("dispatchEvent(new Event('beforeprint'))")
    page.emulate_media(media='print')
    check(page.locator('[data-market-row]:visible').count() == 66, 'Print retains every observation despite active filter')
    page.emulate_media(media='screen')
    page.evaluate("dispatchEvent(new Event('afterprint'))")
    check(page.locator('[data-market-row]:visible').count() == 2, 'Printing preserves screen filter')
    page.locator('#market-reset').click()
    page.locator('#market-ledger>summary').click()
    for width in [1440,390]:
        page.set_viewport_size({'width':width,'height':1000})
        page.locator('#pricing-title').evaluate("e=>e.scrollIntoView({block:'start'})")
        page.screenshot(path=f'/private/tmp/owl-market-{width}.png')
        page.locator('.market-history-figure').screenshot(path=f'/private/tmp/owl-market-history-{width}.png')
        home.set_viewport_size({'width':width,'height':1000})
        home.locator('#pricing').screenshot(path=f'/private/tmp/owl-pricing-summary-{width}.png')
    nojs = load(browser,390,False)
    check(nojs.locator('#market-calculator').is_hidden() and nojs.locator('#market-filters').is_hidden(), 'No-JavaScript version hides enhancement-only controls')
    nojs.locator('#market-ledger>summary').click()
    check(nojs.locator('[data-market-row]:visible').count() == 66, 'No-JavaScript ledger contains all 66 records')
    check(nojs.locator('.market-band').count() == 5 and nojs.locator('.market-history-chart:visible circle').count() == 24, 'Price comparisons and history remain without JavaScript')
    nojs.locator('.pricing-breadcrumb a').click()
    check(nojs.locator('.market-summary-link').is_visible(), 'No-JavaScript return link reaches the summary')
    nojs.locator('.market-summary-link').click()
    check(nojs.locator('.market-band').count() == 5, 'No-JavaScript full pricing link works')
    response = page.request.get(BASE+'/data/owl-sales.json')
    check(response.status == 200 and response.json()['records'] == DATA['market']['records'], 'JSON contains all authoritative observations')
    response = page.request.get(BASE+'/data/owl-sales.csv')
    rows = list(csv.DictReader(io.StringIO(response.text())))
    check(response.status == 200 and len(rows) == 66, 'CSV parses to 66 observations')
    check([r['id'] for r in rows] == [r['id'] for r in DATA['market']['records']], 'CSV and JSON identifiers agree')
    response = page.request.get(BASE+'/pricing')
    check(response.status == 200 and response.url.endswith('/pricing/'), 'Pricing URL without slash reaches the canonical page')
    check(not errors, 'No browser runtime errors')
    browser.close()

if server:
    server.shutdown()
report = {'result':'pass','url':URL or 'local static server','checks':len(checks),'items':checks,'limitations':['Chromium only; image requests blocked. Real photograph verification is separate.']}
(ROOT / 'research' / ('market-hosted-qa.json' if URL else 'market-browser-qa.json')).write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} market browser checks.')
