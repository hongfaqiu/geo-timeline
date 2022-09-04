# geo-timeline

A D3.js(v7) based geologic timeline

![geo-timeline](img/geo-timeline.png)

- ``Zoom:`` Use the mouse wheel to control zoom, double-click to zoom in.
- ``Adjustment:`` Hold down the left button to drag the timeline.
- ``Positioning:`` Left click the timeline to move the handler quickly, or drag to move the handler.

## Install

For node.js

```bash
#npm
npm install --save @zjugis/geo-timeline
#yarn
yarn add @zjugis/geo-timeline
```

Or in a browser

```html
<script src="//unpkg.com/@zjugis/geo-timeline@latest"></script>
```

### Usage

For node.js

```ts
import GeoTimeLine from "@zjugis/geo-timeline";

const geoTimeLine = new GeoTimeLine("#geoTimeContainer", {
  time: 0,
  onChange: function(time, level) {
    console.log(time, level)
  }
});
```

Or in a browser

```js

const timeLine = new geoTimeLine("#geoTimeContainer");
```

### API

```ts
class GeoTimeLine {
  /**
   * Create a GeoTimeLine
   * @param selector CSS selector string
   * @param {number} [options.width] svg width, defaults to container's width
   * @param {number} [options.height = 70] svg height, defaults to 100px
   * @param {number} [options.fontSize = 16] font size, defaults to 16px
   * @param {string} [options.fontFamily = 'sans-serif'] font family, defaults to 'sans-serif'
   * @param {Function} [options.onChange] callback when handle's position or scale level changed
   * @param {IntervalItem[]} [options.intervals] geo time intervals array
   * @param {Object} [options.margin] svg margin, defaults to { top: 0, right: 0, bottom: 0, left: 0 }
   * @param {Object} [options.padding] svg padding, defaults to { top: 0, right: 0, bottom: 0, left: 0 }
   * @param {number} [options.time = 0] initial time, defaults to 0
   * @param {number} [options.transition = 450] animation time, defaults to 450ms
   * @param {Function} [options.intervalSum] interval transform setting, defaults to (d) => d.leaf ? 1 : 0
   */
  constructor(selector: string, options?: GeoTimeLineOptions);
  /** get or set time */
  get time(): number;
  set time(val: number);
  /** get or set level */
  get level(): number;
  set level(val: number);
}

interface GeoTimeLineOptions {
  /** svg width, defaults to container's width */
  width?: number;
  /** svg height, defaults to 70 */
  height?: number;
  /** font size, defaults to 16px */
  fontSize?: number;
  /** font family, defaults to 'sans-serif' */
  fontFamily?: string;
  /** callback when handle's position or scale level changed */
  onChange?: (time: number, level: number) => void;
  /** geo time intervals array */
  intervals?: IntervalItem[];
  /** defaults to {
    top: 0, right: 0, bottom: 0, left: 0,
  } */
  margin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }
  /** defaults to {
    top: 0, right: 0, bottom: 0, left: 0,
  } */
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }
  /** initial time, defaults to 0 */
  time?: number;
  /** animation time, defaults to 450ms */
  transition?: number;
  /** interval transform setting, defaults to (d) => d.leaf ? 1 : 0 */
  intervalSum?: (d: IntervalItem) => number
}

/** geo time data intervals schema **/
type IntervalItem = {
  id: number;
  name: string;
  abbr?: string;
  color: string;
  textColor?: string;
  end: number;
  start: number;
  level?: number;
  parentId?: number;
  leaf?: boolean;
}

```

## Custom data

The interval item's schema like follow:

```json
{
  "id": 753,
  "name": "Archean",
  "level": 1,
  "parentId": 0,
  "color": "#F0047F",
  "end": 2500,
  "start": 4000
}
```

## Demo

[Online demo](https://geo-timeline.vercel.app/)

## Develop

Run the command:

```bash
npm run dev
```

And then Launch [index.html](index.html) with node server, if use VS Code, suggest the ``Live Server`` extension.

## Credit

<https://github.com/UW-Macrostrat/geo-timescale>
