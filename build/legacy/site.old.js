document.documentElement.classList.add('js');
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis=null;                                   // set below when Lenis loads
const navH=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||60;
const sectionY=el=>el.id==='home'?0:el.getBoundingClientRect().top+scrollY-navH();
function jump(y,now){ if(lenis) lenis.scrollTo(y,{immediate:!!now}); else scrollTo({top:y,behavior:(now||reduce)?'auto':'smooth'}); }
function goTo(el){ jump(sectionY(el),false); }

/* placeholder links go nowhere until you set real URLs */
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
mbtn.addEventListener('click',()=>{const o=nav.classList.toggle('open');mbtn.setAttribute('aria-expanded',o)});
$$('.links a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');mbtn.setAttribute('aria-expanded','false')}));
addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');mbtn.setAttribute('aria-expanded','false');mbtn.focus()}});

/* wordmark: fit to column width */
const wm=$('#wm');
function fitWordmark(){
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

/* hero square row */
const row=$('#sqrow'), count=innerWidth<700?24:48;
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

/* marquee: repeat items until one set covers the viewport, then double */
(function(){
  const track=$('#mq'), set=track.firstElementChild, items=[...set.children];
  let guard=0;
  while(set.getBoundingClientRect().width<innerWidth*1.1 && guard++<6) items.forEach(i=>set.appendChild(i.cloneNode(true)));
  const twin=set.cloneNode(true); twin.setAttribute('aria-hidden','true'); track.appendChild(twin);
})();

/* scroll reveals */
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -4% 0px'});
$$('.rv').forEach(el=>{ if(reduce) el.classList.add('in'); else rio.observe(el) });

/* ===================== RIGHT-EDGE SCROLL RULER (overlay) ===================== */
const ruler=$('#ruler'), zone=$('.r-zone'), svg=$('#r-ticks'), line=$('#r-line'), pct=$('#r-pct'), meas=$('.r-measure');
const labs=$$('.r-label'), ids=labs.map(l=>l.dataset.target), N=labs.length;
const PAD=16, TW=72, VRATIO=18/13;
let Hr=0, docH=1, vh=1, UNIT=1, shift=0, secU=[], lens=[], active=-1, raf=0;
const navMap={home:'home',manifesto:'home',services:'services',process:'process',principles:'process',work:'work',start:'start'};

/* The ruler is a long tape (0 to 100) that slides past as you scroll.
   The tick sitting under the accent line is always the current scroll percentage. */
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

/* Labels: passed ones stack at the top, the active one sits under them (large),
   upcoming ones wait in a stack at the bottom and, once their section is close enough
   on the tape, lift out of the stack and run vertically along the ruler. */
function place(){
  const hp=17, ha=Math.round(Math.min(30,Math.max(20,innerWidth*.019))*1.3), gap=6, edge=14;
  const topA=active<0?edge:edge+active*(hp+gap)+ha/2, topEnd=active<0?edge:topA+ha/2+gap;
  labs.forEach((l,i)=>{
    let y, vert=false;
    if(i<active) y=edge+hp/2+i*(hp+gap);
    else if(i===active) y=topA;
    else{
      const slot=Hr-edge-hp/2-(N-1-i)*(hp+gap);
      const top=Math.max(PAD+secU[i]*UNIT-shift+56,topEnd);
      if(top+lens[i]<=slot){vert=true;y=top} else y=slot;
    }
    l.style.transform='translateY('+y.toFixed(1)+'px)';
    l.classList.toggle('is-vert',vert);
    l.classList.toggle('is-active',i===active);
    l.classList.toggle('is-past',i<active);
    if(i===active) l.setAttribute('aria-current','location'); else l.removeAttribute('aria-current');
  });
}

function setActive(i){
  if(i<-1||i===active) return;
  active=i; place();
  const key=i<0?'home':navMap[ids[i]];
  $$('[data-nav]').forEach(a=>{ if(a.dataset.nav===key) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current') });
}

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
  lens=labs.map(l=>{meas.textContent=l.textContent;return meas.offsetWidth*VRATIO*1.08+14});
  ticks(); update();
}
function schedule(fn){ if(!raf) raf=requestAnimationFrame(fn) }
addEventListener('scroll',()=>schedule(update),{passive:true});
addEventListener('resize',()=>{fitWordmark();schedule(measure)});
if('ResizeObserver' in window){ let t=0; new ResizeObserver(()=>{cancelAnimationFrame(t);t=requestAnimationFrame(measure)}).observe(document.body); }

const sio=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) setActive(ids.indexOf(e.target.id)) }),{rootMargin:'-40% 0px -59% 0px'});
['home',...ids].forEach(id=>{const el=document.getElementById(id); if(el) sio.observe(el)});

