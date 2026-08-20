import { CONFIG, PLAYER_COLORS, FOOD_COLORS, BOT_NAMES, TEAM_DEFS, AI_PROFILES, MODE_DEFS, BOSS_DEFS } from './CellArenaData.js';

export const rand=(a,b)=>a+Math.random()*(b-a);
export const rint=(a,b)=>Math.floor(rand(a,b+1));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const radius=m=>Math.sqrt(Math.max(1,m))*4.15;
export const norm=(x,y)=>{const l=Math.hypot(x,y);return l>.0001?{x:x/l,y:y/l,l}:{x:0,y:0,l:0}};
export const fmtTime=t=>`${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t))%60).padStart(2,'0')}`;
export const shade=(hex,p)=>{const v=parseInt(hex.replace('#',''),16),n=Math.round(2.55*p),r=clamp((v>>16)+n,0,255),g=clamp(((v>>8)&255)+n,0,255),b=clamp((v&255)+n,0,255);return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1)};

function weightedProfile(){
  const total=AI_PROFILES.reduce((s,p)=>s+p.weight,0);let roll=Math.random()*total;
  for(const p of AI_PROFILES){roll-=p.weight;if(roll<=0)return p;}return AI_PROFILES[1];
}

function newOwner(world,name,color,{isPlayer=false,team=null,isBoss=false,profile=null}={}){
  const p=profile||(!isPlayer&&!isBoss?weightedProfile():null);
  const x=rand(0,world.size),y=rand(0,world.size);
  return {
    id:world.nextId++,name,color,isPlayer,isBoss,team,alive:true,cells:[],totalMass:0,best:0,peakMass:0,
    respawnTimer:0,spawnShield:0,controlScore:0,bossDamage:0,kills:0,deaths:0,
    ai:p?{
      profileId:p.id,label:p.label,think:rand(p.think[0],p.think[1]),tx:x,ty:y,goalX:x,goalY:y,
      split:rand(.7,2.4),escapeSplit:rand(1.3,4),forageSplit:rand(2,6),virusFarm:rand(4,9),virusShot:rand(3,8),wander:rand(1,3),biasAngle:rand(0,Math.PI*2),mode:'wander'
    }:null,
  };
}

export function getProfile(owner){return AI_PROFILES.find(p=>p.id===owner?.ai?.profileId)||AI_PROFILES[1];}

export function cell(world,o,x,y,m,vx=0,vy=0,age=null,extra={}){
  const c={id:world.nextId++,ownerId:o.id,x,y,mass:m,r:radius(m),vx,vy,age:age??world.recombineDelay,alive:true,portalCooldown:0,...extra};
  o.cells.push(c);world.entities.push(c);return c;
}

export function pellet(world,x=null,y=null,{ttl=null,spawnerId=null,mass=1.15,golden=false,color=null}={}){
  return {id:world.nextId++,x:x??rand(14,world.size-14),y:y??rand(14,world.size-14),r:golden?rand(5.5,7.2):rand(3.8,5.7),mass,color:color||(golden?'#ffd95c':FOOD_COLORS[rint(0,FOOD_COLORS.length-1)]),ttl,spawnerId,golden};
}

function virus(world,opts={}){
  return {id:world.nextId++,x:opts.x??rand(80,world.size-80),y:opts.y??rand(80,world.size-80),r:radius(100)*.94,mass:100,fed:0,vx:opts.vx||0,vy:opts.vy||0,phase:rand(0,6.28),red:!!world.mode.rush};
}
function spawner(world){
  const base=radius(122);return {id:world.nextId++,x:rand(150,world.size-150),y:rand(150,world.size-150),r:base,life:CONFIG.spawner.lifetime,maxLife:CONFIG.spawner.lifetime,pelletTimer:rand(CONFIG.spawner.pelletIntervalMin,CONFIG.spawner.pelletIntervalMax),phase:rand(0,6.28)};
}
function mother(world){
  return {id:world.nextId++,x:rand(300,world.size-300),y:rand(300,world.size-300),r:radius(420)*.92,life:CONFIG.mother.lifetime,maxLife:CONFIG.mother.lifetime,pulse:rand(CONFIG.mother.pulseMin,CONFIG.mother.pulseMax),phase:rand(0,6.28)};
}
function bumper(world){
  return {id:world.nextId++,x:rand(240,world.size-240),y:rand(240,world.size-240),r:radius(145)*.82,life:CONFIG.bumper.lifetime,maxLife:CONFIG.bumper.lifetime,phase:rand(0,6.28)};
}
function cloud(world){
  return {id:world.nextId++,x:rand(300,world.size-300),y:rand(300,world.size-300),r:rand(190,280),life:CONFIG.cloud.lifetime,maxLife:CONFIG.cloud.lifetime,pelletTimer:.1,phase:rand(0,6.28)};
}
function portalPair(world){
  const a={id:world.nextId++,pair:null,x:rand(320,world.size-320),y:rand(320,world.size-320),r:radius(115)*.78,life:CONFIG.portal.lifetime,maxLife:CONFIG.portal.lifetime,phase:rand(0,6.28)};
  let b;for(let i=0;i<30;i++){b={id:world.nextId++,pair:a.id,x:rand(320,world.size-320),y:rand(320,world.size-320),r:a.r,life:a.life,maxLife:a.maxLife,phase:a.phase+Math.PI};if(Math.hypot(b.x-a.x,b.y-a.y)>world.size*.35)break}
  a.pair=b.id;return[a,b];
}
function comet(world){
  const side=rint(0,3);let x,y,ang;
  if(side===0){x=20;y=rand(100,world.size-100);ang=rand(-.35,.35)}
  else if(side===1){x=world.size-20;y=rand(100,world.size-100);ang=Math.PI+rand(-.35,.35)}
  else if(side===2){x=rand(100,world.size-100);y=20;ang=Math.PI/2+rand(-.35,.35)}
  else{x=rand(100,world.size-100);y=world.size-20;ang=-Math.PI/2+rand(-.35,.35)}
  return{id:world.nextId++,x,y,vx:Math.cos(ang)*340,vy:Math.sin(ang)*340,life:CONFIG.comet.lifetime,pelletTimer:0,phase:0};
}

