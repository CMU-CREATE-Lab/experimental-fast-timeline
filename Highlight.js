var cr = cr || {}

cr.Highlight = function (plotDiv) {
    this._highlight = document.createElement("canvas");
    this._highlight.setAttribute("id", "highlight");
    this._highlight.style["width"] = "100%";
    this._highlight.style["height"] = "100%";
    this._highlight.style["position"] = "absolute";
    this._highlight.style.pointerEvents = 'none';

    plotDiv.appendChild(this._highlight);
    this._ctx = this._highlight.getContext('2d');
}

cr.Highlight.prototype.drawPoint = function(transform, view) {
    this._ctx.beginPath();
    this._ctx.arc(transform.xScale * (this.point.x + transform.xOffset),
        transform.yScale * (this.point.y + transform.yOffset),
        3*window.devicePixelRatio,
        0,
        Math.PI*2,
        true);
    this._ctx.fillStyle = "rgb(255,0,0)";
    this._ctx.fill();
}

cr.Highlight.prototype.drawMOPoint = function(transform, view) {
    this._ctx.beginPath();
    this._ctx.arc(transform.xScale * (this.mopoint.x + transform.xOffset),
        transform.yScale * (this.mopoint.y + transform.yOffset),
        3*window.devicePixelRatio,
        0,
        Math.PI*2,
        true);
    this._ctx.fillStyle = "rgb(255,0,0)";
    this._ctx.fill();
}

cr.Highlight.prototype.drawLine = function(transform, view) {
    this._ctx.beginPath();
    this._ctx.lineWidth = 1.5*window.devicePixelRatio;
    this._ctx.strokeStyle = "rgb(255,0,0)";
    this._ctx.moveTo(transform.xScale * (this.line.x + transform.xOffset),0);
    this._ctx.lineTo(transform.xScale * (this.line.x + transform.xOffset),
        transform.yScale * (view.ymin + transform.yOffset));
    this._ctx.stroke();
}
