export const REGIONS = [
  {id:'pond',name:'Willow Pond',icon:'🌿',unlockLevel:1,color:'#4f9b78',sky:'#8bc7c5',water:'#2f756e',mult:1.0,fish:['bluegill','perch','carp','trout']},
  {id:'river',name:'Silver River',icon:'🏞',unlockLevel:6,color:'#4a88a8',sky:'#78b5cc',water:'#286b8a',mult:2.1,fish:['roach','chub','pike','salmon']},
  {id:'lake',name:'Moonlake',icon:'🌙',unlockLevel:12,color:'#5066a3',sky:'#566b9b',water:'#283d70',mult:4.4,fish:['tench','walleye','catfish','sturgeon']},
  {id:'coast',name:'Coral Coast',icon:'🌊',unlockLevel:20,color:'#2b9ea4',sky:'#72c7c1',water:'#147b87',mult:8.8,fish:['mackerel','snapper','mahi','tuna']},
  {id:'deep',name:'Midnight Trench',icon:'🦑',unlockLevel:30,color:'#5e54a8',sky:'#1f294c',water:'#111c46',mult:17.5,fish:['angler','squid','swordfish','coelacanth']},
  {id:'aurora',name:'Aurora Fjord',icon:'❄',unlockLevel:42,color:'#69c7c0',sky:'#4e7696',water:'#224f6d',mult:33,fish:['char','halibut','icefish','narwhal']},
  {id:'volcanic',name:'Ember Atoll',icon:'🌋',unlockLevel:56,color:'#b45e46',sky:'#74453f',water:'#3a4554',mult:62,fish:['lionfish','grouper','marlin','lavakoi']},
  {id:'astral',name:'Astral Sea',icon:'✨',unlockLevel:72,color:'#9c71ce',sky:'#372c67',water:'#271d57',mult:118,fish:['starfin','voidray','cometfish','leviathan']}
];

export const FISH = {
 bluegill:{name:'Bluegill',rarity:'Common',weight:[.2,.9],value:1,power:1,color:'#65a9d6'}, perch:{name:'Yellow Perch',rarity:'Common',weight:[.3,1.6],value:1.2,power:1.15,color:'#d1b650'}, carp:{name:'Mirror Carp',rarity:'Uncommon',weight:[1.5,6],value:2.1,power:1.7,color:'#9e8f6c'}, trout:{name:'Rainbow Trout',rarity:'Rare',weight:[.8,4.5],value:3.4,power:2.3,color:'#d17e86'},
 roach:{name:'Roach',rarity:'Common',weight:[.3,1.5],value:1.1,power:1.1,color:'#9ab4bf'}, chub:{name:'River Chub',rarity:'Uncommon',weight:[.8,3.8],value:1.9,power:1.55,color:'#7c9b83'}, pike:{name:'Northern Pike',rarity:'Rare',weight:[2,12],value:3.6,power:2.5,color:'#5f8b66'}, salmon:{name:'Atlantic Salmon',rarity:'Epic',weight:[3,16],value:6,power:3.3,color:'#c77e72'},
 tench:{name:'Golden Tench',rarity:'Common',weight:[.8,4.5],value:1.4,power:1.2,color:'#a49b55'}, walleye:{name:'Walleye',rarity:'Uncommon',weight:[1,7],value:2.3,power:1.9,color:'#92a16e'}, catfish:{name:'Blue Catfish',rarity:'Rare',weight:[4,28],value:4.8,power:3,color:'#71899a'}, sturgeon:{name:'Lake Sturgeon',rarity:'Legendary',weight:[10,70],value:10,power:5,color:'#768391'},
 mackerel:{name:'Mackerel',rarity:'Common',weight:[.4,2.2],value:1.5,power:1.3,color:'#62a8b5'}, snapper:{name:'Red Snapper',rarity:'Uncommon',weight:[1,8],value:2.8,power:2,color:'#c76460'}, mahi:{name:'Mahi-Mahi',rarity:'Epic',weight:[3,20],value:6.8,power:3.8,color:'#59bda6'}, tuna:{name:'Bluefin Tuna',rarity:'Legendary',weight:[12,120],value:12.5,power:6.2,color:'#426f92'},
 angler:{name:'Anglerfish',rarity:'Uncommon',weight:[.8,6],value:3,power:2.1,color:'#706d8a'}, squid:{name:'Giant Squid',rarity:'Rare',weight:[8,90],value:6,power:4,color:'#a56a86'}, swordfish:{name:'Swordfish',rarity:'Epic',weight:[15,130],value:9.8,power:6,color:'#6d8fb0'}, coelacanth:{name:'Coelacanth',rarity:'Mythic',weight:[20,160],value:20,power:8.8,color:'#586f7f'},
 char:{name:'Arctic Char',rarity:'Common',weight:[.8,5],value:1.8,power:1.4,color:'#9fc7d6'}, halibut:{name:'Halibut',rarity:'Uncommon',weight:[4,40],value:3.6,power:2.8,color:'#8e918d'}, icefish:{name:'Crystal Icefish',rarity:'Epic',weight:[2,16],value:8.2,power:4.6,color:'#b9e6ed'}, narwhal:{name:'Ancient Narwhal',rarity:'Mythic',weight:[180,700],value:26,power:11,color:'#afcbd4'},
 lionfish:{name:'Lionfish',rarity:'Common',weight:[.4,3],value:2,power:1.5,color:'#d68063'}, grouper:{name:'Ember Grouper',rarity:'Uncommon',weight:[5,55],value:4.2,power:3.2,color:'#a96650'}, marlin:{name:'Black Marlin',rarity:'Legendary',weight:[25,240],value:13,power:8.2,color:'#4d708e'}, lavakoi:{name:'Lava Koi',rarity:'Mythic',weight:[3,18],value:30,power:9.5,color:'#ed704b'},
 starfin:{name:'Starfin',rarity:'Rare',weight:[2,14],value:7,power:3.6,color:'#a692e0'}, voidray:{name:'Void Ray',rarity:'Epic',weight:[18,110],value:12,power:6.7,color:'#715ba9'}, cometfish:{name:'Cometfish',rarity:'Legendary',weight:[30,200],value:19,power:9.5,color:'#d2a665'}, leviathan:{name:'Astral Leviathan',rarity:'Mythic',weight:[500,2200],value:48,power:16,color:'#72529d'}
};

