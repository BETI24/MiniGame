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

export const countSolutions = (puzzle,limit=2) => {
    const board=boardFromGivens(puzzle.size,puzzle.givens);
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
