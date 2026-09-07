import { WEAPONS, TYPES, PURCHASE_TIERS, weaponStats, rankLabel, RARITY_COLORS, STAGE_COLORS, purchaseCost } from "./MergeShootData.js";
import { xpNeeded, levelReward, battlePower, collectionProgress } from "./MergeShootProgression.js";
import { clamp, formationBaseY, formationCellPosition, projectBlock, projectDistance, roadHalfWidthAtY, ROAD_HORIZON_Y } from "./MergeShootBattleMath.js";

const TAU = Math.PI * 2;
const finite = (v, d = 0) => Number.isFinite(v) ? v : d;
const animTime = () => (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
const shortNum = n => n >= 1000000 ? `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${Math.max(0, Math.ceil(n || 0))}`;
const hexAlpha = (hex, alpha = "ff") => /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;

// Safe rounded rectangle. Canvas roundRect throws if radius becomes negative; that happened while
// GameHub briefly measured the game container at ~0 px during a resize / tab transition.
const rr = (c, x, y, w, h, r = 0) => {
  x = finite(x); y = finite(y); w = finite(w); h = finite(h); r = Math.abs(finite(r));
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  w = Math.max(0, w); h = Math.max(0, h); r = Math.max(0, Math.min(r, w * .5, h * .5));
  c.beginPath();
  if (w < .001 || h < .001) { c.rect(x, y, Math.max(.001, w), Math.max(.001, h)); return; }
  if (typeof c.roundRect === "function") { c.roundRect(x, y, w, h, r); return; }
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
};

const text = (c, t, x, y, size = 20, fill = "#fff", align = "center", stroke = "#06172c", weight = 900) => {
  size = Math.max(5, finite(size, 12));
  c.font = `${weight} ${size}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial`;
  c.textAlign = align; c.textBaseline = "middle"; c.lineJoin = "round";
  c.lineWidth = Math.max(1.5, size * .125); c.strokeStyle = stroke; c.strokeText(String(t), x, y);
  c.fillStyle = fill; c.fillText(String(t), x, y);
};

const pill = (c, x, y, w, h, fill, stroke = "#ffffff33") => {
  rr(c, x, y, w, h, h * .5); c.fillStyle = fill; c.fill(); c.strokeStyle = stroke; c.lineWidth = 2; c.stroke();
};

const panel = (c, x, y, w, h, top = "#175e9e", bottom = "#0d355d", radius = 20) => {
  c.save(); c.shadowColor = "#03101fb5"; c.shadowBlur = 16; c.shadowOffsetY = 8;
  rr(c, x, y, w, h, radius); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fill();
  c.shadowBlur = 0; c.strokeStyle = "#071a31"; c.lineWidth = 4; c.stroke(); c.strokeStyle = "#ffffff2e"; c.lineWidth = 2; rr(c, x + 3, y + 3, w - 6, h - 6, Math.max(3, radius - 3)); c.stroke(); c.restore();
};

export function layout(W, H) {
  W = Math.max(1, finite(W, 1)); H = Math.max(1, finite(H, 1));
  const side = Math.max(1, Math.min(W * .94, 720));
  const heightCell = Math.max(48, (H - 310) / 5.65);
  const cell = Math.max(1, Math.min(78, side / 6.08, heightCell));
  return { W, H, cx: W / 2, side, top: 18, cell, gridY: Math.max(142, Math.min(170, H * .19)) };
}

export function getBuildUI(L) {
  const gridBottom = L.gridY + L.cell * 5;
  const rowW = Math.max(1, Math.min(L.side, 590)), gap = Math.min(8, rowW * .02);
  const purchaseY = Math.min(L.H - 186, gridBottom + 42), pw = Math.max(1, (rowW - gap * 2) / 3), left = L.cx - rowW / 2;
  const actionY = Math.min(L.H - 105, purchaseY + 78);
  return {
    level: { x: 12, y: 12, w: Math.min(126, L.W * .3), h: 52 },
    chests: { x: L.W - Math.min(116, L.W * .27) - 12, y: 12, w: Math.min(116, L.W * .27), h: 52 },
    purchases: [0, 1, 2].map(i => ({ x: left + i * (pw + gap), y: purchaseY, w: pw, h: 68 })),
    bag: { x: L.cx - rowW / 2, y: actionY, w: 112, h: 72 },
    battle: { x: L.cx - 122, y: actionY, w: 244, h: 72 },
    collection: { x: L.cx + rowW / 2 - 112, y: actionY, w: 112, h: 72 },
    gridBottom, purchaseY, actionY
  };
}

export function getPanelUI(L, s) {
  const w = Math.max(1, Math.min(600, L.W - 20)), x = L.cx - w / 2, y = Math.max(66, L.H * .08), h = Math.max(1, Math.min(L.H - y - 18, 700));
  const out = { panel: { x, y, w, h }, close: { x: x + w - 52, y: y + 12, w: 38, h: 38 }, bagRects: [], chestRects: [] };
  if (s.panel === "bag") {
    const cols = L.W < 520 ? 4 : 5, gap = 8, card = Math.max(18, Math.min(84, (w - 36 - gap * (cols - 1)) / cols));
    const sx = L.cx - (cols * card + (cols - 1) * gap) / 2, sy = y + 100;
    for (let i = 0; i < Math.min(30, s.bag.length); i++) out.bagRects.push({ x: sx + (i % cols) * (card + gap), y: sy + Math.floor(i / cols) * (card + 20), w: card, h: card, index: i });
  }
  if (s.panel === "chests") {
    const cw = Math.max(90, Math.min(210, w * .39));
    out.chestRects = [
      { x: L.cx - cw - 10, y: y + 145, w: cw, h: Math.min(232, h - 185), kind: "key" },
      { x: L.cx + 10, y: y + 145, w: cw, h: Math.min(232, h - 185), kind: "gems" }
    ];
  }
  return out;
}

export function getResultUI(L) {
  const w = Math.max(1, Math.min(530, L.W * .9)), x = L.cx - w / 2, y = Math.max(78, L.H * .16), h = Math.min(445, L.H - y - 36);
  return { panel: { x, y, w, h }, continue: { x: L.cx - 118, y: y + h - 77, w: 236, h: 61 } };
}

function buildBackground(c, L, s) {
  const [a, b] = STAGE_COLORS[(Math.max(1, s.stage) - 1) % STAGE_COLORS.length];
  const bg = c.createLinearGradient(0, 0, 0, L.H); bg.addColorStop(0, "#0b89cf"); bg.addColorStop(.42, a); bg.addColorStop(1, "#07518f"); c.fillStyle = bg; c.fillRect(0, 0, L.W, L.H);
  const glow = c.createRadialGradient(L.cx, L.H * .35, 20, L.cx, L.H * .35, Math.max(L.W, L.H) * .62); glow.addColorStop(0, "#b9f7ff44"); glow.addColorStop(.45, hexAlpha(b, "20")); glow.addColorStop(1, "#03163000"); c.fillStyle = glow; c.fillRect(0, 0, L.W, L.H);
  const t = animTime();
  c.save(); c.globalAlpha = .11; c.fillStyle = "#d7fbff";
  for (let i = 0; i < 13; i++) { const x = ((i * 83.7 + t * (10 + i % 4) * 7) % (L.W + 100)) - 50, y = 70 + (i * 113.9 % Math.max(100, L.H - 100)); c.beginPath(); c.arc(x, y, 2 + (i % 4), 0, TAU); c.fill(); }
  c.globalAlpha = .08; c.strokeStyle = "#fff"; c.lineWidth = 2;
  for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(L.cx, 78); c.lineTo(L.cx + i * 90, L.H * .84); c.stroke(); }
  c.restore();
}

function drawGem(c, x, y, r) {
  c.save(); c.translate(x, y); const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, "#ff6cff"); g.addColorStop(.45, "#d72dff"); g.addColorStop(1, "#6d19df"); c.fillStyle = g; c.strokeStyle = "#5f0e8a"; c.lineWidth = Math.max(1, r * .12);
  c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .72, -r * .18); c.lineTo(0, r); c.lineTo(-r * .72, -r * .18); c.closePath(); c.fill(); c.stroke();
  c.globalAlpha = .65; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-r * .18, -r * .65); c.lineTo(r * .15, -r * .25); c.lineTo(-r * .07, r * .2); c.closePath(); c.fill(); c.restore();
}

