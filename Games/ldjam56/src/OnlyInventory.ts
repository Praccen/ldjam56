import * as ENGINE from "praccen-web-engine";
import Inventory from "./GUI/Inventory.js";

window.addEventListener("contextmenu", function (e: Event) {
  e.preventDefault();
});

// Create a GUI renderer and attach it to the document body
let guiRenderer = new ENGINE.GUIRenderer();
document.body.appendChild(guiRenderer.domElement);

// Set the class to apply style defined in index.css
guiRenderer.domElement.className = "guiContainer";

// Add an FPS display
let fpsDisplay = guiRenderer.getNew2DText();
fpsDisplay.position[0] = 0.9;
fpsDisplay.getElement().style.color = "lime";
fpsDisplay.textString = "0";
fpsDisplay.getElement().style.zIndex = "8";

let inventory = new Inventory(guiRenderer);

/**
 * Our update function, this will run every frame, and is responsible for moving the camera based on input.
 * This is where game logic would go if this was a complete game
 * @param dt - time elapsed since last frame.
 */
let update = function (dt: number) {
  inventory.update(dt);
};

/**
 * This function runs just before rendering
 * Should update things that are only visual, contrary to game logic and physics for example.
 * This can be updating texture matrices etc
 * @param dt Time since last render call
 */
let preRendereringUpdate = function (dt: number) {
  inventory.preRenderingUpdate(dt);
};

// Resize function to that will update the size of our game window when the browser window is resized
let resize = function () {
  let width = window.innerWidth;
  let height = window.innerHeight;
  guiRenderer.setSize(width, height);
};

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
let accumulativeDt = 0.0;

const tickRate = 1.0 / 144.0;
const maxUpdatesPerFrame = 20;

/**
 * Animation function that takes care of requesting animation frames, calculating frame time and calls both update and render functions.
 */
function animate() {
  requestAnimationFrame(animate);
  let now = Date.now();
  let dt = (now - lastUpdateTime) * 0.001;
  frames++;
  fpsUpdateTimer += dt;
  if (fpsUpdateTimer > 0.5) {
    fpsDisplay.textString = Math.floor(frames / fpsUpdateTimer).toString();
    frames = 0;
    fpsUpdateTimer = 0.0;
  }
  lastUpdateTime = now;

  accumulativeDt += dt;
  let updates = 0;
  while (accumulativeDt >= tickRate) {
    update(tickRate);
    accumulativeDt -= tickRate;
    updates++;
    if (updates >= maxUpdatesPerFrame) {
      accumulativeDt %= tickRate;
    }
  }

  preRendereringUpdate(dt);

  inventory.draw(dt);

  guiRenderer.draw();
}

// Start animating!
animate();
