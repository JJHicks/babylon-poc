"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const BABYLON = __importStar(require("babylonjs"));
const environment_1 = require("./environment");
const GUI = __importStar(require("babylonjs-gui"));
const sensors_json_1 = __importDefault(require("./data/sensors.json"));
const ValuesToHeatmap_1 = __importDefault(require("./helpers/ValuesToHeatmap"));
const luxon_1 = require("luxon");
class App {
    _scene;
    _universalCamera;
    //private _fpCamera: BABYLON.
    _canvas;
    _engine;
    _environment;
    _infoDisplayTexture;
    _infoDisplayTextBlock;
    constructor() {
        window.store = window.store || {};
        window.store.sensors = sensors_json_1.default;
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
        this._environment = new environment_1.Environment(this._scene);
        this._environment.load();
        // hide/show the Inspector, i
        window.addEventListener("keydown", (ev) => {
            if (ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                }
                else {
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
    _addEvents() {
        document.getElementById("sensorsInFront").addEventListener("change", e => {
            this._environment.setAllSensorsVisible(e.target.checked);
        });
        document.getElementById("date").addEventListener("change", e => this._generateFalseSensorData());
        // document.getElementById("showHeatmap").addEventListener("change", e => {
        //     api.getSensorData().then(res => console.log(res));
        // });
        document.getElementById("changeHeatmap").addEventListener("click", e => this._updateHeatmap());
        document.getElementById("timeSelect").addEventListener("input", e => {
            const val = document.getElementById("timeSelect").value;
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
            if (firstSensorHitByRay) {
                const sensor = window.store.sensors.find((s) => s.name === firstSensorHitByRay.pickedMesh.name);
                console.log("SENSOR HIT: " + firstSensorHitByRay.pickedMesh.name);
                this._infoDisplayTextBlock.text = `${firstSensorHitByRay.pickedMesh.name} - ${sensor.id}`;
            }
        };
    }
    _generateFalseSensorData() {
        const hours = Array.from(Array(24).keys()).map((el) => el.toString().padStart(2, "0"));
        const minutes = ["00", "30"];
        const date = document.getElementById("date").value;
        window.store.timesShown = [];
        hours.forEach((hour) => {
            minutes.forEach((minute) => {
                console.log(`${date}T${hour}:${minute}`);
                window.store.timesShown.push(luxon_1.DateTime.fromISO(`${date}T${hour}:${minute}`));
            });
        });
        const slider = document.getElementById("timeSelect");
        slider.max = slider.value = window.store.timesShown.length;
        document.getElementById("timeDisplay").innerText = window.store.timesShown[parseInt(slider.max) - 1];
        window.store.sensors.forEach((sensor) => {
        });
    }
    _updateHeatmap() {
        var textureData = [];
        for (let i = 0; i < 100; i++) {
            try {
                textureData.push(...ValuesToHeatmap_1.default(0, 100, Math.random() * 100));
            }
            catch (e) {
                console.error(e);
            }
        }
        this._environment.deckMesh.material.dispose();
        var texture = new BABYLON.RawTexture(new Uint8Array(textureData), 4, 2, BABYLON.Engine.TEXTUREFORMAT_RGB, this._scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        var heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
        heatmapMaterial.diffuseTexture = texture;
        heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        //var animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        this._environment.deckMesh.material = heatmapMaterial;
    }
    _adjustDeckHeatmapAlpha() {
        const show = document.getElementById("showHeatmap").checked ? 1 : 0;
        const alphaValue = parseFloat(document.getElementById("heatmapOpacity").value);
        this._environment.deckMesh.material.alpha = Math.min(show, alphaValue);
    }
    _initCamera() {
        this._universalCamera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 800, -1500), this._scene);
        this._universalCamera.setTarget(BABYLON.Vector3.Zero());
        this._universalCamera.keysLeft = [65, 37]; // A, Left
        this._universalCamera.keysRight = [68, 39]; // D, Right
        this._universalCamera.keysUp = [87, 38]; // W, Up
        this._universalCamera.keysDown = [83, 40]; // S, Down
        this._universalCamera.keysDownward = [81]; // Q
        this._universalCamera.keysUpward = [69]; // E
        this._universalCamera.speed = 10;
        this._universalCamera.attachControl(this._canvas);
    }
    _initInfoDisplay() {
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
//# sourceMappingURL=app.js.map