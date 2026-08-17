import {
  ROWS, COLS, PLANTS, ENEMIES, BOSSES, DIFFICULTIES, CAMPAIGN_LEVELS
} from "./GardenSiegeData.js";

export function clamp(v,a,b){
  return Math.max(a,Math.min(b,v));
}
export function rand(a,b){ return a+Math.random()*(b-a); }
export function rint(a,b){ return Math.floor(rand(a,b+1)); }

export function createGameState({difficulty="normal",levelIndex=0,endless=false}={}){
  const diff=DIFFICULTIES[difficulty];
  const level=CAMPAIGN_LEVELS[Math.min(levelIndex,CAMPAIGN_LEVELS.length-1)];
  return {
    difficulty,
    diff,
    levelIndex,
    level,
    endless,
    time:0,
    score:0,
    energy:diff.startingEnergy,
    overgrowth:0,
    maxOvergrowth:100,
    selectedPlant:null,
    shovel:false,
    paused:false,
    gameOver:false,
    won:false,
    plants:[],
    enemies:[],
    projectiles:[],
    orbs:[],
    particles:[],
    sweepers:Array.from({length:ROWS},(_,row)=>({row,used:false,active:false,x:0})),
    cardCooldowns:Object.fromEntries(Object.keys(PLANTS).map(k=>[k,0])),
    wave:0,
    totalWaves:endless?999:level.waves,
    waveTimer:2.5,
    spawnQueue:[],
    spawnTimer:0,
    betweenWaves:true,
    weather:"day",
    weatherTimer:0,
    nextWeatherAt:32,
    skyOrbTimer:diff.energyDropEvery,
    dangerPulse:0,
    message:"Prepare your garden",
    messageTimer:2.4,
    kills:0,
    combo:0,
    comboTimer:0,
    bestCombo:0,
    nextEntityId:1
  };
}

export function cellToWorld(bounds,row,col){
  const cellW=bounds.gridW/COLS;
  const cellH=bounds.gridH/ROWS;
  return {
    x:bounds.gridX+col*cellW+cellW/2,
    y:bounds.gridY+row*cellH+cellH/2,
    w:cellW,
    h:cellH
  };
}

export function worldToCell(bounds,x,y){
  if(x<bounds.gridX||x>bounds.gridX+bounds.gridW||y<bounds.gridY||y>bounds.gridY+bounds.gridH)return null;
  const col=Math.floor((x-bounds.gridX)/(bounds.gridW/COLS));
  const row=Math.floor((y-bounds.gridY)/(bounds.gridH/ROWS));
  if(row<0||row>=ROWS||col<0||col>=COLS)return null;
  return {row,col};
}

export function plantAt(state,row,col){
  return state.plants.find(p=>p.alive&&p.row===row&&p.col===col)||null;
}

export function canPlacePlant(state,id,row,col){
  const def=PLANTS[id];
  if(!def)return {ok:false,reason:"Unknown plant"};
  if(plantAt(state,row,col))return {ok:false,reason:"Tile occupied"};
  if(state.energy<def.cost)return {ok:false,reason:"Not enough energy"};
  if(state.cardCooldowns[id]>0)return {ok:false,reason:"Card cooling down"};
  return {ok:true};
}

export function placePlant(state,id,row,col){
  const check=canPlacePlant(state,id,row,col);
  if(!check.ok)return check;
  const d=PLANTS[id];
  state.energy-=d.cost;
  state.cardCooldowns[id]=d.cooldown;
  state.plants.push({
    id:state.nextEntityId++,
    type:id,
    row,col,
    hp:d.hp,
    maxHp:d.hp,
    alive:true,
    timer:0,
    fireTimer:rand(0.15,0.55),
    produceTimer:d.produceEvery?rand(2.8,5.2):0,
    biteTimer:0,
    burstLeft:0,
    burstTimer:0,
    fuse:d.fuse||0,
    level:1,
    kills:0,
    flash:0
  });
  return {ok:true};
}

export function removePlant(state,row,col){
  const p=plantAt(state,row,col);
  if(!p)return false;
  p.alive=false;
  state.particles.push({kind:"leaf",x:0,y:0,row,col,life:.5,max:.5});
  return true;
}

export function upgradePlant(state,p){
  if(!p||!p.alive||p.level>=3)return {ok:false,reason:"Max level"};
  const d=PLANTS[p.type];
  const cost=Math.round(d.cost*(0.55+0.25*p.level));
  if(state.energy<cost)return {ok:false,reason:"Not enough energy"};
  state.energy-=cost;
  p.level++;
  p.maxHp=Math.round(d.hp*(1+0.35*(p.level-1)));
  p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.35));
  state.message=`${d.name} evolved to Lv.${p.level}`;
  state.messageTimer=1.5;
  return {ok:true};
}

