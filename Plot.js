"use strict";

/** @namespace */
var cr = cr || {};

/**
 *
 * @class
 * @constructor
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 * @param {cr.TimeGraphAxis} xAxis - the date axis
 * @param {cr.GraphAxis} yAxis - the y axis
 * @param {object} [options] - additional options, currently unused
 */
cr.Plot = function(datasource, xAxis, yAxis, options) {
    //    this.highlight = new cr.Highlight(plotDiv);

    //    this.cursor = new cr.Cursor(plotDiv);
    this.point = null;

    // Create a unique ID for this plot. Using a UUID instead of Date.now() because Safari (and
    // sometimes Chrome) is too fast and generates 2 plots within the same millisecond.  Crazy.
    this.id = 'plot:' + xAxis.getId() + ':' + yAxis.getId() + ':' + cr.Plot.prototype.getUuid();

    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.datasource = datasource;
    this.view = {};
    this.bounds = {
        xmin : Number.MAX_VALUE,
        xmax : -Number.MAX_VALUE,
        ymin : Number.MAX_VALUE,
        ymax : -Number.MAX_VALUE
    };

    this.view = {
        xmin : this.xAxis._min,
        xmax : this.xAxis._max,
        ymin : this.yAxis._min,
        ymax : this.yAxis._max
    };

    this.dataPointListeners = [];
    this._publishedPoint = null;
    this._resolutionScale = window.devicePixelRatio || 1;

    //this.tlayer = new DataStoreTileLayer(datasource, this.glb, this.ctx);
    //this._resize();
};

// Generate a UUID so we can be sure (enough) that plot IDs are unique.  Found this badassery at http://stackoverflow.com/a/2117523/703200
cr.Plot.prototype.getUuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

cr.Plot.prototype.limitView = function() {
    if (this.view.xmax - this.view.xmin > this.bounds.xmax - this.bounds.xmin) {
        // Tried to zoom out beyond bounds
        this.view.xmax = this.bounds.xmax;
        this.view.xmin = this.bounds.xmin;
    }
    else if (this.view.xmin < this.bounds.xmin) {
        // Tried to pan too far left
        this.view.xmax += this.bounds.xmin - this.view.xmin;
        this.view.xmin = this.bounds.xmin;
    }
    else if (this.view.xmax > this.bounds.xmax) {
        // Tried to pan too far right
        this.view.xmin -= this.view.xmax - this.bounds.xmax;
        this.view.xmax = this.bounds.xmax;
    }
};

cr.Plot.prototype._resize = function() {
    var canvasWidth = this.div.clientWidth * this._resolutionScale;
    var canvasHeight = this.div.clientWidthHeight * this._resolutionScale;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
        this.highlight._highlight.width = this.canvas2d.width = this.canvas3d.width = canvasWidth;
        this.highlight._highlight.height = this.canvas2d.height = this.canvas3d.height = canvasHeight;
        console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }

};

cr.Plot.prototype.drawCursorAndHighlight = function(view) {
    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = this.canvas2d.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = this.canvas2d.height / (view.ymin - view.ymax);
    if (this.showCursor) {
        this.cursor.draw(transform);
    }
    this.highlight._ctx.clearRect(0, 0, plot.canvas2d.width, plot.canvas2d.height);

    if (this.showHighlightLine) {
        this.highlight.drawLine(transform, view);
    }
    if (this.showHighlightPoint) {
        this.highlight.drawPoint(transform, view);
    }
    if (this.showHighlightMOPoint) {
        this.highlight.drawMOPoint(transform, view);
    }
};

cr.Plot.prototype.getId = function() {
    return this.id;
};

cr.Plot.prototype.getView = function() {
    return {
        xmin : this.xAxis._min,
        xmax : this.xAxis._max,
        ymin : this.yAxis._min,
        ymax : this.yAxis._max,
    }
};
cr.Plot.prototype.update = function() {
    this.tlayer.draw(this.getView());
    this._needsUpdate = this.tlayer._needsUpdate;
};

cr.Plot.prototype.addDataPointListener = function(listener) {
    this.dataPointListeners.push(listener);
};

cr.Plot.prototype.removeDataPointListener = function(listener) {
    for (var i = 0; i < this.dataPointListeners.length; i++) {
        if (this.dataPointListeners[i] == listener) {
            break;
        }
    }
    if (i < this.dataPointListeners.length) {
        var removed = this.dataPointListeners.splice(i, 1);
    }
};

cr.Plot.prototype.getClosestDataPointToTimeWithinWindow = function(timeInSecs, numSecsBefore, numSecsAfter) {
    var dataPoint = null;
    var point = this.tlayer.searchByX({ xmin : timeInSecs - numSecsBefore, xmax : timeInSecs + numSecsAfter });

    // point.y can be -Infinity at (I think) tile boundaries, so filter
    // those out. I threw in the isNaN check just in case.
    if (point && point.y != null && isFinite(point.y) && !isNaN(point.y)) {
        dataPoint = {
            date : point.x,
            value : point.y,
            dateString : cr.DateTimeFormatter.format(point.x * 1000),    // multiply by 1000 to get millis
            valueString : cr.ValueFormatter.format(point.y),
            comment : null
        }
    }
    return dataPoint;
};

// Publishes the given point, but only if it's different than the previously published point
cr.Plot.prototype.publishDataPoint = function(point) {
    if (point) {
        if (this._publishedPoint == null ||
            point.x != this._publishedPoint.x ||
            point.y != this._publishedPoint.y) {

            this._publishedPoint = {
                x : point.x,
                y : point.y,
                dateString : cr.DateTimeFormatter.format(point.x * 1000),    // multiply by 1000 to get millis
                valueString : cr.ValueFormatter.format(point.y),
                comment : null
            };

            for (var j = 0; j < this.dataPointListeners.length; j++) {
                this.dataPointListeners[j](this._publishedPoint);
            }
        }
    }
    else {
        if (this._publishedPoint != null) {
            this._publishedPoint = null;
            for (var k = 0; k < this.dataPointListeners.length; k++) {
                this.dataPointListeners[k](this._publishedPoint);
            }
        }
    }
};