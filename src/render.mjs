/** Shared, dependency-free rendering used by the build and the browser. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

/** A citation's margin label is derived here rather than stored, so it can never
 *  drift from the bibliography record it names. Wide screens print it beside the
 *  numeral; the dialog and the bibliography keep the full, unshortened record. */
export const SOURCE_SHORT_LABEL_MAX = 40;

const familyName = (name) => name.trim().split(/\s+/).pop();

/** Only the record's own leading date becomes part of a label. A trailing
 *  qualifier ("; translation 1913", "; accessed 2026") and a bare "2026 access"
 *  are dropped: a margin label must never make an ancient or undated record look
 *  as though it were published in the year someone last opened it. */
function sourceShortDate(source) {
  const year = String(source.year ?? '').split(/\s*;\s*/)[0];
  if (/access/i.test(year)) return '';
  const match = year.match(/\b(?:1\d{3}|2\d{3})\b/);
  if (!match) return '';
  return /^updated\b/i.test(year) ? `updated ${match[0]}` : match[0];
}

export function sourceShortLabel(source) {
  // A record may name its own margin label where two would otherwise read alike.
  if (source.short) return source.short;
  // A ";" or "·" separates distinct parties in these records; name the first.
  const author = String(source.author ?? '').split(/\s*[;·]\s*/)[0]
    .replace(/^Translation:\s*/i, '').trim();
  // "&" marks a byline of people here; institutions spell out "and"/"et".
  const people = / & /.test(author) ? author.split(/\s*(?:,| & )\s*/).filter(Boolean) : [];
  const brief = people.length === 2 ? `${familyName(people[0])} & ${familyName(people[1])}`
    : people.length > 2 ? `${familyName(people[0])} et al.`
    : author.split(/\s*,\s*/)[0];
  const date = sourceShortDate(source);
  const withDate = (name) => (date ? `${name} ${date}` : name);
  // Shorten only as far as the margin requires, keeping the fullest form that fits.
  for (const candidate of [author, author.replace(/^The /, ''), author.split(' / ')[0], brief]) {
    const label = withDate(candidate);
    if (label.length <= SOURCE_SHORT_LABEL_MAX) return label;
  }
  return `${withDate(brief).slice(0, SOURCE_SHORT_LABEL_MAX - 1).trimEnd()}…`;
}

export function sourceRefs(ids, data) {
  const chips = ids.map((id) => {
    const index = data.sources.findIndex((source) => source.id === id);
    if (index < 0) throw new Error(`Unknown source: ${id}`);
    const source = data.sources[index];
    const number = String(index + 1).padStart(2, '0');
    const short = escapeHtml(sourceShortLabel(source));
    // The square brackets are drawn by CSS so wide screens can drop them for a
    // plain superscript numeral. The note is decorative: the link already names
    // the source for assistive technology and still opens the same dialog.
    return `<a href="#source-${escapeHtml(id)}" data-source="${escapeHtml(id)}" data-short="${short}" aria-label="Source ${number}: ${escapeHtml(source.title)}">${number}</a>`
      + `<span class="cite-note" aria-hidden="true"><span class="cite-note-index">${number}</span>${short}</span>`;
  });
  return `<sup class="citation">${chips.join(' ')}</sup>`;
}

/** Rendered slot widths per layout class, so the browser can choose a derivative
 *  instead of always downloading the largest one. */
export const photoSizes = {
  'hero-photo': '(max-width: 688px) 90vw, 620px',
  'comparison-photo': '50vw',
  'family-photo': '25vw',
  'close-reading-photograph': '(max-width: 900px) 90vw, 600px',
  'origins-photo': '(max-width: 900px) 92vw, 40vw',
};

/** The hero disc is never wider than 620 CSS pixels, and the close reading's
 *  photograph column never wider than 600, so neither has any use for the
 *  2,400-pixel copy on disk. */
export const photoMaxWidths = {'hero-photo': 1600, 'close-reading-photograph': 1600};

const matchClass = (className, table, fallback) => {
  const classes = String(className || '').split(/\s+/);
  for (const [name, value] of Object.entries(table)) if (classes.includes(name)) return value;
  return fallback;
};

export function photoSizesFor(className) {
  return matchClass(className, photoSizes, '100vw');
}

export function photoMaxWidthFor(className) {
  return matchClass(className, photoMaxWidths, Infinity);
}

/** Self-hosted resized display copies, smallest first. Absent for the six
 *  reuse-review-pending photographs, which keep hotlinking their originals. */
export function derivedSources(image, maxWidth = Infinity) {
  const sources = image?.derived?.sources || [];
  const usable = sources.filter((source) => source.width <= maxWidth);
  return usable.length ? usable : sources.slice(0, 1);
}

