import { GA_CONFIG, CLASSES, COLORS, DIFFICULTIES, UPGRADES, UPGRADE_RARITIES, ENEMY_TYPES, TALENTS, getClassById, getColorById, getDifficulty } from './GeometryArenaData.js';

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const rand=(a=0,b=1)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
const norm=(x,y)=>{const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l}};
const angDiff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export function defaultProfile(){
  return {
    totalStars:0, lifetimeStars:0, fragments:0, geometryCoins:0, selectedClass:'soldier', selectedColor:'coral', difficulty:'F',
    classProficiency:Object.fromEntries(CLASSES.map(c=>[c.id,0])),
    talents:Object.fromEntries(CLASSES.map(c=>[c.id,Object.fromEntries(TALENTS.map(t=>[t.id,0]))])),
    settings:{light:4,screenShake:true,autoFire:false}, games:0, bestStage:'1-1', lifetimeKills:0,
  };
}

export function sanitizeProfile(raw){
  const d=defaultProfile(),p={...d,...(raw||{})};
  p.classProficiency={...d.classProficiency,...(raw?.classProficiency||{})};
  p.talents={...d.talents};
  for(const c of CLASSES)p.talents[c.id]={...d.talents[c.id],...(raw?.talents?.[c.id]||{})};
  p.settings={...d.settings,...(raw?.settings||{})};
  if(!CLASSES.some(c=>c.id===p.selectedClass))p.selectedClass='soldier';
  if(!COLORS.some(c=>c.id===p.selectedColor))p.selectedColor='coral';
  if(!DIFFICULTIES.some(dif=>dif.id===p.difficulty))p.difficulty='F';
  return p;
}

export function talentCost(talent,level){return Math.round(talent.baseCost*Math.pow(talent.scale,level));}
export function classUnlocked(profile,c){return (profile.lifetimeStars??profile.totalStars)>=c.unlock||c.id==='soldier';}

export function buyTalent(profile,classId,talentId){
  const t=TALENTS.find(x=>x.id===talentId);if(!t)return false;
  const level=profile.talents[classId]?.[talentId]||0;if(level>=t.max)return false;
  const cost=talentCost(t,level);if(profile.totalStars<cost)return false;
  profile.totalStars-=cost;profile.talents[classId][talentId]=level+1;return true;
}

export function buildStats(profile,classId,colorId){
  const c=getClassById(classId),col=getColorById(colorId),b={...c.base};
  const s={
    hpMax:b.hp,hp:b.hp,move:b.move,fireRate:b.fireRate,damage:b.damage,bulletSpeed:b.bulletSpeed,range:b.range,
    bodySize:b.bodySize,bulletSize:b.bulletSize,crit:b.crit,critEffect:b.critEffect,accuracy:b.accuracy,recoil:b.recoil,knockback:b.knockback,
    projectiles:1,spread:0,pierce:0,homing:0,ricochet:0,split:0,pickup:130,starGain:1,explosive:0,
  };
  for(const [k,v] of Object.entries(col.mods||{})){
    if(k==='hp'){s.hpMax*=v;s.hp*=v}else if(k in s)s[k]*=v;else s[k]=v;
  }
  const tl=profile.talents[classId]||{};
  s.hpMax+=2*(tl.hp||0);s.hp=s.hpMax;
  s.fireRate*=1+.06*(tl.fireRate||0);s.damage*=1+.08*(tl.damage||0);s.bulletSpeed*=1+.07*(tl.bulletSpeed||0);
  s.crit+=.025*(tl.crit||0);s.critEffect+=.1*(tl.critEffect||0);s.ultra=1+.12*(tl.ultra||0);
  return s;
}

export function createRun(profile){
  const classId=profile.selectedClass,colorId=profile.selectedColor;
  return {
    classId,colorId,stageMajor:1,stageMinor:1,difficultyId:'F',
    stats:buildStats(profile,classId,colorId), upgrades:[], stars:0, earnedStars:0, fragments:18, geometryCoins:0,
    rerollCost:0,storeRoll:[],score:0,kills:0,eliteKills:0,bossKills:0,wonStages:0,shotCounter:0,
    amuletUsed:false,alive:true,storeMessage:'18 starting fragments',storeMessageTime:2.5,
  };
}

export function stageLabel(run){return `${run.stageMajor}-${run.stageMinor}`;}
export function advanceStage(run){run.stageMinor++;if(run.stageMinor>5){run.stageMinor=1;run.stageMajor++;}}
export function runComplete(run){return run.stageMajor>4;}

