import { expect } from 'chai';
import fs from 'fs';

import { GeoTimeScale } from '../src/index'
import { createDiv, injectDom } from './jsdom';

describe('GeoTimeScale tests', async () => {
  injectDom()
  const intervals = JSON.parse(fs.readFileSync('assets/GTS_2020.json', 'utf-8'))

  const timeScale = new GeoTimeScale(createDiv(), intervals, {
    transition: 0
  })

  it('create ready', () => {
    expect(timeScale.ready).eql(true)
  })

  it('initial stage', () => {
    expect(timeScale.stage).eql('Geologic Time')
  })

  it('set stage', () => {
    timeScale.stage = 'Cenozoic'
    expect(timeScale.stage).eql('Cenozoic')
    timeScale.stage = 'Cenoz'
    expect(timeScale.stage).eql('Cenozoic')
  })

  it('get sequence', () => {
    timeScale.stage = 'Tortonian'
    const sequenceNames = timeScale.sequence.map(item => item.data.name)
    expect(sequenceNames).eql([
      'Geologic Time',
      'Phanerozoic',
      'Cenozoic',
      'Neogene',
      'Miocene',
      'Tortonian'
    ])
  })

})