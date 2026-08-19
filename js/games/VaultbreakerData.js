export const CHESTS = [
  ["Driftwood Cache","#9d6a3f","#6b4025",1.00,1.00],
  ["Ironbound Box","#866d52","#4e4438",1.28,1.18],
  ["Mossy Coffer","#678758","#415c37",1.55,1.37],
  ["Copper Strongbox","#ad704e","#62422e",1.92,1.65],
  ["Sailor's Chest","#557f92","#314b5a",2.32,1.94],
  ["Runed Casket","#8065a8","#493662",2.82,2.32],
  ["Silver Vault","#a9b5bf","#58646d",3.42,2.72],
  ["Coral Chest","#c96f71","#724149",4.08,3.18],
  ["Emerald Lockbox","#50a06d","#285b3c",4.88,3.72],
  ["Royal Coffer","#8c63b4","#4d326c",5.82,4.36],
  ["Golden Chest","#d3a743","#76551d",6.92,5.12],
  ["Frostbound Vault","#72b4d0","#355f7a",8.18,5.94],
  ["Obsidian Cache","#48505d","#232a31",9.68,6.88],
  ["Sunken Reliquary","#3f8f8b","#235657",11.38,7.92],
  ["Ruby Stronghold","#bd4f5c","#6d2635",13.36,9.12],
  ["Storm Coffer","#6573b4","#343b70",15.65,10.45],
  ["Jade Bastion","#4c9c75","#235b45",18.30,11.96],
  ["Moonsteel Chest","#a3a7cc","#555a82",21.36,13.65],
  ["Pirate King's Vault","#c88a31","#6f461a",24.90,15.56],
  ["Void Casket","#644a89","#302545",29.00,17.75],
  ["Celestial Chest","#79a7db","#415a8b",33.75,20.10],
  ["Dragon Hoard","#bf6740","#6d3226",39.25,22.80],
  ["Astral Reliquary","#7769d8","#3f367f",45.55,25.80],
  ["Phantom Vault","#78b7b1","#315f61",52.80,29.15],
  ["Crown Treasury","#d6b252","#7e5e24",61.10,32.95],
  ["Infernal Lockbox","#c64e43","#68251f",70.60,37.25],
  ["Starforged Chest","#67a8c8","#315c75",81.50,42.05],
  ["Ancient World Vault","#8c785c","#4a3e30",94.00,47.50],
  ["Prismatic Treasury","#a45fc5","#4a356f",108.30,53.70],
  ["Eternal Chest","#e0c96b","#74642a",124.60,60.70]
].map((c,i)=>({
  id:i,name:c[0],main:c[1],dark:c[2],
  hpMult:c[3],goldMult:c[4],
  tier:i+1
}));

export const ITEMS = [
  {id:"pick",name:"Runic Pick",icon:"⛏",unlock:1,baseCost:18,costScale:1.17,description:"Increases active click damage.",effect:"active",base:.70},
  {id:"hammer",name:"Vault Hammer",icon:"🔨",unlock:2,baseCost:85,costScale:1.18,description:"Adds a strong flat bonus to click damage.",effect:"activeFlat",base:2.4},
  {id:"crew",name:"Clockwork Crew",icon:"⚙",unlock:3,baseCost:160,costScale:1.19,description:"Adds passive damage every second.",effect:"passive",base:1.4},
  {id:"parrot",name:"Coin Parrot",icon:"🦜",unlock:4,baseCost:420,costScale:1.20,description:"Improves all gold rewards.",effect:"gold",base:.08},
  {id:"crittonic",name:"Crit Tonic",icon:"🧪",unlock:5,baseCost:920,costScale:1.21,description:"Raises critical hit chance.",effect:"crit",base:.008},
  {id:"powder",name:"Powder Keg",icon:"💣",unlock:6,baseCost:1800,costScale:1.22,description:"Raises critical damage.",effect:"critDamage",base:.07},
  {id:"manual",name:"Captain's Manual",icon:"📜",unlock:8,baseCost:4200,costScale:1.22,description:"Improves experience from opened chests.",effect:"xp",base:.10},
  {id:"magnet",name:"Golden Magnet",icon:"🧲",unlock:10,baseCost:8900,costScale:1.23,description:"Grants passive gold even between chest breaks.",effect:"idleGold",base:.07},
  {id:"charm",name:"Treasure Charm",icon:"🍀",unlock:12,baseCost:21000,costScale:1.24,description:"Improves rare treasure drop chance.",effect:"treasure",base:.08},
  {id:"bombard",name:"Mini Cannon",icon:"💥",unlock:15,baseCost:54000,costScale:1.25,description:"Periodically fires a heavy automatic hit.",effect:"cannon",base:4.0},
  {id:"gild",name:"Golden Touch",icon:"☝",unlock:18,baseCost:140000,costScale:1.25,description:"Clicks have a chance to instantly spawn bonus gold.",effect:"goldTouch",base:.01},
  {id:"mimic",name:"Pocket Mimic",icon:"👁",unlock:22,baseCost:390000,costScale:1.26,description:"Occasionally duplicates the next chest reward.",effect:"double",base:.01}
];