export function createWorld(modeId='classic',{playerName='Player',playerColor=PLAYER_COLORS[0]}={}){
  const mode=MODE_DEFS[modeId]||MODE_DEFS.classic;
  const size=Math.round(CONFIG.worldSize*mode.worldScale);
  const world={
    mode,size,nextId:1,recombineDelay:CONFIG.recombineDelay*(mode.rush?.60:1),time:0,finished:false,finishReason:'',winner:null,
    entities:[],food:[],viruses:[],spawners:[],mothers:[],portals:[],bumpers:[],clouds:[],comets:[],ejected:[],bossFragments:[],
    owners:[],bots:[],player:null,
    envTimers:{spawner:rand(15,32),mother:rand(22,46),portal:rand(25,50),bumper:rand(18,35),cloud:rand(16,31),comet:rand(32,55)},
    safeZone:mode.battle?{x:size*.5,y:size*.5,r:size*.69,startR:size*.69,targetR:size*.12}:null,
    hotZones:[],hotZoneTimer:0,bossState:null,
    stats:{respawns:0,teamComebacks:0,bossesDefeated:0},
  };
  const playerTeam=mode.teams?0:null;
  world.player=newOwner(world,playerName,mode.teams?TEAM_DEFS[playerTeam].color:playerColor,{isPlayer:true,team:playerTeam});
  world.owners.push(world.player);spawnOwner(world,world.player,CONFIG.startMass);
  for(let i=0;i<mode.botCount;i++){
    const team=mode.teams?((i+1)%mode.teamCount):null;
    const color=mode.teams?TEAM_DEFS[team].color:PLAYER_COLORS[(i+2)%PLAYER_COLORS.length];
    const o=newOwner(world,BOT_NAMES[i%BOT_NAMES.length],color,{team});world.bots.push(o);world.owners.push(o);
    spawnOwner(world,o,Math.random()<.13?rand(44,78):rand(26,40));
  }
  if(mode.hotzones){spawnHotZones(world,true);}
  if(mode.boss){initBossMode(world);}
  maintain(world);recalcAll(world);return world;
}

export function ownerById(world,id){return world.owners.find(o=>o.id===id)||null;}
export function aliveOwners(world,{includeBoss=true}={}){return world.owners.filter(o=>o.alive&&o.cells.some(c=>c.alive)&&(includeBoss||!o.isBoss));}
export function center(o){let m=0,x=0,y=0;for(const c of o.cells)if(c.alive){m+=c.mass;x+=c.x*c.mass;y+=c.y*c.mass}return m?{x:x/m,y:y/m}:{x:0,y:0};}
export function largest(o){let best=null;for(const c of o.cells)if(c.alive&&(!best||c.mass>best.mass))best=c;return best;}

export function teamMasses(world){
  const out=TEAM_DEFS.map(()=>0);if(!world.mode.teams)return out;
  for(const o of aliveOwners(world,{includeBoss:false}))if(o.team!=null)out[o.team]+=o.totalMass;return out;
}
export function teamShares(world){
  const masses=teamMasses(world),total=masses.reduce((a,b)=>a+b,0)||1;return masses.map(m=>m/total);
}
function weakestTeam(world){
  const masses=teamMasses(world),counts=TEAM_DEFS.map(()=>0);for(const o of world.owners)if(!o.isBoss&&o.team!=null&&o.alive)counts[o.team]++;
  let best=0,score=Infinity;for(let i=0;i<world.mode.teamCount;i++){const s=masses[i]+counts[i]*CONFIG.startMass*1.5;if(s<score){score=s;best=i}}return best;
}
function teamComebackMass(world,team){
  if(!world.mode.teams)return 1;const shares=teamShares(world),share=shares[team]||0;
  return 1+clamp((.25-share)*2.6,0,.68);
}
function bountyMultiplier(world,eater,prey){
  if(!world.mode.teams||eater.team==null||prey.team==null)return 1;
  const shares=teamShares(world),a=shares[eater.team]||0,b=shares[prey.team]||0;
  if(a<.19&&b>.38)return 1.22;if(a<.22&&b>.34)return 1.12;return 1;
}

