import {
  REGIONS,SPOTS,FISH,ROD_FAMILIES,REEL_FAMILIES,PROPERTY_POOL,LINES,BOOSTERS,PEARLS,ACCESSORIES,CHESTS,MISSION_DEFS
} from "./ParadiseAnglerData.js";

export const SAVE_KEY="paradise-angler-v1";
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const rint=(a,b)=>Math.floor(rand(a,b+1));

export function fmt(n){
  if(!Number.isFinite(n))return "∞";
  const a=Math.abs(n);
  if(a<1000)return a<10?n.toFixed(1).replace(".0",""):Math.floor(n).toString();
  const u=["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No"];let v=a,i=-1;
  while(v>=1000&&i<u.length-1){v/=1000;i++;}
  return (n<0?"-":"")+v.toFixed(v>=100?0:v>=10?1:2).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1")+u[i];
}
export function xpNeed(level){return Math.floor(110*Math.pow(1.13,Math.max(0,level-1))+level*32);}

function blankCounts(list){return Object.fromEntries(list.map(x=>[x.id,0]));}
function defaultState(){
  const state={
    version:1,level:1,xp:0,gold:18000,cash:80,energy:10,maxEnergy:10,lastEnergyAt:Date.now(),
    silverKey:1,goldKey:0,powerStone:45,evoStone:4,pearlPowder:120,coral:0,
    selectedSpot:"waikiki",selectedLine:"basic",selectedLure:"hawaii:common",
    equippedRod:null,equippedReel:null,equippedAccessory:null,
    inventory:{gear:[],lines:blankCounts(LINES),lures:{},boosters:blankCounts(BOOSTERS),pearls:blankCounts(PEARLS),accessories:blankCounts(ACCESSORIES)},
    activeBoosters:{damage:false,gold:false,xp:false,big:false},
    fishBook:{},tank:[],tankCap:20,missions:{},stats:{casts:0,catches:0,failed:0,bosses:0,perfect:0,upgrades:0,chests:0,biggest:0,totalGold:0},
    lastSave:Date.now(),nextGearUid:1,tutorialDone:false
  };
  state.inventory.lines.basic=18;state.inventory.lines.silver=8;
  state.inventory.lures["hawaii:common"]=18;state.inventory.lures["hawaii:rare"]=5;
  state.inventory.boosters.damage=2;state.inventory.boosters.gold=2;state.inventory.boosters.xp=2;state.inventory.boosters.big=1;
  const rod=createGear(state,"rod",1,"drift",1);
  const reel=createGear(state,"reel",1,"wood",1);
  state.equippedRod=rod.uid;state.equippedReel=reel.uid;
  for(const m of MISSION_DEFS)state.missions[m.id]={progress:0,claimed:false};
  return state;
}
export function loadState(){
  const fresh=defaultState();
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return fresh;
    const p=JSON.parse(raw);
    return {...fresh,...p,
      inventory:{
        gear:p.inventory?.gear||fresh.inventory.gear,
        lines:{...fresh.inventory.lines,...(p.inventory?.lines||{})},
        lures:{...fresh.inventory.lures,...(p.inventory?.lures||{})},
        boosters:{...fresh.inventory.boosters,...(p.inventory?.boosters||{})},
        pearls:{...fresh.inventory.pearls,...(p.inventory?.pearls||{})},
        accessories:{...fresh.inventory.accessories,...(p.inventory?.accessories||{})}
      },
      activeBoosters:{...fresh.activeBoosters,...(p.activeBoosters||{})},
      fishBook:{...(p.fishBook||{})},missions:{...fresh.missions,...(p.missions||{})},stats:{...fresh.stats,...(p.stats||{})},
      tank:(p.tank||[]).map(x=>({...x}))
    };
  }catch{return fresh;}
}
export function saveState(s){s.lastSave=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));}catch{}}

