/**
 * CHUNK 4 / SHARE — copy-link controls, a page Share control, and a client-side
 * coin-card maker.
 *
 * Progressive enhancement only. Everything here is built at runtime; without
 * JavaScript the page keeps its headings, its links and its dialogs, and the
 * card maker is simply not offered.
 *
 * Self-contained on purpose: `build.mjs` inlines this file the same way it
 * inlines `src/artifact-explorer.js` (read it, strip `export`, concatenate it
 * into one IIFE), so it must not import anything. `scripts/check.mjs` imports
 * it as an ordinary ES module, so nothing here may touch the DOM at load time.
 *
 * RIGHTS. Only rights-cleared photographs may be drawn onto a card:
 *   · every preset names an image record in `src/content.json` or
 *     `src/one-owl.json`, and `scripts/check.mjs` fails the build if that
 *     record is missing, is flagged `reuseStatus: "review-pending"`, or if its
 *     file is not on disk;
 *   · `resolveShareCards()` guards again at runtime against the page's own
 *     `#atlas-data`, so a record that becomes review-pending disappears from
 *     the dialog rather than being drawn;
 *   · only same-origin files under /public/images/ are ever loaded. The six
 *     BnF review-pending records have no self-hosted derivative at all (the
 *     build refuses to derive them), so they have no path that could pass.
 * A remote photograph would also taint the canvas and make the export fail,
 * which is the second reason nothing here fetches across origins.
 */

/** The two shapes people actually post. */
export const SHARE_CARD_SIZES = [
  {id: 'portrait', label: 'Portrait', width: 1080, height: 1350, note: '1080 × 1350'},
  {id: 'landscape', label: 'Landscape', width: 1200, height: 630, note: '1200 × 630'},
];

/** The palette and type of `scripts/render-social.mjs`, so a card made in the
 *  browser and a card rendered at build time read as the same object. */
export const SHARE_CARD_PALETTE = {
  forest: '#191e1c',
  paper: '#f0ede4',
  gold: '#c5b88b',
  ring: '#9eaa93',
  well: '#333b34',
  serif: '"Fraunces","Fraunces Fallback",Georgia,"Times New Roman",serif',
  greek: '"GFS Didot","Fraunces",Georgia,serif',
  mono: '"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace',
};

/**
 * Coin discs in the *source* photograph's pixels, as in `render-social.mjs`:
 * a circular mask keeps each photograph's own framing, and nothing is
 * retouched, upscaled or reconstructed. `source` is the original frame the
 * disc was measured against; a smaller self-hosted derivative is rescaled to
 * it, and a file larger than it is refused rather than enlarged.
 *
 * `classic-owl`, `new-owl` and `owner-owl` reuse the discs already measured
 * for the build-time cards, with the same `cover` those cards use.
 * `classic-athena` is new here: the flan was measured off the museum's own
 * frame, then trued against a rendered card until the ring of photograph
 * background inside the circle was even on all four sides.
 */
