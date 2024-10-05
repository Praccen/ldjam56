import { mat4, vec3 } from "../../../../Engine";
import Transform from "../../../Shared/Transform";
import OBB from "../Shapes/OBB";

export default class PhysicsObject {
  mass: number;
  frictionCoefficient: number;
  collisionCoefficient: number;
  velocity: vec3;
  impulse: vec3;
  force: vec3;

  /**
   * True if this object never moves
   */
  isStatic: boolean;
  /**
   * True if this object is not effected by collisions (but could potentially effect other objects through collision)
   */
  isImmovable: boolean;
  /**
   * True if it's possible to collide with this object
   */
  // isCollidable: boolean;

  onGround: boolean;

  boundingBox: OBB;

  transform: Transform;

  constructor(transform?: Transform) {
    this.mass = 1.0;
    this.frictionCoefficient = 0.0;
    this.collisionCoefficient = 0.0;
    this.isStatic = false;
    this.isImmovable = false;
    // this.isCollidable = true;
    this.onGround = false;
    this.velocity = vec3.create();
    this.impulse = vec3.create();
    this.force = vec3.create();
    if (transform == undefined) {
      this.transform = new Transform();
    } else {
      this.transform = transform;
    }
    this.boundingBox = new OBB();
    this.boundingBox.setTransformMatrix(this.transform.matrix);
  }
}