labs.forEach(l=>l.addEventListener('click',e=>{
  e.preventDefault();
  goTo(document.getElementById(l.dataset.target));
}));

/* click or drag anywhere on the ruler: the accent line follows the pointer */
let drag=false;
const toScroll=y=>{
  const r=ruler.getBoundingClientRect();
  return Math.min(1,Math.max(0,(y-r.top-PAD)/(Hr-2*PAD)))*(docH-vh);
};
zone.addEventListener('pointerdown',e=>{
  drag=true; zone.setPointerCapture(e.pointerId);
  jump(toScroll(e.clientY),false);
});
zone.addEventListener('pointermove',e=>{ if(drag) jump(toScroll(e.clientY),true) });
['pointerup','pointercancel'].forEach(t=>zone.addEventListener(t,()=>{ drag=false }));

fitWordmark(); measure();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{fitWordmark();measure()});
addEventListener('load',()=>{fitWordmark();measure()});

/* ===================== FORMS (Formspree) ===================== */
const rules={
  name:v=>v.trim().length>=2||'Tell us your name.',
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Enter a valid email.',
  phone:v=>!v.trim()||/^\+?[0-9\s\-()]{7,18}$/.test(v.trim())||'Digits, spaces, + or - only.',
  type:v=>!!v||'Pick a project type.',
  budget:()=>true,
  message:v=>v.trim().length>=20||'Give us at least 20 characters.'
};
function initForm(form,onSent){
  const status=form.querySelector('.form-status'), btn=form.querySelector('button[type="submit"]'), label=btn.textContent;
  const field=n=>form.elements[n];
  function check(n){
    const f=field(n), r=rules[n](f.value), e=form.querySelector('.err[data-for="'+n+'"]');
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
      const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      if(res.ok){ form.reset(); say('Sent. We’ll be in touch within 24 hours.'); if(onSent) onSent(); }
      else{
        let msg='Something went wrong. Email us at hello@madeofpixels.in';
        try{ const d=await res.json(); if(d.errors&&d.errors.length) msg=d.errors.map(x=>x.message).join(' '); }catch(_){}
        say(msg);
      }
    }catch(_){ say('Network error. Email us at hello@madeofpixels.in'); }
    btn.disabled=false; btn.textContent=label;
  });
}
initForm($('#enquiry'));