function rarityWeight(rarity,diff){
  let w=UPGRADE_RARITIES[rarity].weight;
  if(rarity==='rare')w*=diff.rare;if(rarity==='epic')w*=diff.epic;if(rarity==='legendary')w*=Math.max(.6,diff.epic*.65);
  return w;
}
function rollUpgrade(run,exclude=[]){
  const d=getDifficulty(run.difficultyId),pool=UPGRADES.filter(u=>!exclude.includes(u.id));let sum=0;
  const weights=pool.map(u=>{const w=rarityWeight(u.rarity,d);sum+=w;return w});let r=Math.random()*sum;
  for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i]}return pool[pool.length-1];
}
export function rollStore(run){
  const out=[],used=[];
  for(let i=0;i<3;i++){
    const starter=i===0&&run.stageMajor===1&&run.stageMinor===1&&run.upgrades.length===0;
    let u;
    if(starter){const pool=UPGRADES.filter(x=>x.rarity==='common');u=pick(pool);}else u=rollUpgrade(run,used);
    used.push(u.id);const rc=UPGRADE_RARITIES[u.rarity].cost,stageMul=1+(run.stageMajor-1)*.18+(run.stageMinor-1)*.05;
    const cost=starter?Math.min(6,Math.max(1,Math.round(rand(rc[0],rc[1]+1)))):Math.max(1,Math.round(rand(rc[0],rc[1]+1)*stageMul));
    out.push({...u,cost});
  }
  run.storeRoll=out;return out;
}
export function rerollStore(run){const cost=run.rerollCost; if(run.fragments<cost)return false;run.fragments-=cost;run.rerollCost=Math.min(12,cost+1);rollStore(run);return true;}
export function buyUpgrade(run,index){
  const u=run.storeRoll[index];
  if(!u){run.storeMessage='That slot is already purchased.';run.storeMessageTime=1.8;return false;}
  if(run.fragments<u.cost){run.storeMessage=`Need ${u.cost-run.fragments} more fragments.`;run.storeMessageTime=2.2;return false;}
  run.fragments-=u.cost;run.upgrades.push(u.id);u.apply(run.stats);run.storeRoll[index]=null;
  run.storeMessage=`${u.name} acquired`;run.storeMessageTime=2.2;return true;
}

function particle(world,x,y,color,count=8,speed=100,size=3,life=.45,kind='dot'){
  const light=world.profile?.settings?.light||4,cap=Math.min(GA_CONFIG.maxParticles,450+light*290);if(world.particles.length>cap+64)world.particles.splice(0,world.particles.length-cap);
  const scale=(world.fxDensity||1)*(world.performanceScale||1),count2=Math.max(1,Math.round(count*scale));
  for(let i=0;i<count2;i++){const a=rand(0,Math.PI*2),s=rand(speed*.25,speed);world.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(life*.55,life),maxLife:life,size:rand(size*.5,size*1.45),color,kind,rot:rand(0,6.28),spin:rand(-6,6)});}
}
function lineFx(world,x1,y1,x2,y2,color,life=.14,width=3){world.lines.push({x1,y1,x2,y2,color,life,maxLife:life,width});}
function ringFx(world,x,y,color,r=8,vr=140,life=.35,width=3){world.rings.push({x,y,color,r,vr,life,maxLife:life,width});}
function textFx(world,x,y,text,color='#fff',size=20){world.texts.push({x,y,text,color,size,life:.7,maxLife:.7,vy:-28});}
function shake(world,v){world.shake=Math.max(world.shake,v);}

export function createWorld(run,profile,previous=null){
  const c=getClassById(run.classId),col=getColorById(run.colorId),d=getDifficulty(run.difficultyId);
  const bossStage=run.stageMinor===5;
  const diffIndex=Math.max(0,DIFFICULTIES.findIndex(x=>x.id===run.difficultyId));
  const baseCount=7+(run.stageMajor-1)*5+(run.stageMinor-1)*2;
  const waveTarget=Math.max(4,Math.round(baseCount*d.enemyCount*(bossStage?.65:1)));
  const startX=previous?.player?.x??500,startY=previous?.player?.y??520;
  const world={
    run,profile,classDef:c,colorDef:col,diff:d,time:0,battleTime:0,phase:'prepare',
    spawnTimer:.5,enemySerial:0,waveTarget,spawnedEnemies:0,spawnComplete:false,victoryDelay:0,bossStage,
    concurrentCap:Math.max(4,Math.min(24,5+diffIndex*2+run.stageMajor+Math.floor(run.stageMinor/2))),
    player:{x:startX,y:startY,vx:0,vy:0,angle:previous?.player?.angle??-Math.PI/2,radius:16*run.stats.bodySize,fireCd:0,skillCd:0,skillActive:0,hitFlash:0,invuln:0,spin:previous?.player?.spin??0,tornadoCharge:0},
    enemies:[],spawnWarnings:[],bullets:[],enemyBullets:[],pickups:[],minions:[],mines:[],particles:[],lines:[],rings:[],texts:[],
    mouse:{x:previous?.mouse?.x??500,y:previous?.mouse?.y??350,down:false},keys:new Set(),ended:false,won:false,spawnBoss:false,boss:null,shake:0,flash:0,flashColor:'#fff',fxDensity:clamp((profile.settings.light||4)/3,0.45,1.65),
    performanceScale:1,stableFrames:0,damageWindow:0,damageWindowTime:0,dps:0,stageStars:0,stageFragments:0,stageCoins:0,killsAtStart:run.kills,clearRewarded:false,bossWarningQueued:false,
  };
  if(c.id==='summoner')for(let i=0;i<2;i++)spawnMinion(world,true);
  if(c.id==='swordmaster')for(let i=0;i<2;i++)spawnMinion(world,true,'blade');
  return world;
}

function spawnMinion(world,permanent=false,type='drone'){
  world.minions.push({angle:rand(0,6.28),radius:55+world.minions.length*7,fireCd:rand(0,.7),life:permanent?999:8,type});
}

