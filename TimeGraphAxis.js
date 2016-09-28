"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Creates a <code>TimeGraphAxis</code> to be rendered within the given <code>domElement</code>.
 *
 * @class
 * @constructor
 * @param {object} domElement - the DOM element holding this plot container
 * @param {number} min - the range min
 * @param {number} max - the range max
 * @param {cr.Basis} basis
 * @param {boolean} isXAxis - whether this is an X axis
 */
cr.TimeGraphAxis = function(domElement, min, max, basis, isXAxis) {
    cr.GraphAxis.call(this, domElement, min, max, basis, isXAxis);

    this._timeTickSizes = [
        [1, 5, 15, 30],                                             // 1, 5, 15, 30 seconds
        [60 * 1, 60 * 5, 60 * 15, 60 * 30],                         // 1, 5, 15, 30 mins
        [3600 * 1, 3600 * 3, 3600 * 6, 3600 * 12],                  // 1, 3, 6, 12 hours
        [cr.TimeConstants.SECONDS_IN_DAY],                          // 1 day
        [cr.TimeConstants.SECONDS_IN_WEEK],                         // 1 weeks
        [cr.TimeConstants.SECONDS_IN_MONTH,
         cr.TimeConstants.SECONDS_IN_MONTH * 3,
         cr.TimeConstants.SECONDS_IN_MONTH * 6],                    // 1, 3, 6 months
        [cr.TimeConstants.SECONDS_IN_YEAR]                          // 1 year
    ];

    this._minRange = -21474836400.0;
    this._maxRange = 21474836400.0;
    this._hasMinRange = this._hasMaxRange = true;

    this._days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this._verboseDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    this._months = ["Jan", "Feb", "Mar", "Apr", "May",
                    "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    this._verboseMonths = ["January", "February", "March", "April", "May",
                           "June", "July", "August", "September", "October", "November", "December"];

    this.grapher.timeGraphAxis = this;

    this.showCursor = false;
    this.cursorX = null;

    this.isTwelveHour = false;
};

cr.TimeGraphAxis.prototype = Object.create(cr.GraphAxis.prototype);

