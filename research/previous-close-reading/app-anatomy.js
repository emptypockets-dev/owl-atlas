const anatomyPanels = document.querySelectorAll('[data-anatomy-side]');
const anatomyFaces = document.querySelectorAll('input[name="anatomy-side"]');
anatomyPanels.forEach((panel) => {
  const buttons = panel.querySelectorAll('[data-detail]');
  const marker = panel.querySelector('.anatomy-marker');
  // Anchor percentages to the photograph itself, never its label or credit.
  panel.querySelector('.image-surface').append(marker);
  function selectDetail(button) {
    const index = data.anatomy.findIndex(detail => detail.id === button.dataset.detail);
    const detail = data.anatomy[index];
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    panel.querySelectorAll('.anatomy-reading').forEach(reading => {
      reading.hidden = reading.id !== button.getAttribute('aria-controls');
    });
    marker.style.setProperty('--x', `${detail.x}%`);
    marker.style.setProperty('--y', `${detail.y}%`);
    marker.textContent = String(index + 1);
  }
  selectDetail(buttons[0]);
  panel.querySelector('.anatomy-text').setAttribute('aria-live', 'polite');
  panel.querySelector('.anatomy-text').setAttribute('aria-atomic', 'true');
  panel.querySelector('.detail-buttons').hidden = false;
  marker.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => selectDetail(button)));
});
function selectAnatomyFace() {
  const side = document.querySelector('input[name="anatomy-side"]:checked').value;
  anatomyPanels.forEach(panel => {
    panel.hidden = panel.dataset.anatomySide !== side;
  });
}
anatomyFaces.forEach(input => input.addEventListener('change', selectAnatomyFace));
if (anatomyPanels.length) {
  selectAnatomyFace();
  document.querySelector('.anatomy-faces').hidden = false;
}
