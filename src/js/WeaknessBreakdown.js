// src/js/WeaknessBreakdown.js

const WeaknessBreakdown = (function() {
  function render(containerId, weaknesses) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30';
    
    const title = document.createElement('h4');
    title.className = 'text-sm font-bold text-red-900 dark:text-red-400 mb-3 uppercase tracking-wider flex items-center gap-2';
    title.innerHTML = '<span class="material-symbols-outlined text-[18px]">warning</span> Focus Areas';
    wrapper.appendChild(title);
    
    if (!weaknesses || weaknesses.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-sm text-green-700 dark:text-green-400 font-semibold';
      p.textContent = 'You are strongly aligned with this organization!';
      wrapper.appendChild(p);
      container.appendChild(wrapper);
      return;
    }
    
    const list = document.createElement('ul');
    list.className = 'space-y-2';
    
    weaknesses.forEach(w => {
      const li = document.createElement('li');
      li.className = 'text-sm text-red-800 dark:text-red-300 flex items-start gap-2';
      let message = '';
      if (w.type === 'SKILL_GAP') {
        message = `Missing preferred tech: <strong>${w.details.join(', ')}</strong>`;
      } else {
        message = w.details[0];
      }
      li.innerHTML = `<span class="material-symbols-outlined text-[16px] mt-0.5">error</span> <span>${message}</span>`;
      list.appendChild(li);
    });
    
    wrapper.appendChild(list);
    container.appendChild(wrapper);
  }

  return {
    render
  };
})();

globalThis.WeaknessBreakdown = WeaknessBreakdown;
