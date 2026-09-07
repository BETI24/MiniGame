import { WEAPONS, unlockedTypes, newlyUnlockedTypes } from "./MergeShootData.js";

export function xpNeeded(level) {
  return Math.round(115 + 52 * Math.pow(Math.max(1, level), 1.27));
}

export function battleXp(stage, win) {
  return Math.round((win ? 92 : 34) + Math.pow(stage, .82) * (win ? 17 : 7));
}

export function levelReward(level) {
  if (level % 10 === 0) return { gold: 3000 + level * 220, gems: 80, keys: 2, label: "MEGA REWARD" };
  if (level % 5 === 0) return { gold: 1200 + level * 140, gems: 30, keys: 1, label: "CHEST KEY" };
  if (level % 3 === 0) return { gold: 700 + level * 100, gems: 12, keys: 0, label: "GEMS" };
  return { gold: 500 + level * 85, gems: 0, keys: 0, label: "GOLD" };
}

export function grantXp(state, amount) {
  const rewards = [], fromLevel = state.level;
  state.xp += amount;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level++;
    const reward = levelReward(state.level);
    state.gold += reward.gold || 0;
    state.gems += reward.gems || 0;
    state.keys += reward.keys || 0;
    rewards.push({ level: state.level, ...reward });
  }
  return { fromLevel, toLevel: state.level, rewards };
}

export function stageClearRewards(state, playedStage, win) {
  const xp = battleXp(playedStage, win);
  const progress = grantXp(state, xp);
  const extras = { gold: 0, gems: 0, keys: 0 };
  if (win && playedStage % 5 === 0) { extras.gems += 8 + Math.floor(playedStage / 5) * 2; state.gems += extras.gems; }
  if (win && playedStage % 10 === 0) { extras.keys += 1; state.keys += 1; }
  return { xp, ...progress, extras };
}

export function unlocksForClear(playedStage) {
  return newlyUnlockedTypes(playedStage, playedStage + 1).map(type => ({ type, ...WEAPONS[type] }));
}

export function battlePower(grid) {
  let power = 0;
  for (const w of grid) if (w) {
    const base = WEAPONS[w.type];
    if (!base) continue;
    const rarity = { Common: 1, Uncommon: 1.12, Rare: 1.28, Epic: 1.48 }[base.rarity] || 1;
    power += Math.round((18 + Math.pow(1.56, w.rank) * 22) * rarity);
  }
  return power;
}

export function collectionProgress(stage) {
  const unlocked = unlockedTypes(stage).length;
  return { unlocked, total: Object.keys(WEAPONS).length };
}
