import {
    PhysicsObject,
    PhysicsScene,
    Ray,
    Renderer3D,
    Scene,
    vec2,
    vec3,
    quat,
    mat4,
    PointLight,
    AnimatedGraphicsBundle,
    GraphicsBundle,
    Transform,
} from "praccen-web-engine";
import ProceduralMap from "../Generators/Map/ProceduralMapGenerator.js";
import Player from "./Player.js";
import { Howler, Howl } from "howler";
import { Factories } from "../Utils/Factories.js";
import GameState from "../States/GameState.js";

const playerSpottingDistance: number = 30.0;

export default class Enemy {
    private readonly physicsScene: PhysicsScene;
    private targetPos: vec3;
    private readonly pathFirst: vec2[] = new Array<vec2>();
    private readonly pathSecond: vec2[] = new Array<vec2>();
    private readonly enemies: Enemy[];
    private readonly separationRadius: number = 3.0; // Minimum distance between enemies
    private readonly player: Player;
    private readonly lightSource: PointLight;
    private readonly map: ProceduralMap;
    private animatedMesh: AnimatedGraphicsBundle;
    physicsObj: PhysicsObject;
    private readonly currentRotation: quat = quat.create();
    private readonly step: Howl;
    private lanternMesh: GraphicsBundle;
    private time: number = 0;
    private gameState: GameState;

    constructor(
        scene: Scene,
        physicsScene: PhysicsScene,
        startPos: vec2,
        endPos: vec2,
        map: ProceduralMap,
        enemies: Enemy[],
        lightSource: PointLight,
        player: Player,
        renderer: Renderer3D,
        gameState: GameState
    ) {
        this.gameState = gameState;
        this.physicsScene = physicsScene;
        this.map = map;
        this.enemies = enemies;
        this.lightSource = lightSource;
        this.lightSource.castShadow = true;
        this.lightSource.constant = 1.0;
        this.lightSource.linear = 0.09;
        this.lightSource.quadratic = 0.032;

        this.player = player;

        vec3.set(this.lightSource.colour, 3, 0.5, 0.5);

        // console.log("Start: ", startPos);
        // console.log("End", endPos);
        this.pathFirst = this.map.findPath(startPos, endPos);
        this.targetPos = this.map.getRoomCenterWorldPos(this.pathFirst[0]);
        this.pathSecond.unshift(this.pathFirst.shift());

        this.physicsObj = null;
        this.animatedMesh = null;

        this.step = new Howl({
            src: ["Assets/Audio/foot_down.wav"],
            volume: 5.0,
            rate: 1.0,
            spatial: true,
            pos: [this.targetPos[0], this.targetPos[1], this.targetPos[2]],
            panningModel: "HRTF", // HRTF for realistic 3D audio
            refDistance: 10,
            rolloffFactor: 1,
        });

        scene
            .addNewAnimatedMesh(
                "Assets/gltf/Rat/RatLanternWalk.gltf",
                "Assets/gltf/Rat/Colour.png",
                "CSS:rgb(0,0,0)"
            )
            .then((aMeshBundle) => {
                aMeshBundle.emission = renderer.textureStore.getTexture(
                    "Assets/gltf/Rat/Image_3.png"
                );

                this.animatedMesh = aMeshBundle;
                vec3.copy(aMeshBundle.transform.position, this.targetPos);
                vec3.set(aMeshBundle.transform.scale, 0.5, 0.5, 0.5);
                vec3.set(aMeshBundle.transform.origin, 0.0, 0.5, 0.0);

                this.physicsObj = physicsScene.addNewPhysicsObject(
                    aMeshBundle.transform
                );
                this.physicsObj.isStatic = false;
                this.physicsObj.isImmovable = false;
                this.physicsObj.frictionCoefficient = 1.0;
                this.physicsObj.boundingBox.setMinAndMaxVectors(
                    vec3.fromValues(-1.0, 0.0, -1.0),
                    vec3.fromValues(1.0, 3.0, 1.0)
                );
            });

        this.lanternMesh = null;
        Factories.createMesh(
            scene,
            "Assets/objs/Lantern.obj",
            vec3.fromValues(15.0, 2.0, 12.0),
            vec3.fromValues(1.0, 1.0, 1.0),
            "CSS:rgb(150,0,0)",
            "CSS:rgb(0,0,0)"
        ).then((mesh) => {
            this.lanternMesh = mesh;
        });
    }

