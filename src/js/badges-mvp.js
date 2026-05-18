/* global localStorage */
/* exported BadgeSystem */

// ══════════════════════════════════════════════
// BADGE SYSTEM MVP - Gamification for user engagement
// ══════════════════════════════════════════════
// NOTE: Badges are stored locally in your browser using localStorage.
// This means:
// - Progress is per-device/browser (not synced across devices)
// - Clearing browser data will reset all badge progress
// - No user account required - completely privacy-friendly
// ══════════════════════════════════════════════
// MVP VERSION: Starting with 2 core badge types
// - Explorer (org views) - Most common user action
// - Comparator (comparisons) - Key feature engagement
// Future: Can add Search Master and Filter Pro based on feedback
// ══════════════════════════════════════════════

const BadgeSystem = (function() {
  const STORAGE_KEY = 'gssoc_badges';
  
  // MVP: Badge definitions with thresholds (2 types only)
  const BADGE_DEFINITIONS = {
    explorer: {
      name: '🔍 Explorer',
      description: 'Viewed organizations',
      thresholds: [10, 25, 50, 100],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    },
    comparator: {
      name: '⚖️ Comparator',
      description: 'Compared organizations',
      thresholds: [5, 15, 30, 50],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    }
  };

  // Get badge data from localStorage
  function getBadgeData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return {
          explorer: 0,
          comparator: 0,
          unlockedBadges: []
        };
      }
      const parsed = JSON.parse(data);

      // Bug 2 fix: Schema validation — ensure expected fields are present and valid
      const isValid =
        parsed !== null &&
        typeof parsed === 'object' &&
        typeof parsed.explorer === 'number' &&
        typeof parsed.comparator === 'number' &&
        Array.isArray(parsed.unlockedBadges);

      if (!isValid) {
        console.warn('Badge data schema mismatch — resetting to defaults.');
        return {
          explorer: 0,
          comparator: 0,
          unlockedBadges: []
        };
      }

      return parsed;
    } catch (e) {
      console.warn('Failed to parse badge data:', e);
      return {
        explorer: 0,
        comparator: 0,
        unlockedBadges: []
      };
    }
  }

  // Save badge data to localStorage
  function saveBadgeData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save badge data:', e);
    }
  }

  // Get the current level for a badge type
  function getBadgeLevel(badgeType, count) {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return null;

    for (let i = def.thresholds.length - 1; i >= 0; i--) {
      if (count >= def.thresholds[i]) {
        return {
          level: i,
          levelName: def.levels[i],
          threshold: def.thresholds[i],
          nextThreshold: def.thresholds[i + 1] || null
        };
      }
    }
    return null;
  }

  // Check if a new badge level was unlocked
  function checkBadgeUnlock(badgeType, oldCount, newCount) {
    const oldLevel = getBadgeLevel(badgeType, oldCount);
    const newLevel = getBadgeLevel(badgeType, newCount);

    // Check if we crossed a threshold
    if (!oldLevel && newLevel) {
      return newLevel; // First badge unlocked
    }
    if (oldLevel && newLevel && oldLevel.level < newLevel.level) {
      return newLevel; // Level up
    }
    return null;
  }

  // Show badge unlock notification
  function showBadgeNotification(badgeType, level) {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return;

    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
      <div class="badge-notification-content">
        <div class="badge-notification-icon">${def.name.split(' ')[0]}</div>
        <div class="badge-notification-text">
          <div class="badge-notification-title">Badge Unlocked!</div>
          <div class="badge-notification-desc">${def.name} - ${level.levelName}</div>
          <div class="badge-notification-progress">${def.description}: ${level.threshold}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }

  // Track an action and check for badge unlocks
  function trackAction(actionType) {
    const data = getBadgeData();
    const oldCount = data[actionType] || 0;
    const newCount = oldCount + 1;
    data[actionType] = newCount;

    // Check for badge unlock
    const unlockedLevel = checkBadgeUnlock(actionType, oldCount, newCount);
    if (unlockedLevel) {
      const badgeKey = `${actionType}_${unlockedLevel.level}`;
      if (!data.unlockedBadges.includes(badgeKey)) {
        data.unlockedBadges.push(badgeKey);
        saveBadgeData(data);
        showBadgeNotification(actionType, unlockedLevel);
        return;
      }
    }

    saveBadgeData(data);
  }

  // Get badge statistics for display
  function getBadgeStats() {
    const data = getBadgeData();
    const stats = {};

    Object.keys(BADGE_DEFINITIONS).forEach(badgeType => {
      const count = data[badgeType] || 0;
      const level = getBadgeLevel(badgeType, count);
      const def = BADGE_DEFINITIONS[badgeType];

      stats[badgeType] = {
        name: def.name,
        description: def.description,
        count: count,
        level: level,
        nextThreshold: level ? level.nextThreshold : def.thresholds[0],
        progress: level ? 
          (level.nextThreshold ? 
            Math.round(((count - level.threshold) / (level.nextThreshold - level.threshold)) * 100) : 
            100) : 
          Math.round((count / def.thresholds[0]) * 100)
      };
    });

    return stats;
  }

  // Get total unlocked badges count
  function getUnlockedCount() {
    const data = getBadgeData();
    return data.unlockedBadges.length;
  }

  // Get total possible badges count (MVP: 2 types × 4 levels = 8)
  function getTotalBadgesCount() {
    return Object.keys(BADGE_DEFINITIONS).length * 4;
  }

  // Reset all badge progress
  function resetProgress() {
    if (confirm('Are you sure you want to reset all badge progress? This cannot be undone.\n\nNote: Badges are stored locally in your browser. Clearing browser data will also reset progress.')) {
      // Bug 3 fix: Wrap in try/catch for incognito/high-security environments
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to reset badge progress — localStorage unavailable:', e);
        return false;
      }
      // Dispatch event to update UI
      document.dispatchEvent(new CustomEvent('badgesReset'));
      return true;
    }
    return false;
  }

  // Public API
  return {
    trackOrgView: () => trackAction('explorer'),
    trackComparison: () => trackAction('comparator'),
    getBadgeStats: getBadgeStats,
    getUnlockedCount: getUnlockedCount,
    getTotalBadgesCount: getTotalBadgesCount,
    resetProgress: resetProgress,
    getBadgeData: getBadgeData
  };
})();

// Make it globally available
if (typeof window !== 'undefined') {
  window.BadgeSystem = BadgeSystem;
}
