// src/js/DifficultyProgression.js

const DifficultyProgression = (function() {
  function mapProgression(userProfile) {
    const experience = (userProfile.experience || 'beginner').toLowerCase();
    
    const steps = [];
    
    if (experience === 'beginner') {
      steps.push({ level: 1, type: 'documentation', label: 'Documentation & Setup', difficulty: 'Beginner' });
      steps.push({ level: 2, type: 'good_first_issue', label: 'Good First Issues', difficulty: 'Beginner' });
      steps.push({ level: 3, type: 'bug_fix', label: 'Minor Bug Fixes', difficulty: 'Intermediate' });
      steps.push({ level: 4, type: 'feature', label: 'Small Feature Addition', difficulty: 'Intermediate' });
      steps.push({ level: 5, type: 'proposal', label: 'GSoC Proposal Draft', difficulty: 'Advanced' });
    } else if (experience === 'intermediate') {
      steps.push({ level: 1, type: 'good_first_issue', label: 'Warmup Issue', difficulty: 'Beginner' });
      steps.push({ level: 2, type: 'bug_fix', label: 'Core Bug Fixes', difficulty: 'Intermediate' });
      steps.push({ level: 3, type: 'feature', label: 'Feature Implementation', difficulty: 'Advanced' });
      steps.push({ level: 4, type: 'proposal', label: 'GSoC Proposal Draft', difficulty: 'Advanced' });
    } else {
      steps.push({ level: 1, type: 'bug_fix', label: 'Complex Bug Fix', difficulty: 'Intermediate' });
      steps.push({ level: 2, type: 'feature', label: 'Core Architecture Feature', difficulty: 'Advanced' });
      steps.push({ level: 3, type: 'proposal', label: 'GSoC Proposal Draft', difficulty: 'Advanced' });
    }
    
    return steps;
  }

  return { mapProgression };
})();

globalThis.DifficultyProgression = DifficultyProgression;
