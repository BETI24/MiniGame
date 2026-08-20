import {
  WEAPONS, WEAPON_TIER_INFO, WEAPON_TIER_CAPS, STANDARD_TIER_WEIGHTS, STANDARD_TIER_WEIGHTS_BY_QUALITY, AIRDROP_TIER_WEIGHTS
} from "./CraterClashData.js";

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Rogue pools are deliberately broad. Unlocking a higher pool expands variety rather than
// simply replacing early-game weapons.
export const ROGUE_WEAPON_POOLS={
  1:[
    "core","tristar","orbvolley","shardbloom","ricochet","hyperbounce","roller","backroller","burrow",
    "prismsplit","groundwave","hunter","rampart","sinker","emberrain","clustergrenade","aquastream","infernojet",
    "breakerwave","twinkler","jumper","flower","rapidfire","cactus","airstrike","snake","flame","tadpoles","fireworks","counter3000",
    "digger","breaker","zipper","miniv"
  ],
  2:[
    "skymarker","meteorchoir","raillance","gravityseed","starburst","arcchain","moonfall","echobomb","mirror","viper",
    "scatterrise","timeskip","droneswarm","sniper","quakecharge","bulger","fountain","horizon","acidrain","areastrike",
    "hoverorb","boomerang","beehive","bumperbombs","clover","discoball","ghostbomb","guppies","palmburst","deadweight","bolt","bounder","uzi","stickybomb","fleet",
    "ringer","spiker","pinata","napalm","sunburst","synclets","seagull","shrapnel"
  ],
  3:[
    "kernelpop","deaddrop","faultline","pinpoint","megaflux","voidwell","carpetbomb","gunship","asteroidbelt","spider","bfg1000","recruiter",
    "batteringram","rampage","snowball","fighterjet","breakermadness","fury"
  ]
};

export function rogueAllowedWeaponIds(level=1){
  const out=[];
  for(let i=1;i<=Math.max(1,Math.min(3,level));i++)out.push(...ROGUE_WEAPON_POOLS[i]);
  return [...new Set(out)];
}

export function getWeaponTierCap(id){return WEAPON_TIER_CAPS[id]||3;}

export function getWeaponTierStats(id,tier=1){
  const base=WEAPONS[id]||WEAPONS.pulse;
  const cap=getWeaponTierCap(id);
  const t=clamp(Math.round(tier||1),1,cap);
  const info=WEAPON_TIER_INFO[t];
  const out={...base,tier:t,maxTier:cap,tierLabel:info.label,tierName:info.name,visualScale:info.visualScale||1};
  if(typeof out.damage==="number")out.damage*=info.damage;
  if(typeof out.echoDamage==="number")out.echoDamage*=info.damage;
  if(typeof out.burn==="number")out.burn*=1+(t-1)*.14;
  if(typeof out.acid==="number")out.acid*=1+(t-1)*.14;
  if(typeof out.radius==="number"&&out.radius>0)out.radius*=info.radius;
  if(typeof out.echoRadius==="number")out.echoRadius*=1+(t-1)*.07;
  if(typeof out.fieldRadius==="number")out.fieldRadius*=1+(t-1)*.08;
  if(typeof out.fieldTime==="number")out.fieldTime+=(t-1)*.30;
  if(typeof out.fragments==="number")out.fragments+=t-1;
  if(typeof out.bombs==="number")out.bombs+=t-1;
  if(typeof out.count==="number")out.count+=t-1;
  if(typeof out.chain==="number")out.chain+=t-1;
  if(typeof out.bounces==="number")out.bounces+=t-1;
  if(typeof out.wallBounces==="number")out.wallBounces+=t-1;
  if(typeof out.homing==="number")out.homing*=1+(t-1)*.14;
  if(typeof out.raise==="number")out.raise*=1+(t-1)*.14;
  if(typeof out.lineRadius==="number")out.lineRadius*=1+(t-1)*.09;
  if(typeof out.burnTime==="number")out.burnTime+=(t-1)*.55;
  if(typeof out.acidTime==="number")out.acidTime+=(t-1)*.50;
  if(typeof out.rollTime==="number")out.rollTime+=(t-1)*.30;
  if(typeof out.splitTime==="number")out.splitTime=Math.max(.24,out.splitTime-(t-1)*.07);
  out.visualScale*=1+(t-1)*.015;

  // Explicit family overrides are authoritative. They can alter behavior as well as size,
  // projectile count, bounce logic or strike pattern.
  const explicit=base.tierUpgrades?.[t];
  if(explicit)Object.assign(out,explicit);
  if(!out.tierNote)out.tierNote=t===1?"Base pattern":t===2?"Enhanced pattern":t===3?"Overclocked pattern":"Apex family mutation";
  return out;
}

