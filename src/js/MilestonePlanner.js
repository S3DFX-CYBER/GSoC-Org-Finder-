// src/js/MilestonePlanner.js

const MilestonePlanner = (function() {
  function plan(progressionSteps) {
    // Generate a simple timeline with estimated weeks
    let currentWeek = 1;
    
    return progressionSteps.map(step => {
      let weeksNeeded = 1;
      if (step.difficulty === 'Intermediate') weeksNeeded = 2;
      if (step.difficulty === 'Advanced') weeksNeeded = 3;
      if (step.type === 'proposal') weeksNeeded = 2;
      
      const milestone = {
        ...step,
        weekStart: currentWeek,
        weekEnd: currentWeek + weeksNeeded - 1,
        timeframe: `Week ${currentWeek}${weeksNeeded > 1 ? ' - ' + (currentWeek + weeksNeeded - 1) : ''}`
      };
      
      currentWeek += weeksNeeded;
      return milestone;
    });
  }

  return { plan };
})();

globalThis.MilestonePlanner = MilestonePlanner;
