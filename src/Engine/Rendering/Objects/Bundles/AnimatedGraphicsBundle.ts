import { mat4, vec3 } from "gl-matrix";
import Texture from "../../AssetHandling/Textures/Texture";
import GraphicsObject from "../GraphicsObjects/GraphicsObject";
import GraphicsBundle from "./GraphicsBundle";

export default class AnimatedGraphicsBundle extends GraphicsBundle {
  boneTexture: Texture;
  boneMatrices: mat4[];
  bindPose: mat4[];

  constructor(
    gl: WebGL2RenderingContext,
    diffuse: Texture,
    specular: Texture,
    graphicsObject: GraphicsObject,
    emissionMap?: Texture
  ) {
    super(gl, diffuse, specular, graphicsObject, emissionMap, false);
    this.boneTexture = new Texture(gl, false, gl.RGBA32F, gl.RGBA, gl.FLOAT);
  }

  update() {
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
