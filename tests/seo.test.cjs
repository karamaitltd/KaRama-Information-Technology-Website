'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {pages,urlFor}=require('../lib/seo.cjs');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
execFileSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'pipe'});
const read=(file)=>fs.readFileSync(path.join(dist,file),'utf8');
test('all twelve pages have unique localized search metadata and reciprocal language links',()=>{
 const titles=new Set();
 for(const file of Object.keys(pages))for(const locale of ['en','ar-SA']){
  const html=read((locale==='ar-SA'?'ar/':'')+file),canonical=urlFor(file,locale);
  assert.ok(html.includes(`lang="${locale}" dir="${locale==='ar-SA'?'rtl':'ltr'}"`));
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1]; assert.ok(title); assert.ok(!titles.has(title));titles.add(title);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
  for(const other of ['en','ar-SA'])assert.ok(html.includes(`hreflang="${other}" href="${urlFor(file,other)}"`));
  assert.ok(html.includes('hreflang="x-default"'));
  assert.ok(html.indexOf('<base ')<html.indexOf('<link rel="stylesheet"'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  const data=JSON.parse(html.match(/id="seo-structured-data">(.*?)<\/script>/s)[1]);
  const page=data['@graph'].find(node=>node['@id']===canonical+'#webpage');
  assert.equal(page.inLanguage,locale);assert.equal(page.url,canonical);
  assert.ok(html.includes(`property="og:url" content="${canonical}"`));
  assert.ok(!html.includes('name="keywords"'));
 }
});
test('Arabic content, product names and locale navigation are present without JavaScript',()=>{
 const html=read('ar/automations.html');
 assert.ok(html.includes('كاميرات مراقبة وأقفال ذكية'));
 assert.ok(html.includes('كاميرا مراقبة قُبّية Hikvision'));
 assert.ok(html.includes('href="ar/contact.html"'));
 assert.ok(html.includes('hreflang="en" data-no-translate'));
 assert.ok(html.includes('<span>English</span>'));
 assert.ok(html.includes('href="ar/automations.html#catalogue"'));
 assert.ok(html.includes('data-name="Hikvision dome camera"'));
 assert.equal((html.match(/class="product-card"/g)||[]).length,51);
 const graph=JSON.parse(html.match(/id="seo-structured-data">(.*?)<\/script>/s)[1])['@graph'];
 const list=graph.find(node=>node['@type']==='ItemList');assert.equal(list.itemListElement.length,51);
 for(const item of list.itemListElement)assert.ok(html.includes(`id="${item.url.split('#')[1]}"`));
 assert.ok(!graph.some(node=>node['@type']==='Product'||node.offers||node.aggregateRating));
});
test('sitemap contains twelve canonical URLs and public HTML assets resolve',()=>{
 const sitemap=read('sitemap.xml');assert.equal((sitemap.match(/<loc>/g)||[]).length,12);
 for(const file of Object.keys(pages))for(const locale of ['en','ar-SA'])assert.ok(sitemap.includes('<loc>'+urlFor(file,locale)+'</loc>'));
 for(const file of Object.keys(pages))for(const locale of ['en','ar-SA']){
  const html=read((locale==='ar-SA'?'ar/':'')+file);
  for(const match of html.matchAll(/\b(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
   let target=match[1];if(/^[a-z]+:|^\/\//i.test(target)||target==='/')continue;
   if(target==='./')target='index.html';if(target==='ar/')target='ar/index.html';
   assert.ok(fs.existsSync(path.join(dist,target)),`${file} (${locale}) references missing ${target}`);
  }
 }
 assert.ok(read('robots.txt').includes('Sitemap: https://karama.tech/sitemap.xml'));
 for(const file of ['.env','.env.example','products.json','lib/enquiries.js','supabase/schema.sql'])assert.ok(!fs.existsSync(path.join(dist,file)));
});
test('the secondary GitHub Pages copy retains email-app forms and is not indexed',()=>{
 try {
  execFileSync(process.execPath,['scripts/build.cjs','--github-pages'],{cwd:root,stdio:'pipe'});
  for(const file of Object.keys(pages))for(const locale of ['en','ar-SA']){
   const html=read((locale==='ar-SA'?'ar/':'')+file);
   assert.ok(html.includes('data-submission-mode="email"'));
   assert.ok(html.includes('name="robots" content="noindex,follow"'));
   assert.ok(html.includes('<base href="/KaRama-Information-Technology-Website/">'));
   if(file==='automations.html')assert.ok(html.includes('data-quotation-mode="email"'));
  }
 } finally {execFileSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'pipe'});}
});
