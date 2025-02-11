let scene, camera, renderer, mainModel, skyboxGeo, skybox;
let skyboxRotationSpeed = 0.3;
let modelArray = [];
let scrollPosition = 0;

const keysPressed = {};
const ySpeed = 0.000001;
const maxCameraY = 100;
const scrollSpeed = 0.0009;
const orbitingModels = [];
const ORBIT_RADIUS = 5000;
const ORBIT_SPEED = 0.001;
const maxScrollH = -24;
const skyboxes = ["/mountains/arid2", "/night/divine", "/transition/kenon_cloudbox"];
const skyboxSize = 13000;
const camStartHeight = -6000;

const CAMERA_ORBIT_RADIUS = 5000; // Distance from center
const CAMERA_ORBIT_SPEED = 0.5; // Speed of orbital rotation
let cameraOrbitAngle = 0; // Current angle of camera orbit

var clock;
var speed = 2; //units a second
var delta = 0;

let domLoaded;


let zoomLevel = 5000;
const MIN_ZOOM = 5000;   // Very close
const MAX_ZOOM = 7000;   // Starting distance
const ZOOM_SPEED_MULTIPLIER = 3.5;  
let wholeScroll 



function init() {
    // Scene setup
    scene = new THREE.Scene();
    // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        70,
        30000
    );
    camera.position.set(2500, camStartHeight, 2500);
    camera.rotation.set(0, 95, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "canvas";
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff); // soft white light
    scene.add(light);

    changeSkybox(skyboxes[0]);

    clock = new THREE.Clock();

    // Load main model
    CreateModelPrefab('chris/chris.obj', 'chris/texture.jpg', { x: 0, y: -6550, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 6000, y: 6000, z: 6000 }, false, 0);

    createOrbitingModels();

    // Event listeners
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

// #region Model Loading
function loadOBJWithTexture(objUrl, textureUrl) {
    return new Promise((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader();
        const loader = new THREE.OBJLoader();

        Promise.all([
            new Promise((texResolve, texReject) => {
                textureLoader.load(
                    textureUrl,
                    texture => texResolve(texture),
                    undefined,
                    error => texReject(error)
                );
            }),
            new Promise((objResolve, objReject) => {
                loader.load(
                    objUrl,
                    object => objResolve(object),
                    xhr => {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    error => {
                        console.error('Error loading model:', error);
                        objReject(error);
                    }
                );
            })
        ])
            .then(([texture, obj]) => {
                obj.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.map = texture;
                        child.geometry.computeVertexNormals();
                    }
                });

                resolve(obj);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function CreateModelPrefab(modelPath, texturePath, pos, rot, scale, isOrbitting, i) {
    if (texturePath) {
        if (isOrbitting) {
            loadOBJWithTexture(modelPath, texturePath).then(model => {
                model.scale.set(scale.x, scale.y, scale.z);
                model.userData = {
                    orbitAngle: (Math.PI * 1 / 3) * i, // Spread models evenly around circle
                    orbitSpeed: ORBIT_SPEED,
                    orbitRadius: ORBIT_RADIUS
                };
                orbitingModels.push(model);
                scene.add(model);
            }).catch(error => {
                console.error('Error creating orbiting model:', error);
            });
        }
        else {
            loadOBJWithTexture(modelPath, texturePath).then(model => {
                model.position.set(pos.x, pos.y, pos.z);
                model.rotation.set(rot.x, rot.y, rot.z);
                model.scale.set(scale.x, scale.y, scale.z);
                scene.add(model);
                modelArray.push(model);
                mainModel = model; // Store reference if this is the main model
            }).catch(error => {
                console.error('Error creating main model:', error);
            });
        }
    } else {
        console.warn('No texture path provided for model:', modelPath);
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
            Math.PI * 40,
            0
        );
        mainModel.rotation.y = rotationY;
        scrollposition = maxScrollH;
    }
}
//#endregion

// #region Orbitting Models


function createOrbitingModels() {
    // Create 3 orbiting models
    for (let i = 0; i < 8; i++) {
        CreateModelPrefab('chris/chris.obj', 'chris/texture.jpg', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 2000, y: 2000, z: 2000 }, true, i);
    }
}

// Update orbiting models positions
function updateOrbitingModels() {
    orbitingModels.forEach(model => {
        model.userData.orbitAngle += model.userData.orbitSpeed;

        // Calculate new position
        const x = Math.cos(model.userData.orbitAngle) * model.userData.orbitRadius;
        const z = Math.sin(model.userData.orbitAngle) * model.userData.orbitRadius;

        model.position.set(x, -1500, z);

        // Make models face the center
        model.lookAt(0, 0, 0);
    });
}

// #endregion

// #region Skybox

function changeSkybox(skyboxName) {
    scene.remove(skybox);
    let materialArray = createMaterialArray(skyboxName);
    skyboxGeo = new THREE.BoxGeometry(skyboxSize, skyboxSize, skyboxSize);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    skybox.position.set(0, 0, 0);
    scene.add(skybox);
}

function createPathStrings(filename) {
    const basePath = "./skybox/";
    const baseFilename = basePath + filename;
    const fileType = ".jpg"; // Changed to .jpg to match your files
    const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStrings = sides.map((side) => {
        return baseFilename + "_" + side + fileType;
    });
    return pathStrings;
}

function createMaterialArray(filename) {
    const skyboxImagepaths = createPathStrings(filename);
    const materialArray = skyboxImagepaths.map((image) => {
        let texture = new THREE.TextureLoader().load(image);
        return new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
        });
    });
    return materialArray;
}


