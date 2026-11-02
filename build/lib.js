// Shared config + helpers for the MadeOfPixels static site generator.
const fs=require('fs'), path=require('path');

const SITE={
  name:'MadeOfPixels Studio', short:'Made of Pixels', url:'https://madeofpixels.in',
  email:'hello@madeofpixels.in', phone:'+918080356882', phoneDisp:'+91 80803 56882', phone2:'+919699208605', phone2Disp:'+91 96992 08605',
  wa:'https://wa.me/918080356882',
  ig:'https://www.instagram.com/madeofpixelsstudio', li:'https://www.linkedin.com/company/madeofpixels',
  ga:'G-6TNKDP7018', clarity:'x2a7xuacr3',
  modified:'2026-11-02', founded:'2025',
  ogImage:'https://madeofpixels.in/og-preview.png',
  fonts:'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,400..900;1,62..125,400..900&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;500;700&display=swap'
};

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const unent=s=>String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&rsaquo;/g,'›').replace(/&middot;/g,'·').replace(/&ldquo;|&rdquo;/g,'"').replace(/&rsquo;/g,"'").replace(/&nbsp;/g,' ');
/* "Build for {{you}}." -> one emphasised word */
const em=s=>String(s).replace(/\{\{(.+?)\}\}/g,'<em>$1</em>');
const strip=s=>unent(String(s).replace(/<[^>]*>/g,'')).replace(/\s+/g,' ').trim();

const NAV=[['/','Home','home'],['/about','About','about'],['/services','Services','services'],['/projects','Projects','projects'],['/blog','Blog','blog'],['/contact','Contact','contact']];

const TOOLS=[['/free-website-audit','Free website audit','Speed, mobile and SEO check'],['/contact#estimate','Cost estimator','A rough price in ten seconds'],['/process','Project planner','Brief to launch, in pixels'],['/gallery','Pixel gallery','Sketches from our visitors']];
const AREAS=[
  ['/web-design-company-vasai','Web design in Vasai'],['/web-design-company-virar','Web design in Virar'],['/web-design-company-mumbai','Web design in Mumbai'],
  ['/web-design-company-thane','Web design in Thane'],['/web-design-company-nalasopara','Web design in Nalasopara'],['/web-design-company-mira-road','Web design in Mira Road']
];
const SERVICE_PAGES=[
  ['/web-design-vasai','Web design Vasai'],['/website-development-vasai','Website development Vasai'],['/branding-agency-vasai','Branding agency Vasai'],
  ['/ui-ux-design-mumbai','UI/UX design Mumbai'],['/custom-web-app-development','Custom web app development']
];
const INDUSTRIES=[
  ['/website-design-for-doctors','Websites for doctors'],['/website-design-for-ca-firms','Websites for CA firms'],['/website-design-for-manufacturers','Websites for manufacturers'],
  ['/website-design-for-realtors','Websites for realtors'],['/website-design-for-restaurants','Websites for restaurants'],['/website-design-for-schools','Websites for schools']
];