export function tierDisplay(id,tier=1){const d=getWeaponTierStats(id,tier);return `${d.name} · T${d.tier}/${d.maxTier}`;}

function normalizeWeights(weights,maxTier,luck=0,weaponId=null){
  const cap=Math.min(4,weaponId?getWeaponTierCap(weaponId):4,Math.max(1,maxTier||1));
  const w={1:weights[1]||0,2:weights[2]||0,3:weights[3]||0,4:weights[4]||0};
  const l=clamp(luck,0,.95);
  // Luck gradually moves mass upward, especially into the two highest tiers the weapon owns.
  const shift=Math.min(w[1]*.84,l*.58);
  w[1]-=shift;
  if(cap===1)w[1]+=shift;
  else if(cap===2)w[2]+=shift;
  else if(cap===3){w[2]+=shift*.38;w[3]+=shift*.62;}
  else{w[2]+=shift*.25;w[3]+=shift*.43;w[4]+=shift*.32;}
  for(let tier=cap+1;tier<=4;tier++)w[tier]=0;
  const total=w[1]+w[2]+w[3]+w[4]||1;
  return {1:w[1]/total,2:w[2]/total,3:w[3]/total,4:w[4]/total};
}

export function rollWeaponTier({airdrop=false,maxTier=4,luck=0,botBonus=0,weaponId=null,quality=1}={}){
  const q=clamp(Math.round(Number(quality)||1),1,4);
  const base=airdrop?AIRDROP_TIER_WEIGHTS:(STANDARD_TIER_WEIGHTS_BY_QUALITY[q]||STANDARD_TIER_WEIGHTS);
  // Higher lobby-quality settings also nudge premium airdrops upward, but much less strongly
  // than they change normal starting/restock rolls.
  const qualityLuck=airdrop?(q-1)*.055:0;
  const weights=normalizeWeights(base,maxTier,luck+botBonus+qualityLuck,weaponId);
  let r=Math.random();
  for(const tier of [1,2,3,4]){r-=weights[tier];if(r<=0)return tier;}
  return Math.min(maxTier||4,weaponId?getWeaponTierCap(weaponId):4);
}

export function createRogueRun(){
  return {
    stage:1,wins:0,currency:0,totalCurrencyEarned:0,
    stats:{
      maxHp:105,maxFuel:90,grip:.76,fuelEfficiency:1,
      critChance:.03,critMultiplier:1.5,luck:0,startArmor:0,
      weaponCount:8,weaponPoolLevel:1,maxTier:1,damageBonus:1,
      overchargeRate:1,airdropWeapons:1,salvageBonus:0,crateArmorBonus:0
    },
    purchases:{},history:[]
  };
}

