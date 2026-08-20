export const CONFIG = {
  worldSize: 5200,
  startMass: 34,
  botCount: 48,
  foodTarget: 1120,
  virusTarget: 30,
  maxPlayerCells: 16,
  maxBotCells: 12,
  recombineDelay: 14,
  splitMinMass: 36,
  ejectMinMass: 32,
  ejectCost: 15,
  ejectMass: 11,
  splitVelocity: 720,
  ejectVelocity: 760,
  baseSpeed: 245,
  eatRatio: 1.10,
  eatOverlap: 0.34,
  virusSplitMass: 145,
  virusMassGain: 28,
  baseZoom: 1.18,
  minZoom: 0.28,
  maxZoom: 1.28,
  gridSize: 50,
  botRespawnMin: 1.7,
  botRespawnMax: 4.3,
  spawnShield: 2.6,
  teamSpawnShield: 3.6,
  maxEjected: 220,
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
export const BOT_NAMES = ['Nova','Rex','Pixel','Mako','Ghost','Luna','Mango','Orbit','Wolf','Bolt','Jinx','Echo','Frost','Ace','Kilo','Viper','Moss','Lucky','Quill','Drift','Otter','Crow','Iris','Sable','Zero','Noodle','Boba','Toast','Taco','Panda','Kiwi','Waffle','Mochi','Peach','Bean','Nugget','Splash','Dash','Ruby','Mint','Comet','Dune','Fizz','Basil','Miso','Pip','Riot','Muffin'];

export const TEAM_DEFS = [
  { id:0, name:'Azure', color:'#43a9ff', dark:'#1f6ba0' },
  { id:1, name:'Crimson', color:'#f25c6b', dark:'#9e2935' },
  { id:2, name:'Verdant', color:'#63cf72', dark:'#338341' },
  { id:3, name:'Violet', color:'#a970f1', dark:'#6940a8' },
];

export const AI_PROFILES = [
  { id:'rookie', label:'Rookie', weight:20, think:[.22,.38], view:720, prey:840, foodSamples:50, splitAgg:.16, badSplit:.14, escapeSplit:.12, forageSplit:.04, virusFarm:.02, virusShot:.01, lead:.05, assist:.05, mistake:.18 },
  { id:'casual', label:'Casual', weight:34, think:[.16,.29], view:860, prey:980, foodSamples:80, splitAgg:.34, badSplit:.07, escapeSplit:.27, forageSplit:.08, virusFarm:.06, virusShot:.04, lead:.20, assist:.16, mistake:.09 },
  { id:'skilled', label:'Skilled', weight:27, think:[.11,.22], view:1010, prey:1150, foodSamples:120, splitAgg:.54, badSplit:.03, escapeSplit:.48, forageSplit:.13, virusFarm:.16, virusShot:.12, lead:.42, assist:.35, mistake:.04 },
  { id:'veteran', label:'Veteran', weight:15, think:[.08,.17], view:1180, prey:1300, foodSamples:150, splitAgg:.70, badSplit:.012, escapeSplit:.66, forageSplit:.17, virusFarm:.26, virusShot:.22, lead:.62, assist:.55, mistake:.018 },
  { id:'ace', label:'Ace', weight:4, think:[.065,.135], view:1320, prey:1450, foodSamples:175, splitAgg:.78, badSplit:.006, escapeSplit:.74, forageSplit:.20, virusFarm:.34, virusShot:.32, lead:.76, assist:.67, mistake:.008 },
];

export const MODE_DEFS = {
  classic: {
    id:'classic', name:'Classic FFA', badge:'FFA', icon:'●', color:'#4aa9f5',
    description:'Endless free-for-all. Bots continuously respawn so the server stays alive.',
    rules:'Everyone can eat everyone. Viruses, pellet spawners, nutrient clouds and rare comets appear.',
    worldScale:1, botCount:48, respawn:true, teams:false, timed:false,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:false, clouds:true, comets:true },
  },
  teams4: {
    id:'teams4', name:'Four Teams', badge:'4T', icon:'◉', color:'#70d38e',
    description:'Four balanced teams fight for total map mass. Friendly cells cannot eat each other.',
    rules:'Respawns are dynamically assigned toward weaker teams. Underdogs get catch-up spawn mass and bounty bonuses.',
    worldScale:1, botCount:51, respawn:true, teams:true, teamCount:4, timed:false,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:true, clouds:true, comets:false },
  },
  experimental: {
    id:'experimental', name:'Experimental', badge:'EXP', icon:'✣', color:'#e94f5b',
    description:'A chaotic sandbox inspired by Agar.io Experimental mode and its spawner experiments.',
    rules:'Spawner fields, nutrient mother cells, wormholes, bumpers, clouds and comets. Fed viruses get pushed instead of duplicating.',
    worldScale:1, botCount:48, respawn:true, teams:false, timed:false, experimentalVirus:true,
    env:{ viruses:true, spawners:true, mothers:true, portals:true, bumpers:true, clouds:true, comets:true },
  },
  rush: {
    id:'rush', name:'Rush', badge:'5:00', icon:'⚡', color:'#ef605b',
    description:'Five minutes to build the highest mass possible on a smaller, faster arena.',
    rules:'Shorter recombine delay, denser food, red viruses and constant respawns. Highest peak mass wins.',
    worldScale:.76, botCount:38, respawn:true, teams:false, timed:true, duration:300, rush:true,
    env:{ viruses:true, spawners:true, mothers:false, portals:false, bumpers:false, clouds:true, comets:false },
  },
  battle: {
    id:'battle', name:'Battle Royale', badge:'BR', icon:'◎', color:'#e2b553',
    description:'One life. The safe zone shrinks until a single cell owner remains.',
    rules:'No bot respawns in this mode. Outside the safe zone you rapidly lose mass.',
    worldScale:.92, botCount:35, respawn:false, teams:false, timed:false, battle:true, duration:390,
    env:{ viruses:true, spawners:true, mothers:true, portals:false, bumpers:false, clouds:false, comets:false },
  },
  boss: {
    id:'boss', name:'Boss Hunt', badge:'BOSS', icon:'☠', color:'#d879ec',
    description:'A cooperative PvE mode with looping multi-phase Titan bosses and respawning hunters.',
    rules:'Hunters cannot eat each other. Eat boss fragments and survive the Titan to drain its core health.',
    worldScale:.90, botCount:35, respawn:true, teams:false, timed:false, boss:true,
    env:{ viruses:true, spawners:true, mothers:false, portals:true, bumpers:true, clouds:true, comets:false },
  },
  hotzones: {
    id:'hotzones', name:'Nutrient Control', badge:'ZONE', icon:'⬡', color:'#f1a657',
    description:'Original control mode. Rotating nutrient zones reward risky map control and keep players colliding.',
    rules:'Stand inside active zones to score Control points while boosted golden pellets spawn around you. Six-minute match.',
    worldScale:.86, botCount:42, respawn:true, teams:false, timed:true, duration:360, hotzones:true,
    env:{ viruses:true, spawners:false, mothers:false, portals:true, bumpers:true, clouds:false, comets:false },
  },
};

export const BOSS_DEFS = [
  { id:'bulwark', name:'THE BULWARK', color:'#df6c70', hp:950, mass:1500, speed:.58, fragmentEvery:8.5, fragments:[18,42], fragmentCount:[6,9], pulseEvery:11, pulseForce:520 },
  { id:'hydra', name:'THE HYDRA', color:'#8f72e8', hp:1550, mass:1950, speed:.72, fragmentEvery:6.4, fragments:[22,58], fragmentCount:[8,13], pulseEvery:9, pulseForce:610 },
  { id:'devourer', name:'THE DEVOURER', color:'#57b995', hp:2450, mass:2600, speed:.86, fragmentEvery:5.2, fragments:[26,72], fragmentCount:[10,15], pulseEvery:7.5, pulseForce:700 },
];
