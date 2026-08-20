import {WEAPONS,WEAPON_IDS,DIFFICULTIES,MODES,ARENAS,TANK_COLORS,MATCH_DEFAULTS} from "./CraterClashData.js";
import {getWeaponTierStats,getWeaponTierCap,rollWeaponTier,getRogueEnemyScale,rogueAllowedWeaponIds} from "./CraterClashProgression.js";
export const GRAVITY=150;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const rint=(a,b)=>Math.floor(rand(a,b+1));
// Keeps the UI at 0–100% power, but gives the upper half considerably more launch energy.
// At 100 power this is ~34% faster than the previous V6 maximum.
export function launchSpeedFromPower(power){
  const p=clamp(Number(power)||0,0,100);
  return 85+p*3.05+Math.max(0,p-45)*2.40;
}

export function createTerrain(width,height,arenaIndex=0){
  const arena=ARENAS[arenaIndex]||ARENAS[0];
  const arr=new Float32Array(Math.ceil(width)+2);
  const phases=Array.from({length:Math.max(1,arena.hills)},()=>rand(0,Math.PI*2));
  const amps=Array.from({length:arena.hills},(_,i)=>height*(.020+arena.roughness*.012)/(1+i*.20));
  const gaussian=(q,c,w)=>Math.exp(-Math.pow((q-c)/w,2));
  const macroScale=arena.landform??1;
  // ShellShock-like macro terrain: a few large hills/valleys sit underneath the smaller procedural noise.
  // This creates readable slopes, bowls and plateaus instead of a mostly flat waveline.
  const macroFeatures=[
    {c:rand(.16,.30),w:rand(.13,.21),a:rand(-.105,.075)*height*macroScale},
    {c:rand(.43,.58),w:rand(.15,.24),a:rand(-.095,.090)*height*macroScale},
    {c:rand(.70,.86),w:rand(.13,.21),a:rand(-.105,.075)*height*macroScale}
  ];
  for(let x=0;x<arr.length;x++){
    const q=x/Math.max(1,width),u=(q-.5)*2;
    let y=height*arena.base;
    for(const f of macroFeatures)y+=f.a*gaussian(q,f.c,f.w);
    y+=Math.sin(q*Math.PI*2+phases[0]) * height*.028*macroScale;
    for(let i=0;i<arena.hills;i++){
      const freq=(i+1)*Math.PI*2/width*(.55+i*.22);
      y+=Math.sin(x*freq+phases[i])*amps[i];
    }
    y+=Math.sin(x*.011+phases[0])*height*.015*arena.roughness;
    switch(arena.profile){
      case "flats":
        y=height*arena.base+Math.sin(q*Math.PI*2+phases[0])*height*.018+Math.sin(q*Math.PI*6+phases[1])*height*.007;
        break;
      case "caldera":
        // Lower surface in the middle, higher shoulders at the map edges.
        y+=height*(.105*(1-u*u)-.018);
        break;
      case "twinpeaks":
        y-=height*.105*(gaussian(q,.29,.12)+gaussian(q,.72,.12));
        y+=height*.065*gaussian(q,.505,.17);
        break;
      case "dunes":
        y=height*arena.base+Math.sin(q*Math.PI*3.1+phases[0])*height*.050+Math.sin(q*Math.PI*7.0+phases[1])*height*.013;
        break;
      case "shattered":
        y+=Math.sin(q*Math.PI*18+phases[0])*height*.020+Math.sin(q*Math.PI*31+phases[1])*height*.010;
        break;
    }
    arr[x]=clamp(y,height*.40,height*.87);
  }
  const passes=arena.smoothPasses??4;
  for(let pass=0;pass<passes;pass++){
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
function repairTerrainTowardInitial(s,strength=.15){
  if(!s.initialTerrain)return;
  const q=clamp(strength,0,1);
  for(let x=0;x<s.terrain.length;x++)s.terrain[x]+=(s.initialTerrain[x]-s.terrain[x])*q;
}

function weaponDef(id,tier=1){return getWeaponTierStats(id,tier);}

function windSettingMultiplier(v){
  return v==="off"?0:v==="low"?.55:v==="extreme"?1.65:1;
}
function densityChance(v){return v==="off"?0:v==="low"?.28:v==="high"?.90:.58;}
function mobilityGrip(v){return v==="improved"?.90:v==="climber"?1.04:v==="allterrain"?1.20:.80;}

function normalizeSettings(settings={}){
  return {...MATCH_DEFAULTS,...settings};
}

function rollSpecialSlot({maxTier=4,luck=0,airdrop=false,botBonus=0,usedIds=null,allowedIds=null,quality=1}={}){
  const allowed=allowedIds?.length?new Set(allowedIds):null;
  let pool=WEAPON_IDS.filter(id=>id!=="pulse"&&(!allowed||allowed.has(id))&&(!usedIds||!usedIds.has(id)));
  if(!pool.length)pool=WEAPON_IDS.filter(id=>id!=="pulse"&&(!allowed||allowed.has(id)));
  const id=pool[rint(0,pool.length-1)];
  const tier=rollWeaponTier({airdrop,maxTier,luck,botBonus,weaponId:id,quality});
  return {id,tier,ammo:1};
}

function makeInventory(count=13,{maxTier=4,luck=0,botBonus=0,allowedIds=null,quality=1}={}){
  const chosen=[{id:"pulse",tier:1,ammo:999}],used=new Set(["pulse"]);
  while(chosen.length<count){
    const slot=rollSpecialSlot({maxTier,luck,botBonus,usedIds:used,allowedIds,quality});
    chosen.push(slot);used.add(slot.id);
  }
  return chosen;
}
function makeTrainingInventory(){
  const out=[{id:"pulse",tier:1,ammo:999}];
  for(const id of WEAPON_IDS){
    if(id==="pulse")continue;
    for(let tier=1;tier<=getWeaponTierCap(id);tier++)out.push({id,tier,ammo:999});
  }
  return out;
}
function tankGround(s,t){return terrainY(s,t.x)-11;}

function spawnSkillSet(s,initial=false){
  // roundsLeft is measured in PLAYER turns: this function is called whenever play wraps back to the player.
  if(!initial){
    for(const o of s.skillObjects)if(Number.isFinite(o.roundsLeft))o.roundsLeft--;
    s.skillObjects=s.skillObjects.filter(o=>!Number.isFinite(o.roundsLeft)||o.roundsLeft>0);
  }
  const chance=densityChance(s.settings.skillObjects);
  if(chance<=0)return;
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
      s.skillObjects.push({id:s.nextId++,kind:"bumper",x,y:rand(s.height*.24,Math.max(s.height*.28,ground-65)),len:rand(80,135),angle:rand(-.65,.65),roundsLeft:2});
    }else{
      if(max-s.skillObjects.length<2){
        const x=rand(s.width*.23,s.width*.77),ground=terrainY(s,x);
        s.skillObjects.push({id:s.nextId++,kind:"multiplier",x,y:rand(s.height*.22,Math.max(s.height*.26,ground-75)),r:20,value:2,roundsLeft:2});
      }else{
        const pair=s.nextId++;
        let x1=rand(s.width*.18,s.width*.42),x2=rand(s.width*.58,s.width*.84);
        let y1=rand(s.height*.24,Math.max(s.height*.28,terrainY(s,x1)-80));
        let y2=rand(s.height*.24,Math.max(s.height*.28,terrainY(s,x2)-80));
        s.skillObjects.push({id:s.nextId++,kind:"portal",pair,x:x1,y:y1,r:21,roundsLeft:2,color:"#7be7ff"});
        s.skillObjects.push({id:s.nextId++,kind:"portal",pair,x:x2,y:y2,r:21,roundsLeft:2,color:"#d487ff"});
      }
    }
  }
}

function maybeSpawnCrate(s){
  const chance=densityChance(s.settings.crates);
  if(chance<=0||Math.random()>chance)return;
  // Roughly 40% of loot opportunities are suspended in the air like a skill object.
  if(Math.random()<.40){
    if(s.skillObjects.some(o=>o.kind==="loot"))return;
    const x=rand(s.width*.20,s.width*.80),ground=terrainY(s,x);
    s.skillObjects.push({id:s.nextId++,kind:"loot",x,y:rand(s.height*.20,Math.max(s.height*.25,ground-95)),r:18,roundsLeft:2,color:"#ffd76a"});
    return;
  }
  if(s.crate)return;
  s.crate={x:rand(s.width*.18,s.width*.82),y:-25,vy:0,alive:true,grounded:false,quality:"airdrop"};
}

function chooseSpawnX(s,lo,hi,used=[],minSep=55){
  let best=lo+(hi-lo)*.5,bestScore=Infinity;
  for(let i=0;i<90;i++){
    const x=rand(lo,hi),slope=Math.abs(terrainSlope(s,x));
    const sep=used.length?Math.min(...used.map(v=>Math.abs(v-x))):s.width;
    const separationPenalty=sep<minSep?(minSep-sep)*4:0;
    const edgePenalty=(x<28||x>s.width-28)?60:0;
    const score=slope*170+separationPenalty+edgePenalty+Math.random()*4;
    if(score<bestScore){best=x;bestScore=score;}
  }
  return clamp(best,22,s.width-22);
}
function buildSpawnXs(s,tankCount,mode){
  if(mode==="training"){
    const margin=s.width*.075;return Array.from({length:tankCount},(_,i)=>margin+(s.width-margin*2)*(i/Math.max(1,tankCount-1)));
  }
  const out=[];
  if(mode==="teams"){
    const half=tankCount/2,minSep=Math.max(42,s.width*.075);
    for(let i=0;i<half;i++)out.push(chooseSpawnX(s,s.width*.08,s.width*.45,out,minSep));
    const right=[];for(let i=0;i<half;i++)right.push(chooseSpawnX(s,s.width*.55,s.width*.92,right,minSep));
    return [...out,...right];
  }
  if(mode==="duel"){
    // Duel sides remain readable, but ranges are broad enough that some starts are surprisingly close.
    const close=Math.random()<.48;
    const left=chooseSpawnX(s,s.width*(close?.16:.08),s.width*(close?.43:.47),[],50);
    const right=chooseSpawnX(s,s.width*(close?.50:.53),s.width*(close?.80:.92),[left],Math.max(70,s.width*.10));
    return Math.random()<.5?[left,right]:[right,left];
  }
  const minSep=Math.max(38,s.width*(tankCount>=8?.065:tankCount>=6?.078:.095));
  for(let i=0;i<tankCount;i++)out.push(chooseSpawnX(s,s.width*.07,s.width*.93,out,minSep));
  // Avoid a repetitive player-on-the-left feel: owner 0 keeps its identity but receives a random valid slot.
  for(let i=out.length-1;i>0;i--){const j=rint(0,i);[out[i],out[j]]=[out[j],out[i]];}
  return out;
}

