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
    var ret = this.dayFormatter.format(time) +
              ' ' + this.monthFormatter.format(time);
    return ret;
};

cr.DateLabelFormatter = function() {
    this.dayFormatter = new cr.DayLabelFormatter();
    this.monthFormatter = new cr.MonthLabelFormatter(true);
};

cr.DateLabelFormatter.prototype.format = function(time) {
    var ret = this.dayFormatter.format(time) +
              ' ' + this.monthFormatter.format(time);
    return ret;
};

cr.DateNumberLabelFormatter = function() {
};

cr.DateNumberLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    var ret = d.getDate();
    return ret;
};

cr.DayLabelFormatter = function() {
    this.dateNumberFormatter = new cr.DateNumberLabelFormatter();
};

cr.DayLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    var ret = cr.LabelFormatter.DAYS[d.getDay()] +
              ' ' + this.dateNumberFormatter.format(time);
    return ret;
};

cr.VerboseDayLabelFormatter = function() {
};

cr.VerboseDayLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.));
    var ret = cr.LabelFormatter.VERBOSE_DAYS[d.getDay()] + ' ' + d.getDate();
    return ret;
};

cr.MonthLabelFormatter = function(includeYear) {
    this.includeYear = includeYear;
    this.YearLabelFormatter = new cr.YearLabelFormatter();
};

cr.MonthLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var ret = cr.LabelFormatter.MONTHS[d.getMonth()] +
              (this.includeYear ? ' ' + this.YearLabelFormatter.format(time) : '');
    return ret;
};

cr.VerboseMonthLabelFormatter = function(includeYear) {
    this.includeYear = includeYear;
    this.YearLabelFormatter = new cr.YearLabelFormatter();
};

cr.VerboseMonthLabelFormatter.prototype.format = function(time) {
    var d = new Date(Math.round(time * 1000.0));
    var ret = cr.LabelFormatter.VERBOSE_MONTHS[d.getMonth()] +
              (this.includeYear ? ' ' + this.YearLabelFormatter.format(time) : '');
    return ret;
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
