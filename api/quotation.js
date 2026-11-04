'use strict';
const {createHmac} = require('node:crypto');
const catalogue = require('../products.json');
const products = new Map(catalogue.map(product => [product.id,product]));
const RECIPIENT = 'info@karama.tech';
const SERVICE_REQUIREMENTS = new Map([
 ['products-with-installation','Products with installation'],
 ['products-only','Products only']
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(value, max) {
 if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return null;
 return value.trim();
}
function validate(body) {
 if (!body || typeof body !== 'object' || Array.isArray(body)) return {error:'Please provide your contact details and products.'};
 if (!UUID.test(body.requestId || '')) return {error:'Invalid request reference. Refresh this page and try again.'};
 if (body.website) return {error:'Unable to accept this request.'};
 const fullName = clean(body.fullName,100);
 const rawPhone = clean(body.phone,30);
 const phone = rawPhone?.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c <= '٩' ? 1632 : 1776))) ?? null;
 const email = clean(body.email ?? '',254);
 const notes = clean(body.notes ?? '',2000);
 if (!fullName || fullName.length < 2 || /[\r\n]/.test(fullName)) return {error:'Please enter your full name.'};
 const digits = phone?.replace(/\D/g,'') || '';
 if (!phone || !/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) return {error:'Please enter a valid phone number with 7 to 15 digits.'};
 if (email === null || (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))) return {error:'Please enter a valid email address, or leave email empty.'};
 if (notes === null) return {error:'Please keep additional notes under 2,000 characters.'};
 if (!SERVICE_REQUIREMENTS.has(body.serviceRequirement)) return {error:'Please select whether you require installation services.'};
 if (!Array.isArray(body.items) || !body.items.length || body.items.length > catalogue.length) return {error:'Please select at least one product.'};
 const seen = new Set();
 const items = [];
 for (const item of body.items) {
  if (!item || !products.has(item.id) || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) return {error:'Please check your products and quantities.'};
  seen.add(item.id); const product = products.get(item.id);
  items.push({id:product.id,name:product.name,category:product.category,quantity:item.quantity});
 }
 items.sort((a,b)=>a.id.localeCompare(b.id));
 return {value:{fullName,phone,email,serviceRequirement:body.serviceRequirement,notes,items}};
}
async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 const reply = (status,body) => res.status(status).json(body);
 if (req.method !== 'POST') {res.setHeader('Allow','POST'); return reply(405,{error:'Method not allowed.'});}
 const origin = req.headers.origin;
 if (origin) {
  try {
   const originURL = new URL(origin);
   if (originURL.host !== req.headers.host || !['http:','https:'].includes(originURL.protocol)) return reply(403,{error:'Please send your request from the KaRama website.'});
  } catch {return reply(403,{error:'Invalid origin.'});}
 }
 if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(415,{error:'Expected a JSON request.'});
 let body;
 try {
  if (Number(req.headers['content-length']) > 24576) return reply(413,{error:'The request is too large.'});
  body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (Buffer.byteLength(JSON.stringify(body) || '') > 24576) return reply(413,{error:'The request is too large.'});
 } catch {return reply(400,{error:'Invalid request.'});}
 const checked = validate(body);
 if (checked.error) return reply(400,{error:checked.error});
 const {SUPABASE_URL,SUPABASE_SECRET_KEY,SUPABASE_SERVICE_ROLE_KEY,RESEND_API_KEY,QUOTATION_FROM_EMAIL} = process.env;
 const dbKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
 if (!SUPABASE_URL || !dbKey || !RESEND_API_KEY || !QUOTATION_FROM_EMAIL) {
  console.error('Quotation service configuration is incomplete.');
  return reply(503,{error:'Online quotation sending is not available yet. Your cart is saved. Please contact info@karama.tech or call +966 55 141 5599.'});
 }
 const dbHeaders = {'apikey':dbKey,'Content-Type':'application/json'};
 // New Supabase secret keys go in apikey only; legacy JWT keys also use Authorization.
 if (!dbKey.startsWith('sb_secret_')) dbHeaders.Authorization = `Bearer ${dbKey}`;
 const base = SUPABASE_URL.replace(/\/$/,'') + '/rest/v1';
 const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
 const clientHash = createHmac('sha256',dbKey).update(ip).digest('hex');
 let record;
 try {
  const stored = await fetch(base+'/rpc/create_quotation_request', {
   method:'POST',headers:dbHeaders,
   body:JSON.stringify({p_id:body.requestId,p_payload:checked.value,p_client_hash:clientHash}),
   signal:AbortSignal.timeout(7000)
  });
  const data = await stored.json();
  if (!stored.ok) {
   if (data.message === 'RATE_LIMITED') {res.setHeader('Retry-After','3600');return reply(429,{error:'Too many requests. Please try again later or contact info@karama.tech.'});}
   if (data.message === 'REQUEST_CONFLICT') return reply(409,{error:'This request reference has already been used. Change a detail and try again.'});
   throw new Error('database_request_failed');
  }
  record = data;
  if (!record?.id || !record.payload || !record.created_at) throw new Error('database_response_invalid');
 } catch {
  console.error('Quotation database operation failed.');
  return reply(503,{error:'We couldn’t save your request. Your cart is still here. Please try again or contact info@karama.tech.'});
 }
 const reference = 'KRM-'+record.id;
 if (record.email_status === 'accepted') return reply(200,{ok:true,reference});
 // Provider idempotency expires after 24 hours. An old uncertain delivery needs a manual check.
 if (Date.now()-Date.parse(record.created_at) > 23*60*60*1000) return reply(409,{error:`Your request was saved earlier. Please contact info@karama.tech with reference ${reference} so we can check it.`});
 const payload = record.payload;
 const text = [
  'NEW KARAMA PRODUCT QUOTATION REQUEST',`Reference: ${reference}`,`Received: ${record.created_at}`,'',
  `Full name: ${payload.fullName}`,`Phone: ${payload.phone}`,`Email: ${payload.email || 'Not provided'}`,'',
  `Service requirement: ${SERVICE_REQUIREMENTS.get(payload.serviceRequirement) || 'Not specified'}`,'',
  'REQUESTED PRODUCTS',...payload.items.map(item=>`${item.id} | ${item.name} | Quantity: ${item.quantity}`),'',
  `Total units: ${payload.items.reduce((sum,item)=>sum+item.quantity,0)}`,'',
  'ADDITIONAL REQUIREMENTS',payload.notes || 'None provided.','',
  'Please confirm exact models, specifications, availability and pricing with the customer.'
 ].join('\n');
 let emailId;
 try {
  const delivery = await fetch('https://api.resend.com/emails', {
   method:'POST',headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`quotation/${record.id}`},
   body:JSON.stringify({from:QUOTATION_FROM_EMAIL,to:[RECIPIENT],subject:`KaRama quotation request ${reference}`,text,...(payload.email ? {reply_to:payload.email} : {})}),
   signal:AbortSignal.timeout(10000)
  });
  const data = await delivery.json();
  if (!delivery.ok || !data.id) throw new Error('email_not_accepted');
  emailId = data.id;
 } catch {
  console.error('Quotation email was not confirmed by the provider.');
  return reply(503,{error:`Your request is saved, but we couldn’t confirm the email. Please retry with the same details, or contact info@karama.tech with reference ${reference}.`});
 }
 try {
  const updated = await fetch(base+`/quotation_requests?id=eq.${record.id}&email_status=eq.pending`,{
   method:'PATCH',headers:{...dbHeaders,Prefer:'return=minimal'},
   body:JSON.stringify({email_status:'accepted',email_id:emailId,email_accepted_at:new Date().toISOString()}),
   signal:AbortSignal.timeout(4000)
  });
  if (!updated.ok) throw new Error('status_update_failed');
 } catch {console.error('Quotation accepted by email provider; database status needs reconciliation.');}
 return reply(200,{ok:true,reference});
}
module.exports = handler;
module.exports.validate = validate;
