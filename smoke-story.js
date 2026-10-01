(() => {
  // Each word supplies real glyph coordinates. Smoke travels from the pipe to
  // those coordinates before the accessible HTML word takes over rendering.
  function createSmokeFormation(section, reducedMotion) {
    const scene = section.querySelector('.smoke-story-scene');
    const canvas = section.querySelector('[data-smoke-canvas]');
    const context = canvas?.getContext('2d');
    if (!context) return;
    const window = section.querySelector('[data-smoke-window]');
    const paragraphs = Array.from(section.querySelectorAll('[data-smoke-prose] p'));
    const words = [];
    section.querySelectorAll('[data-smoke-intro] p, [data-smoke-prose] p').forEach(paragraph => {
      const fragment = document.createDocumentFragment();
      paragraph.textContent.split(/(\s+)/).forEach(token => {
        if (!token.trim()) { fragment.append(document.createTextNode(token)); return; }
        const word = document.createElement('span');
        word.className = 'smoke-word';
        word.textContent = token;
        fragment.append(word);
        words.push({ element: word, paragraph, inIntro: !!paragraph.closest('[data-smoke-intro]'), birth: null, points: null });
      });
      paragraph.replaceChildren(fragment);
    });
    const stencil = document.createElement('canvas');
    const ink = stencil.getContext('2d', { willReadFrequently: true });
    if (!ink) return;
    const vapor = document.createElement('canvas');
    vapor.width = vapor.height = 96;
    const vaporContext = vapor.getContext('2d');
    const gradient = vaporContext.createRadialGradient(48,48,0,48,48,48);
    gradient.addColorStop(0,'rgba(232,218,195,.30)');
    gradient.addColorStop(.35,'rgba(202,188,165,.13)');
    gradient.addColorStop(1,'rgba(190,180,164,0)');
    vaporContext.fillStyle = gradient;
    vaporContext.fillRect(0,0,96,96);
    let width = 0, height = 0, clock = 0, last = 0, animation = 0;
    let onscreen = false;
    const mobile = matchMedia('(max-width:700px)');
    const trails = Array.from({length: mobile.matches ? 54 : 90}, (_, i) => ({
      phase: i / 90, seed: i * 2.399963, speed: .045 + (i % 7) * .004
    }));
    function resize() {
      const bounds = scene.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio,0,0,ratio,0,0);
      // Font sizes and wrapping can change when the viewport changes.
      words.forEach(word => { word.points = null; });
    }
    function sample(word, bounds) {
      const style = getComputedStyle(word.element);
      stencil.width = Math.ceil(bounds.width + 4);
      stencil.height = Math.ceil(bounds.height + 8);
      ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ink.textBaseline = 'top';
      ink.fillStyle = '#fff';
      ink.fillText(word.element.textContent,2,2);
      const data = ink.getImageData(0,0,stencil.width,stencil.height).data;
      const points = [];
      for (let y = 0; y < stencil.height; y += 3) {
        for (let x = 0; x < stencil.width; x += 3) {
          if (data[(y * stencil.width + x) * 4 + 3] > 90) points.push({x:x-2,y:y-2,seed:Math.random()*Math.PI*2});
        }
      }
      const budget = mobile.matches ? 22 : 38;
      const stride = Math.max(1, Math.ceil(points.length / budget));
      return points.filter((_,i) => i % stride === 0);
    }
    function flow(source, target, t, seed) {
      const gather = t*t*(3-2*t);
      const curl = Math.sin(t*Math.PI*3 + seed) * Math.sin(t*Math.PI);
      return {
        x:source.x+(target.x-source.x)*gather + curl*(48+Math.sin(seed)*30)*(1-t),
        y:source.y+(target.y-source.y)*t - Math.sin(t*Math.PI)*65 + Math.cos(t*9+seed)*15*Math.sin(t*Math.PI)
      };
    }
    function render(time) {
      animation = 0;
      if (!onscreen || document.hidden) { last = 0; return; }
      const stopped = !section.classList.contains('smoke-motion-enabled') || section.classList.contains('is-expanded');
      if (stopped) { last = 0; context.clearRect(0,0,width,height); return; }
      if (last && time-last < 32) { animation=requestAnimationFrame(render); return; }
      if (last) clock += Math.min(time-last,60)/1000;
      last = time;
      const bounds = scene.getBoundingClientRect();
      const pipe = section.querySelector('.smoke-pipe').getBoundingClientRect();
      const clip = window.getBoundingClientRect();
      const source = {x:pipe.right-bounds.left-pipe.width*.047,y:pipe.top-bounds.top+pipe.height*.51};
      context.clearRect(0,0,width,height);
      // Broad, continuously rising vapor under the more precise glyph particles.
      context.globalCompositeOperation = 'screen';
      trails.forEach(trail => {
        const t = (clock*trail.speed + trail.phase) % 1;
        const target = {x:width*(.3+.38*(Math.sin(trail.seed)*.5+.5)),y:height*.10};
        const p = flow(source,target,t,trail.seed+clock*.22);
        const radius = 15 + Math.sin(t*Math.PI)*42;
        context.globalAlpha = Math.sin(t*Math.PI)*.65*Math.min(clock/3,1);
        context.drawImage(vapor,p.x-radius,p.y-radius,radius*2,radius*2);
      });
      // Fine ribbons trace the upward current, with slightly different vortices.
      for (let ribbon=0;ribbon<9;ribbon++) {
        context.beginPath();
        const target = {x:width*(.35+ribbon*.035),y:height*.12};
        for (let step=0;step<=40;step++) {
          const t=step/40, p=flow(source,target,t,ribbon*.8+clock*.38);
          step ? context.lineTo(p.x,p.y) : context.moveTo(p.x,p.y);
        }
        context.globalAlpha=.055*Math.min(clock/4,1);
        context.strokeStyle='#ddceb6'; context.lineWidth=1.1;
        context.stroke();
      }
      let active = 0;
      const visibleParagraphs = new Set(paragraphs.filter(paragraph => {
        const rect=paragraph.getBoundingClientRect();
        return rect.bottom>clip.top+8 && rect.top<clip.bottom-30;
      }));
      words.forEach(word => {
        if (word.birth !== null && clock-word.birth>6) return;
        if (!word.inIntro && !visibleParagraphs.has(word.paragraph)) return;
        const rect = word.element.getBoundingClientRect();
        const inView = word.inIntro || (rect.bottom > clip.top+8 && rect.top < clip.bottom-30);
        if (!inView) return;
        if (word.birth === null) word.birth = clock + Math.min(active++*.018,1.1);
        const age = clock-word.birth;
        if (age>4.3) word.element.classList.add('is-ink');
        if (age<0 || age>6) return;
        if (!word.points) word.points=sample(word,rect);
        const t = Math.min(age/4.3,1);
        const dissolve = Math.max(0,1-(age-4.3)/1.7);
        const destination = {x:rect.left-bounds.left,y:rect.top-bounds.top};
        word.points.forEach(point => {
          const target={x:destination.x+point.x,y:destination.y+point.y};
          const p=flow(source,target,t,point.seed);
          const turbulence=(1-t)*Math.sin(age*3+point.seed)*8;
          const radius=1.1+(1-t)*6;
          context.globalAlpha=Math.min(age*.6,1)*dissolve*(t>.8?.75:.28);
          context.drawImage(vapor,p.x-radius+turbulence,p.y-radius,radius*2,radius*2);
          if(t>.68) {
            context.globalAlpha=(t-.68)*2.2*dissolve;
            context.fillStyle='#e9dcc5';
            context.fillRect(p.x+turbulence,p.y,1.25,1.25);
          }
        });
      });
      context.globalAlpha=1; context.globalCompositeOperation='source-over';
      animation=requestAnimationFrame(render);
    }
    function wake() {
      const bounds = section.getBoundingClientRect();
      onscreen = bounds.bottom > 0 && bounds.top < innerHeight;
      if (!animation && onscreen && !document.hidden) animation=requestAnimationFrame(render);
    }
    new ResizeObserver(()=>{resize();wake();}).observe(scene);
    new IntersectionObserver(([entry])=>{onscreen=entry.isIntersecting;wake();},{threshold:.05}).observe(section);
    new MutationObserver(wake).observe(section,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',wake);
    addEventListener('scroll',wake,{passive:true});
    reducedMotion.addEventListener('change',wake);
    section.addEventListener('smoke:begin',()=>{
      clock=0; last=0;
      words.forEach(word=>{word.birth=null;word.element.classList.remove('is-ink');});
      wake();
    });
    document.fonts.ready.then(()=>{resize();wake();});
    section.classList.add('has-smoke-formation');
    resize(); wake();
  }
  async function initSmokeStory() {
    const section = document.querySelector('[data-smoke-story]');
    if (!section) return;
    const viewport = section.querySelector('[data-smoke-window]');
    const prose = section.querySelector('[data-smoke-prose]');
    const intro = section.querySelector('[data-smoke-intro]');
    const pause = section.querySelector('[data-smoke-pause]');
    const progress = section.querySelector('[data-smoke-progress]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const begin = section.querySelector('[data-smoke-begin]');
    const manuscript = section.querySelector('.smoke-manuscript');
    let begun = false;
    let paused = true;
    let visible = false;
    let loaded = false;
    let frame = 0;
    let previousTime = 0;
    let position = 0;
    let readyAt = performance.now() + 5000;

    function updateControls() {
      pause.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
      pause.setAttribute('aria-pressed', String(paused));
      pause.hidden = !begun;
      section.classList.toggle('is-paused', paused);
    }
    begin.addEventListener('click', async () => {
      if (!loaded || begun) return;
      begun = true;
      begin.disabled = true;
      section.querySelector('.smoke-entry').hidden = true;
      const lighter = section.querySelector('.smoke-lighter');
      const pipe = section.querySelector('.smoke-pipe');
      const duration = reducedMotion.matches ? 250 : 1650;
      const move = `translate(${pipe.clientWidth*.38}px, ${-pipe.clientHeight*.065}px) rotate(-170deg)`;
      section.classList.add('is-igniting');
      try {
        await lighter.animate([
          {transform:'translate(0,0) rotate(0deg)',offset:0},
          {transform:`translate(${pipe.clientWidth*.10}px, ${-pipe.clientHeight*.23}px) rotate(-35deg)`,offset:.38},
          {transform:move,offset:1}
        ],{duration,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished;
        section.classList.add('is-flame-lit');
        // A short ignition flicker precedes the first vapor at the tip.
        await section.querySelector('.smoke-flame').animate([
          {opacity:0,transform:'scale(.25)'},
          {opacity:1,transform:'scale(1.2)',offset:.35},
          {opacity:1,transform:'scale(.9)'}
        ],{duration:650,fill:'forwards'}).finished;
      } catch (error) {
        // The statement still starts if the browser cancels an animation.
      }
      paused = false;
      section.classList.add('is-started');
      section.classList.toggle('smoke-motion-enabled', !reducedMotion.matches);
      section.querySelector('.smoke-entry').hidden = true;
      manuscript.removeAttribute('inert');
      manuscript.setAttribute('aria-hidden', 'false');
      viewport.scrollTop = 0;
      position = 0;
      readyAt = performance.now() + (reducedMotion.matches ? 0 : 6500);
      section.dispatchEvent(new Event('smoke:begin'));
      updateControls();
      updateVisibility();
      pause.focus({ preventScroll: true });
      const extinguish = section.querySelector('.smoke-flame').animate([
        {opacity:1},{opacity:.8,offset:.5},{opacity:0}
      ],{duration:1100,fill:'forwards'});
      await extinguish.finished.catch(()=>{});
      section.classList.remove('is-flame-lit');
      await lighter.animate([{transform:move},{transform:'translate(0,0) rotate(0deg)'}],
        {duration:reducedMotion.matches?250:1400,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.catch(()=>{});
      section.classList.remove('is-igniting');
    });
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    function tick(time) {
      if (!visible || document.hidden || paused) { stop(); return; }
      if (previousTime && time >= readyAt) {
        position += Math.min(time - previousTime, 100) * 0.012;
        const end = viewport.scrollHeight - viewport.clientHeight;
        viewport.scrollTop = Math.min(position, end);
        if (position >= end) { paused = true; updateControls(); stop(); return; }
      }
      previousTime = time;
      frame = requestAnimationFrame(tick);
    }
    function start() {
      if (loaded && !frame && visible && !document.hidden && !paused) {
        position = viewport.scrollTop;
        frame = requestAnimationFrame(tick);
      }
    }
    function manualPause() {
      paused = true;
      stop();
      updateControls();
    }
    pause.addEventListener('click', () => {
      paused = !paused;
      if (!paused && viewport.scrollTop >= viewport.scrollHeight - viewport.clientHeight - 1) viewport.scrollTop = 0;
      readyAt = performance.now();
      updateControls();
      paused ? stop() : start();
    });
    viewport.addEventListener('wheel', manualPause, { passive: true });
    viewport.addEventListener('touchstart', manualPause, { passive: true });
    viewport.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) manualPause();
    });
    viewport.addEventListener('scroll', () => {
      const end = viewport.scrollHeight - viewport.clientHeight;
      progress.textContent = end > 0 ? `${Math.round(viewport.scrollTop / end * 100)}% / THE RECORD` : 'THE COMPLETE RECORD';
    }, { passive: true });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) { manualPause(); section.classList.remove('smoke-motion-enabled'); }
    });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    function updateVisibility() {
      const bounds = section.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < innerHeight;
      section.classList.toggle('is-visible', visible);
      visible ? start() : stop();
    }
    new IntersectionObserver(updateVisibility, { threshold: 0.1 }).observe(section);
    addEventListener('scroll', updateVisibility, { passive: true });
    updateControls();
    try {
      const response = await fetch('/data/ryan-smoke-statement.txt?v=20261001', { cache: 'no-cache' });
      if (!response.ok) throw new Error('statement_unavailable');
      const text = await response.text();
      const fragment = document.createDocumentFragment();
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      lines.slice(0, 2).forEach(line => {
        const opening = document.createElement('p');
        opening.textContent = line;
        intro.append(opening);
      });
      lines.slice(2).forEach((line) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        paragraph.className = 'smoke-paragraph';
        fragment.append(paragraph);
      });
      prose.replaceChildren(fragment);
      createSmokeFormation(section, reducedMotion);
      loaded = true;
      begin.disabled = false;
      begin.removeAttribute('aria-busy');
      const formation = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-formed');
            formation.unobserve(entry.target);
          }
        });
      }, { root: viewport, threshold: 0.01 });
      prose.querySelectorAll('p').forEach(paragraph => formation.observe(paragraph));
      readyAt = Infinity;
      updateVisibility();
    } catch (error) {
      prose.textContent = 'The statement could not load. Open the full text below.';
      const link = document.createElement('a');
      link.href = '/data/ryan-smoke-statement.txt';
      link.textContent = 'Read Ryan’s full statement';
      prose.append(link);
      loaded = true;
      begin.disabled = false;
      begin.removeAttribute('aria-busy');
      manualPause();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSmokeStory);
  else initSmokeStory();
})();
