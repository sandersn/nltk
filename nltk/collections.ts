import { LazySequence } from './types'
import { sliceBounds, ValueError, IndexError, islice } from './internals'
abstract class AbstractLazySequence<T> implements LazySequence<T>, Iterable<T> {
    abstract length: number
    abstract iterateFrom(start: number): Iterator<T>
    get(start: number, stop: number): LazySubsequence<T>
    get(i: number): T
    get(start: number, stop?: number): T | LazySubsequence<T> {
        if (stop === undefined) {
            if (start < 0) start += this.length
            if (start < 0) throw new Error('index out of range')
            const res = this.iterateFrom(start).next()
            if (res.done) {
                throw new IndexError('index out of range')
            }
            else {
                return res.value
            }
        }
        else {
            // TODO: Need to convert bounds to handle negative values
            return new LazySubsequence(...sliceBounds(this, { start, stop }))
        }
    }
    [Symbol.iterator]() {
        return this.iterateFrom(0)
    }
    count(value: T) {
        let i = 0
        for (const elt of this) {
            if (elt === value) {
                i++
            }
        }
        return i
    }
    index(value: T, start?: number, stop?: number) {
        ({ start, stop } = sliceBounds(this, { start, stop }))
        let i = start
        const it = this.iterateFrom(start)
        let res = it.next()
        while (!res.done && i < stop) {
            if (res.value === value) return i
            res = it.next()
            i++
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

class LazySubsequence<T> extends AbstractLazySequence<T> {
    static minSize = 1000
    
}
class LazyConcatenation<T> extends AbstractLazySequence<T> {
}
