import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import Ray from "../Physics/Shapes/Ray";
import { Camera } from "../../../Engine";

export module MousePicking {
  export function GetRay(camera: Camera, mouseNDC: vec2): Ray {
    let mouseRayClip = vec4.fromValues(mouseNDC[0], mouseNDC[1], -1.0, 1.0);
    let mouseRayCamera = vec4.transformMat4(
      vec4.create(),
      mouseRayClip,
      mat4.invert(mat4.create(), camera.getProjectionMatrix())
    );
    mouseRayCamera[2] = -1.0;
    mouseRayCamera[3] = 0.0;
    let mouseRayWorld4D = vec4.transformMat4(
      vec4.create(),
      mouseRayCamera,
      mat4.invert(mat4.create(), camera.getViewMatrix())
    );
    let dir = vec3.normalize(
      vec3.create(),
      vec3.fromValues(
        mouseRayWorld4D[0],
        mouseRayWorld4D[1],
        mouseRayWorld4D[2]
      )
    );

    let ray = new Ray();
    ray.setDir(dir);
    ray.setStart(vec3.clone(camera.getPosition()));

    return ray;
  }
}
