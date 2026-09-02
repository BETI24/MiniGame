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
    telemetry:{},telemetryEvents:[],telemetryStartedAt:Date.now(),playerShotsFired:0,nextRestockAt:8,restockPending:false,restockCount:0,edgeWallHeight:height*.20,
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

function iceModifiers(s,x){
  let grip=1,fuel=1;
  for(const f of s.fields||[])if(f.kind==="icePatch"&&f.turnsLeft>0&&Math.abs(x-f.x)<=f.span*.5){grip=Math.min(grip,f.grip||1);fuel=Math.max(fuel,f.fuel||1);}
  return {grip,fuel};
}
function anchorConstraint(s,t){
  let lo=9,hi=s.width-9,active=false;
  for(const f of s.fields||[]){
    if(f.kind!=="anchorChain"||!(f.turnsLeft>0)||!f.targetIds?.includes(t.id))continue;
    active=true;lo=Math.max(lo,f.x-(f.leash||78));hi=Math.min(hi,f.x+(f.leash||78));
  }
  return {active,lo,hi};
}
export function moveTank(s,t,dir,distance=5){
  if(!s||!t?.alive||s.phase!=="aim"||currentTank(s)?.id!==t.id||t.fuel<=0)return false;
  dir=Math.sign(dir);if(!dir)return false;
  const ice=iceModifiers(s,t.x),effectiveGrip=(t.grip||.8)*ice.grip;
  const requested=Math.min(Math.abs(distance),Math.max(1,t.fuel)/ice.fuel);
  const sub=Math.max(1,Math.ceil(requested/2.25));
  const step=requested/sub;
  let moved=0,totalCost=0;
  for(let i=0;i<sub;i++){
    const cx=t.x,anchor=anchorConstraint(s,t),nx=clamp(cx+dir*step,anchor.lo,anchor.hi);if(nx===cx){if(anchor.active&&moved<=.01){s.message="ANCHOR CHAIN LIMIT";s.messageTimer=.6;}break;}
    const cy=terrainY(s,cx),ny=terrainY(s,nx),uphill=Math.max(0,cy-ny);
    const local=Math.abs(terrainSlope(s,nx));
    const broad=Math.abs(Math.atan2(terrainY(s,nx+10)-terrainY(s,nx-10),20));
    // Narrow one/two-pixel crater lips are more forgiving than broad cliffs. This prevents tanks
    // getting trapped on tiny sharp scars while preserving meaningful slope upgrades.
    const narrowLip=local>effectiveGrip&&broad<effectiveGrip*.90&&uphill<7+effectiveGrip*7;
    const stepLimit=8+effectiveGrip*10;
    if((local>effectiveGrip&&!narrowLip)||uphill>stepLimit){
      if(moved<=.01){s.message="TRACKS CAN'T CLIMB THIS SLOPE";s.messageTimer=.6;}
      break;
    }
    const effectiveSlope=Math.min(local,Math.max(broad,effectiveGrip*.45));
    const cost=step*(1+effectiveSlope*1.55)*(t.fuelEfficiency||1)*ice.fuel;
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
  s.activeShotSummary={ownerId:t.id,ownerIsPlayer:!!t.isPlayer,mode:s.mode,weaponId,tier:weaponTier,totalDamage:0,hitCount:0,crit:crit>1,critMultiplier:crit,hadX2:false,overchargeUsed:over>1,damageBonus:t.damageBonus||1,impactSamples:0,bestImpactDistance:Infinity};
  const add=(a=angle,p=power,extra={})=>s.projectiles.push(projectileBase(s,t,a,p,weaponId,weaponTier,{damageMult:mult,startX:t.x,critShot:crit>1,x2Active:false,...extra}));
  if(weaponId!=="imploder")s.fx.push({kind:"muzzle",weaponId,tier:weaponTier,x:t.x+Math.cos(angle)*19,y:t.y-8-Math.sin(angle)*19,angle,life:.28,max:.28,color:d.color});

  // V12 content families that alter the launch itself.
  if(weaponId==="imploder"){
    noteTelemetryProximity(s,t,t.x,t.y,d.radius||92);
    s.fields.push({kind:"imploderCharge",x:t.x,y:t.y,life:d.imploderCharge||1.05,max:d.imploderCharge||1.05,owner:t.id,weaponId,tier:weaponTier,damageMult:mult,critShot:crit>1,x2Active:false,enemyDamage:(d.imploderEnemyDamage||d.damage)*mult,selfFraction:d.imploderSelfFraction||.45,r:d.radius||92,terrainScale:d.imploderTerrain||.72,color:d.color});
    s.message=`${d.name.toUpperCase()} · CORE CHARGING`;s.messageTimer=Math.max(1,d.imploderCharge||1.05);return true;
  }else if(weaponId==="waterballoon"){
    const n=d.balloons||1,mid=(n-1)/2;
    for(let i=0;i<n;i++){const spread=(d.balloonSpread||.035),off=n===1?rand(-spread,spread):(i-mid)*spread*.72+rand(-spread*.32,spread*.32);add(angle+off,clamp(power+rand(-2.2,2.2),10,100),{kind:"waterBalloon",radius:5,balloonBounces:rint(0,d.balloonMaxBounces??3),noTerrainDamage:true,age:-i*.018});}
  }else if(weaponId==="quicksand"){
    const n=d.sandCount||30,mid=(n-1)/2,spread=d.sandSpread||.052;
    for(let i=0;i<n;i++){const q=(i-mid)/Math.max(1,mid);add(angle+q*spread+rand(-spread*.10,spread*.10),clamp(power+rand(-1.8,1.0),10,100),{kind:"sandGrain",radius:1.4,noTerrainDamage:true,age:-i*.018,maxAge:5.5});}
  }else if(weaponId==="dualroller"&&d.spreader){
    add(angle,power,{kind:"spreaderMarker",radius:4,flareWeapon:true,noTerrainDamage:true});
  }else if(weaponId==="molecule"){
    add(angle,power,{kind:"moleculeCore",radius:6,electronHits:{},moleculePhase:rand(0,Math.PI*2)});
  }
  // V8 non-standard launch families. Their distinctive behavior begins before a normal projectile exists.
  else if(weaponId==="quakecharge"){
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
  noteTelemetryProximity(s,t,hitX,hitY,hitTank?14:0);
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
function telemetryTargets(s,owner){
  if(!owner)return [];
  return s.tanks.filter(t=>t.id!==owner.id&&t.alive&&isEnemy(s,owner,t));
}
function noteTelemetryProximity(s,owner,x,y,radius=0){
  const q=s.activeShotSummary;if(!q||!owner||q.ownerId!==owner.id)return;
  let best=Infinity;
  for(const t of telemetryTargets(s,owner)){
    const d=Math.max(0,Math.hypot(t.x-x,t.y-y)-Math.max(0,radius)-14);
    if(d<best)best=d;
  }
  if(Number.isFinite(best)){q.bestImpactDistance=Math.min(q.bestImpactDistance,best);q.impactSamples++;}
}
function traceTelemetryDistance(s,q){
  const owner=s.tanks.find(t=>t.id===q.ownerId);if(!owner)return Infinity;
  const targets=telemetryTargets(s,owner);if(!targets.length)return Infinity;
  let best=Infinity;
  for(const path of s.traceCurrent||[]){
    if(!path?.length)continue;
    const stride=Math.max(1,Math.floor(path.length/26));
    for(let i=0;i<path.length;i+=stride){
      const pt=path[i];
      for(const t of targets){best=Math.min(best,Math.max(0,Math.hypot(t.x-pt.x,t.y-pt.y)-14));if(best<=0)return 0;}
    }
  }
  return best;
}
function explosion(s,x,y,radius,damage,owner,terrainScale=1,color="#fff",meta={}){
  noteTelemetryProximity(s,owner,x,y,radius);
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
  noteTelemetryProximity(s,owner,x,y,radius);
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
    // Match damage, score and Overcharge use damage actually absorbed by HP/armor.
    // This prevents large finishing hits from farming statistics through overkill.
    owner.damage+=applied;
    owner.overcharge=clamp(owner.overcharge+applied*.55*(owner.overchargeRate||1),0,100);
    if(applied>0)noteTelemetryProximity(s,owner,t.x,t.y,14);
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
  const d=weaponDef(q.weaponId,q.tier);
  const pathDistance=traceTelemetryDistance(s,q);
  const bestDistance=Math.min(q.bestImpactDistance,pathDistance);
  const utility=(d.damage||0)<=0&&!d.echoDamage&&!d.repairDamage;
  const hit=q.totalDamage>0;
  const near=!hit&&Number.isFinite(bestDistance)&&bestDistance<=55;
  const far=!hit&&!near&&Number.isFinite(bestDistance)&&bestDistance<=180;
  const wild=!hit&&!near&&!far;
  const engaged=hit||near||far;
  const clean=!q.crit&&!q.hadX2&&!q.overchargeUsed&&Math.abs((q.damageBonus||1)-1)<.001;
  const event={...q,bestDistance:Number.isFinite(bestDistance)?bestDistance:null,utility,hit,near,far,wild,engaged,clean};
  s.damageSummary={...q,life:1.75,max:1.75};
  const key=`${q.weaponId}:${q.tier}`,e=s.telemetry[key]||(s.telemetry[key]={weaponId:q.weaponId,tier:q.tier,shots:0,hitShots:0,engagedShots:0,nearMisses:0,farMisses:0,wildMisses:0,totalDamage:0,maxDamage:0,totalHitEvents:0,lastDamage:0,playerShots:0,botShots:0,cleanShots:0,cleanDamage:0,critShots:0,x2Shots:0,utilityShots:0});
  e.shots++;e.totalDamage+=q.totalDamage;e.maxDamage=Math.max(e.maxDamage,q.totalDamage);e.totalHitEvents+=q.hitCount;e.lastDamage=q.totalDamage;
  if(hit)e.hitShots++;if(engaged)e.engagedShots++;if(near)e.nearMisses++;if(far)e.farMisses++;if(wild)e.wildMisses++;
  if(q.ownerIsPlayer)e.playerShots++;else e.botShots++;if(clean){e.cleanShots++;e.cleanDamage+=q.totalDamage;}if(q.crit)e.critShots++;if(q.hadX2)e.x2Shots++;if(utility)e.utilityShots++;
  s.telemetryEvents.push(event);
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


// ---------------- V12 weapon content helpers ----------------
function v12FieldMeta(p,d,extra={}){
  return {owner:p.owner,weaponId:p.weaponId,tier:p.tier,damageMult:p.damageMult||1,critShot:!!p.critShot,x2Active:!!p.x2Active,color:d.color,...extra};
}
function spawnWaterBurst(s,p,d,x,y){
  const n=d.waterDrops||10,owner=ownerOf(s,p),baseSpeed=142;
  noteTelemetryProximity(s,owner,x,y,0);
  s.fx.push({kind:"waterBurst",x,y,life:.52,max:.52,color:d.color,count:n});
  for(let i=0;i<n;i++){
    const side=i<n/2?-1:1,q=(i%(Math.ceil(n/2)))/Math.max(1,Math.ceil(n/2)-1),a=(side<0?Math.PI:0)+rand(-.38,.38),speed=baseSpeed*(.68+q*.48+rand(-.08,.08));
    spawnMiniProjectile(s,p,{angle:a,speed,weaponId:p.weaponId,kind:"waterDrop",damageMult:p.damageMult,extra:{radius:2,noTerrainDamage:true,waterDamage:true,startX:p.startX??owner?.x,hitGrace:.025,maxAge:1.55,gravityMult:.68,windFactor:.45}});
  }
}
function createDualRollerField(s,p,d,x,dir,speedScale=1,delay=0){
  const y=terrainY(s,x)-5;
  s.fields.push({kind:"dualRollerField",x,y,centerX:x,dir,speed:(d.dualRollSpeed||115)*speedScale,life:(d.dualRollTime||1.9)+delay,max:(d.dualRollTime||1.9)+delay,delay,damage:(d.dualRollDamage||20)*(p.damageMult||1),r:16,hitIds:[],...v12FieldMeta(p,d)});
}
function spawnSpreader(s,p,d,x){
  noteTelemetryProximity(s,ownerOf(s,p),x,terrainY(s,x),0);
  const n=d.spreaderRollers||9,mid=(n-1)/2;
  s.fx.push({kind:"spreaderCall",x,y:terrainY(s,x),life:.62,max:.62,color:d.color,count:n});
  for(let i=0;i<n;i++){
    const q=i-mid,tx=clamp(x+q*22,12,s.width-12),dir=q<0?-1:q>0?1:0;
    s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"spreaderDrop",x:tx,y:-42-Math.abs(q)*9,vx:0,vy:195+Math.abs(q)*8,age:-Math.abs(q)*.018,alive:true,radius:4,noGravity:true,windFactor:0,skipSkillObjects:true,damageMult:p.damageMult||1,critShot:!!p.critShot,x2Active:!!p.x2Active,rollDir:dir,rollSpeedScale:.78+Math.abs(q)*.075,hitGrace:.02});
  }
}
function spawnStraightSpecial(s,p,weaponId,kind,x,y,tx,ty,speed,damage,radius,color){
  const dx=tx-x,dy=ty-y,len=Math.max(1,Math.hypot(dx,dy));
  s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId,tier:p.tier,kind,x,y,vx:dx/len*speed,vy:dy/len*speed,age:0,alive:true,radius:3,noGravity:true,windFactor:0,skipSkillObjects:true,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,specialDamage:damage*(p.damageMult||1),specialRadius:radius,customColor:color||weaponDef(weaponId,p.tier).color,hitGrace:.03,maxAge:3.5});
}


