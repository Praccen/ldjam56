import * as ENGINE from "../../dist/Engine.esm.js"
import { vec3, mat4, quat, Ray} from "../../dist/Engine.esm.js";

const legMoveDuration = 0.1;

class Leg {
	anchorTransform;
    foot;
    joint;
	oldPos;
	targetPos;
	legMoveTimer;
}

export default class Spider {
	speed;

	body;
    parentTransform;
    parentPhysicsObj;
	legs;
	spiderForward;
	spiderUp;
	spiderRight;

	pointLight;	

	targetPos;

    physicsScene;
    localPhysicsScene;

	constructor(scene, physicsScene) {
        this.physicsScene = physicsScene;
        this.localPhysicsScene = new ENGINE.PhysicsScene();
        vec3.zero(this.localPhysicsScene.gravity);

		this.speed = 3.0;
		this.targetPos = vec3.fromValues(0.0, -1.5, 5.0);

        this.parentTransform = new ENGINE.Transform();
        this.parentTransform.setTranslation(vec3.fromValues(0.0, -1.5, -10.0));
        this.parentPhysicsObj = this.localPhysicsScene.addNewPhysicsObject(this.parentTransform);
		
		this.body = scene.addNewMesh("Assets/SpiderBody.obj", "CSS:rgb(30,30,30)", "CSS:rgb(0,0,0)");
        vec3.set(this.body.transform.origin, 0.0, -0.5, 0.0);
		this.body.transform.parentTransform = this.parentTransform;

		this.legs = new Array();

		const anchorOffsets = [
			vec3.fromValues(1.0, 1.0, 1.5),
			vec3.fromValues(-1.0, 1.0, 1.5),
			vec3.fromValues(1.0, 1.0, 0.5),
			vec3.fromValues(-1.0, 1.0, 0.5),
			vec3.fromValues(1.0, 1.0, -0.5),
			vec3.fromValues(-1.0, 1.0, -0.5),
			vec3.fromValues(1.0, 1.0, -1.5),
			vec3.fromValues(-1.0, 1.0, -1.5),
		];

		for (let i = 0; i < anchorOffsets.length; i++) {
			this.legs.push(new Leg());
			let leg = this.legs[i];

            leg.anchorTransform = new ENGINE.Transform();
            vec3.copy(leg.anchorTransform.position, anchorOffsets[i]);
			vec3.set(leg.anchorTransform.scale, 0.3, 0.3, 0.3);
			vec3.set(leg.anchorTransform.origin, -anchorOffsets[i][0] * 0.5, 0.0, 0.0);

			leg.foot = scene.addNewMesh(
                "Assets/cube.obj",
                "CSS:rgb(30,30,30)",
                "CSS:rgb(0,0,0)"
            );

			vec3.set(leg.foot.transform.origin, 0.0, -0.5, 0.0);
			vec3.set(leg.foot.transform.scale, 0.3, 0.3, 0.3);
			vec3.copy(leg.foot.transform.position, this.parentTransform.position);

			leg.joint = scene.addNewMesh(
                "Assets/cube.obj",
                "CSS:rgb(30,30,30)",
                "CSS:rgb(0,0,0)"
            );

			leg.joint.transform = new ENGINE.Transform();
			vec3.set(leg.joint.transform.origin, 0.0, -0.5, 0.0);
			vec3.set(leg.joint.transform.scale, 0.3, 0.3, 0.3);

			leg.targetPos = vec3.clone(leg.foot.transform.position);
			leg.oldPos = vec3.clone(leg.foot.transform.position);
			leg.legMoveTimer = 1.0;
		}

		this.spiderForward = vec3.fromValues(0.0, 0.0, 1.0);
		this.spiderUp = vec3.fromValues(0.0, 1.0, 0.0);
		this.spiderRight = vec3.fromValues(1.0, 0.0, 0.0);

		// Add a point light
		this.pointLight = scene.addNewPointLight();
		this.pointLight.castShadow = true; // Allow it to create shadows
		vec3.set(this.pointLight.colour, 1.0, 0.0, 0.0);
	}

	respawn() {
        this.parentTransform.setTranslation(vec3.fromValues(0.0, -1.5, 0.0));
        vec3.zero(this.parentPhysicsObj.velocity);
		vec3.set(this.targetPos, 0.0, -1.5, 5.0);
	}

	setTarget(targetPos) {
		vec3.copy(this.targetPos, targetPos);
	}

