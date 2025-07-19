import { Dispatch, forwardRef, SetStateAction, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Note, frames } from "../lib/note";
import { Output, WebMidi } from "webmidi";
import { Clock } from "../lib/clock";
import Emitter, { events } from "../lib/eventemitter";
import { calcMelodyLength } from "../pages/Details";
import { range } from "lodash";
import { MelodyState } from "../state/state";

function panic(output: Output, channel = 0) {
    // Kill all notes
    for (let note = 0; note <= 127; note++) {
      output.sendNoteOff(note);
    }
  
    // Sustain off
    output.sendControlChange(64, 0);
  
    // Reset all controllers
    output.sendControlChange(121, 0);
  }


export interface PlayerProps {
    melodyState: MelodyState;
    bpm: number;
    instrument: number;
    visualization: number;
    metronome: {output: number, channel: number, enabled: boolean};
    numVoices: number;
    voiceSplits: [number, number][]
    beforeLoop: (idx: number) => void;
    trigger: Dispatch<SetStateAction<number>>;
    onQNotePassed: (note: number) => void;
    // addNote: (note: Note) => void
}

export interface PlayerRef {
    play: () => void;
    stop: () => void;
    pauze: () => void;
    reset: () => void;
    set: (position: number) => void;
    outputs: typeof WebMidi.outputs;
    isPlaying: () => boolean;
}

const includes  = (x : number, minMax: [number, number]) => x >= minMax[0] && x <= minMax[1]

const getChannelIdx = (note: Note, numVoices: number, voiceSplits: [number, number][]) => {    
    // VoiceSplits are 0 - 84 and transformed pithes are from 0 - 103 so we need to subtract 24 from transformed pitch
    return range(1, numVoices + 1).filter(channel => includes(transform(note.pitch) - 24, voiceSplits[channel - 1]))
}

const transform = (fakePitch: number) => Math.round(((240 + fakePitch) / 10))

// transfrom frames to ms in relatoin to BPM
const calculateLength = (length: number, bpm: number, frames_per_q: number) : number => {
    const qNoteFraction = length / frames_per_q
    const secondsPerBeat = 60 / bpm

    return qNoteFraction * secondsPerBeat * 1000
}

const Player = forwardRef<PlayerRef, PlayerProps>((props, ref) => {
    const {melodyState} = props
    const melody = melodyState.melody[melodyState.curMelodyIdx]?.notes || []
    const propsref = useRef<PlayerProps>(props)
    const melodyref = useRef<Note[]>(melody)
    const melodyLengthRef = useRef<number>(calcMelodyLength(melody))
    
    const pos = useRef<number>(0)
    const loading = useRef<boolean>(true)
    const playing = useRef<boolean>(false)
    const webMidi = useRef<typeof WebMidi>(WebMidi)
    const clock = useRef<typeof Clock>(Clock)
    const ready = useRef(false)

    useEffect(() => {
        clock.current.setBPM(props.bpm)
    },[props.bpm])

    useEffect(() => {
        propsref.current = props
    }, [props])

    useEffect(() => {
        melodyref.current = melody
        melodyLengthRef.current = calcMelodyLength(melody)
    }, [melody])

    useImperativeHandle(ref, () => {
        return {
            play: () => {
                playing.current = true
                props.trigger(t => t+1)
            },
            stop: () => {
                pos.current = propsref.current.melodyState.history[propsref.current.melodyState.curMelodyIdx] || 0
                playing.current = false

                let output = webMidi.current.outputs[propsref.current.instrument];

                panic(output)
                props.onQNotePassed(0)
                props.trigger(t => t+1)
            },
            pauze: () => {
                playing.current = false
                props.trigger(t => t+1)
            },
            reset: () => {
                playing.current = false
                props.trigger(t => t+1)
                pos.current = 0
                props.onQNotePassed(0)
            },
            set: (position: number) => {
                pos.current = position
            },
            outputs: webMidi.current.outputs,
            isPlaying: () => {
                return playing.current
            }
        }
    }, [ready.current]);

    const processTick = () => {
        
        const [loop, drumsOutput] = [true, 1]
        const {enabled: metronome} = propsref.current.metronome
        const melody = melodyref.current
        const curMelodyIdx = propsref.current.melodyState.curMelodyIdx

        
        const loopRange = calcMelodyLength(melody)
        const loopFrames = loopRange * frames
        
        let curLoopPos = (pos.current - (propsref.current.melodyState.history[curMelodyIdx] || 0))

        if (!ready.current) {
            return
        }

        if (!playing.current) {
            return
        }

        if (curLoopPos === 0) {
            metronome && webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel || 1].playNote('A#5', {
                duration: 200,
                attack: 1
            });
            propsref.current.onQNotePassed(0)
        }

        if (curLoopPos < loopFrames && loading.current) {
            loading.current = false
        }

        if (loading.current) {
            return
        }
            
        const m = []
        let maxTicks = 0
        for (let idx = 0; idx < melody.length; idx++) {
            const element = melody[idx];
            if (element.position < curLoopPos) {
                continue
            }

            if (element.position > maxTicks) {
                maxTicks = element.position
            }

            m.push(element)
        }

        for (const [index, value] of propsref.current.melodyState.melody.entries()) {
            if (index === curMelodyIdx) {
                continue
            }

            let loopPos = pos.current - propsref.current.melodyState.history[index]
            const loopFrames = calcMelodyLength(value?.notes || []) * frames

            if (loopPos === loopFrames) {
                propsref.current.beforeLoop(index)
            }
        }

        // Detect start new loop
        if (loop && curLoopPos === loopFrames) {
             // Detect start new loop
            propsref.current.beforeLoop(curMelodyIdx)
            loading.current = true
            // panic(webMidi.current.outputs[propsref.current.metronome.output])
            return
        }

        if (curLoopPos % (1 * frames) === 0) {
            metronome && webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel || 1].playNote('C3', {
                duration: 200,
                attack: 1
            });
            propsref.current.onQNotePassed(curLoopPos / frames)
        }

        m.forEach(note => {
            if (note.position == curLoopPos) {
                let output = webMidi.current.outputs[propsref.current.instrument];
                let channelIdx = getChannelIdx(note, propsref.current.numVoices, propsref.current.voiceSplits);

                channelIdx.forEach(idx => {
                    output.channels[idx].playNote(
                        transform(note.pitch),
                        {
                            duration: calculateLength(note.length, clock.current.getBPM(), frames),
                            attack: note.volume / 127
                        }
                    );
                })

                if (propsref.current.visualization && propsref.current.instrument != propsref.current.visualization) {
                    output = webMidi.current.outputs[propsref.current.visualization];

                    channelIdx.forEach(idx => {
                        output.channels[idx].playNote(
                            transform(note.pitch),
                            {
                                duration: calculateLength(note.length, clock.current.getBPM(), frames),
                                attack: note.volume / 127
                            }
                        );
                    })
                }
            }
        })

        pos.current++
    }

    useEffect(() => {
        (
            async () => {
                await WebMidi.enable()
                ready.current = true
                Emitter.trigger(events.eventChannelsChanged)
            }
        )()
        
        return clock.current.subscribe(processTick)
    }, [])

    return null
})

export default Player