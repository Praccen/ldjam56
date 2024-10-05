import Scene from "../../Scene";
import Camera from "../../../Objects/Camera";
import { vec3 } from "gl-matrix";
import { pointShadowsToAllocate } from "../../ShaderPrograms/DeferredRendering/LightingPassShaderProgram";
import PointShadowShaderProgram from "../../ShaderPrograms/ShadowMapping/PointShadowShaderProgram";
import PointShadowInstancedShaderProgram from "../../ShaderPrograms/ShadowMapping/PointShadowInstancedShaderProgram";
import PointShadowSkeletalAnimationShaderProgram from "../../ShaderPrograms/ShadowMapping/PointShadowSkeletalAnimationShaderProgram";

export default class PointShadowRenderPass {
	private gl: WebGL2RenderingContext;
	private shadowResolution: number;

	private pointShadowShaderProgram: PointShadowShaderProgram;
	private pointShadowInstancedShaderProgram: PointShadowInstancedShaderProgram;
	private pointShadowSkeletalAnimationShaderProgram: PointShadowSkeletalAnimationShaderProgram;

	private frameCounter: number;

	constructor(gl: WebGL2RenderingContext, pointShadowShaderProgram: PointShadowShaderProgram, pointShadowInstancedShaderProgram: PointShadowInstancedShaderProgram, pointShadowSkeletalAnimationShaderProgram: PointShadowSkeletalAnimationShaderProgram) {
		this.pointShadowShaderProgram = pointShadowShaderProgram;
		this.pointShadowInstancedShaderProgram = pointShadowInstancedShaderProgram;
		this.pointShadowSkeletalAnimationShaderProgram = pointShadowSkeletalAnimationShaderProgram;
		this.gl = gl;
		this.shadowResolution = 501;
	}

	setShadowMappingResolution(res: number) {
		this.shadowResolution = res;
	}

	draw(scene: Scene) {
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.FRONT);

		this.gl.viewport(0, 0, this.shadowResolution, this.shadowResolution);

		let pointLightCamera = new Camera();
		pointLightCamera.setFOV(90);
		pointLightCamera.setAspectRatio(1);
		pointLightCamera.setFarPlaneDistance(100.0);

		const directions = [
			vec3.fromValues(1.0, 0.0, 0.0),
			vec3.fromValues(-1.0, 0.0, 0.0),
			vec3.fromValues(0.0, -1.0, 0.0),
			vec3.fromValues(0.0, 1.0, 0.0),
			vec3.fromValues(0.0, 0.0, -1.0),
			vec3.fromValues(0.0, 0.0, 1.0),
		];
		const ups = [
			vec3.fromValues(0.0, 1.0, 0.0),
			vec3.fromValues(0.0, 1.0, 0.0),
			vec3.fromValues(0.0, 0.0, -1.0),
			vec3.fromValues(0.0, 0.0, 1.0),
			vec3.fromValues(0.0, 1.0, 0.0),
			vec3.fromValues(0.0, 1.0, 0.0),
		];

		let counter = 0;
		for (let pointLight of scene.pointLights) {
			if (counter >= pointShadowsToAllocate) {
				break;
			}
			if (pointLight.castShadow /*&& !pointLight.depthMapGenerated*/) {
				counter++;
				// pointLight.depthMapGenerated = true;

				pointLightCamera.setPosition(pointLight.position);

				pointLight.pointShadowBuffer.bind(this.gl.FRAMEBUFFER);
				pointLight.pointShadowDepthMap.setTextureData(
					null,
					this.shadowResolution,
					this.shadowResolution
				); // Make sure the textures are correct size. TODO: Is this super slow?

				for (let i = 0; i < directions.length; i++) {
					pointLightCamera.setDir(directions[i]);
					pointLightCamera.setUp(ups[i]);
					this.gl.framebufferTexture2D(
						this.gl.FRAMEBUFFER,
						this.gl.DEPTH_ATTACHMENT,
						this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
						pointLight.pointShadowDepthMap.texture,
						0
					);
					
					this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

					// ---- Shadow pass ----
					this.pointShadowShaderProgram.use();

					//Set uniforms
					pointLightCamera.bindViewProjMatrix(
						this.gl,
						this.pointShadowShaderProgram.getUniformLocation("lightSpaceMatrix")[0]
					);
					this.gl.uniform3fv(
						this.pointShadowShaderProgram.getUniformLocation("cameraPos")[0],
						pointLightCamera.getPosition()
					);

					//Render shadow pass
					scene.renderScene(this.pointShadowShaderProgram, false);

					
					// Instanced
					this.pointShadowInstancedShaderProgram.use();

					//Set uniforms
					pointLightCamera.bindViewProjMatrix(
						this.gl,
						this.pointShadowInstancedShaderProgram.getUniformLocation("lightSpaceMatrix")[0]
					);
					this.gl.uniform3fv(
						this.pointShadowInstancedShaderProgram.getUniformLocation("cameraPos")[0],
						pointLightCamera.getPosition()
					);

					//Render shadow pass
					scene.renderSceneInstanced(this.pointShadowInstancedShaderProgram, false);

					// Animated
					this.pointShadowSkeletalAnimationShaderProgram.use();

					//Set uniforms
					pointLightCamera.bindViewProjMatrix(
						this.gl,
						this.pointShadowSkeletalAnimationShaderProgram.getUniformLocation("lightSpaceMatrix")[0]
					);
					this.gl.uniform3fv(
						this.pointShadowSkeletalAnimationShaderProgram.getUniformLocation("cameraPos")[0],
						pointLightCamera.getPosition()
					);

					//Render shadow pass
					scene.renderSceneAnimated(this.pointShadowSkeletalAnimationShaderProgram, false);
				}
			}
		}

		this.gl.disable(this.gl.CULL_FACE);
	}
}
