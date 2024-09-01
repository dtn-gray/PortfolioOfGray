import * as PIXI from 'pixi.js';
import * as THREE from 'three';
import BONNES from '/src/assets/fonts/BONNES.ttf';
import Peach from '/src/assets/fonts/Barrage.ttf';

export default class TextSketch {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.container = document.body;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        const existingCanvas = this.container.querySelector('canvas.text-sketch-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        this.app = new PIXI.Application({
            transparent: true,
            resolution: 1,
        });

        this.app.view.classList.add('text-sketch-canvas');

        this.app.renderer.resize(this.width, this.height);
        this.container.appendChild(this.app.view);

        this.app.view.style.position = 'absolute';
        this.app.view.style.zIndex = '1';

        this.scrollTarget = 0;
        this.scroll = 0;
        this.currentScroll = 0;

        this.containerPixi = new PIXI.Container();
        this.app.stage.addChild(this.containerPixi);

        this.loadText();
        this.resize();
        this.setupResize();
        this.render();
        this.scrollEvent();
    }

    scrollEvent() {
        let touchStartY = 0;

        document.addEventListener('mousewheel', (e) => {
            this.scrollTarget += e.wheelDelta / 3;
        });

        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        window.addEventListener('touchmove', (e) => {
            const touchMoveY = e.touches[0].clientY;
            const deltaY = touchMoveY - touchStartY;
            this.scrollTarget += deltaY * 0.5;
            touchStartY = touchMoveY;
        });

        window.addEventListener('touchend', () => {
            touchStartY = 0;
        });
    }

    loadText() {
        if (this.loadingManager) {
            this.loadingManager.itemStart('TextSketch');
        }

        const containerWidth = this.width * 0.5;
        const containerHeight = containerWidth * 0.2;

        let texts = [
            [
                { text: "#", fontSizePercent: 10, fontFamily: 'BONNES', position: { xPercent: -30, yPercent: 80 } },
                { text: "1", fontSizePercent: 25, fontFamily: 'BONNES', position: { xPercent: -20, yPercent: 100 } },
                { text: "Face of Death", fontSizePercent: 5, fontFamily: 'BONNES', position: { xPercent: 50, yPercent: 250 } }
            ],
            [
                { text: "#", fontSizePercent: 10, fontFamily: 'BONNES', position: { xPercent: -30, yPercent: 80 } },
                { text: "2", fontSizePercent: 25, fontFamily: 'BONNES', position: { xPercent: -20, yPercent: 100 } },
                { text: "Acceleration", fontSizePercent: 5, fontFamily: 'BONNES', position: { xPercent: 50, yPercent: 250 } }
            ],
            [
                { text: "#", fontSizePercent: 10, fontFamily: 'BONNES', position: { xPercent: -30, yPercent: 80 } },
                { text: "3", fontSizePercent: 25, fontFamily: 'BONNES', position: { xPercent: -20, yPercent: 100 } },
                { text: "Hangover", fontSizePercent: 5, fontFamily: 'BONNES', position: { xPercent: 50, yPercent: 250 } }
            ],
            [
                { text: "#", fontSizePercent: 10, fontFamily: 'BONNES', position: { xPercent: -30, yPercent: 80 } },
                { text: "4", fontSizePercent: 25, fontFamily: 'BONNES', position: { xPercent: -20, yPercent: 100 } },
                { text: "Media", fontSizePercent: 5, fontFamily: 'BONNES', position: { xPercent: 50, yPercent: 250 } }
            ]
        ];

        const borderColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00]; // Red, Green, Blue, Yellow

        this.slides = texts.map((textArray, index) => {
            const textContainer = new PIXI.Container();
            textContainer.width = containerWidth;
            textContainer.height = containerHeight;

            textContainer.pivot.set(containerWidth / 2, containerHeight / 2);

            // Draw a border with a unique color for each container
            // const border = new PIXI.Graphics();
            // border.lineStyle(2, borderColors[index % borderColors.length], 1);
            // border.drawRect(-containerWidth / 2, -containerHeight / 2, containerWidth, containerHeight);
            // textContainer.addChild(border);

            textArray.forEach(({ text, fontSizePercent, fontFamily, position }) => {
                const fontSize = (fontSizePercent / 100) * containerWidth; 

                const textSprite = new PIXI.Text(text, {
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fill: 'rgba(255, 255, 255, 1.5)',
                    align: 'center'
                });

                textSprite.anchor.set(0.5);

                textSprite.position.set(
                    (position.xPercent / 100) * containerWidth - containerWidth / 2,
                    (position.yPercent / 100) * containerHeight - containerHeight / 2
                );

                textContainer.addChild(textSprite);
            });

            const c = new PIXI.Container();
            c.addChild(textContainer);

            c.position.set((this.width / 2) + (this.width / 4), this.height / 2 + index * this.margin);

            this[`textContainer${index}`] = {
                mx: 0,
                my: 0,
                container: c,
            };

            return c;
        });

        this.objs = [];
        this.margin = 600;
        this.wholeHeight = this.margin * this.slides.length;

        this.slides.forEach((slide, i) => {
            this.containerPixi.addChild(slide);
            this.objs.push({
                container: slide,
                slide: slide.children[0],
                position: i,
            });
        });

        if (this.loadingManager) {
            this.loadingManager.itemEnd('TextSketch');
        }

        this.centerText(0);
    }

    updateAllTheThings() {
        this.objs.forEach((obj, i) => {
            const props = this[`textContainer${i}`];
            obj.container.position.x = (this.width / 2) + (this.width / 4) + props.mx;
            obj.container.position.y = (obj.position * this.margin + this.currentScroll + 1000 * this.wholeHeight) % this.wholeHeight - this.margin + props.my;
        });
    }

    centerText(index) {
        const targetPosition = index * this.margin;
        const targetScroll = -(targetPosition - this.height / 2 - this.margin / 2);

        this.scrollTarget = targetScroll;
        this.currentScroll = targetScroll;
        this.scroll = targetScroll;
    }

    setupResize() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.app.view.style.width = this.width + 'px';
    this.app.view.style.height = this.height + 'px';
    
    const tabletMaxThreshold = 1024;
    const tabletMinThreshold = 769;
    const mobileMaxThreshold = 768;


    const tabletYPercentScaleFactor1 = -1.1; //text box 1
    const tabletYPercentScaleFactor2 = 0.2; //text box 2
    const tabletYPercentScaleFactor3 = 2; //text box 3
    const tabletFontSizeScaleFactor3 = 0.3; //text box 3

    const mobileYPercentScaleFactor1 = -1.1; //text box 1
    const mobileYPercentScaleFactor2 = 0.2; //text box 2
    const mobileYPercentScaleFactor3 = 2.5; //text box 3
    const mobileFontSizeScaleFactor3 = 0.7; //text box 3

    this.slides.forEach((slide) => {
        const textContainer = slide.children[0];
        const firstTextBox = textContainer.children[0];
        const secondTextBox = textContainer.children[1]; 
        const thirdTextBox = textContainer.children[2];

        if (this.width <= tabletMaxThreshold && this.width >= tabletMinThreshold) {
            // Tablet screen adjustments
            firstTextBox.position.y = (40 * tabletYPercentScaleFactor1 / 100) * textContainer.height - textContainer.height / 2;
            secondTextBox.position.y = (50 * tabletYPercentScaleFactor2 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.position.y = (60 * tabletYPercentScaleFactor3 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.style.fontSize = `${(10 * tabletFontSizeScaleFactor3 / 100) * this.width}px`;

        } else if (this.width <= mobileMaxThreshold) {
            // Mobile screen adjustments
            firstTextBox.position.y = (40 * mobileYPercentScaleFactor1 / 100) * textContainer.height - textContainer.height / 2;
            secondTextBox.position.y = (50 * mobileYPercentScaleFactor2 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.position.y = (60 * mobileYPercentScaleFactor3 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.style.fontSize = `${(10 * mobileFontSizeScaleFactor3 / 100) * this.width}px`;

        } else {
            const originalYPercent1 = 40;
            const originalYPercent2 = 50;
            const originalYPercent3 = 125;
            const originalFontSizePercent3 = 3;
            
            firstTextBox.position.y = (originalYPercent1 / 100) * textContainer.height - textContainer.height / 2;
            secondTextBox.position.y = (originalYPercent2 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.position.y = (originalYPercent3 / 100) * textContainer.height - textContainer.height / 2;
            thirdTextBox.style.fontSize = `${(originalFontSizePercent3 / 100) * this.width}px`;
        }
    });
}

    

    render() {
        this.app.ticker.add(() => {
            const previousScroll = this.scroll;
            this.scroll -= (this.scroll - this.scrollTarget) * 0.1;
            this.scroll *= 0.9;
            this.scrollTarget *= 0.9;
            this.direction = Math.sign(this.scroll);

            if (Math.abs(this.scroll - previousScroll) > 0.1) {
                this.currentScroll += this.scroll;
                this.updateAllTheThings();
            }
        });
    }
}
