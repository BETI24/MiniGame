import {TILE,RNG,FIRST_NAMES,LAST_NAMES,JOB_TITLES,HAIR,BUILDS,EYE,clamp} from './NeonDossierData.js';
import {findPath,tileCenter,worldToTile} from './NeonDossierWorld.js';

export function createCitizens(city,seed='citizens',count=42){
  const rng=new RNG(seed);
  const citizens=[];
  const homes=[];
  for(const h of city.homeSlots){homes.push(h,h);}
  const shuffledHomes=rng.shuffle(homes);
  const workBuildings=city.buildings.filter(b=>b.type!=='apartments');
  const usedNames=new Set();

  for(let i=0;i<Math.min(count,shuffledHomes.length);i++){
    let name='';
    for(let tries=0;tries<40;tries++){
      name=`${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
      if(!usedNames.has(name)){usedNames.add(name);break;}
    }
    const home=shuffledHomes[i];
    const workplace=workBuildings[i%workBuildings.length];
    const jobTitle=rng.pick(JOB_TITLES[workplace.type]||JOB_TITLES.office);
    const wpos=workplace.workTiles[i%Math.max(1,workplace.workTiles.length)]||{x:workplace.entry.x,y:workplace.entry.y-1};
    const p=tileCenter(home.x,home.y);
    const citizen={
      id:`p${i}`,
      name,
      first:name.split(' ')[0],
      last:name.split(' ')[1],
      age:rng.int(22,67),
      hair:rng.pick(HAIR),
      eyes:rng.pick(EYE),
      build:rng.pick(BUILDS),
      shoe:rng.int(6,13),
      fingerprint:`FP-${String(rng.int(10,98)).padStart(2,'0')}-${String.fromCharCode(65+(i%26))}`,
      phone:`555-${String(1100+i).padStart(4,'0')}`,
      email:`${name.toLowerCase().replace(' ','.')}@citynet.local`,
      pin:String(rng.int(1000,9999)),
      jobTitle,
      workplaceId:workplace.id,
      workplaceName:workplace.name,
      homeId:home.id,
      homeBuildingId:home.buildingId,
      homeRoomId:home.roomId,
      address:home.address,
      homeTile:{x:home.x,y:home.y},
      workTile:{x:wpos.x,y:wpos.y},
      x:p.x,y:p.y,
      alive:true,
      color:`hsl(${rng.int(0,359)} 35% ${rng.int(55,70)}%)`,
      friends:[],coworkers:[],household:[],
      state:'home',targetState:'home',targetTile:{x:home.x,y:home.y},
      path:[],pathIndex:0,pathCooldown:rng.float(0,.8),speed:rng.float(42,58),
      idle:rng.float(0,2),facing:rng.float(0,Math.PI*2),
      knowsPlayer:false,accessGranted:false,lastSeenPlayer:-999,
      caseNotes:[]
    };
    citizens.push(citizen);
  }

  // Household relationships.
  const byHome=new Map();
  for(const c of citizens){
    const arr=byHome.get(c.homeId)||[];arr.push(c);byHome.set(c.homeId,arr);
  }
  for(const arr of byHome.values())for(const c of arr)c.household=arr.filter(x=>x.id!==c.id).map(x=>x.id);

  // Coworkers and a few friends.
  const byWork=new Map();
  for(const c of citizens){const arr=byWork.get(c.workplaceId)||[];arr.push(c);byWork.set(c.workplaceId,arr);}
  for(const arr of byWork.values())for(const c of arr)c.coworkers=arr.filter(x=>x.id!==c.id).map(x=>x.id);
  for(const c of citizens){
    const pool=citizens.filter(x=>x.id!==c.id&&!c.household.includes(x.id));
    for(const f of rng.shuffle(pool).slice(0,rng.int(1,3))){
      if(!c.friends.includes(f.id))c.friends.push(f.id);
      if(!f.friends.includes(c.id))f.friends.push(c.id);
    }
  }
  return citizens;
}

export function citizenById(citizens,id){return citizens.find(c=>c.id===id)||null;}

export function scheduleFor(c,minutes,city){
  const hour=((minutes/60)%24+24)%24;
  if(hour<6.5)return {state:'home',tile:c.homeTile};
  if(hour<7.5)return {state:'commute-work',tile:c.workTile};
  if(hour<12)return {state:'work',tile:c.workTile};
  if(hour<13){
    const diner=city.buildings.find(b=>b.type==='diner');
    return diner?{state:'lunch',tile:{x:diner.entry.x,y:diner.entry.y-1}}:{state:'work',tile:c.workTile};
  }
  if(hour<16.5)return {state:'work',tile:c.workTile};
  if(hour<18)return {state:'commute-home',tile:c.homeTile};
  if(hour<20.5){
    const target=(Number(c.id.slice(1))%2===0?city.buildings.find(b=>b.type==='bar'):city.buildings.find(b=>b.type==='diner'));
    return target?{state:'leisure',tile:{x:target.entry.x,y:target.entry.y-1}}:{state:'home',tile:c.homeTile};
  }
  return {state:'home',tile:c.homeTile};
}

export function updateCitizens(city,citizens,dt,gameMinutes){
  for(const c of citizens){
    if(!c.alive)continue;
    c.pathCooldown-=dt;
    c.idle=Math.max(0,c.idle-dt);
    const desired=scheduleFor(c,gameMinutes,city);
    if(desired.state!==c.targetState||Math.abs(desired.tile.x-c.targetTile.x)+Math.abs(desired.tile.y-c.targetTile.y)>0){
      c.targetState=desired.state;c.targetTile={...desired.tile};c.path=[];c.pathIndex=0;c.pathCooldown=0;
    }
    const ct=worldToTile(c.x,c.y);
    const atTarget=Math.abs(ct.x-c.targetTile.x)+Math.abs(ct.y-c.targetTile.y)<=1;
    if(atTarget){
      c.state=c.targetState;
      if(c.idle<=0){c.idle=.8+(Number(c.id.slice(1))%5)*.33;c.facing+=((Number(c.id.slice(1))%3)-1)*.55;}
      continue;
    }
    if((!c.path.length||c.pathIndex>=c.path.length)&&c.pathCooldown<=0){
      c.path=findPath(city,ct,c.targetTile,{npc:true});c.pathIndex=0;c.pathCooldown=1.2;
    }
    const node=c.path[c.pathIndex];
    if(!node)continue;
    const p=tileCenter(node.x,node.y),dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy);
    if(d<5){c.pathIndex++;continue;}
    const step=Math.min(d,c.speed*dt),nx=dx/d,ny=dy/d;
    c.x+=nx*step;c.y+=ny*step;c.facing=Math.atan2(ny,nx);
  }
}

export function getCitizenDescriptor(c){
  return `${c.build} build, ${c.hair} hair, ${c.eyes} eyes`;
}

export function nearbyCitizens(citizens,x,y,r=90){
  return citizens.filter(c=>c.alive&&Math.hypot(c.x-x,c.y-y)<=r);
}
