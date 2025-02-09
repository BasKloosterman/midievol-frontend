export const frames = 600;

export interface Note {
    position: number;
    pitch: number;
    length: number;
    volume: number;
}

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const numToNote = (n: number) => notes[n % 12] + '' + (Math.floor(n / 12) + 1)