import { WEAPONS, TYPES, PURCHASE_TIERS, weaponStats, rankLabel, RARITY_COLORS, STAGE_COLORS, purchaseCost } from "./MergeShootData.js";
import { xpNeeded, levelReward, battlePower, collectionProgress } from "./MergeShootProgression.js";
import { clamp, formationBaseY, formationCellPosition, projectBlock, projectDistance, roadHalfWidthAtY, ROAD_HORIZON_Y } from "./MergeShootBattleMath.js";

const TAU = Math.PI * 2;
const rr = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.roundRect(x, y, w, h, r); };
const text = (c, t, x, y, size = 20, fill = "#fff", align = "center", stroke = "#071b35") => {
  c.font = `900 ${size}px system-ui,Arial`; c.textAlign = align; c.textBaseline = "middle";
  c.lineJoin = "round"; c.lineWidth = Math.max(2, size * .13); c.strokeStyle = stroke; c.strokeText(String(t), x, y);
  c.fillStyle = fill; c.fillText(String(t), x, y);
};
const shortNum = n => n >= 1000000 ? `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${Math.max(0, Math.ceil(n))}`;

export function layout(W, H) {
  const side = Math.min(W * .94, 720), top = 18;
  const cell = Math.min(78, side / 6.08, Math.max(48, (H - 310) / 5.65));
  return { W, H, cx: W / 2, side, top, cell, gridY: 150 };
}

export function getBuildUI(L) {
  const gridBottom = L.gridY + L.cell * 5;
  const purchaseY = gridBottom + 46, rowW = Math.min(L.side, 590), gap = 8, pw = (rowW - gap * 2) / 3, left = L.cx - rowW / 2;
  const actionY = purchaseY + 73;
  return {
    level: { x: 14, y: 13, w: 122, h: 50 },
    chests: { x: L.W - 122, y: 13, w: 108, h: 50 },
    purchases: [0,1,2].map(i => ({ x: left + i * (pw + gap), y: purchaseY, w: pw, h: 64 })),
    bag: { x: L.cx - rowW / 2, y: actionY, w: 112, h: 68 },
    battle: { x: L.cx - 124, y: actionY, w: 248, h: 68 },
    collection: { x: L.cx + rowW / 2 - 112, y: actionY, w: 112, h: 68 },
    gridBottom, purchaseY, actionY
  };
}

export function getPanelUI(L, s) {
  const w = Math.min(590, L.W - 24), x = L.cx - w / 2, y = 76, h = Math.min(L.H - 100, 690);
  const out = { panel: { x, y, w, h }, close: { x: x + w - 54, y: y + 12, w: 40, h: 40 }, bagRects: [], chestRects: [] };
  if (s.panel === "bag") {
    const cols = L.W < 520 ? 4 : 5, gap = 8, card = Math.min(82, (w - 36 - gap * (cols - 1)) / cols), sx = L.cx - (cols * card + (cols - 1) * gap) / 2, sy = y + 100;
    for (let i = 0; i < Math.min(30, s.bag.length); i++) out.bagRects.push({ x: sx + (i % cols) * (card + gap), y: sy + Math.floor(i / cols) * (card + 18), w: card, h: card, index: i });
  }
  if (s.panel === "chests") {
    out.chestRects = [
      { x: L.cx - Math.min(230, w*.42), y: y + 145, w: Math.min(210, w*.39), h: 220, kind: "key" },
      { x: L.cx + 20, y: y + 145, w: Math.min(210, w*.39), h: 220, kind: "gems" }
    ];
  }
  return out;
}

export function getResultUI(L) {
  const w = Math.min(520, L.W * .88), x = L.cx - w/2, y = Math.max(92, L.H * .18), h = 430;
  return { panel:{x,y,w,h}, continue:{x:L.cx-118,y:y+h-78,w:236,h:62} };
}

function buildBg(c, L, s) {
  const [a, b] = STAGE_COLORS[(s.stage - 1) % STAGE_COLORS.length];
  const g = c.createLinearGradient(0, 0, 0, L.H); g.addColorStop(0, "#081b31"); g.addColorStop(.12, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, L.W, L.H);
  c.globalAlpha = .12; c.fillStyle = "#fff";
  for (let i = 0; i < 14; i++) { const y = ((i * 137 + s.world * .9) % L.H); c.fillRect(L.cx - L.side * .45, y, 2, L.H * .07); }
  c.globalAlpha = 1;
}

