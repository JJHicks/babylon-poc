import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "babylonjs";
import { Environment } from "./environment";
import * as GUI from "babylonjs-gui";
import { api } from "./api/api";
import sensors from "./data/sensors.json";
import { SensorInfo } from "./interfaces/sensorInfo";
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { DateTime } from "luxon";
import { HtmlElementTexture } from "babylonjs/Materials/Textures/htmlElementTexture";

class App {

    private _scene: BABYLON.Scene;
    private _universalCamera: BABYLON.UniversalCamera;
    //private _fpCamera: BABYLON.
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _environment: Environment;

    private _infoDisplayTexture: GUI.AdvancedDynamicTexture;
    private _infoDisplayTextBlock: GUI.TextBlock;

    constructor() {

        window.store = window.store || {};
        window.store.sensors = sensors;

        // Create the canvas html element and attach it to the webpage
        var container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.id = "renderCanvas";
        container.appendChild(this._canvas);

        // Initialize babylon scene and engine
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);

        this._initCamera();
        
        // Load environment
        this._environment = new Environment(this._scene);
        this._environment.load();

        // hide/show the Inspector, i
        window.addEventListener("keydown", (ev) => {
            if (ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // Remove later
        this._generateFalseSensorData();

        this._addEvents();
        this._initInfoDisplay();
    }

    private _addEvents(){

        document.getElementById("sensorsInFront").addEventListener("change", e => {
            this._environment.setAllSensorsVisible((e.target as HTMLInputElement).checked)
        });

        document.getElementById("date").addEventListener("change", e => this._generateFalseSensorData());

        // document.getElementById("showHeatmap").addEventListener("change", e => {
        //     api.getSensorData().then(res => console.log(res));
        // });

        document.getElementById("changeHeatmap").addEventListener("click", e => this._updateHeatmap());

        document.getElementById("timeSelect").addEventListener("input", e => {
            const val = (document.getElementById("timeSelect") as HTMLInputElement).value;
            document.getElementById("timeDisplay").innerText = window.store.timesShown[val];
        });

        document.getElementById("showHeatmap").addEventListener("change", e => this._adjustDeckHeatmapAlpha());
        document.getElementById("heatmapOpacity").addEventListener("input", e => this._adjustDeckHeatmapAlpha());

        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });

        this._scene.onPointerDown = (evt, pickResult) => {
            var results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            //console.log(pickResult);
            //console.log(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

            var firstSensorHitByRay = results.find(info => info.pickedMesh.name.includes("sensor_"));

            if(firstSensorHitByRay){
                const sensor = window.store.sensors.find((s: SensorInfo) => s.name === firstSensorHitByRay.pickedMesh.name);
                console.log("SENSOR HIT: " + firstSensorHitByRay.pickedMesh.name);
                this._infoDisplayTextBlock.text = `${firstSensorHitByRay.pickedMesh.name} - ${sensor.id}`;
            }
        }
    }

    private _generateFalseSensorData(){
        const hours = Array.from(Array(24).keys()).map((el: any) => el.toString().padStart(2, "0"));
        const minutes = ["00", "30"];
        const date = (document.getElementById("date") as HTMLInputElement).value;

        window.store.timesShown = [];

        hours.forEach((hour: string) => {
            minutes.forEach((minute: string) => {
                console.log(`${date}T${hour}:${minute}`);
                window.store.timesShown.push(DateTime.fromISO(`${date}T${hour}:${minute}`))
            });
        });

        const slider = document.getElementById("timeSelect") as HTMLInputElement;
        slider.max = slider.value = window.store.timesShown.length;
        document.getElementById("timeDisplay").innerText = window.store.timesShown[parseInt(slider.max) - 1];

        window.store.sensors.forEach((sensor: SensorInfo) => {
            
        });
    }

    private _updateHeatmap(){

        var textureData: any[] = [];

        for(let i = 0; i < 100; i++){
            try{
                textureData.push(...convertValuesToHeatmap(0, 100, Math.random() * 100));
            } catch (e) {
                console.error(e);
            }
        }

        this._environment.deckMesh.material.dispose();

        var texture = new BABYLON.RawTexture(
            new Uint8Array(textureData),
            4,
            2,
            BABYLON.Engine.TEXTUREFORMAT_RGB,
            this._scene,
            false,
            false,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );

        var heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
        heatmapMaterial.diffuseTexture = texture;
        heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        //var animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);


        this._environment.deckMesh.material = heatmapMaterial;
    }

    private _adjustDeckHeatmapAlpha(){
        const show = (document.getElementById("showHeatmap") as HTMLInputElement).checked ? 1 : 0;
        const alphaValue = parseFloat((document.getElementById("heatmapOpacity") as HTMLInputElement).value);
        this._environment.deckMesh.material.alpha = Math.min(show, alphaValue);
    }

    private _initCamera(){
        this._universalCamera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 800, -1500), this._scene);
        this._universalCamera.setTarget(BABYLON.Vector3.Zero());
        this._universalCamera.keysLeft = [65, 37]; // A, Left
        this._universalCamera.keysRight = [68, 39]; // D, Right
        this._universalCamera.keysUp = [87, 38]; // W, Up
        this._universalCamera.keysDown = [83 ,40]; // S, Down
        this._universalCamera.keysDownward = [81]; // Q
        this._universalCamera.keysUpward = [69]; // E
        this._universalCamera.speed = 10;
        this._universalCamera.attachControl(this._canvas)
    }

    private _initInfoDisplay(){
        this._infoDisplayTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._infoDisplayTextBlock = new GUI.TextBlock();
        this._infoDisplayTextBlock.fontSize = 24;
        this._infoDisplayTextBlock.paddingTop = "20px";
        this._infoDisplayTextBlock.paddingRight = "20px";
        this._infoDisplayTextBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._infoDisplayTextBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._infoDisplayTextBlock.color = "white";
        this._infoDisplayTexture.addControl(this._infoDisplayTextBlock);
    }
}

new App();