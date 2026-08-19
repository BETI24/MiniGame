export const RARITY_COLORS={
  1:"#b8c5cc",2:"#71d28a",3:"#5bb8ef",4:"#bb79ec",5:"#f3bd55",6:"#ef6c86"
};

export const REGIONS=[
  {id:"hawaii",name:"Hawaii",unlock:1,accent:"#40c7cf",sky:"#79cde2",water:"#178fa2",deep:"#075272",secret:false},
  {id:"minnetonka",name:"Lake Minnetonka",unlock:16,accent:"#6dbb7b",sky:"#9ac5c3",water:"#397b77",deep:"#244f59",secret:true},
  {id:"mariana",name:"Mariana Trench",unlock:31,accent:"#6276e6",sky:"#3a5780",water:"#183a74",deep:"#091c4c",secret:true},
  {id:"amazon",name:"Amazon River",unlock:50,accent:"#71b84d",sky:"#9bcf9f",water:"#416f54",deep:"#234735",secret:true},
  {id:"med",name:"Mediterranean Sea",unlock:72,accent:"#5ba9dd",sky:"#8bc8df",water:"#247da8",deep:"#15516d",secret:true}
];

export const SPOTS=[
  {id:"waikiki",region:"hawaii",name:"Waikiki Beach",unlock:1,energy:1,difficulty:1.0,boss:"redfish",fish:["bluepointer","clownfish","trigger","redfish"],scene:"beach"},
  {id:"hanauma",region:"hawaii",name:"Hanauma Bay",unlock:6,energy:1,difficulty:1.35,boss:"parrot",fish:["butterfly","trevally","puffer","parrot"],scene:"reef"},
  {id:"lahaina",region:"hawaii",name:"Lahaina Beach",unlock:11,energy:1,difficulty:1.75,boss:"napoleon",fish:["goatfish","mahi","barracuda","napoleon"],scene:"sunset"},

  {id:"lowerlake",region:"minnetonka",name:"Lower Lake",unlock:16,energy:1,difficulty:2.2,boss:"bass",fish:["sunfish","crappie","catfish","bass"],scene:"lake"},
  {id:"bigisland",region:"minnetonka",name:"Big Island",unlock:21,energy:1,difficulty:2.65,boss:"paddle",fish:["perch","mullet","pike","paddle"],scene:"lake"},
  {id:"minnbeach",region:"minnetonka",name:"Minnetonka Beach",unlock:26,energy:1,difficulty:3.1,boss:"rainbow",fish:["walleye","carp","salmon","rainbow"],scene:"lake"},
  {id:"minnsecret",region:"minnetonka",name:"Secret Fishing Spot",unlock:28,energy:2,difficulty:4.0,boss:"violentinconnu",fish:["violentsnake","violentpaddle","violentrainbow","violentinconnu"],scene:"secret",secret:true},

  {id:"challenger",region:"mariana",name:"Challenger Deep",unlock:31,energy:1,difficulty:4.0,boss:"seabass",fish:["lumpsucker","rockfish","trevally2","seabass"],scene:"trench"},
  {id:"philippine",region:"mariana",name:"Philippine Sea",unlock:37,energy:1,difficulty:4.7,boss:"tarpon",fish:["damselfish","parrot2","mahi2","tarpon"],scene:"ocean"},
  {id:"pacific",region:"mariana",name:"Pacific Ocean",unlock:43,energy:1,difficulty:5.5,boss:"whiteshark",fish:["yellowfin","sailfish","swordfish","whiteshark"],scene:"ocean"},
  {id:"marianasecret",region:"mariana",name:"Secret Fishing Spot",unlock:46,energy:2,difficulty:7.0,boss:"tigershark",fish:["violentmahi","violentsail","violentsword","tigershark"],scene:"secret",secret:true},

  {id:"amazondelta",region:"amazon",name:"Amazon Delta",unlock:50,energy:1,difficulty:6.0,boss:"dorado",fish:["pacu","piranha","peacock","dorado"],scene:"jungle"},
  {id:"amazonriver",region:"amazon",name:"Amazon River",unlock:57,energy:1,difficulty:7.0,boss:"pirarucu",fish:["knifefish","arowana","tigerfish","pirarucu"],scene:"jungle"},
  {id:"rionegro",region:"amazon",name:"Rio Negro",unlock:64,energy:1,difficulty:8.0,boss:"redtail",fish:["discus","wolfish","electriccat","redtail"],scene:"jungle"},
  {id:"amazonsecret",region:"amazon",name:"Secret Fishing Spot",unlock:67,energy:3,difficulty:10.2,boss:"goliath",fish:["violentpeacock","violentpira","violentarapaima","goliath"],scene:"secret",secret:true},

  {id:"naples",region:"med",name:"Naples",unlock:72,energy:1,difficulty:9.0,boss:"blackfin",fish:["seabream","grouper","amberjack","blackfin"],scene:"med"},
  {id:"menorca",region:"med",name:"Menorca Mahon",unlock:80,energy:1,difficulty:10.4,boss:"sleeper",fish:["moray","dentex","bluefish","sleeper"],scene:"med"},
  {id:"bejaia",region:"med",name:"Bejaia Algeria",unlock:88,energy:1,difficulty:12.0,boss:"foxshark",fish:["bonito","mola","swordmed","foxshark"],scene:"med"},
  {id:"medsecret",region:"med",name:"Secret Fishing Spot",unlock:92,energy:3,difficulty:15.0,boss:"violentsunfish",fish:["violenttuna","violentmola","violentswordmed","violentsunfish"],scene:"secret",secret:true}
];