export const CURSORS = [
  {id:"finger",name:"Seafarer's Tap",icon:"☝",unlock:1,active:1,passive:1,crit:0,critDmg:0,bonus:"Balanced starter."},
  {id:"needle",name:"Precision Point",icon:"◆",unlock:3,active:1.25,passive:.90,crit:.03,critDmg:.10,bonus:"Active damage + crit chance."},
  {id:"palm",name:"Phantom Palm",icon:"✋",unlock:5,active:.88,passive:1.32,crit:0,critDmg:0,bonus:"Strong passive damage."},
  {id:"steel",name:"Steel Strike",icon:"✊",unlock:7,active:1.55,passive:.82,crit:-.01,critDmg:.18,bonus:"Heavy active hits."},
  {id:"spark",name:"Energy Surge",icon:"⚡",unlock:10,active:1.18,passive:1.16,crit:.015,critDmg:.15,bonus:"Hybrid electric build."},
  {id:"claw",name:"Cursed Claw",icon:"🜏",unlock:13,active:1.35,passive:1.05,crit:.035,critDmg:.30,bonus:"High-risk crit build."},
  {id:"shadow",name:"Shadow Surge",icon:"◈",unlock:17,active:1.30,passive:1.30,crit:.025,critDmg:.25,bonus:"Powerful all-rounder."},
  {id:"sniper",name:"Sniper Click",icon:"✣",unlock:21,active:1.62,passive:.92,crit:.055,critDmg:.50,bonus:"Rare, explosive criticals."},
  {id:"vortex",name:"Vortex Tap",icon:"◉",unlock:26,active:1.40,passive:1.40,crit:.03,critDmg:.25,bonus:"Late-game hybrid."},
  {id:"royal",name:"King's Hand",icon:"♛",unlock:32,active:1.70,passive:1.35,crit:.045,critDmg:.45,bonus:"Prestige-grade cursor."}
];

export const TREASURES = [
  ["Pirate Skull","☠","common","active",.03],
  ["Lucky Bone","🦴","common","gold",.03],
  ["Moon Ring","◌","uncommon","passive",.05],
  ["Victory Medal","🏅","uncommon","xp",.06],
  ["Fallen Star","★","rare","crit",.007],
  ["King's Crown","♛","rare","gold",.09],
  ["Emerald Compass","✥","rare","treasure",.10],
  ["Sunken Guitar","♬","rare","passive",.10],
  ["Dragon Tooth","♦","epic","critDamage",.16],
  ["Ghost Lantern","◈","epic","active",.14],
  ["Royal Goblet","♜","epic","gold",.18],
  ["Ancient Coin","●","epic","idleGold",.20],
  ["Cursed Idol","🜏","legendary","active",.25],
  ["Phoenix Feather","⌁","legendary","passive",.27],
  ["Prism Gem","◆","legendary","crit",.018],
  ["Leviathan Scale","◒","legendary","gold",.30],
  ["Void Key","⚿","mythic","treasure",.35],
  ["Astral Sextant","✦","mythic","xp",.42],
  ["World Pearl","◉","mythic","all",.10],
  ["Eternal Trophy","🏆","mythic","all",.14],
  ["Timepiece","⌚","ultra","passive",.65],
  ["Black Diamond","⬟","ultra","critDamage",.70],
  ["Crown of Tides","♕","ultra","gold",.85],
  ["Heart of Fortune","♥","ultra","all",.25]
].map((t,i)=>({id:"tr"+i,name:t[0],icon:t[1],rarity:t[2],effect:t[3],value:t[4]}));

