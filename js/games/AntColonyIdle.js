import {RESOURCES,LOCATIONS,CHAMBERS,UPGRADES,MILESTONES,PRESTIGE} from "./AntColonyData.js";
import {
  loadState,saveState,applyOffline,update,population,mods,buyUpgrade,buyChamber,previewUpgrade,chamberCost,formatCost,
  locationSummary,boostLocation,prestigeGain,newColony,buyPrestige,fmt
} from "./AntColonyEngine.js";
import {render,locationPos} from "./AntColonyRender.js";

export default {
  manifest:{
    id:"ant-colony-idle",
    name:"Ant Colony Idle",
    description:"Grow a bustling ant colony, expand underground chambers and watch swarms of foragers move between the central nest and surface resources.",
    icon:"🐜",
    tags:["Idle","Incremental","Colony","Simulation"]
  },
  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),saveTimer=0,uiTimer=0,tab="locations",modal=null,hover=null;
    let state=loadState();
    const offline=applyOffline(state,Date.now());

    const style=document.createElement("style");
    style.textContent=`
      .ac{position:relative;width:100%;height:100%;min-height:600px;overflow:hidden;background:#314d35;color:#edf2e6;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;user-select:none}
      .ac *{box-sizing:border-box}.ac button{font:inherit}
      .ac-top{position:absolute;z-index:10;left:0;right:0;top:0;height:78px;display:grid;grid-template-columns:220px 1fr 390px;gap:10px;align-items:center;padding:9px 14px;background:#132319ec;border-bottom:1px solid #b2cf8d22;backdrop-filter:blur(8px)}
      .ac-brand{display:flex;align-items:center;gap:9px}.ac-logo{width:42px;height:42px;display:grid;place-items:center;border-radius:10px;background:#6a5237;border:1px solid #e0bd7d38;font-size:1.35rem}.ac-brand b{font-size:.9rem}.ac-brand small{display:block;color:#84967d;font-size:.52rem}
      .ac-pop{text-align:center}.ac-pop strong{font-size:1.05rem}.ac-popbar{height:10px;max-width:370px;margin:5px auto;border-radius:99px;background:#2b3828;overflow:hidden}.ac-popbar div{height:100%;background:linear-gradient(90deg,#cfaf6c,#79b45f)}.ac-pop small{font-size:.52rem;color:#8fa08a}
      .ac-res{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.ac-r{padding:7px 6px;border-radius:7px;background:#1b3020;border:1px solid #ffffff0d;text-align:center;font-size:.57rem;font-weight:950}.ac-r span{margin-right:3px}
      .ac-layout{position:absolute;inset:78px 0 0;display:grid;grid-template-columns:255px minmax(0,1fr) 305px;gap:7px;padding:7px}
      .ac-panel{min-height:0;overflow:hidden;border:1px solid #d8c28b20;border-radius:10px;background:#13231bea;box-shadow:0 10px 30px #0004}.ac-title{height:40px;display:flex;justify-content:space-between;align-items:center;padding:0 10px;background:#1b3022;border-bottom:1px solid #ffffff0d;font-size:.64rem;font-weight:1000;letter-spacing:.05em}
      .ac-upgrades{height:calc(100% - 40px);overflow:auto;padding:6px}.ac-up{padding:8px;margin-bottom:5px;border:1px solid #ffffff0f;border-radius:8px;background:linear-gradient(135deg,#1b3022,#14251b);cursor:pointer}.ac-up:hover:not(.locked){border-color:#a9d6826b}.ac-up.locked{opacity:.28;filter:grayscale(1)}.ac-uhead{display:grid;grid-template-columns:30px 1fr auto;gap:6px;align-items:center}.ac-up .ico{font-size:1.08rem}.ac-up b{font-size:.58rem}.ac-up small{display:block;color:#7f9480;font-size:.48rem;margin-top:2px}.ac-cost{text-align:right;color:#e5c978;font-size:.51rem;font-weight:950}.ac-preview{margin-top:6px;padding:5px 6px;border-radius:6px;background:#0c1911;color:#91a38e;font-size:.50rem;line-height:1.4}.ac-preview strong{color:#fff}.ac-arrow{color:#83df9d;font-weight:1000}
      .ac-center{position:relative;overflow:hidden;border-radius:10px}.ac-center canvas{width:100%;height:100%;display:block;cursor:pointer}.ac-tip{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);padding:7px 10px;border-radius:8px;background:#0d1b13d8;border:1px solid #ffffff0e;color:#a8b7a5;font-size:.52rem;pointer-events:none;white-space:nowrap}
      .ac-tabs{display:flex}.ac-tab{flex:1;height:40px;border:0;background:#14261b;color:#738876;font-size:.56rem;font-weight:950;cursor:pointer}.ac-tab.on{background:#213827;color:#fff}.ac-list{padding:6px;overflow:auto;min-height:0}
      .ac-loc,.ac-ch{padding:9px;margin-bottom:5px;border:1px solid #ffffff0e;border-radius:8px;background:#182b1e;cursor:pointer}.ac-loc.on{border-color:#8bd99c}.ac-loc.locked,.ac-ch.locked{opacity:.28;filter:grayscale(1);cursor:not-allowed}.ac-loc b,.ac-ch b{font-size:.59rem}.ac-loc small,.ac-ch small{display:block;color:#819382;font-size:.49rem;margin-top:3px;line-height:1.35}.ac-rate{margin-top:5px;color:#dfcd8b;font-size:.50rem;font-weight:850}
      .ac-nav{position:absolute;z-index:12;left:275px;right:325px;top:87px;display:flex;justify-content:center;gap:5px;pointer-events:none}.ac-nav button{pointer-events:auto;border:1px solid #ffffff12;background:#14271ce4;color:#a9baa6;border-radius:7px;padding:6px 9px;font-size:.50rem;font-weight:950;cursor:pointer}
      .ac-modal{position:absolute;z-index:30;inset:0;background:#07110bd9;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(6px)}.ac-card{width:min(900px,96%);max-height:90%;overflow:auto;padding:18px;border-radius:13px;background:linear-gradient(#1a2e20,#0d1b13);border:1px solid #d7bd7f35;box-shadow:0 35px 100px #0009}.ac-close{float:right;width:34px;height:34px;border:1px solid #ffffff15;border-radius:7px;background:#26382a;color:#fff;cursor:pointer}.ac-card h2{margin:2px 0 4px}.ac-sub{margin:0 0 14px;color:#829282;font-size:.61rem}.ac-miles{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.ac-mile{padding:10px;border:1px solid #ffffff0e;border-radius:8px;background:#14251a}.ac-mile.done{border-color:#86ca83}.ac-mile b{font-size:.61rem}.ac-mile small{display:block;color:#819180;font-size:.51rem;margin-top:4px}
      .ac-prestige{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.ac-p{padding:11px;border:1px solid #ffffff0e;border-radius:8px;background:#14251a;text-align:center}.ac-p .ico{font-size:1.35rem}.ac-p b{display:block;font-size:.58rem;margin:5px 0}.ac-p p{font-size:.49rem;color:#819080;min-height:43px}.ac-p button,.ac-new{width:100%;padding:8px;border:0;border-radius:6px;background:#6d5938;color:#fff;font-size:.52rem;font-weight:950;cursor:pointer}.ac-new{margin-top:12px;background:linear-gradient(135deg,#e1c56f,#80c574);color:#132016}
      .ac-offline{position:absolute;z-index:50;left:50%;top:88px;transform:translateX(-50%);padding:9px 13px;border-radius:8px;background:#14291cf2;border:1px solid #c9d88f3d;color:#e8f1dc;font-size:.58rem;box-shadow:0 10px 30px #0008}
      @media(max-width:1080px){.ac-top{grid-template-columns:155px 1fr 300px}.ac-layout{grid-template-columns:205px minmax(0,1fr) 235px}.ac-nav{left:220px;right:250px}.ac-preview{font-size:.47rem}.ac-prestige{grid-template-columns:1fr 1fr}}
      @media(max-width:820px){.ac{min-height:520px}.ac-top{height:66px;grid-template-columns:1fr 1.7fr}.ac-brand{display:none}.ac-layout{inset:66px 0 0;grid-template-columns:165px minmax(0,1fr) 185px;padding:4px;gap:4px}.ac-res{gap:2px}.ac-r{padding:5px 3px;font-size:.49rem}.ac-title,.ac-tab{height:33px}.ac-upgrades,.ac-list{padding:4px}.ac-up{padding:5px}.ac-preview{padding:4px}.ac-nav{left:174px;right:194px;top:71px}.ac-miles{grid-template-columns:1fr}.ac-prestige{grid-template-columns:1fr 1fr}}
      @media(max-height:680px){.ac{min-height:480px}.ac-top{height:62px}.ac-layout{inset:62px 0 0}.ac-nav{top:67px}.ac-up{padding:5px;margin-bottom:4px}.ac-preview{margin-top:4px}.ac-tip{display:none}}
    `;

    const root=document.createElement("div");root.className="ac";
    root.innerHTML=`
      <header class="ac-top"><div class="ac-brand"><div class="ac-logo">🐜</div><div><b>FORMICARIUM</b><small>Living Colony Incremental</small></div></div><div class="ac-pop"></div><div class="ac-res"></div></header>
      <div class="ac-layout">
        <section class="ac-panel"><div class="ac-title"><span>COLONY UPGRADES</span><span>exact preview</span></div><div class="ac-upgrades"></div></section>
        <section class="ac-center"><canvas></canvas><div class="ac-tip">Click a resource location to trigger a 12s pheromone surge.</div></section>
        <section class="ac-panel"><div class="ac-tabs"><button class="ac-tab on" data-tab="locations">SURFACE</button><button class="ac-tab" data-tab="chambers">CHAMBERS</button></div><div class="ac-list"></div></section>
      </div>
      <div class="ac-nav"><button data-open="milestones">MILESTONES</button><button data-open="prestige">NEW COLONY</button></div><div class="ac-host"></div>
    `;
    container.append(style,root);

    const canvas=root.querySelector("canvas"),ctx=canvas.getContext("2d"),popEl=root.querySelector(".ac-pop"),resEl=root.querySelector(".ac-res"),upEl=root.querySelector(".ac-upgrades"),listEl=root.querySelector(".ac-list"),host=root.querySelector(".ac-host");
    let W=1,H=1,dpr=1;
    function resize(){const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();

    if(offline.seconds){const d=document.createElement("div");d.className="ac-offline";const gains=Object.entries(offline.res).filter(x=>x[1]>0).map(([k,v])=>`${RESOURCES[k].icon}${fmt(v)}`).join(" · ");d.textContent=`Welcome back · ${Math.floor(offline.seconds/60)}m offline · +${offline.ants} ants · ${gains}`;root.append(d);setTimeout(()=>d.remove(),5200);}

    function renderTop(){
      const p=population(state),m=mods(state),pct=Math.min(100,p/m.popCap*100);
      popEl.innerHTML=`<strong>${p} ANTS · CAP ${Math.floor(m.popCap)}</strong><div class="ac-popbar"><div style="width:${pct}%"></div></div><small>${state.workers} workers · ${state.soldiers} soldiers · ${state.nurses} nurses · ${state.larvae} larvae</small>`;
      resEl.innerHTML=Object.entries(RESOURCES).map(([k,r])=>`<div class="ac-r" style="color:${r.color}"><span>${r.icon}</span>${fmt(state.res[k])}</div>`).join("");
    }
    function renderUpgrades(){
      upEl.innerHTML=UPGRADES.map(u=>{const p=previewUpgrade(state,u.id),locked=population(state)<u.unlockPop;return `<div class="ac-up ${locked?"locked":""}" data-up="${u.id}"><div class="ac-uhead"><div class="ico">${u.icon}</div><div><b>${u.name}</b><small>Lv ${p.lv}${locked?` · unlock ${u.unlockPop} ants`:""}</small></div><div class="ac-cost">${locked?"🔒":formatCost(p.cost)}</div></div><div class="ac-preview"><strong>${p.cur}</strong> <span class="ac-arrow">→ ${p.next}</span><br>${u.desc}</div></div>`;}).join("");
      upEl.querySelectorAll("[data-up]").forEach(el=>el.onclick=()=>{if(buyUpgrade(state,el.dataset.up)){renderAll();saveState(state);}});
    }
    function renderRight(){
      root.querySelectorAll(".ac-tab").forEach(x=>x.classList.toggle("on",x.dataset.tab===tab));
      if(tab==="locations"){
        listEl.innerHTML=LOCATIONS.map(l=>{const locked=population(state)<l.unlockPop,sum=!locked?locationSummary(state,l):null,boost=(state.boosts[l.id]||0)>0;return `<div class="ac-loc ${locked?"locked":""} ${boost?"on":""}" data-loc="${l.id}"><b>${locked?"🔒":l.icon} ${l.name}</b><small>${locked?`Unlocks at ${l.unlockPop} ants`:l.desc}</small>${sum?`<div class="ac-rate">${sum.workers} workers · ~${fmt(sum.perSecond)} ${RESOURCES[l.resource].name}/s${boost?" · SURGED":""}</div>`:""}</div>`;}).join("");
        listEl.querySelectorAll("[data-loc]").forEach(el=>el.onclick=()=>{if(boostLocation(state,el.dataset.loc))renderRight();});
      }else{
        listEl.innerHTML=CHAMBERS.map(c=>{const lv=state.chamber[c.id]||0,locked=population(state)<c.unlockPop,cost=chamberCost(state,c.id);const eff=Object.entries(c.effects).map(([k,v])=>v<1?`${k} +${Math.round(v*100)}%`:`${k} +${v}`).join(" · ");return `<div class="ac-ch ${locked?"locked":""}" data-ch="${c.id}"><b>${c.icon} ${c.name} · Lv ${lv}</b><small>${locked?`Unlocks at ${c.unlockPop} ants`:c.desc}</small><div class="ac-rate">${locked?"🔒":formatCost(cost)}${!locked?`<br>${eff}`:""}</div></div>`;}).join("");
        listEl.querySelectorAll("[data-ch]").forEach(el=>el.onclick=()=>{if(buyChamber(state,el.dataset.ch)){renderAll();saveState(state);}});
      }
    }
    function renderAll(){renderTop();renderUpgrades();renderRight();}
    function close(){host.innerHTML="";modal=null;}
    function shell(title,sub,body){host.innerHTML=`<div class="ac-modal"><div class="ac-card"><button class="ac-close">✕</button><h2>${title}</h2><p class="ac-sub">${sub}</p>${body}</div></div>`;host.querySelector(".ac-close").onclick=close;host.querySelector(".ac-modal").onclick=e=>{if(e.target.classList.contains("ac-modal"))close();};}
    function milestonesModal(){shell("COLONY MILESTONES","Population milestones permanently improve the current colony as it grows.",`<div class="ac-miles">${MILESTONES.map(m=>`<div class="ac-mile ${population(state)>=m.pop?"done":""}"><b>${population(state)>=m.pop?"✓":"○"} ${m.pop} ants · ${m.name}</b><small>${m.reward}</small></div>`).join("")}</div>`);}
    function prestigeModal(){
      const gain=prestigeGain(state);
      shell("FOUND A NEW COLONY","At 250+ ants you can send a reproductive swarm away. The new colony starts small, but Genetic Memory is permanent.",`<div style="margin-bottom:10px;font-weight:1000;color:#e4cf83">✦ ${state.genes} GENETIC MEMORY</div><div class="ac-prestige">${PRESTIGE.map(p=>{const lv=state.prestige[p.id]||0,cost=Math.ceil(p.baseCost*Math.pow(p.scale,lv));return `<div class="ac-p"><div class="ico">${p.icon}</div><b>${p.name} · Lv ${lv}</b><p>${p.desc}</p><button data-p="${p.id}">✦ ${cost}</button></div>`;}).join("")}</div><button class="ac-new" ${gain<=0?"disabled":""}>FOUND NEW COLONY · +✦ ${gain}</button>`);
      host.querySelectorAll("[data-p]").forEach(el=>el.onclick=()=>{if(buyPrestige(state,el.dataset.p)){saveState(state);prestigeModal();renderAll();}});
      host.querySelector(".ac-new").onclick=()=>{if(newColony(state)){saveState(state);close();renderAll();}};
    }
    root.querySelectorAll(".ac-tab").forEach(x=>x.onclick=()=>{tab=x.dataset.tab;renderRight();});
    root.querySelector('[data-open="milestones"]').onclick=milestonesModal;root.querySelector('[data-open="prestige"]').onclick=prestigeModal;

    function hitLocation(e){
      const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height;let best=null,bd=42;
      for(const l of LOCATIONS){if(population(state)<l.unlockPop)continue;const p=locationPos(l,W,H),d=Math.hypot(mx-p.x,my-p.y);if(d<bd){bd=d;best=l;}}
      if(best){boostLocation(state,best.id);renderRight();}
    }
    canvas.addEventListener("pointerdown",hitLocation);
    canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height;hover=null;for(const l of LOCATIONS){const p=locationPos(l,W,H);if(Math.hypot(mx-p.x,my-p.y)<38){hover=l.id;break;}}});
    canvas.addEventListener("pointerleave",()=>hover=null);

    function loop(now){
      if(destroyed)return;const dt=Math.min(.05,(now-last)/1000);last=now;update(state,dt);render(ctx,state,W,H,hover);saveTimer+=dt;uiTimer+=dt;
      if(uiTimer>.25){uiTimer=0;renderTop();if(tab==="locations")renderRight();}if(saveTimer>10){saveTimer=0;saveState(state);}raf=requestAnimationFrame(loop);
    }
    renderAll();last=performance.now();raf=requestAnimationFrame(loop);
    return {destroy:()=>{destroyed=true;cancelAnimationFrame(raf);ro.disconnect();saveState(state);style.remove();}};
  }
};