function icon(c, type, x, y, size, flash = 0) {
  const w = WEAPONS[type]; c.save(); c.translate(x, y);
  const g = c.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2); g.addColorStop(0, w.color); g.addColorStop(1, "#122746");
  rr(c, -size / 2, -size / 2, size, size, 10); c.fillStyle = g; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#07192d"; c.stroke();
  c.fillStyle = "#d9f6ff"; c.strokeStyle = "#14385a"; c.lineWidth = Math.max(2.5, size * .055);

  if (type === "blaster" || type === "laser") {
    c.save(); c.rotate(-.1); rr(c, -size * .3, -size * .13, size * .48, size * .25, 5); c.fill(); c.stroke();
    c.fillStyle = w.accent; rr(c, size * .02, -size * .085, size * .31, size * .09, 3); c.fill(); c.restore();
    c.shadowColor = w.accent; c.shadowBlur = size * .14; c.fillStyle = w.accent; c.beginPath(); c.arc(size * .25, -size * .04, size * .07, 0, TAU); c.fill();
  } else if (type === "rockets") {
    c.fillStyle = "#4b5a70"; rr(c, -size * .33, -size * .09, size * .66, size * .32, 5); c.fill(); c.stroke();
    for (let i = -1; i <= 1; i++) { c.fillStyle = "#f8f8f8"; c.beginPath(); c.ellipse(i * size * .2, -size * .17, size * .075, size * .2, -.08 * i, 0, TAU); c.fill(); c.fillStyle = "#ef4939"; c.beginPath(); c.arc(i * size * .2, -size * .29, size * .075, 0, TAU); c.fill(); }
  } else if (type === "gravity") {
    c.shadowColor = "#df54ff"; c.shadowBlur = size * .25; c.fillStyle = "#170424"; c.beginPath(); c.arc(0, 0, size * .27, 0, TAU); c.fill();
    c.strokeStyle = w.accent; c.lineWidth = size * .07; c.stroke(); c.strokeStyle = "#8c4dff"; c.lineWidth = size * .035; c.beginPath(); c.ellipse(0, 0, size * .39, size * .18, -.4, 0, TAU); c.stroke();
  } else if (type === "fire") {
    for (let i = -1; i <= 1; i++) { const xx = i * size * .19; c.shadowColor = "#ff8b32"; c.shadowBlur = size * .18; c.fillStyle = i ? "#ff6b2e" : "#fff1a3"; c.beginPath(); c.arc(xx, size * .03, size * .135, 0, TAU); c.fill(); c.fillStyle = "#fff2a1"; c.beginPath(); c.arc(xx - size * .03, -size * .02, size * .055, 0, TAU); c.fill(); }
  } else if (type === "splitter") {
    c.shadowColor = "#73eaff"; c.shadowBlur = size * .16; c.fillStyle = "#b9f7ff"; c.beginPath(); c.arc(0, 0, size * .29, 0, TAU); c.fill();
    c.fillStyle = "#223a55"; c.beginPath(); c.arc(0, 0, size * .14, 0, TAU); c.fill(); c.fillStyle = w.accent;
    for (const a of [-.65, .65]) { c.save(); c.rotate(a); rr(c, size * .04, -size * .035, size * .28, size * .07, 3); c.fill(); c.restore(); }
  } else if (type === "shield") {
    c.fillStyle = "#bceeff"; rr(c, -size * .28, -size * .31, size * .56, size * .62, size * .16); c.fill(); c.stroke();
    c.fillStyle = "#67cbe6"; rr(c, -size * .18, -size * .2, size * .36, size * .4, size * .11); c.fill(); c.fillStyle = "#eaffff"; c.fillRect(-size * .12, -size * .18, size * .06, size * .31);
  } else if (type === "cannon" || type === "mortar") {
    c.fillStyle = "#425a4c"; rr(c, -size * .27, -size * .19, size * .44, size * .38, 7); c.fill(); c.stroke(); c.fillStyle = w.accent; rr(c, size * .02, -size * .07, size * .35, size * .14, 4); c.fill();
    if (type === "mortar") { c.save(); c.rotate(-.75); c.fillStyle="#263b48"; rr(c,-size*.08,-size*.34,size*.16,size*.45,4); c.fill(); c.restore(); }
  } else if (type === "nuke") {
    c.save(); c.rotate(-.5); c.fillStyle="#313946"; c.beginPath(); c.ellipse(0,0,size*.19,size*.36,0,0,TAU); c.fill(); c.stroke(); c.fillStyle="#ff9a2e"; c.beginPath(); c.arc(0,size*.04,size*.1,0,TAU); c.fill(); c.fillStyle="#fff3a3"; c.beginPath(); c.arc(0,size*.04,size*.045,0,TAU); c.fill(); c.restore();
  } else if (type === "tesla") {
    c.strokeStyle="#c9fbff"; c.shadowColor="#62eaff"; c.shadowBlur=size*.18; c.lineWidth=size*.08; c.beginPath(); c.moveTo(-size*.3,size*.2); c.lineTo(-size*.08,-size*.05); c.lineTo(size*.02,size*.05); c.lineTo(size*.28,-size*.28); c.stroke();
    c.fillStyle="#344f74"; c.beginPath(); c.arc(-size*.27,size*.22,size*.1,0,TAU); c.arc(size*.28,-size*.28,size*.1,0,TAU); c.fill();
  } else if (type === "railgun") {
    c.save(); c.rotate(-.12); c.fillStyle="#31445b"; rr(c,-size*.36,-size*.12,size*.63,size*.24,5); c.fill(); c.stroke(); c.fillStyle="#d9ffff"; rr(c,-size*.12,-size*.045,size*.48,size*.09,3); c.fill(); c.shadowColor="#8ffaff"; c.shadowBlur=size*.2; c.fillStyle="#8ffaff"; c.beginPath(); c.arc(size*.3,0,size*.065,0,TAU); c.fill(); c.restore();
  } else if (type === "acid" || type === "flame") {
    c.fillStyle="#41565f"; rr(c,-size*.3,-size*.13,size*.46,size*.26,6); c.fill(); c.stroke(); c.fillStyle=w.accent; rr(c,size*.03,-size*.055,size*.31,size*.11,4); c.fill();
    c.shadowColor=w.accent; c.shadowBlur=size*.18; c.fillStyle=w.accent; c.beginPath(); c.arc(size*.31,0,size*.07,0,TAU); c.fill();
  } else if (type === "needle" || type === "drill") {
    c.save(); c.rotate(-.08); c.fillStyle="#d8f5ff"; c.strokeStyle="#29455a"; c.beginPath(); c.moveTo(-size*.32,size*.12); c.lineTo(size*.34,0); c.lineTo(-size*.32,-size*.12); c.closePath(); c.fill(); c.stroke(); if(type==="drill"){c.strokeStyle="#ffbf4c";c.lineWidth=size*.04;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*size*.1,-size*.11);c.lineTo((i+.7)*size*.1,size*.11);c.stroke();}} c.restore();
  } else if (type === "shard") {
    c.fillStyle="#d8fff4"; for (const a of [-.7,-.35,0,.35,.7]) { c.save(); c.rotate(a); c.beginPath(); c.moveTo(0,-size*.3); c.lineTo(size*.08,size*.14); c.lineTo(-size*.08,size*.14); c.closePath(); c.fill(); c.restore(); }
  } else if (type === "wave") {
    c.strokeStyle=w.accent; c.shadowColor=w.accent; c.shadowBlur=size*.18; c.lineWidth=size*.075; for(let i=0;i<3;i++){c.beginPath();c.arc(-size*.2+i*size*.08,0,size*(.18+i*.08),-1.05,1.05);c.stroke();}
  } else if (type === "vortex") {
    c.shadowColor=w.accent; c.shadowBlur=size*.25; c.fillStyle="#170326"; c.beginPath(); c.arc(0,0,size*.27,0,TAU); c.fill(); c.strokeStyle=w.accent; c.lineWidth=size*.055; for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,size*(.26+i*.06),size*(.09+i*.03),i*.7,0,TAU);c.stroke();}
  } else {
    c.fillStyle = w.accent; c.globalAlpha = .9; c.beginPath(); c.arc(-size * .1, 0, size * .18, 0, TAU); c.fill(); c.beginPath(); c.arc(size * .14, -size * .08, size * .12, 0, TAU); c.fill(); c.globalAlpha = 1;
  }
  if (flash) { c.globalAlpha = flash * .7; c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -size * .38, size * .22, 0, TAU); c.fill(); }
  c.restore();
}

