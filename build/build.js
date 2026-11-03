// Generates the deployable site into ../site.   Run:  node build/build.js
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const L=require('./lib'), P=require('./pages'), P2=require('./pages2'), OG=require('./og');
const {SITE,PROJECTS,POSTS,LOCATIONS}=L;
const ROOT=path.join(__dirname,'..'), OUT=path.join(ROOT,'site'), SRC=path.join(__dirname,'source-repo'), A=path.join(__dirname,'assets-src');

const write=(rel,data)=>{ const f=path.join(OUT,rel); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,data); };
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

/* ---- assets ---- */
const css=(fs.readFileSync(path.join(A,'site.base.css'),'utf8')+'\n'+fs.readFileSync(path.join(A,'site.extra.css'),'utf8')+'\n'+fs.readFileSync(path.join(A,'site.more.css'),'utf8'))
  .replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*\n\s*/g,'\n').replace(/\s*([{};,>])\s*/g,'$1').replace(/;}/g,'}').trim();
const MARK='/* ---------- Lenis smooth scroll';
const base=fs.readFileSync(path.join(A,'site.js'),'utf8'), feat=fs.readFileSync(path.join(A,'features.js'),'utf8')+'\n'+fs.readFileSync(path.join(A,'eggs.js'),'utf8');
const at=base.indexOf(MARK); if(at<0) throw new Error('site.js marker missing');
const js=base.slice(0,at)+feat+'\n'+base.slice(at);
const adminJs=fs.readFileSync(path.join(A,'admin.js'),'utf8');
const v=crypto.createHash('md5').update(css+js+adminJs).digest('hex').slice(0,8);
if(fs.existsSync(path.join(ROOT,'content','avatars'))) fs.cpSync(path.join(ROOT,'content','avatars'),path.join(OUT,'avatars'),{recursive:true});
write('assets/site.css',css); write('assets/site.js',js); write('assets/admin.js',adminJs);

/* ---- pages ---- */
const pages=[P.home(v),P.about(v),P.services(v),P.projectsIndex(v),P.contact(v),P2.process(v),P2.gallery(v),P2.audit(v),P2.blogIndex(v),P.policy(v),P.notFound(v),P2.admin(v)];
PROJECTS.forEach((p,i)=>pages.push(P.projectPage(p,i,v)));
POSTS.forEach((p,i)=>pages.push(P2.blogPost(p,i,v)));
const landingFiles=fs.readdirSync(SRC).filter(f=>f.endsWith('.html')&&!['index.html','information-security-policy.html'].includes(f)).sort();
landingFiles.forEach(f=>pages.push(P.landing(f,v)));
LOCATIONS.forEach(l=>pages.push(P2.locationPage(l,v)));

const seen=new Set();
pages.forEach(pg=>{
  if(seen.has(pg.path)) throw new Error('duplicate path '+pg.path); seen.add(pg.path);
  write(pg.file,L.shell(pg.opts));
});

/* ---- social preview images, one per indexable page ---- */
const kicker=p=>p.startsWith('/blog/')?'BLOG - MADEOFPIXELS STUDIO':p.startsWith('/projects')?'CASE STUDY - MADEOFPIXELS STUDIO':'WEB DESIGN AGENCY - VASAI & MUMBAI';
pages.filter(p=>!p.opts.noindex).forEach(p=>{
  const t=(p.opts.ogTitle||p.opts.title).replace(/\s*\|\s*MadeOfPixels( Studio)?\s*$/i,'').replace(/[^\x20-\x7E]/g,m=>m==='₹'?'RS':m==='–'||m==='—'?'-':m==='’'?"'":'');
  write('og/'+L.ogSlug(p.path)+'.png',OG.card({title:t,kicker:kicker(p.path)}));
});

/* ---- sitemap, feed ---- */
const prio=p=>p==='/'?'1.0':['/about','/services','/projects','/contact','/blog'].includes(p)?'0.9':p.startsWith('/blog/')?'0.7':p.startsWith('/projects/')?'0.7':['/information-security-policy','/gallery','/process','/free-website-audit'].includes(p)?'0.5':'0.8';
const freq=p=>p==='/'?'weekly':p==='/blog'?'weekly':p==='/information-security-policy'?'yearly':'monthly';
const urls=pages.filter(p=>!p.opts.noindex).sort((a,b)=>(a.path==='/'?-1:b.path==='/'?1:0));
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(p=>`  <url>\n    <loc>${SITE.url}${p.path}</loc>\n    <lastmod>${p.opts.modified||SITE.modified}</lastmod>\n    <changefreq>${freq(p.path)}</changefreq>\n    <priority>${prio(p.path)}</priority>\n  </url>`).join('\n')+'\n</urlset>\n');
write('feed.xml',P2.feedXml());

