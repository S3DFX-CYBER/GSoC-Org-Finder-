// src/js/ReadinessAnalyzer.js

const ReadinessAnalyzer = (function() {
  function analyzeReadiness(userProfile, targetOrg) {
    if (!userProfile || !targetOrg) return null;
    
    // Core scoring logic out of 100
    let totalScore = 0;
    
    // 1. Skill Gap Analysis (0-40)
    const orgSkills = targetOrg.tags || [];
    const skillMatch = globalThis.SkillMatcher 
      ? globalThis.SkillMatcher.calculateSkillMatch(userProfile.skills || [], orgSkills)
      : { score: 0 };
    
    const skillScore = Math.min((skillMatch.score / 100) * 40, 40);
    totalScore += skillScore;
    
    // 2. Experience Level (0-30)
    let experienceScore = 0;
    if (userProfile.experience === 'advanced') experienceScore = 30;
    else if (userProfile.experience === 'intermediate') experienceScore = 20;
    else experienceScore = 10;
    totalScore += experienceScore;
    
    // 3. Activity / Velocity (0-30)
    let activityScore = 20; // Default assuming moderate activity
    if (userProfile.ghActivity === 'high') activityScore = 30;
    if (userProfile.ghActivity === 'low') activityScore = 10;
    totalScore += activityScore;
    
    const weaknesses = detectWeaknesses(userProfile, orgSkills, skillMatch);
    
    return {
      overallScore: Math.round(totalScore),
      metrics: {
        skills: skillScore,
        experience: experienceScore,
        activity: activityScore
      },
      weaknesses
    };
  }
  
  function detectWeaknesses(userProfile, orgSkills) {
    const weaknesses = [];
    
    const userSkillsSet = new Set((userProfile.skills || []).map(s => s.toLowerCase()));
    const missingSkills = orgSkills.filter(s => !userSkillsSet.has(s.toLowerCase()));
    
    if (missingSkills.length > 0) {
      weaknesses.push({
        type: 'SKILL_GAP',
        severity: missingSkills.length > 2 ? 'high' : 'medium',
        details: missingSkills.slice(0, 3)
      });
    }
    
    if (userProfile.experience === 'beginner' && (userProfile.ghActivity === 'low' || !userProfile.ghActivity)) {
      weaknesses.push({
        type: 'EXPERIENCE',
        severity: 'high',
        details: ['Needs more open source contributions']
      });
    }
    
    return weaknesses;
  }

  return {
    analyzeReadiness
  };
})();

globalThis.ReadinessAnalyzer = ReadinessAnalyzer;
