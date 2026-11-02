// SEO / integrity lint over the generated site.   Run:  node build/lint.js
const fs=require('fs'), path=require('path');
const OUT=path.join(__dirname,'..','site');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(OUT), htmls=files.filter(f=>f.endsWith('.html'));
const routes=new Set(htmls.map(f=>'/'+path.relative(OUT,f).replace(/\\/g,'/').replace(/\.html$/,'').replace(/^index$/,'')));
const assets=new Set(files.map(f=>'/'+path.relative(OUT,f).replace(/\\/g,'/')));
let problems=0; const titles={}, descs={};
const bad=(f,m)=>{problems++;console.log('  ✗',f,'-',m)};
for(const f of htmls){
  const rel=path.relative(OUT,f).replace(/\\/g,'/'), h=fs.readFileSync(f,'utf8');
  const one=(re)=>(h.match(re)||[]);
  const title=(h.match(/<title>([^<]*)<\/title>/)||[])[1]||'', desc=(h.match(/<meta name="description" content="([^"]*)"/)||[])[1]||'';
  const h1=one(/<h1[\s>]/g).length;
  if(rel==='404.html'||rel==='admin.html') {} else {
  if(h1!==1) bad(rel,'h1 count '+h1);
  if(!title||title.length>110) bad(rel,'title length '+title.length);
  if(!desc||desc.length<70||desc.length>200) bad(rel,'description length '+desc.length);
  if((titles[title]=(titles[title]||0)+1)>1) bad(rel,'duplicate title');
  if((descs[desc]=(descs[desc]||0)+1)>1) bad(rel,'duplicate description');
  if(!/<link rel="canonical" href="https:\/\/madeofpixels\.in[^"]*">/.test(h)) bad(rel,'canonical');
  if(!/og:image"/.test(h)) bad(rel,'og:image');
  }
  for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){ try{JSON.parse(m[1])}catch(e){bad(rel,'invalid JSON-LD')} }
  const vis=h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/\splaceholder="[^"]*"/g,'');
  if(/\{\{|\}\}/.test(vis)) bad(rel,'unreplaced {{ }} marker');
  const phm=vis.match(/\[(?:[A-Z][A-Z0-9 \/+-]{2,}|YEAR|EDIT[^\]]*)\]|PLACEHOLDER/i); if(phm) bad(rel,'placeholder text: '+phm[0]);
  const ids=new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const dup=[...h.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]).filter((x,i,a)=>a.indexOf(x)!==i);
  if(dup.length) bad(rel,'duplicate ids: '+[...new Set(dup)].slice(0,5).join(','));
  for(const m of h.matchAll(/<img\b[^>]*>/g)) if(!/\salt="/.test(m[0])) bad(rel,'img without alt');
  for(const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
    const u=m[1]; if(u.startsWith('//')) continue;
    if(!(routes.has(u.replace(/\/$/,''))||routes.has(u)||assets.has(u)||u==='/')) bad(rel,'broken link '+u);
  }
  for(const m of h.matchAll(/href="(\/[^"#?]*)#([^"]+)"/g)){
    const t=m[1]==='/'?'index.html':m[1].slice(1)+'.html', tf=path.join(OUT,t); if(!fs.existsSync(tf)) continue;
    if(!new RegExp('\\sid="'+m[2]+'"').test(fs.readFileSync(tf,'utf8')) && m[2]!=='top') bad(rel,'missing anchor '+m[1]+'#'+m[2]);
  }
}
const sm=fs.readFileSync(path.join(OUT,'sitemap.xml'),'utf8');
for(const m of sm.matchAll(/<loc>https:\/\/madeofpixels\.in([^<]*)<\/loc>/g)){ if(!routes.has(m[1])) bad('sitemap.xml','missing page '+m[1]); }
for(const g of JSON.parse(fs.readFileSync(path.join(__dirname,'..','content','gallery.json'),'utf8'))){ const r=g.art.split('\n'); if(r.length!==16||r.some(x=>!/^[#.]{16}$/.test(x))) bad('content/gallery.json','sketch '+g.id+' is not 16x16'); }
console.log(htmls.length+' pages checked,',problems?problems+' problem(s)':'no problems');
