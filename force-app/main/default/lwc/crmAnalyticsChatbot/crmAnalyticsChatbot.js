import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import { getDatasetVersion } from "lightning/analyticsWaveApi";

// import getPromptRes from '@salesforce/apex/AIConnectAPIService.getPromptRes';
import getResponseToPrompt from '@salesforce/apex/OpenAIAPIService.getResponseToPrompt';

import Id from '@salesforce/user/Id';
import UserNameFIELD from '@salesforce/schema/User.Name';
import UserIsActiveFIELD from '@salesforce/schema/User.IsActive';
import UserAliasFIELD from '@salesforce/schema/User.Alias';

const ANALYTICS_BOT_USER_LABEL = 'CRM Analytics Bot';

export default class CrmAnalyticsChatbot extends NavigationMixin(LightningElement) {
    error;
    userId = Id;
    currentUserName;
    currentUserEmail;
    currentUserAlias;
    chatStartTime;

    @track chatTranscript = [];
    @track messageIndex = 0;
    @track showChat = false;
    @track showTyping = false;
    @track typingAuthor = "";
    @track typingDirection = "";
    @track dataset;
    @track datasetId;
    @track datasetVersionId;
    @track datasetVersion;
    @track activeAICallouts = 0;
    @track datasetMetadata;
    @track initialInsightsActionDisplayed = false;
    @track saqlQueryMap = new Map();