cr.TimeGraphAxis.prototype.paint = function() {
    this._ctx.clearRect(0, 0, this.width, this.height);

    this._ctx.beginPath();
    var mt = this.project2D(this._min);
    var lt = this.project2D(this._max);
    this._ctx.moveTo(mt._x, mt._y);
    this._ctx.lineTo(lt._x, lt._y);

    var mt = this.project2D(this._min);
    var lt = this.project2D(this._max);
    this._ctx.moveTo(mt._x, mt._y / 2);
    this._ctx.lineTo(lt._x, lt._y / 2);

    var epsilon = 1e-10;

    var timeMajorPixels = 50;
    var timeMajorNoLabelPixels = 10;
    var timeMinorPixels = 5;
    var timeMajorTickSize = this.computeTimeTickSize(timeMajorPixels);
    var timeMajorNoLabelTickSize = this.computeTimeTickSize(timeMajorNoLabelPixels);

    var topLabelPixelOffset = this.height / 2;

    var dayMajorTickSize = cr.TimeConstants.SECONDS_IN_DAY;
    var dayMajorTickWidth = this.computeTickWidth(dayMajorTickSize);

    var monthMajorTickSize = cr.TimeConstants.SECONDS_IN_MONTH;
    var monthMajorTickWidth = this.computeTickWidth(monthMajorTickSize);

    var yearMajorTickSize = cr.TimeConstants.SECONDS_IN_YEAR;
    var yearMajorTickWidth = this.computeTickWidth(yearMajorTickSize);

    var decadeMajorTickSize = cr.TimeConstants.SECONDS_IN_DECADE;
    var decadeMajorTickWidth = this.computeTickWidth(decadeMajorTickSize);

    var centuryMajorTickSize = cr.TimeConstants.SECONDS_IN_CENTURY;
    var centuryMajorTickWidth = this.computeTickWidth(centuryMajorTickSize);

    var formatter;

    // View within a single month and below
    if (dayMajorTickWidth >= 80) {
        if (dayMajorTickWidth >= 120) {
            formatter = new cr.VerboseDateLabelFormatter();
        }
        else {
            formatter = new cr.DateLabelFormatter();
        }

        this.renderTicksRangeLabelInline(this.height / 2, dayMajorTickSize,
                                         this.createDateTickGenerator(dayMajorTickSize),
                                         this.height, formatter);

        if (timeMajorNoLabelTickSize <= 3600 * 12 + epsilon) {
            this.renderTicks(0, timeMajorTickSize,
                             this.createDateTickGenerator(timeMajorTickSize),
                             this.majorTickWidthPixels, null, null);

            this.renderLabels(0, timeMajorTickSize,
                              this.createDateTickGenerator(timeMajorTickSize),
                              0, new cr.TimeLabelFormatter(this.isTwelveHour));

            var timeMinorTickSize = this.computeTimeMinorTickSize(timeMinorPixels, timeMajorTickSize);

            this.renderTicks(0, timeMinorTickSize,
                             this.createDateTickGenerator(timeMinorTickSize),
                             this.minorTickWidthPixels, null, null);

        }
    }
    else if (monthMajorTickWidth >= 150) {
        //console.log('monthMajorTickWidth >= 150');

        this.renderTicks(0, dayMajorTickSize, this.createDateTickGenerator(dayMajorTickSize), this.majorTickWidthPixels, null, null);
        //this.renderTicks(0, majorTickSize, this.majorTickWidthPixels, true);
        var dayFormatter = null;
        var monthFormatter = new cr.VerboseMonthLabelFormatter(true);

        if (dayMajorTickWidth >= 40) {
            dayFormatter = new cr.DayLabelFormatter();
        }
        else if (dayMajorTickWidth >= 15) {
            //console.log('dayMajorTickWidth >= 15');
            dayFormatter = new cr.DateNumberLabelFormatter();
        }

        this.renderRangeLabelInline(0, dayMajorTickSize, this.createDateTickGenerator(dayMajorTickSize), 0, dayFormatter);
        this.renderTicksRangeLabelInline(topLabelPixelOffset, monthMajorTickSize,
                                         this.createDateTickGenerator(monthMajorTickSize), this.height,
                                         monthFormatter);
    }
    else if (yearMajorTickWidth >= 80) {
        this.renderTicks(0, monthMajorTickSize,
                         this.createDateTickGenerator(monthMajorTickSize),
                         this.majorTickWidthPixels, null, null);

        var monthFormatter = null;

        if (monthMajorTickWidth >= 55) {
            monthFormatter = new cr.VerboseMonthLabelFormatter(false);

        }
        else if (monthMajorTickWidth >= 20) {
            monthFormatter = new cr.MonthLabelFormatter(false);
        }

        this.renderRangeLabelInline(0, monthMajorTickSize,
                                    this.createDateTickGenerator(monthMajorTickSize),
                                    0, monthFormatter);

        this.renderTicksRangeLabelInline(topLabelPixelOffset, yearMajorTickSize,
                                         this.createDateTickGenerator(yearMajorTickSize),
                                         this.height, new cr.YearLabelFormatter());

    }
    else if (decadeMajorTickWidth >= 150) {
        //console.log('decadeMajorTickWidth >= 150');
        this.renderTicks(0, yearMajorTickSize,
                         this.createDateTickGenerator(yearMajorTickSize),
                         this.majorTickWidthPixels, null, null);

        var yearFormatter = null;

        if (yearMajorTickWidth >= 30) {
            //console.log('yearMajorTickWidth >= 30');
            yearFormatter = new cr.YearLabelFormatter();

        }
        else if (yearMajorTickWidth >= 15) {
            //console.log('yearMajorTickWidth >= 15');
            yearFormatter = new cr.YearSmallLabelFormatter();

        }

        this.renderRangeLabelInline(0, yearMajorTickSize,
                                    this.createDateTickGenerator(yearMajorTickSize),
                                    0, yearFormatter);

        this.renderTicksRangeLabelInline(topLabelPixelOffset, decadeMajorTickSize,
                                         this.createDateTickGenerator(decadeMajorTickSize),
                                         this.height, new cr.DecadeLabelFormatter());
    }
    else {
        this.renderTicks(0, decadeMajorTickSize,
                         this.createDateTickGenerator(decadeMajorTickSize),
                         this.majorTickWidthPixels, null, null);

        var decadeFormatter = null;
        if (decadeMajorTickWidth >= 65) {
            //console.log('decadeMajorTickWidth >= 65');
            decadeFormatter = new cr.DecadeLabelFormatter();
        }
        else if (decadeMajorTickWidth >= 25) {
            //console.log('decadeMajorTickWidth >= 25');
            decadeFormatter = new cr.DecadeSmallLabelFormatter();
        }

        this.renderRangeLabelInline(0, decadeMajorTickSize,
                                    this.createDateTickGenerator(decadeMajorTickSize),
                                    0, decadeFormatter);

        var centuryFormatter = new cr.CenturySmallLabelFormatter();

        if (centuryMajorTickWidth >= 65) {
            //console.log('centuryMajorTickWidth >= 65');
            centuryFormatter = new cr.CenturyLabelFormatter();
        }

        this.renderTicksRangeLabelInline(topLabelPixelOffset, centuryMajorTickSize,
                                         this.createDateTickGenerator(centuryMajorTickSize),
                                         this.height, centuryFormatter);
    }

    this._ctx.stroke();

    //if (this.showCursor) {
    if (this.cursorX) {
        this._ctx.fillStyle = "red";
        this._ctx.beginPath();
        this._ctx.moveTo(this.project1D(this.cursorX), this._div.clientHeight);
        this._ctx.lineTo(this.project1D(this.cursorX) + 10, Math.floor(this._div.clientHeight / 2));
        this._ctx.lineTo(this.project1D(this.cursorX) - 10, Math.floor(this._div.clientHeight / 2));
        this._ctx.fill();
        this._ctx.fillStyle = "black";
    }
    //}
};

