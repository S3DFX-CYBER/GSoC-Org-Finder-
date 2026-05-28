const fs=require('node:fs');
const s=fs.readFileSync('index.html','utf8');
const start=s.indexOf('<section id="watchlist"');
if(start===-1){console.error('watchlist start not found'); process.exit(2);}
const endIdx=s.indexOf('</section>', start);
const snippet=s.slice(start, endIdx+10);
const tagRe=/<(\/)?([a-zA-Z0-9-]+)([^>]*)>/g;
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
let m; const stack=[];
let lineOffsets = [0]; s.split('\n').forEach((l,i)=>lineOffsets[i+1]=lineOffsets[i]+l.length+1);
while((m=tagRe.exec(snippet))){
  const isClose=!!m[1];
  const tag=m[2].toLowerCase();
  const rest=m[3];
  const pos=m.index;
  const globalPos=start+pos;
  const line = lineOffsets.findIndex(off=>off>globalPos)-1;
  if(isClose){
    if(stack.length===0){ console.log('Unmatched closing',tag,'at line',line+1); }
    else{
            const top=stack.at(-1);
      if(top.tag===tag){ stack.pop(); }
      else{ console.log('Mismatched closing',tag,'at line',line+1,'expected',top.tag); const idx=stack.map(x=>x.tag).lastIndexOf(tag); if(idx>=0){ stack.splice(idx); } }
    }
  } else {
        const selfClosing = rest.endsWith('/') || voids.has(tag);
    if(!selfClosing){ stack.push({tag,line:line+1}); }
  }
}
if(stack.length){ console.log('Unclosed tags:'); stack.forEach(e=>console.log(e.tag,'opened at line',e.line)); process.exit(1);} else { console.log('All tags closed in snippet'); process.exit(0);}