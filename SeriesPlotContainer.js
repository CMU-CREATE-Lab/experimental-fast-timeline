"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Creates a <code>SeriesPlotContainer</code> to be rendered within the <code>div</code> with the given <code>elementId</code>.
 *
 * @class
 * @constructor
 * @param {string} elementId - the DOM element ID for the container div holding this plot container
 * @param {cr.Plot[]} plots - array of plots to be added to the plot container
 * @param {cr.TimeGraphAxis} dateAxis - the date axis
 * @param {object} [options] - additional optional options
 */
cr.SeriesPlotContainer = function(elementId, plots, dateAxis, options) {
    var that = this;
    options = options || {};
    this.div = document.getElementById(elementId);
    this.div.style["border"] = "1px solid black";
    this.highlightedPoints = [];
    this.cursorX = null;
    this._resolutionScale = window.devicePixelRatio || 1;
    this._plots = {};
    this._isAutoscaleEnabled = !!options.isAutoScaleEnabled;
    this._isAutoscalePaddingEnabled = !!options.isAutoscalePaddingEnabled;
    this._touchTargetPagePosition = null;
    this._xAxis = dateAxis;

    this.midnightLine = new cr.MidnightLine();

    if (plots) {
        for (var i = 0; i < plots.length; i++) {
            this.addPlot(plots[i]);
        }
    }

    this._initCanvases();
    try {
        //console.log("Using webgl...");
        this.gl = this.canvas3d.getContext('experimental-webgl');
        this.glb = new cr.Glb(this.gl);
        this.pointProgram = this.glb.programFromSources(cr.Shaders.PointVertexShader, cr.Shaders.PointFragmentShader);
        this.lineProgram = this.glb.programFromSources(cr.Shaders.TileVertexShader, cr.Shaders.TileFragmentShader);
        this.usewebgl = true;
    }
    catch (x) {
        this.gl = null;
        this.glb = null;
        this.usewebgl = false;
        //console.log("experimental-webgl unsupported");
    }

    if (this.grapher == null) {
        this.grapher = __grapher__;
    }
    this.grapher.addPlotContainer(this);

    this._previousTouches = null;

    this.touchUtils = new cr.TouchUtils();

    this._canvas = null;
    if (this.usewebgl) {
        this._canvas = this.canvas2d;
    }
    else {
        this._canvas = this.canvas3d;
    }
    var canvasElement = $('#' + this._canvas.id);
    canvasElement.bind('touchstart', this, this.touchstart);
    canvasElement.bind('touchmove', this, this.touchmove);
    canvasElement.bind('touchend', this, this.touchend);
    canvasElement.bind('touchcancel', this, this.touchend);

    this.resize();
};

cr.SeriesPlotContainer.prototype.getId = function() {
    return this.div.id;
};

cr.SeriesPlotContainer.prototype._initCanvases = function() {
    this.canvas3d = document.createElement("canvas");
    this.canvas3d.setAttribute("id", this.div.id + "-canvas3d");
    this.canvas3d.style["width"] = this.div.style["width"];
    this.canvas3d.style["height"] = this.div.style["height"];
    this.canvas3d.style["position"] = "absolute";
    this.div.appendChild(this.canvas3d);

    this.canvas2d = document.createElement("canvas");
    this.canvas2d.setAttribute("id", this.div.id + "-canvas2d");
    this.canvas2d.style["width"] = this.div.style["width"];
    this.canvas2d.style["height"] = this.div.style["height"];

    this.canvas2d.style["position"] = "absolute";

    this.div.appendChild(this.canvas2d);

    this.ctx = this.canvas2d.getContext('2d');

    var canvas2dElement = $('#' + this.canvas2d.id);
    canvas2dElement.mousedown(this, this.mousedown);
    canvas2dElement.mousemove(this, this.mousemove);
    canvas2dElement.mouseup(this, this.mouseup);
    canvas2dElement.on("mousewheel", this, this.mousewheel);

    var canvas3dElement = $('#' + this.canvas3d.id);
    canvas3dElement.mousedown(this, this.mousedown);
    canvas3dElement.mousemove(this, this.mousemove);
    canvas3dElement.mouseup(this, this.mouseup);
    canvas3dElement.on("mousewheel", this, this.mousewheel);

    this.lastMouse = null;
};

