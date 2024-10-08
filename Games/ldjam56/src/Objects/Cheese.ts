// Cheese class containting the location and model loding of a cheese that the player picks up to finish the level
import {
  GraphicsBundle,
  Camera,
  MousePicking,
  PhysicsObject,
  quat,
  Renderer3D,
  Scene,
  vec2,
  vec3,
} from "praccen-web-engine";
import ProceduralMap from "../Generators/Map/ProceduralMapGenerator.js";
import { PointLight } from "../../../../dist/Engine.js";
import { Input } from "../Input.js";
import { Howler, Howl } from "howler";
import { Factories } from "../Utils/Factories.js";

export default class Cheese {
  readonly position: vec3;
  private mesh: GraphicsBundle;
  private readonly lightSource: PointLight;
  private readonly map: ProceduralMap;
  private readonly holy: Howl;

  constructor(
    scene: Scene,
    position: vec3,
    map: ProceduralMap,
    lightSource: PointLight
  ) {
    this.map = map;
    this.position = position;
    this.position[1] = 2;
    this.lightSource = lightSource;
    this.lightSource.castShadow = true;
    this.lightSource.constant = 1.0;
    this.lightSource.linear = 0.7;
    this.lightSource.quadratic = 0.1;
    vec3.set(this.lightSource.colour, 1.0, 0.937, 0.8);
    this.mesh = null;

    this.holy = new Howl({
      src: ["Assets/Audio/heavenly-choir-danijel-zambo-1-1-00-07.mp3"],
      volume: 1.0,
      rate: 1.0,
      spatial: true,
      pos: [this.position[0], this.position[1], this.position[2]],
      panningModel: "HRTF", // HRTF for realistic 3D audio
      refDistance: 10,
      rolloffFactor: 1,
    });
    Factories.createMesh(
      scene,
      "Assets/objs/Cheese.obj",
      this.position,
      vec3.fromValues(1.0, 1.0, 1.0),
      "CSS:rgb(255,204,51)",
      "CSS:rgb(0, 0, 0)"
    ).then((mesh) => {
      this.mesh = mesh;
      mesh.transform.origin[1] = 1.0;
    });
  }

  playSound() {
    if (!this.holy.playing()) {
      this.holy.play();
      this.holy.pos(this.position);
    }
  }

  // Update funciton that rotates the cheese with dt seconds
  update(dt: number) {
    if (this.mesh != undefined) {
      quat.rotateY(
        this.mesh.transform.rotation,
        this.mesh.transform.rotation,
        dt
      );
      this.lightSource.position = vec3.add(
        vec3.create(),
        this.position,
        vec3.fromValues(0, 1.0, 0)
      );
    }
  }
}
