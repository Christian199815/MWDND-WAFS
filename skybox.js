import {scene, skybox, skyboxGeo} from "./main.js";

let skyboxSize = 13000;


export function changeSkybox(skyboxName) {
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