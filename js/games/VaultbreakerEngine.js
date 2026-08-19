import {
  CHESTS, ITEMS, CURSORS, TREASURES, RARITY, SKILL_BRANCHES, ASCENSION_PERKS
} from "./VaultbreakerData.js";

export const SAVE_KEY="vaultbreaker-idle-v1";
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const rint=(a,b)=>Math.floor(rand(a,b+1));

export function fmt(n){
  if(!Number.isFinite(n))return "∞";
  const abs=Math.abs(n);
  if(abs<1000)return abs<10?n.toFixed(1).replace(".0",""):Math.floor(n).toString();
  const units=["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","Ud","Dd","Td","Qad","Qid"];
  let u=-1,v=abs;
  while(v>=1000&&u<units.length-1){v/=1000;u++;}
  const s=v>=100?0:v>=10?1:2;
  return (n<0?"-":"")+v.toFixed(s).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1")+units[u];
}

export function xpNeeded(level){return Math.floor(85*Math.pow(1.155,Math.max(0,level-1))+level*18);}
export function itemCost(item,level,mods={shop:1}){return Math.floor(item.baseCost*Math.pow(item.costScale,level)*mods.shop);}

function defaultState(){
  return {
    version:1,
    gold:35,
    level:1,
    xp:0,
    totalXp:0,
    skillPoints:0,
    crownShards:0,
    chestStage:1,
    highestStage:1,
    chestsOpened:0,
    totalClicks:0,
    totalGold:0,
    totalDamage:0,
    prestigeCount:0,
    itemLevels:Object.fromEntries(ITEMS.map(i=>[i.id,0])),
    cursorLevels:Object.fromEntries(CURSORS.map(c=>[c.id,1])),
    equippedCursor:"finger",
    treasures:{},
    skills:{},
    ascension:{},
    chest:null,
    combo:0,
    comboTimer:0,
    cannonTimer:4.5,
    pendingNext:0,
    particles:[],
    floats:[],
    openBurst:false,
    lastSave:Date.now(),
    stats:{crits:0,treasures:0,bosses:0,maxCombo:0},
    settings:{particles:true,shake:true}
  };
}

export function loadState(){
  const fresh=defaultState();
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return fresh;
    const p=JSON.parse(raw);
    return {
      ...fresh,...p,
      itemLevels:{...fresh.itemLevels,...(p.itemLevels||{})},
      cursorLevels:{...fresh.cursorLevels,...(p.cursorLevels||{})},
      treasures:{...(p.treasures||{})},
      skills:{...(p.skills||{})},
      ascension:{...(p.ascension||{})},
      stats:{...fresh.stats,...(p.stats||{})},
      settings:{...fresh.settings,...(p.settings||{})},
      particles:[],floats:[],chest:null,pendingNext:0,openBurst:false
    };
  }catch{return fresh;}
}

export function saveState(s){
  s.lastSave=Date.now();
  try{
    const copy={...s,particles:[],floats:[],chest:null,pendingNext:0,openBurst:false};
    localStorage.setItem(SAVE_KEY,JSON.stringify(copy));
  }catch{}
}

function addEffect(mods,effect,value){
  switch(effect){
    case "active":mods.active+=value;break;
    case "passive":mods.passive+=value;break;
    case "gold":mods.gold+=value;break;
    case "xp":mods.xp+=value;break;
    case "crit":mods.crit+=value;break;
    case "critDamage":mods.critDamage+=value;break;
    case "treasure":mods.treasure+=value;break;
    case "idleGold":mods.idleGold+=value;break;
    case "cannon":mods.cannon+=value;break;
    case "goldTouch":mods.goldTouch+=value;break;
    case "double":mods.double+=value;break;
    case "offline":mods.offline+=value;break;
    case "combo":mods.combo+=value;break;
    case "rarity":mods.rarity+=value;break;
    case "shop":mods.shop*=Math.max(.35,1-value);break;
    case "item":mods.item+=value;break;
    case "treasurePower":mods.treasurePower+=value;break;
    case "bossGold":mods.bossGold+=value;break;
    case "chestSkip":mods.chestSkip+=value;break;
    case "cursor":mods.cursor+=value;break;
    case "ascend":mods.ascend+=value;break;
    case "all":mods.all+=value;break;
  }
}