export function safeSpawn(world,owner=null){
  for(let n=0;n<140;n++){
    const p={x:rand(240,world.size-240),y:rand(240,world.size-240)};let bad=false;
    for(const c of world.entities){if(!c.alive||c.mass<55)continue;const other=ownerById(world,c.ownerId);if(owner&&other&&world.mode.teams&&other.team===owner.team)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r+250){bad=true;break}}
    if(world.safeZone&&world.safeZone.r<world.size*.5&&Math.hypot(p.x-world.safeZone.x,p.y-world.safeZone.y)>world.safeZone.r*.82)bad=true;
    if(!bad)return p;
  }
  return{x:rand(180,world.size-180),y:rand(180,world.size-180)};
}
export function spawnOwner(world,o,m=CONFIG.startMass){
  if(world.mode.teams&&!o.isPlayer&&!o.isBoss){
    const weak=weakestTeam(world),shares=teamShares(world);if(o.team==null||Math.random()<.72&&shares[o.team]>(shares[weak]||0)+.035)o.team=weak;
    o.color=TEAM_DEFS[o.team].color;
  }
  const p=safeSpawn(world,o);const mass=m*(world.mode.teams?teamComebackMass(world,o.team):1);
  o.cells=[];o.alive=true;o.respawnTimer=0;o.spawnShield=world.mode.teams?CONFIG.teamSpawnShield:CONFIG.spawnShield;
  cell(world,o,p.x,p.y,mass);recalcOwner(world,o);return o;
}

export function recalcOwner(world,o){
  const wasAlive=o.alive;o.cells=o.cells.filter(c=>c.alive);o.totalMass=o.cells.reduce((s,c)=>s+c.mass,0);o.best=Math.max(o.best,o.totalMass);o.peakMass=Math.max(o.peakMass,o.totalMass);
  if(!o.cells.length){o.alive=false;if(wasAlive)o.deaths++;if(!o.isPlayer&&!o.isBoss&&world.mode.respawn&&o.respawnTimer<=0)o.respawnTimer=rand(CONFIG.botRespawnMin,CONFIG.botRespawnMax);}
}
export function recalcAll(world){for(const o of world.owners)recalcOwner(world,o);}

export function maintain(world){
  const target=Math.round(CONFIG.foodTarget*(world.mode.rush?1.18:1)*world.mode.worldScale);
  while(world.food.length<target)world.food.push(pellet(world));
  if(world.mode.env.viruses){while(world.viruses.length<Math.round(CONFIG.virusTarget*world.mode.worldScale))world.viruses.push(virus(world));}
  else world.viruses.length=0;
}

export function speedFor(world,c){return CONFIG.baseSpeed/Math.pow(Math.max(1,c.mass/CONFIG.startMass),.23)*(world.mode.rush?1.06:1);}
export function moveOwner(world,o,tx,ty,dt){
  for(const c of o.cells){if(!c.alive)continue;c.age+=dt;c.portalCooldown=Math.max(0,c.portalCooldown-dt);const d=norm(tx-c.x,ty-c.y),slow=clamp(d.l/Math.max(70,c.r*2.1),.12,1),sp=speedFor(world,c)*slow;c.x+=d.x*sp*dt+c.vx*dt;c.y+=d.y*sp*dt+c.vy*dt;const drag=Math.pow(.945,dt*60);c.vx*=drag;c.vy*=drag;c.r=radius(c.mass);c.x=clamp(c.x,c.r,world.size-c.r);c.y=clamp(c.y,c.r,world.size-c.r);}
}
export function sameOwnerPhysics(world,o){
  const a=o.cells.filter(c=>c.alive);for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){
    const A=a[i],B=a[j],dx=B.x-A.x,dy=B.y-A.y,d=Math.max(.001,Math.hypot(dx,dy)),min=(A.r+B.r)*.92,merge=A.age>=world.recombineDelay&&B.age>=world.recombineDelay;
    if(merge&&d<Math.max(A.r,B.r)*.42){const keep=A.mass>=B.mass?A:B,eat=keep===A?B:A,total=keep.mass+eat.mass;keep.x=(keep.x*keep.mass+eat.x*eat.mass)/total;keep.y=(keep.y*keep.mass+eat.y*eat.mass)/total;keep.mass=total;keep.r=radius(total);keep.age=world.recombineDelay;eat.alive=false;}
    else if(!merge&&d<min){const ov=min-d,nx=dx/d,ny=dy/d,total=A.mass+B.mass;A.x-=nx*ov*(B.mass/total)*.55;A.y-=ny*ov*(B.mass/total)*.55;B.x+=nx*ov*(A.mass/total)*.55;B.y+=ny*ov*(A.mass/total)*.55;}
  }
}

