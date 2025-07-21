import { Note } from "./note";

export function rotate<T>(arr: T[], n: number): T[] {
	const len = arr.length;
	const offset = ((n % len) + len) % len;
	return [...arr.slice(offset), ...arr.slice(0, offset)];
}

export function pearsonCorr(a: number[], b: number[]): number {
	const n = a.length;
	const meanA = a.reduce((sum, v) => sum + v, 0) / n;
	const meanB = b.reduce((sum, v) => sum + v, 0) / n;

	let numerator = 0;
	let denomA = 0;
	let denomB = 0;

	for (let i = 0; i < n; i++) {
		const diffA = a[i] - meanA;
		const diffB = b[i] - meanB;
		numerator += diffA * diffB;
		denomA += diffA ** 2;
		denomB += diffB ** 2;
	}

	return numerator / Math.sqrt(denomA * denomB);
}
  
  const MAJOR_PROFILE = [
    6.33,
    2.2,
    3.48,
    2.33,
    4.38,
    4.09,
    2.52,
    5.19,
    2.39,
    3.66,
    2.29,
    2.88,
    
  ];
  const MINOR_PROFILE = [
    6.33,
    2.88,
    3.48,
    4.09,
    2.52,
    3.66,
    2.29,
    4.38,
    2.2,
    5.19,
    2.33,
    2.39,
    
  ];
  
  const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
  const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

  const pitchNames = [
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
    "B",
  ];
  
  function calculateTonalityScore(pitches: number[]) {
    if (pitches.length === 0) {
      throw new Error("Note list must not be empty.");
    }
  
    const noteCounts = Array(12).fill(0);
    for (const pitch of pitches) {
      noteCounts[pitch % 12]++;
    }
  
    const totalNotes = noteCounts.reduce((a, b) => a + b, 0);
    const noteDistribution = noteCounts.map((c) => c / totalNotes);
  
    let bestScore = -1;
    let bestKey: [number, "major" | "minor"] | null = null;
  
    for (let root = 0; root < 12; root++) {
      const majorCorr = pearsonCorr(
        noteDistribution,
        rotate(MAJOR_PROFILE, 12-root),
      );
      const minorCorr = pearsonCorr(
        noteDistribution,
        rotate(MINOR_PROFILE, 12-root),
      );

  
      if (majorCorr > bestScore) {
        bestScore = majorCorr;
        bestKey = [root, "major"];
      }
      if (minorCorr > bestScore) {
        bestScore = minorCorr;
        bestKey = [root, "minor"];
      }
    }

  
    if (!bestKey) throw new Error("No best key found");
  
    const [root, mode] = bestKey;
    const scale = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
    const scaleNotes = scale.map((interval) => (root + interval) % 12);
  
    const inScaleCount = scaleNotes.reduce(
      (sum, pitch) => sum + noteCounts[pitch],
      0,
    );
    const outOfScaleCount = totalNotes - inScaleCount;
    const tonalScore = (inScaleCount - outOfScaleCount) / totalNotes;
    

    const bestKeyName = `${pitchNames[root]} ${mode}`;
  
    return {
      bestKey: bestKeyName,
      tonalityScore: tonalScore,
    };
  }
  
  export const scoreTonality = (
    melody: Note[]
  ) => {
   
    const roundedPitches = melody.map((n) => Math.round(n.pitch / 10));
    const result = calculateTonalityScore(roundedPitches);
    return {...result, tonalityScore: result.tonalityScore};
  };
  