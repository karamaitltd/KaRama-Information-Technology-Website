'use strict';
(() => {
 const language = window.KaRamaI18n;
 const translate = text => language?.t(text) || text;
 const normalizeDigits = value => language?.digits(value) || value;
 const cards = [...document.querySelectorAll('.product-card')];
 const products = new Map(cards.map(card => [card.dataset.product, {
  id: card.dataset.product, name: language?.english(card.querySelector('h3').textContent) || card.querySelector('h3').textContent,
  image: card.querySelector('img').getAttribute('src'),
  category: card.dataset.category, brand: card.dataset.brand
 }]));
 const CART_KEY = 'karama-quotation-cart-v1';
 let cart = new Map();
 try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  if (Array.isArray(saved)) for (const item of saved) {
   if (products.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999) cart.set(item.id, item.quantity);
  }
 } catch { /* The cart remains usable when storage is unavailable. */ }
 let category = '';
 const search = document.querySelector('#product-search');
 const brand = document.querySelector('#brand-filter');
 const filterButtons = [...document.querySelectorAll('[data-filter]')];
 const dialog = document.querySelector('#cart-dialog');
 const form = document.querySelector('#quotation-form');
 const result = document.querySelector('#quotation-result');
 const submit = document.querySelector('#send-quotation');
 let submitting = false;
 let lastFingerprint = '';
 let requestId = '';
 function filterProducts() {
  const term = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  for (const card of cards) {
   const product = products.get(card.dataset.product);
   const inCategory = !category || (category === 'Hikvision cameras' ? product.category === 'Cameras' && product.brand === 'Hikvision' : product.category === category);
   const match = inCategory && (!brand.value || product.brand === brand.value) && `${product.name} ${translate(product.name)} ${product.category} ${translate(product.category)} ${product.id}`.toLocaleLowerCase().includes(term);
   card.hidden = !match;
   if (match) visible++;
  }
  filterButtons.forEach(button => { const active = button.dataset.filter === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelector('#product-results').textContent = visible === cards.length ? `Showing all ${visible} products` : `Showing ${visible} of ${cards.length} products`;
  document.querySelector('.catalogue-empty').hidden = visible > 0;
  document.querySelector('#clear-filters').hidden = !category && !brand.value && !term;
 }
 filterButtons.forEach(button => button.addEventListener('click', () => {category = button.dataset.filter; filterProducts();}));
 search.addEventListener('input', filterProducts);
 brand.addEventListener('change', filterProducts);
 function clearFilters() {category = ''; search.value = ''; brand.value = ''; filterProducts();}
 document.querySelector('#clear-filters').addEventListener('click', clearFilters);
 document.querySelector('#empty-clear').addEventListener('click', clearFilters);
 function announce(message) {document.querySelector('.cart-announcement').textContent = message;}
 function element(tag, className, text) {const node = document.createElement(tag); if(className) node.className = className; if(text !== undefined) node.textContent = text; return node;}
 function updateCart() {
  try {localStorage.setItem(CART_KEY, JSON.stringify([...cart].map(([id,quantity]) => ({id,quantity}))));} catch {}
  const total = [...cart.values()].reduce((a,b) => a + b, 0);
  document.querySelectorAll('.cart-count').forEach(node => node.textContent = total);
  document.querySelector('.floating-cart').setAttribute('aria-label', `View quotation cart, ${total} items`);
  document.querySelector('#cart-empty').hidden = cart.size > 0;
  document.querySelector('#cart-content').hidden = cart.size === 0;
  document.querySelector('#cart-summary-count').textContent = `${cart.size} product${cart.size === 1 ? '' : 's'} · ${total} item${total === 1 ? '' : 's'}`;
  const items = [];
  for (const [id, quantity] of cart) {
   const product = products.get(id);
   const li = element('li','cart-item'); li.dataset.id = id;
   const img = element('img'); img.src = product.image; img.alt = ''; img.width = 66; img.height = 66;
   const info = element('div'); info.append(element('h3','',product.name),element('p','product-code',id));
   const remove = element('button','remove-product','Remove'); remove.type = 'button'; remove.dataset.remove = id; remove.setAttribute('aria-label', `Remove ${product.name} from cart`); info.append(remove);
   const control = element('div','quantity-control');
   const minus = element('button','','−'); minus.type = 'button'; minus.dataset.decrease = id; minus.setAttribute('aria-label', `Decrease quantity of ${product.name}`);
   const input = element('input'); input.type = 'number'; input.min = '1'; input.max = '999'; input.step = '1'; input.value = quantity; input.dataset.quantity = id; input.setAttribute('aria-label', `Quantity of ${product.name}`);
   const plus = element('button','','+'); plus.type = 'button'; plus.dataset.increase = id; plus.disabled = quantity === 999; plus.setAttribute('aria-label', `Increase quantity of ${product.name}`);
   control.append(minus,input,plus); li.append(img,info,control); items.push(li);
  }
  document.querySelector('#cart-items').replaceChildren(...items);
  cards.forEach(card => {
   const quantity = cart.get(card.dataset.product) || 0;
   const button = card.querySelector('[data-add]');
   button.disabled = quantity === 999;
   button.innerHTML = `<span aria-hidden="true">${quantity ? '✓' : '+'}</span> ${quantity ? `Add more (${quantity})` : 'Add to cart'}`;
  });
 }
 function clearResult() {result.textContent = ''; result.classList.remove('error');}
 function setQuantity(id, quantity) {
  if (submitting) return;
  if (quantity <= 0) cart.delete(id); else cart.set(id, Math.min(999, Math.max(1, quantity)));
  clearResult(); updateCart();
 }
 document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.add; setQuantity(id, (cart.get(id) || 0) + 1);
  announce(`${products.get(id).name} added to cart. Choose View cart to request a quotation.`);
 }));
 const list = document.querySelector('#cart-items');
 list.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || submitting) return;
  const id = button.dataset.remove || button.dataset.increase || button.dataset.decrease;
  if (!cart.has(id)) return;
  const position = [...cart.keys()].indexOf(id);
  const action = button.dataset.remove ? 'remove' : button.dataset.increase ? 'increase' : 'decrease';
  setQuantity(id, action === 'remove' ? 0 : cart.get(id) + (action === 'increase' ? 1 : -1));
  const row = list.querySelector(`[data-id="${id}"]`) || list.children[Math.min(position, list.children.length-1)];
  const next = row?.querySelector(action === 'remove' ? 'button' : `[data-${action}]`);
  (next || document.querySelector('#browse-products')).focus();
  announce(`Cart updated. ${cart.size} products selected.`);
 });
 list.addEventListener('change', event => {
  const id = event.target.dataset.quantity; if (!id || !cart.has(id)) return;
  const quantity = Number(event.target.value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {event.target.value = cart.get(id); return;}
  setQuantity(id, quantity); list.querySelector(`[data-quantity="${id}"]`).focus();
 });
 document.querySelectorAll('[data-open-cart]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
 document.querySelector('#browse-products').addEventListener('click', () => {dialog.close(); document.querySelector('#catalogue').scrollIntoView(); search.focus({preventScroll:true});});
 document.querySelector('.quote-next').addEventListener('click', event => {event.preventDefault(); form.scrollIntoView({behavior:'smooth',block:'start'}); document.querySelector('#quote-name').focus({preventScroll:true});});
 const name = form.elements.fullName;
 const phone = form.elements.phone;
 function validateContact() {
  name.setCustomValidity(name.value.trim().length >= 2 ? '' : translate('Please enter your full name.'));
  const normalizedPhone = normalizeDigits(phone.value.trim());
  const digits = normalizedPhone.replace(/\D/g,'');
  phone.setCustomValidity(/^[+\d\s().-]+$/.test(normalizedPhone) && digits.length >= 7 && digits.length <= 15 ? '' : translate('Please enter a valid phone number with 7 to 15 digits.'));
  const email = form.elements.email;
  email.setCustomValidity('');
  if (!email.value.trim() || email.validity.typeMismatch) email.setCustomValidity(translate('Please enter a valid email address to receive your confirmation.'));
  form.elements.serviceRequirement.setCustomValidity(form.elements.serviceRequirement.value ? '' : translate('Please select whether you require installation services.'));
 }
 form.addEventListener('input', () => {validateContact(); clearResult();});
 form.elements.serviceRequirement.addEventListener('change', () => {validateContact(); clearResult();});
 function showResult(message, error = false) {result.textContent = message; result.classList.toggle('error',error); result.tabIndex = -1; result.focus();}
 function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
 }
 form.addEventListener('submit', async event => {
  event.preventDefault(); if (submitting) return;
  validateContact(); if (!form.reportValidity()) return;
  if (!cart.size) {showResult('Please add a product to your cart first.',true); return;}
  if (location.protocol === 'file:') {showResult('Automatic sending is available on the hosted website. For now, contact info@karama.tech with your product references.',true); return;}
  const payload = {fullName:name.value.trim(),phone:normalizeDigits(phone.value.trim()),email:form.elements.email.value.trim(),serviceRequirement:form.elements.serviceRequirement.value,notes:form.elements.notes.value.trim(),website:form.elements.website.value,locale:language?.locale||'en',items:[...cart].map(([id,quantity])=>({id,quantity}))};
  if (document.documentElement.dataset.quotationMode === 'email') {
   const requirement = payload.serviceRequirement === 'products-with-installation' ? 'Products with installation' : 'Products only';
   const body = [translate('Quotation request'),'',`${translate('Full name')}: ${payload.fullName}`,`${translate('Phone number')}: ${payload.phone}`,`${translate('Email')}: ${payload.email || '—'}`,`${translate('Service requirement')}: ${translate(requirement)}`,'',translate('Selected products'),...payload.items.map(item=>`${item.id} | ${translate(products.get(item.id).name)} | ${translate('Quantity')}: ${item.quantity}`),'',translate('Additional requirements'),payload.notes || '—'].join('\n');
   location.href = `mailto:info@karama.tech?subject=${encodeURIComponent(translate('Quotation request')+' — '+payload.fullName)}&body=${encodeURIComponent(body)}`;
   showResult(translate('Your email app should now open with your quotation request. Review and send the email to complete your enquiry. Your cart has been kept.'));
   return;
  }
  const fingerprint = JSON.stringify(payload);
  if (lastFingerprint !== fingerprint) {requestId = uuid(); lastFingerprint = fingerprint;}
  submitting = true; clearResult();
  const controls = [...dialog.querySelectorAll('input,textarea,select,button,.quote-next')].filter(node=>!node.classList.contains('dialog-close'));
  const oldStates = controls.map(node=>node.disabled); controls.forEach(node=>node.disabled = true);
  submit.textContent = 'Sending your request…';
  try {
   const response = await fetch('/api/quotation', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId}),signal:AbortSignal.timeout(25000)});
   const data = await response.json().catch(()=>({}));
   if (!response.ok || !data.ok) throw new Error(data.error || 'We couldn’t send your request. Please try again or contact info@karama.tech.');
   cart.clear(); updateCart(); form.reset(); validateContact(); lastFingerprint = ''; requestId = '';
   showResult(`Thank you. We’ve received your quotation request and sent a confirmation with your product selection to your email address. Our team will get in touch shortly. Reference: ${data.reference}.`);
  } catch (error) {
   showResult(error.name === 'TimeoutError' || error.name === 'AbortError' ? 'The request is taking longer than expected. Your cart is still here. Please try again; the same request reference will be reused.' : error.message || 'Connection failed. Your cart is still here. Please try again.',true);
  } finally {
   submitting = false; controls.forEach((node,i)=>node.disabled = oldStates[i]); submit.innerHTML = 'Send quotation request <span>↗</span>';
  }
 });
 document.addEventListener('languagechange', () => {filterProducts(); updateCart(); validateContact();});
 validateContact();
 updateCart();
})();
