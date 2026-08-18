export const WEAPONS = {
  pulse:{id:"pulse",name:"Pulse Shell",icon:"●",category:"Direct",damage:45,radius:34,color:"#76e8ff",description:"Clean, predictable shell. Great for learning wind and power."},
  core:{id:"core",name:"Core Breaker",icon:"⬢",category:"Heavy",damage:78,radius:52,color:"#ff8d72",gravity:1.08,description:"Heavy projectile with a large crater and strong splash damage."},
  tristar:{id:"tristar",name:"Tri-Star",icon:"✦",category:"Spread",damage:24,radius:25,count:3,spread:.085,color:"#f9d866",description:"Three shells fan out from the barrel."},
  shardbloom:{id:"shardbloom",name:"Shard Bloom",icon:"✺",category:"Airburst",damage:19,radius:22,fragments:7,splitTime:.82,color:"#9ef19d",description:"Splits near the apex into seven falling shards."},
  ricochet:{id:"ricochet",name:"Ricochet Orb",icon:"◇",category:"Bounce",damage:58,radius:38,bounces:2,color:"#d69cff",description:"Bounces twice before detonating. Excellent behind cover."},
  roller:{id:"roller",name:"Hill Roller",icon:"◉",category:"Ground",damage:68,radius:43,rollTime:3.4,color:"#ffbf69",description:"Lands softly, then rolls downhill before exploding."},
  burrow:{id:"burrow",name:"Burrow Charge",icon:"▼",category:"Tunneling",damage:82,radius:48,tunnelTime:1.1,color:"#b7805a",description:"Drills through the ground and detonates underneath the impact point."},
  skymarker:{id:"skymarker",name:"Sky Marker",icon:"⌄",category:"Strike",damage:30,radius:28,bombs:5,spreadX:95,color:"#ff6f91",description:"A marker round calls five bombs down around the impact point."},
  meteorchoir:{id:"meteorchoir",name:"Meteor Choir",icon:"☄",category:"Strike",damage:34,radius:30,bombs:8,spreadX:165,color:"#ff9c5e",description:"Marks a wide area for a delayed meteor shower."},
  prismsplit:{id:"prismsplit",name:"Prism Split",icon:"Y",category:"Airburst",damage:21,radius:22,fragments:5,splitTime:.62,color:"#6df0d0",description:"Splits early into five sharply separated trajectories."},
  raillance:{id:"raillance",name:"Rail Lance",icon:"━",category:"Straight",damage:62,radius:0,color:"#ecf8ff",description:"Instant line shot. Ignores gravity but stops at the first tank or terrain."},
  groundwave:{id:"groundwave",name:"Seismic Runner",icon:"≈",category:"Ground",damage:52,radius:31,travel:390,color:"#73df9c",description:"Impact releases a destructive wave that races along the ground."},
  hunter:{id:"hunter",name:"Hunter Darts",icon:"➤",category:"Smart",damage:20,radius:18,count:4,homing:.85,color:"#95ff7a",description:"Four light darts gradually steer toward the nearest enemy."},
  gravityseed:{id:"gravityseed",name:"Gravity Seed",icon:"◎",category:"Field",damage:72,radius:55,fieldTime:2.6,fieldRadius:125,color:"#9e77ff",description:"Creates a gravity field that drags nearby tanks toward the center before collapsing."},
  rampart:{id:"rampart",name:"Rampart Seed",icon:"▲",category:"Terraform",damage:0,radius:72,raise:78,color:"#61c991",description:"Raises a tall mound of terrain at the impact point."},
  sinker:{id:"sinker",name:"Crater Maker",icon:"▽",category:"Terraform",damage:15,radius:82,crater:72,color:"#c48c67",description:"Excavates an unusually deep crater with little direct damage."},
  starburst:{id:"starburst",name:"Starburst",icon:"✷",category:"Airburst",damage:16,radius:20,fragments:11,splitTime:1.05,color:"#ffe480",description:"A delayed firework blooms into eleven projectiles."},
  emberrain:{id:"emberrain",name:"Ember Rain",icon:"♨",category:"Fire",damage:18,radius:24,burn:8,burnTime:5,fragments:6,color:"#ff684f",description:"Burning fragments leave temporary fire zones on the terrain."},
  arcchain:{id:"arcchain",name:"Arc Chain",icon:"ϟ",category:"Electric",damage:40,radius:18,chain:4,chainRange:180,color:"#b8ff70",description:"Direct hit chains electricity through nearby tanks."},
  moonfall:{id:"moonfall",name:"Moonfall",icon:"◒",category:"Orbital",damage:39,radius:36,bombs:4,color:"#9eb9ff",description:"Impact opens an orbital ring; four satellites curve down on the marked area."},
  kernelpop:{id:"kernelpop",name:"Kernel Pop",icon:"⁙",category:"Chaos",damage:13,radius:17,fragments:14,bounces:1,splitTime:.7,color:"#fff0a3",description:"Bursts into many tiny bouncing kernels."},
  deaddrop:{id:"deaddrop",name:"Dead Drop",icon:"▣",category:"Strike",damage:105,radius:48,color:"#88939e",description:"The marker deals no impact damage; a massive weight drops vertically moments later."},
  faultline:{id:"faultline",name:"Fault Line",icon:"⌁",category:"Terraform",damage:34,radius:0,lineRadius:320,color:"#cf8c58",description:"Sends repeated underground eruptions across a wide horizontal area."},
  corkscrew:{id:"corkscrew",name:"Corkscrew",icon:"∿",category:"Trick",damage:62,radius:35,color:"#55dfff",description:"Wobbles around its ballistic path, making the final impact less obvious."},
  droneswarm:{id:"droneswarm",name:"Drone Swarm",icon:"⋙",category:"Smart",damage:17,radius:16,count:6,homing:1.4,color:"#68f2c3",description:"Six micro-drones aggressively home after a short launch phase."},
  sawblade:{id:"sawblade",name:"Saw Runner",icon:"✹",category:"Ground",damage:16,radius:13,rollTime:5.0,multiHit:true,color:"#d9e0e6",description:"A spinning blade follows the surface and can cut the same tank repeatedly."},
  echobomb:{id:"echobomb",name:"Echo Bomb",icon:"◌",category:"Delayed",damage:46,radius:38,echoDamage:35,echoRadius:56,color:"#db8cff",description:"Explodes once on impact, then detonates a larger echo at the same spot."},
  mirror:{id:"mirror",name:"Mirror Shot",icon:"◆",category:"Bounce",damage:66,radius:39,wallBounces:3,color:"#8de9ff",description:"Reflects from arena side walls up to three times before exploding."},
  viper:{id:"viper",name:"Viper Line",icon:"S",category:"Ground",damage:54,radius:30,travel:520,seekGround:true,color:"#8ed35d",description:"Becomes a ground serpent that crawls toward the nearest tank."},
  pinpoint:{id:"pinpoint",name:"Pinpoint",icon:"·",category:"Precision",damage:112,radius:8,color:"#ffffff",description:"Tiny hitbox, enormous direct-hit damage and almost no splash."},
  megaflux:{id:"megaflux",name:"Mega Flux",icon:"✸",category:"Heavy",damage:145,radius:92,color:"#ff5c88",description:"Rare superweapon with a huge blast and massive terrain deformation."},
  scatterrise:{id:"scatterrise",name:"Scatter Rise",icon:"↟",category:"Impact Effect",damage:16,radius:18,fragments:9,color:"#ffd56d",description:"Impact launches nine fragments upward before they rain back down."},
  timeskip:{id:"timeskip",name:"Time Skip",icon:"⌛",category:"Delayed",damage:88,radius:46,delay:2.2,color:"#7aa6ff",description:"Projectile vanishes on impact and reappears as an explosion after a suspenseful delay."},

  orbvolley:{id:"orbvolley",name:"Orb Volley",icon:"⁙",category:"Spread",damage:21,radius:20,count:3,spread:.075,color:"#f8d56b",description:"A ShellShock-style multi-ball family: several independent shells leave the barrel together.",tierNote:"3 shells",tierUpgrades:{2:{count:5,spread:.064,tierNote:"5 shells with tighter spacing"},3:{count:9,spread:.052,tierNote:"9-shell fan"}}},
  hyperbounce:{id:"hyperbounce",name:"Hyper Bounce",icon:"◈",category:"Bounce",damage:48,radius:31,bounces:1,bouncePower:.67,color:"#d9a2ff",description:"A dedicated bounce family that becomes dramatically less predictable at higher tiers.",tierNote:"1 bounce",tierUpgrades:{2:{bounces:3,bouncePower:.72,tierNote:"3 energetic bounces"},3:{bounces:5,bouncePower:.77,tierNote:"5 high-energy bounces"}}},
  clustergrenade:{id:"clustergrenade",name:"Cluster Grenade",icon:"✥",category:"Grenade",damage:18,radius:22,bounces:1,fragments:3,clusterSpread:1.05,color:"#98db73",description:"Bounces once, then bursts into a cluster of timed mini-grenades.",tierNote:"3 mini-grenades",tierUpgrades:{2:{fragments:5,bounces:2,tierNote:"5 mini-grenades after 2 bounces"},3:{fragments:8,bounces:2,clusterSpread:1.35,tierNote:"8-wide grenade storm"}}},
  aquastream:{id:"aquastream",name:"Aqua Stream",icon:"≋",category:"Stream",damage:11,radius:14,count:7,burstGap:.055,streamSpread:.028,color:"#6ac8ff",description:"A rapid stream of light shells follows almost the same ballistic arc.",tierNote:"7 droplets",tierUpgrades:{2:{count:10,streamSpread:.024,tierNote:"10-drop creek"},3:{count:14,streamSpread:.020,tierNote:"14-drop river"}}},
  infernojet:{id:"infernojet",name:"Inferno Jet",icon:"♨",category:"Fire",damage:13,radius:17,count:5,spread:.075,burn:5,burnTime:3.2,color:"#ff7854",description:"Short-range flaming spray. Each impact can leave a small burning patch.",tierNote:"5 flames",tierUpgrades:{2:{count:7,burn:6,burnTime:4,tierNote:"7 flames + longer burn"},3:{count:10,spread:.066,burn:8,burnTime:4.8,tierNote:"10-flame inferno"}}},
  backroller:{id:"backroller",name:"Back Roller",icon:"↶",category:"Ground",damage:58,radius:36,rollTime:3.6,backRoll:true,color:"#ffbd6d",description:"After landing it deliberately rolls back against its incoming direction.",tierNote:"Standard reverse roller",tierUpgrades:{2:{rollTime:4.4,rollSpeed:72,tierNote:"Longer, faster reverse roll"},3:{rollTime:5.2,rollSpeed:86,impactTrail:true,tierNote:"Reverse groller that chips terrain"}}},
  breakerwave:{id:"breakerwave",name:"Breaker Wave",icon:"⋔",category:"Impact Split",damage:17,radius:18,fragments:2,breakerSpeed:150,color:"#f7b6e2",description:"On impact, daughter shells break away horizontally along opposite arcs.",tierNote:"2 breakers",tierUpgrades:{2:{fragments:4,breakerSpeed:165,tierNote:"4-way double breaker"},3:{fragments:6,breakerSpeed:180,recursiveBreaker:true,tierNote:"6-way super breaker"}}},
  twinkler:{id:"twinkler",name:"Twinkler",icon:"✧",category:"Firework",damage:14,radius:17,fragments:6,splitTime:.92,color:"#ffec8b",description:"A compact firework blooms into radial spark shots in mid-air.",tierNote:"6 sparks",tierUpgrades:{2:{fragments:9,splitTime:.84,tierNote:"9-spark Sparkler"},3:{fragments:13,splitTime:.76,sparkBounce:1,tierNote:"13 Crackler sparks that bounce"}}},
  sniper:{id:"sniper",name:"Vector Sniper",icon:"⌖",category:"Precision",damage:96,radius:7,color:"#edf7ff",description:"Tiny hitbox, high direct-hit damage. Higher tiers add follow-up precision shots.",tierNote:"Single precision round",tierUpgrades:{2:{count:2,subShotSpread:.014,damage:86,tierNote:"Twin sub-sniper rounds"},3:{count:3,subShotSpread:.018,damage:78,smartSnipe:.22,tierNote:"3 smart-sniper rounds with slight correction"}}},
  quakecharge:{id:"quakecharge",name:"Quake Charge",icon:"≋",category:"Seismic",damage:25,radius:24,quakePops:5,quakeSpan:210,color:"#cd9367",description:"Impact triggers a line of delayed subterranean eruptions across nearby terrain.",tierNote:"5 local eruptions",tierUpgrades:{2:{quakePops:7,quakeSpan:280,tierNote:"7 wider eruptions"},3:{quakePops:10,quakeSpan:370,tierNote:"10-map quake chain"}}},
  bulger:{id:"bulger",name:"Bulger",icon:"⏶",category:"Terraform",damage:28,radius:42,raise:52,color:"#6fd39b",description:"Damages the impact zone while forcing the earth upward under it.",tierNote:"Small bulge",tierUpgrades:{2:{raise:72,radius:50,tierNote:"Large bulge"},3:{raise:96,radius:60,doubleBulge:true,tierNote:"Twin-sided super bulge"}}},
  fountain:{id:"fountain",name:"Fountain",icon:"♒",category:"Impact Split",damage:15,radius:17,fragments:4,fountainSpeed:165,color:"#70e0ff",description:"Impact launches shells almost vertically upward so they rain back around the crater.",tierNote:"4 fountain droplets",tierUpgrades:{2:{fragments:6,fountainSpeed:180,tierNote:"6 high fountain shots"},3:{fragments:9,fountainSpeed:195,tierNote:"9-shot geyser"}}},
  flower:{id:"flower",name:"Neon Flower",icon:"❀",category:"Radial",damage:13,radius:16,fragments:6,petalSpeed:125,color:"#ff82c6",description:"Impact blossoms into petal projectiles in every direction.",tierNote:"6 petals",tierUpgrades:{2:{fragments:9,petalSpeed:138,tierNote:"9-petal bloom"},3:{fragments:13,petalSpeed:150,petalBounce:1,tierNote:"13 bouncing petals"}}},
  horizon:{id:"horizon",name:"Horizon Beam",icon:"═",category:"Terrain Beam",damage:17,radius:15,horizonRange:260,horizonPulses:9,color:"#7ce7c7",description:"Impact fires damaging pulses left and right along the terrain horizon.",tierNote:"260px ground beam",tierUpgrades:{2:{horizonRange:360,horizonPulses:13,tierNote:"360px double horizon"},3:{horizonRange:500,horizonPulses:18,tierNote:"500px full horizon sweep"}}},
  jumper:{id:"jumper",name:"Jumper",icon:"⌇",category:"Bounce",damage:20,radius:22,bounces:2,jumpBlast:true,color:"#a6ed78",description:"Every ground bounce causes a small explosion before the shell jumps onward.",tierNote:"2 explosive jumps",tierUpgrades:{2:{bounces:4,tierNote:"4 explosive jumps"},3:{bounces:6,jumpDamageScale:.68,tierNote:"6 stronger jumper blasts"}}},
  acidrain:{id:"acidrain",name:"Acid Rain",icon:"☂",category:"Strike",damage:12,radius:20,bombs:6,spreadX:100,acid:5,acidTime:4,color:"#9dff61",description:"Marks an area for corrosive drops that leave damaging acid pools.",tierNote:"6 acid drops",tierUpgrades:{2:{bombs:9,spreadX:125,acid:6,acidTime:4.8,tierNote:"9-drop acid storm"},3:{bombs:13,spreadX:155,acid:8,acidTime:5.5,tierNote:"13-drop toxic downpour"}}},
  areastrike:{id:"areastrike",name:"Area Strike",icon:"⇣",category:"Strike",damage:31,radius:27,bombs:3,spreadX:65,color:"#ff7992",description:"A tight vertical strike pattern around the marked impact point.",tierNote:"3 precision bombs",tierUpgrades:{2:{bombs:5,spreadX:78,tierNote:"5-bomb strike"},3:{bombs:7,spreadX:92,centerBomb:true,tierNote:"7-bomb strike + center heavy bomb"}}},
  hoverorb:{id:"hoverorb",name:"Hover Orb",icon:"◌",category:"Trick",damage:63,radius:38,hoverTime:1.0,hoverSpeed:.22,color:"#96d9ff",description:"The shell suspends near its apex, drifts with wind, then suddenly resumes falling.",tierNote:"1.0s hover",tierUpgrades:{2:{hoverTime:1.45,hoverSpeed:.16,tierNote:"1.45s stable hover"},3:{hoverTime:1.9,hoverSpeed:.10,dropBoost:1.45,tierNote:"1.9s hover then accelerated drop"}}},
  boomerang:{id:"boomerang",name:"Boomerang",icon:"↩",category:"Trick",damage:60,radius:34,returnTime:.78,returnForce:1.35,color:"#ffd67a",description:"After travelling outward, the shell curves back toward its owner side before impact.",tierNote:"Single return arc",tierUpgrades:{2:{returnTime:.68,returnForce:1.55,tierNote:"Sharper return curve"},3:{returnTime:.58,returnForce:1.75,doubleReturn:true,tierNote:"Double-curving elite boomerang"}}},
  beehive:{id:"beehive",name:"Bee Hive",icon:"⬡",category:"Smart",damage:12,radius:12,fragments:5,homing:1.55,color:"#ffd94f",description:"Impact releases a swarm of tiny homing bees toward nearby enemies.",tierNote:"5 bees",tierUpgrades:{2:{fragments:7,homing:1.8,tierNote:"7 faster bees"},3:{fragments:10,homing:2.05,beeLife:3.4,tierNote:"10 relentless bees"}}},
  voidwell:{id:"voidwell",name:"Void Well",icon:"◉",category:"Field",damage:58,radius:49,fieldTime:2.3,fieldRadius:118,projectilePull:1.0,color:"#8d70ff",description:"A black-hole-like field bends nearby projectiles as well as pulling tanks before collapse.",tierNote:"118px projectile-bending well",tierUpgrades:{2:{fieldRadius:150,fieldTime:2.8,projectilePull:1.25,tierNote:"Larger, stronger well"},3:{fieldRadius:185,fieldTime:3.3,projectilePull:1.55,tierNote:"Singularity-class well"}}},
  bumperbombs:{id:"bumperbombs",name:"Bumper Bombs",icon:"⟲",category:"Bounce",damage:16,radius:18,fragments:3,bounces:2,color:"#f28bff",description:"Impact ejects several very elastic bombs that ricochet around the terrain.",tierNote:"3 bombs · 2 bounces",tierUpgrades:{2:{fragments:5,bounces:3,tierNote:"5 bombs · 3 bounces"},3:{fragments:7,bounces:4,tierNote:"7 bombs · 4 bounces"}}},
  cactus:{id:"cactus",name:"Cactus",icon:"✳",category:"Radial",damage:12,radius:14,fragments:8,spikeSpeed:155,color:"#6ce08f",description:"Impact launches needle-like spikes in a full radial burst.",tierNote:"8 spikes",tierUpgrades:{2:{fragments:12,spikeSpeed:170,tierNote:"12 spikes"},3:{fragments:16,spikeSpeed:188,spikePierce:true,tierNote:"16 piercing spikes"}}},
  carpetbomb:{id:"carpetbomb",name:"Carpet Bomb",icon:"▥",category:"Flare",damage:7,radius:28,bombs:15,spreadX:250,flareBounces:2,noTerrainDamage:true,angledStrike:true,color:"#ff9c67",description:"A flare settles, then fifteen angled bombs sweep across the marked area without digging craters.",tierNote:"15 angled bombs",tierUpgrades:{2:{name:"Carpet Fire",bombs:20,damage:7,radius:30,spreadX:300,visualScale:1.08,tierNote:"20-bomb carpet"},3:{name:"Incendiary Bombs",bombs:20,damage:7,radius:30,spreadX:300,burn:2,burnTime:2.2,visualScale:1.16,tierNote:"20 bombs leaving short-lived flames"}}},
  gunship:{id:"gunship",name:"Gunship",icon:"➠",category:"Strike",damage:10,radius:14,count:8,gunshipSpan:310,color:"#a8e1ff",description:"Calls a moving gunship that strafes the marked area with repeated light shells.",tierNote:"8-shot strafe",tierUpgrades:{2:{count:12,gunshipSpan:370,tierNote:"12-shot heavy strafe"},3:{count:17,gunshipSpan:450,gunshipMissile:true,tierNote:"17 shots + final missile"}}},
  clover:{id:"clover",name:"Clover",icon:"✤",category:"Radial",damage:18,radius:18,fragments:4,cloverLayers:1,color:"#74e6a0",description:"Impact releases four leaf projectiles along diagonal arcs.",tierNote:"4 leaves",tierUpgrades:{2:{fragments:8,cloverLayers:2,tierNote:"Double clover · 8 leaves"},3:{fragments:12,cloverLayers:3,leafHoming:.18,tierNote:"Triple clover · 12 slightly smart leaves"}}},
  discoball:{id:"discoball",name:"Disco Ball",icon:"◍",category:"Bounce",damage:17,radius:19,bounces:2,laserDamage:16,laserRange:150,color:"#ff82f5",description:"Bounces around the map and emits horizontal laser pulses on every bounce.",tierNote:"2 bounces + lasers",tierUpgrades:{2:{bounces:3,laserDamage:20,laserRange:190,tierNote:"3 stronger laser bounces"},3:{bounces:4,laserDamage:24,laserRange:240,doubleLaser:true,tierNote:"4 bounces + cross lasers"}}},
  ghostbomb:{id:"ghostbomb",name:"Ghost Bomb",icon:"◐",category:"Tunneling",damage:70,radius:42,ghostDepth:64,color:"#c8b6ff",description:"Phases through the first terrain contact and detonates only after travelling underground.",tierNote:"64px phase depth",tierUpgrades:{2:{ghostDepth:96,radius:47,tierNote:"96px deeper phase"},3:{ghostDepth:135,radius:54,ghostPulse:true,tierNote:"135px phase + exit pulse"}}},
  guppies:{id:"guppies",name:"Guppies",icon:"»",category:"Smart",damage:10,radius:11,fragments:6,homing:1.05,swarmArc:.35,color:"#72d8ff",description:"Impact releases a school of small curved smart projectiles that fan out before homing back in.",tierNote:"6 guppies",tierUpgrades:{2:{fragments:9,homing:1.25,tierNote:"9 faster guppies"},3:{fragments:13,homing:1.45,swarmArc:.55,tierNote:"13 wide-school guppies"}}},
  palmburst:{id:"palmburst",name:"Palm Burst",icon:"♜",category:"Airburst",damage:15,radius:18,fragments:5,splitTime:.75,palmCurve:.55,color:"#78dfa2",description:"At the apex, frond-like projectiles peel away in sweeping curved arcs.",tierNote:"5 fronds",tierUpgrades:{2:{fragments:7,palmCurve:.68,tierNote:"7 wider fronds"},3:{fragments:10,palmCurve:.82,frondSplit:true,tierNote:"10 fronds with tip splinters"}}},
  rapidfire:{id:"rapidfire",name:"Rapid Fire",icon:"⋯",category:"Burst",damage:13,radius:12,count:5,burstGap:.07,streamSpread:.018,color:"#d6edf7",description:"A fast sequence of small ballistic rounds fired from exactly the same aim setting.",tierNote:"5-round burst",tierUpgrades:{2:{count:7,burstGap:.058,tierNote:"7-round burst"},3:{count:10,burstGap:.046,streamSpread:.012,tierNote:"10-round laser-tight burst"}}},

  // V5: source-inspired ShellShock families requested by the user. Mechanics are reimplemented
  // with original vector visuals and balance for Crater Clash's coordinate/physics scale.
  airstrike:{id:"airstrike",name:"Air Strike",icon:"⌖",category:"Flare",damage:20,radius:25,bombs:3,spreadX:42,flareBounces:2,color:"#71d8ff",description:"A bouncing flare settles, then calls three close sky bombs.",tierNote:"3 close bombs",tierUpgrades:{
    2:{name:"Helicopter Strike",bombs:9,damage:20,radius:15,spreadX:72,visualScale:1.08,tierNote:"9 tightly packed small bombs"},
    3:{name:"AC-130",bombs:3,damage:30,radius:25,spreadX:48,visualScale:1.16,tierNote:"3 heavier high-damage bombs"},
    4:{name:"Artillery",bombs:3,damage:25,radius:70,spreadX:58,artilleryOrder:true,terrainScale:1.35,visualScale:1.28,tierNote:"3 staggered terrain-crushing artillery shells"}
  }},
  snake:{id:"snake",name:"Snake",icon:"∿",category:"Crawler",damage:15,radius:15,snakeHits:10,snakeStep:.20,snakeTravel:25,snakeTurn:1.0,color:"#7fdc63",description:"After impact a living charge slithers unpredictably across the terrain, bursting repeatedly.",tierNote:"10 slithering bursts",tierUpgrades:{
    2:{name:"Python",damage:25,radius:20,snakeStep:.18,snakeTravel:29,snakeTurn:.86,visualScale:1.32,tierNote:"larger, longer and more destructive crawler"},
    3:{name:"Cobra",damage:35,radius:20,snakeStep:.16,snakeTravel:34,snakeTurn:1.22,visualScale:1.55,tierNote:"largest crawler with the longest erratic route"}
  }},
  counter3000:{id:"counter3000",name:"Counter 3000",icon:"123",category:"Volley",damage:5.2,radius:7,counterVolleys:3,volleyGap:.18,shotGap:.018,spread:.016,color:"#6fe5ff",description:"Fires escalating volleys: one shot, then two, then three.",tierNote:"1 + 2 + 3 = 6 shots",tierUpgrades:{
    2:{name:"Counter 4000",damage:4.3,counterVolleys:4,visualScale:1.06,tierNote:"adds a 4-shot volley · 10 total"},
    3:{name:"Counter 5000",damage:3.5,counterVolleys:5,visualScale:1.10,tierNote:"adds a 5-shot volley · 15 total"},
    4:{name:"Counter 6000",damage:3.0,counterVolleys:6,visualScale:1.16,tierNote:"adds a 6-shot finale · 21 total"}
  }},
  deadweight:{id:"deadweight",name:"Dead Weight",icon:"⇩",category:"Smart Drop",damage:25,radius:12,smartDrop:true,color:"#9aa6b2",description:"The projectile watches for an enemy beneath it, stops overhead, then drops vertically.",tierNote:"smart overhead drop",tierUpgrades:{
    2:{name:"Dead Riser",damage:35,radius:13,smartDrop:false,deadRiser:true,visualScale:1.30,tierNote:"enters the ground, seeks beneath a target and rises into them"}
  }},
  flame:{id:"flame",name:"Flame",icon:"♨",category:"Flame Spray",damage:1,radius:0,count:12,spread:.105,burnTicks:3,burnTickDamage:1,color:"#ff7048",description:"A wide twelve-flame spray; a direct hit burns the target repeatedly instead of cratering terrain.",tierNote:"12 flames · 3 delayed burn ticks",tierUpgrades:{
    2:{name:"Blaze",count:15,damage:2,burnTicks:2,burnTickDamage:2,spread:.098,visualScale:1.08,tierNote:"15 flames · two stronger burn ticks"},
    3:{name:"Inferno",count:15,damage:2,burnTicks:3,burnTickDamage:2,spread:.090,visualScale:1.18,tierNote:"15 flames · three heavy burn ticks"}
  }},
  bolt:{id:"bolt",name:"Bolt",icon:"ϟ",category:"Lightning Flare",damage:30,radius:18,bolts:1,flareBounces:2,color:"#d9ff75",description:"A flare calls a lightning strike straight down on the marked area.",tierNote:"1 lightning strike",tierUpgrades:{
    2:{name:"Lightning",damage:20,bolts:3,boltSpread:20,visualScale:1.10,tierNote:"3 lightning strikes"},
    3:{name:"2012",damage:15,bolts:3,boltSpread:22,comets:3,cometDamage:15,cometRadius:24,apocalypseFire:9,fireDamage:2,visualScale:1.24,tierNote:"3 bolts + 3 comets + burning apocalypse field"}
  }},
  tadpoles:{id:"tadpoles",name:"Tadpoles",icon:"◁",category:"Bouncy Swarm",damage:5.5,radius:10,count:12,tadBounces:2,spread:.060,distanceMin:4,distanceMax:7,color:"#72df6a",description:"A school of small green projectiles bounces on terrain before popping; long shots hit harder.",tierNote:"12 small bouncing tadpoles",tierUpgrades:{
    2:{name:"Frogs",count:15,radius:15,tadBounces:2,visualScale:1.28,tierNote:"15 larger frog projectiles"},
    3:{name:"Bullfrog",count:12,radius:15,tadBounces:2,bullfrogBig:true,bigDamageMin:16,bigDamageMax:40,bigRadius:25,visualScale:1.18,tierNote:"11 frogs + one oversized bullfrog"}
  }},
  fireworks:{id:"fireworks",name:"Fireworks",icon:"✹",category:"Fireworks",damage:8,radius:15,rockets:3,sparksPerRocket:12,rocketSpread:.075,color:"#ffcf61",description:"Three rockets burst automatically at the apex, each showering twelve damaging sparks.",tierNote:"3 rockets · 36 sparks",tierUpgrades:{
    2:{name:"Grand Finale",rockets:5,sparksPerRocket:12,visualScale:1.10,tierNote:"5 rockets · 60 sparks"},
    3:{name:"Pyrotechnics",pyrotechnics:true,damage:6,radius:20,pyroSparks:24,pyroRockets:5,pyroRocketSparks:9,visualScale:1.20,tierNote:"ground-triggered sparkling display · 69 total projectiles"}
  }},
  fleet:{id:"fleet",name:"Fleet",icon:"▶",category:"Formation",damage:3.6,radius:15,fleetRows:[11],formationSpread:.017,color:"#7edcff",description:"Eleven triangular shots launch in a clean formation.",tierNote:"11 light-blue triangles",tierUpgrades:{
    2:{name:"Heavy Fleet",damage:3.0,fleetRows:[11,9],visualScale:1.08,tierNote:"20 triangles in two rows"},
    3:{name:"Super Fleet",damage:2.3,fleetRows:[11,9,7],visualScale:1.14,tierNote:"27 triangles in three rows"},
    4:{name:"Squadron",damage:2.3,fleetRows:[11,9,7,5],visualScale:1.20,tierNote:"32-shot four-row formation"}
  }},
  bounder:{id:"bounder",name:"Bounder",icon:"↝",category:"Smart Bounce",damage:35,radius:30,count:1,bounderSpeed:220,color:"#f6bf66",description:"After its first ground touch it redirects straight toward the nearest enemy, terrain be damned.",tierNote:"1 smart bounder",tierUpgrades:{
    2:{name:"Double Bounder",damage:20,count:2,spread:.045,visualScale:1.08,tierNote:"2 independent smart bounders"},
    3:{name:"Triple Bounder",damage:15,count:3,spread:.055,visualScale:1.14,tierNote:"3 independent smart bounders"}
  }},
  uzi:{id:"uzi",name:"UZI",icon:"▸",category:"Straight Burst",damage:5,radius:0,count:10,straightSpread:.030,straightSpeed:950,color:"#69bfff",description:"Ten fast blue straight-shot bullets ignore wind, gravity and trick objects but stop on terrain.",tierNote:"10 bullets",tierUpgrades:{
    2:{name:"MP5",damage:5,count:12,straightSpread:.027,visualScale:1.05,tierNote:"12 bullets"},
    3:{name:"P90",damage:4,count:18,straightSpread:.038,visualScale:1.08,tierNote:"18 bullets with wider close-range spray"}
  }},
  stickybomb:{id:"stickybomb",name:"Sticky Bomb",icon:"◉",category:"Sticky",damage:30,radius:50,count:1,stickyDelay:2,color:"#ff5c6e",description:"A red-smoke bomb sticks where it lands and detonates two seconds later.",tierNote:"single 2-second sticky",tierUpgrades:{
    2:{name:"Sticky Trio",damage:20,count:3,spread:.065,radius:50,stickyDelay:2,visualScale:1.06,tierNote:"3 sticky bombs"},
    3:{name:"Mine Layer",damage:14,radius:50,mineLayer:true,mineBounces:5,mineCount:6,bouncePower:.70,visualScale:1.12,tierNote:"bounces 5 times, leaving 6 linked mines"},
    4:{name:"Sticky Rain",damage:9,radius:20,stickyRain:true,bombs:20,spreadX:250,flareBounces:2,visualScale:1.20,tierNote:"flare calls 20 chain-detonating sticky bombs"}
  }},
  spider:{id:"spider",name:"Spider",icon:"✣",category:"Web",damage:25,radius:0,spiderPattern:[3,6,12],spiderReach:52,color:"#f2f4ff",description:"Impact grows branching white legs; tanks touched by branches take direct damage.",tierNote:"1→3→6→12 branch web",tierUpgrades:{
    2:{name:"Tarantula",damage:20,spiderPattern:[3,9,18],spiderReach:62,visualScale:1.08,tierNote:"longer 1→3→9→18 web"},
    3:{name:"Daddy Longlegs",damage:22,spiderPattern:[5,25],spiderReach:94,visualScale:1.14,tierNote:"very long 1→5→25 legs"},
    4:{name:"Black Widow",damage:14,spiderPattern:[3,9,18,36],spiderReach:55,visualScale:1.20,tierNote:"dense 1→3→9→18→36 web"}
  }},
  bfg1000:{id:"bfg1000",name:"BFG-1000",icon:"⬤",category:"Distance Heavy",damage:42,radius:30,speedMult:.76,windFactor:2,distanceMin:24,distanceMax:60,color:"#8aff73",description:"A slow oversized orb with distance-based damage and exaggerated wind drift.",tierNote:"24–60 distance damage",tierUpgrades:{
    2:{name:"BFG-9000",damage:56,radius:35,speedMult:.72,windFactor:2,distanceMin:32,distanceMax:80,visualScale:1.55,tierNote:"much larger orb · 32–80 distance damage"}
  }},
  recruiter:{id:"recruiter",name:"Recruiter",icon:"⇆",category:"Crossfire Flare",damage:10,radius:30,recruitShots:14,flareBounces:2,color:"#52d88a",description:"A green flare calls reinforcement shots from both sides of the arena toward the marker.",tierNote:"14 blue crossfire shots",tierUpgrades:{
    2:{name:"Enroller",damage:10,recruitShots:17,shotColor:"#66e39a",visualScale:1.10,tierNote:"17 green crossfire shots"},
    3:{name:"Enlister",damage:10,recruitShots:20,shotColor:"#2faf67",visualScale:1.18,tierNote:"20 dark-green crossfire shots"}
  }},
  asteroidbelt:{id:"asteroidbelt",name:"Asteroid Belt",icon:"☄",category:"Orbital",damage:32,radius:31,bombs:3,spreadX:150,asteroidAngle:.65,color:"#ffb06f",description:"Marks an area for large asteroids that enter from varied upper-side angles instead of falling straight down.",tierNote:"3 asteroids",tierUpgrades:{2:{bombs:5,spreadX:190,tierNote:"5-asteroid belt"},3:{bombs:7,spreadX:240,asteroidHeavy:true,tierNote:"7 asteroids + one heavy core"}}},
};

