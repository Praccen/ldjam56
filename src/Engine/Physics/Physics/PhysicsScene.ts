import { mat4, vec3 } from "../../../Engine";
import Transform from "../../Shared/Transform";
import { CollisionSolver } from "./CollisionSolver";
import { IntersectionTester } from "./IntersectionTester";
import PhysicsObject from "./Objects/PhysicsObject";
import Ray from "./Shapes/Ray";

export default class PhysicsScene {
  gravity: vec3;

  physicsObjects: Array<PhysicsObject>;

  constructor() {
    this.gravity = vec3.fromValues(0.0, -9.8, 0.0);
    this.physicsObjects = new Array<PhysicsObject>();
  }

  /**
   * Will add a physics object to the PhysicsScene. Will create a new object if none is passed as a parameter.
   * @param physicsObject Optional: Already existing physics object, maybe from another physics scene
   * @returns the physics object
   */
  addNewPhysicsObject(
    transform?: Transform,
    physicsObject?: PhysicsObject
  ): PhysicsObject {
    let length = -1;
    if (physicsObject != undefined) {
      length = this.physicsObjects.push(physicsObject);
    } else {
      length = this.physicsObjects.push(new PhysicsObject(transform));
    }
    return this.physicsObjects[length - 1];
  }

  doRayCast(ray: Ray, ignoreObjectsList: PhysicsObject[] = [], maxDistance: number = Infinity): {distance: number, object: PhysicsObject} {
    let closestHit = Infinity;
    let closestObj = undefined;
    for (let physicsObject of this.physicsObjects) {
      if (ignoreObjectsList.find((value) => {return value == physicsObject})) {
        continue;
      }
      let hit = IntersectionTester.doRayCast(
        ray,
        [physicsObject.boundingBox],
        Math.min(maxDistance, closestHit)
      );
      if (closestHit > hit) {
        closestHit = hit;
        closestObj = physicsObject;
      }
    }
    return {distance: closestHit, object: closestObj};
  }

  removePhysicsObject(physicsObject) {
    this.physicsObjects = this.physicsObjects.filter(
      (o) => physicsObject !== o
    );
  }

  update(dt: number) {
    // Update all bounding boxes
    for (let physicsObject of this.physicsObjects) {
      physicsObject.transform.calculateMatrices();
      physicsObject.boundingBox.setUpdateNeeded();
      physicsObject.onGround = false; // Also mark them as in the air until a potential collision will set them as on ground
    }

    for (let i = 0; i < this.physicsObjects.length; i++) {
      let physicsObject = this.physicsObjects[i];
      const oldVelocity = vec3.clone(physicsObject.velocity);

      // Calculate collisions with other objects
      for (let j = i + 1; j < this.physicsObjects.length; j++) {
        if (
          IntersectionTester.identifyIntersection(
            [physicsObject.boundingBox],
            [this.physicsObjects[j].boundingBox]
          )
        ) {
          // Bounding boxes are intersecting

          // Find out intersection information
          let inf = new Array<IntersectionTester.IntersectionInformation>();
          IntersectionTester.identifyIntersectionInformation(
            [physicsObject.boundingBox],
            [this.physicsObjects[j].boundingBox],
            inf
          );

          CollisionSolver.handleCollision(
            inf,
            physicsObject,
            this.physicsObjects[j]
          );
        }
      }

      if (!physicsObject.isStatic) {
        // Calculate new velocity based on gravity, forces and impulses
        vec3.scaleAndAdd(
          physicsObject.velocity,
          physicsObject.velocity,
          this.gravity,
          dt
        );
        vec3.scaleAndAdd(
          physicsObject.velocity,
          physicsObject.velocity,
          physicsObject.force,
          dt / physicsObject.mass
        );
        vec3.scaleAndAdd(
          physicsObject.velocity,
          physicsObject.velocity,
          physicsObject.impulse,
          1.0 / physicsObject.mass
        );

        vec3.zero(physicsObject.force);
        vec3.zero(physicsObject.impulse);

        let translation = vec3.scale(
          vec3.create(),
          vec3.add(vec3.create(), oldVelocity, physicsObject.velocity),
          0.5 * dt
        );
        if (vec3.len(translation) > 0.001) {
          physicsObject.transform.translate(translation);
          physicsObject.transform.calculateMatrices();
        }
      }
    }
  }
}
