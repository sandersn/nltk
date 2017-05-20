/// <reference path="../../typings/jasmine.d.ts"/>
import { abc } from './index'

describe('abc', () => {
    it('passes a fake test', () => {
        expect(abc()).toEqual('this is a fake example'.split(/ /))
    })
})
