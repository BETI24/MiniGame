import {WEAPONS,WEAPON_IDS,DIFFICULTIES,MODES,ARENAS,MATCH_DEFAULTS,STANDARD_TIER_WEIGHTS_BY_QUALITY,WEAPON_QUALITY_LABELS} from "./CraterClashData.js";
import {createState,updateState,currentTank,fire,selectWeapon,clamp,performBotShot,moveTank,resetTrainingRange,drainTelemetryEvents,getAssassinTarget,getAssassinHunter} from "./CraterClashEngine.js";
import {getWeaponTierStats,getWeaponTierCap,createRogueRun,getRogueEnemyScale,rogueStageLabel,rewardRogueVictory,getRogueShopCatalog,buyRogueUpgrade} from "./CraterClashProgression.js";
import {render} from "./CraterClashRender.js";

export default {
  manifest:{
    id:"crater-clash",
    name:"Crater Clash",
    description:"Neon turn-based artillery with 152 weapon families, 466 tier variants, weapon-aware AI, persistent analytics and destructive terrain.",
    icon:"💥",
    tags:["Artillery","Strategy","Turn Based","Physics","Roguelite"]
  },

  init:(container,services)=>{
    let destroyed=false,raf=0,last=performance.now(),state=null,W=1,H=1,dpr=1,running=false,botThinkDelay=.7,lastTurnId=null,lastInventorySig="";
    let menuMode="standard",mode="ffa",difficulty="normal",arenaIndex=0,trainingArena=0,rogueRun=null;
    let encyWeapon="pulse",encyTier=1,encyPreviewState=null,encyPreviewTimer=0,encyFilter="",encyRaf=0,encyLast=0;
    let weaponSearch="",weaponCategory="",balanceSearch="",balanceSort="samples";
    const settings={...MATCH_DEFAULTS};
    const TOTAL_VARIANTS=WEAPON_IDS.reduce((n,id)=>n+getWeaponTierCap(id),0);
    const moveKeys={left:false,right:false};
    const TELEMETRY_KEY="crater-clash-balance-v2";
    let balanceStore=loadBalanceStore(),balanceSaveTimer=0;

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
      .cc-overlay.menu{background:
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

      /* V11 clarity / responsive desktop UI */
      .cc-controls.hide{display:none}.cc-controls{pointer-events:none;top:88px;font-size:.62rem;line-height:1.65;padding:10px 12px;border-color:#68dcff22;background:#06111bea}.cc-controls b{color:#dff8ff;font-size:.58rem;letter-spacing:.10em}
      .cc-utility{top:88px}.cc-util{font-size:.58rem;padding:8px 10px;background:#07141fe8}.cc-util.leave-match{border-color:#ff7c8a2e;color:#f0a8ae}.cc-util.leave-match:hover{border-color:#ff7585;color:#fff}
      .cc-bottom{width:min(1240px,calc(100% - 28px));grid-template-columns:230px minmax(0,1fr);gap:9px}.cc-armament{padding:8px;min-width:0}.cc-info{min-height:42px;padding:2px 5px 7px}.cc-info h3{font-size:.78rem}.cc-info p{font-size:.55rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-info .cc-charge{display:none}
      .cc-quickbar{display:grid;grid-template-columns:minmax(0,1fr) 126px;gap:6px;align-items:stretch}.cc-weapons{min-height:65px;padding:0;overflow:hidden;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}.cc-weapon{min-width:0;min-height:65px;flex:none;padding:6px}.cc-wname{font-size:.57rem}.cc-wcat{font-size:.46rem}.cc-open-arsenal{border:1px solid #68ddff32;border-radius:9px;background:linear-gradient(145deg,#0c2635,#151b34);color:#d9f8ff;cursor:pointer;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}.cc-open-arsenal:hover{border-color:#69e5ff;box-shadow:0 0 20px #46d7ff18}.cc-open-arsenal b{font-size:.59rem}.cc-open-arsenal .weapon-count{font-size:1rem;font-weight:1000;color:#7ce7ff}.cc-open-arsenal small{font-size:.43rem;color:#738b99;font-weight:950}
      .cc.cc-compact .cc-bottom{grid-template-columns:185px minmax(0,1fr)}.cc.cc-compact .cc-armament{padding:5px}.cc.cc-compact .cc-info{display:block;min-height:32px;padding:1px 3px 4px}.cc.cc-compact .cc-info p{display:none}.cc.cc-compact .cc-weapons{grid-template-columns:repeat(5,minmax(0,1fr));min-height:55px}.cc.cc-compact .cc-weapon{min-height:55px;min-width:0}.cc.cc-compact .cc-quickbar{grid-template-columns:minmax(0,1fr) 106px}.cc.cc-short .cc-info{display:none}.cc.cc-short .cc-weapons{grid-template-columns:repeat(5,minmax(0,1fr));min-height:48px}.cc.cc-short .cc-weapon{min-height:48px}.cc.cc-short .cc-open-arsenal b{font-size:.49rem}.cc.cc-short .cc-open-arsenal .weapon-count{font-size:.78rem}

      .cc-arsenal-menu{width:min(1180px,100%)}.cc-arsenal-head{display:grid;grid-template-columns:minmax(260px,1fr) 220px auto;gap:8px;align-items:center;margin:14px 0 12px}.cc-arsenal-head input,.cc-arsenal-head select,.cc-tel-toolbar input,.cc-tel-toolbar select{width:100%;padding:10px 11px;border:1px solid #ffffff16;border-radius:8px;background:#091722;color:#eef6fb;font:inherit;font-size:.66rem}.arsenal-summary{color:#77909d;font-size:.56rem;font-weight:900;text-align:right}.cc-arsenal-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;max-height:min(62vh,620px);overflow:auto;padding-right:3px}.cc-arsenal-card{position:relative;min-height:112px;padding:12px;border:1px solid #ffffff12;border-radius:11px;background:linear-gradient(145deg,#102131,#0a1520);color:#dbe8ed;text-align:left;cursor:pointer}.cc-arsenal-card:hover:not(:disabled){transform:translateY(-1px);border-color:#6de2ff77;background:#122b3d}.cc-arsenal-card.on{border-color:#70e7ff;box-shadow:inset 0 0 0 1px #70e7ff44,0 0 22px #4cdcff18}.cc-arsenal-card:disabled{opacity:.34;cursor:not-allowed}.cc-arsenal-card .ico{font-size:1.25rem}.cc-arsenal-card b{display:block;margin-top:8px;font-size:.72rem}.cc-arsenal-card p{margin:4px 0 0;color:#718895;font-size:.53rem;line-height:1.35}.cc-arsenal-card .meta{position:absolute;right:9px;top:9px;text-align:right;color:#ffd86d;font-size:.55rem;font-weight:1000}.cc-arsenal-card .meta small{display:block;color:#8be9ff;font-size:.47rem;margin-top:2px}

      .cc-main-menu{width:min(1420px,100%)}.cc-hero{grid-template-columns:minmax(0,1.45fr) minmax(260px,.55fr);padding:30px 36px 24px}.cc-hero .cc-desc{font-size:.86rem;line-height:1.62;max-width:820px}.cc-live{font-size:.60rem}.cc-hero-stat{padding:8px 12px}.cc-hero-stat b{font-size:.86rem}.cc-hero-stat span{font-size:.53rem}.cc-hero-actions button{font-size:.64rem;padding:10px 14px}.cc-main-content{padding:0 32px 30px}.cc-main-menu .cc-tabs{margin:0 -32px 22px;padding:0 32px}.cc-main-menu .cc-tab{font-size:.78rem;padding:15px 10px}.cc-sec{font-size:.66rem;margin:18px 0 8px;letter-spacing:.06em}.cc-mode-grid{gap:10px}.cc-mode-grid .cc-opt{min-height:150px;padding:15px}.cc-mode-grid .cc-opt b{font-size:.78rem}.cc-mode-grid .cc-opt span{font-size:.59rem;line-height:1.48}.cc-mode-icon{width:39px;height:39px;font-size:1.18rem}.cc-mode-rulebox{padding:13px 15px;grid-template-columns:180px 1fr}.cc-mode-rulebox small{font-size:.52rem}.cc-mode-rulebox b{font-size:.74rem}.cc-mode-rulebox p{font-size:.62rem}.cc-arena-grid .cc-opt{min-height:84px;padding-left:53px}.cc-arena-grid .cc-opt b{font-size:.72rem}.cc-arena-grid .cc-opt span{font-size:.56rem}.cc-setting{padding:10px 11px}.cc-setting label{font-size:.56rem}.cc-setting select{font-size:.68rem;padding:8px}.cc-side-card{padding:12px}.cc-side-card b{font-size:.66rem}.cc-side-card p{font-size:.56rem}.cc-note{font-size:.61rem;padding:11px 13px}.cc-quick-config{display:grid;grid-template-columns:1fr 210px;gap:12px;align-items:center;margin-top:12px;padding:11px 13px;border:1px solid #ffffff0f;border-radius:10px;background:#091722b8}.cc-quick-config>b,.cc-quick-config div>b{display:block;font-size:.68rem;color:#d9edf4}.cc-quick-config div>span{display:block;margin-top:3px;color:#728995;font-size:.55rem}.cc-quick-config .cc-setting{padding:7px 9px}
      .cc-advanced{margin-top:18px;border:1px solid #ffffff11;border-radius:12px;background:#07131da8;overflow:hidden}.cc-advanced summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;cursor:pointer;background:linear-gradient(90deg,#0b1e2b,#11172a)}.cc-advanced summary::-webkit-details-marker{display:none}.cc-advanced summary b{display:block;font-size:.68rem;color:#d9edf4;letter-spacing:.04em}.cc-advanced summary span:not(.cc-chevron){display:block;color:#718896;font-size:.54rem;margin-top:3px}.cc-chevron{font-size:1.2rem;color:#75e7ff;transition:.18s transform}.cc-advanced[open] .cc-chevron{transform:rotate(180deg)}.cc-advanced-body{padding:5px 13px 13px}.cc-advanced .cc-settings-wrap{margin-top:8px}

      .cc-ency-menu{width:min(1420px,100%)}.cc-ency-layout{grid-template-columns:280px minmax(0,1fr);gap:12px;min-height:620px}.cc-ency-list{max-height:690px}.cc-ency-entry{padding:10px}.cc-ency-entry b{font-size:.66rem}.cc-ency-entry span{font-size:.52rem}.cc-ency-detail{padding:15px}.cc canvas.cc-ency-preview{width:100%;height:min(46vh,430px);min-height:350px;margin:12px 0}.cc-ency-head input,.cc-ency-head select{font-size:.66rem;padding:10px}.cc-tierpick button{font-size:.60rem}.cc-spec span{font-size:.50rem}.cc-spec b{font-size:.67rem}.cc-tiercard{font-size:.54rem}.cc-tiercard b{font-size:.62rem}

      .cc-tel-menu{width:min(1280px,100%)}.cc-tel-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 210px auto auto;gap:7px;align-items:center;margin:14px 0 10px}.cc-tel-toolbar button{padding:10px 12px;border:1px solid #ffffff14;border-radius:8px;background:#102532;color:#fff;font:inherit;font-size:.58rem;font-weight:950;cursor:pointer}.cc-tel-toolbar .danger{border-color:#ff718735;color:#ffb6c0;background:#2a1119}.cc-tel-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:9px 0 12px}.cc-tel-summary>div{padding:10px;border-radius:9px;background:#0a1824;border:1px solid #ffffff0e}.cc-tel-summary span{display:block;color:#718895;font-size:.50rem;text-transform:uppercase}.cc-tel-summary b{display:block;margin-top:3px;font-size:.86rem;color:#e7f7fb}.cc-tel-content{overflow:auto;max-height:min(58vh,610px)}.cc-tel-table{font-size:.58rem;white-space:nowrap}.cc-tel-table th,.cc-tel-table td{padding:8px}.cc-tel-table th{position:sticky;top:0;background:#091722;z-index:1}

      .cc.cc-compact .cc-main-menu{width:min(1180px,100%)}.cc.cc-compact .cc-hero{grid-template-columns:1fr 210px;padding:20px 24px 18px;gap:16px}.cc.cc-compact .cc-hero-visual{height:145px}.cc.cc-compact .cc-radar{width:132px;height:132px}.cc.cc-compact .cc-hero .cc-title{font-size:3.7rem}.cc.cc-compact .cc-hero .cc-desc{font-size:.72rem}.cc.cc-compact .cc-main-content{padding:0 20px 20px}.cc.cc-compact .cc-main-menu .cc-tabs{margin:0 -20px 14px;padding:0 20px}.cc.cc-compact .cc-mode-grid{grid-template-columns:repeat(3,1fr)}.cc.cc-compact .cc-mode-grid .cc-opt{min-height:118px;padding:10px}.cc.cc-compact .cc-mode-grid .cc-opt b{font-size:.67rem}.cc.cc-compact .cc-mode-grid .cc-opt span{font-size:.50rem}.cc.cc-compact .cc-arena-grid{grid-template-columns:repeat(3,1fr)!important}.cc.cc-compact .cc-arena-grid .cc-opt{min-height:68px}.cc.cc-compact .cc-sec{margin:11px 0 5px}.cc.cc-compact .cc-advanced{margin-top:11px}.cc.cc-compact .cc-advanced summary{padding:9px 12px}.cc.cc-compact canvas.cc-ency-preview{min-height:300px;height:min(42vh,350px)}.cc.cc-compact .cc-ency-layout{min-height:500px;grid-template-columns:235px minmax(0,1fr)}.cc.cc-compact .cc-arsenal-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.cc.cc-compact .cc-tel-summary{grid-template-columns:repeat(4,1fr)}
      .cc.cc-short .cc-hero{padding:13px 18px 10px}.cc.cc-short .cc-hero-visual{display:none}.cc.cc-short .cc-hero{grid-template-columns:1fr}.cc.cc-short .cc-hero .cc-title{font-size:2.8rem;margin:3px 0}.cc.cc-short .cc-hero .cc-desc{display:none}.cc.cc-short .cc-hero-stats{margin-top:7px}.cc.cc-short .cc-hero-stat{padding:4px 8px}.cc.cc-short .cc-hero-actions{margin-top:7px}.cc.cc-short .cc-main-menu .cc-tabs{margin-bottom:8px}.cc.cc-short .cc-mode-grid .cc-opt{min-height:86px}.cc.cc-short .cc-mode-icon{width:27px;height:27px;margin-bottom:4px}.cc.cc-short .cc-mode-grid .cc-opt span:not(.cc-mode-tag){display:none}.cc.cc-short .cc-mode-rulebox{padding:7px 10px}.cc.cc-short .cc-arena-grid .cc-opt{min-height:55px}.cc.cc-short canvas.cc-ency-preview{min-height:260px;height:280px}.cc.cc-short .cc-arsenal-card{min-height:86px}.cc.cc-short .cc-tel-summary{display:none}
      @media(max-width:1180px){.cc-arsenal-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.cc-tel-toolbar{grid-template-columns:1fr 180px auto auto}.cc-tel-toolbar .danger{grid-column:auto}.cc-ency-layout{grid-template-columns:240px minmax(0,1fr)}}

      /* V14 Clarity Pass: desktop-first typography, readable laptop fallback and planning-friendly arsenal */
      .cc{font-size:16px}.cc-overlay{padding:18px}.cc-menu{padding:28px}
      .cc-k{font-size:.80rem}.cc-desc{font-size:.96rem;line-height:1.62;color:#a8bac4}.cc-tab{font-size:.84rem}
      .cc-sec{font-size:.84rem;letter-spacing:.07em}.cc-opt b{font-size:.94rem}.cc-opt span{font-size:.78rem;line-height:1.45}
      .cc-mode-grid .cc-opt b{font-size:1rem}.cc-mode-grid .cc-opt span{font-size:.80rem;line-height:1.48}.cc-mode-tag{font-size:.62rem!important}
      .cc-mode-rulebox small{font-size:.68rem}.cc-mode-rulebox b{font-size:.92rem}.cc-mode-rulebox p{font-size:.80rem;line-height:1.48}
      .cc-arena-grid .cc-opt b{font-size:.94rem}.cc-arena-grid .cc-opt span{font-size:.76rem}.cc-arena-grid .cc-opt{min-height:92px}
      .cc-setting label{font-size:.72rem}.cc-setting select{font-size:.84rem;padding:9px}.cc-side-card b{font-size:.84rem}.cc-side-card p{font-size:.74rem;line-height:1.45}
      .cc-note{font-size:.78rem;line-height:1.52}.cc-quick-config>b,.cc-quick-config div>b{font-size:.88rem}.cc-quick-config div>span{font-size:.74rem}
      .cc-advanced summary b{font-size:.86rem}.cc-advanced summary span:not(.cc-chevron){font-size:.73rem}.cc-rogue-loop div{font-size:.76rem}.cc-rogue-loop b{font-size:.84rem}
      .cc-hero .cc-desc{font-size:1rem}.cc-live{font-size:.70rem}.cc-hero-stat b{font-size:1rem}.cc-hero-stat span{font-size:.64rem}.cc-hero-actions button{font-size:.76rem}
      .cc-main-menu .cc-tab{font-size:.90rem}.cc-main-menu .cc-start{font-size:.95rem}.cc-main-content{padding-bottom:34px}
      .cc-controls{font-size:.72rem}.cc-controls b{font-size:.70rem}.cc-util{font-size:.72rem;padding:9px 11px}.cc-util.training-reset{display:none;border-color:#69e8bd33;color:#a6f5d6}.cc.training-live .cc-util.training-reset{display:block}
      .cc-aim label{font-size:.72rem}.cc-aim b{font-size:.82rem}.cc-fueltext{font-size:.70rem}.cc-fire{font-size:.88rem}
      .cc-info h3{font-size:.94rem}.cc-info p{font-size:.72rem}.cc-open-arsenal b{font-size:.74rem}.cc-open-arsenal small{font-size:.60rem}
      .cc-quickbar{grid-template-columns:minmax(0,1fr) 132px}.cc-weapons{display:flex!important;overflow-x:auto!important;overflow-y:hidden!important;min-height:70px;gap:6px;padding:2px 1px 5px;scroll-behavior:smooth;scrollbar-width:thin}.cc-weapon{flex:0 0 114px!important;min-width:114px!important;min-height:66px}.cc-wname{font-size:.72rem}.cc-wcat{font-size:.61rem}.cc-ammo{font-size:.68rem}.cc-tier{font-size:.64rem}
      .cc-weapon.t1{border-color:#76dfff33}.cc-weapon.t2{border-color:#63e79b55;box-shadow:inset 0 0 12px #53dc8610}.cc-weapon.t2 .cc-tier{color:#7df0a9}.cc-weapon.t3{border-color:#b987ff66}.cc-weapon.t3 .cc-tier{color:#cda4ff}.cc-weapon.t4{border-color:#ffd66f99}.cc-weapon.t4 .cc-tier{color:#ffe18a}
      .cc-arsenal-menu{width:min(1320px,100%)}.cc-arsenal-menu .cc-title{margin-bottom:7px}.cc-arsenal-head{grid-template-columns:minmax(300px,1fr) 230px auto}.cc-arsenal-head input,.cc-arsenal-head select,.cc-tel-toolbar input,.cc-tel-toolbar select{font-size:.78rem;padding:11px 12px}.arsenal-summary{font-size:.74rem}.arsenal-turn-note{margin:-2px 0 12px;padding:10px 13px;border-radius:9px;border:1px solid #ffffff12;background:#091b27;color:#91a8b4;font-size:.78rem;font-weight:850}.arsenal-turn-note.ready{border-color:#5ce5b555;color:#a8f5da;background:#0a211c}.arsenal-turn-note.planning{border-color:#79c8ff32;color:#a7d9f4;background:#0a1927}
      .cc-arsenal-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;max-height:min(64vh,660px)}.cc-arsenal-card{min-height:148px;padding:15px;border-radius:12px}.cc-arsenal-card .ico{font-size:1.45rem}.cc-arsenal-card b{font-size:.96rem;margin-top:10px;padding-right:64px}.cc-arsenal-card p{font-size:.80rem;line-height:1.48;color:#93a8b2}.cc-arsenal-card .meta{font-size:.74rem}.cc-tier-badge{display:inline-flex;align-items:center;justify-content:center;margin-top:5px;min-width:34px;padding:3px 7px;border-radius:999px;border:1px solid #ffffff1a;font-size:.69rem;font-weight:1000;letter-spacing:.03em}.cc-tier-badge.t1{color:#9deaff;background:#123143;border-color:#69dfff44}.cc-tier-badge.t2{color:#8bf0ae;background:#123223;border-color:#61e99a55}.cc-tier-badge.t3{color:#d4b5ff;background:#281943;border-color:#b886ff66}.cc-tier-badge.t4{color:#ffe392;background:#422b10;border-color:#ffd66f88;box-shadow:0 0 12px #ffcb4f16}.cc-arsenal-card.tier-2{border-color:#62e4982f}.cc-arsenal-card.tier-3{border-color:#bd86ff3f;background:linear-gradient(145deg,#1c1b35,#0a1723)}.cc-arsenal-card.tier-4{border-color:#ffd66f55;background:linear-gradient(145deg,#302318,#20172d 58%,#0b2028)}
      .cc-tel-toolbar{grid-template-columns:minmax(240px,1fr) 210px auto auto auto}.cc-tel-toolbar button{font-size:.75rem}.cc-tel-toolbar .tel-export{border-color:#63e7b340;color:#b4f5dd;background:#0e2a24}.cc-tel-summary span{font-size:.68rem}.cc-tel-summary b{font-size:1rem}.cc-tel-table{font-size:.76rem}.cc-tel-table th,.cc-tel-table td{padding:9px 10px}.cc-tel-empty{font-size:.82rem}
      .cc-ency-entry b{font-size:.84rem}.cc-ency-entry span{font-size:.72rem}.cc-ency-head input,.cc-ency-head select{font-size:.82rem}.cc-tierpick button{font-size:.76rem}.cc-spec span{font-size:.68rem}.cc-spec b{font-size:.84rem}.cc-tiercard{font-size:.72rem}.cc-tiercard b{font-size:.80rem}
      .cc-result-grid span{font-size:.62rem}.cc-run-stats span{font-size:.64rem}.cc-tree-title b{font-size:.86rem}.cc-tree-title span{font-size:.63rem}.cc-shop-item b{font-size:.76rem}.cc-shop-item p{font-size:.64rem}.cc-shop-item .cost{font-size:.68rem}.cc-shop-item .rank{font-size:.60rem}.cc-unique-shop h3{font-size:.86rem}
      .cc.cc-compact .cc-hero .cc-desc{font-size:.86rem}.cc.cc-compact .cc-mode-grid .cc-opt{min-height:128px;padding:12px}.cc.cc-compact .cc-mode-grid .cc-opt b{font-size:.86rem}.cc.cc-compact .cc-mode-grid .cc-opt span{font-size:.72rem}.cc.cc-compact .cc-arena-grid .cc-opt{min-height:78px}.cc.cc-compact .cc-sec{font-size:.76rem}.cc.cc-compact .cc-quickbar{grid-template-columns:minmax(0,1fr) 112px}.cc.cc-compact .cc-weapons{display:flex!important;min-height:60px}.cc.cc-compact .cc-weapon{flex:0 0 102px!important;min-width:102px!important;min-height:58px}.cc.cc-compact .cc-wname{font-size:.66rem}.cc.cc-compact .cc-wcat{display:block;font-size:.57rem}.cc.cc-compact .cc-arsenal-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.cc.cc-compact .cc-arsenal-card{min-height:136px}.cc.cc-compact .cc-tel-toolbar{grid-template-columns:minmax(220px,1fr) 180px auto auto}.cc.cc-compact .cc-tel-toolbar .danger{grid-column:1/-1}
      .cc.cc-short .cc-hero .cc-desc{display:none}.cc.cc-short .cc-mode-grid .cc-opt span:not(.cc-mode-tag){display:block;font-size:.68rem}.cc.cc-short .cc-mode-grid .cc-opt{min-height:108px}.cc.cc-short .cc-weapons{display:flex!important;min-height:54px}.cc.cc-short .cc-weapon{flex:0 0 94px!important;min-width:94px!important;min-height:52px}.cc.cc-short .cc-wname{font-size:.63rem}.cc.cc-short .cc-ammo,.cc.cc-short .cc-tier{font-size:.58rem}.cc.cc-short .cc-arsenal-card{min-height:126px}.cc.cc-short .cc-tel-summary{display:grid}
    `;

    const root=document.createElement("div");root.className="cc";
    root.innerHTML=`
      <canvas></canvas>
      <div class="cc-controls hide"><b>CONTROLS</b><br>A / D · drive &nbsp; ← / → · angle &nbsp; ↑ / ↓ · power<br>Q / E · cycle weapon &nbsp; TAB · arsenal &nbsp; SPACE · fire &nbsp; Mouse · aim + fire<span class="training-help"><br>Training: R · rebuild range</span></div>
      <div class="cc-utility"><button class="cc-util leave-match">MENU</button><button class="cc-util training-reset">RESET TERRAIN</button><button class="cc-util help-toggle">CONTROLS</button><button class="cc-util codex">CODEX</button><button class="cc-util telemetry">BALANCE LAB</button></div>
      <div class="cc-bottom">
        <div class="cc-panel cc-aim">
          <div class="cc-aim-row"><label>Angle</label><input class="angle" type="range" min="5" max="175" step="1"><b class="angle-v">45°</b></div>
          <div class="cc-aim-row"><label>Power</label><input class="power" type="range" min="10" max="100" step="1"><b class="power-v">60</b></div>
          <div class="cc-fuel"><div></div></div><div class="cc-fueltext">FUEL 100 / 100</div>
          <button class="cc-fire">FIRE</button>
        </div>
        <div class="cc-panel cc-armament">
          <div class="cc-info"></div>
          <div class="cc-quickbar"><div class="cc-weapons"></div><button class="cc-open-arsenal"><b>ALL WEAPONS</b><span class="weapon-count">0</span><small>TAB</small></button></div>
        </div>
      </div>
      <div class="cc-overlay menu"><div class="cc-menu cc-main-menu">
        <section class="cc-hero">
          <div class="cc-hero-copy">
            <div class="cc-live">Ballistics command deck online</div>
            <div class="cc-title">CRATER<br>CLASH</div>
            <div class="cc-desc">A neon artillery sandbox built around destructive terrain, readable trajectories and a giant evolving arsenal. Pick a ruleset, tune the battlefield, then turn geometry into damage.</div>
            <div class="cc-hero-stats">
              <div class="cc-hero-stat"><b>${WEAPON_IDS.length}</b><span>Weapon families</span></div>
              <div class="cc-hero-stat"><b>${TOTAL_VARIANTS}</b><span>Tier variants</span></div>
              <div class="cc-hero-stat"><b>${ARENAS.length}</b><span>Procedural arenas</span></div>
              <div class="cc-hero-stat"><b>5</b><span>Standard modes</span></div>
            </div>
            <div class="cc-hero-actions"><button class="menu-codex">ARSENAL CODEX</button><button class="menu-balance">BALANCE LAB</button></div>
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
            <div class="cc-quick-config"><div><b>Match Size</b><span>Duel is always 2 tanks; Teams automatically uses even team sizes.</span></div><div class="cc-setting"><label>Tanks</label><select data-set="playerCount"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></div></div>

            <details class="cc-advanced">
              <summary><div><b>ADVANCED MATCH SETTINGS</b><span>HP, turn time, fuel, loot, wind and traversal</span></div><span class="cc-chevron">⌄</span></summary>
              <div class="cc-advanced-body">
            <div class="cc-settings-wrap">
              <div class="cc-setting-grid">
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
              </div>
            </details>
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
      <div class="cc-overlay arsenal-picker hide"><div class="cc-menu cc-arsenal-menu"><button class="cc-close arsenal-close">✕</button><div class="cc-k">Current Loadout</div><div class="cc-title" style="font-size:2.7rem">WEAPON ARSENAL</div><div class="cc-desc">Browse your full loadout at any time — even while opponents are firing. Search or filter now, then equip instantly when your turn begins.</div><div class="arsenal-turn-note planning"></div><div class="cc-arsenal-head"><input class="arsenal-search" placeholder="Search your loadout…"><select class="arsenal-category"><option value="">All categories</option></select><span class="arsenal-summary"></span></div><div class="cc-arsenal-grid"></div></div></div>
      <div class="cc-overlay telemetry-overlay hide"><div class="cc-menu cc-tel-menu"><button class="cc-close tel-close">✕</button><div class="cc-k">Persistent Weapon Analytics</div><div class="cc-title" style="font-size:2.8rem">BALANCE LAB</div><div class="cc-desc">Aggregated telemetry is collected from player and bot shots in every mode and stored locally in this browser. Intent-adjusted hit rate excludes wild shots that never meaningfully approached an enemy; Clean Avg uses only unmodified shots without Critical, ×2, Overcharge or Rogue damage bonuses.</div><div class="cc-tel-toolbar"><input class="tel-search" placeholder="Search weapon…"><select class="tel-sort"><option value="samples">Sort: Samples</option><option value="engaged">Sort: Intent Hit Rate</option><option value="damage">Sort: Avg Damage</option><option value="clean">Sort: Clean Avg</option></select><button class="tel-refresh">REFRESH</button><button class="tel-export">EXPORT JSON</button><button class="tel-reset danger">CLEAR ALL DATA</button></div><div class="cc-tel-summary"></div><div class="cc-tel-content"></div></div></div>
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
    const angleInput=root.querySelector(".angle"),powerInput=root.querySelector(".power"),fireBtn=root.querySelector(".cc-fire"),menu=root.querySelector(".menu"),end=root.querySelector(".end"),upgrade=root.querySelector(".upgrade"),ency=root.querySelector(".encyclopedia"),arsenalPicker=root.querySelector(".arsenal-picker"),telemetryOverlay=root.querySelector(".telemetry-overlay");
    const angleV=root.querySelector(".angle-v"),powerV=root.querySelector(".power-v"),fuelBar=root.querySelector(".cc-fuel>div"),fuelText=root.querySelector(".cc-fueltext"),controlsEl=root.querySelector(".cc-controls"),weaponCountEl=root.querySelector(".weapon-count");

    function resize(){
      const r=root.getBoundingClientRect();
      root.classList.toggle("cc-compact",r.width<1180||r.height<760);
      root.classList.toggle("cc-short",r.height<640);
      W=Math.max(560,r.width);H=Math.max(420,r.height);dpr=Math.min(2,devicePixelRatio||1);
      // Keep a running match in its original logical coordinate system. The canvas can then
      // resize responsively without desynchronizing terrain, mouse aiming and projectile physics.
      const logicalW=running&&state?state.width:W,logicalH=running&&state?state.height:H;
      canvas.width=Math.round(logicalW*dpr);canvas.height=Math.round(logicalH*dpr);canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();const ro=new ResizeObserver(resize);ro.observe(root);
    const playerTank=()=>state?.tanks?.[0]||null;
    const playerTurn=()=>running&&state&&!state.gameOver&&currentTank(state)?.isPlayer&&state.phase==="aim";
    const modalPaused=()=>!ency.classList.contains("hide")||!telemetryOverlay.classList.contains("hide")||(!arsenalPicker.classList.contains("hide")&&playerTurn());

    function emptyBalanceStore(){return {version:2,updatedAt:0,entries:{}};}
    function loadBalanceStore(){
      try{const raw=localStorage.getItem(TELEMETRY_KEY);if(!raw)return emptyBalanceStore();const parsed=JSON.parse(raw);return parsed?.version===2&&parsed.entries?parsed:emptyBalanceStore();}catch{return emptyBalanceStore();}
    }
    function flushBalanceStore(){
      if(balanceSaveTimer){clearTimeout(balanceSaveTimer);balanceSaveTimer=0;}
      balanceStore.updatedAt=Date.now();
      try{localStorage.setItem(TELEMETRY_KEY,JSON.stringify(balanceStore));}catch{}
    }
    function queueBalanceSave(){if(balanceSaveTimer)return;balanceSaveTimer=setTimeout(()=>{balanceSaveTimer=0;flushBalanceStore();},1200);}
    function mergeBalanceEvent(q){
      const key=`${q.weaponId}:${q.tier}`,e=balanceStore.entries[key]||(balanceStore.entries[key]={weaponId:q.weaponId,tier:q.tier,shots:0,playerShots:0,botShots:0,hitShots:0,engagedShots:0,nearMisses:0,farMisses:0,wildMisses:0,totalDamage:0,maxDamage:0,totalHitEvents:0,cleanShots:0,cleanDamage:0,critShots:0,x2Shots:0,utilityShots:0,distanceSamples:0,totalBestDistance:0,lastDamage:0});
      e.shots++;q.ownerIsPlayer?e.playerShots++:e.botShots++;if(q.hit)e.hitShots++;if(q.engaged)e.engagedShots++;if(q.near)e.nearMisses++;if(q.far)e.farMisses++;if(q.wild)e.wildMisses++;
      e.totalDamage+=q.totalDamage||0;e.maxDamage=Math.max(e.maxDamage||0,q.totalDamage||0);e.totalHitEvents+=q.hitCount||0;e.lastDamage=q.totalDamage||0;
      if(q.clean){e.cleanShots++;e.cleanDamage+=q.totalDamage||0;}if(q.crit)e.critShots++;if(q.hadX2)e.x2Shots++;if(q.utility)e.utilityShots++;
      if(Number.isFinite(q.bestDistance)){e.distanceSamples++;e.totalBestDistance+=q.bestDistance;}e.lastMode=q.mode;e.updatedAt=Date.now();queueBalanceSave();
    }
    function collectBalanceEvents(){if(!state)return;for(const q of drainTelemetryEvents(state))mergeBalanceEvent(q);}
    function clearBalanceStore(){balanceStore=emptyBalanceStore();flushBalanceStore();}
    function exportBalanceData(){
      collectBalanceEvents();flushBalanceStore();
      const entries=Object.values(balanceStore.entries||{}).sort((a,b)=>String(a.weaponId).localeCompare(String(b.weaponId))||Number(a.tier)-Number(b.tier));
      const payload={schema:"crater-clash-balance",schemaVersion:1,gameVersion:"V15",exportedAt:new Date().toISOString(),storageKey:TELEMETRY_KEY,weaponFamilies:WEAPON_IDS.length,tierVariants:TOTAL_VARIANTS,storeUpdatedAt:balanceStore.updatedAt?new Date(balanceStore.updatedAt).toISOString():null,notes:{intentHitRate:"hitShots / engagedShots; wild trajectories are excluded from engagedShots",cleanDamage:"shots without Critical, x2, Overcharge or Rogue damage modifiers",distance:"best enemy proximity observed across the complete weapon sequence"},entries};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download=`CraterClash_Balance_${new Date().toISOString().slice(0,10)}.json`;a.style.display="none";root.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),750);
    }

    function syncAimUI(){
      if(!state)return;const p=playerTank(),deg=state.playerAngle*180/Math.PI;
      angleInput.value=deg.toFixed(0);powerInput.value=state.playerPower;angleV.textContent=Math.round(deg)+"°";powerV.textContent=Math.round(state.playerPower);fireBtn.disabled=!playerTurn();
      if(p){const pct=p.maxFuel>9000?100:clamp(p.fuel/p.maxFuel*100,0,100);fuelBar.style.width=pct+"%";fuelText.textContent=`FUEL ${p.maxFuel>9000?"∞":Math.ceil(p.fuel)} / ${p.maxFuel>9000?"∞":Math.round(p.maxFuel)} · GRIP ${Math.round((p.grip||.8)*180/Math.PI)}°`;}
    }
    function setAngleFromDegrees(deg){if(!state)return;state.playerAngle=deg*Math.PI/180;const t=playerTank();if(t)t.angle=state.playerAngle;syncAimUI();}

    function renderWeapons(){
      if(!state)return;const p=playerTank();
      lastInventorySig=p.inventory.map(x=>`${x.id}:${x.tier}:${x.ammo}`).join("|");
      const usable=p.inventory.filter(x=>x.ammo>0);
      if(weaponCountEl)weaponCountEl.textContent=usable.length;
      const oldScroll=weaponsEl.scrollLeft;
      weaponsEl.innerHTML=usable.map(slot=>{const d=getWeaponTierStats(slot.id,slot.tier);return `<button class="cc-weapon t${slot.tier} ${p.selected===slot.id&&p.selectedTier===slot.tier?"on":""}" data-id="${slot.id}" data-tier="${slot.tier}" title="${d.name} · T${slot.tier}"><span class="cc-ammo">${slot.ammo>=99?"∞":"×"+slot.ammo}</span><div class="cc-wicon" style="color:${d.color}">${d.icon}</div><div class="cc-wname">${d.name}</div><div class="cc-wcat">${d.category}</div><span class="cc-tier">T${slot.tier}</span></button>`;}).join("");
      weaponsEl.querySelectorAll(".cc-weapon").forEach(btn=>{
        btn.onclick=()=>{if(playerTurn()&&selectWeapon(state,p,btn.dataset.id,Number(btn.dataset.tier))){renderWeapons();renderInfo();}};
        btn.onmouseenter=()=>{const d=getWeaponTierStats(btn.dataset.id,Number(btn.dataset.tier));infoEl.innerHTML=`<h3 style="color:${d.color}">${d.icon} ${d.name} · T${d.tier}</h3><p>${d.description} · ${d.damage!=null?`Damage ${Math.round(d.damage)}`:"Utility"}${d.radius?` · Radius ${Math.round(d.radius)}`:""}${playerTurn()?"":" · Planning view — equip on your turn"}</p>`;};
        btn.onmouseleave=renderInfo;
      });
      const maxScroll=Math.max(0,weaponsEl.scrollWidth-weaponsEl.clientWidth),selectedBtn=weaponsEl.querySelector(".cc-weapon.on");let desired=Math.min(oldScroll,maxScroll);if(playerTurn()&&selectedBtn){const left=selectedBtn.offsetLeft,right=left+selectedBtn.offsetWidth;if(left<desired||right>desired+weaponsEl.clientWidth)desired=clamp(left-weaponsEl.clientWidth*.5+selectedBtn.offsetWidth*.5,0,maxScroll);}weaponsEl.scrollLeft=desired;
      if(!arsenalPicker.classList.contains("hide"))renderArsenalPicker();
    }
    function renderInfo(){
      if(!state)return;const p=playerTank(),d=getWeaponTierStats(p.selected,p.selectedTier||1),mods=p.overchargeReady?"OVERCHARGE READY · +28%":"Overcharge "+Math.round(p.overcharge)+"%";
      infoEl.innerHTML=`<h3 style="color:${d.color}">${d.icon} ${d.name} · T${d.tier}</h3><p><b>${d.tierName}</b> · ${d.tierNote||"Functional upgrade"} · ${d.damage!=null?`Damage ${Math.round(d.damage)}`:"Utility"}${d.fragments?` · ${d.fragments} fragments`:d.bombs?` · ${d.bombs} strikes`:d.bounces?` · ${d.bounces} bounces`:""} · ${mods}</p>`;
    }
    function renderArsenalPicker(){
      if(!state)return;const p=playerTank(),grid=arsenalPicker.querySelector(".cc-arsenal-grid"),search=arsenalPicker.querySelector(".arsenal-search"),category=arsenalPicker.querySelector(".arsenal-category"),turnNote=arsenalPicker.querySelector(".arsenal-turn-note");
      weaponSearch=search.value.trim().toLowerCase();weaponCategory=category.value;
      const rows=p.inventory.filter(slot=>{const d=getWeaponTierStats(slot.id,slot.tier);return (!weaponSearch||d.name.toLowerCase().includes(weaponSearch)||d.category.toLowerCase().includes(weaponSearch)||slot.id.includes(weaponSearch))&&(!weaponCategory||d.category===weaponCategory);});
      arsenalPicker.querySelector(".arsenal-summary").textContent=`${rows.length} shown · ${p.inventory.filter(x=>x.ammo>0).length} usable`;
      if(turnNote){const ready=playerTurn();turnNote.className=`arsenal-turn-note ${ready?"ready":"planning"}`;turnNote.textContent=ready?"YOUR TURN · Click any usable weapon to equip it.":"PLANNING MODE · Browse and scroll freely while the battle continues. Weapon selection unlocks on your turn.";}
      grid.innerHTML=rows.map(slot=>{const d=getWeaponTierStats(slot.id,slot.tier),selected=p.selected===slot.id&&p.selectedTier===slot.tier;return `<button class="cc-arsenal-card tier-${slot.tier} ${selected?"on":""}" data-aw="${slot.id}" data-at="${slot.tier}" ${slot.ammo<=0?"disabled":""}><span class="meta">${slot.ammo>=99?"∞":"×"+slot.ammo}<span class="cc-tier-badge t${slot.tier}">T${slot.tier}</span></span><span class="ico" style="color:${d.color}">${d.icon}</span><b>${d.name}</b><p>${d.category} · ${d.tierName}<br>${d.description}</p></button>`;}).join("")||`<div class="cc-tel-empty">No weapons match this filter.</div>`;
      grid.querySelectorAll("[data-aw]").forEach(btn=>btn.onclick=()=>{if(!playerTurn()){if(turnNote){turnNote.className="arsenal-turn-note planning";turnNote.textContent="PLANNING MODE · Keep browsing — selection becomes available when your turn begins.";}return;}if(selectWeapon(state,p,btn.dataset.aw,Number(btn.dataset.at))){renderWeapons();renderInfo();closeWeaponPicker();}});
    }
    function openWeaponPicker(){
      if(!state||!running)return;const p=playerTank(),cats=[...new Set(p.inventory.map(x=>getWeaponTierStats(x.id,x.tier).category))].sort(),sel=arsenalPicker.querySelector(".arsenal-category");
      sel.innerHTML=`<option value="">All categories</option>${cats.map(c=>`<option ${c===weaponCategory?"selected":""}>${c}</option>`).join("")}`;arsenalPicker.querySelector(".arsenal-search").value=weaponSearch;arsenalPicker.classList.remove("hide");renderArsenalPicker();
    }
    function closeWeaponPicker(){arsenalPicker.classList.add("hide");}
    function firePlayer(){if(!playerTurn())return;const p=playerTank();if(fire(state,p,state.playerAngle,state.playerPower,p.selected,p.selectedTier)){renderWeapons();syncAimUI();renderInfo();}}
    angleInput.oninput=()=>setAngleFromDegrees(Number(angleInput.value));
    powerInput.oninput=()=>{if(!state)return;state.playerPower=Number(powerInput.value);const p=playerTank();if(p)p.power=state.playerPower;syncAimUI();};
    fireBtn.onclick=firePlayer;

    function cycleWeapon(dir){if(!playerTurn())return;const p=playerTank(),usable=p.inventory.filter(s=>s.ammo>0);if(!usable.length)return;let i=usable.findIndex(s=>s.id===p.selected&&s.tier===p.selectedTier);i=(i+dir+usable.length)%usable.length;selectWeapon(state,p,usable[i].id,usable[i].tier);renderWeapons();renderInfo();}
    function keyDown(e){
      if(!state||!running)return;
      if(e.key==="Escape"){if(!arsenalPicker.classList.contains("hide")){closeWeaponPicker();return;}if(!ency.classList.contains("hide")){closeEncyclopedia();return;}if(!telemetryOverlay.classList.contains("hide")){telemetryOverlay.classList.add("hide");return;}}
      if(e.code==="Tab"){e.preventDefault();if(!arsenalPicker.classList.contains("hide"))closeWeaponPicker();else openWeaponPicker();return;}
      if(modalPaused())return;
      if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code))e.preventDefault();
      if(e.code==="Space"){firePlayer();return;}if((e.key==="r"||e.key==="R")&&state.training){resetTrainingRange(state);renderWeapons();renderInfo();syncAimUI();return;}if(!playerTurn())return;
      if(e.key==="a"||e.key==="A")moveKeys.left=true;if(e.key==="d"||e.key==="D")moveKeys.right=true;
      if(e.key==="ArrowLeft")state.playerAngle=clamp(state.playerAngle+.025,.08,Math.PI-.08);if(e.key==="ArrowRight")state.playerAngle=clamp(state.playerAngle-.025,.08,Math.PI-.08);
      if(e.key==="ArrowUp")state.playerPower=clamp(state.playerPower+2,10,100);if(e.key==="ArrowDown")state.playerPower=clamp(state.playerPower-2,10,100);
      if(e.key==="q"||e.key==="Q")cycleWeapon(-1);if(e.key==="e"||e.key==="E")cycleWeapon(1);
      const p=playerTank();p.angle=state.playerAngle;p.power=state.playerPower;syncAimUI();
    }
    function keyUp(e){if(e.key==="a"||e.key==="A")moveKeys.left=false;if(e.key==="d"||e.key==="D")moveKeys.right=false;}
    window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);

    canvas.addEventListener("mousemove",e=>{if(!playerTurn()||modalPaused())return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*state.width/r.width,my=(e.clientY-r.top)*state.height/r.height,p=playerTank();const ang=Math.atan2(p.y-my,mx-p.x);if(ang>0&&ang<Math.PI){state.playerAngle=ang;state.playerPower=clamp((Math.hypot(mx-p.x,my-p.y)-35)/3.2,10,100);p.angle=ang;p.power=state.playerPower;syncAimUI();}});
    canvas.addEventListener("click",()=>{if(playerTurn()&&!modalPaused())firePlayer();});

    function payloadEstimate(d){
      const n=Math.max(1,d.count||d.fragments||d.bombs||1);let value=(d.damage||0)*n;
      if(d.echoes)value+=(d.echoDamage||0)*d.echoes;if(d.chain&&d.damage)value+=d.damage*Math.max(0,d.chain-1)*.65;
      return Math.round(value);
    }
    function resetEncyPreview(){
      const c=ency.querySelector(".cc-ency-preview");if(!c)return;
      const r=c.getBoundingClientRect(),pw=Math.max(760,Math.round(r.width||920)),ph=Math.max(430,Math.min(560,Math.round(pw*.52)));
      c.width=pw;c.height=ph;const pc=c.getContext("2d");
      encyPreviewState=createState({width:pw,height:ph,mode:"training",difficulty:"easy",arenaIndex:0,settings:{playerCount:5,hp:600,turnTime:9999,wind:"off",fuel:9999,weaponCount:20,skillObjects:"off",crates:"off",tracer:true,terrainMobility:"allterrain"}});
      const t=encyPreviewState.tanks[0];t.x=pw*.18;t.y=encyPreviewState.terrain[Math.round(t.x)]-11;
      const dummy=encyPreviewState.tanks[2]||encyPreviewState.tanks[1];if(dummy){dummy.x=pw*.70;dummy.y=encyPreviewState.terrain[Math.round(dummy.x)]-11;}
      selectWeapon(encyPreviewState,t,encyWeapon,encyTier);t.selected=encyWeapon;t.selectedTier=encyTier;encyPreviewState.playerAngle=Math.PI*.25;encyPreviewState.playerPower=58;t.angle=encyPreviewState.playerAngle;t.power=58;
      fire(encyPreviewState,t,encyPreviewState.playerAngle,58,encyWeapon,encyTier);encyPreviewTimer=0;
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
      collectBalanceEvents();
      const box=telemetryOverlay.querySelector(".cc-tel-content"),summary=telemetryOverlay.querySelector(".cc-tel-summary"),search=telemetryOverlay.querySelector(".tel-search").value.trim().toLowerCase(),sort=telemetryOverlay.querySelector(".tel-sort").value;
      balanceSearch=search;balanceSort=sort;
      let rows=Object.values(balanceStore.entries||{}).map(e=>{
        const shots=e.shots||0,hits=e.hitShots||0,engaged=e.engagedShots||0;
        return {...e,avgDamage:shots?(e.totalDamage||0)/shots:0,avgHit:hits?(e.totalDamage||0)/hits:0,intentHitRate:engaged?hits/engaged:0,cleanAvg:e.cleanShots?(e.cleanDamage||0)/e.cleanShots:0,avgEvents:shots?(e.totalHitEvents||0)/shots:0,avgDistance:e.distanceSamples?(e.totalBestDistance||0)/e.distanceSamples:null};
      }).filter(e=>{const d=getWeaponTierStats(e.weaponId,e.tier);return !search||d.name.toLowerCase().includes(search)||d.category.toLowerCase().includes(search)||e.weaponId.includes(search);});
      const sorter=sort==="engaged"?(a,b)=>b.intentHitRate-a.intentHitRate||b.shots-a.shots:sort==="damage"?(a,b)=>b.avgDamage-a.avgDamage||b.shots-a.shots:sort==="clean"?(a,b)=>b.cleanAvg-a.cleanAvg||b.cleanShots-a.cleanShots:(a,b)=>b.shots-a.shots||b.avgDamage-a.avgDamage;rows.sort(sorter);
      const all=Object.values(balanceStore.entries||{}),totalShots=all.reduce((n,e)=>n+(e.shots||0),0),playerShots=all.reduce((n,e)=>n+(e.playerShots||0),0),botShots=all.reduce((n,e)=>n+(e.botShots||0),0),engaged=all.reduce((n,e)=>n+(e.engagedShots||0),0),hits=all.reduce((n,e)=>n+(e.hitShots||0),0);
      summary.innerHTML=`<div><span>Recorded shots</span><b>${totalShots}</b></div><div><span>Variants sampled</span><b>${all.length} / ${TOTAL_VARIANTS}</b></div><div><span>Player / Bot</span><b>${playerShots} / ${botShots}</b></div><div><span>Intent hit rate</span><b>${engaged?(hits/engaged*100).toFixed(1):"0.0"}%</b></div>`;
      if(!rows.length){box.innerHTML=`<div class="cc-tel-empty">${totalShots?"No recorded weapons match this search.":"No telemetry yet. Play any standard mode, Rogue Run or Training Range; both player and bot shots are aggregated automatically."}</div>`;return;}
      box.innerHTML=`<table class="cc-tel-table"><thead><tr><th>Weapon</th><th>Samples</th><th>P / B</th><th>Intent Hit</th><th>Avg All</th><th>Avg On Hit</th><th>Clean Avg</th><th>Near / Far / Wild</th><th>Avg Events</th><th>Max</th></tr></thead><tbody>${rows.map(e=>{const d=getWeaponTierStats(e.weaponId,e.tier),hit=e.intentHitRate*100,utility=e.utilityShots===e.shots&&e.shots>0;return `<tr><td style="color:${d.color}">${d.name} · T${e.tier}</td><td>${e.shots}</td><td>${e.playerShots||0} / ${e.botShots||0}</td><td class="${!utility&&hit>=60?"cc-tel-good":!utility&&hit<25?"cc-tel-warn":""}">${utility?"UTILITY":hit.toFixed(0)+"%"}</td><td>${e.avgDamage.toFixed(1)}</td><td>${e.hitShots?e.avgHit.toFixed(1):"—"}</td><td>${e.cleanShots?`${e.cleanAvg.toFixed(1)} (${e.cleanShots})`:"—"}</td><td>${e.nearMisses||0} / ${e.farMisses||0} / ${e.wildMisses||0}</td><td>${e.avgEvents.toFixed(1)}</td><td>${(e.maxDamage||0).toFixed(1)}</td></tr>`;}).join("")}</tbody></table>`;
    }
    function openTelemetry(){telemetryOverlay.querySelector(".tel-search").value=balanceSearch;telemetryOverlay.querySelector(".tel-sort").value=balanceSort;telemetryOverlay.classList.remove("hide");renderTelemetry();}

    function startMatch(opts){
      state=createState({width:W,height:H,...opts});running=true;root.classList.toggle("training-live",!!state.training);lastTurnId=null;lastInventorySig="";menu.classList.add("hide");end.classList.add("hide");upgrade.classList.add("hide");arsenalPicker.classList.add("hide");telemetryOverlay.classList.add("hide");controlsEl.classList.add("hide");resize();syncAimUI();renderWeapons();renderInfo();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
    }
    function startStandard(){
      rogueRun=null;
      const cfg={...settings};
      if(mode==="juggernaut")cfg.playerCount=Math.max(3,Number(cfg.playerCount)||4);
      if(mode==="teams"&&cfg.playerCount%2)cfg.playerCount=Math.min(8,cfg.playerCount+1);
      startMatch({mode,difficulty,arenaIndex,settings:cfg});
    }
    function startTraining(){
      rogueRun=null;startMatch({mode:"training",difficulty:"easy",arenaIndex:trainingArena,settings:{playerCount:5,hp:500,turnTime:9999,wind:"off",fuel:9999,weaponCount:20,skillObjects:"off",crates:"off",tracer:true}});
    }
    function startNewRogue(){rogueRun=createRogueRun();startRogueBattle();}
    function startRogueBattle(){
      const stage=rogueRun.stage;let arena=Math.floor(Math.random()*ARENAS.length);
      if(ARENAS.length>1&&arena===rogueRun.lastArenaIndex)arena=(arena+1+Math.floor(Math.random()*(ARENAS.length-1)))%ARENAS.length;rogueRun.lastArenaIndex=arena;
      startMatch({mode:"duel",difficulty:"normal",arenaIndex:arena,rogueRun,settings:{playerCount:2,hp:100,turnTime:30,wind:stage>=7?"extreme":"normal",fuel:rogueRun.stats.maxFuel,weaponCount:rogueRun.stats.weaponCount,skillObjects:stage>=4?"high":"normal",crates:"high",tracer:true}});
    }

    function loop(now){
      if(destroyed||!state)return;const dt=Math.min(.033,(now-last)/1000);last=now;
      if(!modalPaused()){
        const t=currentTank(state);
        if(playerTurn()){const p=playerTank(),dir=(moveKeys.right?1:0)-(moveKeys.left?1:0);if(dir)moveTank(state,p,dir,dt*70);}
        if(t&&!t.isPlayer&&state.phase==="aim"){botThinkDelay-=dt;if(botThinkDelay<=0){botThinkDelay=.65+Math.random()*.55;performBotShot(state,t);}}else botThinkDelay=.7;
        updateState(state,dt);collectBalanceEvents();
        const nowTurn=currentTank(state)?.id;if(nowTurn!==lastTurnId){lastTurnId=nowTurn;renderWeapons();renderInfo();}
        if(playerTurn())syncAimUI();
        const pp=playerTank();if(pp){const sig=pp.inventory.map(x=>`${x.id}:${x.tier}:${x.ammo}`).join("|");if(sig!==lastInventorySig)renderWeapons();}
        if(state.gameOver&&running){render(ctx,state,state.width,state.height);finish();return;}
      }
      render(ctx,state,state.width,state.height);raf=requestAnimationFrame(loop);
    }
    function leaveToMenu(){
      if(!running||!state)return;const label=state.training?"Exit Training Range and return to the menu?":"Forfeit this match and return to the menu?";if(!window.confirm(label))return;
      collectBalanceEvents();flushBalanceStore();running=false;moveKeys.left=moveKeys.right=false;cancelAnimationFrame(raf);closeWeaponPicker();closeEncyclopedia();telemetryOverlay.classList.add("hide");controlsEl.classList.add("hide");end.classList.add("hide");upgrade.classList.add("hide");menu.classList.remove("hide");root.classList.remove("training-live");rogueRun=null;state=null;resize();
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
      if(tanks){for(const o of tanks.options)o.disabled=mode==="teams"&&Number(o.value)%2===1;
        if(mode==="teams"&&Number(tanks.value)%2){const next=Math.min(8,Number(tanks.value)+1);tanks.value=String(next);settings.playerCount=next;}
        if(mode==="juggernaut"&&Number(tanks.value)<3){tanks.value="3";settings.playerCount=3;}
      }
    }
    root.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");mode=btn.dataset.mode;refreshModeConfig();});
    root.querySelectorAll("[data-arena]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-arena]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");arenaIndex=Number(btn.dataset.arena);});
    root.querySelectorAll("[data-d]").forEach(btn=>btn.onclick=()=>{root.querySelectorAll("[data-d]").forEach(x=>x.classList.remove("sel"));btn.classList.add("sel");difficulty=btn.dataset.d;});
    root.querySelectorAll("[data-set]").forEach(sel=>sel.onchange=()=>{const k=sel.dataset.set,v=sel.value;settings[k]=["playerCount","hp","turnTime","fuel","weaponCount","weaponQuality"].includes(k)?Number(v):k==="tracer"?v==="true":v;refreshModeConfig();});
    root.querySelector(".codex").onclick=openEncyclopedia;root.querySelector(".menu-codex").onclick=openEncyclopedia;root.querySelector(".menu-balance").onclick=openTelemetry;ency.querySelector(".ency-close").onclick=closeEncyclopedia;ency.querySelector(".ency-search").oninput=renderEncyList;ency.querySelector(".ency-category").onchange=renderEncyList;
    root.querySelector(".cc-open-arsenal").onclick=openWeaponPicker;arsenalPicker.querySelector(".arsenal-close").onclick=closeWeaponPicker;arsenalPicker.querySelector(".arsenal-search").oninput=renderArsenalPicker;arsenalPicker.querySelector(".arsenal-category").onchange=renderArsenalPicker;
    root.querySelector(".leave-match").onclick=leaveToMenu;root.querySelector(".training-reset").onclick=()=>{if(state?.training){resetTrainingRange(state);renderWeapons();renderInfo();syncAimUI();}};root.querySelector(".help-toggle").onclick=()=>controlsEl.classList.toggle("hide");
    root.querySelector(".telemetry").onclick=openTelemetry;telemetryOverlay.querySelector(".tel-close").onclick=()=>telemetryOverlay.classList.add("hide");telemetryOverlay.querySelector(".tel-refresh").onclick=renderTelemetry;telemetryOverlay.querySelector(".tel-export").onclick=exportBalanceData;telemetryOverlay.querySelector(".tel-search").oninput=renderTelemetry;telemetryOverlay.querySelector(".tel-sort").onchange=renderTelemetry;telemetryOverlay.querySelector(".tel-reset").onclick=()=>{if(window.confirm("Clear all locally stored Crater Clash balance telemetry?")){clearBalanceStore();renderTelemetry();}};
    upgrade.querySelector(".cc-next").onclick=()=>{if(!rogueRun)return;rogueRun.stage++;upgrade.classList.add("hide");startRogueBattle();};
    root.querySelector(".training-arena").onchange=e=>trainingArena=Number(e.target.value)||0;
    root.querySelector(".start-standard").onclick=startStandard;root.querySelector(".start-rogue").onclick=startNewRogue;root.querySelector(".start-training").onclick=startTraining;root.querySelector(".restart").onclick=()=>{end.classList.add("hide");menu.classList.remove("hide");root.classList.remove("training-live");rogueRun=null;state=null;resize();};
    refreshModeConfig();

    return {destroy:()=>{destroyed=true;collectBalanceEvents();flushBalanceStore();cancelAnimationFrame(raf);if(encyRaf)cancelAnimationFrame(encyRaf);if(balanceSaveTimer)clearTimeout(balanceSaveTimer);ro.disconnect();window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);style.remove();}};
  }
};
