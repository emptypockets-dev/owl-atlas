import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup, marketMoney, derivedSources, derivedSrcset, photoSizesFor, photoMaxWidthFor} from './render.mjs';

/**
 * Progressive enhancement only. The full story, credits and bibliography are
 * rendered at build time. Nothing depends on a framework, CDN script or API key.
 */
const dataElement = document.querySelector('#atlas-data');
if (!dataElement?.textContent) throw new Error('The atlas content is missing.');
const data = JSON.parse(dataElement.textContent);
document.documentElement.classList.add('has-js');
const byId = (id) => document.getElementById(id);
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyReduced = false;
try { manuallyReduced = localStorage.getItem('owl-atlas-motion') === 'off'; } catch { /* Storage is optional. */ }
let motionOff = manuallyReduced || motionQuery.matches;

function syncMotion() {
  motionOff = manuallyReduced || motionQuery.matches;
  document.documentElement.classList.toggle('motion-off', motionOff);
  byId('motion-toggle').setAttribute('aria-pressed', String(motionOff));
  byId('motion-label').textContent = motionOff ? 'Motion off' : 'Motion on';
  byId('motion-toggle').title = motionQuery.matches
    ? 'Your system prefers reduced motion; decorative animation is disabled.'
    : motionOff ? 'Turn on decorative animation' : 'Turn off decorative animation';
  updateScroll();
}
byId('motion-toggle').addEventListener('click', () => {
  // Do not override an operating-system accessibility preference.
  if (motionQuery.matches) return;
  manuallyReduced = !manuallyReduced;
  try { localStorage.setItem('owl-atlas-motion', manuallyReduced ? 'off' : 'on'); } catch { /* No persistence needed. */ }
  syncMotion();
});
motionQuery.addEventListener('change', syncMotion);

/** Error treatment is visible and keeps both attribution and source links usable. */
function watchImages(root = document) {
  root.querySelectorAll('.image-trigger img').forEach((image) => {
    if (image.dataset.watched) return;
    image.dataset.watched = 'true';
    const showError = () => image.closest('.image-surface')?.classList.add('has-error');
    const showLoaded = () => {
      image.closest('.image-surface')?.classList.remove('has-error');
      image.dataset.loaded = 'true';
    };
    image.addEventListener('error', showError, {once: true});
    image.addEventListener('load', showLoaded, {once: true});
    if (image.complete && image.currentSrc) image.naturalWidth ? showLoaded() : showError();
  });
}
watchImages();

// Reveals never remove content from the accessibility tree or change scroll physics.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.replace('is-waiting', 'is-visible');
      revealObserver.unobserve(entry.target);
    }
  }, {rootMargin: '0px 0px 55px 0px', threshold: 0.035});
  document.querySelectorAll('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top <= window.innerHeight) element.classList.add('is-visible');
    else element.classList.add('is-waiting');
    revealObserver.observe(element);
  });
}

const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
// Reserve the label's natural wrapped height so chapter changes cannot move
// the sticky bar over a native anchor destination. Spacers are not announced.
const chapterCurrent = document.querySelector('.chapter-current');
if (chapterCurrent) {
  for (const chapter of chapters) {
    const spacer = document.createElement('span');
    spacer.setAttribute('aria-hidden', 'true');
    spacer.textContent = chapter.dataset.chapter;
    chapterCurrent.append(spacer);
  }
}
const hero = byId('top');
const heroObject = byId('hero-object');
const crisis = byId('404');
const crisisYear = crisis?.querySelector('.crisis-year');

// The header gives the screen back while reading: it retracts after a short
// downward scroll and returns on any upward move, at the top of the page, when
// focus enters it, and while a dialog is open. Nothing here drives the scroll
// position; it only reflects the direction the reader chose. The effective
// height is published as --header-visible so sticky chrome, anchor landings and
// the Anatomy stage measure what is on screen rather than what is in the markup.
const siteHeader = document.querySelector('.site-header');
const HEADER_GRACE = 120;
let headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height);
let headerHidden = false;
let headerPinned = false;
let lastScrollY = Math.max(0, window.scrollY);
let anchorScrollUntil = 0;
let anchorScrollLimit = 0;
function publishHeaderOffset() {
  document.documentElement.style.setProperty('--header-visible', `${headerHidden ? 0 : headerHeight}px`);
}
function setHeaderHidden(hidden) {
  if (hidden === headerHidden) return;
  headerHidden = hidden;
  document.documentElement.classList.toggle('header-hidden', hidden);
  publishHeaderOffset();
}
function updateHeaderVisibility() {
  const position = Math.max(0, window.scrollY);
  const previous = lastScrollY;
  lastScrollY = position;
  if (headerPinned || siteHeader.contains(document.activeElement)) return setHeaderHidden(false);
  if (position <= HEADER_GRACE) return setHeaderHidden(false);
  // Hold the current state while a fragment jump is in flight. The browser has
  // already chosen the landing position from scroll-padding-top; changing the
  // header underneath it would move the destination after the fact.
  if (performance.now() < anchorScrollUntil) {
    anchorScrollUntil = Math.min(anchorScrollLimit, performance.now() + 220);
    return;
  }
  if (position > previous) setHeaderHidden(true);
  else if (position < previous) setHeaderHidden(false);
}
// A smooth jump keeps the hold while it is still moving, but never past a fixed
// ceiling: a stalled animation must not freeze the header for the whole session.
function holdHeaderForAnchor() {
  anchorScrollUntil = performance.now() + 700;
  anchorScrollLimit = performance.now() + 2500;
}
document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (link?.hash && link.host === location.host && link.pathname === location.pathname) holdHeaderForAnchor();
}, true);
window.addEventListener('hashchange', holdHeaderForAnchor);
// A deliberate gesture always wins over an animation still in progress.
for (const name of ['wheel', 'touchstart', 'keydown']) {
  window.addEventListener(name, () => { anchorScrollUntil = 0; }, {passive: true});
}
siteHeader.addEventListener('focusin', () => setHeaderHidden(false));
publishHeaderOffset();

