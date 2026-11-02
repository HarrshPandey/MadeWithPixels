// Dependency-free 1200x630 social preview images, drawn in the studio's own pixel style (5x7 pixel font) and written as PNG.
const zlib=require('zlib');
const W=1200, H=630;

/* 5x7 pixel font. '#' = on. Rows separated by '/'. */
const G={
' ':'...../...../...../...../...../...../.....',
'A':'.###./#...#/#...#/#####/#...#/#...#/#...#','B':'####./#...#/#...#/####./#...#/#...#/####.','C':'.###./#...#/#..../#..../#..../#...#/.###.',
'D':'####./#...#/#...#/#...#/#...#/#...#/####.','E':'#####/#..../#..../####./#..../#..../#####','F':'#####/#..../#..../####./#..../#..../#....',
'G':'.###./#...#/#..../#.###/#...#/#...#/.###.','H':'#...#/#...#/#...#/#####/#...#/#...#/#...#','I':'.###./..#../..#../..#../..#../..#../.###.',
'J':'..###/...#./...#./...#./...#./#..#./.##..','K':'#...#/#..#./#.#../##.../#.#../#..#./#...#','L':'#..../#..../#..../#..../#..../#..../#####',
'M':'#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#','N':'#...#/##..#/#.#.#/#..##/#...#/#...#/#...#','O':'.###./#...#/#...#/#...#/#...#/#...#/.###.',
'P':'####./#...#/#...#/####./#..../#..../#....','Q':'.###./#...#/#...#/#...#/#.#.#/#..#./.##.#','R':'####./#...#/#...#/####./#.#../#..#./#...#',
'S':'.####/#..../#..../.###./....#/....#/####.','T':'#####/..#../..#../..#../..#../..#../..#..','U':'#...#/#...#/#...#/#...#/#...#/#...#/.###.',
'V':'#...#/#...#/#...#/#...#/#...#/.#.#./..#..','W':'#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#','X':'#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
'Y':'#...#/#...#/.#.#./..#../..#../..#../..#..','Z':'#####/....#/...#./..#../.#.../#..../#####',
'0':'.###./#...#/#..##/#.#.#/##..#/#...#/.###.','1':'..#../.##../..#../..#../..#../..#../.###.','2':'.###./#...#/....#/...#./..#../.#.../#####',
'3':'####./....#/....#/.###./....#/....#/####.','4':'...#./..##./.#.#./#..#./#####/...#./...#.','5':'#####/#..../####./....#/....#/#...#/.###.',
'6':'.###./#..../#..../####./#...#/#...#/.###.','7':'#####/....#/...#./..#../.#.../.#.../.#...','8':'.###./#...#/#...#/.###./#...#/#...#/.###.',
'9':'.###./#...#/#...#/.####/....#/....#/.###.',
'.':'...../...../...../...../...../.##../.##..',',':'...../...../...../...../.##../..#../.#...',':':'...../.##../.##../...../.##../.##../.....',
'-':'...../...../...../#####/...../...../.....','|':'..#../..#../..#../..#../..#../..#../..#..','&':'.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
'?':'.###./#...#/....#/...#./..#../...../..#..','!':'..#../..#../..#../..#../..#../...../..#..',"'":'..#../..#../...../...../...../...../.....',
'/':'....#/....#/...#./..#../.#.../#..../#....','+':'...../..#../..#../#####/..#../..#../.....','(':'...#./..#../.#.../.#.../.#.../..#../...#.',
')':'.#.../..#../...#./...#./...#./..#../.#...'
};
const GLYPH={}; Object.keys(G).forEach(k=>{ GLYPH[k]=G[k].split('/'); });

const C={paper:[239,237,232],ink:[17,17,16],accent:[255,59,0],line:[226,224,218],mute:[107,106,101]};

class Img{
  constructor(){ this.d=Buffer.alloc(W*H*3); this.fill(C.paper); }
  fill(c){ for(let i=0;i<W*H;i++){ this.d[i*3]=c[0]; this.d[i*3+1]=c[1]; this.d[i*3+2]=c[2]; } }
  rect(x,y,w,h,c){ x=Math.max(0,x|0); y=Math.max(0,y|0); const x2=Math.min(W,(x+w)|0), y2=Math.min(H,(y+h)|0); for(let j=y;j<y2;j++){ let o=(j*W+x)*3; for(let i=x;i<x2;i++){ this.d[o++]=c[0]; this.d[o++]=c[1]; this.d[o++]=c[2]; } } }
  text(str,x,y,s,c){ let cx=x; for(const ch of String(str).toUpperCase()){ const g=GLYPH[ch]||GLYPH['?']; for(let r=0;r<7;r++) for(let q=0;q<5;q++) if(g[r][q]==='#') this.rect(cx+q*s,y+r*s,s,s,c); cx+=6*s; } return cx; }
}
const textW=(str,s)=>String(str).length*6*s-s;
function wrap(str,max){ const words=String(str).toUpperCase().split(/\s+/), lines=[]; let cur=''; for(const w of words){ if((cur+' '+w).trim().length>max){ if(cur) lines.push(cur); cur=w; } else cur=(cur+' '+w).trim(); } if(cur) lines.push(cur); return lines; }

