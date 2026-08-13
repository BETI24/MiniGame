import {
    EMPTY,
    CIRCLE,
    SQUARE,
    opposite,
    cloneBoard,
    boardFromGivens,
    isBoardFull,
    isBoardPartialValid,
    isBoardSolvedLegal,
    getValidLinePatterns,
    getLineCandidates,
    allLinesHaveCandidate,
    buildRelationGraph,
    findPartialRuleViolations,
    cellKey
} from './QuickThinkerRules.js';

export const TECHNIQUE_RANK = {
    relation: 1,
    triple: 1,
    balance: 1,
    line: 2,
    relationChain: 3,
    lookahead: 4
};

export const TECHNIQUE_LABEL = {
    relation: 'Relation propagation',
    triple: 'Triple avoidance',
    balance: 'Half-balance completion',
    line: 'Line possibility scan',
    relationChain: 'Relation-chain forcing',
    lookahead: 'Contradiction forcing'
};

const TECHNIQUE_WEIGHT = {
    relation: 1.0,
    triple: 1.1,
    balance: 1.25,
    line: 3.8,
    relationChain: 7.5,
    lookahead: 13.5
};

const makeStats = () => ({
    score: 0,
    assignments: 0,
    maxRank: 0,
    counts: {
        relation:0,
        triple:0,
        balance:0,
        line:0,
        relationChain:0,
        lookahead:0
    }
});

const registerStep = (trace,stats,technique,row,col,value,detail='') => {
    stats.assignments++;
    stats.maxRank=Math.max(stats.maxRank,TECHNIQUE_RANK[technique]??0);
    stats.counts[technique]=(stats.counts[technique]??0)+1;
    stats.score+=TECHNIQUE_WEIGHT[technique]??1;

    if(trace){
        trace.push({
            technique,
            rank:TECHNIQUE_RANK[technique]??0,
            row,
            col,
            value,
            detail
        });
    }
};

const setCell = (board,row,col,value,technique,trace,stats,detail='') => {
    const current=board[row][col];

    if(current===value){
        return {changed:false,contradiction:false};
    }

    if(current!==EMPTY && current!==value){
        return {changed:false,contradiction:true};
    }

    board[row][col]=value;
    registerStep(trace,stats,technique,row,col,value,detail);
    return {changed:true,contradiction:false};
};

const applyRelationPropagation = (board,puzzle,trace,stats) => {
    let changed=false;

    for(const relation of puzzle.relations){
        const [ar,ac]=relation.a;
        const [br,bc]=relation.b;
        const a=board[ar][ac];
        const b=board[br][bc];

        if(a!==EMPTY && b===EMPTY){
            const value=relation.type==='same' ? a : opposite(a);
            const result=setCell(
                board,br,bc,value,'relation',trace,stats,
                relation.type==='same' ? '= relation' : '× relation'
            );

            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }else if(b!==EMPTY && a===EMPTY){
            const value=relation.type==='same' ? b : opposite(b);
            const result=setCell(
                board,ar,ac,value,'relation',trace,stats,
                relation.type==='same' ? '= relation' : '× relation'
            );

            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }else if(a!==EMPTY && b!==EMPTY){
            const valid=relation.type==='same' ? a===b : a!==b;
            if(!valid) return {changed,contradiction:true};
        }
    }

    return {changed,contradiction:false};
};

const scanTripleLine = (board,isRow,index,trace,stats) => {
    const size=board.length;
    const get=i=>isRow ? board[index][i] : board[i][index];
    const put=(i,value,detail)=>
        setCell(
            board,
            isRow?index:i,
            isRow?i:index,
            value,
            'triple',
            trace,
            stats,
            detail
        );

    let changed=false;

    for(let i=0;i<=size-3;i++){
        const a=get(i);
        const b=get(i+1);
        const c=get(i+2);

        if(a!==EMPTY && a===b && c===EMPTY){
            const result=put(i+2,opposite(a),'Two equal symbols force the third opposite');
            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }

        if(a===EMPTY && b!==EMPTY && b===c){
            const result=put(i,opposite(b),'Two equal symbols force the third opposite');
            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }

        if(a!==EMPTY && a===c && b===EMPTY){
            const result=put(i+1,opposite(a),'Matching outer symbols force the center opposite');
            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }
    }

    return {changed,contradiction:false};
};

