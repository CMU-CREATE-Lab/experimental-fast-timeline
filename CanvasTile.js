"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Creates a <code>CanvasTile</code>.
 *
 * @class
 * @constructor
 * @private
 * @param ctx - graphics context
 * @param {cr.TileIdx} tileidx - the tile index
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 */
cr.CanvasTile = function(ctx, tileidx, datasource) {
    this.ctx = ctx;
    this.canvas2d = ctx.canvas;
    this._tileidx = tileidx;
    this._datasource = datasource;
    this._ready = false;
    this._resolutionScale = window.devicePixelRatio || 1;

    var self = this;
    var tileLoader = new cr.TileLoader(datasource);
    tileLoader.load(tileidx, function(err, json) {
        if (err) {
            console.log(err);
        }
        else {
            var data = [];
            for (var i = 0; i < json.data.length; i++) {
                data.push(json.data[i][0]);
                data.push(json.data[i][1]);
                data.push(json.data[i][2]);
                data.push(json.data[i][3]);
            }

            self._setData(data);
        }
    });
};

cr.CanvasTile.prototype._setData = function(arrayBuffer) {
    this._pointCount = arrayBuffer.length / 4;
    this._data = arrayBuffer;
    this._ready = true;
};

/**
 * Returns wether the tile is ready.
 *
 * @return {boolean}
 */
cr.CanvasTile.prototype.isReady = function() {
    return this._ready;
};

cr.CanvasTile.prototype.delete = function() {
    // TODO
    //console.log('delete: ' + this._tileidx.toString());
};

cr.CanvasTile.prototype.draw = function(transform, options) {
    if (this._ready) {
        //// Line //
        var lineStyle = options.styles.lineStyle;
        if (lineStyle.show) {
          this.ctx.strokeStyle = 'rgb(' + lineStyle.color.r + ',' + lineStyle.color.g + ',' + lineStyle.color.b + ')';
          this.ctx.lineWidth = lineStyle.lineWidth;
          for (var i = 0; i <= this._pointCount * 4; i += 2) {
              this.ctx.beginPath();
              this.ctx.moveTo(transform.xScale * (this._data[i * 2 + 0] + transform.xOffset),
                              transform.yScale * (this._data[i * 2 + 1] + transform.yOffset));
              this.ctx.lineTo(transform.xScale * (this._data[i * 2 + 4] + transform.xOffset),
                              transform.yScale * (this._data[i * 2 + 5] + transform.yOffset));
              this.ctx.stroke();
          }
        }

        //// Point //
        // TODO: Only circles currently supported, which is always the first point style
        var pointStyle = options.styles.pointStyles[0];
        if (pointStyle.show) {
          this.ctx.lineWidth = pointStyle.lineWidth;
          var radius = pointStyle.radius - (pointStyle.lineWidth / 2);
          this.ctx.strokeStyle = 'rgb(' + pointStyle.color.r + ',' + pointStyle.color.g + ',' + pointStyle.color.b + ')';
          this.ctx.fillStyle = 'rgb(' + pointStyle.fillColor.r + ',' + pointStyle.fillColor.g + ',' + pointStyle.fillColor.b + ')';
          for (var i = 0; i <= this._pointCount * 4; i += 4) {
              this.ctx.beginPath();
              this.ctx.arc(transform.xScale * (this._data[i + 0] + transform.xOffset),
                           transform.yScale * (this._data[i + 1] + transform.yOffset),
                           radius * this._resolutionScale, 0, Math.PI * 2, true); // Outer circle
              if (pointStyle.fill) {
                this.ctx.fill();
              }
              this.ctx.stroke();
          }
        }
    }
};

/**
 * Update and draw tiles
 *
 * @param tiles
 * @param transform
 */
cr.CanvasTile.update = function(tiles, transform, options) {
    for (var i = 0; i < tiles.length; i++) {
        tiles[i].draw(transform, options);
    }
};
