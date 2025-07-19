import { Melody } from "../lib/srv";

export const mel1 : Melody  = {
    "notes": [
        {
            "pitch": 699,
            "length": 30,
            "volume": 114,
            "position": 383
        },
        {
            "pitch": 23,
            "length": 30,
            "volume": 127,
            "position": 786
        },
        {
            "pitch": 171,
            "length": 30,
            "volume": 0,
            "position": 816
        },
        {
            "pitch": 431,
            "length": 30,
            "volume": 42,
            "position": 920
        },
        {
            "pitch": 458,
            "length": 30,
            "volume": 0,
            "position": 2135
        },
        {
            "pitch": 378,
            "length": 30,
            "volume": 12,
            "position": 2350
        }
    ],
    "scores_per_func": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    "score": 0,
    "dna": "AAACCTCTAAAAGATCGTACAAAAAAAAAAAGGTTTAAAAAGGTAAATCATAGTTTAAAAAAAAAAATAGACAAAACCCTAAACACGGAAAAAAAAAAAAAAATATAAAAAGCCTTAAGTTTATACCCAAAAAAAAAAATCGCAAAAGTACCAACGATCGAAAAAAAAAAAAAACAGGGTAAAACTTCAACCTGCCAAGCAAAAAAAAAACGCGCGAAACGGTCAACCTGGAAACGAAAAAAAAAACGTGGGAAAATTGTAATGGGGTGTTTAAAAAAAAAATTACCCAAAGGTCCAAGGGACAAATAAAAAAAAAAGATGCTT",
    "bpm": 90
}

export const mel2 : Melody  = {
    "notes": [
        {
            "pitch": 699,
            "length": 30,
            "volume": 114,
            "position": 383
        },
        {
            "pitch": 23,
            "length": 30,
            "volume": 127,
            "position": 786
        },
        {
            "pitch": 171,
            "length": 30,
            "volume": 0,
            "position": 816
        },
        {
            "pitch": 431,
            "length": 30,
            "volume": 42,
            "position": 1150
        }
    ],
    "scores_per_func": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    "score": 0,
    "dna": "AAACCTCTAAAAGATCGTACAAAAAAAAAAAGGTTTAAAAAGGTAAATCATAGTTTAAAAAAAAAAATAGACAAAACCCTAAACACGGAAAAAAAAAAAAAAATATAAAAAGCCTTAAGTTTATACCCAAAAAAAAAAATCGCAAAAGTACCAACGATCGAAAAAAAAAAAAAACAGGGTAAAACTTCAACCTGCCAAGCAAAAAAAAAACGCGCGAAACGGTCAACCTGGAAACGAAAAAAAAAACGTGGGAAAATTGTAATGGGGTGTTTAAAAAAAAAATTACCCAAAGGTCCAAGGGACAAATAAAAAAAAAAGATGCTT",
    "bpm": 90
}

const mockMelodies : Melody[] = [mel1, mel2]

export default mockMelodies