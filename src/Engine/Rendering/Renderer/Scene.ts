import DirectionalLight from "../Objects/Lighting/DirectionalLight";
import PointLight from "../Objects/Lighting/PointLight";
import GraphicsBundle from "../Objects/Bundles/GraphicsBundle";
import ShaderProgram from "./ShaderPrograms/ShaderProgram";
import ParticleSpawner from "../Objects/InstancedGraphicsObjects/ParticleSpawner";
import { pointLightsToAllocate } from "./ShaderPrograms/DeferredRendering/LightingPassShaderProgram";
import RendererBase from "./RendererBase";
import AnimatedGraphicsBundle from "../Objects/Bundles/AnimatedGraphicsBundle";
import Tree, {
  TreeNode,
  TreeNodeContentElement,
} from "../../Shared/Trees/Tree";
import OBB from "../../Physics/Physics/Shapes/OBB";
import { vec3 } from "gl-matrix";
import Shape from "../../Physics/Physics/Shapes/Shape";
import { IntersectionTester } from "../../Physics/Physics/IntersectionTester";
import ShapeGraphicsObject from "../Objects/GraphicsObjects/ShapeGraphicsObject";

export class TreeSceneContentElement extends TreeNodeContentElement {
  graphicsBundle: GraphicsBundle;
  constructor(graphicsBundle: GraphicsBundle) {
    let obb = new OBB();
    obb.setMinAndMaxVectors(
      graphicsBundle.graphicsObject.getMinAndMaxPositions().min,
      graphicsBundle.graphicsObject.getMinAndMaxPositions().max
    );
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
  private shapeGraphicsObjects: Array<ShapeGraphicsObject>;
  particleSpawners: Array<ParticleSpawner>;
  // --------------------------

  // ---- Lights ----
  directionalLight: DirectionalLight;
  pointLights: Array<PointLight>;
  // ----------------

  stillTree: Tree;
  animatedTree: Tree;

  constructor(renderer: RendererBase) {
    this.renderer = renderer;

    // ---- Graphics objects ----
    this.graphicBundles = new Array<GraphicsBundle>();
    this.graphicBundlesInstanced = new Array<GraphicsBundle>();
    this.graphicBundlesAnimated = new Array<AnimatedGraphicsBundle>();
    this.shapeGraphicsObjects = new Array<ShapeGraphicsObject>();
    this.particleSpawners = new Array<ParticleSpawner>();
    // --------------------------

    // ---- Lighting ----
    this.directionalLight = new DirectionalLight();
    this.pointLights = new Array<PointLight>();
    // ------------------

    this.stillTree = new Tree(
      new TreeNode(200, vec3.fromValues(20, 20, 20), 5, 10, [true, false, true])
    );
    this.animatedTree = new Tree(
      new TreeNode(200, vec3.fromValues(20, 20, 20), 5, 10, [true, false, true])
    );
  }

  async addNewMesh(
    meshPath: string,
    diffusePath: string,
    specularPath: string,
    displayShape: boolean = false
  ): Promise<GraphicsBundle> {
    return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
      const index =
        this.graphicBundles.push(
          new GraphicsBundle(
            this.renderer.gl,
            this.renderer.textureStore.getTexture(diffusePath),
            this.renderer.textureStore.getTexture(specularPath),
            mesh
          )
        ) - 1;
      const treeEntry = new TreeSceneContentElement(
        this.graphicBundles[index]
      );
      this.stillTree.addContent(treeEntry);
      if (displayShape) {
        this.addNewShape(treeEntry.shape);
      }
      return this.graphicBundles[index];
    });
  }

  async addNewInstancedMesh(
    meshPath: string,
    diffusePath: string,
    specularPath: string
  ): Promise<GraphicsBundle> {
    return this.renderer.meshStore.getMesh(meshPath).then((mesh) => {
      const index =
        this.graphicBundlesInstanced.push(
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

      const treeEntry = new TreeSceneContentElement(
        this.graphicBundlesAnimated[index]
      );
      this.animatedTree.addContent(treeEntry);
      // this.addNewShape(treeEntry.shape);
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

  addNewShape(shape: Shape): ShapeGraphicsObject {
    let index =
      this.shapeGraphicsObjects.push(
        new ShapeGraphicsObject(this.renderer.gl, shape)
      ) - 1;
    this.shapeGraphicsObjects[index];

    return this.shapeGraphicsObjects[index];
  }

  getDirectionalLight(): DirectionalLight {
    return this.directionalLight;
  }

  deleteGraphicsBundle(bundle: GraphicsBundle) {
    this.stillTree.removeContent((value: TreeSceneContentElement) => {
      return value.graphicsBundle == bundle;
    });
    this.graphicBundles = this.graphicBundles.filter((value) => {
      return bundle !== value;
    });
  }

  deleteAnimatedGraphicsBundle(bundle: AnimatedGraphicsBundle) {
    this.animatedTree.removeContent((value: TreeSceneContentElement) => {
      return value.graphicsBundle == bundle;
    });
    this.graphicBundlesAnimated = this.graphicBundlesAnimated.filter(
      (value) => {
        return bundle !== value;
      }
    );
  }

  deletePointLight(light: PointLight) {
    this.pointLights = this.pointLights.filter((l) => light !== l);
  }

  deleteShape(shape: Shape) {
    this.shapeGraphicsObjects = this.shapeGraphicsObjects.filter((value) => {
      return value.shape != shape;
    });
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
    const contentFromTree = new Array<TreeSceneContentElement>();
    this.stillTree.getContentFromIntersection(frustum, contentFromTree);

    for (const content of contentFromTree) {
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

  updateTrees() {
    this.stillTree.recalculate((content: TreeSceneContentElement) => {
      (content.shape as OBB).setMinAndMaxVectors(
        content.graphicsBundle.graphicsObject.getMinAndMaxPositions().min,
        content.graphicsBundle.graphicsObject.getMinAndMaxPositions().max
      );
      content.shape.setTransformMatrix(content.graphicsBundle.transform.matrix);
    });
    this.stillTree.prune();

    this.animatedTree.recalculate((content: TreeSceneContentElement) => {
      (content.shape as OBB).setMinAndMaxVectors(
        content.graphicsBundle.graphicsObject.getMinAndMaxPositions().min,
        content.graphicsBundle.graphicsObject.getMinAndMaxPositions().max
      );
      content.shape.setTransformMatrix(content.graphicsBundle.transform.matrix);
    });
    this.animatedTree.prune();
  }

  renderSceneAnimated(
    shaderProgram: ShaderProgram,
    frustum: Shape,
    bindSpecialTextures: boolean = true
  ) {
    const contentFromTree = new Array<TreeSceneContentElement>();
    this.animatedTree.getContentFromIntersection(frustum, contentFromTree);

    for (const content of contentFromTree) {
      if (IntersectionTester.identifyIntersection([frustum], [content.shape])) {
        content.graphicsBundle.graphicsObject.shaderProgram = shaderProgram;
        content.graphicsBundle.draw(bindSpecialTextures);
      }
    }
  }

  /**
   * This is mostly for Renderer2D and isn't up to date with fancy things like trees etc.
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

  renderShapes(shaderProgram: ShaderProgram) {
    for (const shapeObject of this.shapeGraphicsObjects) {
      shapeObject.shaderProgram = shaderProgram;
      shapeObject.draw();
    }
  }
}
