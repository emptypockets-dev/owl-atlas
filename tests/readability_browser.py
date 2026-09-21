"""Focused readability/reflow regression checks; optional Playwright + Chromium.

Run after building both HTML pages. External requests are blocked, so this suite
does not verify photographs. It checks selected readable-text roles, navigation,
native dialogs, and no-JavaScript content rather than certifying accessibility.

The 200% case changes the root font size: it exercises text enlargement and rem
layout, not browser zoom or a screen reader. The spacing case applies the WCAG
1.4.12 values independently. Narrow 320 CSS-pixel layouts approximate the width
available at 400% browser zoom on a 1280-pixel desktop; real browser zoom and
assistive-technology testing remain separate work.

Results are printed to stdout; no existing validation reports are overwritten.
Set CHROMIUM_PATH when Chromium is not installed at /usr/bin/chromium.
"""

from pathlib import Path
import json
import os
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
WIDTHS = (1440, 1024, 768, 390, 320)
checks, failures, errors = [], [], []

BODY_TEXT = (
    '.hero-deck, .section-deck, .prose p:not(.micro-copy), '
    '.artifact-step p, .family-card > p:not(.date):not(.status), '
    '.geo-evidence p, .minting-step-copy > p, '
    '.market-summary-prices p, .market-opening-copy > p, '
    '.market-spotlight > p:not(.market-big-price):not(.market-price-note), '
    '.market-block-heading > p, .market-ebay > div > p:not(.micro-copy)'
)
SMALL_TEXT = (
    '.image-credit, .micro-copy, .source-entry details, .source-byline, '
    '.family-card .date, .geo-focus figcaption, .market-method, '
    '.market-price-note, .market-history-figure figcaption, .market-table small'
)


def check(value, label, detail=None):
    checks.append(label)
    if not value:
        failures.append({'check': label, 'detail': detail})


def load(browser, relative, width, javascript=True):
    page = browser.new_page(
        viewport={'width': width, 'height': 1000},
        java_script_enabled=javascript, reduced_motion='reduce',
    )
    page.route('https://**/*', lambda route: route.abort())
    page.route('http://**/*', lambda route: route.abort())
    page.on('pageerror', lambda error: errors.append(f'{relative}: {error}'))
    page.set_content((ROOT / relative).read_text(), wait_until='load')
    return page


def layout(page, label):
    # The header retracts once the reader scrolls down, so measure its geometry
    # where it is on screen: at the top of the page, with the change settled.
    page.evaluate("""async()=>{window.scrollTo({top:0,behavior:'instant'});
      await new Promise(resolve=>setTimeout(resolve,360));}""")
    result = page.evaluate("""() => {
      const controls = [...document.querySelectorAll('.site-header a, .site-header button')]
        .map(e => { const r=e.getBoundingClientRect(); return {
          name:e.id || e.textContent.trim().replace(/\s+/g,' '),
          x:r.left, y:r.top, right:r.right, bottom:r.bottom, w:r.width, h:r.height
        }}).filter(r=>r.w>0 && r.h>0);
      const overlaps=[];
      controls.forEach((a,i)=>controls.slice(i+1).forEach(b=>{
        if (Math.min(a.right,b.right)-Math.max(a.x,b.x)>1 &&
            Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1) overlaps.push([a.name,b.name]);
      }));
      return {
        overflow:document.documentElement.scrollWidth-innerWidth,
        clipped:controls.filter(r=>r.x < -1 || r.right>innerWidth+1 || r.y < -1 || r.bottom>innerHeight),
        short:controls.filter(r=>r.h<43.5), overlaps,
        navCount:[...document.querySelectorAll('.primary-nav a')]
          .filter(e=>e.getBoundingClientRect().width>0).length
      };
    }""")
    check(result['overflow'] <= 1, f'{label}: page reflows without horizontal scrolling', result['overflow'])
    check(not result['clipped'], f'{label}: header controls stay in viewport', result['clipped'])
    check(not result['short'], f'{label}: header targets are at least 44px tall', result['short'])
    check(not result['overlaps'], f'{label}: header targets do not overlap', result['overlaps'])
    check(result['navCount'] == 4, f'{label}: all four navigation destinations remain visible', result['navCount'])


