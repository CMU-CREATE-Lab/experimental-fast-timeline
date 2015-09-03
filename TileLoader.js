"use strict";

var cr = cr || {};

cr.TileLoader = function(datasource) {
    if (typeof datasource !== 'function') {
        throw new Error("The datasource must be a function.");
    }
    this._datasource = datasource;
};

cr.TileLoader.prototype.load = function(tileIdx, callback) {
    if (typeof callback !== 'function') {
        throw new Error("The callback must be a function.");
    }
    try {
        this._datasource(tileIdx.l,
                         tileIdx.o,
                         function(json) {

                             if (typeof json === 'undefined' || json == null) {
                                 callback(new Error("Datasource loaded undefined or null JSON for tile [" + (this._tileidx.toString()) + "]"));
                             }
                             else {
                                 // if it's a string, first parse it into JSON
                                 if (typeof json === 'string' || json instanceof String) {
                                     try {
                                         json = JSON.parse(json);
                                     }
                                     catch (e) {
                                         return callback(new Error("Datasource loaded invalid JSON string for tile [" + (this._tileidx.toString()) + "]: " + e));
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
                                     return callback(new Error("Datasource loaded invalid JSON object for tile [" + (this._tileidx.toString()) + "]: "));
                                 }
                             }
                         });
    }
    catch (e) {
        return callback(new Error("Error while calling datasource function for tile [" + (this._tileidx.toString()) + "]: " + e));
    }
};
