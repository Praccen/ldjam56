import GraphicsBundle from "../Objects/Bundles/GraphicsBundle";
import AnimatedMesh from "../Objects/GraphicsObjects/AnimatedMesh";
import GraphicsObject from "../Objects/GraphicsObjects/GraphicsObject";
import Heightmap from "../Objects/GraphicsObjects/Heightmap";
import Mesh from "../Objects/GraphicsObjects/Mesh";
import RendererBase from "../Renderer/RendererBase";
import ShaderProgram from "../Renderer/ShaderPrograms/ShaderProgram";
import GltfObject from "./GltfObject";
import Texture from "./Textures/Texture";
import TextureStore from "./TextureStore";
import { vec2, vec3 } from "gl-matrix";

export default class MeshStore {
  private renderer: RendererBase;
  private meshMap: Map<string, Mesh>;
  private animatedMeshMap: Map<string, AnimatedMesh>;
  private heightmapMap: Map<string, Heightmap>;
  private textureStore: TextureStore;

  constructor(renderer: RendererBase, textureStore: TextureStore) {
    this.renderer = renderer;
    this.meshMap = new Map<string, Mesh>();
    this.animatedMeshMap = new Map<string, AnimatedMesh>();
    this.heightmapMap = new Map<string, Heightmap>();
    this.textureStore = textureStore;
  }

  /**
   * This function will load all meshes in paths. Invalid paths will result in an error in the console, but won't break functionality.
   * @param paths Array of strings containing the paths to load
   * @param progress Object with member loaded which will reflect how many meshes has currently been loaded
   * @returns Promise<void> that resolves when all meshes has been loaded
   */
  async loadMeshes(
    paths: Array<string>,
    progress: { loaded: number }
  ): Promise<void> {
    return new Promise<void>((resolve, rejects) => {
      progress.loaded = 0;
      for (let path of paths) {
        this.getMesh(path).then(() => {
          progress.loaded++;
          if (progress.loaded == paths.length) {
            resolve();
          }
        });
      }
    });
  }

  async getMesh(path: string): Promise<GraphicsObject> {
    let mesh = this.meshMap.get(path);
    if (mesh) {
      return new Promise<GraphicsObject>((resolve, reject) => {
        resolve(mesh);
      });
    }

    this.meshMap.set(path, new Mesh(this.renderer.gl, null));
    let newlyCreatedMesh = this.meshMap.get(path);
    return this.parseObjContent(path).then((data) => {
      newlyCreatedMesh.setVertexData(data);
      return newlyCreatedMesh;
    });
  }

  async getAmimatedMesh(path: string): Promise<GraphicsObject> {
    let mesh = this.animatedMeshMap.get(path);
    if (mesh) {
      return new Promise<GraphicsObject>((resolve, reject) => {
        resolve(mesh);
      });
    }

    this.animatedMeshMap.set(path, new AnimatedMesh(this.renderer.gl, null));
    let newlyCreatedMesh = this.animatedMeshMap.get(path);
    return this.parseGltfContent(path).then((data) => {
      if (data.length > 0) {
        newlyCreatedMesh.setVertexData(data[0].vertexData);
        newlyCreatedMesh.setIndexData(data[0].indexData);
      }
      return newlyCreatedMesh;
    });

    // return new Promise<GraphicsObject>(
    // 	(resolve, reject) => {
    // 		let aMesh = new AnimatedMesh(this.renderer.gl, null);
    // 		let vertices = new Float32Array([
    // 			// 0
    // 			0.0, 1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			0.0, 0.0, 0.0, 0.0, // boneidx

    // 			// 1
    // 			0.0, -1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			0.0, 0.0, 0.0, 0.0, // boneidx

    // 			// 2
    // 			2.0, 1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			0.5, 0.5, 0.0, 0.0, // weight
    // 			0.0, 1.0, 0.0, 0.0, // boneidx

    // 			// 3
    // 			2.0, -1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			0.5, 0.5, 0.0, 0.0, // weight
    // 			0.0, 1.0, 0.0, 0.0, // boneidx

    // 			// 4
    // 			4.0, 1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			1.0, 0.0, 0.0, 0.0, // boneidx

    // 			// 5
    // 			4.0, -1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			1.0, 0.0, 0.0, 0.0, // boneidx

    // 			// 6
    // 			6.0, 1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			0.5, 0.5, 0.0, 0.0, // weight
    // 			1.0, 2.0, 0.0, 0.0, // boneidx

    // 			// 7
    // 			6.0, -1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			0.5, 0.5, 0.0, 0.0, // weight
    // 			1.0, 2.0, 0.0, 0.0, // boneidx

    // 			// 8
    // 			8.0, 1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			2.0, 0.0, 0.0, 0.0, // boneidx

    // 			// 9
    // 			8.0, -1.0, 0.0, // pos
    // 			0.0, 0.0, 1.0, // normal
    // 			0.5, 0.5,      // uv
    // 			1.0, 0.0, 0.0, 0.0, // weight
    // 			2.0, 0.0, 0.0, 0.0, // boneidx
    // 		]);

    // 		aMesh.setVertexData(vertices);

    // 		// prettier-ignore
    // 		let indices = new Int32Array([
    // 			0, 1, 2,
    // 			2, 1, 3,
    // 			2, 3, 4,
    // 			4, 3, 5,
    // 			4, 5, 6,
    // 			6, 5, 7,
    // 			6, 7, 8,
    // 			8, 7, 9,
    // 		]);
    // 		aMesh.setIndexData(indices);

    // 		resolve(aMesh);
    // 	}
    // );
  }

