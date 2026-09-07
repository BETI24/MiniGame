export const BATTLE_CELL = 54;
export const ROAD_HORIZON_Y = 76;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function formationBaseY(height) {
  return height * 0.735;
}

export function projectDistance(distance, height) {
  const base = formationBaseY(height);
  const y = base - distance * 0.72;
  const t = clamp((y - ROAD_HORIZON_Y) / Math.max(1, base - ROAD_HORIZON_Y), 0, 1);
  const scale = 0.52 + t * 0.58;
  return { y, scale, t };
}

export function projectBlock(state, block, height) {
  const p = projectDistance(block.y - state.world, height);
  const xScale = 0.58 + p.t * 0.42;
  return { ...p, x: block.x * xScale, xScale };
}

export function formationCellPosition(state, index, height) {
  return {
    x: state.teamX + (index % 5 - 2) * BATTLE_CELL,
    y: formationBaseY(height) + state.teamY + (Math.floor(index / 5) - 2) * BATTLE_CELL,
  };
}

export function roadHalfWidthAtY(width, height, y) {
  const bottom = Math.min(360, width * 0.45);
  const top = Math.min(118, width * 0.17);
  const base = height * 0.96;
  const t = clamp((y - ROAD_HORIZON_Y) / Math.max(1, base - ROAD_HORIZON_Y), 0, 1);
  return top + (bottom - top) * t;
}