export function derivedSrcset(image, maxWidth = Infinity) {
  return derivedSources(image, maxWidth).map((source) => `${source.path} ${source.width}w`).join(', ');
}

export function photoMarkup(id, data, className = '', cropOverride, eager = false) {
  const image = data.images[id];
  if (!image) throw new Error(`Unknown image: ${id}`);
  const crop = cropOverride ?? image.crop ?? 'none';
  const cropLabels = {top: 'Athena, top half of a paired plate', bottom: 'Owl, bottom half of a paired plate', left: 'Athena, left half of a paired plate', right: 'Owl, right half of a paired plate'};
  const alt = crop === 'none' ? image.alt : `${cropLabels[crop]}. Open to see the complete source photograph. ${image.title}.`;
  const original = image.localUrl || image.url;
  const sources = derivedSources(image, photoMaxWidthFor(className));
  const displayed = sources.length ? sources[0].path : (image.localUrl || image.displayUrl || image.url);
  const responsive = sources.length > 1
    ? ` srcset="${escapeHtml(derivedSrcset(image, photoMaxWidthFor(className)))}" sizes="${escapeHtml(photoSizesFor(className))}"`
    : '';
  // A blurred 24-pixel copy keeps the hero disc from opening as an empty well.
  const placeholder = String(className || '').split(/\s+/).includes('hero-photo') && image.derived?.placeholder
    ? ` style="background-image:url(${escapeHtml(image.derived.placeholder)})"` : '';
  const credit = image.credit;
  return `<figure class="image-figure ${escapeHtml(className)}" data-photo="${escapeHtml(id)}" style="--plate-ratio:${image.width / image.height}">
    <div class="image-surface"${placeholder}>
      <a class="image-trigger" href="${escapeHtml(original)}" target="_blank" rel="noopener noreferrer" data-image="${escapeHtml(id)}" aria-label="Inspect ${escapeHtml(image.title)} in the image viewer">
        <span class="image-frame"><img src="${escapeHtml(displayed)}"${responsive} width="${image.width}" height="${image.height}" class="crop-${escapeHtml(crop)}" alt="${escapeHtml(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}></span>
        <span class="image-unavailable" aria-hidden="true"><span>Photograph unavailable.<br><span>View source & credits ↗</span></span></span>
        <span class="expand-label" aria-hidden="true">Look closer <span>↗</span></span>
      </a>
    </div>
    <figcaption class="image-credit"><a href="${escapeHtml(image.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(credit)}</a><span class="license-short"><a href="${escapeHtml(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(image.license)}</a></span>${image.reuseStatus === 'review-pending' ? '<a class="reuse-badge" href="#image-reuse-policy">Reuse review pending ↗</a>' : ''}</figcaption>
  </figure>`;
}

export function photoGapMarkup(family, side = 'obverse') {
  const message = family.image ? `No ${side} photograph in this edition.` : 'Documented photo gap';
  const glyph = family.id === 'pi' ? 'π' : '—';
  return `<div class="photo-gap"><span class="gap-glyph" aria-hidden="true">${glyph}</span><span class="eyebrow">${escapeHtml(message)}</span><span class="micro-copy">No substitute coin has been used.</span></div>`;
}

export function familyFacesMarkup(family, data) {
  const faces = ['obverse', 'reverse'].map((side) => {
    const label = side === 'obverse' ? 'Obverse' : 'Reverse';
    const photo = family[side]
      ? photoMarkup(family[side], data, 'family-photo', family[`${side}Crop`])
      : photoGapMarkup(family, side);
    return `<div class="family-face" role="group" aria-label="${label} of ${escapeHtml(family.name)}"><p class="eyebrow family-face-label">${label}</p>${photo}</div>`;
  });
  return `<div class="family-faces">${faces.join('')}</div>`;
}

/** The close reading in chapter 02. Every reading, on both faces, with its
 *  citations, is in the document before a script runs: without JavaScript the
 *  two photographs and all six readings are simply there, and the controls that
 *  would switch between them stay hidden. The enhancement in app.js reveals the
 *  buttons and the numbered marker, then shows one reading at a time. */
