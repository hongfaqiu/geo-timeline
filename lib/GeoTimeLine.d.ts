import * as d3 from 'd3';
declare type IntervalItem = {
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
};
interface GeoTimeLineOptions {
    width?: number;
    height?: number;
    tickLength?: number;
    neighborWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    onChange?: (time: number, stage?: string[]) => void;
    onAfterChange?: (time: number, stage?: string[]) => void;
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
export default class GeoTimeLine {
    private _options;
    readonly font: string;
    private _width;
    private _height;
    private _canvas;
    readonly maxLevel: number;
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    intervals: IntervalItem[];
    hierarchicalData: d3.HierarchyNode<IntervalItem>;
    root: d3.HierarchyRectangularNode<IntervalItem>;
    minWidthItemInLevel: any;
    minIntervals: {
        [key: number]: number;
    };
    private _time;
    private _timeLength;
    private _scaleRadio;
    private _scaleVal;
    private _level;
    private _startTime;
    private _endTime;
    private _handle;
    private _zoomedScale;
    private _onChange;
    /**
     * Create a GeoTimeLine
     * @param selector CSS selector string
     * @param options
     */
    constructor(selector: string, options?: GeoTimeLineOptions);
    /** get or set time */
    get time(): number;
    set time(val: number);
    getMinIntervalAllLeveles(data: IntervalItem[]): {
        [key: number]: number;
    };
    init(): void;
    /**
     * draw handle
     * @param svg
     * @returns
     */
    private _drawHandle;
    /**
     * draw rect
     */
    private _drawRect;
    /** draw axis scale */
    private _drawScale;
    /** update rect's visible by level */
    private _updateRectVisible;
    /**
     * set time and update handle's position
     * @param {boolean} time
     * @return {boolean} success or not
     */
    setTime(time: number): boolean;
    /**
     * change handle's position and update time
     * @param zoomedScale
     * @param handle
     * @param x mouse x position offset svg
     * @returns update success or not
     */
    private _changeHandlePos;
}
export {};