const F=(name,stars,w0,w1,hp,pull,value,xp,color,shape="fish",extra={})=>({name,stars,weight:[w0,w1],hp,pull,value,xp,color,shape,...extra});
export const FISH={
  bluepointer:F("Blue Pointer",1,.12,.42,34,.75,95,12,"#64b9d8"),
  clownfish:F("Clownfish",1,.08,.28,28,.65,80,10,"#e98a48","round"),
  trigger:F("Picasso Triggerfish",3,.45,1.4,68,1.05,220,26,"#d4be6a","round"),
  redfish:F("Redfish",5,1.8,5.8,160,1.55,820,100,"#d4554f","long",{boss:true}),

  butterfly:F("Raccoon Butterflyfish",1,.1,.35,42,.72,120,14,"#ddc35c","round"),
  trevally:F("Bluefin Trevally",2,.8,3.3,78,1.15,260,30,"#6396ac"),
  puffer:F("Blackspotted Puffer",4,.6,2.0,115,1.25,470,54,"#b8a878","round"),
  parrot:F("Green Parrotfish",5,2.3,8.2,215,1.7,1050,125,"#55af8b","round",{boss:true}),

  goatfish:F("Yellowfin Goatfish",2,.4,1.8,62,.9,190,22,"#d7ac52"),
  mahi:F("Mahi-Mahi",3,2,9,118,1.35,510,60,"#54bf9e","long"),
  barracuda:F("Great Barracuda",4,3,13,155,1.65,780,84,"#7a9a98","long"),
  napoleon:F("Napoleon Wrasse",5,6,25,270,2.0,1550,165,"#4f9fa6","round",{boss:true}),

  sunfish:F("Pumpkinseed",1,.12,.42,70,1.0,240,28,"#d6ab55","round"),
  crappie:F("Black Crappie",2,.3,1.4,92,1.1,330,38,"#8a9697","round"),
  catfish:F("Blue Catfish",4,2,12,170,1.55,720,80,"#6a8290","catfish"),
  bass:F("Freshwater Bass",5,2.5,8.5,260,1.9,1280,145,"#668563","long",{boss:true}),

  perch:F("Yellow Perch",1,.2,.8,78,1.0,260,30,"#bfa44c"),
  mullet:F("California Mullet",2,.6,2.8,102,1.25,380,44,"#94a9ae"),
  pike:F("Northern Pike",4,3,14,195,1.75,880,96,"#608762","long"),
  paddle:F("Paddlefish",5,8,35,315,2.15,1680,178,"#77888f","long",{boss:true}),

  walleye:F("Walleye",2,.8,4.5,120,1.25,430,48,"#8f9c6c"),
  carp:F("Mirror Carp",3,2,13,165,1.45,650,70,"#987c58","round"),
  salmon:F("Atlantic Salmon",4,3,16,210,1.75,980,105,"#c5796a","long"),
  rainbow:F("Rainbow Trout",5,2,11,340,2.25,1850,190,"#c77f8d","long",{boss:true}),

  violentsnake:F("Violent Snakehead",3,3,16,360,2.2,1450,160,"#5e7d62","long",{violent:true}),
  violentpaddle:F("Violent Paddlefish",4,10,42,470,2.55,2100,220,"#657783","long",{violent:true}),
  violentrainbow:F("Violent Rainbow Trout",5,4,18,580,2.85,3000,300,"#c2728c","long",{violent:true}),
  violentinconnu:F("Violent Inconnu",5,12,55,760,3.2,4600,450,"#9aa7b5","long",{boss:true,violent:true}),

  lumpsucker:F("Pacific Spiny Lumpsucker",1,.08,.36,120,1.2,410,44,"#8d859a","round"),
  rockfish:F("Flag Rockfish",2,.5,2.3,150,1.35,560,58,"#bd6a5b","round"),
  trevally2:F("Black Giant Trevally",4,4,21,260,1.95,1200,120,"#596b76"),
  seabass:F("Giant Sea Bass",5,20,95,480,2.65,3000,285,"#6b7478","round",{boss:true}),

  damselfish:F("Neon Spiny Damselfish",1,.08,.4,135,1.25,460,48,"#456fc4","round"),
  parrot2:F("Rainbow Parrotfish",2,.5,2.6,172,1.4,650,66,"#58a68c","round"),
  mahi2:F("Ocean Mahi-Mahi",4,4,18,295,2.05,1400,135,"#50b89e","long"),
  tarpon:F("Silver Tarpon",5,18,90,560,2.75,3550,320,"#9baab0","long",{boss:true}),

  yellowfin:F("Yellowfin Tuna",2,4,18,210,1.7,900,90,"#536f85","long"),
  sailfish:F("Atlantic Sailfish",4,18,85,390,2.3,1900,180,"#4f7398","bill"),
  swordfish:F("Swordfish",5,22,120,520,2.65,2800,260,"#567d9d","bill"),
  whiteshark:F("Great White Shark",5,80,420,820,3.45,7200,620,"#83919a","shark",{boss:true}),

  violentmahi:F("Violent Mahi-Mahi",3,8,35,600,3.0,3400,320,"#44ae8f","long",{violent:true}),
  violentsail:F("Violent Sailfish",4,30,140,760,3.4,4800,430,"#4c7196","bill",{violent:true}),
  violentsword:F("Violent Swordfish",5,40,180,900,3.75,6200,540,"#55789b","bill",{violent:true}),
  tigershark:F("Violent Tiger Shark",5,120,520,1200,4.2,10500,900,"#6f8188","shark",{boss:true,violent:true}),

  pacu:F("Red Pacu",1,.8,4.5,200,1.4,760,72,"#a87161","round"),
  piranha:F("Red Piranha",2,.4,2.2,245,1.65,920,85,"#aa5c52"),
  peacock:F("Peacock Bass",4,3,14,370,2.3,1850,165,"#768b52","long"),
  dorado:F("Golden Dorado",5,7,30,650,3.0,4100,360,"#d2a548","long",{boss:true}),

  knifefish:F("Clown Knifefish",2,2,10,270,1.8,1050,98,"#8a8d86","long"),
  arowana:F("Silver Arowana",3,2,11,340,2.05,1400,125,"#a7b7b6","long"),
  tigerfish:F("Goliath Tigerfish",4,6,28,510,2.65,2600,220,"#73807c","long"),
  pirarucu:F("Pirarucu",5,35,170,880,3.45,7200,590,"#7d726b","long",{boss:true}),

  discus:F("Blue Discus",1,.15,.75,245,1.5,900,84,"#669bd3","round"),
  wolfish:F("Wolf Fish",3,2,12,390,2.25,1700,145,"#66786c","long"),
  electriccat:F("Electric Catfish",4,4,24,560,2.8,2800,230,"#767d61","catfish"),
  redtail:F("Redtail Catfish",5,24,120,980,3.7,8500,680,"#615f59","catfish",{boss:true}),

  violentpeacock:F("Violent Peacock Bass",3,7,30,820,3.4,4800,390,"#70874e","long",{violent:true}),
  violentpira:F("Violent Black Piranha",4,3,16,940,3.8,5900,470,"#645a56","long",{violent:true}),
  violentarapaima:F("Violent Arapaima",5,65,260,1250,4.4,9400,720,"#6f6760","long",{violent:true}),
  goliath:F("Violent Goliath Tigerfish",5,45,190,1600,4.9,14500,1100,"#67736d","long",{boss:true,violent:true}),

  seabream:F("Gilthead Seabream",1,.3,1.8,320,1.7,1250,105,"#c3b97c","round"),
  grouper:F("Dusky Grouper",3,4,24,520,2.45,2400,190,"#846859","round"),
  amberjack:F("Greater Amberjack",4,8,42,680,2.95,3700,285,"#75898e","long"),
  blackfin:F("Blackfin Tuna",5,18,90,1120,3.9,9200,720,"#4c6478","long",{boss:true}),

  moray:F("Mediterranean Moray",2,1,8,420,2.05,1650,135,"#786d49","eel"),
  dentex:F("Common Dentex",3,2,12,560,2.55,2450,190,"#a79585"),
  bluefish:F("Bluefish",4,5,25,760,3.1,3900,300,"#657f93","long"),
  sleeper:F("Sleeper Shark",5,55,280,1320,4.2,11000,830,"#727b7b","shark",{boss:true}),

  bonito:F("Atlantic Bonito",2,3,15,510,2.3,2100,160,"#627b8f","long"),
  mola:F("Ocean Sunfish",4,20,180,860,3.25,4800,355,"#81898d","round"),
  swordmed:F("Mediterranean Swordfish",5,25,130,1050,3.75,6800,520,"#537c9e","bill"),
  foxshark:F("Thresher Shark",5,70,320,1550,4.5,13500,980,"#697b83","shark",{boss:true}),

  violenttuna:F("Violent Blackfin Tuna",3,20,95,1250,4.2,8200,610,"#495f71","long",{violent:true}),
  violentmola:F("Violent Ocean Sunfish",4,45,250,1500,4.7,11000,820,"#747e82","round",{violent:true}),
  violentswordmed:F("Violent Swordfish Prime",5,55,240,1800,5.1,14500,1050,"#4e7291","bill",{violent:true}),
  violentsunfish:F("Violent Sunfish Sovereign",5,130,600,2300,5.7,24000,1650,"#6f777c","round",{boss:true,violent:true})
};

