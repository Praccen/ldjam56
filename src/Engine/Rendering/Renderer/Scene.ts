import DirectionalLight from "../Objects/Lighting/DirectionalLight";
import PointLight from "../Objects/Lighting/PointLight";
import GraphicsBundle from "../Objects/Bundles/GraphicsBundle";
import ShaderProgram from "./ShaderPrograms/ShaderProgram";
import ParticleSpawner from "../Objects/InstancedGraphicsObjects/ParticleSpawner";
import { pointLightsToAllocate } from "./ShaderPrograms/DeferredRendering/LightingPassShaderProgram";
import RendererBase from "./RendererBase";
import AnimatedGraphicsBundle from "../Objects/Bundles/AnimatedGraphicsBundle";
import Octree, { OctreeNodeContentElement } from "../../Shared/Octree";
import OBB from "../../Physics/Physics/Shapes/OBB";
import { vec3 } from "gl-matrix";
import Shape from "../../Physics/Physics/Shapes/Shape";
import { IntersectionTester } from "../../Physics/Physics/IntersectionTester";

export class OctreeSceneContentElement extends OctreeNodeContentElement {
  graphicsBundle: GraphicsBundle;
  constructor(graphicsBundle: GraphicsBundle) {
    let obb = new OBB();
    obb.setMinAndMaxFromPointArray(graphicsBundle.graphicsObject.getVertexPositions());
    obb.setTransformMatrix(graphicsBundle.transform.matrix);
    super(obb);
    this.graphicsBundle = graphicsBundle;
  }
}

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

  stillOctree: Octree;
  animatedOctree: Octree;

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

    this.stillOctree = new Octree(vec3.fromValues(-10, -5, -10), vec3.fromValues(10, 15, 10), 5, 5);
    this.animatedOctree = new Octree(vec3.fromValues(-10, -5, -10), vec3.fromValues(10, 15, 10), 5, 5);
  }

  async addNewMesh(
    meshPath: string,
    diffusePath: string,
    specularPath: string
  ): Promise<GraphicsBundle> {
    return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
      const index = this.graphicBundles.push(
        new GraphicsBundle(
          this.renderer.gl,
          this.renderer.textureStore.getTexture(diffusePath),
          this.renderer.textureStore.getTexture(specularPath),
          mesh
        )
      ) - 1;
      this.stillOctree.addContent(new OctreeSceneContentElement(this.graphicBundles[index]));
      return this.graphicBundles[index];
    });
  }

  async addNewInstancedMesh(
    meshPath: string,
    diffusePath: string,
    specularPath: string
  ): Promise<GraphicsBundle> {
    return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
      const index = this.graphicBundlesInstanced.push(
        new GraphicsBundle(
          this.renderer.gl,
          this.renderer.textureStore.getTexture(diffusePath),
          this.renderer.textureStore.getTexture(specularPath),
          mesh,
          null,
          true
        )
      ) - 1;
      return this.graphicBundlesInstanced[index];
    });
  }

  async addNewAnimatedMesh(
    meshPath: string,
    diffusePath: string,
    specularPath: string
  ): Promise<AnimatedGraphicsBundle> {
    return this.renderer.meshStore.getAmimatedMesh(meshPath).then((mesh) => {
      const index =
        this.graphicBundlesAnimated.push(
          new AnimatedGraphicsBundle(
            this.renderer.gl,
            this.renderer.textureStore.getTexture(diffusePath),
            this.renderer.textureStore.getTexture(specularPath),
            mesh
          )
        ) - 1;

      this.animatedOctree.addContent(new OctreeSceneContentElement(this.graphicBundlesAnimated[index]));
      return this.graphicBundlesAnimated[index];
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

  deleteGraphicsBundle(bundle: GraphicsBundle) {
    this.stillOctree.removeContent((value: OctreeSceneContentElement) => {return value.graphicsBundle == bundle});
    this.graphicBundles = this.graphicBundles.filter((value) => {return bundle !== value});
  }

  deleteAnimatedGraphicsBundle(bundle: AnimatedGraphicsBundle) {
    this.animatedOctree.removeContent((value: OctreeSceneContentElement) => {return value.graphicsBundle == bundle});
    this.graphicBundlesAnimated = this.graphicBundlesAnimated.filter((value) => {return bundle !== value});
  }

  deletePointLight(light: PointLight) {
    this.pointLights = this.pointLights.filter((l) => light !== l);
  }

  calculateAllTransforms() {
    for (const bundle of this.graphicBundles) {
      bundle.transform.calculateMatrices();
    }
    for (const bundle of this.graphicBundlesAnimated) {
      bundle.transform.calculateMatrices();
    }
  }

  renderScene(
    shaderProgram: ShaderProgram,
    frustum: Shape,
    bindSpecialTextures: boolean = true
  ) {
    const contentFromOctree = new Array<OctreeSceneContentElement>();
    this.stillOctree.getContentFromIntersection(frustum, contentFromOctree);

    for (const content of contentFromOctree) {
      if (IntersectionTester.identifyIntersection([frustum], [content.shape])) {
        content.graphicsBundle.graphicsObject.shaderProgram = shaderProgram;
        content.graphicsBundle.draw(bindSpecialTextures);
      }
    }
  }

  renderSceneInstanced(
    shaderProgram: ShaderProgram,
    bindSpecialTextures: boolean = true
  ) {
    for (const bundle of this.graphicBundlesInstanced) {
      bundle.graphicsObject.shaderProgram = shaderProgram;
      bundle.draw(bindSpecialTextures);
    }
  }

  updateAnimatedMeshes() {
    for (let bundle of this.graphicBundlesAnimated) {
      bundle.createBoneTexture();
    }
  }

  updateOctrees() {
    this.stillOctree.recalculate((content: OctreeSceneContentElement) => {
      content.shape.setUpdateNeeded();
    });
    this.stillOctree.prune();

    this.animatedOctree.recalculate((content: OctreeSceneContentElement) => {
      content.shape.setUpdateNeeded();
    });
    this.animatedOctree.prune();
  }

  renderSceneAnimated(
    shaderProgram: ShaderProgram,
    frustum: Shape,
    bindSpecialTextures: boolean = true
  ) {
    const contentFromOctree = new Array<OctreeSceneContentElement>();
    this.animatedOctree.getContentFromIntersection(frustum, contentFromOctree);

    for (const content of contentFromOctree) {
      if (IntersectionTester.identifyIntersection([frustum], [content.shape])) {
        content.graphicsBundle.graphicsObject.shaderProgram = shaderProgram;
        content.graphicsBundle.draw(bindSpecialTextures);
      }
    }
  }

  /**
   * This is mostly for Renderer2D and isn't up to date with fancy things like octree etc.
   */
  renderSceneInLayerOrder(
    shaderProgram: ShaderProgram,
    bindSpecialTextures: boolean = true
  ) {
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
      } else {
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
