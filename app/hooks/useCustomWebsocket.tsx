"use client";

import { useEffect, useState } from "react";
// import useWebSocket from "react-use-websocket";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { Chat } from "@/types/chat"; // Import the UserChatDTO type

interface Message {
  messageId?: string;
  chatId?: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage?: string | null;
  timestamp?: string;
}

export const useCustomWebsocket = () => {
  const [onlineUsers] = useState<string[]>([]); // add set onlineUsers in Milestone 4 for live updates
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const [chatIds, setChatIds] = useState<string[]>([]); // Store all chat IDs for the user
  const apiService = useApi();
  const router = useRouter();
  const token = JSON.parse(localStorage.getItem("token") || '""');
  const userId = localStorage.getItem("userId");

  const fetchRequests = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId === null) return;

      // Fetch incoming friend requests
      const incomingData = await apiService.get<User[]>(`users/${userId}/friend-request`);

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
      const chatids = await apiService.get<Chat[]>("chats", {
        headers: {
          userId: userId.toString(), // Include the userId in the request header
        },
      });

      // const data = await response.json();
      const ids = chatids.map((chat: { chatId: string }) => chat.chatId);
      console.log("Fetched chat IDs:", ids); // Log the fetched data to the console
      setChatIds(ids); // Assume the API returns an array of UserChatDTO objects
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (chatIds: string[]) => {
    console.log("Fetching messages for chat IDs:", chatIds);
    try {
      //const token = JSON.parse(localStorage.getItem("token") || '""');
      if (!token) {
        console.error("Token is missing");
        return;
      }

      const allMessages: Message[] = []; // Array to store all messages across chats
      for (const chatId of chatIds) {
        // Fetch messages for each chat ID
        const fetchedMessages: Message[] = await apiService.get<Message[]>(`chats/${chatId}/${userId}`);
        console.log(`Fetched messages for chat ID ${chatId}:`, fetchedMessages);
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

    // Schedule fetchRequests and fetchMessages every 15 seconds
    const interval = setInterval(() => {
      fetchRequests();
      if (chatIds.length > 0) {
        fetchMessages(chatIds);
      }
    }, 15000); // 15 seconds

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, [chatIds]);

  return {
    messages,
    onlineUsers,
    incomingRequests,
  };
};