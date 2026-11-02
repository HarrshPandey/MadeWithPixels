/* MadeOfPixels Studio: shared site script. Every feature checks that its elements exist, so one file serves every page. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let lenis=null;                                   // set at the bottom when Lenis loads
const navH=()=>parseFloat(cssVar('--nav-h'))||60;
const topOf=el=>el.hasAttribute('data-pre')?0:el.getBoundingClientRect().top+scrollY-navH();
function jump(y,now){ if(lenis) lenis.scrollTo(y,{immediate:!!now}); else scrollTo({top:y,behavior:(now||reduce)?'auto':'smooth'}); }
function goTo(el){ jump(topOf(el),false); }
let locks=0;                                      // modal scroll lock shared by every dialog
function lockScroll(on){
  locks=Math.max(0,locks+(on?1:-1));
  document.documentElement.style.overflow=locks?'hidden':'';
  if(lenis){ if(locks) lenis.stop(); else lenis.start(); }
}

/* placeholder links stay inert until a real URL is set */
$$('a[data-ph]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));

/* pixel glyphs: 1 = ink square, 2 = accent square */
$$('[data-px]').forEach(el=>{
  const rows=el.dataset.px.split('/');
  el.style.setProperty('--cols',rows[0].length);
  el.innerHTML=rows.join('').split('').map(c=>'<i'+(c==='1'?' class="on"':c==='2'?' class="hot"':'')+'></i>').join('');
  el.setAttribute('aria-hidden','true');
});

/* mobile menu */
const nav=$('#nav'), mbtn=$('.menu-btn');
function closeMenu(){ nav.classList.remove('open'); mbtn.setAttribute('aria-expanded','false'); }
mbtn.addEventListener('click',()=>{const o=nav.classList.toggle('open');mbtn.setAttribute('aria-expanded',o)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();mbtn.focus()}});

/* scroll reveals */
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -4% 0px'});
const watchReveals=(root=document)=>$$('.rv:not(.in)',root).forEach(el=>{ if(reduce) el.classList.add('in'); else rio.observe(el) });
watchReveals();

/* ---------- home hero: wordmark fit, square row, marquee ---------- */
const wm=$('#wm');
function fitWordmark(){
  if(!wm) return;
  const avail=wm.parentElement.clientWidth-parseFloat(getComputedStyle(wm.parentElement).paddingLeft)*2;
  const lines=$$('.wm-line',wm), stack=innerWidth<760;
  wm.classList.toggle('stack',stack);
  wm.style.fontSize='100px'; lines.forEach(l=>l.style.fontSize='');
  if(!stack){
    wm.style.fontSize=(100*avail/wm.getBoundingClientRect().width)+'px';
  }else{
    lines.forEach(l=>{l.style.fontSize='100px';l.style.fontSize=(100*avail/l.getBoundingClientRect().width)+'px'});
    wm.style.fontSize='100px';
  }
}
const row=$('#sqrow');
if(row){
  const count=innerWidth<700?24:48;
  row.innerHTML='<i></i>'.repeat(count);
  const sq=[...row.children];
  sq.forEach((s,i)=>{ if(reduce) s.classList.add('on'); else setTimeout(()=>s.classList.add('on'),i*28); });
  if(!reduce){
    let last=null;
    setTimeout(()=>setInterval(()=>{
      if(last) last.classList.remove('hot');
      const s=sq[Math.floor(Math.random()*sq.length)];
      s.classList.toggle('on'); s.classList.add('hot'); last=s;
    },2000),count*28+600);
  }
}
$$('.marquee').forEach(m=>{                         // repeat items until one set covers the viewport, then double
  const track=$('.mq-track',m), set=track.firstElementChild, items=[...set.children];
  let guard=0;
  while(set.getBoundingClientRect().width<innerWidth*1.1 && guard++<6) items.forEach(i=>set.appendChild(i.cloneNode(true)));
  const twin=set.cloneNode(true); twin.setAttribute('aria-hidden','true'); track.appendChild(twin);
});

