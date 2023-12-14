public with sharing class OpenAIAPIService {
    static OpenAI_API_Setting__mdt openAISetting = OpenAI_API_Setting__mdt.getInstance('Chat_Completions_V1');

    @AuraEnabled
    public static Response getResponseToPrompt(String prompt){
        //Create Request
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:OpenAIAPI' + openAISetting.Endpoint__c);
        req.setMethod('POST');
        //req.setBody('{messages: [{role: "user", content: "' + prompt + '"}], model: "gpt-3.5-turbo"}');
        Message msg = new Message('user', prompt);
        Request reqPayload = new Request(new List<Message>{msg}, openAISetting.Model__c);
        req.setBody(JSON.serialize(reqPayload));

        //Send request
        HTTPResponse res = new Http().send(req);
        String respString = res.getBody();
        respString.replace('object', 'object_x');
        return (Response) JSON.deserialize(res.getBody(), Response.class);
    }

    public class Request {
        public List<Message> messages;
        String model;

        public Request(List<Message> messages, String model) {
            this.messages = messages;
            this.model = model;
        }
    }

    public class Message {
        @AuraEnabled
        public String role {get; set;}
        @AuraEnabled
        public String content {get; set;}

        public Message(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }

    public class Response {
        @AuraEnabled
        public String id {get; set;}
        @AuraEnabled
        public String object_x {get; set;}
        @AuraEnabled
        public String created {get; set;}
        @AuraEnabled
        public String model {get; set;}
        @AuraEnabled
        public List<Choice> choices {get; set;}
        @AuraEnabled
        public Usage usage {get; set;}
    }

    public class Choice {
        @AuraEnabled
        public Integer index {get; set;}
        @AuraEnabled
        public Message message {get; set;}
        @AuraEnabled
        public String finish_reason {get; set;}
    }

    public class Usage {
        @AuraEnabled
        public Integer prompt_tokens {get; set;}
        @AuraEnabled
        public Integer completion_tokens {get; set;}
        @AuraEnabled
        public Integer total_tokens {get; set;}
    }
}