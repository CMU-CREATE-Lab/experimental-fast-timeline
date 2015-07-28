"use strict";

var cr = cr || {};

cr.Grapher = function () {
    this._isAdded = true; // should maybe be false
    this._isAnimated = false;
    this._updateHandler = null;
    this._requestAnimationFrameId = null;
    this.timeGraphAxis = null;
    //this.dataAxis = null;
    this.plotContainer = null;
    this.plotContainers = {};

    function simpleBindShim(thisArg, func) {
      return function() { func.apply(thisArg); };
    }

    this._requestUpdateFunction = simpleBindShim(this, this._update);


    this.bounds = {
        xmin: Number.MAX_VALUE,
        xmax: -Number.MAX_VALUE,
        ymin: Number.MAX_VALUE,
        ymax: -Number.MAX_VALUE
    };
    this.view =  {
        xmin: this.bounds.xmin,
        xmax: this.bounds.xmax,
        ymin: this.bounds.ymin,
        ymax: this.bounds.ymax
    };
    this.lastMouse;
    this.lastTouch;
}

cr.Grapher.prototype.addPlotContainer = function(plotContainer) {
    this.plotContainer = plotContainer;
    this.plotContainers[plotContainer.div.id] = plotContainer;
}

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
        function(requestId) {};



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
//  if (this.dataAxis) {
//      this.dataAxis.update();
// }
  if (this.plotContainer) {
      this.plotContainer.update();
      if (this.plotContainer._needsUpdate) {
        this.scheduleUpdate();
      }
  }

  if (this.plotContainers) {
      var keys = Object.keys(this.plotContainers);
      for(var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var plotContainer = this.plotContainers[key];
          plotContainer.update();
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
//    if (this.dataAxis) {
//        this.dataAxis.resize();
//    }
    if (this.plotContainer) {
        this.plotContainer.resize();
    }
    if (this.plotContainers) {
        var keys = Object.keys(this.plotContainers);
        for(var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var plotContainer = this.plotContainers[key];
            plotContainer.resize();
        }
    }

    this.scheduleUpdate();
}

cr.Grapher.prototype.update = function() {
    this._update();
}

cr.Grapher.prototype.addTimeGraphAxis = function(timeGraphAxis) {
    this.timeGraphAxis = timeGraphAxis;
    this.timeGraphAxis.grapher = this;
}

cr.Grapher.prototype.addDataAxis = function(dataAxis) {
    this.dataAxis = dataAxis;
    this.dataAxis.grapher = this;
}

var __grapher__ = new cr.Grapher();

var DateAxis = function(divName, orientation) {
  return new cr.TimeGraphAxis(document.getElementById(divName), null,
                              null, cr.Basis.XAxisBasis, true);
}

var NumberAxis = function(id, orientation, range) {
    var basis, isXAxis;
    var range = range || {min: Number.MIN_VALUE, max: Number.MAX_VALUE};
    if (orientation == "vertical") {
        basis = cr.Basis.YAxisBasis;
        isXAxis = false;
    } else {
        basis = cr.Basis.XAxisBasis;
        isXAxis = true;
    }
    return new cr.GraphAxis(document.getElementById(id), range.min, range.max, basis, isXAxis);
}

var DataSeriesPlot = function(id, datasource, horizontalAxis, verticalAxis, optionalParams) {
    return new cr.Plot(id, datasource, horizontalAxis, verticalAxis);
}


var PlotContainer = function(placeholder, ignoreClickEvents, plots) {
    return new cr.SeriesPlotContainer(placeholder, ignoreClickEvents, plots)
}



document.addEventListener('DOMContentLoaded', function() {
    var wnd = wnd || window.parent;
    wnd.grapherLoad && wnd.grapherLoad();
}, false);
