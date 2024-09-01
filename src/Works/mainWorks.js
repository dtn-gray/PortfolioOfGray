import * as THREE from 'three';
import gsap from 'gsap';
import ImageSketch from './imageWorks.js';
import TextSketch from './textWorks.js';
import LiquidSketch from '../Home/liquid.js';

const liquid = new LiquidSketch({
    dom: document.getElementById("liquid-container")
});  

function handleLoadingScreen() {
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
        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                loadingScreen.style.display = 'none';
            }
        });
    };

    loadingManager.onError = (url) => {
        console.error(`There was an error loading ${url}`);
    };

    return loadingManager;
}

const loadingManager = handleLoadingScreen();

const imageSketch = new ImageSketch(loadingManager);
const textSketch = new TextSketch(loadingManager);

textSketch.app.view.style.zIndex = 2;
imageSketch.app.view.style.zIndex = 1;
