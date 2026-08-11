const DIFFICULTY={
  easy:{label:'Easy',aim:.20,reaction:.55,speed:.92},
  normal:{label:'Normal',aim:.11,reaction:.34,speed:1},
  hard:{label:'Hard',aim:.055,reaction:.20,speed:1.08}
};
const PRESETS={
  quick:{label:'Quick',bots:11,size:2100,loot:115},
  standard:{label:'Standard',bots:19,size:2800,loot:175}
};
const WEAPONS={
  pistol:{name:'9mm Pistol',ammo:'9mm',damage:24,rate:3.2,speed:760,spread:.045,mag:12,reload:1.25,range:650,color:'#7bdcff'},
  smg:{name:'SMG',ammo:'9mm',damage:15,rate:10,speed:720,spread:.075,mag:28,reload:1.5,range:540,color:'#66e3ad'},
  shotgun:{name:'Shotgun',ammo:'12g',damage:13,rate:1.0,speed:650,spread:.17,mag:5,reload:1.8,range:380,color:'#ffb861',pellets:7},
  rifle:{name:'Rifle',ammo:'556',damage:29,rate:6,speed:900,spread:.04,mag:30,reload:1.75,range:820,color:'#ff829d'},
  dmr:{name:'DMR',ammo:'762',damage:48,rate:2.1,speed:1020,spread:.02,mag:10,reload:1.95,range:1000,color:'#b884ff'}
};
const CFG={move:205,playerR:19,botR:18,maxHp:100,maxArmor:100,pickup:62,medHeal:55,medTime:2.8,
zone:[
 {wait:30,shrink:24,r:.72,dmg:3},{wait:25,shrink:21,r:.50,dmg:5},
 {wait:20,shrink:18,r:.33,dmg:8},{wait:16,shrink:15,r:.20,dmg:12},
 {wait:12,shrink:12,r:.10,dmg:18},{wait:8,shrink:10,r:.045,dmg:28}
]};

