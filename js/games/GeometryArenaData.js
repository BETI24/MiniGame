export const GA_CONFIG = {
  worldSize: 1000,
  baseStageTime: 23,
  prepareTitle: 'Prepare Phase',
  saveKey: 'nexus.geometryArena.v1',
  lightDefault: 4,
  maxParticles: 1900,
  maxPlayerBullets: 1800,
  maxEnemyBullets: 900,
};

export const CLASSES = [
  {id:'soldier',name:'Soldier',tier:1,unlock:0,shape:'dart',color:'#ff686f',desc:'Balanced rapid-fire fighter.',base:{hp:5,move:12.5,fireRate:6,damage:9.6,bulletSpeed:30,range:20,bodySize:1,bulletSize:1,crit:0.10,critEffect:1.5,accuracy:0.90,recoil:1,knockback:1},skill:'Overdrive',skillDesc:'RMB / Space: short burst of fire-rate and move speed.'},
  {id:'cannon',name:'Cannon',tier:1,unlock:250,shape:'cannon',color:'#ff9b45',desc:'Slow explosive shells with heavy knockback.',base:{hp:6,move:10.5,fireRate:2.4,damage:23,bulletSpeed:24,range:19,bodySize:1.12,bulletSize:1.5,crit:0.08,critEffect:1.7,accuracy:0.94,recoil:1.45,knockback:1.7},skill:'Siege Shot',skillDesc:'RMB / Space: fire a huge explosive round.'},
  {id:'ranger',name:'Ranger',tier:1,unlock:1000,shape:'arrow',color:'#a8f27c',desc:'Fast movement and tracking fire.',base:{hp:4,move:14.2,fireRate:5.5,damage:8,bulletSpeed:33,range:24,bodySize:.88,bulletSize:.85,crit:0.16,critEffect:1.7,accuracy:.92,recoil:.75,knockback:.8},skill:'Hunter Mark',skillDesc:'RMB / Space: bullets aggressively track enemies.'},
  {id:'summoner',name:'Summoner',tier:1,unlock:2500,shape:'orbital',color:'#78dfff',desc:'Creates orbiting minions that attack nearby targets.',base:{hp:5,move:11.3,fireRate:4.2,damage:7.4,bulletSpeed:27,range:20,bodySize:1,bulletSize:.9,crit:.10,critEffect:1.5,accuracy:.95,recoil:.55,knockback:.8},skill:'Call Minions',skillDesc:'RMB / Space: summon temporary orbiting shooters.'},
  {id:'core',name:'Core',tier:1,unlock:5000,shape:'core',color:'#9de3ff',desc:'Durable core with periodic defensive pulse.',base:{hp:8,move:10.3,fireRate:4.4,damage:8.6,bulletSpeed:29,range:19,bodySize:1.08,bulletSize:1.0,crit:.08,critEffect:1.5,accuracy:.96,recoil:.7,knockback:1},skill:'Core Pulse',skillDesc:'RMB / Space: destroy nearby hostile bullets and damage enemies.'},
  {id:'swordmaster',name:'Swordmaster',tier:1,unlock:10000,shape:'blade',color:'#f7f7f7',desc:'Uses orbiting blades as melee and projectiles.',base:{hp:6,move:13.1,fireRate:3.3,damage:12,bulletSpeed:28,range:16,bodySize:.95,bulletSize:1.25,crit:.18,critEffect:1.8,accuracy:1,recoil:.4,knockback:1.3},skill:'Blade Throw',skillDesc:'RMB / Space: throw all blades through the arena.'},
  {id:'tornado',name:'Tornado',tier:2,unlock:20000,shape:'tornado',color:'#b97cff',desc:'Rotates while firing and snowballs into extreme speed.',base:{hp:2,move:13.5,fireRate:7.3,damage:7.2,bulletSpeed:30,range:18,bodySize:.85,bulletSize:.3,crit:.12,critEffect:1.6,accuracy:.78,recoil:0,knockback:.3},skill:'Passive',skillDesc:'While shooting, rotation builds bonus fire rate and movement.'},
  {id:'prism',name:'Prism',tier:2,unlock:35000,shape:'prism',color:'#8ca4ff',desc:'Splits projectiles into angular beams.',base:{hp:4,move:12,fireRate:4.1,damage:11,bulletSpeed:31,range:22,bodySize:.92,bulletSize:.75,crit:.13,critEffect:1.7,accuracy:.93,recoil:.65,knockback:.75},skill:'Refraction',skillDesc:'RMB / Space: next shots split repeatedly.'},
  {id:'shotgun',name:'Shotgun',tier:2,unlock:50000,shape:'fan',color:'#f2ad62',desc:'Wide close-range pellet fan.',base:{hp:6,move:11.2,fireRate:2.7,damage:5.2,bulletSpeed:26,range:12,bodySize:1.05,bulletSize:.7,crit:.08,critEffect:1.5,accuracy:.56,recoil:1.4,knockback:1.4},skill:'Full Salvo',skillDesc:'RMB / Space: huge circular pellet burst.'},
  {id:'magician',name:'Magician',tier:2,unlock:80000,shape:'magic',color:'#ca78ff',desc:'Magic orbs, delayed blasts and unusual projectile behavior.',base:{hp:4,move:12.4,fireRate:4.5,damage:10.5,bulletSpeed:26,range:23,bodySize:.9,bulletSize:1.15,crit:.15,critEffect:1.8,accuracy:.9,recoil:.45,knockback:.9},skill:'Magic Wave',skillDesc:'RMB / Space: release expanding arcane rings.'},
  {id:'destroyer',name:'Destroyer',tier:2,unlock:120000,shape:'destroyer',color:'#ff6b6b',desc:'Dangerously close-range blast specialist.',base:{hp:10,move:9.5,fireRate:2.2,damage:28,bulletSpeed:21,range:11,bodySize:1.25,bulletSize:1.6,crit:.05,critEffect:2,accuracy:.88,recoil:1.7,knockback:2},skill:'Destroy',skillDesc:'RMB / Space: detonate a large blast around yourself.'},
  {id:'sniper',name:'Sniper',tier:2,unlock:180000,shape:'sniper',color:'#f3e878',desc:'Long-range precision with extreme critical hits.',base:{hp:3,move:11.6,fireRate:1.5,damage:42,bulletSpeed:48,range:34,bodySize:.82,bulletSize:.65,crit:.42,critEffect:2.5,accuracy:.995,recoil:1.2,knockback:1.5},skill:'Deadeye',skillDesc:'RMB / Space: briefly guarantees critical piercing shots.'},
];

