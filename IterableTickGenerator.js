"use strict";
var cr = cr || {};

cr.IterableTickGenerator = function(gen, minValue, maxValue) {
    this._gen = gen;
    this._maxValue = maxValue;
    this._minValue = minValue;

    this._currTick = 0.0;
    this._nextTick = gen.nextTick(minValue);
}

cr.IterableTickGenerator.prototype.hasNext = function() {
    return this._nextTick <= this._maxValue;
}

cr.IterableTickGenerator.prototype.next = function() {
    if (!this.hasNext()) {
        return false;
    }

    this._currTick = this._nextTick;
    this._nextTick = this._gen.nextTick();
    return this._currTick;
}
