"use strict";

//
// Want to quadruple-buffer
// From time 1 to 1.999, display 1
//                       already have 2 in the hopper, nominally
//                       be capturing 3
//                       have a fourth fallow buffer to let pipelined chrome keep drawing

// Be capturing 3 means that at t=1, the first video just crossed 3.1,
//                   and that at t=1.999, the last video just crossed 3.1
// So we're aiming to run the videos at current display time plus 1.1 to 2.1
// Or maybe compress the range and go with say 1.6 to 2.1?  That lets us better use
// the flexibility of being able to capture the video across a range of times

function DataStoreTile(glb, tileidx, url) {
  this.glb = glb;
  this.gl = glb.gl;
  this._tileidx = tileidx;
  this._url = url;
  this._ready = false;
  this.program = glb.programFromSources(cr.Shaders.TileVertexShader, cr.Shaders.TileFragmentShader);
  this._load();

}

DataStoreTile.prototype._load = function() {
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

DataStoreTile.prototype._parseJSON = function(json) {
    var data = [];
    for (var i = 0; i < json.data.data.length; i++) {
        for (var j = 0; j < json.data.data[i].length; j++) {
            data.push(json.data.data[i][j]);

        }
    }
    return new Float32Array(data);
}
DataStoreTile.prototype._setData = function(arrayBuffer) {
  var gl = this.gl;
  this._pointCount = arrayBuffer.length / 4;

  this._data = arrayBuffer;
  this._arrayBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._arrayBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.STATIC_DRAW);

  var attributeLoc = gl.getAttribLocation(this.program, 'a_position');
  gl.enableVertexAttribArray(attributeLoc);
  gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 16, 0);

  this._ready = true;
}


DataStoreTile.prototype.
isReady = function() {
  return this._ready;
}

DataStoreTile.prototype.
delete = function() {
  console.log('delete: ' + this._tileidx.toString());
}

DataStoreTile.prototype.
draw = function(transform) {
  var gl = this.gl;
  if (this._ready) {
    gl.lineWidth(1);
    gl.useProgram(this.program);

    var matrixLoc = gl.getUniformLocation(this.program, 'u_pMatrix');
    gl.uniformMatrix4fv(matrixLoc, false, transform);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._arrayBuffer);

    var attributeLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 16, 0);

    var colorLoc = gl.getUniformLocation(this.program, 'u_color');
    gl.uniform4f(colorLoc, 0, 0, 0, 1);

    gl.drawArrays(gl.LINE_STRIP, 0, this._pointCount);
  }
}

// Update and draw tiles
DataStoreTile.update = function(tiles, transform) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i].draw(transform);
  }
}
