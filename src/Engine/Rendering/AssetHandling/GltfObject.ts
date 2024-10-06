import { mat4, quat, vec3 } from "gl-matrix";
import Transform from "../../Shared/Transform";

const glTypeToTypedArrayMap = {
  5120: Int8Array, // gl.BYTE
  5121: Uint8Array, // gl.UNSIGNED_BYTE
  5122: Int16Array, // gl.SHORT
  5123: Uint16Array, // gl.UNSIGNED_SHORT
  5124: Int32Array, // gl.INT
  5125: Uint32Array, // gl.UNSIGNED_INT
  5126: Float32Array, // gl.FLOAT
};

const glTypeToByteSize = {
  5120: 1, // gl.BYTE
  5121: 1, // gl.UNSIGNED_BYTE
  5122: 2, // gl.SHORT
  5123: 2, // gl.UNSIGNED_SHORT
  5124: 4, // gl.INT
  5125: 4, // gl.UNSIGNED_INT
  5126: 4, // gl.FLOAT
};

const setPropertyWithoutTypeConversion = function (
  gltfNode: Object,
  nodeMemberName: string,
  object: Object,
  objectMemberName: string
): boolean {
  if (!object.hasOwnProperty(objectMemberName)) {
    console.error(
      "Trying to set " +
        objectMemberName +
        " on " +
        object.toString() +
        ". But object doesn't have property " +
        objectMemberName
    );
    return false;
  }
  if (gltfNode.hasOwnProperty(nodeMemberName)) {
    object[objectMemberName] = gltfNode[nodeMemberName];
    return true;
  }
  return false;
};

const setVec3 = function (
  gltfNode: Object,
  nodeMemberName: string,
  object: Object,
  objectMemberName: string
): boolean {
  if (!object.hasOwnProperty(objectMemberName)) {
    console.error(
      "Trying to set " +
        objectMemberName +
        " on object, but object doesn't have property " +
        objectMemberName
    );
    return false;
  }

  if (typeof object[objectMemberName] != typeof vec3) {
    console.error(
      "Trying to set vec3 property " +
        objectMemberName +
        " on object, but object member is not vec3"
    );
    return false;
  }

  if (gltfNode.hasOwnProperty(nodeMemberName)) {
    vec3.set(
      object[objectMemberName],
      gltfNode[nodeMemberName][0],
      gltfNode[nodeMemberName][1],
      gltfNode[nodeMemberName][2]
    );
    return true;
  }
  return false;
};

const setQuat = function (
  gltfNode: Object,
  nodeMemberName: string,
  object: Object,
  objectMemberName: string
): boolean {
  if (!object.hasOwnProperty(objectMemberName)) {
    console.error(
      "Trying to set " +
        objectMemberName +
        " on object, but object doesn't have property " +
        objectMemberName
    );
    return false;
  }

  if (typeof object[objectMemberName] != typeof quat) {
    console.error(
      "Trying to set quat property " +
        objectMemberName +
        " on object, but object member is not quat"
    );
    return false;
  }

  if (gltfNode.hasOwnProperty(nodeMemberName)) {
    quat.set(
      object[objectMemberName],
      gltfNode[nodeMemberName][0],
      gltfNode[nodeMemberName][1],
      gltfNode[nodeMemberName][2],
      gltfNode[nodeMemberName][3]
    );
    return true;
  }
  return false;
};

class GltfNode {
  name: string = "";
  transform: Transform = new Transform();
  children: number[] = new Array<number>();
  mesh: number = -1;
  skin: number = -1;
  camera: number = -1; // For now I won't care about this. TODO: Implement gltf as a scene graph for whole scenes

  constructor(gltfNode: any) {
    setPropertyWithoutTypeConversion(gltfNode, "name", this, "name");
    if (!this.setMatrix(gltfNode)) {
      setQuat(gltfNode, "rotation", this.transform, "rotation");
      setVec3(gltfNode, "scale", this.transform, "scale");
      setVec3(gltfNode, "translation", this.transform, "position");
    }
    setPropertyWithoutTypeConversion(gltfNode, "children", this, "children");
    setPropertyWithoutTypeConversion(gltfNode, "mesh", this, "mesh");
    setPropertyWithoutTypeConversion(gltfNode, "skin", this, "skin");
    setPropertyWithoutTypeConversion(gltfNode, "camera", this, "camera");
  }

