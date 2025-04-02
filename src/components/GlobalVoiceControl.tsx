import { mapTo01Linear } from "@dsp-ts/math";
import { FC, useContext } from "react";
import { colorMap } from "../lib/color";
import { numToNote } from "../lib/note";
import { ConfigContext } from "../state/context";
import { setVoiceSplitMax, setVoiceSplitMin } from "../state/reducer";
import { Knob } from "./Knob";


interface GlobalVoiceControlProps {
    setControllerLearn: (key: string) => void;
    controllerLearn?: string;
    light?: boolean;
}

export const GlobalVoiceControl : FC<GlobalVoiceControlProps> = ({setControllerLearn, controllerLearn, light=false}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
     const clKBaseKeyMin = `voices.min`
    const clKBaseKeyMax = `voices.max`
    return <div>
        <div style={{color: 'white', textAlign: 'center', position: 'relative'}}>
            <div style={{
                width: '100%',
                height: 5,
                position: 'absolute',
                top: 10,
                borderTop: `1px solid ${light? 'black' : 'white'}`, borderLeft: `1px solid ${light? 'black' : 'white'}`, borderRight: `1px solid ${light? 'black' : 'white'}`}}></div>
            <div style={{
                background: light ? 'white' : 'black',
                zIndex: 10,
                position: 'relative',
                display: 'inline-block',
                padding: '0 5px',
                color: light ? 'black': 'white'
            }}>
                Voices
            </div>
        </div>
        <div style={{display: 'flex', gap: 10}}>
            <Knob
                textColor={light ? "black" : "white"}
                color={controllerLearn === clKBaseKeyMin ? 'red' : `rgba(${colorMap[0]}, 1)`}
                label='max bass'
                id={`voice-1-min`}
                value={configState.voiceSplits[1][0]}
                setValue={(value) => {
                    configDispatch(setVoiceSplitMax({index: 0, value: value -1}))
                    configDispatch(setVoiceSplitMin({index: 1, value}))

                    if (configState.voiceSplits[1][1] <= value) {
                        configDispatch(setVoiceSplitMax({index: 1, value: value + 1}))
                        configDispatch(setVoiceSplitMin({index: 2, value: value + 2}))
                    }
                    
                    // setVoiceSplits([...(voiceSplits.slice(0,voice)), [val, voiceSplits[1][1]], ...(voiceSplits.slice(voice+1))])
                }}
                min={1}
                max={83}
                displayValue={v => numToNote(Math.round(v))}
                mapToAngle={v => mapTo01Linear(v, 1, 84)}
                onLongPress={() => setControllerLearn(clKBaseKeyMin)}
            />
            <Knob
                textColor={light ? "black" : "white"}
                color={controllerLearn === clKBaseKeyMax ? 'red' : `rgba(${colorMap[1]}, 1)`}
                label='min melody'
                id={`voice-1-max`}
                value={configState.voiceSplits[2][0]}
                setValue={(value) => {
                    configDispatch(setVoiceSplitMax({index: 1, value: value -1}))
                    configDispatch(setVoiceSplitMin({index: 2, value}))

                    if (configState.voiceSplits[0][1] >= value) {
                        configDispatch(setVoiceSplitMin({index: 1, value: value - 2}))
                        configDispatch(setVoiceSplitMax({index: 0, value: value - 3}))
                    }
                    // setVoiceSplits([...(voiceSplits.slice(0,voice)), [voiceSplits[1][0], val], ...(voiceSplits.slice(voice+1))])
                }}
                min={2}
                max={84}
                displayValue={v => numToNote(Math.round(v))}
                mapToAngle={v => mapTo01Linear(v, 1, 84)}
                onLongPress={() => setControllerLearn(clKBaseKeyMax)}
            />   
        </div>   
    </div>
}