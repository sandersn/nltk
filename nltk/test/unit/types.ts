declare module 'pick-random' {
    function pickRandom<T>(l: T[], options? : { count: number }): T[];
    export = pickRandom
}
