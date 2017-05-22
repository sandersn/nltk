/// <reference path="../../../typings/jasmine.d.ts"/>
/// <reference path="../../../typings/node.d.ts"/>
import pickRandom = require('pick-random')
import { SeekableUnicodeStreamReader } from '../../data'

/**
 * @param min inclusive minimum
 * @param max inclusive maximum
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) - min)
}

function checkReader(unicodeString: string, encoding: string, n = 1000) {
    // TODO: Not sure how to encode arbitrary bytes in a JS string --
    // there is no equivalent of a pure-unicode type like in Python 3
    const stream = Buffer.from(unicodeString, encoding)
    // TODO: not sure whether it's supposed to be stream.bytesLength instead
    const strlen = unicodeString.length
    const reader = new SeekableUnicodeStreamReader(stream, encoding)
    // find all character positions
    const chars: [number, string][] = []
    while (true) {
        const pos = reader.tell()
        chars.push([pos, reader.read(1)])
        // TODO: This hangs the test right now because reader.read isn't implemented and returns undefined
        if (chars[chars.length - 1][1] === '') {
            break
        }
    }
    const strings = new Map(chars.map(([pos,_]) => [pos, ''] as [number, string]))
    for (const [pos1, char] of chars) {
        for (const [pos2, _] of chars) {
            if (pos2 <= pos1) {
                strings.set(pos2, strings.get(pos2) + char)
            }
        }
    }
    while (true) {
        const op = pickRandom('tsrr'.split(''))[0]
        switch (op) {
        case 't':
            reader.tell()
            break
        case 's':
            const newPos = pickRandom(chars.map(([p,c]) => p))[0]
            reader.seek(newPos)
            break
        case 'r':
            const pos = Math.random() < 0.3 ? reader.tell() : undefined
            const size = Math.random() < 0.2 ? undefined :
                Math.random() < 0.8 ? randomInt(0, Math.floor(strlen / 6)) :
                randomInt(0, strlen + 20)
            const s = Math.random() < 0.8 ? reader.read(size) : reader.readline(size)
            if (pos !== undefined) {
                expect(strings).toContain(pos)
                expect(strings.get(pos)!.startsWith(s)).toBeTruthy()
                n -= 1
                if (n === 0) {
                    return
                }
            }
            break
        }
    }
}
// TODO: node supports ascii, utf8, utf16le/ucs2, base64, latin1/binary, hex
// hex and base64 are 'exotic' encodings designed for specialty output
const ENCODINGS = ['ascii', 'latin1', 'greek', 'hebrew', 'utf-16', 'utf-8']

const STRINGS = [
    `
    This is a test file.
    It is fairly short.
    `,

    `This file can be encoded with latin1. ` + String.fromCodePoint(0x83),

    `This is a test file.
    Here's a blank line:

    And here's some unicode: \xee \u0123 \uffe3
    ` + String.fromCodePoint(0xEE, 0x20, 0x123, 0xffe3),

    `This is a test file.
     Unicode characters: ` +
        String.fromCodePoint(0xf3, 0x20, 0x2222, 0x20, 0x3333, 0x4444, 0x20, 0x5555) + '\n',
]

const LARGE_STRING =
`This is a larger file.  It has some lines that are longer \
than 72 characters.  It's got lots of repetition.  Here's \
some unicode chars: ` + String.fromCodePoint(0xee, 0x123, 0xffee3, 0xeeee, 0x2345) + `

How fun!  Let's repeat it twenty times.
`.repeat(10)



describe('SeekableUnicodeStreamReader', () => {
    it('reads', () => {
        for (const s of STRINGS) {
            for (const encoding of ENCODINGS) {
                checkReader(s, encoding)
            }
        }
    })
    it('reads a large file', () => {
        for (const encoding of ENCODINGS) {
            checkReader(LARGE_STRING, encoding)
        }
    })
})
