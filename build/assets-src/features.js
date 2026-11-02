/* ===================== EXTRAS: consent, strip, nudge, progress, page wipe, easter eggs, error log, audit, planner ===================== */
const MOP=window.MOP||{};
const store=(s=>({
  get:k=>{ try{ return s.getItem(k); }catch(e){ return null; } },
  set:(k,v)=>{ try{ s.setItem(k,v); }catch(e){} },
  del:k=>{ try{ s.removeItem(k); }catch(e){} }
}));
const safe=n=>{ try{ return window[n]; }catch(e){ return {getItem(){return null},setItem(){},removeItem(){}}; } };
const ls=store(safe('localStorage')), ss=store(safe('sessionStorage'));
const body=document.body;
const toast=(msg,ms=3200)=>{
  const t=document.createElement('div'); t.className='toast mono'; t.setAttribute('role','status'); t.textContent=msg; body.appendChild(t);
  setTimeout(()=>t.remove(),ms);
};

/* ---- cookie consent: analytics only load after "Accept" ---- */
(function(){
  const box=$('#consent'); if(!box) return;
  function loadAnalytics(){
    if(window.__mopAnalytics) return; window.__mopAnalytics=true;
    if(MOP.ga){
      const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+MOP.ga; document.head.appendChild(s);
      window.dataLayer=window.dataLayer||[]; window.gtag=function(){ dataLayer.push(arguments); };
      gtag('js',new Date()); gtag('config',MOP.ga,{anonymize_ip:true});
    }
    if(MOP.clarity){
      (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){ (c[a].q=c[a].q||[]).push(arguments); }; t=l.createElement(r); t.async=1; t.src='https://www.clarity.ms/tag/'+i; y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y); })(window,document,'clarity','script',MOP.clarity);
    }
  }
  const showBox=()=>{ box.hidden=false; body.classList.add('has-consent'); };
  const st=ls.get('mop-consent');
  if(st==='granted') loadAnalytics(); else if(!st) showBox();
  $$('[data-consent]',box).forEach(b=>b.addEventListener('click',()=>{
    const ok=b.dataset.consent==='accept';
    ls.set('mop-consent',ok?'granted':'denied'); box.hidden=true; body.classList.remove('has-consent');
    if(ok) loadAnalytics();
  }));
  const cs=$('#cookie-settings'); if(cs) cs.addEventListener('click',showBox);
})();

/* ---- reading progress, back to top, sticky quote strip (appears around 35% scroll) ---- */
(function(){
  const strip=$('#strip'), topBtn=$('#to-top'), bar=$('.read-progress i');
  let stripOff=body.classList.contains('no-strip')||!!ss.get('mop-strip-off'), tick=0;
  function upd(){
    tick=0;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight), p=Math.min(1,Math.max(0,scrollY/max));
    if(bar) bar.style.transform='scaleX('+p.toFixed(3)+')';
    if(topBtn) topBtn.hidden=p<.25;
    if(strip&&!stripOff){
      const show=p>=.35&&!body.classList.contains('has-consent')&&!locks;
      if(show===strip.hidden){ strip.hidden=!show; body.classList.toggle('strip-on',show); }
      body.style.setProperty('--strip-h',show?strip.offsetHeight+'px':'0px');
    }
  }
  addEventListener('scroll',()=>{ if(!tick) tick=requestAnimationFrame(upd); },{passive:true});
  addEventListener('resize',upd); upd();
  const x=$('#strip-x'); if(x) x.addEventListener('click',()=>{ stripOff=true; ss.set('mop-strip-off','1'); strip.hidden=true; body.classList.remove('strip-on'); body.style.setProperty('--strip-h','0px'); });
  if(topBtn) topBtn.addEventListener('click',()=>jump(0,false));
})();

