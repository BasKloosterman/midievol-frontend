import { range } from "lodash";
import { Controls } from "../../lib/controller";

import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { ModFunc, ModFuncParam } from "../../lib/srv";
import { ConfigState, initialConfigState, saveConfigStateToLocalStorage } from "../state";

export const configSlice = createSlice({
    name: 'config',
    initialState: initialConfigState(),
    extraReducers: (builder) => {
        builder.addMatcher(
          () => true, // Matches ALL actions
          (state, action) => {
            saveConfigStateToLocalStorage(state)
          }
        );
    },
    reducers: {
        setBpm: (state, {payload} : PayloadAction<number>) => {
            state.bpm = payload
            return state
        },
        setOutput: (state, {payload} : PayloadAction<number>) => {
            state.output = payload
            return state
        },
        setChannel: (state, {payload} : PayloadAction<number>) => {
            state.channel = payload
            return state
        },
        setController: (state, {payload} : PayloadAction<number>) => {
            state.controller = payload
            return state
        },
        setNumVoices: (state, {payload}: PayloadAction<number>) => {
            const total = 84
            const partSize = total / Math.round(payload); // Size of each part
            const rounded = Math.round(payload)
    
            let currentMin = 0;
    
    
            if (state.autoSetVoiceSplit) {
                if (rounded != Math.round(payload)) {
                    const newVoiceSplits : [number, number][] = range(payload).map(i => {
                        const max = i === rounded - 1 ? total : currentMin + partSize - 1; // Handle the last part
                        const result = [currentMin, max]
                        currentMin = max + 1
                        return result as [number, number]
                    })
        
                    while (newVoiceSplits.length < 5) {
                        newVoiceSplits.push([0,0])
                    }
        
                    state.voiceSplits = newVoiceSplits
                }
            }
            state.numVoices = payload
            return state
        },
        setAutoSetVoiceSplit: (state, {payload}: PayloadAction<boolean>) => {
            state.autoSetVoiceSplit = payload
            return state
        },
        setMetronomeOutput: (state, {payload}: PayloadAction<number>) => {
            state.metronomeOutput = payload
            return state
        },
        setMetronomeChannel: (state, {payload}: PayloadAction<number>) => {
            state.metronomeChannel = payload
            return state
        },
        setMetronome: (state, {payload}: PayloadAction<boolean>) => {
            state.metronome = payload
            return state
        },
        setVoiceSplitMin: (state, {payload: {index, value}}: PayloadAction<{index: number, value: number}>) => {
            const split = state.voiceSplits[index]
            split[0] = value

            if (split[0] > split[1]) {
                split[1] = split[0]
            }
            return state
        },
        setVoiceSplitMax: (state, {payload: {index, value}}: PayloadAction<{index: number, value: number}>) => {
            const split = state.voiceSplits[index]
            split[1] = value

            if (split[1] < split[0]) {
                split[0] = split[1]
            }
            return state
        },
        updateModFunc: (state, {payload: {idx, weight, params, voices}}: PayloadAction<{idx: number, weight: number, params: ModFuncParam[], voices: [boolean, boolean, boolean]}>) => {
            state.modFuncs = state.modFuncs.map((x, _idx) => _idx === idx ? {...x, weight, params, voices} : x)

            return state
        },
        setModFuncs: (state, {payload}: PayloadAction<ModFunc[]>) => {
            state.modFuncs = payload

            return state
        },
        setChildren: (state, {payload}: PayloadAction<number>) => {
            state.children = payload
            return state
        },
        setXGens: (state, {payload}: PayloadAction<number>) => {
            state.xGens = payload
            return state
        },
        setMelodyLen: (state, {payload}: PayloadAction<number>) => {
            state.melodyLen = payload
            return state
        },
        setControls: (state, {payload}: PayloadAction<Controls>) => {
            state.controls = payload
            return state
        },
        setState: (state, {payload}: PayloadAction<ConfigState>) => {
            return payload
        }
    }
})

const ConfigReducer = configSlice.reducer

export const {
    setBpm,
    setOutput,
    setChannel,
    setController,
    setNumVoices,
    setAutoSetVoiceSplit,
    setMetronomeOutput,
    setMetronomeChannel,
    setMetronome,
    setVoiceSplitMin,
    setVoiceSplitMax,
    updateModFunc,
    setModFuncs,
    setChildren,
    setXGens,
    setMelodyLen,
    setControls,
    setState
} = configSlice.actions


export default ConfigReducer