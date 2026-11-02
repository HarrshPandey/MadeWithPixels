// Basic client error log. Browsers post here (navigator.sendBeacon); read entries in Vercel > Logs, filter for "[client-error]".
const {send,readBody,ip,limited}=require('./_lib');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{error:'POST only'});
  if(limited('log:'+ip(req),20,60*1000)) return send(res,429,{error:'slow down'});
  const b=await readBody(req), cut=(v,n)=>String(v==null?'':v).replace(/[\r\n]+/g,' ').slice(0,n);
  console.error('[client-error]',JSON.stringify({type:cut(b.type,20),msg:cut(b.msg,300),src:cut(b.src,120),line:Number(b.line)||0,url:cut(b.url,200),ua:cut(b.ua,140)}));
  res.statusCode=204; res.end();
};
