import { HierarchyNode, HierarchyRectangularNode } from "d3-hierarchy";
import type { Selection } from "d3-selection";
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
declare type NodeItem = HierarchyRectangularNode<IntervalItem> & {
    target?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        visible: boolean;
    };
};
export default class GeoTimeLine {
    private _options;
    readonly font: string;
    readonly svg: Selection<SVGSVGElement, unknown, HTMLElement, any>;
    readonly hierarchicalData: HierarchyNode<IntervalItem>;
    private _focus;
    private _sequence;
    private _width;
    private _height;
    private _hideSmallTicks;
    readonly root: NodeItem;
    g: Selection<SVGGElement, unknown, HTMLElement, any>;
    cell: Selection<any, NodeItem, SVGGElement, unknown>;
    rect: Selection<SVGRectElement, NodeItem, SVGGElement, unknown>;
    private _canvas;
    readonly maxLevel: number;
    minWidthItemInLevel: {
        [key: number]: {
            item: NodeItem;
            width: number;
        };
    };
    /**
     * Create a GeoTimeLine
     * @param selector CSS selector string
     * @param options
     */
    constructor(selector: string, options?: GeoTimeLineOptions);
    get focus(): NodeItem;
    get sequence(): NodeItem[];
    minWidthItemAllLevel(root: NodeItem): {
        [key: number]: {
            item: NodeItem | null;
            width: number;
        };
    };
    init(): void;
    getTextWidth(text: string, font: string): number;
}
export {};
