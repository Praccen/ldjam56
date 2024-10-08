import * as ENGINE from "praccen-web-engine";
import { vec2, vec3 } from "praccen-web-engine";
import { Factories } from "../../Utils/Factories.js";
import { LabyrinthGenerator } from "../LabyrinthGenerator.js";

const wallPieceModels = new Array<{
  paths: string[];
  rot: number[];
  posOffset: vec3;
}>(
  { paths: [""], rot: [0], posOffset: vec3.fromValues(0.0, 0.0, 0.0) },
  {
    paths: [
      "Assets/objs/dungeonPack/wall_gated.obj",
      "Assets/objs/dungeonPack/wall_archedwindow_gated_scaffold.obj",
      "Assets/objs/dungeonPack/wall_shelves.obj",
    ],
    rot: [0, 180],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: [
      "Assets/objs/dungeonPack/wall_gated.obj",
      "Assets/objs/dungeonPack/wall_archedwindow_gated_scaffold.obj",
      "Assets/objs/dungeonPack/wall_shelves.obj",
    ],
    rot: [90, 270],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner_gated.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner_gated.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner_gated.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner_gated.obj"],
    rot: [180],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [180],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_crossing.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [0],
    posOffset: vec3.fromValues(-2.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [180],
    posOffset: vec3.fromValues(2.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, -2.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 2.0),
  },
  {
    paths: [
      "Assets/objs/dungeonPack/pillar.obj",
      "Assets/objs/dungeonPack/pillar_decorated.obj",
      "Assets/objs/dungeonPack/crates_stacked.obj",
    ],
    rot: [0, 45, 90, 135, 180, 225, 270, 315],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: [
      "Assets/objs/dungeonPack/wall.obj",
      "Assets/objs/dungeonPack/wall_cracked.obj",
    ],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: [
      "Assets/objs/dungeonPack/wall.obj",
      "Assets/objs/dungeonPack/wall_cracked.obj",
    ],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_corner.obj"],
    rot: [180],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [180],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_Tsplit.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_crossing.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [0],
    posOffset: vec3.fromValues(-2.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [180],
    posOffset: vec3.fromValues(2.0, 0.0, 0.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [270],
    posOffset: vec3.fromValues(0.0, 0.0, -2.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/wall_endcap.obj"],
    rot: [90],
    posOffset: vec3.fromValues(0.0, 0.0, 2.0),
  },
  {
    paths: ["Assets/objs/dungeonPack/pillar.obj"],
    rot: [0],
    posOffset: vec3.fromValues(0.0, 0.0, 0.0),
  }
);

const physicsObjectScales = [
  vec3.fromValues(2.0, 5.0, 2.0), // Pillar / top left
  vec3.fromValues(9.0, 5.0, 2.0), // Top wall
  vec3.fromValues(2.0, 5.0, 9.0), // Left wall
];

const roomSize = 10.0;

class Path {
  start: vec2 = null;
  end: vec2 = null;
}

export default class ProceduralMap {
  private scene: ENGINE.Scene;
  private instancedMeshes: Map<string, ENGINE.GraphicsBundle>;
  private floorPhysicsObject: ENGINE.PhysicsObject;
  private physicsObjects: Array<ENGINE.PhysicsObject>;
  private map: Array<Array<number>>;
  private exploredAsciiMap: string;
  private visitedRooms: Set<string>;
  private playerSpawnRoom: vec2;
  private goalRoom: vec2 = vec2.create();
  private enemyPaths: Map<string, Path> = new Map<string, Path>();
  private enemyNumbers: string[] = new Array<string>();
  focusRoom: vec2;
  physicsScene: ENGINE.PhysicsScene;
  wallsPhysicsScene: ENGINE.PhysicsScene;
  private finalLevel: boolean = false;

  constructor(
    scene: ENGINE.Scene,
    physicsScene: ENGINE.PhysicsScene,
    level: number,
    finalLevel: boolean
  ) {
    this.scene = scene;
    this.physicsScene = physicsScene;
    this.wallsPhysicsScene = new ENGINE.PhysicsScene();
    vec3.zero(this.wallsPhysicsScene.gravity);
    this.instancedMeshes = new Map<string, ENGINE.GraphicsBundle>();
    this.finalLevel = finalLevel;

    // 8 objects for walls and corners of the room that the player is currently in
    // Starts top left and goes clockwise
    this.physicsObjects = new Array<ENGINE.PhysicsObject>();
    let scale = [
      vec3.fromValues(2.0, 5.0, 2.0),
      vec3.fromValues(9.0, 5.0, 2.0),
      vec3.fromValues(2.0, 5.0, 2.0),
      vec3.fromValues(2.0, 5.0, 9.0),
      vec3.fromValues(2.0, 5.0, 2.0),
      vec3.fromValues(9.0, 5.0, 2.0),
      vec3.fromValues(2.0, 5.0, 2.0),
      vec3.fromValues(2.0, 5.0, 9.0),
    ];

    // let debugBoxes = new Array<ENGINE.GraphicsBundle>(8);

    for (let i = 0; i < 8; i++) {
      this.physicsObjects.push(this.physicsScene.addNewPhysicsObject());
      this.physicsObjects[i].transform.position[1] = -50; // Move them down far below the ground as a start
      this.physicsObjects[i].transform.scale = scale[i];
      this.physicsObjects[i].isStatic = true;
      this.physicsObjects[i].frictionCoefficient = 0.0;

      // scene.addNewMesh("Assets/objs/cube.obj", "CSS:rgb(255, 0, 0)", "CSS:rgb(0, 0, 0)").then((bundle) => {
      //     debugBoxes[i] = bundle;
      //     bundle.transform = this.physicsObjects[i].transform;
      // });
    }

    this.exploredAsciiMap = "";
    this.visitedRooms = new Set<string>();
    this.playerSpawnRoom = vec2.fromValues(0, 0);

    this.focusRoom = vec2.fromValues(-1.0, -1.0);
    // Dont put goal next to a wall or it will make a hole into the ground
    const mapLayout =
      // `
      // 11111111111111
      // 11111111111111
      // 11111116111111
      // 20511111111111
      // 20114111114012
      // 11111111111111
      // 11111111111111
      // `;
      `
    A11111c11111dB
    21101110111012
    21441100444112
    20500000004461
    20114111114012
    21111001111222
    b22211C11222Da
    `;

    const mapLayout2 = `
    000a11111111111111b
    05001111d1111113111
    11101e0100000E1111D
    1120100101110112111
    1C11100111610111121
    1111100001110112111
    1111F00000000f11111
    1B112111121113111A1
    11131112111c1111111
    `;
    // `
    // 11111111111111
    // 11111111111111
    // 11111116111111
    // 20511111111111
    // 20114111114012
    // 11111111111111
    // 11111111111111
    // `;

    // `
    // 00000000000000000
    // 00001111211110000
    // 01232111111123210
    // 01100011111000110
    // 01110001110001110
    // 01111000100011110
    // 01111104440111110
    // 02111114541111120
    // 01111104440111110
    // 01111100100111110
    // 01110001110001110
    // 01100011111000110
    // 01232111111123210
    // 00001111211110000
    // 00000000000000000
    // `

    // `
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    // `

    let mustGoRooms = [];
    let noGoRooms = [];
    let connectionRooms = [];

    let columns = 0;
    let rowNr = 0;

    let currentMap = mapLayout;
    if (level == 2) {
      currentMap = mapLayout2;
    }
    for (let row of currentMap.split("\n")) {
      row = row.trim();
      if (row.length == 0) {
        continue;
      }

      columns = Math.max(columns, row.length);

      for (let columnNr = 0; columnNr < row.length; columnNr++) {
        if (row[columnNr] == "0") {
          noGoRooms.push([columnNr, rowNr]);
        } else if (row[columnNr] == "2") {
          mustGoRooms.push([columnNr, rowNr]);
        } else if (row[columnNr] == "3") {
          noGoRooms.push([columnNr, rowNr]);
          connectionRooms.push([columnNr, rowNr]);
        } else if (row[columnNr] == "4") {
          mustGoRooms.push([columnNr, rowNr]);
          connectionRooms.push([columnNr, rowNr]);
        } else if (row[columnNr] == "5") {
          mustGoRooms.push([columnNr, rowNr]);
          connectionRooms.push([columnNr, rowNr]);
          vec2.set(this.playerSpawnRoom, columnNr, rowNr);
        } else if (row[columnNr] == "6") {
          mustGoRooms.push([columnNr, rowNr]);
          connectionRooms.push([columnNr, rowNr]);
          vec2.set(this.goalRoom, columnNr * 2 + 1, rowNr * 2 + 1);
        } else if (isNaN(+row[columnNr])) {
          mustGoRooms.push([columnNr, rowNr]);
          let num = row[columnNr];
          let pos = vec2.fromValues(columnNr * 2 + 1, rowNr * 2 + 1);

          if (!this.enemyNumbers.includes(num.toUpperCase())) {
            this.enemyNumbers.push(num.toUpperCase());
            this.enemyPaths.set(num.toUpperCase(), new Path());
            // console.log("Adding: ", num.toUpperCase());
          }
          if (num == num.toUpperCase()) {
            // console.log("Starting: ", num.toUpperCase());
            this.enemyPaths.get(num.toUpperCase()).start = pos;
          } else {
            // console.log("Ending: ", num.toUpperCase());
            this.enemyPaths.get(num.toUpperCase()).end = pos;
          }

          // console.log(pos);
        }
      }
      rowNr++;
    }
    const rows = rowNr;

    this.map = LabyrinthGenerator.getLabyrinth(
      columns,
      rows,
      mustGoRooms,
      noGoRooms,
      connectionRooms,
      0.95
    );

    this.floorPhysicsObject = physicsScene.addNewPhysicsObject();
    this.floorPhysicsObject.isStatic = true;
    this.floorPhysicsObject.frictionCoefficient = 10.0;
    vec3.set(
      this.floorPhysicsObject.transform.position,
      (columns * roomSize) / 2.0,
      -0.5,
      (rows * roomSize) / 2.0
    );
    vec3.set(
      this.floorPhysicsObject.transform.scale,
      columns * roomSize * 2.0,
      1.0,
      rows * roomSize * 2.0
    );

    this.createMeshes(columns, rows, scene);
  }

  async createMeshes(columns: number, rows: number, scene: ENGINE.Scene) {
    let meshesToLoad = new Set<string>();
    for (let piece of wallPieceModels) {
      for (let path of piece.paths) {
        meshesToLoad.add(path);
      }
    }

    meshesToLoad.add("Assets/objs/MyDungeon/Floor.obj");
    meshesToLoad.add("Assets/objs/MyDungeon/Tentacles.obj");
    meshesToLoad.add(
      "Assets/objs/dungeonPack/floor_tile_extralarge_grates_open.obj"
    );
    meshesToLoad.add("Assets/objs/dungeonPack/wall_half.obj");

    // Load meshes before creating
    this.scene.renderer.meshStore
      .loadMeshes(Array.from(meshesToLoad), { loaded: 0 })
      .then(async () => {
        for (let piece of wallPieceModels) {
          for (let path of piece.paths)
            if (path != "") {
              if (!this.instancedMeshes.has(path)) {
                this.instancedMeshes.set(
                  path,
                  await Factories.createInstancedMesh(
                    scene,
                    path,
                    "Assets/Textures/dungeon_texture.png",
                    "CSS:rgb(0, 0, 0)"
                  )
                );
              }
            }
        }

        this.instancedMeshes.set(
          "Assets/objs/MyDungeon/Floor.obj",
          await Factories.createInstancedMesh(
            scene,
            "Assets/objs/MyDungeon/Floor.obj",
            "Assets/objs/MyDungeon/Floor.mtl",
            "CSS:rgb(0, 0, 0)"
          )
        );

        this.instancedMeshes.set(
          "Assets/objs/MyDungeon/Tentacles.obj",
          await Factories.createInstancedMesh(
            scene,
            "Assets/objs/MyDungeon/Tentacles.obj",
            "Assets/objs/MyDungeon/Tentacles.mtl",
            "Assets/objs/MyDungeon/Tentacles_spec.mtl"
          )
        );

        this.instancedMeshes.set(
          "Assets/objs/dungeonPack/floor_tile_extralarge_grates_open.obj",
          await Factories.createInstancedMesh(
            scene,
            "Assets/objs/dungeonPack/floor_tile_extralarge_grates_open.obj",
            "Assets/Textures/dungeon_texture.png",
            "CSS:rgb(0, 0, 0)"
          )
        );

        this.instancedMeshes.set(
          "Assets/objs/dungeonPack/wall_half.obj",
          await Factories.createInstancedMesh(
            scene,
            "Assets/objs/dungeonPack/wall_half.obj",
            "Assets/Textures/dungeon_texture.png",
            "CSS:rgb(0, 0, 0)"
          )
        );

        this.instancedMeshes.set(
          "Assets/objs/dungeonPack/stairs.obj",
          await Factories.createInstancedMesh(
            scene,
            "Assets/objs/dungeonPack/stairs.obj",
            "Assets/Textures/dungeon_texture.png",
            "CSS:rgb(0, 0, 0)"
          )
        );

        for (let column = 0; column < columns + 1; column++) {
          for (let row = 0; row < rows + 1; row++) {
            // Tile filling (floor or blocked)
            if (column < columns && row < rows) {
              if (
                !this.finalLevel &&
                column * 2 + 1 == this.goalRoom[0] &&
                row * 2 + 1 == this.goalRoom[1]
              ) {
                let mesh = this.instancedMeshes.get(
                  "Assets/objs/dungeonPack/stairs.obj"
                );

                mesh.transform.position = vec3.clone(
                  this.getRoomCenterWorldPos(this.goalRoom)
                );
                vec3.add(
                  mesh.transform.position,
                  mesh.transform.position,
                  vec3.fromValues(5, -2, 0)
                );

                ENGINE.quat.fromEuler(mesh.transform.rotation, 0.0, -90, 0.0);
                vec3.set(mesh.transform.scale, 2.5, -1, 2.5);
                let matrix = ENGINE.mat4.create();
                mesh.transform.calculateMatrices(
                  matrix,
                  mesh.transform.normalMatrix,
                  true
                );
                mesh.modelMatrices.push(matrix);
                continue;
              }

              if (this.map[column * 2 + 1][row * 2 + 1] == 0) {
                let mesh = this.instancedMeshes.get(
                  "Assets/objs/MyDungeon/Floor.obj"
                );

                vec3.set(
                  mesh.transform.position,
                  5.0 + 10 * column,
                  0.0,
                  5.0 + 10 * row
                );
                ENGINE.quat.fromEuler(
                  mesh.transform.rotation,
                  0.0,
                  column * 90 + row * 90,
                  0.0
                );
                let matrix = ENGINE.mat4.create();
                mesh.transform.calculateMatrices(
                  matrix,
                  mesh.transform.normalMatrix,
                  true
                );
                mesh.modelMatrices.push(matrix);
              } else if (this.map[column * 2 + 1][row * 2 + 1] == -1) {
                // If there should be something in the voids, create it here
                // let mesh = this.instancedMeshes.get("Assets/objs/MyDungeon/Tentacles.obj");
                // vec3.set(mesh.transform.position, 5.0 + 10 * column, -20.0, 5.0 + 10 * row);
                // ENGINE.quat.fromEuler(mesh.transform.rotation, 0.0, column * 90 + row * 90, 0.0);
                // vec3.set(mesh.transform.scale, 0.5, 1.0, 0.5);
                // let matrix = ENGINE.mat4.create();
                // mesh.transform.calculateMatrices(matrix, mesh.transform.normalMatrix, true);
                // mesh.modelMatrices.push(matrix);
                // let mesh = this.instancedMeshes.get("Assets/objs/dungeonPack/floor_tile_extralarge_grates_open.obj");
                // vec3.set(mesh.transform.position, 5.0 + 10 * column, 0.0, 5.0 + 10 * row);
                // ENGINE.quat.fromEuler(mesh.transform.rotation, 0.0, column * 90 + row * 90, 0.0);
                // vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
                // let matrix = ENGINE.mat4.create();
                // mesh.transform.calculateMatrices(matrix, mesh.transform.normalMatrix, true);
                // mesh.modelMatrices.push(matrix);
              }
            }

            // Top of tile wall
            if (
              column < columns &&
              this.map[column * 2 + 1][row * 2] > 0 &&
              this.map[column * 2 + 1][row * 2] < wallPieceModels.length
            ) {
              const paths =
                wallPieceModels[this.map[column * 2 + 1][row * 2]].paths;
              const rots =
                wallPieceModels[this.map[column * 2 + 1][row * 2]].rot;
              let mesh = this.instancedMeshes.get(
                paths[Math.floor(Math.random() * paths.length)]
              );
              vec3.set(
                mesh.transform.position,
                5.0 + 10 * column - 1.0,
                0.0,
                5.0 + 10 * row - 5.0
              );
              vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
              ENGINE.quat.fromEuler(
                mesh.transform.rotation,
                0.0,
                rots[Math.floor(Math.random() * rots.length)],
                0.0
              );
              let matrix = ENGINE.mat4.create();
              mesh.transform.calculateMatrices(
                matrix,
                mesh.transform.normalMatrix,
                true
              );
              mesh.modelMatrices.push(matrix);

              mesh = this.instancedMeshes.get(
                "Assets/objs/dungeonPack/wall_half.obj"
              );
              vec3.set(
                mesh.transform.position,
                5.0 + 10 * column + 1.0,
                0.0,
                5.0 + 10 * row - 5.0
              );
              vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
              ENGINE.quat.fromEuler(mesh.transform.rotation, 0.0, rots[0], 0.0);
              matrix = ENGINE.mat4.create();
              mesh.transform.calculateMatrices(
                matrix,
                mesh.transform.normalMatrix,
                true
              );
              mesh.modelMatrices.push(matrix);

              let phyTrans = new ENGINE.Transform();
              vec3.set(
                phyTrans.position,
                5.0 + column * roomSize,
                0.0,
                5.0 + row * roomSize - 5.0
              );
              phyTrans.scale = vec3.clone(physicsObjectScales[1]);

              let physObj =
                this.wallsPhysicsScene.addNewPhysicsObject(phyTrans);
              physObj.isStatic = true;
              physObj.frictionCoefficient = 0.0;
            }

            // Left of tile wall
            if (
              row < rows &&
              this.map[column * 2][row * 2 + 1] > 0 &&
              this.map[column * 2][row * 2 + 1] < wallPieceModels.length
            ) {
              const paths =
                wallPieceModels[this.map[column * 2][row * 2 + 1]].paths;
              const rots =
                wallPieceModels[this.map[column * 2][row * 2 + 1]].rot;
              let mesh = this.instancedMeshes.get(
                paths[Math.floor(Math.random() * paths.length)]
              );
              vec3.set(
                mesh.transform.position,
                5.0 + 10 * column - 5.0,
                0.0,
                5.0 + 10 * row + 1.0
              );
              vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
              ENGINE.quat.fromEuler(
                mesh.transform.rotation,
                0.0,
                rots[Math.floor(Math.random() * rots.length)],
                0.0
              );
              let matrix = ENGINE.mat4.create();
              mesh.transform.calculateMatrices(
                matrix,
                mesh.transform.normalMatrix,
                true
              );
              mesh.modelMatrices.push(matrix);

              mesh = this.instancedMeshes.get(
                "Assets/objs/dungeonPack/wall_half.obj"
              );
              vec3.set(
                mesh.transform.position,
                5.0 + 10 * column - 5.0,
                0.0,
                5.0 + 10 * row - 1.0
              );
              vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
              ENGINE.quat.fromEuler(mesh.transform.rotation, 0.0, rots[0], 0.0);
              matrix = ENGINE.mat4.create();
              mesh.transform.calculateMatrices(
                matrix,
                mesh.transform.normalMatrix,
                true
              );
              mesh.modelMatrices.push(matrix);

              let phyTrans = new ENGINE.Transform();
              vec3.set(
                phyTrans.position,
                5.0 + column * roomSize - 5.0,
                0.0,
                5.0 + row * roomSize
              );
              phyTrans.scale = vec3.clone(physicsObjectScales[2]);

              let physObj =
                this.wallsPhysicsScene.addNewPhysicsObject(phyTrans);
              physObj.isStatic = true;
              physObj.frictionCoefficient = 0.0;
            }

            // Top left of tile corner
            if (
              this.map[column * 2][row * 2] > 0 &&
              this.map[column * 2][row * 2] < wallPieceModels.length
            ) {
              const paths =
                wallPieceModels[this.map[column * 2][row * 2]].paths;
              const rots = wallPieceModels[this.map[column * 2][row * 2]].rot;
              const path = paths[Math.floor(Math.random() * paths.length)];
              let mesh = this.instancedMeshes.get(path);
              vec3.set(
                mesh.transform.position,
                5.0 + 10 * column + -5.0,
                0.0,
                5.0 + 10 * row - 5.0
              );
              vec3.set(mesh.transform.scale, 1.0, 1.0, 1.0);
              ENGINE.quat.fromEuler(
                mesh.transform.rotation,
                0.0,
                rots[Math.floor(Math.random() * rots.length)],
                0.0
              );
              vec3.add(
                mesh.transform.position,
                mesh.transform.position,
                wallPieceModels[this.map[column * 2][row * 2]].posOffset
              );
              let matrix = ENGINE.mat4.create();
              mesh.transform.calculateMatrices(
                matrix,
                mesh.transform.normalMatrix,
                true
              );
              mesh.modelMatrices.push(matrix);

              // Only add a physics object for crossings if it's not a end piece
              if (
                this.map[column * 2][row * 2] % 16 < 12 ||
                this.map[column * 2][row * 2] % 16 > 15
              ) {
                let phyTrans = new ENGINE.Transform();
                vec3.set(
                  phyTrans.position,
                  5.0 + column * roomSize - 5.0,
                  0.0,
                  5.0 + row * roomSize - 5.0
                );
                phyTrans.scale = vec3.clone(physicsObjectScales[0]);

                let physObj =
                  this.wallsPhysicsScene.addNewPhysicsObject(phyTrans);
                physObj.isStatic = true;
                physObj.frictionCoefficient = 0.0;
              }
            }
          }
        }
        this.wallsPhysicsScene.update(0.0);
      });
  }

  updateFocusRoom(characterPosition: vec2) {
    // Calculate room from characterPosition
    let room = vec2.floor(
      vec2.create(),
      vec2.scale(vec2.create(), characterPosition, 1.0 / roomSize)
    );
    if (
      room[0] < 0 ||
      room[0] >= this.map.length ||
      room[1] < 0 ||
      room[1] >= this.map[0].length
    ) {
      return;
    }

    // If it's not the same as the current focus room, update the physics objects and update the focus room
    if (!vec2.equals(room, this.focusRoom)) {
      // Start with the corners
      if (this.map[room[0] * 2][room[1] * 2] > 0) {
        if (
          !(
            this.map[room[0] * 2][room[1] * 2] % 16 >= 12 &&
            this.map[room[0] * 2][room[1] * 2] % 16 <= 15
          )
        ) {
          vec3.set(
            this.physicsObjects[0].transform.position,
            5.0 + room[0] * roomSize - 5.0,
            0.0,
            5.0 + room[1] * roomSize - 5.0
          );
        }
      }
      if (this.map[room[0] * 2 + 2][room[1] * 2] > 0) {
        if (
          !(
            this.map[room[0] * 2 + 2][room[1] * 2] % 16 >= 12 &&
            this.map[room[0] * 2 + 2][room[1] * 2] % 16 <= 15
          )
        ) {
          vec3.set(
            this.physicsObjects[2].transform.position,
            5.0 + room[0] * roomSize + 5.0,
            0.0,
            5.0 + room[1] * roomSize - 5.0
          );
        }
      }
      if (this.map[room[0] * 2 + 2][room[1] * 2 + 2] > 0) {
        if (
          !(
            this.map[room[0] * 2 + 2][room[1] * 2 + 2] % 16 >= 12 &&
            this.map[room[0] * 2 + 2][room[1] * 2 + 2] % 16 <= 15
          )
        ) {
          vec3.set(
            this.physicsObjects[4].transform.position,
            5.0 + room[0] * roomSize + 5.0,
            0.0,
            5.0 + room[1] * roomSize + 5.0
          );
        }
      }
      if (this.map[room[0] * 2][room[1] * 2 + 2] > 0) {
        if (
          !(
            this.map[room[0] * 2][room[1] * 2 + 2] % 16 >= 12 &&
            this.map[room[0] * 2][room[1] * 2 + 2] % 16 <= 15
          )
        ) {
          vec3.set(
            this.physicsObjects[6].transform.position,
            5.0 + room[0] * roomSize - 5.0,
            0.0,
            5.0 + room[1] * roomSize + 5.0
          );
        }
      }

      // Then do the walls
      if (this.map[room[0] * 2 + 1][room[1] * 2] > 0) {
        vec3.set(
          this.physicsObjects[1].transform.position,
          5.0 + room[0] * roomSize,
          0.0,
          5.0 + room[1] * roomSize - 5.0
        );
      }
      if (this.map[room[0] * 2 + 2][room[1] * 2 + 1] > 0) {
        vec3.set(
          this.physicsObjects[3].transform.position,
          5.0 + room[0] * roomSize + 5.0,
          0.0,
          5.0 + room[1] * roomSize
        );
      }
      if (this.map[room[0] * 2 + 1][room[1] * 2 + 2] > 0) {
        vec3.set(
          this.physicsObjects[5].transform.position,
          5.0 + room[0] * roomSize,
          0.0,
          5.0 + room[1] * roomSize + 5.0
        );
      }
      if (this.map[room[0] * 2][room[1] * 2 + 1] > 0) {
        vec3.set(
          this.physicsObjects[7].transform.position,
          5.0 + room[0] * roomSize - 5.0,
          0.0,
          5.0 + room[1] * roomSize
        );
      }

      this.focusRoom = room;
      this.visitedRooms.add(room[0] + ";" + room[1]);
      this.exploredAsciiMap = LabyrinthGenerator.getAsciiMap(
        this.map,
        this.visitedRooms
      );
    }
  }

  getAsciiMapOfVisitedRooms(): string {
    return this.exploredAsciiMap;
  }

  getMapSize(): vec2 {
    return vec2.fromValues(
      ((this.map.length - 1) / 2.0) * roomSize,
      ((this.map[0].length - 1) / 2.0) * roomSize
    );
  }

  getPlayerSpawnRoom(): vec2 {
    return this.playerSpawnRoom;
  }
  getGoalRoom(): vec2 {
    return this.goalRoom;
  }

  getRoomCenterWorldPos(room: vec2): vec3 {
    let x = ((room[0] - 1) / 2) * roomSize + roomSize / 2;
    let y = ((room[1] - 1) / 2) * roomSize + roomSize / 2;
    return vec3.fromValues(x, 1, y);
  }

  getNumEnemies(): number {
    return this.enemyPaths.size;
  }

  getEnemyPath(num: number): Path {
    return this.enemyPaths.get(this.enemyNumbers[num]);
  }

  reconstructPath(previous: (vec2 | null)[][], target: vec2): vec2[] {
    const path: vec2[] = [];
    let current: vec2 | null = target;

    while (current !== null) {
      path.push(vec2.clone(current));
      current = previous[current[0]][current[1]];
    }

    return path.reverse();
  }

  findPath(start: vec2, target: vec2) {
    const rows = this.map.length;
    const cols = this.map[0].length;
    const directions: vec2[] = [
      vec2.fromValues(0, 1), // Right
      vec2.fromValues(1, 0), // Down
      vec2.fromValues(0, -1), // Left
      vec2.fromValues(-1, 0), // Up
    ];

    const distance: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(Infinity)
    );
    const previous: (vec2 | null)[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(null)
    );
    class PriorityQueue<T> {
      private elements: { item: T; priority: number }[] = [];

      enqueue(item: T, priority: number) {
        this.elements.push({ item, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
      }

      dequeue(): T | undefined {
        return this.elements.shift()?.item;
      }

      isEmpty(): boolean {
        return this.elements.length === 0;
      }
    }
    const queue = new PriorityQueue<vec2>();

    distance[start[0]][start[1]] = 0;
    queue.enqueue(start, 0);

    while (!queue.isEmpty()) {
      const current = queue.dequeue()!;
      const [x, y] = current;

      if (vec2.equals(current, target)) {
        return this.reconstructPath(previous, target);
      }

      for (const dir of directions) {
        const neighbor = vec2.add(vec2.create(), current, dir);
        const nx = neighbor[0];
        const ny = neighbor[1];

        if (
          nx >= 0 &&
          nx < rows &&
          ny >= 0 &&
          ny < cols &&
          this.map[nx][ny] == 0
        ) {
          const newDist = distance[x][y] + 1;

          if (newDist < distance[nx][ny]) {
            distance[nx][ny] = newDist;
            previous[nx][ny] = vec2.clone(current);
            queue.enqueue(neighbor, newDist);
          }
        }
      }
    }

    return null; // No path found
  }
}
