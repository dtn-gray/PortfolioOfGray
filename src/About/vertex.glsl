uniform float time;
uniform float triScale;
uniform float progress;
uniform float mosaic;
uniform vec2 pixels;

varying vec2 vUv;
varying vec3 vNormal;

attribute vec3 center;

#include noise.glsl;

const float PI = 3.141592653589793238;

float backout(float t, float s) {
    float p = t - 1.0;
    return p * p * ((s + 1.0) * p + s) + 1.0;
}

vec3 applyTriangleScale(vec3 pos, vec3 center, float scale) {
    return (pos - center) * scale + center;
}

vec3 applyPixelation(vec3 pos, float mosaic, float progress) {
    vec3 posPixelated = floor(pos * mosaic + 0.5) / mosaic;
    return mix(pos, posPixelated, progress);
}

vec3 applyNoiseTransformation(vec3 pos, float time) {
    float noise = cnoise(vec4(pos, time * 0.3));
    
    // Rotation
    float rotation = noise * PI * 0.01;
    pos = rotate(pos, vec3(1.0, 0.0, 0.0), rotation);
    pos = rotate(pos, vec3(0.0, 1.0, 0.0), rotation);
    pos = rotate(pos, vec3(0.0, 1.0, 1.0), rotation);
    
    // Scale
    float scale = 1.0 + noise * 0.05;
    return pos * scale;
}

void main() {
    vUv = uv;
    vNormal = normal;

    vec3 pos = position;

    float transformStart = -(position.y * 0.5 + 0.5) * 4.0;
    float transformProgress = backout(clamp(progress * 5.0 + transformStart, 0.0, 1.0), 5.0);

    // Apply transformations
    pos = applyTriangleScale(pos, center, triScale);
    pos = applyPixelation(pos, mosaic, transformProgress);
    pos = applyNoiseTransformation(pos, time);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}