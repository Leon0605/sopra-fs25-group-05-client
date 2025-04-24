"use client";

import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

type Notification = {
  type: "message" | "friend_request";
  content: string;
  userId: number;
};

interface Message {
  messageId: string;
  chatId: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage: string;
  timestamp: string;
}

// type CustomWebsocketContextType = {
//   notifications: Notification[];
//   onlineUsers: string[];
//   sendMessage: (message: string) => void;
//   readyState: ReadyState;
// };

export const useCustomWebsocket = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]); 
  const [chatIds, setChatIds] = useState<string[]>([]); // Store all chat IDs for the user
  const apiService = useApi();
  const router = useRouter();

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
    setNotifications((prev) => [...prev, { type: "message", content: message.content, userId: message.userId }]);
  };

  const fetchRequests = async () => {   
    try {
      const userId = localStorage.getItem("userId");
      if (userId === null) return;

      // Fetch incoming friend requests
      const incomingData = await apiService.get<User[]>(`/users/${userId}/friend-request`);

      setIncomingRequests(incomingData);
    } catch (err) {
      console.error("Error fetching friend requests", err);
    } 
  };

  const fetchChatIds = async () => {
    const userId = localStorage.getItem("userId"); // Retrieve the userId from localStorage or another secure location
    if (!userId) {
        console.error("User ID is missing");
        return;
    }

    try {
      const response = await fetch("http://localhost:8080/chats", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "userId": userId, // Include the userId in the request header
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.statusText}`);
    }

    const data = await response.json();
    const ids = data.map((chat: { chatId: string }) => chat.chatId);
    console.log("Fetched chat IDs:", data); // Log the fetched data to the console
    setChatIds(ids); // Assume the API returns an array of UserChatDTO objects
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (chatIds: string[]) => {
    console.log("Fetching messages for chat IDs:", chatIds);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing");
        return;
      }
  
      const allMessages: Message[] = []; // Array to store all messages across chats
  
      for (const chatId of chatIds) {
        // Fetch messages for each chat ID
        const fetchedMessages: Message[] = await apiService.get<Message[]>(`/chats/${chatId}/${token}`);
        console.log(`Fetched messages for chat ID ${chatId}:`, fetchedMessages);
  
        // Add the fetched messages to the allMessages array
        allMessages.push(...fetchedMessages);
      }
  
      // Update the state with all the messages
      setMessages(allMessages);
      console.log("All fetched messages:", allMessages);
    } catch (error: any) {
      console.error("Failed to fetch messages:", error);
      if (error.response && error.response.status === 404) {
        alert("Chat not found. Redirecting to the main page...");
        router.push("/main");
      }
    }
  };

  useEffect(() => {
    fetchChatIds();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (chatIds.length > 0) {
      fetchMessages(chatIds);
    }
  }, [chatIds]);

  useEffect(() => {
    if (lastMessage !== null) {
      // Handle incoming WebSocket messages
      handleIncomingMessage(lastMessage.data);
    }
  }, [lastMessage]);

  return {
    messages,
    onlineUsers,
    incomingRequests,
    sendMessage,
    readyState,
  };
};