import { FC, useContext, useLayoutEffect, useState } from "react";
import { ConfigContext, MelodyContext } from "../state/context";
import { max, min, range } from "lodash";
import StatCard, { FinalCard } from "./StatCard";
import { colors, Paper, Typography } from "@mui/material";
import { ContactlessOutlined } from "@mui/icons-material";
import { parallelEvos } from "../App";



const History : FC<{setMelody: (idx: number) => void}> = ({setMelody}) => {
    const {state: {ringBuf, curMelodyIdx}} = useContext(MelodyContext)!
    const {state: configState} = useContext(ConfigContext)!
    const [width, setWidth] = useState(window.innerWidth - 50)

    const usedFuncIndexes = configState.modFuncs
        .map((x, idx) => ({idx, weight: x.weight}))
        .filter(x => Math.abs(Math.round(x.weight)) > 0)
        .map(x => x.idx)

    const stats = ringBuf.map((buf, idx) => {
        let itterations = buf.getAll().slice(-5)

        itterations = itterations.filter(Boolean).map(m => ({
            ...m,
            scores_per_func: m.scores_per_func.filter((_, funcIdx) => usedFuncIndexes.includes(funcIdx))
        }))

        const x = range(usedFuncIndexes.length)
            .map(
                funcIdx => itterations.map(itt => itt.scores_per_func[funcIdx])
            )

        return x
    }).reduce((acc, cur) => {
        cur.forEach((item, idx) => {
            if (!acc[idx]) {
                acc[idx] = []
            }

            acc[idx].push(item as any)
        })

        return acc
    }, [] as number[][][])
    .map((x, funcIdx) => {
        const fn = configState.modFuncs[usedFuncIndexes[funcIdx]]
        // normalize
        const needNormalize = !fn.hasNormalizedScore

        if (!needNormalize) {
            return {abs: x, norm: x}
        }

        const flattened = x.flat()

        const _min  = fn.scoreRange[0] != null ? fn.scoreRange[0] : min(flattened)
        const _max  = fn.scoreRange[1] != null ? fn.scoreRange[1] : max(flattened)

        return {
            abs: x,
            norm: x.map(
                lst => lst.map(
                    n => {
                        if (fn.scoreRange[1] != null && fn.scoreRange[1] === n) {
                            return 1
                        }

                        if (fn.scoreRange[0] != null && fn.scoreRange[0] === n) {
                            return -1
                        }
                        return normalize(n, _min, _max)! * 2 -1 // -1..1
                    }
                )
            )
        }
    })

    useLayoutEffect(() => {
        const updateWidth = () => {
            setWidth(window.innerWidth - 50)
        }

        window.addEventListener('resize', updateWidth)

        return () => window.removeEventListener('resize', updateWidth)
    })

    return (<div style={{marginTop: 25, padding: 25}}>
        <div style={{display: 'flex', flexDirection: 'row', marginBottom: 25, gap: 10}}>
            <Paper square={false} sx={
                    { padding: 2, width: 50, whiteSpace: 'nowrap', overflow: 'hidden',textOverflow: 'ellipsis'}
                } elevation={3}>
            </Paper>
            <Paper square={false} sx={
                    { padding: 2, width: 95, whiteSpace: 'nowrap', overflow: 'hidden',textOverflow: 'ellipsis'}
                } elevation={3}>
            </Paper>
        {
            usedFuncIndexes.map((x, idx) => {
                return <Paper square={false} key={idx} sx={
                    { padding: 2, width: 135, whiteSpace: 'nowrap', overflow: 'hidden',textOverflow: 'ellipsis'}
                } elevation={3}>
                        <Typography sx={
                    { whiteSpace: 'nowrap', overflow: 'hidden',textOverflow: 'ellipsis'}
                }>
                            {configState.modFuncs[x].name.replace('score', '')}
                        </Typography>
                </Paper>
            })
        }
        </div>
        {
            range(parallelEvos).map((melodyIdx) => {
                const avg = stats.reduce((acc, cur, idx) => {
                    const modFunc = configState.modFuncs[usedFuncIndexes[idx]]
                    let score = (cur.norm[melodyIdx][cur.norm[melodyIdx].length - 1]! + 1) / 2

                    return acc + score    
                }, 0) / usedFuncIndexes.length
            
                return <div style={{display: 'flex', flexDirection: 'row', marginBottom: 25, gap: 10}} key={melodyIdx}>
                    <Paper onClick={() => setMelody(melodyIdx)} square={false} sx={
                        { padding: 2, width: 50, whiteSpace: 'nowrap', overflow: 'hidden',textOverflow: 'ellipsis', backgroundColor: curMelodyIdx == melodyIdx ? colors.blue[300] : colors.grey.A100}
                        } elevation={3}>
                            <Typography fontWeight={'bold'} fontSize={30}>{melodyIdx + 1}</Typography>
                    </Paper>
                    <FinalCard selected={curMelodyIdx == melodyIdx} score={avg}/>
                    {stats.map((stat, idx) => {
                            const modFunc = configState.modFuncs[usedFuncIndexes[idx]]
                            
                            const norm = stat.norm[melodyIdx]
                            const abs = stat.abs[melodyIdx]

                            const weightSign = modFunc.weight >= 0 ? 1 : -1
                            const isNormalized = modFunc.hasNormalizedScore;

                            let trend = (abs[abs.length - 1] - abs[0]);
                            const trendSign = trend >= 0 ? 1 : -1;

                            let score = norm[norm.length - 1]!

                            if (trend != 0) {
                                trend = (Math.abs(trend) / Math.abs(abs[0])) * 100 * trendSign * weightSign;
                            }

                            
                            score = (score + 1) / 2

                            return <StatCard key={idx} selected={curMelodyIdx == melodyIdx} trend={trend} score={score}/>
                        })
                    }
                    
               </div>
            })
               
        }
    </div>)
}

export default History

function normalize(n: number, _min: number | undefined, _max: number | undefined): number | undefined {
    if (_min === undefined || _max === undefined) return undefined;
    if (_max === _min) return 0; // Avoid division by zero; you could also throw an error here
  
    return (n - _min) / (_max - _min);
  }