export function collectOrb(state,orb){
  if(!orb.alive)return 0;
  orb.alive=false;
  state.energy+=orb.value;
  state.score+=orb.value;
  return orb.value;
}

export function activateOvergrowth(state){
  if(state.overgrowth<state.maxOvergrowth)return false;
  state.overgrowth=0;
  state.message="OVERGROWTH!";
  state.messageTimer=1.8;
  for(const p of state.plants){
    if(!p.alive)continue;
    p.flash=.7;
    if(p.type==="sunbloom"){
      spawnOrb(state,p.row,p.col,45,"plant");
    }else if(p.type==="barkwall"){
      p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.35);
    }else{
      p.fireTimer=Math.min(p.fireTimer,.08);
      p.overgrowBuff=7;
    }
  }
  return true;
}

function spawnOrb(state,row,col,value,source="sky"){
  state.orbs.push({
    id:state.nextEntityId++,
    row,col,value,
    source,
    age:0,
    alive:true,
    drift:rand(-18,18)
  });
}

function enemyLaneTarget(state,e){
  let best=null;
  for(const p of state.plants){
    if(!p.alive||p.row!==e.row)continue;
    if(p.colWorld<e.x && (!best||p.colWorld>best.colWorld))best=p;
  }
  return best;
}

function weightedEnemyId(wave){
  const entries=[];
  for(const [id,d] of Object.entries(ENEMIES)){
    let allowed=true;
    if(id==="ironclad"&&wave<3)allowed=false;
    if(id==="sprinter"&&wave<2)allowed=false;
    if(id==="hurdler"&&wave<4)allowed=false;
    if(id==="brute"&&wave<5)allowed=false;
    if(id==="summoner"&&wave<6)allowed=false;
    if(!allowed)continue;
    const weight=d.weight*(1+wave*.025);
    entries.push([id,weight]);
  }
  let total=entries.reduce((s,x)=>s+x[1],0);
  let roll=Math.random()*total;
  for(const [id,w] of entries){
    roll-=w;
    if(roll<=0)return id;
  }
  return "drifter";
}

function buildWave(state){
  state.wave++;
  const base=5+state.wave*2.15;
  const count=Math.max(4,Math.round(base*state.diff.waveSize*(state.endless?1+state.wave*.035:1)));
  const queue=[];
  for(let i=0;i<count;i++){
    queue.push({
      type:weightedEnemyId(state.wave),
      row:rint(0,ROWS-1),
      delay:rand(.55,1.35)
    });
  }
  if((state.level.boss&&!state.endless&&state.wave===state.totalWaves)||(state.endless&&state.wave%10===0)){
    queue.push({type:"compostKing",row:rint(1,3),delay:1.5,boss:true});
  }
  state.spawnQueue=queue;
  state.spawnTimer=.5;
  state.betweenWaves=false;
  state.message=`Wave ${state.wave}${state.wave===state.totalWaves&&!state.endless?" · FINAL":""}`;
  state.messageTimer=1.8;
}

function spawnEnemy(state,item,bounds){
  const d=item.boss?BOSSES[item.type]:ENEMIES[item.type];
  const row=item.row;
  const lane=cellToWorld(bounds,row,COLS-1);
  state.enemies.push({
    id:state.nextEntityId++,
    type:item.type,
    boss:!!item.boss,
    row,
    x:bounds.gridX+bounds.gridW+rand(25,100),
    y:lane.y,
    hp:d.hp*state.diff.enemyHp*(state.endless?1+state.wave*.035:1),
    maxHp:d.hp*state.diff.enemyHp*(state.endless?1+state.wave*.035:1),
    speed:d.speed*state.diff.enemySpeed,
    baseSpeed:d.speed*state.diff.enemySpeed,
    damage:d.damage,
    attackRate:d.attackRate,
    attackTimer:0,
    reward:d.reward,
    alive:true,
    slowTimer:0,
    slowFactor:1,
    flash:0,
    summonTimer:d.summonEvery||0,
    stompTimer:d.stompEvery||0,
    jumpTimer:d.jumpCooldown||0,
    jumped:false,
    scale:d.scale||1
  });
}

