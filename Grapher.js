"use strict";

/** @namespace */
var cr = cr || {};

/**
 * @class
 * @constructor
 */
cr.Grapher = function() {
    this._isAdded = true; // should maybe be false
    this._isAnimated = false;
    this._updateHandler = null;
    this._requestAnimationFrameId = null;
    this.timeGraphAxis = null;
    this.plotContainer = null;
    this.plotContainers = {};

    function simpleBindShim(thisArg, func) {
        return function() {
            func.apply(thisArg);
        };
    }

    this._requestUpdateFunction = simpleBindShim(this, this._update);

    this.bounds = {
        xmin : Number.MAX_VALUE,
        xmax : -Number.MAX_VALUE,
        ymin : Number.MAX_VALUE,
        ymax : -Number.MAX_VALUE
    };
    this.view = {
        xmin : this.bounds.xmin,
        xmax : this.bounds.xmax,
        ymin : this.bounds.ymin,
        ymax : this.bounds.ymax
    };
    this.lastMouse;
    this.lastTouch;
};

cr.Grapher.prototype.addPlotContainer = function(plotContainer) {
    this.plotContainer = plotContainer;
    this.plotContainers[plotContainer.div.id] = plotContainer;
};

cr.Grapher.prototype._requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        return window.setTimeout(callback, 1000 / 60);
    };

cr.Grapher.prototype._cancelAnimFrame =
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    function(requestId) {
    };

cr.Grapher.prototype.setAnimate = function(animate) {
    this._isAnimated = !!animate;

    if (this._isAnimated) {
        console.log('scheduling update');
        this.scheduleUpdate();
    }
};

cr.Grapher.prototype.isAnimated = function() {
    return this._isAnimated;
};

cr.Grapher.prototype._update = function() {
    this._requestAnimationFrameId = null;

    if (!this._isAdded) {
        return;
    }

    if (this._isAnimated) {
        this.scheduleUpdate();
    }

    if (this._needsResize && this._resizeHandler) {
        this._needsResize = false;
        this._resizeHandler();
    }

    if (this.timeGraphAxis) {
        this.timeGraphAxis.update();
    }

    if (this.plotContainers) {
        var keys = Object.keys(this.plotContainers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var plotContainer = this.plotContainers[key];
            plotContainer.update();
            if (this.plotContainer._needsUpdate) {
                this.scheduleUpdate();
            }
        }
    }

    if (this._updateHandler) {
        this._updateHandler();
    }
};

cr.Grapher.prototype.scheduleUpdate = function() {
    if (this._isAdded && !this._requestAnimationFrameId) {
        this._requestAnimationFrameId =
            this._requestAnimFrame.call(window, this._requestUpdateFunction);
    }
};

cr.Grapher.prototype.resize = function() {
    console.log('resize');
    if (this.timeGraphAxis) {
        this.timeGraphAxis.resize();
    }
    if (this.plotContainer) {
        this.plotContainer.resize();
    }
    if (this.plotContainers) {
        var keys = Object.keys(this.plotContainers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var plotContainer = this.plotContainers[key];
            plotContainer.resize();
        }
    }

    this.scheduleUpdate();
};

cr.Grapher.prototype.update = function() {
    this._update();
};

var __grapher__ = new cr.Grapher();

/**
 * The min and max values for an axis's range.
 *
 * @typedef {Object} AxisRange
 * @property {number} min - the range min
 * @property {number} max - the range max
 */

/**
 * The function which the datasource function will call upon success, giving it the tile JSON.
 *
 * @callback datasourceSuccessCallbackFunction
 * @param {object|string} json - the tile JSON, as either an object or a string
 */

/**
 * Datasource function with signature <code>function(level, offset, successCallback)</code> resposible for
 * returning tile JSON for the given <code>level</code> and <code>offset</code>.
 *
 * @callback datasourceFunction
 * @param {number} level - the tile's level
 * @param {number} offset - the tile's offset
 * @param {datasourceSuccessCallbackFunction} successCallback - success callback function which expects to be given the tile JSON
 */

/**
 * Creates a <code>DateAxis</code>.
 *
 * @class
 * @constructor
 * @param {string} elementId - the DOM element ID for the container div holding the date axis
 * @param [orientation] currently ignored, will always be horizontal
 * @return {cr.TimeGraphAxis}
 */
var DateAxis = function(elementId, orientation) {
    return new cr.TimeGraphAxis(document.getElementById(elementId), null, null, cr.Basis.XAxisBasis, true);
};

/**
 * Creates a <code>NumberAxis</code>.
 *
 * @class
 * @constructor
 * @param {string} elementId - the DOM element ID for the container div holding the axis
 * @param {string} orientation - string specifying whether the axis is horizontal or vertical. Will be vertical if orientation <code>vertical</code>, otherwise will be horizontal.
 * @param {AxisRange} [range] - optional range, defaults to [<code>-Number.MAX_VALUE</code>, <code>Number.MAX_VALUE</code>]
 * @return {cr.GraphAxis}
 */
var NumberAxis = function(elementId, orientation, range) {
    var basis, isXAxis;
    range = range || { min : -1 * Number.MAX_VALUE, max : Number.MAX_VALUE };
    if (orientation == "vertical") {
        basis = cr.Basis.YAxisBasis;
        isXAxis = false;
    }
    else {
        basis = cr.Basis.XAxisBasis;
        isXAxis = true;
    }
    return new cr.GraphAxis(document.getElementById(elementId), range.min, range.max, basis, isXAxis);
};

/**
 * Creates a <code>DataSeriesPlot</code>.
 *
 * @class
 * @constructor
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 * @param {cr.TimeGraphAxis} horizontalAxis - the date axis
 * @param {cr.GraphAxis} verticalAxis - the y axis
 * @param {object} [options] - additional options, currently unused
 * @return {cr.Plot}
 */
var DataSeriesPlot = function(datasource, horizontalAxis, verticalAxis, options) {
    return new cr.Plot(datasource, horizontalAxis, verticalAxis, options);
};

/**
 * Creates a <code>PlotContainer</code>.
 *
 * @class
 * @constructor
 * @param {string} elementId - the DOM element ID for the container div holding this plot container
 * @param {boolean} ignoreClickEvents - whether to ignore click events, currently ignored
 * @param {cr.Plot[]} plots - array of plots to be added to the plot container
 * @param {object} [options] - additional optional options
 * @return {cr.SeriesPlotContainer}
 */
var PlotContainer = function(elementId, ignoreClickEvents, plots, options) {
    return new cr.SeriesPlotContainer(elementId, plots, options)
};

var SequenceNumber = function() {
};
SequenceNumber.getNext = function() {
    console.log("SequenceNumber is deprecated");
    return 1;
};

document.addEventListener('DOMContentLoaded', function() {
    var wnd = wnd || window.parent;
    wnd.grapherLoad && wnd.grapherLoad();
}, false);
