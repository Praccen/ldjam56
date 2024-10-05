import { GUIRenderer, TextObject2D, TextObject3D, Slider, Checkbox, Button, Div} from "praccen-web-engine";
import { GetCookie } from "../Utils/WebUtils.js";

export default class GUI {
    gameGuiDiv: Div;
    fpsDisplay: TextObject2D;
    cameraFollowCheckbox: Checkbox;
    volumetricLightingCheckbox: Checkbox;
    sensitivitySlider: Slider;
    volumetricRenderScaleSlider: Slider;
    volumetricBlurCheckbox: Checkbox;
    densitySlider: Slider;
    ambientSlider: Slider;
    mapDisplay: TextObject3D;
    characterDisplay: TextObject3D;
    constructor(guiRenderer: GUIRenderer) {
        this.gameGuiDiv = guiRenderer.getNewDiv();
        this.gameGuiDiv.getElement().style.width = "100%";
        this.gameGuiDiv.getElement().style.height = "100%";

        // Add an FPS display
        this.fpsDisplay  = guiRenderer.getNew2DText(this.gameGuiDiv);
        this.fpsDisplay.position[0] = 0.95;
        this.fpsDisplay.getElement().style.color = "lime";
        this.fpsDisplay.textString = "0";
        this.fpsDisplay.getElement().style.zIndex = "1";

        // Add a checkbox for volumetric lighting
        this.cameraFollowCheckbox = guiRenderer.getNewCheckbox(this.gameGuiDiv);
        this.cameraFollowCheckbox.position[0] = 0.05;
        this.cameraFollowCheckbox.position[1] = 0.75;
        this.cameraFollowCheckbox.textString = "Camera Follow ";
        this.cameraFollowCheckbox.getElement().style.zIndex = "2";
        this.cameraFollowCheckbox.getInputElement().checked = true;
        const cameraFollowCookie = GetCookie("cameraFollow");
        if (cameraFollowCookie == "true") {
            this.cameraFollowCheckbox.getInputElement().checked = true;
        }
        if (cameraFollowCookie == "false") {
            this.cameraFollowCheckbox.getInputElement().checked = false;
        }

        // Add a checkbox for volumetric lighting
        this.volumetricLightingCheckbox = guiRenderer.getNewCheckbox(this.gameGuiDiv);
        this.volumetricLightingCheckbox.position[0] = 0.05;
        this.volumetricLightingCheckbox.position[1] = 0.8;
        this.volumetricLightingCheckbox.textString = "Volumetric Lighting ";
        this.volumetricLightingCheckbox.getElement().style.zIndex = "2";
        this.volumetricLightingCheckbox.getInputElement().checked = true;
        const volumetricCookie = GetCookie("volumetric");
        if (volumetricCookie == "true") {
            this.volumetricLightingCheckbox.getInputElement().checked = true;
        }
        if (volumetricCookie == "false") {
            this.volumetricLightingCheckbox.getInputElement().checked = false;
        }

        // Add a slider for volumetric render scale
        this.volumetricRenderScaleSlider = guiRenderer.getNewSlider(this.gameGuiDiv);
        this.volumetricRenderScaleSlider.position[0] = 0.05;
        this.volumetricRenderScaleSlider.position[1] = 0.05;
        this.volumetricRenderScaleSlider.textString = "Volumetric render scale ";
        this.volumetricRenderScaleSlider.getElement().style.zIndex = "2";
        this.volumetricRenderScaleSlider.getInputElement().min = "1";
        this.volumetricRenderScaleSlider.getInputElement().max = "100";
        const volumetricRenderScaleCookie = GetCookie("volumetricRenderScale");
        if (volumetricRenderScaleCookie != "") {
            this.volumetricRenderScaleSlider.getInputElement().value = volumetricRenderScaleCookie;
        }

        // Add a checkbox for volumetric blur
        this.volumetricBlurCheckbox = guiRenderer.getNewCheckbox(this.gameGuiDiv);
        this.volumetricBlurCheckbox.position[0] = 0.05;
        this.volumetricBlurCheckbox.position[1] = 0.1;
        this.volumetricBlurCheckbox.textString = "Volumetric blur";
        this.volumetricBlurCheckbox.getElement().style.zIndex = "2";
        this.volumetricBlurCheckbox.getInputElement().checked = true;
        const volumetricBlurCookie = GetCookie("volumetricBlur");
        if (volumetricBlurCookie == "true") {
            this.volumetricBlurCheckbox.getInputElement().checked = true;
        }
        if (volumetricBlurCookie == "false") {
            this.volumetricBlurCheckbox.getInputElement().checked = false;
        }


        // Add a slider for sensitivity
        this.sensitivitySlider = guiRenderer.getNewSlider(this.gameGuiDiv);
        this.sensitivitySlider.position[0] = 0.05;
        this.sensitivitySlider.position[1] = 0.85;
        this.sensitivitySlider.textString = "Sensitivity ";
        this.sensitivitySlider.getElement().style.zIndex = "2";
        this.sensitivitySlider.getInputElement().min = "1";
        this.sensitivitySlider.getInputElement().max = "100";
        const sensitivityCookie = GetCookie("sensitivity");
        if (sensitivityCookie != "") {
            this.sensitivitySlider.getInputElement().value = sensitivityCookie;
        }

        // Add a slider for fog density
        this.densitySlider = guiRenderer.getNewSlider(this.gameGuiDiv);
        this.densitySlider.position[0] = 0.05;
        this.densitySlider.position[1] = 0.9;
        this.densitySlider.textString = "Fog density ";
        this.densitySlider.getElement().style.zIndex = "2";
        this.densitySlider.getInputElement().min = "0";
        this.densitySlider.getInputElement().max = "120";
        this.densitySlider.getInputElement().value = "100";
        const densityCookie = GetCookie("fogDensity");
        if (densityCookie != "") {
            this.densitySlider.getInputElement().value = densityCookie;
        }

        // Add a slider for ambient multiplier
        this.ambientSlider = guiRenderer.getNewSlider(this.gameGuiDiv);
        this.ambientSlider.position[0] = 0.05;
        this.ambientSlider.position[1] = 0.95;
        this.ambientSlider.textString = "Ambient multiplier ";
        this.ambientSlider.getElement().style.zIndex = "2";
        this.ambientSlider.getInputElement().min = "0";
        this.ambientSlider.getInputElement().max = "100";
        this.ambientSlider.getInputElement().value = "0";
        const ambientCookie = GetCookie("ambientMultiplier");
        if (ambientCookie != "") {
            this.ambientSlider.getInputElement().value = ambientCookie;
        }

        this.mapDisplay = guiRenderer.getNew3DText(this.gameGuiDiv);
        this.mapDisplay.getElement().style.color = "#ffffff30";
        // this.mapDisplay.getElement().style.background = "#00000050";
        this.mapDisplay.getElement().style.whiteSpace = "pre";
        this.mapDisplay.scaleWithWindow = true;
        this.mapDisplay.scaleFontWithDistance = true;
        this.mapDisplay.size = 800;
        this.mapDisplay.getElement().style.zIndex = "1";

        this.characterDisplay = guiRenderer.getNew3DText(this.gameGuiDiv);
        this.characterDisplay.getElement().style.color = "#00FF0040";
        this.characterDisplay.textString = "o"
        this.characterDisplay.scaleWithWindow = true;
        this.characterDisplay.scaleFontWithDistance = true;
        this.characterDisplay.center = true;
        this.characterDisplay.size = 400;
        this.characterDisplay.getElement().style.zIndex = "0";

        // this.fpsDisplay.setHidden(true);
        // this.cameraFollowCheckbox.setHidden(true);
        // this.volumetricBlurCheckbox.setHidden(true);
        // this.volumetricLightingCheckbox.setHidden(true);
        // this.volumetricRenderScaleSlider.setHidden(true);
        // this.sensitivitySlider.setHidden(true);
        // this.densitySlider.setHidden(true);
        // this.ambientSlider.setHidden(true);
    }
}