/* ---------- pixelating wordmark: letters shatter into squares around the cursor, then reform ---------- */
(function(){
  if(!wm||reduce) return;                       // works with a mouse (hover) and with touch (press and hold on the wordmark)
  const wrap=wm.parentElement, cv=document.createElement('canvas'), ctx=cv.getContext('2d');
  if(!('letterSpacing' in ctx)) return;
  cv.className='wm-canvas'; cv.setAttribute('aria-hidden','true'); wrap.appendChild(cv);
  let parts=[], W=0, H=0, dpr=1, cell=4, key='', pt=null, running=false, ink='#111', hot='#f30';
  function build(){
    const r=wm.getBoundingClientRect(), wr=wrap.getBoundingClientRect();
    const k=Math.round(r.width)+'x'+Math.round(r.height)+'|'+wm.style.fontSize+'|'+wm.className;
    if(k===key&&parts.length) return;
    key=k; W=Math.ceil(r.width); H=Math.ceil(r.height); dpr=Math.min(devicePixelRatio||1,2);
    Object.assign(cv.style,{left:(r.left-wr.left)+'px',top:(r.top-wr.top)+'px',width:W+'px',height:H+'px'});
    cv.width=W*dpr; cv.height=H*dpr;
    const off=document.createElement('canvas'); off.width=W; off.height=H;
    const o=off.getContext('2d',{willReadFrequently:true});
    o.fillStyle='#000';
    $$('.wm-line',wm).forEach(line=>{
      const cs=getComputedStyle(line), lr=line.getBoundingClientRect();
      const probe=document.createElement('span');
      probe.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
      line.appendChild(probe); const base=probe.getBoundingClientRect().bottom; probe.remove();
      o.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily; o.letterSpacing=cs.letterSpacing;
      o.fillText(line.textContent.toUpperCase(),lr.left-r.left,base-r.top);
    });
    cell=Math.max(3,Math.round(parseFloat(wm.style.fontSize||'100')/38));
    const d=o.getImageData(0,0,W,H).data; parts=[];
    for(let y=0;y<H;y+=cell) for(let x=0;x<W;x+=cell){
      const cx=Math.min(W-1,x+(cell>>1)), cy=Math.min(H-1,y+(cell>>1));
      if(d[(cy*W+cx)*4+3]>110) parts.push({hx:x,hy:y,x:x,y:y,vx:0,vy:0});
    }
  }
  function frame(){
    const R=130;
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    let moving=false; const flying=[];
    ctx.fillStyle=ink;
    for(const p of parts){
      if(pt){
        const dx=p.x+cell/2-pt.x, dy=p.y+cell/2-pt.y, d2=dx*dx+dy*dy;
        if(d2<R*R){ const d=Math.sqrt(d2)||1, f=Math.pow(1-d/R,2)*13; p.vx+=dx/d*f+(Math.random()-.5)*2.2; p.vy+=dy/d*f+(Math.random()-.5)*2.2; }
      }
      p.vx+=(p.hx-p.x)*.055; p.vy+=(p.hy-p.y)*.055; p.vx*=.85; p.vy*=.85; p.x+=p.vx; p.y+=p.vy;
      const away=Math.abs(p.hx-p.x)+Math.abs(p.hy-p.y);
      if(away>.6||Math.abs(p.vx)+Math.abs(p.vy)>.15) moving=true;
      if(away>46) flying.push(p); else ctx.fillRect(p.x,p.y,cell,cell);
    }
    ctx.fillStyle=hot; for(const p of flying) ctx.fillRect(p.x,p.y,cell,cell);
    if(pt||moving) requestAnimationFrame(frame);
    else{ running=false; wm.classList.remove('is-px'); cv.style.opacity='0'; }
  }
  const move=e=>{ const r=cv.getBoundingClientRect(); pt={x:e.clientX-r.left,y:e.clientY-r.top}; };
  wm.addEventListener('pointerenter',e=>{
    build(); if(!parts.length) return;
    ink=cssVar('--ink'); hot=cssVar('--accent'); move(e);
    if(!running){ running=true; wm.classList.add('is-px'); cv.style.opacity='1'; requestAnimationFrame(frame); }
  });
  wm.addEventListener('pointermove',move);
  wm.addEventListener('pointerleave',()=>{ pt=null; });
})();

/* ---------- magnetic buttons ---------- */
if(!reduce&&fine){
  $$('.btn').forEach(el=>{
    let c=null;
    el.addEventListener('pointerenter',()=>{ const r=el.getBoundingClientRect(); c={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}; });
    el.addEventListener('pointermove',e=>{
      if(!c) return;
      el.style.transform='translate('+(((e.clientX-c.x)/c.w)*14).toFixed(1)+'px,'+(((e.clientY-c.y)/c.h)*10).toFixed(1)+'px)';
    });
    el.addEventListener('pointerleave',()=>{ c=null; el.style.transform=''; });
  });
}

