// Simplified PixelBlast Component for Stock Tracker PWA
// Works with CDN versions of Three.js and postprocessing

class PixelBlast {
    constructor(options = {}) {
        this.options = {
            variant: 'circle',
            pixelSize: 6,
            color: '#B19EEF',
            patternScale: 3,
            patternDensity: 1.2,
            pixelSizeJitter: 0.5,
            enableRipples: true,
            rippleSpeed: 0.4,
            rippleThickness: 0.12,
            rippleIntensityScale: 1.5,
            liquid: true,
            liquidStrength: 0.12,
            liquidRadius: 1.2,
            liquidWobbleSpeed: 5,
            speed: 0.6,
            edgeFade: 0.25,
            transparent: true,
            ...options
        };
        
        this.container = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.material = null;
        this.clock = null;
        this.uniforms = null;
        this.raf = null;
        this.clickIx = 0;
        this.timeOffset = Math.random() * 1000;
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupMaterial();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', { 
            antialias: true, 
            alpha: true 
        });
        
        if (!gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            context: gl,
            antialias: true,
            alpha: true
        });
        
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '-1';
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.clock = new THREE.Clock();
    }

    setupMaterial() {
        this.uniforms = {
            uResolution: { value: new THREE.Vector2(0, 0) },
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(this.options.color) },
            uClickPos: {
                value: Array.from({ length: 10 }, () => new THREE.Vector2(-1, -1))
            },
            uClickTimes: { value: new Float32Array(10) },
            uShapeType: { value: 1 }, // circle
            uPixelSize: { value: this.options.pixelSize },
            uScale: { value: this.options.patternScale },
            uDensity: { value: this.options.patternDensity },
            uPixelJitter: { value: this.options.pixelSizeJitter },
            uEnableRipples: { value: this.options.enableRipples ? 1 : 0 },
            uRippleSpeed: { value: this.options.rippleSpeed },
            uRippleThickness: { value: this.options.rippleThickness },
            uRippleIntensity: { value: this.options.rippleIntensityScale },
            uEdgeFade: { value: this.options.edgeFade }
        };

        const vertexShader = `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            
            uniform vec3 uColor;
            uniform vec2 uResolution;
            uniform float uTime;
            uniform float uPixelSize;
            uniform float uScale;
            uniform float uDensity;
            uniform float uPixelJitter;
            uniform int uEnableRipples;
            uniform float uRippleSpeed;
            uniform float uRippleThickness;
            uniform float uRippleIntensity;
            uniform float uEdgeFade;
            uniform int uShapeType;
            uniform vec2 uClickPos[10];
            uniform float uClickTimes[10];
            
            out vec4 fragColor;
            
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 4; i++) {
                    value += amplitude * noise(p * frequency);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                return value;
            }
            
            void main() {
                vec2 fragCoord = gl_FragCoord.xy - uResolution * 0.5;
                float aspectRatio = uResolution.x / uResolution.y;
                
                vec2 pixelId = floor(fragCoord / uPixelSize);
                vec2 pixelUV = fract(fragCoord / uPixelSize);
                
                float cellPixelSize = 8.0 * uPixelSize;
                vec2 cellId = floor(fragCoord / cellPixelSize);
                vec2 cellCoord = cellId * cellPixelSize;
                vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);
                
                float base = fbm(uv * uScale + uTime * 0.05);
                base = base * 0.5 - 0.65;
                
                float feed = base + (uDensity - 0.5) * 0.3;
                
                // Add ripple effects
                if (uEnableRipples == 1) {
                    for (int i = 0; i < 10; i++) {
                        vec2 pos = uClickPos[i];
                        if (pos.x < 0.0) continue;
                        
                        vec2 cuv = (((pos - uResolution * 0.5 - cellPixelSize * 0.5) / uResolution)) * vec2(aspectRatio, 1.0);
                        float t = max(uTime - uClickTimes[i], 0.0);
                        float r = distance(uv, cuv);
                        float waveR = uRippleSpeed * t;
                        float ring = exp(-pow((r - waveR) / uRippleThickness, 2.0));
                        float atten = exp(-t) * exp(-r * 10.0);
                        feed = max(feed, ring * atten * uRippleIntensity);
                    }
                }
                
                // Bayer dithering
                float bayer = hash(floor(fragCoord / uPixelSize)) - 0.5;
                float bw = step(0.5, feed + bayer);
                
                // Pixel jitter
                float h = hash(floor(fragCoord / uPixelSize));
                float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
                float coverage = bw * jitterScale;
                
                // Circle mask
                float M = coverage;
                if (uShapeType == 1) { // circle
                    float r = sqrt(coverage) * 0.25;
                    float d = length(pixelUV - 0.5) - r;
                    float aa = 0.5 * fwidth(d);
                    M = coverage * (1.0 - smoothstep(-aa, aa, d * 2.0));
                }
                
                // Edge fade
                if (uEdgeFade > 0.0) {
                    vec2 norm = gl_FragCoord.xy / uResolution;
                    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
                    float fade = smoothstep(0.0, uEdgeFade, edge);
                    M *= fade;
                }
                
                vec3 color = uColor;
                fragColor = vec4(color, M);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            glslVersion: THREE.GLSL3,
            depthTest: false,
            depthWrite: false
        });

        const quadGeom = new THREE.PlaneGeometry(2, 2);
        const quad = new THREE.Mesh(quadGeom, this.material);
        this.scene.add(quad);
    }

    setupEventListeners() {
        const mapToPixels = (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const scaleX = this.renderer.domElement.width / rect.width;
            const scaleY = this.renderer.domElement.height / rect.height;
            const fx = (e.clientX - rect.left) * scaleX;
            const fy = (rect.height - (e.clientY - rect.top)) * scaleY;
            return { fx, fy };
        };

        const onPointerDown = (e) => {
            const { fx, fy } = mapToPixels(e);
            this.uniforms.uClickPos.value[this.clickIx].set(fx, fy);
            this.uniforms.uClickTimes.value[this.clickIx] = this.uniforms.uTime.value;
            this.clickIx = (this.clickIx + 1) % 10;
        };

        this.renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
    }

    setSize(width, height) {
        this.renderer.setSize(width, height, false);
        this.uniforms.uResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        this.uniforms.uPixelSize.value = this.options.pixelSize * this.renderer.getPixelRatio();
    }

    animate() {
        const animate = () => {
            this.uniforms.uTime.value = this.timeOffset + this.clock.getElapsedTime() * this.options.speed;
            this.renderer.render(this.scene, this.camera);
            this.raf = requestAnimationFrame(animate);
        };
        
        this.raf = requestAnimationFrame(animate);
    }

    mount(container) {
        this.container = container;
        container.appendChild(this.renderer.domElement);
        
        const resizeObserver = new ResizeObserver(() => {
            const width = container.clientWidth || 1;
            const height = container.clientHeight || 1;
            this.setSize(width, height);
        });
        
        resizeObserver.observe(container);
        this.resizeObserver = resizeObserver;
    }

    destroy() {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.renderer.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
        
        this.material.dispose();
        this.renderer.dispose();
    }
}

// Export for use in the app
window.PixelBlast = PixelBlast;