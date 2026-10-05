const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const core=require('../../archive/archive-core.js');
const BUCKET='archive-originals';
const MIME=new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const defaults=['https://imhighoncrackandihaveagun.com','https://www.imhighoncrackandihaveagun.com','https://imhighoncrackandihaveagun-site.vercel.app','http://127.0.0.1:8880','http://localhost:8880','http://127.0.0.1:8877'];
function error(status,message){return Object.assign(new Error(message),{status});}
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));}
function configuration(){const url=(process.env.SUPABASE_URL||process.env.TRAP_HOUSE_SUPABASE_URL||'').replace(/\/+$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY||process.env.TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY||process.env.TRAP_HOUSE_SUPABASE_SECRET_KEY;return url&&key?{url,key}:null;}
function threadSlugs(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../src/content/siteContent.js'),'utf8'),context);return context.window.IHOCAIHAGSiteContent.mapContent.threads.map(t=>t.slug);}
async function call(config,route,options={}){const response=await fetch(config.url+route,{...options,headers:{apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});const data=await response.json().catch(()=>null);if(!response.ok){if(data?.code==='P0001')throw error(409,'The record changed or an original was removed. Reload the saved item before editing.');throw error(response.status===409?409:503,'Archive storage is unavailable. Confirm the archive schema and private bucket.');}return data;}
async function requireOwner(req,config){const header=req.headers.authorization||'';if(!/^Bearer \S+$/.test(header))throw error(401,'Owner sign-in required.');const owners=new Set((process.env.ARCHIVE_OWNER_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean));if(!config||!owners.size)throw error(503,'Owner access needs SUPABASE_URL, a server-only Supabase key, and ARCHIVE_OWNER_USER_IDS.');const response=await fetch(`${config.url}/auth/v1/user`,{headers:{apikey:config.key,Authorization:header},signal:AbortSignal.timeout(10000)});if(!response.ok)throw error(401,'Your owner session has expired. Sign in again.');const user=await response.json();if(!user.id||!user.email_confirmed_at||!owners.has(user.id))throw error(403,'This account cannot manage the archive.');return user;}
function validateItem(item,user){core.validate(item,threadSlugs());if(JSON.stringify(item).length>300000)throw error(400,'This record is too large. Use a document upload for longer material.');if((item.media||[]).length>60)throw error(400,'Use up to 60 pages per item.');for(const file of item.media||[]){if(!MIME.has(file.mime)||!file.storagePath?.startsWith(`${user.id}/${item.id}/`)||file.storagePath.includes('..')||file.src||file.localKey)throw error(400,'Use original files uploaded through this owner account.');if(file.thumbnailPath&&(!file.thumbnailPath.startsWith(`${user.id}/${item.id}/`)||file.thumbnailPath.includes('..')))throw error(400,'Invalid thumbnail.');}return {id:item.id,title:item.title.trim(),type:item.type,status:item.status,originalDate:item.originalDate,description:String(item.description||''),transcription:String(item.transcription||''),context:String(item.context||''),threads:item.threads||[],related:item.related||[],contentLinks:(item.contentLinks||[]).map(link=>({label:String(link.label||'Project connection'),href:core.safeLink(link.href)})),reflections:item.reflections||[],media:item.media||[]};}
function serialize(row){return {...row.payload,id:row.id,status:row.status,version:row.version,addedAt:row.added_at,updatedAt:row.updated_at,publishedAt:row.published_at};}
async function handler(req,res){const origin=req.headers.origin;const origins=new Set([...defaults,...(process.env.ARCHIVE_ALLOWED_ORIGINS||'').split(',').filter(Boolean)]);if(origin&&!origins.has(origin))return send(res,403,{message:'Origin not allowed.'});if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}if(!['GET','POST'].includes(req.method))return send(res,405,{message:'Method not allowed.'});
  const url=new URL(req.url,'https://archive.local');const action=url.searchParams.get('action')||'list';const config=configuration();
  try{
    const ownerAction=['owner','manage','draft','save','upload'].includes(action);const user=ownerAction?await requireOwner(req,config):null;
    if(!config)throw error(503,'Archive storage is not configured.');
    if(action==='owner'&&req.method==='GET')return send(res,200,{owner:true});
    if(['list','manage'].includes(action)&&req.method==='GET'){const rows=await call(config,`/rest/v1/archive_items?select=*&order=added_at.desc${action==='list'?'&status=eq.published':''}`);return send(res,200,{items:rows.map(serialize)});}
    if(['draft','media'].includes(action)&&req.method==='GET'){
      const id=url.searchParams.get('id')||'';if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{2,79}$/.test(id))throw error(404,'Item not found.');
      let canReadDraft=!!user;
      let rows=await call(config,`/rest/v1/archive_items?id=eq.${encodeURIComponent(id)}&select=*${canReadDraft?'':'&status=eq.published'}`);if(!rows.length&&action==='media'&&req.headers.authorization){await requireOwner(req,config);rows=await call(config,`/rest/v1/archive_items?id=eq.${encodeURIComponent(id)}&select=*`);}const row=rows[0];if(!row)throw error(404,'Item not found.');
      if(action==='draft')return send(res,200,{item:serialize(row)});
      const index=Number(url.searchParams.get('index'));if(!Number.isInteger(index)||index<0)throw error(404,'Page not found.');const file=row.payload.media?.[index];if(!file)throw error(404,'Page not found.');const objectPath=url.searchParams.get('variant')==='thumbnail'&&file.thumbnailPath?file.thumbnailPath:file.storagePath;if(!objectPath||objectPath.includes('..'))throw error(404,'Page not found.');
      const signed=await call(config,`/storage/v1/object/sign/${BUCKET}/${objectPath.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',body:JSON.stringify({expiresIn:300})});return send(res,200,{url:config.url+'/storage/v1'+signed.signedURL});
    }
    if(['save','upload'].includes(action)&&req.method==='POST'){
      let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body||typeof body!=='object')throw error(400,'Send a JSON request.');
      if(action==='upload'){
        if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{2,79}$/.test(body.id||'')||!MIME.has(body.mime)||!Number.isFinite(body.size)||body.size<=0||body.size>25*1024*1024)throw error(400,'Invalid upload: supported files up to 25 MB.');
        const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','application/pdf':'pdf','text/plain':'txt','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'}[body.mime];const objectPath=`${user.id}/${body.id}/${body.variant==='thumbnail'?'thumb-':''}${crypto.randomUUID()}.${ext}`;
        const ticket=await call(config,`/storage/v1/object/upload/sign/${BUCKET}/${objectPath}`,{method:'POST',body:'{}'});return send(res,200,{path:objectPath,url:config.url+'/storage/v1'+ticket.url});
      }
      const item=validateItem(body.item,user);const result=await call(config,'/rest/v1/rpc/archive_save',{method:'POST',body:JSON.stringify({p_id:item.id,p_payload:item,p_expected_version:Number(body.item.version)||0,p_owner:user.id})});return send(res,200,{item:serialize(Array.isArray(result)?result[0]:result)});
    }
    return send(res,400,{message:'Unknown archive action.'});
  }catch(cause){return send(res,cause.status||400,{message:cause.status?cause.message:'The record could not be saved. Check its fields or reload if it changed.'});}
}
module.exports=handler;
module.exports.requireOwner=requireOwner;
module.exports.validateItem=validateItem;
