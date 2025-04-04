import { Dispatch, forwardRef, SetStateAction, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Note, frames } from "../lib/note";
import { Output, WebMidi } from "webmidi";
import { Clock } from "../lib/clock";
import Emitter, { events } from "../lib/eventemitter";
import { calcMelodyLength } from "../pages/Details";
import { range } from "lodash";

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
    melody: Note[];
    bpm: number;
    instrument: number;
    visualization: number;
    metronome: {output: number, channel: number, enabled: boolean};
    numVoices: number;
    voiceSplits: [number, number][]
    beforeLoop: () => void;
    trigger: Dispatch<SetStateAction<number>>;
    // addNote: (note: Note) => void
}

export interface PlayerRef {
    play: () => void;
    stop: () => void;
    pauze: () => void;
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
    const {melody} = props
    const propsref = useRef<PlayerProps>(props)
    const melodyref = useRef<Note[]>(melody)
    const melodyLengthRef = useRef<number>(calcMelodyLength(melody))
    
    const pos = useRef<number>(0)
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
                console.log('ready', ready.current)
                props.trigger(t => t+1)
            },
            stop: () => {
                pos.current = 0
                playing.current = false

                let output = webMidi.current.outputs[propsref.current.instrument];

                panic(output)
                props.trigger(t => t+1)
            },
            pauze: () => {
                playing.current = false
                props.trigger(t => t+1)
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
        
        const loopRange = calcMelodyLength(melody)

        if (!ready.current) {
            return
        }

        if (!playing.current) {
            return
        }
            
        const m = []
        let maxTicks = 0
        for (let idx = 0; idx < melody.length; idx++) {
            const element = melody[idx];
            if (element.position < pos.current) {
                continue
            }

            if (element.position > maxTicks) {
                maxTicks = element.position
            }

            m.push(element)
        }

        // Detect start new loop
        if (loop && pos.current / frames >= loopRange) {
            pos.current = 0         
             // Detect start new loop
            propsref.current.beforeLoop()
            panic(webMidi.current.outputs[propsref.current.metronome.output])
            return
        }

        

        if (metronome) {
            if (pos.current === 0) {
                webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel || 1].playNote('A#5', {
                    duration: 200,
                    attack: 1
                });
            }
            if (pos.current % (1 * frames) === 0) {
                webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel || 1].playNote('C3', {
                    duration: 200,
                    attack: 1
                });
            }
        }

        m.forEach(note => {
            if (note.position == pos.current) {
                let output = webMidi.current.outputs[propsref.current.instrument];
                let channelIdx = getChannelIdx(note, propsref.current.numVoices, propsref.current.voiceSplits);

                channelIdx.forEach(idx => {
                    output.channels[idx].playNote(transform(note.pitch), {duration: calculateLength(note.length, clock.current.getBPM(), frames), attack: 1});
                })

                console.log('propsref.current.visualization', propsref.current.visualization)

                if (propsref.current.visualization && propsref.current.instrument != propsref.current.visualization) {
                    output = webMidi.current.outputs[propsref.current.visualization];

                    channelIdx.forEach(idx => {
                        output.channels[idx].playNote(transform(note.pitch), {duration: calculateLength(note.length, clock.current.getBPM(), frames), attack: 1});
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