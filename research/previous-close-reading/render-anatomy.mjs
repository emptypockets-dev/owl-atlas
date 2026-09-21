export function anatomyMarkup(data) {
  return ['reverse', 'obverse'].map((side) => {
    const details = data.anatomy.map((detail, index) => ({...detail, number: index + 1})).filter(detail => detail.side === side);
    const label = side === 'reverse' ? 'Owl / reverse' : 'Athena / obverse';
    const buttons = details.map(detail => `<button type="button" data-detail="${escapeHtml(detail.id)}" aria-pressed="false" aria-controls="anatomy-detail-${escapeHtml(detail.id)}"><span>${String(detail.number).padStart(2, '0')}</span>${escapeHtml(detail.name)}</button>`).join('');
    const readings = details.map(detail => `<div class="anatomy-reading" id="anatomy-detail-${escapeHtml(detail.id)}"><span class="eyebrow">${String(detail.number).padStart(2, '0')} / ${side}</span><h4>${escapeHtml(detail.title)}</h4><p>${escapeHtml(detail.text)} ${sourceRefs(detail.refs, data)}</p></div>`).join('');
    return `<div class="anatomy-layout" id="anatomy-${side}" data-anatomy-side="${side}" role="group" aria-labelledby="anatomy-${side}-label">
      <div class="anatomy-photo-wrap"><p class="face-label" id="anatomy-${side}-label">${label} · ${details.length} details</p>${photoMarkup(details[0].image, data, 'anatomy-image')}<span aria-hidden="true" class="anatomy-marker" hidden></span></div>
      <div class="anatomy-controls"><div aria-label="Choose a detail on the ${side}" class="detail-buttons" hidden>${buttons}</div><div class="anatomy-text">${readings}</div><p class="micro-copy">Markers identify approximate areas, not measured die features.</p></div>
    </div>`;
  }).join('');
}
