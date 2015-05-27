"use strict";

function DataStoreTileLayer(glb, rootUrl) {
  this.glb = glb;
  this.gl = glb.gl;
  this._rootUrl = rootUrl;

  function createTile(ti, bounds) {
    var url = rootUrl + '/' + ti.l + '.' + ti.o;
    return new DataStoreTile(glb, ti, url);
  }

  this._tileView = new TileView({
      createTile: createTile,
      deleteTile: function(tile) {},
      updateTile: DataStoreTile.update
    });

  this.destroy = function() {
    this._tileView._destroy();
  };

}

DataStoreTileLayer.prototype.draw = function(view) {
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
