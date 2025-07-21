
import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { MelodyState, initialMelodyState, saveMelodyStateToLocalStorage } from "../state";
import { Melody } from '../../lib/srv';
import RingBuffer from '../../lib/ringbuf';
import { calcMelodyLength } from '../../pages/Details';
import { frames } from '../../lib/note';


export const melodySlice = createSlice({
    name: 'melody',
    initialState: initialMelodyState(),
    extraReducers: (builder) => {
        builder.addMatcher(
            (action) =>
                ['melody/setMelody', 'melody/setNextMelody', 'melody/resetBuffer'].includes(action.type),
          (state, action) => {
            saveMelodyStateToLocalStorage(state)
          }
        );
    },
    reducers: {
        setHistory: (state, {payload}: PayloadAction<{history: number, idx: number}>) => {
            // update total melody length
            console.log('set new history', payload.history)
            state.history[payload.idx] = payload.history
            return state
        },
        setMelody: (state, {payload}: PayloadAction<{melody: Melody, idx: number}>) => {

            state.melody[payload.idx] = payload.melody
            state.ringBuf[payload.idx].add(payload.melody)
            return state
        },
        setNextMelody: (state, {payload}: PayloadAction<{melody?: Melody, idx: number}>) => {
            state.nextMelody[payload.idx] = payload.melody
            return state
        },
        setCurMelodyIdx: (state, {payload}: PayloadAction<number>) => {
            state.curMelodyIdx = payload
            return state
        },
        resetBuffer: (state, {payload}: PayloadAction<{buffer?: any, idx: number}>) => {
            if (payload.buffer) {
                const ringBuf = new RingBuffer<Melody>(20)
                ringBuf.fromSaved(payload.buffer as any)
                state.ringBuf[payload.idx] = ringBuf
            } else {
                state.ringBuf[payload.idx] = new RingBuffer<Melody>(20)
            }
            return state
        },
    }
})

const MelodyReducer = melodySlice.reducer

export const {
    setMelody,
    setNextMelody,
    resetBuffer,
    setCurMelodyIdx,
    setHistory
} = melodySlice.actions


export default MelodyReducer