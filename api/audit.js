// Free website audit: POST /api/audit {url,email,name}
// Fetches one page, checks speed / mobile / SEO / security basics, optionally adds Google PageSpeed data,
// and emails the result when RESEND_API_KEY and AUDIT_FROM are set. Results are always returned to the browser too.
const dns=require('dns').promises, net=require('net');
const {send,readBody,ip,limited}=require('./_lib');

const UA='MadeOfPixelsAudit/1.0 (+https://madeofpixels.in/free-website-audit)';
const MAX_BYTES=1500000;

/* ---------- SSRF guard: public http(s) hosts only ---------- */
function privateV4(a){
  const p=a.split('.').map(Number);
  return p[0]===0||p[0]===10||p[0]===127||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===192&&p[1]===0&&p[2]===0)||(p[0]===198&&(p[1]===18||p[1]===19))||p[0]>=224;
}
function privateIp(a){
  if(net.isIPv4(a)) return privateV4(a);
  const s=a.toLowerCase();
  if(s==='::1'||s==='::') return true;
  const m=s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); if(m) return privateV4(m[1]);
  return /^f[cd]/.test(s)||/^fe[89ab]/.test(s);
}
async function assertPublic(u){
  let url; try{ url=new URL(u); }catch(e){ throw new Error('That does not look like a valid web address.'); }
  if(!/^https?:$/.test(url.protocol)) throw new Error('Only http and https addresses can be audited.');
  if(url.username||url.password) throw new Error('Addresses with a username or password are not supported.');
  const host=url.hostname.replace(/^\[|\]$/g,'').toLowerCase();
  if(host==='localhost'||/\.(local|internal|localdomain|lan)$/.test(host)||!/[.:]/.test(host)) throw new Error('Please enter a public website address.');
  const ips=net.isIP(host)?[{address:host}]:await dns.lookup(host,{all:true}).catch(()=>{ throw new Error('We could not find that website. Check the address and try again.'); });
  if(!ips.length||ips.some(i=>privateIp(i.address))) throw new Error('Please enter a public website address.');
  return url;
}
async function get(url,opts={}){
  const t0=Date.now(); let cur=url, hops=0;
  for(;;){
    await assertPublic(cur);
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),opts.timeout||9000);
    let r;
    try{ r=await fetch(cur,{method:opts.method||'GET',redirect:'manual',signal:ctl.signal,headers:{'User-Agent':UA,'Accept':'text/html,application/xhtml+xml,*/*;q=0.8','Accept-Encoding':'gzip, br'}}); }
    catch(e){ clearTimeout(timer); throw new Error('We could not reach that website (it may be down or blocking automated checks).'); }
    clearTimeout(timer);
    if(r.status>=300&&r.status<400&&r.headers.get('location')){
      if(++hops>5) throw new Error('That address redirects too many times.');
      cur=new URL(r.headers.get('location'),cur).href; continue;
    }
    const ttfb=Date.now()-t0; let html='', bytes=0;
    if(opts.method!=='HEAD'&&r.body){
      const reader=r.body.getReader(), dec=new TextDecoder(); const chunks=[];
      while(true){ const {done,value}=await reader.read(); if(done) break; bytes+=value.length; chunks.push(dec.decode(value,{stream:true})); if(bytes>MAX_BYTES){ try{ reader.cancel(); }catch(e){} break; } }
      html=chunks.join('');
    }
    return {url:cur,status:r.status,headers:r.headers,html,bytes,ms:ttfb,redirects:hops};
  }
}

/* ---------- PageSpeed Insights (optional, best effort) ---------- */
async function psi(url){
  try{
    const key=process.env.PSI_API_KEY?'&key='+encodeURIComponent(process.env.PSI_API_KEY):'';
    const ctl=new AbortController(), t=setTimeout(()=>ctl.abort(),20000);
    const r=await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&url='+encodeURIComponent(url)+key,{signal:ctl.signal});
    clearTimeout(t); if(!r.ok) return null;
    const d=await r.json(), lh=d.lighthouseResult; if(!lh) return null;
    const c=k=>lh.categories&&lh.categories[k]&&Math.round(lh.categories[k].score*100);
    const a=k=>lh.audits&&lh.audits[k]?{v:lh.audits[k].numericValue,d:lh.audits[k].displayValue}:null;
    return {perf:c('performance'),seo:c('seo'),acc:c('accessibility'),bp:c('best-practices'),lcp:a('largest-contentful-paint'),cls:a('cumulative-layout-shift'),tbt:a('total-blocking-time')};
  }catch(e){ return null; }
}

