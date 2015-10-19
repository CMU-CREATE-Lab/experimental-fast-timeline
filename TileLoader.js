"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Creates a tile loader for the given <code>datasource</code>.
 *
 * @class
 * @constructor
 * @private
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 */
cr.TileLoader = function(datasource) {
    if (typeof datasource !== 'function') {
        throw new Error("The datasource must be a function.");
    }
    this._datasource = datasource;
};

/**
 * The function which the datasource function will call upon success, giving it the tile JSON.
 *
 * @callback tileLoaderSuccessCallbackFunction
 * @param {object} err - an Error instance if an error occurred, otherwise <code>null</code>
 * @param {object} json - the tile JSON
 */

/**
 * Loads the tile specified by the given <code>tileIdx</code>.
 *
 * @param {cr.TileIdx} tileIdx - the tile index
 * @param {tileLoaderSuccessCallbackFunction} callback - the callback function used to return the tile JSON, or to return the error if one occurred.
 */
cr.TileLoader.prototype.load = function(tileIdx, callback) {
    if (typeof callback !== 'function') {
        throw new Error("The callback must be a function.");
    }
    try {
        this._datasource(tileIdx.l,
                         tileIdx.o,
                         function(json) {

                             if (typeof json === 'undefined' || json == null) {
                                 callback(new Error("Datasource loaded undefined or null JSON for tile [" + (tileIdx.toString()) + "]"));
                             }
                             else {
                                 // if it's a string, first parse it into JSON
                                 if (typeof json === 'string' || json instanceof String) {
                                     try {
                                         json = JSON.parse(json);
                                     }
                                     catch (e) {
                                         return callback(new Error("Datasource loaded invalid JSON string for tile [" + (tileIdx.toString()) + "]: " + e));
                                     }
                                 }

                                 // a few checks to make sure the json variable is a JSON object with a non-empty data array
                                 if (json != null &&
                                     typeof json === 'object' &&
                                     !Array.isArray(json) &&
                                     Array.isArray(json.data)) {

                                     callback(null, json);
                                 }
                                 else {
                                     return callback(new Error("Datasource loaded invalid JSON object for tile [" + (tileIdx.toString()) + "]: "));
                                 }
                             }
                         });
    }
    catch (e) {
        return callback(new Error("Error while calling datasource function for tile [" + (tileIdx.toString()) + "]: " + e));
    }
};
