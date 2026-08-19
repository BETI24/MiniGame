import {RESOURCES,LOCATIONS,CHAMBERS,UPGRADES,MILESTONES,PRESTIGE} from "./AntColonyData.js";
export const SAVE_KEY="ant-colony-idle-v1";
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);

export function fmt(n){
  if(!Number.isFinite(n))return "∞";
  const a=Math.abs(n); if(a<1000)return a<10?n.toFixed(2).replace(/0+$/," ").trim().replace(/\.$/,""):Math.floor(n).toString();
  const u=["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];let v=a,i=-1;
  while(v>=1000&&i<u.length-1){v/=1000;i++;}
  return (n<0?"-":"")+v.toFixed(v>=100?0:v>=10?1:2).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1")+u[i];
}
const zeroRes=()=>({food:0,leaves:0,resin:0,protein:0});
function fresh(){
  return {
    version:1,res:{food:55,leaves:0,resin:0,protein:0},workers:6,soldiers:0,nurses:0,larvae:2,popCap:20,totalBorn:8,totalTrips:0,totalRaids:0,genes:0,
    chamber:Object.fromEntries(CHAMBERS.map(c=>[c.id,0])),upgrades:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),
    prestige:{},locations:{},boosts:{},milestones:{},stats:{raidsWon:0,raidsLost:0,events:0,biggestPop:8},prestigeCount:0,lastSave:Date.now(),
    birthTimer:5,eventTimer:18,raidTimer:35,event:null,raid:null,agents:[],floats:[],particles:[],selectedLocation:null
  };
}
export function loadState(){
  const f=fresh();
  try{
    const p=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(!p)return f;
    return {...f,...p,res:{...f.res,...(p.res||{})},chamber:{...f.chamber,...(p.chamber||{})},upgrades:{...f.upgrades,...(p.upgrades||{})},
      prestige:{...(p.prestige||{})},locations:{...(p.locations||{})},boosts:{...(p.boosts||{})},milestones:{...(p.milestones||{})},stats:{...f.stats,...(p.stats||{})},
      agents:[],floats:[],particles:[],event:null,raid:null};
  }catch{return f;}
}
export function saveState(s){
  s.lastSave=Date.now();
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({...s,agents:[],floats:[],particles:[],event:null,raid:null}));}catch{}
}
export function population(s){return s.workers+s.soldiers+s.nurses+s.larvae;}
function pval(s,effect){const p=PRESTIGE.find(x=>x.effect===effect);return p?p.value*(s.prestige[p.id]||0):0;}
function chamberEffect(s,effect){let v=0;for(const c of CHAMBERS){const lv=s.chamber[c.id]||0;if(lv&&c.effects[effect]!=null)v+=c.effects[effect]*lv;}return v;}
function upgradeValue(s,stat){const u=UPGRADES.find(x=>x.stat===stat);if(!u)return 1;return u.base+u.growth*(s.upgrades[u.id]||0);}
function milestoneMult(s){
  const p=population(s);let prod=1,birth=1,speed=1,extraBirth=0;
  if(p>=25)prod*=1.08;if(p>=100)birth*=1.15;if(p>=200)speed*=1.15;if(p>=350)prod*=1.20;if(p>=600)extraBirth=1;if(p>=1000)prod*=1.35;
  return {prod,birth,speed,extraBirth};
}
export function mods(s){
  const ms=milestoneMult(s),all=(1+pval(s,"all"))*ms.prod;
  return {
    gather:upgradeValue(s,"gatherPower")*upgradeValue(s,"allGather")*(1+chamberEffect(s,"gather"))*(1+pval(s,"gather"))*all,
    carry:upgradeValue(s,"carry")*(1+chamberEffect(s,"carry"))*all,
    speed:upgradeValue(s,"speed")*upgradeValue(s,"route")*(1/(1-Math.min(.65,chamberEffect(s,"travel"))))*ms.speed,
    birth:upgradeValue(s,"birth")*upgradeValue(s,"nursery")*(1+chamberEffect(s,"birthRate"))*(1+pval(s,"birth"))*ms.birth,
    soldier:upgradeValue(s,"soldier")*upgradeValue(s,"raid")*(1+chamberEffect(s,"soldier"))*(1+pval(s,"raid")),
    foodMult:(1+chamberEffect(s,"foodMult"))*all,
    resinMult:upgradeValue(s,"resin")*(1+chamberEffect(s,"resinMult"))*all,
    fungus:upgradeValue(s,"fungus")*all,
    passiveFood:chamberEffect(s,"passiveFood")*upgradeValue(s,"fungus")*all,
    passiveResin:chamberEffect(s,"passiveResin")*all,
    broodCap:12+chamberEffect(s,"broodCap")+upgradeValue(s,"nursery")*2,
    popCap:20+chamberEffect(s,"popCap")+(upgradeValue(s,"population")-1)*220+pval(s,"start")*.5,
    raidLoot:1+chamberEffect(s,"raidLoot"),
    discovery:upgradeValue(s,"discovery"),
    extraBirth:ms.extraBirth
  };
}
export function chamberCost(s,id){
  const c=CHAMBERS.find(x=>x.id===id),lv=s.chamber[id]||0;if(!c)return null;
  const out={};for(const [k,v] of Object.entries(c.baseCost))out[k]=Math.ceil(v*Math.pow(c.scale,lv));return out;
}
export function upgradeCost(s,id){
  const u=UPGRADES.find(x=>x.id===id),lv=s.upgrades[id]||0;if(!u)return null;
  const out={};for(const [k,v] of Object.entries(u.baseCost))out[k]=Math.ceil(v*Math.pow(u.scale,lv));return out;
}
export function canAfford(s,cost){return cost&&Object.entries(cost).every(([k,v])=>(s.res[k]||0)>=v);}
function spend(s,cost){for(const [k,v] of Object.entries(cost))s.res[k]-=v;}
export function buyChamber(s,id){
  const c=CHAMBERS.find(x=>x.id===id);if(!c||population(s)<c.unlockPop)return false;const cost=chamberCost(s,id);if(!canAfford(s,cost))return false;
  spend(s,cost);s.chamber[id]=(s.chamber[id]||0)+1;return true;
}
export function buyUpgrade(s,id){
  const u=UPGRADES.find(x=>x.id===id);if(!u||population(s)<u.unlockPop)return false;const cost=upgradeCost(s,id);if(!canAfford(s,cost))return false;
  spend(s,cost);s.upgrades[id]=(s.upgrades[id]||0)+1;return true;
}
export function previewUpgrade(s,id){
  const u=UPGRADES.find(x=>x.id===id);if(!u)return null;const lv=s.upgrades[id]||0;
  const cur=u.base+u.growth*lv,next=u.base+u.growth*(lv+1);
  const format=v=>u.unit==="×"?v.toFixed(2)+"×":v.toFixed(2);
  return {cur:format(cur),next:format(next),cost:upgradeCost(s,id),lv,u};
}
export function formatCost(cost){return Object.entries(cost||{}).map(([k,v])=>`${RESOURCES[k].icon} ${fmt(v)}`).join(" · ");}