let scheduled = false;
function updateScroll() {
  scheduled = false;
  updateHeaderVisibility();
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  byId('reading-fill').style.transform = `scaleX(${percentage})`;
  let active = chapters[0];
  const visibleHeader = headerHidden ? 0 : headerHeight;
  for (const chapter of chapters) {
    if (chapter.getBoundingClientRect().top <= visibleHeader + 150) active = chapter;
    else break;
  }
  if (active && byId('current-chapter')) byId('current-chapter').textContent = active.dataset.chapter;
  if (!motionOff && window.innerWidth > 760 && hero && heroObject && crisisYear) {
    const heroTop = hero.getBoundingClientRect().top;
    const offset = Math.min(1100, Math.max(0, -heroTop));
    heroObject.style.transform = `translateY(${offset * 0.105}px) rotate(${offset * 0.002}deg)`;
    const rect = crisis.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    crisisYear.style.transform = `translateY(${(progress - .5) * 34}px)`;
  } else {
    heroObject?.style.removeProperty('transform');
    crisisYear?.style.removeProperty('transform');
  }
}
function requestScrollUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }
window.addEventListener('scroll', requestScrollUpdate, {passive: true});
// Keep deep links clear of wrapping navigation, including enlarged browser text.
function syncNavigationHeight() {
  const root = document.documentElement;
  headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height);
  root.style.setProperty('--header', `${headerHeight}px`);
  publishHeaderOffset();
  const bar = document.querySelector('.chapter-bar') || document.querySelector('.chrome-utility');
  root.style.setProperty('--bar', `${bar ? Math.ceil(bar.getBoundingClientRect().height) : 0}px`);
  requestScrollUpdate();
}
if ('ResizeObserver' in window) {
  const navigationObserver = new ResizeObserver(syncNavigationHeight);
  navigationObserver.observe(siteHeader);
  const bar = document.querySelector('.chapter-bar') || document.querySelector('.chrome-utility');
  if (bar) navigationObserver.observe(bar);
}
syncNavigationHeight();
window.addEventListener('resize', requestScrollUpdate, {passive: true});
syncMotion();

/* The hero coin is an object in a room, and it has two real faces.
 *
 * Both belong to the same specimen and both are already self-hosted:
 * classic-owl is the reverse (Cleveland 1941.296.b) and classic-athena the
 * obverse (1941.296.a), CC0. The turning structure is built here rather than
 * written into src/page.html, so without JavaScript the hero stays exactly the
 * owl photograph it has always been. The scroll parallax owns #hero-object's
 * transform, so the rotation goes on an inner element and the two never fight.
 * The obverse derivative is requested only once the owl has loaded, and the
 * head still preloads one image.
 */
