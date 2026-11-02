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
const HINT={seoTitle:60,seoDesc:160,description:160,excerpt:200,title:70,short:160};   // recommended lengths, shown as counters
const SCHEMAS={
  projects:{label:'Projects',id:'slug',title:'name',sub:'catLabel',
    blank:()=>({slug:'new-project',name:'New project',cat:'webapp',catLabel:'Web app',kind:'dash',seed:7,tag:'Web app · Description',status:'Live product',short:'',lede:'',scope:'',output:'',focus:'',stack:[],note:'',steps:[['Discovery',''],['Structure',''],['Interface',''],['Outcome','']],seoTitle:'',seoDesc:'',type:'Web App',client:'',features:[]}),
    fields:[['slug','Slug (URL)','text'],['name','Name','text'],['cat','Filter group','select','cat'],['catLabel','Group label','text'],['kind','Pixel artwork','select','kind'],['seed','Artwork seed (any number)','number'],['tag','Tag line','text'],['status','Status','text'],['client','Client','text'],['type','Contact-form type','select','type'],['short','Short description (cards)','textarea'],['lede','Lead paragraph','textarea'],['note','Note under the details','textarea'],['scope','Scope','text'],['output','Output','text'],['focus','Focus','text'],['stack','Stack (one per line)','list'],['features','Features (one per line)','list'],['steps','Stages (title and text)','pairs'],['seoTitle','SEO title','text'],['seoDesc','SEO description','textarea']],
    chip:()=>'Live'},
  posts:{label:'Blog',id:'slug',title:'title',sub:'category',
    blank:()=>({slug:'new-post',title:'New post',description:'',date:new Date().toISOString().slice(0,10),updated:new Date().toISOString().slice(0,10),category:'SEO',published:false,keywords:'',excerpt:'',body:'## First heading\n\nWrite your article in markdown.'}),
    fields:[['slug','Slug (URL)','text'],['title','Title','text'],['category','Category','text'],['date','Published','date'],['updated','Updated','date'],['published','Published (visible on the site)','bool'],['description','SEO description (about 150 characters)','textarea'],['excerpt','Excerpt (cards and feed)','textarea'],['keywords','Keywords (comma separated)','text'],['body','Article (markdown)','md']],
    chip:it=>it.published===false?'Draft':'Published',
    help:'Markdown: ## headings, **bold**, [links](/contact), - lists, 1. numbered lists, > quotes.'},
  gallery:{label:'Gallery',id:'id',title:'name',sub:'note',
    blank:()=>({id:'sketch-'+Date.now().toString(36),name:'',note:'',date:new Date().toISOString().slice(0,10),approved:true,art:Array(16).fill('.'.repeat(16)).join('\n')}),
    fields:[['id','ID','text'],['name','Credit (name)','text'],['note','Caption','text'],['date','Date','date'],['approved','Approved (visible on the wall)','bool'],['art','Sketch (click squares)','art']],
    chip:it=>it.approved===false?'Hidden':'On the wall',
    help:'Visitor sketches arrive by email from the Formspree form (look for the gallery_ok line). If they said yes, add a gallery entry, paste the # and . rows into the sketch box (or click the squares), tick Approved and save.'},
  reviews:{label:'Reviews',id:'name',title:'name',sub:'source',
    blank:()=>({name:'',rating:5,text:'',date:new Date().toISOString().slice(0,10),source:'Google',url:'',photo:'',published:true}),
    fields:[['name','Reviewer name','text'],['rating','Rating','select','rating'],['text','Review text','textarea'],['photo','Profile photo','photo'],['date','Date','date'],['source','Source','text'],['url','Link to the review (optional)','text'],['published','Published (visible on the site)','bool']],
    chip:it=>it.published===false?'Hidden':'Published',
    help:'Type the reviewer\'s name and paste their review. If you do not add a profile photo, their initials are shown in a square instead. Only publish reviews you have the right to show.'}
};
const state={file:'projects',data:{},idx:0,dirty:false,view:'list',q:''};
const cur=()=>(state.data[state.file]||[])[state.idx];

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
  $('#adm-login').hidden=true; $('#adm-app').hidden=false;
  await Promise.all(['posts','gallery','reviews'].map(f=>state.data[f]?0:load(f).catch(()=>{ state.data[f]=[]; })));
  draw();
}

