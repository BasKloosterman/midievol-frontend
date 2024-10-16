import { FC, useEffect, useRef, useState } from 'react';
import { Note, frames } from './lib/note';
import Player, { PlayerRef } from './components/Player';
import {
    Button,
    ButtonGroup, IconButton, Input, Stack,
    TextField
} from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { evolve, init, Melody } from './lib/srv';
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

const startLen = 21

const App: FC = () => {
    const [melodyLen, setMelodyLen] = useState(startLen)
    const [loading, setLoading]= useState(false)
    const playerRef = useRef<PlayerRef>(null);

    const [melody, setMelody] = useState<Melody>({dna: createRandomMelody(melodyLen), notes: [], loss: -1})
    const [xGens, setxGens] = useState(1)
    const [nextMelody, setNextMelody] = useState<Melody>()

    const [output, setOutput] = useState<number>(0)
    const [channel, setChannel] = useState<number>(1)

    const [metronomeOutput, setMetronomeOutput] = useState<number>(0)
    const [metronomeChannel, setMetronomeChannel] = useState<number>(2)

    useEffect(() => {
        (async () => {
            let m = await init(melody.dna)
            setMelody(m)

            m = await evolve(m.dna, xGens)
            setNextMelody(m)
        })()
    }, [])

    const restart =  async () =>  {
        const newMelody = await init(createRandomMelody(melodyLen))
        setMelody(newMelody)

        const m = await evolve(newMelody.dna, xGens)
        setNextMelody(m)
    }

    return (
        <div>
            <Stack className='c-nav' alignItems="center" marginBottom={1} gap={2} direction="row">
                <Player
                    ref={playerRef}
                    melody={melody.notes || []}
                    instrument={{channel, output}}
                    metronome={{channel: metronomeChannel, output: metronomeOutput}}
                    beforeLoop={async () => {
                        if (loading) {
                            return
                        }

                        setLoading(true)
                        const nextToPlay = nextMelody || melody
                        setMelody(nextToPlay)
            
                        const m = await evolve(nextToPlay.dna, xGens)
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
                />
                <TextField label={"X-gens"} type='number' value={xGens} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setxGens(parseInt(e.target.value))}/>
                <TextField label={"Note count"} type='number' value={melodyLen} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setMelodyLen(parseInt(e.target.value))}/>
                <Button onClick={restart}>Reset</Button>
                <div>loss: {melody.loss}</div>
            </Stack>
        </div>
    );
};

export default App;

