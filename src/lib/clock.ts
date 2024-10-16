import { frames } from "./note";

const isBrowser = typeof window !== 'undefined';

enum CLOCK_DEFAULTS {
    toleranceLate = 0.1,
    toleranceEarly = 0.001
}

interface Tolerance {
    late?: number;
    early?: number;
}

// ==================== Event ==================== //
export class Event {
    clock: WAAClock;
    func: (event: Event) => void;
    onexpired?: (event: Event) => void;
    _cleared: boolean;

    toleranceLate: number;
    toleranceEarly: number;
    _latestTime: null | number;
    _earliestTime: null | number;
    deadline: null | number;
    repeatTime: null | number;

    constructor(clock: WAAClock, deadline: number, func: () => void) {
        this.clock = clock;
        this.func = func;
        this._cleared = false; // Flag used to clear an event inside callback

        this.toleranceLate = clock.toleranceLate;
        this.toleranceEarly = clock.toleranceEarly;
        this._latestTime = null;
        this._earliestTime = null;
        this.deadline = null;
        this.repeatTime = null;

        this.schedule(deadline);
    }

    // Unschedules the event
    clear() {
        this.clock._removeEvent(this);
        this._cleared = true;
        return this;
    }

    // Sets the event to repeat every `time` seconds.
    repeat(time: number) {
        if (time === 0) throw new Error('delay cannot be 0');
        this.repeatTime = time;
        if (!this.clock._hasEvent(this))
            this.schedule((this.deadline || 0) + this.repeatTime);
        return this;
    }

    // Sets the time tolerance of the event.
    // The event will be executed in the interval `[deadline - early, deadline + late]`
    // If the clock fails to execute the event in time, the event will be dropped.
    tolerance(values: Tolerance) {
        if (typeof values.late === 'number') this.toleranceLate = values.late;
        if (typeof values.early === 'number')
            this.toleranceEarly = values.early;
        this._refreshEarlyLateDates();
        if (this.clock._hasEvent(this)) {
            this.clock._removeEvent(this);
            this.clock._insertEvent(this);
        }
        return this;
    }

    // Returns true if the event is repeated, false otherwise
    isRepeated() {
        return this.repeatTime !== null;
    }

    // Schedules the event to be ran before `deadline`.
    // If the time is within the event tolerance, we handle the event immediately.
    // If the event was already scheduled at a different time, it is rescheduled.
    schedule(deadline: number) {
        this._cleared = false;
        this.deadline = deadline;
        this._refreshEarlyLateDates();

        if (this.clock.context.currentTime >= (this._earliestTime || 0)) {
            this._execute();
        } else if (this.clock._hasEvent(this)) {
            this.clock._removeEvent(this);
            this.clock._insertEvent(this);
        } else this.clock._insertEvent(this);
    }

    timeStretch(tRef: number, ratio: number) {
        if (this.isRepeated()) this.repeatTime = (this.repeatTime || 0) * ratio;

        let deadline = tRef + ratio * ((this.deadline || 0) - tRef);
        // If the deadline is too close or past, and the event has a repeat,
        // we calculate the next repeat possible in the stretched space.
        if (this.isRepeated()) {
            while (
                this.clock.context.currentTime >=
                deadline - this.toleranceEarly
            )
                deadline = (deadline || 0) + (this.repeatTime || 0);
        }
        this.schedule(deadline);
    }

    // Executes the event
    _execute() {
        if (this.clock._started === false) return;
        this.clock._removeEvent(this);

        if (this.clock.context.currentTime < (this._latestTime || 0))
            this.func(this);
        else {
            this.onexpired && this.onexpired(this);
            console.warn('event expired');
        }
        // In the case `schedule` is called inside `func`, we need to avoid
        // overrwriting with yet another `schedule`.
        if (!this.clock._hasEvent(this) && this.isRepeated() && !this._cleared)
            this.schedule((this.deadline || 0) + (this.repeatTime || 0));
    }

    // Updates cached times
    _refreshEarlyLateDates() {
        this._latestTime = (this.deadline || 0) + this.toleranceLate;
        this._earliestTime = (this.deadline || 0) - this.toleranceEarly;
    }
}

enum TickMethods {
    ScriptProcessorNode = 'ScriptProcessorNode'
}

interface ClockOptions {
    tickMethod?: TickMethods;
    toleranceEarly?: number;
    toleranceLate?: number;
}

// ==================== WAAClock ==================== //
export class WAAClock {
    tickMethod: TickMethods;
    toleranceEarly: number;
    toleranceLate: number;
    context: AudioContext;
    _events: Event[];
    _started: boolean;
    _clockNode?: ScriptProcessorNode;
    constructor(context: AudioContext, opts: ClockOptions) {
        const self = this;
        opts = opts || {};
        this.tickMethod = opts.tickMethod || TickMethods.ScriptProcessorNode;
        this.toleranceEarly =
            opts.toleranceEarly || CLOCK_DEFAULTS.toleranceEarly;
        this.toleranceLate = opts.toleranceLate || CLOCK_DEFAULTS.toleranceLate;
        this.context = context;
        this._events = [];
        this._started = false;
        // context.createGain();
    }

