import { CONFIG } from './CellArenaData.js';
import { clamp, rand, rint, norm, center, largest, aliveOwners, ownerById, canOwnersEat, moveOwner, sameOwnerPhysics, splitOwner, ejectOwner, getProfile } from './CellArenaEngine.js';

const sameDuo=(a,b)=>!!a?.duoId&&a.duoId===b?.duoId;

function threatVector(world,o,c,m,profile){
  let vx=0,vy=0,weight=0,closest=null,closestD=1e9,closestOwner=null;
  for(const q of aliveOwners(world)){
    if(q.id===o.id||sameDuo(o,q)||!canOwnersEat(world,q,o))continue;
    for(const x of q.cells){
      if(!x.alive||x.mass<m*CONFIG.eatRatio)continue;const dx=c.x-x.x,dy=c.y-x.y,d=Math.max(1,Math.hypot(dx,dy)),range=profile.view+x.r;if(d>range)continue;
      const danger=clamp(1-d/range,0,1),massFactor=clamp(x.mass/Math.max(1,m),1,4),w=danger*danger*massFactor;vx+=dx/d*w;vy+=dy/d*w;weight+=w;
      if(d<closestD){closestD=d;closest=x;closestOwner=q;}
    }
  }
  if(weight<=0)return null;const n=norm(vx,vy);return{dx:n.x,dy:n.y,weight,closest,owner:closestOwner,d:closestD};
}

function bestPrey(world,o,c,m,profile){
  let best=null,score=-1e9;
  for(const q of aliveOwners(world)){
    if(q.id===o.id||sameDuo(o,q)||!canOwnersEat(world,o,q))continue;
    for(const x of q.cells){
      if(!x.alive||m<x.mass*CONFIG.eatRatio*.72)continue;const d=Math.hypot(x.x-c.x,x.y-c.y);if(d>profile.prey)continue;
      const edible=m>=x.mass*CONFIG.eatRatio,ratio=m/Math.max(1,x.mass),edge=Math.min(x.x,x.y,world.size-x.x,world.size-x.y),edgeBonus=1-edge/world.size;
      let s=x.mass*2.9-d*.095+edgeBonus*20;if(!edible)s-=110;if(ratio>2.8)s+=38;if(q.duoMateId)s+=8;
      if(s>score){score=s;best={cell:x,owner:q,d,score:s,edible,ratio};}
    }
  }
  return best;
}

function bestFoodCluster(world,c,profile){
  if(!world.food.length)return null;let best=null,score=-1e9;const samples=Math.min(profile.foodSamples,world.food.length);
  for(let i=0;i<samples;i++){
    const p=world.food[rint(0,world.food.length-1)];if(!p)continue;const d=Math.hypot(p.x-c.x,p.y-c.y);if(d>1050)continue;
    let local=0,mass=0;for(let j=0;j<24;j++){const q=world.food[rint(0,world.food.length-1)];if(q&&Math.hypot(q.x-p.x,q.y-p.y)<180){local++;mass+=q.mass;}}
    const s=local*12+mass*8-d*.04+(p.spawnerId?34:0)+(p.golden?28:0);if(s>score){score=s;best={x:p.x,y:p.y,score:s,local};}
  }
  return best;
}

function hazardAvoidance(world,c,big){
  let vx=0,vy=0,w=0;
  if(big.mass>=CONFIG.virusSplitMass){for(const v of world.viruses){const dx=c.x-v.x,dy=c.y-v.y,d=Math.max(1,Math.hypot(dx,dy));if(d>390+v.r)continue;const k=clamp(1-d/(390+v.r),0,1)*1.45;vx+=dx/d*k;vy+=dy/d*k;w+=k;}}
  for(const b of world.bumpers){const dx=c.x-b.x,dy=c.y-b.y,d=Math.max(1,Math.hypot(dx,dy));if(d>220+b.r)continue;const k=clamp(1-d/(220+b.r),0,1)*.62;vx+=dx/d*k;vy+=dy/d*k;w+=k;}
  for(const m of world.mothers){const dx=c.x-m.x,dy=c.y-m.y,d=Math.max(1,Math.hypot(dx,dy));if(d<m.r*.92){vx+=dx/d*1.3;vy+=dy/d*1.3;w+=1.3;}}
  if(!w)return null;const n=norm(vx,vy);return{x:n.x,y:n.y,w};
}

