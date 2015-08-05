"use strict";
var cr = cr || {};

cr.GraphAxis = function (div, min, max, basis, isXAxis, grapher) {
    this._min = min;
    this._max = max;
    this._basis = basis;
    this.isXAxis = isXAxis;

    this._initDiv(div);
    this._initCanvas();

    this.majorTickMinSpacingPixels = 30;
    var dim = isXAxis ? this._canvas.height : this._canvas.width;
    this.majorTickWidthPixels = Math.floor(dim/5);//8;

    this.minorTickMinSpacingPixels = 10;
    this.minorTickWidthPixels = Math.floor(dim/13.33);//3;

    this.hasMinRange = false;
    this.minRange = -1e+100;

    this.hasMaxRange = false;
    this.maxRange = 1e+100;

    this._begin;
    this._length;
    this._scale;

    this.resolutionScale = window.devicePixelRatio || 1;

    this.clampToRange();
    this.resize();

    this.lastMouse = null;

    $('#'+this._canvas.id).mousedown(this, this.mousedown);
    $('#'+this._canvas.id).mousemove(this, this.mousemove);
    $('#'+this._canvas.id).mouseup(this, this.mouseup);
    //$('#'+this._canvas.id).mousewheel(this.mousewheel, this);
    $('#'+this._canvas.id).on("mousewheel", this, this.mousewheel);

    if (grapher == null) {
        this.grapher = __grapher__;
    }
}

cr.GraphAxis.prototype.mousedown = function(e) {
    var that = e.data;
    that.lastMouse = e;
    return false;
}

cr.GraphAxis.prototype.mousemove = function(e) {
  // If mouse button is up, we probably missed the up event when the mouse was outside
  // the window

    var that = e.data;
    if (!e.which) {
        that.mouseup(e);
        return;
    }

    if (that.lastMouse) {
        if (that.isXAxis) {
            if (that.cursorX) {
                var bbox = {
                    xmin: that.project1D(that.cursorX) - 10,
                    xmax: that.project1D(that.cursorX) + 10,
                    ymin: Math.floor(that._div.clientHeight/2),
                    ymax: that._div.clientHeight
                }
                if (bbox.xmin <= e.offsetX && bbox.xmax >= e.offsetX && bbox.ymin <= e.offsetY && bbox.ymax >= e.offsetY) {
                        var xScale = that._canvas.width / window.devicePixelRatio / (that._max - that._min);
                    var x = that.cursorX + (e.clientX - that.lastMouse.clientX) / xScale;
                        that.setCursor(x);
                        that.grapher.scheduleUpdate();
                } else {
                    that.translatePixels(e.clientX - that.lastMouse.clientX);
                }
            } else {
            that.translatePixels(e.clientX - that.lastMouse.clientX);
          }
          } else  {
            that.translatePixels(that.lastMouse.clientY - e.clientY);
          }
        that.lastMouse = e;
      }
    return false;
}

cr.GraphAxis.prototype.mouseup = function(e) {
    var that = e.data;
    that.lastMouse = null;
}

cr.GraphAxis.prototype.mousewheel = function(e) {
    var that = e.data;
    if (that.isXAxis) {
        console.log("Called from mouseweel on GraphAxis");
        that.zoomAboutX(e.clientX, Math.pow(1.0005, e.deltaY));
    } else {
        that.zoomAboutY(e.clientY, Math.pow(1.0005, e.deltaY));
    }
    return false;
}


cr.GraphAxis.prototype.translatePixels = function (delta) {
    if (this.isXAxis) {
        var xScale = this._canvas.width / window.devicePixelRatio / (this._max - this._min);
        this._min -= delta / xScale;
        this._max -= delta / xScale;
    } else {
        var yScale = this._canvas.height / window.devicePixelRatio / (this._max - this._min);
        this._min -= delta / yScale;
        this._max -= delta / yScale;
    }

    this.limitView();
}

cr.GraphAxis.prototype._initDiv = function(div) {
    this._div = div;
/*    this._div.style["display"] = "block";
    this._div.style["position"] = "absolute";
    this._div.style["height"] = "auto";
    this._div.style["width"] = "42px";
    this._div.style["top"] = "0px";
    this._div.style["bottom"] = "0px";
    this._div.style["right"] = "0px";
    this._div.style["marginTop"] = "42px";
    this._div.style["marginLeft"] = "0px";
    this._div.style["marginBottom"] = "0px";
    this._div.style["marginRight"] = "0px";
    this._div.style["borderTop"] = "1px solid black";
    this._div.style["borderRight"] = "1px solid black";
    this._div.style["borderBottom"] = "1px solid black";
    */
}

