import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';

import { Stack, ButtonGroup, TextField, Button, Paper, CircularProgress } from "@mui/material";
import { FC, useContext, useMemo } from "react";
import { MelodySelect, views } from "../App";
import { frames, Note, numToNote } from "../lib/note";
import { getModFuncs } from "../lib/srv";
import { PlayerRef } from '../components/Player';
import Config, { ConfigProps } from '../components/Config';
import ModFuncRegulator from '../components/Modfunc';
import { Knob } from '../components/Knob';
import { mapTo01Linear } from '@dsp-ts/math';
import { LearnIconButton } from '../components/LearnButton';
import { ConfigContext, MelodyContext } from '../state/context';
import { setBpm, setChildren, setControls, setMelodyLen, setModFuncs, setState, setXGens, updateModFunc } from '../state/reducer/config';
import { Download, RestartAlt, Upload } from '@mui/icons-material';
import FileImportButton, { downloadJSON } from '../lib/file';
import { Controls, emptyControls } from '../lib/controller';
import { ConfigState, initialConfigState, MelodyState } from '../state/state';
import { resetBuffer, setCurMelodyIdx, setMelody, setNextMelody } from '../state/reducer/melody';
import History from '../components/History';
import { GlobalVoiceControl } from '../components/GlobalVoiceControl';
import { scoreTonality } from '../lib/harmony';
import { LearnCheckbox } from '../components/LearnCheckBox';
import { TimeDisplay } from '../components/TimeDisplay';

export const calcMelodyLength = (melody: Note[]) => {
    if (!melody.length) {
        return 1;
    }

    const latestNote = Math.max(...melody.map(n => n.position + n.length))

    // console.log('latestNote', latestNote, latestNote / frames)

    let loopRange_ = Math.ceil(latestNote / (1 * frames));
    // if (latestNote % (1 * frames) === 0) {
    //     loopRange_ += 1;
    // }

    // console.log('calcMelodyLength', melody, loopRange_)

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
    setCurrentMelody: () => void;
}

const Details : FC<DetailsProps> = ({
    changeView, playerRef, curQNote, loading,
    reset, setControllerLearn, controllerLearn,
    setCurrentMelody
}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    const {state: melodyState, dispatch: melodyDispatch} = useContext(MelodyContext)!

    const tonality = useMemo(() => {
        return scoreTonality(melodyState.melody[melodyState.curMelodyIdx]?.notes || [])
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
        <Button onClick={() => reset()}>Reset</Button>
    </Stack>
    <Paper elevation={2}>
        <Stack direction='row' gap={2} alignItems='center' padding={2} >
            <Button variant="outlined" startIcon={<Download />} onClick={() => downloadJSON(melodyState, 'melody.json')}>
                Melody
            </Button>
            <FileImportButton
                variant='outlined'
                onFileLoaded={(c: MelodyState) => {
                    // TODO fix load state
                    // melodyDispatch(setNextMelody({melody: c.nextMelody!, idx: melodyState.curMelodyIdx}))
                    // TODO fix load state
                    // melodyDispatch(setMelody({melody: c.melody!, idx: melodyState.curMelodyIdx}))
                    // TODO fix load state
                    // melodyDispatch(resetBuffer({melody: c.ringBuf!, idx: melodyState.curMelodyIdx}))
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
                value={melodyState.melody[melodyState.curMelodyIdx]?.notes.length}
                InputProps={{readOnly: true}}
                size='small'
            />
            <TextField
                style={{width: '88px'}}
                label={"Melody length"}
                value={calcMelodyLength(melodyState.melody[melodyState.curMelodyIdx]?.notes || [])}
                InputProps={{readOnly: true}}
                size='small'
            />
            <TextField
                // style={{width: '61px'}}
                label={"Score"}
                value={melodyState.melody[melodyState.curMelodyIdx]?.score}
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
            <MelodySelect curMelodyIdx={melodyState.curMelodyIdx} setMelodyIndex={(idx) => {
                melodyDispatch(setCurMelodyIdx(idx))
                playerRef.current?.set(melodyState.history[idx])
            }}/>
            <Button variant="contained" onClick={setCurrentMelody}>Copy as root</Button>
        </Stack>
    </Paper>
    <Paper elevation={2} >
        <Stack style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', }} rowGap={2} marginTop={1} padding={3}>
            {configState.modFuncs.map((x, idx) => {
                const clKey = `modFuncs.${idx}`
                const weightLearnKey = `${clKey}.weights`
                let score = melodyState.melody[melodyState.curMelodyIdx]?.scores_per_func[idx] != undefined ? melodyState.melody[melodyState.curMelodyIdx]?.scores_per_func[idx] : null

                if (x.weight === 0) {
                    score = null
                }
                return <div key={idx} style={{display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center', padding: 25, border: '1px solid rgba(0,0,0,0.05)'}}>
                        <ModFuncRegulator
                            color={controllerLearn === weightLearnKey ? 'red' : undefined}
                            score={score!}
                            key={weightLearnKey}
                            idx={idx}
                            func={x}
                            update={(modFunc) => configDispatch(updateModFunc({...modFunc, params: x.params, voices: x.voices, splitVoices: x.splitVoices}))}
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
                                            ...x,
                                            voices: x.voices.map((voice, pidx) => pidx === voiceIdx ? n.target.checked : voice) as [boolean, boolean, boolean],
                                        })
                                    )
                                }}/>
                            })}

                                <LearnCheckbox
                                    key={`split-voices-${idx}`}
                                    style={{backgroundColor: controllerLearn === `split-voices-${idx}` ? 'red' : undefined}}
                                    onLongPress={() => setControllerLearn(`split-voices-${idx}`)}
                                    checked={x.splitVoices} onChange={(n) => {
                                    configDispatch(
                                        updateModFunc({
                                            idx,
                                            ...x,
                                            splitVoices: n.target.checked,
                                        })
                                    )
                                }}/>
                        </div>
                        {x.params.length ? <div style={{display: 'flex', gap: 20, justifyContent: x.params.length > 1 ? 'space-between' : 'center'}}>
                            {
                                x.params.map((param, paramIdx) => {
                                    let range = param.range
                                    let displayValue = (x: number) => x.toFixed(2);
                                    
                                    if (param.type === 'int') {
                                        displayValue = (x: number) => Math.round(x) + ''
                                    }
                                    if (param.type === 'note') {
                                        displayValue = (v: number) => numToNote(Math.round(v))
                                    }

                                    const paramKey = `${clKey}.params.${paramIdx}`

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
                                            ...x,
                                            params: x.params.map((param, pidx) => pidx === paramIdx ? {...param, value: n} : param),
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
        <History setMelody={(idx) => {
            melodyDispatch(setCurMelodyIdx(idx))
            playerRef.current?.set(melodyState.history[idx])
        }}/>
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