// import { findClosestBirthday, othersData } from './fetch.js';

let scene, camera, renderer, mainModel, skyboxGeo, skybox, time;
let skyboxRotationSpeed = 0.3;                                                          // the rotation coefficient to rotate the skybox
let modelArray = [];                                                                    // the list of models we are going to push
let scrollPosition = 0;                                                                 // the scroll position we are going to start from
let confettiTriggered = false;                                                          // check to let the confetti run, until true

                                                               
const ySpeed = 0.000001;                                                                // the speed coefficient for the y position
const maxCameraY = 100;                                                                 // maximum y-position for the camera
const scrollSpeed = 0.0009;                                                             // speed of the scroll movement
const orbitingModels = [];                                                              // the list of models that are going to be orbitting
const ORBIT_RADIUS = 5000;                                                              // the radius of the orbit for the models that will orbit
const ORBIT_SPEED = 0.001;                                                              // the speed coefficient for the orbitting models
const maxScrollH = -23;                                                                 // max scroll height for the user
const skyboxes = ["/mountains/arid2", "/night/divine", "/transition/kenon_cloudbox"];   // list of the skybox names
const skyboxSize = 13000;                                                               // the size of the cube/skybox so we can stand/float in it 
const camStartHeight = -6000;                                                           // the physical height of the camera it starts at

const CAMERA_ORBIT_RADIUS = 5000;                                                       // radius of the camera orbital rotation
const CAMERA_ORBIT_SPEED = 0.5;                                                         // speed of camera orbital rotation
let cameraOrbitAngle = 0;                                                               // Current angle of camera orbit

var clock;                                                                              // initaite a clock variable for easy acces
var speed = 2;                                                                          // store the speed (units a second)
var delta = 0;                                                                          // store the delta for easy accesing

let zoomLevel = 5000;                                                                   // zooming level start value
const MIN_ZOOM = 5000;                                                                  // minimal zooming level
const MAX_ZOOM = 9000;                                                                  // maximal zooming distance
const ZOOM_SPEED_MULTIPLIER = 3.5;                                                      // Zooming multiplier for speeding up the zoom factor
let wholeScroll                                                                         // clamped value for where we are with scrolling
let zoomHeight = -21;                                                                   // height in wholeScroll to start zooming on

// The start function that initiates all working variables
// most of the needed THREE js objects get loaded here
function init() {
    scene = new THREE.Scene();                                                          // scene setup
    camera = new THREE.PerspectiveCamera(                                               // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        55,
        window.innerWidth / window.innerHeight,
        70,
        30000
    );
    camera.position.set(2500, camStartHeight, 2500);                                    // set the position of the camera to the center of the skyox
    camera.rotation.set(0, 95, 0);                                                      // rotate the camera by 95 degrees

    renderer = new THREE.WebGLRenderer({ antialias: true });                            // setup the renderer, with anti aliassing
    renderer.setSize(window.innerWidth, window.innerHeight);                            // set the renderer  size to size of the viewport
    renderer.domElement.id = "canvas";                                                  // give the renderer the id of 'canvas'
    document.body.appendChild(renderer.domElement);                                     // add the renderer to the html

    const light = new THREE.AmbientLight(0xffffff);                                     // create a soft white light 
    scene.add(light);                                                                   // add the light to the scene

    changeSkybox(skyboxes[1]);                                                          // run the skybox function so the images get loaded on to the skybox

    clock = new THREE.Clock();                                                          // attach the THREE clock attribute to the stored value

    // Load main model
    CreateModelPrefab('chris/chris.obj', 'chris/texture.jpg', { x: 0, y: -6550, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 6000, y: 6000, z: 6000 }, false, 0); //run the create model function

    createOrbitingModels();                                                             // create the models that are going to be orbitting around the main model

    window.addEventListener('wheel', handleWheel, { passive: false });                  // add an event listener to the window, that checks the scrolling and runs the 'handleWheel' function
    window.addEventListener('touchmove', handleTouchMove, { passive: false });          // add an event listener to the window, that checks the touching move and runs the 'handleTouchMove' function
    window.addEventListener('resize', onWindowResize, false);                           // add an event listener to the window, that checks the resizing and runs the 'onWindowResize' function

    // Start animation loop
    animate();  
}

// #region Model Loading

// Load Obj and texture from file and put them together
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

