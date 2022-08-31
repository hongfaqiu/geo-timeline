import intervals from './GTS_2020.json'
import * as d3 from 'd3'
import { D3DragEvent, drag, DragBehavior, interval, partition, stratify, ZoomTransform } from 'd3';

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
  }
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }
  time?: number;
}

type CursorPos = {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default class GeoTimeLine {
  private _options: Required<GeoTimeLineOptions>
  readonly font: string;
  private _width: number;
  private _height: number;
  private _canvas: HTMLCanvasElement;
  readonly maxLevel: number;
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  intervals: IntervalItem[];
  hierarchicalData: d3.HierarchyNode<IntervalItem>;
  root: d3.HierarchyRectangularNode<IntervalItem>;
  minWidthItemInLevel: any;
  minIntervals: { [key: number]: number; };
  private _time: number;
  private _timeLength: number;
  private _scaleRadio: number;
  private _scaleVal: number;
  private _level: number;
  private _startTime: number;
  private _endTime: number;
  private _handle: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private _zoomedScale: d3.ScaleLinear<number, number, never>;
  private _onChange: (time: number, stage?: string[]) => void;

  /**
   * Create a GeoTimeLine
   * @param selector CSS selector string
   * @param options 
   */
  constructor(selector: string, options: GeoTimeLineOptions = {}) {
    const opts: Required<GeoTimeLineOptions> = {
      width: 960,
      height: 100,
      tickLength: 10,
      neighborWidth: 200,
      fontSize: 12,
      fontFamily: 'sans-serif',
      onChange: undefined,
      onAfterChange: undefined,
      intervals: intervals,
      margin: {
        top: 20, right: 20, bottom: 30, left: 30,
        ...options.margin
      },
      padding: {
        top: 20, right: 20, bottom: 30, left: 30,
        ...options.padding
      },
      time: 0,
      ...options
    }
    this._width = opts.width
    this._height = opts.height
    this._options = opts
    this._time = opts.time
    this._onChange = opts.onChange

    this.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    this.hierarchicalData = stratify<IntervalItem>()(intervals).sum((d) =>
      d.leaf ? d.start - d.end : 0
    )

    this.maxLevel = this.hierarchicalData.height
    this.minIntervals = this.getMinIntervalAllLeveles(intervals)

    this.root = partition<IntervalItem>()
      .size([opts.width, (opts.height - opts.margin.bottom) * this.maxLevel])
      .padding(0)(this.hierarchicalData);
    
    this._startTime = this.root.data.start
    this._endTime = this.root.data.end
    this._timeLength = Math.abs(this._startTime - this._endTime)
    this._scaleRadio = this._width / this._timeLength
    this._scaleVal = (this._timeLength - this._time)
    this._level = 1

    this.svg = d3.select(selector)
      .append("svg")
      .attr("viewBox", [0, 0, opts.width, opts.height])
      .style("font", this.font)
      .style("overflow", 'hidden')
    
    this._canvas = document.createElement('canvas')

    this.intervals = opts.intervals

    this.init()
  }

  /** get or set time */
  get time() {
    return this._time
  }

  set time(val: number) {
    if (this.setTime(val))
      this._time = val
  }

  getMinIntervalAllLeveles(data: IntervalItem[]) {
    const obj: {
      [key: number]: number
    } = {}
    for (const item of data) {
      const level = (item.level ?? 0)
      const length = Math.abs(item.start - item.end)
      if (!obj[level]) {
        obj[level] = length
      } else if (length < obj[level]) {
        obj[level] = length
      }
    }
    return obj
  }
  
  init() {
    const self = this
    const { width } = self._options
    const svg = self.svg
    const startTime = self.root.data.start
    const endTime = self.root.data.end
    const timeLength = startTime - endTime

    // draw cells
    const cellGroup = svg.append("g").attr("id", "cells");
    const rect = self._drawRect(cellGroup)
    
    // draw axis 
    const xAxis = d3
      .scaleLinear()
      .domain([self._endTime, self._startTime])
      .range([0, width])

    const axis = svg.append('g')

    self._zoomedScale = xAxis.copy();
    self._drawScale(axis, xAxis)

    // drag handle
    self._handle = self._drawHandle(svg)
    self._handle
      .call(drag()
        .on("drag", dragged)
        .on("end", () => {
          self._handle.attr("cursor", "grab");
        }))
    
    function dragged(e: D3DragEvent<Element, unknown, unknown>) {
      self._changeHandlePos(self._zoomedScale, self._handle, self._zoomedScale(self._scaleVal / scaleRadio) + e.dx)
      self._handle.attr("cursor", "grabbing")
    }
    
    // zoom function
    const extent: [[number, number], [number, number]] = [[0, 0], [width, 0]]
    const scaleRadio = width / timeLength
    const scaleExtent: [number, number] = [scaleRadio, self.maxLevel * scaleRadio]
    const translateExtent: [[number, number], [number, number]] = [[0, 0], [timeLength, 0]]

    const zoom = d3.zoom()
      .extent(extent)
      .scaleExtent(scaleExtent)
      .translateExtent(translateExtent)
      .on('zoom', zoomed)
    
    function zoomed(e) {
      const transform: ZoomTransform = e.transform
      const { k, x } = transform

      cellGroup.attr('transform', 'translate(' + x + ' 0) scale(' + (k) + ' 1)')
      
      self._level = k * timeLength / width

      self._updateRectVisible(rect, self._level)
        
      self._zoomedScale = transform.rescaleX(xAxis);
      self._drawScale(axis, self._zoomedScale);

      self._changeHandlePos(self._zoomedScale, self._handle, self._zoomedScale(self._scaleVal / scaleRadio))
    }

    svg.call(zoom)
    svg.call(zoom.scaleBy, self._scaleRadio)
      .on("click", chooseTime);
    
    function chooseTime(e: PointerEvent) {
      const x = d3.pointer(e)[0]
      self._changeHandlePos(self._zoomedScale, self._handle, x)
    }
    
  }

  /**
   * draw handle
   * @param svg 
   * @returns 
   */
  private _drawHandle(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) {
    const handle = svg
      .append('g')
      .attr("cursor", 'grab')

    let handleShape =
      "M0 0 l 15 20 v 18 q 0 5 -5 5 h -20 q -5 0 -5 -5 v -18 l 15 -20";
    handle
      .append("path")
      .attr("fill", "#ccc")
      .attr("fill-opacity", "0.85")
      .attr("stroke", "#333")
      .attr("stroke-width", "1px")
      .attr("d", handleShape);

    // Add stripes for texture
    function addStripe(x) {
      handle
        .append("rect")
        .attr("fill", "#515151")
        .attr("width", "3")
        .attr("height", "16")
        .attr("x", x)
        .attr("y", "21");
    }

    addStripe(-7.5);
    addStripe(-1.5);
    addStripe(4.5);

    return handle
  }

  /**
   * draw rect
   */
  private _drawRect(cellGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
    return cellGroup
      .selectAll('rect')
      .data(this.intervals)
      .join('rect')
      .attr('x', d => this._timeLength - d.start)
      .attr('width', d => d.start - d.end)
      .attr('height', this._height - this._options.margin.bottom)
      .attr('fill', d => d.color)
  }

  /** draw axis scale */
  private _drawScale(axis: d3.Selection<SVGGElement, unknown, HTMLElement, any>, scale: d3.ScaleLinear<number, number, never>) {
    axis.selectAll("g").remove();

    let axisGroup = axis
      .append("g")
      .attr("class", "axisSegment");

    let axisGenerator = d3
      .axisBottom(scale)
      .ticks(4)
      .tickFormat(d => {
        const time = this._timeLength - +d * this._scaleRadio
        return time + 'Ma'
      })
      .tickSizeInner(this._height - this._options.margin.top - this._options.margin.bottom)
      .tickSizeOuter(0);
    axisGenerator(axisGroup);

    function addTicks(count: number, length: number) {
      axisGroup
        .selectAll(".tick")
        .data(scale.ticks(count), (d: any) => d)
        .enter()
        .append("line")
        .attr("class", "tick")
        .attr("stroke", "currentColor")
        .attr("y1", 0)
        .attr("y2", length || 8)
        .attr("x1", scale)
        .attr("x2", scale);
    }

    addTicks(6, 20);
    addTicks(50, 8);
  }

  /** update rect's visible by level */
  private _updateRectVisible(rect: d3.Selection<d3.BaseType | SVGRectElement, IntervalItem, SVGGElement, unknown>, level: number) {
    rect
      .transition()
      .style('display', d => {
        const data = this.hierarchicalData.find(item => +item.id === d.id)
        const dataLevel = (data.data.level ?? 0)
        return (dataLevel === ~~level || ((data.children ?? []).length === 0 && dataLevel < level)) ? 'block' : 'none'
      })
  }

  /**
   * set time and update handle's position
   * @param {boolean} time
   * @return {boolean} success or not
   */
  setTime(time: number): boolean {
    if (!this._handle || !this._zoomedScale) {
      throw Error(`svg initial uncomplete`)
    }

    const minTime = Math.min(this._endTime, this._startTime)
    const maxTime = Math.max(this._endTime, this._startTime)
    if (time < minTime || time > maxTime) {
      throw Error(`Time value out of range: [${minTime}, ${maxTime}]`)
    }
    
    const newx = this._zoomedScale((this._timeLength - time) / this._scaleRadio)
    return this._changeHandlePos(this._zoomedScale, this._handle, newx)
  }

  /**
   * change handle's position and update time
   * @param zoomedScale 
   * @param handle 
   * @param x mouse x position offset svg
   * @returns update success or not
   */
  private _changeHandlePos(zoomedScale: d3.ScaleLinear<number, number, never>, handle: d3.Selection<SVGGElement, unknown, HTMLElement, any>, x: number): boolean {
    const scaleX = zoomedScale.invert(x) * this._scaleRadio
    if (scaleX < 0 || scaleX > this._timeLength) return false
    
    handle.attr("transform", `translate(${x}, 0)`)
    this._scaleVal = scaleX
    this._time = this._timeLength - this._scaleVal
    if (this._onChange) {
      this._onChange(this._time)
    }
    return true
  }

}

