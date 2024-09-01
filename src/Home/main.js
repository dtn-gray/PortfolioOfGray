import * as THREE from "three";
import gsap from 'gsap';
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Sketch from './module.js';
import ModelViewer from './model.js';
import TextMeshes from './textMeshes.js';
import Nokia from "./nokia.js";
import LiquidSketch from "./liquid.js";

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

const sketch = new Sketch({
    dom: document.getElementById("container")
});

const modelViewer = new ModelViewer({
    dom: document.getElementById("model-container")
});

const textMeshes = new TextMeshes({
    dom: document.getElementById('text-container')
});

const nokia = new Nokia({
    dom: document.getElementById('nokia-container')
});

const liquid = new LiquidSketch({
    dom: document.getElementById("liquid-container")
  });  

disableScroll();

let scrollTriggerInstance = null;
let scrollTriggerModelInstance = null;
let scrollTriggerLiquidInstance = null;

function startAnimations() {
    Promise.all([
        sketch.loadAnimation(),
        modelViewer.loadModelAnimation()
    ]).then(() => {
        console.log("Both load animations complete, enabling scroll");
        enableScroll();
    });
}

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
        setTimeout(() => {
            gsap.to(loadingScreen, { opacity: 0, duration: 1, onComplete: () => {
                loadingScreen.style.display = 'none';
                startAnimations();
            }});
        }, 2000);
    };

    loadingManager.onError = (url) => {
        console.error(`There was an error loading ${url}`);
    };

    return loadingManager;
}

const loadingManager = handleLoadingScreen();
modelViewer.initModel(loadingManager);

const sectionTrigger = document.querySelector("#sectiontrigger1");
const section1 = document.getElementById("section1");
const section2 = document.getElementById("section2");

const section3 = document.getElementById("section3");
const section4 = document.getElementById("section4");
const sectionTrigger2 = document.getElementById("sectiontrigger2");

const cursorTriggerL = document.getElementById("cursor-triggerL");
const cursorTriggerR = document.getElementById("cursor-triggerR");

const textMeshesSection = document.getElementById('text-container');

let lastScrollTop = 0;
let hasScrolledDown = false;
let hasScrolledUp = false;
let hasScrolledDown2 = false;
let hasScrolledUp2 = false;

let hasPlayedPlane1Forward = false;
let hasPlayedPlane2Forward = false;

let hasPlayedAnimation = false;
let canPlayAnimation = true;

function createScrollTrigger() {
    if (!sketch.sheet || !sketch.sheet.sequence) {
        console.error("Theatre.js sheet or sequence is not initialized.");
        return;
    }

    const wrapElement1 = document.getElementById("scroll1");

    sketch.sheet.sequence.position = 2;

    scrollTriggerInstance = gsap.to({}, {
        scrollTrigger: {
            trigger: wrapElement1,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                let sequencePosition = 2 + progress * (3.5 - 2);

                let start = sequencePosition;
                let end = sequencePosition + 0.0001;

                sketch.sheet.sequence.play({
                    iterationCount: 1,
                    direction: 'normal',
                    range: [start, end],
                    rate: 2 
                });

                sketch.sheet.sequence.pause();
            },
            onScrubComplete: () => {
                sketch.sheet.sequence.pause();
            }
        }
    });
}

function createScrollTriggerForModel() {
    if (!modelViewer.theatreSheet || !modelViewer.theatreSheet.sequence) {
        console.error("Theatre.js sheet or sequence is not initialized.");
        return;
    }

    const wrapElement2 = document.getElementById("scroll2");

    modelViewer.theatreSheet.sequence.position = 4.4;

    scrollTriggerModelInstance = gsap.to({}, {
        scrollTrigger: {
            trigger: wrapElement2,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                let sequencePosition = 4.4 + progress * (8 - 4.4);

                let start = sequencePosition;
                let end = sequencePosition + 0.0001;

                modelViewer.theatreSheet.sequence.play({
                    iterationCount: 1,
                    direction: 'normal',
                    range: [start, end],
                    rate: 2
                });

                modelViewer.theatreSheet.sequence.pause();
            },
            onScrubComplete: () => {
                modelViewer.theatreSheet.sequence.pause();
            }
        }
    });
}