// V4 tier families are intentionally uneven. Some weapon lines culminate at T2 or T3,
// while signature families continue to T4 with a more dramatic mechanical mutation.
// This mirrors the idea that an upgrade tier should be a meaningful family step rather
// than a mandatory identical number of levels for every weapon.
const V4_TIER_OVERRIDES={
  pulse:{
    2:{damage:54,radius:38,visualScale:1.16,tierNote:"Larger enhanced shell"},
    3:{damage:66,radius:43,visualScale:1.34,tierNote:"Heavy shell with a broader blast"},
    4:{damage:82,radius:51,visualScale:1.58,impactRings:2,tierNote:"Massive shell · visibly oversized impact core"}
  },
  core:{
    2:{damage:92,radius:58,visualScale:1.18,tierNote:"Denser breaker core"},
    3:{damage:112,radius:67,visualScale:1.35,tierNote:"Overloaded heavy core"},
    4:{damage:138,radius:78,visualScale:1.55,impactRings:2,tierNote:"Titan core · huge projectile and crater"}
  },
  orbvolley:{
    2:{count:5,damage:15,radius:18,spread:.066,visualScale:1.03,tierNote:"5-ball fan"},
    3:{count:11,damage:8.5,radius:15,spread:.047,visualScale:.94,tierNote:"11-ball wide spread"},
    4:{count:25,damage:4.6,radius:11,spread:.030,visualScale:.78,tierNote:"25-ball screen-filling volley"}
  },
  hyperbounce:{
    2:{bounces:3,damage:55,radius:32,bouncePower:.72,visualScale:1.08,tierNote:"3 energetic bounces"},
    3:{bounces:5,damage:64,radius:34,bouncePower:.76,visualScale:1.16,tierNote:"5 high-energy bounces"},
    4:{bounces:7,damage:76,radius:37,bouncePower:.80,visualScale:1.28,bounceSpark:true,tierNote:"7-bounce chaos orb"}
  },
  clustergrenade:{
    2:{bounces:4,fragments:3,damage:24,radius:19,clusterSpread:1.0,visualScale:1.10,tierNote:"Tri-cluster after grenade fuse"},
    3:{bounces:4,fragments:5,damage:20,radius:18,clusterSpread:1.22,visualScale:1.18,tierNote:"Five-way multi-grenade"},
    4:{bounces:1,fragments:0,damage:10,radius:15,bombs:15,spreadX:185,grenadeStorm:true,stormHeavy:true,visualScale:1.30,tierNote:"Grenade Storm · 14 mini drops + heavy center grenade"}
  },
  aquastream:{
    2:{count:20,damage:5.2,radius:10,burstGap:.035,streamSpread:.031,visualScale:.82,tierNote:"Creek · 20 stronger droplets"},
    3:{count:20,damage:7.0,radius:11,burstGap:.032,streamSpread:.043,visualScale:.88,tierNote:"River · 20 large scattered droplets"},
    4:{count:48,damage:2.8,radius:8,burstGap:.018,streamSpread:.012,wavePowerVariance:20,visualScale:.66,tierNote:"Tsunami · 48-ripple rising stream"}
  },
  prismsplit:{
    2:{fragments:4,damage:18,radius:17,splitTime:.59,visualScale:1.08,tierNote:"Double split · 4 projectiles"},
    3:{fragments:9,damage:11.5,radius:13,splitTime:.55,visualScale:.96,tierNote:"Super split · 9 projectiles"},
    4:{fragments:2,damage:17,radius:12,splitTime:.52,splitChain:3,visualScale:1.10,tierNote:"Splitter Chain · 1 → 2 → 4 → 8"}
  },
  breakerwave:{
    2:{fragments:4,damage:16,radius:15,breakerSpeed:168,visualScale:1.06,tierNote:"Double Breaker · 4 impact branches"},
    3:{fragments:6,damage:14,radius:13,breakerSpeed:182,visualScale:1.12,tierNote:"Super Breaker · 6 branches"},
    4:{fragments:2,damage:17,radius:12,breakerSpeed:178,breakerChainDepth:3,visualScale:1.18,tierNote:"Breaker Chain · each impact branches again"}
  },
  rapidfire:{
    2:{count:14,damage:6,radius:8,burstGap:.026,streamSpread:.060,visualScale:.72,tierNote:"Shotgun · 14-round cone"},
    3:{count:18,damage:5.2,radius:6,burstGap:.050,burstGroups:3,streamSpread:.042,visualScale:.68,tierNote:"Burst-Fire · 3 bursts of 6"},
    4:{count:40,damage:3.4,radius:5,burstGap:.014,streamSpread:.072,visualScale:.58,gatling:true,tierNote:"Gatling Gun · 40-round spray"}
  },
  burrow:{
    2:{damage:98,radius:54,tunnelTime:1.25,visualScale:1.28,tierNote:"Mega drill · larger body and deeper blast"},
    3:{damage:22,radius:19,tunnelTime:.78,excavationCount:8,excavationSpread:.075,visualScale:.82,tierNote:"Excavation · 8 drilling charges"}
  },
  roller:{
    2:{damage:82,radius:49,rollTime:2.9,rollSpeed:52,visualScale:1.28,tierNote:"Heavy Roller · larger but shorter travel"},
    3:{damage:48,radius:25,rollTime:4.8,rollSpeed:59,growsWithRoll:true,growDamageMax:118,visualScale:.72,tierNote:"Groller · grows and gains damage while rolling"}
  },
  backroller:{
    2:{damage:72,radius:44,rollTime:3.8,rollSpeed:68,visualScale:1.26,tierNote:"Heavy Back-Roller"},
    3:{damage:48,radius:25,rollTime:5.2,rollSpeed:78,growsWithRoll:true,growDamageMax:112,visualScale:.72,tierNote:"Back-Groller · grows while rolling backward"}
  },
  skymarker:{
    2:{bombs:8,damage:26,radius:25,spreadX:120,visualScale:1.10,tierNote:"Heli strike · 8 drops"},
    3:{bombs:12,damage:23,radius:24,spreadX:155,visualScale:1.18,tierNote:"Gunship strike · 12 drops"},
    4:{bombs:16,damage:19,radius:23,spreadX:205,artilleryHeavy:true,visualScale:1.30,tierNote:"Artillery · 16 shells + two heavy rounds"}
  },
  infernojet:{
    2:{count:7,damage:15,burn:7,burnTime:4,spread:.080,visualScale:1.08,tierNote:"Blaze · wider flame fan"},
    3:{count:11,damage:13,burn:9,burnTime:5.2,spread:.068,visualScale:1.18,tierNote:"Inferno · dense long-burning spray"}
  },
  twinkler:{
    2:{fragments:9,damage:13,splitTime:.84,visualScale:1.10,tierNote:"Sparkler · larger spark bloom"},
    3:{fragments:13,damage:12,splitTime:.76,sparkBounce:1,visualScale:1.20,tierNote:"Crackler · 13 bouncing sparks"}
  },
  sniper:{
    2:{count:1,damage:116,radius:6,visualScale:1.12,tierNote:"Sub-Sniper · heavier precision round"},
    3:{count:5,damage:26,radius:5,subShotSpread:.026,smartSnipe:.30,visualScale:.82,tierNote:"Smart Snipe · 5 correcting tracer rounds"}
  },
  cactus:{2:{fragments:18,damage:7,radius:10,spikeSpeed:178,visualScale:1.22,tierNote:"Cactus Strike · much denser radial needle burst"}},
  bulger:{2:{raise:86,radius:58,damage:34,visualScale:1.28,tierNote:"Big Bulger · visibly larger terrain lift"}},
  flower:{2:{fragments:12,damage:11,radius:13,petalSpeed:145,visualScale:1.22,tierNote:"Bouquet · double petal bloom"}},
  horizon:{2:{horizonRange:520,horizonPulses:20,damage:14,radius:12,visualScale:1.24,tierNote:"Sweeper · full-width terrain sweep"}},
  hoverorb:{2:{hoverTime:1.55,hoverSpeed:.12,dropBoost:1.3,damage:79,radius:45,visualScale:1.35,tierNote:"Heavy Hover Orb · larger suspended core"}},
  boomerang:{2:{returnTime:.64,returnForce:1.72,damage:82,radius:40,visualScale:1.34,tierNote:"Big Boomerang · wider return arc"}},
  discoball:{2:{bounces:3,laserDamage:22,laserRange:220,doubleLaser:true,visualScale:1.34,tierNote:"Groovy Ball · larger ball with cross-laser shards"}},
  quakecharge:{2:{quakePops:10,quakeSpan:390,damage:29,radius:25,visualScale:1.28,tierNote:"Mega-Quake · nearly double eruption coverage"}},
  deaddrop:{2:{damage:138,radius:58,visualScale:1.42,tierNote:"Dead Riser · much larger falling mass"}},
  gravityseed:{2:{damage:86,fieldRadius:170,fieldTime:3.25,visualScale:1.30,tierNote:"Heavy gravity core · larger pull field"}},
  carpetbomb:{
    2:{name:"Carpet Fire",bombs:20,damage:7,radius:30,spreadX:300,noTerrainDamage:true,angledStrike:true,visualScale:1.08,tierNote:"Carpet Fire · 20 angled bombs"},
    3:{name:"Incendiary Bombs",bombs:20,damage:7,radius:30,spreadX:300,noTerrainDamage:true,angledStrike:true,burn:2,burnTime:2.2,visualScale:1.16,tierNote:"Incendiary Bombs · 20 bombs + lingering flame"}
  },
  asteroidbelt:{
    2:{bombs:5,damage:30,spreadX:195,visualScale:1.14,tierNote:"Comets · five faster bodies"},
    3:{bombs:8,damage:27,spreadX:250,asteroidHeavy:true,visualScale:1.26,tierNote:"Asteroid Storm · eight bodies + heavy core"}
  }
};
for(const [id,tiers] of Object.entries(V4_TIER_OVERRIDES)){
  if(WEAPONS[id])WEAPONS[id].tierUpgrades={...(WEAPONS[id].tierUpgrades||{}),...tiers};
}
// Tier-I baselines for the families most directly modeled after classic ShellShock weapon lines.
Object.assign(WEAPONS.clustergrenade,{damage:50,radius:34,bounces:4,fragments:0,description:"A true bouncing grenade: it loses energy over four contacts before detonating."});
Object.assign(WEAPONS.aquastream,{damage:4,radius:9,count:20,burstGap:.038,streamSpread:.027,description:"Twenty light water shots stream out along nearly the same ballistic arc."});
Object.assign(WEAPONS.prismsplit,{damage:20,radius:17,fragments:2,splitTime:.70,description:"Splits in mid-air into two independent projectiles; later tiers become multi-stage splitters."});
Object.assign(WEAPONS.rapidfire,{damage:4.5,radius:8,count:10,burstGap:.030,streamSpread:.050,description:"A loose ten-round ballistic spray; later tiers mutate into shotgun, burst-fire and gatling patterns."});
const V4_TIER_NAMES={
  core:{2:"Core Breaker XL",3:"Core Crusher",4:"Core Cataclysm"},
  orbvolley:{2:"Five-Orb",3:"Eleven-Orb",4:"TwentyFive-Orb"},
  hyperbounce:{2:"Triple Rebound",3:"Penta Rebound",4:"Hepta Rebound"},
  clustergrenade:{2:"Tri Cluster",3:"Multi Cluster",4:"Grenade Storm"},
  aquastream:{2:"Aqua Creek",3:"Aqua River",4:"Tsunami Matrix"},
  prismsplit:{2:"Double Prism",3:"Super Prism",4:"Prism Chain"},
  breakerwave:{2:"Double Breaker",3:"Super Breaker",4:"Breaker Chain"},
  rapidfire:{2:"Scattergun",3:"Burst Array",4:"Gatling Array"},
  burrow:{2:"Mega Burrow",3:"Excavation Array"},
  roller:{2:"Heavy Roller",3:"G-Roller"},backroller:{2:"Heavy Back Roller",3:"Back G-Roller"},
  skymarker:{2:"Heli Marker",3:"Gunship Marker",4:"Artillery Grid"},
  twinkler:{2:"Sparkler",3:"Crackler"},sniper:{2:"Sub Vector",3:"Smart Vector"},
  cactus:{2:"Cactus Strike"},bulger:{2:"Big Bulger"},flower:{2:"Neon Bouquet"},horizon:{2:"Horizon Sweeper"},
  hoverorb:{2:"Heavy Hover Orb"},boomerang:{2:"Big Boomerang"},discoball:{2:"Groovy Ball"},quakecharge:{2:"Mega Quake"},
  deaddrop:{2:"Dead Riser"},gravityseed:{2:"Gravity Core"},carpetbomb:{2:"Carpet Fire",3:"Incendiary Bombs"},
  asteroidbelt:{2:"Comet Belt",3:"Asteroid Storm"}
};
for(const [id,names] of Object.entries(V4_TIER_NAMES))for(const [tier,name] of Object.entries(names)){if(WEAPONS[id]?.tierUpgrades?.[tier])WEAPONS[id].tierUpgrades[tier].name=name;}

