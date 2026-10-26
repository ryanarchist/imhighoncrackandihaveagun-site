(() => {
  'use strict';

  const dialog = document.getElementById('trailer-welcome');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const play = document.getElementById('trailer-play');
  const skip = document.getElementById('trailer-skip');
  const back = document.getElementById('trailer-back');
  const poster = document.getElementById('trailer-poster');
  const host = document.getElementById('trailer-player');
  const status = document.getElementById('trailer-status');
  const help = document.getElementById('trailer-help');
  if (![play, skip, back, poster, host, status, help].every(Boolean)) return;

  const sessionKey = 'ihocaihag.trailer.b7f61780.seen';
  const historyKey = 'ihocaihagTrailerWelcome';
  const initialStatus = status.textContent;
  let chosen = false;
  let opener, scroll, overflow, frame, timer, historyId;
  let closing = false;

  function alreadyChosen() {
    try { return chosen || sessionStorage.getItem(sessionKey) === '1'; }
    catch { return chosen; }
  }

  function rememberChoice() {
    chosen = true;
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* Storage is optional. */ }
  }

  function normalClick(event) {
    return !event.defaultPrevented && event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  function stopPlayer() {
    clearTimeout(timer);
    if (frame) {
      frame.remove();
      frame = null;
    }
    host.replaceChildren();
    host.hidden = true;
    poster.hidden = false;
    play.hidden = false;
    play.disabled = false;
    help.hidden = true;
    status.textContent = initialStatus;
    dialog.classList.remove('is-playing');
  }

  function restorePage(restoreFocus) {
    if (!overflow) return;
    for (const [element, value, priority] of overflow) {
      if (value) element.style.setProperty('overflow', value, priority);
      else element.style.removeProperty('overflow');
    }
    overflow = null;
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    if (scroll) window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
  }

  function finishClose(restoreFocus = true) {
    stopPlayer();
    if (dialog.open) dialog.close();
    restorePage(restoreFocus);
    historyId = null;
    closing = false;
  }

  function ownsHistoryEntry() {
    return historyId && history.state?.[historyKey] === historyId;
  }

  function returnToDisclaimer() {
    if (!dialog.open || closing) return;
    closing = true;
    if (ownsHistoryEntry()) history.back();
    else finishClose();
  }

  function openWelcome(event) {
    if (!normalClick(event) || alreadyChosen()) return;
    event.preventDefault();
    if (dialog.open || closing) return;
    opener = event.currentTarget;
    scroll = { x: window.scrollX, y: window.scrollY };
    overflow = [document.documentElement, document.body].map(element => [
      element, element.style.getPropertyValue('overflow'), element.style.getPropertyPriority('overflow')
    ]);
    stopPlayer();
    try { dialog.showModal(); }
    catch {
      restorePage(false);
      window.location.assign(opener.href);
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
    play.focus({ preventScroll: true });
    historyId = `trailer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      history.pushState({ ...history.state, [historyKey]: historyId }, '', window.location.href);
    } catch { historyId = null; }
  }

  document.querySelectorAll('.poster[href="/desk/"], main > .enter[href="/desk/"], .warning-text .enter[href="/desk/"]')
    .forEach(link => link.addEventListener('click', openWelcome));

  play.addEventListener('click', () => {
    if (!dialog.open || frame) return;
    rememberChoice();
    play.disabled = true;
    const player = document.createElement('iframe');
    frame = player;
    player.title = 'IHOCAIHAG documentary trailer';
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.addEventListener('error', () => {
      if (frame !== player || !dialog.open) return;
      clearTimeout(timer);
      status.textContent = 'The trailer could not load here. Open it in a new tab, or skip to the desk.';
      help.hidden = false;
    });
    // This deliberate Play click requests playback with sound. The browser may
    // still require its own Play or Unmute gesture; no restrictions are bypassed.
    // No player loads while reading the disclaimer or thumbnail screen.
    // Supported options: https://bunny.net/docs/stream/embedding
    player.src = 'https://player.mediadelivery.net/embed/766115/b7f61780-50c3-473c-8186-ba556a2b981a?autoplay=true&muted=false&preload=true&playsinline=true';
    poster.hidden = true;
    host.hidden = false;
    host.replaceChildren(player);
    dialog.classList.add('is-playing');
    play.hidden = true;
    help.hidden = false;
    status.textContent = 'Loading trailer. If paused, press Play in the player. If muted, use its Unmute control. You can skip at any time.';
    skip.focus({ preventScroll: true });
    // A cross-origin iframe load event cannot confirm that video is playable.
    // Keep the direct player link and Skip available even when loading fails.
    timer = setTimeout(() => {
      if (frame === player && dialog.open) {
        status.textContent = 'If the trailer has not started, press Play in the player or open it in a new tab. If muted, use Unmute. You can skip to the desk.';
      }
    }, 12000);
  });

  skip.addEventListener('click', event => {
    if (!normalClick(event)) return;
    event.preventDefault();
    if (!dialog.open || closing) return;
    closing = true;
    rememberChoice();
    const replace = ownsHistoryEntry();
    finishClose(false);
    // Replace the temporary dialog history entry, so Back returns to the
    // disclaimer instead of reopening or trapping the visitor in the player.
    if (replace) window.location.replace(skip.href);
    else window.location.assign(skip.href);
  });
  back.addEventListener('click', returnToDisclaimer);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    returnToDisclaimer();
  });
  dialog.addEventListener('close', () => {
    stopPlayer();
    restorePage(true);
  });
  window.addEventListener('popstate', () => { if (dialog.open) finishClose(); });
  window.addEventListener('pagehide', () => finishClose(false));
})();