export const RARITY={Common:{weight:58,color:'#9eb1b8'},Uncommon:{weight:26,color:'#74cf87'},Rare:{weight:10,color:'#5fb1eb'},Epic:{weight:4.3,color:'#b077e6'},Legendary:{weight:1.4,color:'#e6b85a'},Mythic:{weight:.35,color:'#ef6c83'}};

export const UPGRADES=[
 {id:'hook',name:'Forged Hook',icon:'🪝',unlock:1,baseCost:20,scale:1.19,stat:'hookPower',base:10,growth:5,unit:'',description:'Reel Pulse power. Removes fish stamina instantly.'},
 {id:'reel',name:'Precision Reel',icon:'⚙',unlock:1,baseCost:32,scale:1.20,stat:'autoReel',base:2.5,growth:.9,unit:'/s',description:'Automatic reel power applied every second.'},
 {id:'bait',name:'Sweet Bait',icon:'🪱',unlock:2,baseCost:55,scale:1.21,stat:'biteSpeed',base:5.2,growth:-.14,min:1.0,unit:'s',description:'Average wait until a fish bites.'},
 {id:'line',name:'Braided Line',icon:'〰',unlock:3,baseCost:95,scale:1.22,stat:'lineStrength',base:100,growth:22,unit:'',description:'Maximum line tension before losing control.'},
 {id:'net',name:'Dock Net',icon:'🥅',unlock:4,baseCost:180,scale:1.22,stat:'saleValue',base:1,growth:.08,unit:'×',description:'Multiplier to the coin value of every landed fish.'},
 {id:'sonar',name:'Pocket Sonar',icon:'📡',unlock:5,baseCost:360,scale:1.23,stat:'rareChance',base:0,growth:.012,unit:'%',displayScale:100,description:'Shifts catch odds toward rarer species.'},
 {id:'crew',name:'Deckhand Crew',icon:'🧑‍✈️',unlock:7,baseCost:780,scale:1.24,stat:'crewPower',base:0,growth:1.6,unit:'/s',description:'Extra passive reel power from deckhands.'},
 {id:'cooler',name:'Insulated Cooler',icon:'🧊',unlock:9,baseCost:1650,scale:1.24,stat:'offline',base:.55,growth:.025,max:.95,unit:'%',displayScale:100,description:'Percentage of normal fishing speed retained offline.'},
 {id:'radar',name:'Deepwater Radar',icon:'🛰',unlock:12,baseCost:3900,scale:1.25,stat:'weightBonus',base:1,growth:.045,unit:'×',description:'Fish weight multiplier; heavier fish also sell for more.'},
 {id:'autocast',name:'Auto-Caster',icon:'🎣',unlock:15,baseCost:8800,scale:1.25,stat:'castDelay',base:1.0,growth:-.045,min:.18,unit:'s',description:'Downtime between landing one fish and casting again.'},
 {id:'market',name:'Harbor Broker',icon:'💰',unlock:19,baseCost:21000,scale:1.26,stat:'marketBonus',base:1,growth:.10,unit:'×',description:'Direct multiplier to all fish sale prices.'},
 {id:'luck',name:'Lucky Lure',icon:'🍀',unlock:24,baseCost:52000,scale:1.27,stat:'doubleCatch',base:0,growth:.012,unit:'%',displayScale:100,description:'Chance to duplicate the full reward of a catch.'},
 {id:'engine',name:'Trolling Motor',icon:'🚤',unlock:30,baseCost:130000,scale:1.27,stat:'bossDamage',base:1,growth:.12,unit:'×',description:'Reel power multiplier against trophy and mythic fish.'},
 {id:'hatchery',name:'Harbor Hatchery',icon:'🐟',unlock:38,baseCost:360000,scale:1.28,stat:'xpBonus',base:1,growth:.10,unit:'×',description:'XP multiplier from every landed fish.'}
];