export function getRogueEnemyScale(run){
  const stage=run.stage;
  return {
    hp:1+Math.max(0,stage-1)*.105,
    armor:Math.min(75,Math.floor((stage-1)/2)*7),
    samples:Math.min(420,105+stage*24),
    aimError:Math.max(.010,.075-stage*.006),
    powerError:Math.max(.9,6.5-stage*.50),
    maxTier:stage>=9?4:stage>=6?3:stage>=3?2:1,
    tierBonus:Math.min(.52,(stage-1)*.038),
    critChance:Math.min(.20,.025+stage*.012),
    critMultiplier:Math.min(1.85,1.5+stage*.015),
    fuel:Math.min(175,80+stage*6),
    grip:Math.min(.96,.62+stage*.025),
    weaponCount:Math.min(22,7+Math.floor(stage*1.0)),
    weaponPoolLevel:stage>=6?3:stage>=3?2:1,
    damageBonus:1+Math.max(0,stage-1)*.018,
    boss:stage%5===0
  };
}
export function rogueStageLabel(run){return run.stage%5===0?`ELITE BATTLE ${run.stage}`:`BATTLE ${run.stage}`;}

// -------- Rogue shop --------
const rank=(run,id)=>run.purchases[id]||0;
const scaleCost=(base,r,mult=1.28)=>Math.round(base*Math.pow(mult,r)/5)*5;

export const ROGUE_SKILL_TREES=[
  {
    id:"hull",name:"Hull Engineer",icon:"▰",color:"#72d7ff",
    description:"Permanent-for-this-run durability and armor engineering.",
    nodes:[
      {id:"hull_hp",name:"Reinforced Hull",baseCost:120,max:4,description:"+20 max HP per rank."},
      {id:"hull_armor",name:"Reactive Plating",baseCost:175,max:4,requires:{id:"hull_hp",rank:1},description:"+12 starting armor per rank."},
      {id:"hull_bulkhead",name:"Composite Bulkhead",baseCost:330,max:2,requires:{id:"hull_hp",rank:3},description:"+8% max HP per rank."},
      {id:"hull_mastery",name:"Endless Hull Mastery",baseCost:420,max:Infinity,requires:{id:"hull_bulkhead",rank:2},repeatable:true,description:"Repeatable: +8 max HP and +2 starting armor."}
    ]
  },
  {
    id:"mobility",name:"Track Mechanic",icon:"⌁",color:"#70e8b0",
    description:"Fuel, efficiency and slope-climbing upgrades.",
    nodes:[
      {id:"mob_fuel",name:"Extended Fuel Cells",baseCost:95,max:5,description:"+14 fuel per turn."},
      {id:"mob_grip",name:"Climbing Tracks",baseCost:145,max:5,requires:{id:"mob_fuel",rank:1},description:"+0.065 slope grip per rank. Later ranks can cross genuinely steep crater walls."},
      {id:"mob_eff",name:"Efficient Engine",baseCost:210,max:4,requires:{id:"mob_fuel",rank:2},description:"Movement uses 7% less fuel."},
      {id:"mob_mastery",name:"Endless Track Mastery",baseCost:360,max:Infinity,requires:{id:"mob_grip",rank:4},repeatable:true,description:"Repeatable: +6 fuel, +0.012 slope grip and 1% efficiency."}
    ]
  },
  {
    id:"gun",name:"Gunnery Tutor",icon:"✦",color:"#ffd76a",
    description:"Critical hits, payload calibration and overcharge output.",
    nodes:[
      {id:"gun_crit",name:"Targeting Core",baseCost:130,max:5,description:"+2.5% critical-hit chance."},
      {id:"gun_critdmg",name:"Critical Barrel",baseCost:190,max:4,requires:{id:"gun_crit",rank:2},description:"+0.10× critical-hit multiplier."},
      {id:"gun_damage",name:"Calibrated Payloads",baseCost:220,max:5,requires:{id:"gun_crit",rank:1},description:"+4% all weapon damage."},
      {id:"gun_overcharge",name:"Flux Capacitor",baseCost:250,max:4,requires:{id:"gun_damage",rank:2},description:"Overcharge fills 12% faster."},
      {id:"gun_mastery",name:"Endless Gunnery Mastery",baseCost:480,max:Infinity,requires:{id:"gun_damage",rank:5},repeatable:true,description:"Repeatable: +1.5% damage and +0.5% crit chance."}
    ]
  },
  {
    id:"luck",name:"Salvage Broker",icon:"◇",color:"#c993ff",
    description:"Better weapon tiers, richer airdrops and more run currency.",
    nodes:[
      {id:"luck_core",name:"Scavenger Protocol",baseCost:120,max:5,description:"+5.5% loot luck."},
      {id:"luck_salvage",name:"Salvage Contracts",baseCost:170,max:4,requires:{id:"luck_core",rank:1},description:"+8% currency earned after victories."},
      {id:"luck_crate",name:"Airdrop Hacker",baseCost:270,max:2,requires:{id:"luck_core",rank:3},description:"Rank 1: +10 crate armor. Rank 2: airdrops grant one extra weapon."},
      {id:"luck_mastery",name:"Endless Fortune Mastery",baseCost:430,max:Infinity,requires:{id:"luck_core",rank:5},repeatable:true,description:"Repeatable: +1.5% loot luck and +2% salvage income."}
    ]
  }
];