  setMatrix(gltfNode): boolean {
    if (gltfNode.matrix != undefined && gltfNode.matrix.length == 16) {
      mat4.set(
        this.transform.matrix,
        gltfNode.matrix[0],
        gltfNode.matrix[1],
        gltfNode.matrix[2],
        gltfNode.matrix[3],
        gltfNode.matrix[4],
        gltfNode.matrix[5],
        gltfNode.matrix[6],
        gltfNode.matrix[7],
        gltfNode.matrix[8],
        gltfNode.matrix[9],
        gltfNode.matrix[10],
        gltfNode.matrix[11],
        gltfNode.matrix[12],
        gltfNode.matrix[13],
        gltfNode.matrix[14],
        gltfNode.matrix[15]
      );
      mat4.getRotation(this.transform.rotation, this.transform.matrix);
      mat4.getScaling(this.transform.scale, this.transform.matrix);
      mat4.getTranslation(this.transform.position, this.transform.matrix);

      return true;
    }
    return false;
  }

  setRotation(gltfNode: any) {
    if (gltfNode.rotation != undefined) {
      quat.set(
        this.transform.rotation,
        gltfNode.rotation[0],
        gltfNode.rotation[1],
        gltfNode.rotation[2],
        gltfNode.rotation[3]
      );
      return true;
    }
    return false;
  }
}

class GltfAccessor {
  bufferView: number = -1;
  componentType: number = -1;
  count: number = 0;
  type: string = "";
  max: vec3; // TODO: figure out if these are needed or if I can just skip them because I can calculate bounding boxes myself.
  min: vec3; // TODO: figure out if these are needed or if I can just skip them because I can calculate bounding boxes myself.
  constructor(gltfAccessor: any) {
    setPropertyWithoutTypeConversion(
      gltfAccessor,
      "bufferView",
      this,
      "bufferView"
    );
    setPropertyWithoutTypeConversion(
      gltfAccessor,
      "componentType",
      this,
      "componentType"
    );
    setPropertyWithoutTypeConversion(gltfAccessor, "count", this, "count");
    setPropertyWithoutTypeConversion(gltfAccessor, "type", this, "type");
  }
}

class GltfBufferView {
  buffer: number = -1;
  byteLength: number = 0;
  byteOffset: number = 0;
  byteStride: number = 0;
  target: number = -1;

  constructor(gltfBufferView: any) {
    setPropertyWithoutTypeConversion(gltfBufferView, "buffer", this, "buffer");
    setPropertyWithoutTypeConversion(
      gltfBufferView,
      "byteLength",
      this,
      "byteLength"
    );
    setPropertyWithoutTypeConversion(
      gltfBufferView,
      "byteOffset",
      this,
      "byteOffset"
    );
    setPropertyWithoutTypeConversion(
      gltfBufferView,
      "byteStride",
      this,
      "byteStride"
    );
    setPropertyWithoutTypeConversion(gltfBufferView, "target", this, "target");
  }
}

class GltfAttributes {
  POSITION: number = -1;
  NORMAL: number = -1;
  TEXCOORD_0: number = -1;
  JOINTS_0: number = -1;
  WEIGHTS_0: number = -1;
  constructor(gltfAttribute: any) {
    setPropertyWithoutTypeConversion(
      gltfAttribute,
      "POSITION",
      this,
      "POSITION"
    );
    setPropertyWithoutTypeConversion(gltfAttribute, "NORMAL", this, "NORMAL");
    setPropertyWithoutTypeConversion(
      gltfAttribute,
      "TEXCOORD_0",
      this,
      "TEXCOORD_0"
    );
    setPropertyWithoutTypeConversion(
      gltfAttribute,
      "JOINTS_0",
      this,
      "JOINTS_0"
    );
    setPropertyWithoutTypeConversion(
      gltfAttribute,
      "WEIGHTS_0",
      this,
      "WEIGHTS_0"
    );
  }
}

