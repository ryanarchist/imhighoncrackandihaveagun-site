// Documentary adapter for the existing room catalog and pinned HLS.js engine.
// No uploads, alternate media URLs, permission changes, or autoplay.
(() => {
  const mount = document.querySelector('[data-documentary-player]');
  if (!mount) return;
  const player = mount.querySelector('video');
  const play = mount.querySelector('[data-film-play]');
  const retry = mount.querySelector('[data-film-retry]');
  const quality = mount.querySelector('[data-film-quality]');
  const select = quality.querySelector('select');
  const status = mount.querySelector('[data-film-status]');
  let hls = null, generation = 0, hlsPromise;
  const message = (text, failed = false) => { status.textContent = text; retry.hidden = !failed; };
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsPromise) hlsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js';
      script.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('Player unavailable'));
      script.onerror = () => { script.remove(); hlsPromise = null; reject(new Error('Player unavailable')); };
      document.head.append(script);
    });
    return hlsPromise;
  }
  async function load() {
    const current = ++generation;
    hls?.destroy(); hls = null;
    player.pause(); player.removeAttribute('src'); player.replaceChildren(); player.load();
    play.disabled = true; quality.hidden = true;
    select.replaceChildren(new Option('Auto (recommended)', '-1'));
    message('Loading Mini Doc 1…');
    try {
      const response = await fetch('/room/videos.json');
      if (!response.ok) throw new Error('Catalog unavailable');
      const catalog = await response.json();
      if (current !== generation) return;
      const film = catalog.videos.find(video => video.id === 'bunny-c472e350-95c4-4137-be1e-0bba37cf5ead');
      if (!film?.src) throw new Error('Film unavailable');
      player.poster = film.poster || '';
      for (const caption of film.captions || []) {
        const url = new URL(caption.src, location.href);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        const track = document.createElement('track');
        track.kind = 'captions'; track.src = url.href;
        track.srclang = caption.language || 'en'; track.label = caption.label || 'Captions';
        player.append(track);
      }
      let Hls;
      try { Hls = await loadHls(); }
      catch (error) { if (!player.canPlayType('application/vnd.apple.mpegurl')) throw error; }
      if (current !== generation) return;
      if (Hls?.isSupported()) {
        hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true, capLevelOnFPSDrop: true, maxBufferLength: 45, backBufferLength: 30 });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (current === generation && data.fatal) message('This video could not load. Check your connection or video access, then retry.', true);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (current !== generation) return;
          hls.levels.forEach((level, index) => select.append(new Option(`${level.height}p`, String(index))));
          quality.hidden = false; play.disabled = false; message('Ready to play.');
        });
        hls.loadSource(film.src); hls.attachMedia(player);
      } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        player.src = film.src; // Native HLS preserves built-in controls and captions.
        message('Loading video · quality is automatic on this browser.');
      } else throw new Error('Streaming unavailable');
    } catch {
      if (current === generation) message('This video could not load. Check your connection or video access, then retry.', true);
    }
  }
  play.addEventListener('click', () => {
    if (!player.paused) { player.pause(); return; }
    player.play().catch(() => message('Playback could not start. Please try again.', true));
  });
  player.addEventListener('loadedmetadata', () => { play.disabled = false; message('Ready to play.'); });
  player.addEventListener('playing', () => { play.textContent = 'PAUSE'; message(''); });
  player.addEventListener('pause', () => { play.textContent = 'PLAY MINI DOC 1'; });
  player.addEventListener('waiting', () => message('Buffering…'));
  player.addEventListener('error', () => message('This video could not load. Check your connection or video access, then retry.', true));
  select.addEventListener('change', () => {
    if (!hls) return;
    const level = Number(select.value);
    hls.capLevelToPlayerSize = level === -1; hls.currentLevel = level;
  });
  mount.querySelector('[data-film-fullscreen]').addEventListener('click', () => {
    if (player.requestFullscreen) player.requestFullscreen().catch(() => message('Use the video controls to open fullscreen.'));
    else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
    else message('Fullscreen is not available in this browser.');
  });
  retry.addEventListener('click', load);
  window.addEventListener('pagehide', () => { ++generation; hls?.destroy(); });
  window.addEventListener('pageshow', event => { if (event.persisted) load(); });
  load();
})();
