const DIFFICULTY={
  easy:{label:'Easy',aim:.20,reaction:.55,speed:.92},
  normal:{label:'Normal',aim:.11,reaction:.34,speed:1},
  hard:{label:'Hard',aim:.055,reaction:.20,speed:1.08}
};
const PRESETS={
  quick:{label:'Quick',bots:11,size:2700,loot:165},
  standard:{label:'Standard',bots:19,size:3900,loot:275}
};
const WEAPONS={
  pistol:{name:'9mm Pistol',ammo:'9mm',damage:24,rate:3.2,speed:760,spread:.045,mag:12,reload:1.25,range:650,color:'#7bdcff'},
  smg:{name:'SMG',ammo:'9mm',damage:15,rate:10,speed:720,spread:.075,mag:28,reload:1.5,range:540,color:'#66e3ad'},
  shotgun:{name:'Shotgun',ammo:'12g',damage:13,rate:1.0,speed:650,spread:.17,mag:5,reload:1.8,range:380,color:'#ffb861',pellets:7},
  rifle:{name:'Rifle',ammo:'556',damage:29,rate:6,speed:900,spread:.04,mag:30,reload:1.75,range:820,color:'#ff829d'},
  dmr:{name:'DMR',ammo:'762',damage:48,rate:2.1,speed:1020,spread:.02,mag:10,reload:1.95,range:1000,color:'#b884ff'}
};
const CFG={move:205,playerR:19,botR:18,maxHp:100,maxArmor:100,pickup:62,medHeal:55,medTime:2.8,
zone:[
 {wait:36,shrink:30,r:.72,dmg:3},{wait:30,shrink:26,r:.50,dmg:5},
 {wait:24,shrink:22,r:.33,dmg:8},{wait:20,shrink:18,r:.20,dmg:12},
 {wait:16,shrink:15,r:.10,dmg:18},{wait:12,shrink:12,r:.045,dmg:28}
]};

const GEAR={
  vest:{
    0:{armor:0,absorb:0},
    1:{armor:50,absorb:.18},
    2:{armor:75,absorb:.28},
    3:{armor:100,absorb:.38}
  },
  helmet:{
    0:{reduction:0},
    1:{reduction:.05},
    2:{reduction:.10},
    3:{reduction:.16}
  },
  backpack:{
    0:{ammo:100,med:1},
    1:{ammo:165,med:2},
    2:{ammo:255,med:3},
    3:{ammo:390,med:5}
  }
};