export function splitOwner(world,o,tx,ty,maxCells=o.isPlayer?CONFIG.maxPlayerCells:CONFIG.maxBotCells,{single=false,boost=1}={}){
  const arr=o.cells.filter(c=>c.alive).sort((a,b)=>b.mass-a.mass);let slots=maxCells-arr.length,did=false;
  for(const c of arr){if(slots<=0||c.mass<CONFIG.splitMinMass)continue;const a=Math.atan2(ty-c.y,tx-c.x),m=c.mass*.5;c.mass=m;c.r=radius(m);c.age=0;cell(world,o,c.x+Math.cos(a)*c.r*.75,c.y+Math.sin(a)*c.r*.75,m,Math.cos(a)*CONFIG.splitVelocity*boost,Math.sin(a)*CONFIG.splitVelocity*boost,0);slots--;did=true;if(single)break;}
  return did;
}
export function ejectOwner(world,o,tx,ty){
  if(world.ejected.length>CONFIG.maxEjected)return false;const c=largest(o);if(!c||c.mass<CONFIG.ejectMinMass)return false;const a=Math.atan2(ty-c.y,tx-c.x);c.mass-=CONFIG.ejectCost;c.r=radius(c.mass);world.ejected.push({id:world.nextId++,ownerId:o.id,x:c.x+Math.cos(a)*(c.r+16),y:c.y+Math.sin(a)*(c.r+16),r:radius(CONFIG.ejectMass)*.72,mass:CONFIG.ejectMass,vx:Math.cos(a)*CONFIG.ejectVelocity,vy:Math.sin(a)*CONFIG.ejectVelocity,life:12});return true;
}

export function canOwnersEat(world,eater,prey){
  if(!eater||!prey||eater.id===prey.id)return false;if(prey.spawnShield>0)return false;
  if(world.mode.teams&&eater.team===prey.team)return false;
  if(world.mode.boss){if(eater.isBoss&&!prey.isBoss)return true;if(!eater.isBoss&&prey.isBoss)return false;if(!eater.isBoss&&!prey.isBoss)return false;}
  return true;
}

function eatFood(world,c){
  const o=ownerById(world,c.ownerId),teamShare=world.mode.teams&&o?.team!=null?teamShares(world)[o.team]:.25;
  for(let i=world.food.length-1;i>=0;i--){const p=world.food[i];if(Math.abs(p.x-c.x)>c.r+10||Math.abs(p.y-c.y)>c.r+10)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){let gain=p.mass;if(world.mode.teams&&teamShare<.20)gain*=1.18;c.mass+=gain;world.food.splice(i,1);if(o?.isPlayer)world.playerFood=(world.playerFood||0)+1;}}
  for(let i=world.ejected.length-1;i>=0;i--){const p=world.ejected[i];if(p.ownerId===c.ownerId&&p.life>10.5)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){c.mass+=p.mass;world.ejected.splice(i,1);}}
  for(let i=world.bossFragments.length-1;i>=0;i--){const p=world.bossFragments[i];if(Math.hypot(p.x-c.x,p.y-c.y)<c.r&&c.mass>=p.mass*.72){c.mass+=p.mass*.72;world.bossFragments.splice(i,1);if(world.bossState){const dmg=p.damage;c.ownerId&&o&&(o.bossDamage+=dmg);world.bossState.hp=Math.max(0,world.bossState.hp-dmg);}}}
}

function eatCells(world){
  const a=world.entities.filter(c=>c.alive).sort((x,y)=>y.mass-x.mass);
  for(let i=0;i<a.length;i++){
    const eater=a[i];if(!eater.alive)continue;const eo=ownerById(world,eater.ownerId);if(!eo)continue;
    for(let j=a.length-1;j>=0;j--){
      const prey=a[j];if(!prey.alive||prey.id===eater.id||prey.ownerId===eater.ownerId)continue;const po=ownerById(world,prey.ownerId);if(!canOwnersEat(world,eo,po)||eater.mass<prey.mass*CONFIG.eatRatio)continue;
      const d=Math.hypot(prey.x-eater.x,prey.y-eater.y),th=eater.r-prey.r*CONFIG.eatOverlap;if(d<Math.max(2,th)){
        prey.alive=false;const gain=prey.mass*bountyMultiplier(world,eo,po);eater.mass+=gain;eater.r=radius(eater.mass);eo.kills++;if(eo.isPlayer)world.playerCellsEaten=(world.playerCellsEaten||0)+1;
      }
    }
  }
}