cr.GraphAxis.prototype._initCanvas = function() {
    this._canvas = document.createElement("canvas");
    this._canvas.setAttribute("id", this.isXAxis ? this._div.id + "-x-axis-canvas" : this._div.id + "y-axis-canvas");
    this._canvas.style["width"] = this._div.clientWidth + "px";
    this._canvas.style["height"] = this._div.clientHeight + "px";
    this._canvas.width = this._div.clientWidth;
    this._canvas.height = this._div.clientHeight;

    this._canvas.style["position"] = "absolute";
    this._div.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
}

cr.GraphAxis.prototype.resize = function() {
    this.height = this._div.clientHeight;
    this.width = this._div.clientWidth;
    this._canvas.style["width"] = this._div.clientWidth + "px";
    this._canvas.style["height"] = this._div.clientHeight + "px";
    this._canvas.height = this._div.clientHeight * this.resolutionScale;
    this._canvas.width = this._div.clientWidth * this.resolutionScale;
    this._ctx.scale(1,1);
    this._ctx.scale(this.resolutionScale,this.resolutionScale);

    this.layout();
}

cr.GraphAxis.prototype.layout = function() {
	var axisLength;
	if (this.isXAxis) {
		axisLength = this.width;
	} else {
		axisLength = this.height;
	}

    this._begin = new cr.Vector2(0,this.height);
    this._length = axisLength;
    this.rescale();
}

cr.GraphAxis.prototype.uncheckedTranslate = function(motion) {
    this._min += motion;
    this._max += motion;
}

cr.GraphAxis.prototype.clampToRange = function() {
    this.uncheckedTranslate(Math.max(0, this.minRange - this._min));
	this.uncheckedTranslate(Math.min(0, this.maxRange - this._max));

	if (this._min == Number.NEGATIVE_INFINITY || isNaN(this._min))
		this._min = Number.MIN_VALUE;
	if (this._max == Number.POSITIVE_INFINITY || isNaN(this._max))
		this._max = Number.MAX_VALUE;

	// Second, truncate to range
	if (this.hasMinRange) {
		this._min = Math.max(this._min, this.minRange);
	}
	if (this.hasMaxRange) {
		this._max = Math.min(this._max, this.maxRange);
	}
}

cr.GraphAxis.prototype.rescale = function() {
    this._scale = this._length / (this._max - this._min);
}

cr.GraphAxis.prototype.paint = function() {
	this._ctx.clearRect(0,0,this._canvas.width,this.height);
	this._ctx.beginPath();
    var mt = this.project2D(this._min);
    var lt = this.project2D(this._max)
    this._ctx.moveTo(mt._x, mt._y);
    this._ctx.lineTo(lt._x, lt._y);

    var majorTickSize = this.computeTickSize(this.majorTickMinSpacingPixels, 1);
    this.renderTicks(0, majorTickSize, this.majorTickWidthPixels, true);
    var minorTickSize = this.computeTickSize(this.minorTickMinSpacingPixels, 1);
    this.renderTicks(0, minorTickSize, this.minorTickWidthPixels);
    this._ctx.stroke();
}

cr.GraphAxis.prototype.project1D = function(value) {
    return (value - this._min) * this._scale;
}

cr.GraphAxis.prototype.project2D = function(value) {
    return this._begin.add(this._basis.y.scale(this.project1D(value)));
}

cr.GraphAxis.prototype.computeTickSize = function(minPixels, unitSize) {
    unitSize = unitSize||1;
    var minDelta = (this._max - this._min) * (minPixels / this._length) / unitSize;
    var minDeltaMantissa = minDelta / Math.pow(10, Math.floor(Math.log10(minDelta)));

    var actualDeltaMantissa;
    if (minDeltaMantissa > 5) {
        actualDeltaMantissa = 10;
    } else if (minDeltaMantissa > 2) {
        actualDeltaMantissa = 5;
    } else if (minDeltaMantissa > 1) {
        actualDeltaMantissa = 2;
    } else {
        actualDeltaMantissa = 1;
    }

    return minDelta * (actualDeltaMantissa / minDeltaMantissa);
}

cr.GraphAxis.prototype.renderTicks = function(offsetPixels, tickSize, tickWidthPixels, drawLabels) {
    var labelOffsetPixels = this.setupText() + offsetPixels + tickWidthPixels;

    var t = new cr.TickGenerator(tickSize,0);
    var it =  new cr.IterableTickGenerator(t, this._min, this._max);

    var tick = it.next();

    while (tick !== false) {
        this.renderTick(tick, offsetPixels + tickWidthPixels);
        if (drawLabels) {
           this.renderTickLabel(tick, labelOffsetPixels)
       }
       tick = it.next();
    }
}

cr.GraphAxis.prototype.renderTick = function(tick, tickWidthPixels) {
    var fromPosition;
    var toPosition;
    fromPosition = this.project2D(tick);
    toPosition = fromPosition.add(this._basis.x.scale(tickWidthPixels));
    this._ctx.moveTo(fromPosition._x, fromPosition._y);
    this._ctx.lineTo(toPosition._x, toPosition._y);
}


