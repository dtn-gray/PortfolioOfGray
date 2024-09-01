import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import noise from './noise.jpg';
import img1 from './img/1.gif';
import img2 from './img/2.png';
import img3 from './img/3.png';
import img4 from './img/4.png';
import displace from './displace.png';
import fragment from './fragment.glsl';
import vertex from './vertex.glsl';
import * as THREE from 'three';

export default class ImageSketch {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.container = document.body;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        const existingCanvas = this.container.querySelector('canvas.image-sketch-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        this.app = new PIXI.Application({
            backgroundColor: 0x000000,
            transparent: true,
            resolution: 1,
        });

        this.app.view.classList.add('image-sketch-canvas');

        this.app.renderer.resize(this.width, this.height);
        this.container.appendChild(this.app.view);

        this.app.view.style.position = 'absolute';
        this.app.view.style.top = '0';
        this.app.view.style.left = '0';
        this.app.view.style.width = '100%';
        this.app.view.style.height = '100%';

        this.scrollTarget = 0;
        this.scroll = 0;
        this.currentScroll = 0;

        this.containerPixi = new PIXI.Container();
        this.containerPixi.rotation = 0;

        this.app.stage.addChild(this.containerPixi);

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d', { willReadFrequently: true });

        this.loadImages(loadingManager);
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

    loadImages(loadingManager) {
        if (loadingManager) {
            loadingManager.itemStart('ImageSketch');
        }

        let images = [img1, img2, img3, img4];
        const loader = new PIXI.Loader();

        images.forEach((image, index) => {
            loader.add(`image${index}`, image);
        });

        loader.load((loader, resources) => {
            this.slides = images.map((image, i) => {
                const sprite = new PIXI.Sprite(resources[`image${i}`].texture);
                sprite.visible = false;
                return sprite;
            });

            this.add(loadingManager);

            if (loadingManager) {
                loadingManager.itemEnd('ImageSketch');
            }

            this.centerImage(0);
        });
    }

    centerImage(index) {
        const targetPosition = index * this.margin;
        const targetScroll = -(targetPosition - this.height / 2 - this.margin / 2);

        this.scrollTarget = targetScroll;
        this.currentScroll = targetScroll;
        this.scroll = targetScroll;
    }

    add(loadingManager) {
        this.objs = [];
        this.margin = 600;
        this.wholeHeight = this.margin * this.slides.length;

        const borderColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00]; // Red, Green, Blue, Yellow

        this.slides.forEach((slide, i) => {
            let c = new PIXI.Container();

            let image = slide;
            let aspectRatio = 1;
            let imageWidth = this.width * 0.7;
            let imageHeight = imageWidth / aspectRatio;

            image.width = imageWidth;
            image.height = imageHeight;
            image.anchor.set(0.5);
            image.x = 0;
            image.y = 0;

            image.visible = true;

            c.position.x = this.width / 2;
            c.position.y = this.height / 2 + i * this.margin;

            // Add border
            // const border = new PIXI.Graphics();
            // border.lineStyle(4, borderColors[i % borderColors.length], 1);
            // border.drawRect(-image.width / 2, -image.height / 2, image.width, image.height);
            // c.addChild(border);

            c.interactive = true;
            c.buttonMode = true;
            c.cursor = 'pointer';

            image.interactive = true;
            image.buttonMode = true;

            image.cursor = 'pointer';


            image.on('pointerdown', () => {
                console.log('Image clicked:', i);
                switch (i) {
                    case 0:
                        window.location.href = 'sepworks.html';
                        break;
                    case 1:
                        window.location.href = 'sepworks.html';
                        break;
                    case 2:
                        window.location.href = 'sepworks.html';
                        break;
                    case 3:
                        window.location.href = 'sepworks.html';
                        break;
                }
            });

            c.addChild(image);


            let uniforms = {
                uPower: 0,
                uDir: 1,
                udisplacement: PIXI.Sprite.from(displace).texture,
                umap: image.texture,
                filterMatrix: new PIXI.Matrix()
            };

            let displacementFilter = new PIXI.Filter(vertex, fragment, uniforms);

            displacementFilter.apply = function (filtermanager, input, output, e) {
                this.uniforms.filterMatrix = filtermanager.calculateSpriteMatrix(
                    uniforms.filterMatrix,
                    image
                );
                filtermanager.applyFilter(this, input, output, e);
            };

            image.filters = [displacementFilter];

            let mask = new PIXI.Graphics();
            mask.beginFill(0xff0000);
            mask.drawRect(-image.width / 2, -image.height / 2, image.width, image.height);
            mask.endFill();

            c.addChild(mask);
            c.mask = mask;

            this.containerPixi.addChild(c);

            this.objs.push({
                mask: mask,
                container: c,
                image: image,
                uniforms: uniforms,
                position: i,
                mx: 400,
                my: 200
            });
        });
    }

    updateAllTheThings() {
        if (!this.objs || this.objs.length === 0) {
            return;
        }

        this.objs.forEach(slide => {
            slide.mask.clear();
            slide.mask.beginFill(0xff0000);

            let DISTORTION = this.scroll * 5;
            let koef = 0.2;

            slide.uniforms.uDir = Math.sign(DISTORTION);
            slide.uniforms.uPower = Math.abs(DISTORTION * 0.03);

            let p = [
                {
                    x: slide.mx,
                    y: -slide.my
                },
                {
                    x: -slide.mx,
                    y: -slide.my
                },
                {
                    x: -slide.mx,
                    y: slide.my
                },
                {
                    x: slide.mx,
                    y: slide.my
                },

            ]

            if (DISTORTION < 0) {
                p[2].x += Math.abs(DISTORTION) * 0.4;
                p[2].y -= Math.abs(DISTORTION) * 0.4;

                p[3].x -= Math.abs(DISTORTION) * 0.4;
                p[3].y -= Math.abs(DISTORTION) * 0.4;
            } else {
                p[0].x -= Math.abs(DISTORTION) * 0.4;
                p[0].y += Math.abs(DISTORTION) * 0.4;

                p[1].x += Math.abs(DISTORTION) * 0.4;
                p[1].y += Math.abs(DISTORTION) * 0.4;
            }

            let C = [
                { x: 0.5 * p[0].x + 0.5 * p[1].x, y: 0.5 * p[0].y + 0.5 * p[1].y + DISTORTION },
                { x: 0.5 * p[1].x + 0.5 * p[2].x + Math.abs(DISTORTION * koef) * 0.9, y: 2 * p[1].y + 0.5 * p[2].y },
                { x: 0.5 * p[2].x + 0.5 * p[3].x, y: 0.5 * p[2].y + 0.5 * p[3].y + DISTORTION },
                { x: 0.5 * p[3].x + 0.5 * p[0].x - Math.abs(DISTORTION * koef) * 0.9, y: 2 * p[3].y + 0.5 * p[0].y }
            ];

            slide.mask.moveTo(p[0].x, p[0].y);
            slide.mask.quadraticCurveTo(C[0].x, C[0].y, p[1].x, p[1].y);
            slide.mask.quadraticCurveTo(C[1].x, C[1].y, p[2].x, p[2].y);
            slide.mask.quadraticCurveTo(C[2].x, C[2].y, p[3].x, p[3].y);
            slide.mask.quadraticCurveTo(C[3].x, C[3].y, p[0].x, p[0].y);

            slide.container.position.y = (slide.position * this.margin + this.currentScroll + 1000 * this.wholeHeight) % this.wholeHeight - this.margin;
        });
    }

    setupResize() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.app.view.style.width = this.width + 'px';
        this.app.view.style.height = this.height + 'px';
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