// ---------------- V15 weapon content helpers ----------------
function v15FieldMeta(p,d,extra={}){return v12FieldMeta(p,d,extra);}
function bridgeCauseway(s,x0,x1,lift=34){
  const a=Math.max(3,Math.floor(Math.min(x0,x1))),b=Math.min(s.terrain.length-4,Math.ceil(Math.max(x0,x1)));if(b-a<4)return;
  const ya=terrainY(s,a),yb=terrainY(s,b),span=Math.max(1,b-a);
  for(let x=a;x<=b;x++){
    const q=(x-a)/span,ideal=ya+(yb-ya)*q-Math.sin(Math.PI*q)*lift;
    // Construction only adds material / softens deep valleys; it never digs a new trench.
    if(s.terrain[x]>ideal)s.terrain[x]+=(ideal-s.terrain[x])*.82;
  }
  for(let pass=0;pass<2;pass++){const c=s.terrain.slice();for(let x=a+2;x<=b-2;x++)s.terrain[x]=(c[x-2]+c[x-1]+c[x]*2+c[x+1]+c[x+2])/6;}
}
function stampTerrain(s,cx,span,teeth,raise,cut,phase=0){
  const step=span/Math.max(1,teeth-1);
  for(let i=0;i<teeth;i++){
    const xx=clamp(cx-span*.5+i*step,5,s.width-5),up=(i+phase)%2===0;
    if(up)modifyTerrainRaise(s,xx,Math.max(9,step*.34),raise);
    else modifyTerrainCrater(s,xx,terrainY(s,xx),Math.max(10,step*.38),Math.max(.16,cut/36));
  }
}
function relaxTerrainStrip(s,cx,span,strength=.22){
  const a=Math.max(2,Math.floor(cx-span*.5)),b=Math.min(s.terrain.length-3,Math.ceil(cx+span*.5)),c=s.terrain.slice();
  for(let x=a;x<=b;x++){const avg=(c[x-2]+c[x-1]+c[x]+c[x+1]+c[x+2])/5;s.terrain[x]+=(avg-s.terrain[x])*strength;}
}
function resolveV15Impact(s,p,d,x,y,hitTank){
  const owner=ownerOf(s,p),mult=p.damageMult||1,meta=v15FieldMeta(p,d),gy=terrainY(s,x),incoming=Math.sign(p.vx||1)||1;
  if(p.weaponId==="sonicboom"){
    p.alive=false;explosion(s,x,y,d.radius||30,d.damage*mult,owner,.35,d.color,{crit:!!p.critShot,x2:!!p.x2Active});if((d.sonicFinal||0)>0){s.fx.push({kind:"sonicCrown",x,y,life:.48,max:.48,color:d.color,r:(d.radius||30)+28});explosion(s,x,y,(d.radius||30)+18,d.sonicFinal*mult,owner,.04,"#e9fdff",{crit:!!p.critShot,x2:!!p.x2Active});}return true;
  }
  if(p.weaponId==="bulldozer"){
    p.alive=false;const passes=d.dozerPasses||1,life=.65+passes*(d.dozerSpan||150)/(d.dozerSpeed||92);
    s.fields.push({kind:"dozerField",x,y:gy-8,startX:x,dir:incoming,pass:0,passes,returnPass:!!d.dozerReturn,speed:d.dozerSpeed||92,span:d.dozerSpan||150,damage:(d.dozerDamage||18)*mult,push:d.dozerPush||22,raise:d.dozerRaise||7,final:(d.dozerFinal||0)*mult,life,max:life,hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="plinko"){
    p.alive=false;const rows=d.plinkoRows||6,span=d.plinkoSpan||118,n=d.plinkoBalls||1,top=Math.max(42,gy-210),pegs=[];
    for(let r=0;r<rows;r++){const cols=5+(r%2),yy=top+34+r*20;for(let c=0;c<cols;c++){const q=(c-(cols-1)/2)/(Math.max(1,cols-1)/2);pegs.push({x:x+q*span*.43+(r%2?span*.055:0),y:yy});}}
    const balls=[];for(let i=0;i<n;i++){const gold=!!d.plinkoGold&&i===n-1;balls.push({id:i,x:x+(i-(n-1)/2)*12,y:top-22,fromX:x+(i-(n-1)/2)*12,fromY:top-22,toX:x,toY:top,row:-1,seg:0,done:false,gold});}
    const life=1.25+rows*.18+n*.10;s.fields.push({kind:"plinkoBoard",x,y:gy,top,span,rows,pegs,balls,damage:(d.plinkoDamage||32)*mult,gold:(d.plinkoGold||0)*mult,final:(d.plinkoFinal||0)*mult,life,max:life,...meta});return true;
  }
  if(p.weaponId==="aegisdome"){
    p.alive=false;s.fields.push({kind:"aegisDome",x,y:gy,dormant:true,life:9999,max:9999,turnsLeft:d.aegisTurns||2,r:d.aegisRadius||76,charges:d.aegisCharges||1,maxCharges:d.aegisCharges||1,reflect:d.aegisReflect||0,reflected:0,collapse:(d.aegisCollapse||0)*mult,...meta});s.fx.push({kind:"aegisDeploy",x,y:gy,r:d.aegisRadius||76,life:.48,max:.48,color:d.color});return true;
  }
  if(p.weaponId==="gravitylasso"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-gy)<=(d.lassoRange||128)).sort((a,b)=>Math.hypot(a.x-x,a.y-gy)-Math.hypot(b.x-x,b.y-gy)).slice(0,d.lassoTargets||1);if(!targets.length)return true;
    const life=.72+(d.lassoTurns||1)*.72;s.fields.push({kind:"gravityLasso",x,y:gy-16,life,max:life,targetIds:targets.map(t=>t.id),starts:targets.map(t=>({x:t.x,y:t.y})),turns:d.lassoTurns||1,orbit:d.lassoRadius||52,damage:(d.lassoDamage||28)*mult,throw:d.lassoThrow||42,final:(d.lassoFinal||0)*mult,dir:incoming,...meta});return true;
  }
  if(p.weaponId==="laserplow"){
    p.alive=false;const len=Math.hypot(p.vx||1,p.vy||1)||1,ux=(p.vx||1)/len,uy=(p.vy||1)/len,rays=[];
    const addRay=(ax,ay,bx,by)=>rays.push({ax,ay,bx,by});
    if(d.cutDiamond){for(const a of [-.55,-.18,.18,.55]){const ca=Math.cos(a),sa=Math.sin(a),vx=ux*ca-uy*sa,vy=ux*sa+uy*ca;addRay(x,y,x+vx*(d.cutLength||225),y+vy*(d.cutLength||225));}}
    else if(d.cutCross){addRay(x,y,x+ux*(d.cutLength||190),y+uy*(d.cutLength||190));addRay(x,y,x-uy*(d.cutLength||190),y+ux*(d.cutLength||190));}
    else if((d.cutRays||1)>1){const off=d.cutParallel||18,nx=-uy,ny=ux;for(const q of [-.5,.5])addRay(x+nx*off*q,y+ny*off*q,x+nx*off*q+ux*(d.cutLength||160),y+ny*off*q+uy*(d.cutLength||160));}
    else addRay(x,y,x+ux*(d.cutLength||130),y+uy*(d.cutLength||130));
    s.fields.push({kind:"laserPlow",x,y:gy,life:.72,max:.72,rays,width:d.cutWidth||11,damage:(d.cutDamage||40)*mult,depth:d.cutDepth||.32,final:(d.cutFinal||0)*mult,applied:false,...meta});return true;
  }
  if(p.weaponId==="conveyor"){
    p.alive=false;s.fields.push({kind:"conveyorBelt",x,y:gy,dormant:true,life:9999,max:9999,turnsLeft:d.beltTurns||3,span:d.beltSpan||105,speed:d.beltSpeed||18,damage:(d.beltDamage||8)*mult,mode:d.beltMode||"forward",dir:incoming,centerPulse:(d.beltCenterPulse||0)*mult,tick:.2,hitKeys:{},...meta});s.fx.push({kind:"beltDeploy",x,y:gy,span:d.beltSpan||105,life:.40,max:.40,color:d.color});return true;
  }
  if(p.weaponId==="geostamp"){
    p.alive=false;const presses=d.stampPresses||1,life=.55+presses*.52;s.fields.push({kind:"geoStamp",x,y:gy,life,max:life,teeth:d.stampTeeth||3,span:d.stampSpan||105,raise:d.stampRaise||22,cut:d.stampCut||14,damage:(d.stampDamage||16)*mult,presses,index:0,tick:.30,fractal:!!d.stampFractal,final:(d.stampFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="newtoncradle"){
    p.alive=false;const n=d.cradleBalls||5,span=d.cradleSpan||118,dir=incoming,markerEnd=x,baseX=x-dir*span,balls=[];for(let i=0;i<n;i++){const q=i/(n-1);const xx=baseX+(markerEnd-baseX)*q;balls.push({x:xx,y:Math.min(gy-26,terrainY(s,xx)-30)});}const transfers=d.cradleTransfers||1,life=.65+transfers*.68;s.fields.push({kind:"newtonCradle",x,y:gy,life,max:life,balls,dir,transfers,damage:(d.cradleDamage||34)*mult,final:(d.cradleFinal||0)*mult,index:0,tick:.26,swing:0,...meta});return true;
  }
  if(p.weaponId==="adaptiveshell"){
    p.alive=false;const dmg=(d.adaptiveDamage||38)*mult,near=s.tanks.filter(t=>isEnemy(s,owner,t)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0],nearDist=near?Math.hypot(near.x-x,near.y-y):Infinity;
    let mode="breach";
    if(hitTank&&isEnemy(s,owner,hitTank)){mode="pierce";damageTankP(s,p,hitTank,dmg*1.15,owner);if(d.adaptiveDouble)explosionFlat(s,p,hitTank.x,hitTank.y,28,dmg*.45,owner,.04,d.color);}
    else if(near&&nearDist<Math.max(95,d.radius*2.6)){mode="seek";const seekers=d.adaptiveSeekers||Math.max(1,d.adaptiveLevel||1);for(let i=0;i<seekers;i++){const sx=x+rand(-18,18),sy=gy-28-rand(0,22),tx=near.x+rand(-6,6),ty=near.y,dx=tx-sx,dy=ty-sy,l=Math.max(1,Math.hypot(dx,dy));s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"adaptiveSeeker",x:sx,y:sy,vx:dx/l*(220+i*7),vy:dy/l*(220+i*7),age:-i*.045,alive:true,radius:3,noGravity:true,windFactor:0,skipSkillObjects:true,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,specialDamage:(dmg*.72)/seekers+7,specialRadius:16,customColor:d.color,hitGrace:.03,maxAge:2.5});}if(d.adaptiveDouble)explosionFlat(s,p,x,gy,34,dmg*.36,owner,.10,d.color);}
    else{explosionFlat(s,p,x,gy,38,dmg*.62,owner,.48,d.color);const n=2+(d.adaptiveLevel||1);for(let i=0;i<n;i++){const xx=clamp(x+(i-(n-1)/2)*18,6,s.width-6);modifyTerrainCrater(s,xx,terrainY(s,xx),12,.26);}}
    if((d.adaptiveFinal||0)>0)explosionFlat(s,p,x,gy,44,d.adaptiveFinal*mult,owner,.05,"#fff0a8");s.fx.push({kind:"adaptiveMorph",x,y:gy-10,mode,life:.58,max:.58,color:d.color});return true;
  }
  if(p.weaponId==="helix"){
    p.alive=false;const life=1.10+(d.helixHeight||120)/190;s.fields.push({kind:"helixRise",x,y:gy,life,max:life,strands:d.helixStrands||2,height:d.helixHeight||120,turns:d.helixTurns||1.6,drops:d.helixDrops||4,damage:(d.helixDamage||16)*mult,final:(d.helixFinal||0)*mult,spawned:false,...meta});return true;
  }
  if(p.weaponId==="anchorchain"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-gy)<=(d.anchorRange||115)).sort((a,b)=>Math.hypot(a.x-x,a.y-gy)-Math.hypot(b.x-x,b.y-gy)).slice(0,d.anchorTargets||1);if(!targets.length)return true;
    for(const t of targets)damageTank(s,t,(d.anchorDamage||12)*mult,owner,{crit:!!p.critShot,x2:!!p.x2Active});s.fields.push({kind:"anchorChain",x,y:gy-4,dormant:true,life:9999,max:9999,turnsLeft:d.anchorTurns||2,targetIds:targets.map(t=>t.id),leash:d.anchorLeash||78,breakDamage:(d.anchorBreak||0)*mult,...meta});return true;
  }
  if(p.weaponId==="landslide"){
    p.alive=false;const pulses=d.slidePulses||4,life=.58+pulses*.18;s.fields.push({kind:"landSlide",x,y:gy,life,max:life,span:d.slideSpan||125,pulses,damage:(d.slideDamage||10)*mult,shift:d.slideShift||12,final:(d.slideFinal||0)*mult,index:0,tick:.12,...meta});return true;
  }
  if(p.weaponId==="bubblelift"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-gy)<=(d.bubbleRange||120)).sort((a,b)=>Math.hypot(a.x-x,a.y-gy)-Math.hypot(b.x-x,b.y-gy)).slice(0,d.bubbleTargets||1);if(!targets.length)return true;
    const life=1.55;s.fields.push({kind:"bubbleLift",x,y:gy-20,life,max:life,targetIds:targets.map(t=>t.id),starts:targets.map(t=>({x:t.x,y:t.y})),height:d.bubbleHeight||82,drift:d.bubbleDrift||34,damage:(d.bubbleDamage||20)*mult,final:(d.bubbleFinal||0)*mult,dir:incoming,...meta});return true;
  }
  if(p.weaponId==="bridgebuilder"){
    p.alive=false;const sx=owner?.x??x,incomingSide=Math.sign(x-sx||1),half=(d.bridgeSpan||150)*.5,a=clamp(x-incomingSide*(d.bridgeSpan||150),5,s.width-5),b=clamp(x+incomingSide*half*.16,5,s.width-5);bridgeCauseway(s,a,b,d.bridgeLift||34);const yy=terrainY(s,x);if((d.bridgeDamage||0)>0)explosionFlat(s,p,x,yy,28,(d.bridgeDamage||6)*mult,owner,0,d.color);s.fields.push({kind:"bridgeBuild",x,y:yy,life:.85,max:.85,a,b,supports:d.bridgeSupports||3,ramp:!!d.bridgeRamp,final:(d.bridgeFinal||0)*mult,...meta});return true;
  }
  return false;
}

