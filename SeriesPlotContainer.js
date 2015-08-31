"use strict";

var cr = cr || {};

cr.SeriesPlotContainer = function(elementId, ignoreClickEvents, plots) {
    this.div = document.getElementById(elementId);
    this.div.style["border"] = "1px solid black";
    this.highlight = {};
    this.highlightedPoints = [];
    this.cursorX = null;
    this._resolutionScale = window.devicePixelRatio || 1;
    this._plots = {};

    if (plots) {
        for (var i = 0; i < plots.length; i++) {
            this.addPlot(plots[i]);
        }
    }

    this._initCanvases();
    try {
        console.log("Using webgl...");
        this.gl = this.canvas3d.getContext('experimental-webgl');
        this.glb = new Glb(this.gl);
        this.pointProgram = this.glb.programFromSources(cr.Shaders.PointVertexShader, cr.Shaders.PointFragmentShader);
        this.lineProgram = this.glb.programFromSources(cr.Shaders.TileVertexShader, cr.Shaders.TileFragmentShader);
        this.usewebgl = true;
    }
    catch (x) {
        this.gl = null;
        this.glb = null;
        this.usewebgl = false;
        console.log("experimental-webgl unsupported");
    }

    if (this.grapher == null) {
        this.grapher = __grapher__;
    }
    this.grapher.addPlotContainer(this);

    this.lastTouch = null;

    this.touchUtils = new cr.TouchUtils();

    var canvas2dElement = $('#' + this.canvas2d.id);
    canvas2dElement.bind('touchstart', this, this.touchstart);
    canvas2dElement.bind('touchmove', this, this.touchmove);
    canvas2dElement.bind('touchend', this, this.touchend);
    canvas2dElement.bind('touchcancel', this, this.touchend);

    var canvas3dElement = $('#' + this.canvas3d.id);
    canvas3dElement.bind('touchstart', this, this.touchstart);
    canvas3dElement.bind('touchmove', this, this.touchmove);
    canvas3dElement.bind('touchend', this, this.touchend);
    canvas3dElement.bind('touchcancel', this, this.touchend);

    this.resize();

};

cr.SeriesPlotContainer.prototype.getXAxis = function() {
    var keys = Object.keys(this._plots);
    if (keys.length == 0) {
        return null;
    }
    else {
        return this._plots[keys[0]].xAxis;
    }
};

cr.SeriesPlotContainer.prototype.getId = function() {
    return this.div.id;
};
cr.SeriesPlotContainer.prototype._initCanvases = function() {
    /*
     this.div.style.display = "block";
     this.div.style.position = "absolute";
     this.div.style.height = "auto";
     this.div.style.top = "42px";
     this.div.style.left = "0";
     this.div.style.bottom = "0";
     this.div.style.right = "0";
     this.div.style.marginTop = "0px";
     this.div.style.marginLeft = "0px";
     this.div.style.marginBottom = "0px";
     this.div.style.marginRight = "42px";
     */
    this.canvas3d = document.createElement("canvas");
    this.canvas3d.setAttribute("id", this.div.id + "-canvas3d");
    this.canvas3d.style["width"] = this.div.style["width"];
    this.canvas3d.style["height"] = this.div.style["height"];
    this.canvas3d.style["position"] = "absolute";
    this.div.appendChild(this.canvas3d);

    this.canvas2d = document.createElement("canvas");
    this.canvas2d.setAttribute("id", this.div.id + "-canvas2d");
    //    this.canvas2d.style["width"] = "100%";
    //    this.canvas2d.style["height"] = "100%";
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
        xmin : e.clientX - e.currentTarget.offsetParent.offsetLeft - 5,
        xmax : e.clientX - e.currentTarget.offsetParent.offsetLeft + 5,
        ymin : e.clientY - e.currentTarget.offsetParent.offsetTop + 5,
        ymax : e.clientY - e.currentTarget.offsetParent.offsetTop - 5
    };
    var keys = Object.keys(that._plots);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var plot = that._plots[key];
        var coords = {};
        coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
        coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
        coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
        coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
        var point = plot.tlayer.search(coords);
        if (point) {
            //plot.xAxis.showCursor = true;
            plot.xAxis.setCursorPosition(point.x);
            that.highlight.line = point;
            that.highlight.plotKey = key;
            that.grapher.scheduleUpdate();
        }
    }

    return false;
};