const HERO_TURN_MS = 1400;      // must match the .hero-turn transition in styles.css
const heroFaces = {
  reverse: {image: 'classic-owl', label: 'Owl · reverse'},
  obverse: {image: 'classic-athena', label: 'Athena · obverse'},
};
function setupHeroCoin() {
  const figure = document.querySelector('.hero-photo');
  const trigger = figure?.querySelector('.image-trigger');
  const frame = trigger?.querySelector('.image-frame');
  const owlImage = frame?.querySelector('img');
  const controls = byId('hero-turn-controls');
  const button = byId('hero-turn');
  const faceLabel = byId('hero-face-label');
  const obverse = data.images[heroFaces.obverse.image];
  if (!figure || !trigger || !frame || !owlImage || !controls || !button || !faceLabel || !obverse) return;

  // Perspective sits on the trigger (see styles.css), so the link stays a flat,
  // always-clickable overlay above both faces and "Look closer" keeps working.
  const turn = document.createElement('div');
  turn.className = 'hero-turn';
  frame.before(turn);
  turn.append(frame);
  // The same thin stacked-edge illusion the Anatomy exhibit uses.
  for (const depth of [-2, -1, 0, 1, 2]) {
    const edge = document.createElement('span');
    edge.className = 'hero-edge';
    edge.setAttribute('aria-hidden', 'true');
    edge.style.setProperty('--edge-z', `${depth}px`);
    turn.append(edge);
  }
  const back = document.createElement('span');
  back.className = 'hero-face-back';
  back.setAttribute('aria-hidden', 'true');
  turn.append(back);
  const surface = frame.closest('.image-surface');

  // The class is the CSS contract and the variable is the site's own state.
  // Reading both means an inspector (or a review harness) that sets the class
  // directly also stops a turn in progress, not just its transition.
  const noMotion = () => motionOff || document.documentElement.classList.contains('motion-off');

  let side = 'reverse';
  let edgeTimer = 0;
  let identityTimer = 0;
  let wasStill = false;
  // The coin only turns when the reader asks, so every rename is worth announcing.
  faceLabel.setAttribute('aria-live', 'polite');

  // Everything that names the visible face: the caption, which face the
  // accessibility tree exposes, and what the viewer will open.
  function applyIdentity(next) {
    const face = heroFaces[next];
    const image = data.images[face.image];
    frame.setAttribute('aria-hidden', String(next !== 'reverse'));
    back.setAttribute('aria-hidden', String(next !== 'obverse'));
    faceLabel.textContent = face.label;
    trigger.dataset.image = face.image;
    trigger.href = image.localUrl || image.url;
    trigger.setAttribute('aria-label', `Inspect ${image.title} in the image viewer`);
  }

  function showFace(next, immediate = false) {
    const still = immediate || noMotion();
    side = next;
    clearTimeout(edgeTimer);
    clearTimeout(identityTimer);
    turn.classList.remove('is-turning');
    turn.style.transitionDuration = still ? '0ms' : '';
    // The pressed state is the control answering the reader, so it flips at once.
    button.setAttribute('aria-pressed', String(next === 'obverse'));
    if (still) applyIdentity(next);
    else {
      void turn.offsetWidth;  // restart the edge keyframes for this turn
      turn.classList.add('is-turning');
      // The caption renames the face as the coin passes edge-on, not before it.
      identityTimer = setTimeout(() => applyIdentity(next), HERO_TURN_MS / 2);
      edgeTimer = setTimeout(() => turn.classList.remove('is-turning'), HERO_TURN_MS);
    }
    turn.style.transform = `rotateY(${next === 'obverse' ? 180 : 0}deg)`;
  }

  button.addEventListener('click', () => showFace(side === 'reverse' ? 'obverse' : 'reverse'));

  // Turning motion off mid-turn stops the coin where it is rather than
  // finishing a rotation the reader has just asked not to see.
  // documentElement's class list also carries the retracting header, so only a
  // real change into the motion-off state is worth reacting to.
  new MutationObserver(() => {
    const still = noMotion();
    if (still === wasStill) return;
    wasStill = still;
    if (!still) return;
    clearTimeout(edgeTimer);
    clearTimeout(identityTimer);
    turn.classList.remove('is-turning');
    showFace(side, true);
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

  function addObverse() {
    const maxWidth = photoMaxWidthFor('hero-photo');
    const sources = derivedSources(obverse, maxWidth);
    const image = document.createElement('img');
    image.alt = obverse.alt;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.width = obverse.width;
    image.height = obverse.height;
    // watchImages() must not paint the shared disc with this face's error state.
    image.dataset.watched = 'true';
    image.addEventListener('load', () => {
      controls.hidden = false;   // the control appears only once both faces exist
    }, {once: true});
    if (sources.length > 1) {
      image.srcset = derivedSrcset(obverse, maxWidth);
      image.sizes = photoSizesFor('hero-photo');
    }
    image.src = sources.length ? sources[0].path : (obverse.localUrl || obverse.displayUrl || obverse.url);
    back.append(image);
  }

  // Nothing is fetched until the owl itself is on screen; nothing ever turns
  // on its own.
  function owlReady() {
    // The build paints a blurred 24-pixel copy of the owl behind the disc so it
    // is never an empty well while the photograph loads. That job is finished
    // the moment the photograph arrives, and mid-turn the blur would be the one
    // thing showing through the window. The flat well is the room behind it.
    surface?.style.removeProperty('background-image');
    wasStill = noMotion();
    addObverse();
  }
  if (owlImage.complete) { if (owlImage.naturalWidth) owlReady(); }
  else owlImage.addEventListener('load', owlReady, {once: true});
}
setupHeroCoin();

// All geographic panels are readable without JavaScript. Enhancement selects one
// at a time, without scroll-driven animation, external tiles, or pointer-only UI.
const geographyExplorer = byId('geography-explorer');
if (geographyExplorer) {
  const panels = Array.from(geographyExplorer.querySelectorAll('.geo-place'));
  const buttons = Array.from(geographyExplorer.querySelectorAll('[data-geography]'));
  const select = byId('geography-select');
  // The overview above the buttons is decorative, so it is driven by class only:
  // nothing here changes what is selected, announced, focused or linkable.
  const reachAreas = Array.from(geographyExplorer.querySelectorAll('[data-geo-reach]'));
  const geographyStill = () => motionOff || document.documentElement.classList.contains('motion-off');
  let reachTimers = [];
  function endGeographySweep() {
    reachTimers.forEach(clearTimeout);
    reachTimers = [];
    reachAreas.forEach(area => area.classList.remove('is-sweep'));
    buttons.forEach(button => button.classList.remove('is-sweep'));
  }
  function selectGeography(id, announce = true) {
    const selected = byId(`geography-${id}`);
    if (!panels.includes(selected)) return;
    // Any real choice ends the opening sweep at once; it never competes with the reader.
    endGeographySweep();
    panels.forEach(panel => { panel.hidden = panel !== selected; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.geography === id)));
    reachAreas.forEach(area => area.classList.toggle('is-current', area.dataset.geoReach === id));
    select.value = id;
    if (announce) byId('geography-status').textContent = `${data.geography.places.find(place => place.id === id).name} selected.`;
  }
  buttons.forEach(button => button.addEventListener('click', () => selectGeography(button.dataset.geography)));
  select.addEventListener('change', () => selectGeography(select.value));
  geographyExplorer.querySelectorAll('[data-geography-next]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.geographyNext;
      selectGeography(id, false);
      // A deliberate next-place action moves focus to the new reading position.
      byId(`geography-${id}-title`).focus();
    });
  });
  function geographyFromHash() {
    const id = location.hash.replace(/^#geography-/, '');
    if (panels.some(panel => panel.id === `geography-${id}`)) selectGeography(id, false);
  }
  selectGeography(data.geography.places[0].id, false);
  geographyFromHash();
  window.addEventListener('hashchange', geographyFromHash);
  geographyExplorer.querySelector('.geo-controls').hidden = false;
  // Once, when the overview is actually on screen: the eight areas light up in
  // turn over about two and a half seconds and then settle back on whichever
  // place is open. Scrolling, selection and the deep link are untouched, and
  // with motion off nothing runs at all.
  function runGeographySweep() {
    if (geographyStill() || !reachAreas.length) return;
    const places = data.geography.places, step = 260;
    places.forEach((place, index) => {
      reachTimers.push(setTimeout(() => {
        if (geographyStill()) { endGeographySweep(); return; }
        reachAreas.forEach(area => { if (area.dataset.geoReach === place.id) area.classList.add('is-sweep'); });
        buttons.forEach(button => { if (button.dataset.geography === place.id) button.classList.add('is-sweep'); });
      }, index * step));
    });
    reachTimers.push(setTimeout(endGeographySweep, places.length * step + 620));
  }
  const sweepTarget = geographyExplorer.querySelector('[data-animate-on-view]');
  if (sweepTarget && 'IntersectionObserver' in window) {
    const sweepObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        sweepObserver.disconnect();
        geographyExplorer.classList.add('is-revealed');
        runGeographySweep();
      }
    }, {threshold: 0.55});
    sweepObserver.observe(sweepTarget);
  } else {
    geographyExplorer.classList.add('is-revealed');
  }
}

