import {
    EMPTY,
    CIRCLE,
    SQUARE,
    getValidLinePatterns,
    boardToGivens,
    cloneBoard
} from './QuickThinkerRules.js';

import {
    solveLogically,
    countSolutions
} from './QuickThinkerSolver.js';

export const DIFFICULTIES = {
    easy: {
        id:'easy',
        label:'Easy',
        maxRank:1,
        minRank:1,
        relationDensity:.52,
        chainBias:.16,
        minRelationFactor:.48,
        desiredScore:[14,52]
    },
    normal: {
        id:'normal',
        label:'Normal',
        maxRank:2,
        minRank:2,
        relationDensity:.72,
        chainBias:.38,
        minRelationFactor:.54,
        desiredScore:[35,105]
    },
    hard: {
        id:'hard',
        label:'Hard',
        maxRank:3,
        minRank:3,
        relationDensity:.92,
        chainBias:.68,
        minRelationFactor:.60,
        desiredScore:[60,165]
    },
    expert: {
        id:'expert',
        label:'Expert',
        maxRank:4,
        minRank:4,
        relationDensity:1.08,
        chainBias:.82,
        minRelationFactor:.64,
        desiredScore:[85,240]
    }
};

export const SUPPORTED_SIZES = [6,8,10];

const hashSeed = input => {
    const text=String(input);
    let h=2166136261>>>0;

    for(let i=0;i<text.length;i++){
        h^=text.charCodeAt(i);
        h=Math.imul(h,16777619);
    }

    return h>>>0;
};

const mulberry32 = seed => () => {
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
};

const makeRng = seed => {
    const random=mulberry32(hashSeed(seed));

    return {
        random,
        int:(min,max)=>Math.floor(min+random()*(max-min+1)),
        pick:array=>array[Math.floor(random()*array.length)],
        shuffle:array=>{
            const copy=array.slice();
            for(let i=copy.length-1;i>0;i--){
                const j=Math.floor(random()*(i+1));
                [copy[i],copy[j]]=[copy[j],copy[i]];
            }
            return copy;
        }
    };
};

const generateSolvedBoard = (size,rng) => {
    const patterns=getValidLinePatterns(size);
    const board=[];
    const columnCircles=Array(size).fill(0);
    const columnSquares=Array(size).fill(0);
    const half=size/2;

    const rowFits = pattern => {
        for(let col=0;col<size;col++){
            const value=pattern[col];

            if(value===CIRCLE && columnCircles[col]>=half){
                return false;
            }

            if(value===SQUARE && columnSquares[col]>=half){
                return false;
            }

            const row=board.length;
            if(row>=2){
                const a=board[row-1][col];
                const b=board[row-2][col];
                if(a===b && b===value){
                    return false;
                }
            }
        }

        return true;
    };

    const place = pattern => {
        board.push(pattern.slice());
        for(let col=0;col<size;col++){
            if(pattern[col]===CIRCLE) columnCircles[col]++;
            else columnSquares[col]++;
        }
    };

    const remove = pattern => {
        board.pop();
        for(let col=0;col<size;col++){
            if(pattern[col]===CIRCLE) columnCircles[col]--;
            else columnSquares[col]--;
        }
    };

    const search = () => {
        if(board.length===size){
            return true;
        }

        const candidates=rng.shuffle(patterns);

        for(const pattern of candidates){
            if(!rowFits(pattern)) continue;

            place(pattern);
            if(search()) return true;
            remove(pattern);
        }

        return false;
    };

    if(!search()){
        throw new Error(`Could not generate a solved ${size}x${size} board.`);
    }

    return board.map(row=>row.slice());
};

const relationKey = relation => {
    const a=`${relation.a[0]},${relation.a[1]}`;
    const b=`${relation.b[0]},${relation.b[1]}`;
    return a<b ? `${a}|${b}` : `${b}|${a}`;
};

const allAdjacentRelations = solution => {
    const size=solution.length;
    const result=[];

    for(let row=0;row<size;row++){
        for(let col=0;col<size;col++){
            if(col+1<size){
                result.push({
                    a:[row,col],
                    b:[row,col+1],
                    type:solution[row][col]===solution[row][col+1]
                        ?'same'
                        :'different'
                });
            }

            if(row+1<size){
                result.push({
                    a:[row,col],
                    b:[row+1,col],
                    type:solution[row][col]===solution[row+1][col]
                        ?'same'
                        :'different'
                });
            }
        }
    }

    return result;
};

const selectRelations = (solution,profile,rng) => {
    const size=solution.length;
    const all=allAdjacentRelations(solution);
    const target=Math.max(
        3,
        Math.round(size*profile.relationDensity)
    );

    const chosen=[];
    const used=new Set();
    const chosenKeys=new Set();

    while(chosen.length<target && chosen.length<all.length){
        let pool=all.filter(rel=>!chosenKeys.has(relationKey(rel)));

        if(used.size>0 && rng.random()<profile.chainBias){
            const chained=pool.filter(rel=>
                used.has(`${rel.a[0]},${rel.a[1]}`) ||
                used.has(`${rel.b[0]},${rel.b[1]}`)
            );

            if(chained.length){
                pool=chained;
            }
        }

        const relation=rng.pick(pool);
        chosen.push(relation);
        chosenKeys.add(relationKey(relation));
        used.add(`${relation.a[0]},${relation.a[1]}`);
        used.add(`${relation.b[0]},${relation.b[1]}`);
    }

    return chosen;
};

