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


var clock;
var speed = 2; //units a second
var delta = 0;

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
    CreateModelPrefab('chris/chris.obj', 'chris/texture.jpg' , {x: 0, y:-6550, z: 0}, {x: 0, y: 0, z: 0}, {x: 6000, y: 6000, z: 6000}, false, 0);

    // // loadOBJWithTexture('chris/chris.obj', 'chris/texture.jpg')
    // .then(obj => {
    //     scene.add(obj);
    //     mainModel = obj; // Store reference to main model if needed
    // })
    // .catch(error => {
    //     console.error('Error loading model:', error);
    // });

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
            obj.traverse(function(child) {
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
            CreateModelPrefab('chris/chris.obj', 'chris/texture.jpg' ,  { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 2000, y: 2000, z: 2000 }, true, i);
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

    function changeSkybox(skyboxName){
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

    function onDocumentKeyDown(event) {
        keysPressed[event.which] = true;
    }

    function onDocumentKeyUp(event) {
        delete keysPressed[event.which];
    }

    //#endregion

    // #region Dom Manipulation

     function activateElement(element, bool) {
        if (bool) {
           if(element) document.querySelector(element).style.display = "block";
        }
        else {
            if(element) document.querySelector(element).style.display = "none";
        }

    }

    async function addModelAtHeight() {
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
                await activateElement("#contentOverlay h2", false);
                break;
            case 0:
                await activateElement("#contentOverlay h2", true);
                break;

        }
    }

    function updateCameraPosition() {
        let basePosition = camStartHeight;  // Starting camera position
        camera.position.y = basePosition - (500 * scrollPosition);  // Removed the negative from scrollPosition
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // #endregion

    function animate() {
        requestAnimationFrame(animate);
        addModelAtHeight();
        updateOrbitingModels();
        delta = clock.getDelta();
        time = clock.getElapsedTime();
        if (skybox) {
            // skybox.rotation.x += 0.005;
            skybox.rotation.y += skyboxRotationSpeed * delta;
        }
        console.log(time);
        renderer.render(scene, camera);
    }

    window.onload = init;