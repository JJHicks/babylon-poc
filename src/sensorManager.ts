import * as BABYLON from "babylonjs";
import _nodeBoxes from "./data/nodeBoxes.json";
import _auxBoxes from "./data/auxBoxes.json";
import _accelerometers from "./data/accelerometers.json";
import _halfBridges from "./data/halfBridges.json";
import _quarterBridges from "./data/quarterBridges.json";
import _rosettes from "./data/rosettes.json";
import _thermistors from "./data/thermistors.json";
import _weathers from "./data/weathers.json";
import { SensorObject } from "./objects/sensor";
import { SensorMetadata } from "./interfaces/sensorMetadata";
import { AuxBox } from "./interfaces/auxBox";
import { NodeBox } from "./interfaces/nodeBox";

export class SensorManager{

    private static _instance: SensorManager;
    private _entities: SensorManagerEntities;
    private _highlightLayer?: BABYLON.HighlightLayer;

    public sensorData: any[];

    public scene: BABYLON.Scene;

    private constructor(){
        
    }

    public getGageGroup(groupName: string){
        const group = this._entities.gageGroups.find(g => g.name === groupName);
        if(group === undefined)
            throw new Error("Gage group not found.");
            
        return [...group.objects];
    }

    static getInstance(){
        if(!SensorManager._instance){
            SensorManager._instance = new SensorManager();
            SensorManager._instance._loadEntities();
        }
        return SensorManager._instance;
    }

    public isSensorId(id: string): boolean{
        return this._entities.gageGroups.some(g => g.objects.some(o => o.metaData.id === id));
    }

    public updateAllShownLabels(): void{
        const groupsToUpdate = this._entities.gageGroups.filter(group => group.labelsVisible).map(g => g.name);
        groupsToUpdate.forEach(groupName => this.updateLabels(groupName, true));
    }

