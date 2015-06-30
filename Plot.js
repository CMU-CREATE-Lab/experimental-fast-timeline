"use strict";

var cr = cr || {};

cr.Plot = function (plotDiv) {
    this.div = plotDiv;

    this.div.style.display = "block";
    this.div.style.position = "absolute";
    this.div.style.height = "auto";
    this.div.style.top = "80px";
    this.div.style.left = "0";
    this.div.style.bottom = "0";
    this.div.style.right = "0";
    this.div.style.marginTop = "0px";
    this.div.style.marginLeft = "0px";
    this.div.style.marginBottom = "0px";
    this.div.style.marginRight = "80px";

    this.canvas2d = document.createElement("canvas");
    this.canvas2d.setAttribute("id", "canvas2d");
    this.canvas2d.style["width"] = "100%";
    this.canvas2d.style["height"] = "100%";
    this.canvas2d.style["position"] = "absolute";
    plotDiv.appendChild(this.canvas2d);

    this.canvas3d = document.createElement("canvas");
    this.canvas3d.setAttribute("id", "canvas3d");
    this.canvas3d.style["width"] = "100%";
    this.canvas3d.style["height"] = "100%";
    this.canvas3d.style["position"] = "absolute";
    plotDiv.appendChild(this.canvas3d);

    this.ctx = this.canvas2d.getContext('2d');

    this.highlight = new cr.Highlight(plotDiv);

    this.cursor = new cr.Cursor(plotDiv);

    try {
        this.gl = this.canvas3d.getContext('experimental-webgl');
        this.glb = new Glb(this.gl);
        this.usewebgl = true;
    } catch (x) {
        this.gl = null;
        this.glb = null;
        this.usewebgl = false;
        console.log("experimental-webgl unsupported");
    }

    this.tlayer = new DataStoreTileLayer(url, this.glb, this.ctx);

    this._resize();
}

cr.Plot.prototype._resize = function() {
    var canvasWidth = this.div.offsetWidth * window.devicePixelRatio;
    var canvasHeight = this.div.offsetHeight * window.devicePixelRatio;
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