export function closeReadingMarkup(data) {
  const {note, readings, coda} = data.closeReading;
  const numbered = readings.map((reading, index) => ({...reading, number: String(index + 1).padStart(2, '0')}));
  const panels = ['reverse', 'obverse'].map((side) => {
    const details = numbered.filter((reading) => reading.side === side);
    if (!details.length) throw new Error(`The close reading has no ${side} reading.`);
    const label = side === 'reverse' ? 'Owl / reverse' : 'Athena / obverse';
    const buttons = details.map((detail) =>
      `<button type="button" data-close-reading="${escapeHtml(detail.id)}" aria-pressed="false" aria-controls="close-reading-${escapeHtml(detail.id)}"><span>${detail.number}</span>${escapeHtml(detail.name)}</button>`).join('');
    const items = details.map((detail) =>
      `<article class="close-reading-item" id="close-reading-${escapeHtml(detail.id)}"><span class="eyebrow">${detail.number} / ${escapeHtml(side)}</span><h4>${escapeHtml(detail.title)}</h4><p>${escapeHtml(detail.text)} ${sourceRefs(detail.refs, data)}</p></article>`).join('');
    return `<div class="close-reading-layout" id="close-reading-${side}" data-close-reading-side="${side}" role="group" aria-labelledby="close-reading-${side}-label">`
      + `<div class="close-reading-photo"><p class="face-label" id="close-reading-${side}-label">${escapeHtml(label)} · ${details.length} details</p>`
      + `${photoMarkup(details[0].image, data, 'close-reading-photograph')}<span aria-hidden="true" class="close-reading-marker" hidden></span></div>`
      + `<div class="close-reading-controls"><div aria-label="Choose a detail on the ${escapeHtml(side)}" class="detail-buttons" hidden>${buttons}</div>`
      + `<div class="close-reading-text">${items}</div><p class="micro-copy">${escapeHtml(note)}</p></div></div>`;
  }).join('');
  const links = coda.links.map((link) =>
    `<a class="quiet-link" href="${escapeHtml(link.href)}" data-compare-preset="${escapeHtml(link.preset)}">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`).join('');
  return `${panels}<div class="close-reading-coda reveal"><p>${escapeHtml(coda.text)} ${sourceRefs(coda.refs, data)}</p><div class="close-reading-coda-links">${links}</div></div>`;
}

export function comparisonMarkup(familyId, side, data, specimenId) {
  const family = data.families.find((entry) => entry.id === familyId);
  if (!family) throw new Error(`Unknown family: ${familyId}`);
  if (!['obverse', 'reverse'].includes(side)) throw new Error(`Unknown coin side: ${side}`);
  const available = family.specimens || [];
  if (specimenId && !available.includes(specimenId)) throw new Error(`Specimen ${specimenId} does not belong to ${familyId}`);
  const selectedId = specimenId || available[0];
  const specimen = selectedId ? data.specimens[selectedId] : null;
  if (selectedId && !specimen) throw new Error(`Unknown specimen: ${selectedId}`);
  const imageId = specimen ? specimen[side] : family[side];
  const photo = imageId ? photoMarkup(imageId, data, 'comparison-photo', family[`${side}Crop`], true) : photoGapMarkup(family, side);
  const specimenNote = specimen ? `<div class="comparison-specimen"><span class="eyebrow">ILLUSTRATED SPECIMEN</span><h4>${escapeHtml(specimen.name)}</h4><p><strong>Catalogue date:</strong> ${escapeHtml(specimen.catalogueDate)} ${sourceRefs(specimen.refs, data)}</p><p>${escapeHtml(specimen.dateNote)}</p></div>` : '';
  return `<article class="comparison-panel">${photo}<h3>${escapeHtml(family.name)}</h3><span class="eyebrow">${escapeHtml(family.date)}</span><p class="feature">${escapeHtml(family.feature)} ${sourceRefs(family.refs, data)}</p>${specimenNote}<p class="micro-copy">${escapeHtml(family.status)}</p></article>`;
}

// Pricing is derived from the observations, never from the museum photographs.
export function marketMoney(value) {
  return new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:Number.isInteger(value) ? 0 : 2}).format(value);
}

export function marketStats(records) {
  const values = records.map(record => record.buyer_price_before_tax_shipping).filter(Number.isFinite).sort((a,b) => a-b);
  if (!values.length) return null;
  const middle = Math.floor(values.length / 2);
  return {n:values.length, min:values[0], max:values.at(-1), median:values.length % 2 ? values[middle] : Math.round((values[middle-1] + values[middle]) * 50) / 100};
}

export function marketLink(record, label = `${record.venue} ${record.auction} / ${record.lot}`) {
  return `<a href="${escapeHtml(record.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <span aria-hidden="true">↗</span></a>`;
}

export function marketFamilyMarkup(family, data) {
  const note = data.market?.familyNotes[family.id];
  if (!note) return '';
  return `<details class="family-market"><summary>Recent prices for other specimens</summary><p>${escapeHtml(note.text)}</p><p class="micro-copy">USD, including buyer premium; before tax and shipping. Research: 17 September 2026.</p><p>${note.ids.map(id => marketLink(data.market.records.find(record => record.id === id))).join(' · ')}</p><a class="quiet-link" href="pricing/">Explore prices &amp; the evidence ↗</a></details>`;
}