const SERVICES=[
  {slug:'custom-websites',name:'Custom Websites',px:'111111111/101010001/111111111/100000001/101111101/100000001/101101101/100000001/111111111',tile:'11111111/11111111/00000000/11111011/11111011/11111000/11111011/11111011',
   desc:'Full custom websites for businesses in Vasai, Mumbai and beyond. From concept to code, hand-built to perform everywhere.',list:['Custom HTML / CSS / JS','React / Next.js apps','CMS integration','Performance optimisation'],link:'/web-design-vasai'},
  {slug:'ui-ux-design',name:'UI/UX Design',tile:'10000000/11000000/11100000/11110000/11111000/00000000/00111111/00111111',
   desc:'Custom dashboards, ERPs, client portals and internal tools, designed with the same craft as your public face.',list:['SaaS interfaces','Admin dashboards','Internal tools','API integrations'],link:'/ui-ux-design-mumbai'},
  {slug:'brand-identity',name:'Brand Identity',tile:'11011000/11011000/00000000/11000011/11000011/00000000/00011011/00011011',
   desc:'Logo, colour, type and voice: everything that makes your brand recognisable. Nothing from a stock library.',list:['Logo & mark design','Brand guidelines','Typography systems','Visual language'],link:'/branding-agency-vasai'},
  {slug:'web-apps',name:'Web Apps',tile:'11011111/11011111/11000000/11000100/11000101/11010101/11010101/11010101',
   desc:'Custom tools for processes that off-the-shelf software does not fit. Built in React and Next.js.',list:['React / Next.js','Dashboards & portals','Custom ERP','API connections'],link:'/custom-web-app-development'},
  {slug:'e-commerce',name:'E-commerce',tile:'11000000/01111111/01111110/00111110/00111100/00000000/00110011/00110011',
   desc:'Online stores built from scratch around your catalogue, checkout and brand. Fast to load, easy to manage and built to turn browsers into buyers.',list:['Custom storefronts','Checkout flows','Catalogue structure','Speed & SEO'],link:'/contact'},
  {slug:'landing-pages',name:'Landing Pages',tile:'11111111/11111111/11000011/11022011/11022011/11000011/11111111/11111111',
   desc:'Focused pages built to win one action. Hand-coded for speed, from landing pages to full business sites.',list:['Single-purpose layouts','Mobile responsive','SEO optimised','Fast loading'],link:'/web-design-vasai'},
  {slug:'maintenance',name:'Maintenance',tile:'001110000/111111111/001110000/000001110/111111111/000001110/011100000/111111111/011100000',
   desc:'We either build with a CMS so you can update it yourself, or take a maintenance package where we handle updates for you.',list:['Content updates','Fixes & improvements','Performance checks','Direct support'],link:'/contact'},
  {slug:'graphic-design',name:'Graphic Design',extra:true,tile:'111111000/111111000/111111000/111122220/111222222/111222222/000222222/000222222/000022220',
   desc:'Print, digital and motion: visual communication that works as hard offline as it does on screen.',list:['Posters & print','Social media kits','Packaging design','Motion & animation'],link:'/contact'}
];

const rd=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','content',f),'utf8'));
const PROJECTS=rd('projects.json');
const POSTS=rd('posts.json').filter(p=>p.published!==false).sort((a,b)=>b.date.localeCompare(a.date));
const GALLERY=rd('gallery.json').filter(g=>g.approved!==false);
const REVIEWS=rd('reviews.json').filter(r=>r.published!==false);
const LOCATIONS=rd('locations.json');

const HOME_FAQ=[
  ['Which is the best web design agency in Vasai?','MadeOfPixels Studio is a leading web design agency in Vasai West, Maharashtra. We build fully custom, hand-coded websites with zero templates, offering web design, website development, branding and UI/UX design services to businesses in Vasai, Virar and across Mumbai.'],
  ['Do you offer website development services in Mumbai?','Yes. MadeOfPixels Studio provides professional website development in Mumbai, covering web design, custom web applications, React/Next.js development, CMS integration and performance-optimised websites for businesses across Mumbai, Thane and Navi Mumbai.'],
  ['Are you a web designer near me in Vasai or Mumbai?','Yes. MadeOfPixels Studio is based in Vasai West, Maharashtra, making us the closest web design studio for businesses in Vasai, Virar, Nalasopara, Mira Road, Bhayandar and greater Mumbai. Contact us for a free project consultation.'],
  ['What does MadeOfPixels Studio offer as a branding agency in Vasai?','As a branding agency in Vasai, we offer full brand identity design including logo design, brand guidelines, typography systems, colour palettes and visual language, all custom crafted with no templates used.'],
  ['Do you provide UI UX design services in Mumbai?','Yes. MadeOfPixels Studio offers UI/UX design in Mumbai for web apps, SaaS platforms, admin dashboards, client portals and digital products. We design intuitive, conversion-focused interfaces that look great and perform even better.'],
  ['How much does a website cost in Vasai or Mumbai?','Website pricing depends on project scope. MadeOfPixels Studio offers competitive pricing for custom websites in Vasai and Mumbai, from basic business sites to full custom web applications. Contact us at hello@madeofpixels.in or +91 80803 56882 for a free quote.']
];