// Inline citations open a compact evidence note; without JS their anchors work.
const sourceDialog = byId('source-dialog');
const imageDialog = byId('image-dialog');
const sourceContent = byId('source-dialog-content');
function syncModalState() {
  const open = sourceDialog.open || imageDialog.open;
  document.body.classList.toggle('modal-open', open);
  // A dialog is a deliberate stop: bring the navigation back so closing it does
  // not leave the reader without the wordmark, the nav or the motion control.
  headerPinned = open;
  if (open) setHeaderHidden(false);
}
function openSource(id) {
  const index = data.sources.findIndex((source) => source.id === id);
  if (index < 0) return;
  const source = data.sources[index];
  sourceContent.innerHTML = `<div class="source-kind">${String(index + 1).padStart(2, '0')} / ${escapeHtml(source.kind)}</div>
    <h2 id="source-dialog-title">${escapeHtml(source.title)}</h2>
    <p class="source-byline">${escapeHtml(source.author)} · ${escapeHtml(source.year)}</p>
    <p>${escapeHtml(source.scope)}</p>
    ${source.note ? `<p class="micro-copy">${escapeHtml(source.note)}</p>` : ''}
    <div class="source-actions"><a class="quiet-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>
    <a class="quiet-link" href="#source-${escapeHtml(source.id)}" data-bibliography-jump="${escapeHtml(source.id)}">See bibliography entry ↓</a></div>
    <p class="micro-copy">Source record reviewed ${escapeHtml(source.accessed)}. This site does not imply the source’s endorsement.</p>`;
  sourceDialog.showModal();
  syncModalState();
}
byId('source-close').addEventListener('click', () => sourceDialog.close());
sourceDialog.addEventListener('close', syncModalState);
sourceDialog.addEventListener('click', (event) => {
  if (event.target === sourceDialog) {
    const rect = sourceDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sourceDialog.close();
  }
});

// A native-dialog image viewer. High-resolution images are fetched on demand.
const viewer = byId('viewer-image');
const stage = byId('image-stage');
const range = byId('zoom-range');
const output = byId('zoom-value');
let scale = 1;
let panX = 0;
let panY = 0;
let currentSourceToken = 0;
const pointers = new Map();
let dragStart = null;
let pinchStart = null;

