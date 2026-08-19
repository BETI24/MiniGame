export const RESOURCES = {
  food:{name:"Food",icon:"●",color:"#f1c95f"},
  leaves:{name:"Leaves",icon:"◆",color:"#77c777"},
  resin:{name:"Resin",icon:"⬢",color:"#df9f5f"},
  protein:{name:"Protein",icon:"✦",color:"#d96d61"}
};

export const LOCATIONS = [
  {id:"seed",name:"Seed Patch",icon:"🌾",unlockPop:1,resource:"food",rate:1.0,travel:1.0,capacity:2,angle:-2.55,dist:.38,desc:"Reliable seeds. The backbone of early colony growth."},
  {id:"aphids",name:"Aphid Grove",icon:"🌿",unlockPop:12,resource:"food",rate:1.8,travel:1.25,capacity:3,angle:-1.45,dist:.42,desc:"Workers tend aphids for a steady flow of sugary honeydew."},
  {id:"leaf",name:"Leaf Garden",icon:"🍃",unlockPop:22,resource:"leaves",rate:1.55,travel:1.08,capacity:4,angle:-.45,dist:.43,desc:"Large soft leaves used by the fungus chambers and nest expansion."},
  {id:"log",name:"Fallen Log",icon:"🪵",unlockPop:36,resource:"resin",rate:1.2,travel:1.42,capacity:4,angle:.45,dist:.45,desc:"Sticky resin and fibers make the tunnels sturdier."},
  {id:"beetle",name:"Beetle Remains",icon:"🪲",unlockPop:55,resource:"protein",rate:1.35,travel:1.55,capacity:5,angle:1.35,dist:.44,desc:"High-protein scraps accelerate brood and soldier production."},
  {id:"orchard",name:"Berry Orchard",icon:"🍓",unlockPop:85,resource:"food",rate:3.6,travel:1.7,capacity:6,angle:2.15,dist:.48,desc:"Rich fruit pulp supports a much larger colony."},
  {id:"moss",name:"Moss Hollow",icon:"☘",unlockPop:125,resource:"leaves",rate:3.1,travel:1.62,capacity:6,angle:2.92,dist:.47,desc:"Dense moss supplies soft plant matter for advanced fungus farms."},
  {id:"pine",name:"Pine Resin Bank",icon:"🌲",unlockPop:180,resource:"resin",rate:2.8,travel:1.92,capacity:7,angle:-2.95,dist:.53,desc:"A distant but extremely valuable source of construction resin."},
  {id:"carcass",name:"Caterpillar Carcass",icon:"🐛",unlockPop:260,resource:"protein",rate:3.3,travel:2.05,capacity:8,angle:-2.0,dist:.55,desc:"A huge protein source guarded by opportunistic predators."}
];

export const CHAMBERS = [
  {id:"nursery",name:"Brood Nursery",icon:"🥚",unlockPop:1,baseCost:{food:25},scale:1.26,desc:"Raises colony growth speed and brood capacity.",effects:{birthRate:.20,broodCap:5}},
  {id:"granary",name:"Granary",icon:"🏺",unlockPop:8,baseCost:{food:60,leaves:10},scale:1.28,desc:"Improves food storage and worker carry capacity.",effects:{carry:.12,foodMult:.08}},
  {id:"fungus",name:"Fungus Garden",icon:"🍄",unlockPop:20,baseCost:{leaves:65,food:90},scale:1.30,desc:"Converts leaves into passive colony nutrition.",effects:{passiveFood:1.6,leafValue:.10}},
  {id:"barracks",name:"Soldier Barracks",icon:"🛡",unlockPop:35,baseCost:{food:150,protein:35},scale:1.31,desc:"Increases soldier strength and predator loot.",effects:{soldier:.16,raidLoot:.12}},
  {id:"queen",name:"Queen Chamber",icon:"♛",unlockPop:60,baseCost:{food:260,protein:75,resin:20},scale:1.32,desc:"Greatly improves egg production and maximum colony size.",effects:{birthRate:.28,popCap:18}},
  {id:"pheromone",name:"Pheromone Hub",icon:"〽",unlockPop:100,baseCost:{food:420,resin:100},scale:1.33,desc:"Shortens all travel routes and increases gathering throughput.",effects:{travel:.055,gather:.10}},
  {id:"vault",name:"Resin Vault",icon:"⬡",unlockPop:160,baseCost:{resin:180,leaves:220},scale:1.34,desc:"Improves resin yield and gives passive construction resources.",effects:{resinMult:.12,passiveResin:.8}},
  {id:"war",name:"War Chamber",icon:"⚔",unlockPop:240,baseCost:{protein:240,resin:160,food:750},scale:1.35,desc:"Elite soldier training for dangerous surface encounters.",effects:{soldier:.24,raidLoot:.20}}
];

