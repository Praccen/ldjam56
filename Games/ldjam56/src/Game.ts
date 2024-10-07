import {
  vec3,
  vec2,
  Renderer3D,
  GUIRenderer,
  Scene,
  Camera,
  PhysicsScene,
} from "praccen-web-engine";
import { Input } from "./Input.js";
import { GetCookie, SetCookie } from "./Utils/WebUtils.js";
import ProceduralMap from "./Generators/Map/ProceduralMapGenerator.js";
import Player from "./Objects/Player.js";
import GUI from "./GUI/GUI.js";
import Enemy from "./Objects/Enemy.js";
import { Howler, Howl } from "howler";
import Cheese from "./Objects/Cheese.js";
import Menu from "./GUI/Menu.js";

let pWasPressed = false;

window.addEventListener("contextmenu", function (e: Event) {
  e.preventDefault();
});

// Create a renderer and attach it to the document body
let renderer = new Renderer3D();
document.body.appendChild(renderer.domElement);

renderer.useVolumetric = true;
renderer.setFogDensity(0.6);
renderer.setFogTexture("Assets/Textures/Fog.png");

// Create a GUI renderer and attach it to the document body
let guiRenderer = new GUIRenderer();
document.body.appendChild(guiRenderer.domElement);

// Set the class to apply style defined in index.css
guiRenderer.domElement.className = "guiContainer";

// Create a scene. It will automatically have a directional light, so let's set the ambient multiplier for it.
let scene = new Scene(renderer);
scene.getDirectionalLight().ambientMultiplier = 0.1;
vec3.set(scene.getDirectionalLight().colour, 0.3216, 0.7412, 0.5922);
vec3.set(scene.getDirectionalLight().direction, 0.001, 1.0, 0.0);

scene.directionalLight.shadowCameraDistance = 100;
scene.directionalLight.lightProjectionBoxSideLength = 100;

// Create a camera and set it's starting position
let camera = new Camera();
camera.setPosition(vec3.fromValues(4.0, 4.0, 7.0));

let pitch = -30.0;
let jaw = 210.0;

const camPosCookie = GetCookie("camPos");
const camDirCookie = GetCookie("camDir");
if (camPosCookie != "") {
  camera.setPosition(
    vec3.fromValues(
      parseFloat(camPosCookie.split(":")[0]),
      parseFloat(camPosCookie.split(":")[1]),
      parseFloat(camPosCookie.split(":")[2])
    )
  );
}
if (camDirCookie != "") {
  pitch = parseFloat(camDirCookie.split(":")[0]);
  jaw = parseFloat(camDirCookie.split(":")[1]);
}

let gui = new GUI(guiRenderer);
let sensitivity = 1.0;
let saveScreenshot = false;

// Physics scene
let physicsScene = new PhysicsScene();

let gameTimer: number = 0.0;

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

let map = new ProceduralMap(scene, physicsScene);
let playerSpawnRoom = map.getPlayerSpawnRoom();
let goalRoom = map.getRoomCenterWorldPos(map.getGoalRoom());
let playerPointLight = scene.addNewPointLight();
let player = new Player(
  scene,
  physicsScene,
  map.wallsPhysicsScene,
  playerSpawnRoom,
  playerPointLight
);
let cheesePointLight = scene.addNewPointLight();
let cheese = new Cheese(scene, goalRoom, map, cheesePointLight);
let enemies = new Array<Enemy>();
for (let i = 0; i < map.getNumEnemies(); i++) {
  let path = map.getEnemyPath(i);
  let pointLight = scene.addNewPointLight();
  let enemy = new Enemy(
    scene,
    physicsScene,
    path.start,
    path.end,
    map,
    enemies,
    pointLight,
    player,
    renderer
  );
  enemies.push(enemy);
}

let menu = new Menu(guiRenderer, renderer);

