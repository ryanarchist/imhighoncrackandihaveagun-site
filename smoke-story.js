(() => {
  // Smoke rises first, gathers into the two opening sentences, then releases
  // the rest of the statement. HTML keeps the complete writing accessible.
  function createSmokeFormation(section, reducedMotion) {
    const scene = section.querySelector('.smoke-story-scene');
    const canvas = section.querySelector('[data-smoke-canvas]');
    const context = canvas?.getContext('2d');
    if (!context) return;
    const letters = [];
    const timing = { rise: 6.5, gather: 6, settle: 2, hold: 2.2 };
    section.querySelectorAll('[data-smoke-intro] p').forEach((paragraph, sentence) => {
      const fragment = document.createDocumentFragment();
      paragraph.textContent.split(/(\s+)/).forEach(token => {
        if (!token.trim()) { fragment.append(document.createTextNode(token)); return; }
        const word = document.createElement('span');
        word.className = 'smoke-word';
        Array.from(token).forEach(character => {
          const letter = document.createElement('span');
          letter.className = 'smoke-letter';
          letter.textContent = character;
          word.append(letter);
          letters.push({element:letter, birth:timing.rise + letters.length*.045 + sentence*.8, points:null});
        });
        fragment.append(word);
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
    const formedAt = (letters.at(-1)?.birth || timing.rise) + timing.gather + timing.settle + timing.hold;
    let formationSent = false, cloudFrame = -1;
    let onscreen = false;
    const mobile = matchMedia('(max-width:700px)');
    const trails = Array.from({length: mobile.matches ? 75 : 120}, (_, i) => ({
      birth: i * .105, seed: i * 2.399963, life: 10.5 + (i % 7) * .65
    }));
    function resize() {
      const bounds = scene.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio,0,0,ratio,0,0);
      // Font sizes and wrapping can change when the viewport changes.
      letters.forEach(letter => { letter.points = null; });
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
      for (let y = 0; y < stencil.height; y += 2) {
        for (let x = 0; x < stencil.width; x += 2) {
          if (data[(y * stencil.width + x) * 4 + 3] > 90) points.push({x:x-2,y:y-2,seed:Math.random()*Math.PI*2,cloudX:(Math.random()+Math.random()-1),cloudY:Math.random()});
        }
      }
      const budget = mobile.matches ? 20 : 36;
      const stride = Math.max(1, Math.ceil(points.length / budget));
      return points.filter((_,i) => i % stride === 0);
    }
    function gather(source, target, t, seed) {
      const gather = t*t*(3-2*t);
      const curl = Math.sin(t*Math.PI*3 + seed) * Math.sin(t*Math.PI);
      return {
        x:source.x+(target.x-source.x)*gather + curl*22*(1-t),
        y:source.y+(target.y-source.y)*t + Math.cos(t*7+seed)*12*Math.sin(t*Math.PI)
      };
    }
    function plume(source, t, seed) {
      const spread = t*t*(3-2*t);
      return {
        x:source.x-width*(.19+.095*Math.sin(seed))*spread + Math.sin(t*10+seed*.15+clock*.17)*(5+30*t)*Math.sin(t*Math.PI),
        y:source.y-(source.y-height*.025)*t + Math.sin(t*11+seed)*9*t
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
      const tip = section.querySelector('.smoke-tip').getBoundingClientRect();
      const source = {x:tip.left+tip.width/2-bounds.left,y:tip.top+tip.height/2-bounds.top};
      context.clearRect(0,0,width,height);
      // New wisps are born at the tip, rather than filling the plume on frame one.
      context.globalCompositeOperation = 'screen';
      trails.forEach(trail => {
        if (clock < trail.birth) return;
        const t = ((clock-trail.birth) % trail.life) / trail.life;
        const p = plume(source,t,trail.seed);
        const radius = 7 + Math.sin(t*Math.PI*.8)*58;
        context.globalAlpha = Math.pow(Math.sin(t*Math.PI),.8)*.26;
        context.drawImage(vapor,p.x-radius,p.y-radius,radius*2,radius*2);
      });
      // Feathered filaments follow only the part of the plume that has risen.
      for (let ribbon=0;ribbon<7;ribbon++) {
        context.beginPath();
        const front = Math.min(Math.max(clock-ribbon*.18,0)/11,1);
        for (let step=0;step<=48;step++) {
          const t=step/48*front, p=plume(source,t,ribbon*.9);
          step ? context.lineTo(p.x,p.y) : context.moveTo(p.x,p.y);
        }
        context.globalAlpha=.023*Math.min(clock/5,1);
        context.strokeStyle='#ddceb6'; context.lineWidth=1.4;
        context.stroke();
      }
      if (Math.floor(clock*10) !== cloudFrame) {
        cloudFrame = Math.floor(clock*10);
        section.style.setProperty('--smoke-front', `${Math.max(0,100-clock/12*100)}%`);
        section.style.setProperty('--smoke-density', String(Math.min(Math.max(clock-2,0)/12,1)*.30));
      }
      letters.forEach(letter => {
        const age = clock-letter.birth;
        if (age >= timing.gather*.55 && !letter.element.classList.contains('is-condensing')) {
          letter.element.classList.add('is-condensing');
        }
        if (age >= timing.gather && !letter.element.classList.contains('is-ink')) {
          letter.element.classList.add('is-ink');
        }
        if (age<0 || age>timing.gather+timing.settle) return;
        const rect = letter.element.getBoundingClientRect();
        if (!letter.points) letter.points=sample(letter,rect);
        const t = Math.min(age/timing.gather,1);
        const dissolve = Math.max(0,1-(age-timing.gather)/timing.settle);
        const destination = {x:rect.left-bounds.left,y:rect.top-bounds.top};
        letter.points.forEach(point => {
          const target={x:destination.x+point.x,y:destination.y+point.y};
          // Condense from the risen cloud, with small eddies that settle into ink.
          const origin={x:width*.61+point.cloudX*width*.26,y:destination.y+70+point.cloudY*130};
          const p=gather(origin,target,t,point.seed);
          const turbulence=(1-t)*Math.sin(age*1.5+point.seed)*10;
          const radius=2.6+(1-t)*14;
          context.globalAlpha=Math.min(age*.4,1)*dissolve*(.06+t*.26);
          context.drawImage(vapor,p.x-radius+turbulence,p.y-radius,radius*2,radius*2);
        });
      });
      context.globalAlpha=1; context.globalCompositeOperation='source-over';
      if (!formationSent && clock >= formedAt) {
        formationSent = true;
        section.dispatchEvent(new Event('smoke:formed'));
      }
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
      formationSent=false; cloudFrame=-1;
      letters.forEach(letter=>letter.element.classList.remove('is-ink','is-condensing'));
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
    const controls = section.querySelector('.smoke-reading-controls');
    let begun = false;
    let readingReady = false;
    let paused = true;
    let visible = false;
    let loaded = false;
    let frame = 0;
    let previousTime = 0;
    let position = 0;
    let readyAt = performance.now() + 5000;
    viewport.setAttribute('inert', '');
    viewport.setAttribute('aria-hidden', 'true');
    begin.setAttribute('aria-description', 'Play the lighter and smoke animation, then start scrolling the statement.');

    function updateControls() {
      pause.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
      pause.setAttribute('aria-pressed', String(paused));
      pause.hidden = !readingReady;
      controls.setAttribute('aria-hidden', String(!readingReady));
      section.classList.toggle('is-paused', paused);
    }
    function revealStory() {
      if (readingReady) return;
      readingReady = true;
      section.classList.add('is-reading-ready');
      viewport.removeAttribute('inert');
      viewport.setAttribute('aria-hidden', 'false');
      // The opening has settled. Let the remaining prose fade in before moving.
      readyAt = performance.now() + (section.classList.contains('smoke-motion-enabled') ? 2000 : 0);
      updateControls();
      start();
    }
    begin.addEventListener('click', async () => {
      if (!loaded || begun) return;
      begun = true;
      begin.disabled = true;
      section.querySelector('.smoke-entry').hidden = true;
      const lighter = section.querySelector('.smoke-lighter');
      // Nothing plays on page load. Ring the bell explicitly requests this
      // sequence even when the browser defaults to reducing automatic motion.
      const duration = 2400;
      // The lighter rests facing the tip; percentage translation scales with it.
      const move = 'translate(35.3%, -8%)';
      section.classList.add('is-igniting', 'smoke-motion-requested');
      try {
        await lighter.animate([
          {transform:'translate(0,0)'},
          {transform:move}
        ],{duration,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}).finished;
        await lighter.animate([
          {transform:move},
          {transform:`${move} rotate(-1.8deg)`,offset:.4},
          {transform:`${move} rotate(.8deg)`,offset:.7},
          {transform:move}
        ],{duration:220,fill:'forwards'}).finished;
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
      section.classList.add('is-tip-hot');
      section.classList.add('is-started');
      section.classList.toggle('smoke-motion-enabled', section.classList.contains('has-smoke-formation'));
      section.querySelector('.smoke-entry').hidden = true;
      manuscript.removeAttribute('inert');
      manuscript.setAttribute('aria-hidden', 'false');
      viewport.scrollTop = 0;
      position = 0;
      readyAt = Infinity;
      section.dispatchEvent(new Event('smoke:begin'));
      if (!section.classList.contains('has-smoke-formation')) revealStory();
      updateControls();
      updateVisibility();
      manuscript.tabIndex = -1;
      manuscript.focus({ preventScroll: true });
      const extinguish = section.querySelector('.smoke-flame').animate([
        {opacity:1},{opacity:.8,offset:.5},{opacity:0}
      ],{duration:1100,fill:'forwards'});
      await extinguish.finished.catch(()=>{});
      section.classList.remove('is-flame-lit');
      await lighter.animate([{transform:move},{transform:'translate(0,0)'}],
        {duration:2000,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.catch(()=>{});
      section.classList.remove('is-igniting');
      section.classList.remove('is-tip-hot');
    });
    section.addEventListener('smoke:formed', revealStory);
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
      if (loaded && readingReady && !frame && visible && !document.hidden && !paused) {
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
      readyAt = Math.max(readyAt, performance.now());
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
      if (reducedMotion.matches) {
        manualPause();
        section.classList.remove('smoke-motion-enabled');
        if (begun && section.classList.contains('is-started')) revealStory();
        readyAt = performance.now();
      }
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