/* ---------- unsaved-changes tracking ---------- */
function setDirty(on){
  state.dirty=on;
  const d=$('#adm-dirty'); if(d) d.hidden=!on;
  const s=$('#adm-save'); if(s) s.classList.toggle('is-dirty',on);
}
addEventListener('beforeunload',e=>{ if(state.dirty){ e.preventDefault(); e.returnValue=''; } });
addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&$('#adm-f')){ e.preventDefault(); commit(); save(); } });

/* ---------- shell ---------- */
function draw(){
  const S=SCHEMAS[state.file], list=state.data[state.file]||[];
  if(state.idx>=list.length) state.idx=Math.max(0,list.length-1);
  $('#adm-app').innerHTML=
   '<header class="adm-top"><div class="adm-brand"><b>Admin</b><span class="mono faint">MadeOfPixels Studio</span></div><div class="adm-top-r"><span class="adm-dirty mono" id="adm-dirty" hidden>● Unsaved changes</span><a class="btn adm-s" href="/" target="_blank" rel="noopener">View site ↗</a><button class="btn adm-s" id="adm-out" type="button">Sign out</button></div></header>'+
   '<nav class="adm-tabs" role="tablist" aria-label="Content">'+Object.keys(SCHEMAS).map(k=>'<button role="tab" type="button" data-t="'+k+'" aria-selected="'+(k===state.file)+'">'+SCHEMAS[k].label+' <span>'+((state.data[k]||[]).length)+'</span></button>').join('')+'</nav>'+
   '<div class="adm-grid" id="adm-grid" data-view="'+state.view+'">'+
     '<aside class="adm-side"><input type="search" id="adm-q" class="adm-search" placeholder="Search '+esc(S.label.toLowerCase())+'…" aria-label="Search" value="'+esc(state.q)+'"><div class="adm-list" id="adm-list"></div><button class="btn adm-new" id="adm-new" type="button">+ New</button>'+(S.help?'<p class="adm-help">'+esc(S.help)+'</p>':'')+'</aside>'+
     '<section class="adm-main"><button class="btn adm-s adm-back" id="adm-back" type="button">← All '+esc(S.label.toLowerCase())+'</button><div id="adm-edit"></div></section>'+
   '</div>';
  $$('[data-t]').forEach(b=>b.addEventListener('click',()=>{ commit(); state.file=b.dataset.t; state.idx=0; state.view='list'; state.q=''; draw(); }));
  $('#adm-new').addEventListener('click',()=>{ commit(); list.push(S.blank()); state.idx=list.length-1; state.view='edit'; setDirty(true); draw(); window.scrollTo(0,0); });
  $('#adm-out').addEventListener('click',()=>{ if(state.dirty&&!confirm('You have unsaved changes. Sign out anyway?')) return; try{ sessionStorage.removeItem(KEY); }catch(_){} state.dirty=false; location.reload(); });
  $('#adm-back').addEventListener('click',()=>{ commit(); state.view='list'; $('#adm-grid').dataset.view='list'; renderList(); window.scrollTo(0,0); });
  $('#adm-q').addEventListener('input',e=>{ state.q=e.target.value; renderList(); });
  renderList(); edit(); setDirty(state.dirty);
}
function renderList(){
  const S=SCHEMAS[state.file], list=state.data[state.file]||[], q=state.q.trim().toLowerCase();
  const rows=list.map((it,i)=>({it,i})).filter(r=>!q||(String(r.it[S.title]||'')+' '+String(r.it[S.sub]||'')).toLowerCase().includes(q));
  $('#adm-list').innerHTML=rows.length?rows.map(({it,i})=>'<button type="button" data-i="'+i+'" aria-current="'+(i===state.idx)+'"><span>'+esc(it[S.title]||'(untitled)')+'</span><small>'+esc(it[S.sub]||'')+' · '+esc(S.chip(it))+'</small></button>').join(''):'<p class="adm-help" style="padding:14px">'+(q?'No matches.':'Nothing here yet. Press “+ New”.')+'</p>';
  $$('[data-i]',$('#adm-list')).forEach(b=>b.addEventListener('click',()=>{ commit(); state.idx=+b.dataset.i; state.view='edit'; $('#adm-grid').dataset.view='edit'; renderList(); edit(); window.scrollTo(0,0); }));
}