/* ---------- checks ---------- */
const P='pass', W='warn', F='fail';
const tag=(html,re)=>{ const m=html.match(re); return m?m[1]:''; };
const decode=s=>String(s).replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
function analyse(page,extra,ps){
  const h=page.html, head=h.slice(0,200000), hdr=n=>page.headers.get(n)||'';
  const title=decode(tag(head,/<title[^>]*>([\s\S]*?)<\/title>/i));
  const desc=decode(tag(head,/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)||tag(head,/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i));
  const h1s=(h.match(/<h1[\s>]/gi)||[]).length, h2s=(h.match(/<h2[\s>]/gi)||[]).length;
  const imgs=h.match(/<img\b[^>]*>/gi)||[], noAlt=imgs.filter(i=>!/\salt=["'][^"']+["']/i.test(i)).length;
  const text=decode(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g,' ')), words=text?text.split(' ').length:0;
  const links=(h.match(/<a\b[^>]*href=/gi)||[]).length;
  const items=[]; const add=(group,label,status,note)=>items.push({group,label,status,note});
  const https=/^https:/i.test(page.url);

  // Speed
  add('Speed','Server response time',page.ms<800?P:page.ms<1800?W:F,page.ms+' ms to first response. Aim for under 800 ms.');
  const kb=Math.round(page.bytes/1024);
  add('Speed','HTML size',kb<150?P:kb<500?W:F,kb+' KB of HTML. Smaller pages load faster on mobile connections.');
  const enc=hdr('content-encoding'); add('Speed','Compression',/gzip|br|zstd|deflate/i.test(enc)?P:W,enc?'Served with '+enc+' compression.':'No gzip or Brotli compression was detected. Turning it on makes pages smaller and faster.');
  if(ps&&ps.perf!=null){
    add('Speed','Google PageSpeed (mobile)',ps.perf>=90?P:ps.perf>=50?W:F,'Performance score '+ps.perf+'/100 on a simulated mobile phone.');
    if(ps.lcp) add('Speed','Largest Contentful Paint',ps.lcp.v<=2500?P:ps.lcp.v<=4000?W:F,'Main content shown after '+(ps.lcp.d||Math.round(ps.lcp.v)+' ms')+'. Good is under 2.5 s.');
    if(ps.cls) add('Speed','Layout stability (CLS)',ps.cls.v<=.1?P:ps.cls.v<=.25?W:F,'Layout shift score '+(ps.cls.d||ps.cls.v.toFixed(2))+'. Good is under 0.1.');
    if(ps.tbt) add('Speed','Blocking time',ps.tbt.v<=200?P:ps.tbt.v<=600?W:F,'Total blocking time '+(ps.tbt.d||Math.round(ps.tbt.v)+' ms')+'. Lower feels more responsive.');
  }else add('Speed','Google PageSpeed (mobile)',W,'Google PageSpeed data was not available right now, so speed is judged from the server response only.');

  // Mobile
  const vp=tag(head,/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  add('Mobile','Mobile viewport',/width\s*=\s*device-width/i.test(vp)?P:F,vp?'Viewport is set to "'+vp+'".':'No viewport meta tag. Phones will show a zoomed-out desktop page.');
  if(ps&&ps.acc!=null) add('Mobile','Accessibility (mobile test)',ps.acc>=90?P:ps.acc>=70?W:F,'Accessibility score '+ps.acc+'/100. Readable text, contrast and labels help every visitor.');
  const bigImgs=imgs.filter(i=>!/\sloading=["']lazy["']/i.test(i)).length; add('Mobile','Image loading',imgs.length<=3||bigImgs<=3?P:W,imgs.length+' images found; '+bigImgs+' load immediately. Lazy-loading below-the-fold images saves mobile data.');

  // SEO
  add('SEO','Page title',title&&title.length>=30&&title.length<=65?P:title?W:F,title?'"'+title.slice(0,80)+'" ('+title.length+' characters). Aim for 30 to 65.':'No <title> found. This is the most important on-page SEO element.');
  add('SEO','Meta description',desc&&desc.length>=70&&desc.length<=160?P:desc?W:F,desc?desc.length+' characters. Aim for 70 to 160.':'No meta description. Google will invent one from your page.');
  add('SEO','Main heading (H1)',h1s===1?P:h1s===0?F:W,h1s===1?'Exactly one H1, as recommended.':h1s===0?'No H1 found.':h1s+' H1 headings found. Use one per page.');
  add('SEO','Subheadings (H2)',h2s>0?P:W,h2s>0?h2s+' H2 headings help structure the page.':'No H2 subheadings. Break content into sections.');
  add('SEO','Canonical link',/<link[^>]+rel=["']canonical["']/i.test(head)?P:W,/<link[^>]+rel=["']canonical["']/i.test(head)?'A canonical URL is set.':'No canonical link. It prevents duplicate-content problems.');
  const noindex=/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(head)||/noindex/i.test(hdr('x-robots-tag'));
  add('SEO','Indexable',noindex?F:P,noindex?'This page is set to noindex, so Google will not show it.':'Nothing blocks search engines from indexing this page.');
  add('SEO','Language',/<html[^>]+lang=["'][a-z]/i.test(head)?P:W,/<html[^>]+lang=["'][a-z]/i.test(head)?'Page language is declared.':'No lang attribute on <html>.');
  add('SEO','Image alt text',!imgs.length||noAlt===0?P:noAlt<=imgs.length/3?W:F,imgs.length?(imgs.length-noAlt)+' of '+imgs.length+' images have alt text.':'No images found.');
  add('SEO','Structured data (schema)',/application\/ld\+json/i.test(h)?P:W,/application\/ld\+json/i.test(h)?'JSON-LD structured data found.':'No schema markup. It helps Google show your business details.');
  add('SEO','Social sharing tags',/property=["']og:title["']/i.test(head)&&/property=["']og:image["']/i.test(head)?P:W,/property=["']og:title["']/i.test(head)?'Open Graph tags found.':'Missing Open Graph tags, so shared links look plain.');
  add('SEO','Content length',words>=300?P:words>=120?W:F,words+' words of text. Pages with some substance tend to rank better.');
  add('SEO','Internal links',links>=5?P:W,links+' links found on the page.');
  add('SEO','robots.txt',extra.robots?P:W,extra.robots?'robots.txt found.':'No robots.txt found.');
  add('SEO','XML sitemap',extra.sitemap?P:W,extra.sitemap?'sitemap.xml found.':'No sitemap.xml found at the usual address.');
  if(ps&&ps.seo!=null) add('SEO','Google SEO audit',ps.seo>=90?P:ps.seo>=70?W:F,'Lighthouse SEO score '+ps.seo+'/100.');

  // Trust & security
  add('Trust & security','HTTPS',https?P:F,https?'The page is served over HTTPS.':'The page is not served over HTTPS. Browsers will warn visitors.');
  add('Trust & security','HSTS header',hdr('strict-transport-security')?P:W,hdr('strict-transport-security')?'HSTS is on.':'No Strict-Transport-Security header.');
  const mixed=(h.match(/(?:src|href)=["']http:\/\/[^"']+/gi)||[]).filter(x=>/src=/i.test(x)).length;
  add('Trust & security','Mixed content',https&&mixed?W:P,https&&mixed?mixed+' resource(s) load over http on an https page.':'No insecure resources found.');
  add('Trust & security','Favicon',/<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(head)?P:W,/<link[^>]+rel=["'][^"']*icon/i.test(head)?'A favicon is set.':'No favicon link found.');

  const groups=[]; items.forEach(it=>{ let g=groups.find(x=>x.name===it.group); if(!g) groups.push(g={name:it.group,items:[]}); g.items.push({label:it.label,status:it.status,note:it.note}); });
  const pts=items.reduce((a,i)=>a+(i.status===P?1:i.status===W?.5:0),0), score=Math.round(pts/items.length*100);
  const fixes=items.filter(i=>i.status===F).concat(items.filter(i=>i.status===W)).slice(0,3).map(i=>i.label.toLowerCase());
  const summary=score>=85?'Strong foundations. A few small improvements could still help'+(fixes.length?': '+fixes.join(', ')+'.':'.'):score>=60?'A decent start with clear room to improve. Biggest wins: '+fixes.join(', ')+'.':'Your site is likely losing visitors and rankings. Start with: '+fixes.join(', ')+'.';
  return {score,groups,summary};
}

/* ---------- email (optional) ---------- */
async function emailResult(to,name,d){
  const key=process.env.RESEND_API_KEY, from=process.env.AUDIT_FROM; if(!key||!from) return false;
  const colour={pass:'#111110',warn:'#8a6d00',fail:'#c42b00'}, mark={pass:'OK',warn:'IMPROVE',fail:'FIX'};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const body=d.groups.map(g=>'<h3 style="font:700 13px monospace;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 8px">'+esc(g.name)+'</h3>'+g.items.map(i=>'<p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif"><b style="color:'+colour[i.status]+'">['+mark[i.status]+']</b> <b>'+esc(i.label)+'</b><br><span style="color:#555">'+esc(i.note)+'</span></p>').join('')).join('');
  const html='<div style="max-width:620px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111110"><p style="font:12px monospace;letter-spacing:.08em;text-transform:uppercase;color:#6b6a65">MadeOfPixels Studio</p><h1 style="font:700 28px/1.1 Arial,sans-serif;margin:8px 0">Your website audit</h1><p style="font-size:15px">Hi'+(name?' '+esc(name):'')+', here are the results for <b>'+esc(d.url)+'</b>.</p><p style="font:700 44px/1 Arial,sans-serif;margin:16px 0 4px">'+d.score+'<span style="font-size:16px;color:#6b6a65">/100</span></p><p style="font-size:15px;color:#333">'+esc(d.summary)+'</p>'+body+'<p style="margin-top:28px;font-size:14px">Want help fixing these? Reply to this email, WhatsApp us on +91 80803 56882 or visit <a href="https://madeofpixels.in/contact">madeofpixels.in/contact</a>. We reply within 24 hours.</p><p style="font-size:12px;color:#6b6a65">Bold by design. Built from scratch. Vasai West, Maharashtra.</p></div>';
  try{
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],reply_to:process.env.AUDIT_REPLY_TO||'hello@madeofpixels.in',subject:'Your website audit: '+d.score+'/100 for '+d.url.replace(/^https?:\/\//,'').slice(0,60),html})});
    return r.ok;
  }catch(e){ return false; }
}

module.exports=async(req,res)=>{
  if(req.method!=='POST'){ res.setHeader('Allow','POST'); return send(res,405,{error:'POST only.'}); }
  const b=await readBody(req), email=String(b.email||'').trim(), name=String(b.name||'').trim().slice(0,80);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>200) return send(res,400,{error:'Enter a valid email so we can send the results.'});
  if(limited('audit:'+ip(req),5,60*60*1000)||limited('auditmail:'+email.toLowerCase(),3,24*60*60*1000)) return send(res,429,{error:'You have run a few audits already. Please try again later.'});
  try{
    const start=await assertPublic(String(b.url||'').trim());
    const [page,ps]=await Promise.all([get(start.href),psi(start.href)]);
    if(page.status>=400) throw new Error('That page returned an error ('+page.status+'). Check the address.');
    if(!/html/i.test(page.headers.get('content-type')||'html')) throw new Error('That address does not look like a web page.');
    const origin=new URL(page.url).origin;
    const [rb,sm]=await Promise.all([get(origin+'/robots.txt',{method:'HEAD',timeout:5000}).catch(()=>null),get(origin+'/sitemap.xml',{method:'HEAD',timeout:5000}).catch(()=>null)]);
    const r=analyse(page,{robots:rb&&rb.status<400,sitemap:sm&&sm.status<400},ps);
    const out={url:page.url,score:r.score,summary:r.summary,groups:r.groups};
    out.emailed=await emailResult(email,name,out);
    return send(res,200,out);
  }catch(e){
    const known=/website|address|redirect|reach|page|public|http/i.test(e.message);
    if(!known) console.error('[api/audit]',e.message);
    return send(res,known?400:500,{error:known?e.message:'The audit hit an unexpected problem. Please try again.'});
  }
};
module.exports._test={analyse,privateIp};
