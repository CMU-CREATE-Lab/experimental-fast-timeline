"use strict";

function DataStoreTileLayer(rootUrl, glb, ctx) {
  this.glb = glb;
  this.ctx = ctx;
  this._rootUrl = rootUrl;
  var that = this;

  function createTile(ti, bounds) {
    var url = rootUrl + '/' + ti.l + '.' + ti.o;
    if (that.glb && that.useWebgl) {
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
    if (this.glb && this.useWebgl) {
        this.drawWebgl(view);
    } else {
        this.drawCanvas(view);
    }
}

DataStoreTileLayer.prototype.drawWebgl = function(view) {
    this.glb.gl.clear(plot.gl.COLOR_BUFFER_BIT);

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
    this._tileView.update(pMatrix);
}


DataStoreTileLayer.prototype.drawCanvas = function(view) {
    this.ctx.clearRect (0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = plot.canvas2d.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = plot.canvas2d.height / (view.ymin - view.ymax);

    this._tileView.setView({min:view.xmin, max:view.xmax});
    this._tileView.update(transform);


}
