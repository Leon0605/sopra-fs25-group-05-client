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
  const requestsDropdownRef = useRef<HTMLDivElement>(null);
  const messagesDropdownRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const prevIncomingRequestsRef = useRef<User[]>([]);
  const prevMessagesRef = useRef<Message[]>([]);
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [pendingAlerts, setPendingAlerts] = useState<Message[]>([]);

  const fetchLoggedInUser = async () => {
    try {
      if (userId && userId !== 0) {
        const user = await apiService.get<User>(`users/${userId}`, {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
        setLoggedInUser(user);
      }
    } catch (error) {
      console.error("Error fetching logged-in user:", error);
    }
  };

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
      if (!token || !loggedInUser?.id) {
        console.error("Token or logged-in user ID is missing");
        return;
      }

      const newMessageMap = new Map<string, Message>();

      for (const chatId of chatIds) {
        const fetchedMessages: Message[] = await apiService.get<Message[]>(`chats/${userId}/notifications`);
        console.log(`Fetched unread messages for chat ID ${chatId}:`, fetchedMessages);

        fetchedMessages
          .filter(msg => msg.userId !== loggedInUser.id) // ✅ Filter messages not sent by logged-in user
          .forEach(msg => {
            if (msg.messageId) {
              newMessageMap.set(msg.messageId, msg);
            }
          });
      }

      // Merge only new, unique messages
      setMessages(prevMessages => {
        const existingIds = new Set(prevMessages.map(m => m.messageId));
        const newUniqueMessages = Array.from(newMessageMap.values()).filter(
          msg => !existingIds.has(msg.messageId)
        );
        return [...prevMessages, ...newUniqueMessages];
      });

      console.log("Merged unique unread messages from others");
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

  // Function to handle accepting a friend request
  const handleAcceptRequest = async (senderId: number) => {
    if (!userId) return;

    try {
      await apiService.put<void>(
        `/users/${userId}/friend-request`,
        null,
        {
          headers: {
            Authorization: token,
            senderUserId: senderId.toString(),
            Accept: "true",
          },
        }
      );
      // Optionally refresh the requests list or show a success alert
      fetchRequests();
      showAlert("Friend request accepted!", "success");
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      showAlert("Failed to accept friend request.", "danger");
    }
  };

  // Function to handle rejecting a friend request
  const handleRejectRequest = async (senderId: number) => {
    if (!userId) return;

    try {
      await apiService.put<void>(
        `/users/${userId}/friend-request`,
        null,
        {
          headers: {
            Authorization: token,
            senderUserId: senderId.toString(),
            Accept: "false",
          },
        }
      );
      // Optionally refresh the requests list or show a success alert
      showAlert("Friend request rejected.", "success");
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      showAlert(`Oops, something went wrong: ${error}.`, "danger");
    }
  };

  // useEffect for fetching logged-in user
  useEffect(() => {
    fetchLoggedInUser();
    // Optionally add dependencies if needed
  }, [userId, token]);

  // useEffect for storing chat IDs
  useEffect(() => {
    chatIdsRef.current = chatIds;
  }, [chatIds]);

  // useEffect for collecting senders of incoming messages
  useEffect(() => {
    // Get unique sender IDs from messages
    const uniqueSenderIds = Array.from(new Set(messages.map(m => m.userId)));
    // Find which sender IDs are missing from users array
    const missingSenderIds = uniqueSenderIds.filter(
      id => !users.some(u => u.id === id)
    );

    // Fetch missing users
    if (missingSenderIds.length > 0) {
      Promise.all(
        missingSenderIds.map(id =>
          apiService.get<User>(`users/${id}`, {
            headers: {
              Token: `${token}`,
              "Content-Type": "application/json",
            },
          })
        )
      ).then(fetchedUsers => {
        setUsers(prev => [...prev, ...fetchedUsers]);
      }).catch(err => {
        console.error("Failed to fetch some users:", err);
      });
    }
  }, [messages, users, apiService]);

  // useEffect for displaying notifications
  useEffect(() => {
    const prev = prevIncomingRequestsRef.current;

    // Compare lengths and IDs
    if (incomingRequests.length > prev.length) {
      const newRequests = incomingRequests.filter(
        req => !prev.some(prevReq => prevReq.id === req.id)
      );
      newRequests.forEach(req => {
        if (notificationsEnabledRef.current) {
          showAlert(`New friend request from ${req.username}`, "success");
          console.log("New friend request:", req);
        }
      });
    }

    // Update previous ref for next comparison
    prevIncomingRequestsRef.current = incomingRequests;
  }, [incomingRequests]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
    console.log("NotificationsEnabledRef.current line 284:", notificationsEnabledRef.current);
    console.log("Notifications enabled (useEffect):", notificationsEnabled);
  }, [notificationsEnabled]);

  // useEffect for dropdown close
  useEffect(() => {
    if (!openRequests) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdown = requestsDropdownRef.current;
      const bellButton = document.querySelector('[title="Notifications"]');

      if (
        dropdown &&
        !dropdown.contains(target) &&
        bellButton &&
        !bellButton.contains(target)
      ) {
        setOpenRequests(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openRequests]);


  // useEffect for messages dropdown closure
  useEffect(() => {
    if (!openMessages) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdown = messagesDropdownRef.current;
      const envelopeButton = document.querySelector('[title="Messages"]');

      if (
        dropdown &&
        !dropdown.contains(target) &&
        envelopeButton &&
        !envelopeButton.contains(target)
      ) {
        setOpenMessages(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMessages]);

  // useEffect for displaying incoming messages
  useEffect(() => {
    const prev = prevMessagesRef.current;

    // Only show alert if there are new unread messages
    if (messages.length > prev.length) {
      const newMessages = messages.filter(
        msg => !prev.some(prevMsg => prevMsg.messageId === msg.messageId)
      );
      newMessages.forEach(msg => {
        const sender = users.find(u => u.id === msg.userId);
        console.log("NotificationsEnabledRef.current line 396:", notificationsEnabledRef.current)
        if (notificationsEnabledRef.current) {
          if (sender) {
            showAlert(
              `New message from ${sender?.username}: ${msg.originalMessage}`,
              "success"
            );
          } else {
            // Sender not loaded yet, queue the alert
            setPendingAlerts(prev => [...prev, msg]);
          }
        }
      });
    }
    // Update previous ref for next comparison
    prevMessagesRef.current = messages;
  }, [messages, users]);

  // pending alerts in the event that sender was not loaded in previous useEffect (lines 387-413)
  useEffect(() => {
    if (!notificationsEnabledRef.current) return;
    if (pendingAlerts.length === 0) return;

    setPendingAlerts(prevPending => {
      const stillPending: Message[] = [];
      prevPending.forEach(msg => {
        const sender = users.find(u => u.id === msg.userId);
        if (sender) {
          showAlert(
            `New message from ${sender.username}: ${msg.originalMessage}`,
            "success"
          );
        } else {
          stillPending.push(msg);
        }
      });
      return stillPending; // Only keep those still missing a sender
    });
  }, [users]);

  useEffect(() => {
    if (!token || !loggedInUser) return;
    console.log("Notifications enabled (live):", notificationsEnabled);

    fetchChatIds();
    fetchRequests();

    const interval = setInterval(() => {
      fetchRequests();
      if (chatIdsRef.current.length > 0) {
        fetchUnreadMessages(chatIdsRef.current);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [token, loggedInUser, notificationsEnabled]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-purple shadow position-fixed" style={{ zIndex: 1050 }}>
      <div className="container-fluid">
        <img
          src="/images/HablaLogo.png"
          alt="Habla! Logo" className="img-fluid"
          style={{ maxWidth: "200px", maxHeight: "50px", height: "auto" }}
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
              <a className="nav-link fs-4" href={"/flashcards"}>Flash Cards</a>
            </li>
          </ul>

          {/* Notifications */}
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-light position-relative" title="Notifications" onClick={(e) => {
              setOpenRequests((prev) => !prev);
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
              <div className={styles["nav-auth-card"]} ref={requestsDropdownRef}>
                <p style={{ color: "#5A639C", fontSize: "17.6px" }}>Incoming Friend Requests</p>
                {incomingRequests.map((request) => (
                  <div key={request.id} className="d-flex align-items-center mb-2" style={{ gap: "0.5rem" }}>
                    {/* User image or fallback avatar */}
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/users/${request.id}`)}
                    >
                      {request.photo ? (
                        <img
                          src={request.photo}
                          alt={request.username ?? ""}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #9B86BD",
                          }}
                        />
                      ) : (
                        <img
                          src="/images/default-user.png" // Path to the generic user image
                          alt="Default user profile"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#E2BBE9",
                            color: "#5A639C",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            border: "2px solid #9B86BD",
                          }}
                        >
                        </img>
                      )}
                    </span>
                    {/* Username */}
                    <span
                      style={{ fontWeight: "bold", cursor: "pointer", color: "#5A639C" }}
                      onClick={() => router.push(`/users/${request.id}`)}
                    >
                      {request.username}
                    </span>
                    {/* Accept/Reject buttons */}
                    <div style={{ display: "flex", gap: "0.0rem", marginLeft: "auto" }}>
                      <button
                        className="btn btn-outline-light"
                        title="Accept"
                        style={{ marginLeft: "auto", border: "none", boxShadow: "none", background: "none" }}
                        onClick={() => request.id !== null && handleAcceptRequest(request.id)}
                      >
                        <i className="bi bi-check-circle" style={{ color: "#5A639C", fontSize: "1.35rem" }}></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        title="Reject"
                        style={{ border: "none", boxShadow: "none", background: "none" }}
                        onClick={() => request.id !== null && handleRejectRequest(request.id)}
                      >
                        <i className="bi bi-x-circle" style={{ color: "#5A639C", fontSize: "1.35rem" }}></i>
                      </button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && (
                  <div style={{ color: "#5A639C", fontStyle: "italic", padding: "0.5rem 0" }}>
                    You have no current friend requests
                  </div>)}
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
              <div className={styles["nav-auth-card"]} ref={messagesDropdownRef}>
                <p style={{ color: "#5A639C", fontSize: "17.6px" }}>Messages</p>
                {messages.map((message) => {
                  const sender = users.find(u => u.id === message.userId);
                  return (
                    <div key={message.messageId} className="d-flex align-items-center mb-2" style={{ gap: "0.5rem" }}>
                      {/* User image or fallback avatar */}
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`/chats/${message.chatId}`)}
                      >
                        {sender?.photo ? (
                          <img
                            src={sender.photo}
                            alt={sender.username ?? ""}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #9B86BD",
                            }}
                          />
                        ) : (
                          <img
                            src="/images/default-user.png" // Path to the generic user image
                            alt="Default user profile"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#E2BBE9",
                              color: "#5A639C",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                              border: "2px solid #9B86BD",
                            }}
                          >
                          </img>
                        )}
                      </span>
                      {/* Username */}
                      <span
                        style={{ fontWeight: "bold", cursor: "pointer", color: "#5A639C" }}
                        onClick={() => router.push(`/chats/${message.chatId}`)}
                      >
                        {sender?.username}
                      </span>
                      {/* Message content */}
                      <div style={{ display: "flex", gap: "0.0rem", marginLeft: "auto" }}>
                        <span style={{ color: "#5A639C" }}>{message.originalMessage}</span>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 && (
                  <div style={{ color: "#5A639C", fontStyle: "italic", padding: "0.5rem 0" }}>
                    You have no unread messages
                  </div>)}
              </div>
            )}

            <button className="btn btn-outline-light position-relative" title="Log out" onClick={handleLogout}
              style={{ border: "none", boxShadow: "none", background: "none" }}>
              <i className="bi bi-box-arrow-right fs-4"></i>
            </button>

            <img
              src={loggedInUser?.photo || "/images/default-user.png"}
              alt={`${loggedInUser?.username} avatar`}
              className="rounded-circle me-2"
              style={{ width: "32px", height: "32px", objectFit: "cover" }}
              onClick={() => router.push(`/users/${userId}`)}
              role="button"
              tabIndex={0}
            />

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