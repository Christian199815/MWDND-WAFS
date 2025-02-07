let scene, camera, renderer, mainModel;
const keysPressed = {};
const ySpeed = 0.000001;
const maxCameraY = 100;
let scrollPosition = 0;
const scrollSpeed = 0.0009;
const orbitingModels = [];
const ORBIT_RADIUS = 10;
const ORBIT_SPEED = 0.001;

const maxScrollH = -19;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0x0040f0); // soft white light
    scene.add(light);

    // Lighting
    // const light = new THREE.AmbientLight(0xffffff, 1);
    // scene.add(light);

    // Set initial camera position
    camera.position.z = 5;
    camera.position.y = 0;

    // Load main model
    loadOBJ('man.obj').then(model => {
        mainModel = model;
        mainModel.position.set(0, 0, 0);
        mainModel.rotation.set(0, 90, 0);
        mainModel.scale.set(1, 1, 1);
        scene.add(mainModel);

        // After main model is loaded, create orbiting models
        createOrbitingModels();
    });

    // Event listeners
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

// Function to create orbiting models
function createOrbitingModels() {
    // Create 3 orbiting models
    for (let i = 0; i < 20; i++) {
        loadOBJ('man.obj').then(model => {
            model.scale.set(0.5, 0.5, 0.5); // Make orbiting models smaller
            model.userData = {
                orbitAngle: (Math.PI * 1 / 3) * i, // Spread models evenly around circle
                orbitSpeed: ORBIT_SPEED,
                orbitRadius: ORBIT_RADIUS
            };
            orbitingModels.push(model);
            scene.add(model);
        });
    }
}

// Update orbiting models positions
function updateOrbitingModels() {
    orbitingModels.forEach(model => {
        model.userData.orbitAngle += model.userData.orbitSpeed;

        // Calculate new position
        const x = Math.cos(model.userData.orbitAngle) * model.userData.orbitRadius;
        const z = Math.sin(model.userData.orbitAngle) * model.userData.orbitRadius;

        model.position.set(x, 0, z);

        // Make models face the center
        model.lookAt(0, 0, 0);
    });
}

function loadOBJ(url) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.OBJLoader();
        loader.load(
            url,
            function (object) {
                resolve(object);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('Error loading model:', error);
                reject(error);
            }
        );
    });
}

function handleWheel(event) {
    event.preventDefault();
    const delta = -event.deltaY * scrollSpeed;
    const newPosition = scrollPosition + delta;

    if (newPosition >= -maxCameraY && newPosition <= 0) {
        if (scrollPosition >= maxScrollH) {
            scrollPosition = newPosition;
            updateCameraPosition();
            updateMainModelRotation();
        }
        else {
            scrollPosition = maxScrollH;
        }
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const delta = -(touch.pageY - (event.target._lastTouchY || touch.pageY)) * scrollSpeed;
    event.target._lastTouchY = touch.pageY;

    const newPosition = scrollPosition + delta;
    if (newPosition >= -maxCameraY && newPosition <= 0) {
        if (scrollPosition >= maxScrollH) {
            scrollPosition = newPosition;
            updateCameraPosition();
            updateMainModelRotation();
        }
        else {
            scrollPosition = maxScrollH;
        }
    }
}

function updateMainModelRotation() {
    if (mainModel && scrollPosition >= maxScrollH) {
        // Convert scroll position to rotation
        // Map scrollPosition from [-maxCameraY, 0] to [0, 4π] for two full rotations
        const rotationY = THREE.MathUtils.mapLinear(
            scrollPosition,
            -maxCameraY,
            0,
            Math.PI * 16,
            0
        );
        mainModel.rotation.y = rotationY;
        scrollposition = maxScrollH;
    }
}

function updateCameraPosition() {
    if (scrollPosition >= maxScrollH)
        camera.position.y = -scrollPosition;
    scrollposition = maxScrollH;
}

function animate() {
    requestAnimationFrame(animate);
    addModelAtHeight();
    updateOrbitingModels();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event) {
    keysPressed[event.which] = true;
}

function onDocumentKeyUp(event) {
    delete keysPressed[event.which];
}

function activateElement(element, bool){
    if (bool){
        document.querySelector(element).style.display = "block";}
    else{
        document.querySelector(element).style.display = "none";
    }
        
}


function addModelAtHeight() {
    let wholeScroll = Math.round(scrollPosition);
    console.log(wholeScroll);

    switch (wholeScroll) {
        case -15:
            // console.log("height of 15 achieved");
            break;
        case -2:
            // console.log("height of 2 achieved");
            break;
        case -1:
            activateElement("#contentOverlay h2", false);
            break;
        case 0:
            activateElement("#contentOverlay h2", true);
            break;

    }
}

window.onload = init;