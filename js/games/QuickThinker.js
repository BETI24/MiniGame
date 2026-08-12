// QuickThinker.js
// ------------------------------------------------------------
// Simple 6x6 logic puzzle.
// 0 = empty, 1 = circle, 2 = square
//
// To create more levels later, copy PUZZLE_6X6 and change:
// - size
// - givens
// - relations
// ------------------------------------------------------------

const CIRCLE = 1;
const SQUARE = 2;

const PUZZLE_6X6 = {
    name: 'QuickThinker 1',
    size: 6,

    // Fixed cells: [row, column, value]
    givens: [
        [0, 0, CIRCLE],
        [0, 4, SQUARE],
        [1, 5, SQUARE],
        [2, 1, CIRCLE],
        [2, 2, SQUARE],
        [2, 4, SQUARE],
        [3, 1, SQUARE],
        [3, 5, SQUARE],
        [4, 1, CIRCLE],
        [5, 0, SQUARE],
        [5, 2, CIRCLE]
    ],

    // Relations:
    // type: 'same'      -> =
    // type: 'different' -> ×
    relations: [
        { a:[0,0], b:[0,1], type:'same' },
        { a:[0,1], b:[0,2], type:'different' },
        { a:[0,4], b:[0,5], type:'same' },

        { a:[0,3], b:[1,3], type:'different' },
        { a:[0,5], b:[1,5], type:'same' },

        { a:[1,0], b:[2,0], type:'different' },
        { a:[2,2], b:[3,2], type:'same' },

        { a:[3,3], b:[4,3], type:'different' },
        { a:[4,4], b:[5,4], type:'different' },

        { a:[5,4], b:[5,5], type:'same' }
    ]
};