/* ===================== CONTACT LIGHTBOX ===================== */
const dlg=$('#contact-dialog');
(function(){
  const src=$('#enquiry'), copy=src.cloneNode(true);
  copy.id='enquiry-m';
  copy.querySelectorAll('[id]').forEach(el=>el.id+='-m');
  copy.querySelectorAll('label[for]').forEach(l=>l.htmlFor+='-m');
  copy.querySelectorAll('[aria-describedby]').forEach(el=>el.setAttribute('aria-describedby',el.getAttribute('aria-describedby')+'-m'));
  copy.querySelector('[name="_subject"]').value='New enquiry (lightbox) from madeofpixels.in';
  copy.setAttribute('aria-label','Quote request');
  $('#dlg-form-slot').appendChild(copy);
  initForm(copy,()=>setTimeout(()=>{ if(dlg.open) dlg.close() },2400));
})();
function openContact(e){
  if(!dlg||typeof dlg.showModal!=='function') return;     // no <dialog>: fall back to the #start anchor
  e.preventDefault();
  nav.classList.remove('open'); mbtn.setAttribute('aria-expanded','false');
  document.documentElement.style.overflow='hidden';
  if(lenis) lenis.stop();
  dlg.showModal();
}
$$('[data-open-contact]').forEach(a=>a.addEventListener('click',openContact));
$('#dlg-close').addEventListener('click',()=>dlg.close());
dlg.addEventListener('click',e=>{ if(e.target===dlg) dlg.close() });   // click on the backdrop
dlg.addEventListener('close',()=>{ document.documentElement.style.overflow=''; if(lenis) lenis.start(); });
/* ===================== INTERACTIVE PIECES ===================== */
const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---- 1. pixelating wordmark: letters shatter into squares around the cursor, then reform ---- */
(function(){
  if(reduce||!finePointer||!wm) return;
  const wrap=wm.parentElement, cv=document.createElement('canvas'), ctx=cv.getContext('2d');
  if(!('letterSpacing' in ctx)) return;                      // needs canvas letterSpacing to match the type
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
      const probe=document.createElement('span');            // zero-size inline-block: its bottom edge is the text baseline
      probe.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
      line.appendChild(probe); const base=probe.getBoundingClientRect().bottom; probe.remove();
      o.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily; o.letterSpacing=cs.letterSpacing;
      o.fillText(line.textContent.toUpperCase(),lr.left-r.left,base-r.top);
    });
    cell=Math.max(3,Math.round(parseFloat(wm.style.fontSize||'100')/38));
    const d=off.getContext('2d').getImageData(0,0,W,H).data; parts=[];
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
    ctx.fillStyle=hot; for(const p of flying) ctx.fillRect(p.x,p.y,cell,cell);   // only the furthest squares glow
    if(pt||moving){ requestAnimationFrame(frame); }
    else{ running=false; wm.classList.remove('is-px'); cv.style.opacity='0'; }
  }
  function move(e){ const r=cv.getBoundingClientRect(); pt={x:e.clientX-r.left,y:e.clientY-r.top}; }
  wm.addEventListener('pointerenter',e=>{
    build(); if(!parts.length) return;
    ink=cssVar('--ink'); hot=cssVar('--accent'); move(e);
    if(!running){ running=true; wm.classList.add('is-px'); cv.style.opacity='1'; requestAnimationFrame(frame); }
  });
  wm.addEventListener('pointermove',move);
  wm.addEventListener('pointerleave',()=>{ pt=null; });
})();

/* ---- 2. magnetic buttons: they lean a few pixels toward the cursor ---- */
(function(){
  if(reduce||!finePointer) return;
  $$('.btn').forEach(el=>{
    let c=null;
    el.addEventListener('pointerenter',()=>{ const r=el.getBoundingClientRect(); c={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}; });
    el.addEventListener('pointermove',e=>{
      if(!c) return;
      const x=(e.clientX-c.x)/c.w, y=(e.clientY-c.y)/c.h;
      el.style.transform='translate('+(x*14).toFixed(1)+'px,'+(y*10).toFixed(1)+'px)';
    });
    el.addEventListener('pointerleave',()=>{ c=null; el.style.transform=''; });
  });
})();

/* ---- 3. project estimator ----
   [PLACEHOLDER] Pricing is yours to set. Until every number the selection needs is a number
   (not null), the result shows [LOW] – [HIGH] instead of a figure.
   price = (base[type] + pages[tier]) x timeline[option]   ·   high = price x spread            */