function crc32(buf){ let c, crc=0xFFFFFFFF; if(!crc32.t){ crc32.t=[]; for(let n=0;n<256;n++){ c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; crc32.t[n]=c>>>0; } } for(let i=0;i<buf.length;i++) crc=crc32.t[(crc^buf[i])&255]^(crc>>>8); return (crc^0xFFFFFFFF)>>>0; }
function chunk(type,data){ const len=Buffer.alloc(4); len.writeUInt32BE(data.length); const td=Buffer.concat([Buffer.from(type),data]); const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len,td,crc]); }
function png(img){
  const raw=Buffer.alloc((W*3+1)*H); for(let y=0;y<H;y++){ raw[y*(W*3+1)]=0; img.d.copy(raw,y*(W*3+1)+1,y*W*3,(y+1)*W*3); }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4); ihdr[8]=8; ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}

/* opts: title, kicker */
function card(opts){
  const im=new Img(), pad=64;
  for(let x=pad;x<W;x+=120) im.rect(x,0,1,H,C.line);                 // faint grid
  for(let y=pad;y<H;y+=120) im.rect(0,y,W,1,C.line);
  im.rect(24,24,W-48,H-48,C.paper); im.rect(24,24,W-48,2,C.ink); im.rect(24,H-26,W-48,2,C.ink); im.rect(24,24,2,H-48,C.ink); im.rect(W-26,24,2,H-48,C.ink);
  // studio mark (six squares, 3x3)
  const m=[[0,0],[1,0],[0,1],[2,1],[1,2],[2,2]], ms=22, mg=4;
  m.forEach(p=>im.rect(pad+p[0]*(ms+mg),pad+p[1]*(ms+mg),ms,ms,C.ink));
  im.text('MADEOFPIXELS.IN',pad+110,pad+8,4,C.ink);
  im.text(opts.kicker||'WEB DESIGN AGENCY - VASAI & MUMBAI',pad+110,pad+48,3,C.mute);
  // title
  let s=11, lines=wrap(opts.title,Math.floor((W-pad*2)/(6*s)));
  while((lines.length>3||lines.some(l=>textW(l,s)>W-pad*2))&&s>5){ s--; lines=wrap(opts.title,Math.floor((W-pad*2)/(6*s))); }
  const lh=9*s, total=lines.length*lh-2*s, top=Math.max(200,Math.round(H/2-total/2+30));
  lines.forEach((l,i)=>{ const end=im.text(l,pad,top+i*lh,s,C.ink); if(i===lines.length-1) im.rect(end+s,top+i*lh+5*s,s*2,s*2,C.accent); });
  // footer row of squares
  const n=28, sw=Math.floor((W-pad*2)/n);
  for(let i=0;i<n;i++){ const on=((i*7+3)%11)<8; im.rect(pad+i*sw,H-pad-6,sw-6,6,on?C.ink:C.line); }
  im.rect(pad+17*sw,H-pad-6,sw-6,6,C.accent);
  return png(im);
}

/* ---------- app icons: the six-square mark on a solid tile (PNG + ICO) ---------- */
function pngRGBA(w,h,px){
  const raw=Buffer.alloc((w*4+1)*h); for(let y=0;y<h;y++){ raw[y*(w*4+1)]=0; px.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4); }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function iconPng(size,o={}){
  const bg=o.bg||C.paper, fg=o.fg||C.ink, pad=o.pad==null?.17:o.pad, px=Buffer.alloc(size*size*4);
  for(let i=0;i<size*size;i++){ px[i*4]=bg[0]; px[i*4+1]=bg[1]; px[i*4+2]=bg[2]; px[i*4+3]=255; }
  const gap=Math.max(1,Math.round(size/32)), m=Math.round(size*pad), cell=Math.max(1,Math.floor((size-2*m-2*gap)/3)), total=3*cell+2*gap, off=Math.floor((size-total)/2);
  [[0,0],[1,0],[0,1],[2,1],[1,2],[2,2]].forEach(p=>{
    for(let y=0;y<cell;y++) for(let x=0;x<cell;x++){ const X=off+p[0]*(cell+gap)+x, Y=off+p[1]*(cell+gap)+y, k=(Y*size+X)*4; px[k]=fg[0]; px[k+1]=fg[1]; px[k+2]=fg[2]; px[k+3]=255; }
  });
  return pngRGBA(size,size,px);
}
function ico(sizes){
  const pngs=sizes.map(s=>iconPng(s)), head=Buffer.alloc(6); head.writeUInt16LE(0,0); head.writeUInt16LE(1,2); head.writeUInt16LE(sizes.length,4);
  let off=6+16*sizes.length; const ents=sizes.map((s,i)=>{ const e=Buffer.alloc(16); e[0]=s>=256?0:s; e[1]=s>=256?0:s; e.writeUInt16LE(1,4); e.writeUInt16LE(32,6); e.writeUInt32LE(pngs[i].length,8); e.writeUInt32LE(off,12); off+=pngs[i].length; return e; });
  return Buffer.concat([head,...ents,...pngs]);
}
module.exports={card,iconPng,ico};
