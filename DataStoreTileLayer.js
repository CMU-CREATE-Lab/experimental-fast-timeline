"use strict";

function DataStoreTileLayer(rootUrl, glb, ctx) {
  this.glb = glb;
  this.ctx = ctx;
  this._rootUrl = rootUrl;
  var that = this;

  function createTile(ti, bounds) {
    var url = rootUrl + '/' + ti.l + '.' + ti.o;
    if (that.glb && that.usewebgl) {
      return new DataStoreTile(glb, ti, url);
    } else {
      return new CanvasTile(ctx, ti, url);
    }
  }

  this._tileView = new TileView({
      createTile: createTile,
      deleteTile: function(tile) {},
      updateTile: (that.glb && that.useWebgl) ? DataStoreTile.update : CanvasTile.update
    });

  this.destroy = function() {
    this._tileView._destroy();
  };

}

DataStoreTileLayer.prototype.draw = function(view) {
    if (this.glb && this.usewebgl) {
        this.drawWebgl(view);
    } else {
        this.drawCanvas(view);
    }
    this._needsUpdate = this._tileView._needsUpdate;
}

DataStoreTileLayer.prototype.drawWebgl = function(view) {
    //this.glb.gl.clear(this.glb.gl.COLOR_BUFFER_BIT);

    var pMatrix = new Float32Array([1, 0, 0, 0,
                                0, 1, 0, 0,
                                0, 0, 1, 0,
                                0, 0, 0, 1]);

    var xscale = 2 / (view.xmax - view.xmin);
    var xtranslate = -view.xmin * xscale - 1;
    var yscale = 2 / (view.ymax - view.ymin);
    var ytranslate = -view.ymin * yscale - 1;
    pMatrix[0] = xscale;
    pMatrix[12] = xtranslate;
    pMatrix[5] = yscale;
    pMatrix[13] = ytranslate;

    this._tileView.setView({min:view.xmin, max:view.xmax});
//    this._tileView.update(pMatrix);
    this._tileView.update(view);
}


DataStoreTileLayer.prototype.drawCanvas = function(view) {
    this.ctx.clearRect (0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = this.ctx.canvas.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = this.ctx.canvas.height / (view.ymin - view.ymax);

    this._tileView.setView({min:view.xmin, max:view.xmax});
    this._tileView.update(transform);


}

DataStoreTileLayer.prototype.search = function(bbox) {
    var keys = Object.keys(this._tileView._tiles).sort();
    var matches = [];
    for (var i = 0; i < keys.length; i++) {
        var offset = this._tileView._tiles[keys[i]].offset;
        var data = this._tileView._tiles[keys[i]]._data;
        if (data) {
        for (var j = 0; j < data.length; j+=4) {
            if (bbox.xmin <= data[j]+offset && bbox.xmax >= data[j]+offset &&
                bbox.ymin <= data[j+1] && bbox.ymax >= data[j+1]) {
                return {
                    x: data[j]+offset,
                    y: data[j + 1],
                    tile: this._tileView._tiles[keys[i]]
                };
            }
        }
        }
    }
    return null;
}

DataStoreTileLayer.prototype.searchByX = function(bbox) {
    var keys = Object.keys(this._tileView._tiles).sort();
    var matches = [];
    for (var i = 0; i < keys.length; i++) {
        var offset = this._tileView._tiles[keys[i]].offset;
        var data = this._tileView._tiles[keys[i]]._data;
        if (data) {
        for (var j = 0; j < data.length; j+=4) {
            if (data[j] + offset >= bbox.xmin && data[j] + offset <= bbox.xmax) {
                    return {x: data[j] + offset, y: data[j + 1]};
            }
        }
        }
    }
    return null;
}
