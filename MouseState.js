"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Class to keep track of various Mouse states.
 *
 * @class
 * @constructor
 * @protected
 */
cr.MouseState = function() {
    this.mouseDown = false;
    this.lastMouse = null;
};

cr.MouseState.setLastMouse = function(e) {
    this.lastMouse = e;
};

cr.MouseState.setIsMouseDown = function(state) {
    this.mouseDown = state;
};

cr.MouseState.isMouseDown = function() {
    return this.mouseDown;
};

cr.MouseState.getLastMouse = function() {
    return this.lastMouse;
};
