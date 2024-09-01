"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _three = _interopRequireWildcard(require("three"));
var THREE = _three;
var _OrbitControls = require("three/examples/jsm/controls/OrbitControls.js");
var _troikaThreeText = require("troika-three-text");
var _fragment = _interopRequireDefault(require("./shader/fragment.glsl"));
var _vertex = _interopRequireDefault(require("./shader/vertex.glsl"));
var _gsap = _interopRequireDefault(require("gsap"));
var _EffectComposer = require("three/examples/jsm/postprocessing/EffectComposer.js");
var _RenderPass = require("three/examples/jsm/postprocessing/RenderPass.js");
var _ShaderPass = require("three/examples/jsm/postprocessing/ShaderPass.js");
var _CustomPass = require("./CustomPass.js");
var _RGBShiftShader = require("three/examples/jsm/shaders/RGBShiftShader.js");
var _OutputPass = require("three/examples/jsm/postprocessing/OutputPass.js");
var _studio = _interopRequireDefault(require("@theatre/studio"));
var _core = require("@theatre/core");
var _HomebgTheatreProjectState = _interopRequireDefault(require("/src/assets/Homebg.theatre-project-state.json"));
var _BONNES = _interopRequireDefault(require("/src/assets/fonts/BONNES.ttf"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
_studio["default"].initialize();
var Sketch = exports["default"] = /*#__PURE__*/function () {
  function Sketch(options) {
    var _this = this;
    _classCallCheck(this, Sketch);
    _defineProperty(this, "initSheet", function () {
      // Initialize the "Distortion" object
      var distortion = _this.sheet.object("Distortion", {
        progress: _core.types.number(0.5, {
          range: [0, 1]
        }),
        // Set initial state to halfway through the animation
        bar: true,
        baz: "A string",
        textColor: _core.types.rgba({
          r: 245,
          g: 245,
          b: 245,
          a: 1
        })
      });

      // Handle changes to the "Distortion" object
      distortion.onValuesChange(function (newValues) {
        _this.customPass.uniforms['progress'].value = newValues.progress;

        // Link the progress value to other effects
        _this.rgbShiftPass.uniforms['amount'].value = THREE.MathUtils.lerp(0.0015, 0.013, newValues.progress);
        _this.camera.position.z = THREE.MathUtils.lerp(2, 0.5, newValues.progress);
        _this.textMesh.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, newValues.progress); // Adjust rotation interpolation

        var _newValues$textColor = newValues.textColor,
          r = _newValues$textColor.r,
          g = _newValues$textColor.g,
          b = _newValues$textColor.b,
          a = _newValues$textColor.a;
        _this.textMesh.material.color.setRGB(r, g, b);
        _this.textMesh.material.needsUpdate = true; // Ensure the material is updated
        _this.textMesh.sync();
      });
      _this.setupTheatreStudio();
      _this.loadAnimation();
    });
    // Initialize basic properties
    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xff0000, 0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera.position.set(0, 0, 2);
    this.controls = new _OrbitControls.OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    // Initialize Theatre.js project and delay the sheet setup
    this.proj = (0, _core.getProject)("Homebg", {
      state: _HomebgTheatreProjectState["default"]
    });

    // Use `then` to ensure that sheet is initialized after the project is ready
    this.proj.ready.then(function () {
      _this.sheet = _this.proj.sheet("Scene1");
      _this.initSheet(); // Initialize sheet-related objects or animations here
    });

    // Continue with other initializations
    this.initPost();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }
  return _createClass(Sketch, [{
    key: "initPost",
    value: function initPost() {
      this.composer = new _EffectComposer.EffectComposer(this.renderer);
      this.composer.addPass(new _RenderPass.RenderPass(this.scene, this.camera));
      this.rgbShiftPass = new _ShaderPass.ShaderPass(_RGBShiftShader.RGBShiftShader);
      this.rgbShiftPass.uniforms['amount'].value = 0.0015;
      this.composer.addPass(this.rgbShiftPass);
      this.customPass = new _ShaderPass.ShaderPass(_CustomPass.CustomPass);
      this.composer.addPass(this.customPass);
      this.outputPass = new _OutputPass.OutputPass();
      this.composer.addPass(this.outputPass);
    }
  }, {
    key: "addObjects",
    value: function addObjects() {
      this.textMesh = new _troikaThreeText.Text();
      this.textMesh.text = "Cogito, ergo sum\nI                 think\ntherefore   I   am";
      this.textMesh.fontSize = 0.3;
      this.textMesh.lineHeight = 1.;
      this.textMesh.font = _BONNES["default"];
      this.textMesh.position.set(0, 0, 0);
      this.textMesh.color = 0xf5f5f5;
      this.textMesh.anchorX = 'center';
      this.textMesh.anchorY = 'middle';
      this.textMesh.sync();
      this.textMesh.material.opacity = 0; // Set initial opacity to 0 for fade-in effect
      this.textMesh.material.transparent = true; // Enable transparency

      this.group.add(this.textMesh);
    }
  }, {
    key: "setupTheatreStudio",
    value: function setupTheatreStudio() {
      var _this2 = this;
      var groupObject = this.sheet.object('SketchPosition', {
        positionX: _core.types.number(this.group.position.x, {
          range: [-10, 10]
        }),
        positionY: _core.types.number(this.group.position.y, {
          range: [-10, 10]
        }),
        positionZ: _core.types.number(this.group.position.z, {
          range: [-10, 10]
        }),
        rotationX: _core.types.number(this.group.rotation.x, {
          range: [-Math.PI, Math.PI]
        }),
        rotationY: _core.types.number(this.group.rotation.y, {
          range: [-Math.PI, Math.PI]
        }),
        rotationZ: _core.types.number(this.group.rotation.z, {
          range: [-Math.PI, Math.PI]
        })
      });
      groupObject.onValuesChange(function (_ref) {
        var positionX = _ref.positionX,
          positionY = _ref.positionY,
          positionZ = _ref.positionZ,
          rotationX = _ref.rotationX,
          rotationY = _ref.rotationY,
          rotationZ = _ref.rotationZ;
        _this2.group.position.set(positionX, positionY, positionZ);
        _this2.group.rotation.set(rotationX, rotationY, rotationZ);
      });
    }
  }, {
    key: "render",
    value: function render() {
      this.time += 0.01;
      this.customPass.uniforms['time'].value = this.time;
      requestAnimationFrame(this.render.bind(this));
      this.composer.render();
    }
  }, {
    key: "setupResize",
    value: function setupResize() {
      window.addEventListener("resize", this.resize.bind(this));
    }
  }, {
    key: "resize",
    value: function resize() {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
  }, {
    key: "playAnimation",
    value: function playAnimation(callback) {
      var _this3 = this;
      this.proj.ready.then(function () {
        _this3.sheet.sequence.position = 0;
        _this3.sheet.sequence.play({
          iterationCount: 1,
          direction: 'normal',
          range: [0, 2],
          rate: 1 // Adjust rate if needed
        }).then(function () {
          if (callback) callback();
        });
      });
    }
  }, {
    key: "reverseAnimation",
    value: function reverseAnimation(callback) {
      var _this4 = this;
      this.proj.ready.then(function () {
        _this4.sheet.sequence.position = 2;
        _this4.sheet.sequence.play({
          iterationCount: 1,
          direction: 'reverse',
          rate: 1 // Adjust rate if needed
        }).then(function () {
          if (callback) callback();
        });
      });
    }
  }, {
    key: "loadAnimation",
    value: function loadAnimation() {
      var _this5 = this;
      return new Promise(function (resolve) {
        _this5.proj.ready.then(function () {
          _this5.sheet.sequence.position = 0.5;
          _this5.textMesh.visible = true;
          _this5.sheet.sequence.play({
            iterationCount: 1,
            direction: 'reverse',
            rate: 0.5
          }).then(function () {
            _gsap["default"].to(_this5.textMesh.material, {
              opacity: 1,
              duration: 3,
              onComplete: resolve // Resolve the promise when animation is complete
            });
          });
        });
      });
    }
  }]);
}();