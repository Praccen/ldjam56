import { applicationStartTime } from "../../../../Engine";
import GraphicsObject from "../GraphicsObjects/GraphicsObject";
import Texture from "../../AssetHandling/Textures/Texture";
import { vec3 } from "gl-matrix";

export default class ParticleSpawner extends GraphicsObject {
  texture: Texture;
  fadePerSecond: number;
  sizeChangePerSecond: number;
  lifeTime: number;

  // Private
  private numParticles: number;
  private vertices: Float32Array;
  private indices: Int32Array;
  private instanceVBO: WebGLBuffer;

  constructor(
    gl: WebGL2RenderingContext,
    texture: Texture,
    numberOfStartingParticles: number = 0
  ) {
    super(gl);

    this.texture = texture;

    this.bindVAO();
    this.instanceVBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      numberOfStartingParticles * 11 * 4,
      this.gl.DYNAMIC_DRAW
    );
    this.setupInstancedVertexAttributePointers();
    this.unbindVAO();

    // prettier-ignore
    this.vertices = new Float32Array([ 
            // positions  // uv
            -0.5,  0.5,   0.0, 1.0,
            -0.5, -0.5,   0.0, 0.0,
             0.5, -0.5,   1.0, 0.0,
             0.5,  0.5,   1.0, 1.0,
        ]);

    // prettier-ignore
    this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);
    this.setVertexData(this.vertices);
    this.setIndexData(this.indices);

    // All starting particles are initialized as size and position 0, so they wont be visable unless manually changed
    this.numParticles = numberOfStartingParticles;

    this.fadePerSecond = 0.0;
    this.sizeChangePerSecond = 1.0;
    this.lifeTime = 1.0;
  }

  setupVertexAttributePointers(): void {
    // Change if input layout changes in shaders
    const stride = 4 * 4;
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, stride, 0);
    this.gl.enableVertexAttribArray(0);

    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, stride, 2 * 4);
    this.gl.enableVertexAttribArray(1);
  }

  setupInstancedVertexAttributePointers(): void {
    const stride = 11 * 4;
    this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, stride, 0);
    this.gl.enableVertexAttribArray(2);
    this.gl.vertexAttribDivisor(2, 1);

    this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, stride, 3 * 4);
    this.gl.enableVertexAttribArray(3);
    this.gl.vertexAttribDivisor(3, 1);

    this.gl.vertexAttribPointer(4, 3, this.gl.FLOAT, false, stride, 4 * 4);
    this.gl.enableVertexAttribArray(4);
    this.gl.vertexAttribDivisor(4, 1);

    this.gl.vertexAttribPointer(5, 1, this.gl.FLOAT, false, stride, 7 * 4);
    this.gl.enableVertexAttribArray(5);
    this.gl.vertexAttribDivisor(5, 1);

    this.gl.vertexAttribPointer(6, 3, this.gl.FLOAT, false, stride, 8 * 4);
    this.gl.enableVertexAttribArray(6);
    this.gl.vertexAttribDivisor(6, 1);

    // this.gl.vertexAttribPointer(7, 1, this.gl.FLOAT, false, stride, 11 * 4);
    // this.gl.enableVertexAttribArray(7);
    // this.gl.vertexAttribDivisor(7, 1);
  }

  setNumParticles(amount: number) {
    this.numParticles = amount;

    this.bindVAO();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.numParticles * 11 * 4,
      this.gl.DYNAMIC_DRAW
    );
    this.unbindVAO();
  }

  getNumberOfParticles(): number {
    return this.numParticles;
  }

  setParticleData(
    particleIndex: number,
    startPosition: vec3,
    size: number,
    startVel: vec3,
    acceleration: vec3,
    startTime?: number
  ): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    let time = (Date.now() - applicationStartTime) * 0.001;

    if (startTime != undefined) {
      time = startTime;
    }

    let data = new Float32Array([
      startPosition[0],
      startPosition[1],
      startPosition[2],
      size,
      startVel[0],
      startVel[1],
      startVel[2],
      time,
      acceleration[0],
      acceleration[1],
      acceleration[2],
    ]);

    this.bufferSubDataUpdate(particleIndex * 11, data);

    return true;
  }

  setParticleStartPosition(particleIndex: number, position: vec3): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(particleIndex * 11, <Float32Array>position);
    return true;
  }

  setParticleSize(particleIndex: number, size: number): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(particleIndex * 11 + 3, new Float32Array([size]));
    return true;
  }

  setParticleStartVelocity(particleIndex: number, vel: vec3): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(particleIndex * 11 + 4, <Float32Array>vel);
    return true;
  }

  setParticleStartTime(particleIndex: number, time: number): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(particleIndex * 11 + 7, new Float32Array([time]));
    return true;
  }

  resetParticleStartTime(particleIndex: number): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(
      particleIndex * 11 + 7,
      new Float32Array([(Date.now() - applicationStartTime) * 0.001])
    );
    return true;
  }

  setParticleAcceleration(particleIndex: number, acc: vec3): boolean {
    if (particleIndex > this.numParticles) {
      return false;
    }
    this.bufferSubDataUpdate(particleIndex * 11 + 8, <Float32Array>acc);
    return true;
  }

  private bufferSubDataUpdate(start: number, data: Float32Array): boolean {
    if (start > this.numParticles * 11) {
      return false;
    }
    this.bindVAO();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, start * 4, data);
    this.unbindVAO();
    return true;
  }

  getNumVertices(): number {
    return this.indices.length;
  }

  draw() {
    this.bindVAO();

    this.texture.bind(0);
    this.gl.uniform1f(
      this.shaderProgram.getUniformLocation("fadePerSecond")[0],
      this.fadePerSecond
    );
    this.gl.uniform1f(
      this.shaderProgram.getUniformLocation("sizeChangePerSecond")[0],
      this.sizeChangePerSecond
    );
    this.gl.uniform1f(
      this.shaderProgram.getUniformLocation("lifeTime")[0],
      this.lifeTime
    );

    this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      6,
      this.gl.UNSIGNED_INT,
      0,
      this.getNumberOfParticles()
    );
    this.unbindVAO();
  }
}
