import { FC, useEffect, useRef, useState } from 'react';
import { Note, frames } from './lib/note';
import Player, { PlayerRef } from './components/Player';
import {
    Button,
    ButtonGroup, IconButton, Input, Slider, Stack,
    TextField,
    Typography
} from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { ModFunc, evolve, getModFuncs, init, Melody, updateModFunc as _updateModFunc } from './lib/srv';
import Config from './components/Config';
import { createRandomMelody } from './lib/base4';


export const calcMelodyLength = (melody: Note[]) => {
    if (!melody.length) {
        return 1;
    }
    const latestNote = melody[melody.length - 1].position;
    let loopRange_ = Math.ceil(latestNote / (1 * frames));
    if (latestNote % (1 * frames) === 0) {
        loopRange_ += 1;
    }

    return loopRange_;
};

const startLen = 10

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const maj = [0,2,4,5,7,9,11]
const min = [0,2,3,5,7,8,11]

const k = [0,1,2,3,4,5,6,7,8,9,10,11]

const keys = [
    ...k.map(x => maj.map(p => (p+x)%12)),
    ...k.map(x => min.map(p => (p+x)%12))
]

const getKey = (_notes?: Note[], label?: string) => {
    if (!_notes) {
        return ''
    }
    const normPitches = _notes.map(n => Math.round(n.pitch/10)%12)
    console.log(label+':', normPitches)
    const [perc, idx] = keys.reduce((acc, cur, idx) => {
        
        const score = normPitches.filter(p => cur.includes(p)).length
        const perc = score / normPitches.length

        console.log(`${label}: ${notes[idx % 12]} ${idx > 12 ? 'min' : 'maj'}: ${perc * 100}%`)

        if (perc > acc[0]) {
            return [perc, idx]
        }
        return acc
    }, [-1, -1])

    return `${label}: ${notes[idx % 12]} ${idx > 12 ? 'min' : 'maj'}: ${perc * 100}%`
}


interface ModFuncProps {
    idx: number;
    func: ModFunc;
    update: ({idx, weight}: {idx: number, weight: number}) => void
}

const ModFunc: FC<ModFuncProps> = ({func, update, idx}) => {
    const {name, weight} = func
    return (
        <>
            <Typography gutterBottom>{name}</Typography>
            <Slider
                aria-label={name}
                defaultValue={30}
                value={weight}
                step={1}
                marks
                min={-10}
                max={10}
                valueLabelDisplay="on"
                onChange={(e, newValue) => {
                    console.log(newValue)
                    update({idx, weight: Array.isArray(newValue) ? newValue[0] : newValue}) 
                }}
            />
        </>
    )
    return <div>{func.name}: {func.weight}</div>
}

const App: FC = () => {
    const [melodyLen, setMelodyLen] = useState(startLen)
    const [loading, setLoading]= useState(false)
    const playerRef = useRef<PlayerRef>(null);

    const [melody, setMelody] = useState<Melody>({dna: createRandomMelody(melodyLen), notes: [], score: -1, bpm: 90})
    const [xGens, setxGens] = useState(25)
    const [children, setChildren] = useState(50)
    const [nextMelody, setNextMelody] = useState<Melody>()

    const [output, setOutput] = useState<number>(0)
    const [channel, setChannel] = useState<number>(1)

    const [metronomeOutput, setMetronomeOutput] = useState<number>(0)
    const [metronomeChannel, setMetronomeChannel] = useState<number>(2)
    const [metronome, setMetronome] = useState<boolean>(false)

    const [modFuncs, setModFuncs] = useState<ModFunc[]>([])

    const updateModFunc = async ({weight, idx}: {idx: number, weight: number}) => {
        // const ret = await _updateModFunc(val)

        setModFuncs(x => x.map((x, _idx) => _idx === idx ? {...x, weight} : x))
    }

    useEffect(() => {
        (async () => {
            let fns = await getModFuncs()
            setModFuncs(fns)

            let m = await init(melody.dna, fns)
            setMelody(m)

            m = await evolve(m.dna, xGens, children, fns)
            setNextMelody(m)
        })()
    }, [])

    const restart =  async () =>  {
        const newMelody = await init(createRandomMelody(melodyLen), modFuncs)
        setMelody(newMelody)

        const m = await evolve(newMelody.dna, xGens, children, modFuncs)
        setNextMelody(m)
    }

    return (
        <div>
            <Stack  alignItems="center" marginBottom={1} gap={2} direction="row">
                <Player
                    ref={playerRef}
                    melody={melody.notes || []}
                    instrument={{channel, output}}
                    metronome={{channel: metronomeChannel, output: metronomeOutput, enabled: metronome}}
                    bpm={melody.bpm}
                    beforeLoop={async () => {
                        if (loading) {
                            return
                        }

                        setLoading(true)
                        const nextToPlay = nextMelody || melody
                        setMelody(nextToPlay)
            
                        const m = await evolve(nextToPlay.dna, xGens, children, modFuncs)
                        setNextMelody(m)
                        setLoading(false)
                    }}
                />
                <ButtonGroup
                    variant="contained"
                    aria-label="outlined primary button group"
                >
                    <IconButton
                        color={
                            playerRef.current?.isPlaying()
                                ? 'primary'
                                : 'default'
                        }
                        onClick={() => {
                            playerRef.current?.stop();
                            playerRef.current?.play();
                        }}
                    >
                        <PlayArrow />
                    </IconButton>
                    <IconButton
                        onClick={() => {
                            
                            playerRef.current?.stop();
                        }}
                    >
                        <StopIcon />
                    </IconButton>
                </ButtonGroup>
                <Config
                    output={output} setOutput={setOutput} channel={channel} setChannel={setChannel}
                    metronomeOutput={metronomeOutput} setMetronomeOutput={setMetronomeOutput} metronomeChannel={metronomeChannel} setMetronomeChannel={setMetronomeChannel}
                    metronome={metronome} setMetronome={setMetronome}
                />
                <TextField label={"Children per gen"} type='number' value={children} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setChildren(parseInt(e.target.value))}/>
                <TextField label={"X-gens"} type='number' value={xGens} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setxGens(parseInt(e.target.value))}/>
                <TextField label={"Note count"} type='number' value={melodyLen} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setMelodyLen(parseInt(e.target.value))}/>
                <p><label>notes:</label> {melody.notes.length}</p>
                {/* <p><label>counts:</label> {melody.notes.length ? melody.notes[melody.notes.length - 1].position / 500 : 0}</p>     */}
                <Button onClick={restart}>Reset</Button>
                <div>score: {melody.score}</div>
                <div>bpm: {melody.bpm}</div>
            </Stack>
            <Stack>
                {modFuncs.map((x, idx) => <ModFunc key={idx} idx={idx} func={x} update={updateModFunc}/>)}
            </Stack>
            <Stack>
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
            </Stack>

        </div>
    );
};

export default App;

