"use client";

import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

interface Message {
  messageId?: string;
  chatId?: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage?: string | null;
  timestamp?: string;
}

// type CustomWebsocketContextType = {
//   notifications: Notification[];
//   onlineUsers: string[];
//   sendMessage: (message: string) => void;
//   readyState: ReadyState;
// };

export const useCustomWebsocket = () => {
  const [onlineUsers] = useState<string[]>([]); // add set onlineUsers in Milestone 4 for live updates
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]); 
  const [chatIds, setChatIds] = useState<string[]>([]); // Store all chat IDs for the user
  const apiService = useApi();
  const router = useRouter();

  // Use react-use-websocket to manage the WebSocket connection
  const { sendMessage, lastMessage, readyState } = useWebSocket("wss://sopra-fs25-group-05-server.oa.r.appspot.com/ws", {
    onOpen: () => console.log("WebSocket connection opened"),
    onClose: () => console.log("WebSocket connection closed"),
    shouldReconnect: () => true, // Automatically reconnect on disconnection
  });

  const handleIncomingMessage = (messageBody: string) => {
    try { 
      const parsedMessage = JSON.parse(messageBody) as Message;
      console.log("Parsed incoming message:", parsedMessage);
      setMessages((prev) => [...prev, parsedMessage]);
      } catch (error) {
      console.error("Failed to parse message:", error);
      }
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
      const response = await fetch("/chats", {
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
    } catch (error: unknown) {
      console.error("Failed to fetch messages:", error);
      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response: { status: number } }).response;
    
        if (response.status === 404) {
          alert("Chat not found. Redirecting to the main page...");
          router.push("/main");
        }
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