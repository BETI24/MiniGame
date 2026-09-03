export const CONFIG = {
  worldSize: 5200,
  startMass: 34,
  foodTarget: 1120,
  virusTarget: 30,
  maxPlayerCells: 16,
  maxBotCells: 16,

  // Vanilla-like Agar physics. Agar/Ogar internally models size roughly as sqrt(mass).
  recombineDelay: 30,
  // Old vanilla-style merge: base 30 s + about 2% of the cell's mass.
  mergeMassFactor: .02,
  splitGhostTime: .60,
  splitMinMass: 36,
  ejectMinMass: 32,
  ejectCost: 20,
  ejectMass: 16,
  ejectCooldown: .12,
  splitBoostDistance: 335,
  ejectBoostDistance: 325,
  virusBoostDistance: 325,
  baseSpeed: 270,
  movementExponent: .449,
  mouseSlowRadius: 105,
  eatRatio: 1.30,
  eatOverlap: .333,
  virusSplitMass: 145,
  virusMassGain: 100,
  virusUnevenMass: 1500,
  virusMinPieceMass: 10,
  minDecayMass: 10,
  massDecayRate: .002,
  maxCellMass: 22500,

  baseZoom: 1.18,
  minZoom: 0.28,
  maxZoom: 1.28,
  gridSize: 50,
  botRespawnMin: 1.7,
  botRespawnMax: 4.3,
  spawnShield: 2.6,
  teamSpawnShield: 3.6,
  maxEjected: 420,
  virusFeedPieces: 7,
  leaderboardSize: 10,

  spawner: {
    max: 4,
    lifetime: 180,
    minDelay: 24,
    maxDelay: 52,
    chance: 0.58,
    pelletIntervalMin: 1.35,
    pelletIntervalMax: 2.05,
    pelletsMin: 7,
    pelletsMax: 11,
    pelletLifetime: 52,
  },
  mother: {
    max: 2,
    minDelay: 38,
    maxDelay: 62,
    lifetime: 135,
    pulseMin: 1.0,
    pulseMax: 1.7,
  },
  portal: { maxPairs: 2, minDelay: 40, maxDelay: 68, lifetime: 90 },
  bumper: { max: 4, minDelay: 28, maxDelay: 46, lifetime: 100 },
  cloud: { max: 2, minDelay: 28, maxDelay: 46, lifetime: 28, pelletInterval: .42 },
  comet: { minDelay: 48, maxDelay: 75, lifetime: 11, pelletInterval: .16 },
};

export const PLAYER_COLORS = ['#49a6ff','#ff6b7b','#6bdc79','#ae7cff','#ffb55c','#58d5d0','#ef6dc3','#91c95b','#7d8dff','#ff8f55','#4fc8ff','#d870ff'];
export const FOOD_COLORS = ['#ff5f72','#ffb64c','#f1dc4f','#73d35f','#41c9cf','#5797ff','#9d75ff','#ef6fc4'];
export const BOT_NAMES = ['Nova','Rex','Pixel','Mako','Ghost','Luna','Mango','Orbit','Wolf','Bolt','Jinx','Echo','Frost','Ace','Kilo','Viper','Moss','Lucky','Quill','Drift','Otter','Crow','Iris','Sable','Zero','Noodle','Boba','Toast','Taco','Panda','Kiwi','Waffle','Mochi','Peach','Bean','Nugget','Splash','Dash','Ruby','Mint','Comet','Dune','Fizz','Basil','Miso','Pip','Riot','Muffin','Kai','Mira','Onyx','Zed','Rin','Flux','Hex','Nori','Koda','Yuki','Sora','Rook','Aero','Ivy','Pico'];

export const TEAM_DEFS = [
  { id:0, name:'Azure', color:'#43a9ff', dark:'#1f6ba0' },
  { id:1, name:'Crimson', color:'#f25c6b', dark:'#9e2935' },
  { id:2, name:'Verdant', color:'#63cf72', dark:'#338341' },
  { id:3, name:'Violet', color:'#a970f1', dark:'#6940a8' },
];

export const AI_PROFILES = [
  { id:'rookie', label:'Rookie', weight:18, think:[.22,.38], view:720, prey:820, foodSamples:50,  splitAgg:.13, badSplit:.16, escapeSplit:.10, forageSplit:.04, virusFarm:.01, virusShot:.01, lead:.04, assist:.04, mistake:.20, combo:0, comboChance:0, duoFeed:.03, duoSplitFeed:.01, duoTrick:.00 },
  { id:'casual', label:'Casual', weight:31, think:[.16,.28], view:880, prey:1000,foodSamples:82,  splitAgg:.31, badSplit:.07, escapeSplit:.24, forageSplit:.08, virusFarm:.05, virusShot:.04, lead:.22, assist:.15, mistake:.10, combo:1, comboChance:.08, duoFeed:.12, duoSplitFeed:.08, duoTrick:.02 },
  { id:'skilled',label:'Skilled',weight:29, think:[.105,.20],view:1080,prey:1240,foodSamples:125, splitAgg:.56, badSplit:.025,escapeSplit:.44, forageSplit:.14, virusFarm:.15, virusShot:.13, lead:.46, assist:.36, mistake:.035,combo:2, comboChance:.38, duoFeed:.34, duoSplitFeed:.34, duoTrick:.16 },
  { id:'veteran',label:'Veteran',weight:17, think:[.075,.15],view:1260,prey:1450,foodSamples:155, splitAgg:.73, badSplit:.010,escapeSplit:.62, forageSplit:.18, virusFarm:.25, virusShot:.25, lead:.68, assist:.58, mistake:.014,combo:3, comboChance:.67, duoFeed:.58, duoSplitFeed:.62, duoTrick:.38 },
  { id:'ace',    label:'Ace',    weight:5,  think:[.055,.115],view:1450,prey:1650,foodSamples:190, splitAgg:.84, badSplit:.004,escapeSplit:.74, forageSplit:.22, virusFarm:.36, virusShot:.38, lead:.84, assist:.74, mistake:.005,combo:4, comboChance:.86, duoFeed:.78, duoSplitFeed:.84, duoTrick:.62 },
];

