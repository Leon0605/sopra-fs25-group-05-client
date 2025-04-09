"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Client } from "@stomp/stompjs";
import styles from "./page.module.scss";

interface Message {
  messageId: string;
  chatId: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage: string;
  timestamp: string;
}

// const chatId = "4ab5c803-fe62-424a-ad6e-eca4aa976896" // example chatId

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
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
    "#33FFA1", "#FFA133", "#FF33FF", "#A1FF33", "#33A1FF",
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
      destination: `/app/${chatId}`,
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

        stompClient.subscribe(`/topic/${chatId}/messages`, (message) => {
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

  // Consolidated useEffect
  useEffect(() => {
    fetchUsers();
    const cleanupWebSocket = setupWebSocket();

    return () => {
      cleanupWebSocket();
    };
  }, []);

  return (
    <div id="chat-page" className={styles.chatPage}>
      <div className={styles.chatHeader}>
        <h1>Habla! Chat</h1>
      </div>
      <div id="chat-area" className={styles.chatContainer}>
        <div id="chat-messages" className={styles.chatMessages}>
          <ul id="messageArea" className={styles.messageArea}>
            {messages.map((message) => {
              console.log("Rendering message:", message); // Log each message being rendered
              const user = users?.find((user) => user.id === message.userId);
              //const user = users?.find((user) => message.userId !== null && Number(message.userId));
              const userColor = getUserColor(message.userId);
              return (
                <li key={message.messageId} className={styles.messageItem}>
                  <span
                    className={styles.userName}
                    style={{ backgroundColor: userColor }}
                  >
                    {user?.username}
                  </span>
                  <span className={styles.messageContent}>
                    {message.originalMessage}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <form
        id="messageForm"
        className={styles.inputGroup}
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
        <button type="submit" className={styles.btnPrimary}>
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
  );
};

export default ChatPage;