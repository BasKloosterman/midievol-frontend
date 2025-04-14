import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';

import { Stack, ButtonGroup, IconButton, TextField, Button, Paper, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import { FC, useContext, useMemo } from "react";
import { views } from "../App";
import { frames, Note, numToNote } from "../lib/note";
import { getModFuncs, Melody, ModFunc } from "../lib/srv";
import { PlayerRef } from '../components/Player';
import Config, { ConfigProps } from '../components/Config';
import ModFuncRegulator, {ModFuncProps} from '../components/Modfunc';
import { Knob } from '../components/Knob';
import { mapTo01Linear } from '@dsp-ts/math';
import { LearnIconButton } from '../components/LearnButton';
import { ConfigContext, MelodyContext } from '../state/context';
import { setAutoSetVoiceSplit, setBpm, setChildren, setControls, setMelodyLen, setModFuncs, setState, setXGens, updateModFunc } from '../state/reducer/config';
import { Download, RestartAlt, Save, Upload } from '@mui/icons-material';
import FileImportButton, { downloadJSON } from '../lib/file';
import { Controls, emptyControls, NONE_ASSIGNED } from '../lib/controller';
import { ConfigState, initialConfigState, MelodyState } from '../state/state';
import { resetBuffer, setMelody, setNextMelody } from '../state/reducer/melody';
import History from '../components/History';
import { notes } from '../lib/keys';
import { AnyAction } from '@reduxjs/toolkit';
import { GlobalVoiceControl } from '../components/GlobalVoiceControl';
import { sumBy, unionBy } from 'lodash';
import { scoreTonality } from '../lib/harmony';
import { LearnCheckbox } from '../components/LearnCheckBox';
import { TimeDisplay } from '../components/TimeDisplay';

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
    curQNote: number;
    loading: boolean;
}

const Details : FC<DetailsProps> = ({
    changeView, playerRef, curQNote, loading,
    reset, setControllerLearn, controllerLearn
}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    const {state: melodyState, dispatch: melodyDispatch} = useContext(MelodyContext)!

    const tonality = useMemo(() => {
        return scoreTonality(melodyState.melody?.notes || [])
    }, [melodyState.melody])

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
            <Button variant="outlined" startIcon={<RestartAlt />} onClick={async () => {
                let fns = await getModFuncs()
                configDispatch(setState({...initialConfigState(true), modFuncs: fns}))
                configDispatch(setModFuncs(fns))
            }}>
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
            {loading ? <CircularProgress size={30} /> : null}
        </Stack>
    </Paper>
    <Paper elevation={2}>
        <Stack direction='row' gap={2} alignItems='center' padding={2} marginTop={1} >
            <Knob
                label="bpm"
                value={configState.bpm}
                setValue={(x) => configDispatch(setBpm(Math.max(Math.min(300, x), 20)))}
                color={controllerLearn === 'bpm' ? 'red' : "#3F51B5"}
                textColor="black"
                min={20} max={300} id="BPM"
                displayValue={x => Math.round(x).toFixed(0)}
                mapToAngle={v => mapTo01Linear(Math.round(v), 20, 360)}
                onLongPress={() => setControllerLearn('bpm')}
            />
            {/* <FormControlLabel control={<Checkbox checked={configState.autoSetVoiceSplit} onChange={x => configDispatch(setAutoSetVoiceSplit(x.target.checked))}/>} label="Auto set voice splits" /> */}
            <GlobalVoiceControl light={true} controllerLearn={controllerLearn} setControllerLearn={setControllerLearn} />
            <TimeDisplay curQNote={curQNote}/>
            <label style={{fontSize: 24, fontWeight: 'bold', marginLeft: 50}}>{tonality?.bestKey} ({tonality?.tonalityScore.toFixed(2)})</label>
        </Stack>
    </Paper>
    <Paper elevation={2} >
        <Stack style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', }} rowGap={2} marginTop={1} padding={3}>
            {configState.modFuncs.map((x, idx) => {
                const clKey = `modFuncs.${idx}`
                const weightLearnKey = `${clKey}.weights`
                let score = melodyState.melody?.scores_per_func[idx] != undefined ? melodyState.melody?.scores_per_func[idx] : null

                if (x.weight === 0) {
                    score = null
                }
                return <div style={{display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center', padding: 25, border: '1px solid rgba(0,0,0,0.05)'}}>
                        <ModFuncRegulator
                            color={controllerLearn === weightLearnKey ? 'red' : undefined}
                            score={score}
                            key={weightLearnKey}
                            idx={idx}
                            func={x}
                            update={(modFunc) => configDispatch(updateModFunc({...modFunc, params: x.params, voices: x.voices}))}
                            onLongPress={() => setControllerLearn(weightLearnKey)}
                        />
                        <div style={{display: 'flex', justifyContent: 'center', gap: 10}}>
                            {x.voices.map((voice, voiceIdx) => {
                                const checkLearnKey = `${clKey}.voicesChecks.${voiceIdx}`
                                return <LearnCheckbox
                                    key={checkLearnKey}
                                    style={{backgroundColor: controllerLearn === checkLearnKey ? 'red' : undefined}}
                                    onLongPress={() => setControllerLearn(checkLearnKey)}
                                    checked={voice} onChange={(n) => {
                                    configDispatch(
                                        updateModFunc({
                                            idx,
                                            weight: x.weight,
                                            params: x.params,
                                            voices: x.voices.map((voice, pidx) => pidx === voiceIdx ? n.target.checked : voice) as [boolean, boolean, boolean]
                                        })
                                    )
                                }}/>
                            })}
                        </div>
                        {x.params.length ? <div style={{display: 'flex', gap: 20, justifyContent: x.params.length > 1 ? 'space-between' : 'center'}}>
                            {
                                x.params.map((param, paramIdx) => {
                                    let range = param.range
                                    const paramKey = `${clKey}.params.${paramIdx}`
                                    const displayValue = param.type === 'note' ? (v: number) => numToNote(Math.round(v)) : (x: number) => x.toFixed(2)
                                    return <Knob
                                        id={''}
                                        key={`param-${idx}-${paramIdx}`}
                                        color={controllerLearn === paramKey ? 'red' : "#3F51B5"}
                                        textColor="black"
                                        value={param.value}
                                        //  setValue={(n) => {
                                        //      update({idx, weight: n}) 
                                        //  }}
                                    
                                        onLongPress={() => setControllerLearn(paramKey)}
                                        min={range[0]} max={range[1]} label={param.name}
                                        displayValue={displayValue}
                                        mapToAngle={v => mapTo01Linear(v, range[0], range[1])}
                                        setValue={(n) => configDispatch(updateModFunc({
                                            idx,
                                            weight: x.weight,
                                            params: x.params.map((param, pidx) => pidx === paramIdx ? {...param, value: n} : param),
                                            voices: x.voices
                                        }))}
                                    />
                                })
                            }
                            </div> : null
                        }
                    </div>

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