cr.SeriesPlotContainer.prototype.mousemove = function(e) {
    // If mouse button is up, we probably missed the up event when the mouse was outside
    // the window

    var that = e.data;
    if (!e.which) {
        var bbox = {
            xmin : e.clientX - e.currentTarget.offsetParent.offsetLeft - 5,
            xmax : e.clientX - e.currentTarget.offsetParent.offsetLeft + 5,
            ymin : e.clientY - e.currentTarget.offsetParent.offsetTop + 5,
            ymax : e.clientY - e.currentTarget.offsetParent.offsetTop - 5
        };
        var keys = Object.keys(that._plots);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var plot = that._plots[key];
            var coords = {};
            coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
            coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
            coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
            coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
            var point = plot.tlayer.search(coords);
            if (point) {
                that.mouseoverHighlightPoint = { point : point, key : key };
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

        }

        that.mouseup(e);
        return;
    }

    if (that.lastMouse) {
        var keys = Object.keys(that._plots);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var plot = that._plots[key];
            plot.xAxis.translatePixels(e.clientX - that.lastMouse.clientX);
            plot.yAxis.translatePixels(that.lastMouse.clientY - e.clientY);
        }
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
    var keys = Object.keys(that._plots);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var plot = that._plots[key];
        plot.xAxis.zoomAboutX(e.clientX, Math.pow(1.0005, -e.originalEvent.deltaY));
        plot.yAxis.zoomAboutY(e.clientY, Math.pow(1.0005, -e.originalEvent.deltaY));
    }
    return false;
};

cr.SeriesPlotContainer.prototype.touchstart = function(e) {
    var that = e.data;
    that.lastTouch = e.originalEvent.touches;
    var touch = that.touchUtils.centroid(that.lastTouch);
    var bbox = {
        xmin : touch.clientX - e.currentTarget.offsetParent.offsetLeft - 15,
        xmax : touch.clientX - e.currentTarget.offsetParent.offsetLeft + 15,
        ymin : touch.clientY - e.currentTarget.offsetParent.offsetTop + 10,
        ymax : touch.clientY - e.currentTarget.offsetParent.offsetTop - 10
    };
    var keys = Object.keys(that._plots);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var plot = that._plots[key];
        var coords = {};
        coords.xmin = plot.xAxis.pixelToX(bbox.xmin);
        coords.xmax = plot.xAxis.pixelToX(bbox.xmax);
        coords.ymin = plot.yAxis.pixelToY(bbox.ymin);
        coords.ymax = plot.yAxis.pixelToY(bbox.ymax);
        var point = plot.tlayer.search(coords);
        if (point) {
            plot.xAxis.setCursorPosition(point.x);
            that.highlight.line = point;
            that.highlight.plotKey = key;
            that.grapher.scheduleUpdate();
        }
    }

    return false;
};

cr.SeriesPlotContainer.prototype.touchmove = function(e) {
    var that = e.data;
    var thisTouch = e.originalEvent.touches;
    if (that.lastTouch && thisTouch.length == that.lastTouch.length) {
        var dx = that.touchUtils.centroid(thisTouch).clientX - that.touchUtils.centroid(that.lastTouch).clientX;
        var dy = that.touchUtils.centroid(that.lastTouch).clientY - that.touchUtils.centroid(thisTouch).clientY;
        var xAxis = that.getXAxis();
        xAxis.translatePixels(dx);
        if (that.touchUtils.isXPinch(thisTouch) && that.touchUtils.isXPinch(that.lastTouch)) {
            xAxis.zoomAboutX(that.touchUtils.centroid(thisTouch).clientX, that.touchUtils.xSpan(thisTouch) / that.touchUtils.xSpan(that.lastTouch));
        }

        for (var key in that._plots) {
            var plot = that._plots[key];
            plot.yAxis.translatePixels(dy);
            if (that.touchUtils.isYPinch(thisTouch) && that.touchUtils.isYPinch(that.lastTouch)) {
                plot.yAxis.zoomAboutY(that.touchUtils.centroid(thisTouch).clientY, that.touchUtils.ySpan(thisTouch) / that.touchUtils.ySpan(that.lastTouch));
            }

        }
    }
    // Some platforms reuse the touch list
    that.lastTouch = that.touchUtils.copyTouches(thisTouch);
    return false;
};