function virusHit(world){
  for(const c of world.entities){
    if(!c.alive||c.mass<CONFIG.virusSplitMass)continue;const o=ownerById(world,c.ownerId);if(!o||o.isBoss)continue;
    for(let vi=world.viruses.length-1;vi>=0;vi--){const v=world.viruses[vi];if(Math.hypot(c.x-v.x,c.y-v.y)>=c.r+v.r*.30)continue;
      c.mass+=CONFIG.virusMassGain;c.r=radius(c.mass);const max=o.isPlayer?CONFIG.maxPlayerCells:CONFIG.maxBotCells,aliveCount=o.cells.filter(x=>x.alive).length,available=max-aliveCount+1;world.viruses.splice(vi,1);
      if(available>1){const pieces=Math.min(available,Math.max(4,Math.min(8,Math.floor(c.mass/45)))),total=c.mass,m=total/pieces;c.mass=m;c.r=radius(m);c.age=0;for(let k=1;k<pieces;k++){const an=k/pieces*Math.PI*2+rand(-.18,.18);cell(world,o,c.x+Math.cos(an)*c.r*.35,c.y+Math.sin(an)*c.r*.35,m,Math.cos(an)*rand(390,630),Math.sin(an)*rand(390,630),0);}}
      break;
    }
  }
}

function feedViruses(world){
  for(let ei=world.ejected.length-1;ei>=0;ei--){const e=world.ejected[ei];let hit=false;
    for(const v of world.viruses){if(Math.hypot(e.x-v.x,e.y-v.y)>v.r+e.r)continue;hit=true;
      const d=norm(e.vx,e.vy);if(world.mode.experimentalVirus){v.vx+=d.x*310;v.vy+=d.y*310;v.fed=Math.max(0,v.fed-.5);}
      else{v.fed++;if(v.fed>=CONFIG.virusFeedPieces){v.fed=0;world.viruses.push(virus(world,{x:clamp(v.x+d.x*v.r*1.7,50,world.size-50),y:clamp(v.y+d.y*v.r*1.7,50,world.size-50),vx:d.x*520,vy:d.y*520}));}}
      break;
    }
    if(hit)world.ejected.splice(ei,1);
  }
}

function updateEjected(world,dt){for(let i=world.ejected.length-1;i>=0;i--){const p=world.ejected[i];p.life-=dt;const drag=Math.pow(.92,dt*60);p.vx*=drag;p.vy*=drag;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,p.r,world.size-p.r);p.y=clamp(p.y,p.r,world.size-p.r);if(p.life<=0)world.ejected.splice(i,1);}}
function updateViruses(world,dt){for(const v of world.viruses){v.phase+=dt*1.7;v.x+=v.vx*dt;v.y+=v.vy*dt;const drag=Math.pow(.94,dt*60);v.vx*=drag;v.vy*=drag;v.x=clamp(v.x,v.r,world.size-v.r);v.y=clamp(v.y,v.r,world.size-v.r);}}