cr.SeriesPlotContainer.prototype.mousedown = function(e) {
    var that = e.data;
    that.lastMouse = e;

    var bbox = {
        xmin : e.offsetX - 5,
        xmax : e.offsetX + 5,
        ymin : e.offsetY + 5,
        ymax : e.offsetY - 5
    };

    Object.keys(that._plots).forEach(function(plotKey) {
        var plot = that._plots[plotKey];
        var coords = {};
        coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
        coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
        coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
        coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
        var point = plot.tlayer.search(coords);
        if (point) {
            plot.xAxis.setCursorPosition(point.x);
            that.grapher.scheduleUpdate();
        }
    });

    return false;
};

cr.SeriesPlotContainer.prototype.mousemove = function(e) {
    // If mouse button is up, we probably missed the up event when the mouse was outside
    // the window

    var that = e.data;
    if (!e.which) {
        var bbox = {
            xmin : e.offsetX - 5,
            xmax : e.offsetX + 5,
            ymin : e.offsetY + 5,
            ymax : e.offsetY - 5
        };

        Object.keys(that._plots).forEach(function(plotKey) {
            var plot = that._plots[plotKey];
            var coords = {};
            coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
            coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
            coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
            coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
            var point = plot.tlayer.search(coords);
            if (point) {
                that.mouseoverHighlightPoint = { point : point, plotKey : plotKey };
                that.grapher.scheduleUpdate();

                // publish the point
                plot.publishDataPoint(point);
            }
            else {
                // publish the point
                plot.publishDataPoint(null);

                if (that.mouseoverHighlightPoint) {
                    that.mouseoverHighlightPoint = null;
                    that.grapher.scheduleUpdate();
                }
            }
        });

        that.mouseup(e);
        return;
    }

    if (that.lastMouse) {
        // keep track of the X and Y axes to which we've applied the traslation, so that we
        // don't do it more than once per axis
        var hasXAxisBeenTransformed = {};
        var hasYAxisBeenTransformed = {};
        Object.keys(that._plots).forEach(function(plotKey) {
            var plot = that._plots[plotKey];

            if (!(plot.xAxis.id in hasXAxisBeenTransformed)) {
                plot.xAxis.translatePixels(e.clientX - that.lastMouse.clientX);

                hasXAxisBeenTransformed[plot.xAxis.id] = true;
            }

            if (!(plot.yAxis.id in hasYAxisBeenTransformed)) {
                plot.yAxis.translatePixels(that.lastMouse.clientY - e.clientY);

                hasYAxisBeenTransformed[plot.yAxis.id] = true;
            }
        });
        that.lastMouse = e;
    }
    return false;
};

cr.SeriesPlotContainer.prototype.mouseup = function(e) {
    var that = e.data;
    that.lastMouse = null;
};

cr.SeriesPlotContainer.prototype.mousewheel = function(e) {
    var that = e.data;

    Object.keys(that._plots).forEach(function(plotKey) {
        var plot = that._plots[plotKey];
        plot.xAxis.zoomAboutX(e.offsetX, Math.pow(1.0005, -e.originalEvent.deltaY));
        plot.yAxis.zoomAboutY(e.offsetY, Math.pow(1.0005, -e.originalEvent.deltaY));
    });
    return false;
};

cr.SeriesPlotContainer.prototype.touchstart = function(e) {
    var that = e.data;

    // we only care about touches on *this* element, so filter out any others, but only keep the first two since we
    // don't have any defined gestures for more than 2 touches
    that._previousTouches = cr.TouchUtils.filterTouchesForElement(e.originalEvent.touches, that._canvas.id).slice(0, 2);

    // Get the element's absolute position on the page.  We'll cache this if it's a pinch, but also use it if it's
    // only a single touch so we can compute  the cursor position.  See below for both.
    var elementPosition = cr.TouchUtils.getElementPagePosition(that.div);

    // if there are at least 2 touches on this element, cache the element's page position for use later
    // because it's probably a pinch event
    if (that._previousTouches.length >= 2) {
        that._touchTargetPagePosition = elementPosition;
    }

    // if there's only a single touch, then set the cursor
    if (that._previousTouches.length == 1) {
        // find the page position of the touch
        var touchPagePosition = that.touchUtils.centroid(that._previousTouches);

        // subtract away the element position to get a relative touch position within the element
        var touch = {
            x : touchPagePosition.x - elementPosition.x,
            y : touchPagePosition.y - elementPosition.y
        };
        var bbox = {
            xmin : touch.x - 15,
            xmax : touch.x + 15,
            ymin : touch.y + 15,
            ymax : touch.y - 15
        };
        Object.keys(that._plots).forEach(function(plotKey) {
            var plot = that._plots[plotKey];
            var coords = {};
            coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
            coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
            coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
            coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
            var point = plot.tlayer.search(coords);
            if (point) {
                plot.xAxis.setCursorPosition(point.x);
                that.grapher.scheduleUpdate();
            }
        });
    }

    return false;
};