function createScrollTriggerForLiquid() {
    if (!liquid.theatreSheet || !liquid.theatreSheet.sequence) {
        console.error("Theatre.js sheet or sequence is not initialized.");
        return;
    }

    const wrapElement2 = document.getElementById("scroll2");

    liquid.theatreSheet.sequence.position = 4.4;

    scrollTriggerLiquidInstance = gsap.to({}, {
        scrollTrigger: {
            trigger: wrapElement2,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                let sequencePosition = 4.4 + progress * (8 - 4.4);

                let start = sequencePosition;
                let end = sequencePosition + 0.0001;

                liquid.theatreSheet.sequence.play({
                    iterationCount: 1,
                    direction: 'normal',
                    range: [start, end],
                    rate: 2
                });

                liquid.theatreSheet.sequence.pause();
            },
            onScrubComplete: () => {
                liquid.theatreSheet.sequence.pause();
            }
        }
    });
}

function destroyScrollTrigger() {
    if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
        scrollTriggerInstance = null;
    }
    if (scrollTriggerModelInstance) {
        scrollTriggerModelInstance.kill();
        scrollTriggerModelInstance = null;
    }
    if (scrollTriggerLiquidInstance) {
        scrollTriggerLiquidInstance.kill();
        scrollTriggerLiquidInstance = null;
    }
}

const observerSection2 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        let isScrollingDown = currentScrollTop > lastScrollTop;

        if (entry.isIntersecting && isScrollingDown && !hasScrolledDown) {
            hasScrolledDown = true;
            hasScrolledUp = false;
            disableScroll();
            console.log("Smooth scrolling to section 2");
            smoothScrollToSection2();
        } else if (entry.isIntersecting && !isScrollingDown && !hasScrolledUp) {
            hasScrolledUp = true;
            hasScrolledDown = false;
            disableScroll();
            console.log("Smooth scrolling to section 1");
            smoothScrollToSection1();
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
}, { threshold: 0.5 });

observerSection2.observe(sectionTrigger);

const observerSection3to4 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        let isScrollingDown = currentScrollTop > lastScrollTop;

        if (entry.isIntersecting && isScrollingDown && !hasScrolledDown2) {
            hasScrolledDown2 = true;
            hasScrolledUp2 = false;
            disableScroll();
            console.log("Smooth scrolling to section 4");
            smoothScrollToSection4();
        } else if (entry.isIntersecting && !isScrollingDown && !hasScrolledUp2) {
            hasScrolledUp2 = true;
            hasScrolledDown2 = false;
            disableScroll();
            console.log("Smooth scrolling to section 3");
            smoothScrollToSection3();
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
}, { threshold: 0.5 });

observerSection3to4.observe(sectionTrigger2);

const playAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && canPlayAnimation) {
            console.log("Section 2 fully in view, playing animations");
            disableScroll();

            liquid.playLiquidAnimation();
            sketch.playAnimation(() => {
                createScrollTrigger();
                createScrollTriggerForModel();
                createScrollTriggerForLiquid();

                hasPlayedAnimation = true;
                canPlayAnimation = false;  
            });
            

            console.log("Animations started");
        }
    });
}, { threshold: 0.9 });

playAnimationObserver.observe(section2);

const reverseAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && hasPlayedAnimation) { 
            console.log("Section 1 fully in view, reversing animations");
            disableScroll();  

            sketch.reverseAnimation();
            liquid.reverseLiquidAnimation();

            canPlayAnimation = true; 
            hasPlayedAnimation = false;
            console.log("Animations reversed");
        }
    });
}, { threshold: 0.9 });

