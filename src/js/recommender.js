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
  const githubTopics = Array.isArray(githubProfile?.topics)
  ? githubProfile.topics
  : [];
  
  const githubLanguages = Array.isArray(githubProfile?.languages)
  ? githubProfile.languages
  : [];
  
  const userTopics = new Set(
  githubTopics
    .filter(
      (topic) =>
        typeof topic === "string" && topic.trim().length > 0
    )
    .map((topic) => normalize(topic.trim().toLowerCase())));

githubLanguages.forEach((lang) => {
  if (typeof lang === "string" && lang.trim()) {
    userLanguages.add(normalize(lang.trim().toLowerCase()));
  }
}); 
  
  resumeSkills.forEach(s => { 
    if (typeof s !== "string" || !s.trim()) return; 
    const skill = normalize(s.toLowerCase()); // Add once only 
    userLanguages.add(skill); 
  });

  const scoredOrgs = ORGS.map((org, index) => 
    calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
  );
  
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);
  return scoredOrgs.slice(0, 6);
}

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
  const primaryLangs = [];
  userLanguages.forEach(lang => {
    if (orgTags.has(lang) || orgCat === lang) {
      matchedSkills.push(lang);
      primaryLangs.push(lang);
    }
  });

  const langMatches = primaryLangs.length;
  if (langMatches === 0) return 0;

  let langDelta = 0;
  if (langMatches >= 1) langDelta += 15;
  if (langMatches >= 2) langDelta += 12;
  if (langMatches >= 3) langDelta += 8;
  if (langMatches >= 4) langDelta += 5;

  const displayLangs = primaryLangs.slice(0, 2).join(", ");
  matchReasons.push(`Strong stack match: ${displayLangs}${primaryLangs.length > 2 ? '...' : ''}`);
  return Math.min(langDelta, 40);
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
  // Neutral fallback when no GitHub profile exists 
  if (!githubProfile) { return 10; } 
  const userActivity = typeof githubProfile.activity === "string"
    ? githubProfile.activity
    : "medium";
  
  let orgActivityRaw = "low";
  if (typeof org._gh?.activity === "string") {
    orgActivityRaw = org._gh.activity;
  }
  else if (typeof org.activity === "string") {
    orgActivityRaw = org.activity;
  }
  else if (typeof org.competition === "string") {
  orgActivityRaw = org.competition;
}

const userAct = userActivity.toLowerCase();
const orgAct = orgActivityRaw.toLowerCase();
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
  const isBeginner =
  !!githubProfile &&
  githubProfile.public_repos < 5 &&
  githubProfile.followers < 10;
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
  const orgTags = new Set(
  (Array.isArray(org.tags) ? org.tags : [])
    .filter(
      (tag) =>
        typeof tag === "string" && tag.trim()
    )
    .map((tag) =>
      orgNormalize(tag.trim().toLowerCase())
    )
);

  const orgCat =
  typeof org.cat === "string"
    ? orgNormalize(org.cat.toLowerCase())
    : "";

  let score = 0;
  
  score += calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons);
  score += calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons);
  score += calculateActivityScore(githubProfile, org, matchReasons);
  score += calculateExperienceScore(githubProfile, org, matchReasons);
  score += calculateStabilityBonus(org, matchReasons);

  const cappedScore = Math.min(Math.round(score), 99);
  const tieBreaker = (org.name.length % 10) / 100 + (index % 100) / 10000;
  const finalRawScore = score + tieBreaker;

  if (matchReasons.length === 0) {
    matchReasons.push("Matches your general developer profile");
  }

  return {
    orgIndex: index,
    org: org,
    score: cappedScore, 
    rawScore: finalRawScore,
    matchedSkills: [...new Set(matchedSkills)],
    reasons: matchReasons
  };
}

globalThis.getRecommendations = getRecommendations;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getRecommendations };
}
