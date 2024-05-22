import { expect } from 'chai';
import fs from 'fs';

import { GeoTimeSlider } from '../src/index'
import { createDiv, injectDom } from './jsdom';

describe('GeoTimeSlider tests', async () => {
  injectDom()
  const intervals = JSON.parse(fs.readFileSync('assets/GTS_2020.json', 'utf-8'))

  const timeSlider = new GeoTimeSlider(createDiv(), intervals, {
    transition: 0
  })

  it('create ready', () => {
    expect(timeSlider.ready).eql(true)
  })

  it('initial stage', () => {
    expect(timeSlider.stage).eql('Geologic Time')
  })

  it('set time range', () => {
    timeSlider.timeRange = [100, 300]
    expect(timeSlider.timeRange).eql([300, 100])
  })

})