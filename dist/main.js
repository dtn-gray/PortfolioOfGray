"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var THREE = _interopRequireWildcard(require("three"));
var _gsap = _interopRequireDefault(require("gsap"));
var _ScrollTrigger = require("gsap/ScrollTrigger");
var _module = _interopRequireDefault(require("./module.js"));
var _model = _interopRequireDefault(require("./model.js"));
var _textMeshes = _interopRequireDefault(require("./textMeshes.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
_gsap["default"].registerPlugin(_ScrollTrigger.ScrollTrigger);
var sketch = new _module["default"]({
  dom: document.getElementById("container")
});
var modelViewer = new _model["default"]({
  dom: document.getElementById("model-container")
});
var textMeshes = new _textMeshes["default"]({
  dom: document.getElementById('text-container')
});

// Disable scrolling at the beginning
disableScroll();
var scrollTriggerInstance = null;
var scrollTriggerModelInstance = null;

// Start both animations after the loading screen has finished
function startAnimations() {
  Promise.all([sketch.loadAnimation(), modelViewer.loadModelAnimation()]).then(function () {
    console.log("Both load animations complete, enabling scroll");
    enableScroll(); // Re-enable scrolling once animations are done
  });
}

// Manage loading screen
function handleLoadingScreen() {
  var loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log("Started loading: ".concat(url, ".\nLoaded ").concat(itemsLoaded, " of ").concat(itemsTotal, " files."));
  };
  loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log("Loading file: ".concat(url, ".\nLoaded ").concat(itemsLoaded, " of ").concat(itemsTotal, " files."));
  };
  loadingManager.onLoad = function () {
    console.log('All items loaded.');
    var loadingScreen = document.getElementById('loading-screen');
    _gsap["default"].to(loadingScreen, {
      opacity: 0,
      duration: 1,
      onComplete: function onComplete() {
        loadingScreen.style.display = 'none';
        startAnimations(); // Start animations after loading screen is hidden
      }
    });
  };
  loadingManager.onError = function (url) {
    console.error("There was an error loading ".concat(url));
  };
  return loadingManager;
}

// Initialize the loading manager and pass it to modelViewer
var loadingManager = handleLoadingScreen();
modelViewer.initModel(loadingManager);
var sectionTrigger = document.querySelector(".sectiontrigger");
var section1 = document.getElementById("section1");
var section2 = document.getElementById("section2");
var lastScrollTop = 0; // To track the scroll position
var hasScrolledDown = false; // Flag to prevent multiple scroll triggers
var hasScrolledUp = false; // Flag to prevent multiple scroll triggers

