import { LightningElement, wire } from "lwc";
import { getDatasets } from "lightning/analyticsWaveApi";

export default class AnalyticsDatasetSelector extends LightningElement {
    _datasets;
    selectedDatasetId;

    get datasetOptions() {
        //console.log(JSON.stringify(this._datasetOptions));
        return this._datasets
    }

    @wire(getDatasets, {
        licenseType: "EinsteinAnalytics",
    })
    onGetDatasets({ data, error }) {
        if (error) {
          //console.log("getDatasets ERROR:", error);
        } else if (data) {
          //console.log("getDatasets RESPONSE:", JSON.stringify(data.datasets));
          this._datasets = [];
          for(let dataset of data.datasets) {
            this._datasets.push({label: dataset.label, value: dataset.id});
          }
        }
    }

    handleDatasetChange(event) {
        console.log('event.detail.value: ' + event.detail.value);
        this.selectedDatasetId = event.detail.value;
        this.dispatchEvent(new CustomEvent("datasetSelectedChange", {detail: this._selectedDatasetId}));
    }
}