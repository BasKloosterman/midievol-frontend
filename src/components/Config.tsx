import { FC, useEffect, useState } from 'react';
import { WebMidi } from 'webmidi';
import Emitter, { events } from '../lib/eventemitter';
import Select from './Select';
import { Checkbox, Paper, Stack } from '@mui/material';

interface ConfigProps {
    output?: number;
    setOutput: (n: number) => void;
    channel?: number;
    setChannel: (n: number) => void;
    metronomeOutput: number;
    setMetronomeOutput: (n: number) => void;
    metronomeChannel: number;
    setMetronomeChannel: (n: number) => void;
    metronome: boolean, 
    setMetronome: (n: boolean) => void;
}

const Config: FC<ConfigProps> = ({
    output=0, setOutput, channel=1, setChannel,
    metronomeOutput=0, setMetronomeOutput, metronomeChannel=2, setMetronomeChannel,
    metronome, setMetronome
}) => {
    
    const [outputs, setOutputs] = useState(WebMidi.outputs)
    

    useEffect(()=>{
        return Emitter.subscribe(events.eventChannelsChanged, () => {
            setOutputs([...WebMidi.outputs])
        })
    }, []) 

    return (
        <div>
        <Paper elevation={2}>
        <Stack marginBottom={1} spacing={2} direction='row' padding={2}>
            <Select
                value={output || 0}
                label="Output"
                onChange={(x) =>
                    setOutput(x)
                }
                options={outputs.map((x, idx) => ({value: idx, name: x.name}))}
            />
            <Select
                value={channel || 1}
                label="Channel"
                onChange={(x) =>
                    setChannel(x)
                }
                options={(outputs[output]?.channels || []).map((x, idx) => ({value: idx, name: 'channel ' + x.number.toString()}))}
            />
            <Checkbox checked={metronome} onChange={x => setMetronome(x.target.checked)}/>
            <Select
                value={metronomeOutput || 0}
                label="Metronome Output"
                onChange={(x) =>
                    setMetronomeOutput(x)
                }
                options={outputs.map((x, idx) => ({value: idx, name: x.name}))}
            />
            <Select
                value={metronomeChannel || 2}
                label="Metronome Channel"
                onChange={(x) =>
                    setMetronomeChannel(x)
                }
                options={(outputs[output]?.channels || []).map((x, idx) => ({value: idx, name: 'channel ' + x.number.toString()}))}
            />
        </Stack>
        </Paper>
    
        </div>   
    );
};

export default Config;
