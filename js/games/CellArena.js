const CONFIG = {
  worldSize: 5200,
  startMass: 34,
  botCount: 48,
  foodTarget: 1050,
  virusTarget: 32,
  virusMassGain: 28,

  spawnerMax: 4,
  spawnerLifetime: 180,
  spawnerMinDelay: 24,
  spawnerMaxDelay: 52,
  spawnerSpawnChance: 0.58,
  spawnerPelletIntervalMin: 1.35,
  spawnerPelletIntervalMax: 2.05,
  spawnerPelletsMin: 7,
  spawnerPelletsMax: 11,
  spawnerPelletLifetime: 52,
  maxPlayerCells: 16,
  maxBotCells: 8,
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
  baseZoom: 1.18,
  minZoom: 0.28,
  maxZoom: 1.28,
  gridSize: 50
};

const PLAYER_COLORS = ['#49a6ff','#ff6b7b','#6bdc79','#ae7cff','#ffb55c','#58d5d0','#ef6dc3','#91c95b','#7d8dff','#ff8f55','#4fc8ff','#d870ff'];
const FOOD_COLORS = ['#ff5f72','#ffb64c','#f1dc4f','#73d35f','#41c9cf','#5797ff','#9d75ff','#ef6fc4'];
const BOT_NAMES = ['Nova','Rex','Pixel','Mako','Ghost','Luna','Mango','Orbit','Wolf','Bolt','Jinx','Echo','Frost','Ace','Kilo','Viper','Moss','Lucky','Quill','Drift','Otter','Crow','Iris','Sable','Zero','Noodle','Boba','Toast','Taco','Panda','Kiwi','Waffle','Mochi','Peach','Bean','Nugget','Splash','Dash','Ruby','Mint','Comet','Dune','Fizz','Basil','Miso','Pip','Riot','Muffin'];

