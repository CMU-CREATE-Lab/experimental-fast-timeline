'use strict';

/** @namespace */
var cr = cr || {};

/**
 * Basis Class -- ported from Basis.java
 * @class
 * @constructor
 * @param {cr.Vector2} x
 * @param {cr.Vector2} y
 */
cr.Basis = function(x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Basis for y axis
 */
cr.Basis.YAxisBasis = new cr.Basis(new cr.Vector2(1, 0), new cr.Vector2(0, -1));

/**
 * Basis for x axis
 */
cr.Basis.XAxisBasis = new cr.Basis(new cr.Vector2(0, -1), new cr.Vector2(1, 0));