function clampPan() {
  if (!viewer.naturalWidth || !viewer.naturalHeight) return;
  const fit = Math.min(stage.clientWidth / viewer.naturalWidth, stage.clientHeight / viewer.naturalHeight);
  const maxX = Math.max(0, (viewer.naturalWidth * fit * scale - stage.clientWidth) / 2);
  const maxY = Math.max(0, (viewer.naturalHeight * fit * scale - stage.clientHeight) / 2);
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}
function drawViewer() {
  clampPan();
  viewer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  stage.dataset.zoomed = String(scale > 1);
  const value = Math.round(scale * 100);
  range.value = String(value);
  range.setAttribute('aria-valuetext', `${value} percent of fitted size`);
  output.textContent = `${value}%`;
  byId('zoom-out').disabled = scale <= 1;
  byId('zoom-in').disabled = scale >= 4;
}
function setZoom(nextScale) {
  scale = Math.max(1, Math.min(4, nextScale));
  if (scale === 1) panX = panY = 0;
  drawViewer();
}
function resetViewer() { scale = 1; panX = panY = 0; drawViewer(); }
function openImage(id) {
  const image = data.images[id];
  if (!image) return;
  const token = ++currentSourceToken;
  byId('image-dialog-title').textContent = image.title;
  byId('viewer-date').textContent = image.date;
  byId('viewer-credit').textContent = image.credit;
  byId('viewer-license').innerHTML = `<a href="${escapeHtml(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(image.license)}</a> · ${escapeHtml(image.changes)}`;
  byId('viewer-resolution').textContent = `Source record: ${image.width.toLocaleString()} × ${image.height.toLocaleString()} pixels. Zoom is relative to fitted size.`;
  byId('viewer-note').textContent = image.note;
  byId('viewer-rights').textContent = image.rightsNote || '';
  byId('viewer-rights').hidden = !image.rightsNote;
  byId('viewer-object').hidden = !image.objectUrl;
  byId('viewer-object').href = image.objectUrl || image.source;
  byId('viewer-policy').hidden = !image.rightsPolicyUrl;
  byId('viewer-policy').href = image.rightsPolicyUrl || image.source;
  byId('viewer-source').href = image.source;
  byId('viewer-original').href = image.localUrl || image.url;
  byId('viewer-error').hidden = true;
  viewer.hidden = false;
  viewer.alt = image.alt;
  viewer.onload = () => {
    if (token !== currentSourceToken) return;
    byId('viewer-resolution').textContent = `Loaded: ${viewer.naturalWidth.toLocaleString()} × ${viewer.naturalHeight.toLocaleString()} pixels. Zoom enlarges existing pixels, relative to the fitted view.`;
    drawViewer();
  };
  viewer.onerror = () => {
    if (token !== currentSourceToken) return;
    viewer.hidden = true;
    byId('viewer-error').hidden = false;
  };
  viewer.src = image.localUrl || image.url;
  if (!imageDialog.open) imageDialog.showModal();
  syncModalState();
  resetViewer();
  stage.focus({preventScroll: true});
}
byId('image-close').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('close', () => {
  pointers.clear();
  dragStart = pinchStart = null;
  stage.dataset.dragging = 'false';
  syncModalState();
});
imageDialog.addEventListener('click', (event) => {
  if (event.target !== imageDialog) return;
  const rect = imageDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageDialog.close();
});
byId('zoom-in').addEventListener('click', () => setZoom(scale + .25));
byId('zoom-out').addEventListener('click', () => setZoom(scale - .25));
byId('zoom-reset').addEventListener('click', resetViewer);
range.addEventListener('input', () => setZoom(Number(range.value) / 100));
stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  setZoom(scale * Math.exp(-event.deltaY * .0015));
}, {passive: false});
stage.addEventListener('keydown', (event) => {
  const arrows = {ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40]};
  if (['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault();
    if (event.key === '0') resetViewer();
    else setZoom(scale + (event.key === '-' ? -.25 : .25));
  } else if (arrows[event.key]) {
    event.preventDefault();
    panX += arrows[event.key][0];
    panY += arrows[event.key][1];
    drawViewer();
  }
});
function pointerDistance() {
  const [a, b] = [...pointers.values()];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}
stage.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
  stage.setPointerCapture(event.pointerId);
  if (pointers.size === 1) dragStart = {x: event.clientX, y: event.clientY, panX, panY};
  if (pointers.size === 2) pinchStart = {distance: pointerDistance(), scale};
  stage.dataset.dragging = 'true';
});
stage.addEventListener('pointermove', (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
  if (pointers.size === 2 && pinchStart?.distance) {
    setZoom(pinchStart.scale * pointerDistance() / pinchStart.distance);
  } else if (pointers.size === 1 && dragStart && scale > 1) {
    panX = dragStart.panX + event.clientX - dragStart.x;
    panY = dragStart.panY + event.clientY - dragStart.y;
    drawViewer();
  }
});
function endPointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (pointers.size === 1) {
    const point = [...pointers.values()][0];
    dragStart = {x: point.x, y: point.y, panX, panY};
  } else dragStart = null;
  stage.dataset.dragging = String(pointers.size > 0);
}
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);
window.addEventListener('resize', () => { if (imageDialog.open) drawViewer(); }, {passive: true});