// Flag to track if playAnimation has been played
var hasPlayedAnimation = false;
// Flag to track if reverseAnimation has been played after the last playAnimation
var canPlayAnimation = true;
function createScrollTrigger() {
  if (!sketch.sheet || !sketch.sheet.sequence) {
    console.error("Theatre.js sheet or sequence is not initialized.");
    return;
  }
  var wrapElement1 = document.getElementById("scroll1"); // Get the section2 element

  sketch.sheet.sequence.position = 2;
  scrollTriggerInstance = _gsap["default"].to({}, {
    scrollTrigger: {
      trigger: wrapElement1,
      // Trigger the scroll animation when section2 comes into view
      start: "top top",
      // Start the animation when section2's top hits the top of the viewport
      end: "bottom bottom",
      // End the animation when the bottom of section2 reaches the bottom of the viewport
      scrub: true,
      onUpdate: function onUpdate(self) {
        var progress = self.progress;
        var sequencePosition = 2 + progress * (3.5 - 2); // Map scroll progress to sequence position

        // Ensure sequencePosition does not result in identical range values
        var start = sequencePosition;
        var end = sequencePosition + 0.0001; // Add a small offset to ensure range[1] > range[0]

        sketch.sheet.sequence.play({
          iterationCount: 1,
          direction: 'normal',
          range: [start, end],
          rate: 2 // Set a small positive rate to avoid the error
        });
        sketch.sheet.sequence.pause(); // Pause immediately after setting the position
      },
      onScrubComplete: function onScrubComplete() {
        sketch.sheet.sequence.pause(); // Pause when scrub is complete
      }
    }
  });
}
function createScrollTriggerForModel() {
  if (!modelViewer.theatreSheet || !modelViewer.theatreSheet.sequence) {
    console.error("Theatre.js sheet or sequence is not initialized.");
    return;
  }
  var wrapElement2 = document.getElementById("scroll2");
  modelViewer.theatreSheet.sequence.position = 4.4;
  scrollTriggerModelInstance = _gsap["default"].to({}, {
    scrollTrigger: {
      trigger: wrapElement2,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function onUpdate(self) {
        var progress = self.progress;
        var sequencePosition = 4.4 + progress * (8 - 4.4);
        var start = sequencePosition;
        var end = sequencePosition + 0.0001;
        modelViewer.theatreSheet.sequence.play({
          iterationCount: 1,
          direction: 'normal',
          range: [start, end],
          rate: 2
        });
        modelViewer.theatreSheet.sequence.pause();
      },
      onScrubComplete: function onScrubComplete() {
        modelViewer.theatreSheet.sequence.pause();
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
}

// Observer for scrolling down to section2
var observerSection2 = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    var currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var isScrollingDown = currentScrollTop > lastScrollTop;
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
    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // For Mobile or negative scrolling
  });
}, {
  threshold: 0.5
}); // Trigger when sectiontrigger is at least 50% in view

observerSection2.observe(sectionTrigger);

// Observer for playing animation when section2 is fully in view
var playAnimationObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting && canPlayAnimation) {
      console.log("Section 2 fully in view, playing animation");
      disableScroll(); // Disable scroll before animation
      sketch.playAnimation(function () {
        createScrollTrigger();
        createScrollTriggerForModel();
        console.log("Animation complete");
        hasPlayedAnimation = true; // Set flag to true
        canPlayAnimation = false; // Disallow further playAnimation until reverseAnimation is played
      });
    }
  });
}, {
  threshold: 0.9
}); // Lowered threshold to ensure trigger

playAnimationObserver.observe(section2);

// Observer for reversing animation when section1 is fully in view
var reverseAnimationObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting && hasPlayedAnimation) {
      // Check if playAnimation was played
      console.log("Section 1 fully in view, reversing animation");
      disableScroll(); // Disable scroll before animation
      sketch.reverseAnimation(function () {
        console.log("Reverse animation complete, enabling playAnimation");
        canPlayAnimation = true; // Allow playAnimation to be played again
        hasPlayedAnimation = false; // Set flag to false
      });
    }
  });
}, {
  threshold: 0.9
}); // Lowered threshold to ensure trigger

reverseAnimationObserver.observe(section1);
function smoothScrollToSection2() {
  var scrollOptions = {
    top: section2.offsetTop,
    behavior: 'smooth'
  };
  window.scrollTo(scrollOptions);
  setTimeout(function () {
    modelViewer.playModelAnimation(function () {
      console.log("Model animation finished");
      enableScroll();
    });
  }); // Adjust timeout based on your scroll duration
}
function smoothScrollToSection1() {
  var scrollOptions = {
    top: section1.offsetTop,
    behavior: 'smooth'
  };
  window.scrollTo(scrollOptions);
  setTimeout(function () {
    modelViewer.reverseModelAnimation(function () {
      console.log("Model animation reversed");
      enableScroll();
      destroyScrollTrigger();
    });
  }, 100); // Adjust timeout based on your scroll duration
}
function disableScroll() {
  console.log("Disabling scroll");
  document.body.classList.add('no-scroll');
}
function enableScroll() {
  console.log("Enabling scroll");
  document.body.classList.remove('no-scroll');
}