function card(c, w, x, y, size, battle = false, lean = 0, bob = 0) {
  const st = weaponStats(w.type, w.rank), hp = battle ? clamp(w.hp / st.maxHp, 0, 1) : 1;
  const rarity = RARITY_COLORS[WEAPONS[w.type].rarity] || "#fff";
  c.save(); c.translate(x, y + bob + (w.recoil || 0) * 6); c.rotate(lean * .025);
  c.scale(1 + (w.recoil || 0) * .055, 1 - (w.recoil || 0) * .08);
  c.shadowColor = "#07111ccc"; c.shadowBlur = battle ? 9 : 5; c.shadowOffsetY = 5;
  rr(c, -size / 2, -size / 2, size, size, 7); c.fillStyle = "#0b1c30"; c.fill(); c.shadowBlur = 0;
  c.lineWidth = Math.max(2, size * .055); c.strokeStyle = rarity; c.stroke();
  icon(c, w.type, 0, -1, size * .88, w.flash);
  const gloss = c.createLinearGradient(0, -size / 2, 0, size / 2); gloss.addColorStop(0, "#ffffff35"); gloss.addColorStop(.5, "#ffffff08"); gloss.addColorStop(1, "#00000020");
  rr(c, -size * .44, -size * .44, size * .88, size * .88, 6); c.fillStyle = gloss; c.fill();
  if (w.hitFlash) { c.globalAlpha = w.hitFlash * .78; c.fillStyle = "#fff"; rr(c, -size * .47, -size * .47, size * .94, size * .94, 7); c.fill(); c.globalAlpha = 1; }
  text(c, rankLabel(w.rank), 0, size * .37, Math.max(9, size * .14), "#ffd94d");
  if (battle && hp < .995) {
    c.fillStyle = "#08172be8"; rr(c, -size * .43, size * .34, size * .86, size * .12, 3); c.fill();
    c.fillStyle = hp > .45 ? "#61ee73" : hp > .2 ? "#ffc64c" : "#ff5c52"; rr(c, -size * .41, size * .36, size * .82 * hp, size * .08, 2); c.fill();
  }
  c.restore();
}

function button(c, x, y, w, h, label, color) {
  c.save(); c.shadowColor = "#06152f88"; c.shadowBlur = 8; c.shadowOffsetY = 5;
  rr(c, x, y, w, h, 14); c.fillStyle = color; c.fill(); c.shadowBlur = 0; c.lineWidth = 4; c.strokeStyle = "#102747"; c.stroke();
  const lines = label.split("\n"); lines.forEach((q, i) => text(c, q, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 20, i ? 14 : 20, i ? "#fff2a1" : "#fff")); c.restore();
}

function tinyPanel(c, x, y, w, h, fill = "#0c2d50c9") { rr(c,x,y,w,h,12); c.fillStyle=fill; c.fill(); c.strokeStyle="#ffffff24"; c.lineWidth=2; c.stroke(); }
function inside(r, x, y) { return x >= r.x && x <= r.x+r.w && y >= r.y && y <= r.y+r.h; }

function drawStageTrack(c, L, s) {
  const count = L.W < 520 ? 5 : 7, half = Math.floor(count/2), step = Math.min(62, (L.W-70)/(count-1));
  for (let d=-half; d<=half; d++) {
    const stage = Math.max(1, s.stage+d), x=L.cx+d*step, y=103;
    c.save(); c.beginPath(); for(let k=0;k<6;k++){const a=Math.PI/6+k*Math.PI/3, xx=x+Math.cos(a)*22, yy=y+Math.sin(a)*22; k?c.lineTo(xx,yy):c.moveTo(xx,yy);} c.closePath();
    c.fillStyle = d===0 ? "#ffc733" : stage < s.stage ? "#436a85" : stage%10===0 ? "#8e40dd" : "#225f89"; c.fill(); c.strokeStyle="#d7f5ff88"; c.lineWidth=2; c.stroke();
    text(c, stage, x, y, d===0?15:13, "#fff"); if(stage%10===0) text(c,"★",x,y+26,10,"#ffdf5e"); c.restore();
  }
}

export function drawBuild(c, L, s) {
  buildBg(c, L, s); const U=getBuildUI(L), xpNeed=xpNeeded(s.level), cp=collectionProgress(s.stage);
  tinyPanel(c,U.level.x,U.level.y,U.level.w,U.level.h,"#11385ecc"); text(c,`LV ${s.level}`,U.level.x+34,U.level.y+17,15,"#fff");
  c.fillStyle="#081c32"; rr(c,U.level.x+8,U.level.y+33,U.level.w-16,9,4); c.fill(); c.fillStyle="#ffd33d"; rr(c,U.level.x+8,U.level.y+33,(U.level.w-16)*clamp(s.xp/xpNeed,0,1),9,4); c.fill();
  tinyPanel(c,U.chests.x,U.chests.y,U.chests.w,U.chests.h,"#51228bcc"); text(c,`🔑 ${s.keys}`,U.chests.x+U.chests.w/2,U.chests.y+16,14,"#fff"); text(c,"CHESTS",U.chests.x+U.chests.w/2,U.chests.y+36,12,"#ffd7ff");
  text(c,`STAGE ${s.stage}`,L.cx,34,24,"#fff"); text(c,`◆ ${s.gems}   ● ${shortNum(s.gold)}`,L.cx,60,15,"#ffe15d"); drawStageTrack(c,L,s);

  const cell=L.cell,gx=L.cx-cell*2.5,gy=L.gridY;
  for(let r=0;r<5;r++)for(let col=0;col<5;col++){
    const x=gx+col*cell,y=gy+r*cell; rr(c,x+3,y+3,cell-6,cell-6,10); c.fillStyle="rgba(155,238,255,.16)"; c.fill(); c.strokeStyle="rgba(255,255,255,.1)"; c.stroke();
    const w=s.grid[r*5+col]; if(w) card(c,w,x+cell/2,y+cell/2,cell*.82,false);
  }
  const count=s.grid.filter(Boolean).length,power=battlePower(s.grid); text(c,`TOWERS ${count}/25   •   BATTLE POWER ${power}`,L.cx,U.gridBottom+22,14,"#e7faff");
  U.purchases.forEach((r,i)=>{const cfg=PURCHASE_TIERS[i],locked=s.stage<cfg.minStage,cost=purchaseCost(s.stage,i,s.purchases[i]); button(c,r.x,r.y,r.w,r.h,locked?`${cfg.label} LOCKED
STAGE ${cfg.minStage}`:`${cfg.label} TOWER
${shortNum(cost)} ●`,locked?"#53677a":i===0?"#2aa9ed":i===1?"#45a8e8":"#a44ce8");});
  button(c,U.bag.x,U.bag.y,U.bag.w,U.bag.h,`BAG
${s.bag.length}`,"#7b47c7"); button(c,U.battle.x,U.battle.y,U.battle.w,U.battle.h,"⚔  BATTLE","#ffc42f"); button(c,U.collection.x,U.collection.y,U.collection.w,U.collection.h,`ARSENAL
${cp.unlocked}/${cp.total}`,"#277fc0");
  if(s.toast){ c.save(); c.globalAlpha=.92; tinyPanel(c,L.cx-170,Math.min(L.H-42,U.actionY+79),340,30,"#08192edb"); text(c,s.toast,L.cx,Math.min(L.H-27,U.actionY+94),12,"#fff"); c.restore(); }
}

