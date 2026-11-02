// Shared helpers for the Vercel functions in /api (files starting with _ are not exposed as routes).
const crypto=require('crypto');

function send(res,code,obj){
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(obj===undefined?'':JSON.stringify(obj));
}
function readBody(req){
  return new Promise(resolve=>{
    if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body)) return resolve(req.body);
    if(typeof req.body==='string'){ try{ return resolve(JSON.parse(req.body)); }catch(e){ return resolve({}); } }
    let s=''; req.on('data',c=>{ s+=c; if(s.length>2e6) req.destroy(); }); req.on('end',()=>{ try{ resolve(JSON.parse(s||'{}')); }catch(e){ resolve({}); } }); req.on('error',()=>resolve({}));
  });
}
const ip=req=>String((req.headers['x-forwarded-for']||'').split(',')[0]||req.socket&&req.socket.remoteAddress||'unknown').trim();

/* tiny in-memory rate limiter (per serverless instance; enough to blunt casual abuse) */
const hits=new Map();
function limited(key,max,windowMs){
  const now=Date.now(), arr=(hits.get(key)||[]).filter(t=>now-t<windowMs);
  arr.push(now); hits.set(key,arr);
  if(hits.size>5000) for(const [k,v] of hits) if(!v.length||now-v[v.length-1]>windowMs) hits.delete(k);
  return arr.length>max;
}

/* admin auth: Authorization: Bearer <ADMIN_PASSWORD> */
function authed(req){
  const pw=process.env.ADMIN_PASSWORD; if(!pw) return {ok:false,code:503,error:'ADMIN_PASSWORD is not set on the server.'};
  if(limited('auth:'+ip(req),20,15*60*1000)) return {ok:false,code:429,error:'Too many attempts. Try again later.'};
  const given=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const a=crypto.createHash('sha256').update(given).digest(), b=crypto.createHash('sha256').update(pw).digest();
  if(!crypto.timingSafeEqual(a,b)) return {ok:false,code:401,error:'Wrong password.'};
  return {ok:true};
}

/* GitHub Contents API (used to commit content/*.json from the admin panel) */
const gh={
  conf(){ const repo=process.env.GITHUB_REPO, token=process.env.GITHUB_TOKEN; return repo&&token?{repo,token,branch:process.env.GITHUB_BRANCH||'main'}:null; },
  async req(c,method,path,body){
    const r=await fetch('https://api.github.com/repos/'+c.repo+'/contents/'+path+(method==='GET'?'?ref='+encodeURIComponent(c.branch):''),{
      method,headers:{Authorization:'Bearer '+c.token,Accept:'application/vnd.github+json','User-Agent':'madeofpixels-admin','X-GitHub-Api-Version':'2022-11-28'},
      body:body?JSON.stringify(body):undefined
    });
    const d=await r.json().catch(()=>({})); if(!r.ok&&!(method==='GET'&&r.status===404)) throw new Error('GitHub: '+(d.message||r.status));
    return {status:r.status,data:d};
  },
  async get(path){ const c=this.conf(); const {status,data}=await this.req(c,'GET',path); if(status===404) return null; return {sha:data.sha,text:Buffer.from(data.content||'','base64').toString('utf8')}; },
  async put(path,text,message){
    const c=this.conf(); const cur=await this.get(path);
    const {data}=await this.req(c,'PUT',path,{message,content:Buffer.from(text,'utf8').toString('base64'),branch:c.branch,sha:cur?cur.sha:undefined});
    return {commit:data.commit&&data.commit.html_url};
  }
};

module.exports={send,readBody,ip,limited,authed,gh};