function shuffleIds(ids){
  const out=[...ids];
  for(let i=out.length-1;i>0;i--){const j=rint(0,i);[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
function refreshAssassinTargets(s){
  if(s.mode!=="assassin")return;
  const aliveSet=new Set(s.tanks.filter(t=>t.alive).map(t=>t.id));
  const alive=(s.assassinOrder||[]).filter(id=>aliveSet.has(id));
  for(const t of s.tanks)t.assassinTargetId=null;
  if(alive.length<=1)return;
  for(let i=0;i<alive.length;i++){
    const t=s.tanks.find(q=>q.id===alive[i]);
    if(t)t.assassinTargetId=alive[(i+1)%alive.length];
  }
}
export function getAssassinTarget(s,t){
  if(!s||s.mode!=="assassin"||!t)return null;
  return s.tanks.find(q=>q.alive&&q.id===t.assassinTargetId)||null;
}
export function getAssassinHunter(s,t){
  if(!s||s.mode!=="assassin"||!t)return null;
  return s.tanks.find(q=>q.alive&&q.assassinTargetId===t.id)||null;
}
export function createState({width,height,mode="ffa",difficulty="normal",arenaIndex=0,settings={},rogueRun=null}={}){
  const arena=ARENAS[arenaIndex]||ARENAS[0],m=MODES[mode],baseDiff=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
  const cfg=normalizeSettings(settings),rogueScale=rogueRun?getRogueEnemyScale(rogueRun):null;
  const training=mode==="training";
  let tankCount=training?5:mode==="duel"?2:Math.max(2,Math.min(8,Number(cfg.playerCount)||m.tanks||4));
  if(mode==="teams"&&tankCount%2)tankCount++;
  if(mode==="juggernaut")tankCount=Math.max(3,tankCount);
  const jugIndex=mode==="juggernaut"?(cfg.juggernautRole==="bot"?rint(1,tankCount-1):0):-1;
  const diff=rogueRun?{...baseDiff,aiSamples:rogueScale.samples,aimError:rogueScale.aimError,powerError:rogueScale.powerError}:baseDiff;
  const windMult=windSettingMultiplier(cfg.wind);
  const s={
    width,height,mode,difficulty,diff,arenaIndex,arena,settings:cfg,rogueRun,rogueScale,training,
    terrain:createTerrain(width,height,arenaIndex),
    wind:windMult?rand(-32,32)*arena.wind*windMult:0,windMult,gravity:GRAVITY*(arena.gravity||1),
    tanks:[],projectiles:[],fx:[],fields:[],fires:[],skillObjects:[],
    current:0,round:1,turnTime:Number(cfg.turnTime)||28,turnTimer:Number(cfg.turnTime)||28,phase:"aim",shotInProgress:false,nextTurnDelay:0,
    gameOver:false,winner:null,message:"YOUR TURN",messageTimer:1.8,cameraShake:0,
    selectedWeapon:"pulse",selectedTier:1,playerAngle:Math.PI*.25,playerPower:58,nextId:1,crate:null,
    lastShotTraces:[],botLastShotTraces:[],playerPersistentTraces:[],traceCurrent:[],skillHits:0,damageNumbers:[],damageSummary:null,activeShotSummary:null,
    telemetry:{},telemetryStartedAt:Date.now(),playerShotsFired:0,nextRestockAt:8,restockPending:false,restockCount:0,edgeWallHeight:height*.20,
    assassinOrder:[],juggernautId:null,modeScore:0
  };
  s.initialTerrain=s.terrain.slice();
  const xs=buildSpawnXs(s,tankCount,mode);

  const standardShared=rogueRun||training?null:makeInventory(cfg.weaponCount,{maxTier:4,luck:0,quality:cfg.weaponQuality});
  for(let i=0;i<tankCount;i++){
    const isJuggernaut=mode==="juggernaut"&&i===jugIndex;
    const team=mode==="teams"?(i<tankCount/2?0:1):mode==="juggernaut"?(isJuggernaut?1:0):i,isPlayer=i===0,isDummy=training&&!isPlayer,x=clamp(xs[i],25,width-25);
    const angle=x<width*.5?Math.PI*.25:Math.PI*.75;
    let maxHp=Number(cfg.hp)||100,maxFuel=Number(cfg.fuel)||100,grip=mobilityGrip(cfg.terrainMobility),critChance=.03,critMultiplier=1.5,luck=0,maxTier=4,startArmor=0,weaponCount=cfg.weaponCount,damageBonus=1,overchargeRate=1,airdropWeapons=1,crateArmorBonus=0;
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
    }else if(training){
      if(isPlayer){maxHp=500;maxFuel=9999;startArmor=100;maxTier=4;grip=1.28;inv=makeTrainingInventory();}
      else{maxHp=600;maxFuel=0;startArmor=75;maxTier=4;inv=[{id:"pulse",tier:1,ammo:999}];}
    }else if(isJuggernaut){
      const baseHp=Number(cfg.hp)||100;
      maxHp=Math.round((tankCount-1)*baseHp*1.5);
      weaponCount=Math.max(2,Math.ceil((Number(cfg.weaponCount)||12)*1.5));
      inv=makeInventory(weaponCount,{maxTier:4,luck:0,quality:cfg.weaponQuality});
      damageBonus=1.06;
    }else inv=standardShared.map(v=>({...v}));
    const fuelEfficiency=rogueRun&&isPlayer?rogueRun.stats.fuelEfficiency:1;
    const displayName=isPlayer?(isJuggernaut?"YOU · JUGGERNAUT":"YOU"):isDummy?`DUMMY ${i}`:mode==="teams"&&team===0?`ALLY ${i}`:mode==="juggernaut"?(isJuggernaut?"JUGGERNAUT":`HUNTER ${i}`):`BOT ${i}`;
    const tankColor=mode==="juggernaut"?(isJuggernaut?"#ffb54a":isPlayer?"#5df58a":"#6fd3ff"):mode==="teams"?(team===0?"#63e793":"#ff6672"):TANK_COLORS[i%TANK_COLORS.length];
    s.tanks.push({
      id:s.nextId++,name:displayName,isPlayer,isDummy,isJuggernaut,team,x,y:s.terrain[Math.round(x)]-11,
      hp:maxHp,maxHp,armor:startArmor,trainingArmor:startArmor,alive:true,color:tankColor,angle,power:58,
      inventory:inv,selected:"pulse",selectedTier:1,overcharge:0,overchargeReady:false,kills:0,damage:0,assassinTargetId:null,assassinXP:0,juggernautXP:0,
      maxFuel,fuel:maxFuel,grip,fuelEfficiency,critChance,critMultiplier,luck,maxTier,damageBonus,overchargeRate,airdropWeapons,crateArmorBonus,
      allowedWeaponIds:rogueRun?(isPlayer?rogueAllowedWeaponIds(rogueRun.stats.weaponPoolLevel):rogueAllowedWeaponIds(rogueScale.weaponPoolLevel)):WEAPON_IDS.filter(id=>id!=="pulse")
    });
  }
  s.playerAngle=s.tanks[0].angle;
  if(mode==="assassin"){
    s.assassinOrder=shuffleIds(s.tanks.map(t=>t.id));
    refreshAssassinTargets(s);
  }
  if(mode==="juggernaut")s.juggernautId=s.tanks[jugIndex]?.id||null;
  if(!training)spawnSkillSet(s,true);
  return s;
}
export const currentTank=s=>s.tanks[s.current]||null;
export function isEnemy(s,a,b){
  if(!(a&&b&&a.alive&&b.alive)||a.id===b.id)return false;
  if(s.mode==="teams"||s.mode==="juggernaut")return a.team!==b.team;
  if(s.mode==="assassin")return a.assassinTargetId===b.id;
  return true;
}
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
  // Premium loot deliberately ignores Rogue-run arsenal/tier unlocks. It is the exciting exception.
  const slot=rollSpecialSlot({maxTier:airdrop?4:t.maxTier,luck:t.luck,airdrop,botBonus:0,usedIds:used,allowedIds:airdrop?null:t.allowedWeaponIds,quality:s.settings?.weaponQuality||1});
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
  const requested=Math.min(Math.abs(distance),Math.max(1,t.fuel));
  const sub=Math.max(1,Math.ceil(requested/2.25));
  const step=requested/sub;
  let moved=0,totalCost=0;
  for(let i=0;i<sub;i++){
    const cx=t.x,nx=clamp(cx+dir*step,9,s.width-9);if(nx===cx)break;
    const cy=terrainY(s,cx),ny=terrainY(s,nx),uphill=Math.max(0,cy-ny);
    const local=Math.abs(terrainSlope(s,nx));
    const broad=Math.abs(Math.atan2(terrainY(s,nx+10)-terrainY(s,nx-10),20));
    // Narrow one/two-pixel crater lips are more forgiving than broad cliffs. This prevents tanks
    // getting trapped on tiny sharp scars while preserving meaningful slope upgrades.
    const narrowLip=local>t.grip&&broad<t.grip*.90&&uphill<7+t.grip*7;
    const stepLimit=8+t.grip*10;
    if((local>t.grip&&!narrowLip)||uphill>stepLimit){
      if(moved<=.01){s.message="TRACKS CAN'T CLIMB THIS SLOPE";s.messageTimer=.6;}
      break;
    }
    const effectiveSlope=Math.min(local,Math.max(broad,t.grip*.45));
    const cost=step*(1+effectiveSlope*1.55)*(t.fuelEfficiency||1);
    if(totalCost+cost>t.fuel+.01)break;
    t.x=nx;t.y=tankGround(s,t);moved+=step;totalCost+=cost;
  }
  if(moved<=0)return false;
  t.fuel=Math.max(0,t.fuel-totalCost);return true;
}

function projectileBase(s,t,angle,power,weaponId,tier=1,extra={}){
  const speed=launchSpeedFromPower(power)*(extra.launchSpeedMult||1);
  return {id:s.nextId++,owner:t.id,weaponId,tier,x:t.x+Math.cos(angle)*18,y:t.y-8-Math.sin(angle)*18,
    vx:Math.cos(angle)*speed,vy:-Math.sin(angle)*speed,age:0,alive:true,radius:4,bounces:0,wallBounces:0,
    trace:[],traceTimer:0,portalCooldown:0,bumperCooldown:0,critShot:false,x2Active:false,...extra};
}

export function fire(s,t,angle,power,weaponId=t.selected,weaponTier=t.selectedTier||1){
  if(!t?.alive||s.shotInProgress)return false;
  const slot=t.inventory.find(x=>x.id===weaponId&&x.tier===weaponTier&&x.ammo>0);if(!slot)return false;
  consume(t,weaponId,weaponTier);t.angle=angle;t.power=power;
  // QoL: the player's previous completed trajectory stays visible through all bot turns and
  // is only cleared at the moment the player commits the next shot.
  if(t.isPlayer&&s.settings?.tracer)s.playerPersistentTraces=[];
  if(t.isPlayer&&!s.training){
    s.playerShotsFired++;
    if(s.playerShotsFired>=s.nextRestockAt){s.restockPending=true;s.nextRestockAt+=8;}
  }
  const d=weaponDef(weaponId,weaponTier);
  const over=t.overchargeReady?1.28:1,crit=Math.random()<(t.critChance||0)?(t.critMultiplier||1.5):1,mult=over*crit*(t.damageBonus||1);
  if(t.overchargeReady){t.overchargeReady=false;t.overcharge=0;s.message="OVERCHARGED SHOT";s.messageTimer=1.1;}
  if(crit>1){s.message="CRITICAL SHOT";s.messageTimer=1.0;}
  s.phase="shot";s.shotInProgress=true;s.projectiles.length=0;s.traceCurrent=[];
  s.activeShotSummary={ownerId:t.id,weaponId,tier:weaponTier,totalDamage:0,hitCount:0,crit:crit>1,hadX2:false};
  const add=(a=angle,p=power,extra={})=>s.projectiles.push(projectileBase(s,t,a,p,weaponId,weaponTier,{damageMult:mult,startX:t.x,critShot:crit>1,x2Active:false,...extra}));
  s.fx.push({kind:"muzzle",weaponId,tier:weaponTier,x:t.x+Math.cos(angle)*19,y:t.y-8-Math.sin(angle)*19,angle,life:.28,max:.28,color:d.color});

  // V8 non-standard launch families. Their distinctive behavior begins before a normal projectile exists.
  if(weaponId==="quakecharge"){
    repairTerrainTowardInitial(s,d.repairStrength||.16);
    for(const q of s.tanks)if(isEnemy(s,t,q))damageTank(s,q,(d.repairDamage||d.damage)*mult,t,{crit:crit>1,x2:false});
    s.fx.push({kind:"quakeRepair",x:s.width/2,y:s.height*.55,life:.75,max:.75,color:d.color,strength:d.repairStrength||.16});
    s.message=`${d.name.toUpperCase()} · TERRAIN SHIFT`;s.messageTimer=1.35;s.shotInProgress=false;s.nextTurnDelay=.9;return true;
  }else if(weaponId==="digger"&&d.excavationCount){
    const count=d.excavationCount,mid=(count-1)/2;
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.excavationSpread||.04),clamp(power+rand(-4,3),12,100),{radius:3,diggerIndex:i,diggerImpactCount:0});
  }else if(weaponId==="pinata"){
    const n=d.pinatas||1,group=s.nextId++,mid=(n-1)/2;
    for(let i=0;i<n;i++)add(angle+(i-mid)*.018,clamp(power+(i-mid)*.65,10,100),{flareWeapon:true,pinataFlare:true,pinataGroup:group,pinataIndex:i,radius:4});
  }else if(weaponId==="napalm"&&d.fireStorm){
    add(angle,power,{flareWeapon:true,fireStormFlare:true,fireStormAngle:angle,fireStormPower:power,radius:5});
  }else if(weaponId==="snowball"&&d.snowStorm){
    add(angle,power,{flareWeapon:true,snowStormFlare:true,radius:5});
  }else if(weaponId==="synclets"){
    const n=d.syncCount||12,group=s.nextId++,mid=(n-1)/2;
    for(let i=0;i<n;i++){const q=(i-mid)/Math.max(1,mid),a=angle+q*(d.syncSpread||.11),pp=clamp(power+rand(-5,5),10,100);add(a,pp,{radius:2.5,syncGroup:group,syncPaused:false,syncDamageMin:d.syncDamageMin||4,syncDamageMax:d.syncDamageMax||10,noTerrainDamage:true});}
  }else if(weaponId==="batteringram"){
    const n=d.ramCount||1,mid=(n-1)/2;for(let i=0;i<n;i++)add(angle,clamp(power+(i-mid)*1.8,10,100),{age:-i*.055,radius:5,startX:t.x,ramApex:false,ramBouncesRemaining:d.ramBounces||0});
  }else if(weaponId==="rampage"){
    const dir=Math.cos(angle)>=0?1:-1,n=d.rampageCount||4;
    for(let i=0;i<n;i++){const phase=i/n*Math.PI*2;s.projectiles.push({id:s.nextId++,owner:t.id,weaponId,tier:weaponTier,kind:"rampageWave",x:t.x+dir*20,y:t.y-18,vx:dir*(d.rampageSpeed||315),vy:0,age:-i*.035,alive:true,radius:4,damageMult:mult,critShot:crit>1,x2Active:false,startY:t.y-18,wavePhase:phase,waveAmp:(d.rampageAmplitude||58)*(i%2?.82:1),waveFreq:(d.rampageWaves||2.2)*Math.PI*2/s.width,dir,noGravity:true,windFactor:0,skipSkillObjects:true,hitIds:[]});}
  }else if(weaponId==="fighterjet"){
    add(angle,power,{radius:7,fighterJet:true,startX:t.x,jetApexTriggered:false,windFactor:1});
  }else if(weaponId==="seagull"){
    add(angle,power,{radius:7,seagullShot:true,startX:t.x,lastPoopAt:0,windFactor:d.seagullWind||2});
  }else if(weaponId==="sniper"&&d.smartTrackers){
    const n=d.smartTrackers||10;
    for(let i=0;i<n;i++){let a=angle,pp=power;if(i<5)a=angle+(i-2)*(d.trackerAngleSpread||.075);else pp=clamp(power+(i-7)*(d.trackerPowerSpread||16)/2,10,100);add(a,pp,{age:-i*.055,radius:2,smartSnipeTracker:true,trackerAngle:a,trackerPower:pp,noTerrainDamage:true});}
  }else if(weaponId==="counter3000"){
    let seq=0;for(let group=1;group<=d.counterVolleys;group++){
      for(let i=0;i<group;i++){const off=(i-(group-1)/2)*(d.spread||.016);add(angle+off,power,{age:-(seq*(d.shotGap||.018)+group*(d.volleyGap||.18)),radius:2,counterShot:true});seq++;}
    }
  }else if(weaponId==="fleet"){
    const rows=d.fleetRows||[11],totalRows=rows.length;
    rows.forEach((count,row)=>{const mid=(count-1)/2;for(let i=0;i<count;i++){
      add(angle+(i-mid)*(d.formationSpread||.017),clamp(power+(row-(totalRows-1)/2)*4,10,100),{age:-row*.035,radius:2.5,fleetShot:true});
    }});
  }else if(weaponId==="flame"){
    const count=d.count||12;for(let i=0;i<count;i++){
      const wave=rand(-1.4,1.4);
      add(angle+rand(-(d.streamSpread||.035),d.streamSpread||.035),clamp(power+wave,12,100),{age:-i*(d.burstGap||.035),radius:2.5,flameShot:true,maxAge:5.2});
    }
  }else if(weaponId==="fireworks"){
    if(d.pyrotechnics)add(angle,power,{kind:"pyroShell",radius:5});
    else{const count=d.rockets||3,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.rocketSpread||.075),power,{kind:"fireworkRocket",radius:4,sparksPerRocket:d.sparksPerRocket||12});}
  }else if(weaponId==="bounder"){
    const count=d.count||1,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.045),power,{bounderShot:true,radius:4});
  }else if(weaponId==="uzi"){
    const count=d.count||10,mid=(count-1)/2,base=launchSpeedFromPower(100),multSpeed=(d.straightSpeed||950)/Math.max(1,base);
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.straightSpread||.018),100,{age:-i*.026,radius:1.7,noGravity:true,windFactor:0,skipSkillObjects:true,launchSpeedMult:multSpeed,straightBullet:true,maxAge:1.55});
  }else if(weaponId==="stickybomb"){
    if(d.stickyRain)add(angle,power,{flareWeapon:true,stickyRainFlare:true,radius:4});
    else if(d.mineLayer)add(angle,power,{mineLayerShot:true,radius:4,mineBounces:0,mineGroup:s.nextId++});
    else{const count=d.count||1,mid=(count-1)/2;for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.065),power,{stickyShot:true,radius:4});}
  }else if(weaponId==="deadweight"){
    add(angle,power,{deadWeightMode:d.deadRiser?"riser":"drop",radius:5});
  }else if(weaponId==="bfg1000"){
    add(angle,power,{launchSpeedMult:d.speedMult||.76,windFactor:d.windFactor||2,radius:7,distanceWeapon:true});
  }else if(weaponId==="tadpoles"){
    const count=d.count||12;for(let i=0;i<count;i++){const big=!!d.bullfrogBig&&i===Math.floor(count/2);
      add(angle+rand(-(d.streamSpread||.034),d.streamSpread||.034),clamp(power+rand(-2,1),10,100),{age:-i*(d.burstGap||.036),radius:big?7:3,tadpoleShot:true,tadHops:0,bullfrog:big,maxAge:5.2});
    }
  }else if(weaponId==="airstrike"||weaponId==="bolt"||weaponId==="recruiter"||weaponId==="carpetbomb"){
    add(angle,power,{flareWeapon:true,radius:4});
  }else if(weaponId==="tristar"){
    add(angle,power,{radius:5});
  }else if(weaponId==="orbvolley"){
    const count=d.count||3,salvos=Math.max(1,d.salvos||1),spread=d.spread||.05;
    let fired=0;for(let salvo=0;salvo<salvos;salvo++){const left=count-fired,groupsLeft=salvos-salvo,n=Math.ceil(left/groupsLeft),mid=(n-1)/2;
      for(let i=0;i<n;i++){const sweep=(salvo-(salvos-1)/2)*spread*.35;add(angle+sweep+(i-mid)*spread,power,{age:-salvo*(d.salvoGap||.16)-i*.012,radius:4});fired++;}
    }
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
    for(let i=0;i<count;i++)add(angle+(i-mid)*(d.spread||.07),Math.max(18,power*.78),{maxAge:6.0,burnData:{damage:d.burn||5,time:d.burnTime||3,r:24}});
  }else if(weaponId==="hunter"||weaponId==="droneswarm"){
    for(let i=0;i<d.count;i++)add(angle+rand(-.10,.10),power-rand(0,8),{homingDelay:(weaponId==="hunter"?.38:.25)+i*.055,homingStrength:d.homing});
  }else if(weaponId==="sniper"){
    add(angle,power,{radius:2,sniperLive:true,terrainPierce:!!d.terrainPierce,noTerrainDamage:true,startX:t.x});
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
function damageOrderForOwner(s,owner){
  const alive=s.tanks.filter(t=>t.alive);
  if(s.mode!=="assassin"||!owner)return alive;
  const target=getAssassinTarget(s,owner);
  if(!target)return alive;
  return [target,...alive.filter(t=>t.id!==target.id)];
}
function explosion(s,x,y,radius,damage,owner,terrainScale=1,color="#fff",meta={}){
  if(radius>0&&terrainScale>0)modifyTerrainCrater(s,x,y,radius,terrainScale);
  s.fx.push({kind:"explosion",x,y,r:Math.max(12,radius),life:.55,max:.55,color});
  s.cameraShake=Math.max(s.cameraShake,Math.min(12,radius*.09));
  if(radius<=0)return;
  for(const t of damageOrderForOwner(s,owner)){
    if(!t.alive)continue;
    const dist=Math.hypot(t.x-x,t.y-y);if(dist>radius+14)continue;
    damageTank(s,t,damage*clamp(1-dist/(radius+18),.08,1),owner,meta);
  }
}
function explosionP(s,p,x,y,radius,damage,owner,terrainScale=1,color="#fff"){
  return explosion(s,x,y,radius,damage,owner,terrainScale,color,damageMeta(p));
}
function explosionFlat(s,p,x,y,radius,damage,owner,terrainScale=.5,color="#fff"){
  if(radius>0&&terrainScale>0)modifyTerrainCrater(s,x,y,radius,terrainScale);
  s.fx.push({kind:"explosion",x,y,r:Math.max(12,radius),life:.55,max:.55,color});
  s.cameraShake=Math.max(s.cameraShake,Math.min(10,radius*.075));
  for(const t of damageOrderForOwner(s,owner)){if(!t.alive)continue;if(Math.hypot(t.x-x,t.y-y)<=radius+12)damageTank(s,t,damage,owner,damageMeta(p));}
}
function damageTankP(s,p,t,amount,owner){
  return damageTank(s,t,amount,owner,damageMeta(p));
}
function damageTank(s,t,amount,owner,meta={}){
  if(amount<=0||!t.alive)return 0;
  if(owner&&owner.id!==t.id){
    if((s.mode==="teams"||s.mode==="juggernaut")&&owner.team===t.team)return 0;
    if(s.mode==="assassin"&&owner.assassinTargetId!==t.id)return 0;
  }
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
  if(t.hp<=0){
    t.hp=0;
    if(s.training&&t.isDummy){
      t.knockedOut=true;
      s.fx.push({kind:"tankPop",x:t.x,y:t.y,life:.60,max:.60,color:t.color});
    }else{
      t.alive=false;
      if(owner&&owner.id!==t.id){
        owner.kills++;
        if(s.mode==="assassin"){
          owner.assassinXP=(owner.assassinXP||0)+2;
          s.modeScore=(s.modeScore||0)+2;
          s.message="ASSASSINATION · DOUBLE KILL XP";
          s.messageTimer=1.35;
        }else if(s.mode==="juggernaut"&&t.isJuggernaut&&!owner.isJuggernaut){
          owner.juggernautXP=(owner.juggernautXP||0)+2;
          s.modeScore=(s.modeScore||0)+2;
          s.message="JUGGERNAUT DOWN · DOUBLE KILL XP";
          s.messageTimer=1.35;
        }
      }
      if(s.mode==="assassin")refreshAssassinTargets(s);
      s.fx.push({kind:"tankPop",x:t.x,y:t.y,life:.75,max:.75,color:t.color});
    }
  }
  return applied;
}
function finalizeShotSummary(s){
  const q=s.activeShotSummary;if(!q)return;
  s.damageSummary={...q,life:1.75,max:1.75};
  if(s.training&&q.ownerId===s.tanks[0]?.id){
    const key=`${q.weaponId}:${q.tier}`,e=s.telemetry[key]||(s.telemetry[key]={weaponId:q.weaponId,tier:q.tier,shots:0,hitShots:0,totalDamage:0,maxDamage:0,totalHitEvents:0,lastDamage:0});
    e.shots++;e.totalDamage+=q.totalDamage;e.maxDamage=Math.max(e.maxDamage,q.totalDamage);e.totalHitEvents+=q.hitCount;e.lastDamage=q.totalDamage;if(q.totalDamage>0)e.hitShots++;
  }
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
  s.fx.push({kind:"weaponBurst",weaponId:p.weaponId,tier:p.tier,x:p.x,y:p.y,life:.52,max:.52,color:d.color});

  // Twinkler is no longer another generic radial-star weapon. It paints a glitter line in the air
  // and then fires staggered vertical twinkles into the ground.
  if(p.weaponId==="twinkler"&&d.twinkleRain){
    p.didSplit=true;
    const n=d.fragments||6,span=75+n*5;
    for(let i=0;i<n;i++){
      const q=n<=1?.5:i/(n-1),x=clamp(p.x-span/2+q*span,6,s.width-6);
      s.fields.push({kind:"twinkleDrop",x,y:p.y+Math.sin(i*1.7)*8,delay:.10+i*.055,life:.14+i*.055,max:.14+i*.055,
        owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*(p.damageMult||1),r:d.radius||13,color:d.color,tier:p.tier});
    }
    if(d.twinkleCross)s.fields.push({kind:"twinkleFinal",x:p.x,y:p.y,delay:.25+n*.055,life:.30+n*.055,max:.30+n*.055,
      owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*.8*(p.damageMult||1),r:(d.radius||13)+8,color:d.color});
    return;
  }

  // Apex Splitter stays multi-stage: 1 → 2 → 4 → 8, but the first split is now near terrain.
  if(p.weaponId==="prismsplit"&&d.splitChain){
    const stage=p.splitStage||0;
    if(stage>=d.splitChain){p.didSplit=true;return;}
    const base=Math.atan2(-p.vy,p.vx),next=stage+1;
    for(const off of [-.18,.18]){
      const a=base+off*(1+stage*.36),sp=Math.max(105,Math.hypot(p.vx,p.vy)*.82);
      spawnMiniProjectile(s,p,{angle:a,speed:sp,extra:{splitStage:next,splitAt:.18,didSplit:next>=d.splitChain,hitGrace:.10}});
    }
    p.didSplit=true;return;
  }

  p.didSplit=true;
  const base=Math.atan2(-p.vy,p.vx),n=d.fragments;
  for(let i=0;i<n;i++){
    let angle,speed,extra={hitGrace:d.fragmentGrace||.10};
    if(p.weaponId==="tristar"){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=base+q*(n>=7?1.00:.78);speed=rand(145,185);extra.starPoint=true;
    }else if(p.weaponId==="starburst"&&d.starRain){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=Math.PI*.50+q*.72;speed=rand(105,155);extra.starLance=true;
    }else if(p.weaponId==="kernelpop"){
      angle=Math.PI*(.18+.64*(i/Math.max(1,n-1)))+rand(-.08,.08);speed=rand(85,135);extra.customBounces=d.bounces||1;extra.kernelChain=!!d.kernelChain;
    }else if(p.weaponId==="emberrain"){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=Math.PI*.50+q*.92;speed=rand(95,145);extra.burnData={damage:2,time:d.burnTime||3.5,r:28};
    }else if(p.weaponId==="shardbloom"){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=Math.PI*.50+q*1.12;speed=rand(115,175);extra.shard=true;
    }else if(p.weaponId==="prismsplit"){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=base+q*.95;speed=rand(130,180);extra.prismShard=true;
    }else if(p.weaponId==="cactus"){
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=Math.PI*.50+q*1.25;speed=d.spikeSpeed||160;extra.pierceHits=d.spikePierce?1:0;extra.cactusSpike=true;
    }else{
      const q=(i-(n-1)/2)/Math.max(1,n-1);angle=base+q*1.25;speed=rand(125,180);
    }
    spawnMiniProjectile(s,p,{angle,speed,extra});
  }
  if(d.starCore&&(p.weaponId==="tristar"||p.weaponId==="starburst")){
    spawnMiniProjectile(s,p,{angle:Math.PI*.5,speed:115,kind:"starCore",extra:{fragDamage:d.damage*1.65,radius:5,hitGrace:.10,noWind:true}});
  }
  if(d.shardHeavy&&p.weaponId==="shardbloom"){
    spawnMiniProjectile(s,p,{angle:Math.PI*.5,speed:120,kind:"shardCore",extra:{fragDamage:d.damage*1.6,radius:5,hitGrace:.10}});
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
    spawnMiniProjectile(s,{...p,x,y:y-10},{angle:a,speed:sp,extra:{customBounces:d.petalBounce||0,pierceHits:d.spikePierce?1:0,homingStrength:d.leafHoming||0,homingDelay:.3,breakerDepth:mode==="breaker"?(d.breakerChainDepth||1):0,hitGrace:d.fragmentGrace||.12}});
  }
}
function spawnSwarm(s,p,d,x,y,type){
  for(let i=0;i<d.fragments;i++){
    const a=Math.PI*(.18+.64*Math.random()),spawnX=x+Math.cos(a)*18,spawnY=y-22-Math.sin(a)*10;
    spawnMiniProjectile(s,{...p,x:spawnX,y:spawnY},{angle:a,speed:rand(115,170),kind:"swarm",extra:{homingStrength:d.homing||1.2,homingDelay:.22+i*.025,maxAge:d.beeLife||3.0,swarmType:type,hitGrace:d.fragmentGrace||.18}});
  }
}
function spawnStrike(s,p,d,x,kind="skyBomb"){
  const count=d.bombs||5;
  for(let i=0;i<count;i++){
    let px;
    if(p.weaponId==="carpetbomb"){const q=count<=1?0:i/(count-1);px=clamp(x-(d.spreadX||240)/2+q*(d.spreadX||240),8,s.width-8);if(d.zigzag)px=clamp(px+(i%2?18:-18),8,s.width-8);}
    else if(d.precisionStrike){const q=count<=1?.5:i/(count-1);px=clamp(x+(q-.5)*2*(d.spreadX||60),8,s.width-8);}
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
  if(d.ac130){spawnGunshipRun(s,p,d,x,{ac130:true});return;}
  const positions=[];
  if(d.artilleryOrder)positions.push(x,clamp(x-d.spreadX,8,s.width-8),clamp(x+d.spreadX,8,s.width-8));
  else for(let i=0;i<d.bombs;i++){
    const q=d.bombs<=1?.5:i/(d.bombs-1),off=(q-.5)*2*d.spreadX;
    positions.push(clamp(x+off,8,s.width-8));
  }
  positions.forEach((px,i)=>s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"airstrikeBomb",x:px,y:-100-i*24,
    vx:d.artilleryOrder?0:rand(-3,3),vy:d.artilleryOrder?155:rand(145,175),age:-(d.artilleryOrder?[0,.35,.70][i]||0:i*.055),alive:true,
    damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:d.artilleryOrder?7:4,noTerrainDamage:false}));
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}