class GltfPrimitive {
  attributes: GltfAttributes;
  indices: number = -1;
  material: number = -1;
  constructor(gltfPrimitive: any) {
    this.attributes = new GltfAttributes(gltfPrimitive.attributes);
    setPropertyWithoutTypeConversion(gltfPrimitive, "indices", this, "indices");
    setPropertyWithoutTypeConversion(
      gltfPrimitive,
      "material",
      this,
      "material"
    );
  }
}

class GltfMesh {
  name: string = "";
  primitives: GltfPrimitive[] = new Array<GltfPrimitive>();

  constructor(gltfMesh: any) {
    setPropertyWithoutTypeConversion(gltfMesh, "name", this, "name");
    if (gltfMesh.primitives != undefined) {
      for (const primitive of gltfMesh.primitives) {
        this.primitives.push(new GltfPrimitive(primitive));
      }
    }
  }
}

class GltfSkin {
  name: string = "";
  inverseBindMatrices: number = -1;
  joints: number[] = new Array<number>();

  constructor(gltfSkin: any) {
    setPropertyWithoutTypeConversion(gltfSkin, "name", this, "name");
    setPropertyWithoutTypeConversion(
      gltfSkin,
      "inverseBindMatrices",
      this,
      "inverseBindMatrices"
    );
    setPropertyWithoutTypeConversion(gltfSkin, "joints", this, "joints");
  }
}

export default class GltfObject {
  gltfJsonContent: any;
  nodes: GltfNode[];
  nodeNameToIndexMap: Map<string, number>;
  accessors: GltfAccessor[];
  bufferViews: GltfBufferView[];
  meshes: GltfMesh[];
  skins: GltfSkin[];

  constructor(gltfJsonContent: any) {
    this.gltfJsonContent = gltfJsonContent;
    this.nodes = new Array<GltfNode>();
    this.nodeNameToIndexMap = new Map<string, number>();
    this.accessors = new Array<GltfAccessor>();
    this.bufferViews = new Array<GltfBufferView>();
    this.meshes = new Array<GltfMesh>();
    this.skins = new Array<GltfSkin>();
    this.parse();
  }

  private parse() {
    if (this.gltfJsonContent.nodes != undefined) {
      for (const node of this.gltfJsonContent.nodes) {
        let i = this.nodes.push(new GltfNode(node)) - 1;
        if (this.nodes[i].name != "") {
          this.nodeNameToIndexMap.set(this.nodes[i].name, i);
        }
      }
    }

    if (this.gltfJsonContent.accessors != undefined) {
      for (const accessor of this.gltfJsonContent.accessors) {
        let i = this.accessors.push(new GltfAccessor(accessor)) - 1;
      }
    }

    if (this.gltfJsonContent.bufferViews != undefined) {
      for (const bufferView of this.gltfJsonContent.bufferViews) {
        let i = this.bufferViews.push(new GltfBufferView(bufferView)) - 1;
      }
    }

    if (this.gltfJsonContent.meshes != undefined) {
      for (const mesh of this.gltfJsonContent.meshes) {
        let i = this.meshes.push(new GltfMesh(mesh)) - 1;
      }
    }

    if (this.gltfJsonContent.skins != undefined) {
      for (const skin of this.gltfJsonContent.skins) {
        let i = this.skins.push(new GltfSkin(skin)) - 1;
      }
    }

    for (const node of this.nodes) {
      if (node.children != undefined) {
        for (let child of node.children) {
          this.nodes[child].transform.parentTransform = node.transform;
        }
      }
    }

    console.log(this.nodes.length);
  }

  getNumMeshes(): number {
    return this.meshes.length;
  }

  private getBufferInfoFromAttribute(
    primitive: GltfPrimitive,
    attribute: string
  ): { buffer: number; offset: number; stride: number, length: number; data: Buffer } {
    if (primitive.attributes[attribute] < 0) {
      return null;
    }
    const bufferView =
      this.bufferViews[
        this.accessors[primitive.attributes[attribute]].bufferView
      ];
    let buffer = bufferView.buffer;
    let offset = bufferView.byteOffset;
    let stride = bufferView.byteStride;
    let length = bufferView.byteLength;
    return {
      buffer: buffer,
      offset: offset,
      stride: stride,
      length: length,
      data: new glTypeToTypedArrayMap[
        this.accessors[primitive.attributes[attribute]].componentType
      ](
        this.gltfJsonContent.buffers[buffer],
        offset,
        length /
          glTypeToByteSize[
            this.accessors[primitive.attributes[attribute]].componentType
          ]
      ),
    };
  }

