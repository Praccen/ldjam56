import Texture from "../../../AssetHandling/Textures/Texture";
import Camera from "../../../Objects/Camera";
import ScreenQuad from "../../../Objects/GraphicsObjects/ScreenQuad";
import Framebuffer from "../../Framebuffers/Framebuffer";
import Scene from "../../Scene";
import ParticleShaderProgram from "../../ShaderPrograms/Particles/ParticleShaderProgram";

export default class ParticleRenderPass {
  private gl: WebGL2RenderingContext;
  private particleShaderProgram: ParticleShaderProgram;
  outputBuffer: Framebuffer;

  constructor(
    gl: WebGL2RenderingContext,
    particleShaderProgram: ParticleShaderProgram
  ) {
    this.gl = gl;
    this.particleShaderProgram = particleShaderProgram;
    this.outputBuffer = null;
  }

  bindFramebuffers() {
    // Render result to screen or to crt framebuffer if doing crt effect after this.
    if (this.outputBuffer == undefined) {
      this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null); // Render directly to screen
    } else {
      this.outputBuffer.bind(this.gl.DRAW_FRAMEBUFFER);
    }
  }

  draw(scene: Scene, camera: Camera, rendererStartTime: number) {
    this.gl.clearBufferfv(this.gl.COLOR, 1, [0.0, 0.0, 0.0, 1.0]);
    if (scene.particleSpawners.length > 0) {
      // only do this if there are any particle spawners
      this.particleShaderProgram.use();
      camera.bindViewProjMatrix(
        this.gl,
        this.particleShaderProgram.getUniformLocation("viewProjMatrix")[0]
      );
      this.gl.uniform3fv(
        this.particleShaderProgram.getUniformLocation("cameraPos")[0],
        camera.getPosition()
      );
      this.gl.uniform1f(
        this.particleShaderProgram.getUniformLocation("currentTime")[0],
        (Date.now() - rendererStartTime) * 0.001
      );
      for (const particleSpawner of scene.particleSpawners.values()) {
        particleSpawner.shaderProgram = this.particleShaderProgram;
        particleSpawner.draw();
      }
    }
  }
}
