import * as ENGINE from "praccen-web-engine";
import { vec3, quat } from "praccen-web-engine";
import { Input } from "../Input.js";

let windDirection = vec3.fromValues(1.0, 0.0, 0.0);
let windStrength = 7.0;

// The sailing function™
let sailingFunc = function (x: number): number {
  return 1.0 + (0.4 - Math.pow(x, 4) + 0.4 * x) * Math.pow(x, 2) * 2.7;
};

export default class Boat {
  private scene: ENGINE.Scene;
  private physicsScene: ENGINE.PhysicsScene;

  private cameraDistance: number;

  private windIndicatorTransform: ENGINE.Transform;

  private sailRotation: number;
  private sailMaxExtension: number;
  private sailMaxAngle: number;
  private sailTransform: ENGINE.Transform;

  private rudderRotation: number;
  private rudderTurningSpeed: number;
  private rudderMaxAngle: number;
  private rudderTargetRotation: number;
  private rudderTransform: ENGINE.Transform;

  private hullWaterFriction: number;
  private hullPhysicsObject: ENGINE.PhysicsObject;

  constructor(scene: ENGINE.Scene, physicsScene: ENGINE.PhysicsScene) {
    this.scene = scene;
    this.physicsScene = physicsScene;
    this.cameraDistance = 6.0;

    this.sailRotation = 0.0;
    this.sailMaxExtension = 150.0;
    this.sailMaxAngle = this.sailMaxExtension;

    this.rudderRotation = 0.0;
    this.rudderTurningSpeed = 360.0;
    this.rudderMaxAngle = 40.0;
    this.rudderTargetRotation = 0.0;

    this.hullWaterFriction = 0.01;
  }

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.scene
        .addNewMesh(
          "Assets/hull.obj",
          "CSS:rgb(180, 180, 180)",
          "CSS:rgb(150, 150, 150)"
        )
        .then((hullMesh) => {
          this.hullPhysicsObject = this.physicsScene.addNewPhysicsObject(
            hullMesh.transform
          );
          this.hullPhysicsObject.boundingBox.setMinAndMaxFromPointArray(
            hullMesh.graphicsObject.getVertexPositions()
          );
          this.hullPhysicsObject.frictionCoefficient = this.hullWaterFriction;

          this.scene
            .addNewMesh(
              "Assets/sail.obj",
              "CSS:rgb(180, 180, 180)",
              "CSS:rgb(150, 150, 150)"
            )
            .then((sailMesh) => {
              this.sailTransform = sailMesh.transform;
              this.sailTransform.parentTransform = hullMesh.transform;
            })
            .then(() => {
              this.scene
                .addNewMesh(
                  "Assets/rudder.obj",
                  "CSS:rgb(180, 180, 180)",
                  "CSS:rgb(150, 150, 150)"
                )
                .then((rudderMesh) => {
                  this.rudderTransform = rudderMesh.transform;
                  vec3.set(this.rudderTransform.origin, 0.0, 0.0, 2.0);
                  vec3.set(this.rudderTransform.position, 0.0, 0.0, 2.0);
                  this.rudderTransform.parentTransform = hullMesh.transform;
                });
            })
            .then(() => {
              this.scene
                .addNewMesh(
                  "Assets/windIndicator.obj",
                  "CSS:rgb(180, 0, 0)",
                  "CSS:rgb(150, 150, 150)"
                )
                .then((windIndicator) => {
                  this.windIndicatorTransform = windIndicator.transform;
                  this.windIndicatorTransform.parentTransform =
                    hullMesh.transform;
                });
            })
            .then(() => {
              resolve();
            });
        });
    });
  }

  update(dt: number, camera: ENGINE.Camera) {
    if (this.hullPhysicsObject != undefined) {
      this.hullPhysicsObject.transform.calculateMatrices();
      let forward = vec3.transformMat3(
        vec3.create(),
        vec3.fromValues(0.0, 0.0, -1.0),
        this.hullPhysicsObject.transform.normalMatrix
      );
      let right = vec3.transformMat3(
        vec3.create(),
        vec3.fromValues(1.0, 0.0, 0.0),
        this.hullPhysicsObject.transform.normalMatrix
      );

      let normVel = vec3.normalize(
        vec3.create(),
        this.hullPhysicsObject.velocity
      );
      let velForwardDot = vec3.dot(normVel, forward);

      // Make boat velocity turn towards forward according to dot product. Apply appropriate slowdown
      if (
        vec3.squaredLength(this.hullPhysicsObject.velocity) > 0.0 &&
        this.hullPhysicsObject.onGround
      ) {
        // Slow the boat down extra if it's not moving along the hull
        let slowdownFactor =
          this.hullWaterFriction + (1.0 - Math.abs(velForwardDot)) * 0.5;
        this.hullPhysicsObject.frictionCoefficient = slowdownFactor;

        // Apply a sideways force to help the boat turn
        vec3.scaleAndAdd(
          this.hullPhysicsObject.force,
          this.hullPhysicsObject.force,
          right,
          -vec3.dot(normVel, right) *
            5.0 *
            vec3.len(this.hullPhysicsObject.velocity)
        );
      }

      if (Input.keys["ARROWUP"]) {
        this.sailMaxAngle += 360.0 * dt;
      }
      if (Input.keys["ARROWDOWN"]) {
        this.sailMaxAngle -= 360.0 * dt;
      }

      this.sailMaxAngle = Math.max(
        0.0,
        Math.min(this.sailMaxAngle, this.sailMaxExtension)
      );
      let angle =
        (vec3.angle(windDirection, vec3.scale(vec3.create(), forward, -1.0)) *
          180) /
        Math.PI;
      angle = Math.sign(angle) * Math.min(Math.abs(angle), this.sailMaxAngle);
      if (
        vec3.dot(
          windDirection,
          vec3.transformMat3(
            vec3.create(),
            vec3.fromValues(1.0, 0.0, 0.0),
            this.hullPhysicsObject.transform.normalMatrix
          )
        ) < 0.0
      ) {
        angle *= -1.0;
      }
      this.sailRotation = angle;

      quat.fromEuler(this.sailTransform.rotation, 0.0, this.sailRotation, 0.0);

      // Negate rotation of hull
      quat.conjugate(
        this.windIndicatorTransform.rotation,
        this.hullPhysicsObject.transform.rotation
      );
      // Rotate according to wind
      quat.rotateY(
        this.windIndicatorTransform.rotation,
        this.windIndicatorTransform.rotation,
        vec3.angle(windDirection, vec3.fromValues(0.0, 0.0, 1.0))
      );

      let sailDirection = vec3.transformMat3(
        vec3.create(),
        vec3.fromValues(0.0, 0.0, 1.0),
        this.sailTransform.normalMatrix
      );
      let windSailDot = vec3.dot(windDirection, sailDirection);

      let sailForce = sailingFunc(Math.abs(windSailDot)) * windStrength;

      let forceDirection = vec3.cross(
        vec3.create(),
        sailDirection,
        vec3.fromValues(0.0, 1.0, 0.0)
      );
      if (vec3.dot(forceDirection, windDirection) < 0.0) {
        vec3.scale(forceDirection, forceDirection, -1.0);
      }

      vec3.scaleAndAdd(
        this.hullPhysicsObject.force,
        this.hullPhysicsObject.force,
        forceDirection,
        sailForce
      );

      if (Input.keys["ARROWRIGHT"]) {
        this.rudderTargetRotation = this.rudderMaxAngle;
      }
      if (Input.keys["ARROWLEFT"]) {
        this.rudderTargetRotation = -this.rudderMaxAngle;
      }

      if (!Input.keys["ARROWLEFT"] && !Input.keys["ARROWRIGHT"]) {
        this.rudderTargetRotation = 0.0;
      }

      const rudderDiff = Math.abs(
        this.rudderTargetRotation - this.rudderRotation
      );
      // Rotate the rudder towards the target rotation. If it's more than the maxAngle away it means it's moving from one side to another, if that's the case double the speed until the rudder is on the correct side.
      this.rudderRotation +=
        Math.sign(this.rudderTargetRotation - this.rudderRotation) *
        Math.min(
          this.rudderTurningSpeed * dt * rudderDiff > this.rudderMaxAngle
            ? 2.0
            : 1.0,
          rudderDiff
        );

      let turningPower = Math.max(
        -2.0,
        Math.min(vec3.dot(this.hullPhysicsObject.velocity, forward), 2.0)
      );
      if (!this.hullPhysicsObject.onGround) {
        turningPower = 8.0;
      } else if (Input.keys[" "]) {
        // TODO: Remove the ability to jump when done using it for testing purposes
        vec3.set(this.hullPhysicsObject.impulse, 0.0, 3.0, 0.0);
      }

      // Rotate the boat based on the current rudderRotation
      quat.rotateY(
        this.hullPhysicsObject.transform.rotation,
        this.hullPhysicsObject.transform.rotation,
        -turningPower * (this.rudderRotation / this.rudderMaxAngle) * dt
      );

      quat.fromEuler(
        this.rudderTransform.rotation,
        0.0,
        this.rudderRotation,
        0.0
      );

      if (Math.abs(this.hullPhysicsObject.transform.position[0]) > 75) {
        this.hullPhysicsObject.transform.position[0] -=
          Math.sign(this.hullPhysicsObject.transform.position[0]) * 150;
      }

      if (Math.abs(this.hullPhysicsObject.transform.position[2]) > 75) {
        this.hullPhysicsObject.transform.position[2] -=
          Math.sign(this.hullPhysicsObject.transform.position[2]) * 150;
      }

      let focusPoint = vec3.add(
        vec3.create(),
        this.hullPhysicsObject.transform.position,
        vec3.fromValues(0.0, 3.0, 0.0)
      );
      let cameraOffset = vec3.sub(
        vec3.create(),
        camera.getPosition(),
        focusPoint
      );
      vec3.normalize(cameraOffset, cameraOffset);
      camera.setPosition(
        vec3.scaleAndAdd(
          vec3.create(),
          focusPoint,
          cameraOffset,
          this.cameraDistance
        )
      );
      camera.setDir(vec3.scale(vec3.create(), cameraOffset, -1.0));
    }
  }
}