cr.SeriesPlotContainer.prototype.touchend = function(e) {
    var that = e.data;
    that.lastTouch = null;
    return false;
};

cr.SeriesPlotContainer.prototype.update = function() {
    if (!this.usewebgl) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    this.drawHighlight();

    for (var plot in this._plots) {
        this._plots[plot].update();
        this._plots[plot].yAxis.update();
    }
    this._needsUpdate = false;
    for (var plot in this._plots) {
        if (this._plots[plot]._needsUpdate) {
            this._needsUpdate = true;
            break;
        }
    }
    this.drawHighlightPoints();
    this.drawMouseoverHighlightPoint();
};

cr.SeriesPlotContainer.prototype.drawHighlightWebgl = function() {
    var xAxis = this.getXAxis();
    var pMatrix = new Float32Array([1, 0, 0, 0,
                                    0, 1, 0, 0,
                                    0, 0, 1, 0,
                                    0, 0, 0, 1]);

    var xscale = 2 / (xAxis._max - xAxis._min);
    var xtranslate = -xAxis._min * xscale - 1;
    var yscale = 2;
    var ytranslate = 1;
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
    var xAxis = this.getXAxis();
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
    var xAxis = this.getXAxis();
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

cr.SeriesPlotContainer.prototype.setHighlightPoints = function() {
    this.highlightedPoints = [];
    var xAxis = this.getXAxis();
    var offset = xAxis.pixelToX(2) - xAxis.pixelToX(0);
    for (var plot in this._plots) {
        var point = this._plots[plot].tlayer.searchByX({ xmin : this.cursorX - offset, xmax : this.cursorX + offset });
        if (point) {
            this.highlightedPoints.push({ point : point, key : plot });
        }
    }
};

cr.SeriesPlotContainer.prototype.drawHighlightPointsWebgl = function() {
    var xAxis = this.getXAxis();
    var points = [];
    var xscale = 2 / (xAxis._max - xAxis._min);
    var xtranslate = -xAxis._min * xscale - 1;

    for (var i = 0; i < this.highlightedPoints.length; i++) {
        var point = this.highlightedPoints[i];
        var view = this._plots[point.key].getView();
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
    var xAxis = this.getXAxis();
    var points = [];

    var xOffset = -xAxis._min;
    var xScale = this.ctx.canvas.width / (xAxis._max - xAxis._min);

    for (var i = 0; i < this.highlightedPoints.length; i++) {
        var point = this.highlightedPoints[i];
        var view = this._plots[point.key].getView();
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
    var xAxis = this.getXAxis();
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
    var xAxis = this.getXAxis();
    if (this.mouseoverHighlightPoint) {
        var points = [];
        var point = this.mouseoverHighlightPoint;
        var view = this._plots[point.key].getView();
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
    console.log("drawMouseoverHighlightPointCanvas");
    console.log("TODO...");

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
    var canvasWidth = this.div.clientWidth * this._resolutionScale;
    var canvasHeight = this.div.clientHeight * this._resolutionScale;
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

cr.SeriesPlotContainer.prototype._resize = function() {
    var canvasWidth = this.div.clientWidth * this._resolutionScale;
    var canvasHeight = this.div.clientHeight * this._resolutionScale;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
        this.canvas2d.width = this.canvas3d.width = canvasWidth;
        this.canvas2d.height = this.canvas3d.height = canvasHeight;
    }

};

cr.SeriesPlotContainer.prototype.addPlot = function(plot) {
    this._plots[plot.getId()] = plot;
    this._plots[plot.getId()].tlayer = new DataStoreTileLayer(plot.url, this.glb, this.ctx);
    this._plots[plot.getId()].tlayer.usewebgl = this.usewebgl;
};

cr.SeriesPlotContainer.prototype.removePlot = function(plot) {
    delete(this._plots[plot.getId()]);
};

cr.SeriesPlotContainer.prototype.setSize = function(width, height) {
    // Set the canvas2d && canvas3d width, height
    this.div.style["width"] = width + "px";
    this.div.style["height"] = height + "px";
    this.resize();
};
