import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, Ray, RayHelper, UniversalCamera, Vector3, HemisphericLight, AbstractMesh, Matrix,
    Mesh, MeshBuilder, SceneLoader, PointerEventTypes, StandardMaterial, Color3, DeepImmutableObject } from "@babylonjs/core";
import { Environment } from "./environment";
import { UniversalCameraInput } from "./universalCameraInput";
import * as GUI from 'babylonjs-gui';
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";

class App {

    private _scene: Scene;
    private _camera: UniversalCamera;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _environment: Environment;
    private _cameraRay: Ray;

    private _infoDisplayTexture: AdvancedDynamicTexture;
    private _infoDisplayText: string;

    constructor() {
        this._infoDisplayText = "";

        // Create the canvas html element and attach it to the webpage
        var container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.id = "renderCanvas";
        container.appendChild(this._canvas);

        // Initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        this._initCamera();
        
        // Load environment
        this._environment = new Environment(this._scene);
        this._environment.load();

        // hide/show the Inspector, Ctrl + i
        window.addEventListener("keydown", (ev) => {
            if (ev.ctrlKey && ev.keyCode === 73) {
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

        document.getElementById("sensorsInFront").addEventListener("change", e => {
            this._environment.setAllSensorsVisible((e.target as HTMLInputElement).checked)
        })

        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });

        this._scene.onPointerDown = (evt, pickResult) => {
            var results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            //aaaaconsole.log(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

            var firstSensor = results.find(info => info.pickedMesh.name.includes("sensor_"));

            if(firstSensor){
                console.log("SENSOR HIT: " + firstSensor.pickedMesh.name);
                this._infoDisplayText = firstSensor.pickedMesh.name;
            }
        }

        this._infoDisplayTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        var textblock = new GUI.TextBlock();
        textblock.text = this._infoDisplayText;
        textblock.fontSize = 24;
        textblock.top = -100;
        textblock.color = "white";
        this._infoDisplayTexture.addControl(textblock);

    }

    private _initCamera(){
        this._camera = new UniversalCamera("Camera", new Vector3(400, 700, 800), this._scene);
        this._camera.setTarget(Vector3.Zero());
        this._camera.keysLeft = [65, 37]; // A, Left
        this._camera.keysRight = [68, 39]; // D, Right
        this._camera.keysUp = [87, 38]; // W, Up
        this._camera.keysDown = [83 ,40]; // S, Down
        this._camera.keysDownward = [81]; // Q
        this._camera.keysUpward = [69]; // E
        this._camera.speed = 10;
        this._camera.attachControl(this._canvas)
    }
}

new App();