"use strict";
// import * as BABYLON from 'babylonjs';
Object.defineProperty(exports, "__esModule", { value: true });
// const scene = new BABYLON.Scene(Engine);
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const core_1 = require("@babylonjs/core");
class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "mainCsanvas";
        document.body.appendChild(canvas);
        // initialize babylon scene and engine
        var engine = new core_1.Engine(canvas, true);
        var scene = new core_1.Scene(engine);
        var camera = new core_1.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, core_1.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        var light1 = new core_1.HemisphericLight("light1", new core_1.Vector3(1, 1, 0), scene);
        var sphere = core_1.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                }
                else {
                    scene.debugLayer.show();
                }
            }
        });
        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
//# sourceMappingURL=app.js.map