function spawnCarpetFamily(s,p,d,x){
  const waves=Math.max(1,d.carpetWaves||1),count=d.bombs||15;
  for(let wave=0;wave<waves;wave++){
    const dir=((x>s.width/2?1:-1)*(wave%2===0?1:-1)),start=dir>0?-40:s.width+40;
    for(let i=0;i<count;i++){
      const q=count<=1?0:i/(count-1),tx=clamp(x-d.spreadX/2+q*d.spreadX,8,s.width-8),sy=-70-i*3-wave*35;
      const dx=tx-start,dy=terrainY(s,tx)-sy,len=Math.max(1,Math.hypot(dx,dy)),speed=235;
      s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"carpetBombDrop",x:start,y:sy,vx:dx/len*speed,vy:dy/len*speed,
        age:-.15-i*.045-wave*.22,alive:true,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4,noGravity:true,windFactor:0,noTerrainDamage:true,carpetFire:!!d.burn});
    }
  }
  if(d.carpetHeavy)for(let i=0;i<d.carpetHeavy;i++){
    const px=clamp(x+(i-(d.carpetHeavy-1)/2)*74,8,s.width-8);
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"carpetHeavy",x:px,y:-260-i*30,vx:0,vy:155,age:-.7-i*.22,alive:true,
      damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8,heavyDamage:28,heavyRadius:38});
  }
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}

function spawnGunshipRun(s,p,d,x,{ac130=false}={}){
  s.fields.push({kind:"gunshipRun",x:-80,y:58,targetX:x,dir:1,life:3.2,max:3.2,tick:.08,shotIndex:0,
    bullets:d.gunshipBullets||10,cannons:d.gunshipCannons||2,span:d.gunshipSpan||240,owner:p.owner,weaponId:p.weaponId,tier:p.tier,
    damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,bulletDamage:d.damage,cannonDamage:d.gunshipCannonDamage||22,
    missileDamage:d.gunshipMissileDamage||0,missile:!!d.gunshipMissile,ac130,color:d.color});
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}
function spawnHoverStrike(s,p,d,x){
  const target=nearestEnemy(s,p.owner,x,terrainY(s,x),240),tx=target?.x??x;
  s.fields.push({kind:"hoverStrike",x:tx,y:Math.max(45,terrainY(s,tx)-145),targetX:tx,life:(d.hoverDelay||.75)+.65,max:(d.hoverDelay||.75)+.65,
    delay:d.hoverDelay||.75,drops:d.hoverDrops||1,spread:d.hoverSpread||0,owner:p.owner,weaponId:p.weaponId,tier:p.tier,
    damage:d.damage*(p.damageMult||1),r:d.radius||36,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color,spawned:false});
}
function spawnDiscoHang(s,p,d,x){
  s.fields.push({kind:"discoHang",x,y:56,targetX:x,life:2.45,max:2.45,delay:d.discoDelay||.45,tick:d.discoDelay||.45,index:0,
    shots:d.discoShots||8,span:d.discoSpan||220,owner:p.owner,weaponId:p.weaponId,tier:p.tier,damage:d.damage*(p.damageMult||1),
    r:d.radius||12,cross:!!d.discoCross,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color});
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:.9,max:.9,color:d.color});
}
function spawnPalmTree(s,p,d,x){
  s.fields.push({kind:"palmTree",x,y:terrainY(s,x)-4,life:1.9,max:1.9,delay:d.palmDelay||.34,index:0,drops:d.palmDrops||5,span:d.palmSpan||140,
    owner:p.owner,weaponId:p.weaponId,tier:p.tier,damage:d.damage*(p.damageMult||1),r:d.radius||14,heavy:!!d.palmHeavy,
    critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color});
}
function spawnCactusStrike(s,p,d,x){
  const pods=d.cactusPods||3,mid=(pods-1)/2;
  for(let i=0;i<pods;i++){
    const px=clamp(x+(i-mid)*(d.cactusPodSpread||72),8,s.width-8);
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"cactusPod",x:px,y:-80-i*18,vx:0,vy:145,age:-.18-i*.08,alive:true,
      damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:5,noWind:true});
  }
  s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.0,max:1.0,color:d.color});
}
function spawnTimeEchoes(s,p,d,x,y){
  const pts=(p.trace||[]),n=d.timeEchoes||2;
  const chosen=[];
  for(let i=0;i<n;i++){
    const q=(i+1)/(n+1),idx=Math.max(0,Math.min(pts.length-1,Math.floor((pts.length-1)*(1-q*(d.timeTraceBack||.45)))));
    chosen.push(pts[idx]||{x,y});
  }
  chosen.unshift({x,y});
  chosen.forEach((pt,i)=>s.fields.push({kind:"timeEcho",x:pt.x,y:Math.min(pt.y,terrainY(s,clamp(pt.x,0,s.width-1))),life:.10+i*(d.timeGap||.3),max:.10+i*(d.timeGap||.3),delay:.08+i*(d.timeGap||.3),
    owner:p.owner,damage:d.damage*(p.damageMult||1),r:d.radius||30,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color,index:i,total:chosen.length}));
  if(d.timeFinal)s.fields.push({kind:"timeEcho",x,y:terrainY(s,x),life:.15+chosen.length*(d.timeGap||.3),max:.15+chosen.length*(d.timeGap||.3),delay:.12+chosen.length*(d.timeGap||.3),
    owner:p.owner,damage:d.timeFinal*(p.damageMult||1),r:(d.radius||30)+10,critShot:!!p.critShot,x2Active:!!p.x2Active,color:"#c8d5ff",index:chosen.length,total:chosen.length+1});
}
function spawnFaultLine(s,p,d,x){
  const owner=ownerOf(s,p),n=d.faultPops||5,span=d.lineRadius||240,dir=Math.sign(p.vx||1),points=[];
  for(let i=0;i<n;i++){
    const q=n<=1?0:i/(n-1);let px;
    if(d.faultPattern==="forward")px=x+dir*q*span;
    else px=x-span/2+q*span;
    if(d.faultPattern==="rift")px+=((i%2)*2-1)*18;
    px=clamp(px,5,s.width-5);points.push(px);
    s.fields.push({kind:"faultPop",x:px,life:1.25,max:1.25,delay:.08+i*.085,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*(p.damageMult||1),r:d.radius||22,color:d.color});
  }
  if(d.faultCore)explosionP(s,p,x,terrainY(s,x),d.radius+8,d.faultCore*(p.damageMult||1),owner,.28,d.color);
  if(d.faultEnds&&points.length>1){for(const px of [points[0],points.at(-1)])s.fields.push({kind:"faultPop",x:px,life:1.5,max:1.5,delay:.72,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.faultEnds*(p.damageMult||1),r:(d.radius||22)+7,color:d.color});}
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


function distanceDamage(s,startX,x,min,max){
  const q=clamp(Math.abs(x-(startX??x))/Math.max(1,s.width*.72),0,1);
  return min+(max-min)*q;
}
function diggerBlast(s,p,d,x,y){
  const owner=ownerOf(s,p),mult=p.damageMult||1,gy=terrainY(s,x);
  modifyTerrainCrater(s,x,gy,d.diggerTerrainRadius||10,.68);
  explosionP(s,p,x,gy-1,d.radius||25,d.damage*mult,owner,0,d.color);
  s.fx.push({kind:"diggerHit",x,y:gy,life:.34,max:.34,color:d.color,index:p.diggerImpactCount||0,tier:p.tier});
}
function spawnBreakerPieces(s,p,d,x,y,count=d.breakerPieces||2,{madness=false,nextStage=0}={}){
  const n=count,span=madness?1.04:(d.breakerArc||1.20);
  for(let i=0;i<n;i++){
    const q=(i-(n-1)/2)/Math.max(1,(n-1)/2),a=Math.PI*.5+q*span+rand(-.025,.025),sp=(d.breakerJump||d.madnessJump||185)*rand(.96,1.05);
    spawnMiniProjectile(s,{...p,x:x+q*3,y:y-7},{angle:a,speed:sp,kind:madness?"madBreaker":"breakerPiece",extra:{hitGrace:.12,breakerStage:nextStage,madStage:nextStage,radius:madness?3.2:3.6}});
  }
  s.fx.push({kind:madness?"madnessBreak":"breakerOpen",x,y,life:.38,max:.38,color:d.color,count:n,stage:nextStage});
}
function resolveRinger(s,p,d,x,y){
  const owner=ownerOf(s,p),rings=[];
  if(d.olympicRings){
    const off=[[-52,-13],[0,-13],[52,-13],[-26,25],[26,25]];
    for(const [ox,oy] of off)rings.push({x:x+ox,y:y+oy,r:d.ringRadius||72});
  }else rings.push({x,y,r:d.ringRadius||55});
  for(const ring of rings){
    for(const t of s.tanks){
      if(!t.alive||t.id===p.owner)continue;
      const dist=Math.hypot(t.x-ring.x,t.y-ring.y);
      if(Math.abs(dist-ring.r)<=((d.ringThickness||10)+12))damageTankP(s,p,t,d.damage*(p.damageMult||1),owner);
    }
  }
  s.fx.push({kind:"ringerBurst",rings,life:.62,max:.62,color:d.color,tier:p.tier});
}
function spawnPinataBurst(s,f){
  const d=weaponDef(f.weaponId,f.tier),n=f.shots||d.pinataShots||16,span=f.span||d.pinataSpan||155;
  for(let i=0;i<n;i++){
    const pattern=f.pattern||0,q=(i-(n-1)/2)/Math.max(1,n-1),palette=["#ff68c9","#68e7ff","#ffe15e","#8cf06f","#bc82ff"];
    let a,sp;
    if(pattern===0){a=Math.PI*.5+q*1.45+rand(-.08,.08);sp=rand(105,185);}
    else if(pattern===1){a=Math.PI*(.18+.64*(i/Math.max(1,n-1)));sp=115+Math.abs(q)*65;}
    else {a=rand(.22,Math.PI-.22);sp=rand(90,175);}
    spawnMiniProjectile(s,{owner:f.owner,weaponId:f.weaponId,tier:f.tier,x:f.x,y:f.y,damageMult:f.damageMult,critShot:f.critShot,x2Active:f.x2Active},{angle:a,speed:sp,kind:"pinataShard",extra:{specialDamage:(d.damage||6)*f.damageMult,specialRadius:d.radius||15,customColor:palette[i%palette.length],hitGrace:.12}});
  }
  s.fx.push({kind:"pinataBurst",x:f.x,y:f.y,life:.55,max:.55,color:d.color,pattern:f.pattern||0});
}
function spawnNapalmFan(s,p,d){
  const n=d.napalmShots||11,mid=(n-1)/2,base=Math.atan2(-p.vy,p.vx),spread=.78;
  for(let i=0;i<n;i++){
    const q=(i-mid)/Math.max(1,mid),a=base+q*spread,sp=Math.max(110,Math.hypot(p.vx,p.vy)*.62)*rand(.92,1.08),one=rand(d.napalmMin||3,d.napalmMax||5),total=one*(d.napalmDouble?2:1);
    spawnMiniProjectile(s,p,{angle:a,speed:sp,kind:"napalmFrag",extra:{specialDamage:total*(p.damageMult||1),specialRadius:d.radius||15,noTerrainDamage:true,hitGrace:.08,customColor:i%2?"#ff7845":"#ffd05b"}});
  }
  s.fx.push({kind:"napalmBurst",x:p.x,y:p.y,life:.42,max:.42,color:d.color,count:n});
}
function spawnFireStorm(s,p,d,x){
  const n=d.fireStormMeteors||20,span=260;
  for(let i=0;i<n;i++){
    const q=n<=1?.5:i/(n-1),px=clamp(x+(q-.5)*span+rand(-18,18),8,s.width-8);
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"fireStormMeteor",x:px,y:-100-i*7,vx:rand(-15,15),vy:rand(135,185),age:-.15-i*.04,alive:true,radius:4,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,specialDamage:(d.damage||8)*(p.damageMult||1),specialRadius:d.radius||30});
  }
  s.fields.push({kind:"fireStormRocks",x,y:terrainY(s,x),life:5.25,max:5.25,delay:5.0,owner:p.owner,weaponId:p.weaponId,tier:p.tier,critShot:!!p.critShot,x2Active:!!p.x2Active,damageMult:p.damageMult,angle:p.fireStormAngle,power:p.fireStormPower,color:d.color});
  s.fx.push({kind:"fireStorm",x,y:terrainY(s,x),life:.7,max:.7,color:d.color});
}
function spawnSunburst(s,p,d,x,y){
  s.fields.push({kind:"sunburstField",x,y,life:2.25,max:2.25,owner:p.owner,weaponId:p.weaponId,tier:p.tier,critShot:!!p.critShot,x2Active:!!p.x2Active,damageMult:p.damageMult,phase:0,progress:0,range:Math.max(d.sunRayRange||120,s.width*(d.sunRayRangePct||0)),rays:d.sunRays||24,hitOut:{},hitBack:{},color:d.color});
  if(d.solarSparks){
    for(let i=0;i<d.solarSparks;i++){const a=i/d.solarSparks*Math.PI*2;spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:235,kind:"solarSpark",extra:{noGravity:true,windFactor:0,noTerrainDamage:true,specialDamage:(d.solarSparkDamage||30)*(p.damageMult||1),specialRadius:7,maxAge:4.5,hitGrace:.12}});}
  }
  s.fx.push({kind:"sunFlash",x,y,life:.55,max:.55,color:d.color,tier:p.tier});
}
function spawnShrapnel(s,p,d,x,y){
  explosionP(s,p,x,y,12,(d.shrapnelImpact||10)*(p.damageMult||1),ownerOf(s,p),.12,d.color);
  const n=d.shrapnelCount||30;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rand(-.035,.035);spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:(d.shrapnelSpeed||205)*rand(.80,1.12),kind:"shrapnelFrag",extra:{specialDamage:(d.shrapnelDamage||6)*(p.damageMult||1),specialRadius:d.radius||12,hitGrace:.10}});}
  s.fx.push({kind:"shrapnelBurst",x,y,life:.50,max:.50,color:d.color,count:n});
}
function spawnSnowStorm(s,p,d,x){
  const n=d.snowballs||3;
  for(let i=0;i<n;i++){const q=n<=1?.5:i/(n-1),px=clamp(x+(q-.5)*130,8,s.width-8);s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"snowballLive",x:px,y:-110-i*38,vx:rand(-18,18),vy:115,age:-.12-i*.12,alive:true,radius:4,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,snowBounce:0,hitGrace:.10});}
  s.fx.push({kind:"snowStorm",x,y:terrainY(s,x),life:.70,max:.70,color:d.color});
}
function spawnFury(s,p,d,x){
  s.fields.push({kind:"furyTower",x,y:terrainY(s,x),life:3.4,max:3.4,owner:p.owner,weaponId:p.weaponId,tier:p.tier,critShot:!!p.critShot,x2Active:!!p.x2Active,damageMult:p.damageMult,color:d.color,height:d.furyHeight||170,rise:.55,tick:0,index:0,orange:d.furyOrange||25,blue:d.furyBlue||0});
  s.fx.push({kind:"furyRise",x,y:terrainY(s,x),life:.65,max:.65,color:d.color,tier:p.tier});
}

