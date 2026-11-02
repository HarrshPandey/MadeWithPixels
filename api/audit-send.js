// POST /api/audit-send: emails a finished audit report to MadeOfPixels (via Resend) when the visitor presses "Send this report to us".
// The report must be the signed object returned by /api/audit, so nobody can use this endpoint to email arbitrary text.
// Env: RESEND_API_KEY, AUDIT_FROM (sender on a verified Resend domain), AUDIT_TO (optional, defaults to hello@madeofpixels.in).
const {send,readBody,ip,limited,verify,canonical}=require('./_lib');

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const colour={pass:'#111110',warn:'#8a6d00',fail:'#c42b00'}, mark={pass:'OK',warn:'IMPROVE',fail:'FIX'};

function html(d){
  const body=d.groups.map(g=>'<h3 style="font:700 13px monospace;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 8px">'+esc(g.name)+'</h3>'+g.items.map(i=>'<p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif"><b style="color:'+colour[i.status]+'">['+(mark[i.status]||esc(i.status))+']</b> <b>'+esc(i.label)+'</b><br><span style="color:#555">'+esc(i.note)+'</span></p>').join('')).join('');
  return '<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111110"><p style="font:12px monospace;letter-spacing:.08em;text-transform:uppercase;color:#6b6a65">New audit request</p><h1 style="font:700 26px/1.15 Arial,sans-serif;margin:8px 0">'+esc(d.url)+'</h1>'
   +'<table style="font-size:14px;margin:12px 0 4px"><tr><td style="color:#6b6a65;padding-right:12px">Name</td><td>'+(esc(d.name)||'(not given)')+'</td></tr><tr><td style="color:#6b6a65;padding-right:12px">Email</td><td><a href="mailto:'+esc(d.email)+'">'+esc(d.email)+'</a></td></tr></table>'
   +'<p style="font:700 44px/1 Arial,sans-serif;margin:16px 0 4px">'+d.score+'<span style="font-size:16px;color:#6b6a65">/100</span></p><p style="font-size:15px;color:#333">'+esc(d.summary)+'</p>'+body
   +'<p style="margin-top:28px;font-size:14px">Reply to this email to answer them directly. They asked for help with this report.</p></div>';
}

module.exports=async(req,res)=>{
  if(req.method!=='POST'){ res.setHeader('Allow','POST'); return send(res,405,{error:'POST only.'}); }
  const b=await readBody(req), d=canonical(b);
  if(!process.env.RESEND_API_KEY||!process.env.AUDIT_FROM) return send(res,503,{error:'Email sending is not set up on the server.',fallback:true});
  if(!verify(d,b.sig)) return send(res,400,{error:'This report could not be verified. Please run the audit again.'});
  if(Date.now()-d.ts>2*60*60*1000||d.ts>Date.now()+60000) return send(res,400,{error:'This report has expired. Please run the audit again.'});
  if(limited('asend:'+ip(req),6,60*60*1000)||limited('asendmail:'+d.email.toLowerCase(),3,24*60*60*1000)) return send(res,429,{error:'You have already sent a few reports. We will be in touch soon.'});
  try{
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
      from:process.env.AUDIT_FROM,to:[process.env.AUDIT_TO||'hello@madeofpixels.in'],reply_to:d.email,
      subject:'Audit request: '+d.url.replace(/^https?:\/\//,'').slice(0,60)+' ('+d.score+'/100)'+(d.name?' from '+d.name.slice(0,40):''),html:html(d)})});
    if(!r.ok){ const t=await r.text().catch(()=>''); console.error('[api/audit-send] resend',r.status,t.slice(0,200)); return send(res,502,{error:'We could not send the email right now.',fallback:true}); }
    return send(res,200,{ok:true});
  }catch(e){ console.error('[api/audit-send]',e.message); return send(res,500,{error:'We could not send the email right now.',fallback:true}); }
};