function nearestSafePortal(world,c,away){let best=null,bd=560;for(const p of world.portals){const d=Math.hypot(p.x-c.x,p.y-c.y);if(d>=bd)continue;const dir=norm(p.x-c.x,p.y-c.y);if(away&&dir.x*away.x+dir.y*away.y<.25)continue;best=p;bd=d;}return best;}

function safeVirusFarm(world,o,c,big,threat,profile){
  if(threat||big.mass<CONFIG.virusSplitMass*1.12||o.cells.length>5||o.ai.virusFarm>0||Math.random()>profile.virusFarm)return null;
  let best=null,bd=650;for(const v of world.viruses){const d=Math.hypot(v.x-c.x,v.y-c.y);if(d>=bd)continue;let enemyNear=false;for(const q of aliveOwners(world)){if(q.id===o.id||sameDuo(o,q)||!canOwnersEat(world,q,o))continue;const qc=center(q);if(Math.hypot(qc.x-v.x,qc.y-v.y)<650&&q.totalMass>o.totalMass*.72){enemyNear=true;break;}}if(!enemyNear){best=v;bd=d;}}
  return best;
}

function teamAssist(world,o,c,profile){
  if(!world.mode.teams||profile.assist<.1||Math.random()>profile.assist)return null;let best=null,score=-1e9;
  for(const mate of aliveOwners(world,{includeBoss:false})){
    if(mate.id===o.id||mate.team!==o.team)continue;const mc=center(mate),md=Math.hypot(mc.x-c.x,mc.y-c.y);if(md>950)continue;
    for(const enemy of aliveOwners(world,{includeBoss:false})){
      if(enemy.team===o.team)continue;const ec=center(enemy),d=Math.hypot(ec.x-mc.x,ec.y-mc.y);if(d>520)continue;
      const s=(mate.totalMass<enemy.totalMass?85:25)+(o.totalMass>enemy.totalMass*CONFIG.eatRatio?100:0)-md*.05;if(s>score){score=s;best={x:o.totalMass>enemy.totalMass*CONFIG.eatRatio?ec.x:mc.x,y:o.totalMass>enemy.totalMass*CONFIG.eatRatio?ec.y:mc.y,enemy,mate};}
    }
  }
  return best;
}

