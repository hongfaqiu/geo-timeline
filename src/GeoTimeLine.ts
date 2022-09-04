import intervals from './GTS_2020.json'
import { D3DragEvent, drag, partition, pointer, stratify, Selection, ZoomTransform, select, scaleLinear, zoom as d3zoom, BaseType, transition, ScaleLinear, HierarchyNode, Transition, ZoomBehavior } from 'd3';
import { GeoTimeLineOptions, IntervalItem, NodeItem } from './typing';

const DefaultOpts: Required<GeoTimeLineOptions> = {
  width: 960,
  height: 70,
  fontSize: 16,
  fontFamily: 'sans-serif',
  onChange: undefined,
  intervals: intervals,
  margin: {
    top: 0, right: 0, bottom: 0, left: 0,
  },
  padding: {
    top: 0, right: 0, bottom: 0, left: 0,
  },
  time: 0,
  transition: 450,
  intervalSum: (d) => d.leaf ? 1 : 0
}

export default class GeoTimeLine {
  private _options: Required<GeoTimeLineOptions>
  readonly font: string;
  private _width: number;
  private _height: number;
  private _canvas: HTMLCanvasElement;
  readonly maxLevel: number;
  readonly svg: Selection<SVGSVGElement, unknown, HTMLElement, any>;
  readonly intervals: IntervalItem[];
  readonly hierarchicalData: HierarchyNode<IntervalItem>;
  readonly root: NodeItem;
  minWidthItemInLevel: any;
  minIntervals: { [key: number]: number; };
  private _time: number;
  private _timeLength: number;
  private _scaleRadio: number;
  private _scaleVal: number;
  private _level: number;
  private _startTime: number;
  private _endTime: number;
  private _handle: Selection<SVGGElement, unknown, HTMLElement, any>;
  private _zoomedScale: ScaleLinear<number, number, never>;
  private _onChange: (time: number, level: number) => void;
  private _ready: boolean;
  private _xAxis: any;
  private _cellGroup: Selection<SVGGElement, unknown, HTMLElement, any>;
  private _heightScale: number;
  private _zoomWidth: number;
  private _minZoom: number;
  private _maxZoom: number;
  private _zoomHeight: number;
  private _zoom: ZoomBehavior<Element, unknown>;
  private _interval: number;
  private _cell: Selection<SVGGElement | BaseType, NodeItem, SVGGElement, unknown>;
  private _rect: Selection<SVGRectElement, NodeItem, SVGGElement, unknown>;
  private _text: Selection<SVGTextElement, NodeItem, SVGGElement, unknown>;
  private _ticks: Selection<SVGGElement, NodeItem, SVGGElement, unknown>;

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
  constructor(selector: string, options: GeoTimeLineOptions = {}) {
    const opts: Required<GeoTimeLineOptions> = {
      ...DefaultOpts,
      margin: {
        ...DefaultOpts.margin,
        ...options.margin
      },
      padding: {
        ...DefaultOpts.padding,
        ...options.padding
      },
      width: +select(selector).style('width').split('px')[0],
      ...options
    }
    const { width, height, margin, padding } = opts
    this._width = width
    this._height = height
    this._heightScale = height / DefaultOpts.height
    this._zoomWidth = width - margin.left - margin.right
    this._zoomHeight = height - margin.top - margin.bottom

    this._options = opts
    this._time = opts.time
    this._onChange = opts.onChange

    this.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    this.hierarchicalData = stratify<IntervalItem>()(intervals).sum(this._options.intervalSum)

    this.maxLevel = this.hierarchicalData.height
    this.minIntervals = this.getMinIntervalAllLeveles(intervals)

    this._minZoom = this._zoomWidth / (this._zoomWidth + padding.right + padding.left)
    this._maxZoom = 10

    this.root = partition<IntervalItem>()
      .size([width, (height - opts.margin.bottom) * this.maxLevel])
      .padding(0)(this.hierarchicalData)
      
    this.root.each(d => {
      d.target = {
        x0: d.x0,
        x1: d.x1
      }
      d.visible = false
    })
    
    this._startTime = this.root.data.start
    this._endTime = this.root.data.end
    this._timeLength = Math.abs(this._startTime - this._endTime)
    this._scaleRadio = this._width / (this.root.x1 - this.root.x0)
    this._scaleVal = (this._timeLength - this._time)

    this.svg = select(selector)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("font", this.font)
      .style("overflow", 'hidden')
    
    this._canvas = document.createElement('canvas')

    this.intervals = opts.intervals
    this._ready = false

    this._init()
  }

  /** get or set time */
  get time() {
    return this._time
  }

  set time(val: number) {
    if (this._setTime(val))
      this._time = val
  }

