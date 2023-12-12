import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getDatasets } from "lightning/analyticsWaveApi";

const columns = [
    {   label: 'Name', fieldName: 'url', type: 'url',
        typeAttributes: {label: { fieldName: 'label'}, target: '_blank'}, sortable: true},
    { label: 'Folder', fieldName: 'folder.url', type: 'url',
        typeAttributes: {label: { fieldName: 'folder.label'}, target: '_blank'}, sortable: true},
    { label: 'Description', fieldName: 'description', type: 'text' },
    { label: 'Refresh Date', fieldName: 'dataRefreshDate', type: 'datetime' },
];

export default class CrmAnalyticsDatasetTable extends LightningElement {
    _datasets;
    columns = columns;

    get data() {
        return this._datasets;
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
            this._datasets = [];
            for(let dataset of data.datasets) {
                this._datasets.push(this.flatten(dataset));
            }
            console.log("datasets: " + JSON.stringify(this._datasets));
        }
    }

    flatten(data) {
        var result = {};
        function recurse (cur, prop) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for(var i=0, l=cur.length; i<l; i++)
                    recurse(cur[i], prop + "[" + i + "]");
                if (l == 0)
                    result[prop] = [];
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop+"."+p : p);
                }
                if (isEmpty && prop)
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    }
}