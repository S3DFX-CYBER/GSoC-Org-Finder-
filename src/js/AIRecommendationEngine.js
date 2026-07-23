// src/js/AIRecommendationEngine.js

const AIRecommendationEngine = (function() {
  function getTopOrganizations(userProfile, organizations, topN = 5) {
    if (!organizations || !Array.isArray(organizations)) return [];
    
    const scoredOrgs = organizations.map(org => {
      const orgSkills = org.tags || [];
      const matchResult = globalThis.SkillMatcher ? globalThis.SkillMatcher.calculateSkillMatch(userProfile.skills || [], orgSkills) : {score: 0, matchedSkills: []};
      
      let baseScore = matchResult.score;
      const reasons = [];
      
      if (matchResult.matchedSkills.length > 0) {
        reasons.push(`Matched skills: ${matchResult.matchedSkills.join(', ')}`);
      }
      
      const competitionLevel = (org.competition || 'medium').toLowerCase();
      if (competitionLevel === 'low' || competitionLevel === 'chill') {
        baseScore += 10;
        reasons.push('Approachable competition level');
      } else if (competitionLevel === 'high' || competitionLevel === 'hot') {
        baseScore -= 5;
        reasons.push('Highly competitive organization');
      }

      return {
        org,
        score: Math.max(0, Math.min(baseScore, 100)),
        matchedSkills: matchResult.matchedSkills,
        reasons
      };
    });

    return scoredOrgs
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  return {
    getTopOrganizations
  };
})();

globalThis.AIRecommendationEngine = AIRecommendationEngine;
