varying float vPattern;
uniform vec3 uColor;

void main() {
    float brightness = clamp(vPattern * 1.5, 0.0, 1.0);
    vec3 color = vec3(brightness) * uColor;
    csm_DiffuseColor = vec4(color, 1.0);
}