cr.TimeGraphAxis.prototype.computeTimeTickSize = function(minPixels) {
    var minDelta = (this._max - this._min) * (minPixels / this._length);

	if (minDelta < 1) {
		return this.computeTickSize(minPixels);
	}

    for (var unit = 0; unit < this._timeTickSizes.length; unit++) {
        for (var i = 0; i < this._timeTickSizes[unit].length; i++) {
            if (this._timeTickSizes[unit][i] >= minDelta) {
                return this._timeTickSizes[unit][i];
            }
        }
    }

    return this.computeTickSize(minPixels, cr.TimeConstants.SECONDS_IN_YEAR) * cr.TimeConstants.SECONDS_IN_YEAR;
};

cr.TimeGraphAxis.prototype.computeTimeMinorTickSize = function(minPixels, majorTickSize) {
    // Find unit matching majorTickSize
    var epsilon = 1e-10;
	if (majorTickSize <= 1 + epsilon) {
		return this.computeTickSize(minPixels);
	}
    for (var unit = 0; unit < this._timeTickSizes.length; unit++) {
        for (var i = 0; i < this._timeTickSizes[unit].length; i++) {
            if (majorTickSize <= this._timeTickSizes[unit][i]) {
                var minTickSize;
                if (i == 0) {
                    // Major tick is minimum value of unit;  OK to use
                    // next lower unit
                    minTickSize = this._timeTickSizes[unit - 1][0];
                }
                else {
                    // Don't go smaller than major tick's unit
                    minTickSize = this._timeTickSizes[unit][0];
                }
                return Math.max(minTickSize, this.computeTimeTickSize(minPixels));
            }
        }
    }
    return this.computeTimeTickSize(minPixels);
};