export const RESEARCH=[
 {id:'r_combo',name:'Rhythmic Reeling',icon:'〽',cost:1,max:8,effect:'combo',value:.04,desc:'+4% Reel Pulse combo scaling per rank.'},
 {id:'r_crit',name:'Perfect Hookset',icon:'✦',cost:2,max:8,effect:'crit',value:.012,desc:'+1.2% Reel Pulse critical chance per rank.'},
 {id:'r_school',name:'School Finder',icon:'◉',cost:2,max:8,effect:'school',value:.025,desc:'+2.5% chance to hook a 2–4 fish school.'},
 {id:'r_gold',name:'Auction Contacts',icon:'●',cost:3,max:8,effect:'gold',value:.08,desc:'+8% fish sale value per rank.'},
 {id:'r_trophy',name:'Trophy Hunter',icon:'🏆',cost:3,max:8,effect:'trophy',value:.018,desc:'+1.8% trophy-fish chance per rank.'},
 {id:'r_idle',name:'Night Lines',icon:'🌙',cost:4,max:8,effect:'offline',value:.05,desc:'+5% offline efficiency per rank.'},
 {id:'r_current',name:'Read the Current',icon:'🌊',cost:4,max:8,effect:'passive',value:.08,desc:'+8% automatic reel power per rank.'},
 {id:'r_boss',name:'Monster Rig',icon:'🦈',cost:5,max:8,effect:'boss',value:.10,desc:'+10% power against trophies and mythics.'},
 {id:'r_end',name:'Endless Expertise',icon:'∞',cost:8,max:999,effect:'all',value:.035,desc:'Repeatable: +3.5% coins, XP and reel power.'}
];

export const PRESTIGE=[
 {id:'p_power',name:'Ancient Reelcraft',icon:'⚙',baseCost:1,scale:1.85,effect:'power',value:.20,desc:'+20% all reel power.'},
 {id:'p_gold',name:'Golden Tide',icon:'●',baseCost:1,scale:1.90,effect:'gold',value:.22,desc:'+22% all fish value.'},
 {id:'p_xp',name:'Old Salt Wisdom',icon:'✦',baseCost:2,scale:1.95,effect:'xp',value:.20,desc:'+20% XP gain.'},
 {id:'p_luck',name:'Mythic Waters',icon:'◆',baseCost:3,scale:2.05,effect:'rare',value:.15,desc:'+15% rarity shift and trophy chance.'},
 {id:'p_start',name:'Familiar Waters',icon:'⚓',baseCost:4,scale:2.15,effect:'start',value:1,desc:'Begin future voyages several levels ahead.'}
];
