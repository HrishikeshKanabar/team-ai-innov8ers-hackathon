import { LightningElement, track, wire } from 'lwc';
import { getDatasetVersion } from "lightning/analyticsWaveApi";

//import for lightning messaging service
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import crmAnalyticsDatasetSelected from '@salesforce/messageChannel/crmAnalyticsDatasetSelected__c';

const dateColumns = [
    { label: 'Label', fieldName: 'label', type: 'text' },
    { label: 'Name', fieldName: 'name', type: 'text'},
    { label: 'Format', fieldName: 'format', type: 'text'}
];

const dimensionColumns = [
    { label: 'Label', fieldName: 'label', type: 'text'},
    { label: 'Name', fieldName: 'name', type: 'text'},
    { label: 'Field', fieldName: 'fieldName', type: 'text'}
];

const measureColumns = [
    { label: 'Label', fieldName: 'label', type: 'text'},
    { label: 'Name', fieldName: 'name', type: 'text'},
    { label: 'Field', fieldName: 'fieldName', type: 'text'},
    { label: 'Format', fieldName: 'format', type: 'text'}
];

export default class CrmAnalyticsDatasetDescribe extends LightningElement {
    subscription = null;
    datasetId;
    datasetVersionId;
    datasetVersion;
    @track datasetVersionDateFields = [];
    @track datasetVersionDimensions = [];
    @track datasetVersionMeasures = [];
    showAttributes = false;

    dateColumns = dateColumns;
    dimensionColumns = dimensionColumns;
    measureColumns = measureColumns;

    @wire(MessageContext)
    messageContext;

    @wire(getDatasetVersion, {
        datasetIdOrApiName: "$datasetId",
        versionId: "$datasetVersionId",
    })
    onGetDatasetVersion({data, error}) {
        if(error){
            this.dispatchEvent(new ShowToastEvent({
                title: 'ERROR!!!',
                message: error.message,
                variant: 'error'
            }));
        } else if (data) {
            this.datasetVersion = data;
            
            //extract dates
            for(let key in this.datasetVersion.xmdMain.dates) {
                const datefield = this.datasetVersion.xmdMain.dates[key];
                this.datasetVersionDateFields.push({
                    label: datefield.label,
                    name: datefield.description,
                    format: datefield.format
                });
            }
            console.log('this.datasetVersionDateFields: ' + JSON.stringify(this.datasetVersionDateFields));

            //extract dimensions
            for(let key in this.datasetVersion.xmdMain.dimensions) {
                const dimension = this.datasetVersion.xmdMain.dimensions[key];
                if(Object.hasOwn(dimension, 'fullyQualifiedName')){
                    this.datasetVersionDimensions.push({
                        label: dimension.label,
                        name: dimension.fullyQualifiedName,
                        fieldName: dimension.field
                    });
                }
            }
            console.log('this.datasetVersionDimensions: ' + JSON.stringify(this.datasetVersionDimensions));

            //extract measures
            for(let key in this.datasetVersion.xmdMain.measures) {
                const measure = this.datasetVersion.xmdMain.measures[key];
                if(Object.hasOwn(measure, 'fullyQualifiedName')){
                    this.datasetVersionMeasures.push({
                        label: measure.label,
                        name: measure.fullyQualifiedName,
                        fieldName: measure.field,
                        format: JSON.stringify(measure.format)
                    });
                }
            }
            console.log('this.datasetVersionMeasures: ' + JSON.stringify(this.datasetVersionMeasures));

            //show tables
            this.showAttributes = true;
        }
    }

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                crmAnalyticsDatasetSelected,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleMessage(message) {
        this.datasetId = message.datasetId;
        this.datasetVersionId = message.datasetVersionId;
    }
}