export const WEAPON_TIER_CAPS={
  // Pulse Shell remains the infinite baseline. Signature families below can reach Tier IV.
  pulse:1,core:4,orbvolley:4,hyperbounce:4,clustergrenade:4,aquastream:4,
  prismsplit:4,breakerwave:4,rapidfire:4,skymarker:4,
  airstrike:4,counter3000:4,fleet:4,stickybomb:4,spider:4,
  snake:3,flame:3,bolt:3,tadpoles:3,fireworks:3,bounder:3,uzi:3,carpetbomb:3,recruiter:3,
  deadweight:2,bfg1000:2,
  // Two-tier families, intentionally shorter and more specialized.
  cactus:2,bulger:2,flower:2,horizon:2,hoverorb:2,boomerang:2,discoball:2,
  quakecharge:2,deaddrop:2,gravityseed:2,
  // All unspecified weapons top out at Tier III.
};

export const WEAPON_IDS=Object.keys(WEAPONS);
export const DIFFICULTIES={
  easy:{label:"Easy",aiSamples:90,aimError:.09,powerError:7,hp:115},
  normal:{label:"Normal",aiSamples:150,aimError:.045,powerError:3.8,hp:100},
  hard:{label:"Hard",aiSamples:240,aimError:.018,powerError:1.6,hp:100}
};
export const MODES={
  duel:{label:"Duel",tanks:2,teams:false,description:"You versus one AI tank."},
  ffa:{label:"4-Tank FFA",tanks:4,teams:false,description:"Free-for-all chaos with three AI opponents."},
  teams:{label:"2v2 Teams",tanks:4,teams:true,description:"You and an AI ally versus two enemies."}
};
export const ARENAS=[
  {id:"rolling",name:"Rolling Ridge",roughness:.42,hills:5,base:.67,wind:1.0,sky:["#17213a","#5c496d"]},
  {id:"canyon",name:"Neon Canyon",roughness:.60,hills:8,base:.73,wind:1.15,sky:["#10192b","#633d57"]},
  {id:"moon",name:"Low-G Basin",roughness:.33,hills:4,base:.70,wind:.75,gravity:.77,sky:["#07111e","#25315a"]},
  {id:"storm",name:"Ion Storm",roughness:.52,hills:7,base:.69,wind:1.45,sky:["#0c2030","#334965"]}
];
export const TANK_COLORS=["#5fe3ff","#ff718d","#ffd45d","#9c7cff","#62dc8e","#ff9d59"];

