async function fetchAll(){
  if(fetching)return;
  fetching=true;

  // Show loading skeletons while fetching GitHub data
  showSkeletons();

  const spin=document.getElementById('fetchSpin'),
        txt=document.getElementById('fetchTxt'),
        btn=document.getElementById('fetchBtn');

  spin.style.display='block';
  btn.disabled=true;

  let done=0;

  for(const o of ORGS){

    if(o.github){

      txt.textContent=`Fetching GitHub stats (${++done}/${ORGS.length})...`;

      const d=await fetchGH(o.github);

      if(d)o._gh=d;

      await new Promise(r=>setTimeout(r,85));
    }
  }

  txt.textContent='Rendering data...';

  spin.style.display='none';
  btn.disabled=false;
  txt.textContent='✓ Done';

  fetching=false;

  applyFilters();
  updateStats();
}