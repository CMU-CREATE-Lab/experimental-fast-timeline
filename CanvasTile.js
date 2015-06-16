"use strict";

function CanvasTile(ctx, tileidx, url) {
  this.ctx = ctx;
  this.canvas2d = ctx.canvas;
  this._tileidx = tileidx;
  this._url = url;
  this._ready = false;
  this._load();

}

CanvasTile.prototype._load = function() {
  var that = this;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', that._url);
  xhr.onload = function() {
    var json = JSON.parse(this.responseText);
    var float32Array = that._parseJSON(json);
    that._setData(float32Array);
  }
  xhr.send();
}

CanvasTile.prototype._parseJSON = function(json) {
    var data = [];
    for (var i = 0; i < json.data.data.length; i++) {
        for (var j = 0; j < json.data.data[i].length; j++) {
            data.push(json.data.data[i][j]);
        }
    }
    return new Float32Array(data);
}

CanvasTile.prototype._setData = function(arrayBuffer) {
  this._pointCount = arrayBuffer.length / 4;
  this._data = arrayBuffer;
  this._ready = true;
}


CanvasTile.prototype.isReady = function() {
  return this._ready;
}

CanvasTile.prototype.delete = function() {
  console.log('delete: ' + this._tileidx.toString());
}

CanvasTile.prototype.draw = function(transform) {
  if (this._ready) {

      for (var i = 0; i <= this._pointCount*4; i+=2) {
          this.ctx.beginPath();
          this.ctx.moveTo(transform.xScale * (this._data[i * 2 + 0] + transform.xOffset),
                          transform.yScale * (this._data[i * 2 + 1] + transform.yOffset));
          this.ctx.lineTo(transform.xScale * (this._data[i * 2 + 4] + transform.xOffset),
                          transform.yScale * (this._data[i * 2 + 5] + transform.yOffset));
          this.ctx.stroke();
      }

      for (var i = 0; i <= this._pointCount*4; i+=4) {
          this.ctx.beginPath();
          this.ctx.arc(transform.xScale * (this._data[i + 0] + transform.xOffset),
                       transform.yScale * (this._data[i + 1] + transform.yOffset),
                       2*window.devicePixelRatio, 0, Math.PI*2, true); // Outer circle
          this.ctx.fill();

      }

  }
}

// Update and draw tiles
CanvasTile.update = function(tiles, transform) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i].draw(transform);
  }
}
