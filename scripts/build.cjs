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
if (process.argv.includes('--github-pages')) {
 const privacy = 'This website does not use analytics, tracking cookies or external fonts. Your quotation cart is saved on this device; contact details are not saved in your browser. Contact and quotation forms open your own email app with an enquiry addressed to info@karama.tech. Review and send the email yourself to complete your enquiry. This GitHub Pages website does not send your form details to a database or email service. Contact info@karama.tech about your information.';
 for (const file of fs.readdirSync(dist).filter(name=>name.endsWith('.html'))) {
  const target = path.join(dist,file);
  let content = fs.readFileSync(target,'utf8').replace(/(<dialog id="privacy-dialog">[\s\S]*?<h2>[\s\S]*?<\/h2>)<p>[\s\S]*?<\/p>/,'$1<p>'+privacy+'</p>');
  content=content.replace('<html lang="en">','<html lang="en" data-submission-mode="email">');
  content=content.replace('Your enquiry will be sent directly to info@karama.tech. We’ll email you a confirmation and get in touch shortly.','Your email app will open with your enquiry addressed to info@karama.tech. Review and send the email to complete your enquiry.');
  fs.writeFileSync(target,content);
 }
 const page = path.join(dist,'automations.html');
 let html = fs.readFileSync(page,'utf8');
 html = html.replace('<html lang="en" data-submission-mode="email">','<html lang="en" data-submission-mode="email" data-quotation-mode="email">');
 html = html.replace('Send quotation request <span>↗</span>','Prepare quotation email <span>↗</span>');
 html = html.replace('Your request goes directly to <a href="mailto:info@karama.tech">info@karama.tech</a>. No email app needed.','Your email app will open with your quotation request addressed to <a href="mailto:info@karama.tech">info@karama.tech</a>. Review and send the email to complete your enquiry.');
 fs.writeFileSync(page,html);
 fs.writeFileSync(path.join(dist,'.nojekyll'),'');
 console.log('GitHub Pages website built in dist/. Quotation requests use the visitor’s email app.');
} else console.log('KaRama public website built in dist/. Vercel handles api/quotation.js separately.');
