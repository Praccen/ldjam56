import {
    Camera,
    MousePicking,
    PhysicsObject,
    PhysicsScene,
    Ray,
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
    private enemies: Enemy[];
    private separationRadius: number = 3.0; // Minimum distance between enemies
    physicsObj: PhysicsObject;
    map: ProceduralMap;
    id: number;

    constructor(
        scene: Scene,
        physicsScene: PhysicsScene,
        startPos: vec2,
        endPos: vec2,
        map: ProceduralMap,
        enemies: Enemy[],
        reverse: boolean,
        id: number
    ) {
        this.physicsScene = physicsScene;
        this.map = map;
        this.enemies = enemies;
        this.id = id;

        // let aBuff = new ArrayBuffer(16);
        // let fBuff = new Float32Array(aBuff, 0, 16);
        // console.log("Size: " + String(fBuff.length));

        if (reverse) {
            this.pathFirst = this.map.findPath(endPos, startPos);
        } else {
            this.pathFirst = this.map.findPath(startPos, endPos);
        }
        this.targetPos = this.map.getRoomCenterWorldPos(this.pathFirst[0]);
        this.pathSecond.unshift(this.pathFirst.shift());

        this.physicsObj = null;
        Factories.createMesh(
            scene,
            "Assets/objs/cube.obj",
            this.targetPos,
            vec3.fromValues(1.0, 2.0, 1.0),
            "CSS:rgb(150, 0, 0)",
            "CSS:rgb(0, 0, 0)"
        ).then((mesh) => {
            this.physicsObj = physicsScene.addNewPhysicsObject(mesh.transform);
            this.physicsObj.isStatic = false;
            this.physicsObj.isImmovable = false;
            this.physicsObj.frictionCoefficient = 1.0;
            mesh.transform.origin[1] = -0.5;
        });
    }

    updateTargetPos() {
        if (
            vec3.distance(this.physicsObj.transform.position, this.targetPos) <
            1.3
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
        }
    }

    avoidObstacleCollisions() {
        this.enemies.forEach((otherEnemy) => {
            if (otherEnemy.id != this.id) {
                const distance = vec3.distance(
                    this.physicsObj.transform.position,
                    otherEnemy.physicsObj.transform.position
                );
                if (distance < this.separationRadius) {
                    // Rotate direction
                    vec3.rotateY(
                        this.physicsObj.force,
                        this.physicsObj.force,
                        vec3.fromValues(0, 0, 0),
                        (55 / 180) * Math.PI // 90 degrees in radians
                    );
                } else if (distance < this.separationRadius + 2) {
                    if (
                        vec3.dot(
                            vec3.normalize(
                                vec3.create(),
                                otherEnemy.physicsObj.velocity
                            ),
                            vec3.normalize(
                                vec3.create(),
                                this.physicsObj.velocity
                            )
                        ) < 0.2
                    ) {
                        if (vec3.len(otherEnemy.physicsObj.force) > 0.01) {
                            this.physicsObj.force = vec3.fromValues(0, 0, 0);
                        }
                    }
                }
            }
        });
    }

    move() {
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

    update(dt: number, renderer: Renderer3D) {
        if (this.physicsObj != undefined) {
            this.updateTargetPos();
            this.move();
            this.avoidObstacleCollisions();
        }
    }
}
