import {TILE,RNG,BUILDING_NAMES,STREET_NAMES,tileKey,clamp} from './NeonDossierData.js';

const TYPES={GRASS:'grass',ROAD:'road',SIDEWALK:'sidewalk',FLOOR:'floor',WALL:'wall'};

function makeTile(type=TYPES.GRASS){
  return {type,zone:'public',buildingId:null,roomId:null};
}

export function createCity(seed='city-1'){
  const rng=new RNG(seed);
  const blocksX=4,blocksY=3,blockW=13,blockH=13,roadW=3;
  const width=blocksX*blockW+(blocksX+1)*roadW;
  const height=blocksY*blockH+(blocksY+1)*roadW;
  const grid=Array.from({length:height},()=>Array.from({length:width},()=>makeTile()));
  const city={seed,width,height,worldW:width*TILE,worldH:height*TILE,grid,buildings:[],doors:[],objects:[],homeSlots:[],jobSlots:[],navPoints:[],streets:[],rng};

  const set=(x,y,type,extra={})=>{
    if(x<0||y<0||x>=width||y>=height)return;
    grid[y][x]={...grid[y][x],type,...extra};
  };

  // Roads form the stable navigation skeleton.
  for(let bx=0;bx<=blocksX;bx++){
    const sx=bx*(blockW+roadW);
    for(let x=sx;x<sx+roadW;x++)for(let y=0;y<height;y++)set(x,y,TYPES.ROAD);
    city.streets.push({axis:'v',tile:sx+1,name:rng.pick(STREET_NAMES)});
  }
  for(let by=0;by<=blocksY;by++){
    const sy=by*(blockH+roadW);
    for(let y=sy;y<sy+roadW;y++)for(let x=0;x<width;x++)set(x,y,TYPES.ROAD);
    city.streets.push({axis:'h',tile:sy+1,name:rng.pick(STREET_NAMES)});
  }

  // Sidewalks around each city block.
  for(let by=0;by<blocksY;by++){
    for(let bx=0;bx<blocksX;bx++){
      const ox=roadW+bx*(blockW+roadW);
      const oy=roadW+by*(blockH+roadW);
      for(let y=oy;y<oy+blockH;y++)for(let x=ox;x<ox+blockW;x++){
        const edge=x===ox||x===ox+blockW-1||y===oy||y===oy+blockH-1;
        set(x,y,edge?TYPES.SIDEWALK:TYPES.GRASS);
      }
    }
  }

  const types=rng.shuffle([
    'apartments','apartments','apartments','apartments','apartments','apartments',
    'office','diner','bar','pharmacy','records','electronics'
  ]);

  let bi=0;
  for(let by=0;by<blocksY;by++){
    for(let bx=0;bx<blocksX;bx++){
      const ox=roadW+bx*(blockW+roadW);
      const oy=roadW+by*(blockH+roadW);
      const type=types[bi++];
      const b=buildBuilding(city,set,rng,type,ox+2,oy+2,9,9);
      city.buildings.push(b);
    }
  }

  // Public navigation points at road intersections and building entrances.
  for(const b of city.buildings){
    city.navPoints.push({x:b.entry.x,y:b.entry.y,kind:'entry',buildingId:b.id});
    city.navPoints.push({x:b.entry.x,y:b.entry.y+1,kind:'street',buildingId:b.id});
  }
  for(let by=0;by<=blocksY;by++)for(let bx=0;bx<=blocksX;bx++){
    const x=clamp(bx*(blockW+roadW)+1,0,width-1);
    const y=clamp(by*(blockH+roadW)+1,0,height-1);
    city.navPoints.push({x,y,kind:'intersection'});
  }

  // Simple decorative street lamps / cameras.
  for(const b of city.buildings){
    city.objects.push({id:`lamp-${b.id}`,kind:'lamp',x:(b.entry.x+.5)*TILE,y:(b.entry.y+1.5)*TILE,solid:false,buildingId:null,roomId:null});
    if(rng.chance(.62)){
      city.objects.push({id:`cam-${b.id}`,kind:'camera',x:(b.entry.x+.5)*TILE,y:(b.entry.y+.15)*TILE,solid:false,buildingId:b.id,roomId:null,range:260});
    }
  }

  return city;
}