/* ---- one-time nudge: exit intent on desktop, or deep scroll, at most once a week ---- */
(function(){
  const n=$('#nudge'); if(!n||body.classList.contains('no-strip')) return;
  const last=parseInt(ls.get('mop-nudge')||'0',10); if(last&&Date.now()-last<7*864e5) return;
  const born=Date.now(); let shown=false;
  function show(){
    if(shown||locks||body.classList.contains('has-consent')) return;
    shown=true; n.hidden=false; ls.set('mop-nudge',String(Date.now()));
  }
  const hide=()=>{ n.hidden=true; };
  $('#nudge-x').addEventListener('click',hide);
  $('a',n).addEventListener('click',hide);
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&!n.hidden) hide(); });
  document.addEventListener('mouseout',e=>{ if(!e.relatedTarget&&e.clientY<=0&&Date.now()-born>8000) show(); });
  addEventListener('scroll',()=>{ const p=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight); if(p>.6&&Date.now()-born>20000) show(); },{passive:true});
})();

/* ---- pixel wipe between pages ---- */
(function(){
  const w=$('#wipe'); if(!w||reduce) return;
  const root=document.documentElement;
  if(root.classList.contains('wipe-in')){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ w.classList.add('reveal'); root.classList.remove('wipe-in'); setTimeout(()=>w.classList.remove('reveal'),1000); }));
  }
  addEventListener('pageshow',e=>{ if(e.persisted){ w.classList.remove('cover'); root.classList.remove('wipe-in'); } });
  document.addEventListener('click',e=>{
    const a=e.target.closest&&e.target.closest('a[href]');
    if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    if((a.target&&a.target!=='_self')||a.hasAttribute('download')) return;
    const u=new URL(a.href,location.href);
    if(u.origin!==location.origin||/\.(xml|png|svg|txt|pdf)$/i.test(u.pathname)) return;
    if(u.pathname===location.pathname&&u.search===location.search) return;
    e.preventDefault(); ss.set('mop-wipe','1');
    w.classList.add('cover'); setTimeout(()=>{ location.href=u.href; },460);
  });
})();

/* ---- easter eggs: Konami code or typing "pixel" = pixel rain; "dark" toggles dark mode; "hire" opens the form; triple-click the logo ---- */
(function(){
  const root=document.documentElement;
  if(ls.get('mop-dark')==='1') root.classList.add('invert');
  function rain(){
    if(reduce){ toast('Pixel rain is paused because reduced motion is on.'); return; }
    const cv=document.createElement('canvas'); cv.className='rain'; cv.setAttribute('aria-hidden','true'); body.appendChild(cv);
    const ctx=cv.getContext('2d'), dpr=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr; ctx.scale(dpr,dpr);
    const ink=cssVar('--ink'), hot=cssVar('--accent'), cols=Math.ceil(innerWidth/20), P=[];
    for(let i=0;i<cols*2;i++) P.push({x:(i%cols)*20+Math.random()*8,y:-Math.random()*innerHeight*1.2,s:8+Math.random()*10,v:3+Math.random()*6,c:Math.random()<.1?hot:ink});
    const t0=performance.now();
    (function f(t){
      const el=t-t0; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.globalAlpha=el>3600?Math.max(0,1-(el-3600)/900):1;
      P.forEach(p=>{ p.y+=p.v; ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,p.s,p.s); });
      if(el<4500) requestAnimationFrame(f); else cv.remove();
    })(t0);
    toast('Pixel rain unlocked.');
  }
  const seq=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a']; let k=0, typed='';
  addEventListener('keydown',e=>{
    const t=e.target; if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const key=(e.key||'').toLowerCase();
    k=key===seq[k]?k+1:(key===seq[0]?1:0);
    if(k===seq.length){ k=0; rain(); }
    if(key.length===1){
      typed=(typed+key).slice(-5);
      if(typed==='pixel') rain();
      else if(typed.slice(-4)==='dark'){ const on=root.classList.toggle('invert'); ls.set('mop-dark',on?'1':'0'); toast(on?'Dark mode on. Type "dark" again to switch back.':'Dark mode off.'); }
      else if(typed.slice(-4)==='hire'&&dlg){ openContact(); }
    }
  });
  const logo=$('.logo'); let clicks=0, ct=0;
  if(logo) logo.addEventListener('click',e=>{ clicks++; clearTimeout(ct); ct=setTimeout(()=>clicks=0,600); if(clicks>=3){ clicks=0; e.preventDefault(); root.classList.toggle('invert'); toast('You found the secret switch.'); } });
  try{ console.log('%c■ MadeOfPixels Studio','font:700 14px monospace;color:#FF3B00','\nBuilt from scratch. Zero templates. Say hello: hello@madeofpixels.in'); }catch(_){}
})();

