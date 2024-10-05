import { glMatrix } from "gl-matrix";
import Renderer3D from "./Engine/Rendering/Renderer/Renderer3D";
import Renderer2D from "./Engine/Rendering/Renderer/Renderer2D";
import Scene from "./Engine/Rendering/Renderer/Scene";
import GraphicsBundle from "./Engine/Rendering/Objects/Bundles/GraphicsBundle";
import AnimatedGraphicsBundle from "./Engine/Rendering/Objects/Bundles/AnimatedGraphicsBundle";
import Camera from "./Engine/Rendering/Objects/Camera";
import { GUIRenderer } from "./Engine/Rendering/GUI/GUIRenderer";
import PhysicsScene from "./Engine/Physics/Physics/PhysicsScene";
import PhysicsObject from "./Engine/Physics/Physics/Objects/PhysicsObject";
import Ray from "./Engine/Physics/Physics/Shapes/Ray";
import Transform from "./Engine/Shared/Transform";
import { MousePicking } from "./Engine/Physics/Maths/MousePicking";
import TextObject2D from "./Engine/Rendering/GUI/Objects/Text/TextObject2D";
import TextObject3D from "./Engine/Rendering/GUI/Objects/Text/TextObject3D";
import Slider from "./Engine/Rendering/GUI/Objects/Slider";
import Checkbox from "./Engine/Rendering/GUI/Objects/Checkbox";
import Button from "./Engine/Rendering/GUI/Objects/Button";
import Div from "./Engine/Rendering/GUI/Objects/Div";

// Rendering exports
export { Renderer3D, Renderer2D, GUIRenderer, Scene, Camera, GraphicsBundle, AnimatedGraphicsBundle}
// Physics exports
export { PhysicsScene, PhysicsObject, Ray, MousePicking }
// Math exports
export * from "gl-matrix"
// Shared exports
export { Transform }
// GUI exports
export {TextObject2D, TextObject3D, Slider, Checkbox, Button, Div}

// Global exports
export let applicationStartTime = Date.now();

glMatrix.setMatrixArrayType(Array);