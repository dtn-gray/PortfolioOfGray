import { gsap } from "gsap";
import barba from '@barba/core';
import * as THREE from 'three';

function pageTransition() {
    let tl = gsap.timeline();

    tl.to(".transition", {
        duration: 1,
        scaleY: 1,
        transformOrigin: "bottom",
        ease: "power4.inOut",
    });

    tl.to(".transition", {
        duration: 1,
        scaleY: 0,
        transformOrigin: "top",
        ease: "power4.inOut",
        delay: 0.2,
    });
}

function delay(n) {
    n = n || 0;
    return new Promise((done) => {
        setTimeout(() => {
            done();
        }, n);
    });
}

function initLoadingManager() {
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

barba.init({
    sync: true,
    transitions: [
        {
            async leave(data) {
                const done = this.async();

                if (data.current.namespace === 'works') {
                    const worksContainer = document.getElementById('container');
                    if (worksContainer) {
                        worksContainer.innerHTML = '';
                    }
                }

                pageTransition();
                await delay(1000);
                done();
            },
            async enter(data) {
                const loadingManager = initLoadingManager();
            
                if (data.next.namespace === 'about') {
                    console.log('Initializing About page content');
                    const container = document.getElementById("container");
                    if (container) {
                        new Head({
                            dom: container,
                            loadingManager: loadingManager
                        });
                    }
                } else if (data.next.namespace === 'works') {
                    new Sketch2(loadingManager);
                } else if (data.next.namespace === 'home') {
                    const modelViewer = new ModelViewer();
                    modelViewer.initModel(loadingManager);
                }
            },
            async once(data) {
                const loadingManager = initLoadingManager();

                if (data.next.namespace === 'about') {
                    console.log('First load of the About page');
                } else if (data.next.namespace === 'works') {
                    new Sketch2(loadingManager);
                } else if (data.next.namespace === 'home') {
                    const modelViewer = new ModelViewer();
                    modelViewer.initModel(loadingManager);
                }
            }
        },
    ],
});