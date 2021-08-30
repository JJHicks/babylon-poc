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
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const BABYLON = __importStar(require("babylonjs"));
const environment_1 = require("./environment");
const GUI = __importStar(require("babylonjs-gui"));
const sensors_json_1 = __importDefault(require("./data/sensors.json"));
const ValuesToHeatmap_1 = __importDefault(require("./helpers/ValuesToHeatmap"));
const luxon_1 = require("luxon");
class App {
    _scene;
    _universalCamera;
    //private _fpCamera: BABYLON.
    _canvas;
    _engine;
    _environment;
    _infoDisplayTexture;
    _infoDisplayTextBlock;
    _playbackInterval;
    constructor() {
        window.store = window.store || {};
        window.store.sensors = [...sensors_json_1.default];
        // Sensor stress test 
        let offset = 20;
        for (let i = 1; i < 10; i++) {
            let j = 10;
            sensors_json_1.default.forEach((sensor) => {
                let sensorCopy = {};
                Object.assign(sensorCopy, sensor);
                sensorCopy["position"] = {};
                Object.assign(sensorCopy.position, sensor.position);
                Object.assign(sensorCopy.data, sensor.data);
                sensorCopy.id = (j * i) + "";
                sensorCopy.name = `sensor_${sensorCopy.id}`;
                sensorCopy.position.z += (offset * i);
                //console.log(sensorCopy);
                window.store.sensors.push(sensorCopy);
                j++;
            });
        }
        console.log(window.store.sensors);
        // Create the canvas html element and attach it to the webpage
        var container = document.getElementById("canvasContainer");
        this._canvas = document.createElement("canvas");
        this._canvas.id = "renderCanvas";
        container.appendChild(this._canvas);
        // Initialize babylon scene and engine
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);
        this._environment = new environment_1.Environment(this._scene);
        // Optimizations
        this._scene.autoClear = false; // Color buffer
        this._scene.autoClearDepthAndStencil = false; // Depth and stencil
        // hide/show the Inspector, i
        window.addEventListener("keydown", (ev) => {
            if (ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                }
                else {
                    this._scene.debugLayer.show();
                }
            }
        });
        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        this._buildEnvironment();
    }
    async _buildEnvironment() {
        this._initCamera();
        await this._environment.load();
        this._addEvents();
        // Babylon GUI
        this._initInfoDisplay();
        this._generateFalseSensorData();
        // HTML Overlay
        this._initSensorDataDisplay();
    }
    _addEvents() {
        document.getElementById("sensorsInFront").addEventListener("change", e => {
            this._environment.setAllSensorsVisible(e.target.checked);
        });
        document.getElementById("date").addEventListener("change", e => this._generateFalseSensorData());
        // document.getElementById("showHeatmap").addEventListener("change", e => {
        //     api.getSensorData().then(res => console.log(res));
        // });
        //document.getElementById("changeHeatmap").addEventListener("click", e => this._updateHeatmap());
        document.getElementById("timeSelect").addEventListener("input", e => {
            if (this._playbackInterval !== undefined) {
                this._togglePlayback();
            }
            this._handleTimeChange();
        });
        document.getElementById("showHeatmap").addEventListener("change", e => this._adjustDeckHeatmapAlpha());
        document.getElementById("showSensorData").addEventListener("change", e => this._toggleShowSensorData());
        document.getElementById("heatmapOpacity").addEventListener("input", e => this._adjustDeckHeatmapAlpha());
        document.getElementById("playbackIcon").addEventListener("click", e => this._togglePlayback());
        document.getElementById("showSensorLabels").addEventListener("change", e => this._toggleSensorLabels());
        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });
        this._scene.onPointerDown = (evt, pickResult) => {
            var results = this._scene.multiPick(this._scene.unTranslatedPointer.x, this._scene.unTranslatedPointer.y);
            //console.log(pickResult);
            //console.log(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);
            var firstSensorHitByRay = results.find(info => info.pickedMesh.name.includes("sensor_"));
            if (firstSensorHitByRay) {
                const sensor = window.store.sensors.find((s) => s.name === firstSensorHitByRay.pickedMesh.name);
                console.log("SENSOR HIT: " + firstSensorHitByRay.pickedMesh.name);
                this._infoDisplayTextBlock.text = `${firstSensorHitByRay.pickedMesh.name} - ${sensor.id}`;
            }
        };
    }
    _toggleSensorLabels() {
        const show = document.getElementById("showSensorLabels").checked;
        if (show) {
            this._updateSensorLabels();
            return;
        }
        this._environment.clearSensorLabels();
    }
    _updateSensorLabels() {
        const timeSliderValue = document.getElementById("timeSelect").value;
        const time = window.store.timesShown[timeSliderValue];
        const dateTimeSelected = luxon_1.DateTime.fromISO(time);
        let data = [];
        window.store.sensors.forEach((sensor) => {
            const timeData = sensor.data.find((d) => d.datetime.equals(dateTimeSelected));
            data.push({ id: sensor.id, value: timeData !== undefined ? timeData.value.toFixed(5).toString() : "- No Value" });
        });
        this._environment.updateSensorLabels(data);
    }
    _handleTimeChange() {
        const val = document.getElementById("timeSelect").value;
        document.getElementById("timeDisplay").innerText = window.store.timesShown[val].toLocaleString(luxon_1.DateTime.DATETIME_SHORT);
        this._updateHeatmap();
    }
    _initSensorDataDisplay() {
        const displayContainer = document.getElementById("sensorDataDisplayContainer");
        let rows = displayContainer.getElementsByClassName(".sensorRowData");
        while (rows[0])
            rows[0].parentNode.removeChild(rows[0]);
        const template = document.getElementById("sensorDataDisplayRowTemplate");
        window.store.sensors.forEach((sensor) => {
            let row = template.content.cloneNode(true);
            const nameSection = row.querySelector(".sensorDataName");
            const valueSection = row.querySelector(".sensorDataValue");
            nameSection.textContent = sensor.name;
            valueSection.dataset.id = sensor.id;
            displayContainer.appendChild(row);
        });
        this._updateSensorDataDisplay();
    }
    _updateSensorDataDisplay() {
        const displayContainer = document.getElementById("sensorDataDisplayContainer");
        const timeSliderValue = document.getElementById("timeSelect").value;
        const time = window.store.timesShown[timeSliderValue];
        const dateTimeSelected = luxon_1.DateTime.fromISO(time);
        window.store.sensors.forEach((sensor) => {
            const timeData = sensor.data.find((d) => d.datetime.equals(dateTimeSelected));
            const field = displayContainer.querySelector(`.sensorDataValue[data-id="${sensor.id}"]`);
            if (field === null)
                return;
            field.textContent = timeData !== undefined ? timeData.value.toFixed(5).toString() : "- No Value";
        });
    }
    _toggleShowSensorData() {
        const displayContainer = document.getElementById("sensorDataDisplayContainer");
        displayContainer.hidden = !document.getElementById("showSensorData").checked;
    }
    _togglePlayback() {
        const icon = document.getElementById("playbackIcon");
        if (this._playbackInterval !== undefined) {
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");
            clearInterval(this._playbackInterval);
            this._playbackInterval = undefined;
            return;
        }
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
        this._playbackInterval = setInterval(() => {
            const el = document.getElementById("timeSelect");
            if (+el.value < +el.max) {
                el.value = (+el.value + (+el.step)).toString();
            }
            else {
                el.value = el.min;
            }
            this._handleTimeChange();
        }, 1000);
    }
    _generateFalseSensorData() {
        const hours = Array.from(Array(24).keys()).map((el) => el.toString().padStart(2, "0"));
        const minutes = ["00", "30"];
        const date = document.getElementById("date").value;
        window.store.timesShown = [];
        hours.forEach((hour) => {
            minutes.forEach((minute) => {
                window.store.timesShown.push(luxon_1.DateTime.fromISO(`${date}T${hour}:${minute}`));
            });
        });
        const slider = document.getElementById("timeSelect");
        slider.max = slider.value = (window.store.timesShown.length - 1).toString();
        document.getElementById("timeDisplay").innerText = window.store.timesShown[parseInt(slider.max) - 1].toLocaleString(luxon_1.DateTime.DATETIME_SHORT);
        ;
        window.store.sensors.forEach((sensor) => {
            sensor.data = [];
        });
        window.store.timesShown.forEach((time) => {
            // let tempVal = 0;
            window.store.sensors.forEach((sensor) => {
                sensor.data.push({ datetime: time, value: Math.random() * 100 });
                // sensor.data.push({ datetime: time, value: tempVal });
                // tempVal += 12;
            });
        });
        this._toggleShowSensorData();
        this._updateHeatmap();
    }
    _updateHeatmap() {
        this._updateSensorDataDisplay();
        if (this._environment.sensorLabelsVisible) {
            this._updateSensorLabels();
        }
        const timeSliderValue = document.getElementById("timeSelect").value;
        const time = window.store.timesShown[timeSliderValue];
        const dateTimeSelected = luxon_1.DateTime.fromISO(time);
        const textureOrderedSensors = window.store.sensors.map((s) => ({ ...s })).sort((a, b) => a.textureOrder - b.textureOrder);
        let textureData = [];
        textureOrderedSensors.map((s) => {
            const data = s.data.find((d) => d.datetime.equals(dateTimeSelected));
            try {
                textureData.push(...ValuesToHeatmap_1.default(0, 100, data !== undefined ? data.value : 0));
            }
            catch (e) {
                console.error(e);
            }
        });
        this._environment.deckMesh.material?.dispose();
        var texture = new BABYLON.RawTexture(new Uint8Array(textureData), 4, 2, BABYLON.Engine.TEXTUREFORMAT_RGB, this._scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        var heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
        heatmapMaterial.diffuseTexture = texture;
        heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        //var animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        this._environment.deckMesh.material = heatmapMaterial;
        this._adjustDeckHeatmapAlpha();
    }
    _adjustDeckHeatmapAlpha() {
        const show = document.getElementById("showHeatmap").checked ? 1 : 0;
        const alphaValue = parseFloat(document.getElementById("heatmapOpacity").value);
        this._environment.deckMesh.material.alpha = Math.min(show, alphaValue);
    }
    _initCamera() {
        this._universalCamera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 800, -1500), this._scene);
        this._universalCamera.setTarget(BABYLON.Vector3.Zero());
        this._universalCamera.keysLeft = [65, 37]; // A, Left
        this._universalCamera.keysRight = [68, 39]; // D, Right
        this._universalCamera.keysUp = [87, 38]; // W, Up
        this._universalCamera.keysDown = [83, 40]; // S, Down
        this._universalCamera.keysDownward = [81]; // Q
        this._universalCamera.keysUpward = [69]; // E
        this._universalCamera.speed = 10;
        this._universalCamera.attachControl(this._canvas);
    }
    _initInfoDisplay() {
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
//# sourceMappingURL=app.js.map