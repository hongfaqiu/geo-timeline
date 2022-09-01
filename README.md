# geo-timeline

A D3.js(v7) based geologic time line
![geo-timeline](img/geo-timeline.png)

## Install

The module is under development

```bash

```

### Usage

```ts
import GeoTimeLine from "../lib/index.module.js";

const geoTimeLine = new GeoTimeLine("#geoTimeFullWidth", {
  time: 0,
  onChange: function(time, level) {
    console.log(time, level)
  }
});
```

### API

```ts
class GeoTimeLine {
  /**
   * Create a GeoTimeLine
   * @param selector CSS selector string
   * @param {number} [options.width = 960] svg width, defaults to 960px
   * @param {number} [options.height = 960] svg height, defaults to 100px
   * @param {number} [options.fontSize = 12] font size, defaults to 12px
   * @param {string} [options.fontFamily = 12] font family, defaults to 'sans-serif'
   * @param {Function} [options.onChange] callback when handle's position or scale level changed
   * @param {IntervalItem[]} [options.intervals] geo time intervals array
   * @param {Object} [options.margin] svg margin
   * @param {Object} [options.padding] svg padding
   * @param {number} [options.time = 0] initial time, defaults to 0
   * @param {number} [options.transition = 450] animation time, defaults to 450ms
   */
  constructor(selector: string, options?: GeoTimeLineOptions);
  /** get or set time */
  get time(): number;
  set time(val: number);
  /** get or set level */
  get level(): number;
  set level(val: number);
  /**
   * input target x and level, reset svg
   * @param {number} [t.x = 0] target x, defaults 0
   * @param {number} [t.k] target level, defaults now level
   * @return {boolean} transform success or not
   */
  transform(t: {
      x?: number;
      k?: number;
  }): boolean;
  /**
   * set time and update handle's position
   * @param {boolean} time
   * @return {boolean} success or not
   */
  setTime(time: number): boolean;
}

interface GeoTimeLineOptions {
  /** svg width, defaults to 960 */
  width?: number;
  /** svg height, defaults to 100 */
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  /** callback when handle's position or scale level changed */
  onChange?: (time: number, level: number) => void;
  onAfterChange?: (time: number, level: number) => void;
  /** geo time intervals array */
  intervals?: IntervalItem[];
  margin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** initial time, defaults to 0 */
  time?: number;
  /** animation time, defaults to 450ms */
  transition?: number;
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

## Demo

[Online demo](https://geo-timeline.vercel.app/)

## Develop

Run the command:

```bash
npm run dev
```

And then Lunch [index.html](index.html) with node server, if use VS Code, suggest the ``Live Server`` extension.
