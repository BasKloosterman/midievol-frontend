
import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { MelodyState, initialMelodyState, saveMelodyStateToLocalStorage } from "../state";
import { Melody } from '../../lib/srv';

export const melodySlice = createSlice({
    name: 'melody',
    initialState: initialMelodyState(),
    extraReducers: (builder) => {
        builder.addMatcher(
          () => true, // Matches ALL actions
          (state, action) => {
            saveMelodyStateToLocalStorage(state)
          }
        );
    },
    reducers: {
        setMelody: (state, {payload}: PayloadAction<Melody>) => {
            state.melody = payload
            return state
        },
        setNextMelody: (state, {payload}: PayloadAction<Melody>) => {
            state.nextMelody = payload
            return state
        },
        loadMelodyState: (state, {payload}: PayloadAction<MelodyState>) => {
            return payload
        }
    }
})

const MelodyReducer = melodySlice.reducer

export const {
    loadMelodyState,
    setMelody,
    setNextMelody
} = melodySlice.actions


export default MelodyReducer