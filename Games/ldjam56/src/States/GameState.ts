import {
  Camera,
  GUIRenderer,
  PhysicsScene,
  Renderer3D,
  Scene,
  vec2,
  vec3,
} from "praccen-web-engine";
import { GetCookie, SetCookie } from "../Utils/WebUtils.js";
import GUI from "../GUI/GUI.js";
import ProceduralMap from "../Generators/Map/ProceduralMapGenerator.js";
import Player from "../Objects/Player.js";
import Cheese from "../Objects/Cheese.js";
import Enemy from "../Objects/Enemy.js";
import { Howler, Howl } from "howler";
import { Input } from "../Input.js";

export default class GameState {
  renderer: Renderer3D;
  private scene: Scene;
  private physicsScene: PhysicsScene;
  camera: Camera;
  gui: GUI;
  gameOver: boolean = false;
  playerSpottedByEnemy: Enemy = null;
  levelWon: boolean = false;
  gameWon: boolean = false;
  private cameraSlerpStartPosition: vec3 = vec3.create();
  private cameraSlerpStartDir: vec3 = vec3.create();

  private pitch: number = -30.0;
  private jaw: number = 210.0;

  private pWasPressed: boolean = false;
  private freeCam: boolean = false;
  private saveScreenshot: boolean = false;

  private map: ProceduralMap;
  private player: Player;
  private enemies: Enemy[];
  private cheese: Cheese;
  level: number = 1;
  finalLevel: number = 2;

  constructor(guiRenderer: GUIRenderer) {
    // Create a renderer and attach it to the document body
    this.renderer = new Renderer3D();
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";

    this.renderer.useVolumetric = true;
    this.renderer.setFogBlur(true);
    this.renderer.setFogRenderScale(1.0);
    this.renderer.setFogDensity(0.6);
    this.renderer.setFogTexture("Assets/Textures/Fog.png");

    this.gui = new GUI(guiRenderer);

    this.reset();
  }

  resize(width: number, height: number) {
    // Update the camera aspect ratio to fit the new size
    this.camera.setAspectRatio(width / height);

    // Update the size of both the renderer and GUI renderer
    this.renderer.setSize(width, height, true);
  }

  reset() {
    this.gameOver = false;
    this.gameWon = false;
    this.levelWon = false;
    this.playerSpottedByEnemy = null;

    // Create a scene. It will automatically have a directional light, so let's set the ambient multiplier for it.
    this.scene = new Scene(this.renderer);
    this.scene.getDirectionalLight().ambientMultiplier = 0.1;
    vec3.set(this.scene.getDirectionalLight().colour, 0.3216, 0.7412, 0.5922);
    vec3.set(this.scene.getDirectionalLight().direction, 0.001, 1.0, 0.0);

    this.scene.directionalLight.shadowCameraDistance = 100;
    this.scene.directionalLight.lightProjectionBoxSideLength = 100;

    // Create a camera and set it's starting position
    this.camera = new Camera();
    this.camera.setPosition(vec3.fromValues(4.0, 4.0, 7.0));

    const camPosCookie = GetCookie("camPos");
    const camDirCookie = GetCookie("camDir");
    if (camPosCookie != "") {
      this.camera.setPosition(
        vec3.fromValues(
          parseFloat(camPosCookie.split(":")[0]),
          parseFloat(camPosCookie.split(":")[1]),
          parseFloat(camPosCookie.split(":")[2])
        )
      );
    }
    if (camDirCookie != "") {
      this.pitch = parseFloat(camDirCookie.split(":")[0]);
      this.jaw = parseFloat(camDirCookie.split(":")[1]);
    }

    // Physics scene
    this.physicsScene = new PhysicsScene();

    this.map = new ProceduralMap(
      this.scene,
      this.physicsScene,
      this.level,
      this.level == this.finalLevel
    );
    let playerSpawnRoom = this.map.getPlayerSpawnRoom();
    let playerPointLight = this.scene.addNewPointLight();
    this.player = new Player(
      this.scene,
      this.physicsScene,
      this.map.wallsPhysicsScene,
      playerSpawnRoom,
      playerPointLight
    );

    if (this.level == this.finalLevel) {
      let cheesePointLight = this.scene.addNewPointLight();
      this.cheese = new Cheese(
        this.scene,
        this.map.getRoomCenterWorldPos(this.map.getGoalRoom()),
        this.map,
        cheesePointLight
      );
    }

    this.enemies = new Array<Enemy>();
    for (let i = 0; i < this.map.getNumEnemies(); i++) {
      let path = this.map.getEnemyPath(i);
      let pointLight = this.scene.addNewPointLight();
      let enemy = new Enemy(
        this.scene,
        this.physicsScene,
        path.start,
        path.end,
        this.map,
        this.enemies,
        pointLight,
        this.player,
        this.renderer,
        this
      );
      this.enemies.push(enemy);
    }
  }

