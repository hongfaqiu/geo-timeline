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
    onChange?: (time: number, stage: string[]) => void;
    onAfterChange?: (time: number, stage: string[]) => void;
    intervals?: IntervalItem[];
    margin?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
    };
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
    /**
     * Create a GeoTimeLine
     * @param selector CSS selector string
     * @param options
     */
    constructor(selector: string, options?: GeoTimeLineOptions);
    init(): void;
    getTextWidth(text: string, font: string): number;
}
export {};
