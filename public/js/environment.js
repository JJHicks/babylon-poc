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
exports.Environment = void 0;
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const BABYLON = __importStar(require("babylonjs"));
require("babylonjs-loaders");
const earcut = __importStar(require("earcut"));
window.earcut = earcut;
const api_1 = require("./api/api");
const ValuesToHeatmap_1 = __importDefault(require("./helpers/ValuesToHeatmap"));
class Environment {
    _scene;
    _bridgeMeshes;
    deckMesh;
    sensorsMeshes;
    constructor(scene) {
        this.sensorsMeshes = [];
        this._scene = scene;
    }
    async load() {
        await this._loadAssets();
    }
    setAllSensorsVisible(visible) {
        const group = visible ? 3 : 2;
        this.sensorsMeshes.forEach(s => {
            s.renderingGroupId = group;
        });
    }
    async _loadAssets() {
        // Sample heatmap usage
        // const minval = 1;
        // const maxval = 3;
        // const steps = 10;
        // const delta = (maxval - minval) / steps;
        // console.log('  Val       R    G    B');
        // for(let i = 0; i < steps; i++){
        //     const val = minval + (i * delta);
        //     try{
        //         let r,g,b;
        //         [r,g,b] = convertValuesToHeatmap(minval, maxval, val);
        //         console.log(`${val.toFixed(2)} -> (${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)})`);
        //     } catch (e) {
        //         console.error(e);
        //     }
        // }
        // THE SKY
        this._createSkyBox();
        // THE TERRAIN
        BABYLON.SceneLoader.ImportMesh(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene, (meshes, particleSytems, skeletons) => {
            var sceneMaterial = new BABYLON.StandardMaterial("scene", this._scene);
            sceneMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
            var sceneMesh = meshes[0];
            sceneMesh.scaling.copyFromFloats(12, 12, 12);
            meshes.forEach(mesh => {
                mesh.renderingGroupId = 2;
            });
            sceneMesh.material = sceneMaterial;
        }, e => console.log("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
        // THE BRIDGE
        BABYLON.SceneLoader.ImportMesh(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene, (meshes, particleSytems, skeletons) => {
            var bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
            bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);
            meshes.forEach(m => {
                m.receiveShadows = true;
                m.checkCollisions = true;
                m.renderingGroupId = 2;
            });
            meshes[1].material = bridgeMaterial;
            this._bridgeMeshes = meshes;
            var bridgeMesh = meshes[0];
            bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
            bridgeMesh.rotation = new BABYLON.Vector3(0, 1.462586, 0);
            bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
            var sensor1 = this.sensorsMeshes.find(s => s.name === "sensor_1");
            // Create heatmap surface
            var textureData = [];
            for (let i = 0; i < 100; i++) {
                try {
                    textureData.push(...ValuesToHeatmap_1.default(0, 100, Math.random() * 100));
                }
                catch (e) {
                    console.error(e);
                }
            }
            var texture = new BABYLON.RawTexture(new Uint8Array(textureData), 4, 2, BABYLON.Engine.TEXTUREFORMAT_RGB, this._scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            var heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
            heatmapMaterial.diffuseTexture = texture;
            heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            const deckSkew = 165;
            const deckWidth = 900;
            const deckHeight = 450;
            const polyCorners = [
                new BABYLON.Vector2(0 + deckSkew, 0),
                new BABYLON.Vector2(deckWidth + deckSkew, 0),
                new BABYLON.Vector2(deckWidth, deckHeight),
                new BABYLON.Vector2(0, deckHeight)
            ];
            const deckXoffset = 570;
            const deckYoffset = 73;
            const deckZoffset = 90;
            const staticDeck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
            this.deckMesh = staticDeck.build();
            this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
            this.deckMesh.renderingGroupId = 2;
            this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI / 180), 0);
            const deck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
            this.deckMesh = deck.build();
            this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
            this.deckMesh.renderingGroupId = 2;
            this.deckMesh.material = heatmapMaterial;
            this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI / 180), 0);
        }, e => console.log("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);
        // SENSORS
        var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new BABYLON.Color3(1, 20 / 255, 147 / 255);
        window.store.sensors.forEach((sensor) => {
            var sensorMesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);
            sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            this.sensorsMeshes.push(sensorMesh);
        });
        this.applyHeatmap(true);
    }
    applyHeatmap(show = true) {
        api_1.api.getSensorData().then(res => {
            res.sensors.forEach(sd => {
                const sensor = window.store.sensors.find((s) => s.id === sd.id);
                if (sensor)
                    sensor.reading = sd.reading;
            });
        });
    }
    _createSkyBox() {
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/sky3/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.position = this._scene.activeCamera.position;
        skybox.material = skyboxMaterial;
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map