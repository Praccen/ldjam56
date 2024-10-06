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
    PointLight,
} from "praccen-web-engine";
import ProceduralMap from "../Generators/Map/ProceduralMapGenerator.js";

import { Factories } from "../Utils/Factories.js";
import Player from "./Player.js";

export default class Enemy {
    private physicsScene: PhysicsScene;
    private targetPos: vec3;
    private pathFirst: vec2[] = new Array<vec2>();
    private pathSecond: vec2[] = new Array<vec2>();
    private enemies: Enemy[];
    private separationRadius: number = 3.0; // Minimum distance between enemies
    private player: Player;
    private lightSource: PointLight;
    private map: ProceduralMap;
    physicsObj: PhysicsObject;

    constructor(
        scene: Scene,
        physicsScene: PhysicsScene,
        startPos: vec2,
        endPos: vec2,
        map: ProceduralMap,
        enemies: Enemy[],
        reverse: boolean,
        lightSource: PointLight,
        player: Player
    ) {
        this.physicsScene = physicsScene;
        this.map = map;
        this.enemies = enemies;
        this.lightSource = lightSource;
        this.lightSource.castShadow = true;
        this.lightSource.constant = 1.0;
        this.lightSource.linear = 0.09;
        this.lightSource.quadratic = 0.032;

        this.player = player;

        vec3.set(this.lightSource.colour, 2, 0.5, 0.5);

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
            if (otherEnemy != this) {
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
            3.0 * Math.max(distance, 10.0)
        );
    }

    updateLightPos() {
        if (this.lightSource != undefined) {
            // Get the direction the enemy is moving towards (normalize towardsTargetVector)
            let forwardDirection = vec3.sub(
                vec3.create(),
                this.targetPos,
                this.physicsObj.transform.position
            );
            forwardDirection[1] = 0;
            vec3.normalize(forwardDirection, forwardDirection);

            // Offset the light position slightly in front of the enemy
            const lightOffsetDistance = 1.0; // Adjust this value to control how far in front the light is
            let lightPosition = vec3.scaleAndAdd(
                vec3.create(),
                this.physicsObj.transform.position,
                forwardDirection,
                lightOffsetDistance
            );
            vec3.add(lightPosition, lightPosition, vec3.fromValues(0, 1, 0));

            // Set the light's position

            vec3.copy(this.lightSource.position, lightPosition);
        }
    }

    lookForPlayer() {
        if (this.player.physicsObj != undefined) {
            const distance = vec3.distance(
                this.physicsObj.transform.position,
                this.player.physicsObj.transform.position
            );
            if (distance < 100) {
                let playerDir = vec3.sub(
                    vec3.create(),
                    this.player.physicsObj.transform.position,
                    this.physicsObj.transform.position
                );
                vec3.normalize(playerDir, playerDir);

                if (
                    vec3.dot(
                        vec3.normalize(vec3.create(), this.physicsObj.velocity),
                        playerDir
                    ) > 0.75
                ) {
                    let ray = new Ray();
                    ray.setStartAndDir(
                        this.physicsObj.transform.position,
                        playerDir
                    );
                    let obj = this.physicsScene.doRayCastObj(ray);
                    if (obj == this.player.physicsObj) {
                        console.log("Get caught foo!");
                    } else if (obj == this.physicsObj) {
                        console.log("Hit self!");
                    } else {
                        console.log("Hit wall!");
                    }
                }
            }
        }
    }

    update(dt: number, renderer: Renderer3D) {
        if (this.physicsObj != undefined) {
            this.updateTargetPos();
            this.move();
            this.avoidObstacleCollisions();
            this.updateLightPos();
            this.lookForPlayer();
        }
    }
}
