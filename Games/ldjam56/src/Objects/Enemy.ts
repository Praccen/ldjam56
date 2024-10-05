import {
  Camera,
  MousePicking,
  PhysicsObject,
  PhysicsScene,
  Renderer3D,
  Scene,
  vec2,
  vec3,
} from "praccen-web-engine";
import ProceduralMap from "../Generators/Map/ProceduralMapGenerator.js";

import { Factories } from "../Utils/Factories.js";

export default class Enemy {
  private physicsScene: PhysicsScene;
  private targetPos: vec3;
  private pathFirst: vec2[] = new Array<vec2>();
  private pathSecond: vec2[] = new Array<vec2>();
  physicsObj: PhysicsObject;
  map: ProceduralMap;

  constructor(
    scene: Scene,
    physicsScene: PhysicsScene,
    spawnPos: vec2,
    map: ProceduralMap
  ) {
    this.physicsScene = physicsScene;

    this.map = map;

    this.pathFirst = this.map.findPath(
      vec2.fromValues(1, 1),
      vec2.fromValues(11, 11)
    );

    this.targetPos = this.map.getRoomCenterWorldPos(this.pathFirst[0]);
    console.log(this.targetPos);
    this.pathSecond.unshift(this.pathFirst.shift());

    this.physicsObj = null;
    Factories.createMesh(
      scene,
      "Assets/objs/cube.obj",
      vec3.fromValues(5.0, 1, 5.0),
      vec3.fromValues(1.0, 2.0, 1.0),
      "CSS:rgb(150, 0, 0)",
      "CSS:rgb(0, 0, 0)"
    ).then((mesh) => {
      this.physicsObj = physicsScene.addNewPhysicsObject(mesh.transform);
      this.physicsObj.isStatic = false;
      this.physicsObj.frictionCoefficient = 1.0;
      mesh.transform.origin[1] = -0.5;
    });
  }

  update(dt: number, renderer: Renderer3D) {
    if (this.physicsObj != undefined) {
      if (
        vec3.distance(this.physicsObj.transform.position, this.targetPos) < 1.3
      ) {
        if (this.pathFirst.length == 0) {
          // Clone array
          this.pathSecond.forEach((val) =>
            this.pathFirst.push(Object.assign({}, val))
          );
          this.pathSecond.length = 0;
        }
        this.targetPos = this.map.getRoomCenterWorldPos(this.pathFirst[0]);
        this.pathSecond.unshift(this.pathFirst.shift());

        console.log("New target!");
      }

      let towardsTargetVector = vec3.sub(
        vec3.create(),
        this.targetPos,
        this.physicsObj.transform.position
      );
      towardsTargetVector[1] = 0.0;
      let distance = vec3.len(towardsTargetVector);
      vec3.normalize(towardsTargetVector, towardsTargetVector);
      vec3.scaleAndAdd(
        this.physicsObj.force,
        this.physicsObj.force,
        towardsTargetVector,
        5.0 * Math.max(distance, 10.0)
      );
    }
  }
}
