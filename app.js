// ══════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════
(function(){
  const saved=localStorage.getItem('gaf_theme')||'light';
  document.documentElement.setAttribute('data-theme',saved);
  updateThemeLabel(saved);
})();
function toggleTheme(){
  const h=document.documentElement,cur=h.getAttribute('data-theme'),next=cur==='light'?'dark':'light';
  h.setAttribute('data-theme',next);localStorage.setItem('gaf_theme',next);updateThemeLabel(next);
}
function updateThemeLabel(t){const l=document.getElementById('themeLabel');if(l)l.textContent=t==='dark'?'Dark':'Light';}

// ══════════════════════════════════════════════
// COUNTDOWN
// ══════════════════════════════════════════════
const OPEN_DATE=new Date('2026-03-16T00:00:00Z');
const CLOSE_DATE=new Date('2026-04-08T18:00:00Z');
function updateCountdown(){
  const now=Date.now();
  const banner=document.getElementById('countdownBanner');
  const sub=document.getElementById('countdownSub');
  let target=OPEN_DATE.getTime();
  let label='📅 GSoC 2026 Applications Open In';
  let subText='Until March 16, 2026';
  if(now>=OPEN_DATE.getTime()&&now<CLOSE_DATE.getTime()){
    target=CLOSE_DATE.getTime();
    label='🚀 Applications Are Open — Closes In';
    subText='Until April 8, 2026';
    banner.style.background='linear-gradient(135deg,rgba(0,135,90,.07),rgba(0,135,90,.12))';
    banner.style.borderBottomColor='rgba(0,135,90,.3)';
    banner.style.color='var(--green)';
  } else if(now>=CLOSE_DATE.getTime()){
    banner.innerHTML='<span>🎉 GSoC 2026 applications have closed. Stay tuned for accepted orgs!</span>';
    clearInterval(cdTimer);return;
  }
  const diff=Math.max(0,target-now);
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  const s=Math.floor((diff%60000)/1000);
  document.getElementById('cdDays').textContent=String(d).padStart(2,'0');
  document.getElementById('cdHours').textContent=String(h).padStart(2,'0');
  document.getElementById('cdMins').textContent=String(m).padStart(2,'0');
  document.getElementById('cdSecs').textContent=String(s).padStart(2,'0');
  sub.textContent=subText;
  banner.querySelector('.countdown-label').textContent=label;
}
updateCountdown();
const cdTimer=setInterval(updateCountdown,1000);

// ══════════════════════════════════════════════
// ANALYTICS ENGINE
// ══════════════════════════════════════════════
const AN={
  g(k,d){try{return JSON.parse(localStorage.getItem('gaf_'+k))??d}catch{return d}},
  s(k,v){try{localStorage.setItem('gaf_'+k,JSON.stringify(v))}catch{}},
  inc(k){this.s(k,(this.g(k,0)+1))},
  push(k,v,max=20){const a=this.g(k,[]);a.unshift(v);this.s(k,a.slice(0,max))},
  today(){return new Date().toISOString().slice(0,10)},
  trackVisit(){
    this.inc('total');
    const td=this.today(),daily=this.g('daily',{});
    daily[td]=(daily[td]||0)+1;this.s('daily',daily);
    if(!sessionStorage.getItem('gaf_s'))sessionStorage.setItem('gaf_s',Date.now());
  },
  trackSearch(t){if(t.length>1){this.inc('searches');this.push('sterms',t.toLowerCase().trim())}},
  trackCat(c){if(c){this.inc('filters');const cf=this.g('cats',{});cf[c]=(cf[c]||0)+1;this.s('cats',cf)}},
  trackOrg(n){this.inc('views');const oc=this.g('orgs',{});oc[n]=(oc[n]||0)+1;this.s('orgs',oc)},
  todayVisits(){return this.g('daily',{})[this.today()]||0},
  sessionTime(){
    const s=sessionStorage.getItem('gaf_s');if(!s)return'—';
    const sec=Math.floor((Date.now()-parseInt(s))/1000);
    return sec<60?sec+'s':Math.floor(sec/60)+'m'+(sec%60)+'s';
  },
  topCats(){return Object.entries(this.g('cats',{})).sort((a,b)=>b[1]-a[1]).slice(0,6)},
  topOrgs(){return Object.entries(this.g('orgs',{})).sort((a,b)=>b[1]-a[1]).slice(0,5)},
  topTerms(){const f={};this.g('sterms',[]).forEach(t=>{f[t]=(f[t]||0)+1});return Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,12)}
};
AN.trackVisit();

