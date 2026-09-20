import {ArtifactExplorer} from './artifact-explorer.js';
import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup, marketMoney} from './render.mjs';

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
let scheduled = false;
function updateScroll() {
  scheduled = false;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  byId('reading-fill').style.transform = `scaleX(${percentage})`;
  let active = chapters[0];
  const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;
  for (const chapter of chapters) {
    if (chapter.getBoundingClientRect().top <= headerHeight + 150) active = chapter;
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
  root.style.setProperty('--header', `${Math.ceil(document.querySelector('.site-header').getBoundingClientRect().height)}px`);
  const bar = document.querySelector('.chapter-bar');
  root.style.setProperty('--bar', `${bar ? Math.ceil(bar.getBoundingClientRect().height) : 0}px`);
  requestScrollUpdate();
}
if ('ResizeObserver' in window) {
  const navigationObserver = new ResizeObserver(syncNavigationHeight);
  navigationObserver.observe(document.querySelector('.site-header'));
  const bar = document.querySelector('.chapter-bar');
  if (bar) navigationObserver.observe(bar);
}
syncNavigationHeight();
window.addEventListener('resize', requestScrollUpdate, {passive: true});
syncMotion();

// All geographic panels are readable without JavaScript. Enhancement selects one
// at a time, without scroll-driven animation, external tiles, or pointer-only UI.
const geographyExplorer = byId('geography-explorer');
if (geographyExplorer) {
  const panels = Array.from(geographyExplorer.querySelectorAll('.geo-place'));
  const buttons = Array.from(geographyExplorer.querySelectorAll('[data-geography]'));
  const select = byId('geography-select');
  function selectGeography(id, announce = true) {
    const selected = byId(`geography-${id}`);
    if (!panels.includes(selected)) return;
    panels.forEach(panel => { panel.hidden = panel !== selected; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.geography === id)));
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
}

// Inline citations open a compact evidence note; without JS their anchors work.
const sourceDialog = byId('source-dialog');
const imageDialog = byId('image-dialog');
const sourceContent = byId('source-dialog-content');
function syncModalState() {
  document.body.classList.toggle('modal-open', sourceDialog.open || imageDialog.open);
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
    byId('source-search').value = '';
    filterSources();
    const entry = byId(`source-${jump.dataset.bibliographyJump}`);
    entry?.scrollIntoView({behavior: motionOff ? 'instant' : 'smooth', block: 'start'});
    entry?.querySelector('h3 a')?.focus({preventScroll: true});
  }
});

// Story records declare camera states; the reusable viewer owns all transforms.
const artifactExplorers = [...document.querySelectorAll('[data-artifact-story]')].map(root =>
  new ArtifactExplorer(root, data.artifactStories[root.dataset.artifactStory], data.images, () => motionOff));

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
  if (!preset) return;
  ['left', 'right'].forEach((position, index) => {
    byId(`compare-${position}`).value = preset.families[index];
    syncSpecimenOptions(position);
    byId(`compare-${position}-specimen`).value = preset.specimens[index];
  });
  document.querySelector('input[name="compare-side"][value="obverse"]').checked = true;
  updateComparison();
  // Leave ordinary anchor navigation intact, including when JavaScript is disabled.
}));
// Expand the targeted rights note rather than navigating to a closed disclosure.
document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href="#image-reuse-policy"]') : null;
  if (link) byId('image-reuse-policy').open = true;
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
byId('source-search').addEventListener('input', filterSources);

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
