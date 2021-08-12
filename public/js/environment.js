"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const core_1 = require("@babylonjs/core");
const sensors_json_1 = __importDefault(require("./data/sensors.json"));
class Environment {
    constructor(scene) {
        this.sensors = [];
        this._scene = scene;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._loadAssets();
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
        });
    }
    setAllSensorsVisible(visible) {
        const group = visible ? 1 : 2;
        this._bridgeMeshes.forEach(m => {
            m.renderingGroupId = group;
        });
    }
    //Load all necessary meshes for the environment
    _loadAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            const bridge = yield core_1.SceneLoader.ImportMeshAsync(null, "../models/bridge/", "scene.gltf", this._scene);
            var bridgeMaterial = new core_1.StandardMaterial("bridge", this._scene);
            bridgeMaterial.diffuseColor = new core_1.Color3(1, 0, 0);
            this._bridgeMeshes = bridge.meshes;
            var bridgeMesh = bridge.meshes[0];
            bridgeMesh.renderingGroupId = 1;
            bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
            bridgeMesh.material = bridgeMaterial;
            var light1 = new core_1.HemisphericLight("light1", new core_1.Vector3(1, 1, 0), this._scene);
            var sensorMaterial = new core_1.StandardMaterial("sensorMaterial", this._scene);
            sensorMaterial.diffuseColor = new core_1.Color3(0, 0, 1);
            sensors_json_1.default.forEach(sensor => {
                var sensorMesh = core_1.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);
                sensorMesh.position = new core_1.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
                sensorMesh.material = sensorMaterial;
                sensorMesh.renderingGroupId = 2;
                //sensorMesh.showBoundingBox = true;
                this.sensors.push(sensorMesh);
            });
        });
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map