export const COLORS = [
  {id:'coral',name:'Coral',hex:'#ff6970',mods:{damage:1.00,move:1.00,fireRate:1.00},desc:'Balanced'},
  {id:'lime',name:'Lime',hex:'#72ff6a',mods:{move:1.12,damage:.94},desc:'+Move Speed'},
  {id:'indigo',name:'Indigo',hex:'#6f73ff',mods:{bulletSpeed:1.18,range:1.08},desc:'+Projectile Speed'},
  {id:'amber',name:'Amber',hex:'#ffae55',mods:{damage:1.14,fireRate:.94},desc:'+Damage'},
  {id:'cyan',name:'Cyan',hex:'#64f6ff',mods:{fireRate:1.12,damage:.94},desc:'+Fire Rate'},
  {id:'violet',name:'Violet',hex:'#c96cff',mods:{crit:1.35,critEffect:1.10},desc:'+Critical'},
  {id:'white',name:'White',hex:'#f5f5f5',mods:{accuracy:1.06,range:1.12},desc:'+Precision'},
  {id:'gold',name:'Gold',hex:'#e9ff69',mods:{starGain:1.15,damage:.96},desc:'+Star Gain'},
  {id:'mint',name:'Mint',hex:'#a0ffc6',mods:{hp:1.22,move:.95},desc:'+HP'},
  {id:'rose',name:'Rose',hex:'#ff7fd1',mods:{bulletSize:1.22,bulletSpeed:.94},desc:'+Bullet Size'},
  {id:'sky',name:'Sky',hex:'#81bbff',mods:{range:1.22,move:.96},desc:'+Range'},
  {id:'orange',name:'Orange',hex:'#ff824f',mods:{recoil:1.25,knockback:1.25,damage:1.05},desc:'+Force'},
];

export const DIFFICULTIES = [
  {id:'E',label:'E',enemyCount:.72,hp:.9,damage:.62,speed:.92,elite:.025,star:1.0,rare:1.0,epic:.7},
  {id:'D',label:'D',enemyCount:.95,hp:1.25,damage:.82,speed:.98,elite:.045,star:1.35,rare:1.15,epic:.85},
  {id:'C',label:'C',enemyCount:1.4,hp:2.0,damage:1.22,speed:1.08,elite:.08,star:1.7,rare:1.3,epic:1.0},
  {id:'B',label:'B',enemyCount:1.6,hp:3.0,damage:1.35,speed:1.12,elite:.12,star:2.15,rare:1.5,epic:1.25},
  {id:'A',label:'A',enemyCount:1.9,hp:4.5,damage:1.5,speed:1.18,elite:.17,star:2.8,rare:1.8,epic:1.55},
  {id:'S',label:'S',enemyCount:2.2,hp:6.5,damage:1.7,speed:1.24,elite:.22,star:3.7,rare:2.1,epic:1.9},
  {id:'MAX',label:'MAX',enemyCount:2.6,hp:9.5,damage:1.95,speed:1.3,elite:.30,star:5.0,rare:2.6,epic:2.4},
  {id:'MAX+1',label:'MAX+1',enemyCount:3.0,hp:14,damage:2.2,speed:1.36,elite:.38,star:6.8,rare:3.1,epic:3.0},
];

