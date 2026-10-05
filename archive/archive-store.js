(() => {

  const config=window.TRAP_HOUSE_CONFIG||{};

  const local=['localhost','127.0.0.1','::1'].includes(location.hostname);

  const endpoint=local?'/api/archive':`${config.archiveApiBaseUrl||'https://imhighoncrackandihaveagun-site.vercel.app'}/api/archive`;

  const token=()=>sessionStorage.getItem('iho_trap_pass_v2:auth_access')||'';

  let sandbox=local&&sessionStorage.getItem('iho_archive_sandbox')==='1',dbPromise;

  function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('iho_archive_local_review',1);request.onupgradeneeded=()=>{request.result.createObjectStore('items',{keyPath:'id'});request.result.createObjectStore('files');request.result.createObjectStore('history',{autoIncrement:true});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return dbPromise;}

  async function store(name,mode,operation){const database=await db();return new Promise((resolve,reject)=>{const transaction=database.transaction(name,mode);const request=operation(transaction.objectStore(name));let result;request.onsuccess=()=>{result=request.result;};request.onerror=()=>reject(request.error);transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);});}

  async function api(action,body,auth=false){const response=await fetch(`${endpoint}?action=${encodeURIComponent(action)}`,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth&&token()?{Authorization:`Bearer ${token()}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.message||'Archive service is not configured yet.');return data;}

  async function seeds(){return (await (await fetch('/data/archive-items.json')).json()).items.filter(i=>i.status==='published');}

  async function list(owner=false){if(sandbox&&owner)return store('items','readonly',s=>s.getAll());const data=await api(owner?'manage':'list',null,owner);return data.items||[];}

  async function publicItems(){const base=await seeds();try{const live=await list();const byId=new Map(base.map(i=>[i.id,i]));live.forEach(i=>byId.set(i.id,i));return [...byId.values()];}catch{return base;}}

  async function media(item,index,thumbnail=false){const file=item.media?.[index];if(!file)return '';if(file.localKey){if(!sandbox)throw Error('Private preview only.');const blob=await store('files','readonly',s=>s.get(thumbnail&&file.thumbnailKey?file.thumbnailKey:file.localKey));return blob?URL.createObjectURL(blob):'';}if(file.src)return file.src;return remoteMedia(item,index,thumbnail);}

  // Keep action parameters separate from the action value.

  async function remoteMedia(item,index,thumbnail){const response=await fetch(`${endpoint}?action=media&id=${encodeURIComponent(item.id)}&index=${index}&variant=${thumbnail?'thumbnail':'original'}`,{headers:token()?{Authorization:`Bearer ${token()}`}:{},cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.message||'Media unavailable.');return data.url;}

  async function getMedia(item,index,thumbnail=false){return item.media?.[index]?.storagePath?remoteMedia(item,index,thumbnail):media(item,index,thumbnail);}

  async function thumbnail(file){if(!file.type.startsWith('image/'))return null;const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.8));}

  const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

  async function upload(itemId,file){if(!allowed.has(file.type)||file.size>25*1024*1024)throw Error('Use JPG, PNG, WebP, GIF, PDF, TXT, or DOCX up to 25 MB.');const key=crypto.randomUUID();const thumb=await thumbnail(file);const common={id:key,name:file.name,mime:file.type,size:file.size,alt:''};if(sandbox){const localKey=`${itemId}/${key}`;await store('files','readwrite',s=>s.put(file,localKey));let thumbnailKey='';if(thumb){thumbnailKey=localKey+'-thumb';await store('files','readwrite',s=>s.put(thumb,thumbnailKey));}return {...common,localKey,thumbnailKey};}

    async function transfer(blob,variant){const ticket=await api('upload',{id:itemId,mime:blob.type,size:blob.size,variant},true);const response=await fetch(ticket.url,{method:'PUT',headers:{'Content-Type':blob.type,'x-upsert':'false'},body:blob});if(!response.ok)throw Error('Upload failed. The original has not been replaced.');return ticket.path;}

    return {...common,storagePath:await transfer(file,'original'),thumbnailPath:thumb?await transfer(thumb,'thumbnail'):''};

  }

  async function save(item){if(sandbox){const previous=await store('items','readonly',s=>s.get(item.id));if(previous){if((previous.reflections||[]).some(old=>!item.reflections.some(next=>JSON.stringify(next)===JSON.stringify(old))))throw Error('Existing dated reflections are preserved. Add a new reflection.');if(previous.version!==item.version)throw Error('This record changed. Reload it before editing.');await store('history','readwrite',s=>s.add({item:previous,savedAt:new Date().toISOString()}));const oldPaths=(previous.media||[]).map(m=>m.localKey);if(oldPaths.some(path=>!item.media.some(m=>m.localKey===path)))throw Error('Original uploads are preserved. Add new pages or reorder them.');}item.version=(previous?.version||0)+1;item.addedAt=previous?.addedAt||new Date().toISOString();item.updatedAt=new Date().toISOString();await store('items','readwrite',s=>s.put(item));return item;}return (await api('save',{item},true)).item;}

  async function signIn(email){const response=await fetch(`${config.supabaseUrl}/auth/v1/otp`,{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,create_user:false})});if(!response.ok)throw Error('Sign-in is unavailable. Confirm the existing Supabase project and owner account.');}

  async function verify(email,code){const response=await fetch(`${config.supabaseUrl}/auth/v1/verify`,{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,token:code,type:'email'})});const data=await response.json();if(!response.ok||!data.access_token)throw Error('Could not verify that code.');window.TrapHouse?.setAuthenticatedSession?.(data.access_token);sessionStorage.setItem('iho_trap_pass_v2:auth_access',data.access_token);return api('owner',null,true);}

  window.ArchiveStore={local,publicItems,list,upload,save,getMedia,signIn,verify,owner:()=>api('owner',null,true),enableSandbox(){if(!local)throw Error('Local preview only.');sandbox=true;sessionStorage.setItem('iho_archive_sandbox','1');},get sandbox(){return sandbox;},async draft(id){if(sandbox)return store('items','readonly',s=>s.get(id));return window.ArchiveStore.remoteDraft(id);},async remoteDraft(id){const response=await fetch(`${endpoint}?action=draft&id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token()}`},cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.message||'Draft unavailable.');return data.item;}};

})();
