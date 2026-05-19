// src/js/recommender.js

/* global ORGS */

function getRecommendations(resumeSkills = [], githubProfile = null) {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) {
    console.error("ORGS is not defined.");
    return [];
  }

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
  
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);
  return scoredOrgs.slice(0, 6);
}

function calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile) {
  const matchReasons = [];
  const matchedSkills = [];
  const orgTags = new Set((org.tags || []).map(t => t.toLowerCase()));
  const orgCat = org.cat ? org.cat.toLowerCase() : '';

  let score = 0;
  
  let langMatches = 0;
  const primaryLangs = [];
  userLanguages.forEach(lang => {
    if (orgTags.has(lang) || orgCat === lang) {
      langMatches++;
      matchedSkills.push(lang);
      primaryLangs.push(lang);
    }
  });
  if (langMatches > 0) {
    let langDelta = 0;
    if (langMatches >= 1) langDelta += 15;
    if (langMatches >= 2) langDelta += 12;
    if (langMatches >= 3) langDelta += 8;
    if (langMatches >= 4) langDelta += 5;
    score += Math.min(langDelta, 40);
    const displayLangs = primaryLangs.slice(0, 2).join(", ");
    matchReasons.push(`Strong stack match: ${displayLangs}${primaryLangs.length > 2 ? '...' : ''}`);
  }
  
  let topicMatches = 0;
  const matchedTopics = [];
  userTopics.forEach(topic => {
    if (!matchedSkills.includes(topic) && (orgTags.has(topic) || orgCat === topic)) {
      topicMatches++;
      matchedTopics.push(topic);
      matchedSkills.push(topic);
    }
  });
  if (topicMatches > 0) {
    let topicDelta = 0;
    if (topicMatches >= 1) topicDelta += 12;
    if (topicMatches >= 2) topicDelta += 10;
    if (topicMatches >= 3) topicDelta += 8;
    score += Math.min(topicDelta, 30);
    matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);
  }
  
  if (githubProfile) {
    const userAct = (githubProfile.activity || 'low').toLowerCase();
    const orgAct = (org._gh?.activity || org.activity || org.competition || 'low').toLowerCase();
    const isHigh = orgAct === 'active' || orgAct === 'high' || orgAct === 'hot';
    const isMed = orgAct === 'moderate' || orgAct === 'medium';
    const isLow = orgAct === 'low' || orgAct === 'chill';

    if (userAct === 'high' && isHigh) {
      matchReasons.push("Matches your high activity pace");
      score += 15;
    } else if (userAct === 'medium' && (isMed || isHigh)) {
      matchReasons.push("Sustainable pace for your activity level");
      score += 12;
    } else if (userAct === 'low' && isLow) {
      matchReasons.push("Good entry point with manageable pacing");
      score += 15;
    } else {
      score += 5;
    }
  } else {
    score += 8;
  }
  
  const userStars = githubProfile?.stars || 0;
  const userLangCount = githubProfile?.languages?.length || 0;
  const isExperienced = userStars > 50 || userLangCount > 5;
  const isBeginner = !githubProfile || (userStars < 10 && userLangCount < 3);
  const orgCodebase = (org.codebase || 'intermediate').toLowerCase();

  if (isBeginner && orgCodebase === 'beginner') {
    matchReasons.push("Very beginner-friendly codebase");
    score += 25;
  } else if (isExperienced && orgCodebase === 'advanced') {
    matchReasons.push("Challenging project for your experience");
    score += 20;
  } else if (orgCodebase === 'intermediate') {
    score += 15;
  } else {
    score += 10;
  }
  
  const years = org.years || 0;
  if (years >= 10) {
    matchReasons.push(`GSoC Veteran (${years} years)`);
    score += 10;
  } else if (years >= 5) {
    score += 5;
  }

  const normalizedScore = Math.min(Math.round(score), 99);
  const tieBreaker = (org.name.length % 10) / 100 + (index % 100) / 10000;
  const finalRawScore = score + tieBreaker;

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

globalThis.getRecommendations = getRecommendations;