function spawnSpawnerPellets(world,s){const count=rint(CONFIG.spawner.pelletsMin,CONFIG.spawner.pelletsMax);for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),d=rand(s.r*1.35,s.r*3.25);world.food.push(pellet(world,clamp(s.x+Math.cos(a)*d,14,world.size-14),clamp(s.y+Math.sin(a)*d,14,world.size-14),{ttl:CONFIG.spawner.pelletLifetime,spawnerId:s.id}));}}
function updateSpawners(world,dt){
  if(!world.mode.env.spawners)return;world.envTimers.spawner-=dt;if(world.envTimers.spawner<=0){if(world.spawners.length<CONFIG.spawner.max&&Math.random()<CONFIG.spawner.chance){const s=spawner(world);world.spawners.push(s);spawnSpawnerPellets(world,s);}world.envTimers.spawner=rand(CONFIG.spawner.minDelay,CONFIG.spawner.maxDelay);}
  for(let i=world.spawners.length-1;i>=0;i--){const s=world.spawners[i];s.life-=dt;s.phase+=dt*2.1;s.pelletTimer-=dt;if(s.pelletTimer<=0){spawnSpawnerPellets(world,s);s.pelletTimer=rand(CONFIG.spawner.pelletIntervalMin,CONFIG.spawner.pelletIntervalMax);}if(s.life<=0)world.spawners.splice(i,1);}
}
function updateMothers(world,dt){
  if(!world.mode.env.mothers)return;world.envTimers.mother-=dt;if(world.envTimers.mother<=0){if(world.mothers.length<CONFIG.mother.max)world.mothers.push(mother(world));world.envTimers.mother=rand(CONFIG.mother.minDelay,CONFIG.mother.maxDelay);}
  for(let i=world.mothers.length-1;i>=0;i--){const m=world.mothers[i];m.life-=dt;m.phase+=dt*1.2;m.pulse-=dt;if(m.pulse<=0){m.pulse=rand(CONFIG.mother.pulseMin,CONFIG.mother.pulseMax);for(let k=0;k<rint(5,9);k++){const a=rand(0,6.28),d=rand(m.r*1.05,m.r*2.4);world.food.push(pellet(world,clamp(m.x+Math.cos(a)*d,15,world.size-15),clamp(m.y+Math.sin(a)*d,15,world.size-15),{mass:Math.random()<.12?2.4:1.2,golden:Math.random()<.12,ttl:40}));}}if(m.life<=0)world.mothers.splice(i,1);}
}
function updatePortals(world,dt){
  if(!world.mode.env.portals)return;world.envTimers.portal-=dt;if(world.envTimers.portal<=0){if(world.portals.length/2<CONFIG.portal.maxPairs)world.portals.push(...portalPair(world));world.envTimers.portal=rand(CONFIG.portal.minDelay,CONFIG.portal.maxDelay);}
  for(let i=world.portals.length-1;i>=0;i--){const p=world.portals[i];p.life-=dt;p.phase+=dt*1.6;if(p.life<=0)world.portals.splice(i,1);}
  for(const c of world.entities){if(!c.alive||c.portalCooldown>0||c.mass>650)continue;for(const p of world.portals){if(Math.hypot(c.x-p.x,c.y-p.y)>p.r*.65)continue;const q=world.portals.find(x=>x.id===p.pair);if(!q)continue;const a=rand(0,6.28);c.x=clamp(q.x+Math.cos(a)*q.r*.9,c.r,world.size-c.r);c.y=clamp(q.y+Math.sin(a)*q.r*.9,c.r,world.size-c.r);c.vx+=Math.cos(a)*180;c.vy+=Math.sin(a)*180;c.portalCooldown=2.2;break;}}
}
function updateBumpers(world,dt){
  if(!world.mode.env.bumpers)return;world.envTimers.bumper-=dt;if(world.envTimers.bumper<=0){if(world.bumpers.length<CONFIG.bumper.max)world.bumpers.push(bumper(world));world.envTimers.bumper=rand(CONFIG.bumper.minDelay,CONFIG.bumper.maxDelay);}
  for(let i=world.bumpers.length-1;i>=0;i--){const b=world.bumpers[i];b.life-=dt;b.phase+=dt*2.3;if(b.life<=0)world.bumpers.splice(i,1);}
  for(const c of world.entities){if(!c.alive)continue;for(const b of world.bumpers){const dx=c.x-b.x,dy=c.y-b.y,d=Math.max(.001,Math.hypot(dx,dy));if(d<c.r+b.r*.75){const push=460+Math.min(450,c.mass*.4);c.vx+=dx/d*push;c.vy+=dy/d*push;c.x+=dx/d*4;c.y+=dy/d*4;}}}
}
function updateClouds(world,dt){
  if(!world.mode.env.clouds)return;world.envTimers.cloud-=dt;if(world.envTimers.cloud<=0){if(world.clouds.length<CONFIG.cloud.max)world.clouds.push(cloud(world));world.envTimers.cloud=rand(CONFIG.cloud.minDelay,CONFIG.cloud.maxDelay);}
  for(let i=world.clouds.length-1;i>=0;i--){const c=world.clouds[i];c.life-=dt;c.phase+=dt;c.pelletTimer-=dt;if(c.pelletTimer<=0){c.pelletTimer=CONFIG.cloud.pelletInterval;const a=rand(0,6.28),d=Math.sqrt(Math.random())*c.r;world.food.push(pellet(world,c.x+Math.cos(a)*d,c.y+Math.sin(a)*d,{mass:2.25,golden:true,ttl:18}));}if(c.life<=0)world.clouds.splice(i,1);}
}
function updateComets(world,dt){
  if(!world.mode.env.comets)return;world.envTimers.comet-=dt;if(world.envTimers.comet<=0){if(!world.comets.length)world.comets.push(comet(world));world.envTimers.comet=rand(CONFIG.comet.minDelay,CONFIG.comet.maxDelay);}
  for(let i=world.comets.length-1;i>=0;i--){const c=world.comets[i];c.life-=dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.pelletTimer-=dt;c.phase+=dt*4;if(c.pelletTimer<=0){c.pelletTimer=CONFIG.comet.pelletInterval;world.food.push(pellet(world,clamp(c.x+rand(-18,18),14,world.size-14),clamp(c.y+rand(-18,18),14,world.size-14),{mass:2.8,golden:true,ttl:24}));}if(c.life<=0||c.x<0||c.y<0||c.x>world.size||c.y>world.size)world.comets.splice(i,1);}
}
function expireFood(world,dt){for(let i=world.food.length-1;i>=0;i--){const p=world.food[i];if(p.ttl==null)continue;p.ttl-=dt;if(p.ttl<=0)world.food.splice(i,1);}}

function applyMassDecay(world,dt){
  for(const o of aliveOwners(world)){if(o.isBoss)continue;for(const c of o.cells){if(!c.alive||c.mass<700)continue;const rate=c.mass>2600?.0022:c.mass>1400?.00135:.00065;c.mass=Math.max(CONFIG.startMass*.45,c.mass*(1-rate*dt));}}
}
function updateRespawns(world,dt){
  for(const o of world.bots){if(o.alive)continue;if(!world.mode.respawn)continue;o.respawnTimer-=dt;if(o.respawnTimer<=0){spawnOwner(world,o,rand(28,41));world.stats.respawns++;}}
}
function updateSpawnShields(world,dt){for(const o of world.owners)o.spawnShield=Math.max(0,(o.spawnShield||0)-dt);}

