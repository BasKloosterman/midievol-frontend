import { Note } from "./note";

const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
  ];
  

const majorScale = [0, 2, 4, 5, 7, 9, 11];
const harmonicMinorScale = [0, 2, 3, 5, 7, 8, 11];

const keys = [
	...Array.from(
		{ length: 12 },
		(_, i) => new Set(majorScale.map((p) => (p + i) % 12)),
	),
	...Array.from(
		{ length: 12 },
		(_, i) => new Set(harmonicMinorScale.map((p) => (p + i) % 12)),
	),
];

const keyNames = [
    ...Array.from(
		{ length: 12 },
		(_, i) => `${noteNames[i]} major`
    ),
	...Array.from(
		{ length: 12 },
		(_, i) =>`${noteNames[i]} harmonicMinor`
    ),
]

export const scoreInKey = (melody: Note[]) => {
    const normalizedNotes = melody.map((n) => Math.round(n.pitch / 10) % 12);
  
    let bestScore = -1;
    let bestKeyIndex = -1;
  
    keys.forEach((key, idx) => {
      const matches = normalizedNotes.filter((n) => key.has(n)).length;
      const perc = matches / normalizedNotes.length;
      if (perc > bestScore) {
        bestScore = perc;
        bestKeyIndex = idx;
      }
    });
  
    return {
      score: bestScore * 2 - 1, // same scaling
      key: keyNames[bestKeyIndex],
    };
  };
  