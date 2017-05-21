import { Map } from './util'
import { PathPointer } from '../../data'
/**
 * A base class for "corpus reader" classes, each of which can be
 * used to read a specific corpus format.  Each individual corpus
 * reader instance is used to read a specific corpus, consisting of
 * one or more files under a common root directory.  Each file is
 * identified by its `file identifier`, which is the relative path
 * to the file from the root directory.
 *
 * A separate subclass is defined for each corpus format.  These
 * subclasses define one or more methods that provide 'views' on the
 * corpus contents, such as `words()` (for a list of words) and
 * `parsed_sents()` (for a list of parsed sentences).  Called with
 * no arguments, these methods will return the contents of the entire
 * corpus.  For most corpora, these methods define one or more
 * selection arguments, such as `fileids` or `categories`, which can
 * be used to select which portion of the corpus should be returned.
 */
export class CorpusReader {
    constructor(
        // TODO: import { PathPointer and friends } from '../data'
        root: PathPointer | string,
        fileids: string[] | RegExp,
        encoding: string | [RegExp, string][] | Map<string> | undefined = 'utf8',
        tagset?: string) {
    }
}