function drawCoin(c, x, y, r) {
  c.save(); c.translate(x, y); c.shadowColor = "#ffd139"; c.shadowBlur = r * .45; const g = c.createRadialGradient(-r * .32, -r * .4, 2, 0, 0, r); g.addColorStop(0, "#fff69b"); g.addColorStop(.35, "#ffd52d"); g.addColorStop(1, "#f18a00"); c.fillStyle = g; c.strokeStyle = "#9e5700"; c.lineWidth = Math.max(1.5, r * .13); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = "#fff3a2"; c.lineWidth = Math.max(1, r * .08); c.beginPath(); c.arc(-r * .1, -r * .1, r * .58, -2.6, -.45); c.stroke(); c.restore();
}

function drawChest(c, x, y, s, purple = false) {
  c.save(); c.translate(x, y); c.shadowColor = purple ? "#d565ff" : "#ffd23a"; c.shadowBlur = s * .25; const g = c.createLinearGradient(0, -s * .4, 0, s * .45); g.addColorStop(0, purple ? "#c64aff" : "#ffdf49"); g.addColorStop(1, purple ? "#7223bb" : "#d17b12"); c.fillStyle = g; c.strokeStyle = "#3b244e"; c.lineWidth = Math.max(2, s * .06); rr(c, -s * .42, -s * .28, s * .84, s * .62, s * .12); c.fill(); c.stroke(); c.fillStyle = "#6b3b24"; rr(c, -s * .48, -s * .18, s * .96, s * .18, s * .05); c.fill(); c.stroke(); c.fillStyle = "#fff2a1"; rr(c, -s * .08, -s * .05, s * .16, s * .22, s * .04); c.fill(); c.restore();
}

function drawWeaponGlyph(c, type, size) {
  const w = WEAPONS[type] || WEAPONS.blaster, S = size;
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#142943"; c.lineWidth = Math.max(2, S * .055);
  const metal = c.createLinearGradient(-S * .3, -S * .3, S * .3, S * .3); metal.addColorStop(0, "#f4fdff"); metal.addColorStop(.35, "#9cdbea"); metal.addColorStop(.68, "#4f7d9a"); metal.addColorStop(1, "#28415a");
  const hot = w.accent;

  if (type === "blaster") {
    c.rotate(-.12); c.fillStyle = metal; rr(c,-S*.31,-S*.12,S*.48,S*.25,S*.055);c.fill();c.stroke(); c.fillStyle="#50749a";rr(c,-S*.04,S*.08,S*.13,S*.22,S*.04);c.fill();c.stroke(); c.fillStyle=hot;c.shadowColor=hot;c.shadowBlur=S*.17;rr(c,S*.02,-S*.075,S*.33,S*.1,S*.04);c.fill();c.beginPath();c.arc(S*.31,-S*.025,S*.07,0,TAU);c.fill();
  } else if (type === "rockets") {
    c.fillStyle="#44576b";rr(c,-S*.35,-S*.02,S*.7,S*.3,S*.055);c.fill();c.stroke(); for(let i=-1;i<=1;i++){const xx=i*S*.2;c.fillStyle="#eef9ff";c.beginPath();c.ellipse(xx,-S*.16,S*.075,S*.22,0,0,TAU);c.fill();c.stroke();c.fillStyle="#f45742";c.beginPath();c.arc(xx,-S*.29,S*.075,0,TAU);c.fill();c.fillStyle="#ffcc4f";c.beginPath();c.moveTo(xx-S*.045,S*.04);c.lineTo(xx,S*.19);c.lineTo(xx+S*.045,S*.04);c.fill();}
  } else if (type === "bubbles") {
    c.fillStyle=metal; c.save();c.rotate(-.28);rr(c,-S*.28,-S*.12,S*.43,S*.25,S*.06);c.fill();c.stroke();c.fillStyle="#304865";rr(c,-S*.08,S*.06,S*.12,S*.22,S*.035);c.fill();c.stroke();c.restore(); for(const [x,y,r] of [[.22,-.13,.18],[.31,.11,.12],[-.02,-.25,.1]]){const g=c.createRadialGradient(x*S-r*S*.3,y*S-r*S*.3,1,x*S,y*S,r*S);g.addColorStop(0,"#fff");g.addColorStop(.26,"#bafaff");g.addColorStop(.7,"#5bdcf4aa");g.addColorStop(1,"#6a5cff55");c.fillStyle=g;c.strokeStyle="#dfffff";c.beginPath();c.arc(x*S,y*S,r*S,0,TAU);c.fill();c.stroke();}
  } else if (type === "shield") {
    const g=c.createLinearGradient(-S*.28,-S*.3,S*.25,S*.3);g.addColorStop(0,"#e9ffff");g.addColorStop(.4,"#9ee6ef");g.addColorStop(1,"#3a94b8");c.fillStyle=g;c.beginPath();c.moveTo(0,-S*.34);c.quadraticCurveTo(S*.31,-S*.25,S*.29,S*.02);c.quadraticCurveTo(S*.24,S*.27,0,S*.36);c.quadraticCurveTo(-S*.24,S*.27,-S*.29,S*.02);c.quadraticCurveTo(-S*.31,-S*.25,0,-S*.34);c.closePath();c.fill();c.stroke();c.strokeStyle="#f5ffff";c.lineWidth=S*.055;c.beginPath();c.moveTo(-S*.1,-S*.24);c.lineTo(-S*.15,S*.2);c.stroke();
  } else if (type === "cannon") {
    c.fillStyle="#47634e";rr(c,-S*.28,-S*.16,S*.43,S*.34,S*.07);c.fill();c.stroke();c.fillStyle="#344a3b";c.beginPath();c.arc(-S*.2,S*.18,S*.11,0,TAU);c.arc(S*.06,S*.18,S*.11,0,TAU);c.fill();c.stroke();c.fillStyle=metal;rr(c,-S*.02,-S*.075,S*.39,S*.15,S*.045);c.fill();c.stroke();c.fillStyle=hot;c.beginPath();c.arc(S*.33,0,S*.07,0,TAU);c.fill();
  } else if (type === "splitter") {
    c.fillStyle=metal;c.beginPath();c.arc(-S*.03,S*.02,S*.23,0,TAU);c.fill();c.stroke();c.fillStyle="#172946";c.beginPath();c.arc(-S*.03,S*.02,S*.11,0,TAU);c.fill();c.fillStyle=hot;c.shadowColor=hot;c.shadowBlur=S*.16;for(const a of [-.64,.64]){c.save();c.rotate(a);rr(c,S*.04,-S*.04,S*.34,S*.08,S*.035);c.fill();c.restore();}c.fillStyle="#baffff";c.beginPath();c.arc(-S*.03,S*.02,S*.055,0,TAU);c.fill();
  } else if (type === "fire") {
    for(const [x,y,sc] of [[-.2,.06,.92],[.03,-.04,1.05],[.23,.08,.86]]){c.save();c.translate(x*S,y*S);c.shadowColor="#ff6a24";c.shadowBlur=S*.18;c.fillStyle="#ff5a2a";c.beginPath();c.moveTo(-S*.09,S*.16);c.quadraticCurveTo(-S*.15,-S*.04,0,-S*.27*sc);c.quadraticCurveTo(S*.16,-S*.02,S*.1,S*.16);c.closePath();c.fill();c.fillStyle="#fff0a2";c.beginPath();c.arc(0,S*.03,S*.07,0,TAU);c.fill();c.restore();}
  } else if (type === "gravity") {
    const g=c.createRadialGradient(-S*.05,-S*.06,2,0,0,S*.31);g.addColorStop(0,"#f8c4ff");g.addColorStop(.23,"#9c36d7");g.addColorStop(.64,"#26063c");g.addColorStop(1,"#05010b");c.fillStyle=g;c.shadowColor="#d85cff";c.shadowBlur=S*.24;c.beginPath();c.arc(0,0,S*.29,0,TAU);c.fill();c.strokeStyle="#f294ff";c.lineWidth=S*.045;for(let i=0;i<2;i++){c.save();c.rotate(i*.7-.3);c.beginPath();c.ellipse(0,0,S*(.4-i*.04),S*(.14+i*.02),0,0,TAU);c.stroke();c.restore();}
  } else if (type === "needle") {
    c.fillStyle="#334e67";rr(c,-S*.28,-S*.12,S*.38,S*.24,S*.05);c.fill();c.stroke();c.fillStyle=metal;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(S*.02,i*S*.055);c.lineTo(S*.36,i*S*.055-S*.02);c.lineTo(S*.02,i*S*.055+S*.02);c.closePath();c.fill();}c.fillStyle="#5fefff";c.shadowColor="#5fefff";c.shadowBlur=S*.15;c.beginPath();c.arc(-S*.16,0,S*.07,0,TAU);c.fill();
  } else if (type === "laser") {
    c.save();c.rotate(-.1);c.fillStyle="#263c55";rr(c,-S*.34,-S*.15,S*.5,S*.3,S*.055);c.fill();c.stroke();c.fillStyle=metal;rr(c,-S*.03,-S*.09,S*.25,S*.18,S*.04);c.fill();c.stroke();c.shadowColor="#8df8ff";c.shadowBlur=S*.23;c.fillStyle="#eaffff";rr(c,S*.08,-S*.055,S*.34,S*.11,S*.04);c.fill();c.restore();
  } else if (type === "tesla") {
    c.fillStyle="#304b69";c.beginPath();c.arc(-S*.24,S*.22,S*.11,0,TAU);c.arc(S*.25,-S*.23,S*.11,0,TAU);c.fill();c.stroke();c.strokeStyle="#dcffff";c.shadowColor="#6cf0ff";c.shadowBlur=S*.22;c.lineWidth=S*.07;c.beginPath();c.moveTo(-S*.24,S*.22);c.lineTo(-S*.05,S*.02);c.lineTo(S*.04,S*.09);c.lineTo(S*.13,-S*.08);c.lineTo(S*.25,-S*.23);c.stroke();
  } else if (type === "shard") {
    c.fillStyle="#d8fff2";c.shadowColor="#5affc6";c.shadowBlur=S*.14;for(const a of [-.74,-.36,0,.36,.74]){c.save();c.rotate(a);c.beginPath();c.moveTo(0,-S*.32);c.lineTo(S*.075,S*.12);c.lineTo(-S*.075,S*.12);c.closePath();c.fill();c.stroke();c.restore();}
  } else if (type === "nuke") {
    c.save();c.rotate(-.55);c.fillStyle="#323b48";c.beginPath();c.ellipse(0,0,S*.17,S*.36,0,0,TAU);c.fill();c.stroke();c.fillStyle="#ff992c";c.beginPath();c.arc(0,S*.02,S*.095,0,TAU);c.fill();c.fillStyle="#fff3a6";c.beginPath();c.arc(0,S*.02,S*.035,0,TAU);c.fill();c.fillStyle="#313847";c.beginPath();c.moveTo(-S*.14,S*.22);c.lineTo(-S*.3,S*.34);c.lineTo(-S*.12,S*.08);c.fill();c.beginPath();c.moveTo(S*.14,S*.22);c.lineTo(S*.3,S*.34);c.lineTo(S*.12,S*.08);c.fill();c.restore();
  } else if (type === "acid") {
    c.fillStyle="#42545e";rr(c,-S*.3,-S*.12,S*.45,S*.24,S*.05);c.fill();c.stroke();c.fillStyle="#89e844";rr(c,S*.02,-S*.06,S*.3,S*.12,S*.04);c.fill();c.shadowColor="#a9ff50";c.shadowBlur=S*.18;c.fillStyle="#b7ff65";for(const [x,y,r] of [[.32,0,.08],[.23,.2,.05]]){c.beginPath();c.arc(x*S,y*S,r*S,0,TAU);c.fill();}
  } else if (type === "railgun") {
    c.save();c.rotate(-.12);c.fillStyle="#2a3e59";rr(c,-S*.38,-S*.12,S*.66,S*.24,S*.045);c.fill();c.stroke();c.fillStyle=metal;rr(c,-S*.18,-S*.06,S*.55,S*.12,S*.035);c.fill();c.shadowColor="#8ffaff";c.shadowBlur=S*.22;c.fillStyle="#eaffff";rr(c,S*.12,-S*.035,S*.3,S*.07,S*.03);c.fill();c.restore();
  } else if (type === "wave") {
    c.fillStyle="#37485d";rr(c,-S*.34,-S*.15,S*.38,S*.3,S*.06);c.fill();c.stroke();c.strokeStyle="#f29cff";c.shadowColor="#df58ff";c.shadowBlur=S*.2;c.lineWidth=S*.065;for(let i=0;i<3;i++){c.beginPath();c.arc(-S*.05+i*S*.06,0,S*(.16+i*.085),-1.05,1.05);c.stroke();}
  } else if (type === "mortar") {
    c.fillStyle="#45554c";rr(c,-S*.28,S*.03,S*.48,S*.22,S*.06);c.fill();c.stroke();c.save();c.rotate(-.72);c.fillStyle="#293a45";rr(c,-S*.085,-S*.34,S*.17,S*.5,S*.04);c.fill();c.stroke();c.fillStyle="#f0c448";rr(c,-S*.08,-S*.27,S*.16,S*.1,S*.03);c.fill();c.restore();
  } else if (type === "flame") {
    c.fillStyle="#3f4f5c";rr(c,-S*.3,-S*.12,S*.46,S*.24,S*.05);c.fill();c.stroke();c.fillStyle="#ff8b31";rr(c,S*.03,-S*.06,S*.3,S*.12,S*.04);c.fill();c.shadowColor="#ff5f22";c.shadowBlur=S*.22;c.fillStyle="#ff6a26";c.beginPath();c.moveTo(S*.31,-S*.1);c.quadraticCurveTo(S*.48,0,S*.31,S*.1);c.quadraticCurveTo(S*.4,0,S*.31,-S*.1);c.fill();
  } else if (type === "vortex") {
    const g=c.createRadialGradient(0,0,1,0,0,S*.3);g.addColorStop(0,"#ffb1ff");g.addColorStop(.16,"#bd4ff0");g.addColorStop(.58,"#3c0b68");g.addColorStop(1,"#0a0012");c.fillStyle=g;c.shadowColor="#ef61ff";c.shadowBlur=S*.26;c.beginPath();c.arc(0,0,S*.3,0,TAU);c.fill();c.strokeStyle="#ff96ff";c.lineWidth=S*.04;for(let i=0;i<3;i++){c.save();c.rotate(i*.8);c.beginPath();c.ellipse(0,0,S*(.39-i*.03),S*(.09+i*.025),0,0,TAU);c.stroke();c.restore();}
  } else if (type === "drill") {
    c.save();c.rotate(-.08);c.fillStyle=metal;c.beginPath();c.moveTo(S*.37,0);c.lineTo(-S*.15,S*.19);c.lineTo(-S*.32,S*.12);c.lineTo(-S*.32,-S*.12);c.lineTo(-S*.15,-S*.19);c.closePath();c.fill();c.stroke();c.strokeStyle="#ffbe47";c.lineWidth=S*.035;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*S*.1,-S*.14);c.lineTo((i+.75)*S*.1,S*.14);c.stroke();}c.restore();
  } else {
    c.fillStyle = hot; c.beginPath(); c.arc(0, 0, S * .24, 0, TAU); c.fill();
  }
  c.restore();
}

