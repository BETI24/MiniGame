import { CONFIG, PLAYER_COLORS, MODE_DEFS, TEAM_DEFS } from './CellArenaData.js';
import { createWorld, center, largest, moveOwner, sameOwnerPhysics, splitOwner, ejectOwner, updateWorld, ranking, getModeStatus, playerScore, fmtTime, clamp, teamMasses } from './CellArenaEngine.js';
import { updateBotAI } from './CellArenaAI.js';
import { renderWorld, renderMini } from './CellArenaRender.js';

export default {
  manifest: {
    id: 'cell-arena',
    name: 'Cell Arena',
    description: 'Wachse, teile dich, verschlinge Gegner und spiele mehrere Agar-inspirierte Arena-Modi.',
    icon: '🟢',
    tags: ['Arcade','Arena','Survival','Highscore','Modes']
  },

  init: (container, services) => {
    let destroyed=false, raf=0, ro=null, last=performance.now();
    let width=1,height=1,dpr=1,running=false,ended=false,world=null;
    let playerName='Player',playerColor=PLAYER_COLORS[0],selectedMode='classic';
    let mouse={x:0,y:0,wx:0,wy:0};
    let camera={x:CONFIG.worldSize/2,y:CONFIG.worldSize/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};
    let muted=false,darkMode=false,audio=null,lastPlayerAlive=true;

    const style=document.createElement('style');
    style.textContent=`
      .ca{position:relative;width:100%;height:100%;overflow:hidden;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;user-select:none;color:#222}
      .ca *{box-sizing:border-box}.ca canvas{display:block;width:100%;height:100%}.ca-main{cursor:default}
      .ca-hud{position:absolute;inset:0;z-index:10;pointer-events:none}.ca-hidden{display:none!important}
      .ca-board{position:absolute;right:12px;top:12px;width:205px;padding:10px 12px;background:#ffffffd2;border:1px solid #00000017;box-shadow:0 2px 8px #0002;backdrop-filter:blur(5px)}
      .ca-board-title{text-align:center;color:#666;font-size:.76rem;font-weight:800;margin-bottom:7px}.ca-row{display:flex;gap:7px;align-items:center;padding:2px 0;color:#555;font-size:.69rem}.ca-row.you{color:#168edc;font-weight:800}.ca-rank{width:18px;color:#888}.ca-rname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ca-rmass{color:#777;font-size:.62rem}
      .ca-teamboard{margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #00000010}.ca-teamline{display:grid;grid-template-columns:52px 1fr 35px;align-items:center;gap:5px;margin:3px 0;font-size:.55rem}.ca-teamtrack{height:6px;background:#0001;border-radius:99px;overflow:hidden}.ca-teamfill{height:100%;border-radius:99px}
      .ca-modehud{position:absolute;left:50%;top:12px;transform:translateX(-50%);min-width:235px;max-width:min(520px,48vw);padding:8px 11px;text-align:center;background:#ffffffd2;border:1px solid #00000017;box-shadow:0 2px 8px #0002;font-size:.64rem;font-weight:800;backdrop-filter:blur(5px)}.ca-modehud small{display:block;margin-top:3px;color:#78828a;font-weight:600;font-size:.54rem}.ca-modebar{height:7px;margin-top:6px;background:#0001;border-radius:99px;overflow:hidden}.ca-modebar div{height:100%;background:#d85f63}
      .ca-bottom{position:absolute;left:12px;bottom:12px;display:flex;flex-direction:column;gap:5px}.ca-mass,.ca-help{background:#ffffffd2;border:1px solid #00000017;box-shadow:0 2px 7px #0001;padding:7px 10px;color:#555;backdrop-filter:blur(5px)}.ca-mass{font-size:.70rem;font-weight:700}.ca-help{max-width:390px;font-size:.59rem;line-height:1.42}
      .ca-map{position:absolute;right:12px;bottom:12px;width:155px;height:155px;background:#ffffffd2;border:1px solid #0003}.ca-map canvas{width:100%;height:100%}
      .ca-audio,.ca-theme{position:absolute;z-index:12;top:12px;padding:7px 9px;background:#ffffffdc;border:1px solid #0002;color:#666;font:inherit;font-size:.62rem;cursor:pointer}.ca-audio{left:12px}.ca-theme{left:86px}
      .ca.dark{background:#15191f;color:#eee}.ca.dark .ca-board,.ca.dark .ca-mass,.ca.dark .ca-help,.ca.dark .ca-audio,.ca.dark .ca-theme,.ca.dark .ca-modehud{background:#20262ee8;border-color:#ffffff18;color:#cbd3dc}.ca.dark .ca-board-title{color:#d9e0e7}.ca.dark .ca-row{color:#bdc7d1}.ca.dark .ca-row.you{color:#58b9ff}.ca.dark .ca-rank,.ca.dark .ca-rmass,.ca.dark .ca-modehud small{color:#8995a1}.ca.dark .ca-map{background:#20262ee8;border-color:#ffffff24}.ca.dark .ca-ov{background:#141920e8}.ca.dark .ca-card{background:#20262ef5;border-color:#ffffff1d;box-shadow:0 12px 38px #0008}.ca.dark .ca-sub,.ca.dark .ca-end-sub{color:#aab4be}.ca.dark .ca-name{background:#151a20;border-color:#ffffff26;color:#eef3f7}.ca.dark .ca-rule,.ca.dark .ca-stat,.ca.dark .ca-modecard{background:#181e25;border-color:#ffffff15;color:#9faab6}.ca.dark .ca-rule b,.ca.dark .ca-stat b,.ca.dark .ca-modecard b{color:#e0e6ec}.ca.dark .ca-stat span{color:#8f9aa6}.ca.dark .ca-teamboard{border-color:#ffffff12}
      .ca-ov{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:18px;background:#f6f6f6df;backdrop-filter:blur(4px)}.ca-ov.hide{display:none}.ca-card{width:min(880px,100%);max-height:94%;overflow:auto;padding:22px 24px;text-align:center;background:#fffffff4;border:1px solid #0002;border-radius:7px;box-shadow:0 12px 38px #0003}
      .ca-logo{font-size:clamp(2.5rem,6vw,4.4rem);line-height:.95;font-weight:900;letter-spacing:-.07em;margin-bottom:6px}.ca-logo .c1{color:#46a4f4}.ca-logo .c2{color:#ef586d}.ca-logo .c3{color:#78cd5e}.ca-logo .c4{color:#f0b34d}.ca-sub{color:#777;font-size:.78rem;line-height:1.45;margin-bottom:14px}.ca-name{width:100%;max-width:420px;padding:10px 12px;border:1px solid #ccc;background:white;font:inherit;text-align:center;outline:none}.ca-name:focus{border-color:#51a9ec;box-shadow:0 0 0 2px #51a9ec20}.ca-colors{display:flex;justify-content:center;flex-wrap:wrap;gap:7px;margin:10px 0 14px}.ca-color{width:25px;height:25px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:0 1px 4px #0002}.ca-color.sel{border-color:#333}
      .ca-modegrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0 14px}.ca-modecard{position:relative;padding:10px 8px;min-height:112px;border:1px solid #ddd;background:#fafafa;color:#777;text-align:left;cursor:pointer}.ca-modecard.sel{border-color:var(--mc);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--mc),transparent 55%)}.ca-modecard b{display:block;color:#555;font-size:.67rem;margin-bottom:4px}.ca-modecard small{display:block;font-size:.53rem;line-height:1.35}.ca-modebadge{position:absolute;right:6px;top:6px;padding:3px 5px;border-radius:4px;background:var(--mc);color:#fff;font-size:.45rem;font-weight:900}.ca-modeicon{font-size:1.15rem;margin-bottom:4px;color:var(--mc)}
      .ca-play{width:100%;max-width:520px;padding:12px;border:0;background:#49a7ef;color:white;font:inherit;font-weight:800;cursor:pointer;box-shadow:inset 0 -2px 0 #0002}.ca-rules{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.ca-rule{padding:8px;border:1px solid #ddd;background:#fafafa;color:#777;font-size:.59rem;line-height:1.38}.ca-rule b{display:block;color:#555;margin-bottom:2px}
      .ca-end-title{font-size:2rem;font-weight:900;color:#ec5c68;margin-bottom:7px}.ca-end-sub{color:#777;margin-bottom:15px}.ca-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:15px}.ca-stat{padding:9px 6px;border:1px solid #e1e1e1;background:#fafafa}.ca-stat span{display:block;color:#888;font-size:.52rem;text-transform:uppercase;font-weight:700}.ca-stat b{display:block;color:#444;margin-top:3px}.ca-end-actions{display:flex;gap:7px}.ca-end-actions .ca-play{max-width:none}
      @media(max-width:900px){.ca-modegrid{grid-template-columns:repeat(2,1fr)}.ca-board{width:165px}.ca-modehud{top:7px}.ca-map{width:120px;height:120px}.ca-stats{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:650px){.ca-board{width:135px;right:6px;top:6px;padding:6px}.ca-row{font-size:.56rem}.ca-map{width:92px;height:92px;right:6px;bottom:6px}.ca-bottom{left:6px;bottom:6px}.ca-help{display:none}.ca-audio{left:6px;top:6px}.ca-theme{left:76px;top:6px}.ca-modehud{top:43px;min-width:190px;max-width:60vw;font-size:.55rem}.ca-card{padding:15px}.ca-modegrid{grid-template-columns:1fr 1fr}.ca-rules{grid-template-columns:1fr}.ca-stats{grid-template-columns:1fr 1fr}}
    `;

    const modeCards=Object.values(MODE_DEFS).map(m=>`<button class="ca-modecard ${m.id===selectedMode?'sel':''}" data-mode="${m.id}" style="--mc:${m.color}" type="button"><span class="ca-modebadge">${m.badge}</span><div class="ca-modeicon">${m.icon}</div><b>${m.name}</b><small>${m.description}</small></button>`).join('');
    const root=document.createElement('div');root.className='ca';
    root.innerHTML=`
      <canvas class="ca-main"></canvas>
      <div class="ca-hud">
        <div class="ca-modehud"><div class="ca-mode-title">Classic FFA</div><small class="ca-mode-sub">Endless server</small><div class="ca-modebar ca-hidden"><div></div></div></div>
        <div class="ca-board"><div class="ca-teamboard ca-hidden"></div><div class="ca-board-title">Leaderboard</div><div class="ca-list"></div></div>
        <div class="ca-bottom"><div class="ca-mass">Mass: <span class="ca-mass-v">0</span> · Cells: <span class="ca-cells-v">1</span></div><div class="ca-help">Maus = bewegen · <b>SPACE</b> = teilen · <b>W</b> = Masse auswerfen · Bots haben verschiedene Skill-Stufen und respawnen in allen endlosen Modi.</div></div>
        <div class="ca-map"><canvas></canvas></div>
      </div>
      <button class="ca-audio" type="button">Sound: An</button><button class="ca-theme" type="button">Dark Mode</button>
      <div class="ca-ov ca-menu"><div class="ca-card">
        <div class="ca-logo"><span class="c1">C</span><span class="c2">e</span><span class="c3">l</span><span class="c4">l</span> Arena</div>
        <div class="ca-sub">Agar-inspirierte Arena mit lebendigeren Bots, dauerhaftem Respawn, Team-Comebacks, Bossen und mehreren experimentellen Modi.</div>
        <input class="ca-name" maxlength="16" value="Player" placeholder="Name" autocomplete="off" spellcheck="false">
        <div class="ca-colors">${PLAYER_COLORS.map((c,i)=>`<button class="ca-color ${i===0?'sel':''}" data-color="${c}" style="background:${c}" type="button"></button>`).join('')}</div>
        <div class="ca-modegrid">${modeCards}</div>
        <button class="ca-play menu-play" type="button">Play Classic FFA</button>
        <div class="ca-rules"><div class="ca-rule"><b>Smarter population</b>48+ Bots haben Rookie–Ace-KI. Schlechtere Bots machen bewusst häufiger Fehler.</div><div class="ca-rule"><b>Living server</b>Bots respawnen nach dem Tod. Nur Battle Royale bleibt absichtlich Elimination.</div><div class="ca-rule"><b>Environment</b>Viruses, Spawners, Mother Cells, Wormholes, Bumpers, Nutrient Clouds, Comets und Control Zones – je nach Modus.</div></div>
      </div></div>
      <div class="ca-ov ca-end hide"><div class="ca-card"><div class="ca-end-title">Round over</div><div class="ca-end-sub">Deine Arena-Runde ist vorbei.</div><div class="ca-stats"><div class="ca-stat"><span>Best Mass</span><b class="em">0</b></div><div class="ca-stat"><span>Cells Eaten</span><b class="ec">0</b></div><div class="ca-stat"><span>Food</span><b class="ef">0</b></div><div class="ca-stat"><span>Respawns</span><b class="er">0</b></div><div class="ca-stat"><span>Time</span><b class="et">0:00</b></div></div><div class="ca-end-actions"><button class="ca-play restart" type="button">Play Again</button><button class="ca-play menu-return" type="button" style="background:#68757e">Modes</button></div></div></div>`;
    container.append(style,root);

    const canvas=root.querySelector('.ca-main'),ctx=canvas.getContext('2d'),mini=root.querySelector('.ca-map canvas'),mctx=mini.getContext('2d');
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const listEl=$('.ca-list'),massEl=$('.ca-mass-v'),cellsEl=$('.ca-cells-v'),audioBtn=$('.ca-audio'),themeBtn=$('.ca-theme'),menu=$('.ca-menu'),end=$('.ca-end'),nameInput=$('.ca-name'),teamBoard=$('.ca-teamboard');

    function ensureAudio(){if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
    function tone(f,d=.04,v=.011,type='sine'){const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

    function currentMode(){return MODE_DEFS[selectedMode]||MODE_DEFS.classic;}
    function selectMode(id){selectedMode=id;$$('[data-mode]').forEach(x=>x.classList.toggle('sel',x.dataset.mode===id));const m=currentMode();$('.menu-play').textContent=`Play ${m.name}`;}

    function reset(){
      world=createWorld(selectedMode,{playerName,playerColor});camera={x:world.size/2,y:world.size/2,zoom:CONFIG.baseZoom,targetZoom:CONFIG.baseZoom};matchStartSnapshot={};running=true;ended=false;lastPlayerAlive=true;end.classList.add('hide');leaderboard();updateHud();
    }
    let matchStartSnapshot={};
    function start(){ensureAudio();playerName=nameInput.value.trim().slice(0,16)||'Player';menu.classList.add('hide');end.classList.add('hide');reset();}

    function updatePlayer(dt){
      const p=world?.player;if(!p?.alive)return;mouse.wx=camera.x+(mouse.x-width/2)/camera.zoom;mouse.wy=camera.y+(mouse.y-height/2)/camera.zoom;moveOwner(world,p,mouse.wx,mouse.wy,dt);sameOwnerPhysics(world,p);
    }
    function updateCamera(){
      if(!world?.player?.cells.length)return;const c=center(world.player);camera.x+=(c.x-camera.x)*.12;camera.y+=(c.y-camera.y)*.12;const m=Math.max(CONFIG.startMass,world.player.totalMass),sf=Math.max(1,Math.sqrt(world.player.cells.length)*.42+.58);camera.targetZoom=clamp(CONFIG.baseZoom/Math.pow(m/CONFIG.startMass,.18)/sf,CONFIG.minZoom,CONFIG.maxZoom);camera.zoom+=(camera.targetZoom-camera.zoom)*.10;
    }
    function rankValue(o){if(world.mode.hotzones)return `${Math.round(o.controlScore)} pts`;if(world.mode.rush)return `${Math.round(o.peakMass)} peak`;if(world.mode.boss)return `${Math.round(o.bossDamage)} dmg`;return `${Math.round(o.totalMass)}`;}
    function leaderboard(){
      if(!world)return;const a=ranking(world).slice(0,CONFIG.leaderboardSize);listEl.innerHTML=a.map((o,i)=>`<div class="ca-row ${o.isPlayer?'you':''}"><span class="ca-rank">${i+1}.</span><span class="ca-rname">${esc(o.name)}</span><span class="ca-rmass">${rankValue(o)}</span></div>`).join('');
      if(world.mode.teams){const masses=teamMasses(world),total=masses.reduce((a,b)=>a+b,0)||1;teamBoard.classList.remove('ca-hidden');teamBoard.innerHTML=masses.map((m,i)=>`<div class="ca-teamline"><span style="color:${TEAM_DEFS[i].color};font-weight:900">${TEAM_DEFS[i].name}</span><div class="ca-teamtrack"><div class="ca-teamfill" style="width:${m/total*100}%;background:${TEAM_DEFS[i].color}"></div></div><b>${Math.round(m/total*100)}%</b></div>`).join('');}
      else{teamBoard.classList.add('ca-hidden');teamBoard.innerHTML='';}
    }
    function updateModeHud(){
      if(!world)return;const s=getModeStatus(world),m=world.mode,title=$('.ca-mode-title'),sub=$('.ca-mode-sub'),bar=$('.ca-modebar'),fill=bar.querySelector('div');title.textContent=m.name;
      if(s.type==='teams'){const best=s.teams.slice().sort((a,b)=>b.share-a.share)[0];sub.textContent=`${best.team.name} leads ${Math.round(best.share*100)}% · comeback balancing active`;bar.classList.add('ca-hidden');}
      else if(s.type==='battle'){sub.textContent=`${s.alive} survivors · zone radius ${Math.round(s.zone.r)}`;bar.classList.remove('ca-hidden');fill.style.width=`${clamp(s.zone.r/s.zone.startR*100,0,100)}%`;fill.style.background='#e76569';}
      else if(s.type==='boss'){sub.textContent=`Cycle ${s.cycle} · ${s.name} · defeated ${s.defeated}`;bar.classList.remove('ca-hidden');fill.style.width=`${clamp(s.hp/s.maxHp*100,0,100)}%`;fill.style.background='#c975e2';}
      else if(s.type==='hotzones'){sub.textContent=`Control match · ${fmtTime(s.timer)} remaining`;bar.classList.remove('ca-hidden');fill.style.width=`${clamp(s.timer/world.mode.duration*100,0,100)}%`;fill.style.background='#e7a54f';}
      else if(s.type==='timer'){sub.textContent=`${fmtTime(s.timer)} remaining · highest peak mass wins`;bar.classList.remove('ca-hidden');fill.style.width=`${clamp(s.timer/world.mode.duration*100,0,100)}%`;fill.style.background='#e55e59';}
      else{sub.textContent=`Endless server · ${s.respawns} bot respawns so far`;bar.classList.add('ca-hidden');}
    }
    function updateHud(){if(!world)return;massEl.textContent=Math.round(world.player?.totalMass||0);cellsEl.textContent=world.player?.cells?.length||0;leaderboard();updateModeHud();}

    function finish(reason=''){
      if(ended)return;ended=true;running=false;const score=world?playerScore(world):0;services?.highscores?.saveHighscore?.('cell-arena',score);$('.em').textContent=Math.round(world?.player?.peakMass||0);$('.ec').textContent=world?.playerCellsEaten||0;$('.ef').textContent=world?.playerFood||0;$('.er').textContent=world?.stats?.respawns||0;$('.et').textContent=fmtTime(world?.time||0);
      const title=$('.ca-end-title'),sub=$('.ca-end-sub');if(world?.mode?.battle&&world?.winner?.isPlayer){title.textContent='Battle Royale Victory!';title.style.color='#d6ac43';}
      else if(world?.finished&&world?.winner?.isPlayer){title.textContent='You won!';title.style.color='#5dbd71';}
      else{title.textContent=world?.player?.alive?'Match complete':'You were eaten!';title.style.color='#ec5c68';}
      sub.textContent=reason||world?.finishReason||`${world?.mode?.name||'Arena'} round finished.`;end.classList.remove('hide');tone(world?.winner?.isPlayer?620:155,.10,.016);
    }

    function update(dt){
      if(!running||!world)return;updatePlayer(dt);for(const o of world.bots)updateBotAI(world,o,dt);updateWorld(world,dt);updateCamera();updateHud();
      const alive=!!world.player?.alive&&world.player.cells.length>0;if(lastPlayerAlive&&!alive){lastPlayerAlive=false;finish(world.mode.battle?'Eliminated from Battle Royale.':'Your cells were consumed. The server itself would continue respawning bots.');return;}
      if(world.finished)finish(world.finishReason);
    }
    function draw(){
      if(!world){ctx.fillStyle=darkMode?'#15191f':'#f4f4f4';ctx.fillRect(0,0,width,height);return;}renderWorld(ctx,world,camera,width,height,darkMode);if(running)renderMini(mctx,mini,world,darkMode);
    }
    function loop(t){if(destroyed)return;const dt=Math.min(.033,Math.max(0,(t-last)/1000));last=t;update(dt);draw();raf=requestAnimationFrame(loop);}
    function resize(){const r=root.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
    function pointerMove(e){const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;}
    function keyDown(e){
      if(!running){if(e.code==='Enter'&&!menu.classList.contains('hide'))start();return;}if(!world?.player?.alive)return;
      if(e.code==='Space'&&!e.repeat){e.preventDefault();if(splitOwner(world,world.player,mouse.wx,mouse.wy,CONFIG.maxPlayerCells))tone(320,.055,.014,'triangle');}
      if((e.key==='w'||e.key==='W')&&!e.repeat){if(ejectOwner(world,world.player,mouse.wx,mouse.wy))tone(235,.035,.007);}
    }

    $$('.ca-color').forEach(b=>b.onclick=()=>{playerColor=b.dataset.color;$$('.ca-color').forEach(x=>x.classList.toggle('sel',x===b));});
    $$('[data-mode]').forEach(b=>b.onclick=()=>selectMode(b.dataset.mode));
    $('.menu-play').onclick=start;$('.restart').onclick=start;$('.menu-return').onclick=()=>{end.classList.add('hide');menu.classList.remove('hide');running=false;world=null;};
    audioBtn.onclick=()=>{muted=!muted;audioBtn.textContent='Sound: '+(muted?'Aus':'An');if(!muted)tone(600,.04,.01);};
    themeBtn.onclick=()=>{darkMode=!darkMode;root.classList.toggle('dark',darkMode);themeBtn.textContent=darkMode?'Light Mode':'Dark Mode';};
    canvas.addEventListener('pointermove',pointerMove);window.addEventListener('keydown',keyDown);ro=new ResizeObserver(resize);ro.observe(root);resize();mouse.x=width/2;mouse.y=height/2;raf=requestAnimationFrame(loop);

    return{destroy:()=>{destroyed=true;running=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',keyDown);canvas.removeEventListener('pointermove',pointerMove);try{audio?.close()}catch{}style.remove();}};
  }
};