function drawPanelFrame(c,L,s,title,subtitle="") { const P=getPanelUI(L,s); c.fillStyle="#06152bdd"; c.fillRect(0,0,L.W,L.H); c.save(); rr(c,P.panel.x,P.panel.y,P.panel.w,P.panel.h,24); const g=c.createLinearGradient(0,P.panel.y,0,P.panel.y+P.panel.h); g.addColorStop(0,"#164f86"); g.addColorStop(1,"#0d315b"); c.fillStyle=g; c.fill(); c.strokeStyle="#74d5ff55"; c.lineWidth=3; c.stroke(); text(c,title,L.cx,P.panel.y+42,28,"#fff"); if(subtitle) text(c,subtitle,L.cx,P.panel.y+72,13,"#bfeeff"); button(c,P.close.x,P.close.y,P.close.w,P.close.h,"×","#2ca9e8"); c.restore(); return P; }

function drawBagPanel(c,L,s){ const P=drawPanelFrame(c,L,s,"BAG","Stored towers can be deployed into the first connected slot."); if(!s.bag.length){text(c,"Your bag is empty",L.cx,P.panel.y+170,20,"#d9efff");return;} for(const r of P.bagRects){const w=s.bag[r.index];card(c,w,r.x+r.w/2,r.y+r.h/2,r.w*.88,false);text(c,"DEPLOY",r.x+r.w/2,r.y+r.h+8,9,"#9fffd1");} }
function drawCollectionPanel(c,L,s){ const P=drawPanelFrame(c,L,s,"ARSENAL",`${collectionProgress(s.stage).unlocked}/${TYPES.length} weapons unlocked`); const cols=L.W<520?4:5,gap=7,card=Math.min(82,(P.panel.w-34-gap*(cols-1))/cols),sx=L.cx-(cols*card+(cols-1)*gap)/2,sy=P.panel.y+105; TYPES.forEach((type,i)=>{const w=WEAPONS[type],x=sx+(i%cols)*(card+gap),y=sy+Math.floor(i/cols)*(card+28),locked=w.unlockStage>s.stage;c.save();c.globalAlpha=locked?.28:1; icon(c,type,x+card/2,y+card/2,card*.82);c.strokeStyle=RARITY_COLORS[w.rarity];c.lineWidth=2;rr(c,x+4,y+4,card-8,card-8,8);c.stroke();c.restore();text(c,locked?`S${w.unlockStage}`:w.name.split(" ")[0],x+card/2,y+card+7,8,locked?"#9fb2c4":"#fff");}); }
function drawRewardsPanel(c,L,s){ const P=drawPanelFrame(c,L,s,"LEVEL ROAD",`${s.xp}/${xpNeeded(s.level)} XP to the next level`); const start=Math.max(1,s.level-2), rows=Math.min(6,Math.floor((P.panel.h-125)/74)); for(let i=0;i<rows;i++){const lv=start+i,r=levelReward(lv),y=P.panel.y+110+i*72; tinyPanel(c,P.panel.x+28,y,P.panel.w-56,58,lv===s.level?"#275f95":"#123c68"); text(c,`LEVEL ${lv}`,P.panel.x+52,y+29,14,lv<=s.level?"#ffe25e":"#fff","left"); const parts=[]; if(r.gold)parts.push(`${shortNum(r.gold)} GOLD`);if(r.gems)parts.push(`${r.gems} GEMS`);if(r.keys)parts.push(`${r.keys} KEY${r.keys>1?"S":""}`);text(c,parts.join("  •  "),P.panel.x+P.panel.w-48,y+29,12,lv<=s.level?"#9effc1":"#d8efff","right");} }
function drawChestPanel(c,L,s){ const P=drawPanelFrame(c,L,s,"CHESTS","Earn keys from level milestones and every 10th stage."); for(const r of P.chestRects){const key=r.kind==="key"; tinyPanel(c,r.x,r.y,r.w,r.h,key?"#e3aa25":"#8c36cf"); text(c,key?"🔑":"◆",r.x+r.w/2,r.y+58,52,key?"#fff4a5":"#ff9cff"); text(c,key?"KEY CHEST":"EPIC CRATE",r.x+r.w/2,r.y+112,18,"#fff"); text(c,key?"1 KEY":"120 GEMS",r.x+r.w/2,r.y+148,16,"#fff4a5"); text(c,key?"1–3★ tower":"2–3★ tower",r.x+r.w/2,r.y+184,12,"#e8f7ff");} }
function drawPanel(c,L,s){ if(!s.panel)return; if(s.panel==="bag")drawBagPanel(c,L,s);else if(s.panel==="collection")drawCollectionPanel(c,L,s);else if(s.panel==="rewards")drawRewardsPanel(c,L,s);else if(s.panel==="chests")drawChestPanel(c,L,s); }

function roadPath(c, L) {
  const topHalf = roadHalfWidthAtY(L.W, L.H, ROAD_HORIZON_Y), bottomHalf = roadHalfWidthAtY(L.W, L.H, L.H * .98);
  c.beginPath(); c.moveTo(L.cx - topHalf, ROAD_HORIZON_Y); c.lineTo(L.cx + topHalf, ROAD_HORIZON_Y); c.lineTo(L.cx + bottomHalf, L.H * 1.02); c.lineTo(L.cx - bottomHalf, L.H * 1.02); c.closePath();
}

