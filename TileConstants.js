"use strict";

var cr = cr || {};

/**
 * Utility class for tile-related constants.  All fields are static, so there's no need to create an instance.
 *
 * @constructor
 * @private
 */
cr.TileConstants = function() {
};

/**
 * Values in the "mean" field of -1E+308 within tiles returned from the BodyTrack Datastore indicate a longer than usual
 * break in the data. We use it in the grapher to know whether to connect points on either side of it with lines or not.
 * Otherwise, they are typically ignored.
 *
 * @type {int}
 */
cr.TileConstants.TILE_BOUNDARY_SENTINAL_VALUE = -1E+308;

// make the fields in this class constants
Object.freeze(cr.TileConstants);