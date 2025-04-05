import { FC, useEffect, useReducer, useRef, useState } from 'react';
import Player, { PlayerRef } from './components/Player';

import { ModFunc, evolve, getModFuncs, init, Melody} from './lib/srv';
import Details from './pages/Details';
import { createRandomMelody } from './lib/base4';
import Main from './pages/Main';
import { AnimNote } from './components/Visualisation';
import { range, unionBy } from 'lodash';
import { ControlChangeMessageEvent, WebMidi } from 'webmidi';
import { handleCCUpdate, mergeModFuncController, ModFuncControl, NONE_ASSIGNED, updateControls } from './lib/controller';
import { mapFrom01Linear, mapTo01Linear } from '@dsp-ts/math';
import ConfigReducer, { configSlice, setBpm, setControls, setModFuncs, setNumVoices, setVoiceSplitMax, setVoiceSplitMin, updateModFunc } from './state/reducer/config';
import { ConfigContext, MelodyContext } from './state/context';
import MelodyReducer, { melodySlice, resetBuffer, setMelody, setNextMelody } from './state/reducer/melody';
import { useSnackbar } from 'notistack';
import { ConfigState } from './state/state';

const calcVoices = (state: ConfigState) => {
    return {min: state.voiceSplits[1][0], max: state.voiceSplits[2][0]}
}

export enum views {
    details = 'details',
    main = 'main',
}

