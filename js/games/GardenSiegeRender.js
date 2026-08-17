import { ROWS, COLS, PLANTS, ENEMIES, BOSSES } from "./GardenSiegeData.js";
import { cellToWorld, clamp, getWaveProgress } from "./GardenSiegeEngine.js";

export function computeBounds(W,H){
  const top=104;
  const bottom=24;
  const left=Math.max(82,W*.085);
  const right=34;
  return {
    gridX:left,
    gridY:top,
    gridW:Math.max(540,W-left-right),
    gridH:Math.max(390,H-top-bottom)
  };
}

function roundedRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,rr);
}

function plantPos(bounds,p){
  return cellToWorld(bounds,p.row,p.col);
}

export function renderGame(ctx,state,bounds,W,H,hoverCell=null){
  ctx.clearRect(0,0,W,H);

  drawBackground(ctx,state,bounds,W,H);
  drawSweepers(ctx,state,bounds);
  drawGrid(ctx,state,bounds,hoverCell);
  drawPlants(ctx,state,bounds);
  drawProjectiles(ctx,state,bounds);
  drawEnemies(ctx,state,bounds);
  drawOrbs(ctx,state,bounds);
  drawParticles(ctx,state,bounds);
  drawTopHud(ctx,state,bounds,W,H);
}

function drawBackground(ctx,state,b,W,H){
  let top="#85c7e3",bottom="#dce8bd";
  if(state.weather==="night"){top="#1a2940";bottom="#46556d";}
  if(state.weather==="rain"){top="#657f91";bottom="#9eaa9a";}
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,top);g.addColorStop(.55,bottom);g.addColorStop(1,"#6d9f43");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  ctx.fillStyle=state.weather==="night"?"rgba(32,47,67,.55)":"rgba(255,255,255,.20)";
  for(let i=0;i<10;i++){
    ctx.beginPath();
    ctx.ellipse((i*173+state.time*4)% (W+240)-120,52+(i%3)*22,80,18,0,0,Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle="#6da33e";
  ctx.fillRect(0,b.gridY-12,W,H-b.gridY+12);

  if(state.weather==="rain"){
    ctx.strokeStyle="rgba(220,240,255,.42)";
    ctx.lineWidth=1.2;
    for(let i=0;i<80;i++){
      const x=(i*97+state.time*420)%W;
      const y=(i*53+state.time*730)%H;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+17);ctx.stroke();
    }
  }

  if(state.weather==="night"){
    ctx.fillStyle="#ecf0c8";
    ctx.beginPath();ctx.arc(W-82,58,22,0,Math.PI*2);ctx.fill();
  }
}

function drawGrid(ctx,state,b,hoverCell){
  const cw=b.gridW/COLS,ch=b.gridH/ROWS;
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const x=b.gridX+c*cw,y=b.gridY+r*ch;
      ctx.fillStyle=(r+c)%2===0?"#79ad48":"#70a443";
      ctx.fillRect(x,y,cw,ch);
      ctx.strokeStyle="rgba(48,88,40,.20)";
      ctx.lineWidth=1;
      ctx.strokeRect(x+.5,y+.5,cw-1,ch-1);
      if(hoverCell&&hoverCell.row===r&&hoverCell.col===c){
        ctx.fillStyle=state.shovel?"rgba(240,91,91,.24)":"rgba(255,255,255,.18)";
        ctx.fillRect(x+2,y+2,cw-4,ch-4);
      }
    }
  }
  ctx.fillStyle="#477931";
  ctx.fillRect(b.gridX-52,b.gridY,52,b.gridH);
}