export default {
    manifest: {
        id: 'quick-thinker',
        name: 'QuickThinker',
        description: 'Fill the grid with circles and squares while obeying every logic rule.',
        icon: '🧠',
        tags: ['Puzzle', 'Logic', 'Singleplayer']
    },

    init: (container) => {
        const puzzle = PUZZLE_6X6;

        let board = [];
        let given = [];
        let relationElements = [];
        let won = false;

        const style = document.createElement('style');

        style.textContent = `
            .qt-game{
                width:100%;
                height:100%;
                min-height:620px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#151c23;
                color:#eef3f6;
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
                overflow:auto;
            }

            .qt-wrap{
                width:min(680px,94vw);
                padding:28px 20px 34px;
                text-align:center;
            }

            .qt-title{
                margin:0;
                font-size:2rem;
                font-weight:900;
                letter-spacing:.02em;
            }

            .qt-subtitle{
                margin:6px 0 22px;
                color:#8f9aa4;
                font-size:.82rem;
                font-weight:700;
            }

            .qt-board-wrap{
                position:relative;
                width:min(560px,88vw);
                margin:0 auto;
            }

            .qt-board{
                display:grid;
                grid-template-columns:repeat(6,1fr);
                gap:12px;
                width:100%;
            }

            .qt-cell{
                position:relative;
                aspect-ratio:1;
                border:4px solid #454e57;
                border-radius:18px;
                background:#323a40;
                cursor:pointer;
                transition:
                    transform .08s ease,
                    background .12s ease,
                    border-color .12s ease;
            }

            .qt-cell:hover:not(.given){
                transform:scale(1.035);
                border-color:#68747e;
            }

            .qt-cell.given{
                cursor:default;
                border-color:#68727a;
                box-shadow:inset 0 0 0 3px rgba(255,255,255,.12);
            }

            /* Small corner marker = this cell was given by the puzzle. */
            .qt-cell.given::after{
                content:"";
                position:absolute;
                left:8px;
                top:8px;
                width:7px;
                height:7px;
                border-radius:50%;
                background:rgba(255,255,255,.70);
            }

            .qt-cell.circle{
                background:#71b8e7;
                border-color:#637985;
            }

            .qt-cell.square{
                background:#df969b;
                border-color:#806c70;
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
                width:42%;
                aspect-ratio:1;
                border:4px solid #162028;
                border-radius:11px;
            }

            .qt-relation{
                position:absolute;
                z-index:5;
                width:32px;
                height:32px;
                display:flex;
                align-items:center;
                justify-content:center;
                transform:translate(-50%,-50%);
                border:3px solid #1b242c;
                border-radius:50%;
                background:#eef3f5;
                color:#182129;
                font-size:1.25rem;
                font-weight:1000;
                line-height:1;
                pointer-events:none;
                box-shadow:0 1px 3px rgba(0,0,0,.20);
            }

            .qt-check{
                width:min(300px,76vw);
                height:52px;
                margin-top:28px;
                border:0;
                border-radius:13px;
                background:#67b987;
                color:#102018;
                font:inherit;
                font-size:.95rem;
                font-weight:1000;
                cursor:pointer;
                transition:transform .08s ease,filter .12s ease;
            }

            .qt-check:hover{
                filter:brightness(1.08);
            }

            .qt-check:active{
                transform:scale(.98);
            }

            .qt-rules{
                max-width:560px;
                margin:18px auto 0;
                color:#7f8b94;
                font-size:.67rem;
                line-height:1.55;
            }

            .qt-message{
                position:fixed;
                left:50%;
                top:50%;
                z-index:30;
                width:min(460px,88vw);
                padding:24px 22px;
                transform:translate(-50%,-50%) scale(.94);
                border:2px solid rgba(255,255,255,.10);
                border-radius:18px;
                background:#222a31;
                box-shadow:0 20px 65px rgba(0,0,0,.45);
                opacity:0;
                pointer-events:none;
                transition:opacity .15s ease,transform .15s ease;
            }

            .qt-message.show{
                opacity:1;
                transform:translate(-50%,-50%) scale(1);
                pointer-events:auto;
            }

            .qt-message.wrong{
                border-color:#d36b6b;
            }

            .qt-message.win{
                border-color:#62bd84;
            }

            .qt-message-title{
                font-size:1.45rem;
                font-weight:1000;
            }

            .qt-message-text{
                margin-top:7px;
                color:#a7b1b9;
                font-size:.82rem;
                line-height:1.45;
            }

            .qt-message-close{
                margin-top:17px;
                min-width:130px;
                height:40px;
                border:0;
                border-radius:10px;
                background:#3b454e;
                color:#f0f4f6;
                font:inherit;
                font-size:.75rem;
                font-weight:900;
                cursor:pointer;
            }

            .qt-board.shake{
                animation:qtShake .28s ease;
            }

            @keyframes qtShake{
                0%,100%{transform:translateX(0)}
                25%{transform:translateX(-7px)}
                75%{transform:translateX(7px)}
            }

            @media(max-width:560px){
                .qt-board{
                    gap:8px;
                }

                .qt-cell{
                    border-width:3px;
                    border-radius:13px;
                }

                .qt-relation{
                    width:27px;
                    height:27px;
                    font-size:1rem;
                    border-width:2px;
                }
            }
        `;

        const root = document.createElement('div');
        root.className = 'qt-game';

        root.innerHTML = `
            <div class="qt-wrap">
                <h1 class="qt-title">QuickThinker</h1>
                <div class="qt-subtitle">${puzzle.size} × ${puzzle.size}</div>

                <div class="qt-board-wrap">
                    <div class="qt-board"></div>
                </div>

                <button class="qt-check" type="button">CHECK</button>

                <div class="qt-rules">
                    Equal numbers of circles and squares in every row and column ·
                    never three identical symbols in a row ·
                    = means equal · × means different.
                </div>
            </div>

            <div class="qt-message">
                <div class="qt-message-title"></div>
                <div class="qt-message-text"></div>
                <button class="qt-message-close" type="button">CONTINUE</button>
            </div>
        `;

        container.append(style, root);

        const boardEl = root.querySelector('.qt-board');
        const boardWrapEl = root.querySelector('.qt-board-wrap');
        const checkBtn = root.querySelector('.qt-check');

        const messageEl = root.querySelector('.qt-message');
        const messageTitleEl = root.querySelector('.qt-message-title');
        const messageTextEl = root.querySelector('.qt-message-text');
        const messageCloseBtn = root.querySelector('.qt-message-close');

        // ------------------------------------------------------------
        // Board setup
        // ------------------------------------------------------------

        const createEmptyBoard = size =>
            Array.from(
                { length:size },
                () => Array(size).fill(0)
            );

        const applyGivens = () => {
            for(const [row,col,value] of puzzle.givens){
                board[row][col] = value;
                given[row][col] = true;
            }
        };

        const renderBoard = () => {
            boardEl.innerHTML = '';

            for(let row=0;row<puzzle.size;row++){
                for(let col=0;col<puzzle.size;col++){
                    const cell = document.createElement('button');

                    cell.type = 'button';
                    cell.className = 'qt-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;

                    cell.innerHTML = `<span class="qt-symbol"></span>`;

                    if(given[row][col]){
                        cell.classList.add('given');
                    }

                    cell.addEventListener('click',()=>{
                        if(given[row][col] || won){
                            return;
                        }

                        // Requested cycle:
                        // empty -> circle -> square -> circle -> square ...
                        board[row][col] =
                            board[row][col]===CIRCLE
                                ?SQUARE
                                :CIRCLE;

                        renderCell(cell,row,col);
                    });

                    boardEl.appendChild(cell);

                    renderCell(cell,row,col);
                }
            }

            requestAnimationFrame(renderRelations);
        };

        const renderCell = (cell,row,col) => {
            const value = board[row][col];

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

        // ------------------------------------------------------------
        // Relation markers (= / ×)
        // ------------------------------------------------------------

        const renderRelations = () => {
            for(const el of relationElements){
                el.remove();
            }

            relationElements = [];

            const wrapRect = boardWrapEl.getBoundingClientRect();

            for(const relation of puzzle.relations){
                const [ar,ac] = relation.a;
                const [br,bc] = relation.b;

                const a =
                    boardEl.querySelector(
                        `[data-row="${ar}"][data-col="${ac}"]`
                    );

                const b =
                    boardEl.querySelector(
                        `[data-row="${br}"][data-col="${bc}"]`
                    );

                if(!a || !b){
                    continue;
                }

                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();

                const ax = ra.left + ra.width/2;
                const ay = ra.top + ra.height/2;

                const bx = rb.left + rb.width/2;
                const by = rb.top + rb.height/2;

                const marker = document.createElement('div');

                marker.className = 'qt-relation';
                marker.textContent =
                    relation.type==='same'
                        ?'='
                        :'×';

                marker.style.left =
                    `${(ax+bx)/2-wrapRect.left}px`;

                marker.style.top =
                    `${(ay+by)/2-wrapRect.top}px`;

                boardWrapEl.appendChild(marker);
                relationElements.push(marker);
            }
        };

        // ------------------------------------------------------------
        // Validation
        // ------------------------------------------------------------

        const isBoardFull = () =>
            board.every(
                row => row.every(value=>value!==0)
            );

        const hasEqualCounts = values => {
            const half = puzzle.size/2;

            let circles = 0;
            let squares = 0;

            for(const value of values){
                if(value===CIRCLE) circles++;
                if(value===SQUARE) squares++;
            }

            return circles===half && squares===half;
        };

        const hasNoTriple = values => {
            for(let i=0;i<=values.length-3;i++){
                if(
                    values[i]===values[i+1] &&
                    values[i]===values[i+2]
                ){
                    return false;
                }
            }

            return true;
        };

        const relationsAreValid = () => {
            for(const relation of puzzle.relations){
                const [ar,ac] = relation.a;
                const [br,bc] = relation.b;

                const a = board[ar][ac];
                const b = board[br][bc];

                if(
                    relation.type==='same' &&
                    a!==b
                ){
                    return false;
                }

                if(
                    relation.type==='different' &&
                    a===b
                ){
                    return false;
                }
            }

            return true;
        };

        const boardIsLegal = () => {
            // Rows
            for(let row=0;row<puzzle.size;row++){
                const values = board[row];

                if(!hasEqualCounts(values)){
                    return false;
                }

                if(!hasNoTriple(values)){
                    return false;
                }
            }

            // Columns
            for(let col=0;col<puzzle.size;col++){
                const values =
                    board.map(row=>row[col]);

                if(!hasEqualCounts(values)){
                    return false;
                }

                if(!hasNoTriple(values)){
                    return false;
                }
            }

            return relationsAreValid();
        };

        // ------------------------------------------------------------
        // Messages / Check button
        // ------------------------------------------------------------

        const showMessage = (type,title,text) => {
            messageEl.className =
                `qt-message ${type} show`;

            messageTitleEl.textContent = title;
            messageTextEl.textContent = text;

            messageCloseBtn.textContent =
                type==='win'
                    ?'OK'
                    :'CONTINUE';
        };

        const hideMessage = () => {
            messageEl.classList.remove('show');
        };

        const checkBoard = () => {
            if(!isBoardFull()){
                showMessage(
                    'wrong',
                    'Noch nicht fertig',
                    'Fülle zuerst alle Felder aus und versuche es dann erneut.'
                );

                return;
            }

            if(!boardIsLegal()){
                boardEl.classList.remove('shake');

                // Restart the animation even on repeated checks.
                void boardEl.offsetWidth;

                boardEl.classList.add('shake');

                showMessage(
                    'wrong',
                    'Nicht ganz richtig',
                    'Mindestens eine Regel ist verletzt. Du kannst direkt weiterlösen und danach erneut auf Check klicken.'
                );

                return;
            }

            won = true;

            showMessage(
                'win',
                'Richtig gelöst!',
                'Das gesamte Board wurde legal ausgefüllt. QuickThinker geschafft!'
            );
        };

        checkBtn.addEventListener('click',checkBoard);
        messageCloseBtn.addEventListener('click',hideMessage);

        // ------------------------------------------------------------
        // Start
        // ------------------------------------------------------------

        board = createEmptyBoard(puzzle.size);
        given = createEmptyBoard(puzzle.size).map(
            row => row.map(()=>false)
        );

        applyGivens();
        renderBoard();

        const onResize = () => renderRelations();

        window.addEventListener('resize',onResize);

        return {
            destroy:()=>{
                window.removeEventListener('resize',onResize);

                for(const el of relationElements){
                    el.remove();
                }

                style.remove();
            }
        };
    }
};

export {
    CIRCLE,
    SQUARE,
    PUZZLE_6X6
};
