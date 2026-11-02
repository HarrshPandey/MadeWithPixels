// POST /api/submit: every public form on the site (project enquiry, contact lightbox, pixel sketch) lands here.
// It emails you through Resend and, for enquiries and sketches, sends the visitor a short confirmation.
// Env: RESEND_API_KEY, AUDIT_FROM (sender on your verified domain), AUDIT_TO (optional, defaults to hello@madeofpixels.in),
//      AUDIT_REPLY_TO (optional), AUTORESPONSE=off to disable the confirmation email to visitors.
const {send,readBody,ip,limited,mail}=require('./_lib');

const clean=(v,max)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);
const oneLine=(v,max)=>clean(v,max).replace(/[\r\n]+/g,' ');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const wrap=(title,inner)=>'<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111110"><p style="font:12px monospace;letter-spacing:.08em;text-transform:uppercase;color:#6b6a65">MadeOfPixels Studio</p><h1 style="font:700 24px/1.15 Arial,sans-serif;margin:8px 0 16px">'+esc(title)+'</h1>'+inner+'</div>';
const row=(k,v)=>v?'<tr><td style="padding:6px 16px 6px 0;color:#6b6a65;vertical-align:top;white-space:nowrap">'+esc(k)+'</td><td style="padding:6px 0">'+v+'</td></tr>':'';

function enquiry(b){
  const d={name:oneLine(b.name,120),email:oneLine(b.email,200),phone:oneLine(b.phone,40),type:oneLine(b.type,80),budget:oneLine(b.budget,80),message:clean(b.message,5000),page:oneLine(b.page,200),source:oneLine(b.source,20)};
  if(d.name.length<2||!EMAIL.test(d.email)||d.message.length<20||!d.type) return {error:'Please fill in your name, a valid email, the project type and a message of at least 20 characters.'};
  const html=wrap('New project enquiry','<table style="font-size:15px;border-collapse:collapse">'+row('Name',esc(d.name))+row('Email','<a href="mailto:'+esc(d.email)+'">'+esc(d.email)+'</a>')+row('Phone / WhatsApp',esc(d.phone))+row('Project type',esc(d.type))+row('Budget',esc(d.budget))+row('Sent from',esc((d.source==='dialog'?'Contact lightbox':'Contact page')+(d.page?' ('+d.page+')':'')))+'</table><p style="margin:20px 0 6px;color:#6b6a65;font:12px monospace;text-transform:uppercase;letter-spacing:.08em">Message</p><div style="white-space:pre-wrap;font-size:15px;line-height:1.6;border-left:3px solid #111110;padding-left:14px">'+esc(d.message)+'</div><p style="margin-top:24px;font-size:14px;color:#555">Reply to this email to answer '+esc(d.name)+' directly.</p>');
  const ack=wrap('We got your brief','<p style="font-size:15px;line-height:1.6">Hi '+esc(d.name.split(' ')[0])+',</p><p style="font-size:15px;line-height:1.6">Thanks for reaching out to MadeOfPixels Studio. We have your brief and one of us will reply within 24 hours (Mon–Sat, 9am–8pm IST).</p><p style="font-size:15px;line-height:1.6">In the meantime:</p><ul style="font-size:15px;line-height:1.8"><li>Want to talk now? WhatsApp us on <a href="https://wa.me/918080356882">+91 80803 56882</a></li><li>See what we have built: <a href="https://madeofpixels.in/projects">madeofpixels.in/projects</a></li><li>Check your current site for free: <a href="https://madeofpixels.in/free-website-audit">free website audit</a></li></ul><p style="font-size:14px;color:#555;margin-top:24px">Bold by design. Built from scratch.<br>MadeOfPixels Studio, Vasai West, Maharashtra</p>');
  return {subject:'New enquiry: '+d.name+' ('+d.type+')',html,reply_to:d.email,to:d.email,ackSubject:'We got your brief. Reply within 24 hours.',ack};
}
function sketch(b){
  const email=oneLine(b.email,200), credit=oneLine(b.credit,80), art=clean(b.sketch,400), ok=b.gallery_ok===true||b.gallery_ok==='true';
  const rows=art.split('\n');
  if(!EMAIL.test(email)||rows.length!==16||rows.some(r=>!/^[#.]{16}$/.test(r))||!rows.some(r=>r.includes('#'))) return {error:'That sketch could not be read. Please draw something and try again.'};
  const svg=rows.map(r=>esc(r.replace(/#/g,'█').replace(/\./g,'·'))).join('\n');
  const html=wrap('New pixel sketch','<table style="font-size:15px;border-collapse:collapse">'+row('Email','<a href="mailto:'+esc(email)+'">'+esc(email)+'</a>')+row('Credit name',esc(credit)||'(none)')+row('Gallery permission',ok?'<b>Yes, OK to show on the gallery wall</b>':'No, keep it private')+'</table><pre style="font:16px/1.05 monospace;letter-spacing:2px;background:#efede8;padding:16px;margin:20px 0;overflow:auto">'+svg+'</pre><p style="font-size:13px;color:#6b6a65;margin:0 0 6px">Paste these rows into Admin > Gallery to add it to the wall:</p><pre style="font:13px/1.3 monospace;background:#f6f5f2;padding:12px;overflow:auto">'+esc(art)+'</pre>');
  const ack=wrap('Thanks for your sketch','<p style="font-size:15px;line-height:1.6">We got your pixel sketch and love it.'+(ok?' You said we can show it on the gallery wall, so keep an eye on <a href="https://madeofpixels.in/gallery">madeofpixels.in/gallery</a>.':' It stays private.')+'</p><p style="font-size:15px;line-height:1.6">Thinking of a website? Tell us about it at <a href="https://madeofpixels.in/contact">madeofpixels.in/contact</a>.</p><p style="font-size:14px;color:#555;margin-top:24px">MadeOfPixels Studio, Vasai West, Maharashtra</p>');
  return {subject:'Pixel sketch from '+(credit||email)+(ok?' (OK for gallery)':''),html,reply_to:email,to:email,ackSubject:'We got your pixel sketch',ack};
}

module.exports=async(req,res)=>{
  if(req.method!=='POST'){ res.setHeader('Allow','POST'); return send(res,405,{error:'POST only.'}); }
  const b=await readBody(req);
  if(b._gotcha) return send(res,200,{ok:true});                              // honeypot: bots only
  if(!mail.ready()) return send(res,503,{error:'Email sending is not set up on the server.'});
  const kind=b.kind||(b.message?'enquiry':'');
  if(!['enquiry','sketch'].includes(kind)) return send(res,400,{error:'Unknown form.'});
  const r=kind==='sketch'?sketch(b):enquiry(b);
  if(r.error) return send(res,400,{error:r.error});
  if(limited('submit:'+ip(req),6,60*60*1000)||limited('submitmail:'+r.to.toLowerCase(),4,24*60*60*1000)) return send(res,429,{error:'You have sent a few messages already. We will reply soon.'});
  try{
    await mail.send({to:mail.owner(),subject:r.subject,html:r.html,reply_to:r.reply_to});
  }catch(e){ console.error('[api/submit]',e.message); return send(res,502,{error:'We could not send your message right now. Please email hello@madeofpixels.in.'}); }
  if(process.env.AUTORESPONSE!=='off'){
    try{ await mail.send({to:r.to,subject:r.ackSubject,html:r.ack,reply_to:process.env.AUDIT_REPLY_TO||'hello@madeofpixels.in'}); }
    catch(e){ console.error('[api/submit] auto-reply failed:',e.message); }   // the enquiry itself already reached you
  }
  return send(res,200,{ok:true});
};
