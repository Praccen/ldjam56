import {
  Button,
  Checkbox,
  Div,
  GUIRenderer,
  Renderer3D,
  Slider,
} from "praccen-web-engine";
import { GetCookie, SetCookie } from "../Utils/WebUtils.js";
import {Howler} from "howler";

export default class Menu {
  private guiRenderer: GUIRenderer;
  private menuDiv: Div;
  private optionsDiv: Div;
  // private menuRenderer: Renderer3D;
  // private menuScene: Scene;
  // private menuCamera: Camera;

  enabled: boolean;

  constructor(guiRenderer: GUIRenderer, gameRenderer: Renderer3D) {
    this.guiRenderer = guiRenderer;
    let self = this;

    this.menuDiv = guiRenderer.getNewDiv();
    this.menuDiv.ignoreEngineModifiers = true;
    this.menuDiv.getElement().style.backgroundColor = "#101010";
    this.menuDiv.getElement().style.top = "0%";
    this.menuDiv.getElement().style.height = "100%";
    this.menuDiv.getElement().style.left = "0%";
    this.menuDiv.getElement().style.width = "100%";

    this.menuDiv.getElement().style.position = "absolute";
    this.menuDiv.getElement().style.zIndex = "4";
    this.menuDiv.getElement().style.overflow = "hidden";
    this.menuDiv.setHidden(false);
    
    this.optionsDiv = guiRenderer.getNewDiv();
    this.optionsDiv.ignoreEngineModifiers = true;
    this.optionsDiv.getElement().style.backgroundColor = "#101010";
    this.optionsDiv.getElement().style.top = "0%";
    this.optionsDiv.getElement().style.height = "100%";
    this.optionsDiv.getElement().style.left = "0%";
    this.optionsDiv.getElement().style.width = "100%";

    this.optionsDiv.getElement().style.position = "absolute";
    this.optionsDiv.getElement().style.zIndex = "4";
    this.optionsDiv.getElement().style.overflow = "hidden";
    this.optionsDiv.setHidden(true);


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
        gameRenderer.setFogRenderScale(parseFloat(value) * 0.01)
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
    this.menuDiv.toggleHidden();
    this.enabled = !this.menuDiv.getHidden();
  }

  update(dt: number) {
  }

  preRenderingUpdate(dt: number) {

  }

  draw() {

  }
}
