import { CONFIG } from './CellArenaData.js';
import { clamp, rand, rint, norm, center, largest, aliveOwners, ownerById, canOwnersEat, moveOwner, sameOwnerPhysics, splitOwner, ejectOwner, getProfile } from './CellArenaEngine.js';

function threatVector(world,o,c,m,profile){
  let vx=0,vy=0,weight=0,closest=null,closestD=1e9;
  for(const q of aliveOwners(world)){
    if(q.id===o.id||!canOwnersEat(world,q,o))continue;
    for(const x of q.cells){
      if(!x.alive||x.mass<m*CONFIG.eatRatio)continue;
      const dx=c.x-x.x,dy=c.y-x.y,d=Math.max(1,Math.hypot(dx,dy));
      const range=profile.view+x.r;if(d>range)continue;
      const danger=clamp(1-d/range,0,1),massFactor=clamp(x.mass/m,1,4),w=danger*danger*massFactor;
      vx+=dx/d*w;vy+=dy/d*w;weight+=w;if(d<closestD){closestD=d;closest=x;}
    }
  }
  if(weight<=0)return null;const n=norm(vx,vy);return{dx:n.x,dy:n.y,weight,closest,d:closestD};
}

function bestPrey(world,o,c,m,profile){
  let best=null,score=-1e9;
  for(const q of aliveOwners(world)){
    if(q.id===o.id||!canOwnersEat(world,o,q))continue;
    for(const x of q.cells){
      if(!x.alive||m<x.mass*CONFIG.eatRatio*.94)continue;const d=Math.hypot(x.x-c.x,x.y-c.y);if(d>profile.prey)continue;
      const edible=m>=x.mass*CONFIG.eatRatio,ratio=m/x.mass,edge=Math.min(x.x,x.y,world.size-x.x,world.size-x.y),edgeBonus=1-edge/world.size;
      let s=x.mass*2.7-d*.10+edgeBonus*18;if(!edible)s-=90;if(ratio>2.2)s+=35;
      if(s>score){score=s;best={cell:x,owner:q,d,score:s,edible,ratio};}
    }
  }
  return best;
}

function bestFoodCluster(world,c,profile){
  if(!world.food.length)return null;let best=null,score=-1e9;const samples=Math.min(profile.foodSamples,world.food.length);
  for(let i=0;i<samples;i++){
    const p=world.food[rint(0,world.food.length-1)];if(!p)continue;const d=Math.hypot(p.x-c.x,p.y-c.y);if(d>950)continue;
    let local=0,mass=0;for(let j=0;j<22;j++){const q=world.food[rint(0,world.food.length-1)];if(q&&Math.hypot(q.x-p.x,q.y-p.y)<170){local++;mass+=q.mass;}}
    const s=local*12+mass*8-d*.04+(p.spawnerId?34:0)+(p.golden?28:0);if(s>score){score=s;best={x:p.x,y:p.y,score:s,local};}
  }
  return best;
}

function hazardAvoidance(world,c,big){
  let vx=0,vy=0,w=0;
  if(big.mass>=CONFIG.virusSplitMass){for(const v of world.viruses){const dx=c.x-v.x,dy=c.y-v.y,d=Math.max(1,Math.hypot(dx,dy));if(d>350+v.r)continue;const k=clamp(1-d/(350+v.r),0,1)*1.35;vx+=dx/d*k;vy+=dy/d*k;w+=k;}}
  for(const b of world.bumpers){const dx=c.x-b.x,dy=c.y-b.y,d=Math.max(1,Math.hypot(dx,dy));if(d>220+b.r)continue;const k=clamp(1-d/(220+b.r),0,1)*.62;vx+=dx/d*k;vy+=dy/d*k;w+=k;}
  for(const m of world.mothers){const dx=c.x-m.x,dy=c.y-m.y,d=Math.max(1,Math.hypot(dx,dy));if(d<m.r*.92){const k=1.3;vx+=dx/d*k;vy+=dy/d*k;w+=k;}}
  if(!w)return null;const n=norm(vx,vy);return{x:n.x,y:n.y,w};
}

function nearestSafePortal(world,c,away){
  let best=null,bd=520;for(const p of world.portals){const d=Math.hypot(p.x-c.x,p.y-c.y);if(d>=bd)continue;const dir=norm(p.x-c.x,p.y-c.y);if(away&&dir.x*away.x+dir.y*away.y<.25)continue;best=p;bd=d;}return best;
}

function safeVirusFarm(world,o,c,big,threat,profile){
  if(threat||big.mass<CONFIG.virusSplitMass*1.15||o.cells.length>4||o.ai.virusFarm>0||Math.random()>profile.virusFarm)return null;
  let best=null,bd=620;for(const v of world.viruses){const d=Math.hypot(v.x-c.x,v.y-c.y);if(d<bd){let enemyNear=false;for(const q of aliveOwners(world)){if(q.id===o.id||!canOwnersEat(world,q,o))continue;const qc=center(q);if(Math.hypot(qc.x-v.x,qc.y-v.y)<620&&q.totalMass>o.totalMass*.75){enemyNear=true;break;}}if(!enemyNear){best=v;bd=d;}}}
  return best;
}

