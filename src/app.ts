import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "babylonjs";
import { Environment } from "./environment";
import * as GUI from "babylonjs-gui";
import { api } from "./api/api";
import { SensorInfo, SensorData } from "./interfaces/sensorInfo";
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { DateTime } from "luxon";
import { TimeDataSet } from "./interfaces/store";
import flatpickr from "flatpickr";

import { SensorManager } from "./sensorManager";
import { CSVHelper } from "./helpers/CSVHelper";

// Temp imports for fake data
import _accelerometers from "./data/accelerometers.json";
import _halfBridges from "./data/halfBridges.json";
import _quarterBridges from "./data/quarterBridges.json";
import _rosettes from "./data/rosettes.json";
import _thermistors from "./data/thermistors.json";
import _weathers from "./data/weathers.json";
import { HeatmapManager } from "./heatmapManager";
import { DeformationSurface } from "./deformationSurface";

class App {

    private _scene: BABYLON.Scene;
    private _universalCamera: BABYLON.UniversalCamera;
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _environment: Environment;

    private _infoDisplayTexture: GUI.AdvancedDynamicTexture;
    private _infoDisplayTextBlock: GUI.TextBlock;

    private _playbackInterval: number;
    private _sensorManager: SensorManager;
    private _heatmapManager: HeatmapManager;
    private _deformationSurface: DeformationSurface;

    constructor() {

        window.store = {
            activeDataset: null,
            timeData: [],
            timesShown: []
        };

        // Create the canvas html element and attach it to the webpage
        let container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.id = "renderCanvas";
        container.appendChild(this._canvas);

        // Initialize babylon scene and engine
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);
        this._environment = new Environment(this._scene);

        // Optimizations
        this._scene.autoClear = false; // Color buffer
        this._scene.autoClearDepthAndStencil = false; // Depth and stencil

        // hide/show the Inspector, i
        window.addEventListener("keydown", (ev) => {
            if (ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        this._buildEnvironment();

        flatpickr("#startDate", {
            defaultDate: new Date(),
        });

        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        flatpickr("#endDate", {
            defaultDate: tomorrow,
            minDate: (document.getElementById("startDate") as HTMLInputElement).value
        });
    }

    private async _buildEnvironment(){
        this._initCamera();
        await this._environment.load();
    
        this._bindEvents();
        // Babylon GUI
        this._initInfoDisplay();

        // HTML Overlay
        // this._initSensorDataDisplay();

        this._sensorManager = SensorManager.getInstance();
        this._sensorManager.scene = this._scene;

        this._heatmapManager = HeatmapManager.getInstance();
        this._heatmapManager.scene = this._scene;

        this._generateFalseSensorData();

        // Surface deformation test
        this._deformationSurface = new DeformationSurface();
    }

    private _bindEvents(){

        // document.getElementById("showHeatmap").addEventListener("change", e => {
        //     api.getSensorData().then(res => console.log(res));
        // });

        document.getElementById("timeSelect").addEventListener("input", e => {
            if(this._playbackInterval !== undefined){
                this._togglePlayback();
            }
            this._handleTimeChange();
        });

        document.getElementById("sensorsInFront").addEventListener("change", e => this._sensorManager.setAllSensorsVisible((e.target as HTMLInputElement).checked));
        document.getElementById("showHeatmap").addEventListener("change", e => this._heatmapManager.adjustDeckHeatmapAlpha());
        // document.getElementById("showSensorData").addEventListener("change", e => this._toggleShowSensorData());
        document.getElementById("heatmapOpacity").addEventListener("input", e => this._heatmapManager.adjustDeckHeatmapAlpha());
        document.getElementById("playbackIcon").addEventListener("click", e => this._togglePlayback());
        document.getElementById("heatmapDatasetSelect").addEventListener("change", e => this._heatmapManager.updateHeatmap());
        document.getElementById("exportCSV").addEventListener("click", e => this._exportCSV());
       
        document.getElementById("startDate").addEventListener("change", e => {
            const startDatePicker = document.getElementById("startDate") as HTMLInputElement;
            const endDatePicker = document.getElementById("endDate") as HTMLInputElement;

            flatpickr("#endDate", {
                minDate: startDatePicker.value
            });

            if(new Date(startDatePicker.value) > new Date(endDatePicker.value)){
                endDatePicker.value = startDatePicker.value;
            }

            this._generateFalseSensorData()
        });
        document.getElementById("endDate").addEventListener("change", e => this._generateFalseSensorData());


        const labelCheckboxes = document.getElementsByClassName("label-toggle");
        for(let i = 0; i < labelCheckboxes.length; i++){
            labelCheckboxes[i].addEventListener("click", e => {
                const el = e.target as HTMLInputElement;
                this._sensorManager.updateLabels(el.dataset.type, el.checked);
            });
        }

        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });

        this._scene.onPointerDown = (evt, pickResult) => {
            let results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            //console.log(pickResult);
            //console.log(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

            let firstSensorHitByRay = results.find(info => info.pickedMesh.name.includes("sensor_"));

            if(firstSensorHitByRay){
                const sensor = window.store.sensors.find((s: SensorInfo) => s.name === firstSensorHitByRay.pickedMesh.name);
                console.log("SENSOR HIT: " + firstSensorHitByRay.pickedMesh.name);
                this._infoDisplayTextBlock.text = `${firstSensorHitByRay.pickedMesh.name} - ${sensor.id}`;
            }
        }
    }

