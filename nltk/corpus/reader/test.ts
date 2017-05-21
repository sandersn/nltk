/// <reference path="../../../typings/jasmine.d.ts"/>
import { PlainTextReader } from './plaintext'

describe('PlainTextReader', () => {
    it('passes a fake test', () => {
        expect(new PlainTextReader().plain).toEqual('this is a fake example'.split(/ /))
    })
})
