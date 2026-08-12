import {createHouseInstance,houseEntrance} from './SurvivalRoyaleBuildings.js';

const HOUSE_PLACEMENTS = [
  {x:.10,y:.10,r:0,s:0,q:1},
  {x:.30,y:.17,r:1,s:1,q:1},
  {x:.11,y:.39,r:3,s:2,q:1},
  {x:.29,y:.64,r:2,s:3,q:1},
  {x:.70,y:.09,r:2,s:1,q:1},
  {x:.79,y:.32,r:3,s:0,q:1},
  {x:.68,y:.57,r:1,s:3,q:1},
  {x:.79,y:.76,r:0,s:2,q:1},

  {x:.10,y:.74,r:1,s:0,q:0},
  {x:.27,y:.84,r:3,s:2,q:0},
  {x:.62,y:.25,r:0,s:3,q:0},
  {x:.62,y:.79,r:2,s:1,q:0},
  {x:.35,y:.46,r:0,s:2,q:0},
  {x:.57,y:.46,r:2,s:0,q:0}
];

const SPAWNS = [
  [.06,.06],[.22,.06],[.43,.07],[.60,.06],[.84,.07],[.94,.16],
  [.07,.27],[.22,.31],[.43,.27],[.61,.29],[.91,.34],
  [.07,.54],[.23,.51],[.39,.58],[.61,.56],[.88,.53],
  [.07,.88],[.22,.92],[.41,.88],[.59,.91],[.78,.90],[.94,.83]
];

const OUTDOOR_CRATES = [
  [.18,.10],[.24,.24],[.08,.31],[.18,.50],[.34,.35],[.37,.72],[.18,.83],
  [.61,.11],[.81,.17],[.90,.28],[.66,.39],[.88,.47],[.61,.69],[.88,.69],
  [.69,.88],[.91,.91],[.44,.17],[.55,.18],[.45,.79],[.56,.82]
];

const FIELD_LOOT = [
  [.16,.16],[.24,.38],[.32,.52],[.16,.67],[.39,.27],[.40,.82],
  [.64,.17],[.75,.24],[.89,.39],[.63,.62],[.79,.68],[.91,.79]
];

const TREE_CLUSTERS = [
  [.06,.14],[.17,.07],[.25,.12],[.40,.10],[.58,.11],[.88,.10],[.95,.23],
  [.08,.36],[.19,.34],[.32,.31],[.68,.36],[.91,.42],
  [.06,.60],[.18,.61],[.31,.57],[.69,.60],[.82,.58],[.94,.65],
  [.08,.82],[.20,.88],[.34,.89],[.62,.88],[.74,.83],[.90,.86]
];

const CLUSTER_OFFSETS = [
  [0,0],[-42,-31],[47,-24],[-31,46],[53,39]
];

const ROCKS = [
  [.14,.22,25],[.35,.14,21],[.42,.38,28],[.20,.71,24],[.39,.91,30],
  [.62,.17,24],[.83,.25,29],[.72,.43,22],[.91,.59,27],[.67,.73,26],[.86,.91,31]
];

const BUSHES = [
  [.27,.08,31],[.39,.21,27],[.14,.45,33],[.31,.75,30],[.45,.91,28],
  [.61,.08,30],[.77,.20,34],[.91,.49,31],[.64,.65,29],[.80,.82,35]
];

function mapPoint(nx,ny,worldSize){
  return{x:nx*worldSize,y:ny*worldSize};
}

function pointSegmentDistance(px,py,ax,ay,bx,by){
  const abx=bx-ax;
  const aby=by-ay;
  const denom=abx*abx+aby*aby||1;
  const t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/denom));
  const x=ax+abx*t;
  const y=ay+aby*t;
  return Math.hypot(px-x,py-y);
}

function pointInRect(x,y,r){
  return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
}