function buildBuilding(city,set,rng,type,x0,y0,w,h){
  const id=`b${city.buildings.length}`;
  const name=rng.pick(BUILDING_NAMES[type]||BUILDING_NAMES.office);
  const b={id,type,name,x:x0,y:y0,w,h,rooms:[],entry:{x:x0+Math.floor(w/2),y:y0+h-1},workTiles:[],homeUnits:[],public:true};

  // Base floor and perimeter.
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
    const border=x===x0||x===x0+w-1||y===y0||y===y0+h-1;
    set(x,y,border?TYPES.WALL:TYPES.FLOOR,{buildingId:id,zone:'public'});
  }
  // Outer entry is always open and public.
  set(b.entry.x,b.entry.y,TYPES.FLOOR,{buildingId:id,zone:'public'});
  city.doors.push({id:`door-${id}-outer`,x:b.entry.x,y:b.entry.y,buildingId:id,roomId:'lobby',locked:false,private:false,label:`${name} entrance`});

  if(type==='apartments') buildApartments(city,set,rng,b);
  else if(type==='office') buildOffice(city,set,rng,b);
  else if(type==='diner') buildDiner(city,set,rng,b);
  else if(type==='bar') buildBar(city,set,rng,b);
  else if(type==='pharmacy') buildPharmacy(city,set,rng,b);
  else if(type==='records') buildRecords(city,set,rng,b);
  else if(type==='electronics') buildElectronics(city,set,rng,b);

  return b;
}

function addObject(city,b,kind,tx,ty,roomId,extra={}){
  const o={id:`o${city.objects.length}`,kind,x:(tx+.5)*TILE,y:(ty+.5)*TILE,tx,ty,buildingId:b.id,roomId,solid:false,...extra};
  city.objects.push(o);return o;
}

function room(city,set,b,id,x,y,w,h,zone='private'){
  const r={id,x,y,w,h,zone,buildingId:b.id};b.rooms.push(r);
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
    if(city.grid[yy]?.[xx]?.type==='floor')set(xx,yy,'floor',{buildingId:b.id,roomId:id,zone});
  }
  return r;
}

function wallV(city,set,b,x,y1,y2,doorY=null,doorMeta={}){
  for(let y=y1;y<=y2;y++)set(x,y,'wall',{buildingId:b.id,zone:'private'});
  if(doorY!==null){
    set(x,doorY,'floor',{buildingId:b.id,roomId:doorMeta.roomId||null,zone:doorMeta.private?'private':'public'});
    city.doors.push({id:`door-${b.id}-${city.doors.length}`,x,y:doorY,buildingId:b.id,roomId:doorMeta.roomId||null,locked:!!doorMeta.locked,private:!!doorMeta.private,label:doorMeta.label||'Interior door'});
  }
}
function wallH(city,set,b,y,x1,x2,doorX=null,doorMeta={}){
  for(let x=x1;x<=x2;x++)set(x,y,'wall',{buildingId:b.id,zone:'private'});
  if(doorX!==null){
    set(doorX,y,'floor',{buildingId:b.id,roomId:doorMeta.roomId||null,zone:doorMeta.private?'private':'public'});
    city.doors.push({id:`door-${b.id}-${city.doors.length}`,x:doorX,y,buildingId:b.id,roomId:doorMeta.roomId||null,locked:!!doorMeta.locked,private:!!doorMeta.private,label:doorMeta.label||'Interior door'});
  }
}

function buildApartments(city,set,rng,b){
  const x=b.x,y=b.y,w=b.w,h=b.h,cx=x+4;
  // One-tile central hall with four private units. Walls are deterministic so
  // the player can learn the building layout instead of fighting proc-gen rooms.
  wallV(city,set,b,cx-1,y+1,y+h-2,null);
  wallV(city,set,b,cx+1,y+1,y+h-2,null);
  wallH(city,set,b,y+4,x+1,cx-1,null);
  wallH(city,set,b,y+4,cx+1,x+w-2,null);
  for(let yy=y+1;yy<y+h-1;yy++)set(cx,yy,'floor',{buildingId:b.id,roomId:'hall',zone:'public'});

  const units=[
    room(city,set,b,'unitA',x+1,y+1,3,3,'private'),
    room(city,set,b,'unitB',x+5,y+1,3,3,'private'),
    room(city,set,b,'unitC',x+1,y+5,3,3,'private'),
    room(city,set,b,'unitD',x+5,y+5,3,3,'private')
  ];
  const doors=[
    {x:cx-1,y:y+2,roomId:'unitA'},{x:cx+1,y:y+2,roomId:'unitB'},
    {x:cx-1,y:y+6,roomId:'unitC'},{x:cx+1,y:y+6,roomId:'unitD'}
  ];
  for(const d of doors){
    set(d.x,d.y,'floor',{buildingId:b.id,roomId:d.roomId,zone:'private'});
    city.doors.push({id:`door-${b.id}-${city.doors.length}`,x:d.x,y:d.y,buildingId:b.id,roomId:d.roomId,locked:true,private:true,label:`${nameForUnit(d.roomId)} door`});
  }

  for(const u of units){
    const left=u.id==='unitA'||u.id==='unitC';
    const fx=left?u.x:u.x+1;
    const gx=left?u.x+1:u.x+2;
    const center={x:gx,y:u.y+1};
    const slot={id:`home-${b.id}-${u.id}`,buildingId:b.id,roomId:u.id,x:center.x,y:center.y,address:`${b.name}, ${u.id.replace('unit','Unit ')}`};
    b.homeUnits.push(slot);city.homeSlots.push(slot);
    addObject(city,b,'bed',fx,u.y+1,u.id,{solid:true});
    addObject(city,b,'addressbook',fx,u.y+2,u.id);
    addObject(city,b,'phone',gx,u.y+1,u.id);
    addObject(city,b,'trash',gx,u.y+2,u.id);
  }
  addObject(city,b,'mailboxes',b.x+2,b.y+b.h-2,'hall');
}
function nameForUnit(id){return id.replace('unit','Unit ');}

