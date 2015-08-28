'use strict';
var cr = cr || {};
/**
 * 2D Vector Class -- ported from Vector2.java
 * @constructor
 * @param {number} x
 * @param {number} y
 */
cr.Vector2 = function(x, y) {
    this._x = x;
    this._y = y;
};

/**
 * Getter for x value
 * @return {number}
 */
cr.Vector2.prototype.getX = function() {
    return this._x;
};

/**
 * Getter for y value
 * @return {number}
 */
cr.Vector2.prototype.getY = function() {
    return this._y;
};

/**
 * Scale a vector
 * @param  {number} value
 * @return {cr.Vector2} New Vector2 scaled by value
 */
cr.Vector2.prototype.scale = function(value) {
    return new cr.Vector2(this._x * value, this._y * value);
};

/**
 * Add two Vector2 objects
 * @param  {cr.Vector2} v Vector2 object to be added
 * @return {cr.Vector2}   New Vector2 object that is the sum of this + v
 */
cr.Vector2.prototype.add = function(v) {
    return new cr.Vector2(this._x + v._x, this._y + v._y);
};

/**
 * Distance between two vectors
 * @param  {cr.Vector2} v Vector2 some distance from this
 * @return {number}   Euclidean distance between this and v
 */
cr.Vector2.prototype.distance = function(v) {
    return Math.sqrt(Math.pow(this._x - v._x, 2) + Math.pow(this._y - v._y, 2));
};