const applyTripleRules = (board,trace,stats) => {
    let changed=false;

    for(let i=0;i<board.length;i++){
        let result=scanTripleLine(board,true,i,trace,stats);
        if(result.contradiction) return {changed,contradiction:true};
        changed ||= result.changed;

        result=scanTripleLine(board,false,i,trace,stats);
        if(result.contradiction) return {changed,contradiction:true};
        changed ||= result.changed;
    }

    return {changed,contradiction:false};
};

const fillBalanceLine = (board,isRow,index,trace,stats) => {
    const size=board.length;
    const half=size/2;
    const values=isRow ? board[index] : board.map(row=>row[index]);

    let circles=0;
    let squares=0;

    for(const value of values){
        if(value===CIRCLE) circles++;
        if(value===SQUARE) squares++;
    }

    if(circles>half || squares>half){
        return {changed:false,contradiction:true};
    }

    let forced=EMPTY;
    if(circles===half) forced=SQUARE;
    if(squares===half) forced=CIRCLE;

    if(forced===EMPTY){
        return {changed:false,contradiction:false};
    }

    let changed=false;

    for(let i=0;i<size;i++){
        const row=isRow?index:i;
        const col=isRow?i:index;

        if(board[row][col]===EMPTY){
            const result=setCell(
                board,row,col,forced,'balance',trace,stats,
                'One symbol already reached half of the line'
            );

            if(result.contradiction) return {changed,contradiction:true};
            changed ||= result.changed;
        }
    }

    return {changed,contradiction:false};
};

const applyBalanceRules = (board,trace,stats) => {
    let changed=false;

    for(let i=0;i<board.length;i++){
        let result=fillBalanceLine(board,true,i,trace,stats);
        if(result.contradiction) return {changed,contradiction:true};
        changed ||= result.changed;

        result=fillBalanceLine(board,false,i,trace,stats);
        if(result.contradiction) return {changed,contradiction:true};
        changed ||= result.changed;
    }

    return {changed,contradiction:false};
};

const applyLineConsensus = (board,puzzle,patterns,trace,stats) => {
    const size=board.length;
    let changed=false;

    for(const isRow of [true,false]){
        for(let index=0;index<size;index++){
            const candidates=getLineCandidates(
                board,
                puzzle.relations,
                isRow,
                index,
                patterns
            );

            if(candidates.length===0){
                return {changed,contradiction:true};
            }

            for(let pos=0;pos<size;pos++){
                const row=isRow?index:pos;
                const col=isRow?pos:index;

                if(board[row][col]!==EMPTY){
                    continue;
                }

                const first=candidates[0][pos];
                let unanimous=true;

                for(let c=1;c<candidates.length;c++){
                    if(candidates[c][pos]!==first){
                        unanimous=false;
                        break;
                    }
                }

                if(unanimous){
                    const result=setCell(
                        board,row,col,first,'line',trace,stats,
                        `${isRow?'Row':'Column'} ${index+1} has ${candidates.length} remaining valid pattern${candidates.length===1?'':'s'}`
                    );

                    if(result.contradiction) return {changed,contradiction:true};
                    changed ||= result.changed;
                }
            }
        }
    }

    return {changed,contradiction:false};
};

const getRelationComponents = puzzle => {
    const size=puzzle.size;
    const graph=buildRelationGraph(size,puzzle.relations);
    const visited=Array(size*size).fill(false);
    const components=[];

    for(let start=0;start<graph.length;start++){
        if(visited[start] || graph[start].length===0){
            continue;
        }

        const queue=[start];
        const parity=new Map([[start,0]]);
        visited[start]=true;
        const nodes=[];

        while(queue.length){
            const current=queue.shift();
            nodes.push(current);

            for(const edge of graph[current]){
                const nextParity=parity.get(current)^edge.parity;

                if(!parity.has(edge.to)){
                    parity.set(edge.to,nextParity);
                }else if(parity.get(edge.to)!==nextParity){
                    return {contradiction:true,components:[]};
                }

                if(!visited[edge.to]){
                    visited[edge.to]=true;
                    queue.push(edge.to);
                }
            }
        }

        components.push({nodes,parity});
    }

    return {contradiction:false,components};
};

