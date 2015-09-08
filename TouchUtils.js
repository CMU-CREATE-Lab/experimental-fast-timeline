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

cr.TouchUtils.prototype.copyTouches = function(touches) {
    var ret = [];
    for (var i = 0; i < touches.length; i++) {
        ret.push({ clientX : touches[i].clientX, clientY : touches[i].clientY });
    }
    return ret;
};

cr.TouchUtils.prototype.centroid = function(touches) {
    var ret = { clientX : 0, clientY : 0 };
    for (var i = 0; i < touches.length; i++) {
        ret.clientX += touches[i].clientX;
        ret.clientY += touches[i].clientY;
    }
    ret.clientX /= touches.length;
    ret.clientY /= touches.length;
    return ret;
};

cr.TouchUtils.prototype.xSpan = function(touches) {
    return Math.abs(touches[0].clientX - touches[1].clientX);
};

cr.TouchUtils.prototype.ySpan = function(touches) {
    return Math.abs(touches[0].clientY - touches[1].clientY);
};

cr.TouchUtils.prototype.isXPinch = function(touches) {
    return touches.length == 2 && this.xSpan(touches) > this.ySpan(touches);
};

cr.TouchUtils.prototype.isYPinch = function(touches) {
    return touches.length == 2 && this.ySpan(touches) > this.xSpan(touches);
};
