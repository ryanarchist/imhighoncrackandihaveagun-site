(() => {
  // Positions describe the supplied artwork. Assign an existing archive item URL
  // to a notebook/paper's href when Ryan supplies its original record.
  const objects = [
    {id:'closed-notebook',label:'01 / The closed notebook',kind:'record',box:[11,39,12,18]},
    {id:'spiral-pages',label:'02 / The spiral pages',kind:'record',box:[23,47,12,22]},
    {id:'purple-notebook',label:'03 / The purple notebook',kind:'record',box:[38,43,19,19]},
    {id:'open-notebook',label:'04 / The open notebook',kind:'record',box:[27,75,24,18]},
    {id:'orange-notebook',label:'05 / The orange notebook',kind:'record',box:[56,67,11,23]},
    {id:'loose-pages',label:'06 / The loose papers',kind:'record',box:[72,47,19,20]},
    {id:'rear-pages',label:'07 / The papers by the bag',kind:'record',box:[33,16,9,24]},
    {id:'blue-folder',label:'08 / The blue photo folder',kind:'photos',box:[68,85,12,10],href:'/archive/?type=photos#archive-browser'},
    {id:'yellow-folder',label:'09 / The yellow photo folder',kind:'photos',box:[88,76,10,15],href:'/archive/?type=photos#archive-browser'}
  ];
  const layer=document.getElementById('artifactObjects');
  const shortcuts=document.getElementById('artifactShortcuts');
  const dialog=document.getElementById('artifactSlotDialog');
  if(!layer||!shortcuts||!dialog)return;
  let opener;
  function control(object,scene){
    const node=document.createElement(object.href?'a':'button');
    if(object.href)node.href=object.href;
    else {node.type='button';node.addEventListener('click',()=>{
      opener=node;
      document.getElementById('artifactSlotTitle').textContent=object.label;
      dialog.showModal();
    });}
    node.className=scene?'artifact-object':'artifact-shortcut';
    node.dataset.object=object.id;
    node.setAttribute('aria-label',object.label+(object.kind==='photos'?' — open pictures':' — archive item slot'));
    const label=document.createElement('span');label.textContent=object.label+' ↗';node.append(label);
    if(scene){const [x,y,w,h]=object.box;Object.assign(node.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});}
    return node;
  }
  objects.forEach(object=>{layer.append(control(object,true));shortcuts.append(control(object,false));});
  document.getElementById('closeArtifactSlot').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus());
})();