    updateTargetPos() {
        if (
            vec3.distance(this.physicsObj.transform.position, this.targetPos) <
            3.5
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
                if (otherEnemy.physicsObj == undefined) {
                    return;
                }
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

    playStepSound() {
        if (!this.step.playing()) {
            this.step.play();
            this.step.pos(this.physicsObj.transform.position);
        }
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

        this.smoothTurnTowardsTarget(towardsTargetVector);

        let currentDirection = this.getCurrentForwardDirection();

        vec3.scaleAndAdd(
            this.physicsObj.force,
            this.physicsObj.force,
            currentDirection,
            3.0 * Math.max(distance, 10.0)
        );
        // this.playSteIpSound();
    }

    smoothTurnTowardsTarget(targetDirection: vec3) {
        let targetRotation = quat.create();
        quat.rotationTo(
            targetRotation,
            vec3.fromValues(0, 0, 1),
            targetDirection
        );

        const rotationSpeed = 0.01;
        quat.slerp(
            this.currentRotation,
            this.currentRotation,
            targetRotation,
            rotationSpeed
        );

        let newRotationMatrix = mat4.create();
        mat4.fromQuat(newRotationMatrix, this.currentRotation);
        mat4.getRotation(this.physicsObj.transform.rotation, newRotationMatrix);
    }

    getCurrentForwardDirection(): vec3 {
        let forward = vec3.fromValues(0, 0, 1);
        vec3.transformQuat(forward, forward, this.currentRotation);
        return forward;
    }

    updateLightPos() {
        if (this.lightSource != undefined) {
            let forwardDirection = this.getCurrentForwardDirection();

            const lightOffsetDistance = 2.0;
            let lightPosition = vec3.scaleAndAdd(
                vec3.create(),
                this.physicsObj.transform.position,
                forwardDirection,
                lightOffsetDistance
            );
            vec3.add(lightPosition, lightPosition, vec3.fromValues(0, 1, 0));

            vec3.copy(this.lightSource.position, lightPosition);
        }
    }

    lookForPlayer(dt: number) {
        this.time += dt;
        if (this.player.physicsObj != undefined) {
            const distance = vec3.distance(
                this.physicsObj.transform.position,
                this.player.physicsObj.transform.position
            );
            if (distance < playerSpottingDistance) {
                let playerDir = vec3.sub(
                    vec3.create(),
                    this.player.physicsObj.transform.position,
                    this.physicsObj.transform.position
                );
                playerDir[1] = 0.0;
                vec3.normalize(playerDir, playerDir);

                if (
                    vec3.dot(
                        vec3.normalize(
                            vec3.create(),
                            this.physicsObj.velocity
                        ),
                        playerDir
                    ) > 0.75
                ) {
                    let ray = new Ray();
                    ray.setStartAndDir(
                        vec3.add(
                            vec3.create(),
                            this.physicsObj.transform.position,
                            vec3.fromValues(0.0, 0.2, 0.0)
                        ),
                        playerDir
                    );
                    let hitObject = this.map.wallsPhysicsScene.doRayCast(
                        ray,
                        [this.physicsObj]
                    ).object;
                    if (hitObject.physicsObjectId === this.player.physicsObj.physicsObjectId) {
                        // console.log("hit player");
                        this.gameState.gameOver = true;
                        this.gameState.playerSpottedByEnemy = this;
                    }
                }
            }
        }
    }

    preRenderingUpdate(dt: number) {
        if (this.animatedMesh != undefined) {
            if (vec3.len(this.physicsObj.velocity) > 1.0) {
                let keyframe = this.animatedMesh.animate(0, dt);
                if (keyframe == 10 || keyframe == 28) {
                    this.playStepSound();
                }

                if (
                    this.lanternMesh != undefined &&
                    this.animatedMesh.graphicsObjectAndGltfObject.gltfObject !=
                        undefined
                ) {
                    let handIndex =
                        this.animatedMesh.graphicsObjectAndGltfObject.gltfObject.nodeNameToIndexMap.get(
                            "Rat:LeftHand"
                        );
                    if (handIndex != undefined) {
                        let node =
                            this.animatedMesh.graphicsObjectAndGltfObject
                                .gltfObject.nodes[handIndex];

                        let mat = mat4.create();

                        mat4.translate(
                            mat,
                            mat,
                            vec3.fromValues(1.4, 2.2, -2.2)
                        );
                        mat4.scale(mat, mat, vec3.fromValues(0.5, 0.5, 0.5));
                        mat4.mul(mat, node.transform.matrix, mat);
                        mat4.mul(mat, this.animatedMesh.transform.matrix, mat);

                        this.lanternMesh.transform.position =
                            vec3.transformMat4(
                                vec3.create(),
                                vec3.create(),
                                mat
                            );
                        vec3.set(
                            this.lanternMesh.transform.scale,
                            0.4,
                            0.4,
                            0.4
                        );
                        quat.copy(
                            this.lanternMesh.transform.rotation,
                            this.animatedMesh.transform.rotation
                        );
                        quat.rotateY(
                            this.lanternMesh.transform.rotation,
                            this.lanternMesh.transform.rotation,
                            Math.PI * 0.5
                        );
                        vec3.add(
                            this.lightSource.position,
                            this.lanternMesh.transform.position,
                            vec3.fromValues(0.0, -0.55, 0.0)
                        );
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
            this.lookForPlayer(dt);
        }
    }
}
