import { expect } from 'chai';
import fs from 'fs';

import { GeoTimeLine } from '../src/index'
import { createDiv, injectDom } from './jsdom';

describe('GeoTimeLine tests', async () => {
  injectDom()
  const intervals = JSON.parse(fs.readFileSync('assets/GTS_2020.json', 'utf-8'))

  const timeLine = new GeoTimeLine(createDiv(), intervals, {
    transition: 0,
    time: 1000,
    maxZoom: 10
  })

  it('create ready', () => {
    expect(timeLine.ready).eql(true)
  })

  it('initial time', () => {
    expect(timeLine.time).eql(1000)
  })

  it('set level', () => {
    timeLine.level = 2.5
    expect(timeLine.level).eql(2.5)
    timeLine.level = 11
    expect(timeLine.level).eql(10)
    timeLine.level = 0
    expect(timeLine.level).eql(1)
  })

  it('set time', () => {
    timeLine.time = 1000
    expect(timeLine.time).eql(1000)
    expect(() => { timeLine.time = 10000 }).to.throw('Time value out of range: [0, 4000]')
    expect(() => { timeLine.time = -1 }).to.throw('Time value out of range: [0, 4000]')
  })

})