import { LightningElement, api, wire } from 'lwc';
import { getDataset } from "lightning/analyticsWaveApi";

export default class CrmAnalyticsDatasetInfo extends LightningElement {
    @api recordId;
    dataset;

    @wire(getDataset, {
        datasetIdOrApiName: "$recordId"
    })
    onGetDataset({ data, error }) {
        if(error){
            this.dispatchEvent(new ShowToastEvent({
                title: 'ERROR!!!',
                message: error.message,
                variant: 'error'
            }));
        } else if (data) {
            this.dataset = data;
            console.log("this.dataset: " + JSON.stringify(this.dataset));
        }
    }

    get showDataset() {
        return this.dataset !== undefined;
    }

    get label() {
        return this.dataset.label;
    }

    get description() {
        return this.dataset.description;
    }

    get dataRefreshDate() {
        return this.dataset.dataRefreshDate;
    }

    get currentVersionTotalRowCount() {
        return this.dataset.currentVersionTotalRowCount;
    }
}