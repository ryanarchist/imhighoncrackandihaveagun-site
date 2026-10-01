(() => {
  async function initSmokeStory() {
    const section = document.querySelector('[data-smoke-story]');
    if (!section) return;
    const viewport = section.querySelector('[data-smoke-window]');
    const prose = section.querySelector('[data-smoke-prose]');
    const intro = section.querySelector('[data-smoke-intro]');
    const pause = section.querySelector('[data-smoke-pause]');
    const expand = section.querySelector('[data-smoke-expand]');
    const progress = section.querySelector('[data-smoke-progress]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let expanded = false;
    let visible = false;
    let loaded = false;
    let frame = 0;
    let previousTime = 0;
    let position = 0;
    let readyAt = performance.now() + 5000;

    function updateControls() {
      pause.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
      pause.setAttribute('aria-pressed', String(paused));
      pause.disabled = expanded;
      expand.textContent = expanded ? 'Back to scrolling' : 'Read all';
      expand.setAttribute('aria-expanded', String(expanded));
      section.classList.toggle('is-paused', paused || expanded);
      section.classList.toggle('is-expanded', expanded);
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    function tick(time) {
      if (!visible || document.hidden || paused || expanded) { stop(); return; }
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
      if (loaded && !frame && visible && !document.hidden && !paused && !expanded) {
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
    expand.addEventListener('click', () => {
      expanded = !expanded;
      stop();
      updateControls();
      if (!expanded) { position = viewport.scrollTop; start(); }
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
      if (reducedMotion.matches) manualPause();
    });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      section.classList.toggle('is-visible', visible);
      visible ? start() : stop();
    }, { threshold: 0.1 }).observe(section);
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
      loaded = true;
      const formation = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-formed');
            formation.unobserve(entry.target);
          }
        });
      }, { root: viewport, threshold: 0.01 });
      prose.querySelectorAll('p').forEach(paragraph => formation.observe(paragraph));
      readyAt = performance.now() + 5000;
      start();
    } catch (error) {
      prose.textContent = 'The statement could not load. Open the full text below.';
      const link = document.createElement('a');
      link.href = '/data/ryan-smoke-statement.txt';
      link.textContent = 'Read Ryan’s full statement';
      prose.append(link);
      manualPause();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSmokeStory);
  else initSmokeStory();
})();
