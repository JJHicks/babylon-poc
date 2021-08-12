import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import sensors from "./data/sensors.json";

export class Environment{

    private _scene: BABYLON.Scene;
    private _bridgeMeshes: BABYLON.AbstractMesh[];
    public sensors: BABYLON.Mesh[];

    constructor(scene: BABYLON.Scene) {
        this.sensors = [];
        this._scene = scene;       
    }

    public async load() {
       
        await this._loadAssets();
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

        var waterMaterial = new BABYLON.StandardMaterial("water", this._scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0, .41015, .57813);
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 5000, height: 2000}, this._scene);
        ground.material = waterMaterial;



        BABYLON.SceneLoader.ImportMesh(null, "../models/bridge/", "scene.gltf", this._scene,
            (meshes, particleSytems, skeletons) => {

                var bridgeMaterial = new BABYLON.StandardMaterial("bridge", this._scene);
                bridgeMaterial.diffuseColor = new BABYLON.Color3(0.9, 0, 0.9);

                // Area texture application
                var sensor1 = this.sensors.find(s => s.name === "sensor_1");
                console.log(sensor1);
                var centerX = sensor1.position.x;
                var centerY = sensor1.position.y;
                var radius = 100;

                var dynamicTexture = new BABYLON.DynamicTexture("texture", 512, this._scene, true);
                
                var context = dynamicTexture.getContext();
                context.beginPath();
                // context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                context.arc(-24, 90, 100, 0, 2 * Math.PI, false);
                context.fillStyle = '#00FF00';
                context.fill();
                context.stroke();
                dynamicTexture.update();

                bridgeMaterial.emissiveTexture = dynamicTexture;

                //var i = 0;
                meshes.forEach(m => {
                    m.receiveShadows = true;
                    m.checkCollisions = true;
                    m.renderingGroupId = 2;

                    if(m.id === "SketchUp.019__0")
                    //if(++i < 200)
                        m.material = bridgeMaterial;
                });

                this._bridgeMeshes = meshes;     

                var bridgeMesh = meshes[0] as BABYLON.Mesh;
                bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
                //bridgeMesh.material = bridgeMaterial;

                // Try merging all meshes then apply material?
                // var merged = BABYLON.Mesh.MergeMeshes(meshes as BABYLON.Mesh[], false, true, undefined, false, true);
                // merged.receiveShadows = true;
                // merged.checkCollisions = true;
                // merged.renderingGroupId = 2;
                // merged.material = bridgeMaterial;

            }, e => console.log("Loading..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
    
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);

        var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

        sensors.forEach(sensor => {
            var sensorMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);

            sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            this.sensors.push(sensorMesh);
        });

       
      
    }
}