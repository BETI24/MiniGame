// CraterClashWeaponFX.js
// Vector-only weapon art direction. No external assets are required.
// Profiles intentionally emphasize silhouette + trail + impact language so weapons can
// be recognized while moving, not just by their inventory card.

const SHAPE_BY_ID={
  pulse:"shell",core:"hex",tristar:"star",shardbloom:"seed",ricochet:"diamond",roller:"wheel",burrow:"drill",
  skymarker:"flare",meteorchoir:"meteor",prismsplit:"prism",raillance:"needle",groundwave:"wave",hunter:"dart",
  gravityseed:"gravity",rampart:"seed",sinker:"drill",starburst:"needle",emberrain:"flame",arcchain:"electric",
  moonfall:"moon",kernelpop:"kernel",deaddrop:"block",faultline:"rock",corkscrew:"spiral",droneswarm:"drone",
  sawblade:"saw",echobomb:"ring",mirror:"mirror",viper:"snake",pinpoint:"needle",megaflux:"core",
  scatterrise:"sprout",timeskip:"clock",orbvolley:"orb",hyperbounce:"diamond",clustergrenade:"grenade",
  aquastream:"drop",infernojet:"flame",backroller:"wheel",breakerwave:"breaker",twinkler:"spark",sniper:"needle",
  quakecharge:"rock",bulger:"seed",fountain:"drop",flower:"petal",horizon:"wave",jumper:"spring",acidrain:"acid",
  areastrike:"flare",hoverorb:"hover",boomerang:"boomerang",beehive:"hex",voidwell:"void",bumperbombs:"bumper",
  cactus:"spike",carpetbomb:"flare",gunship:"bullet",clover:"clover",discoball:"disco",ghostbomb:"ghost",
  guppies:"fish",palmburst:"seed",rapidfire:"bullet",asteroidbelt:"meteor",
  airstrike:"flare",snake:"snakehead",counter3000:"counter",deadweight:"weight",flame:"flame",bolt:"boltflare",
  tadpoles:"tadpole",fireworks:"rocket",fleet:"fleet",bounder:"bounder",uzi:"bullet",stickybomb:"sticky",
  spider:"spider",bfg1000:"bfg",recruiter:"recruitflare",
  digger:"diggerball",breaker:"breaker",zipper:"zipper",ringer:"ring",spiker:"spike",pinata:"pinata",
  miniv:"vshot",napalm:"flame",sunburst:"sun",synclets:"sync",seagull:"gull",shrapnel:"shrapnel",
  batteringram:"ram",rampage:"ragebolt",snowball:"snowball",fighterjet:"jet",breakermadness:"madbreaker",fury:"fury",
  dicecore:"die",sentryseed:"turretseed",billiards:"poolball",launchpad:"booster",chessknight:"knight",cyclone:"vortex",rocketcarousel:"rocketwheel",kaleidoscope:"prism",proximitymine:"mine",cryogel:"snow",magnetron:"magnet",emp:"electric",leech:"dart",tetris:"block",eclipse:"moon",
  waterballoon:"balloon",quicksand:"sand",dualroller:"dualroller",imploder:"imploder",
  pendulum:"weightorb",teslagate:"electric",satellite:"satellite",wormhole:"portalcore",prismcage:"prism",domino:"domino",skyhook:"hook",sandcastle:"castle",compressor:"compressor",pinball:"bumper",molecule:"molecule",lighthouse:"beacon",repulsor:"ring",swapbomb:"swap",phantomcopy:"ghost",meteorsling:"rock",razorhalo:"saw",crystalbloom:"crystal",guillotine:"blade",yoyo:"yoyo",
  sonicboom:"dart",bulldozer:"block",plinko:"poolball",aegisdome:"prism",gravitylasso:"hook",laserplow:"needle",conveyor:"block",geostamp:"block",newtoncradle:"weightorb",adaptiveshell:"hex",helix:"molecule",anchorchain:"hook",landslide:"rock",bubblelift:"balloon",bridgebuilder:"seed"
};