export const ROGUE_SHOP_ITEMS=[
  {id:"tech2",name:"Weapon Tech II",icon:"Ⅱ",baseCost:260,max:1,description:"Unlock Tier II weapon drops for the rest of this run.",condition:r=>r.stats.maxTier<2},
  {id:"tech3",name:"Weapon Tech III",icon:"Ⅲ",baseCost:620,max:1,requires:{id:"tech2",rank:1},description:"Unlock Tier III weapon drops.",condition:r=>r.stats.maxTier<3},
  {id:"tech4",name:"Weapon Tech IV",icon:"Ⅳ",baseCost:1280,max:1,requires:{id:"tech3",rank:1},description:"Unlock Apex Tier IV drops for weapon families that actually have a fourth evolution.",condition:r=>r.stats.maxTier<4},
  {id:"arsenal2",name:"Advanced Arsenal",icon:"◆",baseCost:310,max:1,description:"Unlock the large advanced weapon pool.",condition:r=>r.stats.weaponPoolLevel<2},
  {id:"arsenal3",name:"Prototype Arsenal",icon:"✸",baseCost:720,max:1,requires:{id:"arsenal2",rank:1},description:"Unlock prototype and superweapon drops.",condition:r=>r.stats.weaponPoolLevel<3},
  {id:"arsenal_slots",name:"Expanded Weapon Rack",icon:"▦",baseCost:150,max:6,description:"+2 starting special-weapon slots each rank."},
  {id:"drop_armor",name:"Crate Armor Plating",icon:"⬡",baseCost:165,max:4,description:"+5 additional armor whenever you break an airdrop."},
  {id:"overcharge_core",name:"Overcharge Injector",icon:"ϟ",baseCost:245,max:3,description:"Overcharge fills 15% faster per rank."},
  {id:"starting_armor",name:"Emergency Armor Pack",icon:"▣",baseCost:190,max:4,description:"+10 starting armor every future battle."}
];

function allShopNodes(){return [...ROGUE_SKILL_TREES.flatMap(t=>t.nodes),...ROGUE_SHOP_ITEMS];}
export function getRogueUpgradeRank(run,id){return rank(run,id);}
export function getRogueUpgradeDef(id){return allShopNodes().find(x=>x.id===id)||null;}
export function getRogueUpgradeCost(run,id){
  const d=getRogueUpgradeDef(id);if(!d)return Infinity;
  const r=rank(run,id);return scaleCost(d.baseCost,r,d.repeatable?1.20:1.30);
}
export function rogueUpgradeUnlocked(run,id){
  const d=getRogueUpgradeDef(id);if(!d)return false;
  const r=rank(run,id);if(Number.isFinite(d.max)&&r>=d.max)return false;
  if(d.requires&&rank(run,d.requires.id)<d.requires.rank)return false;
  if(d.condition&&!d.condition(run))return false;
  return true;
}
export function canBuyRogueUpgrade(run,id){return rogueUpgradeUnlocked(run,id)&&run.currency>=getRogueUpgradeCost(run,id);}

