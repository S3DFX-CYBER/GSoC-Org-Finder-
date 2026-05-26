/* eslint-env browser */
/* exported BadgeCardGenerator */

// ══════════════════════════════════════════════
// BADGE ACHIEVEMENT CARD GENERATOR
// ══════════════════════════════════════════════
// Generates shareable PNG images of badge achievements
// Uses html2canvas for client-side image generation
// Privacy-first: No backend, all processing happens in browser
// ══════════════════════════════════════════════

const BadgeCardGenerator = (function() {
  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 630;

  // Badge level names mapping
  const BADGE_LEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  
  // Badge emoji mapping
  const BADGE_EMOJIS = {
    explorer: '🔍',
    comparator: '⚖️',
    search_master: '🔎',
    filter_pro: '🏷️'
  };

  // Badge names mapping
  const BADGE_NAMES = {
    explorer: 'Explorer',
    comparator: 'Comparator',
    search_master: 'Search Master',
    filter_pro: 'Filter Pro'
  };

  /**
   * Get the current theme (light or dark)
   */
  function getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Get badge level from count
   */
  function getBadgeLevel(badgeType, count) {
    const thresholds = {
      explorer: [10, 25, 50, 100],
      comparator: [5, 15, 30, 50],
      search_master: [10, 30, 75, 150],
      filter_pro: [15, 40, 100, 200]
    };

    const levels = thresholds[badgeType];
    if (!levels) return null;

    for (let i = levels.length - 1; i >= 0; i--) {
      if (count >= levels[i]) {
        return {
          level: i,
          levelName: BADGE_LEVELS[i],
          stars: '⭐'.repeat(i + 1)
        };
      }
    }
    return null;
  }

  /**
   * Get top achievement
   */
  function getTopAchievement(badgeData) {
    let topBadge = null;
    let topLevel = -1;

    Object.keys(BADGE_NAMES).forEach(badgeType => {
      const count = badgeData[badgeType] || 0;
      const level = getBadgeLevel(badgeType, count);
      if (level && level.level > topLevel) {
        topLevel = level.level;
        topBadge = {
          type: badgeType,
          ...level
        };
      }
    });

    return topBadge;
  }

  /**
   * Create the HTML card element
   */
  function createCardHTML(badgeData, theme) {
    const unlockedCount = badgeData.unlockedBadges ? badgeData.unlockedBadges.length : 0;
    const totalCount = 16;
    const topAchievement = getTopAchievement(badgeData);

    // Theme colors
    const colors = theme === 'dark' ? {
      bg: '#18181b',
      cardBg: '#27272a',
      border: '#3f3f46',
      text: '#fafafa',
      muted: '#a1a1aa',
      accent: '#3b82f6'
    } : {
      bg: '#ffffff',
      cardBg: '#f4f4f5',
      border: '#e4e4e7',
      text: '#18181b',
      muted: '#71717a',
      accent: '#3b82f6'
    };

    const cardHTML = `
      <div style="
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        background: ${colors.bg};
        padding: 40px 48px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <!-- Header -->
        <div style="text-align: center;">
          <div style="font-size: 38px; font-weight: 900; color: ${colors.text}; margin-bottom: 6px;">
            🏆 GSoC Org Finder
          </div>
          <div style="font-size: 22px; color: ${colors.muted}; font-weight: 600;">
            My Achievements
          </div>
        </div>

        <!-- Stats Grid -->
        <div style="
          background: ${colors.cardBg};
          border: 2px solid ${colors.border};
          border-radius: 16px;
          padding: 24px 28px;
        ">
          <div style="font-size: 16px; font-weight: 700; color: ${colors.muted}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
            📊 EXPLORATION STATS
          </div>
          
          ${Object.keys(BADGE_NAMES).map((badgeType, index) => {
            const count = badgeData[badgeType] || 0;
            const level = getBadgeLevel(badgeType, count);
            const emoji = BADGE_EMOJIS[badgeType];
            const name = BADGE_NAMES[badgeType];
            const levelText = level ? `[${level.levelName} ${level.stars}]` : '[Locked 🔒]';
            const isLast = index === Object.keys(BADGE_NAMES).length - 1;
            
            return `
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 0;
                ${!isLast ? `border-bottom: 1px solid ${colors.border};` : ''}
              ">
                <div style="font-size: 17px; color: ${colors.text}; font-weight: 600;">
                  ${emoji} ${name}: ${count}
                </div>
                <div style="font-size: 15px; color: ${level ? colors.accent : colors.muted}; font-weight: 700;">
                  ${levelText}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Summary -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, ${colors.accent}22, ${colors.accent}11);
          border: 2px solid ${colors.accent};
          border-radius: 16px;
          padding: 20px 28px;
        ">
          <div style="font-size: 26px; font-weight: 900; color: ${colors.text}; margin-bottom: 6px;">
            🎯 ${unlockedCount}/${totalCount} Badges Unlocked
          </div>
          ${topAchievement ? `
            <div style="font-size: 17px; color: ${colors.muted}; font-weight: 600;">
              🌟 Top Achievement: ${BADGE_LEVELS[topAchievement.level]} ${BADGE_NAMES[topAchievement.type]}
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          font-size: 16px;
          color: ${colors.muted};
          font-weight: 600;
        ">
          findmygsoc.vercel.app
        </div>
      </div>
    `;

    return cardHTML;
  }

  /**
   * Generate and download the badge card
   */
  async function generateCard() {
    try {
      // Check if html2canvas is loaded
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library not loaded');
      }

      // Get badge data
      const badgeData = typeof BadgeSystem !== 'undefined' ? BadgeSystem.getBadgeData() : null;
      if (!badgeData) {
        throw new Error('Badge data not available');
      }

      // Get current theme
      const theme = getCurrentTheme();

      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.innerHTML = createCardHTML(badgeData, theme);
      document.body.appendChild(container);

      // Generate canvas
      const canvas = await html2canvas(container.firstElementChild, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        scale: 1,
        backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
        logging: false
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Convert to blob and download
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `gsoc-badges-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // Show success notification
        showSuccessNotification('Achievement card downloaded! 🎉');
      }, 'image/png');

    } catch (error) {
      console.error('Error generating card:', error);
      showErrorNotification('Failed to generate card. Please try again.');
    }
  }

  /**
   * Show card preview modal
   */
  async function showPreview() {
    try {
      // Check if html2canvas is loaded
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library not loaded');
      }

      // Get badge data
      const badgeData = typeof BadgeSystem !== 'undefined' ? BadgeSystem.getBadgeData() : null;
      if (!badgeData) {
        throw new Error('Badge data not available');
      }

      // Get current theme
      const theme = getCurrentTheme();

      // Create preview modal
      const modal = document.createElement('div');
      modal.id = 'cardPreviewModal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: var(--bg);
        border-radius: 16px;
        padding: 24px;
        max-width: 95%;
        max-height: 95%;
        overflow: auto;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      // Create preview title
      const title = document.createElement('h3');
      title.textContent = 'Preview Your Achievement Card';
      title.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
        margin-bottom: 16px;
        text-align: center;
      `;

      // Create temporary container for preview
      const previewContainer = document.createElement('div');
      previewContainer.innerHTML = createCardHTML(badgeData, theme);
      previewContainer.style.cssText = `
        transform: scale(0.5);
        transform-origin: top center;
        margin-bottom: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        overflow: hidden;
      `;

      // Add buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 24px;
      `;

      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '<span style="font-size:18px;margin-right:6px">📥</span> DOWNLOAD PNG';
      downloadBtn.style.cssText = `
        flex: 1;
        min-width: 180px;
        padding: 14px 20px;
        background: #9d4300;
        color: white;
        border: none;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
        letter-spacing: 0.05em;
        transition: all 0.2s;
        text-align: center;
        text-transform: uppercase;
      `;
      downloadBtn.onmouseover = () => {
        downloadBtn.style.transform = 'translateY(-2px)';
        downloadBtn.style.boxShadow = '0 4px 12px rgba(157, 67, 0, 0.3)';
      };
      downloadBtn.onmouseout = () => {
        downloadBtn.style.transform = 'translateY(0)';
        downloadBtn.style.boxShadow = 'none';
      };
      downloadBtn.onclick = () => {
        document.body.removeChild(modal);
        generateCard();
      };

      // Social share buttons
      const twitterBtn = document.createElement('button');
      twitterBtn.innerHTML = '<span style="font-size:18px;margin-right:6px">🐦</span> TWITTER';
      twitterBtn.style.cssText = `
        flex: 1;
        min-width: 140px;
        padding: 14px 20px;
        background: #1DA1F2;
        color: white;
        border: none;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
        letter-spacing: 0.05em;
        transition: all 0.2s;
        text-align: center;
        text-transform: uppercase;
      `;
      twitterBtn.onmouseover = () => {
        twitterBtn.style.transform = 'translateY(-2px)';
        twitterBtn.style.boxShadow = '0 4px 12px rgba(29, 161, 242, 0.3)';
      };
      twitterBtn.onmouseout = () => {
        twitterBtn.style.transform = 'translateY(0)';
        twitterBtn.style.boxShadow = 'none';
      };
      twitterBtn.onclick = () => {
        shareOnSocial('twitter');
        document.body.removeChild(modal);
      };

      const linkedinBtn = document.createElement('button');
      linkedinBtn.innerHTML = '<span style="font-size:18px;margin-right:6px">💼</span> LINKEDIN';
      linkedinBtn.style.cssText = `
        flex: 1;
        min-width: 140px;
        padding: 14px 20px;
        background: #0A66C2;
        color: white;
        border: none;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
        letter-spacing: 0.05em;
        transition: all 0.2s;
        text-align: center;
        text-transform: uppercase;
      `;
      linkedinBtn.onmouseover = () => {
        linkedinBtn.style.transform = 'translateY(-2px)';
        linkedinBtn.style.boxShadow = '0 4px 12px rgba(10, 102, 194, 0.3)';
      };
      linkedinBtn.onmouseout = () => {
        linkedinBtn.style.transform = 'translateY(0)';
        linkedinBtn.style.boxShadow = 'none';
      };
      linkedinBtn.onclick = () => {
        shareOnSocial('linkedin');
        document.body.removeChild(modal);
      };

      const facebookBtn = document.createElement('button');
      facebookBtn.innerHTML = '<span style="font-size:18px;margin-right:6px">📘</span> FACEBOOK';
      facebookBtn.style.cssText = `
        flex: 1;
        min-width: 140px;
        padding: 14px 20px;
        background: #1877F2;
        color: white;
        border: none;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
        letter-spacing: 0.05em;
        transition: all 0.2s;
        text-align: center;
        text-transform: uppercase;
      `;
      facebookBtn.onmouseover = () => {
        facebookBtn.style.transform = 'translateY(-2px)';
        facebookBtn.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.3)';
      };
      facebookBtn.onmouseout = () => {
        facebookBtn.style.transform = 'translateY(0)';
        facebookBtn.style.boxShadow = 'none';
      };
      facebookBtn.onclick = () => {
        shareOnSocial('facebook');
        document.body.removeChild(modal);
      };

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '<span style="font-size:18px;margin-right:6px">✕</span> CLOSE';
      closeBtn.style.cssText = `
        flex: 1;
        min-width: 140px;
        padding: 14px 20px;
        background: #f3f3f3;
        color: #1a1c1c;
        border: 1px solid #e2e2e2;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
        letter-spacing: 0.05em;
        transition: all 0.2s;
        text-align: center;
        text-transform: uppercase;
      `;
      closeBtn.onmouseover = () => {
        closeBtn.style.background = '#e8e8e8';
        closeBtn.style.transform = 'translateY(-2px)';
        closeBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.background = '#f3f3f3';
        closeBtn.style.transform = 'translateY(0)';
        closeBtn.style.boxShadow = 'none';
      };
      closeBtn.onclick = () => document.body.removeChild(modal);

      buttonContainer.appendChild(downloadBtn);
      buttonContainer.appendChild(twitterBtn);
      buttonContainer.appendChild(linkedinBtn);
      buttonContainer.appendChild(facebookBtn);
      buttonContainer.appendChild(closeBtn);

      modalContent.appendChild(title);
      modalContent.appendChild(previewContainer);
      modalContent.appendChild(buttonContainer);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Close on background click
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      };

    } catch (error) {
      console.error('Error showing preview:', error);
      showErrorNotification('Failed to show preview. Please try again.');
    }
  }

  /**
   * Share on social media
   */
  function shareOnSocial(platform) {
    const badgeData = typeof BadgeSystem !== 'undefined' ? BadgeSystem.getBadgeData() : null;
    if (!badgeData) {
      showErrorNotification('Badge data not available');
      return;
    }

    const unlockedCount = badgeData.unlockedBadges ? badgeData.unlockedBadges.length : 0;
    const topAchievement = getTopAchievement(badgeData);
    const topText = topAchievement ? `${BADGE_LEVELS[topAchievement.level]} ${BADGE_NAMES[topAchievement.type]}` : 'Explorer';

    const shareText = `🏆 Just unlocked ${unlockedCount}/16 badges on GSoC Org Finder!\n🔍 ${topText}\nExploring #GSoC2026 organizations 🚀`;
    const shareUrl = 'https://findmygsoc.vercel.app';

    let url;
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  }

  /**
   * Show success notification
   */
  function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  /**
   * Show error notification
   */
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => document.body.removeChild(notification), 3000);
  }

  // Public API
  return {
    generateCard: generateCard,
    showPreview: showPreview,
    shareOnSocial: shareOnSocial
  };
})();

// Make it globally available
if (typeof window !== 'undefined') {
  window.BadgeCardGenerator = BadgeCardGenerator;
}
