import {WEAPONS,WEAPON_IDS,DIFFICULTIES,MODES,ARENAS,TANK_COLORS,MATCH_DEFAULTS} from "./CraterClashData.js";
import {getWeaponTierStats,rollWeaponTier,getRogueEnemyScale,rogueAllowedWeaponIds} from "./CraterClashProgression.js";
export const GRAVITY=150;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const rint=(a,b)=>Math.floor(rand(a,b+1));

export function createTerrain(width,height,arenaIndex=0){
  const arena=ARENAS[arenaIndex]||ARENAS[0];
  const arr=new Float32Array(Math.ceil(width)+2);
  const phases=Array.from({length:arena.hills},()=>rand(0,Math.PI*2));
  const amps=Array.from({length:arena.hills},(_,i)=>height*(.018+arena.roughness*.010)/(1+i*.20));
  for(let x=0;x<arr.length;x++){
    let y=height*arena.base;
    for(let i=0;i<arena.hills;i++){
      const freq=(i+1)*Math.PI*2/width*(.55+i*.22);
      y+=Math.sin(x*freq+phases[i])*amps[i];
    }
    y+=Math.sin(x*.011+phases[0])*height*.015*arena.roughness;
    arr[x]=clamp(y,height*.42,height*.86);
  }
  for(let pass=0;pass<4;pass++){
    const copy=arr.slice();
    for(let x=2;x<arr.length-2;x++)arr[x]=(copy[x-2]+copy[x-1]+copy[x]*2+copy[x+1]+copy[x+2])/6;
  }
  return arr;
}
export const terrainY=(s,x)=>s.terrain[clamp(Math.round(x),0,s.terrain.length-1)];
export const terrainSlope=(s,x)=>Math.atan2(terrainY(s,x+4)-terrainY(s,x-4),8);

export function modifyTerrainCrater(s,cx,cy,radius,depthScale=1){
  const r=Math.max(5,radius),a=Math.max(0,Math.floor(cx-r)),b=Math.min(s.terrain.length-1,Math.ceil(cx+r));
  for(let x=a;x<=b;x++){
    const dx=(x-cx)/r;if(Math.abs(dx)>1)continue;
    const bowl=Math.sqrt(Math.max(0,1-dx*dx));
    const desired=cy+bowl*r*.70*depthScale;
    if(desired>s.terrain[x])s.terrain[x]=Math.min(s.height-5,desired);
  }
}
export function modifyTerrainRaise(s,cx,radius,height){
  const a=Math.max(0,Math.floor(cx-radius)),b=Math.min(s.terrain.length-1,Math.ceil(cx+radius));
  for(let x=a;x<=b;x++){
    const t=Math.abs(x-cx)/radius;if(t>1)continue;
    s.terrain[x]=Math.max(s.height*.20,s.terrain[x]-(1-Math.pow(t,1.7))*height);
  }
}

function weaponDef(id,tier=1){return getWeaponTierStats(id,tier);}

function windSettingMultiplier(v){
  return v==="off"?0:v==="low"?.55:v==="extreme"?1.65:1;
}
function densityChance(v){return v==="off"?0:v==="low"?.28:v==="high"?.90:.58;}

function normalizeSettings(settings={}){
  return {...MATCH_DEFAULTS,...settings};
}

function rollSpecialSlot({maxTier=4,luck=0,airdrop=false,botBonus=0,usedIds=null,allowedIds=null}={}){
  const allowed=allowedIds?.length?new Set(allowedIds):null;
  let pool=WEAPON_IDS.filter(id=>id!=="pulse"&&(!allowed||allowed.has(id))&&(!usedIds||!usedIds.has(id)));
  if(!pool.length)pool=WEAPON_IDS.filter(id=>id!=="pulse"&&(!allowed||allowed.has(id)));
  const id=pool[rint(0,pool.length-1)];
  const tier=rollWeaponTier({airdrop,maxTier,luck,botBonus,weaponId:id});
  return {id,tier,ammo:1};
}

function makeInventory(count=13,{maxTier=4,luck=0,botBonus=0,allowedIds=null}={}){
  const chosen=[{id:"pulse",tier:1,ammo:999}],used=new Set(["pulse"]);
  while(chosen.length<count){
    const slot=rollSpecialSlot({maxTier,luck,botBonus,usedIds:used,allowedIds});
    chosen.push(slot);used.add(slot.id);
  }
  return chosen;
}
function tankGround(s,t){return terrainY(s,t.x)-11;}

function spawnSkillSet(s,initial=false){
  const chance=densityChance(s.settings.skillObjects);
  if(chance<=0)return;
  if(!initial){
    for(const o of s.skillObjects)o.roundsLeft--;
    s.skillObjects=s.skillObjects.filter(o=>o.roundsLeft>0);
  }
  if(!initial&&Math.random()>chance)return;
  const max=s.settings.skillObjects==="high"?3:2;
  const count=1+(Math.random()<chance*.38&&s.skillObjects.length<max?1:0);
  for(let n=0;n<count && s.skillObjects.length<max;n++){
    const roll=Math.random();
    if(roll<.34){
      const x=rand(s.width*.23,s.width*.77),ground=terrainY(s,x);
      s.skillObjects.push({id:s.nextId++,kind:"multiplier",x,y:rand(s.height*.22,Math.max(s.height*.26,ground-75)),r:20,value:2,roundsLeft:2});
    }else if(roll<.68){
      const x=rand(s.width*.22,s.width*.78),ground=terrainY(s,x);
      s.skillObjects.push({id:s.nextId++,kind:"bumper",x,y:rand(s.height*.24,Math.max(s.height*.28,ground-65)),len:rand(80,135),angle:rand(-.65,.65),roundsLeft:3});
    }else{
      if(max-s.skillObjects.length<2){
        const x=rand(s.width*.23,s.width*.77),ground=terrainY(s,x);
        s.skillObjects.push({id:s.nextId++,kind:"multiplier",x,y:rand(s.height*.22,Math.max(s.height*.26,ground-75)),r:20,value:2,roundsLeft:2});
      }else{
        const pair=s.nextId++;
        let x1=rand(s.width*.18,s.width*.42),x2=rand(s.width*.58,s.width*.84);
        let y1=rand(s.height*.24,Math.max(s.height*.28,terrainY(s,x1)-80));
        let y2=rand(s.height*.24,Math.max(s.height*.28,terrainY(s,x2)-80));
        s.skillObjects.push({id:s.nextId++,kind:"portal",pair,x:x1,y:y1,r:21,roundsLeft:3,color:"#7be7ff"});
        s.skillObjects.push({id:s.nextId++,kind:"portal",pair,x:x2,y:y2,r:21,roundsLeft:3,color:"#d487ff"});
      }
    }
  }
}

function maybeSpawnCrate(s){
  if(s.crate||Math.random()>densityChance(s.settings.crates))return;
  s.crate={x:rand(s.width*.18,s.width*.82),y:-25,vy:0,alive:true,quality:"airdrop"};
}

export function createState({width,height,mode="ffa",difficulty="normal",arenaIndex=0,settings={},rogueRun=null}={}){
  const arena=ARENAS[arenaIndex]||ARENAS[0],m=MODES[mode],baseDiff=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
  const cfg=normalizeSettings(settings),rogueScale=rogueRun?getRogueEnemyScale(rogueRun):null;
  let tankCount=mode==="duel"?2:Math.max(2,Math.min(8,Number(cfg.playerCount)||m.tanks||4));
  if(mode==="teams"&&tankCount%2)tankCount++;
  const diff=rogueRun?{...baseDiff,aiSamples:rogueScale.samples,aimError:rogueScale.aimError,powerError:rogueScale.powerError}:baseDiff;
  const windMult=windSettingMultiplier(cfg.wind);
  const s={
    width,height,mode,difficulty,diff,arenaIndex,arena,settings:cfg,rogueRun,rogueScale,
    terrain:createTerrain(width,height,arenaIndex),
    wind:windMult?rand(-32,32)*arena.wind*windMult:0,windMult,gravity:GRAVITY*(arena.gravity||1),
    tanks:[],projectiles:[],fx:[],fields:[],fires:[],skillObjects:[],
    current:0,round:1,turnTime:Number(cfg.turnTime)||28,turnTimer:Number(cfg.turnTime)||28,phase:"aim",shotInProgress:false,nextTurnDelay:0,
    gameOver:false,winner:null,message:"YOUR TURN",messageTimer:1.8,cameraShake:0,
    selectedWeapon:"pulse",selectedTier:1,playerAngle:Math.PI*.25,playerPower:58,nextId:1,crate:null,
    lastShotTraces:[],traceCurrent:[],skillHits:0,damageNumbers:[],damageSummary:null,activeShotSummary:null
  };
  const margin=width*.075,xs=[];
  for(let i=0;i<tankCount;i++)xs.push(margin+(width-margin*2)*(i/Math.max(1,tankCount-1)));
  for(let i=1;i<xs.length-1;i++)xs[i]+=rand(-width*.018,width*.018);

  const standardShared=rogueRun?null:makeInventory(cfg.weaponCount,{maxTier:4,luck:0});
  for(let i=0;i<tankCount;i++){
    const team=mode==="teams"?(i<tankCount/2?0:1):i,isPlayer=i===0,x=clamp(xs[i],25,width-25);
    const angle=i<tankCount/2?Math.PI*.25:Math.PI*.75;
    let maxHp=Number(cfg.hp)||100,maxFuel=Number(cfg.fuel)||100,grip=.70,critChance=.03,critMultiplier=1.5,luck=0,maxTier=4,startArmor=0,weaponCount=cfg.weaponCount,damageBonus=1,overchargeRate=1,airdropWeapons=1,crateArmorBonus=0;
    let inv;
    if(rogueRun){
      if(isPlayer){
        const rs=rogueRun.stats;
        maxHp=rs.maxHp;maxFuel=rs.maxFuel;grip=rs.grip;critChance=rs.critChance;critMultiplier=rs.critMultiplier||1.5;luck=rs.luck;maxTier=rs.maxTier;startArmor=rs.startArmor;weaponCount=rs.weaponCount;damageBonus=rs.damageBonus;overchargeRate=rs.overchargeRate||1;airdropWeapons=rs.airdropWeapons||1;crateArmorBonus=rs.crateArmorBonus||0;
        const allowed=rogueAllowedWeaponIds(rs.weaponPoolLevel);
        inv=makeInventory(weaponCount,{maxTier,luck,allowedIds:allowed});
      }else{
        maxHp=Math.round((Number(cfg.hp)||100)*rogueScale.hp*(rogueScale.boss?1.35:1));
        maxFuel=rogueScale.fuel;grip=rogueScale.grip;critChance=rogueScale.critChance;critMultiplier=rogueScale.critMultiplier||1.5;luck=rogueScale.tierBonus;maxTier=rogueScale.maxTier;startArmor=rogueScale.armor+(rogueScale.boss?20:0);weaponCount=rogueScale.weaponCount;damageBonus=rogueScale.damageBonus||1;
        const allowed=rogueAllowedWeaponIds(rogueScale.weaponPoolLevel);
        inv=makeInventory(weaponCount,{maxTier,luck,botBonus:rogueScale.tierBonus,allowedIds:allowed});
      }
    }else inv=standardShared.map(v=>({...v}));
    const fuelEfficiency=rogueRun&&isPlayer?rogueRun.stats.fuelEfficiency:1;
    s.tanks.push({
      id:s.nextId++,name:isPlayer?"YOU":mode==="teams"&&team===0?`ALLY ${i}`:`BOT ${i}`,isPlayer,team,x,y:s.terrain[Math.round(x)]-11,
      hp:maxHp,maxHp,armor:startArmor,alive:true,color:TANK_COLORS[i%TANK_COLORS.length],angle,power:58,
      inventory:inv,selected:"pulse",selectedTier:1,overcharge:0,overchargeReady:false,kills:0,damage:0,
      maxFuel,fuel:maxFuel,grip,fuelEfficiency,critChance,critMultiplier,luck,maxTier,damageBonus,overchargeRate,airdropWeapons,crateArmorBonus,
      allowedWeaponIds:rogueRun?(isPlayer?rogueAllowedWeaponIds(rogueRun.stats.weaponPoolLevel):rogueAllowedWeaponIds(rogueScale.weaponPoolLevel)):WEAPON_IDS.filter(id=>id!=="pulse")
    });
  }
  s.playerAngle=s.tanks[0].angle;
  spawnSkillSet(s,true);
  return s;
}
export const currentTank=s=>s.tanks[s.current]||null;
export function isEnemy(s,a,b){return !!(a&&b&&a.alive&&b.alive&&a.id!==b.id&&(s.mode==="teams"?a.team!==b.team:true));}
export const aliveEnemies=(s,t)=>s.tanks.filter(x=>isEnemy(s,t,x));
export function selectWeapon(s,t,id,tier=null){
  const candidates=t.inventory.filter(x=>x.id===id&&x.ammo>0&&(tier==null||x.tier===tier));
  const slot=candidates.sort((a,b)=>b.tier-a.tier)[0];if(!slot)return false;
  t.selected=id;t.selectedTier=slot.tier||1;
  if(t.isPlayer){s.selectedWeapon=id;s.selectedTier=t.selectedTier;}
  return true;
}
function consume(t,id,tier){if(id==="pulse")return;const x=t.inventory.find(v=>v.id===id&&v.tier===tier&&v.ammo>0);if(x)x.ammo=Math.max(0,x.ammo-1);}

