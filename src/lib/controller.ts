import {set, get, cloneDeep, forOwn, isEqual, isObject, isFunction} from 'lodash'
import { ControlChangeMessageEvent } from 'webmidi';


export const NONE_ASSIGNED = -1
export const LEARN = -2

function findPaths(obj: Object, targetValue: number, currentPath = "") {
    let paths : string[] = [];

    forOwn(obj, (value, key) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (isEqual(value, targetValue)) {
            paths.push(newPath);
        } else if (isObject(value)) {
            paths = paths.concat(findPaths(value, targetValue, newPath));
        }
    });

    return paths;
}


export interface Controls {
    bpm: number;
    voices: number;
    voiceSplits: {min: number; max: number}[];
    modFuncs: number[];
    changeView: number;
    play: number;
    stop: number;
}

export const emptyControls: Controls = {
    bpm: NONE_ASSIGNED,
    voices: NONE_ASSIGNED,
    voiceSplits: [{
        min: NONE_ASSIGNED,
        max: NONE_ASSIGNED
    }, {
        min: NONE_ASSIGNED,
        max: NONE_ASSIGNED
    }, {
        min: NONE_ASSIGNED,
        max: NONE_ASSIGNED
    }, {
        min: NONE_ASSIGNED,
        max: NONE_ASSIGNED
    }, {
        min: NONE_ASSIGNED,
        max: NONE_ASSIGNED
    }],
    modFuncs: [],
    changeView: NONE_ASSIGNED,
    play: NONE_ASSIGNED,
    stop: NONE_ASSIGNED,
}

export const updateControls = (controls: Controls, key: string, channel: number) : Controls => {
    const result = get(controls, key)
    console.log(result, channel)
    if (result === channel) {
        return controls
    }
    const ret = cloneDeep(controls)

    // reset other with same channel
    findPaths(controls, channel).forEach(k => set(ret, k, NONE_ASSIGNED))

    return set(ret, key, channel)
}

type FunctionTree = {
    [key: string]: ((num: number) => void) | ((num: number) => void)[] | FunctionTree | FunctionTree[];
};

export const handleCCUpdate = (cc: ControlChangeMessageEvent, controls: Controls, updateFns: FunctionTree) => {
    const nr = cc.controller.number 
    const val = cc.rawValue//cc.controller.position // cc.rawValue

    const paths = findPaths(controls, nr)
    // It actually can only be one at the time but keep the multiple for now
    paths.forEach(p => {
        const updater = get(updateFns, p)
        
        isFunction(updater) && updater(val || 0)
    })
}