function drawBattleRoad(c, L, s) {
  const [a, b] = STAGE_COLORS[(s.stage - 1) % STAGE_COLORS.length];
  const outer = c.createLinearGradient(0, 0, 0, L.H); outer.addColorStop(0, "#071522"); outer.addColorStop(.18, "#0b2430"); outer.addColorStop(1, "#071018"); c.fillStyle = outer; c.fillRect(0, 0, L.W, L.H);

  c.save(); roadPath(c, L); c.clip();
  const road = c.createLinearGradient(0, ROAD_HORIZON_Y, 0, L.H); road.addColorStop(0, a); road.addColorStop(.58, b); road.addColorStop(1, a); c.fillStyle = road; c.fillRect(0, ROAD_HORIZON_Y, L.W, L.H);
  const shade = c.createLinearGradient(L.cx - L.W * .4, 0, L.cx + L.W * .4, 0); shade.addColorStop(0, "#00000028"); shade.addColorStop(.5, "#ffffff10"); shade.addColorStop(1, "#00000028"); c.fillStyle = shade; c.fillRect(0, ROAD_HORIZON_Y, L.W, L.H);

  for (let i = 0; i < 19; i++) {
    const u = ((i / 19 + (s.world * .0019)) % 1); const eased = u * u; const y = ROAD_HORIZON_Y + (L.H - ROAD_HORIZON_Y) * eased;
    const half = roadHalfWidthAtY(L.W, L.H, y); c.globalAlpha = .065 + eased * .09; c.fillStyle = "#fff"; c.fillRect(L.cx - half, y, half * 2, 1 + eased * 3.5);
  }
  for (const lane of [-.5, 0, .5]) {
    c.beginPath(); for (let i = 0; i <= 16; i++) { const y = ROAD_HORIZON_Y + (L.H - ROAD_HORIZON_Y) * i / 16; const half = roadHalfWidthAtY(L.W, L.H, y); const x = L.cx + half * lane; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.strokeStyle = "rgba(255,255,255,.055)"; c.lineWidth = 1.5; c.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const phase = (i * 91.71 + s.world * 2.15) % (L.H + 180); const y = ROAD_HORIZON_Y + phase;
    if (y > L.H) continue; const half = roadHalfWidthAtY(L.W, L.H, y), x = L.cx + Math.sin(i * 12.3) * half * .82;
    c.globalAlpha = .11 + (y / L.H) * .16; c.fillStyle = i % 3 ? "#fff" : "#bdfcff"; c.beginPath(); c.arc(x, y, 1 + y / L.H * 2.4, 0, TAU); c.fill();
  }
  c.restore(); c.globalAlpha = 1;

  const topHalf = roadHalfWidthAtY(L.W, L.H, ROAD_HORIZON_Y), bottomHalf = roadHalfWidthAtY(L.W, L.H, L.H * .98);
  c.shadowColor = "#d9ffff"; c.shadowBlur = 10; c.strokeStyle = "rgba(245,255,255,.82)"; c.lineWidth = 4;
  c.beginPath(); c.moveTo(L.cx - topHalf, ROAD_HORIZON_Y); c.lineTo(L.cx - bottomHalf, L.H); c.moveTo(L.cx + topHalf, ROAD_HORIZON_Y); c.lineTo(L.cx + bottomHalf, L.H); c.stroke(); c.shadowBlur = 0;

  const horizonGlow = c.createRadialGradient(L.cx, ROAD_HORIZON_Y, 0, L.cx, ROAD_HORIZON_Y, Math.min(290, L.W * .45)); horizonGlow.addColorStop(0, "#ffffff4d"); horizonGlow.addColorStop(.3, `${b}44`); horizonGlow.addColorStop(1, "#ffffff00"); c.fillStyle = horizonGlow; c.beginPath(); c.ellipse(L.cx, ROAD_HORIZON_Y, Math.min(290, L.W * .45), 70, 0, 0, TAU); c.fill();
}

function drawFinish(c, L, s) {
  const p = projectDistance(s.targetDistance - s.world, L.H); if (p.y < ROAD_HORIZON_Y - 40 || p.y > L.H + 60) return;
  const half = roadHalfWidthAtY(L.W, L.H, p.y); const stripeH = Math.max(8, 18 * p.scale), cells = 12, cw = half * 2 / cells;
  for (let i = 0; i < cells; i++) { c.fillStyle = i % 2 ? "#111827" : "#f9fbff"; c.fillRect(L.cx - half + i * cw, p.y - stripeH / 2, cw + 1, stripeH); }
  c.shadowColor = "#fff"; c.shadowBlur = 16; c.strokeStyle = "#fff"; c.lineWidth = 2; c.strokeRect(L.cx - half, p.y - stripeH / 2, half * 2, stripeH); c.shadowBlur = 0;
  text(c, "FINISH", L.cx, p.y - 26 * p.scale, Math.max(12, 22 * p.scale), "#fff7a0");
}

function blockShape(c, b, x, y, w, h, radius) {
  if (b.kind === "crystal") {
    c.beginPath(); c.moveTo(x - w * .43, y - h / 2); c.lineTo(x + w * .34, y - h / 2); c.lineTo(x + w / 2, y - h * .12); c.lineTo(x + w * .38, y + h / 2); c.lineTo(x - w * .4, y + h / 2); c.lineTo(x - w / 2, y + h * .08); c.closePath();
  } else rr(c, x - w / 2, y - h / 2, w, h, radius);
}

function drawBlock(c, L, s, b, pr) {
  const deathA = b.destroyed ? clamp(b.death / .34, 0, 1) : 1; if (deathA <= 0) return;
  const extra = b.destroyed ? (1 - deathA) * .16 : 0; const sc = pr.scale * (1 + extra); const w = b.w * sc, h = b.h * sc, x = L.cx + pr.x, y = pr.y;
  if (w < 3 || h < 3) return;
  c.save(); c.globalAlpha = deathA; c.translate(x, y); c.rotate(b.destroyed ? (1 - deathA) * .05 * Math.sin(b.phase) : 0); c.translate(-x, -y);
  c.shadowColor = "#07101d88"; c.shadowBlur = 10 * sc; c.shadowOffsetY = 8 * sc;
  blockShape(c, b, x, y, w, h, Math.max(4, b.round * sc));
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); g.addColorStop(0, b.hit > .72 ? "#fff" : b.color); g.addColorStop(.55, b.hit > .9 ? "#fff" : b.color); g.addColorStop(1, "#19243d"); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
  c.lineWidth = Math.max(1.5, 3.2 * sc); c.strokeStyle = "#101a2d"; c.stroke();

  c.save(); blockShape(c, b, x, y - h * .035, w * .91, h * .8, Math.max(3, b.round * sc * .7)); c.clip();
  const hi = c.createLinearGradient(0, y - h / 2, 0, y + h / 2); hi.addColorStop(0, "#ffffff42"); hi.addColorStop(.24, "#ffffff08"); hi.addColorStop(1, "#00000022"); c.fillStyle = hi; c.fillRect(x - w / 2, y - h / 2, w, h); c.restore();

  if (b.kind === "armored" || b.kind === "pillar" || b.kind === "heavy" || b.kind === "boss") {
    c.globalAlpha = deathA * .22; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1, 2 * sc);
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x - w * .46, y + k * h * .15); c.lineTo(x - w * .26, y + k * h * .15 - h * .12); c.stroke(); }
    c.globalAlpha = deathA;
  }
  if (b.kind === "boss") {
    c.strokeStyle = "#ffffff40"; c.lineWidth = Math.max(2, 5 * sc); rr(c, x - w * .43, y - h * .36, w * .86, h * .72, Math.max(6, 25 * sc)); c.stroke();
    const hp = clamp(b.hp / b.maxHp, 0, 1); c.fillStyle = "#0a1328aa"; rr(c, x - w * .34, y + h * .28, w * .68, Math.max(5, 10 * sc), 4); c.fill(); c.fillStyle = "#8cff85"; rr(c, x - w * .33, y + h * .29, w * .66 * hp, Math.max(3, 8 * sc), 3); c.fill();
  }
  const font = clamp(Math.min(w * .22, h * .42), 10, b.kind === "boss" ? 56 : 34); text(c, shortNum(b.hp), x, y - (b.kind === "boss" ? h * .04 : 0), font, "#fff");
  c.restore();
}

