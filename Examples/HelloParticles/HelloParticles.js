import * as ENGINE from "../../dist/Engine.esm.js"
import { vec3, mat4 } from "../../dist/Engine.esm.js";

// Create a renderer and attach it to the document body
let renderer = new ENGINE.Renderer();
document.body.appendChild(renderer.domElement);

// Create a GUI renderer and attach it to the document body
let guiRenderer = new ENGINE.GUIRenderer();
document.body.appendChild(guiRenderer.domElement);

// Set the class to apply style defined in index.css
guiRenderer.domElement.className = "guiContainer";

// Create a scene. It will automatically have a directional light, so let's set the ambient multiplier for it.
let scene = new ENGINE.Scene();

// Create a camera and set it's starting position
let camera = new ENGINE.Camera();
camera.setPosition(vec3.fromValues(0.0, 0.0, 1.5));

// Add an FPS display
let fpsDisplay = guiRenderer.getNew2DText();
fpsDisplay.position[0] = 0.95;
fpsDisplay.getElement().style.color = "lime";
fpsDisplay.textString = "0";

// Add a particle spawner shooting particles out of the cube
let numParticles = 1000;
let particleSpawner = scene.addNewParticleSpawner("Assets/water.png", numParticles);

// Particle parameters
let spread = 3.0;
particleSpawner.lifetime = 0.5;
particleSpawner.sizeChangePerSecond = -0.1;
particleSpawner.fadePerSecond = 2.0;
let startSize = 0.2;

let updateParticleSpawner = function() {
    for (let i = 0; i < numParticles; i++) {
        let randomVel = vec3.fromValues((Math.random() - 0.5) * spread, 8.0 + Math.random() * 5.0, (Math.random() - 0.5) * spread);
        particleSpawner.setParticleData(i, vec3.fromValues(0.0, -1.0, 0.0), startSize, randomVel, vec3.fromValues(0.0, -9.82, 0.0), (i * particleSpawner.lifetime) / numParticles);
    }
}

// Add ui elements for setting particle parameters
let spreadSlider = guiRenderer.getNewSlider();
spreadSlider.position[0] = 0.01;
spreadSlider.position[1] = 0.05;
spreadSlider.textString = "Particle Spread";
spreadSlider.getInputElement().min = "0";
spreadSlider.getInputElement().max = "10.0";
spreadSlider.getInputElement().step = "0.1";
spreadSlider.getInputElement().value = spread.toString();
spreadSlider.getInputElement().onchange = function(e) {
    spread = parseFloat(spreadSlider.getInputElement().value);
    updateParticleSpawner();
}

let lifetimeSlider = guiRenderer.getNewSlider();
lifetimeSlider.position[0] = 0.01;
lifetimeSlider.position[1] = 0.1;
lifetimeSlider.textString = "Particle lifetime";
lifetimeSlider.getInputElement().min = "0";
lifetimeSlider.getInputElement().max = "10.0";
lifetimeSlider.getInputElement().step = "0.1";
lifetimeSlider.getInputElement().value = particleSpawner.lifetime.toString();
lifetimeSlider.getInputElement().onchange = function(e) {
    particleSpawner.lifetime = parseFloat(lifetimeSlider.getInputElement().value);
    updateParticleSpawner();
}

let sizeChangeSlider = guiRenderer.getNewSlider();
sizeChangeSlider.position[0] = 0.01;
sizeChangeSlider.position[1] = 0.15;
sizeChangeSlider.textString = "Particle size change";
sizeChangeSlider.getInputElement().min = "-5.0";
sizeChangeSlider.getInputElement().max = "5.0";
sizeChangeSlider.getInputElement().step = "0.1";
sizeChangeSlider.getInputElement().value = particleSpawner.sizeChangePerSecond.toString();
sizeChangeSlider.getInputElement().onchange = function(e) {
    particleSpawner.sizeChangePerSecond = parseFloat(sizeChangeSlider.getInputElement().value);
    updateParticleSpawner();
}

let fadeSlider = guiRenderer.getNewSlider();
fadeSlider.position[0] = 0.01;
fadeSlider.position[1] = 0.2;
fadeSlider.textString = "Particle fade";
fadeSlider.getInputElement().min = "-5.0";
fadeSlider.getInputElement().max = "5.0";
fadeSlider.getInputElement().step = "0.1";
fadeSlider.getInputElement().value = particleSpawner.fadePerSecond.toString();
fadeSlider.getInputElement().onchange = function(e) {
    particleSpawner.fadePerSecond = parseFloat(fadeSlider.getInputElement().value);
    updateParticleSpawner();
}

let startSizeSlider = guiRenderer.getNewSlider();
startSizeSlider.position[0] = 0.01;
startSizeSlider.position[1] = 0.25;
startSizeSlider.textString = "Particle start size";
startSizeSlider.getInputElement().min = "0.0";
startSizeSlider.getInputElement().max = "2.0";
startSizeSlider.getInputElement().step = "0.1";
startSizeSlider.getInputElement().value = startSize.toString();
startSizeSlider.getInputElement().onchange = function(e) {
    startSize = parseFloat(startSizeSlider.getInputElement().value);
    updateParticleSpawner();
}

updateParticleSpawner();

/**
 * Our update function, this will run every frame, and is responsible for moving the camera based on input.
 * This is where game logic would go if this was a complete game
 * @param {*} dt - time elapsed since last frame. 
 */
let update = function(dt) {

    
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