function family(type,id){return (type==="rod"?ROD_FAMILIES:REEL_FAMILIES).find(x=>x.id===id);}
function randomProperty(stars,forced=null){
  const pool=forced?PROPERTY_POOL.filter(p=>p.id===forced):PROPERTY_POOL;
  const p=pool[rint(0,pool.length-1)],quality=.68+stars*.07;
  return {id:p.id,value:Number((rand(p.min,p.max)*quality).toFixed(2))};
}
function propertyCount(stars){return stars<=1?0:stars<=2?1:stars<=4?2:stars===5?3:4;}
export function createGear(s,type,stars,familyId=null,plus=0){
  const families=type==="rod"?ROD_FAMILIES:REEL_FAMILIES;
  const fam=familyId?family(type,familyId):families[rint(0,families.length-1)];
  const props=[];
  if(stars>=2)props.push(randomProperty(stars,fam.affinity));
  while(props.length<propertyCount(stars)){
    const p=randomProperty(stars);if(!props.some(x=>x.id===p.id))props.push(p);
  }
  const g={uid:`g${s.nextGearUid++}`,type,family:fam.id,stars:clamp(stars,1,6),plus,transcend:0,properties:props,pearls:[null,null],durability:20,maxDurability:20,locked:false};
  s.inventory.gear.push(g);return g;
}
export function gearName(g){const f=family(g.type,g.family);return f?.names[g.stars-1]||`${g.stars}★ ${g.type}`;}
export function gearStats(g){
  if(!g)return {damage:0,props:{},condition:1};
  const f=family(g.type,g.family),starMult=Math.pow(1.67,g.stars-1),plusMult=1+g.plus*.095,trans=1+g.transcend*.11;
  const condition=.72+.28*clamp(g.durability/Math.max(1,g.maxDurability),0,1);
  let damage=f.base*starMult*plusMult*trans*condition;const props={};
  for(const p of g.properties)props[p.id]=(props[p.id]||0)+p.value;
  for(const pearlId of g.pearls||[]){const p=PEARLS.find(x=>x.id===pearlId);if(p)props[p.property]=(props[p.property]||0)+p.value;}
  damage*=1+(props.damage||0)/100;
  return {damage,props,condition};
}
export function equippedGear(s,type){const uid=type==="rod"?s.equippedRod:s.equippedReel;return s.inventory.gear.find(g=>g.uid===uid)||null;}
export function equipGear(s,uid){const g=s.inventory.gear.find(x=>x.uid===uid);if(!g)return false;if(g.type==="rod")s.equippedRod=uid;else s.equippedReel=uid;return true;}
export function powerUpPreview(s,uid){
  const g=s.inventory.gear.find(x=>x.uid===uid);if(!g||g.plus>=10)return null;
  const before=gearStats(g).damage,copy={...g,plus:g.plus+1},after=gearStats(copy).damage;
  return {g,before,after,costGold:Math.floor((700+g.stars*900)*Math.pow(1.22,g.plus)),stones:Math.ceil(2+g.stars*1.4+g.plus*.55)};
}
export function powerUpGear(s,uid){const p=powerUpPreview(s,uid);if(!p||s.gold<p.costGold||s.powerStone<p.stones)return false;s.gold-=p.costGold;s.powerStone-=p.stones;p.g.plus++;s.stats.upgrades++;progressMission(s,"upgrade",1);return true;}
export function evolvePreview(s,uid){
  const g=s.inventory.gear.find(x=>x.uid===uid);if(!g||g.plus<10||g.stars>=6)return null;
  const before=gearStats(g).damage,copy={...g,stars:g.stars+1,plus:0},after=gearStats(copy).damage;
  return {g,before,after,gold:Math.floor(9000*Math.pow(2.15,g.stars-1)),evo:2+g.stars*2};
}
export function evolveGear(s,uid){
  const p=evolvePreview(s,uid);if(!p||s.gold<p.gold||s.evoStone<p.evo)return false;s.gold-=p.gold;s.evoStone-=p.evo;p.g.stars++;p.g.plus=0;
  while(p.g.properties.length<propertyCount(p.g.stars)){const np=randomProperty(p.g.stars);if(!p.g.properties.some(x=>x.id===np.id))p.g.properties.push(np);}return true;
}
export function transcendPreview(s,uid){
  const g=s.inventory.gear.find(x=>x.uid===uid);if(!g||g.stars<5||g.plus<10||g.transcend>=5)return null;
  const before=gearStats(g).damage,copy={...g,transcend:g.transcend+1},after=gearStats(copy).damage;
  return {g,before,after,chance:Math.max(.35,.76-g.transcend*.09),cash:22+g.transcend*18,coral:2+g.transcend};
}
export function transcendGear(s,uid){
  const p=transcendPreview(s,uid);if(!p||s.cash<p.cash||s.coral<p.coral)return {ok:false};s.cash-=p.cash;s.coral-=p.coral;
  if(Math.random()<=p.chance){p.g.transcend++;return {ok:true,success:true};}return {ok:true,success:false};
}
export function repairGearPreview(s,uid){const g=s.inventory.gear.find(x=>x.uid===uid);if(!g||g.durability>=g.maxDurability)return null;return {g,cost:Math.ceil((g.maxDurability-g.durability)*(160+g.stars*210))};}
export function repairGear(s,uid){const p=repairGearPreview(s,uid);if(!p||s.gold<p.cost)return false;s.gold-=p.cost;p.g.durability=p.g.maxDurability;return true;}
export function socketPearl(s,uid,slot,pearlId){
  const g=s.inventory.gear.find(x=>x.uid===uid),p=PEARLS.find(x=>x.id===pearlId);if(!g||!p||slot<0||slot>1||(s.inventory.pearls[pearlId]||0)<=0)return false;
  const old=g.pearls[slot];if(old)s.inventory.pearls[old]=(s.inventory.pearls[old]||0)+1;s.inventory.pearls[pearlId]--;g.pearls[slot]=pearlId;return true;
}
export function removePearl(s,uid,slot){const g=s.inventory.gear.find(x=>x.uid===uid);if(!g||!g.pearls[slot])return false;const id=g.pearls[slot];s.inventory.pearls[id]=(s.inventory.pearls[id]||0)+1;g.pearls[slot]=null;return true;}

