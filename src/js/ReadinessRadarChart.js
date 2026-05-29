// src/js/ReadinessRadarChart.js

const ReadinessRadarChart = (function() {
  function render(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Instead of bringing in Chart.js or D3, we use a pure HTML/CSS representation
    // of a radar chart (or a set of progress bars) to satisfy the zero-dependency requirement.
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700';
    
    const title = document.createElement('h4');
    title.className = 'text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider';
    title.textContent = 'Readiness Metrics';
    wrapper.appendChild(title);
    
    const metricsMap = {
      skills: { label: 'Tech Stack Alignment', color: 'bg-orange-500' },
      experience: { label: 'Contribution Experience', color: 'bg-blue-500' },
      activity: { label: 'GitHub Velocity', color: 'bg-green-500' }
    };
    
    if (!data || !data.metrics) return;

    Object.keys(data.metrics).forEach(key => {
      const value = data.metrics[key];
      // Max values based on ReadinessAnalyzer: skills(40), experience(30), activity(30)
      let max = 30;
      if (key === 'skills') max = 40;
      
      const percentage = Math.min(100, Math.round((value / max) * 100));
      
      const metricConfig = metricsMap[key];
      if (!metricConfig) return;
      
      const barWrapper = document.createElement('div');
      barWrapper.className = 'mb-3 last:mb-0';
      
      const labelRow = document.createElement('div');
      labelRow.className = 'flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1';
      labelRow.innerHTML = `<span>${metricConfig.label}</span><span>${percentage}%</span>`;
      
      const track = document.createElement('div');
      track.className = 'w-full h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden';
      
      const fill = document.createElement('div');
      fill.className = `h-full ${metricConfig.color} rounded-full transition-all duration-1000`;
      fill.style.width = '0%';
      
      // Animate width
      setTimeout(() => { fill.style.width = `${percentage}%`; }, 100);
      
      track.appendChild(fill);
      barWrapper.appendChild(labelRow);
      barWrapper.appendChild(track);
      wrapper.appendChild(barWrapper);
    });
    
    container.appendChild(wrapper);
  }

  return {
    render
  };
})();

globalThis.ReadinessRadarChart = ReadinessRadarChart;