function teamAssist(world,o,c,profile){
  if(!world.mode.teams||profile.assist<.1||Math.random()>profile.assist)return null;let best=null,score=-1e9;
  for(const mate of aliveOwners(world,{includeBoss:false})){
    if(mate.id===o.id||mate.team!==o.team)continue;const mc=center(mate),md=Math.hypot(mc.x-c.x,mc.y-c.y);if(md>900)continue;
    for(const enemy of aliveOwners(world,{includeBoss:false})){
      if(enemy.team===o.team)continue;const ec=center(enemy),d=Math.hypot(ec.x-mc.x,ec.y-mc.y);if(d>500)continue;
      const s=(mate.totalMass<enemy.totalMass?80:25)+(o.totalMass>enemy.totalMass*1.08?90:0)-md*.05;
      if(s>score){score=s;best={x:o.totalMass>enemy.totalMass*1.08?ec.x:mc.x,y:o.totalMass>enemy.totalMass*1.08?ec.y:mc.y,enemy,mate};}
    }
  }
  return best;
}

function bossFragmentGoal(world,c){
  let best=null,score=-1e9;for(const f of world.bossFragments){const d=Math.hypot(f.x-c.x,f.y-c.y);if(d>1250)continue;const s=f.mass*3-d*.08;if(s>score){score=s;best={x:f.x,y:f.y,score:s};}}return best;
}

function hotZoneGoal(world,o,c,threat,profile){
  if(!world.mode.hotzones||!world.hotZones.length||profile.id==='rookie'&&Math.random()<.65)return null;let best=null,score=-1e9;
  for(const z of world.hotZones){const d=Math.hypot(z.x-c.x,z.y-c.y),inside=d<z.r;let s=(inside?130:80)-d*.05;if(threat)s-=80;if(s>score){score=s;best=z;}}
  return best;
}

function tryVirusShot(world,o,c,big,prey,threat,profile){
  if(o.ai.virusShot>0||big.mass<CONFIG.ejectMinMass*1.7||Math.random()>profile.virusShot)return false;
  const target=prey?.owner&&prey.owner.totalMass>o.totalMass*.8?prey.cell:threat?.closest;if(!target)return false;
  let best=null,score=1e9;
  for(const v of world.viruses){
    const dv=Math.hypot(v.x-c.x,v.y-c.y),dt=Math.hypot(target.x-v.x,target.y-v.y);if(dv>650||dt>290)continue;
    const a=norm(v.x-c.x,v.y-c.y),b=norm(target.x-v.x,target.y-v.y);const alignment=a.x*b.x+a.y*b.y;if(alignment<.45)continue;
    const s=dv+dt*1.2-alignment*120;if(s<score){score=s;best=v;}
  }
  if(best&&ejectOwner(world,o,best.x,best.y)){o.ai.virusShot=rand(4.8,8.5);return true;}return false;
}

