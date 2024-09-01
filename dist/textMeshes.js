"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var THREE = _interopRequireWildcard(require("three"));
var _troikaThreeText = require("troika-three-text");
var _BONNES = _interopRequireDefault(require("/src/assets/fonts/BONNES.ttf"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var TextMeshes = /*#__PURE__*/function () {
  function TextMeshes(options) {
    _classCallCheck(this, TextMeshes);
    this.container = options.dom;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.createCurtain();
    this.textMesh1 = this.createTextMesh("ABOUT", 2.7, {
      x: -2,
      y: 1.5,
      z: 0
    });
    this.textMesh2 = this.createTextMesh("PROJECTS", 2.7, {
      x: 1,
      y: -1.5,
      z: 0
    });
    this.scene.add(this.textMesh1);
    this.scene.add(this.textMesh2);
    this.scrollY = 0;
    window.addEventListener('scroll', this.onScroll.bind(this));
    this.animate();
  }
  return _createClass(TextMeshes, [{
    key: "createCurtain",
    value: function createCurtain() {
      var geometry = new THREE.PlaneGeometry(10, 10);
      var material = new THREE.MeshBasicMaterial({
        color: 0x000000
      });
      var curtain = new THREE.Mesh(geometry, material);
      curtain.position.set(0, 0, -1);
      this.scene.add(curtain);
    }
  }, {
    key: "createTextMesh",
    value: function createTextMesh(text, fontSize, position) {
      var pixelationShader = {
        uniforms: {
          uTime: {
            value: 0
          },
          uScroll: {
            value: 0
          },
          uResolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
          },
          uAspectRatio: {
            value: window.innerWidth / window.innerHeight
          }
        },
        vertexShader: "\n                varying vec2 vUv;\n                void main() {\n                    vUv = uv;\n                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n                }\n            ",
        fragmentShader: "\n                uniform float uTime;\n                uniform float uScroll;\n                uniform vec2 uResolution;\n                uniform float uAspectRatio;\n                varying vec2 vUv;\n\n                void main() {\n                    vec2 gridSize = vec2(20.0, 20.0 / uAspectRatio);\n                    vec2 pixelatedUV = floor(vUv * gridSize) / gridSize;\n\n                    // Corrected to achieve grayscale pixels\n                    vec3 color = vec3(0.5 + 0.5 * sin(uTime + pixelatedUV.x * 10.0));\n\n                    gl_FragColor = vec4(color, 1.0);\n                }\n            "
      };
      var material = new THREE.ShaderMaterial(pixelationShader);
      var textMesh = new _troikaThreeText.Text();
      textMesh.text = text;
      textMesh.fontSize = fontSize;
      textMesh.font = _BONNES["default"];
      textMesh.position.set(position.x, position.y, position.z);
      textMesh.color = 0xf5f5f5;
      textMesh.anchorX = 'center';
      textMesh.anchorY = 'middle';
      textMesh.material = material;
      textMesh.sync();
      return textMesh;
    }
  }, {
    key: "onScroll",
    value: function onScroll() {
      this.scrollY = window.scrollY;
      var scrollFactor = this.scrollY / document.body.scrollHeight;
      this.textMesh1.material.uniforms.uScroll.value = scrollFactor;
      this.textMesh2.material.uniforms.uScroll.value = scrollFactor;
    }
  }, {
    key: "animate",
    value: function animate() {
      requestAnimationFrame(this.animate.bind(this));
      this.textMesh1.material.uniforms.uTime.value += 0.05;
      this.textMesh2.material.uniforms.uTime.value += 0.05;
      this.renderer.render(this.scene, this.camera);
    }
  }]);
}();
var _default = exports["default"] = TextMeshes;