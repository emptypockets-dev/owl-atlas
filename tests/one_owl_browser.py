"""Companion-story browser checks, including the four real owner photographs.

Run after npm run build:deploy. This uses the optional Python Playwright package
and Chromium; it adds no site dependency. By default a temporary local HTTP
server serves dist/. Set BASE_URL=https://theowlatlas.com for a hosted run, and
CHROMIUM_PATH when the browser is not installed at /usr/bin/chromium.

No requests are intercepted. The suite verifies served photo bytes against the
staged originals as well as their loaded dimensions. Screenshots and a JSON
report are written to /private/tmp (or the system temporary directory).
The enlarged-text case changes the root font size, not browser zoom. These
targeted Chromium checks are not an accessibility or cross-browser certification.
"""

from pathlib import Path
from urllib.parse import urljoin, urlparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import functools
import hashlib
import json
import os
import tempfile
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
HTML = (DIST / 'one-owl/index.html').read_text()
PHOTO_IDS = ('owner-athena', 'owner-owl', 'owner-holder-obverse', 'owner-holder-reverse')
# The two close-ups appear twice: once as the story's circular display crop and
# once as the complete frame in the photograph record. Both are the same file.
APPEARANCES = {'owner-athena': 2, 'owner-owl': 2,
               'owner-holder-obverse': 1, 'owner-holder-reverse': 1}
CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/'
REQUIRED_CREDIT = 'The Owl Atlas (theowlatlas.com)'
# Each display crop, measured off the owner's own 960x1280 frame. The rendered
# circle has to land on the measured coin, or the crop is no longer declared.
DISCS = {
    '.journey-disc': {'cx': 433, 'cy': 745, 'r': 430},
    '.journey-face-small': {'cx': 510, 'cy': 730, 'r': 372},
}
CHAPTER_IDS = ('top', 'mint-state', 'an-imagined-life', 'generations', 'survival', 'collecting-history', 'record', 'photographs', 'sources')
WIDTHS = (1440, 768, 390, 320)
OUTPUT = Path('/private/tmp') if Path('/private/tmp').exists() else Path(tempfile.gettempdir())
checks, failures, errors = [], [], []


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = None
if not os.environ.get('BASE_URL'):
    server = ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(DIST)),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = (os.environ.get('BASE_URL') or f'http://127.0.0.1:{server.server_port}').rstrip('/')


def check(value, label, detail=None):
    checks.append(label)
    if not value:
        failures.append({'check': label, 'detail': detail})


def load(browser, width=1440, javascript=True, path='/one-owl/', motion='reduce'):
    page = browser.new_page(
        viewport={'width': width, 'height': 1000}, java_script_enabled=javascript,
        reduced_motion=motion,
    )
    page.on('pageerror', lambda error: errors.append(f'{path}: {error}'))
    response = page.goto(BASE + path, wait_until='domcontentloaded')
    check(response is not None and response.status == 200, f'{path}: HTTP 200')
    if path == '/one-owl/':
        check(response.text() == HTML, 'Served companion HTML matches the staged build')
    return page


def layout(page, label):
    result = page.evaluate("""() => {
      const controls = [...document.querySelectorAll('.site-header a,.site-header button')]
        .map(e=>{const r=e.getBoundingClientRect();return {
          name:e.id||e.textContent.trim(),x:r.left,y:r.top,right:r.right,bottom:r.bottom,
          width:r.width,height:r.height
        }}).filter(r=>r.width>0&&r.height>0);
      const overlaps=[];
      controls.forEach((a,i)=>controls.slice(i+1).forEach(b=>{
        if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&
           Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1) overlaps.push([a.name,b.name]);
      }));
      return {
        overflow:document.documentElement.scrollWidth-innerWidth,
        clipped:controls.filter(r=>r.x< -1||r.right>innerWidth+1),
        short:controls.filter(r=>r.height<43.5),overlaps,
        navCount:[...document.querySelectorAll('.primary-nav a')]
          .filter(e=>e.getBoundingClientRect().width>0).length
      };
    }""")
    check(result['overflow'] <= 1, f'{label}: no page horizontal overflow', result['overflow'])
    check(not result['clipped'], f'{label}: header controls fit the viewport', result['clipped'])
    check(not result['overlaps'], f'{label}: header controls do not overlap', result['overlaps'])
    check(not result['short'], f'{label}: header targets are at least 44px tall', result['short'])
    check(result['navCount'] > 0, f'{label}: primary navigation remains visible')