function drawShotTrail(c, L, q) {
  if (!q.trail.length) return; c.save();
  const pts = q.trail; c.lineCap = "round"; c.lineJoin = "round";
  if (q.kind === "laser") { c.shadowColor = "#71efff"; c.shadowBlur = 18; c.strokeStyle = "rgba(203,255,255,.7)"; c.lineWidth = 5; }
  else if (q.kind === "rocket") { c.strokeStyle = "rgba(255,154,53,.75)"; c.lineWidth = 5; c.shadowColor = "#ff7a2d"; c.shadowBlur = 9; }
  else if (q.kind === "fire") { c.strokeStyle = "rgba(255,90,34,.75)"; c.lineWidth = 8; c.shadowColor = "#ff8b2b"; c.shadowBlur = 14; }
  else if (q.kind === "gravity" || q.kind === "vortex") { c.strokeStyle = "rgba(214,66,255,.5)"; c.lineWidth = q.kind === "vortex" ? 10 : 7; c.shadowColor = "#b53cff"; c.shadowBlur = 15; }
  else if (q.kind === "rail" || q.kind === "tesla") { c.strokeStyle = q.kind === "rail" ? "rgba(215,255,255,.86)" : "rgba(142,237,255,.82)"; c.lineWidth = q.kind === "rail" ? 7 : 3; c.shadowColor = "#72efff"; c.shadowBlur = 16; }
  else if (q.kind === "flame" || q.kind === "nuke" || q.kind === "mortar") { c.strokeStyle = q.kind === "flame" ? "rgba(255,109,40,.72)" : "rgba(255,180,57,.62)"; c.lineWidth = q.kind === "flame" ? 9 : 7; c.shadowColor = "#ff8a2d"; c.shadowBlur = 14; }
  else { c.strokeStyle = `${q.color}88`; c.lineWidth = q.kind === "shell" || q.kind === "drill" ? 6 : 4; c.shadowColor = q.color; c.shadowBlur = 10; }
  c.beginPath(); pts.forEach((p, i) => { const x = L.cx + p[0], y = p[1]; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
}

function drawProjectile(c, L, q) {
  const x = L.cx + q.x, y = q.y; c.save(); c.translate(x, y);
  if (q.kind === "laser") {
    c.shadowColor = "#72ecff"; c.shadowBlur = 24; c.fillStyle = "#eaffff"; rr(c, -3.2, -24, 6.4, 44, 3); c.fill(); c.fillStyle = "#8cf7ff"; rr(c, -6, 6, 12, 12, 6); c.fill();
  } else if (q.kind === "rocket") {
    c.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 2); c.shadowColor = "#ff8b2f"; c.shadowBlur = 16; c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, 0, 5.5, 12, 0, 0, TAU); c.fill(); c.fillStyle = "#f04b38"; c.beginPath(); c.arc(0, -7, 5.5, 0, TAU); c.fill(); c.fillStyle = "#ffb13b"; c.beginPath(); c.moveTo(-5, 8); c.lineTo(0, 25 + Math.sin(q.age * 20) * 3); c.lineTo(5, 8); c.fill();
    c.strokeStyle = "#ffd96a"; c.lineWidth = 2; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, 10 + i * 8, 9 + i * 3, q.age * 8 + i, q.age * 8 + i + Math.PI * 1.25); c.stroke(); }
  } else if (q.kind === "nuke") {
    c.rotate(Math.atan2(q.vy,q.vx)+Math.PI/2); c.shadowColor="#ff9b31"; c.shadowBlur=22; c.fillStyle="#343b49"; c.beginPath(); c.ellipse(0,0,9,18,0,0,TAU); c.fill(); c.strokeStyle="#ffcb55"; c.lineWidth=3; c.stroke(); c.fillStyle="#ff9b2e"; c.beginPath(); c.arc(0,2,5,0,TAU); c.fill();
  } else if (q.kind === "mortar") {
    c.rotate(Math.atan2(q.vy,q.vx)+Math.PI/2); c.fillStyle="#3f4a4e"; c.beginPath(); c.ellipse(0,0,8,13,0,0,TAU); c.fill(); c.fillStyle="#ffd34c"; c.fillRect(-7,4,14,5);
  } else if (q.kind === "rail") {
    c.shadowColor="#8bf7ff"; c.shadowBlur=28; c.fillStyle="#eaffff"; rr(c,-3,-31,6,60,3); c.fill(); c.fillStyle="#7ceaff"; rr(c,-7,13,14,14,5); c.fill();
  } else if (q.kind === "tesla") {
    c.strokeStyle="#d7ffff"; c.shadowColor="#7ef0ff"; c.shadowBlur=20; c.lineWidth=3; c.beginPath(); c.moveTo(-5,13); c.lineTo(3,5); c.lineTo(-3,-2); c.lineTo(6,-10); c.lineTo(0,-17); c.stroke();
  } else if (q.kind === "acid") {
    c.shadowColor="#aaff4d"; c.shadowBlur=17; c.fillStyle="#90ee42"; c.beginPath(); c.arc(0,0,8,0,TAU); c.fill(); c.fillStyle="#eaff83"; c.beginPath(); c.arc(-2,-3,3,0,TAU); c.fill();
  } else if (q.kind === "wave") {
    c.strokeStyle="#f0a0ff"; c.shadowColor="#d75cff"; c.shadowBlur=22; c.lineWidth=6; c.beginPath(); c.arc(0,8,22,-2.7,-.45); c.stroke(); c.lineWidth=2;c.beginPath();c.arc(0,8,30,-2.7,-.45);c.stroke();
  } else if (q.kind === "flame") {
    c.shadowColor="#ff6b25";c.shadowBlur=20;c.fillStyle="#ff5b23";c.beginPath();c.arc(0,0,8,0,TAU);c.fill();c.fillStyle="#fff09a";c.beginPath();c.arc(-2,-2,4,0,TAU);c.fill();
  } else if (q.kind === "shard") {
    c.rotate(Math.atan2(q.vy,q.vx)+Math.PI/2);c.fillStyle="#d9fff5";c.shadowColor="#6fffd7";c.shadowBlur=13;c.beginPath();c.moveTo(0,-10);c.lineTo(5,7);c.lineTo(-5,7);c.closePath();c.fill();
  } else if (q.kind === "needle") {
    c.rotate(Math.atan2(q.vy,q.vx)+Math.PI/2);c.strokeStyle="#e8ffff";c.shadowColor="#76eaff";c.shadowBlur=10;c.lineWidth=2;c.beginPath();c.moveTo(0,-11);c.lineTo(0,8);c.stroke();
  } else if (q.kind === "drill") {
    c.rotate(Math.atan2(q.vy,q.vx)+Math.PI/2);c.fillStyle="#eefaff";c.beginPath();c.moveTo(0,-13);c.lineTo(8,5);c.lineTo(-8,5);c.closePath();c.fill();c.strokeStyle="#ffbd42";c.lineWidth=2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-6,i*4);c.lineTo(6,i*4+5);c.stroke();}
  } else if (q.kind === "vortex") {
    const g=c.createRadialGradient(0,0,2,0,0,26);g.addColorStop(0,"#fff");g.addColorStop(.18,"#ef68ff");g.addColorStop(.5,"#6611a8");g.addColorStop(1,"#1e003800");c.fillStyle=g;c.beginPath();c.arc(0,0,27,0,TAU);c.fill();c.strokeStyle="#f6a4ff";c.lineWidth=2;for(let i=0;i<3;i++){c.save();c.rotate(q.age*(2+i*.7)+i);c.beginPath();c.ellipse(0,0,29,8+i*4,0,0,TAU);c.stroke();c.restore();}
  } else if (q.kind === "gravity") {
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 22); g.addColorStop(0, "#fff"); g.addColorStop(.18, "#e061ff"); g.addColorStop(.47, "#7d20be"); g.addColorStop(1, "#24043c00"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 23, 0, TAU); c.fill();
    c.strokeStyle = "#f5a7ff"; c.lineWidth = 2.5; for (let i = 0; i < 2; i++) { c.save(); c.rotate(q.age * (2.5 + i) + i * 1.2); c.beginPath(); c.ellipse(0, 0, 24, 9 + i * 3, 0, 0, TAU); c.stroke(); c.restore(); }
  } else if (q.kind === "fire") {
    c.shadowColor = "#ff6d25"; c.shadowBlur = 22; c.fillStyle = "#ff5424"; c.beginPath(); c.moveTo(-8, 7); c.quadraticCurveTo(-1, 28 + Math.sin(q.age * 17) * 4, 7, 7); c.arc(0, 0, 9, 0, TAU); c.fill(); c.fillStyle = "#fff2a0"; c.beginPath(); c.arc(-1, -1, 5, 0, TAU); c.fill();
  } else if (q.kind === "bubble") {
    c.shadowColor = "#7af8ff"; c.shadowBlur = 15; c.fillStyle = "rgba(122,241,255,.35)"; c.strokeStyle = "#d5ffff"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(-3, -3, 2.4, 0, TAU); c.fill();
  } else if (q.kind === "shell") {
    c.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 2); c.shadowColor = "#ffca43"; c.shadowBlur = 14; c.fillStyle = "#ffdd59"; c.beginPath(); c.ellipse(0, 0, 7, 11, 0, 0, TAU); c.fill(); c.fillStyle = "#574630"; c.fillRect(-6, 5, 12, 6);
  } else if (q.kind === "split") {
    c.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 2); c.shadowColor = "#84f6ff"; c.shadowBlur = 19; c.fillStyle = "#e8ffff"; rr(c, -3, -14, 6, 29, 3); c.fill(); c.fillStyle = "#5befff"; c.beginPath(); c.arc(0, 4, 5, 0, TAU); c.fill();
  } else {
    c.shadowColor = q.color; c.shadowBlur = 18; c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 5.2, 0, TAU); c.fill(); c.fillStyle = q.color; c.beginPath(); c.arc(0, 0, 8.5, 0, TAU); c.globalAlpha = .45; c.fill();
  }
  c.restore();
}

