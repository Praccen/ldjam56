import Camera from "../../../Objects/Camera";
import ScreenQuad from "../../../Objects/GraphicsObjects/ScreenQuad";
import LightingPassShaderProgram, {
	pointShadowsToAllocate,
} from "../../ShaderPrograms/DeferredRendering/LightingPassShaderProgram";
import Texture from "../../../AssetHandling/Textures/Texture";
import Scene from "../../Scene";

export default class LightingRenderPass {
	private gl: WebGL2RenderingContext;
	private screenQuad: ScreenQuad;
	private lightingPassShaderProgram: LightingPassShaderProgram;

	constructor(gl: WebGL2RenderingContext, lightingPassShaderProgram: LightingPassShaderProgram, inputTextures: Texture[]) {
		this.gl = gl;
		this.lightingPassShaderProgram = lightingPassShaderProgram;
		this.screenQuad = new ScreenQuad(this.gl, inputTextures);
	}

	draw(scene: Scene, camera: Camera) {
		// Disable depth testing for screen quad(s) rendering
		this.gl.disable(this.gl.DEPTH_TEST);

		// ---- Lighting pass ----
		this.lightingPassShaderProgram.use();

		this.gl.uniform3fv(this.lightingPassShaderProgram.getUniformLocation("camPos")[0], camera.getPosition());
		scene.directionalLight.bind(this.gl, this.lightingPassShaderProgram);
		scene.directionalLight.sendLightSpaceMatrix(
			this.gl,
			this.lightingPassShaderProgram.getUniformLocation("lightSpaceMatrix")[0]
		);
		// Point lights
		this.gl.uniform1i(this.lightingPassShaderProgram.getUniformLocation("nrOfPointLights")[0], scene.pointLights.length);

		// Bind pointLights, with counter as depthMapIndex
		let counter = 0;
		for (let i = 0; i < scene.pointLights.length; i++) {
			scene.pointLights[i].bind(i, counter, this.lightingPassShaderProgram);
			if (scene.pointLights[i].castShadow) {
				counter++;
			}
		}

		// Bind all textures except the point light depth maps
		for (let i = 0; i < this.screenQuad.textures.length; i++) {
			this.screenQuad.textures[i].bind(i);
		}

		// Then bind the point light depth maps
		counter = this.screenQuad.textures.length;
		for (const pointLight of scene.pointLights) {
			if (counter - this.screenQuad.textures.length >= pointShadowsToAllocate) {
				break;
			}
			if (pointLight.castShadow) {
				pointLight.pointShadowDepthMap.bind(counter++);
			}
		}

		this.screenQuad.draw(false);
		// -----------------------

		// Enable depth test again
		this.gl.enable(this.gl.DEPTH_TEST);
	}
}