function duoAction(world,o,c,big,profile,prey){
  const mate=o.duoMateId?ownerById(world,o.duoMateId):null;if(!mate?.alive||!mate.cells.length)return null;const mc=center(mate),mb=largest(mate),d=Math.hypot(mc.x-c.x,mc.y-c.y);if(!mb)return null;
  const mateThreat=threatVector(world,mate,mc,mb.mass,profile),matePrey=bestPrey(world,mate,mc,mb.mass,profile);

  // A classic team behavior: after a virus pop or deep multi-split, the partner absorbs
  // loose pieces while leaving the largest recovery cell alive.
  if(mate.cells.length>=3){
    let loose=null,score=-1e9;for(const x of mate.cells){if(!x.alive||x.id===mb.id||big.mass<x.mass*CONFIG.eatRatio*1.01)continue;const dx=Math.hypot(x.x-c.x,x.y-c.y);if(dx>900)continue;const s=x.mass*2.4-dx*.10;if(s>score){score=s;loose=x;}}
    if(loose&&profile.id!=='rookie')return{mode:'duo-loose-mass',x:loose.x,y:loose.y,prey:{cell:loose,owner:mate,d:Math.hypot(loose.x-c.x,loose.y-c.y),score:150,edible:true,ratio:big.mass/loose.mass}};
  }

  if(d>1150)return{mode:'duo-regroup',x:mc.x,y:mc.y};
  if(mateThreat?.closest&&mateThreat.d<650){
    const t=mateThreat.closest,canPunish=big.mass>=t.mass*CONFIG.eatRatio*1.02;
    if(canPunish)return{mode:'duo-cover',x:t.x,y:t.y,prey:{cell:t,owner:mateThreat.owner,d:Math.hypot(t.x-c.x,t.y-c.y),score:145,edible:true,ratio:big.mass/t.mass}};
    const away=norm(mc.x-t.x,mc.y-t.y);return{mode:'duo-screen',x:clamp(mc.x+away.x*300,50,world.size-50),y:clamp(mc.y+away.y*300,50,world.size-50)};
  }

  const target=(prey&&!sameDuo(o,prey.owner)?prey:null)||(matePrey&&!sameDuo(o,matePrey.owner)?matePrey:null);
  if(target){
    const tc={x:target.cell.x,y:target.cell.y},mt=Math.hypot(tc.x-mc.x,tc.y-mc.y),ot=Math.hypot(tc.x-c.x,tc.y-c.y);
    const om=norm(mc.x-c.x,mc.y-c.y),mtv=norm(tc.x-mc.x,tc.y-mc.y),line=om.x*mtv.x+om.y*mtv.y;

    // Split-feed / double-split-feed: make the teammate large enough to take a target.
    if(d<520&&mt<650&&o.cells.length<=2&&o.totalMass>mate.totalMass*1.18&&o.ai.duoFeed<=0){
      let steps=0;for(let n=1;n<=4;n++){const piece=big.mass/Math.pow(2,n);if(piece<CONFIG.minDecayMass)break;if(mb.mass>=piece*CONFIG.eatRatio*1.01){steps=n;break;}}
      const mateNeedsMass=mb.mass<target.cell.mass*CONFIG.eatRatio*1.10;
      if(steps&&mateNeedsMass&&Math.random()<(profile.duoSplitFeed||0))return{mode:'duo-split-feed',x:mc.x,y:mc.y,comboSteps:steps};
    }

    // Tricksplit / cannonsplit approximation: one bot throws a chain of edible pieces
    // through its partner toward a victim; the partner can consume those pieces and
    // continue onto the victim in the same line.
    if(line>.58&&d>180&&d<620&&mt<610&&ot<1050&&o.cells.length<=2&&o.totalMass>mate.totalMass*1.45&&Math.random()<(profile.duoTrick||0)){
      let steps=0;for(let n=2;n<=4;n++){const piece=big.mass/Math.pow(2,n);if(mb.mass>=piece*CONFIG.eatRatio*1.01){steps=n;break;}}
      if(steps)return{mode:'duo-tricksplit',x:tc.x,y:tc.y,comboSteps:steps};
    }

    // W-feed only when the teammate is close to a real opportunity; this is safer than
    // spraying mass constantly and mirrors practical team feeding.
    if(d<440&&mt<560&&o.ai.duoFeed<=0&&big.mass>CONFIG.ejectMinMass*1.7&&o.totalMass>mate.totalMass*1.35&&Math.random()<profile.duoFeed){
      if(ejectOwner(world,o,mc.x,mc.y)){o.ai.duoFeed=rand(.45,.95);return{mode:'duo-w-feed',x:mc.x,y:mc.y};}
    }
  }

  // Splitrunning-style transfer when rotating around the map: the larger partner can
  // hand off a split piece so the pair stays mobile, then roles can naturally reverse.
  if(!target&&!mateThreat&&d>210&&d<430&&o.cells.length===1&&o.totalMass>mate.totalMass*1.65&&o.ai.duoFeed<=0&&Math.random()<(profile.duoSplitFeed||0)*.18){
    let steps=0;for(let n=1;n<=3;n++){const piece=big.mass/Math.pow(2,n);if(mb.mass>=piece*CONFIG.eatRatio*1.01){steps=n;break;}}
    if(steps){o.ai.duoFeed=rand(2.2,4.0);return{mode:'duo-splitrun',x:mc.x,y:mc.y,comboSteps:steps};}
  }

  // Because FFA duo partners are now physically edible, avoid accidental full-body
  // absorption when one partner is much larger unless a deliberate feed tactic is active.
  if(d<big.r+mb.r+105&&(big.mass>=mb.mass*CONFIG.eatRatio||mb.mass>=big.mass*CONFIG.eatRatio)){
    const away=norm(c.x-mc.x,c.y-mc.y),sideX=-away.y,sideY=away.x;return{mode:'duo-spacing',x:clamp(c.x+away.x*360+sideX*95,60,world.size-60),y:clamp(c.y+away.y*360+sideY*95,60,world.size-60)};
  }

  // Smaller partner can still bait an enemy toward the larger partner.
  if(o.totalMass<mate.totalMass*.72&&d<760){
    for(const enemy of aliveOwners(world,{includeBoss:false})){
      if(enemy.id===mate.id||enemy.id===o.id||sameDuo(o,enemy))continue;const eb=largest(enemy);if(!eb)continue;const ec=center(enemy),ed=Math.hypot(ec.x-c.x,ec.y-c.y),emd=Math.hypot(ec.x-mc.x,ec.y-mc.y);
      if(ed<650&&emd<790&&eb.mass>big.mass*CONFIG.eatRatio&&mb.mass>eb.mass*CONFIG.eatRatio*1.05){const toward=norm(ec.x-c.x,ec.y-c.y);return{mode:'duo-bait',x:clamp(c.x+toward.x*220,60,world.size-60),y:clamp(c.y+toward.y*220,60,world.size-60)};}
    }
  }
  if(d>610)return{mode:'duo-formation',x:mc.x,y:mc.y};return null;
}

