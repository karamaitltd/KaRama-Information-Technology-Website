'use strict';
(() => {
 const form=document.querySelector('#project-form');if(!form)return;
 const result=form.querySelector('.form-result'),button=form.querySelector('[type="submit"]');
 const t=text=>window.KaRamaI18n?.t(text)||text;
 let pending=false,lastFingerprint='',requestId='';
 function validate(){
  form.elements.name.setCustomValidity(form.elements.name.value.trim().length>=2?'':t('Please enter your full name.'));
  const email=form.elements.email;email.setCustomValidity('');
  if(!email.value.trim()||email.validity.typeMismatch)email.setCustomValidity(t('Please enter a valid email address to receive your confirmation.'));
  form.elements.message.setCustomValidity(form.elements.message.value.trim()?'':t('Please tell us about your enquiry in up to 4,000 characters.'));
 }
 function show(text,error=false){result.textContent=text;result.classList.toggle('error',error);result.tabIndex=-1;result.focus();}
 form.addEventListener('input',()=>{validate();result.textContent='';});
 document.addEventListener('languagechange',validate);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending)return;validate();if(!form.reportValidity())return;
  const payload={fullName:form.elements.name.value.trim(),email:form.elements.email.value.trim(),company:form.elements.company.value.trim(),service:form.elements.service.value,message:form.elements.message.value.trim(),website:form.elements.website.value,locale:window.KaRamaI18n?.locale||'en'};
  if(document.documentElement.dataset.submissionMode==='email'){
   const body=[`${t('Full name')}: ${payload.fullName}`,`${t('Email')}: ${payload.email}`,`${t('Company')}: ${payload.company}`,`${t('Service requirement')}: ${form.elements.service.selectedOptions[0].textContent}`,'',payload.message].join('\n');
   location.href=`mailto:info@karama.tech?subject=${encodeURIComponent('Project enquiry from '+payload.fullName)}&body=${encodeURIComponent(body)}`;
   show(t('Your email app should now open with your enquiry. If it doesn’t, email us at info@karama.tech.'));return;
  }
  if(location.protocol==='file:'){show(t('Online enquiry sending is not available yet. Please contact info@karama.tech or call +966 55 141 5599.'),true);return;}
  const fingerprint=JSON.stringify(payload);if(fingerprint!==lastFingerprint){requestId=crypto.randomUUID();lastFingerprint=fingerprint;}
  pending=true;result.textContent='';
  const controls=[...form.querySelectorAll('input,textarea,select,button')];controls.forEach(e=>e.disabled=true);button.textContent='Sending your enquiry…';
  try{
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId}),signal:AbortSignal.timeout(25000)});
   const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'We couldn’t send your request. Please try again or contact info@karama.tech.');
   form.reset();validate();lastFingerprint='';requestId='';
   show(`Thank you. Your enquiry has been received and a confirmation email has been sent to your email address. Our team will get in touch shortly. Reference: ${data.reference}.`);
  }catch(error){show(error.name==='TimeoutError'||error.name==='AbortError'?t('The request is taking longer than expected. Please retry with the same details.'):error.message||t('Connection failed. Please try again.'),true);}
  finally{pending=false;controls.forEach(e=>e.disabled=false);button.innerHTML='Send enquiry <span>↗</span>';}
 });
 validate();
})();
