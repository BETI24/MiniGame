const CONFIG = {
  worldSize: 5200,
  startMass: 34,
  botCount: 48,
  foodTarget: 1000,
  virusTarget: 32,
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
    tags: ['Arcade','Arena','Survival','Highscore']
  },

  init: (container, services) => {
    let destroyed=false, raf=0, ro=null, last=performance.now();
    let width=1,height=1,dpr=1,running=false,ended=false,matchTime=0,bestMass=0,eatenCells=0,eatenFood=0;
    let playerName='Player',playerColor=PLAYER_COLORS[0],nextId=1;
    let entities=[],food=[],viruses=[],ejected=[],player=null,bots=[];
    let mouse={x:0,y:0,wx:0,wy:0};
    let camera={x:CONFIG.worldSize/2,y:CONFIG.worldSize/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};
    let muted=false,audio=null;

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
      .ca-ov{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:#f6f6f6d9;backdrop-filter:blur(3px)}.ca-ov.hide{display:none}
      .ca-card{width:min(560px,100%);padding:28px 30px;text-align:center;background:#fffffff2;border:1px solid #0002;border-radius:5px;box-shadow:0 12px 38px #0003}
      .ca-logo{font-size:clamp(2.8rem,7vw,4.9rem);line-height:.95;font-weight:900;letter-spacing:-.07em;margin-bottom:8px}.ca-logo .c1{color:#46a4f4}.ca-logo .c2{color:#ef586d}.ca-logo .c3{color:#78cd5e}.ca-logo .c4{color:#f0b34d}.ca-sub{color:#777;font-size:.82rem;line-height:1.45;margin-bottom:20px}
      .ca-name{width:100%;padding:12px 13px;border:1px solid #ccc;background:white;font:inherit;text-align:center;outline:none}.ca-name:focus{border-color:#51a9ec;box-shadow:0 0 0 2px #51a9ec20}
      .ca-colors{display:flex;justify-content:center;flex-wrap:wrap;gap:7px;margin:14px 0 18px}.ca-color{width:26px;height:26px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:0 1px 4px #0002}.ca-color.sel{border-color:#333}
      .ca-play{width:100%;padding:13px;border:0;background:#49a7ef;color:white;font:inherit;font-weight:800;cursor:pointer;box-shadow:inset 0 -2px 0 #0002}.ca-rules{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.ca-rule{padding:9px 8px;border:1px solid #ddd;background:#fafafa;color:#777;font-size:.64rem;line-height:1.38}.ca-rule b{display:block;color:#555;margin-bottom:2px}
      .ca-end-title{font-size:2.1rem;font-weight:900;color:#ec5c68;margin-bottom:7px}.ca-end-sub{color:#777;margin-bottom:17px}.ca-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:17px}.ca-stat{padding:10px 7px;border:1px solid #e1e1e1;background:#fafafa}.ca-stat span{display:block;color:#888;font-size:.56rem;text-transform:uppercase;font-weight:700}.ca-stat b{display:block;color:#444;margin-top:3px}
      @media(max-width:760px){.ca-board{width:145px;right:7px;top:7px;padding:7px 8px}.ca-row{font-size:.59rem}.ca-map{width:105px;height:105px;right:7px;bottom:7px}.ca-bottom{left:7px;bottom:7px}.ca-help{display:none}.ca-audio{left:7px;top:7px}.ca-rules{grid-template-columns:1fr}.ca-stats{grid-template-columns:1fr 1fr}}
    `;

    const root=document.createElement('div');root.className='ca';
    root.innerHTML=`
      <canvas class="ca-main"></canvas>
      <div class="ca-hud">
        <div class="ca-board"><div class="ca-board-title">Leaderboard</div><div class="ca-list"></div></div>
        <div class="ca-bottom"><div class="ca-mass">Mass: <span class="ca-mass-v">0</span></div><div class="ca-help">Maus = bewegen · <b>SPACE</b> = teilen · <b>W</b> = Masse auswerfen · grüne Viren lassen große Zellen explodieren.</div></div>
        <div class="ca-map"><canvas></canvas></div>
      </div>
      <button class="ca-audio" type="button">Sound: An</button>
      <div class="ca-ov ca-menu"><div class="ca-card">
        <div class="ca-logo"><span class="c1">C</span><span class="c2">e</span><span class="c3">l</span><span class="c4">l</span> Arena</div>
        <div class="ca-sub">Werde größer, verschlinge kleinere Zellen und kämpfe dich an die Spitze.</div>
        <input class="ca-name" maxlength="16" value="Player" placeholder="Name" autocomplete="off" spellcheck="false">
        <div class="ca-colors">${PLAYER_COLORS.map((c,i)=>`<button class="ca-color ${i===0?'sel':''}" data-color="${c}" style="background:${c}" type="button"></button>`).join('')}</div>
        <button class="ca-play" type="button">Play</button>
        <div class="ca-rules"><div class="ca-rule"><b>Grow</b>Pellets sammeln und kleinere Gegner verschlingen.</div><div class="ca-rule"><b>Split</b>SPACE teilt deine Zelle und schleudert die Hälfte nach vorne.</div><div class="ca-rule"><b>Viruses</b>Große Zellen explodieren beim Kontakt in viele Teile.</div></div>
      </div></div>
      <div class="ca-ov ca-end hide"><div class="ca-card">
        <div class="ca-end-title">You were eaten!</div><div class="ca-end-sub">Deine Arena-Runde ist vorbei.</div>
        <div class="ca-stats"><div class="ca-stat"><span>Best Mass</span><b class="em">0</b></div><div class="ca-stat"><span>Cells Eaten</span><b class="ec">0</b></div><div class="ca-stat"><span>Food</span><b class="ef">0</b></div><div class="ca-stat"><span>Time</span><b class="et">0:00</b></div></div>
        <button class="ca-play restart" type="button">Play Again</button>
      </div></div>`;
    container.append(style,root);

    const canvas=root.querySelector('.ca-main'),ctx=canvas.getContext('2d'),mini=root.querySelector('.ca-map canvas'),mctx=mini.getContext('2d');
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const listEl=$('.ca-list'),massEl=$('.ca-mass-v'),audioBtn=$('.ca-audio'),menu=$('.ca-menu'),end=$('.ca-end'),nameInput=$('.ca-name');
    const rand=(a,b)=>a+Math.random()*(b-a),rint=(a,b)=>Math.floor(rand(a,b+1)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),radius=m=>Math.sqrt(Math.max(1,m))*4.15;
    const norm=(x,y)=>{const l=Math.hypot(x,y);return l>.0001?{x:x/l,y:y/l,l}:{x:0,y:0,l:0}};
    const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t)%60).padStart(2,'0')}`;
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    const shade=(hex,p)=>{const v=parseInt(hex.replace('#',''),16),n=Math.round(2.55*p),r=clamp((v>>16)+n,0,255),g=clamp(((v>>8)&255)+n,0,255),b=clamp((v&255)+n,0,255);return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1)};

    function ensureAudio(){if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
    function tone(f,d=.04,v=.011,type='sine'){const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}

    function owner(name,color,isPlayer=false){return{id:nextId++,name,color,isPlayer,alive:true,cells:[],totalMass:0,best:0,ai:isPlayer?null:{think:rand(.08,.30),tx:rand(0,CONFIG.worldSize),ty:rand(0,CONFIG.worldSize),split:rand(.5,2)}}}
    function cell(o,x,y,m,vx=0,vy=0,age=CONFIG.recombineDelay){const c={id:nextId++,ownerId:o.id,x,y,mass:m,r:radius(m),vx,vy,age,alive:true};o.cells.push(c);entities.push(c);return c}
    function pellet(){return{id:nextId++,x:rand(14,CONFIG.worldSize-14),y:rand(14,CONFIG.worldSize-14),r:rand(3.1,4.8),mass:1.15,color:FOOD_COLORS[rint(0,FOOD_COLORS.length-1)]}}
    function virus(){return{id:nextId++,x:rand(80,CONFIG.worldSize-80),y:rand(80,CONFIG.worldSize-80),r:radius(100)*.94}}
    function ownerById(id){if(player?.id===id)return player;return bots.find(o=>o.id===id)||null}
    function recalc(o){o.cells=o.cells.filter(c=>c.alive);o.totalMass=o.cells.reduce((s,c)=>s+c.mass,0);o.best=Math.max(o.best,o.totalMass);if(!o.cells.length)o.alive=false}
    function recalcAll(){if(player)recalc(player);bots.forEach(recalc)}
    function center(o){let m=0,x=0,y=0;for(const c of o.cells)if(c.alive){m+=c.mass;x+=c.x*c.mass;y+=c.y*c.mass}return m?{x:x/m,y:y/m}:{x:CONFIG.worldSize/2,y:CONFIG.worldSize/2}}
    function largest(o){let b=null;for(const c of o.cells)if(c.alive&&(!b||c.mass>b.mass))b=c;return b}
    function aliveOwners(){return [player,...bots].filter(o=>o&&o.alive&&o.cells.some(c=>c.alive))}
    function safeSpawn(){for(let n=0;n<120;n++){const p={x:rand(260,CONFIG.worldSize-260),y:rand(260,CONFIG.worldSize-260)};let bad=false;for(const c of entities)if(c.alive&&c.mass>50&&Math.hypot(p.x-c.x,p.y-c.y)<c.r+230){bad=true;break}if(!bad)return p}return{x:rand(200,CONFIG.worldSize-200),y:rand(200,CONFIG.worldSize-200)}}
    function spawnOwner(o,m=CONFIG.startMass){const p=safeSpawn();cell(o,p.x,p.y,m);recalc(o)}
    function maintain(){while(food.length<CONFIG.foodTarget)food.push(pellet());while(viruses.length<CONFIG.virusTarget)viruses.push(virus())}
    const speed=c=>CONFIG.baseSpeed/Math.pow(Math.max(1,c.mass/CONFIG.startMass),.23);

    function moveOwner(o,tx,ty,dt){for(const c of o.cells){if(!c.alive)continue;c.age+=dt;const d=norm(tx-c.x,ty-c.y),slow=clamp(d.l/Math.max(70,c.r*2.1),.12,1),sp=speed(c)*slow;c.x+=d.x*sp*dt+c.vx*dt;c.y+=d.y*sp*dt+c.vy*dt;const drag=Math.pow(.945,dt*60);c.vx*=drag;c.vy*=drag;c.r=radius(c.mass);c.x=clamp(c.x,c.r,CONFIG.worldSize-c.r);c.y=clamp(c.y,c.r,CONFIG.worldSize-c.r)}}
    function sameOwnerPhysics(o){const a=o.cells.filter(c=>c.alive);for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const A=a[i],B=a[j],dx=B.x-A.x,dy=B.y-A.y,d=Math.max(.001,Math.hypot(dx,dy)),min=(A.r+B.r)*.92,merge=A.age>=CONFIG.recombineDelay&&B.age>=CONFIG.recombineDelay;if(merge&&d<Math.max(A.r,B.r)*.42){const keep=A.mass>=B.mass?A:B,eat=keep===A?B:A,total=keep.mass+eat.mass;keep.x=(keep.x*keep.mass+eat.x*eat.mass)/total;keep.y=(keep.y*keep.mass+eat.y*eat.mass)/total;keep.mass=total;keep.r=radius(total);keep.age=CONFIG.recombineDelay;eat.alive=false}else if(!merge&&d<min){const ov=min-d,nx=dx/d,ny=dy/d,total=A.mass+B.mass;A.x-=nx*ov*(B.mass/total)*.55;A.y-=ny*ov*(B.mass/total)*.55;B.x+=nx*ov*(A.mass/total)*.55;B.y+=ny*ov*(A.mass/total)*.55}}}

    function split(o,tx,ty,maxCells){const arr=o.cells.filter(c=>c.alive).sort((a,b)=>b.mass-a.mass);let slots=maxCells-arr.length,did=false;for(const c of arr){if(slots<=0||c.mass<CONFIG.splitMinMass)continue;const a=Math.atan2(ty-c.y,tx-c.x),m=c.mass*.5;c.mass=m;c.r=radius(m);c.age=0;cell(o,c.x+Math.cos(a)*c.r*.75,c.y+Math.sin(a)*c.r*.75,m,Math.cos(a)*CONFIG.splitVelocity,Math.sin(a)*CONFIG.splitVelocity,0);slots--;did=true}if(did&&o.isPlayer)tone(320,.055,.014,'triangle')}
    function eject(o,tx,ty){if(ejected.length>160)return;const c=largest(o);if(!c||c.mass<CONFIG.ejectMinMass)return;const a=Math.atan2(ty-c.y,tx-c.x);c.mass-=CONFIG.ejectCost;c.r=radius(c.mass);ejected.push({id:nextId++,ownerId:o.id,x:c.x+Math.cos(a)*(c.r+16),y:c.y+Math.sin(a)*(c.r+16),r:radius(CONFIG.ejectMass)*.72,mass:CONFIG.ejectMass,vx:Math.cos(a)*CONFIG.ejectVelocity,vy:Math.sin(a)*CONFIG.ejectVelocity,life:12});if(o.isPlayer)tone(235,.035,.007)}

    function eatSmall(c){for(let i=food.length-1;i>=0;i--){const p=food[i];if(Math.abs(p.x-c.x)>c.r+9||Math.abs(p.y-c.y)>c.r+9)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){c.mass+=p.mass;food.splice(i,1);if(c.ownerId===player?.id)eatenFood++}}for(let i=ejected.length-1;i>=0;i--){const p=ejected[i];if(p.ownerId===c.ownerId&&p.life>10.5)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<c.r){c.mass+=p.mass;ejected.splice(i,1)}}}
    function eatCells(){const a=entities.filter(c=>c.alive).sort((x,y)=>y.mass-x.mass);for(let i=0;i<a.length;i++){const eater=a[i];if(!eater.alive)continue;for(let j=a.length-1;j>=0;j--){const prey=a[j];if(!prey.alive||prey.id===eater.id||prey.ownerId===eater.ownerId||eater.mass<prey.mass*CONFIG.eatRatio)continue;const d=Math.hypot(prey.x-eater.x,prey.y-eater.y),th=eater.r-prey.r*CONFIG.eatOverlap;if(d<Math.max(2,th)){prey.alive=false;eater.mass+=prey.mass;eater.r=radius(eater.mass);if(eater.ownerId===player?.id){eatenCells++;tone(430,.045,.011)}}}}}
    function virusHit(){for(const c of entities){if(!c.alive||c.mass<CONFIG.virusSplitMass)continue;const o=ownerById(c.ownerId);if(!o)continue;for(let vi=0;vi<viruses.length;vi++){const v=viruses[vi];if(Math.hypot(c.x-v.x,c.y-v.y)>=c.r+v.r*.30)continue;const max=o.isPlayer?CONFIG.maxPlayerCells:CONFIG.maxBotCells,available=max-o.cells.filter(x=>x.alive).length+1;if(available<=1)break;const pieces=Math.min(available,Math.max(4,Math.min(8,Math.floor(c.mass/45)))),m=c.mass/pieces;c.mass=m;c.r=radius(m);c.age=0;for(let i=1;i<pieces;i++){const a=i/pieces*Math.PI*2+rand(-.18,.18);cell(o,c.x+Math.cos(a)*c.r*.35,c.y+Math.sin(a)*c.r*.35,m,Math.cos(a)*rand(380,620),Math.sin(a)*rand(380,620),0)}viruses[vi]=virus();if(o.isPlayer)tone(150,.09,.017,'sawtooth');break}}}
    function updateEjected(dt){for(let i=ejected.length-1;i>=0;i--){const p=ejected[i];p.life-=dt;const drag=Math.pow(.92,dt*60);p.vx*=drag;p.vy*=drag;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,p.r,CONFIG.worldSize-p.r);p.y=clamp(p.y,p.r,CONFIG.worldSize-p.r);if(p.life<=0)ejected.splice(i,1)}}

    function nearestThreat(o,c,m){let best=null,bd=1e9;for(const q of aliveOwners())if(q.id!==o.id)for(const x of q.cells)if(x.alive&&x.mass>=m*CONFIG.eatRatio){const d=Math.hypot(x.x-c.x,x.y-c.y);if(d<bd){bd=d;best=x}}return best?{cell:best,d:bd}:null}
    function bestPrey(o,c,m){let best=null,bs=-1e9;for(const q of aliveOwners())if(q.id!==o.id)for(const x of q.cells)if(x.alive&&m>=x.mass*CONFIG.eatRatio){const d=Math.hypot(x.x-c.x,x.y-c.y);if(d<900){const s=x.mass*2.4-d*.12;if(s>bs){bs=s;best={cell:x,d}}}}return best}
    function randomFood(c){let best=null,bd=1e9;const n=Math.min(90,food.length);for(let i=0;i<n;i++){const p=food[rint(0,food.length-1)],d=Math.hypot(p.x-c.x,p.y-c.y);if(d<bd){bd=d;best=p}}return best}
    function updateBot(o,dt){if(!o.alive||!o.cells.length)return;const ai=o.ai,c=center(o),big=largest(o);if(!big)return;ai.think-=dt;ai.split-=dt;if(ai.think<=0){ai.think=rand(.10,.25);const t=nearestThreat(o,c,big.mass);if(t&&t.d<520+t.cell.r){const d=norm(c.x-t.cell.x,c.y-t.cell.y);ai.tx=clamp(c.x+d.x*800,20,CONFIG.worldSize-20);ai.ty=clamp(c.y+d.y*800,20,CONFIG.worldSize-20)}else{const p=bestPrey(o,c,big.mass);if(p&&Math.random()<.76){ai.tx=p.cell.x;ai.ty=p.cell.y;if(big.mass>p.cell.mass*2.15&&p.d<big.r*4.5+190&&o.cells.length<CONFIG.maxBotCells&&ai.split<=0&&Math.random()<.65){split(o,p.cell.x,p.cell.y,CONFIG.maxBotCells);ai.split=rand(3.6,6.2)}}else{const f=randomFood(c);if(f){ai.tx=f.x;ai.ty=f.y}else{ai.tx=rand(80,CONFIG.worldSize-80);ai.ty=rand(80,CONFIG.worldSize-80)}}}}moveOwner(o,ai.tx,ai.ty,dt);sameOwnerPhysics(o)}

    function updatePlayer(dt){if(!player?.alive)return;mouse.wx=camera.x+(mouse.x-width/2)/camera.zoom;mouse.wy=camera.y+(mouse.y-height/2)/camera.zoom;moveOwner(player,mouse.wx,mouse.wy,dt);sameOwnerPhysics(player)}
    function updateCamera(){if(!player?.cells.length)return;const c=center(player);camera.x+=(c.x-camera.x)*.12;camera.y+=(c.y-camera.y)*.12;const m=Math.max(CONFIG.startMass,player.totalMass),sf=Math.max(1,Math.sqrt(player.cells.length)*.42+.58);camera.targetZoom=clamp(CONFIG.baseZoom/Math.pow(m/CONFIG.startMass,.18)/sf,CONFIG.minZoom,CONFIG.maxZoom);camera.zoom+=(camera.targetZoom-camera.zoom)*.10}
    function leaderboard(){const a=aliveOwners().slice().sort((x,y)=>y.totalMass-x.totalMass).slice(0,10);listEl.innerHTML=a.map((o,i)=>`<div class="ca-row ${o.isPlayer?'you':''}"><span class="ca-rank">${i+1}.</span><span class="ca-rname">${esc(o.name)}</span><span class="ca-rmass">${Math.round(o.totalMass)}</span></div>`).join('')}

    function screen(x,y){return{x:width/2+(x-camera.x)*camera.zoom,y:height/2+(y-camera.y)*camera.zoom}}
    function drawGrid(){ctx.fillStyle='#f4f4f4';ctx.fillRect(0,0,width,height);const l=camera.x-width/2/camera.zoom,r=camera.x+width/2/camera.zoom,t=camera.y-height/2/camera.zoom,b=camera.y+height/2/camera.zoom,g=CONFIG.gridSize,sx=Math.floor(l/g)*g,sy=Math.floor(t/g)*g;ctx.strokeStyle='#00000012';ctx.lineWidth=1;ctx.beginPath();for(let x=sx;x<=r;x+=g){const p=screen(x,0).x;ctx.moveTo(p,0);ctx.lineTo(p,height)}for(let y=sy;y<=b;y+=g){const p=screen(0,y).y;ctx.moveTo(0,p);ctx.lineTo(width,p)}ctx.stroke();const a=screen(0,0),z=screen(CONFIG.worldSize,CONFIG.worldSize);ctx.strokeStyle='#0006';ctx.lineWidth=4;ctx.strokeRect(a.x,a.y,z.x-a.x,z.y-a.y)}
    function drawFood(){for(const f of food){const p=screen(f.x,f.y),r=f.r*camera.zoom;if(p.x<-r||p.y<-r||p.x>width+r||p.y>height+r)continue;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.4,r),0,Math.PI*2);ctx.fill()}}
    function drawVirus(v){const p=screen(v.x,v.y),r=v.r*camera.zoom;if(p.x<-r||p.y<-r||p.x>width+r||p.y>height+r)return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#35b754';ctx.strokeStyle='#208b39';ctx.lineWidth=Math.max(1.4,camera.zoom*2);ctx.beginPath();for(let i=0;i<56;i++){const a=i/56*Math.PI*2,rr=r*(i%2===0?1.13:.91),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff22';ctx.beginPath();ctx.arc(-r*.2,-r*.2,r*.45,0,Math.PI*2);ctx.fill();ctx.restore()}
    function drawEjected(){for(const e of ejected){const p=screen(e.x,e.y),r=e.r*camera.zoom;ctx.fillStyle='#ef9da8';ctx.strokeStyle='#b64a5a55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,r),0,Math.PI*2);ctx.fill();ctx.stroke()}}
    function drawCell(c){if(!c.alive)return;const o=ownerById(c.ownerId);if(!o)return;const p=screen(c.x,c.y),r=c.r*camera.zoom;if(p.x<-r-20||p.y<-r-20||p.x>width+r+20||p.y>height+r+20)return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=o.color;ctx.strokeStyle=shade(o.color,-22);ctx.lineWidth=clamp(r*.055,1.4,8);ctx.beginPath();ctx.arc(0,0,Math.max(2,r),0,Math.PI*2);ctx.fill();ctx.stroke();const sh=ctx.createRadialGradient(-r*.28,-r*.32,r*.05,0,0,r);sh.addColorStop(0,'#ffffff38');sh.addColorStop(.6,'#ffffff08');sh.addColorStop(1,'#0000000b');ctx.fillStyle=sh;ctx.beginPath();ctx.arc(0,0,Math.max(1,r-ctx.lineWidth),0,Math.PI*2);ctx.fill();if(r>13){const fs=clamp(r*.33,9,34);ctx.fillStyle='white';ctx.strokeStyle='#0008';ctx.lineWidth=clamp(fs*.10,1.4,4);ctx.font=`700 ${fs}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';const yy=r>34?-fs*.16:0;ctx.strokeText(o.name,0,yy);ctx.fillText(o.name,0,yy);if(r>34){const mf=Math.max(8,fs*.55);ctx.font=`700 ${mf}px Arial`;ctx.strokeText(Math.round(c.mass),0,fs*.58);ctx.fillText(Math.round(c.mass),0,fs*.58)}}ctx.restore()}
    function drawMini(){const r=mini.getBoundingClientRect(),mw=r.width,mh=r.height,md=Math.min(2,devicePixelRatio||1),pw=Math.max(1,Math.round(mw*md)),ph=Math.max(1,Math.round(mh*md));if(mini.width!==pw||mini.height!==ph){mini.width=pw;mini.height=ph;mctx.setTransform(md,0,0,md,0,0)}mctx.fillStyle='#f5f5f5';mctx.fillRect(0,0,mw,mh);mctx.strokeStyle='#bbb';mctx.strokeRect(.5,.5,mw-1,mh-1);const sx=mw/CONFIG.worldSize,sy=mh/CONFIG.worldSize;for(const o of bots)if(o.alive){const c=center(o);mctx.fillStyle='#7776';mctx.beginPath();mctx.arc(c.x*sx,c.y*sy,1.5,0,Math.PI*2);mctx.fill()}if(player?.alive){const c=center(player);mctx.fillStyle=playerColor;mctx.beginPath();mctx.arc(c.x*sx,c.y*sy,4,0,Math.PI*2);mctx.fill();mctx.strokeStyle='#333';mctx.stroke()}}
    function draw(){drawGrid();drawFood();viruses.forEach(drawVirus);drawEjected();entities.filter(c=>c.alive).slice().sort((a,b)=>a.mass-b.mass).forEach(drawCell);if(running)drawMini()}

    function finish(){if(ended)return;ended=true;running=false;const score=Math.max(0,Math.round(bestMass*100+eatenCells*600+eatenFood*3));services?.highscores?.saveHighscore?.('cell-arena',score);$('.em').textContent=Math.round(bestMass);$('.ec').textContent=eatenCells;$('.ef').textContent=eatenFood;$('.et').textContent=fmt(matchTime);end.classList.remove('hide');tone(155,.10,.016)}
    function reset(){nextId=1;entities=[];food=[];viruses=[];ejected=[];bots=[];player=null;matchTime=0;bestMass=0;eatenCells=0;eatenFood=0;camera={x:CONFIG.worldSize/2,y:CONFIG.worldSize/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};player=owner(playerName,playerColor,true);spawnOwner(player);for(let i=0;i<CONFIG.botCount;i++){const o=owner(BOT_NAMES[i%BOT_NAMES.length],PLAYER_COLORS[(i+2)%PLAYER_COLORS.length]);bots.push(o);spawnOwner(o,Math.random()<.14?rand(45,82):rand(26,40))}maintain();recalcAll();updateCamera();running=true;ended=false;leaderboard();massEl.textContent=Math.round(player.totalMass)}
    function start(){ensureAudio();playerName=nameInput.value.trim().slice(0,16)||'Player';menu.classList.add('hide');end.classList.add('hide');reset()}
    function update(dt){if(!running)return;matchTime+=dt;updatePlayer(dt);bots.forEach(o=>updateBot(o,dt));updateEjected(dt);for(const c of entities)if(c.alive)eatSmall(c);eatCells();virusHit();entities=entities.filter(c=>c.alive);recalcAll();maintain();updateCamera();bestMass=Math.max(bestMass,player?.totalMass||0);massEl.textContent=Math.round(player?.totalMass||0);leaderboard();if(!player?.alive||!player.cells.length)finish()}
    function loop(t){if(destroyed)return;const dt=Math.min(.033,Math.max(0,(t-last)/1000));last=t;update(dt);draw();raf=requestAnimationFrame(loop)}
    function resize(){const r=root.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
    function mouseMove(e){const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top}
    function keyDown(e){if(!running){if(e.code==='Enter'&&!menu.classList.contains('hide'))start();return}if(e.code==='Space'&&!e.repeat){e.preventDefault();split(player,mouse.wx,mouse.wy,CONFIG.maxPlayerCells)}if((e.key==='w'||e.key==='W')&&!e.repeat)eject(player,mouse.wx,mouse.wy)}

    $$('.ca-color').forEach(b=>b.onclick=()=>{playerColor=b.dataset.color;$$('.ca-color').forEach(x=>x.classList.toggle('sel',x===b))});
    $('.ca-menu .ca-play').onclick=start;$('.restart').onclick=start;
    audioBtn.onclick=()=>{muted=!muted;audioBtn.textContent='Sound: '+(muted?'Aus':'An');if(!muted)tone(600,.04,.01)};
    canvas.addEventListener('mousemove',mouseMove);window.addEventListener('keydown',keyDown);
    ro=new ResizeObserver(resize);ro.observe(root);resize();mouse.x=width/2;mouse.y=height/2;raf=requestAnimationFrame(loop);

    return{destroy:()=>{destroyed=true;running=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',keyDown);canvas.removeEventListener('mousemove',mouseMove);try{audio?.close()}catch{}style.remove()}};
  }
};

export { CONFIG, PLAYER_COLORS, FOOD_COLORS, BOT_NAMES };
