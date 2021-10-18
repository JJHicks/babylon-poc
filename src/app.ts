import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "babylonjs";
import { Environment } from "./environment";
import * as GUI from "babylonjs-gui";
import { api } from "./api/api";
import { SensorInfo, SensorData } from "./interfaces/sensorInfo";
import { DateTime } from "luxon";
import { TimeDataSet } from "./interfaces/store";
import flatpickr from "flatpickr";
import "bootstrap";

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
import { heatmapTest } from "./heatmapTest";
import { DetailsViewManager } from "./detailViewManager";
import { AuthManager } from "./authManager";

class App {

    private _authManager: AuthManager;
    private _scene: BABYLON.Scene;
    private _universalCamera: BABYLON.UniversalCamera;
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _environment: Environment;

    private _infoDisplayTexture: GUI.AdvancedDynamicTexture;
    private _infoDisplayTextBlock: GUI.TextBlock;
    private _detailsViewManager: DetailsViewManager;

    private _playbackInterval: number;
    private _sensorManager: SensorManager;
    private _heatmapManager: HeatmapManager;
    private _deformationSurface: DeformationSurface;

    private _heatmapTest: heatmapTest;

    public username?: string;

    constructor() {
        this._authManager = AuthManager.getInstance();
        this._checkLoggedIn();
    }

    private async _checkLoggedIn(){
        this._authManager.logIn().then(async account => {
            if(account)
                await this._init();
        });
    }

    private async _init(){

        BABYLON.RenderingManager.MAX_RENDERINGGROUPS = 8;

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
        this._engine = new BABYLON.Engine(this._canvas, true, { stencil: true });
        this._scene = new BABYLON.Scene(this._engine);
        this._environment = new Environment(this._scene);
        this._detailsViewManager = new DetailsViewManager();

        this._engine.displayLoadingUI();

        // Optimizations
        this._scene.autoClear = false; // Color buffer
        this._scene.autoClearDepthAndStencil = false; // Depth and stencil

        // hide/show the Inspector, i
        window.addEventListener("keydown", (ev) => {
            if (ev.shiftKey && ev.keyCode === 73) {
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

        this._sensorManager = SensorManager.getInstance();
        this._sensorManager.scene = this._scene;

        this._heatmapManager = HeatmapManager.getInstance();
        this._heatmapManager.scene = this._scene;

        this._generateFalseSensorData();

        // Surface deformation test
        this._deformationSurface = new DeformationSurface(this._scene, 5, 3);

        this._heatmapTest = new heatmapTest();

        this._engine.hideLoadingUI();
        document.querySelectorAll(".hide-before-load").forEach((el: HTMLElement) => el.hidden = false);
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
        document.getElementById("heatmapOpacity").addEventListener("input", e => this._heatmapManager.adjustDeckHeatmapAlpha());
        document.getElementById("playbackIcon").addEventListener("click", e => this._togglePlayback());
        document.getElementById("heatmapDatasetSelect").addEventListener("change", e => this._heatmapManager.updateHeatmap());
        document.getElementById("exportCSV").addEventListener("click", e => this._exportCSV());
        document.getElementById("bridgeOpacity").addEventListener("input", e => this._environment.adjustBridgeAlpha());
        window.addEventListener("resize", () => this._resizeCanvas());
       
        document.getElementById("startDate").addEventListener("change", e => {
            const startDatePicker = document.getElementById("startDate") as HTMLInputElement;
            const endDatePicker = document.getElementById("endDate") as HTMLInputElement;

            flatpickr("#endDate", {
                minDate: startDatePicker.value
            });

            if(new Date(startDatePicker.value) > new Date(endDatePicker.value)){
                endDatePicker.value = startDatePicker.value;
            }

            this._generateFalseSensorData();
        });
        document.getElementById("endDate").addEventListener("change", e => this._generateFalseSensorData());

        document.getElementById("detailsSidebar").addEventListener("shown.bs.collapse", (e) => {
            if((e.target as HTMLElement).id !== "detailsSidebar")
                return;
            this._resizeCanvas();
        });

        document.getElementById("detailsSidebar").addEventListener("hidden.bs.collapse", (e) => {
            if((e.target as HTMLElement).id !== "detailsSidebar")
                return;
            this._resizeCanvas();
            this._sensorManager.clearSensorHighlights();
        });

        document.getElementById("detailsSidebar").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const el = e.target as HTMLElement;

            if(el.nodeName !== "A")
                return;
            const id = el.dataset.id;
            this._detailsViewManager.updateGraph(id);
            this._sensorManager.highlightSensor(id);
        });

        const labelCheckboxes = document.getElementsByClassName("label-toggle");
        for(let i = 0; i < labelCheckboxes.length; i++){
            labelCheckboxes[i].addEventListener("click", e => {
                const el = e.target as HTMLInputElement;
                this._sensorManager.updateLabels(el.dataset.type, el.checked);
            });
        }

        this._scene.onPointerDown = (evt, pickResult) => {
            let results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            // console.debug(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

            if(document.getElementById("detailsSidebar").classList.contains("show")){
                if(results.length < 1) return;
                const clickedMeshId = results[results.length - 1].pickedMesh.id;
                if(this._sensorManager.isSensorId(clickedMeshId)){
                    console.debug(clickedMeshId);
                    this._sensorManager.highlightSensor(clickedMeshId);
                    this._detailsViewManager.updateGraph(clickedMeshId);
                }                
            }
        }

        document.querySelectorAll(".logout-button").forEach(el => {
            el.addEventListener("click", e => {
                this._authManager.logOut();
            });
        });
    }

    private _resizeCanvas(){
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._engine.resize();
    }

    private _exportCSV(){

        let sensorGroups: string[] = [];

        document.querySelectorAll(".export-type-select").forEach((option: HTMLInputElement) => {
            if(option.checked){
                sensorGroups.push(option.dataset["type"]);
            }
        });

        let headers: string[] = [];  
        
        sensorGroups.forEach(groupName => 
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
        CSVHelper.exportCSVFile(headers, data, `${startDate}-${endDate}_${sensorGroups.join("_")}_export`);
    }   
    
    private _handleTimeChange(){
        const val = (document.getElementById("timeSelect") as HTMLInputElement).value;
        document.getElementById("timeDisplay").innerText = (window.store.timesShown[val] as DateTime).toLocaleString(DateTime.DATETIME_SHORT);

        const dateTimeSelected = DateTime.fromISO(window.store.timesShown[val]);
        window.store.activeDataset = window.store.timeData.find((data: TimeDataSet) => data.time.equals(dateTimeSelected));

        this._sensorManager.updateAllShownLabels();
        this._heatmapManager.updateHeatmap();

        this._heatmapTest.updateHeatmaps();
        this._deformationSurface.updateSurface();
    }

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
}

new App();