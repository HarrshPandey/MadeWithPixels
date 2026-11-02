/* MadeOfPixels admin: edit projects, blog posts, gallery sketches and reviews. Saving commits the JSON to GitHub; Vercel then rebuilds the site. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='mop-admin';
let token=''; try{ token=sessionStorage.getItem(KEY)||''; }catch(e){}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const OPT={
  cat:['saas','brand','webapp'], kind:['dash','brand','qr'],
  type:['Web App','Custom Website','UI/UX Design','Brand Identity','E-commerce','Landing Page','Maintenance'],
  rating:['5','4','3','2','1']
};
const SCHEMAS={
  projects:{label:'Projects',id:'slug',title:'name',sub:'catLabel',
    blank:()=>({slug:'new-project',name:'New project',cat:'webapp',catLabel:'Web app',kind:'dash',seed:7,tag:'Web app · Description',status:'Live product',short:'',lede:'',scope:'',output:'',focus:'',stack:[],note:'',steps:[['Discovery',''],['Structure',''],['Interface',''],['Outcome','']],seoTitle:'',seoDesc:'',type:'Web App',client:'',features:[]}),
    fields:[['slug','Slug (URL)','text'],['name','Name','text'],['cat','Filter group','select','cat'],['catLabel','Group label','text'],['kind','Pixel artwork','select','kind'],['seed','Artwork seed (any number)','number'],['tag','Tag line','text'],['status','Status','text'],['client','Client','text'],['type','Contact-form type','select','type'],['short','Short description (cards)','textarea'],['lede','Lead paragraph','textarea'],['note','Note under the details','textarea'],['scope','Scope','text'],['output','Output','text'],['focus','Focus','text'],['stack','Stack (one per line)','list'],['features','Features (one per line)','list'],['steps','Stages (title and text)','pairs'],['seoTitle','SEO title','text'],['seoDesc','SEO description','textarea']]},
  posts:{label:'Blog',id:'slug',title:'title',sub:'category',
    blank:()=>({slug:'new-post',title:'New post',description:'',date:new Date().toISOString().slice(0,10),updated:new Date().toISOString().slice(0,10),category:'SEO',published:false,keywords:'',excerpt:'',body:'## First heading\n\nWrite your article in markdown.'}),
    fields:[['slug','Slug (URL)','text'],['title','Title','text'],['category','Category','text'],['date','Published','date'],['updated','Updated','date'],['published','Published (visible on the site)','bool'],['description','SEO description (about 150 characters)','textarea'],['excerpt','Excerpt (cards and feed)','textarea'],['keywords','Keywords (comma separated)','text'],['body','Article (markdown)','md']],
    help:'Markdown: ## headings, **bold**, [links](/contact), - lists, 1. numbered lists, > quotes.'},
  gallery:{label:'Gallery',id:'id',title:'name',sub:'note',
    blank:()=>({id:'sketch-'+Date.now().toString(36),name:'',note:'',date:new Date().toISOString().slice(0,10),approved:true,art:Array(16).fill('.'.repeat(16)).join('\n')}),
    fields:[['id','ID','text'],['name','Credit (name)','text'],['note','Caption','text'],['date','Date','date'],['approved','Approved (visible on the wall)','bool'],['art','Sketch (click squares)','art']],
    help:'Visitor sketches arrive by email from the Formspree form (look for the gallery_ok line). If they said yes, add a gallery entry, paste the # and . rows into the sketch box (or click the squares), tick Approved and save.'},
  reviews:{label:'Reviews',id:'name',title:'name',sub:'source',
    blank:()=>({name:'',rating:5,text:'',date:new Date().toISOString().slice(0,10),source:'Google',url:'',published:true}),
    fields:[['name','Reviewer','text'],['rating','Rating','select','rating'],['text','Review text','textarea'],['date','Date','date'],['source','Source','text'],['url','Link to the review (optional)','text'],['published','Published (visible on the site)','bool']],
    help:'Add reviews from your Google Business Profile, or press "Import from Google" if the Places API keys are set up (see docs/SETUP.md). Only publish reviews you have the right to show.'}
};
const state={file:'projects',data:{},idx:0,dirty:false};

async function api(path,opts={}){
  const r=await fetch(path,Object.assign({},opts,{headers:Object.assign({'Authorization':'Bearer '+token,'Content-Type':'application/json'},opts.headers||{})}));
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||('Request failed ('+r.status+')'));
  return d;
}

/* ---------- login ---------- */
$('#adm-form').addEventListener('submit',async e=>{
  e.preventDefault(); token=$('#adm-pass').value; $('#adm-err').textContent='';
  try{ await load('projects'); try{ sessionStorage.setItem(KEY,token); }catch(_){} start(); }
  catch(ex){ $('#adm-err').textContent=ex.message; token=''; }
});
if(token) load('projects').then(start).catch(()=>{ token=''; });

