import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as earcut from 'earcut';
(window as any).earcut = earcut;
import sensors from "./data/sensors.json";
import { api } from "./api/api";

export class Environment{

    private _scene: BABYLON.Scene;
    private _bridgeMeshes: BABYLON.AbstractMesh[];
    public sensorsMeshes: BABYLON.Mesh[];

    constructor(scene: BABYLON.Scene) {
        this.sensorsMeshes = [];
        this._scene = scene;       
    }

    public async load() {
       
        await this._loadAssets();
    }

    public setAllSensorsVisible(visible: boolean){
        const group = visible ? 3 : 2;
        this.sensorsMeshes.forEach(s => {
            s.renderingGroupId = group;
        });
    }

    private async _loadAssets() {

        console.log(earcut);

        var waterMaterial = new BABYLON.StandardMaterial("water", this._scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0, .41015, .57813);

        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 5000, height: 2000}, this._scene);
        ground.material = waterMaterial;

        // THE SKY

        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000}, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/sky3/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        //skybox.position = new BABYLON.Vector3(300, 700, 1000);
        skybox.position = this._scene.activeCamera.position;
        skybox.material = skyboxMaterial;

        // THE TERRAIN

        BABYLON.SceneLoader.ImportMesh(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene,
        (meshes, particleSytems, skeletons) => {

            var sceneMaterial = new BABYLON.StandardMaterial("scene", this._scene);
            sceneMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);

            var sceneMesh = meshes[0] as BABYLON.Mesh;
            sceneMesh.scaling.copyFromFloats(12, 12, 12);

            meshes.forEach(mesh => {
                mesh.renderingGroupId = 2;
            });

            sceneMesh.material = sceneMaterial;
        }, e => console.log("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        // THE BRIDGE

        BABYLON.SceneLoader.ImportMesh(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene,
            (meshes, particleSytems, skeletons) => {

                var bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
                bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);

                meshes.forEach(m => {
                    m.receiveShadows = true;
                    m.checkCollisions = true;
                    m.renderingGroupId = 2;
                });

                meshes[1].material = bridgeMaterial;

                this._bridgeMeshes = meshes;     

                var bridgeMesh = meshes[0] as BABYLON.Mesh;
                bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
                
                bridgeMesh.rotation = new BABYLON.Vector3(0, 1.462586, 0);
                bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
                
                var sensor1 = this.sensorsMeshes.find(s => s.name === "sensor_1");
                // var plight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(sensor1.position.x, sensor1.position.y, sensor1.position.z + 10), this._scene);
                // plight.range = 100;
                // plight.diffuse = new BABYLON.Color3(1, 0, 0);
                // plight.specular = new BABYLON.Color3(1, 0, 0);
                // plight.intensity = 5;

                // Create heatmap surface

                var values = [];
                for(var i = 0; i < 100; i++) {
                    values.push(Math.random() * 200);
                }
            
                var textureData: any[] = [];
                values.forEach(value => {
                    textureData.push(0, 0, value);
                });

                var texture = new BABYLON.RawTexture(
                    //new Uint32Array(textureData),
                    new Uint8Array(textureData),
                    10,
                    10,
                    BABYLON.Engine.TEXTUREFORMAT_RGB,
                    this._scene,
                    false,
                    false,
                    BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                );

                var heatmapPlane = BABYLON.MeshBuilder.CreatePlane("heatmapPlane", {width: 800, height: 450}, this._scene);

                var heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
                heatmapMaterial.diffuseTexture = texture;
                heatmapPlane.material = heatmapMaterial;

                heatmapPlane.rotation = new BABYLON.Vector3(1.5708, 0.2530727, 0);
                heatmapPlane.position = new BABYLON.Vector3(bridgeMesh.position.x, bridgeMesh.position.y - 73, bridgeMesh.position.z);
                heatmapPlane.renderingGroupId = 2;

                const polyCorners = [
                    new BABYLON.Vector2(50,0),
                    new BABYLON.Vector2(150, 0),
                    new BABYLON.Vector2(100, 50),
                    new BABYLON.Vector2(0, 50)
                ];

                const poly = new BABYLON.PolygonMeshBuilder("poly", polyCorners);
                const polyMesh = poly.build();
                polyMesh.position = new BABYLON.Vector3(-80, -50, 105);

                //heatmapPlane.position = new BABYLON.Vector3(0, 0, 0);

            }, e => console.log("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
    
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);

        // SENSORS

        var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

        sensors.forEach(sensor => {
            var sensorMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);

            sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            this.sensorsMeshes.push(sensorMesh);
        });
 
        this.applyHeatmap(true);
    }

    
    public applyHeatmap(show = true){
        api.getSensorData().then(res => {
            
            res.sensors.forEach(sd => {
                const sensor = sensors.find(s => s.id === sd.id);
                if(sensor)
                    sensor.reading = sd.reading;
            });

            //console.log(sensors);

            // Area texture application
            var sensor1 = this.sensorsMeshes.find(s => s.name === "sensor_1");
            //console.log(sensor1);
            var centerX = sensor1.position.x;
            var centerY = sensor1.position.y;
            var radius = 100;

            // var dynamicTexture = new BABYLON.DynamicTexture("texture", 512, this._scene, true);
            
            // var context = dynamicTexture.getContext();
            // context.beginPath();
            // // context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            // context.arc(-24, 90, 100, 0, 2 * Math.PI, false);
            // context.fillStyle = '#00FF00';
            // context.fill();
            // context.stroke();
            // dynamicTexture.update();

            // const road = this._bridgeMeshes.find(m => m.id === "SketchUp.019__0");

            // bridgeMaterial.emissiveTexture = dynamicTexture;



        });      
    }
}