cr.GraphAxis.prototype.renderTickLabel = function(value, labelOffsetPixels) {
    var positionalValue = value;
    var absValue = Math.abs(value);
    var suffix = '';
    if (absValue < 1000) {
        value = value;
    }
    else if (absValue < 1000000) {
        value = value/1000;
        suffix = "k";
    } else if (absValue < 1000000000 && (absValue / 1000000) != 1000) {
        value = value/1000000;
        suffix = "M";
    } else if (absValue < 1000000000000 && (absValue / 1000000000) != 1000){
        value = value/1000000000;
        suffix = "G";
    } else if (absValue < 1000000000000000 &&  (absValue / 1000000000000) != 1000){
        value = value/1000000000000;
        suffix = "T";
    } else {
        value = value/1000000000000000;
        suffix = "P";
    }

    var valueStr = value.toFixed(4);
    var find = '\\.?0+$';
    var re = new RegExp(find, 'g');
    valueStr = valueStr.replace(re, '') + suffix;
    var position = this.project2D(positionalValue).add(this._basis.x.scale(labelOffsetPixels));
    this._ctx.fillText(valueStr, position._x, position._y);

}

cr.GraphAxis.prototype.zoomAboutY = function(pixelY, scale) {
  // Limit scale to not zoom out past "width"
  var maxWidth = function() {};
  var height = this._max - this._min;
  if (height / scale > maxWidth()) {
    scale = height / maxWidth();
  }
  // Zoom about pixelX
  var y = this.pixelToY(pixelY);
  this._min -= y;
  this._max -= y;
  this._min /= scale;
  this._max /= scale;
  this._min += y;
  this._max += y;

  this.limitView();
}


cr.GraphAxis.prototype.zoomAboutX = function(pixelX, scale) {
  // Limit scale to not zoom out past "width"
  var maxWidth = function() {};
  var width = this._max - this._min;
  if (width / scale > maxWidth()) {
    scale = width / maxWidth();
  }
  // Zoom about pixelX
  var x = this.pixelToX(pixelX);
  this._min -= x;
  this._max -= x;
  this._min /= scale;
  this._max /= scale;
  this._min += x;
  this._max += x;

  this.limitView();
}

cr.GraphAxis.prototype.limitView = function() {
    if (this._max - this._min > this.maxRange - this.minRange) {
      // Tried to zoom out beyond bounds
      this._max = this.maxRange;
      this._min = this.minRange;
  } else if (this._min < this.minRange) {
      // Tried to pan too far left
      this._max += this.minRange - this._min;
      this._min = this.minRange;
    } else if (this._max > this.maxRange) {
      // Tried to pan too far right
      this._min -= this._max - this.maxRange;
      this._max = this.maxRange;
    }
    this.grapher.scheduleUpdate();
}

cr.GraphAxis.prototype.pixelToX = function(px) {
  var xOffset = -this._min;
  var xScale = this._canvas.width / window.devicePixelRatio / (this._max - this._min);
  return px / xScale - xOffset;
}

cr.GraphAxis.prototype.xToPixel = function(x) {
  var xOffset = -this._min;
  var xScale = this._canvas.width / window.devicePixelRatio / (this._max - this._min);
  return x *  (xScale - xOffset);
}


cr.GraphAxis.prototype.pixelToY = function(px) {
  var yOffset = -this._max;
  var yScale = this._canvas.height / window.devicePixelRatio / (this._min - this._max);
  return px / yScale - yOffset;
}


cr.GraphAxis.prototype.setupText = function() {
    var textParallelToAxis = (Math.abs(this._basis.x._y) > Math.abs(this._basis.y._y));
    var labelOffsetPixels = 0;

    if (textParallelToAxis) {
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "top";
        labelOffsetPixels = Math.floor(this.height/2.66);//15;
    } else {
        this._ctx.textAlign = "left";
        this._ctx.textBaseline = "middle";
        labelOffsetPixels = 3;
    }
    return labelOffsetPixels;
}

cr.GraphAxis.prototype.setRange = function(min, max) {
    if (min < max) {
        this._min = min;
        this._max = max;
    }
}

cr.GraphAxis.prototype.setBounds = function(view) {
    if (this.isXAxis) {
        this.setRange(view.xmin, view.xmax);
    } else {
        this.setRange(view.ymin, view.ymax);
    }
}

cr.GraphAxis.prototype.update = function(view) {
    if (view) {
        this.setBounds(view);
    }
    this.clampToRange();
    this.rescale();
    this.paint();
}

cr.GraphAxis.prototype.setSize = function(width, height) {
    this._div.style["width"] = width + "px";
    this._div.style["height"] = height + "px";
    this.resize();
    this.grapher.resize();
}

cr.GraphAxis.prototype.setMaxRange = function(min, max) {
    this.minRange = min;
    this.maxRange = max;
    this.hasMinRange = this.hasMaxRange = true;
    this.update();

}
