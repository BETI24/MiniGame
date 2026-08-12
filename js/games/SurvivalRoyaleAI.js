export function createBotAIState(rand){
  return{
    think:rand(.08,.24),
    target:null,
    lootTarget:null,
    move:null,
    strafe:Math.random()<.5?-1:1,
    state:'roam',
    roamTimer:0,
    combatForget:0,
    lastEnemyX:null,
    lastEnemyY:null,
    stuckTimer:0,
    lastX:null,
    lastY:null
  };
}

export function findNearbyEnemy(bot,entities,maxRange,lineBlocked){
  let best=null;
  let bestScore=Infinity;

  for(const e of entities){
    if(!e?.alive||e.id===bot.id)continue;

    const d=Math.hypot(e.x-bot.x,e.y-bot.y);
    if(d>maxRange)continue;

    const visible=!lineBlocked(bot.x,bot.y,e.x,e.y);

    // Visible targets are slightly preferred, but proximity alone creates awareness.
    const score=d-(visible?95:0);

    if(score<bestScore){
      bestScore=score;
      best={e,d,visible};
    }
  }

  return best;
}

export function chooseRoamDestination({
  bot,
  zone,
  worldSize,
  navPoints,
  rand,
  blockedPoint
}){
  const margin=65;
  const safeR=Math.max(80,zone.r-margin);
  const candidates=[];

  for(const p of navPoints??[]){
    if(Math.hypot(p.x-zone.x,p.y-zone.y)>safeR)continue;
    if(blockedPoint?.(bot,p.x,p.y))continue;

    const d=Math.hypot(p.x-bot.x,p.y-bot.y);
    if(d<115)continue;

    // Prefer a useful medium-distance destination over tiny local shuffles.
    const score=
      Math.abs(d-520)*.18+
      rand(0,120)-
      (p.type==='bridge'?30:0)-
      (p.type==='house'?18:0);

    candidates.push({p,score});
  }

  if(candidates.length){
    candidates.sort((a,b)=>a.score-b.score);
    const pool=candidates.slice(0,Math.min(5,candidates.length));
    return{...pool[Math.floor(rand(0,pool.length))].p};
  }

  for(let tries=0;tries<36;tries++){
    const a=rand(0,Math.PI*2);
    const r=Math.sqrt(rand(0,1))*safeR;
    const p={
      x:Math.max(50,Math.min(worldSize-50,zone.x+Math.cos(a)*r)),
      y:Math.max(50,Math.min(worldSize-50,zone.y+Math.sin(a)*r)),
      type:'random'
    };

    if(!blockedPoint?.(bot,p.x,p.y))return p;
  }

  return{x:zone.x,y:zone.y,type:'zone'};
}

export function moveWithSteering({
  entity,
  targetX,
  targetY,
  dt,
  speed,
  move,
  blocked,
  strafe=1
}){
  const dx=targetX-entity.x;
  const dy=targetY-entity.y;
  const d=Math.max(1,Math.hypot(dx,dy));
  const desired=Math.atan2(dy,dx);

  const oldX=entity.x;
  const oldY=entity.y;

  move(
    entity,
    Math.cos(desired)*speed*dt,
    Math.sin(desired)*speed*dt
  );

  const moved=Math.hypot(entity.x-oldX,entity.y-oldY);

  if(moved>Math.max(.45,speed*dt*.18)){
    return true;
  }

  // Collision-aware local steering around building corners, crates and trunks.
  const offsets=[.58,-.58,1.05,-1.05,1.48,-1.48];

  if(strafe<0){
    for(let i=0;i<offsets.length;i+=2){
      [offsets[i],offsets[i+1]]=[offsets[i+1],offsets[i]];
    }
  }

  for(const off of offsets){
    const a=desired+off;
    const preview=entity.r*2.5+22;
    const px=entity.x+Math.cos(a)*preview;
    const py=entity.y+Math.sin(a)*preview;

    if(blocked(entity,px,py))continue;

    move(
      entity,
      Math.cos(a)*speed*dt,
      Math.sin(a)*speed*dt
    );

    return false;
  }

  return false;
}