const assignmentForComponent = (component,rootValue,size) => {
    const assignments=[];

    for(const node of component.nodes){
        const row=Math.floor(node/size);
        const col=node%size;
        const parity=component.parity.get(node)??0;
        const value=parity===0 ? rootValue : opposite(rootValue);
        assignments.push({row,col,value});
    }

    return assignments;
};

const componentAssignmentFeasible = (board,puzzle,patterns,assignments) => {
    const test=cloneBoard(board);

    for(const {row,col,value} of assignments){
        const current=test[row][col];
        if(current!==EMPTY && current!==value){
            return false;
        }
        test[row][col]=value;
    }

    return (
        isBoardPartialValid(test,puzzle.relations) &&
        allLinesHaveCandidate(test,puzzle.relations,patterns)
    );
};

const applyRelationChainForcing = (board,puzzle,patterns,trace,stats) => {
    const result=getRelationComponents(puzzle);
    if(result.contradiction){
        return {changed:false,contradiction:true};
    }

    let changed=false;

    for(const component of result.components){
        let anchored=false;

        for(const node of component.nodes){
            const row=Math.floor(node/puzzle.size);
            const col=node%puzzle.size;
            if(board[row][col]!==EMPTY){
                anchored=true;
                break;
            }
        }

        if(anchored){
            continue;
        }

        const circleAssignments=assignmentForComponent(component,CIRCLE,puzzle.size);
        const squareAssignments=assignmentForComponent(component,SQUARE,puzzle.size);

        const circlePossible=componentAssignmentFeasible(
            board,puzzle,patterns,circleAssignments
        );

        const squarePossible=componentAssignmentFeasible(
            board,puzzle,patterns,squareAssignments
        );

        if(!circlePossible && !squarePossible){
            return {changed,contradiction:true};
        }

        if(circlePossible===squarePossible){
            continue;
        }

        const forced=circlePossible ? circleAssignments : squareAssignments;

        for(const assignment of forced){
            if(board[assignment.row][assignment.col]!==EMPTY){
                continue;
            }

            const setResult=setCell(
                board,
                assignment.row,
                assignment.col,
                assignment.value,
                'relationChain',
                trace,
                stats,
                'Only one orientation of a connected = / × chain remains line-feasible'
            );

            if(setResult.contradiction){
                return {changed,contradiction:true};
            }

            changed ||= setResult.changed;
        }
    }

    return {changed,contradiction:false};
};

const runLogical = (
    startBoard,
    puzzle,
    maxRank,
    recordTrace,
    allowLookahead=true
) => {
    const board=cloneBoard(startBoard);
    const trace=recordTrace ? [] : null;
    const stats=makeStats();
    const patterns=getValidLinePatterns(puzzle.size);
    const maxIterations=puzzle.size*puzzle.size*12;

    for(let iteration=0;iteration<maxIterations;iteration++){
        if(!isBoardPartialValid(board,puzzle.relations)){
            return {status:'contradiction',board,trace:trace??[],stats};
        }

        if(!allLinesHaveCandidate(board,puzzle.relations,patterns)){
            return {status:'contradiction',board,trace:trace??[],stats};
        }

        if(isBoardFull(board)){
            return {
                status:isBoardSolvedLegal(board,puzzle.relations)?'solved':'contradiction',
                board,
                trace:trace??[],
                stats
            };
        }

        let changed=false;
        let result;

        if(maxRank>=1){
            result=applyRelationPropagation(board,puzzle,trace,stats);
            if(result.contradiction) return {status:'contradiction',board,trace:trace??[],stats};
            if(result.changed) changed=true;

            result=applyTripleRules(board,trace,stats);
            if(result.contradiction) return {status:'contradiction',board,trace:trace??[],stats};
            if(result.changed) changed=true;

            result=applyBalanceRules(board,trace,stats);
            if(result.contradiction) return {status:'contradiction',board,trace:trace??[],stats};
            if(result.changed) changed=true;
        }

        if(changed){
            continue;
        }

        if(maxRank>=2){
            result=applyLineConsensus(board,puzzle,patterns,trace,stats);
            if(result.contradiction) return {status:'contradiction',board,trace:trace??[],stats};
            if(result.changed) continue;
        }

        if(maxRank>=3){
            result=applyRelationChainForcing(board,puzzle,patterns,trace,stats);
            if(result.contradiction) return {status:'contradiction',board,trace:trace??[],stats};
            if(result.changed) continue;
        }

        if(maxRank>=4 && allowLookahead){
            const lookaheadResult=applyLookahead(board,puzzle,trace,stats);
            if(lookaheadResult.contradiction){
                return {status:'contradiction',board,trace:trace??[],stats};
            }
            if(lookaheadResult.changed){
                continue;
            }
        }

        return {status:'stalled',board,trace:trace??[],stats};
    }

    return {status:'stalled',board,trace:trace??[],stats};
};

