const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const quote=require('../api/quotation'),contact=require('../api/contact');
const {buildEmail,productSummary}=require('../lib/email-templates');
const originalFetch=global.fetch,originalEnv={...process.env};
const keys=['SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','QUOTATION_FROM_EMAIL'];
const payload={requestId:'12345678-1234-4123-8123-123456789012',fullName:'Test Customer',phone:'+966 55 123 4567',email:'customer@example.com',serviceRequirement:'products-only',notes:'Office installation',items:[{id:'KRM-002',quantity:2}],website:'',locale:'en'};
const enquiry={requestId:'87654321-1234-4123-8123-123456789012',fullName:'Contact Customer',email:'visitor@example.com',company:'Example Company',service:'automation',message:'Please help with our workflow.',website:'',locale:'en'};
function configure(){process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';process.env.RESEND_API_KEY='test';process.env.QUOTATION_FROM_EMAIL='KaRama <quotes@example.com>';}
function json(value,status=200){return {ok:status<400,status,json:async()=>value};}
function record(kind='quotation',body=payload,changes={}){return {id:body.requestId,kind,created_at:new Date().toISOString(),payload:(kind==='quotation'?quote:contact).validate(body).value,admin_email_status:'pending',confirmation_email_status:'pending',...changes};}
async function call(body=payload,handler=quote,overrides={}){const req={method:'POST',headers:{'content-type':'application/json',host:'localhost:4173',origin:'http://localhost:4173','x-forwarded-for':'127.0.0.1'},body,...overrides};const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(value){this.body=value;return this;}};await handler(req,res);return res;}
function mockBackend(options={}){
 const state={row:options.row,stored:[],emails:[],patches:[]};
 global.fetch=async(url,config)=>{
  if(url.includes('/rpc/')){const saved=JSON.parse(config.body);state.stored.push(saved);if(options.databaseFailure)return json({message:'Unavailable'},500);if(!state.row)state.row=record(saved.p_kind,{...payload,...enquiry,requestId:saved.p_id},{payload:saved.p_payload});return json(JSON.parse(JSON.stringify(state.row)));}
  if(url.includes('resend.com')){const email=JSON.parse(config.body);state.emails.push({email,key:config.headers['Idempotency-Key']});if(options.failCustomer&&email.to[0]!=='info@karama.tech')return json({message:'Email rejected'},500);return json({id:'email-'+state.emails.length});}
  const patch=JSON.parse(config.body);state.patches.push(patch);if(options.patchFailure)return json({},500);Object.assign(state.row,patch);return json(null);
 };return state;
}
afterEach(()=>{global.fetch=originalFetch;for(const key of keys){if(originalEnv[key]===undefined)delete process.env[key];else process.env[key]=originalEnv[key];}});
test('quote requires full name, phone and email and normalizes Arabic digits',()=>{
 for(const change of [{fullName:' '},{phone:''},{phone:'abc12345678'},{email:''},{email:'broken'}])assert.ok(quote.validate({...payload,...change}).error);
 assert.equal(quote.validate({...payload,phone:'+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧'}).value.phone,'+966 55 123 4567');
 assert.equal(quote.validate({...payload,fullName:'محمد علي',locale:'ar-SA'}).value.locale,'ar-SA');
});
test('contact validates its service, message and email',()=>{
 assert.ok(contact.validate(enquiry).value);
 for(const change of [{email:''},{service:'untrusted'},{message:' '},{message:'x'.repeat(4001)}])assert.ok(contact.validate({...enquiry,...change}).error);
});
test('rejects product and quantity tampering and missing service selection',()=>{
 for(const items of [[{id:'fake',quantity:1}],[{id:'KRM-002',quantity:0}],[{id:'KRM-002',quantity:1000}],[{id:'KRM-002',quantity:1.5}],[...payload.items,...payload.items],[]])assert.ok(quote.validate({...payload,items}).error);
 for(const serviceRequirement of [undefined,'','unsupported'])assert.ok(quote.validate({...payload,serviceRequirement}).error);
 assert.ok(quote.validate({...payload,website:'bot'}).error);
});
test('quotation is saved before two separately addressed branded emails',async()=>{
 configure();const state=mockBackend();const res=await call({...payload,items:[{...payload.items[0],name:'Forged name'}],to:'attacker@example.com'});
 assert.equal(res.statusCode,200);assert.equal(res.body.ok,true);assert.equal(state.emails.length,2);
 assert.equal(state.stored[0].p_payload.items[0].name,'Hikvision dome camera');assert.match(state.stored[0].p_client_hash,/^[a-f0-9]{64}$/);
 const admin=state.emails.find(e=>e.email.to[0]==='info@karama.tech'),customer=state.emails.find(e=>e.email.to[0]===payload.email);
 assert.equal(admin.email.reply_to,payload.email);assert.equal(customer.email.reply_to,'info@karama.tech');assert.notEqual(admin.key,customer.key);
 for(const {email} of state.emails){assert.match(email.html,/cid:karama-logo/);assert.match(email.text,/Quantity: 2/);assert.match(email.text,/Products only/);assert.equal(email.attachments.length,2);assert.equal(email.attachments[0].content_id,'karama-logo');assert.match(Buffer.from(email.attachments[1].content,'base64').toString('utf8'),/KRM-002/);}
 assert.equal(state.row.admin_email_status,'accepted');assert.equal(state.row.confirmation_email_status,'accepted');
});
test('contact sends the entire enquiry to staff and thanks the visitor',async()=>{
 configure();const state=mockBackend();const res=await call(enquiry,contact);assert.equal(res.body.ok,true);
 const receipt=state.emails.find(e=>e.email.to[0]===enquiry.email).email;
 assert.match(receipt.subject,/Thank you/);assert.match(receipt.text,/get in touch/);assert.match(receipt.text,/Please help with our workflow/);assert.equal(receipt.attachments.length,1);
 assert.ok(state.emails.every(e=>e.email.text.includes(enquiry.company)));
});
test('a partial email failure keeps the enquiry and retries only the missing receipt',async()=>{
 configure();const options={failCustomer:true};const state=mockBackend(options);
 const first=await call();assert.equal(first.statusCode,503);assert.equal(first.body.saved,true);assert.equal(state.row.admin_email_status,'accepted');assert.equal(state.row.confirmation_email_status,'pending');
 const oldAdmin=state.emails.filter(e=>e.email.to[0]==='info@karama.tech').length;options.failCustomer=false;
 const second=await call();assert.equal(second.body.ok,true);assert.equal(state.emails.filter(e=>e.email.to[0]==='info@karama.tech').length,oldAdmin);
 const keys=state.emails.filter(e=>e.email.to[0]===payload.email).map(e=>e.key);assert.equal(keys[0],keys[1]);
});
test('completed requests do not resend either email',async()=>{
 configure();const state=mockBackend({row:record('quotation',payload,{admin_email_status:'accepted',confirmation_email_status:'accepted'})});
 assert.equal((await call()).body.ok,true);assert.equal(state.emails.length,0);
});
test('database failure and absent configuration cannot send emails',async()=>{
 configure();const state=mockBackend({databaseFailure:true});assert.equal((await call()).statusCode,503);assert.equal(state.emails.length,0);
 for(const key of keys)delete process.env[key];let called=false;global.fetch=async()=>{called=true;throw Error('Unexpected network');};
 assert.equal((await call()).statusCode,503);assert.equal(called,false);
});
test('rejects cross-site, unsupported and malformed requests',async()=>{
 assert.equal((await call(payload,quote,{headers:{host:'localhost',origin:'https://evil.example','content-type':'application/json'}})).statusCode,403);
 assert.equal((await call(payload,quote,{method:'GET'})).statusCode,405);
 assert.equal((await call(payload,quote,{headers:{'content-type':'text/plain'}})).statusCode,415);
 assert.equal((await call('{bad json')).statusCode,400);
});
test('rate limits and old uncertain deliveries do not send emails',async()=>{
 configure();global.fetch=async()=>json({message:'RATE_LIMITED'},400);const res=await call();assert.equal(res.statusCode,429);assert.equal(res.headers['Retry-After'],'3600');
 const state=mockBackend({row:record('quotation',payload,{created_at:new Date(Date.now()-25*3600000).toISOString()})});assert.equal((await call()).statusCode,409);assert.equal(state.emails.length,0);
});
test('all customer-controlled text is escaped in email HTML',()=>{
 const r=record('contact',{...enquiry,fullName:'<img src=x onerror=alert(1)>',message:'<script>alert(1)</script>',company:'A & B'});
 const email=buildEmail(r,'customer','KaRama <quotes@example.com>');assert.ok(!email.html.includes('<script>'));assert.ok(!email.html.includes('<img src=x'));assert.match(email.html,/&lt;script&gt;/);assert.match(email.html,/A &amp; B/);
});
test('Arabic receipt uses Saudi locale and RTL with the same selected quantities',()=>{
 const r=record('quotation',{...payload,locale:'ar-SA',serviceRequirement:'products-with-installation'});const email=buildEmail(r,'customer','KaRama <quotes@example.com>');
 assert.match(email.html,/lang="ar-SA" dir="rtl"/);assert.match(email.text,/توريد المنتجات مع التركيب/);assert.match(email.text,/الكمية: 2/);assert.match(productSummary(r),/Products with installation/);
});