function drawSweepers(ctx,state,b){
  const ch=b.gridH/ROWS;
  for(const s of state.sweepers){
    const x=s.active?s.x:b.gridX-30;
    const y=b.gridY+s.row*ch+ch/2;
    if(s.used&&!s.active)continue;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle=s.used?"#777":"#d94f49";
    roundedRect(ctx,-24,-13,48,26,7);ctx.fill();
    ctx.fillStyle="#252a2d";
    ctx.beginPath();ctx.arc(-13,12,7,0,Math.PI*2);ctx.arc(14,12,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#e8d6b5";
    ctx.fillRect(18,-5,18,8);
    ctx.restore();
  }
}

function drawPlants(ctx,state,b){
  for(const p of state.plants){
    const d=PLANTS[p.type],pos=plantPos(b,p);
    ctx.save();ctx.translate(pos.x,pos.y);
    const scale=Math.min(pos.w,pos.h)/90;
    ctx.scale(scale,scale);

    if(p.flash>0){
      ctx.shadowColor="#fff";ctx.shadowBlur=20;
    }

    if(p.type==="barkwall"){
      ctx.fillStyle=d.color;roundedRect(ctx,-26,-34,52,68,17);ctx.fill();
      ctx.strokeStyle=d.accent;ctx.lineWidth=5;ctx.stroke();
      ctx.strokeStyle="rgba(78,47,24,.55)";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-10,-28);ctx.lineTo(-6,22);ctx.moveTo(11,-20);ctx.lineTo(8,27);ctx.stroke();
      eye(ctx,-10,-7);eye(ctx,10,-7);
    }else if(p.type==="sunbloom"){
      ctx.fillStyle=d.accent;ctx.fillRect(-5,8,10,30);
      ctx.fillStyle="#4b8f3a";ctx.beginPath();ctx.ellipse(-13,23,16,7,-.45,0,Math.PI*2);ctx.fill();
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2;ctx.fillStyle=d.color;
        ctx.beginPath();ctx.ellipse(Math.cos(a)*22,Math.sin(a)*22-8,10,16,a,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle="#7d5b2c";ctx.beginPath();ctx.arc(0,-8,17,0,Math.PI*2);ctx.fill();
      eye(ctx,-6,-10,2.6);eye(ctx,6,-10,2.6);
    }else if(p.type==="snapvine"){
      ctx.fillStyle="#4c8d3b";ctx.fillRect(-5,6,10,33);
      ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(0,-5,28,Math.PI*.08,Math.PI*1.92);ctx.fill();
      ctx.fillStyle="#1b1820";ctx.beginPath();ctx.arc(8,-3,17,Math.PI*.06,Math.PI*1.94);ctx.fill();
      ctx.fillStyle="#f3e7d6";
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(8+i*8,-18);ctx.lineTo(12+i*8,-8);ctx.lineTo(4+i*8,-8);ctx.fill();}
      eye(ctx,-10,-12,3);
    }else if(p.type==="bombberry"){
      ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(0,1,25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#3f7f34";ctx.beginPath();ctx.moveTo(-6,-20);ctx.lineTo(0,-38);ctx.lineTo(8,-18);ctx.fill();
      ctx.strokeStyle="#eac75c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-30);ctx.quadraticCurveTo(15,-44,21,-34);ctx.stroke();
      eye(ctx,-8,-3);eye(ctx,7,-3);
    }else{
      ctx.fillStyle="#438c3a";ctx.fillRect(-5,8,10,31);
      ctx.fillStyle="#3b7f32";ctx.beginPath();ctx.ellipse(-13,25,17,7,-.45,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(0,-4,24,0,Math.PI*2);ctx.fill();
      if(p.type==="twinpod"){
        ctx.beginPath();ctx.arc(17,-12,17,0,Math.PI*2);ctx.fill();
      }
      if(p.type==="thunderfern"){
        ctx.strokeStyle="#dfffa2";ctx.lineWidth=3;
        for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(Math.cos(a)*34,Math.sin(a)*34-4);ctx.stroke();}
      }else if(p.type==="sporecap"){
        ctx.fillStyle=d.accent;ctx.beginPath();ctx.ellipse(0,-14,28,15,0,Math.PI,0);ctx.fill();
      }else{
        ctx.fillStyle=d.accent;ctx.beginPath();ctx.ellipse(23,-7,15,11,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#121b18";ctx.beginPath();ctx.arc(29,-7,5,0,Math.PI*2);ctx.fill();
      }
      eye(ctx,-8,-10,2.7);
    }

    if(p.level>1){
      ctx.fillStyle="#f4d86c";ctx.font="900 11px sans-serif";ctx.textAlign="center";
      ctx.fillText("★".repeat(p.level-1),0,46);
    }

    ctx.restore();

    const hpPct=clamp(p.hp/p.maxHp,0,1);
    if(hpPct<.98){
      ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(pos.x-pos.w*.28,pos.y+pos.h*.37,pos.w*.56,5);
      ctx.fillStyle=hpPct>.5?"#67d47f":hpPct>.25?"#e8c35e":"#ec6d6d";
      ctx.fillRect(pos.x-pos.w*.28,pos.y+pos.h*.37,pos.w*.56*hpPct,5);
    }
  }
}

function eye(ctx,x,y,r=3){
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y,r+1.7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#1c2724";ctx.beginPath();ctx.arc(x+1,y,r,0,Math.PI*2);ctx.fill();
}

function drawEnemies(ctx,state,b){
  const ch=b.gridH/ROWS;
  for(const e of state.enemies){
    const d=e.boss?BOSSES[e.type]:ENEMIES[e.type];
    ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.scale,e.scale);
    if(e.flash>0){ctx.shadowColor="#fff";ctx.shadowBlur=14;}
    ctx.fillStyle=d.color;
    ctx.beginPath();ctx.arc(0,-19,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#566151";roundedRect(ctx,-15,-4,30,38,7);ctx.fill();
    ctx.strokeStyle="#313c32";ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-9,31);ctx.lineTo(-12,50);ctx.moveTo(8,31);ctx.lineTo(12,50);ctx.stroke();
    ctx.fillStyle="#f5f0dc";ctx.beginPath();ctx.arc(-6,-22,4.4,0,Math.PI*2);ctx.arc(7,-19,4.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#20261f";ctx.beginPath();ctx.arc(-5,-21,2,0,Math.PI*2);ctx.arc(8,-18,2,0,Math.PI*2);ctx.fill();

    if(d.armorShape==="cone"){
      ctx.fillStyle=d.accent;ctx.beginPath();ctx.moveTo(-17,-34);ctx.lineTo(0,-67);ctx.lineTo(18,-34);ctx.closePath();ctx.fill();
    }else if(d.armorShape==="bucket"){
      ctx.fillStyle=d.accent;roundedRect(ctx,-18,-52,36,24,5);ctx.fill();
    }else if(e.type==="sprinter"){
      ctx.strokeStyle=d.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-7);ctx.lineTo(16,9);ctx.stroke();
    }else if(e.type==="hurdler"){
      ctx.fillStyle=d.accent;ctx.fillRect(-18,-8,36,8);
    }else if(e.type==="summoner"||e.boss){
      ctx.fillStyle=d.accent;ctx.beginPath();ctx.arc(0,-44,e.boss?20:13,Math.PI,0);ctx.fill();
    }
    ctx.restore();

    const hp=clamp(e.hp/e.maxHp,0,1);
    const width=e.boss?78:48;
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(e.x-width/2,e.y-ch*.37,width,5);
    ctx.fillStyle=e.boss?"#e1b85c":"#d96b6b";ctx.fillRect(e.x-width/2,e.y-ch*.37,width*hp,5);

    if(e.slowTimer>0){
      ctx.strokeStyle="rgba(120,220,255,.65)";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(e.x,e.y,27*e.scale,0,Math.PI*2);ctx.stroke();
    }
  }
}

function drawProjectiles(ctx,state,b){
  for(const p of state.projectiles){
    ctx.fillStyle=p.slow?"#9be7ff":p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.slow?7:6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.45)";ctx.beginPath();ctx.arc(p.x-2,p.y-2,2,0,Math.PI*2);ctx.fill();
  }
}

