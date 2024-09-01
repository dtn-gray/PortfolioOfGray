"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var THREE = _interopRequireWildcard(require("three"));
var _GLTFLoader = require("three/examples/jsm/loaders/GLTFLoader.js");
var _DRACOLoader = require("three/examples/jsm/loaders/DRACOLoader.js");
var _EffectComposer = require("three/addons/postprocessing/EffectComposer.js");
var _RenderPixelatedPass = require("three/addons/postprocessing/RenderPixelatedPass.js");
var _OutputPass = require("three/addons/postprocessing/OutputPass.js");
var _OrbitControls = require("three/addons/controls/OrbitControls.js");
var _gsap = _interopRequireDefault(require("gsap"));
var _core = require("@theatre/core");
var _ModelTheatreProjectState = _interopRequireDefault(require("/src/assets/Model.theatre-project-state.json"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // import studio from '@theatre/studio';
var ModelViewer = exports["default"] = /*#__PURE__*/function () {
  function ModelViewer(options) {
    _classCallCheck(this, ModelViewer);
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 3;
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
    this.camera.position.set(0, 0, 2);

    // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    // 		this.controls.minDistance = 2;
    // 		this.controls.maxDistance = 10;
    // 		this.controls.maxPolarAngle = Math.PI / 2;
    // 		this.controls.target.set( 0, 1, 0 );
    // 		this.controls.update();

    this.mouse = new THREE.Vector2();
    this.model = null;
    this.pivot = null;
    this.mixer = null;
    this.animationAction = null;
    this.animationDuration = 0;
    this.timeAccumulator = 0; // To store the time when spinning is toggled off
    this.isSpinning = false; // Initially, not spinning

    this.initLights();
    this.setupTheatreStudio();
    this.setupMouseMoveListener();
    this.setupPostProcessing(); // Setup post-processing
    this.render();
    this.setupResize();
  }
  return _createClass(ModelViewer, [{
    key: "initLights",
    value: function initLights() {
      var ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1);
      this.scene.add(ambient);
      var directionalLight1 = new THREE.DirectionalLight(0x260004, 300);
      directionalLight1.position.set(3, 9, 9);
      this.scene.add(directionalLight1);
      var directionalLight2 = new THREE.DirectionalLight(0x260004, 300);
      directionalLight2.position.set(-3, -9, 9);
      this.scene.add(directionalLight2);
      var textureLoader = new THREE.TextureLoader();
      var spotLightTexture = textureLoader.load('src/assets/img/3.jpg', function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      });
      var spotLightTexture2 = textureLoader.load('src/assets/img/texture2.jpg', function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      });

      // Add Spotlight
      this.spotLight1 = new THREE.SpotLight(0xff0000, 1000);
      this.spotLight1.position.set(5, 3, 3);
      this.spotLight1.angle = Math.PI / 10;
      this.spotLight1.penumbra = 1;
      this.spotLight1.decay = 0;
      this.spotLight1.distance = 10;
      this.spotLight1.map = spotLightTexture2;
      this.scene.add(this.spotLight1);

      // this.spotLightHelper = new THREE.SpotLightHelper(this.spotLight1);
      // this.scene.add(this.spotLightHelper);

      // Second Spotlight
      this.spotLight2 = new THREE.SpotLight(0xff0000, 1000);
      this.spotLight2.position.set(-5, 3, 3);
      this.spotLight2.angle = Math.PI / 10;
      this.spotLight2.penumbra = 1;
      this.spotLight2.decay = 0;
      this.spotLight2.distance = 10;
      this.spotLight2.map = spotLightTexture;
      this.scene.add(this.spotLight2);

      // this.spotLightHelper2 = new THREE.SpotLightHelper(this.spotLight2);
      // this.scene.add(this.spotLightHelper2);

      //Third Spotlight
      this.spotLight3 = new THREE.SpotLight(0xff0000, 100000);
      this.spotLight3.position.set(0, 3, 0.5);
      this.spotLight3.angle = Math.PI / 4;
      this.spotLight3.penumbra = 0;
      this.spotLight3.decay = 0;
      this.spotLight3.distance = 2;
      this.spotLight3Target = new THREE.Object3D();
      this.spotLight3Target.position.set(0, 1, 0.5); // Set the target position
      this.scene.add(this.spotLight3Target);
      this.spotLight3.target = this.spotLight3Target;
      this.scene.add(this.spotLight3);

      // this.spotLightHelper3 = new THREE.SpotLightHelper(this.spotLight3);
      // this.scene.add(this.spotLightHelper3);
    }
  }, {
    key: "initModel",
    value: function initModel(loadingManager) {
      var _this = this;
      var dracoLoader = new _DRACOLoader.DRACOLoader(loadingManager);
      dracoLoader.setDecoderPath('/draco/');
      var loader = new _GLTFLoader.GLTFLoader(loadingManager);
      loader.setDRACOLoader(dracoLoader);
      loader.load("VinylExplode.glb", function (gltf) {
        _this.pivot = new THREE.Object3D();
        _this.scene.add(_this.pivot);
        _this.model = gltf.scene;
        _this.model.traverse(function (child) {
          if (child.isMesh) {
            var geometry = child.geometry;
            geometry.computeVertexNormals();
          }
        });
        _this.model.visible = false;
        _this.model.position.set(0, -2.06, 0); // Adjust as needed to change pivot point
        _this.model.scale.set(1.5, 1.5, 1.5);
        _this.pivot.add(_this.model); // Add the model to the pivot

        _this.mixer = new THREE.AnimationMixer(_this.model);
        var clip = gltf.animations[0];
        _this.animationAction = _this.mixer.clipAction(clip);
        _this.animationAction.setLoop(THREE.LoopRepeat);
        _this.animationAction.play();
        _this.animationDuration = clip.duration;
        _this.setupTheatreStudioTimeline();
      }, undefined, function (error) {
        console.error('An error occurred while loading the model', error);
      });
    }
  }, {
    key: "setupTheatreStudio",
    value: function setupTheatreStudio() {
      // studio.initialize();

      this.theatreProject = (0, _core.getProject)('Model', {
        state: _ModelTheatreProjectState["default"]
      });
      this.theatreSheet = this.theatreProject.sheet('Animation Sheet');
    }
  }, {
    key: "setupTheatreStudioTimeline",
    value: function setupTheatreStudioTimeline() {
      var _this2 = this;
      if (!this.model || !this.mixer) return;
      var theatreObj = this.theatreSheet.object('Model Animation', {
        time: _core.types.number(0, {
          range: [0, 100]
        }),
        positionX: _core.types.number(this.pivot.position.x, {
          range: [-10, 10]
        }),
        positionY: _core.types.number(this.pivot.position.y, {
          range: [-10, 10]
        }),
        positionZ: _core.types.number(this.pivot.position.z, {
          range: [-10, 10]
        }),
        rotationX: _core.types.number(this.pivot.rotation.x, {
          range: [-Math.PI, Math.PI]
        }),
        rotationY: _core.types.number(this.pivot.rotation.y, {
          range: [-Math.PI, Math.PI]
        }),
        rotationZ: _core.types.number(this.pivot.rotation.z, {
          range: [-Math.PI, Math.PI]
        }),
        mouseSensitivity: _core.types.number(1, {
          range: [0, 2]
        }),
        mouseEnabled: _core.types["boolean"](true),
        isSpinning: _core.types["boolean"](false)
      });
      theatreObj.onValuesChange(function (_ref) {
        var time = _ref.time,
          positionX = _ref.positionX,
          positionY = _ref.positionY,
          positionZ = _ref.positionZ,
          rotationX = _ref.rotationX,
          rotationY = _ref.rotationY,
          rotationZ = _ref.rotationZ,
          mouseSensitivity = _ref.mouseSensitivity,
          mouseEnabled = _ref.mouseEnabled,
          isSpinning = _ref.isSpinning;
        var mappedTime = time / 100 * _this2.animationDuration;
        _this2.mixer.setTime(mappedTime);
        _this2.pivot.position.set(positionX, positionY, positionZ);
        _this2.pivot.rotation.set(rotationX, rotationY, rotationZ);
        _this2.mouseSensitivity = mouseSensitivity;
        _this2.mouseEnabled = mouseEnabled;
        if (_this2.isSpinning !== isSpinning) {
          _this2.isSpinning = isSpinning;
          if (!isSpinning) {
            // Save the accumulated time when spinning is turned off
            _this2.lastTime = null; // Clear lastTime to stop the accumulation
          }
        }
      });
    }
  }, {
    key: "setupMouseMoveListener",
    value: function setupMouseMoveListener() {
      var _this3 = this;
      window.addEventListener('mousemove', function (event) {
        if (!_this3.mouseEnabled) return;
        var mouseX = event.clientX / window.innerWidth * 2 - 1;
        var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        if (_this3.model) {
          _this3.model.rotation.y = mouseX * Math.PI * 0.1 * _this3.mouseSensitivity;
          _this3.model.rotation.x = mouseY * Math.PI * 0.01 * _this3.mouseSensitivity;
        }
      });
    }
  }, {
    key: "setupPostProcessing",
    value: function setupPostProcessing() {
      this.composer = new _EffectComposer.EffectComposer(this.renderer);
      var renderPixelatedPass = new _RenderPixelatedPass.RenderPixelatedPass(6, this.scene, this.camera);
      this.composer.addPass(renderPixelatedPass);
      renderPixelatedPass.normalEdgeStrength = 30; // Adjust as needed
      renderPixelatedPass.depthEdgeStrength = 1000; // Adjust as needed

      var outputPass = new _OutputPass.OutputPass();
      this.composer.addPass(outputPass);
      this.pixelatedPass = renderPixelatedPass; // Store reference for GUI control or later modification
    }
  }, {
    key: "render",
    value: function render() {
      requestAnimationFrame(this.render.bind(this));
      var currentTime = performance.now() / 1000;
      if (this.isSpinning) {
        this.timeAccumulator += currentTime - (this.lastTime || currentTime); // Accumulate time
        this.lastTime = currentTime;
        this.spotLight1.position.x = Math.cos(this.timeAccumulator) * 2.5;
        this.spotLight1.position.z = Math.sin(this.timeAccumulator) * 2.5;

        // this.spotLightHelper.update();
      } else {
        this.lastTime = currentTime; // Reset lastTime to avoid a jump in time when resuming
      }
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
      this.composer.setSize(this.width, this.height);
    }

    // New methods to control Theatre.js animation
  }, {
    key: "playModelAnimation",
    value: function playModelAnimation(callback) {
      var _this4 = this;
      this.theatreProject.ready.then(function () {
        _this4.model.visible = true;

        // Ensure the animation starts from the beginning
        _this4.theatreSheet.sequence.position = 0;

        // Play the sequence from start to finish (0 to 1) with only one iteration
        _this4.theatreSheet.sequence.play({
          iterationCount: 1,
          direction: 'normal',
          range: [0, 4.4],
          rate: 2
        }).then(function () {
          _this4.theatreSheet.sequence.position = 4.4;
          console.log("Model playModelAnimation complete");
          if (callback) callback();
        });
      });
    }
  }, {
    key: "reverseModelAnimation",
    value: function reverseModelAnimation(callback) {
      var _this5 = this;
      this.theatreProject.ready.then(function () {
        // Ensure the animation starts from the end
        _this5.theatreSheet.sequence.position = 4.4;

        // Play the sequence from finish to start (1 to 0) with only one iteration
        _this5.theatreSheet.sequence.play({
          iterationCount: 1,
          direction: 'reverse',
          rate: 2
        }).then(function () {
          console.log("Model reverseModelAnimation complete");
          if (callback) callback();
        });
      });
    }
  }, {
    key: "loadModelAnimation",
    value: function loadModelAnimation() {
      var _this6 = this;
      return new Promise(function (resolve) {
        _this6.theatreProject.ready.then(function () {
          if (!_this6.model) {
            console.error("Model not loaded. Cannot perform animation.");
            resolve();
            return;
          }

          // Set initial state
          _this6.model.position.y = -5; // Start the model below the view
          _this6.model.scale.set(0.1, 0.1, 0.1); // Initial small scale
          _this6.model.rotation.x = 0; // Initial rotation on the X-axis
          _this6.model.rotation.y = 0;
          _this6.model.visible = true;
          // Animate position, scale, and rotation
          _gsap["default"].timeline().to(_this6.model.position, {
            y: -2.06,
            // Move the model to its original position
            duration: 2,
            ease: "power2.out"
          }).to(_this6.model.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            // Scale the model up to 1.5 times its size
            duration: 2,
            ease: "power2.out"
          }, 0) // Start scaling at the same time as the position animation
          .to(_this6.model.rotation, {
            y: Math.PI * 4,
            // Rotate the model 360 degrees on the X-axis
            duration: 2,
            ease: "power2.out",
            onComplete: resolve // Resolve the promise when animation is complete
          }, 0); // Start rotation at the same time as the position animation
        });
      });
    }
  }]);
}();