export function accessoryStats(s){
  const a=ACCESSORIES.find(x=>x.id===s.equippedAccessory);if(!a)return {critRate:0,critDamage:0,accuracy:0,hp:0};
  const lv=s.inventory.accessories[a.id]||0,m=1+Math.max(0,lv-1)*.075;return {critRate:a.critRate*m,critDamage:a.critDamage*m,accuracy:a.accuracy*m,hp:a.hp*m};
}
export function upgradeAccessory(s,id){
  const a=ACCESSORIES.find(x=>x.id===id),lv=s.inventory.accessories[id]||0;if(!a||lv<=0)return false;
  const gold=Math.floor(1400*Math.pow(1.19,lv-1)*a.stars),powder=Math.ceil(6+lv*2.5);if(s.gold<gold||s.pearlPowder<powder)return false;
  s.gold-=gold;s.pearlPowder-=powder;s.inventory.accessories[id]=lv+1;return true;
}
export function equipAccessory(s,id){if((s.inventory.accessories[id]||0)<=0)return false;s.equippedAccessory=id;return true;}

export function getCombatStats(s){
  const rod=gearStats(equippedGear(s,"rod")),reel=gearStats(equippedGear(s,"reel")),acc=accessoryStats(s),combined={};
  for(const src of [rod.props,reel.props])for(const [k,v] of Object.entries(src))combined[k]=(combined[k]||0)+v;
  const line=LINES.find(x=>x.id===s.selectedLine)||LINES[0];
  const damage=(rod.damage+reel.damage)*line.damage*(s.activeBoosters.damage?BOOSTERS.find(x=>x.id==="damage").mult:1);
  return {damage,critRate:clamp(.04+(combined.critRate||0)/100+acc.critRate/100,0,.65),critDamage:1.65+(combined.critDamage||0)/100+acc.critDamage/100,
    bigFish:(combined.bigFish||0)/100,rareFish:(combined.rareFish||0)/100,bossDamage:1+(combined.bossDamage||0)/100,goldBonus:1+(combined.gold||0)/100,xpBonus:1+(combined.xp||0)/100,
    tension:line.tension*(1+(combined.tension||0)/100),lineLength:line.length,accuracy:acc.accuracy,hp:100+acc.hp,line};
}