cr.SeriesPlotContainer.prototype.touchmove = function(e) {
    var that = e.data;

    // we only care about touches on *this* element, so filter out any others, but only keep the first two since we
    // don't have any defined gestures for more than 2 touches
    var touches = cr.TouchUtils.filterTouchesForElement(e.originalEvent.touches, that._canvas.id).slice(0, 2);

    if (that._previousTouches && touches.length == that._previousTouches.length) {
        var touchesCentroid = that.touchUtils.centroid(touches);
        var previousTouchesCentroid = that.touchUtils.centroid(that._previousTouches);

        var dx = touchesCentroid.x - previousTouchesCentroid.x;
        var dy = previousTouchesCentroid.y - touchesCentroid.y;

        var xAxis = that._xAxis;

        // handle x translation
        xAxis.translatePixels(dx);

        // handle x zoom
        if (that.touchUtils.isXPinch(touches) && that.touchUtils.isXPinch(that._previousTouches)) {
            var x = touchesCentroid.x - that._touchTargetPagePosition.x;
            var xZoomScale = that.touchUtils.xSpan(touches) / that.touchUtils.xSpan(that._previousTouches);
            xAxis.zoomAboutX(x, xZoomScale);
        }

        // keep track of the Y axes to which we've applied the traslation/zoom, so that we
        // don't do it more than once per axis (for the case where multiple plots share a Y axis)
        var hasYAxisBeenTransformed = {};
        Object.keys(that._plots).forEach(function(plotKey) {
            var plot = that._plots[plotKey];

            if (!(plot.yAxis.id in hasYAxisBeenTransformed)) {
                // handle y translation
                plot.yAxis.translatePixels(dy);

                // handle y zoom
                if (that.touchUtils.isYPinch(touches) && that.touchUtils.isYPinch(that._previousTouches)) {
                    var y = touchesCentroid.y - that._touchTargetPagePosition.y;
                    var yZoomScale = that.touchUtils.ySpan(touches) / that.touchUtils.ySpan(that._previousTouches);
                    plot.yAxis.zoomAboutY(y, yZoomScale);
                }

                // flag this Y axis as having been translated/zoomed
                hasYAxisBeenTransformed[plot.yAxis.id] = true;
            }
        });
    }

    // remember the previous touches
    that._previousTouches = that.touchUtils.copyTouches(touches);
    return false;
};

cr.SeriesPlotContainer.prototype.touchend = function(e) {
    var that = e.data;
    that._previousTouches = null;
    return false;
};

/**
 * Pads the given range by 5% and returns the new range.  The given range is not modified.
 *
 * @private
 * @param {AxisRange} range
 * @return {AxisRange}
 */
cr.SeriesPlotContainer.prototype._padRange = function(range) {
    var paddedRange = {
        min : range.min,
        max : range.max
    };

    var yDiff = paddedRange.max - paddedRange.min;
    if (isFinite(yDiff)) {
        var padding;
        if (yDiff < 1e-10) {
            padding = 0.5;
        }
        else {
            padding = 0.05 * yDiff;
        }

        paddedRange.min -= padding;
        paddedRange.max += padding;
    }

    return paddedRange;
};

