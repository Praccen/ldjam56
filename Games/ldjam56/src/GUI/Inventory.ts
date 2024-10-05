import {
  Camera,
  Div,
  GraphicsBundle,
  GUIRenderer,
  quat,
  Renderer2D,
  Scene,
  TextObject2D,
  vec2,
  vec3,
} from "praccen-web-engine";
import { Input } from "../Input.js";
import { mat2 } from "gl-matrix";
import {
  ItemList,
  ItemSpec,
  Rarity,
  rarityColourMap,
} from "../Objects/Items/ItemSpecs.js";

const emptyTileColour = "#373737";

export class Item {
  spec: ItemSpec;
  graphicsBundle: GraphicsBundle;

  constructor(spec: ItemSpec, graphicsBundle: GraphicsBundle) {
    // Depp copy information from spec, to avoid changing the spec in the ItemList
    this.spec = {
      name: spec.name,
      description: spec.description,
      texturePath: spec.texturePath,
      rarity: spec.rarity,
      positions: [],
    };
    for (let pos of spec.positions) {
      this.spec.positions.push(vec2.clone(pos));
    }

    this.graphicsBundle = graphicsBundle;
  }

  rotate() {
    let rotationMatrix = mat2.create();
    mat2.rotate(rotationMatrix, rotationMatrix, Math.PI * 0.5);
    for (let pos of this.spec.positions) {
      vec2.round(pos, vec2.transformMat2(pos, pos, rotationMatrix));
    }
    quat.rotateZ(
      this.graphicsBundle.transform.rotation,
      this.graphicsBundle.transform.rotation,
      -Math.PI * 0.5
    );
  }

  setupGraphicsBundle(stride: number) {
    let xMax = 0;
    let xMin = 0;
    let yMax = 0;
    let yMin = 0;

    for (let position of this.spec.positions) {
      xMax = Math.max(position[0], xMax);
      xMin = Math.min(position[0], xMin);
      yMax = Math.max(position[1], yMax);
      yMin = Math.min(position[1], yMin);
    }

    vec3.set(
      this.graphicsBundle.transform.origin,
      -0.5 + (1.0 / (xMax - xMin + 1)) * 0.5,
      0.5 - (1.0 / (yMax - yMin + 1)) * 0.5,
      0.0
    );
    vec3.set(
      this.graphicsBundle.transform.scale,
      stride * (xMax - xMin + 1),
      stride * (yMax - yMin + 1),
      0.1
    );

    this.graphicsBundle.layer = 1;
  }
}

export default class Inventory {
  private guiRenderer: GUIRenderer;
  private toolTip: TextObject2D;
  private inventoryDiv: Div;
  private inventoryRenderer: Renderer2D;
  private inventoryScene: Scene;
  private inventoryCamera: Camera;

  private width: number;
  private height: number;
  private stride: number;
  private boxSide: number;

  private grid: { itemNr: number; gb: GraphicsBundle }[][];

  items: Item[];
  droppedItems: ItemSpec[];
  private holdingItemId: number;

  private spaceWasPressed: boolean;
  private mouseLeftWasPressed: boolean;
  private mouseRightWasPressed: boolean;

  enabled: boolean;

  constructor(guiRenderer: GUIRenderer) {
    this.guiRenderer = guiRenderer;
    this.inventoryDiv = guiRenderer.getNewDiv();
    this.inventoryDiv.ignoreEngineModifiers = true;
    this.inventoryDiv.getElement().style.backgroundColor = "#00000050";
    this.inventoryDiv.getElement().style.top = "0%";
    this.inventoryDiv.getElement().style.height = "100%";
    this.inventoryDiv.getElement().style.left = "0%";
    this.inventoryDiv.getElement().style.width = "100%";

    this.inventoryDiv.getElement().style.position = "absolute";
    this.inventoryDiv.getElement().style.zIndex = "4";
    this.inventoryDiv.getElement().style.overflow = "hidden";
    this.inventoryDiv.setHidden(false);

    // fetch("Assets/html/Inventory.html").then(async (response) => {
    //     const htmlContent = await response.text();
    //     this.inventoryDiv.getElement().innerHTML = htmlContent;
    // });

    this.toolTip = this.guiRenderer.getNew2DText(this.inventoryDiv);
    this.toolTip.getElement().style.zIndex = "10";
    this.toolTip.getElement().style.color = "white";
    this.toolTip.getElement().style.backgroundColor = "#00000070";
    this.toolTip.size = 14;
    this.toolTip.scaleWithWindow = false;
    this.toolTip.getElement().style.whiteSpace = "pre-wrap";
    this.toolTip.getElement().style.maxWidth = "20%";
    this.toolTip.getElement().style.padding = "1.0em";
    this.toolTip.getElement().style.overflow = "auto";

    this.inventoryRenderer = new Renderer2D();
    this.inventoryDiv
      .getElement()
      .appendChild(this.inventoryRenderer.domElement);
    this.inventoryRenderer.domElement.className = "inventoryCanvas";
    this.inventoryRenderer.setSize(1000, 500);
    this.inventoryRenderer.clearColour.a = 0.0;

    this.inventoryCamera = new Camera();
    this.inventoryCamera.setOrthogonal(true);
    this.inventoryCamera.setPosition(vec3.fromValues(0.0, 0.0, 1.0));
    this.inventoryCamera.setDir(vec3.fromValues(0.0, 0.0, -1.0));
    this.inventoryCamera.setFarPlaneDistance(3.0);

    this.width = 10;
    this.height = 6;
    this.stride = Math.min(1.8 / this.width, 1.8 / this.height);
    this.boxSide = this.stride * 0.8;

    this.grid = new Array<Array<{ itemNr: number; gb: GraphicsBundle }>>();
    this.createGrid();

    this.items = new Array<Item>();
    this.holdingItemId = -1;
    this.droppedItems = new Array<ItemSpec>();

    this.spaceWasPressed = false;
    this.mouseLeftWasPressed = false;
    this.mouseRightWasPressed = false;

    this.enabled = true;
  }

