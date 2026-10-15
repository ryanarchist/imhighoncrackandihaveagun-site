// Offline regressions: execute the shipped zoom module with DOM/event doubles.
// No network, accounts, storage, transactions, or media mutation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let checks = 0;
function check(label, fn) { fn(); checks++; console.log(`PASS ${label}`); }
function harness(width) {
  const nodes = [];
  function node() {
    const listeners = {}; const classes = new Set();
    const n = { listeners, style: {}, clientWidth: width, clientHeight: 600,
      classList: { contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
      before() {}, after() {}, append(child) { child.parentElement = n; },
      addEventListener(type, fn) { listeners[type] = fn; },
      setPointerCapture(id) { n.captured = id; }, getBoundingClientRect: () => ({ left: 0, top: 0 }),
      querySelector(s) { return s === 'button' ? n.button : n.span; },
      button: { addEventListener(t, fn) { this[t] = fn; } }, span: {},
      fire(type, props = {}) {
        const e = { clientX: 100, clientY: 100, pointerId: 1, target: { closest: () => null },
          preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...props };
        listeners[type](e); return e;
      }
    }; nodes.push(n); return n;
  }
  const stage = node(); stage.parentElement = node();
  const media = { matches: width <= 800, addEventListener(t, fn) { this.change = fn; } };
  const document = { body: { dataset: { roomScene: 'desk' } }, head: { append() {} },
    querySelector: () => stage, createElement: node, getElementById: () => null };
  vm.runInNewContext(read('src/desk-touch-zoom.js'), { document, matchMedia: () => media,
    MutationObserver: class { observe() {} disconnect() {} } });
  return { stage, win: nodes.find(n => n.className === 'desk-zoom-window'), tools: nodes.find(n => n.className === 'desk-zoom-tools'), media };
}
for (const width of [390, 768]) {
  const { stage, win, tools, media } = harness(width);
  check(`${width}: links and buttons retain activation before zoom`, () => {
    for (const tag of ['a','button','input','select','textarea','[role=button]']) {
      const e = win.fire('click', { target: { closest: selector => selector.includes(tag) ? {} : null } });
      assert(!e.prevented && !e.stopped); assert(!stage.style.transform);
    }
  });
  check(`${width}: empty space zooms 2.5x`, () => { assert(win.fire('click').prevented); assert.match(stage.style.transform, /scale\(2\.5\)/); });
  check(`${width}: object activation while zoomed preserves zoom`, () => {
    const before = stage.style.transform;
    const e = win.fire('click', { target: { closest: () => ({}) } });
    assert(!e.prevented && !e.stopped); assert.equal(stage.style.transform, before);
  });
  check(`${width}: drag pans and suppresses accidental object activation`, () => {
    const before = stage.style.transform;
    win.fire('pointerdown'); win.fire('pointermove', { clientX: 30, clientY: 30 }); win.fire('pointerup');
    assert.notEqual(stage.style.transform, before); assert.match(stage.style.transform, /scale\(2\.5\)/);
    const click = win.fire('click', { target: { closest: () => ({}) } }); assert(click.prevented && click.stopped);
  });
  check(`${width}: second empty tap resets`, () => { win.fire('click'); assert.equal(stage.style.transform, ''); });
  check(`${width}: Full desk resets`, () => { win.fire('click'); tools.button.click(); assert.equal(stage.style.transform, ''); });
  check(`${width}: desktop breakpoint resets zoom`, () => { win.fire('click'); media.matches = false; media.change(); assert.equal(stage.style.transform, ''); });
}
check('1440: desktop click is not captured or zoomed', () => { const h = harness(1440); assert(!h.win.fire('click').prevented); assert(!h.stage.style.transform); });
check('archive Desk links lead to /desk/ without entrance detour', () => {
  const html = read('concept/archive/index.html');
  assert.match(html, /href="\/desk\/"[^>]*>The Desk/);
  assert.match(html, /href="\/desk\/">BACK TO THE DESK/);
  assert.match(html, /href="\/desk\/" aria-label="Return to the desk"/);
  function visit(value) { if (!value || typeof value !== 'object') return; if (value.href && /desk/i.test([value.id,value.label,value.title,value.name].join(' '))) assert.notEqual(value.href, '/'); Object.values(value).forEach(visit); }
  visit(JSON.parse(read('data/room-site.json')));
});
check('entrance and social direct route preserve the full-film target', () => {
  assert.match(read('index.html'), /href="\/watch\/#mini-doc-1"/);
  const html = read('watch/index.html');
  assert.match(html, /data-page="documentary"/);
  assert.match(html, /<script src="\/src\/content\/siteContent.js[^">]*"><\/script>/);
  const callbacks = []; let scrolled = false;
  const context = { window: { location: { hash: '#mini-doc-1' } },
    requestAnimationFrame: callback => callback(),
    document: { fonts: { ready: { then: callback => callback() } },
      addEventListener: (name, callback) => { assert.equal(name, 'DOMContentLoaded'); callbacks.push(callback); },
      getElementById: id => { assert.equal(id, 'mini-doc-1'); return { scrollIntoView: () => { scrolled = true; } }; } }
  };
  // Content is deliberately blocking on this route, before the scoped SEO override.
  vm.runInNewContext(read('src/content/siteContent.js'), context);
  for (const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInNewContext(script, context);
  callbacks.forEach(callback => callback()); assert(scrolled, 'Direct film hash must scroll after rendering');
  scrolled = false; context.window.location.hash = ''; callbacks.forEach(callback => callback()); assert(!scrolled, 'No unsolicited scrolling without the film hash');
  const seo = context.window.IHOCAIHAGSiteContent.seoContent.routes.documentary;
  assert.match(seo.title, /Watch The Ride to Die/); assert.match(seo.description, /full film/);
  assert.equal(seo.canonicalUrl, 'https://imhighoncrackandihaveagun.com/documentary/');
  assert.match(html, /rel="canonical" href="https:\/\/imhighoncrackandihaveagun.com\/documentary\/"/);
  assert.match(read('src/content/siteContent.js'), /h3twQL94YiQ/);
  assert.match(read('src/content/siteContent.js'), /mini-doc-1/);
});
for (const route of ['/watch/', '/documentary/']) {
  check(`${route}: native Bunny player replaces YouTube without changing the route`, () => {
    const context = { window: { location: { origin: 'http://127.0.0.1:8832', pathname: route } }, document: { readyState: 'loading', addEventListener() {} }, URLSearchParams };
    vm.runInNewContext(read('src/content/siteContent.js'), context);
    vm.runInNewContext(read('src/site.js').replace('  function init() {', '  window.sprintDocumentary = renderDocumentary;\n  function init() {'), context);
    const html = context.window.sprintDocumentary();
    assert.match(html, /<video controls playsinline preload="metadata"/);
    assert.match(html, /data-film-quality/);
    assert.match(html, /data-film-fullscreen/);
    assert.doesNotMatch(html, /youtube|age-restricted|<iframe/i);
    assert.match(read(route.slice(1) + 'index.html'), /data-page="documentary"/);
    assert.match(read(route.slice(1) + 'index.html'), /src="\/src\/documentary-player.js" defer/);
  });
}
async function playbackChecks() {
  const catalog = JSON.parse(read('room/videos.json'));
  const film = catalog.videos.find(v => v.id === 'bunny-c472e350-95c4-4137-be1e-0bba37cf5ead');
  function harness({ native = false, denied = false, captions = false } = {}) {
    const nodes = new Map(); let instance, calls = 0, played = 0, fullscreen = 0;
    function node(key) {
      const n = { hidden: false, children: [], events: {}, paused: true,
        addEventListener(t, cb) { this.events[t] = cb; }, append(child) { this.children.push(child); },
        replaceChildren(...children) { this.children = children; }, removeAttribute(k) { delete this[k]; },
        pause() { this.paused = true; }, load() {}, canPlayType: () => native ? 'probably' : '',
        play() { played++; this.paused = false; return Promise.resolve(); },
        requestFullscreen() { fullscreen++; return Promise.resolve(); },
        querySelector: selector => nodes.get(selector) };
      nodes.set(key, n); return n;
    }
    const mount = node('mount');
    for (const key of ['video','[data-film-play]','[data-film-retry]','[data-film-quality]','select','[data-film-status]','[data-film-fullscreen]']) node(key);
    class FakeHls {
      static Events = { ERROR: 'error', MANIFEST_PARSED: 'manifest' };
      static isSupported() { return !native; }
      constructor() { instance = this; this.events = {}; this.levels = [{height:360},{height:720}]; }
      on(event, fn) { this.events[event] = fn; }
      loadSource(src) { this.source = src; }
      attachMedia() { this.events.manifest(); }
      destroy() { this.destroyed = true; }
    }
    const context = { window: { Hls: FakeHls, addEventListener() {} }, location: { href: 'http://localhost/watch/' },
      document: { querySelector: () => mount, createElement: tag => ({ tag }), head: { append() {} } },
      URL, Option: function(text,value) { this.text = text; this.value = value; },
      fetch: async url => { assert.equal(url,'/room/videos.json'); calls++; return { ok: !denied, json: async () => ({ videos: [{...film, ...(captions ? {captions:[{src:'/example.vtt',language:'en',label:'English'}]} : {})}] }) }; } };
    vm.runInNewContext(read('src/documentary-player.js'), context);
    return { nodes, instance: () => instance, played: () => played, fullscreen: () => fullscreen, calls: () => calls };
  }
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const h = harness({captions:true}); await flush();
  check('Bunny catalog is authoritative; no autoplay or duplicate stream', () => {
    assert.equal(h.instance().source, film.src); assert.match(film.src, /c472e350-95c4-4137-be1e-0bba37cf5ead\/playlist.m3u8$/);
    assert.equal(h.played(),0); assert.equal(h.nodes.get('[data-film-play]').disabled,false);
  });
  check('quality, supplied captions and fullscreen controls are wired', () => {
    const select=h.nodes.get('select'); assert.equal(select.children.length,3); select.value='1';select.events.change();
    assert.equal(h.instance().currentLevel,1); assert.equal(h.instance().capLevelToPlayerSize,false);
    select.value='-1';select.events.change(); assert.equal(h.instance().currentLevel,-1);
    assert.equal(h.nodes.get('video').children[0].label,'English');
    h.nodes.get('[data-film-fullscreen]').events.click(); assert.equal(h.fullscreen(),1);
    h.nodes.get('[data-film-play]').events.click(); assert.equal(h.played(),1);
  });
  const n = harness({native:true}); await flush();
  check('native HLS fallback retains the same stream', () => {
    assert.equal(n.nodes.get('video').src,film.src); assert.equal(n.nodes.get('[data-film-quality]').hidden,true);
    n.nodes.get('video').events.loadedmetadata(); assert.equal(n.nodes.get('[data-film-play]').disabled,false);
  });
  const bad = harness({denied:true}); await flush();
  check('catalog access failures show retry without switching provider', () => {
    assert.equal(bad.nodes.get('[data-film-retry]').hidden,false); assert.equal(bad.instance(),undefined); assert.equal(bad.played(),0);
  });
  const before = h.instance(); before.events.error(null,{fatal:true});
  await h.nodes.get('[data-film-retry]').events.click(); await flush();
  check('fatal HLS retry destroys the old player and reloads the catalog', () => {
    assert.equal(before.destroyed,true); assert.equal(h.calls(),2); assert.notEqual(h.instance(),before);
  });
  console.log(`${checks} Sprint 1 regression checks passed.`);
}
playbackChecks().catch(error => { console.error(error); process.exitCode=1; });
