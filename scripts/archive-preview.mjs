import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const handler=createRequire(import.meta.url)('../api/archive/index.js');
// This preview never inherits production credentials or permits remote writes.
for(const key of ['SUPABASE_URL','TRAP_HOUSE_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SECRET_KEY','TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY','TRAP_HOUSE_SUPABASE_SECRET_KEY','ARCHIVE_OWNER_USER_IDS'])delete process.env[key];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain','.woff2':'font/woff2','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1:8880');
  if(url.pathname==='/api/archive'){
    if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>350000){res.writeHead(413);res.end();return;}}req.body=body;}
    return await handler(req,res);
  }
  const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return;}
  if(url.pathname.includes('/.git/')||url.pathname.includes('/.env')){res.writeHead(404);res.end();return;}
  const stat=await fs.stat(filename),target=stat.isDirectory()?path.join(filename,'index.html'):filename;
  const body=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
}catch{res.writeHead(404);res.end('Not found');}}).listen(8880,'127.0.0.1',()=>console.log('Archive preview: http://127.0.0.1:8880/archive/'));