const puzzleFromMask = (solution,mask,relations,meta={}) => {
    const board=solution.map((row,r)=>
        row.map((value,c)=>mask[r][c] ? value : EMPTY)
    );

    return {
        name:meta.name??'Random Puzzle',
        size:solution.length,
        givens:boardToGivens(board),
        relations:relations.map(rel=>({
            a:rel.a.slice(),
            b:rel.b.slice(),
            type:rel.type
        })),
        solution:solution.map(row=>row.slice()),
        seed:meta.seed,
        difficulty:meta.difficulty
    };
};

const makeFullMask = size =>
    Array.from({length:size},()=>Array(size).fill(true));

const clueCount = mask =>
    mask.reduce(
        (sum,row)=>sum+row.filter(Boolean).length,
        0
    );

const pruneGivens = (solution,relations,profile,rng,seed,difficulty) => {
    const size=solution.length;
    const mask=makeFullMask(size);
    const positions=[];

    for(let row=0;row<size;row++){
        for(let col=0;col<size;col++){
            positions.push([row,col]);
        }
    }

    const minimumGivens=Math.max(
        2,
        Math.floor(size*size*(difficulty==='easy'?.20:.10))
    );

    let changed=true;
    let pass=0;

    while(changed && pass<4){
        changed=false;
        pass++;

        for(const [row,col] of rng.shuffle(positions)){
            if(!mask[row][col]) continue;
            if(clueCount(mask)<=minimumGivens) break;

            mask[row][col]=false;

            const candidate=puzzleFromMask(
                solution,
                mask,
                relations,
                {seed,difficulty}
            );

            const result=solveLogically(candidate,{
                maxRank:profile.maxRank,
                recordTrace:false
            });

            if(result.status==='solved'){
                changed=true;
            }else{
                mask[row][col]=true;
            }
        }
    }

    return mask;
};

const pruneRelations = (solution,mask,relations,profile,rng,seed,difficulty) => {
    let current=relations.slice();
    const minRelations=Math.max(
        2,
        Math.floor(solution.length*profile.minRelationFactor)
    );

    for(const relation of rng.shuffle(current)){
        if(current.length<=minRelations) break;

        const key=relationKey(relation);
        const candidateRelations=current.filter(rel=>relationKey(rel)!==key);
        const candidate=puzzleFromMask(
            solution,
            mask,
            candidateRelations,
            {seed,difficulty}
        );

        const result=solveLogically(candidate,{
            maxRank:profile.maxRank,
            recordTrace:false
        });

        if(result.status==='solved'){
            current=candidateRelations;
        }
    }

    return current;
};

const hardComplexityThreshold = size => ({
    6:{score:74,line:12},
    8:{score:108,line:16},
    10:{score:150,line:19}
}[size]);

const difficultySatisfied = (difficulty,puzzle,stats,lowerSolved) => {
    if(difficulty==='easy'){
        return stats.maxRank<=1;
    }

    if(difficulty==='normal'){
        if(stats.maxRank!==2 || lowerSolved){
            return false;
        }

        const hard=hardComplexityThreshold(puzzle.size);
        return !(
            stats.score>=hard.score &&
            stats.counts.line>=hard.line
        );
    }

    if(difficulty==='hard'){
        if(stats.maxRank>=3){
            return true;
        }

        const hard=hardComplexityThreshold(puzzle.size);
        return (
            stats.maxRank===2 &&
            stats.score>=hard.score &&
            stats.counts.line>=hard.line
        );
    }

    if(difficulty==='expert'){
        return stats.maxRank>=4 && !lowerSolved;
    }

    return false;
};

const evaluateCandidate = (puzzle,profile) => {
    const target=solveLogically(puzzle,{
        maxRank:profile.maxRank,
        recordTrace:true
    });

    if(target.status!=='solved'){
        return {
            valid:false,
            reason:'target-solver-stalled',
            quality:-Infinity
        };
    }

    const lowerRank=profile.minRank-1;
    const lowerSolved=lowerRank<=0
        ?false
        :solveLogically(puzzle,{
            maxRank:lowerRank,
            recordTrace:false
        }).status==='solved';

    const [minScore,maxScore]=profile.desiredScore;
    const score=target.stats.score;
    const center=(minScore+maxScore)/2;
    const inBand=score>=minScore && score<=maxScore;
    const satisfiesDifficulty=difficultySatisfied(
        puzzle.difficulty,
        puzzle,
        target.stats,
        lowerSolved
    );

    let quality=0;
    quality+=satisfiesDifficulty ? 20000 : 0;
    quality+=inBand ? 1500 : 0;
    quality-=Math.abs(score-center)*4;
    quality-=puzzle.givens.length*.35;
    quality-=puzzle.relations.length*.12;

    return {
        valid:true,
        satisfiesDifficulty,
        inBand,
        lowerSolved,
        score,
        stats:target.stats,
        trace:target.trace,
        quality
    };
};

