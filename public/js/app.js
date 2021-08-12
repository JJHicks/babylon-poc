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
Object.defineProperty(exports, "__esModule", { value: true });
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const core_1 = require("@babylonjs/core");
const environment_1 = require("./environment");
const GUI = __importStar(require("babylonjs-gui"));
class App {
    constructor() {
        this._infoDisplayText = "";
        // Create the canvas html element and attach it to the webpage
        var container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.id = "renderCanvas";
        container.appendChild(this._canvas);
        // Initialize babylon scene and engine
        this._engine = new core_1.Engine(this._canvas, true);
        this._scene = new core_1.Scene(this._engine);
        this._initCamera();
        // Load environment
        this._environment = new environment_1.Environment(this._scene);
        this._environment.load();
        // hide/show the Inspector, Ctrl + i
        window.addEventListener("keydown", (ev) => {
            if (ev.ctrlKey && ev.keyCode === 73) {
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
        document.getElementById("sensorsInFront").addEventListener("change", e => {
            this._environment.setAllSensorsVisible(e.target.checked);
        });
        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });
        this._scene.onPointerDown = (evt, pickResult) => {
            var results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            //aaaaconsole.log(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);
            var firstSensor = results.find(info => info.pickedMesh.name.includes("sensor_"));
            if (firstSensor) {
                console.log("SENSOR HIT: " + firstSensor.pickedMesh.name);
                this._infoDisplayText = firstSensor.pickedMesh.name;
            }
        };
        this._infoDisplayTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        var textblock = new GUI.TextBlock();
        textblock.text = this._infoDisplayText;
        textblock.fontSize = 24;
        textblock.top = -100;
        textblock.color = "white";
        this._infoDisplayTexture.addControl(textblock);
    }
    _initCamera() {
        this._camera = new core_1.UniversalCamera("Camera", new core_1.Vector3(400, 700, 800), this._scene);
        this._camera.setTarget(core_1.Vector3.Zero());
        this._camera.keysLeft = [65, 37]; // A, Left
        this._camera.keysRight = [68, 39]; // D, Right
        this._camera.keysUp = [87, 38]; // W, Up
        this._camera.keysDown = [83, 40]; // S, Down
        this._camera.keysDownward = [81]; // Q
        this._camera.keysUpward = [69]; // E
        this._camera.speed = 10;
        this._camera.attachControl(this._canvas);
    }
}
new App();
//# sourceMappingURL=app.js.map