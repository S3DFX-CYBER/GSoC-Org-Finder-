// src/js/recommender.js

/* global ORGS, module */

const MAX_RECOMMENDATIONS = 6;
const MAX_LANGUAGE_SCORE = 40;
const MAX_TOPIC_SCORE = 30;
const DEFAULT_ACTIVITY_SCORE = 8;
const DEFAULT_FALLBACK_SCORE = 5;
const SCORE_CAP = 99;
const LANGUAGE_SCORE_STEPS = [15, 12, 8, 5];
const TOPIC_SCORE_STEPS = [12, 10, 8];

function identity(value) {
  return value;
}

function getNormalizer() {
  return typeof globalThis.normalizeSkill === 'function'
    ? globalThis.normalizeSkill
    : identity;
}

function addNormalizedEntries(values, target, normalize) {
  if (!Array.isArray(values)) {
    return;
  }

  values.forEach(value => {
    if (typeof value !== 'string') {
      return;
    }

    target.add(normalize(value.toLowerCase()));
  });
}

function getWeightedScore(matchCount, scoreSteps, maxScore) {
  const appliedSteps = scoreSteps.slice(0, matchCount);
  const total = appliedSteps.reduce((sum, score) => sum + score, 0);
  return Math.min(total, maxScore);
}

function createSkillTracker() {
  const orderedSkills = [];
  const skillSet = new Set();

  return {
    add(skill) {
      if (!skillSet.has(skill)) {
        skillSet.add(skill);
        orderedSkills.push(skill);
      }
    },
    has(skill) {
      return skillSet.has(skill);
    },
    toArray() {
      return orderedSkills.slice();
    }
  };
}

function resolveOrgTags(org, normalize) {
  if (!Array.isArray(org.tags)) {
    return new Set();
  }

  return new Set(
    org.tags
      .filter(tag => typeof tag === 'string')
      .map(tag => normalize(tag.toLowerCase()))
  );
}

function resolveOrgCategory(org, normalize) {
  return typeof org.cat === 'string'
    ? normalize(org.cat.toLowerCase())
    : '';
}

function getRecommendations(resumeSkills = [], githubProfile = null) {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) {
    console.error('ORGS is not defined.');
    return [];
  }

  const normalize = getNormalizer();
  const userLanguages = new Set();
  const userTopics = new Set();

  if (githubProfile) {
    addNormalizedEntries(githubProfile.languages || [], userLanguages, normalize);
    addNormalizedEntries(githubProfile.topics || [], userTopics, normalize);
  }

  addNormalizedEntries(resumeSkills, userLanguages, normalize);
  addNormalizedEntries(resumeSkills, userTopics, normalize);

  return ORGS
    .map((org, index) =>
      calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
    )
    .sort((left, right) => right.rawScore - left.rawScore)
    .slice(0, MAX_RECOMMENDATIONS);
}

/**
 * Calculates the language match score for an organization.
 * @param {Set<string>} userLanguages - Set of languages known by the user.
 * @param {Set<string>} orgTags - Set of technology tags for the organization.
 * @param {string} orgCategory - The category of the organization.
 * @param {Object} skillTracker - Object to track matched skills.
 * @param {string[]} matchReasons - Array to store human-readable match reasons.
 * @returns {number} The calculated language score.
 */
function calculateLanguageScore(userLanguages, orgTags, orgCategory, skillTracker, matchReasons) {
  const primaryLanguages = [];

  userLanguages.forEach(language => {
    if (orgTags.has(language) || orgCategory === language) {
      primaryLanguages.push(language);
      skillTracker.add(language);
    }
  });

  if (primaryLanguages.length === 0) {
    return 0;
  }

  const displayLanguages = primaryLanguages.slice(0, 2).join(', ');
  const overflowSuffix = primaryLanguages.length > 2 ? '...' : '';
  matchReasons.push(`Strong stack match: ${displayLanguages}${overflowSuffix}`);

  return getWeightedScore(
    primaryLanguages.length,
    LANGUAGE_SCORE_STEPS,
    MAX_LANGUAGE_SCORE
  );
}

