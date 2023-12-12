import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getDatasets } from "lightning/analyticsWaveApi";

//Message service imports
import { publish, MessageContext } from 'lightning/messageService';
import crmAnalyticsDatasetSelected from '@salesforce/messageChannel/crmAnalyticsDatasetSelected__c';

export default class AnalyticsDatasetSelector extends LightningElement {
    _datasets;
    _datasetOptions;
    selectedDatasetId;

    @wire(MessageContext)
    messageContext

    get datasetOptions() {
        //console.log(JSON.stringify(this._datasetOptions));
        return this._datasetOptions;
    }

    @wire(getDatasets, {
        licenseType: "EinsteinAnalytics",
    })
    onGetDatasets({ data, error }) {
        if (error) {
          const evt = new ShowToastEvent({
            title: "Error",
            message: error.message,
            variant: "error",
          });
          this.dispatchEvent(evt);
        } else if (data) {
          this._datasets = data.datasets;
          this._datasetOptions = [];
          for(let dataset of data.datasets) {
            this._datasetOptions.push({label: dataset.label, value: dataset.id});
          }
        }
    }

    handleDatasetChange(event) {
        //event for parent
        this.selectedDatasetId = event.detail.value;
        let selectedDataset = this._datasets.find(x => x.id === this.selectedDatasetId);
        this.dispatchEvent(new CustomEvent("selecteddatasetchange", { bubbles:true, detail: {dataset: selectedDataset}}));

        //send to lightning message channel
        const payload = {datasetId: selectedDataset.id, datasetVersionId: selectedDataset.currentVersionId};
        publish(this.messageContext, crmAnalyticsDatasetSelected, payload);
    }
}