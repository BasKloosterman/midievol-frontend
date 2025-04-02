import { createRandomMelody } from "../lib/base4";
import { Controls, emptyControls } from "../lib/controller";
import { Melody, ModFunc } from "../lib/srv"
import RingBuffer, { RingBuf } from "../lib/ringbuf"

export interface ConfigState {
    // Until bpm evo is implemented, just use the 'static' frontend BPM
    bpm: number;
    output: number;
    controller: number;
    controls: Controls;
    channel: number;
    numVoices: number;
    voiceSplits: [number, number][];
    autoSetVoiceSplit: boolean;
    metronomeOutput: number;
    metronomeChannel: number;
    metronome: boolean;
    modFuncs: ModFunc[];
    children: number;
    xGens: number;
    melodyLen: number;
}

const _initialConfigState : ConfigState = {
    bpm: 90,
    output: 0,
    channel: 1,
    controller: -1,
    controls: emptyControls,
    numVoices: 1,
    voiceSplits: [[0,84],[0,0],[0,0],[0,0],[0,0]],
    autoSetVoiceSplit: false,
    metronomeOutput: 0,
    metronomeChannel: 0,
    metronome: false,
    modFuncs: [],
    children: 25,
    xGens: 10,
    melodyLen: 10              
}

export const initialConfigState = (init=false) : ConfigState => init ? {..._initialConfigState} : loadConfigStateFromLocalStorage()

// Helper function to load state from localStorage
export const loadConfigStateFromLocalStorage = () : ConfigState => {
    try {
      const savedState = localStorage.getItem("configState");
      return savedState ? JSON.parse(savedState) : _initialConfigState;
    } catch (err) {
      console.error("Error loading state:", err);
      return _initialConfigState;
    }
  };

// Helper function to load state from localStorage
export const saveConfigStateToLocalStorage = (state: ConfigState) => {
    try {
      localStorage.setItem("configState", JSON.stringify(state))
    } catch (err) {
      console.error("Error save state:", err);
    }
  };

export interface MelodyState {
    // Until bpm evo is implemented, just use the 'static' frontend BPM
    melody?: Melody;
    nextMelody?: Melody;
    ringBuf: RingBuffer<Melody>;
}

// {dna: createRandomMelody(configState.melodyLen), notes: [], scores_per_func: [], score: -1, bpm: 90}

const _initialMelodyState : MelodyState = {
    melody: undefined,
    nextMelody: undefined,
    ringBuf: new RingBuffer(20)
}

export const initialMelodyState = (init=false) : MelodyState => init ? {..._initialMelodyState} : loadMelodyStateFromLocalStorage()

// Helper function to load state from localStorage
export const loadMelodyStateFromLocalStorage = () : MelodyState => {
    try {
      const savedState = localStorage.getItem("melodyState");
      if (!savedState) {
        return _initialMelodyState;
      }
      const initialState = JSON.parse(savedState)
      const ringBuf = new RingBuffer(20)
      
      if (initialState.ringBuf) {
        ringBuf.fromSaved(initialState.ringBuf as any)
        delete(initialState.ringBuf)
      }
      
      return {ringBuf, ...initialState}
    } catch (err) {
      console.error("Error loading state:", err);
      return _initialMelodyState;
    }
  };

// Helper function to load state from localStorage
export const saveMelodyStateToLocalStorage = (state: MelodyState) => {
    try {
      console.log('save', JSON.parse(JSON.stringify(state.melody?.scores_per_func)))
      localStorage.setItem("melodyState", JSON.stringify(state))
    } catch (err) {
      console.error("Error save state:", err);
    }
  };