cr.SeriesPlotContainer.prototype.update = function() {
    if (!this.usewebgl) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    this.drawHighlight();

    // for each Y axis, we need to compute the min/max values for all plots associated with the Y axis.
    if (this._isAutoscaleEnabled) {
        var yAxisRanges = {};
        var timeRange = this._xAxis.getRange();

        // For each plot, we'll compute its min/max values and also figure out which Y axis it's associated with. For
        // each Y axis, we keep track of the absolute min/max for all plots
        for (var plotKey in this._plots) {
            var plot = this._plots[plotKey];
            var yAxis = plot.yAxis;

            // get the range for this Y axis (might be undefined if we haven't seen it before)
            var yAxisRange = yAxisRanges[yAxis.id];

            // compute the min/max value in the plot within the time range
            var minMaxValue = plot.tlayer.getMinMaxValue(timeRange);
            if (minMaxValue != null) {
                // update the global min/max for this Y axis
                if (typeof yAxisRange === 'undefined') {
                    yAxisRange = minMaxValue;
                    yAxisRanges[yAxis.id] = yAxisRange;
                }
                else {
                    yAxisRange.min = Math.min(minMaxValue.min, yAxisRange.min);
                    yAxisRange.max = Math.max(minMaxValue.max, yAxisRange.max);
                }
            }

            // set the Y axis range
            if (typeof yAxisRange !== 'undefined' && yAxisRange != null) {
                // pad the range, if desired
                if (this._isAutoscalePaddingEnabled) {
                    yAxisRange = this._padRange(yAxisRange);
                }
                yAxis.setRange(yAxisRange.min, yAxisRange.max);
            }
        }
    }

    // clear before drawing
    if (this.glb) {
        this.glb.clear();
    }

    // update the plots and create a map of the yAxes so we can
    // iterate over them later without updating each more than once
    var yAxesById = {};
    for (var plotKey in this._plots) {
        var plot = this._plots[plotKey];
        plot.update();
        yAxesById[plot.yAxis.id] = plot.yAxis;
    }

    // update the Y axes
    for (var yAxisId in yAxesById) {
        yAxesById[yAxisId].update();
    }

    this._needsUpdate = false;
    for (var plotKey in this._plots) {
        if (this._plots[plotKey]._needsUpdate) {
            this._needsUpdate = true;
            break;
        }
    }

    this.drawHighlight();
    this.drawMidnightLines();
    this.drawHighlightPoints();
    this.drawMouseoverHighlightPoint();
};

cr.SeriesPlotContainer.prototype.drawHighlightWebgl = function() {
    var xAxis = this._xAxis;
    var pMatrix = new Float32Array([1, 0, 0, 0,
                                    0, 1, 0, 0,
                                    0, 0, 1, 0,
                                    0, 0, 0, 1]);

    var xscale = 2 / (xAxis._max - xAxis._min);
    var xtranslate = -xAxis._min * xscale - 1;
    var gl = this.gl;
    gl.lineWidth(2 * this._resolutionScale);
    gl.useProgram(this.lineProgram);

    var matrixLoc = gl.getUniformLocation(this.lineProgram, 'u_pMatrix');
    gl.uniformMatrix4fv(matrixLoc, false, pMatrix);

    var lineArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.cursorX * xscale + xtranslate, 1, this.cursorX * xscale + xtranslate, -1]), gl.STATIC_DRAW);
    var attributeLoc = gl.getAttribLocation(this.lineProgram, 'a_position');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

    var colorLoc = gl.getUniformLocation(this.lineProgram, 'u_color');
    gl.uniform4f(colorLoc, 1.0, 0, 0, 1);

    gl.drawArrays(gl.LINES, 0, 2);
};

cr.SeriesPlotContainer.prototype.drawHighlightCanvas = function() {
    var xAxis = this._xAxis;
    this.ctx.beginPath();
    this.ctx.lineWidth = 2 * this._resolutionScale;
    this.ctx.strokeStyle = "rgb(255,0,0)";
    var scale = this.ctx.canvas.width / (xAxis._max - xAxis._min);
    var translate = -xAxis._min;
    this.ctx.moveTo(scale * (this.cursorX + translate), 0);
    this.ctx.lineTo(scale * (this.cursorX + translate), this.ctx.canvas.height);
    this.ctx.stroke();

};

cr.SeriesPlotContainer.prototype.drawHighlight = function() {
    var xAxis = this._xAxis;
    if (xAxis.cursorX) {
        if (this.cursorX != xAxis.cursorX) {
            this.cursorX = xAxis.cursorX;
            this.setHighlightPoints();
        }
        if (this.usewebgl) {
            this.drawHighlightWebgl();
        }
        else {
            this.drawHighlightCanvas();
        }
    }
};

cr.SeriesPlotContainer.prototype.drawMidnightLines = function() {
    var xAxis = this._xAxis;
    if (this.midnightLine.shouldDrawMidnightLines(xAxis)) {
        if (this.usewebgl) {
            this.drawMidnightLinesWebgl();
        }
        else {
            this.drawMidnightLinesCanvas();
        }
    }
};