    private _exportCSV(){

        let headers: string[] = [];
        
        ["accelerometers", "halfBridges", "quarterBridges", "rosettes"].forEach(groupName => 
            headers.push(...this._sensorManager.getGageGroup(groupName).map(group => group.metaData.id))
        );

        let data: string[][] = [];

        window.store.timeData.forEach((timeData: TimeDataSet) => {
            let row = [`"${timeData.time.toLocaleString(DateTime.DATETIME_SHORT)}"`];
            headers.forEach(header => {
                let datapointForHeader = timeData.data.find(td => td.id === header);
                row.push(datapointForHeader !== undefined ? "" + datapointForHeader.value : "--");
            });
            data.push(row);
        });

        headers.unshift("Datetime");

        const startDate = (document.getElementById("startDate") as HTMLInputElement).value;
        const endDate = (document.getElementById("endDate") as HTMLInputElement).value;
        CSVHelper.exportCSVFile(headers, data, `${startDate}-${endDate}_export`);
    }   
    
    private _handleTimeChange(){
        const val = (document.getElementById("timeSelect") as HTMLInputElement).value;
        document.getElementById("timeDisplay").innerText = (window.store.timesShown[val] as DateTime).toLocaleString(DateTime.DATETIME_SHORT);

        const dateTimeSelected = DateTime.fromISO(window.store.timesShown[val]);
        window.store.activeDataset = window.store.timeData.find((data: TimeDataSet) => data.time.equals(dateTimeSelected));

        this._sensorManager.updateAllShownLabels();
        this._heatmapManager.updateHeatmap();
    }

    // private _initSensorDataDisplay(){
    //     const displayContainer = document.getElementById("sensorDataDisplayContainer") as HTMLElement;

    //     let rows = displayContainer.getElementsByClassName(".sensorRowData");
    //     while(rows[0]) rows[0].parentNode.removeChild(rows[0]);

    //     const template = document.getElementById("sensorDataDisplayRowTemplate") as HTMLTemplateElement;
    //     window.store.sensors.forEach((sensor: SensorInfo) => {

    //         let row = template.content.cloneNode(true) as HTMLElement;
    //         const nameSection = row.querySelector(".sensorDataName") as HTMLElement;
    //         const valueSection = row.querySelector(".sensorDataValue") as HTMLElement;
            
    //         nameSection.textContent = sensor.name;
    //         valueSection.dataset.id = sensor.id;

    //         displayContainer.appendChild(row);
    //     });

    //     this._updateSensorDataDisplay();
    // }

    // private _updateSensorDataDisplay(){
    //     const displayContainer = document.getElementById("sensorDataDisplayContainer") as HTMLInputElement;
    //     const timeSliderValue = (document.getElementById("timeSelect") as HTMLInputElement).value;
    //     const time = window.store.timesShown[timeSliderValue];
    //     const dateTimeSelected = DateTime.fromISO(time);