function drawOrbs(ctx,state,b){
  for(const o of state.orbs){
    const pos=cellToWorld(b,o.row,o.col);
    const y=pos.y-22-Math.sin(o.age*4)*5;
    const x=pos.x+o.drift*Math.sin(o.age*.9);
    const pulse=1+Math.sin(o.age*5)*.07;
    ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);
    const g=ctx.createRadialGradient(0,0,3,0,0,23);
    g.addColorStop(0,"#fffbd1");g.addColorStop(.38,"#f8d95d");g.addColorStop(1,"rgba(248,211,67,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffe46f";ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();
    ctx.restore();
    o.screenX=x;o.screenY=y;
  }
}

function drawParticles(ctx,state,b){
  for(const fx of state.particles){
    const t=clamp(fx.life/fx.max,0,1);
    if(fx.kind==="blast"){
      ctx.strokeStyle=`rgba(255,198,76,${t})`;ctx.lineWidth=8*t+2;
      ctx.beginPath();ctx.arc(fx.x,fx.y,fx.r*(1-t*.28),0,Math.PI*2);ctx.stroke();
    }else if(fx.kind==="enemyPop"){
      ctx.fillStyle=`rgba(110,125,92,${t*.55})`;
      ctx.beginPath();ctx.arc(fx.x,fx.y,34*(1-t*.2),0,Math.PI*2);ctx.fill();
    }else if(fx.kind==="lightning"){
      ctx.strokeStyle=`rgba(213,255,154,${t})`;ctx.lineWidth=4;
      let x=fx.from.x,y=fx.from.y;
      for(const p of fx.targets){
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p.x,p.y);ctx.stroke();x=p.x;y=p.y;
      }
    }else if(fx.kind==="stomp"){
      ctx.strokeStyle=`rgba(215,180,110,${t})`;ctx.lineWidth=6;
      ctx.beginPath();ctx.arc(fx.x,fx.y,70*(1-t*.25),0,Math.PI*2);ctx.stroke();
    }
  }
}

