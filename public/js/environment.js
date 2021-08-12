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
const BABYLON = __importStar(require("babylonjs"));
require("babylonjs-loaders");
const sensors_json_1 = __importDefault(require("./data/sensors.json"));
class Environment {
    constructor(scene) {
        this.sensors = [];
        this._scene = scene;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._loadAssets();
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
            var waterMaterial = new BABYLON.StandardMaterial("water", this._scene);
            waterMaterial.diffuseColor = new BABYLON.Color3(0, .41015, .57813);
            var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 5000, height: 2000 }, this._scene);
            ground.material = waterMaterial;
            BABYLON.SceneLoader.ImportMesh(null, "../models/bridge/", "scene.gltf", this._scene, (meshes, particleSytems, skeletons) => {
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
                    if (m.id === "SketchUp.019__0")
                        //if(++i < 200)
                        m.material = bridgeMaterial;
                });
                this._bridgeMeshes = meshes;
                var bridgeMesh = meshes[0];
                bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
                //bridgeMesh.material = bridgeMaterial;
                // Try merging all meshes then apply material?
                // var merged = BABYLON.Mesh.MergeMeshes(meshes as BABYLON.Mesh[], false, true, undefined, false, true);
                // merged.receiveShadows = true;
                // merged.checkCollisions = true;
                // merged.renderingGroupId = 2;
                // merged.material = bridgeMaterial;
            }, e => console.log("Loading..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
            var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);
            var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
            sensorMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
            sensors_json_1.default.forEach(sensor => {
                var sensorMesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);
                sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
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