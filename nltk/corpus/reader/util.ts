import { AbstractLazySequence } from '../../collections'
import { PathPointer, SeekableUnicodeStreamReader } from '../../data'
import stream = require('stream')
import fs = require('fs')
export type Map<T> = { [s: string]: T }
type Token = string & { __tokenTag: any } // TODO: This is a temporary guess!
type FileId = string | PathPointer
abstract class StreamBackedCorpusView extends AbstractLazySequence<Token[]> {
    toknum = [0]
    filepos: number[]
    len: number | undefined
    stream: SeekableUnicodeStreamReader
    currentToknum: number | undefined
    currentBlocknum: number | undefined
    eofpos: number
    cache: {
        startToknum: number,
        endToknum: number,
        tokens: Token[] | undefined
    }
    constructor(private fileid: string | PathPointer,
                blockReader?: (x: stream.Readable) => Token[],
                startpos = 0,
                private encoding = 'utf8') {
        super()
        if (blockReader) {
            this.readBlock = blockReader;
        }
        this.filepos = [startpos]
        // TODO: Don't really need to catch and rethrow this error like in the original I think
        this.eofpos = typeof this.fileid === 'string' ? fs.statSync(this.fileid).size : this.fileid.file_size()
        this.cache = { startToknum: -1, endToknum: -1, tokens: undefined }
    }
    abstract readBlock(x: stream.Readable): Token[];
    private open() {
        if (typeof this.fileid !== 'string') {
            this.stream = this.fileid.open(this.encoding)
        }
        else if (this.encoding) {
            this.stream = new SeekableUnicodeStreamReader(fs.createReadStream(this.fileid, { encoding: this.encoding }), this.encoding)
        }
        else {
            // TODO: Maybe just use a simple wrapper for Readable that provides
            // seek and tell. But that's actually pretty complicated,
            // so for now I just use SeekableUnicodeStreamReader like the others.
            const x = fs.createReadStream(this.fileid, { encoding: 'utf8' })
            this.stream = new SeekableUnicodeStreamReader(x, 'utf8')
        }
    }

    // TODO: I'm going to leave this unimplemented until I know that it's needed
    // (and therefore how it will be used.)
    // close() {
    //     if (this.stream !== undefined) {
    //         this.stream.close()
    //     }
    //     this.stream = undefined
    // }

    get length() {
        return 0
    }
    iterateFrom() {
    }
}