  setupSpottedAnimation(progress: number) {
    this.gui.mapDisplay.setHidden(true);
    if (this.playerSpottedByEnemy != undefined) {
      let targetDir = vec3.normalize(
        vec3.create(),
        vec3.sub(
          vec3.create(),
          this.player.physicsObj.transform.position,
          this.camera.getPosition()
        )
      );
      let targetPos = vec3.add(
        vec3.create(),
        this.playerSpottedByEnemy.physicsObj.transform.position,
        vec3.fromValues(0.0, 2.5, 0.0)
      );
      vec3.scaleAndAdd(targetPos, targetPos, targetDir, -1.5);
      this.camera.setPosition(
        vec3.lerp(
          vec3.create(),
          this.cameraSlerpStartPosition,
          targetPos,
          progress
        )
      );
      this.camera.setDir(
        vec3.lerp(vec3.create(), this.cameraSlerpStartDir, targetDir, progress)
      );
    }
  }

  update(dt: number) {
    this.player.update(dt, this.camera, this.renderer);

    for (let enemy of this.enemies) {
      enemy.update(dt, this.renderer);
    }

    // Update physics
    this.physicsScene.update(dt);
    if (this.level == this.finalLevel) {
      this.cheese.update(dt);
      this.cheese.position = this.map.getRoomCenterWorldPos(
        this.map.getGoalRoom()
      );
    }

    if (this.player.physicsObj != undefined) {
      // Update sound from player
      Howler.pos(
        this.player.physicsObj.transform.position[0],
        this.player.physicsObj.transform.position[1],
        this.player.physicsObj.transform.position[2]
      );

      if (this.level == this.finalLevel) {
        if (
          vec3.dist(
            this.player.physicsObj.transform.position,
            this.map.getRoomCenterWorldPos(this.map.getGoalRoom())
          ) < 2.0
        ) {
          this.gameWon = true;
          this.level = 1;
        }

        if (
          vec3.dist(
            this.player.physicsObj.transform.position,
            this.cheese.position
          ) < 15.0
        ) {
          this.cheese.playSound();
        }
      } else {
        if (
          vec3.dist(
            this.player.physicsObj.transform.position,
            this.map.getRoomCenterWorldPos(this.map.getGoalRoom())
          ) < 5.0
        ) {
          this.levelWon = true;
          this.level++;
        }
      }

      this.map.updateFocusRoom(
        vec2.fromValues(
          this.player.physicsObj.transform.position[0],
          this.player.physicsObj.transform.position[2]
        )
      );
    }
  }