/* ---------------------------------------------------------------- schema */
const BIZ_ID=SITE.url+'/#business', ORG_NODE={'@id':BIZ_ID};
const BUSINESS={
  '@type':['ProfessionalService','LocalBusiness'],'@id':BIZ_ID,name:SITE.name,alternateName:'Made of Pixels',url:SITE.url+'/',
  logo:{'@type':'ImageObject','@id':SITE.url+'/#logo',url:SITE.url+'/logo.png',caption:SITE.name},
  image:SITE.ogImage,slogan:'Bold by design. Built from scratch.',
  description:'MadeOfPixels Studio is a web design agency in Vasai West and Mumbai building custom websites, brand identities, UI/UX design and web apps from scratch. Zero templates.',
  foundingDate:SITE.founded,email:SITE.email,telephone:SITE.phone,
  address:{'@type':'PostalAddress',streetAddress:'Vasai West',addressLocality:'Vasai',addressRegion:'Maharashtra',postalCode:'401202',addressCountry:'IN'},
  geo:{'@type':'GeoCoordinates',latitude:'19.3919',longitude:'72.8397'},hasMap:'https://maps.google.com/?q=Vasai+West+Maharashtra',
  areaServed:['Vasai','Virar','Nalasopara','Mira Road','Bhayandar','Mumbai','Thane','Navi Mumbai','Maharashtra','India'].map(n=>({'@type':'City',name:n})).concat([{'@type':'Country',name:'India'}]),
  openingHoursSpecification:[{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],opens:'09:00',closes:'20:00'}],
  priceRange:'$$',sameAs:[SITE.ig,SITE.li],
  contactPoint:[{'@type':'ContactPoint',contactType:'sales',telephone:SITE.phone,email:SITE.email,areaServed:['IN','Worldwide'],availableLanguage:['English']}],
  knowsAbout:['Web design','Website development','Brand identity','UI/UX design','Custom websites','React development','Web apps','Graphic design'],
  hasOfferCatalog:{'@type':'OfferCatalog',name:'Web design and digital services',itemListElement:SERVICES.map(s=>({'@type':'Offer',itemOffered:{'@type':'Service',name:s.name,description:s.desc.replace(/ \[EDIT[^\]]*\]/,''),provider:ORG_NODE}}))}
};
const WEBSITE={'@type':'WebSite','@id':SITE.url+'/#website',url:SITE.url+'/',name:SITE.name,description:'Custom websites built from scratch. Bold by design.',inLanguage:'en-IN',publisher:ORG_NODE};
const crumbList=items=>({'@type':'BreadcrumbList',itemListElement:items.map((it,i)=>({'@type':'ListItem',position:i+1,name:it[0],item:SITE.url+it[1]}))});
const faqNode=qa=>({'@type':'FAQPage',mainEntity:qa.map(q=>({'@type':'Question',name:q[0],acceptedAnswer:{'@type':'Answer',text:q[1]}}))});
const pageNode=(o,type='WebPage')=>({'@type':type,'@id':SITE.url+o.path+'#webpage',url:SITE.url+o.path,name:o.title,description:o.desc,inLanguage:'en-IN',isPartOf:{'@id':SITE.url+'/#website'},about:ORG_NODE,primaryImageOfPage:{'@type':'ImageObject',url:o.ogImage||ogUrl(o.path)},dateModified:o.modified||SITE.modified,datePublished:o.published||'2025-01-01'});

/* ---------------------------------------------------------------- page chrome */
const MARK_SYMBOL='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="m" viewBox="0 0 29 29"><path fill="currentColor" d="M0 0h9v9H0zM10 0h9v9h-9zM0 10h9v9H0zM20 10h9v9h-9zM10 20h9v9h-9zM20 20h9v9h-9z"/></symbol></svg>';

