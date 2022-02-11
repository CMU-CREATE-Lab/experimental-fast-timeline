'use strict';

/** @namespace */
var cr = cr || {};

/**
 * Creates a <code>DataStoreTile</code>.
 *
 * @class
 * @constructor
 * @private
 * @param glb
 * @param {cr.TileIdx} tileidx - the tile index
 * @param {datasourceFunction} datasource - function with signature <code>function(level, offset, successCallback)</code> resposible for returning tile JSON for the given <code>level</code> and <code>offset</code>
 */
cr.DataStoreTile = function(glb, tileidx, datasource) {
    this.glb = glb;
    this.gl = glb.gl;
    this._tileidx = tileidx;
    this._ready = false;
    this.program = glb.programFromSources(cr.Shaders.TileVertexShader, cr.Shaders.TileFragmentShader);
    this.pointProgram = glb.programFromSources(cr.Shaders.PointVertexShader, cr.Shaders.PointFragmentShader);
    this.offset = 0;
    this._resolutionScale = window.devicePixelRatio || 1;
    this.jsonUpdated = false;
    this.prevSample = [];

    var self = this;
    var tileLoader = new cr.TileLoader(datasource);

    tileLoader.load(tileidx, function(err, json) {
        if (err) {
            console.log(err);
        }
        else {
            self.json = json;
            self._ready = true;
            self.jsonUpdated = true;
        }
    });
};

cr.DataStoreTile.prototype._setData = function(arrayBuffer) {
    var gl = this.gl;
    this._pointCount = arrayBuffer.length / 4;

    this._data = arrayBuffer;
    this._arrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._arrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.STATIC_DRAW);

    var attributeLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 16, 0);
};

/**
 * Returns whether the tile is ready.
 *
 * @return {boolean}
 */
cr.DataStoreTile.prototype.isReady = function() {
    return this._ready;
};

cr.DataStoreTile.prototype.delete = function() {
    // TODO
    //console.log('delete: ' + this._tileidx.toString());
};

function arrayEquals(a,b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; a++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

cr.DataStoreTile.prototype.updateDataIfNeeded = function(prevSample) {
    if (this.jsonUpdated || !arrayEquals(this.prevSample, prevSample)) {
        var data = [];
        var offset = 0;

        if (this.json.data.length > 0) {
            // firstSample is the previous sample, if that exists
            var firstSample = prevSample.length ? prevSample : this.json.data[0];
            offset = firstSample[0]; // x from first sample
            if (prevSample) {
                data.push(prevSample[0] - offset); // x
                data.push(prevSample[1]); // y
                data.push(prevSample[2]); // std dev.  not drawn
                data.push(prevSample[3]); // weight.  not drawn
            }
            for (var i = 0; i < this.json.data.length; i++) {
                data.push(this.json.data[i][0] - offset); // x
                data.push(this.json.data[i][1]); // y
                data.push(this.json.data[i][2]); // std dev.  not drawn
                data.push(this.json.data[i][3]); // weight.  not drawn
            }
        }

        this.offset = offset;
        this._setData(new Float32Array(data));
        this.jsonUpdated = false;
        this.prevSample = prevSample;
    }
}

cr.DataStoreTile.prototype.draw = function(transform, options, prevSample) {
    var gl = this.gl;
    if (this._ready) {
        this.updateDataIfNeeded(prevSample);

        gl.useProgram(this.program);
        var pMatrix = new Float32Array([1, 0, 0, 0,
                                        0, 1, 0, 0,
                                        0, 0, 1, 0,
                                        0, 0, 0, 1]);

        var xscale = 2 / (transform.xmax - transform.xmin);
        var xtranslate = (-transform.xmin + this.offset) * xscale - 1;
        var yscale = 2 / (transform.ymax - transform.ymin);
        var ytranslate = -transform.ymin * yscale - 1;
        pMatrix[0] = xscale;
        pMatrix[12] = xtranslate;
        pMatrix[5] = yscale;
        pMatrix[13] = ytranslate;

        //// Draw lines ////

        var lineStyle = options.styles.lineStyle;

        if (lineStyle.show && this._pointCount > 0) {
          // Line thickness
          // Cannot be larger than 1px on Windows because of limitations of ANGLE webgl implementation
          // https://bugs.chromium.org/p/chromium/issues/detail?id=60124
          gl.lineWidth(lineStyle.lineWidth);

          var matrixLoc = gl.getUniformLocation(this.program, 'u_pMatrix');
          //    gl.uniformMatrix4fv(matrixLoc, false, transform);

          gl.uniformMatrix4fv(matrixLoc, false, pMatrix);
          gl.bindBuffer(gl.ARRAY_BUFFER, this._arrayBuffer);

          var attributeLoc = gl.getAttribLocation(this.program, 'a_position');
          gl.enableVertexAttribArray(attributeLoc);

          // Every vertex uses elements 0 and 1, but the spacing is 4 floats or 16 bytes (thus we're ignoring elements 2 and 3)
          gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 16, 0);

          var colorLoc = gl.getUniformLocation(this.program, 'u_color');
          // Line color
          gl.uniform4f(colorLoc, lineStyle.color.r / 255, lineStyle.color.g / 255, lineStyle.color.b / 255, 1);

          gl.drawArrays(gl.LINE_STRIP, 0, this._pointCount);
        }

        //// Draw points ////

        // TODO: Only circles currently supported, which is always the first point style
        var pointStyle = options.styles.pointStyles[0];

        if (pointStyle.show && this._pointCount > 0) {
          gl.useProgram(this.pointProgram);

          var matrixLoc = gl.getUniformLocation(this.pointProgram, 'u_pMatrix');
          //    gl.uniformMatrix4fv(matrixLoc, false, transform);
          gl.uniformMatrix4fv(matrixLoc, false, pMatrix);

          gl.bindBuffer(gl.ARRAY_BUFFER, this._arrayBuffer);

          var attributeLoc = gl.getAttribLocation(this.pointProgram, 'a_position');
          gl.enableVertexAttribArray(attributeLoc);
          gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 16, 0);

          var colorLoc = gl.getUniformLocation(this.pointProgram, 'u_color');
          gl.uniform4f(colorLoc, pointStyle.color.r / 255, pointStyle.color.g / 255, pointStyle.color.b / 255, 1);

          // Point size
          var sizeLoc = gl.getUniformLocation(this.pointProgram, 'u_size');
          gl.uniform1f(sizeLoc, pointStyle.radius * 2 * this._resolutionScale);

          gl.drawArrays(gl.POINTS, 0, this._pointCount);
        }
    }
};

/**
 * Update and draw tiles
 *
 * @param tiles
 * @param transform
 */
cr.DataStoreTile.update = function(tiles, transform, options) {
    var prevSample = [];
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.json && tile.json.data && tile.json.data.length) {
            var firstSample = tile.json.data[0];
            // Sometimes we move backwards in X, when we are drawing high-res tiles atop low-res
            // when a low-res tile is not yet fully replaced by two high-res tiles.  In this case,
            // throw out prevSample
            if (firstSample[0] < prevSample[0]) {
                prevSample = [];
            }
            tile.draw(transform, options, prevSample);
            // TODO: only set prevSample if this tile abuts the previous tile
            prevSample = tile.json.data[tile.json.data.length - 1];
        }
    }
};
