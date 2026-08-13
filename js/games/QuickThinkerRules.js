export const EMPTY = 0;
export const CIRCLE = 1;
export const SQUARE = 2;

const linePatternCache = new Map();

export const opposite = value =>
    value === CIRCLE ? SQUARE : CIRCLE;

export const cellKey = (row,col) => `${row},${col}`;

export const createEmptyBoard = size =>
    Array.from({length:size},()=>Array(size).fill(EMPTY));

export const cloneBoard = board =>
    board.map(row=>row.slice());

export const isBoardFull = board =>
    board.every(row=>row.every(value=>value!==EMPTY));

export const boardFromGivens = (size,givens=[]) => {
    const board=createEmptyBoard(size);

    for(const [row,col,value] of givens){
        board[row][col]=value;
    }

    return board;
};

export const boardToGivens = board => {
    const givens=[];

    for(let row=0;row<board.length;row++){
        for(let col=0;col<board.length;col++){
            const value=board[row][col];
            if(value!==EMPTY){
                givens.push([row,col,value]);
            }
        }
    }

    return givens;
};

export const hasNoTriple = values => {
    for(let i=0;i<=values.length-3;i++){
        const a=values[i];
        const b=values[i+1];
        const c=values[i+2];

        if(
            a!==EMPTY &&
            a===b &&
            b===c
        ){
            return false;
        }
    }

    return true;
};

export const hasBalancedFinalCount = values => {
    const half=values.length/2;
    let circles=0;
    let squares=0;

    for(const value of values){
        if(value===CIRCLE) circles++;
        if(value===SQUARE) squares++;
    }

    return circles===half && squares===half;
};

export const hasValidPartialCount = values => {
    const half=values.length/2;
    let circles=0;
    let squares=0;

    for(const value of values){
        if(value===CIRCLE) circles++;
        if(value===SQUARE) squares++;
    }

    return circles<=half && squares<=half;
};

export const isLinePartialValid = values =>
    hasNoTriple(values) && hasValidPartialCount(values);

export const isLineSolvedValid = values =>
    values.every(value=>value!==EMPTY) &&
    hasNoTriple(values) &&
    hasBalancedFinalCount(values);

export const relationExpectedValue = (value,type) =>
    type==='same' ? value : opposite(value);

export const relationsPartialValid = (board,relations=[]) => {
    for(const relation of relations){
        const [ar,ac]=relation.a;
        const [br,bc]=relation.b;
        const a=board[ar][ac];
        const b=board[br][bc];

        if(a===EMPTY || b===EMPTY){
            continue;
        }

        if(relation.type==='same' && a!==b){
            return false;
        }

        if(relation.type==='different' && a===b){
            return false;
        }
    }

    return true;
};

export const isBoardPartialValid = (board,relations=[]) => {
    const size=board.length;

    for(let row=0;row<size;row++){
        if(!isLinePartialValid(board[row])){
            return false;
        }
    }

    for(let col=0;col<size;col++){
        const values=board.map(row=>row[col]);
        if(!isLinePartialValid(values)){
            return false;
        }
    }

    return relationsPartialValid(board,relations);
};

export const isBoardSolvedLegal = (board,relations=[]) => {
    const size=board.length;

    if(!isBoardFull(board)){
        return false;
    }

    for(let row=0;row<size;row++){
        if(!isLineSolvedValid(board[row])){
            return false;
        }
    }

    for(let col=0;col<size;col++){
        const values=board.map(row=>row[col]);
        if(!isLineSolvedValid(values)){
            return false;
        }
    }

    return relationsPartialValid(board,relations);
};

export const getValidLinePatterns = size => {
    if(linePatternCache.has(size)){
        return linePatternCache.get(size);
    }

    const patterns=[];
    const half=size/2;
    const line=Array(size).fill(CIRCLE);

    const visit = index => {
        if(index===size){
            let circles=0;
            for(const value of line){
                if(value===CIRCLE) circles++;
            }

            if(circles!==half){
                return;
            }

            if(hasNoTriple(line)){
                patterns.push(line.slice());
            }

            return;
        }

        line[index]=CIRCLE;
        visit(index+1);

        line[index]=SQUARE;
        visit(index+1);
    };

    visit(0);
    linePatternCache.set(size,patterns);
    return patterns;
};

