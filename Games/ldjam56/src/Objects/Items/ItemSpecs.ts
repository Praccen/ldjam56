import { vec2 } from "praccen-web-engine";

export enum Rarity {
    Common, 
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Set
}

export const rarityColourMap = new Map<Rarity, string>(
    [
        [Rarity.Common, "rgb(150, 150, 150)"],
        [Rarity.Uncommon, "rgb(150, 150, 50)"],
        [Rarity.Rare, "rgb(10, 120, 255)"],
        [Rarity.Epic, "rgb(255, 10, 255)"],
        [Rarity.Legendary, "rgb(255, 150, 0)"],
        [Rarity.Set, "rgb(0, 255, 0)"],
    ]
);

export interface ItemSpec {
    name: string;
    description: string;
    texturePath: string;
    positions: vec2[];
    rarity: Rarity; 
}

export const ItemList: Array<ItemSpec> = [
    {
        name: "Ring", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Ring.png",
        positions: [vec2.fromValues(0, 0)],
        rarity: Rarity.Common
    },
    {   
        name: "Dagger", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Dagger.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(0, 1)],
        rarity: Rarity.Uncommon
    },
    {
        name: "Boot", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Boot.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(0, 1), vec2.fromValues(1, 1)],
        rarity: Rarity.Rare
    },
    {
        name: "Shield", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Shield.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(0, 1), vec2.fromValues(1, 0), vec2.fromValues(1, 1)],
        rarity: Rarity.Epic
    },
    {
        name: "Wand", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Wand.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(1, 1)],
        rarity: Rarity.Legendary
    },
    {
        name: "Ring of fire", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Ring.png", 
        positions: [vec2.fromValues(0, 0)],
        rarity: Rarity.Set
    },
    {
        name: "Sword", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Sword.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(1, 0), vec2.fromValues(2, 0), vec2.fromValues(3, 0)],
        rarity: Rarity.Common
    },
    {
        name: "Sword of a thousand furies", 
        description: "This is a description of the item.\nIt should show up in the tool tip and explain how the item works.",
        texturePath: "Assets/Textures/Items/Sword.png", 
        positions: [vec2.fromValues(0, 0), vec2.fromValues(1, 0), vec2.fromValues(2, 0), vec2.fromValues(3, 0)],
        rarity: Rarity.Legendary
    }
];