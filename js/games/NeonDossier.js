import {TILE,COLORS,RNG,fmtTime,clamp,dist} from './NeonDossierData.js';
import {createCity,tileAt,worldToTile,tileCenter,isPlayerWalkable,doorAt,lineOfSight,nearestRoadTile} from './NeonDossierWorld.js';
import {createCitizens,citizenById,getCitizenDescriptor,updateCitizens,nearbyCitizens} from './NeonDossierSim.js';
import {createMurderCase,evidenceForObject,employeeRecordsForBuilding,cctvRecords,directorySearch,createRepeatCrime,evaluateAccusation} from './NeonDossierCase.js';
import {drawGame,drawMinimap} from './NeonDossierRender.js';

export default {
  manifest:{
    id:'neon-dossier',
    name:'Neon Dossier',
    description:'Top-down procedural detective sandbox: investigate murders, tail citizens, break into apartments and build a case from real evidence.',
    icon:'🕵️',
    tags:['Detective','Sandbox','Procedural','Stealth','Investigation']
  },

  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),running=false;
    let W=1,H=1,dpr=1;
    let seed=`ND-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    let city=null,citizens=[],caseData=null,caseIndex=1;
    let player=null;
    let cam={x:0,y:0,zoom:.92,w:1,h:1};
    let keys={w:false,a:false,s:false,d:false,shift:false};
    let action=null;
    let modalOpen=false;
    let audio=null,muted=false;

    const state={
      timeReal:0,
      gameMinutes:8*60+30,
      scanner:false,
      scannerRange:95,
      cash:110,
      rep:0,
      lockpicks:5,
      bribes:1,
      heat:0,
      collected:new Set(),
      evidenceOrder:[],
      dynamicEvidence:new Map(),
      knownPeople:new Set(),
      knownPlaces:new Set(),
      accessRooms:new Set(),
      player:null,
      toasts:[],
      sideJob:null,
      solvedCases:0,
      wrongAccusations:0,
      score:0,
      secondCrimeTriggered:false
    };

    const style=document.createElement('style');
    style.textContent=`
      .nd{position:relative;width:100%;height:100%;min-height:620px;overflow:hidden;background:#0d1317;color:#edf3f5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none}
      .nd *{box-sizing:border-box}.nd canvas{display:block}.nd-main{position:absolute;inset:0;width:100%;height:100%}
      .nd-hud{position:absolute;z-index:10;inset:0;pointer-events:none}.nd-panel{background:#10181edc;border:1px solid #ffffff17;box-shadow:0 8px 28px #0006;backdrop-filter:blur(8px)}
      .nd-top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;gap:12px}.nd-top-left,.nd-top-right{display:flex;gap:7px;align-items:flex-start}
      .nd-chip{min-width:92px;padding:7px 9px;border-radius:5px}.nd-chip .k{font-size:.49rem;letter-spacing:.1em;text-transform:uppercase;color:#82939d;font-weight:900}.nd-chip .v{margin-top:2px;font-size:.82rem;font-weight:950}.nd-heat .v{color:#ef7c80}.nd-cash .v{color:#78daa0}.nd-rep .v{color:#6ad5e9}
      .nd-objective{position:absolute;left:12px;top:79px;width:min(360px,45vw);padding:10px 12px;border-left:3px solid #f0ca58;border-radius:4px}.nd-objective .eyebrow{font-size:.49rem;color:#f0ca58;font-weight:950;letter-spacing:.11em;text-transform:uppercase}.nd-objective .title{margin-top:4px;font-size:.82rem;font-weight:950}.nd-objective .desc{margin-top:3px;font-size:.59rem;color:#9babb4;line-height:1.4}
      .nd-side{position:absolute;left:12px;top:166px;width:300px;padding:8px 10px;border-radius:4px;display:none}.nd-side.on{display:block}.nd-side b{font-size:.65rem}.nd-side div{font-size:.56rem;color:#97a7af;margin-top:2px}
      .nd-help{position:absolute;left:50%;top:12px;transform:translateX(-50%);padding:7px 11px;border-radius:99px;font-size:.55rem;color:#94a2ab;white-space:nowrap}
      .nd-scan{position:absolute;left:50%;top:48px;transform:translateX(-50%);padding:5px 10px;border-radius:4px;font-size:.59rem;font-weight:950;color:#63dff1;opacity:0}.nd-scan.on{opacity:1;border-color:#53e0f44d}
      .nd-mini{position:absolute;left:12px;bottom:12px;width:180px;height:140px;border-radius:6px;overflow:hidden}.nd-mini canvas{width:100%;height:100%}.nd-mini-label{position:absolute;left:7px;top:5px;font-size:.48rem;font-weight:950;color:#dbe2e5;text-shadow:0 1px 2px #000}
      .nd-controls{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;pointer-events:auto}.nd-btn{border:1px solid #ffffff18;background:#172127e8;color:#dfe7ea;border-radius:5px;padding:8px 10px;font:inherit;font-size:.60rem;font-weight:900;cursor:pointer}.nd-btn:hover{background:#23323a}.nd-btn.primary{border-color:#5ad5e85e;color:#78dff0}.nd-btn.case{border-color:#e0bf5568;color:#f0d476}
      .nd-prompt{position:absolute;left:50%;bottom:52px;transform:translateX(-50%);min-width:230px;max-width:520px;padding:8px 12px;border-radius:5px;text-align:center;font-size:.65rem;font-weight:900;opacity:0;transition:opacity .1s}.nd-prompt.on{opacity:1}.nd-prompt b{color:#f0cf62}
      .nd-action{position:absolute;left:50%;bottom:92px;transform:translateX(-50%);width:260px;display:none}.nd-action.on{display:block}.nd-action-label{text-align:center;font-size:.58rem;font-weight:900;margin-bottom:4px}.nd-action-track{height:8px;background:#071015;border:1px solid #ffffff1a}.nd-action-fill{height:100%;width:0;background:#72d5be}
      .nd-trespass{position:absolute;right:12px;top:82px;padding:6px 9px;border-radius:4px;color:#ff9f93;font-size:.62rem;font-weight:1000;display:none}.nd-trespass.on{display:block}
      .nd-toastbox{position:absolute;right:12px;top:125px;width:320px;display:flex;flex-direction:column;gap:6px}.nd-toast{padding:8px 10px;border-radius:4px;background:#10191ee8;border-left:3px solid #5ecbdf;font-size:.58rem;line-height:1.35;box-shadow:0 6px 18px #0004}.nd-toast.good{border-left-color:#68d795}.nd-toast.bad{border-left-color:#ef6e73}.nd-toast.clue{border-left-color:#f0ca58}
      .nd-overlay{position:absolute;z-index:30;inset:0;display:flex;align-items:center;justify-content:center;padding:22px;background:#05090cbf;backdrop-filter:blur(8px)}.nd-overlay.hide{display:none}.nd-card{width:min(980px,96vw);max-height:92vh;overflow:auto;border:1px solid #ffffff17;border-radius:12px;background:linear-gradient(180deg,#1b252c,#10171c);box-shadow:0 28px 90px #0009;padding:22px}.nd-kicker{font-size:.56rem;font-weight:1000;color:#61d7e9;letter-spacing:.15em;text-transform:uppercase}.nd-title{font-size:clamp(2rem,4vw,3.5rem);font-weight:1000;letter-spacing:-.04em;margin:4px 0}.nd-desc{color:#95a4ad;line-height:1.55;font-size:.77rem;max-width:820px}.nd-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.nd-feature{padding:10px;border:1px solid #ffffff0f;background:#ffffff05;border-radius:7px}.nd-feature b{display:block;font-size:.67rem}.nd-feature span{display:block;margin-top:4px;color:#84939c;font-size:.59rem;line-height:1.4}.nd-startrow{display:flex;gap:8px;margin-top:16px}.nd-seed{flex:1;background:#0d151a;border:1px solid #ffffff17;color:#e6edef;border-radius:6px;padding:10px;font:inherit;font-size:.72rem}.nd-start{min-width:210px;background:#62cee1;color:#071317;border:0;border-radius:6px;font:inherit;font-weight:1000;cursor:pointer}
      .nd-modal{position:absolute;z-index:35;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:#05080bbb}.nd-modal.hide{display:none}.nd-modal-card{width:min(760px,94vw);max-height:86vh;overflow:auto;padding:18px;border-radius:10px;background:#182229;border:1px solid #ffffff17;box-shadow:0 24px 70px #0008}.nd-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.nd-modal-title{font-size:1.25rem;font-weight:1000}.nd-close{border:0;background:#2b373e;color:#d8e1e4;width:31px;height:31px;border-radius:5px;font-size:1rem;cursor:pointer}.nd-modal-body{margin-top:12px;color:#a8b4ba;font-size:.68rem;line-height:1.55}.nd-choice{display:block;width:100%;text-align:left;margin-top:7px;padding:10px;border:1px solid #ffffff12;background:#202c33;color:#e5ecef;border-radius:6px;font:inherit;cursor:pointer}.nd-choice:hover{background:#2a3941}.nd-choice b{display:block;font-size:.69rem}.nd-choice span{display:block;font-size:.57rem;color:#8fa0a8;margin-top:2px}.nd-choice.danger{border-color:#e35f6852}.nd-choice.good{border-color:#62d59554}
      .nd-case{position:absolute;z-index:40;inset:0;background:#090d10f4;padding:18px;overflow:auto}.nd-case.hide{display:none}.nd-case-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;max-width:1180px;margin:0 auto 12px}.nd-case-title{font-size:1.6rem;font-weight:1000}.nd-case-sub{font-size:.62rem;color:#8fa0a8;margin-top:3px}.nd-case-actions{display:flex;gap:6px}.nd-board{max-width:1180px;margin:auto;display:grid;grid-template-columns:1fr 330px;gap:12px}.nd-evidence-grid{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-content:start}.nd-links{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible}.nd-links line{stroke:#d0a846;stroke-width:2;stroke-opacity:.22}.nd-evidence{z-index:1}.nd-evidence{position:relative;min-height:130px;padding:11px;border-radius:6px;background:#e8dfc8;color:#282720;box-shadow:0 5px 14px #0005;transform:rotate(var(--r,0deg))}.nd-evidence:nth-child(3n+1){--r:-.45deg}.nd-evidence:nth-child(3n+2){--r:.35deg}.nd-evidence h4{font-size:.70rem;margin:0 0 5px}.nd-evidence p{font-size:.56rem;line-height:1.45;margin:0}.nd-tags{margin-top:7px;display:flex;gap:3px;flex-wrap:wrap}.nd-tags span{font-size:.46rem;padding:2px 4px;background:#00000012;border-radius:2px}.nd-resolve{padding:13px;border-radius:6px;background:#151f25;border:1px solid #ffffff13;align-self:start;position:sticky;top:8px}.nd-resolve h3{font-size:.82rem;margin:0}.nd-resolve p{font-size:.56rem;color:#8fa0a8;line-height:1.4}.nd-select,.nd-input{width:100%;margin-top:7px;background:#0e161a;color:#e8eef0;border:1px solid #ffffff18;border-radius:5px;padding:9px;font:inherit;font-size:.63rem}.nd-resolve-btn{width:100%;margin-top:9px;padding:10px;background:#d5b54e;color:#171306;border:0;border-radius:5px;font:inherit;font-weight:1000;cursor:pointer}.nd-known{margin-top:14px;padding-top:12px;border-top:1px solid #ffffff10}.nd-known h4{font-size:.60rem;margin:0 0 6px}.nd-person{font-size:.55rem;color:#9caab1;padding:4px 0;border-bottom:1px solid #ffffff08}
      .nd-map{position:absolute;z-index:38;inset:0;background:#090e12ee;padding:20px;display:flex;align-items:center;justify-content:center}.nd-map.hide{display:none}.nd-map-card{width:min(980px,95vw);height:min(760px,90vh);background:#152027;border:1px solid #ffffff16;border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 280px;gap:12px}.nd-mapcanvas{width:100%;height:100%;background:#11191e;border:1px solid #ffffff10}.nd-building-list{overflow:auto}.nd-building{padding:8px;border-bottom:1px solid #ffffff0d}.nd-building b{font-size:.62rem}.nd-building span{display:block;font-size:.53rem;color:#82939d;margin-top:2px}
      .nd-win{position:absolute;z-index:60;inset:0;background:#061015d9;display:flex;align-items:center;justify-content:center}.nd-win.hide{display:none}.nd-win-card{width:min(620px,92vw);padding:25px;border-radius:12px;background:#172228;border:1px solid #69da9b4d;text-align:center;box-shadow:0 28px 80px #0009}.nd-win-title{font-size:2rem;font-weight:1000}.nd-win-sub{color:#94a4ac;font-size:.72rem;line-height:1.5;margin-top:8px}.nd-win-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:17px 0}.nd-win-stat{padding:9px;background:#ffffff06}.nd-win-stat span{font-size:.48rem;color:#7f9099;text-transform:uppercase}.nd-win-stat b{display:block;font-size:.85rem;margin-top:2px}
      @media(max-width:850px){.nd-help{display:none}.nd-objective{width:calc(100% - 24px);top:70px}.nd-top-right{display:none}.nd-mini{width:125px;height:100px}.nd-board{grid-template-columns:1fr}.nd-evidence-grid{grid-template-columns:1fr 1fr}.nd-map-card{grid-template-columns:1fr}.nd-building-list{display:none}.nd-grid3{grid-template-columns:1fr}.nd-startrow{flex-direction:column}.nd-start{height:44px}.nd-controls{bottom:8px}.nd-win-stats{grid-template-columns:1fr 1fr}}
    `;

    const root=document.createElement('div');root.className='nd';
    root.innerHTML=`
      <canvas class="nd-main"></canvas>
      <div class="nd-hud">
        <div class="nd-top">
          <div class="nd-top-left">
            <div class="nd-chip nd-panel"><div class="k">TIME</div><div class="v nd-time">08:30</div></div>
            <div class="nd-chip nd-panel nd-cash"><div class="k">CASH</div><div class="v nd-cashv">$110</div></div>
            <div class="nd-chip nd-panel nd-rep"><div class="k">REPUTATION</div><div class="v nd-repv">0</div></div>
          </div>
          <div class="nd-top-right"><div class="nd-chip nd-panel nd-heat"><div class="k">HEAT</div><div class="v nd-heatv">0%</div></div><div class="nd-chip nd-panel"><div class="k">TOOLS</div><div class="v nd-toolsv">5 picks</div></div></div>
        </div>
        <div class="nd-objective nd-panel"><div class="eyebrow">ACTIVE CASE</div><div class="title nd-obj-title">Waiting for case...</div><div class="desc nd-obj-desc"></div></div>
        <div class="nd-side nd-panel"><b class="nd-side-title"></b><div class="nd-side-desc"></div></div>
        <div class="nd-help nd-panel">WASD Move · Shift Sprint · E Interact · F Scanner · TAB Case Board · M Map · Mouse Wheel Zoom</div>
        <div class="nd-scan nd-panel">FORENSIC SCANNER ACTIVE</div>
        <div class="nd-mini nd-panel"><canvas></canvas><div class="nd-mini-label">CITY MAP</div></div>
        <div class="nd-controls"><button class="nd-btn case" type="button" data-ui="case">CASE BOARD</button><button class="nd-btn" type="button" data-ui="map">MAP</button><button class="nd-btn" type="button" data-ui="scan">SCANNER</button></div>
        <div class="nd-prompt nd-panel"></div>
        <div class="nd-action"><div class="nd-action-label"></div><div class="nd-action-track"><div class="nd-action-fill"></div></div></div>
        <div class="nd-trespass nd-panel">⚠ TRESPASSING</div>
        <div class="nd-toastbox"></div>
      </div>

      <div class="nd-overlay menu">
        <div class="nd-card">
          <div class="nd-kicker">Procedural Top-Down Detective Sandbox</div>
          <div class="nd-title">NEON DOSSIER</div>
          <div class="nd-desc">A living noir city runs on its own schedule. Every citizen has a home, job, relationships, phone number, fingerprint and daily routine. Investigate a murder by visiting the scene, scanning trace evidence, questioning people, checking CCTV and phone logs, searching records, or illegally entering private spaces.</div>
          <div class="nd-grid3">
            <div class="nd-feature"><b>Living citizens</b><span>Residents travel between home, work, lunch and nightlife while the clock keeps moving.</span></div>
            <div class="nd-feature"><b>Real evidence chains</b><span>Fingerprints, shoe prints, records, address books, phone logs, email, receipts, CCTV and witnesses cross-reference each other.</span></div>
            <div class="nd-feature"><b>Multiple approaches</b><span>Ask politely, bribe, search public records, tail suspects, pick locks or risk trespassing to get the proof you need.</span></div>
          </div>
          <div class="nd-desc">Your first lead is the crime-scene address. Everything after that is yours to discover. A wrong accusation does not end the run, but costs cash and reputation. Leave a killer free too long and another citizen may die.</div>
          <div class="nd-startrow"><input class="nd-seed" value="${seed}" aria-label="City seed"><button class="nd-start" type="button">GENERATE CITY & START</button></div>
        </div>
      </div>

      <div class="nd-modal hide"><div class="nd-modal-card"><div class="nd-modal-head"><div><div class="nd-kicker nd-modal-kicker">INTERACTION</div><div class="nd-modal-title"></div></div><button class="nd-close" type="button">×</button></div><div class="nd-modal-body"></div></div></div>

      <div class="nd-case hide">
        <div class="nd-case-top"><div><div class="nd-kicker">INVESTIGATION BOARD</div><div class="nd-case-title"></div><div class="nd-case-sub"></div></div><div class="nd-case-actions"><button class="nd-btn" data-case="map">MAP</button><button class="nd-btn" data-case="close">CLOSE</button></div></div>
        <div class="nd-board"><div class="nd-evidence-grid"></div><div class="nd-resolve"><h3>Resolve Case</h3><p>Choose the person you believe committed the murder and the weapon type supported by your evidence.</p><select class="nd-select nd-suspect"></select><select class="nd-select nd-method"><option value="">Murder weapon...</option><option value="pistol">Compact pistol</option><option value="knife">Kitchen knife</option><option value="wrench">Heavy wrench</option></select><button class="nd-resolve-btn" type="button">SUBMIT ACCUSATION</button><div class="nd-known"><h4>KNOWN CITIZENS</h4><div class="nd-known-list"></div></div></div></div>
      </div>

      <div class="nd-map hide"><div class="nd-map-card"><canvas class="nd-mapcanvas"></canvas><div><div class="nd-modal-head"><div><div class="nd-kicker">CITY DIRECTORY</div><div class="nd-modal-title">Map</div></div><button class="nd-close nd-map-close" type="button">×</button></div><div class="nd-building-list"></div></div></div></div>

      <div class="nd-win hide"><div class="nd-win-card"><div class="nd-kicker">CASE CLOSED</div><div class="nd-win-title">Killer identified</div><div class="nd-win-sub"></div><div class="nd-win-stats"><div class="nd-win-stat"><span>Cases</span><b class="nd-w-cases">1</b></div><div class="nd-win-stat"><span>Cash</span><b class="nd-w-cash">$0</b></div><div class="nd-win-stat"><span>Rep</span><b class="nd-w-rep">0</b></div><div class="nd-win-stat"><span>Score</span><b class="nd-w-score">0</b></div></div><button class="nd-start nd-next" type="button" style="height:45px;width:100%">TAKE NEXT CASE</button></div></div>
    `;
    container.append(style,root);

    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const canvas=$('.nd-main'),ctx=canvas.getContext('2d');
    const mini=$('.nd-mini canvas'),mctx=mini.getContext('2d');
    const menu=$('.menu'),modal=$('.nd-modal'),caseEl=$('.nd-case'),mapEl=$('.nd-map'),winEl=$('.nd-win');
    const timeEl=$('.nd-time'),cashEl=$('.nd-cashv'),repEl=$('.nd-repv'),heatEl=$('.nd-heatv'),toolsEl=$('.nd-toolsv');
    const objTitle=$('.nd-obj-title'),objDesc=$('.nd-obj-desc'),promptEl=$('.nd-prompt'),scanEl=$('.nd-scan'),trespassEl=$('.nd-trespass'),toastBox=$('.nd-toastbox');
    const actionEl=$('.nd-action'),actionLabel=$('.nd-action-label'),actionFill=$('.nd-action-fill');
    const sideEl=$('.nd-side'),sideTitle=$('.nd-side-title'),sideDesc=$('.nd-side-desc');

    function ensureAudio(){if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
    function tone(f=360,d=.04,v=.018,type='sine'){const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}

    function resize(){
      const r=root.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);cam.w=W;cam.h=H;
      const mr=mini.getBoundingClientRect();mini.width=Math.max(1,Math.round(mr.width*dpr));mini.height=Math.max(1,Math.round(mr.height*dpr));mctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function startGame(){
      seed=$('.nd-seed').value.trim()||seed;
      city=createCity(seed);
      citizens=createCitizens(city,`${seed}-people`,42);
      state.gameMinutes=8*60+30;caseIndex=1;state.cash=110;state.rep=0;state.lockpicks=5;state.bribes=1;state.heat=0;state.solvedCases=0;state.score=0;state.sideJob=null;state.secondCrimeTriggered=false;
      state.collected=new Set();state.evidenceOrder=[];state.dynamicEvidence=new Map();state.knownPeople=new Set();state.knownPlaces=new Set();state.accessRooms=new Set();state.toasts=[];
      const records=city.buildings.find(b=>b.type==='records')||city.buildings[0];const startTile={x:records.entry.x,y:records.entry.y+2};const p=tileCenter(startTile.x,startTile.y);
      player={x:p.x,y:p.y,r:11,angle:0,speed:155};state.player=player;cam.x=player.x;cam.y=player.y;cam.zoom=.92;
      caseData=createMurderCase(city,citizens,`${seed}-case-${caseIndex}`,state.gameMinutes,caseIndex);
      state.knownPeople.add(caseData.victimId);state.knownPlaces.add(caseData.sceneBuildingId);
      menu.classList.add('hide');running=true;last=performance.now();
      toast(`Murder reported at ${buildingName(caseData.sceneBuildingId)}. Find the scene and inspect the victim.`,'clue',6);
      tone(220,.09,.025,'triangle');
      requestLoop();
    }

    function nextCase(){
      caseIndex++;
      state.collected=new Set();state.evidenceOrder=[];state.dynamicEvidence=new Map();state.knownPeople=new Set();state.knownPlaces=new Set();state.secondCrimeTriggered=false;
      caseData=createMurderCase(city,citizens,`${seed}-case-${caseIndex}`,state.gameMinutes,caseIndex);
      state.knownPeople.add(caseData.victimId);state.knownPlaces.add(caseData.sceneBuildingId);winEl.classList.add('hide');
      toast(`New case: ${caseData.title}. Scene: ${buildingName(caseData.sceneBuildingId)}.`,'clue',6);
    }

    function requestLoop(){if(!raf)raf=requestAnimationFrame(loop)}
    function loop(now){raf=0;if(destroyed||!running)return;const dt=Math.min(.04,(now-last)/1000||.016);last=now;state.timeReal+=dt;update(dt);render();requestLoop()}

    function update(dt){
      if(modalOpen||!caseEl.classList.contains('hide')||!mapEl.classList.contains('hide')||!winEl.classList.contains('hide')){updateToasts(dt);return;}
      state.gameMinutes+=dt*2.25;
      updatePlayer(dt);updateCitizens(city,citizens,dt,state.gameMinutes);updateAction(dt);updateTrespass(dt);updateToasts(dt);updateCaseConsequences();
      cam.x+=(player.x-cam.x)*Math.min(1,dt*7);cam.y+=(player.y-cam.y)*Math.min(1,dt*7);
    }

    function updatePlayer(dt){
      if(action)return;
      let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);const len=Math.hypot(dx,dy);if(!len)return;dx/=len;dy/=len;
      const speed=player.speed*(keys.shift?1.38:1);player.angle=Math.atan2(dy,dx);
      tryMove(player.x+dx*speed*dt,player.y);tryMove(player.x,player.y+dy*speed*dt);
    }

    function tryMove(nx,ny){
      const t=worldToTile(nx,ny);if(!isPlayerWalkable(city,t.x,t.y))return false;
      for(const o of city.objects){if(!o.solid)continue;if(Math.hypot(nx-o.x,ny-o.y)<20)return false;}
      player.x=nx;player.y=ny;return true;
    }

    function currentZone(){const t=worldToTile(player.x,player.y);return tileAt(city,t.x,t.y)}
    function hasAccess(tile){if(!tile?.buildingId||tile.zone!=='private')return true;return state.accessRooms.has(`${tile.buildingId}:${tile.roomId}`)}
    function updateTrespass(dt){
      const tile=currentZone(),tres=tile?.zone==='private'&&!hasAccess(tile);trespassEl.classList.toggle('on',!!tres);
      if(!tres){state.heat=Math.max(0,state.heat-dt*2.2);return;}
      let seen=false;
      for(const c of citizens){if(!c.alive)continue;const d=Math.hypot(c.x-player.x,c.y-player.y);if(d<155&&lineOfSight(city,c,player)){seen=true;break;}}
      if(!seen){
        for(const o of city.objects){if(o.kind!=='camera')continue;if(Math.hypot(o.x-player.x,o.y-player.y)<(o.range||220)&&lineOfSight(city,o,player)){seen=true;break;}}
      }
      if(seen)state.heat+=dt*18;else state.heat=Math.max(0,state.heat-dt*.8);
      if(state.heat>=100)busted();
    }

    function busted(){
      const road=nearestRoadTile(city,player),p=tileCenter(road.x,road.y);player.x=p.x;player.y=p.y;state.cash=Math.max(0,state.cash-75);state.rep=Math.max(-20,state.rep-2);state.heat=18;action=null;
      toast('Security caught you trespassing. You were removed and fined $75.','bad',5);tone(105,.15,.03,'sawtooth');
    }

    function updateCaseConsequences(){
      if(!caseData||caseData.solved||state.secondCrimeTriggered)return;
      if(state.gameMinutes>=caseData.strikeAt){
        const r=createRepeatCrime(caseData,city,citizens,`${seed}-repeat-${caseIndex}`);state.secondCrimeTriggered=true;
        if(r){toast(`BREAKING: another murder was reported at ${r.victim.address}. The killer is still active.`,'bad',8);state.rep-=1;}
      }
    }

    function updateAction(dt){
      if(!action){actionEl.classList.remove('on');return;}
      action.t-=dt;actionEl.classList.add('on');actionLabel.textContent=action.label;actionFill.style.width=`${clamp(1-action.t/action.total,0,1)*100}%`;
      if(action.t<=0){const a=action;action=null;actionEl.classList.remove('on');a.done?.();}
    }

    function nearestInteraction(){
      if(!city||!player)return null;const candidates=[];
      for(const e of caseData?.physical||[]){
        if(state.collected.has(e.evidenceId))continue;if(e.scanner&&!state.scanner)continue;const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<58&&lineOfSight(city,player,e))candidates.push({type:'evidence',target:e,d,priority:0});
      }
      for(const c of citizens){if(!c.alive)continue;const d=Math.hypot(player.x-c.x,player.y-c.y);if(d<56&&lineOfSight(city,player,c))candidates.push({type:'citizen',target:c,d,priority:1});}
      for(const d of city.doors){const p=tileCenter(d.x,d.y),dd=Math.hypot(player.x-p.x,player.y-p.y);if(dd<53)candidates.push({type:'door',target:d,d:dd,priority:2});}
      for(const o of city.objects){if(['lamp','camera','bed','desk','table'].includes(o.kind))continue;const d=Math.hypot(player.x-o.x,player.y-o.y);if(d<52&&lineOfSight(city,player,o))candidates.push({type:'object',target:o,d,priority:3});}
      candidates.sort((a,b)=>a.priority-b.priority||a.d-b.d);return candidates[0]||null;
    }

    function promptFor(i){
      if(!i)return '';
      if(i.type==='evidence')return `E · ${i.target.kind==='fingerprint'?'SCAN FINGERPRINT':i.target.kind==='shoeprint'?'SCAN SHOE PRINT':i.target.kind==='body'?'INSPECT BODY':'PICK UP EVIDENCE'}`;
      if(i.type==='citizen')return `E · TALK TO ${state.knownPeople.has(i.target.id)?i.target.name.toUpperCase():'CITIZEN'}`;
      if(i.type==='door')return i.target.locked?`E · LOCKPICK ${i.target.label.toUpperCase()}`:`E · ${i.target.label.toUpperCase()}`;
      const names={addressbook:'READ ADDRESS BOOK',phone:'CHECK PHONE LOG',trash:'SEARCH TRASH',employeeTerminal:'EMPLOYEE RECORDS',emailTerminal:'PRIVATE EMAIL TERMINAL',cctvTerminal:'CCTV ARCHIVE',directoryTerminal:'CITIZEN DIRECTORY',noticeboard:'JOB BOARD',shopCounter:'BYTE & KEY SHOP',register:'COUNTER',mailboxes:'MAILBOXES'};
      return `E · ${names[i.target.kind]||'INTERACT'}`;
    }

    function interact(){
      if(action||modalOpen||!caseEl.classList.contains('hide')||!mapEl.classList.contains('hide'))return;
      const i=nearestInteraction();if(!i)return;
      if(i.type==='evidence')collectEvidence(i.target.evidenceId);
      else if(i.type==='citizen')openConversation(i.target);
      else if(i.type==='door')interactDoor(i.target);
      else interactObject(i.target);
    }

    function interactDoor(d){
      if(!d.locked){toast('The door is unlocked.','',2);return;}
      const access=state.accessRooms.has(`${d.buildingId}:${d.roomId}`);
      if(access){d.locked=false;toast('You have permission to enter.','good',2);tone(430,.04,.015);return;}
      if(state.lockpicks<=0){toast('No lockpicks left. Byte & Key sells more.','bad',3);return;}
      state.lockpicks--;action={label:'Picking lock...',total:1.35,t:1.35,done:()=>{d.locked=false;state.heat+=5;toast('Lock opened. If anyone sees you inside, expect trouble.','clue',3);tone(520,.06,.02,'square')}};
    }

    function interactObject(o){
      const ids=evidenceForObject(caseData,o,citizens);if(ids.length){for(const id of ids)collectEvidence(id);return;}
      if(o.kind==='employeeTerminal')openEmployeeTerminal(o);
      else if(o.kind==='directoryTerminal')openDirectoryTerminal();
      else if(o.kind==='cctvTerminal')openCctvTerminal();
      else if(o.kind==='emailTerminal')openEmailTerminal(o);
      else if(o.kind==='noticeboard')openJobBoard();
      else if(o.kind==='shopCounter')openShop();
      else if(o.kind==='register')openCounter(o);
      else if(o.kind==='mailboxes')openMailboxes(o);
      else if(o.kind==='trash')toast('Mostly food wrappers and junk. Nothing relevant to the active case.','',2.5);
      else if(o.kind==='phone')toast('No case-relevant calls on this phone.','',2.5);
      else if(o.kind==='addressbook')toast('No useful names jump out from this address book.','',2.5);
    }

    function evidenceDef(id){return caseData.evidence.get(id)||state.dynamicEvidence.get(id)||null}
    function collectEvidence(id){
      if(state.collected.has(id))return;const e=evidenceDef(id);if(!e)return;state.collected.add(id);state.evidenceOrder.push(id);for(const p of e.personIds||[])state.knownPeople.add(p);for(const p of e.placeIds||[])state.knownPlaces.add(p);
      toast(`Evidence added: ${e.title}`,'clue',4);state.rep+=.15;tone(720,.05,.018,'sine');
      if(id==='body')toast('Try the forensic scanner (F), the victim’s phone/address book, CCTV, witnesses, or records.','',5);
    }

    function addCitizenProfile(c,source='Citizen record'){
      const id=`profile-${c.id}`;
      if(!state.dynamicEvidence.has(id))state.dynamicEvidence.set(id,{id,title:`${source}: ${c.name}`,kind:'profile',desc:`${c.name} · ${c.age} · ${c.jobTitle} at ${c.workplaceName} · ${c.address} · ${c.phone} · fingerprint ${c.fingerprint} · shoe ${c.shoe} · ${getCitizenDescriptor(c)}.`,personIds:[c.id],placeIds:[c.homeBuildingId,c.workplaceId],tags:['profile',c.fingerprint,c.phone,c.hair,c.build]});
      collectEvidence(id);state.knownPeople.add(c.id);
    }

    function openConversation(c){
      state.knownPeople.add(c.id);c.knowsPlayer=true;addCitizenProfile(c,'Interview');
      const victim=citizenById(citizens,caseData.victimId),related=c.friends.includes(victim.id)||c.coworkers.includes(victim.id)||c.household.includes(victim.id);
      const buttons=[];
      buttons.push(`<button class="nd-choice" data-talk="identity"><b>Ask about them</b><span>Job, home and basic identity.</span></button>`);
      buttons.push(`<button class="nd-choice" data-talk="victim"><b>Ask about ${victim.first}</b><span>See whether they knew the victim.</span></button>`);
      buttons.push(`<button class="nd-choice" data-talk="suspicious"><b>Ask about anything suspicious</b><span>Question them about the time around the murder.</span></button>`);
      buttons.push(`<button class="nd-choice" data-talk="alibi"><b>Ask where they were</b><span>Get their claimed whereabouts around ${fmtTime(caseData.timeOfDeath)}.</span></button>`);
      if(c.homeRoomId)buttons.push(`<button class="nd-choice" data-talk="entry"><b>Ask to enter their apartment</b><span>They may grant legal access to ${c.address}.</span></button>`);
      buttons.push(`<button class="nd-choice" data-talk="bribe"><b>Offer $25 for cooperation</b><span>Money can improve your odds of getting access.</span></button>`);
      openModal(`Interview · ${c.name}`,`<div>${getCitizenDescriptor(c)} · ${c.jobTitle} at ${c.workplaceName}</div>${buttons.join('')}`,'CITIZEN');
      $$('.nd-choice[data-talk]').forEach(btn=>btn.onclick=()=>{
        const t=btn.dataset.talk;
        if(t==='identity')modalMessage(`${c.name} works as a ${c.jobTitle} at ${c.workplaceName} and lives at ${c.address}.`);
        else if(t==='victim')modalMessage(related?`“Yeah, I knew ${victim.first}. We ${c.coworkers.includes(victim.id)?'worked together':c.household.includes(victim.id)?'lived together':'knew each other socially'}.”`:`“I didn't really know ${victim.first}.”`);
        else if(t==='suspicious'){
          if(c.id===caseData.witnessId){collectEvidence('witness');modalMessage(evidenceDef('witness').desc);}else modalMessage('“Nothing that seemed important. Sorry.”');
        }else if(t==='alibi'){
          if(c.id===caseData.killerId)modalMessage(`“I was ${c.targetState==='work'?'at work':'around home'}. I wasn't anywhere near ${buildingName(caseData.sceneBuildingId)}.” The answer is noticeably terse.`);
          else modalMessage(`“Around then I was probably ${c.targetState.replaceAll('-',' ')}.”`);
        }else if(t==='entry'){
          const chance=.28+Math.max(0,state.rep)*.018+(c.knowsPlayer ? .08 : 0);if(Math.random()<chance){state.accessRooms.add(`${c.homeBuildingId}:${c.homeRoomId}`);unlockRoom(c.homeBuildingId,c.homeRoomId);modalMessage('“Fine. Take a quick look, but don’t make a mess.” Access granted.');}else modalMessage('“No. I don’t let strangers search my home.”');
        }else if(t==='bribe'){
          if(state.cash<25){modalMessage('You do not have $25.');return;}state.cash-=25;state.accessRooms.add(`${c.homeBuildingId}:${c.homeRoomId}`);unlockRoom(c.homeBuildingId,c.homeRoomId);modalMessage('They pocket the money and reluctantly agree to let you inside.');
        }
        if(state.sideJob?.type==='locate'&&!state.sideJob.done&&c.id===state.sideJob.targetId){state.sideJob.done=true;state.cash+=state.sideJob.reward;state.rep+=1;toast(`Side job complete. +$${state.sideJob.reward}`,'good',4);closeModal();}
      });
    }

    function unlockRoom(buildingId,roomId){for(const d of city.doors)if(d.buildingId===buildingId&&d.roomId===roomId)d.locked=false}

    function openEmployeeTerminal(o){
      const rows=employeeRecordsForBuilding(o.buildingId,citizens);openModal('Employee Records',`<div>Internal staff directory for <b>${buildingName(o.buildingId)}</b>. Select a record to pin it to the case board.</div>${rows.map((r,i)=>`<button class="nd-choice" data-emp="${r.personId}"><b>${r.name} · ${r.job}</b><span>${r.fingerprint} · ${r.phone} · ${r.email}</span></button>`).join('')}`,'PRIVATE TERMINAL');
      $$('.nd-choice[data-emp]').forEach(b=>b.onclick=()=>{const c=citizenById(citizens,b.dataset.emp);if(c)addCitizenProfile(c,'Employee record')});
      if(currentZone()?.zone==='private')state.heat+=4;
    }

    function openDirectoryTerminal(){
      openModal('Citizen Directory',`<div>Search by <b>name, phone number, email or fingerprint code</b>. This public registry is useful for turning anonymous evidence into an identity.</div><input class="nd-input nd-dir-q" placeholder="e.g. FP-42-B or 555-1123"><div class="nd-dir-results"></div>`,'PUBLIC RECORDS');
      const q=$('.nd-dir-q'),res=$('.nd-dir-results');
      const run=()=>{const rows=directorySearch(q.value,citizens);res.innerHTML=rows.length?rows.map(r=>`<button class="nd-choice" data-dir="${r.personId}"><b>${r.name}</b><span>${r.address} · ${r.workplace} · ${r.phone} · ${r.fingerprint}</span></button>`).join(''):`<div style="margin-top:10px;color:#76878f">No matching records.</div>`;$$('.nd-choice[data-dir]').forEach(b=>b.onclick=()=>{const c=citizenById(citizens,b.dataset.dir);if(c)addCitizenProfile(c,'Civic record')});};
      q.addEventListener('input',run);setTimeout(()=>q.focus(),30);
    }

    function openCctvTerminal(){
      const rows=cctvRecords(caseData,city,citizens);openModal('City CCTV Archive',`<div>Camera log for the block around the active crime scene. Scrubbed to the estimated time of death.</div>${rows.map((r,i)=>`<button class="nd-choice ${r.evidenceId?'good':''}" data-cctv="${i}"><b>${fmtTime(r.time)}</b><span>${r.text}</span></button>`).join('')}`,'CAMERA ARCHIVE');
      $$('.nd-choice[data-cctv]').forEach(b=>b.onclick=()=>{const r=rows[+b.dataset.cctv];if(r.evidenceId)collectEvidence(r.evidenceId);modalMessage(r.text)});
    }

    function openEmailTerminal(o){
      const victim=citizenById(citizens,caseData.victimId);if(o.buildingId===victim.workplaceId){collectEvidence('email');openModal('Private Mail Archive',`<div class="nd-choice good"><b>Flagged thread</b><span>${evidenceDef('email').desc}</span></div><div class="nd-choice"><b>Shift rota update</b><span>Routine staff scheduling message.</span></div><div class="nd-choice"><b>Printer maintenance</b><span>Automated service notice.</span></div>`,'PRIVATE EMAIL');}
      else openModal('Private Mail Archive',`<div>No messages clearly related to ${caseData.title}. You skim mundane schedules, invoices and maintenance notices.</div>`,'PRIVATE EMAIL');
      state.heat+=5;
    }

    function openJobBoard(){
      if(state.sideJob&&!state.sideJob.done){openModal('Side Job Board',`<div>You already accepted a side job:</div><div class="nd-choice"><b>${state.sideJob.title}</b><span>${state.sideJob.desc} · Reward $${state.sideJob.reward}</span></div>`,'OPTIONAL WORK');return;}
      const pool=citizens.filter(c=>c.alive&&c.id!==caseData.victimId);const target=pool[Math.floor(Math.random()*pool.length)];const reward=90+Math.floor(Math.random()*70);
      openModal('Side Job Board',`<div>Small jobs can earn extra cash while your murder investigation remains active.</div><button class="nd-choice good nd-accept-job"><b>Locate a citizen</b><span>Client only knows: ${target.hair} hair, ${target.build} build, employed at ${target.workplaceName}. Find and speak to them. Reward $${reward}.</span></button>`,'OPTIONAL WORK');
      $('.nd-accept-job').onclick=()=>{state.sideJob={type:'locate',targetId:target.id,title:'Locate Citizen',desc:`Find a ${target.build} person with ${target.hair} hair who works at ${target.workplaceName}.`,reward,done:false};toast('Side job accepted.','good',3);closeModal()};
    }

    function openShop(){
      openModal('Byte & Key',`<div>Investigation tools, dubious electronics and lock hardware.</div><button class="nd-choice" data-buy="pick"><b>Lockpick · $20</b><span>Add one lockpick.</span></button><button class="nd-choice" data-buy="scan"><b>Scanner calibration · $120</b><span>Permanently increases forensic scan interaction range.</span></button><button class="nd-choice" data-buy="bribe"><b>Cash envelope · $30</b><span>A pre-counted envelope for awkward conversations.</span></button>`,'EQUIPMENT SHOP');
      $$('.nd-choice[data-buy]').forEach(b=>b.onclick=()=>{
        const k=b.dataset.buy,cost=k==='pick'?20:k==='scan'?120:30;if(state.cash<cost){modalMessage(`You need $${cost}.`);return;}state.cash-=cost;if(k==='pick')state.lockpicks++;else if(k==='scan')state.scannerRange=Math.min(150,state.scannerRange+18);else state.bribes++;modalMessage('Purchased.');tone(600,.04,.015)
      });
    }

    function openCounter(o){openModal('Counter',`<button class="nd-choice" data-coffee="1"><b>Buy coffee · $8</b><span>Lay low for a moment and reduce Heat by 18.</span></button>`,'PUBLIC BUSINESS');$('.nd-choice[data-coffee]').onclick=()=>{if(state.cash<8){modalMessage('Not enough cash.');return;}state.cash-=8;state.heat=Math.max(0,state.heat-18);modalMessage('The coffee is terrible. The short break helps you blend back into the crowd.')};}
    function openMailboxes(){openModal('Apartment Mailboxes',`<div>Names are printed beside the units:</div>${city.buildings.find(b=>b.id===currentZone()?.buildingId)?.homeUnits.map(h=>{const residents=citizens.filter(c=>c.homeId===h.id);return `<div class="nd-choice"><b>${h.address}</b><span>${residents.map(c=>c.name).join(' & ')||'Vacant'}</span></div>`}).join('')||''}`,'PUBLIC HALL');}

    function openModal(title,html,kicker='INTERACTION'){modalOpen=true;$('.nd-modal-title').textContent=title;$('.nd-modal-kicker').textContent=kicker;$('.nd-modal-body').innerHTML=html;modal.classList.remove('hide')}
    function closeModal(){modalOpen=false;modal.classList.add('hide')}
    function modalMessage(text){const body=$('.nd-modal-body');const msg=document.createElement('div');msg.className='nd-choice good';msg.innerHTML=`<b>Response</b><span>${text}</span>`;body.prepend(msg)}

    function openCaseBoard(){
      if(!running)return;caseEl.classList.remove('hide');modalOpen=false;modal.classList.add('hide');renderCaseBoard();
    }
    function closeCaseBoard(){caseEl.classList.add('hide')}
    function renderCaseBoard(){
      $('.nd-case-title').textContent=caseData.title;$('.nd-case-sub').textContent=`Case #${caseData.index} · Opened ${fmtTime(caseData.createdAt)} · ${state.evidenceOrder.length} evidence cards · ${state.knownPeople.size} known citizens`;
      const grid=$('.nd-evidence-grid');grid.innerHTML=state.evidenceOrder.length?`<svg class="nd-links"></svg>`+state.evidenceOrder.map(id=>{const e=evidenceDef(id);if(!e)return '';return `<article class="nd-evidence" data-evidence="${escapeHtml(id)}"><h4>${escapeHtml(e.title)}</h4><p>${escapeHtml(e.desc)}</p><div class="nd-tags">${(e.tags||[]).slice(0,5).map(t=>`<span>${escapeHtml(String(t))}</span>`).join('')}</div></article>`}).join(''):`<div style="color:#71828c;font-size:.7rem;padding:20px">No evidence pinned yet. Visit the crime scene and inspect the victim.</div>`;
      requestAnimationFrame(renderEvidenceLinks);
      const known=[...state.knownPeople].map(id=>citizenById(citizens,id)).filter(Boolean);$('.nd-known-list').innerHTML=known.map(c=>`<div class="nd-person">${c.name} · ${c.jobTitle} · ${c.workplaceName}</div>`).join('')||'<div class="nd-person">No identities discovered.</div>';
      $('.nd-suspect').innerHTML=`<option value="">Select suspect...</option>${known.filter(c=>c.id!==caseData.victimId&&c.alive).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}`;
    }

    function renderEvidenceLinks(){
      const grid=$('.nd-evidence-grid'),svg=grid.querySelector('.nd-links');if(!svg)return;
      const gr=grid.getBoundingClientRect(),cards=[...grid.querySelectorAll('.nd-evidence[data-evidence]')];
      const defs=cards.map(el=>({el,e:evidenceDef(el.dataset.evidence)}));let lines='';
      const shared=(a,b)=>{
        if(!a||!b)return false;
        if((a.personIds||[]).some(x=>(b.personIds||[]).includes(x)))return true;
        if((a.placeIds||[]).some(x=>(b.placeIds||[]).includes(x)))return true;
        const meaningful=(a.tags||[]).filter(x=>String(x).startsWith('FP-')||String(x).startsWith('555-'));
        return meaningful.some(x=>(b.tags||[]).includes(x));
      };
      for(let i=0;i<defs.length;i++)for(let j=i+1;j<defs.length;j++)if(shared(defs[i].e,defs[j].e)){
        const a=defs[i].el.getBoundingClientRect(),b=defs[j].el.getBoundingClientRect();
        const x1=a.left+a.width/2-gr.left,y1=a.top+a.height/2-gr.top,x2=b.left+b.width/2-gr.left,y2=b.top+b.height/2-gr.top;
        lines+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
      }
      svg.setAttribute('viewBox',`0 0 ${Math.max(1,gr.width)} ${Math.max(1,gr.height)}`);svg.innerHTML=lines;
    }

    function submitAccusation(){
      const suspect=$('.nd-suspect').value,method=$('.nd-method').value;if(!suspect||!method){toast('Select both a suspect and murder weapon.','bad',3);return;}
      const correct=evaluateAccusation(caseData,suspect)&&method===caseData.method.id;
      if(!correct){caseData.wrongAccusations++;state.wrongAccusations++;state.cash=Math.max(0,state.cash-60);state.rep-=2;toast('Accusation rejected. The evidence does not support your complete resolution. -$60, -2 reputation.','bad',5);closeCaseBoard();return;}
      caseData.solved=true;state.solvedCases++;state.cash+=caseData.payout;state.rep+=4;state.score=Math.round(state.solvedCases*1000+state.cash+state.rep*80-state.wrongAccusations*140+(state.secondCrimeTriggered?-250:250));services?.highscores?.saveHighscore?.('neon-dossier',state.score);
      closeCaseBoard();showWin(citizenById(citizens,caseData.killerId));
    }

    function showWin(killer){
      $('.nd-win-sub').textContent=`${killer.name} was responsible. Your evidence correctly connected the ${caseData.method.label}, ${killer.fingerprint}, the victim’s social trail and the suspect profile. Payout: $${caseData.payout}.`;
      $('.nd-w-cases').textContent=state.solvedCases;$('.nd-w-cash').textContent=`$${Math.round(state.cash)}`;$('.nd-w-rep').textContent=state.rep.toFixed(0);$('.nd-w-score').textContent=state.score;winEl.classList.remove('hide');tone(820,.13,.03,'sine');setTimeout(()=>tone(1050,.15,.02,'sine'),130);
    }

    function openMap(){
      if(!running)return;mapEl.classList.remove('hide');drawLargeMap();const list=$('.nd-building-list');list.innerHTML=city.buildings.map(b=>`<div class="nd-building"><b>${b.name}</b><span>${b.type} · ${state.knownPlaces.has(b.id)?'Known location':'City location'}</span></div>`).join('');
    }
    function closeMap(){mapEl.classList.add('hide')}
    function drawLargeMap(){
      const c=$('.nd-mapcanvas'),r=c.getBoundingClientRect(),dd=Math.min(2,devicePixelRatio||1);c.width=Math.round(r.width*dd);c.height=Math.round(r.height*dd);const x=c.getContext('2d');x.setTransform(dd,0,0,dd,0,0);const w=r.width,h=r.height,sx=w/city.worldW,sy=h/city.worldH;
      x.fillStyle='#11191e';x.fillRect(0,0,w,h);for(let y=0;y<city.height;y++)for(let xx=0;xx<city.width;xx++){const t=city.grid[y][xx];if(t.type==='road')x.fillStyle='#3d494f';else if(t.type==='sidewalk')x.fillStyle='#596367';else if(t.type==='floor'||t.type==='wall')x.fillStyle='#687176';else continue;x.fillRect(xx*TILE*sx,y*TILE*sy,TILE*sx+1,TILE*sy+1)}
      for(const b of city.buildings){const cx=(b.x+b.w/2)*TILE*sx,cy=(b.y+b.h/2)*TILE*sy;x.fillStyle='#cfd9dc';x.font='10px Arial';x.textAlign='center';x.fillText(b.name,cx,cy)}
      if(caseData&&!caseData.solved){x.fillStyle='#f0ca58';x.beginPath();x.arc(caseData.sceneX*sx,caseData.sceneY*sy,6,0,Math.PI*2);x.fill();}
      x.fillStyle=COLORS.player;x.beginPath();x.arc(player.x*sx,player.y*sy,6,0,Math.PI*2);x.fill();
    }

    function render(){
      if(!city||!player)return;state.player=player;drawGame(ctx,city,citizens,caseData,player,cam,state);const mr=mini.getBoundingClientRect();drawMinimap(mctx,city,citizens,player,caseData,state,mr.width,mr.height);updateHud();
    }
    function updateHud(){
      timeEl.textContent=fmtTime(state.gameMinutes);cashEl.textContent=`$${Math.round(state.cash)}`;repEl.textContent=state.rep.toFixed(0);heatEl.textContent=`${Math.round(state.heat)}%`;toolsEl.textContent=`${state.lockpicks} picks · scan ${state.scannerRange}`;scanEl.classList.toggle('on',state.scanner);
      if(caseData){objTitle.textContent=caseData.title;if(!state.collected.has('body'))objDesc.textContent=`Go to ${citizenById(citizens,caseData.victimId)?.address||buildingName(caseData.sceneBuildingId)} and inspect the crime scene.`;else if(!state.collected.has('killer-print')&&!state.collected.has('cctv')&&!state.collected.has('phone-log'))objDesc.textContent='Build leads: scan the scene, inspect the victim’s home, question neighbors or check CCTV.';else objDesc.textContent='Cross-reference your clues, identify a suspect, and submit a resolution from the Case Board.';}
      if(state.sideJob&&!state.sideJob.done){sideEl.classList.add('on');sideTitle.textContent=state.sideJob.title;sideDesc.textContent=state.sideJob.desc;}else sideEl.classList.remove('on');
      const i=nearestInteraction(),p=promptFor(i);promptEl.innerHTML=p?`<b>${p.split(' · ')[0]}</b> · ${p.split(' · ').slice(1).join(' · ')}`:'';promptEl.classList.toggle('on',!!p);
      toastBox.innerHTML=state.toasts.map(t=>`<div class="nd-toast ${t.type}">${escapeHtml(t.text)}</div>`).join('');
    }

    function toast(text,type='',life=3){state.toasts.unshift({text,type,life});state.toasts=state.toasts.slice(0,6)}
    function updateToasts(dt){for(const t of state.toasts)t.life-=dt;state.toasts=state.toasts.filter(t=>t.life>0)}
    function buildingName(id){return city?.buildings.find(b=>b.id===id)?.name||'Unknown location'}
    function escapeHtml(s){return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}

    function onKeyDown(e){
      if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
      const k=e.key.toLowerCase();
      if(k==='w')keys.w=true;if(k==='a')keys.a=true;if(k==='s')keys.s=true;if(k==='d')keys.d=true;if(k==='shift')keys.shift=true;
      if(e.repeat)return;
      if(k==='e')interact();
      else if(k==='f'&&running&&!modalOpen){state.scanner=!state.scanner;tone(state.scanner?640:300,.035,.01,'sine')}
      else if(e.key==='Tab'){e.preventDefault();caseEl.classList.contains('hide')?openCaseBoard():closeCaseBoard()}
      else if(k==='m'){mapEl.classList.contains('hide')?openMap():closeMap()}
      else if(k==='escape'){if(modalOpen)closeModal();else if(!caseEl.classList.contains('hide'))closeCaseBoard();else if(!mapEl.classList.contains('hide'))closeMap()}
    }
    function onKeyUp(e){const k=e.key.toLowerCase();if(k==='w')keys.w=false;if(k==='a')keys.a=false;if(k==='s')keys.s=false;if(k==='d')keys.d=false;if(k==='shift')keys.shift=false}
    function onWheel(e){if(!running)return;e.preventDefault();cam.zoom=clamp(cam.zoom*(e.deltaY>0?.92:1.08),.62,1.26)}

    $('.nd-start').onclick=startGame;$('.nd-close').onclick=closeModal;$('.nd-map-close').onclick=closeMap;$('.nd-resolve-btn').onclick=submitAccusation;$('.nd-next').onclick=nextCase;
    $$('[data-ui]').forEach(b=>b.onclick=()=>{const a=b.dataset.ui;if(a==='case')openCaseBoard();else if(a==='map')openMap();else if(a==='scan')state.scanner=!state.scanner});
    $('[data-case="close"]').onclick=closeCaseBoard;$('[data-case="map"]').onclick=()=>{closeCaseBoard();openMap()};
    window.addEventListener('resize',resize);window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);root.addEventListener('wheel',onWheel,{passive:false});
    resize();

    return {destroy:()=>{destroyed=true;running=false;if(raf)cancelAnimationFrame(raf);raf=0;window.removeEventListener('resize',resize);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);root.removeEventListener('wheel',onWheel);try{audio?.close?.()}catch{}style.remove();root.remove();}};
  }
};