/* ---- robots / llms / security / static files ---- */
write('robots.txt',fs.readFileSync(path.join(SRC,'robots.txt'),'utf8').replace(/Disallow: \/private\//,'Disallow: /private/\nDisallow: /unpublished/\nDisallow: /admin\nDisallow: /api/'));
write('.well-known/security.txt',fs.readFileSync(path.join(SRC,'.well-known/security.txt'),'utf8'));
fs.copyFileSync(path.join(SRC,'logo.png'),path.join(OUT,'logo.png'));
fs.copyFileSync(path.join(SRC,'og-preview.png'),path.join(OUT,'og-preview.png'));
/* favicon: the six-square mark on a transparent background; ink on light browsers, paper on dark ones.
   PNG/ICO fallbacks use a solid paper tile so they read on any tab or home-screen colour. */
write('favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29"><style>.m{fill:#111110}@media (prefers-color-scheme:dark){.m{fill:#EFEDE8}}</style><path class="m" d="M0 0h9v9H0zM10 0h9v9h-9zM0 10h9v9H0zM20 10h9v9h-9zM10 20h9v9h-9zM20 20h9v9h-9z"/></svg>\n');
fs.writeFileSync(path.join(OUT,'favicon.ico'),OG.ico([16,32,48]));
fs.writeFileSync(path.join(OUT,'favicon-32.png'),OG.iconPng(32));
fs.writeFileSync(path.join(OUT,'apple-touch-icon.png'),OG.iconPng(180,{pad:.22}));
fs.writeFileSync(path.join(OUT,'icon-512.png'),OG.iconPng(512,{pad:.2}));

const llm=fs.readFileSync(path.join(SRC,'llms.txt'),'utf8').replace(/\n## Policies[\s\S]*?\n## Why Choose Us/,
`\n## Key pages
- Home: ${SITE.url}/
- About: ${SITE.url}/about
- Services: ${SITE.url}/services
- Projects and case studies: ${SITE.url}/projects
${PROJECTS.map(p=>'- '+p.name+': '+SITE.url+'/projects/'+p.slug).join('\n')}
- Process and project planner: ${SITE.url}/process
- Free website audit: ${SITE.url}/free-website-audit
- Pixel gallery: ${SITE.url}/gallery
- Contact and free quote: ${SITE.url}/contact

## Blog
- Index: ${SITE.url}/blog (RSS: ${SITE.url}/feed.xml)
${POSTS.map(p=>'- '+p.title+': '+SITE.url+'/blog/'+p.slug).join('\n')}

## Local and industry pages
${landingFiles.map(f=>'- '+SITE.url+'/'+f.replace('.html','')).concat(LOCATIONS.map(l=>'- '+SITE.url+'/'+l.slug)).join('\n')}

## Policies
- Information Security Policy: ${SITE.url}/information-security-policy

## Social
- Instagram: ${SITE.ig}
- LinkedIn: ${SITE.li}

## Why Choose Us`);
write('llms.txt',llm);

write('.htaccess',`# Apache fallback (Vercel ignores this file). Clean URLs, HTTPS, no www, 404 page, caching, compression.
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 6 months"
  ExpiresByType image/svg+xml "access plus 6 months"
</IfModule>
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
  RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]
  RewriteRule ^ /%1 [R=301,L,NE]
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>
ErrorDocument 404 /404.html
`);

/* ---- project-level config (Vercel builds the site and serves api/ functions) ---- */
const hdr=(k,val)=>({key:k,value:val});
fs.writeFileSync(path.join(ROOT,'vercel.json'),JSON.stringify({
  buildCommand:'node build/build.js',outputDirectory:'site',cleanUrls:true,trailingSlash:false,
  redirects:[{source:'/unpublished/:path*',destination:'/',permanent:false},{source:'/index',destination:'/',permanent:true}],
  functions:{'api/audit.js':{maxDuration:30},'api/submit.js':{maxDuration:15},'api/audit-send.js':{maxDuration:15},'api/content.js':{maxDuration:15},'api/upload.js':{maxDuration:15}},
  headers:[
    {source:'/(.*)',headers:[hdr('X-Content-Type-Options','nosniff'),hdr('X-Frame-Options','SAMEORIGIN'),hdr('Referrer-Policy','strict-origin-when-cross-origin'),hdr('Permissions-Policy','geolocation=(), microphone=(), camera=()'),hdr('Strict-Transport-Security','max-age=31536000; includeSubDomains')]},
    {source:'/assets/(.*)',headers:[hdr('Cache-Control','public, max-age=31536000, immutable')]},
    {source:'/og/(.*)',headers:[hdr('Cache-Control','public, max-age=86400')]},
    {source:'/(logo.png|og-preview.png|favicon.svg|favicon.ico|favicon-32.png|apple-touch-icon.png|icon-512.png)',headers:[hdr('Cache-Control','public, max-age=2592000')]},
    {source:'/(sitemap.xml|robots.txt|llms.txt|feed.xml)',headers:[hdr('Cache-Control','public, max-age=3600')]},
    {source:'/admin',headers:[hdr('X-Robots-Tag','noindex, nofollow'),hdr('Cache-Control','no-store')]},
    {source:'/api/(.*)',headers:[hdr('X-Robots-Tag','noindex'),hdr('Cache-Control','no-store')]}
  ]},null,2)+'\n');
fs.writeFileSync(path.join(ROOT,'package.json'),JSON.stringify({name:'madeofpixels-site',version:'1.0.0',private:true,description:'MadeOfPixels Studio website',scripts:{build:'node build/build.js',lint:'node build/lint.js'},engines:{node:'>=20'}},null,2)+'\n');
fs.writeFileSync(path.join(ROOT,'.gitignore'),'node_modules\n.vercel\n.env\n.env.*\nsite/\n');

console.log('built',pages.length,'pages, assets v'+v,'→',OUT);