/* ---- basic client error log (read it in the Vercel function logs for /api/log) ---- */
(function(){
  let n=0;
  const send=o=>{
    if(n++>=3||location.hostname==='localhost') return;
    try{
      const b=JSON.stringify(Object.assign({url:location.href,ua:navigator.userAgent.slice(0,140)},o));
      if(navigator.sendBeacon) navigator.sendBeacon('/api/log',new Blob([b],{type:'application/json'}));
      else fetch('/api/log',{method:'POST',body:b,keepalive:true,headers:{'Content-Type':'application/json'}});
    }catch(_){}
  };
  addEventListener('error',e=>{ if(/ResizeObserver|Script error/.test(e.message||'')) return; send({type:'error',msg:String(e.message).slice(0,300),src:(e.filename||'').slice(-120),line:e.lineno}); });
  addEventListener('unhandledrejection',e=>send({type:'promise',msg:String((e.reason&&e.reason.message)||e.reason).slice(0,300)}));
})();

/* ---- contact page: pick up a plan sent from /process ---- */
(function(){
  if(!pageForm) return;
  const raw=ss.get('mop-prefill'); if(!raw) return; ss.del('mop-prefill');
  try{
    const d=JSON.parse(raw), sel=pageForm.elements.type;
    [...sel.options].forEach(o=>{ if(o.text===d.type) sel.value=o.value||o.text; });
    if(d.message&&!pageForm.elements.message.value.trim()) pageForm.elements.message.value=d.message;
  }catch(_){}
})();

