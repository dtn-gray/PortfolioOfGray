"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CustomPass = void 0;
var _three = require("three");
var CustomPass = exports.CustomPass = {
  uniforms: {
    'tDiffuse': {
      value: null
    },
    'time': {
      value: 0
    },
    'scale': {
      value: 1
    },
    'progress': {
      value: 0
    },
    'tSize': {
      value: new _three.Vector2(256, 256)
    },
    'center': {
      value: new _three.Vector2(0.5, 0.5)
    },
    'angle': {
      value: 1.57
    }
  },
  vertexShader: /* glsl */"\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvUv = uv;\n\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}",
  fragmentShader: /* glsl */"\n\n\t\tuniform vec2 center;\n\t\tuniform float angle;\n        uniform float time;\n        uniform float scale;\n        uniform float progress;\n\t\tuniform vec2 tSize;\n\n\t\tuniform sampler2D tDiffuse;\n\n\t\tvarying vec2 vUv;\n\n\t\tfloat pattern() {\n\n\t\t\tfloat s = sin( angle ), c = cos( angle );\n\n\t\t\tvec2 tex = vUv * tSize - center;\n\t\t\tvec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;\n\n\t\t\treturn ( sin( point.x ) * sin( point.y ) ) * 4.0;\n\n\t\t}\n\n\t\tvoid main() {\n            vec2 newUV = vUv;\n\n            // newUV = vUv + 0.1*vec2(sin(10.*vUv.x), sin(10.*vUv.y));\n\n\n            \n\n\n            vec2 p = 2.*vUv - vec2(1.);\n\n\n            p += 0.1*cos(scale*3.*p.yx + time + vec2(1.2,3.4));\n            p += 0.1*cos(scale*3.7*p.yx + 1.4*time + vec2(2.2,3.4));\n            p += 0.1*cos(scale*5.*p.yx + 2.6*time + vec2(4.2,1.4));\n            p += 0.3*cos(scale*7.*p.yx + 3.6*time + vec2(15.2,3.4));\n\n\n\n            // newUV = vUv + centeredUV*vec2(1.,0.);\n\n            // newUV.y = 0.;\n            // newUV.x = length(centeredUV);\n\n            newUV.x = mix(vUv.x,length(p), progress);\n            newUV.y = mix(vUv.y,0.5, progress);\n\n            vec4 color = texture2D( tDiffuse, newUV );\n\n            gl_FragColor = color;\n            // gl_FragColor = vec4(length(p),0.,0.,1.);\n\n\t\t}"
};