function icon(c, type, x, y, size, flash = 0) {
  const w = WEAPONS[type] || WEAPONS.blaster, rarity = RARITY_COLORS[w.rarity] || "#fff";
  c.save(); c.translate(x, y);
  c.shadowColor = hexAlpha(rarity, "99"); c.shadowBlur = size * .16;
  rr(c, -size * .5, -size * .5, size, size, size * .11);
  const bg = c.createLinearGradient(-size * .5, -size * .5, size * .5, size * .5); bg.addColorStop(0, hexAlpha(w.color, "e8")); bg.addColorStop(.48, "#294a70"); bg.addColorStop(1, "#10233f"); c.fillStyle = bg; c.fill();
  c.shadowBlur = 0; c.strokeStyle = "#07162a"; c.lineWidth = Math.max(2, size * .055); c.stroke();
  c.save(); rr(c, -size * .43, -size * .43, size * .86, size * .86, size * .09); c.clip();
  const ray = c.createLinearGradient(0, -size * .45, 0, size * .45); ray.addColorStop(0, "#ffffff55"); ray.addColorStop(.3, "#ffffff12"); ray.addColorStop(1, "#00000022"); c.fillStyle = ray; c.fillRect(-size * .5, -size * .5, size, size);
  c.globalAlpha = .14; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-size*.5,-size*.42);c.lineTo(size*.3,-size*.5);c.lineTo(-size*.25,size*.5);c.lineTo(-size*.5,size*.5);c.closePath();c.fill(); c.restore();
  drawWeaponGlyph(c, type, size * .83);
  if (flash) { c.globalAlpha = Math.min(.75, flash * .8); c.fillStyle = "#fff"; c.shadowColor = "#fff"; c.shadowBlur = size * .25; c.beginPath(); c.arc(0, -size * .38, size * .2, 0, TAU); c.fill(); }
  c.restore();
}

function starsLabel(rank) { return rank <= 4 ? "★".repeat(rank + 1) : `P${rank - 4}`; }