/* ---------- enquiry forms (emailed through /api/submit) + contact lightbox ---------- */
const rules={
  name:v=>v.trim().length>=2||'Tell us your name.',
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Enter a valid email.',
  phone:v=>!v.trim()||/^\+?[0-9\s\-()]{7,18}$/.test(v.trim())||'Digits, spaces, + or - only.',
  type:v=>!!v||'Pick a project type.',
  budget:()=>true,
  message:v=>v.trim().length>=20||'Give us at least 20 characters.'
};
function initForm(form,onSent){
  const status=$('.form-status',form), btn=$('button[type="submit"]',form), label=btn.textContent;
  const field=n=>form.elements[n];
  function check(n){
    const f=field(n), r=rules[n](f.value), e=$('.err[data-for="'+n+'"]',form);
    e.textContent=r===true?'':r;
    if(r===true) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid','true');
    return r===true;
  }
  const say=m=>{status.textContent=m;status.classList.add('show')};
  Object.keys(rules).forEach(n=>{
    field(n).addEventListener('blur',()=>check(n));
    field(n).addEventListener('input',()=>{ if(field(n).getAttribute('aria-invalid')) check(n) });
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    status.classList.remove('show');
    const bad=Object.keys(rules).filter(n=>!check(n));
    if(bad.length){ field(bad[0]).focus(); say('Fix '+bad.length+' field'+(bad.length>1?'s':'')+' and try again.'); return; }
    if(field('_gotcha').value) return;                       // honeypot: bots only
    btn.disabled=true; btn.textContent='Sending…';
    try{
      const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign(Object.fromEntries(new FormData(form)),{kind:'enquiry',source:form.dataset.enquiry,page:location.pathname}))});
      if(res.ok){
        form.reset(); say('Sent. We’ll be in touch within 24 hours.');
        if(window.gtag) gtag('event','generate_lead',{event_category:'form',event_label:form.dataset.enquiry});
        if(onSent) onSent();
      }else{
        let msg='Something went wrong. Email us at hello@madeofpixels.in';
        try{ const d=await res.json(); if(d.error) msg=d.error; }catch(_){}
        say(msg);
      }
    }catch(_){ say('Network error. Email us at hello@madeofpixels.in'); }
    btn.disabled=false; btn.textContent=label;
  });
}
const dlg=$('#contact-dialog');
const pageForm=$('form[data-enquiry="page"]'), dlgForm=$('form[data-enquiry="dialog"]');
if(pageForm) initForm(pageForm);
if(dlgForm) initForm(dlgForm,()=>setTimeout(()=>closeContact(),2400));
/* Chromium delivers a dialog's close event on the next animation frame, so cleanup also runs directly when we close it ourselves */
let contactLocked=false;
function afterContactClose(){
  if(contactLocked){ contactLocked=false; lockScroll(false); }
  if(dlgForm&&dlgForm.elements.sketch) dlgForm.elements.sketch.value='';
  const n=$('#dlg-sketch-note'); if(n) n.hidden=true;
}
function closeContact(){ if(dlg.open) dlg.close(); afterContactClose(); }
function openContact(opts){
  if(!dlg||typeof dlg.showModal!=='function') return false;
  closeMenu();
  if(opts&&dlgForm){
    if(opts.type){ const sel=dlgForm.elements.type; [...sel.options].forEach(o=>{ if(o.text===opts.type) sel.value=o.value||o.text; }); }
    if(opts.message&&!dlgForm.elements.message.value.trim()) dlgForm.elements.message.value=opts.message;
  }
  if(!dlg.open){ lockScroll(true); contactLocked=true; dlg.showModal(); }
  return true;
}
if(dlg){
  $$('[data-open-contact]').forEach(a=>a.addEventListener('click',e=>{ if(openContact()) e.preventDefault(); }));
  $('#dlg-close').addEventListener('click',closeContact);
  dlg.addEventListener('click',e=>{ if(e.target===dlg) closeContact() });
  dlg.addEventListener('close',afterContactClose);
}

/* ---------- project estimator ----------
   low  = (base[type] + pages[tier]) x timeline[option], rounded to the nearest 500
   high = low x spread
   A custom website with 2-5 pages starts at Rs 25,000; edit the numbers below to change the quotes. */
const ESTIMATOR={
  currency:'₹',
  base:{ 'Custom Website':20000,'UI/UX Design':25000,'Brand Identity':20000,'Web App':60000,'E-commerce':45000,'Landing Page':10000,'Maintenance':3000 },
  pages:{ '1':0,'2-5':5000,'6-10':10000,'10+':25000 },
  timeline:{ standard:1, fast:1.25, flexible:0.9 },
  spread:1.6,
  round:500
};
(function(){
  const root=$('#estimator'); if(!root||!pageForm) return;
  const fig=$('#est-figure'), note=$('#est-note'), use=$('#est-use');
  const pick=n=>$('input[name="'+n+'"]:checked',root);
  const val=n=>{const c=pick(n);return c?c.value:null};
  const lab=n=>{const c=pick(n);return c?c.parentElement.textContent.trim():''};
  const fmt=n=>ESTIMATOR.currency+' '+new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(n);
  let range='';
  function calc(){
    const type=val('est-type');
    if(!type){ fig.textContent='—'; fig.classList.remove('ph'); note.textContent='Pick a project type to begin.'; use.disabled=true; range=''; return; }
    use.disabled=false;
    const b=ESTIMATOR.base[type], pg=ESTIMATOR.pages[val('est-pages')], m=ESTIMATOR.timeline[val('est-time')], s=ESTIMATOR.spread;
    if([b,pg,m,s].every(v=>typeof v==='number')){
      const r=ESTIMATOR.round, lo=Math.round((b+pg)*m/r)*r, hi=Math.round(lo*s/r)*r; range=fmt(lo)+' – '+fmt(hi);
      fig.classList.remove('ph'); note.textContent='A rough range for planning. Your final quote comes after the brief.';
    }else{
      range=''; fig.classList.add('ph'); note.textContent='Tell us about it and we’ll quote it.';
    }
    fig.textContent=range||'Custom quote';
  }
  root.addEventListener('change',calc); calc();
  use.addEventListener('click',()=>{
    const type=lab('est-type'), sel=pageForm.elements.type, msg=pageForm.elements.message;
    [...sel.options].forEach(o=>{ if(o.text===type) sel.value=o.value||o.text; });
    const head='Estimate request\nProject: '+type+'\nPages: '+lab('est-pages')+'\nTimeline: '+lab('est-time')+(range?'\nRange: '+range:'')+'\n\n';
    msg.value=head+msg.value.replace(/^Estimate request[\s\S]*?\n\n/,'');
    ['type','message'].forEach(n=>pageForm.elements[n].dispatchEvent(new Event('input')));
    jump(topOf(pageForm)-24,false);
    setTimeout(()=>msg.focus({preventScroll:true}),700);
  });
})();