export const UPGRADE_RARITIES = {
  common:{name:'Common Upgrade',color:'#b7ef72',weight:58,cost:[4,8]},
  rare:{name:'Rare Upgrade',color:'#70bfff',weight:26,cost:[8,16]},
  epic:{name:'Epic Upgrade',color:'#ba68ff',weight:12,cost:[18,30]},
  legendary:{name:'Legendary Upgrade',color:'#ff9748',weight:4,cost:[38,58]},
};

export const UPGRADES = [
  {id:'more_damage',name:'More Damage',rarity:'common',tags:['Attack'],icon:'triangle',desc:'Bullet Damage +20%.',apply:s=>{s.damage*=1.2}},
  {id:'quick_trigger',name:'Quick Trigger',rarity:'common',tags:['Attack'],icon:'chev',desc:'Fire Rate +18%.',apply:s=>{s.fireRate*=1.18}},
  {id:'fast_bullet',name:'Fast Bullet',rarity:'common',tags:['Bullet'],icon:'dart',desc:'Bullet Speed +22%.',apply:s=>{s.bulletSpeed*=1.22}},
  {id:'long_range',name:'Long Range',rarity:'common',tags:['Bullet'],icon:'line',desc:'Range +22%.',apply:s=>{s.range*=1.22}},
  {id:'vitality',name:'Vitality',rarity:'common',tags:['Survival'],icon:'ring',desc:'HP Max +2.',apply:s=>{s.hp+=2;s.hpMax+=2}},
  {id:'agility',name:'Agility',rarity:'common',tags:['Move'],icon:'arrow',desc:'Move Speed +12%.',apply:s=>{s.move*=1.12}},
  {id:'steady_aim',name:'Steady Aim',rarity:'common',tags:['Bullet'],icon:'crosshair',desc:'Accuracy +8% and Crit Rate +5%.',apply:s=>{s.accuracy=Math.min(1,s.accuracy+.08);s.crit+=.05}},
  {id:'big_bullet',name:'Big Bullet',rarity:'rare',tags:['Support'],icon:'bigbullet',desc:'Bullet Size +16%.',apply:s=>{s.bulletSize*=1.16}},
  {id:'piercing_rounds',name:'Piercing Rounds',rarity:'rare',tags:['Bullet Change'],icon:'pierce',desc:'Bullets pierce +1 target.',apply:s=>{s.pierce=(s.pierce||0)+1}},
  {id:'double_shot',name:'Double Shot',rarity:'rare',tags:['Bullet Change'],icon:'double',desc:'+1 projectile, slight spread.',apply:s=>{s.projectiles=(s.projectiles||1)+1;s.spread=(s.spread||0)+.08}},
  {id:'homing',name:'Tracking Bullet',rarity:'rare',tags:['Bullet Change'],icon:'homing',desc:'Bullets gain light tracking.',apply:s=>{s.homing=(s.homing||0)+1}},
  {id:'critical_eye',name:'Critical Eye',rarity:'rare',tags:['Attack'],icon:'eye',desc:'Critical Rate +20%.',apply:s=>{s.crit+=.2}},
  {id:'anti_recoil',name:'Anti-Recoil',rarity:'epic',tags:['Unique','Support','Physics'],icon:'recoil',desc:'Fire Rate +60%. Recoil reverses direction.',apply:s=>{s.fireRate*=1.6;s.reverseRecoil=true}},
  {id:'intensified_bullet',name:'Intensified Bullet',rarity:'common',tags:['Unique','Bullet Change'],icon:'intensify',desc:'Bullets grow while traveling, up to 150% damage.',apply:s=>{s.intensify=true}},
  {id:'revenge',name:'Revenge',rarity:'epic',tags:['Unique','Buff'],icon:'revenge',desc:'Taking damage grants +120% bullet damage briefly.',apply:s=>{s.revenge=true}},
  {id:'super_mine',name:'Super Mine',rarity:'epic',tags:['Unique','Mine'],icon:'mine',desc:'Periodically leaves an expanding mine.',apply:s=>{s.superMine=true}},
  {id:'splitter',name:'Splitter',rarity:'epic',tags:['Bullet Change'],icon:'split',desc:'Bullets split into 2 smaller bullets on hit.',apply:s=>{s.split=(s.split||0)+1}},
  {id:'chain',name:'Chain Reaction',rarity:'epic',tags:['Special Effect'],icon:'chain',desc:'Kills can chain a nearby explosion.',apply:s=>{s.chainKill=(s.chainKill||0)+.55}},
  {id:'terminator',name:'Terminator',rarity:'legendary',tags:['Unique','Special Effect'],icon:'terminator',desc:'Defeating a boss destroys all non-boss enemies.',apply:s=>{s.terminator=true}},
  {id:'wheel_of_fortune',name:'Wheel of Fortune',rarity:'legendary',tags:['Unique','Restore','Lucky'],icon:'wheel',desc:'Gain +6 HP Max. Damage taken may heal instead.',apply:s=>{s.hpMax+=6;s.hp+=6;s.wheel=true}},
  {id:'burst',name:'Burst',rarity:'legendary',tags:['Unique','Special Effect'],icon:'burst',desc:'Destroyed enemies create powerful explosions.',apply:s=>{s.burstKill=true}},
  {id:'amulet',name:'Amulet',rarity:'legendary',tags:['Unique','Restore'],icon:'amulet',desc:'Once per run, lethal damage fully heals you and explodes.',apply:s=>{s.amulet=true;s.amuletReady=true}},
  {id:'prismatic',name:'Prismatic Echo',rarity:'legendary',tags:['Unique','Bullet Change'],icon:'prism',desc:'Every 5th shot fires in 6 directions.',apply:s=>{s.prismatic=true}},
  {id:'overclock',name:'Overclock',rarity:'epic',tags:['Attack'],icon:'overclock',desc:'Fire Rate +45%, Move Speed -12%.',apply:s=>{s.fireRate*=1.45;s.move*=.88}},
  {id:'ricochet',name:'Ricochet',rarity:'rare',tags:['Physics'],icon:'bounce',desc:'Bullets bounce once from the arena wall.',apply:s=>{s.ricochet=(s.ricochet||0)+1}},
  {id:'explosive_rounds',name:'Explosive Rounds',rarity:'epic',tags:['Special Effect'],icon:'blast',desc:'Hits deal 35% splash damage nearby.',apply:s=>{s.explosive=(s.explosive||0)+.35}},
  {id:'glass_cannon',name:'Glass Cannon',rarity:'legendary',tags:['Unique','Attack'],icon:'glass',desc:'Damage x2.0, HP Max x60%.',apply:s=>{s.damage*=2;s.hpMax=Math.max(1,Math.round(s.hpMax*.6));s.hp=Math.min(s.hp,s.hpMax)}},
  {id:'magnet',name:'Fragment Magnet',rarity:'common',tags:['Support'],icon:'magnet',desc:'Pickup radius +80%.',apply:s=>{s.pickup=(s.pickup||55)*1.8}},
  {id:'star_engine',name:'Star Engine',rarity:'rare',tags:['Lucky'],icon:'star',desc:'Star gain +35%.',apply:s=>{s.starGain=(s.starGain||1)*1.35}},
  {id:'lifesteal',name:'Life Spark',rarity:'epic',tags:['Restore'],icon:'heart',desc:'Small chance to heal on kill.',apply:s=>{s.lifeSpark=true}},
];

