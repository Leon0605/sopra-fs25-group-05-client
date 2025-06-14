"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Client } from "@stomp/stompjs";
import { getApiDomain } from "@/utils/domain";
import SockJS from 'sockjs-client';
// import Navbar from "../../components/Navbar";
import styles from "./page.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FlashcardSet } from "@/types/flashcardSet";


interface Message {
    messageId: string;
    chatId: string;
    userId: number;
    content: string;
    status: string;
    originalMessage: string;
    translatedMessage: string;
    timestamp: string;
}

const ChatPage: React.FC = () => {
    const params = useParams();
    const chatId = params.id;
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    const [hasMounted, setHasMounted] = useState(false);
    const [users, setUsers] = useState<User[] | null>(null);
    const { value: userId } = useLocalStorage<number>("userId", 0);
    const [messages, setMessages] = useState<Message[]>([]);
    const stompClientRef = useRef<Client | null>(null);
    const [language, setLanguage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    //adding flashcards
    const [showModal, setShowModal] = useState(false);
    const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Scroll to the bottom of the message area when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (hasMounted && !token) {
            //router.push("/login");
        }
    }, [hasMounted, token]);



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
            setMessages((prev) => [...prev, parsedMessage]);
        } catch (error) {
            console.error("Failed to parse message:", error);
        }
    };

    // Fetch users from the API
    const fetchUsers = async () => {
        try {
            const users: User[] = await apiService.get<User[]>("users");
            setUsers(users);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const currentLanguage = async () => {
        if (!token || !userId) {
            console.warn("Token or userId missing, skipping currentLanguage fetch.");
            return;
        }
        const user = await apiService.get<User>(`users/${userId}`, {
            headers: {
                Token: token,
            },
        });
        const language = user.language ?? "en";
        setLanguage(language);
    };

    // Setup WebSocket connection
    const setupWebSocket = () => {
        // Use SockJS for the WebSocket connection
        const socket = new SockJS(`${getApiDomain()}ws`);
        const stompClient = new Client({
            webSocketFactory: () => socket, // Use SockJS as the WebSocket factory
            onConnect: () => {
                stompClientRef.current = stompClient;

                stompClient.subscribe(`/topic/${language}/${chatId}`, (message) => {
                    if (message.body) handleIncomingMessage(message.body);
                });
            },
            onDisconnect: () => {
            },
        });

        stompClient.activate();
        return () => stompClient.deactivate();
    };

    // Fetch previously sent messages from the API
    const fetchMessages = async () => {
        try {
            const fetchedMessages: Message[] = await apiService.get<Message[]>(`chats/${chatId}/${userId}`);
            setMessages(fetchedMessages);
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

        return datePart === today ? timePart : datePart;
    };

    // Consolidated useEffect
    useEffect(() => {
        fetchUsers();
        // Only call currentLanguage if token and userId are available
        if (!token || !userId) {
            return;
        }

        currentLanguage()
        if (language == null) {
            return;
        }

        const cleanupWebSocket = setupWebSocket();

        if (chatId) {
            fetchMessages();
        }

        return () => {
            cleanupWebSocket();
        };
    }, [chatId, apiService, language, token, userId]);

    const openFlashcardModal = async (original: string, translation: string) => {
    setFront(original);
    setBack(translation);

    try {
        const sets = await apiService.get<FlashcardSet[]>("/flashcards", {
        headers: { Authorization: token },
        });
        setFlashcardSets(sets);
        setSelectedSetId(sets[0]?.flashcardSetId ?? null);
        setShowModal(true);
    } catch (err) {
        console.error("Failed to fetch sets:", err);
        alert("Could not load flashcard sets.");
    }
    };



    if (!hasMounted || !token || !users) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-light" role="status" />
            </div>
        );
    }

    return (
        <>
            {/* Scrollable Message Area */}
            <div className={styles["chat-messages-container"]}>
                <ul className={styles["message-area"]}>
                    {messages.map((message) => {
                        const user = users?.find((user) => user.id === message.userId);
                        return (
                            <li key={message.messageId} className={styles["chat-message"]}>
                                <div style={{ marginRight: "15px" }}>
                                    <img src={user?.photo || "/images/default-user.png"}
                                        alt={`${user?.username} avatar`}
                                        className="rounded-circle me-2"
                                        style={{ width: "32px", height: "32px", border: "2px solid #9B86BD" }} />
                                    <span className="username"
                                        style={{ color: "#5A639C", fontWeight: "bold" }}>
                                        {user?.username || "Anonymous"}
                                    </span>
                                </div>
                                <div className={styles["message-block"]}>
                                    <p className={styles["original"]}>{message.originalMessage}</p>
                                    {message.originalMessage !== message.translatedMessage && (
                                        <p className={styles["translation"]}>{message.translatedMessage}</p>

                                    )}
                                </div>
                                {/* Add Flashcard Button */}
                                {(
                                <button
                                    className={styles["flashcard-btn-circle"]}
                                    onClick={() => openFlashcardModal(message.originalMessage, message.translatedMessage)}
                                    >
                                    <i className="bi bi-plus-circle"></i>
                                </button>
                                )}
                                {/* Message Status */}
                                <div className={styles["timestamp"]}>
                                    {formatTimestamp(message.timestamp)}
                                    {userId === message.userId && (
                                        <p className={styles["status"]}>
                                            {message.status === "sent" ? (
                                                <span style={{ color: "grey" }}>✔</span>
                                            ) : (
                                                <span style={{ color: "green" }}>✔✔</span>
                                            )}
                                            {message.status}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                    <div ref={messagesEndRef} />
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


            {/* flashcard modal */}
            {showModal && (
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="auth-card">
                    <h2>Add Flashcard</h2>
                    <div className="mb-3">
                    <label>Flashcard Set</label>
                    <select
                        className="form-select"
                        value={selectedSetId ?? ""}
                        onChange={(e) => setSelectedSetId(e.target.value)}
                    >
                        {flashcardSets.map((set) => (
                        <option key={set.flashcardSetId} value={set.flashcardSetId}>
                            {set.flashcardSetName} ({set.language} → {set.learningLanguage})
                        </option>
                        ))}
                    </select>
                    </div>
                    <div className="mb-3">
                    <label>Front</label>
                    <input
                        type="text"
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                    />
                    </div>
                    <div className="mb-3">
                    <label>Back (optional)</label>
                    <input
                        type="text"
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                    />
                    </div>
                    <div className="auth-buttons">
                    <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => {
                        const temp = front;
                        setFront(back);
                        setBack(temp);
                        }}
                    >
                        Switch Front/Back
                    </button>
                    <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            if (!selectedSetId) {
                            alert("Please choose a flashcard set or create one on the Flashcard page.");
                            return;
                            }
                            if (!front.trim()) {
                            alert("Front side cannot be empty.");
                            return;
                            }
                            try {
                            await apiService.post(`/flashcards/${selectedSetId}`, {
                                contentFront: front,
                                ...(back ? { contentBack: back } : {}),
                            }, {
                                headers: {
                                Authorization: token,
                                "Content-Type": "application/json",
                                },
                            });
                            alert("Flashcard added!");
                            setShowModal(false);
                            } catch (err) {
                            console.error("Failed to add flashcard:", err);
                            alert("Something went wrong.");
                            }
                        }}
                        >
                        Confirm
                        </button>
                    </div>
                </div>
                </div>
            </div>
            )}



        </>
    );
};

export default ChatPage;