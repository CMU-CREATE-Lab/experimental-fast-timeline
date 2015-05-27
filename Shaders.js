"use strict";
var cr = cr || {};

cr.Shaders = cr.Shaders || {};

cr.Shaders.TileFragmentShader = "" +
"  precision highp float;\n" +
"  uniform vec4 u_color;\n" +
"  void main(void) {\n" +
"    gl_FragColor = u_color;\n" +
"  }";

cr.Shaders.TileVertexShader = "" +
"  attribute vec3 a_position;\n" +
"  uniform vec4 u_color;\n" +
"  uniform mat4 u_pMatrix;\n" +
"  void main(void) {\n" +
"    gl_Position = u_pMatrix * vec4(a_position, 1.0);\n" +
"  }";
