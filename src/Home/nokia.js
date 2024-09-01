import * as THREE from "three";
import {REVISION} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import fragment from "./shader/fragment2.glsl";
import vertex from "./shader/vertex2.glsl";
import GUI from 'lil-gui'; 
import gsap from "gsap";
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

import projectState from '/src/assets/Nokia.theatre-project-state.json';

import { getProject, types } from "@theatre/core";
// import studio from "@theatre/studio";

// studio.initialize();

import tDiffuse from '/src/assets/img/phone-diffuse.png.ktx2?url'
import tPosition from '/src/assets/img/gameboy_position-high.png.ktx2?url'



export default class Nokia {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xfed703, 0); 

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      1000
    );

    // let frustumSize = 10;
    // let aspect = this.width / this.height;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 0.7);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.initPostProcessing();

    this.time = 0;

    const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`
    this.dracoLoader = new DRACOLoader( new THREE.LoadingManager() ).setDecoderPath( `${THREE_PATH}/examples/jsm/libs/draco/gltf/` );
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);


    this.basisloader = new KTX2Loader();

    this.basisloader.setTranscoderPath( `${THREE_PATH}/examples/jsm/libs/basis/` );
    this.basisloader.detectSupport( this.renderer );

    this.isPlaying = true;
    // this.setUpSettings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.addMouseEvents();
    this.setupTheatre();
    
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPixelatedPass = new RenderPixelatedPass(3, this.scene, this.camera);
    this.composer.addPass(renderPixelatedPass);

    renderPixelatedPass.normalEdgeStrength = 10;
    renderPixelatedPass.depthEdgeStrength = 10;

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    this.pixelatedPass = renderPixelatedPass;
  }


  addMouseEvents(){
    if (window.innerWidth < 1024) return;
    document.body.addEventListener('mousemove', (e)=>{
      this.material.uniforms.uMouse.value = e.clientX / window.innerWidth;
    })
  }

  // setUpSettings() {
  //   this.settings = {
  //     progress: 0,
  //     uDisplacementStrentgh: 0,
  //   };
  //   this.gui = new GUI();
  //   this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange((val)=>{
  //     this.material.uniforms.progress.value = val;
  //   })

  //   this.gui.add(this.settings, "uDisplacementStrentgh", 0., 0.01, 0.0001).onChange((val)=>{
  //     this.material.uniforms.uDisplacementStrentgh.value = val;
  //   })
  // }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    if (window.innerWidth < 900) {
      // this.plane.visible = false;
    } else {
      this.plane.visible = true;
    }
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        uDisplacementStrentgh: { value: 0 },
        time: { value: 0 },
        progress: { value: 0 },
        uMouse: { value: 0 },
        uDiffuse: { value: null },
        uPosition: { value: null },
        uMotion: { value: null },
        uData: { value: null },
        resolution: { value: new THREE.Vector4() },
        contrast: { value: 2.0 },
      },
      // wireframe: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);

    this.basisloader.load( tDiffuse,  ( texture )=> {
      this.material.uniforms.uDiffuse.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace
      texture.needsUpdate = true
    });

    // this.basisloader.load( tData,  ( texture )=> {
    //   this.material.uniforms.uData.value = texture;
    //   texture.colorSpace = THREE.LinearSRGBColorSpace
    //   texture.needsUpdate = true
    // });

    this.basisloader.load( tPosition,  ( texture )=> {
      this.material.uniforms.uPosition.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace
      texture.needsUpdate = true
    });

    // this.basisloader.load( tMV,  ( texture )=> {
    //   this.material.uniforms.uMotion.value = texture;
    //   texture.colorSpace = THREE.LinearSRGBColorSpace
    //   texture.needsUpdate = true
    // });
  }

  setupTheatre() {
    this.project = getProject("Nokia Animation Project", {state: projectState});
    this.sheet = this.project.sheet("Progress Animation");

    this.progressObj = this.sheet.object("Progress Control", {
      progress: types.number(0, { range: [0, 1] }),
    });

    this.progressObj.onValuesChange((values) => {
      this.material.uniforms.progress.value = values.progress;
    });
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.composer.render(this.scene, this.camera);
  }

  playNokiaAnimation(callback) {
    this.project.ready.then(() => {
        this.sheet.sequence.position = 0;

        this.sheet.sequence.play({
            iterationCount: 1,
            direction: 'normal',
            range: [0, 2],
            rate: 1
        }).then(() => {
            console.log("Nokia playNokiaAnimation complete");
            if (typeof callback === 'function') {
              callback();
            }
        });
    });
}

reverseNokiaAnimation(callback) {
    this.project.ready.then(() => {
        this.sheet.sequence.position = 2;

        this.sheet.sequence.play({
            iterationCount: 1,
            direction: 'reverse',
            rate: 1
        }).then(() => {
            console.log("Nokia reverseNokiaAnimation complete");
            if (typeof callback === 'function') {
              callback();
            }
        });
    });
}
}


