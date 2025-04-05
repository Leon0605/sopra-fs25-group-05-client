"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Client } from "@stomp/stompjs"; // Import STOMP client
// import SockJS from "sockjs-client"; // Optional: Use SockJS for fallback support
import styles from "./page.module.scss";

const ChatPage: React.FC = () => {
  interface Message {
    messageId: string;
    chatId: string;
    userId: number;
    content: string;
    timestamp: string;
  }
  
  const router = useRouter();
  const apiService = useApi();
  // Create 3 users
  // const user1: User = { id: 1, name: "User1", username: "user1" };
  // const user2: User = { id: 2, name: "User2", username: "user2" };
  // const user3: User = { id: 3, name: "User3", username: "user3" };
  // const user4: User = { id: 4, name: "User3", username: "user3" };
  // const users: User[] = [user1, user2, user3, user4];
  
  const [users, setUsers] = useState<User[] | null>(null);
  // const stompClient = new Client({ brokerURL: "ws://localhost:8080/ws", });
  const [messages, setMessages] = useState<Message[]>([]); // State for WebSocket messages
  const stompClientRef = useRef<Client | null>(null); // Use a ref for the stompClient
  const [isConnected, setIsConnected] = useState(false);
  // Mock data for chat messages
  const mockMessages = [
    { messageId: "1", chatId: "1", userId: 1, content: "Hello! How are you?"},
    { messageId: "2", chatId: "1", userId: 2, content: "I'm good, thanks! How about you?"},
    { messageId: "3", chatId: "1", userId: 3, content: "Doing great, thanks for asking!"},
    { messageId: "4", chatId: "1", userId: 4, content: "What are you up to today?"},
  ];

  // use mock messages for now
  // const [messages, setMessages] = useState(mockMessages);

  const colours: string[] = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
    "#33FFA1", "#FFA133", "#FF33FF", "#A1FF33", "#33A1FF",
    "#FF5733", "#33FF57",
  ];

  // User-to-color mapping
  const userColors: { [key: string]: string } = {};

  const getUserColor = (userId: number): string => {
    // Retrieve the user-to-color mapping from local storage
    const storedUserColors = JSON.parse(localStorage.getItem("userColors") || "{}");
  
    // If the user already has a color assigned, return it
    if (storedUserColors[userId]) {
      return storedUserColors[userId];
    }
  
    // Assign a new color to the user
    const availableColors = colours.filter(
      (color) => !Object.values(storedUserColors).includes(color)
    );
  
    // If no colors are available, reuse colors (fallback)
    const assignedColor = availableColors.length > 0
      ? availableColors[0]
      : colours[userId % colours.length];
  
    // Update the user-to-color mapping
    storedUserColors[userId] = assignedColor;
    localStorage.setItem("userColors", JSON.stringify(storedUserColors));
  
    return assignedColor;
  };


  // Function to get or assign a color for a user
  // const getUserColor = (user: string): string => {
  //   if (!userColors[user]) {
  //     // Assign a random color from the array
  //     const randomColor = colours[Math.floor(Math.random() * colours.length)];
  //     userColors[user] = randomColor;
  //   }
  //   return userColors[user];
  // };

  const sendMessage = (content: string) => {
    // Retrieve the userId from localStorage
    const userId = localStorage.getItem("id");
    if (stompClientRef.current && stompClientRef.current.connected) {
      const message = {
        messageId: crypto.randomUUID(),
        chatId: "1d9316ac-2409-45dc-a66f-718b7166b57e", // Replace with the actual chatId
        userId: Number(userId), // Replace with the actual userId
        content,
        timestamp: new Date().toISOString(),
      };
      // Log the message object to the console
      console.log("Message to be sent:", message);

      stompClientRef.current.publish({
        destination: "/app/chat/1/message", // Replace with your backend destination
        body: JSON.stringify(message),
      });
      setMessages((prevMessages) => [...prevMessages, message]); // Optimistically update the UI
    } else {
      console.error("WebSocket is not connected");
    }
  };

  function displayMessage(senderId: number, content: string): void {
    const chatArea = document.querySelector("#messageArea") as HTMLElement;
  
    // Create a container for the message
    const messageContainer = document.createElement("li");
    messageContainer.classList.add(styles.messageItem);
  
    // Add sender/receiver-specific styles
    if (senderId === 1) {
      messageContainer.classList.add(styles.sender); // Add a sender-specific class
    } else {
      messageContainer.classList.add(styles.receiver); // Add a receiver-specific class
    }
  
    // Create the message content
    const messageContent = document.createElement("span");
    messageContent.classList.add(styles.messageContent);
    messageContent.textContent = content;
  
    // Append the content to the container
    messageContainer.appendChild(messageContent);
  
    // Append the container to the chat area
    chatArea.appendChild(messageContainer);
  
    // Scroll to the bottom of the chat area
    chatArea.scrollTop = chatArea.scrollHeight;
  }


  // Function to handle incoming messages
  const onMessageReceived = (payload: { body: string }) => {
    console.log("Received message payload:", payload); // Log the raw payload
    // Parse the incoming payload as an array of messages
    const messages = JSON.parse(payload.body) as {
      messageId: string;
      chatId: string;
      userId: number;
      content: string;
      timestamp: string;
    }[];

    console.log("Parsed messages:", messages);

    // Call displayMessage for each message
    messages.forEach((message) => {
      displayMessage(message.userId, message.content);
    });

    // Add the new messages to the state
    setMessages((prevMessages) => [
      ...prevMessages,
      ...messages.map((message) => ({
        messageId: message.messageId,
        chatId: message.chatId,
        userId: message.userId,
        content: message.content,
        timestamp: message.timestamp,
      })),
    ]);
  };


  const { clear: clearToken } = useLocalStorage<string>("token", "");

  const handleLogout = (): void => {
    clearToken();
    router.push("/login");
  };

  useEffect(() => {
    // Javascript equivalents: 
    // var usernamePage: Element = document.querySelector("#username-page");
    // var chatPage: Element = document.querySelector("#chat-page");

    // Select the elements after the component is mounted
    // const usernamePage: HTMLElement | null = document.querySelector("#username-page");
    const chatPage: HTMLElement | null = document.querySelector("#chat-page");
    const messageForm: HTMLFormElement | null = document.querySelector("#messageForm");
    const messageInput: HTMLInputElement | null = document.querySelector("#message");
    const messageArea: HTMLUListElement | null = document.querySelector("#messageArea");
    const connectingElement: HTMLElement | null = document.querySelector(".connecting");

    if (chatPage) {
      console.log("Chat page element found:", chatPage);
    }

    
   
    const fetchUsers = async () => {
      try {
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, []); // Empty dependency array ensures this runs once after the component mounts [apiService]);

  // Mock webSocket connection
  // useEffect(() => {
  //   const ws = new WebSocket("wss://echo.websocket.events");
  
  //   ws.onopen = () => {
  //     console.log("Connected to mock WebSocket");
  
  //     // Send a test message to the echo server
  //     ws.send(JSON.stringify(
  //       {
  //         "messageId": "abc123",
  //         "chatId": "572cd950-1b7f-4931-bb72-5c53598ac5c8",
  //         "userId": 1,
  //         "content": "Hello, how are you?",
  //         "timestamp": "2025-03-29T21:30:00Z"
  //       }));
  //     setTimeout(() => {
  //       ws.send(
  //         JSON.stringify({
  //           messageId: "def456",
  //           chatId: "572cd950-1b7f-4931-bb72-5c53598ac5c8",
  //           userId: 2,
  //           content: "I'm good, thank you!",
  //           timestamp: "2025-03-29T21:31:00Z",
  //         })
  //       );
  //     }, 3000); // 3-second delay
      
  //     setTimeout(() => {
  //       ws.send(
  //         JSON.stringify({
  //           messageId: "j343",
  //           chatId: "572cd950-1b7f-4931-bb72-5c53598ac5c8",
  //           userId: 1,
  //           content: "These websockets are really hard!",
  //           timestamp: "2025-03-29T21:32:00Z",
  //         })
  //       );
  //     }, 5000); // 2-second delay

  //     setTimeout(() => {
  //       ws.send(
  //         JSON.stringify({
  //           messageId: "j3564",
  //           chatId: "572cd950-1b7f-4931-bb72-5c53598ac5c8",
  //           userId: 2,
  //           content: "We'll get them though!",
  //           timestamp: "2025-03-29T21:33:00Z",
  //         })
  //       );
  //     }, 7000); // 2-second delay
  //   };
      

  //   ws.onmessage = (event) => {
  //     console.log("Received:", event.data);
  
  //     try {
  //       const parsedMessage = JSON.parse(event.data);
  //       setMessages((prevMessages) => [
  //         ...prevMessages,
  //         {
  //           messageId: parsedMessage.messageId || crypto.randomUUID(),
  //           chatId: parsedMessage.chatId, // Mock chatId
  //           userId: parsedMessage.userId, // Mock userId
  //           content: parsedMessage.content,
  //           timestamp: new Date().toISOString(),
  //         },
  //       ]);
  //     } catch (error) {
  //       console.error("Failed to parse message:", error);
  //     }
  //   };
  
  //   ws.onerror = (error) => {
  //     console.error("WebSocket error:", error);
  //   };
  
  //   ws.onclose = () => {
  //     console.log("WebSocket closed");
  //   };
  
  //   // Cleanup on component unmount
  //   return () => ws.close();
  // }, []);

  

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("http://localhost:8080/chat/1d9316ac-2409-45dc-a66f-718b7166b57e");
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched messages:", data);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // WebSocket setup
  useEffect(() => {
    console.log("Setting up WebSocket connection...");
    const socket = new WebSocket('http://localhost:8080/ws'); // Replace with your WebSocket endpoint
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        alert("WebSocket is connected");
        console.log("Connected to WebSocket");
        setIsConnected(true);
      

        // Subscribe to a topic

      const chatId = '1d9316ac-2409-45dc-a66f-718b7166b57e';
      stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
        const chatMessage = JSON.parse(message.body);
        console.log('Received message:', chatMessage);
        console.log('Received message:', JSON.parse(message.body));
        if (message.body) {
          try {
            // Parse the message body as JSON
            const parsedMessage = JSON.parse(message.body) as Message;

            // Add the parsed message to the state
            setMessages((prev) => [...prev, parsedMessage]);
          } catch (error) {
            console.error("Failed to parse message body:", error);
          }
        }
      });
      
      
    
    },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setIsConnected(false);
        alert("WebSocket is disconnected");
      },
    });

    stompClient.activate();

    // Cleanup on component unmount
    // return () => {
    //   stompClient.deactivate();
    // };
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
              const user = users?.find((user) => user.id === Number(message.userId));
              const userColor = getUserColor(user?.username || "default");
              return (
                <li key={message.messageId} className={styles.messageItem}>
                  <span
                    className={styles.userName}
                    style={{ backgroundColor: userColor }}
                  >
                    {user?.username}
                  </span>
                  <span className={styles.messageContent}>
                    {message.content}
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
            console.log("WebSocket is connected");
            alert("WebSocket is connected");
          } else {
            console.log("WebSocket is not connected");
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