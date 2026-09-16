import {escapeHtml, sourceRefs, photoMarkup, comparisonMarkup} from './render.mjs';

/**
 * Progressive enhancement only. The full story, credits and bibliography are
 * rendered at build time. Nothing depends on a framework, CDN script or API key.
 */
const dataElement = document.querySelector('#atlas-data');
if (!dataElement?.textContent) throw new Error('The atlas content is missing.');
const data = JSON.parse(dataElement.textContent);
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
const hero = byId('top');
const heroObject = byId('hero-object');
const crisis = byId('404');
const crisisYear = crisis.querySelector('.crisis-year');
let scheduled = false;
function updateScroll() {
  scheduled = false;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  byId('reading-fill').style.transform = `scaleX(${percentage})`;
  let active = chapters[0];
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) || 86;
  for (const chapter of chapters) {
    if (chapter.getBoundingClientRect().top <= headerHeight + 150) active = chapter;
    else break;
  }
  if (active) byId('current-chapter').textContent = active.dataset.chapter;
  if (!motionOff && window.innerWidth > 760) {
    const heroTop = hero.getBoundingClientRect().top;
    const offset = Math.min(1100, Math.max(0, -heroTop));
    heroObject.style.transform = `translateY(${offset * 0.105}px) rotate(${offset * 0.002}deg)`;
    const rect = crisis.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    crisisYear.style.transform = `translateY(${(progress - .5) * 34}px)`;
  } else {
    heroObject.style.removeProperty('transform');
    crisisYear.style.removeProperty('transform');
  }
}
function requestScrollUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }
window.addEventListener('scroll', requestScrollUpdate, {passive: true});
window.addEventListener('resize', requestScrollUpdate, {passive: true});
syncMotion();

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
  byId('viewer-original').href = image.url;
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

// Anatomy: buttons, descriptions and markers all refer to the same data record.
const anatomyButtons = document.querySelectorAll('[data-detail]');
const anatomyMarker = byId('anatomy-marker');
// Anchor percentages to the photograph itself, never the credit beneath it.
byId('anatomy-photo').querySelector('.image-surface').append(anatomyMarker);
anatomyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = data.anatomy.findIndex((detail) => detail.id === button.dataset.detail);
    const detail = data.anatomy[index];
    if (!detail) return;
    anatomyButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    byId('anatomy-photo').innerHTML = photoMarkup(detail.image, data, 'anatomy-image', undefined, true);
    const marker = anatomyMarker;
    byId('anatomy-photo').querySelector('.image-surface').append(marker);
    marker.style.setProperty('--x', `${detail.x}%`);
    marker.style.setProperty('--y', `${detail.y}%`);
    marker.textContent = String(index + 1);
    byId('anatomy-text').innerHTML = `<span class="eyebrow">${String(index + 1).padStart(2, '0')} / ${escapeHtml(detail.side)}</span><h4>${escapeHtml(detail.title)}</h4><p>${escapeHtml(detail.text)} ${sourceRefs(detail.refs, data)}</p>`;
    watchImages(byId('anatomy-photo'));
  });
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
if (location.hash === '#image-reuse-policy') byId('image-reuse-policy').open = true;

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

// Keep print output readable without needing to reveal each animated section first.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.replace('is-waiting', 'is-visible'));
});