const applyLookahead = (board,puzzle,trace,stats) => {
    const size=board.length;

    for(let row=0;row<size;row++){
        for(let col=0;col<size;col++){
            if(board[row][col]!==EMPTY){
                continue;
            }

            const impossible=[];

            for(const value of [CIRCLE,SQUARE]){
                const assumed=cloneBoard(board);
                assumed[row][col]=value;

                const result=runLogical(
                    assumed,
                    puzzle,
                    3,
                    false,
                    false
                );

                if(result.status==='contradiction'){
                    impossible.push(value);
                }
            }

            if(impossible.length===2){
                return {changed:false,contradiction:true};
            }

            if(impossible.length===1){
                const forced=opposite(impossible[0]);
                const setResult=setCell(
                    board,row,col,forced,'lookahead',trace,stats,
                    'The opposite value leads to a contradiction using lower-level rules'
                );

                return {
                    changed:setResult.changed,
                    contradiction:setResult.contradiction
                };
            }
        }
    }

    return {changed:false,contradiction:false};
};

export const solveLogically = (
    puzzle,
    {
        maxRank=4,
        recordTrace=true
    }={}
) => {
    const board=boardFromGivens(puzzle.size,puzzle.givens);
    return runLogical(board,puzzle,maxRank,recordTrace,true);
};


export const solveBoardLogically = (
    puzzle,
    startBoard,
    {
        maxRank=4,
        recordTrace=true
    }={}
) => runLogical(
    cloneBoard(startBoard),
    puzzle,
    maxRank,
    recordTrace,
    true
);

const valueName = value =>
    value===CIRCLE
        ?'circle'
        :'square';

const cellName = (row,col) =>
    `row ${row+1}, column ${col+1}`;

const findRelationReason = (step,board,puzzle) => {
    for(const relation of puzzle.relations){
        let other=null;

        if(
            relation.a[0]===step.row &&
            relation.a[1]===step.col
        ){
            other=relation.b;
        }else if(
            relation.b[0]===step.row &&
            relation.b[1]===step.col
        ){
            other=relation.a;
        }

        if(!other){
            continue;
        }

        const otherValue=board[other[0]][other[1]];
        if(otherValue===EMPTY){
            continue;
        }

        const mark=relation.type==='same' ? '=' : '×';
        const relationMeaning=
            relation.type==='same'
                ?'must contain the same symbol'
                :'must contain different symbols';

        return `${cellName(step.row,step.col)} is connected by ${mark} to ${cellName(other[0],other[1])}, which already contains a ${valueName(otherValue)}. The ${mark} rule says those two cells ${relationMeaning}, so this cell is forced to be a ${valueName(step.value)}.`;
    }

    return `A visible = / × relation forces ${cellName(step.row,step.col)} to be a ${valueName(step.value)}.`;
};

const findTripleReason = (step,board) => {
    const size=board.length;

    for(const isRow of [true,false]){
        const fixed=isRow ? step.row : step.col;
        const pos=isRow ? step.col : step.row;
        const values=isRow
            ?board[fixed]
            :board.map(row=>row[fixed]);

        for(let start=Math.max(0,pos-2);start<=Math.min(pos,size-3);start++){
            const window=[start,start+1,start+2];
            if(!window.includes(pos)) continue;

            const others=window.filter(i=>i!==pos);
            const a=values[others[0]];
            const b=values[others[1]];

            if(
                a!==EMPTY &&
                a===b &&
                step.value===opposite(a)
            ){
                const lineName=isRow
                    ?`row ${fixed+1}`
                    :`column ${fixed+1}`;

                return `In ${lineName}, the other two cells in this group of three are both ${valueName(a)}s. Three identical symbols may never appear consecutively, so ${cellName(step.row,step.col)} must be a ${valueName(step.value)}.`;
            }
        }
    }

    return `Placing the opposite symbol at ${cellName(step.row,step.col)} would create three identical consecutive symbols, so it must be a ${valueName(step.value)}.`;
};

