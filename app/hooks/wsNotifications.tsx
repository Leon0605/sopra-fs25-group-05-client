"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";

type Notification = {
  type: "message" | "friend_request";
  content: string;
  fromUserId: string;
};

type StompContextType = {
  stompClient: Client | null;
  notifications: Notification[];
  onlineUsers: string[];
};

const StompContext = createContext<StompContextType | undefined>(undefined);

export const StompProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Initialize STOMP client
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws", // Replace with your WebSocket URL
      debug: (str) => console.log(str),
      reconnectDelay: 5000, // Reconnect after 5 seconds if disconnected
      onConnect: () => {
        console.log("Connected to STOMP server");

        // Subscribe to notifications
        client.subscribe("/topic/notifications", (message: IMessage) => {
          const notification: Notification = JSON.parse(message.body);
          setNotifications((prev) => [notification, ...prev]);
        });

        // Subscribe to online users
        client.subscribe("/topic/online-users", (message: IMessage) => {
          const userIds: string[] = JSON.parse(message.body);
          setOnlineUsers(userIds);
        });
      },
      onDisconnect: () => {
        console.log("Disconnected from STOMP server");
      },
    });

    client.activate();
    stompClientRef.current = client;
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  return (
    <StompContext.Provider value={{ stompClient, notifications, onlineUsers }}>
      {children}
    </StompContext.Provider>
  );
};

export const useStomp = () => {
  const context = useContext(StompContext);
  if (!context) {
    throw new Error("useStomp must be used within a StompProvider");
  }
  return context;
};