    @wire(getRecord, {recordId: Id, fields: [UserNameFIELD, UserAliasFIELD, UserIsActiveFIELD]})
    currentUserInfo({error, data}) {
        if(data) {
            this.currentUserName = data.fields.Name.value;
            this.currentIsActive = data.fields.IsActive.value;
            this.currentUserAlias = data.fields.Alias.value;
        } else if (error) {
            this.error = error;
        }
    }

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
            this.groundAIWithDatasetVersion(this.dataset, this.datasetVersion);
        }
    }

    connectedCallback() {
        var date = new Date();
        this.chatStartTime = date.toLocaleTimeString();
    }

    handleSend() {
        var message = this.template.querySelector("lightning-input[data-target=messageInput]").value;
        if(message) {
            //add message to chat transcript
            this.addMessageToChatTranscript(message, this.currentUserAlias, "inbound");

            //Send request to chatgpt
            this.getAIResponse(message);

            //empty input field
            this.template.querySelector("lightning-input[data-target=messageInput]").value = "";
        }
    }

    addMessageToChatTranscript(message, user, direction){
        var tempArray = this.chatTranscript;
        this.chatTranscript = [];
        tempArray.push(this.addMessage(message, user, direction));
        tempArray.forEach(element => {
            this.chatTranscript.push(element);
        });
    }

    addMessage(message, author, direction) {
        var chatMessage = {};
        chatMessage.isMessage = true;
        chatMessage.message = message;
        chatMessage.messageAuthor = author;
        chatMessage.messageDirection = direction;
        chatMessage.messageKey = this.messageIndex;
        this.messageIndex++;
        return chatMessage;
    }

    addEvent(message) {
        var chatEvent = {};
        chatEvent.isMessage = false;
        chatEvent.isEvent = true;
        chatEvent.message = message;
        chatEvent.messageKey = this.messageIndex;
        this.messageIndex++;
        return chatEvent;
    }

    addActionButton(label, author, direction) {
        var chatActionButton = {};
        chatActionButton.isMessage = false;
        chatActionButton.isAction = true;
        chatActionButton.label = label;
        chatActionButton.author = author;
        chatActionButton.direction = direction;
        chatActionButton.action = label
        chatActionButton.messageKey = this.messageIndex;
        this.messageIndex++;
        return chatActionButton;
    }

    showTypingOnChatTranscript(author, direction) {
        this.showTyping = true;
        this.typingAuthor = author;
        this.typingDirection = direction;
    }

    clearTypingOnChatTranscript() {
        this.showTyping = false;
        this.typingAuthor = "";
        this.typingDirection = "";
    }

    getAIResponse(message) {
        this.showTypingOnChatTranscript(ANALYTICS_BOT_USER_LABEL, "outbound");
        this.activeAICallouts++;
        getResponseToPrompt({prompt: message})
            .then((result) => {
                let msg = result.choices[0].message.content;
                
                this.addMessageToChatTranscript(msg, ANALYTICS_BOT_USER_LABEL, "outbound");
                
                //clear typing if active callouts over
                this.activeAICallouts--;
                if(this.activeAICallouts <= 0) {
                    this.activeAICallouts = 0;
                    if(!this.initialInsightsActionDisplayed){
                        this.chatTranscript.push(this.addActionButton("Get Insights on " + this.dataset.label, ANALYTICS_BOT_USER_LABEL, "outbound"));
                        this.initialInsightsActionDisplayed = true;
                    }
                    this.clearTypingOnChatTranscript();
                }
            }).catch((error) => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'ERROR!!!',
                    message: error.message,
                    variant: 'error'
                }));
                this.clearTypingOnChatTranscript();
            });
    }

    getAISAQLResponse(message) {
        this.showTypingOnChatTranscript(ANALYTICS_BOT_USER_LABEL, "outbound");
        this.activeAICallouts++;
        getResponseToPrompt({prompt: message})
            .then((result) => {
                let response = result.choices[0].message.content;

                //extract SAQL insights
                let saqlRecs = Array.from(response.matchAll(/[0-9]{1}[.](.*?):/g));
                let saqlQueries = Array.from(response.matchAll(/```(.|\n)*?```/g));
                for(let i=0; i < saqlRecs.length; i++) {
                    let saqlRec = saqlRecs[i];
                    let saqlQuery = saqlQueries[i];
                    this.saqlQueryMap.set(saqlRec[1], saqlQuery[0].replaceAll("```", ""));
                    console.log("saqlQueryMap: " + this.saqlQueryMap.get(saqlRec[1]));
                    this.chatTranscript.push(this.addActionButton(saqlRec[1], ANALYTICS_BOT_USER_LABEL, "outbound"));
                }
            })
    }

    handleSelectedDatasetChange(event) {
        this.dataset = event.detail.dataset;
        this.datasetId = event.detail.dataset.id;
        this.datasetVersionId = event.detail.dataset.currentVersionId;

        //Dataset Changed message
        this.showChat = true;
        let msg = 'Target dataset changed ' + event.detail.dataset.label;
        this.chatTranscript.push(this.addEvent(msg));
    }

    handleChatAction(event) {
        let action = event.detail.action;

        if(action === "Get Insights on " + this.dataset.label) {
            let prompt = JSON.stringify(this.datasetMetadata) + 
            "\nThe json above describes a dataset from CRM Analytics. Please provide top 5 saql queries I can run on the above dataset.";
            this.getAISAQLResponse(prompt);
        } else {
            this.clearTypingOnChatTranscript();
            navigator.clipboard.writeText(this.saqlQueryMap.get(action));
            let redirectUrl = "https://crmanalyticstrialcom-dev-ed.develop.lightning.force.com/analytics/lens/new1/dataset/" + this.datasetId + "?mode=fullPage&referrer=data_manager";
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: redirectUrl
                },
            });
        }
        
    }

    groundAIWithDatasetVersion(dataset, datasetVersion) {
        //ground with dataset metadata
        this.datasetMetadata = {
            id: dataset.id,
            label: dataset.label,
            name: dataset.name,
            type: dataset.type,
            url: dataset.url
        };

        //extract dates
        let dateFields = [];
        for(let key in datasetVersion.xmdMain.dates) {
            const datefield = this.datasetVersion.xmdMain.dates[key];
            dateFields.push({
                label: datefield.label,
                name: datefield.description,
                format: datefield.format
            });
        }
        this.datasetMetadata.dateFields = dateFields;
        // console.log('this.datasetVersionDateFields: ' + JSON.stringify(this.datasetVersionDateFields));

        //extract dimensions
        let dimensionFields = [];
        for(let key in datasetVersion.xmdMain.dimensions) {
            const dimension = this.datasetVersion.xmdMain.dimensions[key];
            if(Object.hasOwn(dimension, 'fullyQualifiedName')){
                dimensionFields.push({
                    label: dimension.label,
                    name: dimension.fullyQualifiedName,
                    fieldName: dimension.field
                });
            }
        }
        this.datasetMetadata.dimensionFields = dimensionFields;
        // console.log('this.datasetVersionDimensions: ' + JSON.stringify(this.datasetVersionDimensions));

        //extract measures
        let measureFields = [];
        for(let key in datasetVersion.xmdMain.measures) {
            const measure = this.datasetVersion.xmdMain.measures[key];
            if(Object.hasOwn(measure, 'fullyQualifiedName')){
                measureFields.push({
                    label: measure.label,
                    name: measure.fullyQualifiedName,
                    fieldName: measure.field,
                    format: JSON.stringify(measure.format)
                });
            }
        }
        // console.log('this.datasetVersionMeasures: ' + JSON.stringify(this.datasetVersionMeasures));
        this.datasetMetadata.measureFields = measureFields;

        //Send consume prompt
        let consumePrompt = JSON.stringify(this.datasetMetadata) + 
            "\nThe json above describes a dataset from CRM Analytics. Please consume it for future prompts. Please reply saying you have consumed the dataset by {label} and ready to provide further insights.";
        this.getAIResponse(consumePrompt);

        //Send 5 top saql prompt
        // let saqlPrompt = "Please give me 5 top saql queries I can perform on the above dataset schema";
        // this.getAIResponse(saqlPrompt);
    }
}