  private async createGrid() {
    this.inventoryScene = new Scene(this.inventoryRenderer);
    for (let x = 0; x < this.width; x++) {
      this.grid.push(new Array<{ itemNr: number; gb: GraphicsBundle }>());
      for (let y = 0; y < this.height; y++) {
        let mesh = await this.inventoryScene.addNewMesh(
          "Assets/objs/cube.obj",
          "CSS:" + emptyTileColour,
          "CSS:rgb(0,0,0)"
        );
        vec3.set(mesh.transform.scale, this.boxSide, this.boxSide, 0.1);
        vec3.set(
          mesh.transform.position,
          -0.9 + this.stride * 0.5 + x * this.stride,
          0.9 - this.stride * 0.5 - y * this.stride,
          -1.0
        );
        this.grid[x].push({ itemNr: -1, gb: mesh });
      }
    }
  }

  toggle() {
    this.inventoryDiv.toggleHidden();
    this.enabled = !this.inventoryDiv.getHidden();
  }

  resize(width: number, height: number) {
    this.inventoryRenderer.setSize(width, height, true);
    let aspectRatio = width / height;
    let h = 4;
    let w = 4 * aspectRatio;
    this.inventoryCamera.setOrthogonalDimensions(
      w * -0.5,
      w * 0.5,
      h * -0.5,
      h * 0.5
    );
  }

  private testItemPlacement(item: Item, x: number, y: number): boolean {
    for (let position of item.spec.positions) {
      let testX = x + position[0];
      let testY = y + position[1];
      if (
        testX < 0 ||
        testX >= this.width ||
        testY < 0 ||
        testY >= this.height
      ) {
        return false;
      }
      if (this.grid[testX][testY].itemNr >= 0) {
        return false;
      }
    }
    return true;
  }

  private getItemsInTheWay(item: Item, x: number, y: number): Set<number> {
    let itemsInTheWay = new Set<number>();
    for (let position of item.spec.positions) {
      let testX = x + position[0];
      let testY = y + position[1];
      if (
        testX < 0 ||
        testX >= this.width ||
        testY < 0 ||
        testY >= this.height
      ) {
        itemsInTheWay.add(-1); // -1 will indicate that the item goes outside the grid
      } else if (this.grid[testX][testY].itemNr >= 0) {
        itemsInTheWay.add(this.grid[testX][testY].itemNr);
      }
    }
    return itemsInTheWay;
  }

  private tryPlaceItem(
    item: Item,
    x: number,
    y: number,
    itemIndex?: number
  ): boolean {
    if (!this.testItemPlacement(item, x, y)) {
      return false;
    }

    let itemSpot = -1;

    if (itemIndex != undefined) {
      itemSpot = itemIndex;
    }

    if (itemSpot == -1) {
      // Find if there is a spot with null in the items list (this means there used to be an item there but it has been removed)
      itemSpot = this.items.findIndex((value) => {
        return value == undefined;
      });
    }

    if (itemSpot >= 0) {
      // There was a free space, no need to expand, use the free space
      this.items[itemSpot] = item;
    } else {
      // There's no available space in the items array, push a new item
      itemSpot = this.items.push(item) - 1;
    }

    let colour = "CSS:rgb(0, 0, 0)";

    if (rarityColourMap.has(item.spec.rarity)) {
      colour = "CSS:" + rarityColourMap.get(item.spec.rarity);
    }

    for (let position of item.spec.positions) {
      this.grid[x + position[0]][y + position[1]].itemNr = itemSpot;
      this.grid[x + position[0]][y + position[1]].gb.diffuse =
        this.inventoryRenderer.textureStore.getTexture(colour);
    }

    vec3.set(
      item.graphicsBundle.transform.position,
      -0.9 + (x + 0.5) * this.stride,
      0.9 - (y + 0.5) * this.stride,
      0.0
    );
    item.graphicsBundle.layer = 1;
    return true;
  }

