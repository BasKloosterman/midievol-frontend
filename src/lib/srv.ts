import { Note } from "./note"

export interface Melody {notes: Note[], dna: string, scores_per_func: (number | null)[], score: number, bpm: number}

const apiBaseURL = 'http://localhost:8080'

export const init = async (dna: string = '', modFuncs: ModFunc[], voices: {min: number, max: number}) : Promise<Melody> => {
    const _modFuncs = modFuncs.map(x => ({...x, weight: x.weight}))
    return (await fetch(
        `${apiBaseURL}/init`, {
            method: 'POST',
            body: JSON.stringify({dna, modFuncs: _modFuncs, voices: {min: Math.round(voices.min), max: Math.round(voices.max)}})
        }).then(
            x => x.json()
        )) as Melody
} 
export const evolve = async (dna: string = '', xGens: number, children: number, modFuncs: ModFunc[], voices: {min: number, max: number}) : Promise<[Melody, number]> => {
    const _modFuncs = modFuncs.map(x => ({...x, weight: x.weight}))
    const start = performance.now();
    const result = (await fetch(
        `${apiBaseURL}/evolve`, {
            method: 'POST',
            body: JSON.stringify({dna, x_gens: xGens, children, modFuncs: _modFuncs, voices: {min: Math.round(voices.min), max: Math.round(voices.max)}})
        }).then(
            x => x.json()
        )) as Melody
    const end = performance.now();
    const duration = end - start;

    return [result, duration]
} 

export interface ModFuncParam {name: string, range: [number,number], value: number, type: 'note' | 'float' | 'int'}

export interface ModFunc {
    name: string;
    weight: number;
    params: ModFuncParam[];
    splitVoices: boolean;
    hasNormalizedScore: boolean;
    normalizationFunc: string;
    voices: [boolean, boolean, boolean];
    scoreRange: [number | null, number | null];
}

export const getModFuncs = async (): Promise<ModFunc[]> => {
    return (await fetch(`${apiBaseURL}/get_funcs`).then(x => x.json())) as ModFunc[]
}