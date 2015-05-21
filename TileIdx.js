//COPYPASTA
///////////////////////////
// Tile index
//

// A tile has a level, row, and column
// Level 0 has 1x1=1 tiles; level 1 has 2x2=4 tiles; level 2 has 4x4=16 tiles
//
// key is a string that encodes [level, row, column] with leading zeros to allow
// lexicographic sorting to match sorting by [level, row, column]

function TileIdx(l, o) {
  this.l = l;
  this.o = o;
  var level,offset;

  if (l < 0) {
      level = "-" + ('00' + (l).toString().split("-")[1]).substr(-3);
  } else {
      level = ('00' + l).substr(-3);
  }

  if (o < 0) {
      offset = "-" + ('00000000000000000000' + (o).toString().split("-")[1]).substr(-19);
  } else {
      offset = ('00000000000000000000' + o).substr(-19);
  }

  this.key = level + offset;
}

TileIdx.prototype.parent = function() {
    return new TileIdx(this.l + 1, this.o >> 1);
};

TileIdx.prototype.toString = function() {
  return this.l + '.' + this.o;
}
