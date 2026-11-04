'use strict';
const {createHmac}=require('node:crypto');
const catalogue=require('../products.json');
const {buildEmail,reference,REQUIREMENTS,SERVICES}=require('./email-templates');
const products=new Map(catalogue.map(p=>[p.id,p]));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(value,max){if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value))return null;return value.trim();}
function validate(body,kind){
 if(!body||typeof body!=='object'||Array.isArray(body))return {error:'Please provide your contact details.'};
 if(!UUID.test(body.requestId||''))return {error:'Invalid request reference. Refresh this page and try again.'};
 if(body.website)return {error:'Unable to accept this request.'};
 const fullName=clean(body.fullName,100),email=clean(body.email,254);
 if(!fullName||fullName.length<2||/[\r\n]/.test(fullName))return {error:'Please enter your full name.'};
 if(!email||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))return {error:'Please enter a valid email address to receive your confirmation.'};
 const locale=body.locale==='ar-SA'?'ar-SA':'en';
 if(kind==='contact'){
  const company=clean(body.company??'',150),message=clean(body.message,4000);
  if(company===null)return {error:'Please keep the company name under 150 characters.'};
  if(!message)return {error:'Please tell us about your enquiry in up to 4,000 characters.'};
  if(!Object.hasOwn(SERVICES,body.service))return {error:'Please choose a service.'};
  return {value:{fullName,email,company,message,service:body.service,locale}};
 }
 const rawPhone=clean(body.phone,30),phone=rawPhone?.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c<='٩'?1632:1776)))??null;
 const digits=phone?.replace(/\D/g,'')||'';
 if(!phone||!/^[+\d\s().-]+$/.test(phone)||digits.length<7||digits.length>15)return {error:'Please enter a valid phone number with 7 to 15 digits.'};
 const notes=clean(body.notes??'',2000);
 if(notes===null)return {error:'Please keep additional notes under 2,000 characters.'};
 if(!Object.hasOwn(REQUIREMENTS,body.serviceRequirement))return {error:'Please select whether you require installation services.'};
 if(!Array.isArray(body.items)||!body.items.length||body.items.length>catalogue.length)return {error:'Please select at least one product.'};
 const seen=new Set(),items=[];
 for(const item of body.items){if(!item||!products.has(item.id)||seen.has(item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>999)return {error:'Please check your products and quantities.'};seen.add(item.id);const product=products.get(item.id);items.push({id:product.id,name:product.name,category:product.category,quantity:item.quantity});}
 items.sort((a,b)=>a.id.localeCompare(b.id));
 return {value:{fullName,email,phone,notes,serviceRequirement:body.serviceRequirement,locale,items}};
}
function configuration(){
 const {SUPABASE_URL,SUPABASE_SECRET_KEY,SUPABASE_SERVICE_ROLE_KEY,RESEND_API_KEY,QUOTATION_FROM_EMAIL}=process.env;
 const key=SUPABASE_SECRET_KEY||SUPABASE_SERVICE_ROLE_KEY;
 if(!SUPABASE_URL||!key||!RESEND_API_KEY||!QUOTATION_FROM_EMAIL)return null;
 const headers={apikey:key,'Content-Type':'application/json'};if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
 return {base:SUPABASE_URL.replace(/\/$/,'')+'/rest/v1',headers,key,resendKey:RESEND_API_KEY,from:QUOTATION_FROM_EMAIL};
}
async function notify(record,config){
 const failed=[];
 await Promise.all(['admin','customer'].map(async audience=>{
  const column=audience==='admin'?'admin_email':'confirmation_email';if(record[column+'_status']==='accepted')return;
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.resendKey}`,'Content-Type':'application/json','Idempotency-Key':`website/${record.id}/${audience}`},body:JSON.stringify(buildEmail(record,audience,config.from)),signal:AbortSignal.timeout(9000)});
   const data=await response.json();if(!response.ok||!data.id)throw Error('Email not accepted');
   const update=await fetch(config.base+`/website_enquiries?id=eq.${record.id}`,{method:'PATCH',headers:{...config.headers,Prefer:'return=minimal'},body:JSON.stringify({[column+'_status']:'accepted',[column+'_id']:data.id,[column+'_accepted_at']:new Date().toISOString()}),signal:AbortSignal.timeout(3000)});
   if(!update.ok)throw Error('Email status not saved');
  }catch{failed.push(audience);}
 }));return failed;
}
function createHandler(kind){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const reply=(code,value)=>res.status(code).json(value);
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,{error:'Method not allowed.'});}
 if(req.headers.origin){try{const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host||!['https:','http:'].includes(origin.protocol))return reply(403,{error:'Please send your request from the KaRama website.'});}catch{return reply(403,{error:'Invalid origin.'});}}
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'Expected a JSON request.'});
 let body;try{if(Number(req.headers['content-length'])>24576)return reply(413,{error:'The request is too large.'});body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>24576)return reply(413,{error:'The request is too large.'});}catch{return reply(400,{error:'Invalid request.'});}
 const checked=validate(body,kind);if(checked.error)return reply(400,{error:checked.error});
 const config=configuration();if(!config)return reply(503,{error:'Online enquiry sending is not available yet. Please contact info@karama.tech or call +966 55 141 5599.'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(),clientHash=createHmac('sha256',config.key).update(ip).digest('hex');
 let record;
 try{
  const response=await fetch(config.base+'/rpc/create_website_enquiry',{method:'POST',headers:config.headers,body:JSON.stringify({p_id:body.requestId,p_kind:kind,p_payload:checked.value,p_client_hash:clientHash}),signal:AbortSignal.timeout(6000)});
  const data=await response.json();
  if(!response.ok){if(data.message==='RATE_LIMITED'){res.setHeader('Retry-After','3600');return reply(429,{error:'Too many requests. Please try again later or contact info@karama.tech.'});}if(data.message==='REQUEST_CONFLICT')return reply(409,{error:'This request reference has already been used. Change a detail and try again.'});throw Error('Database unavailable');}
  record=data;if(!record?.id||!record.payload||!record.created_at||record.kind!==kind)throw Error('Invalid database response');
 }catch{return reply(503,{error:'We couldn’t save your request. Please try again or contact info@karama.tech.'});}
 const ref=reference(record);if(record.admin_email_status==='accepted'&&record.confirmation_email_status==='accepted')return reply(200,{ok:true,reference:ref});
 if(!Number.isFinite(Date.parse(record.created_at))||Date.now()-Date.parse(record.created_at)>23*3600000)return reply(409,{error:`Your request was saved earlier. Please contact info@karama.tech with reference ${ref} so we can check it.`});
 const failed=await notify(record,config);
 if(failed.length)return reply(503,{error:`Your request is saved, but we couldn’t confirm all notification emails. Please retry with the same details, or contact info@karama.tech with reference ${ref}.`,reference:ref,saved:true});
 return reply(200,{ok:true,reference:ref});
};}
module.exports={createHandler,validate,configuration,notify};