function updateBattle(world,dt){
  if(!world.mode.battle||world.finished)return;const z=world.safeZone,progress=clamp(world.time/world.mode.duration,0,1),ease=progress*progress*(3-2*progress);z.r=z.startR+(z.targetR-z.startR)*ease;
  if(progress>.22){const drift=dt*.017;z.x=clamp(z.x+(world.size*.52-z.x)*drift,world.size*.18,world.size*.82);z.y=clamp(z.y+(world.size*.47-z.y)*drift,world.size*.18,world.size*.82);}
  for(const o of aliveOwners(world,{includeBoss:false}))for(const c of o.cells){const d=Math.hypot(c.x-z.x,c.y-z.y);if(d>z.r-c.r*.2){c.mass-=Math.max(1.8,c.mass*.12)*dt;if(c.mass<12)c.alive=false;}}
  const alive=aliveOwners(world,{includeBoss:false});if(alive.length<=1&&world.time>12){world.finished=true;world.winner=alive[0]||null;world.finishReason=world.winner?`${world.winner.name} survived the shrinking arena.`:'Nobody survived.';}
}

function spawnHotZones(world,initial=false){
  world.hotZones=[];const count=2;for(let i=0;i<count;i++)world.hotZones.push({id:world.nextId++,x:rand(world.size*.18,world.size*.82),y:rand(world.size*.18,world.size*.82),r:rand(260,350),phase:rand(0,6.28)});world.hotZoneTimer=initial?52:58;
}
function updateHotZones(world,dt){
  if(!world.mode.hotzones)return;world.hotZoneTimer-=dt;if(world.hotZoneTimer<=0)spawnHotZones(world);
  for(const z of world.hotZones){z.phase+=dt;for(const o of aliveOwners(world,{includeBoss:false})){const c=center(o);if(Math.hypot(c.x-z.x,c.y-z.y)<z.r){o.controlScore+=dt*(1+Math.log10(1+o.totalMass)*.28);if(Math.random()<dt*4.0){const a=rand(0,6.28),d=Math.sqrt(Math.random())*z.r;world.food.push(pellet(world,z.x+Math.cos(a)*d,z.y+Math.sin(a)*d,{mass:2.2,golden:true,ttl:16}));}}}}
}

function initBossMode(world){world.bossState={stage:0,cycle:1,hp:0,maxHp:0,spawnTimer:1.5,fragmentTimer:0,pulseTimer:0,bossOwner:null,def:null};}
function spawnBoss(world){
  const bs=world.bossState,def=BOSS_DEFS[bs.stage%BOSS_DEFS.length],scale=1+(bs.cycle-1)*.34;const o=newOwner(world,def.name,def.color,{isBoss:true});world.owners.push(o);bs.bossOwner=o;bs.def=def;bs.hp=def.hp*scale;bs.maxHp=bs.hp;bs.fragmentTimer=2.5;bs.pulseTimer=def.pulseEvery;const p={x:world.size*.5,y:world.size*.5};cell(world,o,p.x,p.y,def.mass*scale,0,0,world.recombineDelay,{bossCore:true});recalcOwner(world,o);
}
function spawnBossFragments(world){
  const bs=world.bossState,o=bs.bossOwner;if(!o?.alive)return;const c=largest(o),def=bs.def,scale=1+(bs.cycle-1)*.22,n=rint(def.fragmentCount[0],def.fragmentCount[1]);
  for(let i=0;i<n;i++){const a=i/n*6.28+rand(-.18,.18),m=rand(def.fragments[0],def.fragments[1])*scale;world.bossFragments.push({id:world.nextId++,x:c.x+Math.cos(a)*c.r*1.15,y:c.y+Math.sin(a)*c.r*1.15,r:radius(m)*.58,mass:m,damage:m*.72,vx:Math.cos(a)*rand(90,210),vy:Math.sin(a)*rand(90,210),life:22,color:def.color});}
}
function updateBossFragments(world,dt){for(let i=world.bossFragments.length-1;i>=0;i--){const f=world.bossFragments[i];f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;const drag=Math.pow(.965,dt*60);f.vx*=drag;f.vy*=drag;f.x=clamp(f.x,f.r,world.size-f.r);f.y=clamp(f.y,f.r,world.size-f.r);if(f.life<=0)world.bossFragments.splice(i,1);}}
function bossPulse(world){const bs=world.bossState,o=bs.bossOwner,c=largest(o||{});if(!c)return;for(const x of world.entities){if(!x.alive||x.ownerId===o.id)continue;const dx=x.x-c.x,dy=x.y-c.y,d=Math.max(1,Math.hypot(dx,dy));if(d<c.r+520){const n=norm(dx,dy),f=bs.def.pulseForce*clamp(1-d/(c.r+520),.15,1);x.vx+=n.x*f;x.vy+=n.y*f;}}}
function updateBoss(world,dt){
  if(!world.mode.boss)return;const bs=world.bossState;updateBossFragments(world,dt);
  if(!bs.bossOwner||!bs.bossOwner.alive){bs.spawnTimer-=dt;if(bs.spawnTimer<=0)spawnBoss(world);return;}
  const o=bs.bossOwner,c=largest(o);if(!c)return;
  // Slow hunter-seeking motion.
  let target=null,td=Infinity;for(const h of aliveOwners(world,{includeBoss:false})){const hc=center(h),d=Math.hypot(hc.x-c.x,hc.y-c.y);if(d<td){td=d;target=hc;}}
  if(target){const d=norm(target.x-c.x,target.y-c.y),sp=CONFIG.baseSpeed*bs.def.speed/Math.pow(c.mass/CONFIG.startMass,.13);c.x+=d.x*sp*dt;c.y+=d.y*sp*dt;c.x=clamp(c.x,c.r,world.size-c.r);c.y=clamp(c.y,c.r,world.size-c.r);}
  bs.fragmentTimer-=dt;bs.pulseTimer-=dt;if(bs.fragmentTimer<=0){spawnBossFragments(world);bs.fragmentTimer=bs.def.fragmentEvery;}if(bs.pulseTimer<=0){bossPulse(world);bs.pulseTimer=bs.def.pulseEvery;}
  if(bs.hp<=0){for(const x of o.cells)x.alive=false;o.alive=false;world.stats.bossesDefeated++;bs.stage++;if(bs.stage>=BOSS_DEFS.length){bs.stage=0;bs.cycle++;}bs.spawnTimer=7;world.bossFragments.length=0;}
}