function projectileHit(state,p,e){
  e.hp-=p.damage;
  e.flash=.08;
  if(p.slow){
    e.slowFactor=Math.min(e.slowFactor,p.slow);
    e.slowTimer=Math.max(e.slowTimer,p.slowTime);
  }
  if(e.hp<=0){
    killEnemy(state,e,p.ownerPlant);
  }
}

function killEnemy(state,e,ownerPlant=null){
  if(!e.alive)return;
  e.alive=false;
  state.score+=e.reward*10;
  state.energy+=Math.round(e.reward*.18);
  state.kills++;
  state.combo++;
  state.comboTimer=3.25;
  state.bestCombo=Math.max(state.bestCombo,state.combo);
  state.overgrowth=clamp(state.overgrowth+7+(e.boss?30:0),0,state.maxOvergrowth);
  if(ownerPlant){
    ownerPlant.kills++;
  }
  state.particles.push({kind:"enemyPop",x:e.x,y:e.y,row:e.row,life:.55,max:.55,color:e.boss?"#e0b75d":"#7d8c6f"});
}

function plantDamageMultiplier(p){
  return 1 + (p.level-1)*.4;
}
function plantRateMultiplier(p){
  return 1 + (p.level-1)*.16;
}

function updatePlant(state,p,dt,bounds){
  if(!p.alive)return;
  const d=PLANTS[p.type];
  const pos=cellToWorld(bounds,p.row,p.col);
  p.colWorld=pos.x;
  p.flash=Math.max(0,p.flash-dt);
  if(p.overgrowBuff)p.overgrowBuff=Math.max(0,p.overgrowBuff-dt);
  const rateBuff=p.overgrowBuff?1.85:1;
  const dmgBuff=p.overgrowBuff?1.35:1;

  if(d.produceEvery){
    p.produceTimer-=dt;
    if(p.produceTimer<=0){
      p.produceTimer=d.produceEvery/(1+(p.level-1)*.13);
      spawnOrb(state,p.row,p.col,d.produceAmount+10*(p.level-1),"plant");
    }
    return;
  }

  if(d.fuse){
    p.fuse-=dt;
    if(p.fuse<=0){
      for(const e of state.enemies){
        if(!e.alive)continue;
        const ep={x:e.x,y:e.y};
        if(Math.hypot(ep.x-pos.x,ep.y-pos.y)<=d.blastRadius){
          e.hp-=d.blastDamage*plantDamageMultiplier(p);
          e.flash=.12;
          if(e.hp<=0)killEnemy(state,e,p);
        }
      }
      state.particles.push({kind:"blast",x:pos.x,y:pos.y,life:.65,max:.65,r:d.blastRadius});
      p.alive=false;
    }
    return;
  }

  if(d.biteDamage){
    p.biteTimer=Math.max(0,p.biteTimer-dt);
    if(p.biteTimer<=0){
      const e=state.enemies
        .filter(e=>e.alive&&e.row===p.row&&e.x>=pos.x-20&&e.x<=pos.x+d.biteRange)
        .sort((a,b)=>a.x-b.x)[0];
      if(e){
        e.hp-=d.biteDamage;
        if(e.hp<=0)killEnemy(state,e,p);
        p.biteTimer=d.biteCooldown/(1+(p.level-1)*.16);
        p.flash=.3;
      }
    }
    return;
  }

  if(d.chain){
    p.fireTimer-=dt*rateBuff*plantRateMultiplier(p);
    if(p.fireTimer<=0){
      const enemies=state.enemies.filter(e=>e.alive&&e.row===p.row&&e.x>pos.x).sort((a,b)=>a.x-b.x);
      if(enemies.length){
        p.fireTimer=d.fireRate;
        let damage=d.damage*plantDamageMultiplier(p)*dmgBuff;
        const hit=[];
        for(let i=0;i<Math.min(d.chain,enemies.length);i++){
          const e=enemies[i];
          e.hp-=damage;
          e.flash=.11;
          hit.push({x:e.x,y:e.y,id:e.id});
          if(e.hp<=0)killEnemy(state,e,p);
          damage*=d.chainFalloff;
        }
        state.particles.push({kind:"lightning",from:{x:pos.x,y:pos.y},targets:hit,life:.18,max:.18});
      }
    }
    return;
  }

  const maxRange=d.range||9999;
  const target=state.enemies.find(e=>e.alive&&e.row===p.row&&e.x>pos.x&&e.x-pos.x<=maxRange);
  p.fireTimer-=dt*rateBuff*plantRateMultiplier(p);
  p.burstTimer=Math.max(0,(p.burstTimer||0)-dt);

  const shoot=()=>{
    let damage=d.damage*plantDamageMultiplier(p)*dmgBuff;
    if(p.type==="sporecap"&&state.weather==="night")damage*=d.nightDamageMult;
    state.projectiles.push({
      id:state.nextEntityId++,
      ownerPlant:p,
      row:p.row,
      x:pos.x+22,
      y:pos.y-4,
      vx:d.projectileSpeed*(state.weather==="rain"?1.16:1),
      damage,
      alive:true,
      color:d.color,
      slow:d.slow,
      slowTime:d.slowTime,
      life:4
    });
  };

  if(target && p.fireTimer<=0){
    p.fireTimer=d.fireRate;
    shoot();
    if(d.burst&&d.burst>1){
      p.burstLeft=d.burst-1;
      p.burstTimer=d.burstGap;
    }
  }
  if(p.burstLeft>0&&p.burstTimer<=0){
    p.burstLeft--;
    p.burstTimer=d.burstGap;
    shoot();
  }
}

