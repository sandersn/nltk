// TODO: Maybe this should be somewhere else
import stream = require('stream')
import fs = require('fs')
export type FileId = string
/*
 * An abstract base class for 'path pointers,' used by NLTK's data
 * package to identify specific paths.  Two subclasses exist:
 * `FileSystemPathPointer` identifies a file that can be accessed
 * directly via a given absolute path.  `ZipFilePathPointer`
 * identifies a file contained within a zipfile, that can be accessed
 * by reading that zipfile.
 */
export abstract class PathPointer {
    /**
     * Return a seekable read-only stream that can be used to read
     * the contents of the file identified by this path pointer.
     *
     * :raise IOError: If the path specified by this pointer does
     * not contain a readable file.
     */
    abstract open(encoding?: string): SeekableUnicodeStreamReader
    /**
     * Return the size of the file pointed to by this path pointer,
     * in bytes.
     *
     * :raise IOError: If the path specified by this pointer does
     * not contain a readable file.
     */
    abstract file_size(): number
    /**
     * Return a new path pointer formed by starting at the path
     * identified by this pointer, and then following the relative
     * path given by `fileid`.  The path components of `fileid`
     * should be separated by forward slashes, regardless of
     * the underlying file system's path seperator character.
     */
    abstract join(fileid: FileId): PathPointer
}

/**
 * A stream reader that automatically encodes the source byte stream
 * into unicode (like ``codecs.StreamReader``); but still supports the
 * ``seek()`` and ``tell()`` operations correctly.  This is in contrast
 * to ``codecs.StreamReader``, which provide *broken* ``seek()`` and
 * ``tell()`` methods.
 *
 * This class was motivated by ``StreamBackedCorpusView``, which
 * makes extensive use of ``seek()`` and ``tell()``, and needs to be
 * able to handle unicode-encoded files.
 *
 * Note: this class requires stateless decoders.  To my knowledge,
 * this shouldn't cause a problem with any of python's builtin
 * unicode encodings.
 */
export class SeekableUnicodeStreamReader {
    static DEBUG = true
    decode: (...args: any[]) => string
    linebuffer: string[] | undefined = undefined
    private rewindCheckpoint = 0
    private rewindNumchars: number | undefined = undefined
    private position = 0


    constructor(public stream: stream.Readable, public encoding: string, public errors: 'strict' | 'ignore' | 'replace' = 'strict', public underlying?: string) {
        this.stream.setEncoding(encoding)
        // TODO: Add an an extra parameter called 'underlying' that is either
        // a string or a path, and then call fs.openSync to get a fileDescription
        //const fd = fs.openSync()
        //fs.createReadStream(, , , fd)
        // every time we want to seek backward
        // for the path, or just recreate the stream from the underlying string
    }
    tell(): number {
        return this.position
    }
    read(size: number | undefined = undefined): string {
        let chars = this.readHelper(size)
        if (this.linebuffer) {
            chars = this.linebuffer.join('') + chars
            this.linebuffer = undefined
            this.rewindNumchars = undefined
        }
        return chars
    }
    // this code is quite different because encoding works differently
    // and because node streams can't seek
    private readHelper(size: number | undefined = undefined): string {
        if (size === 0) {
            return ''
        }
        let first = ''
        // skip bom (this code is quite different)
        if (this.position === 0 && size !== 0) {
            let first = this.stream.read(1)
            if (typeof first !== 'string') {
                first = (first as Buffer).toString(this.encoding)
            }
            // BOM always gets translated to the UTF16 BOM, even if it was utf8
            if (first.charCodeAt(0) === 0xFEFF) {
                first = ''
                this.position = 1
            }
        }
        let chars = this.stream.read(first && size ? size - 1 : size)
        if (chars === null) {
            return ''
        }
        if (typeof chars !== 'string') {
            chars = (chars as Buffer).toString(this.encoding)
        }
        // TODO: This may not reflect the number of *bytes* read ok
        // so maybe I should only use chars.length when size is undefined
        this.position += chars.length
        return first + chars
    }
    private incrDecode(bytes: Buffer) {
        while (true) {
            try {
                return this.decode(bytes, 'strict')
            }
            // TODO: Need to check that it's a UnicodeDecodeError equivalent
            catch (e) {
                // TODO: bytes.length might be wrong
                if (e.end === bytes.length) {
                    return this.decode(bytes.slice(e.start), this.errors)
                }
                else if (this.errors === 'strict') {
                    throw e
                }
                else {
                    return this.decode(bytes, this.errors)
                }
            }
        }
    }
    //readline(n: number | undefined): string {
    //}
    seek(pos: number | undefined): void {
        if (pos === undefined) {
            throw new Error('Why is this even allowed?')
        }
        if (pos < this.position) {
            if (this.underlying === undefined) {
                throw new Error('Can\'t rewind streams without recreating them')
            }
            // recreate the stream and start over at 0
            // TODO: Also support files pretty soon
            this.position = 0
            this.stream = new stream.Readable()
            this.stream._read = () => { }
            this.stream.push(this.underlying)
            this.stream.push(null)
        }
        this.stream.read(pos - this.position)
        this.position = pos
    }
}
