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
