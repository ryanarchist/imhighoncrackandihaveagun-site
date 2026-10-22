// Entirely offline. Mock storage only; no accounts, messages, live submissions or uploads.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const handler=require('../api/eyes/index.js');let checks=0;
const check=(name,f)=>{f();checks++;console.log('PASS '+name);};
const base=()=>({id:crypto.randomUUID(),title:'TEST ENTRY',text:'Offline verification only.',context:'',attribution:'anonymous',credit:'Must not leak',contact:'',permissions:{website:false,book:false},rights:true,files:[]});
check('anonymous credit cannot leak supplied name',()=>assert.equal(handler.validate(base()).credit,''));
check('website and book consent remain independent',()=>{const b=base();b.permissions.book=true;const v=handler.validate(b);assert.equal(v.permissions.website,false);assert.equal(v.permissions.book,true);assert.equal(v.permissionVersion,'2026-10-22-v1');});
check('both named attribution modes validated',()=>{for(const attribution of ['real','chosen']){const b={...base(),attribution,credit:'Test credit'};assert.equal(handler.validate(b).credit,'Test credit');assert.throws(()=>handler.validate({...b,credit:''}));}});
check('oversize and unsupported attachments rejected',()=>{for(const f of [{mime:'text/html',size:10},{mime:'text/plain',size:8388609}])assert.throws(()=>handler.validate({...base(),files:[{id:crypto.randomUUID(),name:'bad',...f}]}));});
check('empty entry and unchecked rights rejected',()=>{assert.throws(()=>handler.validate({...base(),text:''}));assert.throws(()=>handler.validate({...base(),rights:false}));});
check('actual byte validation rejects executable and mismatched files',()=>{assert(!handler.sniff(Buffer.from('<script>alert(1)</script>'),'text/plain'));assert(!handler.sniff(Buffer.from('not a PDF'),'application/pdf'));assert(handler.sniff(Buffer.from('TEST plain text'),'text/plain'));assert(handler.sniff(Buffer.from('%PDF-1.7 test'),'application/pdf'));});
check('private schema has no visitor grants',()=>{const sql=fs.readFileSync('supabase/eyes_private_schema.sql','utf8');assert.match(sql,/enable row level security/);assert.match(sql,/revoke all.*from public,anon,authenticated/);assert.match(sql,/false,8388608/);assert(!/grant.*to anon/.test(sql));});
check('no silent draft persistence or automatic submission',()=>{const js=fs.readFileSync('src/eyes.js','utf8');assert(!/localStorage|indexedDB/.test(js));assert.match(js,/getUserMedia\(\{audio:true\}\)/);assert.match(js,/getTracks\(\).forEach\(t=>t.stop/);assert.match(js,/saved.saved!==true/);});
const store=new Map(),objects=new Map();const originalFetch=global.fetch,oldEnv={...process.env};
process.env.SUPABASE_URL='https://offline.test';process.env.SUPABASE_SERVICE_ROLE_KEY='offline-test-key';process.env.ARCHIVE_OWNER_USER_IDS='offline-owner';process.env.EYES_SUBMISSIONS_ENABLED='true';
global.fetch=async(url,options={})=>{const u=new URL(url),p=u.pathname,b=options.body?JSON.parse(options.body):{};const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(p==='/storage/v1/bucket/eyes-private')return response({public:false,file_size_limit:8388608});
 if(p==='/auth/v1/user')return response({message:'Not authorized'},401);
 if(p==='/rest/v1/rpc/eyes_begin'){if(store.has(b.p_id))return response({},409);store.set(b.p_id,{id:b.p_id,token_hash:b.p_token_hash,payload:b.p_payload,state:'uploading',created_at:new Date().toISOString(),review_status:'pending'});return response(null);}
 if(p==='/rest/v1/rpc/eyes_finish'){const row=store.get(b.p_id);row.state='submitted';row.payload.files=b.p_files;return response(null);}
 if(p==='/rest/v1/eyes_submissions'){if(u.searchParams.get('limit')==='0')return response([]);const id=u.searchParams.get('id')?.slice(3),token=u.searchParams.get('token_hash')?.slice(3);return response([...store.values()].filter(r=>(!id||r.id===id)&&(!token||r.token_hash===token)));}
 if(p.startsWith('/storage/v1/object/upload/sign/'))return response({url:'/signed-offline'});
 if(p.startsWith('/storage/v1/object/eyes-private/')){const data=objects.get(p.split('/eyes-private/')[1]);return data?new Response(data):response({},404);}
 throw Error('Unexpected offline request: '+p);
};
const call=(action,body,headers={})=>new Promise((resolve,reject)=>{const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(text){resolve({status:this.statusCode,data:JSON.parse(text)});}};handler({method:body?'POST':'GET',url:'/?action='+action,headers,body},res).catch(reject);});
(async()=>{try{
 let r=await call('health');check('readiness requires private backend',()=>assert.equal(r.data.accepting,true));
 process.env.EYES_SUBMISSIONS_ENABLED='false';r=await call('begin',base());check('disabled storage cannot pretend to save',()=>assert.equal(r.status,503));process.env.EYES_SUBMISSIONS_ENABLED='true';
 for(const attribution of ['anonymous','chosen','real']){const payload={...base(),attribution,credit:'Test credit'};const start=await call('begin',payload);assert.equal(start.status,201);const saved=await call('finish',start.data);check(attribution+' entry saved privately',()=>{assert.equal(saved.data.saved,true);assert.equal(store.get(payload.id).review_status,'pending');assert.equal(store.get(payload.id).payload.permissions.website,false);});const repeat=await call('finish',start.data);check(attribution+' retry does not duplicate',()=>assert.equal(repeat.data.reference,payload.id));}
 const f={id:crypto.randomUUID(),name:'test.txt',mime:'text/plain',size:4},payload={...base(),files:[f]},start=await call('begin',payload);
 r=await call('finish',start.data);check('missing attachment blocks success',()=>assert.equal(r.status,409));
 objects.set(payload.id+'/'+f.id,Buffer.from('TEST'));r=await call('finish',start.data);check('confirmed attachment saved with checksum',()=>{assert.equal(r.data.saved,true);assert.equal(store.get(payload.id).payload.files[0].sha256,crypto.createHash('sha256').update('TEST').digest('hex'));});
 r=await call('finish',{id:payload.id,token:'0'.repeat(64)});check('another visitor cannot access entry',()=>assert.equal(r.status,404));
 r=await call('review');check('unauthenticated private queue denied',()=>assert.equal(r.status,401));
 r=await call('decision',{id:payload.id,status:'reviewed'});check('unauthenticated review change denied',()=>assert.equal(r.status,401));
 r=await call('file');check('unauthenticated attachment denied',()=>assert.equal(r.status,401));
 r=await call('begin',base(),{origin:'https://unrelated.test'});check('unapproved browser origin denied',()=>assert.equal(r.status,403));
 console.log(checks+' offline contribution checks passed. No live data created.');
 }finally{global.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in oldEnv))delete process.env[k];Object.assign(process.env,oldEnv);}})().catch(e=>{console.error(e);process.exitCode=1;});