function drawRings(c, L, s) {
  for (const r of s.rings) { const a = clamp(r.life / r.max, 0, 1); c.save(); c.globalAlpha = a * .85; c.strokeStyle = r.color; c.shadowColor = r.color; c.shadowBlur = 10; c.lineWidth = Math.max(.8, r.width * a); c.beginPath(); c.arc(L.cx + r.x, r.y, r.radius, 0, TAU); c.stroke(); c.restore(); }
}

function drawParticles(c, L, s) {
  for (const p of s.particles) {
    const a = clamp(p.life / p.max, 0, 1), x = L.cx + p.x, y = p.y; c.save(); c.globalAlpha = p.kind === "smoke" ? a * .48 : a;
    if (p.kind === "smoke") { c.fillStyle = p.color; c.beginPath(); c.arc(x, y, p.size, 0, TAU); c.fill(); }
    else if (p.kind === "shard") { c.translate(x, y); c.rotate(p.rot); c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 5; c.fillRect(-p.size * .65, -p.size * .22, p.size * 1.3, p.size * .44); }
    else { c.strokeStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 8; c.lineWidth = Math.max(1, p.size * .5); c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx * .035, y - p.vy * .035); c.stroke(); }
    c.restore();
  }
}

function drawCoins(c, L, s) {
  for (const coin of s.coins) { const a = clamp(coin.life / coin.max, 0, 1); c.save(); c.globalAlpha = a; c.translate(L.cx + coin.x, coin.y); c.scale(Math.max(.16, Math.abs(Math.cos(coin.spin))), 1); c.shadowColor = "#ffd92f"; c.shadowBlur = 8; c.fillStyle = "#ffd92f"; c.strokeStyle = "#ff8c00"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = "#fff4a1"; c.lineWidth = 1.5; c.beginPath(); c.arc(-1, -1, 4.3, -.4, 2); c.stroke(); c.restore(); }
}