  private getBufferInfoForIndex(primitive: GltfPrimitive): {
    buffer: number;
    offset: number;
    stride: number;
    length: number;
    data: Buffer;
  } {
    const bufferView =
      this.bufferViews[this.accessors[primitive.indices].bufferView];
    let buffer = bufferView.buffer;
    let offset = bufferView.byteOffset;
    let stride = bufferView.byteStride;
    let length = bufferView.byteLength;
    return {
      buffer: buffer,
      offset: offset,
      stride: stride,
      length: length,
      data: new glTypeToTypedArrayMap[
        this.accessors[primitive.indices].componentType
      ](
        this.gltfJsonContent.buffers[buffer],
        offset,
        length /
          glTypeToByteSize[this.accessors[primitive.indices].componentType]
      ),
    };
  }

  private getBufferInfoForInverseBindMatrices(skin: GltfSkin): {
    buffer: number;
    offset: number;
    stride: number;
    length: number;
    data: Buffer;
  } {
    const bufferView =
      this.bufferViews[this.accessors[skin.inverseBindMatrices].bufferView];
    let buffer = bufferView.buffer;
    let offset = bufferView.byteOffset;
    let stride = bufferView.byteStride;
    let length = bufferView.byteLength;
    return {
      buffer: buffer,
      offset: offset,
      stride: stride,
      length: length,
      data: new glTypeToTypedArrayMap[
        this.accessors[skin.inverseBindMatrices].componentType
      ](
        this.gltfJsonContent.buffers[buffer],
        offset,
        length /
          glTypeToByteSize[
            this.accessors[skin.inverseBindMatrices].componentType
          ]
      ),
    };
  }