export const UPGRADES = [
  {id:"mandibles",name:"Sharper Mandibles",icon:"✂",unlockPop:1,baseCost:{food:18},scale:1.19,stat:"gatherPower",base:1,growth:.18,unit:"×",desc:"Raises resources harvested per worker trip."},
  {id:"sacks",name:"Expanded Crop",icon:"◒",unlockPop:5,baseCost:{food:34},scale:1.20,stat:"carry",base:1,growth:.12,unit:"×",desc:"Workers carry more material back to the nest."},
  {id:"legs",name:"Long-Strider Line",icon:"⌁",unlockPop:9,baseCost:{food:52},scale:1.21,stat:"speed",base:1,growth:.07,unit:"×",desc:"Workers walk faster along pheromone trails."},
  {id:"scouts",name:"Scout Ants",icon:"⌖",unlockPop:14,baseCost:{food:85},scale:1.22,stat:"discovery",base:1,growth:.09,unit:"×",desc:"Improves temporary event frequency and rare finds."},
  {id:"pheromones",name:"Dense Pheromone Trails",icon:"〽",unlockPop:24,baseCost:{food:120,leaves:25},scale:1.23,stat:"route",base:1,growth:.065,unit:"×",desc:"Makes all active gathering routes more efficient."},
  {id:"fungalculture",name:"Cultured Fungus",icon:"🍄",unlockPop:32,baseCost:{leaves:90,food:160},scale:1.24,stat:"fungus",base:1,growth:.11,unit:"×",desc:"Raises passive food created by the fungus garden."},
  {id:"armor",name:"Chitin Armor",icon:"⬟",unlockPop:48,baseCost:{protein:45,food:200},scale:1.25,stat:"soldier",base:1,growth:.10,unit:"×",desc:"Improves soldier effectiveness during predator raids."},
  {id:"broodfood",name:"Royal Brood Jelly",icon:"✦",unlockPop:68,baseCost:{food:320,protein:65},scale:1.25,stat:"birth",base:1,growth:.10,unit:"×",desc:"Speeds queen egg-laying and larval development."},
  {id:"resinworks",name:"Resin Tools",icon:"⬢",unlockPop:95,baseCost:{resin:90,food:460},scale:1.26,stat:"resin",base:1,growth:.12,unit:"×",desc:"Improves resin harvest and advanced chamber construction."},
  {id:"nurses",name:"Nurse Caste",icon:"♡",unlockPop:125,baseCost:{food:650,protein:130},scale:1.27,stat:"nursery",base:1,growth:.09,unit:"×",desc:"Raises brood capacity and birth speed."},
  {id:"logistics",name:"Colony Logistics",icon:"⇄",unlockPop:170,baseCost:{food:900,resin:180},scale:1.28,stat:"allGather",base:1,growth:.07,unit:"×",desc:"Raises output from every surface location."},
  {id:"warfare",name:"Coordinated Swarm",icon:"⚔",unlockPop:230,baseCost:{protein:260,food:1400},scale:1.29,stat:"raid",base:1,growth:.12,unit:"×",desc:"Increases predator damage and rewards."},
  {id:"queenline",name:"Queen's Bloodline",icon:"♛",unlockPop:320,baseCost:{food:2400,protein:450,resin:260},scale:1.30,stat:"population",base:1,growth:.06,unit:"×",desc:"Raises maximum sustainable population and growth."},
  {id:"supertrail",name:"Highway Trails",icon:"═",unlockPop:450,baseCost:{food:4000,leaves:850,resin:430},scale:1.31,stat:"speed",base:1,growth:.10,unit:"×",desc:"Late-game pheromone highways make the surface visibly swarm."}
];

export const MILESTONES = [
  {pop:10,name:"First Foragers",reward:"More visible ants on the surface"},
  {pop:25,name:"Organized Trails",reward:"+8% gathering"},
  {pop:50,name:"Soldier Caste",reward:"Predator raids unlocked"},
  {pop:100,name:"Established Colony",reward:"+15% birth speed"},
  {pop:200,name:"Surface Network",reward:"+15% travel speed"},
  {pop:350,name:"Underground City",reward:"+20% all production"},
  {pop:600,name:"Dominant Colony",reward:"+1 ant per birth cycle"},
  {pop:1000,name:"Supercolony",reward:"+35% all production"}
];

export const PRESTIGE = [
  {id:"gene_work",name:"Forager Genetics",icon:"🐜",baseCost:1,scale:1.9,effect:"gather",value:.18,desc:"+18% all gathering each rank."},
  {id:"gene_queen",name:"Royal Genetics",icon:"♛",baseCost:1,scale:1.95,effect:"birth",value:.18,desc:"+18% colony growth speed each rank."},
  {id:"gene_war",name:"Warrior Genetics",icon:"⚔",baseCost:2,scale:2.0,effect:"raid",value:.22,desc:"+22% raid strength and loot."},
  {id:"gene_start",name:"Founding Swarm",icon:"✦",baseCost:3,scale:2.1,effect:"start",value:12,desc:"Begin future colonies with +12 workers per rank."},
  {id:"gene_all",name:"Supercolony Memory",icon:"∞",baseCost:4,scale:2.15,effect:"all",value:.10,desc:"+10% all production each rank."}
];