export function getMods(s){
  const m={
    active:1,activeFlat:0,passive:1,gold:1,xp:1,crit:.05,critDamage:2,
    treasure:1,idleGold:0,cannon:0,goldTouch:0,double:0,offline:1,
    combo:0,rarity:0,shop:1,item:1,treasurePower:1,bossGold:1,chestSkip:0,
    cursor:1,ascend:1,all:0,startStage:0
  };

  // Skill tree.
  for(const branch of SKILL_BRANCHES){
    for(const node of branch.nodes){
      const lv=s.skills[node.id]||0;
      if(lv)addEffect(m,node.effect,node.value*lv);
    }
  }

  // Ascension.
  for(const p of ASCENSION_PERKS){
    const lv=s.ascension[p.id]||0;
    if(!lv)continue;
    if(p.effect==="damage"){m.active+=p.value*lv;m.passive+=p.value*lv;}
    else if(p.effect==="gold")m.gold+=p.value*lv;
    else if(p.effect==="xp")m.xp+=p.value*lv;
    else if(p.effect==="treasure"){m.treasure+=p.value*lv;m.rarity+=p.value*.7*lv;}
    else if(p.effect==="start")m.startStage+=lv*5;
  }

  // Item effects.
  for(const item of ITEMS){
    const lv=s.itemLevels[item.id]||0;
    if(!lv)continue;
    const v=item.base*lv*m.item;
    if(item.effect==="activeFlat")m.activeFlat+=v;
    else addEffect(m,item.effect,v);
  }

  // Treasures.
  for(const tr of TREASURES){
    const count=s.treasures[tr.id]||0;
    if(!count)continue;
    const copies=1+Math.log2(Math.max(1,count))*.18;
    const v=tr.value*copies*m.treasurePower;
    if(tr.effect==="all"){
      m.active+=v;m.passive+=v;m.gold+=v;m.xp+=v;
    }else addEffect(m,tr.effect,v);
  }

  // Cursor.
  const cursor=CURSORS.find(c=>c.id===s.equippedCursor)||CURSORS[0];
  const cl=s.cursorLevels[cursor.id]||1;
  const cm=1+(cl-1)*.06;
  const cpower=1+(m.cursor-1);
  m.active*=1+(cursor.active*cm-1)*cpower;
  m.passive*=1+(cursor.passive*cm-1)*cpower;
  m.crit+=cursor.crit*cm*cpower;
  m.critDamage+=cursor.critDmg*cm*cpower;

  const all=1+m.all;
  m.active*=all;m.passive*=all;m.gold*=all;
  return m;
}

export function calcActiveDamage(s){
  const m=getMods(s);
  const base=1.4*Math.pow(1.145,s.level-1)+m.activeFlat;
  return base*m.active;
}
export function calcPassiveDps(s){
  const m=getMods(s);
  let base=.38*Math.pow(1.14,s.level-1);
  base+=Math.pow(s.itemLevels.crew||0,1.06)*1.55;
  return base*m.passive;
}

export function chestInfo(stage){
  const index=(stage-1)%CHESTS.length;
  const cycle=Math.floor((stage-1)/CHESTS.length);
  const def=CHESTS[index];
  const boss=stage%10===0;
  const hp=32*def.hpMult*Math.pow(1.185,stage-1)*Math.pow(1.15,cycle)*(boss?3.8:1);
  const gold=12*def.goldMult*Math.pow(1.17,stage-1)*Math.pow(1.10,cycle)*(boss?3.1:1);
  const xp=Math.max(10,Math.floor(10*Math.pow(1.105,stage-1)*(boss?2.2:1)));
  return {def,boss,hp,gold,xp,stage};
}

export function spawnChest(s,force=false){
  const info=chestInfo(s.chestStage);
  s.chest={
    ...info,
    hp:info.hp,maxHp:info.hp,
    opened:false,spawnAt:performance.now?performance.now():0,
    hitFlash:0,openTimer:0,wobble:0
  };
  s.openBurst=false;
  const m=getMods(s);
  if(!force && Math.random()<m.chestSkip){
    dealDamage(s,info.hp*2,{source:"skip",allowCrit:false});
  }
}

function addFloat(s,text,color="#fff",scale=1,x=.5,y=.42){
  s.floats.push({text,color,life:1,max:1,x,y,scale,vx:rand(-.025,.025),vy:-.16});
}
function addParticles(s,kind,count,color="#ffd65a"){
  if(!s.settings.particles)return;
  for(let i=0;i<count;i++){
    s.particles.push({
      kind,color,life:rand(.55,1.3),max:1.3,
      x:.5+rand(-.04,.04),y:.48+rand(-.03,.03),
      vx:rand(-.32,.32),vy:rand(-.58,-.18),
      gravity:rand(.45,.72),size:rand(.5,1.4),spin:rand(-8,8),rot:rand(0,6.28)
    });
  }
}

function levelUp(s){
  while(s.xp>=xpNeeded(s.level)){
    s.xp-=xpNeeded(s.level);
    s.level++;
    s.skillPoints++;
    addFloat(s,`LEVEL ${s.level}!`,"#8bf0ff",1.35,.5,.22);
    addParticles(s,"star",14,"#8bf0ff");
  }
}

