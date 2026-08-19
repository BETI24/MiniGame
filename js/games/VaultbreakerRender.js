import { clamp,fmt } from "./VaultbreakerEngine.js";

function rr(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function hexToRgb(hex){
  const h=hex.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function mix(a,b,t){
  const A=hexToRgb(a),B=hexToRgb(b);
  return `rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`;
}

export function renderCenter(ctx,s,W,H){
  ctx.clearRect(0,0,W,H);
  drawBackdrop(ctx,W,H,s);
  if(!s.chest)return;

  const cx=W*.5,cy=H*.49;
  const scale=clamp(Math.min(W/620,H/520),.68,1.15);
  const boss=s.chest.boss;

  if(s.chest.opened){
    drawChest(ctx,s,cx,cy,scale,boss,true);
  }else drawChest(ctx,s,cx,cy,scale,boss,false);

  drawHp(ctx,s,W,H,cx,cy,scale);
  drawParticles(ctx,s,W,H);
  drawFloats(ctx,s,W,H);
}

function drawBackdrop(ctx,W,H,s){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#201b17");g.addColorStop(1,"#100e0d");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="rgba(188,151,93,.045)";
  for(let i=0;i<9;i++){
    ctx.beginPath();
    const x=(i*137+(s.chestStage%7)*17)%W;
    ctx.moveTo(x,0);ctx.lineTo(x+150,H);ctx.lineTo(x+260,H);ctx.lineTo(x+90,0);ctx.closePath();ctx.fill();
  }
  const glow=ctx.createRadialGradient(W*.5,H*.50,10,W*.5,H*.50,Math.min(W,H)*.40);
  glow.addColorStop(0,"rgba(215,168,71,.18)");glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
}

function drawChest(ctx,s,cx,cy,sc,boss,opened){
  const c=s.chest.def;
  const flash=s.chest.hitFlash>0;
  const wob=s.chest.wobble>0?Math.sin(s.chest.wobble*80)*5*s.chest.wobble:.0;
  ctx.save();ctx.translate(cx+wob,cy);ctx.scale(sc*(boss?1.12:1),sc*(boss?1.12:1));
  if(flash){ctx.shadowColor="#fff";ctx.shadowBlur=24;}
  else{ctx.shadowColor=c.main;ctx.shadowBlur=boss?24:10;}

  // Rays on boss/open.
  if(boss||opened){
    ctx.save();ctx.globalAlpha=opened?.32:.12;ctx.fillStyle=opened?"#ffda68":c.main;
    for(let i=0;i<12;i++){
      ctx.rotate(Math.PI*2/12);
      ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-22,-150);ctx.lineTo(22,-150);ctx.closePath();ctx.fill();
    }ctx.restore();
  }

  // Base.
  ctx.fillStyle=c.dark;rr(ctx,-92,-22,184,102,13);ctx.fill();
  ctx.strokeStyle=mix(c.dark,"#ffffff",.28);ctx.lineWidth=6;ctx.stroke();

  // Planks.
  ctx.fillStyle=c.main;rr(ctx,-76,-6,152,63,8);ctx.fill();
  ctx.fillStyle=mix(c.main,"#000000",.18);ctx.fillRect(-73,15,146,8);
  ctx.fillStyle=mix(c.main,"#ffffff",.20);ctx.fillRect(-70,-1,140,7);

  // Metal corners.
  ctx.fillStyle=mix(c.dark,"#d6d7dc",.62);
  for(const sx of [-1,1]){
    rr(ctx,sx*72-10,-17,20,82,6);ctx.fill();
  }

  // Lock.
  ctx.fillStyle="#c7cbd3";rr(ctx,-21,18,42,42,7);ctx.fill();
  ctx.fillStyle="#4a4e54";ctx.beginPath();ctx.arc(0,33,7,0,Math.PI*2);ctx.fill();ctx.fillRect(-3,33,6,14);

  // Lid.
  const lidY=opened?-74:-66,lidRot=opened?-.32:0;
  ctx.save();ctx.translate(0,lidY);ctx.rotate(lidRot);
  ctx.fillStyle=c.dark;rr(ctx,-93,-47,186,58,15);ctx.fill();
  ctx.strokeStyle=mix(c.dark,"#ffffff",.30);ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle=c.main;rr(ctx,-76,-35,152,34,8);ctx.fill();
  ctx.fillStyle=mix(c.main,"#ffffff",.18);ctx.fillRect(-70,-29,140,6);
  ctx.restore();

  // Tier details.
  const stars=Math.min(5,1+Math.floor((c.tier-1)/6));
  ctx.fillStyle="#f6d870";ctx.font="900 13px sans-serif";ctx.textAlign="center";
  ctx.fillText("◆".repeat(stars),0,75);
  if(boss){
    ctx.fillStyle="#ffcf59";ctx.font="1000 12px sans-serif";ctx.fillText("BOSS VAULT",-0,-94);
  }
  ctx.restore();
}

function drawHp(ctx,s,W,H,cx,cy,sc){
  const barW=clamp(W*.50,240,420),barH=22,x=cx-barW/2,y=cy-155*sc;
  const pct=clamp(s.chest.hp/s.chest.maxHp,0,1);
  ctx.fillStyle="rgba(4,4,4,.78)";rr(ctx,x-3,y-3,barW+6,barH+6,5);ctx.fill();
  const g=ctx.createLinearGradient(x,0,x+barW,0);
  g.addColorStop(0,s.chest.boss?"#d34d45":"#b23f38");g.addColorStop(1,s.chest.boss?"#ff7b4f":"#e55d4f");
  ctx.fillStyle=g;rr(ctx,x,y,barW*pct,barH,3);ctx.fill();
  ctx.textAlign="center";ctx.font="900 12px sans-serif";ctx.fillStyle="#fff";
  ctx.fillText(`${fmt(s.chest.hp)} / ${fmt(s.chest.maxHp)}`,cx,y+15);
}

function drawParticles(ctx,s,W,H){
  for(const p of s.particles){
    const a=clamp(p.life/p.max,0,1);
    const x=p.x*W,y=p.y*H,sz=(p.size||1)*11;
    ctx.save();ctx.translate(x,y);ctx.rotate(p.rot||0);ctx.globalAlpha=Math.min(1,a*1.4);
    ctx.shadowColor=p.color;ctx.shadowBlur=p.kind==="crit"?10:4;
    if(p.kind==="coin"){
      ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,sz*.72,sz,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#b27b16";ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle="#fff3a1";ctx.fillRect(-2,-sz*.55,4,sz*1.1);
    }else if(p.kind==="star"||p.kind==="crit"){
      ctx.fillStyle=p.color;ctx.beginPath();
      for(let i=0;i<8;i++){const r=i%2?sz*.35:sz;const a2=-Math.PI/2+i*Math.PI/4;const xx=Math.cos(a2)*r,yy=Math.sin(a2)*r;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
      ctx.closePath();ctx.fill();
    }else if(p.kind==="gem"){
      ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz*.72,0);ctx.lineTo(0,sz);ctx.lineTo(-sz*.72,0);ctx.closePath();ctx.fill();
    }else{
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,sz*.65,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}
function drawFloats(ctx,s,W,H){
  for(const f of s.floats){
    const a=clamp(f.life/f.max,0,1);
    ctx.save();ctx.globalAlpha=Math.min(1,a*1.6);ctx.textAlign="center";
    ctx.font=`1000 ${Math.round(17*(f.scale||1))}px sans-serif`;
    ctx.lineWidth=4;ctx.strokeStyle="rgba(0,0,0,.72)";
    ctx.strokeText(f.text,f.x*W,f.y*H);ctx.fillStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=8;
    ctx.fillText(f.text,f.x*W,f.y*H);ctx.restore();
  }
}