cr.SeriesPlotContainer.prototype.drawMidnightLinesWebgl = function() {
    var xAxis = this._xAxis;
    var points = this.midnightLine.getLines(xAxis);
    var gl = this.gl;
    var pMatrix = new Float32Array([2 * this._resolutionScale / gl.canvas.width, 0, 0, 0,
                                    0, 1, 0, 0,
                                    0, 0, 1, 0,
                                    -1, 0, 0, 1]);

    gl.lineWidth(1 * this._resolutionScale);
    gl.useProgram(this.lineProgram);

    var matrixLoc = gl.getUniformLocation(this.lineProgram, 'u_pMatrix');
    gl.uniformMatrix4fv(matrixLoc, false, pMatrix);

    var lineArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    var attributeLoc = gl.getAttribLocation(this.lineProgram, 'a_position');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

    var colorLoc = gl.getUniformLocation(this.lineProgram, 'u_color');
    gl.uniform4f(colorLoc, .5, .5, .5, .7);

    gl.drawArrays(gl.LINES, 0, points.length / 2);
};

cr.SeriesPlotContainer.prototype.drawMidnightLinesCanvas = function() {
    // TODO: implement midnight lines for canvas
};

cr.SeriesPlotContainer.prototype.setHighlightPoints = function() {
    this.highlightedPoints = [];
    var xAxis = this._xAxis;
    var offset = xAxis.pixelToX(2) - xAxis.pixelToX(0);
    for (var plotKey in this._plots) {
        var points = this._plots[plotKey].tlayer.getPointsNearTimeWithinTimeRange(this.cursorX, offset, offset);
        var point = points && points.closestPoint ? points.closestPoint : null;

        if (point) {
            this.highlightedPoints.push({ point : point, plotKey : plotKey });
        }
    }
};

cr.SeriesPlotContainer.prototype.drawHighlightPointsWebgl = function() {
    var xAxis = this._xAxis;
    var points = [];
    var xscale = 2 / (xAxis._max - xAxis._min);
    var xtranslate = -xAxis._min * xscale - 1;

    for (var i = 0; i < this.highlightedPoints.length; i++) {
        var point = this.highlightedPoints[i];
        var view = this._plots[point.plotKey].getView();
        var yscale = 2 / (view.ymax - view.ymin);
        var ytranslate = -view.ymin * yscale - 1;
        points.push(point.point.x * xscale + xtranslate);
        points.push(point.point.y * yscale + ytranslate);
    }
    var gl = this.gl;
    gl.useProgram(this.pointProgram);
    var pMatrix = new Float32Array([1, 0, 0, 0,
                                    0, 1, 0, 0,
                                    0, 0, 1, 0,
                                    0, 0, 0, 1]);

    var matrixLoc = gl.getUniformLocation(this.pointProgram, 'u_pMatrix');
    gl.uniformMatrix4fv(matrixLoc, false, pMatrix);

    var pointArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    var attributeLoc = gl.getAttribLocation(this.pointProgram, 'a_position');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

    var colorLoc = gl.getUniformLocation(this.pointProgram, 'u_color');
    gl.uniform4f(colorLoc, 1.0, 0, 0, 1);

    gl.drawArrays(gl.POINTS, 0, points.length / 2);
};

cr.SeriesPlotContainer.prototype.drawHighlightPointsCanvas = function() {
    var xAxis = this._xAxis;
    var points = [];

    var xOffset = -xAxis._min;
    var xScale = this.ctx.canvas.width / (xAxis._max - xAxis._min);

    for (var i = 0; i < this.highlightedPoints.length; i++) {
        var point = this.highlightedPoints[i];
        var view = this._plots[point.plotKey].getView();
        var yOffset = -view.ymax;
        var yScale = this.ctx.canvas.height / (view.ymin - view.ymax);
        points.push({
            x : xScale * (point.point.x + xOffset),
            y : yScale * (point.point.y + yOffset)
        });
    }

    for (var i = 0; i < points.length; i++) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.arc(points[i].x, points[i].y,
                     2 * this._resolutionScale, 0, Math.PI * 2, true); // Outer circle
        this.ctx.fill();
    }
};

cr.SeriesPlotContainer.prototype.drawHighlightPoints = function() {
    var xAxis = this._xAxis;
    if (xAxis.cursorX) {
        if (this.usewebgl) {
            this.drawHighlightPointsWebgl();
        }
        else {
            this.drawHighlightPointsCanvas();
        }
    }
};

