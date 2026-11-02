// Admin-only: pulls recent reviews from your Google Business Profile through the Places API (New).
// Needs GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID in the Vercel environment. Returns review objects for the admin panel to review and save.
const {send,authed}=require('./_lib');

module.exports=async(req,res)=>{
  const a=authed(req); if(!a.ok) return send(res,a.code,{error:a.error});
  const key=process.env.GOOGLE_PLACES_API_KEY, id=process.env.GOOGLE_PLACE_ID;
  if(!key||!id) return send(res,503,{error:'GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are not set. See docs/SETUP.md, or add reviews by hand in the admin panel.'});
  try{
    const r=await fetch('https://places.googleapis.com/v1/places/'+encodeURIComponent(id)+'?languageCode=en',{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'displayName,rating,userRatingCount,googleMapsUri,reviews'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) return send(res,502,{error:'Google said: '+((d.error&&d.error.message)||r.status)});
    const reviews=(d.reviews||[]).map(v=>({
      name:(v.authorAttribution&&v.authorAttribution.displayName)||'Google user',
      rating:Math.round(v.rating||5),
      text:((v.text&&v.text.text)||(v.originalText&&v.originalText.text)||'').trim(),
      date:String(v.publishTime||'').slice(0,10)||new Date().toISOString().slice(0,10),
      source:'Google',url:d.googleMapsUri||'',published:false
    })).filter(v=>v.text);
    return send(res,200,{reviews,rating:d.rating,count:d.userRatingCount});
  }catch(e){ console.error('[api/reviews]',e.message); return send(res,500,{error:e.message}); }
};