function card(c, w, x, y, size, battle = false, lean = 0, bob = 0) {
  if (!w || !WEAPONS[w.type]) return;
  const st = weaponStats(w.type, w.rank), hp = battle ? clamp((w.hp ?? st.maxHp) / Math.max(1, st.maxHp), 0, 1) : 1;
  const rarity = RARITY_COLORS[WEAPONS[w.type].rarity] || "#fff", recoil = finite(w.recoil);
  c.save(); c.translate(x, y + bob + recoil * 5); c.rotate(lean * .026); c.scale(1 + recoil * .06, 1 - recoil * .09);
  c.shadowColor = "#020a14c9"; c.shadowBlur = battle ? 11 : 8; c.shadowOffsetY = battle ? 6 : 5;
  rr(c, -size * .52, -size * .53, size * 1.04, size * 1.08, size * .1); c.fillStyle = "#09182a"; c.fill(); c.shadowBlur = 0;
  c.strokeStyle = rarity; c.lineWidth = Math.max(2.2, size * .06); c.stroke();
  c.shadowColor = hexAlpha(rarity, "88"); c.shadowBlur = size * .12; c.strokeStyle = "#ffffff88"; c.lineWidth = Math.max(1, size * .015); rr(c, -size * .46, -size * .47, size * .92, size * .92, size * .08); c.stroke(); c.shadowBlur = 0;
  icon(c, w.type, 0, -size * .035, size * .88, w.flash || 0);
  if (w.hitFlash) { c.globalAlpha = Math.min(.85, w.hitFlash * .85); c.fillStyle = "#fff"; rr(c, -size * .47, -size * .48, size * .94, size * .94, size * .08); c.fill(); c.globalAlpha = 1; }
  const rankY = size * .39;
  if (w.rank <= 4) text(c, starsLabel(w.rank), 0, rankY, Math.max(8, size * .14), "#ffd84a", "center", "#70430b");
  else { pill(c, -size*.18, rankY-size*.09, size*.36, size*.18, "#e47cff", "#7f2fae"); text(c, starsLabel(w.rank), 0, rankY, Math.max(8, size * .12), "#fff"); }
  if (battle && hp < .999) {
    rr(c, -size * .43, size * .44, size * .86, size * .09, size * .04); c.fillStyle = "#071423dd"; c.fill();
    const hg = c.createLinearGradient(-size*.42,0,size*.42,0); hg.addColorStop(0,hp>.45?"#42e75e":hp>.2?"#ffc43f":"#ff4b45");hg.addColorStop(1,hp>.45?"#9bff6f":hp>.2?"#ffe277":"#ff8a70"); c.fillStyle=hg; rr(c,-size*.41,size*.455,size*.82*hp,size*.06,size*.03);c.fill();
  }
  c.restore();
}

function glossyButton(c, r, label, top, bottom, opts = {}) {
  const { small = false, iconText = "", locked = false } = opts; c.save();
  c.shadowColor = "#031226aa"; c.shadowBlur = 10; c.shadowOffsetY = 6;
  rr(c, r.x, r.y, r.w, r.h, 15); const g = c.createLinearGradient(0,r.y,0,r.y+r.h);g.addColorStop(0,locked?"#71808d":top);g.addColorStop(.58,locked?"#4d5a65":bottom);g.addColorStop(1,locked?"#39434b":bottom);c.fillStyle=g;c.fill();c.shadowBlur=0;
  c.strokeStyle="#0a2948";c.lineWidth=4;c.stroke(); c.strokeStyle="#ffffff49";c.lineWidth=2;rr(c,r.x+3,r.y+3,r.w-6,r.h-8,12);c.stroke();
  if (iconText) text(c, iconText, r.x + r.w * .22, r.y + r.h * .49, small ? 18 : 23, locked?"#d9e1e8":"#fff");
  const lines=label.split("\n"); const xx=r.x+r.w*(iconText?.32:.5); lines.forEach((q,i)=>text(c,q,xx,r.y+r.h/2+(i-(lines.length-1)/2)*(small?16:20),i?12:(small?14:20),i?"#fff0a5":"#fff")); c.restore();
}

function drawTopHUD(c,L,s,U) {
  panel(c,U.level.x,U.level.y,U.level.w,U.level.h,"#3ab8ed","#166ca8",14);
  text(c,`LEVEL ${s.level}`,U.level.x+U.level.w*.43,U.level.y+17,14,"#fff");
  const need=xpNeeded(s.level), p=clamp(s.xp/Math.max(1,need),0,1); rr(c,U.level.x+9,U.level.y+33,U.level.w-18,10,5);c.fillStyle="#08274a";c.fill();const pg=c.createLinearGradient(U.level.x,0,U.level.x+U.level.w,0);pg.addColorStop(0,"#ffd535");pg.addColorStop(1,"#ff9e22");c.fillStyle=pg;rr(c,U.level.x+9,U.level.y+33,(U.level.w-18)*p,10,5);c.fill();
  panel(c,U.chests.x,U.chests.y,U.chests.w,U.chests.h,"#8845cf","#4e2491",14); drawChest(c,U.chests.x+24,U.chests.y+27,30,true); text(c,s.keys,U.chests.x+50,U.chests.y+20,15,"#fff","left"); text(c,"CHESTS",U.chests.x+50,U.chests.y+37,10,"#ffe8ff","left");

  const capW=Math.min(174,L.W*.4), capH=34, capX=L.W-capW-12, capY=72;
  pill(c,capX,capY,capW*.48,capH,"#34163ecc","#e455ff66");drawGem(c,capX+18,capY+17,11);text(c,s.gems,capX+35,capY+17,13,"#fff","left");
  pill(c,capX+capW*.5,capY,capW*.5,capH,"#3a2816dd","#ffd95a66");drawCoin(c,capX+capW*.5+18,capY+17,11);text(c,shortNum(s.gold),capX+capW*.5+35,capY+17,13,"#fff","left");
}

function stageHex(c,x,y,r,fill,current=false,boss=false) {
  c.save();c.shadowColor=current?"#ffe05a":"#06223a";c.shadowBlur=current?14:5;c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();c.fillStyle=fill;c.fill();c.shadowBlur=0;c.strokeStyle=current?"#fff1a0":"#d7f5ff88";c.lineWidth=current?3:2;c.stroke();if(boss){text(c,"☠",x,y+1,r*.8,"#ff5e4e");}c.restore();
}

function drawStageTrack(c,L,s) {
  const count=L.W<520?5:7,half=Math.floor(count/2),step=Math.min(58,(L.W-56)/Math.max(1,count-1)),y=122;
  c.strokeStyle="#d8f8ff55";c.lineWidth=4;c.beginPath();c.moveTo(L.cx-half*step,y);c.lineTo(L.cx+half*step,y);c.stroke();
  for(let d=-half;d<=half;d++){const stage=Math.max(1,s.stage+d),x=L.cx+d*step,current=d===0,boss=stage%10===0;stageHex(c,x,y,current?21:18,current?"#ffc832":stage<s.stage?"#6b879c":boss?"#8d43d8":"#1f7db8",current,boss); if(!boss||current)text(c,stage,x,y,current?14:11,"#fff");}
  text(c,`STAGE ${s.stage}`,L.cx,91,25,"#fff");
}

function drawGrid(c,L,s,U) {
  const cell=L.cell,gx=L.cx-cell*2.5,gy=L.gridY,t=animTime();
  const glow=c.createRadialGradient(L.cx,gy+cell*2.5,20,L.cx,gy+cell*2.5,cell*3.1);glow.addColorStop(0,"#b6ffff22");glow.addColorStop(1,"#b6ffff00");c.fillStyle=glow;c.fillRect(gx-cell*.8,gy-cell*.8,cell*6.6,cell*6.6);
  for(let r=0;r<5;r++)for(let col=0;col<5;col++){
    const i=r*5+col,x=gx+col*cell,y=gy+r*cell,hover=s.hover===i;
    c.save();c.shadowColor=hover?"#b9ffff":"#061c35";c.shadowBlur=hover?16:5;rr(c,x+3,y+3,cell-6,cell-6,10);const g=c.createLinearGradient(x,y,x+cell,y+cell);g.addColorStop(0,hover?"#83f4ff80":"#69d4ed4e");g.addColorStop(1,hover?"#2bb9df7a":"#0d84b94a");c.fillStyle=g;c.fill();c.shadowBlur=0;c.strokeStyle=hover?"#dcffff":"#ffffff24";c.lineWidth=hover?2.5:1.5;c.stroke();
    if(!s.grid[i]){c.globalAlpha=.11+Math.sin(t*2+i)*.025;c.fillStyle="#d4ffff";c.beginPath();c.arc(x+cell/2,y+cell/2,cell*.08,0,TAU);c.fill();}c.restore();
    if(s.grid[i])card(c,s.grid[i],x+cell/2,y+cell/2,cell*.79,false);
  }
  const count=s.grid.filter(Boolean).length,power=battlePower(s.grid);pill(c,L.cx-Math.min(230,L.side*.43),U.gridBottom+11,Math.min(460,L.side*.86),27,"#08274bcc","#8adfff44");text(c,`TOWERS ${count}/25   •   POWER ${power}`,L.cx,U.gridBottom+25,12,"#eaffff");
}

