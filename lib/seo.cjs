'use strict';
const ORIGIN = 'https://karama.tech';
const pages = {
 'index.html': {
  en: ['KaRama Intelligence Technology', 'KaRama IT in Riyadh provides websites, cloud, cybersecurity and IT consulting. Explore CCTV cameras, smart locks and networking, and request a quotation.'],
  ar: ['كرامة لتقنية المعلومات', 'كرامة لتقنية المعلومات في الرياض: تطوير المواقع والحوسبة السحابية والأمن السيبراني والاستشارات التقنية. استعرض كاميرات المراقبة والأقفال الذكية واطلب عرض سعر.'],
  label: ['Home', 'الرئيسية']
 },
 'expertise.html': {
  en: ['Web, Cloud & Cybersecurity Services in Riyadh | KaRama IT', 'Explore website development, cloud infrastructure, cybersecurity, software automation and IT consulting from KaRama IT in Riyadh, Saudi Arabia.'],
  ar: ['تطوير المواقع والحوسبة السحابية والأمن السيبراني | كرامة', 'خدمات كرامة لتقنية المعلومات في الرياض: تطوير المواقع والبنية السحابية والأمن السيبراني وأتمتة البرمجيات والاستشارات التقنية. تواصل لمناقشة احتياجات منشأتك.'],
  label: ['Expertise', 'خبراتنا']
 },
 'possibilities.html': {
  en: ['Digital Transformation & Business IT Solutions | KaRama IT', 'Explore digital experiences, connected workflows and stronger IT foundations. Discuss practical business technology solutions with KaRama IT in Riyadh.'],
  ar: ['التحول الرقمي والحلول التقنية للأعمال | كرامة لتقنية المعلومات', 'اكتشف فرص التحول الرقمي وتكامل إجراءات العمل وتطوير البنية التقنية. ناقش حلولاً عملية تناسب أعمالك مع كرامة لتقنية المعلومات في الرياض.'],
  label: ['Possibilities', 'الحلول']
 },
 'automations.html': {
  en: ['CCTV Cameras, Smart Locks & Networking in Riyadh | KaRama IT', 'Browse Hikvision and EZVIZ cameras, smart locks, video intercoms and networking products. Request a KaRama IT quotation for products only or with installation.'],
  ar: ['كاميرات مراقبة وأقفال ذكية وشبكات في الرياض | كرامة', 'استعرض كاميرات هيكفيجن وEZVIZ والأقفال الذكية والإنتركم ومنتجات الشبكات. اطلب عرض سعر من كرامة للمنتجات فقط أو للمنتجات مع التركيب.'],
  label: ['Automations', 'الأتمتة'], type: 'CollectionPage'
 },
 'approach.html': {
  en: ['Our IT Project Approach & Consulting Process | KaRama IT', 'See how KaRama IT plans technology projects: understand your needs, define the scope, create with purpose and agree clear next steps for your business.'],
  ar: ['منهجيتنا في تنفيذ المشاريع والاستشارات التقنية | كرامة', 'تعرّف على منهجية كرامة في المشاريع التقنية: فهم الاحتياجات وتحديد نطاق العمل وتصميم الحلول والاتفاق على خطوات واضحة تناسب أعمالك.'],
  label: ['Our approach', 'منهجيتنا'], type: 'AboutPage'
 },
 'contact.html': {
  en: ['Contact KaRama IT in Riyadh | IT Services & Quotations', 'Contact KaRama IT in Riyadh, Saudi Arabia, or Halifax, Canada. Discuss your IT project, request a quotation or email info@karama.tech.'],
  ar: ['تواصل مع كرامة في الرياض | خدمات تقنية المعلومات وعروض الأسعار', 'تواصل مع كرامة لتقنية المعلومات في الرياض بالمملكة العربية السعودية أو هاليفاكس بكندا. ناقش مشروعك واطلب عرض سعر عبر info@karama.tech.'],
  label: ['Contact', 'تواصل معنا'], type: 'ContactPage'
 }
};
const services = [
 ['Website development', 'تطوير المواقع'], ['Cloud infrastructure', 'البنية السحابية'],
 ['Cybersecurity', 'الأمن السيبراني'], ['Software automation', 'أتمتة البرمجيات'],
 ['IT consulting', 'الاستشارات التقنية']
];
const urlFor = (file, locale = 'en') => ORIGIN + (locale === 'ar-SA' ? '/ar/' : '/') + (file === 'index.html' ? '' : file);
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
function metadata(file, locale) {
 const page = pages[file], ar = locale === 'ar-SA', language = ar ? 'ar-SA' : 'en';
 const [title, description] = ar ? page.ar : page.en;
 const url = urlFor(file, language);
 const organization = {
  '@type': 'Organization', '@id': ORIGIN + '/#organization', name: 'KaRama IT', alternateName: 'كرامة لتقنية المعلومات',
  url: ORIGIN + '/', logo: { '@type': 'ImageObject', url: ORIGIN + '/assets/karama-logo-horizontal.png' },
  email: 'info@karama.tech', telephone: '+966551415599',
  address: [
   {'@type':'PostalAddress',streetAddress:'Al Imam Saud Ibn Abdul Aziz Branch Rd, Al Muruj',addressLocality:'Riyadh',postalCode:'12333',addressCountry:'SA'},
   {'@type':'PostalAddress',streetAddress:'1505 Barrington St',addressLocality:'Halifax',addressRegion:'NS',postalCode:'B3J 3Y6',addressCountry:'CA'}
  ],
  contactPoint: [
   {'@type':'ContactPoint',telephone:'+966551415599',email:'info@karama.tech',contactType:'customer service',availableLanguage:['en','ar-SA']},
   {'@type':'ContactPoint',telephone:'+19022005504',contactType:'customer service',availableLanguage:['en']}
  ],
  sameAs: ['https://www.linkedin.com/company/karama-ltd-co/','https://www.instagram.com/karamaltd/','https://x.com/KaRamaLTD','https://www.tiktok.com/@karamaitltd','https://www.facebook.com/KaRamaITLTD/']
 };
 const graph = [organization,
  {'@type':'WebSite','@id':ORIGIN+'/#website',url:ORIGIN+'/',name:'KaRama IT',publisher:{'@id':organization['@id']},inLanguage:['en','ar-SA']},
  {'@type':page.type||'WebPage','@id':url+'#webpage',url,name:title,description,inLanguage:language,isPartOf:{'@id':ORIGIN+'/#website'},about:{'@id':organization['@id']}}
 ];
 if (file !== 'index.html') {
  graph[2].breadcrumb = {'@id':url+'#breadcrumb'};
  graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[
   {'@type':'ListItem',position:1,name:ar?'الرئيسية':'Home',item:urlFor('index.html',language)},
   {'@type':'ListItem',position:2,name:page.label[ar?1:0],item:url}
  ]});
 }
 if (file === 'expertise.html') for (const [enName, arName] of services) graph.push({
  '@type':'Service',name:ar?arName:enName,serviceType:ar?arName:enName,url,
  provider:{'@id':organization['@id']},areaServed:{'@type':'Country',name:'Saudi Arabia'}
 });
 if (file === 'automations.html') {
  const products = require('../products.json');
  const translations = require('../i18n-data.js');
  const itemList = {'@type':'ItemList','@id':url+'#catalogue',numberOfItems:products.length,itemListElement:products.map((product,index)=>({
   '@type':'ListItem',position:index+1,name:ar?translations.productNames[index]:product.name,
   url:url+'#'+product.id.toLowerCase(),image:ORIGIN+'/'+product.image
  }))};
  graph[2].mainEntity = {'@id':itemList['@id']}; graph.push(itemList);
 }
 return {title,description,url,locale:ar?'ar_SA':'en_US',language,structuredData:{'@context':'https://schema.org','@graph':graph}};
}
function applySEO(html, file, locale = 'en', options = {}) {
 const data = metadata(file, locale), ar = locale === 'ar-SA';
 html = html.replace(/\n?<!-- SEO START -->[\s\S]*?<!-- SEO END -->\n?/g,'').replace(/<base\b[^>]*>/g,'');
 // A base URL must not send in-page catalogue/skip links to the home page.
 html = html.replace(/href="#([^"]*)"/g,(_,hash)=>'href="'+file+'#'+hash+'"');
 html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>'+escape(data.title)+'</title>');
 html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="'+escape(data.description)+'">');
 html = html.replace(/<html\b[^>]*>/, match=>match.replace(/\slang="[^"]*"|\sdir="[^"]*"/g,'').replace('<html','<html lang="'+data.language+'" dir="'+(ar?'rtl':'ltr')+'"'));
 const robots = options.githubPages ? 'noindex,follow' : 'index,follow,max-image-preview:large';
 const enUrl=urlFor(file), arUrl=urlFor(file,'ar-SA');
 const block = `\n<!-- SEO START -->
<meta name="robots" content="${robots}">
<link rel="canonical" href="${data.url}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="ar-SA" href="${arUrl}">
<link rel="alternate" hreflang="x-default" href="${enUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KaRama IT">
<meta property="og:title" content="${escape(data.title)}">
<meta property="og:description" content="${escape(data.description)}">
<meta property="og:url" content="${data.url}">
<meta property="og:locale" content="${data.locale}">
<meta property="og:locale:alternate" content="${ar?'en_US':'ar_SA'}">
<meta property="og:image" content="${ORIGIN}/assets/karama-logo-horizontal.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="2135">
<meta property="og:image:height" content="736">
<meta property="og:image:alt" content="KaRama IT — كرامة لتقنية المعلومات">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(data.title)}">
<meta name="twitter:description" content="${escape(data.description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/karama-logo-horizontal.png">
<meta name="twitter:image:alt" content="KaRama IT — كرامة لتقنية المعلومات">
<script type="application/ld+json" id="seo-structured-data">${json(data.structuredData)}</script>
<script type="application/json" id="seo-locales">${json({en:metadata(file,'en'),'ar-SA':metadata(file,'ar-SA')})}</script>
<!-- SEO END -->\n`;
 // The base must precede styles/scripts: browsers resolve those as they parse the head.
 return html.replace('<head>','<head><base href="'+escape(options.basePath||'/')+'">').replace('</head>',block+'</head>');
}
function sitemap() {
 const entries = Object.keys(pages).flatMap(file=>['en','ar-SA'].map(locale=>`  <url><loc>${urlFor(file,locale)}</loc><xhtml:link rel="alternate" hreflang="en" href="${urlFor(file)}"/><xhtml:link rel="alternate" hreflang="ar-SA" href="${urlFor(file,'ar-SA')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(file)}"/></url>`));
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+entries.join('\n')+'\n</urlset>\n';
}
module.exports = {ORIGIN,pages,urlFor,metadata,applySEO,sitemap,escape};