  /** get or set level */
  get level() {
    return this._level
  }

  set level(val: number) {
    let level = val
    if (val < this._minZoom) level = this._minZoom
    if (val > this._maxZoom) level = this._maxZoom
    this._zoom.scaleTo(this.svg, level)
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
  
  private _init() {
    const self = this
    const { width, height, margin, padding } = self._options
    const svg = self.svg
    const startTime = self.root.data.start
    const endTime = self.root.data.end
    const timeLength = startTime - endTime

    // draw cells
    self._cellGroup = svg
      .append("g")
      .attr("id", "cells")
      .attr("transform", `translate(0, ${margin.top})`)

    self._cell = self._cellGroup
      .selectAll("g")
      .data(self.root.descendants())
      .join("g")
    
    self._rect = self._drawRect(self._cell)
    
    // draw axis 
    self._xAxis = scaleLinear()
      .domain([self._endTime, self._startTime])
      .range([
        margin.left - padding.left,
        width - margin.right + padding.right
      ])

    self._zoomedScale = self._xAxis.copy()

    // draw text
    self._text = self._drawText(self._cell)
    self._ticks = self._addTicks(self._cell)

    // drag handle
    self._handle = self._drawHandle(svg)
    self._handle
      .call(drag()
        .on("drag", dragged)
        .on("end", () => {
          self._handle.attr("cursor", "grab");
          clearInterval(self._interval)
        }))
    
    this._ready = true

    function dragged(e: D3DragEvent<Element, unknown, unknown>) {
      self._changeHandlePos(self._zoomedScale, self._handle, self._zoomedScale(self._scaleVal) + e.dx)
      self._handle.attr("cursor", "grabbing")
    }
    
    // zoom function
    const extent: [[number, number], [number, number]] = [
      [margin.left, margin.top],
      [width - margin.right, height - margin.top]
    ]
    const scaleExtent: [number, number] = [self._minZoom, self._maxZoom]
    const translateExtent: [[number, number], [number, number]] = [[self.root.x0, 0], [self.root.x1, 0]]

    self._zoom = d3zoom()
      .extent(extent)
      .scaleExtent(scaleExtent)
      .translateExtent(translateExtent)
      .on('zoom', zoomed)
      .on("end", () => {
        self._cellGroup.attr("cursor", "default");
      })
    
    function zoomed(e: { transform: ZoomTransform; }) {
      const transform: ZoomTransform = e.transform

      if (transform.k === self._level) {
        self._cellGroup.attr("cursor", "grabbing");
      }

      self._transform(transform)
    }

    svg.call(self._zoom)
    svg.call(self._zoom.scaleBy, self._scaleRadio)
      .on("click", chooseTime);
    
    function chooseTime(e: PointerEvent) {
      const x = pointer(e)[0]
      self._changeHandlePos(self._zoomedScale, self._handle, x)
    }
    
  }

  /**
   * draw handle
   * @param svg 
   * @returns 
   */
  private _drawHandle(svg: Selection<SVGSVGElement, unknown, HTMLElement, any>) {
    const handle = svg
      .append('g')
      .attr("cursor", 'grab')

    let handleShape =
      "M0 0 l 15 20 v 18 q 0 5 -5 5 h -20 q -5 0 -5 -5 v -18 l 15 -20";
    handle
      .append("path")
      .attr("fill", "#ccc")
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#333")
      .attr("stroke-width", "1px")
      .attr("d", handleShape)

    // Add stripes for texture
    function addStripe(x: number) {
      handle
        .append("rect")
        .attr("fill", "#515151")
        .attr("width", 3)
        .attr("height", 16)
        .attr("x", x)
        .attr("y", 21);
    }

    addStripe(-7.5);
    addStripe(-1.5);
    addStripe(4.5);

    return handle
  }

  /**
   * draw rect
   */
  private _drawRect(cell: typeof this._cell) {
    return cell
      .append("rect")
      .attr('height', this._zoomHeight)
      .attr('fill', d => d.data.color)
  }

  private _getTextWidth(text: string, font: string) {
    // re-use canvas object for better performance
    const context = this._canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);

    return metrics.width;
  }

  /** draw text */
  private _drawText(cell: typeof this._cell) {
    const text = cell
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("y", this._zoomHeight / 2)
      .attr("fill", (d) => d.data.textColor ?? "black")
      .attr("opacity", 0.8)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
    
    return text
  }

