// Second batch of page builders: blog, gallery, process planner, audit, reviews, location pages, admin.
const L=require('./lib'), MD=require('./md');
const {SITE,esc,em,strip,SERVICES,PROJECTS,POSTS,GALLERY,REVIEWS,LOCATIONS,AREAS,SERVICE_PAGES,INDUSTRIES,sec,pageHero,faqHTML,ctaSection,crumbsHTML,faqNode}=L;

const fmtDate=d=>new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const lis=a=>a.map(x=>'<div class="int-link"><a href="'+x[0]+'">'+x[1]+'<span>'+(x[2]||'Read more')+'</span></a></div>').join('');
const linkGrid=a=>'<div class="links-grid rv">'+lis(a)+'</div>';
const stepper=n=>'<div class="stepper" aria-hidden="true">'+[1,2,3,4].map(i=>'<i'+(i<n?' class="done"':i===n?' class="now"':'')+'></i>').join('')+'</div>';

/* ---------------------------------------------------------------- shared blocks */
/* 16x16 sketch as crisp inline SVG (rows merged into runs) */
function sketchSvg(art,label){
  const rows=String(art).split('\n'); let rects='';
  rows.forEach((r,y)=>{ for(const m of r.matchAll(/#+/g)) rects+='<rect x="'+m.index+'" y="'+y+'" width="'+m[0].length+'" height="1"/>'; });
  return '<svg class="sk-art" viewBox="0 0 16 16" role="img" aria-label="'+esc(label)+'" shape-rendering="crispEdges" fill="currentColor">'+rects+'</svg>';
}
function sketchBlock(){
  return `<div class="sketch rv">
      <div>
        <p class="mono faint">Playground</p>
        <h3>Draw with <em>pixels</em>.</h3>
        <p>Click or drag to place squares. Click a filled one to erase it. Made something good? Send it to us.</p>
        <div class="actions"><button class="btn" type="button" id="sk-clear">Clear</button><button class="btn btn-primary" type="button" id="sk-send">Send us your sketch →</button></div>
        <form class="sk-form" id="sk-form" action="/api/submit" method="POST" hidden novalidate>
          <input type="hidden" name="_subject" value="Pixel sketch from madeofpixels.in">
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
          <input type="hidden" name="sketch" value="">
          <input type="hidden" name="message" value="Pixel sketch sent from the Draw with pixels pad on madeofpixels.in.">
          <label class="mono" for="sk-email">Your email, so we can reply</label>
          <div class="sk-row"><input id="sk-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"><button class="btn btn-primary" type="submit">Send sketch →</button></div>
          <label class="mono" for="sk-credit">Name to credit <span class="faint">(optional)</span></label>
          <input id="sk-credit" class="sk-credit" name="credit" type="text" autocomplete="name">
          <label class="chk"><input type="checkbox" name="gallery_ok" value="Yes, OK to show on the gallery wall"><span>OK to show my sketch on the <a href="/gallery">gallery wall</a></span></label>
        </form>
        <p class="mono" id="sk-status" role="status" aria-live="polite"></p>
      </div>
      <canvas class="sk-canvas" id="sk-canvas" tabindex="0" role="application" aria-label="Pixel drawing pad, 16 by 16 squares. Arrow keys move, space or enter places or erases a square."></canvas>
    </div>`;
}
const galleryGrid=(items)=>'<div class="gal rv">'+items.map(g=>'<figure class="gal-i">'+sketchSvg(g.art,'Pixel sketch by '+g.name+(g.note?': '+g.note:''))+'<figcaption class="mono"><span>'+esc(g.name)+'</span><span>'+esc(g.note||'')+'</span></figcaption></figure>').join('')+'</div>';

/* reviewer avatar: their photo when there is one, otherwise their initials in a square */
const initials=n=>{ const w=String(n||'').trim().split(/\s+/).filter(Boolean); if(!w.length) return '?'; return ([...w[0]][0]+(w.length>1?[...w[w.length-1]][0]:'')).toUpperCase(); };
const avatar=r=>r.photo?'<span class="av"><img src="'+esc(r.photo)+'" alt="" width="44" height="44" loading="lazy"></span>':'<span class="av" aria-hidden="true">'+esc(initials(r.name))+'</span>';
function reviewsSection(){
  if(!REVIEWS.length) return '';
  const sq=n=>'<span class="stars" role="img" aria-label="'+n+' out of 5">'+[1,2,3,4,5].map(i=>'<i'+(i<=n?' class="on"':'')+'></i>').join('')+'</span>';
  const cards=REVIEWS.map(r=>'<figure class="rev">'+sq(r.rating||5)+'<blockquote>'+esc(r.text)+'</blockquote><figcaption>'+avatar(r)+'<div class="rev-who"><b>'+esc(r.name)+'</b><span class="mono faint">'+(r.date?fmtDate(r.date)+' · ':'')+(r.url?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.source||'Google')+' review</a>':esc(r.source||'Google review'))+'</span></div></figcaption></figure>').join('');
  return sec({id:'reviews',stage:'Reviews',num:'00',name:'Reviews',tagline:'What clients say',body:`    <h2 class="h2 rv">Kind words. Real {{clients}}.</h2>\n    <div class="revs rv">${cards}</div>`});
}

/* ---------------------------------------------------------------- blog */
function blogIndex(v){
  const crumbs=[['Home','/'],['Blog','/blog']];
  const cards=POSTS.map(p=>`<a class="post-card rv" href="/blog/${p.slug}"><div class="row mono"><span>${esc(p.category)}</span><span>${fmtDate(p.date)} · ${MD.readMins(p.body)} min</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||p.description)}</p><span class="mono arr">Read article →</span></a>`).join('\n    ');
  const body=`${pageHero({crumbs,tag:'Blog',h1:'Insights for local {{business}}.',sub:'Plain-English guides on website cost, SEO and getting more customers online, from a web design studio in Vasai.',actions:'<a class="btn btn-primary" href="/free-website-audit">Free website audit →</a><a class="btn" href="/feed.xml">RSS feed</a>'})}
${sec({id:'posts',stage:'Articles',num:'01',name:'Articles',tagline:POSTS.length+' published',bodyStyle:'padding:0',body:`<div class="post-list">\n    ${cards}\n    </div>`})}
${ctaSection({num:'02'})}`;
  const list={'@type':'Blog','@id':SITE.url+'/blog#blog',name:SITE.name+' blog',url:SITE.url+'/blog',publisher:{'@id':SITE.url+'/#business'},blogPost:POSTS.map(p=>({'@type':'BlogPosting',headline:p.title,url:SITE.url+'/blog/'+p.slug,datePublished:p.date}))};
  return {path:'/blog',file:'blog.html',opts:{path:'/blog',title:'Blog: Website & SEO Guides | MadeOfPixels Studio',desc:'Practical guides on website cost, SEO and local marketing for businesses in Vasai, Mumbai and across India, from MadeOfPixels Studio.',nav:'blog',body,crumbs,v,pageType:'CollectionPage',graph:[list],keywords:'web design blog India, website cost guide, local SEO tips, website checklist'}};
}
function blogPost(p,i,v){
  const path='/blog/'+p.slug, crumbs=[['Home','/'],['Blog','/blog'],[p.title,path]];
  const r=MD.render(p.body), mins=MD.readMins(p.body);
  const related=POSTS.filter(x=>x.slug!==p.slug).slice(0,2);
  const body=`<section class="page-hero post-hero" data-pre id="top">
  ${crumbsHTML(crumbs)}
  <span class="tag mono">${esc(p.category)} · ${fmtDate(p.date)} · ${mins} min read</span>
  <h1>${esc(p.title)}</h1>
  <p class="sub">${esc(p.excerpt||p.description)}</p>
</section>
<section class="sec post" id="article" data-stage="Article" style="border-top:0">
  <div class="post-wrap">
    ${r.toc.length>2?'<aside class="toc" aria-label="In this article"><div class="toc-title">In this article</div>'+r.toc.map((t,k)=>'<a href="#'+t[0]+'"><b>'+String(k+1).padStart(2,'0')+'</b>'+esc(t[1])+'</a>').join('')+'</aside>':''}
    <article class="prose post-body">${r.html}
      <p class="post-by mono faint">Written by ${SITE.name}. Last updated ${fmtDate(p.updated||p.date)}.</p>
    </article>
  </div>
</section>
${related.length?sec({id:'more',stage:'More',num:'02',name:'Keep reading',tagline:'Related articles',bodyStyle:'padding:0',body:'<div class="post-list">'+related.map(x=>'<a class="post-card" href="/blog/'+x.slug+'"><div class="row mono"><span>'+esc(x.category)+'</span><span>'+fmtDate(x.date)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.excerpt||x.description)+'</p><span class="mono arr">Read article →</span></a>').join('')+'</div>'}):''}
${ctaSection({num:related.length?'03':'02'})}`;
  const art={'@type':'BlogPosting','@id':SITE.url+path+'#article',headline:p.title,description:p.description,image:L.ogUrl(path),datePublished:p.date,dateModified:p.updated||p.date,author:{'@type':'Organization',name:SITE.name,url:SITE.url+'/'},publisher:{'@id':SITE.url+'/#business'},mainEntityOfPage:SITE.url+path,keywords:p.keywords,articleSection:p.category,inLanguage:'en-IN',wordCount:MD.plain(p.body).split(' ').length,isPartOf:{'@id':SITE.url+'/blog#blog'}};
  return {path,file:'blog/'+p.slug+'.html',opts:{path,title:p.title+' | MadeOfPixels Studio',desc:p.description,keywords:p.keywords,nav:'blog',body,crumbs,v,ogType:'article',published:p.date,modified:p.updated||p.date,pageType:'WebPage',graph:[art]}};
}
function feedXml(){
  const items=POSTS.map(p=>`  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE.url}/blog/${p.slug}</link>\n    <guid isPermaLink="true">${SITE.url}/blog/${p.slug}</guid>\n    <pubDate>${new Date(p.date+'T09:00:00Z').toUTCString()}</pubDate>\n    <category>${esc(p.category)}</category>\n    <description>${esc(p.excerpt||p.description)}</description>\n    <content:encoded><![CDATA[${MD.render(p.body).html.replace(/\]\]>/g,']]&gt;')}]]></content:encoded>\n  </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n<channel>\n  <title>${SITE.name} blog</title>\n  <link>${SITE.url}/blog</link>\n  <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>\n  <description>Website, SEO and local business guides from a web design studio in Vasai.</description>\n  <language>en-IN</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items}\n</channel>\n</rss>\n`;
}

/* ---------------------------------------------------------------- gallery */
function gallery(v){
  const crumbs=[['Home','/'],['Gallery','/gallery']];
  const body=`${pageHero({crumbs,tag:'Pixel gallery',h1:'The wall of {{pixels}}.',sub:'Sketches drawn on our site by the studio and by visitors who said we could share them. Draw yours below.'})}
${sec({id:'wall',stage:'Wall',num:'01',name:'The wall',tagline:GALLERY.length+' sketches',body:galleryGrid(GALLERY)})}
${sec({id:'draw',stage:'Draw',num:'02',name:'Add yours',tagline:'Playground',body:'    '+sketchBlock()})}
${ctaSection({num:'03'})}`;
  return {path:'/gallery',file:'gallery.html',opts:{path:'/gallery',title:'Pixel Gallery: Sketches Made with Pixels | MadeOfPixels Studio',desc:'A wall of 16x16 pixel sketches drawn on the MadeOfPixels Studio website by the team and by visitors. Draw your own and send it in.',nav:'tools',body,crumbs,v,pageType:'CollectionPage'}};
}

/* ---------------------------------------------------------------- process planner */
function process(v){
  const crumbs=[['Home','/'],['Process','/process']];
  const chip=(n,val,l,c)=>'<label class="chip"><input type="radio" name="'+n+'" value="'+val+'"'+(c?' checked':'')+'><span>'+l+'</span></label>';
  const planner=`<div class="planner rv" id="planner" role="group" aria-label="Project planner">
      <div class="planner-opts">
        <fieldset><legend class="mono">Project type</legend><div class="chips">${['Custom Website','UI/UX Design','Brand Identity','Web App','E-commerce','Landing Page','Maintenance'].map((x,i)=>chip('plan-type',x,x,i===0)).join('')}</div></fieldset>
        <fieldset><legend class="mono">Pages</legend><div class="chips">${[['1','1 page'],['2-5','2–5 pages'],['6-10','6–10 pages'],['10+','10+ pages']].map((x,i)=>chip('plan-pages',x[0],x[1],i===1)).join('')}</div></fieldset>
        <fieldset><legend class="mono">Timeline</legend><div class="chips">${[['standard','Standard'],['fast','Fast-track'],['flexible','Flexible']].map((x,i)=>chip('plan-time',x[0],x[1],i===0)).join('')}</div></fieldset>
      </div>
      <div class="planner-out">
        <div class="ptl" id="ptl" aria-hidden="true"></div>
        <div class="ptl-labels mono" id="ptl-labels" aria-hidden="true"></div>
        <label class="mono" for="ptl-range">Drag through the project</label>
        <input type="range" id="ptl-range" min="0" max="100" value="0" aria-describedby="ptl-day">
        <p class="mono" id="ptl-day" aria-live="polite"></p>
        <dl class="facts"><div><dt>Estimated time</dt><dd id="plan-time">—</dd></div><div><dt>Estimated range</dt><dd id="plan-price">—</dd></div></dl>
        <div class="actions"><button class="btn" type="button" id="ptl-play">Play the project ▶</button><button class="btn btn-primary" type="button" id="plan-use">Use this plan in the form →</button></div>
      </div>
    </div>`;
  const steps=[['Brief','1–2 days','We interrogate the brief. Your goals, your audience, your competitors, your gaps. No guessing. We build on facts.'],['Design','3–5 days','One strong concept. Not three mediocre options. We bring our recommendation and defend it. You refine it.'],['Build','1–4 weeks','Code goes down fast. You see progress in real time. Every screen, every interaction, every hover state, hand-crafted.'],['Launch','1–2 days','We deploy, test across devices and browsers, and hand you a site that works. Then we stick around to make sure it stays that way.']];
  const body=`${pageHero({crumbs,tag:'Process',h1:'From brief to {{live}}.',sub:'Pick what you are building and watch the project play out, with a rough time and price range that matches our estimator.',actions:'<a class="btn btn-primary" href="/contact" data-open-contact>Start a project →</a><a class="btn" href="/contact#estimate">Open the estimator</a>'})}
${sec({id:'planner-sec',stage:'Planner',num:'01',name:'Planner',tagline:'Interactive',body:`    <h2 class="h2 rv">Plan your {{project}}.</h2>\n    <div style="margin-top:clamp(40px,5vw,80px)">${planner}</div>`})}
${sec({id:'stages',stage:'Stages',num:'02',name:'The four stages',tagline:'How it gets done',body:`    <h2 class="h2 rv">No surprises. Just {{progress}}.</h2>\n    <div class="cells c4 rv">${steps.map((x,i)=>'<article class="cell-i"><span class="n mono">0'+(i+1)+' — '+x[1]+'</span><div><h3>'+x[0]+'</h3><p>'+x[2]+'</p></div>'+stepper(i+1)+'</article>').join('')}</div>`})}
${ctaSection({num:'03'})}`;
  return {path:'/process',file:'process.html',opts:{path:'/process',title:'Website Design Process & Planner | MadeOfPixels',desc:'See how a MadeOfPixels website project goes from brief to launch, with an interactive planner that shows timeline and rough price for your project type.',nav:'tools',body,crumbs,v,keywords:'website design process, how long does a website take, website project timeline India'}};
}

/* ---------------------------------------------------------------- free audit */
function audit(v){
  const crumbs=[['Home','/'],['Free website audit','/free-website-audit']];
  const checks=[['Speed','Server response time, page weight, compression and (when available) Google PageSpeed scores for mobile.'],['Mobile','Viewport setup, mobile PageSpeed results and whether the page is usable on a phone.'],['SEO','Title, meta description, headings, canonical, image alt text, structured data, sitemap and robots.txt.'],['Trust & security','HTTPS, social sharing tags and basic technical hygiene.']];
  const faq=[['Is the audit really free?','Yes. There is no cost and no commitment. We only use your email if you choose to send us the report.'],['What do you check?','Speed, mobile readiness and on-page SEO basics for the page you enter: the things we look at first on every project.'],['Does it replace a full SEO audit?','No. It is a quick health check of one page. A full audit also looks at keywords, competitors, content and backlinks.'],['How long does it take?','Usually 10 to 30 seconds. Speed tests from Google can occasionally take a little longer.']];
  const body=`${pageHero({crumbs,tag:'Free tool',h1:'Free website {{audit}}.',sub:'Enter your website address. We check speed, mobile and SEO basics in under a minute and show you the checklist right here. Like what you see? Send the report to us in one click.'})}
${sec({id:'audit',stage:'Audit',num:'01',name:'Run the audit',tagline:'No sign-up needed',body:`    <h2 class="h2 rv">How healthy is your {{website}}?</h2>
    <div class="audit-grid">
      <form id="audit-form" class="audit-form rv" novalidate aria-label="Website audit">
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <div class="field"><label class="mono" for="au-url">Website address</label><input id="au-url" name="url" type="text" inputmode="url" autocomplete="url" placeholder="yourbusiness.com" required aria-describedby="au-url-e"><p class="err" id="au-url-e" aria-live="polite"></p></div>
        <div class="field"><label class="mono" for="au-name">Your name <span class="faint">(optional)</span></label><input id="au-name" name="name" type="text" autocomplete="name"></div>
        <div class="field"><label class="mono" for="au-email">Your email, so we can reply</label><input id="au-email" name="email" type="email" autocomplete="email" required aria-describedby="au-email-e"><p class="err" id="au-email-e" aria-live="polite"></p></div>
        <label class="chk"><input type="checkbox" name="consent" required><span>I agree that ${SITE.name} may contact me about my audit.</span></label>
        <p class="err" id="au-consent-e" aria-live="polite"></p>
        <button class="btn btn-primary" type="submit" id="au-btn" style="justify-self:start">Run the free audit →</button>
        <p class="form-status mono" id="au-status" role="status" aria-live="polite"></p>
      </form>
      <ul class="au-checks rv" aria-label="What we check">${checks.map((c,i)=>'<li><span class="n mono">0'+(i+1)+'</span><div><h3>'+c[0]+'</h3><p>'+c[1]+'</p></div></li>').join('')}</ul>
    </div>
    <div id="audit-out" class="audit-out" aria-live="polite"></div>`})}
${sec({id:'faq',stage:'FAQ',num:'02',name:'FAQ',tagline:'Common questions',body:`    <h2 class="h2 rv">About the {{audit}}.</h2>\n    <div class="rv">${faqHTML(faq)}</div>`})}
${ctaSection({num:'03',h:'Want us to fix what the audit {{finds}}?'})}`;
  const tool={'@type':'WebApplication','@id':SITE.url+'/free-website-audit#tool',name:'Free website audit',url:SITE.url+'/free-website-audit',applicationCategory:'BusinessApplication',operatingSystem:'Any',offers:{'@type':'Offer',price:'0',priceCurrency:'INR'},provider:{'@id':SITE.url+'/#business'}};
  return {path:'/free-website-audit',file:'free-website-audit.html',opts:{path:'/free-website-audit',title:'Free Website Audit: Speed, Mobile & SEO | MadeOfPixels',desc:'Run a free website audit: speed, mobile and on-page SEO checks for any page in under a minute, with a clear checklist on screen and one click to send it to us. By MadeOfPixels Studio.',nav:'tools',body,crumbs,v,bodyClass:'no-strip',graph:[tool,faqNode(faq)],keywords:'free website audit, website SEO checker, website speed test India, mobile friendly test'}};
}

/* ---------------------------------------------------------------- location pages (generated) */
const nameToPath=(()=>{ const m={'Vasai':'/web-design-company-vasai','Virar':'/web-design-company-virar','Mumbai':'/web-design-company-mumbai','Thane':'/web-design-company-thane','Nalasopara':'/web-design-company-nalasopara','Mira Road':'/web-design-company-mira-road'}; LOCATIONS.forEach(l=>{ m[l.name]='/'+l.slug; }); return m; })();
const NUM=n=>String(n).padStart(2,'0');
function locationPage(l,v){
  const p='/'+l.slug, name=l.name, near=l.nearby, n1=near[0], n2=near[1];
  const title=`Web Design Company in ${name} | MadeOfPixels Studio`;
  const desc=`Custom, hand-coded websites for businesses in ${name}, ${n1} and ${n2}. Zero templates, SEO built in. Free quote in 24hrs from MadeOfPixels Studio.`;
  const faq=[
    [`How much does a website cost in ${name}?`,'Website pricing depends on scope. A basic business website starts from ₹15,000–₹30,000. A full custom website with animations and multiple sections typically ranges from ₹30,000–₹80,000. Contact us for a free quote.'],
    ['How long does it take to build a website?','A standard business website takes 1–3 weeks. Complex web apps or projects with branding included take 3–6 weeks. We give you a clear timeline before starting.'],
    [`Do you work with businesses in ${name}?`,`Yes. We are based in Vasai West and work with clients in ${name}, ${near.slice(0,3).join(', ')} and across India remotely, through calls, WhatsApp and email.`],
    [`What makes you different from other web designers in ${name}?`,'We hand-code every website from scratch: no templates, no WordPress, no page builders. Faster sites, better SEO and a completely unique design.'],
    [`Will my website rank for "web design in ${name}" style searches?`,`Every site we build is SEO-optimised by default, with meta tags, schema markup, fast loading, mobile layouts and correct heading structure. We also build local pages for the areas you serve, so people searching in ${name} can find you.`],
    ['Can I update my website after it’s built?','Yes. We either build with a CMS so you can update it yourself, or offer a maintenance package where we handle updates for you.']
  ];
  const crumbs=[['Home','/'],['Services','/services'],['Web design in '+name,p]];
  const nearLinks=near.filter(x=>nameToPath[x]).map(x=>[nameToPath[x],'Web design '+x,'Nearby']);
  const related=nearLinks.concat([['/web-design-company-vasai','Web design Vasai','Our home base'],['/web-design-company-mumbai','Web design Mumbai','Serving all of Mumbai'],['/website-development-vasai','Website development','Full-stack web dev'],['/branding-agency-vasai','Branding agency','Logo & brand identity'],['/ui-ux-design-mumbai','UI/UX design','Interface & product design'],['/custom-web-app-development','Web app development','React, Next.js, SaaS'],['/projects','View all work','Our portfolio'],['/contact','Contact','Free quote in 24hrs']]).filter((x,i,a)=>x[0]!=='/'+l.slug&&a.findIndex(y=>y[0]===x[0])===i);
  const stats='<div class="stats-row"><div class="stat-box"><div class="stat-num">10+</div><div class="stat-label">Projects built</div></div><div class="stat-box"><div class="stat-num">0</div><div class="stat-label">Templates used</div></div><div class="stat-box"><div class="stat-num">100%</div><div class="stat-label">Custom code</div></div><div class="stat-box"><div class="stat-num">24hr</div><div class="stat-label">Quote turnaround</div></div></div>';
  let body=pageHero({crumbs,tag:`Web Design Company · ${name}, ${l.area}`,h1:'Web design company in '+name.split(' ').slice(0,-1).concat('{{'+name.split(' ').pop()+'}}.').join(' '),sub:`Custom websites for ${name} businesses. Zero templates. Every site hand-coded from scratch for your business, with local SEO built in.`,actions:'<a class="btn btn-primary" href="/contact" data-open-contact>Get a free quote →</a><a class="btn" href="'+SITE.wa+'" target="_blank" rel="noopener noreferrer">WhatsApp us ↗</a>'}).replace('<section class="page-hero"','<section class="page-hero lp"');
  body+='\n'+sec({id:'s1',stage:'Overview',num:'01',name:`Why ${name} businesses choose us`,tagline:'MadeOfPixels Studio',cls:'lp',body:`    <h2 class="sec-title rv">We build ${name}’s boldest {{websites}}.</h2>
    <div class="rv"><div class="two-col"><div><p class="body-text">${esc(l.blurb)}</p><p class="body-text">If you run a business in ${name}, you are competing for the same local searches as everyone in ${esc(near.slice(0,3).join(', '))}. <strong>MadeOfPixels Studio</strong> is a web design studio based in Vasai West, building custom websites for businesses across Mumbai and the surrounding region.</p></div><div><p class="body-text">Most agencies hand you a theme with your logo on it. We don’t. Every website we build starts with a blank code editor, hand-coded in HTML, CSS and JavaScript, or React and Next.js for complex projects.</p><p class="body-text">The result is a site that loads fast, looks nothing like anyone else’s and is built to rank on Google for the searches your customers actually use, including web design in ${name}.</p></div></div></div>`});
  body+='\n'+sec({id:'s2',stage:'Services',num:'02',name:'Services',tagline:'MadeOfPixels Studio',cls:'lp',body:`    <h2 class="sec-title rv">What we {{build}} for you.</h2>
    <div class="rv"><div class="services-grid"><div class="svc-card"><div class="svc-num">01</div><div class="svc-name">Custom website design</div><div class="svc-desc">From landing pages to full business sites, every pixel placed with intent. Built for ${name} businesses that want to stand out.</div><ul class="svc-list"><li>HTML/CSS/JS</li><li>Mobile responsive</li><li>SEO optimised</li><li>Fast loading</li></ul></div><div class="svc-card"><div class="svc-num">02</div><div class="svc-name">Website development</div><div class="svc-desc">Hand-coded or React/Next.js: we build the technology that powers your site. No page builders.</div><ul class="svc-list"><li>React / Next.js</li><li>CMS integration</li><li>Web apps</li><li>API connections</li></ul></div><div class="svc-card"><div class="svc-num">03</div><div class="svc-name">Brand identity</div><div class="svc-desc">Logo, colours, fonts and voice: everything that makes your ${name} business recognisable.</div><ul class="svc-list"><li>Logo design</li><li>Brand guidelines</li><li>Typography</li><li>Visual language</li></ul></div></div>${stats}</div>`});
  body+='\n'+sec({id:'s3',stage:'Case study',num:'03',name:'Case study',tagline:'MadeOfPixels Studio',cls:'lp',body:`    <h2 class="sec-title rv">Real work. Real {{results}}.</h2>
    <div class="rv"><div class="case-block"><div class="case-tag">Case study · Vasai client</div><h3 class="case-name">MachinaERP: project tracking for a manufacturer.</h3><p class="case-body">A mould manufacturer needed a project tracking system that matched how their factory actually worked. We built MachinaERP from scratch: job cards, delivery tracking, production dashboards and team management, all in a clean, fast interface. Built entirely in React and rolled out in 8 weeks.</p><div class="case-pills"><span class="pill">Web app</span><span class="pill">Custom ERP</span><span class="pill">React</span><span class="pill">Dashboard design</span></div></div><div class="portfolio-note"><p class="body-text">Want to see more? Visit our full portfolio and case studies.</p><a href="/projects" class="btn btn-primary">View full portfolio →</a></div></div>`});
  body+='\n'+sec({id:'s4',stage:'FAQ',num:'04',name:'FAQs',tagline:'MadeOfPixels Studio',cls:'lp',body:`    <h2 class="sec-title rv">Common {{questions}}.</h2>\n    <div class="rv">${faqHTML(faq)}</div>`});
  body+='\n'+sec({id:'s5',stage:'Related',num:'05',name:'Related services',tagline:'MadeOfPixels Studio',cls:'lp',body:`    <h2 class="sec-title rv">More from {{MadeOfPixels}}.</h2>\n    ${linkGrid(related)}`});
  body+='\n'+ctaSection({num:'06'});
  const graph=[Object.assign({},faqNode(faq),{'@id':SITE.url+p+'#faq'}),{'@type':'Service','@id':SITE.url+p+'#service',name:'Web design in '+name,serviceType:'Web design',provider:{'@id':SITE.url+'/#business'},areaServed:{'@type':'City',name},url:SITE.url+p}];
  return {path:p,file:l.slug+'.html',opts:{path:p,title,desc,keywords:`web design company in ${name}, web designer ${name}, website developer ${name}, website design ${name}, web design agency ${name}, ${near.slice(0,2).map(x=>'web design '+x).join(', ')}`,nav:null,body,crumbs,graph,v}};
}

/* ---------------------------------------------------------------- admin (not indexed) */
function admin(v){
  const body=`<section class="adm" id="adm" aria-label="Admin">
  <div class="adm-login" id="adm-login">
    <p class="mono faint">${SITE.name}</p>
    <h1>Admin.</h1>
    <form id="adm-form" novalidate><label class="mono" for="adm-pass">Password</label><input id="adm-pass" type="password" autocomplete="current-password" required><button class="btn btn-primary" type="submit">Sign in →</button><p class="mono" id="adm-err" role="alert"></p></form>
  </div>
  <div class="adm-app" id="adm-app" hidden></div>
</section>`;
  return {path:'/admin',file:'admin.html',opts:{path:'/admin',title:'Admin | MadeOfPixels Studio',desc:'Admin area.',nav:null,body,v,noindex:true,bare:true,bodyClass:'adm-page',afterFooter:'<script src="/assets/admin.js?v='+v+'" defer></script>'}};
}

module.exports={blogIndex,blogPost,feedXml,gallery,process,audit,locationPage,admin,reviewsSection,sketchBlock,galleryGrid,sketchSvg,fmtDate,nameToPath};