/* ---------- draw with pixels ---------- */
(function(){
  const cv=$('#sk-canvas'); if(!cv) return;
  const ctx=cv.getContext('2d'), N=16, grid=new Array(N*N).fill(0), status=$('#sk-status');
  let cell=24, dpr=1, hover=-1, cur=0, focused=false, paint=null;
  function render(){
    const w=cv.width; ctx.clearRect(0,0,w,w);
    if(hover>=0&&!grid[hover]){ ctx.fillStyle=cssVar('--paper-2'); ctx.fillRect((hover%N)*cell,Math.floor(hover/N)*cell,cell,cell); }
    ctx.fillStyle=cssVar('--ink');
    grid.forEach((v,i)=>{ if(v) ctx.fillRect((i%N)*cell,Math.floor(i/N)*cell,cell,cell); });
    ctx.strokeStyle=cssVar('--rule'); ctx.lineWidth=Math.max(1,dpr); ctx.beginPath();
    for(let i=1;i<N;i++){ ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,w); ctx.moveTo(0,i*cell); ctx.lineTo(w,i*cell); }
    ctx.stroke();
    if(focused){ ctx.strokeStyle=cssVar('--accent'); ctx.lineWidth=2*dpr; ctx.strokeRect((cur%N)*cell+dpr,Math.floor(cur/N)*cell+dpr,cell-2*dpr,cell-2*dpr); }
  }
  function size(){ dpr=Math.min(devicePixelRatio||1,2); cv.width=Math.round(cv.clientWidth*dpr); cv.height=cv.width; cell=cv.width/N; render(); }
  const at=e=>{ const r=cv.getBoundingClientRect(); const x=Math.min(N-1,Math.max(0,Math.floor((e.clientX-r.left)/r.width*N))), y=Math.min(N-1,Math.max(0,Math.floor((e.clientY-r.top)/r.height*N))); return y*N+x; };
  cv.addEventListener('pointerdown',e=>{ cv.setPointerCapture(e.pointerId); const i=at(e); paint=grid[i]?0:1; grid[i]=paint; status.textContent=''; render(); });
  cv.addEventListener('pointermove',e=>{ const i=at(e); hover=i; if(paint!==null) grid[i]=paint; render(); });
  ['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>{ paint=null; }));
  cv.addEventListener('pointerleave',()=>{ hover=-1; render(); });
  cv.addEventListener('focus',()=>{ focused=true; render(); });
  cv.addEventListener('blur',()=>{ focused=false; render(); });
  cv.addEventListener('keydown',e=>{
    const k=e.key, x=cur%N, y=Math.floor(cur/N);
    if(k==='ArrowLeft') cur=y*N+Math.max(0,x-1);
    else if(k==='ArrowRight') cur=y*N+Math.min(N-1,x+1);
    else if(k==='ArrowUp') cur=Math.max(0,y-1)*N+x;
    else if(k==='ArrowDown') cur=Math.min(N-1,y+1)*N+x;
    else if(k===' '||k==='Enter') grid[cur]=grid[cur]?0:1;
    else return;
    e.preventDefault(); render();
  });
  $('#sk-clear').addEventListener('click',()=>{ grid.fill(0); status.textContent='Cleared.'; render(); });
  /* "Send us your sketch" asks for an email, then emails the drawing to us through /api/submit (no contact form) */
  const sf=$('#sk-form'), sbtn=$('button[type="submit"]',sf), slabel=sbtn.textContent;
  const art=()=>Array.from({length:N},(_,y)=>grid.slice(y*N,y*N+N).map(v=>v?'#':'.').join('')).join('\n');
  $('#sk-send').addEventListener('click',()=>{
    if(!grid.some(Boolean)){ status.textContent='Place a few squares first.'; return; }
    sf.hidden=false; status.textContent='Add your email so we can reply, then send it.';
    $('#sk-email').focus();
  });
  sf.addEventListener('submit',async e=>{
    e.preventDefault();
    const em=sf.elements.email.value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){ sf.elements.email.setAttribute('aria-invalid','true'); status.textContent='Enter a valid email.'; sf.elements.email.focus(); return; }
    sf.elements.email.removeAttribute('aria-invalid');
    if(sf.elements._gotcha.value) return;
    sf.elements.sketch.value=art(); sbtn.disabled=true; sbtn.textContent='Sending…';
    try{
      const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'sketch',email:em,credit:sf.elements.credit.value.trim(),gallery_ok:sf.elements.gallery_ok.checked,sketch:art(),_gotcha:sf.elements._gotcha.value})});
      if(res.ok){
        status.textContent='Sent. We’ve got your sketch and will reply by email.';
        if(window.gtag) gtag('event','generate_lead',{event_category:'form',event_label:'sketch'});
        sf.reset(); sf.hidden=true; grid.fill(0); render();
      }else{ let m='Something went wrong. Email us at hello@madeofpixels.in'; try{ const d=await res.json(); if(d.error) m=d.error; }catch(_){} status.textContent=m; }
    }catch(_){ status.textContent='Network error. Email us at hello@madeofpixels.in'; }
    sbtn.disabled=false; sbtn.textContent=slabel;
  });
  if('ResizeObserver' in window) new ResizeObserver(size).observe(cv); else size();
  size();
})();

