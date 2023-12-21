import { api, LightningElement, track } from 'lwc';

export default class ChatMessage extends LightningElement {
    @api message;
    @api messageDirection;
    @api messageAuthor;

    @track authorLabel;

    connectedCallback() {
        
    }

    renderedCallback() {
        //set direction
        var listItemClass = this.messageDirection == "inbound" ? 
            "slds-chat-listitem_inbound" : "slds-chat-listitem_outbound";
        var messageClass = this.messageDirection == "inbound" ? 
            "slds-chat-message__text_inbound" : "slds-chat-message__text_outbound";
        
        //add to markup
        var listItem = this.refs.messageListItem;
        var messageDiv = this.refs.messageBody;
        listItem.className = listItem.className + " " + listItemClass;
        messageDiv.className = messageDiv.className + " " + messageClass;

        //add author label
        var date = new Date();
        this.authorLabel = this.messageAuthor + " • " + date.toLocaleTimeString();

        // console.log('message: ' + this.message);
        // console.log('messageAuthor: ' + this.authorLabel);
    }
}