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
import { setVoiceSplitMax, setVoiceSplitMin } from "../state/reducer/config";
import { GlobalVoiceControl } from "../components/GlobalVoiceControl";



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
                    <GlobalVoiceControl controllerLearn={controllerLearn} setControllerLearn={setControllerLearn}/>
                </div>
            </div>
            <Visualization output={configState.visualizationOutput || configState.output}/>
        </div>
    )
}
export default Main