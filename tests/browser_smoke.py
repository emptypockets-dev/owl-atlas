"""Optional browser smoke test. Requires Python Playwright + Chromium.

Network requests are deliberately aborted: this validates the fallback/interaction
paths, not the availability or correctness of external coin photographs.
A synthetic grid is used only for the loaded-image pan/zoom test; it is never
written into the distributed website or passed off as a coin photograph.
"""
from pathlib import Path
import json, os, base64
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text()
ATLAS_HTML = (ROOT / 'atlas/index.html').read_text()
DATA = json.loads((ROOT / 'src/content.json').read_text())
SCREENSHOTS = ROOT / 'research/screenshots'
SCREENSHOTS.mkdir(parents=True, exist_ok=True)
checks = []
errors = []

def check(value, label):
    if not value:
        raise AssertionError(label)
    checks.append(label)

def new_page(browser, width=1440, height=1000, reduced_motion='no-preference', java_script_enabled=True,
             markup=None):
    page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion=reduced_motion, java_script_enabled=java_script_enabled)
    page.route('https://**/*', lambda route: route.abort())
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(markup or HTML, wait_until='load')
    page.wait_for_timeout(150)
    return page

def hosted_page(browser, markup, url, width=1440, height=1000):
    """A page served at a real URL, for the scripts that read location.search.

    set_content leaves the document on about:blank, which has no query string,
    so the comparison presets a story link hands to /atlas/ cannot be tested
    that way. Only this one document is served; every other request is still
    aborted, so no coin photograph is fetched.
    """
    page = browser.new_page(viewport={'width': width, 'height': height})
    page.route('https://**/*', lambda route: route.abort())
    page.route(url.split('?')[0], lambda route: route.fulfill(status=200, content_type='text/html; charset=utf-8', body=markup))
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url, wait_until='load')
    page.wait_for_timeout(150)
    return page

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    page = new_page(browser)
    check(page.title().startswith('The Owl Atlas'), 'Document title')
    check(page.locator('h1').count() == 1, 'Exactly one primary heading')
    check(page.locator('.source-entry').count() == len(DATA['sources']), 'All bibliography entries rendered')
    check(page.locator('.family-card').count() == len(DATA['families']), 'All family cards rendered')
    check(page.locator('.hero-photo .has-error').count() == 1, 'Visible photograph-unavailable fallback')
    check(page.locator('#reading-fill').count() == 1, 'Reading progress element')
    page.locator('#motion-toggle').click()
    check(page.locator('html').evaluate("e => e.classList.contains('motion-off')"), 'Manual reduced motion')
    page.locator('#motion-toggle').click()
    check(not page.locator('html').evaluate("e => e.classList.contains('motion-off')"), 'Manual motion re-enabled')

    # Guided geography uses native controls and keeps one complete reading panel
    # visible. Since 21 September 2026 the explorer lives in chapter 05
    # ("An owl beyond Attica"). Since 23 September 2026 chapter 01 shows a
    # photograph of Laurion ore where its static Attica map was, and no map.
    check(page.locator('#beyond #geography-explorer').count() == 1, 'The explorer sits in chapter 05')
    check(page.locator('#origins #geography-explorer').count() == 0, 'Chapter 01 has no explorer')
    check(page.locator('#origins .origins-photo [data-image="laurion-galena"]').count() == 1,
          'Chapter 01 shows the Laurion ore photograph')
    check(page.locator('#origins .geo-focus-map, #origins .geo-locator-map').count() == 0, 'Chapter 01 draws no map')
    for place in DATA['geography']['places']:
        button = page.locator(f'[data-geography="{place["id"]}"]')
        button.focus()
        page.keyboard.press('Enter')
        check(button.get_attribute('aria-pressed') == 'true', f'Keyboard geographic selection: {place["id"]}')
        check(page.locator('.geo-place:visible').count() == 1 and page.locator(f'#geography-{place["id"]}').is_visible(), f'Only selected geographic panel exposed: {place["id"]}')
        check(place['legend'] in page.locator(f'#geography-{place["id"]} .geo-focus figcaption').inner_text(), f'Area shading explained: {place["id"]}')
    page.locator('#geography-arabia .geo-next').focus()
    page.keyboard.press('Enter')
    check(page.locator('#geography-athens-title').evaluate('e=>e===document.activeElement'), 'Next-place navigation returns to Athens and moves focus to the new heading')
    page.set_viewport_size({'width':390,'height':844})
    for place in DATA['geography']['places']:
        page.locator('#geography-select').select_option(place['id'])
        check(page.locator(f'#geography-{place["id"]}').is_visible(), f'Mobile place selector: {place["id"]}')
    page.evaluate("location.hash='geography-egypt'")
    page.wait_for_function("!document.getElementById('geography-egypt').hidden")
    check(page.locator('#geography-select').input_value() == 'egypt', 'Geographic deep link selects the corresponding place')
    page.set_viewport_size({'width':1440,'height':1000})

    # Native source dialog and focus return.
    citation = page.locator('.object-caption [data-source]').first
    citation.click()
    check(page.locator('#source-dialog').evaluate('e=>e.open'), 'Citation opens source dialog')
    check('Cleveland' in page.locator('#source-dialog-title').inner_text() or page.locator('#source-dialog-title').inner_text(), 'Source title populated')
    page.keyboard.press('Escape')
    check(not page.locator('#source-dialog').evaluate('e=>e.open'), 'Escape closes source dialog')
    check(citation.evaluate('e=>document.activeElement===e'), 'Source-dialog focus restored')

    # Image error path, close and focus management.
    image_link = page.locator('.hero-photo [data-image]').first
    image_link.click()
    check(page.locator('#image-dialog').evaluate('e=>e.open'), 'Image opens native dialog')
    page.wait_for_timeout(100)
    check(page.locator('#viewer-error').is_visible(), 'Image viewer error preserves source links')
    check(page.locator('#viewer-source').get_attribute('href').startswith('https://'), 'Source record linked in image dialog')
    check(page.locator('#viewer-license').inner_text(), 'Image license retained in viewer')
    page.keyboard.press('Escape')
    check(not page.locator('#image-dialog').evaluate('e=>e.open'), 'Escape closes image dialog')
    check(image_link.evaluate('e=>document.activeElement===e'), 'Image-dialog focus restored')

    # Chapter 02 now reads on a dark ground; the controls below are the same ones,
    # repainted for it. The close reading: a native radio pair chooses the face, the
    # detail buttons choose the reading, and a numbered marker sits over the
    # photograph at the reading's own coordinates.
    readings = DATA['closeReading']['readings']
    check(len(readings) == 6, 'Six sourced close readings')
    for side in ('reverse', 'obverse'):
        panel = page.locator(f'#close-reading-{side}')
        page.locator(f'input[name="close-reading-side"][value="{side}"]').check()
        check(panel.is_visible(), f'Chosen close-reading face is shown: {side}')
        other = 'obverse' if side == 'reverse' else 'reverse'
        check(page.locator(f'#close-reading-{other}').is_hidden(), f'Unchosen close-reading face is hidden: {other}')
        marker = panel.locator('.close-reading-marker')
        check(marker.evaluate('e=>e.closest(".image-surface")!==null'),
              f'Marker is anchored to the photograph itself: {side}')
        check(panel.locator('.close-reading-text').get_attribute('aria-live') == 'polite',
              f'Reading text is a polite live region: {side}')
        for index, reading in enumerate(readings):
            if reading['side'] != side:
                continue
            button = panel.locator(f'[data-close-reading="{reading["id"]}"]')
            button.focus()
            page.keyboard.press('Enter')
            article = page.locator(f'#close-reading-{reading["id"]}')
            check(article.is_visible(), f'Chosen reading is shown: {reading["id"]}')
            check(panel.locator('.close-reading-item:visible').count() == 1, f'Exactly one reading at a time: {reading["id"]}')
            check(button.get_attribute('aria-pressed') == 'true'
                  and panel.locator('[data-close-reading][aria-pressed="true"]').count() == 1,
                  f'One pressed detail button: {reading["id"]}')
            check(article.locator('h4').inner_text() == reading['title'], f'Reading keeps its title: {reading["id"]}')
            check(article.locator('[data-source]').count() == len(reading['refs']),
                  f'Reading keeps every citation: {reading["id"]}')
            check(marker.inner_text() == str(index + 1), f'Marker is numbered for the reading: {reading["id"]}')
            placed = marker.evaluate('''e=>{
              const box = e.getBoundingClientRect();
              const surface = e.closest('.image-surface').getBoundingClientRect();
              return [(box.left + box.width / 2 - surface.left) / surface.width * 100,
                      (box.top + box.height / 2 - surface.top) / surface.height * 100];
            }''')
            check(abs(placed[0] - reading['x']) < 1 and abs(placed[1] - reading['y']) < 1,
                  f'Marker sits at the reading\'s own coordinates: {reading["id"]}')
            check(button.evaluate('e=>e.getBoundingClientRect().height') >= 44,
                  f'Detail button keeps a 44px target: {reading["id"]}')
    # The photographs are the ones the readings name, and they open the viewer.
    for side, image_id in (('reverse', 'classic-owl'), ('obverse', 'classic-athena')):
        check(page.locator(f'#close-reading-{side} [data-image]').first.get_attribute('data-image') == image_id,
              f'Close reading shows the named photograph: {side}')
    page.locator('input[name="close-reading-side"][value="reverse"]').check()
    trigger = page.locator('#close-reading-reverse [data-image]').first
    trigger.click()
    check(page.locator('#image-dialog').evaluate('e=>e.open&&e.matches(":modal")'), 'Close-reading photograph opens the native viewer')
    page.locator('#viewer-error').wait_for(state='visible')
    check(page.locator('#viewer-source').get_attribute('href') == DATA['images']['classic-owl']['source'],
          'Blocked close-reading photograph retains the correct source')
    page.keyboard.press('Escape')
    check(trigger.evaluate('e=>e===document.activeElement'), 'Closing the close-reading viewer returns keyboard focus')
    page.emulate_media(media='print')
    check(page.locator('.close-reading-layout:visible').count() == 2
          and page.locator('.close-reading-item:visible').count() == 6,
          'Both faces and all six readings are available in print')
    check(page.locator('#close-reading .detail-buttons').first.is_hidden(), 'The inert detail buttons leave the printed page')
    page.emulate_media(media='screen')
    check(page.locator('.hero-photo [data-image]').count() == 1, 'The hero photograph is still the home page\'s own')
    page.locator('.hero-photo [data-image]').click()
    check(page.locator('#viewer-rights').is_hidden(), 'BnF reuse warning does not leak into unrelated images')
    check(page.locator('#viewer-policy').is_hidden(), 'BnF policy link does not leak into unrelated images')
    page.keyboard.press('Escape')
    # The story links both comparison presets; the comparison itself is on /atlas/.
    for preset in ('pi-pair', 'late-bridge'):
        check(page.locator(f'#close-reading [data-compare-preset="{preset}"]').count() == 1,
              f'The story still reaches the comparison preset: {preset}')
    check(page.locator('#after-athens').count() == 0, 'The withdrawn fourth-century chapter is gone from the story')

    # The comparison tool, the family atlas, the BnF specimens and the
    # bibliography all live on /atlas/, so they are driven on that page.
    atlas = new_page(browser, markup=ATLAS_HTML)
    # Both faces of every family comparison.
    for side in ['obverse', 'reverse']:
        atlas.locator(f'input[name="compare-side"][value="{side}"]').check()
        for family in DATA['families']:
            atlas.locator('#compare-left').select_option(family['id'])
            check(atlas.locator('#compare-panel-left h3').inner_text() == family['name'], f'Comparison {family["id"]}/{side}')
            expected_gap = not family.get(side)
            check(bool(atlas.locator('#compare-panel-left .photo-gap').count()) == expected_gap, f'Honest photo coverage {family["id"]}/{side}')
    # Edition 02: museum specimens are integrated, not orphan image records.
    for image_id, image in DATA['images'].items():
        if not image.get('specimenId'): continue
        check(atlas.locator(f'[data-photo="{image_id}"]').count() >= 1, f'Specimen image present on the atlas: {image_id}')
    check(atlas.locator('#family-pi .image-figure').count() == 2, 'Pi III card contains both sides')
    check(atlas.locator('#family-late-old .image-figure').count() == 2, 'Quadridigité card contains both sides')
    atlas.locator('#pi-ii-specimen > summary').click()
    check(atlas.locator('#pi-ii-specimen').get_attribute('open') is not None, 'Pi II supplementary exhibit opens')
    check(atlas.locator('#pi-ii-specimen .image-figure').count() == 2, 'Pi II exhibit contains both sides')
    check('A classification is not a date.' in atlas.locator('#pi-ii-specimen').inner_text(), 'Pi II dating caveat retained')
    atlas.locator('#pi-ii-specimen [data-image]').first.click()
    check('Pi II' in atlas.locator('#image-dialog-title').inner_text(), 'Pi II viewer uses specific title')
    check(atlas.locator('#viewer-object').get_attribute('href') == DATA['specimens']['bnf-pi-ii-1469']['objectUrl'], 'Viewer links exact BnF object')
    check('Reuse review pending' in atlas.locator('#viewer-rights').inner_text(), 'BnF rights caveat visible in viewer')
    check(atlas.locator('#viewer-policy').is_visible(), 'BnF policy link visible')
    check('393–295' in atlas.locator('#viewer-date').inner_text(), 'Broad Pi II catalogue date preserved')
    atlas.keyboard.press('Escape')
    atlas.locator('#pi-ii-specimen [data-compare-preset="pi-pair"]').click()
    check(atlas.locator('#compare-left-specimen').input_value() == 'bnf-pi-ii-1469', 'Preset selects Pi II on left')
    check(atlas.locator('#compare-right-specimen').input_value() == 'bnf-pi-iii-1475', 'Preset selects Pi III on right')
    check(atlas.locator('input[name="compare-side"][value="obverse"]').is_checked(), 'Preset starts with Athena faces')
    for side in ['obverse', 'reverse']:
        atlas.locator(f'input[name="compare-side"][value="{side}"]').check()
        for position, sid in [('left','bnf-pi-ii-1469'), ('right','bnf-pi-iii-1475')]:
            check(atlas.locator(f'#compare-panel-{position} [data-image]').first.get_attribute('data-image') == DATA['specimens'][sid][side], f'Exact paired image: {position}/{sid}/{side}')
    atlas.locator('#compare-left-specimen').select_option('bnf-pi-iii-1475')
    check(atlas.locator('#compare-panel-left [data-image]').first.get_attribute('data-image') == 'bnf-pi-iii-1475-reverse', 'Specimen switch preserves selected reverse side')
    # The late bridge preset arrives from the story as a URL; on the atlas page
    # it is read from the query string rather than from a link.
    bridge = hosted_page(browser, ATLAS_HTML, 'https://theowlatlas.test/atlas/?compare=late-bridge')
    check(bridge.locator('#compare-right').input_value() == 'late-old', 'Bridge preset selects later Old Style')
    check(bridge.locator('#compare-panel-right [data-image]').first.get_attribute('data-image') == 'bnf-quadridigite-1478-obverse', 'Bridge preset uses quadridigité obverse')
    check(bridge.locator('#compare-right-specimen-control').is_hidden(), 'Single-specimen family hides redundant selector')
    bridge.close()
    atlas.locator('#compare-left').select_option('classical')
    atlas.locator('#compare-right').select_option('new')
    check(atlas.locator('#compare-specimen-tools').is_hidden(), 'Unused specimen toolbar hidden')
    atlas.locator('#pi-ii-specimen .reuse-badge').first.click()
    check(atlas.locator('#image-reuse-policy').get_attribute('open') is not None, 'Reuse badge opens detailed policy disclosure')
    check('SOURCED IMAGES' in atlas.locator('.chapter-rights-note').inner_text().upper(),
          'The reuse-review notice sits beside the BnF photographs')
    atlas.close()
    page.locator('#source-search').fill('Kroll')
    check(page.locator('.source-entry:visible').count() >= 2, 'Bibliography author filtering')
    page.locator('#source-search').fill('NO-MATCH-12345')
    check(page.locator('#source-empty').is_visible(), 'Bibliography no-results state')
    page.locator('#source-search').fill('')
    check(page.locator('.source-entry:visible').count() == len(DATA['sources']), 'Bibliography reset')
    page.locator('#source-search').fill('NO-MATCH-12345')
    page.locator('.object-caption [data-source]').first.click()
    page.locator('[data-bibliography-jump]').click()
    check(page.locator('#source-search').input_value() == '', 'Bibliography jump resets a hiding filter')
    check(not page.locator('#source-dialog').evaluate('e=>e.open'), 'Bibliography jump closes dialog')

    # Catalogue terminology is an optional, native, keyboard-accessible reference.
    guide = page.locator('#coin-descriptions')
    summary = guide.locator('summary')
    check(not guide.evaluate('e=>e.open'), 'Catalogue guide collapsed by default')
    summary.focus()
    page.keyboard.press('Enter')
    check(guide.evaluate('e=>e.open'), 'Enter opens catalogue guide')
    check(guide.locator('dl').is_visible(), 'Reference definitions visible when expanded')
    check(summary.evaluate('e=>document.activeElement===e'), 'Disclosure retains keyboard focus')
    page.keyboard.press('Space')
    check(not guide.evaluate('e=>e.open'), 'Space closes catalogue guide')
    page.close()

    # Loaded-image math and keyboard behavior using a plainly synthetic grid.
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="white"/><path d="M0 0L1200 800M1200 0L0 800" stroke="black" stroke-width="10"/><text x="100" y="400" font-size="60">TEST FIXTURE — NOT A COIN</text></svg>'
    fixture = 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()
    test_html = HTML.replace(DATA['images']['classic-owl']['url'], fixture)
    page = browser.new_page(viewport={'width':1440,'height':1000})
    page.route('https://**/*', lambda route: route.abort())
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(test_html, wait_until='load')
    page.locator('.hero-photo [data-image]').click()
    page.wait_for_function('document.querySelector("#viewer-image").naturalWidth > 0')
    check(page.locator('#viewer-image').evaluate('e=>e.naturalWidth') == 1200, 'Loaded-image path (synthetic fixture only)')
    page.locator('#image-stage').focus()
    page.keyboard.press('+')
    check(page.locator('#zoom-value').inner_text() == '125%', 'Keyboard zoom in')
    for _ in range(20): page.keyboard.press('+')
    check(page.locator('#zoom-value').inner_text() == '400%', 'Zoom maximum clamp')
    page.keyboard.press('ArrowLeft')
    check('40px' in page.locator('#viewer-image').get_attribute('style'), 'Keyboard pan when enlarged')
    page.keyboard.press('0')
    check(page.locator('#zoom-value').inner_text() == '100%', 'Keyboard fit/reset')
    page.keyboard.press('-')
    check(page.locator('#zoom-value').inner_text() == '100%', 'Zoom minimum clamp')
    page.close()

    for width, height in [(1440,1000),(1024,768),(768,1024),(390,844),(320,740)]:
        page = new_page(browser, width, height, reduced_motion='reduce')
        sizes = page.evaluate('({width:innerWidth,content:document.documentElement.scrollWidth})')
        check(sizes['content'] <= sizes['width'], f'No horizontal page overflow at {width}px')
        check(page.locator('html').evaluate("e=>e.classList.contains('motion-off')"), f'OS reduced motion at {width}px')
        page.locator('#motion-toggle').click()
        check(page.locator('html').evaluate("e=>e.classList.contains('motion-off')"), f'OS preference not overridden at {width}px')
        page.locator('#close-reading').evaluate('e=>window.scrollTo(0,e.offsetTop)')
        page.wait_for_timeout(50)
        sizes = page.evaluate('({width:innerWidth,content:document.documentElement.scrollWidth})')
        check(sizes['content'] <= sizes['width'], f'The close reading has no horizontal overflow at {width}px')
        page.locator('input[name="close-reading-side"][value="obverse"]').check()
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Athena face fits at {width}px')
        page.locator('#close-reading-obverse [data-close-reading]').last.click()
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Selected reading fits at {width}px')
        check(page.locator('#close-reading .detail-buttons').first.evaluate(
            'e=>[...e.querySelectorAll("button")].every(b=>b.getBoundingClientRect().height >= 44)'),
            f'Detail buttons keep a 44px target at {width}px')
        if width in (1440,390):
            page.evaluate('window.scrollTo(0,0)')
            page.screenshot(path=str(SCREENSHOTS / f'hero-{width}.png'))
            page.locator('#atlas-title').evaluate('e=>e.scrollIntoView()')
            page.screenshot(path=str(SCREENSHOTS / f'compare-{width}.png'))
            page.locator('#close-reading').screenshot(path=str(SCREENSHOTS / f'close-reading-{width}.png'))
            page.locator('#classical').screenshot(path=str(SCREENSHOTS / f'classical-{width}.png'))
            page.locator('[id="404"]').screenshot(path=str(SCREENSHOTS / f'crisis-{width}.png'))
        page.close()

        atlas = new_page(browser, width, height, reduced_motion='reduce', markup=ATLAS_HTML)
        check(atlas.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Atlas has no horizontal overflow at {width}px')
        atlas.locator('#pi-ii-specimen [data-compare-preset="pi-pair"]').click()
        check(atlas.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Pi specimen selectors fit at {width}px')
        atlas.locator('#pi-ii-specimen > summary').click()
        check(atlas.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Expanded Pi II exhibit fits at {width}px')
        atlas.locator('#coin-descriptions > summary').click()
        check(atlas.locator('#coin-descriptions').evaluate('e=>e.open'), f'Catalogue guide opens at {width}px')
        check(atlas.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Expanded catalogue guide fits at {width}px')
        if width in (1440,390):
            atlas.locator('#pi-ii-specimen').screenshot(path=str(SCREENSHOTS / f'pi-ii-exhibit-{width}.png'))
            atlas.locator('#coin-descriptions').screenshot(path=str(SCREENSHOTS / f'catalogue-guide-{width}.png'))
        atlas.close()

    page = new_page(browser, java_script_enabled=False)
    check(page.locator('.close-reading-layout:visible').count() == 2, 'Both close-reading faces available without JavaScript')
    check(page.locator('.close-reading-item:visible').count() == len(DATA['closeReading']['readings']) == 6,
          'All six sourced close readings available without JavaScript')
    check(page.locator('#close-reading .detail-buttons').first.is_hidden(), 'Inert detail buttons omitted without JavaScript')
    check(page.locator('.close-reading-faces').is_hidden(), 'Inert face switch omitted without JavaScript')
    check(page.locator('.close-reading-marker').first.is_hidden(), 'The marker, which cannot move, is omitted without JavaScript')
    check(page.locator('#close-reading [data-source]').count() == sum(
        len(r['refs']) for r in DATA['closeReading']['readings']) + len(DATA['closeReading']['coda']['refs']) + 1,
        'Every close-reading citation is in the document without JavaScript')
    check(page.locator('.geo-place:visible').count() == 8, 'All eight geographic views readable without JavaScript')
    check(not page.locator('.geo-controls').is_visible(), 'Inert geographic controls omitted without JavaScript')
    check(page.locator('h1').is_visible(), 'No-JavaScript story visible')
    page.close()

    atlas = new_page(browser, java_script_enabled=False, markup=ATLAS_HTML)
    check(atlas.locator('#sources-title').is_visible(), 'No-JavaScript bibliography visible')
    check(atlas.locator('.family-card').count() == len(DATA['families']), 'No-JavaScript family reference retained')
    check(atlas.locator('#pi-ii-specimen .image-figure').count() == 2, 'No-JavaScript Pi II exhibit retained')
    atlas.locator('#coin-descriptions > summary').click()
    check(atlas.locator('#coin-descriptions dl').is_visible(), 'Reference guide works without JavaScript')
    atlas.close()
    browser.close()
check(not errors, f'No browser JavaScript errors: {errors}')
report = {'result':'pass','checks':len(checks),'items':checks,'javascriptErrors':errors,
          'limitations':['All remote photograph requests deliberately aborted; remote availability was not browser-tested.',
                         'Loaded-image interaction test uses an obvious synthetic grid, never shipped in website.',
                         'Chromium-only smoke tests; Safari, Firefox, real iOS gestures and screen-reader review remain.']}
(ROOT/'research/browser-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} browser smoke checks. External photograph delivery is not validated by this test.')
