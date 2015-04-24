"use strict";
var cr = cr || {};

cr.Basis = function (x, y) {
    this.x = x;
	this.y = y;
}

cr.Basis.YAxisBasis = new cr.Basis(new cr.Vector2(1, 0), new cr.Vector2(0, -1));

cr.Basis.XAxisBasis = new cr.Basis(new cr.Vector2(0, -1), new cr.Vector2(1, 0));