function drawTopHud(ctx,state,b,W,H){
  ctx.fillStyle="rgba(18,28,23,.82)";
  roundedRect(ctx,14,12,W-28,76,14);ctx.fill();

  ctx.fillStyle="#f7dc67";ctx.font="900 18px sans-serif";ctx.textAlign="left";
  ctx.fillText(`☀ ${Math.round(state.energy)}`,30,40);
  ctx.fillStyle="#edf2ef";ctx.font="800 13px sans-serif";
  ctx.fillText(`Score ${state.score.toLocaleString()}`,30,63);

  const center=W/2;
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 16px sans-serif";
  ctx.fillText(state.endless?`Endless · Wave ${state.wave}`:`${state.level.name} · Wave ${state.wave}/${state.totalWaves}`,center,37);
  ctx.fillStyle="#7f9187";ctx.fillRect(center-150,52,300,9);
  ctx.fillStyle="#67c876";ctx.fillRect(center-150,52,300*getWaveProgress(state),9);

  ctx.textAlign="right";ctx.fillStyle="#dbe6de";ctx.font="800 13px sans-serif";
  ctx.fillText(state.weather.toUpperCase(),W-30,38);
  ctx.fillStyle="#f0c967";ctx.fillText(`Combo ×${Math.max(1,state.combo)}`,W-30,61);

  const ox=W-205,oy=71,ow=175,oh=8;
  ctx.fillStyle="#2b352d";ctx.fillRect(ox,oy,ow,oh);
  ctx.fillStyle="#7be2a8";ctx.fillRect(ox,oy,ow*state.overgrowth/state.maxOvergrowth,oh);

  if(state.messageTimer>0){
    ctx.textAlign="center";
    ctx.font="900 21px sans-serif";
    ctx.fillStyle="rgba(20,28,23,.72)";
    roundedRect(ctx,center-180,95,360,38,10);ctx.fill();
    ctx.fillStyle="#fff";ctx.fillText(state.message,center,121);
  }
}