function drawPurchaseCard(c,r,cfg,cost,locked,tier) {
  c.save(); panel(c,r.x,r.y,r.w,r.h,locked?"#71808d":tier===2?"#b55ae8":"#43b9ed",locked?"#4a5660":tier===2?"#6d2fa6":"#1873aa",13);
  const cx=r.x+r.w*.24,cy=r.y+r.h*.38,S=Math.min(33,r.h*.43); c.shadowColor=locked?"#0000":"#d8f8ff";c.shadowBlur=8;c.fillStyle=locked?"#9ba8b2":"#d5f4ff";c.strokeStyle="#284966";c.lineWidth=2;rr(c,cx-S*.52,cy-S*.52,S*1.04,S*1.04,9);c.fill();c.stroke();for(let i=0;i<Math.min(3,cfg.rank+1);i++){c.fillStyle="#294b68";c.beginPath();c.arc(cx+(i-1)*S*.18,cy,S*.055,0,TAU);c.fill();}c.shadowBlur=0;
  text(c,locked?"LOCKED":`${cfg.label} TOWER`,r.x+r.w*.63,r.y+21,13,"#fff");text(c,locked?`STAGE ${cfg.minStage}`:`${shortNum(cost)} GOLD`,r.x+r.w*.63,r.y+43,11,locked?"#e4edf2":"#fff1a0"); if(!locked)text(c,"★".repeat(Math.min(3,cfg.rank+1)),r.x+r.w*.63,r.y+59,11,"#ffd84a"); c.restore();
}

export function drawBuild(c,L,s) {
  if(L.W<110||L.H<170){c.fillStyle="#0877b4";c.fillRect(0,0,L.W,L.H);return;}
  buildBackground(c,L,s);const U=getBuildUI(L),cp=collectionProgress(s.stage);drawTopHUD(c,L,s,U);drawStageTrack(c,L,s);drawGrid(c,L,s,U);
  U.purchases.forEach((r,i)=>{const cfg=PURCHASE_TIERS[i],locked=s.stage<cfg.minStage,cost=purchaseCost(s.stage,i,s.purchases[i]);drawPurchaseCard(c,r,cfg,cost,locked,i);});
  glossyButton(c,U.bag,`BAG\n${s.bag.length}`,"#9f56dc","#6530ad",{small:true,iconText:"▣"});
  glossyButton(c,U.battle,"BATTLE","#ffe24a","#ffad22",{iconText:"⚔"});
  glossyButton(c,U.collection,`ARSENAL\n${cp.unlocked}/${cp.total}`,"#38b9f1","#1476b4",{small:true,iconText:"✦"});
  if(s.toast){const y=Math.min(L.H-25,U.actionY+82);pill(c,L.cx-170,y-15,340,30,"#06172de8","#ffffff32");text(c,s.toast,L.cx,y,11,"#fff");}
}

function drawPanelFrame(c,L,s,title,subtitle="") {
  const P=getPanelUI(L,s);c.fillStyle="#031225dc";c.fillRect(0,0,L.W,L.H);panel(c,P.panel.x,P.panel.y,P.panel.w,P.panel.h,"#2072ad","#0c3159",24);
  const header=c.createLinearGradient(0,P.panel.y,0,P.panel.y+92);header.addColorStop(0,"#ff7350");header.addColorStop(1,"#ff9d42");rr(c,P.panel.x+5,P.panel.y+5,P.panel.w-10,88,20);c.fillStyle=header;c.fill();c.strokeStyle="#7c2b1d";c.lineWidth=3;c.stroke();text(c,title,L.cx,P.panel.y+37,27,"#fff","center","#4f1e20");if(subtitle)text(c,subtitle,L.cx,P.panel.y+71,11,"#fff4d8","center","#593029");
  glossyButton(c,P.close,"×","#3bc7ff","#1591d0",{small:true});return P;
}

function drawBagPanel(c,L,s){const P=drawPanelFrame(c,L,s,"BAG","Tap a tower to deploy it into the first connected slot.");if(!s.bag.length){drawChest(c,L.cx,P.panel.y+190,80,true);text(c,"Your bag is empty",L.cx,P.panel.y+258,18,"#e7f7ff");return;}for(const r of P.bagRects){const w=s.bag[r.index];card(c,w,r.x+r.w/2,r.y+r.h/2,r.w*.82,false);text(c,"DEPLOY",r.x+r.w/2,r.y+r.h+8,9,"#a8ffca");}}
function drawCollectionPanel(c,L,s){const P=drawPanelFrame(c,L,s,"ARSENAL",`${collectionProgress(s.stage).unlocked}/${TYPES.length} weapons unlocked`);const cols=L.W<520?4:5,gap=7,sz=Math.max(22,Math.min(82,(P.panel.w-34-gap*(cols-1))/cols)),sx=L.cx-(cols*sz+(cols-1)*gap)/2,sy=P.panel.y+106;TYPES.forEach((type,i)=>{const w=WEAPONS[type],x=sx+(i%cols)*(sz+gap),y=sy+Math.floor(i/cols)*(sz+28),locked=w.unlockStage>s.stage;c.save();c.globalAlpha=locked?.23:1;icon(c,type,x+sz/2,y+sz/2,sz*.82);c.strokeStyle=RARITY_COLORS[w.rarity];c.lineWidth=2;rr(c,x+4,y+4,sz-8,sz-8,8);c.stroke();c.restore();text(c,locked?`S${w.unlockStage}`:w.name.split(" ")[0],x+sz/2,y+sz+7,8,locked?"#91a8b9":"#fff");});}
function drawRewardsPanel(c,L,s){const P=drawPanelFrame(c,L,s,"LEVEL ROAD",`${s.xp}/${xpNeeded(s.level)} XP to next level`);const start=Math.max(1,s.level-2),rows=Math.min(6,Math.floor((P.panel.h-126)/74));for(let i=0;i<rows;i++){const lv=start+i,r=levelReward(lv),y=P.panel.y+110+i*72;panel(c,P.panel.x+26,y,P.panel.w-52,58,lv===s.level?"#34a8e4":"#22557e",lv===s.level?"#176aa5":"#15395d",13);const nodeX=P.panel.x+61;c.fillStyle=lv<=s.level?"#ffd63d":"#46c5f2";c.beginPath();c.arc(nodeX,y+29,18,0,TAU);c.fill();text(c,lv,nodeX,y+29,11,"#fff");text(c,`LEVEL ${lv}`,P.panel.x+91,y+20,13,"#fff","left");const parts=[];if(r.gold)parts.push(`${shortNum(r.gold)} GOLD`);if(r.gems)parts.push(`${r.gems} GEMS`);if(r.keys)parts.push(`${r.keys} KEY${r.keys>1?"S":""}`);text(c,parts.join(" • "),P.panel.x+91,y+40,10,lv<=s.level?"#fff0a1":"#dff7ff","left");}}
function drawChestPanel(c,L,s){const P=drawPanelFrame(c,L,s,"CHESTS","Open crates to expand your formation and find rarer weapons.");for(const r of P.chestRects){const key=r.kind==="key";panel(c,r.x,r.y,r.w,r.h,key?"#f5bd37":"#b34cec",key?"#b86e13":"#6723a1",18);drawChest(c,r.x+r.w/2,r.y+67,Math.min(90,r.w*.48),!key);text(c,key?"KEY CHEST":"EPIC CRATE",r.x+r.w/2,r.y+126,17,"#fff");text(c,key?"1 KEY":"120 GEMS",r.x+r.w/2,r.y+156,14,"#fff3a0");text(c,key?"1–3★ tower":"2–3★ tower",r.x+r.w/2,r.y+184,11,"#eefaff");}}
function drawPanel(c,L,s){if(!s.panel)return;if(s.panel==="bag")drawBagPanel(c,L,s);else if(s.panel==="collection")drawCollectionPanel(c,L,s);else if(s.panel==="rewards")drawRewardsPanel(c,L,s);else if(s.panel==="chests")drawChestPanel(c,L,s);}

function roadPath(c,L){const topHalf=roadHalfWidthAtY(L.W,L.H,ROAD_HORIZON_Y),bottomHalf=roadHalfWidthAtY(L.W,L.H,L.H*.99);c.beginPath();c.moveTo(L.cx-topHalf,ROAD_HORIZON_Y);c.lineTo(L.cx+topHalf,ROAD_HORIZON_Y);c.lineTo(L.cx+bottomHalf,L.H*1.02);c.lineTo(L.cx-bottomHalf,L.H*1.02);c.closePath();}

