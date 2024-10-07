import {
  AnimatedGraphicsBundle,
  Button,
  Camera,
  Checkbox,
  Div,
  GUIRenderer,
  quat,
  Renderer3D,
  Scene,
  Slider,
} from "praccen-web-engine";
import { GetCookie, SetCookie } from "../Utils/WebUtils.js";
import {Howler} from "howler";
import { vec3 } from "gl-matrix";
import { Factories } from "../Utils/Factories.js";

export default class Menu {
  private guiRenderer: GUIRenderer;
  private menuRendererDiv: Div;
  private menuDiv: Div;
  private optionsDiv: Div;
  private menuRenderer: Renderer3D;
  private menuScene: Scene;
  private menuCamera: Camera;

  private mouse: AnimatedGraphicsBundle;

  enabled: boolean;

  constructor(guiRenderer: GUIRenderer, gameRenderer: Renderer3D) {
    this.guiRenderer = guiRenderer;
    let self = this;

    this.menuRendererDiv = guiRenderer.getNewDiv();
    this.menuRendererDiv.getElement().style.top = "0%";
    this.menuRendererDiv.getElement().style.height = "100%";
    this.menuRendererDiv.getElement().style.left = "0%";
    this.menuRendererDiv.getElement().style.width = "100%";
    this.menuRendererDiv.ignoreEngineModifiers = true;

    this.menuRendererDiv.getElement().style.position = "absolute";
    this.menuRendererDiv.getElement().style.zIndex = "0";
    this.menuRendererDiv.getElement().style.overflow = "hidden";


    this.menuDiv = guiRenderer.getNewDiv(this.menuRendererDiv);
    this.menuDiv.ignoreEngineModifiers = true;
    this.menuDiv.getElement().style.backgroundColor = "#00000050";
    this.menuDiv.getElement().style.top = "0%";
    this.menuDiv.getElement().style.height = "100%";
    this.menuDiv.getElement().style.left = "0%";
    this.menuDiv.getElement().style.width = "100%";

    this.menuDiv.getElement().style.position = "absolute";
    this.menuDiv.getElement().style.zIndex = "4";
    this.menuDiv.getElement().style.overflowX = "hidden";
    this.menuDiv.getElement().style.overflowY = "auto";
    this.menuDiv.setHidden(false);
    
    this.optionsDiv = guiRenderer.getNewDiv(this.menuRendererDiv);
    this.optionsDiv.ignoreEngineModifiers = true;
    this.optionsDiv.getElement().style.backgroundColor = "#00000050";
    this.optionsDiv.getElement().style.top = "0%";
    this.optionsDiv.getElement().style.height = "100%";
    this.optionsDiv.getElement().style.left = "0%";
    this.optionsDiv.getElement().style.width = "100%";

    this.optionsDiv.getElement().style.position = "absolute";
    this.optionsDiv.getElement().style.zIndex = "4";
    this.optionsDiv.getElement().style.overflowX = "hidden";
    this.optionsDiv.getElement().style.overflowY = "auto";
    this.optionsDiv.setHidden(true);

    // Renderer
    this.menuRenderer = new Renderer3D();
    this.menuRendererDiv.getElement().appendChild(this.menuRenderer.domElement);

    this.menuRenderer.useVolumetric = true;
    this.menuRenderer.setFogTexture("CSS:rgb(255, 255, 255)");
    this.menuRenderer.setFogDensity(0.05);

    // Scene
    this.menuScene = new Scene(this.menuRenderer);
    this.menuScene.getDirectionalLight().ambientMultiplier = 0.0;
    vec3.set(this.menuScene.getDirectionalLight().colour, 0.3216, 3.0, 0.5922);
    vec3.set(this.menuScene.getDirectionalLight().direction, 0.001, 1.0, 0.0);

    this.menuScene.directionalLight.shadowCameraDistance = 100;
    this.menuScene.directionalLight.lightProjectionBoxSideLength = 100;
    vec3.zero(this.menuScene.directionalLight.shadowFocusPos);

    // Create a camera and set it's starting position
    this.menuCamera = new Camera();
    this.menuCamera.setPosition(vec3.fromValues(0.0, 4.0, 4.0));
    this.menuCamera.setDir(vec3.fromValues(0.0, -1.0, -1.0));

    let pl = this.menuScene.addNewPointLight();
    pl.castShadow = true;
    vec3.set(pl.position, 1.0, 3.0, 2.0);
    pl.setShadowBufferResolution(4096);

    Factories.createMesh(
      this.menuScene, 
      "Assets/objs/dungeonPack/floor_tile_extralarge_grates_open.obj",
      vec3.create(),
      vec3.fromValues(1.0, 1.0, 1.0),
      "Assets/Textures/dungeon_texture.png",
      "CSS:rgb(0, 0, 0)",
    ).then((mesh) => {

    });

    this.mouse = null;
    this.menuScene.addNewAnimatedMesh("Assets/gltf/Mouse/mouse.gltf", "Assets/gltf/Mouse/Feldmaus_Diffuse.png", "Assets/gltf/Mouse/Feldmaus_Gloss.png").then((mesh) => {
      this.mouse = mesh;
      quat.fromEuler(this.mouse.transform.rotation, 0.0, 180, 0.0);
      vec3.set(this.mouse.transform.position, 0.0, 0.2, 0.0);
    });


    // Main menu
    this.createButton(this.menuDiv, "Start game", (ev) => {self.toggle()});
    this.createButton(this.menuDiv, "Options", (ev) => {self.menuDiv.setHidden(true); self.optionsDiv.setHidden(false)});
    this.createButton(this.menuDiv, "Fullscreen", (ev) => {document.getElementById("game").requestFullscreen();})

    // Options menu
    this.createButton(this.optionsDiv, "Back to main menu", (ev) => {self.menuDiv.setHidden(false); self.optionsDiv.setHidden(true)});

    this.createSlider(
      this.optionsDiv, 
      "Sound volume ", 
      0, 
      100, 
      (ev) => {
        let value = (ev.currentTarget as HTMLInputElement).value;
        SetCookie("soundVolume", value);
        Howler.volume(parseFloat(value) * 0.01);
      }, 
      "soundVolume"
    );

    this.createSlider(
      this.optionsDiv, 
      "Volumetric render scale ", 
      20, 
      100, 
      (ev) => {
        let value = (ev.currentTarget as HTMLInputElement).value;
        SetCookie("volumetricRenderScale", value);
        gameRenderer.setFogRenderScale(parseFloat(value) * 0.01);
        self.menuRenderer.setFogRenderScale(parseFloat(value) * 0.01);
      }, 
      "volumetricRenderScale"
    );

    this.createCheckbox(
      this.optionsDiv, 
      "Blur volumetric result ", 
      (ev) => {
        let checked = (ev.currentTarget as HTMLInputElement).checked
        SetCookie("volumetricBlur", checked);
        gameRenderer.setFogBlur(checked);
        self.menuRenderer.setFogBlur(checked);
      },
      "volumetricBlur"
    );

    this.enabled = true;
  }