  private getInventoryCoords(): vec2 {
    let rect = this.inventoryRenderer.domElement.getClientRects()[0];
    let aspectRatio = rect.width / rect.height;
    let h = 2;
    let w = 2 * aspectRatio;

    let ndc = vec2.fromValues(
      (Input.mousePosition.x - rect.left) / rect.width,
      (Input.mousePosition.y - rect.top) / rect.height
    );
    ndc[0] = ndc[0] * 2.0 - 1.0;
    ndc[1] = ndc[1] * -2.0 + 1.0;
    ndc[0] *= w;
    ndc[1] *= h;
    return ndc;
  }

  private getCoordsFromMousePosition(): vec2 {
    const inventoryCoords = this.getInventoryCoords();

    if (
      inventoryCoords[0] > -0.9 &&
      inventoryCoords[0] < 0.9 &&
      inventoryCoords[1] > -0.9 &&
      inventoryCoords[1] < 0.9
    ) {
      let x = Math.floor((inventoryCoords[0] + 0.9) / this.stride);
      let y = Math.floor((1.8 - (inventoryCoords[1] + 0.9)) / this.stride);
      if (x < this.width && y < this.height) {
        return vec2.fromValues(x, y);
      }
    }
    return vec2.fromValues(-1, -1);
  }

  private pickupItem() {
    const coords = this.getCoordsFromMousePosition();

    let selectedItem = -1;
    if (coords[0] >= 0 && coords[1] >= 0) {
      selectedItem = this.grid[coords[0]][coords[1]].itemNr;
    }

    if (selectedItem != -1) {
      for (let tx = 0; tx < this.width; tx++) {
        for (let ty = 0; ty < this.height; ty++) {
          if (this.grid[tx][ty].itemNr == selectedItem) {
            this.grid[tx][ty].gb.diffuse =
              this.inventoryRenderer.textureStore.getTexture(
                "CSS:" + emptyTileColour
              );
            this.grid[tx][ty].itemNr = -1;
          }
        }
      }
      this.holdingItemId = selectedItem;
    }
  }

  private placeItemAndPickUpBlockingItem(coords: vec2): boolean {
    const itemsInTheWay = this.getItemsInTheWay(
      this.items[this.holdingItemId],
      coords[0],
      coords[1]
    );
    if (itemsInTheWay.has(-1)) {
      return false;
    }
    if (itemsInTheWay.size != 1) {
      return false;
    }

    let tempHoldingItem: number = itemsInTheWay.keys().next().value; // Store the upcoming holding item

    // Remove it from the grid
    for (let tx = 0; tx < this.width; tx++) {
      for (let ty = 0; ty < this.height; ty++) {
        if (this.grid[tx][ty].itemNr == tempHoldingItem) {
          this.grid[tx][ty].gb.diffuse =
            this.inventoryRenderer.textureStore.getTexture(
              "CSS:" + emptyTileColour
            );
          this.grid[tx][ty].itemNr = -1;
        }
      }
    }

    // Place the previouse holding item
    if (
      !this.tryPlaceItem(
        this.items[this.holdingItemId],
        coords[0],
        coords[1],
        this.holdingItemId
      )
    ) {
      // This should never fail
    }

    // Finally set the new holding item
    this.holdingItemId = tempHoldingItem;
  }

