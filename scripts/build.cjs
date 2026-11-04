// Publish only public site files. Server code, SQL and secrets stay outside dist.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const dist = path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
for (const file of fs.readdirSync(root)) {
 if (/\.(html|css|js)$/.test(file)) fs.copyFileSync(path.join(root,file),path.join(dist,file));
}
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
console.log('KaRama public website built in dist/. Vercel handles api/quotation.js separately.');