export default {
  manifest: {
    id: 'cell-arena',
    name: 'Cell Arena',
    description: 'Wachse, teile dich, verschlinge Gegner und kämpfe dich an die Spitze der Arena.',
    icon: '🟢',
    tags: ['Arcade','Arena','Survival']
  },

  init: (container, services) => {
    let destroyed=false, raf=0, ro=null, last=performance.now();
    let width=1,height=1,dpr=1,running=false,ended=false,matchTime=0,bestMass=0,eatenCells=0,eatenFood=0;
    let playerName='Player',playerColor=PLAYER_COLORS[0],nextId=1;
    let entities=[],food=[],viruses=[],spawners=[],ejected=[],player=null,bots=[];
    let spawnerSpawnTimer=30+Math.random()*30;
    let mouse={x:0,y:0,wx:0,wy:0};
    let camera={x:CONFIG.worldSize/2,y:CONFIG.worldSize/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};
    let muted=false,darkMode=false,audio=null;

    const style=document.createElement('style');
    style.textContent=`
      .ca{position:relative;width:100%;height:100%;overflow:hidden;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;user-select:none;color:#222}
      .ca *{box-sizing:border-box}.ca canvas{display:block;width:100%;height:100%}.ca-main{cursor:default}
      .ca-hud{position:absolute;inset:0;z-index:10;pointer-events:none}
      .ca-board{position:absolute;right:12px;top:12px;width:190px;padding:10px 12px;background:#ffffffc9;border:1px solid #00000017;box-shadow:0 2px 8px #0002}
      .ca-board-title{text-align:center;color:#666;font-size:.78rem;font-weight:700;margin-bottom:7px}.ca-row{display:flex;gap:7px;align-items:center;padding:2px 0;color:#555;font-size:.71rem}.ca-row.you{color:#168edc;font-weight:800}.ca-rank{width:18px;color:#888}.ca-rname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ca-rmass{color:#777;font-size:.64rem}
      .ca-bottom{position:absolute;left:12px;bottom:12px;display:flex;flex-direction:column;gap:5px}.ca-mass,.ca-help{background:#ffffffc9;border:1px solid #00000017;box-shadow:0 2px 7px #0001;padding:7px 10px;color:#555}.ca-mass{font-size:.72rem;font-weight:700}.ca-help{max-width:340px;font-size:.62rem;line-height:1.4}
      .ca-map{position:absolute;right:12px;bottom:12px;width:150px;height:150px;background:#ffffffc9;border:1px solid #0003}.ca-map canvas{width:100%;height:100%}
      .ca-audio{position:absolute;z-index:12;left:12px;top:12px;padding:7px 9px;background:#ffffffd6;border:1px solid #0002;color:#666;font:inherit;font-size:.64rem;cursor:pointer}
      .ca-theme{position:absolute;z-index:12;left:86px;top:12px;padding:7px 9px;background:#ffffffd6;border:1px solid #0002;color:#666;font:inherit;font-size:.64rem;cursor:pointer}
      .ca.dark{background:#15191f;color:#eee}
      .ca.dark .ca-board,.ca.dark .ca-mass,.ca.dark .ca-help,.ca.dark .ca-audio,.ca.dark .ca-theme{background:#20262ee8;border-color:#ffffff18;color:#cbd3dc}
      .ca.dark .ca-board-title{color:#d9e0e7}
      .ca.dark .ca-row{color:#bdc7d1}.ca.dark .ca-row.you{color:#58b9ff}.ca.dark .ca-rank,.ca.dark .ca-rmass{color:#8995a1}
      .ca.dark .ca-map{background:#20262ee8;border-color:#ffffff24}
      .ca.dark .ca-ov{background:#141920e8}
      .ca.dark .ca-card{background:#20262ef5;border-color:#ffffff1d;box-shadow:0 12px 38px #0008}
      .ca.dark .ca-sub,.ca.dark .ca-end-sub{color:#aab4be}
      .ca.dark .ca-name{background:#151a20;border-color:#ffffff26;color:#eef3f7}
      .ca.dark .ca-rule,.ca.dark .ca-stat{background:#181e25;border-color:#ffffff15;color:#9faab6}
      .ca.dark .ca-rule b,.ca.dark .ca-stat b{color:#e0e6ec}
      .ca.dark .ca-stat span{color:#8f9aa6}

      .ca-ov{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:#f6f6f6d9;backdrop-filter:blur(3px)}.ca-ov.hide{display:none}
      .ca-card{width:min(560px,100%);padding:28px 30px;text-align:center;background:#fffffff2;border:1px solid #0002;border-radius:5px;box-shadow:0 12px 38px #0003}
      .ca-logo{font-size:clamp(2.8rem,7vw,4.9rem);line-height:.95;font-weight:900;letter-spacing:-.07em;margin-bottom:8px}.ca-logo .c1{color:#46a4f4}.ca-logo .c2{color:#ef586d}.ca-logo .c3{color:#78cd5e}.ca-logo .c4{color:#f0b34d}.ca-sub{color:#777;font-size:.82rem;line-height:1.45;margin-bottom:20px}
      .ca-name{width:100%;padding:12px 13px;border:1px solid #ccc;background:white;font:inherit;text-align:center;outline:none}.ca-name:focus{border-color:#51a9ec;box-shadow:0 0 0 2px #51a9ec20}
      .ca-colors{display:flex;justify-content:center;flex-wrap:wrap;gap:7px;margin:14px 0 18px}.ca-color{width:26px;height:26px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:0 1px 4px #0002}.ca-color.sel{border-color:#333}
      .ca-play{width:100%;padding:13px;border:0;background:#49a7ef;color:white;font:inherit;font-weight:800;cursor:pointer;box-shadow:inset 0 -2px 0 #0002}.ca-rules{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.ca-rule{padding:9px 8px;border:1px solid #ddd;background:#fafafa;color:#777;font-size:.64rem;line-height:1.38}.ca-rule b{display:block;color:#555;margin-bottom:2px}
      .ca-end-title{font-size:2.1rem;font-weight:900;color:#ec5c68;margin-bottom:7px}.ca-end-sub{color:#777;margin-bottom:17px}.ca-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:17px}.ca-stat{padding:10px 7px;border:1px solid #e1e1e1;background:#fafafa}.ca-stat span{display:block;color:#888;font-size:.56rem;text-transform:uppercase;font-weight:700}.ca-stat b{display:block;color:#444;margin-top:3px}
      @media(max-width:760px){.ca-board{width:145px;right:7px;top:7px;padding:7px 8px}.ca-row{font-size:.59rem}.ca-map{width:105px;height:105px;right:7px;bottom:7px}.ca-bottom{left:7px;bottom:7px}.ca-help{display:none}.ca-audio{left:7px;top:7px}.ca-theme{left:80px;top:7px}.ca-rules{grid-template-columns:1fr}.ca-stats{grid-template-columns:1fr 1fr}}
    `;

    const root=document.createElement('div');root.className='ca';
    root.innerHTML=`
      <canvas class="ca-main"></canvas>
      <div class="ca-hud">
        <div class="ca-board"><div class="ca-board-title">Leaderboard</div><div class="ca-list"></div></div>
        <div class="ca-bottom"><div class="ca-mass">Mass: <span class="ca-mass-v">0</span></div><div class="ca-help">Maus = bewegen · <b>SPACE</b> = teilen · <b>W</b> = Masse auswerfen · Viren geben Masse, teilen große Zellen aber auf · rote Spawner erzeugen Pellet-Felder.</div></div>
        <div class="ca-map"><canvas></canvas></div>
      </div>
      <button class="ca-audio" type="button">Sound: An</button>
      <button class="ca-theme" type="button">Dark Mode</button>
      <div class="ca-ov ca-menu"><div class="ca-card">
        <div class="ca-logo"><span class="c1">C</span><span class="c2">e</span><span class="c3">l</span><span class="c4">l</span> Arena</div>
        <div class="ca-sub">Werde größer, verschlinge kleinere Zellen und kämpfe dich an die Spitze.</div>
        <input class="ca-name" maxlength="16" value="Player" placeholder="Name" autocomplete="off" spellcheck="false">
        <div class="ca-colors">${PLAYER_COLORS.map((c,i)=>`<button class="ca-color ${i===0?'sel':''}" data-color="${c}" style="background:${c}" type="button"></button>`).join('')}</div>
        <button class="ca-play" type="button">Play</button>
        <div class="ca-rules"><div class="ca-rule"><b>Grow</b>Pellets sammeln und kleinere Gegner verschlingen.</div><div class="ca-rule"><b>Split</b>SPACE teilt deine Zelle und schleudert die Hälfte nach vorne.</div><div class="ca-rule"><b>Viruses & Spawners</b>Viren geben Masse, zerlegen große Zellen aber. Seltene rote Spawner erzeugen viele Pellets.</div></div>
      </div></div>
      <div class="ca-ov ca-end hide"><div class="ca-card">
        <div class="ca-end-title">You were eaten!</div><div class="ca-end-sub">Deine Arena-Runde ist vorbei.</div>
        <div class="ca-stats"><div class="ca-stat"><span>Best Mass</span><b class="em">0</b></div><div class="ca-stat"><span>Cells Eaten</span><b class="ec">0</b></div><div class="ca-stat"><span>Food</span><b class="ef">0</b></div><div class="ca-stat"><span>Time</span><b class="et">0:00</b></div></div>
        <button class="ca-play restart" type="button">Play Again</button>
      </div></div>`;
    container.append(style,root);

    const canvas=root.querySelector('.ca-main'),ctx=canvas.getContext('2d'),mini=root.querySelector('.ca-map canvas'),mctx=mini.getContext('2d');
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const listEl=$('.ca-list'),massEl=$('.ca-mass-v'),audioBtn=$('.ca-audio'),themeBtn=$('.ca-theme'),menu=$('.ca-menu'),end=$('.ca-end'),nameInput=$('.ca-name');
    const rand=(a,b)=>a+Math.random()*(b-a),rint=(a,b)=>Math.floor(rand(a,b+1)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),radius=m=>Math.sqrt(Math.max(1,m))*4.15;
    const norm=(x,y)=>{const l=Math.hypot(x,y);return l>.0001?{x:x/l,y:y/l,l}:{x:0,y:0,l:0}};
    const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t)%60).padStart(2,'0')}`;
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    const shade=(hex,p)=>{const v=parseInt(hex.replace('#',''),16),n=Math.round(2.55*p),r=clamp((v>>16)+n,0,255),g=clamp(((v>>8)&255)+n,0,255),b=clamp((v&255)+n,0,255);return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1)};

    function ensureAudio(){if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
    function tone(f,d=.04,v=.011,type='sine'){const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}

    function owner(name,color,isPlayer=false){
      const sx=rand(0,CONFIG.worldSize),sy=rand(0,CONFIG.worldSize);
      return{
        id:nextId++,name,color,isPlayer,alive:true,cells:[],totalMass:0,best:0,
        ai:isPlayer?null:{
          think:rand(.10,.24),
          tx:sx,ty:sy,
          goalX:sx,goalY:sy,
          split:rand(.5,2),
          wander:rand(1.2,3.4),
          biasAngle:rand(0,Math.PI*2),
          mode:'wander'
        }
      }
    }
    function cell(o,x,y,m,vx=0,vy=0,age=CONFIG.recombineDelay){const c={id:nextId++,ownerId:o.id,x,y,mass:m,r:radius(m),vx,vy,age,alive:true};o.cells.push(c);entities.push(c);return c}
    function pellet(x=null,y=null,ttl=null,spawnerId=null){
      return{
        id:nextId++,
        x:x??rand(14,CONFIG.worldSize-14),
        y:y??rand(14,CONFIG.worldSize-14),
        r:rand(3.8,5.7),
        mass:1.15,
        color:FOOD_COLORS[rint(0,FOOD_COLORS.length-1)],
        ttl,
        spawnerId
      }
    }
    function virus(){
      return{id:nextId++,x:rand(80,CONFIG.worldSize-80),y:rand(80,CONFIG.worldSize-80),r:radius(100)*.94,mass:100}
    }
    function spawner(){
      const base=radius(122);
      return{
        id:nextId++,
        x:rand(150,CONFIG.worldSize-150),
        y:rand(150,CONFIG.worldSize-150),
        r:base,
        life:CONFIG.spawnerLifetime,
        maxLife:CONFIG.spawnerLifetime,
        pelletTimer:rand(CONFIG.spawnerPelletIntervalMin,CONFIG.spawnerPelletIntervalMax),
        phase:rand(0,Math.PI*2)
      }
    }
    function ownerById(id){if(player?.id===id)return player;return bots.find(o=>o.id===id)||null}
    function recalc(o){o.cells=o.cells.filter(c=>c.alive);o.totalMass=o.cells.reduce((s,c)=>s+c.mass,0);o.best=Math.max(o.best,o.totalMass);if(!o.cells.length)o.alive=false}
    function recalcAll(){if(player)recalc(player);bots.forEach(recalc)}
    function center(o){let m=0,x=0,y=0;for(const c of o.cells)if(c.alive){m+=c.mass;x+=c.x*c.mass;y+=c.y*c.mass}return m?{x:x/m,y:y/m}:{x:CONFIG.worldSize/2,y:CONFIG.worldSize/2}}
    function largest(o){let b=null;for(const c of o.cells)if(c.alive&&(!b||c.mass>b.mass))b=c;return b}
    function aliveOwners(){return [player,...bots].filter(o=>o&&o.alive&&o.cells.some(c=>c.alive))}
    function safeSpawn(){for(let n=0;n<120;n++){const p={x:rand(260,CONFIG.worldSize-260),y:rand(260,CONFIG.worldSize-260)};let bad=false;for(const c of entities)if(c.alive&&c.mass>50&&Math.hypot(p.x-c.x,p.y-c.y)<c.r+230){bad=true;break}if(!bad)return p}return{x:rand(200,CONFIG.worldSize-200),y:rand(200,CONFIG.worldSize-200)}}
    function spawnOwner(o,m=CONFIG.startMass){const p=safeSpawn();cell(o,p.x,p.y,m);recalc(o)}
    function maintain(){
      while(food.length<CONFIG.foodTarget)food.push(pellet());
      const desiredViruses=Math.max(0,CONFIG.virusTarget-spawners.length);
      while(viruses.length<desiredViruses)viruses.push(virus());
      while(viruses.length>desiredViruses)viruses.splice(rint(0,viruses.length-1),1);
    }

    function spawnSpawnerPellets(s){
      const count=rint(CONFIG.spawnerPelletsMin,CONFIG.spawnerPelletsMax);
      for(let i=0;i<count;i++){
        const a=rand(0,Math.PI*2);
        const d=rand(s.r*1.35,s.r*3.25);
        const x=clamp(s.x+Math.cos(a)*d,14,CONFIG.worldSize-14);
        const y=clamp(s.y+Math.sin(a)*d,14,CONFIG.worldSize-14);
        food.push(pellet(x,y,CONFIG.spawnerPelletLifetime,s.id));
      }
    }

    function updateSpawners(dt){
      spawnerSpawnTimer-=dt;

      if(spawnerSpawnTimer<=0){
        if(spawners.length<CONFIG.spawnerMax&&Math.random()<CONFIG.spawnerSpawnChance){
          const s=spawner();
          spawners.push(s);
          spawnSpawnerPellets(s);
        }
        spawnerSpawnTimer=rand(CONFIG.spawnerMinDelay,CONFIG.spawnerMaxDelay);
      }

      for(let i=spawners.length-1;i>=0;i--){
        const s=spawners[i];
        s.life-=dt;
        s.phase+=dt*2.1;
        s.pelletTimer-=dt;

        if(s.pelletTimer<=0){
          spawnSpawnerPellets(s);
          s.pelletTimer=rand(CONFIG.spawnerPelletIntervalMin,CONFIG.spawnerPelletIntervalMax);
        }

        if(s.life<=0){
          spawners.splice(i,1);
        }
      }

      for(let i=food.length-1;i>=0;i--){
        const p=food[i];
        if(p.ttl==null)continue;
        p.ttl-=dt;
        if(p.ttl<=0)food.splice(i,1);
      }
    }
    const speed=c=>CONFIG.baseSpeed/Math.pow(Math.max(1,c.mass/CONFIG.startMass),.23);

    function moveOwner(o,tx,ty,dt){for(const c of o.cells){if(!c.alive)continue;c.age+=dt;const d=norm(tx-c.x,ty-c.y),slow=clamp(d.l/Math.max(70,c.r*2.1),.12,1),sp=speed(c)*slow;c.x+=d.x*sp*dt+c.vx*dt;c.y+=d.y*sp*dt+c.vy*dt;const drag=Math.pow(.945,dt*60);c.vx*=drag;c.vy*=drag;c.r=radius(c.mass);c.x=clamp(c.x,c.r,CONFIG.worldSize-c.r);c.y=clamp(c.y,c.r,CONFIG.worldSize-c.r)}}
    function sameOwnerPhysics(o){const a=o.cells.filter(c=>c.alive);for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const A=a[i],B=a[j],dx=B.x-A.x,dy=B.y-A.y,d=Math.max(.001,Math.hypot(dx,dy)),min=(A.r+B.r)*.92,merge=A.age>=CONFIG.recombineDelay&&B.age>=CONFIG.recombineDelay;if(merge&&d<Math.max(A.r,B.r)*.42){const keep=A.mass>=B.mass?A:B,eat=keep===A?B:A,total=keep.mass+eat.mass;keep.x=(keep.x*keep.mass+eat.x*eat.mass)/total;keep.y=(keep.y*keep.mass+eat.y*eat.mass)/total;keep.mass=total;keep.r=radius(total);keep.age=CONFIG.recombineDelay;eat.alive=false}else if(!merge&&d<min){const ov=min-d,nx=dx/d,ny=dy/d,total=A.mass+B.mass;A.x-=nx*ov*(B.mass/total)*.55;A.y-=ny*ov*(B.mass/total)*.55;B.x+=nx*ov*(A.mass/total)*.55;B.y+=ny*ov*(A.mass/total)*.55}}}

    function split(o,tx,ty,maxCells){const arr=o.cells.filter(c=>c.alive).sort((a,b)=>b.mass-a.mass);let slots=maxCells-arr.length,did=false;for(const c of arr){if(slots<=0||c.mass<CONFIG.splitMinMass)continue;const a=Math.atan2(ty-c.y,tx-c.x),m=c.mass*.5;c.mass=m;c.r=radius(m);c.age=0;cell(o,c.x+Math.cos(a)*c.r*.75,c.y+Math.sin(a)*c.r*.75,m,Math.cos(a)*CONFIG.splitVelocity,Math.sin(a)*CONFIG.splitVelocity,0);slots--;did=true}if(did&&o.isPlayer)tone(320,.055,.014,'triangle')}
    function eject(o,tx,ty){if(ejected.length>160)return;const c=largest(o);if(!c||c.mass<CONFIG.ejectMinMass)return;const a=Math.atan2(ty-c.y,tx-c.x);c.mass-=CONFIG.ejectCost;c.r=radius(c.mass);ejected.push({id:nextId++,ownerId:o.id,x:c.x+Math.cos(a)*(c.r+16),y:c.y+Math.sin(a)*(c.r+16),r:radius(CONFIG.ejectMass)*.72,mass:CONFIG.ejectMass,vx:Math.cos(a)*CONFIG.ejectVelocity,vy:Math.sin(a)*CONFIG.ejectVelocity,life:12});if(o.isPlayer)tone(235,.035,.007)}

    function eatSmall(c){for(let i=food.length-1;i>=0;i--){const p=food[i];if(Math.abs(p.x-c.x)>c.r+9||Math.abs(p.y-c.y)>c.r+9)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){c.mass+=p.mass;food.splice(i,1);if(c.ownerId===player?.id)eatenFood++}}for(let i=ejected.length-1;i>=0;i--){const p=ejected[i];if(p.ownerId===c.ownerId&&p.life>10.5)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){c.mass+=p.mass;ejected.splice(i,1)}}}
    function eatCells(){const a=entities.filter(c=>c.alive).sort((x,y)=>y.mass-x.mass);for(let i=0;i<a.length;i++){const eater=a[i];if(!eater.alive)continue;for(let j=a.length-1;j>=0;j--){const prey=a[j];if(!prey.alive||prey.id===eater.id||prey.ownerId===eater.ownerId||eater.mass<prey.mass*CONFIG.eatRatio)continue;const d=Math.hypot(prey.x-eater.x,prey.y-eater.y),th=eater.r-prey.r*CONFIG.eatOverlap;if(d<Math.max(2,th)){prey.alive=false;eater.mass+=prey.mass;eater.r=radius(eater.mass);if(eater.ownerId===player?.id){eatenCells++;tone(430,.045,.011)}}}}}
    function virusHit(){
      for(const c of entities){
        if(!c.alive||c.mass<CONFIG.virusSplitMass)continue;

        const o=ownerById(c.ownerId);
        if(!o)continue;

        for(let vi=viruses.length-1;vi>=0;vi--){
          const v=viruses[vi];
          if(Math.hypot(c.x-v.x,c.y-v.y)>=c.r+v.r*.30)continue;

          // Der Virus wird wirklich "gegessen": erst Masse gewinnen,
          // danach wird die nun größere Zelle in mehrere Teile gesprengt.
          c.mass+=CONFIG.virusMassGain;
          c.r=radius(c.mass);

          const max=o.isPlayer?CONFIG.maxPlayerCells:CONFIG.maxBotCells;
          const aliveCount=o.cells.filter(x=>x.alive).length;
          const available=max-aliveCount+1;

          viruses.splice(vi,1);

          if(available>1){
            const pieces=Math.min(
              available,
              Math.max(4,Math.min(8,Math.floor(c.mass/45)))
            );
            const totalMass=c.mass;
            const m=totalMass/pieces;

            c.mass=m;
            c.r=radius(m);
            c.age=0;

            for(let i=1;i<pieces;i++){
              const a=i/pieces*Math.PI*2+rand(-.18,.18);
              cell(
                o,
                c.x+Math.cos(a)*c.r*.35,
                c.y+Math.sin(a)*c.r*.35,
                m,
                Math.cos(a)*rand(390,630),
                Math.sin(a)*rand(390,630),
                0
              );
            }
          }

          if(o.isPlayer){
            tone(170,.075,.014,'triangle');
            setTimeout(()=>{if(!destroyed)tone(265,.055,.009,'sine')},45);
          }

          break;
        }
      }
    }

    function updateEjected(dt){for(let i=ejected.length-1;i>=0;i--){const p=ejected[i];p.life-=dt;const drag=Math.pow(.92,dt*60);p.vx*=drag;p.vy*=drag;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,p.r,CONFIG.worldSize-p.r);p.y=clamp(p.y,p.r,CONFIG.worldSize-p.r);if(p.life<=0)ejected.splice(i,1)}}

    function threatVector(o,c,m){
      let vx=0,vy=0,weight=0,closest=null,closestD=1e9;

      for(const q of aliveOwners()){
        if(q.id===o.id)continue;

        for(const x of q.cells){
          if(!x.alive||x.mass<m*CONFIG.eatRatio)continue;

          const dx=c.x-x.x,dy=c.y-x.y;
          const d=Math.max(1,Math.hypot(dx,dy));
          if(d>760+x.r)continue;

          const danger=clamp(1-d/(760+x.r),0,1);
          const massFactor=clamp(x.mass/m,1,4);
          const w=danger*danger*massFactor;

          vx+=dx/d*w;
          vy+=dy/d*w;
          weight+=w;

          if(d<closestD){
            closestD=d;
            closest=x;
          }
        }
      }

      if(weight<=0)return null;
      const n=norm(vx,vy);
      return{dx:n.x,dy:n.y,weight,closest,d:closestD};
    }

    function bestPrey(o,c,m){
      let best=null,bs=-1e9;

      for(const q of aliveOwners()){
        if(q.id===o.id)continue;

        for(const x of q.cells){
          if(!x.alive||m<x.mass*CONFIG.eatRatio)continue;

          const d=Math.hypot(x.x-c.x,x.y-c.y);
          if(d>1050)continue;

          const edgeBonus=1-Math.min(x.x,x.y,CONFIG.worldSize-x.x,CONFIG.worldSize-x.y)/CONFIG.worldSize;
          const s=x.mass*2.65-d*.105+edgeBonus*18;

          if(s>bs){
            bs=s;
            best={cell:x,d,score:s};
          }
        }
      }

      return best;
    }

    function bestFoodCluster(c){
      if(!food.length)return null;

      let best=null,bs=-1e9;
      const samples=Math.min(120,food.length);

      for(let i=0;i<samples;i++){
        const p=food[rint(0,food.length-1)];
        if(!p)continue;

        const d=Math.hypot(p.x-c.x,p.y-c.y);
        if(d>900)continue;

        let local=0;
        for(let j=0;j<18;j++){
          const q=food[rint(0,food.length-1)];
          if(q&&Math.hypot(q.x-p.x,q.y-p.y)<150)local++;
        }

        const s=local*15-d*.045+(p.spawnerId?38:0);

        if(s>bs){
          bs=s;
          best=p;
        }
      }

      return best;
    }

    function hazardAvoidance(c,big){
      let vx=0,vy=0,w=0;

      if(big.mass>=CONFIG.virusSplitMass){
        for(const v of viruses){
          const dx=c.x-v.x,dy=c.y-v.y;
          const d=Math.max(1,Math.hypot(dx,dy));
          if(d>330+v.r)continue;
          const k=clamp(1-d/(330+v.r),0,1)*1.4;
          vx+=dx/d*k;vy+=dy/d*k;w+=k;
        }
      }

      for(const s of spawners){
        const dx=c.x-s.x,dy=c.y-s.y;
        const d=Math.max(1,Math.hypot(dx,dy));
        // Spawner ist kein Schaden, Bots dürfen ihn für Food anfliegen.
        // Nur direkt ins Zentrum sollen sie nicht steuern.
        if(d<s.r*1.15){
          const k=1.1;
          vx+=dx/d*k;vy+=dy/d*k;w+=k;
        }
      }

      if(w<=0)return null;
      const n=norm(vx,vy);
      return{x:n.x,y:n.y,w};
    }

    function updateBot(o,dt){
      if(!o.alive||!o.cells.length)return;

      const ai=o.ai;
      const c=center(o);
      const big=largest(o);
      if(!big)return;

      ai.think-=dt;
      ai.split-=dt;
      ai.wander-=dt;

      if(ai.think<=0){
        ai.think=rand(.13,.27);

        const threat=threatVector(o,c,big.mass);
        const avoid=hazardAvoidance(c,big);
        const prey=bestPrey(o,c,big.mass);

        if(threat&&threat.weight>.18){
          ai.mode='flee';

          let dx=threat.dx,dy=threat.dy;
          if(avoid){
            dx+=avoid.x*.75;
            dy+=avoid.y*.75;
          }

          const n=norm(dx,dy);
          ai.goalX=clamp(c.x+n.x*900,50,CONFIG.worldSize-50);
          ai.goalY=clamp(c.y+n.y*900,50,CONFIG.worldSize-50);
        }else if(prey&&prey.score>10){
          ai.mode='hunt';

          // Etwas vor das Ziel zielen, statt immer exakt auf die aktuelle Position.
          const lead=clamp(prey.d/550,0,.7);
          ai.goalX=clamp(prey.cell.x+prey.cell.vx*lead,30,CONFIG.worldSize-30);
          ai.goalY=clamp(prey.cell.y+prey.cell.vy*lead,30,CONFIG.worldSize-30);

          const splitReach=big.r*4.2+185;
          const safeSplit=
            big.mass>prey.cell.mass*2.25 &&
            prey.d<splitReach &&
            prey.d>big.r*.75 &&
            o.cells.filter(x=>x.alive).length<CONFIG.maxBotCells &&
            ai.split<=0 &&
            !threat;

          if(safeSplit){
            split(o,ai.goalX,ai.goalY,CONFIG.maxBotCells);
            ai.split=rand(4.2,6.8);
          }
        }else{
          ai.mode='feed';
          const f=bestFoodCluster(c);

          if(f){
            ai.goalX=f.x;
            ai.goalY=f.y;
          }else if(ai.wander<=0){
            ai.wander=rand(1.8,4.0);
            ai.biasAngle+=rand(-1.0,1.0);
            ai.goalX=clamp(c.x+Math.cos(ai.biasAngle)*rand(350,850),80,CONFIG.worldSize-80);
            ai.goalY=clamp(c.y+Math.sin(ai.biasAngle)*rand(350,850),80,CONFIG.worldSize-80);
          }
        }

        // Sanfte Rand-Abstoßung verhindert hektisches Festkleben an der Mapkante.
        const margin=260;
        if(c.x<margin)ai.goalX=Math.max(ai.goalX,margin+220);
        if(c.y<margin)ai.goalY=Math.max(ai.goalY,margin+220);
        if(c.x>CONFIG.worldSize-margin)ai.goalX=Math.min(ai.goalX,CONFIG.worldSize-margin-220);
        if(c.y>CONFIG.worldSize-margin)ai.goalY=Math.min(ai.goalY,CONFIG.worldSize-margin-220);
      }

      // Das eigentliche Steuerziel wird kontinuierlich geglättet.
      const steer=1-Math.pow(.0025,dt);
      ai.tx+=(ai.goalX-ai.tx)*steer;
      ai.ty+=(ai.goalY-ai.ty)*steer;

      moveOwner(o,ai.tx,ai.ty,dt);
      sameOwnerPhysics(o);
    }


    function updatePlayer(dt){if(!player?.alive)return;mouse.wx=camera.x+(mouse.x-width/2)/camera.zoom;mouse.wy=camera.y+(mouse.y-height/2)/camera.zoom;moveOwner(player,mouse.wx,mouse.wy,dt);sameOwnerPhysics(player)}
    function updateCamera(){if(!player?.cells.length)return;const c=center(player);camera.x+=(c.x-camera.x)*.12;camera.y+=(c.y-camera.y)*.12;const m=Math.max(CONFIG.startMass,player.totalMass),sf=Math.max(1,Math.sqrt(player.cells.length)*.42+.58);camera.targetZoom=clamp(CONFIG.baseZoom/Math.pow(m/CONFIG.startMass,.18)/sf,CONFIG.minZoom,CONFIG.maxZoom);camera.zoom+=(camera.targetZoom-camera.zoom)*.10}
    function leaderboard(){const a=aliveOwners().slice().sort((x,y)=>y.totalMass-x.totalMass).slice(0,10);listEl.innerHTML=a.map((o,i)=>`<div class="ca-row ${o.isPlayer?'you':''}"><span class="ca-rank">${i+1}.</span><span class="ca-rname">${esc(o.name)}</span><span class="ca-rmass">${Math.round(o.totalMass)}</span></div>`).join('')}

    function screen(x,y){return{x:width/2+(x-camera.x)*camera.zoom,y:height/2+(y-camera.y)*camera.zoom}}
    function drawGrid(){
      ctx.fillStyle=darkMode?'#15191f':'#f4f4f4';
      ctx.fillRect(0,0,width,height);

      const l=camera.x-width/2/camera.zoom,r=camera.x+width/2/camera.zoom,t=camera.y-height/2/camera.zoom,b=camera.y+height/2/camera.zoom,g=CONFIG.gridSize,sx=Math.floor(l/g)*g,sy=Math.floor(t/g)*g;

      ctx.strokeStyle=darkMode?'#ffffff0d':'#00000012';
      ctx.lineWidth=1;
      ctx.beginPath();

      for(let x=sx;x<=r;x+=g){
        const p=screen(x,0).x;
        ctx.moveTo(p,0);ctx.lineTo(p,height);
      }

      for(let y=sy;y<=b;y+=g){
        const p=screen(0,y).y;
        ctx.moveTo(0,p);ctx.lineTo(width,p);
      }

      ctx.stroke();

      const a=screen(0,0),z=screen(CONFIG.worldSize,CONFIG.worldSize);
      ctx.strokeStyle=darkMode?'#ffffff55':'#0006';
      ctx.lineWidth=4;
      ctx.strokeRect(a.x,a.y,z.x-a.x,z.y-a.y);
    }
    function drawFood(){for(const f of food){const p=screen(f.x,f.y),r=f.r*camera.zoom;if(p.x<-r||p.y<-r||p.x>width+r||p.y>height+r)continue;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.4,r),0,Math.PI*2);ctx.fill()}}
    function drawVirus(v){const p=screen(v.x,v.y),r=v.r*camera.zoom;if(p.x<-r||p.y<-r||p.x>width+r||p.y>height+r)return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#35b754';ctx.strokeStyle='#208b39';ctx.lineWidth=Math.max(1.4,camera.zoom*2);ctx.beginPath();for(let i=0;i<56;i++){const a=i/56*Math.PI*2,rr=r*(i%2===0?1.13:.91),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff22';ctx.beginPath();ctx.arc(-r*.2,-r*.2,r*.45,0,Math.PI*2);ctx.fill();ctx.restore()}

    function drawSpawner(s){
      const p=screen(s.x,s.y);
      const pulse=1+Math.sin(s.phase)*.055;
      const r=s.r*1.12*camera.zoom*pulse;
      if(p.x<-r||p.y<-r||p.x>width+r||p.y>height+r)return;

      ctx.save();
      ctx.translate(p.x,p.y);

      const spikes=32;
      ctx.fillStyle='#d9434e';
      ctx.strokeStyle='#8d202d';
      ctx.lineWidth=Math.max(2,camera.zoom*2.5);
      ctx.shadowBlur=Math.max(5,15*camera.zoom);
      ctx.shadowColor='#ff4b5f88';

      ctx.beginPath();
      for(let i=0;i<spikes*2;i++){
        const a=i/(spikes*2)*Math.PI*2;
        const rr=r*(i%2===0?1.12:.90);
        const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur=0;
      ctx.strokeStyle='#ffb0b6aa';
      ctx.lineWidth=Math.max(1.3,camera.zoom*1.8);
      ctx.beginPath();
      ctx.arc(0,0,r*.53,0,Math.PI*2);
      ctx.stroke();

      ctx.fillStyle='#ffffffcc';
      ctx.font=`900 ${Math.max(8,r*.24)}px Arial`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText('●',0,0);

      // dezenter Lebenszeit-Ring
      const life=clamp(s.life/s.maxLife,0,1);
      ctx.strokeStyle='#ffffff70';
      ctx.lineWidth=Math.max(1.2,camera.zoom*2);
      ctx.beginPath();
      ctx.arc(0,0,r*1.22,-Math.PI/2,-Math.PI/2+Math.PI*2*life);
      ctx.stroke();

      ctx.restore();
    }
    function drawEjected(){for(const e of ejected){const p=screen(e.x,e.y),r=e.r*camera.zoom;ctx.fillStyle='#ef9da8';ctx.strokeStyle='#b64a5a55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,r),0,Math.PI*2);ctx.fill();ctx.stroke()}}
    function drawCell(c){if(!c.alive)return;const o=ownerById(c.ownerId);if(!o)return;const p=screen(c.x,c.y),r=c.r*camera.zoom;if(p.x<-r-20||p.y<-r-20||p.x>width+r+20||p.y>height+r+20)return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=o.color;ctx.strokeStyle=shade(o.color,-22);ctx.lineWidth=clamp(r*.055,1.4,8);ctx.beginPath();ctx.arc(0,0,Math.max(2,r),0,Math.PI*2);ctx.fill();ctx.stroke();const sh=ctx.createRadialGradient(-r*.28,-r*.32,r*.05,0,0,r);sh.addColorStop(0,'#ffffff38');sh.addColorStop(.6,'#ffffff08');sh.addColorStop(1,'#0000000b');ctx.fillStyle=sh;ctx.beginPath();ctx.arc(0,0,Math.max(1,r-ctx.lineWidth),0,Math.PI*2);ctx.fill();if(r>13){const fs=clamp(r*.33,9,34);ctx.fillStyle='white';ctx.strokeStyle='#0008';ctx.lineWidth=clamp(fs*.10,1.4,4);ctx.font=`700 ${fs}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';const yy=r>34?-fs*.16:0;ctx.strokeText(o.name,0,yy);ctx.fillText(o.name,0,yy);if(r>34){const mf=Math.max(8,fs*.55);ctx.font=`700 ${mf}px Arial`;ctx.strokeText(Math.round(c.mass),0,fs*.58);ctx.fillText(Math.round(c.mass),0,fs*.58)}}ctx.restore()}
    function drawMini(){
      const r=mini.getBoundingClientRect(),mw=r.width,mh=r.height,md=Math.min(2,devicePixelRatio||1),pw=Math.max(1,Math.round(mw*md)),ph=Math.max(1,Math.round(mh*md));

      if(mini.width!==pw||mini.height!==ph){
        mini.width=pw;mini.height=ph;mctx.setTransform(md,0,0,md,0,0);
      }

      mctx.fillStyle=darkMode?'#1b2128':'#f5f5f5';
      mctx.fillRect(0,0,mw,mh);
      mctx.strokeStyle=darkMode?'#ffffff35':'#bbb';
      mctx.strokeRect(.5,.5,mw-1,mh-1);

      const sx=mw/CONFIG.worldSize,sy=mh/CONFIG.worldSize;

      for(const s of spawners){
        mctx.fillStyle='#e64c58';
        mctx.beginPath();
        mctx.arc(s.x*sx,s.y*sy,2.5,0,Math.PI*2);
        mctx.fill();
      }

      for(const o of bots)if(o.alive){
        const c=center(o);
        mctx.fillStyle=darkMode?'#ffffff45':'#7776';
        mctx.beginPath();
        mctx.arc(c.x*sx,c.y*sy,1.5,0,Math.PI*2);
        mctx.fill();
      }

      if(player?.alive){
        const c=center(player);
        mctx.fillStyle=playerColor;
        mctx.beginPath();
        mctx.arc(c.x*sx,c.y*sy,4,0,Math.PI*2);
        mctx.fill();
        mctx.strokeStyle=darkMode?'#fff':'#333';
        mctx.stroke();
      }
    }

    function draw(){
      drawGrid();
      drawFood();
      viruses.forEach(drawVirus);
      spawners.forEach(drawSpawner);
      drawEjected();
      entities.filter(c=>c.alive).slice().sort((a,b)=>a.mass-b.mass).forEach(drawCell);
      if(running)drawMini();
    }

    function finish(){if(ended)return;ended=true;running=false;const score=Math.max(0,Math.round(bestMass*100+eatenCells*600+eatenFood*3));services?.highscores?.saveHighscore?.('cell-arena',score);$('.em').textContent=Math.round(bestMass);$('.ec').textContent=eatenCells;$('.ef').textContent=eatenFood;$('.et').textContent=fmt(matchTime);end.classList.remove('hide');tone(155,.10,.016)}
    function reset(){nextId=1;entities=[];food=[];viruses=[];spawners=[];ejected=[];bots=[];player=null;spawnerSpawnTimer=rand(18,38);matchTime=0;bestMass=0;eatenCells=0;eatenFood=0;camera={x:CONFIG.worldSize/2,y:CONFIG.worldSize/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};player=owner(playerName,playerColor,true);spawnOwner(player);for(let i=0;i<CONFIG.botCount;i++){const o=owner(BOT_NAMES[i%BOT_NAMES.length],PLAYER_COLORS[(i+2)%PLAYER_COLORS.length]);bots.push(o);spawnOwner(o,Math.random()<.14?rand(45,82):rand(26,40))}maintain();recalcAll();updateCamera();running=true;ended=false;leaderboard();massEl.textContent=Math.round(player.totalMass)}
    function start(){ensureAudio();playerName=nameInput.value.trim().slice(0,16)||'Player';menu.classList.add('hide');end.classList.add('hide');reset()}
    function update(dt){if(!running)return;matchTime+=dt;updatePlayer(dt);bots.forEach(o=>updateBot(o,dt));updateEjected(dt);updateSpawners(dt);for(const c of entities)if(c.alive)eatSmall(c);eatCells();virusHit();entities=entities.filter(c=>c.alive);recalcAll();maintain();updateCamera();bestMass=Math.max(bestMass,player?.totalMass||0);massEl.textContent=Math.round(player?.totalMass||0);leaderboard();if(!player?.alive||!player.cells.length)finish()}
    function loop(t){if(destroyed)return;const dt=Math.min(.033,Math.max(0,(t-last)/1000));last=t;update(dt);draw();raf=requestAnimationFrame(loop)}
    function resize(){const r=root.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
    function mouseMove(e){const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top}
    function keyDown(e){if(!running){if(e.code==='Enter'&&!menu.classList.contains('hide'))start();return}if(e.code==='Space'&&!e.repeat){e.preventDefault();split(player,mouse.wx,mouse.wy,CONFIG.maxPlayerCells)}if((e.key==='w'||e.key==='W')&&!e.repeat)eject(player,mouse.wx,mouse.wy)}

    $$('.ca-color').forEach(b=>b.onclick=()=>{playerColor=b.dataset.color;$$('.ca-color').forEach(x=>x.classList.toggle('sel',x===b))});
    $('.ca-menu .ca-play').onclick=start;$('.restart').onclick=start;
    audioBtn.onclick=()=>{muted=!muted;audioBtn.textContent='Sound: '+(muted?'Aus':'An');if(!muted)tone(600,.04,.01)};
    themeBtn.onclick=()=>{
      darkMode=!darkMode;
      root.classList.toggle('dark',darkMode);
      themeBtn.textContent=darkMode?'Light Mode':'Dark Mode';
    };
    canvas.addEventListener('mousemove',mouseMove);window.addEventListener('keydown',keyDown);
    ro=new ResizeObserver(resize);ro.observe(root);resize();mouse.x=width/2;mouse.y=height/2;raf=requestAnimationFrame(loop);

    return{destroy:()=>{destroyed=true;running=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',keyDown);canvas.removeEventListener('mousemove',mouseMove);try{audio?.close()}catch{}style.remove()}};
  }
};

export { CONFIG, PLAYER_COLORS, FOOD_COLORS, BOT_NAMES };
