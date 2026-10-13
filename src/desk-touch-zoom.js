(() => {
 if(document.body.dataset.roomScene!=='desk')return;
 const mobile=matchMedia('(max-width: 800px)');
 function mount(){
 const stage=document.querySelector('.concept-image-stage');if(!stage||stage.parentElement.classList.contains('desk-zoom-window'))return;
 const windowEl=document.createElement('div');windowEl.className='desk-zoom-window';stage.before(windowEl);windowEl.append(stage);
 const toolbar=document.createElement('div');toolbar.className='desk-zoom-tools';toolbar.innerHTML='<span>Tap the desk to zoom 2.5× · drag to explore</span><button type="button" aria-label="Show full desk">Full desk ↙</button>';windowEl.after(toolbar);
 const style=document.createElement('style');style.textContent='.desk-zoom-window{overflow:hidden;position:relative}.desk-zoom-tools{display:none}@media(max-width:800px){.desk-zoom-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;color:#e7d2b0;font:14px/1.4 sans-serif}.desk-zoom-tools button{padding:10px 14px;background:#19110c;color:#f7e8d2;border:1px solid #aa8050;border-radius:4px;min-height:44px}.desk-zoom-window.zoomed{touch-action:none}.desk-zoom-window .concept-image-stage{transform-origin:0 0;will-change:transform}}';document.head.append(style);
 let zoom=false,x=0,y=0,start=null,dragged=false;
 function render(){const w=windowEl.clientWidth,h=windowEl.clientHeight;x=Math.min(0,Math.max(-1.5*w,x));y=Math.min(0,Math.max(-1.5*h,y));stage.style.transform=zoom?`translate(${x}px,${y}px) scale(2.5)`:'';windowEl.classList.toggle('zoomed',zoom);toolbar.querySelector('span').textContent=zoom?'2.5× · drag to explore · tap objects to open':'Tap the desk to zoom 2.5× · drag to explore';}
 function reset(){zoom=false;start=null;render()}toolbar.querySelector('button').addEventListener('click',reset);mobile.addEventListener('change',reset);
 windowEl.addEventListener('pointerdown',e=>{if(!mobile.matches)return;dragged=false;if(zoom)start={px:e.clientX,py:e.clientY,x,y,id:e.pointerId};});
 windowEl.addEventListener('pointermove',e=>{if(!start||!zoom)return;const dx=e.clientX-start.px,dy=e.clientY-start.py;if(Math.hypot(dx,dy)>8){dragged=true;windowEl.setPointerCapture(e.pointerId);e.preventDefault();x=start.x+dx;y=start.y+dy;render();}});
 windowEl.addEventListener('pointerup',()=>{start=null});windowEl.addEventListener('pointercancel',()=>{start=null});
 windowEl.addEventListener('click',e=>{if(!mobile.matches)return;if(dragged){e.preventDefault();e.stopImmediatePropagation();dragged=false;return;}if(!zoom){e.preventDefault();e.stopImmediatePropagation();const rect=windowEl.getBoundingClientRect();x=-1.5*(e.clientX-rect.left);y=-1.5*(e.clientY-rect.top);zoom=true;render();}},true);
 observer.disconnect();
 }
 const observer=new MutationObserver(mount);observer.observe(document.getElementById('room-concept')||document.body,{childList:true,subtree:true});mount();
})();