function enemyScale(world){return 1+(world.run.stageMajor-1)*.48+(world.run.stageMinor-1)*.12;}
function spawnPoint(world){
  const m=45,p=world.player;let point=null;
  // Keep telegraphed spawns away from the player when possible so the warning is actionable.
  for(let tries=0;tries<8;tries++){
    const side=(Math.random()*4)|0;
    point=side===0?{x:rand(m,955),y:m,side}:side===1?{x:955,y:rand(m,955),side}:side===2?{x:rand(m,955),y:955,side}:{x:m,y:rand(m,955),side};
    if(!p||Math.hypot(point.x-p.x,point.y-p.y)>190)break;
  }
  return point;
}
function chooseEnemyType(world){const max=Math.min(ENEMY_TYPES.length,2+world.run.stageMajor+Math.floor(world.run.stageMinor/2));return ENEMY_TYPES[(Math.random()*max)|0];}
function queueSpawnWarning(world,{boss=false,forceElite=false}={}){
  const t=boss?null:chooseEnemyType(world),p=boss?{x:500,y:130,side:0}:spawnPoint(world),elite=boss||forceElite||Math.random()<world.diff.elite;
  const duration=boss?1.35:clamp(.9-Math.max(0,difficultyIndex(world.run.difficultyId))*.035,.58,.9);
  world.spawnWarnings.push({x:p.x,y:p.y,side:p.side??0,time:duration,maxTime:duration,type:t?.id||'boss',shape:t?.shape||'boss',elite,boss,color:boss?world.colorDef.hex:t.color});
}
function spawnEnemyAt(world,w){
  const t=ENEMY_TYPES.find(x=>x.id===w.type)||chooseEnemyType(world),scale=enemyScale(world),elite=!!w.elite;
  const e={id:++world.enemySerial,type:t.id,shape:t.shape,x:w.x,y:w.y,vx:0,vy:0,radius:t.radius*(elite?1.32:1),hp:t.hp*scale*world.diff.hp*(elite?4.2:1),maxHp:0,speed:t.speed*world.diff.speed*(elite?.85:1),score:t.score,contact:t.contact*world.diff.damage*(elite?1.6:1),shootCd:t.shoot?rand(.4,1.5):999,shootRate:t.shoot?Math.max(.34,1.65-t.shoot):999,color:t.color,elite,rot:rand(0,6.28),spin:rand(-2,2),hit:0,dead:false,spawnGlow:.22};e.maxHp=e.hp;world.enemies.push(e);ringFx(world,e.x,e.y,e.color,5,95,.25,2);return e;
}
function spawnBossAt(world,w){
  const scale=enemyScale(world)*world.diff.hp;
  const b={id:++world.enemySerial,type:'boss',shape:'boss',x:w.x,y:w.y,vx:0,vy:0,radius:62+world.run.stageMajor*4,hp:(1100+world.run.stageMajor*780)*scale,maxHp:0,speed:38*world.diff.speed,score:400,contact:4*world.diff.damage,shootCd:.6,shootRate:.85,color:world.colorDef.hex,elite:true,boss:true,rot:0,spin:.7,hit:0,dead:false,phase:0,spawnGlow:.35};b.maxHp=b.hp;world.enemies.push(b);world.boss=b;world.spawnBoss=true;ringFx(world,b.x,b.y,b.color,15,210,.8,5);return b;
}

function shootEnemy(world,e){
  const p=world.player,n=norm(p.x-e.x,p.y-e.y),speed=e.boss?220:170;const shots=e.boss?(e.phase>1?9:6):(e.elite?3:1);
  const base=Math.atan2(n.y,n.x),spread=e.boss?Math.PI*.72:(e.elite?.24:0);
  for(let i=0;i<shots;i++){const off=shots===1?0:(i-(shots-1)/2)*spread/Math.max(1,shots-1),a=base+off;world.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:e.boss?7:5,life:5,color:e.boss?world.colorDef.hex:e.color,damage:e.boss?2*world.diff.damage:1*world.diff.damage});if(world.enemyBullets.length>GA_CONFIG.maxEnemyBullets)world.enemyBullets.splice(0,world.enemyBullets.length-GA_CONFIG.maxEnemyBullets);}
  particle(world,e.x,e.y,e.color,e.boss?18:5,e.boss?160:75,e.boss?4:2,.35);shake(world,e.boss?2:.4);
}

function bulletBase(world,x,y,a,damageMul=1,sizeMul=1,opts={}){
  const s=world.run.stats,acc=(1-s.accuracy)*.22,a2=a+rand(-acc,acc),speed=s.bulletSpeed*11;
  const crit=Math.random()<Math.min(.95,s.crit);let dmg=s.damage*damageMul*(s.ultra||1)*(crit?s.critEffect:1);
  if(world.player.skillActive>0&&world.classDef.id==='sniper')dmg*=1.7;
  const b={x,y,px:x,py:y,vx:Math.cos(a2)*speed,vy:Math.sin(a2)*speed,r:4.2*s.bulletSize*sizeMul,life:s.range/11,age:0,damage:dmg,crit,color:world.colorDef.hex,pierce:s.pierce||0,bounces:s.ricochet||0,homing:s.homing||0,split:s.split||0,explosive:s.explosive||0,fromMinion:!!opts.fromMinion,heavy:!!opts.heavy};
  world.bullets.push(b);if(world.bullets.length>GA_CONFIG.maxPlayerBullets)world.bullets.splice(0,world.bullets.length-GA_CONFIG.maxPlayerBullets);return b;
}