function drawBattleRoad(c,L,s){
  const [a,b]=STAGE_COLORS[(s.stage-1)%STAGE_COLORS.length],t=animTime();
  const outer=c.createLinearGradient(0,0,0,L.H);outer.addColorStop(0,"#06111e");outer.addColorStop(.4,"#0b2637");outer.addColorStop(1,"#06111d");c.fillStyle=outer;c.fillRect(0,0,L.W,L.H);
  // colored side atmosphere
  const fog=c.createRadialGradient(L.cx,ROAD_HORIZON_Y,0,L.cx,ROAD_HORIZON_Y,L.W*.75);fog.addColorStop(0,hexAlpha(b,"88"));fog.addColorStop(.45,hexAlpha(a,"34"));fog.addColorStop(1,"#00000000");c.fillStyle=fog;c.fillRect(0,0,L.W,L.H*.66);
  c.save();roadPath(c,L);c.clip();
  const road=c.createLinearGradient(0,ROAD_HORIZON_Y,0,L.H);road.addColorStop(0,hexAlpha(a,"fa"));road.addColorStop(.52,hexAlpha(b,"fa"));road.addColorStop(1,hexAlpha(a,"ff"));c.fillStyle=road;c.fillRect(0,ROAD_HORIZON_Y,L.W,L.H);
  const mid=c.createLinearGradient(L.cx-L.W*.45,0,L.cx+L.W*.45,0);mid.addColorStop(0,"#00000030");mid.addColorStop(.35,"#ffffff08");mid.addColorStop(.5,"#ffffff1b");mid.addColorStop(.65,"#ffffff08");mid.addColorStop(1,"#00000030");c.fillStyle=mid;c.fillRect(0,ROAD_HORIZON_Y,L.W,L.H);
  // perspective cross bands that race toward the camera
  for(let i=0;i<22;i++){const u=((i/22+s.world*.0019)%1),e=u*u,y=ROAD_HORIZON_Y+(L.H-ROAD_HORIZON_Y)*e,half=roadHalfWidthAtY(L.W,L.H,y);c.globalAlpha=.08+e*.16;c.fillStyle="#fff";c.fillRect(L.cx-half,y,half*2,1+e*3.8);}
  // subtle lanes
  for(const lane of [-.5,0,.5]){c.beginPath();for(let i=0;i<=18;i++){const y=ROAD_HORIZON_Y+(L.H-ROAD_HORIZON_Y)*i/18,half=roadHalfWidthAtY(L.W,L.H,y),x=L.cx+half*lane;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle="rgba(255,255,255,.06)";c.lineWidth=1.5;c.stroke();}
  // forward streaks
  c.globalAlpha=.2;c.lineCap="round";for(let i=0;i<24;i++){const phase=(i*91.7+s.world*2.35+t*10)%(L.H+180),y=ROAD_HORIZON_Y+phase;if(y>L.H)continue;const half=roadHalfWidthAtY(L.W,L.H,y),x=L.cx+Math.sin(i*13.77)*half*.84,len=8+(y/L.H)*26;c.strokeStyle=i%4===0?"#ddffff":"#ffffff";c.lineWidth=1+(y/L.H)*2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+len);c.stroke();}
  c.restore();c.globalAlpha=1;
  const topHalf=roadHalfWidthAtY(L.W,L.H,ROAD_HORIZON_Y),bottomHalf=roadHalfWidthAtY(L.W,L.H,L.H*.99);c.shadowColor="#f2ffff";c.shadowBlur=13;c.strokeStyle="#f6ffffdd";c.lineWidth=4;c.beginPath();c.moveTo(L.cx-topHalf,ROAD_HORIZON_Y);c.lineTo(L.cx-bottomHalf,L.H);c.moveTo(L.cx+topHalf,ROAD_HORIZON_Y);c.lineTo(L.cx+bottomHalf,L.H);c.stroke();c.shadowBlur=0;
  const hg=c.createRadialGradient(L.cx,ROAD_HORIZON_Y,0,L.cx,ROAD_HORIZON_Y,Math.min(290,L.W*.5));hg.addColorStop(0,"#ffffff88");hg.addColorStop(.2,hexAlpha(b,"55"));hg.addColorStop(1,"#ffffff00");c.fillStyle=hg;c.beginPath();c.ellipse(L.cx,ROAD_HORIZON_Y,Math.min(290,L.W*.5),72,0,0,TAU);c.fill();
}

function drawFinish(c,L,s){const p=projectDistance(s.targetDistance-s.world,L.H);if(p.y<ROAD_HORIZON_Y-40||p.y>L.H+60)return;const half=roadHalfWidthAtY(L.W,L.H,p.y),stripeH=Math.max(8,18*p.scale),cells=12,cw=half*2/cells;for(let i=0;i<cells;i++){c.fillStyle=i%2?"#111827":"#f9fbff";c.fillRect(L.cx-half+i*cw,p.y-stripeH/2,cw+1,stripeH);}c.shadowColor="#fff";c.shadowBlur=16;c.strokeStyle="#fff";c.lineWidth=2;c.strokeRect(L.cx-half,p.y-stripeH/2,half*2,stripeH);c.shadowBlur=0;text(c,"FINISH",L.cx,p.y-25*p.scale,Math.max(12,21*p.scale),"#fff39b");}

function blockPath(c,b,x,y,w,h,r){if(b.kind==="crystal"){c.beginPath();c.moveTo(x-w*.43,y-h/2);c.lineTo(x+w*.34,y-h/2);c.lineTo(x+w/2,y-h*.12);c.lineTo(x+w*.38,y+h/2);c.lineTo(x-w*.4,y+h/2);c.lineTo(x-w/2,y+h*.08);c.closePath();}else rr(c,x-w/2,y-h/2,w,h,r);}

function drawBlock(c,L,s,b,pr){
  const deathA=b.destroyed?clamp(b.death/.34,0,1):1;if(deathA<=0)return;const extra=b.destroyed?(1-deathA)*.17:0,sc=Math.max(.01,pr.scale*(1+extra)),w=b.w*sc,h=b.h*sc,x=L.cx+pr.x,y=pr.y;if(w<2||h<2)return;
  c.save();c.globalAlpha=deathA;c.translate(x,y);c.rotate(b.destroyed?(1-deathA)*.08*Math.sin(b.phase):0);c.translate(-x,-y);
  c.shadowColor="#020812aa";c.shadowBlur=12*sc;c.shadowOffsetY=9*sc;blockPath(c,b,x,y,w,h,Math.max(2,b.round*sc));const g=c.createLinearGradient(x-w*.5,y-h*.5,x+w*.5,y+h*.5);g.addColorStop(0,"#ffffff4e");g.addColorStop(.14,b.color);g.addColorStop(.72,b.color);g.addColorStop(1,"#00000035");c.fillStyle=g;c.fill();c.shadowBlur=0;
  c.strokeStyle="#071725";c.lineWidth=Math.max(1.2,3.2*sc);c.stroke();c.strokeStyle="#ffffff44";c.lineWidth=Math.max(.8,1.4*sc);blockPath(c,b,x,y-h*.02,w*.91,h*.82,Math.max(2,b.round*sc*.75));c.stroke();
  // top highlight / lower depth strip
  c.save();blockPath(c,b,x,y,w,h,Math.max(2,b.round*sc));c.clip();const hi=c.createLinearGradient(0,y-h*.5,0,y+h*.5);hi.addColorStop(0,"#ffffff55");hi.addColorStop(.22,"#ffffff10");hi.addColorStop(.72,"#00000000");hi.addColorStop(1,"#0000002c");c.fillStyle=hi;c.fillRect(x-w*.5,y-h*.5,w,h);c.restore();
  if(b.hit){c.globalAlpha=Math.min(1,b.hit)*.48*deathA;c.fillStyle="#fff";blockPath(c,b,x,y,w,h,Math.max(2,b.round*sc));c.fill();c.globalAlpha=deathA;}
  if(b.kind==="armored"||b.kind==="pillar"){c.strokeStyle="#ffffff62";c.lineWidth=Math.max(2,5*sc);for(const off of [-.26,.26]){c.beginPath();c.moveTo(x+w*off,y-h*.38);c.lineTo(x+w*off,y+h*.38);c.stroke();}}
  if(b.kind==="heavy"){c.fillStyle="#ffffff22";for(const [dx,dy] of [[-.33,-.27],[.33,-.27],[-.33,.27],[.33,.27]]){c.beginPath();c.arc(x+w*dx,y+h*dy,Math.max(2,6*sc),0,TAU);c.fill();}}
  if(b.kind==="boss"){c.strokeStyle="#ffffff4f";c.lineWidth=Math.max(2,5*sc);rr(c,x-w*.43,y-h*.36,w*.86,h*.72,Math.max(6,25*sc));c.stroke();const hp=clamp(b.hp/b.maxHp,0,1);rr(c,x-w*.34,y+h*.28,w*.68,Math.max(5,10*sc),4);c.fillStyle="#081326c9";c.fill();const hg=c.createLinearGradient(x-w*.33,0,x+w*.33,0);hg.addColorStop(0,"#42ef61");hg.addColorStop(1,"#b7ff72");c.fillStyle=hg;rr(c,x-w*.33,y+h*.29,w*.66*hp,Math.max(3,8*sc),3);c.fill();}
  const font=clamp(Math.min(w*.24,h*.43),9,b.kind==="boss"?54:35);text(c,shortNum(b.hp),x,y-(b.kind==="boss"?h*.035:0),font,"#fff");c.restore();
}

