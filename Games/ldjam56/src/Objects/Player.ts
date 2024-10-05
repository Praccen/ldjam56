import { Camera, MousePicking, PhysicsObject, PhysicsScene, Renderer3D, Scene, vec2, vec3 } from "praccen-web-engine";
import { Input } from "../Input.js";
import { Factories } from "../Utils/Factories.js";

export default class Player {
    private physicsScene: PhysicsScene;
    private playerTargetPos: vec3; 
    physicsObj: PhysicsObject;

    constructor(scene: Scene, physicsScene: PhysicsScene, playerSpawnRoom: vec2) {
        this.physicsScene = physicsScene;
        this.playerTargetPos = vec3.fromValues(playerSpawnRoom[0] * 10.0 + 5.0, 1.0, playerSpawnRoom[1] * 10.0 + 5.0);
        this.physicsObj = null;
        Factories.createMesh(scene, "Assets/objs/cube.obj", vec3.clone(this.playerTargetPos), vec3.fromValues(1.0, 2.0, 1.0), "CSS:rgb(150, 0, 0)", "CSS:rgb(0, 0, 0)").then((mesh) => {
            this.physicsObj = physicsScene.addNewPhysicsObject(mesh.transform);
            this.physicsObj.isStatic = false;
            this.physicsObj.frictionCoefficient = 1.0;
            mesh.transform.origin[1] = -0.5;
        });
    }

    update(dt: number, camera: Camera, renderer: Renderer3D) {
        if (Input.mouseRightClicked) {
            let rect = renderer.domElement.getClientRects()[0];
            let ndc = vec2.fromValues((Input.mousePosition.x - rect.left) / rect.width, (Input.mousePosition.y - rect.top) / rect.height);
            ndc[0] = ndc[0] * 2.0 - 1.0;
            ndc[1] = ndc[1] * -2.0 + 1.0;
    
            let ray = MousePicking.GetRay(camera, ndc);
            let dist = this.physicsScene.doRayCast(ray);
            if (dist < Infinity) {
                vec3.scaleAndAdd(this.playerTargetPos, camera.getPosition(), ray.getDir(), dist);
            }
        }
        if (this.physicsObj != undefined) {
            let towardsTargetVector = vec3.sub(vec3.create(), this.playerTargetPos, this.physicsObj.transform.position);
            towardsTargetVector[1] = 0.0;
            let distance = vec3.len(towardsTargetVector);
            vec3.normalize(towardsTargetVector, towardsTargetVector);
            vec3.scaleAndAdd(this.physicsObj.force, this.physicsObj.force, towardsTargetVector, 50.0 * Math.min(distance, 4.0));
        }
    }

    preRenderingUpdate(dt: number) {

    }
}