  preRenderingUpdate(dt: number) {
    // if (this.gui.cameraFollowCheckbox.getChecked() && this.player.physicsObj != undefined) {
    if (!this.freeCam && this.player.physicsObj != undefined) {
      let offsetVec = vec3.fromValues(0.0, 15.0, 6.0);
      let x = this.player.physicsObj.transform.position[0];
      let y = this.player.physicsObj.transform.position[1];
      let z = this.player.physicsObj.transform.position[2];
      if (x > this.map.getMapSize()[0] - 25) {
        x = this.map.getMapSize()[0] - 25;
      } else if (x < 25) {
        x = 25;
      }
      if (z > this.map.getMapSize()[1] - 10) {
        z = this.map.getMapSize()[1] - 10;
      } else if (z < 18) {
        z = 18;
      }
      this.camera.setPosition(
        vec3.add(vec3.create(), vec3.fromValues(x, y, z), offsetVec)
        // vec3.add(vec3.create(), this.player.physicsObj.transform.position, offsetVec)
      );
      this.camera.setDir(vec3.negate(vec3.create(), offsetVec));
      this.scene.getDirectionalLight().shadowFocusPos = vec3.fromValues(
        this.map.focusRoom[0] * 10.0 + 5.0,
        0.0,
        this.map.focusRoom[1] * 10.0 + 5.0
      );

      this.gui.mapDisplay.setHidden(false);
    } else {
      // Move camera with WASD (W and S will move along the direction of the camera, not along the xz plane)
      const cameraSpeed = 10.0;
      if (Input.keys["W"]) {
        this.camera.translate(
          vec3.scale(vec3.create(), this.camera.getDir(), cameraSpeed * dt)
        );
      }
      if (Input.keys["S"]) {
        this.camera.translate(
          vec3.scale(vec3.create(), this.camera.getDir(), -cameraSpeed * dt)
        );
      }
      if (Input.keys["D"]) {
        this.camera.translate(
          vec3.scale(vec3.create(), this.camera.getRight(), cameraSpeed * dt)
        );
      }
      if (Input.keys["A"]) {
        this.camera.translate(
          vec3.scale(vec3.create(), this.camera.getRight(), -cameraSpeed * dt)
        );
      }

      // Rotate camera with mouse click and drag
      let mouseDiff = Input.getMouseMovement();
      if (Input.mouseClicked) {
        // Make sure the user is not changing a slider
        this.pitch -= mouseDiff[1] * 0.5;
        this.jaw -= mouseDiff[0] * 0.5;
      }

      // Move camera up and down with spacebar and shift
      if (Input.keys[" "]) {
        this.camera.translate(vec3.fromValues(0.0, 10.0 * dt, 0.0));
      }
      if (Input.keys["SHIFT"]) {
        this.camera.translate(vec3.fromValues(0.0, -10.0 * dt, 0.0));
      }

      this.pitch = Math.max(Math.min(this.pitch, 89), -89); // Don't allow the camera to go past 89 degrees
      this.jaw = this.jaw % 360;

      this.camera.setPitchJawDegrees(this.pitch, this.jaw); // Update the rotation of the camera

      this.gui.mapDisplay.setHidden(true);

      SetCookie(
        "camPos",
        this.camera.getPosition()[0] +
          ":" +
          this.camera.getPosition()[1] +
          ":" +
          this.camera.getPosition()[2]
      );
      SetCookie("camDir", this.pitch + ":" + this.jaw);
    }

    // if (Input.keys["P"]) {
    //   if (!this.pWasPressed) {
    //     this.freeCam = !this.freeCam;
    //   }

    //   this.pWasPressed = true;
    // } else {
    //   this.pWasPressed = false;
    // }

    // if (Input.keys["O"]) {
    //   this.saveScreenshot = true;
    // }

    // Update the clear colour to match the ambience
    this.renderer.clearColour.r =
      this.scene.getDirectionalLight().colour[0] *
      (0.44 * this.scene.getDirectionalLight().ambientMultiplier);
    this.renderer.clearColour.g =
      this.scene.getDirectionalLight().colour[1] *
      (0.44 * this.scene.getDirectionalLight().ambientMultiplier);
    this.renderer.clearColour.b =
      this.scene.getDirectionalLight().colour[2] *
      (0.44 * this.scene.getDirectionalLight().ambientMultiplier);

    // Update ascii map
    if (this.player.physicsObj != undefined) {
      this.gui.mapDisplay.textString = this.map.getAsciiMapOfVisitedRooms();
      let pitchJaw = this.camera.getPitchJawDegrees();
      this.gui.mapDisplay.transformString =
        "translate(-" +
        ((this.player.physicsObj.transform.position[0] + 2.5) /
          (this.map.getMapSize()[0] + 5.0)) *
          100.0 +
        "%, -" +
        ((this.player.physicsObj.transform.position[2] + 2.5) /
          (this.map.getMapSize()[1] + 5.0)) *
          100.0 +
        "%) ";
      this.gui.mapDisplay.transformString +=
        "rotate(" + (pitchJaw[1] + 180.0) + "deg) ";
      this.gui.mapDisplay.getElement().style.transformOrigin =
        "" +
        ((this.player.physicsObj.transform.position[0] + 2.5) /
          (this.map.getMapSize()[0] + 5.0)) *
          100.0 +
        "% " +
        ((this.player.physicsObj.transform.position[2] + 2.5) /
          (this.map.getMapSize()[1] + 5.0)) *
          100.0 +
        "% ";
      this.gui.mapDisplay.position = this.player.physicsObj.transform.position;
      this.gui.characterDisplay.position =
        this.player.physicsObj.transform.position;
    }

    this.player.preRenderingUpdate(dt);

    for (const enemy of this.enemies) {
      enemy.preRenderingUpdate(dt);
    }

    vec3.copy(this.cameraSlerpStartPosition, this.camera.getPosition());
    vec3.copy(this.cameraSlerpStartDir, this.camera.getDir());
  }

  draw() {
    if (this.saveScreenshot) {
      this.renderer.render(this.scene, this.camera, true, "captureScreen.png");
      this.saveScreenshot = false;
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
