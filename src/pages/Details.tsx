import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';

import { Stack, ButtonGroup, IconButton, TextField, Button, Paper, Checkbox, FormControlLabel } from "@mui/material";
import { FC, useContext } from "react";
import { views } from "../App";
import { frames, Note, numToNote } from "../lib/note";
import { Melody, ModFunc } from "../lib/srv";
import { PlayerRef } from '../components/Player';
import Config, { ConfigProps } from '../components/Config';
import ModFuncRegulator, {ModFuncProps} from '../components/Modfunc';
import { Knob } from '../components/Knob';
import { mapTo01Linear } from '@dsp-ts/math';
import { LearnIconButton } from '../components/LearnButton';
import { ConfigContext, MelodyContext } from '../state/context';
import { setAutoSetVoiceSplit, setBpm, setChildren, setControls, setMelodyLen, setState, setXGens, updateModFunc } from '../state/reducer/config';
import { Download, RestartAlt, Save, Upload } from '@mui/icons-material';
import FileImportButton, { downloadJSON } from '../lib/file';
import { Controls, emptyControls } from '../lib/controller';
import { ConfigState, initialConfigState, MelodyState } from '../state/state';
import { resetBuffer, setMelody, setNextMelody } from '../state/reducer/melody';
import History from '../components/History';
import { notes } from '../lib/keys';
import { AnyAction } from '@reduxjs/toolkit';

export const calcMelodyLength = (melody: Note[]) => {
    if (!melody.length) {
        return 1;
    }

    const latestNote = Math.max(...melody.map(n => n.position + n.length))
    let loopRange_ = Math.ceil(latestNote / (1 * frames));
    if (latestNote % (1 * frames) === 0) {
        loopRange_ += 1;
    }

    return loopRange_;
};

interface DetailsProps extends ConfigProps {
    changeView : (view: views) => void;
    playerRef: React.RefObject<PlayerRef>;
    reset: () => void;
    setControllerLearn: (key: string) => void;
    controllerLearn?: string;
    trigger: number;
}

