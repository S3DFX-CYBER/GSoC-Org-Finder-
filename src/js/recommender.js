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
    const skill = s.toLowerCase();
    userLanguages.add(skill);
    userTopics.add(skill); 
  });

  const scoredOrgs = ORGS.map((org, index) => 
    calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
  );
  
  // Sort by rawScore descending
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);

  // Return Top 6 (slightly more to give choice)
  return scoredOrgs.slice(0, 6);
}

/**
 * Core engine orchestrator. Sums metrics derived from specialized scoring primitives.
 * Balanced weights (Total max ~120, then normalized to 100):
 * - Languages: 40%
 * - Topics/Domains: 30%
 * - Activity Fit: 15%
 * - Experience/Complexity: 25%
 * - Stability/Veteran: 10%
 */
function calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile) {
    const matchReasons = [];
    const matchedSkills = [];
    const orgTags = new Set((org.tags || []).map(t => t.toLowerCase()));
    const orgCat = org.cat ? org.cat.toLowerCase() : '';

    let score = 0;
    
    // 1. Language Matching (Up to 40 points)
    score += calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons);
    
    // 2. Topic & Domain Matching (Up to 30 points)
    score += calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons);
    
    // 3. Activity Fit (Up to 15 points)
    score += calculateActivityScore(githubProfile, org, matchReasons);
    
    // 4. Experience & Complexity Matching (Up to 25 points)
    score += calculateExperienceScore(githubProfile, org, matchReasons);

    // 5. Stability/Veteran Bonus (Up to 10 points)
    score += calculateStabilityBonus(org, matchReasons);

    // Normalize and deterministic tiebreak
    // rawScore is used for sorting, score is for display
    const rawScore = score;
    const normalizedScore = Math.min(Math.round(score), 99); // Save 100 for absolute perfect (rare)
    
    // Add tie-breaker based on name length and index to keep results stable
    const tieBreaker = (org.name.length % 10) / 100 + (index % 100) / 10000;
    const finalRawScore = rawScore + tieBreaker;

    // Safeguard: Provide fallback
    if (matchReasons.length === 0) {
      matchReasons.push("Matches your general developer profile");
    }

    return {
      orgIndex: index,
      org: org,
      score: normalizedScore, 
      rawScore: finalRawScore,
      matchedSkills: [...new Set(matchedSkills)],
      reasons: matchReasons
    };
}

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
    let matches = 0;
    const primaryMatches = [];
    
    userLanguages.forEach(lang => {
      if (orgTags.has(lang) || orgCat === lang) {
        matches++;
        matchedSkills.push(lang);
        primaryMatches.push(lang);
      }
    });
    
    if (matches === 0) return 0;
    
    // Weighted points: 15 for first, 12 for second, 8 for third, 5 for rest
    let delta = 0;
    if (matches >= 1) delta += 15;
    if (matches >= 2) delta += 12;
    if (matches >= 3) delta += 8;
    if (matches >= 4) delta += 5;
    
    const displayLangs = primaryMatches.slice(0, 2).join(", ");
    matchReasons.push(`Strong stack match: ${displayLangs}${primaryMatches.length > 2 ? '...' : ''}`);
    
    return Math.min(delta, 40);
}

function calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons) {
    let matches = 0;
    const matchedTopics = [];
    
    userTopics.forEach(topic => {
      // Don't double count if already matched in languages
      if (!matchedSkills.includes(topic) && (orgTags.has(topic) || orgCat === topic)) {
        matches++;
        matchedTopics.push(topic);
        matchedSkills.push(topic);
      }
    });
    
    if (matches === 0) return 0;
    
    let delta = 0;
    if (matches >= 1) delta += 12;
    if (matches >= 2) delta += 10;
    if (matches >= 3) delta += 8;
    
    matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);
    return Math.min(delta, 30);
}

function calculateActivityScore(profile, org, matchReasons) {
    if (!profile) return 8; // Neutral score

    const userAct = (profile.activity || 'low').toLowerCase();
    const orgAct = (org._gh?.activity || org.activity || org.competition || 'low').toLowerCase();
    
    // Mapping org activity/competition to levels
    const isHigh = orgAct === 'active' || orgAct === 'high' || orgAct === 'hot';
    const isMed = orgAct === 'moderate' || orgAct === 'medium';
    const isLow = orgAct === 'low' || orgAct === 'chill';

    if (userAct === 'high' && isHigh) {
      matchReasons.push(`Matches your high activity pace`);
      return 15;
    } 
    
    if (userAct === 'medium' && (isMed || isHigh)) {
      matchReasons.push(`Sustainable pace for your activity level`);
      return 12;
    }
    
    if (userAct === 'low' && isLow) {
      matchReasons.push(`Good entry point with manageable pacing`);
      return 15;
    }

    return 5;
}

function calculateExperienceScore(profile, org, matchReasons) {
    let delta = 0;
    const userStars = profile?.stars || 0;
    const userLangCount = profile?.languages?.length || 0;
    
    const isExperienced = userStars > 50 || userLangCount > 5;
    const isBeginner = !profile || (userStars < 10 && userLangCount < 3);
    
    const orgCodebase = (org.codebase || 'intermediate').toLowerCase();

    if (isBeginner && orgCodebase === 'beginner') {
      matchReasons.push(`Very beginner-friendly codebase`);
      delta = 25;
    } else if (isExperienced && orgCodebase === 'advanced') {
      matchReasons.push(`Challenging project for your experience`);
      delta = 20;
    } else if (orgCodebase === 'intermediate') {
      delta = 15;
    } else {
      delta = 10; // Default fit
    }
    
    return delta;
}

function calculateStabilityBonus(org, matchReasons) {
  const years = org.years || 0;
  if (years >= 10) {
    matchReasons.push(`GSoC Veteran (${years} years)`);
    return 10;
  }
  if (years >= 5) {
    return 5;
  }
  return 0;
}

// Export for global usage
globalThis.getRecommendations = getRecommendations;