export function marketSummaryMarkup(data) {
  const low = data.market.records.find(r => r.id === 'CNG-612-89');
  const high = data.market.records.find(r => r.id === 'Heritage-3130-36022');
  const classic = marketStats(data.market.records.filter(r => r.cohort === 'current consecutive lots' && r.grade === 'Choice XF'));
  return `<article><span class="eyebrow">PI STYLE</span><strong>${marketMoney(low.buyer_price_before_tax_shipping)}</strong><h3>A later owl.</h3><p>Good Very Fine, with a worn obverse die. One auction result.</p><a href="pricing/#sale-${low.id}">See this sale <span aria-hidden="true">↗</span></a></article>
  <article class="market-summary-classical"><span class="eyebrow">CLASSICAL MASS ISSUES</span><strong>${marketMoney(classic.min)}–${marketMoney(classic.max)}</strong><h3>The familiar design.</h3><p>Seven owls graded Choice Extremely Fine. A comparison group, not a fixed price.</p><a href="pricing/#market-current-title">Compare recent sales <span aria-hidden="true">↗</span></a></article>
  <article><span class="eyebrow">ARCHAIC</span><strong>${marketMoney(high.buyer_price_before_tax_shipping)}</strong><h3>An earlier form.</h3><p>Very Fine, with a flan flaw and low weight. One auction result.</p><a href="pricing/#sale-${high.id}">See this sale <span aria-hidden="true">↗</span></a></article>`;
}

export function marketCurrentMarkup(data) {
  const core = data.market.records.filter(record => record.cohort === 'current consecutive lots');
  const groups = [
    ['Raw VF / Good VF','Visible wear; varying surface issues',data.market.records.filter(record => record.cohort === 'current raw examples')],
    ['Choice XF','NGC · Choice Extremely Fine',core.filter(record => record.grade === 'Choice XF')],
    ['AU','NGC · About Uncirculated',core.filter(record => record.grade === 'AU')],
    ['Choice AU','NGC · Choice About Uncirculated',core.filter(record => record.grade === 'Choice AU')],
    ['Mint State','NGC · no problems listed in these five descriptions',core.filter(record => record.grade === 'MS' && !record.notes)],
  ];
  return groups.map(([label, note, records]) => {
    const s = marketStats(records);
    return `<article class="market-band"><div><h3>${label}</h3><p>${note}</p></div><div class="market-band-price"><strong>${marketMoney(s.min)}–${marketMoney(s.max)}</strong><span>${s.n} sales · median ${marketMoney(s.median)}</span><span class="market-range" aria-hidden="true"><i style="left:${s.min/25}%;width:${(s.max-s.min)/25}%"></i><b style="left:${s.median/25}%"></b></span></div></article>`;
  }).join('');
}