    // ---------- Public API ---------- //
    // Schedules `func` to run after `delay` seconds.
    setTimeout(func: () => void, delay: number) {
        return this._createEvent(func, this._absTime(delay));
    }

    // Schedules `func` to run before `deadline`.
    callbackAtTime(func: () => void, deadline: number) {
        return this._createEvent(func, deadline);
    }

    // Stretches `deadline` and `repeat` of all scheduled `events` by `ratio`, keeping
    // their relative distance to `tRef`. In fact this is equivalent to changing the tempo.
    timeStretch(tRef: number, events: Event[], ratio: number) {
        events.forEach(function (event) {
            event.timeStretch(tRef, ratio);
        });
        return events;
    }

    // Removes all scheduled events and starts the clock
    start() {
        if (this._started === false) {
            const self = this;
            this._started = true;
            this._events = [];

            if (this.tickMethod === 'ScriptProcessorNode') {
                const bufferSize = 256;
                // We have to keep a reference to the node to avoid garbage collection
                this._clockNode = this.context.createScriptProcessor(
                    bufferSize,
                    1,
                    1
                );
                this._clockNode.connect(this.context.destination);
                this._clockNode.onaudioprocess = function () {
                    setTimeout(function () {
                        self._tick();
                    }, 0);
                };
            } else if (this.tickMethod === 'manual')
                null; // _tick is called manually
            else throw new Error('invalid tickMethod ' + this.tickMethod);
        }
    }

    // Stops the clock
    stop() {
        if (this._started === true) {
            this._started = false;
            this._clockNode && this._clockNode.disconnect();
        }
    }

    // ---------- Private ---------- //

    // This function is ran periodically, and at each tick it executes
    // events for which `currentTime` is included in their tolerance interval.
    _tick() {
        let event = this._events.shift();

        while (
            event &&
            (event._earliestTime || 0) <= this.context.currentTime
        ) {
            event._execute();
            event = this._events.shift();
        }

        // Put back the last event
        if (event) this._events.unshift(event);
    }

    // Creates an event and insert it to the list
    _createEvent(func: () => void, deadline: number) {
        return new Event(this, deadline, func);
    }

    // Inserts an event to the list
    _insertEvent(event: Event) {
        this._events.splice(this._indexByTime((event._earliestTime || 0)), 0, event);
    }

    // Removes an event from the list
    _removeEvent(event: Event) {
        const ind = this._events.indexOf(event);
        if (ind !== -1) this._events.splice(ind, 1);
    }

    // Returns true if `event` is in queue, false otherwise
    _hasEvent(event: Event) {
        return this._events.indexOf(event) !== -1;
    }

    // Returns the index of the first event whose deadline is >= to `deadline`
    _indexByTime(deadline: number) {
        // performs a binary search
        let low = 0,
            high = this._events.length,
            mid;
        while (low < high) {
            mid = Math.floor((low + high) / 2);
            if ((this._events[mid]?._earliestTime || 0) < deadline)
                low = mid + 1;
            else high = mid;
        }
        return low;
    }

    // Converts from relative time to absolute time
    _absTime(relTime: number) {
        return relTime + this.context.currentTime;
    }

    // Converts from absolute time to relative time
    _relTime(absTime: number) {
        return absTime - this.context.currentTime;
    }
}

export const Clock = (function () {
    let t : ReturnType<typeof setTimeout> | null = null;
    let _subscribers : (() => void)[] = []
    let _bpm = 120
    let _Clock : WAAClock
    let ev : Event;
    let context: AudioContext;
    return {
        start() {
            
            context = new AudioContext()
            _Clock = new WAAClock(context, {toleranceEarly: 0.1})
            _Clock.start()
            ev = _Clock.setTimeout(this._start.bind(this), 60/_bpm/frames).repeat(60/_bpm/frames)
        },
        _start() {
            _subscribers.forEach(fn => fn())
        },
        stop() {
            t && clearTimeout(t)
        },
        setBPM(bpm: number) {
            if (_Clock) {
                _Clock.timeStretch(context.currentTime, [ev], _bpm / bpm)

            }
            _bpm = bpm
        },
        subscribe(fn: () => void) {
            _subscribers = [..._subscribers, fn]

            return () => {
                _subscribers = _subscribers.filter(x => x != fn)
            }
        },
        noteDuration(t: number) {
            return (1000 * 60) / _bpm * t
        }
    }
})()

// Clock.start()

const go = () => {
    Clock.start()
    window.removeEventListener('click', go)    
}

window.addEventListener('click', go)
