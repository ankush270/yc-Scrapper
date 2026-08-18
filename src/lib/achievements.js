import { getStat, incrementStat, getSetting, setSetting, getDB } from './storage';

export const BADGES = {
  explorer: {
    id: 'explorer',
    name: '🔍 EXPLORER',
    description: 'Browse and view 20 YC companies',
    threshold: 20,
    icon: 'Compass',
    color: '#00bce6'
  },
  analyst: {
    id: 'analyst',
    name: '📝 ANALYST',
    description: 'Write 5 study notes or takeaways',
    threshold: 5,
    icon: 'Notebook',
    color: '#fbbf24'
  },
  builder: {
    id: 'builder',
    name: '🏗️ BUILDER',
    description: 'Create 3 projects in the Sandbox Kanban',
    threshold: 3,
    icon: 'Hammer',
    color: '#00d37e'
  },
  ai_whisperer: {
    id: 'ai_whisperer',
    name: '🤖 AI WHISPERER',
    description: 'Run 5 AI analyses on startups',
    threshold: 5,
    icon: 'Cpu',
    color: '#a855f7'
  },
  streak_master: {
    id: 'streak_master',
    name: '🔥 STREAK MASTER',
    description: 'Complete 3 daily challenges',
    threshold: 3,
    icon: 'Zap',
    color: '#e60073'
  },
  global_thinker: {
    id: 'global_thinker',
    name: '🌍 GLOBAL THINKER',
    description: 'Explore companies in 3+ regions',
    threshold: 3,
    icon: 'Globe',
    color: '#3b82f6'
  },
  curator: {
    id: 'curator',
    name: '⭐ CURATOR',
    description: 'Create 2 named collections',
    threshold: 2,
    icon: 'Folder',
    color: '#ff7700'
  }
};

/**
 * Increment a stat counter and check if any new badge is unlocked.
 * Returns the unlocked badge if a new achievement is completed.
 */
export async function trackUserAction(actionKey, incrementAmount = 1) {
  // 1. Update the stat in storage
  const currentCount = await incrementStat(actionKey, incrementAmount);

  // 2. Find corresponding badge
  let targetBadgeId = null;
  if (actionKey === 'companies_viewed') targetBadgeId = 'explorer';
  else if (actionKey === 'notes_written') targetBadgeId = 'analyst';
  else if (actionKey === 'sandbox_projects_created') targetBadgeId = 'builder';
  else if (actionKey === 'ai_analyses_run') targetBadgeId = 'ai_whisperer';
  else if (actionKey === 'challenges_completed') targetBadgeId = 'streak_master';
  else if (actionKey === 'regions_explored') targetBadgeId = 'global_thinker';
  else if (actionKey === 'collections_created') targetBadgeId = 'curator';

  if (!targetBadgeId) return null;

  const badge = BADGES[targetBadgeId];
  if (!badge) return null;

  // 3. Check if badge is already unlocked
  const isUnlockedKey = `badge_unlocked_${targetBadgeId}`;
  const alreadyUnlocked = await getSetting(isUnlockedKey);
  if (alreadyUnlocked) return null;

  // 4. Evaluate threshold
  if (currentCount >= badge.threshold) {
    await setSetting(isUnlockedKey, Date.now());
    
    // Add to achievements database
    const db = await getDB();
    await db.put('achievements', {
      id: targetBadgeId,
      unlockedAt: Date.now(),
      name: badge.name,
      description: badge.description
    });

    // Trigger a custom event to notify the UI
    const event = new CustomEvent('yc_achievement_unlocked', { detail: badge });
    window.dispatchEvent(event);

    return badge;
  }

  return null;
}

export async function getUnlockedAchievements() {
  try {
    const db = await getDB();
    return db.getAll('achievements');
  } catch (e) {
    return [];
  }
}