export default{
  manifest:{
    id:'survival-royale',
    name:'Survival Royale',
    description:'Top-down Battle Royale gegen KI: looten, schießen, Deckung nutzen und der Zone entkommen.',
    icon:'🎯',
    tags:['Battle Royale','Shooter','AI',]
  },
  init:(container,services)=>{
    let dead=false,raf=0,last=performance.now(),running=false,ended=false;
    let presetKey='standard',diffKey='normal',preset=PRESETS[presetKey],diff=DIFFICULTY[diffKey];
    let W=1,H=1,dpr=1,worldSize=preset.size,time=0,kills=0,damageDone=0,placement=0;
    let cam={x:0,y:0,zoom:1.42,targetZoom:1.42},mouse={x:0,y:0,wx:0,wy:0,down:false},keys={w:false,a:false,s:false,d:false,shift:false};
    let player=null,bots=[],bullets=[],loot=[],objects=[],houses=[],crates=[],fx=[],feed=[],zone=null,nextId=1;
    let muted=false,audio=null;

    const style=document.createElement('style');
    style.textContent=`
    .br{position:relative;width:100%;height:100%;overflow:hidden;background:#6f9d43;color:#f4f7fa;font-family:inherit;user-select:none}
    .br *{box-sizing:border-box}.br canvas{width:100%;height:100%;display:block;cursor:crosshair}
    .br-top{position:absolute;z-index:8;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;pointer-events:none}
    .br-row{display:flex;gap:6px}.br-chip{min-width:84px;padding:7px 9px;border:1px solid #ffffff18;border-radius:8px;background:#111a24d9;backdrop-filter:blur(8px)}
    .br-l{font-size:.52rem;color:#8393a3;font-weight:900;text-transform:uppercase}.br-v{font-size:.88rem;font-weight:950;margin-top:1px}
    .br-help{position:absolute;z-index:8;top:13px;left:50%;transform:translateX(-50%);padding:6px 10px;border-radius:99px;background:#111a24b9;border:1px solid #ffffff12;color:#8998a7;font-size:.57rem;font-weight:800;pointer-events:none;white-space:nowrap}
    .br-map{position:absolute;z-index:8;left:12px;bottom:12px;width:165px;height:165px;border:2px solid #111;background:#6f9d43;pointer-events:none}.br-map canvas{cursor:default}
    .br-bottom{position:absolute;z-index:9;left:50%;bottom:12px;transform:translateX(-50%);width:min(500px,calc(100% - 380px));pointer-events:none}
    .br-bars{display:grid;gap:5px;margin-bottom:8px}.br-bar{background:#12171d;border:2px solid #0009;overflow:hidden}.br-bar:first-child{height:21px}.br-bar:last-child{height:10px}.br-hp{height:100%;background:#ef676b}.br-arm{height:100%;background:#59c8ee}
    .br-inv{display:grid;grid-template-columns:1fr 1fr 70px;gap:5px}.br-slot{min-height:53px;padding:6px 8px;background:#161e27e8;border:2px solid #0009;border-radius:5px}.br-slot.on{border-color:#38d9ff}
    .br-key{font-size:.49rem;color:#738394;font-weight:900}.br-name{font-size:.71rem;font-weight:950;margin-top:1px}.br-ammo{font-size:.60rem;color:#99a8b6;margin-top:2px}.br-med{text-align:center;font-weight:950;color:#66dc7d;margin-top:5px}
    .br-pick{position:absolute;z-index:10;left:50%;bottom:84px;transform:translateX(-50%);opacity:0;padding:7px 10px;border-radius:6px;background:#111923e8;border:1px solid #ffffff18;font-size:.65rem;font-weight:850;pointer-events:none}.br-pick.show{opacity:1}
    .br-use{position:absolute;z-index:10;left:50%;top:70px;transform:translateX(-50%);width:270px;opacity:0}.br-use.show{opacity:1}.br-use-t{font-size:.62rem;text-align:center;font-weight:900}.br-use-b{height:7px;background:#0008;margin-top:4px}.br-use-f{height:100%;background:#65dc7d}
    .br-feed{position:absolute;z-index:8;right:12px;top:72px;width:250px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none}.br-feed div{max-width:100%;padding:4px 7px;background:#121922bd;border-radius:4px;font-size:.58rem;color:#cbd4dd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .br-sound{position:absolute;z-index:12;right:12px;bottom:12px;padding:7px 9px;border-radius:7px;border:1px solid #ffffff15;background:#111922dc;color:#a9b7c4;font:inherit;font-size:.61rem;font-weight:850;cursor:pointer}
    .br-ov{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:#06090dc7;backdrop-filter:blur(7px)}.br-ov.hide{display:none}
    .br-card{width:min(930px,100%);padding:30px;border-radius:18px;background:linear-gradient(#202c39,#111922);border:1px solid #ffffff17;box-shadow:0 30px 90px #0007}.br-k{font-size:.69rem;color:#38d9ff;font-weight:950;letter-spacing:.15em;text-transform:uppercase}
    .br-title{font-size:clamp(2.7rem,5vw,4.3rem);font-weight:950;line-height:1;margin:6px 0 8px;letter-spacing:-.045em}.br-desc{color:#91a1b1;line-height:1.5;max-width:780px}
    .br-how{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.br-how>div{padding:11px;border:1px solid #ffffff10;border-radius:10px;background:#ffffff06}.br-how b{display:block;font-size:.76rem;margin-bottom:3px}.br-how span{font-size:.64rem;color:#7d8d9d;line-height:1.35}
    .br-sec{margin:13px 0 7px;font-size:.67rem;font-weight:900;color:#cbd5df;text-transform:uppercase;letter-spacing:.08em}.br-opts{display:grid;gap:8px}.br-opts.p{grid-template-columns:1fr 1fr}.br-opts.d{grid-template-columns:repeat(3,1fr)}
    .br-opt{padding:12px;border-radius:9px;border:1px solid #ffffff13;background:#ffffff06;color:#eef3f7;font:inherit;text-align:left;cursor:pointer}.br-opt.sel{border-color:#38d9ff99;background:#38d9ff12}.br-opt b{display:block;font-size:.82rem}.br-opt span{display:block;margin-top:2px;font-size:.64rem;color:#7d8e9f}
    .br-start{width:100%;margin-top:19px;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#38d9ff,#4b84ff);color:#061116;font:inherit;font-weight:950;cursor:pointer}
    .br-end-title{font-size:2.3rem;font-weight:950;margin-bottom:6px}.br-end-sub{color:#91a1b1;margin-bottom:16px}.br-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.br-stat{padding:11px;text-align:center;background:#ffffff06;border:1px solid #ffffff10}.br-stat span{font-size:.56rem;color:#7b8c9e;text-transform:uppercase}.br-stat b{display:block;margin-top:3px}
    @media(max-width:800px){.br-help{display:none}.br-bottom{width:min(470px,calc(100% - 24px));bottom:8px}.br-map{width:120px;height:120px;bottom:86px;left:7px}.br-sound{bottom:86px;right:7px}.br-how{grid-template-columns:1fr 1fr}.br-opts.d{grid-template-columns:1fr}.br-stats{grid-template-columns:1fr 1fr}}

    /* V1.3: stärker an klassischer Surviv.io-HUD-Anordnung orientiert */
    .br-top{left:auto;right:12px;top:10px;width:108px;display:block}
    .br-row{display:block}
    .br-chip{display:none}
    .br-alive-panel{
      width:108px;padding:7px 8px 9px;border-radius:4px;
      background:#263728d9;border:1px solid #ffffff12;text-align:center;
      box-shadow:0 5px 14px #0003
    }
    .br-alive-count{font-size:1.65rem;line-height:1;font-weight:950}
    .br-alive-word{margin-top:2px;font-size:.58rem;font-weight:900;color:#d9e3d2;text-transform:uppercase}
    .br-kill-count{font-size:.60rem;color:#ff7b83;font-weight:950;margin-bottom:5px}
    .br-zone-card{
      position:absolute;z-index:9;left:12px;bottom:184px;
      padding:6px 8px;border-radius:4px;background:#283326d9;border:1px solid #ffffff12;
      font-size:.62rem;font-weight:950;color:#f4f4e7;pointer-events:none
    }
    .br-zone-card span{color:#ffd166}
    .br-feed{top:83px;right:12px;width:285px}
    .br-feed div{border-radius:2px;background:#1c261fd8;font-size:.57rem}
    .br-bottom{width:min(470px,42vw);bottom:12px}
    .br-bars{gap:3px;margin:0}
    .br-bar:first-child{height:26px;border:3px solid #202421;border-radius:2px}
    .br-bar:last-child{height:8px;border:1px solid #202421}
    .br-health-label{
      position:absolute;left:0;right:0;bottom:9px;text-align:center;
      font-size:.62rem;font-weight:950;color:#fff;pointer-events:none;text-shadow:0 1px 2px #000
    }
    .br-inv{display:none}
    .br-gear{
      position:absolute;z-index:10;right:12px;bottom:62px;width:144px;
      display:flex;flex-direction:column;gap:5px;pointer-events:none
    }
    .br-gear-slot{
      min-height:49px;padding:6px 8px;border-radius:3px;border:2px solid #1d211f;
      background:#30392fdd;position:relative
    }
    .br-gear-slot.on{border-color:#dfeee4;background:#435044e8}
    .br-gear-key{
      position:absolute;left:5px;top:4px;color:#d7dfd5;font-size:.56rem;font-weight:950
    }
    .br-gear-name{margin-left:18px;font-size:.71rem;font-weight:950;color:#f2f5f1}
    .br-gear-ammo{margin-left:18px;margin-top:3px;font-size:.60rem;color:#c0cbc1;font-weight:850}
    .br-fists-icon{
      position:absolute;right:9px;top:11px;width:25px;height:25px
    }
    .br-fists-icon:before,.br-fists-icon:after{
      content:"";position:absolute;width:11px;height:16px;border-radius:7px;background:#e9bd76;border:2px solid #73583c
    }
    .br-fists-icon:before{left:1px;transform:rotate(-22deg)}
    .br-fists-icon:after{right:1px;transform:rotate(22deg)}
    .br-ammo-panel{
      padding:6px;border-radius:3px;background:#293129db;border:1px solid #1e241e;
      display:grid;grid-template-columns:1fr 1fr;gap:4px
    }
    .br-ammo-cell{
      display:flex;align-items:center;justify-content:space-between;gap:4px;
      padding:4px 5px;background:#202720c9;font-size:.55rem;font-weight:950;color:#dce3dc
    }
    .br-ammo-dot{width:8px;height:8px;display:inline-block;border-radius:1px;margin-right:3px}
    .br-medbox{padding:6px 8px;background:#30392fdd;border:2px solid #1d211f;border-radius:3px;font-size:.62rem;font-weight:950}
    .br-medbox .br-med{display:inline;margin-left:5px}
    .br-map{width:165px;height:165px}
    .br-sound{bottom:12px}
    .br-pick{display:none}
    .br-help{top:12px}

    .br-scope-hud{
      position:absolute;z-index:10;left:50%;top:12px;transform:translateX(-50%);
      display:flex;gap:7px;align-items:center;pointer-events:none
    }
    .br-scope-chip{
      width:34px;height:34px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #1d2322;background:#3a443bd9;
      color:#aeb9ae;font-size:.62rem;font-weight:950;
      box-shadow:0 3px 8px #0003
    }
    .br-scope-chip.on{
      width:42px;height:42px;
      color:#fff;border-color:#e9efe8;background:#596454e8;
      box-shadow:0 0 0 3px #ffffff16
    }

    .br-gear{
      width:204px;
      bottom:66px;
      gap:6px;
      padding:7px;
      background:#1b211bdd;
      border:2px solid #101410;
      border-radius:3px
    }
    .br-gear-slot{
      min-height:64px;
      padding:9px 11px;
      border-width:2px
    }
    .br-gear-key{
      left:7px;top:6px;font-size:.65rem
    }
    .br-gear-name{
      margin-left:24px;
      font-size:.86rem
    }
    .br-gear-ammo{
      margin-left:24px;
      margin-top:5px;
      font-size:.72rem
    }
    .br-fists-icon{
      width:34px;height:34px;right:12px;top:14px
    }
    .br-fists-icon:before,.br-fists-icon:after{
      width:14px;height:21px
    }
    .br-ammo-panel{
      padding:8px;
      gap:6px
    }
    .br-ammo-cell{
      min-height:30px;
      padding:5px 7px;
      font-size:.66rem
    }
    .br-ammo-dot{
      width:11px;height:11px
    }
    .br-medbox{
      padding:9px 10px;
      font-size:.72rem
    }


    .br-equipment{
      display:grid;grid-template-columns:repeat(3,1fr);gap:5px
    }
    .br-equip{
      min-height:47px;padding:5px 3px;border:1px solid #111711;
      background:#272f27;text-align:center;border-radius:2px
    }
    .br-equip-icon{
      width:25px;height:22px;margin:0 auto 3px;position:relative
    }
    .br-equip-label{
      color:#b8c2b8;font-size:.49rem;font-weight:900;text-transform:uppercase
    }
    .br-equip-level{
      color:#f0f3ee;font-size:.62rem;font-weight:950;margin-top:1px
    }
    .br-equip.helmet .br-equip-icon:before{
      content:"";position:absolute;left:3px;right:3px;bottom:2px;height:13px;
      border:3px solid #dfe6df;border-bottom-width:5px;border-radius:14px 14px 5px 5px
    }
    .br-equip.vest .br-equip-icon:before{
      content:"";position:absolute;left:5px;right:5px;top:2px;bottom:1px;
      border:3px solid #dfe6df;border-radius:3px;
      clip-path:polygon(15% 0,38% 0,43% 18%,57% 18%,62% 0,85% 0,100% 25%,84% 100%,16% 100%,0 25%)
    }
    .br-equip.bag .br-equip-icon:before{
      content:"";position:absolute;left:6px;right:6px;top:5px;bottom:1px;
      border:3px solid #dfe6df;border-radius:4px
    }
    .br-equip.bag .br-equip-icon:after{
      content:"";position:absolute;left:9px;right:9px;top:0;height:8px;
      border:3px solid #dfe6df;border-bottom:0;border-radius:7px 7px 0 0
    }

    @media(max-width:800px){
      .br-top{right:7px}.br-alive-panel{width:86px}.br-feed{right:7px;width:210px}
      .br-map{width:116px;height:116px;bottom:112px}
      .br-zone-card{left:7px;bottom:234px}
      .br-gear{right:7px;bottom:58px;width:150px}
      .br-bottom{width:min(380px,calc(100% - 160px));bottom:8px}
      .br-sound{display:none}
    }
    `;
    const root=document.createElement('div');root.className='br';
    root.innerHTML=`
      <canvas class="br-main"></canvas>

      <div class="br-top">
        <div class="br-alive-panel">
          <div class="br-kill-count"><span class="kills">0</span> KILLS</div>
          <div class="br-alive-count alive">20</div>
          <div class="br-alive-word">Alive</div>
        </div>
      </div>

      <div class="br-zone-card">☢ <span class="ztxt">Waiting</span></div>

      <div class="br-scope-hud">
        <div class="br-scope-chip scope1 on">1x</div>
        <div class="br-scope-chip scope2">2x</div>
        <div class="br-scope-chip scope4">4x</div>
        <div class="br-scope-chip scope8">8x</div>
      </div>

      <div class="br-help">WASD Move · Mouse Aim · LMB Attack · E Loot · R Reload · 1 Fists · 2/3 Weapons · Q Medkit</div>
      <div class="br-feed"></div>

      <div class="br-map"><canvas></canvas></div>

      <div class="br-bottom">
        <div class="br-bars">
          <div class="br-bar"><div class="br-hp"></div></div>
          <div class="br-bar"><div class="br-arm"></div></div>
        </div>
        <div class="br-health-label"><span class="br-hp-number">100</span> HP</div>
      </div>

      <div class="br-gear">
        <div class="br-gear-slot fists on">
          <div class="br-gear-key">1</div>
          <div class="br-gear-name">Fists</div>
          <div class="br-gear-ammo">Melee</div>
          <div class="br-fists-icon"></div>
        </div>

        <div class="br-gear-slot s0">
          <div class="br-gear-key">2</div>
          <div class="br-gear-name br-name">Empty</div>
          <div class="br-gear-ammo br-ammo">—</div>
        </div>

        <div class="br-gear-slot s1">
          <div class="br-gear-key">3</div>
          <div class="br-gear-name br-name">Empty</div>
          <div class="br-gear-ammo br-ammo">—</div>
        </div>

        <div class="br-ammo-panel">
          <div class="br-ammo-cell"><span><i class="br-ammo-dot" style="background:#f3d35c"></i>9mm</span><b class="am9">0</b></div>
          <div class="br-ammo-cell"><span><i class="br-ammo-dot" style="background:#e7674f"></i>12g</span><b class="am12">0</b></div>
          <div class="br-ammo-cell"><span><i class="br-ammo-dot" style="background:#70cf67"></i>5.56</span><b class="am556">0</b></div>
          <div class="br-ammo-cell"><span><i class="br-ammo-dot" style="background:#7197eb"></i>7.62</span><b class="am762">0</b></div>
        </div>

        <div class="br-equipment">
          <div class="br-equip helmet">
            <div class="br-equip-icon"></div>
            <div class="br-equip-label">Helmet</div>
            <div class="br-equip-level eq-helmet">—</div>
          </div>
          <div class="br-equip vest">
            <div class="br-equip-icon"></div>
            <div class="br-equip-label">Vest</div>
            <div class="br-equip-level eq-vest">—</div>
          </div>
          <div class="br-equip bag">
            <div class="br-equip-icon"></div>
            <div class="br-equip-label">Bag</div>
            <div class="br-equip-level eq-bag">—</div>
          </div>
        </div>

        <div class="br-medbox">Q · Medkit <span class="br-med">×1</span></div>
      </div>

      <div class="br-pick"></div>
      <div class="br-use"><div class="br-use-t">Using Medkit...</div><div class="br-use-b"><div class="br-use-f"></div></div></div>
      <button class="br-sound" type="button">Sound: An</button>
      <div class="br-ov menu"><div class="br-card">
        <div class="br-k">Top-Down Battle Royale / Singleplayer</div><div class="br-title">Survival Royale</div>
        <div class="br-desc">Inspiriert von klassischen Browser-Battle-Royales: große Top-Down-Map, begehbare Gebäude, Loot, Waffen, KI-Gefechte, Deckung und eine Safe Zone, die das Match immer weiter zusammenzieht.</div>
        <div class="br-how"><div><b>WASD + Maus</b><span>Bewegen und zielen. Du startest mit Fäusten; LMB schlägt oder schießt.</span></div><div><b>Looten</b><span>Loot liegt in Gebäuden oder steckt in zerstörbaren Kisten. E hebt Gegenstände auf.</span></div><div><b>Kisten & Deckung</b><span>Kisten haben versteckte HP, schrumpfen bei Schaden und droppen Loot. Wände stoppen Kugeln.</span></div><div><b>Zone</b><span>Außerhalb des Kreises bekommst du immer stärkeren Schaden.</span></div></div>
        <div class="br-sec">Match</div><div class="br-opts p">${Object.entries(PRESETS).map(([k,v])=>`<button class="br-opt ${k===presetKey?'sel':''}" data-p="${k}" type="button"><b>${v.label}</b><span>${v.bots+1} Teilnehmer · ${v.size}px Map</span></button>`).join('')}</div>
        <div class="br-sec">Bot Difficulty</div><div class="br-opts d">${Object.entries(DIFFICULTY).map(([k,v])=>`<button class="br-opt ${k===diffKey?'sel':''}" data-d="${k}" type="button"><b>${v.label}</b><span>${k==='easy'?'Ungenauer und langsamer':k==='hard'?'Schnelle, präzise Gegner':'Ausgewogene Gegner'}</span></button>`).join('')}</div>
        <button class="br-start" type="button">Battle Royale starten</button>
      </div></div>
      <div class="br-ov end hide"><div class="br-card"><div class="br-end-title"></div><div class="br-end-sub"></div><div class="br-stats">
        <div class="br-stat"><span>Placement</span><b class="ep">#1</b></div><div class="br-stat"><span>Kills</span><b class="ek">0</b></div><div class="br-stat"><span>Damage</span><b class="ed">0</b></div><div class="br-stat"><span>Time</span><b class="et">0:00</b></div><div class="br-stat"><span>Score</span><b class="es">0</b></div>
      </div><button class="br-start restart" type="button">Nochmal</button></div></div>`;
    container.append(style,root);

    const canvas=root.querySelector('.br-main'),ctx=canvas.getContext('2d');
    const mini=root.querySelector('.br-map canvas'),mctx=mini.getContext('2d');
    const $=s=>root.querySelector(s), $$=s=>[...root.querySelectorAll(s)];
    const aliveEl=$('.alive'),killsEl=$('.kills'),zoneEl=$('.ztxt'),hpEl=$('.br-hp'),armEl=$('.br-arm'),pickEl=$('.br-pick'),feedEl=$('.br-feed'),useEl=$('.br-use'),useFill=$('.br-use-f');
    const slots=[$('.s0'),$('.s1')],fistsEl=$('.fists'),medEl=$('.br-med'),hpNumberEl=$('.br-hp-number'),
      ammoEls={'9mm':$('.am9'),'12g':$('.am12'),'556':$('.am556'),'762':$('.am762')},
      scopeEls={1:$('.scope1'),2:$('.scope2'),4:$('.scope4'),8:$('.scope8')},
      equipEls={helmet:$('.eq-helmet'),vest:$('.eq-vest'),backpack:$('.eq-bag')},
      menu=$('.menu'),end=$('.end');
    const rand=(a,b)=>a+Math.random()*(b-a), rint=(a,b)=>Math.floor(rand(a,b+1)), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const names=['Lucky','Nova','Crow','Echo','Moss','Viper','Rex','Pixel','Ghost','Bolt','Mango','Frost','Mako','Wolf','Jinx','Ace','Luna','Drift','Quill','Zero'];let nameI=0;
    const makeGun=(id,mag=null)=>({id,mag:mag??WEAPONS[id].mag,reload:0,cool:0});
    const makeChar=(x,y,isP=false)=>({
      id:nextId++,
      x,y,
      r:isP?CFG.playerR:CFG.botR,
      isP,
      name:isP?'YOU':names[nameI++%names.length],
      hp:100,
      armor:0,
      vest:0,
      helmet:0,
      backpack:0,
      alive:true,
      angle:0,
      color:isP?'#efc178':`hsl(${rint(0,359)} 55% 67%)`,
      guns:[null,null],
      slot:-1,
      ammo:{'9mm':0,'12g':0,'556':0,'762':0},
      med:1,
      scope:1,
      using:false,
      useT:0,
      meleeCool:0,
      ai:isP?null:{
        think:rand(.1,.5),
        target:null,
        move:null,
        strafe:Math.random()<.5?-1:1
      }
    });
    const weapon=e=>e.slot<0?null:e.guns[e.slot], fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t)%60).padStart(2,'0')}`;
    const ensureAudio=()=>{if(muted)return null;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}};
    const tone=(f,d=.035,v=.015,type='square')=>{const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)};

    function resize(){const r=root.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);canvas.style.width=W+'px';canvas.style.height=H+'px';}
    function rectHit(x,y,r,o){const nx=clamp(x,o.x,o.x+o.w),ny=clamp(y,o.y,o.y+o.h);return Math.hypot(x-nx,y-ny)<r}
    function blocked(e,x,y){
      for(const o of objects)if(o.solid&&Math.hypot(x-o.x,y-o.y)<e.r+o.r)return true;
      for(const c of crates)if(c.on&&Math.hypot(x-c.x,y-c.y)<e.r+c.r*c.scale)return true;
      for(const h of houses)for(const w of houseWalls(h))if(rectHit(x,y,e.r,w))return true;
      return false
    }
    function move(e,dx,dy){let nx=clamp(e.x+dx,e.r,worldSize-e.r);if(!blocked(e,nx,e.y))e.x=nx;let ny=clamp(e.y+dy,e.r,worldSize-e.r);if(!blocked(e,e.x,ny))e.y=ny}
    function openPoint(){for(let n=0;n<120;n++){const p={x:rand(70,worldSize-70),y:rand(70,worldSize-70)};if(!objects.some(o=>o.solid&&dist(p,o)<o.r+35)&&!crates.some(c=>c.on&&dist(p,c)<c.r+28)&&!houses.some(h=>p.x>h.x-30&&p.x<h.x+h.w+30&&p.y>h.y-30&&p.y<h.y+h.h+30))return p}return{x:rand(70,worldSize-70),y:rand(70,worldSize-70)}}
    function splitWallVertical(x,y,h,doorY,thickness=12,door=46){
      const top=Math.max(0,doorY-door/2-y);
      const bottomStart=doorY+door/2;
      const result=[];

      if(top>6){
        result.push({x,y,w:thickness,h:top});
      }

      const bottom=(y+h)-bottomStart;

      if(bottom>6){
        result.push({x,y:bottomStart,w:thickness,h:bottom});
      }

      return result;
    }

    function splitWallHorizontal(x,y,w,doorX,thickness=12,door=46){
      const left=Math.max(0,doorX-door/2-x);
      const rightStart=doorX+door/2;
      const result=[];

      if(left>6){
        result.push({x,y,w:left,h:thickness});
      }

      const right=(x+w)-rightStart;

      if(right>6){
        result.push({x:rightStart,y,w:right,h:thickness});
      }

      return result;
    }

    function makeHouse(x,y,w,h){
      const t=14;
      const door=82;
      const side=rint(0,3);
      const warehouse=Math.random()<.25;
      const walls=[];

      // Vier Außenwände, eine Seite besitzt eine breite Türöffnung.
      if(side===0){
        walls.push(
          ...splitWallHorizontal(x,y,w,x+w*.5,t,door),
          {x,y:y+h-t,w,h:t},
          {x,y,w:t,h},
          {x:x+w-t,y,w:t,h}
        );
      }else if(side===2){
        walls.push(
          {x,y,w,h:t},
          ...splitWallHorizontal(x,y+h-t,w,x+w*.5,t,door),
          {x,y,w:t,h},
          {x:x+w-t,y,w:t,h}
        );
      }else if(side===1){
        walls.push(
          {x,y,w,h:t},
          {x,y:y+h-t,w,h:t},
          {x,y,w:t,h},
          ...splitWallVertical(x+w-t,y,h,y+h*.5,t,door)
        );
      }else{
        walls.push(
          {x,y,w,h:t},
          {x,y:y+h-t,w,h:t},
          ...splitWallVertical(x,y,h,y+h*.5,t,door),
          {x:x+w-t,y,w:t,h}
        );
      }

      const innerWalls=[];
      const furniture=[];

      if(!warehouse){
        // 2–4 echte Räume mit Türöffnungen.
        if(w>250){
          const px=x+w*rand(.43,.60);
          innerWalls.push(
            ...splitWallVertical(
              px,
              y+t,
              h-t*2,
              y+h*rand(.42,.65),
              10,
              44
            )
          );
        }

        if(h>215 && Math.random()<.92){
          const py=y+h*rand(.43,.62);
          innerWalls.push(
            ...splitWallHorizontal(
              x+t,
              py,
              w-t*2,
              x+w*rand(.35,.70),
              10,
              44
            )
          );
        }

        if(w>390 && Math.random()<.70){
          const px2=x+w*rand(.68,.79);

          innerWalls.push(
            ...splitWallVertical(
              px2,
              y+t,
              h-t*2,
              y+h*rand(.30,.72),
              10,
              46
            )
          );
        }

        const furnitureCount=rint(7,12);

        for(let i=0;i<furnitureCount;i++){
          const roll=Math.random();
          const type=
            roll<.30
              ?'table'
              :roll<.55
                ?'bed'
                :roll<.78
                  ?'cabinet'
                  :'rug';

          const fw=
            type==='bed'
              ?rand(34,48)
              :type==='rug'
                ?rand(42,64)
                :rand(25,40);

          const fh=
            type==='bed'
              ?rand(22,30)
              :type==='rug'
                ?rand(30,46)
                :rand(20,34);

          furniture.push({
            type,
            x:rand(x+27,x+w-fw-27),
            y:rand(y+27,y+h-fh-27),
            w:fw,
            h:fh,
            rot:Math.random()<.5?0:Math.PI/2
          });
        }
      }else{
        // Warehouses wirken offener, bekommen dafür Regale/Kistenreihen.
        const rows=rint(2,4);

        for(let i=0;i<rows;i++){
          furniture.push({
            type:'shelf',
            x:x+rand(28,w-72),
            y:y+28+i*((h-56)/Math.max(1,rows-1)),
            w:rand(50,78),
            h:14,
            rot:0
          });
        }
      }

      return{
        id:nextId++,
        x,y,w,h,
        walls,
        innerWalls,
        furniture,
        warehouse,
        roofColor:warehouse?'#283b49':'#6d3029',
        roofAccent:warehouse?'#41596b':'#9b4935',
        doorSide:side
      };
    }

    function houseWalls(h){
      return h.innerWalls?.length
        ?h.walls.concat(h.innerWalls)
        :h.walls;
    }

    function houseEntrance(h){
      const depth=34;
      const half=44;

      if(h.doorSide===0){
        return{
          x:h.x+h.w*.5,
          y:h.y,
          insideX:h.x+h.w*.5,
          insideY:h.y+22,
          outsideX:h.x+h.w*.5,
          outsideY:h.y-depth*.5,
          pad:{x:h.x+h.w*.5-half,y:h.y-depth,w:half*2,h:depth}
        };
      }

      if(h.doorSide===2){
        return{
          x:h.x+h.w*.5,
          y:h.y+h.h,
          insideX:h.x+h.w*.5,
          insideY:h.y+h.h-22,
          outsideX:h.x+h.w*.5,
          outsideY:h.y+h.h+depth*.5,
          pad:{x:h.x+h.w*.5-half,y:h.y+h.h,w:half*2,h:depth}
        };
      }

      if(h.doorSide===1){
        return{
          x:h.x+h.w,
          y:h.y+h.h*.5,
          insideX:h.x+h.w-22,
          insideY:h.y+h.h*.5,
          outsideX:h.x+h.w+depth*.5,
          outsideY:h.y+h.h*.5,
          pad:{x:h.x+h.w,y:h.y+h.h*.5-half,w:depth,h:half*2}
        };
      }

      return{
        x:h.x,
        y:h.y+h.h*.5,
        insideX:h.x+22,
        insideY:h.y+h.h*.5,
        outsideX:h.x-depth*.5,
        outsideY:h.y+h.h*.5,
        pad:{x:h.x-depth,y:h.y+h.h*.5-half,w:depth,h:half*2}
      };
    }

    function houseContains(entity,h,padding=0){
      if(!entity||!h)return false;

      return(
        entity.x>h.x+padding&&
        entity.x<h.x+h.w-padding&&
        entity.y>h.y+padding&&
        entity.y<h.y+h.h-padding
      );
    }

    function currentPlayerHouse(){
      if(!player)return null;
      return houses.find(h=>houseContains(player,h,8))??null;
    }

    function scopeViewMultiplier(scope){
      // Die Scope-Sprünge sind absichtlich deutlich kleiner als vorher.
      // Sie geben mehr Übersicht, ohne dass 4x/8x die Spielfiguren winzig machen.
      if(scope===2)return 1.16;
      if(scope===4)return 1.32;
      if(scope===8)return 1.50;
      return 1.0;
    }

    function scopeZoom(scope){
      return 1.42/scopeViewMultiplier(scope);
    }

    function randomScope(){
      const roll=Math.random();
      if(roll<.64)return 2;
      if(roll<.91)return 4;
      return 8;
    }

    function randomGearLevel(){
      const roll=Math.random();
      if(roll<.62)return 1;
      if(roll<.91)return 2;
      return 3;
    }

    function totalReserveAmmo(e){
      return Object.values(e.ammo).reduce((a,b)=>a+b,0);
    }

    function ammoCapacity(e){
      return GEAR.backpack[e.backpack||0].ammo;
    }

    function medCapacity(e){
      return GEAR.backpack[e.backpack||0].med;
    }

    function addAmmo(e,type,amount){
      const free=Math.max(0,ammoCapacity(e)-totalReserveAmmo(e));
      const take=Math.min(amount,free);

      if(take>0){
        e.ammo[type]+=take;
      }

      return take;
    }

    function addLoot(type,x,y,data={}){loot.push({id:nextId++,type,x,y,on:true,...data})}

    function randomWeaponId(){
      const ids=['pistol','smg','shotgun','rifle','dmr'];
      const weights=[30,23,19,10,4];
      const total=weights.reduce((a,b)=>a+b,0);
      let roll=Math.random()*total;
      for(let i=0;i<ids.length;i++){
        roll-=weights[i];
        if(roll<=0)return ids[i];
      }
      return 'pistol';
    }

    function spawnLootRoll(x,y,crateDrop=false){
      const z=Math.random();

      if(z<(crateDrop?.27:.24)){
        const gun=randomWeaponId();
        addLoot('gun',x,y,{gun,mag:WEAPONS[gun].mag});

        if(crateDrop&&Math.random()<.58){
          const a=WEAPONS[gun].ammo;

          addLoot(
            'ammo',
            x+rand(-18,18),
            y+rand(-18,18),
            {
              ammo:a,
              amount:a==='12g'
                ?rint(6,13)
                :rint(15,32)
            }
          );
        }
      }else if(z<.52){
        const a=['9mm','12g','556','762'][rint(0,3)];

        addLoot('ammo',x,y,{
          ammo:a,
          amount:a==='12g'
            ?rint(6,14)
            :rint(15,36)
        });
      }else if(z<.62){
        addLoot('med',x,y,{amount:1});
      }else if(z<.74){
        addLoot('vest',x,y,{level:randomGearLevel()});
      }else if(z<.83){
        addLoot('helmet',x,y,{level:randomGearLevel()});
      }else if(z<.91){
        addLoot('backpack',x,y,{level:randomGearLevel()});
      }else{
        addLoot('scope',x,y,{scope:randomScope()});
      }
    }

    function addCrate(x,y){
      crates.push({
        id:nextId++,
        x,y,
        r:25,
        hp:4,
        maxHp:4,
        scale:1,
        on:true,
        rotation:rand(-.10,.10)
      });
    }

    function destroyCrate(c){
      if(!c.on)return;
      c.on=false;
      fxBurst(c.x,c.y,'#c88a4c',15);

      const drops=rint(2,4);
      for(let i=0;i<drops;i++){
        const a=Math.random()*Math.PI*2;
        const d=rand(10,31);
        spawnLootRoll(
          c.x+Math.cos(a)*d,
          c.y+Math.sin(a)*d,
          true
        );
      }

      tone(115,.055,.015,'square');
    }

    function damageCrate(c,amount){
      if(!c?.on)return false;

      c.hp-=amount;
      c.scale=clamp(.50+.50*(c.hp/c.maxHp),.48,1);

      fxBurst(c.x,c.y,'#d19a5a',5);

      if(c.hp<=0){
        destroyCrate(c);
      }

      return true;
    }

    function generate(){
      objects=[];
      houses=[];
      crates=[];
      loot=[];

      const hc=presetKey==='quick'?8:14;

      for(let n=0;n<hc;n++){
        for(let t=0;t<80;t++){
          const w=rand(285,470),h=rand(230,390),
                x=rand(110,worldSize-w-110),y=rand(110,worldSize-h-110);

          if(!houses.some(q=>!(
            x+w+120<q.x||
            x>q.x+q.w+120||
            y+h+120<q.y||
            y>q.y+q.h+120
          ))){
            houses.push(makeHouse(x,y,w,h));
            break;
          }
        }
      }

      const oc=presetKey==='quick'?110:175;

      for(let n=0;n<oc;n++){
        const type=Math.random()<.58?'tree':Math.random()<.72?'rock':'bush',
              r=type==='tree'?rand(25,37):rand(18,30),
              p=openPoint();

        objects.push({
          id:nextId++,
          type,
          x:p.x,
          y:p.y,
          r,
          solid:type!=='bush'
        });
      }

      // Freier Boden-Loot liegt bewusst fast nur in Gebäuden.
      const floorLoot=Math.round(preset.loot*.42);

      for(let n=0;n<floorLoot;n++){
        if(!houses.length)break;

        const h=houses[rint(0,houses.length-1)];
        const p={
          x:rand(h.x+27,h.x+h.w-27),
          y:rand(h.y+27,h.y+h.h-27)
        };

        spawnLootRoll(p.x,p.y,false);
      }

      // Restliche Loot-Quelle: zerstörbare Kisten, drinnen und draußen.
      const crateCount=presetKey==='quick'?50:82;

      for(let n=0;n<crateCount;n++){
        let placed=false;

        if(houses.length && Math.random()<.43){
          const h=houses[rint(0,houses.length-1)];

          for(let tries=0;tries<24;tries++){
            const p={
              x:rand(h.x+32,h.x+h.w-32),
              y:rand(h.y+32,h.y+h.h-32)
            };

            if(!crates.some(c=>dist(c,p)<62)){
              addCrate(p.x,p.y);
              placed=true;
              break;
            }
          }
        }

        if(!placed){
          const p=openPoint();
          addCrate(p.x,p.y);
        }
      }
    }

    function spawn(){
      const p=openPoint();
      player=makeChar(p.x,p.y,true);
      player.slot=-1;
      bots=[];

      for(let i=0;i<preset.bots;i++){
        let q=openPoint(),tries=0;
        while(dist(p,q)<340&&tries++<30)q=openPoint();

        const b=makeChar(q.x,q.y,false);

        // Bots bekommen mindestens eine Pistole, damit die Singleplayer-Runde
        // direkt als Battle Royale funktioniert. Nur der Spieler startet mit Fäusten.
        b.guns[0]=makeGun('pistol');
        b.slot=0;
        b.ammo['9mm']=36;

        if(Math.random()<.38){
          const id=Math.random()<.55?'smg':'shotgun';
          b.guns[1]=makeGun(id);
          b.slot=1;
          b.ammo[WEAPONS[id].ammo]+=WEAPONS[id].mag*2;
        }

        if(Math.random()<.32){
          b.vest=Math.random()<.18?2:1;
          b.armor=GEAR.vest[b.vest].armor*rand(.55,.95);
        }

        if(Math.random()<.22){
          b.helmet=Math.random()<.14?2:1;
        }

        if(Math.random()<.24){
          b.backpack=Math.random()<.12?2:1;
        }

        bots.push(b);
      }
    }
    function initZone(){zone={x:worldSize/2,y:worldSize/2,r:worldSize*.49,stage:-1,state:'wait',timer:22,tx:worldSize/2,ty:worldSize/2,tr:worldSize*.49,fx:worldSize/2,fy:worldSize/2,fr:worldSize*.49,dmg:1};nextZone()}
    function nextZone(){zone.stage++;if(zone.stage>=CFG.zone.length){zone.state='final';zone.timer=999;zone.dmg=CFG.zone.at(-1).dmg;return}const z=CFG.zone[zone.stage],nr=worldSize*z.r*.5,max=Math.max(0,zone.r-nr)*.72,a=Math.random()*Math.PI*2,o=rand(0,max);zone.tx=clamp(zone.x+Math.cos(a)*o,nr,worldSize-nr);zone.ty=clamp(zone.y+Math.sin(a)*o,nr,worldSize-nr);zone.tr=nr;zone.timer=z.wait;zone.state='wait';zone.dmg=z.dmg}
    function updateZone(dt){if(zone.state==='final')return;zone.timer-=dt;if(zone.state==='wait'&&zone.timer<=0){const z=CFG.zone[zone.stage];zone.state='shrink';zone.timer=z.shrink;zone.fx=zone.x;zone.fy=zone.y;zone.fr=zone.r}else if(zone.state==='shrink'){const z=CFG.zone[zone.stage],t=clamp(1-zone.timer/z.shrink,0,1);zone.x=zone.fx+(zone.tx-zone.fx)*t;zone.y=zone.fy+(zone.ty-zone.fy)*t;zone.r=zone.fr+(zone.tr-zone.fr)*t;if(zone.timer<=0){zone.x=zone.tx;zone.y=zone.ty;zone.r=zone.tr;nextZone()}}}
    const inside=e=>Math.hypot(e.x-zone.x,e.y-zone.y)<=zone.r;
    function fxBurst(x,y,c,n=8){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=rand(30,100),life=rand(.25,.5);fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,life,max:life})}}
    function addFeed(s){feed.unshift({s,t:5});feed=feed.slice(0,6);feedEl.innerHTML=feed.map(x=>`<div>${x.s}</div>`).join('')}
    function damage(e,d,owner=null,source='bullet'){
      if(!e.alive)return;

      if(source!=='zone'){
        const helmetReduction=
          GEAR.helmet[e.helmet||0].reduction;

        d*=1-helmetReduction;

        if(e.vest>0&&e.armor>0){
          const absorbRate=
            GEAR.vest[e.vest].absorb;

          const prevented=
            d*absorbRate;

          e.armor=Math.max(
            0,
            e.armor-prevented*1.18
          );

          d-=prevented;
        }
      }

      e.hp-=d;

      if(owner===player?.id){
        damageDone+=d;
      }

      if(e.hp<=0){
        kill(e,owner,source);
      }
    }    function alive(){return [player,...bots].filter(x=>x&&x.alive)}
    function kill(e,owner,source){if(!e.alive)return;e.alive=false;e.hp=0;dropLoot(e);const a=[player,...bots].find(x=>x&&x.id===owner),killer=a?a.name:source==='zone'?'Zone':'Unknown';addFeed(`${killer} eliminated ${e.name}`);if(owner===player?.id&&!e.isP){kills++;fxBurst(e.x,e.y,'#ff6578',14)}if(e.isP){placement=alive().length+1;setTimeout(()=>finish(false),650)}else if(player?.alive&&alive().length===1){placement=1;setTimeout(()=>finish(true),500)}}
    function dropLoot(e){
      e.guns.forEach((g,index)=>{
        if(!g)return;

        const angle=e.angle+Math.PI+index*.45;

        addLoot(
          'gun',
          e.x+Math.cos(angle)*24,
          e.y+Math.sin(angle)*24,
          {
            gun:g.id,
            mag:g.mag
          }
        );
      });

      for(const a in e.ammo){
        if(e.ammo[a]>5){
          addLoot(
            'ammo',
            e.x+rand(-22,22),
            e.y+rand(-22,22),
            {
              ammo:a,
              amount:Math.min(e.ammo[a],34)
            }
          );
        }
      }

      if(e.med>0){
        addLoot(
          'med',
          e.x+rand(-18,18),
          e.y+rand(-18,18),
          {amount:Math.min(2,e.med)}
        );
      }

      if(e.vest>0){
        addLoot(
          'vest',
          e.x+rand(-20,20),
          e.y+rand(-20,20),
          {level:e.vest}
        );
      }

      if(e.helmet>0){
        addLoot(
          'helmet',
          e.x+rand(-20,20),
          e.y+rand(-20,20),
          {level:e.helmet}
        );
      }

      if(e.backpack>0){
        addLoot(
          'backpack',
          e.x+rand(-20,20),
          e.y+rand(-20,20),
          {level:e.backpack}
        );
      }
    }    function lineBlocked(x1,y1,x2,y2){
      const steps=Math.ceil(Math.hypot(x2-x1,y2-y1)/14);

      for(let i=1;i<=steps;i++){
        const t=i/steps;
        const x=x1+(x2-x1)*t;
        const y=y1+(y2-y1)*t;

        for(const o of objects){
          if(o.solid&&Math.hypot(x-o.x,y-o.y)<o.r){
            return true;
          }
        }

        for(const c of crates){
          if(c.on&&Math.hypot(x-c.x,y-c.y)<c.r*c.scale){
            return true;
          }
        }

        for(const h of houses){
          for(const w of houseWalls(h)){
            if(x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h){
              return true;
            }
          }
        }
      }

      return false;
    }
    function reload(e){const s=weapon(e);if(!s)return;const d=WEAPONS[s.id];if(s.reload>0||s.mag>=d.mag||e.ammo[d.ammo]<=0)return;s.reload=d.reload}
    function updateTimers(e,dt){e.meleeCool=Math.max(0,(e.meleeCool||0)-dt);for(const s of e.guns)if(s){s.cool=Math.max(0,s.cool-dt);if(s.reload>0){s.reload-=dt;if(s.reload<=0){s.reload=0;const d=WEAPONS[s.id],n=Math.min(d.mag-s.mag,e.ammo[d.ammo]);s.mag+=n;e.ammo[d.ammo]-=n}}}if(e.using){e.useT-=dt;if(e.useT<=0){e.using=false;e.med--;e.hp=Math.min(100,e.hp+CFG.medHeal);if(e.isP)tone(700,.06,.018,'sine')}}}
    function angleDifference(a,b){
      let d=(a-b)%(Math.PI*2);
      if(d>Math.PI)d-=Math.PI*2;
      if(d<-Math.PI)d+=Math.PI*2;
      return Math.abs(d);
    }

    function melee(e){
      if(!e.alive||e.using||e.meleeCool>0)return;

      e.meleeCool=.34;

      const reach=48;
      const hitX=e.x+Math.cos(e.angle)*34;
      const hitY=e.y+Math.sin(e.angle)*34;

      let hitSomething=false;

      for(const c of crates){
        if(!c.on)continue;

        const d=Math.hypot(hitX-c.x,hitY-c.y);

        if(d<c.r*c.scale+20){
          damageCrate(c,1);
          hitSomething=true;
          break;
        }
      }

      if(!hitSomething){
        for(const target of alive()){
          if(target.id===e.id)continue;

          const d=dist(e,target);
          const a=Math.atan2(target.y-e.y,target.x-e.x);

          if(d<reach+target.r && angleDifference(a,e.angle)<.72){
            damage(target,18,e.id,'melee');
            fxBurst(target.x,target.y,'#f1c58a',6);
            hitSomething=true;
            break;
          }
        }
      }

      fxBurst(hitX,hitY,hitSomething?'#f0c079':'#d6b17d',4);

      if(e.isP){
        tone(hitSomething?145:105,.035,.012,'square');
      }
    }

    function shoot(e,ang=e.angle){if(!e.alive||e.using)return;const s=weapon(e);if(!s){melee(e);return;}const d=WEAPONS[s.id];if(s.cool>0||s.reload>0)return;if(s.mag<=0){if(!e.isP)reload(e);return}s.mag--;s.cool=1/d.rate;const pellets=d.pellets||1,mx=e.x+Math.cos(ang)*(e.r+14),my=e.y+Math.sin(ang)*(e.r+14);for(let p=0;p<pellets;p++){const a=ang+rand(-d.spread,d.spread);bullets.push({
        id:nextId++,
        owner:e.id,
        weaponId:s.id,
        x:mx,
        y:my,
        vx:Math.cos(a)*d.speed,
        vy:Math.sin(a)*d.speed,
        dmg:d.damage,
        life:d.range/d.speed,
        maxLife:d.range/d.speed,
        tracer:
          s.id==='dmr'
            ?82
            :s.id==='rifle'
              ?70
              :s.id==='shotgun'
                ?52
                :s.id==='smg'
                  ?48
                  :58,
        c:d.color
      })}fxBurst(mx,my,'#ffe18a',4);if(e.isP)tone(s.id==='shotgun'?135:s.id==='dmr'?170:220,.03,.018)}
    function nearLoot(e,r=CFG.pickup){let best=null,bd=1e9;for(const l of loot)if(l.on){const d=dist(e,l);if(d<r&&d<bd){best=l;bd=d}}return best}
    function lootName(l){
      if(l.type==='gun')return WEAPONS[l.gun].name;
      if(l.type==='ammo')return `${l.amount} ${l.ammo}`;
      if(l.type==='med')return'Medkit';
      if(l.type==='scope')return`${l.scope}x Scope`;
      if(l.type==='vest')return`Vest Lv.${l.level}`;
      if(l.type==='helmet')return`Helmet Lv.${l.level}`;
      if(l.type==='backpack')return`Backpack Lv.${l.level}`;
      return l.type;
    }
    function pick(e,l){
      if(!l||!l.on)return;

      if(l.type==='gun'){
        let targetSlot;

        if(!e.guns[0])targetSlot=0;
        else if(!e.guns[1])targetSlot=1;
        else targetSlot=e.slot>=0?e.slot:0;

        const old=e.guns[targetSlot];

        // PUBG-artig: Slot ist belegt -> alte Waffe landet wieder auf dem Boden.
        if(old){
          const dropAngle=e.angle+Math.PI;
          const dropDistance=e.r+27;

          addLoot(
            'gun',
            e.x+Math.cos(dropAngle)*dropDistance,
            e.y+Math.sin(dropAngle)*dropDistance,
            {
              gun:old.id,
              mag:old.mag
            }
          );
        }

        e.guns[targetSlot]=makeGun(
          l.gun,
          l.mag??WEAPONS[l.gun].mag
        );

        e.slot=targetSlot;

        const def=WEAPONS[l.gun];

        addAmmo(
          e,
          def.ammo,
          Math.max(
            Math.ceil(def.mag*.45),
            def.ammo==='12g'?3:6
          )
        );

        l.on=false;
      }else if(l.type==='ammo'){
        const taken=addAmmo(e,l.ammo,l.amount);

        if(taken<=0)return;

        l.amount-=taken;

        if(l.amount<=0){
          l.on=false;
        }
      }else if(l.type==='med'){
        const free=Math.max(0,medCapacity(e)-e.med);

        if(free<=0)return;

        const take=Math.min(l.amount,free);
        e.med+=take;
        l.amount-=take;

        if(l.amount<=0){
          l.on=false;
        }
      }else if(l.type==='vest'){
        const level=l.level;

        if(level<e.vest)return;

        const maxArmor=GEAR.vest[level].armor;

        if(level===e.vest&&e.armor>=maxArmor*.90){
          return;
        }

        const previousVest=e.vest;
        e.vest=level;
        e.armor=Math.max(
          e.armor,
          maxArmor*(level===previousVest?.72:.84)
        );
        e.armor=Math.min(maxArmor,e.armor);
        l.on=false;
      }else if(l.type==='helmet'){
        if(l.level<=e.helmet)return;

        e.helmet=l.level;
        l.on=false;
      }else if(l.type==='backpack'){
        if(l.level<=e.backpack)return;

        e.backpack=l.level;
        l.on=false;
      }else if(l.type==='scope'){
        if(l.scope>(e.scope||1)){
          e.scope=l.scope;
          l.on=false;

          if(e.isP){
            cam.targetZoom=scopeZoom(e.scope);
            tone(780,.05,.016,'sine');
          }
        }else{
          return;
        }
      }

      if(e.isP&&l.type!=='scope'){
        tone(670,.025,.01,'triangle');
      }
    }
    function useMed(e){if(e.med>0&&e.hp<100&&!e.using){e.using=true;e.useT=CFG.medTime}}
    function updatePlayer(dt){if(!player?.alive)return;updateTimers(player,dt);let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0),len=Math.hypot(dx,dy);if(len){if(player.using){player.using=false;player.useT=0}const sp=CFG.move*(keys.shift?1.22:1);move(player,dx/len*sp*dt,dy/len*sp*dt)}mouse.wx=cam.x+(mouse.x-W/2)/cam.zoom;mouse.wy=cam.y+(mouse.y-H/2)/cam.zoom;player.angle=Math.atan2(mouse.wy-player.y,mouse.wx-player.x);if(mouse.down)shoot(player);if(!inside(player))damage(player,zone.dmg*dt,null,'zone')}
    function nearestEnemy(b,max=620){let best=null,bd=max;for(const e of alive())if(e.id!==b.id){const d=dist(b,e);if(d<bd&&!lineBlocked(b.x,b.y,e.x,e.y)){best=e;bd=d}}return best?{e:best,d:bd}:null}
    function aiLoot(b){
      let best=null;
      let bs=-1e9;

      for(const l of loot){
        if(!l.on)continue;

        const d=dist(b,l);

        if(d>470)continue;

        let s=-d*.15;

        if(l.type==='gun'){
          const cur=weapon(b);
          const order={
            pistol:1,
            smg:2,
            shotgun:2,
            rifle:3,
            dmr:4
          };

          s+=(
            order[l.gun]-
            (cur?order[cur.id]:0)
          )*90;
        }else if(l.type==='vest'){
          s+=(l.level-b.vest)*100;

          if(l.level===b.vest&&b.armor<GEAR.vest[b.vest].armor*.55){
            s+=45;
          }
        }else if(l.type==='helmet'){
          s+=(l.level-b.helmet)*88;
        }else if(l.type==='backpack'){
          s+=(l.level-b.backpack)*76;
        }else if(l.type==='med'){
          s+=b.med<medCapacity(b)?60:0;
        }else if(l.type==='scope'){
          s+=(l.scope>(b.scope||1)?32:-30);
        }else if(l.type==='ammo'){
          s+=totalReserveAmmo(b)<ammoCapacity(b)*.55?42:8;
        }

        if(s>bs){
          best=l;
          bs=s;
        }
      }

      return bs>5?best:null;
    }    function moveToward(b,x,y,dt,m=1){const dx=x-b.x,dy=y-b.y,l=Math.max(1,Math.hypot(dx,dy)),sp=CFG.move*diff.speed*m;const ox=b.x,oy=b.y;move(b,dx/l*sp*dt,dy/l*sp*dt);if(Math.hypot(b.x-ox,b.y-oy)<.2)move(b,-dy/l*sp*dt*b.ai.strafe,dx/l*sp*dt*b.ai.strafe)}
    function updateBot(b,dt){if(!b.alive)return;updateTimers(b,dt);if(!inside(b))damage(b,zone.dmg*dt,null,'zone');if(!b.alive)return;if(b.using)return;const zd=Math.hypot(b.x-zone.x,b.y-zone.y);if(zd>zone.r-30){moveToward(b,zone.x,zone.y,dt,1.08);b.angle=Math.atan2(zone.y-b.y,zone.x-b.x);return}
      const en=nearestEnemy(b,620);if(en){const s=weapon(b),def=WEAPONS[s.id],ideal=s.id==='shotgun'?145:s.id==='smg'?220:s.id==='pistol'?290:s.id==='rifle'?400:500,dx=en.e.x-b.x,dy=en.e.y-b.y,l=Math.max(1,en.d),nx=dx/l,ny=dy/l;let mx=-ny*b.ai.strafe*.7,my=nx*b.ai.strafe*.7;if(en.d>ideal*1.1){mx+=nx;my+=ny}else if(en.d<ideal*.62){mx-=nx;my-=ny}const ml=Math.max(1,Math.hypot(mx,my)),sp=CFG.move*diff.speed*.9;move(b,mx/ml*sp*dt,my/ml*sp*dt);b.angle=Math.atan2(dy,dx)+rand(-diff.aim,diff.aim)*clamp(en.d/450,.6,1.2);if(en.d<def.range*.86)shoot(b,b.angle);if(s.mag<=0)reload(b);return}
      b.ai.think-=dt;if(b.ai.think<=0){b.ai.think=diff.reaction+rand(.08,.28);b.ai.target=aiLoot(b);if(!b.ai.target){const a=Math.random()*Math.PI*2,r=rand(0,zone.r*.65);b.ai.move={x:clamp(zone.x+Math.cos(a)*r,50,worldSize-50),y:clamp(zone.y+Math.sin(a)*r,50,worldSize-50)}}}
      if(b.hp<45&&b.med&&Math.random()<.005){useMed(b);return}
      if(b.ai.target&&b.ai.target.on){if(dist(b,b.ai.target)<CFG.pickup)pick(b,b.ai.target);else moveToward(b,b.ai.target.x,b.ai.target.y,dt,.92)}else if(b.ai.move)moveToward(b,b.ai.move.x,b.ai.move.y,dt,.86)
    }
    function updateBullets(dt){
      const deadSet=new Set();

      for(const bl of bullets){
        bl.life-=dt;

        if(bl.life<=0){
          deadSet.add(bl.id);
          continue;
        }

        const steps=Math.max(
          1,
          Math.ceil(
            Math.hypot(bl.vx,bl.vy)*
            dt/
            10
          )
        );

        const sd=dt/steps;

        for(let k=0;k<steps;k++){
          bl.x+=bl.vx*sd;
          bl.y+=bl.vy*sd;

          let block=
            bl.x<0||
            bl.y<0||
            bl.x>worldSize||
            bl.y>worldSize;

          if(!block){
            for(const c of crates){
              if(!c.on)continue;

              if(
                Math.hypot(
                  bl.x-c.x,
                  bl.y-c.y
                )<
                c.r*c.scale+2
              ){
                const crateDamage=
                  bl.weaponId==='shotgun'
                    ?.55
                    :bl.weaponId==='smg'
                      ?.72
                      :1;

                damageCrate(
                  c,
                  crateDamage
                );

                block=true;
                break;
              }
            }
          }

          if(!block){
            for(const o of objects){
              if(
                o.solid&&
                Math.hypot(
                  bl.x-o.x,
                  bl.y-o.y
                )<
                o.r
              ){
                block=true;
                break;
              }
            }
          }

          if(!block){
            outer:
            for(const h of houses){
              for(const w of houseWalls(h)){
                if(
                  bl.x>=w.x&&
                  bl.x<=w.x+w.w&&
                  bl.y>=w.y&&
                  bl.y<=w.y+w.h
                ){
                  block=true;
                  break outer;
                }
              }
            }
          }

          if(block){
            deadSet.add(bl.id);
            break;
          }

          for(const e of alive()){
            if(e.id===bl.owner)continue;

            if(
              Math.hypot(
                bl.x-e.x,
                bl.y-e.y
              )<
              e.r+2
            ){
              damage(
                e,
                bl.dmg,
                bl.owner
              );

              fxBurst(
                bl.x,
                bl.y,
                '#ff7788',
                6
              );

              deadSet.add(bl.id);
              block=true;
              break;
            }
          }

          if(block)break;
        }
      }

      if(deadSet.size){
        bullets=
          bullets.filter(
            b=>!deadSet.has(b.id)
          );
      }
    }
    function updateFx(dt){for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)fx.splice(i,1)}for(const f of feed)f.t-=dt;const n=feed.length;feed=feed.filter(f=>f.t>0);if(n!==feed.length)feedEl.innerHTML=feed.map(x=>`<div>${x.s}</div>`).join('')}
    function updateCam(){
      if(!player)return;

      cam.x=player.x;
      cam.y=player.y;

      const inHouse=
        !!currentPlayerHouse();

      const houseZoomFactor=
        inHouse
          ?.88
          :1;

      cam.targetZoom=
        scopeZoom(player.scope||1)*
        houseZoomFactor;

      cam.zoom+=(
        cam.targetZoom-cam.zoom
      )*.10;
    }
    function updateHud(){
      if(!player)return;

      aliveEl.textContent=alive().length;
      killsEl.textContent=kills;

      zoneEl.textContent=
        zone.state==='wait'
          ?`${Math.max(0,Math.ceil(zone.timer))}s`
          :zone.state==='shrink'
            ?`Closing ${Math.max(0,Math.ceil(zone.timer))}s`
            :'Final';

      hpEl.style.width=clamp(player.hp,0,100)+'%';
      armEl.style.width=clamp(player.armor,0,100)+'%';
      hpNumberEl.textContent=Math.ceil(clamp(player.hp,0,100));

      medEl.textContent='×'+player.med;

      fistsEl.classList.toggle('on',player.slot<0);

      slots.forEach((el,i)=>{
        el.classList.toggle('on',player.slot===i);

        const s=player.guns[i],
              n=el.querySelector('.br-name'),
              a=el.querySelector('.br-ammo');

        if(!s){
          n.textContent='Empty';
          a.textContent='—';
        }else{
          const d=WEAPONS[s.id];
          n.textContent=d.name;
          a.textContent=
            s.reload>0
              ?`RELOAD ${s.reload.toFixed(1)}s`
              :s.mag<=0&&player.ammo[d.ammo]>0
                ?'R TO RELOAD'
                :`${s.mag} / ${player.ammo[d.ammo]}`;
        }
      });

      for(const type of Object.keys(ammoEls)){
        ammoEls[type].textContent=player.ammo[type];
      }

      for(const level of [1,2,4,8]){
        scopeEls[level].classList.toggle(
          'on',
          (player.scope||1)===level
        );
      }

      equipEls.helmet.textContent=
        player.helmet>0
          ?`Lv.${player.helmet}`
          :'—';

      equipEls.vest.textContent=
        player.vest>0
          ?`Lv.${player.vest}`
          :'—';

      equipEls.backpack.textContent=
        player.backpack>0
          ?`Lv.${player.backpack}`
          :'—';

      const l=nearLoot(player);
      pickEl.classList.toggle('show',!!l);
      if(l)pickEl.textContent='E · '+lootName(l);

      useEl.classList.toggle('show',player.using);

      if(player.using){
        useFill.style.width=
          clamp(1-player.useT/CFG.medTime,0,1)*100+'%';
      }
    }
    const scr=(x,y)=>({x:W/2+(x-cam.x)*cam.zoom,y:H/2+(y-cam.y)*cam.zoom});
    function drawHeldWeapon(e,g){
      ctx.save();
      ctx.rotate(e.angle);
      ctx.lineCap='round';

      // Zwei Hände sitzen sichtbar vor dem Körper, ähnlich den Referenzen.
      const handColor='#efbd72';
      const handStroke='#74553a';

      if(!g){
        ctx.fillStyle=handColor;
        ctx.strokeStyle=handStroke;
        ctx.lineWidth=2.5;

        ctx.beginPath();
        ctx.arc(e.r+7,-8,6.5,0,Math.PI*2);
        ctx.arc(e.r+7,8,6.5,0,Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        return;
      }

      const id=g.id;
      const d=WEAPONS[id];

      const p={
        pistol:{len:31,base:7,accent:4,hand1:10,hand2:22},
        smg:{len:42,base:10,accent:5,hand1:12,hand2:27},
        shotgun:{len:58,base:7,accent:4,hand1:13,hand2:34},
        rifle:{len:53,base:8,accent:5,hand1:13,hand2:31},
        dmr:{len:66,base:7,accent:4,hand1:14,hand2:36}
      }[id];

      const start=e.r*.20;
      const end=e.r+p.len;

      // Schwarzer Hauptkörper / Lauf
      ctx.strokeStyle='#11171a';
      ctx.lineWidth=p.base;
      ctx.beginPath();
      ctx.moveTo(start,0);
      ctx.lineTo(end,0);
      ctx.stroke();

      // Waffenfarbe ist nur der zentrale Receiver, nicht die komplette Waffe.
      ctx.strokeStyle=d.color;
      ctx.lineWidth=p.accent;
      ctx.beginPath();
      ctx.moveTo(e.r*.62,0);
      ctx.lineTo(
        id==='pistol'
          ?end-4
          :id==='dmr'
            ?end-20
            :end-12,
        0
      );
      ctx.stroke();

      if(id==='pistol'){
        ctx.strokeStyle='#1c2226';
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(e.r*.72,3);
        ctx.lineTo(e.r*.82,12);
        ctx.stroke();
      }

      if(id==='smg'){
        ctx.strokeStyle='#20272b';
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(e.r*.78,4);
        ctx.lineTo(e.r+7,14);
        ctx.stroke();
      }

      if(id==='shotgun'){
        ctx.strokeStyle='#9b6138';
        ctx.lineWidth=6;
        ctx.beginPath();
        ctx.moveTo(e.r*.62,0);
        ctx.lineTo(e.r+17,0);
        ctx.stroke();
      }

      if(id==='rifle'){
        ctx.strokeStyle='#20272b';
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(e.r*.86,4);
        ctx.lineTo(e.r+9,14);
        ctx.stroke();
      }

      if(id==='dmr'){
        ctx.strokeStyle='#0d1215';
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(e.r*.72,-7);
        ctx.lineTo(e.r+18,-7);
        ctx.stroke();

        ctx.fillStyle=d.color;
        ctx.beginPath();
        ctx.arc(e.r+3,-7,3,0,Math.PI*2);
        ctx.fill();
      }

      // Hände liegen sichtbar auf/unter der Waffe.
      ctx.fillStyle=handColor;
      ctx.strokeStyle=handStroke;
      ctx.lineWidth=2;

      ctx.beginPath();
      ctx.arc(e.r+p.hand1,-7,6,0,Math.PI*2);
      ctx.arc(e.r+p.hand2,7,6,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function drawGroundWeapon(l){
      const def=WEAPONS[l.gun];

      ctx.save();
      ctx.translate(l.x,l.y);

      // Dunkler Item-Kreis mit farbigem dünnem Rand:
      // dadurch bleibt die Waffe auf Gras/Holzboden sofort erkennbar.
      ctx.fillStyle='rgba(48,51,50,.97)';
      ctx.strokeStyle=def.color;
      ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.arc(0,0,24,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-.42);
      ctx.lineCap='round';

      const black='#101518';
      const dark='#22292d';

      if(l.gun==='pistol'){
        ctx.strokeStyle=black;
        ctx.lineWidth=7;
        ctx.beginPath();
        ctx.moveTo(-11,0);
        ctx.lineTo(13,0);
        ctx.stroke();

        ctx.strokeStyle=def.color;
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(-6,0);
        ctx.lineTo(11,0);
        ctx.stroke();

        ctx.strokeStyle=black;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(-2,3);
        ctx.lineTo(2,12);
        ctx.stroke();
      }else if(l.gun==='smg'){
        ctx.strokeStyle=black;
        ctx.lineWidth=10;
        ctx.beginPath();
        ctx.moveTo(-16,0);
        ctx.lineTo(15,0);
        ctx.stroke();

        ctx.strokeStyle=def.color;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(-9,0);
        ctx.lineTo(10,0);
        ctx.stroke();

        ctx.strokeStyle=dark;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(-1,4);
        ctx.lineTo(4,14);
        ctx.stroke();

        ctx.strokeStyle=black;
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(12,0);
        ctx.lineTo(20,0);
        ctx.stroke();
      }else if(l.gun==='shotgun'){
        ctx.strokeStyle=black;
        ctx.lineWidth=7;
        ctx.beginPath();
        ctx.moveTo(-19,0);
        ctx.lineTo(23,0);
        ctx.stroke();

        ctx.strokeStyle='#996039';
        ctx.lineWidth=6;
        ctx.beginPath();
        ctx.moveTo(-9,0);
        ctx.lineTo(8,0);
        ctx.stroke();

        ctx.strokeStyle=def.color;
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(12,0);
        ctx.lineTo(22,0);
        ctx.stroke();
      }else if(l.gun==='rifle'){
        ctx.strokeStyle=black;
        ctx.lineWidth=8;
        ctx.beginPath();
        ctx.moveTo(-19,0);
        ctx.lineTo(22,0);
        ctx.stroke();

        ctx.strokeStyle=def.color;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(-9,0);
        ctx.lineTo(13,0);
        ctx.stroke();

        ctx.strokeStyle=dark;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(1,4);
        ctx.lineTo(6,14);
        ctx.stroke();

        ctx.strokeStyle=black;
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(18,0);
        ctx.lineTo(27,0);
        ctx.stroke();
      }else{
        ctx.strokeStyle=black;
        ctx.lineWidth=7;
        ctx.beginPath();
        ctx.moveTo(-22,0);
        ctx.lineTo(27,0);
        ctx.stroke();

        ctx.strokeStyle=def.color;
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(-10,0);
        ctx.lineTo(18,0);
        ctx.stroke();

        // DMR Scope
        ctx.strokeStyle=black;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(-4,-7);
        ctx.lineTo(12,-7);
        ctx.stroke();

        ctx.fillStyle=def.color;
        ctx.beginPath();
        ctx.arc(5,-7,3,0,Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawGearLoot(l){
      const levelColor=
        l.level===3
          ?'#ffd166'
          :l.level===2
            ?'#8bd7ff'
            :'#e8ece8';

      ctx.save();
      ctx.translate(l.x,l.y);

      ctx.fillStyle='rgba(50,54,53,.96)';
      ctx.strokeStyle='#171b1a';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(0,0,18,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle=levelColor;
      ctx.fillStyle=levelColor;
      ctx.lineWidth=3;

      if(l.type==='helmet'){
        ctx.beginPath();
        ctx.arc(0,-1,9,Math.PI,Math.PI*2);
        ctx.lineTo(9,5);
        ctx.lineTo(-9,5);
        ctx.closePath();
        ctx.stroke();
      }else if(l.type==='vest'){
        ctx.beginPath();
        ctx.moveTo(-8,-9);
        ctx.lineTo(-3,-9);
        ctx.lineTo(0,-4);
        ctx.lineTo(3,-9);
        ctx.lineTo(8,-9);
        ctx.lineTo(11,-3);
        ctx.lineTo(7,10);
        ctx.lineTo(-7,10);
        ctx.lineTo(-11,-3);
        ctx.closePath();
        ctx.stroke();
      }else{
        ctx.strokeRect(-7,-6,14,15);
        ctx.beginPath();
        ctx.arc(0,-6,5,Math.PI,Math.PI*2);
        ctx.stroke();
      }

      ctx.font='950 7px system-ui';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillStyle=levelColor;
      ctx.fillText(`L${l.level}`,0,12);

      ctx.restore();
    }

    function drawHouseInterior(h){
      ctx.save();

      // Innenboden
      ctx.fillStyle=
        h.warehouse
          ?'#485762'
          :'#9c5633';

      ctx.fillRect(
        h.x,
        h.y,
        h.w,
        h.h
      );

      if(h.warehouse){
        ctx.strokeStyle='rgba(21,35,42,.34)';
        ctx.lineWidth=1/cam.zoom;

        for(let xx=h.x+18;xx<h.x+h.w;xx+=32){
          ctx.beginPath();
          ctx.moveTo(xx,h.y);
          ctx.lineTo(xx,h.y+h.h);
          ctx.stroke();
        }
      }else{
        // Holzdielen statt simpler Fläche
        ctx.strokeStyle='rgba(80,38,22,.34)';
        ctx.lineWidth=1/cam.zoom;

        for(let yy=h.y+14;yy<h.y+h.h;yy+=16){
          ctx.beginPath();
          ctx.moveTo(h.x,yy);
          ctx.lineTo(h.x+h.w,yy);
          ctx.stroke();
        }

        for(let xx=h.x+34;xx<h.x+h.w;xx+=56){
          ctx.beginPath();
          ctx.moveTo(xx,h.y);
          ctx.lineTo(xx,h.y+h.h);
          ctx.stroke();
        }
      }

      // Möbel
      for(const f of h.furniture??[]){
        ctx.save();
        ctx.translate(
          f.x+f.w/2,
          f.y+f.h/2
        );
        ctx.rotate(f.rot||0);

        if(f.type==='rug'){
          ctx.fillStyle='rgba(91,50,67,.72)';
          ctx.fillRect(-f.w/2,-f.h/2,f.w,f.h);

          ctx.strokeStyle='rgba(230,181,143,.40)';
          ctx.lineWidth=2;
          ctx.strokeRect(-f.w/2+3,-f.h/2+3,f.w-6,f.h-6);
        }else if(f.type==='bed'){
          ctx.fillStyle='#704d3b';
          ctx.fillRect(-f.w/2,-f.h/2,f.w,f.h);

          ctx.fillStyle='#d9cdb6';
          ctx.fillRect(-f.w/2+3,-f.h/2+3,f.w*.34,f.h-6);

          ctx.fillStyle='#8d6d5b';
          ctx.fillRect(-f.w/2+f.w*.38,-f.h/2+3,f.w*.58,f.h-6);
        }else if(f.type==='shelf'){
          ctx.fillStyle='#263238';
          ctx.fillRect(-f.w/2,-f.h/2,f.w,f.h);

          ctx.strokeStyle='#6a7e87';
          ctx.lineWidth=2;
          ctx.strokeRect(-f.w/2,-f.h/2,f.w,f.h);
        }else{
          ctx.fillStyle=
            f.type==='cabinet'
              ?'#5f4635'
              :'#6f4a31';

          ctx.fillRect(
            -f.w/2,
            -f.h/2,
            f.w,
            f.h
          );

          ctx.strokeStyle='#3f2a1c';
          ctx.lineWidth=2;
          ctx.strokeRect(
            -f.w/2,
            -f.h/2,
            f.w,
            f.h
          );
        }

        ctx.restore();
      }

      // Klarer Eingang: heller Porch/Threshold + dunkle Türschwelle.
      const entrance=houseEntrance(h);

      ctx.fillStyle='#b9b7a8';
      ctx.strokeStyle='#595a53';
      ctx.lineWidth=2;
      ctx.fillRect(
        entrance.pad.x,
        entrance.pad.y,
        entrance.pad.w,
        entrance.pad.h
      );
      ctx.strokeRect(
        entrance.pad.x,
        entrance.pad.y,
        entrance.pad.w,
        entrance.pad.h
      );

      ctx.fillStyle='#252b2a';

      if(h.doorSide===0||h.doorSide===2){
        ctx.fillRect(
          entrance.x-40,
          entrance.y-5,
          80,
          10
        );
      }else{
        ctx.fillRect(
          entrance.x-5,
          entrance.y-40,
          10,
          80
        );
      }

      // Innen- und Außenwände mit dunkler Kontur.
      for(const w of houseWalls(h)){
        ctx.fillStyle='#3c1f1c';
        ctx.fillRect(
          w.x-2,
          w.y-2,
          w.w+4,
          w.h+4
        );

        ctx.fillStyle=
          h.warehouse
            ?'#25323b'
            :'#6d3228';

        ctx.fillRect(
          w.x,
          w.y,
          w.w,
          w.h
        );

        ctx.fillStyle='rgba(255,255,255,.10)';

        if(w.w>w.h){
          ctx.fillRect(
            w.x,
            w.y,
            w.w,
            2
          );
        }else{
          ctx.fillRect(
            w.x,
            w.y,
            2,
            w.h
          );
        }
      }

      ctx.restore();
    }

    function drawHouseRoof(h){
      if(
        player&&
        houseContains(player,h,4)
      ){
        return;
      }

      ctx.save();

      ctx.shadowColor='rgba(0,0,0,.25)';
      ctx.shadowBlur=10/cam.zoom;
      ctx.shadowOffsetY=6/cam.zoom;

      ctx.fillStyle=h.roofColor;
      ctx.strokeStyle='#261815';
      ctx.lineWidth=4/cam.zoom;

      ctx.fillRect(
        h.x-4,
        h.y-4,
        h.w+8,
        h.h+8
      );

      ctx.strokeRect(
        h.x-4,
        h.y-4,
        h.w+8,
        h.h+8
      );

      ctx.shadowBlur=0;
      ctx.shadowOffsetY=0;

      ctx.strokeStyle=h.roofAccent;
      ctx.lineWidth=3/cam.zoom;

      if(h.warehouse){
        for(let xx=h.x+18;xx<h.x+h.w;xx+=28){
          ctx.beginPath();
          ctx.moveTo(xx,h.y);
          ctx.lineTo(xx,h.y+h.h);
          ctx.stroke();
        }
      }else{
        // Ein einfaches, deutlich lesbares Top-Down-Dach.
        ctx.beginPath();
        ctx.moveTo(h.x+h.w/2,h.y);
        ctx.lineTo(h.x+h.w/2,h.y+h.h);
        ctx.moveTo(h.x,h.y+h.h/2);
        ctx.lineTo(h.x+h.w/2,h.y);
        ctx.lineTo(h.x+h.w,h.y+h.h/2);
        ctx.lineTo(h.x+h.w/2,h.y+h.h);
        ctx.lineTo(h.x,h.y+h.h/2);
        ctx.stroke();

        // Ziegel-Linien
        ctx.strokeStyle='rgba(34,15,15,.22)';
        ctx.lineWidth=1/cam.zoom;

        for(let yy=h.y+16;yy<h.y+h.h;yy+=17){
          ctx.beginPath();
          ctx.moveTo(h.x,yy);
          ctx.lineTo(h.x+h.w,yy);
          ctx.stroke();
        }
      }

      // Auch bei geschlossenem Dach bleibt der Eingang außen offensichtlich.
      const entrance=houseEntrance(h);

      ctx.fillStyle='#d6d2bf';
      ctx.strokeStyle='#242824';
      ctx.lineWidth=2/cam.zoom;

      ctx.fillRect(
        entrance.pad.x,
        entrance.pad.y,
        entrance.pad.w,
        entrance.pad.h
      );

      ctx.strokeRect(
        entrance.pad.x,
        entrance.pad.y,
        entrance.pad.w,
        entrance.pad.h
      );

      ctx.fillStyle='#171c1b';

      if(h.doorSide===0||h.doorSide===2){
        ctx.fillRect(
          entrance.x-39,
          entrance.y-5,
          78,
          10
        );
      }else{
        ctx.fillRect(
          entrance.x-5,
          entrance.y-39,
          10,
          78
        );
      }

      ctx.restore();
    }

    function draw(){
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle='#182019';
      ctx.fillRect(0,0,W,H);

      ctx.save();
      ctx.translate(W/2,H/2);
      ctx.scale(cam.zoom,cam.zoom);
      ctx.translate(-cam.x,-cam.y);

      // Boden
      ctx.fillStyle='#70a043';
      ctx.fillRect(0,0,worldSize,worldSize);

      // Welt-festes Grid
      const gs=150;
      ctx.strokeStyle='#315e2733';
      ctx.lineWidth=1/cam.zoom;
      ctx.beginPath();

      for(let x=0;x<=worldSize;x+=gs){
        ctx.moveTo(x,0);
        ctx.lineTo(x,worldSize);
      }

      for(let y=0;y<=worldSize;y+=gs){
        ctx.moveTo(0,y);
        ctx.lineTo(worldSize,y);
      }

      ctx.stroke();

      // Zone
      if(zone){
        ctx.fillStyle='#c62f1b35';
        ctx.beginPath();
        ctx.rect(0,0,worldSize,worldSize);
        ctx.arc(zone.x,zone.y,zone.r,0,Math.PI*2,true);
        ctx.fill('evenodd');

        ctx.strokeStyle=
          zone.state==='shrink'
            ?'#ff604d'
            :'#ffffffaa';

        ctx.lineWidth=3/cam.zoom;
        ctx.beginPath();
        ctx.arc(zone.x,zone.y,zone.r,0,Math.PI*2);
        ctx.stroke();

        if(zone.state==='wait'&&zone.stage>=0){
          ctx.setLineDash([
            7/cam.zoom,
            7/cam.zoom
          ]);

          ctx.strokeStyle='#ffffff66';
          ctx.lineWidth=2/cam.zoom;
          ctx.beginPath();
          ctx.arc(zone.tx,zone.ty,zone.tr,0,Math.PI*2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Häuser zeigen zunächst immer das Interior.
      houses.forEach(drawHouseInterior);

      // Loot
      const ammoColor={
        '9mm':'#f3d35c',
        '12g':'#e96852',
        '556':'#6fcd69',
        '762':'#7195e7'
      };

      for(const l of loot){
        if(!l.on)continue;

        if(l.type==='gun'){
          drawGroundWeapon(l);
          continue;
        }

        if(
          l.type==='vest'||
          l.type==='helmet'||
          l.type==='backpack'
        ){
          drawGearLoot(l);
          continue;
        }

        ctx.save();
        ctx.translate(l.x,l.y);

        if(l.type==='ammo'){
          const c=ammoColor[l.ammo];

          ctx.fillStyle='#383c3b';
          ctx.strokeStyle='#171a1a';
          ctx.lineWidth=2;
          ctx.fillRect(-12,-12,24,24);
          ctx.strokeRect(-12,-12,24,24);

          ctx.fillStyle=c;
          ctx.fillRect(-9,-9,18,18);

          ctx.strokeStyle='rgba(24,31,27,.75)';
          ctx.lineWidth=2;

          for(let bx=-5;bx<=5;bx+=5){
            ctx.beginPath();
            ctx.moveTo(bx,-6);
            ctx.lineTo(bx,6);
            ctx.stroke();
          }

          ctx.fillStyle='#111';
          ctx.font='900 7px system-ui';
          ctx.textAlign='center';
          ctx.textBaseline='middle';

          ctx.fillText(
            l.ammo==='556'
              ?'5'
              :l.ammo==='762'
                ?'7'
                :l.ammo==='12g'
                  ?'12'
                  :'9',
            0,
            0
          );
        }else if(l.type==='scope'){
          const scopeColor=
            l.scope===8
              ?'#ffcf55'
              :l.scope===4
                ?'#d98cff'
                :'#d7e2e5';

          ctx.fillStyle='rgba(48,53,51,.96)';
          ctx.strokeStyle='#161b19';
          ctx.lineWidth=3;
          ctx.beginPath();
          ctx.arc(0,0,17,0,Math.PI*2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle=scopeColor;
          ctx.lineWidth=3;
          ctx.beginPath();
          ctx.arc(0,0,11,0,Math.PI*2);
          ctx.stroke();

          ctx.fillStyle=scopeColor;
          ctx.font='950 9px system-ui';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillText(`${l.scope}x`,0,0);
        }else if(l.type==='med'){
          ctx.fillStyle='#f5f7f8';
          ctx.strokeStyle='#3b403d';
          ctx.lineWidth=2;
          ctx.fillRect(-10,-10,20,20);
          ctx.strokeRect(-10,-10,20,20);

          ctx.fillStyle='#6bdd7e';
          ctx.fillRect(-3,-7,6,14);
          ctx.fillRect(-7,-3,14,6);
        }

        ctx.restore();
      }

      // Kisten
      for(const c of crates){
        if(!c.on)continue;

        ctx.save();
        ctx.translate(c.x,c.y);
        ctx.rotate(c.rotation);

        const rr=c.r*c.scale;
        const size=rr*1.78;

        ctx.fillStyle='#a96e37';
        ctx.strokeStyle='#56351f';
        ctx.lineWidth=3;
        ctx.fillRect(-size/2,-size/2,size,size);
        ctx.strokeRect(-size/2,-size/2,size,size);

        ctx.strokeStyle='#d6a15f';
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(-size*.36,-size*.36);
        ctx.lineTo(size*.36,size*.36);
        ctx.moveTo(size*.36,-size*.36);
        ctx.lineTo(-size*.36,size*.36);
        ctx.stroke();

        ctx.fillStyle='#624022';
        ctx.fillRect(-size*.09,-size*.5,size*.18,size);

        ctx.restore();
      }

      // Natur
      for(const o of objects){
        ctx.save();
        ctx.translate(o.x,o.y);

        if(o.type==='tree'){
          ctx.fillStyle='#4d341f';
          ctx.strokeStyle='#332214';
          ctx.lineWidth=2;
          ctx.beginPath();
          ctx.arc(0,0,o.r*.55,0,Math.PI*2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle='#315827';

          for(let i=0;i<9;i++){
            const a=i/9*Math.PI*2;
            ctx.beginPath();
            ctx.arc(
              Math.cos(a)*o.r*.54,
              Math.sin(a)*o.r*.54,
              o.r*.43,
              0,
              Math.PI*2
            );
            ctx.fill();
          }

          ctx.fillStyle='#523720';
          ctx.beginPath();
          ctx.arc(0,0,o.r*.43,0,Math.PI*2);
          ctx.fill();
        }else if(o.type==='rock'){
          ctx.fillStyle='#babdc0';
          ctx.strokeStyle='#44484b';
          ctx.lineWidth=4;
          ctx.beginPath();
          ctx.arc(0,0,o.r,0,Math.PI*2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle='#ffffff44';
          ctx.beginPath();
          ctx.arc(
            -o.r*.25,
            -o.r*.28,
            o.r*.28,
            0,
            Math.PI*2
          );
          ctx.fill();
        }else{
          ctx.fillStyle='#365d29';

          for(let i=0;i<7;i++){
            const a=i/7*Math.PI*2;
            ctx.beginPath();
            ctx.arc(
              Math.cos(a)*o.r*.32,
              Math.sin(a)*o.r*.32,
              o.r*.45,
              0,
              Math.PI*2
            );
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // Schüsse werden nicht als Punkte, sondern als lange weiße,
      // nach hinten ausfadende Tracer-Lines dargestellt.
      for(const bl of bullets){
        const speed=Math.max(1,Math.hypot(bl.vx,bl.vy));
        const nx=bl.vx/speed;
        const ny=bl.vy/speed;
        const tracerLength=bl.tracer||58;

        const tx=bl.x-nx*tracerLength;
        const ty=bl.y-ny*tracerLength;

        const gradient=ctx.createLinearGradient(
          tx,
          ty,
          bl.x,
          bl.y
        );

        gradient.addColorStop(
          0,
          'rgba(255,255,255,0)'
        );

        gradient.addColorStop(
          .32,
          'rgba(255,255,255,.18)'
        );

        gradient.addColorStop(
          .72,
          'rgba(255,255,255,.68)'
        );

        gradient.addColorStop(
          1,
          'rgba(255,255,255,.98)'
        );

        ctx.strokeStyle=gradient;
        ctx.lineWidth=
          bl.weaponId==='dmr'
            ?2.3
            :bl.weaponId==='shotgun'
              ?1.55
              :1.9;

        ctx.lineCap='round';
        ctx.shadowBlur=5/cam.zoom;
        ctx.shadowColor='rgba(255,255,255,.70)';
        ctx.beginPath();
        ctx.moveTo(tx,ty);
        ctx.lineTo(bl.x,bl.y);
        ctx.stroke();
      }

      ctx.shadowBlur=0;

      const drawChar=e=>{
        if(!e.alive)return;

        ctx.save();
        ctx.translate(e.x,e.y);

        if(e.vest>0&&e.armor>0){
          ctx.strokeStyle='#69cdecaa';
          ctx.lineWidth=3;
          ctx.beginPath();
          ctx.arc(0,0,e.r+4,0,Math.PI*2);
          ctx.stroke();
        }

        // Dunkler Rücken-/Gear-Ring hinter dem hellen Körper.
        ctx.fillStyle=
          e.backpack>0
            ?(
              e.backpack===3
                ?'#6a573c'
                :e.backpack===2
                  ?'#6a665c'
                  :'#5d574b'
            )
            :'#4a4035';

        ctx.beginPath();
        ctx.arc(-4,2,e.r+3,0,Math.PI*2);
        ctx.fill();

        ctx.fillStyle=
          e.isP
            ?'#efc178'
            :'#e8b96d';

        ctx.strokeStyle='#5b4735';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(2,-1,e.r,0,Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Helm direkt am Charakter
        if(e.helmet>0){
          ctx.strokeStyle=
            e.helmet===3
              ?'#ffd166'
              :e.helmet===2
                ?'#a9dcff'
                :'#e8ece8';

          ctx.lineWidth=3;

          ctx.beginPath();
          ctx.arc(0,-2,e.r*.72,Math.PI,Math.PI*2);
          ctx.stroke();
        }

        drawHeldWeapon(
          e,
          weapon(e)
        );

        ctx.fillStyle=
          e.isP
            ?'#28dfff'
            :'#e5edf4';

        ctx.font='800 10px system-ui';
        ctx.textAlign='center';
        ctx.textBaseline='middle';
        ctx.fillText(
          e.name,
          0,
          e.r+14
        );

        if(!e.isP){
          ctx.fillStyle='#0008';
          ctx.fillRect(
            -18,
            -e.r-12,
            36,
            4
          );

          ctx.fillStyle='#ef6469';
          ctx.fillRect(
            -18,
            -e.r-12,
            36*
            clamp(
              e.hp/100,
              0,
              1
            ),
            4
          );
        }

        if(e.isP){
          const active=weapon(e);
          const pickup=nearLoot(e,42);

          if(pickup){
            ctx.font='900 11px system-ui';
            ctx.fillStyle='#ffffff';
            ctx.strokeStyle='#0b1118';
            ctx.lineWidth=4;

            const label=
              `E · PICK UP ${lootName(pickup)}`;

            ctx.strokeText(
              label,
              0,
              -e.r-41
            );

            ctx.fillText(
              label,
              0,
              -e.r-41
            );
          }

          if(active){
            const def=WEAPONS[active.id];

            if(
              active.mag<=0&&
              active.reload<=0
            ){
              const reserve=
                e.ammo[def.ammo];

              const reloadText=
                reserve>0
                  ?'R · TO RELOAD'
                  :'NO AMMO';

              const yy=
                pickup
                  ?-e.r-59
                  :-e.r-41;

              ctx.font='950 11px system-ui';
              ctx.fillStyle=
                reserve>0
                  ?'#ffffff'
                  :'#ff8c9d';

              ctx.strokeStyle='#0b1118';
              ctx.lineWidth=4;
              ctx.strokeText(
                reloadText,
                0,
                yy
              );
              ctx.fillText(
                reloadText,
                0,
                yy
              );
            }

            if(active.reload>0){
              const progress=
                clamp(
                  1-
                  active.reload/
                  def.reload,
                  0,
                  1
                );

              const radius=
                e.r+13;

              ctx.strokeStyle=
                'rgba(255,255,255,.18)';

              ctx.lineWidth=4;
              ctx.beginPath();
              ctx.arc(
                0,
                0,
                radius,
                0,
                Math.PI*2
              );
              ctx.stroke();

              ctx.strokeStyle='#ffffff';
              ctx.lineWidth=4;
              ctx.lineCap='round';
              ctx.beginPath();
              ctx.arc(
                0,
                0,
                radius,
                -Math.PI/2,
                -Math.PI/2+
                Math.PI*2*
                progress
              );
              ctx.stroke();

              ctx.font='950 10px system-ui';
              ctx.fillStyle='#ffffff';
              ctx.strokeStyle='#0a1016';
              ctx.lineWidth=3;

              const countdown=
                `${Math.max(
                  0,
                  active.reload
                ).toFixed(1)}s`;

              ctx.strokeText(
                countdown,
                0,
                -radius-10
              );

              ctx.fillText(
                countdown,
                0,
                -radius-10
              );
            }
          }
        }

        ctx.restore();
      };

      bots.forEach(drawChar);

      if(player){
        drawChar(player);
      }

      for(const p of fx){
        ctx.globalAlpha=
          clamp(
            p.life/p.max,
            0,
            1
          );

        ctx.fillStyle=p.c;
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          2.5,
          0,
          Math.PI*2
        );
        ctx.fill();
      }

      ctx.globalAlpha=1;

      // Wenn man NICHT in einem Haus ist, verdeckt dessen Dach wieder Interior/Loot.
      houses.forEach(drawHouseRoof);

      ctx.restore();

      if(
        player?.alive&&
        !inside(player)
      ){
        ctx.fillStyle='#bf321424';
        ctx.fillRect(0,0,W,H);
      }

      drawMini();
    }
    function drawMini(){
      const r=mini.getBoundingClientRect(),mw=r.width,mh=r.height,md=Math.min(2,devicePixelRatio||1);
      if(mini.width!==Math.round(mw*md)){
        mini.width=Math.round(mw*md);
        mini.height=Math.round(mh*md);
        mctx.setTransform(md,0,0,md,0,0);
      }

      mctx.fillStyle='#70a043';
      mctx.fillRect(0,0,mw,mh);

      // Vor Matchstart existieren Zone und Player noch nicht.
      // Die Minimap darf trotzdem gerendert werden, ohne auf null.x zuzugreifen.
      if(!zone || !player) return;

      const sx=mw/worldSize,sy=mh/worldSize;

      mctx.fillStyle='#7e5133';
      for(const h of houses){
        mctx.fillRect(h.x*sx,h.y*sy,h.w*sx,h.h*sy);
      }

      mctx.fillStyle='#986637';
      for(const c of crates){
        if(c.on){
          mctx.fillRect(
            c.x*sx-1,
            c.y*sy-1,
            2,
            2
          );
        }
      }

      mctx.strokeStyle='#fff';
      mctx.lineWidth=1.2;
      mctx.beginPath();
      mctx.arc(zone.x*sx,zone.y*sy,zone.r*sx,0,Math.PI*2);
      mctx.stroke();

      if(player.alive){
        mctx.fillStyle='#24dcff';
        mctx.beginPath();
        mctx.arc(player.x*sx,player.y*sy,3,0,Math.PI*2);
        mctx.fill();
      }

      for(const b of bots){
        if(b.alive && dist(player,b)<210){
          mctx.fillStyle='#f25d70';
          mctx.beginPath();
          mctx.arc(b.x*sx,b.y*sy,2,0,Math.PI*2);
          mctx.fill();
        }
      }
    }
    function update(dt){if(!running||ended)return;time+=dt;updateZone(dt);updatePlayer(dt);bots.forEach(b=>updateBot(b,dt));updateBullets(dt);updateFx(dt);updateCam();updateHud();if(player?.alive&&alive().length===1){placement=1;finish(true)}}
    function scoreFinal(win){return Math.max(0,Math.round(kills*800+damageDone*2+(preset.bots+2-placement)*120+(win?3000:0)))}
    function finish(win){if(ended)return;ended=true;running=false;mouse.down=false;if(!placement)placement=win?1:alive().length+1;const s=scoreFinal(win);services?.highscores?.saveHighscore?.(`survival-royale-${presetKey}`,s);$('.br-end-title').textContent=win?'WINNER WINNER!':`PLACED #${placement}`;$('.br-end-title').style.color=win?'#70e385':'#ff667d';$('.br-end-sub').textContent=`${PRESETS[presetKey].label} · ${DIFFICULTY[diffKey].label}`;$('.ep').textContent='#'+placement;$('.ek').textContent=kills;$('.ed').textContent=Math.round(damageDone);$('.et').textContent=fmt(time);$('.es').textContent=s.toLocaleString('de-DE');end.classList.remove('hide')}
    function start(){preset=PRESETS[presetKey];diff=DIFFICULTY[diffKey];worldSize=preset.size;cam.zoom=1.42;cam.targetZoom=1.42;time=0;kills=0;damageDone=0;placement=0;nextId=1;bullets=[];fx=[];feed=[];generate();spawn();initZone();running=true;ended=false;menu.classList.add('hide');end.classList.add('hide');updateCam();updateHud();addFeed(`${preset.bots+1} players entered the match`)}
    function loop(t){if(dead)return;const dt=Math.min(.033,Math.max(0,(t-last)/1000));last=t;update(dt);draw();raf=requestAnimationFrame(loop)}

    $$('.br-opt[data-p]').forEach(b=>b.onclick=()=>{presetKey=b.dataset.p;$$('.br-opt[data-p]').forEach(x=>x.classList.toggle('sel',x===b))});
    $$('.br-opt[data-d]').forEach(b=>b.onclick=()=>{diffKey=b.dataset.d;$$('.br-opt[data-d]').forEach(x=>x.classList.toggle('sel',x===b))});
    $('.br-start').onclick=start;$('.restart').onclick=start;
    $('.br-sound').onclick=e=>{muted=!muted;e.currentTarget.textContent='Sound: '+(muted?'Aus':'An');if(!muted)tone(620,.04,.016,'sine')};
    window.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();

      if(k==='w')keys.w=true;
      if(k==='a')keys.a=true;
      if(k==='s')keys.s=true;
      if(k==='d')keys.d=true;
      if(k==='shift')keys.shift=true;

      if(!running||!player?.alive)return;

      if(k==='e'){
        const l=nearLoot(player);
        if(l)pick(player,l);
      }

      if(k==='r')reload(player);

      if(k==='1'){
        player.slot=-1;
        if(player.using){player.using=false;player.useT=0}
      }

      if(k==='2'&&player.guns[0]){
        player.slot=0;
      }

      if(k==='3'&&player.guns[1]){
        player.slot=1;
      }

      if(k==='q')useMed(player);
    });
    window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='w')keys.w=false;if(k==='a')keys.a=false;if(k==='s')keys.s=false;if(k==='d')keys.d=false;if(k==='shift')keys.shift=false});
    canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
    canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();mouse.down=true;if(player?.using){player.using=false;player.useT=0}}});
    window.addEventListener('mouseup',e=>{if(e.button===0)mouse.down=false});
    canvas.addEventListener('wheel',e=>{
      if(!running||!player)return;
      e.preventDefault();

      const available=[-1];

      if(player.guns[0])available.push(0);
      if(player.guns[1])available.push(1);

      const currentIndex=Math.max(0,available.indexOf(player.slot));
      const direction=e.deltaY>0?1:-1;
      const next=(currentIndex+direction+available.length)%available.length;

      player.slot=available[next];
    },{passive:false});
    const ro=new ResizeObserver(resize);ro.observe(root);resize();raf=requestAnimationFrame(loop);

    return{destroy:()=>{dead=true;running=false;cancelAnimationFrame(raf);ro.disconnect();try{audio?.close()}catch{}style.remove()}};
  }
};
export{DIFFICULTY,PRESETS,WEAPONS,CFG,GEAR};
