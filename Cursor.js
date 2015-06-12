var cr = cr || {};

cr.Cursor = function (plotDiv) {
    this._cursor = document.createElement("div");
    this._cursor.setAttribute("id", "cursor");
    this._cursor.style["width"] = 0;
    this._cursor.style["height"] = 0;
    this._cursor.style["borderStyle"] = "solid";
    this._cursor.style["borderWidth"] = "20px 10px 0 10px";
    this._cursor.style["borderColor"] = "rgb(255,0,0) transparent transparent transparent";
    this._cursor.style["position"] = "absolute";
    plotDiv.appendChild(this._cursor);
}

cr.Cursor.prototype.draw = function(transform) {
    this._cursor.style["left"] = (transform.xScale * (this.position + transform.xOffset))/window.devicePixelRatio - 10 + "px";
}
