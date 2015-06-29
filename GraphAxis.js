"use strict";
var cr = cr || {};

cr.GraphAxis = function (div, min, max, basis, isXAxis) {
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
}

cr.GraphAxis.prototype._initDiv = function(div) {
    this._div = div;
    this._div.style["display"] = "block";
    this._div.style["position"] = "absolute";
    this._div.style["height"] = "auto";
    this._div.style["width"] = "80px";
    this._div.style["top"] = "0px";
    this._div.style["bottom"] = "0px";
    this._div.style["right"] = "0px";
    this._div.style["marginTop"] = "80px";
    this._div.style["marginLeft"] = "0px";
    this._div.style["marginBottom"] = "0px";
    this._div.style["marginRight"] = "0px";
}

cr.GraphAxis.prototype._initCanvas = function() {
    this._canvas = document.createElement("canvas");
    this._canvas.setAttribute("id", this.isXAxis ? "x-axis-canvas" : "y-axis-canvas");
    this._canvas.style["width"] = "100%";
    this._canvas.style["height"] = "100%";
    this._canvas.width = this._div.offsetWidth;
    this._canvas.height = this._div.offsetHeight;

    this._canvas.style["position"] = "absolute";
    this._div.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
}

cr.GraphAxis.prototype.resize = function() {
    this.height = this._canvas.offsetHeight;
    this.width = this._canvas.offsetWidth;

    this._canvas.height = this._canvas.offsetHeight * this.resolutionScale;
    this._canvas.width = this._canvas.offsetWidth * this.resolutionScale;
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