/* ---------- generative pixel covers (stand-ins until real project images are added) ---------- */
const COLS=32, ROWS=20;
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
function pattern(kind,seed){
  const g=new Array(COLS*ROWS).fill(0), set=(x,y)=>{ if(x>=0&&x<COLS&&y>=0&&y<ROWS) g[y*COLS+x]=1; }, rnd=mulberry(seed);
  const rect=(x,y,w,h)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) set(x+i,y+j); };
  if(kind==='dash'){                                   // sidebar, top bar, bar chart
    rect(0,0,COLS,2); rect(0,3,5,1); for(let y=5;y<ROWS;y+=3) rect(0,y,4,1); rect(6,3,26,1);
    for(let x=8;x<COLS-1;x+=3){ const h=3+Math.floor(rnd()*11); rect(x,ROWS-h,2,h); }
  }else if(kind==='brand'){                            // the studio mark, large
    const bx=[[0,0],[1,0],[0,1],[2,1],[1,2],[2,2]];
    bx.forEach(b=>rect(9+b[0]*5,3+b[1]*5,4,4));
  }else{                                               // qr-like
    const ox=6, oy=0, S=20;
    for(let y=0;y<S;y++) for(let x=0;x<S;x++) if(rnd()>.52) set(ox+x,oy+y);
    const finder=(fx,fy)=>{ for(let y=-1;y<8;y++) for(let x=-1;x<8;x++){ const gx=ox+fx+x, gy=oy+fy+y; if(gx>=ox&&gx<ox+S&&gy>=oy&&gy<oy+S) g[gy*COLS+gx]=0; } rect(ox+fx,oy+fy,7,1); rect(ox+fx,oy+fy+6,7,1); rect(ox+fx,oy+fy,1,7); rect(ox+fx+6,oy+fy,1,7); rect(ox+fx+2,oy+fy+2,3,3); };
    finder(0,0); finder(S-7,0); finder(0,S-7);
  }
  return g;
}
function initCover(cv){
  if(cv._cover) return; cv._cover=true;
  const ctx=cv.getContext('2d'), base=pattern(cv.dataset.cover,parseInt(cv.dataset.seed||'7',10)), wave=new Float32Array(COLS*ROWS);
  let w=0, c=1, dpr=1, pt=null, running=false, inkc='#111', hot='#f30';
  function draw(){
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
    let active=false, hotIdx=-1;
    if(pt){ hotIdx=Math.floor(pt.y/c)*COLS+Math.floor(pt.x/c); }
    for(let i=0;i<base.length;i++){
      const lit=wave[i]>.45, on=base[i]?!lit:lit;
      if(wave[i]>.02) active=true;
      if(i===hotIdx){ ctx.fillStyle=hot; }
      else if(on){ ctx.fillStyle=inkc; } else continue;
      ctx.fillRect((i%COLS)*c+dpr*.5,Math.floor(i/COLS)*c+dpr*.5,c-dpr,c-dpr);
    }
    for(let i=0;i<wave.length;i++) wave[i]*=.9;
    return active||!!pt;
  }
  function loop(){ if(draw()) requestAnimationFrame(loop); else running=false; }
  function size(){
    dpr=Math.min(devicePixelRatio||1,2); w=cv.clientWidth; if(!w) return;
    cv.width=Math.round(w*dpr); cv.height=Math.round(w*dpr*ROWS/COLS); c=cv.width/COLS;
    inkc=cssVar('--ink'); hot=cssVar('--accent'); draw();
  }
  if('ResizeObserver' in window) new ResizeObserver(size).observe(cv); else size();
  if(reduce||!fine) return;
  const host=cv.closest('[data-cover-host]')||cv;
  const move=e=>{
    const r=cv.getBoundingClientRect(); pt={x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};
    const cx=Math.floor(pt.x/c), cy=Math.floor(pt.y/c);
    for(let j=-2;j<=2;j++) for(let i=-3;i<=3;i++){ const x=cx+i, y=cy+j; if(x>=0&&x<COLS&&y>=0&&y<ROWS&&Math.random()<.55) wave[y*COLS+x]=1; }
    if(!running){ running=true; requestAnimationFrame(loop); }
  };
  host.addEventListener('pointerenter',move); host.addEventListener('pointermove',move);
  host.addEventListener('pointerleave',()=>{ pt=null; if(!running){ running=true; requestAnimationFrame(loop); } });
  cv._burst=()=>{ for(let k=0;k<160;k++) wave[Math.floor(Math.random()*wave.length)]=1; if(!running){ running=true; requestAnimationFrame(loop); } };
}
$$('canvas[data-cover]').forEach(initCover);

/* ---------- project case article: step tabs + enquiry shortcut ---------- */
function initArticle(root){
  $$('canvas[data-cover]',root).forEach(cv=>{ initCover(cv); if(cv._burst&&!reduce) setTimeout(cv._burst,250); });
  const steps=$('.case-steps',root);
  if(steps){
    const items=$$('li',steps); if(items.length>1){
      steps.classList.add('is-tabs');
      const bar=document.createElement('div'); bar.className='case-tabs'; bar.setAttribute('role','tablist'); bar.setAttribute('aria-label','Project stages');
      items.forEach((li,i)=>{
        const b=document.createElement('button'); b.type='button'; b.className='mono'; b.setAttribute('role','tab');
        b.innerHTML='<b>'+String(i+1).padStart(2,'0')+'</b> '+$('.case-step-name',li).textContent;
        b.addEventListener('click',()=>show(i)); bar.appendChild(b);
      });
      steps.parentNode.insertBefore(bar,steps);
      const tabs=$$('button',bar);
      function show(n){
        items.forEach((li,i)=>{ li.hidden=i!==n; });
        tabs.forEach((b,i)=>{ b.setAttribute('aria-selected',String(i===n)); b.tabIndex=i===n?0:-1; });
        const fill=$('.case-progress i',root); if(fill) fill.style.width=((n+1)/items.length*100)+'%';
      }
      bar.addEventListener('keydown',e=>{
        const cur=tabs.findIndex(b=>b.getAttribute('aria-selected')==='true');
        let n=cur; if(e.key==='ArrowRight') n=(cur+1)%tabs.length; else if(e.key==='ArrowLeft') n=(cur+tabs.length-1)%tabs.length; else return;
        e.preventDefault(); show(n); tabs[n].focus();
      });
      show(0);
    }
  }
  $$('[data-similar]',root).forEach(b=>b.addEventListener('click',e=>{
    e.preventDefault();
    const ok=openContact({type:b.dataset.type,message:'I’d like a project similar to '+b.dataset.similar+'. '});
    if(!ok) location.href='/contact';
  }));
  watchReveals(root);
}
$$('.case-article').forEach(initArticle);