export function addWeaponReward(s,t,{airdrop=false}={}){
  const used=new Set();
  const slot=rollSpecialSlot({maxTier:t.maxTier,luck:t.luck,airdrop,botBonus:0,usedIds:used,allowedIds:t.allowedWeaponIds});
  const same=t.inventory.find(v=>v.id===slot.id&&v.tier===slot.tier);
  if(same)same.ammo++;
  else{
    const lower=t.inventory.find(v=>v.id===slot.id&&v.tier<slot.tier);
    if(lower&&Math.random()<.55){lower.tier=slot.tier;lower.ammo=Math.max(1,lower.ammo);}
    else t.inventory.push(slot);
  }
  return slot;
}

export function moveTank(s,t,dir,distance=5){
  if(!s||!t?.alive||s.phase!=="aim"||currentTank(s)?.id!==t.id||t.fuel<=0)return false;
  dir=Math.sign(dir);if(!dir)return false;
  const step=Math.min(Math.abs(distance),Math.max(1,t.fuel));
  const nx=clamp(t.x+dir*step,9,s.width-9);
  const slope=Math.abs(terrainSlope(s,nx));
  if(slope>t.grip){s.message="TRACKS CAN'T CLIMB THIS SLOPE";s.messageTimer=.6;return false;}
  const cost=step*(1+slope*1.85)*(t.fuelEfficiency||1);
  if(cost>t.fuel+.01)return false;
  t.fuel=Math.max(0,t.fuel-cost);t.x=nx;t.y=tankGround(s,t);
  return true;
}

function projectileBase(s,t,angle,power,weaponId,tier=1,extra={}){
  const speed=(85+power*3.05)*(extra.launchSpeedMult||1);
  return {id:s.nextId++,owner:t.id,weaponId,tier,x:t.x+Math.cos(angle)*18,y:t.y-8-Math.sin(angle)*18,
    vx:Math.cos(angle)*speed,vy:-Math.sin(angle)*speed,age:0,alive:true,radius:4,bounces:0,wallBounces:0,
    trace:[],traceTimer:0,portalCooldown:0,bumperCooldown:0,critShot:false,x2Active:false,...extra};
}

export function fire(s,t,angle,power,weaponId=t.selected,weaponTier=t.selectedTier||1){
  if(!t?.alive||s.shotInProgress)return false;
  const slot=t.inventory.find(x=>x.id===weaponId&&x.tier===weaponTier&&x.ammo>0);if(!slot)return false;
  consume(t,weaponId,weaponTier);t.angle=angle;t.power=power;
  const d=weaponDef(weaponId,weaponTier);
  const over=t.overchargeReady?1.28:1,crit=Math.random()<(t.critChance||0)?(t.critMultiplier||1.5):1,mult=over*crit*(t.damageBonus||1);
  if(t.overchargeReady){t.overchargeReady=false;t.overcharge=0;s.message="OVERCHARGED SHOT";s.messageTimer=1.1;}
  if(crit>1){s.message="CRITICAL SHOT";s.messageTimer=1.0;}
  s.phase="shot";s.shotInProgress=true;s.projectiles.length=0;s.traceCurrent=[];
  s.activeShotSummary={ownerId:t.id,weaponId,tier:weaponTier,totalDamage:0,hitCount:0,crit:crit>1,hadX2:false};
  const add=(a=angle,p=power,extra={})=>s.projectiles.push(projectileBase(s,t,a,p,weaponId,weaponTier,{damageMult:mult,startX:t.x,critShot:crit>1,x2Active:false,...extra}));
  s.fx.push({kind:"muzzle",weaponId,tier:weaponTier,x:t.x+Math.cos(angle)*19,y:t.y-8-Math.sin(angle)*19,angle,life:.28,max:.28,color:d.color});
  if(weaponId==="counter3000"){
    let seq=0;for(let group=1;group<=d.counterVolleys;group++){
      for(let i=0;i<group;i++){const off=(i-(group-1)/2)*(d.spread||.016);add(angle+off,power,{age:-(seq*(d.shotGap||.018)+group*(d.volleyGap||.18)),radius:2,counterShot:true});seq++;}
    }
  }else if(weaponId==="fleet"){
    const rows=d.fleetRows||[11],totalRows=rows.length;
    rows.forEach((count,row)=>{const mid=(count-1)/2;for(let i=0;i<count;i++){
      add(angle+(i-mid)*(d.formationSpread||.017),clamp(power+(row-(totalRows-1)/2)*4,10,100),{age:-row*.035,radius:2.5,fleetShot:true});
    }});
  }else if(weaponId==="flame"){
    const count=d.count||12,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.10),Math.max(18,power*.74),{radius:2.5,flameShot:true,maxAge:1.8});
  }else if(weaponId==="fireworks"){
    if(d.pyrotechnics)add(angle,power,{kind:"pyroShell",radius:5});
    else{const count=d.rockets||3,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.rocketSpread||.075),power,{kind:"fireworkRocket",radius:4,sparksPerRocket:d.sparksPerRocket||12});}
  }else if(weaponId==="bounder"){
    const count=d.count||1,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.045),power,{bounderShot:true,radius:4});
  }else if(weaponId==="uzi"){
    const count=d.count||10,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.straightSpread||.03),100,{age:-i*.025,radius:1.7,noGravity:true,windFactor:0,skipSkillObjects:true,launchSpeedMult:2.9,straightBullet:true,maxAge:1.4});
  }else if(weaponId==="stickybomb"){
    if(d.stickyRain)add(angle,power,{flareWeapon:true,stickyRainFlare:true,radius:4});
    else if(d.mineLayer)add(angle,power,{mineLayerShot:true,radius:4,mineBounces:0,mineGroup:s.nextId++});
    else{const count=d.count||1,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.065),power,{stickyShot:true,radius:4});}
  }else if(weaponId==="deadweight"){
    add(angle,power,{deadWeightMode:d.deadRiser?"riser":"drop",radius:5});
  }else if(weaponId==="bfg1000"){
    add(angle,power,{launchSpeedMult:d.speedMult||.76,windFactor:d.windFactor||2,radius:7,distanceWeapon:true});
  }else if(weaponId==="tadpoles"){
    const count=d.count||12,mid=(count-1)/2;for(let i=0;i<count;i++){const big=!!d.bullfrogBig&&i===Math.floor(count/2);add(angle+(i-mid)*(d.spread||.060),power-rand(0,4),{radius:big?7:3,tadpoleShot:true,tadBounces:0,bullfrog:big});}
  }else if(weaponId==="airstrike"||weaponId==="bolt"||weaponId==="recruiter"||weaponId==="carpetbomb"){
    add(angle,power,{flareWeapon:true,radius:4});
  }else if(weaponId==="tristar"||weaponId==="orbvolley"){
    const count=d.count||3,mid=(count-1)/2,spread=d.spread||.07;for(let i=0;i<count;i++)add(angle+(i-mid)*spread,power);
  }else if(weaponId==="aquastream"||weaponId==="rapidfire"){
    const count=d.count||7,groups=d.burstGroups||1,perGroup=Math.ceil(count/groups);
    for(let i=0;i<count;i++){
      const wave=d.wavePowerVariance?((i/Math.max(1,count-1))-.5)*d.wavePowerVariance:rand(-2,0);
      const groupPause=groups>1?Math.floor(i/perGroup)*.14:0;
      add(angle+rand(-(d.streamSpread||.02),d.streamSpread||.02),clamp(power+wave,10,100),{age:-i*(d.burstGap||.06)-groupPause,maxAge:weaponId==="rapidfire"?4:4.5});
    }
  }else if(weaponId==="burrow"&&d.excavationCount){
    const count=d.excavationCount,mid=(count-1)/2;
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.excavationSpread||.07),power-rand(0,5),{radius:3});
  }else if(weaponId==="infernojet"){
    const count=d.count||5,mid=(count-1)/2;
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.07),Math.max(18,power*.68),{maxAge:1.35,burnData:{damage:d.burn||5,time:d.burnTime||3,r:24}});
  }else if(weaponId==="hunter"||weaponId==="droneswarm"){
    for(let i=0;i<d.count;i++)add(angle+rand(-.10,.10),power-rand(0,8),{homingDelay:(weaponId==="hunter"?.38:.25)+i*.055,homingStrength:d.homing});
  }else if(weaponId==="sniper"){
    const count=d.count||1,mid=(count-1)/2;
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.subShotSpread||0),power,{homingDelay:.30,homingStrength:d.smartSnipe||0});
  }else if(weaponId==="raillance"){
    resolveRail(s,t,angle,d,mult);scheduleTurnEnd(s,.65);
  }else add(angle,power,{corkscrewPhase:rand(0,Math.PI*2)});
  return true;
}