export function createRiver(worldSize){
  const width=Math.max(110,Math.min(175,worldSize*.041));
  const centers=[
    [.49,-.03],[.505,.14],[.475,.29],[.515,.46],
    [.485,.62],[.525,.79],[.505,1.03]
  ].map(([x,y])=>({x:x*worldSize,y:y*worldSize}));

  const bridgeW=width+150;
  const bridgeH=Math.max(78,worldSize*.024);

  const bridgeY=[.29,.705].map(v=>v*worldSize);

  const bridges=bridgeY.map((y,index)=>{
    const centerX=riverXAtY({centers},y);
    return{
      id:index,
      x:centerX-bridgeW/2,
      y:y-bridgeH/2,
      w:bridgeW,
      h:bridgeH
    };
  });

  return{width,centers,bridges};
}

export function riverXAtY(river,y){
  const pts=river.centers;

  for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1];
    const min=Math.min(a.y,b.y),max=Math.max(a.y,b.y);

    if(y>=min&&y<=max){
      const t=(y-a.y)/(b.y-a.y||1);
      return a.x+(b.x-a.x)*t;
    }
  }

  return pts[Math.max(0,Math.min(pts.length-1,y<pts[0].y?0:pts.length-1))].x;
}

export function isOnBridge(x,y,river){
  return river?.bridges?.some(b=>pointInRect(x,y,b))??false;
}

export function isInRiver(x,y,river){
  if(!river||isOnBridge(x,y,river))return false;

  for(let i=0;i<river.centers.length-1;i++){
    const a=river.centers[i],b=river.centers[i+1];

    if(
      pointSegmentDistance(x,y,a.x,a.y,b.x,b.y)<
      river.width*.52
    ){
      return true;
    }
  }

  return false;
}

export function terrainSpeedMultiplier(x,y,river){
  return isInRiver(x,y,river) ? .60 : 1;
}

export function collisionRadiusForObject(o){
  if(!o?.solid)return 0;
  if(o.type==='tree')return o.trunkR??Math.max(10,o.r*.34);
  return o.r??0;
}

export function buildFixedWorld({worldSize,presetKey,allocId}){
  const river=createRiver(worldSize);
  const houses=[];
  const objects=[];
  const crateSpawns=[];
  const lootSpawns=[];
  const navPoints=[];

  for(const placement of HOUSE_PLACEMENTS){
    if(presetKey==='quick'&&!placement.q)continue;

    const x=placement.x*worldSize;
    const y=placement.y*worldSize;

    const house=createHouseInstance({
      id:allocId(),
      x,y,
      rotation:placement.r,
      style:placement.s
    });

    houses.push(house);
    lootSpawns.push(...house.lootSpots);
    crateSpawns.push(...house.crateSpots);

    const e=houseEntrance(house);
    navPoints.push(
      {x:e.outsideX,y:e.outsideY,type:'house'},
      {x:e.insideX,y:e.insideY,type:'house'}
    );
  }

  // Fixed outdoor crates/loot keep the map authored while the item rolls vary.
  for(const [nx,ny] of OUTDOOR_CRATES){
    if(presetKey==='quick'&&(nx>.86||ny>.88))continue;
    crateSpawns.push(mapPoint(nx,ny,worldSize));
  }

  for(const [nx,ny] of FIELD_LOOT){
    lootSpawns.push(mapPoint(nx,ny,worldSize));
  }

  const nearHouse=(x,y,pad=45)=>
    houses.some(h=>
      x>h.x-pad&&
      x<h.x+h.w+pad&&
      y>h.y-pad&&
      y<h.y+h.h+pad
    );

  // Trees use a large visual canopy but a much smaller collision trunk.
  for(const [cx,cy] of TREE_CLUSTERS){
    for(let i=0;i<CLUSTER_OFFSETS.length;i++){
      const [ox,oy]=CLUSTER_OFFSETS[i];
      const p=mapPoint(cx,cy,worldSize);
      const canopy=30+(i%3)*3;

      const x=p.x+ox;
      const y=p.y+oy;

      if(nearHouse(x,y,56)||isInRiver(x,y,river))continue;

      objects.push({
        id:allocId(),
        type:'tree',
        x,
        y,
        r:canopy,
        trunkR:11+(i%2)*2,
        solid:true
      });
    }
  }

  for(const [nx,ny,r] of ROCKS){
    const p=mapPoint(nx,ny,worldSize);
    if(nearHouse(p.x,p.y,48)||isInRiver(p.x,p.y,river))continue;
    objects.push({id:allocId(),type:'rock',x:p.x,y:p.y,r,solid:true});
  }

  for(const [nx,ny,r] of BUSHES){
    const p=mapPoint(nx,ny,worldSize);
    if(nearHouse(p.x,p.y,22)||isInRiver(p.x,p.y,river))continue;
    objects.push({id:allocId(),type:'bush',x:p.x,y:p.y,r,solid:false});
  }

  // Bridge ends and map landmarks give roaming AI meaningful destinations.
  for(const bridge of river.bridges){
    navPoints.push(
      {x:bridge.x-70,y:bridge.y+bridge.h*.5,type:'bridge'},
      {x:bridge.x+bridge.w+70,y:bridge.y+bridge.h*.5,type:'bridge'},
      {x:bridge.x+bridge.w*.5,y:bridge.y+bridge.h*.5,type:'bridge'}
    );
  }

  for(const [nx,ny] of [
    [.12,.18],[.31,.11],[.18,.55],[.34,.82],
    [.66,.13],[.86,.18],[.70,.52],[.88,.74],
    [.38,.34],[.62,.36],[.38,.68],[.62,.68]
  ]){
    navPoints.push({...mapPoint(nx,ny,worldSize),type:'field'});
  }

  const spawnPoints=SPAWNS.map(([nx,ny])=>mapPoint(nx,ny,worldSize));

  return{
    houses,
    objects,
    crateSpawns,
    lootSpawns,
    navPoints,
    spawnPoints,
    river
  };
}

