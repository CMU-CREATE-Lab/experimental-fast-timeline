var cr = cr || {}

cr.Highlight = function (plotDiv) {
    this.div = plotDiv;
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("id", "highlight");
    this.canvas.style["width"] = plotDiv.style["width"];
    this.canvas.style["height"] = plotDiv.style["height"];
    this.canvas.style["position"] = "absolute";
    this.canvas.style.pointerEvents = 'none';
    this.resolutionScale = window.devicePixelRatio || 1;
    this.canvas.height = this.div.clientHeight * this.resolutionScale;
    this.canvas.width = this.div.clientWidth * this.resolutionScale;

    plotDiv.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this.resolutionScale,this.resolutionScale);

    this.points = {};
}

cr.Highlight.prototype.drawPoints = function(points) {
    if (this.points) {
        for (var i = 0; i < points.length; i++) {
          this.ctx.beginPath();
          this.ctx.arc(points[i].x, this.canvas.height - points[i].y, 3*window.devicePixelRatio, 0, Math.PI*2, true);
          this.ctx.fillStyle = "rgb(255,0,0)";
          this.ctx.fill();
      }
  }
}

cr.Highlight.prototype.drawMOPoint = function(transform, view) {
    if (this.point) {
      this.ctx.beginPath();
      this.ctx.arc(transform.xScale * (this.mopoint.x + transform.xOffset),
        transform.yScale * (this.mopoint.y + transform.yOffset),
        3*window.devicePixelRatio,
        0,
        Math.PI*2,
        true);
    this.ctx.fillStyle = "rgb(255,0,0)";
    this.ctx.fill();
  }
}
cr.Highlight.prototype.drawLine = function(x) {
    if (this.anchor) {
        this.ctx.clearRect (0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.lineWidth = 1.*window.devicePixelRatio;
        this.ctx.strokeStyle = "rgb(255,0,0)";
        this.ctx.moveTo(x,0);
        this.ctx.lineTo(x,this.canvas.height);
        this.ctx.stroke();
    }
}

cr.Highlight.prototype.resize = function() {
    var canvasWidth = this.div.clientWidth * window.devicePixelRatio;
    var canvasHeight = this.div.clientHeight * window.devicePixelRatio;
    if (this.canvas.width != canvasWidth ||
        this.canvas.height != canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;

      this.canvas.style["width"] = this.div.style["width"];
      this.canvas.style["height"] = this.div.style["height"];

    }


}
