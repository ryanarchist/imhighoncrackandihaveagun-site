(() => {
  const project = (element, width, height, quad) => {
    const rows=[];
    [[0,0],[width,0],[width,height],[0,height]].forEach(([x,y],i) => {
      const [u,v]=quad[i];
      rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
    });
    for(let c=0;c<8;c++){
      let p=c;for(let r=c+1;r<8;r++)if(Math.abs(rows[r][c])>Math.abs(rows[p][c]))p=r;
      [rows[c],rows[p]]=[rows[p],rows[c]];
      const d=rows[c][c];if(Math.abs(d)<1e-10)return;
      for(let k=c;k<9;k++)rows[c][k]/=d;
      for(let r=0;r<8;r++)if(r!==c){const f=rows[r][c];for(let k=c;k<9;k++)rows[r][k]-=f*rows[c][k];}
    }
    const [a,b,c,d,e,f,g,h]=rows.map(r=>r[8]);
    element.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
  };
  // A shared composition is sliced across the curved screen rather than stretched flat.
  const curve = (points,t) => {
    const p=Math.min(points.length-1,Math.max(0,t*(points.length-1)));
    const i=Math.min(points.length-2,Math.floor(p)),u=p-i;
    const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
    return [0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*u+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*u*u+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*u*u*u));
  };
  window.IHOCAIHAG_DESK_VIDEOS = (host,scene) => {
    const stage=host.querySelector('.concept-image-stage'),links=host.querySelector('.concept-object-links');
    if(!stage||!links||stage.querySelector('[data-desk-video]'))return;
    const dialog=document.createElement('dialog');dialog.className='desk-video-player';
    dialog.setAttribute('aria-labelledby','desk-video-title');
    const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button'),screen=document.createElement('div');
    title.id='desk-video-title';close.type='button';close.className='concept-button';close.textContent='BACK TO THE DESK ×';
    screen.className='desk-video-player-screen';header.append(title,close);dialog.append(header,screen);host.append(dialog);
    let opener;
    const open=(video,trigger)=>{
      document.dispatchEvent(new Event('desk:cancel-bell'));stopInline();
      opener=trigger;title.textContent=video.title;
      const ratio=video.aspectRatio||16/9;screen.style.aspectRatio=String(ratio);dialog.classList.toggle('is-portrait-video',ratio<1);
      host.querySelector('.concept-monitor iframe')?.contentDocument?.querySelector('video')?.pause();
      const frame=document.createElement('iframe');
      frame.title=video.title;frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';frame.allowFullscreen=true;
      frame.src='https://iframe.mediadelivery.net/embed/'+encodeURIComponent(video.library)+'/'+encodeURIComponent(video.video)+'?autoplay=true&preload=true&responsive=true';
      screen.replaceChildren(frame);dialog.showModal();document.body.classList.add('desk-video-is-open');
    };
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{screen.replaceChildren();document.body.classList.remove('desk-video-is-open');opener?.focus();});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
    });
    const monitors=[];let inlineVideo=null;
    const inlineStop=document.createElement('button');inlineStop.type='button';inlineStop.className='concept-button desk-inline-stop';inlineStop.textContent='STOP WAVES / BACK TO THE POSTER ×';inlineStop.hidden=true;links.append(inlineStop);
    function stopInline(){
      if(!inlineVideo)return;
      inlineVideo.container.remove();inlineVideo.monitor.button.classList.remove('is-playing');inlineVideo=null;inlineStop.hidden=true;
    }
    function playInline(id){
      stopInline();const monitor=monitors.find(m=>m.video.id===id);if(!monitor)return;
      const {video}=monitor,container=document.createElement('div'),frame=document.createElement('iframe'),glass=document.createElement('span'),stop=document.createElement('button');
      container.className='desk-monitor-inline-video';container.dataset.inlineVideo=id;container.style.width=video.width+'px';container.style.height=video.height+'px';container.style.setProperty('--inline-video-width',(video.height*(video.aspectRatio||16/9))+'px');
      frame.title=video.title+' — playing on the left monitor';frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';frame.allowFullscreen=true;
      frame.src='https://iframe.mediadelivery.net/embed/'+encodeURIComponent(video.library)+'/'+encodeURIComponent(video.video)+'?autoplay=true&preload=true&responsive=true';
      glass.className='desk-monitor-glass desk-inline-glass';stop.type='button';stop.className='desk-inline-close';stop.textContent='×';stop.setAttribute('aria-label','Stop Waves and restore the thumbnail');stop.addEventListener('click',stopInline);
      container.append(frame,glass,stop);stage.append(container);monitor.button.classList.add('is-playing');inlineVideo={container,monitor};inlineStop.hidden=false;fit();
    }
    inlineStop.addEventListener('click',stopInline);
    document.addEventListener('desk:stop-inline-video',stopInline);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!host.querySelector('dialog[open]'))stopInline();});
    window.addEventListener('pagehide',stopInline);
    host.deskVideoControls={playInline,stopInline,project};
    for(const video of scene.featuredVideos){
      const button=document.createElement('button');button.type='button';button.className='desk-video-monitor is-'+video.side;
      button.dataset.deskVideo=video.id;button.setAttribute('aria-label','Play '+video.title+' — '+video.side+' monitor');button.title='Play '+video.title;
      const top=video.top||[video.quad[0],video.quad[1]],bottom=video.bottom||[video.quad[3],video.quad[2]];
      const samples=video.top?16:1;
      const outline=[];
      for(let i=0;i<=samples;i++)outline.push(curve(top,i/samples));
      for(let i=samples;i>=0;i--)outline.push(curve(bottom,i/samples));
      button.style.clipPath='polygon('+outline.map(([x,y])=>(x*100)+'% '+(y*100)+'%').join(',')+')';
      const strips=[];
      for(let i=0;i<samples;i++){
        const t0=Math.max(0,i/samples-.0013),t1=Math.min(1,(i+1)/samples+.0013);
        const strip=document.createElement('span'),art=document.createElement('span');
        strip.className='desk-monitor-strip';art.className='desk-monitor-art is-'+video.side;art.setAttribute('aria-hidden','true');
        strip.style.width=((t1-t0)*video.width)+'px';strip.style.height=video.height+'px';
        art.style.width=video.width+'px';art.style.height=video.height+'px';art.style.left=(-t0*video.width)+'px';
        const back=document.createElement('img'),image=document.createElement('img'),glass=document.createElement('span'),cue=document.createElement('span');
        back.src=video.poster;back.alt='';back.className='desk-monitor-backdrop';back.draggable=false;
        image.src=video.poster;image.alt='';image.className='desk-monitor-image';image.draggable=false;
        glass.className='desk-monitor-glass';cue.className='desk-monitor-cue';cue.textContent='▶';
        if(video.side==='right'){
          // Adapt the supplied portrait artwork to the ultrawide screen without stretching its lettering.
          const headline=document.createElement('span'),products=document.createElement('span');
          headline.className='desk-monitor-headline';products.className='desk-monitor-products';
          back.className='desk-monitor-image';headline.append(image);products.append(back);art.append(headline,products,glass,cue);
        }else art.append(back,image,glass,cue);
        strip.append(art);button.append(strip);strips.push({element:strip,t0,t1});
      }
      button.addEventListener('click',()=>open(video,button));stage.append(button);
      const shortcut=document.createElement('button');shortcut.type='button';shortcut.className='concept-button desk-featured-link';
      shortcut.textContent='PLAY '+video.title.toUpperCase()+' ↗';shortcut.dataset.deskVideoShortcut=video.id;
      shortcut.addEventListener('click',()=>open(video,shortcut));links.append(shortcut);
      monitors.push({video,button,top,bottom,strips});
    }
    const hint=document.createElement('span');hint.className='desk-monitor-hint is-room';
    hint.textContent='go take a blast from the drawer to play a video on one of ryans monitors';stage.append(hint);
    for(const [name,mask] of [
      ['foreground-cup','polygon(12.5% 35.2%,12.9% 34.1%,14% 33.4%,15.5% 33.3%,16.7% 34%,17.6% 35.5%,18.1% 41%,18.8% 52%,17.4% 55%,14.9% 54%,13.3% 46%)'],
      ['screen-clamp','polygon(88.187% 17.659%,88.768% 17.313%,89.775% 18.560%,93.300% 25.693%,93.726% 27.285%,93.416% 28.463%,92.603% 29.017%,91.828% 28.047%,88.226% 20.152%,87.955% 18.906%)']
    ]){
      const image=document.createElement('img');image.src=scene.image;image.alt='';image.setAttribute('aria-hidden','true');
      image.className='desk-monitor-occlusion is-'+name;image.style.clipPath=mask;stage.append(image);
    }
    const fit=()=>{
      const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
      stage.style.setProperty('--desk-room-hint-size',Math.min(24,w*.016)+'px');
      for(const {video,top,bottom,strips} of monitors)for(const {element,t0,t1} of strips){
        const quad=[curve(top,t0),curve(top,t1),curve(bottom,t1),curve(bottom,t0)].map(([x,y])=>[x*w,y*h]);
        project(element,(t1-t0)*video.width,video.height,quad);
      }
      if(inlineVideo){const {video}=inlineVideo.monitor;project(inlineVideo.container,video.width,video.height,video.quad.map(([x,y])=>[x*w,y*h]));}
    };
    new ResizeObserver(fit).observe(stage);fit();
  };
})();