/**
 * Our update function, this will run every frame, and is responsible for moving the camera based on input.
 * This is where game logic would go if this was a complete game
 * @param dt - time elapsed since last frame.
 */
function update(dt: number) {
  if (menu.enabled) {
    menu.update(dt);
    return;
  }

  player.update(dt, camera, renderer);

  for (let enemy of enemies) {
    enemy.update(dt, renderer);
  }

  // Update physics
  physicsScene.update(dt);
  cheese.update(dt);

  if (player.physicsObj != undefined) {
    // Update sound from player
    Howler.pos(
      player.physicsObj.transform.position[0],
      player.physicsObj.transform.position[1],
      player.physicsObj.transform.position[2]
    );
    if (vec3.dist(player.physicsObj.transform.position, goalRoom) < 2.0) {
      // TODO LOAD NEXT LEVEL
      console.log("WIN");
    }

    if (
      vec3.dist(player.physicsObj.transform.position, cheese.position) < 15.0
    ) {
      cheese.playSound();
    }

    map.updateFocusRoom(
      vec2.fromValues(
        player.physicsObj.transform.position[0],
        player.physicsObj.transform.position[2]
      )
    );
  }
  
}

/**
 * This function runs just before rendering
 * Should update things that are only visual, contrary to game logic and physics for example.
 * This can be updating texture matrices etc
 * @param dt Time since last render call
 */
function preRendereringUpdate(dt: number) {
  if (menu.enabled) {
    menu.preRenderingUpdate(dt);
    gui.gameGuiDiv.setHidden(true);
    return;
  }

  gui.gameGuiDiv.setHidden(false);

  // if (gui.cameraFollowCheckbox.getChecked() && player.physicsObj != undefined) {
  if (true) {
    let offsetVec = vec3.fromValues(0.0, 15.0, 6.0);
    let x = player.physicsObj.transform.position[0];
    let y = player.physicsObj.transform.position[1];
    let z = player.physicsObj.transform.position[2];
    if (x > map.getMapSize()[0] - 25) {
      x = map.getMapSize()[0] - 25;
    } else if (x < 25) {
      x = 25;
    }
    if (z > map.getMapSize()[1] - 10) {
      z = map.getMapSize()[1] - 10;
    } else if (z < 18) {
      z = 18;
    }
    camera.setPosition(
      vec3.add(vec3.create(), vec3.fromValues(x, y, z), offsetVec)
    );
    camera.setDir(vec3.negate(vec3.create(), offsetVec));
    scene.getDirectionalLight().shadowFocusPos = vec3.fromValues(
      map.focusRoom[0] * 10.0 + 5.0,
      0.0,
      map.focusRoom[1] * 10.0 + 5.0
    );

    gui.mapDisplay.setHidden(false);
  } else {
    // Move camera with WASD (W and S will move along the direction of the camera, not along the xz plane)
    const cameraSpeed = 10.0;
    if (Input.keys["W"]) {
      camera.translate(
        vec3.scale(vec3.create(), camera.getDir(), cameraSpeed * dt)
      );
    }
    if (Input.keys["S"]) {
      camera.translate(
        vec3.scale(vec3.create(), camera.getDir(), -cameraSpeed * dt)
      );
    }
    if (Input.keys["D"]) {
      camera.translate(
        vec3.scale(vec3.create(), camera.getRight(), cameraSpeed * dt)
      );
    }
    if (Input.keys["A"]) {
      camera.translate(
        vec3.scale(vec3.create(), camera.getRight(), -cameraSpeed * dt)
      );
    }

    // Rotate camera with mouse click and drag
    let mouseDiff = Input.getMouseMovement();
    if (
      Input.mouseClicked
    ) {
      // Make sure the user is not changing a slider
      pitch -= mouseDiff[1] * sensitivity;
      jaw -= mouseDiff[0] * sensitivity;
    }

    // Move camera up and down with spacebar and shift
    if (Input.keys[" "]) {
      camera.translate(vec3.fromValues(0.0, 10.0 * dt, 0.0));
    }
    if (Input.keys["SHIFT"]) {
      camera.translate(vec3.fromValues(0.0, -10.0 * dt, 0.0));
    }

    pitch = Math.max(Math.min(pitch, 89), -89); // Don't allow the camera to go past 89 degrees
    jaw = jaw % 360;

    camera.setPitchJawDegrees(pitch, jaw); // Update the rotation of the camera

    gui.mapDisplay.setHidden(true);
  }

  if (Input.keys["P"]) {
    if (!pWasPressed) {
      saveScreenshot = true;
    }

    pWasPressed = true;
  } else {
    pWasPressed = false;
  }

  // Update the clear colour to match the ambience
  renderer.clearColour.r =
    scene.getDirectionalLight().colour[0] *
    (0.44 * scene.getDirectionalLight().ambientMultiplier);
  renderer.clearColour.g =
    scene.getDirectionalLight().colour[1] *
    (0.44 * scene.getDirectionalLight().ambientMultiplier);
  renderer.clearColour.b =
    scene.getDirectionalLight().colour[2] *
    (0.44 * scene.getDirectionalLight().ambientMultiplier);

  // Update ascii map
  if (player.physicsObj != undefined) {
    gui.mapDisplay.textString = map.getAsciiMapOfVisitedRooms();
    let pitchJaw = camera.getPitchJawDegrees();
    gui.mapDisplay.transformString =
      "translate(-" +
      ((player.physicsObj.transform.position[0] + 2.5) /
        (map.getMapSize()[0] + 5.0)) *
        100.0 +
      "%, -" +
      ((player.physicsObj.transform.position[2] + 2.5) /
        (map.getMapSize()[1] + 5.0)) *
        100.0 +
      "%) ";
    gui.mapDisplay.transformString +=
      "rotate(" + (pitchJaw[1] + 180.0) + "deg) ";
    gui.mapDisplay.getElement().style.transformOrigin =
      "" +
      ((player.physicsObj.transform.position[0] + 2.5) /
        (map.getMapSize()[0] + 5.0)) *
        100.0 +
      "% " +
      ((player.physicsObj.transform.position[2] + 2.5) /
        (map.getMapSize()[1] + 5.0)) *
        100.0 +
      "% ";
    gui.mapDisplay.position = player.physicsObj.transform.position;
    gui.characterDisplay.position = player.physicsObj.transform.position;
  }

  player.preRenderingUpdate(dt);

  for (const enemy of enemies) {
    enemy.preRenderingUpdate(dt);
  }
}

