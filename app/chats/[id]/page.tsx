"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Client } from "@stomp/stompjs";
import SockJS from 'sockjs-client';
import styles from "./page.module.css";
import "bootstrap/dist/css/bootstrap.min.css";

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
  const params = useParams();
  const chatId = params.id;
  const apiService = useApi();
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const [hasMounted, setHasMounted] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  //const [language, setLanguage] = useState<string[]|null>;

  const colours = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0', "#A1FF33", "#33A1FF",
  ];
  const userColors: { [key: string]: string } = {};

      useEffect(() => {
        setHasMounted(true);
      }, []);
    
      useEffect(() => {
        if (hasMounted && !token) {
          //router.push("/login");
        }
      }, [hasMounted, token]);

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

  const currentLanguage: () => Promise<string|null> = async () => {
      const user = await apiService.get<User>(`/user/${localStorage.getItem("userId")}`)
      return user.language
  }

  // Setup WebSocket connection
  const setupWebSocket = () => {
    // Use SockJS for the WebSocket connection
    const socket = new SockJS("https://sopra-fs25-group-05-server.oa.r.appspot.com/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket, // Use SockJS as the WebSocket factory
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);
        stompClientRef.current = stompClient;
  
        // Retrieve the user's language preference
        const userId = localStorage.getItem("userId");
        const currentUser = users?.find((user) => user.id === Number(userId));
        console.log(currentUser?.id)
        console.log(currentUser?.language)

        //const userLanguage = currentUser?.language; // Default to "en"
  
        stompClient.subscribe(`/topic/${currentLanguage()}/${chatId}`, (message) => {
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
      const fetchedMessages: Message[] = await apiService.get<Message[]>(`chats/${chatId}/${token}`);
      setMessages(fetchedMessages);
      console.log("Fetched messages:", fetchedMessages);
    } catch (error: unknown) {
      console.error("Failed to fetch messages:", error);
      if (error instanceof Error) {
        console.error("Failed to fetch messages:", error.message);
      } else {
        console.error("An unknown error occurred:", error);
      }
    }    
  };

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp.includes(",")) {
      console.error("Invalid timestamp format:", timestamp);
      return timestamp; // Return the original timestamp if the format is invalid
    }
  
    const [datePart, timePart] = timestamp.split(",").map((part) => part.trim());
    const today = (() => {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    })();
  
    console.log("datePart:", datePart);
    console.log("timePart:", timePart);
    console.log("today:", today);
  
    return datePart === today ? timePart : datePart;
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

  
  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }
  
    return (
      <div id="chat-page" className={styles["chat-page"]}>
        {/* Floating title top-left */}
        <h1 className={styles["chat-title"]}>Habla! Chat</h1>

        <button
          className={styles["main-nav-button"]}
          onClick={() => router.push("/main")}
        >
          Go to Main Page
        </button>
    
        {/* Chat Card */}
        <div className={styles["chat-container"]}>
    
          {/* Scrollable Message Area */}
          <div className={styles["chat-messages-container"]}>
            <ul className={styles["message-area"]}>
              {messages.map((message) => {
                const user = users?.find((user) => user.id === message.userId);
                const userColor = getUserColor(message.userId);
                return (
                  <li key={message.messageId} className={styles["chat-message"]}>
                    <div className={styles["avatar-username"]}>
                      <i style={{ backgroundColor: userColor }}>
                        {user?.username?.[0] || "?"}
                      </i>
                      <span className={styles["username"]}>
                        {user?.username || "Anonymous"}
                      </span>
                    </div>
                    <div className={styles["message-block"]}>
                      <p className={styles["original"]}>{message.originalMessage}</p>
                      <p className={styles["translation"]}>{message.translatedMessage}</p>
                    </div>
                    <p className={styles["timestamp"]}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
    
          {/* Message Input */}
          <form
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
    
          {/* WebSocket Status and Test Button */}
          <div className="d-flex align-items-center justify-content-between p-3" style={{ gap: "16px" }}>
            <div className="d-flex align-items-center">
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "green" : "red",
                  marginRight: "10px",
                }}
              />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            <button
              className="btn btn-outline-secondary"
              style={{ fontSize: "0.9rem" }}
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
          </div>
        </div>
      </div>
    );    
};

export default ChatPage;