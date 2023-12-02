public with sharing class AIConnectAPIService {
      @AuraEnabled
    public static String getPromptRes(String prompt){
        try {
            ConnectApi.EinsteinLlmGenerationsInput generationsInput = new ConnectApi.EinsteinLlmGenerationsInput();
            generationsInput.promptTextorId = prompt;
            generationsInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            generationsInput.additionalConfig.maxTokens = 512;

            // Call the service
            ConnectApi.EinsteinLLMGenerationsOutput generationsOutput = ConnectApi.EinsteinLLM.generateMessages(generationsInput);

            // Consume response
            ConnectApi.EinsteinLLMGenerationItemOutput response = generationsOutput.generations[0];
            System.debug('Response: ' + response.text);

            return response.text;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}