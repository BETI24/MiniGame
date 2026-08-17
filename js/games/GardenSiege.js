import { PLANTS, DIFFICULTIES, CAMPAIGN_LEVELS } from "./GardenSiegeData.js";
import {
  createGameState, updateGame, worldToCell, plantAt, placePlant, removePlant,
  collectOrb, activateOvergrowth, upgradePlant, getPlantUpgradeCost, clamp
} from "./GardenSiegeEngine.js";
import { computeBounds, renderGame } from "./GardenSiegeRender.js";

export default {
  manifest:{
    id:"garden-siege",
    name:"Garden Siege",
    description:"Lane-defense strategy with living plants, undead invaders, weather shifts, upgrades and overgrowth powers.",
    icon:"🌻",
    tags:["Strategy","Tower Defense","Plants","Singleplayer"]
  },

  init:(container,services)=>{
    let destroyed=false;
    let running=false;
    let state=null;
    let W=1,H=1,dpr=1,bounds=null,raf=0,last=performance.now();
    let mouse={x:0,y:0,cell:null};
    let levelIndex=0,difficulty="normal",endless=false;
    let selectedUpgradePlant=null;

    const style=document.createElement("style");
    style.textContent=`
      .gs{position:relative;width:100%;height:100%;min-height:680px;overflow:hidden;background:#5e9440;color:#eef3ef;font-family:Inter,system-ui,sans-serif;user-select:none}
      .gs *{box-sizing:border-box}.gs canvas{width:100%;height:100%;display:block;cursor:default}
      .gs-toolbar{
        position:absolute;z-index:10;left:14px;right:14px;top:92px;display:flex;gap:7px;align-items:stretch;
        pointer-events:none
      }
      .gs-card{
        position:relative;width:98px;min-height:73px;padding:7px 7px 6px;border:2px solid #1d281e;border-radius:9px;
        background:#efe6c9;color:#263326;box-shadow:0 5px 10px #0003;pointer-events:auto;cursor:pointer;overflow:hidden
      }
      .gs-card.locked{filter:grayscale(1);opacity:.38;cursor:not-allowed}
      .gs-card.sel{border-color:#fff;box-shadow:0 0 0 3px #f9e57b,0 6px 12px #0004}
      .gs-card.cool{cursor:not-allowed}
      .gs-card-icon{font-size:1.25rem;font-weight:1000}.gs-card-name{font-size:.61rem;font-weight:950;margin-top:2px}
      .gs-card-cost{font-size:.57rem;font-weight:900;color:#6d5a22;margin-top:3px}
      .gs-cool{
        position:absolute;inset:auto 0 0;height:0;background:rgba(35,42,36,.58);pointer-events:none
      }
      .gs-tool{
        min-width:78px;padding:7px;border:2px solid #1d281e;border-radius:9px;background:#e4dac0;color:#283427;
        pointer-events:auto;cursor:pointer;font-size:.65rem;font-weight:950
      }
      .gs-tool.on{background:#ef8e73}
      .gs-tool.grow{background:#79d9a0}.gs-tool.grow.ready{box-shadow:0 0 0 3px #dfffb5,0 0 22px #9cffaa}
      .gs-panel{
        position:absolute;z-index:13;right:14px;bottom:14px;width:250px;padding:12px;border-radius:12px;
        background:#142018e8;border:1px solid #ffffff16;display:none
      }
      .gs-panel.show{display:block}
      .gs-panel h3{margin:0 0 5px}.gs-panel p{margin:0;color:#95a398;font-size:.66rem;line-height:1.4}
      .gs-panel button{width:100%;margin-top:10px;padding:9px;border:0;border-radius:8px;background:#70c98a;color:#132018;font:inherit;font-size:.7rem;font-weight:950;cursor:pointer}
      .gs-overlay{
        position:absolute;z-index:30;inset:0;display:flex;align-items:center;justify-content:center;padding:22px;
        background:#07100bc9;backdrop-filter:blur(8px)
      }
      .gs-overlay.hide{display:none}
      .gs-menu{width:min(900px,100%);padding:28px;border-radius:18px;background:linear-gradient(#1c2b22,#101912);border:1px solid #ffffff18;box-shadow:0 30px 100px #0008}
      .gs-k{font-size:.65rem;font-weight:950;letter-spacing:.13em;text-transform:uppercase;color:#7ed59a}
      .gs-title{font-size:clamp(2.6rem,6vw,5rem);line-height:.92;font-weight:1000;letter-spacing:-.055em;margin:7px 0}
      .gs-desc{max-width:760px;color:#9bac9f;line-height:1.55;font-size:.82rem}
      .gs-sec{margin:18px 0 7px;font-size:.65rem;color:#cfd9d1;font-weight:900;text-transform:uppercase}
      .gs-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .gs-option{padding:12px;border-radius:10px;border:1px solid #ffffff13;background:#ffffff06;color:#edf2ee;text-align:left;cursor:pointer}
      .gs-option.sel{border-color:#72d291;background:#72d29118}.gs-option b{display:block;font-size:.79rem}.gs-option span{display:block;margin-top:3px;color:#809186;font-size:.62rem;line-height:1.35}
      .gs-levels{grid-template-columns:repeat(4,1fr)}
      .gs-start{width:100%;margin-top:19px;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#6ed18d,#b9de69);color:#102015;font:inherit;font-weight:1000;cursor:pointer}
      .gs-endstats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:17px 0}
      .gs-endstats div{padding:11px;text-align:center;background:#ffffff07;border-radius:9px}.gs-endstats span{display:block;color:#819187;font-size:.55rem;text-transform:uppercase}.gs-endstats b{display:block;margin-top:3px}
      @media(max-width:900px){.gs-card{width:78px}.gs-toolbar{overflow-x:auto}.gs-levels{grid-template-columns:1fr 1fr}.gs-options{grid-template-columns:1fr}.gs-panel{width:210px}}
    `;

    const root=document.createElement("div");root.className="gs";
    root.innerHTML=`
      <canvas></canvas>
      <div class="gs-toolbar"></div>
      <div class="gs-panel"></div>
      <div class="gs-overlay menu">
        <div class="gs-menu">
          <div class="gs-k">Original browser lane-defense</div>
          <div class="gs-title">Garden Siege</div>
          <div class="gs-desc">
            Build a living defense across five lanes, generate energy, evolve plants, survive weather shifts
            and stop increasingly dangerous undead invaders. Inspired by classic lane-defense games, with original visuals and mechanics.
          </div>
          <div class="gs-sec">Mode</div>
          <div class="gs-options modeopts">
            <button class="gs-option sel" data-mode="campaign"><b>Campaign</b><span>Four increasingly complex gardens with final bosses.</span></button>
            <button class="gs-option" data-mode="endless"><b>Endless</b><span>Infinite scaling waves and a boss every 10 rounds.</span></button>
          </div>
          <div class="gs-sec">Campaign Level</div>
          <div class="gs-options gs-levels levelopts">
            ${CAMPAIGN_LEVELS.map((l,i)=>`<button class="gs-option ${i===0?"sel":""}" data-level="${i}"><b>${i+1}. ${l.name}</b><span>${l.description}</span></button>`).join("")}
          </div>
          <div class="gs-sec">Difficulty</div>
          <div class="gs-options diffopts">
            ${Object.entries(DIFFICULTIES).map(([k,d])=>`<button class="gs-option ${k==="normal"?"sel":""}" data-d="${k}"><b>${d.label}</b><span>${k==="easy"?"More starting energy and gentler waves.":k==="hard"?"Tougher, faster and denser invasions.":"Balanced garden defense."}</span></button>`).join("")}
          </div>
          <button class="gs-start">Start Garden</button>
        </div>
      </div>
      <div class="gs-overlay end hide"><div class="gs-menu">
        <div class="gs-k result-k">Battle Result</div>
        <div class="gs-title result-title">Garden Defended!</div>
        <div class="gs-desc result-desc"></div>
        <div class="gs-endstats">
          <div><span>Score</span><b class="escore">0</b></div>
          <div><span>Wave</span><b class="ewave">0</b></div>
          <div><span>Kills</span><b class="ekills">0</b></div>
          <div><span>Best Combo</span><b class="ecombo">0</b></div>
        </div>
        <button class="gs-start restart">Play Again</button>
      </div></div>
    `;
    container.append(style,root);

    const canvas=root.querySelector("canvas"),ctx=canvas.getContext("2d");
    const toolbar=root.querySelector(".gs-toolbar");
    const panel=root.querySelector(".gs-panel");
    const menu=root.querySelector(".menu");
    const end=root.querySelector(".end");

    function resize(){
      const r=root.getBoundingClientRect();
      W=r.width;H=r.height;dpr=Math.min(2,devicePixelRatio||1);
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
      canvas.style.width=W+"px";canvas.style.height=H+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      bounds=computeBounds(W,H);
    }
    resize();
    const ro=new ResizeObserver(resize);ro.observe(root);

    function unlockedPlantIds(){
      if(endless)return Object.keys(PLANTS);
      return CAMPAIGN_LEVELS[levelIndex].unlocked;
    }

    function renderToolbar(){
      if(!state)return;
      const unlocked=new Set(unlockedPlantIds());
      toolbar.innerHTML=`
        ${Object.values(PLANTS).map(p=>{
          const locked=!unlocked.has(p.id);
          const cool=state.cardCooldowns[p.id];
          return `<button class="gs-card ${locked?"locked":""} ${state.selectedPlant===p.id?"sel":""} ${cool>0?"cool":""}" data-plant="${p.id}" ${locked?"disabled":""}>
            <div class="gs-card-icon">${p.icon}</div>
            <div class="gs-card-name">${p.name}</div>
            <div class="gs-card-cost">☀ ${p.cost}</div>
            <div class="gs-cool" style="height:${cool>0?Math.min(100,cool/p.cooldown*100):0}%"></div>
          </button>`;
        }).join("")}
        <button class="gs-tool shovel ${state.shovel?"on":""}">🛠 Shovel</button>
        <button class="gs-tool grow ${state.overgrowth>=state.maxOvergrowth?"ready":""}">🌿 Power</button>
        <button class="gs-tool pause">${state.paused?"▶ Resume":"Ⅱ Pause"}</button>
      `;
      toolbar.querySelectorAll("[data-plant]").forEach(btn=>{
        btn.onclick=()=>{
          const id=btn.dataset.plant;
          if(state.cardCooldowns[id]>0)return;
          state.selectedPlant=state.selectedPlant===id?null:id;
          state.shovel=false;
          selectedUpgradePlant=null;panel.classList.remove("show");
          renderToolbar();
        };
        btn.onmouseenter=()=>{
          const p=PLANTS[btn.dataset.plant];
          panel.innerHTML=`<h3>${p.name}</h3><p>${p.description}<br><br><b>Cost:</b> ${p.cost} energy · <b>Cooldown:</b> ${p.cooldown}s · <b>Role:</b> ${p.role}</p>`;
          panel.classList.add("show");
        };
        btn.onmouseleave=()=>{ if(!selectedUpgradePlant)panel.classList.remove("show"); };
      });
      toolbar.querySelector(".shovel").onclick=()=>{
        state.shovel=!state.shovel;state.selectedPlant=null;selectedUpgradePlant=null;panel.classList.remove("show");renderToolbar();
      };
      toolbar.querySelector(".grow").onclick=()=>{if(activateOvergrowth(state))renderToolbar();};
      toolbar.querySelector(".pause").onclick=()=>{state.paused=!state.paused;renderToolbar();};
    }

    function showPlantPanel(p){
      selectedUpgradePlant=p;
      const def=PLANTS[p.type];
      const cost=getPlantUpgradeCost(p);
      panel.innerHTML=`
        <h3>${def.name} · Lv.${p.level}</h3>
        <p>${def.description}<br><br>HP ${Math.ceil(p.hp)} / ${p.maxHp} · Kills ${p.kills}</p>
        ${cost?`<button class="upgrade">Evolve · ☀ ${cost}</button>`:`<button disabled>Max Level</button>`}
      `;
      panel.classList.add("show");
      const btn=panel.querySelector(".upgrade");
      if(btn)btn.onclick=()=>{
        const res=upgradePlant(state,p);
        if(res.ok)showPlantPanel(p);
      };
    }

    function canvasPoint(e){
      const r=canvas.getBoundingClientRect();
      return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
    }

    canvas.addEventListener("mousemove",e=>{
      const p=canvasPoint(e);mouse.x=p.x;mouse.y=p.y;mouse.cell=worldToCell(bounds,p.x,p.y);
    });
    canvas.addEventListener("mouseleave",()=>mouse.cell=null);
    canvas.addEventListener("contextmenu",e=>{
      e.preventDefault();
      if(!running||!state)return;
      const p=canvasPoint(e),cell=worldToCell(bounds,p.x,p.y);
      if(cell)removePlant(state,cell.row,cell.col);
    });
    canvas.addEventListener("click",e=>{
      if(!running||!state||state.gameOver||state.won)return;
      const p=canvasPoint(e);

      for(const orb of state.orbs){
        if(orb.alive&&orb.screenX!=null&&Math.hypot(p.x-orb.screenX,p.y-orb.screenY)<28){
          collectOrb(state,orb);renderToolbar();return;
        }
      }

      const cell=worldToCell(bounds,p.x,p.y);
      if(!cell)return;

      const existing=plantAt(state,cell.row,cell.col);
      if(state.shovel){
        if(existing)removePlant(state,cell.row,cell.col);
        return;
      }
      if(state.selectedPlant){
        const res=placePlant(state,state.selectedPlant,cell.row,cell.col);
        if(res.ok){
          state.selectedPlant=null;
          renderToolbar();
        }else{
          state.message=res.reason;state.messageTimer=1.2;
        }
        return;
      }
      if(existing)showPlantPanel(existing);
      else{selectedUpgradePlant=null;panel.classList.remove("show");}
    });

    function startGame(){
      state=createGameState({difficulty,levelIndex,endless});
      running=true;
      menu.classList.add("hide");end.classList.add("hide");
      panel.classList.remove("show");selectedUpgradePlant=null;
      renderToolbar();
      last=performance.now();
      cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
    }

    function finishGame(){
      if(!state)return;
      running=false;
      end.classList.remove("hide");
      end.querySelector(".result-title").textContent=state.won?"Garden Defended!":"Garden Overrun";
      end.querySelector(".result-desc").textContent=state.won
        ?"The final wave collapsed. Your garden survives another night."
        :"The invaders broke through the last lane. Rebuild, adjust your economy and try again.";
      end.querySelector(".escore").textContent=state.score.toLocaleString();
      end.querySelector(".ewave").textContent=state.wave;
      end.querySelector(".ekills").textContent=state.kills;
      end.querySelector(".ecombo").textContent="×"+Math.max(1,state.bestCombo);
      if(services?.highscores?.saveHighscore){
        services.highscores.saveHighscore("garden-siege",state.score);
      }
    }

    function loop(now){
      if(destroyed||!state)return;
      const dt=Math.min(.033,(now-last)/1000);last=now;
      if(!state.paused)updateGame(state,dt,bounds);
      renderGame(ctx,state,bounds,W,H,mouse.cell);
      if(Math.floor(now/150)%2===0)renderToolbar();
      if((state.gameOver||state.won)&&running){finishGame();return;}
      raf=requestAnimationFrame(loop);
    }

    root.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{
      root.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));
      btn.classList.add("sel");
      endless=btn.dataset.mode==="endless";
      root.querySelector(".levelopts").style.opacity=endless?".35":"1";
      root.querySelector(".levelopts").style.pointerEvents=endless?"none":"auto";
    });
    root.querySelectorAll("[data-level]").forEach(btn=>btn.onclick=()=>{
      root.querySelectorAll("[data-level]").forEach(x=>x.classList.remove("sel"));
      btn.classList.add("sel");levelIndex=Number(btn.dataset.level);
    });
    root.querySelectorAll("[data-d]").forEach(btn=>btn.onclick=()=>{
      root.querySelectorAll("[data-d]").forEach(x=>x.classList.remove("sel"));
      btn.classList.add("sel");difficulty=btn.dataset.d;
    });
    root.querySelector(".menu .gs-start").onclick=startGame;
    root.querySelector(".restart").onclick=()=>{end.classList.add("hide");menu.classList.remove("hide");};

    return {
      destroy:()=>{
        destroyed=true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        style.remove();
      }
    };
  }
};