export const SHARE_CARD_PRESETS = [
  {
    id: 'classic-owl',
    name: 'The owl',
    image: 'classic-owl',
    object: 'Owl reverse, Cleveland 1941.296.b',
    eyebrow: 'A field guide to Athenian coinage',
    headline: ['A small owl.', 'An ancient world.'],
    fact: 'Museum photographs, plain language, and a linked source behind every claim.',
    source: {width: 2634, height: 2736},
    disc: {cx: 1304, cy: 1395, r: 1255, cover: 1.03},
  },
  {
    id: 'classic-athena',
    name: 'Athena',
    image: 'classic-athena',
    object: 'Athena obverse, Cleveland 1941.296.a',
    eyebrow: 'The face you see first',
    headline: ['Athena comes first.', 'Then the owl.'],
    fact: 'Athena on the obverse, the owl on the reverse — one coin, two faces.',
    source: {width: 1920, height: 1973},
    disc: {cx: 958, cy: 966, r: 955, cover: 1.03},
  },
  {
    id: 'four-days',
    name: 'Four days’ pay',
    image: 'classic-owl',
    object: 'Owl reverse, Cleveland 1941.296.b',
    eyebrow: 'What one owl bought',
    headline: ['Four days’ pay.', 'One small coin.'],
    fact: 'One owl ≈ four days’ pay for a craftsman on the Acropolis, 408/7 BC.',
    note: 'Erechtheion building accounts, IG I³ 476 · Attic Inscriptions Online',
    source: {width: 2634, height: 2736},
    disc: {cx: 1304, cy: 1395, r: 1255, cover: 1.03},
  },
  {
    id: 'euro-echo',
    name: 'The €1 echo',
    image: 'new-owl',
    object: 'New Style owl, Musée de la BnF',
    eyebrow: 'Still in circulation',
    headline: ['Still a coin.', 'Still an owl.'],
    fact: 'The owl on Greece’s €1 coin today.',
    note: 'Coin design: European Central Bank',
    source: {width: 1340, height: 1340},
    disc: {cx: 657, cy: 670, r: 637, cover: 0.98},
  },
  {
    id: 'still-here',
    name: 'Still here',
    image: 'owner-owl',
    object: 'Owl reverse, photographed in its holder',
    eyebrow: 'One owl, 2,400 years',
    headline: ['2,400 years.', 'Still here.'],
    // Deliberately singular: a claim about this one specimen, never about owls
    // in general or about survival rates. See tests/editorial_copy.py.
    fact: 'One coin, still graded Mint State.',
    source: {width: 960, height: 1280},
    disc: {cx: 446, cy: 730, r: 442, cover: 0.98},
    // The owner's photographs live in src/one-owl.json, which only the
    // companion page inlines, so the card carries the credit that record's own
    // rights note prescribes. scripts/check.mjs holds the two together.
    fallback: {
      path: 'public/images/one-owl-owl.jpg',
      credit: 'Photograph: The Owl Atlas (theowlatlas.com)',
      license: 'CC BY 4.0',
    },
  },
];

/** Page geometry per size. One draw routine, two sets of numbers. */
export const SHARE_CARD_LAYOUTS = {
  portrait: {
    pad: 76, right: 1004, wordmark: {x: 76, baseline: 118, size: 44, gap: 1.12},
    topRule: 156, bottomRule: 1180,
    coin: {cx: 540, cy: 470, r: 225},
    eyebrow: {x: 76, y: 806, size: 15},
    headline: {x: 76, y: 916, size: 86, step: 92},
    fact: {x: 76, y: 1072, size: 23, step: 34, measure: 900, lines: 2},
    credit: {x: 76, y: 1222, size: 13, step: 22},
    editionY: 114,
  },
  landscape: {
    pad: 64, right: 1136, wordmark: {x: 64, baseline: 92, size: 40, gap: 1},
    topRule: 122, bottomRule: 548,
    coin: {cx: 936, cy: 332, r: 168},
    eyebrow: {x: 64, y: 196, size: 14},
    headline: {x: 64, y: 306, size: 80, step: 80},
    fact: {x: 64, y: 452, size: 20, step: 30, measure: 720, lines: 2},
    credit: {x: 64, y: 576, size: 12, step: 19},
    editionY: 88,
  },
};

/**
 * Root-absolute, same-origin, and nothing else. Sub-pages carry their image
 * paths one directory down, so `../public/...` and `public/...` both normalise
 * to the one path that resolves from any page depth.
 */
