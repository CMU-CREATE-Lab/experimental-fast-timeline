"use strict";
var cr = cr || {};

cr.GraphAxis = function (canvas, ctx, min, max, basis, isXAxis) {
    this.majorTickMinSpacingPixels = 30;
    this.majorTickWidthPixels = 8;

    this.minorTickMinSpacingPixels = 10;
    this.minorTickWidthPixels = 3;

    this.hasMinRange = false;
    this.minRange = -1e+100;

    this.hasMaxRange = false;
    this.maxRange = 1e+100;


    this._begin;
    this._length;
    this._scale;

    this._canvas = canvas;
    this._ctx = ctx;
	this._min = min;
	this._max = max;
	this._basis = basis;
	this.isXAxis = isXAxis;

    this.resolutionScale = window.devicePixelRatio || 1;

    this.clampToRange();
    this.resize();
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
        labelOffsetPixels = 15;
    } else {
        this._ctx.textAlign = "left";
        this._ctx.textBaseline = "middle";
        labelOffsetPixels = 3;
    }
    return labelOffsetPixels;
}