def motion_control(page, label):
    """The motion control left the header for the sticky bar that stays on screen
    while reading. It must remain a full-size, labelled, reachable target there."""
    page.evaluate("""async()=>{window.scrollTo({top:1600,behavior:'instant'});
      await new Promise(resolve=>setTimeout(resolve,420));}""")
    result = page.evaluate("""() => {
      const button=document.querySelector('#motion-toggle');
      const bar=document.querySelector('.chapter-bar')||document.querySelector('.chrome-utility');
      const r=button.getBoundingClientRect(), b=bar.getBoundingClientRect();
      return {width:r.width, height:r.height, top:r.top, bottom:r.bottom,
        inViewport:r.top>=-1 && r.bottom<=innerHeight+1 && r.left>=-1 && r.right<=innerWidth+1,
        insideBar:r.top>=b.top-1 && r.bottom<=b.bottom+1,
        labelled:document.querySelector('#motion-label').textContent.trim().length>0,
        pressed:button.getAttribute('aria-pressed')};
    }""")
    check(result['height'] >= 43.5 and result['width'] >= 43.5,
          f'{label}: motion control keeps a 44px target', result)
    check(result['inViewport'], f'{label}: motion control stays reachable while reading', result)
    check(result['insideBar'], f'{label}: motion control sits in the sticky bar', result)
    check(result['labelled'] and result['pressed'] in ('true', 'false'),
          f'{label}: motion control keeps its label and pressed state', result)
    page.evaluate("""async()=>{window.scrollTo({top:0,behavior:'instant'});
      await new Promise(resolve=>setTimeout(resolve,360));}""")


def text_floor(page, selector, minimum, label):
    result = page.locator(selector).evaluate_all("""(es,minimum) => {
      const visible=es.filter(e=>{const r=e.getBoundingClientRect();
        return r.width>0 && r.height>0 && getComputedStyle(e).visibility!=='hidden';});
      return {count:visible.length, small:visible.filter(e=>parseFloat(getComputedStyle(e).fontSize)<minimum-.1)
        .map(e=>({element:e.id || e.className || e.tagName,
          size:getComputedStyle(e).fontSize, text:e.textContent.trim().slice(0,75)}))};
    }""", minimum)
    check(result['count'] > 0, f'{label}: text sample is present')
    check(not result['small'], f'{label}: visible text is at least {minimum}px', result['small'])


def anchor_clearance(page, fragment, label):
    page.evaluate('(id)=>{location.hash=id}', fragment)
    page.evaluate('async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)}')
    position = page.locator(f'#{fragment}').evaluate('''e=>{
      const header=document.querySelector('.site-header').getBoundingClientRect();
      const bar=document.querySelector('.chapter-bar')?.getBoundingClientRect();
      return {top:e.getBoundingClientRect().top,
        covered:bar&&bar.top<=header.bottom+1?Math.max(header.bottom,bar.bottom):header.bottom};
    }''')
    check(position['top'] >= position['covered'] - 2,
          f'{label}: linked content clears the navigation', position)