function bossFragmentGoal(world,c){let best=null,score=-1e9;for(const f of world.bossFragments){const d=Math.hypot(f.x-c.x,f.y-c.y);if(d>1250)continue;const s=f.mass*3-d*.08;if(s>score){score=s;best={x:f.x,y:f.y,score:s};}}return best;}
function hotZoneGoal(world,c,threat,profile){if(!world.mode.hotzones||!world.hotZones.length||profile.id==='rookie'&&Math.random()<.65)return null;let best=null,score=-1e9;for(const z of world.hotZones){const d=Math.hypot(z.x-c.x,z.y-c.y),inside=d<z.r;let s=(inside?130:80)-d*.05;if(threat)s-=80;if(s>score){score=s;best=z;}}return best;}

function tryVirusShot(world,o,c,big,prey,threat,profile){
  if(o.ai.virusShot>0||big.mass<CONFIG.ejectMinMass*1.8||Math.random()>profile.virusShot)return false;const target=prey?.owner&&prey.owner.totalMass>o.totalMass*.7?prey.cell:threat?.closest;if(!target)return false;
  let best=null,score=1e9;for(const v of world.viruses){const dv=Math.hypot(v.x-c.x,v.y-c.y),dt=Math.hypot(target.x-v.x,target.y-v.y);if(dv>720||dt>320)continue;const a=norm(v.x-c.x,v.y-c.y),b=norm(target.x-v.x,target.y-v.y),alignment=a.x*b.x+a.y*b.y;if(alignment<.50)continue;const s=dv+dt*1.2-alignment*140;if(s<score){score=s;best=v;}}
  if(best&&ejectOwner(world,o,best.x,best.y)){o.ai.virusShot=rand(4.2,7.8);return true;}return false;
}

function splitDanger(world,o,target,pieceMass){
  let danger=0;for(const q of aliveOwners(world)){if(q.id===o.id||sameDuo(o,q)||!canOwnersEat(world,q,o))continue;for(const c of q.cells){if(!c.alive||c.mass<pieceMass*CONFIG.eatRatio)continue;const d=Math.hypot(c.x-target.x,c.y-target.y);if(d<430+c.r)danger+=clamp(1-d/(430+c.r),0,1)*(c.mass/pieceMass);}}return danger;
}

