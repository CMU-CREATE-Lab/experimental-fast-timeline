"use strict";

var cr = cr || {};

/**
 * Utility class for time-related constants.  All fields are static, so there's no need to create an instance.
 *
 * @constructor
 * @private
 */
cr.TimeConstants = function() {
};

/**
 * The number of seconds in one hour.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_HOUR = 3600;

/**
 * The number of seconds in one day.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_DAY = cr.TimeConstants.SECONDS_IN_HOUR * 24;

/**
 * The number of seconds in one week.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_WEEK = cr.TimeConstants.SECONDS_IN_DAY * 7;

/**
 * The number of seconds in one year.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_YEAR = 31556926;

/**
 * The number of seconds in one decade.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_DECADE = cr.TimeConstants.SECONDS_IN_YEAR * 10;

/**
 * The number of seconds in one centiry.
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_CENTURY = cr.TimeConstants.SECONDS_IN_DECADE * 10;

/**
 * The number of seconds in one month (on average).
 *
 * @type {int}
 */
cr.TimeConstants.SECONDS_IN_MONTH = Math.round(cr.TimeConstants.SECONDS_IN_YEAR / 12.);

// make the fields in this class constants
Object.freeze(cr.TimeConstants);