  private _addTicks(cell: typeof this._cell) {
    const ticks = cell
      .append('g')
      .attr('id', 'tick')
    
    const y = (this._zoomHeight - this._options.fontSize) * 0.8

    ticks
      .append("line")
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", y)
    
    ticks
      .append("text")
      .attr("x", 0)
      .attr("y", y + this._options.fontSize)
      .attr("font-size", (d) => `${1 - 0.05 * d.data.level}em`)
      .text((d) => d.data.start + 'ma')
      .attr("text-anchor", d => d.data.start === this._startTime ? 'start' : 'middle')
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 1)
      .attr("stroke", "white")
    
    return ticks
  }

  /**
   * reset svg by transform
   */
  private _transform(transform: ZoomTransform): boolean {
    if (!this._ready) {
      throw Error(`svg initial uncomplete`)
    }

    let { k, x } = transform

    const trans = transition().duration((this._level !== k && k > this._minZoom && k < this._maxZoom) ? this._options.transition : 0)

    if (this._level !== k) {
      const scale = k * this._scaleRadio

      this.root.each(d => {
        d.target = {
          x0: d.x0 * scale,
          x1: d.x1 * scale
        }
        const dataLevel = (d.data.level ?? 0)
        d.visible = (dataLevel === ~~k || ((d.children ?? []).length === 0 && dataLevel < k))
        
        // if (this.minIntervals[~~k] && this.minIntervals[~~k] * scale)
      })

      this._rect
        .transition(trans)
        .attr('width', d => (d.target.x1 - d.target.x0))
        .attr('x', d => (d.target.x0))

      this._text
        .transition(trans)
        .attr("x", (d) => {
          const textX = (d.target.x0 + (d.target.x1 - d.target.x0) / 2);
          return Number.isNaN(textX) ? 0 : textX;
        })
        .text((d) => {
          const rectWidth = Math.abs(d.target.x1 - d.target.x0);
          const labelWidth = this._getTextWidth(d.data.name, this.font);
          const abbrev = d.data.abbr || d.data.name.charAt(0);

          return rectWidth - 10 < labelWidth ? abbrev : d.data.name;
        });
      
      this._ticks
        .transition(trans)
        .attr("transform", (d) => {
          const x = (d.target.x0)
          return `translate(${x}, 0)`
        })

      this._cell
        .transition(trans)
        .style('opacity', d => d.visible ? 1 : 0)
      
      this._level = k

      if (this._onChange) {
        this._onChange(this._time, this._level)
      }
    }

    const { margin } = this._options
    this._cellGroup
      .transition(trans)
      .attr('transform', `translate(${x}, ${margin.top})`)
    
    this._zoomedScale = transform.rescaleX(this._xAxis);

    this._changeHandlePos(this._zoomedScale, this._handle, this._zoomedScale(this._scaleVal), trans)

    return true
  }

  /**
   * set time and update handle's position
   * @param {boolean} time
   * @return {boolean} success or not
   */
  private _setTime(time: number): boolean {
    if (!this._ready) {
      throw Error(`svg initial uncomplete`)
    }

    const minTime = Math.min(this._endTime, this._startTime)
    const maxTime = Math.max(this._endTime, this._startTime)
    if (time < minTime || time > maxTime) {
      throw Error(`Time value out of range: [${minTime}, ${maxTime}]`)
    }

    const node = this.root.find(node => node.visible && node.data.start >= time && node.data.end <= time)
    const xx = node.target.x0 + (node.target.x1 - node.target.x0) * (node.data.start - time) / (node.data.start - node.data.end)
    const scaleX = xx / (this.root.target.x1 - this.root.target.x0) * this._timeLength
    const newx = this._zoomedScale(scaleX)

    const bool = this._changeHandlePos(this._zoomedScale, this._handle, newx)
    return bool
  }

  /**
   * change handle's position and update time
   * @param zoomedScale 
   * @param handle 
   * @param x mouse x position offset svg
   * @returns update success or not
   */
  private _changeHandlePos(zoomedScale: ScaleLinear<number, number, never>, handle: Selection<SVGGElement, unknown, HTMLElement, any>, x: number, trans?: Transition<BaseType, unknown, null, undefined>): boolean {
    let scaleX = zoomedScale.invert(x)
    if (scaleX < 0) scaleX = 0
    if (scaleX > this._timeLength) scaleX = this._timeLength
    
    handle
      .transition(trans ?? transition().duration(0))
      .attr("transform", `translate(${x}, ${this._options.margin.top}), scale(${this._heightScale})`)
    this._scaleVal = scaleX

    const handleX = scaleX * this._width / this._timeLength

    const node = this.root.find(node => node.visible && node.x0 <= handleX && node.x1 >= handleX)
    this._time = (node.data.start - (node.data.start - node.data.end) * (handleX - node.x0 ) / (node.x1 - node.x0))

    if (this._onChange) {
      this._onChange(this._time, this._level)
    }
    return true
  }

}