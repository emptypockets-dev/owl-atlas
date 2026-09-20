"""Real-photo prototype checks. Uses optional Playwright, never a site dependency.
Serve dist first; BASE_URL defaults to http://127.0.0.1:8765.
Reports/screenshots go to /private/tmp. Chromium geometry is not accessibility certification.
"""
from pathlib import Path
import json, os, time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'src/content.json').read_text())
STORY=DATA['artifactStories']['anatomy']
BASE=os.environ.get('BASE_URL','http://127.0.0.1:8765').rstrip('/')
OUT=Path('/private/tmp')
checks=[]; failures=[]; errors=[]
def check(value,label,detail=None):
    checks.append(label)
    if not value: failures.append({'check':label,'detail':detail})

def settle(page,step):
    page.locator('#anatomy-detail-'+step['id']).evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})')
    page.wait_for_function('(id)=>document.querySelector(".artifact-explorer").dataset.activeStep===id',arg=step['id'])
    page.wait_for_timeout(60)

def geometry(page,label):
    result=page.evaluate('''() => {
      const root=document.querySelector('.artifact-explorer'), sticky=root.querySelector('.artifact-sticky');
      const header=document.querySelector('.site-header').getBoundingClientRect();
      const bar=document.querySelector('.chapter-bar').getBoundingClientRect();
      const stage=sticky.getBoundingClientRect();
      const current=root.querySelector('.artifact-step.is-active h4').getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth-innerWidth,
        pinned:!root.classList.contains('is-unpinned'),stickyTop:stage.top,stickyBottom:stage.bottom,
        navigationBottom:Math.max(header.bottom,bar.bottom),headingTop:current.top,
        available:innerHeight-stage.bottom,compact:innerWidth<=900};
    }''')
    check(result['overflow']<=1,label+': no horizontal overflow',result)
    if result['pinned']:
        check(result['stickyTop']>=result['navigationBottom']-2,label+': stage clears navigation',result)
        if result['compact']:
            check(result['headingTop']>=result['stickyBottom']-2,label+': narrative clears pinned stage',result)
            check(result['available']>=185,label+': useful mobile reading space remains',result)
    return result

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True)
    for width,height in [(1440,1000),(1024,900),(768,1024),(390,844),(320,740),(844,390)]:
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
        page.add_init_script('''window.artifactCLS=0; new PerformanceObserver(list=>{
          for(const entry of list.getEntries()) if(!entry.hadRecentInput &&
            entry.sources?.some(s=>s.node?.closest?.('.artifact-explorer')))
            window.artifactCLS+=entry.value;
        }).observe({type:'layout-shift',buffered:true});''')
        page.on('pageerror',lambda e:errors.append(str(e)))
        response=page.goto(BASE+'/#anatomy',wait_until='domcontentloaded')
        check(response.status==200,f'{width}: HTTP 200')
        for side,face in STORY['faces'].items():
            img=page.locator(f'[data-artifact-face="{side}"] img')
            page.wait_for_function('(side)=>{const e=document.querySelector(`[data-artifact-face="${side}"] img`);return e.complete&&e.naturalWidth>0}',arg=side)
            actual=img.evaluate('e=>[e.naturalWidth,e.naturalHeight]')
            record=DATA['images'][face['image']]
            check(actual==[record['width'],record['height']],f'{width}: real {side} image dimensions',actual)
        check(page.evaluate('window.artifactCLS')<.05,f'{width}: no substantial initial artifact layout shift',page.evaluate('window.artifactCLS'))
        for step in STORY['steps']+list(reversed(STORY['steps'])):
            settle(page,step)
            label=f'{width}×{height} / {step["id"]}'
            check(page.locator('.artifact-inspect').get_attribute('data-image')==STORY['faces'][step['state']['side']]['image'],label+': matching source photo')
            check(page.locator('.artifact-nav [aria-current]').count()==1,label+': one active progress link')
            result=geometry(page,label)
            if width in (390,320) and step['id']=='eye':
                check(result['pinned'],label+': narrow-phone artifact stays visible')
            # All authored focus points are on the full source photo, including letterboxing.
            error=page.locator(f'[data-artifact-face="{step["state"]["side"]}"] img').evaluate('''(img,focus)=>{
              const r=img.getBoundingClientRect(),s=document.querySelector('.artifact-stage').getBoundingClientRect();
              return {x:Math.abs(r.left+r.width*focus.x-(s.left+s.width/2)),
                y:Math.abs(r.top+r.height*focus.y-(s.top+s.height/2))};
            }''',step['state']['focus'])
            check(error['x']<2 and error['y']<2,label+': normalized point centered',error)
            if width in (1440,390,320) and step['id'] in ('athena','eye','helmet','owl','crescent','identity','money'):
                page.screenshot(path=str(OUT/f'owl-artifact-{width}-{step["id"]}.png'))
        for index in [0,7,2,6,1]: settle(page,STORY['steps'][index])
        check(page.locator('.artifact-explorer').get_attribute('data-active-step')=='eye',f'{width}: fast arbitrary jumps settle correctly')
        page.evaluate("document.documentElement.style.fontSize='200%'")
        page.wait_for_timeout(150)
        settle(page,STORY['steps'][6]); geometry(page,f'{width}: 200% root text')
        check(page.locator('.artifact-step p').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=32,f'{width}: enlarged narrative')
        page.close()

    # Direct deep links must work without visiting the exhibit introduction first.
    for step in STORY['steps']:
        page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
        page.goto(BASE+'/#anatomy-detail-'+step['id'],wait_until='load')
        page.wait_for_timeout(180)
        check(page.locator('.artifact-explorer').get_attribute('data-active-step')==step['id'],step['id']+': initial mobile deep link')
        geometry(page,step['id']+': initial deep link')
        page.close()

    # Default motion: actual interpolation, two directions and interruption mid-turn.
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
    page.goto(BASE+'/#anatomy',wait_until='load')
    settle(page,STORY['steps'][0]);page.wait_for_timeout(1100)
    before=page.locator('.artifact-camera').evaluate('e=>getComputedStyle(e).transform')
    settle(page,STORY['steps'][1]);page.wait_for_timeout(220)
    during=page.locator('.artifact-camera').evaluate('e=>getComputedStyle(e).transform')
    page.wait_for_timeout(1100)
    after=page.locator('.artifact-camera').evaluate('e=>getComputedStyle(e).transform')
    check(len({before,during,after})==3,'Normal motion interpolates between camera states')
    settle(page,STORY['steps'][3]);page.wait_for_timeout(1600)
    check(page.locator('.artifact-turn').evaluate('e=>new DOMMatrix(getComputedStyle(e).transform).m11')<-.99,'Forward turn reaches reverse')
    settle(page,STORY['steps'][2]);page.wait_for_timeout(1600)
    check(page.locator('.artifact-turn').evaluate('e=>new DOMMatrix(getComputedStyle(e).transform).m11')>.99,'Backward turn returns to obverse')
    settle(page,STORY['steps'][3]);page.wait_for_timeout(420);settle(page,STORY['steps'][1]);page.wait_for_timeout(1600)
    check(page.locator('.artifact-turn').evaluate('e=>new DOMMatrix(getComputedStyle(e).transform).m11')>.99,'Interrupted flip settles on the latest side')
    page.locator('#motion-toggle').click();settle(page,STORY['steps'][6])
    check(page.locator('.artifact-camera').evaluate('e=>getComputedStyle(e).transitionDuration')=='0s','Manual reduced motion removes camera animation')
    check(page.locator('.artifact-turn').evaluate('e=>new DOMMatrix(getComputedStyle(e).transform).m11')<-.99,'Reduced motion changes side immediately')
    check(page.locator('.artifact-stage').evaluate('e=>e.getAnimations({subtree:true}).length')==0,'Reduced-motion stage has no running animations')
    page.close()
    check(not errors,'No JavaScript errors',errors)
    browser.close()

report={'url':BASE,'passed':len(checks)-len(failures),'total':len(checks),'failures':failures,'checks':checks,
 'scope':'Real existing coin images; Chromium; forward/backward/jump camera states; native focus coordinates; mobile and desktop; 200% root text; deep links; normal/reduced/interrupted motion.'}
name='owl-artifact-hosted-qa.json' if BASE.startswith('https:') else 'owl-artifact-local-qa.json'
(OUT/name).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('url','passed','total','failures')},indent=2))
raise SystemExit(bool(failures))
