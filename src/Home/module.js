import * as THREE from "three";
import { REVISION } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Text } from 'troika-three-text';
import fragmentShader from "./shader/fragment.glsl";
import vertexShader from "./shader/vertex.glsl";
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomPass } from './CustomPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// import studio from "@theatre/studio";    
// studio.initialize(); 

import { getProject, types as t } from "@theatre/core";
import projectState from '/src/assets/Homebg.theatre-project-state.json';

import BONNES from '/src/assets/fonts/BONNES.ttf';

export default class Sketch {
    constructor(options) {
        // Initialize basic properties
        this.scene = new THREE.Scene();
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0xff0000, 0);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
        // this.camera.position.set(0, 0, 2);
        this.setCameraPosition();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.time = 0;

        this.proj = getProject("Homebg", { state: projectState });

        this.proj.ready.then(() => {
            this.sheet = this.proj.sheet("Scene1");
            this.initSheet();
        });

        this.initPost();
        this.addObjects();
        window.onload = () => {
            this.resize();
        };
        this.render();
        this.setupResize();
    }

    initSheet = () => {
        const distortion = this.sheet.object("Distortion", {
            progress: t.number(0.5, { range: [0, 1] }),
            bar: true,
            baz: "A string",
            textColor: t.rgba({ r: 245, g: 245, b: 245, a: 1 })
        });

        distortion.onValuesChange(newValues => {
            this.customPass.uniforms['progress'].value = newValues.progress;

            this.rgbShiftPass.uniforms['amount'].value = THREE.MathUtils.lerp(0.0015, 0.013, newValues.progress);
            // this.camera.position.z = THREE.MathUtils.lerp(2, 0.5, newValues.progress);
            this.textMesh.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, newValues.progress);
        
            const { r, g, b, a } = newValues.textColor;
            this.textMesh.material.color.setRGB(r, g, b);
            this.textMesh.material.needsUpdate = true;
            this.textMesh.sync();
        });

        this.setupTheatreStudio();
        this.loadAnimation();
    };

    initPost() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.rgbShiftPass = new ShaderPass(RGBShiftShader);
        this.rgbShiftPass.uniforms['amount'].value = 0.0015;
        this.composer.addPass(this.rgbShiftPass);

        this.customPass = new ShaderPass(CustomPass);
        this.composer.addPass(this.customPass);

        this.outputPass = new OutputPass();
        this.composer.addPass(this.outputPass);
    }

    addObjects() {
        this.textMesh = new Text();
        this.textMesh.text = `Cogito, ergo sum\nI                 think\ntherefore   I   am`;
        this.textMesh.fontSize = 0.3;
        this.textMesh.lineHeight = 1.;
        this.textMesh.font = BONNES;
        this.textMesh.position.set(0, 0, 0);
        this.textMesh.color = 0xf5f5f5;
        this.textMesh.anchorX = 'center';
        this.textMesh.anchorY = 'middle';
        this.textMesh.sync();

        this.textMesh.material.opacity = 0;
        this.textMesh.material.transparent = true;

        this.group.add(this.textMesh);
    }

    setupTheatreStudio() {
        const groupObject = this.sheet.object('SketchPosition', {
            positionX: t.number(this.group.position.x, { range: [-10, 10] }),
            positionY: t.number(this.group.position.y, { range: [-10, 10] }),
            positionZ: t.number(this.group.position.z, { range: [-10, 10] }),
            rotationX: t.number(this.group.rotation.x, { range: [-Math.PI, Math.PI] }),
            rotationY: t.number(this.group.rotation.y, { range: [-Math.PI, Math.PI] }),
            rotationZ: t.number(this.group.rotation.z, { range: [-Math.PI, Math.PI] })
        });

        groupObject.onValuesChange(({ positionX, positionY, positionZ, rotationX, rotationY, rotationZ }) => {
            this.group.position.set(positionX, positionY, positionZ);
            this.group.rotation.set(rotationX, rotationY, rotationZ);
        });
    }

    setCameraPosition() {
        const minZ = 2;
        const maxZ = 6; 

        const width = this.container.offsetWidth;
        const maxWidth = 1100;
        const minWidth = 320;
        const maxWidthLimit = 1400;

        if (width > maxWidthLimit) {
            this.camera.position.z = minZ;
        } else {
            this.camera.position.z = THREE.MathUtils.mapLinear(width, minWidth, maxWidth, maxZ, minZ);
        }
    
        this.camera.updateProjectionMatrix();
    }

    render() {
        this.time += 0.01;
        this.customPass.uniforms['time'].value = this.time;

        requestAnimationFrame(this.render.bind(this));
        this.composer.render();
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

    playAnimation(callback) {
        this.proj.ready.then(() => {
            this.sheet.sequence.position = 0;
            this.sheet.sequence.play({
                iterationCount: 1,
                direction: 'normal',
                range: [0, 2],
                rate: 1
            }).then(() => {
                if (callback) callback();
            });
        });
    }

    reverseAnimation(callback) {
        this.proj.ready.then(() => {
            this.sheet.sequence.position = 2;
            this.sheet.sequence.play({
                iterationCount: 1,
                direction: 'reverse',
                rate: 1
            }).then(() => {
                if (callback) callback();
            });
        });
    }

    loadAnimation() {
        return new Promise((resolve) => {
            this.proj.ready.then(() => {
                this.sheet.sequence.position = 0.5;
                this.textMesh.visible = true;
                this.sheet.sequence.play({ iterationCount: 1, direction: 'reverse', rate: 0.5 }).then(() => {
                    gsap.to(this.textMesh.material, {
                        opacity: 1,
                        duration: 3,
                        onComplete: resolve
                    });
                });
            });
        });
    }
}