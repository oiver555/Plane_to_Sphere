import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; 
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import GUI from "lil-gui";

const renderer = new THREE.WebGLRenderer();
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10, 25);

const controls = new OrbitControls(camera, renderer.domElement)

const scene = new THREE.Scene();

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const normalMat = new THREE.MeshNormalMaterial({ wireframe: false, side: THREE.DoubleSide, transparent: true })

//BUFFER Plane
const planeGeometry = new THREE.BufferGeometry();
const planeIndices = [];
const planeVertices = [];
const planeNormals = [];

const planeSize = 25;
const segements = 300
const planeSegments = segements;
const halfSize = planeSize / 2;
const planeSegmentSize = planeSize / planeSegments;

// Generate Vertices and Normals for a simple grid geometry
for (let i = 0; i <= planeSegments; i++) {

    const y = (i * planeSegmentSize) - halfSize;

    for (let j = 0; j <= planeSegments; j++) {

        const x = (j * planeSegmentSize) - halfSize;

        planeVertices.push(x, - y, 0);
        planeNormals.push(0, 0, 1);

        // const r = (x / planeSize) + 0.5;
        // const g = (y / planeSize) + 0.5;

        // _color.setRGB(r, g, 1, THREE.SRGBColorSpace);

        // colors.push(_color.r, _color.g, _color.b);

    }

}

// generate indices (data for element array buffer)
for (let i = 0; i < planeSegments; i++) {

    for (let j = 0; j < planeSegments; j++) {

        const a = i * (planeSegments + 1) + (j + 1);
        const b = i * (planeSegments + 1) + j;
        const c = (i + 1) * (planeSegments + 1) + j;
        const d = (i + 1) * (planeSegments + 1) + (j + 1);

        // generate two faces (triangles) per iteration

        planeIndices.push(a, b, d); // face one
        planeIndices.push(b, c, d); // face two
    }
}

planeGeometry.setIndex(planeIndices);
planeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(planeVertices, 3));
planeGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(planeNormals, 3));
planeGeometry.rotateX(Math.PI / -2)

const sphereGeo = new THREE.SphereGeometry(5, segements, segements)

// Transform plane to sphere by
// creating a sphere with the same amount of vertices as the plane
// passing the vertex pos of the sphere into the vertex shader of the plane
// then mix the pos of the sphere with pos of the plane
const rawMaterial = new THREE.RawShaderMaterial({

    uniforms: {
        time: {
            value: 0.0
        },
        u_time: {
            value: 0.0
        },
        u_speed: {
            value: .3
        },
        u_intensity: {
            value: 0.15
        },
        u_partical_size: {
            value: .1
        },
        u_sphere_vertices: {
            value: sphereGeo.attributes.position.array,
        },
        u_interpolate: {
            value: 1.0,
        },
        // u_color_a: {
        //     value: new THREE.Color(colorA)
        // },
        // u_color_b: {
        //     value: new THREE.Color(colorB)
        // }
    },
    vertexShader: `       
  vec3 mod289(vec3 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x)
  {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  // Classic Perlin noise
  float cnoise(vec3 P)
  {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

    precision mediump float;
    precision mediump int;

    uniform mat4 modelViewMatrix; // optional
    uniform mat4 projectionMatrix; // optional
    uniform float time;
    uniform vec3 u_sphere_vertices;
    attribute vec3 position;
    attribute vec4 color;
    attribute vec3 spherePos;

    varying vec3 vPosition;
    varying vec4 vColor;
    
    uniform float u_time;
    uniform float u_speed;
    uniform float u_intensity;
    uniform float u_partical_size;
    uniform float u_interpolate;
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform vec3 u_color_a;
    varying vec2 v_uv;
    varying float v_displacement;
    
    void main()	{

        //Interpolate between the Plane Vertices and the Sphere Vertices 
        vec3 interpPos = mix(position, spherePos, u_interpolate );
        
        v_displacement = cnoise(interpPos + vec3(time * u_speed));
        v_displacement = v_displacement * u_intensity;
        vec3 interNoisePos = interpPos +  (v_displacement);
        

        vec4 modelPosition = modelMatrix * vec4(interNoisePos, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;     

        gl_Position = projectedPosition;
        gl_PointSize = u_partical_size * (1.0 / - viewPosition.z);
        }`,

    fragmentShader: `    
        precision mediump float;
        precision mediump int;

        uniform float time;

        varying vec3 vPosition;
        varying vec4 vColor;

        void main()	{

            // vec4 color = vec4( vColor);
            // color.r += sin( vPosition.y * 10.0 + time ) * 1.0;
            gl_FragColor = vec4(1.0, .5, 0.0, .5);
        }`,
    side: THREE.DoubleSide,
    transparent: true,
    wireframe: true
})

const planeMesh = new THREE.Mesh(planeGeometry, rawMaterial)
const clonePlaneMesh = planeMesh.clone()
clonePlaneMesh.material = normalMat
const points = new THREE.Points(planeGeometry, rawMaterial);
scene.add(clonePlaneMesh)
scene.add(points)

//SPHERE
sphereGeo.translate(0.0, -10.0, 0.0)
const sphereMesh = new THREE.Mesh(sphereGeo, normalMat)
scene.add(sphereMesh)

//Add Sphere POS to Plane POS
planeGeometry.setAttribute("spherePos", sphereGeo.attributes.position)

const gui = new GUI()
gui.add(rawMaterial.uniforms.u_speed, "value").min(0).max(1).step(.01).name("speed")
gui.add(rawMaterial.uniforms.u_intensity, "value").min(0).max(1).step(.01).name("intensity")
gui.add(rawMaterial.uniforms.u_partical_size, "value").min(0).max(100).step(.01).name("point size")
gui.add(rawMaterial.uniforms.u_interpolate, "value").min(0).max(1).step(.001).name("interpolate")
gui.add(normalMat, "opacity").min(0).max(1).step(.001).name("Normal Material Opacity")

const handleResize = () => {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
};
handleResize();

window.addEventListener("resize", handleResize);

renderer.setAnimationLoop((timestamp) => {
    // time.value = timestamp / 1000;

    const time = performance.now();
    planeMesh.material.uniforms.time.value = time * 0.005;
    renderer.render(scene, camera);
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    controls.update()
});
