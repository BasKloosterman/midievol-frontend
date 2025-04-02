import { Note } from "./note"

export interface Melody {notes: Note[], dna: string, scores_per_func: number[], score: number, bpm: number}

export const init = async (dna: string = '', modFuncs: ModFunc[], voices: {min: number, max: number}) : Promise<Melody> => {
    const _modFuncs = modFuncs.map(x => ({...x, weight: x.weight}))
    return (await fetch(
        'http://localhost:8080/init', {
            method: 'POST',
            body: JSON.stringify({dna, modFuncs: _modFuncs, voices})
        }).then(
            x => x.json()
        )) as Melody
} 
export const evolve = async (dna: string = '', xGens: number, children: number, modFuncs: ModFunc[], voices: {min: number, max: number}) : Promise<Melody> => {
    const _modFuncs = modFuncs.map(x => ({...x, weight: x.weight}))
    return (await fetch(
        'http://localhost:8080/evolve', {
            method: 'POST',
            body: JSON.stringify({dna, x_gens: xGens, children, modFuncs: _modFuncs, voices})
        }).then(
            x => x.json()
        )) as Melody
} 

export interface ModFuncParam {name: string, range: [number,number], value: number, type: 'note' | 'float'}

export interface ModFunc {
    name: string;
    weight: number;
    params: ModFuncParam[];
}

export const getModFuncs = async (): Promise<ModFunc[]> => {
    return (await fetch('http://localhost:8080/get_funcs').then(x => x.json())) as ModFunc[]
}