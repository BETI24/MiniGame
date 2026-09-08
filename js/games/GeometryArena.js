import { GA_CONFIG, CLASSES, COLORS, DIFFICULTIES, getClassById } from './GeometryArenaData.js';
import {
  defaultProfile, sanitizeProfile, createRun, createWorld, updateWorld, firePlayer, useSkill,
  rollStore, buyUpgrade, rerollStore, finishStage, finalizeRun, runComplete, setDifficulty,
  nextDifficulty, buyTalent, classUnlocked, buildStats
} from './GeometryArenaEngine.js';
import {
  arenaLayout, renderTitle, renderLoadout, renderGameplay, renderStore, renderChallenge,
  renderEnd, renderSettings, renderSimpleInfo
} from './GeometryArenaRender.js';

export default {
  manifest:{
    id:'geometry-arena',
    name:'Geometry Arena',
    description:'Neon geometry arena-shooter roguelite with classes, upgrades, difficulty scaling and extreme projectile builds.',
    icon:'△',
    tags:['Action','Arena','Roguelite','Shooter','Bullet Hell','Highscore']
  },
  init:(container,services={})=>{
    let destroyed=false,raf=0,last=performance.now(),w=1,h=1,dpr=1,ro=null;
    let hotspots=[],mode='title',world=null,run=null,time=0,mouseDown=false,hovered=null;
    let pointer={x:-999,y:-999};
    const keys=new Set();
    let profile=loadProfile();

    const style=document.createElement('style');
    style.textContent=`
      .ga-root{position:relative;width:100%;height:100%;overflow:hidden;background:#000;user-select:none;touch-action:none}
      .ga-root canvas{display:block;width:100%;height:100%;background:#000;cursor:crosshair}
      .ga-root.ga-menu canvas{cursor:default}
    `;
    const root=document.createElement('div');root.className='ga-root ga-menu';
    const canvas=document.createElement('canvas');root.appendChild(canvas);container.append(style,root);
    const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});

    function loadProfile(){
      try{return sanitizeProfile(JSON.parse(localStorage.getItem(GA_CONFIG.saveKey)||'null'))}catch{return defaultProfile()}
    }
    function saveProfile(){try{localStorage.setItem(GA_CONFIG.saveKey,JSON.stringify(profile))}catch{} }
    function setMode(m){mode=m;root.classList.toggle('ga-menu',!['battle','prepare'].includes(m));}
    function refreshPreview(){return buildStats(profile,profile.selectedClass,profile.selectedColor)}
    function newRun(){
      run=createRun(profile);rollStore(run);world=createWorld(run,profile);setMode('prepare');saveProfile();
    }
    function goFight(){if(!run)return;world=createWorld(run,profile,world);world.phase='battle';setMode('battle');ensureAudio();tone(260,.08,.014,'sine');}
    function finishBattle(){
      if(!world||!world.ended)return;
      if(world.won){
        finishStage(world,profile);saveProfile();
        if(runComplete(run)){
          finalizeRun(run,profile);saveProfile();world=null;setMode('endComplete');tone(720,.22,.02,'triangle');
        }else{
          world=createWorld(run,profile,world);setMode('prepare');tone(540,.12,.014,'triangle');
        }
      }else{
        finalizeRun(run,profile);saveProfile();world=null;setMode('end');tone(90,.35,.018,'sawtooth');
      }
    }

    // Tiny synthesized feedback keeps the prototype self-contained.
    let audio=null;
    function ensureAudio(){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
    function tone(freq,dur=.05,vol=.01,type='sine'){
      const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur);
    }

    function resize(){
      const r=root.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    ro=new ResizeObserver(resize);ro.observe(root);resize();

    function render(){
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const common={time,profile,run,world,mode,previewStats:refreshPreview(),hovered};
      if(mode==='title')hotspots=renderTitle(ctx,w,h,common);
      else if(mode==='loadout')hotspots=renderLoadout(ctx,w,h,common);
      else if(mode==='settings')hotspots=renderSettings(ctx,w,h,common);
      else if(mode==='manual')hotspots=renderSimpleInfo(ctx,w,h,common,'Manual',[
        'Move: WASD or Arrow Keys    ·    Aim: Mouse',
        'Shoot: Left Mouse Button    ·    Skill: Right Mouse Button / Space',
        'Auto Fire: F (auto-targets nearest enemy)    ·    Store: Q    ·    Challenge: E    ·    Fight: G',
        'Destroy hostile projectiles, collect fragments, and combine upgrades into absurd builds.',
        'Normal Mode: 4 big levels, each containing 5 small levels.'
      ]);
      else if(mode==='updates')hotspots=renderSimpleInfo(ctx,w,h,common,'Browser V2',[
        'V2: playable prepare phase, clickable/hotkey store, finite clear-based waves, auto-fire targeting, responsive HUD.',
        'Normal Mode structure, bosses, elites, destructible enemy bullets and escalating particle effects are playable.',
        'More exact class modules, runes, enemies, upgrades and UI details will be added in later versions.'
      ]);
      else if(mode==='credits')hotspots=renderSimpleInfo(ctx,w,h,common,'Credits',[
        'Browser reimplementation for the Nexus Game Hub.',
        'Procedural Canvas graphics; no original game assets are bundled.',
        'Gameplay reference: Geometry Arena by 011 Games.'
      ]);
      else if(mode==='leaderboard')hotspots=renderSimpleInfo(ctx,w,h,common,'Statistics',[
        `Runs: ${profile.games||0}`,
        `Lifetime kills: ${profile.lifetimeKills||0}`,
        `Best stage: ${profile.bestStage||'1-1'}`,
        `Stored stars: ${Math.round(profile.totalStars).toLocaleString('en-US')}`,
        `Fragments: ${Math.round(profile.fragments).toLocaleString('en-US')}`
      ]);
      else if(mode==='prepare'||mode==='battle')hotspots=renderGameplay(ctx,w,h,common);
      else if(mode==='store')hotspots=renderStore(ctx,w,h,common);
      else if(mode==='challenge')hotspots=renderChallenge(ctx,w,h,common);
      else if(mode==='end'||mode==='endComplete')hotspots=renderEnd(ctx,w,h,{...common,completed:mode==='endComplete'});
    }

    function inputState(){return{
      left:keys.has('KeyA')||keys.has('ArrowLeft'),right:keys.has('KeyD')||keys.has('ArrowRight'),
      up:keys.has('KeyW')||keys.has('ArrowUp'),down:keys.has('KeyS')||keys.has('ArrowDown')
    }}
    function frame(now){
      if(destroyed)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;time+=dt;
      if((mode==='battle'||mode==='prepare')&&world&&!world.ended){world.mouse.down=mouseDown;updateWorld(world,dt,inputState(),mode);if(mode==='battle'&&world.ended)finishBattle();}
      render();raf=requestAnimationFrame(frame);
    }

    function localPos(ev){const r=canvas.getBoundingClientRect();return{x:(ev.clientX-r.left)*(w/r.width),y:(ev.clientY-r.top)*(h/r.height)};}
    function updateAim(p){
      if(!world)return;const lay=arenaLayout(w,h);world.mouse.x=(p.x-lay.ax)/lay.arena*1000;world.mouse.y=(p.y-lay.ay)/lay.arena*1000;
    }
    function hit(p){return hotspots.findLast?hotspots.findLast(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h):[...hotspots].reverse().find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);}

    function action(a,value){
      ensureAudio();
      switch(a){
        case 'start':case 'library':setMode('loadout');tone(380,.04,.009);break;
        case 'settings':setMode('settings');break;
        case 'manual':setMode('manual');break;
        case 'updates':setMode('updates');break;
        case 'credits':setMode('credits');break;
        case 'leaderboard':setMode('leaderboard');break;
        case 'quit': if(services?.closeGame)services.closeGame(); else if(services?.onExit)services.onExit(); break;
        case 'returnTitle':setMode('title');break;
        case 'selectClass':{const c=CLASSES.find(x=>x.id===value);if(c&&classUnlocked(profile,c)){profile.selectedClass=value;saveProfile();tone(470,.035,.008)}break;}
        case 'selectColor':if(COLORS.some(c=>c.id===value)){profile.selectedColor=value;saveProfile();tone(560,.03,.007)}break;
        case 'buyTalent':if(buyTalent(profile,profile.selectedClass,value)){saveProfile();tone(700,.05,.01,'triangle')}else tone(120,.06,.008,'square');break;
        case 'beginRun':newRun();break;
        case 'store':if(mode==='prepare'){if(!run.storeRoll?.length)rollStore(run);setMode('store')}break;
        case 'challenge':if(mode==='prepare')setMode('challenge');break;
        case 'goFight':if(mode==='prepare')goFight();break;
        case 'closeOverlay':setMode('prepare');break;
        case 'reroll':if(rerollStore(run)){tone(640,.05,.008);saveProfile()}else tone(120,.08,.007,'square');break;
        case 'buyUpgrade':if(buyUpgrade(run,value)){tone(820,.08,.012,'triangle')}else tone(120,.08,.007,'square');break;
        case 'raiseDifficulty':{const n=nextDifficulty(run.difficultyId);if(n.id!==run.difficultyId){setDifficulty(run,profile,n.id);saveProfile();tone(320,.12,.012,'sawtooth')}break;}
        case 'playAgain':setMode('loadout');break;
        case 'light':profile.settings.light=value;saveProfile();break;
        case 'toggleShake':profile.settings.screenShake=!profile.settings.screenShake;saveProfile();break;
        case 'toggleAutoFire':profile.settings.autoFire=!profile.settings.autoFire;saveProfile();tone(profile.settings.autoFire?700:250,.05,.008);break;
      }
    }

    function onPointerMove(ev){const p=localPos(ev);pointer=p;updateAim(p);const b=hit(p);hovered=b?{action:b.action,value:b.value,hoverKind:b.hoverKind,hoverValue:b.hoverValue}:null;}
    function onPointerDown(ev){
      const p=localPos(ev);pointer=p;const b=hit(p);if(b&&b.action){action(b.action,b.value);return;}
      if((mode==='battle'||mode==='prepare')&&world){updateAim(p);if(ev.button===2){useSkill(world);tone(220,.05,.01,'square')}else{mouseDown=true;world.mouse.down=true;firePlayer(world,true);}}
    }
    function onPointerUp(){mouseDown=false;if(world)world.mouse.down=false;}
    function onContext(ev){if(mode==='battle'||mode==='prepare'){ev.preventDefault();const p=localPos(ev);updateAim(p);useSkill(world);}}

    function onKeyDown(ev){
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(ev.code))ev.preventDefault();keys.add(ev.code);
      if(ev.repeat&&!["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(ev.code))return;
      if((mode==='battle'||mode==='prepare')&&world){
        if(ev.code==='Space')useSkill(world);
        if(ev.code==='KeyF')action('toggleAutoFire');
        if(mode==='prepare'){
          if(ev.code==='KeyQ')action('store');else if(ev.code==='KeyE')action('challenge');else if(ev.code==='KeyG')action('goFight');else if(ev.code==='Escape')setMode('loadout');
        }
      }else if(mode==='prepare'){
        if(ev.code==='KeyQ')action('store');else if(ev.code==='KeyE')action('challenge');else if(ev.code==='KeyG')action('goFight');else if(ev.code==='Escape')setMode('loadout');
      }else if(mode==='store'){
        if(ev.code==='KeyQ'||ev.code==='Escape')action('closeOverlay');else if(ev.code==='KeyR')action('reroll');else if(['Digit1','Digit2','Digit3','Numpad1','Numpad2','Numpad3'].includes(ev.code))action('buyUpgrade',Number(ev.code.slice(-1))-1);
      }else if(mode==='challenge'){
        if(ev.code==='KeyE'||ev.code==='Escape')action('closeOverlay');else if(ev.code==='KeyR')action('raiseDifficulty');
      }else if(['manual','updates','credits','leaderboard','settings'].includes(mode)&&ev.code==='Escape')setMode('title');
      else if(mode==='loadout'&&ev.code==='Escape')setMode('title');
    }
    function onKeyUp(ev){keys.delete(ev.code);}

    canvas.addEventListener('pointermove',onPointerMove);
    canvas.addEventListener('pointerdown',onPointerDown);
    window.addEventListener('pointerup',onPointerUp);
    canvas.addEventListener('contextmenu',onContext);
    window.addEventListener('keydown',onKeyDown,{passive:false});
    window.addEventListener('keyup',onKeyUp);
    const onVisibility=()=>{if(document.hidden){mouseDown=false;keys.clear();last=performance.now();}};document.addEventListener('visibilitychange',onVisibility);

    raf=requestAnimationFrame(frame);

    return {destroy(){
      destroyed=true;cancelAnimationFrame(raf);ro?.disconnect();canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerdown',onPointerDown);window.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('contextmenu',onContext);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);document.removeEventListener('visibilitychange',onVisibility);try{audio?.close()}catch{}root.remove();style.remove();
    }};
  }
};
