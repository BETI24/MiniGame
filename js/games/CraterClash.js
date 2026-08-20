import {WEAPONS,WEAPON_IDS,DIFFICULTIES,MODES,ARENAS,MATCH_DEFAULTS,STANDARD_TIER_WEIGHTS_BY_QUALITY,WEAPON_QUALITY_LABELS} from "./CraterClashData.js";
import {createState,updateState,currentTank,fire,selectWeapon,clamp,performBotShot,moveTank,resetTrainingRange,getTrainingTelemetry,resetTrainingTelemetry,getAssassinTarget,getAssassinHunter} from "./CraterClashEngine.js";
import {getWeaponTierStats,getWeaponTierCap,createRogueRun,getRogueEnemyScale,rogueStageLabel,rewardRogueVictory,getRogueShopCatalog,buyRogueUpgrade} from "./CraterClashProgression.js";
import {render} from "./CraterClashRender.js";

export default {
  manifest:{
    id:"crater-clash",
    name:"Crater Clash",
    description:"Neon turn-based artillery with 98 weapon families, six battle types, persistent shot tracers, rebound walls, richer procedural terrain, telemetry and an animated arsenal encyclopedia.",
    icon:"💥",
    tags:["Artillery","Strategy","Turn Based","Physics","Roguelite"]
  },

  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),state=null,W=1,H=1,dpr=1,running=false,botThinkDelay=.7,lastTurnId=null,lastInventorySig="";
    let menuMode="standard",mode="ffa",difficulty="normal",arenaIndex=0,trainingArena=0,rogueRun=null;
    let encyWeapon="pulse",encyTier=1,encyPreviewState=null,encyPreviewTimer=0,encyFilter="",encyRaf=0,encyLast=0;
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
      .cc-utility{position:absolute;z-index:16;right:14px;top:90px;display:flex;gap:6px}.cc-util{padding:7px 9px;border:1px solid #ffffff14;border-radius:8px;background:#081722df;color:#9bb1bc;font-size:.51rem;font-weight:950;cursor:pointer;backdrop-filter:blur(8px)}.cc-util:hover{color:#fff;border-color:#66dfff66}.cc-util.telemetry{display:none}.cc.training-live .cc-util.telemetry{display:block}
      .cc-tools-row{display:flex;gap:6px;margin-top:10px}.cc-tools-row button{padding:8px 10px;border:1px solid #ffffff12;border-radius:8px;background:#0a1926;color:#b0c0c8;font-size:.56rem;font-weight:950;cursor:pointer}
      .cc-ency-menu{width:min(1180px,100%)}.cc-ency-head{display:flex;gap:8px;align-items:center;margin:10px 0}.cc-ency-head input,.cc-ency-head select{padding:8px;border:1px solid #ffffff14;border-radius:7px;background:#091722;color:#eef6fb;font-size:.59rem}.cc-ency-head input{flex:1}.cc-close{float:right;border:1px solid #ffffff15;border-radius:7px;background:#2a1724;color:#fff;width:34px;height:34px;cursor:pointer}
      .cc-ency-layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:9px;min-height:520px}.cc-ency-list{overflow:auto;max-height:560px;padding-right:4px;display:grid;align-content:start;gap:4px}.cc-ency-entry{padding:8px;border:1px solid #ffffff0d;border-radius:7px;background:#0b1824;color:#c9d7de;text-align:left;cursor:pointer}.cc-ency-entry.on{border-color:#68dfff;background:#123042}.cc-ency-entry b{font-size:.58rem}.cc-ency-entry span{display:block;color:#718793;font-size:.47rem;margin-top:2px}.cc-ency-detail{padding:12px;border-radius:10px;background:#07131ee5;border:1px solid #ffffff0e}.cc-ency-detail h2{margin:0}.cc-ency-preview{width:100%;height:300px;display:block;border-radius:9px;background:#061019;margin:9px 0;border:1px solid #ffffff0c}.cc-tierpick{display:flex;gap:5px;flex-wrap:wrap}.cc-tierpick button{padding:7px 10px;border:1px solid #ffffff12;border-radius:7px;background:#111e2c;color:#93a5af;font-size:.54rem;font-weight:950;cursor:pointer}.cc-tierpick button.on{border-color:#ffdf77;color:#fff;background:#392d18}.cc-specgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0}.cc-spec{padding:7px;border-radius:7px;background:#0d1c29}.cc-spec span{display:block;color:#6f8490;font-size:.46rem}.cc-spec b{font-size:.59rem}.cc-tiercards{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.cc-tiercard{padding:7px;border:1px solid #ffffff0c;border-radius:7px;background:#0b1925;font-size:.49rem;color:#8498a3}.cc-tiercard b{display:block;color:#eaf4f8;font-size:.55rem;margin-bottom:3px}
      .cc-tel-menu{width:min(1000px,100%)}.cc-tel-table{width:100%;border-collapse:collapse;font-size:.55rem}.cc-tel-table th,.cc-tel-table td{padding:7px;border-bottom:1px solid #ffffff0c;text-align:right}.cc-tel-table th:first-child,.cc-tel-table td:first-child{text-align:left}.cc-tel-table th{color:#79909d;text-transform:uppercase;font-size:.48rem}.cc-tel-good{color:#77e7ad}.cc-tel-warn{color:#ffd06c}.cc-tel-empty{padding:20px;text-align:center;color:#78909b}.cc-tel-actions{display:flex;gap:6px;margin-bottom:9px}.cc-tel-actions button{padding:8px 10px;border:1px solid #ffffff12;border-radius:7px;background:#112635;color:#fff;font-size:.53rem;font-weight:900;cursor:pointer}
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
      @media(max-width:900px){.cc-ency-layout{grid-template-columns:220px minmax(0,1fr)}.cc-specgrid,.cc-tiercards{grid-template-columns:1fr 1fr}.cc-bottom{grid-template-columns:160px minmax(0,1fr)}.cc-shop-layout{grid-template-columns:1fr}.cc-trees{grid-template-columns:1fr 1fr}.cc-info{display:none}.cc-arenas,.cc-setting-grid{grid-template-columns:1fr 1fr}.cc-controls{display:none}.cc-rogue-loop{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.cc-opts,.cc-trees{grid-template-columns:1fr}.cc-setting-grid{grid-template-columns:1fr 1fr}.cc-bottom{grid-template-columns:132px minmax(0,1fr)}.cc-weapon{flex-basis:76px}.cc-menu{padding:14px}}

      /* V10 neon command-deck main menu */
      .cc.menu{background:
        radial-gradient(circle at 15% 14%,rgba(47,221,255,.13),transparent 26%),
        radial-gradient(circle at 82% 22%,rgba(184,84,255,.13),transparent 29%),
        radial-gradient(circle at 55% 86%,rgba(255,77,122,.09),transparent 33%),
        rgba(1,5,11,.94)}
      .cc-main-menu{position:relative;width:min(1220px,100%);padding:0!important;overflow:auto;border:1px solid #62dcff35;background:linear-gradient(160deg,rgba(11,26,41,.98),rgba(6,12,24,.98) 55%,rgba(18,8,29,.98));box-shadow:0 35px 120px #000c,0 0 55px #27c9ff10}
      .cc-main-menu:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 34%,rgba(94,229,255,.035) 34.2% 34.8%,transparent 35% 100%),repeating-linear-gradient(0deg,transparent 0 31px,rgba(255,255,255,.012) 32px)}
      .cc-hero{position:relative;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:24px;align-items:center;padding:28px 30px 22px;border-bottom:1px solid #ffffff0e;overflow:hidden}
      .cc-hero-copy{position:relative;z-index:2}.cc-live{display:flex;align-items:center;gap:7px;font-size:.54rem;font-weight:1000;letter-spacing:.15em;color:#78edff;text-transform:uppercase}.cc-live:before{content:"";width:7px;height:7px;border-radius:50%;background:#68ffc0;box-shadow:0 0 14px #68ffc0}
      .cc-hero .cc-title{font-size:clamp(3.2rem,6vw,6rem);margin:8px 0 10px;filter:drop-shadow(0 0 20px #4fdcff18)}
      .cc-hero .cc-desc{max-width:700px;font-size:.72rem;color:#9dafba}
      .cc-hero-stats{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.cc-hero-stat{padding:7px 10px;border:1px solid #ffffff10;border-radius:8px;background:#06131f99}.cc-hero-stat b{display:block;color:#eafaff;font-size:.73rem}.cc-hero-stat span{font-size:.47rem;color:#708897;text-transform:uppercase;letter-spacing:.08em}
      .cc-hero-actions{display:flex;gap:7px;margin-top:14px}.cc-hero-actions button{padding:9px 12px;border-radius:8px;border:1px solid #68ddff33;background:#0d2837;color:#c9f7ff;font-size:.55rem;font-weight:1000;cursor:pointer}.cc-hero-actions button:hover{border-color:#75e8ff;box-shadow:0 0 20px #51dbff18}
      .cc-hero-visual{position:relative;height:190px;display:grid;place-items:center}
      .cc-radar{position:relative;width:178px;height:178px;border-radius:50%;border:1px solid #68e5ff4d;box-shadow:0 0 40px #51cfff18,inset 0 0 40px #623dff14;background:radial-gradient(circle,#48e5ff12 0 2px,transparent 3px),repeating-radial-gradient(circle,transparent 0 28px,#5bdcff21 29px 30px)}
      .cc-radar:before,.cc-radar:after{content:"";position:absolute;left:50%;top:50%;background:#69e9ff2d;transform:translate(-50%,-50%)}.cc-radar:before{width:1px;height:100%}.cc-radar:after{height:1px;width:100%}
      .cc-radar-sweep{position:absolute;left:50%;top:50%;width:48%;height:2px;transform-origin:left center;background:linear-gradient(90deg,#87f4ff,transparent);box-shadow:0 0 12px #69e9ff;animation:ccRadar 4s linear infinite}@keyframes ccRadar{to{transform:rotate(360deg)}}
      .cc-radar-tank{position:absolute;width:28px;height:10px;border-radius:4px;background:#62f095;box-shadow:0 0 14px #61f090}.cc-radar-tank.one{left:26px;bottom:48px}.cc-radar-tank.two{right:24px;top:49px;background:#ff6078;box-shadow:0 0 14px #ff6078}
      .cc-main-content{position:relative;z-index:1;padding:0 26px 26px}
      .cc-main-menu .cc-tabs{margin:0 -26px 18px;padding:0 26px;border-bottom:1px solid #ffffff0d;background:#050d16a8}.cc-main-menu .cc-tab{border:0;border-radius:0;padding:13px 10px;background:transparent;position:relative}.cc-main-menu .cc-tab.sel{background:linear-gradient(180deg,#48dfff10,transparent);color:#fff}.cc-main-menu .cc-tab.sel:after{content:"";position:absolute;height:2px;left:15%;right:15%;bottom:0;background:linear-gradient(90deg,transparent,#63e8ff,#bd78ff,transparent);box-shadow:0 0 10px #63e8ff}
      .cc-mode-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.cc-mode-grid .cc-opt{position:relative;min-height:132px;padding:12px 11px 10px;overflow:hidden;background:linear-gradient(145deg,#0e2230,#09151f);border-color:#ffffff11;transition:.16s transform,.16s border-color,.16s box-shadow}.cc-mode-grid .cc-opt:hover{transform:translateY(-2px);border-color:var(--mode-accent,#6de4ff);box-shadow:0 10px 28px #0005}.cc-mode-grid .cc-opt.sel{border-color:var(--mode-accent,#6de4ff);box-shadow:inset 0 0 22px color-mix(in srgb,var(--mode-accent,#6de4ff),transparent 88%),0 0 20px color-mix(in srgb,var(--mode-accent,#6de4ff),transparent 88%)}
      .cc-mode-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;margin-bottom:9px;background:color-mix(in srgb,var(--mode-accent,#6de4ff),transparent 86%);border:1px solid color-mix(in srgb,var(--mode-accent,#6de4ff),transparent 55%);color:var(--mode-accent,#6de4ff);font-size:1.05rem;box-shadow:0 0 18px color-mix(in srgb,var(--mode-accent,#6de4ff),transparent 88%)}
      .cc-mode-grid .cc-opt b{font-size:.66rem}.cc-mode-grid .cc-opt span{font-size:.50rem}.cc-mode-tag{position:absolute;right:8px;top:8px;font-size:.42rem!important;color:var(--mode-accent,#6de4ff)!important;font-weight:1000;letter-spacing:.08em}
      .cc-mode-rulebox{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;margin-top:8px;padding:11px 13px;border:1px solid #ffffff0f;border-radius:10px;background:linear-gradient(90deg,#0a1824,#0c1623)}.cc-mode-rulebox small{display:block;color:#667f8e;font-size:.46rem;text-transform:uppercase;letter-spacing:.12em}.cc-mode-rulebox b{display:block;font-size:.66rem;color:#dff8ff;margin-top:2px}.cc-mode-rulebox p{margin:0;color:#8198a5;font-size:.54rem;line-height:1.45}
      .cc-arena-grid{grid-template-columns:repeat(3,1fr)!important}.cc-arena-grid .cc-opt{min-height:76px;position:relative;padding-left:48px;overflow:hidden}.cc-arena-swatch{position:absolute;left:9px;top:9px;bottom:9px;width:29px;border-radius:7px;background:linear-gradient(180deg,var(--sky),var(--ground));box-shadow:inset 0 -13px 0 color-mix(in srgb,var(--ground),#000 30%),0 0 15px color-mix(in srgb,var(--ground),transparent 75%)}
      .cc-settings-wrap{display:grid;grid-template-columns:minmax(0,1fr) 255px;gap:9px}.cc-settings-wrap .cc-setting-grid{grid-template-columns:repeat(3,1fr)}.cc-side-settings{display:grid;gap:7px;align-content:start}.cc-side-card{padding:10px;border-radius:9px;background:#0c1b27;border:1px solid #ffffff0f}.cc-side-card b{font-size:.58rem}.cc-side-card p{margin:4px 0 0;color:#768d99;font-size:.49rem;line-height:1.4}.cc-jug-config{display:none}.cc-jug-config.show{display:block;border-color:#ffbd5944;background:linear-gradient(145deg,#261b11,#15141b)}
      .cc-main-menu .cc-start{height:48px;letter-spacing:.05em;background:linear-gradient(100deg,#58e5ff,#7f87ff 54%,#da68f3);box-shadow:0 12px 35px #36bfff20}.cc-main-menu .cc-start:hover{filter:brightness(1.08)}
      @media(max-width:1050px){.cc-mode-grid{grid-template-columns:repeat(3,1fr)}.cc-settings-wrap{grid-template-columns:1fr}.cc-side-settings{grid-template-columns:1fr 1fr}.cc-hero{grid-template-columns:1fr 240px}.cc-radar{width:150px;height:150px}}
      @media(max-width:760px){.cc-hero{grid-template-columns:1fr;padding:20px}.cc-hero-visual{display:none}.cc-main-content{padding:0 14px 18px}.cc-main-menu .cc-tabs{margin:0 -14px 14px;padding:0 14px}.cc-mode-grid{grid-template-columns:1fr 1fr}.cc-arena-grid{grid-template-columns:1fr 1fr!important}.cc-mode-rulebox{grid-template-columns:1fr}.cc-settings-wrap .cc-setting-grid{grid-template-columns:1fr 1fr}.cc-side-settings{grid-template-columns:1fr}}
    `;

    const root=document.createElement("div");root.className="cc";
    root.innerHTML=`
      <canvas></canvas>
      <div class="cc-controls">A / D = Drive · ← / → = Angle · ↑ / ↓ = Power<br>Q / E = Weapon · SPACE = Fire · Mouse = Aim + Fire · Training: R = Reset</div>
      <div class="cc-utility"><button class="cc-util codex">ARSENAL CODEX</button><button class="cc-util telemetry">BALANCE DATA</button></div>
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
      <div class="cc-overlay menu"><div class="cc-menu cc-main-menu">
        <section class="cc-hero">
          <div class="cc-hero-copy">
            <div class="cc-live">Ballistics command deck online</div>
            <div class="cc-title">CRATER<br>CLASH</div>
            <div class="cc-desc">A neon artillery sandbox built around destructive terrain, readable trajectories and a giant evolving arsenal. Pick a ruleset, tune the battlefield, then turn geometry into damage.</div>
            <div class="cc-hero-stats">
              <div class="cc-hero-stat"><b>98</b><span>Weapon families</span></div>
              <div class="cc-hero-stat"><b>287</b><span>Tier variants</span></div>
              <div class="cc-hero-stat"><b>${ARENAS.length}</b><span>Procedural arenas</span></div>
              <div class="cc-hero-stat"><b>5</b><span>Standard modes</span></div>
            </div>
            <div class="cc-hero-actions"><button class="menu-codex">OPEN ARSENAL CODEX</button></div>
          </div>
          <div class="cc-hero-visual"><div class="cc-radar"><div class="cc-radar-sweep"></div><div class="cc-radar-tank one"></div><div class="cc-radar-tank two"></div></div></div>
        </section>
        <div class="cc-main-content">
          <div class="cc-tabs"><button class="cc-tab sel" data-tab="standard">STANDARD MATCH</button><button class="cc-tab" data-tab="rogue">ROGUE RUN</button><button class="cc-tab" data-tab="training">TRAINING RANGE</button></div>
          <div class="standard-panel">
            <div class="cc-sec">Battle Protocol</div>
            <div class="cc-opts modeopts cc-mode-grid">${Object.entries(MODES).filter(([k])=>k!=="training").map(([k,m])=>`<button class="cc-opt ${k==="ffa"?"sel":""}" data-mode="${k}" style="--mode-accent:${m.accent}"><span class="cc-mode-tag">${k==="assassin"||k==="juggernaut"?"SPECIAL":"CORE"}</span><div class="cc-mode-icon">${m.icon}</div><b>${m.label}</b><span>${m.description}</span></button>`).join("")}</div>
            <div class="cc-mode-rulebox"><div><small>Selected protocol</small><b class="cc-mode-rule-title">${MODES.ffa.label}</b></div><p class="cc-mode-rule-copy">${MODES.ffa.rule}</p></div>

            <div class="cc-sec">Arena Matrix</div>
            <div class="cc-opts cc-arenas arenaopts cc-arena-grid">${ARENAS.map((a,i)=>`<button class="cc-opt ${i===0?"sel":""}" data-arena="${i}"><span class="cc-arena-swatch" style="--sky:${a.sky[1]};--ground:${a.terrain?.[0]||"#55d99a"}"></span><b>${a.name}</b><span>${a.profile} · Wind ${a.wind.toFixed(2)}× · Gravity ${(a.gravity||1).toFixed(2)}×</span></button>`).join("")}</div>

            <div class="cc-sec">Opposition</div>
            <div class="cc-opts diffopts">${Object.entries(DIFFICULTIES).map(([k,d])=>`<button class="cc-opt ${k==="normal"?"sel":""}" data-d="${k}"><b>${d.label}</b><span>${k==="easy"?"Forgiving aim and wider errors.":k==="hard"?"Tight ballistic search and stronger positioning.":"Balanced artillery opponents."}</span></button>`).join("")}</div>

            <div class="cc-sec">Match Configuration</div>
            <div class="cc-settings-wrap">
              <div class="cc-setting-grid">
                <div class="cc-setting"><label>Tanks</label><select data-set="playerCount"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div>
                <div class="cc-setting"><label>HP</label><select data-set="hp"><option selected>100</option><option>150</option><option>200</option><option>300</option></select></div>
                <div class="cc-setting"><label>Turn Time</label><select data-set="turnTime"><option>15</option><option selected>30</option><option>45</option><option>60</option></select></div>
                <div class="cc-setting"><label>Fuel / Turn</label><select data-set="fuel"><option>70</option><option selected>100</option><option>140</option><option value="9999">Unlimited</option></select></div>
                <div class="cc-setting"><label>Starting Weapons</label><select data-set="weaponCount"><option>8</option><option selected>12</option><option>16</option><option>20</option></select></div>
                <div class="cc-setting"><label>Wind</label><select data-set="wind"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="extreme">Extreme</option></select></div>
                <div class="cc-setting"><label>Trick Objects</label><select data-set="skillObjects"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select></div>
                <div class="cc-setting"><label>Airdrops</label><select data-set="crates"><option value="off">Off</option><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select></div>
                <div class="cc-setting"><label>Weapon Quality</label><select data-set="weaponQuality"><option value="1" selected>1 · Standard</option><option value="2">2 · Improved</option><option value="3">3 · High</option><option value="4">4 · Elite</option></select></div>
                <div class="cc-setting"><label>Terrain Traversal</label><select data-set="terrainMobility"><option value="standard" selected>1 · Standard</option><option value="improved">2 · Improved Tracks</option><option value="climber">3 · Climbing Tracks</option><option value="allterrain">4 · All-Terrain</option></select></div>
                <div class="cc-setting"><label>Shot Tracer</label><select data-set="tracer"><option value="true" selected>On</option><option value="false">Off</option></select></div>
              </div>
              <aside class="cc-side-settings">
                <div class="cc-side-card cc-jug-config"><b>♛ Juggernaut Assignment</b><p>Choose whether you command the Juggernaut or one of the hunters.</p><div class="cc-setting" style="margin-top:7px"><label>Juggernaut</label><select data-set="juggernautRole"><option value="player" selected>You</option><option value="bot">Random Bot</option></select></div></div>
                <div class="cc-side-card"><b>Weapon Quality</b><p>Higher levels shift normal weapon rolls toward stronger tiers. Family tier caps are always respected.</p></div>
                <div class="cc-side-card"><b>Terrain Traversal</b><p>Track grip changes which slopes can be crossed. Tiny crater lips remain forgiving at every level.</p></div>
              </aside>
            </div>
            <div class="cc-note"><b>Restock:</b> every 8 player shots grants five new special weapons and partially restores the terrain. <b>Juggernaut:</b> requires at least three tanks; HP = hunters × base HP × 1.5 and starting arsenal = 1.5× normal. <b>Assassin:</b> only your current target can take your damage.</div>
            <button class="cc-start start-standard">DEPLOY TO ARENA</button>
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
            <div class="cc-note"><b>Arsenal:</b> all valid T1–T4 variants are loaded with infinite ammo. Q/E cycles the full range. No bots fire back and dummies are restored after each completed weapon sequence. The new Balance Data panel records shots, hit rate, average damage and max damage for every variant you test.</div>
            <button class="cc-start start-training">ENTER TRAINING RANGE</button>
          </div>
        </div>
        </div>
      </div></div>
      <div class="cc-overlay encyclopedia hide"><div class="cc-menu cc-ency-menu"><button class="cc-close ency-close">✕</button><div class="cc-k">Weapon Laboratory Reference</div><div class="cc-title" style="font-size:2.8rem">ARSENAL CODEX</div><div class="cc-desc">Search all weapon families, compare every valid evolution tier and watch the actual game engine fire the selected variant in a looping miniature training range.</div><div class="cc-ency-head"><input class="ency-search" placeholder="Search weapon or category…"><select class="ency-category"><option value="">All categories</option></select></div><div class="cc-ency-layout"><div class="cc-ency-list"></div><div class="cc-ency-detail"></div></div></div></div>
      <div class="cc-overlay telemetry-overlay hide"><div class="cc-menu cc-tel-menu"><button class="cc-close tel-close">✕</button><div class="cc-k">Training Range Analytics</div><div class="cc-title" style="font-size:2.8rem">BALANCE DATA</div><div class="cc-desc">Session telemetry is recorded only from player shots in Training Range. Hit Rate is the percentage of shots that dealt at least one point of enemy damage.</div><div class="cc-tel-actions"><button class="tel-refresh">REFRESH</button><button class="tel-reset">RESET SESSION DATA</button></div><div class="cc-tel-content"></div></div></div>
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
    const angleInput=root.querySelector(".angle"),powerInput=root.querySelector(".power"),fireBtn=root.querySelector(".cc-fire"),menu=root.querySelector(".menu"),end=root.querySelector(".end"),upgrade=root.querySelector(".upgrade"),ency=root.querySelector(".encyclopedia"),telemetryOverlay=root.querySelector(".telemetry-overlay");
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
      if(p){const pct=p.maxFuel>9000?100:clamp(p.fuel/p.maxFuel*100,0,100);fuelBar.style.width=pct+"%";fuelText.textContent=`FUEL ${p.maxFuel>9000?"∞":Math.ceil(p.fuel)} / ${p.maxFuel>9000?"∞":Math.round(p.maxFuel)} · GRIP ${Math.round((p.grip||.8)*180/Math.PI)}°`;}
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
      let modeLine="";
      if(state.mode==="assassin"){
        const target=getAssassinTarget(state,p),hunter=getAssassinHunter(state,p);
        modeLine=`<br><b style="color:#ff7890">TARGET ${target?.name||"—"}</b> · Hunter: ${hunter?.name||"—"} · Assassin XP ${p.assassinXP||0}`;
      }else if(state.mode==="juggernaut"){
        modeLine=p.isJuggernaut?`<br><b style="color:#ffc75f">YOU ARE THE JUGGERNAUT</b> · ${p.inventory.length} starting slots`:`<br><b style="color:#ffc75f">HUNT THE JUGGERNAUT</b> · ${state.tanks.find(t=>t.isJuggernaut&&t.alive)?.name||"defeated"}`;
      }
      infoEl.innerHTML=`<h3 style="color:${d.color}">${d.icon} ${d.name} · T${d.tier}/${d.maxTier}</h3><p>${d.description}<br><b>${d.tierName}</b> · ${d.tierNote||"Functional upgrade"}${d.fragments?` · ${d.fragments} fragments`:d.bombs?` · ${d.bombs} strikes`:d.bounces?` · ${d.bounces} bounces`:""}${modeLine}</p><div class="cc-charge"><div style="width:${p.overcharge}%"></div></div><p>${p.overchargeReady?"OVERCHARGE READY · +28% damage":"Overcharge "+Math.round(p.overcharge)+"% · Crit "+Math.round((p.critChance||0)*100)+"%"}</p>`;
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

    function payloadEstimate(d){
      const n=Math.max(1,d.count||d.fragments||d.bombs||1);let value=(d.damage||0)*n;
      if(d.echoes)value+=(d.echoDamage||0)*d.echoes;if(d.chain&&d.damage)value+=d.damage*Math.max(0,d.chain-1)*.65;
      return Math.round(value);
    }
    function resetEncyPreview(){
      const c=ency.querySelector(".cc-ency-preview");if(!c)return;
      const r=c.getBoundingClientRect(),pw=Math.max(620,Math.round(r.width||720)),ph=300;
      c.width=pw;c.height=ph;const pc=c.getContext("2d");
      encyPreviewState=createState({width:pw,height:ph,mode:"training",difficulty:"easy",arenaIndex:0,settings:{playerCount:5,hp:600,turnTime:9999,wind:"off",fuel:9999,weaponCount:20,skillObjects:"off",crates:"off",tracer:true,terrainMobility:"allterrain"}});
      const t=encyPreviewState.tanks[0];t.x=pw*.18;t.y=encyPreviewState.terrain[Math.round(t.x)]-11;
      const dummy=encyPreviewState.tanks[2]||encyPreviewState.tanks[1];if(dummy){dummy.x=pw*.70;dummy.y=encyPreviewState.terrain[Math.round(dummy.x)]-11;}
      selectWeapon(encyPreviewState,t,encyWeapon,encyTier);t.selected=encyWeapon;t.selectedTier=encyTier;encyPreviewState.playerAngle=Math.PI*.28;encyPreviewState.playerPower=66;t.angle=encyPreviewState.playerAngle;t.power=66;
      fire(encyPreviewState,t,encyPreviewState.playerAngle,66,encyWeapon,encyTier);encyPreviewTimer=0;
      render(pc,encyPreviewState,pw,ph);
    }
    function renderEncyList(){
      const list=ency.querySelector(".cc-ency-list"),search=ency.querySelector(".ency-search").value.trim().toLowerCase(),cat=ency.querySelector(".ency-category").value;
      const ids=WEAPON_IDS.filter(id=>{const d=getWeaponTierStats(id,1);return (!search||d.name.toLowerCase().includes(search)||d.category.toLowerCase().includes(search)||id.includes(search))&&(!cat||d.category===cat);});
      list.innerHTML=ids.map(id=>{const d=getWeaponTierStats(id,1);return `<button class="cc-ency-entry ${id===encyWeapon?"on":""}" data-ew="${id}"><b style="color:${d.color}">${d.icon} ${d.name}</b><span>${d.category} · ${getWeaponTierCap(id)} tier${getWeaponTierCap(id)===1?"":"s"}</span></button>`;}).join("")||`<div class="cc-tel-empty">No matching weapons.</div>`;
      list.querySelectorAll("[data-ew]").forEach(b=>b.onclick=()=>{encyWeapon=b.dataset.ew;encyTier=Math.min(encyTier,getWeaponTierCap(encyWeapon));renderEncyclopedia();});
    }
    function renderEncyclopedia(){
      const d=getWeaponTierStats(encyWeapon,encyTier),cap=getWeaponTierCap(encyWeapon),detail=ency.querySelector(".cc-ency-detail");
      detail.innerHTML=`<h2 style="color:${d.color}">${d.icon} ${d.name}</h2><p class="cc-desc">${d.description}</p><div class="cc-tierpick">${Array.from({length:cap},(_,i)=>i+1).map(t=>`<button class="${t===encyTier?"on":""}" data-et="${t}">T${t} · ${getWeaponTierStats(encyWeapon,t).name}</button>`).join("")}</div><canvas class="cc-ency-preview"></canvas><div class="cc-specgrid"><div class="cc-spec"><span>Category</span><b>${d.category}</b></div><div class="cc-spec"><span>Direct / unit damage</span><b>${d.damage!=null?Math.round(d.damage):"Utility"}</b></div><div class="cc-spec"><span>Blast radius</span><b>${d.radius?Math.round(d.radius):"—"}</b></div><div class="cc-spec"><span>Raw payload estimate</span><b>~${payloadEstimate(d)}</b></div></div><div class="cc-tiercards">${Array.from({length:cap},(_,i)=>i+1).map(t=>{const q=getWeaponTierStats(encyWeapon,t);return `<div class="cc-tiercard"><b>T${t} · ${q.name}</b>${q.tierNote||q.tierName}<br>${q.damage!=null?`Damage ${Math.round(q.damage)}`:"Utility"}${q.count?` · ${q.count} shots`:q.fragments?` · ${q.fragments} fragments`:q.bombs?` · ${q.bombs} strikes`:q.bounces?` · ${q.bounces} bounces`:""}</div>`;}).join("")}</div>`;
      detail.querySelectorAll("[data-et]").forEach(b=>b.onclick=()=>{encyTier=Number(b.dataset.et);renderEncyclopedia();});renderEncyList();requestAnimationFrame(resetEncyPreview);
    }
    function encyLoop(now){
      if(ency.classList.contains("hide")){encyRaf=0;return;}
      const dt=Math.min(.033,Math.max(.001,(now-(encyLast||now))/1000));encyLast=now;
      if(encyPreviewState){const c=ency.querySelector(".cc-ency-preview"),pc=c?.getContext("2d");encyPreviewTimer+=dt;updateState(encyPreviewState,dt);if(encyPreviewState.phase==="aim"&&encyPreviewTimer>1.0)resetEncyPreview();if(pc)render(pc,encyPreviewState,encyPreviewState.width,encyPreviewState.height);}
      encyRaf=requestAnimationFrame(encyLoop);
    }
    function openEncyclopedia(){
      const cats=[...new Set(WEAPON_IDS.map(id=>getWeaponTierStats(id,1).category))].sort();const sel=ency.querySelector(".ency-category");if(sel.options.length<=1)sel.insertAdjacentHTML("beforeend",cats.map(c=>`<option>${c}</option>`).join(""));
      ency.classList.remove("hide");renderEncyclopedia();encyLast=performance.now();if(!encyRaf)encyRaf=requestAnimationFrame(encyLoop);
    }
    function closeEncyclopedia(){ency.classList.add("hide");encyPreviewState=null;if(encyRaf){cancelAnimationFrame(encyRaf);encyRaf=0;}}
    function renderTelemetry(){
      const box=telemetryOverlay.querySelector(".cc-tel-content");if(!state?.training){box.innerHTML=`<div class="cc-tel-empty">Enter Training Range to collect weapon telemetry.</div>`;return;}
      const rows=getTrainingTelemetry(state).sort((a,b)=>b.avgDamage-a.avgDamage);
      if(!rows.length){box.innerHTML=`<div class="cc-tel-empty">No training shots recorded yet. Fire any weapon to begin collecting balance data.</div>`;return;}
      box.innerHTML=`<table class="cc-tel-table"><thead><tr><th>Weapon</th><th>Shots</th><th>Hit Rate</th><th>Avg Damage</th><th>Max Damage</th><th>Avg Events</th><th>Last</th></tr></thead><tbody>${rows.map(e=>{const d=getWeaponTierStats(e.weaponId,e.tier),hit=e.hitRate*100;return `<tr><td style="color:${d.color}">${d.name} · T${e.tier}</td><td>${e.shots}</td><td class="${hit>=60?"cc-tel-good":hit<25?"cc-tel-warn":""}">${hit.toFixed(0)}%</td><td>${e.avgDamage.toFixed(1)}</td><td>${e.maxDamage.toFixed(1)}</td><td>${e.avgEvents.toFixed(1)}</td><td>${e.lastDamage.toFixed(1)}</td></tr>`;}).join("")}</tbody></table>`;
    }
    function openTelemetry(){telemetryOverlay.classList.remove("hide");renderTelemetry();}

    function startMatch(opts){
      state=createState({width:W,height:H,...opts});running=true;root.classList.toggle("training-live",!!state.training);lastTurnId=null;lastInventorySig="";menu.classList.add("hide");end.classList.add("hide");upgrade.classList.add("hide");syncAimUI();renderWeapons();renderInfo();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
    }
    function startStandard(){
      rogueRun=null;
      const cfg={...settings};
      if(mode==="juggernaut")cfg.playerCount=Math.max(3,Number(cfg.playerCount)||4);
      startMatch({mode,difficulty,arenaIndex,settings:cfg});
    }
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

    function playerWon(){
      if(state.mode==="teams")return state.winner==="Team 1";
      if(state.mode==="juggernaut"){
        const p=playerTank();return p.isJuggernaut?state.winner==="YOU":state.winner==="HUNTERS";
      }
      return state.winner==="YOU";
    }
    function finish(){
      if(state?.training)return;
      running=false;moveKeys.left=moveKeys.right=false;const p=playerTank(),won=playerWon();
      services?.highscores?.saveHighscore?.("crater-clash",Math.round(p.damage*8+p.kills*500+(p.assassinXP||0)*250+(p.juggernautXP||0)*250+(won?2500:0)+(rogueRun?rogueRun.stage*850:0)));
      if(rogueRun){
        if(won){
          rogueRun.wins++;
          const earned=rewardRogueVictory(rogueRun,{damage:p.damage,rounds:state.round});
          rogueRun.history.push({stage:rogueRun.stage,damage:Math.round(p.damage),rounds:state.round,salvage:earned});
          showRogueShop(earned);
        }else showRogueGameOver();
        return;
      }
      end.classList.remove("hide");end.querySelector(".result-title").textContent=won?"VICTORY":"DEFEAT";
      const modeDesc=state.mode==="assassin"?(won?`Assassination chain complete · ${p.assassinXP||0} double-kill XP credits earned.`:"Your hunter closed the contract first. Track the TARGET marker and remember that non-targets are immune to your damage."):state.mode==="juggernaut"?(won?(p.isJuggernaut?"You survived the entire field as the Juggernaut.":`The hunters brought down the Juggernaut. · ${p.juggernautXP||0} double-kill XP credits earned.`):(p.isJuggernaut?"The hunters broke the Juggernaut.":"The Juggernaut outlasted every hunter.")):(won?"You controlled movement, terrain and trick-shot geometry better than the opposition.":"The crater field belongs to someone else this time. Reposition, use the tracer and save high-tier weapons for better opportunities.");
      end.querySelector(".result-desc").textContent=modeDesc;end.querySelector(".rw").textContent=state.winner;end.querySelector(".rr").textContent=state.round;end.querySelector(".rd").textContent=Math.round(p.damage);end.querySelector(".rk").textContent=p.kills;
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
    function refreshModeConfig(){
      const m=MODES[mode]||MODES.ffa;
      const rt=root.querySelector(".cc-mode-rule-title"),rc=root.querySelector(".cc-mode-rule-copy"),jug=root.querySelector(".cc-jug-config");
      if(rt)rt.textContent=m.label;if(rc)rc.textContent=m.rule||m.description;if(jug)jug.classList.toggle("show",mode==="juggernaut");
      const tanks=root.querySelector('[data-set="playerCount"]');
      if(mode==="juggernaut"&&Number(tanks?.value)<3){tanks.value="3";settings.playerCount=3;}
    }
    root.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");mode=btn.dataset.mode;refreshModeConfig();});
    root.querySelectorAll("[data-arena]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-arena]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");arenaIndex=Number(btn.dataset.arena);});
    root.querySelectorAll("[data-d]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-d]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");difficulty=btn.dataset.d;});
    root.querySelectorAll("[data-set]").forEach(sel=>sel.onchange=()=>{const k=sel.dataset.set,v=sel.value;settings[k]=["playerCount","hp","turnTime","fuel","weaponCount","weaponQuality"].includes(k)?Number(v):k==="tracer"?v==="true":v;});
    root.querySelector(".codex").onclick=openEncyclopedia;root.querySelector(".menu-codex").onclick=openEncyclopedia;ency.querySelector(".ency-close").onclick=closeEncyclopedia;ency.querySelector(".ency-search").oninput=renderEncyList;ency.querySelector(".ency-category").onchange=renderEncyList;
    root.querySelector(".telemetry").onclick=openTelemetry;telemetryOverlay.querySelector(".tel-close").onclick=()=>telemetryOverlay.classList.add("hide");telemetryOverlay.querySelector(".tel-refresh").onclick=renderTelemetry;telemetryOverlay.querySelector(".tel-reset").onclick=()=>{if(state?.training){resetTrainingTelemetry(state);renderTelemetry();}};
    upgrade.querySelector(".cc-next").onclick=()=>{if(!rogueRun)return;rogueRun.stage++;upgrade.classList.add("hide");startRogueBattle();};
    root.querySelector(".training-arena").onchange=e=>trainingArena=Number(e.target.value)||0;
    root.querySelector(".start-standard").onclick=startStandard;root.querySelector(".start-rogue").onclick=startNewRogue;root.querySelector(".start-training").onclick=startTraining;root.querySelector(".restart").onclick=()=>{end.classList.add("hide");menu.classList.remove("hide");root.classList.remove("training-live");rogueRun=null;};
    refreshModeConfig();

    return {destroy:()=>{destroyed=true;cancelAnimationFrame(raf);if(encyRaf)cancelAnimationFrame(encyRaf);ro.disconnect();window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);style.remove();}};
  }
};