export function getLureInfo(s){
  const [region,tier]=String(s.selectedLure||"hawaii:common").split(":");
  const table={common:{name:"Common Lure",rare:.00,big:.04,cost:320},rare:{name:"Rare Lure",rare:.07,big:.10,cost:1300},high:{name:"High-End Lure",rare:.14,big:.17,cost:3900},hidden:{name:"Hidden Fish Lure",rare:.20,big:.13,cost:0}};
  return {region,tier,...(table[tier]||table.common)};
}
export function lureKey(region,tier){return `${region}:${tier}`;}
export function buyLure(s,region,tier,count=5){const key=lureKey(region,tier),tmp={selectedLure:key},info=getLureInfo(tmp);if(!info.cost||s.gold<info.cost*count)return false;s.gold-=info.cost*count;s.inventory.lures[key]=(s.inventory.lures[key]||0)+count;return true;}
export function buyLine(s,id,count=5){const l=LINES.find(x=>x.id===id);if(!l||l.lootOnly||s.gold<l.costGold*count)return false;s.gold-=l.costGold*count;s.inventory.lines[id]=(s.inventory.lines[id]||0)+count;return true;}
export function toggleBooster(s,id){if(!(id in s.activeBoosters)||(s.inventory.boosters[id]||0)<=0)return false;s.activeBoosters[id]=!s.activeBoosters[id];return true;}
export function consumeCastItems(s){
  const spot=SPOTS.find(x=>x.id===s.selectedSpot);if(!spot||s.energy<spot.energy)return false;const line=s.selectedLine,lure=s.selectedLure;
  if((s.inventory.lines[line]||0)<=0||(s.inventory.lures[lure]||0)<=0)return false;
  s.energy-=spot.energy;s.inventory.lines[line]--;s.inventory.lures[lure]--;
  const rod=equippedGear(s,"rod"),reel=equippedGear(s,"reel");if(rod)rod.durability=Math.max(0,rod.durability-1);if(reel)reel.durability=Math.max(0,reel.durability-1);
  for(const [id,on] of Object.entries(s.activeBoosters)){if(on){s.inventory.boosters[id]=Math.max(0,(s.inventory.boosters[id]||0)-1);s.activeBoosters[id]=false;}}
  s.stats.casts++;return true;
}
export function selectSpot(s,id){const spot=SPOTS.find(x=>x.id===id);if(!spot||s.level<spot.unlock)return false;s.selectedSpot=id;if(!s.selectedLure.startsWith(spot.region+":"))s.selectedLure=lureKey(spot.region,"common");return true;}
export function selectLine(s,id){if((s.inventory.lines[id]||0)<=0)return false;s.selectedLine=id;return true;}
export function selectLure(s,key){if((s.inventory.lures[key]||0)<=0)return false;s.selectedLure=key;return true;}

export function refillEnergy(s,now=Date.now()){
  const interval=180000;if(s.energy>=s.maxEnergy){s.lastEnergyAt=now;return;}const elapsed=now-(s.lastEnergyAt||now),gain=Math.floor(elapsed/interval);
  if(gain>0){s.energy=Math.min(s.maxEnergy,s.energy+gain);s.lastEnergyAt+=gain*interval;}
}
export function energyCountdown(s,now=Date.now()){if(s.energy>=s.maxEnergy)return 0;return Math.max(0,180000-(now-(s.lastEnergyAt||now)));}