export const ROD_FAMILIES=[
  {id:"drift",names:["Driftwood Rod","Cedar Rod","Harbor Composite","Mariner Carbon","Blue Tempest","Celestial Rod"],base:105,affinity:"gold",accent:"#c58a52"},
  {id:"reef",names:["Coral Twig","Reef Rod","Lagoon Composite","Coral Lance","Reef Sovereign","Prismatic Coral"],base:112,affinity:"rareFish",accent:"#ef7d79"},
  {id:"storm",names:["Storm Cane","Stormglass Rod","Typhoon Rod","Cyclone Carbon","Tempest King","Storm Emperor"],base:118,affinity:"bossDamage",accent:"#6e8fe3"},
  {id:"river",names:["River Cane","River Hunter","Current Rod","Rapidstream","Apex Current","Leviathan Current"],base:114,affinity:"bigFish",accent:"#70a879"},
  {id:"abyss",names:["Deep Cane","Abyss Rod","Trench Composite","Blackwater Rod","Abyssal Fang","Voidline Rod"],base:120,affinity:"critRate",accent:"#7667c2"},
  {id:"royal",names:["Bronze Royal","Silver Royal","Gold Royal","Platinum Royal","Imperial Rod","Crown of Tides"],base:126,affinity:"damage",accent:"#d7b04f"}
];

