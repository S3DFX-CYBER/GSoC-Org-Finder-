# app.js — Migration Guide for Issue #878

Replace the three GitHub fetch functions and `fetchAll` in `src/js/app.js`
with imports from the new queue module.

## 1. Add import at the top of app.js

```js
import { fetchGH, fetchGFI, fetchIssues, fetchAllStats, queueStatus, cancelBulk, invalidateCache } from './githubQueue.js';
```

## 2. Remove these functions entirely from app.js

- `fetchGH(repo)` — replaced by queue version
- `fetchGFI(repo)` — replaced by queue version
- The `cache` Map and `localStorage.getItem('gaf_ghc')` cache logic

## 3. Replace fetchAll() with the queue-based version

**Before:**
```js
async function fetchAll(){
  if(fetching)return; fetching=true;
  ...
  for(const o of ORGS){
    if(o.github){
      txt.textContent=`${++done}/${ORGS.length}…`;
      const d=await fetchGH(o.github);if(d)o._gh=d;
      await new Promise(r=>setTimeout(r,85));
    }
  }
  ...
}
```

**After:**
```js
function fetchAll(){
  if(fetching)return; fetching=true;
  const spin=document.getElementById('fetchSpin');
  const txt=document.getElementById('fetchTxt');
  const btn=document.getElementById('fetchBtn');
  spin.style.display='block'; btn.disabled=true;

  let done=0;
  const total=ORGS.filter(o=>o.github).length;

  // FIX (P1): Safety net timer — if onDone never fires due to silent errors,
  // unlock the UI after 60s so it never stays permanently frozen.
  const safetyTimer = setTimeout(() => {
    if (!fetching) return;           // already cleaned up normally — skip
    spin.style.display='none';
    btn.disabled=false;
    txt.textContent='⚠ Timed out';
    fetching=false;
    applyFilters();
    updateStats();
  }, 60_000);

  fetchAllStats(
    ORGS,
    // onProgress — called per org as data arrives (non-blocking)
    (org, data) => {
      org._gh = data;
      done++;
      txt.textContent=`${done}/${total}…`;
      applyFilters();
      updateStats();
    },
    // onDone — called when all fetches complete
    () => {
      clearTimeout(safetyTimer);     // cancel safety net — normal clean finish
      spin.style.display='none';
      btn.disabled=false;
      txt.textContent='✓ Done';
      fetching=false;
      applyFilters();
      updateStats();
    }
  );
}
```

## 4. Replace fetchModalGH() with priority fetch

**Before:**
```js
async function fetchModalGH(){
  const o=ORGS[modalIdx];if(!o?.github)return;
  document.getElementById('mFetchBtn').textContent='Loading…';
  delete cache[o.github];
  delete cache[o.github+'__gfi'];
  const d=await fetchGH(o.github);
  ...
}
```

**After:**
```js
async function fetchModalGH(){
  const o=ORGS[modalIdx];if(!o?.github)return;
  document.getElementById('mFetchBtn').textContent='Loading…';

  // FIX (P2): Bust cache before fetching so "Refresh" always gets fresh data
  // instead of returning the same stale cached result.
  invalidateCache(o.github);

  // Priority 0 = urgent, bypasses queue delay
  const d = await fetchGH(o.github, 0);
  if(d){
    o._gh=d;
    document.getElementById('ghStars').textContent=fmt(d.stars);
    document.getElementById('ghForks').textContent=fmt(d.forks);
    document.getElementById('ghIssues').textContent=fmt(d.issues);
    document.getElementById('ghCommit').textContent=d.lastCommit;
    document.getElementById('mFetchBtn').textContent='↻ Refresh';
    document.getElementById('ghGFI').textContent='…';

    const gfi = await fetchGFI(o.github, 0);
    const gfiTxt = gfi !== null ? fmt(gfi) : '—';
    document.getElementById('ghGFI').textContent=gfiTxt;
    if(gfi!==null){
      o._gh.gfi=gfi;
      const cells=document.getElementById('mMetrics')?.querySelectorAll('.mv');
      if(cells&&cells[3])cells[3].textContent=gfiTxt;
    }
    applyFilters();
    renderCompareTable();
  } else {
    document.getElementById('mFetchBtn').textContent='✗ Failed';
  }
}
```

## 5. Replace fetchAllIssues() batch with queue-based version

**Before (in `fetchAllIssues`):**
```js
await Promise.all(batch.map(async o=>{
  const r=await fetch(`${API}?repo=...&gfi=1&issues=1`);
  ...
}));
await new Promise(r=>setTimeout(r,60));
```

**After:**
```js
// In fetchAllIssues(), replace the inner loop with:
await Promise.all(orgsWithGithub.map(async o => {
  const data = await fetchIssues(o.github, 2);   // priority 2 = bulk
  if (data?.items?.length) {
    const owner = o.github.split('/')[0];
    const logo  = `https://github.com/${owner}.png?size=64`;
    data.items.forEach(issue => {
      allIssues.push({ ...issue, org: o.name, orgCat: o.cat, orgTags: o.tags, logo, repo: o.github });
    });
    found += data.items.length;
  }
  done++;
  // update progress UI...
}));
```

## 6. Add rate limit indicator to checkAPI()

```js
async function checkAPI(){
  try{
    const r = await fetch(`${API}?status=1`);
    const data = await r.json();
    const banner=document.getElementById('apiBanner');
    if(data.ok){
      const rem   = data.core?.remaining;
      const limit = data.core?.limit;
      // FIX (P3): Guard limit > 0 before dividing to prevent NaN% or Infinity%
      // when limit is 0 or undefined (e.g. token not configured or API degraded).
      const pct = (rem !== undefined && limit) ? Math.round(rem / limit * 100) : null;
      banner.className='api-banner api-ok';
      document.getElementById('apiStrong').textContent='✓ GitHub API Connected';
      document.getElementById('apiText').textContent=
        pct !== null
          ? `Live stats available. API quota: ${rem} / ${limit} requests remaining (${pct}%).`
          : 'Live stats available for all visitors.';
      document.getElementById('fetchBtn').style.display='flex';
    } else {
      banner.className='api-banner api-warn';
      document.getElementById('apiStrong').textContent='⚠ API Error';
      document.getElementById('apiText').textContent='Add GITHUB_TOKEN in Vercel dashboard and redeploy.';
    }
  } catch {
    document.getElementById('apiStrong').textContent='○ Running Locally';
    document.getElementById('apiText').textContent='Deploy to Vercel for live GitHub stats.';
  }
}
```