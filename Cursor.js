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
    this._cursor.style["marginTop"] = Math.ceil(plotDiv.offsetHeight / 2) + "px";
    this._cursor.style["display"] == "none";
    //this._cursor.style["display"] = "none";
    plotDiv.appendChild(this._cursor);

    this.x = null;

    this.timeGraphAxis = null;

    $('#cursor').mousedown(this,this.mousedown);
    $('#cursor').mousemove(this,this.mousemove);
    $('#cursor').mouseup(this, this.mouseup);

    this.lastMouse = null;
}

cr.Cursor.prototype.update = function(x) {
    if (this.x) {
        this._cursor.style["display"] = "block";
        this._cursor.style["left"] = x + "px";
    }
}
cr.Cursor.prototype.mousedown = function(e) {
  var that = e.data;
  that.lastMouse = e;
  return false;

}


cr.Cursor.prototype.mousemove = function(e) {
    var that = e.data;
    if (!e.which) {
        that.mouseup(e);
        return;
    }

    if (that.lastMouse) {
        var dx = e.clientX - that.lastMouse.clientX;
        var currentPx = parseInt(that._cursor.style["left"]);
        currentPx += dx;
        that._cursor.style["left"] = currentPx + "px";
        //that.update(dx);
        that.lastMouse = e;
    }
    return false;
}

cr.Cursor.prototype.mouseup = function(e) {
    var that = e.data;
    that.lastMouse = null;
}