function weightedTreasure(s){
  const m=getMods(s);
  const list=TREASURES.map(t=>{
    const base=RARITY[t.rarity].weight;
    const rarityIndex=["common","uncommon","rare","epic","legendary","mythic","ultra"].indexOf(t.rarity);
    const boost=1+rarityIndex*m.rarity*1.7;
    return [t,base*boost];
  });
  let total=list.reduce((a,b)=>a+b[1],0),roll=Math.random()*total;
  for(const [t,w] of list){roll-=w;if(roll<=0)return t;}
  return list[0][0];
}

function tryTreasure(s){
  const m=getMods(s);
  const baseChance=.0105*m.treasure;
  if(Math.random()>=clamp(baseChance,0,.42))return null;
  const tr=weightedTreasure(s);
  s.treasures[tr.id]=(s.treasures[tr.id]||0)+1;
  s.stats.treasures++;
  addFloat(s,`${RARITY[tr.rarity].label} TREASURE!`,RARITY[tr.rarity].color,1.15,.5,.28);
  addParticles(s,"gem",18,RARITY[tr.rarity].color);
  return tr;
}

function openChest(s){
  const c=s.chest;if(!c||c.opened)return;
  c.opened=true;c.openTimer=.72;
  const m=getMods(s);
  const bossMult=c.boss?m.bossGold:1;
  let gold=c.gold*m.gold*bossMult;
  if(Math.random()<clamp(m.double,0,.65)){gold*=2;addFloat(s,"DOUBLE PLUNDER!","#f1d363",1.1,.5,.33);}
  const xp=c.xp*m.xp;
  s.gold+=gold;s.totalGold+=gold;s.xp+=xp;s.totalXp+=xp;s.chestsOpened++;
  if(c.boss)s.stats.bosses++;
  s.highestStage=Math.max(s.highestStage,s.chestStage);
  addFloat(s,`+${fmt(gold)} GOLD`,"#ffd45f",1.05,.5,.31);
  addParticles(s,"coin",Math.min(46,20+(c.boss?20:0)),"#ffd45f");
  tryTreasure(s);
  levelUp(s);
  s.pendingNext=.72;
}

export function dealDamage(s,amount,{source="click",allowCrit=true}={}){
  if(!s.chest||s.chest.opened||amount<=0)return {damage:0,crit:false};
  const m=getMods(s);
  let dmg=amount,crit=false;
  if(allowCrit&&Math.random()<clamp(m.crit,.0,.75)){
    dmg*=m.critDamage;crit=true;s.stats.crits++;
  }
  if(source==="click"){
    s.combo=Math.min(100,s.combo+1);
    s.comboTimer=.72;
    const comboBonus=1+s.combo*(.0025+m.combo*.004);
    dmg*=comboBonus;
    s.totalClicks++;
    if(Math.random()<clamp(m.goldTouch,0,.55)){
      const bonus=Math.max(1,s.chest.gold*.025*m.gold);
      s.gold+=bonus;s.totalGold+=bonus;
      addFloat(s,`+${fmt(bonus)}`,"#ffdf67",.8,rand(.41,.59),rand(.34,.48));
      addParticles(s,"coin",4,"#ffd45f");
    }
  }
  s.chest.hp=Math.max(0,s.chest.hp-dmg);
  s.chest.hitFlash=.11;s.chest.wobble=.18;
  s.totalDamage+=dmg;
  addFloat(s,fmt(dmg),crit?"#7dff9b":"#ffffff",crit?1.25:.95,rand(.43,.57),rand(.35,.47));
  if(crit)addParticles(s,"crit",6,"#7dff9b");
  if(s.chest.hp<=0)openChest(s);
  return {damage:dmg,crit};
}

export function clickChest(s){
  return dealDamage(s,calcActiveDamage(s),{source:"click",allowCrit:true});
}

function passiveTick(s,dt){
  if(!s.chest||s.chest.opened)return;
  const dps=calcPassiveDps(s);
  if(dps>0)dealDamage(s,dps*dt,{source:"passive",allowCrit:false});
  const m=getMods(s);
  if(m.idleGold>0){
    const g=dps*.025*m.idleGold*dt;
    s.gold+=g;s.totalGold+=g;
  }
  if(m.cannon>0){
    s.cannonTimer-=dt;
    if(s.cannonTimer<=0){
      s.cannonTimer=Math.max(1.35,5.2/(1+m.cannon*.16));
      dealDamage(s,calcActiveDamage(s)*(2.5+m.cannon),{source:"cannon",allowCrit:true});
      addParticles(s,"blast",10,"#ff9a5a");
    }
  }
}