export function shareCardAssetPath(candidate) {
  const cleaned = String(candidate || '').replace(/^(?:\.\.\/)+/, '').replace(/^\/+/, '');
  if (!/^public\/images\/(?:derived\/)?[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(cleaned)) return null;
  return `/${cleaned}`;
}

/**
 * Turns the preset table into the cards this page may actually draw, using the
 * image records the page inlined. Anything whose rights are unresolved, whose
 * record is missing a credit, or whose file is not a same-origin image under
 * /public/images/ is dropped rather than drawn.
 */
export function resolveShareCards(images = {}, presets = SHARE_CARD_PRESETS) {
  const cards = [];
  for (const preset of presets) {
    const record = images[preset.image];
    if (record?.reuseStatus === 'review-pending') continue;
    const derived = (record?.derived?.sources || [])
      .filter((entry) => entry.width <= 1600)
      .sort((a, b) => b.width - a.width)[0];
    const path = shareCardAssetPath(derived?.path || record?.localUrl || preset.fallback?.path);
    if (!path) continue;
    const credit = preset.fallback?.credit || record?.credit;
    if (!credit) continue;
    const license = preset.fallback?.license || record?.license || '';
    cards.push({
      ...preset,
      path,
      credit: license ? `${credit} · ${license}` : credit,
      alt: `${preset.headline.join(' ')} ${preset.fact} ${preset.object}.`,
    });
  }
  return cards;
}

/* ------------------------------------------------------------------ canvas */

/** Fraunces ships as a variable woff2 whose default instance is wght 900, so
 *  every canvas font string resolves an explicit 400, exactly as the site does. */
function shareCardFont(size, {italic = false, family = SHARE_CARD_PALETTE.serif} = {}) {
  return `${italic ? 'italic ' : ''}400 ${size}px ${family}`;
}

/** Set after `font`: a canvas resets its spacing when the font shorthand changes. */
function shareCardFace(context, size, {italic = false, family, tracking = '0px'} = {}) {
  context.font = shareCardFont(size, {italic, family});
  if ('letterSpacing' in context) context.letterSpacing = tracking;
}

function shareCardText(context, value, {x, y, size, font, fill, alpha = 1, italic = false, tracking = '0px', align = 'left'}) {
  context.save();
  shareCardFace(context, size, {italic, family: font, tracking});
  context.fillStyle = fill;
  context.globalAlpha = alpha;
  context.textAlign = align;
  context.textBaseline = 'alphabetic';
  context.fillText(value, x, y);
  context.restore();
}

/** Greedy wrap against the real measured advance, capped at `lines`. */
function shareCardWrap(context, value, {size, font, italic = false, measure, lines = 2, tracking = '0px'}) {
  context.save();
  shareCardFace(context, size, {italic, family: font, tracking});
  const words = String(value).split(/\s+/).filter(Boolean);
  const out = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && context.measureText(next).width > measure && out.length < lines - 1) {
      out.push(current);
      current = word;
    } else current = next;
  }
  if (current) out.push(current);
  context.restore();
  return out.slice(0, lines);
}

/** The wordmark from the site header: ΑΘΕ with the coin's dotted theta, a hair
 *  rule, then THE OWL / ATLAS. Fraunces has no Greek, so ΑΘΕ is GFS Didot. */