async function load(file){ const d=await api('/api/content?file='+file); state.data[file]=d.data; return d; }
async function start(){
  $('#adm-login').hidden=true; const app=$('#adm-app'); app.hidden=false;
  await Promise.all(['posts','gallery','reviews'].map(f=>state.data[f]?0:load(f).catch(()=>{ state.data[f]=[]; })));
  draw();
}

/* ---------- shell ---------- */
function draw(){
  const S=SCHEMAS[state.file], list=state.data[state.file]||[];
  if(state.idx>=list.length) state.idx=Math.max(0,list.length-1);
  $('#adm-app').innerHTML=
   '<div class="adm-bar"><div><p class="mono faint">MadeOfPixels Studio</p><h1 style="font:600 28px/1.1 var(--f-display);letter-spacing:-.03em;text-transform:uppercase">Admin</h1></div><div><a class="btn" href="/" target="_blank" rel="noopener">View site ↗</a> <button class="btn" id="adm-out" type="button">Sign out</button></div></div>'+
   '<div class="adm-tabs" role="tablist">'+Object.keys(SCHEMAS).map(k=>'<button role="tab" data-t="'+k+'" aria-selected="'+(k===state.file)+'">'+SCHEMAS[k].label+' ('+((state.data[k]||[]).length)+')</button>').join('')+'</div>'+
   (S.help?'<p class="adm-help" style="margin-bottom:16px">'+esc(S.help)+'</p>':'')+
   '<div class="adm-grid"><div><div class="adm-list">'+list.map((it,i)=>'<button type="button" data-i="'+i+'" aria-current="'+(i===state.idx)+'">'+esc(it[S.title]||'(untitled)')+'<small>'+esc(it[S.sub]||'')+(it.published===false||it.approved===false?' · hidden':'')+'</small></button>').join('')+'</div><p style="margin-top:12px"><button class="btn" id="adm-new" type="button">+ New</button>'+(state.file==='reviews'?' <button class="btn" id="adm-import" type="button">Import from Google</button>':'')+'</p></div><div id="adm-edit"></div></div>';
  $$('[data-t]').forEach(b=>b.addEventListener('click',()=>{ state.file=b.dataset.t; state.idx=0; draw(); }));
  $$('[data-i]').forEach(b=>b.addEventListener('click',()=>{ state.idx=+b.dataset.i; draw(); }));
  $('#adm-new').addEventListener('click',()=>{ list.push(S.blank()); state.idx=list.length-1; draw(); });
  $('#adm-out').addEventListener('click',()=>{ try{ sessionStorage.removeItem(KEY); }catch(_){} location.reload(); });
  const imp=$('#adm-import'); if(imp) imp.addEventListener('click',importGoogle);
  edit();
}

