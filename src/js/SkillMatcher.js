// src/js/SkillMatcher.js

/**
 * SkillMatcher is responsible for comparing a contributor's skills with an organization's tech stack.
 */
const SkillMatcher = (function() {
  /**
   * Calculate the match score between user skills and org skills
   * @param {Array<string>} userSkills 
   * @param {Array<string>} orgSkills 
   * @returns {Object} score details
   */
  function calculateSkillMatch(userSkills, orgSkills) {
    if (!userSkills || !orgSkills || userSkills.length === 0 || orgSkills.length === 0) {
      return { score: 0, matchedSkills: [] };
    }
    
    const normalize = (s) => s.toLowerCase().trim();
    const normalizedUserSkills = new Set(userSkills.map(normalize));
    const normalizedOrgSkills = orgSkills.map(normalize);
    
    const matchedSkills = normalizedOrgSkills.filter(skill => normalizedUserSkills.has(skill));
    
    let score = 0;
    if (matchedSkills.length > 0) {
      // Base score for having matches
      score += 50;
      // Bonus score based on percentage of org stack matched
      score += (matchedSkills.length / normalizedOrgSkills.length) * 50;
    }
    
    return {
      score: Math.min(Math.round(score), 100),
      matchedSkills
    };
  }

  return {
    calculateSkillMatch
  };
})();

globalThis.SkillMatcher = SkillMatcher;
