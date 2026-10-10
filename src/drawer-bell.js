(() => {
  const asset='/assets/trap-house/story-pipe-bell.png';
  window.IHOCAIHAG_DRAWER_BELL=(host,scene)=>{
    const stage=host.querySelector('.concept-image-stage'),links=host.querySelector('.concept-object-links'),videos=host.deskVideoControls;
    if(!stage||!links||!videos||stage.querySelector('[data-drawer-bell]'))return;
    const pipe=document.createElement('div');pipe.className='drawer-bell-art';pipe.setAttribute('aria-hidden','true');
    pipe.innerHTML='<img class="drawer-pipe-glass" src="'+asset+'" alt=""><span class="drawer-lighter"><img src="'+asset+'" alt=""></span><span class="drawer-flame"><span></span></span><span class="drawer-pipe-tip"></span>';
    const label=document.createElement('button');label.type='button';label.className='drawer-bell-label';label.dataset.drawerBell='';
    label.innerHTML='click to ring<br>your bell';label.setAttribute('aria-label','Click to ring your bell — light the pipe and play Waves');
    const hit=document.createElement('button');hit.type='button';hit.className='drawer-bell-hit';hit.setAttribute('aria-label','Light the pipe in the drawer and play Waves');hit.tabIndex=-1;
    const canvas=document.createElement('canvas');canvas.className='drawer-smoke-canvas';canvas.setAttribute('aria-hidden','true');
    const shortcut=document.createElement('button');shortcut.type='button';shortcut.className='concept-button drawer-bell-shortcut';shortcut.textContent='click to ring your bell';shortcut.dataset.drawerBellShortcut='';
    const skip=document.createElement('button');skip.type='button';skip.className='concept-button drawer-bell-skip';skip.textContent='SKIP TO WAVES ↗';skip.hidden=true;
    const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    stage.append(hit,pipe,label,canvas);links.prepend(shortcut,skip);host.append(status);
    const lighter=pipe.querySelector('.drawer-lighter'),tip=pipe.querySelector('.drawer-pipe-tip'),cloud=new Image();
    cloud.src='/assets/trap-house/story-smoke-cloud.png';
    let controller=null,animations=[],smokeFrame=0,origin={x:0,y:0};
    const ctx=canvas.getContext('2d');
    function fit(){
      const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
      // The drawer's floor recedes toward the desk; the objects lie along that plane.
      videos.project(pipe,1000,1000/3,[[.054,.904],[.124,.788],[.152,.809],[.081,.926]].map(([x,y])=>[x*w,y*h]));
      const box=stage.getBoundingClientRect(),point=tip.getBoundingClientRect();
      origin={x:point.left+point.width/2-box.left,y:point.top+point.height/2-box.top};
      const ratio=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    new ResizeObserver(fit).observe(stage);fit();
    function clear(){
      cancelAnimationFrame(smokeFrame);ctx.clearRect(0,0,stage.clientWidth,stage.clientHeight);
      for(const animation of animations)animation.cancel();animations=[];
      pipe.classList.remove('is-lit','is-hot');label.disabled=shortcut.disabled=hit.disabled=false;skip.hidden=true;
      stage.dataset.bellPhase='idle';
    }
    function cancel(){controller?.abort();controller=null;clear();}
    const delay=(ms,signal)=>new Promise((resolve,reject)=>{
      const aborted=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',aborted);resolve();},ms);signal.addEventListener('abort',aborted,{once:true});
      if(signal.aborted)aborted();
    });
    async function move(frames,duration,signal){
      const animation=lighter.animate(frames,{duration,easing:'cubic-bezier(.25,.7,.3,1)',fill:'forwards'});animations.push(animation);
      const abort=()=>animation.cancel();signal.addEventListener('abort',abort,{once:true});
      try{await animation.finished;}finally{signal.removeEventListener('abort',abort);}
    }
    function smoke(signal){
      return new Promise((resolve,reject)=>{
        const began=performance.now(),particles=Array.from({length:38},(_,i)=>({born:i*37,life:1900+(i%7)*110,seed:i*2.39996323}));
        let started=false;
        const aborted=()=>{cancelAnimationFrame(smokeFrame);reject(new DOMException('Cancelled','AbortError'));};
        signal.addEventListener('abort',aborted,{once:true});
        const draw=now=>{
          if(signal.aborted)return;
          const time=now-began,w=stage.clientWidth,h=stage.clientHeight;ctx.clearRect(0,0,w,h);
          // Curling strands from the existing smoke artwork rise from the pipe, then drift across the monitor.
          const clearing=Math.max(0,Math.min(1,(2900-time)/800));
          for(const p of particles){
            const age=(time-p.born)/p.life;if(age<=0||age>=1)continue;
            const alpha=Math.sin(Math.PI*age)*clearing,x=origin.x+age*w*.14+Math.sin(age*8+p.seed)*w*.017*age,y=origin.y-age*h*.77;
            const size=w*(.045+age*.25),tall=size*.72;
            ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(p.seed+age*3)*.16);ctx.globalAlpha=alpha*.10;
            if(cloud.complete&&cloud.naturalWidth)ctx.drawImage(cloud,-size*.56,-tall*.91,size,tall);
            else{const g=ctx.createRadialGradient(0,0,0,0,0,size*.5);g.addColorStop(0,'#d5c9b299');g.addColorStop(1,'#d5c9b200');ctx.fillStyle=g;ctx.fillRect(-size*.5,-size*.5,size,size);}
            ctx.restore();
          }
          if(time>=2140&&!started){started=true;videos.playInline('waves');stage.dataset.bellPhase='playing';status.textContent='Waves is opening on the left monitor.';}
          if(time<2900)smokeFrame=requestAnimationFrame(draw);
          else{signal.removeEventListener('abort',aborted);ctx.clearRect(0,0,w,h);resolve();}
        };
        smokeFrame=requestAnimationFrame(draw);
      });
    }
    async function begin(){
      if(controller)return;
      videos.stopInline();controller=new AbortController();const signal=controller.signal;
      // This sequence starts only on a deliberate click; Skip to Waves is the explicit bypass.
      label.disabled=shortcut.disabled=hit.disabled=true;skip.hidden=false;stage.dataset.bellPhase='igniting';status.textContent='Lighting the pipe.';
      try{
        await move([{transform:'translate(0,0)'},{transform:'translate(35.3%,-8%)'}],720,signal);
        pipe.classList.add('is-lit','is-hot');await delay(900,signal);
        stage.dataset.bellPhase='smoke';status.textContent='Smoke is rising in front of the left monitor.';
        pipe.classList.remove('is-lit');move([{transform:'translate(35.3%,-8%)'},{transform:'translate(0,0)'}],540,signal).catch(()=>{});
        await smoke(signal);
        clear();stage.dataset.bellPhase='playing';controller=null;
      }catch(error){
        if(error.name!=='AbortError')status.textContent='Use the Waves screen to play the video.';
        clear();controller=null;
      }
    }
    for(const trigger of [label,hit,shortcut])trigger.addEventListener('click',begin);
    skip.addEventListener('click',()=>{cancel();videos.playInline('waves');stage.dataset.bellPhase='playing';status.textContent='Waves is opening on the left monitor.';shortcut.focus();});
    document.addEventListener('desk:cancel-bell',cancel);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&controller)cancel();});
    window.addEventListener('pagehide',cancel);
  };
})();
