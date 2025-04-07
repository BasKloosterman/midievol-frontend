import { Slider, Typography } from "@mui/material";
import { ModFunc } from "../lib/srv";
import { FC } from "react";
import { Knob } from "./Knob";
import { mapTo01Linear } from "@dsp-ts/math";

export interface ModFuncProps {
    idx: number;
    func: ModFunc;
    score: number | null;
    update: ({idx, weight}: {idx: number, weight: number}) => void;
    onLongPress: () => void;
    color?: string;
}

const ModFuncRegulator: FC<ModFuncProps> = ({func, update, idx, score, onLongPress, color}) => {
    const {name, weight} = func
    return (
        <div style={{minWidth: '335px', width: '335px'}}>
            <Knob
                color={color || "#00b5ff"}
                textColor="black"
                value={weight}
                setValue={(n) => {
                    update({idx, weight: n}) 
                }}
                min={-10} max={10} label={`${name}: ${score === null ? '-' : score.toFixed(3)}`} id={name}
                displayValue={x => x.toFixed(2)}
                mapToAngle={v => mapTo01Linear(v, -10, 10)}
                onLongPress={onLongPress}
            />
            {/* <Slider
                aria-label={name}
                defaultValue={30}
                value={weight}
                step={1}
                marks
                min={-10}
                max={10}
                valueLabelDisplay="on"
                onChange={(e, newValue) => {
                    // console.log(newValue)
                    update({idx, weight: Array.isArray(newValue) ? newValue[0] : newValue}) 
                }}
            /> */}
        </div>
    )
}

export default ModFuncRegulator