export const RARITY = {
  common:{label:"COMMON",color:"#9ca5ac",weight:58},
  uncommon:{label:"UNCOMMON",color:"#67c87d",weight:25},
  rare:{label:"RARE",color:"#54a7e8",weight:10},
  epic:{label:"EPIC",color:"#b974e5",weight:4.5},
  legendary:{label:"LEGENDARY",color:"#efb64d",weight:1.8},
  mythic:{label:"MYTHIC",color:"#f06472",weight:.55},
  ultra:{label:"ULTRA",color:"#6de9df",weight:.15}
};

export const SKILL_BRANCHES = [
  {
    id:"striker",name:"STRIKER",color:"#df7562",icon:"✹",
    nodes:[
      {id:"s_power",name:"Heavy Hands",cost:1,max:10,effect:"active",value:.12,desc:"+12% active damage per rank."},
      {id:"s_crit",name:"Sharp Timing",cost:2,max:8,requires:"s_power",effect:"crit",value:.006,desc:"+0.6% crit chance per rank."},
      {id:"s_burst",name:"Critical Force",cost:3,max:8,requires:"s_crit",effect:"critDamage",value:.10,desc:"+10% critical damage per rank."},
      {id:"s_combo",name:"Combo Rhythm",cost:5,max:5,requires:"s_burst",effect:"combo",value:.10,desc:"Combo bonus grows faster."},
      {id:"s_goldhit",name:"Midas Knuckles",cost:7,max:5,requires:"s_combo",effect:"goldTouch",value:.02,desc:"Clicks can burst bonus gold."},
      {id:"s_end",name:"Endless Impact",cost:12,max:999,requires:"s_goldhit",effect:"active",value:.08,desc:"Repeatable: +8% active damage."}
    ]
  },
  {
    id:"idler",name:"AUTOMATON",color:"#6ba85e",icon:"⚙",
    nodes:[
      {id:"i_pass",name:"Clockwork Hands",cost:1,max:10,effect:"passive",value:.12,desc:"+12% passive DPS per rank."},
      {id:"i_speed",name:"Rapid Gears",cost:2,max:8,requires:"i_pass",effect:"passive",value:.10,desc:"+10% passive damage."},
      {id:"i_offline",name:"Deep Sleep",cost:3,max:6,requires:"i_speed",effect:"offline",value:.12,desc:"+12% offline efficiency."},
      {id:"i_cannon",name:"Auto Cannon",cost:5,max:6,requires:"i_offline",effect:"cannon",value:.30,desc:"Improves periodic cannon strikes."},
      {id:"i_idlecoin",name:"Idle Mint",cost:7,max:5,requires:"i_cannon",effect:"idleGold",value:.12,desc:"Generate more gold every second."},
      {id:"i_end",name:"Endless Machinery",cost:12,max:999,requires:"i_idlecoin",effect:"passive",value:.08,desc:"Repeatable: +8% passive DPS."}
    ]
  },
  {
    id:"pirate",name:"CORSAIR",color:"#d8a848",icon:"☠",
    nodes:[
      {id:"p_gold",name:"Plunder",cost:1,max:10,effect:"gold",value:.10,desc:"+10% chest gold per rank."},
      {id:"p_xp",name:"Sea Wisdom",cost:2,max:8,requires:"p_gold",effect:"xp",value:.10,desc:"+10% XP per rank."},
      {id:"p_treasure",name:"Treasure Maps",cost:3,max:8,requires:"p_xp",effect:"treasure",value:.12,desc:"Improves treasure drop chance."},
      {id:"p_double",name:"Double Plunder",cost:5,max:5,requires:"p_treasure",effect:"double",value:.02,desc:"Chance to duplicate a chest reward."},
      {id:"p_lucky",name:"Lucky Seas",cost:7,max:5,requires:"p_double",effect:"rarity",value:.12,desc:"Improves treasure rarity rolls."},
      {id:"p_end",name:"Endless Fortune",cost:12,max:999,requires:"p_lucky",effect:"gold",value:.08,desc:"Repeatable: +8% all gold."}
    ]
  },
  {
    id:"collector",name:"COLLECTOR",color:"#7599b6",icon:"▣",
    nodes:[
      {id:"c_shop",name:"Bulk Buyer",cost:1,max:10,effect:"shop",value:.025,desc:"Item upgrades cost 2.5% less per rank."},
      {id:"c_item",name:"Fine Tools",cost:2,max:8,requires:"c_shop",effect:"item",value:.08,desc:"+8% strength from item levels."},
      {id:"c_relic",name:"Relic Expert",cost:3,max:8,requires:"c_item",effect:"treasurePower",value:.08,desc:"Collected treasures give stronger bonuses."},
      {id:"c_unlock",name:"Deep Pockets",cost:5,max:5,requires:"c_relic",effect:"gold",value:.12,desc:"More gold from high-tier chests."},
      {id:"c_cache",name:"Secret Cache",cost:7,max:5,requires:"c_unlock",effect:"chestSkip",value:.015,desc:"Chance a chest instantly opens on spawn."},
      {id:"c_end",name:"Endless Hoard",cost:12,max:999,requires:"c_cache",effect:"item",value:.06,desc:"Repeatable: +6% item power."}
    ]
  },
  {
    id:"explorer",name:"PATHFINDER",color:"#b97850",icon:"✦",
    nodes:[
      {id:"e_xp",name:"Explorer's Journal",cost:1,max:10,effect:"xp",value:.10,desc:"+10% XP per rank."},
      {id:"e_boss",name:"Vault Hunter",cost:2,max:8,requires:"e_xp",effect:"bossGold",value:.12,desc:"+12% boss-vault rewards."},
      {id:"e_rare",name:"Relic Sense",cost:3,max:8,requires:"e_boss",effect:"treasure",value:.11,desc:"Improves treasure discovery."},
      {id:"e_cursor",name:"Cursor Mastery",cost:5,max:6,requires:"e_rare",effect:"cursor",value:.07,desc:"+7% equipped cursor bonuses."},
      {id:"e_ascend",name:"Ascendant Map",cost:7,max:5,requires:"e_cursor",effect:"ascend",value:.12,desc:"+12% Crown Shards on ascension."},
      {id:"e_end",name:"Endless Journey",cost:12,max:999,requires:"e_ascend",effect:"all",value:.035,desc:"Repeatable: +3.5% all damage and gold."}
    ]
  }
];

export const ASCENSION_PERKS = [
  {id:"a_damage",name:"Eternal Strength",icon:"✹",baseCost:1,costScale:1.85,effect:"damage",value:.18,desc:"+18% active and passive damage."},
  {id:"a_gold",name:"Golden Legacy",icon:"●",baseCost:1,costScale:1.90,effect:"gold",value:.20,desc:"+20% all gold."},
  {id:"a_xp",name:"Ancient Memory",icon:"✦",baseCost:2,costScale:1.95,effect:"xp",value:.20,desc:"+20% XP gain."},
  {id:"a_luck",name:"Relic Destiny",icon:"◆",baseCost:3,costScale:2.05,effect:"treasure",value:.18,desc:"+18% treasure chance and rarity."},
  {id:"a_start",name:"Head Start",icon:"⚡",baseCost:4,costScale:2.20,effect:"start",value:1,desc:"Begin new ascensions several chest stages ahead."}
];