/* ---------- projects page: filter, view, peek preview, case-study overlay ---------- */
(function(){
  const list=$('#proj-list'); if(!list) return;
  const cards=$$('.proj',list), count=$('#proj-count'), chips=$$('[data-filter]'), views=$$('[data-view]');
  const pd=$('#proj-dialog'), body=$('#proj-body'), slugs=cards.map(c=>c.dataset.slug);
  let current=null, pushed=false, projLocked=false;
  const baseTitle=document.title, base='/projects';

  function filter(cat){
    let n=0;
    cards.forEach(c=>{
      const show=cat==='all'||c.dataset.cat===cat; c.hidden=!show;
      if(show){ n++; c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
    });
    chips.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===cat)));
    count.textContent='Showing '+n+' of '+cards.length+' projects';
  }
  chips.forEach(b=>b.addEventListener('click',()=>filter(b.dataset.filter)));
  views.forEach(b=>b.addEventListener('click',()=>{
    list.dataset.view=b.dataset.view;
    views.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  }));

  /* list view: a pixel cover follows the cursor */
  const peek=$('#proj-peek');
  if(peek&&fine&&!reduce){
    const pcv=$('canvas',peek); pcv.width=320; pcv.height=200; const pctx=pcv.getContext('2d');
    const draw=slug=>{
      const c=cards.find(x=>x.dataset.slug===slug), cv=$('canvas[data-cover]',c), g=pattern(cv.dataset.cover,parseInt(cv.dataset.seed||'7',10));
      pctx.clearRect(0,0,320,200); pctx.fillStyle=cssVar('--ink'); const s=10;
      g.forEach((v,i)=>{ if(v) pctx.fillRect((i%COLS)*s+.5,Math.floor(i/COLS)*s+.5,s-1,s-1); });
    };
    cards.forEach(c=>{
      c.addEventListener('pointerenter',()=>{ if(list.dataset.view==='list'){ draw(c.dataset.slug); peek.classList.add('show'); } });
      c.addEventListener('pointermove',e=>{ peek.style.transform='translate('+(e.clientX+24)+'px,'+(e.clientY-100)+'px)'; });
      c.addEventListener('pointerleave',()=>peek.classList.remove('show'));
    });
  }

  /* overlay */
  function render(slug){
    const tpl=$('#tpl-'+slug); if(!tpl) return false;
    body.innerHTML=''; body.appendChild(tpl.content.cloneNode(true));
    const i=slugs.indexOf(slug);
    $$('[data-slug]',body).forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); open(a.dataset.slug,true); }));
    initArticle(body);
    const art=$('.case-article',body); if(art) art.focus({preventScroll:true});
    document.title=$('.case-title',body).textContent+' | Projects | MadeOfPixels Studio';
    body.parentNode.scrollTop=0; current=slug; return true;
  }
  function open(slug,fromNav){
    if(!render(slug)) return;
    const url=base+'/'+slug;
    if(!pd.open){ lockScroll(true); projLocked=true; pd.showModal(); history.pushState({slug:slug},'',url); pushed=true; }
    else if(fromNav){ history.replaceState({slug:slug},'',url); }
  }
  function afterProjClose(){
    if(!projLocked) return; projLocked=false;
    lockScroll(false); document.title=baseTitle; current=null;
    if(pushed){ pushed=false; history.back(); }
  }
  function close(){ if(pd.open) pd.close(); afterProjClose(); }
  pd.addEventListener('close',afterProjClose);
  $('#proj-close').addEventListener('click',close);
  pd.addEventListener('click',e=>{ if(e.target===pd) close(); });
  pd.addEventListener('keydown',e=>{
    if(e.target.closest('[role="tablist"]')||e.target.matches('input,textarea,select')) return;
    const i=slugs.indexOf(current);
    if(e.key==='ArrowRight'&&i>-1){ e.preventDefault(); open(slugs[(i+1)%slugs.length],true); }
    if(e.key==='ArrowLeft'&&i>-1){ e.preventDefault(); open(slugs[(i+slugs.length-1)%slugs.length],true); }
  });
  cards.forEach(c=>c.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.button) return;
    if(typeof pd.showModal!=='function') return;
    e.preventDefault(); open(c.dataset.slug);
  }));
  addEventListener('popstate',()=>{
    const m=location.pathname.match(/\/projects\/([\w-]+)\/?$/);
    if(m&&slugs.includes(m[1])){ if(!pd.open){ render(m[1]); lockScroll(true); projLocked=true; pd.showModal(); } else render(m[1]); }
    else if(pd.open){ pushed=false; close(); }
  });
  const hash=(location.hash||'').slice(1);
  if(slugs.includes(hash)) setTimeout(()=>open(hash),300);
  filter('all');
})();

