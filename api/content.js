// Admin content API: GET /api/content?file=projects|posts|gallery|reviews   PUT {file,data,message}
// PUT commits content/<file>.json to GitHub; Vercel then rebuilds the site.
const fs=require('fs'), path=require('path');
const {send,readBody,authed,gh}=require('./_lib');

const FILES=['projects','posts','gallery','reviews'];
const str=(v,max=20000)=>typeof v==='string'&&v.length<=max;
const slug=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,80}$/.test(v);
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);

const RULES={
  projects:it=>slug(it.slug)&&str(it.name,200)&&['saas','brand','webapp'].includes(it.cat)&&['dash','brand','qr'].includes(it.kind)&&Array.isArray(it.steps)&&it.steps.every(s=>Array.isArray(s)&&s.length===2&&str(s[0],200)&&str(s[1],2000))&&Array.isArray(it.stack)&&Array.isArray(it.features)&&[it.short,it.lede,it.note,it.seoTitle,it.seoDesc,it.tag,it.status,it.scope,it.output,it.focus,it.client,it.type,it.catLabel].every(x=>str(x,2000)),
  posts:it=>slug(it.slug)&&str(it.title,300)&&str(it.body,200000)&&day(it.date)&&str(it.description,500)&&str(it.category,80),
  gallery:it=>slug(it.id)&&typeof it.art==='string'&&it.art.split('\n').length===16&&it.art.split('\n').every(r=>/^[#.]{16}$/.test(r))&&str(it.name,120)&&str(it.note||'',200),
  reviews:it=>str(it.name,200)&&str(it.text,3000)&&Number.isInteger(it.rating)&&it.rating>=1&&it.rating<=5&&(!it.photo||/^(\/avatars\/[a-z0-9-]+\.(jpg|png|webp)|https:\/\/\S+)$/.test(it.photo))
};

module.exports=async(req,res)=>{
  const a=authed(req); if(!a.ok) return send(res,a.code,{error:a.error});
  try{
    if(req.method==='GET'){
      const file=String(req.query&&req.query.file||'');
      if(!FILES.includes(file)) return send(res,400,{error:'Unknown file.'});
      if(gh.conf()){ const f=await gh.get('content/'+file+'.json'); if(f) return send(res,200,{data:JSON.parse(f.text),source:'github'}); }
      const local=path.join(process.cwd(),'content',file+'.json');
      return send(res,200,{data:fs.existsSync(local)?JSON.parse(fs.readFileSync(local,'utf8')):[],source:'local'});
    }
    if(req.method==='PUT'){
      const b=await readBody(req), file=b.file, data=b.data;
      if(!FILES.includes(file)) return send(res,400,{error:'Unknown file.'});
      if(!Array.isArray(data)||data.length>500) return send(res,400,{error:'Data must be a list of up to 500 items.'});
      if(!data.every(it=>it&&typeof it==='object'&&RULES[file](it))) return send(res,400,{error:'Some fields are missing or invalid. Check slugs, dates and required text.'});
      if(!gh.conf()) return send(res,503,{error:'GITHUB_TOKEN and GITHUB_REPO are not set, so changes cannot be published. See docs/SETUP.md.'});
      const text=JSON.stringify(data,null,2)+'\n';
      const r=await gh.put('content/'+file+'.json',text,String(b.message||'Admin: update '+file).slice(0,100));
      return send(res,200,{ok:true,url:r.commit});
    }
    res.setHeader('Allow','GET, PUT'); return send(res,405,{error:'Method not allowed.'});
  }catch(e){ console.error('[api/content]',e.message); return send(res,500,{error:e.message}); }
};