const ESTIMATOR={
  currency:'[CURRENCY]',                       // e.g. '₹'
  base:{ 'Custom Website':null,'UI/UX Design':null,'Brand Identity':null,'Web App':null,'E-commerce':null,'Landing Page':null,'Maintenance':null },
  pages:{ '1':null,'2-5':null,'6-10':null,'10+':null },   // amount added for the page count
  timeline:{ standard:1, fast:null, flexible:null },      // multipliers
  spread:null                                              // e.g. 1.4 makes the high end 40% above the low end
};
(function(){
  const root=$('#estimator'); if(!root) return;
  const fig=$('#est-figure'), note=$('#est-note'), use=$('#est-use');
  const pick=n=>$('input[name="'+n+'"]:checked');
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
      const lo=(b+pg)*m; range=fmt(lo)+' – '+fmt(lo*s);
      fig.classList.remove('ph'); note.textContent='A rough range. Your final quote comes after the brief.';
    }else{
      range=''; fig.classList.add('ph'); note.textContent='[PRICING NOT SET: fill in ESTIMATOR in the script]';
    }
    fig.textContent=range||(ESTIMATOR.currency+' [LOW] – '+ESTIMATOR.currency+' [HIGH]');
  }
  root.addEventListener('change',calc); calc();
  use.addEventListener('click',()=>{
    const form=$('#enquiry'), type=lab('est-type'), sel=form.elements.type, msg=form.elements.message;
    [...sel.options].forEach(o=>{ if(o.text===type) sel.value=o.value||o.text; });
    const head='Estimate request\nProject: '+type+'\nPages: '+lab('est-pages')+'\nTimeline: '+lab('est-time')+(range?'\nRange: '+range:'')+'\n\n';
    msg.value=head+msg.value.replace(/^Estimate request[\s\S]*?\n\n/,'');
    ['type','message'].forEach(n=>form.elements[n].dispatchEvent(new Event('input')));
    jump(sectionY(form)-24,false);
    setTimeout(()=>msg.focus({preventScroll:true}),700);
  });
})();

/* ---- 4. draw with pixels ---- */
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
  $('#sk-send').addEventListener('click',()=>{
    if(!grid.some(Boolean)){ status.textContent='Place a few squares first.'; return; }
    const art=Array.from({length:N},(_,y)=>grid.slice(y*N,y*N+N).map(v=>v?'#':'.').join('')).join('\n');
    openContact({preventDefault(){}});
    const sk=dlg.querySelector('[name="sketch"]'), msg=dlg.querySelector('[name="message"]');
    if(sk) sk.value=art;
    if(msg&&!msg.value.trim()) msg.value='Hi! I drew a pixel sketch on your site and I’d like to talk about it. ';
    $('#dlg-sketch-note').hidden=false;
  });
  dlg.addEventListener('close',()=>{ const sk=dlg.querySelector('[name="sketch"]'); if(sk) sk.value=''; $('#dlg-sketch-note').hidden=true; });
  if('ResizeObserver' in window) new ResizeObserver(size).observe(cv); else size();
  size();
})();

/* ===================== LENIS SMOOTH SCROLL + SOFT SECTION SNAP ===================== */
if(window.Lenis&&!reduce){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
  const loop=t=>{lenis.raf(t);requestAnimationFrame(loop)};
  requestAnimationFrame(loop);
  $$('a[href^="#"]:not([href="#"]):not(.r-label)').forEach(a=>a.addEventListener('click',e=>{
    const el=document.getElementById(a.getAttribute('href').slice(1));
    if(!el||e.defaultPrevented) return;
    e.preventDefault(); goTo(el);
  }));
  /* once scrolling settles near a section edge, glide to it (big sections still scroll freely inside) */
  let idle=0;
  lenis.on('scroll',()=>{
    clearTimeout(idle);
    idle=setTimeout(()=>{
      if(innerWidth<900||drag||dlg.open) return;
      const stops=['home',...ids].map(id=>sectionY(document.getElementById(id))).concat(Math.max(docH-vh,0));
      let best=0,d=Infinity;
      stops.forEach(s=>{const x=Math.abs(s-scrollY); if(x<d){d=x;best=s}});
      if(d>2&&d<Math.min(vh*.04,36)) lenis.scrollTo(best);
    },140);
  });
}
})();
