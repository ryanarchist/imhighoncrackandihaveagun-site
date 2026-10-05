const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
for(const name of ['archive-core.js','archive-store.js','archive.js']){const check=spawnSync(process.execPath,['--check',path.join(root,'archive',name)],{encoding:'utf8'});assert.equal(check.status,0,check.stderr);}
const core=require('../archive/archive-core.js');
const handler=require('../api/archive/index.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/content/siteContent.js'),'utf8'),context);
const threads=context.window.IHOCAIHAGSiteContent.mapContent.threads.map(t=>t.slug);
const seeds=JSON.parse(fs.readFileSync(path.join(root,'data/archive-items.json'),'utf8')).items;
assert.equal(threads.length,9);assert.equal(new Set(seeds.map(i=>i.id)).size,seeds.length);
for(const item of seeds){core.validate(item,threads);for(const file of item.media||[]){assert(fs.existsSync(path.join(root,file.src)));if(file.thumbnail)assert(fs.existsSync(path.join(root,file.thumbnail)));}}
const sample=[{...seeds[0],id:'TEST-001',threads:[threads[0]],transcription:'Verbatim pineapple [unclear]',originalDate:{certainty:'exact',value:'2024-01-01'}},{...seeds[1],id:'TEST-002',status:'draft',transcription:'pineapple'}];
assert.equal(core.filter(sample,{q:'pineapple',type:'photos',thread:threads[0]}).length,1);
assert.equal(core.filter(sample,{q:'pineapple',thread:threads[1]}).length,0);
assert.equal(core.safeLink('https://evil.example/secret'),'');
assert.equal(core.safeLink('javascript:alert(1)'),'');
assert.throws(()=>core.validate({...seeds[0],threads:['invented-thread']},threads));
assert.throws(()=>core.validate({...seeds[0],type:'__proto__'},threads));
assert.throws(()=>core.validate({...seeds[0],originalDate:{certainty:'exact',value:'2026-02-31'}},threads));
assert.throws(()=>core.validate({...seeds[0],status:'published',media:[],transcription:''},threads));
async function request(action,{token,method='GET',body,origin}={}){let status,result;const res={setHeader(){},set statusCode(v){status=v},get statusCode(){return status},end(value){result=value?JSON.parse(value):null;}};await handler({url:'/api/archive?'+action,method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(origin?{origin}:{})},body},res);return {status,result};}
(async()=>{
  const savedFetch=global.fetch;
  for(const name of ['SUPABASE_URL','TRAP_HOUSE_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SECRET_KEY','TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY','TRAP_HOUSE_SUPABASE_SECRET_KEY','ARCHIVE_OWNER_USER_IDS'])delete process.env[name];
  for(const action of ['owner','manage','draft&id=TEST-001','upload','save'])assert.equal((await request('action='+action,{method:['upload','save'].includes(action)?'POST':'GET',body:{}})).status,401);
  assert.equal((await request('action=owner',{token:'session'})).status,503);
  assert.equal((await request('action=list',{origin:'https://evil.example'})).status,403);
  process.env.SUPABASE_URL='https://archive-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-server-key';process.env.ARCHIVE_OWNER_USER_IDS='owner-uuid';
  let calls=[],row={id:'TEST-001',status:'draft',version:1,payload:{...sample[0],media:[{storagePath:'owner-uuid/TEST-001/page.png',mime:'image/png'}]}};
  global.fetch=async(url,options={})=>{calls.push(String(url));if(String(url).includes('/auth/v1/user'))return new Response(JSON.stringify({id:options.headers.Authorization==='Bearer owner'?'owner-uuid':'outsider',email_confirmed_at:'2026-10-04'}));if(String(url).includes('/rest/v1/archive_items'))return new Response(JSON.stringify(String(url).includes('status=eq.published')&&row.status==='draft'?[]:[row]));if(String(url).includes('/storage/v1/object/sign/'))return new Response(JSON.stringify({signedURL:'/object/sign/archive-originals/page?token=temporary'}));throw Error('Unexpected request');};
  for(const action of ['manage','draft&id=TEST-001','upload','save'])assert.equal((await request('action='+action,{token:'outsider',method:['upload','save'].includes(action)?'POST':'GET',body:{}})).status,403);
  calls=[];assert.equal((await request('action=media&id=TEST-001&index=0')).status,404);assert(!calls.some(c=>c.includes('/object/sign/')),'Anonymous draft never receives a signed media URL');
  assert.equal((await request('action=draft&id=TEST-001',{token:'owner'})).status,200);
  assert.equal((await request('action=media&id=TEST-001&index=0',{token:'owner'})).status,200);
  row.status='published';assert.equal((await request('action=media&id=TEST-001&index=0',{token:'outsider'})).status,200,'Published originals remain public even with an unrelated login');
  assert.equal((await request('action=upload',{token:'owner',method:'POST',body:{id:'TEST-001',mime:'text/html',size:10}})).status,400);
  assert.throws(()=>handler.validateItem({...sample[0],media:[{mime:'image/png',storagePath:'other-owner/TEST-001/page.png'}]},{id:'owner-uuid'}));
  global.fetch=savedFetch;
  console.log('Archive checks passed: genuine seed files, canonical threads, combined search/filter, safe links, owner-only writes/drafts, public media and private draft media. Database installation requires staging verification.');
})().catch(error=>{console.error(error);process.exitCode=1;});
