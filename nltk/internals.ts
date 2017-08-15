import { LazySequence, Slice } from './types'
export class ValueError {
    constructor(public message: string) {
    }
}
export class IndexError {
    constructor(public message: string) {
    }
}
export function sliceBounds(seq: LazySequence<any>, { start, stop, step = 1 }: Partial<Slice>, allowStep = false): Slice {
    if (allowStep) {
        const res = sliceBounds(seq, step >= 0 ? { start, stop } : { start: stop, stop: start })
        return { ...res, step }
    }
    else if (step !== 1) {
        // TODO: Learn how to class name of Javascript object
        throw new ValueError('slices with steps are not supported by this LazySequence')
    }
    if (start === undefined) start = 0
    if (stop === undefined) stop = seq.length
    if (start < 0) start = Math.max(0, start + seq.length)
    if (stop < 0) stop = Math.max(0, stop + seq.length)
    if (stop > 0) {
        try {
            seq.get(stop - 1)
        }
        catch (e) {
            if (!(e instanceof IndexError)) throw e
            stop = seq.length
        }
    }
    start = Math.min(start, stop)
    return { start, stop }
}

