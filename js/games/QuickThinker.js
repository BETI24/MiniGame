import {
    EMPTY,
    CIRCLE,
    SQUARE,
    createEmptyBoard,
    boardFromGivens,
    isBoardFull,
    isBoardSolvedLegal,
    findRuleViolations,
    findPartialRuleViolations,
    cloneBoard,
    cellKey
} from './QuickThinkerRules.js';

import {
    generatePuzzle,
    DIFFICULTIES,
    SUPPORTED_SIZES
} from './QuickThinkerGenerator.js';

import {
    getNextLogicalStep,
    explainLogicalStep,
    getRecoveryHint,
    countSolutionsFromBoard
} from './QuickThinkerSolver.js';

const GAME_ID='quick-thinker';

export default {
    manifest:{
        id:GAME_ID,
        name:'QuickThinker',
        description:'Logic puzzles with circles, squares, relation clues and guaranteed no-guess solutions.',
        icon:'🧠',
        tags:['Puzzle','Logic','Singleplayer']
    },

    init:(container,services)=>{
        let destroyed=false;
        let puzzle=null;
        let board=[];
        let given=[];
        let relationElements=[];
        let checkpointBoard=null;
        let won=false;
        let generating=false;
        let startedAt=0;
        let timerId=0;

        let selectedSize=6;
        let selectedDifficulty='normal';

        const style=document.createElement('style');
        style.textContent=`
            .qt-game{
                --board-size:6;
                width:100%;
                height:100%;
                min-height:650px;
                overflow:auto;
                background:#151c23;
                color:#eef3f6;
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
            }

            .qt-game *{box-sizing:border-box}

            .qt-shell{
                width:min(840px,96vw);
                min-height:100%;
                margin:0 auto;
                padding:24px 18px 34px;
                display:flex;
                flex-direction:column;
                align-items:center;
            }

            .qt-topbar{
                width:min(720px,100%);
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:14px;
                margin-bottom:18px;
            }

            .qt-brand{text-align:left}
            .qt-title{
                margin:0;
                font-size:1.85rem;
                line-height:1;
                font-weight:1000;
                letter-spacing:-.03em;
            }

            .qt-meta{
                margin-top:5px;
                color:#89959e;
                font-size:.68rem;
                font-weight:800;
            }

            .qt-top-actions{
                display:flex;
                align-items:center;
                gap:8px;
            }

            .qt-timer{
                min-width:72px;
                padding:8px 10px;
                border:1px solid #3a444c;
                border-radius:10px;
                background:#202830;
                color:#c9d2d8;
                font-size:.72rem;
                font-weight:1000;
                text-align:center;
            }

            .qt-small-btn{
                padding:8px 11px;
                border:1px solid #3c4750;
                border-radius:10px;
                background:#242d35;
                color:#dce2e6;
                font:inherit;
                font-size:.67rem;
                font-weight:900;
                cursor:pointer;
            }

            .qt-small-btn:hover{background:#2c3740}

            .qt-board-wrap{
                position:relative;
                width:min(620px,92vw);
            }

            .qt-board{
                display:grid;
                width:100%;
                gap:clamp(5px,calc(16px - var(--board-size) * .75px),11px);
            }

            .qt-cell{
                position:relative;
                aspect-ratio:1;
                border:clamp(2px,calc(5px - var(--board-size) * .18px),4px) solid #454e57;
                border-radius:clamp(9px,calc(24px - var(--board-size) * 1px),17px);
                background:#323a40;
                cursor:pointer;
                transition:
                    transform .07s ease,
                    background .10s ease,
                    border-color .10s ease,
                    box-shadow .10s ease;
            }

            .qt-cell:hover:not(.given){
                transform:scale(1.025);
                border-color:#65717a;
            }

            .qt-cell.given{
                cursor:default;
                border-color:#d9e2e8;
                box-shadow:
                    inset 0 0 0 3px rgba(17,25,32,.36),
                    inset 0 0 0 5px rgba(255,255,255,.18),
                    0 2px 8px rgba(0,0,0,.18);
            }

            /* Givens use a striped/darker fill, thick inner frame and a G badge.
               They now remain obvious even on a dense 10×10 board. */
            .qt-cell.given.circle{
                background:
                    repeating-linear-gradient(
                        135deg,
                        rgba(255,255,255,.10) 0 5px,
                        rgba(15,25,34,.08) 5px 10px
                    ),
                    #5798c2;
                border-color:#d8e5ec;
            }

            .qt-cell.given.square{
                background:
                    repeating-linear-gradient(
                        135deg,
                        rgba(255,255,255,.10) 0 5px,
                        rgba(30,18,22,.08) 5px 10px
                    ),
                    #bd777e;
                border-color:#ead9dc;
            }

            .qt-cell.given::after{
                content:"G";
                position:absolute;
                left:6%;
                top:6%;
                min-width:clamp(13px,calc(26px - var(--board-size) * 1px),20px);
                height:clamp(13px,calc(26px - var(--board-size) * 1px),20px);
                padding:0 3px;
                display:flex;
                align-items:center;
                justify-content:center;
                border:1px solid rgba(255,255,255,.55);
                border-radius:5px;
                background:rgba(15,22,28,.76);
                color:#f7fafb;
                font-size:clamp(.43rem,calc(.78rem - var(--board-size) * .025rem),.62rem);
                font-weight:1000;
                line-height:1;
                letter-spacing:.02em;
                pointer-events:none;
            }

            .qt-cell.circle{
                background:#72b9e7;
                border-color:#647d8b;
            }

            .qt-cell.square{
                background:#df989d;
                border-color:#826d72;
            }

            .qt-symbol{
                position:absolute;
                left:50%;
                top:50%;
                transform:translate(-50%,-50%);
                pointer-events:none;
            }

            .qt-cell.circle .qt-symbol{
                width:43%;
                aspect-ratio:1;
                border-radius:50%;
                background:#111920;
            }

            .qt-cell.square .qt-symbol{
                width:43%;
                aspect-ratio:1;
                border:clamp(2px,calc(6px - var(--board-size) * .25px),4px) solid #162028;
                border-radius:clamp(6px,calc(16px - var(--board-size) * .5px),11px);
            }

            .qt-cell.error{
                border-color:#f06c70 !important;
                box-shadow:
                    inset 0 0 0 2px rgba(255,70,70,.25),
                    0 0 12px rgba(255,60,60,.22);
            }


            .qt-cell.hint{
                z-index:3;
                border-color:#f0c75d !important;
                box-shadow:
                    inset 0 0 0 2px rgba(255,226,116,.35),
                    0 0 0 3px rgba(240,199,93,.20),
                    0 0 20px rgba(240,199,93,.52);
                animation:qtHintPulse .95s ease-in-out infinite alternate;
            }

            .qt-cell.hint::before{
                content:"?";
                position:absolute;
                right:7%;
                top:5%;
                z-index:4;
                color:#ffe793;
                font-size:clamp(.65rem,1.7vw,.9rem);
                font-weight:1000;
                text-shadow:0 1px 3px rgba(0,0,0,.55);
            }


            .qt-cell.hint.hint-circle .qt-symbol{
                width:43%;
                aspect-ratio:1;
                border:3px dashed #ffe793;
                border-radius:50%;
                background:rgba(255,231,147,.14);
            }

            .qt-cell.hint.hint-square .qt-symbol{
                width:43%;
                aspect-ratio:1;
                border:3px dashed #ffe793;
                border-radius:10px;
                background:rgba(255,231,147,.10);
            }

            .qt-relation{
                position:absolute;
                z-index:5;
                width:clamp(22px,calc(45px - var(--board-size) * 1.8px),32px);
                aspect-ratio:1;
                display:flex;
                align-items:center;
                justify-content:center;
                transform:translate(-50%,-50%);
                border:clamp(2px,calc(5px - var(--board-size) * .22px),3px) solid #1b242c;
                border-radius:50%;
                background:#eef3f5;
                color:#182129;
                font-size:clamp(.85rem,calc(1.55rem - var(--board-size) * .04rem),1.2rem);
                font-weight:1000;
                line-height:1;
                pointer-events:none;
                box-shadow:0 1px 4px rgba(0,0,0,.22);
            }

            .qt-bottom{
                width:min(620px,92vw);
                display:flex;
                align-items:center;
                justify-content:center;
                gap:10px;
                margin-top:22px;
            }

            .qt-check{
                width:min(320px,72vw);
                height:52px;
                border:0;
                border-radius:13px;
                background:#67b987;
                color:#102018;
                font:inherit;
                font-size:.94rem;
                font-weight:1000;
                cursor:pointer;
                transition:transform .07s ease,filter .10s ease;
            }

            .qt-check:hover{filter:brightness(1.07)}
            .qt-check:active{transform:scale(.985)}


            .qt-hint{
                min-width:142px;
                height:52px;
                padding:0 18px;
                border:1px solid #8f743a;
                border-radius:13px;
                background:#d7b45d;
                color:#2b2417;
                font:inherit;
                font-size:.82rem;
                font-weight:1000;
                cursor:pointer;
                transition:transform .07s ease,filter .10s ease;
            }

            .qt-hint:hover{filter:brightness(1.07)}
            .qt-hint:active{transform:scale(.985)}

            .qt-tools{
                width:min(620px,92vw);
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
                margin-top:9px;
            }

            .qt-tool-btn{
                min-height:39px;
                padding:7px 10px;
                border:1px solid #3b4750;
                border-radius:10px;
                background:#222b32;
                color:#cbd3d8;
                font:inherit;
                font-size:.62rem;
                font-weight:900;
                cursor:pointer;
                transition:background .10s ease,opacity .10s ease,transform .07s ease;
            }

            .qt-tool-btn:hover:not(:disabled){background:#2b363e}
            .qt-tool-btn:active:not(:disabled){transform:scale(.985)}
            .qt-tool-btn:disabled{opacity:.34;cursor:not-allowed}
            .qt-clear{border-color:#65454a;color:#e2b3b7}
            .qt-save{border-color:#426278;color:#b8d7e9}
            .qt-checkpoint{border-color:#4c654e;color:#bcd9bc}

            .qt-rules{
                max-width:620px;
                margin:15px auto 0;
                color:#7e8a93;
                font-size:.67rem;
                line-height:1.55;
                text-align:center;
            }

            .qt-status{
                max-width:620px;
                margin-top:10px;
                color:#65737d;
                font-size:.58rem;
                font-weight:800;
                text-align:center;
            }

            .qt-overlay{
                position:fixed;
                inset:0;
                z-index:30;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:22px;
                background:rgba(10,15,20,.80);
                backdrop-filter:blur(5px);
            }

            .qt-overlay.hidden{display:none}

            .qt-card{
                width:min(590px,94vw);
                padding:26px 26px 24px;
                border:1px solid rgba(255,255,255,.09);
                border-radius:20px;
                background:#202830;
                box-shadow:0 22px 70px rgba(0,0,0,.42);
                text-align:center;
            }

            .qt-menu-logo{
                font-size:2.55rem;
                font-weight:1000;
                letter-spacing:-.05em;
            }

            .qt-menu-sub{
                max-width:470px;
                margin:8px auto 20px;
                color:#8f9aa4;
                font-size:.76rem;
                line-height:1.5;
            }

            .qt-option-title{
                margin:15px 0 7px;
                color:#c4cdd3;
                font-size:.59rem;
                font-weight:1000;
                letter-spacing:.10em;
                text-transform:uppercase;
            }

            .qt-segments{
                display:grid;
                gap:7px;
            }

            .qt-size-options{grid-template-columns:repeat(3,1fr)}
            .qt-diff-options{grid-template-columns:repeat(4,1fr)}

            .qt-segment{
                padding:9px 7px;
                border:1px solid #39454e;
                border-radius:10px;
                background:#171e24;
                color:#7f8c96;
                font:inherit;
                font-size:.66rem;
                font-weight:900;
                cursor:pointer;
            }

            .qt-segment.selected{
                border-color:#60a9d6;
                background:#244457;
                color:#e9f7ff;
            }

            .qt-start{
                width:100%;
                height:47px;
                margin-top:18px;
                border:0;
                border-radius:12px;
                background:#68b98a;
                color:#102019;
                font:inherit;
                font-size:.82rem;
                font-weight:1000;
                cursor:pointer;
            }

            .qt-message-title{
                font-size:1.45rem;
                font-weight:1000;
            }

            .qt-message-text{
                margin-top:8px;
                color:#9ba6ae;
                font-size:.80rem;
                line-height:1.5;
            }

            .qt-message-close{
                min-width:145px;
                height:40px;
                margin-top:17px;
                border:0;
                border-radius:10px;
                background:#3a4650;
                color:#f1f4f6;
                font:inherit;
                font-size:.72rem;
                font-weight:900;
                cursor:pointer;
            }

            .qt-message-card.wrong{border-color:#b45b60}
            .qt-message-card.win{border-color:#58b17a}
            .qt-message-card.hint{border-color:#c9a64e}

            .qt-generating-spinner{
                width:34px;
                height:34px;
                margin:0 auto 13px;
                border:4px solid #34414a;
                border-top-color:#69b98a;
                border-radius:50%;
                animation:qtSpin .75s linear infinite;
            }

            .qt-board.shake{animation:qtShake .27s ease}

            @keyframes qtSpin{to{transform:rotate(360deg)}}
            @keyframes qtHintPulse{
                from{transform:scale(1)}
                to{transform:scale(1.035)}
            }
            @keyframes qtShake{
                0%,100%{transform:translateX(0)}
                25%{transform:translateX(-7px)}
                75%{transform:translateX(7px)}
            }

            @media(max-width:650px){
                .qt-shell{padding-left:10px;padding-right:10px}
                .qt-topbar{align-items:flex-start}
                .qt-top-actions{flex-direction:column;align-items:flex-end}
                .qt-diff-options{grid-template-columns:1fr 1fr}
                .qt-tools{grid-template-columns:1fr 1fr 1fr}
                .qt-tool-btn{padding-left:5px;padding-right:5px;font-size:.56rem}
                .qt-rules{font-size:.61rem}
            }
        `;

        const root=document.createElement('div');
        root.className='qt-game';
        root.innerHTML=`
            <div class="qt-shell">
                <div class="qt-topbar">
                    <div class="qt-brand">
                        <h1 class="qt-title">QuickThinker</h1>
                        <div class="qt-meta">Choose a puzzle to begin</div>
                    </div>

                    <div class="qt-top-actions">
                        <div class="qt-timer">00:00</div>
                        <button class="qt-small-btn qt-new" type="button">New Puzzle</button>
                    </div>
                </div>

                <div class="qt-board-wrap">
                    <div class="qt-board"></div>
                </div>

                <div class="qt-bottom">
                    <button class="qt-check" type="button">CHECK</button>
                    <button class="qt-hint" type="button">HINT</button>
                </div>

                <div class="qt-tools">
                    <button class="qt-tool-btn qt-clear" type="button">CLEAR ALL</button>
                    <button class="qt-tool-btn qt-save" type="button">SAVE</button>
                    <button class="qt-tool-btn qt-checkpoint" type="button" disabled>CHECKPOINT</button>
                </div>

                <div class="qt-rules">
                    Every row and column contains exactly half circles and half squares ·
                    never place three identical symbols consecutively ·
                    = means equal · × means different.
                </div>

                <div class="qt-status"></div>
            </div>

            <div class="qt-overlay qt-menu">
                <div class="qt-card">
                    <div class="qt-menu-logo">QuickThinker</div>
                    <div class="qt-menu-sub">
                        Every generated puzzle is verified to have exactly one solution and is solvable by logical deductions without blind guessing.
                    </div>

                    <div class="qt-option-title">Board Size</div>
                    <div class="qt-segments qt-size-options">
                        ${SUPPORTED_SIZES.map(size=>`
                            <button class="qt-segment ${size===6?'selected':''}" type="button" data-size="${size}">
                                ${size} × ${size}
                            </button>
                        `).join('')}
                    </div>

                    <div class="qt-option-title">Difficulty</div>
                    <div class="qt-segments qt-diff-options">
                        ${Object.values(DIFFICULTIES).map(diff=>`
                            <button class="qt-segment ${diff.id==='normal'?'selected':''}" type="button" data-diff="${diff.id}">
                                ${diff.label}
                            </button>
                        `).join('')}
                    </div>

                    <button class="qt-start" type="button">GENERATE PUZZLE</button>
                </div>
            </div>

            <div class="qt-overlay qt-generating hidden">
                <div class="qt-card">
                    <div class="qt-generating-spinner"></div>
                    <div class="qt-message-title">Building puzzle…</div>
                    <div class="qt-message-text">
                        Generating a valid board, removing clues, proving logical solvability and verifying uniqueness.
                    </div>
                </div>
            </div>

            <div class="qt-overlay qt-message hidden">
                <div class="qt-card qt-message-card">
                    <div class="qt-message-title"></div>
                    <div class="qt-message-text"></div>
                    <button class="qt-message-close" type="button">CONTINUE</button>
                </div>
            </div>
        `;

        container.append(style,root);

        const boardEl=root.querySelector('.qt-board');
        const boardWrapEl=root.querySelector('.qt-board-wrap');
        const checkBtn=root.querySelector('.qt-check');
        const hintBtn=root.querySelector('.qt-hint');
        const clearBtn=root.querySelector('.qt-clear');
        const saveBtn=root.querySelector('.qt-save');
        const checkpointBtn=root.querySelector('.qt-checkpoint');
        const newBtn=root.querySelector('.qt-new');
        const timerEl=root.querySelector('.qt-timer');
        const metaEl=root.querySelector('.qt-meta');
        const statusEl=root.querySelector('.qt-status');

        const menuEl=root.querySelector('.qt-menu');
        const generatingEl=root.querySelector('.qt-generating');
        const startBtn=root.querySelector('.qt-start');
        const sizeButtons=[...root.querySelectorAll('[data-size]')];
        const diffButtons=[...root.querySelectorAll('[data-diff]')];

        const messageEl=root.querySelector('.qt-message');
        const messageCard=root.querySelector('.qt-message-card');
        const messageTitleEl=messageEl.querySelector('.qt-message-title');
        const messageTextEl=messageEl.querySelector('.qt-message-text');
        const messageCloseBtn=messageEl.querySelector('.qt-message-close');

        const createGivenMask = currentPuzzle => {
            const mask=Array.from(
                {length:currentPuzzle.size},
                ()=>Array(currentPuzzle.size).fill(false)
            );

            for(const [row,col] of currentPuzzle.givens){
                mask[row][col]=true;
            }

            return mask;
        };

        const clearRelationElements = () => {
            for(const element of relationElements){
                element.remove();
            }
            relationElements=[];
        };

        const renderCell = (cell,row,col) => {
            const value=board[row][col];
            cell.classList.toggle('circle',value===CIRCLE);
            cell.classList.toggle('square',value===SQUARE);
            cell.setAttribute(
                'aria-label',
                value===CIRCLE
                    ?'Circle'
                    :value===SQUARE
                        ?'Square'
                        :'Empty'
            );
        };

        const renderBoard = () => {
            if(!puzzle) return;

            clearRelationElements();
            boardEl.innerHTML='';
            root.style.setProperty('--board-size',String(puzzle.size));
            boardEl.style.gridTemplateColumns=`repeat(${puzzle.size},1fr)`;

            for(let row=0;row<puzzle.size;row++){
                for(let col=0;col<puzzle.size;col++){
                    const cell=document.createElement('button');
                    cell.type='button';
                    cell.className='qt-cell';
                    cell.dataset.row=row;
                    cell.dataset.col=col;
                    cell.innerHTML='<span class="qt-symbol"></span>';

                    if(given[row][col]){
                        cell.classList.add('given');
                    }

                    cell.addEventListener('click',()=>{
                        if(given[row][col] || won || generating){
                            return;
                        }

                        board[row][col]=
                            board[row][col]===EMPTY
                                ?CIRCLE
                                :board[row][col]===CIRCLE
                                    ?SQUARE
                                    :EMPTY;

                        clearHintHighlight();
                        cell.classList.remove('error');
                        renderCell(cell,row,col);
                    });

                    boardEl.appendChild(cell);
                    renderCell(cell,row,col);
                }
            }

            requestAnimationFrame(renderRelations);
        };

        const renderRelations = () => {
            if(!puzzle) return;

            clearRelationElements();
            const wrapRect=boardWrapEl.getBoundingClientRect();

            for(const relation of puzzle.relations){
                const [ar,ac]=relation.a;
                const [br,bc]=relation.b;

                const a=boardEl.querySelector(`[data-row="${ar}"][data-col="${ac}"]`);
                const b=boardEl.querySelector(`[data-row="${br}"][data-col="${bc}"]`);
                if(!a||!b) continue;

                const ra=a.getBoundingClientRect();
                const rb=b.getBoundingClientRect();

                const marker=document.createElement('div');
                marker.className='qt-relation';
                marker.textContent=relation.type==='same' ? '=' : '×';
                marker.style.left=`${(ra.left+ra.width/2+rb.left+rb.width/2)/2-wrapRect.left}px`;
                marker.style.top=`${(ra.top+ra.height/2+rb.top+rb.height/2)/2-wrapRect.top}px`;

                boardWrapEl.appendChild(marker);
                relationElements.push(marker);
            }
        };

        const updateTimer = () => {
            if(!puzzle || !startedAt){
                timerEl.textContent='00:00';
                return;
            }

            const elapsed=Math.max(0,Math.floor((performance.now()-startedAt)/1000));
            const min=Math.floor(elapsed/60);
            const sec=elapsed%60;
            timerEl.textContent=`${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
        };

        const showMessage = (type,title,text,button='CONTINUE') => {
            messageCard.className=`qt-card qt-message-card ${type}`;
            messageTitleEl.textContent=title;
            messageTextEl.textContent=text;
            messageCloseBtn.textContent=button;
            messageEl.classList.remove('hidden');
        };

        const hideMessage = () => {
            messageEl.classList.add('hidden');
        };

        const clearErrors = () => {
            for(const cell of boardEl.querySelectorAll('.qt-cell.error')){
                cell.classList.remove('error');
            }
        };


        const clearHintHighlight = () => {
            for(const cell of boardEl.querySelectorAll('.qt-cell.hint')){
                cell.classList.remove(
                    'hint',
                    'hint-circle',
                    'hint-square'
                );
            }
        };

        const highlightHintCell = (row,col,value=EMPTY) => {
            clearHintHighlight();

            const cell=boardEl.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );

            cell?.classList.add('hint');

            if(value===CIRCLE){
                cell?.classList.add('hint-circle');
            }else if(value===SQUARE){
                cell?.classList.add('hint-square');
            }

            cell?.scrollIntoView?.({
                block:'nearest',
                inline:'nearest',
                behavior:'smooth'
            });
        };

        const showViolations = violations => {
            clearErrors();

            for(const key of violations){
                const [row,col]=key.split(',').map(Number);
                const cell=boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell?.classList.add('error');
            }
        };

        const maxHintRank = () => ({
            easy:1,
            normal:2,
            hard:3,
            expert:4
        })[puzzle?.difficulty]??4;

        const valueLabel = value =>
            value===CIRCLE
                ?'circle'
                :value===SQUARE
                    ?'square'
                    :'empty';

        const requestHint = () => {
            if(!puzzle || generating || won){
                return;
            }

            clearErrors();
            clearHintHighlight();

            if(
                isBoardFull(board) &&
                isBoardSolvedLegal(board,puzzle.relations)
            ){
                showMessage(
                    'hint',
                    'The board is already solved',
                    'Every rule is satisfied. Press Check to finish the puzzle.'
                );
                return;
            }

            // Recovery comes FIRST. This also works on a completely filled but
            // incorrect board. One inconsistent editable cell is selected and
            // the hint explains why its current value cannot remain.
            const recovery=getRecoveryHint(
                puzzle,
                board
            );

            if(recovery?.status==='correction'){
                highlightHintCell(
                    recovery.row,
                    recovery.col,
                    recovery.target
                );

                const where=`Row ${recovery.row+1}, column ${recovery.col+1}`;
                const current=valueLabel(recovery.current);
                const target=valueLabel(recovery.target);

                let explanation;

                if(
                    recovery.reason==='logical' &&
                    recovery.explanation
                ){
                    explanation=
                        `${where} is currently a ${current}, but that placement cannot stay. `+
                        `${recovery.explanation} `+
                        `Cycle the highlighted cell until it is a ${target}.`;
                }else{
                    explanation=
                        `${where} is currently a ${current}. Keeping that value leaves no legal completion compatible with the givens, the 50/50 rule, the no-three rule and the = / × relations. `+
                        `The opposite value still permits the puzzle's unique completion, so this cell is forced to be a ${target}. `+
                        `Cycle the highlighted cell until it is a ${target}.`;
                }

                showMessage(
                    'hint',
                    `Correction hint · ${recovery.technique}`,
                    explanation
                );
                return;
            }

            // No wrong player entries exist. From here the current position is
            // compatible with the unique solution, so give a normal forward
            // deduction from the exact visible board.
            const directViolations=findPartialRuleViolations(
                board,
                puzzle.relations
            );

            if(directViolations.size){
                // Safety fallback. In a verified unique puzzle a visible
                // contradiction should always contain at least one recovery
                // candidate, but mark it if an unexpected case occurs.
                showViolations(directViolations);
                showMessage(
                    'wrong',
                    'Contradiction found',
                    'The highlighted area violates a visible rule. The hint engine could not isolate a single editable correction in this unusual state.'
                );
                return;
            }

            let hint=getNextLogicalStep(
                puzzle,
                board,
                {maxRank:maxHintRank()}
            );

            if(
                hint.status==='stalled' &&
                maxHintRank()<4
            ){
                hint=getNextLogicalStep(
                    puzzle,
                    board,
                    {maxRank:4}
                );
            }

            if(hint.status==='step' && hint.step){
                const info=explainLogicalStep(
                    hint.step,
                    board,
                    puzzle
                );

                highlightHintCell(
                    hint.step.row,
                    hint.step.col,
                    hint.step.value
                );

                showMessage(
                    'hint',
                    `Hint · ${info.technique}`,
                    `${info.target}. ${info.explanation}`
                );
                return;
            }

            if(hint.status==='solved'){
                showMessage(
                    'hint',
                    'Nothing left to deduce',
                    'The current board is logically complete. Press Check to verify it.'
                );
                return;
            }

            showMessage(
                'hint',
                'No isolated move found',
                'The position is still compatible with the puzzle, but no single forward deduction could be isolated. Try combining the visible row, column and relation constraints.'
            );
        };

        const clearToGivens = () => {
            if(!puzzle || generating){
                return;
            }

            board=boardFromGivens(
                puzzle.size,
                puzzle.givens
            );

            won=false;
            clearErrors();
            clearHintHighlight();
            renderBoard();

            showMessage(
                'hint',
                'Board cleared',
                'All player-entered cells were removed. The original givens remain in place.'
            );
        };

        const saveCheckpoint = () => {
            if(!puzzle || generating){
                return;
            }

            checkpointBoard=cloneBoard(board);
            checkpointBtn.disabled=false;

            showMessage(
                'hint',
                'Checkpoint saved',
                'Your current board formation was saved. Press Checkpoint at any time to return to exactly this state.'
            );
        };

        const restoreCheckpoint = () => {
            if(
                !puzzle ||
                generating ||
                !checkpointBoard
            ){
                return;
            }

            board=cloneBoard(checkpointBoard);
            won=false;
            clearErrors();
            clearHintHighlight();
            renderBoard();

            showMessage(
                'hint',
                'Checkpoint restored',
                'The board has been returned to your last saved formation.'
            );
        };

        const saveScore = elapsedSeconds => {
            const diffRank={easy:1,normal:2,hard:3,expert:4}[puzzle.difficulty]??1;
            const base=puzzle.size*puzzle.size*150*diffRank;
            const score=Math.max(1,Math.round(base-elapsedSeconds*12));

            services?.highscores?.saveHighscore?.(
                `${GAME_ID}-${puzzle.size}-${puzzle.difficulty}`,
                score
            );
        };

        const checkBoard = () => {
            if(!puzzle || generating || won){
                return;
            }

            if(!isBoardFull(board)){
                showMessage(
                    'wrong',
                    'Board not complete',
                    'Fill every empty cell before checking the solution.'
                );
                return;
            }

            if(!isBoardSolvedLegal(board,puzzle.relations)){
                const violations=findRuleViolations(board,puzzle.relations);
                showViolations(violations);

                boardEl.classList.remove('shake');
                void boardEl.offsetWidth;
                boardEl.classList.add('shake');

                showMessage(
                    'wrong',
                    'Something is wrong',
                    'At least one rule is violated. The marked cells are involved in an invalid row, column or relation. You can keep solving and check again.'
                );
                return;
            }

            clearErrors();
            won=true;

            const elapsed=Math.max(0,(performance.now()-startedAt)/1000);
            saveScore(elapsed);

            showMessage(
                'win',
                'Puzzle solved!',
                `Correct. You solved this ${puzzle.size}×${puzzle.size} ${DIFFICULTIES[puzzle.difficulty].label} puzzle in ${timerEl.textContent}.`,
                'NICE'
            );
        };

        const loadPuzzle = newPuzzle => {
            puzzle=newPuzzle;
            board=boardFromGivens(puzzle.size,puzzle.givens);
            given=createGivenMask(puzzle);
            checkpointBoard=null;
            checkpointBtn.disabled=true;
            won=false;
            clearHintHighlight();
            clearErrors();
            startedAt=performance.now();

            metaEl.textContent=
                `${puzzle.size}×${puzzle.size} · ${DIFFICULTIES[puzzle.difficulty].label} · Seed ${puzzle.seed}`;

            statusEl.textContent=
                `Verified unique · logical-only solve · ${puzzle.givens.length} givens · ${puzzle.relations.length} relations`;

            renderBoard();
            updateTimer();
        };

        const generateSelectedPuzzle = () => {
            if(generating) return;

            generating=true;
            generatingEl.classList.remove('hidden');
            menuEl.classList.add('hidden');

            // Give the browser one frame to paint the generation overlay before
            // running the synchronous generator.
            requestAnimationFrame(()=>{
                setTimeout(()=>{
                    try{
                        const generated=generatePuzzle({
                            size:selectedSize,
                            difficulty:selectedDifficulty
                        });

                        if(destroyed) return;
                        loadPuzzle(generated);
                        generatingEl.classList.add('hidden');
                    }catch(error){
                        console.error('[QuickThinker] Generation failed:',error);
                        generatingEl.classList.add('hidden');
                        menuEl.classList.remove('hidden');
                        showMessage(
                            'wrong',
                            'Generation failed',
                            'This puzzle generation attempt failed. Please try again.'
                        );
                    }finally{
                        generating=false;
                    }
                },20);
            });
        };

        sizeButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                selectedSize=Number(button.dataset.size)||6;
                sizeButtons.forEach(b=>b.classList.toggle('selected',b===button));
            });
        });

        diffButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                selectedDifficulty=button.dataset.diff||'normal';
                diffButtons.forEach(b=>b.classList.toggle('selected',b===button));
            });
        });

        startBtn.addEventListener('click',generateSelectedPuzzle);
        checkBtn.addEventListener('click',checkBoard);
        hintBtn.addEventListener('click',requestHint);
        clearBtn.addEventListener('click',clearToGivens);
        saveBtn.addEventListener('click',saveCheckpoint);
        checkpointBtn.addEventListener('click',restoreCheckpoint);
        messageCloseBtn.addEventListener('click',hideMessage);

        newBtn.addEventListener('click',()=>{
            if(generating) return;
            menuEl.classList.remove('hidden');
        });

        const onResize=()=>renderRelations();
        window.addEventListener('resize',onResize);

        timerId=window.setInterval(updateTimer,500);

        return {
            destroy:()=>{
                destroyed=true;
                window.clearInterval(timerId);
                window.removeEventListener('resize',onResize);
                clearRelationElements();
                style.remove();
            }
        };
    }
};

export {
    GAME_ID,
    EMPTY,
    CIRCLE,
    SQUARE,
    DIFFICULTIES,
    SUPPORTED_SIZES
};