function onImpact(s,p,x,y,hitTank=null){
  if(!p.alive)return;
  const d=weaponDef(p.weaponId,p.tier),owner=ownerOf(s,p),mult=p.damageMult||1;
  s.fx.push({kind:"weaponImpact",weaponId:p.weaponId,tier:p.tier,x,y,life:.40,max:.40,color:d.color});

  // V8 Legacy Arsenal source-guided impact families.
  if(p.weaponId==="sniper"){
    p.alive=false;
    if(p.smartSnipeTracker){
      if(hitTank){
        const shooter=ownerOf(s,p);if(shooter){const live=projectileBase(s,shooter,p.trackerAngle,p.trackerPower,p.weaponId,p.tier,{damageMult:p.damageMult,startX:shooter.x,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:2,sniperLive:true,noTerrainDamage:true,smartSnipeLive:true});s.projectiles.push(live);s.fx.push({kind:"smartSnipeLock",x,y,life:.35,max:.35,color:d.color});}
      }else s.fx.push({kind:"sniperMiss",x,y,life:.16,max:.16,color:"#9bacb7"});
      return;
    }
    if(hitTank){const dd=distanceDamage(s,p.startX,x,d.sniperMin||40,d.sniperMax||100);damageTankP(s,p,hitTank,dd*mult,owner);s.fx.push({kind:"sniperHit",x,y,life:.34,max:.34,color:d.color,damage:dd});}
    return;
  }
  if(p.weaponId==="digger"){
    p.diggerImpactCount=(p.diggerImpactCount||0)+1;diggerBlast(s,p,d,x,y);
    if(p.diggerImpactCount<(d.diggerHits||5)){
      p.x=clamp(x,5,s.width-5);p.y=terrainY(s,p.x)-7;p.vx=0;p.vy=-(d.diggerJump||225)*(.94+Math.random()*.08);p.noGravity=false;p.windFactor=1;p.hitGrace=.07;return;
    }
    p.alive=false;return;
  }
  if(p.weaponId==="breakermadness"){
    p.alive=false;const stage=p.madStage||0,depth=d.madnessDepth||5;
    modifyTerrainCrater(s,x,terrainY(s,x),7+stage*1.3,.12);
    if(stage<depth){spawnBreakerPieces(s,p,d,x,y,2,{madness:true,nextStage:stage+1});}
    else explosionP(s,p,x,y,d.radius||20,d.damage*mult,owner,.20,d.color);
    return;
  }
  if(p.weaponId==="breaker"){
    p.alive=false;
    if(d.breakerChainDepth){const stage=p.breakerStage||0;if(stage<d.breakerChainDepth){spawnBreakerPieces(s,p,d,x,y,2,{nextStage:stage+1});}else explosionP(s,p,x,y,d.radius||20,d.damage*mult,owner,.30,d.color);}
    else if(p.kind==="breakerPiece")explosionP(s,p,x,y,d.radius||25,d.damage*mult,owner,.35,d.color);
    else spawnBreakerPieces(s,p,d,x,y,d.breakerPieces||2,{nextStage:1});
    return;
  }
  if(p.weaponId==="zipper"){
    p.alive=false;const n=d.zipperCount||1;
    for(let i=0;i<n;i++){const large=p.tier>=3&&i>=2,range=(large?(d.zipperLargeRange||.08):(d.zipperRange||.05))*s.width,dir=i%2?1:-1;s.fields.push({kind:"zipper",x,centerX:x,y:terrainY(s,x)-4,life:12,max:12,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:large?8:6,color:large?"#ffd85a":d.color,range,speed:(d.zipperSpeed||340)*(large?.92:1),dir,traversals:0,maxTraversals:d.zipperTraversals||8,hitIds:[]});}
    s.fx.push({kind:"zipperStart",x,y:terrainY(s,x),life:.42,max:.42,color:d.color});return;
  }
  if(p.weaponId==="ringer"){p.alive=false;resolveRinger(s,p,d,x,y);return;}
  if(p.weaponId==="spiker"){
    if(p.kind==="spikerSpike"){p.alive=false;explosionP(s,p,x,y,p.specialRadius||d.radius||25,p.specialDamage||d.damage*mult,owner,.28,d.color);return;}
    p.alive=false;explosionP(s,p,x,y,d.radius||25,d.damage*mult,owner,.25,d.color);
    s.fields.push({kind:"spikerRun",x,y:terrainY(s,x),life:2.6,max:2.6,owner:p.owner,tier:p.tier,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius||25,color:d.color,dir:Math.sign(p.vx||1),spacing:d.spikeSpacing||34,beams:d.spikeBeams||5,delay:d.spikeDelay||.075,tick:0,placed:[],launchDelay:.20,launched:false,spikeSpeed:d.spikeSpeed||205});return;
  }
  if(p.weaponId==="pinata"&&p.pinataFlare){
    bounceFlareOrTrigger(s,p,d,x,y,()=>{
      if((d.pinatas||1)>1)s.fields.push({kind:"pinataWait",x,y:terrainY(s,x)-4,life:4,max:4,owner:p.owner,weaponId:p.weaponId,tier:p.tier,group:p.pinataGroup,index:p.pinataIndex,shots:d.pinataShots||10,span:d.pinataSpan||115,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color});
      else s.fields.push({kind:"pinataDrop",x,y:-45,targetY:terrainY(s,x)-32,life:2.2,max:2.2,owner:p.owner,weaponId:p.weaponId,tier:p.tier,shots:d.pinataShots||16,span:d.pinataSpan||155,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color,pattern:rint(0,2)});
    });return;
  }
  if(p.weaponId==="miniv"){
    if(p.kind==="vShot"){p.alive=false;explosionP(s,p,x,y,p.specialRadius||d.radius||30,p.specialDamage||d.damage*mult,owner,.30,d.color);return;}
    p.alive=false;const n=d.vShots||6,half=n/2;
    for(let i=0;i<n;i++){const side=i<half?-1:1,k=i%half,q=(k+1)/(half+1),a=Math.PI*.5+side*(.10+q*(d.vWidth||.42));spawnMiniProjectile(s,{...p,x,y:y-5},{angle:a,speed:(d.vSpeed||175)*(1-q*.08),kind:"vShot",extra:{specialDamage:d.damage*mult,specialRadius:d.radius||30,hitGrace:.10}});}
    s.fx.push({kind:"vLaunch",x,y,life:.42,max:.42,color:d.color,count:n});return;
  }
  if(p.weaponId==="napalm"){
    if(p.kind==="napalmFrag"){p.alive=false;if(hitTank)damageTankP(s,p,hitTank,p.specialDamage??d.damage*mult,owner);s.fx.push({kind:"napalmHit",x,y,life:.20,max:.20,color:p.customColor||d.color});return;}
    if(p.kind==="fireStormMeteor"){p.alive=false;explosionP(s,p,x,y,p.specialRadius||30,p.specialDamage||d.damage*mult,owner,.36,d.color);s.fires.push({x,y:terrainY(s,x)-3,r:20,life:1.25,damage:Math.min(2,d.fireStormFireDamage||2),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});return;}
    if(p.kind==="fireStormRock"){const dd=p.rockBaseDamage||8;explosionP(s,p,x,y,p.specialRadius||23,dd*mult,owner,.34,"#a36b43");p.rockContacts=(p.rockContacts||0)+1;if(p.rockContacts<(d.fireStormRockContacts||8)){p.x=x;p.y=terrainY(s,x)-5;p.vx*=.82;p.vy=-Math.abs(p.vy)*.62-32;p.hitGrace=.08;return;}p.alive=false;explosionP(s,p,x,y,18,6*mult,owner,.20,"#d4a16c");return;}
    if(p.fireStormFlare){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnFireStorm(s,p,d,x));return;}
    p.alive=false;if(hitTank)damageTankP(s,p,hitTank,d.damage*2*mult,owner);return;
  }
  if(p.weaponId==="sunburst"){
    if(p.kind==="solarSpark"){p.alive=false;if(hitTank)damageTankP(s,p,hitTank,p.specialDamage||30*mult,owner);return;}
    p.alive=false;spawnSunburst(s,p,d,x,y);return;
  }
  if(p.weaponId==="synclets"){
    p.alive=false;if(hitTank){const dd=distanceDamage(s,p.startX,x,p.syncDamageMin||4,p.syncDamageMax||10);damageTankP(s,p,hitTank,dd*mult,owner);}return;
  }
  if(p.weaponId==="seagull"){
    p.alive=false;if(p.kind==="seagullPoop"){const dd=distanceDamage(s,p.startX,x,d.poopMin||6,d.poopMax||15);explosionP(s,p,x,y,d.poopRadius||20,dd*mult,owner,.45,"#ece7d0");}
    else explosionP(s,p,x,y,d.radius||40,d.damage*mult,owner,.55,d.color);return;
  }
  if(p.weaponId==="shrapnel"){
    if(p.kind==="shrapnelFrag"){p.alive=false;explosionP(s,p,x,y,p.specialRadius||12,p.specialDamage||6*mult,owner,.12,d.color);return;}
    p.alive=false;spawnShrapnel(s,p,d,x,y);return;
  }
  if(p.weaponId==="batteringram"){
    const dd=distanceDamage(s,p.startX,x,d.ramMin||22,d.ramMax||50);explosionP(s,p,x,y,d.radius||25,dd*mult,owner,.48,d.color);
    if((p.ramBouncesRemaining||0)>0){p.ramBouncesRemaining--;p.x=x;p.y=terrainY(s,x)-6;p.vx=rand(-85,85);p.vy=-rand(150,215);p.gravityMult=1;p.ramApex=true;p.hitGrace=.10;s.fx.push({kind:"ramBounce",x,y,life:.32,max:.32,color:d.color});return;}
    p.alive=false;return;
  }
  if(p.weaponId==="snowball"){
    if(p.snowStormFlare){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnSnowStorm(s,p,d,x));return;}
    const ladder=d.snowDamage||[5,15,30,45,60,75,90,105],idx=clamp(p.snowBounce||0,0,ladder.length-1),dd=ladder[idx]*mult;
    if(hitTank){p.alive=false;damageTankP(s,p,hitTank,dd,owner);s.fx.push({kind:"snowBurst",x,y,life:.35,max:.35,color:d.color,size:idx});return;}
    if((p.snowBounce||0)<(d.snowBounces||ladder.length-1)){p.snowBounce=(p.snowBounce||0)+1;p.x=x;p.y=terrainY(s,x)-6;p.vx*=.92;p.vy=-Math.max(72,Math.abs(p.vy)*(d.snowBouncePower||.72));p.radius=4+p.snowBounce*1.25;p.hitGrace=.08;s.fx.push({kind:"snowBounce",x,y,life:.24,max:.24,color:d.color,size:p.snowBounce});return;}
    p.alive=false;s.fx.push({kind:"snowBurst",x,y,life:.38,max:.38,color:d.color,size:idx});return;
  }
  if(p.weaponId==="fighterjet"){
    p.alive=false;if(p.kind==="jetRocket"){if(hitTank)damageTankP(s,p,hitTank,p.specialDamage||d.rocketDamage*mult,owner);s.fx.push({kind:"jetRocketHit",x,y,life:.24,max:.24,color:d.color});return;}
    const dd=distanceDamage(s,p.startX,x,d.jetMin||16,d.jetMax||40);explosionP(s,p,x,y,d.radius||40,dd*mult,owner,.55,d.color);return;
  }
  if(p.weaponId==="fury"){
    if(p.kind==="furyPellet"){p.alive=false;explosionP(s,p,x,y,p.specialRadius||18,p.specialDamage||d.damage*mult,owner,.18,p.customColor||d.color);return;}
    p.alive=false;spawnFury(s,p,d,x);return;
  }

  // Source-inspired families kept from the previous build.
  if(p.weaponId==="deadweight"&&p.deadWeightMode==="riser"&&p.kind!=="deadRiserTunnel"){p.kind="deadRiserTunnel";p.x=x;p.y=terrainY(s,x)+16;p.vx=0;p.vy=0;p.noGravity=true;p.windFactor=0;return;}
  if(p.weaponId==="fireworks"&&p.kind==="fireworkRocket"){p.alive=false;if(p.age<(d.airburstMinAge??.30)){explosionP(s,p,x,y,10,d.damage*.65*mult,owner,.05,d.color);}else if(!p.didSplit)spawnFireworkSparks(s,p,d,p.sparksPerRocket);return;}
  if(p.weaponId==="flame"){
    p.alive=false;if(hitTank){for(let i=0;i<(d.burnTicks||3);i++)s.fields.push({kind:"burnTarget",targetId:hitTank.id,life:.18+i*.34,max:.18+i*.34,delay:.12+i*.34,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:(d.burnTickDamage||d.damage)*mult,color:d.color});}return;
  }
  if(p.weaponId==="uzi"){p.alive=false;if(hitTank)damageTankP(s,p,hitTank,d.damage*mult,owner);s.fx.push({kind:"bulletHit",x,y,life:.18,max:.18,color:d.color});return;}
  if(p.weaponId==="bfg1000"){p.alive=false;const travel=Math.abs(x-(p.startX??x)),q=clamp(travel/(s.width*.62),0,1),dd=(d.distanceMin||d.damage)+((d.distanceMax||d.damage)-(d.distanceMin||d.damage))*q;explosionP(s,p,x,y,d.radius,dd*mult,owner,1.0,d.color);return;}
  if(p.weaponId==="tadpoles"){
    const rr=p.bullfrog?(d.bigRadius||25):(d.radius||12),dd=p.bullfrog?(d.bigDamage||18):(d.damage||5);
    explosionP(s,p,x,y,rr,dd*mult,owner,.08,d.color);
    if(hitTank){p.alive=false;return;}
    p.tadHops=(p.tadHops||0)+1;
    if(p.tadHops<=(d.tadHops||2)){const dir=rand(-1,1),sp=(d.tadHopSpeed||72)*rand(.78,1.05);p.kind="tadpoleHop";p.x=x;p.y=terrainY(s,x)-5;p.vx=dir*sp;p.vy=-rand(72,105);p.noGravity=false;p.windFactor=.35;s.fx.push({kind:"frogBounce",x,y,life:.25,max:.25,color:d.color});return;}
    p.alive=false;return;
  }
  if(p.weaponId==="bounder"&&!p.bounderLocked&&!hitTank){
    const target=nearestEnemy(s,p.owner,x,y);
    p.bounderLocked=true;p.bounderStage="rise";p.bounderTargetId=target?.id||null;p.x=x;p.y=terrainY(s,x)-6;p.vx=0;p.vy=-(d.bounderLaunch||250);p.noGravity=false;p.windFactor=0;
    s.fx.push({kind:"bounderLock",x,y,targetX:target?.x??x,targetY:target?.y??y,life:.42,max:.42,color:d.color});return;
  }
  if(p.weaponId==="airstrike"&&p.kind!=="airstrikeBomb"&&!["gunshipBullet","gunshipCannon","gunshipMissile"].includes(p.kind)){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnAirStrikeFamily(s,p,d,x));return;}
  if(p.weaponId==="bolt"&&p.kind!=="boltComet"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnBoltFamily(s,p,d,x));return;}
  if(p.weaponId==="recruiter"&&p.kind!=="recruitShot"){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnRecruiterFamily(s,p,d,x));return;}
  if(p.weaponId==="carpetbomb"&&!['carpetBombDrop','carpetHeavy'].includes(p.kind)){bounceFlareOrTrigger(s,p,d,x,y,()=>spawnCarpetFamily(s,p,d,x));return;}
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

  // Secondary projectiles resolve once and never restart their parent weapon.
  const secondary=["skyBomb","orbital","deadDrop","asteroid","gunshipShot","airstrikeBomb","boltComet","recruitShot","carpetBombDrop","carpetHeavy","gunshipBullet","gunshipCannon","gunshipMissile","discoRay","hoverDrop","palmDrop","fountainCore","lunarCore","mirrorFrag","pinataShard","vShot","spikerSpike","furyPellet"];
  if(secondary.includes(p.kind)){
    p.alive=false;
    let terrainScale=(p.kind==="deadDrop"?1.05:(p.weaponId==="carpetbomb"||p.weaponId==="recruiter"||p.kind==="discoRay"||p.kind==="hoverDrop"||p.kind==="palmDrop"?0:(d.terrainScale??.75)));
    let rad=d.radius||32,dmg=d.damage*mult;
    if(p.weaponId==="bolt"&&p.kind==="boltComet"){rad=d.cometRadius||24;dmg=(d.cometDamage||15)*mult;}
    if(p.kind==="carpetHeavy"){rad=p.heavyRadius||38;dmg=(p.heavyDamage||28)*mult;terrainScale=.45;}
    if(p.specialRadius!=null)rad=p.specialRadius;if(p.specialDamage!=null)dmg=p.specialDamage;
    if(p.kind==="airstrikeBomb"&&d.flatBlast)explosionFlat(s,p,x,y,rad,dmg,owner,d.terrainScale??.42,d.color);
    else explosionP(s,p,x,y,rad,dmg,owner,terrainScale,p.customColor||d.color);
    if(p.kind==="airstrikeBomb"&&d.artilleryShrapnel){for(let i=0;i<d.artilleryShrapnel;i++){const a=Math.PI*(.22+.56*(i/Math.max(1,d.artilleryShrapnel-1)));spawnMiniProjectile(s,{...p,x,y:y-5},{angle:a,speed:rand(105,145),weaponId:"pulse",kind:"scatterFrag",damageMult:1,extra:{fragDamage:7*mult,hitGrace:.08}});}}
    if(p.weaponId==="acidrain")s.fires.push({x,y:terrainY(s,x)-3,r:30,life:d.acidTime||4,damage:Math.min(2,d.acid||2),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"acid"});
    if(p.weaponId==="carpetbomb"&&d.burn)s.fires.push({x,y:terrainY(s,x)-3,r:20,life:d.burnTime||2.2,damage:Math.min(2,d.burn),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});
    return;
  }

  if(p.weaponId==="breakerwave"&&(p.breakerDepth||0)>0){
    p.alive=false;const base=Math.atan2(-p.vy,p.vx),depth=p.breakerDepth-1;
    for(const off of [-.28,.28])spawnMiniProjectile(s,{...p,x,y},{angle:base+off,speed:d.breakerSpeed||165,extra:{breakerDepth:depth,didSplit:depth<=0,hitGrace:.10}});return;
  }
  if(p.weaponId==="hyperbounce"&&p.bounces<d.bounces){p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*(d.bouncePower||.7)-35;p.vx*=.92;return;}
  if(p.weaponId==="jumper"&&p.bounces<d.bounces){explosionP(s,p,x,y,18,d.damage*(d.jumpDamageScale||.52)*mult,owner,.16,d.color);p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*.64-45;p.vx*=.82;return;}

  // Cluster Grenade: one controlled bounce; T4 is a true grenade drop pattern.
  if(p.weaponId==="clustergrenade"&&d.grenadeStorm&&!p.didSplit){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.2,max:1.2,color:d.color});const count=d.bombs||10;
    for(let i=0;i<count-1;i++){const q=(i+.5)/(count-1),px=clamp(x+(q-.5)*2*(d.spreadX||145),8,s.width-8);s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x:px,y:-90-i*11,vx:0,vy:145,age:-.30-i*.055,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:3,specialDamage:d.damage*mult,specialRadius:d.radius});}
    if(d.stormHeavy)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x,y:-260,vx:0,vy:155,age:-.82,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8,specialDamage:(d.stormHeavyDamage||28)*mult,specialRadius:34});return;
  }
  if(p.weaponId==="clustergrenade"&&!p.didSplit){
    if(p.bounces<d.bounces){p.bounces++;p.y=terrainY(s,p.x)-6;p.vy=-Math.abs(p.vy)*.43-22;p.vx*=.68;return;}
    p.didSplit=true;p.alive=false;if(!(d.fragments>0)){explosionP(s,p,x,y,d.radius,d.damage*mult,owner,.82,d.color);return;}
    explosionP(s,p,x,y,13,d.damage*mult*.24,owner,.08,d.color);
    for(let i=0;i<d.fragments;i++){const q=(i-(d.fragments-1)/2)/Math.max(1,d.fragments-1),a=Math.PI*.5+q*(d.clusterSpread||.9);spawnMiniProjectile(s,{...p,x,y:y-6},{angle:a,speed:rand(88,128),kind:"clusterFrag",extra:{customBounces:0,fragDamage:(d.fragmentDamage||d.damage)*mult,hitGrace:.10}});}return;
  }
  if(p.weaponId==="bumperbombs"&&!p.didSplit){p.alive=false;for(let i=0;i<d.fragments;i++){const a=Math.PI*(.12+.76*Math.random());spawnMiniProjectile(s,{...p,x,y},{angle:a,speed:rand(110,175),kind:"bumperFrag",extra:{customBounces:d.bounces}});}return;}
  if((p.kind==="clusterFrag"||p.kind==="bumperFrag")&&(p.customBounces||0)>p.bounces){p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.55-22;p.vx*=.74;return;}
  if((p.customBounces||0)>p.bounces){p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.57-24;p.vx*=.75;return;}
  if(p.weaponId==="ricochet"&&p.bounces<d.bounces){const bp=d.bouncePower||.62;p.bounces++;p.y=terrainY(s,p.x)-7;p.vy=-Math.abs(p.vy)*bp-30;p.vx*=.80;if(d.maxHorizontalSpeed)p.vx=clamp(p.vx,-d.maxHorizontalSpeed,d.maxHorizontalSpeed);return;}

  // Chain Pop: first kernel landing creates two micro-kernels rather than only increasing count.
  if(p.weaponId==="kernelpop"&&p.kernelChain&&p.didSplit&&!p.kernelPopped){
    p.kernelPopped=true;p.alive=false;explosionP(s,p,x,y,9,d.damage*.35*mult,owner,.08,d.color);
    for(const off of [-.30,.30]){const a=Math.PI*.5+off+rand(-.08,.08);spawnMiniProjectile(s,{...p,x,y:y-5},{angle:a,speed:rand(85,115),weaponId:"pulse",kind:"scatterFrag",damageMult:1,extra:{fragDamage:d.damage*.62*mult,hitGrace:.08}});}return;
  }
  if(p.weaponId==="kernelpop"&&p.didSplit&&p.bounces<d.bounces){p.bounces++;p.y=terrainY(s,p.x)-5;p.vy=-Math.abs(p.vy)*.48-19;p.vx*=.70;return;}

  if(["roller","sawblade","backroller"].includes(p.weaponId)){
    p.kind="roller";p.x=x;p.y=terrainY(s,x)-5;const incoming=Math.sign(p.vx||1),dir=p.weaponId==="backroller"?-incoming:incoming;
    p.vx=dir*(d.rollSpeed||(p.weaponId==="sawblade"?90:55));p.vy=0;p.rollLeft=d.rollTime||4.5;p.rollTotal=p.rollLeft;p.rollDistance=0;p.hitCooldown=0;p.impactTrail=!!d.impactTrail;return;
  }
  if(p.weaponId==="viper"){
    p.alive=false;const target=nearestEnemy(s,p.owner,x,y);
    s.fields.push({kind:"viperPath",x,y:terrainY(s,x)-3,life:(d.viperSteps||8)*(d.viperStep||.18)+.35,max:(d.viperSteps||8)*(d.viperStep||.18)+.35,tick:0,steps:0,targetId:target?.id||null,
      owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,r:d.radius||18,step:d.viperStep||.18,travel:d.viperTravel||34,seek:d.viperSeek||1,color:d.color,finisher:d.viperFinisher||0});return;
  }
  if(p.weaponId==="burrow"){
    p.kind="burrow";p.x=x;p.y=terrainY(s,x)+(d.tunnelDepth||34);p.vx=Math.sign(p.vx||1)*Math.max(52,Math.abs(p.vx)*.28);p.vy=0;p.noGravity=true;p.windFactor=0;p.tunnelLeft=d.tunnelTime||.8;p.burrowStartX=x;return;
  }
  if(p.weaponId==="corkscrew"&&p.kind!=="corkscrewTunnel"){
    p.kind="corkscrewTunnel";p.x=x;p.y=terrainY(s,x)+(d.corkDepth||24);p.vx=Math.sign(p.vx||1)*(d.corkSpeed||125);p.vy=0;p.noGravity=true;p.windFactor=0;p.corkLeft=d.corkTunnel||110;p.corkPulse=0;p.corkPulseCount=0;s.fx.push({kind:"corkscrewBurrow",x,y:terrainY(s,x),life:.45,max:.45,color:d.color});return;
  }
  if(p.weaponId==="ghostbomb"){
    const targets=s.tanks.filter(t=>isEnemy(s,owner,t)).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x));
    if((d.ghostTwins||1)>1&&!p.ghostClone){p.alive=false;const n=Math.min(d.ghostTwins,Math.max(1,targets.length));for(let i=0;i<n;i++)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"ghost",ghostClone:true,ghostTargetId:targets[i]?.id||null,ghostLeft:(d.ghostTravel||160)*1.35,x:x+(i-(n-1)/2)*18,y:terrainY(s,x)+(d.ghostDepth||30),vx:0,vy:0,age:0,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4,noGravity:true,windFactor:0});return;}
    p.kind="ghost";p.x=x;p.y=terrainY(s,x)+(d.ghostDepth||24);p.vx=0;p.vy=0;p.noGravity=true;p.windFactor=0;p.ghostTargetId=targets[0]?.id||null;p.ghostLeft=(d.ghostTravel||105)*1.55;return;
  }

  if(["acidrain","areastrike","asteroidbelt"].includes(p.weaponId)){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.1,max:1.1,color:d.color});const kind=p.weaponId==="asteroidbelt"?"asteroid":"skyBomb";spawnStrike(s,p,d,x,kind);
    if(d.centerBomb&&p.weaponId==="areastrike")s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x,y:-180,vx:0,vy:185,age:-.5,alive:true,damageMult:mult*1.25,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:5});
    if(d.asteroidHeavy&&p.weaponId==="asteroidbelt")s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"asteroid",x:clamp(x+rand(-55,55),8,s.width-8),y:-260,vx:rand(-35,35),vy:105,age:-1.0,alive:true,damageMult:mult*1.75,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8});return;
  }
  if(p.weaponId==="gunship"){p.alive=false;spawnGunshipRun(s,p,d,x);return;}
  if(p.weaponId==="hoverorb"){p.alive=false;spawnHoverStrike(s,p,d,x);return;}
  if(p.weaponId==="discoball"){p.alive=false;spawnDiscoHang(s,p,d,x);return;}
  if(p.weaponId==="palmburst"){p.alive=false;spawnPalmTree(s,p,d,x);return;}

  if(p.weaponId==="skymarker"||p.weaponId==="meteorchoir"){
    p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1,max:1,color:d.color});
    for(let i=0;i<d.bombs;i++)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x:clamp(x+rand(-d.spreadX,d.spreadX),8,s.width-8),y:-rand(30,260)-i*22,vx:rand(-8,8)+s.wind*.12,vy:rand(100,160),age:-.35-i*.10,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4});
    if(d.artilleryHeavy)for(const off of [-55,55])s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"skyBomb",x:clamp(x+off,8,s.width-8),y:-320,vx:0,vy:130,age:-1.0-Math.random()*.25,alive:true,damageMult:mult*2.0,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:8});return;
  }
  if(p.weaponId==="gravityseed"){p.alive=false;s.fields.push({kind:"gravity",x,y:terrainY(s,x)-5,r:d.fieldRadius,life:d.fieldTime,max:d.fieldTime,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult});return;}
  if(p.weaponId==="voidwell"){p.alive=false;s.fields.push({kind:"voidwell",x,y:terrainY(s,x)-5,r:d.fieldRadius,life:d.fieldTime,max:d.fieldTime,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,projectilePull:d.projectilePull||1});return;}
  if(p.weaponId==="rampart"){
    p.alive=false;explosionP(s,p,x,y,30,d.damage*mult,owner,0,d.color);modifyTerrainRaise(s,x,d.radius,d.raise);if(d.doubleRampart){modifyTerrainRaise(s,x-d.radius*.70,d.radius*.52,d.raise*.42);modifyTerrainRaise(s,x+d.radius*.70,d.radius*.52,d.raise*.42);}s.fx.push({kind:"terraform",x,y:terrainY(s,x),life:.65,max:.65,color:d.color});return;
  }
  if(p.weaponId==="bulger"){p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,.25,d.color);modifyTerrainRaise(s,x,d.radius,d.raise);if(d.doubleBulge){modifyTerrainRaise(s,x-d.radius*.72,d.radius*.55,d.raise*.55);modifyTerrainRaise(s,x+d.radius*.72,d.radius*.55,d.raise*.55);}s.fx.push({kind:"terraform",x,y:terrainY(s,x),life:.7,max:.7,color:d.color});return;}
  if(p.weaponId==="sinker"){p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,1.28,d.color);return;}
  if(p.weaponId==="groundwave"){p.alive=false;s.fields.push({kind:"groundwave",x,y:terrainY(s,x)-3,dir:p.vx>=0?1:-1,life:2.1,max:2.1,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*mult,lastX:x});return;}
  if(p.weaponId==="quakecharge"){
    p.alive=false;repairTerrainTowardInitial(s,d.repairStrength||.12);const quakeOwner=ownerOf(s,p);for(const t of s.tanks)if(isEnemy(s,quakeOwner,t))damageTankP(s,p,t,(d.repairDamage||d.damage)*mult,quakeOwner);s.fx.push({kind:"quakeRepair",x:s.width/2,y:s.height*.62,life:.85,max:.85,color:d.color,strength:d.repairStrength||.12});return;
  }
  if(p.weaponId==="horizon"){
    p.alive=false;for(const dir of [-1,1])s.fields.push({kind:"horizonWave",x,lastX:x,startX:x,dir,life:3.8,max:3.8,range:d.horizonRange||310,speed:d.horizonSpeed||250,travelled:0,owner:p.owner,damage:d.damage*mult,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color,hitIds:[],returnPass:!!d.horizonReturn,returned:false});return;
  }

  if(p.weaponId==="arcchain"){
    p.alive=false;let first=hitTank||s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-y)<d.radius+22).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
    if(first){const hit=[first];damageTankP(s,p,first,d.damage*mult,owner);let last=first;
      if(d.arcMode==="relay"&&d.relayPulse)explosion(s,first.x,first.y,d.radius*.75,d.relayPulse*mult,owner,0,d.color,damageMeta(p));
      for(let i=1;i<d.chain;i++){const q=s.tanks.filter(t=>isEnemy(s,owner,t)&&!hit.includes(t)&&Math.hypot(t.x-last.x,t.y-last.y)<=d.chainRange).sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0];if(!q)break;damageTankP(s,p,q,d.damage*mult*Math.pow(d.arcMode==="web"?.88:.78,i),owner);if(d.arcMode==="relay"&&d.relayPulse)explosion(s,q.x,q.y,d.radius*.72,d.relayPulse*mult,owner,0,d.color,damageMeta(p));hit.push(q);last=q;}
      const points=[{x,y},...hit.map(t=>({x:t.x,y:t.y}))];if(d.webReturn&&hit.length){damageTankP(s,p,hit[0],(d.webReturnDamage||d.damage*.55)*mult,owner);points.push({x:hit[0].x,y:hit[0].y});}s.fx.push({kind:"chain",points,life:d.arcMode==="web"?.55:.32,max:d.arcMode==="web"?.55:.32,color:d.color,web:d.arcMode==="web"});
    }else explosionP(s,p,x,y,20,14*mult,owner,.18,d.color);return;
  }

  if(["fountain","flower","clover","breakerwave"].includes(p.weaponId)&&!p.didSplit){
    p.alive=false;const directScale=p.weaponId==="flower"?.28:1;explosionP(s,p,x,y,16,d.damage*mult*directScale,owner,.16,d.color);const mode=p.weaponId==="fountain"?"fountain":p.weaponId==="breakerwave"?"breaker":p.weaponId==="clover"?"clover":"radial";spawnRadial(s,p,d,x,p.weaponId==="flower"?y-18:y,{mode});
    if(p.weaponId==="fountain"&&d.fountainCore)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"fountainCore",x,y:y-10,vx:0,vy:-235,age:0,alive:true,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:6,windFactor:0,specialDamage:d.fountainCoreDamage*mult,specialRadius:d.fountainCoreRadius||26});return;
  }
  if(p.weaponId==="cactus"&&!p.didSplit){p.alive=false;if(d.cactusStrike&&p.kind!=="cactusPod")spawnCactusStrike(s,p,d,x);else{p.x=x;p.y=y-16;splitProjectile(s,p);}return;}
  if((p.weaponId==="beehive"||p.weaponId==="guppies")&&!p.didSplit){p.alive=false;explosionP(s,p,x,y,12,d.damage*mult*.25,owner,.06,d.color);spawnSwarm(s,p,d,x,y,p.weaponId);return;}

  if(p.weaponId==="moonfall"){
    p.alive=false;s.fx.push({kind:"moonPortal",x,y:terrainY(s,x)-72,life:2.0,max:2.0,color:d.color,tier:p.tier,moonFx:d.moonFx||1});const bombs=d.bombs||4;
    for(let i=0;i<bombs;i++){const a=i/bombs*Math.PI*2,ring=72+(d.moonFx||1)*14;s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"orbital",x:clamp(x+Math.cos(a)*ring,10,s.width-10),y:terrainY(s,x)-130-Math.sin(a)*(28+8*(d.moonFx||1)),vx:-Math.cos(a)*(20+5*(d.moonFx||1)),vy:38+i*6,age:-i*.14,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:4});}
    if(d.lunarCore)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"lunarCore",x,y:-250,vx:0,vy:175,age:-1.05,alive:true,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:9,specialDamage:d.damage*1.8*mult,specialRadius:48});return;
  }
  if(p.weaponId==="deaddrop"){p.alive=false;s.fx.push({kind:"marker",x,y:terrainY(s,x),life:1.2,max:1.2,color:d.color});s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"deadDrop",x,y:-120,vx:0,vy:0,age:-1.1,alive:true,damageMult:mult,critShot:!!p.critShot,x2Active:!!p.x2Active,radius:12});return;}
  if(p.weaponId==="faultline"){p.alive=false;spawnFaultLine(s,p,d,x);return;}
  if(p.weaponId==="echobomb"){
    p.alive=false;explosionP(s,p,x,y,d.radius,d.damage*mult,owner,.75,d.color);const echoes=d.echoes||1;for(let i=0;i<echoes;i++)s.fields.push({kind:"echo",x,y,life:(i+1)*(d.echoGap||.72),max:(i+1)*(d.echoGap||.72),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.echoDamage*mult*Math.pow(.94,i),r:d.echoRadius+(d.echoGrow||0)*i,color:d.color});return;
  }
  if(p.weaponId==="timeskip"){p.alive=false;spawnTimeEchoes(s,p,d,x,y);s.fx.push({kind:"timeRift",x,y:terrainY(s,x),life:.9,max:.9,color:d.color});return;}
  if(p.weaponId==="scatterrise"){
    p.alive=false;explosionP(s,p,x,y,16,d.damage*mult*.55,owner,.20,d.color);const n=d.fragments||8,mode=d.scatterMode||"spray";
    for(let i=0;i<n;i++){let a,sp;if(mode==="columns"){const col=(i%3)-1;a=Math.PI*.5+col*.08+rand(-.025,.025);sp=120+Math.floor(i/3)*18;}else if(mode==="crown"){const q=(i-(n-1)/2)/Math.max(1,n-1);a=Math.PI*.5+q*.92;sp=130+Math.abs(q)*45;}else{a=Math.PI*(.20+.60*Math.random());sp=rand(95,175);}s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:"pulse",kind:"scatterFrag",x:x+rand(-6,6),y:y-8,vx:Math.cos(a)*sp,vy:-Math.sin(a)*sp,age:0,alive:true,radius:3,damageMult:1,fragDamage:d.damage*mult,critShot:!!p.critShot,x2Active:!!p.x2Active,hitGrace:.08});}
    if(d.scatterCore)s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:"pulse",kind:"scatterFrag",x,y:y-7,vx:0,vy:-175,age:0,alive:true,radius:5,damageMult:1,fragDamage:d.scatterCore*mult,critShot:!!p.critShot,x2Active:!!p.x2Active,hitGrace:.10});return;
  }
  if(["shardbloom","prismsplit","starburst","emberrain","kernelpop","twinkler","tristar"].includes(p.weaponId)&&!p.didSplit){p.alive=false;if(p.age<(d.airburstMinAge??.30))explosionP(s,p,x,y,Math.max(10,d.radius||14),d.damage*.70*mult,owner,.06,d.color);else splitProjectile(s,p);return;}

  // Mirror Shot creates reflected shells at its first impact; reflected shells then explode normally.
  if(p.weaponId==="mirror"&&!p.mirrorChild){
    p.alive=false;s.fx.push({kind:"mirrorGate",x,y,life:.55,max:.55,color:d.color});const inAng=Math.atan2(-p.vy,p.vx),base=Math.PI-inAng,n=d.mirrorShots||1;
    for(let i=0;i<n;i++){const q=(i-(n-1)/2)/Math.max(1,n-1),a=base+q*(d.mirrorSpread||.18);spawnMiniProjectile(s,{...p,x,y:y-10},{angle:a,speed:Math.max(135,Math.hypot(p.vx,p.vy)*.82),extra:{mirrorChild:true,hitGrace:.16}});}
    if(d.mirrorFinal)s.fields.push({kind:"echo",x,y,life:.65,max:.65,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.damage*.45*mult,r:d.radius+8,color:d.color});return;
  }

  p.alive=false;explosionP(s,p,x,y,d.radius||25,(p.fragDamage||d.damage)*mult,owner,p.weaponId==="megaflux"?.72:1,d.color);
  if(p.weaponId==="megaflux"&&d.nukeAftershock)s.fields.push({kind:"nukeShock",x,y,life:d.nukeDelay||.42,max:d.nukeDelay||.42,owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,damage:d.nukeAftershock*mult,r:d.radius+34,color:d.color});
  if(p.weaponId==="emberrain"||p.weaponId==="infernojet")s.fires.push({x,y:terrainY(s,x)-3,r:p.weaponId==="infernojet"?24:32,life:d.burnTime||p.burnData?.time||3,damage:Math.min(2,d.burn||p.burnData?.damage||2),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"fire"});
  if(p.weaponId==="acidrain")s.fires.push({x,y:terrainY(s,x)-3,r:30,life:d.acidTime||4,damage:Math.min(2,d.acid||2),owner:p.owner,critShot:!!p.critShot,x2Active:!!p.x2Active,tick:0,color:"acid"});
}
function updateFields(s,dt){
  const fieldOwner=f=>s.tanks.find(t=>t.id===f.owner);
  for(const f of s.fields){
    if(!f.dormant)f.life-=dt;
    if(f.kind==="burnTarget"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const target=s.tanks.find(t=>t.id===f.targetId&&t.alive);if(target){damageTank(s,target,f.damage,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"burnTick",x:target.x,y:target.y,life:.28,max:.28,color:f.color});}}}
    else if(f.kind==="lightningStrike"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const y=terrainY(s,f.x);s.fx.push({kind:"lightningBolt",x:f.x,y,life:.38,max:.38,color:f.color});explosion(s,f.x,y,f.r,f.damage,fieldOwner(f),0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="stickyMine"){if(f.targetId){const t=s.tanks.find(t=>t.id===f.targetId&&t.alive);if(t){f.x=t.x;f.y=t.y-5;}}if(!f.dormant&&f.life<=0&&!f.done){f.done=true;s.fx.push({kind:"stickyBurst",x:f.x,y:f.y,life:.36,max:.36,color:f.color});explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.70,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="snake"){f.tick-=dt;if(f.tick<=0&&f.steps<10){f.tick=f.step;f.steps++;if(Math.random()<f.turn*.35)f.dir*=-1;const dx=f.dir*f.travel*rand(.55,1.15);f.x=clamp(f.x+dx,5,s.width-5);f.y=terrainY(s,f.x)-3;s.fx.push({kind:"snakeBurst",x:f.x,y:f.y,life:.30,max:.30,color:f.color,tier:f.tier});explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.15,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    else if(f.kind==="viperPath"){
      f.tick-=dt;if(f.tick<=0&&f.steps<(f.maxSteps||999)){f.tick=f.step;f.steps++;const target=(f.targetId&&s.tanks.find(t=>t.id===f.targetId&&t.alive))||nearestEnemy(s,f.owner,f.x,f.y);if(target)f.targetId=target.id;let dir=target?Math.sign(target.x-f.x||1):1;const step=f.travel*(.82+Math.random()*.30);f.x=clamp(f.x+dir*step,5,s.width-5);f.y=terrainY(s,f.x)-3;s.fx.push({kind:"viperPulse",x:f.x,y:f.y,life:.30,max:.30,color:f.color});explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
      if(f.life<=0&&!f.done){f.done=true;if(f.finisher>0){const target=(f.targetId&&s.tanks.find(t=>t.id===f.targetId&&t.alive))||nearestEnemy(s,f.owner,f.x,f.y);if(target){s.fx.push({kind:"viperStrike",x:target.x,y:target.y,life:.38,max:.38,color:f.color});damageTank(s,target,f.finisher,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});}}}
    }
    else if(f.kind==="zipper"){
      const step=f.dir*f.speed*dt;f.x+=step;
      const lo=clamp(f.centerX-f.range,4,s.width-4),hi=clamp(f.centerX+f.range,4,s.width-4);
      if(f.x<=lo||f.x>=hi){f.x=clamp(f.x,lo,hi);f.dir*=-1;f.traversals++;f.hitIds=[];s.fx.push({kind:"zipperTurn",x:f.x,y:terrainY(s,f.x),life:.16,max:.16,color:f.color});if(f.traversals>=f.maxTraversals)f.life=0;}
      f.y=terrainY(s,f.x)-4;s.fx.push({kind:"zipperTrail",x:f.x,y:f.y,life:.12,max:.12,color:f.color});
      for(const t of s.tanks){if(!t.alive||t.id===f.owner)continue;if(Math.abs(t.x-f.x)<12+f.r&&Math.abs(t.y-f.y)<27&&!f.hitIds.includes(t.id)){damageTank(s,t,f.damage,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});f.hitIds.push(t.id);}}
    }else if(f.kind==="spikerRun"){
      f.tick-=dt;
      if(f.placed.length<f.beams&&f.tick<=0){f.tick=f.delay;const i=f.placed.length,xx=clamp(f.x+f.dir*i*f.spacing,6,s.width-6),yy=terrainY(s,xx);f.placed.push({x:xx,y:yy});s.fx.push({kind:"spikeGuide",x:xx,y:yy,life:.65,max:.65,color:"#aeb8c0"});}
      if(f.placed.length>=f.beams&&!f.launched){f.launchDelay-=dt;if(f.launchDelay<=0){f.launched=true;f.placed.forEach((q,i)=>{const slope=terrainSlope(s,q.x),a=Math.PI*.5-slope;spawnMiniProjectile(s,{owner:f.owner,weaponId:"spiker",tier:f.tier||1,x:q.x,y:q.y-5,damageMult:1,critShot:f.critShot,x2Active:f.x2Active},{angle:a,speed:f.spikeSpeed,weaponId:"spiker",kind:"spikerSpike",damageMult:1,extra:{specialDamage:f.damage,specialRadius:f.r,hitGrace:.08}});});f.life=.9;s.fx.push({kind:"spikeLaunch",points:f.placed.map(q=>({...q})),life:.45,max:.45,color:f.color});}}
    }else if(f.kind==="pinataWait"){
      const d=weaponDef(f.weaponId,f.tier),group=s.fields.filter(g=>g.kind==="pinataWait"&&g.group===f.group);
      if(group.length>=(d.pinatas||3)&&!group.some(g=>g.activating)){for(const g of group){g.activating=true;g.kind="pinataDrop";g.targetY=terrainY(s,g.x)-32;g.y=-45-g.index*28;g.life=2.2;g.max=2.2;g.pattern=(g.index||0)%3;}}
    }else if(f.kind==="pinataDrop"){
      f.y+=250*dt;if(f.y>=f.targetY&&!f.done){f.y=f.targetY;f.done=true;spawnPinataBurst(s,f);f.life=0;}
    }else if(f.kind==="fireStormRocks"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const shooter=s.tanks.find(t=>t.id===f.owner);if(shooter){const d=weaponDef(f.weaponId,f.tier),speed=launchSpeedFromPower(f.power||60);for(let i=0;i<2;i++)s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"fireStormRock",x:shooter.x+Math.cos(f.angle)*18,y:shooter.y-8-Math.sin(f.angle)*18,vx:Math.cos(f.angle)*speed,vy:-Math.sin(f.angle)*speed,age:-i*.09,alive:true,radius:6,damageMult:f.damageMult,critShot:!!f.critShot,x2Active:!!f.x2Active,rockContacts:0,rockBaseDamage:8,hitGrace:.08});s.fx.push({kind:"fireStormRocks",x:shooter.x,y:shooter.y,life:.45,max:.45,color:f.color});}}
    }else if(f.kind==="sunburstField"){
      const d=weaponDef(f.weaponId,f.tier),elapsed=f.max-f.life,dur=.70;
      f.phase=elapsed<dur?0:1;const local=f.phase===0?clamp(elapsed/dur,0,1):clamp((elapsed-dur)/dur,0,1),rad=f.phase===0?local*f.range:(1-local)*f.range;
      for(let i=0;i<f.rays;i++){const a=i/f.rays*Math.PI*2,px=f.x+Math.cos(a)*rad,py=f.y+Math.sin(a)*rad,key=`${i}:${f.phase}`;s.fx.push({kind:"sunRayPoint",x:px,y:py,life:.10,max:.10,color:f.color});for(const t of s.tanks){if(!t.alive)continue;if(Math.hypot(t.x-px,t.y-py)<12&&!((f.phase===0?f.hitOut:f.hitBack)[key+":"+t.id])){const table=f.phase===0?f.hitOut:f.hitBack;table[key+":"+t.id]=true;const dd=(d.sunRayMin||3)+((d.sunRayMax||8)-(d.sunRayMin||3))*clamp(rad/f.range,0,1);damageTank(s,t,dd*f.damageMult,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});}}}
      if(elapsed>dur*2)f.life=0;
    }else if(f.kind==="jetRocketBurst"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.count){f.tick=.18;f.index++;const target=nearestEnemy(s,f.owner,f.x,f.y),tx=target?.x??f.x+100,ty=target?.y??terrainY(s,tx),dx=tx-f.x,dy=ty-f.y,len=Math.max(1,Math.hypot(dx,dy)),speed=250;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"jetRocket",x:f.x,y:f.y,vx:dx/len*speed,vy:dy/len*speed,age:0,alive:true,radius:3,damageMult:f.damageMult,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.rocketDamage*f.damageMult,noTerrainDamage:true,homingStrength:4.8,homingDelay:.02,hitGrace:.08});s.fx.push({kind:"jetLaunch",x:f.x,y:f.y,life:.18,max:.18,color:f.color});}if(f.index>=f.count&&f.tick<-.15)f.life=0;
    }else if(f.kind==="furyTower"){
      const elapsed=f.max-f.life,sourceY=f.y-Math.min(1,elapsed/f.rise)*f.height;
      f.tick-=dt;const total=f.orange+f.blue;
      if(elapsed>=f.rise&&f.tick<=0&&f.index<total){f.tick=.055;const blue=f.index>=f.orange,idx=f.index++,span=blue?150:210,tx=clamp(f.x+rand(-span,span),8,s.width-8),dx=tx-f.x,dy=terrainY(s,tx)-sourceY,len=Math.max(1,Math.hypot(dx,dy)),speed=blue?225:205,d=weaponDef(f.weaponId,f.tier);s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"furyPellet",x:f.x,y:sourceY,vx:dx/len*speed,vy:dy/len*speed,age:0,alive:true,radius:blue?5:3,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:(blue?(d.furyBlueDamage||10):(d.furyOrangeDamage||5))*f.damageMult,specialRadius:blue?23:(d.radius||18),customColor:blue?"#63bfff":"#ff7048"});}
      s.fx.push({kind:"furyCore",x:f.x,y:sourceY,life:.10,max:.10,color:f.index>=f.orange?"#65bfff":f.color});if(f.index>=total&&f.life<.8)f.life=0;
    }
    else if(f.kind==="gravity"){
      for(const t of s.tanks){if(!t.alive)continue;const dx=f.x-t.x,dy=f.y-t.y,dist=Math.hypot(dx,dy);if(dist<f.r&&dist>3)t.x=clamp(t.x+dx/dist*42*dt*(1-dist/f.r),10,s.width-10);}
      if(f.life<=0&&!f.done){f.done=true;explosion(s,f.x,f.y,55,f.damage,fieldOwner(f),.8,"#9e77ff",{crit:!!f.critShot,x2:!!f.x2Active});}
    }else if(f.kind==="voidwell"){
      for(const t of s.tanks){if(!t.alive)continue;const dx=f.x-t.x,dy=f.y-t.y,dist=Math.hypot(dx,dy);if(dist<f.r&&dist>3)t.x=clamp(t.x+dx/dist*54*dt*(1-dist/f.r),10,s.width-10);}
      for(const p of s.projectiles){if(!p.alive)continue;const dx=f.x-p.x,dy=f.y-p.y,dist=Math.hypot(dx,dy);if(dist<f.r&&dist>6){const force=(f.projectilePull||1)*190*(1-dist/f.r);p.vx+=dx/dist*force*dt;p.vy+=dy/dist*force*dt;}}
      if(f.life<=0&&!f.done){f.done=true;explosion(s,f.x,f.y,58,f.damage,fieldOwner(f),.9,"#8d70ff",{crit:!!f.critShot,x2:!!f.x2Active});}
    }else if(f.kind==="groundwave"){
      f.lastX+=f.dir*180*dt;const y=terrainY(s,f.lastX)-4;s.fx.push({kind:"spark",x:f.lastX,y,life:.18,max:.18,color:"#73df9c"});for(const t of s.tanks){if(t.alive&&t.id!==f.owner&&Math.abs(t.x-f.lastX)<13&&Math.abs(t.y-y)<30)damageTank(s,t,f.damage*dt*2.5,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});}if(f.lastX>2&&f.lastX<s.width-2)modifyTerrainCrater(s,f.lastX,y,9,.15);
    }else if(f.kind==="horizonWave"){
      const step=f.dir*f.speed*dt;f.lastX+=step;f.travelled+=Math.abs(step);f.x=clamp(f.lastX,3,s.width-3);const y=terrainY(s,f.x)-3;s.fx.push({kind:"horizonSpark",x:f.x,y,life:.20,max:.20,color:f.color});
      for(const t of s.tanks){if(!t.alive||t.id===f.owner)continue;if(Math.abs(t.x-f.x)<15&&Math.abs(t.y-y)<30&&!f.hitIds.includes(t.id)){damageTank(s,t,f.damage*(f.returned?.60:1),fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});f.hitIds.push(t.id);}}
      if(f.travelled>=f.range||f.lastX<=3||f.lastX>=s.width-3){if(f.returnPass&&!f.returned){f.returned=true;f.dir*=-1;f.travelled=0;f.hitIds=[];f.life=Math.max(f.life,2.0);}else f.life=0;}
    }else if(f.kind==="twinkleDrop"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const gy=terrainY(s,f.x);s.fx.push({kind:"twinkleBeam",x:f.x,y1:f.y,y2:gy,life:.30,max:.30,color:f.color});explosion(s,f.x,gy,f.r,f.damage,fieldOwner(f),.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }else if(f.kind==="twinkleFinal"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const gy=terrainY(s,f.x);for(const off of [-35,0,35])explosion(s,clamp(f.x+off,4,s.width-4),terrainY(s,clamp(f.x+off,4,s.width-4)),f.r,f.damage,fieldOwner(f),.05,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"twinkleCross",x:f.x,y:gy,life:.38,max:.38,color:f.color});}
    }else if(f.kind==="timeEcho"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;s.fx.push({kind:"timeEcho",x:f.x,y:f.y,life:.42,max:.42,color:f.color,index:f.index,total:f.total});explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.16,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }else if(f.kind==="gunshipRun"){
      const progress=1-clamp(f.life/f.max,0,1);f.x=-70+(s.width+140)*progress;f.tick-=dt;
      if(f.tick<=0&&f.shotIndex<f.bullets){f.tick=Math.max(.075,2.15/Math.max(1,f.bullets));const i=f.shotIndex++,q=f.bullets<=1?.5:i/(f.bullets-1),tx=clamp(f.targetX+(q-.5)*f.span,8,s.width-8),ty=terrainY(s,tx)-4,dx=tx-f.x,dy=ty-f.y,len=Math.max(1,Math.hypot(dx,dy)),speed=420;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"gunshipBullet",x:f.x,y:f.y,vx:dx/len*speed,vy:dy/len*speed,age:0,alive:true,radius:2,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.bulletDamage*f.damageMult,specialRadius:7});
        const stride=Math.max(1,Math.floor(f.bullets/Math.max(1,f.cannons)));if(i%stride===Math.floor(stride/2)&&f.cannonIndex!==(i)){f.cannonIndex=i;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"gunshipCannon",x:f.x,y:f.y+4,vx:dx/len*300,vy:dy/len*300,age:.0,alive:true,radius:5,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.cannonDamage*f.damageMult,specialRadius:25});}}
      if(f.life<.45&&f.missile&&!f.missileDone){f.missileDone=true;const target=nearestEnemy(s,f.owner,f.targetX,terrainY(s,f.targetX),280),tx=target?.x??f.targetX,ty=terrainY(s,tx)-3,dx=tx-f.x,dy=ty-f.y,len=Math.max(1,Math.hypot(dx,dy));s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"gunshipMissile",x:f.x,y:f.y,vx:dx/len*260,vy:dy/len*260,age:0,alive:true,radius:6,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.missileDamage*f.damageMult,specialRadius:38});}
    }else if(f.kind==="hoverStrike"){
      f.delay-=dt;if(f.delay<=0&&!f.spawned){f.spawned=true;const n=f.drops||1;for(let i=0;i<n;i++){const q=n<=1?.5:i/(n-1),tx=clamp(f.targetX+(q-.5)*f.spread,8,s.width-8);s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"hoverDrop",x:tx,y:f.y,vx:0,vy:230,age:0,alive:true,radius:5,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.damage,specialRadius:f.r});}}
    }else if(f.kind==="discoHang"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.shots){f.tick=.10;const q=f.shots<=1?.5:f.index/(f.shots-1),tx=clamp(f.targetX+(q-.5)*f.span,8,s.width-8),ty=terrainY(s,tx)-3,dx=tx-f.x,dy=ty-f.y,len=Math.max(1,Math.hypot(dx,dy));f.index++;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"discoRay",x:f.x,y:f.y,vx:dx/len*340,vy:dy/len*340,age:0,alive:true,radius:2,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.damage,specialRadius:f.r,customColor:["#ff72cf","#72eaff","#ffe66d"][f.index%3]});}
      if(f.life<=.32&&f.cross&&!f.crossDone){f.crossDone=true;for(const off of [-45,0,45]){const xx=clamp(f.targetX+off,5,s.width-5);explosion(s,xx,terrainY(s,xx),f.r+5,f.damage*.75,fieldOwner(f),.04,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"discoCross",x:f.targetX,y:terrainY(s,f.targetX),life:.38,max:.38,color:f.color});}
    }else if(f.kind==="palmTree"){
      f.delay-=dt;if(f.delay<=0&&f.index<f.drops){f.delay=.10;const q=f.drops<=1?.5:f.index/(f.drops-1),tx=clamp(f.x+(q-.5)*f.span,8,s.width-8),sy=f.y-105,ty=terrainY(s,tx)-3,dx=tx-f.x,dy=ty-sy,len=Math.max(1,Math.hypot(dx,dy));f.index++;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"palmDrop",x:f.x,y:sy,vx:dx/len*240,vy:dy/len*240,age:0,alive:true,radius:3,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.damage,specialRadius:f.r});}
      if(f.life<=.35&&f.heavy&&!f.heavyDone){f.heavyDone=true;s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"palmDrop",x:f.x,y:f.y-125,vx:0,vy:255,age:0,alive:true,radius:6,noGravity:true,windFactor:0,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.damage*2.5,specialRadius:f.r+12});}
    }else if(f.kind==="nukeShock"&&f.life<=0&&!f.done){f.done=true;s.fx.push({kind:"nukeRing",x:f.x,y:f.y,life:.55,max:.55,color:f.color});explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.16,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    else if(f.kind==="echo"&&f.life<=0&&!f.done){f.done=true;explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.45,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    else if(f.kind==="timebomb"&&f.life<=0&&!f.done){f.done=true;explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),1,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    else if(f.kind==="faultPop"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const y=terrainY(s,f.x);explosion(s,f.x,y,f.r||28,f.damage,fieldOwner(f),.38,f.color||"#cf8c58",{crit:!!f.critShot,x2:!!f.x2Active});}}
  }
  const oneShot=["faultPop","burnTarget","lightningStrike","stickyMine","twinkleDrop","twinkleFinal","timeEcho","nukeShock","pinataDrop","fireStormRocks"];
  s.fields=s.fields.filter(f=>(f.dormant||f.life>0)&&!(f.done&&oneShot.includes(f.kind)));
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
    }else if(o.kind==="loot"&&Math.hypot(p.x-o.x,p.y-o.y)<o.r+(p.radius||4)){
      o.dead=true;grantAirdropReward(s,ownerOf(s,p),o.x,o.y,{floating:true});
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

function edgeWallTop(s,side){const x=side<0?0:s.width-1;return terrainY(s,x)-(s.edgeWallHeight||s.height*.20);}
function tryEdgeWallBounce(s,p,d){
  if((p.edgeWallCooldown||0)>0)return false;
  if(p.kind==="rampageWave"||p.kind==="solarSpark"||p.seagullShot||(p.weaponId==="mirror")||(p.weaponId==="ricochet"&&d.wallReflect))return false;
  let side=0;if(p.x<3&&p.vx<0)side=-1;else if(p.x>s.width-3&&p.vx>0)side=1;else return false;
  const edgeX=side<0?0:s.width-1,ground=terrainY(s,edgeX),top=ground-(s.edgeWallHeight||s.height*.20);
  if(p.y<top-3||p.y>ground+10)return false;
  p.x=side<0?5:s.width-5;p.vx=-p.vx*.92;p.edgeWallCooldown=.12;p.wallBounces=(p.wallBounces||0)+1;
  s.fx.push({kind:"edgeBounce",x:p.x,y:p.y,life:.28,max:.28,color:"#ff77d8"});return true;
}

function updateProjectile(s,p,dt){
  if(!p.alive)return;const d=weaponDef(p.weaponId,p.tier);
  p.age+=dt;if(p.age<0)return;
  p.edgeWallCooldown=Math.max(0,(p.edgeWallCooldown||0)-dt);
  p.traceTimer=(p.traceTimer||0)-dt;if(p.traceTimer<=0){p.traceTimer=.055;(p.trace||(p.trace=[])).push({x:p.x,y:p.y});}
  if(!p.skipSkillObjects)handleSkillObjects(s,p);

  if(p.kind==="rampageWave"){
    p.x+=p.vx*dt;p.y=p.startY+Math.sin(p.wavePhase+p.x*p.waveFreq)*p.waveAmp;
    for(const t of s.tanks){if(!isEnemy(s,ownerOf(s,p),t))continue;if(!p.hitIds.includes(t.id)&&Math.hypot(t.x-p.x,t.y-p.y)<16){damageTankP(s,p,t,weaponDef(p.weaponId,p.tier).damage*(p.damageMult||1),ownerOf(s,p));p.hitIds.push(t.id);s.fx.push({kind:"rampageHit",x:t.x,y:t.y,life:.25,max:.25,color:weaponDef(p.weaponId,p.tier).color});}}
    if((p.dir>0&&p.x>s.width+30)||(p.dir<0&&p.x<-30)||p.age>4.8)p.alive=false;return;
  }

  if(p.syncGroup&&!p.syncReleased){
    if(!p.syncPaused&&p.vy>0&&p.x>=0&&p.x<s.width&&(terrainY(s,p.x)-p.y)<=(d.syncHeight||75)){
      p.syncPaused=true;p.savedVx=p.vx;p.savedVy=p.vy;p.vx=0;p.vy=0;p.noGravity=true;s.fx.push({kind:"syncHold",x:p.x,y:p.y,life:.28,max:.28,color:d.color});
    }
    if(p.syncPaused){
      const group=s.projectiles.filter(q=>q.alive&&q.syncGroup===p.syncGroup),all=group.length>0&&group.every(q=>q.syncPaused||q.syncReleased);
      if(all){for(const q of group){if(q.syncPaused&&!q.syncReleased){q.syncPaused=false;q.syncReleased=true;q.vx=q.savedVx||0;q.vy=q.savedVy||25;q.noGravity=false;s.fx.push({kind:"syncRelease",x:q.x,y:q.y,life:.30,max:.30,color:d.color});}}}else return;
    }
  }

  if(p.seagullShot){
    if(p.age-(p.lastPoopAt||0)>=(d.poopInterval||1)){p.lastPoopAt=p.age;s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"seagullPoop",x:p.x-3,y:p.y+4,vx:p.vx*.32+rand(-9,9),vy:Math.max(18,p.vy*.16),age:0,alive:true,radius:3,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,startX:p.startX,windFactor:d.seagullWind||2,hitGrace:.08});s.fx.push({kind:"seagullDrop",x:p.x,y:p.y,life:.20,max:.20,color:"#eee8cf"});}
  }
  if(p.weaponId==="batteringram"&&!p.ramApex&&p.vy>=0){p.ramApex=true;p.gravityMult=d.ramApexGravity||4.9;s.fx.push({kind:"ramDive",x:p.x,y:p.y,life:.35,max:.35,color:d.color});}
  if(p.fighterJet&&!p.jetApexTriggered){if(Math.abs(p.vx)<4)p.vx=22;if(p.vy>=0){p.jetApexTriggered=true;s.fields.push({kind:"jetRocketBurst",x:p.x,y:p.y,life:1.4,max:1.4,tick:0,index:0,count:d.jetRockets||4,owner:p.owner,weaponId:p.weaponId,tier:p.tier,rocketDamage:d.rocketDamage||10,damageMult:p.damageMult,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color});s.fx.push({kind:"jetApex",x:p.x,y:p.y,life:.40,max:.40,color:d.color});}}
  if(p.kind==="burrow"){
    p.tunnelLeft-=dt;const target=nearestEnemy(s,p.owner,p.x,p.y,135);if(target)p.vx+=Math.sign(target.x-p.x)*34*dt;p.vx=clamp(p.vx,-95,95);p.x=clamp(p.x+p.vx*dt,5,s.width-5);p.y=terrainY(s,p.x)+(d.tunnelDepth||34);
    if(p.tunnelLeft<=0){p.alive=false;const gy=terrainY(s,p.x)-3;explosionP(s,p,p.x,gy,d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),.45,d.color);if(d.burrowShock)explosionP(s,p,p.x,gy-10,Math.max(20,d.radius*.58),d.damage*.28*(p.damageMult||1),ownerOf(s,p),.08,d.color);}
    return;
  }
  if(p.kind==="ghost"){
    const target=p.ghostTargetId?s.tanks.find(t=>t.id===p.ghostTargetId&&t.alive):nearestEnemy(s,p.owner,p.x,p.y);
    if(target){const dx=target.x-p.x;p.x+=Math.sign(dx)*Math.min(Math.abs(dx), (d.ghostTravel||105)*dt);p.y=terrainY(s,p.x)+(d.ghostDepth||24);if(Math.abs(dx)<7){p.alive=false;explosionP(s,p,target.x,target.y,d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),.45,d.color);if(d.ghostPulse)explosionP(s,p,target.x,target.y,24,d.damage*.30*(p.damageMult||1),ownerOf(s,p),.10,d.color);return;}}
    p.ghostLeft-=Math.max(20,d.ghostTravel||105)*dt;if(p.ghostLeft<=0){p.alive=false;explosionP(s,p,p.x,terrainY(s,p.x),d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),.45,d.color);}return;
  }
  if(p.kind==="corkscrewTunnel"){
    p.corkLeft-=Math.abs(p.vx)*dt;p.corkPulse=(p.corkPulse||0)-dt;p.x+=p.vx*dt;if(p.x<5||p.x>s.width-5)p.corkLeft=0;p.x=clamp(p.x,5,s.width-5);p.y=terrainY(s,p.x)+(d.corkDepth||24)+Math.sin(p.age*16)*5;
    if((d.corkPulses||0)>0&&p.corkPulse<=0&&p.corkPulseCount<(d.corkPulses||0)){p.corkPulseCount++;p.corkPulse=.34;explosionP(s,p,p.x,terrainY(s,p.x),16,d.damage*.28*(p.damageMult||1),ownerOf(s,p),.12,d.color);}
    if(p.corkLeft<=0){p.alive=false;explosionP(s,p,p.x,terrainY(s,p.x),d.radius,d.damage*(p.damageMult||1),ownerOf(s,p),.55,d.color);}return;
  }
  if(p.kind==="roller"){
    p.rollLeft-=dt;p.hitCooldown=Math.max(0,(p.hitCooldown||0)-dt);const owner=ownerOf(s,p);
    p.vx+=Math.sin(terrainSlope(s,p.x))*90*dt;p.vx*=Math.pow(p.weaponId==="sawblade"?.998:.992,dt*60);
    if(p.weaponId==="sawblade"){const sg=Math.sign(p.vx||1);p.vx=sg*Math.max(d.sawMinSpeed||110,Math.abs(p.vx));}
    const oldX=p.x;p.x+=p.vx*dt;p.rollDistance=(p.rollDistance||0)+Math.abs(p.x-oldX);if(p.x<1||p.x>s.width-2){p.alive=false;return;}p.y=terrainY(s,p.x)-5;if(p.impactTrail&&Math.random()<dt*8)modifyTerrainCrater(s,p.x,p.y,7,.08);
    const grow=d.growsWithRoll?clamp((p.rollDistance||0)/260,0,1):0;
    p.rollGrow=grow;const hitDamage=d.growsWithRoll?(d.damage+(d.growDamageMax-d.damage)*grow):d.damage;
    for(const t of s.tanks){
      if(!t.alive||t.id===p.owner)continue;
      if(Math.hypot(t.x-p.x,t.y-p.y)<15+grow*8){
        if(p.weaponId==="sawblade"){if(p.hitCooldown<=0){damageTankP(s,p,t,d.damage*(p.damageMult||1),owner);p.hitCooldown=d.sawHitCooldown||.46;const sg=Math.sign(p.vx||1);p.vx=sg*Math.max(d.sawMinSpeed||110,Math.abs(p.vx));p.x+=sg*16;}}
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
  
  if((p.homingStrength||0)>0){
    p.homingDelay=(p.homingDelay||0)-dt;
    if(p.homingDelay<=0){
      const target=nearestEnemy(s,p.owner,p.x,p.y,560);
      if(target){const speed=Math.max(35,Math.hypot(p.vx,p.vy)),desired=Math.atan2(target.y-p.y,target.x-p.x),current=Math.atan2(p.vy,p.vx);let da=(desired-current+Math.PI*3)%(Math.PI*2)-Math.PI,turn=(p.homingStrength||d.homing)*dt,ang=current+clamp(da,-turn,turn);p.vx=Math.cos(ang)*speed;p.vy=Math.sin(ang)*speed;}
    }
  }
  if(p.weaponId==="corkscrew"&&p.kind!=="corkscrewTunnel"){
    const px=-p.vy,py=p.vx,len=Math.max(1,Math.hypot(px,py)),w=Math.sin(p.age*12+(p.corkscrewPhase||0))*24;
    p.vx+=px/len*w*dt;p.vy+=py/len*w*dt;
  }


  if(p.weaponId==="boomerang"&&p.age>(d.returnTime||.8)&&!p.returned){p.returned=true;const cap=d.returnSpeedCap||145;p.vx=-Math.sign(p.vx||1)*Math.min(cap,Math.max(90,Math.abs(p.vx)*(d.returnForce||1.18)));p.vy-=55;}
  else if(p.weaponId==="boomerang"&&d.doubleReturn&&p.returned&&!p.returned2&&p.age>(d.returnTime||.8)+.85){p.returned2=true;p.vx*=-.88;p.vy-=40;}
  if(p.weaponId==="bounder"&&p.bounderStage==="rise"&&p.vy>-18){
    const target=(p.bounderTargetId&&s.tanks.find(t=>t.id===p.bounderTargetId&&t.alive))||nearestEnemy(s,p.owner,p.x,p.y);
    if(target){p.bounderStage="drop";p.x=target.x;p.vx=0;p.vy=d.bounderDropSpeed||260;p.noGravity=true;p.windFactor=0;s.fx.push({kind:"bounderLock",x:p.x,y:p.y,targetX:target.x,targetY:target.y,life:.32,max:.32,color:d.color});}
  }
  if(p.kind!=="deadDrop"){p.vx+=s.wind*(p.windFactor??1)*dt;if(!p.noGravity)p.vy+=s.gravity*(d.gravity||1)*(p.gravityMult||1)*dt;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(!p.skipSkillObjects)handleSkillObjects(s,p);
  tryEdgeWallBounce(s,p,d);

  if(p.weaponId==="napalm"&&!d.fireStorm&&p.kind!=="napalmFrag"&&!p.didSplit){const groundDist=(p.x>=0&&p.x<s.width)?terrainY(s,p.x)-p.y:1e9;if(p.age>=(d.airburstMinAge??.30)&&p.vy>0&&groundDist<=(d.airburstHeight||105)){p.didSplit=true;spawnNapalmFan(s,p,d);p.alive=false;return;}}

  const airburstFamily=["tristar","shardbloom","prismsplit","starburst","emberrain","kernelpop","twinkler"].includes(p.weaponId)||(p.weaponId==="cactus"&&(!d.cactusStrike||p.kind==="cactusPod"));
  if(airburstFamily&&!p.didSplit){
    const minAge=d.airburstMinAge??.30,groundDist=(p.x>=0&&p.x<s.width)?terrainY(s,p.x)-p.y:1e9;
    const nearGround=groundDist<=(d.airburstHeight||110)&&p.vy>0;
    const chained=p.splitAt!=null&&p.age>=p.splitAt;
    if((p.age>=minAge&&nearGround)||chained){splitProjectile(s,p);p.alive=false;return;}
  }
  if(p.kind==="fireworkRocket"&&!p.didSplit){const groundDist=(p.x>=0&&p.x<s.width)?terrainY(s,p.x)-p.y:1e9;if(p.age>=(d.airburstMinAge??.30)&&p.vy>0&&groundDist<=(d.airburstHeight||145)){p.didSplit=true;p.alive=false;spawnFireworkSparks(s,p,d,p.sparksPerRocket);return;}}
  if(p.maxAge&&p.age>p.maxAge){p.alive=false;return;}
  if(p.seagullShot&&(p.x<4||p.x>s.width-4)){p.vx*=-1;p.x=clamp(p.x,5,s.width-5);s.fx.push({kind:"seagullTurn",x:p.x,y:p.y,life:.24,max:.24,color:d.color});}
  if(p.kind==="solarSpark"&&(p.x<4||p.x>s.width-4||p.y<4)){if(p.x<4||p.x>s.width-4)p.vx*=-1;if(p.y<4)p.vy=Math.abs(p.vy);p.x=clamp(p.x,5,s.width-5);p.y=Math.max(5,p.y);s.fx.push({kind:"solarBounce",x:p.x,y:p.y,life:.18,max:.18,color:d.color});}
  if(p.weaponId==="mirror"&&(p.x<4||p.x>s.width-4)&&p.wallBounces<d.wallBounces){
    p.wallBounces++;p.vx*=-1;p.x=clamp(p.x,5,s.width-5);s.fx.push({kind:"spark",x:p.x,y:p.y,life:.22,max:.22,color:d.color});
  }else if(p.weaponId==="ricochet"&&d.wallReflect&&(p.x<4||p.x>s.width-4)){p.vx*=-1;p.x=clamp(p.x,5,s.width-5);if(d.maxHorizontalSpeed)p.vx=clamp(p.vx,-d.maxHorizontalSpeed,d.maxHorizontalSpeed);s.fx.push({kind:"spark",x:p.x,y:p.y,life:.22,max:.22,color:d.color});
  }else if(p.x<-80||p.x>s.width+80||p.y>s.height+100){
    // If Mine Layer exits the arena before placing every bounce, arm the mines already laid
    // instead of leaving dormant transient fields that would keep the turn alive forever.
    if(p.mineLayerShot&&p.mineGroup){const group=s.fields.filter(f=>f.kind==="stickyMine"&&f.group===p.mineGroup);group.forEach((f,i)=>{f.dormant=false;f.life=.28+i*.035;f.max=f.life;});}
    p.alive=false;return;
  }

  p.hitGrace=Math.max(0,(p.hitGrace||0)-dt);
  for(const t of s.tanks){
    if(!t.alive||(t.id===p.owner&&(p.age<.25||d.noSelfHit))||p.hitGrace>0)continue;
    if(p.weaponId==="fury"&&p.kind!=="furyPellet")continue;
    if(Math.hypot(t.x-p.x,t.y-p.y)<12+(p.radius||3)){
      if(p.kind==="scatterFrag"){p.alive=false;damageTankP(s,p,t,p.fragDamage||16,ownerOf(s,p));return;}
      if((p.pierceHits||0)>0){damageTankP(s,p,t,d.damage*(p.damageMult||1),ownerOf(s,p));p.pierceHits--;p.x+=Math.sign(p.vx||1)*16;continue;}
      onImpact(s,p,p.x,p.y,t);return;
    }
  }
  if(p.x>=0&&p.x<s.width&&p.y>=terrainY(s,p.x)){
    if(p.weaponId==="sniper"&&p.terrainPierce){return;}
    if(p.kind==="scatterFrag"){p.alive=false;explosionP(s,p,p.x,p.y,14,p.fragDamage||12,ownerOf(s,p),.25,"#ffd56d");}
    else onImpact(s,p,p.x,p.y);
  }
}

function settleTanks(s,dt){
  for(const t of s.tanks){
    if(!t.alive)continue;t.x=clamp(t.x,9,s.width-9);
    const target=tankGround(s,t);t.y=t.y<target?Math.min(target,t.y+180*dt):target;
    const slope=terrainSlope(s,t.x),slideAt=Math.min(1.34,Math.max(.86,(t.grip||.8)+.08));if(Math.abs(slope)>slideAt){t.x+=Math.sign(slope)*12*dt;t.y=tankGround(s,t);}
    if(t.y>s.height-4){t.alive=false;t.hp=0;}
  }
}
function evaluateWin(s){
  if(s.training)return;
  const alive=s.tanks.filter(t=>t.alive);
  if(s.mode==="teams"){
    const teams=[...new Set(alive.map(t=>t.team))];if(teams.length<=1){s.gameOver=true;s.winner=teams.length?`Team ${teams[0]+1}`:"Nobody";}
  }else if(s.mode==="juggernaut"){
    const jug=s.tanks.find(t=>t.id===s.juggernautId),hunters=alive.filter(t=>!t.isJuggernaut);
    if(!jug?.alive){s.gameOver=true;s.winner="HUNTERS";}
    else if(!hunters.length){s.gameOver=true;s.winner=jug.isPlayer?"YOU":"JUGGERNAUT";}
  }else if(alive.length<=1){
    s.gameOver=true;s.winner=alive[0]?.name||"Nobody";
  }
}
function nextAliveIndex(s,start){
  let i=start;for(let n=0;n<s.tanks.length;n++){i=(i+1)%s.tanks.length;if(s.tanks[i].alive)return i;}return start;
}
function performRestock(s){
  if(!s.restockPending||s.training)return false;
  s.restockPending=false;s.restockCount++;
  const amount=5;
  for(const t of s.tanks){
    if(!t.alive)continue;
    for(let i=0;i<amount;i++)addWeaponReward(s,t,{airdrop:false});
  }
  repairTerrainTowardInitial(s,.14);
  s.message=`WEAPON RESTOCK #${s.restockCount} · +${amount} SPECIALS · TERRAIN SHIFT`;s.messageTimer=2.1;
  s.fx.push({kind:"restock",x:s.width/2,y:118,life:1.2,max:1.2,color:"#75e7ff"});
  s.fx.push({kind:"quakeRepair",x:s.width/2,y:s.height*.56,life:.70,max:.70,color:"#88e5c8",strength:.14});
  return true;
}
function restoreTrainingDummies(s){
  for(const t of s.tanks){
    if(!t.isDummy)continue;
    t.alive=true;t.knockedOut=false;t.hp=t.maxHp;t.armor=t.trainingArmor||0;t.y=tankGround(s,t);
  }
}
export function getTrainingTelemetry(s){return Object.values(s?.telemetry||{}).map(e=>({...e,avgDamage:e.shots?e.totalDamage/e.shots:0,hitRate:e.shots?e.hitShots/e.shots:0,avgEvents:e.shots?e.totalHitEvents/e.shots:0}));}
export function resetTrainingTelemetry(s){if(!s?.training)return false;s.telemetry={};s.telemetryStartedAt=Date.now();return true;}

export function resetTrainingRange(s){
  if(!s?.training)return false;
  s.terrain=createTerrain(s.width,s.height,s.arenaIndex);s.initialTerrain=s.terrain.slice();
  const margin=s.width*.075;
  for(let i=0;i<s.tanks.length;i++){
    const t=s.tanks[i];t.x=margin+(s.width-margin*2)*(i/Math.max(1,s.tanks.length-1));t.y=tankGround(s,t);t.alive=true;t.knockedOut=false;t.hp=t.maxHp;t.armor=t.trainingArmor||0;t.fuel=t.maxFuel;
  }
  s.projectiles=[];s.fields=[];s.fires=[];s.fx=[];s.crate=null;s.skillObjects=[];s.traceCurrent=[];s.lastShotTraces=[];s.botLastShotTraces=[];s.playerPersistentTraces=[];s.phase="aim";s.shotInProgress=false;s.nextTurnDelay=0;s.current=0;s.turnTimer=s.turnTime;s.message="TRAINING RANGE RESET";s.messageTimer=1.4;
  return true;
}
function advanceTurn(s){
  evaluateWin(s);if(s.gameOver)return;
  const completedOwnerId=s.activeShotSummary?.ownerId;
  finalizeShotSummary(s);
  const completedTraces=s.settings.tracer?s.traceCurrent.map(path=>path.slice()):[];
  const playerId=s.tanks[0]?.id;
  if(completedOwnerId===playerId)s.playerPersistentTraces=completedTraces;
  else if(completedOwnerId!=null)s.botLastShotTraces=completedTraces;
  s.lastShotTraces=completedTraces;s.traceCurrent=[];
  if(s.training){
    restoreTrainingDummies(s);s.round++;s.current=0;s.turnTimer=s.turnTime;s.phase="aim";s.nextTurnDelay=0;const p=s.tanks[0];if(p){p.fuel=p.maxFuel;s.selectedWeapon=p.selected;s.selectedTier=p.selectedTier;s.playerAngle=p.angle;s.playerPower=p.power;}s.message="TRAINING · FIRE WHEN READY";s.messageTimer=.8;return;
  }
  const restocked=performRestock(s);
  const old=s.current;
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
  if(!restocked){s.message=t?.isPlayer?"YOUR TURN":`${t?.name} AIMING`;s.messageTimer=1.1;}
  if(t?.isPlayer){s.selectedWeapon=t.selected;s.selectedTier=t.selectedTier;s.playerAngle=t.angle;s.playerPower=t.power;}
}
function grantAirdropReward(s,owner,x,y,{floating=false}={}){
  if(!owner)return [];
  const rewards=[],rewardCount=Math.max(1,owner.airdropWeapons||1);
  for(let i=0;i<rewardCount;i++)rewards.push(addWeaponReward(s,owner,{airdrop:true}));
  const armor=(floating?10:15)+(owner.crateArmorBonus||0);owner.armor=Math.min(150,owner.armor+armor);
  const first=rewards[0];
  s.message=`${floating?"AIR LOOT":"AIRDROP"}: ${WEAPONS[first.id].name} T${first.tier}${rewards.length>1?` + ${rewards.length-1} WEAPON`:""} + ${armor} ARMOR`;s.messageTimer=2.0;
  s.fx.push({kind:"cratePop",x,y,life:.55,max:.55,color:floating?"#8ff3ff":"#ffd86a"});
  return rewards;
}
function updateCrate(s,dt){
  if(!s.crate?.alive)return;const c=s.crate;
  if(!c.grounded){c.vy+=s.gravity*.7*dt;c.y+=c.vy*dt;if(c.y>=terrainY(s,c.x)-9){c.y=terrainY(s,c.x)-9;c.vy=0;c.grounded=true;}}
  for(const p of s.projectiles){
    if(p.alive&&Math.hypot(p.x-c.x,p.y-c.y)<15){c.alive=false;grantAirdropReward(s,ownerOf(s,p),c.x,c.y);p.alive=false;break;}
  }
  // Once on the ground, a tank can simply drive over the crate to collect it.
  if(c.alive&&c.grounded){
    for(const t of s.tanks){if(t.alive&&Math.hypot(t.x-c.x,t.y-c.y)<27){c.alive=false;grantAirdropReward(s,t,c.x,c.y);break;}}
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
  const no=s.projectiles.length===0,transient=s.fires.length>0||s.fields.some(f=>["gravity","voidwell","groundwave","echo","timebomb","faultPop","burnTarget","lightningStrike","stickyMine","snake","viperPath","horizonWave","twinkleDrop","twinkleFinal","timeEcho","gunshipRun","hoverStrike","discoHang","palmTree","nukeShock","zipper","spikerRun","pinataWait","pinataDrop","fireStormRocks","sunburstField","jetRocketBurst","furyTower"].includes(f.kind));
  if(s.phase==="shot"&&no&&!transient&&!s.shotInProgress){s.nextTurnDelay-=dt;if(s.nextTurnDelay<=0)advanceTurn(s);}
  else if(s.phase==="shot"&&no&&!transient&&s.shotInProgress)scheduleTurnEnd(s,.8);
}

function simulateLanding(s,t,angle,power){
  const d=weaponDef(t.selected,t.selectedTier||1),speed=launchSpeedFromPower(power);let x=t.x+Math.cos(angle)*18,y=t.y-8-Math.sin(angle)*18,vx=Math.cos(angle)*speed,vy=-Math.sin(angle)*speed;
  const dt=.035;
  for(let i=0;i<260;i++){vx+=s.wind*dt;vy+=s.gravity*(d.gravity||1)*dt;x+=vx*dt;y+=vy*dt;
    if(x<0||x>=s.width){const side=x<0?-1:1,edgeX=side<0?0:s.width-1,ground=terrainY(s,edgeX),top=ground-(s.edgeWallHeight||s.height*.20);if(y>=top&&y<=ground+10){x=side<0?4:s.width-4;vx=-vx*.92;}else return{x:clamp(x,0,s.width),y:s.height};}
    if(y>s.height)return{x:clamp(x,0,s.width),y:s.height};if(y>=terrainY(s,x))return{x,y};}
  return{x,y};
}
function botPickWeapon(s,t,target){
  const usable=t.inventory.filter(v=>v.ammo>0),special=usable.filter(v=>v.id!=="pulse");if(!special.length)return usable[0];
  const dx=Math.abs(target.x-t.x),cluster=s.tanks.filter(q=>isEnemy(s,t,q)&&Math.abs(q.x-target.x)<115).length;
  let scored=special.map(slot=>{
    let score=Math.random()*18;const id=slot.id,d=weaponDef(id,slot.tier);score+=slot.tier*4;
    if(id==="rampart")score+=t.hp<t.maxHp*.45?24:-18;
    if(["roller","sawblade","viper","backroller"].includes(id))score+=dx<430?20:-12;
    if(["pinpoint","raillance","sniper","batteringram"].includes(id))score+=dx<700?17:-4;
    if(["meteorchoir","skymarker","arcchain","megaflux","acidrain","areastrike","carpetbomb","asteroidbelt","gunship","quakecharge","ringer","sunburst","shrapnel","fury","pinata","napalm"].includes(id))score+=cluster*10;
    if(id==="burrow"||id==="ghostbomb"||id==="digger"||id==="breaker"||id==="spiker")score+=Math.abs(terrainY(s,target.x)-terrainY(s,(target.x+t.x)/2))>45?14:6;
    if(["zipper","miniv","snowball","breakermadness"].includes(id))score+=dx<360?14:-4;
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