// ══════════════════════════════════════════════
// TRENDING
// ══════════════════════════════════════════════
function renderTrending(){
  const top=AN.topOrgs();
  const sec=document.getElementById('trendingSection');
  const scroll=document.getElementById('trendingScroll');
  if(!top.length){sec.style.display='none';return;}
  sec.style.display='block';
  scroll.innerHTML=top.map(([name,views],i)=>{
    const o=ORGS.find(x=>x.name===name);
    if(!o)return'';
    return`<div class="trend-card" onclick="openModal(${ORGS.indexOf(o)})">
      <div class="trend-rank">${i+1}</div>
      <div class="trend-info">
        <div class="trend-name">${name}</div>
        <div class="trend-views">${views} view${views!==1?'s':''} · ${catLabel(o.cat)}</div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
// ANALYTICS PANEL
// ══════════════════════════════════════════════
function openAnalytics(){
  document.getElementById('aTot').textContent=AN.g('total',0).toLocaleString();
  document.getElementById('aToday').textContent=AN.todayVisits();
  document.getElementById('aSearches').textContent=AN.g('searches',0);
  document.getElementById('aViews').textContent=AN.g('views',0);
  document.getElementById('aFilters').textContent=AN.g('filters',0);
  document.getElementById('aTime').textContent=AN.sessionTime();
  const tc=AN.topCats(),mx=tc[0]?.[1]||1;
  document.getElementById('catChart').innerHTML=tc.length
    ?tc.map(([c,n])=>`<div class="bar-row"><span class="bar-lbl">${catLabel(c)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n/mx*100)}%"></div></div><span class="bar-val">${n}</span></div>`).join('')
    :'<span style="color:var(--muted);font-size:12px">Use category filters to track data</span>';
  const to=AN.topOrgs(),mo=to[0]?.[1]||1;
  document.getElementById('orgChart').innerHTML=to.length
    ?to.map(([o,n])=>`<div class="bar-row"><span class="bar-lbl" style="font-size:10px">${o.length>16?o.slice(0,16)+'…':o}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n/mo*100)}%"></div></div><span class="bar-val">${n}</span></div>`).join('')
    :'<span style="color:var(--muted);font-size:12px">Click org cards to track views</span>';
  const tt=AN.topTerms();
  document.getElementById('srchTerms').innerHTML=tt.length
    ?tt.map(([t,c],i)=>`<span class="sch ${i<3?'hot':''}">${t} (${c})</span>`).join('')
    :'<span style="color:var(--muted);font-size:12px">No searches yet</span>';
  document.getElementById('anBg').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeAnEvent(e){if(e.target===document.getElementById('anBg'))closeAn()}
function closeAn(){document.getElementById('anBg').classList.remove('open');document.body.style.overflow=''}

// ══════════════════════════════════════════════
// GITHUB API
// ══════════════════════════════════════════════
const API='/api/github';
let cache=JSON.parse(localStorage.getItem('gaf_ghc')||'{}');
let modalIdx=-1,pills=new Set(),chips=new Set(),fetching=false,lastSearch='';
let filteredOrgs=[]; // for keyboard nav
let focusedIdx=-1;

async function checkAPI(){
  try{
    const r=await fetch(`${API}?repo=django/django`);
    const banner=document.getElementById('apiBanner');
    if(r.ok){
      banner.className='api-banner api-ok';
      document.getElementById('apiStrong').textContent='✓ GitHub API Connected';
      document.getElementById('apiText').textContent='Live stats (stars, forks, good first issues) available for all visitors.';
      document.getElementById('fetchBtn').style.display='flex';
    }else{
      banner.className='api-banner api-warn';
      document.getElementById('apiStrong').textContent='⚠ API Error';
      document.getElementById('apiText').textContent='Add GITHUB_TOKEN in Vercel dashboard and redeploy.';
    }
  }catch{
    document.getElementById('apiStrong').textContent='○ Running Locally';
    document.getElementById('apiText').textContent='Deploy to Vercel for live GitHub stats.';
  }
}

async function fetchGH(repo){
  if(!repo)return null;
  if(cache[repo]&&Date.now()-cache[repo].ts<3600000)return cache[repo];
  try{
    const r=await fetch(`${API}?repo=${encodeURIComponent(repo)}`);
    if(!r.ok)return null;
    const d=await r.json();
    if(d.error)return null;
    cache[repo]=d;localStorage.setItem('gaf_ghc',JSON.stringify(cache));return d;
  }catch{return null}
}

async function fetchGFI(repo){
  if(!repo)return null;
  const cacheKey=repo+'__gfi';
  const hit=cache[cacheKey];
  if(hit&&Date.now()-hit.ts<3600000&&hit.count!=null)return hit.count;
  try{
    const r=await fetch(`${API}?repo=${encodeURIComponent(repo)}&gfi=1`);
    if(!r.ok)return null;
    const d=await r.json();
    if(d.gfi==null)return null;
    cache[cacheKey]={count:d.gfi,ts:Date.now()};
    localStorage.setItem('gaf_ghc',JSON.stringify(cache));
    return d.gfi;
  }catch{return null}
}

async function fetchAll(){
  if(fetching)return; fetching=true;
  const spin=document.getElementById('fetchSpin'),txt=document.getElementById('fetchTxt'),btn=document.getElementById('fetchBtn');
  spin.style.display='block';btn.disabled=true;
  let done=0;
  for(const o of ORGS){
    if(o.github){
      txt.textContent=`${++done}/${ORGS.length}…`;
      const d=await fetchGH(o.github);if(d)o._gh=d;
      await new Promise(r=>setTimeout(r,85));
    }
  }
  spin.style.display='none';btn.disabled=false;txt.textContent='✓ Done';fetching=false;
  applyFilters();updateStats();
}

async function fetchModalGH(){
  const o=ORGS[modalIdx];if(!o?.github)return;
  document.getElementById('mFetchBtn').textContent='Loading…';
  delete cache[o.github];
  delete cache[o.github+'__gfi'];
  const d=await fetchGH(o.github);
  if(d){
    o._gh=d;
    document.getElementById('ghStars').textContent=fmt(d.stars);
    document.getElementById('ghForks').textContent=fmt(d.forks);
    document.getElementById('ghIssues').textContent=fmt(d.issues);
    document.getElementById('ghCommit').textContent=d.lastCommit;
    document.getElementById('mFetchBtn').textContent='↻ Refresh';
    document.getElementById('ghGFI').textContent='…';
    const gfi=await fetchGFI(o.github);
    const gfiTxt=gfi!==null?fmt(gfi):'—';
    document.getElementById('ghGFI').textContent=gfiTxt;
    if(gfi!==null){
      o._gh.gfi=gfi;
      const cells=document.getElementById('mMetrics')?.querySelectorAll('.mv');
      if(cells&&cells[3])cells[3].textContent=gfiTxt;
    }
    applyFilters();
    renderCompareTable();
  }else document.getElementById('mFetchBtn').textContent='✗ Failed';
}

function fmt(n){return(!n&&n!==0)?'—':n>=1000?(n/1000).toFixed(1)+'k':String(n)}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function yCls(y){return y>=8?'veteran':y>=4?'experienced':'newcomer'}
function yLbl(y){return y>=8?'🏆 Veteran':y>=4?'⭐ Experienced':'🌱 Newcomer'}
function yBdg(y){return y>=8?'bv':y>=4?'be':'bn'}
function cLbl(c){return c==='hot'?'🔥 High':c==='moderate'?'🟡 Moderate':'😎 Low'}
function cBdg(c){return c==='hot'?'bh':c==='moderate'?'bm':'bc'}
function aLbl(a){return a==='active'?'⚡ Active':a==='moderate'?'📊 Moderate':a==='low'?'💤 Low':'○ —'}
function aBdg(a){return a==='active'?'bac':a==='moderate'?'bam':a==='low'?'bal':'bna'}
function catLabel(c){return{science:'Science',programming:'Programming',data:'Data',web:'Web',os:'OS',security:'Security',media:'Media',infra:'Infra',ai:'AI',dev:'Dev Tools',other:'Other'}[c]||c}
function catBdg(c){return'cb-'+(c||'other')}

// ══════════════════════════════════════════════
// COMPARE
// ══════════════════════════════════════════════
let compareSet=new Set(); // stores ORGS indices

function toggleCompare(idx,e){
  if(e){e.stopPropagation();}
  if(compareSet.has(idx)){
    compareSet.delete(idx);
  } else {
    if(compareSet.size>=3){showCompareToast('Max 3 orgs for comparison');return;}
    compareSet.add(idx);
  }
  updateCompareBadge();
  renderGrid(filteredOrgs); // refresh cards
  renderCompareTable();
}

function toggleCompareFromModal(){
  if(modalIdx<0)return;
  toggleCompare(modalIdx,null);
  updateModalCompareBtn();
}

function updateModalCompareBtn(){
  const btn=document.getElementById('mCompareBtn');
  if(!btn)return;
  const inSet=compareSet.has(modalIdx);
  btn.classList.toggle('active',inSet);
  btn.title=inSet?'Remove from compare':'Add to compare';
  btn.textContent=inSet?'✓⚖':'⚖️';
}

function updateCompareBadge(){
  const badge=document.getElementById('compareBadge');
  badge.textContent=compareSet.size;
  badge.classList.toggle('show',compareSet.size>0);
}

function openCompare(){
  renderCompareSlots();
  renderCompareTable();
  document.getElementById('compareBg').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCompare(){document.getElementById('compareBg').classList.remove('open');document.body.style.overflow='';}
function closeCompareEv(e){if(e.target===document.getElementById('compareBg'))closeCompare();}

function renderCompareSlots(){
  const arr=[...compareSet].map(i=>ORGS[i]);
  const slots=document.getElementById('compareSlots');
  let html='';
  for(let i=0;i<3;i++){
    const o=arr[i];
    if(o){
      const idx=ORGS.indexOf(o);
      html+=`<div class="compare-slot filled">
        <span class="slot-cat ${catBdg(o.cat)}">${catLabel(o.cat)}</span>
        <span class="slot-name">${o.name}</span>
        <button class="slot-remove" onclick="toggleCompare(${idx},null);renderCompareSlots();renderCompareTable();">✕ Remove</button>
      </div>`;
    } else {
      html+=`<div class="compare-slot"><span class="slot-empty">+ Add org</span><span style="font-size:10px;color:var(--muted)">Click ⚖️ on any card</span></div>`;
    }
  }
  slots.innerHTML=html;
}

function renderCompareTable(){
  renderCompareSlots();
  const arr=[...compareSet].map(i=>ORGS[i]);
  const wrap=document.getElementById('compareTableWrap');
  if(arr.length<2){
    wrap.innerHTML=`<div class="compare-hint">Select at least 2 organizations using the ⚖️ button on cards to compare them here.</div>`;
    return;
  }

  const compScore={hot:3,moderate:2,chill:1};
  const rows=[
    {label:'Category',    vals:arr.map(o=>catLabel(o.cat)), type:'text'},
    {label:'GSoC Years',  vals:arr.map(o=>o.years), type:'bar', max:11, best:'high'},
    {label:'Since',       vals:arr.map(o=>o.firstYear), type:'text'},
    {label:'Competition', vals:arr.map(o=>cLbl(o.competition)), scores:arr.map(o=>compScore[o.competition]), type:'scored', best:'low'},
    {label:'Stars ⭐',     vals:arr.map(o=>o._gh?fmt(o._gh.stars):'—'), scores:arr.map(o=>o._gh?.stars||0), type:'scored', best:'high'},
    {label:'Forks',       vals:arr.map(o=>o._gh?fmt(o._gh.forks):'—'), scores:arr.map(o=>o._gh?.forks||0), type:'scored', best:'high'},
    {label:'Open Issues', vals:arr.map(o=>o._gh?fmt(o._gh.issues):'—'), scores:arr.map(o=>o._gh?.issues||0), type:'scored', best:'low'},
    {label:'Last Commit', vals:arr.map(o=>o._gh?o._gh.lastCommit:'—'), type:'text'},
    {label:'Good 1st Issues', vals:arr.map(o=>o._gh?.gfi!=null?fmt(o._gh.gfi):'—'), scores:arr.map(o=>o._gh?.gfi||0), type:'scored', best:'high'},
    {label:'Languages',   vals:arr.map(o=>o.tags.slice(0,3).join(', ')), type:'text'},
  ];

  let thead=`<tr><th>Metric</th>${arr.map(o=>`<th>${o.name.length>22?o.name.slice(0,22)+'…':o.name}</th>`).join('')}</tr>`;
  let tbody='';
  for(const row of rows){
    let cells='';
    if(row.type==='bar'){
      const mx=Math.max(...row.vals);
      cells=row.vals.map((v,i)=>{
        const pct=mx>0?Math.round(v/mx*100):0;
        return`<td><div class="cmp-bar-wrap"><div class="cmp-bar-track"><div class="cmp-bar-fill" style="width:${pct}%"></div></div><span class="cmp-val">${v}y</span></div></td>`;
      }).join('');
    } else if(row.type==='scored'&&row.scores&&row.scores.some(s=>s>0)){
      const mx=Math.max(...row.scores),mn=Math.min(...row.scores.filter(s=>s>0)||[0]);
      cells=row.vals.map((v,i)=>{
        const s=row.scores[i];
        let cls='cmp-val';
        if(s>0){
          cls=row.best==='high'?(s===mx?'cmp-best':s===mn?'cmp-worst':'cmp-val'):(s===mn?'cmp-best':s===mx?'cmp-worst':'cmp-val');
        }
        return`<td class="${cls}">${v}</td>`;
      }).join('');
    } else {
      cells=row.vals.map(v=>`<td class="cmp-val">${v}</td>`).join('');
    }
    tbody+=`<tr><td class="row-label">${row.label}</td>${cells}</tr>`;
  }
  wrap.innerHTML=`<table class="compare-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <p style="font-size:10px;color:var(--muted);margin-top:10px;text-align:right">🟢 Best value &nbsp; 🔴 Lowest value &nbsp; (requires GitHub stats to be fetched)</p>`;
}

function showCompareToast(msg){
  let t=document.getElementById('compareToast');
  if(!t){t=document.createElement('div');t.id='compareToast';t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;z-index:999;transition:opacity .3s;white-space:nowrap';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  setTimeout(()=>t.style.opacity='0',2200);
}

// ══════════════════════════════════════════════
// FILTER & RENDER
// ══════════════════════════════════════════════
function applyFilters(){
  const search=document.getElementById('searchInput').value.trim().toLowerCase();
  const cat=document.getElementById('catFilter').value;
  const lang=document.getElementById('langFilter').value.toLowerCase();
  const yearsF=document.getElementById('yearsFilter').value;
  const compF=document.getElementById('compFilter').value;
  const sort=document.getElementById('sortSelect').value;

  if(search!==lastSearch&&search.length>1){AN.trackSearch(search);lastSearch=search}
  if(cat)AN.trackCat(cat);

  let res=ORGS.filter(o=>{
    const txt=(o.name+' '+o.tags.join(' ')+' '+o.desc).toLowerCase();
    if(cat&&o.cat!==cat)return false;
    if(lang&&!txt.includes(lang))return false;
    if(search&&!txt.includes(search))return false;
    if(yearsF){const yc=yCls(o.years);if(yearsF!==yc)return false}
    if(compF&&o.competition!==compF)return false;
    if(pills.size>0){let m=false;pills.forEach(p=>{if(txt.includes(p))m=true});if(!m)return false}
    if(chips.has('veteran')&&yCls(o.years)!=='veteran')return false;
    if(chips.has('newcomer')&&yCls(o.years)!=='newcomer')return false;
    if(chips.has('hot')&&o.competition!=='hot')return false;
    if(chips.has('chill')&&o.competition!=='chill')return false;
    if(chips.has('active')&&(!o._gh||o._gh.activity!=='active'))return false;
    return true;
  });

  if(sort==='alpha')res.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==='years-desc')res.sort((a,b)=>b.years-a.years);
  else if(sort==='years-asc')res.sort((a,b)=>a.years-b.years);
  else if(sort==='comp-low')res.sort((a,b)=>['chill','moderate','hot'].indexOf(a.competition)-['chill','moderate','hot'].indexOf(b.competition));
  else if(sort==='stars')res.sort((a,b)=>(b._gh?.stars||0)-(a._gh?.stars||0));
  else if(sort==='gfi')res.sort((a,b)=>(b._gh?.gfi||0)-(a._gh?.gfi||0));

  filteredOrgs=res;
  focusedIdx=-1;
  renderGrid(res);
  document.getElementById('countDisplay').textContent=res.length;
  document.getElementById('filteredStat').textContent=res.length;
}

// Umbrella orgs: link goes to org page, not a single example repo
// Single-project orgs: link goes to that specific repo
const UMBRELLA_ORGS=new Set([
  'Apache Software Foundation','CNCF','Eclipse Foundation','FOSSASIA','GNOME Foundation',
  'GNU Project','Jenkins','KDE Community','NumFOCUS','OpenMRS','openSUSE Project',
  'OWASP Foundation','The Linux Foundation','Wikimedia Foundation','AOSSIE','CERN-HSF',
  'CCExtractor Development','Blender Foundation','Open Robotics','JBoss Community',
  'The Honeynet Project','MetaBrainz Foundation Inc','OSGeo (Open Source Geospatial Foundation)',
  'SW360','DBpedia','LibreOffice','Oppia Foundation','Sugar Labs','Internet Archive',
  'VideoLAN','JdeRobot','Kubeflow','INCF','OpenAstronomy','Machine Learning for Science (ML4SCI)',
  'SageMath','National Resource for Network Biology (NRNB)','FOSSology','JabRef e.V.',
  'FOSSASIA','LabLua','Liquid Galaxy project','Free and Open Source Silicon Foundation',
]);

function orgLogoOwner(o){
  if(!o.github)return'';
  return o.github.includes('/')?o.github.split('/')[0]:o.github;
}
function imgErr(img){
  img.onerror=null;
  const p=document.createElement('div');
  p.className='org-logo-placeholder';
  p.textContent=(img.alt||'?')[0].toUpperCase();
  img.parentNode.replaceChild(p,img);
}
function orgLogo(o){
  const owner=orgLogoOwner(o);
  if(!owner)return'';
  // Use avatars.githubusercontent.com — no redirect, works cross-origin
  return`https://github.com/${owner}.png?size=64`;
}
function repoUrl(o){
  if(!o.github)return'';
  const owner=o.github.includes('/')?o.github.split('/')[0]:o.github;
  // Umbrella orgs → link to their org page; single-project orgs → their specific repo
  if(UMBRELLA_ORGS.has(o.name)||!o.github.includes('/'))
    return`https://github.com/${owner}`;
  return`https://github.com/${o.github}`;
}
function repoLinkLabel(o){
  if(!o.github)return'';
  const owner=o.github.includes('/')?o.github.split('/')[0]:o.github;
  if(UMBRELLA_ORGS.has(o.name)||!o.github.includes('/'))
    return owner+' (org)';
  return o.github;
}

function renderGrid(orgs){
  const g=document.getElementById('orgGrid');
  if(!orgs.length){g.innerHTML=`<div class="empty"><div class="empty-icon">🔍</div><h3>No matches found</h3><p>Try removing some filters.</p></div>`;return}
  g.innerHTML=orgs.map((o,i)=>{
    const act=o._gh?.activity||null;
    const tags=o.tags.slice(0,5).map(t=>`<span class="tag">${t}</span>`).join('');
    const ghm=o._gh?`<div class="gh-mini">
      <span class="gh-s">⭐ <b>${fmt(o._gh.stars)}</b></span>
      <span class="gh-s">🍴 <b>${fmt(o._gh.forks)}</b></span>
      ${o._gh.gfi!=null?`<span class="gh-s">🟢 <b>${fmt(o._gh.gfi)} GFI</b></span>`:''}
      <span class="gh-s">🕐 <b>${o._gh.lastCommit}</b></span>
    </div>`:'';
    const globalIdx=ORGS.indexOf(o);
    const inCompare=compareSet.has(globalIdx);
    const isFocused=focusedIdx===i;
    const logo=orgLogo(o);
    const repoHref=repoUrl(o);
    // shortRepo now handled by repoLinkLabel()
    return`<div class="org-card${inCompare?' in-compare':''}${isFocused?' focused':''}" 
      
      onclick="openModal(${globalIdx})"
      data-filtered-idx="${i}"
      tabindex="0">
      <div class="card-header-row">
        ${logo?`<img class="org-logo" src="${logo}" alt="${o.name[0]}" loading="lazy" onerror="imgErr(this)">`:``}
        <div class="org-logo-info">
          <div class="card-top-line">
            <div class="org-name">${o.name}</div>
            <div class="card-actions">
              <button class="btn-card-compare${inCompare?' active':''}" onclick="toggleCompare(${globalIdx},event)" title="${inCompare?'Remove from compare':'Add to compare'}">⚖</button>
              <span class="cat-pill ${catBdg(o.cat)}">${catLabel(o.cat)}</span>
            </div>
          </div>
          ${repoHref?`<a class="card-repo-link" href="${repoHref}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="${repoHref}">
            ${UMBRELLA_ORGS.has(o.name)||!o.github.includes('/')?
              '<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>':
              '<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.087 2.912.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>'}
            ${repoLinkLabel(o)}
          </a>`:''}
        </div>
      </div>
      <div class="org-desc">${o.desc}</div>
      <div class="badges">
        <span class="b ${yBdg(o.years)}">${yLbl(o.years)} · ${o.years}y</span>
        <span class="b ${cBdg(o.competition)}">${cLbl(o.competition)}</span>
        <span class="b ${aBdg(act)}">${aLbl(act)}</span>
        ${o._gh?.gfi>0?`<span class="b bgfi">🟢 ${o._gh.gfi} GFI</span>`:''}
      </div>
      <div class="tags">${tags}</div>
      ${ghm}
    </div>`;
  }).join('');
}

function updateStats(){
  document.getElementById('totalStat').textContent=ORGS.length;
  document.getElementById('veteranStat').textContent=ORGS.filter(o=>o.years>=8).length;
  document.getElementById('newcomerStat').textContent=ORGS.filter(o=>o.years<=3).length;
  document.getElementById('visitorStat').textContent=AN.todayVisits();
}

// ══════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ══════════════════════════════════════════════
const GRID_COLS=()=>{
  const g=document.getElementById('orgGrid');
  if(!g||!g.children.length)return 3;
  const firstRect=g.children[0].getBoundingClientRect();
  let cols=1;
  for(let i=1;i<g.children.length;i++){
    if(Math.abs(g.children[i].getBoundingClientRect().top-firstRect.top)<5)cols++;
    else break;
  }
  return cols;
};

document.addEventListener('keydown',e=>{
  // Close modals first
  if(e.key==='Escape'){
    if(document.getElementById('modalBg').classList.contains('open')){closeModal();return;}
    if(document.getElementById('compareBg').classList.contains('open')){closeCompare();return;}
    if(document.getElementById('anBg').classList.contains('open')){closeAn();return;}
  }
  // Don't hijack when typing in inputs
  if(document.activeElement&&['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;
  const n=filteredOrgs.length;
  if(!n)return;
  const cols=GRID_COLS();
  if(e.key==='ArrowRight'){
    e.preventDefault();
    focusedIdx=Math.min(focusedIdx+1,n-1);
    if(focusedIdx<0)focusedIdx=0;
    scrollToFocused();renderGrid(filteredOrgs);
  } else if(e.key==='ArrowLeft'){
    e.preventDefault();
    focusedIdx=Math.max(focusedIdx-1,0);
    if(focusedIdx<0)focusedIdx=0;
    scrollToFocused();renderGrid(filteredOrgs);
  } else if(e.key==='ArrowDown'){
    e.preventDefault();
    if(focusedIdx<0)focusedIdx=0;
    else focusedIdx=Math.min(focusedIdx+cols,n-1);
    scrollToFocused();renderGrid(filteredOrgs);
  } else if(e.key==='ArrowUp'){
    e.preventDefault();
    if(focusedIdx<0)focusedIdx=0;
    else focusedIdx=Math.max(focusedIdx-cols,0);
    scrollToFocused();renderGrid(filteredOrgs);
  } else if(e.key==='Enter'&&focusedIdx>=0&&focusedIdx<n){
    openModal(ORGS.indexOf(filteredOrgs[focusedIdx]));
  } else if((e.key==='c'||e.key==='C')&&focusedIdx>=0&&focusedIdx<n){
    e.preventDefault();
    toggleCompare(ORGS.indexOf(filteredOrgs[focusedIdx]),null);
  }
});

function scrollToFocused(){
  setTimeout(()=>{
    const g=document.getElementById('orgGrid');
    const card=g?.querySelector(`[data-filtered-idx="${focusedIdx}"]`);
    if(card)card.scrollIntoView({block:'nearest',behavior:'smooth'});
  },30);
}

// ══════════════════════════════════════════════
// PILLS & CHIPS
// ══════════════════════════════════════════════
function togglePill(el){
  const l=el.dataset.lang;el.classList.toggle('active');
  if(el.classList.contains('active'))pills.add(l);else pills.delete(l);
  applyFilters();
}
const chipCls={veteran:'cv',newcomer:'cn',hot:'ch',chill:'cc',active:'ca'};
function toggleChip(k){
  const el=document.getElementById('chip-'+k);
  if(chips.has(k)){chips.delete(k);el.className='chip'}
  else{chips.add(k);el.className='chip '+chipCls[k]}
  applyFilters();
}
function resetFilters(){
  ['searchInput','catFilter','langFilter','yearsFilter','compFilter'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  document.getElementById('sortSelect').value='alpha';
  pills.clear();chips.clear();
  document.querySelectorAll('.pill.active').forEach(p=>p.classList.remove('active'));
  Object.keys(chipCls).forEach(k=>{const e=document.getElementById('chip-'+k);if(e)e.className='chip'});
  applyFilters();
}

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function openModal(idx){
  const o=ORGS[idx];modalIdx=idx;AN.trackOrg(o.name);
  document.getElementById('mCat').innerHTML=`<span class="cat-pill ${catBdg(o.cat)}">${catLabel(o.cat)}</span>`;
  document.getElementById('mName').textContent=o.name;
  document.getElementById('mDesc').textContent=o.desc;
  const cc={hot:'var(--red)',moderate:'#92600A',chill:'var(--green)'};
  document.getElementById('mMetrics').innerHTML=`
    <div class="mc"><div class="mv" style="color:${o.years>=8?'#C2410C':o.years>=4?'var(--blue)':'var(--purple)'}">${o.years}</div>
    <div class="ml">GSoC Years</div><div class="prog"><div class="prog-fill" style="width:${Math.min(o.years/11*100,100)}%;background:${o.years>=8?'#C2410C':o.years>=4?'var(--blue)':'var(--purple)'}"></div></div></div>
    <div class="mc"><div class="mv" style="color:${cc[o.competition]}">${o.competition==='hot'?'🔥':o.competition==='moderate'?'🟡':'😎'}</div><div class="ml">${cLbl(o.competition)}</div></div>
    <div class="mc"><div class="mv" style="color:var(--orange)">${o.firstYear}</div><div class="ml">First Year</div></div>
    <div class="mc"><div class="mv" style="color:var(--green)">${o._gh?.gfi!=null?fmt(o._gh.gfi):'—'}</div><div class="ml">Good 1st Issues</div></div>`;
  const gh=o._gh;
  document.getElementById('ghStars').textContent=gh?fmt(gh.stars):'—';
  document.getElementById('ghForks').textContent=gh?fmt(gh.forks):'—';
  document.getElementById('ghIssues').textContent=gh?fmt(gh.issues):'—';
  document.getElementById('ghCommit').textContent=gh?gh.lastCommit:'—';
  document.getElementById('ghGFI').textContent=gh?.gfi!=null?fmt(gh.gfi):'—';
  document.getElementById('mFetchBtn').textContent=gh?'↻ Refresh':'Fetch Live Data';
  document.getElementById('mTags').innerHTML=o.tags.map(t=>`<span class="m-tag">${t}</span>`).join('');
  document.getElementById('mFit').innerHTML=o.fit.map(f=>`<span class="m-tag">${f}</span>`).join('');
  let tl='';
  for(let y=o.firstYear;y<=2026;y++){
    const cur=y===2026;
    tl+=`<span style="margin-right:10px;color:${cur?'var(--orange)':'var(--ink3)'};font-weight:${cur?700:400}">${cur?'⭐':'✓'} ${y}</span>`;
  }
  document.getElementById('mTimeline').innerHTML=tl;
  // Smart link: umbrella orgs → org page, single-project → specific repo
  const mLinkEl=document.getElementById('mLink');
  if(mLinkEl&&o.github){
    const owner=o.github.includes('/')?o.github.split('/')[0]:o.github;
    const isUmbrella=UMBRELLA_ORGS.has(o.name)||!o.github.includes('/');
    mLinkEl.href=isUmbrella?`https://github.com/${owner}`:`https://github.com/${o.github}`;
    mLinkEl.textContent=isUmbrella?'View GitHub Org →':'View Repository →';
  }
  updateModalCompareBtn();
  document.getElementById('modalBg').classList.add('open');
  document.body.style.overflow='hidden';
  // Fetch GFI lazily on modal open
  if(o.github&&(!o._gh||o._gh.gfi==null)){
    document.getElementById('ghGFI').textContent='…';
    fetchGFI(o.github).then(gfi=>{
      if(gfi!==null){
        if(!o._gh)o._gh={};
        o._gh.gfi=gfi;
        document.getElementById('ghGFI').textContent=fmt(gfi);
        const cells=document.getElementById('mMetrics')?.querySelectorAll('.mv');
        if(cells&&cells[3])cells[3].textContent=fmt(gfi);
        renderGrid(filteredOrgs);
        renderCompareTable();
      }else{
        document.getElementById('ghGFI').textContent='—';
      }
    });
  }
}
function closeModalEv(e){if(e.target===document.getElementById('modalBg'))closeModal()}
function closeModal(){document.getElementById('modalBg').classList.remove('open');document.body.style.overflow='';modalIdx=-1;}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// ISSUES PAGE
// ══════════════════════════════════════════════
let allIssues=[];        // flat list of {title,url,org,orgCat,orgTags,logo,repo,created_at}
let filteredIssues=[];
let shownIssues=0;
const ISSUES_PAGE_SIZE=40;
let issuesFetching=false;

function openIssuesPage(){
  document.getElementById('issuesPage').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeIssuesPage(){
  document.getElementById('issuesPage').classList.remove('open');
  document.body.style.overflow='';
}

async function fetchAllIssues(){
  if(issuesFetching)return;
  issuesFetching=true;
  const btn=document.getElementById('fetchIssuesBtn');
  const spin=document.getElementById('fetchIssuesSpin');
  const txt=document.getElementById('fetchIssuesTxt');
  btn.disabled=true; spin.style.display='inline-block';

  allIssues=[];
  const orgsWithGithub=ORGS.filter(o=>o.github);
  let done=0;
  let found=0;

  document.getElementById('issuesContainer').innerHTML=`
    <div class="fetch-progress">
      <div style="font-size:14px;font-weight:600;color:var(--ink)">Fetching Good First Issues…</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px" id="fpStatus">Checking 0 / ${orgsWithGithub.length} orgs</div>
      <div class="fp-bar-wrap"><div class="fp-bar" id="fpBar" style="width:0%"></div></div>
      <div style="font-size:11px;color:var(--green);margin-top:8px;font-weight:600" id="fpFound">0 issues found so far</div>
    </div>`;

  // Batch in groups of 5 to avoid hammering the proxy
  const BATCH=5;
  for(let i=0;i<orgsWithGithub.length;i+=BATCH){
    const batch=orgsWithGithub.slice(i,i+BATCH);
    await Promise.all(batch.map(async o=>{
      try{
        const r=await fetch(`${API}?repo=${encodeURIComponent(o.github)}&gfi=1&issues=1`);
        if(!r.ok)return;
        const data=await r.json();
        if(data.items?.length){
          const owner=o.github.split('/')[0];
          const logo=`https://github.com/${owner}.png?size=64`;
          data.items.forEach(issue=>{
            const labelNames=(issue.labels||[]).map(l=>typeof l==='string'?l:(l.name||''));
            allIssues.push({
              title:issue.title,
              url:issue.html_url,
              org:o.name,
              orgCat:o.cat,
              orgTags:o.tags,
              logo,
              repo:o.github,
              created_at:issue.created_at,
              labels:labelNames,
              comments:issue.comments||0,
            });
          });
          found+=data.items.length;
        }
        const gfiCount=data.total??data.gfi;
        if(gfiCount!=null){
          if(!o._gh)o._gh={};
          o._gh.gfi=gfiCount;
        }
      }catch(e){}
      done++;
    }));
    // Update progress UI
    const pct=Math.round(done/orgsWithGithub.length*100);
    const fpStatus=document.getElementById('fpStatus');
    const fpBar=document.getElementById('fpBar');
    const fpFound=document.getElementById('fpFound');
    if(fpStatus)fpStatus.textContent=`Checking ${done} / ${orgsWithGithub.length} orgs`;
    if(fpBar)fpBar.style.width=pct+'%';
    if(fpFound)fpFound.textContent=`${found} issues found so far`;
    txt.textContent=`${done}/${orgsWithGithub.length}…`;
    await new Promise(r=>setTimeout(r,60));
  }

  // Sort: newest first
  allIssues.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  issuesFetching=false;
  btn.disabled=false; spin.style.display='none'; txt.textContent='↻ Refresh';

  filterIssues();
  renderGrid(filteredOrgs);
  updateStats();
}

function filterIssues(){
  const search=(document.getElementById('issueSearch')?.value||'').toLowerCase().trim();
  const cat=document.getElementById('issueCatFilter')?.value||'';
  const lang=document.getElementById('issueLangFilter')?.value||'';
  
  filteredIssues=allIssues.filter(iss=>{
    if(cat&&iss.orgCat!==cat)return false;
    if(lang&&!iss.orgTags.some(t=>t.includes(lang)))return false;
    if(search&&!iss.title.toLowerCase().includes(search)&&!iss.org.toLowerCase().includes(search))return false;
    return true;
  });
  
  shownIssues=0;
  renderIssues();
}

function relativeTime(dateStr){
  const diff=Date.now()-new Date(dateStr).getTime();
  const d=Math.floor(diff/86400000);
  if(d===0)return'Today';
  if(d===1)return'Yesterday';
  if(d<30)return d+'d ago';
  if(d<365)return Math.floor(d/30)+'mo ago';
  return Math.floor(d/365)+'y ago';
}

function renderIssues(){
  const container=document.getElementById('issuesContainer');
  const statsDiv=document.getElementById('issuesStats');
  const loadMore=document.getElementById('loadMoreWrap');

  if(!allIssues.length){
    container.innerHTML=`<div class="issue-empty"><div class="ei">🟢</div><h3>Ready to find your first issue?</h3><p>Click "Load Issues" to fetch Good First Issues from all GSoC orgs.</p></div>`;
    statsDiv.style.display='none';loadMore.style.display='none';return;
  }

  if(!filteredIssues.length){
    container.innerHTML=`<div class="issue-empty"><div class="ei">🔍</div><h3>No issues match your filters</h3><p>Try adjusting the search or category.</p></div>`;
    statsDiv.style.display='flex';loadMore.style.display='none';
  } else {
    shownIssues=Math.min(shownIssues+ISSUES_PAGE_SIZE,filteredIssues.length);
    const visible=filteredIssues.slice(0,shownIssues);
    container.innerHTML=`<div class="issues-grid">${visible.map(renderIssueCard).join('')}</div>`;
    loadMore.style.display=shownIssues<filteredIssues.length?'flex':'none';
  }

  // Update stats
  const orgsWithIssues=new Set(allIssues.map(i=>i.org)).size;
  document.getElementById('issTotal').textContent=allIssues.length.toLocaleString();
  document.getElementById('issOrgs').textContent=orgsWithIssues;
  document.getElementById('issShown').textContent=Math.min(shownIssues,filteredIssues.length);
  statsDiv.style.display='flex';
}

function renderIssueCard(iss){
  const langTags=iss.orgTags.slice(0,2).map(t=>`<span class="issue-label lang">${t}</span>`).join('');
  const gfiNames=['good first issue','good-first-issue'];
  const otherLabels=iss.labels.filter(l=>!gfiNames.includes(l.toLowerCase())).slice(0,2)
    .map(l=>`<span class="issue-label" style="background:rgba(107,33,168,.06);color:var(--purple);border:1px solid rgba(107,33,168,.2)">${l}</span>`).join('');
  return`<a class="issue-card" href="${iss.url}" target="_blank" rel="noopener">
    <img class="issue-logo" src="${iss.logo}" alt="${iss.org}" loading="lazy" onerror="this.style.display='none'">
    <div class="issue-body">
      <div class="issue-top">
        <span class="issue-org">${iss.org}</span>
        <span class="issue-label gfi">✓ Good First Issue</span>
        ${iss.comments>0?`<span style="font-size:10px;color:var(--muted)">💬 ${iss.comments}</span>`:''}
      </div>
      <div class="issue-title">${iss.title}</div>
      <div class="issue-meta">
        ${langTags}${otherLabels}
        <span class="issue-date">${relativeTime(iss.created_at)}</span>
      </div>
    </div>
  </a>`;
}

function showMoreIssues(){
  const container=document.getElementById('issuesContainer');
  const next=filteredIssues.slice(shownIssues,shownIssues+ISSUES_PAGE_SIZE);
  shownIssues+=next.length;
  container.querySelector('.issues-grid').insertAdjacentHTML('beforeend',next.map(renderIssueCard).join(''));
  document.getElementById('loadMoreWrap').style.display=shownIssues<filteredIssues.length?'flex':'none';
  document.getElementById('issShown').textContent=shownIssues;
}

ORGS.forEach(o=>{if(o.github&&cache[o.github])o._gh=cache[o.github]});
updateStats();
applyFilters();
renderTrending();
checkAPI();