    public updateLabels(type: string, visible: boolean): void{

        const titleFont = "bold 32px monospace";
        const dataFont = "bold 24px monospace";
        const labelHeightOffset = 50;

        this.scene.blockMaterialDirtyMechanism = true;

        switch(type){
            case "nodeBoxes":
            case "auxBoxes":
                this._entities[type].forEach(entity => {
                    if(!visible){
                        entity.labelMesh !== undefined && entity.labelMesh.dispose(null, true);
                        entity.labelMesh = null;
                        return;
                    }

                    const text = entity.name;
                    const labelTexture = new BABYLON.DynamicTexture(`${entity}_${entity.name}_texture`, {width:512, height:256}, this.scene, false);  

                    labelTexture.drawText(text, null, null, titleFont, "white", "transparent", true, true);

                    const labelMaterial = new BABYLON.StandardMaterial(`${entity}_${entity.name}_texture`, this.scene);    				
                    labelMaterial.emissiveColor = new BABYLON.Color3(255, 255, 255);
                    labelMaterial.diffuseTexture = labelTexture;
                    labelMaterial.diffuseTexture.hasAlpha = true;

                    if(entity.labelMesh){
                        entity.labelMesh.material.dispose(true, true, null);
                        entity.labelMesh.material = labelMaterial;
                    } else {
                        const labelWidth = this._measureTextWidth(text, titleFont) + 10;
                        const labelHeight = 120;
        
                        entity.labelMesh = BABYLON.MeshBuilder.CreatePlane(`${entity}_${entity.name}_label`, {width: labelWidth, height: labelHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene);
                        entity.labelMesh.renderingGroupId = 3;
                        entity.labelMesh.position = new BABYLON.Vector3(entity.info.position.x, entity.info.position.y + labelHeightOffset, entity.info.position.z);
                        entity.labelMesh.material = labelMaterial;
                        entity.labelMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                    }
                });
                break;
            default: 

                const gageGroup = this._entities.gageGroups.find(group => group.name === type);

                gageGroup.objects.forEach(entity => {
                    if(!visible){
                        entity.labelMesh !== undefined && entity.labelMesh.dispose(null, true);
                        entity.labelMesh = null;
                        return;
                    }

                    const sensorData = window.store.activeDataset.data.find((d: any) => d.id === entity.metaData.id);
                    const readingValue = sensorData !== undefined ? sensorData.value : "No Value";
                    const text = entity.metaData.id;
                    
                    let labelTexture = new BABYLON.DynamicTexture(`label_${entity.metaData.id}_texture`, {width:512, height:256}, this.scene, false);  
        
                    labelTexture.drawText(text, null, null, titleFont, "white", "transparent", true, true);
                    labelTexture.drawText(readingValue, null, 160, dataFont, "white", "transparent", true, true);
        
                    let labelMaterial = new BABYLON.StandardMaterial(`label_${entity.metaData.id}_material`, this.scene);    				
                    labelMaterial.emissiveColor = new BABYLON.Color3(255, 255, 255);
                    labelMaterial.diffuseTexture = labelTexture;
                    labelMaterial.diffuseTexture.hasAlpha = true;
        
                    if(entity.labelMesh){
                        entity.labelMesh.material.dispose(true, true, null);
                        entity.labelMesh.material = labelMaterial;
                    } else {
                        const labelWidth = this._measureTextWidth(text, titleFont) + 10;
                        const labelHeight = 120;
                        entity.labelMesh = BABYLON.MeshBuilder.CreatePlane(`label_${entity.metaData.id}`, {width: labelWidth, height: labelHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene);
                        entity.labelMesh.renderingGroupId = 3;
                        entity.labelMesh.position = new BABYLON.Vector3(entity.metaData.position.x, entity.metaData.position.y + labelHeightOffset, entity.metaData.position.z);
                        entity.labelMesh.material = labelMaterial;
                        entity.labelMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                    }
                });     
                gageGroup.labelsVisible = visible;   

                break;
        }
        this.scene.blockMaterialDirtyMechanism = false;
    }

    public setAllSensorsVisible(visible: boolean): void{
        const renderGroupId = visible ? 3 : 2;

        this._entities.nodeBoxes.forEach(nodeBox => nodeBox.mesh.renderingGroupId = renderGroupId);
        this._entities.auxBoxes.forEach(auxBox => auxBox.mesh.renderingGroupId = renderGroupId);
        this._entities.gageGroups.forEach(group => {
            group.objects.forEach(object => object.mesh.renderingGroupId = renderGroupId);
        });
    }

    public highlightSensor(id: string): void{
        this.clearSensorHighlights();

        const sensorGroup = this._entities.gageGroups.find(g => g.objects.some(o => o.metaData.id === id));
        this._highlightLayer = new BABYLON.HighlightLayer("sensorHLLayer", this.scene);    
        const sensor = sensorGroup.objects.find(o => o.metaData.id === id);
        this._highlightLayer.addMesh(sensor.mesh, BABYLON.Color3.Green());        
    }

    public clearSensorHighlights(): void{
        if(this._highlightLayer){
            this._highlightLayer.dispose();
        }
    }

    private _measureTextWidth(text: string, font: string): number{
        let temp = new BABYLON.DynamicTexture("TempDynamicTexture", {width:512, height:256}, this.scene, false);
        let tmpctx = temp.getContext();
        tmpctx.font = font;
        let DTWidth = tmpctx.measureText(text).width;
        temp.dispose();
        return DTWidth;
    }

    private _loadEntities(): void{
        
        const nodeBoxes = _nodeBoxes as NodeBox[];
        const auxBoxes = _auxBoxes as AuxBox[];
        const sensorImports: {[key: string] : SensorMetadata[]} = {
            accelerometers: _accelerometers as SensorMetadata[],
            halfBridges: _halfBridges as SensorMetadata[],
            quarterBridges: _quarterBridges as SensorMetadata[],
            rosettes: _rosettes as SensorMetadata[],
            thermistors: _thermistors as SensorMetadata[],
            weathers: _weathers as SensorMetadata[]
        }

        // Temp positioning, remove later
        
        for(let i = 0; i < nodeBoxes.length; i++){
            nodeBoxes[i].position = {x: 300, y: -100, z: 194 + (i * 20)};
        }
        for(let i = 0; i < auxBoxes.length; i++){
            auxBoxes[i].position = {x: 400, y: -100, z: 194 + (i * 20)};
        }
        let spacer = 0;
        Object.keys(sensorImports).forEach(key => {

            for(let j = 0; j < sensorImports[key].length; j++){
                sensorImports[key][j].position = { x: (500 + (spacer * 100)), y: -100, z: 194 + (j * 20)};
            }
            spacer++;
        });

        // End temp positioning

        this._entities = {
            gageGroups: [],
            auxBoxes: [],
            nodeBoxes: []
        }

        const sensorDiameter = 5;

        const colors: {[key:string]: [number,number,number]}= {
            nodeBoxes: [100,100,100],
            auxBoxes: [150,150,150],
            accelerometers: [170,170,170],
            halfBridges: [180,180,180],
            quarterBridges: [190,190,190],
            rosettes: [200,200,200],
            thermistors: [210,210,210],
            weathers: [220,220,220]
        };

        let nodeBoxMaterial = new BABYLON.StandardMaterial("nodeBoxMaterial", this.scene);
        nodeBoxMaterial.diffuseColor = new BABYLON.Color3(colors.nodeBoxes[0]/255, colors.nodeBoxes[1]/255, colors.nodeBoxes[2]/255);
        nodeBoxMaterial.freeze();

        this._entities.nodeBoxes = nodeBoxes.map((nodeBox: NodeBox) => {
            const mesh = BABYLON.MeshBuilder.CreateSphere(nodeBox.id, { diameter: sensorDiameter }, this.scene);
            mesh.material = nodeBoxMaterial;
            mesh.renderingGroupId = 2;
            mesh.position = new BABYLON.Vector3(nodeBox.position.x, nodeBox.position.y, nodeBox.position.z);
            mesh.freezeWorldMatrix();
            return {
                name: nodeBox.id,
                primaryColor: colors.nodeBoxes,
                info: nodeBox,
                mesh: mesh
            }
        });

        let auxBoxMaterial = new BABYLON.StandardMaterial("auxBoxMaterial", this.scene);
        auxBoxMaterial.diffuseColor = new BABYLON.Color3(colors.auxBoxes[0]/255, colors.auxBoxes[1]/255, colors.auxBoxes[2]/255);
        auxBoxMaterial.freeze();

        this._entities.auxBoxes = auxBoxes.map((auxBox: AuxBox) => {
            const mesh = BABYLON.MeshBuilder.CreateSphere(auxBox.id, { diameter: sensorDiameter }, this.scene);
            mesh.material = auxBoxMaterial;
            mesh.renderingGroupId = 2;
            mesh.position = new BABYLON.Vector3(auxBox.position.x, auxBox.position.y, auxBox.position.z);
            mesh.freezeWorldMatrix();
            return {
                name: auxBox.id,
                primaryColor: colors.nodeBoxes,
                info: auxBox,
                mesh: mesh
            }
        });

        for(let gageTypeName in sensorImports){
            let material = new BABYLON.StandardMaterial(`${gageTypeName}Material`, this.scene);
            material.diffuseColor = new BABYLON.Color3(colors[gageTypeName][0]/255, colors[gageTypeName][1]/255, colors[gageTypeName][2]/255);
            material.freeze();       
            
            const objects = sensorImports[gageTypeName].map((sensor: SensorMetadata) : SensorObject => {          
                const mesh = BABYLON.MeshBuilder.CreateSphere(sensor.id, { diameter: sensorDiameter }, this.scene);
                mesh.material = material;
                mesh.renderingGroupId = 2;
                mesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
                mesh.freezeWorldMatrix();
                const object = new SensorObject(sensor);
                object.metaData = sensor;
                object.mesh = mesh;
                object.primaryColor = colors[gageTypeName];
                return object;
            });


            this._entities.gageGroups.push({
                name: gageTypeName,
                primaryColor: colors[gageTypeName],
                objects: objects,
                labelsVisible: false
            });        
        }
    }
}

interface SensorManagerEntities {
    gageGroups: Array<
        {
            name: string,
            primaryColor: [number, number, number],
            objects: SensorObject[],
            labelsVisible: boolean
        }>,
    auxBoxes: Array<
        {
            name: string,
            primaryColor: [number, number, number],
            info: AuxBox,
            mesh: BABYLON.Mesh,
            labelMesh?: BABYLON.Mesh
        }>,
    nodeBoxes: Array<
        {
            name: string,
            primaryColor: [number, number, number],
            info: NodeBox,
            mesh: BABYLON.Mesh,
            labelMesh?: BABYLON.Mesh
        }>
    
}