# geo-timeline

A D3.js-based geologic time line
![geo-timeline](img/geo-timeline.png)

## Install

```bash

```

### Usage

```ts
import GeoTimeLine from "../lib/index.module.js";

const geoTimeLine = new GeoTimeLine("#geoTimeFullWidth", {
  time: 0,
  onChange: (val) => {
    console.log(val)
  }
});
```

### API

```ts
class GeoTimeLine {
  /**
   * Create a GeoTimeLine
   * @param selector CSS selector string
   * @param options
   */
  constructor(selector: string, options?: GeoTimeLineOptions);
  /** get or set time */
  get time(): number;
  set time(val: number);
  /**
   * set time and update handle's position
   * @param {boolean} time
   * @return {boolean} success or not
   */
  setTime(time: number): boolean;
}

interface GeoTimeLineOptions {
    width?: number;
    height?: number;
    tickLength?: number;
    neighborWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    onChange?: (time: number) => void;
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
    time?: number;
}
```

## Demo

Lunch [index.html](index.html) with node server, if use VS Code, suggest the ``Live Server`` extension.
