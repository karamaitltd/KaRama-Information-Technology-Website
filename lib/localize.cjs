'use strict';
const {ar:dictionary,productNames}=require('../i18n-data.js');
const products=require('../products.json');
const translations={...dictionary};
products.forEach((product,index)=>{translations[product.name]=productNames[index];});
function translate(value) {
 if (Object.hasOwn(translations,value)) return translations[value];
 let match;
 if ((match=value.match(/^Showing all (\d+) products$/))) return `عرض جميع المنتجات (${match[1]})`;
 if ((match=value.match(/^Add (.+) to cart$/))) return `أضف ${translate(match[1])} إلى السلة`;
 if ((match=value.match(/^View (.+) image \(opens in new tab\)$/))) return `عرض صورة ${translate(match[1])} (تفتح في علامة تبويب جديدة)`;
 return value;
}
const decode=value=>value.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi,entity=>{
 const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':'\u00a0'};
 if(named[entity]) return named[entity];
 return String.fromCodePoint(entity.startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10));
});
const encode=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function arabicHTML(html) {
 // Source HTML is controlled here. Preserve scripts, styles, comments and the language link verbatim.
 const tokens=html.match(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<a\b[^>]*\bdata-no-translate\b[^>]*>[\s\S]*?<\/a>|<[^>]+>|[^<]+/gi)||[];
 return tokens.map(token=>{
  if (/^<(?:script|style)\b|^<!--|^<a\b[^>]*data-no-translate/i.test(token)) return token;
  if (token.startsWith('<')) return token.replace(/\b(aria-label|placeholder|alt|title)="([^"]*)"/g,(_,attribute,value)=>`${attribute}="${encode(translate(decode(value)))}"`);
  const decoded=decode(token), trimmed=decoded.trim(), translated=translate(trimmed);
  return translated===trimmed?token:encode(decoded.replace(trimmed,translated));
 }).join('');
}
module.exports={translate,arabicHTML};
