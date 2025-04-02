import { FC, useContext, useState } from "react"
import { views } from "../App"
import { PlayerRef } from "../components/Player";
import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import { ButtonGroup, IconButton, Slider, Typography } from "@mui/material";
import { ModFunc } from "../lib/srv";
import { frames, Note, numToNote } from "../lib/note";
import Visualization, { AnimNote } from "../components/Visualisation";
import { Knob } from "../components/Knob";
import { mapTo01Linear } from "@dsp-ts/math";
import { range } from "lodash";
import { colorMap } from "../lib/color";
import { LearnIconButton } from "../components/LearnButton";
import { ConfigContext } from "../state/context";
import { setNumVoices, setVoiceSplitMax, setVoiceSplitMin } from "../state/reducer/config";


interface MainProps {
    changeView: (view: views) => void;
    player: PlayerRef | null;
    melody?: Note[];
    notes: AnimNote[];
    setNotes: (notes: AnimNote[]) => void;
    setControllerLearn: (key: string) => void;
    controllerLearn?: string;
    trigger: number;
}

const Main: FC<MainProps> = ({
    changeView, player, 
    setControllerLearn, controllerLearn
}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    return (
        <div>
            <div style={{display: 'flex'}}>
                <div style={{display: 'flex', alignItems: 'center', marginRight: 25}}>
                <ButtonGroup
                style={{backgroundColor: "white"}}
                    variant="contained"
                    aria-label="outlined primary button group"
                >
                    <LearnIconButton
                        style={{backgroundColor: controllerLearn === 'changeView' ? 'red' : undefined}}
                        onLongPress={() => setControllerLearn('changeView')}
                        color={'default'}
                        onClick={() => controllerLearn === 'changeView' || changeView(views.details)}
                    >
                        <SettingsIcon />
                    </LearnIconButton>
                    <LearnIconButton
                        style={{backgroundColor: controllerLearn === 'play' ? 'red' : undefined}}
                        onLongPress={() => setControllerLearn('play')}
                        color={
                            player?.isPlaying()
                            ? 'primary'
                            : 'default'
                        }
                        onClick={() => {
                            if (controllerLearn === 'play') {
                                return
                            }
                            player?.stop();
                            player?.play();
                        }}
                    >
                        <PlayArrow />
                    </LearnIconButton>
                    <LearnIconButton
                        style={{backgroundColor: controllerLearn === 'stop' ? 'red' : undefined}}
                        onLongPress={() => setControllerLearn('stop')}
                        onClick={() => {
                            if (controllerLearn === 'stop') {
                                return
                            }
                            
                            player?.stop();
                        }}
                    >
                        <StopIcon />
                    </LearnIconButton>

                </ButtonGroup>
                </div>
                <div style={{display: 'flex', gap: 35}}>
                    <Knob
                        color={controllerLearn === 'voices' ? 'red' : undefined}
                        textColor="white"
                        label='voices'
                        id='voices'
                        value={configState.numVoices}
                        setValue={(v) => configDispatch(setNumVoices(v))}
                        min={1}
                        max={5}
                        displayValue={v => Math.round(v).toFixed(0)}
                        mapToAngle={v => mapTo01Linear(Math.round(v), 1, 5)}
                        onLongPress={() => setControllerLearn('voices')}
                    />
                    {range(Math.round(configState.numVoices)).map((voice) => {
                        const clKBaseKeyMin = `voiceSplits.${voice}.min`
                        const clKBaseKeyMax = `voiceSplits.${voice}.max`
                        return <div key={voice}>
                                <div style={{color: 'white', textAlign: 'center', position: 'relative'}}>
                                    <div style={{
                                        width: '100%',
                                        height: 5,
                                        position: 'absolute',
                                        top: 10,
                                        borderTop: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white'}}></div>
                                    <div style={{
                                        background: 'black',
                                        zIndex: 10,
                                        position: 'relative',
                                        display: 'inline-block',
                                        padding: '0 5px'
                                    }}>
                                        voice {voice + 1}
                                    </div>
                                </div>
                                <div style={{display: 'flex', gap: 10}}>
                                    <Knob
                                        textColor="white"
                                        color={controllerLearn === clKBaseKeyMin ? 'red' : `rgba(${colorMap[voice]}, 1)`}
                                        label='min'
                                        id={`voice-${voice+1}-min`}
                                        value={configState.voiceSplits[voice][0]}
                                        setValue={(value) => {
                                            configDispatch(setVoiceSplitMin({index: voice, value}))
                                            // setVoiceSplits([...(voiceSplits.slice(0,voice)), [val, voiceSplits[voice][1]], ...(voiceSplits.slice(voice+1))])
                                        }}
                                        min={0}
                                        max={84}
                                        displayValue={v => numToNote(Math.round(v))}
                                        mapToAngle={v => mapTo01Linear(v, 1, 84)}
                                        onLongPress={() => setControllerLearn(clKBaseKeyMin)}
                                    />
                                    <Knob
                                        textColor="white"
                                        color={controllerLearn === clKBaseKeyMax ? 'red' : `rgba(${colorMap[voice]}, 1)`}
                                        label='max'
                                        id={`voice-${voice+1}-max`}
                                        value={configState.voiceSplits[voice][1]}
                                        setValue={(value) => {
                                            configDispatch(setVoiceSplitMax({index: voice, value}))
                                            // setVoiceSplits([...(voiceSplits.slice(0,voice)), [voiceSplits[voice][0], val], ...(voiceSplits.slice(voice+1))])
                                        }}
                                        min={0}
                                        max={84}
                                        displayValue={v => numToNote(Math.round(v))}
                                        mapToAngle={v => mapTo01Linear(v, 1, 84)}
                                        onLongPress={() => setControllerLearn(clKBaseKeyMax)}
                                    />      
                            </div>
                        </div>
                    })}
                </div>
            </div>
            <Visualization output={configState.output}/>
        </div>
    )
}
export default Main