export const REEL_FAMILIES=[
  {id:"wood",names:["Wooden Reel","Bait Reel","Spin Reel","Surf Reel","Classic Reel","Brilliant Reel"],base:92,affinity:"tension",accent:"#a7794c"},
  {id:"swift",names:["Quick Reel","Silver Spin","Rapid Reel","Velocity Reel","Jetstream Reel","Photon Reel"],base:98,affinity:"critRate",accent:"#67b6d7"},
  {id:"power",names:["Iron Reel","Power Drum","Heavy Spin","Torque Reel","Titan Reel","Colossus Reel"],base:103,affinity:"damage",accent:"#8c959e"},
  {id:"treasure",names:["Lucky Reel","Treasure Spin","Fortune Reel","Gilded Reel","Midas Reel","Golden Horizon"],base:96,affinity:"gold",accent:"#ddb64d"},
  {id:"hunter",names:["Hunter Reel","Predator Spin","Boss Reel","Apex Reel","Monster Reel","Kraken Drive"],base:105,affinity:"bossDamage",accent:"#c86d5f"}
];

export const PROPERTY_POOL=[
  {id:"damage",name:"Damage",unit:"%",min:3,max:11},
  {id:"bossDamage",name:"Boss Damage",unit:"%",min:5,max:18},
  {id:"bigFish",name:"Big Fish Chance",unit:"%",min:2,max:8},
  {id:"rareFish",name:"Rare Fish Chance",unit:"%",min:2,max:8},
  {id:"critRate",name:"Critical Rate",unit:"%",min:1,max:5},
  {id:"critDamage",name:"Critical Damage",unit:"%",min:8,max:28},
  {id:"gold",name:"Gold Bonus",unit:"%",min:4,max:15},
  {id:"xp",name:"XP Bonus",unit:"%",min:4,max:15},
  {id:"tension",name:"Line Tension",unit:"%",min:3,max:10}
];

