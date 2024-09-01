export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader = `
    uniform float uTime;
    uniform vec3 uFillColor;
    uniform float uProgress;
    uniform sampler2D uTexture;
    uniform float uDirection;
    varying vec2 vUv;

    float cubicOut(float t) {
        float f = t - 1.0;
        return f * f * f + 1.0;
    }

    float quadraticOut(float t) {
        return -t * (t - 2.0);
    }

    float map(float value, float min1, float max1, float min2, float max2) {
        float val = min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        return clamp(val, min2, max2);
    }

    void main() {
        vec2 uv = vUv;
        vec4 defaultColor = texture2D(uTexture, uv);

        // pixelize
        float pixelateProgress = map(uProgress, 0.1, 0.9, 0.0, 1.0);
        pixelateProgress = floor(pixelateProgress * 12.0) / 12.0;
        float s = floor(mix(8.0, 60.0, quadraticOut(pixelateProgress)));
        vec2 gridSize = vec2(s, floor(s / (1.0)));

        vec2 newUV = floor(vUv * gridSize) / gridSize + 0.5 / vec2(gridSize);
        vec4 color = texture2D(uTexture, newUV);
        float finalProgress = map(uProgress, 0.75, 1.0, 0.0, 1.0);
        color = mix(color, defaultColor, finalProgress);

        // Adjust discard condition based on sliding direction
        float slideProgress = cubicOut(uProgress);
        if (uDirection == -1.0) {
            if (vUv.x < 1.0 - slideProgress) discard;
        } else {
            if (vUv.x > slideProgress) discard;
        }

        // fill color
        vec3 fillColor = uFillColor;
        float gradWidth = mix(0.2, 0.1, uProgress);
        float customProg = map(uProgress, 0.0, 1.0, -gradWidth, 1.0 - gradWidth);

        float fillGradient;
        if (uDirection == -1.0) {
            fillGradient = smoothstep(1.0 - customProg + gradWidth, 1.0 - customProg, vUv.x);
        } else {
            fillGradient = smoothstep(customProg, customProg + gradWidth, vUv.x);
        }

        vec4 finalColor = vec4(mix(color.rgb, fillColor, fillGradient), color.a);

        gl_FragColor = finalColor;
    }
`;
