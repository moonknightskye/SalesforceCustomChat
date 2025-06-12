public with sharing class AnalyzeConversation {

    public static Boolean serializeStringToJSON(String inputString, Integer threshold) {
        Map<String, Object> result = new Map<String, Object>();
        List<Object> conversations;
        Integer counter = 0;
        try {
            result = (Map<String, Object>) JSON.deserializeUntyped(inputString);
            conversations = (List<Object>) result.get('conversation');
            System.debug( conversations );
            System.debug( conversations.size() );
            if(  conversations.size() >= threshold ) {
                return true;
            }
            return false;
        } catch (Exception e) {
            System.debug('Error serializing string to JSON: ' + e.getMessage());
            return false;
        }
    }

    @InvocableMethod(label='Analyze Conversation' description='Analyzes the conversation and decides if the conversation should be forwarded to a Live agent')
    public static List<Response> analyzeConversation(List<Request> requests) {
        List<Response> responses = new List<Response>();
        for(Request req: requests) {
            Response response = new Response();
            response.result = AnalyzeConversation.serializeStringToJSON(req.conversation, req.threshold);
            responses.add( response );
       }
       return responses;
    }

    public class Request {
        @InvocableVariable(required=true)
        public String conversation;

        @InvocableVariable(required=true)
        public Integer threshold;
    }

    public class Response {
        @InvocableVariable
        public Boolean result;
    }
}