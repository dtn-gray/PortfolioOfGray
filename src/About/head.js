import * as THREE from "three";
import {REVISION} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { getProject, types } from '@theatre/core';
import fragment from "./fragment.glsl";
import vertex from "./vertex.glsl";
import GUI from 'lil-gui'; 
import gsap from "gsap";
import gltf from './head2.glb?url';

import projectState from '/src/assets/Head.theatre-project-state.json';

// import studio from "@theatre/studio";
// studio.initialize();


export default class Head {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0); 

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
    this.camera.position.set(20, 0, 20);
    this.setCameraPosition();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enableRotate = false;
    this.time = 0;

    this.sourceRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
    this.renderTarget1 = new THREE.WebGLRenderTarget(this.width, this.height)
    this.renderTarget2 = new THREE.WebGLRenderTarget(this.width, this.height)

    const loadingManager = options.loadingManager || new THREE.LoadingManager();

    const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`
    this.dracoLoader = new DRACOLoader(loadingManager).setDecoderPath( `${THREE_PATH}/examples/jsm/libs/draco/gltf/` );
    this.gltfLoader = new GLTFLoader(loadingManager);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.project = getProject("Head Project", 
      { state: projectState }
    );
    this.sheet = this.project.sheet("Head Animation");

    this.gltfLoader.load(gltf, (gltf) => {
      console.log(gltf)
     
      this.setupPostProcessing();
      this.addObjects(gltf.scene);
      this.setupTheatreControls();
      this.resize();
      this.render();
      this.setupResize();

      this.model = gltf.scene.getObjectByName("FBHead002");

  if (this.model && this.model.geometry) {
    this.model.geometry.scale(9, 9, 9);
    this.model.geometry = this.model.geometry.toNonIndexed();
    this.model.geometry.center();

    let pos = this.model.geometry.attributes.position.array;
    let centers = [];

    for (let i = 0; i < pos.length; i += 9) {
      let centerX = (pos[i] + pos[i + 3] + pos[i + 6]) / 3;
      let centerY = (pos[i + 1] + pos[i + 4] + pos[i + 7]) / 3;
      let centerZ = (pos[i + 2] + pos[i + 5] + pos[i + 8]) / 3;

      centers.push(centerX, centerY, centerZ);
      centers.push(centerX, centerY, centerZ);
      centers.push(centerX, centerY, centerZ);
    }

    this.model.geometry.setAttribute('center', new THREE.BufferAttribute(new Float32Array(centers), 3));

    this.scene.add(this.model);
    this.model.material = this.material;
  } else {
    console.error("Model or geometry not found.");
  }
});

    this.isPlaying = true;
  }

  setupTheatreControls() {
    const settingsObj = this.sheet.object("Settings", {
      progress: types.number(0, { range: [0, 1] }),
      triScale: types.number(1, { range: [0, 1] }),
      start: types.number(0, { range: [0, 1] }),
      translate: types.number(0, { range: [0, 1] }),
      mosaic: types.number(4, { range: [0, 15] }),
    }, { reconfigure: true });

    settingsObj.onValuesChange((values) => {
      this.material.uniforms.progress.value = values.progress;
      this.material.uniforms.triScale.value = values.triScale;
      this.material.uniforms.mosaic.value = values.mosaic;
      this.postQuad.material.uniforms.start.value = values.start;
      this.postQuad.material.uniforms.translate.value = values.translate;
    });
  }

  addClickEffect() {
    this.container.addEventListener("click", () => {
      if (this.isPlayingForward) {
        this.reverseClickAnimation();
      } else {
        this.playClickAnimation();
      }
      this.isPlayingForward = !this.isPlayingForward;
    });
  }

  setCameraPosition() {
    const minZ = 20;
    const maxZ = 40;

    const width = this.container.offsetWidth;
    const maxWidth = 1100;
    const minWidth = 320;
    const maxWidthLimit = 1400;

    if (width > maxWidthLimit) {
        this.camera.position.z = minZ;
    } else {
        this.camera.position.z = THREE.MathUtils.mapLinear(width, minWidth, maxWidth, maxZ, minZ);
    }
}

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.setCameraPosition();
  }

  setupPostProcessing(){
    this.orthoCamera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0, 1
    )
    this.orthoCamera.position.z = 1
    this.orthoScene = new THREE.Scene()

    this.postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          current: { value: null },
          prev: { value: null },
          start: { value: 0 },
          time: { value: 0},
          translate: { value: 0}
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        uniform sampler2D current;
        uniform sampler2D prev;
        uniform float start;
        uniform float time;
        uniform float translate;
        varying vec2 vUv;
        
        void main() {
        float PI = 3.14159265359;
          vec2 uv = vUv;
          uv -= vec2(0.5);
          uv*=vec2(2.,1.);
          uv.y += translate;
          uv /= 4.;
          
          uv.x += sin(uv.y * PI*4. + translate*0.3)*0.15;
          uv.x += sin(uv.y * PI*16.  +translate*0.5)*0.15;

          
          
          uv += vec2(0.5);


          uv = mix(vUv, uv, start);


          vec4 currentColor = texture2D(current, uv);
          vec4 prevColor = texture2D(prev, vUv);
          prevColor.rgb -= 0.004;
          vec4 color = vec4(mix(prevColor.rgb,currentColor.rgb,  0.03), 1.);
          gl_FragColor = color;

        }
        `
      })
    )
    this.orthoScene.add(this.postQuad)


    this.finalScene = new THREE.Scene()
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: null
      })
    )
    this.finalScene.add(this.finalQuad)
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        mosaic: { value: 4 },
        progress: { value: 0 },
        triScale: { value: 1 },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.plane);
  }

  addLights() {
    // const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    // this.scene.add(light1);

    // const light2 = new THREE.DirectionalLight(0xff0000, 5000);
    // light2.position.set(0.5, 0, 0.866);
    // this.scene.add(light2);

    // const light3 = new THREE.DirectionalLight(0xff0000, 5000);
    // light3.position.set(-10, 0, 4);
    // this.scene.add(light3);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.isPlaying = true;
      this.render()
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    if(this.model){
      this.model.rotation.x = 0.2 * Math.sin(this.time*0.1)
      this.model.rotation.y = 0.5 * Math.cos(this.time*0.1)
      this.postQuad.material.uniforms.time.value = this.time
    }
    this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.setRenderTarget(this.sourceRenderTarget)
    this.renderer.render(this.scene, this.camera)
    
    
    this.postQuad.material.uniforms.current.value = this.sourceRenderTarget.texture
    this.postQuad.material.uniforms.prev.value = this.renderTarget1.texture
    this.renderer.setRenderTarget(this.renderTarget2)
    this.renderer.render(this.orthoScene, this.orthoCamera)

    this.finalQuad.material.map = this.renderTarget1.texture
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.finalScene, this.orthoCamera)

    let temp = this.renderTarget1
    this.renderTarget1 = this.renderTarget2
    this.renderTarget2 = temp

  }

  playHeadAnimation(callback) {
    this.project.ready.then(() => {
      this.model.visible = true;

      this.sheet.sequence.position = 3.4;

      this.sheet.sequence.play({
        iterationCount: 1,
        direction: 'normal',
        range: [3.4, 4.4],
        rate: 1
      }).then(() => {
        console.log("Head playHeadAnimation complete");
        if (callback) callback();
      });
    });
  }

  reverseHeadAnimation(callback) {
    this.project.ready.then(() => {

      this.sheet.sequence.position = 4.4;

      this.sheet.sequence.play({
        iterationCount: 1,
        direction: 'reverse',
        rate: 1,
        range: [3.4, 4.4],
      }).then(() => {
        console.log("Head reverseHeadAnimation complete");
        if (callback) callback();
      });
    });
  }

  playClickAnimation() {
    this.project.ready.then(() => {
      this.sheet.sequence.position = 2;
      this.sheet.sequence.play({
        iterationCount: 1,
        direction: 'normal',
        range: [2, 3],
        rate: 1
      }).then(() => {
        console.log("Hover animation played to sequence 3");
      });
    });
  }

  reverseClickAnimation() {
    this.project.ready.then(() => {
      this.sheet.sequence.position = 3;
      this.sheet.sequence.play({
        iterationCount: 1,
        direction: 'reverse',
        range: [2, 3],
        rate: 1
      }).then(() => {
        console.log("Hover animation reversed to sequence 2");
      });
    });
  }

  loadHeadAnimation(callback) {
    this.project.ready.then(() => {
      this.model.visible = true;

      this.sheet.sequence.position = 0;

      this.sheet.sequence.play({
        iterationCount: 1,
        direction: 'normal',
        range: [0, 2],
        rate: 1
      }).then(() => {
        console.log("Head playHeadAnimation complete");
        if (callback) callback();
        this.addClickEffect();
        this.isPlayingForward = true;
      });
    });
  }
}