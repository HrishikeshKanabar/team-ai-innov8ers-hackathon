import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';

//import getPromptRes from '@salesforce/apex/AIConnectAPIService.getPromptRes';
import getResponseToPrompt from '@salesforce/apex/OpenAIAPIService.getResponseToPrompt';

import Id from '@salesforce/user/Id';
import UserNameFIELD from '@salesforce/schema/User.Name';
import UserIsActiveFIELD from '@salesforce/schema/User.IsActive';
import UserAliasFIELD from '@salesforce/schema/User.Alias';

export default class SimpleChatGptChat extends LightningElement {
    error;
    userId = Id;
    currentUserName;
    currentUserEmail;
    currentUserAlias;
    chatStartTime;

    @track chatTranscript = [];
    @track messageIndex = 0;

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
            getPromptRes({prompt: message})
            .then((result) => {
                this.message = result.choices[0].message.content;
                // this.message = result;
                this.addMessageToChatTranscript(message, "ChatGPT", "outbound");
                //TODO: Remove typing message
            }).catch((error) => {
                console.log('Error: ' + JSON.stringify(error));
                this.dispatchEvent(new ShowToastEvent({
                    title: 'ERROR!!!',
                    message: error.message,
                    variant: 'error'
                }));
                //TODO: Remove typing message
            })

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
}