function buildOffice(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+3,x+1,x+b.w-2,x+4,{roomId:'office',private:true,locked:true,label:'Staff office'});
  room(city,set,b,'lobby',x+1,y+4,b.w-2,3,'public');
  room(city,set,b,'office',x+1,y+1,b.w-2,2,'private');
  for(let i=0;i<5;i++){
    const tx=x+1+(i%4)*2,ty=y+1+Math.floor(i/4);
    b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});
    addObject(city,b,'desk',tx,ty,'office',{solid:true});
  }
  addObject(city,b,'employeeTerminal',x+7,y+2,'office');
  addObject(city,b,'emailTerminal',x+6,y+2,'office');
  addObject(city,b,'cctvTerminal',x+2,y+5,'lobby');
}

function buildDiner(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+3,x+1,x+b.w-2,x+6,{roomId:'kitchen',private:true,locked:false,label:'Kitchen'});
  room(city,set,b,'kitchen',x+1,y+1,b.w-2,2,'private');
  room(city,set,b,'dining',x+1,y+4,b.w-2,3,'public');
  for(const p of [[2,5],[4,5],[6,5],[2,6],[5,6]])addObject(city,b,'table',x+p[0]-1,y+p[1]-1,'dining',{solid:true});
  for(let i=0;i<4;i++){const tx=x+2+i,ty=y+2;b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});}
  addObject(city,b,'register',x+6,y+4,'dining');
  addObject(city,b,'trash',x+7,y+2,'kitchen');
  addObject(city,b,'noticeboard',x+1,y+6,'dining');
}

function buildBar(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+2,x+1,x+b.w-2,x+6,{roomId:'stock',private:true,locked:true,label:'Stock room'});
  room(city,set,b,'stock',x+1,y+1,b.w-2,1,'private');
  room(city,set,b,'bar',x+1,y+3,b.w-2,4,'public');
  for(let i=0;i<4;i++){const tx=x+2+i*1,ty=y+2;b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});}
  for(const p of [[2,5],[4,6],[6,5]])addObject(city,b,'table',x+p[0]-1,y+p[1]-1,'bar',{solid:true});
  addObject(city,b,'register',x+6,y+4,'bar');
  addObject(city,b,'cctvTerminal',x+1,y+4,'bar');
}

function buildPharmacy(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+3,x+1,x+b.w-2,x+5,{roomId:'back',private:true,locked:true,label:'Pharmacy back room'});
  room(city,set,b,'back',x+1,y+1,b.w-2,2,'private');room(city,set,b,'shop',x+1,y+4,b.w-2,3,'public');
  for(let i=0;i<4;i++){const tx=x+2+i,ty=y+2;b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});}
  addObject(city,b,'employeeTerminal',x+7,y+2,'back');
  addObject(city,b,'register',x+6,y+5,'shop');
}

function buildRecords(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+3,x+1,x+b.w-2,x+4,{roomId:'archive',private:true,locked:true,label:'Records archive'});
  room(city,set,b,'archive',x+1,y+1,b.w-2,2,'private');room(city,set,b,'lobby',x+1,y+4,b.w-2,3,'public');
  for(let i=0;i<4;i++){const tx=x+2+i,ty=y+2;b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});}
  addObject(city,b,'directoryTerminal',x+2,y+5,'lobby');
  addObject(city,b,'employeeTerminal',x+7,y+2,'archive');
  addObject(city,b,'cctvTerminal',x+6,y+5,'lobby');
  addObject(city,b,'noticeboard',x+1,y+5,'lobby');
}

