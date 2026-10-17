(() => {
  // Left follows the established room directions; right retraces the same circle.
  const rooms = [
    { href: '/desk/', label: 'the Desk' },
    { href: '/concept/boards/', label: 'the Thread Map' },
    { href: '/concept/archive/', label: 'the Archive' },
    { href: '/concept/els-corner/', label: "Big El and Lil El’s Cozy Corner" }
  ];
  const currentPath = location.pathname.replace(/\/?$/, '/');
  const index = rooms.findIndex(room => room.href === currentPath);
  if (index < 0) return;

  const left = rooms[(index + 1) % rooms.length];
  const right = rooms[(index - 1 + rooms.length) % rooms.length];

  function arrow(direction, room, label = `Swivel ${direction} to ${room.label}`) {
    const link = document.createElement('a');
    link.className = `room-arrow ${direction}`;
    link.href = room.href;
    link.setAttribute('aria-label', label);
    link.title = label;
    const artwork = document.createElement('span');
    artwork.setAttribute('aria-hidden', 'true');
    link.append(artwork);
    return link;
  }

  function mount() {
    const scene = document.querySelector('.concept-scene, .archive-room .scene-scroll, main > .scene');
    if (!scene || document.querySelector('.room-direction-arrows')) return;
    const old = document.querySelector('[aria-label="Turn right to Big El and Lil El’s Cozy Corner"]');
    if (old) old.remove();
    const nav = document.createElement('nav');
    nav.className = 'room-direction-arrows';
    nav.setAttribute('aria-label', 'Turn around the room');
    nav.append(arrow('left', left));
    if (index === 0) nav.append(arrow('around', rooms[2], 'Turn around to the Archive'));
    nav.append(arrow('right', right));
    if (index === 2) scene.after(nav);
    else scene.append(nav);

    const css = document.createElement('style');
    css.textContent = `
      .room-direction-arrows{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 16px;background:#0d0906;border-top:1px solid #624b2e}
      .archive-room .room-direction-arrows{box-sizing:border-box;width:calc(100% - 48px);max-width:1676px;margin:0 auto}
      @media(max-width:700px){.archive-room .room-direction-arrows{width:100%}}
      .room-arrow{display:block;width:clamp(70px,11vw,135px);min-width:44px;min-height:44px;position:relative;filter:drop-shadow(0 4px 5px #000);transition:filter .15s,transform .15s}
      .room-arrow span{display:block;width:100%;background-image:url(/assets/site-foundation/room-navigation-arrows.png);background-repeat:no-repeat}
      .room-arrow.right span{aspect-ratio:512/310;background-size:244.53125% 270.32258%;background-position:2.7027% 46.2121%;clip-path:polygon(0 20%,65% 17%,66% 0,100% 50%,66% 100%,65% 87%,0 95%)}
      .room-arrow.left span{aspect-ratio:457/310;background-size:273.9606% 270.32258%;background-position:68.43% 46.59%;clip-path:polygon(35% 0,35% 16%,100% 21%,100% 95%,35% 89%,35% 100%,0 50%)}
      .room-arrow.around{width:clamp(40px,5vw,60px)}
      .room-arrow.around span{aspect-ratio:250/270;background-size:500.8% 310.37%;background-position:99.2% 70.95%;clip-path:ellipse(49% 48% at 50% 50%)}
      .room-arrow.around:after{content:"TURN AROUND";display:block;text-align:center;color:#d9c8a9;font:10px/1.3 sans-serif;letter-spacing:1px;margin-top:5px}
      .room-arrow:hover{filter:drop-shadow(0 0 8px #c69e5e);transform:translateY(-2px)}
      .room-arrow:focus-visible{outline:3px solid #ecd1a1;outline-offset:5px}
      @media(max-width:600px){.room-direction-arrows{padding:6px 10px;gap:10px}.room-arrow{width:26%;max-width:95px}.room-arrow.around{width:14%;max-width:48px}}
      @media(min-width:801px){body[data-room-scene=desk] .concept-shell{max-width:1600px}}
      @media(max-width:600px){body[data-room-scene=desk] .concept-scene{margin-left:-12px;margin-right:-12px}body[data-room-scene=desk] .concept-heading{padding-top:8px;padding-bottom:8px}body[data-room-scene=desk] .concept-heading h1{font-size:34px}body[data-room-scene=desk] .concept-heading p{margin:8px 0}}
    `;
    document.head.append(css);
    observer.disconnect();
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.getElementById('room-concept') || document.body, { childList: true, subtree: true });
  mount();
})();
