import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { WhatsAppConversationDto, WhatsAppMessageDto } from "@/models/whatsappCrm.model";
import { getAuthToken } from "@/utils/authSession.util";
import { environment } from "@/utils/environment";

export type WhatsAppRealtimeHandlers = {
  onConversationUpdated?: (conversation: WhatsAppConversationDto) => void;
  onMessageUpserted?: (payload: {
    message: WhatsAppMessageDto;
    conversation?: WhatsAppConversationDto | null;
  }) => void;
  onMessageStatusChanged?: (message: WhatsAppMessageDto) => void;
};

export type WhatsAppRealtimeState = "connecting" | "connected" | "disconnected" | "unavailable";

/**
 * Tenant-secure SignalR connection for WhatsApp Inbox.
 * Organisation group membership is assigned server-side from the JWT.
 */
export function useWhatsAppCrmRealtime(enabled: boolean, handlers: WhatsAppRealtimeHandlers) {
  const [connectionState, setConnectionState] = useState<WhatsAppRealtimeState>("disconnected");
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) {
      setConnectionState("disconnected");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setConnectionState("unavailable");
      return;
    }

    const base = (environment.baseurl || window.location.origin).replace(/\/+$/, "");
    const hubUrl = `${base}/hubs/whatsapp-crm`;

    let cancelled = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAuthToken(),
        // Query-string token also supported by the hub for WebSocket transports.
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("conversationUpdated", (conversation: WhatsAppConversationDto) => {
      handlersRef.current.onConversationUpdated?.(conversation);
    });
    connection.on(
      "messageUpserted",
      (payload: { message: WhatsAppMessageDto; conversation?: WhatsAppConversationDto | null }) => {
        handlersRef.current.onMessageUpserted?.(payload);
      },
    );
    connection.on("messageStatusChanged", (message: WhatsAppMessageDto) => {
      handlersRef.current.onMessageStatusChanged?.(message);
    });

    connection.onreconnecting(() => {
      if (!cancelled) setConnectionState("connecting");
    });
    connection.onreconnected(() => {
      if (!cancelled) setConnectionState("connected");
    });
    connection.onclose(() => {
      if (!cancelled) setConnectionState("disconnected");
    });

    setConnectionState("connecting");
    connection
      .start()
      .then(() => {
        if (!cancelled) setConnectionState("connected");
      })
      .catch((err) => {
        console.warn("WhatsApp CRM SignalR unavailable", err);
        if (!cancelled) setConnectionState("unavailable");
      });

    return () => {
      cancelled = true;
      connection.off("conversationUpdated");
      connection.off("messageUpserted");
      connection.off("messageStatusChanged");
      void connection.stop();
    };
  }, [enabled]);

  return { connectionState };
}