export function marketHistoryMarkup(data) {
  const records = data.market.records.filter(r => ['current consecutive lots','historical matched grade'].includes(r.cohort) && r.grade === 'Choice XF' && r.strike === 5 && r.surface === 4);
  const years = [...new Set(records.map(r => r.reported_date.slice(0,4)))].sort();
  function chart(mobile = false) {
  const x = value => (mobile ? 68 : 125) + value / 1600 * (mobile ? 195 : 520);
  const medianPosition = mobile ? 'x="385" text-anchor="end"' : 'x="685"';
  const grid = [0,500,1000,1500].map(value => `<line x1="${x(value)}" x2="${x(value)}" y1="40" y2="${mobile ? 472 : 410}"/><text x="${x(value)}" y="22" text-anchor="middle">${mobile && value >= 1000 ? `$${value/1000}k` : marketMoney(value)}</text>`).join('');
  const bars = years.map((year, index) => {
    const group = records.filter(r => r.reported_date.startsWith(year));
    const s = marketStats(group); const y = 65 + index * (mobile ? 52 : 47);
    return `<text x="5" y="${y+4}" class="market-chart-year">${year}</text><text x="${mobile ? 5 : 63}" y="${y+(mobile ? 25 : 4)}">n=${s.n}</text><line class="market-chart-range" x1="${x(s.min)}" x2="${x(s.max)}" y1="${y}" y2="${y}"/>${group.map((r,i) => `<circle cx="${x(r.buyer_price_before_tax_shipping)}" cy="${y+(i-(group.length-1)/2)*4}" r="${mobile ? 3 : 4}"/>`).join('')}<line class="market-chart-median" x1="${x(s.median)}" x2="${x(s.median)}" y1="${y-11}" y2="${y+11}"/><text class="market-chart-total" ${medianPosition} y="${y+4}">${marketMoney(s.median)}</text>`;
  }).join('');
  return `<svg class="market-history-chart ${mobile ? 'market-chart-mobile' : 'market-chart-wide'}" viewBox="0 0 ${mobile ? '390 490' : '790 440'}" role="img" aria-label="Selected Choice XF sales, 2019–2026. Twenty-four observations; full values and sources follow in the table.">${grid}<text ${medianPosition} y="22">Median</text>${bars}</svg>`;
  }
  const rows = years.map(year => {
    const group=records.filter(r=>r.reported_date.startsWith(year)); const s=marketStats(group);
    return `<tr><th scope="row">${year}</th><td>${s.n}</td><td>${marketMoney(s.min)}–${marketMoney(s.max)}</td><td>${marketMoney(s.median)}</td><td>${group.map(r=>marketLink(r,`${r.auction}/${r.lot}`)).join('<br>')}</td></tr>`;
  }).join('');
  return `<figure class="market-history-figure">${chart()}${chart(true)}<figcaption>Each dot is a sale. The upright mark is the sample median; <em>n</em> is the number of sales. USD including buyer premium, before tax and shipping. Small, selected samples—not a market index.</figcaption></figure><details class="market-disclosure"><summary>Read the values and individual sources</summary><p class="market-scroll-hint">Swipe or scroll sideways to see every column ↔</p><div class="market-scroll" role="region" tabindex="0" aria-label="Historical price table"><table class="market-table"><caption>Classical mass issues · NGC Choice XF · strike 5/5, surface 4/5</caption><thead><tr><th scope="col">Year</th><th scope="col">Sales</th><th scope="col">Range</th><th scope="col">Median</th><th scope="col">Sale records</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

export function marketFamiliesMarkup(data) {
  const records = data.market.records.filter(r=>r.cohort==='other families');
  return records.map(r=>`<tr><th scope="row"><a href="../#family-${r.familyId}">${escapeHtml(r.family)}</a></th><td>${escapeHtml(r.grade)}${r.strike ? ` · ${r.strike}/5 strike, ${r.surface}/5 surface` : ''}<small>${escapeHtml(r.notes)}</small></td><td>${marketMoney(r.buyer_price_before_tax_shipping)}</td><td>${marketLink(r)}</td></tr>`).join('');
}

export function marketLedgerMarkup(data) {
  return [...data.market.records].sort((a,b)=>b.reported_date.localeCompare(a.reported_date)||a.id.localeCompare(b.id)).map(r=>{
    const isEbay=r.venue==='eBay';
    return `<tr id="sale-${escapeHtml(r.id)}" data-market-row data-market-family="${escapeHtml(r.familyId)}" data-market-venue="${r.venue}"><th scope="row">${escapeHtml(r.reported_date)}<small>${escapeHtml(r.venue)} · ${escapeHtml(r.auction)} / ${escapeHtml(r.lot)}</small></th><td>${escapeHtml(r.family)}<small>${r.venue==='Heritage' ? 'NGC ' : ''}${escapeHtml(r.grade)}${r.strike ? ` · ${r.strike}/5 strike · ${r.surface}/5 surface` : ''}</small>${r.notes ? `<p>${escapeHtml(r.notes)}</p>` : ''}</td><td class="market-ledger-price">${marketMoney(isEbay ? r.amount : r.buyer_price_before_tax_shipping)}<small class="${isEbay ? 'market-unverified' : ''}">${isEbay ? 'Displayed only · actual price unverified' : 'Including buyer premium'}</small>${r.price_basis==='hammer' ? `<small>${marketMoney(r.amount)} hammer + ${r.buyer_premium_rate*100}%</small>` : ''}</td><td>${marketLink(r,'Sale record')}<small>${escapeHtml(r.date_basis)}</small></td></tr>`;
  }).join('');
}

export function marketCsv(market) {
  const keys=Object.keys(market.records[0]);
  const cell=value=>{
    let text=String(value??'');
    if (typeof value==='string' && /^[=+@-]/.test(text)) text=`'${text}`;
    return `"${text.replace(/"/g,'""')}"`;
  };
  return [keys.map(cell).join(','),...market.records.map(r=>keys.map(key=>cell(r[key])).join(','))].join('\r\n')+'\r\n';
}

