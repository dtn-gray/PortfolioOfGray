import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { getProject, types } from '@theatre/core';
// import studio from '@theatre/studio';

import projectState from '/src/assets/Model.theatre-project-state.json';

export default class ModelViewer {
    constructor(options) {
        this.scene = new THREE.Scene();
        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        this.renderer.toneMapping = THREE.ReinhardToneMapping;
		this.renderer.toneMappingExposure = 3;

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
        this.camera.position.set(0, 0, 2);
        this.setCameraPosition();

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
        this.timeAccumulator = 0;
        this.isSpinning = false;

        this.initLights();
        this.setupTheatreStudio();
        this.setupMouseMoveListener();
        this.addMouseMoveListener();
        this.setupPostProcessing();
        this.render();
        this.setupResize();
    }

    initLights() {
        const ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1);
        this.scene.add(ambient);

        const directionalLight1 = new THREE.DirectionalLight(0xff0000, 300);
        directionalLight1.position.set(3, 9, 9);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xff0000, 300);
        directionalLight2.position.set(-3, -9, 9);
        this.scene.add(directionalLight2);

        const textureLoader = new THREE.TextureLoader();
        const spotLightTexture = textureLoader.load('src/assets/img/3.jpg', function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        });

        const spotLightTexture2 = textureLoader.load('src/assets/img/texture2.jpg', function (texture) {
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

    initModel(loadingManager) {
        const dracoLoader = new DRACOLoader(loadingManager);
        dracoLoader.setDecoderPath('/draco/');
    
        const loader = new GLTFLoader(loadingManager);
        loader.setDRACOLoader(dracoLoader);
    
        loader.load("VinylExplode.glb", (gltf) => {
            this.pivot = new THREE.Object3D();
            this.scene.add(this.pivot);
        
            this.model = gltf.scene;
        
            this.model.traverse((child) => {
                if (child.isMesh) {
                    const geometry = child.geometry;
                    geometry.computeVertexNormals();
                }
            });
        
            this.model.position.set(0, -2.06, 0);
            this.model.scale.set(1.5, 1.5, 1.5);
            this.model.visible = false;
        
            this.pivot.add(this.model);
        
            this.mixer = new THREE.AnimationMixer(this.model);
            const clip = gltf.animations[0];
            this.animationAction = this.mixer.clipAction(clip);
            this.animationAction.setLoop(THREE.LoopRepeat); 
            this.animationAction.play();
            this.animationDuration = clip.duration;
        
            this.setupTheatreStudioTimeline();

            this.loadNewModel(loadingManager);
    
        }, undefined, (error) => {
            console.error('An error occurred while loading the model', error);
        });
    }
    
    loadNewModel(loadingManager) {
        const loader = new GLTFLoader(loadingManager);
        const dracoLoader = new DRACOLoader(loadingManager);
        dracoLoader.setDecoderPath('/draco/');
        loader.setDRACOLoader(dracoLoader);

        console.log("Loading new model with this context:", this);
    
        loader.load("VinylExplode2.glb", (gltf) => {
            this.newModel = gltf.scene;
            this.newModel.position.copy(this.model.position);
            this.newModel.scale.copy(this.model.scale);
            this.newModel.visible = false; 
            this.pivot.add(this.newModel);
    
            this.addMouseMoveListener(this.newModel);

        }, undefined, (error) => {
            console.error('An error occurred while loading the new model', error);
        });
    }

    setupTheatreStudio() {
        // studio.initialize();
        
        this.theatreProject = getProject('Model', { state: projectState });
        this.theatreSheet = this.theatreProject.sheet('Animation Sheet');
    }

    setupTheatreStudioTimeline() {
        if (!this.model || !this.mixer) return;
    
        const theatreObj = this.theatreSheet.object('Model Animation', {
            time: types.number(0, { range: [0, 100] }),
            positionX: types.number(this.pivot.position.x, { range: [-10, 10] }),
            positionY: types.number(this.pivot.position.y, { range: [-10, 10] }),
            positionZ: types.number(this.pivot.position.z, { range: [-10, 10] }),
            rotationX: types.number(this.pivot.rotation.x, { range: [-Math.PI, Math.PI] }),
            rotationY: types.number(this.pivot.rotation.y, { range: [-Math.PI, Math.PI] }),
            rotationZ: types.number(this.pivot.rotation.z, { range: [-Math.PI, Math.PI] }),
            mouseSensitivity: types.number(1, { range: [0, 2] }),
            mouseEnabled: types.boolean(true),
            isSpinning: types.boolean(false),
        });
    
        theatreObj.onValuesChange(({ time, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, mouseSensitivity, mouseEnabled, isSpinning }) => {
            const mappedTime = (time / 100) * this.animationDuration;
            this.mixer.setTime(mappedTime);
    
            this.pivot.position.set(positionX, positionY, positionZ);
            this.pivot.rotation.set(rotationX, rotationY, rotationZ);
    
            this.mouseSensitivity = mouseSensitivity;
            this.mouseEnabled = mouseEnabled;
    
            if (this.isSpinning !== isSpinning) {
                this.isSpinning = isSpinning;

                if (!isSpinning) {
                    this.lastTime = null;
                }
            }
        });
    }

    addMouseMoveListener() {
        if (window.innerWidth < 1024) return;
        window.addEventListener('mousemove', (event) => {
            if (!this.mouseEnabled) return;

            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.newModel) {
                this.newModel.rotation.y = mouseX * Math.PI * 0.1 * this.mouseSensitivity;
                this.newModel.rotation.x = mouseY * Math.PI * 0.01 * this.mouseSensitivity;
            }
        });
    }

    setupMouseMoveListener() {
        if (window.innerWidth < 1024) return;
        window.addEventListener('mousemove', (event) => {
            if (!this.mouseEnabled) return;

            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.model) {
                this.model.rotation.y = mouseX * Math.PI * 0.1 * this.mouseSensitivity;
                this.model.rotation.x = mouseY * Math.PI * 0.01 * this.mouseSensitivity;
            }
        });
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPixelatedPass = new RenderPixelatedPass(3, this.scene, this.camera);
        this.composer.addPass(renderPixelatedPass);

        renderPixelatedPass.normalEdgeStrength = 300; 
        renderPixelatedPass.depthEdgeStrength = 1000;

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        this.pixelatedPass = renderPixelatedPass;
    }

    render() {
        requestAnimationFrame(this.render.bind(this));

        const currentTime = performance.now() / 1000;

        if (this.isSpinning) {
            this.timeAccumulator += currentTime - (this.lastTime || currentTime);
            this.lastTime = currentTime;

            this.spotLight1.position.x = Math.cos(this.timeAccumulator) * 2.5;
            this.spotLight1.position.z = Math.sin(this.timeAccumulator) * 2.5;

            // this.spotLightHelper.update();
        } else {
            this.lastTime = currentTime;
        }

        this.composer.render();
    }

    setCameraPosition() {
        const minZ = 2;
        const maxZ = 4;

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
        this.composer.setSize(this.width, this.height);

        this.setCameraPosition();
    }

    playModelAnimation(callback) {
        this.theatreProject.ready.then(() => {
            this.model.visible = true;
            this.newModel.visible = false;

            this.theatreSheet.sequence.position = 0;
    
            this.theatreSheet.sequence.play({
                iterationCount: 1,
                direction: 'normal',
                range: [0, 4.4],
                rate: 2
            }).then(() => {
                // this.theatreSheet.sequence.position = 4.4;
                console.log("Model playModelAnimation complete");
                if (callback) callback();
            });
        });
    }

    reverseModelAnimation(callback) {
        this.theatreProject.ready.then(() => {
            this.theatreSheet.sequence.position = 4.4;
    
            this.theatreSheet.sequence.play({
                iterationCount: 1,
                direction: 'reverse',
                rate: 2
            }).then(() => {
                console.log("Model reverseModelAnimation complete");
                this.model.visible = false;
                this.newModel.visible = true;
                if (callback) callback();
            });
        });
    }

    loadModelAnimation() {
        return new Promise((resolve) => {
            this.theatreProject.ready.then(() => {
                if (!this.newModel) {
                    console.error("Model not loaded. Cannot perform animation.");
                    resolve();
                    return;
                }

                

                this.newModel.position.y = -5; 
                this.newModel.scale.set(0.1, 0.1, 0.1); 
                this.newModel.rotation.x = 0; 
                this.newModel.rotation.y = 0;
                this.newModel.visible = true;
       
                gsap.timeline()
                    .to(this.newModel.position, {
                        y: -2.06, 
                        duration: 2,
                        ease: "power2.out"
                    })
                    .to(this.newModel.scale, {
                        x: 1.5,
                        y: 1.5,
                        z: 1.5, 
                        duration: 2,
                        ease: "power2.out"
                    }, 0) 
                    .to(this.newModel.rotation, {
                        y: Math.PI * 4,
                        duration: 2,
                        ease: "power2.out",
                        onComplete: resolve
                    }, 0);
            });
        });
    }
}
