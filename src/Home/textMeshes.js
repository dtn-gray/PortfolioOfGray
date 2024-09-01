// Updated textMeshes.js
import { gsap } from "gsap";
import * as THREE from "three";
import { getProject, types } from "@theatre/core";
// import studio from "@theatre/studio";
import { vertexShader, fragmentShader } from "./textMeshesShader";
import projectStateDesktop from '/src/assets/TextMeshes.theatre-project-state.json';
import projectStateMobile from '/src/assets/TextMeshesMobile.theatre-project-state.json';

// studio.initialize();

export default class TextMeshes {
    constructor(options) {
        this.scene = new THREE.Scene();
        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        // this.camera.position.z = 5;
        this.setCameraPosition();

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.time = 0;
        this.textMeshesVisible = false;
        this.mouseEnabled = false;  // Initially, disable mouse interaction
        this.mouseSensitivity = 0.15;  // Increase the sensitivity of the rotation
        this.maxRotationAngle = Math.PI / 2;  // Increase the maximum rotation angle, e.g., ±45 degrees
        this.rotationLerpSpeed = 0.1;  // Speed of lerping for smooth rotation

        // Define initial positions and rotations
        this.plane1Position = { x: -9.75, y: 4.3, z: -16 };
        this.plane1Rotation = { x: 0.05, y: 1.1, z: 0 };
        this.plane2Position = { x: 9.75, y: 4.3, z: -16 };
        this.plane2Rotation = { x: 0.05, y: -1.1, z: 0 };

        this.defaultPlane1Position = { ...this.plane1Position };
        this.defaultPlane2Position = { ...this.plane2Position };
        this.defaultPlane1Rotation = { ...this.plane1Rotation };
        this.defaultPlane2Rotation = { ...this.plane2Rotation };

        this.finalPlane1Position = { ...this.plane1Position };
        this.finalPlane2Position = { ...this.plane2Position };

        this.plane1Progress = 0;
        this.plane2Progress = 0;

        // Current default rotations (after animation ends)
        this.defaultPlane1Rotation = { ...this.plane1Rotation };
        this.defaultPlane2Rotation = { ...this.plane2Rotation };

        this.projectStateEnabled = this.width >  1024 ? projectStateDesktop : projectStateMobile;
        // Create Theatre.js project and sheets
        this.project = getProject("TextMeshes Project", {state: this.projectStateEnabled});
        this.sheet1 = this.project.sheet("Plane 1 Sheet");
        this.sheet2 = this.project.sheet("Plane 2 Sheet");

        this.addPlanes();
        this.setupTheatreControls();
        this.setupMouseMoveListener();
        this.setupClickListener();
        this.setupHoverEffect();
        this.render();
        this.setupResize();
    }

