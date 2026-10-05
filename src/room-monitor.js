(() => {
  window.IHOCAIHAG_ROOM_MONITOR = (host, config) => {
    const monitor = host.querySelector('[data-room-monitor]');
    const stage = host.querySelector('.concept-image-stage');
    const open = host.querySelector('[data-zoom-monitor]');
    const close = monitor.querySelector('.monitor-close');
    let expanded = false;

    // Project the live page into the four corners of the photographed screen.
    function fit() {
      if (expanded) return;
      const width = stage.clientWidth, height = stage.clientHeight;
      const source = [[0,0],[config.width,0],[config.width,config.height],[0,config.height]];
      const rows = [];
      source.forEach(([x,y], index) => {
        const [u,v] = config.quad[index].map((value,axis) => value * (axis ? height : width));
        rows.push([x,y,1,0,0,0,-u*x,-u*y,u], [0,0,0,x,y,1,-v*x,-v*y,v]);
      });
      for (let col=0; col<8; col++) {
        let pivot=col;
        for (let row=col+1; row<8; row++) if (Math.abs(rows[row][col])>Math.abs(rows[pivot][col])) pivot=row;
        [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
        const divisor=rows[col][col];
        if (Math.abs(divisor)<1e-10) return;
        for (let k=col;k<9;k++) rows[col][k]/=divisor;
        for (let row=0;row<8;row++) if (row!==col) {
          const factor=rows[row][col];
          for(let k=col;k<9;k++) rows[row][k]-=factor*rows[col][k];
        }
      }
      const [a,b,c,d,e,f,g,h]=rows.map(row=>row[8]);
      monitor.style.width=`${config.width}px`;
      monitor.style.height=`${config.height}px`;
      monitor.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
    }
    function zoom(value) {
      expanded=value;
      monitor.classList.toggle('is-expanded',value);
      close.hidden=!value;
      open.setAttribute('aria-expanded',String(value));
      document.body.classList.toggle('monitor-is-open',value);
      host.querySelectorAll('.concept-nav,.concept-heading,.concept-hotspots,.concept-object-links,.concept-connections,.concept-footer,.concept-scene figcaption').forEach(element=>element.inert=value);
      if(value){monitor.setAttribute('role','dialog');monitor.setAttribute('aria-modal','true');monitor.setAttribute('aria-label',config.label||'Ring the Bell monitor');}else{monitor.removeAttribute('role');monitor.removeAttribute('aria-modal');monitor.removeAttribute('aria-label');}
      if(value) close.focus(); else {fit();open.focus();}
    }
    open.setAttribute('aria-expanded','false');
    open.addEventListener('click',()=>zoom(true));
    monitor.querySelector('.board-scene-open')?.addEventListener('click',()=>zoom(true));
    close.addEventListener('click',()=>zoom(false));
    const escape=event=>{if(event.key==='Escape'&&expanded) zoom(false);};
    document.addEventListener('keydown',escape);
    monitor.querySelector('iframe')?.addEventListener('load',event=>{
      event.target.contentDocument?.addEventListener('keydown',escape);
    });
    new ResizeObserver(fit).observe(stage);
    fit();
  };
})();