function resolveRail(s,t,angle,d,mult){
  const step=5;let x=t.x+Math.cos(angle)*20,y=t.y-8-Math.sin(angle)*20,hitX=x,hitY=y,hitTank=null,boost=mult;
  const touched=new Set();
  for(let i=0;i<500;i++){
    x+=Math.cos(angle)*step;y-=Math.sin(angle)*step;
    if(x<0||x>=s.width||y<0||y>=s.height)break;
    for(const o of s.skillObjects){
      if(o.kind==="multiplier"&&!touched.has(o.id)&&Math.hypot(x-o.x,y-o.y)<o.r+4){
        boost*=o.value;touched.add(o.id);o.dead=true;s.skillHits++;
        if(s.activeShotSummary)s.activeShotSummary.hadX2=true;
        s.message="×2 DAMAGE GATE";s.messageTimer=1;
      }
    }
    for(const q of s.tanks){if(q.alive&&q.id!==t.id&&Math.hypot(q.x-x,q.y-y)<13){hitTank=q;break;}}
    hitX=x;hitY=y;if(hitTank||y>=terrainY(s,x))break;
  }
  s.skillObjects=s.skillObjects.filter(o=>!o.dead);
  s.traceCurrent.push([{x:t.x,y:t.y-10},{x:hitX,y:hitY}]);
  s.fx.push({kind:"beam",x1:t.x,y1:t.y-10,x2:hitX,y2:hitY,life:.35,max:.35,color:d.color});
  if(hitTank)damageTank(s,hitTank,d.damage*boost,t,{x2:touched.size>0});else modifyTerrainCrater(s,hitX,hitY,9,.45);
}
function scheduleTurnEnd(s,delay=.9){s.shotInProgress=false;s.nextTurnDelay=Math.max(s.nextTurnDelay,delay);}

function damageMeta(source){
  if(!source)return {};
  return {crit:!!source.critShot,x2:!!source.x2Active};
}
function explosion(s,x,y,radius,damage,owner,terrainScale=1,color="#fff",meta={}){
  if(radius>0&&terrainScale>0)modifyTerrainCrater(s,x,y,radius,terrainScale);
  s.fx.push({kind:"explosion",x,y,r:Math.max(12,radius),life:.55,max:.55,color});
  s.cameraShake=Math.max(s.cameraShake,Math.min(12,radius*.09));
  if(radius<=0)return;
  for(const t of s.tanks){
    if(!t.alive)continue;
    const dist=Math.hypot(t.x-x,t.y-y);if(dist>radius+14)continue;
    damageTank(s,t,damage*clamp(1-dist/(radius+18),.08,1),owner,meta);
  }
}
function explosionP(s,p,x,y,radius,damage,owner,terrainScale=1,color="#fff"){
  return explosion(s,x,y,radius,damage,owner,terrainScale,color,damageMeta(p));
}
function damageTankP(s,p,t,amount,owner){
  return damageTank(s,t,amount,owner,damageMeta(p));
}
function damageTank(s,t,amount,owner,meta={}){
  if(amount<=0||!t.alive)return 0;
  const before=Math.max(0,t.hp)+Math.max(0,t.armor||0);
  const applied=Math.min(amount,before);
  const crit=meta.crit ?? !!s.activeShotSummary?.crit;
  const x2=!!meta.x2;
  let left=amount;
  if(t.armor>0){const a=Math.min(t.armor,left);t.armor-=a;left-=a;}
  t.hp-=left;
  const self=!!(owner&&owner.id===t.id);
  s.damageNumbers.push({x:t.x+rand(-7,7),y:t.y-38-rand(0,5),value:applied,life:1.05,max:1.05,crit,x2,self,vy:-34-rand(0,10),drift:rand(-4,4)});
  if(owner&&owner.id!==t.id){
    owner.damage+=amount;
    owner.overcharge=clamp(owner.overcharge+amount*.55*(owner.overchargeRate||1),0,100);
    if(owner.overcharge>=100)owner.overchargeReady=true;
    if(s.activeShotSummary&&s.activeShotSummary.ownerId===owner.id){
      s.activeShotSummary.totalDamage+=applied;s.activeShotSummary.hitCount++;if(x2)s.activeShotSummary.hadX2=true;
    }
  }
  if(t.hp<=0){t.hp=0;t.alive=false;if(owner&&owner.id!==t.id)owner.kills++;s.fx.push({kind:"tankPop",x:t.x,y:t.y,life:.75,max:.75,color:t.color});}
  return applied;
}
function finalizeShotSummary(s){
  const q=s.activeShotSummary;if(!q)return;
  s.damageSummary={...q,life:1.75,max:1.75};
  s.activeShotSummary=null;
}
function ownerOf(s,p){return s.tanks.find(t=>t.id===p.owner)||null;}
function nearestEnemy(s,ownerId,x,y,range=1e9){
  const owner=s.tanks.find(t=>t.id===ownerId);let best=null,bd=range;
  for(const t of s.tanks){if(!isEnemy(s,owner,t))continue;const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;best=t;}}
  return best;
}

function spawnMiniProjectile(s,p,{angle,speed,weaponId=p.weaponId,kind="fragment",damageMult=p.damageMult,extra={}}){
  s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId,tier:p.tier,kind,x:p.x,y:p.y,
    vx:Math.cos(angle)*speed,vy:-Math.sin(angle)*speed,age:0,alive:true,radius:3,damageMult,bounces:0,didSplit:true,critShot:!!p.critShot,x2Active:!!p.x2Active,...extra});
}
function splitProjectile(s,p){
  const d=weaponDef(p.weaponId,p.tier);if(!d.fragments)return;
  s.fx.push({kind:"weaponBurst",weaponId:p.weaponId,tier:p.tier,x:p.x,y:p.y,life:.46,max:.46,color:d.color});

  // Apex Splitter is intentionally multi-stage: 1 → 2 → 4 → 8.
  if(p.weaponId==="prismsplit"&&d.splitChain){
    const stage=p.splitStage||0;
    if(stage>=d.splitChain){p.didSplit=true;return;}
    const base=Math.atan2(-p.vy,p.vx),next=stage+1;
    for(const off of [-.18,.18]){
      const a=base+off*(1+stage*.36),sp=Math.max(105,Math.hypot(p.vx,p.vy)*.82);
      spawnMiniProjectile(s,p,{angle:a,speed:sp,extra:{splitStage:next,splitAt:.18,didSplit:next>=d.splitChain}});
    }
    p.didSplit=true;return;
  }

  p.didSplit=true;
  const base=Math.atan2(-p.vy,p.vx);
  for(let i=0;i<d.fragments;i++){
    let angle,speed;
    if(["starburst","kernelpop","twinkler"].includes(p.weaponId)){
      angle=Math.PI*2*(i/d.fragments);speed=p.weaponId==="kernelpop"?rand(95,155):rand(125,190);
    }else if(p.weaponId==="palmburst"){
      const q=(i-(d.fragments-1)/2)/Math.max(1,d.fragments-1);angle=base+q*1.55;speed=rand(125,175);
    }else{
      const spread=p.weaponId==="prismsplit"?1.0:1.35;
      angle=base+(i-(d.fragments-1)/2)/Math.max(1,d.fragments-1)*spread;speed=rand(125,190);
    }
    spawnMiniProjectile(s,p,{angle,speed,extra:{customBounces:d.sparkBounce||0,palmCurve:d.palmCurve||0,frondSplit:d.frondSplit||false}});
  }
}

function spawnRadial(s,p,d,x,y,{mode="radial"}={}){
  const count=d.fragments||6;
  for(let i=0;i<count;i++){
    let a;
    if(mode==="fountain")a=Math.PI*(.29+.42*(i/Math.max(1,count-1)))+rand(-.04,.04);
    else if(mode==="breaker")a=(i%2?Math.PI*.10:Math.PI*.90)+rand(-.18,.18);
    else if(mode==="clover")a=Math.PI*.25+(i/count)*Math.PI*2;
    else a=i/count*Math.PI*2;
    const sp=mode==="fountain"?(d.fountainSpeed||170):mode==="breaker"?(d.breakerSpeed||160):(d.petalSpeed||d.spikeSpeed||145);
    spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:sp,extra:{customBounces:d.petalBounce||0,pierceHits:d.spikePierce?1:0,homingStrength:d.leafHoming||0,homingDelay:.3,breakerDepth:mode==="breaker"?(d.breakerChainDepth||1):0}});
  }
}
function spawnSwarm(s,p,d,x,y,type){
  for(let i=0;i<d.fragments;i++){
    const a=Math.PI*(.20+.60*Math.random());
    spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:rand(110,170),kind:"swarm",extra:{homingStrength:d.homing||1.2,homingDelay:.18+i*.025,maxAge:d.beeLife||3.0,swarmType:type}});
  }
}
function spawnStrike(s,p,d,x,kind="skyBomb"){
  const count=d.bombs||5;
  for(let i=0;i<count;i++){
    let px;
    if(p.weaponId==="carpetbomb"){const q=count<=1?0:i/(count-1);px=clamp(x-(d.spreadX||240)/2+q*(d.spreadX||240),8,s.width-8);if(d.zigzag)px=clamp(px+(i%2?18:-18),8,s.width-8);}
    else px=clamp(x+rand(-(d.spreadX||90),d.spreadX||90),8,s.width-8);
    let py=-rand(50,240)-i*18,vx=rand(-8,8)+s.wind*.08,vy=rand(105,165);
    if(kind==="asteroid"){
      const side=Math.random()<.5?-1:1;px=clamp(x+side*rand(80,d.spreadX||180),8,s.width-8);py=-rand(50,180);vx=-side*rand(55,100);vy=rand(75,120);
    }
    if(kind==="gunshipShot"){
      const q=count<=1?0:i/(count-1);px=clamp(x-(d.gunshipSpan||320)/2+q*(d.gunshipSpan||320),8,s.width-8);py=-60-i*3;vx=rand(-4,4);vy=rand(150,195);
    }
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind,x:px,y:py,vx,vy,age:-.28-i*.08,alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4});
  }
}

