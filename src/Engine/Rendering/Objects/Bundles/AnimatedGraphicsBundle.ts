import { mat4, vec3 } from "gl-matrix";
import Texture from "../../AssetHandling/Textures/Texture";
import GraphicsObject from "../GraphicsObjects/GraphicsObject";
import GraphicsBundle from "./GraphicsBundle";
import GltfObject from "../../AssetHandling/GltfObject";
import { throws } from "assert";

export default class AnimatedGraphicsBundle extends GraphicsBundle {
  boneTexture: Texture;
  boneMatrices: mat4[];
  bindPose: mat4[];
  graphicsObjectAndGltfObject: {go: GraphicsObject, gltfObject: GltfObject};
  animationTimer: number;

  constructor(
    gl: WebGL2RenderingContext,
    diffuse: Texture,
    specular: Texture,
    graphicsObjectAndGltfObject: {go: GraphicsObject, gltfObject: GltfObject},    
    emissionMap?: Texture
  ) {
    super(gl, diffuse, specular, graphicsObjectAndGltfObject.go, emissionMap, false);
    this.boneTexture = new Texture(gl, false, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    this.graphicsObjectAndGltfObject = graphicsObjectAndGltfObject;
    this.animationTimer = 0.0;
  }

  animate(animationIndex: number, dt: number) {
    if (this.graphicsObjectAndGltfObject.gltfObject == undefined) {
      return;
    }
    this.animationTimer += dt;
    this.graphicsObjectAndGltfObject.gltfObject.animate(animationIndex, this.animationTimer);
    this.boneMatrices = this.graphicsObjectAndGltfObject.gltfObject.getBoneMatrices(0);

    if (this.bindPose == undefined) {
      this.bindPose = this.graphicsObjectAndGltfObject.gltfObject.getBindPose(0);
    }

    for (let i = 0; i < this.boneMatrices.length; i++) {
      mat4.mul(
        this.boneMatrices[i],
        this.boneMatrices[i],
        this.bindPose[i]
      ); 
    }
  }

  createBoneTexture() {
    if (this.boneMatrices == undefined) {
      return;
    }

    let bonesTextureData = new Float32Array(this.boneMatrices.length * 16);
    for (let i = 0; i < this.boneMatrices.length; i++) {
      for (let j = 0; j < 16; j++) {
        bonesTextureData[i * 16 + j] = this.boneMatrices[i][j];
      }
    }

    this.boneTexture.setTextureData(
      bonesTextureData,
      4,
      this.boneMatrices.length
    );
  }

  draw(bindSpecialTextures: boolean = true) {
    if (this.enabled) {
      this.boneTexture.bind(3);

      super.draw(bindSpecialTextures);
    }
  }
}