/* ---- free website audit ---- */
(function(){
  const f=$('#audit-form'); if(!f) return;
  const out=$('#audit-out'), status=$('#au-status'), btn=$('#au-btn'), label=btn.textContent;
  const err=(id,m)=>{ const e=$('#'+id); if(e) e.textContent=m||''; };
  const norm=u=>{ u=u.trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u)) u='https://'+u; return u; };
  const ICON={pass:'✓',warn:'!',fail:'✗'}, WORD={pass:'Good',warn:'Improve',fail:'Fix'};
  function meter(score){ let s=''; for(let i=1;i<=20;i++) s+='<i'+(i<=Math.round(score/5)?' class="on"':'')+'></i>'; return '<div class="meter" role="img" aria-label="Score '+score+' out of 100">'+s+'</div>'; }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  async function sendReport(d,b2,st){
    b2.disabled=true; b2.textContent='Sending…'; st.textContent='';
    const body={url:d.url,score:d.score,summary:d.summary,groups:d.groups,email:d.email,name:d.name,ts:d.ts,sig:d.sig};
    const done=()=>{ b2.textContent='Sent ✓'; st.textContent='Thanks! We have your report and will reply within 24 hours.'; if(window.gtag) gtag('event','generate_lead',{event_category:'audit'}); };
    try{
      const r=await fetch('/api/audit-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json().catch(()=>({}));
      if(r.ok) return done();
      if(!j.fallback) throw new Error(j.error||'Could not send the report.');
      /* email service unavailable: send the same report through the Formspree form instead */
      const fd=new FormData(); fd.append('_subject','Free website audit request'); fd.append('email',d.email); fd.append('name',d.name); fd.append('website',d.url); fd.append('score',d.score+'/100');
      fd.append('message','Audit request for '+d.url+'. Score '+d.score+'/100.\n'+d.summary+'\n\n'+d.groups.map(g=>g.name+'\n'+g.items.map(i=>'['+i.status+'] '+i.label+': '+i.note).join('\n')).join('\n\n'));
      const fr=await fetch(MOP.form,{method:'POST',body:fd,headers:{Accept:'application/json'}}); if(!fr.ok) throw new Error('Could not send the report.');
      done();
    }catch(ex){ b2.disabled=false; b2.textContent='Send this report to us →'; st.textContent=ex.message+' You can also email hello@madeofpixels.in.'; }
  }
  function render(d){
    const groups=d.groups.map(g=>'<section class="au-g"><h3 class="mono">'+esc(g.name)+'</h3><ul>'+g.items.map(it=>'<li class="'+it.status+'"><span class="au-s mono" aria-label="'+WORD[it.status]+'">'+ICON[it.status]+'</span><div><b>'+esc(it.label)+'</b><p>'+esc(it.note)+'</p></div></li>').join('')+'</ul></section>').join('');
    out.innerHTML='<div class="au-head"><div><p class="mono faint">Audit for '+esc(d.url)+'</p><p class="au-score">'+d.score+'<small>/100</small></p>'+meter(d.score)+'</div><p class="au-sum">'+esc(d.summary)+'</p></div>'+groups+
      '<div class="au-send"><p class="mono faint">Want help fixing these?</p><p class="au-sendp">Send this report to MadeOfPixels and we will reply within 24 hours with how we would fix it. No commitment.</p><div class="actions"><button class="btn btn-primary" type="button" id="au-send">Send this report to us →</button><a class="btn" href="'+MOP.wa+'?text='+encodeURIComponent('Hi, I ran the free audit for '+d.url+' and would like help.')+'" target="_blank" rel="noopener noreferrer">WhatsApp us</a></div><p class="mono" id="au-send-s" role="status" aria-live="polite"></p></div>';
    $('#au-send',out).addEventListener('click',()=>sendReport(d,$('#au-send',out),$('#au-send-s',out)));
    out.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }
  f.addEventListener('submit',async e=>{
    e.preventDefault(); err('au-url-e'); err('au-email-e'); err('au-consent-e'); status.classList.remove('show');
    if(f.elements._gotcha.value) return;
    const url=norm(f.elements.url.value), email=f.elements.email.value.trim(), name=f.elements.name.value.trim();
    let bad=false;
    if(!/^https?:\/\/[^\s/]+\.[^\s/]{2,}/i.test(url)){ err('au-url-e','Enter a valid website address.'); bad=true; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ err('au-email-e','Enter a valid email.'); bad=true; }
    if(!f.elements.consent.checked){ err('au-consent-e','Please tick the box to continue.'); bad=true; }
    if(bad) return;
    btn.disabled=true; btn.textContent='Running…'; out.innerHTML=''; status.textContent='Running the audit. This can take up to 30 seconds.'; status.classList.add('show');
    try{
      const r=await fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,email,name})});
      const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||'The audit could not be completed.');
      status.classList.remove('show'); render(d);
      if(window.gtag) gtag('event','audit_run',{event_category:'audit'});
    }catch(ex){ status.textContent=ex.message+' You can also email '+'hello@madeofpixels.in'+' and we will run it for you.'; status.classList.add('show'); }
    btn.disabled=false; btn.textContent=label;
  });
})();