const Details : FC<DetailsProps> = ({
    changeView, playerRef,
    reset, setControllerLearn, controllerLearn
}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    const {state: melodyState, dispatch: melodyDispatch_} = useContext(MelodyContext)!

    const melodyDispatch = (action: AnyAction) => {
        console.log('dispatch!', action)
        melodyDispatch_(action)
    }

    return <div>
    <Stack  alignItems="center" marginBottom={1} gap={2} direction="row">
        <ButtonGroup
            variant="contained"
            aria-label="outlined primary button group"
        >
            <LearnIconButton
                style={{backgroundColor: controllerLearn === 'changeView' ? 'red' : undefined}}
                onLongPress={() => setControllerLearn('changeView')}
                color={'default'}
                onClick={() => controllerLearn === 'changeView' || changeView(views.main)}
            >
                <HomeIcon />
            </LearnIconButton>
            <LearnIconButton
                style={{backgroundColor: controllerLearn === 'play' ? 'red' : undefined}}
                onLongPress={() => setControllerLearn('play')}
                color={
                    playerRef.current?.isPlaying()
                        ? 'primary'
                        : 'default'
                }
                onClick={() => {
                    if (controllerLearn === 'play') {
                        return
                    }
                    playerRef.current?.stop();
                    playerRef.current?.play();
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
                    
                    playerRef.current?.stop();
                }}
            >
                <StopIcon />
            </LearnIconButton>
        </ButtonGroup>
        <Config/>
        <TextField
            label={"Children per gen"}
            type='number' value={configState.children}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => configDispatch(setChildren(parseInt(e.target.value)))}/>
        <TextField
            label={"X-gens"}
            type='number' value={configState.xGens}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => configDispatch(setXGens(parseInt(e.target.value)))}/>
        <TextField
            label={"Start note count"}
            type='number' value={configState.melodyLen}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => configDispatch(setMelodyLen(parseInt(e.target.value)))}/>
        
        {/* <p><label>counts:</label> {melody.notes.length ? melody.notes[melody.notes.length - 1].position / 500 : 0}</p>     */}
        <Button onClick={reset}>Reset</Button>
        
    </Stack>
    <Paper elevation={2}>
        <Stack direction='row' gap={2} alignItems='center' padding={2} >
            <Button variant="outlined" startIcon={<Download />} onClick={() => downloadJSON(melodyState, 'melody.json')}>
                Melody
            </Button>
            <FileImportButton
                variant='outlined'
                onFileLoaded={(c: MelodyState) => {
                    melodyDispatch(setNextMelody(c.nextMelody!))
                    melodyDispatch(setMelody(c.melody!))
                    melodyDispatch(resetBuffer(c.ringBuf!))
                }}
                startIcon={<Upload />}
            >
                Melody
            </FileImportButton>
            <Button variant="outlined" startIcon={<Download />} onClick={() => downloadJSON(configState.controls, 'controls.json')}>
                Controls
            </Button>
            <FileImportButton
                variant='outlined'
                onFileLoaded={(c: Controls) => configDispatch(setControls({...emptyControls, ...c}))}
                startIcon={<Upload />}
            >
                Controls
            </FileImportButton>
            <Button variant="outlined" startIcon={<Download />} onClick={() => downloadJSON(configState, 'full-config.json')}>
                Full config
            </Button>
            <FileImportButton
                variant='outlined'
                onFileLoaded={(c: ConfigState) => configDispatch(setState({...initialConfigState(true), ...c}))}
                startIcon={<Upload />}
            >
                Full config
            </FileImportButton>
            <Button variant="outlined" startIcon={<RestartAlt />} onClick={() => configDispatch(setState(initialConfigState(true)))}>
                Reset config
            </Button>
            <TextField
                style={{width: '88px'}}
                label={"Note count"}
                value={melodyState.melody?.notes.length}
                InputProps={{readOnly: true}}
                size='small'
            />
            <TextField
                style={{width: '88px'}}
                label={"Melody length"}
                value={calcMelodyLength(melodyState.melody?.notes || [])}
                InputProps={{readOnly: true}}
                size='small'
            />
            <TextField
                // style={{width: '61px'}}
                label={"Score"}
                value={melodyState.melody?.score}
                InputProps={{readOnly: true}}
                size='small'
            />
        </Stack>
    </Paper>
    <Paper elevation={2}>
        <Stack direction='row' gap={2} alignItems='center' padding={2} marginTop={1} >
            <Knob
                label="bpm"
                value={configState.bpm}
                setValue={(x) => configDispatch(setBpm(x))}
                color={controllerLearn === 'bpm' ? 'red' : "#3F51B5"}
                textColor="black"
                min={20} max={300} id="BPM"
                displayValue={x => Math.round(x).toFixed(0)}
                mapToAngle={v => mapTo01Linear(Math.round(v), 20, 360)}
                onLongPress={() => setControllerLearn('bpm')}
            />
            <FormControlLabel control={<Checkbox checked={configState.autoSetVoiceSplit} onChange={x => configDispatch(setAutoSetVoiceSplit(x.target.checked))}/>} label="Auto set voice splits" />
        </Stack>
    </Paper>
    <Paper elevation={2} >
        <Stack style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', }} rowGap={1} marginTop={1} padding={3}>
            {configState.modFuncs.map((x, idx) => {
                const clKey = `modFuncs.${idx}`
                return <>
                        <ModFuncRegulator
                            color={controllerLearn === clKey ? 'red' : undefined}
                            score={melodyState.melody?.scores_per_func[idx] || 0}
                            key={clKey}
                            idx={idx}
                            func={x}
                            update={(modFunc) => configDispatch(updateModFunc({...modFunc, params: x.params}))}
                            onLongPress={() => setControllerLearn(clKey)}
                        />
                        {
                            x.params.map((param, paramIdx) => {
                                let range = x.name === 'score_measure_for_chord' ? [0, 84] : [0.2, 8]
                                const displayValue = x.name === 'score_measure_for_chord' ? (v: number) => numToNote(Math.round(v)) : (x: number) => x.toFixed(2)
                                return <Knob
                                    id={''}
                                    key={`param-${idx}-${paramIdx}`}
                                    color={"#00b5ff"}
                                    textColor="black"
                                    value={param}
                                    //  setValue={(n) => {
                                    //      update({idx, weight: n}) 
                                    //  }}
                                    min={range[0]} max={range[1]} label={'test'}
                                    displayValue={displayValue}
                                    mapToAngle={v => mapTo01Linear(v, range[0], range[1])}
                                    setValue={(n) => configDispatch(updateModFunc({
                                        idx,
                                        weight: x.weight,
                                        params: x.params.map((param, pidx) => pidx === paramIdx ? n : param)
                                    }))}
                                />
                            })
                        }
                    </>

            })}
            
                  
        </Stack>
    </Paper>
    <Paper elevation={2} >
        <History/>
    </Paper>
    {/* <Stack>
        {melody.notes.map(n => n.length).reduce((acc, cur) => acc+cur, 0)/melody.notes.length}
    </Stack>
    <Stack>
        {melody.notes.map(n =>notes[ Math.round(n.pitch / 10) % 12]).join(" | ")}
    </Stack>
    <Stack>
        {getKey(melody.notes, 'cur')}
    </Stack>
    <Stack>
        {nextMelody?.notes.map(n => notes[Math.round(n.pitch / 10) % 12]).join(" | ")}
    </Stack>
    <Stack>
        {getKey(nextMelody?.notes, 'next')}
    </Stack>
    <Stack>
    len cur:{calcMelodyLength(melody?.notes || [])}
    </Stack>
    <Stack>
    len next:{calcMelodyLength(nextMelody?.notes || [])}
    </Stack> */}
</div>
}

export default Details