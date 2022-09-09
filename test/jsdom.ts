import { JSDOM } from "jsdom";

export function injectDom() {
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
}

export function createDiv() {
  const div = document.createElement('div')
  div.style.width = '1000px'
  return div
}