  private async parseObjContent(meshPath: string): Promise<Float32Array> {
    /*
		https://webglfundamentals.org/webgl/lessons/webgl-load-obj.html
		*/

    const response = await fetch(meshPath);
    const objContent = await response.text();

    const lines = objContent.split("\n");
    let vertexPositions = new Array<vec3>();
    let vertexTexCoords = new Array<vec2>();
    let vertexNormals = new Array<vec3>();
    let vertices = new Array<{
      posIndex: number;
      texCoordIndex: number;
      normalIndex: number;
      mtlIndex: number;
    }>();
    let mtls = new Map<
      string,
      {
        diffuseColor: vec3;
        specularColor: vec3;
        emissionColor: vec3;
        dissolve: number;
        mapDiffuse: string;
        spriteIndex: number;
      }
    >();
    let usingMtl: string = "";

    for (let line of lines) {
      line = line.trim();

      if (line.startsWith("mtllib")) {
        const mtlName = line.split(/\s+/).filter((element) => {
          return element != "mtllib";
        });
        if (mtlName.length == 1) {
          let mtlPath =
            meshPath.substring(0, meshPath.lastIndexOf("/") + 1) + mtlName;
          try {
            const mtlResponse = await fetch(mtlPath);

            if (mtlResponse.ok) {
              const mtlContent = await mtlResponse.text();
              let lastMtl: string = "";
              let index = 0;

              for (const row of mtlContent.split("\n")) {
                if (row.startsWith("newmtl")) {
                  let splitRow = row.split(/\s+/);
                  if (splitRow.length > 1) {
                    lastMtl = splitRow[1];
                    mtls.set(lastMtl, {
                      diffuseColor: vec3.create(),
                      specularColor: vec3.create(),
                      emissionColor: vec3.create(),
                      dissolve: 1.0,
                      mapDiffuse: "",
                      spriteIndex: index,
                    });
                    index++;
                  }
                } else if (row.startsWith("Kd") && lastMtl != "") {
                  const colorValues = row.split(/\s+/).filter((element) => {
                    return element != "Kd";
                  });
                  if (colorValues.length > 2) {
                    vec3.set(
                      mtls.get(lastMtl).diffuseColor,
                      parseFloat(colorValues[0]),
                      parseFloat(colorValues[1]),
                      parseFloat(colorValues[2])
                    );
                  }
                } else if (row.startsWith("Ks") && lastMtl != "") {
                  const colorValues = row.split(/\s+/).filter((element) => {
                    return element != "Ks";
                  });
                  if (colorValues.length > 2) {
                    vec3.set(
                      mtls.get(lastMtl).specularColor,
                      parseFloat(colorValues[0]),
                      parseFloat(colorValues[1]),
                      parseFloat(colorValues[2])
                    );
                  }
                } else if (row.startsWith("Ke") && lastMtl != "") {
                  const colorValues = row.split(/\s+/).filter((element) => {
                    return element != "Ke";
                  });
                  if (colorValues.length > 2) {
                    vec3.set(
                      mtls.get(lastMtl).emissionColor,
                      parseFloat(colorValues[0]),
                      parseFloat(colorValues[1]),
                      parseFloat(colorValues[2])
                    );
                  }
                } else if (row.startsWith("d") && lastMtl != "") {
                  const colorValues = row.split(/\s+/).filter((element) => {
                    return element != "d";
                  });
                  if (colorValues.length > 0) {
                    mtls.get(lastMtl).dissolve = parseFloat(colorValues[0]);
                  }
                } else if (row.startsWith("map_Kd") && lastMtl != "") {
                  const mapName = row.split(/\s+/)[row.split(/\s+/).length - 1];
                  if (mapName.length > 0) {
                    mtls.get(lastMtl).mapDiffuse = mapName;
                  }
                }
              }

              let diffuseTextureData = new Uint8Array(index * 4);
              for (let mtl of mtls) {
                diffuseTextureData[mtl[1].spriteIndex * 4 + 0] =
                  mtl[1].diffuseColor[0] * 255;
                diffuseTextureData[mtl[1].spriteIndex * 4 + 1] =
                  mtl[1].diffuseColor[1] * 255;
                diffuseTextureData[mtl[1].spriteIndex * 4 + 2] =
                  mtl[1].diffuseColor[2] * 255;
                diffuseTextureData[mtl[1].spriteIndex * 4 + 3] =
                  mtl[1].dissolve * 255;
              }
              let tempTexture = new Texture(this.renderer.gl, false);
              tempTexture.setTextureData(diffuseTextureData, index, 1);
              this.textureStore.setTexture(mtlPath, tempTexture);

              let specularTextureData = new Uint8Array(index * 4);
              for (let mtl of mtls) {
                specularTextureData[mtl[1].spriteIndex * 4 + 0] =
                  mtl[1].specularColor[0] * 255;
                specularTextureData[mtl[1].spriteIndex * 4 + 1] =
                  mtl[1].specularColor[1] * 255;
                specularTextureData[mtl[1].spriteIndex * 4 + 2] =
                  mtl[1].specularColor[2] * 255;
                specularTextureData[mtl[1].spriteIndex * 4 + 3] = 255;
              }
              tempTexture = new Texture(this.renderer.gl, false);
              tempTexture.setTextureData(specularTextureData, index, 1);
              this.textureStore.setTexture(
                mtlPath.substring(0, mtlPath.length - 4) + "_spec.mtl",
                tempTexture
              );

              let emissionTextureData = new Uint8Array(index * 4);
              for (let mtl of mtls) {
                emissionTextureData[mtl[1].spriteIndex * 4 + 0] =
                  mtl[1].emissionColor[0] * 255;
                emissionTextureData[mtl[1].spriteIndex * 4 + 1] =
                  mtl[1].emissionColor[1] * 255;
                emissionTextureData[mtl[1].spriteIndex * 4 + 2] =
                  mtl[1].emissionColor[2] * 255;
                emissionTextureData[mtl[1].spriteIndex * 4 + 3] = 255;
              }
              tempTexture = new Texture(this.renderer.gl, false);
              tempTexture.setTextureData(emissionTextureData, index, 1);
              this.textureStore.setTexture(
                mtlPath.substring(0, mtlPath.length - 4) + "_emission.mtl",
                tempTexture
              );
            }
          } catch (e) {}
        }
      } else if (line.startsWith("usemtl") && mtls.size > 0) {
        usingMtl = line.split(/\s+/)[1];
      } else if (line.startsWith("vt")) {
        // Texture coordinates
        const coords = line.split(/\s+/).filter((element) => {
          return element != "vt";
        });
        vertexTexCoords.push(
          vec2.fromValues(parseFloat(coords[0]), parseFloat(coords[1]))
        );
      } else if (line.startsWith("vn")) {
        // Normal
        const coords = line.split(/\s+/).filter((element) => {
          return element != "vn";
        });
        vertexNormals.push(
          vec3.fromValues(
            parseFloat(coords[0]),
            parseFloat(coords[1]),
            parseFloat(coords[2])
          )
        );
      } else if (line.startsWith("v")) {
        // Position
        const coords = line.split(/\s+/).filter((element) => {
          return element != "v";
        });
        vertexPositions.push(
          vec3.fromValues(
            parseFloat(coords[0]),
            parseFloat(coords[1]),
            parseFloat(coords[2])
          )
        );
      } else if (line.startsWith("f")) {
        // Faces
        const coords = line.split(/\s+/).filter((element) => {
          return element != "f";
        });
        for (let i = 0; i < coords.length - 2; i++) {
          for (let j = 0; j < 3; j++) {
            let index = j == 0 ? 0 : i + j; // 0 if j is zero, otherwize i +j
            const indices = coords[index].split("/");

            const last = vertices.push({
              posIndex: NaN,
              texCoordIndex: NaN,
              normalIndex: NaN,
              mtlIndex: NaN,
            });
            if (indices.length > 0) {
              vertices[last - 1].posIndex = parseInt(indices[0]) - 1;
            }

            if (indices.length > 1) {
              vertices[last - 1].texCoordIndex = parseInt(indices[1]) - 1; // Can be empty, texCoordIndex will then be NaN
            }

            if (indices.length > 2) {
              vertices[last - 1].normalIndex = parseInt(indices[2]) - 1;
            }

            if (usingMtl != "") {
              const mtl = mtls.get(usingMtl);
              if (mtl != undefined) {
                if (mtl.mapDiffuse == "") {
                  vertices[last - 1].mtlIndex = mtl.spriteIndex;
                }
              } else {
                console.warn("usemtl " + usingMtl + ", there is no such mtl");
              }
            }
          }
        }
      } else if (line.startsWith("#")) {
        // A comment, ignore
      } else if (line.length > 0) {
        // Unhandled keywords
        // console.warn("OBJ loader: Unhandled keyword " + line.split(/\s+/)[0]);
      }
    }

    let returnArr = new Float32Array(vertices.length * 8); // 3 * pos + 3 * norm + 2 * tx

    for (let i = 0; i < vertices.length; i++) {
      if (!isNaN(vertices[i].posIndex)) {
        returnArr[i * 8] = vertexPositions[vertices[i].posIndex][0];
        returnArr[i * 8 + 1] = vertexPositions[vertices[i].posIndex][1];
        returnArr[i * 8 + 2] = vertexPositions[vertices[i].posIndex][2];
      } else {
        returnArr[i * 8] = 0.0;
        returnArr[i * 8 + 1] = 0.0;
        returnArr[i * 8 + 2] = 0.0;
      }

      if (!isNaN(vertices[i].normalIndex)) {
        returnArr[i * 8 + 3] = vertexNormals[vertices[i].normalIndex][0];
        returnArr[i * 8 + 4] = vertexNormals[vertices[i].normalIndex][1];
        returnArr[i * 8 + 5] = vertexNormals[vertices[i].normalIndex][2];
      } else {
        returnArr[i * 8 + 3] = 1.0;
        returnArr[i * 8 + 4] = 0.0;
        returnArr[i * 8 + 5] = 0.0;
      }

      if (!isNaN(vertices[i].mtlIndex)) {
        // TODO: This breaks uvs (obviously) so currently we don't set the mtlIndex if there is a map_Kd specified. This whole system of combining diffuse values to one sprite map should probably not be this way.
        returnArr[i * 8 + 6] =
          vertices[i].mtlIndex / mtls.size + 0.5 / mtls.size;
        returnArr[i * 8 + 7] = 0.5;
      } else if (!isNaN(vertices[i].texCoordIndex)) {
        returnArr[i * 8 + 6] = vertexTexCoords[vertices[i].texCoordIndex][0];
        returnArr[i * 8 + 7] = vertexTexCoords[vertices[i].texCoordIndex][1];
      } else {
        returnArr[i * 8 + 6] = 0.0;
        returnArr[i * 8 + 7] = 0.0;
      }
    }
    return returnArr;
  }

  async parseGltfContent(
    meshPath: string
  ): Promise<Array<{ vertexData: Float32Array; indexData: Int32Array }>> {
    const response = await fetch(meshPath);
    let gltfContent = await response.json();

    const baseURL = new URL(meshPath, location.href);
    gltfContent.buffers = await Promise.all(
      gltfContent.buffers.map(async (buffer) => {
        const url = new URL(buffer.uri, baseURL.href);
        const binResponse = await fetch(url);
        if (!response.ok) {
          throw new Error(`could not load: ${url}`);
        }
        return await binResponse.arrayBuffer();
      })
    );

    const gltfObject = new GltfObject(gltfContent);
    if (gltfObject.getNumMeshes() > 0) {
      return gltfObject.getBufferData(0);
    }

    return null;
  }
}