export const WEAPON_TIER_INFO={
  1:{label:"I",name:"Standard",damage:1,radius:1,visualScale:1},
  2:{label:"II",name:"Enhanced",damage:1.12,radius:1.06,visualScale:1.10},
  3:{label:"III",name:"Overclocked",damage:1.24,radius:1.12,visualScale:1.20},
  4:{label:"IV",name:"Apex",damage:1.36,radius:1.20,visualScale:1.36}
};

// Standard loot still strongly favors early tiers. Airdrops are the premium source of T3/T4 rolls.
export const STANDARD_TIER_WEIGHTS={1:.60,2:.25,3:.11,4:.04};
export const AIRDROP_TIER_WEIGHTS={1:.12,2:.30,3:.38,4:.20};

export const MATCH_DEFAULTS={
  playerCount:4,
  hp:100,
  turnTime:30,
  wind:"normal",
  fuel:100,
  weaponCount:12,
  skillObjects:"normal",
  crates:"normal",
  tracer:true
};

export const MATCH_SETTING_OPTIONS={
  playerCount:[2,4,6,8],
  hp:[100,150,200,300],
  turnTime:[15,30,45,60],
  fuel:[70,100,140,9999],
  weaponCount:[8,12,16,20],
  wind:["off","low","normal","extreme"],
  skillObjects:["off","low","normal","high"],
  crates:["off","low","normal","high"]
};
