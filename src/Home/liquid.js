import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import fragment from "./shader/liquidfragment.glsl";
import fragment1 from "./shader/liquidfragment1.glsl";
import vertex from "./shader/liquidvertex.glsl";
import vertex1 from "./shader/liquidvertex1.glsl";
import gsap from "gsap";
import { getProject, types } from '@theatre/core';
// import studio from '@theatre/studio'; 

// studio.initialize(); 

import projectState from '/src/assets/Liquid.theatre-project-state.json';

import { DotScreenShader } from './CustomShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export default class LiquidSketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 1.3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addObjects();
    this.setupTheatre();
    this.initPost();
    this.resize();
    this.render();
    this.setupResize();
  }

  setupTheatre() {
    this.theatreProject = getProject('LiquidProject', { state: projectState });
    this.theatreSheet = this.theatreProject.sheet('LiquidSheet');

    if (!this.settings) {
        this.settings = this.theatreSheet.object('Liquid Settings', {
            progress: types.number(0, { range: [0, 1] }),
            mRefractionRatio: types.number(1.02, { range: [0, 3] }),
            mFresnelBias: types.number(0.1, { range: [0, 3] }),
            mFresnelScale: types.number(4.0, { range: [0, 3] }),
            mFresnelPower: types.number(2.0, { range: [0, 3] }),
            positionX: types.number(this.smallSphere.position.x, { range: [-5, 5] }),
            positionY: types.number(this.smallSphere.position.y, { range: [-5, 5] }),
            positionZ: types.number(this.smallSphere.position.z, { range: [-5, 5] }),
            spinningRadius: types.number(1.99, { range: [0, 20] }),
        });
    } else {
        this.settings.reconfigure({
            progress: types.number(0, { range: [0, 1] }),
            mRefractionRatio: types.number(1.02, { range: [0, 3] }),
            mFresnelBias: types.number(0.1, { range: [0, 3] }),
            mFresnelScale: types.number(4.0, { range: [0, 3] }),
            mFresnelPower: types.number(2.0, { range: [0, 3] }),
            positionX: types.number(this.smallSphere.position.x, { range: [-5, 5] }),
            positionY: types.number(this.smallSphere.position.y, { range: [-5, 5] }),
            positionZ: types.number(this.smallSphere.position.z, { range: [-5, 5] }),
            spinningRadius: types.number(1.99, { range: [0, 20] }),
        }, { reconfigure: true });
    }

    this.settings.onValuesChange((values) => {
        if (this.mat) {
            this.mat.uniforms.mRefractionRatio.value = values.mRefractionRatio;
            this.mat.uniforms.mFresnelBias.value = values.mFresnelBias;
            this.mat.uniforms.mFresnelScale.value = values.mFresnelScale;
            this.mat.uniforms.mFresnelPower.value = values.mFresnelPower;
        }
        this.smallSphere.position.set(values.positionX, values.positionY, values.positionZ);

        this.spinningRadius = values.spinningRadius;
    });
}



  initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const effect1 = new ShaderPass(DotScreenShader);
    effect1.uniforms['scale'].value = 4;
    this.composer.addPass(effect1);
  }

  addObjects() {
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
      encoding: THREE.sRGBEncoding
    });

    this.cubeCamera = new THREE.CubeCamera(0.1, 10, this.cubeRenderTarget);

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.SphereGeometry(2, 32, 32);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);

    let geo = new THREE.SphereGeometry(0.3, 32, 32);
    this.mat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        tCube: { value: 0 },
        mRefractionRatio: { value: 1.02 },
        mFresnelBias: { value: 0.1 },
        mFresnelScale: { value: 4.0 },
        mFresnelPower: { value: 2.0 },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader: vertex1,
      fragmentShader: fragment1
    });

    this.smallSphere = new THREE.Mesh(geo, this.mat);
    // this.scene.add(this.smallSphere);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.01;

    const radius = this.spinningRadius || 1.99;
    const cameraSpeed = 0.5;
    this.camera.position.x = radius * Math.cos(this.time * cameraSpeed);
    this.camera.position.z = radius * Math.sin(this.time * cameraSpeed);
    this.camera.lookAt(this.plane.position);

    this.smallSphere.visible = false;
    this.cubeCamera.update(this.renderer, this.scene);
    this.smallSphere.visible = true;
    this.mat.uniforms.tCube.value = this.cubeRenderTarget.texture;
    this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.composer.render(this.scene, this.camera);
  }

  playLiquidAnimation(callback) {
    this.theatreProject.ready.then(() => {
        this.theatreSheet.sequence.position = 0;

        this.theatreSheet.sequence.play({
            iterationCount: 1,
            direction: 'normal',
            range: [0, 4.4],
            rate: 2
        }).then(() => {
            console.log("Liquid playLiquidAnimation complete");
            if (callback) callback();
        });
    });
  }

reverseLiquidAnimation(callback) {
    this.theatreProject.ready.then(() => {
        this.theatreSheet.sequence.position = 4.4;

        this.theatreSheet.sequence.play({
            iterationCount: 1,
            direction: 'reverse',
            rate: 4
        }).then(() => {
            console.log("Liquid reverseLiquidAnimation complete");
            if (callback) callback();
        });
    });
  }
}

