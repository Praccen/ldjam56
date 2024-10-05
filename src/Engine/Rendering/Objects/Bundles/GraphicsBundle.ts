import { mat4, vec3 } from "gl-matrix";
import Texture from "../../AssetHandling/Textures/Texture";
import GraphicsObject from "../GraphicsObjects/GraphicsObject";
import Transform from "../../../Shared/Transform";

export default class GraphicsBundle {
	private gl: WebGL2RenderingContext;
	transform: Transform;
	textureMatrix: mat4;

	diffuse: Texture;
	specular: Texture;
	emission: Texture;

	emissionColor: vec3;

	graphicsObject: GraphicsObject;
	enabled: boolean;
	layer: number; // A number corresponding to which layer this will be drawn when using Scene.renderSceneInLayerOrder, should be >= 0 and a higher number means being drawn later

	private instanced: boolean;
	modelMatrices: Array<mat4>;
	private instanceVBO: WebGLBuffer;
	private instancesUploaded: number;

	constructor(
		gl: WebGL2RenderingContext,
		diffuse: Texture,
		specular: Texture,
		graphicsObject: GraphicsObject,
		emissionMap?: Texture,
		instanced: boolean = false
	) {
		this.gl = gl;
		this.diffuse = diffuse;
		this.specular = specular;

		if (emissionMap != undefined) {
			this.emission = emissionMap;
		} else {
			this.emission = new Texture(this.gl);
			this.emission.setTextureData(new Uint8Array([0.0, 0.0, 0.0, 0.0]), 1, 1);
		}
		this.emissionColor = vec3.fromValues(0.0, 0.0, 0.0);

		this.transform = new Transform();
		this.textureMatrix = mat4.create();

		this.graphicsObject = graphicsObject;
		this.enabled = true;

		this.instanced = instanced;
		this.modelMatrices = new Array<mat4>();
		this.instancesUploaded = 0;
		this.instanceVBO = null;

		if (this.instanced) {
			this.graphicsObject.bindVAO();
			this.instanceVBO = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, 0, this.gl.STATIC_DRAW);
			graphicsObject.setupInstancedVertexAttributePointers();
			this.graphicsObject.unbindVAO();
		}

		this.layer = 0;
	}

	updateInstanceBuffer() {
		if (!this.instanced) {
			console.warn("Trying to update instance buffer for a non instanced object");
			return;
		}

		this.graphicsObject.bindVAO();
		let data = new Float32Array(this.modelMatrices.length * 16);
		this.modelMatrices.forEach((value, index) => {
			data.set(value, index * 16);
		});
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
		this.graphicsObject.unbindVAO();

		this.instancesUploaded = this.modelMatrices.length;
	}

	draw(bindSpecialTextures: boolean = true) {
		if (this.enabled) {
			this.diffuse.bind(0);

			if (bindSpecialTextures) {
				this.specular.bind(1);
				this.emission.bind(2);
			}

			let emissionColorU: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("emissionColor");
			if (emissionColorU[1]) {
				this.gl.uniform3fv(emissionColorU[0], this.emissionColor);
			}
			let modelReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("modelMatrix");
			if (modelReturn[1]) {
				this.gl.uniformMatrix4fv(modelReturn[0], false, this.transform.matrix);
			}
			let textureReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("textureMatrix");
			if (textureReturn[1]) {
				this.gl.uniformMatrix4fv(textureReturn[0], false, this.textureMatrix);
			}
			let normalReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("normalMatrix");
			if (normalReturn[1]) {
				this.gl.uniformMatrix3fv(normalReturn[0], false, this.transform.normalMatrix);
			}

			if (this.instanced) {
				if (this.modelMatrices.length <= 0) {
					return;
				}

				if (this.instancesUploaded != this.modelMatrices.length) {
					// This check is only to update if the length of the data is incorrect. 
					// If there are changes made to the matrices, the updateInstanceBuffer call has to be done after matrices are altered
					this.updateInstanceBuffer(); 
				}
	
				this.graphicsObject.bindVAO();
				this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.graphicsObject.getNumVertices(), this.modelMatrices.length);
				this.graphicsObject.unbindVAO();
			} else {
				this.graphicsObject.draw();
			}
		}
	}
}