// One delegated listener handles static and dynamically rendered image/citation links.
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest('.site-footer a[href="#top"]') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
    // Keep native anchor scrolling; resume keyboard reading at the heading.
    requestAnimationFrame(() => {
      const heading = document.querySelector('main h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({preventScroll: true});
    });
  }
  const imageLink = target.closest('[data-image]');
  if (imageLink && !event.ctrlKey && !event.metaKey && !event.shiftKey && typeof imageDialog.showModal === 'function') {
    event.preventDefault();
    openImage(imageLink.dataset.image);
    return;
  }
  const citation = target.closest('[data-source]');
  if (citation && !event.ctrlKey && !event.metaKey && !event.shiftKey && typeof sourceDialog.showModal === 'function') {
    event.preventDefault();
    openSource(citation.dataset.source);
    return;
  }
  const jump = target.closest('[data-bibliography-jump]');
  if (jump) {
    event.preventDefault();
    sourceDialog.close();
    if (!byId(`source-${jump.dataset.bibliographyJump}`) || !byId('source-search')) { location.href = `/atlas/#source-${encodeURIComponent(jump.dataset.bibliographyJump)}`; return; }
    byId('source-search').value = '';
    filterSources();
    const entry = byId(`source-${jump.dataset.bibliographyJump}`);
    entry?.scrollIntoView({behavior: motionOff ? 'instant' : 'smooth', block: 'start'});
    entry?.querySelector('h3 a')?.focus({preventScroll: true});
  }
});

