"""Market interactions and responsive regression checks; external images blocked.

Optional Python Playwright + Chromium, like browser_smoke.py. The hosted run
additionally checks that HTML and downloadable observations match the build.
"""
from pathlib import Path
import csv, io, json, os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'dist/index.html').read_text()
DATA = json.loads((ROOT / 'src/content.json').read_text())
URL = os.environ.get('MARKET_URL')
checks, errors = [], []

def check(value, label):
    if not value:
        raise AssertionError(label)
    checks.append(label)

def load(browser, width=1440, js=True):
    page = browser.new_page(viewport={'width':width,'height':1000}, java_script_enabled=js, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('**/*', lambda route: route.abort() if route.request.resource_type == 'image' else route.continue_())
    if URL:
        response = page.goto(URL, wait_until='load')
        check(response.status == 200, 'Hosted page returns 200')
        check(response.text() == HTML, 'Hosted HTML matches dist/index.html')
    else:
        page.set_content(HTML, wait_until='load')
    return page

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), headless=True)
    page = load(browser)
    check(page.locator('.market-band').count() == 5, 'Five current comparison groups')
    check(page.locator('.market-history-chart:visible circle').count() == 24, 'All matched-grade observations plotted')
    check(page.locator('.family-market').count() == 6, 'Six families have prices for other specimens')
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
    nojs = load(browser,390,False)
    check(nojs.locator('#market-calculator').is_hidden() and nojs.locator('#market-filters').is_hidden(), 'No-JavaScript version hides enhancement-only controls')
    nojs.locator('#market-ledger>summary').click()
    check(nojs.locator('[data-market-row]:visible').count() == 66, 'No-JavaScript ledger contains all 66 records')
    check(nojs.locator('.market-band').count() == 5 and nojs.locator('.market-history-chart:visible circle').count() == 24, 'Price comparisons and history remain without JavaScript')
    if URL:
        response = page.request.get(URL.rstrip('/')+'/data/owl-sales.json')
        check(response.status == 200 and response.json()['records'] == DATA['market']['records'], 'Hosted JSON contains all authoritative observations')
        response = page.request.get(URL.rstrip('/')+'/data/owl-sales.csv')
        rows = list(csv.DictReader(io.StringIO(response.text())))
        check(response.status == 200 and len(rows) == 66, 'Hosted CSV parses to 66 observations')
        check([r['id'] for r in rows] == [r['id'] for r in DATA['market']['records']], 'CSV and JSON identifiers agree')
    check(not errors, 'No browser runtime errors')
    browser.close()

report = {'result':'pass','url':URL or 'local rendered HTML','checks':len(checks),'items':checks,'limitations':['Chromium only; image requests blocked. Real photograph verification is separate.']}
(ROOT / 'research' / ('market-hosted-qa.json' if URL else 'market-browser-qa.json')).write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} market browser checks.')
