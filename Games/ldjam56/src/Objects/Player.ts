import {
  AnimatedGraphicsBundle,
  Camera,
  MousePicking,
  PhysicsObject,
  PhysicsScene,
  quat,
  Renderer3D,
  Scene,
  vec2,
  vec3,
} from "praccen-web-engine";
import { PointLight } from "../../../../dist/Engine.js";
import { Input } from "../Input.js";
import { Howler, Howl } from 'howler';



export default class Player {
  private physicsScene: PhysicsScene;
  private playerTargetPos: vec3;
  private animatedMesh: AnimatedGraphicsBundle;
  physicsObj: PhysicsObject;
  private lightSource: PointLight;
  private readonly step: Howl;

  constructor(
    scene: Scene,
    physicsScene: PhysicsScene,
    playerSpawnRoom: vec2,
    lightSource: PointLight
  ) {
    this.physicsScene = physicsScene;
    this.playerTargetPos = vec3.fromValues(
      playerSpawnRoom[0] * 10.0 + 5.0,
      1.0,
      playerSpawnRoom[1] * 10.0 + 5.0
    );

    this.lightSource = lightSource;
    this.lightSource.castShadow = true;
    this.lightSource.constant = 1.0;
    this.lightSource.linear = 0.7;
    this.lightSource.quadratic = 0.1;

    vec3.set(this.lightSource.colour, 1, 0.575, 0.161);

    this.physicsObj = null;
    this.animatedMesh = null;
    this.step = new Howl({
        src: ["Assets/Audio/mouse_step.wav"],
        volume: 2.0,
        rate: 1.0,
    });

    scene
      .addNewAnimatedMesh(
          "Assets/gltf/Mouse/mouse.gltf",
          "Assets/gltf/Mouse/Feldmaus_Diffuse.png",
          "CSS:rgb(0,0,0)"
      )
      .then((aMeshBundle) => {
          this.animatedMesh = aMeshBundle;
          vec3.copy(aMeshBundle.transform.position, this.playerTargetPos);
          vec3.set(aMeshBundle.transform.scale, 1.2, 1.2, 1.2);

          this.physicsObj = physicsScene.addNewPhysicsObject(aMeshBundle.transform);
          this.physicsObj.isStatic = false;
          this.physicsObj.frictionCoefficient = 1.0;
          this.physicsObj.boundingBox.setMinAndMaxVectors(vec3.fromValues(-0.5, 0.0, -0.5), vec3.fromValues(0.5, 1.0, 0.5));
      });
  }

  updateLightPos() {
    if (this.lightSource != undefined) {
      vec3.copy(
        this.lightSource.position,
        vec3.add(
          vec3.create(),
          this.physicsObj.transform.position,
          vec3.fromValues(0, 3, 0)
        )
      );
    }
  }

    playStepSound() {
        if (!this.step.playing()) {
            this.step.play();
        }
    }

  update(dt: number, camera: Camera, renderer: Renderer3D) {
    if (Input.mouseRightClicked || Input.touches.length > 0) {
      let clickX = 0;
      let clickY = 0;
      if (Input.mouseRightClicked) {
        clickX = Input.mousePosition.x;
        clickY = Input.mousePosition.y;
      } else if (Input.touches.length > 0) {
        clickX = Input.touches[0][0];
        clickY = Input.touches[0][1]; 
      }

      let rect = renderer.domElement.getClientRects()[0];
      let ndc = vec2.fromValues(
        (clickX - rect.left) / rect.width,
        (clickY - rect.top) / rect.height
      );
      ndc[0] = ndc[0] * 2.0 - 1.0;
      ndc[1] = ndc[1] * -2.0 + 1.0;

      let ray = MousePicking.GetRay(camera, ndc);
      let dist = this.physicsScene.doRayCast(ray).distance;
      if (dist < Infinity) {
        vec3.scaleAndAdd(
          this.playerTargetPos,
          camera.getPosition(),
          ray.getDir(),
          dist
        );
      }
    }
    if (this.physicsObj != undefined) {
      let towardsTargetVector = vec3.sub(
        vec3.create(),
        this.playerTargetPos,
        this.physicsObj.transform.position
      );
      towardsTargetVector[1] = 0.0;
      let distance = vec3.len(towardsTargetVector);
      vec3.normalize(towardsTargetVector, towardsTargetVector);
      vec3.scaleAndAdd(
        this.physicsObj.force,
        this.physicsObj.force,
        towardsTargetVector,
        50.0 * Math.min(distance, 4.0)
      );
      this.updateLightPos();

      
      if (vec3.len(this.physicsObj.velocity) > 2.0) {
        let angle = 210.0 - Math.atan2(this.physicsObj.velocity[2], this.physicsObj.velocity[0]) * 180 / Math.PI;
        quat.fromEuler(this.physicsObj.transform.rotation, 0.0, angle, 0.0);
      }
    }

  }

  preRenderingUpdate(dt: number) {
    if (this.animatedMesh != undefined) {
      if (vec3.len(this.physicsObj.velocity) > 1.0) {
        let keyframe = this.animatedMesh.animate(2, dt, 1.2, 2.0);
        if (keyframe == 28 || keyframe == 39 || keyframe == 47) {
         this.playStepSound();
        }
      }
      else {
        this.animatedMesh.animate(1, dt);
      }
    }
  }
}