    //     window.store.sensors.forEach((sensor: SensorInfo) => {
    //         const timeData = sensor.data.find((d: SensorData) => d.datetime.equals(dateTimeSelected));
    //         const field = displayContainer.querySelector(`.sensorDataValue[data-id="${sensor.id}"]`);
    //         if(field === null) return;
    //         field.textContent = timeData !== undefined ? timeData.value.toFixed(5).toString() : "- No Value";
    //     });
    // }

    // private _toggleShowSensorData(){
    //     const displayContainer = document.getElementById("sensorDataDisplayContainer") as HTMLInputElement;
    //     displayContainer.hidden = !(document.getElementById("showSensorData") as HTMLInputElement).checked;
    // }

    private _togglePlayback(){
        const icon = document.getElementById("playbackIcon") as HTMLElement;

        if(this._playbackInterval !== undefined){
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");
            clearInterval(this._playbackInterval);
            this._playbackInterval = undefined;
            return;
        }

        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");

        this._playbackInterval = setInterval(() => {
            const el = document.getElementById("timeSelect") as HTMLInputElement;
            if(+el.value < +el.max){
                el.value = (+el.value + (+el.step)).toString();
            } else {
                el.value = el.min;
            }
            this._handleTimeChange();
        }, 1000);
    }

    private _generateFalseSensorData(){
        const interval = 30;    // How often readings are taken, in minutes

        let datetime = DateTime.fromISO((document.getElementById("startDate") as HTMLInputElement).value);
        const end = DateTime.fromISO((document.getElementById("endDate") as HTMLInputElement).value);

        window.store.timesShown = [];

        let timeIntervals = 0;        // To limit the size of the store times to avoid issues
        while(datetime <= end && timeIntervals < 5000){
            window.store.timesShown.push(datetime);
            datetime = datetime.plus({minutes: interval});
            timeIntervals++;
        }

        const slider = document.getElementById("timeSelect") as HTMLInputElement;
        slider.max = slider.value = (window.store.timesShown.length - 1).toString();
        document.getElementById("timeDisplay").innerText = (window.store.timesShown[parseInt(slider.max) - 1] as DateTime).toLocaleString(DateTime.DATETIME_SHORT);;

        window.store.activeDataset = [];

        const sensorEntityIds = [..._accelerometers, ..._halfBridges, ..._quarterBridges, ..._rosettes, ..._thermistors, ..._weathers].map(s => s.id);

        window.store.timeData = window.store.timesShown.map((time: DateTime) => ({ 
                time: time,  
                data: sensorEntityIds.map(id => ({id: id, value: Math.random() * 100}))
            }));

        window.store.activeDataset = window.store.timeData[0];

        this._heatmapManager.updateHeatmap();
        this._sensorManager.updateAllShownLabels();
    }

    private _initCamera(){
        this._universalCamera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 800, -1500), this._scene);
        this._universalCamera.setTarget(BABYLON.Vector3.Zero());
        this._universalCamera.keysLeft = [65, 37]; // A, Left
        this._universalCamera.keysRight = [68, 39]; // D, Right
        this._universalCamera.keysUp = [87, 38]; // W, Up
        this._universalCamera.keysDown = [83 ,40]; // S, Down
        this._universalCamera.keysDownward = [81]; // Q
        this._universalCamera.keysUpward = [69]; // E
        this._universalCamera.speed = 10;
        this._universalCamera.attachControl(this._canvas)
    }

    private _initInfoDisplay(){
        this._infoDisplayTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._infoDisplayTextBlock = new GUI.TextBlock();
        this._infoDisplayTextBlock.fontSize = 24;
        this._infoDisplayTextBlock.paddingTop = "20px";
        this._infoDisplayTextBlock.paddingRight = "20px";
        this._infoDisplayTextBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._infoDisplayTextBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._infoDisplayTextBlock.color = "white";
        this._infoDisplayTexture.addControl(this._infoDisplayTextBlock);
    }
}

new App();