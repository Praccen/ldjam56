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
import { Howler, Howl } from 'howler';

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
        this.lightSource = lightSource;
        this.lightSource.castShadow = true;
        this.lightSource.constant = 1.0;
        this.lightSource.linear = 0.7;
        this.lightSource.quadratic = 0.1;
        vec3.set(this.lightSource.colour, 1, 0.575, 0.161);
        this.mesh = null;

        this.holy = new Howl({
            src: ["Assets/Audio/foot_down.wav"], // TODO: HOLY SOUND!
            volume: 1.0,
            rate: 1.0,
            spatial: true,
            pos: [this.position[0], this.position[1], this.position[2]],
            panningModel: "HRTF", // HRTF for realistic 3D audio
            refDistance: 10,
            rolloffFactor: 1,
        });
        scene
            .addNewMesh(
                "Assets/gltf/Cheese/cheese.gltf",
                "CSS:rgb(1,1,1)",
                "CSS:rgb(0,0,0)"
            )
            .then((aMeshBundle) => {
                this.mesh = aMeshBundle;
                vec3.copy(aMeshBundle.transform.position, this.position);
                vec3.set(aMeshBundle.transform.scale, 10.2, 10.2, 10.2);
        });


        console.log("Cheese created");


    }

    playSound() {
        if (!this.holy.playing()) {
            this.holy.play();
            this.holy.pos(this.position);
        }
    }
}