const findBalanceReason = (step,board) => {
    const size=board.length;
    const half=size/2;

    for(const isRow of [true,false]){
        const index=isRow ? step.row : step.col;
        const values=isRow
            ?board[index]
            :board.map(row=>row[index]);

        const circles=values.filter(v=>v===CIRCLE).length;
        const squares=values.filter(v=>v===SQUARE).length;
        const lineName=isRow
            ?`Row ${index+1}`
            :`Column ${index+1}`;

        if(circles===half && step.value===SQUARE){
            return `${lineName} already contains all ${half} circles allowed on a ${size}×${size} board. Every remaining empty cell in that line must therefore be a square, including ${cellName(step.row,step.col)}.`;
        }

        if(squares===half && step.value===CIRCLE){
            return `${lineName} already contains all ${half} squares allowed on a ${size}×${size} board. Every remaining empty cell in that line must therefore be a circle, including ${cellName(step.row,step.col)}.`;
        }
    }

    return `The 50/50 balance rule forces ${cellName(step.row,step.col)} to be a ${valueName(step.value)}.`;
};

const findLineReason = (step,board,puzzle) => {
    const patterns=getValidLinePatterns(puzzle.size);

    for(const isRow of [true,false]){
        const index=isRow ? step.row : step.col;
        const pos=isRow ? step.col : step.row;
        const candidates=getLineCandidates(
            board,
            puzzle.relations,
            isRow,
            index,
            patterns
        );

        if(!candidates.length){
            continue;
        }

        if(candidates.every(pattern=>pattern[pos]===step.value)){
            const lineName=isRow
                ?`row ${index+1}`
                :`column ${index+1}`;

            return `After applying the half-and-half rule, the no-three rule and the visible relation marks, ${lineName} has only ${candidates.length} valid pattern${candidates.length===1?'':'s'} left. Every one of those patterns places a ${valueName(step.value)} at ${cellName(step.row,step.col)}, so that move is forced.`;
        }
    }

    return `All valid remaining patterns for this row or column agree that ${cellName(step.row,step.col)} must be a ${valueName(step.value)}.`;
};

const relationComponentSizeForCell = (puzzle,row,col) => {
    const graph=buildRelationGraph(puzzle.size,puzzle.relations);
    const start=row*puzzle.size+col;

    if(!graph[start]?.length){
        return 0;
    }

    const seen=new Set([start]);
    const queue=[start];

    while(queue.length){
        const current=queue.shift();
        for(const edge of graph[current]){
            if(!seen.has(edge.to)){
                seen.add(edge.to);
                queue.push(edge.to);
            }
        }
    }

    return seen.size;
};

export const explainLogicalStep = (step,startBoard,puzzle) => {
    const target=`${cellName(step.row,step.col)} → ${valueName(step.value)}`;
    let explanation='';

    if(step.technique==='relation'){
        explanation=findRelationReason(step,startBoard,puzzle);
    }else if(step.technique==='triple'){
        explanation=findTripleReason(step,startBoard);
    }else if(step.technique==='balance'){
        explanation=findBalanceReason(step,startBoard);
    }else if(step.technique==='line'){
        explanation=findLineReason(step,startBoard,puzzle);
    }else if(step.technique==='relationChain'){
        const count=relationComponentSizeForCell(
            puzzle,
            step.row,
            step.col
        );

        explanation=`${cellName(step.row,step.col)} belongs to a connected chain of ${count||'several'} cells linked by = / × marks. There are only two possible orientations for that whole chain. One orientation is incompatible with the current row and column possibilities, so the remaining orientation forces this cell to be a ${valueName(step.value)}.`;
    }else if(step.technique==='lookahead'){
        explanation=`If ${cellName(step.row,step.col)} were a ${valueName(opposite(step.value))}, the simpler visible rules would eventually produce a contradiction. That possibility can therefore be eliminated, which forces a ${valueName(step.value)} here.`;
    }else{
        explanation=step.detail || `${cellName(step.row,step.col)} is forced to be a ${valueName(step.value)} by the current board state.`;
    }

    return {
        target,
        explanation,
        technique:TECHNIQUE_LABEL[step.technique]??step.technique,
        valueName:valueName(step.value),
        cellName:cellName(step.row,step.col)
    };
};