//general function to create the model for the big one and for the orbitting ones
// parameters: path of model, path of the texture, position values, rotation values, scale values, bool if its an orbitting model and the index for the for loop
function CreateModelPrefab(modelPath, texturePath, pos, rot, scale, isOrbitting, i) {
    if (texturePath) {
        if (isOrbitting) {
            loadOBJWithTexture(modelPath, texturePath).then(model => {
                model.scale.set(scale.x, scale.y, scale.z);
                model.userData = {
                    orbitAngle: (Math.PI * 1 / 3) * i, 
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
                mainModel = model;
            }).catch(error => {
                console.error('Error creating main model:', error);
            });
        }
    } else {
        console.warn('No texture path provided for model:', modelPath);
    }
}

// Rotate the object by scrolling, also set the scrolling always to the max scroll height
function updateMainModelRotation() {
    if (mainModel && scrollPosition >= maxScrollH) {
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

// function to create the models, inside the creation function the models get loaded in to the array
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

        // Calculate new position, see the orbit as a radius or circle
        // the circle is a on 2 axis, here they are x and z
        // with Sinus and Cosinus i can do the math to calculate the point on the circle
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

// handle scroll wheel for external mouses
function handleWheel(event) {
    event.preventDefault();
    const delta = -event.deltaY * scrollSpeed;
    const newPosition = scrollPosition + delta;

    if (newPosition >= -maxCameraY && newPosition <= 0) {
        if (scrollPosition >= maxScrollH) {
            scrollPosition = newPosition;
            // Update orbit angle based on scroll
            cameraOrbitAngle += CAMERA_ORBIT_SPEED * delta;
            // updateCameraPosition();
        } else {
            scrollPosition = maxScrollH;
        }
    }
}

// Update your handleTouchMove function similarly as the handleWheel
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
            // updateCameraPosition();
        } else {
            scrollPosition = maxScrollH;
        }
    }
}


//#endregion

// #region Dom Manipulation

// Define the sections and their activation ranges
// minScroll to maxScroll is the height where the section will be visible
const sections = [
    { selector: 'header', minScroll: 0, maxScroll: 0 },
    { selector: 'section:nth-of-type(1)', minScroll: -3, maxScroll: -1 },
    { selector: 'section:nth-of-type(2)', minScroll: -9, maxScroll: -5 },
    { selector: 'section:nth-of-type(3)', minScroll: -15, maxScroll: -11 },
    { selector: 'section:nth-of-type(4)', minScroll: -19, maxScroll: -17 },
    { selector: 'section:nth-of-type(5)', minScroll: -23, maxScroll: -20 }
];

// (un)hiding of the sections from above
function activateElement(element, bool) {
    // check if the element excists in the html
    const targetElement = document.querySelector(element);
    if (!targetElement) {
        console.warn(`Element "${element}" not found`);
        return;
    }

    // Set initial opacity based on scroll position or focus state
    // this is where the magic happens
    if (!targetElement.dataset.hasFocus) {
        targetElement.style.opacity = bool ? 1 : 0;
    }
    
    // this part is specific for the screenreaders
    // if the user tabs through the different elements, the section can apear if the element is in that specific section.
    if (!targetElement.dataset.listenersAdded) {
        // Add focus and blur event listeners to all focusable elements within the section
        const focusableElements = targetElement.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]), h2, p, li, img');
        
        focusableElements.forEach(el => {
            el.addEventListener('focus', () => {
                targetElement.dataset.hasFocus = 'true';
                targetElement.style.opacity = 1;
            });
            
            el.addEventListener('blur', (event) => {
                // Check if the next focused element is still within the same section
                const relatedTarget = event.relatedTarget;
                const isStillWithinSection = targetElement.contains(relatedTarget);
                
                if (!isStillWithinSection) {
                    targetElement.dataset.hasFocus = 'false';
                    const section = sections.find(s => s.selector === element);
                    if (section && (wholeScroll < section.minScroll || wholeScroll > section.maxScroll)) {
                        targetElement.style.opacity = 0;
                    }
                }
            });
        });
        
        targetElement.dataset.listenersAdded = 'true';
    }
}

