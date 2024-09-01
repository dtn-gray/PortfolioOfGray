uniform float time;
uniform float progress;
uniform sampler2D texture1;
varying vec3 vNormal;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;

// Light direction (you can adjust this if needed)
const vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.75));

void main() {
    // Normalize the interpolated normal
    vec3 normal = normalize(vNormal);

    // Calculate the diffuse light intensity
    float lightIntensity = max(dot(normal, lightDirection), 0.0);

    // Apply the light intensity to the solid red color
    vec3 color = vec3(0.74, 0.03, 0.03) * lightIntensity;

    // Set the fragment color with shadows and depth effects
    gl_FragColor = vec4(color, 1.0);
}
