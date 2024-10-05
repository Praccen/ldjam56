import * as ENGINE from "../../dist/Engine.esm.js"
import { vec3, mat4 } from "../../dist/Engine.esm.js";
import { Input } from "./Input.js"

// Create a renderer and attach it to the document body
let renderer = new ENGINE.Renderer();
document.body.appendChild(renderer.domElement);

// Set a skybox for the renderer
renderer.setSkybox("Assets/Skybox");
renderer.useVolumetric = true;

// Create a GUI renderer and attach it to the document body
let guiRenderer = new ENGINE.GUIRenderer();
document.body.appendChild(guiRenderer.domElement);

// Set the class to apply style defined in index.css
guiRenderer.domElement.className = "guiContainer";

// Create a scene. It will automatically have a directional light, so let's set the ambient multiplier for it.
let scene = new ENGINE.Scene();
scene.getDirectionalLight().ambientMultiplier = 0.2;
// vec3.zero(scene.getDirectionalLight().colour);

// Create a camera and set it's starting position
let camera = new ENGINE.Camera();
camera.setPosition(vec3.fromValues(0.0, 0.0, 2.0));

let pitch = 0.0;
let jaw = 180.0;

// Create a stretched dark grey cube as a floor so that we can see the beautiful shadows
let floorBox = scene.addNewMesh("Assets/cube.obj", "CSS:rgb(50,50,50)", "CSS:rgb(100,100,100)");
floorBox.transform.translate(vec3.fromValues(0.0, -2.0, 0.0)); // Move the floor down
vec3.set(floorBox.transform.scale, 20.0, 1.0, 20.0); // Scale it along x and z

// Create a floating yellow cube, with limited shininess
let box = scene.addNewMesh("Assets/cube.obj", "CSS:rgb(255,255,0)", "CSS:rgb(50,50,50)");
// box.emissionColor = vec3.fromValues(0.5, 0.5, 0.0); // Optional, make it glow in the dark

// Create another floating red cube, again with limited shininess
let box2 = scene.addNewMesh("Assets/cube.obj", "CSS:rgb(255,0,0)", "CSS:rgb(50,50,50)");
box2.transform.translate(vec3.fromValues(0.0, 5.0, 0.0)); // Move it up in the air

// Add a particle spawner shooting particles out of the cube
let numParticles = 1000;
let particleSpawner = scene.addNewParticleSpawner("Assets/water.png", numParticles);
particleSpawner.lifeTime = 0.5;
particleSpawner.sizeChangePerSecond = -0.1;
particleSpawner.fadePerSecond = 2.0;
for (let i = 0; i < numParticles; i++) {
    let randomVel = vec3.fromValues((Math.random() - 0.5) * 3.0, 8.0 + Math.random() * 5.0, (Math.random() - 0.5) * 3.0);
    particleSpawner.setParticleData(i, vec3.fromValues(0.0, 0.5, 0.0), 0.2, randomVel, vec3.fromValues(0.0, -9.82, 0.0), (i * particleSpawner.lifeTime) / numParticles);
}

// Add a point light diagonally above the floating cubes
let pointLight = scene.addNewPointLight();
pointLight.castShadow = true; // Allow it to create shadows
vec3.set(pointLight.position, 2.0, 3.0, 2.0);
vec3.set(pointLight.colour, 0.2, 0.05, 0.0);

// Add an FPS display
let fpsDisplay = guiRenderer.getNew2DText();
fpsDisplay.position[0] = 0.95;
fpsDisplay.getElement().style.color = "lime";
fpsDisplay.textString = "0";

// Add a 2D text that sits in the top middle of the game window
let testText = guiRenderer.getNew2DText();
testText.textString = "2D Test Text";
testText.position[0] = 0.5;
testText.position[1] = 0.2;
testText.center = true; // Make the position related to the middle of the text

// Add a 3D text at the position of the point light source
let testText3D = guiRenderer.getNew3DText();
testText3D.textString = "3D Test Text @ point light";
testText3D.position = pointLight.position;
testText3D.center = true;
testText3D.getElement().style.color = "rgb(255, 0, 255)"; // Let's make it pink!

// Add a reset button at the top left of the game window
let resetButton = guiRenderer.getNewButton();
resetButton.textString = "Reset";
// Make it reset our camera when we press it
resetButton.onClick(function () {
    camera.setPosition(ENGINE.vec3.fromValues(0.0, 0.0, 2.0));
    pitch = 0.0;
    jaw = 180.0;
});

// Add a checkbox for volumetric lighting
let volumetricLightingCheckbox = guiRenderer.getNewCheckbox();
volumetricLightingCheckbox.position[0] = 0.05;
volumetricLightingCheckbox.position[1] = 0.75;
volumetricLightingCheckbox.textString = "Volumetric Lighting ";
volumetricLightingCheckbox.getInputElement().checked = true;


// Add a checkbox for point shadows
let pointShadowsCheckbox = guiRenderer.getNewCheckbox();
pointShadowsCheckbox.position[0] = 0.05;
pointShadowsCheckbox.position[1] = 0.8;
pointShadowsCheckbox.textString = "Point shadows ";
pointShadowsCheckbox.getInputElement().checked = true;

// Add a slider for sensitivity
let sensitivity = 1.0;
let sensitivitySlider = guiRenderer.getNewSlider();
sensitivitySlider.position[0] = 0.05;
sensitivitySlider.position[1] = 0.85;
sensitivitySlider.textString = "Sensitivity ";
sensitivitySlider.getInputElement().min = "1";
sensitivitySlider.getInputElement().max = "100";

