'use strict';
const services = {
 digital: {category:'MAKE YOUR FIRST IMPRESSION COUNT',title:'Digital experiences that mean business.',text:'Turn your online presence into a useful business tool. Clear design, thoughtful development and an experience that feels effortless on every screen.',tags:['Business websites','E-commerce','UI / UX design'],cta:'Let’s talk digital',image:'assets/expertise-digital.webp'},
 cloud: {category:'BUILD A FOUNDATION FOR GROWTH',title:'Infrastructure that fits your next chapter.',text:'Make sense of your systems and plan a practical path to the cloud. Connect people, applications and infrastructure around the way your business works.',tags:['Cloud planning','Business networks','System integration'],cta:'Let’s talk infrastructure',image:'assets/expertise-cloud.webp'},
 security: {category:'MAKE CONFIDENCE PART OF THE PLAN',title:'A more considered approach to security.',text:'Understand where your risks are and what deserves attention first. Bring access, protection and continuity into the conversation from the start.',tags:['Security planning','Access management','Business continuity'],cta:'Let’s talk security',image:'assets/expertise-security.webp'},
 support: {category:'CLARITY FOR YOUR TECHNOLOGY DECISIONS',title:'A clearer view of what comes next.',text:'Work through technology challenges with a practical plan. Review your current setup, prioritise improvements and define the support your business needs.',tags:['IT planning','System reviews','Support planning'],cta:'Let’s talk IT',image:'assets/expertise-support.webp'},
 automation: {category:'GIVE YOUR TEAM TIME BACK',title:'Make the everyday work better.',text:'Replace disconnected processes with software that works around your team. Explore practical automation, useful integrations and tools shaped to your business.',tags:['Custom software','Workflow automation','Tool integration'],cta:'Let’s talk automation',image:'assets/expertise-automation.webp'}
};

const tabs = [...document.querySelectorAll('[data-service]')];
let selected = 'digital';
function selectService(key, focus = false) {
 const data = services[key]; const panel = document.querySelector('#service-panel');
 if (!data || !panel) return; selected = key;
 tabs.forEach(tab => { const active = tab.dataset.service === key; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; if (active && focus) tab.focus(); });
 panel.setAttribute('aria-labelledby', `tab-${key}`);
 document.querySelector('#service-category').textContent = data.category;
 document.querySelector('#service-title').textContent = data.title;
 document.querySelector('#service-text').textContent = data.text;
 document.querySelector('#service-tags').replaceChildren(...data.tags.map(text => {const el = document.createElement('span'); el.textContent = text; return el;}));
 const cta = document.querySelector('#service-cta'); cta.replaceChildren(document.createTextNode(data.cta + ' ')); const arrow = document.createElement('span'); arrow.textContent = '↗'; cta.append(arrow);
 cta.href = `contact.html?service=${encodeURIComponent(key)}`;
 document.querySelector('#service-image').src = data.image;
}
tabs.forEach((tab, index) => {
 tab.addEventListener('click', () => {selectService(tab.dataset.service); history.replaceState(null, '', '#' + tab.dataset.service);});
 tab.addEventListener('keydown', event => {let next; if(event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length; if(event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length; if(event.key === 'Home') next = 0; if(event.key === 'End') next = tabs.length - 1; if(next !== undefined) {event.preventDefault(); selectService(tabs[next].dataset.service, true);} });
});
Object.values(services).forEach(data => {const img = new Image(); img.src = data.image;});
function selectFromHash(){if(tabs.length)selectService(location.hash.slice(1) || 'digital');}
selectFromHash(); window.addEventListener('hashchange', selectFromHash);
const menuButton = document.querySelector('.menu-toggle'); const nav = document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');}
menuButton.addEventListener('click', () => {const open = nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
document.querySelector('#privacy-open').addEventListener('click',()=>document.querySelector('#privacy-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog => {dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
const form = document.querySelector('#project-form');
if(form){
 const service = new URLSearchParams(location.search).get('service'); const index = Object.keys(services).indexOf(service);
 if(index >= 0) document.querySelector('#project-service').selectedIndex = index;
 form.addEventListener('submit',event=>{event.preventDefault(); const data=new FormData(event.currentTarget); const subject=`Project enquiry from ${data.get('name')}`; const body=`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nCompany: ${data.get('company')||'Not provided'}\nService: ${data.get('service')}\n\nProject idea\n------------\n${data.get('message')}\n`; location.href=`mailto:info@karama.tech?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; document.querySelector('.form-result').textContent='Your email app should now open with your enquiry. If it doesn’t, email us at info@karama.tech.';});
}
document.querySelector('#year').textContent = new Date().getFullYear();

// Reveal on upward scrolling; hide on downward scrolling after the page intro.
const floatingHeader = document.querySelector('.site-header');
if (floatingHeader) {
 let anchorY = Math.max(0, window.scrollY);
 let scrollScheduled = false;
 function showHeader() {
  floatingHeader.classList.remove('is-hidden');
  floatingHeader.inert = false;
 }
 function updateHeader() {
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const y = Math.min(maxY, Math.max(0, window.scrollY));
  const delta = y - anchorY;
  const keyboardFocus = floatingHeader.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
  if (y <= 100 || nav.classList.contains('open') || keyboardFocus) {
   showHeader(); anchorY = y;
  } else if (Math.abs(delta) >= 8) {
   const hide = delta > 0;
   floatingHeader.classList.toggle('is-hidden', hide);
   floatingHeader.inert = hide;
   anchorY = y;
  }
  scrollScheduled = false;
 }
 window.addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateHeader); }
 }, {passive:true});
 document.addEventListener('keydown', event => {
  if (event.key === 'Tab') {showHeader(); anchorY = Math.max(0, window.scrollY);}
 });
 window.addEventListener('pageshow', () => {showHeader(); anchorY = Math.max(0, window.scrollY);});
}
