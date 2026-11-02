// Admin-only: uploads a reviewer profile photo (already resized to a small square JPEG by the admin page) to content/avatars/ on GitHub.
// POST {data:"data:image/jpeg;base64,..."} -> {path:"/avatars/<id>.jpg"}. Vercel rebuilds and serves it from /avatars/.
const crypto=require('crypto');
const {send,readBody,authed,gh}=require('./_lib');

module.exports=async(req,res)=>{
  const a=authed(req); if(!a.ok) return send(res,a.code,{error:a.error});
  if(req.method!=='POST'){ res.setHeader('Allow','POST'); return send(res,405,{error:'POST only.'}); }
  if(!gh.conf()) return send(res,503,{error:'GITHUB_TOKEN and GITHUB_REPO are not set, so photos cannot be uploaded.'});
  const b=await readBody(req), m=String(b.data||'').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if(!m) return send(res,400,{error:'Send a JPEG, PNG or WebP image.'});
  const buf=Buffer.from(m[2],'base64');
  if(buf.length<200||buf.length>200*1024) return send(res,400,{error:'The photo must be under 200 KB (the admin page shrinks it for you).'});
  const ext=m[1]==='jpeg'?'jpg':m[1], id='rev-'+Date.now().toString(36)+'-'+crypto.randomBytes(3).toString('hex');
  try{
    await gh.putBase64('content/avatars/'+id+'.'+ext,m[2],'Admin: upload reviewer photo');
    return send(res,200,{ok:true,path:'/avatars/'+id+'.'+ext});
  }catch(e){ console.error('[api/upload]',e.message); return send(res,500,{error:e.message}); }
};
