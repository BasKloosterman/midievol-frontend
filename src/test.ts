import { scoreTonality } from "./lib/harmony"

const testmAm = [
    {pitch: 827, length: 3916, volume: 100, position: 0},
    {pitch: 691, length: 3067, volume: 122, position: 925},
    {pitch: 807, length: 4884, volume: 114, position: 1586},
    {pitch: 547, length: 794, volume: 71, position: 1694},
    {pitch: 831, length: 4789, volume: 52, position: 2278},
    {pitch: 759, length: 3538, volume: 12, position: 2447},
    {pitch: 547, length: 278, volume: 78, position: 2649},
    {pitch: 693, length: 3135, volume: 127, position: 3792},
    {pitch: 763, length: 2815, volume: 112, position: 3869},
    {pitch: 832, length: 123, volume: 36, position: 4002},
    {pitch: 469, length: 214, volume: 106, position: 4089},
    {pitch: 834, length: 3781, volume: 127, position: 4135},
    {pitch: 735, length: 4349, volume: 16, position: 4246},
    {pitch: 384, length: 3216, volume: 0, position: 4303},
    {pitch: 397, length: 1874, volume: 113, position: 4428},
    {pitch: 474, length: 75, volume: 127, position: 4563},
    {pitch: 809, length: 1996, volume: 12, position: 4580},
    {pitch: 594, length: 337, volume: 100, position: 4812},
    {pitch: 549, length: 910, volume: 71, position: 5004},
    {pitch: 547, length: 5083, volume: 9, position: 5182},
    {pitch: 738, length: 3095, volume: 19, position: 5236},
    {pitch: 813, length: 5658, volume: 116, position: 5867},
    {pitch: 831, length: 4800, volume: 27, position: 6024},
    {pitch: 787, length: 1187, volume: 4, position: 6923},
    {pitch: 827, length: 3997, volume: 35, position: 6977},
    {pitch: 571, length: 3645, volume: 35, position: 8035},
    {pitch: 548, length: 3038, volume: 23, position: 8137},
    {pitch: 591, length: 75, volume: 96, position: 8297},
    {pitch: 516, length: 3127, volume: 37, position: 8667},
    {pitch: 500, length: 1925, volume: 75, position: 9195}
]

const testcmaj= [
    {pitch: 0, length: 3916, volume: 100, position: 0},
    {pitch: 20, length: 3067, volume: 122, position: 925},
    {pitch: 40, length: 4884, volume: 114, position: 1586},
    {pitch: 50, length: 794, volume: 71, position: 1694},
    {pitch: 70, length: 4789, volume: 52, position: 2278},
    {pitch: 90, length: 3538, volume: 12, position: 2447},
    {pitch: 110, length: 278, volume: 78, position: 2649},
]

const testcsmaj= [
    {pitch: 10, length: 3916, volume: 100, position: 0},
    {pitch: 30, length: 3067, volume: 122, position: 925},
    {pitch: 50, length: 4884, volume: 114, position: 1586},
    {pitch: 60, length: 794, volume: 71, position: 1694},
    {pitch: 80, length: 4789, volume: 52, position: 2278},
    {pitch: 100, length: 3538, volume: 12, position: 2447},
    {pitch: 120, length: 278, volume: 78, position: 2649},
]

const testdmaj= [
    {pitch: 20, length: 3916, volume: 100, position: 0},
    {pitch: 40, length: 3067, volume: 122, position: 925},
    {pitch: 60, length: 4884, volume: 114, position: 1586},
    {pitch: 70, length: 794, volume: 71, position: 1694},
    {pitch: 90, length: 4789, volume: 52, position: 2278},
    {pitch: 110, length: 3538, volume: 12, position: 2447},
    {pitch: 130, length: 278, volume: 78, position: 2649},
]

const testemin= [
    {pitch: 40, length: 3916, volume: 100, position: 0},
    {pitch: 40, length: 3916, volume: 100, position: 0},
    {pitch: 40, length: 3916, volume: 100, position: 0},
    {pitch: 40, length: 3916, volume: 100, position: 0},
    {pitch: 60, length: 3067, volume: 122, position: 925},
    {pitch: 70, length: 4884, volume: 114, position: 1586},
    {pitch: 90, length: 794, volume: 71, position: 1694},
    {pitch: 110, length: 4789, volume: 52, position: 2278},
    {pitch: 120, length: 3538, volume: 12, position: 2447},
    {pitch: 140, length: 278, volume: 78, position: 2649},
]


export default () => {
    console.log('tonscore', scoreTonality(testemin))
} 


