/* ===================== MORE EASTER EGGS (spliced in after features.js, shares its scope) =====================
   type: grid · orange · draw · sound · stats · 2025      keys: left right left right (8-bit)
   click: the underlined word in a headline · shift+hover the footer logo · find the hidden pixels · drag the ruler 100% then 0%
   nothing a visitor types is stored or sent anywhere. */
(function(){
  const root=document.documentElement;
  const noMotion=()=>{ if(reduce){ toast('That one is paused because reduced motion is on.'); return true; } return false; };
  const page=(location.pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/');

  /* the story shown when "2025" is typed: edit these lines to change the timeline */
  const STORY=[
    ['2025','MadeOfPixels Studio starts in Vasai West, Maharashtra.'],
    ['Since','Every site hand-coded. Zero templates, 100% custom code.'],
    ['Today','10+ projects delivered, from ERP tools to brand identities.'],
    ['Next','Yours. Tell us what you are building.']
  ];
  const HUNT_PAGES=['/','/about','/services','/projects','/process','/contact','/blog','/gallery'];
  const HUNT_CODE='MOP-FREE-LP';

  /* ---- 1. grid: a designer's overlay with measurements (type "grid" again to hide) ---- */
  let gridEl=null, gridMove=null;
  function toggleGrid(){
    if(gridEl){ gridEl.remove(); gridEl=null; removeEventListener('pointermove',gridMove); toast('Grid off.'); return; }
    const el=document.createElement('div'); el.className='grid-ov'; el.setAttribute('aria-hidden','true');
    const H=Math.max(document.documentElement.scrollHeight,innerHeight), W=document.documentElement.clientWidth;
    el.style.height=H+'px';
    let s='';
    for(let x=0;x<=W;x+=128) s+='<i class="gx" style="left:'+x+'px">'+x+'</i>';
    for(let y=128;y<=H;y+=128) s+='<i class="gy" style="top:'+y+'px">'+y+'</i>';
    el.innerHTML=s+'<span class="gdim mono"></span><b class="gh"></b><b class="gv"></b>';
    document.body.appendChild(el); gridEl=el;
    const dim=$('.gdim',el), gh=$('.gh',el), gv=$('.gv',el);
    gridMove=e=>{ const x=Math.round(e.pageX), y=Math.round(e.pageY); gv.style.left=x+'px'; gh.style.top=y+'px'; dim.style.left=Math.min(x+12,W-130)+'px'; dim.style.top=(y+14)+'px'; dim.textContent='X '+x+'  Y '+y; };
    addEventListener('pointermove',gridMove,{passive:true});
    toast('Grid on. Type "grid" again to hide it.');
  }

  /* ---- 2. orange: the accent changes colour for about five seconds ---- */
  let hueT=[];
  function hues(){
    hueT.forEach(clearTimeout); hueT=[];
    const set=['#B8E600','#2F6BFF','#FF4FA3'];
    set.forEach((c,i)=>hueT.push(setTimeout(()=>root.style.setProperty('--accent',c),i*1200)));
    hueT.push(setTimeout(()=>{ root.style.removeProperty('--accent'); toast('Back to orange.'); },4800));
    toast('Colour roulette.');
  }

  /* ---- 3. click the underlined word in a headline: it flips between the serif italic and the heavy sans ---- */
  document.addEventListener('click',e=>{
    const em=e.target.closest&&e.target.closest('h1 em,h2 em,h3 em,.hero-h em'); if(!em) return;
    em.classList.add('em-flip'); clearTimeout(em._t); em._t=setTimeout(()=>em.classList.remove('em-flip'),1300);
  });

  /* ---- 4. shift + hover the footer logo: the six squares shuffle and the orange one jumps ---- */
  (function(){
    const svg=$('.foot .brand .mark'); if(!svg) return;
    const cells=[[0,0],[10,0],[20,0],[0,10],[10,10],[20,10],[0,20],[10,20],[20,20]], base=[0,1,3,5,7,8];
    const rects=base.map((c,i)=>{ const r=document.createElementNS('http://www.w3.org/2000/svg','rect'); r.setAttribute('width','9'); r.setAttribute('height','9'); r.setAttribute('fill','currentColor'); r.style.transform='translate('+cells[c][0]+'px,'+cells[c][1]+'px)'; return r; });
    svg.innerHTML=''; svg.setAttribute('viewBox','0 0 29 29'); rects.forEach(r=>svg.appendChild(r)); svg.classList.add('shuf');
    let last=0;
    const shuffle=()=>{
      const pool=cells.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,6), hot=Math.floor(Math.random()*6);
      rects.forEach((r,i)=>{ r.style.transform='translate('+cells[pool[i]][0]+'px,'+cells[pool[i]][1]+'px)'; r.setAttribute('fill',i===hot?'var(--accent)':'currentColor'); });
    };
    const reset=()=>rects.forEach((r,i)=>{ r.style.transform='translate('+cells[base[i]][0]+'px,'+cells[base[i]][1]+'px)'; r.setAttribute('fill','currentColor'); });
    const go=e=>{ if(!e.shiftKey) return; const t=Date.now(); if(t-last<170) return; last=t; shuffle(); };
    svg.addEventListener('pointerenter',go); svg.addEventListener('pointermove',go); svg.addEventListener('pointerleave',reset);
  })();

  /* ---- 5. console message for the curious ---- */
  try{
    console.log('%c■ MadeOfPixels Studio','font:700 15px monospace;color:#FF3B00');
    console.log('%cLooking at the code? We’re hiring curious people.\nhello@madeofpixels.in\n\nPsst: eight pages each hide one orange pixel.','font:12px/1.6 monospace;color:#888');
  }catch(_){}

  /* ---- 6. tab title: rotates while the tab is in the background ---- */
  (function(){
    const lines=['Come back, we’re pixel-perfect','Your canvas is still blank','Still here. Still hand-coded.','Your site won’t build itself','Psst. Free quote in 24 hrs','■ We miss you ■'];
    let orig=document.title, t=0, i=0;
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){ orig=document.title; i=0; document.title=lines[0]; t=setInterval(()=>{ i=(i+1)%lines.length; document.title=lines[i]; },2600); }
      else{ clearInterval(t); document.title=orig; }
    });
  })();

  /* ---- 7. 404: pixel snake ---- */
  (function(){
    const box=$('#snake'); if(!box) return;
    const cv=$('canvas',box), ctx=cv.getContext('2d'), N=20, C=16, score=$('.sn-score',box), msg=$('.sn-msg',box), share=$('.sn-share',box);
    cv.width=cv.height=N*C;
    let snake, dir, nextDir, food, alive=false, started=false, speed, tm=0, pts=0, best=+ls.get('mop-snake')||0;
    const put=()=>{ do{ food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}; }while(snake.some(s=>s.x===food.x&&s.y===food.y)); };
    const draw=()=>{
      ctx.fillStyle=cssVar('--paper'); ctx.fillRect(0,0,N*C,N*C);
      ctx.fillStyle=cssVar('--rule'); for(let i=1;i<N;i++){ ctx.fillRect(i*C,0,1,N*C); ctx.fillRect(0,i*C,N*C,1); }
      ctx.fillStyle=cssVar('--accent'); ctx.fillRect(food.x*C+2,food.y*C+2,C-4,C-4);
      ctx.fillStyle=cssVar('--ink'); snake.forEach(s=>ctx.fillRect(s.x*C+1,s.y*C+1,C-2,C-2));
      score.textContent='SCORE '+String(pts).padStart(2,'0')+'  ·  BEST '+String(best).padStart(2,'0');
    };
    const reset=()=>{ snake=[{x:6,y:10},{x:5,y:10},{x:4,y:10}]; dir=nextDir={x:1,y:0}; pts=0; speed=120; put(); draw(); };
    const over=()=>{
      alive=false; clearTimeout(tm); if(pts>best){ best=pts; ls.set('mop-snake',String(best)); }
      draw(); msg.textContent=pts?'GAME OVER · '+pts+' PIXEL'+(pts===1?'':'S')+'. PRESS ENTER OR TAP TO PLAY AGAIN.':'GAME OVER. PRESS ENTER OR TAP TO PLAY AGAIN.'; share.hidden=!pts;
    };
    const step=()=>{
      dir=nextDir; const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
      if(h.x<0||h.y<0||h.x>=N||h.y>=N||snake.some(s=>s.x===h.x&&s.y===h.y)) return over();
      snake.unshift(h);
      if(h.x===food.x&&h.y===food.y){ pts++; speed=Math.max(60,speed-3); put(); } else snake.pop();
      draw(); tm=setTimeout(step,speed);
    };
    const start=()=>{ if(alive) return; reset(); alive=true; started=true; msg.textContent='EAT THE ORANGE PIXEL.'; share.hidden=true; clearTimeout(tm); tm=setTimeout(step,speed); };
    const turn=(x,y)=>{ if(!alive){ return; } if(x===-dir.x&&y===-dir.y) return; nextDir={x,y}; };
    reset();
    addEventListener('keydown',e=>{
      const t=e.target; if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k=(e.key||'').toLowerCase(), m={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]}[k];
      if(m&&started&&alive){ e.preventDefault(); turn(m[0],m[1]); }
      else if(m&&!alive&&started===false&&/^arrow/.test(k)&&box.matches(':hover')){ e.preventDefault(); start(); turn(m[0],m[1]); }
      else if(k==='enter'&&!alive&&(box.contains(document.activeElement)||document.activeElement===document.body)){ e.preventDefault(); start(); }
    });
    cv.addEventListener('click',()=>{ if(!alive) start(); });
    let sx=0, sy=0;
    cv.addEventListener('touchstart',e=>{ const p=e.touches[0]; sx=p.clientX; sy=p.clientY; if(!alive) start(); e.preventDefault(); },{passive:false});
    cv.addEventListener('touchend',e=>{ const p=e.changedTouches[0], dx=p.clientX-sx, dy=p.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<20) return; if(Math.abs(dx)>Math.abs(dy)) turn(dx>0?1:-1,0); else turn(0,dy>0?1:-1); });
    cv.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    share.addEventListener('click',async()=>{
      const text='I scored '+pts+' on the MadeOfPixels 404 page. Beat that: '+location.origin;
      try{ if(navigator.share) await navigator.share({text}); else { await navigator.clipboard.writeText(text); toast('Copied. Paste it to challenge a friend.'); } }catch(_){}
    });
  })();

  /* ---- 8. ruler secret: drag the line to the very end and straight back to the start ---- */
  (function(){
    let atEnd=0;
    const found=()=>{
      const el=document.createElement('div'); el.className='found mono'; el.textContent='You found the end.'; body.appendChild(el); setTimeout(()=>el.remove(),2800);
      if(!reduce) sparks(innerWidth-40,innerHeight/2,48);
    };
    addEventListener('scroll',()=>{
      const max=document.documentElement.scrollHeight-innerHeight; if(max<200) return;
      const drag=ruler._isDragging&&ruler._isDragging(); if(!drag){ atEnd=0; return; }
      if(scrollY>=max-3) atEnd=Date.now();
      else if(scrollY<=3&&atEnd&&Date.now()-atEnd<2500){ atEnd=0; found(); }
    },{passive:true});
  })();

  /* a short burst of square pixels (used by the ruler secret and the hidden pixels) */
  function sparks(x0,y0,n){
    const cv=document.createElement('canvas'); cv.className='rain'; cv.setAttribute('aria-hidden','true'); cv.style.zIndex=470; body.appendChild(cv);
    const ctx=cv.getContext('2d'), dpr=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr; ctx.scale(dpr,dpr);
    const ink=cssVar('--ink'), hot=cssVar('--accent'), P=[];
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=2+Math.random()*7; P.push({x:x0,y:y0,vx:Math.cos(a)*v-2,vy:Math.sin(a)*v,s:4+Math.random()*6,c:Math.random()<.4?hot:ink}); }
    const t0=performance.now();
    (function f(t){
      const el=t-t0; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.globalAlpha=Math.max(0,1-el/1100);
      P.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.28; ctx.fillStyle=p.c; ctx.fillRect(Math.round(p.x/4)*4,Math.round(p.y/4)*4,p.s,p.s); });
      if(el<1100) requestAnimationFrame(f); else cv.remove();
    })(t0);
  }

  /* ---- 9. draw: the cursor leaves a trail of fading pixels (also on touch) ---- */
  let trail=null;
  function toggleDraw(){
    if(trail){ trail.stop(); trail=null; toast('Trail off.'); return; }
    if(noMotion()) return;
    const cv=document.createElement('canvas'); cv.className='rain'; cv.setAttribute('aria-hidden','true'); cv.style.zIndex=440; body.appendChild(cv);
    const ctx=cv.getContext('2d'), dpr=Math.min(devicePixelRatio||1,2), size=8; let W=0,H=0;
    const fit=()=>{ W=innerWidth; H=innerHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }; fit();
    const P=[]; let raf=0, lastKey='';
    const loop=()=>{
      ctx.clearRect(0,0,W,H); const now=performance.now();
      for(let i=P.length-1;i>=0;i--){ const p=P[i], a=1-(now-p.t)/900; if(a<=0){ P.splice(i,1); continue; } ctx.globalAlpha=a; ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,size,size); }
      raf=P.length?requestAnimationFrame(loop):0;
    };
    const move=e=>{
      const x=Math.floor(e.clientX/size)*size, y=Math.floor(e.clientY/size)*size, k=x+','+y; if(k===lastKey) return; lastKey=k;
      P.push({x,y,t:performance.now(),c:Math.random()<.14?cssVar('--accent'):cssVar('--ink')}); if(!raf) raf=requestAnimationFrame(loop);
    };
    addEventListener('pointermove',move,{passive:true}); addEventListener('resize',fit);
    const esc=e=>{ if(e.key==='Escape'&&trail){ toggleDraw(); } }; addEventListener('keydown',esc);
    trail={stop(){ removeEventListener('pointermove',move); removeEventListener('resize',fit); removeEventListener('keydown',esc); cancelAnimationFrame(raf); cv.remove(); }};
    toast('Trail on. Type "draw" again or press Esc to stop. The sketch pad on the home page is for real: send us your drawing.',4800);
  }

  /* ---- 10. left right left right: the page turns 8-bit for a few seconds ---- */
  let bitT=0;
  function eightBit(){
    if(root.classList.contains('bit8')) return;
    if(!$('#bit8-f')){ const d=document.createElement('div'); d.style.cssText='position:absolute;width:0;height:0'; d.innerHTML='<svg width="0" height="0" aria-hidden="true" focusable="false"><filter id="bit8-f" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="discrete" tableValues="0 .33 .66 1"/><feFuncG type="discrete" tableValues="0 .33 .66 1"/><feFuncB type="discrete" tableValues="0 .33 .66 1"/></feComponentTransfer></filter></svg>'; body.appendChild(d); }
    root.classList.add('bit8'); toast('8-bit mode. Six seconds.',3000);
    clearTimeout(bitT); bitT=setTimeout(()=>root.classList.remove('bit8'),6000);
  }

  /* ---- 11. clock: between midnight and 5am the site notices ---- */
  (function(){
    const h=new Date().getHours(); if(h>=5) return;
    const hh=$('.hero-h'); if(hh){ const cur=$('.cursor',hh); hh.innerHTML='Still up? So are <em>we</em>.'; if(cur) hh.appendChild(cur); }
    $$('dt,.row span:first-child').forEach(e=>{ if(e.textContent.trim()!=='Hours') return; const v=e.tagName==='DT'?e.nextElementSibling:e.nextElementSibling; if(v) v.textContent='Replying at 9am'; });
  })();

  /* ---- 12. 2025: the studio timeline ---- */
  let story=null;
  function toggleStory(){
    if(story){ story.remove(); story=null; return; }
    const el=document.createElement('aside'); el.className='story'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','The studio timeline');
    el.innerHTML='<div class="story-h mono"><span>THE STUDIO / TIMELINE</span><button type="button" aria-label="Close">×</button></div><ol>'+STORY.map(s=>'<li><b class="mono">'+s[0]+'</b><span>'+s[1]+'</span></li>').join('')+'</ol>';
    body.appendChild(el); story=el; $('button',el).addEventListener('click',toggleStory);
  }

  /* ---- 13. the hunt: an orange pixel hides on each main page ---- */
  const huntSet=()=>{ try{ return JSON.parse(ls.get('mop-hunt')||'[]'); }catch(_){ return []; } };
  (function(){
    const spots={'/':[3,38,52],'/about':[2,71,30],'/services':[2,12,64],'/projects':[1,86,45],'/process':[2,44,78],'/contact':[2,28,22],'/blog':[1,63,70],'/gallery':[1,9,40]};
    const spot=spots[page]; if(!spot) return;
    const secs=$$('.sec'); const host=secs[Math.min(spot[0],secs.length-1)]; if(!host) return;
    const b=document.createElement('button'); b.type='button'; b.className='hunt'; b.tabIndex=-1; b.setAttribute('aria-hidden','true');
    b.style.left=spot[1]+'%'; b.style.top=spot[2]+'%'; host.appendChild(b);
    b.addEventListener('click',e=>{
      e.stopPropagation(); const set=huntSet(), isNew=set.indexOf(page)<0; if(isNew){ set.push(page); ls.set('mop-hunt',JSON.stringify(set)); }
      const r=b.getBoundingClientRect(); if(!reduce) sparks(r.left+3,r.top+3,28); b.classList.add('got');
      if(set.length>=HUNT_PAGES.length){ prize(); }
      else toast(isNew?'Pixel '+set.length+' of '+HUNT_PAGES.length+' found. Each main page hides one.':'You already have this one. '+set.length+' of '+HUNT_PAGES.length+'.');
    });
    if(huntSet().indexOf(page)>=0) b.classList.add('got');
  })();
  function prize(){
    if($('.prize')) return;
    const el=document.createElement('div'); el.className='prize'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Hidden pixels found');
    const msg=encodeURIComponent('Hi, I found all 8 hidden pixels on your website. Code: '+HUNT_CODE+'. I would like my free landing page.');
    el.innerHTML='<div class="prize-in"><span class="mono">ALL 8 PIXELS FOUND</span><h3>You earned a free <em>landing page</em>.</h3><p>Send us this code and we will start your page.</p><div class="prize-code mono">'+HUNT_CODE+'</div><div class="actions"><a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="'+(MOP.wa||'https://wa.me/')+'?text='+msg+'">Claim on WhatsApp →</a><button type="button" class="btn" data-x>Close</button></div></div>';
    body.appendChild(el); $('[data-x]',el).addEventListener('click',()=>el.remove());
    el.addEventListener('click',e=>{ if(e.target===el) el.remove(); });
    if(!reduce) sparks(innerWidth/2,innerHeight/2,70);
  }

  /* ---- 14. sound: tiny 8-bit blips when the ruler moves to a new stage (off by default) ---- */
  let soundOn=false, actx=null;
  const blip=(f=660)=>{
    try{
      actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume();
      const o=actx.createOscillator(), g=actx.createGain(); o.type='square'; o.frequency.setValueAtTime(f,actx.currentTime); o.frequency.setValueAtTime(f*1.5,actx.currentTime+.05);
      g.gain.setValueAtTime(.025,actx.currentTime); g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+.12); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+.13);
    }catch(_){}
  };
  function toggleSound(){
    if(!soundOn&&reduce){ toast('Sound effects stay off while reduced motion is on.'); return; }
    soundOn=!soundOn; if(soundOn) blip(880); toast(soundOn?'Sound on. Scroll to hear the stages. Type "sound" again to mute.':'Sound off.');
  }
  (function(){
    const labs=$('.r-labels'); if(!labs) return;
    new MutationObserver(ms=>{ if(!soundOn) return; ms.forEach(m=>{ if(m.attributeName==='class'&&m.target.classList.contains('is-active')&&!(m.oldValue||'').includes('is-active')) blip(520+Math.random()*260); }); })
      .observe(labs,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class']});
  })();

  /* ---- 15. stats: load time, weight and pixels, drawn as a small pixel card ---- */
  let statsEl=null;
  function toggleStats(){
    if(statsEl){ statsEl.remove(); statsEl=null; return; }
    const nav=performance.getEntriesByType('navigation')[0], res=performance.getEntriesByType('resource');
    const load=nav?Math.round(nav.loadEventEnd||nav.domContentLoadedEventEnd):0, dom=nav?Math.round(nav.domContentLoadedEventEnd):0;
    const kb=Math.round(((nav?nav.transferSize:0)+res.reduce((a,r)=>a+(r.transferSize||0),0))/1024);
    const px=innerWidth*innerHeight, found=huntSet().length;
    const rows=[['LOAD',load?load+' ms':'n/a'],['DOM READY',dom?dom+' ms':'n/a'],['TRANSFERRED',kb?kb+' KB':'cached'],['REQUESTS',String(res.length+1)],['PIXELS ON SCREEN',px.toLocaleString('en-IN')],['HIDDEN PIXELS',found+' / '+HUNT_PAGES.length]];
    const el=document.createElement('aside'); el.className='stats-card'; el.setAttribute('role','status');
    el.innerHTML='<div class="story-h mono"><span>THIS PAGE, IN PIXELS</span><button type="button" aria-label="Close">×</button></div>'+rows.map(r=>'<div class="sc-row mono"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'<div class="sc-bar" aria-hidden="true">'+Array.from({length:24},(_,i)=>'<i'+(i<Math.min(24,Math.round(load/150))?' class="on"':'')+'></i>').join('')+'</div>';
    body.appendChild(el); statsEl=el; $('button',el).addEventListener('click',toggleStats); setTimeout(()=>{ if(statsEl===el) toggleStats(); },14000);
  }

  /* ---- typed commands + the arrow-key code ---- */
  let buf='', arrows=[], arrowT=0;
  const commands={grid:toggleGrid,orange:hues,draw:toggleDraw,sound:toggleSound,stats:toggleStats,2025:toggleStory};
  addEventListener('keydown',e=>{
    const t=e.target; if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    const k=(e.key||'').toLowerCase();
    if(k==='escape'){ if(story) toggleStory(); if(statsEl) toggleStats(); const p=$('.prize'); if(p) p.remove(); }
    if(k.length===1){
      buf=(buf+k).slice(-8);
      for(const c in commands){ if(buf.slice(-c.length)===c){ buf=''; commands[c](); break; } }
    }
    if(k==='b'){ clearTimeout(arrowT); arrows=[]; }
    if(/^arrow(left|right)$/.test(k)){
      arrows=arrows.concat(k).slice(-4);
      if(arrows.join()==='arrowleft,arrowright,arrowleft,arrowright'){ arrows=[]; clearTimeout(arrowT); arrowT=setTimeout(eightBit,1100); }
    } else if(/^arrow/.test(k)) arrows=[];
  });
})();
