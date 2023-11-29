public with sharing class EinsteinGenerativeGatewayService {
    static Generative_AI_API_Setting__mdt apiSetting = Generative_AI_API_Setting__mdt.getInstance('Einstein_Generative_Gateway_Completions');

    @AuraEnabled
    public static void getResponseToPrompt(String prompt){
        //Create Request
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:EinsteinGenerativeGateway' + apiSetting.Endpoint__c);
        req.setMethod('POST');
        Request reqPayload = new Request(prompt, apiSetting.Temperature__c, (Integer) apiSetting.Max_Tokens__c);
        req.setBody(JSON.serialize(reqPayload));

        //Send request
        HTTPResponse res = new Http().send(req);
        System.debug('Response: ' + res.getBody());
    }

    public class Request {
        public String prompt;
        public Decimal temperature;
        public Integer max_tokens;

        public Request(String prompt, Decimal temperature, Integer max_tokens) {
            this.prompt = prompt;
            this.temperature = temperature;
            this.max_tokens = max_tokens;
        }
    }

    // public class Request {
    //     public List<Message> messages;
    //     String model;

    //     public Request(List<Message> messages, String model) {
    //         this.messages = messages;
    //         this.model = model;
    //     }
    // }

    // public class Message {
    //     @AuraEnabled
    //     public String role {get; set;}
    //     @AuraEnabled
    //     public String content {get; set;}

    //     public Message(String role, String content) {
    //         this.role = role;
    //         this.content = content;
    //     }
    // }

    // public class Response {
    //     @AuraEnabled
    //     public String id {get; set;}
    //     @AuraEnabled
    //     public String object_x {get; set;}
    //     @AuraEnabled
    //     public String created {get; set;}
    //     @AuraEnabled
    //     public String model {get; set;}
    //     @AuraEnabled
    //     public List<Choice> choices {get; set;}
    //     @AuraEnabled
    //     public Usage usage {get; set;}
    // }

    // public class Choice {
    //     @AuraEnabled
    //     public Integer index {get; set;}
    //     @AuraEnabled
    //     public Message message {get; set;}
    //     @AuraEnabled
    //     public String finish_reason {get; set;}
    // }

    // public class Usage {
    //     @AuraEnabled
    //     public Integer prompt_tokens {get; set;}
    //     @AuraEnabled
    //     public Integer completion_tokens {get; set;}
    //     @AuraEnabled
    //     public Integer total_tokens {get; set;}
    // }
}