function drawShotTrail(c,L,q){if(!q.trail?.length)return;c.save();const pts=q.trail;c.lineCap="round";c.lineJoin="round";let col=hexAlpha(q.color||"#8cf7ff","9b"),lw=4,blur=12;if(q.kind==="laser"||q.kind==="rail"){col="rgba(218,255,255,.88)";lw=q.kind==="rail"?8:5;blur=24;}else if(q.kind==="rocket"||q.kind==="nuke"||q.kind==="mortar"){col="rgba(255,168,50,.82)";lw=q.kind==="nuke"?10:6;blur=18;}else if(q.kind==="fire"||q.kind==="flame"){col="rgba(255,86,31,.82)";lw=9;blur=18;}else if(q.kind==="gravity"||q.kind==="vortex"){col="rgba(224,77,255,.66)";lw=q.kind==="vortex"?11:8;blur=20;}else if(q.kind==="tesla"){col="rgba(177,250,255,.9)";lw=3;blur=18;}c.strokeStyle=col;c.lineWidth=lw;c.shadowColor=col;c.shadowBlur=blur;c.beginPath();pts.forEach((p,i)=>{const x=L.cx+p[0],y=p[1];i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.restore();}

function drawProjectile(c,L,q){
  const x=L.cx+q.x,y=q.y;c.save();c.translate(x,y);const angle=Math.atan2(q.vy,q.vx)+Math.PI/2;
  if(q.kind==="laser"||q.kind==="rail"){c.shadowColor="#84f5ff";c.shadowBlur=q.kind==="rail"?34:24;c.fillStyle="#f2ffff";rr(c,-3.2,q.kind==="rail"?-34:-25,6.4,q.kind==="rail"?66:47,3);c.fill();c.fillStyle="#73eaff";rr(c,-7,8,14,14,5);c.fill();}
  else if(q.kind==="rocket"){c.rotate(angle);c.shadowColor="#ff8b2f";c.shadowBlur=18;c.fillStyle="#f5fbff";c.beginPath();c.ellipse(0,0,5.5,12,0,0,TAU);c.fill();c.fillStyle="#ef4d3e";c.beginPath();c.arc(0,-7,5.5,0,TAU);c.fill();c.fillStyle="#ffb53b";c.beginPath();c.moveTo(-5,8);c.lineTo(0,26+Math.sin(q.age*20)*3);c.lineTo(5,8);c.fill();c.strokeStyle="#ffd96a";c.lineWidth=2;for(let i=0;i<2;i++){c.beginPath();c.arc(0,10+i*8,9+i*3,q.age*8+i,q.age*8+i+Math.PI*1.25);c.stroke();}}
  else if(q.kind==="nuke"){c.rotate(angle);c.shadowColor="#ff9830";c.shadowBlur=25;c.fillStyle="#343b49";c.beginPath();c.ellipse(0,0,10,20,0,0,TAU);c.fill();c.strokeStyle="#ffcb55";c.lineWidth=3;c.stroke();c.fillStyle="#ff9b2e";c.beginPath();c.arc(0,2,5,0,TAU);c.fill();}
  else if(q.kind==="mortar"){c.rotate(angle);c.shadowColor="#ffc33f";c.shadowBlur=12;c.fillStyle="#3d4850";c.beginPath();c.ellipse(0,0,8,14,0,0,TAU);c.fill();c.fillStyle="#ffd34c";c.fillRect(-7,4,14,5);}
  else if(q.kind==="tesla"){c.strokeStyle="#e6ffff";c.shadowColor="#7ef0ff";c.shadowBlur=22;c.lineWidth=3;c.beginPath();c.moveTo(-5,13);c.lineTo(3,5);c.lineTo(-3,-2);c.lineTo(6,-10);c.lineTo(0,-18);c.stroke();}
  else if(q.kind==="acid"){c.shadowColor="#aaff4d";c.shadowBlur=19;const g=c.createRadialGradient(-2,-3,1,0,0,9);g.addColorStop(0,"#f3ff93");g.addColorStop(.45,"#92ef43");g.addColorStop(1,"#5db427");c.fillStyle=g;c.beginPath();c.arc(0,0,8.5,0,TAU);c.fill();}
  else if(q.kind==="wave"){c.strokeStyle="#f2a4ff";c.shadowColor="#db5cff";c.shadowBlur=24;c.lineWidth=7;c.beginPath();c.arc(0,8,23,-2.7,-.45);c.stroke();c.lineWidth=2;c.beginPath();c.arc(0,8,32,-2.7,-.45);c.stroke();}
  else if(q.kind==="flame"||q.kind==="fire"){c.shadowColor="#ff6125";c.shadowBlur=22;c.fillStyle="#ff5125";c.beginPath();c.moveTo(-8,7);c.quadraticCurveTo(-1,27+Math.sin(q.age*17)*4,7,7);c.arc(0,0,9,0,TAU);c.fill();c.fillStyle="#fff0a0";c.beginPath();c.arc(-1,-1,4.5,0,TAU);c.fill();}
  else if(q.kind==="shard"){c.rotate(angle);c.fillStyle="#e4fff8";c.shadowColor="#6fffd7";c.shadowBlur=14;c.beginPath();c.moveTo(0,-11);c.lineTo(5,7);c.lineTo(-5,7);c.closePath();c.fill();}
  else if(q.kind==="needle"){c.rotate(angle);c.strokeStyle="#f0ffff";c.shadowColor="#76eaff";c.shadowBlur=12;c.lineWidth=2;c.beginPath();c.moveTo(0,-12);c.lineTo(0,9);c.stroke();}
  else if(q.kind==="drill"){c.rotate(angle);c.fillStyle="#eefaff";c.beginPath();c.moveTo(0,-14);c.lineTo(8,5);c.lineTo(-8,5);c.closePath();c.fill();c.strokeStyle="#ffbd42";c.lineWidth=2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-6,i*4);c.lineTo(6,i*4+5);c.stroke();}}
  else if(q.kind==="vortex"||q.kind==="gravity"){const R=q.kind==="vortex"?28:23,g=c.createRadialGradient(0,0,2,0,0,R);g.addColorStop(0,"#fff");g.addColorStop(.18,"#ef68ff");g.addColorStop(.5,"#6a18ac");g.addColorStop(1,"#1e003800");c.fillStyle=g;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();c.strokeStyle="#f6a4ff";c.lineWidth=2;for(let i=0;i<(q.kind==="vortex"?3:2);i++){c.save();c.rotate(q.age*(2+i*.7)+i);c.beginPath();c.ellipse(0,0,R+2,8+i*4,0,0,TAU);c.stroke();c.restore();}}
  else if(q.kind==="bubble"){c.shadowColor="#7af8ff";c.shadowBlur=17;const g=c.createRadialGradient(-3,-3,1,0,0,10);g.addColorStop(0,"#fff");g.addColorStop(.25,"#c2ffff");g.addColorStop(.65,"#66dff0aa");g.addColorStop(1,"#6a5cff44");c.fillStyle=g;c.strokeStyle="#e7ffff";c.lineWidth=2;c.beginPath();c.arc(0,0,9,0,TAU);c.fill();c.stroke();}
  else if(q.kind==="shell"){c.rotate(angle);c.shadowColor="#ffca43";c.shadowBlur=15;c.fillStyle="#ffdd59";c.beginPath();c.ellipse(0,0,7,11,0,0,TAU);c.fill();c.fillStyle="#574630";c.fillRect(-6,5,12,6);}
  else if(q.kind==="split"){c.rotate(angle);c.shadowColor="#84f6ff";c.shadowBlur=20;c.fillStyle="#e8ffff";rr(c,-3,-14,6,29,3);c.fill();c.fillStyle="#5befff";c.beginPath();c.arc(0,4,5,0,TAU);c.fill();}
  else {c.shadowColor=q.color;c.shadowBlur=19;c.fillStyle="#fff";c.beginPath();c.arc(0,0,5.2,0,TAU);c.fill();c.globalAlpha=.5;c.fillStyle=q.color;c.beginPath();c.arc(0,0,9,0,TAU);c.fill();}
  c.restore();
}

