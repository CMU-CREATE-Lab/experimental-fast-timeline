"use strict";

var cr = cr || {};

cr.Plot = function (url, xAxis, yAxis) {
//    this.highlight = new cr.Highlight(plotDiv);

//    this.cursor = new cr.Cursor(plotDiv);
    this.point = null;
    this.id = 'plot-' + xAxis.getId() + '-' + yAxis.getId();

    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.url = url;
    this.view = {};
    this.bounds = {
        xmin: Number.MAX_VALUE,
        xmax: -Number.MAX_VALUE,
        ymin: Number.MAX_VALUE,
        ymax: -Number.MAX_VALUE
    };

    this.view = {
        xmin: this.xAxis._min,
        xmax: this.xAxis._max,
        ymin: this.yAxis._min,
        ymax: this.yAxis._max
    };

    this.dataPointListeners = [];
    //this.tlayer = new DataStoreTileLayer(url, this.glb, this.ctx);
    //this._resize();
}

cr.Plot.prototype.limitView = function() {
    if (this.view.xmax - vthis.iew.xmin > this.bounds.xmax - this.bounds.xmin) {
      // Tried to zoom out beyond bounds
      this.view.xmax = this.bounds.xmax;
      this.view.xmin = this.bounds.xmin;
    } else if (this.view.xmin < this.bounds.xmin) {
      // Tried to pan too far left
      this.view.xmax += this.bounds.xmin - this.view.xmin;
      this.view.xmin = this.bounds.xmin;
  } else if (this.view.xmax > this.bounds.xmax) {
      // Tried to pan too far right
      this.view.xmin -= this.view.xmax - this.bounds.xmax;
      this.view.xmax = this.bounds.xmax;
    }
}

cr.Plot.prototype._resize = function() {
    var canvasWidth = this.div.clientWidth * window.devicePixelRatio;
    var canvasHeight = this.div.clientWidthHeight * window.devicePixelRatio;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
      this.highlight._highlight.width = this.canvas2d.width = this.canvas3d.width = canvasWidth;
      this.highlight._highlight.height = this.canvas2d.height = this.canvas3d.height = canvasHeight;
      console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }

}

cr.Plot.prototype.drawCursorAndHighlight = function(view) {
    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = this.canvas2d.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = this.canvas2d.height / (view.ymin - view.ymax);
    if (this.showCursor) {
        this.cursor.draw(transform);
    }
    this.highlight._ctx.clearRect (0, 0, plot.canvas2d.width, plot.canvas2d.height);

    if (this.showHighlightLine) {
        this.highlight.drawLine(transform, view);
    }
    if (this.showHighlightPoint) {
        this.highlight.drawPoint(transform, view);
    }
    if (this.showHighlightMOPoint) {
        this.highlight.drawMOPoint(transform, view);
    }
}

cr.Plot.prototype.getId = function() {
    return this.id;
}

cr.Plot.prototype.getView = function() {
    return {
        xmin: this.xAxis._min,
        xmax: this.xAxis._max,
        ymin: this.yAxis._min,
        ymax: this.yAxis._max,
    }
}
cr.Plot.prototype.update = function() {
    this.tlayer.draw(this.getView());
    this._needsUpdate = this.tlayer._needsUpdate;
}

cr.Plot.prototype.addDataPointListener = function(listener) {
    this.dataPointListeners.push(listener);
}

cr.Plot.prototype.removeDataPointListener = function(listener) {
    for (var i = 0; i < this.dataPointListeners.length; i++) {
        if (this.dataPointListeners[i] == listener) break;
    }
    if (i < this.dataPointListeners.length) {
        var removed = this.dataPointListeners.splice(i,1);
    }
}
