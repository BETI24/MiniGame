export const WEAPONS = {
  pulse:{id:"pulse",name:"Pulse Shell",icon:"●",category:"Direct",damage:45,radius:34,color:"#76e8ff",description:"Clean, predictable shell. Great for learning wind and power."},
  core:{id:"core",name:"Core Breaker",icon:"⬢",category:"Heavy",damage:78,radius:52,color:"#ff8d72",gravity:1.08,description:"Heavy projectile with a large crater and strong splash damage."},
  tristar:{id:"tristar",name:"Tri-Star",icon:"✦",category:"Spread",damage:24,radius:25,count:3,spread:.085,color:"#f9d866",description:"Three shells fan out from the barrel."},
  shardbloom:{id:"shardbloom",name:"Shard Bloom",icon:"✺",category:"Airburst",damage:19,radius:22,fragments:7,splitTime:.82,color:"#9ef19d",description:"Splits near the apex into seven falling shards."},
  ricochet:{id:"ricochet",name:"Ricochet Orb",icon:"◇",category:"Bounce",damage:58,radius:38,bounces:2,color:"#d69cff",description:"Bounces twice before detonating. Excellent behind cover."},
  roller:{id:"roller",name:"Hill Roller",icon:"◉",category:"Ground",damage:68,radius:43,rollTime:3.4,rollSpeed:100,color:"#ffbf69",description:"Lands softly, then rolls downhill quickly before exploding."},
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
  sawblade:{id:"sawblade",name:"Saw Runner",icon:"✹",category:"Ground",damage:16,radius:13,rollTime:5.0,rollSpeed:140,multiHit:true,color:"#d9e0e6",description:"A fast spinning blade follows the surface and can cut the same tank repeatedly."},
  echobomb:{id:"echobomb",name:"Echo Bomb",icon:"◌",category:"Delayed",damage:46,radius:38,echoDamage:35,echoRadius:56,color:"#db8cff",description:"Explodes once on impact, then detonates a larger echo at the same spot."},
  mirror:{id:"mirror",name:"Mirror Shot",icon:"◆",category:"Bounce",damage:66,radius:39,wallBounces:3,color:"#8de9ff",description:"Reflects from arena side walls up to three times before exploding."},
  viper:{id:"viper",name:"Viper Line",icon:"S",category:"Ground",damage:54,radius:30,travel:520,rollSpeed:98,seekGround:true,color:"#8ed35d",description:"Becomes a quick ground serpent that crawls toward the nearest tank."},
  pinpoint:{id:"pinpoint",name:"Pinpoint",icon:"·",category:"Precision",damage:112,radius:8,color:"#ffffff",description:"Tiny hitbox, enormous direct-hit damage and almost no splash."},
  megaflux:{id:"megaflux",name:"Mega Flux",icon:"✸",category:"Heavy",damage:145,radius:92,color:"#ff5c88",description:"Rare superweapon with a huge blast and massive terrain deformation."},
  scatterrise:{id:"scatterrise",name:"Scatter Rise",icon:"↟",category:"Impact Effect",damage:16,radius:18,fragments:9,color:"#ffd56d",description:"Impact launches nine fragments upward before they rain back down."},
  timeskip:{id:"timeskip",name:"Time Skip",icon:"⌛",category:"Delayed",damage:88,radius:46,delay:2.2,color:"#7aa6ff",description:"Projectile vanishes on impact and reappears as an explosion after a suspenseful delay."},

  orbvolley:{id:"orbvolley",name:"Orb Volley",icon:"⁙",category:"Spread",damage:21,radius:20,count:3,spread:.075,color:"#f8d56b",description:"A ShellShock-style multi-ball family: several independent shells leave the barrel together.",tierNote:"3 shells",tierUpgrades:{2:{count:5,spread:.064,tierNote:"5 shells with tighter spacing"},3:{count:9,spread:.052,tierNote:"9-shell fan"}}},
  hyperbounce:{id:"hyperbounce",name:"Hyper Bounce",icon:"◈",category:"Bounce",damage:48,radius:31,bounces:1,bouncePower:.67,color:"#d9a2ff",description:"A dedicated bounce family that becomes dramatically less predictable at higher tiers.",tierNote:"1 bounce",tierUpgrades:{2:{bounces:3,bouncePower:.72,tierNote:"3 energetic bounces"},3:{bounces:5,bouncePower:.77,tierNote:"5 high-energy bounces"}}},
  clustergrenade:{id:"clustergrenade",name:"Cluster Grenade",icon:"✥",category:"Grenade",damage:18,radius:22,bounces:1,fragments:3,clusterSpread:1.05,color:"#98db73",description:"Bounces once, then bursts into a cluster of timed mini-grenades.",tierNote:"3 mini-grenades",tierUpgrades:{2:{fragments:5,bounces:2,tierNote:"5 mini-grenades after 2 bounces"},3:{fragments:8,bounces:2,clusterSpread:1.35,tierNote:"8-wide grenade storm"}}},
  aquastream:{id:"aquastream",name:"Aqua Stream",icon:"≋",category:"Stream",damage:11,radius:14,count:7,burstGap:.055,streamSpread:.028,color:"#6ac8ff",description:"A rapid stream of light shells follows almost the same ballistic arc.",tierNote:"7 droplets",tierUpgrades:{2:{count:10,streamSpread:.024,tierNote:"10-drop creek"},3:{count:14,streamSpread:.020,tierNote:"14-drop river"}}},
  infernojet:{id:"infernojet",name:"Inferno Jet",icon:"♨",category:"Fire",damage:13,radius:17,count:5,spread:.075,burn:5,burnTime:3.2,color:"#ff7854",description:"Short-range flaming spray. Each impact can leave a small burning patch.",tierNote:"5 flames",tierUpgrades:{2:{count:7,burn:6,burnTime:4,tierNote:"7 flames + longer burn"},3:{count:10,spread:.066,burn:8,burnTime:4.8,tierNote:"10-flame inferno"}}},
  backroller:{id:"backroller",name:"Back Roller",icon:"↶",category:"Ground",damage:58,radius:36,rollTime:3.6,rollSpeed:108,backRoll:true,color:"#ffbd6d",description:"After landing it quickly rolls back against its incoming direction.",tierNote:"Standard reverse roller",tierUpgrades:{2:{rollTime:4.4,rollSpeed:118,tierNote:"Longer, faster reverse roll"},3:{rollTime:5.2,rollSpeed:128,impactTrail:true,tierNote:"Reverse groller that chips terrain"}}},
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
    2:{damage:82,radius:49,rollTime:2.9,rollSpeed:112,visualScale:1.28,tierNote:"Heavy Roller · larger, fast surface travel"},
    3:{damage:48,radius:25,rollTime:4.8,rollSpeed:124,growsWithRoll:true,growDamageMax:118,visualScale:.72,tierNote:"Groller · grows and gains damage while rolling"}
  },
  backroller:{
    2:{damage:72,radius:44,rollTime:3.8,rollSpeed:118,visualScale:1.26,tierNote:"Heavy Back-Roller"},
    3:{damage:48,radius:25,rollTime:5.2,rollSpeed:132,growsWithRoll:true,growDamageMax:112,visualScale:.72,tierNote:"Back-Groller · grows while rolling backward"}
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

// V7 playtest rebalance / mechanical redesign pass.
// Explicit values below intentionally replace the generic tier scaling where a family needs
// reliable total damage, a different firing pattern, or a distinct tier identity.
const V7_WEAPON_REWORK={
  tristar:{base:{damage:18,radius:18,fragments:3,count:1,airburstHeight:105,airburstMinAge:.30,starPattern:"tri",description:"A single star core flies the aimed arc, then opens close to the ground into three heavy star points."},tiers:{
    2:{name:"Penta-Star",damage:16,radius:17,fragments:5,airburstHeight:112,visualScale:1.12,tierNote:"Near-ground five-point star bloom"},
    3:{name:"Nova-Star",damage:14,radius:16,fragments:7,airburstHeight:120,starCore:true,visualScale:1.24,tierNote:"Seven-point nova + heavy center star"}
  }},
  shardbloom:{base:{airburstHeight:112,airburstMinAge:.30,splitTime:99,description:"The seed stays intact through the high arc and only opens near the terrain into falling shards."},tiers:{
    2:{fragments:9,damage:17,radius:20,airburstHeight:120,visualScale:1.12,tierNote:"9-shard near-ground bloom"},
    3:{fragments:12,damage:15,radius:18,airburstHeight:128,shardHeavy:true,visualScale:1.22,tierNote:"12 shards + reinforced center shard"}
  }},
  prismsplit:{base:{airburstHeight:118,airburstMinAge:.30,splitTime:99},tiers:{
    2:{fragments:4,damage:19,radius:17,airburstHeight:122,splitTime:99,visualScale:1.08,tierNote:"Near-ground double split · 4 prisms"},
    3:{fragments:8,damage:13,radius:14,airburstHeight:128,splitTime:99,visualScale:1.00,tierNote:"Near-ground super split · 8 prisms"},
    4:{fragments:2,damage:16,radius:12,airburstHeight:132,splitTime:99,splitChain:3,visualScale:1.12,tierNote:"Near-ground prism chain · 1→2→4→8"}
  }},
  starburst:{base:{damage:19,radius:17,fragments:5,airburstHeight:120,airburstMinAge:.30,splitTime:99,starRain:true,description:"A star core waits until it is close to the terrain, then throws five downward star-lances instead of a generic radial burst."},tiers:{
    2:{name:"Constellation",damage:17,radius:16,fragments:7,airburstHeight:130,starRain:true,visualScale:1.14,tierNote:"7 descending star-lances"},
    3:{name:"Supernova",damage:15,radius:15,fragments:9,airburstHeight:138,starRain:true,starCore:true,visualScale:1.28,tierNote:"9 star-lances + central nova core"}
  }},
  emberrain:{base:{damage:16,radius:20,fragments:6,burn:2,burnTime:3.4,airburstHeight:125,airburstMinAge:.30,splitTime:99},tiers:{
    2:{damage:15,radius:19,fragments:8,burn:2,burnTime:3.8,airburstHeight:132,visualScale:1.12,tierNote:"8 embers · 2 damage fire ticks"},
    3:{damage:14,radius:18,fragments:11,burn:2,burnTime:4.2,airburstHeight:140,visualScale:1.22,tierNote:"11 embers · wider fire rain"}
  }},
  kernelpop:{base:{damage:12,radius:15,fragments:10,bounces:1,airburstHeight:105,airburstMinAge:.30,splitTime:99},tiers:{
    2:{name:"Kernel Burst",damage:11,radius:14,fragments:14,bounces:1,airburstHeight:112,visualScale:1.08,tierNote:"14 near-ground bouncing kernels"},
    3:{name:"Popcorn Storm",damage:10,radius:13,fragments:18,bounces:1,airburstHeight:118,visualScale:1.15,tierNote:"18-kernel near-ground storm"},
    4:{name:"Chain Pop",damage:8.5,radius:11,fragments:12,bounces:1,airburstHeight:122,kernelChain:true,visualScale:1.23,tierNote:"12 kernels · first landing pops each into two micro-kernels"}
  }},
  twinkler:{base:{damage:14,radius:14,fragments:6,airburstHeight:125,airburstMinAge:.30,splitTime:99,twinkleRain:true,description:"Near the ground the core freezes into a glitter ring; staggered twinkles then spear vertically into the terrain."},tiers:{
    2:{name:"Sparkler",damage:13,radius:14,fragments:9,airburstHeight:132,twinkleRain:true,visualScale:1.12,tierNote:"9 staggered vertical twinkles"},
    3:{name:"Crackler",damage:12,radius:13,fragments:13,airburstHeight:140,twinkleRain:true,twinkleCross:true,visualScale:1.23,tierNote:"13 twinkles + cross-flash finale"}
  }},
  fireworks:{base:{airburstHeight:145,airburstMinAge:.30,description:"Rockets stay intact until descending close to the terrain, then burst into damaging fireworks."},tiers:{
    2:{name:"Grand Finale",rockets:5,sparksPerRocket:12,airburstHeight:155,visualScale:1.12,tierNote:"5 delayed low-altitude fireworks · 60 sparks"},
    3:{name:"Pyrotechnics",pyrotechnics:true,damage:7,radius:19,pyroSparks:24,pyroRockets:5,pyroRocketSparks:9,airburstHeight:160,visualScale:1.24,tierNote:"Low-altitude starburst + five secondary rockets"}
  }},
  gravityseed:{base:{damage:58,fieldRadius:125,fieldTime:2.6},tiers:{
    2:{damage:69,fieldRadius:170,fieldTime:3.25,visualScale:1.30,tierNote:"Heavy gravity core · larger pull field"},
    3:{damage:82,fieldRadius:205,fieldTime:3.55,visualScale:1.40,tierNote:"Singularity seed · wider pull and stronger collapse"}
  }},
  rampart:{base:{damage:14,radius:64,raise:52,description:"Raises a useful but controlled mound and deals light impact damage so the shot is never purely charitable to an enemy."},tiers:{
    2:{name:"Rampart Wall",damage:18,radius:70,raise:61,visualScale:1.18,tierNote:"Wider wall · modest terrain lift + 18 impact damage"},
    3:{name:"Fortress Seed",damage:23,radius:78,raise:68,doubleRampart:true,visualScale:1.28,tierNote:"Twin low ramparts + stronger impact"}
  }},
  roller:{base:{damage:50,radius:36,rollTime:3.1,rollSpeed:118},tiers:{
    2:{name:"Heavy Roller",damage:66,radius:43,rollTime:3.0,rollSpeed:128,visualScale:1.24,tierNote:"Heavy roller · 66 damage"},
    3:{name:"G-Roller",damage:72,radius:28,rollTime:4.2,rollSpeed:138,growsWithRoll:true,growDamageMax:102,visualScale:.86,tierNote:"Starts above T2 at 72 and grows up to 102 while rolling"}
  }},
  burrow:{base:{damage:70,radius:42,tunnelTime:.78,tunnelDepth:38,description:"Drills below the impact and erupts back upward, giving reliable damage without digging an enemy a giant safety crater."},tiers:{
    2:{name:"Mega Burrow",damage:88,radius:48,tunnelTime:.92,tunnelDepth:48,burrowShock:true,visualScale:1.28,tierNote:"Deeper mega drill + upward shock burst"},
    3:{name:"Excavation Array",damage:22,radius:22,tunnelTime:.62,tunnelDepth:30,excavationCount:5,excavationSpread:.048,excavationLink:true,visualScale:.92,tierNote:"5 linked drill charges that erupt in sequence"}
  }},
  ricochet:{base:{damage:52,radius:35,bounces:2,bouncePower:.62},tiers:{
    2:{name:"Triple Ricochet",damage:59,radius:36,bounces:3,bouncePower:.62,visualScale:1.10,tierNote:"3 controlled bounces"},
    3:{name:"Anchor Ricochet",damage:67,radius:37,bounces:4,bouncePower:.56,wallReflect:true,maxHorizontalSpeed:175,visualScale:1.18,tierNote:"4 lower bounces + side-wall reflection so it stays in arena"}
  }},
  arcchain:{base:{damage:34,radius:22,chain:2,chainRange:165,arcMode:"fork",description:"A direct arc anchors on the first target and forks to nearby enemies. Each tier changes the electrical pattern."},tiers:{
    2:{name:"Arc Relay",damage:31,radius:23,chain:4,chainRange:205,arcMode:"relay",relayPulse:15,visualScale:1.16,tierNote:"4-target relay + small pulse around every chained target"},
    3:{name:"Tesla Web",damage:27,radius:25,chain:6,chainRange:235,arcMode:"web",webReturn:true,webReturnDamage:28,visualScale:1.28,tierNote:"6-target web that returns a final bolt to the first target"}
  }},
  moonfall:{base:{damage:34,radius:31,bombs:4,moonFx:1},tiers:{
    2:{name:"Lunar Ring",damage:31,radius:30,bombs:6,moonFx:2,visualScale:1.18,tierNote:"6 satellites + double orbital ring"},
    3:{name:"Eclipse Fall",damage:28,radius:29,bombs:9,moonFx:3,lunarCore:true,visualScale:1.32,tierNote:"9 satellites + eclipse core impact"}
  }},
  faultline:{base:{damage:18,radius:22,lineRadius:240,faultPops:5,faultPattern:"forward",description:"Opens a visible chain of underground eruptions rather than nine identical hidden damage checks."},tiers:{
    2:{name:"Forked Fault",damage:19,radius:23,lineRadius:330,faultPops:7,faultPattern:"fork",faultCore:30,visualScale:1.16,tierNote:"7 forked eruptions + central rupture"},
    3:{name:"Continental Rift",damage:18,radius:24,lineRadius:430,faultPops:9,faultPattern:"rift",faultCore:38,faultEnds:28,visualScale:1.30,tierNote:"9 alternating rifts + heavy core and endpoint shocks"}
  }},
  corkscrew:{base:{damage:58,radius:34,corkTunnel:110,corkSpeed:125,corkDepth:24,description:"The spiral is functional: after first terrain contact it drills sideways underground, then erupts at the end of the corkscrew tunnel."},tiers:{
    2:{name:"Double Corkscrew",damage:68,radius:38,corkTunnel:155,corkSpeed:138,corkDepth:30,corkPulses:1,visualScale:1.16,tierNote:"Longer underground screw + mid-tunnel pulse"},
    3:{name:"Auger Spiral",damage:78,radius:43,corkTunnel:205,corkSpeed:150,corkDepth:34,corkPulses:2,visualScale:1.28,tierNote:"Long auger tunnel + two damaging drill pulses"}
  }},
  sawblade:{base:{damage:14,radius:12,rollTime:4.3,rollSpeed:150,multiHit:true,sawMinSpeed:115,sawHitCooldown:.46},tiers:{
    2:{name:"Buzz Saw",damage:17,radius:13,rollTime:4.6,rollSpeed:165,sawMinSpeed:125,sawHitCooldown:.43,visualScale:1.14,tierNote:"Faster saw with safer hit spacing"},
    3:{name:"Ripper Wheel",damage:20,radius:14,rollTime:4.8,rollSpeed:180,sawMinSpeed:140,sawHitCooldown:.40,visualScale:1.24,tierNote:"Fast heavy saw; never stalls on a target"}
  }},
  echobomb:{base:{damage:38,radius:34,echoDamage:26,echoRadius:44,echoes:1,echoGap:.72},tiers:{
    2:{name:"Double Echo",damage:40,radius:35,echoDamage:25,echoRadius:54,echoes:2,echoGap:.55,visualScale:1.14,tierNote:"Impact + two expanding echoes"},
    3:{name:"Resonance Bomb",damage:42,radius:36,echoDamage:24,echoRadius:64,echoes:3,echoGap:.42,echoGrow:8,visualScale:1.28,tierNote:"Impact + three rapid expanding resonance waves"}
  }},
  mirror:{base:{damage:42,radius:28,mirrorShots:1,mirrorSpread:.18,description:"The first impact creates a mirror gate and fires a reflected shell back out instead of simply exploding."},tiers:{
    2:{name:"Double Mirror",damage:38,radius:27,mirrorShots:2,mirrorSpread:.25,visualScale:1.15,tierNote:"First impact reflects two symmetric shells"},
    3:{name:"Mirror Prism",damage:34,radius:25,mirrorShots:3,mirrorSpread:.32,mirrorFinal:true,visualScale:1.28,tierNote:"Three reflected shells + mirror-gate finale"}
  }},
  viper:{base:{damage:15,radius:18,viperSteps:8,viperStep:.18,viperTravel:34,viperSeek:1.0,description:"On impact the shell becomes a fast venom signal that slithers along terrain toward an enemy and bites in pulses; it is no longer a roller."},tiers:{
    2:{name:"Viper Rush",damage:17,radius:19,viperSteps:10,viperStep:.16,viperTravel:39,viperSeek:1.25,visualScale:1.14,tierNote:"10 faster seeking venom bites"},
    3:{name:"Cobra Line",damage:19,radius:20,viperSteps:12,viperStep:.145,viperTravel:43,viperSeek:1.55,viperFinisher:28,visualScale:1.26,tierNote:"12 bites + heavy finishing strike"}
  }},
  megaflux:{base:{name:"Mega Flux",damage:76,radius:58,description:"A dense plasma bomb. Tier I is deliberately strong but no longer a pocket nuke."},tiers:{
    2:{name:"Mega Flux XL",damage:98,radius:70,visualScale:1.30,tierNote:"Larger plasma shock core"},
    3:{name:"Nuclear Flux",damage:124,radius:82,nukeAftershock:24,nukeDelay:.42,visualScale:1.52,tierNote:"Nuclear-class blast + delayed outer shockwave"}
  }},
  scatterrise:{base:{damage:15,radius:17,fragments:8,scatterMode:"spray"},tiers:{
    2:{name:"Scatter Columns",damage:14,radius:16,fragments:9,scatterMode:"columns",visualScale:1.12,tierNote:"Three vertical columns of rising fragments"},
    3:{name:"Scatter Crown",damage:13,radius:15,fragments:11,scatterMode:"crown",scatterCore:30,visualScale:1.24,tierNote:"Wide crown arcs + heavy center return shell"}
  }},
  timeskip:{base:{damage:34,radius:30,timeEchoes:2,timeGap:.34,timeTraceBack:.38,description:"On impact the projectile rewinds through its own recent path: temporal echoes detonate backward along the trajectory."},tiers:{
    2:{name:"Time Rewind",damage:32,radius:31,timeEchoes:3,timeGap:.28,timeTraceBack:.55,visualScale:1.15,tierNote:"3 reverse-path temporal detonations"},
    3:{name:"Time Collapse",damage:30,radius:32,timeEchoes:4,timeGap:.22,timeTraceBack:.72,timeFinal:38,visualScale:1.28,tierNote:"4 rewind detonations + final time-collapse pulse"}
  }},
  orbvolley:{base:{damage:15,radius:18,count:3,spread:.055,salvos:1,salvoGap:.18,description:"Orbs are fired in visible salvos so higher tiers have a better chance to walk multiple hits across a target."},tiers:{
    2:{name:"Five-Orb",count:5,damage:12,radius:17,spread:.042,salvos:2,salvoGap:.16,visualScale:1.03,tierNote:"5 orbs in two salvos"},
    3:{name:"Eleven-Orb",count:11,damage:8.5,radius:15,spread:.032,salvos:3,salvoGap:.14,visualScale:.96,tierNote:"11 orbs in three tight salvos"},
    4:{name:"TwentyFive-Orb",count:25,damage:5.8,radius:12,spread:.024,salvos:5,salvoGap:.12,visualScale:.82,tierNote:"25 orbs in five sweeping salvos"}
  }},
  clustergrenade:{base:{damage:30,radius:23,bounces:1,fragments:3,fragmentDamage:14,clusterSpread:.90},tiers:{
    2:{name:"Tri Cluster",damage:28,radius:22,bounces:1,fragments:5,fragmentDamage:13,clusterSpread:1.0,visualScale:1.10,tierNote:"Single bounce → 5 mini-grenades"},
    3:{name:"Multi Cluster",damage:27,radius:21,bounces:1,fragments:7,fragmentDamage:12,clusterSpread:1.12,visualScale:1.18,tierNote:"Single bounce → 7 mini-grenades"},
    4:{name:"Grenade Storm",damage:12,radius:18,bounces:0,fragments:0,bombs:10,spreadX:145,grenadeStorm:true,stormHeavy:true,stormHeavyDamage:28,visualScale:1.30,tierNote:"Marker drops 9 grenades + one heavy center nade"}
  }},
  aquastream:{base:{damage:4.5,radius:9,count:20,burstGap:.038,streamSpread:.024},tiers:{
    2:{name:"Aqua Creek",count:20,damage:5.4,radius:10,burstGap:.035,streamSpread:.024,visualScale:.82,tierNote:"20 stronger droplets"},
    3:{name:"Aqua River",count:20,damage:7.0,radius:11,burstGap:.032,streamSpread:.032,visualScale:.88,tierNote:"20 heavy river droplets"},
    4:{name:"Tsunami Matrix",count:40,damage:4.8,radius:9,burstGap:.020,streamSpread:.015,burstGroups:4,wavePowerVariance:8,visualScale:.72,tierNote:"40 droplets in four tight wave salvos"}
  }},
  infernojet:{base:{damage:12,radius:16,count:6,spread:.060,burn:2,burnTime:3.0},tiers:{
    2:{name:"Blaze",count:8,damage:13,radius:16,burn:2,burnTime:3.5,spread:.057,visualScale:1.08,tierNote:"8 flames · 2-damage pools"},
    3:{name:"Inferno",count:11,damage:12,radius:16,burn:2,burnTime:4.0,spread:.052,visualScale:1.18,tierNote:"11 dense flames · 2-damage pools"}
  }},
  acidrain:{base:{damage:11,radius:19,bombs:6,spreadX:85,acid:2,acidTime:3.2},tiers:{
    2:{bombs:9,damage:11,radius:19,spreadX:105,acid:2,acidTime:3.8,tierNote:"9 drops · 2-damage acid pools"},
    3:{bombs:12,damage:10,radius:18,spreadX:125,acid:2,acidTime:4.2,tierNote:"12 drops · wider 2-damage pools"}
  }},
  sniper:{base:{damage:96,radius:7,count:1,subShotSpread:0,smartSnipe:0},tiers:{
    2:{name:"Sub Vector",count:1,damage:116,radius:6,subShotSpread:0,smartSnipe:0,visualScale:1.12,tierNote:"One heavier precision round"},
    3:{name:"Smart Vector",count:3,damage:42,radius:5,subShotSpread:.006,smartSnipe:0,visualScale:.88,tierNote:"3 sequential precision rounds using the exact previewed speed"}
  }},
  quakecharge:{base:{damage:11,radius:0,globalQuake:true,repairStrength:.12,repairDamage:11,description:"A seismic reset wave lightly damages every enemy while pulling the arena terrain back toward its original shape."},tiers:{
    2:{name:"Mega Quake",damage:18,radius:0,globalQuake:true,repairStrength:.24,repairDamage:18,visualScale:1.30,tierNote:"Stronger global damage + twice the terrain restoration"}
  }},
  fountain:{base:{damage:15,radius:16,fragments:4,fountainSpeed:165},tiers:{
    2:{fragments:6,damage:15,fountainSpeed:180,visualScale:1.12,tierNote:"6 high fountain droplets"},
    3:{name:"Geyser Core",fragments:8,damage:14,fountainSpeed:195,fountainCore:true,fountainCoreDamage:42,fountainCoreRadius:26,visualScale:1.26,tierNote:"8 droplets + a heavy center droplet that rises and falls straight back"}
  }},
  flower:{base:{damage:11,radius:14,fragments:6,petalSpeed:130,fragmentGrace:.16},tiers:{
    2:{name:"Neon Bouquet",fragments:12,damage:9,radius:12,petalSpeed:145,fragmentGrace:.16,visualScale:1.22,tierNote:"12-petal bloom with spawn grace"}
  }},
  horizon:{base:{damage:34,radius:0,horizonRange:310,horizonSpeed:250,horizonWave:true,description:"Impact launches two visible ground-energy fronts. A tank is damaged once when a wavefront actually reaches it."},tiers:{
    2:{name:"Neon Sweeper",damage:44,radius:0,horizonRange:520,horizonSpeed:310,horizonWave:true,horizonReturn:true,visualScale:1.26,tierNote:"Longer faster sweep + one return pass"}
  }},
  areastrike:{base:{damage:30,radius:27,bombs:3,spreadX:48,precisionStrike:true},tiers:{
    2:{bombs:5,damage:28,radius:26,spreadX:62,precisionStrike:true,tierNote:"5 evenly spaced precision bombs"},
    3:{bombs:7,damage:26,radius:25,spreadX:78,precisionStrike:true,centerBomb:true,tierNote:"7 precision bombs + heavy center"}
  }},
  hoverorb:{base:{damage:64,radius:38,hoverStrike:true,hoverDrops:1,hoverDelay:.75,hoverSpread:0,description:"The marker creates a suspended orb above the impact zone; it locks a nearby enemy and then drops vertically."},tiers:{
    2:{name:"Heavy Hover Orb",damage:48,radius:34,hoverStrike:true,hoverDrops:3,hoverDelay:.85,hoverSpread:48,visualScale:1.35,tierNote:"Three suspended orbs lock and drop around the target"}
  }},
  boomerang:{base:{damage:58,radius:34,returnTime:.82,returnForce:1.18,returnSpeedCap:145,noSelfHit:true},tiers:{
    2:{name:"Big Boomerang",damage:74,radius:39,returnTime:.72,returnForce:1.24,returnSpeedCap:155,noSelfHit:true,visualScale:1.32,tierNote:"Larger controlled return arc; cannot hit its shooter"}
  }},
  beehive:{base:{damage:10,radius:11,fragments:5,homing:1.55,fragmentGrace:.18,hiveShellHoming:false},tiers:{
    2:{fragments:7,damage:10,homing:1.8,fragmentGrace:.18,tierNote:"7 bees; hive itself stays ballistic"},
    3:{fragments:10,damage:9.5,homing:2.05,beeLife:3.4,fragmentGrace:.18,tierNote:"10 relentless bees; hive remains unguided"}
  }},
  cactus:{base:{damage:10,radius:11,fragments:8,spikeSpeed:160,airburstHeight:92,airburstMinAge:.30,cactusAirburst:true,fragmentGrace:.14,description:"The cactus opens in the air just before impact and rains spikes into the ground."},tiers:{
    2:{name:"Cactus Strike",damage:9,radius:10,fragments:7,spikeSpeed:172,cactusStrike:true,cactusPods:3,cactusPodSpread:72,airburstHeight:96,fragmentGrace:.14,visualScale:1.22,tierNote:"Marker calls 3 cactus pods; each airbursts into spikes"}
  }},
  carpetbomb:{base:{damage:10.5,radius:28,bombs:15,spreadX:250,flareBounces:2,noTerrainDamage:true,angledStrike:true},tiers:{
    2:{name:"Carpet Fire",bombs:20,damage:10.5,radius:30,spreadX:300,noTerrainDamage:true,angledStrike:true,visualScale:1.08,tierNote:"20 bombs · +50% projectile damage"},
    3:{name:"Incendiary Bombs",bombs:20,damage:7,radius:30,spreadX:300,noTerrainDamage:true,angledStrike:true,burn:2,burnTime:2.2,visualScale:1.16,tierNote:"Original T3 damage · 2-damage fire pools"},
    4:{name:"Rolling Barrage",bombs:24,damage:8.5,radius:27,spreadX:330,noTerrainDamage:true,angledStrike:true,carpetWaves:2,carpetHeavy:2,visualScale:1.28,tierNote:"Two crossing carpet waves + two heavy bunker busters"}
  }},
  gunship:{base:{damage:7,radius:8,gunshipRun:true,gunshipBullets:10,gunshipCannons:2,gunshipSpan:220,description:"A visible gunship crosses the sky and mixes a tight autocannon strafe with heavier cannon shells."},tiers:{
    2:{name:"Heavy Gunship",damage:7.5,radius:8,gunshipRun:true,gunshipBullets:14,gunshipCannons:3,gunshipSpan:250,gunshipCannonDamage:24,visualScale:1.14,tierNote:"14 autocannon shots + 3 cannon shells"},
    3:{name:"AC Gunship",damage:8,radius:8,gunshipRun:true,gunshipBullets:18,gunshipCannons:4,gunshipSpan:280,gunshipCannonDamage:28,gunshipMissileDamage:48,gunshipMissile:true,visualScale:1.26,tierNote:"18 autocannon shots + 4 cannons + guided final missile"}
  }},
  discoball:{base:{damage:12,radius:12,discoHang:true,discoShots:8,discoSpan:210,discoDelay:.45,description:"The marker hangs a mirror ball from the ceiling. It then fires glitter projectiles down across the marked ground."},tiers:{
    2:{name:"Groovy Ball",damage:13,radius:13,discoHang:true,discoShots:13,discoSpan:280,discoDelay:.38,discoCross:true,visualScale:1.34,tierNote:"13 falling glitter shots + cross-laser finale"}
  }},
  ghostbomb:{base:{damage:58,radius:38,ghostSeek:true,ghostTravel:105,ghostDepth:24,description:"After entering terrain the ghost travels underground toward the nearest enemy and erupts beneath it."},tiers:{
    2:{name:"Haunting Bomb",damage:68,radius:43,ghostSeek:true,ghostTravel:135,ghostDepth:28,visualScale:1.15,tierNote:"Faster, longer underground seek"},
    3:{name:"Poltergeist",damage:62,radius:39,ghostSeek:true,ghostTravel:160,ghostDepth:30,ghostTwins:2,ghostPulse:true,visualScale:1.28,tierNote:"Two underground ghosts seek nearby enemies + exit pulse"}
  }},
  guppies:{base:{damage:9.5,radius:10,fragments:6,homing:1.05,fragmentGrace:.20,hiveShellHoming:false},tiers:{
    2:{fragments:9,damage:9,homing:1.25,fragmentGrace:.20,tierNote:"9 guppies; parent shell stays ballistic"},
    3:{fragments:13,damage:8.5,homing:1.45,fragmentGrace:.20,tierNote:"13 guppies with safe spawn grace"}
  }},
  palmburst:{base:{damage:11,radius:14,palmTree:true,palmDrops:5,palmSpan:135,palmDelay:.34,description:"Impact grows a temporary energy palm; cocoon-like fruit rises from the crown and drops back in curved lanes."},tiers:{
    2:{name:"Royal Palm",damage:11,radius:14,palmTree:true,palmDrops:7,palmSpan:165,palmDelay:.30,visualScale:1.16,tierNote:"7 falling palm-fruit lanes"},
    3:{name:"Palm Barrage",damage:10.5,radius:13,palmTree:true,palmDrops:10,palmSpan:200,palmDelay:.26,palmHeavy:true,visualScale:1.28,tierNote:"10 fruit drops + heavy center coconut"}
  }},
  rapidfire:{base:{damage:6.75,radius:8,count:10,burstGap:.030,streamSpread:.050},tiers:{
    2:{name:"Scattergun",count:14,damage:9,radius:8,burstGap:.026,streamSpread:.060,visualScale:.72,tierNote:"14-round cone · +50% damage"},
    3:{name:"Burst Array",count:18,damage:7.8,radius:6,burstGap:.050,burstGroups:3,streamSpread:.042,visualScale:.68,tierNote:"3 bursts of 6 · +50% damage"},
    4:{name:"Gatling Array",count:40,damage:5.1,radius:5,burstGap:.014,streamSpread:.072,gatling:true,visualScale:.58,tierNote:"40-round gatling spray · +50% damage"}
  }},
  airstrike:{base:{damage:22,radius:24,bombs:3,spreadX:38,flareBounces:2,flatBlast:true},tiers:{
    2:{name:"Helicopter Strike",bombs:8,damage:18,radius:18,spreadX:60,flatBlast:true,visualScale:1.08,tierNote:"8 tight helicopter drops · flat in-radius damage"},
    3:{name:"AC-130",damage:7,radius:8,ac130:true,gunshipBullets:12,gunshipCannons:3,gunshipCannonDamage:25,gunshipMissileDamage:42,gunshipMissile:true,spreadX:110,visualScale:1.18,tierNote:"AC-130 pass: autocannon + cannon shells + missile"},
    4:{name:"Artillery",bombs:3,damage:38,radius:54,spreadX:54,artilleryOrder:true,artilleryShrapnel:4,flatBlast:true,terrainScale:1.15,visualScale:1.30,tierNote:"3 staggered 38-damage shells + shrapnel bursts"}
  }},
  counter3000:{base:{damage:10.4,radius:7,counterVolleys:3},tiers:{
    2:{name:"Counter 4000",damage:8.6,counterVolleys:4,visualScale:1.06,tierNote:"10 shots · doubled projectile damage"},
    3:{name:"Counter 5000",damage:7.0,counterVolleys:5,visualScale:1.10,tierNote:"15 shots · doubled projectile damage"},
    4:{name:"Counter 6000",damage:6.0,counterVolleys:6,visualScale:1.16,tierNote:"21 shots · doubled projectile damage"}
  }},
  flame:{base:{damage:1.5,radius:0,count:12,streamSpread:.035,burstGap:.035,burnTicks:3,burnTickDamage:1.5,flameStream:true,description:"Flames now fly as a tight sequential stream like Aqua Stream instead of an instant fan."},tiers:{
    2:{name:"Blaze",count:15,damage:2.4,streamSpread:.033,burstGap:.031,burnTicks:2,burnTickDamage:2,flameStream:true,visualScale:1.08,tierNote:"15-shot flame stream · two burn ticks"},
    3:{name:"Inferno",count:18,damage:2.4,streamSpread:.030,burstGap:.027,burnTicks:3,burnTickDamage:2,flameStream:true,visualScale:1.18,tierNote:"18-shot dense flame stream · three burn ticks"}
  }},
  bolt:{base:{damage:30,radius:18,bolts:1},tiers:{
    2:{name:"Lightning",damage:28,bolts:3,boltSpread:20,visualScale:1.10,tierNote:"3 × 28 lightning strikes"},
    3:{name:"2012",damage:24,bolts:3,boltSpread:22,comets:3,cometDamage:20,cometRadius:24,apocalypseFire:7,fireDamage:2,visualScale:1.24,tierNote:"3 × 24 bolts + 3 comets + 2-damage fire"}
  }},
  tadpoles:{base:{damage:5,radius:12,count:12,tadHops:2,tadHopSpeed:72,streamSpread:.034,burstGap:.036,tadStream:true,description:"Tadpoles are fired in a flowing stream. On landing they make short random hops and damage a small area at every landing."},tiers:{
    2:{name:"Frogs",count:15,damage:6.5,radius:15,tadHops:2,tadHopSpeed:78,streamSpread:.032,burstGap:.032,tadStream:true,visualScale:1.24,tierNote:"15 larger stream-fired frogs · 2 hops"},
    3:{name:"Bullfrog",count:12,damage:7,radius:15,tadHops:3,tadHopSpeed:82,streamSpread:.030,burstGap:.030,tadStream:true,bullfrogBig:true,bigDamage:18,bigRadius:25,visualScale:1.18,tierNote:"11 frogs + heavy bullfrog · 3 short hops"}
  }},
  fleet:{base:{damage:7.2,radius:15,fleetRows:[11]},tiers:{
    2:{name:"Heavy Fleet",damage:7.5,fleetRows:[11,9],visualScale:1.08,tierNote:"20 triangles · 2.5× old damage"},
    3:{name:"Super Fleet",damage:6.9,fleetRows:[11,9,7],visualScale:1.14,tierNote:"27 triangles · 3× old damage"},
    4:{name:"Squadron",damage:6.9,fleetRows:[11,9,7,5],visualScale:1.20,tierNote:"32-shot formation · 3× old damage"}
  }},
  uzi:{base:{damage:5.2,radius:0,count:10,straightSpread:.009,straightSpeed:950,description:"A tight straight bullet burst: no gravity, no wind, only a small muzzle spread that matches the straight preview."},tiers:{
    2:{name:"MP5",damage:5.0,count:13,straightSpread:.008,straightSpeed:980,visualScale:1.04,tierNote:"13-round tight straight burst"},
    3:{name:"P90",damage:4.4,count:19,straightSpread:.007,straightSpeed:1010,visualScale:1.07,tierNote:"19-round high-rate straight burst with controlled spread"}
  }},
  bounder:{base:{damage:35,radius:28,count:1,bounderLaunch:250,bounderDropSpeed:260,description:"On first ground contact it leaps high, then locks a nearby enemy and drops vertically onto them."},tiers:{
    2:{name:"Double Bounder",damage:24,count:2,spread:.035,bounderLaunch:270,bounderDropSpeed:280,visualScale:1.08,tierNote:"2 independent leap-and-drop bounders"},
    3:{name:"Triple Bounder",damage:19,count:3,spread:.045,bounderLaunch:290,bounderDropSpeed:300,visualScale:1.14,tierNote:"3 high-jump aimlocked bounders"}
  }}
};
for(const [id,re] of Object.entries(V7_WEAPON_REWORK)){
  const w=WEAPONS[id];if(!w)continue;
  Object.assign(w,re.base||{});
  if(re.tiers)w.tierUpgrades={...(w.tierUpgrades||{}),...re.tiers};
}

// V8 Legacy Arsenal — source-guided families inspired by the public ShellShock Live weapon descriptions.
// Visuals and code are original vector/browser implementations; the family behavior is intentionally recognizable.
Object.assign(WEAPONS,{
  digger:{id:"digger",name:"Digger",icon:"◉",category:"Jumping",damage:12,radius:25,color:"#ff9d3d",diggerHits:5,diggerJump:225,diggerTerrainRadius:11,
    description:"An orange jumping core repeatedly slams the exact impact point, damaging and digging the terrain deeper with every landing.",tierNote:"5 vertical blasts · 12 damage each",
    tierUpgrades:{2:{name:"Mega-Digger",damage:18,radius:30,diggerHits:4,diggerJump:240,diggerTerrainRadius:13,visualScale:1.34,tierNote:"Larger core · 4 vertical blasts · 18 each"},3:{name:"Excavation",damage:6,radius:20,diggerHits:4,diggerJump:185,diggerTerrainRadius:8,excavationCount:12,excavationSpread:.040,visualScale:.78,tierNote:"12 diggers · 4 ground blasts each · 6 damage"}}},
  breaker:{id:"breaker",name:"Breaker",icon:"⋔",category:"Impact Split",damage:20,radius:30,color:"#46f06e",breakerPieces:2,breakerJump:198,
    description:"The shell lands, cracks open and launches high-bouncing breaker pieces that explode when they return to the terrain.",tierNote:"2 breaker pieces · 20 damage each",
    tierUpgrades:{2:{name:"Double-Breaker",damage:18,radius:25,breakerPieces:4,breakerJump:214,breakerArc:.50,visualScale:1.12,tierNote:"4 bright-green high arcs · 18 each"},3:{name:"Super-Breaker",damage:15,radius:22,breakerPieces:9,breakerJump:225,breakerArc:.58,visualScale:1.18,tierNote:"9 luminous breaker arcs · 15 each"},4:{name:"BreakerChain",damage:18,radius:20,breakerPieces:2,breakerChainDepth:3,breakerJump:205,breakerArc:.48,visualScale:1.24,tierNote:"Multistage 2 → 4 → 8 luminous breaker chain · 18 each"}}},
  zipper:{id:"zipper",name:"Zipper",icon:"⇆",category:"Ground Sweep",damage:4,radius:0,color:"#5ed8ff",zipperCount:1,zipperRange:.05,zipperTraversals:8,zipperSpeed:340,
    description:"On impact an energy bead locks to the terrain contour and rapidly zips left and right across the same strip eight times.",tierNote:"1 blue zipper · ±5% arena width · 8 traversals · 4 per touch",
    tierUpgrades:{2:{name:"Double Zipper",damage:2,zipperCount:2,zipperRange:.05,zipperTraversals:8,zipperSpeed:360,visualScale:1.08,tierNote:"2 opposite zippers · 8 traversals · 2 per touch"},3:{name:"Zipper Quad",damage:2,zipperCount:4,zipperRange:.05,zipperLargeRange:.08,zipperTraversals:8,zipperSpeed:380,visualScale:1.15,tierNote:"2 blue ±5% + 2 large yellow ±8% · 2 per touch"}}},
  ringer:{id:"ringer",name:"Ringer",icon:"◎",category:"Ring",damage:40,radius:0,color:"#72e8dc",ringRadius:55,ringThickness:10,noSelfHit:true,noTerrainDamage:true,
    description:"Impact creates a hollow damage ring: the center is safe and damage exists only around the circumference.",tierNote:"40 damage circumference · small ring",
    tierUpgrades:{2:{name:"Heavy Ringer",damage:50,ringRadius:98,ringThickness:12,visualScale:1.28,tierNote:"50 damage · much larger circumference"},3:{name:"Olympic Ringer",damage:15,ringRadius:72,ringThickness:9,olympicRings:5,visualScale:1.17,tierNote:"5 overlapping mid-size rings · 15 damage each"}}},
  spiker:{id:"spiker",name:"Spiker",icon:"╽",category:"Terrain Spikes",damage:20,radius:25,color:"#cbd3da",spikeBeams:5,spikeSpacing:34,spikeDelay:.075,spikeSpeed:205,
    description:"After a ground impact, gray guide beams march along the terrain; once placed, spikes launch perpendicular to each local slope.",tierNote:"Initial impact + 5 spikes · 20 each",
    tierUpgrades:{2:{name:"Super Spiker",damage:20,radius:25,spikeBeams:9,spikeSpacing:29,spikeDelay:.060,spikeSpeed:215,visualScale:1.16,tierNote:"Initial impact + 9 spikes · 20 each"}}},
  pinata:{id:"pinata",name:"Pinata",icon:"▧",category:"Flare",damage:6,radius:15,color:"#ff72d7",pinatas:1,pinataShots:16,flareBounces:2,pinataSpan:155,
    description:"A flare calls down a hanging pinata that bursts into a colorful randomized shower of projectiles.",tierNote:"1 pinata · 16 colorful projectiles · 6 each",
    tierUpgrades:{2:{name:"Fiesta",damage:5,radius:15,pinatas:3,pinataShots:10,flareBounces:2,pinataSpan:115,visualScale:1.18,tierNote:"3 flares must land · then 3 pinatas burst together · 10 shots each"}}},
  miniv:{id:"miniv",name:"Mini-V",icon:"V",category:"Impact Effect",damage:15,radius:30,color:"#8bd6ff",vShots:6,vSpeed:175,vWidth:.42,
    description:"Ground impact kicks a V-shaped fan upward: half drift left and half drift right before falling back down.",tierNote:"6 upward V shots · 15 each",
    tierUpgrades:{2:{name:"Flying-V",damage:15,radius:30,vShots:10,vSpeed:215,vWidth:.52,visualScale:1.12,tierNote:"10 higher-reaching V shots · 15 each"}}},
  napalm:{id:"napalm",name:"Napalm",icon:"♨",category:"Airburst Fire",damage:4,radius:15,color:"#ff693f",napalmShots:11,napalmMin:3,napalmMax:5,napalmDouble:true,airburstHeight:105,airburstMinAge:.30,noTerrainDamage:true,
    description:"A flaming shell bursts close to the ground into an eleven-pellet shotgun fan. The first two tiers leave no persistent fire.",tierNote:"11 flame pellets · (3–5)×2 damage range",
    tierUpgrades:{2:{name:"Heavy Napalm",damage:6,radius:17,napalmShots:11,napalmMin:5,napalmMax:7,napalmDouble:true,airburstHeight:112,visualScale:1.25,tierNote:"11 larger flame pellets · (5–7)×2"},3:{name:"FireStorm",damage:8,radius:30,fireStorm:true,fireStormMeteors:20,fireStormFireDamage:2,fireStormRockContacts:8,flareBounces:2,visualScale:1.28,tierNote:"Flare · 20 meteors + 2-damage fire + two delayed bounsplode rocks"}}},
  sunburst:{id:"sunburst",name:"Sunburst",icon:"☀",category:"Solar",damage:8,radius:0,color:"#ffd85f",sunRays:24,sunRayMin:3,sunRayMax:8,sunRayRange:120,sunRayRangePct:.62,noTerrainDamage:true,
    description:"Impact releases 24 rays every 15 degrees. They race outward, reverse, and return to the impact origin.",tierNote:"24 outward-and-return rays · 3–8 distance damage",
    tierUpgrades:{2:{name:"Solar Flare",damage:8,sunRays:24,sunRayRange:130,sunRayRangePct:.66,solarSparks:24,solarSparkDamage:30,visualScale:1.22,tierNote:"24 returning rays + 24 long-range edge-bouncing sparks · 30 each"}}},
  synclets:{id:"synclets",name:"Synclets",icon:"∴",category:"Air Pause",damage:10,radius:0,color:"#79ef8e",syncCount:12,syncSpread:.095,syncHeight:88,syncDamageMin:4,syncDamageMax:10,noTerrainDamage:true,
    description:"A green spray freezes just above the ground. Only when every surviving Synclet is in position do all of them resume together.",tierNote:"12 synchronized projectiles · 4–10 distance damage",
    tierUpgrades:{2:{name:"Super-Synclets",syncCount:16,syncSpread:.108,syncHeight:96,syncDamageMin:4,syncDamageMax:10,visualScale:1.12,tierNote:"16 synchronized projectiles · larger coordinated strike"}}},
  seagull:{id:"seagull",name:"Baby Seagull",icon:"⌁",category:"Air Drop",damage:20,radius:40,color:"#f2f4ef",poopMin:6,poopMax:15,poopInterval:1,poopRadius:20,seagullWind:2,seagullWallBounce:true,
    description:"The bird follows a ballistic flight, bounces off arena edges and drops a distance-scaled projectile every second.",tierNote:"20 bird impact · poop 6–15 each · double wind",
    tierUpgrades:{2:{name:"Seagull",damage:24,poopMin:7,poopMax:18,poopInterval:1,visualScale:1.20,tierNote:"Larger bird · 24 impact · poop 7–18"},3:{name:"Mama Seagull",damage:28,poopMin:8,poopMax:21,poopInterval:1,visualScale:1.42,tierNote:"Huge bird · 28 impact · poop 8–21"}}},
  shrapnel:{id:"shrapnel",name:"Shrapnel",icon:"✣",category:"Fragment Burst",damage:6,radius:12,color:"#d8dee5",shrapnelCount:30,shrapnelDamage:6,shrapnelImpact:10,shrapnelSpeed:205,
    description:"The grenade pops for light impact damage and instantly sprays fast metal fragments in every direction.",tierNote:"10 impact + 30 fragments · 6 each",
    tierUpgrades:{2:{name:"Shredders",shrapnelCount:40,shrapnelDamage:6,shrapnelImpact:10,shrapnelSpeed:220,visualScale:1.14,tierNote:"10 impact + 40 fragments · 6 each"}}},
  batteringram:{id:"batteringram",name:"Battering Ram",icon:"➠",category:"Apex Drop",damage:50,radius:25,color:"#a67be8",ramMin:22,ramMax:50,ramApexGravity:4.9,ramCount:1,
    description:"A purple ram follows the aimed arc until its apex, then gravity becomes roughly five times stronger and it dives sharply.",tierNote:"1 ram · 22–50 distance damage",
    tierUpgrades:{2:{name:"Double Ram",ramMin:14,ramMax:35,ramCount:1,ramBounces:1,ramApexGravity:4.9,visualScale:1.12,tierNote:"14–35 damage per impact · jumps once for a second hit"},3:{name:"Ram-Squad",ramMin:6,ramMax:15,ramCount:5,ramBounces:0,ramApexGravity:4.9,visualScale:.90,tierNote:"5 rapid rams with slight power variation · 6–15 each"},4:{name:"Double Ram-Squad",ramMin:4,ramMax:10,ramCount:5,ramBounces:1,ramApexGravity:4.9,visualScale:.92,tierNote:"5 rapid Double Rams · each hits twice · 4–10 per impact"}}},
  rampage:{id:"rampage",name:"Rampage",icon:"≋",category:"Sine Barrage",damage:15,radius:0,color:"#ff784f",rampageCount:4,rampageSpeed:315,rampageAmplitude:58,rampageWaves:2.2,noTerrainDamage:true,
    description:"Ignores power. Angle only chooses left or right, launching wide sine-wave projectiles across the arena that do not hit allies while traveling.",tierNote:"4 sine-wave projectiles · 15 damage each",
    tierUpgrades:{2:{name:"Riot",rampageCount:6,rampageSpeed:325,rampageAmplitude:62,rampageWaves:2.4,visualScale:1.08,tierNote:"6 sine-wave projectiles · 15 each"}}},
  snowball:{id:"snowball",name:"Snowball",icon:"●",category:"Growing Bounce",damage:5,radius:0,color:"#eaf8ff",snowDamage:[5,15,30,45,60,75,90,105],snowBounces:7,snowBouncePower:.72,noTerrainDamage:true,
    description:"A tiny snowball grows every time it hits the terrain. Each bounce raises both size and contact damage until the oversized ball finally bursts.",tierNote:"Damage ladder 5→15→30→45→60→75→90→105",
    tierUpgrades:{2:{name:"Snowstorm",snowStorm:true,snowballs:3,snowDamage:[5,20,40,60,80],snowBounces:4,snowBouncePower:.73,flareBounces:2,visualScale:1.10,tierNote:"Flare summons 3 growing snowballs · 5→20→40→60→80"}}},
  fighterjet:{id:"fighterjet",name:"Fighter Jet",icon:"✈",category:"Smart",damage:40,radius:40,color:"#9fc8dd",jetMin:16,jetMax:40,jetRockets:4,rocketDamage:10,jetApexRockets:true,
    description:"The jet is fired like a normal projectile. At its apex it releases four heat-seeking rockets one-by-one toward the nearest enemy.",tierNote:"Jet 16–40 distance damage + 4×10 rockets",
    tierUpgrades:{2:{name:"Heavy Jet",jetMin:20,jetMax:50,jetRockets:4,rocketDamage:14,radius:48,visualScale:1.28,tierNote:"Jet 20–50 + 4×14 rockets · larger body"}}},
  breakermadness:{id:"breakermadness",name:"BreakerMadness",icon:"⋇",category:"Multistage Impact",damage:6,radius:20,color:"#ff9bdc",madnessDepth:5,madnessJump:175,madnessSpread:.16,
    description:"A compact BreakerChain keeps breaking through 2→4→8→16→32 pieces. Every generation grows larger and jumps higher inside a tight area.",tierNote:"2→4→8→16→32 · 32 final breakers · 6 damage each",
    tierUpgrades:{2:{name:"BreakerMania",damage:4,madnessDepth:6,madnessJump:182,madnessSpread:.145,visualScale:1.10,tierNote:"2→4→8→16→32→64 · 64 final breakers · 4 each"}}},
  fury:{id:"fury",name:"Fury",icon:"♨",category:"Impact Barrage",damage:5,radius:18,color:"#ff7048",furyOrange:25,furyBlue:0,furyOrangeDamage:5,furyBlueDamage:10,furyHeight:170,
    description:"The shell must hit terrain. A fury core rises straight up from that point and rains a dense barrage of tiny explosive fireballs back down.",tierNote:"25 orange fireballs · 5 damage each · no fire pools",
    tierUpgrades:{2:{name:"Rage",furyOrange:20,furyBlue:5,furyOrangeDamage:5,furyBlueDamage:10,furyHeight:210,visualScale:1.22,tierNote:"20 orange ×5 + 5 larger blue ×10 from a higher second core"}}},
  // V12 source-guided ShellShock-inspired families. Mechanics are adapted to Crater Clash scale and vector presentation.
  waterballoon:{id:"waterballoon",name:"Water Balloon",icon:"◉",category:"Chaos Water",damage:8,radius:0,color:"#59d8ff",balloons:1,waterDrops:10,waterMin:2,waterMax:8,balloonSpread:.035,balloonMaxBounces:3,noTerrainDamage:true,
    description:"A wobbling balloon follows a slightly randomized arc, makes a few short unpredictable ground bounces, then bursts sideways into damage-scaled water droplets. The balloon itself deals no damage.",tierNote:"1 balloon → 10 water droplets · 2–8 distance damage · 0–3 random bounces",
    tierUpgrades:{2:{name:"Water Trio",balloons:3,waterDrops:10,waterMin:2,waterMax:7,balloonSpread:.060,balloonMaxBounces:3,visualScale:1.08,tierNote:"3 wider-deviation balloons → 10 droplets each · 2–7"},3:{name:"Water Fight",balloons:10,waterDrops:5,waterMin:2,waterMax:6,balloonSpread:.050,balloonMaxBounces:2,visualScale:.92,tierNote:"10 tight balloons → 5 droplets each · 2–6 · huge area coverage"}}},
  quicksand:{id:"quicksand",name:"Quicksand",icon:"≋",category:"Underground Volley",damage:3,radius:7,color:"#d6aa62",sandCount:30,sandMin:1,sandMax:3,sandSpread:.052,sandBurrowTime:.16,sandDepthPower:.34,
    description:"A rapid sand stream punches through the surface instead of detonating on contact. Every grain travels briefly underground, then pops beneath the terrain to dig a broad sink zone and damage tanks above it.",tierNote:"30 grains · 1–3 distance damage · tiny underground blasts",
    tierUpgrades:{2:{name:"Desert",sandCount:35,sandMin:1,sandMax:3,radius:8.5,sandSpread:.058,sandBurrowTime:.19,sandDepthPower:.40,visualScale:1.06,tierNote:"35 grains · wider/deeper underground destruction · 1–3 each"}}},
  dualroller:{id:"dualroller",name:"Dual-Roller",icon:"◒",category:"Split Roller",damage:20,radius:20,color:"#72e7ff",dualRollers:2,dualRollDamage:20,dualRollTime:1.9,dualRollSpeed:115,
    description:"The colorful core pops on impact and ejects two smaller rollers in opposite directions. Its upgrade transforms the shot into a marker that rains nine directional rollers over the area.",tierNote:"20 impact + 2 opposite rollers ×20",
    tierUpgrades:{2:{name:"Spreader",color:"#70f08f",damage:15,radius:18,spreader:true,spreaderRollers:9,dualRollDamage:15,dualRollTime:1.65,dualRollSpeed:126,visualScale:1.10,tierNote:"Marker → 9 green rollers: 4 left · 1 center · 4 right · 15 each"}}},
  imploder:{id:"imploder",name:"Imploder",icon:"⊙",category:"Self Burst",damage:140,radius:92,color:"#c67cff",imploderCharge:1.05,imploderSelfFraction:.45,imploderEnemyDamage:140,imploderTerrain:.72,noProjectile:true,
    description:"The firing tank charges itself into a volatile core, then detonates in place. The blast is devastating to nearby enemies but sacrifices a large share of the user's own health without ever killing the user outright.",tierNote:"1.05s charge · 140 enemy damage · 45% current-HP self cost · 92px blast",
    tierUpgrades:{2:{name:"Ultimate Imploder",damage:140,radius:122,imploderCharge:1.20,imploderSelfFraction:.45,imploderEnemyDamage:140,imploderTerrain:.92,visualScale:1.34,tierNote:"Same lethal core damage · much larger 122px implosion and terrain collapse"}}},

  // V12 original Crater Clash families.
  pendulum:{id:"pendulum",name:"Pendulum",icon:"⌁",category:"Kinetic Field",damage:20,radius:18,color:"#7fe7ff",pendulumOrbs:1,pendulumPasses:3,pendulumSpan:82,pendulumRope:132,pendulumDamage:20,
    description:"Impact erects an overhead anchor and swings a heavy energy weight through the target zone. The orb can connect on several passes before the rig collapses.",tierNote:"1 swinging orb · 3 center passes · 20 contact damage",
    tierUpgrades:{2:{name:"Twin Pendulum",pendulumOrbs:2,pendulumPasses:4,pendulumSpan:96,pendulumRope:145,pendulumDamage:18,visualScale:1.12,tierNote:"2 counter-phase orbs · 4 passes · 18 each"},3:{name:"Newton Array",pendulumOrbs:3,pendulumPasses:5,pendulumSpan:112,pendulumRope:155,pendulumDamage:15,pendulumFinal:30,visualScale:1.22,tierNote:"3-orb cradle · 5 passes · 15 each + 30 final center slam"}}},
  teslagate:{id:"teslagate",name:"Tesla Gate",icon:"ϟ",category:"Beam Trap",damage:19,radius:0,color:"#b9ff69",gatePylons:2,gatePulses:3,gateSpan:118,gateDamage:19,
    description:"The shell plants energized pylons around the impact. Their connecting arc flashes repeatedly, punishing tanks caught on the line rather than simply exploding at the marker.",tierNote:"2 pylons · 3 beam pulses · 19 damage per pulse",
    tierUpgrades:{2:{name:"Tesla Corridor",gatePylons:3,gatePulses:4,gateSpan:150,gateDamage:17,visualScale:1.12,tierNote:"3 pylons · 2 linked beam lanes · 4 pulses · 17 each"},3:{name:"Tesla Lattice",gatePylons:4,gatePulses:5,gateSpan:184,gateDamage:15,gateCross:true,visualScale:1.20,tierNote:"4-pylon lattice · alternating cross arcs · 5 pulses · 15 each"}}},
  satellite:{id:"satellite",name:"Satellite Swarm",icon:"◌",category:"Orbit Dive",damage:18,radius:15,color:"#86b9ff",satelliteCount:3,satelliteOrbit:.95,satelliteDamage:18,satelliteRadius:78,
    description:"Impact creates a temporary orbital ring. Small satellites circle the point to telegraph the strike, then peel off one by one and dive toward nearby enemies.",tierNote:"3 orbiters · 0.95s orbit · 18-damage homing dives",
    tierUpgrades:{2:{name:"Orbital Pack",satelliteCount:5,satelliteOrbit:1.05,satelliteDamage:16,satelliteRadius:88,visualScale:1.12,tierNote:"5 orbiters · staggered 16-damage dives"},3:{name:"Constellation Dive",satelliteCount:7,satelliteOrbit:1.10,satelliteDamage:14,satelliteRadius:100,satelliteCore:26,visualScale:1.20,tierNote:"7 orbiters ×14 + 26-damage collapsing core"}}},
  wormhole:{id:"wormhole",name:"Wormhole",icon:"◍",category:"Portal Split",damage:27,radius:22,color:"#a77dff",portalChildren:2,portalSpan:92,portalDamage:27,
    description:"The first shell becomes a portal anchor. Two linked exits open beside it and re-launch mirrored child rounds back through the impact zone from impossible angles.",tierNote:"2 side portals · 2 mirrored child shells ×27",
    tierUpgrades:{2:{name:"Twin Wormhole",portalChildren:4,portalSpan:116,portalDamage:21,visualScale:1.15,tierNote:"2 exits · 4 crossing portal shells ×21"},3:{name:"Event Horizon",portalChildren:6,portalSpan:142,portalDamage:17,portalCollapse:34,visualScale:1.28,tierNote:"6 crossing shells ×17 + 34 portal-collapse pulse"}}},
  prismcage:{id:"prismcage",name:"Prism Cage",icon:"△",category:"Beam Geometry",damage:20,radius:0,color:"#79f1e0",cageSides:3,cagePulses:3,cageSpan:76,cageHeight:106,cageDamage:20,
    description:"Impact builds a geometric light cage over the terrain. Its edges ignite in timed sweeps, making placement and tank position matter more than blast radius.",tierNote:"Triangle cage · 3 edge sweeps · 20 damage",
    tierUpgrades:{2:{name:"Prism Vault",cageSides:4,cagePulses:4,cageSpan:90,cageHeight:120,cageDamage:17,visualScale:1.14,tierNote:"Diamond vault · 4 sweeps · 17 each"},3:{name:"Hex Prison",cageSides:6,cagePulses:5,cageSpan:108,cageHeight:132,cageDamage:14,cageFinal:30,visualScale:1.22,tierNote:"Hex cage · 5 sweeps ×14 + 30 inward collapse"}}},
  domino:{id:"domino",name:"Domino Charge",icon:"▥",category:"Chain Line",damage:14,radius:24,color:"#ffcc67",dominoCount:5,dominoSpacing:34,dominoDamage:14,dominoDelay:.13,
    description:"Impact plants a visible row of charges along the terrain. They topple into one another and detonate in a clearly readable chain instead of all going off at once.",tierNote:"5 terrain charges · sequential 14-damage chain",
    tierUpgrades:{2:{name:"Domino Run",dominoCount:7,dominoSpacing:32,dominoDamage:13,dominoDelay:.11,visualScale:1.10,tierNote:"7 faster charges ×13"},3:{name:"Double Six",dominoCount:9,dominoSpacing:30,dominoDamage:11,dominoDelay:.095,dominoReturn:true,visualScale:1.18,tierNote:"9 forward charges ×11 then a weaker reverse chain"}}},
  skyhook:{id:"skyhook",name:"Skyhook",icon:"J",category:"Displacement",damage:28,radius:24,color:"#9ed7ff",hookRange:190,hookDrag:62,hookDamage:28,hookTime:.95,
    description:"A marker calls a cable from above. The hook grabs the nearest enemy in range, drags it across the terrain toward the marker, then slams it down.",tierNote:"190px lock range · drag 62px · 28 slam damage",
    tierUpgrades:{2:{name:"Tow Cable",hookRange:235,hookDrag:92,hookDamage:34,hookTime:1.0,visualScale:1.12,tierNote:"235px lock · 92px drag · 34 slam"},3:{name:"Orbital Hook",hookRange:285,hookDrag:125,hookDamage:42,hookTime:1.08,hookShock:18,visualScale:1.22,tierNote:"285px lock · 125px drag · 42 slam + 18 shock pulse"}}},
  sandcastle:{id:"sandcastle",name:"Sandcastle",icon:"♜",category:"Trap Terraform",damage:14,radius:22,color:"#e8c66d",castleWalls:2,castleRaise:40,castleSpan:92,castleDrops:3,castleDropDamage:14,
    description:"Impact raises a pair of short walls around the landing zone, then drops masonry into the newly formed pocket. It can trap a tank while still dealing real damage.",tierNote:"2 walls · 3 falling stones ×14",
    tierUpgrades:{2:{name:"Fortified Castle",castleRaise:52,castleSpan:108,castleDrops:4,castleDropDamage:15,visualScale:1.15,tierNote:"Taller trap walls · 4 stones ×15"},3:{name:"Citadel",castleRaise:64,castleSpan:124,castleDrops:5,castleDropDamage:14,castleTower:true,visualScale:1.25,tierNote:"Citadel walls + center tower · 5 stones ×14"}}},
  compressor:{id:"compressor",name:"Compressor",icon:"⇥⇤",category:"Closing Walls",damage:19,radius:24,color:"#ff7eb7",compressSpan:126,compressCycles:1,compressDamage:19,compressTime:1.15,
    description:"Two energy walls spawn on opposite sides of the marker and close inward. Tanks are struck when a wall physically sweeps through them, followed by a collision pulse at center.",tierNote:"1 closing pass · 19 per wall + 24 center pulse",
    tierUpgrades:{2:{name:"Rebound Compressor",compressSpan:154,compressCycles:2,compressDamage:16,compressTime:1.35,visualScale:1.12,tierNote:"Walls close, rebound, and close again · 16 per pass"},3:{name:"Pressure Chamber",compressSpan:184,compressCycles:3,compressDamage:13,compressTime:1.55,compressFinal:34,visualScale:1.22,tierNote:"3 compression cycles ×13 + 34 final pressure burst"}}},
  pinball:{id:"pinball",name:"Pinball",icon:"●",category:"Kinetic Trick",damage:17,radius:20,color:"#ff70d6",pinNodes:3,pinHops:6,pinDamage:17,pinSpan:88,
    description:"Impact assembles a miniature neon pinball rig. One energy ball ricochets between floating bumpers through the target zone before detonating on its last node.",tierNote:"3 bumpers · 6 ricochets · 17 contact damage",
    tierUpgrades:{2:{name:"Multiball Rig",pinNodes:4,pinHops:9,pinDamage:14,pinSpan:104,visualScale:1.13,tierNote:"4-node rig · 9 faster ricochets ×14"},3:{name:"Tilt Machine",pinNodes:5,pinHops:12,pinDamage:12,pinSpan:122,pinFinal:30,visualScale:1.22,tierNote:"5 nodes · 12 ricochets ×12 + 30 final jackpot"}}},
  molecule:{id:"molecule",name:"Molecule",icon:"⚛",category:"Orbiting Projectile",damage:28,radius:26,color:"#75eaff",electronCount:2,electronDamage:8,electronOrbit:20,electronDetach:2,
    description:"Electrons physically orbit the ballistic nucleus during flight and can clip tanks before impact. When the nucleus lands, the electrons detach tangentially and continue as live projectiles.",tierNote:"2 flight electrons ×8 · 28 nucleus + 2 detached electrons",
    tierUpgrades:{2:{name:"Ion",damage:30,radius:27,electronCount:3,electronDamage:8,electronOrbit:23,electronDetach:3,visualScale:1.10,tierNote:"3 orbiting electrons ×8 + 30 core"},3:{name:"Plasma Atom",damage:32,radius:29,electronCount:4,electronDamage:7,electronOrbit:26,electronDetach:4,visualScale:1.18,tierNote:"4 fast electrons ×7 + 32 core"},4:{name:"Quantum Cluster",damage:34,radius:31,electronCount:6,electronDamage:6,electronOrbit:31,electronDetach:6,electronDoubleRing:true,visualScale:1.28,tierNote:"6 dual-ring electrons ×6 + 34 core · six tangent releases"}}},
  lighthouse:{id:"lighthouse",name:"Lighthouse",icon:"⌂",category:"Rotating Beam",damage:18,radius:0,color:"#fff083",beaconBeams:1,beaconTurns:1.0,beaconDamage:18,beaconRange:430,beaconTime:1.65,
    description:"Impact erects a beacon that sweeps a long damaging searchlight around the arena. The beam is continuous visually but each tank can only be struck once per revolution.",tierNote:"1 rotating beam · 1 revolution · 18 damage",
    tierUpgrades:{2:{name:"Twin Beacon",beaconBeams:2,beaconTurns:1.25,beaconDamage:17,beaconRange:470,beaconTime:1.75,visualScale:1.13,tierNote:"2 opposite beams · 1.25 turns · 17 per sweep"},3:{name:"Lightstorm",beaconBeams:3,beaconTurns:1.55,beaconDamage:15,beaconRange:520,beaconTime:1.90,beaconFinal:26,visualScale:1.22,tierNote:"3 beams · 1.55 turns ×15 + 26 final flash"}}},
  repulsor:{id:"repulsor",name:"Repulsor",icon:"⊕",category:"Shock Utility",damage:16,radius:0,color:"#70d8ff",repulsePulses:2,repulseRange:120,repulseDamage:16,repulseForce:30,
    description:"The impact core emits expanding force rings. Tanks are damaged only when a wavefront reaches them and are shoved away across the terrain, changing the next turn's geometry.",tierNote:"2 expanding pulses ×16 · 30px push",
    tierUpgrades:{2:{name:"Force Cascade",repulsePulses:3,repulseRange:150,repulseDamage:14,repulseForce:38,visualScale:1.12,tierNote:"3 pulses ×14 · 38px push"},3:{name:"Mass Ejector",repulsePulses:4,repulseRange:182,repulseDamage:12,repulseForce:48,repulseFinal:24,visualScale:1.22,tierNote:"4 pulses ×12 · 48px push + 24 core rupture"}}},
  swapbomb:{id:"swapbomb",name:"Swap Bomb",icon:"⇄",category:"Position Trick",damage:20,radius:18,color:"#c68aff",swapRange:230,swapTargets:1,swapDamage:20,
    description:"Instead of a conventional blast, the impact tears a relocation seam: the shooter and a nearby enemy exchange positions, instantly rewriting the firing geometry.",tierNote:"Swap shooter with nearest enemy within 230px · 20 enemy damage",
    tierUpgrades:{2:{name:"Shuffle Bomb",swapRange:300,swapTargets:2,swapDamage:18,visualScale:1.18,tierNote:"Cycle positions between shooter + up to 2 nearby enemies · 18 damage to each enemy"}}},
  phantomcopy:{id:"phantomcopy",name:"Phantom Copy",icon:"◐",category:"Cross-Dimension",damage:44,radius:25,color:"#b8a2ff",phantomShots:1,phantomDamage:44,phantomDelay:.35,
    description:"The marker opens a rift on the far side of the arena. A ghost copy of the shot then enters from outside the map and converges on the exact marked point.",tierNote:"1 far-edge phantom shell ×44",
    tierUpgrades:{2:{name:"Cross Phantoms",phantomShots:2,phantomDamage:32,phantomDelay:.28,visualScale:1.12,tierNote:"2 mirrored edge phantoms ×32"},3:{name:"Tri-Specter",phantomShots:3,phantomDamage:26,phantomDelay:.22,phantomTop:true,visualScale:1.20,tierNote:"Left + right + overhead specters ×26"}}},
  meteorsling:{id:"meteorsling",name:"Meteor Sling",icon:"⌣",category:"Ground Crossfire",damage:17,radius:20,color:"#ff9f69",slingShots:3,slingSpan:96,slingDamage:17,slingSpeed:175,
    description:"Impact plants two launch cradles on the ground. Both sides sling rocks upward and inward so their arcs cross over the marker instead of falling from the sky.",tierNote:"2 cradles · 3 paired crossing rocks ×17",
    tierUpgrades:{2:{name:"Double Sling",slingShots:5,slingSpan:116,slingDamage:14,slingSpeed:188,visualScale:1.12,tierNote:"5 paired crossing rocks ×14"},3:{name:"Meteor Catapult",slingShots:7,slingSpan:138,slingDamage:12,slingSpeed:205,slingHeavy:28,visualScale:1.22,tierNote:"7 paired rocks ×12 + 2 heavy center catapults"}}},
  razorhalo:{id:"razorhalo",name:"Razor Halo",icon:"✹",category:"Contracting Ring",damage:7,radius:0,color:"#e9f2f8",haloBlades:8,haloStart:112,haloTime:1.35,haloTurns:1.0,haloDamage:10,
    description:"Impact creates a ring of rotating blades that contracts toward the center while spinning. A tank can be clipped on multiple revolutions if it sits in the shrinking path.",tierNote:"8 blades · 1 turn while contracting · 7 per contact",
    tierUpgrades:{2:{name:"Saw Halo",haloBlades:12,haloStart:132,haloTime:1.55,haloTurns:1.5,haloDamage:9,visualScale:1.12,tierNote:"12 blades · 1.5 turns ×9"},3:{name:"Razor Vortex",haloBlades:16,haloStart:158,haloTime:1.80,haloTurns:2.0,haloDamage:8,haloFinal:28,visualScale:1.22,tierNote:"16 blades · 2 turns ×8 + 28 center shred"}}},
  crystalbloom:{id:"crystalbloom",name:"Crystal Bloom",icon:"♦",category:"Growth Shatter",damage:13,radius:18,color:"#8ff1ff",crystalSpikes:3,crystalSpan:86,crystalDamage:13,crystalShards:2,
    description:"Crystalline spires erupt from the ground in a deliberate formation. After growing, every spire shatters into diagonal shards, creating a two-stage hazard rather than a simple fragment burst.",tierNote:"3 spires ×13 · each shatters into 2 shards",
    tierUpgrades:{2:{name:"Crystal Grove",crystalSpikes:5,crystalSpan:112,crystalDamage:12,crystalShards:2,visualScale:1.13,tierNote:"5 spires ×12 · 10 outgoing shards"},3:{name:"Prismatic Forest",crystalSpikes:7,crystalSpan:142,crystalDamage:10,crystalShards:3,crystalCore:24,visualScale:1.22,tierNote:"7 spires ×10 · 21 shards + 24 central prism break"}}},
  guillotine:{id:"guillotine",name:"Guillotine",icon:"▰",category:"Falling Line",damage:46,radius:0,color:"#d7e5ed",bladeLength:112,bladeDamage:46,bladeDrops:1,bladeDelay:.35,
    description:"The marker materializes a wide horizontal energy blade overhead. It falls as one solid line, damaging anything across its width and slicing a shallow trench where it lands.",tierNote:"1 × 112px falling blade · 46 damage",
    tierUpgrades:{2:{name:"Twin Guillotine",bladeLength:150,bladeDamage:34,bladeDrops:2,bladeDelay:.28,visualScale:1.15,tierNote:"2 staggered 150px blades ×34"},3:{name:"Execution Grid",bladeLength:204,bladeDamage:26,bladeDrops:3,bladeDelay:.22,bladeCross:true,visualScale:1.24,tierNote:"3 wide blades ×26 · final crossing cut"}}},
  yoyo:{id:"yoyo",name:"Yo-Yo",icon:"◉",category:"Tether Sweep",damage:18,radius:18,color:"#ff8bd7",yoyoPasses:2,yoyoDamage:18,yoyoTime:1.35,
    description:"Impact leaves a tether anchor. An energy yo-yo races back toward the firing position and out again along the exact connecting line, turning the original shot into repeated line pressure.",tierNote:"2 tether traversals ×18",
    tierUpgrades:{2:{name:"Double Yo-Yo",yoyoPasses:3,yoyoDamage:16,yoyoTime:1.55,visualScale:1.12,tierNote:"3 fast traversals ×16"},3:{name:"Hyper Yo-Yo",yoyoPasses:4,yoyoDamage:14,yoyoTime:1.80,yoyoFinal:28,visualScale:1.20,tierNote:"4 traversals ×14 + 28 anchor snap"}}}

});


// V13 Apex Arsenal — 15 original Crater Clash weapon families.
Object.assign(WEAPONS,{
  dicecore:{id:"dicecore",name:"Chaos Die",icon:"⚄",category:"Chaos Engine",damage:13,radius:22,color:"#77eaff",diceRolls:4,diceInterval:.48,diceDamage:13,diceSpan:82,
    description:"Impact manifests a luminous combat die. Every roll triggers a different compact effect before the die cashes out in a final pulse.",tierNote:"4 readable random rolls · 13-damage class effects",
    tierUpgrades:{2:{name:"Loaded Dice",diceRolls:5,diceInterval:.44,diceDamage:14,diceSpan:94,visualScale:1.10,tierNote:"5 rolls · stronger weighted outcomes"},3:{name:"Double Down",diceRolls:7,diceInterval:.40,diceDamage:13,diceSpan:108,diceDouble:true,visualScale:1.18,tierNote:"7 rolls · occasional paired outcomes"},4:{name:"Casino Singularity",diceRolls:10,diceInterval:.36,diceDamage:12,diceSpan:122,diceTriple:true,diceFinal:48,visualScale:1.30,tierNote:"3-die spectacle · 10 rolls + 48-damage jackpot singularity"}}},
  sentryseed:{id:"sentryseed",name:"Sentry Seed",icon:"⌂",category:"Deployable",damage:13,radius:14,color:"#75e8b2",sentryCount:1,sentryShots:5,sentryDamage:13,sentryRange:280,sentryTime:2.2,
    description:"Impact deploys a miniature turret that tracks nearby enemies and fires its own rounds instead of exploding immediately.",tierNote:"1 turret · 5 tracking shots ×13",
    tierUpgrades:{2:{name:"Twin Turrets",sentryCount:2,sentryShots:5,sentryDamage:12,sentryRange:305,sentryTime:2.45,visualScale:1.10,tierNote:"2 turrets · 10 total tracking shots"},3:{name:"Battery Line",sentryCount:3,sentryShots:5,sentryDamage:11,sentryRange:330,sentryTime:2.7,visualScale:1.18,tierNote:"3-turret battery · 15 total shots"},4:{name:"Fortress Protocol",sentryCount:4,sentryShots:4,sentryDamage:11,sentryRange:360,sentryTime:3.0,sentryHeavy:30,sentryFinal:34,visualScale:1.30,tierNote:"4 turrets · 16 rounds + heavy cannon + synchronized finisher"}}},
  billiards:{id:"billiards",name:"Break Shot",icon:"⑧",category:"Billiards",damage:15,radius:14,color:"#f3f5ef",poolBalls:7,poolBounces:2,poolDamage:15,poolSpeed:155,poolSpan:128,
    description:"Impact racks energy billiard balls and breaks them across the terrain. Balls bank, bounce and collide through a local table zone.",tierNote:"7 balls · 2 banks · 15 each",
    tierUpgrades:{2:{name:"Trick Rack",poolBalls:10,poolBounces:2,poolDamage:14,poolSpeed:168,poolSpan:150,poolCue:true,visualScale:1.10,tierNote:"10-ball rack + cue follow-through"},3:{name:"Pool Hall",poolBalls:12,poolBounces:3,poolDamage:13,poolSpeed:178,poolSpan:176,poolRails:true,poolCue:true,poolEight:28,visualScale:1.18,tierNote:"12 balls · local neon rails · cue bank + 28 eight-ball finish"},4:{name:"Rack Attack",poolBalls:15,poolBounces:3,poolDamage:12,poolSpeed:190,poolSpan:212,poolRails:true,poolCue:true,poolEight:44,poolRailPulse:24,visualScale:1.28,tierNote:"Full 15-ball rack · table rails · cue ball · 44 eight-ball + rail pulse"}}},
  launchpad:{id:"launchpad",name:"Launch Pad",icon:"⇧",category:"Displacement",damage:26,radius:24,color:"#7ddcff",launchRange:118,launchHeight:92,launchDamage:26,launchTime:1.15,description:"A booster pad locks the nearest tank around the marker, lifts it off the terrain and slams it back down.",tierNote:"1 target · 92px lift · 26 slam",tierUpgrades:{2:{name:"Booster Pad",launchRange:155,launchHeight:128,launchDamage:34,launchTime:1.25,visualScale:1.14,tierNote:"Higher lift · 34 slam"},3:{name:"Orbital Elevator",launchRange:190,launchHeight:168,launchDamage:38,launchTargets:2,launchAirburst:20,launchTime:1.45,visualScale:1.24,tierNote:"Up to 2 targets · huge lift · 38 slam + 20 airburst"}}},
  chessknight:{id:"chessknight",name:"Knight Shift",icon:"♞",category:"Pattern Jumper",damage:14,radius:27,color:"#d8c8ff",knightJumps:5,knightStep:46,knightSpan:108,knightDamage:14,knightCount:1,
    description:"A spectral chess knight stays around the marked battle square, making readable L-shaped jumps and striking on every landing.",tierNote:"1 knight · 5 focused L-jumps ×14",
    tierUpgrades:{2:{name:"Royal Fork",knightJumps:5,knightStep:44,knightSpan:118,knightDamage:13,knightCount:2,visualScale:1.12,tierNote:"2 forked knights · 5 jumps each ×13"},3:{name:"Grandmaster",knightJumps:6,knightStep:42,knightSpan:128,knightDamage:12,knightCount:2,knightRook:30,knightFinal:34,visualScale:1.22,tierNote:"2 knights · 6 focused jumps + rook cross + CHECKMATE pulse"}}},
  cyclone:{id:"cyclone",name:"Cyclone",icon:"◌",category:"Vortex",damage:8,radius:0,color:"#8befff",cycloneCount:1,cycloneTime:1.85,cycloneRange:82,cycloneDamage:8,cycloneForce:13,description:"A terrain-following vortex drifts through the impact zone, tugging tanks inward while dealing repeated contact damage.",tierNote:"1 moving vortex · pull + repeated 8 damage",tierUpgrades:{2:{name:"Supercell",cycloneTime:2.15,cycloneRange:100,cycloneDamage:9,cycloneForce:17,visualScale:1.14,tierNote:"larger/stronger moving pull field"},3:{name:"Twin Vortex",cycloneCount:2,cycloneTime:2.35,cycloneRange:94,cycloneDamage:7,cycloneForce:18,cycloneFinal:34,visualScale:1.22,tierNote:"2 counter-moving vortices + 34 convergence burst"}}},
  rocketcarousel:{id:"rocketcarousel",name:"Rocket Carousel",icon:"✣",category:"Rotary Barrage",damage:12,radius:18,color:"#ff9270",carouselPods:6,carouselShots:6,carouselDamage:12,carouselRadius:62,carouselTime:1.65,description:"A rotary launcher assembles above the marker and fires rockets one-by-one from changing angles.",tierNote:"6 pods · 6 rotating rockets ×12",tierUpgrades:{2:{name:"Missile Wheel",carouselPods:8,carouselShots:9,carouselDamage:11,carouselRadius:72,carouselTime:1.9,visualScale:1.10,tierNote:"8 pods · 9 rockets"},3:{name:"War Carousel",carouselPods:10,carouselShots:12,carouselDamage:10,carouselRadius:82,carouselTime:2.1,carouselHeavy:2,visualScale:1.18,tierNote:"12 rockets + 2 heavy missiles"},4:{name:"Grand Wheel",carouselPods:14,carouselShots:14,carouselDamage:10,carouselRadius:94,carouselTime:2.35,carouselHeavy:4,carouselFinal:42,visualScale:1.30,tierNote:"14 rockets + 4 heavies + 42 hub detonation"}}},
  kaleidoscope:{id:"kaleidoscope",name:"Bankshot Prism",icon:"◇",category:"Reflector Beam",damage:34,radius:0,color:"#8ff4e6",mirrorCount:2,beamDamage:34,prismSpan:105,description:"The marker places reflector nodes. A beam is routed from the shooter through them into the target zone, turning placement into geometry.",tierNote:"2 reflectors · 1 routed beam ×34",tierUpgrades:{2:{name:"Double Bank",mirrorCount:3,beamDamage:30,prismSpan:125,visualScale:1.12,tierNote:"3-reflector double-bank route"},3:{name:"Trick Geometry",mirrorCount:4,beamDamage:28,prismSpan:145,prismReturn:true,visualScale:1.20,tierNote:"4-reflector route + return beam"},4:{name:"Kaleidoscope",mirrorCount:5,beamDamage:25,prismSpan:165,prismReturn:true,prismDual:true,prismFinal:32,visualScale:1.30,tierNote:"5-point star · twin counter-routing beams + 32 focus pulse"}}},
  proximitymine:{id:"proximitymine",name:"Proximity Mine",icon:"⊙",category:"Persistent Trap",damage:38,radius:42,color:"#ff7b8d",mineCount:1,mineTurns:4,mineSensor:62,mineDamage:38,description:"Plants a persistent sensor mine that survives into later turns and detonates only when an enemy enters its trigger radius.",tierNote:"1 mine · 4-turn life · 62px sensor · 38 damage",tierUpgrades:{2:{name:"Sensor Net",mineCount:2,mineTurns:5,mineSensor:68,mineDamage:34,visualScale:1.10,tierNote:"2 persistent mines · larger sensors"},3:{name:"Hunter Grid",mineCount:3,mineTurns:6,mineSensor:76,mineDamage:30,mineFinal:14,visualScale:1.18,tierNote:"3 mines · 76px sensors · 30 each + trigger shock"}}},
  cryogel:{id:"cryogel",name:"Cryo Gel",icon:"❄",category:"Persistent Terrain",damage:8,radius:0,color:"#83e9ff",iceSpan:110,iceTurns:3,iceGrip:.72,iceFuel:1.22,iceDamage:8,description:"Freezes a strip of terrain for several turns. Tanks crossing the patch lose effective grip and spend extra fuel.",tierNote:"110px ice · 3 turns · mild slip + 8 frost",tierUpgrades:{2:{name:"Ice Sheet",iceSpan:150,iceTurns:4,iceGrip:.62,iceFuel:1.35,iceDamage:11,visualScale:1.12,tierNote:"150px · 4 turns · stronger mobility penalty"},3:{name:"Permafrost",iceSpan:190,iceTurns:5,iceGrip:.52,iceFuel:1.50,iceDamage:14,iceShards:6,visualScale:1.22,tierNote:"190px · 5 turns · severe slip + frost shards"}}},
  magnetron:{id:"magnetron",name:"Magnetron",icon:"⊕",category:"Force Field",damage:12,radius:0,color:"#f38cff",magnetPulses:3,magnetRange:122,magnetForce:34,magnetDamage:12,magnetPoles:1,description:"Alternating magnetic pulses pull and push tanks around the marker, changing future firing geometry while dealing light damage.",tierNote:"3 alternating pulses · 122px · 12 each",tierUpgrades:{2:{name:"Flux Engine",magnetPulses:4,magnetRange:150,magnetForce:40,magnetDamage:11,magnetPoles:2,visualScale:1.12,tierNote:"2-pole field · 4 stronger displacement pulses"},3:{name:"Tri-Polar Reactor",magnetPulses:6,magnetRange:178,magnetForce:45,magnetDamage:10,magnetPoles:3,magnetFinal:28,visualScale:1.22,tierNote:"3 poles · 6 pulses + 28 reactor discharge"}}},
  emp:{id:"emp",name:"EMP Spike",icon:"ϟ",category:"Debuff",damage:16,radius:36,color:"#74dfff",empDamage:16,empOvercharge:.35,empFuel:.25,description:"A tactical electromagnetic pulse strips Overcharge and reserves part of the victim's next-turn fuel instead of relying on raw damage.",tierNote:"16 damage · -35% Overcharge · -25% next-turn fuel",tierUpgrades:{2:{name:"Blackout",empDamage:20,empOvercharge:.60,empFuel:.45,radius:46,visualScale:1.14,tierNote:"20 damage · -60% Overcharge · -45% next fuel"},3:{name:"System Crash",empDamage:24,empOvercharge:1,empFuel:.70,empArmor:22,radius:58,visualScale:1.24,tierNote:"24 damage · wipes Overcharge · -70% next fuel · strips up to 22 armor"}}},
  leech:{id:"leech",name:"Leech Dart",icon:"↝",category:"Drain",damage:14,radius:20,color:"#ff6f98",leechPulses:2,leechDamage:14,leechHeal:.45,leechRange:130,leechTargets:1,description:"Impact establishes a drain tether. Damage pulses siphon a share of the actual damage dealt back into the shooter.",tierNote:"2 drain pulses ×14 · heals 45% dealt",tierUpgrades:{2:{name:"Bloodline",leechPulses:3,leechDamage:14,leechHeal:.50,leechRange:155,visualScale:1.12,tierNote:"3 pulses · heals 50%"},3:{name:"Vampiric Chain",leechPulses:3,leechDamage:12,leechHeal:.55,leechRange:185,leechTargets:2,visualScale:1.20,tierNote:"chains 2 targets · 3 pulses ×12"},4:{name:"Soul Reactor",leechPulses:3,leechDamage:12,leechHeal:.60,leechRange:220,leechTargets:3,leechArmor:true,leechFinal:28,visualScale:1.30,tierNote:"up to 3 targets · excess healing becomes armor + 28 soul collapse"}}},
  tetris:{id:"tetris",name:"Block Drop",icon:"▦",category:"Constructive Terrain",damage:18,radius:18,color:"#8fdaff",blockCount:3,blockDamage:19,blockRaise:18,blockSpan:92,blockBombs:0,blockClear:0,blockImpact:16,description:"Tetromino-like blocks fall into the marked lane, hurt tanks they land on and remain as constructed terrain.",tierNote:"3 blocks ×19 + 16 landing shock · builds terrain",tierUpgrades:{2:{name:"Stack Attack",blockCount:5,blockDamage:18,blockRaise:20,blockSpan:118,blockBombs:1,blockClear:30,blockImpact:18,visualScale:1.14,tierNote:"5 blocks ×18 + 18 landing shock · 1 explosive block + 30 line clear"},3:{name:"Perfect Clear",blockCount:7,blockDamage:15,blockRaise:22,blockSpan:150,blockBombs:2,blockClear:42,visualScale:1.22,tierNote:"7 shapes ×15 · 2 explosive blocks + 42 perfect-clear beam"},4:{name:"Tetromino Reactor",blockCount:9,blockDamage:15,blockRaise:24,blockSpan:184,blockBombs:3,blockClear:50,blockReactor:40,visualScale:1.34,tierNote:"9-block double-wave · 3 bombs + 50 clear + 40 reactor scan"}}},
  eclipse:{id:"eclipse",name:"Eclipse",icon:"◒",category:"Shadow Sweep",damage:16,radius:0,color:"#778dff",eclipseMoons:1,eclipsePasses:1,eclipseDamage:16,eclipseWidth:34,eclipseTime:1.8,description:"A dark artificial moon crosses the sky while its narrow shadow races across the terrain, damaging tanks under the moving column.",tierNote:"1 moon · 1 shadow pass ×16",tierUpgrades:{2:{name:"Totality",eclipseMoons:1,eclipsePasses:2,eclipseDamage:15,eclipseWidth:42,eclipseTime:2.1,visualScale:1.12,tierNote:"2 shadow passes · wider totality"},3:{name:"Binary Eclipse",eclipseMoons:2,eclipsePasses:2,eclipseDamage:13,eclipseWidth:44,eclipseTime:2.35,eclipseFinal:26,visualScale:1.20,tierNote:"2 counter-moving moons · 2 passes + 26 convergence"},4:{name:"Black Sun",eclipseMoons:2,eclipsePasses:3,eclipseDamage:13,eclipseWidth:58,eclipseTime:2.75,eclipseFinal:46,visualScale:1.32,tierNote:"2 moons · 3 broad shadow sweeps + 46 corona finale"}}}
});


// V14 Clarity & Weapon Reworks — tuning driven by hands-on testing.
Object.assign(WEAPONS.pendulum,{pendulumHitRadius:24,description:"Impact erects an overhead anchor and swings a heavy energy weight through tank height at the marked zone. The orb can connect on several passes before the rig collapses."});
Object.assign(WEAPONS.teslagate,{gateBeamHeight:12,description:"The shell plants energized pylons around the impact. Their low connecting arc runs through tank height and flashes repeatedly instead of floating above the target."});
Object.assign(WEAPONS.domino,{dominoCount:6,dominoSpacing:22,dominoDamage:15,dominoDelay:.12,tierNote:"6 tightly packed toppling charges ×15",tierUpgrades:{2:{name:"Domino Run",dominoCount:8,dominoSpacing:20,dominoDamage:14,dominoDelay:.10,visualScale:1.10,tierNote:"8 focused charges ×14 · faster fall"},3:{name:"Double Six",dominoCount:10,dominoSpacing:18,dominoDamage:12,dominoDelay:.085,dominoReturn:true,dominoFinal:30,visualScale:1.20,tierNote:"10-charge forward cascade + reverse chain + 30 center finale"}}});
Object.assign(WEAPONS.pinball,{pinNodes:4,pinHops:7,pinDamage:18,pinSpan:82,pinTargetEvery:2,tierUpgrades:{2:{name:"Multiball Rig",pinNodes:5,pinHops:10,pinDamage:16,pinSpan:98,pinTargetEvery:2,visualScale:1.12,tierNote:"5 bumpers · 10 hops · target-gate every second hop ×16"},3:{name:"Tilt Machine",pinNodes:6,pinHops:13,pinDamage:14,pinSpan:116,pinTargetEvery:2,pinFinal:34,visualScale:1.22,tierNote:"6 bumpers · 13 hops · repeated target gates + 34 jackpot"}}});
Object.assign(WEAPONS.lighthouse,{beaconBeamWidth:15,beaconBeams:1,beaconTurns:1.15,beaconDamage:19,beaconRange:430,beaconTime:1.85,tierUpgrades:{2:{name:"Twin Beacon",beaconBeams:2,beaconTurns:1.35,beaconDamage:17,beaconRange:455,beaconTime:2.05,beaconBeamWidth:16,beaconCounter:true,visualScale:1.12,tierNote:"2 counter-rotating searchlights ×17"},3:{name:"Lightstorm",beaconBeams:3,beaconTurns:1.60,beaconDamage:15,beaconRange:480,beaconTime:2.35,beaconBeamWidth:18,beaconFocus:2,beaconFinal:32,visualScale:1.22,tierNote:"3 beams + 2 focus flashes + 32 lightstorm finale"},4:{name:"Solar Observatory",beaconBeams:4,beaconTurns:1.85,beaconDamage:14,beaconRange:520,beaconTime:2.65,beaconBeamWidth:20,beaconFocus:4,beaconFinal:48,beaconSolar:true,visualScale:1.34,tierNote:"4 lens beams · 4 target focus flashes + 48 solar-column finale"}}});
Object.assign(WEAPONS.phantomcopy,{phantomPhaseRange:72,phantomLocalSpan:165,tierUpgrades:{2:{name:"Cross Phantoms",phantomShots:2,phantomDamage:35,phantomDelay:.32,phantomLocalSpan:190,phantomPhaseRange:78,visualScale:1.12,tierNote:"2 locally spawned phase shells ×35"},3:{name:"Tri-Specter",phantomShots:3,phantomDamage:30,phantomDelay:.28,phantomTop:true,phantomLocalSpan:215,phantomPhaseRange:84,phantomFinal:24,visualScale:1.20,tierNote:"2 side specters + overhead specter ×30 · terrain-phasing approach + 24 rift snap"}}});
Object.assign(WEAPONS.meteorsling,{tierUpgrades:{2:{name:"Double Sling",slingShots:4,slingSpan:112,slingDamage:16,slingSpeed:185,visualScale:1.12,tierNote:"4 crossed rocks from both ground launchers ×16"},3:{name:"Meteor Catapult",slingShots:5,slingSpan:132,slingDamage:15,slingSpeed:195,slingHeavy:30,visualScale:1.22,tierNote:"5 crossing rocks ×15 + 30 heavy center stone"},4:{name:"Siege Orbit",slingShots:6,slingSpan:154,slingDamage:14,slingSpeed:205,slingHeavy:36,slingConverge:44,visualScale:1.34,tierNote:"6 crossfire rocks + 36 heavy stone + 44 twin-sling collision burst"}}});
Object.assign(WEAPONS.razorhalo,{haloDamage:7,tierUpgrades:{2:{name:"Saw Halo",damage:6.3,haloBlades:12,haloStart:126,haloTime:1.55,haloTurns:1.35,haloDamage:6.3,haloFinal:14,visualScale:1.12,tierNote:"12 contracting saws · ~70% former damage + light center finish"},3:{name:"Razor Vortex",damage:5.6,haloBlades:16,haloStart:142,haloTime:1.85,haloTurns:1.75,haloDamage:5.6,haloFinal:21,visualScale:1.22,tierNote:"16 faster contracting blades · reduced tick damage + 21 vortex finish"}}});
Object.assign(WEAPONS.guillotine,{bladePattern:"single",tierUpgrades:{2:{name:"Twin Guillotine",bladeLength:146,bladeDamage:35,bladeDrops:2,bladeDelay:.24,bladePattern:"scissor",visualScale:1.15,tierNote:"2 diagonal scissor blades ×35"},3:{name:"Execution Grid",bladeLength:188,bladeDamage:27,bladeDrops:2,bladeDelay:.20,bladePattern:"grid",bladeSweep:30,visualScale:1.24,tierNote:"2 descending blades ×27 + 30 horizontal execution sweep"},4:{name:"Final Verdict",bladeLength:218,bladeDamage:23,bladeDrops:4,bladeDelay:.14,bladePattern:"verdict",bladeSweep:38,bladeFinal:48,visualScale:1.36,tierNote:"4 converging verdict blades ×23 + 38 sweep + 48 central judgment"}}});
Object.assign(WEAPONS.yoyo,{yoyoSelfScale:.5,tierUpgrades:{2:{name:"Double Yo-Yo",yoyoPasses:3,yoyoDamage:16,yoyoTime:1.55,yoyoSelfScale:.5,visualScale:1.12,tierNote:"3 traversals ×16 · self hits only 50%"},3:{name:"Hyper Yo-Yo",yoyoPasses:4,yoyoDamage:14,yoyoTime:1.80,yoyoFinal:28,yoyoSelfScale:.5,visualScale:1.20,tierNote:"4 traversals ×14 + 28 anchor snap · self hits 50%"}}});
Object.assign(WEAPONS.miniv,{damage:15,radius:30,vShots:7,vSpeed:150,vSpeedStep:15,vWidth:.010,description:"Ground impact launches an almost vertical bank of tightly offset projectiles. Different fixed launch speeds create the visible V by height while wind can still bend the columns.",tierNote:"7 near-vertical columns at staggered heights · 15 each",tierUpgrades:{2:{name:"Flying-V",damage:15,radius:30,vShots:11,vSpeed:158,vSpeedStep:14,vWidth:.012,visualScale:1.12,tierNote:"11 near-vertical columns · taller layered V · 15 each"}}});
Object.assign(WEAPONS.sandcastle,{tierUpgrades:{2:{name:"Fortified Castle",castleRaise:52,castleSpan:108,castleDrops:4,castleDropDamage:15,visualScale:1.15,tierNote:"Taller trap walls · 4 stones ×15"},3:{name:"Citadel",castleRaise:64,castleSpan:124,castleDrops:5,castleDropDamage:14,castleTower:true,visualScale:1.25,tierNote:"Citadel walls + center tower · 5 stones ×14"},4:{name:"Royal Fortress",castleRaise:72,castleSpan:146,castleDrops:6,castleDropDamage:14,castleTower:true,castleCannons:4,castleFinal:38,visualScale:1.36,tierNote:"High fortress · 6 stones + 4 turret cannon shots + 38 royal collapse"}}});

// Rework two existing families to match their classic behavior rather than the older Crater-Clash interpretations.
Object.assign(WEAPONS.quakecharge,{name:"Earthquake",icon:"≈",category:"Global Seismic",damage:10,radius:0,globalQuake:true,repairStrength:.16,repairDamage:10,noSelfHit:true,
  description:"Instantly damages every enemy and moderately equalizes the terrain toward the arena's original shape.",tierNote:"10 damage to every enemy + moderate terrain shift",
  tierUpgrades:{2:{name:"Mega-Quake",damage:15,repairDamage:15,repairStrength:.24,visualScale:1.24,tierNote:"15 damage to every enemy + stronger terrain shift"}}});
Object.assign(WEAPONS.sniper,{name:"Sniper",icon:"⌖",category:"Precision",damage:100,radius:3,color:"#f5fbff",sniperMin:40,sniperMax:100,noTerrainDamage:true,count:1,
  description:"Tiny-radius precision shell whose damage scales with horizontal distance from the shooter.",tierNote:"40–100 horizontal distance-scaled damage",
  tierUpgrades:{2:{name:"Sub-Sniper",sniperMin:48,sniperMax:120,damage:120,radius:3,terrainPierce:true,visualScale:1.10,tierNote:"48–120 distance damage · can travel through terrain"},3:{name:"Smart Snipe",damage:100,radius:3,smartTrackers:10,sniperMin:40,sniperMax:100,trackerAngleSpread:.075,trackerPowerSpread:16,visualScale:.88,tierNote:"10 harmless tracker shots; every tracker hit repeats that exact trajectory as a live sniper"}}});



// V15 Weapon-Aware Arsenal — 15 original families focused on distinct play patterns.
Object.assign(WEAPONS,{
  sonicboom:{id:"sonicboom",name:"Sonic Shell",icon:"»",category:"Sonic Trail",damage:28,radius:30,color:"#72e8ff",sonicInterval:.16,sonicWidth:30,sonicDamage:8,sonicMaxHits:2,
    description:"A supersonic shell hurts along its flight path: pressure bands peel off behind the projectile before the normal impact ever happens.",tierNote:"28 impact · live flight wake · up to 2 pressure hits ×8",
    tierUpgrades:{2:{name:"Shock Runner",damage:30,radius:32,sonicInterval:.13,sonicWidth:38,sonicDamage:9,sonicMaxHits:2,visualScale:1.10,tierNote:"denser 38px wake · 2 pressure hits ×9 + 30 impact"},3:{name:"Mach Cascade",damage:32,radius:34,sonicInterval:.11,sonicWidth:46,sonicDamage:9,sonicMaxHits:3,sonicEcho:true,visualScale:1.20,tierNote:"46px wake · 3 hits ×9 · mirrored echo bands + 32 impact"},4:{name:"Hypersonic Crown",damage:34,radius:38,sonicInterval:.09,sonicWidth:58,sonicDamage:10,sonicMaxHits:3,sonicEcho:true,sonicFinal:36,visualScale:1.32,tierNote:"58px triple wake · 3 hits ×10 · crown shock + 36 final break"}}},
  bulldozer:{id:"bulldozer",name:"Bulldozer",icon:"▰",category:"Terrain Vehicle",damage:18,radius:22,color:"#ffc25e",dozerPasses:1,dozerSpeed:92,dozerSpan:150,dozerDamage:18,dozerPush:22,dozerRaise:7,
    description:"Impact deploys a tracked plow that drives in the incoming direction, shoving tanks and physically piling a ridge of terrain ahead of its blade.",tierNote:"1 plow pass · 150px · pushes tanks · builds terrain",
    tierUpgrades:{2:{name:"Heavy Dozer",dozerPasses:1,dozerSpeed:108,dozerSpan:185,dozerDamage:24,dozerPush:30,dozerRaise:9,visualScale:1.12,tierNote:"185px heavy pass · stronger push + terrain pile"},3:{name:"Twin Dozer",dozerPasses:2,dozerSpeed:112,dozerSpan:205,dozerDamage:22,dozerPush:28,dozerRaise:8,dozerReturn:true,visualScale:1.21,tierNote:"forward plow + return counter-plow · 2 reshaping passes"},4:{name:"Siege Plow",dozerPasses:2,dozerSpeed:128,dozerSpan:245,dozerDamage:26,dozerPush:36,dozerRaise:11,dozerReturn:true,dozerFinal:38,visualScale:1.33,tierNote:"245px twin pass · massive shove/ridge + 38 siege ram"}}},
  plinko:{id:"plinko",name:"Plinko Drop",icon:"⋮",category:"Pegboard",damage:32,radius:24,color:"#ff84d6",plinkoBalls:1,plinkoRows:6,plinkoSpan:118,plinkoDamage:32,
    description:"The marker unfolds a vertical pegboard. Energy balls visibly ricochet down the board before dropping out through different lanes onto the terrain.",tierNote:"1 ball · 6-row board · 32 landing damage",
    tierUpgrades:{2:{name:"Double Drop",plinkoBalls:2,plinkoRows:7,plinkoSpan:138,plinkoDamage:27,visualScale:1.10,tierNote:"2 balls · wider 7-row board ×27"},3:{name:"Jackpot Board",plinkoBalls:3,plinkoRows:8,plinkoSpan:160,plinkoDamage:24,plinkoGold:38,visualScale:1.20,tierNote:"3 balls + golden jackpot ball · 8 rows"},4:{name:"Quantum Plinko",plinkoBalls:5,plinkoRows:9,plinkoSpan:190,plinkoDamage:20,plinkoGold:42,plinkoFinal:34,visualScale:1.31,tierNote:"5 quantum balls · 9 rows · gold hit + 34 jackpot sweep"}}},
  aegisdome:{id:"aegisdome",name:"Aegis Capsule",icon:"◠",category:"Projectile Shield",damage:0,radius:0,color:"#7fe8ff",aegisTurns:2,aegisRadius:76,aegisCharges:1,aegisReflect:0,
    description:"Plants a persistent energy dome. Hostile projectiles entering the protected volume are intercepted instead of reaching tanks inside.",tierNote:"76px dome · 2 turns · absorbs 1 hostile projectile",
    tierUpgrades:{2:{name:"Aegis Dome",aegisTurns:3,aegisRadius:88,aegisCharges:2,aegisReflect:0,visualScale:1.12,tierNote:"88px · 3 turns · 2 interceptions"},3:{name:"Reflector Dome",aegisTurns:3,aegisRadius:98,aegisCharges:3,aegisReflect:1,visualScale:1.20,tierNote:"98px · 3 charges · first projectile reflected"},4:{name:"Prism Bastion",aegisTurns:4,aegisRadius:112,aegisCharges:5,aegisReflect:2,aegisCollapse:24,visualScale:1.32,tierNote:"112px · 5 charges · 2 reflections + 24 collapse pulse"}}},
  gravitylasso:{id:"gravitylasso",name:"Gravity Lasso",icon:"@",category:"Orbital Displacement",damage:28,radius:22,color:"#c48cff",lassoRange:128,lassoTurns:1.0,lassoRadius:52,lassoDamage:28,lassoThrow:42,lassoTargets:1,
    description:"The marker catches a nearby enemy in a gravity loop, swings the tank around the impact point and throws it out of orbit before the slam.",tierNote:"1 target · 1 orbit · 28 slam + 42px throw",
    tierUpgrades:{2:{name:"Orbit Lasso",lassoRange:158,lassoTurns:1.5,lassoRadius:62,lassoDamage:36,lassoThrow:58,visualScale:1.13,tierNote:"1.5 orbits · wider loop · 36 slam + stronger throw"},3:{name:"Twin Slingshot",lassoRange:190,lassoTurns:1.35,lassoRadius:70,lassoDamage:40,lassoThrow:66,lassoTargets:2,lassoFinal:28,visualScale:1.24,tierNote:"up to 2 targets · opposite orbits · 40 slam + 28 gravity snap"}}},
  laserplow:{id:"laserplow",name:"Bore Beam",icon:"╱",category:"Angle Cutter",damage:40,radius:0,color:"#ff6c91",cutLength:130,cutWidth:11,cutDamage:40,cutDepth:.32,cutRays:1,
    description:"The incoming trajectory becomes the cutting angle. On impact a laser continues through the ground along that exact vector, carving terrain and hurting tanks on the cut line.",tierNote:"1 trajectory-aligned 130px cut · 40 damage",
    tierUpgrades:{2:{name:"Twin Bore",cutLength:160,cutWidth:12,cutDamage:36,cutDepth:.34,cutRays:2,cutParallel:18,visualScale:1.11,tierNote:"2 parallel 160px cuts ×36"},3:{name:"Cross Cutter",cutLength:190,cutWidth:13,cutDamage:40,cutDepth:.36,cutRays:2,cutCross:true,visualScale:1.21,tierNote:"incoming cut + perpendicular cross cut ×40"},4:{name:"Diamond Drill",cutLength:225,cutWidth:14,cutDamage:31,cutDepth:.40,cutRays:4,cutDiamond:true,cutFinal:42,visualScale:1.32,tierNote:"4-angle diamond excavation ×31 + 42 core fracture"}}},
  conveyor:{id:"conveyor",name:"Conveyor Pad",icon:"⇢",category:"Persistent Motion",damage:8,radius:0,color:"#72f2b0",beltTurns:3,beltSpan:105,beltSpeed:18,beltDamage:8,beltMode:"forward",
    description:"Creates a persistent moving ground belt. Tanks standing on the marked strip are carried sideways every turn, changing positions without spending their own fuel.",tierNote:"105px belt · 3 turns · 18px/s carry",
    tierUpgrades:{2:{name:"Turbo Belt",beltTurns:4,beltSpan:145,beltSpeed:27,beltDamage:10,beltMode:"forward",visualScale:1.12,tierNote:"145px · 4 turns · fast carry + light contact damage"},3:{name:"Split Conveyor",beltTurns:5,beltSpan:190,beltSpeed:25,beltDamage:9,beltMode:"split",beltCenterPulse:24,visualScale:1.23,tierNote:"190px split belt · both halves feed center · 24 center crush"}}},
  geostamp:{id:"geostamp",name:"Geo Stamp",icon:"⌑",category:"Pattern Terraform",damage:16,radius:0,color:"#85df8a",stampTeeth:3,stampSpan:105,stampRaise:22,stampCut:14,stampDamage:16,stampPresses:1,
    description:"A giant holographic die presses a deliberate terrain pattern into the battlefield: alternating raised teeth and cut grooves reshape the lane under the target.",tierNote:"3-tooth chevron stamp · 1 press · 16 footprint damage",
    tierUpgrades:{2:{name:"Crown Stamp",stampTeeth:5,stampSpan:140,stampRaise:26,stampCut:17,stampDamage:18,stampPresses:1,visualScale:1.12,tierNote:"5-tooth crown · wider/deeper terrain press"},3:{name:"Gear Stamp",stampTeeth:7,stampSpan:175,stampRaise:28,stampCut:19,stampDamage:18,stampPresses:2,visualScale:1.21,tierNote:"7 teeth · second offset press · 18 per footprint"},4:{name:"Fractal Press",stampTeeth:9,stampSpan:220,stampRaise:32,stampCut:22,stampDamage:17,stampPresses:2,stampFractal:true,stampFinal:36,visualScale:1.33,tierNote:"9-tooth double fractal press + 36 center seal"}}},
  newtoncradle:{id:"newtoncradle",name:"Newton Cradle",icon:"●●",category:"Impulse Transfer",damage:34,radius:20,color:"#d9efff",cradleBalls:5,cradleSpan:118,cradleTransfers:1,cradleDamage:34,
    description:"Impact assembles a hanging Newton cradle behind the marker. A visible impulse travels ball-to-ball and ejects the end weight through the marked target lane.",tierNote:"5 balls · 1 transfer · 34 end-weight strike",
    tierUpgrades:{2:{name:"Double Cradle",cradleBalls:7,cradleSpan:148,cradleTransfers:2,cradleDamage:34,cradleFinal:18,visualScale:1.13,tierNote:"7 balls · forward + return impulse ×34 + 18 resonance"},3:{name:"Newton Battery",cradleBalls:9,cradleSpan:182,cradleTransfers:3,cradleDamage:26,cradleFinal:34,visualScale:1.24,tierNote:"9 balls · 3 alternating impulse transfers + 34 resonance discharge"}}},
  adaptiveshell:{id:"adaptiveshell",name:"Adaptive Shell",icon:"◈",category:"Context Weapon",damage:38,radius:34,color:"#ffe477",adaptiveLevel:1,adaptiveDamage:38,
    description:"The shell reads its impact. Direct tank hits become a piercing burst; near misses deploy a seeker correction; empty terrain becomes a breach strike instead of wasting the shot.",tierNote:"chooses 1 context response · 38 damage class",
    tierUpgrades:{2:{name:"Smart Shell",adaptiveLevel:2,adaptiveDamage:42,radius:36,adaptiveSeekers:2,visualScale:1.11,tierNote:"stronger direct/breach response · 2 seeker corrections on near miss"},3:{name:"Tactical Morph",adaptiveLevel:3,adaptiveDamage:44,radius:38,adaptiveSeekers:3,adaptiveDouble:true,visualScale:1.21,tierNote:"executes the best response + secondary morph"},4:{name:"Omni Shell",adaptiveLevel:4,adaptiveDamage:46,radius:42,adaptiveSeekers:4,adaptiveDouble:true,adaptiveFinal:30,visualScale:1.32,tierNote:"dual context response · 4 seekers when needed + 30 omni pulse"}}},
  helix:{id:"helix",name:"Helix Seed",icon:"≀",category:"Helix Rise",damage:16,radius:20,color:"#65f0d2",helixStrands:2,helixHeight:120,helixTurns:1.6,helixDrops:4,helixDamage:16,
    description:"Impact grows intertwined energy strands upward around a shared axis. At full height the strands unzip into falling live bolts over the same compact lane.",tierNote:"2-strand rise · 4 falling bolts ×16",
    tierUpgrades:{2:{name:"Double Helix",helixStrands:2,helixHeight:155,helixTurns:2.2,helixDrops:7,helixDamage:15,visualScale:1.13,tierNote:"taller 2.2-turn helix · 7 bolts ×15"},3:{name:"Triple Helix",helixStrands:3,helixHeight:190,helixTurns:2.8,helixDrops:10,helixDamage:14,helixFinal:32,visualScale:1.24,tierNote:"3 intertwined strands · 10 bolts + 32 core unzip"}}},
  anchorchain:{id:"anchorchain",name:"Anchor Chain",icon:"⚓",category:"Movement Lock",damage:12,radius:20,color:"#8ca9c7",anchorRange:115,anchorTurns:2,anchorLeash:78,anchorDamage:12,anchorTargets:1,
    description:"The marker chains a nearby enemy to a ground anchor. For future turns that tank cannot drive beyond the visible leash radius until the chain expires.",tierNote:"1 target · 2 turns · 78px movement leash",
    tierUpgrades:{2:{name:"Heavy Anchor",anchorRange:150,anchorTurns:3,anchorLeash:62,anchorDamage:18,visualScale:1.13,tierNote:"3 turns · tighter 62px leash + 18 impact"},3:{name:"Twin Mooring",anchorRange:185,anchorTurns:3,anchorLeash:52,anchorDamage:16,anchorTargets:2,anchorBreak:24,visualScale:1.24,tierNote:"up to 2 chained targets · 52px leash + 24 break pulse"}}},
  landslide:{id:"landslide",name:"Landslide",icon:"▾",category:"Terrain Collapse",damage:10,radius:0,color:"#c99a6d",slideSpan:125,slidePulses:4,slideDamage:10,slideShift:12,
    description:"Destabilizes a strip of real terrain. Successive collapse pulses relax sharp slopes, carry tanks downhill and turn an existing ridge into a moving hazard.",tierNote:"125px collapse · 4 terrain-relax pulses · 10 crush damage",
    tierUpgrades:{2:{name:"Rockslide",slideSpan:165,slidePulses:5,slideDamage:12,slideShift:16,visualScale:1.12,tierNote:"165px · 5 stronger collapses · more downhill carry"},3:{name:"Mountain Collapse",slideSpan:220,slidePulses:7,slideDamage:12,slideShift:20,slideFinal:34,visualScale:1.24,tierNote:"220px · 7 collapses + 34 final rockfall"}}},
  bubblelift:{id:"bubblelift",name:"Bubble Lift",icon:"○",category:"Float Displacement",damage:20,radius:24,color:"#77ddff",bubbleRange:120,bubbleHeight:82,bubbleDrift:34,bubbleDamage:20,bubbleTargets:1,
    description:"A nearby enemy is sealed in a translucent bubble, floated above the terrain, drifted sideways, then popped so the tank drops onto a new position.",tierNote:"1 target · 82px lift · 34px drift · 20 pop",
    tierUpgrades:{2:{name:"Drift Bubble",bubbleRange:155,bubbleHeight:112,bubbleDrift:60,bubbleDamage:26,bubbleTargets:1,visualScale:1.13,tierNote:"higher lift · 60px drift · 26 pop"},3:{name:"Bubble Parade",bubbleRange:190,bubbleHeight:132,bubbleDrift:68,bubbleDamage:24,bubbleTargets:2,bubbleFinal:26,visualScale:1.24,tierNote:"up to 2 targets drift opposite ways + 26 shared burst"}}},
  bridgebuilder:{id:"bridgebuilder",name:"Bridge Builder",icon:"⌒",category:"Causeway Terraform",damage:6,radius:0,color:"#8fe0a7",bridgeSpan:150,bridgeLift:34,bridgeDamage:6,bridgeSupports:3,
    description:"Instead of digging, the marker constructs a smooth causeway toward the firing side, filling valleys and softening crater lips so tanks can cross terrain that was previously awkward.",tierNote:"150px causeway · 3 supports · light 6 construction impact",
    tierUpgrades:{2:{name:"Field Bridge",bridgeSpan:200,bridgeLift:42,bridgeDamage:8,bridgeSupports:4,visualScale:1.12,tierNote:"200px smoother bridge · 4 supports"},3:{name:"Siege Causeway",bridgeSpan:255,bridgeLift:52,bridgeDamage:10,bridgeSupports:5,bridgeRamp:true,visualScale:1.22,tierNote:"255px long ramped causeway · 5 supports"},4:{name:"Skyway",bridgeSpan:320,bridgeLift:62,bridgeDamage:12,bridgeSupports:7,bridgeRamp:true,bridgeFinal:22,visualScale:1.33,tierNote:"320px engineered skyway · 7 supports + 22 construction shock"}}}
});

export const WEAPON_TIER_CAPS={
  // Pulse Shell remains the infinite baseline. Signature families below can reach Tier IV.
  pulse:1,core:4,orbvolley:4,hyperbounce:4,clustergrenade:4,aquastream:4,
  prismsplit:4,breakerwave:4,rapidfire:4,skymarker:4,
  airstrike:4,counter3000:4,fleet:4,stickybomb:4,spider:4,
  breaker:4,batteringram:4,
  molecule:4,dicecore:4,sentryseed:4,billiards:4,rocketcarousel:4,kaleidoscope:4,leech:4,tetris:4,eclipse:4,
  sonicboom:4,bulldozer:4,plinko:4,aegisdome:4,laserplow:4,geostamp:4,adaptiveshell:4,bridgebuilder:4,
  launchpad:3,chessknight:3,cyclone:3,proximitymine:3,cryogel:3,magnetron:3,emp:3,
  gravitylasso:3,conveyor:3,newtoncradle:3,helix:3,anchorchain:3,landslide:3,bubblelift:3,
  waterballoon:3,quicksand:2,dualroller:2,imploder:2,pendulum:3,teslagate:3,satellite:3,wormhole:3,prismcage:3,domino:3,skyhook:3,sandcastle:4,compressor:3,pinball:3,lighthouse:4,repulsor:3,swapbomb:2,phantomcopy:3,meteorsling:4,razorhalo:3,crystalbloom:3,guillotine:4,yoyo:3,
  snake:3,flame:3,bolt:3,tadpoles:3,fireworks:3,bounder:3,uzi:3,carpetbomb:4,recruiter:3,kernelpop:4,
  digger:3,zipper:3,ringer:3,seagull:3,napalm:3,sniper:3,
  deadweight:2,bfg1000:2,spiker:2,pinata:2,miniv:2,sunburst:2,synclets:2,shrapnel:2,rampage:2,snowball:2,fighterjet:2,breakermadness:2,fury:2,
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
  duel:{label:"Duel",icon:"◈",accent:"#67e8ff",tanks:2,teams:false,description:"A clean artillery duel against one AI tank.",rule:"Eliminate the opposing tank. Compact, readable and ideal for learning trajectories."},
  ffa:{label:"Free For All",icon:"✦",accent:"#ff6f91",tanks:4,teams:false,description:"Every tank for itself in a living crater field.",rule:"Last tank standing wins. Spawn positions are randomized and weapon restocks keep the match moving."},
  teams:{label:"Teams",icon:"⬢",accent:"#71e598",tanks:4,teams:true,description:"Two coordinated sides fight for control of the terrain.",rule:"Allies cannot damage each other. Team matches use an even tank count and spawn both sides on opposite halves with randomized positions."},
  assassin:{label:"Assassin",icon:"⌖",accent:"#d18cff",tanks:4,teams:false,description:"Hunt only your assigned target while another player hunts you.",rule:"You can only damage your current target. The target ring never creates mutual pairs until only two tanks remain. A lethal explosion can immediately carry into your newly assigned target."},
  juggernaut:{label:"Juggernaut",icon:"♛",accent:"#ffb84f",tanks:4,teams:true,description:"One oversized arsenal against every other tank on the field.",rule:"The Juggernaut fights everyone. Its HP scales with the number of hunters and it begins with 1.5× the normal starting arsenal."},
  training:{label:"Training Range",icon:"⚙",accent:"#68dfff",tanks:5,teams:false,description:"Infinite arsenal, stationary dummies and no enemy turns.",rule:"Test every weapon tier with telemetry, persistent tracers and instant dummy restoration."}
};
export const ARENAS=[
  {id:"rolling",name:"Rolling Ridge",roughness:.42,hills:5,base:.67,wind:1.0,gravity:1.0,profile:"rolling",landform:1.00,smoothPasses:4,sky:["#10172c","#294c48"],terrain:["#62da73","#27664d","#173d35"],glow:"#77f29d"},
  {id:"canyon",name:"Neon Canyon",roughness:.60,hills:8,base:.73,wind:1.0,gravity:1.0,profile:"canyon",landform:1.08,smoothPasses:4,sky:["#19131d","#4b242f"],terrain:["#ff7d73","#a34d54","#512937"],glow:"#ff8b76"},
  {id:"moon",name:"Lunar Basin",roughness:.33,hills:4,base:.70,wind:1.0,gravity:1.0,profile:"basin",landform:.94,smoothPasses:5,sky:["#081229","#1d3768"],terrain:["#65dbff","#2b81b0","#174d73"],glow:"#78e9ff"},
  {id:"storm",name:"Ion Storm",roughness:.52,hills:7,base:.69,wind:1.0,gravity:1.0,profile:"storm",landform:1.02,smoothPasses:4,sky:["#0a1627","#25496a"],terrain:["#6ccfe2","#397a98","#234e70"],glow:"#8ee8ff"},
  {id:"flats",name:"Crater Flats",roughness:.18,hills:3,base:.72,wind:1.0,gravity:1.0,profile:"flats",landform:.78,smoothPasses:6,sky:["#262514","#615b20"],terrain:["#f0d94b","#b3962f","#665523"],glow:"#fff16c"},
  {id:"caldera",name:"Caldera Bowl",roughness:.30,hills:4,base:.66,wind:1.0,gravity:1.0,profile:"caldera",landform:1.15,smoothPasses:5,sky:["#24101d","#5c2737"],terrain:["#ff6a79","#b63f57","#652b43"],glow:"#ff8292"},
  {id:"twinpeaks",name:"Twin Peaks",roughness:.38,hills:4,base:.70,wind:1.0,gravity:1.0,profile:"twinpeaks",landform:1.20,smoothPasses:4,sky:["#0d1729","#294967"],terrain:["#64d3ea","#348aaa","#205a7d"],glow:"#79eaff"},
  {id:"dunes",name:"Dune Sea",roughness:.25,hills:3,base:.70,wind:1.0,gravity:1.0,profile:"dunes",landform:1.04,smoothPasses:6,sky:["#282219","#71542d"],terrain:["#f0bf55","#b67838","#684527"],glow:"#ffd36b"},
  {id:"shattered",name:"Shattered Ridge",roughness:.72,hills:10,base:.71,wind:1.0,gravity:1.0,profile:"shattered",landform:1.15,smoothPasses:3,sky:["#18101f","#4e325f"],terrain:["#9f78e8","#594594","#342d63"],glow:"#bd94ff"}
];
export const TANK_COLORS=["#5df58a","#ff5f67","#ffd45d","#9c7cff","#62d9e8","#ff9d59","#d37cff","#73e0a7"];

export const WEAPON_TIER_INFO={
  1:{label:"I",name:"Standard",damage:1,radius:1,visualScale:1},
  2:{label:"II",name:"Enhanced",damage:1.12,radius:1.06,visualScale:1.10},
  3:{label:"III",name:"Overclocked",damage:1.24,radius:1.12,visualScale:1.20},
  4:{label:"IV",name:"Apex",damage:1.36,radius:1.20,visualScale:1.36}
};

// Standard loot still strongly favors early tiers. Airdrops are the premium source of T3/T4 rolls.
export const STANDARD_TIER_WEIGHTS={1:.60,2:.25,3:.11,4:.04};
export const STANDARD_TIER_WEIGHTS_BY_QUALITY={
  1:{1:.60,2:.25,3:.11,4:.04},
  2:{1:.48,2:.30,3:.16,4:.06},
  3:{1:.35,2:.32,3:.22,4:.11},
  4:{1:.22,2:.28,3:.30,4:.20}
};
export const WEAPON_QUALITY_LABELS={1:"Standard",2:"Improved",3:"High",4:"Elite"};
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
  tracer:true,
  weaponQuality:1,
  terrainMobility:"standard",
  juggernautRole:"player"
};

export const MATCH_SETTING_OPTIONS={
  playerCount:[2,3,4,5,6,7,8],
  hp:[100,150,200,300],
  turnTime:[15,30,45,60],
  fuel:[70,100,140,9999],
  weaponCount:[8,12,16,20],
  wind:["off","low","normal","extreme"],
  skillObjects:["off","low","normal","high"],
  crates:["off","low","normal","high"],
  weaponQuality:[1,2,3,4],
  terrainMobility:["standard","improved","climber","allterrain"],
  juggernautRole:["player","bot"]
};
