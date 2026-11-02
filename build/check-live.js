// Live-site check used by .github/workflows/uptime.yml (or run by hand: node build/check-live.js https://madeofpixels.in)
// Fetches the sitemap, then requests every URL and the health endpoint. Exits 1 (so GitHub emails you) if anything is wrong.
const base=(process.argv[2]||'https://madeofpixels.in').replace(/\/$/,'');
const get=async(u,ms=15000)=>{ const c=new AbortController(), t=setTimeout(()=>c.abort(),ms); try{ return await fetch(u,{signal:c.signal,headers:{'User-Agent':'madeofpixels-uptime-check'}}); } finally{ clearTimeout(t); } };
(async()=>{
  const bad=[];
  const sm=await get(base+'/sitemap.xml').then(r=>r.ok?r.text():Promise.reject(new Error('sitemap '+r.status))).catch(e=>{ bad.push('sitemap.xml: '+e.message); return ''; });
  const urls=[...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  if(sm&&urls.length<10) bad.push('sitemap has only '+urls.length+' URLs');
  urls.push(base+'/api/health',base+'/feed.xml',base+'/robots.txt');
  let i=0; const pool=Array.from({length:6},async()=>{ while(i<urls.length){ const u=urls[i++]; try{ const r=await get(u); if(!r.ok) bad.push(r.status+' '+u); else if(/\.xml$|robots|health/.test(u)===false){ const h=await r.text(); if(!/<title>[^<]+<\/title>/.test(h)||!/<h1[\s>]/.test(h)) bad.push('missing title or h1 '+u); } }catch(e){ bad.push('unreachable '+u+' ('+e.message+')'); } } });
  await Promise.all(pool);
  if(bad.length){ console.error('PROBLEMS ('+bad.length+')\n'+bad.join('\n')); process.exit(1); }
  console.log('OK: '+urls.length+' URLs healthy at '+base);
})();
