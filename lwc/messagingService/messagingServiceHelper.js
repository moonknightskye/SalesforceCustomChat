import { createEventSource } from "./eventsource-client.js";

export async function generateAccessTokenForUnauthenticatedUser(
  scrtUrl,
  orgId,
  esDeveloperName,
  appName,
  clientVersion
) {
  try {
    const result = await fetch(
      `https://${scrtUrl}/iamessage/api/v2/authorization/unauthenticated/access-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orgId: orgId,
          esDeveloperName: esDeveloperName,
          capabilitiesVersion: "1",
          platform: "Web",
          context: {
            appName: appName,
            clientVersion: clientVersion
          }
        })
      }
    );

    if (!result.ok) {
      throw new Error(
        "Failed to generate access token for unauthenticated user"
      );
    }

    const data = await result.json();
    return data.accessToken;
  } catch (error) {
    console.error(
      "Failed to generate access token for unauthenticated user",
      error
    );
    throw error;
  }
}

export async function createConversation(scrtUrl, esDeveloperName, routingAttributes, token) {
  const conversationId = window.crypto.randomUUID();

  try {
    const result = await fetch(
      `https://${scrtUrl}/iamessage/api/v2/conversation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: conversationId,
          routingAttributes: routingAttributes,
          esDeveloperName: esDeveloperName
        })
      }
    );

    if (!result.ok) {
      throw new Error("Failed to create conversation");
    }

    //const data = await result.json();
    return conversationId;
  } catch (error) {
    console.error("Failed to create conversation", error);
    throw error;
  }
}

export async function sendMessage(
  scrtUrl,
  conversationId,
  esDeveloperName,
  token,
  text
) {
  try {
    const messageId = window.crypto.randomUUID();

    const result = await fetch(
      `https://${scrtUrl}/iamessage/api/v2/conversation/${conversationId}/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: {
            id: messageId,
            messageType: "StaticContentMessage",
            staticContent: {
              formatType: "Text",
              text: text
            }
          },
          esDeveloperName: esDeveloperName
        })
      }
    );

    if (!result.ok) {
      throw new Error("Failed to send message");
    }

    return messageId;
  } catch (error) {
    console.error("Failed to send message", error);
    throw error;
  }
}

export function subscribeToMessageEvents(
  scrtUrl,
  accessToken,
  orgId,
  messageHandlers
) {
  return createEventSource({
    url: `https://${scrtUrl}/eventrouter/v1/sse`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Org-Id": orgId
    },
    onMessage: ({ data, event, id }) => {
      if (event && messageHandlers[event]) {
        const parsedData = JSON.parse(data);
        //console.log("parsedData", parsedData);
        const parsedPayload = JSON.parse(
          parsedData.conversationEntry.entryPayload
        );
        messageHandlers[event]({
          payload: parsedPayload,
          sender: parsedData.conversationEntry.sender
        });
      } else if (event !== "ping") {
        console.log(`Unhandled event: ${event}`);
      }
    }
  });
}

export function unsubscribeFromMessageEvents(es) {
  es.close();
}
