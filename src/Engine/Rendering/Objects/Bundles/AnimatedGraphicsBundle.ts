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

    // Below is temp
    let numberOfBones = 3;
    this.boneMatrices = new Array<mat4>();
    this.bindPose = new Array<mat4>();
    for (let i = 0; i < numberOfBones; i++) {
      this.boneMatrices.push(mat4.create());
      this.bindPose.push(mat4.create());
    }

    this.computeBoneMatrices(this.bindPose, 0);

    for (let bone of this.bindPose) {
      mat4.invert(bone, bone);
    }

    this.update(0.0);
  }

  // Temporary for example
  private computeBoneMatrices(boneMatrices: mat4[], angle: number) {
    let m = mat4.create();
    mat4.rotateZ(m, m, angle);
    mat4.copy(boneMatrices[2], m);

    mat4.translate(m, m, vec3.fromValues(4, 0, 0));
    mat4.rotateZ(m, m, angle);
    mat4.copy(boneMatrices[1], m);

    mat4.translate(m, m, vec3.fromValues(4, 0, 0));
    mat4.rotateZ(m, m, angle);
    mat4.copy(boneMatrices[0], m);
  }

  // Temporary for example
  update(angle: number) {
    this.computeBoneMatrices(this.boneMatrices, angle);
    for (let i = 0; i < this.boneMatrices.length; i++) {
      mat4.multiply(
        this.boneMatrices[i],
        this.boneMatrices[i],
        this.bindPose[i]
      );
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