function playerMuzzle(world,a){const p=world.player;return{x:p.x+Math.cos(a)*p.radius*1.15,y:p.y+Math.sin(a)*p.radius*1.15};}
export function firePlayer(world,forced=false){
  if(world.ended)return false;const p=world.player,s=world.run.stats,c=world.classDef;if(!forced&&p.fireCd>0)return false;
  let a=p.angle,proj=s.projectiles||1,spread=s.spread||0;
  if(c.id==='shotgun'){proj+=5;spread+=.55}
  if(c.id==='prism'){proj+=1;spread+=.18;if(p.skillActive>0){proj+=4;spread+=.65;}}
  const muzzle=playerMuzzle(world,a);
  for(let i=0;i<proj;i++){const o=proj===1?0:(i-(proj-1)/2)*spread/Math.max(1,proj-1);bulletBase(world,muzzle.x,muzzle.y,a+o,c.id==='shotgun'?.68:1,c.id==='shotgun'?.72:1);}
  if(c.id==='cannon'){const b=world.bullets[world.bullets.length-1];b.heavy=true;b.r*=1.55;b.explosive=Math.max(b.explosive,.65);b.damage*=1.25;}
  if(c.id==='ranger')for(let i=world.bullets.length-proj;i<world.bullets.length;i++)world.bullets[i].homing=Math.max(world.bullets[i].homing,p.skillActive>0?3:1);
  if(c.id==='prism')for(let i=world.bullets.length-proj;i<world.bullets.length;i++)world.bullets[i].split=Math.max(world.bullets[i].split,1);
  if(c.id==='sniper'){const b=world.bullets[world.bullets.length-1];b.pierce+=2;b.r*=.68;lineFx(world,muzzle.x,muzzle.y,muzzle.x+Math.cos(a)*70,muzzle.y+Math.sin(a)*70,world.colorDef.hex,.09,2);}
  world.run.shotCounter++;
  if(s.prismatic&&world.run.shotCounter%5===0)for(let i=0;i<6;i++)bulletBase(world,p.x,p.y,i*Math.PI/3,.7,.8);
  p.fireCd=1/Math.max(.15,s.fireRate*(c.id==='tornado'?(1+p.tornadoCharge*.6):1)*(p.skillActive>0&&c.id==='soldier'?1.9:1));
  const recoil=s.recoil*20*(s.reverseRecoil?-1:1);p.vx-=Math.cos(a)*recoil;p.vy-=Math.sin(a)*recoil;
  particle(world,muzzle.x,muzzle.y,world.colorDef.hex,c.id==='cannon'?14:5,c.id==='cannon'?180:90,c.id==='cannon'?4:2,.18,'spark');
  lineFx(world,p.x,p.y,muzzle.x+Math.cos(a)*22,muzzle.y+Math.sin(a)*22,world.colorDef.hex,.08,c.id==='cannon'?5:2);
  return true;
}

export function useSkill(world){
  const p=world.player,c=world.classDef;if(world.ended||p.skillCd>0)return false;
  const col=world.colorDef.hex;
  if(c.id==='soldier'){p.skillActive=4;p.skillCd=10;ringFx(world,p.x,p.y,col,10,150,.5,3);}
  else if(c.id==='cannon'){const m=playerMuzzle(world,p.angle);const b=bulletBase(world,m.x,m.y,p.angle,4.2,2.4,{heavy:true});b.explosive=1.8;b.pierce+=2;p.skillCd=9;shake(world,7);}
  else if(c.id==='ranger'){p.skillActive=5;p.skillCd=11;ringFx(world,p.x,p.y,col,12,180,.4,3);}
  else if(c.id==='summoner'){for(let i=0;i<3;i++)spawnMinion(world,false);p.skillCd=10;}
  else if(c.id==='core'){radialBlast(world,p.x,p.y,160,world.run.stats.damage*2.2,col,true);p.invuln=1.1;p.skillCd=11;}
  else if(c.id==='swordmaster'){for(const m of world.minions.filter(x=>x.type==='blade')){const a=m.angle;bulletBase(world,p.x+Math.cos(a)*m.radius,p.y+Math.sin(a)*m.radius,a,2.2,1.5,{heavy:true}).pierce+=5;}p.skillCd=7;}
  else if(c.id==='tornado'){p.tornadoCharge=Math.min(1,p.tornadoCharge+.55);p.skillActive=5;p.skillCd=9;ringFx(world,p.x,p.y,col,20,250,.6,4);}
  else if(c.id==='prism'){p.skillActive=6;p.skillCd=10;ringFx(world,p.x,p.y,col,12,180,.45,3);}
  else if(c.id==='shotgun'){for(let i=0;i<28;i++)bulletBase(world,p.x,p.y,i*Math.PI*2/28,1.25,.7);p.skillCd=8;shake(world,5);}
  else if(c.id==='magician'){for(let i=0;i<4;i++){ringFx(world,p.x,p.y,col,15+i*16,180+i*40,.8,4);}radialBlast(world,p.x,p.y,220,world.run.stats.damage*2.5,col,false);p.skillCd=10;}
  else if(c.id==='destroyer'){radialBlast(world,p.x,p.y,260,world.run.stats.damage*7,col,false);p.skillCd=12;shake(world,12);world.flash=.2;world.flashColor=col;}
  else if(c.id==='sniper'){p.skillActive=5;p.skillCd=12;ringFx(world,p.x,p.y,col,14,120,.5,2);}
  return true;
}