	update(dt) {
		let dir = vec3.sub(vec3.create(), this.targetPos, this.parentTransform.position);
		dir[1] = 0.0;
		vec3.normalize(dir, dir);

		if (vec3.squaredDistance(this.targetPos, this.parentTransform.position) > 2.0) {
			let top = vec3.add(
				vec3.create(),
				this.parentTransform.position,
				vec3.fromValues(0.0, this.parentTransform.scale[1], 0.0)
			);

			let ray = new Ray();
			ray.setStartAndDir(top, vec3.add(vec3.create(), dir, vec3.fromValues(0.0, -1.0, 0.0)));
			let hitDistance = this.physicsScene.doRayCast(ray, 4.0);
			if (hitDistance < Infinity) {
				vec3.scale(this.parentPhysicsObj.velocity, dir, hitDistance * this.speed);
				this.parentPhysicsObj.velocity[1] += (2.0 - hitDistance) * this.speed;
			} else {
				this.parentPhysicsObj.force[1] = -this.speed * 4.8;
				ray.setStartAndDir(
					vec3.scaleAndAdd(vec3.create(), this.parentTransform.position, dir, 1.0),
					vec3.add(vec3.create(), dir, vec3.fromValues(0.0, -1.0, 0.0))
				);
				let hitDistance = this.physicsScene.doRayCast(ray, 3.0);
				if (hitDistance < Infinity) {
					this.parentPhysicsObj.velocity[1] = -hitDistance;
				}
			}

			let yaw = Math.atan2(dir[0], dir[2]);
			let pitch = Math.asin(vec3.normalize(vec3.create(), this.parentPhysicsObj.velocity)[1]);
			quat.identity(this.parentTransform.rotation);
			quat.rotateY(this.parentTransform.rotation, this.parentTransform.rotation, yaw);
			quat.rotateX(this.parentTransform.rotation, this.parentTransform.rotation, -pitch);

			vec3.transformQuat(
				this.spiderForward,
				vec3.fromValues(0.0, 0.0, 1.0),
				this.parentTransform.rotation
			);
			vec3.transformQuat(
				this.spiderUp,
				vec3.fromValues(0.0, 1.0, 0.0),
				this.parentTransform.rotation
			);
			vec3.transformQuat(
				this.spiderRight,
				vec3.fromValues(1.0, 0.0, 0.0),
				this.parentTransform.rotation
			);
		} else {
			vec3.zero(this.parentPhysicsObj.velocity);
		}

		let right = 1;
		for (let leg of this.legs) {
            let tempMatrix = mat4.create();
            this.parentTransform.calculateMatrix(tempMatrix, false);
			leg.anchorTransform.calculateMatrix(tempMatrix, false);
            let anchorPos = vec3.transformMat4(vec3.create(), vec3.create(), tempMatrix);
            
			if (vec3.dist(anchorPos, leg.targetPos) > 3.0) {
				vec3.copy(leg.oldPos, leg.foot.transform.position);
				leg.legMoveTimer = 0.0;
				let bestAngle = -1.0;
				let distance = 0.0;
				let direction = vec3.create();
				let anchorOffset = vec3.subtract(vec3.create(), anchorPos, this.parentTransform.position);
				let spiderOut = vec3.scale(vec3.create(), this.spiderRight, right);
				let ray = new Ray();
				let rayStart = vec3.scaleAndAdd(vec3.create(), anchorPos, spiderOut, 0.5);
				// let rayStart = anchorPos;
				ray.setStart(rayStart);

				for (let rayDir of [
					vec3.mul(vec3.create(), anchorOffset, vec3.fromValues(1.0, -2.0, 1.0)),
					vec3.mul(vec3.create(), anchorOffset, vec3.fromValues(1.0, -1.0, 1.0)),
					vec3.add(vec3.create(), this.spiderForward, this.spiderUp),
					vec3.add(vec3.create(), anchorOffset, this.spiderUp),
					vec3.sub(vec3.create(), spiderOut, this.spiderUp),
					vec3.sub(vec3.create(), vec3.scale(vec3.create(), spiderOut, -0.9), this.spiderUp),
					vec3.scale(vec3.create(), this.spiderUp, -1.0),
					dir,
				]) {
					ray.setDir(rayDir);
					let dotVal = vec3.dot(vec3.normalize(vec3.create(), dir), ray.getDir());
					let rayResult = this.physicsScene.doRayCast(ray, 3.0);
					if (rayResult < Infinity && dotVal > bestAngle) {
						bestAngle = dotVal;
						vec3.copy(direction, ray.getDir());
						distance = rayResult;
					}
				}

				if (bestAngle > -1.0) {
					vec3.scaleAndAdd(leg.targetPos, rayStart, direction, distance);
				}
			}

			if (leg.legMoveTimer < 1.0) {
				leg.legMoveTimer += dt / legMoveDuration;
				vec3.lerp(leg.foot.transform.position, leg.oldPos, leg.targetPos, leg.legMoveTimer);
			}

			// ---- Calculate foot peice size and rotation ----
			let jointPos = vec3.scale(
				vec3.create(),
				vec3.sub(vec3.create(), anchorPos, leg.foot.transform.position),
				0.5
			);
			vec3.scaleAndAdd(jointPos, jointPos, this.spiderUp, 2.0);
			leg.foot.transform.scale[1] = vec3.len(jointPos);

			let yaw = Math.atan2(jointPos[2], jointPos[0]);
			let pitch = Math.acos(vec3.normalize(vec3.create(), jointPos)[1]);
			quat.identity(leg.foot.transform.rotation);
			quat.rotateY(leg.foot.transform.rotation, leg.foot.transform.rotation, -yaw);
			quat.rotateZ(leg.foot.transform.rotation, leg.foot.transform.rotation, -pitch);
			// ------------------------------------------------

			// ---- Calculate joint peice size and rotation ----
			vec3.copy(leg.joint.transform.position, anchorPos);
			vec3.subtract(jointPos, vec3.add(jointPos, leg.foot.transform.position, jointPos), anchorPos);
			leg.joint.transform.scale[1] = vec3.len(jointPos);
			yaw = Math.atan2(jointPos[2], jointPos[0]);
			pitch = Math.acos(vec3.normalize(vec3.create(), jointPos)[1]);
			quat.identity(leg.joint.transform.rotation);
			quat.rotateY(leg.joint.transform.rotation, leg.joint.transform.rotation, -yaw);
			quat.rotateZ(leg.joint.transform.rotation, leg.joint.transform.rotation, -pitch);
			// -------------------------------------------------

			right *= -1;
		}
        this.localPhysicsScene.update(dt);
		
		vec3.transformMat4(this.pointLight.position , vec3.fromValues(0.0, 0.5, 2.7), this.parentTransform.matrix);
	}
}