function bounceFlareOrTrigger(s,p,d,x,y,trigger){
  p.flareBounces=(p.flareBounces||0)+1;
  const stopAt=d.flareBounces||2;
  if(p.flareBounces<stopAt&&Math.hypot(p.vx,p.vy)>42){
    p.x=x;p.y=terrainY(s,x)-5;p.vx*=.50;p.vy=-Math.max(34,Math.abs(p.vy)*.38);p.bumperCooldown=.12;return;
  }
  p.alive=false;trigger();
}
function spawnAirStrikeFamily(s,p,d,x){
  const positions=[];
  if(d.artilleryOrder)positions.push(x,clamp(x-d.spreadX,8,s.width-8),clamp(x+d.spreadX,8,s.width-8));
  else for(let i=0;i<d.bombs;i++)positions.push(clamp(x+rand(-d.spreadX,d.spreadX),8,s.width-8));
  positions.forEach((px,i)=>s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"airstrikeBomb",x:px,y:-100-i*24,vx:d.artilleryOrder?0:rand(-5,5),vy:d.artilleryOrder?155:rand(130,180),age:-(d.artilleryOrder?[0,.35,.70][i]||0:i*.07),alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:d.artilleryOrder?7:4,noTerrainDamage:false}));
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}
function spawnCarpetFamily(s,p,d,x){
  const count=d.bombs||15,dir=x>s.width/2?1:-1,start=dir>0?-40:s.width+40;
  for(let i=0;i<count;i++){
    const q=count<=1?0:i/(count-1),tx=clamp(x-d.spreadX/2+q*d.spreadX,8,s.width-8),sy=-70-i*3;
    const dx=tx-start,dy=terrainY(s,tx)-sy,len=Math.max(1,Math.hypot(dx,dy)),speed=230;
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"carpetBombDrop",x:start,y:sy,vx:dx/len*speed,vy:dy/len*speed,age:-.15-i*.055,alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4,noGravity:true,windFactor:0,noTerrainDamage:true,carpetFire:!!d.burn});
  }
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}
function spawnBoltFamily(s,p,d,x){
  for(let i=0;i<(d.bolts||1);i++)s.fields.push({kind:"lightningStrike",x:clamp(x+(i-(d.bolts-1)/2)*(d.boltSpread||0),8,s.width-8),life:.15+i*.20,max:.15+i*.20,delay:.10+i*.20,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*p.damageMult,r:d.radius||18,color:d.color});
  if(d.comets)for(let i=0;i<d.comets;i++)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"boltComet",x:clamp(x+rand(-55,55),8,s.width-8),y:-180-i*45,vx:rand(-25,25),vy:125,age:-.25-i*.18,alive:true,damageMult:p.damageMult*(d.cometDamage/d.damage),critShot:!!p.critShot,x2Active:!!p.x2Active,radius:5});
  if(d.apocalypseFire)for(let i=0;i<d.apocalypseFire;i++){const fx=clamp(x+rand(-80,80),8,s.width-8);s.fires.push({x:fx,y:terrainY(s,fx)-3,r:16,life:1.5,damage:d.fireDamage*p.damageMult,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});}
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:.8,max:.8,color:d.color});
}
function spawnRecruiterFamily(s,p,d,x){
  const count=d.recruitShots||14,targetY=terrainY(s,x)-10,col=d.shotColor||"#66bfff";
  for(let i=0;i<count;i++){
    const left=i%2===0,startX=left?-30:s.width+30,startY=clamp(targetY-130+rand(-80,80),25,s.height*.55),tx=clamp(x+rand(-45,45),8,s.width-8),ty=terrainY(s,tx)-6;
    const dx=tx-startX,dy=ty-startY,len=Math.max(1,Math.hypot(dx,dy)),speed=310;
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"recruitShot",x:startX,y:startY,vx:dx/len*speed,vy:dy/len*speed,age:-.10-i*.045,alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:2.5,noGravity:true,windFactor:0,customColor:col});
  }
  s.fx.push({kind:"marker",x,y:targetY,life:1.0,max:1.0,color:d.color});
}
function spawnStickyRain(s,p,d,x){
  for(let i=0;i<(d.bombs||20);i++){
    const q=i/Math.max(1,(d.bombs||20)-1),px=clamp(x-d.spreadX/2+q*d.spreadX,8,s.width-8);
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"stickyRainBomb",x:px,y:-100-i*11,vx:rand(-4,4),vy:150,age:-.18-i*.035,alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:3,rainIndex:i});
  }
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}
function spawnFireworkSparks(s,p,d,count=null){
  const n=count||p.sparksPerRocket||d.sparksPerRocket||12;s.fx.push({kind:"fireworkBurst",x:p.x,y:p.y,life:.60,max:.60,color:d.color,tier:p.tier});
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rand(-.035,.035),sp=rand(95,155);spawnMiniProjectile(s,p,{angle:a,speed:sp,kind:"fireworkSpark",extra:{fragDamage:d.damage,fireworkSpark:true,radius:2.5}});}
}
function resolvePyrotechnics(s,p,d,x,y){
  s.fx.push({kind:"fireworkBurst",x,y,life:1.0,max:1.0,color:d.color,tier:p.tier});
  const sparkN=d.pyroSparks||24;
  for(let i=0;i<sparkN;i++){const a=Math.PI*(.18+.64*(i/Math.max(1,sparkN-1)))+rand(-.05,.05),sp=rand(105,190);spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:sp,kind:"fireworkSpark",extra:{fragDamage:15*p.damageMult,fireworkSpark:true,radius:2.5}});}
  const rockets=d.pyroRockets||5,mid=(rockets-1)/2;
  for(let i=0;i<rockets;i++){const a=Math.PI/2+(i-mid)*.16;spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:175+Math.abs(i-mid)*8,kind:"fireworkRocket",extra:{sparksPerRocket:d.pyroRocketSparks||9,radius:4}});}
}
function resolveSpiderWeb(s,p,d,x,y){
  const pattern=d.spiderPattern||[3,6,12],segments=[],layers=[];let prev=[{x,y}],reach=d.spiderReach||55;
  for(let li=0;li<pattern.length;li++){
    const count=pattern[li],next=[];
    for(let i=0;i<count;i++){
      const parent=prev[i%prev.length],base=-Math.PI*.92+(i/Math.max(1,count-1))*Math.PI*1.84,angle=base+rand(-.10,.10),len=reach*(li===0?1:Math.max(.48,.82-li*.08));
      const end={x:clamp(parent.x+Math.cos(angle)*len,3,s.width-3),y:clamp(parent.y+Math.sin(angle)*len,8,s.height-8)};
      segments.push({x1:parent.x,y1:parent.y,x2:end.x,y2:end.y});next.push(end);
    }prev=next;layers.push(next);
  }
  const owner=ownerOf(s,p),hits=new Map();
  for(const seg of segments)for(const t of s.tanks){if(!t.alive)continue;const h=pointSegmentDistance(t.x,t.y,seg.x1,seg.y1,seg.x2,seg.y2);if(h.d<11){const c=hits.get(t.id)||0;if(c<2){damageTank(s,t,d.damage*p.damageMult,owner);hits.set(t.id,c+1);}}}
  s.fx.push({kind:"spiderWeb",segments,life:.75,max:.75,color:d.color,tier:p.tier});
}

