'use strict';
var cr = cr || {};

/**
 * Object for abbreviated and verobse day and month labels
 * @type {Object}
 */
cr.LabelFormatter = {};

/**
 * Abbreviated days of week
 * @type {Array}
 */
cr.LabelFormatter.DAYS = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
];

/**
 * Verbose days of week
 * @type {Array}
 */
cr.LabelFormatter.VERBOSE_DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Abbreviated months of year
 * @type {Array}
 */
cr.LabelFormatter.MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
    'Dec'
];

/**
 * Verbose months of year
 * @type {Array}
 */
cr.LabelFormatter.VERBOSE_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
];

cr.TimeLabelFormatter = function() {
};

cr.TimeLabelFormatter.prototype.format = function(time) {
    var whole = Math.floor(time + (.5 / 1000000.));
    var microseconds = Math.round(1000000 * (time - whole));
    var d = new Date((whole * 1000.));
    var ret = String('00' + d.getHours()).slice(-2) +
              ':' + String('00' + d.getMinutes()).slice(-2);
    var seconds = d.getSeconds();
    if (seconds != 0 || microseconds != 0) {
        ret += ':' + seconds;
        if (microseconds != 0) {
            ret += '.' + microseconds;
        }
    }
    return ret;
};

cr.VerboseDateLabelFormatter = function() {
    this.dayFormatter = new cr.VerboseDayLabelFormatter();
    this.monthFormatter = new cr.VerboseMonthLabelFormatter(true);
};

cr.VerboseDateLabelFormatter.prototype.format = function(time) {
    return this.dayFormatter.format(time) +
           ' ' + this.monthFormatter.format(time);
};

cr.DateLabelFormatter = function() {
    this.dayFormatter = new cr.DayLabelFormatter();
    this.monthFormatter = new cr.MonthLabelFormatter(true);
};

cr.DateLabelFormatter.prototype.format = function(time) {
    return this.dayFormatter.format(time) +
           ' ' + this.monthFormatter.format(time);
};

cr.DateNumberLabelFormatter = function() {
};

cr.DateNumberLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    return d.getDate();
};

cr.DayLabelFormatter = function() {
    this.dateNumberFormatter = new cr.DateNumberLabelFormatter();
};

cr.DayLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    return cr.LabelFormatter.DAYS[d.getDay()] +
           ' ' + this.dateNumberFormatter.format(time);
};

cr.VerboseDayLabelFormatter = function() {
};

cr.VerboseDayLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    return cr.LabelFormatter.VERBOSE_DAYS[d.getDay()] + ' ' + d.getDate();
};

cr.MonthLabelFormatter = function(includeYear) {
    this.includeYear = includeYear;
    this.YearLabelFormatter = new cr.YearLabelFormatter();
};

cr.MonthLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    return cr.LabelFormatter.MONTHS[d.getMonth()] +
           (this.includeYear ? ' ' + this.YearLabelFormatter.format(time) : '');
};

cr.VerboseMonthLabelFormatter = function(includeYear) {
    this.includeYear = includeYear;
    this.YearLabelFormatter = new cr.YearLabelFormatter();
};

cr.VerboseMonthLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    return cr.LabelFormatter.VERBOSE_MONTHS[d.getMonth()] +
           (this.includeYear ? ' ' + this.YearLabelFormatter.format(time) : '');
};

cr.YearLabelFormatter = function() {
};

cr.YearLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    return d.getYear() + 1900;
};

cr.YearSmallLabelFormatter = function() {
};

cr.YearSmallLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var year = d.getYear() % 100;
    if (year < 0) {
        year += 100;
    }
    return (year < 10 ? "'0" : "'") + year;
};

cr.DecadeLabelFormatter = function() {
};

cr.DecadeLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var decadeStart = Math.floor((d.getYear() + 1900) / 10) * 10;
    var decadeEnd = decadeStart + 9;
    return decadeStart + ' - ' + decadeEnd;
};

cr.DecadeSmallLabelFormatter = function() {
};

cr.DecadeSmallLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var decadeStart = (d.getYear() % 100);
    if (decadeStart < 0) {
        decadeStart += 100;
    }
    decadeStart = Math.floor(decadeStart / 10) * 10;
    return (decadeStart == 0 ? "'0" : "'") + decadeStart + 's';
};

cr.CenturyLabelFormatter = function() {
};

cr.CenturyLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var centuryStart = Math.floor((d.getYear() + 1900) / 100) * 100;
    var centuryEnd = centuryStart + 99;
    return centuryStart + ' - ' + centuryEnd;
};

cr.CenturySmallLabelFormatter = function() {
};

cr.CenturySmallLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var centuryStart = Math.floor((d.getYear() + 1900) / 100) * 100;
    return centuryStart + 's';
};

cr.DateTimeFormatter = function() {
};

/**
 * Returns a date and time string representation of the given <code>dateTime</code>, or <code>null</code> if it is not a
 * valid date. The string will be formatted as in this example: <code>Sat Aug 29 2015, 04:30:00 GMT-0400 (EDT)</code>
 *
 * @param {Date | number | string} dateTime - a Date object, the time in millis, or a string representation of a date.
 * @return {null|string} a string representation of the <code>dateTime</code>, or <code>null</code> if not a valid date.
 */
cr.DateTimeFormatter.format = function(dateTime) {
    if (typeof dateTime !== 'undefined' && dateTime != null) {

        // see if we were given a Date (got this from http://stackoverflow.com/a/643827/703200)
        var d;
        if (Object.prototype.toString.call(dateTime) === '[object Date]') {
            d = dateTime;
        }
        else {
            d = new Date(dateTime);
        }

        // make sure it's not an "Invalid Date" (see http://stackoverflow.com/a/1353711/703200)
        if (!isNaN(d.getTime())) {
            return d.toDateString() + ", " + d.toTimeString();
        }
    }
    return null;
};

cr.ValueFormatter = function() {
};

/**
 * Returns a string representation of the given <code>value</code>, or <code>null</code> if it is not a
 * number.  Returns <code>null</code> if the given value is undefined or <code>null</code>.  Returns the string "NaN"
 * if the value cannot be parsed as a number.  Otherwise, it returns a string representation.  Uses exponential notation
 * for numbers smaller than 1e-3 and larger than 1e+7.
 *
 * @param {number|string} value - the number to be formatted.
 * @return {null|string} a string representation of the <code>value</code>, or <code>null</code> if not a number.
 */
cr.ValueFormatter.format = function(value) {
    if (typeof value !== 'undefined' && value != null) {
        var val = parseFloat(value);
        if (isFinite(val) && !isNaN(val)) {
            var absValue = Math.abs(val);

            if (absValue == 0.0) {
                return "0.0";
            }

            if (absValue < 1e-3 || absValue > 1e7) {
                return val.toExponential();
            }

            return val.toPrecision();
        }

        return val.toString();
    }

    return null;
};