function drawFormation(c, L, s) {
  const baseY = formationBaseY(L.H) + s.teamY;
  const alive = s.grid.filter(w => w && w.hp > 0).length; if (!alive) return;
  const glow = c.createRadialGradient(L.cx + s.teamX, baseY, 10, L.cx + s.teamX, baseY, 150); glow.addColorStop(0, "#c9ffff31"); glow.addColorStop(.55, "#4cecff13"); glow.addColorStop(1, "#4cecff00"); c.fillStyle = glow; c.beginPath(); c.ellipse(L.cx + s.teamX, baseY + 15, 165, 125, 0, 0, TAU); c.fill();

  const size = Math.min(50, L.cell * .75), bob = Math.sin(s.elapsed * 4.4) * 1.7;
  for (let i = 0; i < 25; i++) {
    const w = s.grid[i]; if (!w || w.hp <= 0) continue; const pos = formationCellPosition(s, i, L.H);
    card(c, w, L.cx + pos.x, pos.y, size, true, s.teamLean, bob + Math.sin(s.elapsed * 3 + i) * .45);
  }
}

function drawHud(c, L, s) {
  const progress = clamp(s.world / s.targetDistance, 0, 1), barW = Math.min(560, L.W - 42);
  c.save(); c.shadowColor = "#06142599"; c.shadowBlur = 10; rr(c, L.cx - barW / 2, 18, barW, 38, 17); c.fillStyle = "#07182bcc"; c.fill(); c.shadowBlur = 0;
  rr(c, L.cx - barW / 2 + 4, 22, (barW - 8) * progress, 30, 14); const pg = c.createLinearGradient(L.cx - barW / 2, 0, L.cx + barW / 2, 0); pg.addColorStop(0, "#ffd72f"); pg.addColorStop(1, "#ff9f24"); c.fillStyle = pg; c.fill();
  text(c, `STAGE ${s.stage}   •   +${s.earned} GOLD`, L.cx, 37, 15, "#fff");
  const rx = L.cx + Math.min(L.W * .41, 310), ry = L.H * .62; c.fillStyle = "#10213fc9"; c.strokeStyle = "#d9f7ff88"; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, 28, 0, TAU); c.fill(); c.stroke(); text(c, "AUTO", rx, ry - 6, 11, "#fff"); text(c, "ON", rx, ry + 9, 12, "#baffd0");
  const guideA = clamp(1 - Math.max(0, s.elapsed - 2.5) / 3, 0, 1); if (guideA > 0) { c.globalAlpha = guideA * .9; text(c, "DRAG / WASD TO STEER", L.cx, L.H - 28, 13, "#e8ffff"); }
  c.restore();
}

export function drawBattle(c, L, s) {
  drawBattleRoad(c, L, s);
  const sx = s.shake ? (Math.random() - .5) * s.shake : 0, sy = s.shake ? (Math.random() - .5) * s.shake * .72 : 0;
  c.save(); c.translate(sx, sy);
  drawFinish(c, L, s);

  const visible = s.blocks.map(b => ({ b, pr: projectBlock(s, b, L.H) }))
    .filter(o => o.pr.y > ROAD_HORIZON_Y - 100 && o.pr.y < L.H + 150)
    .sort((a, b) => a.pr.y - b.pr.y);
  for (const o of visible) drawBlock(c, L, s, o.b, o.pr);

  for (const q of s.shots) drawShotTrail(c, L, q);
  for (const q of s.shots) drawProjectile(c, L, q);
  drawRings(c, L, s); drawParticles(c, L, s); drawCoins(c, L, s);
  for (const f of s.floaters) { c.save(); c.globalAlpha = clamp(f.life / f.max, 0, 1); text(c, f.text, L.cx + f.x, f.y, f.big ? 21 : 15, f.big ? "#fff59c" : "#fff"); c.restore(); }
  drawFormation(c, L, s);
  c.restore();

  if (s.battleFlash > 0) { c.fillStyle = `rgba(255,244,195,${Math.min(.26, s.battleFlash * .28)})`; c.fillRect(0, 0, L.W, L.H); }
  drawHud(c, L, s);
}

export function drawResult(c, L, s) {
  drawBuild(c,L,s); c.fillStyle="#06152be8";c.fillRect(0,0,L.W,L.H); const R=getResultUI(L),r=s.lastResult||{}; rr(c,R.panel.x,R.panel.y,R.panel.w,R.panel.h,24); const g=c.createLinearGradient(0,R.panel.y,0,R.panel.y+R.panel.h);g.addColorStop(0,r.win?"#1c609d":"#77314f");g.addColorStop(1,r.win?"#113c70":"#4f253d");c.fillStyle=g;c.fill();c.strokeStyle="#ffffff33";c.lineWidth=3;c.stroke();
  text(c,r.win?"STAGE CLEARED!":"TEAM DESTROYED",L.cx,R.panel.y+48,31,r.win?"#ffe65b":"#ff91a6"); text(c,`+${shortNum(r.reward||0)} GOLD`,L.cx,R.panel.y+101,22,"#fff"); text(c,`+${r.xp||0} XP`,L.cx,R.panel.y+135,17,"#aee8ff");
  let y=R.panel.y+178; const lvl=r.progress?.rewards||[]; if(lvl.length){const last=lvl[lvl.length-1];text(c,`LEVEL UP → ${last.level}`,L.cx,y,19,"#9effbd");y+=31;text(c,last.label,L.cx,y,13,"#ffe99a");y+=30;} if(r.unlocks?.length){text(c,"NEW WEAPON UNLOCKED",L.cx,y,14,"#ffb6ff");y+=28;for(const u of r.unlocks.slice(0,2)){text(c,u.name,L.cx,y,17,RARITY_COLORS[u.rarity]||"#fff");y+=26;}} if(r.progress?.extras?.keys){text(c,`BOSS REWARD  +${r.progress.extras.keys} KEY`,L.cx,y+5,15,"#fff1a0");}
  button(c,R.continue.x,R.continue.y,R.continue.w,R.continue.h,"CONTINUE","#2db7f4");
}

export function render(c, L, s) {
  if (s.mode === "battle") drawBattle(c,L,s); else if(s.mode === "result") drawResult(c,L,s); else { drawBuild(c,L,s); drawPanel(c,L,s); }
}