// Geographic outlines are supplied at build time, so no map service or runtime
// geometry dependency is needed. Each view retains true geographic coordinates.
function clipGeoRing(ring, bounds) {
  let points = ring;
  for (const [axis, edge, greater] of [[0,bounds[0],true],[0,bounds[2],false],[1,bounds[1],true],[1,bounds[3],false]]) {
    if (!points.length) break;
    const result = [];
    let previous = points.at(-1);
    let wasInside = greater ? previous[axis] >= edge : previous[axis] <= edge;
    for (const point of points) {
      const inside = greater ? point[axis] >= edge : point[axis] <= edge;
      if (inside !== wasInside) {
        const t = (edge - previous[axis]) / (point[axis] - previous[axis]);
        result.push([previous[0] + t * (point[0] - previous[0]), previous[1] + t * (point[1] - previous[1])]);
      }
      if (inside) result.push(point);
      previous = point; wasInside = inside;
    }
    points = result;
  }
  return points;
}
function geoProjection(bounds, width, height) {
  const lon = (bounds[0] + bounds[2]) / 2, lat = (bounds[1] + bounds[3]) / 2;
  const cosine = Math.cos(lat * Math.PI / 180);
  const small = width < 400, footer = small ? 0 : 30;
  const scale = Math.min((width - (small ? 20 : 60)) / ((bounds[2] - bounds[0]) * cosine), (height - (small ? 20 : 80)) / (bounds[3] - bounds[1]));
  const xy = ([x,y]) => [width / 2 + (x - lon) * cosine * scale, (height - footer) / 2 - (y - lat) * scale];
  return {xy, scale, bounds:[lon - width / (2 * scale * cosine), lat - (height + footer) / (2 * scale), lon + width / (2 * scale * cosine), lat + (height - footer) / (2 * scale)]};
}
function geoPath(rings, projection) {
  return rings.map(ring => {
    const points = clipGeoRing(ring, projection.bounds);
    return points.length < 3 ? '' : `M${points.map(p => projection.xy(p).map(v => v.toFixed(1)).join(',')).join('L')}Z`;
  }).join('');
}
// A quiet graticule on the water. The step is picked so a view never carries
// more than seven lines in either direction, whatever its span.
function geoGraticule(projection) {
  const [west, south, east, north] = projection.bounds;
  const step = [.25,.5,1,2,5,10,15].find(v => Math.max(east - west, north - south) / v <= 7) || 20;
  const segment = (a,b) => `M${projection.xy(a).map(v => v.toFixed(1)).join(',')}L${projection.xy(b).map(v => v.toFixed(1)).join(',')}`;
  let path = '';
  for (let i = Math.ceil(west / step); i * step <= east; i += 1) path += segment([i * step, south],[i * step, north]);
  for (let i = Math.ceil(south / step); i * step <= north; i += 1) path += segment([west, i * step],[east, i * step]);
  return path ? `<path class="geo-graticule" d="${path}"/>` : '';
}
// Sea, shelf and land are separate painted layers so the coastline reads as a
// drawn edge rather than as the absence of a fill. The shelf is the same base
// outline stroked wide underneath the land, so only its seaward half survives.
function geoGround(width, height, baseId, graticule = '') {
  return `<rect class="geo-sea" width="${width}" height="${height}"/>${graticule}<use class="geo-shelf geo-shelf-outer" href="#${baseId}"/><use class="geo-shelf" href="#${baseId}"/><use class="geo-base geo-land" href="#${baseId}"/>`;
}
// The selected area is painted as a halo, a fill and a traceable outline. All
// four layers reuse one outline, so the extra passes cost references rather than
// geometry, and pathLength="1" lets the outline draw itself in at any scale.
// An empty `selected` means the outline already lives in the shared defs.
function geoAreaLayers(areaId, selected, patternId = '') {
  const defs = selected ? `<defs><path id="${areaId}" pathLength="1" d="${selected}"/></defs>` : '';
  return `${defs}<use class="geo-area-glow" href="#${areaId}"/><use class="geo-area-glow geo-area-glow-inner" href="#${areaId}"/><use class="geo-area" href="#${areaId}"${patternId ? ` style="fill:url(#${patternId})"` : ''}/><use class="geo-area-trace" href="#${areaId}"/>`;
}
function geographyMap(place, geometry, locator = false) {
  const width = locator ? 360 : 720, height = locator ? 190 : 450;
  const projection = geoProjection(locator ? (place.id === 'athens' ? [18,33.5,30,43] : [7,10,78,47]) : place.bounds, width, height);
  const id = `geo-${place.id}-${locator ? 'locator' : 'map'}`;
  const countries = Object.entries(geometry.countries).filter(([code]) => locator || place.id !== 'athens' || code !== 'GRC').map(([, country]) => country);
  if (!locator && place.id === 'athens') countries.push(...Object.values(geometry.greekRegions));
  const base = countries.map(country => geoPath(country.rings, projection)).filter(Boolean);
  const sharedWorld = locator && place.id !== 'athens';
  const baseId = sharedWorld ? 'geo-world-outlines' : `${id}-base`;
  // Every locator but Attica's shares the wide frame, so it also shares the
  // outline the overview map already carries.
  const areaId = sharedWorld ? `geo-reach-${place.id}` : `${id}-area`;
  const selected = sharedWorld ? '' : geoPath(geometry.shapes[place.shape], projection);
  const hatch = place.approximate && !locator;
  let overlays = '';
  if (!locator) {
    for (const river of geometry.rivers) for (const line of river.lines) {
      // Keep contiguous in-frame segments, avoiding spurious lines across a map.
      let drawing = false, path = '';
      for (const point of line) {
        const [x,y] = projection.xy(point), inside = x >= 0 && x <= width && y >= 0 && y <= height - 40;
        if (inside) path += `${drawing ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
        drawing = inside;
      }
      if (path) overlays += `<path class="geo-river" d="${path}"/>`;
    }
  }
  const [ax,ay] = projection.xy([23.73,37.98]);
  if (locator || place.id === 'athens') overlays += `<circle class="geo-city" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${locator ? 3 : 6}"/>`;
  if (locator) {
    const focused = geoProjection(place.bounds,720,450).bounds;
    const [x,y] = projection.xy([focused[0],focused[3]]), [right,bottom] = projection.xy([focused[2],focused[1]]);
    overlays += `<rect class="geo-view-window" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(right-x).toFixed(1)}" height="${(bottom-y).toFixed(1)}"/><text class="geo-locator-label" x="${(ax-7).toFixed(1)}" y="${(ay-7).toFixed(1)}" text-anchor="end">Athens</text>`;
  } else {
    for (const [name,lon,lat,kind] of place.labels) {
      const [x,y] = projection.xy([lon,lat]);
      overlays += `<text class="geo-map-label geo-map-label-${kind}" x="${(x+(kind === 'city' ? 14 : 0)).toFixed(1)}" y="${(y+(kind === 'city' ? 27 : 0)).toFixed(1)}" text-anchor="${kind === 'city' ? 'start' : 'middle'}">${escapeHtml(name)}</text>`;
    }
    const maxKm = 155 / projection.scale * 111.195;
    const km = [1,2,5,10,20,50,100,200,500,1000,2000].filter(v => v <= maxKm).at(-1) || 1;
    const length = km / 111.195 * projection.scale;
    overlays += `<g class="geo-scale"><rect x="16" y="${height-55}" width="220" height="49" rx="2"/><path d="M28,${height-30}v7h${length.toFixed(1)}v-7"/><text x="28" y="${height-35}">${km} km</text></g><text class="geo-north" x="${width-25}" y="${height-22}" text-anchor="end">N ↑</text>`;
  }
  const accessible = locator ? 'aria-hidden="true" focusable="false"' : `role="img" aria-labelledby="${id}-title ${id}-desc"`;
  return `<svg class="${locator ? 'geo-locator-map' : 'geo-focus-map'}" viewBox="0 0 ${width} ${height}" ${accessible}>${locator ? '' : `<title id="${id}-title">${escapeHtml(place.name)}: ${escapeHtml(place.legend)}</title><desc id="${id}-desc">${escapeHtml(place.where)} ${escapeHtml(place.mapNote)} North is up. The scale bar is approximate at the map centre.</desc>`}${hatch ? `<defs><pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#d6c99e"/><path d="M-2,2L2,-2M0,8L8,0M6,10L10,6" stroke="#84784f" stroke-width="1"/></pattern></defs>` : ''}${sharedWorld ? '' : `<defs><path id="${baseId}" d="${base.join('')}"/></defs>`}${geoGround(width, height, baseId, locator ? '' : geoGraticule(projection))}${locator ? `<path class="geo-home" d="${geoPath(geometry.countries.GRC.rings, projection)}"/>` : ''}${geoAreaLayers(areaId, selected, hatch ? `${id}-hatch` : '')}<use class="geo-boundaries" href="#${baseId}"/>${overlays}</svg>`;
}
// One overview of all eight areas, in the same wide frame the locators use. It
// repeats what the buttons beneath it already name, so it is decorative; it adds
// no place, boundary or route that the eight panels do not already show.
function geographyReachMap(places, geometry, projection) {
  const [ax,ay] = projection.xy([23.73,37.98]);
  // Approximate regions keep the hatch they carry on their own close-up, so the
  // overview never makes an orientation grouping look like a surveyed border.
  const layer = (className, hatched = false) => places.map(p => `<use class="${className}" data-geo-reach="${escapeHtml(p.id)}" href="#geo-reach-${escapeHtml(p.id)}"${hatched && p.approximate ? ' style="fill:url(#geo-reach-hatch)"' : ''}/>`).join('');
  return `<svg class="geo-reach-map" viewBox="0 0 360 190" aria-hidden="true" focusable="false">${geoGround(360,190,'geo-world-outlines')}<path class="geo-home" d="${geoPath(geometry.countries.GRC.rings, projection)}"/>${layer('geo-reach-halo')}${layer('geo-reach-area', true)}<use class="geo-boundaries" href="#geo-world-outlines"/><circle class="geo-city" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="3"/></svg>`;
}
export function geographyMarkup(data, geometry) {
  const places = data.geography.places;
  const worldProjection = geoProjection([7,10,78,47],360,190);
  const worldPath = Object.values(geometry.countries).map(country => geoPath(country.rings,worldProjection)).join('');
  const reachPaths = places.map(p => `<path id="geo-reach-${escapeHtml(p.id)}" pathLength="1" d="${geoPath(geometry.shapes[p.shape],worldProjection)}"/>`).join('');
  const buttons = places.map((p,i) => `<button type="button" data-geography="${escapeHtml(p.id)}" aria-pressed="${i===0}" aria-controls="geography-${escapeHtml(p.id)}"><span>${escapeHtml(p.name)}</span><small>${escapeHtml(p.kind)}</small></button>`).join('');
  const panels = places.map((p,i) => `<article class="geo-place" id="geography-${escapeHtml(p.id)}" aria-labelledby="geography-${escapeHtml(p.id)}-title">
    <header class="geo-place-heading"><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${escapeHtml(p.kind)}</span><h3 id="geography-${escapeHtml(p.id)}-title" tabindex="-1">${escapeHtml(p.name)}</h3></header>
    <div class="geo-place-grid"><div class="geo-maps"><figure class="geo-focus">${geographyMap(p,geometry)}<figcaption><span class="geo-legend-swatch${p.approximate ? ' is-hatched' : ''}" aria-hidden="true"></span>${escapeHtml(p.legend)}</figcaption></figure>
    <div class="geo-map-context"><figure class="geo-locator">${geographyMap(p,geometry,true)}<figcaption>${p.id === 'athens' ? 'Green: Greece · box: Attica close-up' : 'Green: Greece · dot: Athens · box: close-up'}</figcaption></figure><p>${escapeHtml(p.mapNote)}<span class="geo-scale-note">Each view has its own approximate scale. North is always up.</span></p></div></div>
    <div class="geo-copy"><h4>${escapeHtml(p.heading)}</h4><p class="geo-where">${escapeHtml(p.where)}</p><p class="geo-relation">${escapeHtml(p.relation)}</p><div class="geo-evidence"><span class="eyebrow">${escapeHtml(p.role)}</span><p>${escapeHtml(p.evidence)} ${sourceRefs(p.refs,data)}</p></div>${p.orientationSource ? `<a class="quiet-link geo-region-source" href="${escapeHtml(p.orientationSource)}" target="_blank" rel="noopener noreferrer">About this region ↗</a>` : ''}<button class="geo-next" type="button" data-geography-next="${escapeHtml(places[(i+1)%places.length].id)}" hidden>${i===places.length-1 ? 'Return to Athens' : `Next: ${escapeHtml(places[i+1].name)}`} <span aria-hidden="true">→</span></button></div></div>
  </article>`).join('\n');
  return `<div class="geography-explorer" id="geography-explorer"><svg class="geo-definitions" width="0" height="0" aria-hidden="true" focusable="false"><defs><pattern id="geo-reach-hatch" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#d6c99e"/><path d="M-1,1L1,-1M0,5L5,0M4,6L6,4" stroke="#84784f" stroke-width=".7"/></pattern><path id="geo-world-outlines" d="${worldPath}"/>${reachPaths}</defs></svg><div class="geo-controls" hidden><figure class="geo-reach" data-animate-on-view>${geographyReachMap(places,geometry,worldProjection)}<figcaption>The eight areas in this chapter; gold marks the one open below.</figcaption></figure><div class="geo-place-buttons" role="group" aria-label="Explore a place">${buttons}</div><label class="geo-select-wrap" for="geography-select">Explore a place<select id="geography-select">${places.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}</select></label></div><p class="sr-only" id="geography-status" role="status" aria-live="polite"></p>${panels}<p class="geo-credit">Selected places across several centuries, not a reconstructed journey or a complete mint map. Modern geographic outlines and rivers: <a href="${escapeHtml(geometry.licenseUrl)}" target="_blank" rel="noopener noreferrer">Natural Earth · public domain</a>. Ancient political borders are not shown.</p></div>`;
}
