const {test,afterEach} = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/quotation');
const originalFetch = global.fetch;
const originalEnv = {...process.env};
const payload = {requestId:'12345678-1234-4123-8123-123456789012',fullName:'Test Customer',phone:'+966 55 123 4567',email:'',serviceRequirement:'products-only',notes:'Office installation',items:[{id:'KRM-002',quantity:2}],website:''};
function configure() {process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';process.env.RESEND_API_KEY='test';process.env.QUOTATION_FROM_EMAIL='KaRama <quotes@example.com>';}
function record(status='pending') {return {id:payload.requestId,created_at:new Date().toISOString(),payload:handler.validate(payload).value,email_status:status};}
function json(data,status=200) {return {ok:status<400,status,json:async()=>data};}
async function call(body=payload, overrides={}) {
 const req = {method:'POST',headers:{'content-type':'application/json',host:'localhost:4173',origin:'http://localhost:4173','x-forwarded-for':'127.0.0.1'},body,...overrides};
 const res = {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(data){this.body=data;return this;}};
 await handler(req,res);return res;
}
afterEach(()=>{global.fetch=originalFetch;for(const key of ['SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','QUOTATION_FROM_EMAIL']) {if(originalEnv[key]===undefined) delete process.env[key];else process.env[key]=originalEnv[key];}});
test('requires full name and a valid phone; email remains optional',()=>{
 assert.ok(handler.validate({...payload,fullName:'   '}).error);
 assert.ok(handler.validate({...payload,phone:''}).error);
 assert.ok(handler.validate({...payload,phone:'abc12345678'}).error);
 assert.ok(handler.validate({...payload,email:'broken'}).error);
 assert.ok(handler.validate(payload).value);
 assert.ok(handler.validate({...payload,fullName:'محمد علي'}).value);
 assert.equal(handler.validate({...payload,phone:'+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧'}).value.phone,'+966 55 123 4567');
});
test('rejects unknown products, duplicated products, quantity tampering and honeypot',()=>{
 for(const items of [[{id:'fake',quantity:1}],[{id:'KRM-002',quantity:0}],[{id:'KRM-002',quantity:1.5}],[{id:'KRM-002',quantity:1000}],[...payload.items,...payload.items],[]]) assert.ok(handler.validate({...payload,items}).error);
 assert.ok(handler.validate({...payload,website:'spam'}).error);
});
test('uses trusted product names and only confirms success after database and email acceptance',async()=>{
 configure();const calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});return url.includes('/rpc/')?json(record()):url.includes('resend.com')?json({id:'email-123'}):json(null);};
 const res=await call({...payload,items:[{...payload.items[0],name:'Forged product'}]});
 assert.equal(res.statusCode,200);assert.equal(res.body.ok,true);assert.equal(calls.length,3);
 const stored=JSON.parse(calls[0].options.body);assert.equal(stored.p_payload.items[0].name,'Hikvision dome camera');assert.match(stored.p_client_hash,/^[a-f0-9]{64}$/);
 assert.equal(calls[0].options.headers.Authorization,undefined);
 const email=JSON.parse(calls[1].options.body);assert.deepEqual(email.to,['info@karama.tech']);assert.match(email.text,/Quantity: 2/);assert.equal(email.reply_to,undefined);assert.ok(calls[1].options.headers['Idempotency-Key']);
});
test('customer email becomes reply_to, recipient stays fixed',async()=>{
 configure();let sent;
 global.fetch=async(url,options)=>{if(url.includes('/rpc/')){const r=record();r.payload.email='customer@example.com';return json(r);}if(url.includes('resend.com')){sent=JSON.parse(options.body);return json({id:'email-1'});}return json(null);};
 const res=await call({...payload,email:'customer@example.com',to:'attacker@example.com'});
 assert.equal(res.statusCode,200);assert.equal(sent.reply_to,'customer@example.com');assert.deepEqual(sent.to,['info@karama.tech']);
});
test('accepted requests are not emailed again',async()=>{
 configure();let calls=0;global.fetch=async()=>{calls++;return json(record('accepted'));};
 const res=await call();assert.equal(res.body.ok,true);assert.equal(calls,1);
});
test('requires a supported service selection and includes each choice in storage and email',async()=>{
 for(const serviceRequirement of [undefined,'','unsupported']) assert.ok(handler.validate({...payload,serviceRequirement}).error);
 configure();
 for(const [serviceRequirement,label] of [['products-only','Products only'],['products-with-installation','Products with installation']]) {
  let saved;let sent;
  global.fetch=async(url,options)=>{
   if(url.includes('/rpc/')) {saved=JSON.parse(options.body).p_payload;return json({...record(),payload:saved});}
   if(url.includes('resend.com')) {sent=JSON.parse(options.body);return json({id:'email-service-test'});}
   return json(null);
  };
  const res=await call({...payload,serviceRequirement});
  assert.equal(res.body.ok,true);assert.equal(saved.serviceRequirement,serviceRequirement);
  assert.ok(sent.text.includes(`Service requirement: ${label}`));
 }
});
test('email rejection preserves the saved reference and does not report success',async()=>{
 configure();global.fetch=async url=>url.includes('/rpc/')?json(record()):json({message:'Provider failed'},500);
 const res=await call();assert.equal(res.statusCode,503);assert.equal(res.body.ok,undefined);assert.match(res.body.error,/saved/);assert.match(res.body.error,/12345678/);
});
test('database failure never sends an email',async()=>{
 configure();let calls=0;global.fetch=async()=>{calls++;return json({message:'database unavailable'},500);};
 const res=await call();assert.equal(res.statusCode,503);assert.equal(calls,1);
});
test('missing configuration gives an honest unavailable response',async()=>{
 for(const key of ['SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','QUOTATION_FROM_EMAIL'])delete process.env[key];
 global.fetch=async()=>{throw Error('Network should not be called');};
 const res=await call();assert.equal(res.statusCode,503);assert.match(res.body.error,/not available yet/);
});
test('rejects cross-site requests, incorrect content type and unsupported methods',async()=>{
 assert.equal((await call(payload,{headers:{host:'localhost',origin:'https://evil.example','content-type':'application/json'}})).statusCode,403);
 assert.equal((await call(payload,{headers:{'content-type':'text/plain'}})).statusCode,415);
 assert.equal((await call(payload,{method:'GET'})).statusCode,405);
});
test('rate limiting and expired uncertain deliveries are handled without emailing',async()=>{
 configure();global.fetch=async()=>json({message:'RATE_LIMITED'},400);
 const limited=await call();assert.equal(limited.statusCode,429);assert.equal(limited.headers['Retry-After'],'3600');
 global.fetch=async()=>{const r=record();r.created_at=new Date(Date.now()-25*3600000).toISOString();return json(r);};
 assert.equal((await call()).statusCode,409);
});