def source_keyboard(page, label):
    citation = page.locator('[data-source]:visible').first
    citation.focus()
    page.keyboard.press('Enter')
    dialog = page.locator('#source-dialog')
    check(dialog.evaluate('e=>e.open'), f'{label}: Enter opens source note')
    check(dialog.evaluate('e=>e.contains(document.activeElement)'), f'{label}: focus enters source note')
    browser_focus = False
    for _ in range(6):
        page.keyboard.press('Tab')
        state = dialog.evaluate("""e=>({
          modal:e.open && e.matches(':modal'),
          inside:e.contains(document.activeElement),
          browser:document.activeElement===document.body
        })""")
        # Native Chromium dialogs may include browser chrome in their Tab cycle;
        # activeElement is BODY for that step. This is not focus on the inert
        # page. Preserve that native behavior and ensure the next Tab returns.
        check(state['modal'] and (state['inside'] or state['browser']),
              f'{label}: source-note Tab never focuses background content', state)
        if browser_focus:
            check(state['inside'], f'{label}: Tab returns from browser focus to source note')
        browser_focus = state['browser']
    text_floor(page, '#source-dialog p:not(.micro-copy):not(.source-byline)', 16, f'{label}: source note body')
    page.keyboard.press('Escape')
    check(not dialog.evaluate('e=>e.open'), f'{label}: Escape closes source note')
    check(citation.evaluate('e=>e===document.activeElement'), f'{label}: focus returns to citation')


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True,
    )
    for relative in ('index.html', 'pricing/index.html'):
        for width in WIDTHS:
            label = f'{relative} / {width}px'
            page = load(browser, relative, width)
            layout(page, label)
            text_floor(page, BODY_TEXT, 16, f'{label}: narrative')
            text_floor(page, SMALL_TEXT, 13, f'{label}: supporting text')
            text_floor(page, 'input:not([type=radio]):not([type=range]), select', 16, f'{label}: form text')
            if width in (1440, 390):
                source_keyboard(page, label)
            # Text-only enlargement is deliberately separate from browser zoom.
            sample = page.locator('.hero-deck' if relative == 'index.html' else '.section-deck').first
            before = sample.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
            page.evaluate("document.documentElement.style.fontSize='200%'")
            after = sample.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
            check(after >= before * 1.9, f'{label}: narrative responds to enlarged root text', {'before':before, 'after':after})
            layout(page, f'{label} / 200% root text')
            for fragment in (('minting', 'close-reading') if relative == 'index.html'
                             else ('market-fees-title', 'market-history-title')):
                anchor_clearance(page, fragment, f'{label} / 200% text / {fragment}')
            page.evaluate("document.documentElement.style.fontSize=''")
            spacing = page.add_style_tag(content='''
              * { line-height:1.5!important; letter-spacing:.12em!important;
                  word-spacing:.16em!important; }
              p { margin-bottom:2em!important; }
            ''')
            layout(page, f'{label} / increased text spacing')
            spacing.evaluate('e=>e.remove()')
            motion_control(page, label)
            page.close()

        page = load(browser, relative, 390, javascript=False)
        label = f'{relative} / no JavaScript'
        layout(page, label)
        check(page.locator('h1').count() == 1, f'{label}: one main heading')
        if relative == 'index.html':
            # The home page is the story. The bibliography, the family atlas and
            # the catalogue guide are on /atlas/, which this suite does not load,
            # and the home page carries no native disclosure of its own.
            check(page.locator('.close-reading-layout:visible').count() == 2, f'{label}: both close-reading faces remain readable')
            check(page.locator('.close-reading-item:visible').count() == 6, f'{label}: all six close readings remain readable')
            check(page.locator('.geo-place:visible').count() > 1, f'{label}: place descriptions remain readable')
            check(page.locator('.market-summary-prices:visible').count() > 0, f'{label}: the pricing summary remains readable')
            disclosure = None
        else:
            check(page.locator('.source-entry:visible').count() > 0, f'{label}: bibliography is readable')
            check(page.locator('.market-band:visible').count() == 5, f'{label}: price ranges remain readable')
            disclosure = page.locator('#market-ledger')
        if disclosure is not None:
            disclosure.locator('summary').focus()
            page.keyboard.press('Enter')
            check(disclosure.evaluate('e=>e.open'), f'{label}: native disclosure opens with keyboard')
        page.close()
    browser.close()

check(not errors, 'No unexpected JavaScript errors', errors)
print(json.dumps({
    'passed':len(checks)-len(failures), 'total':len(checks), 'failures':failures,
    'scope':'Selected typography, header geometry, motion-control placement and target size, source keyboard interaction, root-text enlargement, text spacing, and no-JavaScript checks in Chromium. External photographs blocked; not accessibility certification or actual browser zoom coverage.',
}, indent=2))
raise SystemExit(1 if failures else 0)
