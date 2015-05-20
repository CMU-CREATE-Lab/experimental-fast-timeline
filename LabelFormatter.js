"use strict";
var cr = cr || {};

cr.LabelFormatter = function() {
    this._days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this._verboseDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
                         "Friday", "Saturday"];
    this._months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
                    "Sep", "Oct", "Nov", "Dec"];
    this._verboseMonths = ["January", "February", "March", "April", "May",
                           "June", "July", "August", "September", "October",
                           "November", "December"];

}
cr.LabelFormatter.prototype.format = function(value) {
    return value;
}


cr.TimeLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.TimeLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.TimeLabelFormatter.prototype.format = function(time) {

    var whole = Math.floor(time + (.5/1000000.));
	var microseconds = Math.round(1000000 * (time - whole));

	var d = new Date((whole*1000.));
	var ret = String("00" + d.getHours()).slice(-2) + ":" + String("00" + d.getMinutes()).slice(-2);
	var seconds = d.getSeconds();
	if (seconds != 0 || microseconds != 0) {
		ret += ":" + seconds;
		if (microseconds != 0) {
			ret += "." + microseconds;
		}
    }
	return ret;
}


cr.VerboseDateLabelFormatter = function() {
    cr.LabelFormatter.call(this);

	this.dayFormatter = new cr.VerboseDayLabelFormatter();
	this.monthFormatter = new cr.VerboseMonthLabelFormatter(true);
}
cr.VerboseDateLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.VerboseDateLabelFormatter.prototype.format = function(time) {
	return this.dayFormatter.format(time) + " " + this.monthFormatter.format(time);
}


cr.DateLabelFormatter = function() {
    cr.LabelFormatter.call(this);
	this.dayFormatter = new cr.DayLabelFormatter();
	this.monthFormatter = new cr.MonthLabelFormatter(true);
}
cr.DateLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.DateLabelFormatter.prototype.format = function(time) {
	return this.dayFormatter.format(time) + " " + this.monthFormatter.format(time);
}


cr.DateNumberLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.DateNumberLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.DateNumberLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time*1000.));
	var ret = d.getDate();
	return ret;
}


cr.DayLabelFormatter = function () {
    cr.LabelFormatter.call(this);
	this.dateNumberFormatter = new cr.DateNumberLabelFormatter();
}
cr.DayLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.DayLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time*1000.));
	var ret = this._days[d.getDay()] + " " + this.dateNumberFormatter.format(time);
	return ret;
}

cr.VerboseDayLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.VerboseDayLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.VerboseDayLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time*1000.));
	var ret = this._verboseDays[d.getDay()] + " " + d.getDate();
	return ret;
}

cr.MonthLabelFormatter = function(includeYear) {
    cr.LabelFormatter.call(this);
	this.includeYear = includeYear;
    this.YearLabelFormatter = new cr.YearLabelFormatter();
}
cr.MonthLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.MonthLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	return this._months[d.getMonth()] + (this.includeYear ? " " + this.YearLabelFormatter.format(time) : "");
}


cr.VerboseMonthLabelFormatter = function(includeYear) {
    cr.LabelFormatter.call(this);
	this.includeYear = includeYear;
	this.YearLabelFormatter = new cr.YearLabelFormatter();
}
cr.VerboseMonthLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.VerboseMonthLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	return this._verboseMonths[d.getMonth()] + (this.includeYear ? " " + this.YearLabelFormatter.format(time) : "");
}

cr.YearLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.YearLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.YearLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	return d.getYear() + 1900;
}

cr.YearSmallLabelFormatter = function () {
    cr.LabelFormatter.call(this);
}
cr.YearSmallLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.YearSmallLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	var year = d.getYear() % 100;
	if (year < 0){
		year += 100;
	}
	return (year < 10 ? "'0" : "'") + year;
}


cr.DecadeLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.DecadeLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.DecadeLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	var decadeStart = (d.getYear() + 1900) / 10 * 10;
	var decadeEnd = decadeStart + 9;
	return decadeStart + " - " + decadeEnd;
}

cr.DecadeSmallLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.DecadeSmallLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.DecadeSmallLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	var decadeStart = (d.getYear() % 100);
	if (decadeStart < 0)
		decadeStart += 100;
	decadeStart = decadeStart / 10 * 10;
	return (decadeStart == 0 ? "'0" : "'") + decadeStart + "s";
}

cr.CenturyLabelFormatter = function () {
    cr.LabelFormatter.call(this);
}
cr.CenturyLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.CenturyLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	var centuryStart = (d.getYear() + 1900) / 100 * 100;
	var centuryEnd = centuryStart + 99;
	return centuryStart + " - " + centuryEnd;
}

cr.CenturySmallLabelFormatter = function() {
    cr.LabelFormatter.call(this);
}
cr.CenturySmallLabelFormatter.prototype = Object.create(cr.LabelFormatter.prototype);

cr.CenturySmallLabelFormatter.prototype.format = function(time) {
	var d = new Date(Math.round(time * 1000.0));
	var centuryStart = (d.getYear() + 1900) / 100 * 100;
	return centuryStart + "s";
}