function weightedPick(values,weights){let total=weights.reduce((a,b)=>a+b,0),r=Math.random()*total;for(let i=0;i<values.length;i++){r-=weights[i];if(r<=0)return values[i];}return values[0];}
export function chestOddsText(chest){return chest.odds.gear.map((s,i)=>`${s}★ ${chest.odds.weights[i]}%`).join(" · ");}
function addLoot(s,loot){
  if(loot.type==="gear")return createGear(s,loot.gearType,loot.stars);
  if(loot.type==="line"){s.inventory.lines[loot.id]=(s.inventory.lines[loot.id]||0)+loot.count;return loot;}
  if(loot.type==="lure"){s.inventory.lures[loot.id]=(s.inventory.lures[loot.id]||0)+loot.count;return loot;}
  if(loot.type==="booster"){s.inventory.boosters[loot.id]=(s.inventory.boosters[loot.id]||0)+loot.count;return loot;}
  if(loot.type==="pearl"){s.inventory.pearls[loot.id]=(s.inventory.pearls[loot.id]||0)+loot.count;return loot;}
  if(loot.type==="accessory"){s.inventory.accessories[loot.id]=(s.inventory.accessories[loot.id]||0)+1;return loot;}
  s[loot.type]=(s[loot.type]||0)+loot.count;return loot;
}
export function rollChest(s,id){
  const c=CHESTS.find(x=>x.id===id);if(!c)return null;for(const [k,v] of Object.entries(c.open))if((s[k]||0)<v)return null;for(const [k,v] of Object.entries(c.open))s[k]-=v;
  const stars=weightedPick(c.odds.gear,c.odds.weights);let loot;const r=Math.random();
  if(r<.56)loot={type:"gear",gearType:Math.random()<.5?"rod":"reel",stars};
  else if(r<.67){const pool=id==="coral"?["special2","special3","kevlar15"]:id==="gold"?["kevlar15","special2","kevlar"]:["silver","kevlar","kevlar15"];loot={type:"line",id:pool[rint(0,pool.length-1)],count:rint(4,11)};}
  else if(r<.76){const regions=REGIONS.filter(x=>s.level>=x.unlock),region=regions[rint(0,regions.length-1)].id,tier=id==="wood"?"common":id==="silver"?"rare":Math.random()<.35?"high":"rare";loot={type:"lure",id:lureKey(region,tier),count:rint(5,12)};}
  else if(r<.84)loot={type:"powerStone",count:rint(12,35)};
  else if(r<.90)loot={type:"pearl",id:PEARLS[rint(0,PEARLS.length-1)].id,count:1};
  else if(r<.95)loot={type:"booster",id:BOOSTERS[rint(0,BOOSTERS.length-1)].id,count:rint(1,3)};
  else if(r<.985)loot={type:"evoStone",count:rint(2,6)};
  else loot={type:"accessory",id:ACCESSORIES[clamp(stars-2,0,ACCESSORIES.length-1)].id,count:1};
  const result=addLoot(s,loot);s.stats.chests++;return {chest:c,loot,result};
}

