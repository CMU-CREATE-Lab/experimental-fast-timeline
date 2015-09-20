"use strict";

/** @namespace */
var cr = cr || {};

/**
 * @class
 * @constructor
 * @protected
 */
cr.TouchUtils = function() {
};

cr.TouchUtils.prototype._getX = function(touch) {
    // if this is an actual touch event, return the X component of the page position
    if (touch instanceof Touch) {
        return touch.pageX;
    }

    // otherwise, we must be dealing with a copied touch (see cr.TouchUtils.prototype.copyTouches), so just return x
    return touch.x;
};

cr.TouchUtils.prototype._getY = function(touch) {
    // if this is an actual touch event, return the Y component of the page position
    if (touch instanceof Touch) {
        return touch.pageY;
    }

    // otherwise, we must be dealing with a copied touch (see cr.TouchUtils.prototype.copyTouches), so just return y
    return touch.y;
};

cr.TouchUtils.prototype.copyTouches = function(touches) {
    var ret = [];
    for (var i = 0; i < touches.length; i++) {
        ret.push({ x : this._getX(touches[i]), y : this._getY(touches[i]) });
    }
    return ret;
};

// For the given collection of touches, returns the page position centroid
cr.TouchUtils.prototype.centroid = function(touches) {
    if (touches.length == 1) {
        return {
            x : this._getX(touches[0]),
            y : this._getY(touches[0])
        };
    }
    else {
        var centroid = { x : 0, y : 0 };

        for (var i = 0; i < touches.length; i++) {
            centroid.x += this._getX(touches[i]);
            centroid.y += this._getY(touches[i]);
        }
        centroid.x /= touches.length;
        centroid.y /= touches.length;

        return centroid;
    }
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

// TODO: move this to a DomUtils class or somesuch?
cr.TouchUtils.getElementPagePosition = function(element) {
    var position = { x : 0, y : 0 };

    if (element) {
        do {
            position.x += element.offsetLeft;
            position.y += element.offsetTop;
            element = element.offsetParent;
        }
        while (element != null);
    }

    return position;
};

// Given a collection of touches, returns an array of touches which only includes touches targeting the element with the given ID.
cr.TouchUtils.filterTouchesForElement = function(touches, elementId) {
    var filteredTouches = [];
    if (touches && touches.length > 0) {
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (touch.target && touch.target.id == elementId) {
                filteredTouches.push(touch);
            }
        }
    }
    return filteredTouches;
};
