(() => {
  if(document.body.dataset.roomScene!=='desk')return;
  function attach(){
    const stage=document.querySelector('.concept-image-stage');
    if(!stage||stage.querySelector('[data-mra-books]'))return;
    const nav=document.createElement('nav');nav.dataset.mraBooks='';nav.setAttribute('aria-label','Books on the desk');
    const books=[['Cocaine Addiction — explore Modern Recovery Alliance','7%','50.5%','12%','22%'],['A Time to Love and a Time to Die — explore Modern Recovery Alliance','12%','52%','15%','20%']];
    for(const [name,x,y,w,h] of books){const a=document.createElement('a');a.href='/mra/';a.setAttribute('aria-label',name);a.title='Modern Recovery Alliance';a.style.cssText=`position:absolute;left:${x};top:${y};width:${w};height:${h};z-index:45;clip-path:polygon(0 15%,65% 0,100% 65%,35% 100%);`;a.className='mra-book-link';nav.append(a)}
    const style=document.createElement('style');style.textContent='.mra-book-link:hover{background:rgba(0,207,255,.10);outline:2px solid #00cfff}.mra-book-link:focus-visible{outline:3px solid #00cfff;background:rgba(0,207,255,.22)}';nav.append(style);stage.append(nav);
    const choices=document.querySelector('.concept-object-links');if(choices&&!choices.querySelector('[data-mra-link]')){const a=document.createElement('a');a.href='/mra/';a.className='concept-button';a.dataset.mraLink='';a.textContent='MODERN RECOVERY ALLIANCE ↗';choices.append(a)}
    observer.disconnect();
  }
  const observer=new MutationObserver(attach);observer.observe(document.getElementById('room-concept')||document.body,{childList:true,subtree:true});attach();
})();