import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Note, frames } from "../lib/note";
import { WebMidi } from "webmidi";
import { Clock } from "../lib/clock";
import Emitter, { events } from "../lib/eventemitter";
import { calcMelodyLength } from "../App";


export interface PlayerProps {
    melody: Note[];
    bpm: number;
    instrument: {output: number, channel: number};
    metronome: {output: number, channel: number, enabled: boolean};
    beforeLoop: () => void;
}

export interface PlayerRef {
    play: () => void;
    stop: () => void;
    pauze: () => void;
    outputs: typeof WebMidi.outputs;
    isPlaying: () => boolean;
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
            },
            stop: () => {
                pos.current = 0
                playing.current = false
            },
            pauze: () => {
                playing.current = false
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
        
        if (pos.current > maxTicks && !loop) {
            stop()
            return
        }

        // Detect start new loop
        if (loop && pos.current / frames >= loopRange) {
            pos.current = 0         
             // Detect start new loop
            propsref.current.beforeLoop()
            return
        }


        if (metronome) {
            if (pos.current === 0) {
                webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel].playNote('A#5', {
                    duration: 200,
                    attack: 1
                });
            }
            if (pos.current % (1 * frames) === 0) {
                webMidi.current.outputs[propsref.current.metronome.output].channels[propsref.current.metronome.channel].playNote('C3', {
                    duration: 200,
                    attack: 1
                });
            }
        }

        m.forEach(note => {
            if (note.position == pos.current) {
                
                //play note
                console.log(note.length, calculateLength(note.length, clock.current.getBPM(), frames))
                let output = webMidi.current.outputs[propsref.current.instrument.output];
                let channel = output.channels[propsref.current.instrument.channel];
                channel.playNote(transform(note.pitch), {duration: calculateLength(note.length, clock.current.getBPM(), frames), attack: 1});
            }
        })

        // if (pos.current % (frames / 4) == 0) {
        //     sendCC(pos.current, instruments, melodyLength, webMidi.current)
        // }

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