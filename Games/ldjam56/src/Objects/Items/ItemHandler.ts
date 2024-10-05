import { GUIRenderer, ReadonlyVec3, TextObject3D, vec3 } from "praccen-web-engine";
import { ItemSpec, rarityColourMap } from "./ItemSpecs.js";
import GUI from "../../GUI/GUI.js";
import Inventory from "../../GUI/Inventory.js";
import { Input } from "../../Input.js";

const itemLabelRenderDistance = 20.0;

export default class ItemHandler {
    private guiRenderer: GUIRenderer;
    private gui: GUI;
    private inventory: Inventory;

    private itemsOnGround: Array<{itemSpec: ItemSpec, pos: vec3, label: TextObject3D, pickedUp: boolean}>;
    private labelsVisible: boolean;

    private shiftWasPressed: boolean;
    
    constructor(guiRenderer: GUIRenderer, gui: GUI, inventory: Inventory) {
        this.guiRenderer = guiRenderer;
        this.gui = gui;
        this.inventory = inventory;
        this.itemsOnGround = new Array<{itemSpec: ItemSpec, pos: vec3, label: TextObject3D, pickedUp: boolean}>();
        this.labelsVisible = true;

        this.shiftWasPressed = false;
    }

    dropItem(itemSpec: ItemSpec, position: ReadonlyVec3) {
        let length = this.itemsOnGround.push({itemSpec: itemSpec, pos: vec3.clone(position), label: null, pickedUp: false});

        if (this.labelsVisible) {
            this.addItemLabel(length - 1);
        }
    }
    

    addItemLabel(itemId: number) {
        if (this.itemsOnGround.length <= itemId) {
            return;
        }

        let itemOnGround = this.itemsOnGround[itemId];
        if (itemOnGround.label != undefined) {
            itemOnGround.label.setHidden(false);
            return;
        }

        itemOnGround.label = this.guiRenderer.getNew3DText(this.gui.gameGuiDiv);
        let itemText = itemOnGround.label;
        itemText.textString = itemOnGround.itemSpec.name;
        itemText.scaleFontWithDistance = true;
        itemText.scaleWithWindow = true;
        itemText.position = itemOnGround.pos;
        itemText.setHidden(false);
        itemText.size = 500;
        itemText.getElement().className = "itemLabel";
        itemText.getElement().style.color = rarityColourMap.get(itemOnGround.itemSpec.rarity);
        itemText.getElement().style.zIndex = "3";
        let self = this;
        itemText.getElement().addEventListener("click", function() {
            if (self.inventory.enabled) {
                return;
            }
            self.inventory.addItem(itemOnGround.itemSpec).then((item) => {
                itemText.remove();
                itemOnGround.label = null;
                itemOnGround.pickedUp = true;
            })
            .catch(() => {

            });
        });
    }

    removeAllItemLabels() {
        for (let i = 0; i < this.itemsOnGround.length; i++) {
            let item = this.itemsOnGround[i];

            if (item.label != undefined) {
                item.label.remove();
                item.label = null;
            }
        }
        this.labelsVisible = false;
    }

    toggleItemLabels() {
        if (this.labelsVisible) {
            this.removeAllItemLabels();
        }
        else {
            this.labelsVisible = true;
        }
    }

    preRenderingUpdate(dt: number, playerPos: ReadonlyVec3) {
        // Clean up picked up items
        for (let i = 0; i < this.itemsOnGround.length; i++) {
            let item = this.itemsOnGround[i];
            if (item.pickedUp) {
                if (item.label != undefined) {
                    item.label.remove();
                    item.label = null;   
                }
                this.itemsOnGround.splice(i, 1);
                i--;
                continue;
            }
        }

        if (this.labelsVisible) {
            for (let i = 0; i < this.itemsOnGround.length; i++) {
                let item = this.itemsOnGround[i];
                const distance = vec3.dist(item.pos, playerPos);
                if (distance > itemLabelRenderDistance && item.label != undefined) {
                    item.label.remove();
                    item.label = null;
                }
                else if (distance < itemLabelRenderDistance && !item.pickedUp && item.label == undefined) {
                    this.addItemLabel(i)
                }
            }
        }


        if (Input.keys["SHIFT"]) {
            if (!this.shiftWasPressed) {
                this.toggleItemLabels();
            }
            this.shiftWasPressed = true;
        }
        else {
            this.shiftWasPressed = false;
        }
    }
}