export function drawRiver(ctx,river,worldSize,zoom=1){
  if(!river)return;

  ctx.save();
  ctx.lineCap='round';
  ctx.lineJoin='round';

  ctx.strokeStyle='#4b7048';
  ctx.lineWidth=river.width+34;
  ctx.beginPath();
  river.centers.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();

  ctx.strokeStyle='#4c98b8';
  ctx.lineWidth=river.width;
  ctx.beginPath();
  river.centers.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();

  ctx.strokeStyle='rgba(204,238,246,.22)';
  ctx.lineWidth=Math.max(2,6/zoom);
  ctx.setLineDash([54,46]);
  ctx.beginPath();
  river.centers.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();
  ctx.setLineDash([]);

  for(const b of river.bridges){
    ctx.fillStyle='#765236';
    ctx.strokeStyle='#3a2b21';
    ctx.lineWidth=4/zoom;
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeRect(b.x,b.y,b.w,b.h);

    ctx.strokeStyle='#a87b4e';
    ctx.lineWidth=2/zoom;

    for(let x=b.x+14;x<b.x+b.w;x+=20){
      ctx.beginPath();
      ctx.moveTo(x,b.y+5);
      ctx.lineTo(x,b.y+b.h-5);
      ctx.stroke();
    }

    ctx.strokeStyle='#34271f';
    ctx.lineWidth=4/zoom;
    ctx.beginPath();
    ctx.moveTo(b.x,b.y+8);
    ctx.lineTo(b.x+b.w,b.y+8);
    ctx.moveTo(b.x,b.y+b.h-8);
    ctx.lineTo(b.x+b.w,b.y+b.h-8);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRiverMini(ctx,river,sx,sy){
  if(!river)return;

  ctx.save();
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.strokeStyle='#4b9fc0';
  ctx.lineWidth=Math.max(2,river.width*sx);
  ctx.beginPath();

  river.centers.forEach((p,i)=>{
    const x=p.x*sx,y=p.y*sy;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });

  ctx.stroke();

  ctx.fillStyle='#8c6039';
  for(const b of river.bridges){
    ctx.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);
  }

  ctx.restore();
}