  private storeItem(item: Item): boolean {
    if (
      this.grid.length < this.width ||
      this.grid[this.width - 1].length < this.height
    ) {
      return false;
    }

    // Logic for placing the item in the inventory if there is space
    // Go through all places in the grid and all rotations of the item to find a fitting spots (TODO: There's probably better ways to do this but I don't think this will be a problem)
    for (let rot = 0; rot < 360; rot += 90) {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (this.tryPlaceItem(item, x, y)) {
            return true;
          }
        }
      }
      item.rotate();
    }
    return false;
  }

  async addItem(itemSpec: ItemSpec): Promise<Item> {
    return new Promise<Item>((resolve, reject) => {
      this.inventoryScene
        .addNewMesh(
          "Assets/objs/cube.obj",
          "CSS:rgba(0, 0, 0, 0.0)",
          "CSS:rgb(0,0,0)"
        )
        .then((gb) => {
          let item = new Item(itemSpec, gb);
          item.setupGraphicsBundle(this.stride);
          gb.diffuse = this.inventoryRenderer.textureStore.getTexture(
            item.spec.texturePath
          );
          if (!this.storeItem(item)) {
            this.inventoryScene.deleteGraphicsBundle(item.graphicsBundle);
            reject("Could not pickup item. Not enough space in inventory");
          }
          resolve(item);
        });
    });
  }

  update(dt: number) {
    if (
      !(
        this.grid.length == this.width &&
        this.grid[this.width - 1].length == this.height
      )
    ) {
      return;
    }

    if (Input.keys[" "]) {
      if (!this.spaceWasPressed) {
        const random = Math.round(Math.random() * (ItemList.length - 1));

        this.addItem(ItemList[random])
          .then((item) => {})
          .catch((reason) => {
            console.log(reason);
          });
      }
      this.spaceWasPressed = true;
    } else {
      this.spaceWasPressed = false;
    }

    const coords = this.getCoordsFromMousePosition();
    const inventoryCoords = this.getInventoryCoords();

    let showToolTip = false;

    if (Input.mouseClicked) {
      if (!this.mouseLeftWasPressed) {
        if (this.holdingItemId < 0) {
          this.pickupItem();
        } else {
          if (
            this.tryPlaceItem(
              this.items[this.holdingItemId],
              coords[0],
              coords[1],
              this.holdingItemId
            )
          ) {
            this.holdingItemId = -1;
          }
          // Couldn't place the item directly. Check if it's only colliding with one other item. If so - place the currently held item and pick up the new one.
          else if (this.placeItemAndPickUpBlockingItem(coords)) {
          } else if (coords[0] == -1 && coords[1] == -1) {
            // Clicked outside of inventory, throw the item away
            this.droppedItems.push(this.items[this.holdingItemId].spec);
            this.inventoryScene.deleteGraphicsBundle(
              this.items[this.holdingItemId].graphicsBundle
            );
            this.items[this.holdingItemId] = null;
            this.holdingItemId = -1;
          }
        }
      }

      this.mouseLeftWasPressed = true;
    } else {
      this.mouseLeftWasPressed = false;
    }

    if (Input.mouseRightClicked) {
      if (!this.mouseRightWasPressed && this.holdingItemId >= 0) {
        this.items[this.holdingItemId].rotate();
      }
      this.mouseRightWasPressed = true;
    } else {
      this.mouseRightWasPressed = false;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.grid[x][y].itemNr < 0) {
          this.grid[x][y].gb.diffuse =
            this.inventoryRenderer.textureStore.getTexture(
              "CSS:" + emptyTileColour
            );
        }
      }
    }

    if (this.holdingItemId >= 0) {
      const item = this.items[this.holdingItemId];
      if (
        this.testItemPlacement(
          this.items[this.holdingItemId],
          coords[0],
          coords[1]
        )
      ) {
        for (let position of item.spec.positions) {
          this.grid[coords[0] + position[0]][
            coords[1] + position[1]
          ].gb.diffuse = this.inventoryRenderer.textureStore.getTexture(
            "CSS:rgb(255,255,255)"
          );
        }
      }
      vec3.set(
        item.graphicsBundle.transform.position,
        inventoryCoords[0],
        inventoryCoords[1],
        0.5
      );
      item.graphicsBundle.layer = 2;
    } else {
      if (
        coords[0] >= 0 &&
        coords[0] < this.width &&
        coords[1] >= 0 &&
        coords[1] < this.height
      ) {
        let itemIndex = this.grid[coords[0]][coords[1]].itemNr;
        if (itemIndex > -1) {
          this.toolTip.getElement().innerHTML =
            this.items[itemIndex].spec.name +
            "\n\n" +
            this.items[itemIndex].spec.description +
            "\n\n" +
            'Rarity: <span style="border-radius: 0.25em; padding: 0.25em; color: black; background-color: ' +
            rarityColourMap.get(this.items[itemIndex].spec.rarity) +
            '">' +
            Rarity[this.items[itemIndex].spec.rarity] +
            "</span>";
          showToolTip = true;
        }
      }
    }

    if (showToolTip) {
      let rect = this.inventoryDiv.getElement().getClientRects()[0];
      this.toolTip.position[0] = (Input.mousePosition.x + 25) / rect.width;
      this.toolTip.position[1] = (Input.mousePosition.y - 25) / rect.height;
      this.toolTip.setHidden(false);
    } else {
      this.toolTip.setHidden(true);
    }
  }

  preRenderingUpdate(dt: number) {}

  draw(dt: number) {
    this.inventoryRenderer.render(this.inventoryScene, this.inventoryCamera);
  }
}