function navHTML(active){
  const item=n=>'<a class="cell" href="'+n[0]+'"'+(n[2]===active?' aria-current="page"':'')+'>'+n[1]+'</a>';
  const dd='<div class="dd" id="dd-tools"><button class="cell dd-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="dd-tools-menu"'+(active==='tools'?' aria-current="page"':'')+'>Tools <span class="dd-caret" aria-hidden="true">▾</span></button><div class="dd-menu" id="dd-tools-menu">'+TOOLS.map(t=>'<a class="dd-item" href="'+t[0]+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></a>').join('')+'</div></div>';
  const links=NAV.slice(0,-1).map(item).concat(dd,item(NAV[NAV.length-1])).join('\n    ');
  return `<header class="nav" id="nav">
  <a class="cell logo" href="/" aria-label="${SITE.name}, home"><svg class="mark" aria-hidden="true"><use href="#m"/></svg></a>
  <button class="cell menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
  <nav class="links" id="menu" aria-label="Primary">
    ${links}
  </nav>
  <span class="spacer"></span>
  <a class="cell soc" href="${SITE.ig}" target="_blank" rel="noopener noreferrer">Instagram</a>
  <a class="cell soc" href="${SITE.wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
  <a class="cta" href="/contact" data-open-contact>Start a project</a>
</header>`;
}

const RULER_HTML=`<aside id="ruler" aria-label="Page scroll ruler">
  <nav class="r-labels" aria-label="Page sections"></nav>
  <div class="r-zone" aria-hidden="true"><div id="r-win"></div><svg id="r-ticks"></svg><div id="r-line"><span id="r-pct">000%</span></div></div>
  <span class="r-measure" aria-hidden="true"></span>
</aside>`;

const li=(arr)=>arr.map(a=>'<li><a href="'+a[0]+'">'+a[1]+'</a></li>').join('');
function footerHTML(){
  return `<footer>
  <div class="foot">
    <div>
      <div class="brand"><svg class="mark" aria-hidden="true"><use href="#m"/></svg><span class="display" style="font-size:18px">Made of Pixels</span><span class="mono faint">Studio</span></div>
      <p style="max-width:34ch;color:var(--ink-2)">A web design studio in Vasai &amp; Mumbai, building custom websites from scratch. India &amp; Global.</p>
    </div>
    <div>
      <h3 class="mono faint">Studio</h3>
      <ul class="mono">${li([['/','Home'],['/about','About'],['/services','Services'],['/projects','Projects'],['/process','Process & planner'],['/gallery','Pixel gallery'],['/blog','Blog'],['/free-website-audit','Free website audit'],['/contact','Contact']])}</ul>
    </div>
    <div>
      <h3 class="mono faint">Services</h3>
      <ul class="mono">${li(SERVICE_PAGES)}</ul>
    </div>
    <div>
      <h3 class="mono faint">Areas &amp; industries</h3>
      <ul class="mono">${li(AREAS.slice(0,3))}${li(INDUSTRIES.slice(0,3))}<li><a href="/services#areas">All areas &amp; industries</a></li></ul>
    </div>
    <div>
      <h3 class="mono faint">Contact</h3>
      <ul class="mono">
        <li><a href="/contact" data-open-contact>Start a project</a></li>
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li><a href="tel:${SITE.phone}">${SITE.phoneDisp}</a></li>
        <li><a href="tel:${SITE.phone2}">${SITE.phone2Disp}</a></li>
        <li><a href="${SITE.wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
        <li><a href="${SITE.ig}" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href="${SITE.li}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        <li>Vasai West, Maharashtra</li>
      </ul>
    </div>
  </div>
  <div class="foot-seo mono">
    <p><strong style="color:var(--ink)">${SITE.name}</strong> · Vasai West, Maharashtra 401202 · <a href="tel:${SITE.phone}">${SITE.phoneDisp}</a> · <a href="mailto:${SITE.email}">${SITE.email}</a> · Mon–Sat 09:00–20:00</p>
    <p>Web design agency serving Vasai, Virar, Mumbai, Thane, Navi Mumbai and Nalasopara. Custom website design, brand identity, UI/UX design and digital products for businesses across Maharashtra and worldwide.</p>
  </div>
  <div class="legal mono" style="border-top:1px solid var(--rule)">
    <span>madeofpixels.in · Bold by design · Built from scratch</span>
    <span><a href="/information-security-policy">Information security policy</a> · <button class="linklike mono" id="cookie-settings" type="button">Cookie settings</button> · <a href="/feed.xml">RSS</a> · © 2025 Made of Pixels Studio</span>
  </div>
</footer>`;
}

function formHTML(prefix,kind){
  const f=n=>'f-'+prefix+'-'+n, e=n=>'e-'+prefix+'-'+n;
  const err=n=>'<p class="err" id="'+e(n)+'" data-for="'+n+'" aria-live="polite"></p>';
  const opts=['Custom Website','UI/UX Design','Brand Identity','Web App','E-commerce','Landing Page','Maintenance','Something else'].map(o=>'<option>'+o+'</option>').join('');
  return `<form action="/api/submit" method="POST" novalidate data-enquiry="${kind}" aria-label="${kind==='dialog'?'Quote request':'Project enquiry'}">
        <input type="hidden" name="_subject" value="New enquiry${kind==='dialog'?' (lightbox)':''} from madeofpixels.in">
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <input type="hidden" name="sketch" value="">
        <div class="field"><label class="mono" for="${f('name')}">Name</label><input id="${f('name')}" name="name" type="text" autocomplete="name" required aria-describedby="${e('name')}">${err('name')}</div>
        <div class="field"><label class="mono" for="${f('email')}">Email</label><input id="${f('email')}" name="email" type="email" autocomplete="email" required aria-describedby="${e('email')}">${err('email')}</div>
        <div class="field"><label class="mono" for="${f('phone')}">Phone / WhatsApp <span class="faint">(optional)</span></label><input id="${f('phone')}" name="phone" type="tel" autocomplete="tel" aria-describedby="${e('phone')}">${err('phone')}</div>
        <div class="field"><label class="mono" for="${f('type')}">Project type</label><select id="${f('type')}" name="type" required aria-describedby="${e('type')}"><option value="">Select…</option>${opts}</select>${err('type')}</div>
        <div class="field full"><label class="mono" for="${f('budget')}">Budget range <span class="faint">(optional)</span></label>
          <select id="${f('budget')}" name="budget" aria-describedby="${e('budget')}"><option value="">Select…</option><option>Under ₹25,000</option><option>₹25,000 – ₹50,000</option><option>₹50,000 – ₹1,00,000</option><option>₹1,00,000+</option><option>Not sure yet</option></select>${err('budget')}</div>
        <div class="field full"><label class="mono" for="${f('message')}">Tell us about the project</label><textarea id="${f('message')}" name="message" required aria-describedby="${e('message')}"></textarea>${err('message')}</div>
        <div class="full" style="display:grid;gap:14px"><button class="btn btn-primary" type="submit" style="justify-self:start">Send it →</button><p class="form-status mono" role="status"></p></div>
      </form>`;
}

const DIALOG_HTML=`<dialog class="contact-dialog" id="contact-dialog" data-lenis-prevent aria-labelledby="dlg-title">
  <div class="dlg-in">
    <div class="dlg-bar mono"><span>Get a quote</span><button class="dlg-close mono" type="button" id="dlg-close" aria-label="Close contact form">Close ✕</button></div>
    <div class="dlg-body">
      <h2 class="dlg-h" id="dlg-title">Let’s talk your <em>project</em>.</h2>
      <p class="dlg-sub">Tell us what you’re building. We reply within 24 hours. Prefer a chat? <a href="${SITE.wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a> or <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
      <p class="dlg-note mono" id="dlg-sketch-note" hidden>Your pixel sketch is attached to this message.</p>
      ${formHTML('m','dialog')}
    </div>
  </div>
</dialog>`;

/* one section: header bar + body.  o: id, stage, num, name, tagline, cls, body, bodyStyle */
const sec=o=>`<section class="sec${o.cls?' '+o.cls:''}" id="${o.id}"${o.stage?' data-stage="'+esc(o.stage)+'"':''}>
  <div class="bar mono"><span>${o.num} / ${esc(o.name)}</span><span>${esc(o.tagline||'')}</span></div>
  <div class="body"${o.bodyStyle?' style="'+o.bodyStyle+'"':''}>
${em(o.body)}
  </div>
</section>`;

const crumbsHTML=items=>'<nav aria-label="Breadcrumb"><ol class="crumbs mono">'+items.map((it,i)=>'<li>'+(i<items.length-1?'<a href="'+it[1]+'">'+esc(it[0])+'</a>':'<span aria-current="page">'+esc(it[0])+'</span>')+'</li>').join('')+'</ol></nav>';

const pageHero=o=>`<section class="page-hero" data-pre id="top">
  ${crumbsHTML(o.crumbs)}
  <span class="tag mono">${esc(o.tag||'')}</span>
  <h1>${em(o.h1)}</h1>
  ${o.sub?'<p class="sub">'+o.sub+'</p>':''}
  ${o.actions?'<div class="actions">'+o.actions+'</div>':''}
</section>`;

const faqHTML=qa=>'<div class="faq">'+qa.map(q=>'<details><summary>'+q[0]+'</summary><div class="faq-a">'+q[1]+'</div></details>').join('')+'</div>';

const ctaSection=(o={})=>sec({id:'start',stage:'Start',num:o.num||'06',name:'Start',tagline:'Tell us everything',cls:'cta-sec',body:`    <h2 class="big-cta rv">${em(o.h||'Ready to build something {{real}}?')}</h2>
    <p class="lede rv">We reply within 24 hours. No commitments.</p>
    <div class="actions rv"><a class="btn btn-primary" href="/contact" data-open-contact>Start a project →</a><a class="btn" href="/contact#estimate">Estimate the cost</a><a class="btn" href="${SITE.wa}" target="_blank" rel="noopener noreferrer">WhatsApp us</a><a class="btn" href="mailto:${SITE.email}">Email us</a></div>
    <p class="cta-note mono">${SITE.phoneDisp} · ${SITE.email} · Vasai West, Maharashtra</p>`});

/* ---------------------------------------------------------------- full document */
const ogSlug=p=>p==='/'?'home':p.replace(/^\//,'').replace(/\//g,'-');
const ogUrl=p=>SITE.url+'/og/'+ogSlug(p)+'.png';
const wipeSquares=()=>{ let s=''; for(let r=0;r<8;r++) for(let c=0;c<12;c++) s+='<i style="--d:'+((c+r)*24+((c*7+r*3)%5)*10)+'ms"></i>'; return s; };

/* WhatsApp mark in the studio's pixel style: a chat bubble with a handset cut-out and one accent notification square */
function waGlyph(){
  const N=16, g=Array.from({length:N},()=>Array(N).fill(0));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const dx=x-7.5, dy=y-7.5; if(dx*dx+dy*dy<=54.8) g[y][x]=1; }
  [[1,13],[2,13],[3,13],[0,14],[1,14],[2,14],[0,15],[1,15]].forEach(c=>{ g[c[1]][c[0]]=1; });
  [[4,3],[5,3],[4,4],[5,4],[6,4],[4,5],[5,5],[4,6],[5,6],[5,7],[6,7],[6,8],[7,8],[7,9],[8,9],[10,9],[11,9],[8,10],[9,10],[10,10],[11,10],[9,11],[10,11],[11,11]].forEach(c=>{ g[c[1]][c[0]]=0; });
  let d=''; g.forEach((row,y)=>{ for(const m of row.join('').matchAll(/1+/g)) d+='M'+m.index+' '+y+'h'+m[0].length+'v1h-'+m[0].length+'z'; });
  return '<svg class="wa-px" viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path fill="currentColor" d="'+d+'"/><rect x="13" y="0" width="3" height="3" fill="var(--accent)"/></svg>';
}
const CHROME_HTML=`<div class="wipe" id="wipe" aria-hidden="true">${wipeSquares()}</div>
<div class="read-progress" aria-hidden="true"><i></i></div>
<div class="strip" id="strip" role="region" aria-label="Get a quote" hidden>
  <div class="strip-in">
    <p class="strip-t"><b>Like our work? Get a quote.</b><span class="mono">No commitments. Just a conversation.</span></p>
    <div class="strip-a">
      <a class="btn btn-primary" href="/contact" data-open-contact>Get a free quote →</a>
      <a class="btn" href="${SITE.wa}?text=Hi%2C%20I%27d%20like%20a%20quote" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <button class="strip-x mono" type="button" id="strip-x">Dismiss</button>
    </div>
  </div>
</div>
<a class="wa-fab" href="${SITE.wa}?text=Hi%2C%20I%27d%20like%20a%20quote" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">${waGlyph()}<span class="mono">WhatsApp</span></a>
<button class="to-top mono" id="to-top" type="button" aria-label="Back to top" hidden>↑ Top</button>
<div class="nudge" id="nudge" role="dialog" aria-modal="true" aria-labelledby="nudge-t" hidden>
  <div class="nudge-card">
    <button class="nudge-x mono" id="nudge-x" type="button" aria-label="Close">✕</button>
    <p class="mono">Before you go</p>
    <h2 id="nudge-t">Get a free website <em>audit</em>.</h2>
    <p>See how your site does on speed, mobile and SEO. It takes under a minute.</p>
    <div class="actions"><a class="btn btn-primary" href="/free-website-audit">Run the free audit →</a><button class="btn nudge-later" id="nudge-later" type="button">Maybe later</button></div>
  </div>
</div>
<div class="consent" id="consent" role="region" aria-label="Cookie preferences" hidden>
  <p>We use Google Analytics and Microsoft Clarity to see how the site is used. They only load if you accept. <a href="/information-security-policy#s8">Privacy details</a></p>
  <div class="actions"><button class="btn" type="button" data-consent="decline">Decline</button><button class="btn btn-primary" type="button" data-consent="accept">Accept</button></div>
</div>`;

function shell(o){
  const url=SITE.url+o.path, title=o.title, desc=o.desc, img=o.ogImage||ogUrl(o.path);
  const graph=o.bare?[]:[BUSINESS,WEBSITE,pageNode(o,o.pageType||'WebPage'),...(o.graph||[])];
  if(!o.bare&&o.crumbs&&o.crumbs.length>1) graph.push(crumbList(o.crumbs.map(c=>[c[0],c[1]])));
  const ld=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  const robots=o.noindex?'noindex, nofollow':'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const og=o.noindex?'':`<meta property="og:type" content="${o.ogType||'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="en_IN">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(o.ogTitle||title)}">
<meta property="og:description" content="${esc(o.ogDesc||desc)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(o.ogTitle||title)}">
${o.published&&o.ogType==='article'?'<meta property="article:published_time" content="'+o.published+'">\n<meta property="article:modified_time" content="'+(o.modified||o.published)+'">\n':''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${url}">
<meta name="twitter:title" content="${esc(o.ogTitle||title)}">
<meta name="twitter:description" content="${esc(o.ogDesc||desc)}">
<meta name="twitter:image" content="${img}">
`;
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${o.keywords?'<meta name="keywords" content="'+esc(o.keywords)+'">\n':''}<meta name="author" content="${SITE.name}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#EFEDE8">
<link rel="canonical" href="${url}">
${o.noindex?'':'<link rel="alternate" hreflang="en-IN" href="'+url+'">\n<link rel="alternate" hreflang="x-default" href="'+url+'">\n'}<link rel="alternate" type="application/rss+xml" title="${SITE.name} blog" href="/feed.xml">

${og}<meta name="geo.region" content="IN-MH">
<meta name="geo.placename" content="Vasai West, Maharashtra">
<meta name="geo.position" content="19.3919;72.8397">
<meta name="ICBM" content="19.3919, 72.8397">

<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="${SITE.fonts}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${SITE.fonts}"></noscript>
<link rel="stylesheet" href="/assets/site.css?v=${o.v}">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('mop-wipe')){sessionStorage.removeItem('mop-wipe');document.documentElement.classList.add('wipe-in')}}catch(e){}</script>

<script type="application/ld+json">${ld}</script>
</head>
<body${o.bodyClass?' class="'+o.bodyClass+'"':''}>
<a class="skip" href="#main">Skip to content</a>
${MARK_SYMBOL}
${navHTML(o.nav)}
${RULER_HTML}
<main id="main">
${o.body}
</main>
${footerHTML()}
${DIALOG_HTML}
${o.afterFooter||''}
${o.bare?'':CHROME_HTML}
<script>window.MOP={ga:"${SITE.ga}",clarity:"${SITE.clarity}",wa:"${SITE.wa}"};</script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js" defer></script>
<script src="/assets/site.js?v=${o.v}" defer></script>
</body>
</html>
`;
}

module.exports={SITE,esc,unent,em,strip,NAV,AREAS,SERVICE_PAGES,INDUSTRIES,SERVICES,PROJECTS,POSTS,GALLERY,REVIEWS,LOCATIONS,ogUrl,ogSlug,HOME_FAQ,BUSINESS,WEBSITE,crumbList,faqNode,pageNode,
  shell,sec,pageHero,crumbsHTML,faqHTML,ctaSection,formHTML,li};
