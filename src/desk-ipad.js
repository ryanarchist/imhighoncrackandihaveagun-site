(() => {
  const host = document.getElementById('room-concept');
  if (!host || document.body.dataset.roomScene !== 'desk') return;
  function mount() {
    const stage = host.querySelector('.concept-image-stage');
    if (!stage || stage.querySelector('.days-ipad')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'days-ipad';
    button.setAttribute('aria-label', 'Play DAYS — poem on the iPad');
    button.innerHTML = '<img src="/assets/site-foundation/days-poem-poster.png" alt="DAYS — Now I just bleed through this pen.">';
    stage.append(button);
    const foreground = document.createElement('img');
    foreground.src = stage.querySelector('img').src;
    foreground.alt = ''; foreground.setAttribute('aria-hidden', 'true');
    foreground.className = 'days-mic-foreground'; stage.append(foreground);
    const dialog = document.createElement('dialog'); dialog.className = 'days-player';
    dialog.setAttribute('aria-label', 'DAYS — Ryan’s poem');
    dialog.innerHTML = '<header><h2>DAYS / THE POEM</h2><button type="button" class="concept-button">BACK TO THE DESK ×</button></header><div class="days-player-screen"></div>';
    host.append(dialog);
    const shortcut = document.createElement('button');
    shortcut.type = 'button'; shortcut.className = 'concept-button'; shortcut.textContent = 'PLAY DAYS / THE IPAD ↗';
    host.querySelector('.concept-object-links').prepend(shortcut);
    let opener;
    function open(event) {
      opener = event.currentTarget;
      host.querySelector('.concept-monitor iframe')?.contentDocument?.querySelector('video')?.pause();
      const frame = document.createElement('iframe');
      frame.title = 'DAYS — poem by Ryan';
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;
      frame.src = 'https://iframe.mediadelivery.net/embed/766115/5d294d9d-016c-41b6-a541-b6bbba507428?autoplay=true&preload=true&responsive=true';
      dialog.querySelector('.days-player-screen').replaceChildren(frame);
      dialog.showModal();
    }
    button.addEventListener('click', open); shortcut.addEventListener('click', open);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.querySelector('.days-player-screen').replaceChildren();
      opener?.focus();
    });
    // Project the complete poster into the photographed iPad screen.
    function fit() {
      const w = stage.clientWidth, h = stage.clientHeight;
      const source = [[0,0],[519,0],[519,935],[0,935]];
      const quad = [[.239,.433],[.301,.455],[.257,.567],[.192,.526]];
      const rows = [];
      source.forEach(([x,y],i) => {
        const u = quad[i][0]*w, v = quad[i][1]*h;
        rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
      });
      for(let c=0;c<8;c++) {
        let pivot=c; for(let r=c+1;r<8;r++) if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c])) pivot=r;
        [rows[c],rows[pivot]]=[rows[pivot],rows[c]];
        const d=rows[c][c]; if(Math.abs(d)<1e-10)return;
        for(let k=c;k<9;k++)rows[c][k]/=d;
        for(let r=0;r<8;r++)if(r!==c){const f=rows[r][c];for(let k=c;k<9;k++)rows[r][k]-=f*rows[c][k];}
      }
      const [a,b,c,d,e,f,g,hg]=rows.map(r=>r[8]);
      button.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${hg},0,0,1,0,${c},${f},0,1)`;
    }
    new ResizeObserver(fit).observe(stage); fit();
  }
  new MutationObserver(mount).observe(host, {childList:true});
  mount();
})();
