import { FC, useContext, useEffect, useState } from 'react';
import { WebMidi } from 'webmidi';
import Emitter, { events } from '../lib/eventemitter';
import Select from './Select';
import { Checkbox, Paper, Stack } from '@mui/material';
import { ConfigContext } from '../state/context';
import { setController, setOutput, setMetronome, setMetronomeOutput, setMetronomeChannel } from '../state/reducer/config';

export interface ConfigProps {
}

const Config: FC<ConfigProps> = ({

}) => {
    const {state: configState, dispatch: configDispatch} = useContext(ConfigContext)!
    const [outputs, setOutputs] = useState(WebMidi.outputs)
    const [inputs, setInputs] = useState(WebMidi.inputs)
    

    useEffect(()=>{
        return Emitter.subscribe(events.eventChannelsChanged, () => {
            setOutputs([...WebMidi.outputs])
            setInputs([...WebMidi.inputs])
        })
    }, []) 

    return (
        <div>
        <Paper elevation={2}>
        <Stack marginBottom={1} spacing={2} direction='row' padding={2}>
            <Select
                value={configState.controller || 0}
                label="Controller"
                onChange={(x) =>
                    configDispatch(setController(x))
                }
                options={[{value: -1, name: 'Please select input', disabled: true}, ...inputs.map((x, idx) => ({value: idx, name: x.name}))]}
            />
            <Select
                value={configState.output || 0}
                label="Output"
                onChange={(x) =>
                    configDispatch(setOutput(x))
                }
                options={outputs.map((x, idx) => ({value: idx, name: x.name}))}
            />
            
            <Checkbox checked={configState.metronome} onChange={x => configDispatch(setMetronome(x.target.checked))}/>
            <Select
                value={configState.metronomeOutput || 0}
                label="Metronome Output"
                onChange={(x) =>
                    configDispatch(setMetronomeOutput(x))
                }
                options={outputs.map((x, idx) => ({value: idx, name: x.name}))}
            />
            <Select
                value={configState.metronomeChannel || 2}
                label="Metronome Channel"
                onChange={(x) =>
                    configDispatch(setMetronomeChannel(x))
                }
                options={(outputs[configState.output]?.channels || []).map((x, idx) => ({value: idx, name: 'channel ' + x.number.toString()}))}
            />
        </Stack>
        </Paper>
    
        </div>   
    );
};

export default Config;
