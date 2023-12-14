import { LightningElement, track, wire } from 'lwc';
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

export default class CrmAnalyticsChatbot extends LightningElement {
    error;
    userId = Id;
    currentUserName;
    currentUserEmail;
    currentUserAlias;
    chatStartTime;

    @track chatTranscript = [];
    @track messageIndex = 0;
    @track showChat = false;
    @track dataset;
    @track datasetId;
    @track datasetVersionId;
    @track datasetVersion;

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
            let msg = 'The json below describes my dataset. Please summarize in a paragraph.' + JSON.stringify(this.datasetVersion);
            this.getAIResponse(msg);
        }
    }

    connectedCallback() {
        var date = new Date();
        this.chatStartTime = date.toLocaleTimeString();
        this.chatTranscript.push(this.addEvent("Please enter a question or prompt for ChatGPT"));
    }

    handleSend() {
        var message = this.template.querySelector("lightning-input[data-target=messageInput]").value;
        if(message) {
            //add message to chat transcript
            this.addMessageToChatTranscript(message, this.currentUserAlias, "inbound");

            //Send request to chatgpt
            //TODO: Adding typing message
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

    addTypingEvent(message) {
        var chatTypingEvent = {};
        chatTypingEvent.isMessage = false;
        chatTypingEvent.isEvent = false;
        chatTypingEvent.isTypingEvent = true;
        chatTypingEvent.messageAuthor = author;
        chatTypingEvent.messageDirection = direction;
        chatTypingEvent.messageKey = this.messageIndex;
        this.messageIndex++;
    }

    getAIResponse(message) {
        getResponseToPrompt({prompt: message})
            .then((result) => {
                console.log('result: ' + JSON.stringify(result));
                let msg = result. result.choices[0].message.content;
                // this.message = result;
                this.addMessageToChatTranscript(msg, ANALYTICS_BOT_USER_LABEL, "outbound");
                //TODO: Remove typing message
            }).catch((error) => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'ERROR!!!',
                    message: error.message,
                    variant: 'error'
                }));
                //TODO: Remove typing message
            })
    }

    handleSelectedDatasetChange(event) {
        this.dataset = event.detail.dataset;
        this.datasetId = event.detail.dataset.id;
        this.datasetVersionId = event.detail.dataset.currentVersionId;

        //Dataset Changed message
        this.showChat = true;
        let msg = 'Target dataset changed ' + event.detail.dataset.label;
        this.addMessageToChatTranscript(msg, ANALYTICS_BOT_USER_LABEL, "outbound");
    }
}