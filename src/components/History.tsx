import { FC, useContext, useLayoutEffect, useState } from "react"
import { ConfigContext, MelodyContext } from "../state/context"
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';



const History : FC = () => {
    const {state: {ringBuf}} = useContext(MelodyContext)!
    const {state: configState} = useContext(ConfigContext)!
    const history = ringBuf.getAll()
    const [width, setWidth] = useState(window.innerWidth - 50)

    const usedFuncIndexes = configState.modFuncs
        .map((x, idx) => ({idx, weight: x.weight}))
        .filter(x => Math.abs(Math.round(x.weight)) > 0)
        .map(x => x.idx)


    const graphData = history.map((x, idx) => {
        return x.scores_per_func.filter((_, funcIdx) => usedFuncIndexes.includes(funcIdx)).map((score, scoreIdx) => ({
            func: configState.modFuncs[usedFuncIndexes[scoreIdx]].name,
            time: idx + 1,
            score
        }))
    }).reduce((acc, cur) => {
        cur.forEach((item, idx) => {
            if (!acc[idx]) {
                acc[idx] = []
            }

            acc[idx].push(item)
        })

        return acc
    }, [] as {time: number; score: number; func: string}[][])

    useLayoutEffect(() => {
        const updateWidth = () => {
            setWidth(window.innerWidth - 50)
        }

        window.addEventListener('resize', updateWidth)

        return () => window.removeEventListener('resize', updateWidth)
    })

    console.log(graphData)

    return (<div style={{marginTop: 25, paddingTop: 25}}>
        {graphData.map(funcData => {
            return <div key={funcData[0].func}>
                <label style={{display: 'block', margin: '15px', width: '100%', textAlign: 'center'}}>{funcData[0].func}</label>
                <LineChart width={width} height={200} data={funcData}>
                    <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 4 }}/>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis label='iteration' dataKey="time" />
                    <YAxis/>
                    <Tooltip/>
                </LineChart>
            </div>
        })}
    </div>)
}

export default History