function radialBlast(world,x,y,r,damage,color,clearBullets=false){
  ringFx(world,x,y,color,8,r*2.3,.45,6);particle(world,x,y,color,42,250,5,.55,'spark');
  for(const e of world.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<r+e.radius)damageEnemy(world,e,damage,false);
  if(clearBullets)world.enemyBullets=world.enemyBullets.filter(b=>Math.hypot(b.x-x,b.y-y)>r);
}
function explosion(world,x,y,r,damage,color){ringFx(world,x,y,color,5,r*3,.35,4);particle(world,x,y,color,18+Math.round(r/5),220,4,.5,'spark');for(const e of world.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<r+e.radius)damageEnemy(world,e,damage,false);shake(world,Math.min(8,r/18));}

function damageEnemy(world,e,amount,crit){
  if(e.dead)return; e.hp-=amount;e.hit=.12;world.damageWindow+=amount;world.damageWindowTime=.7;
  textFx(world,e.x+rand(-8,8),e.y-e.radius,Math.round(amount).toString(),crit?'#fff0a1':'#ff9ea4',crit?20:15);
  particle(world,e.x,e.y,e.color,crit?7:3,85,2.2,.25,'spark');
  if(e.hp<=0)killEnemy(world,e);
}
function killEnemy(world,e){
  if(e.dead)return;e.dead=true;const s=world.run.stats,d=world.diff;
  const star=Math.max(1,Math.round(e.score*d.star*(s.starGain||1)*(e.elite?2.2:1)*(e.boss?5:1)));
  world.run.stars+=star;world.run.earnedStars+=star;world.run.score+=star*10;world.stageStars+=star;world.run.kills++;if(e.elite)world.run.eliteKills++;if(e.boss)world.run.bossKills++;
  textFx(world,e.x,e.y-8,`+${star} ★`,'#fff',16);particle(world,e.x,e.y,e.color,e.boss?90:e.elite?35:15,e.boss?300:180,e.boss?7:4,e.boss?.9:.5,'poly');ringFx(world,e.x,e.y,e.color,e.radius*.3,e.boss?320:180,e.boss?.8:.4,e.boss?8:3);
  // Fragments are the run's build currency, so ordinary kills should feed the store frequently.
  const fragmentMul=world.diff.fragment||1;
  const fragChance=e.boss?1:e.elite?.98:clamp(.72*fragmentMul,.66,.96);
  if(Math.random()<fragChance){
    const n=e.boss?12+world.run.stageMajor*3:e.elite?(rand(3,6)|0):1+(Math.random()<.16*fragmentMul?1:0);
    for(let i=0;i<n;i++)world.pickups.push({x:e.x+rand(-15,15),y:e.y+rand(-15,15),vx:rand(-70,70),vy:rand(-70,70),r:6,type:'fragment',value:1,life:14});
  }
  if(Math.random()<(e.boss?.35:.008)){world.pickups.push({x:e.x,y:e.y,vx:0,vy:0,r:8,type:'coin',value:1,life:15});}
  if(s.burstKill)explosion(world,e.x,e.y,95,s.damage*2.8,'#ffac61');
  if(s.chainKill&&Math.random()<s.chainKill)explosion(world,e.x,e.y,70,s.damage*1.7,world.colorDef.hex);
  if(s.lifeSpark&&Math.random()<.18)s.hp=Math.min(s.hpMax,s.hp+.5);
  if(e.boss&&s.terminator)for(const other of world.enemies)if(!other.dead&&!other.boss)other.hp=0,killEnemy(world,other);
  shake(world,e.boss?14:e.elite?4:1.2);if(e.boss){world.flash=.3;world.flashColor=e.color;}
}

function applyPlayerDamage(world,amount){
  const p=world.player,s=world.run.stats;if(p.invuln>0||world.ended)return;
  if(s.wheel&&Math.random()<.85){s.hp=Math.min(s.hpMax,s.hp+amount);textFx(world,p.x,p.y-28,'HEAL','#9cffab',18);ringFx(world,p.x,p.y,'#9cffab',7,90,.35,3);return;}
  s.hp-=amount;p.invuln=.55;p.hitFlash=.2;shake(world,6);world.flash=.08;world.flashColor='#ff5664';particle(world,p.x,p.y,'#ff6674',18,170,4,.4,'spark');
  if(s.revenge){p.skillActive=Math.max(p.skillActive,.9);world.revengeTimer=.9;}
  if(s.hp<=0){
    if(s.amulet&&s.amuletReady){s.amuletReady=false;s.hp=s.hpMax;radialBlast(world,p.x,p.y,300,s.damage*8,'#ff9a50',true);textFx(world,p.x,p.y-38,'AMULET','#ffb071',24);}
    else{world.ended=true;world.won=false;world.run.alive=false;world.flash=.4;world.flashColor='#ff4358';}
  }
}

