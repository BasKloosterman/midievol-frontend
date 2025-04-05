import { FC, useContext, useMemo } from "react";
import { calcMelodyLength } from "../pages/Details";
import { ConfigContext, MelodyContext } from "../state/context";

interface TimeDisplayProps {
    curQNote: number;
    fontSize?: number;
    color?: string;
}

export const TimeDisplay: FC<TimeDisplayProps> = ({curQNote, fontSize=24, color='black'}) => {
    const {state: melodyState} = useContext(MelodyContext)!
    const {state: configState} = useContext(ConfigContext)!
    const bars = useMemo(() => {
        return (calcMelodyLength(melodyState.melody?.notes || []) / 4).toFixed(1)
    }, [melodyState.melody])

    return <div style={{display: 'flex', alignItems: 'center'}}>
        <span style={{fontSize, fontWeight: 'bold',color}}>count {(curQNote % 4) + 1}</span>
        <span style={{fontSize,color, marginLeft: 10, marginRight: 10}}> | </span>
        <span style={{fontSize,color, fontWeight: 'bold'}}>bar  {Math.ceil((curQNote + 1) / 4)}</span>
        <span style={{color, marginLeft: 15}}> (total: {bars} bars of 4/4, {(calcMelodyLength(melodyState.melody?.notes || []) / (configState.bpm / 60)).toFixed(2)}s)</span>
    </div>
}