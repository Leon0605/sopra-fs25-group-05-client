"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import styles from "./Navbar.module.css";

import { User } from "@/types/user";
import { Chat } from "@/types/chat"; // Import the UserChatDTO type
import { useAlert } from "@/components/alertContext";

interface Message {
  messageId?: string;
  chatId?: string;
  userId: number;
  content: string;
  originalMessage: string;
  translatedMessage?: string | null;
  timestamp?: string;
  status: "read" | "unread";
}

const Navbar = () => {
  const router = useRouter();
  const apiService = useApi();
  const chatIdsRef = useRef<string[]>([]);
  const [openRequests, setOpenRequests] = useState(false);
  const [openMessages, setOpenMessages] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<number>("userId", 0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "danger" | null>(null); // For success or error alerts
  const { clear: clearNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const { value: notificationsEnabled, set: setNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const notificationsEnabledRef = useRef(notificationsEnabled);

  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const prevIncomingRequestsRef = useRef<User[]>([]);
  const prevMessagesRef = useRef<Message[]>([]);
  const [chatIds, setChatIds] = useState<string[]>([]);
  
  const handleLogout = async () => {
    try {
      if (userId && userId !== 0) {
        await apiService.post<void>("/logout", null, {
          headers: {
            userId: String(userId),
          },
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed");
    } finally {
      clearToken();
      clearUserId();
      clearNotificationsEnabled();
      router.push("/login");
    }
  };

  const { showAlert } = useAlert();

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

  const fetchUnreadMessages = async (chatIds: string[]) => {
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

      const unreadMessages = allMessages.filter(
        (msg) => msg.status !== "read" && msg.userId !== userId // Don't show messages sent by the user as unread
      );
      setMessages(unreadMessages);

      // Update the state with all the messages
      // setMessages(allMessages);
      console.log("Fetched unread messages:", unreadMessages);
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
    chatIdsRef.current = chatIds;
  }, [chatIds]);

  // useEffect for displaying notifications
  useEffect(() => {
    const prev = prevIncomingRequestsRef.current;

    // Compare lengths and IDs
    if (incomingRequests.length > prev.length) {
      const newRequests = incomingRequests.filter(
        req => !prev.some(prevReq => prevReq.id === req.id)
      );
      newRequests.forEach(req => {
        showAlert(`New friend request from ${req.username}`, "success");
        console.log("New friend request:", req);
      });
    }

    // Update previous ref for next comparison
    prevIncomingRequestsRef.current = incomingRequests;
  }, [incomingRequests]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  // useEffect for displaying incoming messages
  useEffect(() => {
    const prev = prevMessagesRef.current;

    // Only show alert if there are new unread messages
    if (messages.length > prev.length) {
      const newMessages = messages.filter(
        msg => !prev.some(prevMsg => prevMsg.messageId === msg.messageId)
      );
      newMessages.forEach(msg => {
        showAlert(
          `New message from user ${msg.userId}: ${msg.originalMessage}`,
          "success"
        );
      });
    }

    // Update previous ref for next comparison
    prevMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!token) return; // Wait until token is loaded
    console.log("Notifications: ", notificationsEnabled);
    fetchChatIds();
    fetchRequests();

    const interval = setInterval(() => {
      fetchRequests();
      if (chatIdsRef.current.length > 0) {
        fetchUnreadMessages(chatIdsRef.current);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-purple shadow position-fixed">
      <div className="container-fluid">
        <img
          src="@/../../images/HablaLogo.png"
          alt="Habla! Logo"
          style={{ height: "125px", width: "125px", objectFit: "contain" }} // Adjust as needed
        />

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-between" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link fs-4" href="/main">Main</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fs-4" href="/chats">Chats</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fs-4" href="/friends">Friends</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fs-4" href="/users">Users</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fs-4" href={`/users/${userId}`}>Profile</a>
            </li>
            <li className="nav-item">
              <a className="nav-link fs-4" href={"/flashcards"}>Flash Cards</a>
            </li>
          </ul>

          {/* Notifications */}
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-light position-relative" title="Notifications" onClick={() => {
              setOpenRequests(!openRequests);
              setOpenMessages(false); // Close notifications dropdown if open
            }}
              style={{ border: "none", boxShadow: "none", background: "none" }}>
              {incomingRequests.length > 0 && (
                <span className="badge rounded-pill bg-info light-text position-relative top-0 start-100 translate-middle">
                  {incomingRequests.length}
                </span>
              )}
              <i className="bi bi-bell fs-4"></i>
            </button>

            {/* Notifications Dropdown */}
            {openRequests && (
              <div className={styles["nav-auth-card"]}>
                <p>Incoming Friend Requests</p>
                {incomingRequests.map((request, index) => (
                  <div key={index}>
                    <span>{request.username}</span>
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => setOpenRequests(false)}>
                  Close
                </button>
              </div>
            )}

            {/* Messages */}
            <button className="btn btn-outline-light position-relative" title="Messages" onClick={() => {
              setOpenMessages(!openMessages);
              setOpenRequests(false); // Close incoming requests dropdown if open
            }}
              style={{ border: "none", boxShadow: "none", background: "none" }}>
              {messages.length > 0 && (
                <span className="badge rounded-pill bg-info light-text position-relative top-0 start-100 translate-middle">
                  {messages.length}
                </span>
              )}
              <i className="bi bi-envelope fs-4"></i>
            </button>

            {/* Messages Dropdown */}
            {openMessages && (
              <div className={styles["nav-auth-card"]}>
                <p>Messages</p>
                {messages.map((message, index) => (
                  <div key={index}>
                    <span>{message.userId} wrote: {message.originalMessage}</span>
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => setOpenMessages(false)}>
                  Close
                </button>
              </div>
            )}

            <button className="btn btn-outline-light position-relative" title="Log out" onClick={handleLogout}
              style={{ border: "none", boxShadow: "none", background: "none" }}>
              <i className="bi bi-box-arrow-right fs-4"></i>
            </button>


            <div className="bg-light text-dark rounded-circle d-flex justify-content-center align-items-center"
              style={{ width: "32px", height: "32px", fontWeight: "bold" }}>
              C
            </div>
          </div>
        </div>
        {alertMessage && (
          <div
            className={`bubble-message ${alertType}`}
            style={{
              position: "fixed",
              bottom: "20px", // Adjust this to position the bubble
              right: "20px",
              border: "3px solid #9B86BD",
              backgroundColor: alertType === "success" ? "#E2BBE9" : "#f44336", // Green for success, red for danger
              color: "white",
              padding: "10px 20px",
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              zIndex: 2000, // Ensure it appears above other elements
              textAlign: "center",
              maxWidth: "300px", // Optional: Limit the width of the bubble
            }}
          >
            {alertMessage}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;