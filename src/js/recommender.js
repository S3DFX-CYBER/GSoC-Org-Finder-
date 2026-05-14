// src/js/recommender.js

/**
 * recommender.js
 * 
 * Takes user skills (from resume) and GitHub profile data to calculate a match score 
 * against all GSoC organizations, returning the top 5 matches.
 */

/* global ORGS */

/**
 * Generates recommendations for GSoC organizations.
 * 
 * @param {Array<string>} resumeSkills - Extracted skills from the user's resume
 * @param {Object} githubProfile - Parsed data from githubAnalyzer.js
 * @returns {Array<Object>} - Top 5 recommended orgs with match metadata
 */
function getRecommendations(resumeSkills = [], githubProfile = null) {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) {
    console.error("ORGS array is not defined. Ensure org.js is loaded first.");
    return [];
  }

  // Combine skills to form a unified user profile
  const userLanguages = new Set();
  const userTopics = new Set();
  
  if (githubProfile) {
    (githubProfile.languages || []).forEach(l => userLanguages.add(l.toLowerCase()));
    (githubProfile.topics || []).forEach(t => userTopics.add(t.toLowerCase()));
  }
  
  resumeSkills.forEach(s => {
    userLanguages.add(s.toLowerCase());
    userTopics.add(s.toLowerCase()); // Resume skills can act as topics/domains too
  });

  const scoredOrgs = ORGS.map((org, index) => 
    calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
  );
  
  // Sort by rawScore descending
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);

  // Return Top 5
  return scoredOrgs.slice(0, 5);
}

/**
 * Core engine logic extracted to achieve manageable cyclomatic & cognitive complexity.
 * Optimizes string list lookups with Set semantics and reduces nested conditionals.
 */
/**
 * Core engine orchestrator. Sums metrics derived from specialized scoring primitives.
 * Extremely low cognitive cyclomatic path threshold for superior auditability and evolution.
 */
function calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile) {
    const matchReasons = [];
    const matchedSkills = [];
    const orgTags = new Set((org.tags || []).map(t => t.toLowerCase()));
    const orgCat = org.cat ? org.cat.toLowerCase() : '';

    let score = 0;
    score += calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons);
    score += calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons);
    score += calculateActivityScore(githubProfile, org, matchReasons);
    score += calculateExperienceScore(githubProfile, org, matchReasons);

    // Cap and mix-in deterministic tiebreak
    score = Math.min(score, 100);
    score += (org.name.length % 100) / 100;

    // Safeguard: Provide a contextually relevant fallback explanation if array empty
    if (matchReasons.length === 0) {
      const categoryLabel = orgCat || 'open source ecosystem';
      matchReasons.push(`Relevant fit within ${categoryLabel}`);
    }

    return {
      orgIndex: index,
      org: org,
      score: Math.floor(score), 
      rawScore: score,
      matchedSkills: [...new Set(matchedSkills)],
      reasons: matchReasons
    };
}

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
    let matches = 0;
    userLanguages.forEach(lang => {
      if (orgTags.has(lang) || orgCat === lang) {
        matches++;
        matchedSkills.push(lang);
      }
    });
    
    let delta = 0;
    if (matches === 1) delta = 20;
    else if (matches >= 2) delta = 40;
    
    if (delta > 0) matchReasons.push(`Uses your languages (${matches} matched)`);
    return delta;
}

function calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons) {
    let matches = 0;
    userTopics.forEach(topic => {
      if (!matchedSkills.includes(topic) && (orgTags.has(topic) || orgCat === topic)) {
        matches++;
        matchedSkills.push(topic);
      }
    });
    
    let delta = 0;
    if (matches === 1) delta = 15;
    else if (matches >= 2) delta = 30;
    
    if (delta > 0) matchReasons.push(`Aligns with your domain interests`);
    return delta;
}

function calculateActivityScore(profile, org, matchReasons) {
    if (!profile) return 5; // Baseline score with no specific reasons

    const userAct = profile.activity;
    const orgAct = org._gh ? org._gh.activity : 'low';
    
    if (userAct === 'high' && orgAct === 'active') {
      matchReasons.push(`Both you and this org are highly active`);
      return 15;
    } 
    
    if (userAct === 'medium' && orgAct === 'moderate') {
      matchReasons.push(`Good match for moderate activity levels`);
      return 15;
    }
    
    if (userAct === 'low' && orgAct === 'low') {
      matchReasons.push(`Pacing matches your recent activity`);
      return 10;
    }

    return 5;
}

function calculateExperienceScore(profile, org, matchReasons) {
    let delta = 0;
    const hasWeakProfile = !profile || (profile.stars < 10 && (profile.languages?.length || 0) < 3);
    
    if (hasWeakProfile) {
      if (org.codebase === 'beginner') {
        matchReasons.push(`Great for newcomers (beginner-friendly codebase)`);
        delta = 15;
      } else if (org.codebase === 'intermediate') {
        delta = 5;
      }
    } else if (org.codebase === 'advanced') {
      matchReasons.push(`Challenging, fits your experience level`);
      delta = 15;
    } else if (org.codebase === 'intermediate') {
      delta = 10;
    }
    
    return delta;
}

// Export for global usage
globalThis.getRecommendations = getRecommendations;