/**
 * Calculates the interest match score for an organization.
 * @param {Set<string>} userTopics - Set of topics/interests for the user.
 * @param {Set<string>} orgTags - Set of technology tags for the organization.
 * @param {string} orgCategory - The category of the organization.
 * @param {Object} skillTracker - Object to track matched skills.
 * @param {string[]} matchReasons - Array to store human-readable match reasons.
 * @returns {number} The calculated topic score.
 */
function calculateTopicScore(userTopics, orgTags, orgCategory, skillTracker, matchReasons) {
  const matchedTopics = [];

  userTopics.forEach(topic => {
    if (skillTracker.has(topic)) {
      return;
    }

    if (orgTags.has(topic) || orgCategory === topic) {
      matchedTopics.push(topic);
      skillTracker.add(topic);
    }
  });

  if (matchedTopics.length === 0) {
    return 0;
  }

  matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);

  return getWeightedScore(
    matchedTopics.length,
    TOPIC_SCORE_STEPS,
    MAX_TOPIC_SCORE
  );
}

function classifyActivityLevel(activity) {
  const activityMap = {
    active: 'high',
    high: 'high',
    hot: 'high',
    moderate: 'medium',
    medium: 'medium',
    low: 'low',
    chill: 'low'
  };

  return activityMap[activity] || 'unknown';
}

function calculateActivityScore(githubProfile, org, matchReasons) {
  if (!githubProfile) {
    return DEFAULT_ACTIVITY_SCORE;
  }

  const userActivity = (githubProfile.activity || 'low').toLowerCase();
  const organizationActivity = (
    org._gh?.activity ||
    org.activity ||
    org.competition ||
    'low'
  ).toLowerCase();
  const normalizedOrgActivity = classifyActivityLevel(organizationActivity);

  if (userActivity === 'high' && normalizedOrgActivity === 'high') {
    matchReasons.push('Matches your high activity pace');
    return 15;
  }

  if (
    userActivity === 'medium' &&
    ['medium', 'high'].includes(normalizedOrgActivity)
  ) {
    matchReasons.push('Sustainable pace for your activity level');
    return 12;
  }

  if (userActivity === 'low' && normalizedOrgActivity === 'low') {
    matchReasons.push('Good entry point with manageable pacing');
    return 15;
  }

  return DEFAULT_FALLBACK_SCORE;
}

function calculateExperienceScore(githubProfile, org, matchReasons) {
  const userStars = githubProfile?.stars || 0;
  const userLanguageCount = (githubProfile?.languages || []).length;
  const isExperienced = userStars > 50 || userLanguageCount > 5;
  const isBeginner = !githubProfile || (userStars < 10 && userLanguageCount < 3);
  const orgCodebase = (org.codebase || 'intermediate').toLowerCase();

  if (isBeginner && orgCodebase === 'beginner') {
    matchReasons.push('Beginner-friendly codebase');
    return 25;
  }

  if (isExperienced && orgCodebase === 'advanced') {
    matchReasons.push('Challenging project for your experience');
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
  const skillTracker = createSkillTracker();
  const normalize = getNormalizer();
  const orgTags = resolveOrgTags(org, normalize);
  const orgCategory = resolveOrgCategory(org, normalize);

  const score =
    calculateLanguageScore(userLanguages, orgTags, orgCategory, skillTracker, matchReasons) +
    calculateTopicScore(userTopics, orgTags, orgCategory, skillTracker, matchReasons) +
    calculateActivityScore(githubProfile, org, matchReasons) +
    calculateExperienceScore(githubProfile, org, matchReasons) +
    calculateStabilityBonus(org, matchReasons);

  const cappedScore = Math.min(Math.round(score), SCORE_CAP);
  const orgName = typeof org.name === 'string' ? org.name : '';
  const tieBreaker = (orgName.length % 10) / 100 + (index % 100) / 10000;

  if (matchReasons.length === 0) {
    matchReasons.push('Matches your developer profile');
  }

  return {
    orgIndex: index,
    org,
    score: cappedScore,
    rawScore: score + tieBreaker,
    matchedSkills: skillTracker.toArray(),
    reasons: matchReasons
  };
}

globalThis.getRecommendations = getRecommendations;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateActivityScore,
    calculateExperienceScore,
    calculateLanguageScore,
    calculateScoreForOrg,
    calculateStabilityBonus,
    calculateTopicScore,
    classifyActivityLevel,
    getRecommendations
  };
}
