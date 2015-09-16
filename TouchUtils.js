"use strict";

/** @namespace */
var cr = cr || {};

/**
 * @class
 * @constructor
 * @private
 */
cr.TouchUtils = function() {
};

cr.TouchUtils.prototype._getX = function(touch) {
    // if this is an actual touch event, we need to subtract away the parent's offset
    if (typeof touch.target !== 'undefined') {
        return touch.pageX - touch.target.offsetParent.offsetLeft;
    }

    return touch.x;
};

cr.TouchUtils.prototype._getY = function(touch) {
    // if this is an actual touch event, we need to subtract away the parent's offset
    if (typeof touch.target !== 'undefined') {
        return touch.pageY - touch.target.offsetParent.offsetTop;
    }

    return touch.y;
};

cr.TouchUtils.prototype.copyTouches = function(touches) {
    var ret = [];
    for (var i = 0; i < touches.length; i++) {
        ret.push({ x : this._getX(touches[i]), y : this._getY(touches[i]) });
    }
    return ret;
};

cr.TouchUtils.prototype.centroid = function(touches) {
    var ret = { x : 0, y : 0 };
    for (var i = 0; i < touches.length; i++) {
        var x = this._getX(touches[i]);
        var y = this._getY(touches[i]);
        console.log("(" + x + "," + y + ")");
        ret.x += x;
        ret.y += y;
    }
    ret.x /= touches.length;
    ret.y /= touches.length;
    return ret;
};

cr.TouchUtils.prototype.xSpan = function(touches) {
    return Math.abs(this._getX(touches[0]) - this._getX(touches[1]));
};

cr.TouchUtils.prototype.ySpan = function(touches) {
    return Math.abs(this._getY(touches[0]) - this._getY(touches[1]));
};

cr.TouchUtils.prototype.isXPinch = function(touches) {
    return touches.length == 2 && this.xSpan(touches) > this.ySpan(touches);
};

cr.TouchUtils.prototype.isYPinch = function(touches) {
    return touches.length == 2 && this.ySpan(touches) > this.xSpan(touches);
};