cr.SeriesPlotContainer.prototype.drawMouseoverHighlightPointWebgl = function() {
    var xAxis = this._xAxis;
    if (this.mouseoverHighlightPoint) {
        var points = [];
        var point = this.mouseoverHighlightPoint;
        var view = this._plots[point.plotKey].getView();
        var xscale = 2 / (xAxis._max - xAxis._min);
        var xtranslate = -xAxis._min * xscale - 1;
        var yscale = 2 / (view.ymax - view.ymin);
        var ytranslate = -view.ymin * yscale - 1;
        points.push(point.point.x * xscale + xtranslate);
        points.push(point.point.y * yscale + ytranslate);
        var gl = this.gl;
        gl.useProgram(this.pointProgram);
        var pMatrix = new Float32Array([1, 0, 0, 0,
                                        0, 1, 0, 0,
                                        0, 0, 1, 0,
                                        0, 0, 0, 1]);

        var matrixLoc = gl.getUniformLocation(this.pointProgram, 'u_pMatrix');
        gl.uniformMatrix4fv(matrixLoc, false, pMatrix);

        var pointArrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pointArrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        var attributeLoc = gl.getAttribLocation(this.pointProgram, 'a_position');
        gl.enableVertexAttribArray(attributeLoc);
        gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

        var colorLoc = gl.getUniformLocation(this.pointProgram, 'u_color');
        gl.uniform4f(colorLoc, 1.0, 0, 0, 1);

        gl.drawArrays(gl.POINTS, 0, points.length / 2);
    }
};

cr.SeriesPlotContainer.prototype.drawMouseoverHighlightPointCanvas = function() {
    // TODO: implement mousover highlight for canvas
};

cr.SeriesPlotContainer.prototype.drawMouseoverHighlightPoint = function() {
    if (this.usewebgl) {
        this.drawMouseoverHighlightPointWebgl();
    }
    else {
        this.drawMouseoverHighlightPointCanvas();
    }
};

cr.SeriesPlotContainer.prototype.resize = function() {
    var canvasWidth = parseInt(this.div.style["width"]) * this._resolutionScale;
    var canvasHeight = parseInt(this.div.style["height"]) * this._resolutionScale;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
        this.canvas2d.width = this.canvas3d.width = canvasWidth;
        this.canvas2d.height = this.canvas3d.height = canvasHeight;

        this.canvas3d.style["width"] = this.div.style["width"];
        this.canvas3d.style["height"] = this.div.style["height"];
        this.canvas2d.style["width"] = this.div.style["width"];
        this.canvas2d.style["height"] = this.div.style["height"];
    }

    if (this.usewebgl) {
        this.gl.viewport(0, 0, this.canvas3d.width, this.canvas3d.height);
    }
};

cr.SeriesPlotContainer.prototype.addPlot = function(plot) {
    var plotKey = plot.getId();
    this._plots[plotKey] = plot;
    this._plots[plotKey].tlayer = new cr.DataStoreTileLayer(plot.datasource, this.glb, this.ctx, this.usewebgl);
    this._plots[plotKey].tlayer.usewebgl = this.usewebgl;
};

cr.SeriesPlotContainer.prototype.removePlot = function(plot) {
    var plotKey = plot.getId();

    // update the collection of highlighted points so we no longer hang on to points belonging to the removed plot
    this.highlightedPoints = this.highlightedPoints.filter(function(point) {
        return point && point.plotKey != plotKey;
    });

    // update the mouseover highlight point in case it, too, is for the plot being removed
    if (this.mouseoverHighlightPoint && this.mouseoverHighlightPoint.plotKey == plotKey) {
        this.mouseoverHighlightPoint = null;
    }

    // remove the plot
    delete(this._plots[plotKey]);
};

cr.SeriesPlotContainer.prototype.setSize = function(width, height) {
    // Set the canvas2d && canvas3d width, height
    this.div.style["width"] = width + "px";
    this.div.style["height"] = height + "px";
    this.resize();
};

/**
 * Sets whether autoscaling and autoscale padding are enabled, if supported by the underlying grapher; otherwise does nothing.
 *
 * @param {boolean} isEnabled - whether autoscale should be enabled
 * @param {boolean} [isPaddingEnabled] - whether padding of the autoscaled Y axis is enabled; ignored if
 * <code>isEnabled</code> is <code>false</code>. Defaults to <code>false</code> if <code>undefined</code> or <code>null</code>.
 */
cr.SeriesPlotContainer.prototype.setAutoScaleEnabled = function(isEnabled, isPaddingEnabled) {
    this._isAutoscaleEnabled = isEnabled;
    this._isAutoscalePaddingEnabled = !!isPaddingEnabled;

    // if enabled, schedule an update
    if (isEnabled) {
        this.grapher.scheduleUpdate();
    }
};
