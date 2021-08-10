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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const core_1 = require("@babylonjs/core");
class Environment {
    constructor(scene) {
        this._scene = scene;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const assets = yield this._loadAsset();
            //Loop through all environment meshes that were imported
            assets.allMeshes.forEach(m => {
                m.receiveShadows = true;
                m.checkCollisions = true;
                // if (m.name == "ground") { //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
                //     m.checkCollisions = false;
                //     m.isPickable = false;
                // }
            });
            //this._scene.clearColor = new Color4(.617, .105, .195);
        });
    }
    //Load all necessary meshes for the environment
    _loadAsset() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get our model
            // const bridge = await SceneLoader.ImportMeshAsync(null, "../models/", "bridge.gltf", this._scene);
            const bridge = yield core_1.SceneLoader.ImportMeshAsync(null, "../models/bridge/", "scene.gltf", this._scene);
            let bridgeMesh = bridge.meshes[0];
            bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
            let allMeshes = bridgeMesh.getChildMeshes();
            return {
                env: bridgeMesh,
                allMeshes: allMeshes,
            };
        });
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map