"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Client } from "@stomp/stompjs";
import styles from "./page.module.css";

interface Message {
  messageId: string;
  chatId: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage: string;
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id;
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  const colours = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0', "#A1FF33", "#33A1FF",
  ];
  const userColors: { [key: string]: string } = {};

  // Assign a color to a user
  const getUserColor = (userId: number): string => {
    if (userColors[userId]) return userColors[userId];
    const color = colours[userId % colours.length];
    userColors[userId] = color;
    return color;
  };

  // Send a message
  const sendMessage = (content: string) => {
    const userId = localStorage.getItem("userId") ?? "defaultId";
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.error("WebSocket is not connected");
      return;
    }

    const message = {
      content,
      chatId: chatId,
      userId: Number(userId),
    };

    console.log("Message to be sent:", message);
    stompClientRef.current.publish({
      destination: `/app/MessageHandler`,
      body: JSON.stringify(message),
      headers: {
        "content-type": "application/json",
      },
    });
  };

  // Handle incoming WebSocket messages
  const handleIncomingMessage = (message: string) => {
    try {
      const parsedMessage = JSON.parse(message) as Message;
      console.log("Parsed incoming message:", parsedMessage);
      setMessages((prev) => [...prev, parsedMessage]);
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  };

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      const users: User[] = await apiService.get<User[]>("/users");
      console.log("Fetched users:", users);
      setUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Setup WebSocket connection
  const setupWebSocket = () => {
    const socket = new WebSocket("ws://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);
        stompClientRef.current = stompClient;

        stompClient.subscribe(`/topic/en/${chatId}`, (message) => {
          if (message.body) handleIncomingMessage(message.body);
        });
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setIsConnected(false);
      },
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  };

  // Fetch previously sent messages from the API
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const fetchedMessages: Message[] = await apiService.get<Message[]>(`/chats/${chatId}/${token}`);
      setMessages(fetchedMessages);
      console.log("Fetched messages:", fetchedMessages);
    } catch (error: any) {
      console.error("Failed to fetch messages:", error);
      if (error.response && error.response.status === 404) {
        alert("Chat not found. Redirecting to the main page...");
        router.push("/main");
      }
    }
  };

  // Consolidated useEffect
  useEffect(() => {
    fetchUsers();
    const cleanupWebSocket = setupWebSocket();

    if (chatId) {
      fetchMessages();
    }

    return () => {
      cleanupWebSocket();
    };
  }, [chatId, apiService]);

  const createChatManually = async () => {
    try {
      const chatId = await apiService.post("/chat", [1, 2]);
      console.log("✅ Chat manually created with ID:", chatId);
    } catch (error) {
      console.error("❌ Failed to manually create chat:", error);
    }
  };
  
  return (
      <div id="chat-page" className={styles["chat-page"]}>
        <div className={styles["chat-container"]}>
          <div className={styles["chat-header"]}>
            <h1>Habla! Chat</h1>
            <button onClick={createChatManually} className={styles.btnPrimary}>
              Create Chat 1 Manually with UserId 1 and 2
            </button>
          </div>
        <div id="chat-area">
          <div id="chat-messages" className={styles["chat-messages"]}>
            <ul id="message-area">
              {messages.map((message) => {
                console.log("Rendering message:", message); // Log each message being rendered
                const user = users?.find((user) => user.id === message.userId);
                const userColor = getUserColor(message.userId);
                return (
                  <li key={message.messageId} className={styles["chat-message"]}>
                    <i
                      //className={styles["chat-message-i"]}
                      style={{ backgroundColor: userColor }}
                    >
                      {user?.username?.[0] || "?"}
                    </i>
                    <p>
                      {user?.username}
                    </p>
                    <span
                      //className={styles["chat-message-span"]}
                      //style={{ backgroundColor: userColor }}
                    >
                      <p>
                        {message.originalMessage}
                      </p>
                      <p className={styles["translation"]}>
                        {message.translatedMessage}
                      </p>
                    </span>
                    <p className={styles["timestamp"]}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <form
          id="messageForm"
          className={styles["message-form"]}
          onSubmit={(e) => {
            e.preventDefault();
            const messageInput = document.querySelector<HTMLInputElement>("#message");
            if (messageInput && messageInput.value.trim() !== "") {
              sendMessage(messageInput.value.trim());
              messageInput.value = "";
            }
          }}
        >
          <input
            type="text"
            id="message"
            placeholder="Type your message here..."
            className={styles.formControl}
          />
          <button type="submit" className={styles["btn-primary"]}>
            Send
          </button>
        </form>
        <button
          onClick={() => {
            if (stompClientRef.current && stompClientRef.current.connected) {
              alert("WebSocket is connected");
            } else {
              alert("WebSocket is not connected");
            }
          }}
        >
          Test WebSocket Connection
        </button>
        <div>
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: isConnected ? "green" : "red",
              marginRight: "10px",
            }}
          ></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;