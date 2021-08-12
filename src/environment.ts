import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { AbstractMesh, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, SceneLoader, Color3, StandardMaterial } from "@babylonjs/core";
import sensors from "./data/sensors.json";

export class Environment{

    private _scene: Scene;
    private _bridgeMeshes: AbstractMesh[];
    public sensors: Mesh[];

    constructor(scene: Scene) {
        this.sensors = [];
        this._scene = scene;       
    }

    public async load() {
       
        await this._loadAssets();

        //Loop through all environment meshes that were imported
        this._bridgeMeshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.renderingGroupId = 2;
            // if (m.name == "ground") { //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
            //     m.checkCollisions = false;
            //     m.isPickable = false;
            // }
        });

       //this._scene.clearColor = new Color4(.617, .105, .195);
    }

    public setAllSensorsVisible(visible: boolean){
        const group = visible ? 1 : 2;
        this._bridgeMeshes.forEach(m => {
            m.renderingGroupId = group;
        });
    }

    //Load all necessary meshes for the environment
    public async _loadAssets() {
        const bridge = await SceneLoader.ImportMeshAsync(null, "../models/bridge/", "scene.gltf", this._scene);
        var bridgeMaterial = new StandardMaterial("bridge", this._scene);
        bridgeMaterial.diffuseColor = new Color3(1, 0, 0);

        this._bridgeMeshes = bridge.meshes;

        var bridgeMesh = bridge.meshes[0] as Mesh;
        bridgeMesh.renderingGroupId = 1;
        bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
        bridgeMesh.material = bridgeMaterial;

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);

        var sensorMaterial = new StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new Color3(0, 0, 1);

        sensors.forEach(sensor => {
            var sensorMesh: Mesh = MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);

            sensorMesh.position = new Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            this.sensors.push(sensorMesh);
        });
    }
}