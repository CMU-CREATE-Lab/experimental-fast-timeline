"use strict";
var cr = cr || {};

cr.TickGenerator = function(tickSize, offset) {
    this._tickSize = tickSize;
    this._offset = offset;
    this._currentTick = 0.0;
}

cr.TickGenerator.prototype.nextTick = function(min) {
    if (min) {
        this._currentTick = this.closestTick(min - this._tickSize);
        while (this._currentTick < min) {
            this.advanceTick();
        }
    } else {
        this.advanceTick();
    }
    return this._currentTick;
}


cr.TickGenerator.prototype.advanceTick = function() {
	this._prevTick = this._currentTick;
	this._currentTick = this.closestTick(this._currentTick + this._tickSize);
	if (this._currentTick <= this._prevTick) {
        console.log("FIXME");
		//currentTick = prevTick + MathEx.ulp(prevTick);
    }
}

cr.TickGenerator.prototype.closestTick = function(val) {
	return Math.round((val - this._offset) / this._tickSize) * this._tickSize + this._offset;
}
