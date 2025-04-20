"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

type Notification = {
  type: "message" | "friend_request";
  content: string;
  fromUserId: string;
};

type CustomWebsocketContextType = {
  notifications: Notification[];
  onlineUsers: string[];
  sendMessage: (message: string) => void;
  readyState: ReadyState;
};

const CustomWebsocketContext = createContext<CustomWebsocketContextType | undefined>(undefined);

export const useCustomWebsocket = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chatIds, setChatIds] = useState<string[]>([]); // Store all chat IDs for the user

  // Use react-use-websocket to manage the WebSocket connection
  const { sendMessage, lastMessage, readyState } = useWebSocket("ws://localhost:8080/ws", {
    onOpen: () => console.log("WebSocket connection opened"),
    onClose: () => console.log("WebSocket connection closed"),
    shouldReconnect: () => true, // Automatically reconnect on disconnection
  });

  const handleIncomingMessage = (messageBody: string) => {
    const message = JSON.parse(messageBody);
    console.log("New message received:", message);

    // Handle the message (e.g., update state or notify the user)
    setNotifications((prev) => [...prev, { type: "message", content: message.content, fromUserId: message.userId }]);
  };

  useEffect(() => {
    // Fetch chat IDs for the logged-in user
    const fetchChatIds = async () => {
      const response = await fetch("/api/user/chats"); // Replace with your API endpoint
      const data = await response.json();
      setChatIds(data.chatIds); // Assume the API returns an array of chat IDs
    };

    fetchChatIds();
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      // Handle incoming WebSocket messages
      handleIncomingMessage(lastMessage.data);
    }
  }, [lastMessage]);

  return {
    notifications,
    onlineUsers,
    sendMessage,
    readyState,
  };
};