function buildElectronics(city,set,rng,b){
  const x=b.x,y=b.y;
  wallH(city,set,b,y+3,x+1,x+b.w-2,x+6,{roomId:'workshop',private:true,locked:true,label:'Workshop'});
  room(city,set,b,'workshop',x+1,y+1,b.w-2,2,'private');room(city,set,b,'shop',x+1,y+4,b.w-2,3,'public');
  for(let i=0;i<4;i++){const tx=x+2+i,ty=y+2;b.workTiles.push({x:tx,y:ty});city.jobSlots.push({buildingId:b.id,x:tx,y:ty,type:b.type});}
  addObject(city,b,'shopCounter',x+6,y+5,'shop',{shop:true});
  addObject(city,b,'employeeTerminal',x+7,y+2,'workshop');
}

export function tileAt(city,tx,ty){return city.grid[ty]?.[tx]||null;}
export function worldToTile(x,y){return {x:Math.floor(x/TILE),y:Math.floor(y/TILE)};}
export function tileCenter(tx,ty){return {x:(tx+.5)*TILE,y:(ty+.5)*TILE};}
export function isWall(city,tx,ty){return tileAt(city,tx,ty)?.type==='wall';}
export function doorAt(city,tx,ty){return city.doors.find(d=>d.x===tx&&d.y===ty)||null;}
export function objectAtTile(city,tx,ty){return city.objects.filter(o=>o.tx===tx&&o.ty===ty);}

export function isPlayerWalkable(city,tx,ty){
  const t=tileAt(city,tx,ty);if(!t||t.type==='wall')return false;
  const d=doorAt(city,tx,ty);if(d?.locked)return false;
  return true;
}
export function isNpcWalkable(city,tx,ty){
  const t=tileAt(city,tx,ty);return !!t&&t.type!=='wall';
}

export function findPath(city,start,end,{npc=true,maxNodes=5000}={}){
  const sx=Math.floor(start.x),sy=Math.floor(start.y),ex=Math.floor(end.x),ey=Math.floor(end.y);
  if(sx===ex&&sy===ey)return [];
  const walk=npc?isNpcWalkable:isPlayerWalkable;
  const open=[{x:sx,y:sy,g:0,f:Math.abs(ex-sx)+Math.abs(ey-sy)}];
  const came=new Map(),gScore=new Map([[tileKey(sx,sy),0]]),closed=new Set();
  let count=0;
  while(open.length&&count++<maxNodes){
    let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
    const cur=open.splice(best,1)[0],ck=tileKey(cur.x,cur.y);
    if(cur.x===ex&&cur.y===ey){
      const path=[];let k=ck,c={x:ex,y:ey};
      while(k!==tileKey(sx,sy)){
        path.push(c);const p=came.get(k);if(!p)break;c=p;k=tileKey(c.x,c.y);
      }
      path.reverse();return path;
    }
    if(closed.has(ck))continue;closed.add(ck);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cur.x+dx,ny=cur.y+dy,nk=tileKey(nx,ny);
      if(closed.has(nk)||!walk(city,nx,ny))continue;
      const ng=cur.g+1;
      if(ng<(gScore.get(nk)??Infinity)){
        gScore.set(nk,ng);came.set(nk,{x:cur.x,y:cur.y});
        open.push({x:nx,y:ny,g:ng,f:ng+Math.abs(ex-nx)+Math.abs(ey-ny)});
      }
    }
  }
  return [];
}

export function lineOfSight(city,a,b){
  const ax=a.x/TILE,ay=a.y/TILE,bx=b.x/TILE,by=b.y/TILE;
  const steps=Math.ceil(Math.hypot(bx-ax,by-ay)*3);
  for(let i=1;i<steps;i++){
    const t=i/steps,tx=Math.floor(ax+(bx-ax)*t),ty=Math.floor(ay+(by-ay)*t);
    if(isWall(city,tx,ty))return false;
  }
  return true;
}

export function nearestRoadTile(city,from){
  const s=worldToTile(from.x,from.y);let best=null,bd=Infinity;
  for(let y=0;y<city.height;y++)for(let x=0;x<city.width;x++)if(city.grid[y][x].type==='road'){
    const d=Math.abs(x-s.x)+Math.abs(y-s.y);if(d<bd){bd=d;best={x,y};}
  }
  return best||{x:1,y:1};
}

export {TYPES};