function onImpact(s,p,x,y,hitTank=null){
  if(!p.alive)return;
  const d=weaponDef(p.weaponId,p.tier),owner=ownerOf(s,p),mult=p.damageMult||1;
  s.fx.push({kind:"weaponImpact",weaponId:p.weaponId,tier:p.tier,x,y,life:.40,max:.40,color:d.color});

  // Source-inspired V5 families with bespoke impact behavior.
  if(p.weaponId==="deadweight"&&p.deadWeightMode==="riser"&&p.kind!=="deadRiserTunnel"){p.kind="deadRiserTunnel";p.x=x;p.y=terrainY(s,x)+16;p.vx=0;p.vy=0;p.noGravity=true;p.windFactor=0;return;}
  if(p.weaponId==="fireworks"&&p.kind==="fireworkRocket"){p.alive=false;return;}
  if(p.weaponId==="flame"){
    p.alive=false;if(hitTank){for(let i=0;i<(d.burnTicks||3);i++)s.fields.push({kind:"burnTarget",targetId:hitTank.id,life:.18+i*.34,max:.18+i*.34,delay:.12+i*.34,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:(d.burnTickDamage||d.damage)*mult,color:d.color});}return;
  }
  if(p.weaponId==="uzi"){p.alive=false;if(hitTank)damageTankP(s,p,hitTank,d.damage*mult,owner);s.fx.push({kind:"bulletHit",x,y,life:.18,max:.18,color:d.color});return;}
  if(p.weaponId==="bfg1000"){p.alive=false;const travel=Math.abs(x-(p.startX??x)),q=clamp(travel/(s.width*.62),0,1),dd=(d.distanceMin||d.damage)+((d.distanceMax||d.damage)-(d.distanceMin||d.damage))*q;explosionP(s,p,x,y,d.radius,dd*mult,owner,1.0,d.color);return;}
  if(p.weaponId==="tadpoles"){
    const q=clamp(Math.abs(x-(p.startX??x))/(s.width*.60),0,1),lo=p.bullfrog?(d.bigDamageMin||16):(d.distanceMin||4),hi=p.bullfrog?(d.bigDamageMax||40):(d.distanceMax||7),dd=lo+(hi-lo)*q,rr=p.bullfrog?(d.bigRadius||25):d.radius;
    if(hitTank){p.alive=false;explosionP(s,p,x,y,rr,dd*mult,owner,.12,d.color);return;}
    p.tadBounces=(p.tadBounces||0)+1;if(p.tadBounces<=(d.tadBounces||2)){p.y=terrainY(s,x)-4;p.vx*=.72;p.vy=-Math.max(45,Math.abs(p.vy)*.53);s.fx.push({kind:"frogBounce",x,y,life:.22,max:.22,color:d.color});return;}
    p.alive=false;explosionP(s,p,x,y,rr,dd*mult,owner,.22,d.color);return;
  }
  if(p.weaponId==="bounder"&&!p.bounderLocked&&!hitTank){
    const target=nearestEnemy(s,p.owner,x,y);if(target){const dx=target.x-x,dy=target.y-y,len=Math.max(1,Math.hypot(dx,dy)),sp=d.bounderSpeed||220;p.bounderLocked=true;p.noGravity=true;p.windFactor=0;p.x=x;p.y=terrainY(s,x)-5;p.vx=dx/len*sp;p.vy=dy/len*sp;s.fx.push({kind:"bounderLock",x,y,targetX:target.x,targetY:target.y,life:.28,max:.28,color:d.color});return;}
  }
  if(p.weaponId==="airstrike"&&p.kind!=="airstrikeBomb"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnAirStrikeFamily(s,p,d,x));return;}
  if(p.weaponId==="bolt"&&p.kind!=="boltComet"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnBoltFamily(s,p,d,x));return;}
  if(p.weaponId==="recruiter"&&p.kind!=="recruitShot"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnRecruiterFamily(s,p,d,x));return;}
  if(p.weaponId==="carpetbomb"&&p.kind!=="carpetBombDrop"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnCarpetFamily(s,p,d,x));return;}
  if(p.weaponId==="stickybomb"){
    if(p.kind==="stickyRainBomb"){p.alive=false;s.fields.push({kind:"stickyMine",x,y:terrainY(s,x)-3,life:.45+(p.rainIndex||0)*.045,max:.45+(p.rainIndex||0)*.045,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius,color:d.color});return;}
    if(p.stickyRainFlare){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnStickyRain(s,p,d,x));return;}
    if(p.mineLayerShot){
      const groundY=terrainY(s,x)-3;s.fields.push({kind:"stickyMine",x,y:groundY,life:999,max:999,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius,color:d.color,group:p.mineGroup,dormant:true});p.mineBounces=(p.mineBounces||0)+1;
      if(p.mineBounces<(d.mineBounces||5)){p.x=x;p.y=groundY-3;p.vx*=.76;p.vy=-Math.max(42,Math.abs(p.vy)*(d.bouncePower||.7));return;}
      p.alive=false;const group=s.fields.filter(f=>f.kind==="stickyMine"&&f.group===p.mineGroup);group.forEach((f,i)=>{f.dormant=false;f.life=.28+i*.035;f.max=f.life;});return;
    }
    if(p.stickyShot){p.alive=false;s.fields.push({kind:"stickyMine",x,y:hitTank?hitTank.y:terrainY(s,x)-3,targetId:hitTank?.id||null,life:d.stickyDelay||2,max:d.stickyDelay||2,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius,color:d.color});return;}
  }
  if(p.weaponId==="snake"){p.alive=false;s.fields.push({kind:"snake",x,y:terrainY(s,x)-3,life:(d.snakeHits||10)*(d.snakeStep||.20)+.05,max:(d.snakeHits||10)*(d.snakeStep||.20)+.05,tick:0,steps:0,dir:Math.sign(p.vx||1),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius,step:d.snakeStep||.20,travel:d.snakeTravel||25,turn:d.snakeTurn||1,color:d.color,tier:p.tier});return;}
  if(p.weaponId==="fireworks"){
    if(p.kind==="fireworkRocket"){p.alive=false;return;}
    if(p.kind==="pyroShell"){p.alive=false;resolvePyrotechnics(s,p,d,x,y);return;}
    if(p.kind==="fireworkSpark"){p.alive=false;explosionP(s,p,x,y,d.radius,p.fragDamage||d.damage*mult,owner,.18,d.color);return;}
  }
  if(p.weaponId==="spider"){p.alive=false;resolveSpiderWeb(s,p,d,x,y);return;}

  // Secondary projectiles from strike/orbital/dead-drop/source-inspired strike weapons must resolve normally,
  // otherwise they would recursively spawn another copy of their parent effect.
  if(["skyBomb","orbital","deadDrop","asteroid","gunshipShot","airstrikeBomb","boltComet","recruitShot","carpetBombDrop"].includes(p.kind)){
    p.alive=false;
    const terrainScale=(p.kind==="deadDrop"?1.05:(p.weaponId==="carpetbomb"||p.weaponId==="recruiter"?0:(d.terrainScale??.75)));
    const rad=p.weaponId==="bolt"&&p.kind==="boltComet"?(d.cometRadius||24):(d.radius||32);
    const dmg=p.weaponId==="bolt"&&p.kind==="boltComet"?(d.cometDamage||15)*mult:d.damage*mult;
    explosionP(s,p,x,y,rad,dmg,owner,terrainScale,d.color);
    if(p.weaponId==="acidrain")s.fires.push({x,y:terrainY(s,x)-3,r:30,life:d.acidTime||4,damage:d.acid||5,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"acid"});
    if(p.weaponId==="carpetbomb"&&d.burn)s.fires.push({x,y:terrainY(s,x)-3,r:20,life:d.burnTime||2.2,damage:d.burn,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});
    return;
  }


  if(p.weaponId==="palmburst"&&p.frondSplit&&p.didSplit&&!p.frondSplitDone){
    p.frondSplitDone=true;p.alive=false;for(const off of [-.22,.22]){const a=Math.atan2(-p.vy,p.vx)+off;spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:105,weaponId:"pulse",kind:"scatterFrag",damageMult:1,extra:{fragDamage:d.damage*mult*.52}});}return;
  }
  if(p.weaponId==="breakerwave"&&(p.breakerDepth||0)>0){
    p.alive=false;const base=Math.atan2(-p.vy,p.vx),depth=p.breakerDepth-1;
    for(const off of [-.28,.28])spawnMiniProjectile(s,{...p,x,y},{angle:base+off,speed:d.breakerSpeed||165,extra:{breakerDepth:depth,didSplit:depth<=0}});
    return;
  }
  if(p.weaponId==="hyperbounce"&&p.bounces<d.bounces){
    p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*(d.bouncePower||.7)-35;p.vx*=.92;return;
  }
  if(p.weaponId==="jumper"&&p.bounces<d.bounces){
    explosionP(s,p,x,y,18,d.damage*(d.jumpDamageScale||.52)*mult,owner,.16,d.color);p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*.64-45;p.vx*=.82;return;
  }
  if(p.weaponId==="discoball"&&p.bounces<d.bounces){
    const range=d.laserRange||160;
    for(const t of s.tanks){if(t.alive&&t.id!==p.owner&&Math.abs(t.y-y)<34&&Math.abs(t.x-x)<range)damageTankP(s,p,t,d.laserDamage*mult,owner);}
    s.fx.push({kind:"beam",x1:clamp(x-range,0,s.width),y1:y,x2:clamp(x+range,0,s.width),y2:y,life:.20,max:.20,color:d.color});
    if(d.doubleLaser)s.fx.push({kind:"beam",x1:x,y1:y-range*.45,x2:x,y2:y+range*.45,life:.20,max:.20,color:d.color});
    p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*.70-35;p.vx*=.86;return;
  }
  if(p.weaponId==="clustergrenade"&&d.grenadeStorm&&!p.didSplit){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.2,max:1.2,color:d.color});
    const count=d.bombs||15;
    for(let i=0;i<count-1;i++)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x:clamp(x+rand(-d.spreadX,d.spreadX),8,s.width-8),y:-rand(40,250)-i*8,vx:rand(-7,7),vy:rand(115,165),age:-.42-i*.045,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:3});
    if(d.stormHeavy)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x,y:-290,vx:0,vy:125,age:-1.0,alive:true,damageMult:mult*2.4,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:9});
    return;
  }
  if(p.weaponId==="clustergrenade"&&!p.didSplit){
    if(p.bounces<d.bounces){p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*.55-30;p.vx*=.72;return;}
    p.didSplit=true;p.alive=false;
    if(!(d.fragments>0)){explosionP(s,p,x,y,d.radius,d.damage*mult,owner,.82,d.color);return;}
    explosionP(s,p,x,y,15,d.damage*mult*.35,owner,.12,d.color);
    for(let i=0;i<d.fragments;i++){const a=Math.PI*(.18+.64*Math.random());spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:rand(90,155),kind:"clusterFrag",extra:{customBounces:1}});}return;
  }
  if(p.weaponId==="bumperbombs"&&!p.didSplit){
    p.alive=false;for(let i=0;i<d.fragments;i++){const a=Math.PI*(.12+.76*Math.random());spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:rand(110,175),kind:"bumperFrag",extra:{customBounces:d.bounces}});}return;
  }
  if((p.kind==="clusterFrag"||p.kind==="bumperFrag")&&(p.customBounces||0)>p.bounces){
    p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.62-28;p.vx*=.77;return;
  }
  if((p.customBounces||0)>p.bounces){p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.57-24;p.vx*=.75;return;}
  if(p.weaponId==="ricochet"&&p.bounces<d.bounces){
    p.bounces++;p.y=terrainY(s,p.x)-7;p.vy=-Math.abs(p.vy)*.63-42;p.vx*=.74;return;
  }
  if(p.weaponId==="kernelpop"&&p.didSplit&&p.bounces<d.bounces){
    p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.55-24;p.vx*=.7;return;
  }
  if(["roller","sawblade","viper","backroller"].includes(p.weaponId)){
    p.kind=p.weaponId==="viper"?"viper":"roller";p.x=x;p.y=terrainY(s,x)-5;
    const incoming=Math.sign(p.vx||1),dir=p.weaponId==="backroller"?-incoming:incoming;
    p.vx=dir*(d.rollSpeed||(p.weaponId==="sawblade"?90:55));p.vy=0;p.rollLeft=d.rollTime||4.5;p.rollTotal=p.rollLeft;p.rollDistance=0;p.hitCooldown=0;p.impactTrail=!!d.impactTrail;return;
  }
  if(p.weaponId==="burrow"){
    p.kind="burrow";p.x=x;p.y=terrainY(s,x)+4;p.vx=0;p.vy=58;p.tunnelLeft=d.tunnelTime;return;
  }
  if(p.weaponId==="ghostbomb"){
    p.kind="ghost";p.x=x;p.y=terrainY(s,x)+3;p.vx*=.22;p.vy=Math.max(38,Math.abs(p.vy)*.28);p.ghostLeft=d.ghostDepth;return;
  }

  if(["acidrain","areastrike","carpetbomb","asteroidbelt","gunship"].includes(p.weaponId)){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.1,max:1.1,color:d.color});
    const kind=p.weaponId==="asteroidbelt"?"asteroid":p.weaponId==="gunship"?"gunshipShot":"skyBomb";
    spawnStrike(s,p,d,x,kind);
    if(d.centerBomb&&p.weaponId==="areastrike")s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x,y:-180,vx:0,vy:185,age:-.5,alive:true,damageMult:mult*1.25,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:5});
    if(d.gunshipMissile&&p.weaponId==="gunship")s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x,y:-230,vx:0,vy:150,age:-1.1,alive:true,damageMult:mult*1.8,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:6});
    if(d.asteroidHeavy&&p.weaponId==="asteroidbelt")s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"asteroid",x:clamp(x+rand(-55,55),8,s.width-8),y:-260,vx:rand(-35,35),vy:105,age:-1.0,alive:true,damageMult:mult*1.75,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8});
    return;
  }
  if(p.weaponId==="skymarker"||p.weaponId==="meteorchoir"){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1,max:1,color:d.color});
    for(let i=0;i<d.bombs;i++)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",
      x:clamp(x+rand(-d.spreadX,d.spreadX),8,s.width-8),y:-rand(30,260)-i*22,vx:rand(-8,8)+s.wind*.12,vy:rand(100,160),
      age:-.35-i*.10,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4});
    if(d.artilleryHeavy)for(const off of [-55,55])s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x:clamp(x+off,8,s.width-8),y:-320,vx:0,vy:130,age:-1.0-Math.random()*.25,alive:true,damageMult:mult*2.0,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8});
    return;
  }
  if(p.weaponId==="gravityseed"){p.alive=false;s.fields.push({kind:"gravity",x,y:terrainY(s,x)-5,r:d.fieldRadius,life:d.fieldTime,max:d.fieldTime,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult});return;}
  if(p.weaponId==="voidwell"){p.alive=false;s.fields.push({kind:"voidwell",x,y:terrainY(s,x)-5,r:d.fieldRadius,life:d.fieldTime,max:d.fieldTime,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,projectilePull:d.projectilePull||1});return;}
  if(p.weaponId==="rampart"){p.alive=false;modifyTerrainRaise(s,x,d.radius,d.raise);s.fx.push({kind:"terraform",x,y:terrainY(s,x),life:.65,max:.65,color:d.color});return;}
  if(p.weaponId==="bulger"){p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,.25,d.color);modifyTerrainRaise(s,x,d.radius,d.raise);if(d.doubleBulge){modifyTerrainRaise(s,x-d.radius*.72,d.radius*.55,d.raise*.55);modifyTerrainRaise(s,x+d.radius*.72,d.radius*.55,d.raise*.55);}s.fx.push({kind:"terraform",x,y:terrainY(s,x),life:.7,max:.7,color:d.color});return;}
  if(p.weaponId==="sinker"){p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,1.28,d.color);return;}
  if(p.weaponId==="groundwave"){p.alive=false;s.fields.push({kind:"groundwave",x,y:terrainY(s,x)-3,dir:p.vx>=0?1:-1,life:2.1,max:2.1,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,lastX:x});return;}
  if(p.weaponId==="quakecharge"){p.alive=false;for(let i=0;i<d.quakePops;i++){const q=d.quakePops<=1?0:i/(d.quakePops-1),px=clamp(x-d.quakeSpan/2+q*d.quakeSpan,5,s.width-5);s.fields.push({kind:"faultPop",x:px,life:1.7,max:1.7,delay:i*.085,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult});}return;}
  if(p.weaponId==="horizon"){p.alive=false;const count=d.horizonPulses||9;for(let i=0;i<count;i++){const q=count<=1?0:i/(count-1),px=clamp(x-d.horizonRange/2+q*d.horizonRange,4,s.width-4),py=terrainY(s,px);explosionP(s,p,px,py,Math.max(10,d.radius),d.damage*mult,owner,.12,d.color);}return;}

  if(p.weaponId==="arcchain"){
    p.alive=false;let first=null;
    for(const t of s.tanks){if(t.alive&&Math.hypot(t.x-x,t.y-y)<d.radius+16){first=t;break;}}
    if(first){
      const hit=[first];damageTankP(s,p,first,d.damage*mult,owner);let last=first;
      for(let i=1;i<d.chain;i++){
        const q=s.tanks.filter(t=>t.alive&&!hit.includes(t)&&Math.hypot(t.x-last.x,t.y-last.y)<=d.chainRange)
          .sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0];
        if(!q)break;damageTankP(s,p,q,d.damage*mult*Math.pow(.78,i),owner);hit.push(q);last=q;
      }
      s.fx.push({kind:"chain",points:[{x,y},...hit.map(t=>({x:t.x,y:t.y}))],life:.28,max:.28,color:d.color});
    }else explosionP(s,p,x,y,20,18*mult,owner,.4,d.color);
    return;
  }


  if(["fountain","flower","cactus","clover","breakerwave"].includes(p.weaponId)&&!p.didSplit){
    p.alive=false;explosionP(s,p,x,y,16,d.damage*mult,owner,.18,d.color);
    const mode=p.weaponId==="fountain"?"fountain":p.weaponId==="breakerwave"?"breaker":p.weaponId==="clover"?"clover":"radial";
    spawnRadial(s,p,d,x,y,{mode});return;
  }
  if((p.weaponId==="beehive"||p.weaponId==="guppies")&&!p.didSplit){
    p.alive=false;explosionP(s,p,x,y,13,d.damage*mult*.45,owner,.12,d.color);spawnSwarm(s,p,d,x,y,p.weaponId);return;
  }
  if(p.weaponId==="moonfall"){
    p.alive=false;s.fx.push({kind:"ring",x,y:terrainY(s,x)-60,life:1.8,max:1.8,color:d.color});
    for(let i=0;i<d.bombs;i++){
      const a=i/d.bombs*Math.PI*2;
      s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"orbital",
        x:clamp(x+Math.cos(a)*85,10,s.width-10),y:terrainY(s,x)-130-Math.sin(a)*35,
        vx:-Math.cos(a)*24,vy:42+i*8,age:-i*.18,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4});
    }
    return;
  }

  if(p.weaponId==="deaddrop"){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.2,max:1.2,color:d.color});
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"deadDrop",x,y:-120,vx:0,vy:0,age:-1.1,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:12});
    return;
  }
  if(p.weaponId==="faultline"){
    p.alive=false;for(let i=0;i<9;i++){const px=clamp(x-d.lineRadius/2+i*d.lineRadius/8,5,s.width-5);s.fields.push({kind:"faultPop",x:px,life:1.3,max:1.3,delay:i*.08,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult});}
    return;
  }
  if(p.weaponId==="echobomb"){
    p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,1,d.color);s.fields.push({kind:"echo",x,y,life:.95,max:.95,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.echoDamage*mult,r:d.echoRadius,color:d.color});return;
  }
  if(p.weaponId==="timeskip"){
    p.alive=false;s.fields.push({kind:"timebomb",x,y:terrainY(s,x),life:d.delay,max:d.delay,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius,color:d.color});s.fx.push({kind:"marker",x,y:terrainY(s,x),life:d.delay,max:d.delay,color:d.color});return;
  }
  if(p.weaponId==="scatterrise"){
    p.alive=false;explosionP(s,p,x,y,18,d.damage*mult,owner,.35,d.color);
    for(let i=0;i<d.fragments;i++){
      const a=Math.PI*(.20+.60*Math.random()),sp=rand(95,175);
      s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:"pulse",kind:"scatterFrag",x:x+rand(-9,9),y:y-5,
        vx:Math.cos(a)*sp,vy:-Math.sin(a)*sp,age:0,alive:true,radius:3,damageMult:1,fragDamage:d.damage*mult,critShot:!!p.critShot,x2Active:!!p.x2Active});
    }
    return;
  }
  if(["shardbloom","prismsplit","starburst","emberrain","kernelpop","twinkler","palmburst"].includes(p.weaponId)&&!p.didSplit){
    splitProjectile(s,p);p.alive=false;return;
  }

  p.alive=false;
  explosionP(s,p,x,y,d.radius||25,(p.fragDamage||d.damage)*mult,owner,p.weaponId==="megaflux"?1.1:1,d.color);
  if(p.weaponId==="emberrain"||p.weaponId==="infernojet")s.fires.push({x,y:terrainY(s,x)-3,r:p.weaponId==="infernojet"?24:32,life:d.burnTime||p.burnData?.time||3,damage:d.burn||p.burnData?.damage||5,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});
  if(p.weaponId==="acidrain")s.fires.push({x,y:terrainY(s,x)-3,r:30,life:d.acidTime||4,damage:d.acid||5,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"acid"});
}