reverseAnimationObserver.observe(section1);

function smoothScrollToSection2() {
    const scrollOptions = {
        top: section2.offsetTop,
        behavior: 'smooth'
    };
    
    window.scrollTo(scrollOptions);

    setTimeout(() => {
        modelViewer.playModelAnimation(() => {
            console.log("Model animation finished");
            enableScroll();
        });
    }, 100);
}

function smoothScrollToSection1() {
    const scrollOptions = {
        top: section1.offsetTop,
        behavior: 'smooth'
    };

    window.scrollTo(scrollOptions);

    setTimeout(() => {
        modelViewer.reverseModelAnimation(() => {
            console.log("Model animation reversed");
            enableScroll();
            destroyScrollTrigger();
        });
    }, 100);
}

function smoothScrollToSection4() {
    gsap.to(window, {
        scrollTo: { y: section4.offsetTop },
        duration: 2,
        ease: "power2.out",
        onStart: () => {
            nokia.playNokiaAnimation(0, 2, 1, 1);

            if (window.innerWidth > 1024) {
                cursorTriggerL.addEventListener('mouseenter', handleMouseEnterLeft);
                cursorTriggerR.addEventListener('mouseenter', handleMouseEnterRight);
            } else {
                textMeshes.playPlanesSimultaneously(() => {
                    console.log("Both Plane Forward Animations played simultaneously");
                });
            }
        },
        onComplete: () => {
            console.log("Smooth scroll to Section 4 complete");
            enableScroll();
        }
    });
}

function handleMouseEnterLeft() {
    if (window.innerWidth > 1024) {
        textMeshes.playPlane1Forward(() => {
            console.log("Plane 1 Forward Animation played");
            hasPlayedPlane1Forward = true;
        });

        if (hasPlayedPlane2Forward) {
            textMeshes.playPlane2Reverse(() => {
                console.log("Plane 2 Reverse Animation played");
            });
        }
    }
}

function handleMouseEnterRight() {
    if (window.innerWidth > 1024) {
        textMeshes.playPlane2Forward(() => {
            console.log("Plane 2 Forward Animation played");
            hasPlayedPlane2Forward = true;
        });

        if (hasPlayedPlane1Forward) {
            textMeshes.playPlane1Reverse(() => {
                console.log("Plane 1 Reverse Animation played");
            });
        }
    }
}

function smoothScrollToSection3() {
    gsap.to(window, {
        scrollTo: { y: section3.offsetTop },
        duration: 2,
        ease: "power2.out",
        onStart: () => {
            nokia.reverseNokiaAnimation(2, 0, 1, 1);
        },
        onComplete: () => {
            console.log("Smooth scroll to Section 3 complete");

            if (window.innerWidth > 1024) {
                cursorTriggerL.removeEventListener('mouseenter', handleMouseEnterLeft);
                cursorTriggerR.removeEventListener('mouseenter', handleMouseEnterRight);

                textMeshes.playPlane1Reverse(() => {
                    console.log("Plane 1 Reverse Animation played");
                });
                textMeshes.playPlane2Reverse(() => {
                    console.log("Plane 2 Reverse Animation played");
                });
            } else {
                textMeshes.playPlanesReverseSimultaneously(() => {
                    console.log("Both Plane Reverse Animations played simultaneously");
                });
            }

            hasPlayedPlane1Forward = false;
            hasPlayedPlane2Forward = false;
            enableScroll();
        }
    });
}

const textMeshesVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            textMeshes.setTextMeshesVisibility(true);
        } else {
            textMeshes.setTextMeshesVisibility(false);
        }
    });
}, { threshold: 0.1 });

textMeshesVisibilityObserver.observe(textMeshesSection);

function disableScroll() {
    console.log("Disabling scroll");
    document.body.classList.add('no-scroll');
}

function enableScroll() {
    console.log("Enabling scroll");
    document.body.classList.remove('no-scroll');
}
