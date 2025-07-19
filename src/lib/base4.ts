import { sample } from "lodash";

export const numToBase4 = (num: number) : string => {
    if (num === 0) return "0";
    
    let base4String = '';

    let base4Chars = ['A', 'G', 'C', 'T'];  // Mapping for 0 -> A, 1 -> G, 2 -> C, 3 -> T

    // Loop until the number is reduced to zero
    while (num > 0) {
        base4String = base4Chars[num % 4] + base4String;
        num = Math.floor(num / 4);
    }

    return base4String;
}

const getRandomCMajNote = (() => {
    let idx = -1
    const notes = [240, 280, 310]
    return () => {
        idx = (idx + 1) % 3
        const n = notes[idx]
        return n
    }
})()


const getRandomNote = () => Math.round((Math.random() * 840))

export const createRandomNote = () => {
    
    return [
        numToBase4(getRandomNote()).padStart(8, 'A'),
        numToBase4(Math.round((Math.random() * 2000))).padStart(8, 'A'),
        numToBase4(Math.round((Math.random() * 127))).padStart(4, 'A'),
        numToBase4(Math.round((Math.random() * 500*8))).padStart(16, 'A')
    ].join('')
}

export const createRandomMelody = (numNotes: number) => {
    let dna = ''

    for (let i = 0; i < numNotes; i++) {
        dna += createRandomNote()
    }

    return dna
}