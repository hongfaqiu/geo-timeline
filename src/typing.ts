/** geo time data intervals schema **/
export type IntervalItem = {
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

export interface GeoTimeLineOptions {
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
  transition?: number
}