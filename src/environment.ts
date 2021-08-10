import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, SceneLoader, Color4 } from "@babylonjs/core";

export class Environment{

    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;       
    }

    public async load() {
       
        const assets = await this._loadAsset();

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
    }

    //Load all necessary meshes for the environment
    public async _loadAsset() {

        // Get our model
        // const bridge = await SceneLoader.ImportMeshAsync(null, "../models/", "bridge.gltf", this._scene);
        const bridge = await SceneLoader.ImportMeshAsync(null, "../models/bridge/", "scene.gltf", this._scene);
    
        let bridgeMesh = bridge.meshes[0];
        bridgeMesh.scaling.copyFromFloats(0.1, 0.1, 0.1);
        let allMeshes = bridgeMesh.getChildMeshes();   

        return {
            env: bridgeMesh,
            allMeshes: allMeshes,
        }
    }

}