function updateProjectiles(state,dt,bounds){
  for(const p of state.projectiles){
    if(!p.alive)continue;
    p.x+=p.vx*dt;
    p.life-=dt;
    if(p.life<=0||p.x>bounds.gridX+bounds.gridW+180){p.alive=false;continue;}
    let best=null;
    for(const e of state.enemies){
      if(!e.alive||e.row!==p.row)continue;
      if(Math.abs(e.x-p.x)<24*e.scale){
        if(!best||e.x<best.x)best=e;
      }
    }
    if(best){
      projectileHit(state,p,best);
      p.alive=false;
    }
  }
}

function updateEnemies(state,dt,bounds){
  const cellW=bounds.gridW/COLS;
  for(const e of state.enemies){
    if(!e.alive)continue;
    const def=e.boss?BOSSES[e.type]:ENEMIES[e.type];
    e.flash=Math.max(0,e.flash-dt);

    if(e.slowTimer>0){
      e.slowTimer-=dt;
      if(e.slowTimer<=0)e.slowFactor=1;
    }

    if(e.summonTimer>0){
      e.summonTimer-=dt;
      if(e.summonTimer<=0){
        e.summonTimer=def.summonEvery||999;
        for(let i=0;i<(e.boss?2:1);i++){
          const row=clamp(e.row+rint(-1,1),0,ROWS-1);
          const d=ENEMIES.drifter;
          state.enemies.push({
            id:state.nextEntityId++,type:"drifter",boss:false,row,
            x:e.x+rand(30,65),y:cellToWorld(bounds,row,COLS-1).y,
            hp:d.hp*state.diff.enemyHp,maxHp:d.hp*state.diff.enemyHp,
            speed:d.speed*state.diff.enemySpeed,baseSpeed:d.speed*state.diff.enemySpeed,
            damage:d.damage,attackRate:d.attackRate,attackTimer:0,reward:d.reward,
            alive:true,slowTimer:0,slowFactor:1,flash:0,summonTimer:0,stompTimer:0,jumpTimer:0,jumped:false,scale:1
          });
        }
      }
    }

    if(e.stompTimer>0){
      e.stompTimer-=dt;
      if(e.stompTimer<=0){
        e.stompTimer=def.stompEvery||999;
        for(const p of state.plants){
          if(p.alive&&Math.abs(p.row-e.row)<=1){
            p.hp-=55;
            if(p.hp<=0)p.alive=false;
          }
        }
        state.particles.push({kind:"stomp",x:e.x,y:e.y,life:.45,max:.45});
      }
    }

    let blocker=null;
    for(const p of state.plants){
      if(!p.alive||p.row!==e.row)continue;
      const pos=cellToWorld(bounds,p.row,p.col);
      p.colWorld=pos.x;
      const dx=e.x-pos.x;
      if(dx>-7&&dx<cellW*.48){
        if(!blocker||pos.x>blocker.pos.x)blocker={p,pos};
      }
    }

    if(def.jump && !e.jumped && blocker && e.jumpTimer<=0){
      e.x=blocker.pos.x-cellW*.72;
      e.jumped=true;
      blocker=null;
    }

    if(blocker){
      e.attackTimer-=dt;
      if(e.attackTimer<=0){
        e.attackTimer=e.attackRate;
        blocker.p.hp-=e.damage;
        blocker.p.flash=.12;
        if(blocker.p.hp<=0){
          blocker.p.alive=false;
          state.particles.push({kind:"leaf",row:blocker.p.row,col:blocker.p.col,life:.5,max:.5});
        }
      }
    }else{
      e.x-=e.speed*e.slowFactor*dt;
    }

    if(e.x<bounds.gridX-35){
      const sweeper=state.sweepers[e.row];
      if(sweeper && !sweeper.used){
        sweeper.used=true;
        sweeper.active=true;
        sweeper.x=bounds.gridX-42;
        e.x=bounds.gridX-22;
      }else if(!sweeper?.active){
        state.gameOver=true;
        state.message="The garden was overrun";
        state.messageTimer=999;
      }
    }
  }
}