export function update(s,dt){
  if(!s.chest)spawnChest(s,true);
  if(s.comboTimer>0){
    s.comboTimer-=dt;
    if(s.comboTimer<=0)s.combo=0;
  }
  if(s.chest){
    s.chest.hitFlash=Math.max(0,s.chest.hitFlash-dt);
    s.chest.wobble=Math.max(0,s.chest.wobble-dt);
  }
  if(s.pendingNext>0){
    s.pendingNext-=dt;
    if(s.pendingNext<=0){
      s.chestStage++;
      spawnChest(s,false);
    }
  }else passiveTick(s,dt);

  for(const p of s.particles){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.rot+=p.spin*dt;
  }
  s.particles=s.particles.filter(p=>p.life>0);
  for(const f of s.floats){
    f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;
  }
  s.floats=s.floats.filter(f=>f.life>0);
}

export function buyItem(s,id){
  const item=ITEMS.find(i=>i.id===id);if(!item||s.level<item.unlock)return false;
  const m=getMods(s),lv=s.itemLevels[id]||0,cost=itemCost(item,lv,m);
  if(s.gold<cost)return false;
  s.gold-=cost;s.itemLevels[id]=lv+1;
  return true;
}

export function equipCursor(s,id){
  const c=CURSORS.find(x=>x.id===id);if(!c||s.level<c.unlock)return false;
  s.equippedCursor=id;return true;
}

export function upgradeCursor(s,id){
  const c=CURSORS.find(x=>x.id===id);if(!c||s.level<c.unlock)return false;
  const lv=s.cursorLevels[id]||1;
  const cost=Math.floor(180*Math.pow(1.48,lv-1)*Math.pow(1.12,c.unlock));
  if(s.gold<cost)return false;
  s.gold-=cost;s.cursorLevels[id]=lv+1;return true;
}

export function skillCost(node,level){return node.cost*Math.max(1,1+Math.floor(level/3));}
export function buySkill(s,id){
  let node=null;
  for(const b of SKILL_BRANCHES){const n=b.nodes.find(x=>x.id===id);if(n){node=n;break;}}
  if(!node)return false;
  const lv=s.skills[id]||0;if(lv>=node.max)return false;
  if(node.requires && !(s.skills[node.requires]>0))return false;
  const cost=skillCost(node,lv);
  if(s.skillPoints<cost)return false;
  s.skillPoints-=cost;s.skills[id]=lv+1;return true;
}

export function ascensionGain(s){
  if(s.level<15)return 0;
  const m=getMods(s);
  return Math.max(1,Math.floor((s.level-10)/5 + Math.sqrt(Math.max(0,s.highestStage-15))/2)*m.ascend);
}

export function ascend(s){
  const gain=ascensionGain(s);if(gain<=0)return false;
  s.crownShards+=gain;s.prestigeCount++;
  const kept={
    skillPoints:s.skillPoints,crownShards:s.crownShards,skills:{...s.skills},ascension:{...s.ascension},
    treasures:{...s.treasures},cursorLevels:{...s.cursorLevels},equippedCursor:s.equippedCursor,
    highestStage:s.highestStage,prestigeCount:s.prestigeCount,stats:{...s.stats},settings:{...s.settings},
    totalClicks:s.totalClicks,totalGold:s.totalGold,totalDamage:s.totalDamage,totalXp:s.totalXp
  };
  Object.assign(s,defaultState(),kept);
  const m=getMods(s);
  s.chestStage=1+m.startStage;
  spawnChest(s,true);
  return gain;
}

export function buyAscension(s,id){
  const p=ASCENSION_PERKS.find(x=>x.id===id);if(!p)return false;
  const lv=s.ascension[id]||0,cost=Math.ceil(p.baseCost*Math.pow(p.costScale,lv));
  if(s.crownShards<cost)return false;
  s.crownShards-=cost;s.ascension[id]=lv+1;return true;
}

export function applyOfflineProgress(s,now=Date.now()){
  const last=s.lastSave||now;
  const seconds=clamp((now-last)/1000,0,8*3600);
  if(seconds<10)return {seconds:0,gold:0,chests:0};
  if(!s.chest)spawnChest(s,true);
  const m=getMods(s);
  let budget=calcPassiveDps(s)*seconds*clamp(.65*m.offline,.20,1.35);
  let goldBefore=s.gold,opened=0,guard=0;
  while(budget>0&&guard++<5000){
    const info=chestInfo(s.chestStage);
    if(budget>=info.hp){
      budget-=info.hp;
      let reward=info.gold*m.gold*(info.boss?m.bossGold:1);
      s.gold+=reward;s.totalGold+=reward;
      const xp=info.xp*m.xp;s.xp+=xp;s.totalXp+=xp;
      s.chestsOpened++;opened++;s.highestStage=Math.max(s.highestStage,s.chestStage);
      if(info.boss)s.stats.bosses++;
      s.chestStage++;
      levelUp(s);
    }else break;
  }
  spawnChest(s,true);
  s.lastSave=now;
  return {seconds,gold:s.gold-goldBefore,chests:opened};
}