export function unlockedLocations(s){return LOCATIONS.filter(l=>population(s)>=l.unlockPop);}
export function assignedWorkers(s,loc){
  const unlocked=unlockedLocations(s),idx=unlocked.findIndex(x=>x.id===loc.id);if(idx<0)return 0;
  const weights=unlocked.map((l,i)=>1+l.capacity*.22+i*.08),sum=weights.reduce((a,b)=>a+b,0);
  return Math.max(1,Math.round(s.workers*weights[idx]/sum));
}
export function locationRate(s,loc){
  const m=mods(s),boost=(s.boosts[loc.id]||0)>0?1.75:1,resourceMult=loc.resource==="food"?m.foodMult:loc.resource==="resin"?m.resinMult:1;
  return loc.rate*m.gather*m.carry*resourceMult*boost;
}
export function locationSummary(s,loc){
  const m=mods(s),workers=assignedWorkers(s,loc),perTrip=locationRate(s,loc),tripSeconds=Math.max(.85,(3.8*loc.travel)/m.speed);
  return {workers,perTrip,tripSeconds,perSecond:workers*perTrip/tripSeconds};
}
function addFloat(s,text,color="#fff",x=.5,y=.5,scale=1){s.floats.push({text,color,x,y,scale,life:1,max:1,vx:rand(-.02,.02),vy:-.12});}
function addParticles(s,kind,count,color,x=.5,y=.5){for(let i=0;i<count;i++)s.particles.push({kind,color,x:x+rand(-.02,.02),y:y+rand(-.02,.02),vx:rand(-.16,.16),vy:rand(-.32,-.08),g:.32,life:rand(.5,1.1),max:1.1,size:rand(.6,1.3)});}
export function boostLocation(s,id){const l=LOCATIONS.find(x=>x.id===id);if(!l||population(s)<l.unlockPop)return false;s.boosts[id]=12;addFloat(s,"PHEROMONE SURGE!","#79f0b6",.5,.28,1.1);return true;}