export default{
  manifest:{
    id:'survival-royale',
    name:'Survival Royale',
    description:'Top-down Battle Royale gegen KI: looten, schießen, Deckung nutzen und der Zone entkommen.',
    icon:'🎯',
    tags:['Battle Royale','Shooter','AI','Survival']
  },
  init:(container,services)=>{
    let dead=false,raf=0,last=performance.now(),running=false,ended=false;
    let presetKey='standard',diffKey='normal',preset=PRESETS[presetKey],diff=DIFFICULTY[diffKey];
    let W=1,H=1,dpr=1,worldSize=preset.size,time=0,kills=0,damageDone=0,placement=0;
    let cam={x:0,y:0},mouse={x:0,y:0,wx:0,wy:0,down:false},keys={w:false,a:false,s:false,d:false,shift:false};
    let player=null,bots=[],bullets=[],loot=[],objects=[],houses=[],fx=[],feed=[],zone=null,nextId=1;
    let muted=false,audio=null;

    const style=document.createElement('style');
    style.textContent=`
    .br{position:relative;width:100%;height:100%;overflow:hidden;background:#6f9d43;color:#f4f7fa;font-family:inherit;user-select:none}
    .br *{box-sizing:border-box}.br canvas{width:100%;height:100%;display:block;cursor:crosshair}
    .br-top{position:absolute;z-index:8;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;pointer-events:none}
    .br-row{display:flex;gap:6px}.br-chip{min-width:84px;padding:7px 9px;border:1px solid #ffffff18;border-radius:8px;background:#111a24d9;backdrop-filter:blur(8px)}
    .br-l{font-size:.52rem;color:#8393a3;font-weight:900;text-transform:uppercase}.br-v{font-size:.88rem;font-weight:950;margin-top:1px}
    .br-help{position:absolute;z-index:8;top:13px;left:50%;transform:translateX(-50%);padding:6px 10px;border-radius:99px;background:#111a24b9;border:1px solid #ffffff12;color:#8998a7;font-size:.57rem;font-weight:800;pointer-events:none;white-space:nowrap}
    .br-map{position:absolute;z-index:8;left:12px;bottom:12px;width:165px;height:165px;border:2px solid #111;background:#6f9d43;pointer-events:none}.br-map canvas{cursor:default}
    .br-bottom{position:absolute;z-index:9;left:50%;bottom:12px;transform:translateX(-50%);width:min(500px,calc(100% - 380px));pointer-events:none}
    .br-bars{display:grid;gap:4px;margin-bottom:7px}.br-bar{height:11px;background:#12171d;border:1px solid #0008;overflow:hidden}.br-hp{height:100%;background:#ef676b}.br-arm{height:100%;background:#59c8ee}
    .br-inv{display:grid;grid-template-columns:1fr 1fr 70px;gap:5px}.br-slot{min-height:53px;padding:6px 8px;background:#161e27e8;border:2px solid #0009;border-radius:5px}.br-slot.on{border-color:#38d9ff}
    .br-key{font-size:.49rem;color:#738394;font-weight:900}.br-name{font-size:.71rem;font-weight:950;margin-top:1px}.br-ammo{font-size:.60rem;color:#99a8b6;margin-top:2px}.br-med{text-align:center;font-weight:950;color:#66dc7d;margin-top:5px}
    .br-pick{position:absolute;z-index:10;left:50%;bottom:84px;transform:translateX(-50%);opacity:0;padding:7px 10px;border-radius:6px;background:#111923e8;border:1px solid #ffffff18;font-size:.65rem;font-weight:850;pointer-events:none}.br-pick.show{opacity:1}
    .br-use{position:absolute;z-index:10;left:50%;top:70px;transform:translateX(-50%);width:270px;opacity:0}.br-use.show{opacity:1}.br-use-t{font-size:.62rem;text-align:center;font-weight:900}.br-use-b{height:7px;background:#0008;margin-top:4px}.br-use-f{height:100%;background:#65dc7d}
    .br-feed{position:absolute;z-index:8;right:12px;top:72px;width:250px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none}.br-feed div{max-width:100%;padding:4px 7px;background:#121922bd;border-radius:4px;font-size:.58rem;color:#cbd4dd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .br-sound{position:absolute;z-index:12;right:12px;bottom:12px;padding:7px 9px;border-radius:7px;border:1px solid #ffffff15;background:#111922dc;color:#a9b7c4;font:inherit;font-size:.61rem;font-weight:850;cursor:pointer}
    .br-ov{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:#06090dc7;backdrop-filter:blur(7px)}.br-ov.hide{display:none}
    .br-card{width:min(930px,100%);padding:30px;border-radius:18px;background:linear-gradient(#202c39,#111922);border:1px solid #ffffff17;box-shadow:0 30px 90px #0007}.br-k{font-size:.69rem;color:#38d9ff;font-weight:950;letter-spacing:.15em;text-transform:uppercase}
    .br-title{font-size:clamp(2.7rem,5vw,4.3rem);font-weight:950;line-height:1;margin:6px 0 8px;letter-spacing:-.045em}.br-desc{color:#91a1b1;line-height:1.5;max-width:780px}
    .br-how{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.br-how>div{padding:11px;border:1px solid #ffffff10;border-radius:10px;background:#ffffff06}.br-how b{display:block;font-size:.76rem;margin-bottom:3px}.br-how span{font-size:.64rem;color:#7d8d9d;line-height:1.35}
    .br-sec{margin:13px 0 7px;font-size:.67rem;font-weight:900;color:#cbd5df;text-transform:uppercase;letter-spacing:.08em}.br-opts{display:grid;gap:8px}.br-opts.p{grid-template-columns:1fr 1fr}.br-opts.d{grid-template-columns:repeat(3,1fr)}
    .br-opt{padding:12px;border-radius:9px;border:1px solid #ffffff13;background:#ffffff06;color:#eef3f7;font:inherit;text-align:left;cursor:pointer}.br-opt.sel{border-color:#38d9ff99;background:#38d9ff12}.br-opt b{display:block;font-size:.82rem}.br-opt span{display:block;margin-top:2px;font-size:.64rem;color:#7d8e9f}
    .br-start{width:100%;margin-top:19px;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#38d9ff,#4b84ff);color:#061116;font:inherit;font-weight:950;cursor:pointer}
    .br-end-title{font-size:2.3rem;font-weight:950;margin-bottom:6px}.br-end-sub{color:#91a1b1;margin-bottom:16px}.br-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.br-stat{padding:11px;text-align:center;background:#ffffff06;border:1px solid #ffffff10}.br-stat span{font-size:.56rem;color:#7b8c9e;text-transform:uppercase}.br-stat b{display:block;margin-top:3px}
    @media(max-width:800px){.br-help{display:none}.br-bottom{width:min(470px,calc(100% - 24px));bottom:8px}.br-map{width:120px;height:120px;bottom:86px;left:7px}.br-sound{bottom:86px;right:7px}.br-how{grid-template-columns:1fr 1fr}.br-opts.d{grid-template-columns:1fr}.br-stats{grid-template-columns:1fr 1fr}}
    `;
    const root=document.createElement('div');root.className='br';
    root.innerHTML=`
      <canvas class="br-main"></canvas>
      <div class="br-top"><div class="br-row"><div class="br-chip"><div class="br-l">Alive</div><div class="br-v alive">20</div></div><div class="br-chip"><div class="br-l">Kills</div><div class="br-v kills">0</div></div></div><div class="br-row"><div class="br-chip"><div class="br-l">Zone</div><div class="br-v ztxt">Waiting</div></div></div></div>
      <div class="br-help">WASD Move · Mouse Aim · LMB Shoot · E Loot · R Reload · 1/2 Weapon · Q Medkit · Shift Sprint</div>
      <div class="br-feed"></div>
      <div class="br-map"><canvas></canvas></div>
      <div class="br-bottom"><div class="br-bars"><div class="br-bar"><div class="br-hp"></div></div><div class="br-bar"><div class="br-arm"></div></div></div><div class="br-inv">
        <div class="br-slot s0 on"><div class="br-key">1 · PRIMARY</div><div class="br-name">Pistol</div><div class="br-ammo">12 / 36</div></div>
        <div class="br-slot s1"><div class="br-key">2 · SECONDARY</div><div class="br-name">Empty</div><div class="br-ammo">—</div></div>
        <div class="br-slot"><div class="br-key">Q · MEDKIT</div><div class="br-med">×1</div></div>
      </div></div>
      <div class="br-pick"></div><div class="br-use"><div class="br-use-t">Using Medkit...</div><div class="br-use-b"><div class="br-use-f"></div></div></div>
      <button class="br-sound" type="button">Sound: An</button>
      <div class="br-ov menu"><div class="br-card">
        <div class="br-k">Top-Down Battle Royale / Singleplayer</div><div class="br-title">Survival Royale</div>
        <div class="br-desc">Inspiriert von klassischen Browser-Battle-Royales: zufällige Top-Down-Map, Loot, Waffen, KI-Gefechte, Deckung und eine Safe Zone, die das Match immer weiter zusammenzieht.</div>
        <div class="br-how"><div><b>WASD + Maus</b><span>Bewegen, zielen und mit linker Maustaste schießen.</span></div><div><b>Looten</b><span>E hebt Waffen, Ammo, Armor und Medkits in deiner Nähe auf.</span></div><div><b>Deckung</b><span>Bäume, Steine und Hauswände stoppen Kugeln.</span></div><div><b>Zone</b><span>Außerhalb des Kreises bekommst du immer stärkeren Schaden.</span></div></div>
        <div class="br-sec">Match</div><div class="br-opts p">${Object.entries(PRESETS).map(([k,v])=>`<button class="br-opt ${k===presetKey?'sel':''}" data-p="${k}" type="button"><b>${v.label}</b><span>${v.bots+1} Teilnehmer · ${v.size}px Map</span></button>`).join('')}</div>
        <div class="br-sec">Bot Difficulty</div><div class="br-opts d">${Object.entries(DIFFICULTY).map(([k,v])=>`<button class="br-opt ${k===diffKey?'sel':''}" data-d="${k}" type="button"><b>${v.label}</b><span>${k==='easy'?'Ungenauer und langsamer':k==='hard'?'Schnelle, präzise Gegner':'Ausgewogene Gegner'}</span></button>`).join('')}</div>
        <button class="br-start" type="button">Battle Royale starten</button>
      </div></div>
      <div class="br-ov end hide"><div class="br-card"><div class="br-end-title"></div><div class="br-end-sub"></div><div class="br-stats">
        <div class="br-stat"><span>Placement</span><b class="ep">#1</b></div><div class="br-stat"><span>Kills</span><b class="ek">0</b></div><div class="br-stat"><span>Damage</span><b class="ed">0</b></div><div class="br-stat"><span>Time</span><b class="et">0:00</b></div><div class="br-stat"><span>Score</span><b class="es">0</b></div>
      </div><button class="br-start restart" type="button">Nochmal</button></div></div>`;
    container.append(style,root);

    const canvas=root.querySelector('.br-main'),ctx=canvas.getContext('2d');
    const mini=root.querySelector('.br-map canvas'),mctx=mini.getContext('2d');
    const $=s=>root.querySelector(s), $$=s=>[...root.querySelectorAll(s)];
    const aliveEl=$('.alive'),killsEl=$('.kills'),zoneEl=$('.ztxt'),hpEl=$('.br-hp'),armEl=$('.br-arm'),pickEl=$('.br-pick'),feedEl=$('.br-feed'),useEl=$('.br-use'),useFill=$('.br-use-f');
    const slots=[$('.s0'),$('.s1')],medEl=$('.br-med'),menu=$('.menu'),end=$('.end');
    const rand=(a,b)=>a+Math.random()*(b-a), rint=(a,b)=>Math.floor(rand(a,b+1)), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const names=['Lucky','Nova','Crow','Echo','Moss','Viper','Rex','Pixel','Ghost','Bolt','Mango','Frost','Mako','Wolf','Jinx','Ace','Luna','Drift','Quill','Zero'];let nameI=0;
    const makeGun=id=>({id,mag:WEAPONS[id].mag,reload:0,cool:0});
    const makeChar=(x,y,isP=false)=>({id:nextId++,x,y,r:isP?CFG.playerR:CFG.botR,isP,name:isP?'YOU':names[nameI++%names.length],hp:100,armor:0,alive:true,angle:0,color:isP?'#efc178':`hsl(${rint(0,359)} 55% 67%)`,guns:[makeGun('pistol'),null],slot:0,ammo:{'9mm':36,'12g':0,'556':0,'762':0},med:1,using:false,useT:0,ai:isP?null:{think:rand(.1,.5),target:null,move:null,strafe:Math.random()<.5?-1:1}});
    const weapon=e=>e.guns[e.slot], fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t)%60).padStart(2,'0')}`;
    const ensureAudio=()=>{if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}};
    const tone=(f,d=.035,v=.015,type='square')=>{const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)};

    function resize(){const r=root.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);canvas.style.width=W+'px';canvas.style.height=H+'px';}
    function rectHit(x,y,r,o){const nx=clamp(x,o.x,o.x+o.w),ny=clamp(y,o.y,o.y+o.h);return Math.hypot(x-nx,y-ny)<r}
    function blocked(e,x,y){for(const o of objects)if(o.solid&&Math.hypot(x-o.x,y-o.y)<e.r+o.r)return true;for(const h of houses)for(const w of h.walls)if(rectHit(x,y,e.r,w))return true;return false}
    function move(e,dx,dy){let nx=clamp(e.x+dx,e.r,worldSize-e.r);if(!blocked(e,nx,e.y))e.x=nx;let ny=clamp(e.y+dy,e.r,worldSize-e.r);if(!blocked(e,e.x,ny))e.y=ny}
    function openPoint(){for(let n=0;n<120;n++){const p={x:rand(70,worldSize-70),y:rand(70,worldSize-70)};if(!objects.some(o=>o.solid&&dist(p,o)<o.r+35)&&!houses.some(h=>p.x>h.x-30&&p.x<h.x+h.w+30&&p.y>h.y-30&&p.y<h.y+h.h+30))return p}return{x:rand(70,worldSize-70),y:rand(70,worldSize-70)}}
    function makeHouse(x,y,w,h){const t=13,d=50,walls=[{x,y,w,h:t},{x,y:y+h-t,w,h:t},{x,y,w:t,h},{x:x+w-t,y,w:t,h}];const side=rint(0,3);if(side===0){walls.splice(0,1,{x,y,w:w/2-d/2,h:t},{x:x+w/2+d/2,y,w:w/2-d/2,h:t})}if(side===2){walls.splice(1,1,{x,y:y+h-t,w:w/2-d/2,h:t},{x:x+w/2+d/2,y:y+h-t,w:w/2-d/2,h:t})}return{x,y,w,h,walls,warehouse:Math.random()<.28}}
    function addLoot(type,x,y,data={}){loot.push({id:nextId++,type,x,y,on:true,...data})}
    function generate(){
      objects=[];houses=[];loot=[];
      const hc=presetKey==='quick'?7:12;
      for(let n=0;n<hc;n++){for(let t=0;t<80;t++){const w=rand(145,235),h=rand(125,205),x=rand(90,worldSize-w-90),y=rand(90,worldSize-h-90);if(!houses.some(q=>!(x+w+75<q.x||x>q.x+q.w+75||y+h+75<q.y||y>q.y+q.h+75))){houses.push(makeHouse(x,y,w,h));break}}}
      const oc=presetKey==='quick'?75:115;
      for(let n=0;n<oc;n++){const type=Math.random()<.58?'tree':Math.random()<.72?'rock':'bush',r=type==='tree'?rand(25,37):rand(18,30),p=openPoint();objects.push({id:nextId++,type,x:p.x,y:p.y,r,solid:type!=='bush'})}
      for(let n=0;n<preset.loot;n++){let p=openPoint();if(houses.length&&Math.random()<.35){const h=houses[rint(0,houses.length-1)];p={x:rand(h.x+25,h.x+h.w-25),y:rand(h.y+25,h.y+h.h-25)}}const z=Math.random();
        if(z<.29){const ids=['pistol','smg','shotgun','rifle','dmr'],weights=[30,23,19,10,4],tot=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*tot,id='pistol';for(let i=0;i<ids.length;i++){roll-=weights[i];if(roll<=0){id=ids[i];break}}addLoot('gun',p.x,p.y,{gun:id})}
        else if(z<.60){const a=['9mm','12g','556','762'][rint(0,3)];addLoot('ammo',p.x,p.y,{ammo:a,amount:a==='12g'?rint(6,14):rint(15,36)})}
        else if(z<.75)addLoot('med',p.x,p.y,{amount:1});
        else addLoot('armor',p.x,p.y,{amount:rint(22,48)});
      }
    }
    function spawn(){const p=openPoint();player=makeChar(p.x,p.y,true);bots=[];for(let i=0;i<preset.bots;i++){let q=openPoint(),tries=0;while(dist(p,q)<340&&tries++<30)q=openPoint();const b=makeChar(q.x,q.y,false);if(Math.random()<.34){const id=Math.random()<.55?'smg':'shotgun';b.guns[1]=makeGun(id);b.slot=1;b.ammo[WEAPONS[id].ammo]+=WEAPONS[id].mag*2}if(Math.random()<.25)b.armor=rint(18,50);bots.push(b)}}
    function initZone(){zone={x:worldSize/2,y:worldSize/2,r:worldSize*.49,stage:-1,state:'wait',timer:22,tx:worldSize/2,ty:worldSize/2,tr:worldSize*.49,fx:worldSize/2,fy:worldSize/2,fr:worldSize*.49,dmg:1};nextZone()}
    function nextZone(){zone.stage++;if(zone.stage>=CFG.zone.length){zone.state='final';zone.timer=999;zone.dmg=CFG.zone.at(-1).dmg;return}const z=CFG.zone[zone.stage],nr=worldSize*z.r*.5,max=Math.max(0,zone.r-nr)*.72,a=Math.random()*Math.PI*2,o=rand(0,max);zone.tx=clamp(zone.x+Math.cos(a)*o,nr,worldSize-nr);zone.ty=clamp(zone.y+Math.sin(a)*o,nr,worldSize-nr);zone.tr=nr;zone.timer=z.wait;zone.state='wait';zone.dmg=z.dmg}
    function updateZone(dt){if(zone.state==='final')return;zone.timer-=dt;if(zone.state==='wait'&&zone.timer<=0){const z=CFG.zone[zone.stage];zone.state='shrink';zone.timer=z.shrink;zone.fx=zone.x;zone.fy=zone.y;zone.fr=zone.r}else if(zone.state==='shrink'){const z=CFG.zone[zone.stage],t=clamp(1-zone.timer/z.shrink,0,1);zone.x=zone.fx+(zone.tx-zone.fx)*t;zone.y=zone.fy+(zone.ty-zone.fy)*t;zone.r=zone.fr+(zone.tr-zone.fr)*t;if(zone.timer<=0){zone.x=zone.tx;zone.y=zone.ty;zone.r=zone.tr;nextZone()}}}
    const inside=e=>Math.hypot(e.x-zone.x,e.y-zone.y)<=zone.r;
    function fxBurst(x,y,c,n=8){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=rand(30,100),life=rand(.25,.5);fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,life,max:life})}}
    function addFeed(s){feed.unshift({s,t:5});feed=feed.slice(0,6);feedEl.innerHTML=feed.map(x=>`<div>${x.s}</div>`).join('')}
    function damage(e,d,owner=null,source='bullet'){if(!e.alive)return;if(e.armor>0&&source!=='zone'){const ab=Math.min(e.armor,d*.48);e.armor-=ab;d-=ab*.72}e.hp-=d;if(owner===player?.id)damageDone+=d;if(e.hp<=0)kill(e,owner,source)}
    function alive(){return [player,...bots].filter(x=>x&&x.alive)}
    function kill(e,owner,source){if(!e.alive)return;e.alive=false;e.hp=0;dropLoot(e);const a=[player,...bots].find(x=>x&&x.id===owner),killer=a?a.name:source==='zone'?'Zone':'Unknown';addFeed(`${killer} eliminated ${e.name}`);if(owner===player?.id&&!e.isP){kills++;fxBurst(e.x,e.y,'#ff6578',14)}if(e.isP){placement=alive().length+1;setTimeout(()=>finish(false),650)}else if(player?.alive&&alive().length===1){placement=1;setTimeout(()=>finish(true),500)}}
    function dropLoot(e){const g=weapon(e);if(g)addLoot('gun',e.x+rand(-15,15),e.y+rand(-15,15),{gun:g.id});for(const a in e.ammo)if(e.ammo[a]>8)addLoot('ammo',e.x+rand(-18,18),e.y+rand(-18,18),{ammo:a,amount:Math.min(e.ammo[a],30)});if(e.med)addLoot('med',e.x+10,e.y-10,{amount:1});if(e.armor>15)addLoot('armor',e.x-10,e.y+10,{amount:Math.min(40,Math.round(e.armor))})}
    function lineBlocked(x1,y1,x2,y2){const steps=Math.ceil(Math.hypot(x2-x1,y2-y1)/14);for(let i=1;i<=steps;i++){const t=i/steps,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;for(const o of objects)if(o.solid&&Math.hypot(x-o.x,y-o.y)<o.r)return true;for(const h of houses)for(const w of h.walls)if(x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h)return true}return false}
    function reload(e){const s=weapon(e);if(!s)return;const d=WEAPONS[s.id];if(s.reload>0||s.mag>=d.mag||e.ammo[d.ammo]<=0)return;s.reload=d.reload}
    function updateTimers(e,dt){for(const s of e.guns)if(s){s.cool=Math.max(0,s.cool-dt);if(s.reload>0){s.reload-=dt;if(s.reload<=0){s.reload=0;const d=WEAPONS[s.id],n=Math.min(d.mag-s.mag,e.ammo[d.ammo]);s.mag+=n;e.ammo[d.ammo]-=n}}}if(e.using){e.useT-=dt;if(e.useT<=0){e.using=false;e.med--;e.hp=Math.min(100,e.hp+CFG.medHeal);if(e.isP)tone(700,.06,.018,'sine')}}}
    function shoot(e,ang=e.angle){if(!e.alive||e.using)return;const s=weapon(e);if(!s)return;const d=WEAPONS[s.id];if(s.cool>0||s.reload>0)return;if(s.mag<=0){reload(e);return}s.mag--;s.cool=1/d.rate;const pellets=d.pellets||1,mx=e.x+Math.cos(ang)*(e.r+14),my=e.y+Math.sin(ang)*(e.r+14);for(let p=0;p<pellets;p++){const a=ang+rand(-d.spread,d.spread);bullets.push({id:nextId++,owner:e.id,x:mx,y:my,vx:Math.cos(a)*d.speed,vy:Math.sin(a)*d.speed,dmg:d.damage,life:d.range/d.speed,c:d.color})}fxBurst(mx,my,'#ffe18a',4);if(e.isP)tone(s.id==='shotgun'?135:s.id==='dmr'?170:220,.03,.018)}
    function nearLoot(e,r=CFG.pickup){let best=null,bd=1e9;for(const l of loot)if(l.on){const d=dist(e,l);if(d<r&&d<bd){best=l;bd=d}}return best}
    function lootName(l){if(l.type==='gun')return WEAPONS[l.gun].name;if(l.type==='ammo')return `${l.amount} ${l.ammo}`;if(l.type==='med')return'Medkit';return`Armor +${l.amount}`}
    function pick(e,l){if(!l||!l.on)return;if(l.type==='gun'){if(!e.guns[1]){e.guns[1]=makeGun(l.gun);e.slot=1}else e.guns[e.slot]=makeGun(l.gun);e.ammo[WEAPONS[l.gun].ammo]+=WEAPONS[l.gun].mag;l.on=false}else if(l.type==='ammo'){e.ammo[l.ammo]+=l.amount;l.on=false}else if(l.type==='med'){e.med=Math.min(5,e.med+l.amount);l.on=false}else{e.armor=Math.min(100,e.armor+l.amount);l.on=false}if(e.isP)tone(670,.025,.01,'triangle')}
    function useMed(e){if(e.med>0&&e.hp<100&&!e.using){e.using=true;e.useT=CFG.medTime}}
    function updatePlayer(dt){if(!player?.alive)return;updateTimers(player,dt);let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0),len=Math.hypot(dx,dy);if(len){if(player.using){player.using=false;player.useT=0}const sp=CFG.move*(keys.shift?1.22:1);move(player,dx/len*sp*dt,dy/len*sp*dt)}mouse.wx=cam.x+mouse.x;mouse.wy=cam.y+mouse.y;player.angle=Math.atan2(mouse.wy-player.y,mouse.wx-player.x);if(mouse.down)shoot(player);if(!inside(player))damage(player,zone.dmg*dt,null,'zone')}
    function nearestEnemy(b,max=620){let best=null,bd=max;for(const e of alive())if(e.id!==b.id){const d=dist(b,e);if(d<bd&&!lineBlocked(b.x,b.y,e.x,e.y)){best=e;bd=d}}return best?{e:best,d:bd}:null}
    function aiLoot(b){let best=null,bs=-1e9;for(const l of loot)if(l.on){const d=dist(b,l);if(d>430)continue;let s=-d*.15;if(l.type==='gun'){const cur=weapon(b),order={pistol:1,smg:2,shotgun:2,rifle:3,dmr:4};s+=(order[l.gun]-(cur?order[cur.id]:0))*90}else if(l.type==='armor')s+=90-b.armor;else if(l.type==='med')s+=b.med<2?65:5;else s+=20;if(s>bs){best=l;bs=s}}return bs>5?best:null}
    function moveToward(b,x,y,dt,m=1){const dx=x-b.x,dy=y-b.y,l=Math.max(1,Math.hypot(dx,dy)),sp=CFG.move*diff.speed*m;const ox=b.x,oy=b.y;move(b,dx/l*sp*dt,dy/l*sp*dt);if(Math.hypot(b.x-ox,b.y-oy)<.2)move(b,-dy/l*sp*dt*b.ai.strafe,dx/l*sp*dt*b.ai.strafe)}
    function updateBot(b,dt){if(!b.alive)return;updateTimers(b,dt);if(!inside(b))damage(b,zone.dmg*dt,null,'zone');if(!b.alive)return;if(b.using)return;const zd=Math.hypot(b.x-zone.x,b.y-zone.y);if(zd>zone.r-30){moveToward(b,zone.x,zone.y,dt,1.08);b.angle=Math.atan2(zone.y-b.y,zone.x-b.x);return}
      const en=nearestEnemy(b,620);if(en){const s=weapon(b),def=WEAPONS[s.id],ideal=s.id==='shotgun'?145:s.id==='smg'?220:s.id==='pistol'?290:s.id==='rifle'?400:500,dx=en.e.x-b.x,dy=en.e.y-b.y,l=Math.max(1,en.d),nx=dx/l,ny=dy/l;let mx=-ny*b.ai.strafe*.7,my=nx*b.ai.strafe*.7;if(en.d>ideal*1.1){mx+=nx;my+=ny}else if(en.d<ideal*.62){mx-=nx;my-=ny}const ml=Math.max(1,Math.hypot(mx,my)),sp=CFG.move*diff.speed*.9;move(b,mx/ml*sp*dt,my/ml*sp*dt);b.angle=Math.atan2(dy,dx)+rand(-diff.aim,diff.aim)*clamp(en.d/450,.6,1.2);if(en.d<def.range*.86)shoot(b,b.angle);if(s.mag<=0)reload(b);return}
      b.ai.think-=dt;if(b.ai.think<=0){b.ai.think=diff.reaction+rand(.08,.28);b.ai.target=aiLoot(b);if(!b.ai.target){const a=Math.random()*Math.PI*2,r=rand(0,zone.r*.65);b.ai.move={x:clamp(zone.x+Math.cos(a)*r,50,worldSize-50),y:clamp(zone.y+Math.sin(a)*r,50,worldSize-50)}}}
      if(b.hp<45&&b.med&&Math.random()<.005){useMed(b);return}
      if(b.ai.target&&b.ai.target.on){if(dist(b,b.ai.target)<CFG.pickup)pick(b,b.ai.target);else moveToward(b,b.ai.target.x,b.ai.target.y,dt,.92)}else if(b.ai.move)moveToward(b,b.ai.move.x,b.ai.move.y,dt,.86)
    }
    function updateBullets(dt){const deadSet=new Set();for(const bl of bullets){bl.life-=dt;if(bl.life<=0){deadSet.add(bl.id);continue}const steps=Math.max(1,Math.ceil(Math.hypot(bl.vx,bl.vy)*dt/10)),sd=dt/steps;for(let k=0;k<steps;k++){bl.x+=bl.vx*sd;bl.y+=bl.vy*sd;let block=bl.x<0||bl.y<0||bl.x>worldSize||bl.y>worldSize;for(const o of objects)if(o.solid&&Math.hypot(bl.x-o.x,bl.y-o.y)<o.r){block=true;break}if(!block)for(const h of houses)for(const w of h.walls)if(bl.x>=w.x&&bl.x<=w.x+w.w&&bl.y>=w.y&&bl.y<=w.y+w.h){block=true;break}if(block){deadSet.add(bl.id);break}for(const e of alive())if(e.id!==bl.owner&&Math.hypot(bl.x-e.x,bl.y-e.y)<e.r+2){damage(e,bl.dmg,bl.owner);fxBurst(bl.x,bl.y,'#ff7788',6);deadSet.add(bl.id);block=true;break}if(block)break}}if(deadSet.size)bullets=bullets.filter(b=>!deadSet.has(b.id))}
    function updateFx(dt){for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)fx.splice(i,1)}for(const f of feed)f.t-=dt;const n=feed.length;feed=feed.filter(f=>f.t>0);if(n!==feed.length)feedEl.innerHTML=feed.map(x=>`<div>${x.s}</div>`).join('')}
    function updateCam(){if(!player)return;cam.x=clamp(player.x-W/2,0,Math.max(0,worldSize-W));cam.y=clamp(player.y-H/2,0,Math.max(0,worldSize-H))}
    function updateHud(){if(!player)return;aliveEl.textContent=alive().length;killsEl.textContent=kills;zoneEl.textContent=zone.state==='wait'?`Move ${Math.ceil(zone.timer)}s`:zone.state==='shrink'?`Closing ${Math.ceil(zone.timer)}s`:'Final';hpEl.style.width=clamp(player.hp,0,100)+'%';armEl.style.width=clamp(player.armor,0,100)+'%';medEl.textContent='×'+player.med;slots.forEach((el,i)=>{el.classList.toggle('on',player.slot===i);const s=player.guns[i],n=el.querySelector('.br-name'),a=el.querySelector('.br-ammo');if(!s){n.textContent='Empty';a.textContent='—'}else{const d=WEAPONS[s.id];n.textContent=d.name;a.textContent=s.reload>0?'RELOADING...':`${s.mag} / ${player.ammo[d.ammo]}`}});const l=nearLoot(player);pickEl.classList.toggle('show',!!l);if(l)pickEl.textContent='E · '+lootName(l);useEl.classList.toggle('show',player.using);if(player.using)useFill.style.width=clamp(1-player.useT/CFG.medTime,0,1)*100+'%'}
    const scr=(x,y)=>({x:x-cam.x,y:y-cam.y});
    function draw(){
      ctx.fillStyle='#70a043';ctx.fillRect(0,0,W,H);const gs=150,ox=-(cam.x%gs),oy=-(cam.y%gs);ctx.strokeStyle='#315e272d';ctx.lineWidth=1;ctx.beginPath();for(let x=ox;x<W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let y=oy;y<H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
      if(zone){const z=scr(zone.x,zone.y);ctx.fillStyle='#c62f1b35';ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(z.x,z.y,zone.r,0,Math.PI*2,true);ctx.fill('evenodd');ctx.strokeStyle=zone.state==='shrink'?'#ff604d':'#ffffffaa';ctx.lineWidth=3;ctx.beginPath();ctx.arc(z.x,z.y,zone.r,0,Math.PI*2);ctx.stroke();if(zone.state==='wait'&&zone.stage>=0){const q=scr(zone.tx,zone.ty);ctx.setLineDash([7,7]);ctx.strokeStyle='#ffffff66';ctx.beginPath();ctx.arc(q.x,q.y,zone.tr,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}
      for(const h of houses){const p=scr(h.x,h.y);if(p.x>W||p.y>H||p.x+h.w<0||p.y+h.h<0)continue;ctx.fillStyle=h.warehouse?'#314455':'#b56b3c';ctx.fillRect(p.x,p.y,h.w,h.h);ctx.fillStyle='#4b2420';for(const w of h.walls)ctx.fillRect(w.x-cam.x,w.y-cam.y,w.w,w.h)}
      for(const l of loot)if(l.on){const p=scr(l.x,l.y);if(p.x<-20||p.y<-20||p.x>W+20||p.y>H+20)continue;const c=l.type==='gun'?WEAPONS[l.gun].color:l.type==='ammo'?'#ffd86c':l.type==='med'?'#6bdd7e':'#5cc8ef';ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=c;ctx.shadowBlur=7;ctx.shadowColor=c;if(l.type==='gun'){ctx.rotate(-.4);ctx.fillRect(-13,-3,26,6);ctx.fillRect(-3,2,5,7)}else if(l.type==='med'){ctx.fillStyle='#f5f7f8';ctx.fillRect(-8,-8,16,16);ctx.fillStyle=c;ctx.fillRect(-2,-6,4,12);ctx.fillRect(-6,-2,12,4)}else{ctx.fillRect(-7,-7,14,14)}ctx.restore()}
      for(const o of objects){const p=scr(o.x,o.y);if(p.x<-o.r*2||p.y<-o.r*2||p.x>W+o.r*2||p.y>H+o.r*2)continue;ctx.save();ctx.translate(p.x,p.y);if(o.type==='tree'){ctx.fillStyle='#49331f';ctx.beginPath();ctx.arc(0,0,o.r*.42,0,Math.PI*2);ctx.fill();ctx.fillStyle='#315827';for(let i=0;i<9;i++){const a=i/9*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*o.r*.48,Math.sin(a)*o.r*.48,o.r*.44,0,Math.PI*2);ctx.fill()}}else if(o.type==='rock'){ctx.fillStyle='#babdc0';ctx.strokeStyle='#44484b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,o.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff44';ctx.beginPath();ctx.arc(-o.r*.25,-o.r*.28,o.r*.28,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle='#365d29';for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*o.r*.32,Math.sin(a)*o.r*.32,o.r*.45,0,Math.PI*2);ctx.fill()}}ctx.restore()}
      for(const bl of bullets){const p=scr(bl.x,bl.y);ctx.fillStyle=bl.c;ctx.shadowBlur=6;ctx.shadowColor=bl.c;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
      const drawChar=e=>{if(!e.alive)return;const p=scr(e.x,e.y);if(p.x<-50||p.y<-50||p.x>W+50||p.y>H+50)return;ctx.save();ctx.translate(p.x,p.y);if(e.armor>0){ctx.strokeStyle='#69cdecaa';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r+4,0,Math.PI*2);ctx.stroke()}ctx.fillStyle=e.color;ctx.strokeStyle='#36424a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(e.angle);ctx.strokeStyle='#171c20';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.r*.3,0);ctx.lineTo(e.r+22,0);ctx.stroke();const g=weapon(e);if(g){ctx.fillStyle=WEAPONS[g.id].color;ctx.beginPath();ctx.arc(e.r+3,0,5,0,Math.PI*2);ctx.fill()}ctx.rotate(-e.angle);ctx.fillStyle=e.isP?'#28dfff':'#e5edf4';ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillText(e.name,0,e.r+14);if(!e.isP){ctx.fillStyle='#0008';ctx.fillRect(-18,-e.r-12,36,4);ctx.fillStyle='#ef6469';ctx.fillRect(-18,-e.r-12,36*clamp(e.hp/100,0,1),4)}ctx.restore()};bots.forEach(drawChar);if(player)drawChar(player);
      for(const p of fx){const s=scr(p.x,p.y);ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(s.x,s.y,2.5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
      if(player?.alive&&!inside(player)){ctx.fillStyle='#bf321424';ctx.fillRect(0,0,W,H)}
      drawMini();
    }
    function drawMini(){
      const r=mini.getBoundingClientRect(),mw=r.width,mh=r.height,md=Math.min(2,devicePixelRatio||1);
      if(mini.width!==Math.round(mw*md)){
        mini.width=Math.round(mw*md);
        mini.height=Math.round(mh*md);
        mctx.setTransform(md,0,0,md,0,0);
      }

      mctx.fillStyle='#70a043';
      mctx.fillRect(0,0,mw,mh);

      // Vor Matchstart existieren Zone und Player noch nicht.
      // Die Minimap darf trotzdem gerendert werden, ohne auf null.x zuzugreifen.
      if(!zone || !player) return;

      const sx=mw/worldSize,sy=mh/worldSize;

      mctx.fillStyle='#7e5133';
      for(const h of houses){
        mctx.fillRect(h.x*sx,h.y*sy,h.w*sx,h.h*sy);
      }

      mctx.strokeStyle='#fff';
      mctx.lineWidth=1.2;
      mctx.beginPath();
      mctx.arc(zone.x*sx,zone.y*sy,zone.r*sx,0,Math.PI*2);
      mctx.stroke();

      if(player.alive){
        mctx.fillStyle='#24dcff';
        mctx.beginPath();
        mctx.arc(player.x*sx,player.y*sy,3,0,Math.PI*2);
        mctx.fill();
      }

      for(const b of bots){
        if(b.alive && dist(player,b)<210){
          mctx.fillStyle='#f25d70';
          mctx.beginPath();
          mctx.arc(b.x*sx,b.y*sy,2,0,Math.PI*2);
          mctx.fill();
        }
      }
    }
    function update(dt){if(!running||ended)return;time+=dt;updateZone(dt);updatePlayer(dt);bots.forEach(b=>updateBot(b,dt));updateBullets(dt);updateFx(dt);updateCam();updateHud();if(player?.alive&&alive().length===1){placement=1;finish(true)}}
    function scoreFinal(win){return Math.max(0,Math.round(kills*800+damageDone*2+(preset.bots+2-placement)*120+(win?3000:0)))}
    function finish(win){if(ended)return;ended=true;running=false;mouse.down=false;if(!placement)placement=win?1:alive().length+1;const s=scoreFinal(win);services?.highscores?.saveHighscore?.(`survival-royale-${presetKey}`,s);$('.br-end-title').textContent=win?'WINNER WINNER!':`PLACED #${placement}`;$('.br-end-title').style.color=win?'#70e385':'#ff667d';$('.br-end-sub').textContent=`${PRESETS[presetKey].label} · ${DIFFICULTY[diffKey].label}`;$('.ep').textContent='#'+placement;$('.ek').textContent=kills;$('.ed').textContent=Math.round(damageDone);$('.et').textContent=fmt(time);$('.es').textContent=s.toLocaleString('de-DE');end.classList.remove('hide')}
    function start(){preset=PRESETS[presetKey];diff=DIFFICULTY[diffKey];worldSize=preset.size;time=0;kills=0;damageDone=0;placement=0;nextId=1;bullets=[];fx=[];feed=[];generate();spawn();initZone();running=true;ended=false;menu.classList.add('hide');end.classList.add('hide');updateCam();updateHud();addFeed(`${preset.bots+1} players entered the match`)}
    function loop(t){if(dead)return;const dt=Math.min(.033,Math.max(0,(t-last)/1000));last=t;update(dt);draw();raf=requestAnimationFrame(loop)}

    $$('.br-opt[data-p]').forEach(b=>b.onclick=()=>{presetKey=b.dataset.p;$$('.br-opt[data-p]').forEach(x=>x.classList.toggle('sel',x===b))});
    $$('.br-opt[data-d]').forEach(b=>b.onclick=()=>{diffKey=b.dataset.d;$$('.br-opt[data-d]').forEach(x=>x.classList.toggle('sel',x===b))});
    $('.br-start').onclick=start;$('.restart').onclick=start;
    $('.br-sound').onclick=e=>{muted=!muted;e.currentTarget.textContent='Sound: '+(muted?'Aus':'An');if(!muted)tone(620,.04,.016,'sine')};
    window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='w')keys.w=true;if(k==='a')keys.a=true;if(k==='s')keys.s=true;if(k==='d')keys.d=true;if(k==='shift')keys.shift=true;if(!running||!player?.alive)return;if(k==='e'){const l=nearLoot(player);if(l)pick(player,l)}if(k==='r')reload(player);if(k==='1'&&player.guns[0])player.slot=0;if(k==='2'&&player.guns[1])player.slot=1;if(k==='q')useMed(player)});
    window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='w')keys.w=false;if(k==='a')keys.a=false;if(k==='s')keys.s=false;if(k==='d')keys.d=false;if(k==='shift')keys.shift=false});
    canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
    canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();mouse.down=true;if(player?.using){player.using=false;player.useT=0}}});
    window.addEventListener('mouseup',e=>{if(e.button===0)mouse.down=false});
    canvas.addEventListener('wheel',e=>{if(!running||!player)return;e.preventDefault();const n=player.slot?0:1;if(player.guns[n])player.slot=n},{passive:false});
    const ro=new ResizeObserver(resize);ro.observe(root);resize();raf=requestAnimationFrame(loop);

    return{destroy:()=>{dead=true;running=false;cancelAnimationFrame(raf);ro.disconnect();try{audio?.close()}catch{}style.remove()}};
  }
};
export{DIFFICULTY,PRESETS,WEAPONS,CFG};
