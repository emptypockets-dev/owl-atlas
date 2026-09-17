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
DATA = json.loads((ROOT / 'src/content.json').read_text())
SCREENSHOTS = ROOT / 'research/screenshots'
SCREENSHOTS.mkdir(parents=True, exist_ok=True)
checks = []
errors = []

def check(value, label):
    if not value:
        raise AssertionError(label)
    checks.append(label)

def new_page(browser, width=1440, height=1000, reduced_motion='no-preference', java_script_enabled=True):
    page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion=reduced_motion, java_script_enabled=java_script_enabled)
    page.route('https://**/*', lambda route: route.abort())
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(HTML, wait_until='load')
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

    # Guided geography uses native controls and keeps one complete reading panel visible.
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

    # All anatomy views and both faces of every family comparison.
    check(page.locator('#anatomy-reverse').is_visible() and not page.locator('#anatomy-obverse').is_visible(), 'Close reading starts on the owl reverse')
    for detail in DATA['anatomy']:
        page.locator(f'input[name="anatomy-side"][value="{detail["side"]}"]').check()
        button = page.locator(f'[data-detail="{detail["id"]}"]')
        button.focus()
        page.keyboard.press('Enter')
        panel = page.locator(f'#anatomy-{detail["side"]}')
        check(button.get_attribute('aria-pressed') == 'true', f'Anatomy keyboard selection: {detail["id"]}')
        check(panel.locator('.anatomy-reading:visible h4').inner_text() == detail['title'], f'Anatomy text: {detail["id"]}')
        check(page.locator('[data-anatomy-side]:visible').count() == 1 and panel.locator('[data-detail][aria-pressed="true"]').count() == 1, f'One active face and detail: {detail["id"]}')
        check(panel.locator('[data-image]').get_attribute('data-image') == detail['image'], f'Correct photograph and viewer link: {detail["id"]}')
        check(panel.locator('.anatomy-marker').inner_text() == str(DATA['anatomy'].index(detail) + 1), f'Marker agrees with selected detail: {detail["id"]}')
    face = page.locator('input[name="anatomy-side"][value="obverse"]')
    face.focus()
    page.keyboard.press('ArrowLeft')
    check(page.locator('#anatomy-reverse').is_visible() and page.locator('[data-detail="square"]').get_attribute('aria-pressed') == 'true', 'Keyboard face toggle remembers reverse detail')
    page.keyboard.press('ArrowRight')
    check(page.locator('#anatomy-obverse').is_visible() and page.locator('[data-detail="helmet"]').get_attribute('aria-pressed') == 'true', 'Keyboard face toggle remembers obverse detail')
    page.emulate_media(media='print')
    check(page.locator('[data-anatomy-side]:visible').count() == 2 and page.locator('.anatomy-reading:visible').count() == 6, 'Both faces and all readings available in print')
    page.emulate_media(media='screen')
    for side in ['obverse', 'reverse']:
        page.locator(f'input[name="compare-side"][value="{side}"]').check()
        for family in DATA['families']:
            page.locator('#compare-left').select_option(family['id'])
            check(page.locator('#compare-panel-left h3').inner_text() == family['name'], f'Comparison {family["id"]}/{side}')
            expected_gap = not family.get(side)
            check(bool(page.locator('#compare-panel-left .photo-gap').count()) == expected_gap, f'Honest photo coverage {family["id"]}/{side}')
    # Edition 02: new museum specimens are integrated, not orphan image records.
    for image_id, image in DATA['images'].items():
        if not image.get('specimenId'): continue
        check(page.locator(f'#after-athens [data-image="{image_id}"]').count() == 1, f'Narrative image present: {image_id}')
    check(page.locator('#pi-style .image-figure').count() == 2, 'Pi III exhibit contains both sides')
    check(page.locator('#later-old-style .image-figure').count() == 2, 'Quadridigité exhibit contains both sides')
    page.locator('#pi-ii-specimen > summary').click()
    check(page.locator('#pi-ii-specimen').get_attribute('open') is not None, 'Pi II supplementary exhibit opens')
    page.locator('#pi-ii-specimen [data-image]').first.click()
    check('Pi II' in page.locator('#image-dialog-title').inner_text(), 'Pi II viewer uses specific title')
    check(page.locator('#viewer-object').get_attribute('href') == DATA['specimens']['bnf-pi-ii-1469']['objectUrl'], 'Viewer links exact BnF object')
    check('Reuse review pending' in page.locator('#viewer-rights').inner_text(), 'BnF rights caveat visible in viewer')
    check(page.locator('#viewer-policy').is_visible(), 'BnF policy link visible')
    check('393–295' in page.locator('#viewer-date').inner_text(), 'Broad Pi II catalogue date preserved')
    page.keyboard.press('Escape')
    page.locator('#pi-style [data-compare-preset="pi-pair"]').click()
    check(page.locator('#compare-left-specimen').input_value() == 'bnf-pi-ii-1469', 'Preset selects Pi II on left')
    check(page.locator('#compare-right-specimen').input_value() == 'bnf-pi-iii-1475', 'Preset selects Pi III on right')
    check(page.locator('input[name="compare-side"][value="obverse"]').is_checked(), 'Preset starts with Athena faces')
    for side in ['obverse', 'reverse']:
        page.locator(f'input[name="compare-side"][value="{side}"]').check()
        for position, sid in [('left','bnf-pi-ii-1469'), ('right','bnf-pi-iii-1475')]:
            check(page.locator(f'#compare-panel-{position} [data-image]').first.get_attribute('data-image') == DATA['specimens'][sid][side], f'Exact paired image: {position}/{sid}/{side}')
    page.locator('#compare-left-specimen').select_option('bnf-pi-iii-1475')
    check(page.locator('#compare-panel-left [data-image]').first.get_attribute('data-image') == 'bnf-pi-iii-1475-reverse', 'Specimen switch preserves selected reverse side')
    page.locator('#later-old-style [data-compare-preset="late-bridge"]').click()
    check(page.locator('#compare-right').input_value() == 'late-old', 'Bridge preset selects later Old Style')
    check(page.locator('#compare-panel-right [data-image]').first.get_attribute('data-image') == 'bnf-quadridigite-1478-obverse', 'Bridge preset uses quadridigité obverse')
    check(page.locator('#compare-right-specimen-control').is_hidden(), 'Single-specimen family hides redundant selector')
    page.locator('#compare-left').select_option('classical')
    page.locator('#compare-right').select_option('new')
    check(page.locator('#compare-specimen-tools').is_hidden(), 'Unused specimen toolbar hidden')
    page.locator('.hero-photo [data-image]').click()
    check(page.locator('#viewer-rights').is_hidden(), 'BnF reuse warning does not leak into unrelated images')
    check(page.locator('#viewer-policy').is_hidden(), 'BnF policy link does not leak into unrelated images')
    page.keyboard.press('Escape')
    page.locator('#pi-style .reuse-badge').first.click()
    check(page.locator('#image-reuse-policy').get_attribute('open') is not None, 'Reuse badge opens detailed policy disclosure')
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
        page.locator('#atlas').evaluate('e=>window.scrollTo(0,e.offsetTop)')
        page.wait_for_timeout(50)
        sizes = page.evaluate('({width:innerWidth,content:document.documentElement.scrollWidth})')
        check(sizes['content'] <= sizes['width'], f'Atlas has no horizontal overflow at {width}px')
        page.locator('#pi-style [data-compare-preset="pi-pair"]').click()
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Pi specimen selectors fit at {width}px')
        page.locator('#pi-ii-specimen > summary').click()
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Expanded Pi II exhibit fits at {width}px')
        page.locator('#coin-descriptions > summary').click()
        check(page.locator('#coin-descriptions').evaluate('e=>e.open'), f'Catalogue guide opens at {width}px')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Expanded catalogue guide fits at {width}px')
        if width in (1440,390):
            page.evaluate('window.scrollTo(0,0)')
            page.screenshot(path=str(SCREENSHOTS / f'hero-{width}.png'))
            page.locator('#atlas-title').evaluate('e=>e.scrollIntoView()')
            page.screenshot(path=str(SCREENSHOTS / f'compare-{width}.png'))
            page.locator('#pi-style').screenshot(path=str(SCREENSHOTS / f'pi-exhibit-{width}.png'))
            page.locator('#later-old-style').screenshot(path=str(SCREENSHOTS / f'late-exhibit-{width}.png'))
            page.locator('#classical').screenshot(path=str(SCREENSHOTS / f'classical-{width}.png'))
            page.locator('[id="404"]').screenshot(path=str(SCREENSHOTS / f'crisis-{width}.png'))
            page.locator('#coin-descriptions').screenshot(path=str(SCREENSHOTS / f'catalogue-guide-{width}.png'))
        page.close()

    page = new_page(browser, java_script_enabled=False)
    check(page.locator('[data-anatomy-side]:visible').count() == 2, 'Both close-reading faces available without JavaScript')
    check(page.locator('.anatomy-reading:visible').count() == len(DATA['anatomy']), 'All sourced close readings available without JavaScript')
    check(not page.locator('.anatomy-faces').is_visible() and page.locator('#anatomy [data-detail]:visible').count() == 0, 'Inert anatomy controls omitted without JavaScript')
    check(page.locator('.geo-place:visible').count() == 8, 'All eight geographic views readable without JavaScript')
    check(not page.locator('.geo-controls').is_visible(), 'Inert geographic controls omitted without JavaScript')
    check(page.locator('h1').is_visible(), 'No-JavaScript story visible')
    check(page.locator('#sources-title').is_visible(), 'No-JavaScript bibliography visible')
    check(page.locator('.family-card').count() == len(DATA['families']), 'No-JavaScript family reference retained')
    page.locator('#coin-descriptions > summary').click()
    check(page.locator('#coin-descriptions dl').is_visible(), 'Reference guide works without JavaScript')
    page.close()
    browser.close()
check(not errors, f'No browser JavaScript errors: {errors}')
report = {'result':'pass','checks':len(checks),'items':checks,'javascriptErrors':errors,
          'limitations':['All remote photograph requests deliberately aborted; remote availability was not browser-tested.',
                         'Loaded-image interaction test uses an obvious synthetic grid, never shipped in website.',
                         'Chromium-only smoke tests; Safari, Firefox, real iOS gestures and screen-reader review remain.']}
(ROOT/'research/browser-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} browser smoke checks. External photograph delivery is not validated by this test.')
