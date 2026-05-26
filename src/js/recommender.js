// src/js/recommender.js

/* global ORGS */

/**
 * Retrieves the top 6 recommended organizations based on skills and profile.
 * 
 * @param {Array<string>} resumeSkills - Unique set of extracted resume skills
 * @param {Object|null} githubProfile - Optional GitHub profile metrics
 * @returns {Array<Object>} - Top 6 recommended organizations sorted by score
 */
function getRecommendations(resumeSkills = [], githubProfile = null) {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) {
    console.error("ORGS is not defined.");
    return [];
  }

  const normalize = globalThis.normalizeSkill || (s => s);
  const userLanguages = new Set();
  const userTopics = new Set();

  if (githubProfile) {
    (githubProfile.languages || []).forEach(l => userLanguages.add(normalize(l.toLowerCase())));
    (githubProfile.topics || []).forEach(t => userTopics.add(normalize(t.toLowerCase())));
  }

  resumeSkills.forEach(s => {
    const skill = normalize(s.toLowerCase());
    userLanguages.add(skill);
    userTopics.add(skill);
  });

  const scoredOrgs = ORGS.map((org, index) => 
    calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
  );
  
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);
  return scoredOrgs.slice(0, 6);
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
  // Personalized recommendation boost
    if (matchedSkills.length >= 3) {
      score += 15;
      matchReasons.push('Highly personalized recommendation');
   }
    // Cap and mix-in deterministic tiebreak
    score = Math.min(score, 100);
    score += (org.name.length % 100) / 100;

    // Safeguard: Provide a contextually relevant fallback explanation if array empty
    if (matchReasons.length === 0) {
      const categoryLabel = orgCat || 'open source ecosystem';
      matchReasons.push(`Relevant fit within ${categoryLabel}`);
    }
  });

  const langMatches = primaryLangs.length;
  if (langMatches === 0) return 0;

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
    let matches = 0;
    userLanguages.forEach(lang => {
      if (orgTags.has(lang) || orgCat === lang) {
        matches++;
        matchedSkills.push(lang);
      }
    });
    
    let delta = 0;
    if (matches >=4) delta = 70;
    else if (matches >= 2) delta = 50;
    else if (matches === 1) delta = 25;
    
    if (delta > 0) matchReasons.push(`Strong skill match with ${matches} technologies`);
    return delta;
}

function calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons) {
  const matchedTopics = [];
  userTopics.forEach(topic => {
    if (!matchedSkills.includes(topic) && (orgTags.has(topic) || orgCat === topic)) {
      matchedTopics.push(topic);
      matchedSkills.push(topic);
    }
  });

  const topicMatches = matchedTopics.length;
  if (topicMatches === 0) return 0;

  let topicDelta = 0;
  if (topicMatches >= 1) topicDelta += 12;
  if (topicMatches >= 2) topicDelta += 10;
  if (topicMatches >= 3) topicDelta += 8;

  matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);
  return Math.min(topicDelta, 30);
}

function calculateActivityScore(githubProfile, org, matchReasons) {
  if (!githubProfile) return 8;

  const userAct = (githubProfile.activity || 'low').toLowerCase();
  const orgAct = (org._gh?.activity || org.activity || org.competition || 'low').toLowerCase();
  const isHigh = orgAct === 'active' || orgAct === 'high' || orgAct === 'hot';
  const isMed = orgAct === 'moderate' || orgAct === 'medium';
  const isLow = orgAct === 'low' || orgAct === 'chill';

  if (userAct === 'high' && isHigh) {
    matchReasons.push("Matches your high activity pace");
    return 15;
  }
  if (userAct === 'medium' && (isMed || isHigh)) {
    matchReasons.push("Sustainable pace for your activity level");
    return 12;
  }
  if (userAct === 'low' && isLow) {
    matchReasons.push("Good entry point with manageable pacing");
    return 15;
  }
  return 5;
}

function calculateExperienceScore(githubProfile, org, matchReasons) {
  const userStars = githubProfile?.stars || 0;
  const userLangCount = githubProfile?.languages?.length || 0;
  const isExperienced = userStars > 50 || userLangCount > 5;
  const isBeginner = !githubProfile || (userStars < 10 && userLangCount < 3);
  const orgCodebase = (org.codebase || 'intermediate').toLowerCase();

  if (isBeginner && orgCodebase === 'beginner') {
    matchReasons.push("Very beginner-friendly codebase");
    return 25;
  }
  if (isExperienced && orgCodebase === 'advanced') {
    matchReasons.push("Challenging project for your experience");
    return 20;
  }
  if (orgCodebase === 'intermediate') {
    return 15;
  }
  return 10;
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

function calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile) {
  const matchReasons = [];
  const matchedSkills = [];
  const orgNormalize = globalThis.normalizeSkill || (s => s);
  const orgTags = new Set((org.tags || []).map(t => orgNormalize(t.toLowerCase())));
  const orgCat = org.cat ? orgNormalize(org.cat.toLowerCase()) : '';

function calculateExperienceScore(profile, org, matchReasons) {
  let delta = 0;
  const beginnerTags = ['good first issue', 'beginner', 'easy', 'first-timers'];
  const orgTags = (org.tags || []).map(tag => tag.toLowerCase());

  const beginnerFriendly = beginnerTags.some(tag =>
    orgTags.includes(tag)
  );

  if (beginnerFriendly) {
    matchReasons.push('Beginner-friendly organization');
    delta += 10;
  }
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

globalThis.getRecommendations = getRecommendations;