const deriveSeed = () =>
    `${Date.now().toString(36)}-${Math.floor(Math.random()*0xFFFFFF).toString(36)}`;

export const generatePuzzle = ({
    size=6,
    difficulty='normal',
    seed=null,
    maxAttempts=null
}={}) => {
    if(!SUPPORTED_SIZES.includes(size)){
        throw new Error(`QuickThinker supports ${SUPPORTED_SIZES.join(', ')} board sizes.`);
    }

    const profile=DIFFICULTIES[difficulty];
    if(!profile){
        throw new Error(`Unknown QuickThinker difficulty: ${difficulty}`);
    }

    const baseSeed=seed??deriveSeed();
    const attempts=maxAttempts??(
        size===6
            ?(
                difficulty==='hard'
                    ?40
                    :difficulty==='expert'
                        ?34
                        :difficulty==='normal'
                            ?24
                            :16
            )
            :size===8
                ?(
                    difficulty==='hard'
                        ?34
                        :difficulty==='expert'
                            ?32
                            :difficulty==='normal'
                                ?24
                                :16
                )
                :(
                    difficulty==='hard'
                        ?26
                        :difficulty==='expert'
                            ?26
                            :difficulty==='normal'
                                ?20
                                :14
                )
    );

    let best=null;

    for(let attempt=0;attempt<attempts;attempt++){
        const attemptSeed=`${baseSeed}:${attempt}`;
        const rng=makeRng(attemptSeed);
        const solution=generateSolvedBoard(size,rng);
        const initialRelations=selectRelations(solution,profile,rng);

        const mask=pruneGivens(
            solution,
            initialRelations,
            profile,
            rng,
            attemptSeed,
            difficulty
        );

        const relations=pruneRelations(
            solution,
            mask,
            initialRelations,
            profile,
            rng,
            attemptSeed,
            difficulty
        );

        const puzzle=puzzleFromMask(
            solution,
            mask,
            relations,
            {
                name:`${profile.label} ${size}×${size}`,
                seed:attemptSeed,
                difficulty
            }
        );

        const evaluation=evaluateCandidate(puzzle,profile);

        if(!evaluation.valid){
            continue;
        }

        puzzle.meta={
            requestedDifficulty:difficulty,
            requiredRank:evaluation.stats.maxRank,
            logicScore:Number(evaluation.score.toFixed(2)),
            techniqueCounts:{...evaluation.stats.counts},
            givens:puzzle.givens.length,
            relations:puzzle.relations.length,
            generatorAttempt:attempt+1,
            logicallySolved:true,
            unique:null
        };

        const candidate={puzzle,evaluation};

        if(!best || evaluation.quality>best.evaluation.quality){
            best=candidate;
        }

        if(
            evaluation.satisfiesDifficulty &&
            (
                evaluation.inBand ||
                difficulty==='hard' ||
                difficulty==='expert'
            )
        ){
            best=candidate;
            break;
        }
    }

    if(!best){
        throw new Error('Could not generate a logically solvable QuickThinker puzzle.');
    }

    if(!best.evaluation.satisfiesDifficulty){
        throw new Error(
            `Could not generate a puzzle matching the requested ${difficulty} logic profile.`
        );
    }

    // The logical trace itself already proves all cells are forced. The exact
    // solution counter is kept as an independent safety verification.
    const unique=countSolutions(best.puzzle,2)===1;

    if(!unique){
        throw new Error('Generated puzzle failed the uniqueness verification.');
    }

    best.puzzle.meta.unique=true;
    best.puzzle.meta.actualDifficulty=classifyDifficulty(
        best.puzzle,
        best.evaluation.stats
    );

    return best.puzzle;
};

export const classifyDifficulty = (puzzle,stats) => {
    if(stats.maxRank>=4){
        return 'expert';
    }

    if(stats.maxRank>=3){
        return 'hard';
    }

    if(stats.maxRank===2){
        const hard=hardComplexityThreshold(puzzle.size);
        if(
            stats.score>=hard.score &&
            stats.counts.line>=hard.line
        ){
            return 'hard';
        }
        return 'normal';
    }

    return 'easy';
};

export const rankToDifficulty = (rank,score=0) => {
    if(rank>=4) return 'expert';
    if(rank>=3) return 'hard';
    if(rank>=2) return 'normal';
    return 'easy';
};

export const generatorDebugSummary = puzzle => ({
    seed:puzzle.seed,
    size:puzzle.size,
    difficulty:puzzle.difficulty,
    givens:puzzle.givens.length,
    relations:puzzle.relations.length,
    meta:{...puzzle.meta}
});
