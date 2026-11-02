// Page builders. Each returns { path, file, html-options } consumed by build.js
const fs=require('fs'), path=require('path');
const L=require('./lib');
const P2=require('./pages2');
const {SITE,esc,em,strip,unent,SERVICES,PROJECTS,HOME_FAQ,AREAS,SERVICE_PAGES,INDUSTRIES,sec,pageHero,faqHTML,ctaSection,formHTML,li,crumbList,faqNode,pageNode}=L;

const renumber=h=>{ let n=0; return h.replace(/<div class="bar mono"><span>\d\d \/ /g,()=>'<div class="bar mono"><span>'+String(++n).padStart(2,'0')+' / '); };
const lis=a=>a.map(x=>'<div class="int-link"><a href="'+x[0]+'">'+x[1]+'<span>'+(x[2]||'Read more')+'</span></a></div>').join('');
const linkGrid=a=>'<div class="links-grid rv">'+lis(a)+'</div>';
const PH_SVG='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L100 100M100 0L0 100" stroke="currentColor" fill="none" vector-effect="non-scaling-stroke"/></svg>';
const ph=(n)=>'<div class="ph" role="img" aria-label="Placeholder for project image '+n+'">'+PH_SVG+'<span class="mono">[Project image placeholder]</span></div>';
const stepper=n=>'<div class="stepper" aria-hidden="true">'+[1,2,3,4].map(i=>'<i'+(i<n?' class="done"':i===n?' class="now"':'')+'></i>').join('')+'</div>';

/* ---------------------------------------------------------------- projects */
function projectCard(p,i){
  return `<a class="proj rv" href="/projects/${p.slug}" data-slug="${p.slug}" data-cat="${p.cat}" data-cover-host>
      <div class="row mono"><span>Project ${String(i+1).padStart(2,'0')}</span><span class="yr">${esc(p.status)}</span></div>
      <div class="cover-box"><canvas data-cover="${p.kind}" data-seed="${p.seed}" role="img" aria-label="Generative pixel artwork for ${esc(p.name)}, standing in for project screenshots"></canvas></div>
      <h3>${esc(p.name)}</h3>
      <p class="d">${esc(p.short)}</p>
      <div class="go mono"><span>${esc(p.catLabel)}</span><span class="arr">View case study →</span></div>
    </a>`;
}
function projectArticle(p,idx,level){
  const n=PROJECTS.length, prev=PROJECTS[(idx+n-1)%n], next=PROJECTS[(idx+1)%n], H=level===1?'h1':'h2';
  return `<article class="case-article" tabindex="-1" aria-labelledby="case-${p.slug}">
    <span class="tag mono">${esc(p.tag)} · ${esc(p.status)}</span>
    <${H} class="case-title" id="case-${p.slug}">${esc(p.name)}</${H}>
    <p class="case-lede">${esc(p.lede)}</p>
    <div class="case-cover"><canvas data-cover="${p.kind}" data-seed="${p.seed}" role="img" aria-label="Generative pixel artwork for ${esc(p.name)}, standing in for project screenshots"></canvas></div>
    <dl class="case-meta">
      <div><dt>Scope</dt><dd>${esc(p.scope)}</dd></div><div><dt>Output</dt><dd>${esc(p.output)}</dd></div>
      <div><dt>Focus</dt><dd>${esc(p.focus)}</dd></div><div><dt>Client</dt><dd>${esc(p.client)}</dd></div>
    </dl>
    <p class="case-lede" style="max-width:62ch">${esc(p.note)}</p>
    <h3 class="case-h">How it came {{together}}.</h3>
    <div class="case-progress" aria-hidden="true"><i></i></div>
    <ol class="case-steps">
      ${p.steps.map(s=>'<li><span class="case-step-name">'+esc(s[0])+'</span><p>'+esc(s[1])+'</p></li>').join('\n      ')}
    </ol>
    <h3 class="case-h">The {{stack}}.</h3>
    <div class="stack-pills">${p.stack.map(s=>'<span class="pill">'+esc(s)+'</span>').join('')}</div>
    <h3 class="case-h">What’s {{inside}}.</h3>
    <ul class="feat">${p.features.map((f,k)=>'<li><span>'+String(k+1).padStart(2,'0')+'</span>'+esc(f)+'</li>').join('')}</ul>
    <div class="case-cta actions"><button class="btn btn-primary" type="button" data-similar="${esc(p.name)}" data-type="${esc(p.type)}">Start a similar project →</button><a class="btn" href="/projects">All projects</a></div>
    <nav class="case-nav" aria-label="More projects">
      <a href="/projects/${prev.slug}" data-slug="${prev.slug}"><small>← Previous</small><span>${esc(prev.name)}</span></a>
      <a href="/projects/${next.slug}" data-slug="${next.slug}"><small>Next →</small><span>${esc(next.name)}</span></a>
    </nav>
  </article>`.replace(/\{\{(.+?)\}\}/g,'<em>$1</em>');
}

