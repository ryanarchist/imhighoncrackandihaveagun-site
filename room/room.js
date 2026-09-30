(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const scene = $('roomScene'), dialog = $('watchDialog'), player = $('archivePlayer');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Corners are clockwise from top left, measured on archive-room-v2.webp.
  const devices = [
    { id: 'tv', name: 'The TV', size: [360,180], points: [[42.4,12.4],[66.7,12.4],[66.7,28.3],[42.4,28.3]], initial: 'bunny-c472e350-95c4-4137-be1e-0bba37cf5ead', locked: true },
    { id: 'tablet', name: 'The tablet', size: [320,220], points: [[32.2,72.8],[49.6,72.0],[51.2,87.4],[33.3,89.0]], initial: 'psychosisloop2' },
    { id: 'laptop', name: 'The laptop', size: [320,180], points: [[55.0,69.0],[75.6,68.9],[76.3,86.0],[54.9,86.1]], initial: 'psychosislolololopsmusicvid' },
    { id: 'phone', name: 'The phone', size: [120,240], points: [[85.5,75.2],[90.6,75.7],[89.9,90.6],[84.7,89.9]], initial: 'bunny-c472e350-95c4-4137-be1e-0bba37cf5ead' }
  ];
  let videos = [], selected = null, hls = null, hlsPromise = null, loadVersion = 0;
  let opener = null, activeDevice = null, paused = reducedMotion.matches || !!navigator.connection?.saveData;
  const selections = new Map();
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mediaURL(value) {
    if (!value) return '';
    try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; }
    catch { return ''; }
  }
  // Project a rectangular HTML video onto each physical screen's four corners.
  function projection(width, height, corners) {
    const source = [[0,0],[width,0],[width,height],[0,height]];
    const matrix = [];
    source.forEach(([x,y], i) => {
      const [u,v] = corners[i];
      matrix.push([x,y,1,0,0,0,-u*x,-u*y,u], [0,0,0,x,y,1,-v*x,-v*y,v]);
    });
    for (let col=0; col<8; col++) {
      let pivot=col;
      for (let row=col+1; row<8; row++) if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot=row;
      [matrix[col],matrix[pivot]]=[matrix[pivot],matrix[col]];
      const divisor=matrix[col][col];
      if (Math.abs(divisor)<1e-10) return 'none';
      for (let k=col; k<9; k++) matrix[col][k]/=divisor;
      for (let row=0; row<8; row++) {
        if (row===col) continue;
        const factor=matrix[row][col];
        for (let k=col; k<9; k++) matrix[row][k]-=factor*matrix[col][k];
      }
    }
    const [a,b,c,d,e,f,g,h]=matrix.map((row)=>row[8]);
    return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
  }
  function placeDevices() {
    devices.forEach((device) => {
      if (!device.element) return;
      const points=device.points.map(([x,y])=>[x*scene.clientWidth/100,y*scene.clientHeight/100]);
      device.element.style.transform=projection(...device.size,points);
    });
  }
  function updatePreviews() {
    const enabled=!paused && !document.hidden && !dialog.open && sceneInView;
    devices.forEach(({element}) => {
      const preview=element?.querySelector('video');
      if (!preview) return;
      if (enabled && preview.dataset.preview) {
        if (!preview.getAttribute('src')) preview.src=preview.dataset.preview;
        preview.play().catch(()=>{});
      } else preview.pause();
    });
    $('motionToggle').textContent=paused?'Play screen previews':'Pause screen previews';
    $('motionToggle').setAttribute('aria-pressed',String(paused));
  }
  let sceneInView=true;
  new IntersectionObserver(([entry])=>{sceneInView=entry.isIntersecting;updatePreviews();},{threshold:0.1}).observe(scene);
  document.addEventListener('visibilitychange',updatePreviews);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)paused=true;updatePreviews();});
  $('motionToggle').addEventListener('click',()=>{paused=!paused;updatePreviews();});
  function buildDevices() {
    const host=$('devices'), shortcuts=$('deviceShortcuts');
    devices.forEach((device,index)=>{
      const video=videos.find((item)=>item.id===device.initial)||(device.locked?null:videos[index%videos.length]);
      if (!video) return;
      selections.set(device.id,video.id);
      const button=document.createElement('button');
      button.type='button';button.className='device';button.dataset.device=device.id;
      button.setAttribute('aria-label',`${device.name}: watch ${video.title}`);
      button.style.width=`${device.size[0]}px`;button.style.height=`${device.size[1]}px`;
      button.innerHTML=`<video muted loop playsinline preload="none" poster="${escape(video.poster)}" data-preview="${escape(video.preview)}" aria-hidden="true"></video><span class="device-label">${escape(device.name)} ↗</span>`;
      button.addEventListener('click',()=>openRoom(device,button));
      host.append(button);device.element=button;
      const shortcut=document.createElement('button');shortcut.type='button';shortcut.textContent=`${String(index+1).padStart(2,'0')} / ${device.name}`;
      shortcut.addEventListener('click',()=>openRoom(device,shortcut));shortcuts.append(shortcut);
    });
    placeDevices();updatePreviews();
  }
  function renderLibrary() {
    const query=$('archiveSearch').value.trim().toLowerCase(), collection=$('collectionFilter').value;
    const matches=videos.filter((v)=>(collection==='all'||v.collection===collection)&&`${v.title} ${v.collection} ${v.description}`.toLowerCase().includes(query));
    $('videoCount').textContent=`${matches.length} / ${videos.length}`;
    $('archiveEmpty').hidden=matches.length>0;
    const fragment=document.createDocumentFragment();
    matches.forEach((video)=>{
      const button=document.createElement('button');button.type='button';button.className='archive-card';button.dataset.video=video.id;
      button.setAttribute('aria-pressed',String(selected?.id===video.id));
      button.innerHTML=`<img src="${escape(video.poster)}" alt="" loading="lazy"><span><strong>${escape(video.title)}</strong><small>${escape(video.collection)}${video.duration?' · '+escape(video.duration):''}</small></span>`;
      button.addEventListener('click',()=>selectVideo(video));fragment.append(button);
    });
    $('archiveList').replaceChildren(fragment);
  }
  function message(text,error=false) {
    $('playbackStatus').textContent=text;
    $('retryPlayback').hidden=!error;
  }
  function unloadPlayer() {
    loadVersion++;
    $('qualityControl').hidden=true;
    $('playbackQuality').replaceChildren(new Option('Auto (recommended)','-1'));
    if(hls){hls.destroy();hls=null;}
    player.pause();player.removeAttribute('src');player.replaceChildren();player.load();
  }
  function loadHls() {
    if(window.Hls)return Promise.resolve(window.Hls);
    if(!hlsPromise)hlsPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js';
      script.onload=()=>window.Hls?resolve(window.Hls):reject(new Error('Player unavailable'));
      script.onerror=()=>{script.remove();hlsPromise=null;reject(new Error('Player unavailable'));};document.head.append(script);
    });
    return hlsPromise;
  }
  function attemptPlay(version) {
    if(version!==loadVersion||!dialog.open)return;
    player.play().catch(()=>{if(version===loadVersion)message('Press play to start.');});
  }
  async function selectVideo(video) {
    if(activeDevice?.locked && video.id!==activeDevice.initial)return;
    const focusedCard=document.activeElement?.dataset.video;
    unloadPlayer();selected=video;const version=loadVersion;
    if(activeDevice){
      selections.set(activeDevice.id,video.id);
      const preview=activeDevice.element.querySelector('video');
      preview.pause();preview.removeAttribute('src');preview.poster=video.poster;preview.dataset.preview=video.preview;preview.load();
      activeDevice.element.setAttribute('aria-label',`${activeDevice.name}: watch ${video.title}`);
    }
    $('playerEmpty').hidden=true;player.poster=video.poster;
    player.hidden=false;document.querySelector('.video-info').hidden=false;
    $('videoTitle').textContent=video.title;$('videoCollection').textContent=video.collection;$('videoDescription').textContent=video.description;
    $('watchTitle').textContent=video.title;message('Loading video…');renderLibrary();
    if(focusedCard)[...$('archiveList').children].find((card)=>card.dataset.video===video.id)?.focus({preventScroll:true});
    for(const caption of video.captions||[]) {
      const src=mediaURL(caption.src);if(!src)continue;
      const track=document.createElement('track');track.kind='captions';track.src=src;track.srclang=caption.language||'en';track.label=caption.label||'Captions';player.append(track);
    }
    const isHls=video.type==='application/x-mpegURL'||/\.m3u8(?:\?|$)/i.test(video.src);
    try {
      if(isHls) {
        const Hls=await loadHls();if(version!==loadVersion||!dialog.open)return;
        if(!Hls.isSupported()){
          if(player.canPlayType('application/vnd.apple.mpegurl')){player.src=video.src;attemptPlay(version);return;}
          throw new Error('Streaming unavailable');
        }
        hls=new Hls({enableWorker:true,capLevelToPlayerSize:true,capLevelOnFPSDrop:true,maxBufferLength:45,backBufferLength:30});
        hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal&&version===loadVersion)message('This video could not load. Check your connection and try again.',true);});
        hls.on(Hls.Events.MANIFEST_PARSED,()=>{
          if(version!==loadVersion)return;
          hls.levels.forEach((level,index)=>$('playbackQuality').append(new Option(`${level.height}p`,String(index))));
          $('qualityControl').hidden=false;
          attemptPlay(version);
        });hls.loadSource(video.src);hls.attachMedia(player);
      }else{player.src=video.src;attemptPlay(version);}
    }catch {if(version===loadVersion)message('This video could not load. Check your connection and try again.',true);}
  }
  player.addEventListener('playing',()=>message(''));
  $('playbackQuality').addEventListener('change',()=>{
    if(!hls)return;
    const level=Number($('playbackQuality').value);
    hls.capLevelToPlayerSize=level===-1;
    hls.currentLevel=level;
  });
  player.addEventListener('waiting',()=>{if(selected&&dialog.open)message('Buffering…');});
  player.addEventListener('error',()=>{if(selected&&dialog.open)message('This video could not load. Check your connection and try again.',true);});
  $('retryPlayback').addEventListener('click',()=>{if(selected)selectVideo(selected);});
  function openRoom(device,trigger) {
    opener=trigger;activeDevice=device;
    dialog.classList.toggle('dedicated-film',!!device?.locked);
    document.querySelector('.library').hidden=!!device?.locked;
    $('watchDevice').textContent=device?device.name:'THE ARCHIVE';
    $('archiveSearch').value='';$('collectionFilter').value='all';
    dialog.showModal();document.body.classList.add('is-watching');updatePreviews();
    if(device?.element&&!reducedMotion.matches) {
      const origin=device.element.getBoundingClientRect(),target=$('playerFrame').getBoundingClientRect();
      const ghost=document.createElement('img');ghost.src=device.element.querySelector('video').poster;ghost.alt='';
      Object.assign(ghost.style,{position:'fixed',left:`${origin.left}px`,top:`${origin.top}px`,width:`${origin.width}px`,height:`${origin.height}px`,objectFit:'cover',zIndex:'100',pointerEvents:'none'});
      dialog.append(ghost);
      ghost.animate([{left:`${origin.left}px`,top:`${origin.top}px`,width:`${origin.width}px`,height:`${origin.height}px`,opacity:1},{left:`${target.left}px`,top:`${target.top}px`,width:`${target.width}px`,height:`${target.height}px`,opacity:0}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.finally(()=>ghost.remove());
    }
    if(device){const video=videos.find((v)=>v.id===(device.locked?device.initial:selections.get(device.id)))||(!device.locked&&videos[0]);if(video)selectVideo(video);}
    else{selected=null;unloadPlayer();player.hidden=true;document.querySelector('.video-info').hidden=true;$('playerEmpty').hidden=false;$('watchTitle').textContent='Choose something to watch.';$('videoTitle').textContent='';$('videoCollection').textContent='';$('videoDescription').textContent='';message('');renderLibrary();}
    $('closeWatch').focus();
  }
  $('closeWatch').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(event)=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{selected=null;unloadPlayer();document.body.classList.remove('is-watching');updatePreviews();opener?.focus({preventScroll:true});});
  document.querySelectorAll('[data-browse]').forEach((button)=>button.addEventListener('click',()=>openRoom(null,button)));
  $('archiveSearch').addEventListener('input',renderLibrary);$('collectionFilter').addEventListener('change',renderLibrary);
  new ResizeObserver(placeDevices).observe(scene);
  fetch('/room/videos.json').then((response)=>{if(!response.ok)throw new Error('Archive unavailable');return response.json();}).then((data)=>{
    const ids=new Set();
    videos=(Array.isArray(data.videos)?data.videos:[]).filter((v)=>v.id&&v.title&&mediaURL(v.src)&&!ids.has(v.id)&&ids.add(v.id)).map((v)=>({...v,src:mediaURL(v.src),poster:mediaURL(v.poster),preview:mediaURL(v.preview),collection:v.collection||'Archive',description:v.description||''}));
    $('collectionNote').textContent=data.collectionNote||`${videos.length} videos in the archive`;
    [...new Set(videos.map((v)=>v.collection))].forEach((collection)=>{const option=document.createElement('option');option.value=collection;option.textContent=collection;$('collectionFilter').append(option);});
    buildDevices();renderLibrary();$('roomStatus').textContent=videos.length?'Four screens. Your choice.':'The shelves are waiting for their first film.';
    if(innerWidth<=700)$('sceneScroll').scrollLeft=(scene.clientWidth-$('sceneScroll').clientWidth)/2;
  }).catch(()=>{$('roomStatus').textContent='The archive could not load. Refresh to try again.';$('archiveEmpty').hidden=false;$('archiveEmpty').textContent='The archive could not load. Refresh to try again.';});
})();