export function updateBotAI(world,o,dt){
  if(!o.alive||!o.cells.length||o.isBoss)return;const ai=o.ai,profile=getProfile(o),c=center(o),big=largest(o);if(!big)return;
  ai.think-=dt;ai.split-=dt;ai.escapeSplit-=dt;ai.forageSplit-=dt;ai.virusFarm-=dt;ai.virusShot-=dt;ai.wander-=dt;
  if(ai.think<=0){
    ai.think=rand(profile.think[0],profile.think[1]);const threat=threatVector(world,o,c,big.mass,profile),avoid=hazardAvoidance(world,c,big),prey=bestPrey(world,o,c,big.mass,profile);

    // Rare skill-scaled mistakes keep bots imperfect and readable.
    if(Math.random()<profile.mistake*.08){
      ai.mode='mistake';ai.biasAngle+=rand(-2.2,2.2);ai.goalX=clamp(c.x+Math.cos(ai.biasAngle)*rand(280,780),70,world.size-70);ai.goalY=clamp(c.y+Math.sin(ai.biasAngle)*rand(280,780),70,world.size-70);
      if(big.mass>CONFIG.splitMinMass*1.35&&ai.split<=0&&Math.random()<profile.badSplit){splitOwner(world,o,ai.goalX,ai.goalY,CONFIG.maxBotCells,{single:true});ai.split=rand(4.5,7.5);}
    }
    else if(world.mode.boss){
      const boss=world.bossState?.bossOwner,bc=boss?.alive?center(boss):null,bigBoss=boss?largest(boss):null,frag=bossFragmentGoal(world,c);
      if(bigBoss&&Math.hypot(c.x-bc.x,c.y-bc.y)<bigBoss.r+440){const d=norm(c.x-bc.x,c.y-bc.y);ai.mode='boss-flee';ai.goalX=clamp(c.x+d.x*900,60,world.size-60);ai.goalY=clamp(c.y+d.y*900,60,world.size-60);}
      else if(frag){ai.mode='boss-fragment';ai.goalX=frag.x;ai.goalY=frag.y;}
      else{const food=bestFoodCluster(world,c,profile);ai.mode='boss-feed';ai.goalX=food?.x??world.size*.5;ai.goalY=food?.y??world.size*.5;}
    }
    else if(threat&&threat.weight>.13){
      ai.mode='flee';let dx=threat.dx,dy=threat.dy;if(avoid){dx+=avoid.x*.75;dy+=avoid.y*.75;}let n=norm(dx,dy);
      const portal=big.mass<620&&profile.id!=='rookie'?nearestSafePortal(world,c,{x:n.x,y:n.y}):null;if(portal&&Math.random()<.32+profile.escapeSplit*.3){ai.mode='portal-escape';ai.goalX=portal.x;ai.goalY=portal.y;}
      else{ai.goalX=clamp(c.x+n.x*980,50,world.size-50);ai.goalY=clamp(c.y+n.y*980,50,world.size-50);}
      const veryClose=threat.d<big.r*2.2+180,slots=o.cells.length<CONFIG.maxBotCells;
      if(veryClose&&slots&&big.mass>CONFIG.splitMinMass*1.8&&ai.escapeSplit<=0&&Math.random()<profile.escapeSplit){splitOwner(world,o,ai.goalX,ai.goalY,CONFIG.maxBotCells,{single:true,boost:1.08});ai.escapeSplit=rand(6.5,10.5);ai.split=Math.max(ai.split,4.5);}
      tryVirusShot(world,o,c,big,null,threat,profile);
    }
    else{
      const farm=safeVirusFarm(world,o,c,big,threat,profile),assist=teamAssist(world,o,c,profile),zone=hotZoneGoal(world,o,c,threat,profile);
      if(farm){ai.mode='virus-farm';ai.goalX=farm.x;ai.goalY=farm.y;ai.virusFarm=rand(7,12);}
      else if(assist){ai.mode='assist';ai.goalX=assist.x;ai.goalY=assist.y;}
      else if(prey&&prey.score>8){
        ai.mode='hunt';const lead=clamp(prey.d/550,0,.85)*profile.lead;ai.goalX=clamp(prey.cell.x+prey.cell.vx*lead,30,world.size-30);ai.goalY=clamp(prey.cell.y+prey.cell.vy*lead,30,world.size-30);
        const splitReach=big.r*4.2+190,safeSplit=big.mass>prey.cell.mass*2.15&&prey.d<splitReach&&prey.d>big.r*.72&&o.cells.length<CONFIG.maxBotCells&&ai.split<=0;
        if(safeSplit&&Math.random()<profile.splitAgg){splitOwner(world,o,ai.goalX,ai.goalY,CONFIG.maxBotCells,{single:true});ai.split=rand(4.3,7.0);}
        else if(!safeSplit&&prey.d<splitReach&&big.mass>prey.cell.mass*1.55&&ai.split<=0&&Math.random()<profile.badSplit){splitOwner(world,o,ai.goalX,ai.goalY,CONFIG.maxBotCells,{single:true});ai.split=rand(5,8);}
        tryVirusShot(world,o,c,big,prey,null,profile);
      }
      else if(zone){ai.mode='control';ai.goalX=zone.x;ai.goalY=zone.y;}
      else{
        ai.mode='feed';const f=bestFoodCluster(world,c,profile);
        if(f){ai.goalX=f.x;ai.goalY=f.y;const safeSpread=o.cells.length<=2&&big.mass>120&&ai.forageSplit<=0&&f.local>=5&&Math.random()<profile.forageSplit;
          if(safeSpread){splitOwner(world,o,ai.goalX,ai.goalY,CONFIG.maxBotCells,{single:true,boost:.92});ai.forageSplit=rand(9,15);ai.split=Math.max(ai.split,3.5);}}
        else if(ai.wander<=0){ai.wander=rand(1.7,4);ai.biasAngle+=rand(-1.1,1.1);ai.goalX=clamp(c.x+Math.cos(ai.biasAngle)*rand(350,900),80,world.size-80);ai.goalY=clamp(c.y+Math.sin(ai.biasAngle)*rand(350,900),80,world.size-80);}
      }
    }

    const margin=260;if(c.x<margin)ai.goalX=Math.max(ai.goalX,margin+220);if(c.y<margin)ai.goalY=Math.max(ai.goalY,margin+220);if(c.x>world.size-margin)ai.goalX=Math.min(ai.goalX,world.size-margin-220);if(c.y>world.size-margin)ai.goalY=Math.min(ai.goalY,world.size-margin-220);
  }
  const steer=1-Math.pow(.0025,dt);ai.tx+=(ai.goalX-ai.tx)*steer;ai.ty+=(ai.goalY-ai.ty)*steer;moveOwner(world,o,ai.tx,ai.ty,dt);sameOwnerPhysics(world,o);
}