export const ENEMY_TYPES = [
  {id:'triangle',shape:'triangle',hp:15,speed:82,radius:18,score:8,contact:1,shoot:0,color:'#92f58a'},
  {id:'square',shape:'square',hp:28,speed:62,radius:21,score:12,contact:1,shoot:.7,color:'#84d8ff'},
  {id:'diamond',shape:'diamond',hp:42,speed:72,radius:22,score:18,contact:2,shoot:.45,color:'#d092ff'},
  {id:'circle',shape:'circle',hp:55,speed:48,radius:25,score:22,contact:2,shoot:.95,color:'#a4f4ff'},
  {id:'cross',shape:'cross',hp:76,speed:56,radius:27,score:28,contact:2,shoot:.55,color:'#ffe688'},
  {id:'ring',shape:'ring',hp:95,speed:42,radius:30,score:35,contact:3,shoot:1.2,color:'#bdff78'},
];

export const TALENTS = [
  {id:'hp',name:'HP Max',baseCost:600,max:20,scale:1.45},
  {id:'fireRate',name:'Fire Rate',baseCost:300,max:20,scale:1.45},
  {id:'damage',name:'Bullet DMG',baseCost:300,max:20,scale:1.45},
  {id:'bulletSpeed',name:'Bullet SPD',baseCost:300,max:20,scale:1.45},
  {id:'crit',name:'Crit Rate',baseCost:300,max:15,scale:1.55},
  {id:'critEffect',name:'Crit Effect',baseCost:300,max:15,scale:1.55},
  {id:'ultra',name:'Ultra DMG',baseCost:300,max:12,scale:1.65},
];

export const getClassById = id => CLASSES.find(c=>c.id===id)||CLASSES[0];
export const getColorById = id => COLORS.find(c=>c.id===id)||COLORS[0];
export const getDifficulty = id => DIFFICULTIES.find(d=>d.id===id)||DIFFICULTIES[0];
