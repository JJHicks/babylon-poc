import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, UniversalCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, SceneLoader } from "@babylonjs/core";
import { Environment } from "./environment";

class App {

    private _scene: Scene;
    private _camera: UniversalCamera;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _environment: Environment;

    constructor() {
        // create the canvas html element and attach it to the webpage
        var container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "mainCanvas";
        container.appendChild(this._canvas);

        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        //var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
        //camera.attachControl(canvas, true);

        this._camera = new UniversalCamera("Camera", new Vector3(400, 700, 800), this._scene);
        this._camera.setTarget(Vector3.Zero());
        var inputManager = this._camera.inputs;
        //inputManager.add()
        this._camera.attachControl(this._canvas)

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);
        //var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        
        this._environment = new Environment(this._scene);
        this._environment.load();

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            // if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
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

        window.addEventListener('resize', () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });
    }
}

new App();