/* ---------- editor ---------- */
function field(f,item){
  const [name,label,type,opt]=f, v=item[name], id='f-'+name;
  const L='<label class="mono" for="'+id+'">'+esc(label)+'</label>';
  if(type==='textarea') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'">'+esc(v)+'</textarea></div>';
  if(type==='md') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'" style="min-height:380px">'+esc(v)+'</textarea></div>';
  if(type==='bool') return '<div><label class="chk"><input id="'+id+'" type="checkbox" data-f="'+name+'"'+(v!==false&&v?' checked':'')+'><span>'+esc(label)+'</span></label></div>';
  if(type==='number') return '<div>'+L+'<input id="'+id+'" type="number" data-f="'+name+'" value="'+esc(v)+'"></div>';
  if(type==='date') return '<div>'+L+'<input id="'+id+'" type="date" data-f="'+name+'" value="'+esc(v)+'"></div>';
  if(type==='select') return '<div>'+L+'<select id="'+id+'" data-f="'+name+'">'+OPT[opt].map(o=>'<option'+(String(o)===String(v)?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></div>';
  if(type==='list') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'" data-kind="list">'+esc((v||[]).join('\n'))+'</textarea></div>';
  if(type==='pairs') return '<div class="adm-full"><span class="mono faint">'+esc(label)+'</span><div id="pairs" style="margin-top:6px">'+(v||[]).map((p,i)=>'<div class="adm-pair"><input type="text" data-p="'+i+'" data-k="0" value="'+esc(p[0])+'" aria-label="Title"><input type="text" data-p="'+i+'" data-k="1" value="'+esc(p[1])+'" aria-label="Text"><button class="btn" type="button" data-rm="'+i+'" aria-label="Remove">✕</button></div>').join('')+'</div><button class="btn" type="button" id="pair-add">+ Add stage</button></div>';
  if(type==='art') return '<div class="adm-full">'+L+'<canvas id="art-cv" width="192" height="192" style="width:192px;height:192px;border:1px solid var(--ink-4);cursor:crosshair" aria-label="Sketch editor"></canvas><textarea id="'+id+'" data-f="'+name+'" class="adm-art" style="margin-top:8px;min-height:240px">'+esc(v)+'</textarea></div>';
  return '<div>'+L+'<input id="'+id+'" type="text" data-f="'+name+'" value="'+esc(v)+'"></div>';
}
function edit(){
  const S=SCHEMAS[state.file], list=state.data[state.file]||[], box=$('#adm-edit');
  if(!list.length){ box.innerHTML='<p class="adm-help">Nothing here yet. Press “+ New”.</p>'; return; }
  const item=list[state.idx];
  box.innerHTML='<form class="adm-form" id="adm-f" novalidate><div class="adm-row">'+S.fields.map(f=>field(f,item)).join('')+'</div><div style="display:flex;flex-wrap:wrap;gap:10px"><button class="btn btn-primary" type="submit">Save and publish →</button><button class="btn" type="button" id="adm-del">Delete</button></div><p class="adm-msg mono" id="adm-msg" role="status" aria-live="polite"></p></form>';
  const f=$('#adm-f');
  function read(){
    $$('[data-f]',f).forEach(el=>{
      const k=el.dataset.f; let v;
      if(el.type==='checkbox') v=el.checked; else if(el.dataset.kind==='list') v=el.value.split('\n').map(s=>s.trim()).filter(Boolean); else if(el.type==='number') v=+el.value||0; else if(k==='rating') v=+el.value; else v=el.value;
      item[k]=v;
    });
    if($('#pairs')){ const rows={}; $$('[data-p]',f).forEach(el=>{ (rows[el.dataset.p]=rows[el.dataset.p]||[])[+el.dataset.k]=el.value; }); item.steps=Object.keys(rows).sort((a,b)=>a-b).map(k=>rows[k]); }
  }
  const art=$('#art-cv');
  if(art){
    const ta=$('#f-art'), c=art.getContext('2d');
    const rows=()=>ta.value.split('\n').map(r=>r.padEnd(16,'.').slice(0,16)).concat(Array(16).fill('.'.repeat(16))).slice(0,16);
    function paint(){ c.clearRect(0,0,192,192); c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--ink'); rows().forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch==='#') c.fillRect(x*12,y*12,12,12); })); c.strokeStyle='rgba(120,120,120,.3)'; c.beginPath(); for(let i=1;i<16;i++){ c.moveTo(i*12,0); c.lineTo(i*12,192); c.moveTo(0,i*12); c.lineTo(192,i*12); } c.stroke(); }
    art.addEventListener('click',e=>{ const r=art.getBoundingClientRect(), x=Math.floor((e.clientX-r.left)/r.width*16), y=Math.floor((e.clientY-r.top)/r.height*16), rs=rows(); const row=[...rs[y]]; row[x]=row[x]==='#'?'.':'#'; rs[y]=row.join(''); ta.value=rs.join('\n'); paint(); });
    ta.addEventListener('input',paint); paint();
  }
  f.addEventListener('click',e=>{
    if(e.target.id==='pair-add'){ read(); (item.steps=item.steps||[]).push(['','']); edit(); }
    const rm=e.target.closest&&e.target.closest('[data-rm]'); if(rm){ read(); item.steps.splice(+rm.dataset.rm,1); edit(); }
  });
  $('#adm-del').addEventListener('click',async()=>{
    if(!confirm('Delete “'+(item[S.title]||'this item')+'”? It is removed from the site after the next rebuild.')) return;
    list.splice(state.idx,1); state.idx=0; await save(true);
  });
  f.addEventListener('submit',async e=>{ e.preventDefault(); read(); await save(false); });
}
async function save(afterDelete){
  const S=SCHEMAS[state.file], list=state.data[state.file], msg=()=>$('#adm-msg');
  const set=(t,err)=>{ const m=msg(); if(m){ m.textContent=t; m.className='adm-msg mono'+(err?' err':''); } };
  const ids=list.map(i=>i[S.id]);
  if(state.file!=='reviews'){
    if(ids.some(x=>!/^[a-z0-9][a-z0-9-]*$/.test(String(x)))){ set('Slugs and IDs may only use lowercase letters, numbers and hyphens.',true); return; }
    if(new Set(ids).size!==ids.length){ set('Two items share the same slug or ID. Make each one unique.',true); return; }
  }
  set('Saving…');
  try{
    const d=await api('/api/content',{method:'PUT',body:JSON.stringify({file:state.file,data:list,message:'Admin: update '+state.file})});
    draw(); const m=msg(); if(m){ m.textContent='Saved. The site rebuilds in about a minute.'+(d.url?' Commit: '+d.url:''); }
  }catch(ex){ set(ex.message,true); }
}
async function importGoogle(){
  const m=$('#adm-msg')||document.createElement('p');
  try{
    const d=await api('/api/reviews');
    const list=state.data.reviews, have=new Set(list.map(r=>r.name+'|'+(r.text||'').slice(0,40)));
    let added=0; (d.reviews||[]).forEach(r=>{ const k=r.name+'|'+(r.text||'').slice(0,40); if(!have.has(k)){ list.push(r); added++; } });
    alert(added?added+' review(s) imported. Review them, then press Save and publish.':'No new reviews found.'); draw();
  }catch(ex){ alert(ex.message); }
}
})();