function planSplitAttack(world,o,big,prey,profile){
  if(!prey?.cell||o.ai.split>0||o.cells.length>=CONFIG.maxBotCells||big.mass<CONFIG.splitMinMass)return 0;const maxSteps=Math.max(1,Math.min(4,profile.combo||1));
  for(let steps=1;steps<=maxSteps;steps++){
    const pieceMass=big.mass/Math.pow(2,steps);if(pieceMass<prey.cell.mass*CONFIG.eatRatio*1.025||pieceMass<CONFIG.minDecayMass)break;
    const reach=CONFIG.splitBoostDistance*(.96+(steps-1)*.52)+big.r*.72;if(prey.d>reach||prey.d<big.r*.55)continue;
    const risk=splitDanger(world,o,prey.cell,pieceMass),tolerance=profile.id==='ace'?2.5:profile.id==='veteran'?1.65:profile.id==='skilled'?0.95:0.45;if(risk>tolerance)continue;
    if(steps>1&&Math.random()>profile.comboChance)continue;return steps;
  }
  return 0;
}

function beginCombo(world,o,x,y,steps){
  if(steps<=0)return false;const ok=splitOwner(world,o,x,y,CONFIG.maxBotCells,{single:false});if(!ok)return false;o.ai.split=rand(3.6,6.0);if(steps>1){o.ai.comboSteps=steps-1;o.ai.comboTimer=.105;o.ai.comboX=x;o.ai.comboY=y;}return true;
}
function updateCombo(world,o,dt){
  const ai=o.ai;if(!ai.comboSteps)return;ai.comboTimer-=dt;if(ai.comboTimer>0)return;const did=splitOwner(world,o,ai.comboX,ai.comboY,CONFIG.maxBotCells,{single:false});ai.comboSteps=did?ai.comboSteps-1:0;ai.comboTimer=.105;
}

