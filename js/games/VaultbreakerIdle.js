import {
  CHESTS, ITEMS, CURSORS, TREASURES, RARITY, SKILL_BRANCHES, ASCENSION_PERKS
} from "./VaultbreakerData.js";
import {
  loadState,saveState,applyOfflineProgress,update,clickChest,calcActiveDamage,calcPassiveDps,
  getMods,buyItem,equipCursor,upgradeCursor,buySkill,buyAscension,ascend,ascensionGain,
  itemCost,xpNeeded,fmt,clamp
} from "./VaultbreakerEngine.js";
import { renderCenter } from "./VaultbreakerRender.js";

export default {
  manifest:{
    id:"vaultbreaker-idle",
    name:"Vaultbreaker Idle",
    description:"Satisfying incremental chest breaker with active clicking, automation, loot, cursors, skill trees, rare relics and ascension.",
    icon:"🧰",
    tags:["Idle","Incremental","Clicker","Progression"]
  },

  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),saveTimer=0,uiTimer=0;
    let state=loadState();
    const offline=applyOfflineProgress(state,Date.now());
    let rightTab="shop",modal=null;

    const style=document.createElement("style");
    style.textContent=`
      .vb{position:relative;width:100%;height:100%;min-height:620px;overflow:hidden;background:#17130f;color:#eee8dc;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;user-select:none}
      .vb *{box-sizing:border-box}.vb button{font:inherit}
      .vb-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 22%,#493c2a55,transparent 40%),linear-gradient(135deg,#191612,#0d0c0b)}
      .vb-top{
        position:absolute;z-index:10;left:0;right:0;top:0;height:92px;display:grid;grid-template-columns:220px 1fr 260px;gap:10px;align-items:center;
        padding:10px 18px;background:linear-gradient(180deg,#191713f2,#17140ed9);border-bottom:1px solid #bd8b4630
      }
      .vb-brand{display:flex;gap:9px;align-items:center}.vb-logo{width:43px;height:43px;border-radius:9px;display:grid;place-items:center;background:#2b241b;border:1px solid #bd8b4652;font-size:1.35rem}.vb-brand b{font-size:.92rem}.vb-brand small{display:block;color:#7e7468;font-size:.55rem}
      .vb-level{text-align:center}.vb-level strong{font-size:1.45rem;letter-spacing:.03em}.vb-xp{height:12px;margin:5px auto 2px;max-width:430px;border-radius:99px;background:#37352f;border:2px solid #8b8d8b;overflow:hidden}.vb-xp>div{height:100%;background:linear-gradient(90deg,#5a872c,#87ad3c)}
      .vb-level small{color:#b7b2aa;font-size:.57rem}
      .vb-money{display:flex;justify-content:flex-end;gap:8px}.vb-currency{min-width:105px;padding:8px 11px;border:1px solid #d09b4b72;background:#2b241cae;clip-path:polygon(10% 0,90% 0,100% 50%,90% 100%,10% 100%,0 50%);text-align:center;font-size:.72rem;font-weight:950}.vb-currency.gold{color:#ffcf4f}.vb-currency.shards{color:#75e3ef}
      .vb-layout{position:absolute;inset:92px 0 0;display:grid;grid-template-columns:225px minmax(0,1fr) 300px;gap:8px;padding:8px}
      .vb-panel{background:#151310e8;border:1px solid #6b574339;box-shadow:0 10px 30px #0005;min-height:0;overflow:hidden}
      .vb-panel-title{height:44px;display:flex;align-items:center;justify-content:center;background:linear-gradient(#28221b,#17130f);border-bottom:1px solid #a57a4055;font-size:.82rem;font-weight:1000;letter-spacing:.06em}
      .vb-left{display:flex;flex-direction:column}.vb-items{padding:9px;display:grid;grid-template-columns:1fr 1fr;gap:8px;overflow:auto}
      .vb-item{position:relative;min-height:85px;border:2px solid #3c342c;background:linear-gradient(145deg,#25211c,#151310);border-radius:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer}.vb-item:hover:not(.locked){border-color:#9b7547}.vb-item.locked{opacity:.28;filter:grayscale(1)}.vb-item .ico{font-size:1.65rem}.vb-item .lv{position:absolute;right:3px;top:3px;min-width:18px;height:18px;display:grid;place-items:center;border-radius:99px;background:#3a3128;border:1px solid #675744;font-size:.54rem}.vb-item b{font-size:.54rem;margin-top:4px}.vb-left-foot{padding:7px;border-top:1px solid #ffffff0d;font-size:.54rem;color:#776e65;text-align:center}
      .vb-center{position:relative;min-width:0;min-height:0;border:1px solid #6b57432e;overflow:hidden}.vb-center canvas{width:100%;height:100%;display:block;cursor:pointer}.vb-center canvas:active{cursor:grabbing}
      .vb-dps{position:absolute;z-index:4;left:50%;bottom:58px;transform:translateX(-50%);text-align:center;pointer-events:none;text-shadow:0 3px 8px #000}.vb-dps strong{font-size:1.22rem;color:#d9d6cf}.vb-dps small{display:block;margin-top:5px;color:#8f857b;font-size:.58rem;font-weight:800}.vb-combo{position:absolute;right:14px;top:12px;padding:6px 9px;border-radius:6px;background:#0c0b09aa;color:#f2c65a;font-size:.61rem;font-weight:950}
      .vb-center-actions{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:6px}.vb-mini{border:1px solid #795d38;background:#241d16;color:#e8ded0;border-radius:6px;padding:7px 9px;font-size:.58rem;font-weight:900;cursor:pointer}.vb-mini:hover{background:#30261b}
      .vb-right{display:flex;flex-direction:column}.vb-tabs{display:flex}.vb-tab{flex:1;height:44px;border:0;border-bottom:1px solid #a57a4055;background:#18140f;color:#786f66;font-weight:950;font-size:.69rem;cursor:pointer}.vb-tab.on{background:#2a231b;color:#fff}.vb-list{padding:7px;overflow:auto;min-height:0}
      .vb-shop-row{min-height:60px;margin-bottom:5px;padding:7px 8px;display:grid;grid-template-columns:39px 1fr auto;gap:7px;align-items:center;border:1px solid #44372a;background:linear-gradient(90deg,#211b15,#181411);cursor:pointer}.vb-shop-row:hover:not(.locked){border-color:#a07843}.vb-shop-row.locked{opacity:.30;filter:grayscale(1)}.vb-shop-row .ico{font-size:1.35rem;text-align:center}.vb-shop-row b{display:block;font-size:.65rem}.vb-shop-row small{display:block;color:#7c7167;font-size:.50rem;margin-top:2px}.vb-price{text-align:right;color:#f2c453;font-size:.57rem;font-weight:1000}.vb-price em{display:block;color:#7a7168;font-style:normal;font-size:.47rem;margin-top:2px}
      .vb-cursor-row.on{border-color:#67c9d8;box-shadow:inset 0 0 18px #5fc4d515}.vb-cursor-row .price2{color:#77d9e7}
      .vb-bottom-nav{position:absolute;z-index:12;left:245px;right:320px;bottom:12px;display:flex;justify-content:center;gap:6px;pointer-events:none}.vb-bottom-nav button{pointer-events:auto}
      .vb-modal{position:absolute;z-index:30;inset:0;background:#080706d9;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}.vb-modal-card{position:relative;width:min(980px,96%);max-height:90%;overflow:auto;border:1px solid #806341;background:linear-gradient(#1c1814,#100e0c);box-shadow:0 35px 100px #000b;padding:18px}.vb-close{position:sticky;float:right;top:0;z-index:2;width:35px;height:35px;border:1px solid #8a573e;background:#401e17;color:#eee;font-size:1rem;font-weight:1000;cursor:pointer}
      .vb-modal h2{margin:2px 0 4px;font-size:1.4rem}.vb-modal-sub{margin:0 0 15px;color:#887d73;font-size:.66rem}
      .vb-skills{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;align-items:start}.vb-branch{text-align:center}.vb-branch h3{font-size:.66rem;margin:5px 0 10px;letter-spacing:.06em}.vb-node{position:relative;width:62px;height:62px;margin:0 auto 18px;border-radius:50%;border:3px solid var(--bc);background:#171512;color:#d8d2c8;cursor:pointer;display:grid;place-items:center}.vb-node::after{content:"";position:absolute;left:50%;top:60px;width:2px;height:18px;background:var(--bc);opacity:.45}.vb-node:last-child::after{display:none}.vb-node.locked{filter:grayscale(1);opacity:.35}.vb-node.maxed{box-shadow:0 0 15px color-mix(in srgb,var(--bc),transparent 45%)}.vb-node span{font-size:1.15rem}.vb-node i{position:absolute;right:-4px;top:-5px;min-width:20px;height:20px;padding:0 3px;border-radius:99px;background:#332d26;border:1px solid #6e5d4a;display:grid;place-items:center;font-style:normal;font-size:.48rem}.vb-node-name{font-size:.50rem;margin-top:-14px;margin-bottom:13px;color:#8b8177}.vb-skillpoints{font-size:1.4rem;font-weight:1000;color:#f0d260;margin-bottom:10px}
      .vb-treasures{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.vb-treasure{min-height:112px;padding:10px 5px;border:1px solid #44392e;background:#16130f;text-align:center}.vb-treasure.unknown{opacity:.25;filter:grayscale(1)}.vb-treasure .ico{font-size:2rem}.vb-treasure b{display:block;font-size:.58rem;margin-top:6px}.vb-treasure small{display:block;font-size:.47rem;margin-top:4px}.vb-treasure .count{color:#e0c45b}
      .vb-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.vb-stat{padding:13px;background:#17130f;border:1px solid #44372b}.vb-stat span{display:block;color:#776e65;font-size:.50rem;text-transform:uppercase}.vb-stat b{display:block;margin-top:3px;font-size:.85rem}
      .vb-asc-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px}.vb-asc{padding:12px;border:1px solid #4a3c2e;background:#17130f;text-align:center}.vb-asc .ico{font-size:1.4rem}.vb-asc b{display:block;font-size:.62rem;margin:5px 0}.vb-asc p{font-size:.52rem;color:#80766c;min-height:38px}.vb-asc button{width:100%;padding:7px;border:0;border-radius:5px;background:#5f4830;color:#fff;font-size:.55rem;font-weight:950;cursor:pointer}.vb-ascend-btn{margin-top:16px;padding:11px 15px;border:0;border-radius:6px;background:linear-gradient(135deg,#6ed9e5,#9275e8);color:#0d1113;font-weight:1000;cursor:pointer}
      .vb-offline{position:absolute;z-index:50;left:50%;top:105px;transform:translateX(-50%);padding:10px 14px;border:1px solid #c99a4f;background:#211a12f0;box-shadow:0 12px 32px #0009;font-size:.64rem;color:#e7d9c0}
      @media(max-width:1080px){.vb-top{grid-template-columns:160px 1fr 180px;padding-left:10px;padding-right:10px}.vb-layout{grid-template-columns:175px minmax(0,1fr) 230px}.vb-item{min-height:70px}.vb-shop-row{grid-template-columns:31px 1fr auto}.vb-bottom-nav{left:190px;right:245px}.vb-skills{grid-template-columns:repeat(3,1fr)}.vb-treasures{grid-template-columns:repeat(4,1fr)}}
      @media(max-width:820px){.vb{min-height:540px}.vb-top{height:74px;grid-template-columns:1fr 1.5fr}.vb-brand{display:none}.vb-money{gap:4px}.vb-currency{min-width:80px;padding:6px;font-size:.59rem}.vb-level strong{font-size:1rem}.vb-layout{inset:74px 0 0;grid-template-columns:132px minmax(0,1fr) 175px;gap:4px;padding:4px}.vb-panel-title,.vb-tab{height:34px;font-size:.58rem}.vb-items{padding:4px;gap:4px}.vb-item{min-height:57px}.vb-item .ico{font-size:1.15rem}.vb-shop-row{min-height:47px;padding:4px;grid-template-columns:25px 1fr auto}.vb-shop-row .ico{font-size:1rem}.vb-shop-row b{font-size:.54rem}.vb-bottom-nav{left:140px;right:180px;bottom:5px}.vb-dps{bottom:45px}.vb-skills{grid-template-columns:repeat(2,1fr)}.vb-treasures{grid-template-columns:repeat(3,1fr)}.vb-stat-grid{grid-template-columns:1fr 1fr}.vb-asc-grid{grid-template-columns:1fr 1fr}}
      @media(max-height:680px){.vb{min-height:500px}.vb-top{height:68px}.vb-layout{inset:68px 0 0}.vb-items{gap:3px}.vb-item{min-height:51px}.vb-item .ico{font-size:1.1rem}.vb-item b{display:none}.vb-shop-row{min-height:44px}.vb-shop-row small{display:none}.vb-dps{bottom:42px}.vb-center-actions{bottom:5px}.vb-bottom-nav{bottom:4px}}
    `;

    const root=document.createElement("div");root.className="vb";
    root.innerHTML=`
      <div class="vb-bg"></div>
      <header class="vb-top">
        <div class="vb-brand"><div class="vb-logo">🧰</div><div><b>VAULTBREAKER</b><small>Idle Treasure Expedition</small></div></div>
        <div class="vb-level"></div>
        <div class="vb-money"></div>
      </header>
      <div class="vb-layout">
        <section class="vb-panel vb-left"><div class="vb-panel-title">ITEMS</div><div class="vb-items"></div><div class="vb-left-foot">Click an unlocked item to upgrade it.</div></section>
        <section class="vb-center"><canvas></canvas><div class="vb-combo"></div><div class="vb-dps"></div><div class="vb-center-actions"><button class="vb-mini skills">SKILLS</button><button class="vb-mini treasures">TREASURES</button><button class="vb-mini stats">STATS</button><button class="vb-mini ascend">ASCEND</button></div></section>
        <section class="vb-panel vb-right"><div class="vb-tabs"><button class="vb-tab on" data-tab="shop">SHOP</button><button class="vb-tab" data-tab="cursors">CURSORS</button></div><div class="vb-list"></div></section>
      </div>
      <div class="vb-modal-host"></div>
    `;
    container.append(style,root);

    const canvas=root.querySelector("canvas"),ctx=canvas.getContext("2d");
    const levelEl=root.querySelector(".vb-level"),moneyEl=root.querySelector(".vb-money"),itemsEl=root.querySelector(".vb-items"),listEl=root.querySelector(".vb-list");
    const dpsEl=root.querySelector(".vb-dps"),comboEl=root.querySelector(".vb-combo"),modalHost=root.querySelector(".vb-modal-host");
    let cw=1,ch=1,dpr=1;

    function resize(){
      const r=canvas.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,devicePixelRatio||1);
      canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    const ro=new ResizeObserver(resize);ro.observe(canvas);resize();

    function offlineToast(){
      if(!offline.seconds)return;
      const div=document.createElement("div");div.className="vb-offline";
      div.textContent=`Welcome back · ${Math.floor(offline.seconds/60)}m offline · ${offline.chests} chests · +${fmt(offline.gold)} gold`;
      root.append(div);setTimeout(()=>div.remove(),5000);
    }
    offlineToast();

    function renderTop(){
      const need=xpNeeded(state.level),pct=clamp(state.xp/need*100,0,100);
      levelEl.innerHTML=`<strong>LEVEL ${state.level}</strong><div class="vb-xp"><div style="width:${pct}%"></div></div><small>${fmt(state.xp)} / ${fmt(need)} XP · Chest ${state.chestStage}</small>`;
      moneyEl.innerHTML=`<div class="vb-currency gold">● ${fmt(state.gold)}</div><div class="vb-currency shards">◆ ${fmt(state.crownShards)}</div>`;
    }

    function renderItems(){
      const m=getMods(state);
      itemsEl.innerHTML=ITEMS.map(item=>{
        const lv=state.itemLevels[item.id]||0,locked=state.level<item.unlock,cost=itemCost(item,lv,m);
        return `<div class="vb-item ${locked?"locked":""}" data-item="${item.id}" title="${item.description}\n${locked?`Unlocks at level ${item.unlock}`:`Upgrade: ${fmt(cost)} gold`}">
          <div class="lv">${locked?"🔒":lv}</div><div class="ico">${item.icon}</div><b>${item.name}</b>
        </div>`;
      }).join("");
      itemsEl.querySelectorAll("[data-item]").forEach(el=>el.onclick=()=>{
        if(buyItem(state,el.dataset.item)){renderAllUI();saveState(state);}
      });
    }

    function renderRight(){
      root.querySelectorAll(".vb-tab").forEach(x=>x.classList.toggle("on",x.dataset.tab===rightTab));
      if(rightTab==="shop"){
        const m=getMods(state);
        listEl.innerHTML=ITEMS.map(item=>{
          const lv=state.itemLevels[item.id]||0,locked=state.level<item.unlock,cost=itemCost(item,lv,m);
          return `<div class="vb-shop-row ${locked?"locked":""}" data-buy="${item.id}">
            <div class="ico">${item.icon}</div><div><b>${item.name}</b><small>Lv ${lv} · ${item.description}</small></div>
            <div class="vb-price">${locked?"🔒 LV "+item.unlock:"● "+fmt(cost)}<em>${locked?"":"LEVEL UP"}</em></div>
          </div>`;
        }).join("");
        listEl.querySelectorAll("[data-buy]").forEach(el=>el.onclick=()=>{if(buyItem(state,el.dataset.buy)){renderAllUI();saveState(state);}});
      }else{
        listEl.innerHTML=CURSORS.map(c=>{
          const lv=state.cursorLevels[c.id]||1,locked=state.level<c.unlock,on=state.equippedCursor===c.id;
          const cost=Math.floor(180*Math.pow(1.48,lv-1)*Math.pow(1.12,c.unlock));
          return `<div class="vb-shop-row vb-cursor-row ${locked?"locked":""} ${on?"on":""}" data-cursor="${c.id}">
            <div class="ico">${c.icon}</div><div><b>${c.name}</b><small>Lv ${lv} · ${c.bonus}</small></div>
            <div class="vb-price price2">${locked?"🔒 LV "+c.unlock:on?"EQUIPPED":"EQUIP"}<em>${locked?"":`UPGRADE ● ${fmt(cost)}`}</em></div>
          </div>`;
        }).join("");
        listEl.querySelectorAll("[data-cursor]").forEach(el=>{
          el.onclick=e=>{
            const id=el.dataset.cursor,c=CURSORS.find(x=>x.id===id);if(state.level<c.unlock)return;
            if(state.equippedCursor!==id)equipCursor(state,id);
            else upgradeCursor(state,id);
            renderAllUI();saveState(state);
          };
          el.oncontextmenu=e=>{e.preventDefault();if(upgradeCursor(state,el.dataset.cursor)){renderAllUI();saveState(state);}};
        });
      }
    }

    function renderCenterUi(){
      dpsEl.innerHTML=`<strong>DAMAGE: ${fmt(calcPassiveDps(state))}/S</strong><small>CLICK ${fmt(calcActiveDamage(state))} · ${state.chest?.def?.name||""}${state.chest?.boss?" · BOSS":""}</small>`;
      comboEl.textContent=state.combo>1?`COMBO ×${state.combo}`:"";
    }

    function renderAllUI(){renderTop();renderItems();renderRight();renderCenterUi();}

    function openModal(type){
      modal=type;
      if(type==="skills")renderSkillsModal();
      if(type==="treasures")renderTreasuresModal();
      if(type==="stats")renderStatsModal();
      if(type==="ascend")renderAscendModal();
    }
    function shell(title,sub,body){
      modalHost.innerHTML=`<div class="vb-modal"><div class="vb-modal-card"><button class="vb-close">✕</button><h2>${title}</h2><p class="vb-modal-sub">${sub}</p>${body}</div></div>`;
      modalHost.querySelector(".vb-close").onclick=closeModal;
      modalHost.querySelector(".vb-modal").onclick=e=>{if(e.target.classList.contains("vb-modal"))closeModal();};
    }
    function closeModal(){modal=null;modalHost.innerHTML="";}

    function renderSkillsModal(){
      const body=`<div class="vb-skillpoints">✦ ${state.skillPoints} SKILL POINTS</div><div class="vb-skills">${
        SKILL_BRANCHES.map(b=>`<div class="vb-branch"><h3 style="color:${b.color}">${b.icon} ${b.name}</h3>${
          b.nodes.map(n=>{
            const lv=state.skills[n.id]||0,reqOk=!n.requires||(state.skills[n.requires]>0),max=lv>=n.max;
            const cost=n.cost*Math.max(1,1+Math.floor(lv/3));
            return `<button class="vb-node ${!reqOk?"locked":""} ${max?"maxed":""}" style="--bc:${b.color}" data-skill="${n.id}" title="${n.name}\n${n.desc}\nCost: ${cost} skill points"><span>${b.icon}</span><i>${max?"MAX":lv}</i></button><div class="vb-node-name">${n.name}<br>✦ ${max?"—":cost}</div>`;
          }).join("")
        }</div>`).join("")
      }</div>`;
      shell("PRESTIGE SKILL GRID","Spend skill points earned from leveling. The final node of every branch is intentionally repeatable.",body);
      modalHost.querySelectorAll("[data-skill]").forEach(el=>el.onclick=()=>{if(buySkill(state,el.dataset.skill)){saveState(state);renderSkillsModal();renderAllUI();}});
    }

    function renderTreasuresModal(){
      const body=`<div class="vb-treasures">${TREASURES.map(tr=>{
        const count=state.treasures[tr.id]||0,r=RARITY[tr.rarity];
        return `<div class="vb-treasure ${count?"":"unknown"}" style="border-color:${count?r.color:"#44392e"}" title="${count?`${tr.name}\nPermanent ${tr.effect} bonus`:"Undiscovered treasure"}">
          <div class="ico" style="color:${r.color}">${count?tr.icon:"?"}</div><b>${count?tr.name:"?????"}</b><small style="color:${r.color}">${count?r.label:"UNKNOWN"}</small><small class="count">${count?"×"+count:""}</small>
        </div>`;
      }).join("")}</div>`;
      shell("RARE TREASURES","Permanent collectibles with increasingly rare drop tiers. Duplicate finds slightly strengthen the relic.",body);
    }

    function renderStatsModal(){
      const m=getMods(state);
      const stats=[
        ["Chests Opened",fmt(state.chestsOpened)],["Highest Chest",fmt(state.highestStage)],["Total Clicks",fmt(state.totalClicks)],["Total Gold",fmt(state.totalGold)],
        ["Total Damage",fmt(state.totalDamage)],["Critical Hits",fmt(state.stats.crits)],["Treasures Found",fmt(state.stats.treasures)],["Boss Vaults",fmt(state.stats.bosses)],
        ["Active Damage",fmt(calcActiveDamage(state))],["Passive DPS",fmt(calcPassiveDps(state))],["Crit Chance",(m.crit*100).toFixed(1)+"%"],["Crit Damage",m.critDamage.toFixed(2)+"×"],
        ["Gold Multiplier",m.gold.toFixed(2)+"×"],["XP Multiplier",m.xp.toFixed(2)+"×"],["Treasure Multiplier",m.treasure.toFixed(2)+"×"],["Ascensions",state.prestigeCount]
      ];
      shell("EXPEDITION STATS","Lifetime and current-build statistics.",`<div class="vb-stat-grid">${stats.map(x=>`<div class="vb-stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div>`);
    }

    function renderAscendModal(){
      const gain=ascensionGain(state);
      const body=`<div class="vb-stat-grid">
        <div class="vb-stat"><span>Current Level</span><b>${state.level}</b></div><div class="vb-stat"><span>Highest Chest</span><b>${state.highestStage}</b></div><div class="vb-stat"><span>Crown Shards</span><b>◆ ${state.crownShards}</b></div><div class="vb-stat"><span>Ascend Reward</span><b>+◆ ${gain}</b></div>
      </div>
      <div class="vb-asc-grid">${ASCENSION_PERKS.map(p=>{
        const lv=state.ascension[p.id]||0,cost=Math.ceil(p.baseCost*Math.pow(p.costScale,lv));
        return `<div class="vb-asc"><div class="ico">${p.icon}</div><b>${p.name} · Lv ${lv}</b><p>${p.desc}</p><button data-ap="${p.id}">◆ ${cost}</button></div>`;
      }).join("")}</div>
      <button class="vb-ascend-btn" ${gain<=0?"disabled":""}>ASCEND NOW · +◆ ${gain}</button>
      <p class="vb-modal-sub" style="margin-top:10px">Ascension resets gold, level, chest stage and item levels. Skill tree, rare treasures, cursor levels and Crown upgrades remain. Requires level 15.</p>`;
      shell("ASCENSION","Reset the current expedition for permanent Crown Shards.",body);
      modalHost.querySelectorAll("[data-ap]").forEach(el=>el.onclick=()=>{if(buyAscension(state,el.dataset.ap)){saveState(state);renderAscendModal();renderAllUI();}});
      const btn=modalHost.querySelector(".vb-ascend-btn");
      btn.onclick=()=>{const g=ascend(state);if(g){saveState(state);closeModal();renderAllUI();}};
    }

    root.querySelectorAll(".vb-tab").forEach(el=>el.onclick=()=>{rightTab=el.dataset.tab;renderRight();});
    root.querySelector(".skills").onclick=()=>openModal("skills");
    root.querySelector(".treasures").onclick=()=>openModal("treasures");
    root.querySelector(".stats").onclick=()=>openModal("stats");
    root.querySelector(".ascend").onclick=()=>openModal("ascend");

    canvas.addEventListener("pointerdown",e=>{
      if(!state.chest||state.chest.opened)return;
      clickChest(state);
      if(navigator.vibrate)try{navigator.vibrate(6);}catch{}
      renderCenterUi();
    });

    function keydown(e){
      if(e.code==="Space"&&!modal){e.preventDefault();clickChest(state);renderCenterUi();}
      if(e.key==="Escape"&&modal)closeModal();
      if(e.key==="1"&&!modal)openModal("skills");
      if(e.key==="2"&&!modal)openModal("treasures");
    }
    window.addEventListener("keydown",keydown);

    function loop(now){
      if(destroyed)return;
      const dt=Math.min(.05,(now-last)/1000);last=now;
      update(state,dt);
      renderCenter(ctx,state,cw,ch);
      uiTimer+=dt;saveTimer+=dt;
      if(uiTimer>.20){uiTimer=0;renderTop();renderCenterUi();}
      if(saveTimer>10){saveTimer=0;saveState(state);}
      raf=requestAnimationFrame(loop);
    }

    renderAllUI();last=performance.now();raf=requestAnimationFrame(loop);

    return {destroy:()=>{
      destroyed=true;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener("keydown",keydown);saveState(state);style.remove();
    }};
  }
};
