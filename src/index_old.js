import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const canvas = document.getElementById("webgl")
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.pixelRatio = window.devicePixelRatio
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 10

const controls = new OrbitControls(camera, canvas)

const planeGeo = new THREE.PlaneGeometry(10, 10, 20, 20)
planeGeo.rotateX(Math.PI / 2)
const norMat = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide,
    wireframe: true
})
const planeMesh = new THREE.Mesh(planeGeo, norMat)
scene.add(planeMesh)


const sphereGeo = new THREE.SphereGeometry(.1)
const sphereMesh = new THREE.Mesh(sphereGeo, norMat)
scene.add(sphereMesh)

const planeVertPos = planeGeo.attributes.position

for (let i = 0; i < planeVertPos.array.length; i += 3) {
    const x = planeVertPos.array[i];
    const y = planeVertPos.array[i + 1];
    const z = planeVertPos.array[i + 2];
    const vector3 = new THREE.Vector3(x, y, z);
    // console.log(vector3)
    const test = sphereMesh.clone()
    test.position.copy(vector3)
    scene.add(test)
}


const tick = () => {
    renderer.render(scene, camera)
    controls.update()


    // Modify the vertices to simulate a sphere
    const time = Date.now() * 0.001;
    const amplitude = 1;
    const frequency = 0.5;

    for (let i = 0; i < planeVertPos.array.length; i += 3) {
        const x = planeVertPos.array[i];
        const y = planeVertPos.array[i + 1];
        const z = planeVertPos.array[i + 2];
        const vector3 = new THREE.Vector3(x, y, z);

        console.log(vector3)
        const vertex = planeVertPos.array[i];
        const offset = amplitude * Math.sin(frequency * i + time);
        vertex.z = offset;
    }

    // Ensure the geometry updates
    // planeGeo. = true;

    window.requestAnimationFrame(tick)

}

console.log("Done")
tick()

