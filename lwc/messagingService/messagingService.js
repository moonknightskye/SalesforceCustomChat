import {
  generateAccessTokenForUnauthenticatedUser,
  createConversation,
  subscribeToMessageEvents,
  unsubscribeFromMessageEvents,
  sendMessage
} from "./messagingServiceHelper";

export default class MessagingService {
  constructor(scrtUrl, orgId, esDeveloperName, routingAttributes={}) {
    this.scrtUrl = scrtUrl;
    this.orgId = orgId;
    this.esDeveloperName = esDeveloperName;
    this.routingAttributes = routingAttributes;
    this.appName = "salesApp";
    this.clientVersion = "1.2.3";
  }

  async startConversation(messageHandlers) {
    // 認証
    this.accessToken = await generateAccessTokenForUnauthenticatedUser(
      this.scrtUrl,
      this.orgId,
      this.esDeveloperName,
      this.appName,
      this.clientVersion
    );

    // 会話を作成
    this.conversationId = await createConversation(
      this.scrtUrl,
      this.esDeveloperName,
      this.routingAttributes,
      this.accessToken
    );

    // メッセージを購読
    this.es = subscribeToMessageEvents(
      this.scrtUrl,
      this.accessToken,
      this.orgId,
      messageHandlers
    );
  }

  async stopConversation() {
    unsubscribeFromMessageEvents(this.es);
  }

  async sendMessage(message) {
    const messageId = await sendMessage(
      this.scrtUrl,
      this.conversationId,
      this.esDeveloperName,
      this.accessToken,
      message
    );
    return messageId;
  }
}
