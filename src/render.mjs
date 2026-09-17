/** Shared, dependency-free rendering used by the build and the browser. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function sourceRefs(ids, data) {
  const links = ids.map((id) => {
    const index = data.sources.findIndex((source) => source.id === id);
    if (index < 0) throw new Error(`Unknown source: ${id}`);
    const source = data.sources[index];
    const number = String(index + 1).padStart(2, '0');
    return `<a href="#source-${escapeHtml(id)}" data-source="${escapeHtml(id)}" aria-label="Source ${number}: ${escapeHtml(source.title)}">[${number}]</a>`;
  });
  return `<sup class="citation">${links.join(' ')}</sup>`;
}

export function photoMarkup(id, data, className = '', cropOverride, eager = false) {
  const image = data.images[id];
  if (!image) throw new Error(`Unknown image: ${id}`);
  const crop = cropOverride ?? image.crop ?? 'none';
  const cropLabels = {top: 'Athena, top half of a paired plate', bottom: 'Owl, bottom half of a paired plate', left: 'Athena, left half of a paired plate', right: 'Owl, right half of a paired plate'};
  const alt = crop === 'none' ? image.alt : `${cropLabels[crop]}. Open to see the complete source photograph. ${image.title}.`;
  const original = image.url;
  const displayed = image.localUrl || image.displayUrl || image.url;
  const credit = image.credit;
  return `<figure class="image-figure ${escapeHtml(className)}" data-photo="${escapeHtml(id)}" style="--plate-ratio:${image.width / image.height}">
    <div class="image-surface">
      <a class="image-trigger" href="${escapeHtml(original)}" target="_blank" rel="noopener noreferrer" data-image="${escapeHtml(id)}" aria-label="Inspect ${escapeHtml(image.title)} in the image viewer">
        <span class="image-frame"><img src="${escapeHtml(displayed)}" width="${image.width}" height="${image.height}" class="crop-${escapeHtml(crop)}" alt="${escapeHtml(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}></span>
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
function geographyMap(place, geometry, locator = false) {
  const width = locator ? 360 : 720, height = locator ? 190 : 450;
  const projection = geoProjection(locator ? (place.id === 'athens' ? [18,33.5,30,43] : [7,10,78,47]) : place.bounds, width, height);
  const id = `geo-${place.id}-${locator ? 'locator' : 'map'}`;
  const countries = Object.entries(geometry.countries).filter(([code]) => locator || place.id !== 'athens' || code !== 'GRC').map(([, country]) => country);
  if (!locator && place.id === 'athens') countries.push(...Object.values(geometry.greekRegions));
  const base = countries.map(country => geoPath(country.rings, projection)).filter(Boolean);
  const sharedWorld = locator && place.id !== 'athens';
  const baseId = sharedWorld ? 'geo-world-outlines' : `${id}-base`;
  const selected = geoPath(geometry.shapes[place.shape], projection);
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
  return `<svg class="${locator ? 'geo-locator-map' : 'geo-focus-map'}" viewBox="0 0 ${width} ${height}" ${accessible}>${locator ? '' : `<title id="${id}-title">${escapeHtml(place.name)}: ${escapeHtml(place.legend)}</title><desc id="${id}-desc">${escapeHtml(place.where)} ${escapeHtml(place.mapNote)} North is up. The scale bar is approximate at the map centre.</desc>`}${hatch ? `<defs><pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#d6c99e"/><path d="M-2,2L2,-2M0,8L8,0M6,10L10,6" stroke="#84784f" stroke-width="1"/></pattern></defs>` : ''}${sharedWorld ? '' : `<defs><path id="${baseId}" d="${base.join('')}"/></defs>`}<use class="geo-base" href="#${baseId}"/>${locator ? `<path class="geo-home" d="${geoPath(geometry.countries.GRC.rings, projection)}"/>` : ''}<path class="geo-area" d="${selected}"${hatch ? ` style="fill:url(#${id}-hatch)"` : ''}/><use class="geo-boundaries" href="#${baseId}"/>${overlays}</svg>`;
}
export function geographyMarkup(data, geometry) {
  const places = data.geography.places;
  const worldProjection = geoProjection([7,10,78,47],360,190);
  const worldPath = Object.values(geometry.countries).map(country => geoPath(country.rings,worldProjection)).join('');
  const buttons = places.map((p,i) => `<button type="button" data-geography="${escapeHtml(p.id)}" aria-pressed="${i===0}" aria-controls="geography-${escapeHtml(p.id)}"><span>${escapeHtml(p.name)}</span><small>${escapeHtml(p.kind)}</small></button>`).join('');
  const panels = places.map((p,i) => `<article class="geo-place" id="geography-${escapeHtml(p.id)}" aria-labelledby="geography-${escapeHtml(p.id)}-title">
    <header class="geo-place-heading"><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${escapeHtml(p.kind)}</span><h3 id="geography-${escapeHtml(p.id)}-title" tabindex="-1">${escapeHtml(p.name)}</h3></header>
    <div class="geo-place-grid"><div class="geo-maps"><figure class="geo-focus">${geographyMap(p,geometry)}<figcaption><span class="geo-legend-swatch${p.approximate ? ' is-hatched' : ''}" aria-hidden="true"></span>${escapeHtml(p.legend)}</figcaption></figure>
    <div class="geo-map-context"><figure class="geo-locator">${geographyMap(p,geometry,true)}<figcaption>${p.id === 'athens' ? 'Green: Greece · box: Attica close-up' : 'Green: Greece · dot: Athens · box: close-up'}</figcaption></figure><p>${escapeHtml(p.mapNote)}<span class="geo-scale-note">Each view has its own approximate scale. North is always up.</span></p></div></div>
    <div class="geo-copy"><h4>${escapeHtml(p.heading)}</h4><p class="geo-where">${escapeHtml(p.where)}</p><p class="geo-relation">${escapeHtml(p.relation)}</p><div class="geo-evidence"><span class="eyebrow">${escapeHtml(p.role)}</span><p>${escapeHtml(p.evidence)} ${sourceRefs(p.refs,data)}</p></div>${p.orientationSource ? `<a class="quiet-link geo-region-source" href="${escapeHtml(p.orientationSource)}" target="_blank" rel="noopener noreferrer">About this region ↗</a>` : ''}<button class="geo-next" type="button" data-geography-next="${escapeHtml(places[(i+1)%places.length].id)}" hidden>${i===places.length-1 ? 'Return to Athens' : `Next: ${escapeHtml(places[i+1].name)}`} <span aria-hidden="true">→</span></button></div></div>
  </article>`).join('\n');
  return `<div class="geography-explorer" id="geography-explorer"><svg class="geo-definitions" width="0" height="0" aria-hidden="true" focusable="false"><defs><path id="geo-world-outlines" d="${worldPath}"/></defs></svg><div class="geo-controls" hidden><div class="geo-place-buttons" role="group" aria-label="Explore a place">${buttons}</div><label class="geo-select-wrap" for="geography-select">Explore a place<select id="geography-select">${places.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}</select></label></div><p class="sr-only" id="geography-status" role="status" aria-live="polite"></p>${panels}<p class="geo-credit">Selected places across several centuries, not a reconstructed journey or a complete mint map. Modern geographic outlines and rivers: <a href="${escapeHtml(geometry.licenseUrl)}" target="_blank" rel="noopener noreferrer">Natural Earth · public domain</a>. Ancient political borders are not shown.</p></div>`;
}