cr.TimeGraphAxis.prototype.renderTicks = function(offsetPixels, tickSize, tickGen, tickWidthPixels, formatter, abbreviatedFormatter) {
    if (tickGen == null) {
        tickGen = new cr.TickGenerator(tickSize, 0);
    }

    var labelOffsetPixels = formatter == null ? 0 : this.setupText() + offsetPixels + tickWidthPixels;

    //var t = new cr.TickGenerator(tickSize,0);
    var it = new cr.IterableTickGenerator(tickGen, this._min, this._max);

    var tick = it.next();

    while (tick !== false) {
        this.renderTick(tick, offsetPixels + tickWidthPixels);
        if (formatter != null) {
            this.renderTickLabelWithFormatter(tick, labelOffsetPixels, formatter, abbreviatedFormatter);
        }
        tick = it.next();
    }
};

cr.TimeGraphAxis.prototype.renderTickLabelWithFormatter = function(tick, labelOffsetPixels, formatter, abbreviatedFormatter) {
    var text = formatter.format(tick);
    if (abbreviatedFormatter != null) {
        var textWidth = this._ctx.measureText(text).width;
        var xOffset = this.project2D(tick).add(this.basis.x.scale(labelOffsetPixels))._x;
        if (this.width - textWidth - xOffset < 0) {
            text = abbreviatedFormatter.format(tick);
        }
    }
    this.renderTickLabel(tick, labelOffsetPixels, text);
};

cr.TimeGraphAxis.prototype.renderTickLabel = function(y, labelOffsetPixels, label) {
    //labelOffsetPixels = this.height/2 - labelOffsetPixels;
    var position = this.project2D(y).add(this._basis.x.scale(labelOffsetPixels));
    this._ctx.fillText(label, position._x, position._y);
    //debugger;

};

cr.TimeGraphAxis.prototype.computeTickWidth = function(unitSize) {
    return this.project2D(unitSize).distance(this.project2D(0));
};

cr.TimeGraphAxis.prototype.createDateTickGenerator = function(tickSize) {
    var nHours = Math.round(tickSize / cr.TimeConstants.SECONDS_IN_HOUR);
    if (nHours <= 1) {
        return null;
    }
    else if (nHours < 24) {
        return new cr.HourTickGenerator(nHours);
    }

    var nDays = Math.round(tickSize / cr.TimeConstants.SECONDS_IN_DAY);
    if (nDays == 1) {
        return new cr.DayTickGenerator(cr.TimeConstants.SECONDS_IN_DAY, 0);
    }

    var nWeeks = Math.round(tickSize / cr.TimeConstants.SECONDS_IN_WEEK);
    if (nWeeks == 1) {
        return new cr.WeekTickGenerator(cr.TimeConstants.SECONDS_IN_WEEK, 0);
    }

    var nMonths = Math.round(tickSize / cr.TimeConstants.SECONDS_IN_MONTH);
    if (nMonths < 12) {
        return new cr.MonthTickGenerator(nMonths, 0);
    }

    var nYears = Math.round(tickSize / cr.TimeConstants.SECONDS_IN_YEAR);
    return new cr.YearTickGenerator(nYears);
};

cr.TimeGraphAxis.prototype.renderRangeLabelInline = function(offsetPixels, tickSize, tickGen, tickWidthPixels, formatter) {
	if (formatter == null) {
		return;
	}

    if (tickGen == null) {
        tickGen = new cr.TickGenerator(tickSize, 0);
    }

    var labelOffsetPixels = this.setupText() + offsetPixels;
    var tick = tickGen.nextTick(this._min);

    if (tick > this._max) {
        this.renderTickLabelWithFormatter((this._min + this._max) / 2.0, labelOffsetPixels, formatter, null);
        return;
    }
    tick = tickGen.nextTick(this._min - tickSize);
    while (true) {
        var nextTick = tickGen.nextTick();

        if (nextTick > this._max + tickSize) {
            break;
        }
        var min = tick;
        var max = nextTick;
		if (min < this._min) {
			min = this._min;
		}
		if (max > this._max) {
			max = this._max;
		}

        this.renderTickLabelWithinBounds((min + max) / 2.0, min, max, labelOffsetPixels, formatter);
        tick = nextTick;
    }
};

