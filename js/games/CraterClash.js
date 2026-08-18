import {WEAPONS,DIFFICULTIES,MODES,ARENAS,MATCH_DEFAULTS} from "./CraterClashData.js";
import {createState,updateState,currentTank,fire,selectWeapon,clamp,performBotShot,moveTank,resetTrainingRange} from "./CraterClashEngine.js";
import {getWeaponTierStats,createRogueRun,getRogueEnemyScale,rogueStageLabel,rewardRogueVictory,getRogueShopCatalog,buyRogueUpgrade} from "./CraterClashProgression.js";
import {render} from "./CraterClashRender.js";

export default {
  manifest:{
    id:"crater-clash",
    name:"Crater Clash",
    description:"Turn-based artillery with destructible terrain, 80+ weapons, weapon families with two to four tiers, trick-shot physics and a salvage-shop roguelite mode.",
    icon:"💥",
    tags:["Artillery","Strategy","Turn Based","Physics","Roguelite"]
  },

  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),state=null,W=1,H=1,dpr=1,running=false,botThinkDelay=.7,lastTurnId=null,lastInventorySig="";
    let menuMode="standard",mode="ffa",difficulty="normal",arenaIndex=0,trainingArena=0,rogueRun=null;
    const settings={...MATCH_DEFAULTS};
    const moveKeys={left:false,right:false};

    const style=document.createElement("style");
    style.textContent=`
      .cc{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;background:#07101a;color:#eef6fb;font-family:Inter,system-ui,sans-serif;user-select:none}
      .cc *{box-sizing:border-box}.cc canvas{width:100%;height:100%;display:block;cursor:crosshair}
      .cc-bottom{position:absolute;z-index:12;left:50%;bottom:10px;transform:translateX(-50%);width:min(1120px,calc(100% - 22px));display:grid;grid-template-columns:205px 1fr 205px;gap:8px;align-items:end;pointer-events:none}
      .cc-panel{background:#08131fe8;border:1px solid #65dfff33;border-radius:12px;box-shadow:0 12px 36px #0006;backdrop-filter:blur(10px);pointer-events:auto}
      .cc-aim{padding:10px}.cc-aim-row{display:grid;grid-template-columns:55px 1fr 42px;gap:7px;align-items:center;margin:5px 0}.cc-aim label{font-size:.53rem;color:#718696;font-weight:950;text-transform:uppercase}.cc-aim b{text-align:right;font-size:.64rem}.cc-aim input{width:100%;accent-color:#66e5ff}
      .cc-fuel{height:6px;background:#283440;border-radius:99px;overflow:hidden;margin:8px 0 5px}.cc-fuel>div{height:100%;background:linear-gradient(90deg,#5de2bc,#76e8ff)}.cc-fueltext{font-size:.54rem;color:#8aa0ae;font-weight:850}
      .cc-fire{width:100%;height:43px;margin-top:6px;border:0;border-radius:8px;background:linear-gradient(135deg,#ff5a76,#ffb34f);color:#1c0b10;font:inherit;font-weight:1000;cursor:pointer}.cc-fire:disabled{filter:grayscale(1);opacity:.43;cursor:not-allowed}
      .cc-weapons{padding:7px;display:flex;gap:5px;overflow-x:auto;min-height:88px}.cc-weapon{position:relative;flex:0 0 102px;min-height:70px;border:1px solid #ffffff15;border-radius:8px;background:#122131;color:#dce8ef;padding:6px;text-align:left;cursor:pointer}.cc-weapon.on{border-color:#7be7ff;box-shadow:0 0 0 2px #50d4ff33,0 0 18px #45c8ff30}.cc-weapon.empty{opacity:.25;cursor:not-allowed}.cc-weapon.t2{background:linear-gradient(155deg,#17283a,#182438)}.cc-weapon.t3{background:linear-gradient(155deg,#2a1941,#11293b);border-color:#bd82ff55}.cc-weapon.t4{background:linear-gradient(155deg,#4a2810,#2b1746 55%,#0d3140);border-color:#ffe08099;box-shadow:inset 0 0 16px #ffd96618}.cc-weapon.t4 .cc-tier{color:#ffe78a;text-shadow:0 0 8px #ffd75a}
      .cc-wicon{font-size:1.02rem}.cc-wname{font-size:.56rem;font-weight:950;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-wcat{font-size:.47rem;color:#708391;margin-top:2px}.cc-ammo{position:absolute;right:5px;top:5px;font-size:.52rem;font-weight:1000;color:#ffd96e}.cc-tier{position:absolute;right:5px;bottom:5px;font-size:.49rem;font-weight:1000;color:#8eeaff}
      .cc-info{padding:10px;min-height:88px}.cc-info h3{margin:0;font-size:.77rem}.cc-info p{margin:4px 0 0;font-size:.56rem;color:#8395a2;line-height:1.38}.cc-charge{height:5px;background:#283340;border-radius:99px;margin-top:7px;overflow:hidden}.cc-charge div{height:100%;background:linear-gradient(90deg,#56dbff,#f3d75b)}
      .cc-controls{position:absolute;z-index:10;left:14px;top:90px;padding:8px 10px;border-radius:8px;background:#07101ad9;border:1px solid #ffffff12;color:#8798a5;font-size:.54rem;font-weight:850;pointer-events:none;line-height:1.5}
      .cc-overlay{position:absolute;z-index:30;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:#02060cca;backdrop-filter:blur(10px);overflow:auto}.cc-overlay.hide{display:none}.cc-menu{width:min(1080px,100%);max-height:calc(100% - 18px);overflow:auto;padding:25px;border-radius:18px;background:linear-gradient(180deg,#152436,#09121d);border:1px solid #6de0ff2c;box-shadow:0 30px 100px #0009}
      .cc-k{font-size:.62rem;font-weight:1000;color:#68dcff;text-transform:uppercase;letter-spacing:.14em}.cc-title{margin:5px 0;font-size:clamp(2.7rem,6vw,5.5rem);font-weight:1000;letter-spacing:-.06em;line-height:.88;background:linear-gradient(90deg,#63e3ff,#ac86ff,#ff687f);-webkit-background-clip:text;color:transparent}.cc-desc{max-width:850px;color:#8fa1ae;font-size:.75rem;line-height:1.55}
      .cc-tabs{display:flex;gap:7px;margin:15px 0}.cc-tab{flex:1;padding:11px;border-radius:9px;border:1px solid #ffffff12;background:#ffffff05;color:#8295a3;font:inherit;font-size:.68rem;font-weight:950;cursor:pointer}.cc-tab.sel{color:#fff;border-color:#6de1ff88;background:#62dfff14}
      .cc-sec{margin:14px 0 6px;color:#ccd8df;font-size:.58rem;font-weight:950;text-transform:uppercase}.cc-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.cc-opt{padding:10px;border-radius:9px;border:1px solid #ffffff13;background:#ffffff05;color:#edf4f7;text-align:left;cursor:pointer}.cc-opt.sel{border-color:#69dfff99;background:#57d8ff12}.cc-opt b{display:block;font-size:.7rem}.cc-opt span{display:block;margin-top:3px;color:#778a98;font-size:.55rem;line-height:1.35}.cc-arenas{grid-template-columns:repeat(4,1fr)}
      .cc-setting-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.cc-setting{padding:8px 9px;border-radius:9px;background:#ffffff05;border:1px solid #ffffff0e}.cc-setting label{display:block;color:#718796;font-size:.51rem;font-weight:950;text-transform:uppercase;margin-bottom:5px}.cc-setting select{width:100%;border:1px solid #ffffff13;border-radius:7px;background:#0c1723;color:#e9f2f6;padding:7px;font:inherit;font-size:.62rem}
      .cc-note{margin-top:10px;padding:9px 11px;border-radius:9px;background:#6f5cff12;border:1px solid #a28cff22;color:#93a5b1;font-size:.57rem;line-height:1.45}.cc-start{width:100%;margin-top:16px;padding:13px;border:0;border-radius:9px;background:linear-gradient(135deg,#62e2ff,#a97cff);color:#071018;font:inherit;font-weight:1000;cursor:pointer}
      .cc-rogue-card{padding:16px;border-radius:12px;background:linear-gradient(135deg,#17233a,#25182e);border:1px solid #a67dff33}.cc-rogue-card h2{margin:4px 0 7px}.cc-rogue-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.cc-rogue-loop div{padding:9px;border-radius:8px;background:#050b12aa;font-size:.57rem;color:#8fa2af}.cc-rogue-loop b{display:block;color:#fff;font-size:.64rem;margin-bottom:3px}
      .cc-result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:15px 0}.cc-result-grid div{padding:10px;text-align:center;background:#ffffff06;border-radius:8px}.cc-result-grid span{display:block;color:#718594;font-size:.51rem;text-transform:uppercase}.cc-result-grid b{display:block;margin-top:3px}.cc-run-stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.cc-run-stats span{padding:5px 7px;border-radius:99px;background:#ffffff07;font-size:.53rem;color:#9cafba}
      .cc-shop-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:10px 0 14px;padding:10px 12px;border-radius:10px;background:#08121ee8;border:1px solid #79ddff22}.cc-currency{font-size:1.25rem;font-weight:1000;color:#ffd66f}.cc-currency small{display:block;color:#718795;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase}
      .cc-shop-layout{display:grid;grid-template-columns:1fr 300px;gap:10px}.cc-trees{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.cc-tree{padding:12px;border-radius:11px;background:#07111ccc;border:1px solid #ffffff0e}.cc-tree-title{display:flex;align-items:center;gap:7px;margin-bottom:8px}.cc-tree-title .ico{font-size:1.25rem}.cc-tree-title b{font-size:.75rem}.cc-tree-title span{display:block;color:#738695;font-size:.51rem;margin-top:2px}.cc-tree-nodes{display:grid;gap:6px}.cc-shop-item{width:100%;padding:9px;border-radius:8px;border:1px solid #ffffff10;background:#101d2b;color:#eaf3f7;text-align:left;cursor:pointer;position:relative}.cc-shop-item:hover:not(:disabled){border-color:#73ddff;background:#122a3b}.cc-shop-item:disabled{opacity:.38;cursor:not-allowed}.cc-shop-item.maxed{opacity:.58}.cc-shop-item b{display:block;font-size:.62rem;padding-right:58px}.cc-shop-item p{margin:3px 0 0;color:#7d909d;font-size:.51rem;line-height:1.3}.cc-shop-item .cost{position:absolute;right:7px;top:7px;color:#ffd66f;font-size:.57rem;font-weight:1000}.cc-shop-item .rank{font-size:.48rem;color:#73dfff;margin-top:4px;font-weight:900}.cc-unique-shop{padding:12px;border-radius:11px;background:#0b1220;border:1px solid #b185ff26}.cc-unique-shop h3{margin:0 0 7px;font-size:.72rem}.cc-unique-list{display:grid;gap:6px}.cc-next{margin-top:10px;background:linear-gradient(135deg,#69e0b1,#68c9ff)}
      .cc-weapons{scrollbar-width:thin;scrollbar-color:#3bc9ee55 transparent}.cc-weapons::-webkit-scrollbar{height:5px}.cc-weapons::-webkit-scrollbar-thumb{background:#55dfff55;border-radius:99px}
      .cc.cc-compact .cc-bottom{left:8px;right:8px;bottom:7px;transform:none;width:auto;grid-template-columns:170px minmax(0,1fr);gap:6px}
      .cc.cc-compact .cc-info{display:none}.cc.cc-compact .cc-aim{padding:7px}.cc.cc-compact .cc-aim-row{grid-template-columns:45px 1fr 34px;gap:5px;margin:3px 0}
      .cc.cc-compact .cc-fire{height:36px;margin-top:4px}.cc.cc-compact .cc-weapons{padding:5px;min-height:72px}.cc.cc-compact .cc-weapon{flex-basis:88px;min-height:60px;padding:5px}.cc.cc-compact .cc-wname{font-size:.52rem}.cc.cc-compact .cc-wcat{display:none}
      .cc.cc-compact .cc-overlay{padding:10px}.cc.cc-compact .cc-menu{padding:18px}.cc.cc-compact .cc-title{font-size:clamp(2.25rem,5vw,4.5rem)}
      .cc.cc-short .cc-bottom{left:5px;right:5px;bottom:4px;grid-template-columns:142px minmax(0,1fr);gap:4px}.cc.cc-short .cc-panel{border-radius:9px}
      .cc.cc-short .cc-aim{padding:5px}.cc.cc-short .cc-aim-row{grid-template-columns:37px 1fr 30px;gap:3px;margin:1px 0}.cc.cc-short .cc-aim-row label{font-size:.46rem}.cc.cc-short .cc-aim-row b{font-size:.55rem}
      .cc.cc-short .cc-fuel{height:4px;margin:4px 0 2px}.cc.cc-short .cc-fueltext{font-size:.46rem}.cc.cc-short .cc-fire{height:28px;margin-top:3px;font-size:.66rem}
      .cc.cc-short .cc-weapons{min-height:57px;padding:3px;gap:3px}.cc.cc-short .cc-weapon{flex-basis:72px;min-height:49px;padding:4px;border-radius:6px}.cc.cc-short .cc-wicon{font-size:.82rem}.cc.cc-short .cc-wname{font-size:.46rem;margin-top:1px}.cc.cc-short .cc-ammo,.cc.cc-short .cc-tier{font-size:.43rem}.cc.cc-short .cc-controls{display:none}
      .cc.cc-short .cc-overlay{padding:5px}.cc.cc-short .cc-menu{padding:13px;max-height:calc(100% - 8px)}.cc.cc-short .cc-sec{margin:9px 0 4px}.cc.cc-short .cc-opt{padding:7px}.cc.cc-short .cc-setting{padding:6px}.cc.cc-short .cc-start{margin-top:10px;padding:10px}
      @media(max-width:900px){.cc-bottom{grid-template-columns:160px minmax(0,1fr)}.cc-shop-layout{grid-template-columns:1fr}.cc-trees{grid-template-columns:1fr 1fr}.cc-info{display:none}.cc-arenas,.cc-setting-grid{grid-template-columns:1fr 1fr}.cc-controls{display:none}.cc-rogue-loop{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.cc-opts,.cc-trees{grid-template-columns:1fr}.cc-setting-grid{grid-template-columns:1fr 1fr}.cc-bottom{grid-template-columns:132px minmax(0,1fr)}.cc-weapon{flex-basis:76px}.cc-menu{padding:14px}}
    `;

    const root=document.createElement("div");root.className="cc";
    root.innerHTML=`
      <canvas></canvas>
      <div class="cc-controls">A / D = Drive · ← / → = Angle · ↑ / ↓ = Power<br>Q / E = Weapon · SPACE = Fire · Mouse = Aim + Fire · Training: R = Reset</div>
      <div class="cc-bottom">
        <div class="cc-panel cc-aim">
          <div class="cc-aim-row"><label>Angle</label><input class="angle" type="range" min="5" max="175" step="1"><b class="angle-v">45°</b></div>
          <div class="cc-aim-row"><label>Power</label><input class="power" type="range" min="10" max="100" step="1"><b class="power-v">60</b></div>
          <div class="cc-fuel"><div></div></div><div class="cc-fueltext">FUEL 100 / 100</div>
          <button class="cc-fire">FIRE</button>
        </div>
        <div class="cc-panel cc-weapons"></div>
        <div class="cc-panel cc-info"></div>
      </div>
      <div class="cc-overlay menu"><div class="cc-menu">
        <div class="cc-k">Turn-Based Ballistics Arena</div><div class="cc-title">CRATER<br>CLASH</div>
        <div class="cc-desc">Destructible terrain, tactical movement, trick-shot gates, portals, bumpers and over 80 distinct weapons with uneven two-, three- and four-tier evolution families. Standard matches expose the full arsenal immediately; Rogue Run uses a session-only salvage economy and upgrade shop.</div>
        <div class="cc-tabs"><button class="cc-tab sel" data-tab="standard">STANDARD MATCH</button><button class="cc-tab" data-tab="rogue">ROGUE RUN</button><button class="cc-tab" data-tab="training">TRAINING RANGE</button></div>
        <div class="standard-panel">
          <div class="cc-sec">Battle Type</div><div class="cc-opts modeopts">${Object.entries(MODES).filter(([k])=>k!=="training").map(([k,m])=>`<button class="cc-opt ${k==="ffa"?"sel":""}" data-mode="${k}"><b>${m.label}</b><span>${m.description}</span></button>`).join("")}</div>
          <div class="cc-sec">Arena</div><div class="cc-opts cc-arenas arenaopts">${ARENAS.map((a,i)=>`<button class="cc-opt ${i===0?"sel":""}" data-arena="${i}"><b>${a.name}</b><span>Wind ${a.wind.toFixed(2)}× · Gravity ${(a.gravity||1).toFixed(2)}×</span></button>`).join("")}</div>
          <div class="cc-sec">Bot Difficulty</div><div class="cc-opts diffopts">${Object.entries(DIFFICULTIES).map(([k,d])=>`<button class="cc-opt ${k==="normal"?"sel":""}" data-d="${k}"><b>${d.label}</b><span>${k==="easy"?"More forgiving ballistic calculations.":k==="hard"?"Tight aim and stronger tactical positioning.":"Balanced artillery opponents."}</span></button>`).join("")}</div>
          <div class="cc-sec">Match Settings</div>
          <div class="cc-setting-grid">
            <div class="cc-setting"><label>Tanks</label><select data-set="playerCount"><option>2</option><option selected>4</option><option>6</option><option>8</option></select></div>
            <div class="cc-setting"><label>HP</label><select data-set="hp"><option selected>100</option><option>150</option><option>200</option><option>300</option></select></div>
            <div class="cc-setting"><label>Turn Time</label><select data-set="turnTime"><option>15</option><option selected>30</option><option>45</option><option>60</option></select></div>
            <div class="cc-setting"><label>Fuel / Turn</label><select data-set="fuel"><option>70</option><option selected>100</option><option>140</option><option value="9999">Unlimited</option></select></div>
            <div class="cc-setting"><label>Starting Weapons</label><select data-set="weaponCount"><option>8</option><option selected>12</option><option>16</option><option>20</option></select></div>
            <div class="cc-setting"><label>Wind</label><select data-set="wind"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="extreme">Extreme</option></select></div>
            <div class="cc-setting"><label>Trick Objects</label><select data-set="skillObjects"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select></div>
            <div class="cc-setting"><label>Airdrops</label><select data-set="crates"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select></div>
            <div class="cc-setting"><label>Shot Tracer</label><select data-set="tracer"><option value="true" selected>On</option><option value="false">Off</option></select></div>
          </div>
          <div class="cc-note"><b>Weapon quality:</b> all weapon families and every tier they actually own are available immediately. Standard rolls favor early tiers (60% T1 / 25% T2 / 11% T3 / 4% T4 before family caps). Airdrops are premium loot (12% / 30% / 38% / 20%) and are the best source of Apex T4 weapons. Some families stop at T2 or T3, while signature lines mutate into a distinct T4.</div>
          <button class="cc-start start-standard">START MATCH</button>
        </div>
        <div class="rogue-panel" style="display:none">
          <div class="cc-rogue-card">
            <div class="cc-k">Run-Based Progression · No Permanent Save</div><h2>CRATER RUN</h2>
            <div class="cc-desc">Start with a basic tank, Tier-I technology and a small arsenal. Victories award Salvage based on stage and performance. Between battles, spend it freely across skill trees, weapon-tech unlocks and utility upgrades. Every fifth battle is an elite spike; lose once and the run ends.</div>
            <div class="cc-rogue-loop"><div><b>1 · Fight</b>Random arena, movement, trick objects and premium airdrops.</div><div><b>2 · Salvage</b>Victory awards spendable run currency.</div><div><b>3 · Shop</b>Buy several upgrades or save currency for expensive tech.</div><div><b>4 · Escalate</b>Bots scale forever; elite fights arrive every fifth stage.</div></div>
            <button class="cc-start start-rogue">START NEW RUN</button>
          </div>
        </div>
        <div class="training-panel" style="display:none">
          <div class="cc-rogue-card" style="background:linear-gradient(135deg,#102b32,#1d1837)">
            <div class="cc-k">Weapon Laboratory · No Enemy Turns</div><h2>TRAINING RANGE</h2>
            <div class="cc-desc">Test every weapon family and every valid tier with infinite ammo. Four reinforced dummies reset after every shot, damage summaries stay enabled, movement has unlimited fuel, and <b>R</b> rebuilds the terrain and resets all targets whenever the range gets too cratered.</div>
            <div class="cc-sec">Training Arena</div>
            <div class="cc-setting" style="max-width:320px"><label>Arena</label><select class="training-arena">${ARENAS.map((a,i)=>`<option value="${i}">${a.name}</option>`).join("")}</select></div>
            <div class="cc-note"><b>Arsenal:</b> all valid T1–T4 variants are loaded with infinite ammo. Q/E cycles the full range. No bots fire back and dummies are restored after each completed weapon sequence.</div>
            <button class="cc-start start-training">ENTER TRAINING RANGE</button>
          </div>
        </div>
      </div></div>
      <div class="cc-overlay end hide"><div class="cc-menu"><div class="cc-k">Match Complete</div><div class="cc-title result-title">VICTORY</div><div class="cc-desc result-desc"></div><div class="cc-result-grid"><div><span>Winner</span><b class="rw"></b></div><div><span>Rounds</span><b class="rr"></b></div><div><span>Damage</span><b class="rd"></b></div><div><span>Kills</span><b class="rk"></b></div></div><button class="cc-start restart">BACK TO MENU</button></div></div>
      <div class="cc-overlay upgrade hide"><div class="cc-menu">
        <div class="cc-k upgrade-k">Rogue Salvage Bay</div><div class="cc-title" style="font-size:3.35rem">UPGRADE<br>SHOP</div>
        <div class="cc-desc upgrade-desc"></div><div class="cc-shop-head"><div><b>Spend now or bank Salvage for expensive tech.</b><div class="cc-run-stats"></div></div><div class="cc-currency"><small>Available Salvage</small><span class="shop-money">0</span> ◇</div></div>
        <div class="cc-shop-layout"><div class="cc-trees"></div><aside class="cc-unique-shop"><h3>Run Technology & Utility</h3><div class="cc-unique-list"></div></aside></div>
        <button class="cc-start cc-next">CONTINUE TO NEXT BATTLE</button>
      </div></div>
    `;
    container.append(style,root);

    const canvas=root.querySelector("canvas"),ctx=canvas.getContext("2d"),weaponsEl=root.querySelector(".cc-weapons"),infoEl=root.querySelector(".cc-info");
    const angleInput=root.querySelector(".angle"),powerInput=root.querySelector(".power"),fireBtn=root.querySelector(".cc-fire"),menu=root.querySelector(".menu"),end=root.querySelector(".end"),upgrade=root.querySelector(".upgrade");
    const angleV=root.querySelector(".angle-v"),powerV=root.querySelector(".power-v"),fuelBar=root.querySelector(".cc-fuel>div"),fuelText=root.querySelector(".cc-fueltext");

    function resize(){
      const r=root.getBoundingClientRect();
      root.classList.toggle("cc-compact",r.width<1180||r.height<760);
      root.classList.toggle("cc-short",r.height<640);
      W=Math.max(560,r.width);H=Math.max(420,r.height);dpr=Math.min(2,devicePixelRatio||1);
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();const ro=new ResizeObserver(resize);ro.observe(root);
    const playerTank=()=>state?.tanks?.[0]||null;
    const playerTurn=()=>running&&state&&!state.gameOver&&currentTank(state)?.isPlayer&&state.phase==="aim";

    function syncAimUI(){
      if(!state)return;const p=playerTank(),deg=state.playerAngle*180/Math.PI;
      angleInput.value=deg.toFixed(0);powerInput.value=state.playerPower;angleV.textContent=Math.round(deg)+"°";powerV.textContent=Math.round(state.playerPower);fireBtn.disabled=!playerTurn();
      if(p){const pct=p.maxFuel>9000?100:clamp(p.fuel/p.maxFuel*100,0,100);fuelBar.style.width=pct+"%";fuelText.textContent=`FUEL ${p.maxFuel>9000?"∞":Math.ceil(p.fuel)} / ${p.maxFuel>9000?"∞":Math.round(p.maxFuel)}`;}
    }
    function setAngleFromDegrees(deg){if(!state)return;state.playerAngle=deg*Math.PI/180;const t=playerTank();if(t)t.angle=state.playerAngle;syncAimUI();}

    function renderWeapons(){
      if(!state)return;const p=playerTank();
      lastInventorySig=p.inventory.map(x=>`${x.id}:${x.tier}:${x.ammo}`).join("|");
      weaponsEl.innerHTML=p.inventory.map(slot=>{const d=getWeaponTierStats(slot.id,slot.tier);return `<button class="cc-weapon t${slot.tier} ${p.selected===slot.id&&p.selectedTier===slot.tier?"on":""} ${slot.ammo<=0?"empty":""}" data-id="${slot.id}" data-tier="${slot.tier}"><span class="cc-ammo">${slot.ammo>=99?"∞":"×"+slot.ammo}</span><div class="cc-wicon" style="color:${d.color}">${d.icon}</div><div class="cc-wname">${d.name}</div><div class="cc-wcat">${d.category}</div><span class="cc-tier">T${slot.tier}</span></button>`;}).join("");
      weaponsEl.querySelectorAll(".cc-weapon").forEach(btn=>{
        btn.onclick=()=>{if(playerTurn()&&selectWeapon(state,p,btn.dataset.id,Number(btn.dataset.tier))){renderWeapons();renderInfo();}};
        btn.onmouseenter=()=>{const d=getWeaponTierStats(btn.dataset.id,Number(btn.dataset.tier));infoEl.innerHTML=`<h3 style="color:${d.color}">${d.icon} ${d.name} · T${d.tier}/${d.maxTier}</h3><p>${d.description}<br><br><b>${d.tierName}</b> · ${d.damage!=null?`Damage ${Math.round(d.damage)}`:"Utility"}${d.radius?` · Radius ${Math.round(d.radius)}`:""}</p>`;};
      });
    }
    function renderInfo(){
      if(!state)return;const p=playerTank(),d=getWeaponTierStats(p.selected,p.selectedTier||1);
      infoEl.innerHTML=`<h3 style="color:${d.color}">${d.icon} ${d.name} · T${d.tier}/${d.maxTier}</h3><p>${d.description}<br><b>${d.tierName}</b> · ${d.tierNote||"Functional upgrade"}${d.fragments?` · ${d.fragments} fragments`:d.bombs?` · ${d.bombs} strikes`:d.bounces?` · ${d.bounces} bounces`:""}</p><div class="cc-charge"><div style="width:${p.overcharge}%"></div></div><p>${p.overchargeReady?"OVERCHARGE READY · +28% damage":"Overcharge "+Math.round(p.overcharge)+"% · Crit "+Math.round((p.critChance||0)*100)+"%"}</p>`;
    }
    function firePlayer(){if(!playerTurn())return;const p=playerTank();if(fire(state,p,state.playerAngle,state.playerPower,p.selected,p.selectedTier)){renderWeapons();syncAimUI();renderInfo();}}
    angleInput.oninput=()=>setAngleFromDegrees(Number(angleInput.value));
    powerInput.oninput=()=>{if(!state)return;state.playerPower=Number(powerInput.value);const p=playerTank();if(p)p.power=state.playerPower;syncAimUI();};
    fireBtn.onclick=firePlayer;

    function cycleWeapon(dir){if(!playerTurn())return;const p=playerTank(),usable=p.inventory.filter(s=>s.ammo>0);if(!usable.length)return;let i=usable.findIndex(s=>s.id===p.selected&&s.tier===p.selectedTier);i=(i+dir+usable.length)%usable.length;selectWeapon(state,p,usable[i].id,usable[i].tier);renderWeapons();renderInfo();}
    function keyDown(e){
      if(!state||!running)return;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code))e.preventDefault();
      if(e.code==="Space"){firePlayer();return;}if((e.key==="r"||e.key==="R")&&state.training){resetTrainingRange(state);renderWeapons();renderInfo();syncAimUI();return;}if(!playerTurn())return;
      if(e.key==="a"||e.key==="A")moveKeys.left=true;if(e.key==="d"||e.key==="D")moveKeys.right=true;
      if(e.key==="ArrowLeft")state.playerAngle=clamp(state.playerAngle+.025,.08,Math.PI-.08);if(e.key==="ArrowRight")state.playerAngle=clamp(state.playerAngle-.025,.08,Math.PI-.08);
      if(e.key==="ArrowUp")state.playerPower=clamp(state.playerPower+2,10,100);if(e.key==="ArrowDown")state.playerPower=clamp(state.playerPower-2,10,100);
      if(e.key==="q"||e.key==="Q")cycleWeapon(-1);if(e.key==="e"||e.key==="E")cycleWeapon(1);
      const p=playerTank();p.angle=state.playerAngle;p.power=state.playerPower;syncAimUI();
    }
    function keyUp(e){if(e.key==="a"||e.key==="A")moveKeys.left=false;if(e.key==="d"||e.key==="D")moveKeys.right=false;}
    window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);

    canvas.addEventListener("mousemove",e=>{if(!playerTurn())return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*state.width/r.width,my=(e.clientY-r.top)*state.height/r.height,p=playerTank();const ang=Math.atan2(p.y-my,mx-p.x);if(ang>0&&ang<Math.PI){state.playerAngle=ang;state.playerPower=clamp((Math.hypot(mx-p.x,my-p.y)-35)/3.2,10,100);p.angle=ang;p.power=state.playerPower;syncAimUI();}});
    canvas.addEventListener("click",()=>{if(playerTurn())firePlayer();});

    function startMatch(opts){
      state=createState({width:W,height:H,...opts});running=true;lastTurnId=null;lastInventorySig="";menu.classList.add("hide");end.classList.add("hide");upgrade.classList.add("hide");syncAimUI();renderWeapons();renderInfo();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
    }
    function startStandard(){rogueRun=null;startMatch({mode,difficulty,arenaIndex,settings:{...settings}});}
    function startTraining(){
      rogueRun=null;startMatch({mode:"training",difficulty:"easy",arenaIndex:trainingArena,settings:{playerCount:5,hp:500,turnTime:9999,wind:"off",fuel:9999,weaponCount:20,skillObjects:"off",crates:"off",tracer:true}});
    }
    function startNewRogue(){rogueRun=createRogueRun();startRogueBattle();}
    function startRogueBattle(){
      const stage=rogueRun.stage,arena=(stage-1)%ARENAS.length;
      startMatch({mode:"duel",difficulty:"normal",arenaIndex:arena,rogueRun,settings:{playerCount:2,hp:100,turnTime:30,wind:stage>=7?"extreme":"normal",fuel:rogueRun.stats.maxFuel,weaponCount:rogueRun.stats.weaponCount,skillObjects:stage>=4?"high":"normal",crates:"high",tracer:true}});
    }

    function loop(now){
      if(destroyed||!state)return;const dt=Math.min(.033,(now-last)/1000);last=now;const t=currentTank(state);
      if(playerTurn()){
        const p=playerTank(),dir=(moveKeys.right?1:0)-(moveKeys.left?1:0);if(dir)moveTank(state,p,dir,dt*70);
      }
      if(t&&!t.isPlayer&&state.phase==="aim"){botThinkDelay-=dt;if(botThinkDelay<=0){botThinkDelay=.65+Math.random()*.55;performBotShot(state,t);}}else botThinkDelay=.7;
      updateState(state,dt);render(ctx,state,state.width,state.height);
      const nowTurn=currentTank(state)?.id;if(nowTurn!==lastTurnId){lastTurnId=nowTurn;renderWeapons();renderInfo();}
      if(playerTurn())syncAimUI();
      const pp=playerTank();if(pp){const sig=pp.inventory.map(x=>`${x.id}:${x.tier}:${x.ammo}`).join("|");if(sig!==lastInventorySig)renderWeapons();}
      if(Math.floor(now/260)%2===0)renderInfo();
      if(state.gameOver&&running){finish();return;}raf=requestAnimationFrame(loop);
    }

    function playerWon(){return state.mode==="teams"?state.winner==="Team 1":state.winner==="YOU";}
    function finish(){
      if(state?.training)return;
      running=false;moveKeys.left=moveKeys.right=false;const p=playerTank(),won=playerWon();
      services?.highscores?.saveHighscore?.("crater-clash",Math.round(p.damage*8+p.kills*500+(won?2500:0)+(rogueRun?rogueRun.stage*850:0)));
      if(rogueRun){
        if(won){
          rogueRun.wins++;
          const earned=rewardRogueVictory(rogueRun,{damage:p.damage,rounds:state.round});
          rogueRun.history.push({stage:rogueRun.stage,damage:Math.round(p.damage),rounds:state.round,salvage:earned});
          showRogueShop(earned);
        }else showRogueGameOver();
        return;
      }
      end.classList.remove("hide");end.querySelector(".result-title").textContent=won?"VICTORY":"DEFEAT";end.querySelector(".result-desc").textContent=won?"You controlled movement, terrain and trick-shot geometry better than the opposition.":"The crater field belongs to someone else this time. Reposition, use the tracer and save high-tier weapons for better opportunities.";end.querySelector(".rw").textContent=state.winner;end.querySelector(".rr").textContent=state.round;end.querySelector(".rd").textContent=Math.round(p.damage);end.querySelector(".rk").textContent=p.kills;
    }
    function runStatsHtml(){const q=rogueRun.stats;return `<span>Stage ${rogueRun.stage}</span><span>${q.maxHp} HP</span><span>${q.maxFuel} Fuel</span><span>${Math.round(q.critChance*1000)/10}% Crit ×${q.critMultiplier.toFixed(2)}</span><span>${Math.round(q.luck*100)} Luck</span><span>${q.startArmor} Armor</span><span>${Math.round((q.damageBonus-1)*100)}% Damage+</span><span>Tech T${q.maxTier}</span><span>Pool ${q.weaponPoolLevel}/3</span><span>${q.weaponCount} Weapons</span>`;}
    function shopNodeHtml(n){
      const maxed=Number.isFinite(n.max)&&n.rank>=n.max;
      const disabled=!n.available||!n.affordable||maxed;
      const rankText=maxed?`MAX ${n.rank}/${n.max}`:n.repeatable?`Rank ${n.rank} · repeatable`:`Rank ${n.rank}/${Number.isFinite(n.max)?n.max:"∞"}`;
      const lock=!n.available&&!maxed?" · LOCKED":"";
      return `<button class="cc-shop-item ${maxed?"maxed":""}" data-buy="${n.id}" ${disabled?"disabled":""}><span class="cost">${maxed?"MAX":n.cost+" ◇"}</span><b>${n.name}</b><p>${n.description}</p><div class="rank">${rankText}${lock}</div></button>`;
    }
    function renderRogueShop(){
      const catalog=getRogueShopCatalog(rogueRun);
      upgrade.querySelector(".shop-money").textContent=rogueRun.currency;
      upgrade.querySelector(".cc-run-stats").innerHTML=runStatsHtml();
      upgrade.querySelector(".cc-trees").innerHTML=catalog.trees.map(tree=>`<section class="cc-tree" style="border-color:${tree.color}33"><div class="cc-tree-title"><span class="ico" style="color:${tree.color}">${tree.icon}</span><div><b>${tree.name}</b><span>${tree.description}</span></div></div><div class="cc-tree-nodes">${tree.nodes.map(shopNodeHtml).join("")}</div></section>`).join("");
      upgrade.querySelector(".cc-unique-list").innerHTML=catalog.items.map(shopNodeHtml).join("");
      upgrade.querySelectorAll("[data-buy]").forEach(btn=>btn.onclick=()=>{const result=buyRogueUpgrade(rogueRun,btn.dataset.buy);if(result.ok)renderRogueShop();});
    }
    function showRogueShop(earned){
      upgrade.classList.remove("hide");
      upgrade.querySelector(".upgrade-k").textContent=`${rogueStageLabel(rogueRun)} CLEARED · +${earned} SALVAGE`;
      upgrade.querySelector(".upgrade-desc").textContent="Buy as many upgrades as your Salvage allows, or save it for Weapon Tech II/III/IV and new arsenal pools. The four main tutors end in repeatable mastery nodes, so every future victory always has somewhere useful to invest.";
      renderRogueShop();
    }
    function showRogueGameOver(){
      end.classList.remove("hide");const p=playerTank(),scale=getRogueEnemyScale(rogueRun);end.querySelector(".result-title").textContent="RUN OVER";end.querySelector(".result-desc").textContent=`You reached battle ${rogueRun.stage} with ${rogueRun.wins} wins. This run used no permanent save: start again and build a different tank.`;end.querySelector(".rw").textContent=`Stage ${rogueRun.stage}`;end.querySelector(".rr").textContent=state.round;end.querySelector(".rd").textContent=Math.round(p.damage);end.querySelector(".rk").textContent=p.kills;
    }

    root.querySelectorAll("[data-tab]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-tab]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");menuMode=btn.dataset.tab;root.querySelector(".standard-panel").style.display=menuMode==="standard"?"block":"none";root.querySelector(".rogue-panel").style.display=menuMode==="rogue"?"block":"none";root.querySelector(".training-panel").style.display=menuMode==="training"?"block":"none";});
    root.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");mode=btn.dataset.mode;});
    root.querySelectorAll("[data-arena]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-arena]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");arenaIndex=Number(btn.dataset.arena);});
    root.querySelectorAll("[data-d]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-d]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");difficulty=btn.dataset.d;});
    root.querySelectorAll("[data-set]").forEach(sel=>sel.onchange=()=>{const k=sel.dataset.set,v=sel.value;settings[k]=["playerCount","hp","turnTime","fuel","weaponCount"].includes(k)?Number(v):k==="tracer"?v==="true":v;});
    upgrade.querySelector(".cc-next").onclick=()=>{if(!rogueRun)return;rogueRun.stage++;upgrade.classList.add("hide");startRogueBattle();};
    root.querySelector(".training-arena").onchange=e=>trainingArena=Number(e.target.value)||0;
    root.querySelector(".start-standard").onclick=startStandard;root.querySelector(".start-rogue").onclick=startNewRogue;root.querySelector(".start-training").onclick=startTraining;root.querySelector(".restart").onclick=()=>{end.classList.add("hide");menu.classList.remove("hide");rogueRun=null;};

    return {destroy:()=>{destroyed=true;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);style.remove();}};
  }
};