// Comparison keeps family chronology distinct from each museum specimen's label.
function syncSpecimenOptions(position) {
  const family = data.families.find((entry) => entry.id === byId(`compare-${position}`).value);
  const select = byId(`compare-${position}-specimen`);
  const available = family?.specimens || [];
  select.innerHTML = available.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(data.specimens[id].name)}</option>`).join('');
  byId(`compare-${position}-specimen-control`).hidden = available.length < 2;
  select.disabled = available.length < 2;
  byId('compare-specimen-tools').hidden = ['left', 'right'].every((side) => byId(`compare-${side}-specimen-control`).hidden);
}
function updateComparison() {
  const side = document.querySelector('input[name="compare-side"]:checked')?.value || 'reverse';
  for (const position of ['left', 'right']) {
    const container = byId(`compare-panel-${position}`);
    const specimenId = byId(`compare-${position}-specimen`).value || undefined;
    container.innerHTML = comparisonMarkup(byId(`compare-${position}`).value, side, data, specimenId);
    watchImages(container);
  }
}
for (const position of ['left', 'right']) {
  if (!byId(`compare-${position}`)) continue;
  syncSpecimenOptions(position);
  byId(`compare-${position}`).addEventListener('change', () => {
    syncSpecimenOptions(position);
    updateComparison();
  });
  byId(`compare-${position}-specimen`).addEventListener('change', updateComparison);
}
document.querySelectorAll('input[name="compare-side"]').forEach((input) => input.addEventListener('change', updateComparison));
const comparisonPresets = {
  'pi-pair': {families: ['pi', 'pi'], specimens: ['bnf-pi-ii-1469', 'bnf-pi-iii-1475']},
  'late-bridge': {families: ['pi', 'late-old'], specimens: ['bnf-pi-iii-1475', 'bnf-quadridigite-1478']},
};
document.querySelectorAll('[data-compare-preset]').forEach((link) => link.addEventListener('click', () => {
  const preset = comparisonPresets[link.dataset.comparePreset];
  if (!preset || !byId('compare-left')) return;
  ['left', 'right'].forEach((position, index) => {
    byId(`compare-${position}`).value = preset.families[index];
    syncSpecimenOptions(position);
    byId(`compare-${position}-specimen`).value = preset.specimens[index];
  });
  document.querySelector('input[name="compare-side"][value="obverse"]').checked = true;
  updateComparison();
  // Leave ordinary anchor navigation intact, including when JavaScript is disabled.
}));
// A story link can open a comparison preset on the dedicated reference page.
const initialPreset = comparisonPresets[new URLSearchParams(location.search).get('compare')];
if (initialPreset && byId('compare-left')) {
  ['left','right'].forEach((position,index) => {
    byId(`compare-${position}`).value = initialPreset.families[index];
    syncSpecimenOptions(position);
    byId(`compare-${position}-specimen`).value = initialPreset.specimens[index];
  });
  document.querySelector('input[name="compare-side"][value="obverse"]').checked = true;
  updateComparison();
}
if (!document.body.classList.contains('reference-page')) {
  const followReferenceBookmark = () => {
    const id = location.hash.slice(1);
    if ((id === 'atlas' || byId(id)?.hasAttribute('data-reference-redirect')) && !document.body.classList.contains('pricing-page') && !document.body.classList.contains('journey-page')) location.replace(`/atlas/${location.hash}`);
  };
  window.addEventListener('hashchange',followReferenceBookmark);
  followReferenceBookmark();
}
// Expand the targeted rights note rather than navigating to a closed disclosure.
document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href="#image-reuse-policy"]') : null;
  if (link && byId('image-reuse-policy')?.tagName === 'DETAILS') byId('image-reuse-policy').open = true;
});
if (location.hash === '#image-reuse-policy' && byId('image-reuse-policy')) byId('image-reuse-policy').open = true;

// Search filters the visible bibliography, not a hidden external search index.
const normalize = (text) => text.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const searchableSources = Array.from(document.querySelectorAll('.source-entry')).map((element) => ({element, text: normalize(element.textContent)}));
function filterSources() {
  const terms = normalize(byId('source-search').value.trim()).split(/\s+/).filter(Boolean);
  let count = 0;
  for (const {element, text} of searchableSources) {
    const matches = terms.every((term) => text.includes(term));
    element.hidden = !matches;
    if (matches) count++;
  }
  byId('source-results').textContent = `${count} ${count === 1 ? 'source' : 'sources'}`;
  byId('source-empty').hidden = count !== 0;
}
byId('source-search')?.addEventListener('input', filterSources);

// Enhance the complete, statically rendered market snapshot.
if (byId('market-ledger')?.tagName === 'DETAILS') {
const marketRows = Array.from(document.querySelectorAll('[data-market-row]')).map(element => ({element, text:normalize(element.textContent)}));
function filterMarket() {
  const terms = normalize(byId('market-search').value.trim()).split(/\s+/).filter(Boolean);
  const family = byId('market-family').value;
  const venue = byId('market-venue').value;
  let count = 0;
  for (const {element, text} of marketRows) {
    const matches = (family === 'all' || element.dataset.marketFamily === family) && (venue === 'all' || element.dataset.marketVenue === venue) && terms.every(term => text.includes(term));
    element.hidden = !matches;
    if (matches) count++;
  }
  byId('market-results').textContent = count ? `${count} of ${marketRows.length} observations` : 'No matching observations. Try another detail or reset the filters.';
}
function resetMarket() {
  byId('market-search').value = '';
  byId('market-family').value = 'all';
  byId('market-venue').value = 'all';
  filterMarket();
}
byId('market-search').addEventListener('input', filterMarket);
['market-family','market-venue'].forEach(id => byId(id).addEventListener('change', filterMarket));
byId('market-reset').addEventListener('click', resetMarket);
byId('market-filters').hidden = false;
function calculateMarketPrice() {
  const hammer = byId('market-hammer');
  const premium = byId('market-premium');
  if (!hammer.validity.valid || !premium.validity.valid) {
    byId('market-total').textContent = '—';
    byId('market-fee-detail').textContent = 'Enter a hammer price from $0 to $1,000,000 and a premium from 0% to 100%.';
    return;
  }
  const fee = Math.round(hammer.valueAsNumber * premium.valueAsNumber) / 100;
  const total = Math.round((hammer.valueAsNumber + fee) * 100) / 100;
  byId('market-total').textContent = marketMoney(total);
  byId('market-fee-detail').textContent = `Includes ${marketMoney(fee)} buyer premium. Tax and shipping are additional.`;
}
['market-hammer','market-premium'].forEach(id => byId(id).addEventListener('input', calculateMarketPrice));
byId('market-calculator').addEventListener('submit', event => event.preventDefault());
byId('market-calculator').hidden = false;
function revealMarketLink() {
  const id = location.hash.slice(1);
  if (id !== 'market-ledger' && !id.startsWith('sale-')) return;
  const target = byId(id);
  if (!target) return;
  byId('market-ledger').open = true;
  if (id.startsWith('sale-')) resetMarket();
  requestAnimationFrame(() => target.scrollIntoView({block:'start', behavior:'instant'}));
}
window.addEventListener('hashchange', revealMarketLink);
document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#sale-"], a[href="#market-ledger"]') : null;
  if (link && link.hash === location.hash) revealMarketLink();
});
revealMarketLink();
} else {
  // Existing saved links to the former long chapter follow it to its new page.
  // Without JavaScript the anchors land beside the summary's ordinary page link.
  function followMovedPricingLink() {
    const target = byId(location.hash.slice(1));
    if (target?.hasAttribute('data-pricing-redirect')) location.replace(`pricing/${location.hash}`);
  }
  window.addEventListener('hashchange', followMovedPricingLink);
  followMovedPricingLink();
}
let marketPrintDetails = [];
window.addEventListener('beforeprint', () => {
  marketPrintDetails = Array.from(document.querySelectorAll('.market-disclosure,.family-market')).filter(detail => !detail.open);
  marketPrintDetails.forEach(detail => { detail.open = true; });
});
window.addEventListener('afterprint', () => {
  marketPrintDetails.forEach(detail => { detail.open = false; });
  marketPrintDetails = [];
});

// Keep print output readable without needing to reveal each animated section first.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.replace('is-waiting', 'is-visible'));
});

/**
 * Play a decorative sequence once, when its section is read.
 *
 * A generic companion to `.reveal`, which fades a block in; this marks a whole
 * container so a stylesheet can run a timed sequence inside it. An element with
 * `data-animate-on-view` gets `is-playing` the first time it scrolls into view,
 * and a `[data-animate-replay]` control inside it restarts that sequence by
 * dropping the class, forcing a reflow and setting it again.
 *
 * Nothing here decides what moves or for how long: the CSS owns the timeline, so
 * a section that only draws itself in costs the same as one that does not move at
 * all. When motion is off — the reader's toggle or the operating system's reduced
 * motion preference — the stylesheet leaves every part at its authored frame and
 * hides the replay control, so the section reads as the static figure it is
 * without JavaScript. The class is still applied in that case, which means
 * turning motion back on plays the sequence rather than silently doing nothing.
 * State is never announced: these sequences illustrate copy that is already on
 * the page, so a live region would only repeat it.
 */
const animatedStages = document.querySelectorAll('[data-animate-on-view]');
if (animatedStages.length) {
  // Fires when the container's top edge passes the lower quarter of the viewport,
  // which does not depend on how tall the container is on a given screen.
  const playObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-playing');
        playObserver.unobserve(entry.target);
      }
    }, {rootMargin: '0px 0px -25% 0px', threshold: 0})
    : null;
  for (const stage of animatedStages) {
    playObserver?.observe(stage);
    const replay = stage.querySelector('[data-animate-replay]');
    if (!replay) continue;
    replay.hidden = false;
    replay.addEventListener('click', () => {
      stage.classList.remove('is-playing');
      void stage.offsetWidth; // restart the CSS timeline from its first frame
      stage.classList.add('is-playing');
    });
  }
}

/* ==========================================================================
   CHUNK 4 / SHARE — copy-link controls, the page Share control and the
   coin-card maker.
   --------------------------------------------------------------------------
   The feature itself lives in src/share-cards.js, which build.mjs inlines
   ahead of this file, with its `export` keywords stripped. It is called
   rather than imported because build.mjs strips only the render.mjs import,
   the one module this file imports.
   ========================================================================== */
initShareCards({
  data,
  // The card maker is a deliberate stop, like the source and image dialogs:
  // hold the page still and bring the chrome back, so closing it does not
  // leave the reader without the wordmark, the nav or the motion control.
  onDialogToggle(open) {
    document.body.classList.toggle('modal-open', open);
    headerPinned = open;
    if (open) setHeaderHidden(false);
  },
});

// Open the card maker when a link to /#share-card arrives (the archived creator
// kit carried one), then drop the hash so reloads and back navigation stay predictable.
function openShareCardFromHash() {
  if (location.hash !== '#share-card') return;
  const trigger = document.getElementById('hero-share-card');
  if (!trigger || getComputedStyle(trigger).display === 'none') return;
  history.replaceState(null, '', location.pathname + location.search);
  trigger.click();
}
openShareCardFromHash();
window.addEventListener('hashchange', openShareCardFromHash);

// === CHUNK 5 / CLOSE READING ==============================================
// Both photographs, all six readings and every citation are in the document at
// build time; without this script they are simply all on the page. The
// enhancement only adds the switch: the native radio pair chooses a face, the
// detail buttons choose a reading, and a numbered marker moves over the
// photograph. Nothing here is the only route to a sourced statement.
const closeReadingPanels = [...document.querySelectorAll('[data-close-reading-side]')];
if (closeReadingPanels.length && data.closeReading) {
  const closeReadings = data.closeReading.readings;
  for (const panel of closeReadingPanels) {
    const buttons = [...panel.querySelectorAll('[data-close-reading]')];
    const marker = panel.querySelector('.close-reading-marker');
    const text = panel.querySelector('.close-reading-text');
    const surface = panel.querySelector('.image-surface');
    if (!buttons.length || !marker || !text || !surface) continue;
    // Anchor the marker's percentages to the photograph itself, never to the
    // face label above it or the credit line below it.
    surface.append(marker);
    const selectReading = (button) => {
      const index = closeReadings.findIndex((reading) => reading.id === button.dataset.closeReading);
      const reading = closeReadings[index];
      if (!reading) return;
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      for (const item of text.querySelectorAll('.close-reading-item')) {
        item.hidden = item.id !== button.getAttribute('aria-controls');
      }
      marker.style.setProperty('--x', `${reading.x}%`);
      marker.style.setProperty('--y', `${reading.y}%`);
      marker.textContent = String(index + 1);
    };
    selectReading(buttons[0]);
    // Live only after the opening state is in place, so arriving at the chapter
    // does not read the first reading aloud on its own.
    text.setAttribute('aria-live', 'polite');
    text.setAttribute('aria-atomic', 'true');
    for (const button of buttons) button.addEventListener('click', () => selectReading(button));
    panel.querySelector('.detail-buttons').hidden = false;
    marker.hidden = false;
  }
  const faceInputs = [...document.querySelectorAll('input[name="close-reading-side"]')];
  const faceControl = document.querySelector('.close-reading-faces');
  const showCloseReadingFace = () => {
    const chosen = document.querySelector('input[name="close-reading-side"]:checked');
    if (!chosen) return;
    for (const panel of closeReadingPanels) panel.hidden = panel.dataset.closeReadingSide !== chosen.value;
  };
  if (faceInputs.length && faceControl) {
    for (const input of faceInputs) input.addEventListener('change', showCloseReadingFace);
    showCloseReadingFace();
    faceControl.hidden = false;
  }
}

// While the card maker is on hold (see the HOLD block at the end of styles.css)
// the /#share-card hash must not open it either.
window.addEventListener('hashchange', (event) => {
  const trigger = document.getElementById('hero-share-card');
  if (location.hash === '#share-card' && trigger && getComputedStyle(trigger).display === 'none') {
    history.replaceState(null, '', location.pathname + location.search);
    event.stopImmediatePropagation();
  }
}, true);
