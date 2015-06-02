"use strict";

var cr = cr || {};

cr.Plot = function (plotDiv) {
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
    

}