// Resize function to that will update the size of our game window when the browser window is resized
function resize() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Update the camera aspect ratio to fit the new size
  camera.setAspectRatio(width / height);

  // Update the size of both the renderer and GUI renderer
  renderer.setSize(width, height, true);
  menu.resize(width, height);
  guiRenderer.setSize(width, height);
}

// Run the resize function once to sync with the current size of the browser window
resize();

// Also add the resize function to run automatically when the browser window is resized
window.addEventListener("resize", () => {
  resize();
});

window.addEventListener("beforeunload", function (e: BeforeUnloadEvent) {
  SetCookie(
    "camPos",
    camera.getPosition()[0] +
      ":" +
      camera.getPosition()[1] +
      ":" +
      camera.getPosition()[2]
  );
  SetCookie("camDir", pitch + ":" + jaw);
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
  gameTimer += dt;
  frames++;
  fpsUpdateTimer += dt;
  if (fpsUpdateTimer > 0.5) {
    gui.fpsDisplay.textString = Math.floor(frames / fpsUpdateTimer).toString();
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
    if (saveScreenshot) {
      renderer.render(scene, camera, true, "captureScreen.png");
      saveScreenshot = false;
    } else {
      renderer.render(scene, camera);
    }
  }

  guiRenderer.draw(camera);
}

// Start animating!
animate();
