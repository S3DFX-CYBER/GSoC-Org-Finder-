// src/js/RoadmapGenerator.js

const RoadmapGenerator = (function() {
  function generate(userProfile, targetOrg) {
    if (!userProfile || !targetOrg) return null;
    
    // Analyze difficulty progression
    const progression = globalThis.DifficultyProgression 
      ? globalThis.DifficultyProgression.mapProgression(userProfile, targetOrg)
      : [];
      
    // Plan milestones and timing
    const milestones = globalThis.MilestonePlanner 
      ? globalThis.MilestonePlanner.plan(progression)
      : [];
      
    return {
      orgName: targetOrg.name,
      milestones,
      progression
    };
  }
  
  function render(containerId, roadmapData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!roadmapData) {
      container.innerHTML = '<div class="text-zinc-500 p-4">No roadmap data available.</div>';
      return;
    }
    
    if (globalThis.ContributionTimeline) {
      globalThis.ContributionTimeline.render(containerId, roadmapData);
    }
  }

  return {
    generate,
    render
  };
})();

globalThis.RoadmapGenerator = RoadmapGenerator;
