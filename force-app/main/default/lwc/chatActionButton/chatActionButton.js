import { LightningElement, api, track } from 'lwc';

export default class ChatActionButton extends LightningElement {
    @api author;
    @api direction;
    @api label;
    @api action;

    @track authorLabel;

    renderedCallback() {
        //set direction
        var listItemClass = this.direction == "inbound" ? 
            "slds-chat-listitem_inbound" : "slds-chat-listitem_outbound";
        
        //add to markup
        var listItem = this.refs.messageListItem;
        listItem.className = listItem.className + " " + listItemClass;

        //add author label
        var date = new Date();
        this.authorLabel = this.author + " • " + date.toLocaleTimeString();

        // console.log('message: ' + this.message);
        // console.log('messageAuthor: ' + this.authorLabel);
    }

    handleClick(event) {
        this.dispatchEvent(new CustomEvent("chataction", { bubbles:true, detail: {action: this.action}}));
    }
}