import { mat4, vec3 } from "../../../Engine";
import Octree, { OctreeNodeContentElement } from "../../Shared/Octree";
import Transform from "../../Shared/Transform";
import { CollisionSolver } from "./CollisionSolver";
import { IntersectionTester } from "./IntersectionTester";
import PhysicsObject from "./Objects/PhysicsObject";
import Ray from "./Shapes/Ray";

export class OctreeContentElement extends OctreeNodeContentElement {
  physicsObject: PhysicsObject;
  constructor(physicsObject: PhysicsObject) {
    super(physicsObject.boundingBox);
    this.physicsObject = physicsObject;
  }
}

export default class PhysicsScene {
  gravity: vec3;

  physicsObjects: Array<PhysicsObject>;
  octree: Octree;

  constructor() {
    this.gravity = vec3.fromValues(0.0, -9.8, 0.0);
    this.physicsObjects = new Array<PhysicsObject>();
    this.octree = new Octree(vec3.fromValues(-50, -50, -50), vec3.fromValues(50, 50, 50), 15, 5);
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

    const octreeContent = new OctreeContentElement(this.physicsObjects[length - 1]);
    this.octree.addContent(octreeContent);
    
    return this.physicsObjects[length - 1];
  }

  removePhysicsObject(physicsObject) {
    this.octree.removeContent((value: OctreeContentElement) => {return physicsObject.physicsObjectId == value.physicsObject.physicsObjectId});

    this.physicsObjects = this.physicsObjects.filter(
      (o) => physicsObject.physicsObjectId !== o.physicsObjectId
    );
  }

  doRayCast(ray: Ray, ignoreObjectsList: PhysicsObject[] = [], maxDistance: number = Infinity): {distance: number, object: PhysicsObject} {
    let octreeContentToTestAgainst = new Array<OctreeContentElement>();
    this.octree.getContentForRayCast(ray, octreeContentToTestAgainst, maxDistance);

    let closestHit = Infinity;
    let closestObj = null;
    for (let octreeContent of octreeContentToTestAgainst) {
      if (ignoreObjectsList.find((value) => {
        return value.physicsObjectId == octreeContent.physicsObject.physicsObjectId
      }) != undefined) {
        continue;
      }

      let hit = IntersectionTester.doRayCast(
        ray,
        [octreeContent.physicsObject.boundingBox],
        Math.min(maxDistance, closestHit)
      );
      if (closestHit > hit) {
        closestHit = hit;
        closestObj = octreeContent.physicsObject;
      }
    }

    return {distance: closestHit, object: closestObj};
  }

  update(dt: number, updateStaticObjects: boolean = false, calculatePhysics: boolean = true) {
    // Update all bounding boxes
    for (let physicsObject of this.physicsObjects) {
      if (!physicsObject.isStatic || updateStaticObjects) {
        physicsObject.transform.calculateMatrices();
        physicsObject.boundingBox.setUpdateNeeded();
        physicsObject.onGround = false; // Also mark them as in the air until a potential collision will set them as on ground
      }
    }

    this.octree.recalculate();
    this.octree.prune();

    if (!calculatePhysics) {
      return;
    }
    
    for (let i = 0; i < this.physicsObjects.length; i++) {
      let physicsObject = this.physicsObjects[i];
      if (physicsObject.isStatic) {
        continue;
      }
      const oldVelocity = vec3.clone(physicsObject.velocity);

      if (!physicsObject.isImmovable) {
        // Calculate collisions with other objects
        let otherObjects = new Array<OctreeContentElement>();
        this.octree.getContentFromIntersection(physicsObject.boundingBox, otherObjects);

        for (let otherObject of otherObjects) {
          if (physicsObject.physicsObjectId == otherObject.physicsObject.physicsObjectId) {
            continue; // Don't collide with self.
          }

          // Find out intersection information
          let inf = new Array<IntersectionTester.IntersectionInformation>();
          IntersectionTester.identifyIntersectionInformation(
            [physicsObject.boundingBox],
            [otherObject.physicsObject.boundingBox],
            inf
          );

          if (
            inf.length > 0
          ) {
            // Bounding boxes are intersecting
            CollisionSolver.handleCollision(
              inf,
              physicsObject,
              otherObject.physicsObject
            );
          }
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
