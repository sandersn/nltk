export interface LazySequence<T> {
    get(start: number, stop: number): LazySequence<T>
    get(i: number): T
    length: number
    iterateFrom(n: number): Iterator<T>
}
export interface Slice {
    start: number
    stop: number
    step?: number
}
