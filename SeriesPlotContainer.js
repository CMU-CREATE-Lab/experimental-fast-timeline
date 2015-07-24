"use strict";

var cr = cr || {};

cr.SeriesPlotContainer = function(elementId, ignoreClickEvents, plots) {
    this.div = document.getElementById(elementId);
    this.div.style["border"] = "1px solid black";
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
        this.usewebgl = true;
    } catch (x) {
        this.gl = null;
        this.glb = null;
        this.usewebgl = false;
        console.log("experimental-webgl unsupported");
    }
    this._resize();

}

cr.SeriesPlotContainer.prototype.getId = function() {
    return this.div.id;
}
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

    $('#'+this.canvas2d.id).mousedown(this, this.mousedown);
    $('#'+this.canvas2d.id).mousemove(this, this.mousemove);
    $('#'+this.canvas2d.id).mouseup(this, this.mouseup);
    $('#'+this.canvas2d.id).on("mousewheel", this, this.mousewheel);

    $('#'+this.canvas3d.id).mousedown(this, this.mousedown);
    $('#'+this.canvas3d.id).mousemove(this, this.mousemove);
    $('#'+this.canvas3d.id).mouseup(this, this.mouseup);
    $('#'+this.canvas3d.id).on("mousewheel", this, this.mousewheel);

    this.lastMouse = null;



}

cr.SeriesPlotContainer.prototype.mousedown = function(e) {
    var that = e.data;
    that.lastMouse = e;
    return false;
}

cr.SeriesPlotContainer.prototype.mousemove = function(e) {
  // If mouse button is up, we probably missed the up event when the mouse was outside
  // the window

    var that = e.data;
    if (!e.which) {
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
}

cr.SeriesPlotContainer.prototype.mouseup = function(e) {
    var that = e.data;
    that.lastMouse = null;
}

cr.SeriesPlotContainer.prototype.mousewheel = function(e) {
    var that = e.data;
    var keys = Object.keys(that._plots);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var plot = that._plots[key];
        plot.xAxis.zoomAboutX(e.clientX, Math.pow(1.0005, e.deltaY));
        plot.yAxis.zoomAboutY(e.clientY, Math.pow(1.0005, e.deltaY));
    }
    return false;
}

cr.SeriesPlotContainer.prototype.update = function() {
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
        if (this._plots[plot].yAxis._needsUpdate) {
            this._needsUpdate = true;
            break;
        }
    }

}

cr.SeriesPlotContainer.prototype.resize = function() {
    console.log('cr.SeriesPlotContainer.prototype.resize');
    console.log('div is' + this.div.offsetWidth + "x" + this.div.offsetHeight);

    var canvasWidth = this.div.offsetWidth * window.devicePixelRatio;
    var canvasHeight = this.div.offsetHeight * window.devicePixelRatio;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
      this.canvas2d.width = this.canvas3d.width = canvasWidth;
      this.canvas2d.height = this.canvas3d.height = canvasHeight;

      this.canvas3d.style["width"] = this.div.style["width"];
      this.canvas3d.style["height"] = this.div.style["height"];
      this.canvas2d.style["width"] = this.div.style["width"];
      this.canvas2d.style["height"] = this.div.style["height"];


      console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }


    if (this.usewebgl) {
        this.gl.viewport(0, 0, this.canvas3d.width, this.canvas3d.height);
    }
}

cr.SeriesPlotContainer.prototype._resize = function() {
    var canvasWidth = this.div.offsetWidth * window.devicePixelRatio;
    var canvasHeight = this.div.offsetHeight * window.devicePixelRatio;
    if (this.canvas2d.width != canvasWidth ||
        this.canvas2d.height != canvasHeight) {
      this.canvas2d.width = this.canvas3d.width = canvasWidth;
      this.canvas2d.height = this.canvas3d.height = canvasHeight;
      console.log('Resized canvas to ' + this.canvas2d.width + ' x ' + this.canvas2d.height);
    }

}

cr.SeriesPlotContainer.prototype.addPlot = function(plot) {
    this._plots[plot.getId()] = plot;
    this._plots[plot.getId()].tlayer = new DataStoreTileLayer(plot.url, this.glb, this.ctx);
        this._plots[plot.getId()].tlayer.usewebgl = this.usewebgl;
    console.log(plot.url);

}

cr.SeriesPlotContainer.prototype.removePlot = function(plot) {
    delete(this._plots[plot.getId()]);
}

cr.SeriesPlotContainer.prototype.setSize = function(width, height) {
    // Set the canvas2d && canvas3d width, height
    this.div.style["width"] = width +"px";
    this.div.style["height"] = height + "px";
    this.resize();
 }
