import { api, track, LightningElement } from 'lwc';

export default class ChatTyping extends LightningElement {
    @api author;
    @api direction;

    @track authorLabel;

    connectedCallback() {
        
    }

    renderedCallback() {
        //set direction
        var listItemClass = this.direction == "inbound" ? 
            "slds-chat-message__text_inbound" : "slds-chat-listitem_outbound";
        var messageClass = this.direction == "inbound" ? 
            "slds-chat-message__text_inbound" : "slds-chat-listitem_outbound";
        
        //add to markup
        var listItem = this.refs.messageListItem;
        var messageDiv = this.refs.messageBody;
        listItem.className = listItem.className + " " + listItemClass;
        messageDiv.className = messageDiv.className + " " + messageClass;

        //Set Author Label
        this.authorLabel = this.author + ' is typing ...';
    }
}