cr.TimeGraphAxis.prototype.renderTickLabelWithinBounds = function(tick, min, max, labelOffsetPixels, formatter) {
    var text = formatter.format(tick);
    if (Math.abs(this._basis.x._x) < Math.abs(this._basis.x._y)) {//parallel text
        var width = this._ctx.measureText(text).width;
        var target = this.project2D(tick)._x;
        var boundsMin = this.project2D(min)._x;
        var boundsMax = this.project2D(max)._x;
		if (width >= (boundsMax - boundsMin)) {
			return;
		}
        var drawMin = target;
        var drawMax = target;

        var originalAlign = this._ctx.textAlign;

        if (originalAlign == "center") {
            drawMin -= width / 2;
            drawMax += width / 2;
            if (drawMin <= boundsMin) {
                this._ctx.textAlign = "left";
                this.renderTickLabel(min, labelOffsetPixels, text);
                this._ctx.textAlign = "center";
            }
            else if (drawMax >= boundsMax) {
                this._ctx.textAlign = "right";
                this.renderTickLabel(max, labelOffsetPixels, text);
                this._ctx.textAlign = "center";
            }
            else {
                this.renderTickLabel(tick, labelOffsetPixels, text);
            }
        }
        else {
            this.renderTickLabel(tick, labelOffsetPixels, text);
        }

    }
    else {//not parallel text
        this.renderTickLabel(tick, labelOffsetPixels, formatter(tick));
    }
};

cr.TimeGraphAxis.prototype.renderTicksRangeLabelInline = function(offsetPixels, tickSize, tickGen, tickWidthPixels, formatter) {
    if (tickGen == null) {
        tickGen = new cr.TickGenerator(tickSize, 0);
    }

    var labelOffsetPixels = this.setupText() + offsetPixels;

    var tick = tickGen.nextTick(this._min);

    if (tick > this._max) {
        // No ticks are visible
        // Draw one inline label in the middle
        this.renderTickLabelWithFormatter((this._min + this._max) / 2.0,
                                          labelOffsetPixels, formatter, null);
        return;
    }
    tick = tickGen.nextTick(this._min - tickSize);
    while (true) {
        this.renderTick(tick, tickWidthPixels + offsetPixels);
        var nextTick = tickGen.nextTick();

        if (nextTick > this._max + tickSize) {
            break;
        }
        var min = tick;
        var max = nextTick;
		if (min < this._min) {
			min = this._min;
		}
		if (max > this._max) {
			max = this._max;
		}

        this.renderTickLabelWithinBounds((min + max) / 2.0, min, max,
                                         labelOffsetPixels, formatter);
        tick = nextTick;
    }
};

cr.TimeGraphAxis.prototype.renderLabels = function(offsetPixels, tickSize, tickGen, tickWidthPixels, formatter) {
    if (tickGen == null) {
        tickGen = new cr.TickGenerator(tickSize, 0);
    }

    var labelOffsetPixels = formatter == null ? 0 : this.setupText() + offsetPixels + tickWidthPixels;

    var it = new cr.IterableTickGenerator(tickGen, this._min, this._max);

    var tick = it.next();

    while (tick !== false) {
        this.renderTickLabelWithFormatter(tick, labelOffsetPixels, formatter, null);
        tick = it.next();
    }
};

cr.TimeGraphAxis.prototype.setCursorPosition = function(x) {
    if (x != this.cursorX) {
        this.cursorX = x;
    }
    this.publishAxisChangeEvent();
};

cr.TimeGraphAxis.prototype.getCursorPosition = function() {
    return this.cursorX;
};