function updateSweepers(state,dt,bounds){
  for(const s of state.sweepers){
    if(!s.active)continue;
    s.x+=410*dt;
    for(const e of state.enemies){
      if(e.alive&&e.row===s.row&&Math.abs(e.x-s.x)<48){
        killEnemy(state,e,null);
      }
    }
    if(s.x>bounds.gridX+bounds.gridW+120)s.active=false;
  }
}

function updateWeather(state,dt){
  state.weatherTimer+=dt;
  if(state.weatherTimer>=state.nextWeatherAt){
    state.weatherTimer=0;
    state.nextWeatherAt=rand(28,42);
    const options=state.level.weather||["day"];
    if(options.length>1){
      let next=options[rint(0,options.length-1)];
      if(next===state.weather)next=options[(options.indexOf(next)+1)%options.length];
      state.weather=next;
      state.message=next==="night"?"Nightfall · Spore Caps empowered":next==="rain"?"Rainstorm · Projectiles accelerated":"Daylight returns";
      state.messageTimer=2.2;
    }
  }
}

export function updateGame(state,dt,bounds){
  if(state.paused||state.gameOver||state.won)return;
  state.time+=dt;
  state.messageTimer=Math.max(0,state.messageTimer-dt);
  state.dangerPulse=Math.max(0,state.dangerPulse-dt);
  state.comboTimer=Math.max(0,state.comboTimer-dt);
  if(state.comboTimer<=0)state.combo=0;

  for(const k of Object.keys(state.cardCooldowns)){
    state.cardCooldowns[k]=Math.max(0,state.cardCooldowns[k]-dt);
  }

  updateWeather(state,dt);

  state.skyOrbTimer-=dt;
  if(state.skyOrbTimer<=0){
    state.skyOrbTimer=state.diff.energyDropEvery*(state.weather==="night"?1.4:1);
    spawnOrb(state,rint(0,ROWS-1),rint(0,COLS-1),25,"sky");
  }

  for(const o of state.orbs){
    if(!o.alive)continue;
    o.age+=dt;
    if(o.age>11)o.alive=false;
  }

  for(const p of state.plants)updatePlant(state,p,dt,bounds);
  updateProjectiles(state,dt,bounds);
  updateEnemies(state,dt,bounds);
  updateSweepers(state,dt,bounds);

  if(state.betweenWaves){
    state.waveTimer-=dt;
    if(state.waveTimer<=0)buildWave(state);
  }else{
    if(state.spawnQueue.length){
      state.spawnTimer-=dt;
      if(state.spawnTimer<=0){
        const item=state.spawnQueue.shift();
        spawnEnemy(state,item,bounds);
        state.spawnTimer=item.delay;
      }
    }else{
      const living=state.enemies.some(e=>e.alive);
      if(!living){
        if(!state.endless && state.wave>=state.totalWaves){
          state.won=true;
          state.message="Garden defended!";
          state.messageTimer=999;
        }else{
          state.betweenWaves=true;
          state.waveTimer=Math.max(3.8,7-state.wave*.18);
          state.energy+=35;
          state.message="Wave cleared · +35 energy";
          state.messageTimer=1.7;
        }
      }
    }
  }

  for(const fx of state.particles)fx.life-=dt;

  state.plants=state.plants.filter(p=>p.alive);
  state.enemies=state.enemies.filter(e=>e.alive);
  state.projectiles=state.projectiles.filter(p=>p.alive);
  state.orbs=state.orbs.filter(o=>o.alive);
  state.particles=state.particles.filter(p=>p.life>0);
}

export function getPlantUpgradeCost(p){
  const d=PLANTS[p.type];
  if(!p||p.level>=3)return null;
  return Math.round(d.cost*(0.55+0.25*p.level));
}

export function getWaveProgress(state){
  if(state.endless)return Math.min(1,(state.wave%10)/10);
  return clamp((state.wave-1 + (state.spawnQueue.length?0.35:state.betweenWaves?0:0.72))/state.totalWaves,0,1);
}
