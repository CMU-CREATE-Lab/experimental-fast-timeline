"use strict";

var cr = cr || {};

/**
 * Utility class for generating a UUID.  All methods are static, so there's no need to create an instance.
 *
 * @class
 * @constructor
 * @protected
 */
cr.Uuid = function() {
};

/**
 * Returns an RFC 4122 version 4 compliant UUID.
 *
 * @type {string}
 */
cr.Uuid.getUuid = function() {
    // Found this badassery at http://stackoverflow.com/a/2117523/703200
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};