  getBufferData(
    meshIdx: number
  ): Array<{ vertexData: Float32Array; indexData: Int32Array }> {
    if (meshIdx >= this.meshes.length) {
      return null;
    }

    if (
      this.meshes[meshIdx].primitives == undefined &&
      this.meshes[meshIdx].primitives.length == 0
    ) {
      return null;
    }

    let buffers = new Array<{
      vertexData: Float32Array;
      indexData: Int32Array;
    }>();

    for (const primitive of this.meshes[meshIdx].primitives) {
      let numberOfVertices = 0;
      let numberOfIndices = 0;
      // Check that all accessors corresponding to the attributes in the primitive have the same count. If so add on to the number of vertices
      let attributesIndices = [];
      if (primitive.attributes.POSITION >= 0) {
        attributesIndices.push(primitive.attributes.POSITION);
      }
      if (primitive.attributes.NORMAL >= 0) {
        attributesIndices.push(primitive.attributes.NORMAL);
      }
      if (primitive.attributes.TEXCOORD_0 >= 0) {
        attributesIndices.push(primitive.attributes.TEXCOORD_0);
      }
      if (primitive.attributes.JOINTS_0 >= 0) {
        attributesIndices.push(primitive.attributes.JOINTS_0);
      }
      if (primitive.attributes.WEIGHTS_0 >= 0) {
        attributesIndices.push(primitive.attributes.WEIGHTS_0);
      }

      if (attributesIndices.length == 0) {
        continue;
      }
      let count = this.accessors[attributesIndices[0]].count;
      for (let i = 1; i < attributesIndices.length; i++) {
        if (this.accessors[attributesIndices[i]].count != count) {
          count = -1;
          break;
        }
      }

      if (count < 0) {
        continue;
      }

      numberOfVertices = count;

      if (primitive.indices < 0) {
        continue;
      }

      numberOfIndices += this.accessors[primitive.indices].count;

      let bufferIndex =
        buffers.push({
          vertexData: new Float32Array(numberOfVertices * 16),
          indexData: new Int32Array(numberOfIndices),
        }) - 1;

      let positionsBufferInfo = this.getBufferInfoFromAttribute(
        primitive,
        "POSITION"
      );
      let normalBufferInfo = this.getBufferInfoFromAttribute(
        primitive,
        "NORMAL"
      );
      let texCoordsBufferInfo = this.getBufferInfoFromAttribute(
        primitive,
        "TEXCOORD_0"
      );
      let weightsBufferInfo = this.getBufferInfoFromAttribute(
        primitive,
        "WEIGHTS_0"
      );
      let jointsBufferInfo = this.getBufferInfoFromAttribute(
        primitive,
        "JOINTS_0"
      );

      for (let i = 0; i < numberOfVertices; i++) {
        // vec3 inPosition
        let o = 0;
        let stride = 3;
        for (let j = 0; j < stride; j++) {
          if (positionsBufferInfo == undefined) {
            buffers[bufferIndex].vertexData[i * 16 + o] = 0.0;
          }
          else {
            buffers[bufferIndex].vertexData[i * 16 + o] =
              positionsBufferInfo.data[i * stride + j];
          }
          o++;
        }
        // vec3 inNormal
        stride = 3;
        for (let j = 0; j < stride; j++) {
          if (normalBufferInfo == undefined) {
            buffers[bufferIndex].vertexData[i * 16 + o] = 1.0;
          }
          else {
            buffers[bufferIndex].vertexData[i * 16 + o] =
              normalBufferInfo.data[i * stride + j];
          }
          o++;
        }
        // vec2 inTexCoords
        stride = 2;
        for (let j = 0; j < stride; j++) {
          if (texCoordsBufferInfo == undefined) {
            buffers[bufferIndex].vertexData[i * 16 + o] = 0.0;
          }
          else {
            buffers[bufferIndex].vertexData[i * 16 + o] =
              texCoordsBufferInfo.data[i * stride + j];
          }
          o++;
        }
        // vec4 inWeight
        stride = 4;
        for (let j = 0; j < stride; j++) {
          if (weightsBufferInfo == undefined) {
            buffers[bufferIndex].vertexData[i * 16 + o] = 0.0;
          }
          else {
            buffers[bufferIndex].vertexData[i * 16 + o] =
              weightsBufferInfo.data[i * stride + j];
          }
          o++;
        }
        // vec4 inBoneIdx; 12
        stride = 4;
        for (let j = 0; j < stride; j++) {
          if (jointsBufferInfo == undefined) {
            buffers[bufferIndex].vertexData[i * 16 + o] = 0.0;
          }
          else {
            buffers[bufferIndex].vertexData[i * 16 + o] =
              jointsBufferInfo.data[i * stride + j];
          }
          o++;
        }
      }

      let indicesBufferInfo = this.getBufferInfoForIndex(primitive);
      for (let i = 0; i < numberOfIndices; i++) {
        buffers[bufferIndex].indexData[i] = indicesBufferInfo.data[i];
      }
    }
    return buffers;
  }

  getBindPose(skinIdx: number): Array<mat4> {
    if (skinIdx >= this.skins.length) {
      return null;
    }

    let inverseBindMatricesBufferInfo =
      this.getBufferInfoForInverseBindMatrices(this.skins[skinIdx]);
    let inverseBindMatrices = new Array<mat4>();
    let ibd = inverseBindMatricesBufferInfo.data;

    for (let i = 0; i < ibd.length; i += 16) {
      inverseBindMatrices.push(
        mat4.set(
          mat4.create(),
          ibd[i + 0],
          ibd[i + 1],
          ibd[i + 2],
          ibd[i + 3],
          ibd[i + 4],
          ibd[i + 5],
          ibd[i + 6],
          ibd[i + 7],
          ibd[i + 8],
          ibd[i + 9],
          ibd[i + 10],
          ibd[i + 11],
          ibd[i + 12],
          ibd[i + 13],
          ibd[i + 14],
          ibd[i + 15]
        )
      );
    }
    return inverseBindMatrices;
  }

  getBoneMatrices(skinIdx: number): Array<mat4> {
    for (const node of this.nodes) {
      node.transform.calculateMatrices();
    }

    let boneMatrices = new Array<mat4>();
    for (const joint of this.skins[skinIdx].joints) {
      boneMatrices.push(this.nodes[joint].transform.matrix);
    }

    return boneMatrices;
  }
}
