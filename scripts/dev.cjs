const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const quotation = require('../api/quotation');
const contact = require('../api/contact');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server = http.createServer(async (req,res)=>{
 const url = new URL(req.url,'http://localhost');
 if (url.pathname === '/api/quotation' || url.pathname === '/api/contact') {
  let body = ''; for await (const chunk of req) {body += chunk; if (Buffer.byteLength(body)>24576) {res.writeHead(413);res.end();return;}}
  req.body=body;
  res.status=code=>{res.statusCode=code;return res;};
  res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  try {await (url.pathname === '/api/contact' ? contact : quotation)(req,res);} catch {res.status(500).json({error:'Unable to process the request.'});}
  return;
 }
 let relative;
 try {relative=decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';} catch {res.writeHead(400);res.end();return;}
 // Explicit public allowlist matches the production build.
 if (!/^(?:[a-z0-9-]+\.(?:html|css|js)|assets\/[a-zA-Z0-9_./-]+)$/.test(relative) || relative.split('/').includes('..')) {res.writeHead(404);res.end('Not found');return;}
 const file=path.join(root,relative);
 fs.readFile(file,(error,data)=>{
  if(error){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});res.end(data);
 });
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}/automations.html`));
