export interface RingBuf<T> {
    add: (melody: T) => void;
    getAll: () => T[];
}

class RingBuffer<T> {
    _buf: T[] = [];
    _size = 0;
    _idx = -1;

    constructor(size: number) {
        this._size = size;
    }

    fromSaved(saved: any) {
        this._buf = saved._buf
        this._size = saved._size
        this._idx = saved._idx
    }

    reset() {
        this._buf = []
        this._idx = -1
    }

    add(item: T) {
        const nextIdx = (this._idx + 1) % this._size;
        this._buf[nextIdx] = item;
        this._idx = nextIdx
    }

    getAll() {
        if (this._buf.length < this._size) {
            return [...this._buf]
        }

        return [...this._buf.slice(this._idx + 1, this._buf.length), ...this._buf.slice(0, this._idx + 1)]
    }
}

export default RingBuffer;