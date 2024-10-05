import DirectionalLight from "../Objects/Lighting/DirectionalLight";
import PointLight from "../Objects/Lighting/PointLight";
import GraphicsBundle from "../Objects/Bundles/GraphicsBundle";
import ShaderProgram from "./ShaderPrograms/ShaderProgram";
import ParticleSpawner from "../Objects/InstancedGraphicsObjects/ParticleSpawner";
import { pointLightsToAllocate } from "./ShaderPrograms/DeferredRendering/LightingPassShaderProgram";
import RendererBase from "./RendererBase";
import AnimatedGraphicsBundle from "../Objects/Bundles/AnimatedGraphicsBundle";

export default class Scene {
	renderer: RendererBase;

	// ---- Graphics objects ----
	private graphicBundles: Array<GraphicsBundle>;
	private graphicBundlesInstanced: Array<GraphicsBundle>;
	private graphicBundlesAnimated: Array<AnimatedGraphicsBundle>;
	particleSpawners: Array<ParticleSpawner>;
	// --------------------------

	// ---- Lights ----
	directionalLight: DirectionalLight;
	pointLights: Array<PointLight>;
	// ----------------

	constructor(renderer: RendererBase) {
		this.renderer = renderer;

		// ---- Graphics objects ----
		this.graphicBundles = new Array<GraphicsBundle>();
		this.graphicBundlesInstanced = new Array<GraphicsBundle>();
		this.graphicBundlesAnimated = new Array<AnimatedGraphicsBundle>();
		this.particleSpawners = new Array<ParticleSpawner>();
		// --------------------------

		// ---- Lighting ----
		this.directionalLight = new DirectionalLight();
		this.pointLights = new Array<PointLight>();
		// ------------------
	}

	async addNewMesh(meshPath: string, diffusePath: string, specularPath: string): Promise<GraphicsBundle> {
		return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
			const length = this.graphicBundles.push(
				new GraphicsBundle(
					this.renderer.gl,
					this.renderer.textureStore.getTexture(diffusePath),
					this.renderer.textureStore.getTexture(specularPath),
					mesh
				)
			);
			return this.graphicBundles[length - 1];
		});
	}

	async addNewInstancedMesh(meshPath: string, diffusePath: string, specularPath: string): Promise<GraphicsBundle> {
		return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
			const length = this.graphicBundlesInstanced.push(
				new GraphicsBundle(
					this.renderer.gl,
					this.renderer.textureStore.getTexture(diffusePath),
					this.renderer.textureStore.getTexture(specularPath),
					mesh,
					null,
					true
				)
			);
			return this.graphicBundlesInstanced[length - 1];
		});
	}

	async addNewAnimatedMesh(meshPath: string, diffusePath: string, specularPath: string): Promise<AnimatedGraphicsBundle> {
		return this.renderer.meshStore.getAmimatedMesh(meshPath).then((mesh) => {
			const length = this.graphicBundlesAnimated.push(
				new AnimatedGraphicsBundle(
					this.renderer.gl,
					this.renderer.textureStore.getTexture(diffusePath),
					this.renderer.textureStore.getTexture(specularPath),
					mesh
				)
			);
			return this.graphicBundlesAnimated[length - 1];
		});
	}

	addNewParticleSpawner(
		texturePath: string,
		numberOfStartingParticles: number = 0
	): ParticleSpawner {
		let length = this.particleSpawners.push(
			new ParticleSpawner(
				this.renderer.gl,
				this.renderer.textureStore.getTexture(texturePath),
				numberOfStartingParticles
			)
		);
		return this.particleSpawners[length - 1];
	}

	addNewPointLight(): PointLight {
		if (this.pointLights.length >= pointLightsToAllocate) {
			return null;
		}
		const length = this.pointLights.push(new PointLight(this.renderer.gl));
		return this.pointLights[length - 1];
	}

	getDirectionalLight(): DirectionalLight {
		return this.directionalLight;
	}

	deleteGraphicsBundle(object: GraphicsBundle) {
		this.graphicBundles = this.graphicBundles.filter((o) => object !== o);
	}

	deletePointLight(light: PointLight) {
		this.pointLights = this.pointLights.filter((l) => light !== l);
	}

	calculateAllTransforms() {
		for (let bundle of this.graphicBundles) {
			bundle.transform.calculateMatrices();
		}
		for (let bundle of this.graphicBundlesAnimated) {
			bundle.transform.calculateMatrices();
		}
	}

	renderScene(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		for (let bundle of this.graphicBundles) {
			bundle.graphicsObject.shaderProgram = shaderProgram;
			bundle.draw(bindSpecialTextures);
		}
	}

	renderSceneInstanced(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		for (let bundle of this.graphicBundlesInstanced) {
			bundle.graphicsObject.shaderProgram = shaderProgram;
			bundle.draw(bindSpecialTextures);
		}
	}

	renderSceneAnimated(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		for (let bundle of this.graphicBundlesAnimated) {
			bundle.graphicsObject.shaderProgram = shaderProgram;
			bundle.draw(bindSpecialTextures);
		}
	}

	renderSceneInLayerOrder(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		let layer = -1; 
		let layersLeft = true;

		while (layersLeft) {
			let previousLayer = layer;
			for (const bundle of this.graphicBundles) {
				if (bundle.layer > previousLayer) {
					if (layer == previousLayer || bundle.layer < layer) {
						layer = bundle.layer;
					}
				}
			}

			if (previousLayer == layer) {
				layersLeft = false;
			}
			else {
				for (let bundle of this.graphicBundles) {
					if (bundle.layer == layer) {
						bundle.graphicsObject.shaderProgram = shaderProgram;
						bundle.draw(bindSpecialTextures);
					}
				}
			}
		}
	}
}
