"use strict";

function CanvasTile(ctx, tileidx, url) {
  this.ctx = ctx;
  this.canvas2d = ctx.canvas;
  this._tileidx = tileidx;
  this._url = url;
  this._ready = false;
  this._resolutionScale = window.devicePixelRatio || 1;

  this._load();

}

CanvasTile.prototype._load = function() {
  var that = this;
  function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat( RegExp.$1 );
    }
    return rv;
  }

  if (XDomainRequest && getInternetExplorerVersion() < 10.) {
      var xdr = new window.XDomainRequest();
      xdr.onprogress = function() {}; // no aborting
      xdr.ontimeout = function() {}; // "
      xdr.onload = function() {
          var json = JSON.parse(this.responseText);
          var float32Array = that._parseJSON(json);
          that._setData(float32Array);
      };
      xdr.onerror = function() {
          // error handling
      };
      xdr.open("GET", that._url, true);
      xdr.send();
  } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', that._url);
      xhr.onload = function() {
        var json = JSON.parse(this.responseText);
        var float32Array = that._parseJSON(json);
        that._setData(float32Array);
      }
      xhr.send();
  }
}

CanvasTile.prototype._parseJSON = function(json) {
    var data = [];
    for (var i = 0; i < json.data.data.length; i++) {
        for (var j = 0; j < json.data.data[i].length; j++) {
            data.push(json.data.data[i][j]);
        }
    }
    //return new Float32Array(data);
    return data;
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
          this.ctx.strokeStyle = 'black';
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(transform.xScale * (this._data[i * 2 + 0] + transform.xOffset),
                          transform.yScale * (this._data[i * 2 + 1] + transform.yOffset));
          this.ctx.lineTo(transform.xScale * (this._data[i * 2 + 4] + transform.xOffset),
                          transform.yScale * (this._data[i * 2 + 5] + transform.yOffset));
          this.ctx.stroke();
      }

      for (var i = 0; i <= this._pointCount*4; i+=4) {
          this.ctx.beginPath();
          this.ctx.fillStyle = "black";
          this.ctx.arc(transform.xScale * (this._data[i + 0] + transform.xOffset),
                       transform.yScale * (this._data[i + 1] + transform.yOffset),
                       2*this._resolutionScale, 0, Math.PI*2, true); // Outer circle
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