function resolveV13Impact(s,p,d,x,y,hitTank){
  const owner=ownerOf(s,p),mult=p.damageMult||1,meta=v12FieldMeta(p,d),gy=terrainY(s,x);
  if(p.weaponId==="dicecore"){
    p.alive=false;const interval=d.diceInterval||.38,rolls=d.diceRolls||4,life=rolls*interval+1.05;
    s.fields.push({kind:"diceCore",x,y:gy-34,life,max:life,interval,tick:.16,index:0,rolls,damage:(d.diceDamage||13)*mult,span:d.diceSpan||82,double:!!d.diceDouble,triple:!!d.diceTriple,final:(d.diceFinal||0)*mult,lastFace:1,...meta});return true;
  }
  if(p.weaponId==="sentryseed"){
    p.alive=false;const n=d.sentryCount||1,positions=[];for(let i=0;i<n;i++){const xx=clamp(x+(i-(n-1)/2)*42,12,s.width-12);positions.push({x:xx,y:terrainY(s,xx)-8,flash:0});}
    const life=d.sentryTime||2.2;s.fields.push({kind:"sentryBattery",x,y:gy,life,max:life,turrets:positions,shots:d.sentryShots||5,damage:(d.sentryDamage||13)*mult,range:d.sentryRange||280,tick:.18,index:0,heavy:(d.sentryHeavy||0)*mult,final:(d.sentryFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="billiards"){
    p.alive=false;const n=d.poolBalls||7,span=d.poolSpan||128,balls=[];
    for(let i=0;i<n;i++){const a=(i/(Math.max(1,n-1))-.5)*1.45,spd=(d.poolSpeed||155)*(1+rand(-.10,.10));balls.push({x,y:gy-13,vx:Math.sin(a)*spd+rand(-12,12),vy:-Math.cos(a)*spd*.50-rand(25,70),r:i===n-1&&d.poolEight?7:5,id:i,hit:{}});}
    const life=2.25+(d.poolBounces||2)*.32;s.fields.push({kind:"poolTable",x,y:gy-10,life,max:life,balls,span,damage:(d.poolDamage||15)*mult,bounces:d.poolBounces||2,rails:!!d.poolRails,cue:!!d.poolCue,eight:(d.poolEight||0)*mult,railPulse:(d.poolRailPulse||0)*mult,...meta});return true;
  }
  if(p.weaponId==="launchpad"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.abs(t.x-x)<=(d.launchRange||118)).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)).slice(0,d.launchTargets||1);
    if(!targets.length){s.fx.push({kind:"launchMiss",x,y:gy,life:.45,max:.45,color:d.color});return true;}
    const life=d.launchTime||1.15;s.fields.push({kind:"launchPad",x,y:gy,life,max:life,targetIds:targets.map(t=>t.id),starts:targets.map(t=>t.y),height:d.launchHeight||92,damage:(d.launchDamage||26)*mult,airburst:(d.launchAirburst||0)*mult,hit:false,...meta});return true;
  }
  if(p.weaponId==="chessknight"){
    p.alive=false;const n=d.knightCount||1,span=d.knightSpan||108,paths=[];
    const target=nearestEnemy(s,p.owner,x,gy,span*.75),center=target&&Math.abs(target.x-x)<span*.75?target.x:x;
    for(let k=0;k<n;k++){const pts=[],jumps=d.knightJumps||5;let xx=clamp(center+(k-(n-1)/2)*32,12,s.width-12);for(let j=0;j<jumps;j++){const pattern=[-.72,.46,-.25,.68,0,-.48,.28];let nx=clamp(center+pattern[(j+k*2)%pattern.length]*span*.58+rand(-9,9),12,s.width-12);if(target&&j%3===2)nx=clamp(target.x+rand(-16,16),12,s.width-12);pts.push({x:nx,y:terrainY(s,nx)-10});xx=nx;}paths.push(pts);}
    const life=.55+(d.knightJumps||5)*.25;s.fields.push({kind:"knightField",x:center,y:gy,life,max:life,paths,damage:(d.knightDamage||14)*mult,r:d.radius||27,tick:.18,index:0,rook:(d.knightRook||0)*mult,final:(d.knightFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="cyclone"){
    p.alive=false;const life=d.cycloneTime||1.85;s.fields.push({kind:"cycloneField",x,y:gy-20,life,max:life,count:d.cycloneCount||1,range:d.cycloneRange||82,damage:(d.cycloneDamage||8)*mult,force:d.cycloneForce||13,final:(d.cycloneFinal||0)*mult,tick:.12,hitCycle:0,...meta});return true;
  }
  if(p.weaponId==="rocketcarousel"){
    p.alive=false;const life=d.carouselTime||1.65;s.fields.push({kind:"rocketCarousel",x,y:gy-78,life,max:life,pods:d.carouselPods||6,shots:d.carouselShots||6,damage:(d.carouselDamage||12)*mult,orbit:d.carouselRadius||62,tick:.14,index:0,heavy:d.carouselHeavy||0,final:(d.carouselFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="kaleidoscope"){
    p.alive=false;const shooter=owner||{x:x-150,y:gy},n=d.mirrorCount||2,span=d.prismSpan||105,nodes=[];for(let i=0;i<n;i++){const q=(i+1)/(n+1),xx=shooter.x+(x-shooter.x)*q+Math.sin(i*2.2)*span*.34,yy=Math.min(terrainY(s,xx)-28,gy-62-(i%2)*34);nodes.push({x:clamp(xx,10,s.width-10),y:yy});}
    const target=nearestEnemy(s,p.owner,x,gy,210),end=target?{x:target.x,y:target.y}:{x,y:gy-8};s.fields.push({kind:"prismBank",x,y:gy,life:1.05,max:1.05,nodes,start:{x:shooter.x,y:shooter.y-10},end,damage:(d.beamDamage||34)*mult,dual:!!d.prismDual,returnBeam:!!d.prismReturn,final:(d.prismFinal||0)*mult,applied:false,...meta});return true;
  }
  if(p.weaponId==="proximitymine"){
    p.alive=false;const n=d.mineCount||1;for(let i=0;i<n;i++){const xx=clamp(x+(i-(n-1)/2)*48,10,s.width-10);s.fields.push({kind:"proximityMine",x:xx,y:terrainY(s,xx)-5,life:9999,max:9999,dormant:true,turnsLeft:d.mineTurns||4,sensor:d.mineSensor||62,damage:(d.mineDamage||38)*mult,r:d.radius||42,final:(d.mineFinal||0)*mult,armedDelay:.45,...meta});}return true;
  }
  if(p.weaponId==="cryogel"){
    p.alive=false;s.fields.push({kind:"icePatch",x,y:gy,life:9999,max:9999,dormant:true,turnsLeft:d.iceTurns||3,span:d.iceSpan||110,grip:d.iceGrip||.72,fuel:d.iceFuel||1.22,damage:(d.iceDamage||8)*mult,shards:d.iceShards||0,...meta});explosionFlat(s,p,x,gy,28,(d.iceDamage||8)*mult,owner,.03,d.color);return true;
  }
  if(p.weaponId==="magnetron"){
    p.alive=false;const pulses=d.magnetPulses||3,life=.65+pulses*.29;s.fields.push({kind:"magnetron",x,y:gy-9,life,max:life,pulses,range:d.magnetRange||122,force:d.magnetForce||34,damage:(d.magnetDamage||12)*mult,poles:d.magnetPoles||1,final:(d.magnetFinal||0)*mult,tick:.12,index:0,...meta});return true;
  }
  if(p.weaponId==="emp"){
    p.alive=false;const r=d.radius||36;for(const t of s.tanks){if(!t.alive||!isEnemy(s,owner,t)||Math.hypot(t.x-x,t.y-y)>r+13)continue;damageTank(s,t,(d.empDamage||16)*mult,owner,damageMeta(p));t.overcharge=Math.max(0,t.overcharge-(d.empOvercharge||.35)*100);t.overchargeReady=t.overcharge>=100;t.nextFuelPenalty=Math.max(t.nextFuelPenalty||0,d.empFuel||.25);if(d.empArmor)t.armor=Math.max(0,(t.armor||0)-d.empArmor);}
    s.fx.push({kind:"empBurst",x,y:gy-8,r,life:.55,max:.55,color:d.color});return true;
  }
  if(p.weaponId==="leech"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-y)<=(d.leechRange||130)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,d.leechTargets||1);if(!targets.length)return true;
    const pulses=d.leechPulses||2,life=.45+pulses*.35;s.fields.push({kind:"leechField",x,y:gy,life,max:life,targetIds:targets.map(t=>t.id),pulses,damage:(d.leechDamage||14)*mult,heal:d.leechHeal||.45,armor:!!d.leechArmor,final:(d.leechFinal||0)*mult,tick:.16,index:0,...meta});return true;
  }
  if(p.weaponId==="tetris"){
    p.alive=false;if((d.blockImpact||0)>0)explosionFlat(s,p,x,gy,30,d.blockImpact*mult,owner,0,d.color);const count=d.blockCount||3,life=.75+count*.20;s.fields.push({kind:"tetrisDrop",x,y:gy,life,max:life,count,damage:(d.blockDamage||18)*mult,raise:d.blockRaise||18,span:d.blockSpan||92,bombs:d.blockBombs||0,clear:(d.blockClear||0)*mult,reactor:(d.blockReactor||0)*mult,tick:.10,index:0,...meta});return true;
  }
  if(p.weaponId==="eclipse"){
    p.alive=false;const life=d.eclipseTime||1.8;s.fields.push({kind:"eclipseField",x,y:gy-12,life,max:life,moons:d.eclipseMoons||1,passes:d.eclipsePasses||1,damage:(d.eclipseDamage||16)*mult,width:d.eclipseWidth||34,final:(d.eclipseFinal||0)*mult,hitKeys:{},...meta});return true;
  }
  return false;
}

function resolveV12Impact(s,p,d,x,y,hitTank){
  const owner=ownerOf(s,p),mult=p.damageMult||1,meta=v12FieldMeta(p,d),gy=terrainY(s,x);
  noteTelemetryProximity(s,owner,x,y,d.radius||0);
  if(p.weaponId==="dualroller"){
    p.alive=false;
    explosionFlat(s,p,x,y,d.radius||20,(d.damage||20)*mult,owner,.22,d.color);
    createDualRollerField(s,p,d,x,-1,.96);createDualRollerField(s,p,d,x,1,1.04);
    s.fx.push({kind:"dualSplit",x,y:gy,life:.44,max:.44,color:d.color});return true;
  }
  if(p.weaponId==="pendulum"){
    p.alive=false;s.fields.push({kind:"pendulumField",x,y:gy-11,life:1.05+(d.pendulumPasses||3)*.34,max:1.05+(d.pendulumPasses||3)*.34,orbs:d.pendulumOrbs||1,passes:d.pendulumPasses||3,span:d.pendulumSpan||82,rope:d.pendulumRope||132,hitRadius:d.pendulumHitRadius||24,damage:(d.pendulumDamage||20)*mult,final:(d.pendulumFinal||0)*mult,hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="teslagate"){
    p.alive=false;s.fields.push({kind:"teslaGate",x,y:gy,life:1.10+(d.gatePulses||3)*.22,max:1.10+(d.gatePulses||3)*.22,pylons:d.gatePylons||2,pulses:d.gatePulses||3,span:d.gateSpan||118,beamHeight:d.gateBeamHeight||12,damage:(d.gateDamage||19)*mult,cross:!!d.gateCross,pulseIndex:0,tick:.24,...meta});return true;
  }
  if(p.weaponId==="satellite"){
    p.alive=false;s.fields.push({kind:"satelliteOrbit",x,y:gy-36,life:(d.satelliteOrbit||.95)+1.05,max:(d.satelliteOrbit||.95)+1.05,orbitTime:d.satelliteOrbit||.95,count:d.satelliteCount||3,orbitRadius:d.satelliteRadius||78,damage:(d.satelliteDamage||18)*mult,core:(d.satelliteCore||0)*mult,spawned:false,...meta});return true;
  }
  if(p.weaponId==="wormhole"){
    p.alive=false;const n=d.portalChildren||2,span=d.portalSpan||92;
    s.fx.push({kind:"portalOpen",x1:clamp(x-span,8,s.width-8),y1:terrainY(s,clamp(x-span,8,s.width-8))-62,x2:clamp(x+span,8,s.width-8),y2:terrainY(s,clamp(x+span,8,s.width-8))-62,x,y,life:.72,max:.72,color:d.color});
    for(let i=0;i<n;i++){const fromLeft=i%2===0,sx=clamp(x+(fromLeft?-span:span),8,s.width-8),sy=Math.max(35,terrainY(s,sx)-58-rand(0,42)),tx=clamp(x+(fromLeft?rand(8,34):rand(-34,-8)),8,s.width-8),ty=terrainY(s,tx)-3;spawnStraightSpecial(s,p,p.weaponId,"portalChild",sx,sy,tx,ty,215+rand(-20,28),(d.portalDamage||27),d.radius||22,d.color);}
    if(d.portalCollapse)s.fields.push({kind:"portalCollapse",x,y:gy,life:.72,max:.72,damage:d.portalCollapse*mult,r:52,...meta});return true;
  }
  if(p.weaponId==="prismcage"){
    p.alive=false;s.fields.push({kind:"prismCage",x,y:gy-8,life:1.10+(d.cagePulses||3)*.25,max:1.10+(d.cagePulses||3)*.25,sides:d.cageSides||3,pulses:d.cagePulses||3,span:d.cageSpan||76,height:d.cageHeight||106,damage:(d.cageDamage||20)*mult,final:(d.cageFinal||0)*mult,pulseIndex:0,tick:.28,...meta});return true;
  }
  if(p.weaponId==="domino"){
    p.alive=false;const dl=(d.dominoCount||6)*(d.dominoDelay||.12)+(d.dominoReturn?1.05:.50);s.fields.push({kind:"dominoChain",x,y:gy,life:dl,max:dl,count:d.dominoCount||6,spacing:d.dominoSpacing||22,damage:(d.dominoDamage||15)*mult,r:d.radius||24,delay:d.dominoDelay||.12,tick:.08,index:0,returning:false,return:!!d.dominoReturn,final:(d.dominoFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="skyhook"){
    p.alive=false;const target=nearestEnemy(s,p.owner,x,y,d.hookRange||190);
    if(!target){s.fx.push({kind:"hookMiss",x,y:gy,life:.48,max:.48,color:d.color});return true;}
    s.fields.push({kind:"skyHook",x,y:gy-5,life:d.hookTime||.95,max:d.hookTime||.95,targetId:target.id,startX:target.x,endX:clamp(target.x+Math.sign(x-target.x||1)*Math.min(Math.abs(x-target.x),d.hookDrag||62),12,s.width-12),damage:(d.hookDamage||28)*mult,r:d.radius||24,...meta});return true;
  }
  if(p.weaponId==="sandcastle"){
    p.alive=false;const span=d.castleSpan||92,raise=d.castleRaise||40;modifyTerrainRaise(s,clamp(x-span*.48,8,s.width-8),16,raise);modifyTerrainRaise(s,clamp(x+span*.48,8,s.width-8),16,raise);if(d.castleTower)modifyTerrainRaise(s,x,20,raise*.72);
    s.fields.push({kind:"castleDrop",x,y:terrainY(s,x)-92,life:1.35,max:1.35,drops:d.castleDrops||3,damage:(d.castleDropDamage||14)*mult,r:d.radius||22,span,tick:.10,index:0,cannons:d.castleCannons||0,final:(d.castleFinal||0)*mult,...meta});return true;
  }
  if(p.weaponId==="compressor"){
    p.alive=false;s.fields.push({kind:"compressor",x,y:gy-28,life:d.compressTime||1.15,max:d.compressTime||1.15,span:d.compressSpan||126,cycles:d.compressCycles||1,damage:(d.compressDamage||19)*mult,r:d.radius||24,final:(d.compressFinal||24)*mult,hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="pinball"){
    p.alive=false;const n=d.pinNodes||4,span=d.pinSpan||82,nodes=[],target=nearestEnemy(s,p.owner,x,gy,Math.max(170,span*1.7));
    for(let i=0;i<n;i++){const q=n<=1?.5:i/(n-1),nx=clamp(x+(q-.5)*span*1.5,10,s.width-10),ny=terrainY(s,nx)-(i%2?58:16);nodes.push({x:nx,y:ny});}
    if(target)nodes.splice(Math.min(1,nodes.length),0,{x:target.x,y:target.y,target:true});
    const pl=1.45+(d.pinHops||7)*.115;s.fields.push({kind:"pinballRig",x,y:gy-28,life:pl,max:pl,nodes,hops:d.pinHops||7,damage:(d.pinDamage||18)*mult,final:(d.pinFinal||0)*mult,targetId:target?.id||null,targetEvery:d.pinTargetEvery||2,hop:0,segT:0,from:{x,y:gy-16},to:nodes[0],hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="molecule"){
    p.alive=false;explosionP(s,p,x,y,d.radius||26,(d.damage||28)*mult,owner,.38,d.color);
    const n=d.electronDetach||d.electronCount||2;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.atan2(p.vy,p.vx);spawnMiniProjectile(s,p,{angle:a,speed:150+18*(i%2),weaponId:p.weaponId,kind:"electronShard",damageMult:1,extra:{radius:2.3,noTerrainDamage:true,specialDamage:(d.electronDamage||8)*mult,specialRadius:8,maxAge:1.25,gravityMult:.35,windFactor:.15}});}
    s.fx.push({kind:"moleculeBurst",x,y,life:.48,max:.48,color:d.color,count:n});return true;
  }
  if(p.weaponId==="lighthouse"){
    p.alive=false;s.fields.push({kind:"lighthouse",x,y:gy-8,life:d.beaconTime||1.85,max:d.beaconTime||1.85,beams:d.beaconBeams||1,turns:d.beaconTurns||1.15,range:d.beaconRange||430,beamWidth:d.beaconBeamWidth||15,counter:!!d.beaconCounter,focus:d.beaconFocus||0,solar:!!d.beaconSolar,damage:(d.beaconDamage||19)*mult,final:(d.beaconFinal||0)*mult,hitKeys:{},focusTick:.42,focusIndex:0,...meta});return true;
  }
  if(p.weaponId==="repulsor"){
    p.alive=false;s.fields.push({kind:"repulsor",x,y:gy-7,life:.72+(d.repulsePulses||2)*.28,max:.72+(d.repulsePulses||2)*.28,pulses:d.repulsePulses||2,range:d.repulseRange||120,damage:(d.repulseDamage||16)*mult,force:d.repulseForce||30,final:(d.repulseFinal||0)*mult,pulseIndex:0,tick:.12,hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="swapbomb"){
    p.alive=false;const targets=s.tanks.filter(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-x,t.y-y)<=(d.swapRange||230)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,d.swapTargets||1);
    if(!targets.length){s.fx.push({kind:"swapRift",x1:x,y1:y,x2:x,y2:y,life:.45,max:.45,color:d.color});return true;}
    const chain=[owner,...targets],positions=chain.map(t=>t.x);for(let i=0;i<chain.length;i++){chain[i].x=clamp(positions[(i+1)%positions.length],10,s.width-10);chain[i].y=tankGround(s,chain[i]);}
    targets.forEach(t=>damageTank(s,t,(d.swapDamage||20)*mult,owner,damageMeta(p)));s.fx.push({kind:"swapRift",points:chain.map(t=>({x:t.x,y:t.y})),life:.62,max:.62,color:d.color});return true;
  }
  if(p.weaponId==="phantomcopy"){
    p.alive=false;s.fields.push({kind:"phantomRift",x,y:gy-4,life:(d.phantomDelay||.35)+1.05,max:(d.phantomDelay||.35)+1.05,delay:d.phantomDelay||.35,shots:d.phantomShots||1,damage:(d.phantomDamage||44),r:d.radius||25,top:!!d.phantomTop,localSpan:d.phantomLocalSpan||165,phaseRange:d.phantomPhaseRange||72,final:(d.phantomFinal||0)*mult,spawned:false,...meta});return true;
  }
  if(p.weaponId==="meteorsling"){
    p.alive=false;const shots=d.slingShots||3,span=d.slingSpan||96;for(let i=0;i<shots;i++){const delay=i*.065;for(const side of [-1,1]){const sx=clamp(x+side*span,8,s.width-8),sy=terrainY(s,sx)-5,tx=clamp(x-side*rand(8,32),8,s.width-8),ty=gy-18;const dx=tx-sx,dy=ty-sy,a=Math.atan2(-dy,dx),spd=(d.slingSpeed||175)*(1+rand(-.08,.08));s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"slingRock",x:sx,y:sy,vx:Math.cos(a)*spd,vy:-Math.sin(a)*spd,age:-delay,alive:true,radius:4,gravityMult:.78,windFactor:.25,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,specialDamage:(d.slingDamage||17)*mult,specialRadius:d.radius||20,hitGrace:.04});}}
    if(d.slingHeavy){for(const side of [-1,1]){const sx=clamp(x+side*span*.72,8,s.width-8),sy=terrainY(s,sx)-7,dx=x-sx,dy=(gy-40)-sy,a=Math.atan2(-dy,dx);s.projectiles.push({id:s.nextId++,owner:p.owner,weaponId:p.weaponId,tier:p.tier,kind:"slingHeavy",x:sx,y:sy,vx:Math.cos(a)*(d.slingSpeed||205)*.9,vy:-Math.sin(a)*(d.slingSpeed||205)*.9,age:-.36,alive:true,radius:7,gravityMult:.72,damageMult:1,critShot:!!p.critShot,x2Active:!!p.x2Active,specialDamage:d.slingHeavy*mult,specialRadius:(d.radius||20)+10,hitGrace:.04});}}if(d.slingConverge)s.fields.push({kind:"slingConverge",x,y:gy-22,life:.92,max:.92,damage:d.slingConverge*mult,r:48,done:false,...meta});return true;
  }
  if(p.weaponId==="razorhalo"){
    p.alive=false;s.fields.push({kind:"razorHalo",x,y:gy-22,life:d.haloTime||1.35,max:d.haloTime||1.35,blades:d.haloBlades||8,start:d.haloStart||112,turns:d.haloTurns||1,damage:(d.haloDamage||10)*mult,final:(d.haloFinal||0)*mult,hitKeys:{},...meta});return true;
  }
  if(p.weaponId==="crystalbloom"){
    p.alive=false;s.fields.push({kind:"crystalBloom",x,y:gy,life:1.28,max:1.28,spikes:d.crystalSpikes||3,span:d.crystalSpan||86,damage:(d.crystalDamage||13)*mult,shards:d.crystalShards||2,core:(d.crystalCore||0)*mult,spawned:false,shattered:false,...meta});return true;
  }
  if(p.weaponId==="guillotine"){
    p.alive=false;const n=d.bladeDrops||1,span=d.bladeLength||112,pattern=d.bladePattern||"single";for(let i=0;i<n;i++){const off=(i-(n-1)/2)*span*(pattern==="verdict"?.28:.32),startX=clamp(x+off+(pattern==="scissor"?(i%2?-55:55):0),15,s.width-15),targetX=clamp(x+off,15,s.width-15),startY=Math.max(28,gy-190-i*14);s.fields.push({kind:"guillotine",x:startX,startX,targetX,startY,y:startY,groundY:gy,length:span,life:1.18+i*(d.bladeDelay||.35),max:1.18+i*(d.bladeDelay||.35),delay:i*(d.bladeDelay||.35),damage:(d.bladeDamage||46)*mult,pattern,angle:pattern==="scissor"?(i%2?-.20:.20):pattern==="verdict"?((i%2?1:-1)*.12):0,hitIds:[],...meta});}if(d.bladeSweep)s.fields.push({kind:"guillotineSweep",x,y:gy-12,life:1.45,max:1.45,delay:1.00,length:span*1.08,damage:d.bladeSweep*mult,final:(d.bladeFinal||0)*mult,done:false,...meta});return true;
  }
  if(p.weaponId==="yoyo"){
    p.alive=false;const sx=owner?.x??p.startX??x,sy=owner?.y??gy;s.fields.push({kind:"yoyoField",x,y:gy-9,anchorX:x,anchorY:gy-9,shooterX:sx,shooterY:sy-8,life:d.yoyoTime||1.35,max:d.yoyoTime||1.35,passes:d.yoyoPasses||2,damage:(d.yoyoDamage||18)*mult,selfScale:d.yoyoSelfScale??.5,final:(d.yoyoFinal||0)*mult,hitKeys:{},...meta});return true;
  }
  return false;
}

function onImpact(s,p,x,y,hitTank=null){
  if(!p.alive)return;
  const d=weaponDef(p.weaponId,p.tier),owner=ownerOf(s,p),mult=p.damageMult||1;
  if(!["waterDrop","waterBalloon","sandGrain"].includes(p.kind))s.fx.push({kind:"weaponImpact",weaponId:p.weaponId,tier:p.tier,x,y,life:.40,max:.40,color:d.color});

  // V12 imported and original impact behavior.
  if(p.kind==="waterDrop"){p.alive=false;if(hitTank){const dd=distanceDamage(s,p.startX,x,d.waterMin||2,d.waterMax||8);damageTankP(s,p,hitTank,dd*mult,owner);}s.fx.push({kind:"waterDrop",x,y,life:.18,max:.18,color:d.color});return;}
  if(p.kind==="waterBalloon"){
    if(!hitTank&&(p.balloonBounces||0)>0){p.balloonBounces--;p.x=x;p.y=terrainY(s,x)-6;p.vy=-rand(62,108);p.vx*=rand(.32,.64);p.hitGrace=.06;s.fx.push({kind:"balloonBounce",x,y:p.y,life:.22,max:.22,color:d.color});return;}
    p.alive=false;spawnWaterBurst(s,p,d,x,terrainY(s,x)-6);return;
  }
  if(p.kind==="sandGrain"){p.kind="sandBurrow";p.noGravity=true;p.windFactor=0;p.vx*=.16;p.vy=62+rand(0,28);p.burrowLeft=d.sandBurrowTime||.16;p.hitGrace=999;p.y=Math.max(y,terrainY(s,x)+2);s.fx.push({kind:"sandDive",x,y,life:.16,max:.16,color:d.color});return;}
  if(p.kind==="spreaderMarker"){p.alive=false;spawnSpreader(s,p,d,x);return;}
  if(p.kind==="spreaderDrop"){p.alive=false;if((p.rollDir||0)===0)explosionFlat(s,p,x,y,d.radius||18,(d.dualRollDamage||15)*mult,owner,.18,d.color);else createDualRollerField(s,p,d,x,p.rollDir,p.rollSpeedScale||1);return;}
  if(["portalChild","electronShard","slingRock","slingHeavy","castleStone","crystalShard","satelliteDive","adaptiveSeeker","helixDrop"].includes(p.kind)){p.alive=false;explosionFlat(s,p,x,y,p.specialRadius||10,p.specialDamage||0,owner,p.noTerrainDamage?0:.18,p.customColor||d.color);return;}
  if(p.kind==="phantomShell"){p.alive=false;explosionFlat(s,p,x,y,p.specialRadius||10,p.specialDamage||0,owner,.08,p.customColor||d.color);return;}
  if(resolveV15Impact(s,p,d,x,y,hitTank))return;
  if(resolveV13Impact(s,p,d,x,y,hitTank))return;
  if(resolveV12Impact(s,p,d,x,y,hitTank))return;

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
    p.alive=false;const n=d.vShots||7,mid=(n-1)/2;
    for(let i=0;i<n;i++){const off=i-mid,q=Math.abs(off)/Math.max(1,mid),a=Math.PI*.5+off*(d.vWidth||.028),spd=(d.vSpeed||150)+(mid-Math.abs(off))*(d.vSpeedStep||15);spawnMiniProjectile(s,{...p,x:x+off*1.15,y:y-6},{angle:a,speed:spd,kind:"vShot",extra:{specialDamage:d.damage*mult,specialRadius:d.radius||30,hitGrace:.12,windFactor:1}});}
    s.fx.push({kind:"vLaunch",x,y,life:.52,max:.52,color:d.color,count:n,vertical:true});return;
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
    p.tadHops=(p.tadHops||0)+1;
    if(p.tadHops<=(d.tadHops||2)){const dir=hitTank?(Math.sign(p.vx||1)*rand(.35,1)):rand(-1,1),sp=(d.tadHopSpeed||72)*rand(.78,1.05);p.kind="tadpoleHop";p.x=clamp(x+dir*7,5,s.width-5);p.y=Math.min(y-5,terrainY(s,p.x)-6);p.vx=dir*sp;p.vy=-rand(78,112);p.noGravity=false;p.windFactor=.35;p.hitGrace=.12;s.fx.push({kind:"frogBounce",x,y,life:.25,max:.25,color:d.color});return;}
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
    if(f.kind==="imploderCharge"){
      const owner=fieldOwner(f);if(owner){f.x=owner.x;f.y=owner.y;}
      if(f.life<=0&&!f.done){f.done=true;if(owner?.alive){const self=Math.min(Math.max(0,owner.hp-1),Math.max(0,owner.hp*(f.selfFraction||.45)));if(self>0)damageTank(s,owner,self,owner,{crit:false,x2:false});owner.hp=Math.max(1,owner.hp);const fake={critShot:f.critShot,x2Active:f.x2Active};for(const t of damageOrderForOwner(s,owner)){if(!t.alive||t.id===owner.id)continue;if(Math.hypot(t.x-owner.x,t.y-owner.y)<=f.r+14)damageTank(s,t,f.enemyDamage,owner,damageMeta(fake));}modifyTerrainCrater(s,owner.x,owner.y,f.r,f.terrainScale||.72);s.fx.push({kind:"imploderBlast",x:owner.x,y:owner.y,r:f.r,life:.78,max:.78,color:f.color});s.cameraShake=Math.max(s.cameraShake,13);}}
    }
    else if(f.kind==="dozerField"){
      const owner=fieldOwner(f),elapsed=f.max-f.life,travel=Math.min(f.span,elapsed*f.speed),passLen=f.span/Math.max(1,f.speed),phase=Math.min(f.passes-1,Math.floor(elapsed/Math.max(.01,passLen))),local=(elapsed-phase*passLen)/Math.max(.01,passLen),dir=(f.returnPass&&phase%2? -f.dir:f.dir);f.pass=phase;f.x=clamp(f.startX+dir*Math.min(f.span,local*f.span),6,s.width-6);f.y=terrainY(s,f.x)-8;
      if((f.terrainTick=(f.terrainTick||0)-dt)<=0){f.terrainTick=.075;modifyTerrainRaise(s,clamp(f.x+dir*12,6,s.width-6),13,f.raise);s.fx.push({kind:"dozerDirt",x:f.x+dir*10,y:terrainY(s,f.x+dir*10),life:.22,max:.22,color:f.color});}
      for(const t of s.tanks){if(!t.alive)continue;const key=`${phase}:${t.id}`;if(Math.abs(t.x-f.x)<22&&Math.abs(t.y-f.y)<24){t.x=clamp(t.x+dir*f.push*dt*3.1,10,s.width-10);if(!f.hitKeys[key]){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}
      if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),44,f.final,owner,.18,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="plinkoBoard"){
      const owner=fieldOwner(f),rowH=20,step=f.span/Math.max(7,f.rows+1)*.72;
      for(const b of f.balls){if(b.done)continue;b.seg+=dt*4.7;while(b.seg>=1&&!b.done){b.seg-=1;b.fromX=b.toX;b.fromY=b.toY;b.row++;if(b.row<f.rows){const sign=((b.id*11+b.row*7)%2)?1:-1;b.toX=clamp(b.fromX+sign*step, f.x-f.span*.46,f.x+f.span*.46);b.toY=f.top+34+b.row*rowH;}else{b.toX=clamp(b.fromX+(b.id-(f.balls.length-1)/2)*7,f.x-f.span*.50,f.x+f.span*.50);b.toY=terrainY(s,b.toX)-4;b.finalSegment=true;}}
        const u=clamp(b.seg,0,1);b.x=b.fromX+(b.toX-b.fromX)*u;b.y=b.fromY+(b.toY-b.fromY)*u;if(b.finalSegment&&u>.96&&!b.done){b.done=true;const dd=b.gold&&f.gold>0?f.gold:f.damage;explosion(s,b.toX,terrainY(s,b.toX),24,dd,owner,.10,b.gold?"#ffe66b":f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
      if(f.balls.every(b=>b.done)&&!f.done){f.done=true;if(f.final>0){for(const off of [-f.span*.24,0,f.span*.24])explosion(s,clamp(f.x+off,5,s.width-5),terrainY(s,clamp(f.x+off,5,s.width-5)),26,f.final/3,owner,.03,"#fff0a0",{crit:!!f.critShot,x2:!!f.x2Active});}f.life=Math.min(f.life,.24);}
    }
    else if(f.kind==="aegisDome"){
      const owner=fieldOwner(f);if(owner&&f.charges>0){for(const p of s.projectiles){if(!p.alive||p.aegisCooldown>0)continue;const po=s.tanks.find(t=>t.id===p.owner);if(!po||po.id===owner.id||!isEnemy(s,owner,po))continue;const cy=f.y-5,hit=pointSegmentDistance(f.x,cy,p.x,p.y,p.x+(p.vx||0)*dt,p.y+(p.vy||0)*dt);if(hit.d>f.r||hit.y>f.y+8)continue;f.charges--;const canReflect=f.reflected<(f.reflect||0);if(canReflect){f.reflected++;p.owner=f.owner;p.vx=-(p.vx||0)*.88;p.vy=-Math.abs(p.vy||0)*.72-25;p.x=hit.x;p.y=hit.y;p.aegisCooldown=.18;p.customColor=f.color;s.fx.push({kind:"aegisReflect",x:hit.x,y:hit.y,life:.34,max:.34,color:f.color});}else{p.alive=false;s.fx.push({kind:"aegisAbsorb",x:hit.x,y:hit.y,life:.34,max:.34,color:f.color});}s.cameraShake=Math.max(s.cameraShake,3);if(f.charges<=0)break;}}
      if((f.charges<=0||f.expiring)&&!f.done){f.done=true;f.dormant=false;f.life=.18;if(f.collapse>0)explosion(s,f.x,f.y-8,f.r*.48,f.collapse,owner,0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="gravityLasso"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1),theta=u*f.turns*Math.PI*2;for(let i=0;i<f.targetIds.length;i++){const t=s.tanks.find(q=>q.id===f.targetIds[i]&&q.alive);if(!t)continue;const phase=theta+i*Math.PI,rr=f.orbit*(1-.18*Math.sin(Math.PI*u));t.x=clamp(f.x+Math.cos(phase)*rr,10,s.width-10);t.forcedY=f.y-16-Math.sin(phase)*rr*.48-24*Math.sin(Math.PI*u);f[`tx${i}`]=t.x;f[`ty${i}`]=t.forcedY;if(u>.92&&!f.released){const throwDir=Math.sign(Math.cos(phase)||f.dir||1);t.x=clamp(t.x+throwDir*f.throw,10,s.width-10);t.forcedY=undefined;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}
      if(u>.92&&!f.released){f.released=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),42,f.final,owner,.06,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}if(f.life<=0){for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id);if(t)t.forcedY=undefined;}}
    }
    else if(f.kind==="laserPlow"){
      if(!f.applied){f.applied=true;const owner=fieldOwner(f);for(const r of f.rays){for(const t of s.tanks){if(!t.alive)continue;if(pointSegmentDistance(t.x,t.y,r.ax,r.ay,r.bx,r.by).d<f.width+12)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}const steps=Math.max(5,Math.floor(Math.hypot(r.bx-r.ax,r.by-r.ay)/13));for(let i=0;i<=steps;i++){const q=i/steps,xx=clamp(r.ax+(r.bx-r.ax)*q,5,s.width-5);modifyTerrainCrater(s,xx,terrainY(s,xx),Math.max(8,f.width*.85),f.depth);}}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),40,f.final,fieldOwner(f),.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="conveyorBelt"){
      const owner=fieldOwner(f);f.tick-=dt;for(const t of s.tanks){if(!t.alive||Math.abs(t.x-f.x)>f.span*.5)continue;let dir=f.dir;if(f.mode==="split")dir=Math.sign(f.x-t.x||f.dir);t.x=clamp(t.x+dir*f.speed*dt,10,s.width-10);t.y=tankGround(s,t);
        const contactKey=`belt:${s.round}:${s.current}:${t.id}`;if(f.damage>0&&!f.hitKeys[contactKey]){f.hitKeys[contactKey]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}
        if(f.mode==="split"&&Math.abs(t.x-f.x)<11&&f.centerPulse>0){const key=`crush:${s.round}:${s.current}:${t.id}`;if(!f.hitKeys[key]){f.hitKeys[key]=1;damageTank(s,t,f.centerPulse,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"beltCrush",x:t.x,y:t.y,life:.28,max:.28,color:f.color});}}}if(f.expiring){f.dormant=false;f.life=.05;}
    }
    else if(f.kind==="geoStamp"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.presses){f.tick=.48;const phase=f.fractal&&f.index?1:f.index;stampTerrain(s,f.x,f.span,f.teeth,f.raise,f.cut,phase);const owner=fieldOwner(f);for(const t of s.tanks)if(t.alive&&Math.abs(t.x-f.x)<f.span*.52)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"stampImpact",x:f.x,y:terrainY(s,f.x),span:f.span,teeth:f.teeth,life:.40,max:.40,color:f.color,index:f.index});f.index++;}if(f.index>=f.presses&&f.life<.24&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),44,f.final,fieldOwner(f),.06,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="newtonCradle"){
      f.tick-=dt;f.swing=Math.sin((f.max-f.life)*7.5);if(f.tick<=0&&f.index<f.transfers){f.tick=.58;const owner=fieldOwner(f),targetX=f.balls[f.balls.length-1].x+f.dir*24;explosion(s,targetX,terrainY(s,targetX)-6,24,f.damage,owner,.03,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"cradlePulse",points:f.balls,dir:f.index%2? -f.dir:f.dir,life:.32,max:.32,color:f.color});f.index++;f.dir*=-1;}if(f.index>=f.transfers&&f.life<.24&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),38,f.final,fieldOwner(f),.04,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="helixRise"){
      const u=1-clamp(f.life/f.max,0,1);f.progress=Math.min(1,u*1.45);if(!f.spawned&&u>.58){f.spawned=true;const owner=fieldOwner(f),n=f.drops,mid=(n-1)/2;for(let i=0;i<n;i++){const q=(i-mid)/Math.max(1,mid),sx=f.x+q*46,sy=f.y-f.height+Math.sin(i*1.7)*12,tx=clamp(f.x+q*64,8,s.width-8),ty=terrainY(s,tx)-3,dx=tx-sx,dy=ty-sy,l=Math.max(1,Math.hypot(dx,dy));s.projectiles.push({id:s.nextId++,owner:f.owner,weaponId:f.weaponId,tier:f.tier,kind:"helixDrop",x:sx,y:sy,vx:dx/l*(225+i*2),vy:dy/l*(225+i*2),age:-i*.035,alive:true,radius:3,noGravity:true,windFactor:0,skipSkillObjects:true,damageMult:1,critShot:!!f.critShot,x2Active:!!f.x2Active,specialDamage:f.damage,specialRadius:18,customColor:f.color,hitGrace:.03,maxAge:2.4});}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),42,f.final,fieldOwner(f),.05,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="anchorChain"){
      if(f.expiring&&!f.done){f.done=true;f.dormant=false;f.life=.12;if(f.breakDamage>0){const owner=fieldOwner(f);for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id&&q.alive);if(t)damageTank(s,t,f.breakDamage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"anchorBreak",x:f.x,y:f.y,life:.35,max:.35,color:f.color});}}
    }
    else if(f.kind==="landSlide"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.pulses){f.tick=.18;relaxTerrainStrip(s,f.x,f.span,.28);const owner=fieldOwner(f);for(const t of s.tanks){if(!t.alive||Math.abs(t.x-f.x)>f.span*.52)continue;const slope=terrainSlope(s,t.x);t.x=clamp(t.x+Math.sign(slope||1)*f.shift,10,s.width-10);t.y=tankGround(s,t);damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"landslideDust",x:f.x,y:terrainY(s,f.x),span:f.span,life:.32,max:.32,color:f.color,index:f.index});f.index++;}if(f.index>=f.pulses&&f.life<.22&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),52,f.final,fieldOwner(f),.22,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="bubbleLift"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1),arc=Math.sin(Math.PI*u);for(let i=0;i<f.targetIds.length;i++){const t=s.tanks.find(q=>q.id===f.targetIds[i]&&q.alive);if(!t)continue;const side=f.targetIds.length>1?(i%2?1:-1):f.dir;t.x=clamp(f.starts[i].x+side*f.drift*u,10,s.width-10);t.forcedY=tankGround(s,t)-arc*f.height;f[`tx${i}`]=t.x;f[`ty${i}`]=t.forcedY;}if(u>.91&&!f.popped){f.popped=true;for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id&&q.alive);if(t){t.forcedY=undefined;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"bubblePop",x:t.x,y:t.y-35,life:.38,max:.38,color:f.color});}}if(f.final>0)explosion(s,f.x,terrainY(s,f.x)-25,48,f.final,owner,.02,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}if(f.life<=0){for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id);if(t)t.forcedY=undefined;}}
    }
    else if(f.kind==="bridgeBuild"){
      if(f.life<=.22&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),38,f.final,fieldOwner(f),0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="dualRollerField"){
      if(f.delay>0){f.delay-=dt;continue;}const ox=f.x;f.x=clamp(f.x+f.dir*f.speed*dt,6,s.width-6);f.y=terrainY(s,f.x)-5;const steep=Math.abs(terrainY(s,f.x+f.dir*7)-terrainY(s,f.x-f.dir*7));if(steep>32)f.speed*=.985;for(const t of s.tanks){if(!t.alive)continue;if(Math.hypot(t.x-f.x,t.y-f.y)<16&&!f.hitIds.includes(t.id)){f.hitIds.push(t.id);explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.16,f.color,{crit:!!f.critShot,x2:!!f.x2Active});f.life=0;break;}}if(Math.abs(f.x-ox)<.001)f.life=0;
    }
    else if(f.kind==="pendulumField"){
      const owner=fieldOwner(f),elapsed=f.max-f.life,wave=elapsed/f.max*f.passes*Math.PI*2,anchorY=f.y-f.rope,maxAngle=Math.asin(Math.min(.92,f.span/f.rope));
      for(let i=0;i<f.orbs;i++){const theta=Math.sin(wave+i/f.orbs*Math.PI*2)*maxAngle,px=f.x+Math.sin(theta)*f.rope,py=anchorY+Math.cos(theta)*f.rope,key=`${Math.floor(wave/Math.PI)}:${i}`;f[`orb${i}`]={x:px,y:py};for(const t of s.tanks){if(!t.alive)continue;const hk=key+":"+t.id;if(!f.hitKeys[hk]&&Math.hypot(t.x-px,t.y-py)<(f.hitRadius||24)){f.hitKeys[hk]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}
      f.anchorY=anchorY;if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x)-8,34,f.final,owner,.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="teslaGate"){
      f.tick-=dt;if(f.tick<=0&&f.pulseIndex<f.pulses){f.tick=.22;const owner=fieldOwner(f),pts=[];for(let i=0;i<f.pylons;i++){const q=f.pylons<=1?.5:i/(f.pylons-1),xx=clamp(f.x+(q-.5)*f.span,6,s.width-6);pts.push({x:xx,y:terrainY(s,xx)-(f.beamHeight||12)});}const pulse=f.pulseIndex++;for(let i=0;i<pts.length-1;i++){for(const t of s.tanks){if(!t.alive)continue;const key=`${pulse}:${i}:${t.id}`;if(!f[key]&&pointSegmentDistance(t.x,t.y,pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y).d<18){f[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}if(f.cross&&pts.length>=4){for(const [a,b] of [[0,2],[1,3]])for(const t of s.tanks){if(!t.alive)continue;const key=`c${pulse}:${a}:${t.id}`;if(!f[key]&&pointSegmentDistance(t.x,t.y,pts[a].x,pts[a].y,pts[b].x,pts[b].y).d<18){f[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}s.fx.push({kind:"teslaPulse",points:pts,life:.18,max:.18,color:f.color,cross:f.cross});}
    }else if(f.kind==="satelliteOrbit"){
      const elapsed=f.max-f.life;if(elapsed>=f.orbitTime&&!f.spawned){f.spawned=true;const p={owner:f.owner,weaponId:f.weaponId,tier:f.tier,damageMult:f.damageMult,critShot:f.critShot,x2Active:f.x2Active};for(let i=0;i<f.count;i++){const a=i/f.count*Math.PI*2,ox=f.x+Math.cos(a)*f.orbitRadius,oy=f.y+Math.sin(a)*f.orbitRadius*.45,target=nearestEnemy(s,f.owner,ox,oy),tx=target?.x??f.x,ty=target?.y??terrainY(s,tx);spawnStraightSpecial(s,p,f.weaponId,"satelliteDive",ox,oy,tx,ty,245+i*4,f.damage/f.damageMult,15,f.color);}if(f.core>0)explosion(s,f.x,terrainY(s,f.x),34,f.core,fieldOwner(f),.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});f.life=.82;} 
    }
    else if(f.kind==="portalCollapse"&&f.life<=0&&!f.done){f.done=true;explosion(s,f.x,f.y,f.r,f.damage,fieldOwner(f),.18,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    else if(f.kind==="prismCage"){
      f.tick-=dt;if(f.tick<=0&&f.pulseIndex<f.pulses){f.tick=.25;const owner=fieldOwner(f),pts=[];for(let i=0;i<f.sides;i++){const a=-Math.PI/2+i/f.sides*Math.PI*2,px=f.x+Math.cos(a)*f.span,py=f.y-f.height*.42+Math.sin(a)*f.height*.50;pts.push({x:px,y:py});}const offset=f.pulseIndex%f.sides;for(let e=0;e<f.sides;e++){const a=pts[(e+offset)%f.sides],b=pts[(e+1+offset)%f.sides];for(const t of s.tanks){if(t.alive&&pointSegmentDistance(t.x,t.y,a.x,a.y,b.x,b.y).d<14)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}s.fx.push({kind:"prismPulse",points:pts,life:.23,max:.23,color:f.color,index:f.pulseIndex});f.pulseIndex++;}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x)-14,45,f.final,fieldOwner(f),.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="dominoChain"){
      f.tick-=dt;if(f.tick<=0){f.tick=f.delay;let idx=f.returning?f.count-1-f.index:f.index;if(f.index<f.count){const xx=clamp(f.x+(idx-(f.count-1)/2)*f.spacing,5,s.width-5),yy=terrainY(s,xx);explosion(s,xx,yy,f.r,f.damage*(f.returning?.62:1),fieldOwner(f),.22,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"dominoPop",x:xx,y:yy,life:.24,max:.24,color:f.color});f.index++;}else if(f.return&&!f.returning){f.returning=true;f.index=0;}else{if(f.final>0&&!f.finalDone){f.finalDone=true;explosion(s,f.x,terrainY(s,f.x),38,f.final,fieldOwner(f),.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}f.life=0;}}
    }
    else if(f.kind==="skyHook"){
      const t=s.tanks.find(q=>q.id===f.targetId&&q.alive),u=1-clamp(f.life/f.max,0,1);if(t){t.x=clamp(f.startX+(f.endX-f.startX)*(1-Math.pow(1-u,2)),10,s.width-10);t.y=tankGround(s,t);f.targetX=t.x;f.targetY=t.y;}if(f.life<=0&&!f.done){f.done=true;if(t){damageTank(s,t,f.damage,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});explosion(s,t.x,t.y,f.r,f.damage*.35,fieldOwner(f),.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"hookSlam",x:t.x,y:t.y,life:.40,max:.40,color:f.color});}}
    }
    else if(f.kind==="castleDrop"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.drops){f.tick=.16;const q=f.drops<=1?.5:f.index/(f.drops-1),tx=clamp(f.x+(q-.5)*f.span*.68,8,s.width-8),ty=terrainY(s,tx)-3,sy=Math.max(35,f.y-45-rand(0,35));f.index++;spawnStraightSpecial(s,{owner:f.owner,weaponId:f.weaponId,tier:f.tier,damageMult:f.damageMult,critShot:f.critShot,x2Active:f.x2Active},f.weaponId,"castleStone",tx+rand(-28,28),sy,tx,ty,205,f.damage/f.damageMult,f.r,f.color);}if(f.index>=f.drops&&f.life<.48&&!f.cannonsDone){f.cannonsDone=true;const owner=fieldOwner(f);for(let i=0;i<(f.cannons||0);i++){const target=nearestEnemy(s,f.owner,f.x,terrainY(s,f.x),360);if(target){damageTank(s,target,f.damage*.85,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"castleCannon",x1:f.x+(i%2?1:-1)*f.span*.48,y1:terrainY(s,f.x+(i%2?1:-1)*f.span*.48)-42,x2:target.x,y2:target.y,life:.24,max:.24,color:f.color});}}if(f.final>0)explosion(s,f.x,terrainY(s,f.x),46,f.final,owner,.28,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}if(f.index>=f.drops&&f.life<.20)f.life=0;
    }
    else if(f.kind==="compressor"){
      const owner=fieldOwner(f),elapsed=f.max-f.life,phase=elapsed/f.max*f.cycles,cycle=Math.min(f.cycles-1,Math.floor(phase)),local=phase-cycle,fold=local<.5?local*2:(1-local)*2,left=f.x-f.span*(1-fold),right=f.x+f.span*(1-fold);for(const t of s.tanks){if(!t.alive)continue;for(const [side,wx] of [["L",left],["R",right]]){const key=`${cycle}:${side}:${t.id}`;if(!f.hitKeys[key]&&Math.abs(t.x-wx)<11){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}f.left=left;f.right=right;if(f.life<=0&&!f.done){f.done=true;explosion(s,f.x,terrainY(s,f.x),36,f.final,owner,.10,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="pinballRig"){
      const speed=4.0+f.hops*.055;f.segT+=dt*speed;if(f.segT>=1&&f.hop<f.hops){f.from={...f.to};f.hop++;f.segT=0;const target=f.targetId?s.tanks.find(t=>t.id===f.targetId&&t.alive):null;if(target&&f.hop%(f.targetEvery||2)===0)f.to={x:target.x,y:target.y,target:true};else f.to=f.nodes[(f.hop*2+1)%f.nodes.length];}const u=clamp(f.segT,0,1),px=f.from.x+(f.to.x-f.from.x)*u,py=f.from.y+(f.to.y-f.from.y)*u;f.ballX=px;f.ballY=py;const owner=fieldOwner(f),keyPass=f.hop;for(const t of s.tanks){if(!t.alive)continue;const key=`${keyPass}:${t.id}`;if(!f.hitKeys[key]&&Math.hypot(t.x-px,t.y-py)<22){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"pinballHit",x:px,y:py,life:.20,max:.20,color:f.color});}}if(f.hop>=f.hops&&f.segT>=.98){if(!f.done&&f.final>0)explosion(s,px,py,34,f.final,owner,.05,f.color,{crit:!!f.critShot,x2:!!f.x2Active});f.done=true;f.life=0;}
    }
    else if(f.kind==="lighthouse"){
      const elapsed=f.max-f.life,rot=elapsed/f.max*f.turns*Math.PI*2,owner=fieldOwner(f);f.angle=rot;for(let b=0;b<f.beams;b++){const dir=f.counter&&b%2?-1:1,a=dir*rot+b/f.beams*Math.PI*2,bx=f.x+Math.cos(a)*f.range,by=f.y-32+Math.sin(a)*f.range,rev=Math.floor(elapsed*5);for(const t of s.tanks){if(!t.alive)continue;const key=`${rev}:${b}:${t.id}`;if(!f.hitKeys[key]&&pointSegmentDistance(t.x,t.y,f.x,f.y-32,bx,by).d<(f.beamWidth||15)){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}
      if(f.focus>0&&f.focusIndex<f.focus){f.focusTick-=dt;if(f.focusTick<=0){f.focusTick=Math.max(.30,f.max/(f.focus+2));const target=nearestEnemy(s,f.owner,f.x,f.y,520);if(target){f.focusIndex++;damageTank(s,target,f.damage*.85,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"beaconFocus",x1:f.x,y1:f.y-42,x2:target.x,y2:target.y,life:.32,max:.32,color:f.solar?"#fff2a8":f.color,solar:f.solar});}}}
      if(f.life<=0&&!f.done){f.done=true;if(f.final>0){if(f.solar){const target=nearestEnemy(s,f.owner,f.x,f.y,600),xx=target?.x??f.x;explosion(s,xx,terrainY(s,xx),56,f.final,owner,.06,"#fff0a0",{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"solarColumn",x:xx,y:terrainY(s,xx),life:.55,max:.55,color:"#fff0a0"});}else explosion(s,f.x,f.y,62,f.final,owner,0,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}
    }
    else if(f.kind==="repulsor"){
      f.tick-=dt;if(f.tick<=0&&f.pulseIndex<f.pulses){f.tick=.27;const owner=fieldOwner(f),idx=f.pulseIndex++,rad=f.range*((idx+1)/f.pulses);for(const t of s.tanks){if(!t.alive)continue;const dist=Math.abs(t.x-f.x),key=`${idx}:${t.id}`;if(dist<=rad+14&&!f.hitKeys[key]){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});t.x=clamp(t.x+Math.sign(t.x-f.x||1)*f.force,10,s.width-10);t.y=tankGround(s,t);}}s.fx.push({kind:"repulseRing",x:f.x,y:f.y,r:rad,life:.28,max:.28,color:f.color});}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,f.y,42,f.final,fieldOwner(f),.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="phantomRift"){
      f.delay-=dt;if(f.delay<=0&&!f.spawned){f.spawned=true;const p={owner:f.owner,weaponId:f.weaponId,tier:f.tier,damageMult:f.damageMult,critShot:f.critShot,x2Active:f.x2Active},entries=[],span=f.localSpan||165,left=clamp(f.x-span,18,s.width-18),right=clamp(f.x+span,18,s.width-18),target=nearestEnemy(s,f.owner,f.x,terrainY(s,f.x),220),tx=target?.x??f.x,ty=target?.y??f.y;if(f.shots===1)entries.push({x:f.x<tx?left:right,y:Math.max(35,Math.min(ty-85,terrainY(s,f.x<tx?left:right)-95))});else{entries.push({x:left,y:Math.max(35,Math.min(ty-80,terrainY(s,left)-95))},{x:right,y:Math.max(35,Math.min(ty-80,terrainY(s,right)-95))});if(f.top||f.shots>=3)entries.push({x:tx,y:Math.max(18,ty-180)});}for(const e of entries.slice(0,f.shots)){spawnStraightSpecial(s,p,f.weaponId,"phantomShell",e.x,e.y,tx,ty,320,f.damage,f.r,f.color);const last=s.projectiles[s.projectiles.length-1];last.phantomTargetX=tx;last.phantomPhaseRange=f.phaseRange||72;last.noTerrainDamage=true;}s.fx.push({kind:"phantomRift",x:f.x,y:f.y,life:.45,max:.45,color:f.color,count:f.shots});if(f.final>0)explosion(s,tx,ty,30,f.final,fieldOwner(f),.02,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}if(f.spawned&&f.life<.25)f.life=0;
    }
    else if(f.kind==="razorHalo"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1),rad=f.start*(1-u*.92),rot=u*f.turns*Math.PI*2;f.radius=rad;f.angle=rot;const rev=Math.floor(u*f.turns*6);for(let i=0;i<f.blades;i++){const a=rot+i/f.blades*Math.PI*2,bx=f.x+Math.cos(a)*rad,by=f.y+Math.sin(a)*rad*.58;for(const t of s.tanks){if(!t.alive)continue;const key=`${rev}:${i}:${t.id}`;if(!f.hitKeys[key]&&Math.hypot(t.x-bx,t.y-by)<15){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x)-8,34,f.final,owner,.12,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="crystalBloom"){
      const elapsed=f.max-f.life;if(elapsed>.18&&!f.spawned){f.spawned=true;const owner=fieldOwner(f);for(let i=0;i<f.spikes;i++){const q=f.spikes<=1?.5:i/(f.spikes-1),xx=clamp(f.x+(q-.5)*f.span,7,s.width-7),yy=terrainY(s,xx);explosion(s,xx,yy,16,f.damage,owner,.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"crystalGrow",x:f.x,y:f.y,span:f.span,count:f.spikes,life:.58,max:.58,color:f.color});}
      if(elapsed>.66&&!f.shattered){f.shattered=true;const p={owner:f.owner,weaponId:f.weaponId,tier:f.tier,damageMult:f.damageMult,critShot:f.critShot,x2Active:f.x2Active};for(let i=0;i<f.spikes;i++){const q=f.spikes<=1?.5:i/(f.spikes-1),xx=clamp(f.x+(q-.5)*f.span,7,s.width-7),yy=terrainY(s,xx)-26;for(let j=0;j<f.shards;j++){const a=(j/(Math.max(1,f.shards-1))-.5)*1.15+Math.PI/2;spawnMiniProjectile(s,p,{angle:a,speed:125+rand(-12,15),weaponId:f.weaponId,kind:"crystalShard",damageMult:1,extra:{specialDamage:f.damage*.55,specialRadius:10,radius:2.5,gravityMult:.72,hitGrace:.03}});const last=s.projectiles[s.projectiles.length-1];last.x=xx;last.y=yy;}}if(f.core>0)explosion(s,f.x,terrainY(s,f.x),34,f.core,fieldOwner(f),.16,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"crystalShatter",x:f.x,y:f.y,span:f.span,life:.48,max:.48,color:f.color});}
    }
    else if(f.kind==="guillotine"){
      if(f.delay>0){f.delay-=dt;continue;}const progress=1-clamp(f.life/Math.max(.01,f.max),0,1);f.x=f.startX+(f.targetX-f.startX)*progress;f.y=f.startY+(f.groundY-f.startY)*Math.pow(progress,.72);const owner=fieldOwner(f),cs=Math.cos(f.angle||0),sn=Math.sin(f.angle||0),hx=cs*f.length*.5,hy=sn*f.length*.5;for(const t of s.tanks){if(!t.alive||f.hitIds.includes(t.id))continue;if(pointSegmentDistance(t.x,t.y,f.x-hx,f.y-hy,f.x+hx,f.y+hy).d<15){f.hitIds.push(t.id);damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}if(f.y>=f.groundY-4&&!f.done){f.done=true;const a=Math.max(2,Math.floor(f.x-f.length/2)),b=Math.min(s.terrain.length-2,Math.ceil(f.x+f.length/2));for(let xx=a;xx<=b;xx++)s.terrain[xx]=Math.min(s.height-5,s.terrain[xx]+6);s.fx.push({kind:"guillotineImpact",x:f.x,y:f.groundY,length:f.length,life:.36,max:.36,color:f.color});f.life=0;}
    }
    else if(f.kind==="guillotineSweep"){
      f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const owner=fieldOwner(f),gy=terrainY(s,f.x);for(const t of s.tanks){if(t.alive&&Math.abs(t.x-f.x)<=f.length*.55)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"executionSweep",x:f.x,y:gy,length:f.length,life:.48,max:.48,color:f.color});if(f.final>0)explosion(s,f.x,gy,48,f.final,owner,.18,"#ff5f7d",{crit:!!f.critShot,x2:!!f.x2Active});f.life=0;}
    }
    else if(f.kind==="yoyoField"){
      const u=(1-clamp(f.life/f.max,0,1))*f.passes,pass=Math.min(f.passes-1,Math.floor(u)),local=u-pass,forward=pass%2===0,a=forward?{x:f.anchorX,y:f.anchorY}:{x:f.shooterX,y:f.shooterY},b=forward?{x:f.shooterX,y:f.shooterY}:{x:f.anchorX,y:f.anchorY},px=a.x+(b.x-a.x)*local,py=a.y+(b.y-a.y)*local;f.ballX=px;f.ballY=py;const owner=fieldOwner(f);for(const t of s.tanks){if(!t.alive)continue;const key=`${pass}:${t.id}`;if(!f.hitKeys[key]&&Math.hypot(t.x-px,t.y-py)<16){f.hitKeys[key]=1;damageTank(s,t,f.damage*(owner&&t.id===owner.id?(f.selfScale??.5):1),owner,{crit:!!f.critShot,x2:!!f.x2Active});}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0){s.fx.push({kind:"burst",x:f.anchorX,y:f.anchorY,life:.35,max:.35,color:f.color,r:30});for(const t of s.tanks){if(t.alive&&Math.hypot(t.x-f.anchorX,t.y-f.anchorY)<43)damageTank(s,t,f.final*(owner&&t.id===owner.id?(f.selfScale??.5):1),owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}
    }

    else if(f.kind==="diceCore"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.rolls){f.tick=f.interval;f.index++;const owner=fieldOwner(f),face=rint(1,6);f.lastFace=face;const reps=f.triple&&f.index%3===0?3:f.double&&f.index%2===0?2:1;for(let z=0;z<reps;z++){const xx=clamp(f.x+rand(-f.span*.55,f.span*.55),8,s.width-8),yy=terrainY(s,xx);if(face===1)explosion(s,xx,yy,24,f.damage,owner,.18,f.color,{crit:!!f.critShot,x2:!!f.x2Active});else if(face===2){modifyTerrainCrater(s,xx,yy,28,.45);s.fx.push({kind:"diceCrater",x:xx,y:yy,life:.3,max:.3,color:f.color});}else if(face===3){for(const t of s.tanks)if(t.alive&&isEnemy(s,owner,t)&&Math.abs(t.x-xx)<50)damageTank(s,t,f.damage*.75,owner,{crit:!!f.critShot,x2:!!f.x2Active});}else if(face===4){for(const t of s.tanks)if(t.alive&&Math.abs(t.x-xx)<70){t.x=clamp(t.x+Math.sign(t.x-xx||1)*18,10,s.width-10);}}else if(face===5)explosion(s,xx,yy,38,f.damage*.75,owner,.08,"#ffe47a",{crit:!!f.critShot,x2:!!f.x2Active});else explosion(s,f.x,terrainY(s,f.x),30,f.damage*1.25,owner,.14,"#ff7fdd",{crit:!!f.critShot,x2:!!f.x2Active});}s.fx.push({kind:"diceRoll",x:f.x,y:f.y,face,life:.28,max:.28,color:f.color});}
      if(f.index>=f.rolls&&f.life<.72&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),62,f.final,fieldOwner(f),.42,"#ffd76e",{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="sentryBattery"){
      for(const q of f.turrets)q.flash=Math.max(0,(q.flash||0)-dt);f.tick-=dt;if(f.tick<=0&&f.index<f.shots){f.tick=Math.max(.16,f.max/Math.max(1,f.shots+1));const owner=fieldOwner(f);for(const q of f.turrets){const target=nearestEnemy(s,f.owner,q.x,q.y,f.range);if(target){q.flash=.12;damageTank(s,target,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"sentryBeam",x1:q.x,y1:q.y-12,x2:target.x,y2:target.y,life:.15,max:.15,color:f.color});}}f.index++;}
      if(f.index>=f.shots&&f.life<.5&&!f.done){f.done=true;const owner=fieldOwner(f);if(f.heavy>0){const target=nearestEnemy(s,f.owner,f.x,f.y,f.range);if(target){damageTank(s,target,f.heavy,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"sentryHeavy",x1:f.x,y1:f.y-28,x2:target.x,y2:target.y,life:.30,max:.30,color:"#ffd36e"});}}if(f.final>0)explosion(s,f.x,terrainY(s,f.x),46,f.final,owner,.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="poolTable"){
      const owner=fieldOwner(f),lo=clamp(f.x-f.span*.62,8,s.width-8),hi=clamp(f.x+f.span*.62,8,s.width-8);for(const b of f.balls){b.vy+=s.gravity*.62*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<lo||b.x>hi){b.x=clamp(b.x,lo,hi);b.vx*=-.88;s.fx.push({kind:"poolBank",x:b.x,y:b.y,life:.12,max:.12,color:f.color});}const gy=terrainY(s,b.x)-5;if(b.y>=gy){b.y=gy;b.vy=-Math.abs(b.vy)*.62-18;b.vx*=.94;b.bank=(b.bank||0)+1;}for(const t of s.tanks){if(!t.alive)continue;const key=`${t.id}:${Math.floor((f.max-f.life)*5)}`;if(!b.hit[key]&&Math.hypot(t.x-b.x,t.y-b.y)<16){b.hit[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});b.vx*=-.65;b.vy=-90;s.fx.push({kind:"poolHit",x:b.x,y:b.y,life:.2,max:.2,color:f.color});}}}
      if(f.life<=0&&!f.done){f.done=true;if(f.eight>0)explosion(s,f.x,terrainY(s,f.x),38,f.eight,owner,.12,"#f5f5f0",{crit:!!f.critShot,x2:!!f.x2Active});if(f.railPulse>0){for(const xx of [lo,hi])explosion(s,xx,terrainY(s,xx),24,f.railPulse,owner,.04,"#ff77d9",{crit:!!f.critShot,x2:!!f.x2Active});}}
    }
    else if(f.kind==="launchPad"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1),arc=Math.sin(Math.PI*u);for(let i=0;i<f.targetIds.length;i++){const t=s.tanks.find(q=>q.id===f.targetIds[i]&&q.alive);if(!t)continue;t.forcedY=tankGround(s,t)-arc*f.height;if(u>.93&&!f.hit){t.forcedY=undefined;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});if(f.airburst>0)explosion(s,t.x,t.y-35,34,f.airburst,owner,.02,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}}if(u>.93)f.hit=true;if(f.life<=0){for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id);if(t)t.forcedY=undefined;}}
    }
    else if(f.kind==="knightField"){
      f.tick-=dt;const maxJ=Math.max(...f.paths.map(a=>a.length));if(f.tick<=0&&f.index<maxJ){f.tick=.22;const owner=fieldOwner(f);for(let k=0;k<f.paths.length;k++){const q=f.paths[k][f.index];if(!q)continue;explosion(s,q.x,q.y,f.r,f.damage,owner,.08,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"knightLand",x:q.x,y:q.y,life:.28,max:.28,color:f.color,index:f.index,knight:k});}f.index++;}
      if(f.index>=maxJ&&f.life<.45&&!f.done){f.done=true;const owner=fieldOwner(f);if(f.rook>0){for(const t of s.tanks)if(t.alive&&isEnemy(s,owner,t)&&(Math.abs(t.x-f.x)<22||Math.abs(t.x-f.x)<110&&Math.abs(t.y-terrainY(s,t.x)+11)<20))damageTank(s,t,f.rook,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"rookCross",x:f.x,y:terrainY(s,f.x),life:.35,max:.35,color:f.color});}if(f.final>0)explosion(s,f.x,terrainY(s,f.x),42,f.final,owner,.12,"#f2e9ff",{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="cycloneField"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1);for(let c=0;c<f.count;c++){const dir=c%2?1:-1,cx=clamp(f.x+dir*Math.sin(u*Math.PI*2)*f.range*.55,10,s.width-10),cy=terrainY(s,cx)-26;s.fx.push({kind:"cycloneCore",x:cx,y:cy,life:.10,max:.10,color:f.color});for(const t of s.tanks){if(!t.alive)continue;const dx=cx-t.x,dist=Math.abs(dx);if(dist<f.range){t.x=clamp(t.x+Math.sign(dx)*f.force*dt*(1-dist/f.range),10,s.width-10);const key=Math.floor(u*9)+":"+c+":"+t.id;if(!f[key]&&dist<34){f[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),48,f.final,owner,.10,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="rocketCarousel"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1);f.angle=u*Math.PI*5;f.tick-=dt;if(f.tick<=0&&f.index<f.shots){f.tick=Math.max(.10,f.max/(f.shots+2));const a=f.angle+f.index/f.pods*Math.PI*2,sx=f.x+Math.cos(a)*f.orbit,sy=f.y+Math.sin(a)*f.orbit*.45,target=nearestEnemy(s,f.owner,f.x,terrainY(s,f.x),360);if(target){damageTank(s,target,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"carouselRocket",x1:sx,y1:sy,x2:target.x,y2:target.y,life:.22,max:.22,color:f.color});}f.index++;}
      if(f.index>=f.shots&&f.life<.55&&!f.done){f.done=true;for(let i=0;i<(f.heavy||0);i++){const target=nearestEnemy(s,f.owner,f.x,terrainY(s,f.x),430);if(target){damageTank(s,target,f.damage*1.8,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"carouselHeavy",x1:f.x,y1:f.y,x2:target.x,y2:target.y,life:.30,max:.30,color:"#ffd76e"});}}if(f.final>0)explosion(s,f.x,terrainY(s,f.x),50,f.final,owner,.20,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="prismBank"){
      if(!f.applied){f.applied=true;const owner=fieldOwner(f),pts=[f.start,...f.nodes,f.end];for(let i=0;i<pts.length-1;i++){for(const t of s.tanks){if(!t.alive)continue;if(pointSegmentDistance(t.x,t.y,pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y).d<14)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}if(f.returnBeam){for(let i=pts.length-1;i>0;i--){for(const t of s.tanks){if(!t.alive)continue;if(pointSegmentDistance(t.x,t.y,pts[i].x,pts[i].y,pts[i-1].x,pts[i-1].y).d<10)damageTank(s,t,f.damage*.55,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}if(f.dual){for(const t of s.tanks)if(t.alive&&Math.abs(t.x-f.x)<55)damageTank(s,t,f.damage*.45,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}
      if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),38,f.final,fieldOwner(f),.04,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="proximityMine"){
      f.armedDelay=Math.max(0,(f.armedDelay||0)-dt);if(f.armedDelay<=0){const owner=fieldOwner(f),target=s.tanks.find(t=>isEnemy(s,owner,t)&&Math.hypot(t.x-f.x,t.y-f.y)<=f.sensor);if(target){f.dormant=false;f.life=.01;explosion(s,f.x,terrainY(s,f.x),f.r,f.damage,owner,.45,f.color,{crit:!!f.critShot,x2:!!f.x2Active});if(f.final>0)damageTank(s,target,f.final,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"mineTrigger",x:f.x,y:f.y,life:.42,max:.42,color:f.color});}}
    }
    else if(f.kind==="icePatch"){
      if((f.damage||0)>0){f.tick=(f.tick||0)-dt;if(f.tick<=0){f.tick=.9;const owner=fieldOwner(f);for(const t of s.tanks)if(t.alive&&isEnemy(s,owner,t)&&Math.abs(t.x-f.x)<=f.span*.5)damageTank(s,t,f.damage*.25,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}
    }
    else if(f.kind==="magnetron"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.pulses){f.tick=.28;const owner=fieldOwner(f),pull=f.index%2===0,idx=f.index++;for(const t of s.tanks){if(!t.alive)continue;const dx=f.x-t.x,dist=Math.abs(dx);if(dist<f.range){const dir=Math.sign(dx||1)*(pull?1:-1);t.x=clamp(t.x+dir*f.force*(1-dist/f.range),10,s.width-10);damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}s.fx.push({kind:"magnetPulse",x:f.x,y:f.y,r:f.range,life:.25,max:.25,color:f.color,pull});}if(f.index>=f.pulses&&f.life<.35&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),46,f.final,fieldOwner(f),.10,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="leechField"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.pulses){f.tick=.34;const owner=fieldOwner(f);for(const id of f.targetIds){const t=s.tanks.find(q=>q.id===id&&q.alive);if(!t||!owner?.alive)continue;const before=t.hp+t.armor,applied=damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});const heal=Math.max(0,applied)*f.heal,missing=owner.maxHp-owner.hp,hpGain=Math.min(missing,heal);owner.hp+=hpGain;if(f.armor&&heal>hpGain)owner.armor=Math.min(150,(owner.armor||0)+(heal-hpGain));s.fx.push({kind:"leechBeam",x1:t.x,y1:t.y,x2:owner.x,y2:owner.y,life:.28,max:.28,color:f.color});}f.index++;}if(f.index>=f.pulses&&f.life<.35&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),42,f.final,fieldOwner(f),.06,f.color,{crit:!!f.critShot,x2:!!f.x2Active});}
    }
    else if(f.kind==="tetrisDrop"){
      f.tick-=dt;if(f.tick<=0&&f.index<f.count){f.tick=.18;const q=f.count<=1?.5:f.index/(f.count-1),xx=clamp(f.x+(q-.5)*f.span+rand(-10,10),8,s.width-8),gy=terrainY(s,xx),bomb=f.index>=f.count-f.bombs,owner=fieldOwner(f);f.index++;s.fx.push({kind:"tetrisBlock",x:xx,y:gy-120,targetY:gy,life:.38,max:.38,color:f.color,bomb,shape:f.index%7});explosion(s,xx,gy,18,f.damage,owner,bomb?.18:.03,bomb?"#ff8870":f.color,{crit:!!f.critShot,x2:!!f.x2Active});modifyTerrainRaise(s,xx,12,f.raise);}
      if(f.index>=f.count&&f.life<.5&&!f.cleared){f.cleared=true;if(f.clear>0){const owner=fieldOwner(f);for(const t of s.tanks)if(t.alive&&Math.abs(t.x-f.x)<f.span*.58)damageTank(s,t,f.clear,owner,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"tetrisClear",x:f.x,y:terrainY(s,f.x),span:f.span,life:.42,max:.42,color:"#ffffff"});}if(f.reactor>0)s.fields.push({kind:"tetrisReactor",x:f.x,y:terrainY(s,f.x)-55,life:.72,max:.72,span:f.span,damage:f.reactor,owner:f.owner,critShot:f.critShot,x2Active:f.x2Active,color:"#ffd76e",done:false});}
    }
    else if(f.kind==="tetrisReactor"){
      const u=1-clamp(f.life/f.max,0,1);f.scanX=f.x-f.span*.55+u*f.span*1.1;if(!f.done&&u>.5){f.done=true;const owner=fieldOwner(f);for(const t of s.tanks)if(t.alive&&Math.abs(t.x-f.x)<f.span*.6)damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});modifyTerrainCrater(s,f.x,terrainY(s,f.x),Math.min(60,f.span*.30),.28);}
    }
    else if(f.kind==="eclipseField"){
      const owner=fieldOwner(f),u=1-clamp(f.life/f.max,0,1);for(let m=0;m<f.moons;m++){const dir=m%2?-1:1,phase=(u*f.passes)%1,cx=dir>0?(-60+(s.width+120)*phase):(s.width+60-(s.width+120)*phase);f[`moon${m}`]=cx;for(const t of s.tanks){if(!t.alive)continue;const pass=Math.floor(u*f.passes),key=`${m}:${pass}:${t.id}`;if(!f.hitKeys[key]&&Math.abs(t.x-cx)<f.width*.5){f.hitKeys[key]=1;damageTank(s,t,f.damage,owner,{crit:!!f.critShot,x2:!!f.x2Active});}}}if(f.life<=0&&!f.done){f.done=true;if(f.final>0)explosion(s,f.x,terrainY(s,f.x),56,f.final,owner,.04,"#7588ff",{crit:!!f.critShot,x2:!!f.x2Active});}
    }

    else if(f.kind==="slingConverge"){
      if(f.life<.34&&!f.done){f.done=true;const owner=fieldOwner(f);explosion(s,f.x,terrainY(s,f.x),f.r,f.damage,owner,.20,f.color,{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"slingConverge",x:f.x,y:f.y,life:.44,max:.44,color:f.color});f.life=0;}
    }
    else if(f.kind==="burnTarget"){f.delay-=dt;if(f.delay<=0&&!f.done){f.done=true;const target=s.tanks.find(t=>t.id===f.targetId&&t.alive);if(target){damageTank(s,target,f.damage,fieldOwner(f),{crit:!!f.critShot,x2:!!f.x2Active});s.fx.push({kind:"burnTick",x:target.x,y:target.y,life:.28,max:.28,color:f.color});}}}
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
  const oneShot=["faultPop","burnTarget","lightningStrike","stickyMine","twinkleDrop","twinkleFinal","timeEcho","nukeShock","pinataDrop","fireStormRocks","portalCollapse","imploderCharge","guillotineSweep","slingConverge","tetrisReactor"];
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
  p.edgeWallCooldown=Math.max(0,(p.edgeWallCooldown||0)-dt);p.aegisCooldown=Math.max(0,(p.aegisCooldown||0)-dt);
  p.traceTimer=(p.traceTimer||0)-dt;if(p.traceTimer<=0){p.traceTimer=.055;(p.trace||(p.trace=[])).push({x:p.x,y:p.y});}
  if(!p.skipSkillObjects)handleSkillObjects(s,p);

  // V12 projectile motion that cannot be represented by the ordinary ballistic branch.
  if(p.kind==="sandBurrow"){
    p.burrowLeft-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.burrowLeft<=0){const owner=ownerOf(s,p),gy=terrainY(s,p.x),dd=distanceDamage(s,p.startX,p.x,d.sandMin||1,d.sandMax||3);p.alive=false;explosionFlat(s,p,p.x,gy+6,d.radius||7,dd*(p.damageMult||1),owner,d.sandDepthPower||.34,d.color);s.fx.push({kind:"sandPop",x:p.x,y:gy,life:.24,max:.24,color:d.color});}return;
  }
  if(p.kind==="moleculeCore"){
    const n=d.electronCount||2,owner=ownerOf(s,p),phase=(p.moleculePhase||0)+p.age*6.8;
    for(let i=0;i<n;i++){const ring=d.electronDoubleRing&&i%2?1.35:1,rad=(d.electronOrbit||20)*ring,a=phase+i/n*Math.PI*2,ex=p.x+Math.cos(a)*rad,ey=p.y+Math.sin(a)*rad*.72;s.fx.push({kind:"electronOrbit",x:ex,y:ey,cx:p.x,cy:p.y,life:.09,max:.09,color:d.color});for(const t of s.tanks){if(!isEnemy(s,owner,t))continue;const key=`${i}:${t.id}`;if(!p.electronHits[key]&&Math.hypot(t.x-ex,t.y-ey)<13){p.electronHits[key]=true;damageTankP(s,p,t,(d.electronDamage||8)*(p.damageMult||1),owner);s.fx.push({kind:"electronHit",x:ex,y:ey,life:.22,max:.22,color:d.color});}}}
  }

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
  const prevX=p.x,prevY=p.y;
  if(p.kind!=="deadDrop"){p.vx+=s.wind*(p.windFactor??1)*dt;if(!p.noGravity)p.vy+=s.gravity*(d.gravity||1)*(p.gravityMult||1)*dt;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.weaponId==="sonicboom"){
    p.sonicTick=(p.sonicTick||0)-dt;if(p.sonicTick<=0&&p.age>.12){p.sonicTick=d.sonicInterval||.16;p.sonicHits||(p.sonicHits={});const vx=p.x-prevX,vy=p.y-prevY,l=Math.max(1,Math.hypot(vx,vy)),nx=-vy/l,ny=vx/l,w=d.sonicWidth||30,cx=(prevX+p.x)/2,cy=(prevY+p.y)/2;const owner=ownerOf(s,p);
      const bands=[{scale:1,damage:d.sonicDamage||8,back:0}];if(d.sonicEcho)bands.push({scale:.72,damage:(d.sonicDamage||8)*.55,back:18});
      for(const b of bands){const bx=cx-(vx/l)*b.back,by=cy-(vy/l)*b.back,ax=bx-nx*w*b.scale,bay=by-ny*w*b.scale,bx2=bx+nx*w*b.scale,by2=by+ny*w*b.scale;s.fx.push({kind:"sonicBand",x1:ax,y1:bay,x2:bx2,y2:by2,life:.22,max:.22,color:d.color});for(const t of s.tanks){if(!isEnemy(s,owner,t))continue;const key=t.id,count=p.sonicHits[key]||0;if(count>=(d.sonicMaxHits||2))continue;if(pointSegmentDistance(t.x,t.y,ax,bay,bx2,by2).d<14){p.sonicHits[key]=count+1;damageTankP(s,p,t,b.damage*(p.damageMult||1),owner);}}}
    }
  }
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
    if(p.kind==="phantomShell"&&Number.isFinite(p.phantomTargetX)&&Math.abs(p.x-p.phantomTargetX)>(p.phantomPhaseRange||72)){p.y=terrainY(s,p.x)-3;return;}
    if(p.weaponId==="sniper"&&p.terrainPierce){return;}
    if(p.kind==="scatterFrag"){p.alive=false;explosionP(s,p,p.x,p.y,14,p.fragDamage||12,ownerOf(s,p),.25,"#ffd56d");}
    else onImpact(s,p,p.x,p.y);
  }
}

function settleTanks(s,dt){
  for(const t of s.tanks){
    if(!t.alive)continue;t.x=clamp(t.x,9,s.width-9);
    const target=tankGround(s,t);if(Number.isFinite(t.forcedY))t.y=t.forcedY;else t.y=t.y<target?Math.min(target,t.y+180*dt):target;
    const ice=iceModifiers(s,t.x),slope=terrainSlope(s,t.x),slideAt=Math.min(1.34,Math.max(.72,(t.grip||.8)*ice.grip+.08));if(!t.isDummy&&!Number.isFinite(t.forcedY)&&Math.abs(slope)>slideAt){t.x+=Math.sign(slope)*12*dt;t.y=tankGround(s,t);}
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
export function getTrainingTelemetry(s){return Object.values(s?.telemetry||{}).map(e=>({...e,avgDamage:e.shots?e.totalDamage/e.shots:0,hitRate:e.shots?e.hitShots/e.shots:0,engagedHitRate:e.engagedShots?e.hitShots/e.engagedShots:0,avgEvents:e.shots?e.totalHitEvents/e.shots:0,cleanAvgDamage:e.cleanShots?e.cleanDamage/e.cleanShots:0}));}
export function drainTelemetryEvents(s){if(!s?.telemetryEvents?.length)return [];return s.telemetryEvents.splice(0,s.telemetryEvents.length);}
export function resetTrainingTelemetry(s){if(!s?.training)return false;s.telemetry={};s.telemetryEvents=[];s.telemetryStartedAt=Date.now();return true;}

export function resetTrainingRange(s){
  if(!s?.training)return false;
  s.terrain=createTerrain(s.width,s.height,s.arenaIndex);s.initialTerrain=s.terrain.slice();
  const margin=s.width*.075;
  for(let i=0;i<s.tanks.length;i++){
    const t=s.tanks[i];t.x=margin+(s.width-margin*2)*(i/Math.max(1,s.tanks.length-1));t.y=tankGround(s,t);t.forcedY=undefined;t.nextFuelPenalty=0;t.alive=true;t.knockedOut=false;t.hp=t.maxHp;t.armor=t.trainingArmor||0;t.fuel=t.maxFuel;
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
  // Persistent V13/V14 fields age by completed turns rather than frame time.
  for(const f of s.fields){
    const persistent=["proximityMine","icePatch","aegisDome","conveyorBelt","anchorChain"].includes(f.kind);
    if(!persistent||!f.dormant||f.expiring)continue;
    f.turnsLeft=(f.turnsLeft||1)-1;
    if(f.turnsLeft<=0){
      if(f.kind==="proximityMine"||f.kind==="icePatch"){f.dormant=false;f.life=0;}
      else f.expiring=true;
    }
  }
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
  const t=currentTank(s);if(t){const penalty=clamp(t.nextFuelPenalty||0,0,.9);t.fuel=t.maxFuel*(1-penalty);t.nextFuelPenalty=0;}
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
    if(p.alive&&Math.hypot(p.x-c.x,p.y-c.y)<15){c.alive=false;grantAirdropReward(s,ownerOf(s,p),c.x,c.y);p.hitGrace=Math.max(p.hitGrace||0,.05);break;}
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
  const no=s.projectiles.length===0,transient=s.fires.length>0||s.fields.some(f=>["gravity","voidwell","groundwave","echo","timebomb","faultPop","burnTarget","lightningStrike","stickyMine","snake","viperPath","horizonWave","twinkleDrop","twinkleFinal","timeEcho","gunshipRun","hoverStrike","discoHang","palmTree","nukeShock","zipper","spikerRun","pinataWait","pinataDrop","fireStormRocks","sunburstField","jetRocketBurst","furyTower","imploderCharge","dualRollerField","pendulumField","teslaGate","satelliteOrbit","portalCollapse","prismCage","dominoChain","skyHook","castleDrop","compressor","pinballRig","lighthouse","repulsor","phantomRift","razorHalo","crystalBloom","guillotine","guillotineSweep","yoyoField","diceCore","sentryBattery","poolTable","launchPad","knightField","cycloneField","rocketCarousel","prismBank","magnetron","leechField","tetrisDrop","tetrisReactor","eclipseField","slingConverge","dozerField","plinkoBoard","gravityLasso","laserPlow","geoStamp","newtonCradle","helixRise","landSlide","bubbleLift","bridgeBuild"].includes(f.kind));
  if(s.phase==="shot"&&no&&!transient&&!s.shotInProgress){s.nextTurnDelay-=dt;if(s.nextTurnDelay<=0)advanceTurn(s);}
  else if(s.phase==="shot"&&no&&!transient&&s.shotInProgress)scheduleTurnEnd(s,.8);
}

// ---------- Weapon-aware bot planning ----------
// The old bot treated almost every weapon as if its first terrain contact were the damage point.
// With a large trick-weapon arsenal that produces obviously wrong shots (especially forward vs.
// reverse rollers).  The planner below keeps the expensive work small: weapon/target suitability is
// cheap, then only the chosen family runs the normal ballistic sample search with a family-specific
// scoring profile.
function botLineClear(s,a,b){
  const steps=Math.max(8,Math.ceil(Math.abs(b.x-a.x)/14));
  for(let i=1;i<steps;i++){
    const q=i/steps,x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q;
    if(y>=terrainY(s,x)-3)return false;
  }
  return true;
}
function botTerrainRelief(s,a,b){
  const lo=Math.max(3,Math.min(a,b)),hi=Math.min(s.width-3,Math.max(a,b));if(hi-lo<4)return 0;
  let mn=Infinity,mx=-Infinity,slopes=0,n=0;
  for(let i=0;i<=10;i++){const x=lo+(hi-lo)*i/10,y=terrainY(s,x);mn=Math.min(mn,y);mx=Math.max(mx,y);slopes+=Math.abs(terrainSlope(s,x));n++;}
  return (mx-mn)+slopes/Math.max(1,n)*22;
}
function botClusterCount(s,t,target,r=118){return s.tanks.filter(q=>isEnemy(s,t,q)&&Math.abs(q.x-target.x)<=r).length;}
function botDeformation(s){
  if(!s.initialTerrain?.length)return 0;let sum=0,n=0,step=Math.max(8,Math.floor(s.width/28));
  for(let x=4;x<s.width-4;x+=step){sum+=Math.abs(terrainY(s,x)-s.initialTerrain[x]);n++;}
  return sum/Math.max(1,n);
}
function botWeaponTargetScore(s,t,slot,target){
  const id=slot.id,d=weaponDef(id,slot.tier),dx=Math.abs(target.x-t.x),dist=Math.hypot(target.x-t.x,target.y-t.y);
  const cluster=botClusterCount(s,t,target),relief=botTerrainRelief(s,t.x,target.x),hpFrac=t.hp/Math.max(1,t.maxHp),targetFrac=target.hp/Math.max(1,target.maxHp);
  let score=24+slot.tier*5+Math.min(18,Math.max(0,d.damage||0)*.14)+Math.random()*7+(1-targetFrac)*5;
  if(id==="pulse")score+=7;
  const clusterFamilies=["meteorchoir","skymarker","arcchain","megaflux","acidrain","areastrike","carpetbomb","asteroidbelt","gunship","ringer","sunburst","shrapnel","fury","pinata","napalm","teslagate","prismcage","compressor","razorhalo","crystalbloom","guillotine","tetris","eclipse","plinko","geostamp","helix","landslide"];
  if(clusterFamilies.includes(id))score+=(cluster-1)*8;
  const precision=["pinpoint","sniper","raillance","uzi","bfg1000"];
  if(precision.includes(id))score+=dx>240?13:dx<90?-10:3;
  const lineClear=botLineClear(s,{x:t.x,y:t.y-12},{x:target.x,y:target.y-9});
  if((id==="raillance"||id==="uzi")&&!lineClear)score-=58;
  if(["roller","sawblade","backroller"].includes(id))score+=dx>75&&dx<520?18:-20;
  if(id==="dualroller")score+=dx<470?15:-10;
  if(["groundwave","horizon","zipper","miniv","snowball","breakermadness","bulldozer"].includes(id))score+=dx<430?11:-5;
  if(["burrow","ghostbomb","digger","breaker","spiker","laserplow","landslide"].includes(id))score+=Math.min(18,relief*.16);
  if(["waterballoon","quicksand","satellite","wormhole","lighthouse","phantomcopy","meteorsling","molecule","sentryseed","rocketcarousel","eclipse","plinko","helix"].includes(id))score+=6+(cluster-1)*3;
  if(["skyhook","launchpad","gravitylasso","bubblelift","leech","emp","anchorchain"].includes(id))score+=dx<260?16:-18;
  if(id==="swapbomb")score+=dx<(d.swapRange||230)?30:-45;
  if(id==="repulsor")score+=dx<(d.repulseRange||120)*1.15?22:-16;
  if(id==="imploder")score+=dist<(d.radius||92)+10?92:-190;
  if(id==="rampart"){score+=hpFrac<.48?40:relief>55?10:-25;}
  if(id==="aegisdome"){score+=hpFrac<.55?48:hpFrac<.78?24:2;score+=Math.max(0,aliveEnemies(s,t).length-1)*4;}
  if(id==="bridgebuilder"){score+=relief>58?32:relief>34?16:-18;}
  if(id==="conveyor")score+=dx<210?14:-8;
  if(id==="proximitymine")score+=dx<260?15:-12;
  if(id==="anchorchain")score+=(target.maxFuel||0)>80?9:2;
  if(id==="leech")score+=hpFrac<.62?26:4;
  if(id==="quakecharge")score+=botDeformation(s)>16?24:4;
  if(id==="adaptiveshell")score+=14; // deliberately safe generalist
  if(id==="sonicboom")score+=dx>130?14:2;
  if(id==="newtoncradle")score+=dx>70&&dx<380?14:-6;
  if(id==="geostamp")score+=relief>35?9:0;
  if(id==="batteringram")score+=dx>150?9:0;
  if(id==="fighterjet"||id==="deadweight"||id==="seagull")score+=dx>160?11:-4;
  // Huge explosions at knife range are rarely a clever choice unless the family is intentionally self-centered.
  if((d.radius||0)>65&&dist<(d.radius||0)*.72&&!["imploder","repulsor"].includes(id))score-=18;
  return score;
}
function botPickPlan(s,t){
  const enemies=aliveEnemies(s,t);if(!enemies.length)return null;
  const usable=t.inventory.filter(v=>v.ammo>0);if(!usable.length)return null;
  let best=null;
  for(const slot of usable){
    for(const target of enemies){
      const score=botWeaponTargetScore(s,t,slot,target);
      if(!best||score>best.score)best={slot,target,score};
    }
  }
  return best;
}
function botBestBridgePoint(s,t,target){
  const dir=Math.sign(target.x-t.x||1);let bestX=t.x+dir*Math.min(105,Math.abs(target.x-t.x)*.45),best=-Infinity;
  for(let i=2;i<=8;i++){const q=i/10,x=clamp(t.x+(target.x-t.x)*q,12,s.width-12),rel=botTerrainRelief(s,x-dir*45,x+dir*45);if(rel>best){best=rel;bestX=x;}}
  return bestX;
}
function botAimProfile(s,t,target,id,d){
  const dir=Math.sign(target.x-t.x||1),dx=Math.abs(target.x-t.x);
  let type="landing",desiredX=target.x,desiredY=terrainY(s,target.x),angleBias=0;
  if(id==="raillance"||id==="uzi")return {type:"direct",dir};
  if(id==="imploder"||id==="quakecharge")return {type:"noaim",dir};
  if(id==="rampage")return {type:"direction",dir};
  if(id==="rampart"){desiredX=clamp(t.x+dir*Math.min(92,Math.max(48,dx*.28)),12,s.width-12);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),utility:true};}
  if(id==="aegisdome"){desiredX=clamp(t.x+dir*Math.min(64,Math.max(34,dx*.18)),12,s.width-12);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),utility:true};}
  if(id==="bridgebuilder"){desiredX=botBestBridgePoint(s,t,target);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),utility:true,preferMidArc:true};}
  if(id==="roller"||id==="sawblade"){
    const roll=Math.min(id==="sawblade"?220:205,Math.max(65,(d.rollSpeed||110)*(d.rollTime||3.2)*.38));
    desiredX=clamp(target.x-dir*roll,10,s.width-10);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),roller:"forward",dir};
  }
  if(id==="backroller"){
    const roll=Math.min(155,Math.max(62,(d.rollSpeed||118)*(d.rollTime||3.8)*.28));
    desiredX=clamp(target.x+dir*roll,10,s.width-10);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),roller:"reverse",dir};
  }
  if(id==="groundwave"){
    desiredX=clamp(target.x-dir*Math.min(135,Math.max(55,dx*.32)),10,s.width-10);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),groundRunner:true};
  }
  if(id==="ringer"){
    const rr=d.ringRadius||55;desiredX=clamp(target.x-dir*rr,10,s.width-10);return {type:"ring",desiredX,ringRadius:rr};
  }
  if(id==="yoyo"){
    desiredX=clamp(target.x+dir*Math.min(58,Math.max(30,dx*.12)),10,s.width-10);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX),tether:true};
  }
  if(id==="proximitymine"){desiredX=clamp(target.x-dir*24,10,s.width-10);return {type:"landing",desiredX,desiredY:terrainY(s,desiredX)};}
  if(id==="deadweight"||id==="seagull")return {type:"overhead",desiredX:target.x,overshoot:id==="seagull"?70:0};
  if(id==="fighterjet")return {type:"apex",desiredX:target.x};
  if(id==="batteringram")return {type:"landing",desiredX:target.x,desiredY:terrainY(s,target.x),ram:true};
  if(id==="laserplow"){angleBias=.55;return {type:"landing",desiredX:target.x,desiredY:terrainY(s,target.x),angleBias};}
  if(id==="sonicboom")return {type:"path",desiredX:target.x,desiredY:target.y};
  // Marker, deployable, homing and area families generally want the marker itself on/near the target.
  return {type,desiredX,desiredY,dir};
}
function simulateAimFlight(s,t,id,tier,angle,power,target){
  const d=weaponDef(id,tier),speed=launchSpeedFromPower(power)*(id==="bfg1000"?(d.speedMult||.76):1);
  let x=t.x+Math.cos(angle)*18,y=t.y-8-Math.sin(angle)*18,vx=Math.cos(angle)*speed,vy=-Math.sin(angle)*speed;
  const dt=.035,windFactor=id==="bfg1000"?(d.windFactor||2):1;
  let apex={x,y},closestOverhead=Infinity,pathClosest=Infinity,returned=false,returned2=false,ramApex=false,time=0,wallBounces=0,groundBounces=0;
  for(let i=0;i<300;i++){
    time+=dt;
    if(id==="boomerang"&&time>(d.returnTime||.8)&&!returned){returned=true;const cap=d.returnSpeedCap||145;vx=-Math.sign(vx||1)*Math.min(cap,Math.max(90,Math.abs(vx)*(d.returnForce||1.18)));vy-=55;}
    else if(id==="boomerang"&&d.doubleReturn&&returned&&!returned2&&time>(d.returnTime||.8)+.85){returned2=true;vx*=-.88;vy-=40;}
    if(id==="batteringram"&&!ramApex&&vy>=0)ramApex=true;
    vx+=s.wind*windFactor*dt;vy+=s.gravity*(d.gravity||1)*(ramApex?(d.ramApexGravity||4.9):1)*dt;
    x+=vx*dt;y+=vy*dt;
    if(y<apex.y)apex={x,y};
    if(target){
      pathClosest=Math.min(pathClosest,Math.hypot(x-target.x,y-target.y));
      if(y<target.y-20)closestOverhead=Math.min(closestOverhead,Math.abs(x-target.x));
    }
    if(x<0||x>=s.width){
      const side=x<0?-1:1,edgeX=side<0?0:s.width-1,ground=terrainY(s,edgeX),top=ground-(s.edgeWallHeight||s.height*.20);
      if(y>=top&&y<=ground+10){x=side<0?4:s.width-4;vx=-vx*.92;wallBounces++;}else return {x:clamp(x,0,s.width),y:s.height,apex,closestOverhead,pathClosest,escaped:true,vx,wallBounces};
    }
    if(y>s.height)return {x:clamp(x,0,s.width),y:s.height,apex,closestOverhead,pathClosest,escaped:true,vx,wallBounces};
    if(y>=terrainY(s,x)){
      if(id==="hyperbounce"&&groundBounces<(d.bounces||0)){groundBounces++;y=terrainY(s,x)-6;vy=-Math.abs(vy)*(d.bouncePower||.7)-35;vx*=.92;continue;}
      if(id==="ricochet"&&groundBounces<(d.bounces||0)){groundBounces++;y=terrainY(s,x)-7;vy=-Math.abs(vy)*(d.bouncePower||.62)-30;vx*=.80;if(d.maxHorizontalSpeed)vx=clamp(vx,-d.maxHorizontalSpeed,d.maxHorizontalSpeed);continue;}
      if(id==="clustergrenade"&&!d.grenadeStorm&&groundBounces<(d.bounces||0)){groundBounces++;y=terrainY(s,x)-6;vy=-Math.abs(vy)*.43-22;vx*=.68;continue;}
      return {x,y,apex,closestOverhead,pathClosest,escaped:false,vx,wallBounces,groundBounces};
    }
  }
  return{x,y,apex,closestOverhead,pathClosest,escaped:true,vx,wallBounces,groundBounces};
}
function botCandidateScore(profile,flight,target,angle){
  if(profile.type==="overhead"){
    let score=flight.closestOverhead*2.25;
    if(profile.overshoot){const dir=Math.sign(target.x-(profile.shooterX||0)||1),passed=(flight.x-target.x)*dir;score+=passed<profile.overshoot*.25?45:Math.abs(passed-profile.overshoot)*.18;}
    return score+(flight.escaped?18:0);
  }
  if(profile.type==="apex")return Math.abs(flight.apex.x-target.x)*1.8+Math.abs(flight.apex.y-(target.y-95))*.12+(flight.escaped?20:0);
  if(profile.type==="path")return flight.pathClosest*1.8+Math.abs(flight.x-(profile.desiredX??target.x))*.20+(flight.escaped?22:0);
  if(profile.type==="ring"){
    const radius=Math.abs(flight.x-target.x);return Math.abs(radius-profile.ringRadius)*2+Math.abs(flight.y-terrainYDummy(target,flight))*0;
  }
  let score=Math.abs(flight.x-profile.desiredX)+Math.abs(flight.y-(profile.desiredY??target.y))*.12;
  if(profile.roller){
    if((flight.wallBounces||0)>0)score+=320*(flight.wallBounces||1);
    if(Math.sign(flight.vx||profile.dir)!==Math.sign(profile.dir||1))score+=260;
  }
  if(profile.angleBias)score+=Math.abs(Math.sin(angle)-profile.angleBias)*32;
  if(flight.escaped)score+=70;
  return score;
}
function terrainYDummy(target,flight){return target?.y??flight.y;} // keeps ring scoring explicit/readable
function botReposition(s,t,target,weaponId=null){
  if(t.fuel<=5||["imploder","rampart","aegisdome","bridgebuilder"].includes(weaponId))return;
  const slope=Math.abs(terrainSlope(s,t.x)),dist=Math.abs(target.x-t.x);
  if(slope<.28&&dist>260&&Math.random()>.32)return;
  const preferred=target.x>t.x?-1:1;
  const tries=[preferred,-preferred];
  for(const dir of tries){
    let moved=0;
    for(let i=0;i<12;i++){if(moveTank(s,t,dir,4)){moved+=4;}else break;}
    if(moved>8)return;
  }
}
function botDirectAngle(t,target){return clamp(Math.atan2(t.y-target.y,target.x-t.x),.02,Math.PI-.02);}
export function performBotShot(s,t){
  const plan=botPickPlan(s,t);if(!plan)return;
  const {slot,target}=plan,weaponId=slot.id,tier=slot.tier;
  selectWeapon(s,t,weaponId,tier);
  botReposition(s,t,target,weaponId);
  const d=weaponDef(weaponId,tier),profile=botAimProfile(s,t,target,weaponId,d);
  if(profile.type==="noaim"){
    const dir=target.x>=t.x?1:-1,ang=dir>0?.58:Math.PI-.58;t.angle=ang;t.power=58;fire(s,t,ang,58,weaponId,tier);return;
  }
  if(profile.type==="direct"){
    let ang=botDirectAngle(t,target);
    // Straight weapons cannot bend around hills; a tiny difficulty error still keeps Easy human.
    ang+=rand(-s.diff.aimError*.45,s.diff.aimError*.45);t.angle=ang;t.power=100;fire(s,t,ang,100,weaponId,tier);return;
  }
  if(profile.type==="direction"){
    const dir=target.x>=t.x?1:-1,ang=dir>0?.12:Math.PI-.12;t.angle=ang;t.power=65;fire(s,t,ang,65,weaponId,tier);return;
  }
  profile.shooterX=t.x;
  let best={score:Infinity,angle:Math.PI*.5,power:60},dir=(profile.desiredX??target.x)>=t.x?1:-1;
  const samples=Math.max(55,s.diff.aiSamples||120);
  for(let i=0;i<samples;i++){
    let angle=dir>0?rand(.16,Math.PI*.49):rand(Math.PI*.51,Math.PI-.16);
    // Low-angle candidates matter for terrain cutters and runners, but still sample the full arc space.
    if(profile.angleBias&&i<samples*.35)angle=dir>0?rand(.28,.75):Math.PI-rand(.28,.75);
    const power=rand(25,100),flight=simulateAimFlight(s,t,weaponId,tier,angle,power,target),score=botCandidateScore(profile,flight,target,angle);
    if(score<best.score)best={score,angle,power,flight};
  }
  const utility=!!profile.utility,precisionScale=utility?.45:profile.roller?.25:profile.groundRunner?.65:1;
  best.angle=clamp(best.angle+rand(-s.diff.aimError*precisionScale,s.diff.aimError*precisionScale),.04,Math.PI-.04);
  best.power=clamp(best.power+rand(-s.diff.powerError*precisionScale,s.diff.powerError*precisionScale),10,100);
  t.angle=best.angle;t.power=best.power;fire(s,t,best.angle,best.power,weaponId,tier);
}