  private createButton(parentDiv: Div, text: string, onClickFn: (this: HTMLButtonElement, ev: MouseEvent) => any): Button {
    let button = this.guiRenderer.getNewButton(parentDiv);
    button.ignoreEngineModifiers = true;
    button.textString = text;
    button.getElement().style.top = "100px";
    button.getElement().style.position = "relative";
    button.getElement().style.margin = "auto";
    button.getElement().style.display = "block"; 
    button.getElement().style.marginTop = "40px";
    button.getElement().style.whiteSpace = "pre-wrap";
    button.onClick(onClickFn);

    return button;
  }

  private createSlider(parentDiv: Div, text: string, min: number, max: number, onChangeFn: (this: HTMLInputElement, ev: MouseEvent) => any, cookieName: string = ""): Slider {
    let slider = this.guiRenderer.getNewSlider(parentDiv);
    slider.ignoreEngineModifiers = true;
    slider.textString = text;
    slider.getElement().style.top = "100px";
    slider.getElement().style.position = "relative";
    slider.getElement().style.margin = "auto";
    slider.getElement().style.display = "block"; 
    slider.getElement().style.marginTop = "40px";
    slider.getElement().style.whiteSpace = "pre-wrap";
    slider.getInputElement().min = min.toString();
    slider.getInputElement().max = max.toString();
    slider.onChange(onChangeFn);

    if (cookieName != "") {
      const cookieValue = GetCookie(cookieName);
      if (cookieValue != "") {
        slider.getInputElement().value = cookieValue;
      }
    }

    slider.getInputElement().dispatchEvent(new Event("change"));

    return slider;
  }

  private createCheckbox(parentDiv: Div, text: string, onChangeFn: (this: HTMLInputElement, ev: MouseEvent) => any, cookieName: string = ""): Checkbox {
    let checkbox = this.guiRenderer.getNewCheckbox(parentDiv);
    checkbox.ignoreEngineModifiers = true;
    checkbox.textString = text;
    checkbox.getElement().style.top = "100px";
    checkbox.getElement().style.position = "relative";
    checkbox.getElement().style.margin = "auto";
    checkbox.getElement().style.display = "block"; 
    checkbox.getElement().style.marginTop = "40px";
    checkbox.getElement().style.whiteSpace = "pre-wrap";
    checkbox.onChange(onChangeFn);

    if (cookieName != "") {
      const cookieValue = GetCookie(cookieName);
      if (cookieValue != "") {
        checkbox.getInputElement().checked = cookieValue == "true";
      }
    }

    checkbox.getInputElement().dispatchEvent(new Event("change"));

    return checkbox;
  }

  toggle() {
    this.menuRendererDiv.toggleHidden();
    this.enabled = !this.menuRendererDiv.getHidden();
  }

  resize(width: number, height: number) {
    this.menuRenderer.setSize(width, height, true);
  }

  update(dt: number) {

  }

  preRenderingUpdate(dt: number) {
    if (this.mouse != undefined) {
      this.mouse.animate(1, dt);
    }
  }

  draw() {
    this.menuRenderer.render(this.menuScene, this.menuCamera);
  }
}
