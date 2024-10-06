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
  gltfObject: GltfObject;
  animationTimer: number;

  constructor(
    gl: WebGL2RenderingContext,
    diffuse: Texture,
    specular: Texture,
    graphicsObject: GraphicsObject,
    gltfObject: GltfObject,
    emissionMap?: Texture
  ) {
    super(gl, diffuse, specular, graphicsObject, emissionMap, false);
    this.boneTexture = new Texture(gl, false, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    this.gltfObject = gltfObject;
    this.animationTimer = 0.0;
  }

  animate(dt: number) {
    this.animationTimer += dt;
    this.gltfObject.animate(0, this.animationTimer);
    this.boneMatrices = this.gltfObject.getBoneMatrices(0);
    for (let i = 0; i < this.boneMatrices.length; i++) {
      mat4.mul(
        this.boneMatrices[i],
        this.boneMatrices[i],
        this.bindPose[i]
      ); 
    }
  }

  createBoneTexture() {
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