export function updateBotAI(world,o,dt){
  if(!o.alive||!o.cells.length||o.isBoss)return;const ai=o.ai,profile=getProfile(o);updateCombo(world,o,dt);const c=center(o),big=largest(o);if(!big)return;
  ai.think-=dt;ai.split-=dt;ai.escapeSplit-=dt;ai.forageSplit-=dt;ai.virusFarm-=dt;ai.virusShot-=dt;ai.duoFeed-=dt;ai.wander-=dt;
  if(ai.think<=0){
    ai.think=rand(profile.think[0],profile.think[1]);const threat=threatVector(world,o,c,big.mass,profile),avoid=hazardAvoidance(world,c,big),prey=bestPrey(world,o,c,big.mass,profile),duo=duoAction(world,o,c,big,profile,prey);
    if(Math.random()<profile.mistake*.08){
      ai.mode='mistake';ai.biasAngle+=rand(-2.2,2.2);ai.goalX=clamp(c.x+Math.cos(ai.biasAngle)*rand(280,780),70,world.size-70);ai.goalY=clamp(c.y+Math.sin(ai.biasAngle)*rand(280,780),70,world.size-70);
      if(big.mass>CONFIG.splitMinMass*1.35&&ai.split<=0&&Math.random()<profile.badSplit)beginCombo(world,o,ai.goalX,ai.goalY,1);
    }
    else if(world.mode.boss){
      const boss=world.bossState?.bossOwner,bc=boss?.alive?center(boss):null,bigBoss=boss?largest(boss):null,frag=bossFragmentGoal(world,c);
      if(bigBoss&&Math.hypot(c.x-bc.x,c.y-bc.y)<bigBoss.r+440){const d=norm(c.x-bc.x,c.y-bc.y);ai.mode='boss-flee';ai.goalX=clamp(c.x+d.x*900,60,world.size-60);ai.goalY=clamp(c.y+d.y*900,60,world.size-60);}
      else if(frag){ai.mode='boss-fragment';ai.goalX=frag.x;ai.goalY=frag.y;}
      else{const food=bestFoodCluster(world,c,profile);ai.mode='boss-feed';ai.goalX=food?.x??world.size*.5;ai.goalY=food?.y??world.size*.5;}
    }
    else if(threat&&threat.weight>.13){
      ai.mode='flee';let dx=threat.dx,dy=threat.dy;if(avoid){dx+=avoid.x*.75;dy+=avoid.y*.75;}const n=norm(dx,dy),portal=big.mass<620&&profile.id!=='rookie'?nearestSafePortal(world,c,{x:n.x,y:n.y}):null;
      if(portal&&Math.random()<.30+profile.escapeSplit*.3){ai.mode='portal-escape';ai.goalX=portal.x;ai.goalY=portal.y;}
      else{ai.goalX=clamp(c.x+n.x*980,50,world.size-50);ai.goalY=clamp(c.y+n.y*980,50,world.size-50);}
      const veryClose=threat.d<big.r*2.0+185,slots=o.cells.length<CONFIG.maxBotCells;
      if(veryClose&&slots&&big.mass>CONFIG.splitMinMass*1.85&&ai.escapeSplit<=0&&Math.random()<profile.escapeSplit){beginCombo(world,o,ai.goalX,ai.goalY,1);ai.escapeSplit=rand(6.2,10);}
      tryVirusShot(world,o,c,big,null,threat,profile);
    }
    else if(duo){
      ai.mode=duo.mode;ai.goalX=duo.x;ai.goalY=duo.y;
      if(duo.comboSteps&&ai.split<=0){beginCombo(world,o,duo.x,duo.y,duo.comboSteps);o.ai.duoFeed=Math.max(o.ai.duoFeed,rand(1.1,2.2));}
      else if(duo.prey){const steps=planSplitAttack(world,o,big,duo.prey,profile);if(steps)beginCombo(world,o,duo.x,duo.y,steps);}
    }
    else{
      const farm=safeVirusFarm(world,o,c,big,threat,profile),assist=teamAssist(world,o,c,profile),zone=hotZoneGoal(world,c,threat,profile);
      if(farm){ai.mode='virus-farm';ai.goalX=farm.x;ai.goalY=farm.y;ai.virusFarm=rand(7,12);}
      else if(assist){ai.mode='assist';ai.goalX=assist.x;ai.goalY=assist.y;}
      else if(prey&&prey.score>8){
        ai.mode='hunt';const lead=clamp(prey.d/560,0,.90)*profile.lead;ai.goalX=clamp(prey.cell.x+prey.cell.vx*lead,30,world.size-30);ai.goalY=clamp(prey.cell.y+prey.cell.vy*lead,30,world.size-30);
        const steps=planSplitAttack(world,o,big,prey,profile);if(steps&&Math.random()<profile.splitAgg)beginCombo(world,o,ai.goalX,ai.goalY,steps);else if(!steps&&prey.d<CONFIG.splitBoostDistance+big.r&&big.mass>prey.cell.mass*1.75&&ai.split<=0&&Math.random()<profile.badSplit)beginCombo(world,o,ai.goalX,ai.goalY,1);
        tryVirusShot(world,o,c,big,prey,null,profile);
      }
      else if(zone){ai.mode='control';ai.goalX=zone.x;ai.goalY=zone.y;}
      else{
        ai.mode='feed';const f=bestFoodCluster(world,c,profile);
        if(f){ai.goalX=f.x;ai.goalY=f.y;const safeSpread=o.cells.length<=2&&big.mass>150&&ai.forageSplit<=0&&f.local>=6&&Math.random()<profile.forageSplit;if(safeSpread){beginCombo(world,o,ai.goalX,ai.goalY,1);ai.forageSplit=rand(9,15);}}
        else if(ai.wander<=0){ai.wander=rand(1.7,4);ai.biasAngle+=rand(-1.1,1.1);ai.goalX=clamp(c.x+Math.cos(ai.biasAngle)*rand(350,900),80,world.size-80);ai.goalY=clamp(c.y+Math.sin(ai.biasAngle)*rand(350,900),80,world.size-80);}
      }
    }
    const margin=260;if(c.x<margin)ai.goalX=Math.max(ai.goalX,margin+220);if(c.y<margin)ai.goalY=Math.max(ai.goalY,margin+220);if(c.x>world.size-margin)ai.goalX=Math.min(ai.goalX,world.size-margin-220);if(c.y>world.size-margin)ai.goalY=Math.min(ai.goalY,world.size-margin-220);
  }
  const steer=1-Math.pow(.0025,dt);ai.tx+=(ai.goalX-ai.tx)*steer;ai.ty+=(ai.goalY-ai.ty)*steer;moveOwner(world,o,ai.tx,ai.ty,dt);sameOwnerPhysics(world,o);
}
