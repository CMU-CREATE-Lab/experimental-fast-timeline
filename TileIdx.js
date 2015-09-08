"use strict";

/** @namespace */
var cr = cr || {};

/**
 * An index for a tile.
 *
 * @class
 * @constructor
 * @param {int} l - the tile's level
 * @param {int} o - the tile's offset
 */
cr.TileIdx = function(l, o) {
    this.l = l;
    this.o = o;
    var level, offset;

    if (l < 0) {
        level = "-" + ('00' + (l).toString().split("-")[1]).substr(-3);
    }
    else {
        level = ('00' + l).substr(-3);
    }

    if (o < 0) {
        offset = "-" + ('00000000000000000000' + (o).toString().split("-")[1]).substr(-19);
    }
    else {
        offset = ('00000000000000000000' + o).substr(-19);
    }

    this.key = level + offset;
};

/**
 * Creates and returns a new <code>TileIdx</code> for this tile's parent.
 *
 * @return {cr.TileIdx}
 */
cr.TileIdx.prototype.parent = function() {
    return new cr.TileIdx(this.l + 1, this.o >> 1);
};

/**
 * Returns a string representation of this tile.
 *
 * @return {string}
 */
cr.TileIdx.prototype.toString = function() {
    return this.l + '.' + this.o;
};