// #endregion

//#region Input Handling
function handleWheel(event) {
    event.preventDefault();
    const delta = -event.deltaY * scrollSpeed;
    const newPosition = scrollPosition + delta;

    if (newPosition >= -maxCameraY && newPosition <= 0) {
        if (scrollPosition >= maxScrollH) {
            scrollPosition = newPosition;
            // Update orbit angle based on scroll
            cameraOrbitAngle += CAMERA_ORBIT_SPEED * delta;
            updateCameraPosition();
        } else {
            scrollPosition = maxScrollH;
        }
    }
}

// Update your handleTouchMove function similarly
function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const delta = -(touch.pageY - (event.target._lastTouchY || touch.pageY)) * scrollSpeed;
    event.target._lastTouchY = touch.pageY;

    const newPosition = scrollPosition + delta;
    if (newPosition >= -maxCameraY && newPosition <= 0) {
        if (scrollPosition >= maxScrollH) {
            scrollPosition = newPosition;
            // Update orbit angle based on touch movement
            cameraOrbitAngle += CAMERA_ORBIT_SPEED * delta;
            updateCameraPosition();
        } else {
            scrollPosition = maxScrollH;
        }
    }
}

function onDocumentKeyDown(event) {
    keysPressed[event.which] = true;
}

function onDocumentKeyUp(event) {
    delete keysPressed[event.which];
}

//#endregion

// #region Dom Manipulation

function activateElement(element, bool) {

    const targetElement = document.querySelector(element);
    if (!targetElement) {
        console.warn(`Element "${element}" not found`);
        return;
    }

    targetElement.style.display = bool ? "flex" : "none";
}

function addModelAtHeight() {
    wholeScroll = Math.round(scrollPosition);
    console.log("Current scroll position:", wholeScroll);

    switch (wholeScroll) {

        case -20:
            activateElement('section:nth-of-type(3)', false);
            break;

        case -19:
            activateElement('section:nth-of-type(3)', true);
            break;

        case -17:
            activateElement('section:nth-of-type(3)', true);
            break;

        case -16:
            activateElement('section:nth-of-type(3)', false);
            break;



        case -15:
            break;

        case -14:
            activateElement('section:nth-of-type(2)', false);
            break;

        case -12:
            activateElement('section:nth-of-type(2)', true);
            break;

        case -10:
            activateElement('section:nth-of-type(2)', false);
            break;



        case -6:
            activateElement('section:nth-of-type(1)', false);
            break;
        case -3:
            activateElement('section:nth-of-type(1)', true);
            break;
        case -1:
            activateElement('section:nth-of-type(1)', false);
            activateElement('header', false);
            break;
        case 0:
            activateElement('header', true);
            break;
    }
}

function zoomBasedOnScroll() {
    // Calculate zoom percentage based on scroll position
    // scrollPosition goes from 0 to -maxCameraY
    const scrollPercentage = Math.abs(scrollPosition) / maxCameraY;
    
    // Interpolate between MIN_ZOOM and MAX_ZOOM
    zoomLevel = MIN_ZOOM + (MAX_ZOOM - MIN_ZOOM) * scrollPercentage * ZOOM_SPEED_MULTIPLIER;
    
    camera.position.setLength(zoomLevel);
    camera.lookAt(0, camera.position.y, 0);
}

function updateCameraPosition() {
    // Calculate orbital position
    const x = Math.cos(cameraOrbitAngle) * CAMERA_ORBIT_RADIUS;
    const z = Math.sin(cameraOrbitAngle) * CAMERA_ORBIT_RADIUS;

    // Calculate height based on scroll
    let basePosition = camStartHeight;
    const y = basePosition - (500 * scrollPosition);

    // Update camera position
    camera.position.set(x, y, z);

    // Make camera look at the center point (where the main model is)
    camera.lookAt(0, y, 0);// Look at the main model's position
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// #endregion
let time;
function animate() {
    requestAnimationFrame(animate);
    updateOrbitingModels();
    delta = clock.getDelta();
    time = clock.getElapsedTime();
    if (skybox) {
        // skybox.rotation.x += 0.005;
        skybox.rotation.y += skyboxRotationSpeed * delta;
    }

    if (time > 1.2) {
        addModelAtHeight(scrollPosition);
        // addModelAtHeight();

    }

    if(wholeScroll <= -20){
        zoomBasedOnScroll();
    }
    else {
        updateCameraPosition();
    }


    // console.log(time);
    renderer.render(scene, camera);
}

window.onload = init;



// Ik heb gebruik gemaakt van de volgende websites/tutorials om een beter beeld te kunnen krijgen:

//Voor de CreatePathString & createMaterialArray functies
// https://codinhood.com/post/create-skybox-with-threejs/

// Voor de handleWheel & handleTouchMove functies
// Claude.AI

// Voor het klaarmaken van de OBJ models
// https://threejs.org/docs/index.html#api/en/loaders/OBJLoader