export const getNextLogicalStep = (
    puzzle,
    startBoard,
    {
        maxRank=4
    }={}
) => {
    const board=cloneBoard(startBoard);
    const patterns=getValidLinePatterns(puzzle.size);

    if(
        !isBoardPartialValid(board,puzzle.relations) ||
        !allLinesHaveCandidate(board,puzzle.relations,patterns)
    ){
        return {
            status:'contradiction',
            step:null,
            trace:[]
        };
    }

    if(isBoardFull(board)){
        return {
            status:isBoardSolvedLegal(board,puzzle.relations)
                ?'solved'
                :'contradiction',
            step:null,
            trace:[]
        };
    }

    const result=runLogical(
        board,
        puzzle,
        maxRank,
        true,
        true
    );

    if(result.trace.length){
        return {
            status:'step',
            step:result.trace[0],
            trace:result.trace,
            result
        };
    }

    return {
        status:result.status,
        step:null,
        trace:result.trace,
        result
    };
};


// -----------------------------------------------------------------------------
// Recovery hints
// -----------------------------------------------------------------------------
// A normal hint assumes the player's current entries are still compatible with
// the puzzle. Recovery hints are used when one or more player entries make the
// position impossible. They correct exactly ONE editable cell at a time.
//
// The generated puzzles keep their verified unique solution internally. We use
// it only to identify which player-entered cells are inconsistent. The actual
// explanation still tries to reconstruct a rule-based deduction first; if that
// is not possible from the visible state, it falls back to a contradiction
// proof (keeping the current value leaves zero legal completions).

const givenKeySet = puzzle =>
    new Set(
        puzzle.givens.map(([row,col])=>cellKey(row,col))
    );

const findTargetDeduction = (
    puzzle,
    startBoard,
    targetRow,
    targetCol,
    maxRank=4
) => {
    const work=cloneBoard(startBoard);
    const limit=puzzle.size*puzzle.size+8;

    for(let i=0;i<limit;i++){
        const next=getNextLogicalStep(
            puzzle,
            work,
            {maxRank}
        );

        if(next.status!=='step' || !next.step){
            return null;
        }

        const before=cloneBoard(work);
        const step=next.step;

        if(
            step.row===targetRow &&
            step.col===targetCol
        ){
            return {
                step,
                before,
                info:explainLogicalStep(
                    step,
                    before,
                    puzzle
                )
            };
        }

        work[step.row][step.col]=step.value;
    }

    return null;
};

export const getRecoveryHint = (puzzle,startBoard) => {
    if(!puzzle?.solution){
        return null;
    }

    const givenKeys=givenKeySet(puzzle);
    const violations=findPartialRuleViolations(
        startBoard,
        puzzle.relations
    );

    const wrong=[];
    const trusted=boardFromGivens(
        puzzle.size,
        puzzle.givens
    );

    // Keep player entries that are still compatible with the unique solution.
    // Wrong entries are deliberately left empty in `trusted`, so we can rebuild
    // a clean logical path without changing the real board.
    for(let row=0;row<puzzle.size;row++){
        for(let col=0;col<puzzle.size;col++){
            const key=cellKey(row,col);
            if(givenKeys.has(key)){
                continue;
            }

            const current=startBoard[row][col];
            if(current===EMPTY){
                continue;
            }

            if(current===puzzle.solution[row][col]){
                trusted[row][col]=current;
            }else{
                wrong.push({
                    row,
                    col,
                    current,
                    target:puzzle.solution[row][col],
                    inVisibleViolation:violations.has(key)
                });
            }
        }
    }

    if(!wrong.length){
        return null;
    }

    // Prefer a wrong cell already involved in a visible contradiction, because
    // that is the most intuitive correction for the player.
    wrong.sort((a,b)=>
        Number(b.inVisibleViolation)-
        Number(a.inVisibleViolation)
    );

    for(const candidate of wrong){
        const deduction=findTargetDeduction(
            puzzle,
            trusted,
            candidate.row,
            candidate.col,
            4
        );

        if(deduction){
            return {
                status:'correction',
                ...candidate,
                reason:'logical',
                technique:deduction.info.technique,
                explanation:deduction.info.explanation
            };
        }
    }

    // Fallback: prove one current value impossible. We test the wrong value on
    // top of the givens plus all player entries that remain compatible. If it
    // produces zero legal completions, its opposite is forced by contradiction.
    for(const candidate of wrong){
        const wrongTest=cloneBoard(trusted);
        wrongTest[candidate.row][candidate.col]=candidate.current;

        if(countSolutionsFromBoard(puzzle,wrongTest,1)===0){
            const correctTest=cloneBoard(trusted);
            correctTest[candidate.row][candidate.col]=candidate.target;

            if(countSolutionsFromBoard(puzzle,correctTest,1)>0){
                return {
                    status:'correction',
                    ...candidate,
                    reason:'contradiction',
                    technique:'Contradiction forcing',
                    explanation:null
                };
            }
        }
    }

    // Since the puzzle is unique, this is only a final safety fallback.
    return {
        status:'correction',
        ...wrong[0],
        reason:'unique',
        technique:'Recovery',
        explanation:null
    };
};

