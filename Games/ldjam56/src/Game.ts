import { GUIRenderer } from "praccen-web-engine";
import { Howler, Howl } from "howler";
import Menu from "./States/Menu.js";
import GameState from "./States/GameState.js";

window.addEventListener("contextmenu", function (e: Event) {
  e.preventDefault();
});

// Create a GUI renderer and attach it to the document body
let guiRenderer = new GUIRenderer();
document.body.appendChild(guiRenderer.domElement);

// Set the class to apply style defined in index.css
guiRenderer.domElement.className = "guiContainer";

// Setup howler
Howler.pos(0, 0, 0);

let themeMusic = new Howl({
  src: ["Assets/Audio/Mysterious Forest Music.mp3"],
  volume: 0.1,
  rate: 1.0,
  loop: true,
  spatial: true,
});

themeMusic.play();

let gameState = new GameState(guiRenderer);
let menu = new Menu(guiRenderer, gameState.renderer);

let gameWonTimer = 0.0;

/**
 * Our update function, this will run every tick-
 * @param dt - time elapsed since last tick.
 */
function update(dt: number) {
  if (menu.enabled) {
    menu.update(dt);
    return;
  }

  if (gameState.levelWon) {
    gameState.reset();
  } else if (gameState.gameWon) {
    menu.toggle();
    menu.goToGameWonScreen();
    gameState.reset();
  } else if (gameState.gameOver) {
    gameWonTimer += dt;
    gameState.setupSpottedAnimation(Math.min(gameWonTimer / 3.0, 1.0));

    if (gameWonTimer >= 5.0) {
      gameWonTimer = 0.0;
      menu.toggle();
      menu.goToGameOverScreen();
      gameState.reset();
    }
  } else {
    gameState.update(dt);
  }
}

/**
 * This function runs just before rendering, once per frame.
 * Should update things that are only visual, contrary to game logic and physics for example.
 * This can be updating texture matrices etc
 * @param dt Time since last render call
 */
function preRendereringUpdate(dt: number) {
  if (menu.enabled) {
    menu.preRenderingUpdate(dt);
    gameState.gui.gameGuiDiv.setHidden(true);
    gameState.renderer.domElement.hidden = true;
    return;
  }

  if (gameState.gameWon || gameState.gameOver) {
    return;
  }

  gameState.gui.gameGuiDiv.setHidden(false);
  gameState.renderer.domElement.hidden = false;
  gameState.preRenderingUpdate(dt);
}

// Resize function to that will update the size of our game window when the browser window is resized
function resize() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  gameState.resize(width, height);
  menu.resize(width, height);
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
    gameState.gui.fpsDisplay.textString = Math.floor(
      frames / fpsUpdateTimer
    ).toString();
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

  if (menu.enabled) {
    menu.draw();
  } else {
    gameState.draw();
  }

  guiRenderer.draw(gameState.camera);
}

// Start animating!
animate();
