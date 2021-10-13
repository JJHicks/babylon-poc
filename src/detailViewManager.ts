import _accelerometers from "./data/accelerometers.json";
import _halfBridges from "./data/halfBridges.json";
import _quarterBridges from "./data/quarterBridges.json";
import _rosettes from "./data/rosettes.json";
import _thermistors from "./data/thermistors.json";
import _weathers from "./data/weathers.json";
import { SensorMetadata } from "./interfaces/sensorMetadata";
import { TimeDataSet } from "./interfaces/store";
import { TimeChartDataPoint, TimeGraph } from "./timeGraph";

export class DetailsViewManager {

    private _timeGraph?: TimeGraph;

    constructor() {

        this._fillSensorOptions();

        this._timeGraph = new TimeGraph(480, 300);

    }

    public updateGraph(id: string) {
        let data: TimeChartDataPoint[] = [];
        
        window.store.timeData.forEach((d: TimeDataSet) => {
            const point = d.data.find(s => s.id === id);
            if(point){
                data.push({
                    date: d.time.toJSDate(),
                    value: point.value
                }); 
            }
        });

        document.getElementById("detailViewChartIdDisplay").innerText = id;
        
        this._timeGraph.updateData(data);
    }

    private _fillSensorOptions() {

        const template = document.getElementById("sensorDetailOptionTemplate") as HTMLTemplateElement;

        const sensors: {
            [index: string]: SensorMetadata[]
        } = {
            accelerometersList: _accelerometers as SensorMetadata[],
            halfBridgeList: _halfBridges as SensorMetadata[],
            quarterBridgeList: _quarterBridges as SensorMetadata[],
            rosetteList: _rosettes as SensorMetadata[]
        };

        ["accelerometersList", "halfBridgeList", "quarterBridgeList", "rosetteList"].forEach(listName => {
            const container = document.getElementById(listName);

            sensors[listName].forEach(sensor => {
                const option = document.createElement('a') as HTMLAnchorElement;
                option.href = "#";
                option.classList.add(...["list-group-item", "d-inline-block", "text-truncate", "sensor-detail-option"]);
                option.dataset.bsParent = "#detailsSidebar";
                option.dataset.id = sensor.id;
                option.innerText = sensor.id;
                container.insertAdjacentElement("beforeend", option);
            });
        });
    }
}