function resourceTick(s,dt){
  const m=mods(s);s.res.food+=m.passiveFood*dt;s.res.resin+=m.passiveResin*dt;
  for(const loc of unlockedLocations(s)){const sum=locationSummary(s,loc);s.res[loc.resource]+=sum.perSecond*dt;if(s.boosts[loc.id]>0)s.boosts[loc.id]=Math.max(0,s.boosts[loc.id]-dt);}
}
function growthTick(s,dt){
  const m=mods(s),p=population(s);if(p>=m.popCap)return;s.birthTimer-=dt;const foodCost=Math.max(1.2,p*.013);
  if(s.birthTimer<=0&&s.res.food>=foodCost){
    s.res.food-=foodCost;const births=1+m.extraBirth;
    for(let i=0;i<births&&population(s)<m.popCap;i++){
      s.totalBorn++;const roll=Math.random();
      if(p>=45&&roll<.13)s.soldiers++;else if(p>=24&&roll<.27)s.nurses++;else s.workers++;
    }
    s.birthTimer=Math.max(.55,5.5/(m.birth*(1+Math.sqrt(Math.max(0,p))/20)));addFloat(s,`+${births} ANT${births>1?"S":""}`,"#e8d7a2",.5,.60,.82);
  }
}
function eventTick(s,dt){
  if(s.event){s.event.time-=dt;if(s.event.time<=0)s.event=null;return;}
  s.eventTimer-=dt;if(s.eventTimer>0)return;const m=mods(s);s.eventTimer=rand(18,30)/Math.max(.7,m.discovery);
  const choices=[
    {id:"sugar",name:"Sugar Spill",resource:"food",mult:3.2,time:10,color:"#ffd76b"},
    {id:"leafstorm",name:"Fresh Leaf Fall",resource:"leaves",mult:2.8,time:11,color:"#7bd38a"},
    {id:"resin",name:"Broken Twig",resource:"resin",mult:2.6,time:11,color:"#e3a56b"},
    {id:"protein",name:"Insect Scrap",resource:"protein",mult:2.5,time:9,color:"#dc7268"}
  ];
  s.event=choices[Math.floor(Math.random()*choices.length)];s.stats.events++;addFloat(s,s.event.name.toUpperCase()+"!","#ffe28a",.5,.25,1.05);
}
function applyEventBonus(s,dt){
  if(!s.event)return;const m=mods(s);const unlocked=unlockedLocations(s).filter(l=>l.resource===s.event.resource);
  let base=unlocked.reduce((a,l)=>a+locationSummary(s,l).perSecond,0);if(base<=0)base=(.8+population(s)*.02)*m.gather;
  s.res[s.event.resource]+=base*(s.event.mult-1)*dt;
}
function raidTick(s,dt){
  if(population(s)<50)return;
  if(s.raid){
    s.raid.time-=dt;const m=mods(s),dps=(s.soldiers*2.2+Math.sqrt(s.workers)*.5)*m.soldier;s.raid.hp-=dps*dt;
    if(s.raid.hp<=0){
      const food=s.raid.maxHp*.48*m.raidLoot,protein=s.raid.maxHp*.13*m.raidLoot;s.res.food+=food;s.res.protein+=protein;s.totalRaids++;s.stats.raidsWon++;
      addFloat(s,`RAID WON +${fmt(protein)} PROTEIN`,"#7cff9e",.5,.32,1.0);addParticles(s,"spark",16,"#7cff9e",.5,.42);s.raid=null;s.raidTimer=rand(38,58);
    }else if(s.raid.time<=0){
      const loss=Math.max(1,Math.floor(population(s)*.035));s.workers=Math.max(1,s.workers-loss);s.stats.raidsLost++;
      addFloat(s,`PREDATOR ESCAPED · -${loss} WORKERS`,"#ff7970",.5,.32,1.0);s.raid=null;s.raidTimer=rand(35,50);
    }
    return;
  }
  s.raidTimer-=dt;if(s.raidTimer>0)return;const p=population(s),kind=p<140?"Ground Beetle":p<320?"Hunting Spider":"Praying Mantis";
  const hp=(55+p*.78)*Math.pow(1.05,s.totalRaids);s.raid={name:kind,hp,maxHp:hp,time:18};addFloat(s,`${kind.toUpperCase()} ATTACK!`,"#ff8a73",.5,.22,1.13);
}
function syncAgents(s){
  const target=Math.min(180,Math.max(8,Math.round(Math.pow(Math.max(1,s.workers),.72)*3.1)));
  while(s.agents.length<target)s.agents.push({loc:null,t:Math.random(),dir:Math.random()<.5?1:-1,offset:rand(-1,1),speed:rand(.85,1.15),carry:false});
  if(s.agents.length>target)s.agents.length=target;const unlocked=unlockedLocations(s);
  for(const a of s.agents){if(!a.loc||!unlocked.some(l=>l.id===a.loc))a.loc=unlocked[Math.floor(Math.random()*unlocked.length)]?.id||"seed";}
}
function updateAgents(s,dt){
  syncAgents(s);const m=mods(s);
  for(const a of s.agents){const l=LOCATIONS.find(x=>x.id===a.loc)||LOCATIONS[0];a.t+=dt*.17*m.speed/l.travel*a.speed*a.dir;
    if(a.t>=1){a.t=1;a.dir=-1;a.carry=true;s.totalTrips++;}
    if(a.t<=0){a.t=0;a.dir=1;a.carry=false;if(Math.random()<.35){const u=unlockedLocations(s);a.loc=u[Math.floor(Math.random()*u.length)]?.id||a.loc;}}
  }
}
function milestones(s){const p=population(s);for(const m of MILESTONES){if(p>=m.pop&&!s.milestones[m.pop]){s.milestones[m.pop]=true;addFloat(s,`${m.name.toUpperCase()}!`,"#f2d98f",.5,.19,1.2);}}s.stats.biggestPop=Math.max(s.stats.biggestPop,p);}
export function update(s,dt){
  resourceTick(s,dt);growthTick(s,dt);eventTick(s,dt);applyEventBonus(s,dt);raidTick(s,dt);updateAgents(s,dt);milestones(s);
  for(const f of s.floats){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;}s.floats=s.floats.filter(f=>f.life>0);
  for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;}s.particles=s.particles.filter(p=>p.life>0);
}
export function prestigeGain(s){const p=population(s);if(p<250)return 0;return Math.max(1,Math.floor(Math.sqrt(p/110)+Math.log10(1+s.totalTrips)));}
export function newColony(s){
  const g=prestigeGain(s);if(g<=0)return false;s.genes+=g;s.prestigeCount++;
  const keep={genes:s.genes,prestige:{...s.prestige},prestigeCount:s.prestigeCount,stats:{...s.stats},totalBorn:s.totalBorn,totalTrips:s.totalTrips,totalRaids:s.totalRaids};
  Object.assign(s,fresh(),keep);s.workers+=Math.floor(pval(s,"start"));s.totalBorn+=Math.floor(pval(s,"start"));return g;
}
export function buyPrestige(s,id){
  const p=PRESTIGE.find(x=>x.id===id);if(!p)return false;const lv=s.prestige[id]||0,cost=Math.ceil(p.baseCost*Math.pow(p.scale,lv));
  if(s.genes<cost)return false;s.genes-=cost;s.prestige[id]=lv+1;return true;
}
export function applyOffline(s,now=Date.now()){
  const sec=clamp((now-(s.lastSave||now))/1000,0,8*3600);if(sec<10)return {seconds:0,res:zeroRes(),ants:0};
  const before={...s.res},m=mods(s);
  for(const l of unlockedLocations(s)){const sum=locationSummary(s,l);s.res[l.resource]+=sum.perSecond*sec*.72;}
  s.res.food+=m.passiveFood*sec*.72;s.res.resin+=m.passiveResin*sec*.72;
  const possible=Math.floor(sec/Math.max(.65,5.5/(m.birth*(1+Math.sqrt(Math.max(1,population(s)))/20)))*.45);let ants=0;
  for(let i=0;i<possible&&population(s)<m.popCap;i++){if(s.res.food<1)break;s.res.food-=1;s.workers++;s.totalBorn++;ants++;}
  s.lastSave=now;const gained={};for(const k of Object.keys(s.res))gained[k]=s.res[k]-before[k];return {seconds:sec,res:gained,ants};
}