const relationFitsPattern = (relation,pattern,isRow,index) => {
    const [ar,ac]=relation.a;
    const [br,bc]=relation.b;

    if(isRow){
        if(ar!==index || br!==index){
            return true;
        }

        const a=pattern[ac];
        const b=pattern[bc];
        return relation.type==='same' ? a===b : a!==b;
    }

    if(ac!==index || bc!==index){
        return true;
    }

    const a=pattern[ar];
    const b=pattern[br];
    return relation.type==='same' ? a===b : a!==b;
};

export const getLineCandidates = (
    board,
    relations,
    isRow,
    index,
    patterns=getValidLinePatterns(board.length)
) => {
    const values=isRow
        ?board[index]
        :board.map(row=>row[index]);

    return patterns.filter(pattern=>{
        for(let i=0;i<values.length;i++){
            if(values[i]!==EMPTY && values[i]!==pattern[i]){
                return false;
            }
        }

        for(const relation of relations){
            if(!relationFitsPattern(relation,pattern,isRow,index)){
                return false;
            }
        }

        return true;
    });
};

export const allLinesHaveCandidate = (board,relations,patterns) => {
    const size=board.length;
    const linePatterns=patterns??getValidLinePatterns(size);

    for(let i=0;i<size;i++){
        if(getLineCandidates(board,relations,true,i,linePatterns).length===0){
            return false;
        }

        if(getLineCandidates(board,relations,false,i,linePatterns).length===0){
            return false;
        }
    }

    return true;
};

export const buildRelationGraph = (size,relations=[]) => {
    const graph=Array.from({length:size*size},()=>[]);

    for(const relation of relations){
        const [ar,ac]=relation.a;
        const [br,bc]=relation.b;
        const a=ar*size+ac;
        const b=br*size+bc;
        const parity=relation.type==='same' ? 0 : 1;

        graph[a].push({to:b,parity});
        graph[b].push({to:a,parity});
    }

    return graph;
};

export const findRuleViolations = (board,relations=[]) => {
    const size=board.length;
    const bad=new Set();
    const add=(row,col)=>bad.add(cellKey(row,col));

    for(let row=0;row<size;row++){
        const line=board[row];
        const half=size/2;
        const circles=line.filter(v=>v===CIRCLE).length;
        const squares=line.filter(v=>v===SQUARE).length;

        if(circles!==half || squares!==half){
            for(let col=0;col<size;col++) add(row,col);
        }

        for(let col=0;col<=size-3;col++){
            const a=line[col];
            if(a!==EMPTY && a===line[col+1] && a===line[col+2]){
                add(row,col);
                add(row,col+1);
                add(row,col+2);
            }
        }
    }

    for(let col=0;col<size;col++){
        const line=board.map(row=>row[col]);
        const half=size/2;
        const circles=line.filter(v=>v===CIRCLE).length;
        const squares=line.filter(v=>v===SQUARE).length;

        if(circles!==half || squares!==half){
            for(let row=0;row<size;row++) add(row,col);
        }

        for(let row=0;row<=size-3;row++){
            const a=line[row];
            if(a!==EMPTY && a===line[row+1] && a===line[row+2]){
                add(row,col);
                add(row+1,col);
                add(row+2,col);
            }
        }
    }

    for(const relation of relations){
        const [ar,ac]=relation.a;
        const [br,bc]=relation.b;
        const a=board[ar][ac];
        const b=board[br][bc];

        if(a===EMPTY || b===EMPTY) continue;

        const invalid=
            relation.type==='same'
                ?a!==b
                :a===b;

        if(invalid){
            add(ar,ac);
            add(br,bc);
        }
    }

    return bad;
};
