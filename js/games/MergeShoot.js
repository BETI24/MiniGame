import { createState, startBattle, updateBattle, buyWeapon, moveWeapon, deployBagWeapon, openChest } from "./MergeShootEngine.js";
import { layout, render, getBuildUI, getPanelUI, getResultUI } from "./MergeShootRender.js";
import { clamp, formationBaseY } from "./MergeShootBattleMath.js";

const SAVE = "nexus-merge-shoot-v1";
const inside = (r,p) => p.x >= r.x && p.x <= r.x+r.w && p.y >= r.y && p.y <= r.y+r.h;

export default {
  manifest: {
    id: "merge-shoot",
    name: "Merge & Shoot",
    description: "Build a connected 5×5 weapon formation, merge towers, unlock an expanding arsenal and blast through dense block fields.",
    icon: "🚀",
    tags: ["Arcade", "Action", "Strategy", "Merge", "Singleplayer"]
  },

  init: (container, services) => {
    let dead = false, raf = 0, last = performance.now(), L = null, dpr = 1;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(SAVE) || "{}") || {}; } catch {}
    const s = createState(saved);
    const input = { x: 0, y: 0, keys: new Set(), drag: false, viewH: 800, maxX: 245 };

    const style = document.createElement("style");
    style.textContent = `.ms-root{position:relative;width:100%;height:100%;min-height:700px;overflow:hidden;background:#07182c;user-select:none;touch-action:none}.ms-root canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}.ms-root canvas:active{cursor:grabbing}`;
    document.head.appendChild(style);
    const root = document.createElement("div"); root.className = "ms-root";
    const canvas = document.createElement("canvas"); root.appendChild(canvas); container.appendChild(root);
    const c = canvas.getContext("2d");

    const save = () => {
      const compact = w => w ? { type:w.type, rank:w.rank } : null;
      localStorage.setItem(SAVE, JSON.stringify({
        stage:s.stage, level:s.level, xp:s.xp, gold:s.gold, gems:s.gems, keys:s.keys,
        purchases:s.purchases, grid:s.grid.map(compact), bag:s.bag.map(compact)
      }));
    };

    function resize() {
      const r = root.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.max(1, r.width * dpr); canvas.height = Math.max(1, r.height * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0); L = layout(r.width, r.height);
      input.viewH = L.H; input.maxX = Math.min(245, L.side * .34);
      input.x = clamp(input.x, -input.maxX, input.maxX);
    }
    resize(); const ro = new ResizeObserver(resize); ro.observe(root);

    function pos(e) { const r = canvas.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; }
    function gridAt(p) {
      if (!L) return -1; const gx=L.cx-L.cell*2.5, gy=L.gridY;
      const cx=Math.floor((p.x-gx)/L.cell), cy=Math.floor((p.y-gy)/L.cell);
      return cx>=0&&cx<5&&cy>=0&&cy<5 ? cy*5+cx : -1;
    }
    function steerTo(p) {
      input.x=clamp((p.x-L.cx)*.93,-input.maxX,input.maxX);
      input.y=clamp((p.y-formationBaseY(L.H))*.56,-105,92);
    }

    function handlePanel(p) {
      const P=getPanelUI(L,s);
      if (inside(P.close,p)) { s.panel=null; return true; }
      if (s.panel === "bag") {
        const hit=P.bagRects.find(r=>inside(r,p)); if(hit){ deployBagWeapon(s,hit.index); save(); return true; }
      } else if (s.panel === "chests") {
        const hit=P.chestRects.find(r=>inside(r,p)); if(hit){ openChest(s,hit.kind); save(); return true; }
      }
      return true;
    }

    function down(e) {
      const p=pos(e);
      if (s.mode === "battle") { input.drag=true; steerTo(p); canvas.setPointerCapture?.(e.pointerId); return; }
      if (s.mode === "result") { const R=getResultUI(L); if(inside(R.continue,p)){s.mode="build";s.panel=null;save();} return; }
      if (s.panel) { handlePanel(p); return; }

      const U=getBuildUI(L);
      if (inside(U.level,p)) { s.panel="rewards"; return; }
      if (inside(U.chests,p)) { s.panel="chests"; return; }
      const i=gridAt(p); if(i>=0&&s.grid[i]){s.drag=i;return;}
      for(let t=0;t<3;t++) if(inside(U.purchases[t],p)){buyWeapon(s,t);save();return;}
      if(inside(U.bag,p)){s.panel="bag";return;}
      if(inside(U.collection,p)){s.panel="collection";return;}
      if(inside(U.battle,p)){input.x=0;input.y=0;startBattle(s);return;}
    }
    function move(e) {
      const p=pos(e);
      if(s.mode==="battle"&&input.drag)steerTo(p);
      else if(s.mode==="build"&&!s.panel)s.hover=gridAt(p);
    }
    function up(e) {
      if(s.mode==="battle"){input.drag=false;return;}
      if(s.panel)return;
      if(s.drag!=null){const p=pos(e),to=gridAt(p);if(to>=0&&moveWeapon(s,s.drag,to))save();s.drag=null;}
    }

    const kd=e=>{input.keys.add(e.key.toLowerCase());if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();};
    const ku=e=>input.keys.delete(e.key.toLowerCase());
    canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
    window.addEventListener("keydown",kd,{passive:false});window.addEventListener("keyup",ku);

    function frame(now) {
      if(dead)return; const dt=Math.min(.033,(now-last)/1000);last=now;
      if(s.mode==="battle"){
        let dx=0,dy=0;if(input.keys.has("a")||input.keys.has("arrowleft"))dx-=1;if(input.keys.has("d")||input.keys.has("arrowright"))dx+=1;if(input.keys.has("w")||input.keys.has("arrowup"))dy-=1;if(input.keys.has("s")||input.keys.has("arrowdown"))dy+=1;
        if(!input.drag){input.x=clamp(input.x+dx*300*dt,-input.maxX,input.maxX);input.y=clamp(input.y+dy*205*dt,-105,92);}
        input.viewH=L.H;input.maxX=Math.min(245,L.side*.34);updateBattle(s,dt,input);
        if(s.mode==="result"){save();try{services?.highscores?.setHighscore?.("merge-shoot",s.stage);}catch{}}
      }
      c.clearRect(0,0,L.W,L.H);render(c,L,s);raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);

    return { destroy(){dead=true;cancelAnimationFrame(raf);ro.disconnect();save();canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);style.remove();root.remove();} };
  }
};
