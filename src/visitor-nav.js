(() => {
  const links=[['Start Here','/about/'],['Watch','/watch/#mini-doc-1'],['Read','/book/'],['Listen','/soundtrack/'],['Explore','/desk/'],['Shop','/store/']];
  const secondary=[['Thread definitions','/map/'],['Video collection','/concept/archive/'],['Documents & photographs','/archive/'],['Trap Passes','/trap-pass/'],['My wallet','/my-pass/'],['Modern Recovery Alliance','/mra/']];
  function active(href){const p=location.pathname;return href.startsWith('/watch/')?['/watch/','/documentary/'].includes(p):href==='/desk/'?p==='/desk/'||p.startsWith('/concept/'):p===href;}
  const anchor=([label,href])=>`<a href="${href}"${active(href)?' aria-current="page"':''}>${label}</a>`;
  function mount(){
    if(document.querySelector('.visitor-header'))return;
    const header=document.createElement('header');header.className='visitor-header';header.innerHTML=`<a class="visitor-brand" href="/desk/">IHOCAIHAG</a><nav aria-label="Primary">${links.map(anchor).join('')}<button type="button" aria-haspopup="dialog" aria-controls="visitor-more">More</button></nav>`;
    document.body.prepend(header);
    const mobile=document.createElement('nav');mobile.className='visitor-mobile';mobile.setAttribute('aria-label','Mobile primary');mobile.innerHTML=[links[0],links[1],links[4],links[5]].map(anchor).join('')+'<button type="button" aria-haspopup="dialog" aria-controls="visitor-more">More</button>';
    const dialog=document.createElement('dialog');dialog.id='visitor-more';dialog.className='visitor-menu';dialog.setAttribute('aria-labelledby','visitor-menu-title');dialog.innerHTML=`<header><h2 id="visitor-menu-title">Find your way</h2><button type="button" aria-label="Close navigation">Close ×</button></header><nav aria-label="More destinations">${[...links,...secondary].map(anchor).join('')}</nav>`;
    document.body.append(mobile,dialog);const opener=mobile.querySelector('button');opener.onclick=()=>dialog.showModal();let lastOpener=opener;header.querySelector('button').onclick=()=>{lastOpener=header.querySelector('button');dialog.showModal();};opener.addEventListener('click',()=>lastOpener=opener);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>lastOpener.focus());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    document.body.classList.add('has-visitor-nav');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