function projectsIndex(v){
  const title='Projects & Case Studies | Web Apps, SaaS & Branding | MadeOfPixels Studio';
  const desc='Selected projects by MadeOfPixels Studio: MachinaERP project tracking SaaS, the studio brand identity and FileLink QR file sharing. Open any project for the full case study.';
  const crumbs=[['Home','/'],['Projects','/projects']];
  const cats=[['all','All'],['saas','SaaS'],['brand','Brand identity'],['webapp','Web app']];
  const body=`${pageHero({crumbs,tag:'Selected projects',h1:'Things we {{made}}.',sub:'Real work for real businesses. Open any project to read the case study, switch the view, or filter by type.'})}
${sec({id:'projects',stage:'Projects',num:'01',name:'Projects',tagline:'Click a project to open it',bodyStyle:'padding:0',body:`
    <div class="proj-tools">
      <div class="fchips" role="group" aria-label="Filter projects">${cats.map(c=>'<button class="fchip" type="button" data-filter="'+c[0]+'" aria-pressed="'+(c[0]==='all')+'">'+c[1]+'</button>').join('')}</div>
      <div class="vtoggle" role="group" aria-label="Change view"><button class="fchip" type="button" data-view="grid" aria-pressed="true">Grid</button><button class="fchip" type="button" data-view="list" aria-pressed="false">List</button></div>
      <p class="mono" id="proj-count" role="status" aria-live="polite"></p>
    </div>
    <div class="proj-list" id="proj-list" data-view="grid">
    ${PROJECTS.map(projectCard).join('\n    ')}
    </div>
    <div class="work-more mono"><span class="faint">Got a project that should be on this page? Let’s build it.</span><a class="btn" href="/contact" data-open-contact>Start a project →</a></div>`})}
${ctaSection({num:'02'})}
<div id="proj-peek" aria-hidden="true"><canvas></canvas></div>`;
  const after=`<dialog class="proj-dialog" id="proj-dialog" data-lenis-prevent aria-label="Project case study">
  <div class="pd-bar mono"><span>Case study · use ← → to browse</span><button class="dlg-close mono" type="button" id="proj-close" aria-label="Close case study">Close ✕</button></div>
  <div id="proj-body"></div>
</dialog>
${PROJECTS.map((p,i)=>'<template id="tpl-'+p.slug+'">'+projectArticle(p,i,2)+'</template>').join('\n')}`;
  const list={'@type':'ItemList',itemListElement:PROJECTS.map((p,i)=>({'@type':'ListItem',position:i+1,url:SITE.url+'/projects/'+p.slug,name:p.name}))};
  return {path:'/projects',file:'projects.html',opts:{path:'/projects',title,desc,nav:'projects',body,afterFooter:after,crumbs,pageType:'CollectionPage',graph:[list],v}};
}
function projectPage(p,i,v){
  const path='/projects/'+p.slug, crumbs=[['Home','/'],['Projects','/projects'],[p.name,path]];
  const body=`<section class="page-hero" data-pre id="top" style="padding-bottom:clamp(24px,3vw,40px);border-bottom:0">${L.crumbsHTML(crumbs)}</section>
<section class="sec" id="case" data-stage="Case study" style="border-top:0">
${projectArticle(p,i,1)}
</section>
${ctaSection({num:'02'})}`;
  const work={'@type':'CreativeWork','@id':SITE.url+path+'#project',name:p.name,headline:p.name,description:p.lede,url:SITE.url+path,creator:{'@id':L.SITE.url+'/#business'},keywords:p.stack.join(', '),genre:p.catLabel,inLanguage:'en-IN',isPartOf:{'@id':SITE.url+path+'#webpage'}};
  return {path,file:'projects/'+p.slug+'.html',opts:{path,title:p.seoTitle,desc:p.seoDesc,nav:'projects',body,crumbs,graph:[work],ogType:'article',v}};
}

