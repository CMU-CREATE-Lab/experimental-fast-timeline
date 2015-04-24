"use strict";
var cr = cr || {};

cr.Vector2 = function (x, y) {
    this._x = x;
  	this._y = y;
}

cr.Vector2.prototype.scale = function(value) {
    return new cr.Vector2(this._x * value, this._y * value);
 }

cr.Vector2.prototype.add = function(v) {
    return new cr.Vector2(this._x + v._x, this._y + v._y);
 }

cr.Vector2.prototype.subtract = function(v){
    return new cr.Vector2(this._x - v._x, this._y - v._y);
}