function updateTimed(world){
  if(!world.mode.timed||world.finished)return;const left=world.mode.duration-world.time;if(left<=0){world.finished=true;const list=ranking(world);world.winner=list[0]||null;world.finishReason=world.mode.hotzones?`${world.winner?.name||'Nobody'} won on Control points.`:`${world.winner?.name||'Nobody'} finished with the best peak mass.`;}
}

export function ranking(world){
  const all=world.owners.filter(o=>!o.isBoss);
  if(world.mode.hotzones)return all.slice().sort((a,b)=>b.controlScore-a.controlScore||b.totalMass-a.totalMass);
  if(world.mode.rush)return all.slice().sort((a,b)=>b.peakMass-a.peakMass||b.totalMass-a.totalMass);
  return all.filter(o=>o.alive).slice().sort((a,b)=>b.totalMass-a.totalMass);
}

export function updateWorld(world,dt){
  if(world.finished)return;world.time+=dt;updateSpawnShields(world,dt);updateEjected(world,dt);updateViruses(world,dt);feedViruses(world);
  updateSpawners(world,dt);updateMothers(world,dt);updatePortals(world,dt);updateBumpers(world,dt);updateClouds(world,dt);updateComets(world,dt);expireFood(world,dt);
  for(const c of world.entities)if(c.alive)eatFood(world,c);eatCells(world);virusHit(world);world.entities=world.entities.filter(c=>c.alive);recalcAll(world);
  applyMassDecay(world,dt);updateRespawns(world,dt);updateBattle(world,dt);updateHotZones(world,dt);updateBoss(world,dt);updateTimed(world);maintain(world);
}

export function getModeStatus(world){
  if(world.mode.teams){const masses=teamMasses(world),total=masses.reduce((a,b)=>a+b,0)||1;return {type:'teams',teams:masses.map((mass,i)=>({team:TEAM_DEFS[i],mass,share:mass/total}))};}
  if(world.mode.battle)return {type:'battle',alive:aliveOwners(world,{includeBoss:false}).length,zone:world.safeZone};
  if(world.mode.boss){const b=world.bossState;return {type:'boss',name:b?.def?.name||'Incoming Titan',hp:b?.hp||0,maxHp:b?.maxHp||1,cycle:b?.cycle||1,defeated:world.stats.bossesDefeated};}
  if(world.mode.hotzones)return {type:'hotzones',timer:Math.max(0,world.mode.duration-world.time)};
  if(world.mode.timed)return {type:'timer',timer:Math.max(0,world.mode.duration-world.time)};
  return {type:'classic',respawns:world.stats.respawns};
}

export function playerScore(world){
  const p=world.player;if(!p)return 0;if(world.mode.hotzones)return Math.round(p.controlScore*100+p.peakMass*15);if(world.mode.rush)return Math.round(p.peakMass*100+(world.playerCellsEaten||0)*500);if(world.mode.boss)return Math.round(p.bossDamage*100+p.peakMass*20);return Math.round(p.peakMass*100+(world.playerCellsEaten||0)*600+(world.playerFood||0)*3);
}