    initLoadingManager() {
        const loadingManager = new THREE.LoadingManager();

        loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };

        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };

        loadingManager.onLoad = () => {
            console.log('All items loaded.');
            const loadingScreen = document.getElementById('loading-screen');
            gsap.to(loadingScreen, { opacity: 0, duration: 1, onComplete: () => {
                loadingScreen.style.display = 'none';
            }});
        };

        loadingManager.onError = (url) => {
            console.error(`There was an error loading ${url}`);
        };

        return loadingManager;
    }

    addPlanes() {
        const textureLoader = new THREE.TextureLoader();

        // Load the first image (ABOUT) and apply shader with right-to-left sliding
        textureLoader.load(
            '../src/assets/img/ABOUT.png',
            (texture1) => {
                if (texture1.image.width > 0 && texture1.image.height > 0) {
                    const material1 = new THREE.ShaderMaterial({
                        uniforms: {
                            uTime: { value: 0 },
                            uFillColor: { value: new THREE.Color("#f60") },
                            uProgress: { value: this.plane1Progress },
                            uTexture: { value: texture1 },
                            uDirection: { value: -1.0 }
                        },
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,
                        transparent: true,
                    });

                    const geometry1 = new THREE.PlaneGeometry(texture1.image.width / 100, texture1.image.height / 100);
                    this.plane1 = new THREE.Mesh(geometry1, material1);
                    this.plane1.position.set(this.plane1Position.x, this.plane1Position.y, this.plane1Position.z);
                    this.plane1.rotation.set(this.plane1Rotation.x, this.plane1Rotation.y, this.plane1Rotation.z);
                    this.scene.add(this.plane1);

                    this.setupTheatreForPlane(this.sheet1, this.plane1, 'uProgress');
                } else {
                    console.error('Texture loading failed or texture has invalid dimensions.');
                }
            },
            undefined,
            (err) => {
                console.error('An error occurred while loading texture: ', err);
            }
        );

        // Load the second image (PROJECTS) and apply shader with left-to-right sliding
        textureLoader.load(
            '../src/assets/img/WORKS.png',
            (texture2) => {
                if (texture2.image.width > 0 && texture2.image.height > 0) {
                    const material2 = new THREE.ShaderMaterial({
                        uniforms: {
                            uTime: { value: 0 },
                            uFillColor: { value: new THREE.Color("#f60") },
                            uProgress: { value: this.plane2Progress },
                            uTexture: { value: texture2 },
                            uDirection: { value: 1.0 }
                        },
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,
                        transparent: true,
                    });

                    const geometry2 = new THREE.PlaneGeometry(texture2.image.width / 100, texture2.image.height / 100);
                    this.plane2 = new THREE.Mesh(geometry2, material2);
                    this.plane2.position.set(this.plane2Position.x, this.plane2Position.y, this.plane2Position.z);
                    this.plane2.rotation.set(this.plane2Rotation.x, this.plane2Rotation.y, this.plane2Rotation.z);
                    this.scene.add(this.plane2);

                    this.setupTheatreForPlane(this.sheet2, this.plane2, 'uProgress');
                } else {
                    console.error('Texture loading failed or texture has invalid dimensions.');
                }
            },
            undefined,
            (err) => {
                console.error('An error occurred while loading texture: ', err);
            }
        );
    }

    setupClickListener() {
        window.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObjects([this.plane1, this.plane2]);

            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                if (intersectedObject === this.plane1) {
                    window.location.href = 'about.html';
                } else if (intersectedObject === this.plane2) {
                    window.location.href = 'works.html';
                }
            }
        });
    }

    setupHoverEffect() {
        const cursor = document.querySelector(".cursor");
        const follower = document.querySelector(".cursor-follower");
    
        window.addEventListener('mousemove', (event) => {
            if (!this.textMeshesVisible) {
                document.body.style.cursor = 'default';
                cursor.classList.remove("active");
                follower.classList.remove("active");
                return;
            }
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects([this.plane1, this.plane2]);
    
            if (intersects.length > 0) {
                document.body.style.cursor = 'pointer';
                cursor.classList.add("active");
                follower.classList.add("active");
            } else {
                document.body.style.cursor = 'default';
                cursor.classList.remove("active");
                follower.classList.remove("active");
            }
        });
    }
    

    setTextMeshesVisibility(isVisible) {
        this.textMeshesVisible = isVisible;
    }

    setupTheatreForPlane(sheet, plane, progressUniform) {
        if (!this.projectStateEnabled) return;

        const obj = sheet.object("Plane Properties", {
            position: types.compound({
                x: types.number(plane.position.x, { range: [-20, 20] }),
                y: types.number(plane.position.y, { range: [-20, 20] }),
                z: types.number(plane.position.z, { range: [-20, 20] }),
            }),
            rotation: types.compound({
                x: types.number(plane.rotation.x, { range: [-Math.PI, Math.PI] }),
                y: types.number(plane.rotation.y, { range: [-Math.PI, Math.PI] }),
                z: types.number(plane.rotation.z, { range: [-Math.PI, Math.PI] }),
            }),
            progress: types.number(plane.material.uniforms[progressUniform].value, { range: [0, 2] }),
        }).onValuesChange((values) => {
            plane.position.set(values.position.x, values.position.y, values.position.z);
            plane.rotation.set(values.rotation.x, values.rotation.y, values.rotation.z);
            plane.material.uniforms[progressUniform].value = values.progress;

            if (this.animationFinished(values.progress)) {
              if (plane === this.plane1) {
                  this.finalPlane1Position = { x: values.position.x, y: values.position.y, z: values.position.z };
                  this.defaultPlane1Rotation = { ...values.rotation };
              } else if (plane === this.plane2) {
                  this.finalPlane2Position = { x: values.position.x, y: values.position.y, z: values.position.z };
                  this.defaultPlane2Rotation = { ...values.rotation };
              }
          }
        });
    }

    setupMouseMoveListener() {
        if (window.innerWidth < 1024) return;
      window.addEventListener('mousemove', (event) => {
          if (!this.mouseEnabled) return;
  
          const w = window.innerWidth;
          const h = window.innerHeight;
          const offsetX = (event.clientX - w / 2) / w;
          const offsetY = (event.clientY - h / 2) / h;
  
          const plane1Offset = 2;
          const plane2Offset = 2;
  
          if (this.plane1) {
              const newPlane1PositionX = this.finalPlane1Position.x + offsetX * plane1Offset;
              const newPlane1PositionY = this.finalPlane1Position.y + offsetY * plane1Offset;
  
              this.plane1.position.x = THREE.MathUtils.lerp(this.plane1.position.x, newPlane1PositionX, this.rotationLerpSpeed);
              this.plane1.position.y = THREE.MathUtils.lerp(this.plane1.position.y, newPlane1PositionY, this.rotationLerpSpeed);
          }
  
          if (this.plane2) {
              const newPlane2PositionX = this.finalPlane2Position.x + offsetX * plane2Offset;
              const newPlane2PositionY = this.finalPlane2Position.y + offsetY * plane2Offset;
  
              this.plane2.position.x = THREE.MathUtils.lerp(this.plane2.position.x, newPlane2PositionX, this.rotationLerpSpeed);
              this.plane2.position.y = THREE.MathUtils.lerp(this.plane2.position.y, newPlane2PositionY, this.rotationLerpSpeed);
          }
      });
  }

    animationFinished(progress) {
        return progress >= 1.0;
    }

    setupTheatreControls() {
        this.sheet1.object("Plane 1 Controls", {
            mouseEnabled: types.boolean(this.mouseEnabled),
        }).onValuesChange((values) => {
            this.mouseEnabled = values.mouseEnabled;
        });

        this.sheet2.object("Plane 2 Controls", {
            mouseEnabled: types.boolean(this.mouseEnabled),
        }).onValuesChange((values) => {
            this.mouseEnabled = values.mouseEnabled;
        });
    }

    render() {
        this.time += 0.01;

        if (this.plane1 && this.plane1.material.uniforms.uTime) {
            this.plane1.material.uniforms.uTime.value = this.time;
        }

        if (this.plane2 && this.plane2.material.uniforms.uTime) {
            this.plane2.material.uniforms.uTime.value = this.time;
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    setCameraPosition() {
        const minZ = 5;
        const maxZ = 20;
    
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

        const isDesktop = this.width > 1024;
        this.projectStateEnabled = isDesktop ? projectStateDesktop : projectStateMobile;

        this.project = getProject("TextMeshes Project", { state: this.projectStateEnabled });
        this.sheet1 = this.project.sheet("Plane 1 Sheet");
        this.sheet2 = this.project.sheet("Plane 2 Sheet");

        this.addPlanes();
        this.setupTheatreControls();
    }

    playPlane1Forward(callback) {
      this.project.ready.then(() => {
          this.sheet1.sequence.position = 0;

          this.sheet1.sequence.play({
              iterationCount: 1,
              direction: 'normal',
              range: [0, 2.5],
              rate: 2 
          }).then(() => {
              console.log("Plane 1 Forward Animation complete");
              if (typeof callback === 'function') {
                  callback();
              }
          });
      });
  }

  playPlane1Reverse(callback) {
      this.project.ready.then(() => {
          this.sheet1.sequence.position = 2.5;

          this.sheet1.sequence.play({
              iterationCount: 1,
              direction: 'reverse',
              rate: 2
          }).then(() => {
              console.log("Plane 1 Reverse Animation complete");
              if (typeof callback === 'function') {
                  callback();
              }
          });
      });
  }

  playPlane2Forward(callback) {
      this.project.ready.then(() => {
          this.sheet2.sequence.position = 0;

          this.sheet2.sequence.play({
              iterationCount: 1,
              direction: 'normal',
              range: [0, 2.5],
              rate: 2
          }).then(() => {
              console.log("Plane 2 Forward Animation complete");
              if (typeof callback === 'function') {
                  callback();
              }
          });
      });
  }

  playPlane2Reverse(callback) {
      this.project.ready.then(() => {
          this.sheet2.sequence.position = 2.5;

          this.sheet2.sequence.play({
              iterationCount: 1,
              direction: 'reverse',
              rate: 2
          }).then(() => {
              console.log("Plane 2 Reverse Animation complete");
              if (typeof callback === 'function') {
                  callback();
              }
          });
      });
  }

  playPlanesSimultaneously(callback) {
    this.project.ready.then(() => {
        Promise.all([
            this.sheet1.sequence.play({ iterationCount: 1, direction: 'normal', range: [0, 2.5], rate: 2 }),
            this.sheet2.sequence.play({ iterationCount: 1, direction: 'normal', range: [0, 2.5], rate: 2 })
        ]).then(() => {
            console.log("Both Plane Forward Animations complete");
            if (typeof callback === 'function') {
                callback();
            }
        });
    });
}

playPlanesReverseSimultaneously(callback) {
    this.project.ready.then(() => {
        Promise.all([
            this.sheet1.sequence.play({ iterationCount: 1, direction: 'reverse', rate: 2 }),
            this.sheet2.sequence.play({ iterationCount: 1, direction: 'reverse', rate: 2 })
        ]).then(() => {
            console.log("Both Plane Reverse Animations complete");
            if (typeof callback === 'function') {
                callback();
            }
        });
    });
}
  }