function updateFields(s,dt){
  for(const f of s.fields){
    if(!f.dormant)f.life-=dt;
    if(f.kind==="burnTarget"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const target=s.tanks.find(t=>t.id===f.targetId&&t.alive);if(target){damageTank(s,target,f.damage,s.tanks.find(t=>t.id===f.owner),{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"burnTick",x:target.x,y:target.y,life:.28,max:.28,color:f.color});}}}
    else if(f.kind==="lightningStrike"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const y=terrainY(s,f.x);s.fx.push({kind:"lightningBolt",x:f.x,y,life:.38,max:.38,color:f.color});explosion(s,f.x,y,f.r,f.damage,s.tanks.find(t=>t.id===f.owner),0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="stickyMine"){if(f.targetId){const t=s.tanks.find(t=>t.id===f.targetId&&t.alive);if(t){f.x=t.x;f.y=t.y-5;}}if(!f.dormant&&f.life<=0&&!f.done){f.done=true;s.fx.push({kind:"stickyBurst",x:f.x,y:f.y,life:.36,max:.36,color:f.color});explosion(s,f.x,f.y,f.r,f.damage,s.tanks.find(t=>t.id===f.owner),.70,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="snake"){f.tick-=dt;if(f.tick<=0&&f.steps<10){f.tick=f.step;f.steps++;if(Math.random()<f.turn*.35)f.dir*=-1;const dx=f.dir*f.travel*rand(.55,1.15);f.x=clamp(f.x+dx,5,s.width-5);f.y=terrainY(s,f.x)-3;s.fx.push({kind:"snakeBurst",x:f.x,y:f.y,life:.30,max:.30,color:f.color,tier:f.tier});explosion(s,f.x,f.y,f.r,f.damage,s.tanks.find(t=>t.id===f.owner),.15,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="gravity"){
      for(const t of s.tanks){
        if(!t.alive)continue;const dx=f.x-t.x,dy=f.y-t.y,dist=Math.hypot(dx,dy);
        if(dist<f.r&&dist>3)t.x=clamp(t.x+dx/dist*42*dt*(1-dist/f.r),10,s.width-10);
      }
      if(f.life<=0)explosion(s,f.x,f.y,55,f.damage,s.tanks.find(t=>t.id===f.owner),.8,"#9e77ff",{crit:!!f.critShot,x2:!!f.x2Active});
    }else if(f.kind==="voidwell"){
      for(const t of s.tanks){if(!t.alive)continue;const dx=f.x-t.x,dy=f.y-t.y,dist=Math.hypot(dx,dy);if(dist<f.r&&dist>3)t.x=clamp(t.x+dx/dist*54*dt*(1-dist/f.r),10,s.width-10);}
      for(const p of s.projectiles){if(!p.alive)continue;const dx=f.x-p.x,dy=f.y-p.y,dist=Math.hypot(dx,dy);if(dist<f.r&&dist>6){const force=(f.projectilePull||1)*190*(1-dist/f.r);p.vx+=dx/dist*force*dt;p.vy+=dy/dist*force*dt;}}
      if(f.life<=0)explosion(s,f.x,f.y,58,f.damage,s.tanks.find(t=>t.id===f.owner),.9,"#8d70ff",{crit:!!f.critShot,x2:!!f.x2Active});
    }else if(f.kind==="groundwave"){
      f.lastX+=f.dir*180*dt;const y=terrainY(s,f.lastX)-4;s.fx.push({kind:"spark",x:f.lastX,y,life:.18,max:.18,color:"#73df9c"});
      for(const t of s.tanks){if(t.alive&&t.id!==f.owner&&Math.abs(t.x-f.lastX)<13&&Math.abs(t.y-y)<30)damageTank(s,t,f.damage*dt*2.5,s.tanks.find(q=>q.id===f.owner),{crit:!!f.critShot,x2:!!f.x2Active});}
      if(f.lastX>2&&f.lastX<s.width-2)modifyTerrainCrater(s,f.lastX,y,9,.15);
    }else if(f.kind==="echo"&&f.life<=0)explosion(s,f.x,f.y,f.r,f.damage,s.tanks.find(t=>t.id===f.owner),.8,f.color,{crit:!!f.critShot,x2:!!f.x2Active});
    else if(f.kind==="timebomb"&&f.life<=0)explosion(s,f.x,f.y,f.r,f.damage,s.tanks.find(t=>t.id===f.owner),1,f.color,{crit:!!f.critShot,x2:!!f.x2Active});
    else if(f.kind==="faultPop"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const y=terrainY(s,f.x);explosion(s,f.x,y,28,f.damage,s.tanks.find(t=>t.id===f.owner),.55,"#cf8c58",{crit:!!f.critShot,x2:!!f.x2Active});}
    }
  }
  s.fields=s.fields.filter(f=>(f.dormant||f.life>0)&&!(f.done&&["faultPop","burnTarget","lightningStrike","stickyMine"].includes(f.kind)));
}
function updateFires(s,dt){
  for(const f of s.fires){
    f.life-=dt;f.tick-=dt;
    if(f.tick<=0){f.tick=.55;for(const t of s.tanks)if(t.alive&&Math.hypot(t.x-f.x,t.y-f.y)<f.r+13)damageTank(s,t,f.damage,s.tanks.find(q=>q.id===f.owner),{crit:!!f.critShot,x2:!!f.x2Active});}
  }
  s.fires=s.fires.filter(f=>f.life>0);
}

function pointSegmentDistance(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay,apx=px-ax,apy=py-ay,den=abx*abx+aby*aby||1;
  const t=clamp((apx*abx+apy*aby)/den,0,1),x=ax+abx*t,y=ay+aby*t;
  return {d:Math.hypot(px-x,py-y),x,y,t};
}
function handleSkillObjects(s,p){
  p.portalCooldown=Math.max(0,(p.portalCooldown||0)-1/60);
  p.bumperCooldown=Math.max(0,(p.bumperCooldown||0)-1/60);
  for(const o of s.skillObjects){
    if(o.dead)continue;
    if(o.kind==="multiplier"&&Math.hypot(p.x-o.x,p.y-o.y)<o.r+(p.radius||4)){
      p.damageMult=(p.damageMult||1)*o.value;p.x2Active=true;o.dead=true;s.skillHits++;if(s.activeShotSummary&&s.activeShotSummary.ownerId===p.owner)s.activeShotSummary.hadX2=true;
      s.fx.push({kind:"multiplier",x:o.x,y:o.y,life:.55,max:.55,color:"#ffe66c"});s.message="×2 DAMAGE!";s.messageTimer=1;
    }else if(o.kind==="portal"&&p.portalCooldown<=0&&Math.hypot(p.x-o.x,p.y-o.y)<o.r+(p.radius||4)){
      const other=s.skillObjects.find(q=>q.kind==="portal"&&q.pair===o.pair&&q.id!==o.id);
      if(other){
        const speed=Math.max(1,Math.hypot(p.vx,p.vy));p.x=other.x+p.vx/speed*(other.r+8);p.y=other.y+p.vy/speed*(other.r+8);p.portalCooldown=.28;
        s.fx.push({kind:"portalFlash",x1:o.x,y1:o.y,x2:other.x,y2:other.y,life:.35,max:.35,color:o.color});
      }
    }else if(o.kind==="bumper"&&p.bumperCooldown<=0){
      const dx=Math.cos(o.angle)*o.len/2,dy=Math.sin(o.angle)*o.len/2;
      const hit=pointSegmentDistance(p.x,p.y,o.x-dx,o.y-dy,o.x+dx,o.y+dy);
      if(hit.d<7+(p.radius||4)){
        const tx=Math.cos(o.angle),ty=Math.sin(o.angle),nx=-ty,ny=tx,dot=p.vx*nx+p.vy*ny;
        p.vx-=2*dot*nx;p.vy-=2*dot*ny;p.vx*=1.03;p.vy*=1.03;p.bumperCooldown=.18;
        p.x+=nx*Math.sign(-dot||1)*8;p.y+=ny*Math.sign(-dot||1)*8;
        s.fx.push({kind:"spark",x:hit.x,y:hit.y,life:.24,max:.24,color:"#ff78d1"});
      }
    }
  }
  s.skillObjects=s.skillObjects.filter(o=>!o.dead);
}

function updateProjectile(s,p,dt){
  if(!p.alive)return;const d=weaponDef(p.weaponId,p.tier);
  p.age+=dt;if(p.age<0)return;
  p.traceTimer=(p.traceTimer||0)-dt;if(p.traceTimer<=0){p.traceTimer=.055;(p.trace||(p.trace=[])).push({x:p.x,y:p.y});}
  if(!p.skipSkillObjects)handleSkillObjects(s,p);
  if(p.kind==="burrow"){
    p.tunnelLeft-=dt;p.y+=58*dt;
    if(p.tunnelLeft<=0){p.alive=false;explosionP(s,p,p.x,p.y,d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),1.1,d.color);}
    return;
  }
  if(p.kind==="ghost"){
    p.ghostLeft-=Math.hypot(p.vx,p.vy)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.ghostLeft<=0){p.alive=false;explosionP(s,p,p.x,p.y,d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),1.0,d.color);if(d.ghostPulse)explosionP(s,p,p.x,p.y,22,d.damage*.28*(p.damageMult||1),ownerOf(s,p),.15,d.color);}return;
  }
  if(p.kind==="roller"||p.kind==="viper"){
    p.rollLeft-=dt;p.hitCooldown=Math.max(0,(p.hitCooldown||0)-dt);const owner=ownerOf(s,p);
    if(p.kind==="viper"){const target=nearestEnemy(s,p.owner,p.x,p.y);if(target)p.vx+=(target.x>p.x?1:-1)*70*dt;p.vx=clamp(p.vx,-105,105);}
    else{p.vx+=Math.sin(terrainSlope(s,p.x))*90*dt;p.vx*=Math.pow(.992,dt*60);}
    const oldX=p.x;p.x+=p.vx*dt;p.rollDistance=(p.rollDistance||0)+Math.abs(p.x-oldX);if(p.x<1||p.x>s.width-2){p.alive=false;return;}p.y=terrainY(s,p.x)-5;if(p.impactTrail&&Math.random()<dt*8)modifyTerrainCrater(s,p.x,p.y,7,.08);
    const grow=d.growsWithRoll?clamp((p.rollDistance||0)/260,0,1):0;
    p.rollGrow=grow;const hitDamage=d.growsWithRoll?(d.damage+(d.growDamageMax-d.damage)*grow):d.damage;
    for(const t of s.tanks){
      if(!t.alive||t.id===p.owner)continue;
      if(Math.hypot(t.x-p.x,t.y-p.y)<15+grow*8){
        if(p.weaponId==="sawblade"){if(p.hitCooldown<=0){damageTankP(s,p,t,d.damage*(p.damageMult||1),owner);p.hitCooldown=.28;}}
        else{p.alive=false;explosionP(s,p,p.x,p.y,d.radius*(1+grow*.35),hitDamage*(p.damageMult||1),owner,.7,d.color);return;}
      }
    }
    if(p.rollLeft<=0){p.alive=false;if(p.weaponId!=="sawblade")explosionP(s,p,p.x,p.y,d.radius*(1+grow*.35),hitDamage*(p.damageMult||1),owner,.7,d.color);}
    return;
  }
  if(p.kind==="deadDrop"&&p.vy===0)p.vy=310;
  if(p.kind==="deadRiserTunnel"){
    const target=nearestEnemy(s,p.owner,p.x,p.y);if(!target){p.alive=false;return;}
    if(!p.riserAscending){const dx=target.x-p.x;if(Math.abs(dx)>8){p.x+=Math.sign(dx)*95*dt;p.y=terrainY(s,p.x)+16;}else{p.riserAscending=true;p.x=target.x;}}
    else{p.y-=175*dt;if(p.y<=target.y+8){p.alive=false;damageTankP(s,p,target,d.damage*(p.damageMult||1),ownerOf(s,p));s.fx.push({kind:"deadWeightHit",x:target.x,y:target.y,life:.42,max:.42,color:d.color});}}return;
  }
  if(p.deadWeightMode==="drop"&&!p.deadLocked){const target=nearestEnemy(s,p.owner,p.x,p.y);if(target&&p.y<target.y-28&&Math.abs(p.x-target.x)<13){p.deadLocked=true;p.noGravity=true;p.windFactor=0;p.vx=0;p.vy=260;s.fx.push({kind:"deadWeightLock",x:p.x,y:p.y,targetX:target.x,targetY:target.y,life:.40,max:.40,color:d.color});}}
  if(p.kind==="fireworkRocket"&&!p.didSplit&&p.vy>=0&&p.age>.18){p.didSplit=true;p.alive=false;spawnFireworkSparks(s,p,d,p.sparksPerRocket);return;}

  if((p.homingStrength||d.homing||0)>0){
    p.homingDelay=(p.homingDelay||0)-dt;
    if(p.homingDelay<=0){
      const target=nearestEnemy(s,p.owner,p.x,p.y,560);
      if(target){const speed=Math.max(35,Math.hypot(p.vx,p.vy)),desired=Math.atan2(target.y-p.y,target.x-p.x),current=Math.atan2(p.vy,p.vx);let da=(desired-current+Math.PI*3)%(Math.PI*2)-Math.PI,turn=(p.homingStrength||d.homing)*dt,ang=current+clamp(da,-turn,turn);p.vx=Math.cos(ang)*speed;p.vy=Math.sin(ang)*speed;}
    }
  }
  if(p.weaponId==="corkscrew"){
    const px=-p.vy,py=p.vx,len=Math.max(1,Math.hypot(px,py)),w=Math.sin(p.age*11+(p.corkscrewPhase||0))*95;
    p.vx+=px/len*w*dt;p.vy+=py/len*w*dt;
  }

  if(p.weaponId==="hoverorb"&&!p.hoverDone&&p.age>=(d.hoverTime||1)){
    p.hoverDone=true;p.hoverEnd=p.age+.48;p.vx*=d.hoverSpeed||.2;p.vy*=.08;
  }
  if(p.weaponId==="hoverorb"&&p.hoverDone&&p.age<(p.hoverEnd||0)){
    p.vx+=s.wind*.22*dt;p.vy*=.90;
  }else if(p.weaponId==="hoverorb"&&p.hoverDone&&p.age>=(p.hoverEnd||0)&&!p.dropApplied){p.dropApplied=true;p.vy+=95*(d.dropBoost||1);}
  if(p.weaponId==="boomerang"&&p.age>(d.returnTime||.8)&&!p.returned){p.returned=true;p.vx=-Math.sign(p.vx||1)*Math.min(230,Math.max(115,Math.abs(p.vx)*(d.returnForce||1.4)));}
  else if(p.weaponId==="boomerang"&&d.doubleReturn&&p.returned&&!p.returned2&&p.age>(d.returnTime||.8)+.75){p.returned2=true;p.vx*=-1.12;}
  if(p.kind!=="deadDrop"&&!(p.weaponId==="hoverorb"&&p.hoverDone&&p.age<(p.hoverEnd||0))){p.vx+=s.wind*(p.windFactor??1)*dt;if(!p.noGravity)p.vy+=s.gravity*(d.gravity||1)*dt;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(!p.skipSkillObjects)handleSkillObjects(s,p);

  if(["shardbloom","prismsplit","starburst","emberrain","kernelpop","twinkler","palmburst"].includes(p.weaponId)&&!p.didSplit&&p.age>=(p.splitAt??d.splitTime??.7)){
    splitProjectile(s,p);p.alive=false;return;
  }
  if(p.maxAge&&p.age>p.maxAge){p.alive=false;return;}
  if(p.weaponId==="mirror"&&(p.x<4||p.x>s.width-4)&&p.wallBounces<d.wallBounces){
    p.wallBounces++;p.vx*=-1;p.x=clamp(p.x,5,s.width-5);s.fx.push({kind:"spark",x:p.x,y:p.y,life:.22,max:.22,color:d.color});
  }else if(p.x<-80||p.x>s.width+80||p.y>s.height+100){p.alive=false;return;}

  for(const t of s.tanks){
    if(!t.alive||(t.id===p.owner&&p.age<.25))continue;
    if(Math.hypot(t.x-p.x,t.y-p.y)<12+(p.radius||3)){
      if(p.kind==="scatterFrag"){p.alive=false;damageTankP(s,p,t,p.fragDamage||16,ownerOf(s,p));return;}
      if((p.pierceHits||0)>0){damageTankP(s,p,t,d.damage*(p.damageMult||1),ownerOf(s,p));p.pierceHits--;p.x+=Math.sign(p.vx||1)*16;continue;}
      onImpact(s,p,p.x,p.y,t);return;
    }
  }
  if(p.x>=0&&p.x<s.width&&p.y>=terrainY(s,p.x)){
    if(p.kind==="scatterFrag"){p.alive=false;explosionP(s,p,p.x,p.y,14,p.fragDamage||12,ownerOf(s,p),.25,"#ffd56d");}
    else onImpact(s,p,p.x,p.y);
  }
}

function settleTanks(s,dt){
  for(const t of s.tanks){
    if(!t.alive)continue;t.x=clamp(t.x,9,s.width-9);
    const target=tankGround(s,t);t.y=t.y<target?Math.min(target,t.y+180*dt):target;
    const slope=terrainSlope(s,t.x);if(Math.abs(slope)>.72){t.x+=Math.sign(slope)*16*dt;t.y=tankGround(s,t);}
    if(t.y>s.height-4){t.alive=false;t.hp=0;}
  }
}
function evaluateWin(s){
  const alive=s.tanks.filter(t=>t.alive);
  if(s.mode==="teams"){
    const teams=[...new Set(alive.map(t=>t.team))];if(teams.length<=1){s.gameOver=true;s.winner=teams.length?`Team ${teams[0]+1}`:"Nobody";}
  }else if(alive.length<=1){s.gameOver=true;s.winner=alive[0]?.name||"Nobody";}
}
function nextAliveIndex(s,start){
  let i=start;for(let n=0;n<s.tanks.length;n++){i=(i+1)%s.tanks.length;if(s.tanks[i].alive)return i;}return start;
}
function advanceTurn(s){
  evaluateWin(s);if(s.gameOver)return;
  finalizeShotSummary(s);
  const old=s.current;
  s.lastShotTraces=s.settings.tracer?s.traceCurrent.map(path=>path.slice()):[];s.traceCurrent=[];
  s.current=nextAliveIndex(s,s.current);
  const wrapped=s.current<=old;
  if(wrapped){
    s.round++;
    spawnSkillSet(s,false);
    maybeSpawnCrate(s);
  }
  if(s.windMult===0)s.wind=0;
  else s.wind=clamp(s.wind+rand(-16,16)*s.windMult,-55*s.arena.wind*s.windMult,55*s.arena.wind*s.windMult);
  s.turnTimer=s.turnTime;s.phase="aim";s.nextTurnDelay=0;
  const t=currentTank(s);if(t)t.fuel=t.maxFuel;
  s.message=t?.isPlayer?"YOUR TURN":`${t?.name} AIMING`;s.messageTimer=1.1;
  if(t?.isPlayer){s.selectedWeapon=t.selected;s.selectedTier=t.selectedTier;s.playerAngle=t.angle;s.playerPower=t.power;}
}
function updateCrate(s,dt){
  if(!s.crate?.alive)return;const c=s.crate;c.vy+=s.gravity*.7*dt;c.y+=c.vy*dt;
  if(c.y>=terrainY(s,c.x)-9){c.y=terrainY(s,c.x)-9;c.vy=0;}
  for(const p of s.projectiles){
    if(p.alive&&Math.hypot(p.x-c.x,p.y-c.y)<15){
      c.alive=false;const owner=ownerOf(s,p);
      if(owner){
        const rewards=[];const rewardCount=Math.max(1,owner.airdropWeapons||1);for(let i=0;i<rewardCount;i++)rewards.push(addWeaponReward(s,owner,{airdrop:true}));
        const armor=15+(owner.crateArmorBonus||0);owner.armor=Math.min(120,owner.armor+armor);
        const first=rewards[0];s.message=`AIRDROP: ${WEAPONS[first.id].name} T${first.tier}${rewards.length>1?` + ${rewards.length-1} WEAPON`:""} + ${armor} ARMOR`;s.messageTimer=2.0;
      }
      p.alive=false;s.fx.push({kind:"cratePop",x:c.x,y:c.y,life:.55,max:.55,color:"#ffd86a"});break;
    }
  }
  if(!c.alive)s.crate=null;
}

export function updateState(s,dt){
  if(s.gameOver)return;
  s.messageTimer=Math.max(0,s.messageTimer-dt);s.cameraShake=Math.max(0,s.cameraShake-dt*18);
  for(const n of s.damageNumbers){n.life-=dt;n.y+=n.vy*dt;n.x+=n.drift*dt;n.vy*=Math.pow(.965,dt*60);}
  s.damageNumbers=s.damageNumbers.filter(n=>n.life>0);
  if(s.damageSummary){s.damageSummary.life-=dt;if(s.damageSummary.life<=0)s.damageSummary=null;}
  updateFields(s,dt);updateFires(s,dt);updateCrate(s,dt);
  for(const p of s.projectiles)updateProjectile(s,p,dt);
  for(const p of s.projectiles){if(!p.alive&&!p.traceSaved&&p.trace?.length>1){p.traceSaved=true;s.traceCurrent.push(p.trace.slice());}}
  s.projectiles=s.projectiles.filter(p=>p.alive);s.fx.forEach(f=>f.life-=dt);s.fx=s.fx.filter(f=>f.life>0);
  settleTanks(s,dt);evaluateWin(s);if(s.gameOver){finalizeShotSummary(s);return;}

  if(s.phase==="aim"){
    s.turnTimer-=dt;
    if(s.turnTimer<=0){const t=currentTank(s);if(t){if(t.isPlayer)fire(s,t,s.playerAngle,s.playerPower,t.selected);else performBotShot(s,t);}}
  }
  const no=s.projectiles.length===0,transient=s.fields.some(f=>["gravity","voidwell","groundwave","echo","timebomb","faultPop","burnTarget","lightningStrike","stickyMine","snake"].includes(f.kind));
  if(s.phase==="shot"&&no&&!transient&&!s.shotInProgress){s.nextTurnDelay-=dt;if(s.nextTurnDelay<=0)advanceTurn(s);}
  else if(s.phase==="shot"&&no&&!transient&&s.shotInProgress)scheduleTurnEnd(s,.8);
}

function simulateLanding(s,t,angle,power){
  const d=weaponDef(t.selected,t.selectedTier||1),speed=85+power*3.05;let x=t.x+Math.cos(angle)*18,y=t.y-8-Math.sin(angle)*18,vx=Math.cos(angle)*speed,vy=-Math.sin(angle)*speed;
  const dt=.035;
  for(let i=0;i<260;i++){vx+=s.wind*dt;vy+=s.gravity*(d.gravity||1)*dt;x+=vx*dt;y+=vy*dt;if(x<0||x>=s.width||y>s.height)return{x:clamp(x,0,s.width),y:s.height};if(y>=terrainY(s,x))return{x,y};}
  return{x,y};
}
function botPickWeapon(s,t,target){
  const usable=t.inventory.filter(v=>v.ammo>0),special=usable.filter(v=>v.id!=="pulse");if(!special.length)return usable[0];
  const dx=Math.abs(target.x-t.x),cluster=s.tanks.filter(q=>isEnemy(s,t,q)&&Math.abs(q.x-target.x)<115).length;
  let scored=special.map(slot=>{
    let score=Math.random()*18;const id=slot.id,d=weaponDef(id,slot.tier);score+=slot.tier*4;
    if(id==="rampart")score+=t.hp<t.maxHp*.45?24:-18;
    if(["roller","sawblade","viper","backroller"].includes(id))score+=dx<430?20:-12;
    if(["pinpoint","raillance"].includes(id))score+=dx<650?15:-5;
    if(["meteorchoir","skymarker","arcchain","megaflux","acidrain","areastrike","carpetbomb","asteroidbelt","gunship","quakecharge"].includes(id))score+=cluster*10;
    if(id==="burrow"||id==="ghostbomb")score+=Math.abs(terrainY(s,target.x)-terrainY(s,(target.x+t.x)/2))>45?14:0;
    return {slot,score};
  }).sort((a,b)=>b.score-a.score);
  return scored[0].slot;
}
function botReposition(s,t,target){
  if(t.fuel<=5)return;
  const slope=Math.abs(terrainSlope(s,t.x)),dist=Math.abs(target.x-t.x);
  if(slope<.28&&dist>260&&Math.random()>.32)return;
  const preferred=target.x>t.x?-1:1; // usually create space for arcs
  const tries=[preferred,-preferred];
  for(const dir of tries){
    let moved=0;
    for(let i=0;i<12;i++){if(moveTank(s,t,dir,4)){moved+=4;}else break;}
    if(moved>8)return;
  }
}
export function performBotShot(s,t){
  const enemies=aliveEnemies(s,t);if(!enemies.length)return;
  const target=enemies.sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
  botReposition(s,t,target);
  const chosen=botPickWeapon(s,t,target);if(!chosen)return;selectWeapon(s,t,chosen.id,chosen.tier);
  const weaponId=chosen.id,tier=chosen.tier;
  if(weaponId==="raillance"){const ang=Math.atan2(t.y-target.y,target.x-t.x);fire(s,t,ang,65,weaponId,tier);return;}
  let best={score:Infinity,angle:Math.PI*.5,power:60},dir=target.x>=t.x?1:-1;
  for(let i=0;i<s.diff.aiSamples;i++){
    const angle=dir>0?rand(.18,Math.PI*.48):rand(Math.PI*.52,Math.PI-.18),power=rand(28,100);
    const land=simulateLanding(s,{...t,selected:weaponId,selectedTier:tier},angle,power),score=Math.abs(land.x-target.x)+Math.abs(land.y-target.y)*.15;
    if(score<best.score)best={score,angle,power};
  }
  best.angle+=rand(-s.diff.aimError,s.diff.aimError);best.power=clamp(best.power+rand(-s.diff.powerError,s.diff.powerError),10,100);
  t.angle=best.angle;t.power=best.power;fire(s,t,best.angle,best.power,weaponId,tier);
}
