export function createBotAIState(rand){
  return{
    think:rand(.05,.16),
    target:null,
    lootTarget:null,
    move:null,
    strafe:Math.random()<.5?-1:1,
    state:'roam',
    roamTimer:0,
    combatForget:0,
    lastEnemyX:null,
    lastEnemyY:null,

    destination:null,
    path:[],
    pathIndex:0,
    repathTimer:0,

    stuckTimer:0,
    stuckChecks:0,
    movementCheck:0,
    lastX:null,
    lastY:null,

    crateFocus:null,
    crateTarget:null
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

    // Visible targets are preferred, but proximity alone creates awareness.
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
  const margin=70;
  const safeR=Math.max(90,zone.r-margin);
  const candidates=[];

  for(const p of navPoints??[]){
    if(Math.hypot(p.x-zone.x,p.y-zone.y)>safeR)continue;
    if(blockedPoint?.(bot,p.x,p.y))continue;

    const d=Math.hypot(p.x-bot.x,p.y-bot.y);
    if(d<180)continue;

    // Keep bots moving across meaningful chunks of the map. House/bridge nodes
    // get a small bonus so they naturally circulate through authored landmarks.
    const ideal=620;
    const typeBonus=
      p.type==='bridge'
        ?-44
        :p.type?.startsWith('house')
          ?-28
          :0;

    const score=
      Math.abs(d-ideal)*.15+
      rand(0,95)+
      typeBonus;

    candidates.push({p,score});
  }

  if(candidates.length){
    candidates.sort((a,b)=>a.score-b.score);
    const pool=candidates.slice(0,Math.min(8,candidates.length));
    return{...pool[Math.floor(rand(0,pool.length))].p};
  }

  for(let tries=0;tries<48;tries++){
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

function reconstructPath(cameFrom,current,nodes){
  const result=[];

  while(current!==0&&current!==-1){
    result.push({x:nodes[current].x,y:nodes[current].y,type:nodes[current].type});
    current=cameFrom[current]??-1;
  }

  result.reverse();
  return result;
}

export function findNavigationPath({
  entity,
  startX,
  startY,
  targetX,
  targetY,
  navPoints,
  segmentBlocked,
  maxLink=690
}){
  if(!segmentBlocked?.(entity,startX,startY,targetX,targetY)){
    return[{x:targetX,y:targetY,type:'target'}];
  }

  const abx=targetX-startX;
  const aby=targetY-startY;
  const span=Math.hypot(abx,aby);
  const denom=abx*abx+aby*aby||1;
  const corridor=Math.max(620,Math.min(1180,span*.38));

  const distanceToRoute=p=>{
    const t=Math.max(0,Math.min(1,((p.x-startX)*abx+(p.y-startY)*aby)/denom));
    const x=startX+abx*t;
    const y=startY+aby*t;
    return Math.hypot(p.x-x,p.y-y);
  };

  const usefulNav=(navPoints??[])
    .map(p=>({
      ...p,
      ds:Math.hypot(p.x-startX,p.y-startY),
      dt:Math.hypot(p.x-targetX,p.y-targetY),
      routeD:distanceToRoute(p)
    }))
    .filter(p=>
      p.ds<850||
      p.dt<850||
      p.routeD<corridor
    )
    .sort((a,b)=>
      Math.min(a.ds,a.dt,a.routeD*.90)-
      Math.min(b.ds,b.dt,b.routeD*.90)
    )
    .slice(0,165);

  const nodes=[
    {x:startX,y:startY,type:'start'},
    ...(usefulNav.map(p=>({x:p.x,y:p.y,type:p.type,id:p.id}))),
    {x:targetX,y:targetY,type:'target'}
  ];

  const targetIndex=nodes.length-1;
  const open=new Set([0]);
  const cameFrom=new Array(nodes.length).fill(-1);
  const g=new Array(nodes.length).fill(Infinity);
  const f=new Array(nodes.length).fill(Infinity);

  g[0]=0;
  f[0]=Math.hypot(targetX-startX,targetY-startY);

  const clearCache=new Map();

  const isClear=(i,j)=>{
    const a=Math.min(i,j),b=Math.max(i,j);
    const key=`${a}:${b}`;

    if(clearCache.has(key))return clearCache.get(key);

    const n1=nodes[i],n2=nodes[j];
    const clear=!segmentBlocked?.(entity,n1.x,n1.y,n2.x,n2.y);
    clearCache.set(key,clear);
    return clear;
  };

  let iterations=0;

  while(open.size&&iterations++<360){
    let current=-1;
    let best=Infinity;

    for(const index of open){
      if(f[index]<best){
        best=f[index];
        current=index;
      }
    }

    if(current===targetIndex){
      const path=reconstructPath(cameFrom,current,nodes);
      return path.length?path:[{x:targetX,y:targetY,type:'target'}];
    }

    open.delete(current);

    for(let i=1;i<nodes.length;i++){
      if(i===current)continue;

      const a=nodes[current],b=nodes[i];
      const d=Math.hypot(b.x-a.x,b.y-a.y);

      // Start/target get a slightly longer leash so they can snap to the
      // authored navigation network from an arbitrary position.
      const limit=
        current===0||
        i===targetIndex||
        current===targetIndex||
        i===0
          ?maxLink*1.18
          :maxLink;

      if(d>limit)continue;
      if(!isClear(current,i))continue;

      let typeCost=1;
      if(b.type==='house-door'||b.type==='house-inside')typeCost=.96;
      if(b.type==='bridge')typeCost=.95;

      const tentative=
        g[current]+
        d*typeCost;

      if(tentative>=g[i])continue;

      cameFrom[i]=current;
      g[i]=tentative;
      f[i]=tentative+Math.hypot(targetX-b.x,targetY-b.y);
      open.add(i);
    }
  }

  // Local steering remains a safe fallback if no full graph route exists.
  return[{x:targetX,y:targetY,type:'fallback'}];
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
  const desired=Math.atan2(dy,dx);

  const oldX=entity.x;
  const oldY=entity.y;

  move(
    entity,
    Math.cos(desired)*speed*dt,
    Math.sin(desired)*speed*dt
  );

  let moved=Math.hypot(entity.x-oldX,entity.y-oldY);

  if(moved>Math.max(.45,speed*dt*.18)){
    return{moved,steered:false,blocked:false};
  }

  // Collision-aware local steering around building corners, crates and trunks.
  const offsets=[.40,-.40,.72,-.72,1.05,-1.05,1.42,-1.42];

  if(strafe<0){
    for(let i=0;i<offsets.length;i+=2){
      [offsets[i],offsets[i+1]]=[offsets[i+1],offsets[i]];
    }
  }

  for(const off of offsets){
    const a=desired+off;
    const preview=entity.r*2.8+27;
    const px=entity.x+Math.cos(a)*preview;
    const py=entity.y+Math.sin(a)*preview;

    if(blocked(entity,px,py))continue;

    const bx=entity.x;
    const by=entity.y;

    move(
      entity,
      Math.cos(a)*speed*dt,
      Math.sin(a)*speed*dt
    );

    moved=Math.hypot(entity.x-bx,entity.y-by);

    if(moved>.12){
      return{moved,steered:true,blocked:false};
    }
  }

  return{moved:0,steered:false,blocked:true};
}