export const AI_PRESETS = {
  chill:    { rookie:1.8, casual:1.45, skilled:.65, veteran:.28, ace:.08 },
  balanced: { rookie:1, casual:1, skilled:1, veteran:1, ace:1 },
  hard:     { rookie:.28, casual:.58, skilled:1.35, veteran:1.65, ace:1.8 },
  elite:    { rookie:.04, casual:.18, skilled:.72, veteran:1.8, ace:3.5 },
};

export const MODE_DEFS = {
  classic: {
    id:'classic', name:'Classic FFA', badge:'FFA', icon:'●', color:'#4aa9f5',
    description:'Endless free-for-all with Agar-like physics and continuously respawning opponents.',
    rules:'Everyone can eat everyone. Viruses, pellet spawners, nutrient clouds and rare comets appear.',
    worldScale:1, botCount:48, respawn:true, teams:false, timed:false, decayMod:1,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:false, clouds:true, comets:true },
  },
  teams4: {
    id:'teams4', name:'Teams', badge:'TEAM', icon:'◉', color:'#70d38e',
    description:'Configurable 2–4 team match. Friendly players cannot eat each other.',
    rules:'Choose team count and assignment. Respawns still lean toward weaker teams to keep the round alive.',
    worldScale:1, botCount:51, respawn:true, teams:true, teamCount:4, timed:false, decayMod:1.5,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:true, clouds:true, comets:false },
  },
  experimental: {
    id:'experimental', name:'Experimental', badge:'EXP', icon:'✣', color:'#e94f5b',
    description:'A chaotic sandbox inspired by Agar.io Experimental mode and its map experiments.',
    rules:'Spawner fields, nutrient mother cells, wormholes, bumpers, clouds and comets. Fed viruses get pushed instead of duplicating.',
    worldScale:1, botCount:48, respawn:true, teams:false, timed:false, experimentalVirus:true, decayMod:1,
    env:{ viruses:true, spawners:true, mothers:true, portals:true, bumpers:true, clouds:true, comets:true },
  },
  rush: {
    id:'rush', name:'Rush', badge:'5:00', icon:'⚡', color:'#ef605b',
    description:'Five minutes to build the highest mass possible on a smaller, faster arena.',
    rules:'Shorter merge delay, denser food, red viruses and constant respawns. Highest peak mass wins.',
    worldScale:.76, botCount:38, respawn:true, teams:false, timed:true, duration:300, rush:true, decayMod:.8,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:false, clouds:true, comets:false },
  },
  battle: {
    id:'battle', name:'Battle Royale', badge:'BR', icon:'◎', color:'#e2b553',
    description:'One life. The safe zone shrinks until a single cell owner remains.',
    rules:'No bot respawns in this mode. Outside the safe zone you rapidly lose mass.',
    worldScale:.92, botCount:35, respawn:false, teams:false, timed:false, battle:true, duration:390, decayMod:1,
    env:{ viruses:true, spawners:true, mothers:true, portals:false, bumpers:false, clouds:false, comets:false },
  },
  boss: {
    id:'boss', name:'Boss Hunt', badge:'BOSS', icon:'☠', color:'#d879ec',
    description:'A cooperative PvE mode with looping multi-phase Titan bosses and respawning hunters.',
    rules:'Hunters cannot eat each other. Eat boss fragments and survive the Titan to drain its core health.',
    worldScale:.90, botCount:35, respawn:true, teams:false, timed:false, boss:true, decayMod:.65,
    env:{ viruses:true, spawners:true, mothers:false, portals:true, bumpers:true, clouds:true, comets:false },
  },
  hotzones: {
    id:'hotzones', name:'Nutrient Control', badge:'ZONE', icon:'⬡', color:'#f1a657',
    description:'Original control mode. Rotating nutrient zones reward risky map control and keep players colliding.',
    rules:'Stand inside active zones to score Control points while boosted golden pellets spawn around you. Six-minute match.',
    worldScale:.86, botCount:42, respawn:true, teams:false, timed:true, duration:360, hotzones:true, decayMod:1,
    env:{ viruses:true, spawners:false, mothers:false, portals:true, bumpers:true, clouds:false, comets:false },
  },
};

export const BOSS_DEFS = [
  { id:'bulwark', name:'THE BULWARK', color:'#df6c70', hp:950, mass:1500, speed:.58, fragmentEvery:8.5, fragments:[18,42], fragmentCount:[6,9], pulseEvery:11, pulseForce:520 },
  { id:'hydra', name:'THE HYDRA', color:'#8f72e8', hp:1550, mass:1950, speed:.72, fragmentEvery:6.4, fragments:[22,58], fragmentCount:[8,13], pulseEvery:9, pulseForce:610 },
  { id:'devourer', name:'THE DEVOURER', color:'#57b995', hp:2450, mass:2600, speed:.86, fragmentEvery:5.2, fragments:[26,72], fragmentCount:[10,15], pulseEvery:7.5, pulseForce:700 },
];
