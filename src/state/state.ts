import { createRandomMelody } from "../lib/base4";
import { Controls, emptyControls } from "../lib/controller";
import { Melody, ModFunc } from "../lib/srv"
import RingBuffer, { RingBuf } from "../lib/ringbuf"
import mockMelodies from "../data";

export interface ConfigState {
    // Until bpm evo is implemented, just use the 'static' frontend BPM
    bpm: number;
    output: number;
    visualizationOutput: number;
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
    visualizationOutput: 0,
    channel: 1,
    controller: -1,
    controls: emptyControls,
    numVoices: 3,
    voiceSplits: [[0,28],[29,57],[58,84]],
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
    curMelodyIdx: number;
    melody: (Melody|undefined)[];
    nextMelody: (Melody|undefined)[];
    // array with length of already played melodies by index
    history: number[];
    ringBuf: RingBuffer<Melody>[];
}

const _initialMelodyState : MelodyState = {
    curMelodyIdx: 0,
    melody: mockMelodies,
    nextMelody: [],
    history: [0,0],
    ringBuf: [new RingBuffer(20), new RingBuffer(20)]
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
      let ringBuf : RingBuf<Melody>[] = []
      
      if (initialState.ringBuf) {
        ringBuf = initialState.ringBuf.map((bufdata: any) =>  {
          const buf = new RingBuffer(20)
          buf.fromSaved(bufdata)
          return buf
        })

        delete(initialState.ringBuf)
      }
      
      return {ringBuf, ...initialState}
    } catch (err) {
      console.error("Error loading state:", err);
      return _initialMelodyState;
    }
  };

// Helper function to save state to localStorage
export const saveMelodyStateToLocalStorage = (state: MelodyState) => {
    try {
      localStorage.setItem("melodyState", JSON.stringify(state))
    } catch (err) {
      console.error("Error save state:", err);
    }
  };