/* ---------- editor ---------- */
function field(f,item){
  const [name,label,type,opt]=f, v=item[name], id='f-'+name, max=HINT[name];
  const L='<div class="adm-lab"><label class="mono" for="'+id+'">'+esc(label)+'</label>'+(max?'<span class="adm-count mono" data-count="'+id+'" data-max="'+max+'"></span>':'')+'</div>';
  if(type==='textarea') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'" data-auto="1">'+esc(v)+'</textarea></div>';
  if(type==='md') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'" class="adm-md">'+esc(v)+'</textarea></div>';
  if(type==='bool') return '<div class="adm-bool"><label class="chk"><input id="'+id+'" type="checkbox" data-f="'+name+'"'+(v!==false&&v?' checked':'')+'><span>'+esc(label)+'</span></label></div>';
  if(type==='number') return '<div>'+L+'<input id="'+id+'" type="number" data-f="'+name+'" value="'+esc(v)+'"></div>';
  if(type==='date') return '<div>'+L+'<input id="'+id+'" type="date" data-f="'+name+'" value="'+esc(v)+'"></div>';
  if(type==='select') return '<div>'+L+'<select id="'+id+'" data-f="'+name+'">'+OPT[opt].map(o=>'<option'+(String(o)===String(v)?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></div>';
  if(type==='list') return '<div class="adm-full">'+L+'<textarea id="'+id+'" data-f="'+name+'" data-kind="list" data-auto="1">'+esc((v||[]).join('\n'))+'</textarea></div>';
  if(type==='pairs') return '<div class="adm-full"><div class="adm-lab"><span class="mono">'+esc(label)+'</span></div><div id="pairs">'+(v||[]).map((p,i)=>'<div class="adm-pair"><input type="text" data-p="'+i+'" data-k="0" value="'+esc(p[0])+'" aria-label="Stage title"><input type="text" data-p="'+i+'" data-k="1" value="'+esc(p[1])+'" aria-label="Stage text"><button class="btn adm-s" type="button" data-rm="'+i+'" aria-label="Remove stage">✕</button></div>').join('')+'</div><button class="btn adm-s" type="button" id="pair-add">+ Add stage</button></div>';
  if(type==='art') return '<div class="adm-full">'+L+'<canvas id="art-cv" width="192" height="192" class="adm-artcv" aria-label="Sketch editor"></canvas><textarea id="'+id+'" data-f="'+name+'" class="adm-art" rows="16">'+esc(v)+'</textarea></div>';
  if(type==='photo') return '<div class="adm-full">'+L+'<div class="adm-photo"><span class="av" id="adm-av"></span><div><input type="file" id="adm-file" accept="image/*"><p class="adm-help" style="margin-top:6px">Any photo works: it is cropped to a small square. Leave empty to use initials.</p></div><button class="btn adm-s" type="button" id="adm-photo-rm">Remove photo</button></div><input id="'+id+'" type="text" data-f="'+name+'" value="'+esc(v)+'" placeholder="/avatars/… or https://… (filled in by the upload)" style="margin-top:8px"></div>';
  return '<div>'+L+'<input id="'+id+'" type="text" data-f="'+name+'" value="'+esc(v)+'"></div>';
}
function initialsOf(n){ const w=String(n||'').trim().split(/\s+/).filter(Boolean); return w.length?([...w[0]][0]+(w.length>1?[...w[w.length-1]][0]:'')).toUpperCase():'?'; }
function squareJpeg(file,size){
  return new Promise((resolve,reject)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const s=Math.min(img.width,img.height), c=document.createElement('canvas'); c.width=c.height=size; c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg',.85)); };
    img.onerror=()=>reject(new Error('That file could not be read as an image.')); img.src=url;
  });
}
/* copy the form values into the current item (call before leaving the form) */
function commit(){
  const f=$('#adm-f'), item=cur(); if(!f||!item) return;
  $$('[data-f]',f).forEach(el=>{
    const k=el.dataset.f; let v;
    if(el.type==='checkbox') v=el.checked; else if(el.dataset.kind==='list') v=el.value.split('\n').map(s=>s.trim()).filter(Boolean); else if(el.type==='number') v=+el.value||0; else if(k==='rating') v=+el.value; else v=el.value;
    item[k]=v;
  });
  if($('#pairs')){ const rows={}; $$('[data-p]',f).forEach(el=>{ (rows[el.dataset.p]=rows[el.dataset.p]||[])[+el.dataset.k]=el.value; }); item.steps=Object.keys(rows).sort((a,b)=>a-b).map(k=>rows[k]); }
}
const msg=(t,err)=>{ const m=$('#adm-msg'); if(m){ m.textContent=t; m.className='adm-msg mono'+(err?' err':''); } };
const grow=el=>{ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight+2,520)+'px'; };