function updatePlayer(world,dt,input){
  const p=world.player,s=world.run.stats,c=world.classDef;let dx=0,dy=0;
  if(input.left)dx--;if(input.right)dx++;if(input.up)dy--;if(input.down)dy++;if(dx||dy){const n=norm(dx,dy);dx=n.x;dy=n.y;}
  let move=s.move*36*(p.skillActive>0&&c.id==='soldier'?1.25:1)*(c.id==='tornado'?(1+p.tornadoCharge*.25):1);
  p.vx+=dx*move*dt*7;p.vy+=dy*move*dt*7;const drag=Math.pow(.0009,dt);p.vx*=drag;p.vy*=drag;const max=move*1.12,vl=Math.hypot(p.vx,p.vy);if(vl>max){p.vx=p.vx/vl*max;p.vy=p.vy/vl*max;}
  p.x=clamp(p.x+p.vx*dt,22,978);p.y=clamp(p.y+p.vy*dt,22,978);
  if(world.profile.settings.autoFire&&world.phase==='battle'&&world.enemies.length){let target=null,best=Infinity;for(const e of world.enemies){if(e.dead)continue;const dd=dist2(p,e);if(dd<best){best=dd;target=e}}if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);else p.angle=Math.atan2(world.mouse.y-p.y,world.mouse.x-p.x);}else p.angle=Math.atan2(world.mouse.y-p.y,world.mouse.x-p.x);p.fireCd=Math.max(0,p.fireCd-dt);p.skillCd=Math.max(0,p.skillCd-dt);p.skillActive=Math.max(0,p.skillActive-dt);p.invuln=Math.max(0,p.invuln-dt);p.hitFlash=Math.max(0,p.hitFlash-dt);
  if(c.id==='tornado'){if(world.mouse.down||world.profile.settings.autoFire)p.tornadoCharge=clamp(p.tornadoCharge+dt*.22,0,1);else p.tornadoCharge=clamp(p.tornadoCharge-dt*.32,0,1);p.spin+=dt*(5+22*p.tornadoCharge);}
  if((world.mouse.down||world.profile.settings.autoFire))firePlayer(world);
  if(world.revengeTimer>0){world.revengeTimer-=dt;}
  if(s.superMine){world.mineTimer=(world.mineTimer||0)-dt;if(world.mineTimer<=0){world.mineTimer=2.2;world.mines.push({x:p.x,y:p.y,r:10,life:4,maxLife:4,color:world.colorDef.hex});}}
}

function updateMinions(world,dt){
  const p=world.player,s=world.run.stats;
  for(const m of world.minions){m.angle+=dt*(m.type==='blade'?2.5:1.35);m.life-=dt;m.fireCd-=dt;const x=p.x+Math.cos(m.angle)*m.radius,y=p.y+Math.sin(m.angle)*m.radius;m.x=x;m.y=y;
    if(m.type==='drone'&&m.fireCd<=0){let target=null,best=1e9;for(const e of world.enemies)if(!e.dead){const d=dist2(m,e);if(d<best){best=d;target=e}}if(target){const a=Math.atan2(target.y-y,target.x-x);bulletBase(world,x,y,a,.55,.65,{fromMinion:true});m.fireCd=.65;}}
    if(m.type==='blade')for(const e of world.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<e.radius+9){damageEnemy(world,e,s.damage*dt*3.5,false);}
  }
  world.minions=world.minions.filter(m=>m.life>0);
}

function updateMines(world,dt){
  for(const m of world.mines){m.life-=dt;m.r+=dt*20;if(m.life<=0){explosion(world,m.x,m.y,120,world.run.stats.damage*3,m.color);m.dead=true;}else for(const e of world.enemies)if(!e.dead&&Math.hypot(e.x-m.x,e.y-m.y)<m.r+e.radius){explosion(world,m.x,m.y,100,world.run.stats.damage*2.5,m.color);m.dead=true;break;}}
  world.mines=world.mines.filter(m=>!m.dead);
}

function spatialBuckets(items,cell=125){
  const map=new Map();
  for(const it of items){if(it.dead)continue;const gx=Math.floor(it.x/cell),gy=Math.floor(it.y/cell),k=gx+gy*32;let a=map.get(k);if(!a)map.set(k,a=[]);a.push(it);}
  return {map,cell};
}
function visitNearby(bucket,x,y,fn){
  const gX=Math.floor(x/bucket.cell),gY=Math.floor(y/bucket.cell);
  for(let yy=gY-1;yy<=gY+1;yy++)for(let xx=gX-1;xx<=gX+1;xx++){const a=bucket.map.get(xx+yy*32);if(!a)continue;for(let i=0;i<a.length;i++)if(fn(a[i]))return true;}
  return false;
}
function updateBullets(world,dt){
  const s=world.run.stats,enemyGrid=spatialBuckets(world.enemies),enemyBulletGrid=spatialBuckets(world.enemyBullets);
  for(const b of world.bullets){b.px=b.x;b.py=b.y;b.age+=dt;b.life-=dt;
    if(b.homing&&world.enemies.length){let target=null,best=190*190*(1+b.homing*.4);visitNearby(enemyGrid,b.x,b.y,e=>{const d=dist2(b,e);if(d<best){best=d;target=e}return false;});if(target){const speed=Math.hypot(b.vx,b.vy),cur=Math.atan2(b.vy,b.vx),want=Math.atan2(target.y-b.y,target.x-b.x),a=cur+angDiff(cur,want)*clamp(dt*(1.8+b.homing),0,1);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}}
    if(s.intensify){b.r*=1+dt*.22;b.damage*=1+dt*.18;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<0||b.x>1000){if(b.bounces>0){b.vx*=-1;b.bounces--;b.x=clamp(b.x,0,1000)}else b.life=0}
    if(b.y<0||b.y>1000){if(b.bounces>0){b.vy*=-1;b.bounces--;b.y=clamp(b.y,0,1000)}else b.life=0}
    if(b.life<=0)continue;
    visitNearby(enemyGrid,b.x,b.y,e=>{if(e.dead||b.life<=0)return b.life<=0;const rr=e.radius+b.r,dx=e.x-b.x,dy=e.y-b.y;if(dx*dx+dy*dy<=rr*rr){damageEnemy(world,e,b.damage,b.crit);if(b.explosive)explosion(world,b.x,b.y,52+50*b.explosive,b.damage*b.explosive,b.color);if(b.split>0){const a=Math.atan2(b.vy,b.vx);for(const off of [-.6,.6]){const child=bulletBase(world,b.x,b.y,a+off,.55,.68);child.split=b.split-1;child.life*=.65;}}if(b.pierce>0)b.pierce--;else b.life=0;}return b.life<=0;});
    if(b.life<=0)continue;
    visitNearby(enemyBulletGrid,b.x,b.y,eb=>{if(eb.dead)return false;const rr=eb.r+b.r,dx=eb.x-b.x,dy=eb.y-b.y;if(dx*dx+dy*dy<rr*rr){eb.dead=true;if(b.pierce>0)b.pierce--;else b.life=0;particle(world,eb.x,eb.y,b.color,4,90,2,.22,'spark');}return b.life<=0;});
  }
  world.bullets=world.bullets.filter(b=>b.life>0);
  world.enemyBullets=world.enemyBullets.filter(b=>!b.dead&&b.life>0);
}

