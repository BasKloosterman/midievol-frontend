import { Note } from "./note"


export const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const maj = [0,2,4,5,7,9,11]
const min = [0,2,3,5,7,8,11]

const k = [0,1,2,3,4,5,6,7,8,9,10,11]

const keys = [
    ...k.map(x => maj.map(p => (p+x)%12)),
    ...k.map(x => min.map(p => (p+x)%12))
]

export const getKey = (_notes?: Note[], label?: string) => {
    if (!_notes) {
        return ''
    }
    const normPitches = _notes.map(n => Math.round(n.pitch/10)%12)
    const [perc, idx] = keys.reduce((acc, cur, idx) => {
        
        const score = normPitches.filter(p => cur.includes(p)).length
        const perc = score / normPitches.length

        // console.log(`${label}: ${notes[idx % 12]} ${idx > 12 ? 'min' : 'maj'}: ${perc * 100}%`)

        if (perc > acc[0]) {
            return [perc, idx]
        }
        return acc
    }, [-1, -1])

    return `${label}: ${notes[idx % 12]} ${idx > 12 ? 'min' : 'maj'}: ${perc * 100}%`
}