const TRAIL_BY_ID={
  aquastream:"droplets",infernojet:"embers",emberrain:"embers",acidrain:"acid",corkscrew:"helix",
  hunter:"smart",droneswarm:"smart",beehive:"smart",guppies:"smart",ghostbomb:"ghost",moonfall:"orbital",
  asteroidbelt:"smoke",meteorchoir:"smoke",megaflux:"plasma",gravityseed:"plasma",voidwell:"void",
  twinkler:"spark",starburst:"spark",discoball:"disco",sniper:"thin",pinpoint:"thin",raillance:"thin",
  burrow:"dust",sinker:"dust",quakecharge:"dust",clustergrenade:"fuse",rapidfire:"tracer",gunship:"tracer",
  airstrike:"flareSmoke",snake:"slime",counter3000:"tracer",deadweight:"smart",flame:"embers",bolt:"electricTrail",
  tadpoles:"slime",fireworks:"rainbowSpark",fleet:"formation",bounder:"smart",uzi:"tracer",stickybomb:"redSmoke",
  spider:"thread",bfg1000:"plasma",recruiter:"greenSmoke",
  digger:"orangePulse",breaker:"fracture",zipper:"electricTrail",ringer:"halo",spiker:"dust",pinata:"rainbowSpark",
  miniv:"neon",napalm:"embers",sunburst:"solar",synclets:"syncgreen",seagull:"wing",shrapnel:"metal",
  batteringram:"ramStreak",rampage:"rage",snowball:"snow",fighterjet:"jetSmoke",breakermadness:"pinkFracture",fury:"embers",
  dicecore:"neon",sentryseed:"greenSmoke",billiards:"spark",launchpad:"plasma",chessknight:"ghost",cyclone:"plasma",rocketcarousel:"smoke",kaleidoscope:"rainbowSpark",proximitymine:"redSmoke",cryogel:"snow",magnetron:"electricTrail",emp:"electricTrail",leech:"ghost",tetris:"neon",eclipse:"ghost",
  waterballoon:"droplets",quicksand:"dust",dualroller:"rainbowSpark",imploder:"plasma",pendulum:"neon",teslagate:"electricTrail",satellite:"orbital",wormhole:"void",prismcage:"neon",domino:"spark",skyhook:"thin",sandcastle:"dust",compressor:"neon",pinball:"rainbowSpark",molecule:"plasma",lighthouse:"thin",repulsor:"plasma",swapbomb:"void",phantomcopy:"ghost",meteorsling:"smoke",razorhalo:"metal",crystalbloom:"spark",guillotine:"metal",yoyo:"neon",
  sonicboom:"thin",bulldozer:"dust",plinko:"spark",aegisdome:"neon",gravitylasso:"plasma",laserplow:"thin",conveyor:"neon",geostamp:"dust",newtoncradle:"metal",adaptiveshell:"rainbowSpark",helix:"helix",anchorchain:"metal",landslide:"dust",bubblelift:"droplets",bridgebuilder:"greenSmoke"
};

const IMPACT_BY_CATEGORY={
  Heavy:"shock",Direct:"burst",Spread:"burst",Airburst:"star",Bounce:"ring",Ground:"ground",Tunneling:"dust",
  Strike:"marker",Straight:"beam",Smart:"spark",Field:"field",Terraform:"terrain",Fire:"fire",Electric:"electric",
  Orbital:"orbital",Chaos:"confetti",Delayed:"echo",Trick:"ring",Precision:"pin",Grenade:"grenade",Stream:"splash",
  "Impact Split":"star",Firework:"firework",Seismic:"ground",Radial:"radial",Burst:"tracer","Impact Effect":"sprout",
  "Terrain Beam":"ground",Flare:"marker",Crawler:"ground",Volley:"tracer","Smart Drop":"pin","Flame Spray":"fire",
  "Lightning Flare":"electric","Bouncy Swarm":"splash",Fireworks:"firework",Formation:"burst","Smart Bounce":"spark",
  "Straight Burst":"tracer",Sticky:"echo",Web:"radial","Distance Heavy":"shock","Crossfire Flare":"marker",
  Jumping:"ground","Ground Sweep":"electric",Ring:"ring","Terrain Spikes":"ground","Airburst Fire":"fire",
  Solar:"radial","Air Pause":"spark","Air Drop":"burst","Fragment Burst":"burst","Apex Drop":"shock",
  "Sine Barrage":"electric","Growing Bounce":"ring","Multistage Impact":"star","Impact Barrage":"fire","Global Seismic":"terrain",
  "Chaos Water":"splash","Underground Volley":"dust","Split Roller":"ground","Self Burst":"shock","Kinetic Field":"ring","Beam Trap":"electric","Orbit Dive":"orbital","Portal Split":"field","Beam Geometry":"beam","Chain Line":"ground","Displacement":"spark","Trap Terraform":"terrain","Closing Walls":"field","Kinetic Trick":"ring","Orbiting Projectile":"orbital","Rotating Beam":"beam","Shock Utility":"shock","Position Trick":"field","Cross-Dimension":"field","Ground Crossfire":"ground","Contracting Ring":"ring","Growth Shatter":"star","Falling Line":"beam","Tether Sweep":"ring",
  "Sonic Trail":"shock","Terrain Vehicle":"ground","Pegboard":"ring","Projectile Shield":"field","Orbital Displacement":"ring","Angle Cutter":"beam","Persistent Motion":"ground","Pattern Terraform":"terrain","Impulse Transfer":"ring","Context Weapon":"burst","Helix Rise":"star","Movement Lock":"ground","Terrain Collapse":"terrain","Float Displacement":"splash","Causeway Terraform":"terrain"
};

export function weaponVisual(def,tier=1){
  const t=Math.max(1,Math.min(4,tier||1));
  const tierScale=[0,1,1.11,1.23,1.42][t];
  return {
    shape:SHAPE_BY_ID[def.id]||"orb",
    trail:TRAIL_BY_ID[def.id]||("glow"),
    impact:IMPACT_BY_CATEGORY[def.category]||"burst",
    scale:(def.visualScale||tierScale),
    glow:10+t*3+(t===4?5:0),
    tier:t,
    color:def.color||"#fff",
    accent:t===4?"#fff3b0":t===3?"#e6c7ff":t===2?"#bcefff":"#ffffff",
    trailWidth:t===4?3.2:t===3?2.5:t===2?2:1.5,
    particles:t===4?7:t===3?5:t===2?3:2
  };
}

export function polygon(ctx,sides,r,rotation=0){
  ctx.beginPath();
  for(let i=0;i<sides;i++){
    const a=rotation+i/sides*Math.PI*2,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

export function tierRoman(tier){return ["","I","II","III","IV"][Math.max(1,Math.min(4,tier||1))];}
