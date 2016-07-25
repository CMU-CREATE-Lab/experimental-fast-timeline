"use strict";

var cr = cr || {};

cr.MidnightLine = function() {
    this.SECONDS_PER_DAY = 24 * 60 * 60;
    this.MILLISECONDS_PER_DAY = this.SECONDS_PER_DAY * 1000;
    this.STROKE_WIDTH = 0.5;
    this.STROKE_COLOR = "silver";
    this.MIN_SPACING = 20;
};

cr.MidnightLine.prototype.getLines = function(xAxis) {
    var points = [];
    if(this.shouldDrawMidnightLines(xAxis)) {
        var xMin = xAxis.getMin();
        var xMax = xAxis.getMax();
        var firstDay = this.getNextDay(xMin);

        var midnight = firstDay;
        while (midnight <= xMax) {
            points.push(xAxis.project1D(midnight));
            points.push(1.);
            points.push(xAxis.project1D(midnight));
            points.push(-1.);
            midnight += this.SECONDS_PER_DAY;
        }

    }
    return points;
};

cr.MidnightLine.prototype.shouldDrawMidnightLines = function(xAxis) {
	var min = xAxis.getMin();
	var oneDayLater = min + this.SECONDS_PER_DAY;
	var dayWidth = xAxis.project2D(oneDayLater).getX() - xAxis.project2D(min).getX();

	return dayWidth >= this.MIN_SPACING;
};

cr.MidnightLine.prototype.getNextDay = function(time) {
    var timeDate = new Date(time * 1000);

    // Move forward by 1 day - 1 millisecond
    timeDate.setTime(timeDate.getTime() + this.MILLISECONDS_PER_DAY - 1);

    // Truncate to beginning of day
    timeDate.setHours(0);
    timeDate.setMinutes(0);
    timeDate.setSeconds(0);

    return timeDate.getTime() / 1000; // Convert milliseconds to seconds
};
