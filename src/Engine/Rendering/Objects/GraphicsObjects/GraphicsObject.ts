import { vec3 } from "gl-matrix";
import ShaderProgram from "../../Renderer/ShaderPrograms/ShaderProgram";

export default class GraphicsObject {
  shaderProgram: ShaderProgram;

  // Private
  private VAO: WebGLVertexArrayObject;
  private VBO: WebGLBuffer;
  private EBO: WebGLBuffer;

  // Protected
  protected gl: WebGL2RenderingContext;

  protected minPositions: vec3 = vec3.create();
  protected maxPositions: vec3 = vec3.create();

  mode: number;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    this.VAO = null;
    this.VBO = null;
    this.EBO = null; // Optional

    this.init();
    this.mode = gl.TRIANGLES;
  }

  init() {
    // Create buffers
    this.VAO = this.gl.createVertexArray();
    this.VBO = this.gl.createBuffer();
    this.EBO = this.gl.createBuffer();

    // Bind buffers
    this.gl.bindVertexArray(this.VAO);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);

    this.setupVertexAttributePointers();

    this.gl.bindVertexArray(null);
  }

  bindVAO() {
    this.gl.bindVertexArray(this.VAO);
  }

  unbindVAO() {
    this.gl.bindVertexArray(null);
  }

  setVertexData(data: Float32Array) {
    if (data == undefined || data.length == 0) {
      return;
    }
    this.gl.bindVertexArray(this.VAO);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    this.gl.bindVertexArray(null);

    const pointArray = this.getVertexPositions();
    if (pointArray != undefined && pointArray.length > 0) {
      vec3.set(this.minPositions, Infinity, Infinity, Infinity);
      vec3.set(this.maxPositions, -Infinity, -Infinity, -Infinity);

      for (const point of pointArray) {
        vec3.min(this.minPositions, this.minPositions, point);
        vec3.max(this.maxPositions, this.maxPositions, point);
      }
    }
  }

  setIndexData(data: Int32Array) {
    this.gl.bindVertexArray(this.VAO);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    this.gl.bindVertexArray(null);
  }

  setupVertexAttributePointers() {}

  setupInstancedVertexAttributePointers() {}

  getVertexPositions(): Array<vec3> {
    return null;
  }

  getMinAndMaxPositions(): { min: vec3; max: vec3 } {
    return { min: this.minPositions, max: this.maxPositions };
  }

  getNumVertices(): number {
    return null;
  }

  draw() {}
}
