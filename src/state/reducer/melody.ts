
import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { MelodyState, initialMelodyState, saveMelodyStateToLocalStorage } from "../state";
import { Melody } from '../../lib/srv';
import RingBuffer from '../../lib/ringbuf';



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
        setMelody: (state, {payload}: PayloadAction<Melody>) => {
            state.melody = payload
            state.ringBuf.add(payload)
            return state
        },
        setNextMelody: (state, {payload}: PayloadAction<Melody>) => {
            state.nextMelody = payload
            return state
        },
        resetBuffer: (state, {payload}: PayloadAction<any>) => {
            if (payload) {
                const ringBuf = new RingBuffer<Melody>(20)
                ringBuf.fromSaved(payload)
                state.ringBuf = ringBuf
            } else {
                state.ringBuf.reset()
            }
            return state
        },
    }
})

const MelodyReducer = melodySlice.reducer

export const {
    setMelody,
    setNextMelody,
    resetBuffer
} = melodySlice.actions


export default MelodyReducer