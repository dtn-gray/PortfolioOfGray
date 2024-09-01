import Head from './head.js';
import LiquidSketch from "../Home/liquid.js";
import * as THREE from 'three';
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

const head = new Head({
    dom: document.getElementById("container")
});  

const liquid = new LiquidSketch({
    dom: document.getElementById("liquid-container")
});  

function loopAnimations() {
    head.playHeadAnimation(() => {
        gsap.delayedCall(2, () => {
            head.reverseHeadAnimation(() => {
                gsap.delayedCall(1, loopAnimations);
            });
        });
    });
}

function startAnimations() {
    head.loadHeadAnimation(() => {
        head.model.visible = true;
        loopAnimations();
    });
}

function smoothScroll(targetId) {
    const target = document.getElementById(targetId);
    const offset = window.innerWidth < 768 ? 100 : 0;
    gsap.to(window, {
        scrollTo: { y: target.offsetTop + offset, autoKill: false },
        duration: 1.5,
        ease: "power2.inOut"
    });
}

function handleScroll() {
    const sections = ["section1", "section2", "section3"];
    let currentIndex = 0;
    let isScrolling = false;
    let startY = 0;
    let currentY = 0;

    function scrollToSection(index) {
        isScrolling = true;

        gsap.to(window, {
            scrollTo: { y: document.getElementById(sections[index]).offsetTop, autoKill: false },
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => {
                setTimeout(() => {
                    isScrolling = false;
                }, 500);
            }
        });
    }

    function handleWheelEvent(event) {
        if (isScrolling) {
            event.preventDefault();
            return;
        }

        const deltaY = event.deltaY;

        if (deltaY > 0 && currentIndex < sections.length - 1) {
            currentIndex++;
        } else if (deltaY < 0 && currentIndex > 0) {
            currentIndex--;
        }

        event.preventDefault();
        scrollToSection(currentIndex);
    }

    function handleTouchStart(event) {
        startY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
        currentY = event.touches[0].clientY;
        const deltaY = startY - currentY;

        if (isScrolling) {
            return;
        }

        if (deltaY > 50 && currentIndex < sections.length - 1) {
            currentIndex++;
            scrollToSection(currentIndex);
        } else if (deltaY < -50 && currentIndex > 0) {
            currentIndex--;
            scrollToSection(currentIndex);
        }
    }

    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    if (window.innerWidth < 768) {
        gsap.fromTo(".title-column h1", 
            { opacity: 1, y: 0 },
            {
                opacity: 0,
                y: -50,
                duration: 2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#section2",
                    start: "top center",
                    end: "top top",
                    scrub: true,
                    toggleActions: "play none none reverse"
                }
            }
        );
    }
}

function animateTextOnScroll() {
    const textElements = gsap.utils.toArray(".section p, .title-column h1");

    textElements.forEach((element, index) => {
        gsap.from(element, {
            x: index % 2 === 0 ? -30 : 30,
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            stagger: 0.4,
            scrollTrigger: {
                trigger: element,
                start: "top 80%",
                end: "bottom 60%",
                scrub: 1,
                toggleActions: "play none none reset"
            }
        });
    });
}

// Initialize the loading manager
function initLoadingManager() {
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
        console.log(`Started loading: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        console.log(`Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    loadingManager.onLoad = () => {
        console.log('All items loaded.');
        const loadingScreen = document.getElementById('loading-screen');
        setTimeout(() => {
            gsap.to(loadingScreen, { opacity: 0, duration: 1, onComplete: () => {
                loadingScreen.style.display = 'none';
                startAnimations();
                handleScroll();   
                animateTextOnScroll();
            }});
        }, 2000);
    };

    loadingManager.onError = (url) => {
        console.error(`There was an error loading ${url}`);
    };

    return loadingManager;
}

let isSceneInitialized = false;

function init() {
    if (isSceneInitialized) return;
    isSceneInitialized = true;

    const loadingManager = initLoadingManager();

    const head = new Head({
        dom: document.getElementById("container"),
        loadingManager: loadingManager
    });
}

document.addEventListener("DOMContentLoaded", init);
