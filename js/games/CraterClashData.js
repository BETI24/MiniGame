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
    tierUpgrades:{2:{name:"Rage",furyOrange:20,furyBlue:5,furyOrangeDamage:5,furyBlueDamage:10,furyHeight:210,visualScale:1.22,tierNote:"20 orange ×5 + 5 larger blue ×10 from a higher second core"}}}
});

// Rework two existing families to match their classic behavior rather than the older Crater-Clash interpretations.
Object.assign(WEAPONS.quakecharge,{name:"Earthquake",icon:"≈",category:"Global Seismic",damage:10,radius:0,globalQuake:true,repairStrength:.16,repairDamage:10,noSelfHit:true,
  description:"Instantly damages every enemy and moderately equalizes the terrain toward the arena's original shape.",tierNote:"10 damage to every enemy + moderate terrain shift",
  tierUpgrades:{2:{name:"Mega-Quake",damage:15,repairDamage:15,repairStrength:.24,visualScale:1.24,tierNote:"15 damage to every enemy + stronger terrain shift"}}});
Object.assign(WEAPONS.sniper,{name:"Sniper",icon:"⌖",category:"Precision",damage:100,radius:3,color:"#f5fbff",sniperMin:40,sniperMax:100,noTerrainDamage:true,count:1,
  description:"Tiny-radius precision shell whose damage scales with horizontal distance from the shooter.",tierNote:"40–100 horizontal distance-scaled damage",
  tierUpgrades:{2:{name:"Sub-Sniper",sniperMin:48,sniperMax:120,damage:120,radius:3,terrainPierce:true,visualScale:1.10,tierNote:"48–120 distance damage · can travel through terrain"},3:{name:"Smart Snipe",damage:100,radius:3,smartTrackers:10,sniperMin:40,sniperMax:100,trackerAngleSpread:.075,trackerPowerSpread:16,visualScale:.88,tierNote:"10 harmless tracker shots; every tracker hit repeats that exact trajectory as a live sniper"}}});

export const WEAPON_TIER_CAPS={
  // Pulse Shell remains the infinite baseline. Signature families below can reach Tier IV.
  pulse:1,core:4,orbvolley:4,hyperbounce:4,clustergrenade:4,aquastream:4,
  prismsplit:4,breakerwave:4,rapidfire:4,skymarker:4,
  airstrike:4,counter3000:4,fleet:4,stickybomb:4,spider:4,
  breaker:4,batteringram:4,
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
  teams:{label:"2v2 Teams",icon:"⬢",accent:"#71e598",tanks:4,teams:true,description:"Two coordinated sides fight for control of the terrain.",rule:"Allies cannot damage each other. Teams spawn on opposite halves with randomized positions."},
  assassin:{label:"Assassin",icon:"⌖",accent:"#d18cff",tanks:4,teams:false,description:"Hunt only your assigned target while another player hunts you.",rule:"You can only damage your current target. The target ring never creates mutual pairs until only two tanks remain. A lethal explosion can immediately carry into your newly assigned target."},
  juggernaut:{label:"Juggernaut",icon:"♛",accent:"#ffb84f",tanks:4,teams:true,description:"One oversized arsenal against every other tank on the field.",rule:"The Juggernaut fights everyone. Its HP scales with the number of hunters and it begins with 1.5× the normal starting arsenal."},
  training:{label:"Training Range",icon:"⚙",accent:"#68dfff",tanks:5,teams:false,description:"Infinite arsenal, stationary dummies and no enemy turns.",rule:"Test every weapon tier with telemetry, persistent tracers and instant dummy restoration."}
};
export const ARENAS=[
  {id:"rolling",name:"Rolling Ridge",roughness:.42,hills:5,base:.67,wind:1.0,profile:"rolling",landform:1.00,smoothPasses:4,sky:["#10172c","#294c48"],terrain:["#62da73","#27664d","#173d35"],glow:"#77f29d"},
  {id:"canyon",name:"Neon Canyon",roughness:.60,hills:8,base:.73,wind:1.15,profile:"canyon",landform:1.08,smoothPasses:4,sky:["#19131d","#4b242f"],terrain:["#ff7d73","#a34d54","#512937"],glow:"#ff8b76"},
  {id:"moon",name:"Low-G Basin",roughness:.33,hills:4,base:.70,wind:.75,gravity:.77,profile:"basin",landform:.94,smoothPasses:5,sky:["#081229","#1d3768"],terrain:["#65dbff","#2b81b0","#174d73"],glow:"#78e9ff"},
  {id:"storm",name:"Ion Storm",roughness:.52,hills:7,base:.69,wind:1.45,profile:"storm",landform:1.02,smoothPasses:4,sky:["#0a1627","#25496a"],terrain:["#6ccfe2","#397a98","#234e70"],glow:"#8ee8ff"},
  {id:"flats",name:"Crater Flats",roughness:.18,hills:3,base:.72,wind:.85,profile:"flats",landform:.78,smoothPasses:6,sky:["#262514","#615b20"],terrain:["#f0d94b","#b3962f","#665523"],glow:"#fff16c"},
  {id:"caldera",name:"Caldera Bowl",roughness:.30,hills:4,base:.66,wind:1.05,profile:"caldera",landform:1.15,smoothPasses:5,sky:["#24101d","#5c2737"],terrain:["#ff6a79","#b63f57","#652b43"],glow:"#ff8292"},
  {id:"twinpeaks",name:"Twin Peaks",roughness:.38,hills:4,base:.70,wind:1.10,profile:"twinpeaks",landform:1.20,smoothPasses:4,sky:["#0d1729","#294967"],terrain:["#64d3ea","#348aaa","#205a7d"],glow:"#79eaff"},
  {id:"dunes",name:"Dune Sea",roughness:.25,hills:3,base:.70,wind:1.30,profile:"dunes",landform:1.04,smoothPasses:6,sky:["#282219","#71542d"],terrain:["#f0bf55","#b67838","#684527"],glow:"#ffd36b"},
  {id:"shattered",name:"Shattered Ridge",roughness:.72,hills:10,base:.71,wind:1.20,profile:"shattered",landform:1.15,smoothPasses:3,sky:["#18101f","#4e325f"],terrain:["#9f78e8","#594594","#342d63"],glow:"#bd94ff"}
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
  playerCount:[2,4,6,8],
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
