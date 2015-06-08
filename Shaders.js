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


cr.Shaders.PointFragmentShader = "" +
"  precision highp float;\n" +
"  uniform vec4 u_color;\n" +
"  float dist = length(gl_PointCoord.xy - vec2(.5,.5));\n" +
"  float alpha = (dist > .5) ? .0 : 1.;\n" +
"  void main(void) {\n" +
"    gl_FragColor = u_color * alpha;\n" +
"  }";

cr.Shaders.PointVertexShader = "" +
"  attribute vec3 a_position;\n" +
"  uniform vec4 u_color;\n" +
"  uniform mat4 u_pMatrix;\n" +
"  void main(void) {\n" +
"    gl_Position = u_pMatrix * vec4(a_position, 1.0);\n" +
"    gl_PointSize = 4.;\n" +
"  }";