/* ---------- right-edge scroll ruler (overlay; stage names come from [data-stage] sections) ---------- */
const ruler=$('#ruler');
let fitAll=()=>{}, measureAll=()=>{};
(function(){
  const zone=$('.r-zone'), svg=$('#r-ticks'), line=$('#r-line'), pct=$('#r-pct'), meas=$('.r-measure'), box=$('.r-labels');
  const stages=$$('[data-stage]');
  stages.forEach(s=>{
    const a=document.createElement('a'), name=s.dataset.stage, rb=document.createElement('span'), sr=document.createElement('span');
    a.className='r-label'; a.href='#'+s.id; a.dataset.target=s.id; a.dataset.name=name;
    rb.className='r-box'; rb.setAttribute('aria-hidden','true');
    [...name].forEach((c,i)=>{ const ch=document.createElement('span'), g=document.createElement('i'); ch.className='ch'; ch.style.setProperty('--k',i); g.textContent=c===' '?'':c; ch.appendChild(g); rb.appendChild(ch); });
    sr.className='sr-only'; sr.textContent=name; a.appendChild(rb); a.appendChild(sr); box.appendChild(a);
  });
  const labs=$$('.r-label',box), ids=labs.map(l=>l.dataset.target), N=labs.length;
  const PAD=16, TW=72, VRATIO=18/13;
  let Hr=0, docH=1, vh=1, UNIT=1, shift=0, secU=[], lens=[], lensA=[], active=-1, raf=0;

  /* a long tape (0 to 100) slides past as you scroll; the tick under the accent line is the scroll percentage */
  function ticks(){
    const th=2*PAD+100*UNIT;
    svg.setAttribute('width',TW); svg.setAttribute('height',th); svg.setAttribute('viewBox','0 0 '+TW+' '+th);
    let s='';
    for(let p=0;p<=100;p++){
      const y=(PAD+p*UNIT).toFixed(1), bold=p%25===0, long=p%5===0, len=bold?26:long?18:8;
      s+='<line class="'+(bold?'t3':long?'t2':'t1')+'" x1="'+(TW-len)+'" x2="'+TW+'" y1="'+y+'" y2="'+y+'"/>';
      if(long) s+='<text class="'+(bold?'n3':'')+'" x="'+(TW-len-5)+'" y="'+(+y+3)+'" text-anchor="end">'+p+'</text>';
    }
    svg.innerHTML=s;
  }
  /* where each letter sits, measured from the right end of its name (set once fonts are ready) */
  let lettersOk=false;
  function layoutLetters(){
    labs.forEach(l=>{
      const chs=$$('.ch',l), row=document.createElement('span');
      row.style.cssText='display:inline-block;white-space:pre'; meas.innerHTML='';
      [...l.dataset.name].forEach(c=>{ const k=document.createElement('span'); k.style.display='inline-block'; k.textContent=c===' '?'\u00a0':c; row.appendChild(k); });
      meas.appendChild(row); const W=row.offsetWidth; l._W=W;
      [...row.children].forEach((k,i)=>{
        if(!chs[i]) return; const w=k.offsetWidth, left=k.offsetLeft, o=W-left-w;
        chs[i].style.setProperty('--o',o.toFixed(2)+'px');
        chs[i].style.setProperty('--dx',(o+w/2).toFixed(2)+'px');           // horizontal slot -> column: right ...
        chs[i].style.setProperty('--dy',(-(left+w/2)).toFixed(2)+'px');     // ... and up (the column grows upward from its bottom)
      });
    });
    meas.innerHTML='';
  }
  if(document.fonts&&document.fonts.addEventListener) document.fonts.addEventListener('loadingdone',()=>{ lettersOk=false; measureAll(); });
  /* Only one stage name is ever vertical at a time (the current one):
     - upcoming names wait in a stack at the bottom;
     - the next one lifts out and rides along the ruler vertically, and at that moment the previous name
       snaps up into the stack at the top;
     - the riding name sticks below the passed names until the name after it lifts out (or its section ends). */
  function place(){
    const hp=17, gap=6, edge=14, off=56;
    const start=i=>PAD+secU[i]*UNIT-shift, end=i=>i<N-1?start(i+1):PAD+100*UNIT-shift;
    const slotOf=i=>Hr-edge-hp/2-(N-1-i)*(hp+gap), riding=i=>start(i)+off+lens[i]<=slotOf(i);
    let p=0; while(p<N&&(end(p)<=edge+(p+1)*(hp+gap)||(p<N-1&&riding(p+1)))) p++;   // names already passed
    const topEnd=edge+p*(hp+gap)+2, y=new Array(N), vert=new Array(N).fill(false);
    for(let i=0;i<p;i++) y[i]=edge+hp/2+i*(hp+gap);
    let cur=-1, stick=-1, bottomCount=0;
    for(let i=p;i<N;i++){
      if(i===p&&start(i)+off<=topEnd){ stick=i; cur=i; continue; }               // reached the top: sticks there
      const slot=slotOf(i), nat=Math.max(start(i)+off,topEnd);
      const L=i===p?lensA[i]:lens[i];
      if(nat+L<=slot){ vert[i]=true; y[i]=nat+L; if(i===p) cur=i; } else { y[i]=slot; bottomCount++; }       // vertical: y is the bottom end
    }
    if(stick>=0){
      const bottomTop=Hr-edge-bottomCount*(hp+gap)-gap;
      if(topEnd+lensA[stick]<=bottomTop){ vert[stick]=true; y[stick]=Math.min(topEnd,end(stick)-lensA[stick]-8)+lensA[stick]; }
      else y[stick]=topEnd+16;                                                   // no room: large horizontal name instead
    }
    labs.forEach((l,i)=>{
      const key=(vert[i]?'v':'h')+(i<p?'p':'u');                              // a state change gets a slower, eased move
      if(l._k!==undefined&&l._k!==key){ l.classList.add('sw'); clearTimeout(l._t); l._t=setTimeout(()=>l.classList.remove('sw'),1000); }
      l._k=key;
      l.style.transform='translateY('+y[i].toFixed(1)+'px)';
      l.classList.toggle('is-vert',vert[i]);
      l.classList.toggle('is-active',i===cur);
      l.classList.toggle('is-past',i<p);
      if(i===cur) l.setAttribute('aria-current','location'); else l.removeAttribute('aria-current');
    });
  }
  function setActive(i){ if(i<-1||i===active) return; active=i; place(); }
  function update(){
    raf=0;
    const maxS=Math.max(docH-vh,1), p=Math.min(Math.max(scrollY,0),maxS)/maxS;
    shift=p*(100*UNIT-(Hr-2*PAD));
    svg.style.transform='translateY('+(-shift).toFixed(1)+'px)';
    line.style.transform='translateY('+(PAD+p*(Hr-2*PAD)).toFixed(1)+'px)';
    pct.textContent=String(Math.round(p*100)).padStart(3,'0')+'%';
    place();
  }
  function measure(){
    vh=innerHeight; Hr=Math.max(ruler.clientHeight||vh-52,200); UNIT=Hr*.095;
    docH=Math.max(document.documentElement.scrollHeight,vh+1);
    secU=ids.map(id=>{const el=document.getElementById(id);return el?100*(el.getBoundingClientRect().top+scrollY)/docH:0});
    if(!lettersOk){ layoutLetters(); lettersOk=true; }
    const mw=labs.map(l=>l._W||0);
    lens=mw.map(w=>w*VRATIO*1.08+14); lensA=mw.map(w=>w*(21/13)*1.08+14);
    ticks(); update();
  }
  const schedule=fn=>{ if(!raf) raf=requestAnimationFrame(fn) };
  addEventListener('scroll',()=>schedule(update),{passive:true});
  measureAll=()=>schedule(measure);
  if('ResizeObserver' in window){ let t=0; new ResizeObserver(()=>{cancelAnimationFrame(t);t=requestAnimationFrame(measure)}).observe(document.body); }

  const sio=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    setActive(e.target.hasAttribute('data-pre')?-1:ids.indexOf(e.target.id));
  }),{rootMargin:'-40% 0px -59% 0px'});
  stages.forEach(s=>sio.observe(s)); $$('[data-pre]').forEach(s=>sio.observe(s));

  labs.forEach(l=>l.addEventListener('click',e=>{ e.preventDefault(); goTo(document.getElementById(l.dataset.target)); }));

  /* click or drag anywhere on the ruler: the accent line follows the pointer */
  let drag=false;
  const toScroll=y=>{ const r=ruler.getBoundingClientRect(); return Math.min(1,Math.max(0,(y-r.top-PAD)/(Hr-2*PAD)))*(docH-vh); };
  zone.addEventListener('pointerdown',e=>{ drag=true; zone.setPointerCapture(e.pointerId); jump(toScroll(e.clientY),false); });
  zone.addEventListener('pointermove',e=>{ if(drag) jump(toScroll(e.clientY),true) });
  ['pointerup','pointercancel'].forEach(t=>zone.addEventListener(t,()=>{ drag=false }));
  ruler._isDragging=()=>drag;
  ruler._stops=()=>ids.map(id=>topOf(document.getElementById(id))).concat(0,Math.max(docH-vh,0));
  measure();
})();
addEventListener('resize',()=>{ fitWordmark(); measureAll(); });
fitWordmark();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ fitWordmark(); measureAll(); });
addEventListener('load',()=>{ fitWordmark(); measureAll(); });

/* ---------- Lenis smooth scroll + a gentle snap to section edges ---------- */
if(window.Lenis&&!reduce){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
  const loop=t=>{lenis.raf(t);requestAnimationFrame(loop)};
  requestAnimationFrame(loop);
  $$('a[href^="#"]:not([href="#"]):not(.r-label)').forEach(a=>a.addEventListener('click',e=>{
    const el=document.getElementById(a.getAttribute('href').slice(1));
    if(!el||e.defaultPrevented) return;
    e.preventDefault(); goTo(el);
  }));
  let idle=0;
  lenis.on('scroll',()=>{
    clearTimeout(idle);
    idle=setTimeout(()=>{
      if(innerWidth<900||(ruler._isDragging&&ruler._isDragging())||locks) return;
      let best=0,d=Infinity;
      ruler._stops().forEach(s=>{const x=Math.abs(s-scrollY); if(x<d){d=x;best=s}});
      if(d>2&&d<Math.min(innerHeight*.04,36)) lenis.scrollTo(best);
    },140);
  });
}
/* deep links such as /services#web-apps */
if(location.hash.length>1&&!$('#proj-list')){
  const t=document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if(t) addEventListener('load',()=>setTimeout(()=>goTo(t),150));
}
})();
