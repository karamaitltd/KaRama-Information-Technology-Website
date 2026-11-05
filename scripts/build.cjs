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
for (const file of ['robots.txt','sitemap.xml']) fs.copyFileSync(path.join(root,file),path.join(dist,file));
if (process.argv.includes('--github-pages')) {
 const privacy = 'This website does not use analytics, tracking cookies or external fonts. Your quotation cart is saved on this device; contact details are not saved in your browser. Contact and quotation forms open your own email app with an enquiry addressed to info@karama.tech. Review and send the email yourself to complete your enquiry. This GitHub Pages website does not send your form details to a database or email service. Contact info@karama.tech about your information.';
 for (const file of fs.readdirSync(dist).filter(name=>name.endsWith('.html'))) {
  const target = path.join(dist,file);
  let content = fs.readFileSync(target,'utf8').replace(/(<dialog id="privacy-dialog">[\s\S]*?<h2>[\s\S]*?<\/h2>)<p>[\s\S]*?<\/p>/,'$1<p>'+privacy+'</p>');
  content=content.replace(/<html\b/,'<html data-submission-mode="email"');
  content=content.replace('Your enquiry will be sent directly to info@karama.tech. We’ll email you a confirmation and get in touch shortly.','Your email app will open with your enquiry addressed to info@karama.tech. Review and send the email to complete your enquiry.');
  fs.writeFileSync(target,content);
 }
 const page = path.join(dist,'automations.html');
 let html = fs.readFileSync(page,'utf8');
 html = html.replace(/<html\b/,'<html data-quotation-mode="email"');
 html = html.replace('Send quotation request <span>↗</span>','Prepare quotation email <span>↗</span>');
 html = html.replace('Your request goes directly to <a href="mailto:info@karama.tech">info@karama.tech</a>. No email app needed.','Your email app will open with your quotation request addressed to <a href="mailto:info@karama.tech">info@karama.tech</a>. Review and send the email to complete your enquiry.');
 fs.writeFileSync(page,html);
 fs.writeFileSync(path.join(dist,'.nojekyll'),'');
 console.log('GitHub Pages website built in dist/. Quotation requests use the visitor’s email app.');
} else console.log('KaRama public website built in dist/. Vercel handles api/quotation.js separately.');

// Both languages are delivered as real HTML, including metadata and product cards.
// GitHub Pages stays a secondary static copy; search engines should index karama.tech.
const {pages,applySEO}=require('../lib/seo.cjs');
const {arabicHTML}=require('../lib/localize.cjs');
const githubPages=process.argv.includes('--github-pages');
const basePath=githubPages?'/KaRama-Information-Technology-Website/':'/';
fs.mkdirSync(path.join(dist,'ar'),{recursive:true});
for(const file of Object.keys(pages)) {
 const source=fs.readFileSync(path.join(dist,file),'utf8');
 const en=applySEO(source,file,'en',{basePath,githubPages});
 fs.writeFileSync(path.join(dist,file),en);
 let ar=applySEO(arabicHTML(source),file,'ar-SA',{basePath,githubPages});
 ar=ar.replace(/href="((?:index|expertise|possibilities|automations|approach|contact)\.html)([?#][^"]*)?"/g,(_,target,suffix='')=>'href="ar/'+(target==='index.html'?'':target)+suffix+'"');
 ar=ar.replace(/<a class="language-toggle"[\s\S]*?<\/a>/,match=>match.replace(/href="[^"]*"/,'href="'+(file==='index.html'?'./':file)+'"').replace('lang="ar-SA"','lang="en"').replace('hreflang="ar-SA"','hreflang="en"').replace(/aria-label="[^"]*"/,'aria-label="Switch to English"').replace('<span>العربية</span>','<span>English</span>'));
 fs.writeFileSync(path.join(dist,'ar',file),ar);
}
console.log('SEO: twelve localized HTML pages, canonical URLs, language alternates, structured data, robots.txt and sitemap.xml.');