// function to trigger the confetti when the date from the birthdate section
// is the same as today
function checkBirthdayAndTriggerConfetti() {
    // If confetti already triggered, don't do it again
    if (confettiTriggered) return;
    
    // Get the closest birthday data
    const closest = window.findClosestBirthday(window.othersData);
    
    if (!closest.birthdate) return;
    
    // Create Date objects
    const today = new Date();
    const birthday = new Date(closest.birthdate);
    
    // Compare month and day
    const isSameDay = today.getDate() === birthday.getDate() && 
                     today.getMonth() === birthday.getMonth();
    
    // If it's their birthday, trigger confetti
    if (isSameDay && window.confettiManager) {
        window.confettiManager.addConfetti({
            confettiesNumber: 500,
            confettiColors: [
                "#fcf403", "#62fc03", "#f4fc03", "#03e7fc", 
                "#03fca5", "#a503fc", "#fc03ad", "#fc03c2"
            ]
        });
        confettiTriggered = true;
    }
}

// this function checks the scrollheight
// if the height corresponds with either the minHeight or the max height of an item from the sections array
// well then the activateElement function runs
// also theres an if statement to check if the last section is in range well than the birthdate function will run to check the date
function addModelAtHeight() {
    const wholeScroll = Math.round(scrollPosition);
    
    // Check each section's range and activate/deactivate accordingly
    sections.forEach(section => {
        const isInRange = wholeScroll >= section.minScroll && wholeScroll <= section.maxScroll;
        activateElement(section.selector, isInRange);
        
        // If we're in the last section (birthday section), check birthday and maybe trigger confetti
        if (section.selector === 'section:nth-of-type(5)' && isInRange) {
            checkBirthdayAndTriggerConfetti();
        }
    });
}

//zoom the camera based on the scrolling
function zoomBasedOnScroll() {
    // Calculate zoom percentage based on how much we've scrolled past -20
    const additionalScroll = Math.abs(scrollPosition - (-20));
    
    // Adjust the divisor to make the zoom more dramatic (smaller number = faster zoom)
    const zoomPercentage = Math.min(additionalScroll / 4, 1);
    
    // Make the zoom range larger: start at CAMERA_ORBIT_RADIUS (5000) and zoom in to 1000
    zoomLevel = CAMERA_ORBIT_RADIUS - ((CAMERA_ORBIT_RADIUS - 1000) * zoomPercentage);
    
    
    // Get the current orbital position
    const x = Math.cos(cameraOrbitAngle) * zoomLevel;
    const z = Math.sin(cameraOrbitAngle) * zoomLevel;
    const y = camera.position.y;
    
    // Update camera position
    camera.position.set(x, y, z);
    camera.lookAt(0, y, 0);
}

//change the height of the camera based on the scrolling
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

//change the canvas based on the window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// #endregion

// update function
function animate() {
    requestAnimationFrame(animate);
    updateOrbitingModels();
    delta = clock.getDelta();
    time = clock.getElapsedTime();

    wholeScroll = Math.round(scrollPosition);  
    if (skybox) {
        skybox.rotation.y += skyboxRotationSpeed * delta;
    }

    if (time > 1.2) {
        addModelAtHeight();
    }

    if(wholeScroll < zoomHeight){
        zoomBasedOnScroll();
    } else if (wholeScroll >= zoomHeight) {  // Added else if to make it exclusive
        updateCameraPosition();
    }

    renderer.render(scene, camera);
}

window.onload = init;



// Ik heb gebruik gemaakt van de volgende websites/tutorials om een beter beeld te kunnen krijgen:

//Voor de CreatePathString & createMaterialArray functies
// https://codinhood.com/post/create-skybox-with-threejs/

// Voor verschillende functies heb ik ai gebruikt om de basis te zetten in de juiste richting
// Claude.AI

//Mijn  claude prompts:
// i want to rotate the model according to the scroll.
// i also want to add more models to the scene that in time will orbit arround the model

// create a function that zooms the camera towards the object it looksAt based on the scrolling
// the zoom function should only work when the height scrolling of the camera is not working

// section:nth-of-type(even) but not section:last-of-type

// move three.js camera on scroll

// how do i convert a float like 0,01 to 0 and when its 0.6 its a 1

// Voor het klaarmaken van de OBJ models
// https://threejs.org/docs/index.html#api/en/loaders/OBJLoader

// voor de confetti
// https://codepen.io/robleto/pen/QwLBEmp

// voor het gebruik van regions
//https://stackoverflow.com/questions/7519856/regions-in-css-like-c-sharp-regions