function edit(){
  const S=SCHEMAS[state.file], list=state.data[state.file]||[], box=$('#adm-edit');
  if(!list.length){ box.innerHTML='<div class="adm-empty"><p>Nothing here yet.</p><p class="adm-help">Press “+ New” to add the first one.</p></div>'; return; }
  const item=cur();
  box.innerHTML='<form class="adm-form" id="adm-f" novalidate>'+
    '<div class="adm-head"><h2 id="adm-h">'+esc(item[S.title]||'Untitled')+'</h2><span class="adm-chip mono">'+esc(S.chip(item))+'</span></div>'+
    '<div class="adm-row">'+S.fields.map(f=>field(f,item)).join('')+'</div>'+
    '<div class="adm-actions"><div class="adm-btns"><button class="btn btn-primary" type="submit" id="adm-save">Save and publish →</button><button class="btn" type="button" id="adm-dup">Duplicate</button><button class="btn adm-danger" type="button" id="adm-del">Delete</button></div><p class="adm-msg mono" id="adm-msg" role="status" aria-live="polite"></p></div>'+
  '</form>';
  const f=$('#adm-f');

  /* counters, auto-growing text boxes, live heading, dirty flag */
  const upCount=el=>{ const c=$('[data-count="'+el.id+'"]',f); if(c){ const n=el.value.length, mx=+c.dataset.max; c.textContent=n+'/'+mx; c.classList.toggle('over',n>mx); } };
  $$('[data-count]',f).forEach(c=>upCount($('#'+c.dataset.count,f)));
  $$('textarea[data-auto]',f).forEach(grow);
  f.addEventListener('input',e=>{
    setDirty(true);
    if(e.target.id&&HINT[e.target.dataset.f]) upCount(e.target);
    if(e.target.matches('textarea[data-auto]')) grow(e.target);
    if(e.target.dataset.f===S.title) $('#adm-h').textContent=e.target.value||'Untitled';
  });
  f.addEventListener('change',()=>setDirty(true));

  const art=$('#art-cv');
  if(art){
    const ta=$('#f-art'), c=art.getContext('2d');
    const rows=()=>ta.value.split('\n').map(r=>r.padEnd(16,'.').slice(0,16)).concat(Array(16).fill('.'.repeat(16))).slice(0,16);
    function paint(){ c.clearRect(0,0,192,192); c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--ink'); rows().forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch==='#') c.fillRect(x*12,y*12,12,12); })); c.strokeStyle='rgba(120,120,120,.3)'; c.beginPath(); for(let i=1;i<16;i++){ c.moveTo(i*12,0); c.lineTo(i*12,192); c.moveTo(0,i*12); c.lineTo(192,i*12); } c.stroke(); }
    art.addEventListener('click',e=>{ const r=art.getBoundingClientRect(), x=Math.floor((e.clientX-r.left)/r.width*16), y=Math.floor((e.clientY-r.top)/r.height*16), rs=rows(); const row=[...rs[y]]; row[x]=row[x]==='#'?'.':'#'; rs[y]=row.join(''); ta.value=rs.join('\n'); setDirty(true); paint(); });
    ta.addEventListener('input',paint); paint();
  }
  const file=$('#adm-file');
  if(file){
    const inp=$('#f-photo'), av=$('#adm-av'); let local='';
    const showAv=()=>{ av.innerHTML=''; const src=local&&inp.value&&inp.value.startsWith('/avatars/')?local:inp.value; if(src){ const im=document.createElement('img'); im.alt=''; im.src=src; av.appendChild(im); } else av.textContent=initialsOf($('#f-name').value); };
    inp.addEventListener('input',()=>{ local=''; showAv(); }); $('#f-name').addEventListener('input',()=>{ if(!inp.value) showAv(); }); showAv();
    $('#adm-photo-rm').addEventListener('click',()=>{ inp.value=''; local=''; showAv(); setDirty(true); });
    file.addEventListener('change',async()=>{
      const pic=file.files[0]; if(!pic) return; msg('Uploading photo…');
      try{ const data=await squareJpeg(pic,160); const d=await api('/api/upload',{method:'POST',body:JSON.stringify({data})}); local=data; inp.value=d.path; showAv(); setDirty(true); msg('Photo uploaded. Press “Save and publish” to attach it to this review.'); }
      catch(ex){ msg(ex.message,true); }
    });
  }
  f.addEventListener('click',e=>{
    if(e.target.id==='pair-add'){ commit(); (item.steps=item.steps||[]).push(['','']); setDirty(true); edit(); }
    const rm=e.target.closest&&e.target.closest('[data-rm]'); if(rm){ commit(); item.steps.splice(+rm.dataset.rm,1); setDirty(true); edit(); }
  });
  $('#adm-dup').addEventListener('click',()=>{
    commit(); const copy=JSON.parse(JSON.stringify(item)), taken=new Set(list.map(i=>i[S.id]));
    if(state.file!=='reviews'){ let id=copy[S.id]+'-copy', n=2; while(taken.has(id)) id=copy[S.id]+'-copy-'+(n++); copy[S.id]=id; }
    if(copy[S.title]) copy[S.title]=copy[S.title]+' (copy)';
    if(state.file==='posts') copy.published=false; if(state.file==='gallery') copy.approved=false; if(state.file==='reviews') copy.published=false;
    list.splice(state.idx+1,0,copy); state.idx++; setDirty(true); state.view='edit'; draw(); msg('Duplicated. Edit it, then save.');
  });
  $('#adm-del').addEventListener('click',async()=>{
    if(!confirm('Delete “'+(item[S.title]||'this item')+'”? It is removed from the site after the next rebuild.')) return;
    list.splice(state.idx,1); state.idx=Math.max(0,state.idx-1); state.view='list'; await save();
  });
  f.addEventListener('submit',async e=>{ e.preventDefault(); commit(); await save(); });
}

async function save(){
  const S=SCHEMAS[state.file], list=state.data[state.file];
  const ids=list.map(i=>i[S.id]);
  if(state.file!=='reviews'){
    if(ids.some(x=>!/^[a-z0-9][a-z0-9-]*$/.test(String(x)))){ msg('Slugs and IDs may only use lowercase letters, numbers and hyphens.',true); return; }
    if(new Set(ids).size!==ids.length){ msg('Two items share the same slug or ID. Make each one unique.',true); return; }
  }
  const btn=$('#adm-save'); if(btn){ btn.disabled=true; btn.textContent='Saving…'; } msg('Saving…');
  try{
    const d=await api('/api/content',{method:'PUT',body:JSON.stringify({file:state.file,data:list,message:'Admin: update '+state.file})});
    setDirty(false); draw(); msg('Saved. The site rebuilds in about a minute.'+(d.url?' Commit: '+d.url:''));
  }catch(ex){ if(btn){ btn.disabled=false; btn.textContent='Save and publish →'; } msg(ex.message,true); }
}
})();
