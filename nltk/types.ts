export interface LazySequence<T> extends Iterable<T> {
    get(start: number, stop: number): LazySequence<T>
    get(i: number): T
    length: number
    iterateFrom(n: number): Iterable<T>
}
export interface Slice {
    start: number
    stop: number
    step?: number
}