function shareCardWordmark(context, {x, baseline, size, gap}) {
  const P = SHARE_CARD_PALETTE;
  const centre = baseline - size * 0.35;
  const theta = x + size * 1.075;
  shareCardText(context, 'Α', {x, y: baseline, size, font: P.greek, fill: P.paper});
  shareCardText(context, 'Ε', {x: x + size * 1.475, y: baseline, size, font: P.greek, fill: P.paper});
  context.save();
  context.strokeStyle = P.paper;
  context.lineWidth = Math.max(1.4, size * 0.0475);
  context.beginPath();
  context.arc(theta, centre, size * 0.355, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = P.paper;
  context.beginPath();
  context.arc(theta, centre, size * 0.065, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.24;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x + size * 2.55, baseline - size * 0.75);
  context.lineTo(x + size * 2.55, baseline + size * 0.15);
  context.stroke();
  context.restore();
  const label = Math.round(size * 0.325);
  const track = `${(1.6 * gap).toFixed(2)}px`;
  shareCardText(context, 'THE OWL', {x: x + size * 2.95, y: baseline - size * 0.325, size: label, font: P.mono, fill: P.paper, tracking: track});
  shareCardText(context, 'ATLAS', {x: x + size * 2.95, y: baseline + size * 0.1, size: label, font: P.mono, fill: P.paper, tracking: track});
}

/** Masks one photograph to its coin disc. `cover` is how much of the drawn
 *  circle the coin fills, leaving a little dark air around it. */
function shareCardCoin(context, media, card, {cx, cy, r}) {
  const P = SHARE_CARD_PALETTE;
  // The disc was measured against the original frame; rescale it to whichever
  // self-hosted copy actually loaded. A copy larger than the original would
  // mean an enlarged source pixel, so it is refused instead.
  const k = media.naturalWidth / card.source.width;
  context.save();
  context.strokeStyle = P.ring;
  context.globalAlpha = 0.44;
  context.lineWidth = 1.4;
  context.beginPath();
  context.arc(cx, cy, Math.round(r * 1.19), 0, Math.PI * 2);
  context.stroke();
  context.restore();
  context.save();
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fillStyle = P.well;
  context.fill();
  if (k > 0 && k <= 1.0001) {
    const disc = {cx: card.disc.cx * k, cy: card.disc.cy * k, r: card.disc.r * k};
    const scale = (r * (card.disc.cover || 1)) / disc.r;
    context.clip();
    context.drawImage(media,
      cx - disc.cx * scale, cy - disc.cy * scale,
      media.naturalWidth * scale, media.naturalHeight * scale);
  }
  context.restore();
  return k > 0 && k <= 1.0001;
}

/** Credits stay attached to the photograph: the footer wraps on its own
 *  separators rather than truncating an attribution. */
function shareCardCreditLines(context, parts, {size, measure}) {
  context.save();
  shareCardFace(context, size, {family: SHARE_CARD_PALETTE.mono, tracking: '0.9px'});
  const lines = [];
  for (const part of parts.filter(Boolean)) {
    const last = lines.at(-1);
    const joined = last ? `${last} · ${part}` : part;
    if (last && context.measureText(joined).width <= measure) lines[lines.length - 1] = joined;
    else lines.push(part);
  }
  context.restore();
  return lines.slice(0, 2);
}

/** The display faces, before the first stroke. Georgia (metrics-matched in the
 *  stylesheet) stands in if a face never arrives; the card still draws. */
export async function shareCardFontsReady(scope = globalThis.document) {
  if (!scope?.fonts?.load) return false;
  const wanted = [
    ['400 86px Fraunces', 'A small owl. 2,400 €1'],
    ['italic 400 86px Fraunces', 'An ancient world. Still here.'],
    ['400 44px "GFS Didot"', 'ΑΘΕ'],
  ];
  try {
    await Promise.all(wanted.map(([font, sample]) => scope.fonts.load(font, sample)));
    return true;
  } catch { return false; }
}

/**
 * Draws one card at its full pixel size. The canvas keeps its intrinsic
 * width/height; CSS scales the preview down. Returns false when the
 * photograph could not be placed, which leaves an empty coin well rather than
 * an enlarged source pixel.
 */
export function drawShareCard(canvas, card, size, media) {
  const P = SHARE_CARD_PALETTE;
  const layout = SHARE_CARD_LAYOUTS[size.id];
  const context = canvas.getContext('2d');
  canvas.width = size.width;
  canvas.height = size.height;
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = P.forest;
  context.fillRect(0, 0, size.width, size.height);
  context.save();
  context.strokeStyle = P.gold;
  context.globalAlpha = 0.22;
  context.lineWidth = 2;
  context.strokeRect(1, 1, size.width - 2, size.height - 2);
  context.restore();

  const hair = (y) => {
    context.save();
    context.strokeStyle = P.paper;
    context.globalAlpha = 0.18;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(layout.pad, y + 0.5);
    context.lineTo(layout.right, y + 0.5);
    context.stroke();
    context.restore();
  };

  shareCardWordmark(context, layout.wordmark);
  shareCardText(context, card.edition || '', {x: layout.right, y: layout.editionY, size: 13, font: P.mono, fill: P.paper, alpha: 0.45, tracking: '0.9px', align: 'right'});
  hair(layout.topRule);

  const drawn = shareCardCoin(context, media, card, layout.coin);

  shareCardText(context, card.eyebrow.toUpperCase(), {x: layout.eyebrow.x, y: layout.eyebrow.y, size: layout.eyebrow.size, font: P.mono, fill: P.gold, tracking: '1.9px'});
  card.headline.slice(0, 2).forEach((line, index) => {
    shareCardText(context, line, {
      x: layout.headline.x,
      y: layout.headline.y + index * layout.headline.step,
      size: layout.headline.size,
      font: P.serif,
      fill: P.paper,
      italic: index === 1,
      tracking: `${(-0.03 * layout.headline.size).toFixed(2)}px`,
    });
  });
  shareCardWrap(context, card.fact, {...layout.fact, font: P.serif, tracking: `${(-0.012 * layout.fact.size).toFixed(2)}px`})
    .forEach((line, index) => {
      shareCardText(context, line, {
        x: layout.fact.x,
        y: layout.fact.y + index * layout.fact.step,
        size: layout.fact.size,
        font: P.serif,
        fill: P.paper,
        alpha: 0.66,
        tracking: `${(-0.012 * layout.fact.size).toFixed(2)}px`,
      });
    });

  hair(layout.bottomRule);
  const address = 'theowlatlas.com';
  context.save();
  shareCardFace(context, layout.credit.size, {family: P.mono, tracking: '0.9px'});
  const addressWidth = context.measureText(address).width;
  context.restore();
  const credits = shareCardCreditLines(context, [card.object, card.credit, card.note], {
    size: layout.credit.size,
    measure: layout.right - layout.credit.x - addressWidth - 36,
  });
  credits.forEach((line, index) => {
    shareCardText(context, line, {x: layout.credit.x, y: layout.credit.y + index * layout.credit.step, size: layout.credit.size, font: P.mono, fill: P.paper, alpha: 0.46, tracking: '0.9px'});
  });
  shareCardText(context, address, {
    x: layout.right,
    y: layout.credit.y + Math.max(0, credits.length - 1) * layout.credit.step,
    size: layout.credit.size, font: P.mono, fill: P.gold, alpha: 0.8, tracking: '0.9px', align: 'right',
  });
  return drawn;
}

/* -------------------------------------------------------------- the wiring */

const SHARE_CARD_COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M10.2 13.8a3.4 3.4 0 0 0 5 .3l2.4-2.4a3.4 3.4 0 0 0-4.8-4.8l-1.4 1.4"/><path d="M13.8 10.2a3.4 3.4 0 0 0-5-.3l-2.4 2.4a3.4 3.4 0 0 0 4.8 4.8l1.4-1.4"/></svg>';

/** The canonical <link> is the production address even on a local preview, so
 *  a copied link is never a localhost URL. */
function shareCardBase(scope) {
  const canonical = scope.querySelector('link[rel="canonical"]')?.href;
  try { return new URL(canonical || scope.baseURI); } catch { return new URL(scope.baseURI); }
}

function shareCardCopy(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  // execCommand is the only fallback an insecure context has; it is deprecated,
  // never required, and its failure is reported like any other.
  return new Promise((resolve, reject) => {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand?.('copy');
    field.remove();
    if (ok) resolve(); else reject(new Error('Copying is unavailable in this browser.'));
  });
}

/**
 * @param {object} options
 * @param {object} options.data the page's inlined content record
 * @param {(open: boolean) => void} [options.onDialogToggle] lets the host page
 *   pin its chrome while the card maker is open, as its other dialogs do.
 */
export function initShareCards({data, onDialogToggle = () => {}} = {}) {
  const main = document.querySelector('main');
  if (!main) return;
  const base = shareCardBase(document);

  const announcer = document.createElement('p');
  announcer.className = 'sr-only';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  document.body.append(announcer);
  const announce = (message) => { announcer.textContent = ''; announcer.textContent = message; };

  // Every chapter heading breaks its own lines, and textContent would read
  // "From Athensto a wider world." Take the line breaks as the spaces they are,
  // on a clone, so naming a control never forces a layout.
  const label = (element) => {
    const clone = element.cloneNode(true);
    for (const brk of clone.querySelectorAll('br')) brk.replaceWith(' ');
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  };
  // A section that names itself with this heading lends it its own bookmark, so
  // the copied link is /#404 rather than /#crisis-title. Everything else falls
  // back to the heading's own id, and a heading with neither is left alone.
  const anchorFor = (heading) => {
    const owner = heading.closest('section[id],article[id],aside[id]');
    if (owner && main.contains(owner) && heading.id && owner.getAttribute('aria-labelledby') === heading.id) return `#${owner.id}`;
    return heading.id ? `#${heading.id}` : '';
  };

  /* --- A. a copy-link control on every chapter heading ------------------- */
  const headings = [...main.querySelectorAll('h1,h2,#anatomy-title')].filter((heading) =>
    !heading.classList.contains('sr-only') &&
    !heading.closest('dialog,.site-footer') &&
    // The home hero carries the share-card invitation instead; every other
    // heading on every page gets its own link.
    heading.id !== 'hero-title' &&
    anchorFor(heading));
  for (const heading of headings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'heading-share';
    heading.before(wrapper);
    wrapper.append(heading);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-copy';
    button.dataset.shareAnchor = anchorFor(heading);
    button.setAttribute('aria-label', `Copy a link to “${label(heading)}”`);
    button.innerHTML = `${SHARE_CARD_COPY_ICON}<span class="chapter-copy-text">Copy link</span>`;
    wrapper.append(button);
  }

  // One control at a time wears the "Copied" state, and one timer takes it off
  // again: copying a second link must not leave the first control saying
  // "Copied" for the rest of the visit.
  let revert = 0;
  let flashed = null;
  const restore = () => {
    if (!flashed) return;
    const previous = flashed.querySelector('.chapter-copy-text,.share-button-text');
    delete flashed.dataset.copied;
    if (previous?.dataset.label) previous.textContent = previous.dataset.label;
    flashed = null;
  };
  const flash = (button, message) => {
    restore();
    const text = button.querySelector('.chapter-copy-text,.share-button-text');
    if (text && !text.dataset.label) text.dataset.label = text.textContent;
    button.dataset.copied = 'true';
    if (text) text.textContent = 'Copied';
    flashed = button;
    announce(message);
    clearTimeout(revert);
    revert = setTimeout(restore, 1800);
  };

  /* --- B. a Share control in the chapter bar / the sub-page chrome strip -- */
  const bar = document.querySelector('.chapter-bar,.chrome-utility');
  const pageLabel = () =>
    document.querySelector('#current-chapter')?.textContent?.trim() ||
    document.querySelector('.chrome-utility-page')?.textContent?.trim() ||
    document.title;
  const pageUrl = () => {
    const active = [...main.querySelectorAll('[data-chapter][id]')]
      .filter((section) => section.getBoundingClientRect().top <= 200).at(-1);
    return new URL(active?.id ? `#${active.id}` : '', base).href;
  };

  let shareButton = null;
  let cardButton = null;
  if (bar) {
    const group = document.createElement('div');
    group.className = 'share-control';
    shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'share-button';
    shareButton.id = 'share-page';
    shareButton.setAttribute('aria-label', 'Share this page');
    shareButton.innerHTML = '<span aria-hidden="true" class="share-button-mark">↗</span><span class="share-button-text">Share</span>';
    cardButton = document.createElement('button');
    cardButton.type = 'button';
    cardButton.className = 'share-button share-card-button';
    cardButton.id = 'share-card-open';
    cardButton.setAttribute('aria-label', 'Make a share card');
    cardButton.innerHTML = '<span aria-hidden="true" class="share-button-mark">⊙</span><span class="share-button-text">Make a card</span>';
    group.append(shareButton, cardButton);
    bar.insertBefore(group, bar.querySelector('#motion-toggle') || null);
  }

  document.addEventListener('click', (event) => {
    const copy = event.target instanceof Element ? event.target.closest('.chapter-copy') : null;
    if (!copy) return;
    const url = new URL(copy.dataset.shareAnchor || '', base).href;
    shareCardCopy(url).then(() => flash(copy, `Link copied: ${url}`), (error) => announce(error.message));
  });

  shareButton?.addEventListener('click', () => {
    const url = pageUrl();
    if (typeof navigator.share === 'function') {
      navigator.share({title: document.title, text: pageLabel(), url})
        .catch(() => { /* A cancelled share is not an error. */ });
      return;
    }
    shareCardCopy(url).then(() => flash(shareButton, `Link copied: ${url}`), (error) => announce(error.message));
  });

  /* --- C. the coin-card maker ------------------------------------------- */
  const dialog = document.querySelector('#share-card-dialog');
  const canvas = document.querySelector('#share-card-canvas');
  const heroLink = document.querySelector('#hero-share-card');
  const cards = resolveShareCards(data?.images || {});
  if (!dialog || !canvas || typeof dialog.showModal !== 'function' || !cards.length) {
    cardButton?.remove();
    return;
  }
  const edition = `${data.edition} / ${String(data.reviewed || '').slice(0, 4)}`;
  for (const entry of cards) entry.edition = edition;

  const list = document.querySelector('#share-card-presets');
  const status = document.querySelector('#share-card-status');
  const creditLine = document.querySelector('#share-card-credit');
  const download = document.querySelector('#share-card-download');
  const share = document.querySelector('#share-card-share');
  const media = new Map();
  let current = cards[0];
  let currentSize = SHARE_CARD_SIZES[0];
  let token = 0;
  let fonts = null;

  for (const [index, entry] of cards.entries()) {
    const option = document.createElement('label');
    option.className = 'share-card-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'share-card-preset';
    input.value = entry.id;
    input.checked = index === 0;
    const text = document.createElement('span');
    text.className = 'share-card-option-text';
    const title = document.createElement('strong');
    title.textContent = entry.name;
    const line = document.createElement('span');
    line.textContent = entry.headline.join(' ');
    text.append(title, line);
    option.append(input, text);
    list.append(option);
    input.addEventListener('change', () => { current = entry; render(); });
  }
  for (const input of document.querySelectorAll('input[name="share-card-size"]')) {
    input.addEventListener('change', () => {
      currentSize = SHARE_CARD_SIZES.find((size) => size.id === input.value) || currentSize;
      render();
    });
  }

  function load(path) {
    if (media.has(path)) return media.get(path);
    const promise = new Promise((resolve, reject) => {
      const element = new Image();
      // Same-origin only: no crossOrigin, so nothing can taint the canvas.
      element.decoding = 'async';
      element.addEventListener('load', () => resolve(element), {once: true});
      element.addEventListener('error', () => reject(new Error('That photograph could not be loaded.')), {once: true});
      element.src = path;
    });
    media.set(path, promise);
    return promise;
  }

  async function render() {
    const mine = ++token;
    status.textContent = 'Drawing…';
    fonts = fonts || shareCardFontsReady(document);
    try {
      await fonts;
      const picture = await load(current.path);
      if (mine !== token) return;
      const placed = drawShareCard(canvas, current, currentSize, picture);
      canvas.dataset.ready = 'true';
      canvas.setAttribute('aria-label', `${currentSize.label} share card: ${current.alt}`);
      creditLine.textContent = [current.object, current.credit, current.note].filter(Boolean).join(' · ');
      status.textContent = placed ? '' : 'The photograph is smaller than its record, so the card was drawn without it.';
      download.disabled = false;
    } catch (error) {
      if (mine !== token) return;
      status.textContent = error.message;
      download.disabled = true;
    }
  }

  const fileName = () => `owl-atlas-${current.id}-${currentSize.width}x${currentSize.height}.png`;
  const toBlob = () => new Promise((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('This browser could not export the card.')), 'image/png'));

  download.addEventListener('click', () => {
    toBlob().then((blob) => {
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = fileName();
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(href), 4000);
      status.textContent = `Saved ${fileName()}.`;
    }, (error) => { status.textContent = error.message; });
  });

  if (share) {
    share.hidden = typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function';
    share.addEventListener('click', () => {
      toBlob().then((blob) => {
        const file = new File([blob], fileName(), {type: 'image/png'});
        if (!navigator.canShare({files: [file]})) {
          status.textContent = 'This browser cannot share an image. Download the card instead.';
          return;
        }
        navigator.share({files: [file], title: current.headline.join(' '), text: current.fact, url: base.href})
          .catch(() => { /* A cancelled share is not an error. */ });
      }, (error) => { status.textContent = error.message; });
    });
  }

  const open = () => {
    dialog.showModal();
    onDialogToggle(true);
    render();
    list.querySelector('input')?.focus({preventScroll: true});
  };
  cardButton?.addEventListener('click', open);
  if (heroLink) {
    heroLink.hidden = false;
    heroLink.addEventListener('click', open);
  }
  document.querySelector('#share-card-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { token++; onDialogToggle(false); });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
