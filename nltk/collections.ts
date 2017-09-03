import { LazySequence, Slice } from './types'
import { sliceBounds, ValueError, IndexError } from './internals'
export abstract class AbstractLazySequence<T> implements LazySequence<T> {
    abstract length: number
    abstract iterateFrom(start: number): Iterable<T>
    get(start: number, stop: number): LazySubsequence<T>
    get(i: number): T
    get(start: number, stop?: number): T | LazySubsequence<T> {
        if (stop === undefined) {
            if (start < 0) start += this.length
            if (start < 0) throw new Error('index out of range')
            const res = this.iterateFrom(start)[Symbol.iterator]().next()
            if (res.done) {
                throw new IndexError('index out of range')
            }
            else {
                return res.value
            }
        }
        else {
            return new LazySubsequence(this, sliceBounds(this, { start, stop }))
        }
    }
    [Symbol.iterator]() {
        return this.iterateFrom(0)[Symbol.iterator]()
    }
    count(value: T) {
        let i = 0
        for (const elt of this) {
            // TODO: Semantics of === are different than == in Python;
            // might need to define
            // type Eq = number | string | boolean | { eq(other: any): boolean }
            if (elt === value) {
                i++
            }
        }
        return i
    }
    index(value: T, start?: number, stop?: number) {
        ({ start, stop } = sliceBounds(this, { start, stop }))
        let i = start
        for (const v of this.iterateFrom(start)) {
            if (value === v) return i
            i++
            if (i > stop) break
        }
        throw new ValueError('index(x): x not in list')
    }
    contains(value: T) {
        return !!this.count(value)
    }
    // TODO: might need <U extends T>
    add(that: AbstractLazySequence<T>) {
        return new LazyConcatenation([this, that])
    }
    rAdd(that: AbstractLazySequence<T>) {
        return new LazyConcatenation([that, this])
    }
    mul(count: number) {
        const contents = []
        for (let i = 0; i < count; i++) {
            contents.push(this)
        }
        return new LazyConcatenation(contents)
    }
    rMul(count: number) {
        return this.mul(count)
    }
    private static maxReprSize = 60
    toString() {
        const pieces = []
        let length = 5
        for (const elt of this) {
            const s = elt.toString()
            length += s.length + 2
            if (length > AbstractLazySequence.maxReprSize && pieces.length > 1) {
                return `[${pieces.join(', ')}, ...]`
            }
            pieces.push(s)
        }
        return pieces.join(', ')
    }
    // Note: no way to override ==, >, != in javascript
    // Note: no way to prevent usage as a Map key in javascript
}

export class LazySubsequence<T> extends AbstractLazySequence<T> {
    static minSize = 1000
    static create<T>(source: LazySequence<T>, slice: Slice): LazySubsequence<T> | T[] {
        const { start, stop } = slice
        if (stop - start < LazySubsequence.minSize) {
            return Array.from(islice(source.iterateFrom(start), stop - start))
        }
        else {
            return new LazySubsequence(source, slice)
        }
    }
    private start: number
    private stop: number
    constructor(private source: LazySequence<T>, s: Slice) {
        super();
        this.start = s.start
        this.stop = s.stop
    }
    get length () {
        return this.stop - this.start
    }
    iterateFrom(start: number): Iterable<T> {
        return islice(this.source.iterateFrom(start + this.start),
                      Math.max(0, this.length - start))
    }
}
function islice<T>(source: Iterable<T>, start: number, stop?: number, step?: number): Iterable<T> {
    stop = stop || Number.MAX_VALUE
    return {
        [Symbol.iterator]: function* () {
            let i = start
            for (const v of source) {
                yield v
                i++
                if (i > stop!) return
            }
        }
    }
}
export class LazyConcatenation<T> extends AbstractLazySequence<T> {
    offsets: number[]
    constructor(private list: Array<LazySequence<T>> | LazySequence<LazySequence<T>>) {
        super()
        this.offsets = [0]
    }
    get length() {
        if (this.offsets.length <= this.list.length) {
            for (const tok of this.iterateFrom(this.offsets[this.offsets.length - 1])) {
                ;
            }
        }
        return this.offsets[this.offsets.length - 1]
    }
    iterateFrom(startIndex: number): Iterable<T> {
        const self = this
        return {
            [Symbol.iterator]: function* () {
                let sublistIndex = startIndex < self.offsets[self.offsets.length - 1] ?
                    bisectRight(self.offsets, startIndex) - 1 :
                    self.offsets.length - 1
                let index = self.offsets[sublistIndex]
                const sublistIter = Array.isArray(self.list) ?
                    islice(self.list, sublistIndex) :
                    self.list.iterateFrom(sublistIndex)
                for (const sublist of sublistIter) {
                    if (sublistIndex === self.offsets.length - 1) {
                        // TODO: Add back asserts here
                        // assert index + sublist.length >= self.offsets[self.offset.length - 1], 'offsets not monotonic increasing'
                        self.offsets.push(index + sublist.length)
                    }
                    else {
                        // assert self.offsets[sublistIndex + 1] === index + sublist.length,
                        //   'inconsistent list value (number of elements)'
                    }
                    for (const value of islice(sublist, Math.max(0, startIndex - index))) {
                        yield value
                    }
                    index += sublist.length
                    sublistIndex++
                }
            }
        }
    }
}
// TODO: implement this
declare function bisectRight<T>(ts: T[], start: number): number;
