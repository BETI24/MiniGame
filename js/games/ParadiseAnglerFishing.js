import {SPOTS,FISH} from "./ParadiseAnglerData.js";
import {clamp,rand,getCombatStats,getLureInfo,consumeCastItems,recordCatch,failCatch} from "./ParadiseAnglerEngine.js";

export function createFishingSession(state,{practice=false}={}){
  const spot=SPOTS.find(x=>x.id===state.selectedSpot);if(!spot)return null;
  const boostSnapshot={...state.activeBoosters};
  const combat=getCombatStats(state),lure=getLureInfo(state);
  if(!practice&&!consumeCastItems(state))return null;
  return {
    practice,spotId:spot.id,phase:"cast",time:0,castMarker:0,castDir:1,castGrade:null,
    fishId:null,fish:null,weight:0,fishHp:0,maxFishHp:0,distance:0,startDistance:0,tension:18,
    power:0,fever:0,feverTime:0,reeling:false,escapeLow:0,overTension:0,
    fishMode:"calm",modeTimer:0,jump:null,jumpTimer:0,consecutive:0,damageEvents:[],
    message:"Time the cast!",messageTimer:1.5,combat,lure,line:combat.line,
    result:null,failed:false,failReason:null,goldBoost:boostSnapshot.gold,xpBoost:boostSnapshot.xp,bigBoost:boostSnapshot.big,
    screenShake:0,splashes:[]
  };
}
export function pressMain(session,state){if(!session)return;if(session.phase==="cast")finishCast(session);else if(session.phase==="bite")hookStrike(session);}
export function setReeling(session,on){if(session?.phase==="fight")session.reeling=!!on;}
export function usePower(session){
  if(!session||session.phase!=="fight"||session.power<99)return false;
  const dmg=session.combat.damage*2.8*(session.feverTime>0?1.25:1)*(session.fish?.boss?session.combat.bossDamage:1);
  doDamage(session,dmg,"POWER",false);session.distance=Math.max(0,session.distance-session.combat.lineLength*.075);session.power=0;session.tension=Math.max(20,session.tension-24);session.message="POWER PULL!";session.messageTimer=.8;session.screenShake=8;return true;
}
export function useFever(session){if(!session||session.phase!=="fight"||session.fever<99||session.feverTime>0)return false;session.fever=0;session.feverTime=8;session.message="FEVER MODE!";session.messageTimer=1;return true;}
export function yank(session,dir){
  if(!session||session.phase!=="fight"||!session.jump||session.jumpTimer<=0)return false;
  if(dir===session.jump){
    const dmg=session.combat.damage*1.15*(session.fish?.boss?session.combat.bossDamage:1);doDamage(session,dmg,"YANK",false);session.distance=Math.max(0,session.distance-session.combat.lineLength*.035);session.power=clamp(session.power+18,0,100);session.fever=clamp(session.fever+14,0,100);session.message="PERFECT YANK!";session.screenShake=4;
  }else{session.tension=clamp(session.tension+14,0,130);session.message="MISSED YANK";}
  session.messageTimer=.6;session.jump=null;session.jumpTimer=0;return true;
}
function finishCast(s){const center=Math.abs(s.castMarker-.5);s.castGrade=center<.055?"PERFECT":center<.14?"GREAT":center<.28?"GOOD":"OK";s.message=`${s.castGrade} CAST`;s.messageTimer=.8;s.phase="waiting";s.time=0;}
function hookStrike(s){s.phase="fight";s.time=0;s.message="FISH ON!";s.messageTimer=.8;}
function chooseFish(s){
  const spot=SPOTS.find(x=>x.id===s.spotId),combat=s.combat,lure=s.lure;
  const weights=spot.fish.map(id=>{const f=FISH[id];let w=[62,28,12,5.5,1.5][f.stars-1]||1;if(f.boss)w*=.42;w*=1+Math.max(0,f.stars-2)*(lure.rare+combat.rareFish)*4.5;return w;});
  let total=weights.reduce((a,b)=>a+b,0),r=Math.random()*total,id=spot.fish[0];for(let i=0;i<spot.fish.length;i++){r-=weights[i];if(r<=0){id=spot.fish[i];break;}}
  const f=FISH[id],castBig=s.castGrade==="PERFECT"?.15:s.castGrade==="GREAT"?.10:0,bigChance=clamp(.12+castBig+lure.big+combat.bigFish+(s.bigBoost?.20:0),0,.85);
  let weight=rand(f.weight[0],f.weight[1]);if(Math.random()<bigChance)weight*=rand(1.08,1.34);if(f.boss&&Math.random()<.15)weight*=rand(1.08,1.22);
  s.fishId=id;s.fish=f;s.weight=weight;s.maxFishHp=f.hp*spot.difficulty*(.86+weight/Math.max(.1,f.weight[1])*.36);s.fishHp=s.maxFishHp;
  s.startDistance=Math.min(s.combat.lineLength*.60,70+spot.difficulty*18+f.pull*18);s.distance=s.startDistance;s.fishMode="struggle";s.modeTimer=rand(1.2,2.4);s.tension=24;
}
function doDamage(s,amount,label,allowCrit=true){
  let crit=false,dmg=amount*(s.feverTime>0?1.55:1);if(allowCrit&&Math.random()<s.combat.critRate){crit=true;dmg*=s.combat.critDamage;s.fever=clamp(s.fever+8,0,100);}
  s.fishHp=Math.max(0,s.fishHp-dmg);s.damageEvents.push({damage:dmg,crit,label,time:s.time});s.splashes.push({x:rand(.55,.72),y:rand(.45,.62),life:.45,crit});return {dmg,crit};
}
function newMode(s){
  if(s.fishHp<=0){s.fishMode="exhausted";s.modeTimer=999;return;}
  const roll=Math.random();s.fishMode=roll<.42?"struggle":roll<.72?"green":roll<.88?"calm":"burst";s.modeTimer=s.fishMode==="burst"?rand(.65,1.15):rand(1.4,2.8);
  if(Math.random()<.28&&s.jumpTimer<=0){s.jump=Math.random()<.5?"left":"right";s.jumpTimer=1.15;}
}
function fail(s,state,reason){if(s.failed||s.result)return;s.failed=true;s.failReason=reason;s.phase="result";s.message=reason;if(!s.practice)failCatch(state);}
function catchFish(s,state){
  if(s.result||s.failed)return;s.phase="result";const base={fishId:s.fishId,spotId:s.spotId,weight:s.weight,castGrade:s.castGrade,goldBoost:s.goldBoost,xpBoost:s.xpBoost,practice:s.practice};
  s.result=s.practice?{...base,reward:{gold:0,xp:0,grade:"PRACTICE",extras:[],levels:0}}:{...base,reward:recordCatch(state,base)};s.message="CAUGHT!";s.screenShake=7;
}
function randConst(obj,key,a,b){const k="_"+key;if(obj[k]==null)obj[k]=rand(a,b);return obj[k];}
export function updateFishing(s,state,dt){
  if(!s)return;s.time+=dt;s.messageTimer=Math.max(0,s.messageTimer-dt);s.screenShake=Math.max(0,s.screenShake-dt*20);s.splashes.forEach(x=>x.life-=dt);s.splashes=s.splashes.filter(x=>x.life>0);
  if(s.phase==="cast"){s.castMarker+=s.castDir*dt*.72;if(s.castMarker>=1){s.castMarker=1;s.castDir=-1;}if(s.castMarker<=0){s.castMarker=0;s.castDir=1;}return;}
  if(s.phase==="waiting"){if(s.time>randConst(s,"wait",1.15,2.25)){chooseFish(s);s.phase="bite";s.time=0;s.message="STRIKE!";s.messageTimer=1.2;}return;}
  if(s.phase==="bite"){if(s.time>1.35)fail(s,state,"MISSED THE BITE");return;}
  if(s.phase!=="fight")return;
  if(s.jumpTimer>0){s.jumpTimer-=dt;if(s.jumpTimer<=0)s.jump=null;}if(s.feverTime>0)s.feverTime=Math.max(0,s.feverTime-dt);s.modeTimer-=dt;if(s.modeTimer<=0)newMode(s);
  const lineMax=s.combat.tension,pressure=s.fish.pull*(SPOTS.find(x=>x.id===s.spotId)?.difficulty||1),modePull=s.fishMode==="struggle"?1.25:s.fishMode==="burst"?1.7:s.fishMode==="green"?.62:s.fishMode==="exhausted"?.18:.82;
  if(s.reeling){
    s.tension+=(24+pressure*5.5*modePull)*dt*(s.feverTime>0?.72:1);
    const safe=s.tension<lineMax*.96;if(safe||s.feverTime>0){
      const reelFactor=s.fishMode==="green"?1.24:s.fishMode==="exhausted"?1.7:s.fishMode==="burst"?.62:1,dmg=s.combat.damage*.20*reelFactor*dt*6;
      doDamage(s,dmg,"REEL",true);s.distance=Math.max(0,s.distance-(8.5+Math.sqrt(s.combat.damage)*.16)*reelFactor*dt);s.consecutive+=dt*4;
      s.power=clamp(s.power+((s.fishMode==="green"?8:3.8)+(s.tension>lineMax*.78?10:0))*dt,0,100);s.fever=clamp(s.fever+(s.fishMode==="green"?2.4:.7)*dt,0,100);
    }
  }else{s.tension-=38*dt;s.consecutive=Math.max(0,s.consecutive-dt*4);}
  if(s.fishMode!=="exhausted")s.distance+=pressure*modePull*dt*(s.reeling?.46:1.05);
  s.tension=clamp(s.tension,0,lineMax*1.28);
  if(s.tension>lineMax){s.overTension+=dt*(1+(s.tension-lineMax)/lineMax*3);if(s.overTension>.55)fail(s,state,"LINE BROKE!");}else s.overTension=Math.max(0,s.overTension-dt*1.7);
  if(s.tension<lineMax*.055){s.escapeLow+=dt;if(s.escapeLow>1.8&&s.fishMode!=="exhausted")fail(s,state,"FISH THREW THE HOOK!");}else s.escapeLow=Math.max(0,s.escapeLow-dt*1.8);
  if(s.distance>=s.combat.lineLength*.985)fail(s,state,"OUT OF LINE!");if(s.fishHp<=0)s.fishMode="exhausted";if(s.fishMode==="exhausted"&&s.distance<=2)catchFish(s,state);
}
