// src/js/recommender.js

/* global ORGS */

const SCORE_BREAKDOWN_MAX = {
  lang: 40,
  topic: 30,
  activity: 15,
  experience: 25,
  stability: 10,
};

function formatSkillLabel(skill) {
  return String(skill)
    .split('/')
    .map((part) =>
      part
        .split(/[\s_-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    )
    .join('/');
}

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

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
  const primaryLangs = [];
  userLanguages.forEach(lang => {
    if (orgTags.has(lang) || orgCat === lang) {
      matchedSkills.push(lang);
      primaryLangs.push(lang);
    }
  });

  const langMatches = primaryLangs.length;
  if (langMatches === 0) {
    return { score: 0, matched: [] };
  }

  let langDelta = 0;
  if (langMatches >= 1) langDelta += 15;
  if (langMatches >= 2) langDelta += 12;
  if (langMatches >= 3) langDelta += 8;
  if (langMatches >= 4) langDelta += 5;

  const displayLangs = primaryLangs.slice(0, 2).join(", ");
  matchReasons.push(`Strong stack match: ${displayLangs}${primaryLangs.length > 2 ? '...' : ''}`);
  return {
    score: Math.min(langDelta, SCORE_BREAKDOWN_MAX.lang),
    matched: primaryLangs,
  };
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
  if (topicMatches === 0) {
    return { score: 0, matched: [] };
  }

  let topicDelta = 0;
  if (topicMatches >= 1) topicDelta += 12;
  if (topicMatches >= 2) topicDelta += 10;
  if (topicMatches >= 3) topicDelta += 8;

  matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);
  return {
    score: Math.min(topicDelta, SCORE_BREAKDOWN_MAX.topic),
    matched: matchedTopics,
  };
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

  const langResult = calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons);
  const topicResult = calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons);
  const activityScore = calculateActivityScore(githubProfile, org, matchReasons);
  const experienceScore = calculateExperienceScore(githubProfile, org, matchReasons);
  const stabilityBonus = calculateStabilityBonus(org, matchReasons);

  const score = langResult.score + topicResult.score + activityScore + experienceScore + stabilityBonus;

  const cappedScore = Math.min(Math.round(score), 99);
  const tieBreaker = (org.name.length % 10) / 100 + (index % 100) / 10000;
  const finalRawScore = score + tieBreaker;

  if (matchReasons.length === 0) {
    matchReasons.push("Matches your general developer profile");
  }

  const matchedDomains = [...new Set(topicResult.matched)];
  if (org.cat && !matchedDomains.includes(orgNormalize(org.cat.toLowerCase()))) {
    const catNorm = orgNormalize(org.cat.toLowerCase());
    if (userTopics.has(catNorm) || userLanguages.has(catNorm)) {
      matchedDomains.unshift(catNorm);
    }
  }

  return {
    orgIndex: index,
    org: org,
    score: cappedScore,
    rawScore: finalRawScore,
    matchedSkills: [...new Set(matchedSkills)],
    reasons: matchReasons,
    scoreBreakdown: {
      total: cappedScore,
      breakdown: {
        langScore: { score: langResult.score, max: SCORE_BREAKDOWN_MAX.lang },
        topicScore: { score: topicResult.score, max: SCORE_BREAKDOWN_MAX.topic },
        activityScore: { score: activityScore, max: SCORE_BREAKDOWN_MAX.activity },
        experienceScore: { score: experienceScore, max: SCORE_BREAKDOWN_MAX.experience },
        stabilityScore: { score: stabilityBonus, max: SCORE_BREAKDOWN_MAX.stability },
      },
      matchedLanguages: langResult.matched.map(formatSkillLabel),
      matchedDomains: matchedDomains.map(formatSkillLabel),
    },
  };
}

globalThis.getRecommendations = getRecommendations;
