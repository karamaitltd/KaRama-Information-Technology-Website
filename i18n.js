'use strict';
// Saudi Arabic (ar-SA). Product references and brand names remain unchanged.
(() => {
 const {ar:sharedArabic,productNames} = window.KaRamaTranslations;
 const ar = {...sharedArabic};
 const cards = [...document.querySelectorAll('.product-card')];
 cards.forEach(card => {ar[card.dataset.name || card.querySelector('h3').textContent.trim()] = productNames[Number(card.dataset.product.slice(4))-1];});
 const reverse = new Map(Object.entries(ar).map(([en,translation])=>[translation,en]));
 const textMemory = new WeakMap();
 const attributeMemory = new WeakMap();
 let locale = 'en';
 const localeFromQuery = new URLSearchParams(location.search).get('lang');
 locale = localeFromQuery || document.documentElement.lang || 'en';
 locale = locale === 'ar' || locale === 'ar-SA' ? 'ar-SA' : 'en';
 function english(text) {
  if(reverse.has(text))return reverse.get(text);
  let match;
  if((match=text.match(/^أضف (.+) إلى السلة$/)))return `Add ${english(match[1])} to cart`;
  if((match=text.match(/^عرض صورة (.+) \(تفتح في علامة تبويب جديدة\)$/)))return `View ${english(match[1])} image (opens in new tab)`;
  if((match=text.match(/^عرض جميع المنتجات \((\d+)\)$/)))return `Showing all ${match[1]} products`;
  return text;
 }
 const number = value => new Intl.NumberFormat(locale,{useGrouping:false}).format(value);
 const digits = value => String(value).replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c <= '٩' ? 1632 : 1776)));
 function t(value) {
  if (locale !== 'ar-SA' || typeof value !== 'string') return value;
  if (Object.hasOwn(ar,value)) return ar[value];
  let match;
  if ((match=value.match(/^Showing all (\d+) products$/))) return `عرض جميع المنتجات (${number(match[1])})`;
  if ((match=value.match(/^Thank you\. Your enquiry has been received and a confirmation email has been sent to your email address\. Our team will get in touch shortly\. Reference: (.+)\.$/))) return `شكراً لك. استلمنا استفسارك وأرسلنا رسالة تأكيد إلى بريدك الإلكتروني. سيتواصل معك فريقنا قريباً. رقم الطلب: ${match[1]}.`;
  if ((match=value.match(/^Thank you\. We’ve received your quotation request and sent a confirmation with your product selection to your email address\. Our team will get in touch shortly\. Reference: (.+)\.$/))) return `شكراً لك. استلمنا طلب عرض السعر وأرسلنا رسالة تأكيد تتضمن المنتجات المختارة إلى بريدك الإلكتروني. سيتواصل معك فريقنا قريباً. رقم الطلب: ${match[1]}.`;
  if ((match=value.match(/^Your request is saved, but we couldn’t confirm all notification emails\. Please retry with the same details, or contact info@karama.tech with reference (.+)\.$/))) return `تم حفظ طلبك، لكن تعذر تأكيد إرسال جميع رسائل البريد. حاول مجدداً بنفس البيانات أو تواصل عبر info@karama.tech مع ذكر رقم الطلب: ${match[1]}.`;
  if ((match=value.match(/^Showing (\d+) of (\d+) products$/))) return `عرض ${number(match[1])} من أصل ${number(match[2])} منتج`;
  if ((match=value.match(/^Add more \((\d+)\)$/))) return `أضف المزيد (${number(match[1])})`;
  if ((match=value.match(/^(\d+) products? · (\d+) items?$/))) return `المنتجات: ${number(match[1])} · إجمالي الكمية: ${number(match[2])}`;
  if ((match=value.match(/^View quotation cart, (\d+) items$/))) return `عرض سلة طلب عرض السعر، الكمية ${number(match[1])}`;
  if ((match=value.match(/^Add (.+) to cart$/))) return `أضف ${t(match[1])} إلى السلة`;
  if ((match=value.match(/^Remove (.+) from cart$/))) return `حذف ${t(match[1])} من السلة`;
  if ((match=value.match(/^Increase quantity of (.+)$/))) return `زيادة كمية ${t(match[1])}`;
  if ((match=value.match(/^Decrease quantity of (.+)$/))) return `تقليل كمية ${t(match[1])}`;
  if ((match=value.match(/^Quantity of (.+)$/))) return `كمية ${t(match[1])}`;
  if ((match=value.match(/^View (.+) image \(opens in new tab\)$/))) return `عرض صورة ${t(match[1])} (تفتح في علامة تبويب جديدة)`;
  if ((match=value.match(/^KaRama IT on (.+) \(opens in a new tab\)$/))) return `كرامة لتقنية المعلومات على ${match[1]} (يفتح في علامة تبويب جديدة)`;
  if ((match=value.match(/^(.+) added to cart\. Choose View cart to request a quotation\.$/))) return `تمت إضافة ${t(match[1])} إلى السلة. اختر عرض السلة لطلب عرض سعر.`;
  if ((match=value.match(/^Cart updated\. (\d+) products selected\.$/))) return `تم تحديث السلة. عدد المنتجات المختارة: ${number(match[1])}.`;
  if ((match=value.match(/^Thank you\. Your quotation request has been submitted to KaRama\. Reference: (.+)\. We’ll contact you using the details you provided\.$/))) return `شكراً لك. تم إرسال طلب عرض السعر إلى كرامة. رقم الطلب: ${match[1]}. سنتواصل معك عبر البيانات التي أدخلتها.`;
  if ((match=value.match(/^Your request is saved, but we couldn’t confirm the email\. Please retry with the same details, or contact info@karama.tech with reference (.+)\.$/))) return `تم حفظ طلبك، لكن تعذر تأكيد إرسال البريد. حاول مجدداً بنفس البيانات أو تواصل عبر info@karama.tech مع ذكر رقم الطلب: ${match[1]}.`;
  if ((match=value.match(/^Your request was saved earlier\. Please contact info@karama.tech with reference (.+) so we can check it\.$/))) return `سبق حفظ طلبك. يرجى التواصل عبر info@karama.tech مع ذكر رقم الطلب ${match[1]} للتحقق منه.`;
  return value;
 }
 const toggle = document.querySelector('.language-toggle') || document.createElement('a');
 toggle.className = 'language-toggle'; toggle.dataset.noTranslate = '';
 const siteBase = new URL(document.querySelector('base')?.getAttribute('href') || './',location.href);
 const pageFile = location.pathname.split('/').pop() || 'index.html';
 const pagePath = next => new URL((next === 'ar-SA' ? 'ar/' : '') + (pageFile === 'index.html' ? '' : pageFile),siteBase);
 const seo = JSON.parse(document.querySelector('#seo-locales')?.textContent || '{}');
 toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg><span></span>';
 const contactButton = document.querySelector('.site-header .nav-cta');
 const headerActions = document.createElement('div');
 headerActions.className = 'header-actions';
 contactButton.before(headerActions);
 headerActions.append(contactButton,toggle);
 let observer;
 function update() {
  observer?.disconnect();
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar-SA' ? 'rtl' : 'ltr';
  toggle.querySelector('span').textContent = locale === 'ar-SA' ? 'English' : 'العربية';
  toggle.lang = locale === 'ar-SA' ? 'en' : 'ar-SA';
  toggle.hreflang = toggle.lang;
  toggle.href = pagePath(toggle.lang).pathname + location.hash;
  toggle.setAttribute('aria-label',locale === 'ar-SA' ? 'Switch to English' : 'التبديل إلى العربية (السعودية)');
  const walker = document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
   const node = walker.currentNode;
   if (node.parentElement.closest('script,style,svg,[data-no-translate],.product-code,.cart-count')) continue;
   const current = node.nodeValue;
   const previous = textMemory.get(node);
   const en = node.parentElement === contactButton && current.trim() ? 'Let’s talk' : previous && previous.rendered === current ? previous.en : english(current.trim());
   const rendered = current.replace(current.trim(),locale === 'ar-SA' ? t(en) : en);
   if (current !== rendered) node.nodeValue = rendered;
   textMemory.set(node,{en,rendered});
  }
  for (const node of document.querySelectorAll('[aria-label],[placeholder],[alt],[title],meta[name="description"]')) {
   if (node.closest('[data-no-translate]')) continue;
   const memory = attributeMemory.get(node) || {};
   for (const attribute of ['aria-label','placeholder','alt','title','content']) {
    if (!node.hasAttribute(attribute) || (attribute === 'content' && node.tagName !== 'META')) continue;
    const current = node.getAttribute(attribute);
    const previous = memory[attribute];
    const en = previous && previous.rendered === current ? previous.en : english(current);
    const rendered = locale === 'ar-SA' ? t(en) : en;
    if (current !== rendered) node.setAttribute(attribute,rendered);
    memory[attribute] = {en,rendered};
   }
   attributeMemory.set(node,memory);
  }
  for (const link of document.querySelectorAll('a[href]')) {
   if (link === toggle) continue;
   const raw = link.getAttribute('href');
   if (!raw || raw.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(raw)) continue;
   const url = new URL(raw,document.baseURI);
   const file = url.pathname.split('/').pop() || 'index.html';
   if (!/^(?:index|expertise|possibilities|automations|approach|contact)\.html$/.test(file)) continue;
   const next = new URL((locale === 'ar-SA' ? 'ar/' : '')+(file === 'index.html' ? '' : file),siteBase);
   next.search = url.search; next.searchParams.delete('lang'); next.hash = url.hash;
   if (raw !== next.pathname+next.search+next.hash) link.setAttribute('href',next.pathname+next.search+next.hash);
  }
  const pageSEO = seo[locale];
  if (pageSEO) {
   if (document.title !== pageSEO.title) document.title = pageSEO.title;
   const setContent = (selector,value) => {const node=document.querySelector(selector);if(node.content!==value)node.content=value;};
   setContent('meta[name="description"]',pageSEO.description);
   document.querySelector('link[rel="canonical"]').href = pageSEO.url;
   for (const [property,value] of Object.entries({'og:title':pageSEO.title,'og:description':pageSEO.description,'og:url':pageSEO.url,'og:locale':pageSEO.locale,'og:locale:alternate':locale === 'ar-SA' ? 'en_US' : 'ar_SA'})) setContent('meta[property="'+property+'"]',value);
   setContent('meta[name="twitter:title"]',pageSEO.title);
   setContent('meta[name="twitter:description"]',pageSEO.description);
   const structuredData = JSON.stringify(pageSEO.structuredData);
   const schemaNode = document.querySelector('#seo-structured-data');
   if (schemaNode.textContent !== structuredData) schemaNode.textContent = structuredData;
  }
  // Browser-native number controls, phone numbers and email addresses stay LTR.
  for (const node of document.querySelectorAll('input[type="tel"],input[type="email"],input[type="number"],.product-code,a[href^="tel:"],a[href^="mailto:"]')) node.dir = 'ltr';
  observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','alt','title','content']});
 }
 function setLocale(next) {
  locale = next === 'ar-SA' ? 'ar-SA' : 'en';
  try {localStorage.setItem('karama-language',locale);} catch {}
  const url = pagePath(locale); url.search = location.search; url.searchParams.delete('lang'); url.hash = location.hash;
  try {history.replaceState(null,'',url);} catch {}
  update();
  document.dispatchEvent(new CustomEvent('languagechange',{detail:{locale}}));
 }
 window.KaRamaI18n = {t,english,digits,number,get locale(){return locale;},setLocale,refresh:update};
 toggle.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();setLocale(locale === 'ar-SA' ? 'en' : 'ar-SA');});
 if (localeFromQuery) setLocale(locale); else update();
 observer = new MutationObserver(update);
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','alt','title','content']});
})();