export function addCurrency(s,reward){for(const [k,v] of Object.entries(reward||{}))s[k]=(s[k]||0)+v;}
export function progressMission(s,type,amount=1){for(const def of MISSION_DEFS){if(def.type!==type)continue;const m=s.missions[def.id];if(m&&!m.claimed)m.progress=Math.min(def.target,m.progress+amount);}}
export function claimMission(s,id){const def=MISSION_DEFS.find(x=>x.id===id),m=s.missions[id];if(!def||!m||m.claimed||m.progress<def.target)return false;addCurrency(s,def.reward);m.claimed=true;return true;}
export function uniqueSpecies(s){return Object.keys(s.fishBook).filter(id=>(s.fishBook[id]?.count||0)>0).length;}
export function levelUp(s){let n=0;while(s.xp>=xpNeed(s.level)){s.xp-=xpNeed(s.level);s.level++;n++;s.cash+=3;s.energy=s.maxEnergy;}return n;}
export function recordCatch(s,result){
  const f=FISH[result.fishId],spot=SPOTS.find(x=>x.id===result.spotId),combat=getCombatStats(s),sizeRatio=result.weight/f.weight[1];
  const grade=sizeRatio>=1.16?"SSS":sizeRatio>=1.03?"SS":sizeRatio>=.88?"S":sizeRatio>=.72?"A":sizeRatio>=.55?"B":sizeRatio>=.40?"C":"D";
  let gold=f.value*(.75+result.weight/Math.max(.1,f.weight[0]+f.weight[1])*.7),xp=f.xp*(.85+sizeRatio*.35);
  if(result.castGrade==="PERFECT")gold*=1.08;gold*=combat.goldBonus*(result.goldBoost?1.5:1);xp*=combat.xpBonus*(result.xpBoost?1.5:1);if(f.boss){gold*=1.4;s.stats.bosses++;progressMission(s,"boss",1);}
  gold=Math.round(gold);xp=Math.round(xp);s.gold+=gold;s.xp+=xp;s.stats.catches++;s.stats.totalGold+=gold;s.stats.biggest=Math.max(s.stats.biggest,result.weight);
  const wasNew=!(s.fishBook[result.fishId]?.count>0),entry=s.fishBook[result.fishId]||{count:0,best:0};entry.count++;entry.best=Math.max(entry.best,result.weight);s.fishBook[result.fishId]=entry;
  progressMission(s,"catch",1);if(wasNew)progressMission(s,"species",1);if(result.castGrade==="PERFECT"){s.stats.perfect++;progressMission(s,"perfect",1);}
  const extras=[];if(f.boss){if(["S","SS","SSS"].includes(grade)){s.silverKey++;extras.push("Silver Key");}if(["SS","SSS"].includes(grade)){s.cash+=Math.ceil(4+spot.difficulty);extras.push("Cash");}if(grade==="SSS"){s.goldKey++;extras.push("Gold Key");}}
  if(f.stars>=4&&Math.random()<.16){s.powerStone+=rint(2,7);extras.push("Power Stones");}if(f.stars===5&&Math.random()<.08){s.coral++;extras.push("Coral");}
  const levels=levelUp(s);return {gold,xp,grade,extras,levels};
}
export function failCatch(s){s.stats.failed++;}

export function tankMaturity(item,now=Date.now()){const f=FISH[item.fishId],need=(55+f.stars*55)*(f.boss?1.8:1)*1000;return clamp((now-item.storedAt)/need,0,1);}
export function storeFish(s,result){if(s.tank.length>=s.tankCap)return false;s.tank.push({id:`t${Date.now()}${Math.random()}`,fishId:result.fishId,weight:result.weight,storedAt:Date.now(),spotId:result.spotId});return true;}
export function sellTankFish(s,id){
  const i=s.tank.findIndex(x=>x.id===id);if(i<0)return null;const item=s.tank[i],f=FISH[item.fishId],m=tankMaturity(item),gold=Math.round(f.value*(.9+item.weight/f.weight[1])*(1+m*.9)),cash=f.boss&&m>=1?Math.max(1,Math.floor(f.stars/2)):0;
  s.gold+=gold;s.cash+=cash;s.tank.splice(i,1);return {gold,cash};
}
export function expandTank(s){const cost=5000*Math.pow(1.85,Math.floor((s.tankCap-20)/10));if(s.gold<cost)return false;s.gold-=cost;s.tankCap+=10;return true;}
export function unlockLuresForLevel(s){
  for(const r of REGIONS){if(s.level>=r.unlock){for(const tier of ["common","rare","high","hidden"]){const k=lureKey(r.id,tier);if(!(k in s.inventory.lures))s.inventory.lures[k]=0;}}}
}
