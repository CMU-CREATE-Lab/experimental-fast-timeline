"use strict";

var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = 31556926;
var secondsInDecade = secondsInYear * 10;
var secondsInCentury = secondsInDecade * 10;
var secondsInMonth = Math.round(secondsInYear / 12.);

var cr = cr || {};

cr.TickGenerator = function(tickSize, offset) {
    this._tickSize = tickSize;
    this._offset = offset;
    this._currentTick = 0.0;
};

cr.TickGenerator.prototype.nextTick = function(min) {
    if (min) {
        this._min = min;
        this._currentTick = this.closestTick(min - this._tickSize);
        while (this._currentTick < min) {
            this.advanceTick();
        }
    }
    else {
        this.advanceTick();
    }
    return this._currentTick;
};

var foocount = 0;

cr.TickGenerator.prototype.advanceTick = function() {
    this._prevTick = this._currentTick;
    this._currentTick = this.closestTick(this._currentTick + this._tickSize);
    if (this._currentTick <= this._prevTick) {
        // This seems to happen if we've zoomed so very far that we don't have sufficient precision to advance
        // the tick.
        // Compute a tiny amount guaranteed to advance the tick.  This won't land in the right spot for a real
        // tick, but at least will prevent an infinite loop.
        var tickAdvance = Math.max(Math.abs(this._prevTick) / Math.pow(2, 50), Number.MIN_VALUE);
        this._currentTick = this._prevTick + tickAdvance;
    }
};

cr.TickGenerator.prototype.closestTick = function(val) {
    return Math.round((val - this._offset) / this._tickSize) * this._tickSize + this._offset;
};

cr.TickGenerator.closestDay = function(time) {
    var timeDate = new Date(time * 1000);
    var hour = timeDate.getHours() + timeDate.getMinutes() / 30.0 + timeDate.getSeconds() / 1800.;
    if (hour >= 12) {
        // Advance day by moving to one min before midnight
        timeDate.setHours(23);
        timeDate.setMinutes(59);
        timeDate.setSeconds(59);
        // Advance 12 hours
        timeDate.setTime(timeDate.getTime() + 60 * 60 * 12 * 1000);
    }
    // Truncate to beginning of day
    timeDate.setHours(0);
    timeDate.setMinutes(0);
    timeDate.setSeconds(0);
    var epsilon = 1e-10;
    // Return time in seconds, truncating fractional second
    var ret = Math.floor(timeDate.getTime() / 1000 + epsilon);
    return ret;
};

cr.DayTickGenerator = function(tickSize, offset) {
    cr.TickGenerator.call(this, tickSize, offset);
};
cr.DayTickGenerator.prototype = Object.create(cr.TickGenerator.prototype);

cr.DayTickGenerator.prototype.closestTick = function(time) {
    return cr.TickGenerator.closestDay(time);
};

cr.WeekTickGenerator = function(tickSize, offset) {

};
cr.WeekTickGenerator.prototype = Object.create(cr.TickGenerator.prototype);

cr.WeekTickGenerator.prototype.closestTick = function(time) {
    var timeDate = new Date(time * 1000);

    var day = ((60 * (60 * timeDate.getSeconds()) + timeDate.getMinutes()) + timeDate.getHours()) / 24.;
    var daysSinceMonday = timeDate.getDay() - 1;

    if (daysSinceMonday < 0) {
        daysSinceMonday += 7;
    }

    day += daysSinceMonday;

    if (day >= 3.5) {
        return cr.TickGenerator.closestDay(time + secondsInDay * (7 - day));
    }
    else {
        return cr.TickGenerator.closestDay(time - secondsInDay * day);
    }
};

cr.MonthTickGenerator = function(tickSize, offset) {
    cr.TickGenerator.call(this, secondsInMonth * tickSize, offset);
    this._tickSizeMonths = tickSize;
};
cr.MonthTickGenerator.prototype = Object.create(cr.TickGenerator.prototype);

cr.MonthTickGenerator.prototype.closestTick = function(time) {
    var timeDate = new Date(time * 1000);
    var monthsSince1900 = timeDate.getYear() * 12
                          + timeDate.getMonth()
                          + (timeDate.getDate() * secondsInDay / secondsInMonth);
    var tickMonthsSince1900 = Math.round(monthsSince1900 / this._tickSizeMonths) * this._tickSizeMonths;
    var tickYear = Math.floor(tickMonthsSince1900 / 12);
    var tickMonth = tickMonthsSince1900 - tickYear * 12;
    var tickDate = new Date(tickYear + 1900, tickMonth, 1);
    return Math.round(tickDate.getTime() / 1000);
};

cr.YearTickGenerator = function(tickSize, offset) {
    cr.MonthTickGenerator.call(this, tickSize * 12, offset);
};
cr.YearTickGenerator.prototype = Object.create(cr.MonthTickGenerator.prototype);

cr.HourTickGenerator = function(tickSize) {
    cr.TickGenerator.call(this, secondsInHour * tickSize, 0);
    this._tickSizeHours = tickSize;
};
cr.HourTickGenerator.prototype = Object.create(cr.TickGenerator.prototype);

cr.HourTickGenerator.prototype.closestTick = function(time) {
    var timeDate = new Date((time * 1000));
    var hour = timeDate.getHours() + timeDate.getMinutes() / 30.0 + timeDate.getSeconds() / 1800.0;

    var closestHour = Math.round(hour / this._tickSizeHours) * this._tickSizeHours;
    if (closestHour == 24) {
        // Midnight of next day.  Advance time and return closest
        // beginning of day
        return cr.TickGenerator.closestDay(time + (24 - hour) * secondsInHour);
    }
    else {
        timeDate.setHours(closestHour);
    }

    // Remove minutes and seconds
    timeDate.setMinutes(0);
    timeDate.setSeconds(0);
    var epsilon = 1e-10;
    // Return time in seconds, truncating fractional second
    return Math.floor(timeDate.getTime() / 1000 + epsilon);
};
