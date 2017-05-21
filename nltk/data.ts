// TODO: Maybe this should be somewhere else
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

class SeekableUnicodeStreamReader {
}