function applyPurchaseEffect(run,id,newRank){
  const s=run.stats;
  switch(id){
    case "hull_hp":s.maxHp+=20;break;
    case "hull_armor":s.startArmor+=12;break;
    case "hull_bulkhead":s.maxHp=Math.round(s.maxHp*1.08);break;
    case "hull_mastery":s.maxHp+=8;s.startArmor+=2;break;
    case "mob_fuel":s.maxFuel+=14;break;
    case "mob_grip":s.grip=Math.min(1.24,s.grip+.065);break;
    case "mob_eff":s.fuelEfficiency=Math.max(.55,s.fuelEfficiency*.93);break;
    case "mob_mastery":s.maxFuel+=6;s.grip=Math.min(1.30,s.grip+.012);s.fuelEfficiency=Math.max(.50,s.fuelEfficiency*.99);break;
    case "gun_crit":s.critChance=Math.min(.45,s.critChance+.025);break;
    case "gun_critdmg":s.critMultiplier=Math.min(2.25,s.critMultiplier+.10);break;
    case "gun_damage":s.damageBonus*=1.04;break;
    case "gun_overcharge":s.overchargeRate*=1.12;break;
    case "gun_mastery":s.damageBonus*=1.015;s.critChance=Math.min(.50,s.critChance+.005);break;
    case "luck_core":s.luck=Math.min(.88,s.luck+.055);break;
    case "luck_salvage":s.salvageBonus+=.08;break;
    case "luck_crate":if(newRank===1)s.crateArmorBonus+=10;else s.airdropWeapons=2;break;
    case "luck_mastery":s.luck=Math.min(.95,s.luck+.015);s.salvageBonus+=.02;break;
    case "tech2":s.maxTier=Math.max(s.maxTier,2);break;
    case "tech3":s.maxTier=Math.max(s.maxTier,3);break;
    case "tech4":s.maxTier=4;break;
    case "arsenal2":s.weaponPoolLevel=Math.max(s.weaponPoolLevel,2);break;
    case "arsenal3":s.weaponPoolLevel=3;break;
    case "arsenal_slots":s.weaponCount=Math.min(26,s.weaponCount+2);break;
    case "drop_armor":s.crateArmorBonus+=5;break;
    case "overcharge_core":s.overchargeRate*=1.15;break;
    case "starting_armor":s.startArmor+=10;break;
  }
}

export function buyRogueUpgrade(run,id){
  if(!canBuyRogueUpgrade(run,id))return {ok:false,reason:"Locked or insufficient salvage"};
  const cost=getRogueUpgradeCost(run,id);
  run.currency-=cost;
  run.purchases[id]=(run.purchases[id]||0)+1;
  applyPurchaseEffect(run,id,run.purchases[id]);
  return {ok:true,cost,rank:run.purchases[id]};
}

export function rewardRogueVictory(run,{damage=0,rounds=1}={}){
  const elite=run.stage%5===0;
  const base=155+run.stage*34+(elite?150:0);
  const performance=Math.min(125,Math.round(damage*.11))+Math.max(0,28-Math.max(0,rounds-5)*3);
  const earned=Math.max(120,Math.round((base+performance)*(1+run.stats.salvageBonus)));
  run.currency+=earned;run.totalCurrencyEarned+=earned;
  return earned;
}

export function getRogueShopCatalog(run){
  return {
    trees:ROGUE_SKILL_TREES.map(t=>({...t,nodes:t.nodes.map(n=>({
      ...n,rank:rank(run,n.id),cost:getRogueUpgradeCost(run,n.id),available:rogueUpgradeUnlocked(run,n.id),affordable:canBuyRogueUpgrade(run,n.id)
    }))})),
    items:ROGUE_SHOP_ITEMS.map(n=>({...n,rank:rank(run,n.id),cost:getRogueUpgradeCost(run,n.id),available:rogueUpgradeUnlocked(run,n.id),affordable:canBuyRogueUpgrade(run,n.id)}))
  };
}
