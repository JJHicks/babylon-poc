
import * as d3 from "d3";
import _ from "lodash";

export class TimeGraph {

    private _data: TimeChartDataPoint[];
    private _height: number;
    private _width: number;

    private _svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    private _marginF: margin;
    private _marginC: margin;
    private _widthF: number;
    private _heightF: number;
    private _heightC: number;

    private _xF: d3.ScaleTime<number, number, never>;
    private _xC: d3.ScaleTime<number, number, never>;
    private _yF: d3.ScaleLinear<number, number, never>;
    private _yC: d3.ScaleLinear<number, number, never>;

    private _xAxisF: d3.Axis<Date>;
    private _xAxisC: d3.Axis<Date>;
    private _yAxisF: d3.Axis<number>;

    private _brush: d3.BrushBehavior<unknown>;
    private _zoom: d3.ZoomBehavior<any, TimeChartDataPoint>;
    private _areaF: d3.Area<TimeChartDataPoint>;
    private _areaC: d3.Area<TimeChartDataPoint>;

    private _focus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _context: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

    private _zoombrush: number;   
    private _brushzoom: number;

    constructor(width: number, height: number) {
        this._data = [];
        this._width = width;
        this._height = height;
        this._init();
    }

    public updateData(data: TimeChartDataPoint[]){
        this._data = data;

        this._focus.select("path")
            .datum(this._data)
            .join("path");

        this._context.select("path")
            .datum(this._data)
            .join("path");

        this._setDomains();

        this._context.select(".axis--x").call(this._xAxisC as any);
        this._context.select(".area").attr("d", this._areaC);
        this._focus.select(".axis--y").call(this._yAxisF as any);
        this._brushed(null);
    }

    private _init() {

        // let parseDate = d3.timeParse("%b %Y");

        for (let i = 0; i < 1000; i++) {
            let date = Date.now();
            date += i * 60000;
            let point = {
                // date: parseDate(new Date(date))),
                date: new Date(date),
                value: (Math.random() * 200) - 100
            }
            this._data.push(point);
        };

        this._svg = d3.select("svg");
        this._svg.attr("width", this._width);
        this._svg.attr("height", this._height);
        this._marginF = { top: 20, right: 15, bottom: this._height * .3, left: 30 };
        this._marginC = { top: this._height * .8, right: 15, bottom: 30, left: 30 };
        this._widthF = +this._svg.attr("width") - this._marginF.left - this._marginF.right;
        this._heightF = +this._svg.attr("height") - this._marginF.top - this._marginF.bottom;
        this._heightC = +this._svg.attr("height") - this._marginC.top - this._marginC.bottom;
        this._zoombrush = 0;

        let parseDate = d3.timeParse("%b %Y");

        this._xF = d3.scaleTime().range([0, this._widthF]);
        this._xC = d3.scaleTime().range([0, this._widthF]);
        this._yF = d3.scaleLinear().range([this._heightF, 0]);
        this._yC = d3.scaleLinear().range([this._heightC, 0]);

        this._xAxisF = d3.axisBottom<Date>(this._xF);
        this._xAxisC = d3.axisBottom<Date>(this._xC);
        this._yAxisF = d3.axisLeft<number>(this._yF);

        this._brush = d3.brushX<TimeChartDataPoint>()
            .extent([[0, 0], [this._widthF, this._heightC]])
            .on("brush end", e => this._brushed(e));

        this._zoom = d3.zoom<any, TimeChartDataPoint>()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [this._widthF, this._heightC]])
            .extent([[0, 0], [this._widthF, this._heightF]])
            .on("zoom", e => this._zoomed(e));

        this._areaF = d3.area<TimeChartDataPoint>()
            .curve(d3.curveMonotoneX)
            .x(d => this._xF(d.date))
            .y0(this._heightF)
            .y1(d => this._yF(d.value))

        this._areaC = d3.area<TimeChartDataPoint>()
            .curve(d3.curveMonotoneX)
            .x(d => this._xF(d.date))
            .y0(this._heightC)
            .y1(d => this._yC(d.value))

        this._svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this._widthF)
            .attr("height", this._heightF);

        this._focus = this._svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + this._marginF.left + "," +this._marginF.top + ")");

        this._context = this._svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + this._marginC.left + "," + this._marginC.top + ")");

        this._setDomains();

        this._focus.append("path")
            .datum(this._data)
            .attr("class", "area")
            .attr("d", this._areaF);

        this._focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + this._heightF + ")")
            .call(this._xAxisF);

        this._focus.append("g")
            .attr("class", "axis axis--y")
            .call(this._yAxisF);

        this._context.append("path")
            .datum(this._data)
            .attr("class", "area")
            .attr("d", this._areaC);

        this._context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + this._heightC + ")")
            .call(this._xAxisC);

        this._context.append("g")
            .attr("class", "brush")
            .call(this._brush)
            .call(this._brush.move, this._xF.range());

        this._svg.append("rect")
            .attr("class", "zoom")
            .attr("width", this._widthF)
            .attr("height", this._heightF)
            .attr("transform", "translate(" + this._marginF.left + "," + this._marginF.top + ")")
            .call(this._zoom);

        // function type(d: DataPoint) {
        //     // d.date = parseDate(d.date);
        //     d.date = d.date;
        //     d.value = +d.value;
        //     return d;
        // }
    }

    private _setDomains(){
        this._xF.domain(d3.extent(this._data, d => d.date));
        this._yF.domain(d3.extent(this._data, d => d.value));
        this._xC.domain(this._xF.domain());
        this._yC.domain(this._yF.domain());
    }

    private _brushed(event?: d3.D3BrushEvent<TimeChartDataPoint>) {

        // It seems a manual method of avoid a zoom -> brush -> zoom event loop is required as zoom.transform does not have an argument
        // set the source event and avoid the loop that way
        if(this._zoombrush) return;
        this._zoombrush = 1;

        let s: any = event?.selection || this._xC.range();
        this._xF.domain(s.map(this._xC.invert, this._xC));
        this._focus.select(".area").attr("d", this._areaF);
        this._focus.select(".axis--x").call(this._xAxisF as any);
        this._svg.select(".zoom").call(this._zoom.transform as any, d3.zoomIdentity.scale(this._widthF / (s[1] - s[0]))
            .translate(-s[0], 0));

        this._zoombrush = 0;
    }

    private _zoomed(event: d3.D3ZoomEvent<any, TimeChartDataPoint>) {            
        // if (event.sourceEvent && event.sourceEvent.type === "brush") return;
        if(this._brushzoom) return;
        this._brushzoom = 1;

        let t = event.transform;
        this._xF.domain(t.rescaleX(this._xC).domain());
        this._focus.select(".axis--x").call(this._xAxisF as any);
        this._context.select(".brush").call(this._brush.move as any, this._xF.range().map(t.invertX, t), event);
        this._brushzoom = 0;
    }
    
}

interface margin{
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface TimeChartDataPoint {
    date: Date,
    value: number
}