def text_floor(page, selector, minimum, label):
    result = page.locator(selector).evaluate_all("""(es,minimum)=>{
      const visible=es.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
      return {count:visible.length,small:visible.filter(e=>parseFloat(getComputedStyle(e).fontSize)<minimum-.1)
        .map(e=>({text:e.textContent.trim().slice(0,80),size:getComputedStyle(e).fontSize}))};
    }""", minimum)
    check(result['count'] > 0, f'{label}: text sample exists')
    check(not result['small'], f'{label}: text is at least {minimum}px', result['small'])


def anchor_clearance(page, fragment, label):
    # A viewport/font change queues ResizeObserver. Wait for the measured header
    # to reach the CSS scroll offset before simulating a subsequent navigation.
    page.wait_for_function("""() => Math.abs(
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) -
      Math.ceil(document.querySelector('.site-header').getBoundingClientRect().height)
    ) < 1""")
    page.evaluate('(id)=>{location.hash=id}', fragment)
    page.evaluate('async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)}')
    result = page.locator(f'#{fragment}').evaluate("""e=>{
      const header=document.querySelector('.site-header').getBoundingClientRect();
      const bar=document.querySelector('.chapter-bar')?.getBoundingClientRect();
      return {top:e.getBoundingClientRect().top,
        covered:bar&&bar.top<=header.bottom+1?Math.max(header.bottom,bar.bottom):header.bottom};
    }""")
    check(result['top'] >= result['covered'] - 2, f'{label}: target clears fixed navigation', result)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True,
        )
        page = load(browser)
        check(page.locator('h1').count() == 1, 'Companion has one main heading')
        check(page.locator('main').count() == 1, 'Companion has one main landmark')
        check(page.locator('#fiction-boundary').is_visible(), 'Fiction explanation is visible without expanding a disclosure')
        check(page.locator('#an-imagined-life').get_attribute('aria-describedby') == 'fiction-boundary', 'Fiction region has an accessible context description')
        for fragment in CHAPTER_IDS:
            check(page.locator(f'#{fragment}').count() == 1, f'Unique chapter target: #{fragment}')
        levels = page.locator('main h1,main h2,main h3,main h4').evaluate_all(
            'es=>es.map(e=>Number(e.tagName.slice(1)))',
        )
        check(all(b <= a + 1 for a, b in zip(levels, levels[1:])), 'Heading outline has no skipped level')
        check(page.locator('.source-entry').count() > 0, 'Source bibliography is present')
        check(page.locator('[data-source]').count() > 0, 'Story has linked evidence notes')
        citation_targets = page.locator('[data-source]').evaluate_all(
            'es=>es.map(e=>({id:e.dataset.source,href:e.getAttribute("href")}))',
        )
        for target in {entry['id']: entry for entry in citation_targets}.values():
            check(target['href'] == f"#source-{target['id']}" and
                  page.locator(f"#source-{target['id']}").count() == 1,
                  f"Citation resolves to a local bibliography entry: {target['id']}")
        missing_fragments = page.locator('a[href^="#"]').evaluate_all("""es=>es
          .map(e=>e.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1))))""")
        check(not missing_fragments, 'All local fragment links have targets', missing_fragments)

        disclosure = page.locator('#photographs')
        check(disclosure.evaluate('e=>e.tagName==="DETAILS"&&!e.open'), 'Holder documentation is collapsed by default')
        for photo_id in PHOTO_IDS[:2]:
            check(page.locator(f'[data-photo="{photo_id}"]').first.is_visible(), f'{photo_id}: coin face is visible')

        # The two close-ups are shown as circular display crops. The crop is CSS
        # over the unchanged file, so the rendered circle has to sit on the coin
        # the measurement names, and the file's own dimensions must not change.
        for selector, measured in DISCS.items():
            disc = page.locator(f'{selector} .image-surface').first
            disc.scroll_into_view_if_needed()
            geometry = disc.evaluate("""(e,m)=>{
              const box=e.getBoundingClientRect(), img=e.querySelector('img').getBoundingClientRect();
              return {side:box.width, height:box.height,
                round:getComputedStyle(e).borderTopLeftRadius,
                dx:(img.left+img.width*m.cx/960)-(box.left+box.width/2),
                dy:(img.top+img.height*m.cy/1280)-(box.top+box.height/2),
                diameter:img.width*2*m.r/960};
            }""", measured)
            check(abs(geometry['side'] - geometry['height']) < 1,
                  f'{selector}: the display crop is a square window, so its circle is round', geometry)
            check(geometry['round'].endswith('%') or float(geometry['round'].rstrip('px')) >= geometry['side'] / 2 - 1,
                  f'{selector}: the display crop is masked to a circle', geometry)
            check(abs(geometry['dx']) < 2 and abs(geometry['dy']) < 2,
                  f'{selector}: the measured coin centre lands at the centre of the circle', geometry)
            check(abs(geometry['diameter'] - geometry['side']) < 2,
                  f'{selector}: the measured coin diameter fills the circle', geometry)

        record_text = page.locator('#photographs').text_content()
        check('CC BY 4.0' in record_text and REQUIRED_CREDIT in record_text,
              'The photograph record states the licence and the credit it requires')
        check(page.locator(f'#photographs a[href="{CC_BY_URL}"]').count() == 1,
              'The photograph record links the CC BY 4.0 deed')
        check('CC BY 4.0' in page.locator('.journey-disc figcaption').inner_text(),
              'The opening credit names the licence beneath the coin')

        disclosure.locator('summary').focus()
        page.keyboard.press('Enter')
        check(disclosure.evaluate('e=>e.open'), 'Keyboard opens the holder photographs')

        for photo_id in PHOTO_IDS:
            figures = page.locator(f'[data-photo="{photo_id}"]')
            check(figures.count() == APPEARANCES[photo_id],
                  f'{photo_id}: appears {APPEARANCES[photo_id]} time(s), display crop plus complete frame',
                  figures.count())
            for index in range(figures.count()):
                where = f'{photo_id}[{index}]'
                figure = figures.nth(index)
                figure.scroll_into_view_if_needed()
                image = figure.locator('img')
                image.wait_for(state='visible')
                page.wait_for_function('([id,i])=>{const e=document.querySelectorAll(`[data-photo="${id}"] img`)[i];return e&&e.complete&&e.naturalWidth>0}', arg=[photo_id, index])
                dims = image.evaluate('e=>({w:e.naturalWidth,h:e.naturalHeight,expectedW:Number(e.getAttribute("width")),expectedH:Number(e.getAttribute("height")),url:e.currentSrc,alt:e.alt})')
                check(dims['w'] == dims['expectedW'] and dims['h'] == dims['expectedH'],
                      f'{where}: actual photo dimensions match the record', dims)
                check(bool(dims['alt'].strip()), f'{where}: image has descriptive alternative text')
                check(bool(figure.locator('figcaption').inner_text().strip()), f'{where}: visible attribution is attached')
                check('CC BY 4.0' in figure.locator('figcaption').inner_text(), f'{where}: the visible attribution names the licence')
                asset_path = DIST / urlparse(dims['url']).path.lstrip('/')
                check(asset_path.is_file(), f'{where}: local asset is included in dist', str(asset_path))
                response = page.request.get(dims['url'])
                check(response.status == 200, f'{where}: image request succeeds')
                if asset_path.is_file():
                    check(hashlib.sha256(response.body()).digest() == hashlib.sha256(asset_path.read_bytes()).digest(),
                          f'{where}: served image bytes match the staged original')
                trigger = figure.locator('[data-image]')
                trigger.focus()
                page.keyboard.press('Enter')
                dialog = page.locator('#image-dialog')
                check(dialog.evaluate('e=>e.open&&e.matches(":modal")'), f'{where}: keyboard opens a native modal viewer')
                page.wait_for_function('document.querySelector("#viewer-image").complete&&document.querySelector("#viewer-image").naturalWidth>0')
                check(page.locator('#viewer-image').evaluate('e=>e.naturalWidth') == dims['w'],
                      f'{where}: the complete original resolution is available in the viewer')
                check(page.locator('#image-stage').evaluate('e=>e===document.activeElement'), f'{where}: viewer keyboard controls receive focus')
                check(bool(page.locator('#viewer-credit').inner_text().strip()) and bool(page.locator('#viewer-license').inner_text().strip()),
                      f'{where}: viewer preserves credit and rights information')
                page.keyboard.press('+')
                check(page.locator('#zoom-value').inner_text() == '125%', f'{where}: keyboard zoom enlarges the photograph')
                page.keyboard.press('0')
                check(page.locator('#zoom-value').inner_text() == '100%', f'{where}: keyboard reset restores fitted view')
                page.keyboard.press('Escape')
                check(not dialog.evaluate('e=>e.open'), f'{where}: Escape closes the viewer')
                check(trigger.evaluate('e=>e===document.activeElement'), f'{where}: focus returns to the selected photograph')

        citation = page.locator('[data-source]:visible').first
        citation.focus()
        page.keyboard.press('Enter')
        check(page.locator('#source-dialog').evaluate('e=>e.open&&e.contains(document.activeElement)'), 'Keyboard opens and focuses a source note')
        page.keyboard.press('Escape')
        check(citation.evaluate('e=>e===document.activeElement'), 'Closing a source note returns citation focus')
        citation.click()
        source_id = citation.get_attribute('data-source')
        page.locator('[data-bibliography-jump]').click()
        check(not page.locator('#source-dialog').evaluate('e=>e.open'), 'Bibliography jump closes the source dialog')
        check(page.locator(f'#source-{source_id} h3 a').evaluate('e=>e===document.activeElement'), 'Bibliography jump focuses the cited reference')
        check(page.locator('html').evaluate('e=>e.classList.contains("motion-off")'), 'OS reduced-motion preference is respected')
        page.locator('#motion-toggle').click()
        check(page.locator('html').evaluate('e=>e.classList.contains("motion-off")'), 'Motion button does not override OS reduced motion')

        narrative = '.journey-copy p:not(.micro-copy):not(.eyebrow)'
        for width in WIDTHS:
            page.set_viewport_size({'width': width, 'height': 1000})
            label = f'{width}px'
            layout(page, label)
            text_floor(page, narrative, 16, f'{label}: narrative')
            text_floor(page, '.image-credit', 13, f'{label}: photograph credits')
            for fragment in CHAPTER_IDS[1:]:
                anchor_clearance(page, fragment, f'{label} / #{fragment}')
            sample = page.locator(narrative).first
            before = sample.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
            page.evaluate("document.documentElement.style.fontSize='200%'")
            after = sample.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
            check(after >= before * 1.9, f'{label}: narrative responds to 200% root text', {'before':before,'after':after})
            layout(page, f'{label} / 200% root text')
            anchor_clearance(page, 'generations', f'{label} / enlarged text / #generations')
            page.evaluate("document.documentElement.style.fontSize=''")
            if width in (1440, 390):
                page.evaluate('document.activeElement?.blur()')
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUTPUT / f'owl-one-owl-hero-{width}.png'))
                page.locator('#generations').screenshot(path=str(OUTPUT / f'owl-one-owl-generations-{width}.png'))
                # A tall element screenshot can place fixed navigation halfway
                # through the image. Capture the actual reading viewport instead.
                for fragment, name in (('an-imagined-life', 'fiction'), ('collecting-history', 'collecting')):
                    page.evaluate('(id)=>document.getElementById(id).scrollIntoView({block:"start",behavior:"instant"})', fragment)
                    page.screenshot(path=str(OUTPUT / f'owl-one-owl-{name}-{width}.png'))

        motion_page = load(browser, motion='no-preference')
        initial_motion = motion_page.locator('html').evaluate('e=>e.classList.contains("motion-off")')
        motion_page.locator('#motion-toggle').click()
        check(motion_page.locator('html').evaluate('e=>e.classList.contains("motion-off")') != initial_motion, 'Manual motion control changes preference')
        motion_page.close()

        nojs = load(browser, width=390, javascript=False)
        layout(nojs, '390px / no JavaScript')
        check(nojs.locator('h1').count() == 1, 'No-JavaScript story has its main heading')
        check(nojs.locator('.journey-copy:visible').count() > 0, 'No-JavaScript narrative is visible')
        check(nojs.locator('.source-entry:visible').count() > 0, 'No-JavaScript bibliography is visible')
        check(nojs.locator('#fiction-boundary').is_visible() and nojs.locator('.journey-scenes>li').count() == 4, 'All four fictional scenes and their context remain readable without JavaScript')
        for photo_id in PHOTO_IDS[:2]:
            check(nojs.locator(f'[data-photo="{photo_id}"]').first.is_visible(), f'No-JavaScript {photo_id}: coin face remains visible')
        nojs.locator('#photographs > summary').focus()
        nojs.keyboard.press('Enter')
        check(nojs.locator('#photographs').evaluate('e=>e.open'), 'No-JavaScript disclosure opens with the keyboard')
        check(REQUIRED_CREDIT in nojs.locator('#photographs').inner_text(),
              'No-JavaScript reading still states the credit the licence requires')
        for photo_id in PHOTO_IDS:
            figures = nojs.locator(f'[data-photo="{photo_id}"]')
            check(figures.count() == APPEARANCES[photo_id], f'No-JavaScript {photo_id}: every appearance is in the static markup')
            for index in range(figures.count()):
                figure = figures.nth(index)
                trigger = figure.locator('[data-image]')
                check(figure.is_visible() and bool(figure.locator('figcaption').inner_text().strip()), f'No-JavaScript {photo_id}[{index}]: photo and attribution remain available')
                # Without JavaScript the "Look closer" link is the route to the
                # complete, uncropped frame, so it has to reach the real file.
                original = urljoin(nojs.url, trigger.get_attribute('href'))
                check(nojs.request.get(original).status == 200, f'No-JavaScript {photo_id}[{index}]: link leads directly to the complete photograph')
        first_citation = nojs.locator('[data-source]').first
        fragment = first_citation.get_attribute('href')
        first_citation.click()
        check(nojs.url.endswith(fragment) and nojs.locator(fragment).is_visible(), 'No-JavaScript citation navigates to its source')
        back_links = nojs.locator('main a[href^="../#"]')
        check(back_links.count() > 0, 'Companion provides a native link back to the main story')
        nojs.close()

        home = load(browser, path='/')
        teaser = home.locator('a[href="one-owl/"]').first
        check(teaser.count() == 1, 'Main story links to the companion page')
        check(home.locator('#one-owl').count() == 1, 'Main story teaser has a stable bookmark')
        teaser.click()
        home.wait_for_url(BASE + '/one-owl/')
        check(home.locator('h1').count() == 1 and home.locator('#record').count() == 1, 'Main story link opens the complete companion page')
        response = page.request.get(BASE + '/one-owl')
        check(response.status == 200 and response.url.endswith('/one-owl/'), 'URL without trailing slash reaches the companion page')
        for fragment in ('an-imagined-life', 'collecting-history', 'generations', 'record', 'photographs'):
            deep = load(browser, width=390, path=f'/one-owl/#{fragment}')
            check(deep.locator(f'#{fragment}').is_visible(), f'Hosted-style deep link works: #{fragment}')
            deep.close()
        check(not errors, 'No unexpected browser JavaScript errors', errors)
        browser.close()
finally:
    if server:
        server.shutdown()

report = {
    'result': 'fail' if failures else 'pass', 'url': BASE,
    'passed': len(checks) - len(failures), 'total': len(checks),
    'failures': failures, 'checks': checks,
    'scope': 'Chromium, real photo bytes and dimensions, native keyboard dialogs, source links, responsive geometry, root text enlargement, no-JavaScript reading and direct image access. Not browser zoom, screen-reader, or cross-browser certification.',
}
report_path = OUTPUT / ('owl-one-owl-hosted-qa.json' if os.environ.get('BASE_URL') else 'owl-one-owl-browser-qa.json')
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'result': report['result'], 'passed': report['passed'], 'total': report['total'], 'failures': failures, 'report': str(report_path)}, indent=2))
raise SystemExit(1 if failures else 0)
