import * as ENGINE from "../../dist/Engine.esm.js"
import { vec2, vec3, mat4 } from "../../dist/Engine.esm.js";
import { Input } from "./Input.js"
import Spider from "./Spider.js";

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
camera.setPosition(vec3.fromValues(4.0, 4.0, 7.0));

let pitch = -30.0;
let jaw = 210.0;

// Add an FPS display
let fpsDisplay = guiRenderer.getNew2DText();
fpsDisplay.position[0] = 0.95;
fpsDisplay.getElement().style.color = "lime";
fpsDisplay.textString = "0";

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

// Spider
let spider = new Spider(scene, physicsScene);

let addBox = function(position, scale, diffuse, specular) {
    // Create a stretched dark grey cube as a floor so that we can see the beautiful shadows
    let box = scene.addNewMesh("Assets/cube.obj", diffuse, specular); 
    box.transform.translate(position);
    vec3.copy(box.transform.scale, scale);

    let boxPhysicsObj = physicsScene.addNewPhysicsObject(box.transform);
    boxPhysicsObj.isStatic = true;
    boxPhysicsObj.frictionCoefficient = frictionCoefficient;
}

addBox(vec3.fromValues(0.0, -2.0, 0.0), vec3.fromValues(50.0, 1.0, 50.0), "CSS:rgb(50,50,50)", "CSS:rgb(100,100,100)");
addBox(vec3.fromValues(15.0, 0.0, 4.0), vec3.fromValues(6.0, 8.0, 6.0), "CSS:rgb(50,50,50)", "CSS:rgb(100,100,100)");

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

    // Get ray from mouse picking module and use it to set the spiders target position
    if (Input.keys["Y"]) {
        let rect = renderer.domElement.getClientRects()[0];
        let ndc = vec2.fromValues((Input.mousePosition.x - rect.left) / rect.width, (Input.mousePosition.y - rect.top) / rect.height);
        ndc[0] = ndc[0] * 2.0 - 1.0;
        ndc[1] = ndc[1] * -2.0 + 1.0;

        let ray = ENGINE.MousePicking.GetRay(camera, ndc);
        let dist = physicsScene.doRayCast(ray);
        if (dist < Infinity) {
            let targetPos = vec3.scaleAndAdd(vec3.create(), camera.getPosition(), ray.getDir(), dist);
            spider.setTarget(targetPos);
        }
    }
    
    // Update usage of volumetric lighting based on checkbox
    renderer.useVolumetric = volumetricLightingCheckbox.getChecked();

    // Update the point lights ability to cast shadows based on checkbox
    spider.pointLight.castShadow = pointShadowsCheckbox.getChecked();

    // Update physics
    physicsScene.update(dt);

    // Update spider
    spider.update(dt);
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