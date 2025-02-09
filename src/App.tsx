import { FC, useEffect, useReducer, useRef, useState } from 'react';
import Player, { PlayerRef } from './components/Player';

import { ModFunc, evolve, getModFuncs, init, Melody} from './lib/srv';
import Details from './pages/Details';
import { createRandomMelody } from './lib/base4';
import Main from './pages/Main';
import { AnimNote } from './components/Visualisation';
import { range, unionBy } from 'lodash';
import { ControlChangeMessageEvent, WebMidi } from 'webmidi';
import { handleCCUpdate, NONE_ASSIGNED, updateControls } from './lib/controller';
import { mapFrom01Linear, mapTo01Linear } from '@dsp-ts/math';
import ConfigReducer, { configSlice, setBpm, setControls, setModFuncs, setNumVoices, setVoiceSplitMax, setVoiceSplitMin, updateModFunc } from './state/reducer/config';
import { ConfigContext, MelodyContext } from './state/context';
import MelodyReducer, { melodySlice, setMelody, setNextMelody } from './state/reducer/melody';

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
                voices: (v: number) => configDispatch(setNumVoices(Math.round(mapFrom01Linear(mapTo01Linear(v, 0, 127), 1, 5)))),
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
                modFuncs: configState.modFuncs.map(
                    (_, idx) => (v: number) => configDispatch(
                        updateModFunc({idx, weight: mapFrom01Linear(mapTo01Linear(v, 0, 127), -10, 10)})
                    )
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
            let fns = await getModFuncs()
            configDispatch(setControls({...configState.controls, modFuncs: fns.map(x => NONE_ASSIGNED)}))
            configDispatch(setModFuncs(unionBy(configState.modFuncs, fns, "name")))

            let m: Melody;

            if (!melodyState.melody) {
                m = await init(createRandomMelody(configState.melodyLen), fns)
                melodyDispatch(setMelody(m))
            } else {
                m = melodyState.melody
            }

            if (!melodyState.nextMelody) {
                m = await evolve(m.dna, configState.xGens, configState.children, fns)
                melodyDispatch(setNextMelody(m))
            }
        })()
    }, [])

    const reset =  async () =>  {
        const newMelody = await init(createRandomMelody(configState.melodyLen), configState.modFuncs)
        melodyDispatch(setMelody(newMelody))

        const m = await evolve(newMelody.dna, configState.xGens, configState.children, configState.modFuncs)
        melodyDispatch(setNextMelody(m))
    }

    return (
        <MelodyContext.Provider value={{state: melodyState, dispatch: melodyDispatch}}>
        <ConfigContext.Provider value={{state: configState, dispatch: configDispatch}}>
        <div>
            <Player
                ref={playerRef}
                melody={melodyState.melody?.notes || []}
                instrument={{channel: configState.channel, output: configState.output}}
                metronome={{channel: configState.metronomeChannel, output: configState.metronomeOutput, enabled: configState.metronome}}
                bpm={configState.bpm /*melody.bpm*/}
                numVoices={Math.round(configState.numVoices)}
                voiceSplits={configState.voiceSplits}
                trigger={setTrigger}
                beforeLoop={async () => {
                    if (loading) {
                        return
                    }

                    setLoading(true)
                    const nextToPlay = melodyState.nextMelody || melodyState.melody
                    melodyDispatch(setMelody(nextToPlay!))
        
                    const m = await evolve(nextToPlay!.dna, configState.xGens, configState.children, configState.modFuncs)
                    melodyDispatch(setNextMelody(m))
                    setLoading(false)
                }}
            />
            {view == views.details ? (
                <Details
                    trigger={trigger}
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

function setModFunc(fns: ModFunc[]): import("redux").AnyAction {
    throw new Error('Function not implemented.');
}

