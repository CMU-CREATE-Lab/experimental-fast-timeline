"use strict";

/** @namespace */
var cr = cr || {};

/**
 * Creates a <code>DataStoreTileLayer</code>.
 *
 * @class
 * @constructor
 * @private
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 * @param {cr.Glb} glb
 * @param ctx - canvas 2D context
 */
cr.DataStoreTileLayer = function(datasource, glb, ctx) {
    this.glb = glb;
    this.ctx = ctx;
    var that = this;

    function createTile(ti, bounds) {
        if (that.glb && that.usewebgl) {
            return new cr.DataStoreTile(glb, ti, datasource);
        }
        else {
            return new cr.CanvasTile(ctx, ti, datasource);
        }
    }

    this._tileView = new cr.TileView({
        createTile : createTile,
        deleteTile : function(tile) {
        },
        updateTile : (that.glb && that.useWebgl) ? cr.DataStoreTile.update : cr.CanvasTile.update
    });

    this.destroy = function() {
        this._tileView._destroy();
    };
};

cr.DataStoreTileLayer.prototype.draw = function(view) {
    if (this.glb && this.usewebgl) {
        this.drawWebgl(view);
    }
    else {
        this.drawCanvas(view);
    }
    this._needsUpdate = this._tileView._needsUpdate;
};

cr.DataStoreTileLayer.prototype.drawWebgl = function(view) {
    // TODO: this fixes the repaint problem in iOS Safari, but breaks
    // multiple plots in one container--only the last will get drawn.
    // this.glb.gl.clear(this.glb.gl.COLOR_BUFFER_BIT);

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

    this._tileView.setView({ min : view.xmin, max : view.xmax });
    //    this._tileView.update(pMatrix);
    this._tileView.update(view);
};

cr.DataStoreTileLayer.prototype.drawCanvas = function(view) {
    //this.ctx.clearRect (0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    var transform = {};
    transform.xOffset = -view.xmin;
    transform.xScale = this.ctx.canvas.width / (view.xmax - view.xmin);
    transform.yOffset = -view.ymax;
    transform.yScale = this.ctx.canvas.height / (view.ymin - view.ymax);

    this._tileView.setView({ min : view.xmin, max : view.xmax });
    this._tileView.update(transform);

};

cr.DataStoreTileLayer.prototype.search = function(bbox) {
    var keys = Object.keys(this._tileView._tiles).sort();
    var matches = [];
    for (var i = 0; i < keys.length; i++) {
        var offset = this._tileView._tiles[keys[i]].offset || 0;
        var data = this._tileView._tiles[keys[i]]._data;
        if (data) {
            for (var j = 0; j < data.length; j += 4) {
                if (bbox.xmin <= data[j] + offset && bbox.xmax >= data[j] + offset &&
                    bbox.ymin <= data[j + 1] && bbox.ymax >= data[j + 1]) {
                    return {
                        x : data[j] + offset,
                        y : data[j + 1],
                        tile : this._tileView._tiles[keys[i]]
                    };
                }
            }
        }
    }
    return null;
};

cr.DataStoreTileLayer.prototype.searchByX = function(bbox) {
    var keys = Object.keys(this._tileView._tiles).sort();
    var matches = [];
    for (var i = 0; i < keys.length; i++) {
        var offset = this._tileView._tiles[keys[i]].offset || 0;
        var data = this._tileView._tiles[keys[i]]._data;
        if (data) {
            for (var j = 0; j < data.length; j += 4) {
                if (data[j] + offset >= bbox.xmin && data[j] + offset <= bbox.xmax) {
                    return { x : data[j] + offset, y : data[j + 1] };
                }
            }
        }
    }
    return null;
};

/**
 * Returns an <code>AxisRange</code> instance containing the min and max data values for all samples within the given
 * <code>timeRange</code>.  Returns <code>null</code> if there's no data within the range for the currently-loaded
 * tiles.
 *
 * @param {AxisRange} timeRange
 * @return {AxisRange}
 */
cr.DataStoreTileLayer.prototype.getMinMaxValue = function(timeRange) {
    var keys = Object.keys(this._tileView._tiles).sort();

    var minmax = null;
    var foundData = false;
    for (var i = 0; i < keys.length; i++) {
        var offset = this._tileView._tiles[keys[i]].offset || 0;
        var data = this._tileView._tiles[keys[i]]._data;
        if (data) {
            if (minmax == null) {
                minmax = {
                    min : Number.MAX_VALUE,
                    max : -Number.MAX_VALUE
                };
            }
            for (var j = 0; j < data.length; j += 4) {
                var timestamp = data[j] + offset;
                var value = data[j + 1];
                if (isFinite(value) &&
                    value > cr.TileConstants.TILE_BOUNDARY_SENTINAL_VALUE &&
                    timestamp >= timeRange.min &&
                    timestamp <= timeRange.max) {
                    minmax.min = Math.min(minmax.min, value);
                    minmax.max = Math.max(minmax.max, value);
                    foundData = true;
                }
            }
        }
    }

    return foundData ? minmax : null;
};
