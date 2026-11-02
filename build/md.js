// Tiny, safe markdown renderer for blog posts: headings, paragraphs, lists, bold, italics, links, code, blockquotes, hr.
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const slugify=s=>String(s).toLowerCase().replace(/<[^>]*>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function inline(s){
  s=esc(s);
  s=s.replace(/`([^`]+)`/g,'<code class="k">$1</code>');
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em class="plain">$2</em>');
  s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,t,u)=>{
    if(!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u)) return t;
    const ext=/^https?:\/\//i.test(u);
    return '<a href="'+u.replace(/"/g,'%22')+'"'+(ext?' target="_blank" rel="noopener noreferrer"':'')+'>'+t+'</a>';
  });
  return s;
}
function render(md){
  const lines=String(md||'').replace(/\r\n?/g,'\n').split('\n'), out=[], toc=[]; let i=0;
  while(i<lines.length){
    const l=lines[i];
    if(!l.trim()){i++;continue}
    let m;
    if((m=l.match(/^(#{2,4})\s+(.+)$/))){ const lv=m[1].length, id=slugify(m[2]); if(lv===2) toc.push([id,m[2].replace(/[*`]/g,'')]); out.push('<h'+lv+' id="'+id+'">'+inline(m[2])+'</h'+lv+'>'); i++; continue; }
    if(/^---+$/.test(l.trim())){ out.push('<hr>'); i++; continue; }
    if(/^>\s?/.test(l)){ const q=[]; while(i<lines.length&&/^>\s?/.test(lines[i])){ q.push(lines[i].replace(/^>\s?/,'')); i++; } out.push('<blockquote>'+inline(q.join(' '))+'</blockquote>'); continue; }
    if(/^\s*[-*]\s+/.test(l)){ const it=[]; while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i])){ it.push('<li>'+inline(lines[i].replace(/^\s*[-*]\s+/,''))+'</li>'); i++; } out.push('<ul>'+it.join('')+'</ul>'); continue; }
    if(/^\s*\d+[.)]\s+/.test(l)){ const it=[]; while(i<lines.length&&/^\s*\d+[.)]\s+/.test(lines[i])){ it.push('<li>'+inline(lines[i].replace(/^\s*\d+[.)]\s+/,''))+'</li>'); i++; } out.push('<ol>'+it.join('')+'</ol>'); continue; }
    const p=[]; while(i<lines.length&&lines[i].trim()&&!/^(#{2,4}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+|---+$)/.test(lines[i])){ p.push(lines[i]); i++; }
    out.push('<p>'+inline(p.join(' '))+'</p>');
  }
  return {html:out.join('\n'),toc};
}
const plain=md=>String(md||'').replace(/[#>*`_-]|\[([^\]]*)\]\([^)]*\)/g,(m,t)=>t||'').replace(/\s+/g,' ').trim();
const readMins=md=>Math.max(1,Math.round(plain(md).split(' ').length/200));
module.exports={render,plain,readMins,slugify};