function drawRings(c,L,s){for(const r of s.rings){const a=clamp(r.life/r.max,0,1);c.save();c.globalAlpha=a*.85;c.strokeStyle=r.color;c.shadowColor=r.color;c.shadowBlur=12;c.lineWidth=Math.max(.8,r.width*a);c.beginPath();c.arc(L.cx+r.x,r.y,Math.max(0,r.radius),0,TAU);c.stroke();c.restore();}}
function drawParticles(c,L,s){for(const p of s.particles){const a=clamp(p.life/p.max,0,1),x=L.cx+p.x,y=p.y;c.save();c.globalAlpha=p.kind==="smoke"?a*.46:a;if(p.kind==="smoke"){const g=c.createRadialGradient(x-p.size*.2,y-p.size*.2,1,x,y,p.size);g.addColorStop(0,hexAlpha(p.color,"aa"));g.addColorStop(1,"#11182700");c.fillStyle=g;c.beginPath();c.arc(x,y,p.size,0,TAU);c.fill();}else if(p.kind==="shard"){c.translate(x,y);c.rotate(p.rot);c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=7;c.fillRect(-p.size*.65,-p.size*.22,p.size*1.3,p.size*.44);}else{c.strokeStyle=p.color;c.shadowColor=p.color;c.shadowBlur=10;c.lineWidth=Math.max(1,p.size*.5);c.beginPath();c.moveTo(x,y);c.lineTo(x-p.vx*.035,y-p.vy*.035);c.stroke();}c.restore();}}
function drawCoins(c,L,s){for(const q of s.coins){const a=clamp(q.life/q.max,0,1);c.save();c.globalAlpha=a;c.translate(L.cx+q.x,q.y);c.scale(Math.max(.16,Math.abs(Math.cos(q.spin))),1);drawCoin(c,0,0,8);c.restore();}}

function drawFormation(c,L,s){const baseY=formationBaseY(L.H)+s.teamY,alive=s.grid.filter(w=>w&&w.hp>0).length;if(!alive)return;const glow=c.createRadialGradient(L.cx+s.teamX,baseY,10,L.cx+s.teamX,baseY,170);glow.addColorStop(0,"#e3ffff3b");glow.addColorStop(.48,"#4cecff17");glow.addColorStop(1,"#4cecff00");c.fillStyle=glow;c.beginPath();c.ellipse(L.cx+s.teamX,baseY+20,180,138,0,0,TAU);c.fill();const size=Math.min(54,L.cell*.79),bob=Math.sin(s.elapsed*4.4)*1.8;for(let i=0;i<25;i++){const w=s.grid[i];if(!w||w.hp<=0)continue;const pos=formationCellPosition(s,i,L.H);card(c,w,L.cx+pos.x,pos.y,size,true,s.teamLean,bob+Math.sin(s.elapsed*3+i)*.5);}}

function drawHud(c,L,s){const progress=clamp(s.world/Math.max(1,s.targetDistance),0,1),barW=Math.min(570,L.W-32);c.save();panel(c,L.cx-barW/2,14,barW,42,"#12365cdd","#071a30dd",18);rr(c,L.cx-barW/2+5,19,(barW-10)*progress,32,14);const pg=c.createLinearGradient(L.cx-barW/2,0,L.cx+barW/2,0);pg.addColorStop(0,"#ffdf3d");pg.addColorStop(1,"#ff962b");c.fillStyle=pg;c.fill();text(c,`STAGE ${s.stage}   •   +${shortNum(s.earned)} GOLD`,L.cx,35,14,"#fff");const rx=L.cx+Math.min(L.W*.41,310),ry=L.H*.62;c.fillStyle="#0c2845d9";c.strokeStyle="#d9f7ffaa";c.lineWidth=2;c.beginPath();c.arc(rx,ry,28,0,TAU);c.fill();c.stroke();text(c,"AUTO",rx,ry-6,10,"#fff");text(c,"ON",rx,ry+9,11,"#a8ffc3");const guide=clamp(1-Math.max(0,s.elapsed-2.5)/3,0,1);if(guide>0){c.globalAlpha=guide*.9;text(c,"DRAG / WASD TO STEER",L.cx,L.H-27,12,"#eaffff");}c.restore();}

export function drawBattle(c,L,s){if(L.W<110||L.H<170){c.fillStyle="#07182c";c.fillRect(0,0,L.W,L.H);return;}drawBattleRoad(c,L,s);const sx=s.shake?(Math.random()-.5)*s.shake:0,sy=s.shake?(Math.random()-.5)*s.shake*.72:0;c.save();c.translate(sx,sy);drawFinish(c,L,s);const visible=s.blocks.map(b=>({b,pr:projectBlock(s,b,L.H)})).filter(o=>o.pr.y>ROAD_HORIZON_Y-100&&o.pr.y<L.H+150).sort((a,b)=>a.pr.y-b.pr.y);for(const o of visible)drawBlock(c,L,s,o.b,o.pr);for(const q of s.shots)drawShotTrail(c,L,q);for(const q of s.shots)drawProjectile(c,L,q);drawRings(c,L,s);drawParticles(c,L,s);drawCoins(c,L,s);for(const f of s.floaters){c.save();c.globalAlpha=clamp(f.life/f.max,0,1);text(c,f.text,L.cx+f.x,f.y,f.big?21:15,f.big?"#fff59c":"#fff");c.restore();}drawFormation(c,L,s);c.restore();if(s.battleFlash>0){c.fillStyle=`rgba(255,244,195,${Math.min(.3,s.battleFlash*.32)})`;c.fillRect(0,0,L.W,L.H);}drawHud(c,L,s);}

export function drawResult(c,L,s){drawBuild(c,L,s);c.fillStyle="#031225e8";c.fillRect(0,0,L.W,L.H);const R=getResultUI(L),r=s.lastResult||{};panel(c,R.panel.x,R.panel.y,R.panel.w,R.panel.h,r.win?"#2a86bd":"#8a3b57",r.win?"#16436e":"#4e2439",24);const banner=c.createLinearGradient(0,R.panel.y,0,R.panel.y+95);banner.addColorStop(0,r.win?"#ffcf39":"#ff6b68");banner.addColorStop(1,r.win?"#ff942c":"#d94466");rr(c,R.panel.x+5,R.panel.y+5,R.panel.w-10,90,20);c.fillStyle=banner;c.fill();text(c,r.win?"STAGE CLEARED!":"TEAM DESTROYED",L.cx,R.panel.y+48,29,"#fff","center",r.win?"#8e4f09":"#641f33");drawCoin(c,L.cx-62,R.panel.y+122,18);text(c,`+${shortNum(r.reward||0)} GOLD`,L.cx+12,R.panel.y+122,20,"#fff");text(c,`+${r.xp||0} XP`,L.cx,R.panel.y+156,16,"#bff1ff");let y=R.panel.y+196;const lvl=r.progress?.rewards||[];if(lvl.length){const last=lvl[lvl.length-1];text(c,`LEVEL UP → ${last.level}`,L.cx,y,18,"#9effbd");y+=29;text(c,last.label,L.cx,y,12,"#ffe99a");y+=31;}if(r.unlocks?.length){text(c,"NEW WEAPON UNLOCKED",L.cx,y,13,"#ffb6ff");y+=27;for(const u of r.unlocks.slice(0,2)){icon(c,u.type,L.cx-44,y,42);text(c,u.name,L.cx-10,y,15,RARITY_COLORS[u.rarity]||"#fff","left");y+=46;}}if(r.progress?.extras?.keys)text(c,`BOSS REWARD  +${r.progress.extras.keys} KEY`,L.cx,y+5,14,"#fff1a0");glossyButton(c,R.continue,"CONTINUE","#42c9ff","#188fd3");}

export function render(c,L,s){
  if(!c||!L||!s)return;
  if(L.W<2||L.H<2){c.fillStyle="#07182c";c.fillRect(0,0,Math.max(1,L.W),Math.max(1,L.H));return;}
  if(s.mode==="battle")drawBattle(c,L,s);else if(s.mode==="result")drawResult(c,L,s);else{drawBuild(c,L,s);drawPanel(c,L,s);}
}
