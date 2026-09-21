"""Focused smoke test for the homepage/reference-page split.

Run after build:deploy with optional Playwright/Chromium. External photographs
are blocked; this does not verify their live delivery. The older browser_smoke
suite assumes reference controls share the homepage and is not run here.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import functools,json,os,threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'src/content.json').read_text())
checks=[]
errors=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'dist')))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
def check(ok,label):
    if not ok: raise AssertionError(label)
    checks.append(label)
def load(browser,path='/',width=1440,javascript=True):
    page=browser.new_page(viewport={'width':width,'height':900},java_script_enabled=javascript,reduced_motion='reduce')
    page.set_default_timeout(10000)
    page.route('https://**/*',lambda route:route.abort())
    page.on('pageerror',lambda error:errors.append(str(error)))
    response=page.goto(BASE+path,wait_until='load')
    check(response.status==200,f'{path}: HTTP 200')
    return page

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True)
    home=load(browser)
    check(home.locator('.family-card').count()==0,'Homepage omits detailed family cards')
    check(home.locator('.source-entry').count()==0,'Homepage omits the full bibliography')
    check(home.locator('h1').count()==1,'Homepage retains one main heading')
    check(home.locator('a[href="one-owl/"]').count()>0,'Homepage retains the One Owl journey link')
    for fragment in ('origins','classical','close-reading','pricing','one-owl'):
        check(home.locator(f'#{fragment}').count()==1,f'Homepage preserves #{fragment}')
    new_height=home.evaluate('document.documentElement.scrollHeight')
    baseline=Path('/private/tmp/owl-before-reference-split.html')
    heights={'width':1440,'after':new_height}
    if baseline.exists():
        before=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
        before.route('https://**/*',lambda route:route.abort())
        before.set_content(baseline.read_text(),wait_until='load')
        heights['before']=before.evaluate('document.documentElement.scrollHeight')
        heights['reductionPercent']=round(100*(1-new_height/heights['before']),1)
        check(new_height<heights['before'],'Homepage is shorter than the pre-split build at 1440px')
        before.close()
    citation=home.locator('.object-caption [data-source]').first
    source=citation.get_attribute('data-source')
    citation.focus();home.keyboard.press('Enter')
    check(home.locator('#source-dialog').evaluate('e=>e.open&&e.matches(":modal")'),'Homepage citation opens native source dialog')
    home.keyboard.press('Escape')
    check(citation.evaluate('e=>e===document.activeElement'),'Source dialog restores homepage citation focus')
    citation.click();home.locator('[data-bibliography-jump]').click()
    home.wait_for_url(f'**/atlas/#source-{source}')
    check(home.locator(f'#source-{source}').is_visible(),'Homepage source jump reaches reference bibliography')
    atlas=load(browser,'/atlas/')
    check(atlas.locator('h1').count()==1,'Reference page has one main heading')
    check(atlas.locator('.family-card').count()==len(DATA['families'])==8,'Reference page retains eight coin families')
    check(atlas.locator('.source-entry').count()==len(DATA['sources'])==50,'Reference page retains 50 source records')
    for side in ('obverse','reverse'):
        atlas.locator(f'input[name="compare-side"][value="{side}"]').check()
        for family in DATA['families']:
            atlas.locator('#compare-left').select_option(family['id'])
            check(atlas.locator('#compare-panel-left h3').inner_text()==family['name'],f'Comparison: {family["id"]}/{side}')
    for preset,specimens in [('pi-pair',('bnf-pi-ii-1469','bnf-pi-iii-1475')),('late-bridge',('bnf-pi-iii-1475','bnf-quadridigite-1478'))]:
        home.goto(BASE+'/',wait_until='load')
        home.locator(f'[data-compare-preset="{preset}"]').first.click()
        home.wait_for_url(f'**/atlas/?compare={preset}#atlas')
        for position,specimen in zip(('left','right'),specimens):
            check(home.locator(f'#compare-{position}-specimen').input_value()==specimen,f'{preset}: correct {position} specimen')
        check(home.locator('input[name="compare-side"][value="obverse"]').is_checked(),f'{preset}: begins with obverse faces')
    atlas.locator('#source-search').fill('Kroll')
    check(1<atlas.locator('.source-entry:visible').count()<50,'Reference bibliography search works')
    atlas.locator('#source-search').fill('')
    atlas.locator('[data-source]').first.click()
    check(atlas.locator('#source-dialog').evaluate('e=>e.open'),'Reference citation opens a source dialog')
    atlas.keyboard.press('Escape')
    for fragment in ('atlas','sources','family-pi','image-reuse-policy'):
        home.goto(BASE+'/#'+fragment,wait_until='load')
        home.wait_for_url('**/atlas/#'+fragment)
        check(home.locator('#'+fragment).count()==1,f'Legacy bookmark redirects: #{fragment}')
    for width in (1440,390,320):
        for path in ('/','/atlas/'):
            page=load(browser,path,width)
            check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{path} at {width}px: no horizontal overflow')
            if path=='/atlas/' and width in (1440,320):
                page.screenshot(path=f'/private/tmp/owl-reference-split-atlas-{width}.png')
            if path=='/' and width in (1440,320):
                page.locator('#atlas').evaluate('e=>e.scrollIntoView({block:"start",behavior:"instant"})')
                page.screenshot(path=f'/private/tmp/owl-reference-split-home-end-{width}.png')
            page.close()
    for path in ('/','/atlas/'):
        page=load(browser,path,390,javascript=False)
        check(page.locator('h1').is_visible(),f'{path}: no-JavaScript heading is readable')
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{path}: no-JavaScript mobile reflow')
        if path=='/atlas/':
            check(page.locator('.family-card:visible').count()==8,'No-JavaScript reference retains all families')
            check(page.locator('.source-entry:visible').count()==50,'No-JavaScript reference retains all sources')
            page.locator('#coin-descriptions>summary').click()
            check(page.locator('#coin-descriptions').evaluate('e=>e.open'),'No-JavaScript catalogue disclosure works')
        else:
            link=page.locator('.object-caption [data-source]').first
            source=link.get_attribute('data-source')
            link.click();page.wait_for_url(f'**/atlas/#source-{source}')
            check(page.locator('#source-'+source).is_visible(),'No-JavaScript homepage citation reaches its source')
        page.close()
    browser.close()
server.shutdown()
check(not errors,f'No JavaScript errors: {errors}')
report={'result':'pass','checks':len(checks),'items':checks,'homepageHeight':heights,'javascriptErrors':errors,'limitations':['Targeted split-page smoke; external photography blocked. The older single-page browser_smoke suite needs further migration for reference controls now on /atlas/.']}
Path('/private/tmp/owl-reference-split-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'result':'pass','checks':len(checks),'homepageHeight':heights,'report':'/private/tmp/owl-reference-split-qa.json'},indent=2))
