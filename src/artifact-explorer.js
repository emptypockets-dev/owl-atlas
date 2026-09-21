/** Discrete, declarative artifact views. No framework, scroll capture or per-step animation. */
export function artifactView(stage, image, state) {
  const diameter = Math.min(stage.width, stage.height) * .88;
  const fit = Math.min(1, diameter / Math.max(image.width, image.height));
  const width = image.width * fit, height = image.height * fit;
  // Never enlarge a source pixel beyond a CSS pixel. A high-DPI display may
  // interpolate, but the camera never claims more detail than the source holds.
  const zoom = Math.max(1, Math.min(state.zoom || 1, 1 / fit));
  const rotation = state.rotation || 0, angle = rotation * Math.PI / 180;
  const x = (state.focus.x - .5) * width, y = (state.focus.y - .5) * height;
  return {width, height, diameter, zoom, rotation,
    x: -zoom * (x * Math.cos(angle) - y * Math.sin(angle)),
    y: -zoom * (x * Math.sin(angle) + y * Math.cos(angle))};
}

export class ArtifactExplorer {
  constructor(root, story, images, reducedMotion) {
    this.root = root; this.story = story; this.images = images;
    this.reducedMotion = reducedMotion;
    this.stage = root.querySelector('.artifact-stage');
    this.sticky = root.querySelector('.artifact-sticky');
    this.camera = root.querySelector('.artifact-camera');
    this.turn = root.querySelector('.artifact-turn');
    this.steps = [...root.querySelectorAll('.artifact-step')];
    this.links = [...root.querySelectorAll('.artifact-nav a')];
    this.inspect = root.querySelector('.artifact-inspect');
    this.active = -1; this.token = 0; this.scheduled = false;
    this.side = story.steps[0].state.side;
    this.root.classList.add('is-enhanced');
    this.root.querySelector('.artifact-static').setAttribute('aria-hidden', 'true');
    this.root.querySelector('.artifact-live').hidden = false;
    this.root.querySelector('.artifact-nav').hidden = false;
    this.measure();
    this.select(0, true);
    this.links.forEach(link => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // Preserve native hash/history scrolling. Only explicit navigation moves focus.
      const heading = root.querySelector(link.getAttribute('href'))?.querySelector('h4');
      requestAnimationFrame(() => heading?.focus({preventScroll:true}));
    }));
    for (const img of this.stage.querySelectorAll('img')) {
      const status = () => {
        img.closest('[data-artifact-face]').classList.toggle('has-error', img.complete && !img.naturalWidth);
        this.syncImageStatus();
      };
      img.addEventListener('load', status); img.addEventListener('error', status);
      if (img.complete) status();
    }
    this.request = () => { if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => { this.scheduled = false; this.update(); });
    }};
    window.addEventListener('scroll', this.request, {passive:true});
    window.addEventListener('resize', () => { this.measure(); this.request(); }, {passive:true});
    window.addEventListener('pageshow', this.request);
    window.addEventListener('hashchange', this.request);
    if ('ResizeObserver' in window) {
      this.resize = new ResizeObserver(() => { this.measure(); this.request(); });
      this.resize.observe(this.stage);
      this.resize.observe(document.querySelector('.site-header'));
      const bar = document.querySelector('.chapter-bar');
      if (bar) this.resize.observe(bar);
    }
    // One observer for both documentElement flags: the motion setting, and the
    // retracting header, which changes how much height the exhibit may claim.
    this.motionObserver = new MutationObserver(() => {
      this.measure();
      if (this.reducedMotion()) this.select(Math.max(0,this.active), true);
    });
    this.motionObserver.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
    this.setupAuthoring();
    this.request();
  }

  /** The stage shows a resized display copy, so the camera measures that file's
   *  real pixels rather than the record's full-resolution dimensions. The
   *  build writes them onto the element; the record is the fallback. */
  faceImage(side) {
    const element = this.root.querySelector(`[data-artifact-face="${side}"] img`);
    const width = Number(element?.getAttribute('width')), height = Number(element?.getAttribute('height'));
    return width > 0 && height > 0 ? {width, height} : this.images[this.story.faces[side].image];
  }

  measure() {
    const size = this.stage.getBoundingClientRect();
    this.size = {width:size.width, height:size.height};
    // Measure the chrome the reader can actually see: the header retracts while
    // reading, and the exhibit should claim the space it leaves behind.
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-visible')) || 0;
    const bar = (document.querySelector('.chapter-bar') || document.querySelector('.chrome-utility'))
      ?.getBoundingClientRect().height || 0;
    const compact = matchMedia('(max-width: 900px)').matches;
    // When text is enlarged or the viewport is shallow, let the exhibit flow.
    // Keeping enough reading space is more important than keeping it pinned.
    const usable = innerHeight - header - bar;
    this.root.classList.toggle('is-unpinned', usable < 480 ||
      (compact && usable - this.sticky.offsetHeight < 190));
    this.root.style.setProperty('--artifact-clearance', compact && !this.root.classList.contains('is-unpinned')
      // Native page scroll-padding already includes a 20px reading gutter.
      ? `${Math.max(0,this.sticky.offsetHeight - 20)}px` : '0px');
    const diameter = Math.min(size.width,size.height) * .88;
    this.turn.style.width = `${diameter}px`; this.turn.style.height = `${diameter}px`;
    for (const side of Object.keys(this.story.faces)) {
      const view = artifactView(this.size,this.faceImage(side),{focus:{x:.5,y:.5},zoom:1});
      const element = this.root.querySelector(`[data-artifact-face="${side}"]`);
      element.style.width = `${view.width}px`; element.style.height = `${view.height}px`;
    }
    if (this.active >= 0) this.select(this.active, true);
  }

  update() {
    const boundary = this.root.getBoundingClientRect();
    if (boundary.bottom < 0 || boundary.top > innerHeight) return;
    const navigation = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-visible')) +
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar'));
    const compact = matchMedia('(max-width:900px)').matches;
    const top = compact && !this.root.classList.contains('is-unpinned')
      ? Math.max(navigation, this.sticky.getBoundingClientRect().bottom) : navigation;
    const line = Math.min(innerHeight - 24, top + (innerHeight - top) * (compact ? .24 : .35));
    // Read all positions together, then write only on a discrete state change.
    const positions = this.steps.map(step => step.getBoundingClientRect().top);
    let selected = 0;
    positions.forEach((position,index) => { if (position <= line) selected = index; });
    if (selected !== this.active) this.select(selected);
  }

  pose(state, immediate = false) {
    const view = artifactView(this.size,this.faceImage(state.side),state);
    this.view = view;
    this.camera.style.transitionDuration = immediate ? '0ms' : '';
    this.camera.style.transform = `translate3d(${view.x}px,${view.y}px,0) scale(${view.zoom}) rotate(${view.rotation}deg)`;
  }

  syncImageStatus() {
    const side = this.story.steps[Math.max(0,this.active)].state.side;
    this.stage.classList.toggle('has-error',this.root.querySelector(`[data-artifact-face="${side}"]`).classList.contains('has-error'));
  }

  select(index, immediate = false) {
    const step = this.story.steps[index], state = step.state;
    const previousSide = this.side;
    const token = ++this.token;
    clearTimeout(this.flipTimer); clearTimeout(this.focusTimer); clearTimeout(this.edgeTimer);
    this.turn.classList.remove('is-turning');
    this.active = index;
    this.root.dataset.activeStep = step.id;
    this.root.dataset.side = state.side;
    this.links.forEach((link,i) => i === index ? link.setAttribute('aria-current','step') : link.removeAttribute('aria-current'));
    this.steps.forEach((element,i) => element.classList.toggle('is-active',i === index));
    const face = this.story.faces[state.side], image = this.images[face.image];
    this.root.querySelector('.artifact-state-label').textContent = `${String(index+1).padStart(2,'0')} / ${step.label}`;
    this.root.querySelector('.artifact-face-label').textContent = face.label;
    this.inspect.dataset.image = face.image;
    this.inspect.href = image.localUrl || image.url;
    this.inspect.setAttribute('aria-label',`Open full photograph: ${image.title}`);
    const credit = this.root.querySelector('.artifact-current-credit');
    credit.href = image.source; credit.textContent = image.credit.split(' · ')[0];
    credit.title = image.credit;
    const license = this.root.querySelector('.artifact-current-license');
    license.href = image.licenseUrl; license.textContent = image.license;
    this.stage.querySelectorAll('[data-artifact-face]').forEach(element =>
      element.setAttribute('aria-hidden', String(element.dataset.artifactFace !== state.side)));
    this.syncImageStatus();
    const noMotion = immediate || this.reducedMotion() || this.authoring;
    this.turn.style.transitionDuration = noMotion ? '0ms' : '';
    const finish = () => {
      if (token !== this.token) return;
      this.side = state.side;
      this.turn.style.transform = `rotateY(${state.side === 'reverse' ? 180 : 0}deg)`;
      this.pose(state, noMotion);
    };
    if (!noMotion && previousSide !== state.side) {
      // Put the whole artifact back under the camera before turning it.
      // This short, cancellable sequence also works when scrolling backwards.
      this.pose({side:previousSide,focus:{x:.5,y:.5},zoom:1,rotation:0});
      this.flipTimer = setTimeout(() => {
        if (token !== this.token) return;
        this.side = state.side;
        this.turn.classList.add('is-turning');
        this.turn.style.transform = `rotateY(${state.side === 'reverse' ? 180 : 0}deg)`;
        this.edgeTimer = setTimeout(() => this.turn.classList.remove('is-turning'), 1150);
        this.focusTimer = setTimeout(() => { if (token === this.token) this.pose(state); }, 640);
      }, 340);
    } else finish();
  }

  setupAuthoring() {
    if (!['localhost','127.0.0.1','[::1]'].includes(location.hostname) ||
        !new URLSearchParams(location.search).has('artifact-debug')) return;
    this.authoring = true;
    const output = document.createElement('output');
    output.className = 'artifact-authoring';
    output.textContent = 'Authoring: click a feature to read its normalized coordinates.';
    this.sticky.append(output);
    this.stage.classList.add('is-authoring');
    this.stage.addEventListener('click', event => {
      const rect = this.stage.getBoundingClientRect();
      const inverse = new DOMMatrix(getComputedStyle(this.camera).transform).inverse();
      const point = new DOMPoint(event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2).matrixTransform(inverse);
      const base = artifactView(this.size,this.faceImage(this.side),{focus:{x:.5,y:.5},zoom:1});
      output.textContent = JSON.stringify({side:this.side,focus:{x:+(point.x/base.width+.5).toFixed(3),y:+(point.y/base.height+.5).toFixed(3)}});
    });
  }
}
