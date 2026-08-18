// CraterClashWeaponFX.js
// Vector-only weapon art direction. No external assets are required.
// Profiles intentionally emphasize silhouette + trail + impact language so weapons can
// be recognized while moving, not just by their inventory card.

const SHAPE_BY_ID={
  pulse:"shell",core:"hex",tristar:"orb",shardbloom:"seed",ricochet:"diamond",roller:"wheel",burrow:"drill",
  skymarker:"flare",meteorchoir:"meteor",prismsplit:"prism",raillance:"needle",groundwave:"wave",hunter:"dart",
  gravityseed:"gravity",rampart:"seed",sinker:"drill",starburst:"star",emberrain:"flame",arcchain:"electric",
  moonfall:"moon",kernelpop:"kernel",deaddrop:"block",faultline:"rock",corkscrew:"spiral",droneswarm:"drone",
  sawblade:"saw",echobomb:"ring",mirror:"mirror",viper:"snake",pinpoint:"needle",megaflux:"core",
  scatterrise:"sprout",timeskip:"clock",orbvolley:"orb",hyperbounce:"diamond",clustergrenade:"grenade",
  aquastream:"drop",infernojet:"flame",backroller:"wheel",breakerwave:"breaker",twinkler:"spark",sniper:"needle",
  quakecharge:"rock",bulger:"seed",fountain:"drop",flower:"petal",horizon:"wave",jumper:"spring",acidrain:"acid",
  areastrike:"flare",hoverorb:"hover",boomerang:"boomerang",beehive:"hex",voidwell:"void",bumperbombs:"bumper",
  cactus:"spike",carpetbomb:"flare",gunship:"bullet",clover:"clover",discoball:"disco",ghostbomb:"ghost",
  guppies:"fish",palmburst:"leaf",rapidfire:"bullet",asteroidbelt:"meteor",
  airstrike:"flare",snake:"snakehead",counter3000:"counter",deadweight:"weight",flame:"flame",bolt:"boltflare",
  tadpoles:"tadpole",fireworks:"rocket",fleet:"fleet",bounder:"bounder",uzi:"bullet",stickybomb:"sticky",
  spider:"spider",bfg1000:"bfg",recruiter:"recruitflare"
};

const TRAIL_BY_ID={
  aquastream:"droplets",infernojet:"embers",emberrain:"embers",acidrain:"acid",corkscrew:"helix",
  hunter:"smart",droneswarm:"smart",beehive:"smart",guppies:"smart",ghostbomb:"ghost",moonfall:"orbital",
  asteroidbelt:"smoke",meteorchoir:"smoke",megaflux:"plasma",gravityseed:"plasma",voidwell:"void",
  twinkler:"spark",starburst:"spark",discoball:"disco",sniper:"thin",pinpoint:"thin",raillance:"thin",
  burrow:"dust",sinker:"dust",quakecharge:"dust",clustergrenade:"fuse",rapidfire:"tracer",gunship:"tracer",
  airstrike:"flareSmoke",snake:"slime",counter3000:"tracer",deadweight:"smart",flame:"embers",bolt:"electricTrail",
  tadpoles:"slime",fireworks:"rainbowSpark",fleet:"formation",bounder:"smart",uzi:"tracer",stickybomb:"redSmoke",
  spider:"thread",bfg1000:"plasma",recruiter:"greenSmoke"
};

const IMPACT_BY_CATEGORY={
  Heavy:"shock",Direct:"burst",Spread:"burst",Airburst:"star",Bounce:"ring",Ground:"ground",Tunneling:"dust",
  Strike:"marker",Straight:"beam",Smart:"spark",Field:"field",Terraform:"terrain",Fire:"fire",Electric:"electric",
  Orbital:"orbital",Chaos:"confetti",Delayed:"echo",Trick:"ring",Precision:"pin",Grenade:"grenade",Stream:"splash",
  "Impact Split":"star",Firework:"firework",Seismic:"ground",Radial:"radial",Burst:"tracer","Impact Effect":"sprout",
  "Terrain Beam":"ground",Flare:"marker",Crawler:"ground",Volley:"tracer","Smart Drop":"pin","Flame Spray":"fire",
  "Lightning Flare":"electric","Bouncy Swarm":"splash",Fireworks:"firework",Formation:"burst","Smart Bounce":"spark",
  "Straight Burst":"tracer",Sticky:"echo",Web:"radial","Distance Heavy":"shock","Crossfire Flare":"marker"
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
