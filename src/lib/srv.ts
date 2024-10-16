import { Note } from "./note"

export interface Melody {notes: Note[], dna: string, loss: number}

export const init = async (dna: string = '') : Promise<Melody> => {
    return (await fetch('http://localhost:8080/init', {method: 'POST', body: JSON.stringify({dna})}).then(x => x.json())) as Melody
    // return (await fetch('http://localhost:7777/evolve', {method: 'POST', body: dna}).then(x => x.json())) as Melody
} 
export const evolve = async (dna: string = '', xGens: number) : Promise<Melody> => {
    return (await fetch('http://localhost:8080/evolve', {method: 'POST', body: JSON.stringify({dna, x_gens: xGens})}).then(x => x.json())) as Melody
    // return (await fetch('http://localhost:7777/evolve', {method: 'POST', body: dna}).then(x => x.json())) as Melody
} 