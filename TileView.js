"use strict";

// Manage a zoomable pannable mosaic of level-of-detail tiles.

// Usage:
//
// This connects to your own tile class.  You'll need to provide these two functions
// to create and delete your tiles:
//
// createTile(TileIdx ti, bounds) where bounds = {min:{x:,y:},max:{x:,y:}}
// tile.delete()
//
// layer = new TileView({panoWidth:, panoHeight:, tileWidth:, tileHeight:, createTile:});
//
// When drawing a frame where the view has changed
//
// layer.setView(view, viewportWidth, viewportHeight);
//
// Ordered list of tiles to draw.  (Ordered for the case where high-res tiles can partially cover low-res tiles)
//
// layer.getTilesToDraw();

function TileView(settings) {
  this._createTileCallback = settings.createTile;
  this._deleteTileCallback = settings.deleteTile;
  this._tiles = {};
  this._updateTileCallback = settings.updateTile;
  this._zoomlock = settings.zoomlock;
  this._cache = settings.cache || false;
  this._tilecache = {};
  this._readyList = [];

  console.log(this.toString());
}

TileView.prototype.toString = function() {
  var msg = 'TileView: ';
  return msg;
}

TileView.prototype._computeLevel = function(view) {
    var width = view.max - view.min;
    if (width <= 0)
        return Number.MIN_VALUE;

    return Math.floor(Math.log2(width / 512));
}

TileView.prototype._computeOffset = function(time,level) {
    var tileWidth = Math.pow(2, level) * 512;
    return Math.floor(time/tileWidth);
}

TileView.prototype._tileidxAt = function(level, offset) {
  return new TileIdx(level, offset);
};


TileView.prototype._computeVisibleTileRange = function(level, view) {
  var tilemin = this._tileidxAt(level, this._computeOffset(view.min,level));
  var tilemax = this._tileidxAt(level, this._computeOffset(view.max,level));
  return {min: tilemin, max: tilemax}
}

TileView.prototype._isTileVisible = function(tileidx, view) {
  var visibleRange = this._computeVisibleTileRange(tileidx.l,view);
  return visibleRange.min.o <= tileidx.o && tileidx.o <= visibleRange.max.o;
}

TileView.prototype._addTileidx = function(tileidx) {
  if (!this._tiles[tileidx.key]) {
    this._tiles[tileidx.key] =
      this._createTileCallback(tileidx);
    this._tiles[tileidx.key].index = tileidx;
  }
  return this._tiles[tileidx.key];
}

TileView.prototype._deleteTile = function(tile) {
  if (this._tiles[tile.index.key]) {
    tile.delete();
    delete this._tiles[tile.index.key];
  }
}

TileView.prototype._destroy = function() {
  var keys = Object.keys(this._tiles);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var tile = this._tiles[key];
    this._deleteTile(this._tiles[key]);
    delete this._tiles[key];
  }
}

TileView.prototype.tileInfo = function() {
  var ret = [];
  var tileidxs = Object.keys(this._tiles).sort();
  for (var i = 0; i < tileidxs.length; i++) {
    ret.push(tileidxs[i].toString());
  }
  return 'tileInfo: ' + ret.join(' ');
}

// Find first ancestor of tileidx that's ready, and mark it as required, for now
TileView.prototype._findReadyAncestor = function(tileidx) {
    var i = 0;
    while (i < 5) {
    tileidx = tileidx.parent();
    if (tileidx == null) {
      return null;
    }
    if (this._tiles[tileidx.key] && this._tiles[tileidx.key].isReady()) {
      return tileidx;
    }
    i+=1;
  }
}

// Find first ancestor in keys
TileView.prototype._findFirstAncestorIn = function(tileidx, map) {
  while (true) {
    tileidx = tileidx.parent();
    if (tileidx == null) {
      return null;
    }
    if (tileidx.key in map) {
      return tileidx;
    }
  }
}

// Record drawable videos
// +1,1,1 -2,2,2 +(3,3,3) ^4,4,4 lower higher
// Need prev drawable videos, all videos
// Need new drawable videos, all videos
// Video status:
//
// Added +(x)
// Not ready (x)
// Newly ready ^x
// Ready x
// Removed;  not ready -(x)  ready (x)

TileView.prototype.setView = function(view) {

  var required = {};
  var added = {};


  // Require tiles in view from optimal level of detail
  var level = this._computeLevel(view);
  var visibleRange = this._computeVisibleTileRange(level,view);

  for (var o = visibleRange.min.o; o <= visibleRange.max.o; o++) {
      var ti = new TileIdx(level, o);
      if (!(ti.key in this._tiles)) {
        this._tiles[ti.key] = this._addTileidx(ti);
        added[ti.key] =   true;
      }
      required[ti.key] = true;
      // If tile isn't ready, hold onto its first ready ancestor
      if (!this._tiles[ti.key].isReady()) {
          var ancestor = this._findReadyAncestor(ti);
          if (ancestor != null) {
              required[ancestor.key] = true;
          }
      }
  }

  // Hold onto higher-resolution tiles that are visible, and don't overlap ready tiles

  // Sort ready, higher-level tiles according to level
  var highLevelTileidxs = [];
  var currentLevel = level;
  for (var key in this._tiles) {
    var tileidx = this._tiles[key]._tileidx;
    if (tileidx.l < currentLevel) {
      if (this._isTileVisible(tileidx, view)) {
        if (this._tiles[tileidx.key].isReady()) {
          highLevelTileidxs.push(tileidx);
        }
      }
    }
  }
  highLevelTileidxs = highLevelTileidxs.sort();

  for (var i = 0; i < highLevelTileidxs.length; i++) {
    var tileidx = highLevelTileidxs[i];
    var ancestoridx = this._findFirstAncestorIn(tileidx, required);
    if (ancestoridx != null && !this._tiles[ancestoridx.key].isReady()) {
      required[tileidx.key] = true;
    }
  }

  // Compute status, and delete unnecessary tiles

  var keys = Object.keys(this._tiles).sort();

  var status = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var tile = this._tiles[key];
    if (!required[key]) {
      this._deleteTile(this._tiles[key]);
      delete this._tiles[key];
    } else {
      var stat = '';
      if (added[key]) stat += '+';
      if (!tile.isReady()) stat += '(';
      stat += tile.index.toString();
      if (!tile.isReady()) stat += ')';
      status.push(stat);
    }
  }
  status = status.join(' ');
  if (!this._lastStatus || status.replace(/[\-\+]/g,'') != this._lastStatus.replace(/[\-\+]/g,'')) {
    console.log('setView: ' + status);
    this._lastStatus = status;
  }
};


// Return ordered list of tiles to draw, from low-res to high res.  Draw in that order
// so that high-res can cover low-res, for opaque tiles.
TileView.prototype.update = function(transform) {
  var keys = Object.keys(this._tiles).sort();
  var tiles = [];
  for (var i = 0; i < keys.length; i++) {
    tiles.push(this._tiles[keys[i]]);
  }
  this._updateTileCallback(tiles, transform);
}