const App: FC = () => {
    const [configState, configDispatch] = useReducer(ConfigReducer, configSlice.getInitialState())
    const [melodyState, melodyDispatch] = useReducer(MelodyReducer, melodySlice.getInitialState())
    const [loading, setLoading]= useState(false)
    const playerRef = useRef<PlayerRef>(null);
    const [view, setView] = useState(views.main);
    const {enqueueSnackbar} = useSnackbar()
    const [curQNote, setCurQNote] = useState(0);



    // Used to trigger player update and cause rerender
    const [trigger, setTrigger] = useState(0);

    const [notes, setNotes] = useState<AnimNote[]>([])

    // controllerLearn can contain a key (controller) of the knob that is
    // currently trying to 'learn' it's CC channel 
    const [controllerLearn, setControllerLearn] = useState<string>()
    // const [controls, setControls] = useState<Controls>(emptyControls)

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setControllerLearn(undefined)
            }

            // Clear current set CC channel
            if (e.key === 'c' && controllerLearn) {
                configDispatch(setControls(updateControls(configState.controls, controllerLearn, NONE_ASSIGNED)))
                setControllerLearn(undefined)
            }
        }

        window.addEventListener('keyup', handleKeyPress)

        return () => window.removeEventListener('keyup', handleKeyPress)
    }, [controllerLearn, configState.controls])

    useEffect(() => {
        const handleCC = (cc: ControlChangeMessageEvent) => {
            if (controllerLearn) {
                configDispatch(setControls(updateControls(configState.controls, controllerLearn, cc.controller.number)))
                setControllerLearn(undefined)
            }

            const updateFns = {
                bpm: (v: number) => configDispatch(setBpm(mapFrom01Linear(mapTo01Linear(v, 0, 127), 20, 360))),
                // voices: (v: number) => configDispatch(setNumVoices(Math.round(mapFrom01Linear(mapTo01Linear(v, 0, 127), 1, 5)))),
                voiceSplits: range(configState.numVoices).map((voice) => ({
                    min: (v: number) => configDispatch(
                        setVoiceSplitMin({
                            index: voice,
                            value: mapFrom01Linear(mapTo01Linear(v, 0, 127), 0, 84)    
                        }
                    )),
                    max: (v: number) => configDispatch(
                        setVoiceSplitMax({
                            index: voice,
                            value: mapFrom01Linear(mapTo01Linear(v, 0, 127), 0, 84)
                        }
                    )),
                })),
                voices: {
                    min: (v: number) => {
                        const value = mapFrom01Linear(mapTo01Linear(v, 0, 127), 0, 84)
                        configDispatch(setVoiceSplitMax({index: 0, value: value -1}))
                        configDispatch(setVoiceSplitMin({index: 1, value}))

                        if (configState.voiceSplits[1][1] <= value) {
                            configDispatch(setVoiceSplitMax({index: 1, value: value + 1}))
                            configDispatch(setVoiceSplitMin({index: 2, value: value + 2}))
                        }
                    },
                    max: (v: number) => {
                        const value = mapFrom01Linear(mapTo01Linear(v, 0, 127), 0, 84)
                        configDispatch(setVoiceSplitMax({index: 1, value: value -1}))
                        configDispatch(setVoiceSplitMin({index: 2, value}))

                        if (configState.voiceSplits[0][1] >= value) {
                            configDispatch(setVoiceSplitMin({index: 1, value: value - 2}))
                            configDispatch(setVoiceSplitMax({index: 0, value: value - 3}))
                        }
                    }
                },
                modFuncs: configState.modFuncs.map(
                    (func, idx) => {
                        return {
                            weights: (v: number) => configDispatch(
                                updateModFunc({idx, weight: mapFrom01Linear(mapTo01Linear(v, 0, 127), -10, 10), params: func.params, voices: func.voices})
                            ),
                            params: func.params.map((param, paramIdx) => 
                                (v: number) => configDispatch(updateModFunc({
                                    idx,
                                    weight: func.weight,
                                    params: func.params.map((param, pidx) => pidx === paramIdx ? {...param, value: mapFrom01Linear(mapTo01Linear(v, 0, 127), param.range[0], param.range[1])} : param),
                                    voices: func.voices
                                }))
                            ),
                            voicesChecks: [1,2,3].map((_, voiceIdx) => (v: number) => configDispatch(updateModFunc({
                                    idx,
                                    weight: func.weight,
                                    params: func.params,
                                    voices: func.voices.map((voice, pidx) => pidx === voiceIdx ? v > 0: voice) as [boolean, boolean, boolean]
                                })
                            ))
                        }
                    }
                ),
                changeView: (n: number) => {
                    if (n === 127) {
                        setView(v => v === views.details ? views.main : views.details)
                    }
                },
                play: (n: number) => {
                    if (n === 127) {
                        playerRef.current?.play()
                    }
                },
                stop: (n: number) => {
                    if (n === 127) {
                    playerRef.current?.stop() 
                   }
                }
            }

            handleCCUpdate(cc, configState.controls, updateFns)
        }

        const input = WebMidi.inputs[configState.controller]
        
        input && input.channels[1].addListener('controlchange', handleCC) 

        return () => {
            input && input.channels[1].removeListener('controlchange', handleCC)
        }
    }, [configState.controller, controllerLearn, configState.controls, configState.voiceSplits, configState.numVoices, configState.modFuncs, playerRef.current]) 

    useEffect(() => {
        (async () => {
            try {
            let fns = await getModFuncs()
            const emptyModFuncControls : ModFuncControl[] = fns.map(x => {
                return {
                    weights: NONE_ASSIGNED,
                    params: x.params.map(_ => NONE_ASSIGNED),
                    voicesChecks: [NONE_ASSIGNED, NONE_ASSIGNED, NONE_ASSIGNED]
                }
            })
            configDispatch(
                setControls(
                    {...configState.controls, modFuncs: configState.controls?.modFuncs ? mergeModFuncController(emptyModFuncControls,  configState.controls?.modFuncs) : emptyModFuncControls}
                )
            )
            configDispatch(setModFuncs(unionBy(configState.modFuncs, fns, "name")))

                let m: Melody;
    
                if (!melodyState.melody) {
                    m = await init(createRandomMelody(configState.melodyLen), fns, calcVoices(configState))
                    melodyDispatch(setMelody(m))
                } else {
                    m = melodyState.melody
                }
    
                if (!melodyState.nextMelody) {
                    m = await evolve(m.dna, configState.xGens, configState.children, fns, calcVoices(configState))
                    melodyDispatch(setNextMelody(m))
                }
            
            } catch (err) {
                enqueueSnackbar(`An error has occured: ${err}`, { variant: 'error' });
                console.error(err)
            }
        })()
    }, [])

    const reset =  async () =>  {
        try {
            const newMelody = await init(createRandomMelody(configState.melodyLen), configState.modFuncs, calcVoices(configState))
            melodyDispatch(setMelody(newMelody))
    
            const m = await evolve(newMelody.dna, configState.xGens, configState.children, configState.modFuncs, calcVoices(configState))
            melodyDispatch(setNextMelody(m))
            melodyDispatch(resetBuffer(null))
        } catch (err) {
            enqueueSnackbar(`An error has occured: ${err}`, { variant: 'error' });
            console.error(err)

        }
    }

    return (
        <MelodyContext.Provider value={{state: melodyState, dispatch: melodyDispatch}}>
        <ConfigContext.Provider value={{state: configState, dispatch: configDispatch}}>
        <div>
            <Player
                ref={playerRef}
                melody={melodyState.melody?.notes || []}
                instrument={configState.output}
                visualization={configState.visualizationOutput}
                metronome={{channel: configState.metronomeChannel, output: configState.metronomeOutput, enabled: configState.metronome}}
                bpm={configState.bpm /*melody.bpm*/}
                numVoices={Math.round(configState.numVoices)}
                voiceSplits={configState.voiceSplits}
                trigger={setTrigger}
                onQNotePassed={(cn) => setCurQNote(cn)}
                beforeLoop={async () => {
                    if (loading) {
                        return
                    }

                    setLoading(true)
                    try {
                        const nextToPlay = melodyState.nextMelody || melodyState.melody
                        melodyDispatch(setMelody(nextToPlay!))
            
                        const m = await evolve(nextToPlay!.dna, configState.xGens, configState.children, configState.modFuncs, calcVoices(configState))
                        melodyDispatch(setNextMelody(m))
                        enqueueSnackbar(`Melody updated!`, { variant: 'success' });
                    } catch (err) {
                        enqueueSnackbar(`An error has occured: ${err}`, { variant: 'error' });
                        console.error(err)
                    } finally {
                        setLoading(false)
                    }
                }}
            />
            {view == views.details ? (
                <Details
                    trigger={trigger}
                    curQNote={curQNote}
                    changeView={setView}
                    // melody={melody}
                    // nextMelody={nextMelody}
                    playerRef={playerRef}
                    reset={reset}
                    controllerLearn={controllerLearn}
                    setControllerLearn={setControllerLearn}
                />
            ) : (
                <Main
                    trigger={trigger}
                    curQNote={curQNote}
                    notes={notes}
                    setNotes={setNotes}
                    changeView={setView}
                    player={playerRef.current}
                    melody={melodyState.melody?.notes}
                    controllerLearn={controllerLearn}
                    setControllerLearn={setControllerLearn}
                />
            )}
        </div>
        </ConfigContext.Provider>
        </MelodyContext.Provider>
    );
};

export default App;

