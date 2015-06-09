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
      this.canvas2d.width = this.canvas3d.width = canvasWidth;
      this.canvas2d.height = this.canvas3d.height = canvasHeight;
      console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }

}