export const LINES=[
  {id:"basic",name:"Basic Mono Line",stars:1,length:280,tension:100,damage:1.00,costGold:120},
  {id:"silver",name:"Silver Line 1.5",stars:2,length:480,tension:115,damage:1.04,costGold:480},
  {id:"kevlar",name:"Kevlar Line 1",stars:3,length:850,tension:132,damage:1.08,costGold:1400},
  {id:"kevlar15",name:"Kevlar Line 1.5",stars:4,length:1250,tension:150,damage:1.13,costGold:3600},
  {id:"special2",name:"Special Edition Line II",stars:5,length:2400,tension:176,damage:1.21,costGold:0,lootOnly:true},
  {id:"special3",name:"Special Edition Line III",stars:6,length:2000,tension:205,damage:1.30,costGold:0,lootOnly:true}
];

export const BOOSTERS=[
  {id:"damage",name:"Damage Booster",icon:"⚡",desc:"+30% damage for the next cast.",mult:1.30},
  {id:"gold",name:"Gold Booster",icon:"●",desc:"+50% Gold from the next catch.",mult:1.50},
  {id:"xp",name:"XP Booster",icon:"✦",desc:"+50% XP from the next catch.",mult:1.50},
  {id:"big",name:"Big Fish Booster",icon:"⬆",desc:"+20 percentage points to the Big Fish roll.",mult:.20}
];

export const PEARLS=[
  {id:"ruby",name:"Ruby Pearl",color:"#ec6872",property:"damage",value:7},
  {id:"sapphire",name:"Sapphire Pearl",color:"#65aef0",property:"tension",value:7},
  {id:"emerald",name:"Emerald Pearl",color:"#63cf8a",property:"bigFish",value:5},
  {id:"amethyst",name:"Amethyst Pearl",color:"#b17ce5",property:"critRate",value:3},
  {id:"golden",name:"Golden Pearl",color:"#f0c55b",property:"gold",value:9}
];

export const ACCESSORIES=[
  {id:"shell",name:"Polished Shell Charm",stars:2,critRate:1.0,critDamage:8,accuracy:2,hp:40},
  {id:"coral",name:"Coral Fang Charm",stars:3,critRate:1.8,critDamage:14,accuracy:3,hp:70},
  {id:"shark",name:"Shark Tooth Charm",stars:4,critRate:2.8,critDamage:21,accuracy:5,hp:110},
  {id:"crown",name:"Tidal Crown Charm",stars:5,critRate:4.2,critDamage:32,accuracy:7,hp:170}
];

export const CHESTS=[
  {id:"wood",name:"Wooden Tackle Chest",icon:"🧰",open:{gold:7500},odds:{gear:[1,2,3],weights:[66,28,6]},desc:"Affordable chest. Mostly consumables and early tackle."},
  {id:"silver",name:"Silver Key Chest",icon:"▣",open:{silverKey:1},odds:{gear:[2,3,4],weights:[48,40,12]},desc:"Reliable 2–4★ equipment and better lines/lures."},
  {id:"gold",name:"Gold Key Chest",icon:"◆",open:{goldKey:1},odds:{gear:[3,4,5],weights:[35,48,17]},desc:"High-grade tackle, pearls, accessories and rare consumables."},
  {id:"coral",name:"Coral Chest",icon:"⬡",open:{cash:90},odds:{gear:[4,5,6],weights:[28,52,20]},desc:"Premium chest with the best chance at 5–6★ equipment and Special Edition lines."}
];

export const MISSION_DEFS=[
  {id:"catch5",name:"Warm-up Angler",type:"catch",target:5,reward:{gold:2500}},
  {id:"catch20",name:"Twenty on the Board",type:"catch",target:20,reward:{cash:12}},
  {id:"upgrade3",name:"Tune the Tackle",type:"upgrade",target:3,reward:{powerStone:20,gold:3500}},
  {id:"boss1",name:"Boss Hunter",type:"boss",target:1,reward:{silverKey:1,cash:8}},
  {id:"perfect3",name:"Perfect Casting",type:"perfect",target:3,reward:{goldKey:1}},
  {id:"book12",name:"Field Researcher",type:"species",target:12,reward:{cash:25,pearlPowder:80}}
];