/* ---------------------------------------------------------------- home */
function home(v){
  const tiles=SERVICES.filter(s=>!s.extra).map((s,i)=>`<a class="tile rv" href="/services#${s.slug}"><div class="top mono"><span>${String(i+1).padStart(2,'0')}</span><div class="glyph" data-px="${s.tile}"></div></div><h3>${esc(s.name)}</h3></a>`).join('\n    ');
  const marquee=['Built from scratch','Zero templates','Bold by design','Custom code','Pixel perfect','Made in India','Shipped global'].map(t=>'<span class="mq-item">'+t+'</span>').join('');
  const body=`<section class="hero" id="home" data-pre aria-label="Made of Pixels">
  <div class="frame">
    <i class="xh tl"></i><i class="xh tr"></i><i class="xh bl"></i><i class="xh br"></i>
    <div class="meta mono"><span>Web design studio —</span><span>Bold by design · Built from scratch</span><span>Est. 2025 · India &amp; Global</span></div>
    <div class="wm-wrap">
      <h1 class="wm" id="wm"><span class="wm-line">Made of</span> <span class="wm-line">Pixels</span><span class="sr-only"> Studio: web design agency in Vasai and Mumbai</span></h1>
    </div>
    <div class="hero-lower">
      <div>
        <h2 class="hero-h">Your site should make people <em>stop</em> scrolling.<span class="cursor" aria-hidden="true"></span></h2>
        <p class="hero-copy">Custom websites. Built from scratch. Zero templates.</p>
        <div class="actions"><a class="btn btn-primary" href="/contact" data-open-contact>Start a project →</a><a class="btn" href="/projects">See the work</a></div>
      </div>
      <div class="stats mono" aria-label="Studio status">
        <div><span>Templates used</span><i></i><b>0</b></div><div><span>Status</span><i></i><b>Building</b></div><div><span>Client</span><i></i><b>Hyped</b></div>
      </div>
    </div>
    <div class="sqrow" id="sqrow" aria-hidden="true"></div>
  </div>
</section>
${sec({id:'manifesto',stage:'Manifesto',num:'01',name:'Manifesto',tagline:'What we believe',body:`
    <h2 class="h2 rv">We don’t do templates. We don’t do {{average}}.</h2>
    <div class="manifesto">
      <div class="stack">
        <p class="quote rv">Every great thing is built from raw materials. Pixels are ours.</p>
        <p class="lede rv">We’re the studio that argues over 4px of spacing at 2am. Because your users will feel it even if they never notice it.</p>
        <p class="rv" style="max-width:52ch;color:var(--ink-2)">Why the name? It’s literally what the web is made of. Not “Pixel Studio”. Not “Digital Co”. A complete sentence. A declaration.</p>
        <p class="rv"><a class="btn" href="/about">About the studio →</a></p>
      </div>
      <div class="counter rv">
        <div class="row mono"><span>By the numbers</span><span>Live count</span></div>
        <div class="cstats">
          <div class="cs"><div class="big" aria-hidden="true">0</div><span class="mono">Templates used</span></div>
          <div class="cs"><div class="big" aria-hidden="true">10+</div><span class="mono">Projects delivered</span></div>
        </div>
        <p class="sr-only">Zero templates used. Ten or more projects delivered.</p>
        <div class="row mono"><span>Status: Building</span><span>Client: Hyped</span></div>
      </div>
    </div>
    ${P2.sketchBlock()}`})}
${sec({id:'services',stage:'Services',num:'02',name:'Services',tagline:'What we build',bodyStyle:'padding-bottom:clamp(32px,4vw,56px)',body:`    <h2 class="h2 rv">You bring the brief. We bring the {{obsession}}.</h2>`}).replace('</section>',`  <div class="tiles">
    ${tiles}
    <a class="tile all rv" href="/services" aria-label="All services"><div class="top mono"><span>+</span><span>All</span></div><div><div class="arrow" aria-hidden="true">→</div><h3>All Services</h3></div></a>
  </div>
  <div class="marquee" aria-label="Studio principles"><div class="mq-track"><div class="mq-set">${marquee}</div></div></div>
</section>`)}
${sec({id:'process',stage:'Process',num:'03',name:'Process',tagline:'How it gets done',bodyStyle:'padding-bottom:0',body:`    <h2 class="h2 rv">From brief to {{live}}.</h2>`}).replace('</section>',`  <div class="steps">
    <article class="step rv"><header class="mono"><span>Brief · 1–2 days</span><span>01</span></header><div class="in"><p>You talk. We interrogate the brief until it’s sharp.</p>${stepper(1)}</div></article>
    <article class="step rv"><header class="mono"><span>Design · 3–5 days</span><span>02</span></header><div class="in"><p>Every gap argued over. Nothing moves on until it feels right.</p>${stepper(2)}</div></article>
    <article class="step rv"><header class="mono"><span>Build · 2–4 weeks</span><span>03</span></header><div class="in"><p>Hand-written code. No page builders. No plugin crutches.</p>${stepper(3)}</div></article>
    <article class="step rv"><header class="mono"><span>Launch · 1–2 days</span><span>04</span></header><div class="in"><p>Tested, tuned, shipped. Then we stay on call.</p>${stepper(4)}</div></article>
  </div>
</section>`)}
${sec({id:'work',stage:'Work',num:'04',name:'Work',tagline:'Selected projects',bodyStyle:'padding-bottom:clamp(32px,4vw,56px)',body:`    <h2 class="h2 rv">The work {{speaks}}.</h2>`}).replace('</section>',`  <div class="proj-list" data-view="grid">
    ${PROJECTS.map(projectCard).join('\n    ')}
  </div>
  <div class="work-more mono"><span class="faint">Every project opens as a full case study.</span><a class="btn" href="/projects">All projects →</a></div>
</section>`)}
${P2.reviewsSection()}
${sec({id:'gallery',stage:'Gallery',num:'00',name:'Gallery',tagline:'The wall of pixels',body:`    <h2 class="h2 rv">The wall of {{pixels}}.</h2>
    <p class="lede rv" style="margin-top:24px">Sketches drawn on this site by the studio and by visitors. Add yours with the pad above.</p>
    ${P2.galleryGrid(L.GALLERY.slice(0,4))}
    <p class="rv" style="margin-top:32px"><a class="btn" href="/gallery">See the whole wall →</a></p>`})}
${sec({id:'blog',stage:'Blog',num:'00',name:'Blog',tagline:'Latest articles',bodyStyle:'padding-bottom:clamp(32px,4vw,56px)',body:`    <h2 class="h2 rv">Notes from the {{studio}}.</h2>`}).replace('</section>',`  <div class="post-list">
    ${L.POSTS.slice(0,3).map(p=>'<a class="post-card rv" href="/blog/'+p.slug+'"><div class="row mono"><span>'+esc(p.category)+'</span><span>'+P2.fmtDate(p.date)+'</span></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.excerpt||p.description)+'</p><span class="mono arr">Read article →</span></a>').join('')}
  </div>
  <div class="work-more mono"><span class="faint">Guides on website cost, SEO and local business.</span><a class="btn" href="/blog">All articles →</a></div>
</section>`)}
${sec({id:'faq',stage:'FAQ',num:'05',name:'FAQ',tagline:'Common questions',body:`    <h2 class="h2 rv">Got {{questions}}?</h2>
    <div class="rv">${faqHTML(HOME_FAQ)}</div>`})}
${sec({id:'areas',stage:'Areas',num:'06',name:'Areas',tagline:'Where we work',body:`    <h2 class="h2 rv">Local team. Global {{quality}}.</h2>
    <p class="lede rv" style="margin-top:24px">Based in Vasai West. Building for Vasai, Virar, Mumbai, Thane, Nalasopara, Mira Road and clients across India and the world.</p>
    ${linkGrid(AREAS.concat(SERVICE_PAGES).map(a=>[a[0],a[1],'MadeOfPixels Studio']).concat([['/services#areas','All areas we serve','Vasai, Mumbai, Thane and more']]))}`})}
${ctaSection({num:'07'})}`;
  const title='Web Design Agency in Vasai & Mumbai | MadeOfPixels Studio';
  const desc='Top web design agency in Vasai & Mumbai. Custom websites, branding & UI/UX design — hand-coded, pixel-perfect, built to convert. Free quote in 24hrs.';
  return {path:'/',file:'index.html',opts:{path:'/',title,desc,nav:'home',body:renumber(body),v,
    keywords:'web design agency in Vasai, website developer in Vasai, web designer in Vasai, web designer in Mumbai, website developer in Mumbai, branding agency in Vasai, UI UX design in Mumbai, web designer near me, web design agency Vasai West, custom website development Mumbai, digital agency Vasai, graphic design Mumbai',
    ogDesc:'Bold websites, brand identities, and digital products. We build pixel-perfect experiences that convert.',graph:[faqNode(HOME_FAQ)]}};
}

/* ---------------------------------------------------------------- about */
function about(v){
  const crumbs=[['Home','/'],['About','/about']];
  const vals=[['01 — Craft','Built from scratch','No page builders. No drag-and-drop. Hand-coded for performance, precision and longevity.'],
    ['02 — Identity','Design that owns a room','Your website should walk into a room and command attention. Generic is forgettable. We’re not.'],
    ['03 — Speed','Fast by obsession','Under 2s load time. Optimised assets. Clean code. Speed isn’t a feature, it’s respect for your users.'],
    ['04 — Results','Built to convert','Beautiful is table stakes. We design journeys that turn visitors into clients.']];
  const pillars=[['A','Energetic','Fast. Direct. No fluff. Every word earns its space.'],['B','Confident','We know what we do. We say it without apology.'],['C','Builder','We build things. Real things. Not drag-and-drop things.'],['D','Hype','The brand has volume. Clients feel the energy before the pitch.']];
  const why=[['01 —','We build. We don’t assemble.','Every site is hand-coded. No Webflow, no WordPress themes, no Elementor. We write the HTML, the CSS and the JS. That’s why it’s fast, unique and yours.'],
    ['02 —','One studio. Full accountability.','You’re not bounced between a designer, a developer and an account manager. You work with us directly. Decisions move fast. Quality stays consistent.'],
    ['03 —','Bold is a strategy.','Safe design doesn’t win attention. We build websites that make people stop scrolling, not because they’re flashy, but because they’re right.']];
  const steps=[['Brief','1–2 days','We interrogate the brief. Your goals, your audience, your competitors, your gaps. No guessing. We build on facts.'],['Design','3–5 days','One strong concept. Not three mediocre options. We bring our recommendation and defend it. You refine it.'],['Build','2–4 weeks','Code goes down fast. You see progress in real time. Every screen, every interaction, every hover state, hand-crafted.'],['Launch','1–2 days','We deploy, test across devices and browsers, and hand you a site that works. Then we stick around to make sure it stays that way.']];
  const body=`${pageHero({crumbs,tag:'About the studio',h1:'We build {{loud}}.',sub:'Not a template shop. Not a theme reseller. MadeOfPixels Studio is a web design agency in Vasai West, Maharashtra, building custom digital experiences for brands that refuse to look like everyone else.',actions:'<a class="btn btn-primary" href="/contact" data-open-contact>Start a project →</a><a class="btn" href="/projects">See the work</a>'})}
${sec({id:'studio',stage:'Studio',num:'01',name:'Who we are',tagline:'Established 2025',body:`
    <h2 class="h2 rv">Every project starts with a blank {{canvas}}.</h2>
    <div class="split">
      <div class="split-l"><div class="prose rv"><p>Made of Pixels is a web design agency and website development studio based in Vasai, Mumbai. We build custom digital experiences for brands that refuse to look like everyone else.</p><p>We argue over 4px of spacing at 2am because your users will feel it. Every pixel is placed with intent. We don’t copy. We don’t compromise. We build.</p></div>
      <div class="stats-row rv"><div class="stat-box"><div class="stat-num">10+</div><div class="stat-label">Projects delivered</div></div><div class="stat-box"><div class="stat-num">0</div><div class="stat-label">Templates used</div></div><div class="stat-box"><div class="stat-num">100%</div><div class="stat-label">Custom code</div></div><div class="stat-box"><div class="stat-num">24hr</div><div class="stat-label">Quote turnaround</div></div></div></div>
      <dl class="facts rv">
        <div><dt>Studio</dt><dd>${SITE.name}</dd></div><div><dt>Established</dt><dd>2025</dd></div>
        <div><dt>Based in</dt><dd>Vasai West, Maharashtra</dd></div><div><dt>Serving</dt><dd>India &amp; Global</dd></div>
        <div><dt>Hours</dt><dd>Mon–Sat · 09:00–20:00</dd></div><div><dt>Email</dt><dd><a href="mailto:${SITE.email}">${SITE.email}</a></dd></div>
        <div><dt>WhatsApp</dt><dd><a href="${SITE.wa}" target="_blank" rel="noopener noreferrer">${SITE.phoneDisp}</a></dd></div>
      </dl>
    </div>`})}
${sec({id:'values',stage:'Values',num:'02',name:'What we stand for',tagline:'Four non-negotiables',body:`
    <h2 class="h2 rv">Craft, identity, speed, {{results}}.</h2>
    <div class="cells c4 rv">${vals.map(x=>'<article class="cell-i"><span class="n mono">'+x[0]+'</span><div><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div></article>').join('')}</div>`})}
${sec({id:'principles',stage:'Principles',num:'03',name:'Principles',tagline:'How we behave',body:`
    <h2 class="h2 rv">The way we {{build}}.</h2>
    <div class="cells c4 rv">${pillars.map(x=>'<article class="cell-i"><span class="n mono">'+x[0]+'</span><div><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div></article>').join('')}</div>`})}
${sec({id:'why',stage:'Why us',num:'04',name:'Why Made of Pixels',tagline:'Zero templates. Zero average.',body:`
    <h2 class="h2 rv">Zero templates. Zero {{average}}.</h2>
    <div class="cells c3 rv">${why.map(x=>'<article class="cell-i"><span class="n mono">'+x[0]+'</span><div><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div></article>').join('')}</div>`})}
${sec({id:'process',stage:'Process',num:'05',name:'Process',tagline:'How it gets done',body:`
    <h2 class="h2 rv">From brief to {{live}}.</h2>
    <div class="cells c4 rv">${steps.map((x,i)=>'<article class="cell-i"><span class="n mono">0'+(i+1)+' — '+x[1]+'</span><div><h3>'+x[0]+'</h3><p>'+x[2]+'</p></div>'+stepper(i+1)+'</article>').join('')}</div>`})}
${ctaSection({num:'06'})}`;
  return {path:'/about',file:'about.html',opts:{path:'/about',title:'About MadeOfPixels Studio | Custom Web Design Agency in Vasai & Mumbai',
    desc:'MadeOfPixels Studio is a Vasai West web design agency building hand-coded, zero-template websites. Meet the studio, our principles, our process and 10+ delivered projects.',
    nav:'about',body,crumbs,pageType:'AboutPage',v,keywords:'about MadeOfPixels Studio, web design agency Vasai West, custom web design studio Mumbai, hand-coded websites, zero templates'}};
}

/* ---------------------------------------------------------------- services */
function services(v){
  const crumbs=[['Home','/'],['Services','/services']];
  const rows=SERVICES.map((s,i)=>`<article class="svc-row rv" id="${s.slug}">
      ${s.tile?'<div class="glyph" data-px="'+s.tile+'"></div>':'<div></div>'}
      <div><span class="mono faint">${String(i+1).padStart(2,'0')}</span><h3>${esc(s.name)}</h3></div>
      <div><p>${esc(s.desc)}</p><p style="margin-top:14px"><a href="${s.link}" ${s.link==='/contact'?'data-open-contact ':''}class="mono" style="text-underline-offset:3px">${s.link==='/contact'?'Ask about this':'Learn more'} →</a></p></div>
      <ul>${s.list.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>
    </article>`).join('\n    ');
  const body=`${pageHero({crumbs,tag:'Services',h1:'You bring the brief. We bring the {{obsession}}.',sub:'Web design, brand identity, UI/UX, web apps and graphic design. Every engagement is scoped to what you actually need. No bloated packages. We pick the tools that serve the work.',actions:'<a class="btn btn-primary" href="/contact" data-open-contact>Start a project →</a><a class="btn" href="/projects">See the work</a>'})}
${sec({id:'what',stage:'Services',num:'01',name:'Services',tagline:'What we build',body:`
    <h2 class="h2 rv">Built from scratch. Every {{time}}.</h2>
    <div class="svc-rows">${rows}</div>`})}
${sec({id:'areas',stage:'Areas',num:'02',name:'Areas',tagline:'Where we work',body:`
    <h2 class="h2 rv">Serving Vasai, Mumbai and {{beyond}}.</h2>
    <p class="lede rv" style="margin-top:24px">We’re based in Vasai West and serve Virar, Nalasopara, Mira Road, Mumbai, Thane, Navi Mumbai, and clients across India remotely.</p>
    ${linkGrid(AREAS.concat(L.LOCATIONS.map(l=>['/'+l.slug,'Web design in '+l.name])).map(a=>[a[0],a[1],'Local web design']))}`})}
${sec({id:'industries',stage:'Industries',num:'03',name:'Industries',tagline:'Who we build for',body:`
    <h2 class="h2 rv">Websites that fit your {{industry}}.</h2>
    ${linkGrid(SERVICE_PAGES.map(a=>[a[0],a[1],'Service']).concat(INDUSTRIES.map(a=>[a[0],a[1],'Industry'])))}`})}
${ctaSection({num:'04'})}`;
  const svcGraph=SERVICES.map(s=>({'@type':'Service','@id':SITE.url+'/services#'+s.slug,name:s.name,description:s.desc.replace(/ \[EDIT[^\]]*\]/,''),provider:{'@id':SITE.url+'/#business'},areaServed:['Vasai','Mumbai','India'],url:SITE.url+'/services#'+s.slug}));
  return {path:'/services',file:'services.html',opts:{path:'/services',title:'Web Design, Development & Branding Services in Vasai & Mumbai | MadeOfPixels',
    desc:'Custom websites, UI/UX design, brand identity, web apps, e-commerce, landing pages and maintenance from MadeOfPixels Studio in Vasai and Mumbai. Hand-coded. Zero templates.',
    nav:'services',body,crumbs,v,graph:svcGraph,keywords:'web design services Vasai, website development Mumbai, branding agency Vasai, UI UX design Mumbai, web app development, graphic design Mumbai'}};
}

/* ---------------------------------------------------------------- contact */
function contact(v){
  const crumbs=[['Home','/'],['Contact','/contact']];
  const chip=(n,val,l,c)=>'<label class="chip"><input type="radio" name="'+n+'" value="'+val+'"'+(c?' checked':'')+'><span>'+l+'</span></label>';
  const est=`<div class="est rv" id="estimator" role="group" aria-labelledby="est-title">
      <div class="est-head mono"><span id="est-title">Quick estimate</span><span>Rough range in ten seconds</span></div>
      <div class="est-body">
        <div class="est-opts">
          <fieldset><legend class="mono">Project type</legend><div class="chips">${['Custom Website','UI/UX Design','Brand Identity','Web App','E-commerce','Landing Page','Maintenance'].map(x=>chip('est-type',x,x)).join('')}</div></fieldset>
          <fieldset><legend class="mono">Pages</legend><div class="chips">${[['1','1 page'],['2-5','2–5 pages'],['6-10','6–10 pages'],['10+','10+ pages']].map((x,i)=>chip('est-pages',x[0],x[1],i===1)).join('')}</div></fieldset>
          <fieldset><legend class="mono">Timeline</legend><div class="chips">${[['standard','Standard'],['fast','Fast-track'],['flexible','Flexible']].map((x,i)=>chip('est-time',x[0],x[1],i===0)).join('')}</div></fieldset>
        </div>
        <div class="est-out">
          <div><p class="mono faint">Estimated range</p><p class="est-figure" id="est-figure" aria-live="polite">—</p><p class="est-note" id="est-note">Pick a project type to begin.</p></div>
          <button class="btn btn-primary" type="button" id="est-use" disabled>Use this in the form →</button>
        </div>
      </div>
    </div>`;
  const faq=[['How much does a website cost in Vasai?','Website pricing depends on scope. A basic business website starts from ₹15,000–₹30,000. A full custom website with animations and multiple sections typically ranges from ₹30,000–₹80,000. Contact us for a free quote.'],
    ['How long does it take to build a website?','A standard business website takes 1–3 weeks. Complex web apps or projects with branding included take 3–6 weeks. We give you a clear timeline before starting.'],
    ['Do you provide SEO with the website?','Yes. Every website we build is SEO-optimised by default: meta tags, schema markup, fast loading, mobile responsive, and correct heading structure.'],
    ['Can I update my website after it’s built?','Yes. We either build with a CMS so you can update it yourself, or offer a maintenance package where we handle updates for you.']];
  const body=`${pageHero({crumbs,tag:'Contact',h1:'Ready to build something {{real}}?',sub:'Tell us what you’re building. We reply within 24 hours. No commitments.',actions:'<a class="btn btn-primary" href="'+SITE.wa+'" target="_blank" rel="noopener noreferrer">WhatsApp us →</a><a class="btn" href="mailto:'+SITE.email+'">Email us</a>'})}
${sec({id:'estimate',stage:'Estimate',num:'01',name:'Estimate',tagline:'Optional, takes ten seconds',body:`
    <h2 class="h2 rv">Get a rough {{range}}.</h2>
    ${est}`})}
${sec({id:'enquiry',stage:'Enquiry',num:'02',name:'Enquiry',tagline:'Tell us everything',body:`
    <h2 class="h2 rv">Send us the {{brief}}.</h2>
    <div class="contact-grid" style="margin-top:clamp(48px,6vw,96px)">
      ${formHTML('p','page')}
      <aside class="contact rv" aria-label="Contact details">
        <div class="big">India &amp; Global</div>
        <div class="row mono"><span>Email</span><a href="mailto:${SITE.email}">${SITE.email}</a></div>
        <div class="row mono"><span>WhatsApp</span><a href="${SITE.wa}" target="_blank" rel="noopener noreferrer">${SITE.phoneDisp}</a></div>
        <div class="row mono"><span>Phone</span><a href="tel:${SITE.phone2}">${SITE.phone2Disp}</a></div>
        <div class="row mono"><span>City</span><a href="https://maps.google.com/?q=Vasai+West+Maharashtra" target="_blank" rel="noopener noreferrer">Vasai West, Maharashtra 401202</a></div>
        <div class="row mono"><span>Hours</span><span>Mon–Sat · 09:00–20:00</span></div>
        <div class="row mono"><span>Instagram</span><a href="${SITE.ig}" target="_blank" rel="noopener noreferrer">@madeofpixelsstudio</a></div>
        <div class="row mono"><span>LinkedIn</span><a href="${SITE.li}" target="_blank" rel="noopener noreferrer">MadeOfPixels</a></div>
        <div class="row mono faint"><span>Status: Building · Client: Hyped · Templates used: 0</span></div>
      </aside>
    </div>`})}
${sec({id:'faq',stage:'FAQ',num:'03',name:'FAQ',tagline:'Common questions',body:`
    <h2 class="h2 rv">Quick {{answers}}.</h2>
    <div class="rv">${faqHTML(faq)}</div>`})}`;
  const faqLd=faqNode(faq);
  return {path:'/contact',file:'contact.html',opts:{path:'/contact',title:'Contact MadeOfPixels Studio | Free Website Quote in 24 Hours, Vasai & Mumbai',
    desc:'Get a free website quote within 24 hours. Contact MadeOfPixels Studio in Vasai West by email, WhatsApp or phone, or send your brief through the form.',
    nav:'contact',body,crumbs,pageType:'ContactPage',v,graph:[faqLd],keywords:'contact web design agency Vasai, free website quote Mumbai, web designer near me, hire website developer Vasai'}};
}

/* ---------------------------------------------------------------- landing pages (parsed from the existing site) */
/* the original FAQs used [area]-style stand-ins; swap in real examples */
const FIX=s=>[["'CA in [your area]'","'CA in Vasai' or 'CA firm in Mumbai'"],["'[specialty] doctor in [area]'","'dentist in Vasai' or 'skin doctor in Mumbai'"],["'restaurant in [area]' and 'best [cuisine] near me in [area]'","'restaurant in Vasai' and 'best Chinese restaurant near me in Mumbai'"]].reduce((a,p)=>a.split(p[0]).join(p[1]),s);
const HREF_MAP={'/#work':'/projects','/#about':'/about','/#services':'/services','/#process':'/about#process','/#cta':'/contact'};
function emphasize(html){
  let t=html.replace(/<span style="position:absolute[^>]*>[\s\S]*?<\/span>/g,'').replace(/<br\s*\/?>/gi,' ').replace(/<span class=['"]grn['"]>([\s\S]*?)<\/span>/g,(m,g)=>'\u0001'+g+'\u0002');
  t=strip(t.replace(/<\/div>\s*<div/g,'</div> <div').replace(/<\/span>\s*<span/g,'</span> <span'));
  t=t.replace(/\u0001([^\u0002]*)\u0002/,(m,g)=>{ g=g.trim(); const mm=g.match(/^(.*?)([A-Za-z0-9&'’\/+-]+)([.?!]*)$/); return mm?(mm[1]+'{{'+mm[2]+'}}'+mm[3]):g; });
  return t.replace(/[\u0001\u0002]/g,'').replace(/\s+/g,' ').trim();
}
function convert(html){
  let h=html;
  h=h.replace(/<div style="margin-top:24px;[^"]*">/g,'<div class="portfolio-note">');
  h=h.replace(/\s*style="[^"]*"/g,'');
  h=h.replace(/<div class="faq-grid">/g,'<div class="faq">').replace(/<div class="faq-item"><div class="faq-q">([\s\S]*?)<\/div><div class="faq-a">([\s\S]*?)<\/div><\/div>/g,'<details><summary>$1</summary><div class="faq-a">$2</div></details>');
  h=h.replace(/<a href="mailto:hello@madeofpixels\.in" class="btn-primary">/g,'<a href="/contact" data-open-contact class="btn btn-primary">');
  h=h.replace(/class="btn-primary"/g,'class="btn btn-primary"').replace(/class="btn-ghost"/g,'class="btn"').replace(/class="btn-dark"/g,'class="btn"');
  h=h.replace(/href="(\/#[a-z]+)"/g,(m,x)=>'href="'+(HREF_MAP[x]||'/')+'"');
  return h.trim();
}
const stageFor=label=>{ const l=label.toLowerCase(); return /related/.test(l)?'Related':/case/.test(l)?'Case study':/faq/.test(l)?'FAQ':/service/.test(l)?'Services':'Overview'; };
const NUM=n=>String(n).padStart(2,'0');
function landing(file,v){
  const h=FIX(fs.readFileSync(path.join(__dirname,'source-repo',file),'utf8'));
  const g=(re)=>{const m=h.match(re);return m?m[1]:''};
  const slug=file.replace('.html',''), p='/'+slug;
  const title=unent(g(/<title>([^<]*)<\/title>/)), desc=unent(g(/<meta name="description" content="([^"]*)"/)), keywords=unent(g(/<meta name="keywords" content="([^"]*)"/));
  const blocks=[...h.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map(m=>{try{return JSON.parse(m[1])}catch(e){return null}}).filter(Boolean);
  const faqLd=blocks.find(b=>b['@type']==='FAQPage');
  const wp=blocks.find(b=>b['@type']==='WebPage')||{};
  const crumbName=strip(g(/<div class="breadcrumb">[\s\S]*?<span>([\s\S]*?)<\/span>/))||title.split('|')[0].trim();
  const heroHtml=g(/<section class="hero-page">([\s\S]*?)<\/section>/);
  const tag=strip(g(/class="hero-tag">([\s\S]*?)<\/span>/));
  const h1=emphasize(g(/<h1 class="hero-h1">([\s\S]*?)<\/h1>/)||crumbName);
  const sub=g(/<p class="hero-sub">([\s\S]*?)<\/p>/);
  const heroEnd=h.indexOf('</section>',h.indexOf('<section class="hero-page">'))+10;
  const ctaIdx=h.indexOf('<div class="cta-band">');
  const rest=h.slice(heroEnd,ctaIdx);
  const secs=[];
  for(const m of rest.matchAll(/<section([^>]*)>([\s\S]*?)<\/section>/g)){
    const inner=m[2], label=strip((inner.match(/<div class="sec-label">([\s\S]*?)<\/div>/)||[])[1]||'');
    const tm=inner.match(/<h2 class="sec-title"[^>]*>([\s\S]*?)<\/h2>/);
    let content=inner.replace(/<div class="sec-label">[\s\S]*?<\/div>/,'').replace(/<h2 class="sec-title"[^>]*>[\s\S]*?<\/h2>/,'');
    if(!label&&secs.length){ secs[secs.length-1].content+=content; continue; }
    secs.push({label,title:tm?emphasize(tm[1]):'',content});
  }
  const ctaT=emphasize(g(/class="cta-band-title">([\s\S]*?)<\/div>/)||'Ready to build something real?'), ctaS=strip(g(/class="cta-band-sub">([\s\S]*?)<\/div>/));
  const crumbs=[['Home','/'],['Services','/services'],[crumbName,p]];
  let n=0, body=pageHero({crumbs,tag,h1,sub:strip(sub).length?sub:'',actions:'<a class="btn btn-primary" href="/contact" data-open-contact>Get a free quote →</a><a class="btn" href="'+SITE.wa+'" target="_blank" rel="noopener noreferrer">WhatsApp us ↗</a>'}).replace('<section class="page-hero"','<section class="page-hero lp"');
  secs.forEach((s,i)=>{
    n++;
    const lab=s.label.replace(/^\d+\s*[—-]\s*/,'');
    let content=convert(s.content);
    if(/related/i.test(s.label)) content=content.replace(/<div class="links-grid">/,'<div class="links-grid">').replace(/<a href="\/projects">View All Work<\/a><span>Our portfolio<\/span>/,'<a href="/projects">View all work</a><span>Our portfolio</span>')
      .replace(/(<div class="links-grid">)/,'$1<div class="int-link"><a href="/about">About the studio</a><span>Who we are</span></div><div class="int-link"><a href="/contact">Contact</a><span>Free quote in 24hrs</span></div>');
    body+='\n'+sec({id:'s'+n,stage:stageFor(s.label),num:NUM(n),name:lab||'Overview',tagline:'MadeOfPixels Studio',cls:'lp',body:(s.title?'    <h2 class="sec-title rv">'+em(s.title)+'</h2>\n':'')+'    <div class="rv">'+content+'</div>'});
  });
  body+='\n'+ctaSection({num:NUM(n+1),h:ctaT});
  const area=(slug.match(/(vasai|virar|mumbai|thane|nalasopara|mira-road)/)||[])[1];
  const graph=[];
  if(faqLd) graph.push(Object.assign({},faqLd,{'@id':SITE.url+p+'#faq'}));
  graph.push({'@type':'Service','@id':SITE.url+p+'#service',name:crumbName,serviceType:crumbName,provider:{'@id':SITE.url+'/#business'},areaServed:area?{'@type':'City',name:area.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}:['Vasai','Mumbai','India'],url:SITE.url+p});
  return {path:p,file:file,opts:{path:p,title,desc,keywords,nav:null,body,crumbs,graph,v,published:wp.datePublished,modified:SITE.modified}};
}

/* ---------------------------------------------------------------- security policy */
function policy(v){
  const file='information-security-policy.html';
  const h=fs.readFileSync(path.join(__dirname,'source-repo',file),'utf8');
  const g=(re)=>{const m=h.match(re);return m?m[1]:''};
  const title=unent(g(/<title>([^<]*)<\/title>/)), desc=unent(g(/<meta name="description" content="([^"]*)"/));
  const wp=(()=>{ for(const m of h.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)){ try{const j=JSON.parse(m[1]); if(j['@type']==='WebPage') return j;}catch(e){} } return {}; })();
  const sub=g(/<p class="hero-sub">([\s\S]*?)<\/p>/), stats=g(/<div class="glance">\s*<div class="stats-row">([\s\S]*?)<\/div>\s*<\/div>\s*\n/)||'';
  const glance=h.match(/<div class="glance">([\s\S]*?)<\/div>\s*<div class="policy-wrap">/);
  const toc=g(/<aside class="toc"[^>]*>([\s\S]*?)<\/aside>/);
  let art=g(/<article class="policy-body">([\s\S]*?)<\/article>/).replace(/class="steps"/g,'class="pol-steps"').replace('<td>Formspree</td><td>Delivers enquiries submitted through our website forms to our inbox.</td>','<td>Resend</td><td>Delivers enquiries submitted through our website forms to our inbox and sends confirmation emails.</td>');
  const crumbs=[['Home','/'],['Information security policy','/information-security-policy']];
  const body=`${pageHero({crumbs,tag:'Legal · Security & compliance',h1:'Information security {{policy}}.',sub,actions:'<a class="btn btn-primary" href="#s13">Report a vulnerability</a><a class="btn" href="mailto:'+SITE.email+'">Contact us ↗</a>'})}
<section class="sec" id="policy" data-stage="Policy" style="border-top:0">
  <div class="bar mono"><span>01 / Policy</span><span>Version 1.0</span></div>
  ${glance?glance[1].replace(/\s*style="[^"]*"/g,''):''}
  <div class="policy-wrap">
    <aside class="toc" aria-label="Table of contents">${toc}</aside>
    <article class="policy-body">${convert(art)}</article>
  </div>
</section>
${ctaSection({num:'02',h:'Questions about {{security}}?'})}`;
  return {path:'/information-security-policy',file,opts:{path:'/information-security-policy',title,desc,nav:null,body,crumbs,v,published:wp.datePublished||'2026-09-21',modified:wp.dateModified||'2026-09-21'}};
}

/* ---------------------------------------------------------------- 404 */
function notFound(v){
  const body=`<section class="page-hero" data-pre id="top" style="min-height:80vh">
  <span class="tag mono">Error 404</span>
  <h1>This page isn’t <em>built</em>.</h1>
  <p class="sub">The link may be old or mistyped. Head back to the studio, or tell us what you were looking for.</p>
  <div class="actions"><a class="btn btn-primary" href="/">Back home →</a><a class="btn" href="/projects">See the work</a><a class="btn" href="/contact" data-open-contact>Contact us</a></div>
</section>`;
  return {path:'/404',file:'404.html',opts:{path:'/404',title:'Page not found | MadeOfPixels Studio',desc:'This page could not be found. Return to MadeOfPixels Studio, a web design agency in Vasai and Mumbai.',nav:null,body,noindex:true,v}};
}

module.exports={home,about,services,contact,projectsIndex,projectPage,landing,policy,notFound};