function updateEnemies(world,dt){
  const p=world.player;
  for(const e of world.enemies){if(e.dead)continue;e.rot+=e.spin*dt;e.hit=Math.max(0,e.hit-dt);const n=norm(p.x-e.x,p.y-e.y),desired=e.boss?160:70;
    const d=Math.hypot(p.x-e.x,p.y-e.y);let mv=d>desired?1:-.28;if(e.type==='triangle')mv=1;
    e.vx=lerp(e.vx,n.x*e.speed*mv,dt*2.4);e.vy=lerp(e.vy,n.y*e.speed*mv,dt*2.4);e.x=clamp(e.x+e.vx*dt,15,985);e.y=clamp(e.y+e.vy*dt,15,985);
    e.shootCd-=dt;if(e.shootCd<=0){shootEnemy(world,e);e.shootCd=e.shootRate*(e.boss?(1-.08*Math.min(4,world.run.stageMajor)):1);}
    if(e.boss){const ratio=e.hp/e.maxHp;e.phase=ratio<.35?2:ratio<.7?1:0;if(Math.random()<dt*(e.phase+.25)){const a=rand(0,6.28),r=rand(90,220);world.enemyBullets.push({x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r,vx:-Math.sin(a)*100,vy:Math.cos(a)*100,r:6,life:4,color:e.color,damage:1.5*world.diff.damage});}}
    if(d<e.radius+p.radius){applyPlayerDamage(world,e.contact);p.vx-=n.x*130;p.vy-=n.y*130;e.vx+=n.x*160;e.vy+=n.y*160;}
  }
  world.enemies=world.enemies.filter(e=>!e.dead);
}

function updateEnemyBullets(world,dt){
  const p=world.player;
  for(const b of world.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.radius){b.dead=true;applyPlayerDamage(world,b.damage);}}
  world.enemyBullets=world.enemyBullets.filter(b=>!b.dead&&b.life>0&&b.x>-80&&b.x<1080&&b.y>-80&&b.y<1080);
}

function updatePickups(world,dt){
  const p=world.player,s=world.run.stats,basePr=s.pickup||130;
  for(const a of world.pickups){
    a.life-=dt;a.age=(a.age||0)+dt;a.vx*=Math.pow(.2,dt);a.vy*=Math.pow(.2,dt);
    const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);
    // Fragments drift for a moment, then stream toward the player. This keeps the economy reliable
    // without removing the satisfying on-field pickup visual.
    const pr=a.type==='fragment'&&a.age>.45?Math.max(basePr,1150):basePr;
    if(d<pr){const k=clamp(1-d/pr,0,1);const accel=a.type==='fragment'&&a.age>.45?1450:800;a.vx+=dx/(d||1)*dt*accel*(.3+.7*k);a.vy+=dy/(d||1)*dt*accel*(.3+.7*k);}
    a.x+=a.vx*dt;a.y+=a.vy*dt;
    if(d<p.radius+a.r+4){a.dead=true;if(a.type==='fragment'){world.run.fragments+=a.value;world.stageFragments+=a.value;textFx(world,p.x,p.y-22,`+${a.value}`,'#fff',14)}else{world.run.geometryCoins+=a.value;world.stageCoins+=a.value;textFx(world,p.x,p.y-22,'GEOMETRY COIN!','#eaff8c',16)}}
  }
  world.pickups=world.pickups.filter(a=>!a.dead&&a.life>0);
}

function updateFx(world,dt){
  for(const p of world.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);p.rot+=p.spin*dt;}
  world.particles=world.particles.filter(p=>p.life>0);
  for(const l of world.lines)l.life-=dt;world.lines=world.lines.filter(l=>l.life>0);
  for(const r of world.rings){r.life-=dt;r.r+=r.vr*dt;}world.rings=world.rings.filter(r=>r.life>0);
  for(const t of world.texts){t.life-=dt;t.y+=t.vy*dt;}world.texts=world.texts.filter(t=>t.life>0);
  world.shake*=Math.pow(.05,dt);world.flash=Math.max(0,world.flash-dt);
}