/* ---- process planner: a project plays out in pixels; estimator numbers drive the range ---- */
(function(){
  const root=$('#planner'); if(!root) return;
  const pick=n=>{ const c=$('input[name="'+n+'"]:checked',root); return c?c.value:null; };
  const lab=n=>{ const c=$('input[name="'+n+'"]:checked',root); return c?c.parentElement.textContent.trim():''; };
  const BUILD={'1':[3,5],'2-5':[7,14],'6-10':[14,21],'10+':[21,35]}, COMPLEX={'Web App':1.5,'E-commerce':1.5}, SPEED={standard:1,fast:.75,flexible:1.15};
  const NAMES=['Brief','Design','Build','Launch'], N=48;
  const grid=$('#ptl'), labels=$('#ptl-labels'), range=$('#ptl-range'), dayEl=$('#ptl-day'), play=$('#ptl-play');
  const fmt=n=>ESTIMATOR.currency+' '+new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(n);
  let M=null, sq=[], playing=0;
  function weeks(d){ return d<=10?d+' day'+(d===1?'':'s'):(Math.round(d/7*2)/2)+' weeks'; }
  function price(){
    const t=pick('plan-type'), b=ESTIMATOR.base[t], pg=ESTIMATOR.pages[pick('plan-pages')], m=ESTIMATOR.timeline[pick('plan-time')], s=ESTIMATOR.spread, r=ESTIMATOR.round;
    if(![b,pg,m,s].every(v=>typeof v==='number')) return '';
    const lo=Math.round((b+pg)*m/r)*r; return fmt(lo)+' – '+fmt(Math.round(lo*s/r)*r);
  }
  function build(){
    const t=pick('plan-type'), cx=COMPLEX[t]||1, sp=SPEED[pick('plan-time')]||1;
    const days=[[1,2],[3,5],BUILD[pick('plan-pages')].map(x=>Math.round(x*cx)),[1,2]].map(r=>r.map(x=>Math.max(1,Math.round(x*sp))));
    const lo=days.reduce((a,r)=>a+r[0],0), hi=days.reduce((a,r)=>a+r[1],0);
    let counts=days.map(r=>Math.max(3,Math.round(r[1]/hi*N))), diff=N-counts.reduce((a,c)=>a+c,0); counts[2]+=diff;
    M={days,lo,hi,counts};
    grid.innerHTML=''; sq=[]; labels.innerHTML='';
    counts.forEach((c,si)=>{
      for(let i=0;i<c;i++){ const q=document.createElement('i'); q.dataset.s=si; grid.appendChild(q); sq.push(q); }
      const l=document.createElement('span'); l.style.flex=c; l.textContent=NAMES[si]; labels.appendChild(l);
    });
    $('#plan-time').textContent=weeks(lo)+' to '+weeks(hi);
    const pr=price(); $('#plan-price').textContent=pr||'Custom quote';
    paint();
  }
  function paint(){
    const f=range.value/100, on=Math.round(f*N);
    sq.forEach((q,i)=>{ q.classList.toggle('on',i<on); q.classList.toggle('hot',i===on-1&&on>0&&on<N); });
    const day=Math.round(f*M.hi); let acc=0, si=0; for(let s=0;s<4;s++){ acc+=M.days[s][1]; if(day<=acc){ si=s; break; } si=3; }
    dayEl.textContent=day===0?'Day 0: the brief arrives.':'Day '+day+' of about '+M.hi+' · '+NAMES[si];
    $$('#ptl-labels span').forEach((s,i)=>s.classList.toggle('now',i===si&&day>0));
  }
  root.addEventListener('change',()=>{ stop(); range.value=0; build(); });
  range.addEventListener('input',()=>{ stop(); paint(); });
  function stop(){ if(playing){ clearInterval(playing); playing=0; play.textContent='Play the project ▶'; } }
  play.addEventListener('click',()=>{
    if(playing){ stop(); return; }
    if(reduce){ range.value=100; paint(); return; }
    if(+range.value>=100) range.value=0;
    play.textContent='Pause ❚❚'; playing=setInterval(()=>{ range.value=Math.min(100,+range.value+2); paint(); if(+range.value>=100) stop(); },70);
  });
  $('#plan-use').addEventListener('click',()=>{
    const type=pick('plan-type'), pr=price();
    ss.set('mop-prefill',JSON.stringify({type,message:'Project plan\nProject: '+type+'\nPages: '+lab('plan-pages')+'\nTimeline: '+lab('plan-time')+'\nEstimated time: '+$('#plan-time').textContent+(pr?'\nRange: '+pr:'')+'\n\n'}));
    ss.set('mop-wipe','1'); location.href='/contact#enquiry';
  });
  build();
})();

/* ---- header "Tools" dropdown ---- */
(function(){
  const dd=$('#dd-tools'); if(!dd) return;
  const btn=$('.dd-btn',dd);
  const set=o=>{ dd.classList.toggle('open',o); btn.setAttribute('aria-expanded',String(o)); };
  btn.addEventListener('click',e=>{ e.stopPropagation(); set(!dd.classList.contains('open')); });
  document.addEventListener('click',e=>{ if(!dd.contains(e.target)) set(false); });
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&dd.classList.contains('open')){ set(false); btn.focus(); } });
  $$('.dd-item',dd).forEach(a=>a.addEventListener('click',()=>set(false)));
})();