const valueAllowedAt = (board,puzzle,row,col,value,patterns) => {
    const test=cloneBoard(board);
    test[row][col]=value;

    if(!isBoardPartialValid(test,puzzle.relations)){
        return false;
    }

    if(getLineCandidates(test,puzzle.relations,true,row,patterns).length===0){
        return false;
    }

    if(getLineCandidates(test,puzzle.relations,false,col,patterns).length===0){
        return false;
    }

    return true;
};

export const countSolutionsFromBoard = (puzzle,startBoard,limit=2) => {
    const board=cloneBoard(startBoard);
    const patterns=getValidLinePatterns(puzzle.size);
    let count=0;

    const search = () => {
        if(count>=limit){
            return;
        }

        if(!isBoardPartialValid(board,puzzle.relations)){
            return;
        }

        if(isBoardFull(board)){
            if(isBoardSolvedLegal(board,puzzle.relations)){
                count++;
            }
            return;
        }

        let best=null;

        for(let row=0;row<puzzle.size;row++){
            for(let col=0;col<puzzle.size;col++){
                if(board[row][col]!==EMPTY){
                    continue;
                }

                const domain=[];
                for(const value of [CIRCLE,SQUARE]){
                    if(valueAllowedAt(board,puzzle,row,col,value,patterns)){
                        domain.push(value);
                    }
                }

                if(domain.length===0){
                    return;
                }

                if(!best || domain.length<best.domain.length){
                    best={row,col,domain};
                    if(domain.length===1) break;
                }
            }
            if(best?.domain.length===1) break;
        }

        if(!best){
            return;
        }

        for(const value of best.domain){
            board[best.row][best.col]=value;
            search();
            board[best.row][best.col]=EMPTY;

            if(count>=limit){
                return;
            }
        }
    };

    search();
    return count;
};

export const countSolutions = (puzzle,limit=2) =>
    countSolutionsFromBoard(
        puzzle,
        boardFromGivens(puzzle.size,puzzle.givens),
        limit
    );

export const analyzePuzzle = puzzle => {
    const full=solveLogically(puzzle,{maxRank:4,recordTrace:true});

    const solvedAtRank={};
    for(let rank=1;rank<=4;rank++){
        solvedAtRank[rank]=
            solveLogically(puzzle,{maxRank:rank,recordTrace:false}).status==='solved';
    }

    return {
        ...full,
        solvedAtRank,
        unique:full.status==='solved' ? countSolutions(puzzle,2)===1 : false
    };
};

export const relationComponentSummary = puzzle => {
    const graph=buildRelationGraph(puzzle.size,puzzle.relations);
    const visited=new Set();
    const sizes=[];

    for(let i=0;i<graph.length;i++){
        if(visited.has(i) || graph[i].length===0) continue;

        const queue=[i];
        visited.add(i);
        let size=0;

        while(queue.length){
            const current=queue.shift();
            size++;
            for(const edge of graph[current]){
                if(!visited.has(edge.to)){
                    visited.add(edge.to);
                    queue.push(edge.to);
                }
            }
        }

        sizes.push(size);
    }

    sizes.sort((a,b)=>b-a);
    return sizes;
};