function spawnLogic(world,dt){
  const bossStage=world.bossStage;

  // Telegraph every spawn before it becomes dangerous.
  for(const w of world.spawnWarnings)w.time-=dt;
  for(const w of world.spawnWarnings){
    if(w.time<=0&&!w.done){w.done=true;if(w.boss)spawnBossAt(world,w);else spawnEnemyAt(world,w);}
  }
  world.spawnWarnings=world.spawnWarnings.filter(w=>!w.done);

  if(bossStage&&!world.spawnBoss&&!world.bossWarningQueued&&world.time>.55){world.bossWarningQueued=true;queueSpawnWarning(world,{boss:true});}

  world.spawnTimer-=dt;
  const regularTarget=world.waveTarget;
  const occupied=world.enemies.length+world.spawnWarnings.filter(w=>!w.boss).length;
  if(world.spawnedEnemies<regularTarget&&occupied<world.concurrentCap&&world.spawnTimer<=0){
    const diffBoost=1+Math.max(0,difficultyIndex(world.run.difficultyId))*.08;
    const interval=Math.max(.18,.78/diffBoost/(1+world.run.stageMajor*.055));
    world.spawnTimer=rand(interval*.82,interval*1.22);
    let n=1;
    if(world.diff.enemyCount>1.8&&Math.random()<.24)n=2;
    for(let i=0;i<n&&world.spawnedEnemies<regularTarget&&occupied+i<world.concurrentCap;i++){
      queueSpawnWarning(world);world.spawnedEnemies++;
    }
  }
  world.spawnComplete=world.spawnedEnemies>=regularTarget;
  if(world.boss?.dead)world.boss=null;
  const combatDone=world.spawnComplete&&world.enemies.length===0&&world.spawnWarnings.length===0&&(!bossStage||world.spawnBoss&&!world.boss);
  if(combatDone){
    if(!world.clearRewarded){
      world.clearRewarded=true;
      const bonus=2+world.run.stageMinor+Math.floor((world.run.stageMajor-1)/2)+Math.floor(difficultyIndex(world.run.difficultyId)/2);
      world.run.fragments+=bonus;world.stageFragments+=bonus;textFx(world,world.player.x,world.player.y-48,`WAVE CLEAR  +${bonus} ◧`,'#dfffff',18);
    }
    world.victoryDelay+=dt;world.enemyBullets.length=0;if(world.victoryDelay>.85){world.ended=true;world.won=true;}
  }else world.victoryDelay=0;
}

export function updateWorld(world,dt,input,phase='battle'){
  if(world.ended){updateFx(world,dt);return;}dt=Math.min(.034,dt);world.phase=phase;
  if(dt>.026)world.performanceScale=Math.max(.45,world.performanceScale-.035);else if(dt<.019)world.performanceScale=Math.min(1,world.performanceScale+.006);
  world.time+=dt;
  updatePlayer(world,dt,input);updateMinions(world,dt);updateMines(world,dt);
  if(phase==='battle')spawnLogic(world,dt);
  updateBullets(world,dt);
  if(phase==='battle'){updateEnemies(world,dt);updateEnemyBullets(world,dt);updatePickups(world,dt);}else{world.enemyBullets.length=0;world.enemies.length=0;world.pickups.length=0;}
  updateFx(world,dt);
  if(world.run.storeMessageTime>0)world.run.storeMessageTime=Math.max(0,world.run.storeMessageTime-dt);
  if(world.damageWindowTime>0){world.damageWindowTime-=dt;world.dps=lerp(world.dps,world.damageWindow/.7,.08);if(world.damageWindowTime<=0)world.damageWindow=0;}else world.dps*=Math.pow(.7,dt);
}

export function finishStage(world,profile){
  const run=world.run;if(!world.won)return;
  run.wonStages++;profile.totalStars+=world.stageStars;profile.lifetimeStars=(profile.lifetimeStars||0)+world.stageStars;profile.fragments+=world.stageFragments;profile.geometryCoins+=world.stageCoins;profile.lifetimeKills+=Math.max(0,run.kills-world.killsAtStart);run.stats.hp=run.stats.hpMax;
  const profGain=1+Math.floor((world.stageStars+world.run.eliteKills*5)/200);profile.classProficiency[run.classId]=(profile.classProficiency[run.classId]||0)+profGain;
  profile.bestStage=stageLabel(run);advanceStage(run);rollStore(run);
}

export function finalizeRun(run,profile){
  profile.games=(profile.games||0)+1;profile.totalStars+=Math.round(run.earnedStars*.12);profile.fragments+=Math.round(run.fragments*.18);profile.geometryCoins+=run.geometryCoins;
}

export function setDifficulty(run,profile,id){if(!DIFFICULTIES.some(d=>d.id===id))return false;run.difficultyId=id;profile.difficulty=id;return true;}

export function difficultyIndex(id){return Math.max(0,DIFFICULTIES.findIndex(d=>d.id===id));}
export function nextDifficulty(id){return DIFFICULTIES[Math.min(DIFFICULTIES.length-1,difficultyIndex(id)+1)];}