// Add a slider for fog density
let densitySlider = guiRenderer.getNewSlider();
densitySlider.position[0] = 0.05;
densitySlider.position[1] = 0.9;
densitySlider.textString = "Fog density ";
densitySlider.getInputElement().min = "0";
densitySlider.getInputElement().max = "50";
densitySlider.getInputElement().value = "20";

// Physics scene
let physicsScene = new ENGINE.PhysicsScene();
let frictionCoefficient = 0.8; 

let floorBoxPhysicsObj = physicsScene.addNewPhysicsObject(floorBox.transform);
floorBoxPhysicsObj.isStatic = true;
floorBoxPhysicsObj.frictionCoefficient = frictionCoefficient;

let boxPhysicsObj = physicsScene.addNewPhysicsObject(box.transform);
vec3.set(boxPhysicsObj.impulse, 0.0, 5.0, 0.0);
boxPhysicsObj.collisionCoefficient = 0.5;
boxPhysicsObj.frictionCoefficient = frictionCoefficient;

let box2PhysicsObj = physicsScene.addNewPhysicsObject(box2.transform);
box2PhysicsObj.collisionCoefficient = 0.5;
box2PhysicsObj.frictionCoefficient = frictionCoefficient;

// To determine if E was pressed at the current frame or not
let rWasPressed = false;

/**
 * Our update function, this will run every frame, and is responsible for moving the camera based on input.
 * This is where game logic would go if this was a complete game
 * @param {*} dt - time elapsed since last frame. 
 */
let update = function(dt) {
    // Move camera with WASD (W and S will move along the direction of the camera, not along the xz plane)
    if (Input.keys["W"]) {
        camera.translate(vec3.scale(vec3.create(), camera.getDir(), 3.0 * dt));
    }
    if (Input.keys["S"]) {
        camera.translate(vec3.scale(vec3.create(), camera.getDir(), -3.0 * dt));
    }
    if (Input.keys["D"]) {
        camera.translate(vec3.scale(vec3.create(), camera.getRight(), 3.0 * dt));
    }
    if (Input.keys["A"]) {
        camera.translate(vec3.scale(vec3.create(), camera.getRight(), -3.0 * dt));
    }

    // Update sensitivity according to sensitivity slider
    sensitivity = sensitivitySlider.getValue() * 0.04;

    // Update fog density according to density slider
    renderer.setFogDensity(densitySlider.getValue() * 0.01);

    // Rotate camera with mouse click and drag
    let mouseDiff = Input.getMouseMovement();
    if (Input.mouseClicked && sensitivitySlider.getInputElement() != document.activeElement && densitySlider.getInputElement() != document.activeElement) { // Make sure the user is changing a slider
        pitch -= mouseDiff[1] * sensitivity;
        jaw -= mouseDiff[0] * sensitivity;
    }

    // Move camera up and down with spacebar and shift
    if (Input.keys[" "]) {
        camera.translate(vec3.fromValues(0.0, 3.0 * dt, 0.0));
    }
    if (Input.keys["SHIFT"]) {
        camera.translate(vec3.fromValues(0.0, -3.0 * dt, 0.0));
    }

    pitch = Math.max(Math.min(pitch, 89), -89); // Don't allow the camera to go past 89 degrees
    jaw = jaw % 360;

    camera.setPitchJawDegrees(pitch, jaw); // Update the rotation of the camera

    // Update usage of volumetric lighting based on checkbox
    renderer.useVolumetric = volumetricLightingCheckbox.getChecked();

    // Update the point lights ability to cast shadows based on checkbox
    pointLight.castShadow = pointShadowsCheckbox.getChecked();

    // Apply impulses and forces based on E and Q
    if (Input.keys["R"]) {
        if (!rWasPressed) {
            vec3.set(boxPhysicsObj.impulse, 0.0, 5.0, 0.0);
        }
        rWasPressed = true;
    }
    else {
        rWasPressed = false;
    }

    if (Input.keys["E"]) {
        vec3.add(boxPhysicsObj.force, boxPhysicsObj.force, vec3.fromValues(20.0, 20.0, 0.0));
    }
    
    if (Input.keys["Q"]) {
        vec3.add(boxPhysicsObj.force, boxPhysicsObj.force, vec3.fromValues(-20.0, 20.0, 0.0));
    }

    // Update physics
    physicsScene.update(dt);
}

// Resize function to that will update the size of our game window when the browser window is resized
let resize = function() {
    let width = window.innerWidth;
    let height = window.innerHeight * 0.75;
    
    // Update the camera aspect ratio to fit the new size
    camera.setAspectRatio(width / height);

    // Update the size of both the renderer and GUI renderer
    renderer.setSize(width, height); 
    guiRenderer.setSize(width, height);
}

// Run the resize function once to sync with the current size of the browser window 
resize();

// Also add the resize function to run automatically when the browser window is resized
window.addEventListener("resize", () => {
    resize();
});

// A timer to keep track of frame time
let lastUpdateTime = Date.now();

let frames = 0;
let fpsUpdateTimer = 0.0;

/**
 * Animation function that takes care of requesting animation frames, calculating frame time and calls both update and render functions.
 */
function animate() {
	requestAnimationFrame( animate );
    let now = Date.now();
    let dt = (now - lastUpdateTime) * 0.001;
    frames++;
    fpsUpdateTimer += dt;
    if (fpsUpdateTimer > 0.5) {
        fpsDisplay.textString = Math.floor(frames/fpsUpdateTimer);
        frames = 0;
        fpsUpdateTimer = 0.0;
    }
    lastUpdateTime = now;
    update(dt);
	renderer.render( scene, camera );
    guiRenderer.draw( camera );
}

// Start animating!
animate();