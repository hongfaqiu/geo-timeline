import { expect } from 'chai';
import { JSDOM } from "jsdom";

import { GeoTimeLine, GeoTimeScale } from '../src/index'
import intervals from '../assets/GTS_2020.json'

describe('Create obj', () => {
  before(() => {
    const window = new JSDOM("").window;
    global.document = window.document;
    global.navigator = window.navigator;
    global.Node = window.Node;
    global.NodeList = window.NodeList;
    global.HTMLCollection = window.HTMLCollection;
    global.SVGElement = window.SVGElement;
    // @ts-ignore
    window.HTMLCanvasElement.prototype.getContext = () => {
      return {
        measureText: function () {
          return { width: 0 };
        },
      };
    };
  })

  it('create geotimeLine', () => {
    const div = document.createElement('div')
    div.style.width = '1000px'
    const timeLine = new GeoTimeLine(div, intervals, {
      time: 1000
    })
    expect(timeLine.time).equal(1000)
  })

  it('create geotimeScale', () => {
    const div = document.createElement('div')
    const timeScale = new GeoTimeScale(div, intervals)
    expect(timeScale.stage).equal('Geologic Time')
  })
})