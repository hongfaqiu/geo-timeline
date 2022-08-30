import intervals from './GTS_2020.json'
import * as d3 from 'd3'
import { drag, interval, partition, stratify, ZoomTransform } from 'd3';

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
  onChange?: (time: number, stage: string[]) => void;
  onAfterChange?: (time: number, stage: string[]) => void;
  intervals?: IntervalItem[];
  margin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }
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
      ...options
    }
    this._width = opts.width
    this._height = opts.height
    this._options = opts

    this.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    this.hierarchicalData = stratify<IntervalItem>()(intervals).sum((d) =>
      d.leaf ? d.start - d.end : 0
    )

    this.maxLevel = this.hierarchicalData.height
    this.minIntervals = this.getMinIntervalAllLeveles(intervals)

    this.root = partition<IntervalItem>()
      .size([opts.width, (opts.height - opts.margin.bottom) * this.maxLevel])
      .padding(0)(this.hierarchicalData);
    
    this.svg = d3.select(selector)
      .append("svg")
      .attr("viewBox", [0, 0, opts.width, opts.height])
      .style("font", this.font)
      .style("overflow", 'hidden')
    
    this._canvas = document.createElement('canvas')

    this.intervals = opts.intervals

    this.init()
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
    const { width, height, margin, neighborWidth } = this._options
    const font = this.font
    const svg = this.svg
    const data = this.intervals
    const self = this
    let level = 1
    const startTime = this.root.data.start
    const endTime = this.root.data.end
    const timeLength = startTime - endTime
    let nowTime = startTime - timeLength / 2
    let transformX = 0

    // draw cells
    const globalScale = width / timeLength

    const g = svg.append('g')
      .attr('y', margin.top)
      .attr('x', margin.left)
      .attr('cursor', 'grab')

    const handleHeight = height - margin.top - margin.bottom
    const cellGroup = g.append("g").attr("id", "cells");
    const rect = cellGroup
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => timeLength - d.start)
      .attr('width', d => d.start  - d.end)
      .attr('height', handleHeight)
      .attr('fill', d => d.color)
    
    // drag handle
    let handleX = width / 2
    const angleHeight = handleHeight / 4
    const handle = svg.append('g')

    handle.append('line')
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", handleHeight)
      .attr("stroke", "#FC4C02")
      .attr("stroke-width", 2)
      .attr("cursor", "ew-resize")

    handle.append('path')
      .attr("fill", 'red')
      .attr('d', `M 0 0 L ${angleHeight} 0 L${angleHeight / 2} ${angleHeight} Z`)
      .attr("transform", `translate(${-angleHeight / 2}, 0)`)

    handle.append('path')
      .attr("fill", 'red')
      .attr('d', `M 0 0 L ${angleHeight} 0 L${angleHeight / 2} ${-angleHeight} Z`)
      .attr("transform", `translate(${-angleHeight / 2}, ${handleHeight})`)

    handle
      .call(drag()
        .on("drag", dragged))

    // draw axis 
    const xAxis = d3
      .scaleLinear()
      .domain([0, timeLength])
      .range([0, width])

    const axis = svg.append('g')
    
    let zoomedScale = xAxis.copy();

    function setHandle(time: number) {
      handleX = transformX / (timeLength * level) * width + (startTime - time) / timeLength * width
      handle.attr("transform", `translate(${handleX}, 0)`)
    }

    function getTimeByPos(x: number) {
      const time = transformX / (timeLength * level) * width * timeLength + x / width * timeLength
      return time
    }

    const rectVisible = (d: IntervalItem) => {
      const data = this.hierarchicalData.find(item => +item.id === d.id)
      const dataLevel = (data.data.level ?? 0)
      return (dataLevel === ~~level || ((data.children ?? []).length === 0 && dataLevel < level)) ? 1 : 0
    }

    function dragged(e: CursorPos) {
      handleX += e.dx
      handle.attr("transform", `translate(${handleX}, 0)`)
      nowTime = getTimeByPos(handleX)
    }
    
    const extent: [[number, number], [number, number]] = [[0, 0], [width, 0]]
    const scaleRadio = width / timeLength
    const scaleExtent: [number, number] = [scaleRadio, this.maxLevel * scaleRadio]
    const translateExtent: [[number, number], [number, number]] = [[0, 0], [timeLength, 0]]

    const zoom = d3.zoom()
      .extent(extent)
      .scaleExtent(scaleExtent)
      .translateExtent(translateExtent)
      .on('zoom', zoomed)
    
    function zoomed(e) {
      const transform: ZoomTransform = e.transform
      const { k, x, y } = transform

      const minInterval = self.minIntervals[1]
      const lastLevel = ~~(k * timeLength / width)
      const nowLevel = k * timeLength / width
      const nextLevel = lastLevel + 1
      const lastZoom = minInterval / self.minIntervals[lastLevel]
      const nextZoom = minInterval / self.minIntervals[nextLevel]
      const radio = ((nextZoom - lastZoom) * (nowLevel - ~~nowLevel) + lastZoom)
      
      const newx = x - ((k * radio - k) * width)
      cellGroup.attr('transform', 'translate(' + x + ' 0) scale(' + (k) + ' 1)')
      transformX = newx
      level = nowLevel
      // setHandle(nowTime)

      rect
        .transition()
        .style('display', d => rectVisible(d) ? 'block' : 'none')
        
      zoomedScale = transform.rescaleX(xAxis);
      drawScale(zoomedScale);

      handleX = zoomedScale(nowTime / scaleRadio)
      handle.attr("transform", `translate(${handleX}, 0)`)

    }

    svg.call(zoom)
    svg.call(zoom.scaleBy, globalScale)

    function drawScale(scale: d3.ScaleLinear<number, number, never>) {
      axis.selectAll("g").remove();

      let axisGroup = axis
        .append("g")
        .attr("class", "axisSegment");
      
      let axisGenerator = d3
        .axisBottom(scale)
        .ticks(4)
        .tickFormat(d => {
          const time = timeLength - +d * scaleRadio
          return time + 'Ma'
        })
        .tickSizeInner(height - margin.top - margin.bottom)
        .tickSizeOuter(0);
      axisGenerator(axisGroup);

      function addTicks(tickArg, length) {
        axisGroup
          .selectAll(".tick")
          .data(scale.ticks(tickArg), (d: any) => d)
          .enter()
          .append("line")
          .attr("class", "tick")
          .attr("stroke", "currentColor")
          .attr("y1", 0)
          .attr("y2", length || 8)
          .attr("x1", scale)
          .attr("x2", scale);
      }

      addTicks(12, 20);
      addTicks(100, 8);
    }
  }

}

