"use strict";

var cr = cr || {};

cr.Plot = function (plotDiv) {
    this.div = plotDiv;
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

    this.highlight = document.createElement("canvas");
    this.highlight.setAttribute("id", "highlight");
    this.highlight.style["width"] = "100%";
    this.highlight.style["height"] = "100%";
    this.highlight.style["position"] = "absolute";
    this.highlight.style.pointerEvents = 'none';

    plotDiv.appendChild(this.highlight);
    this.highlightCtx = this.highlight.getContext('2d');

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
      this.highlight.width = this.canvas2d.width = this.canvas3d.width = canvasWidth;
      this.highlight.height = this.canvas2d.height = this.canvas3d.height = canvasHeight;
      console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }

}

cr.Plot.prototype.renderHighlight = function(coord, view) {
    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = this.canvas2d.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = this.canvas2d.height / (view.ymin - view.ymax);

    this.highlightCtx.beginPath();
    this.highlightCtx.arc(transform.xScale * (coord.x + transform.xOffset),
                 transform.yScale * (coord.y + transform.yOffset),
                 3*window.devicePixelRatio, 0, Math.PI*2, true);
    this.highlightCtx.fillStyle = "rgb(255,0,0)";
    this.highlightCtx.fill();

    this.highlightCtx.beginPath();
    this.highlightCtx.lineWidth = 1.5*window.devicePixelRatio;
    this.highlightCtx.strokeStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(transform.xScale * (coord.x + transform.xOffset),0);
    this.highlightCtx.lineTo(transform.xScale * (coord.x + transform.xOffset), transform.yScale * (view.ymin + transform.yOffset));
    this.highlightCtx.stroke();

    this.highlightCtx.beginPath();
    this.highlightCtx.lineWidth = 1.5*window.devicePixelRatio;
    this.highlightCtx.strokeStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(0, transform.yScale * (coord.y + transform.yOffset));
    this.highlightCtx.lineTo(transform.xScale * (view.xmax + transform.xOffset), transform.yScale * (coord.y + transform.yOffset));
    this.highlightCtx.stroke();

    this.highlightCtx.beginPath();
    this.highlightCtx.fillStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(transform.xScale * (coord.x + transform.xOffset), 20*window.devicePixelRatio);
    this.highlightCtx.lineTo(transform.xScale * (coord.x + transform.xOffset) + 7*window.devicePixelRatio, 0);
    this.highlightCtx.lineTo(transform.xScale * (coord.x + transform.xOffset) - 7*window.devicePixelRatio, 0);
    this.highlightCtx.fill();

    this.highlightCtx.beginPath();
    this.highlightCtx.fillStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(transform.xScale * (coord.x + transform.xOffset), transform.yScale * (view.ymin + transform.yOffset) - 20*window.devicePixelRatio);
    this.highlightCtx.lineTo(transform.xScale * (coord.x + transform.xOffset) + 7*window.devicePixelRatio, transform.yScale * (view.ymin + transform.yOffset));
    this.highlightCtx.lineTo(transform.xScale * (coord.x + transform.xOffset) - 7*window.devicePixelRatio, transform.yScale * (view.ymin + transform.yOffset));
    this.highlightCtx.fill();


    this.highlightCtx.beginPath();
    this.highlightCtx.fillStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(20*window.devicePixelRatio, transform.yScale * (coord.y + transform.yOffset));
    this.highlightCtx.lineTo(0, transform.yScale * (coord.y + transform.yOffset) + 7*window.devicePixelRatio);
    this.highlightCtx.lineTo(0, transform.yScale * (coord.y + transform.yOffset) - 7*window.devicePixelRatio);
    this.highlightCtx.fill();


    this.highlightCtx.beginPath();
    this.highlightCtx.fillStyle = "rgb(255,0,0)";
    this.highlightCtx.moveTo(transform.xScale * (view.xmax + transform.xOffset) - 20*window.devicePixelRatio, transform.yScale * (coord.y + transform.yOffset));
    this.highlightCtx.lineTo(transform.xScale * (view.xmax + transform.xOffset), transform.yScale * (coord.y + transform.yOffset) + 7*window.devicePixelRatio);
    this.highlightCtx.lineTo(transform.xScale * (view.xmax + transform.xOffset), transform.yScale * (coord.y + transform.yOffset) - 7*window.devicePixelRatio);
    this.highlightCtx.fill();

}
