import { FC, useContext, useState } from "react"
import { views } from "../App"
import { PlayerRef } from "../components/Player";
import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import { ButtonGroup, CircularProgress, IconButton, Slider, Typography } from "@mui/material";
import { ModFunc } from "../lib/srv";
import { frames, Note, numToNote } from "../lib/note";
import Visualization, { AnimNote } from "../components/Visualisation";
import { Knob } from "../components/Knob";
import { mapTo01Linear } from "@dsp-ts/math";
import { range } from "lodash";
import { colorMap } from "../lib/color";
import { LearnIconButton } from "../components/LearnButton";
import { ConfigContext, MelodyContext } from "../state/context";
import { setVoiceSplitMax, setVoiceSplitMin } from "../state/reducer/config";
import { GlobalVoiceControl } from "../components/GlobalVoiceControl";
import { TimeDisplay } from "../components/TimeDisplay";



interface MainProps {
    changeView: (view: views) => void;
    player: PlayerRef | null;
    melody?: Note[];
    notes: AnimNote[];
    setNotes: (notes: AnimNote[]) => void;
    setControllerLearn: (key: string) => void;
    controllerLearn?: string;
    trigger: number;
    curQNote: number;
    loading: boolean;
}

const Main: FC<MainProps> = ({
    changeView, player, curQNote, loading,
    setControllerLearn, controllerLearn
}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    const {state: melodyState, dispatch: melodyDispatch} = useContext(MelodyContext)!
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
                <div style={{display: 'flex', gap: 35, alignItems: 'center'}}>
                    <GlobalVoiceControl controllerLearn={controllerLearn} setControllerLearn={setControllerLearn}/>
                    <TimeDisplay curQNote={curQNote} color='white'/>
                    {loading ? <CircularProgress size={30} color="primary"/> : null}
                </div>
            </div>
            <table style={{position: 'absolute', top: 150, left: 10, padding: 25, backgroundColor: 'rgba(255,255,255,0.5)'}}>
                <tbody>
                    <tr>
                        <td>Score</td><td>{(melodyState.melody?.score || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td></td>
                    </tr>
            {configState.modFuncs.map((x, idx) => {
                let score = melodyState.melody?.scores_per_func[idx] != undefined ? melodyState.melody?.scores_per_func[idx] : null

                if (x.weight === 0) {
                    score = null
                }
                return <tr key={idx}><td>{x.name.replace('score', '')}</td> <td>{score ? score?.toFixed(2): '-'}</td></tr>  
            })}
                </tbody>
            </table>
            <Visualization output={configState.visualizationOutput || configState.output}/>
        </div>
    )
}
export default Main