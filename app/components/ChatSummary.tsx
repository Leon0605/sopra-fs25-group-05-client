'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Chat } from '@/types/chat';
import useLocalStorage from "@/hooks/useLocalStorage";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./page.module.css";

interface ChatSummary {
    chatId: string;
    otherUser: { id: number; username: string; photo?: string };
    lastMessage: Message | null;
}

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

const colours = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0', "#A1FF33", "#33A1FF",
];
const userColors: { [key: string]: string } = {};

export default function ContactList({ selectedUserId }: { selectedUserId?: number }) {
    const router = useRouter();
    const apiService = useApi();
    const [chatIds, setChatIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { value: userId } = useLocalStorage<number>("userId", 0);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
    const { value: token } = useLocalStorage<string>("token", "");

    const fetchChatIdsAndUsers = async (token: string) => {
        console.log("CHATS token:", token); // Log the token to the console
        const userId = Number(localStorage.getItem("userId"));
        if (!userId || !token) {
            console.error("User ID or token is missing");
            return;
        }

        try {
            const chats = await apiService.get<Chat[]>("chats", {
                headers: { userId: userId.toString() },
            });
            console.log("CHATS fetched chat IDs (line 65):", chats); // Log the fetched data to the console

            const summaries: ChatSummary[] = await Promise.all(
                chats.map(async (chat) => {
                    // Find the other user's ID
                    const otherUserId = chat.userIds.find((id: number) => id !== userId);
                    console.log("CHATS otherUserId:", otherUserId); // Log the other user's ID
                    // Fetch the other user's info
                    const otherUser = await apiService.get<{ id: number; username: string; photo?: string }>(
                        `users/${otherUserId}`,
                        {
                            headers: {
                                Token: `${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );



                    // Fetch messages for this chat
                    const messages = await apiService.get<Message[]>(`chats/${chat.chatId}/${userId}`);
                    // Find the most recent message
                    const lastMessage =
                        messages.length > 0
                            ? messages.reduce((a, b) =>
                                new Date(a.timestamp || 0) > new Date(b.timestamp || 0) ? a : b
                            )
                            : null;

                    return {
                        chatId: chat.chatId,
                        otherUser,
                        lastMessage,
                    };
                })
            );

            // Sort by most recent message
            summaries.sort((a, b) => {
                const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return bTime - aTime;
            });

            setChatSummaries(summaries);
        } catch (error) {
            console.error("Error fetching chats or users:", error);
        }
    };

    // Assign a color to a user
    const getChatColor = (userId: number): string => {
        if (userColors[userId]) return userColors[userId];
        const color = colours[userId % colours.length];
        userColors[userId] = color;
        return color;
    };

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetchChatIdsAndUsers(token);
    }, [apiService, token]);


    return (
        <div className={styles.summaryContainer}>
            <p className={styles.previousHeader}>Previous Chats</p>
                {chatSummaries.map((summary) => {
                    console.log("Chat summary: ", summary)
                    return (
                        <div
                      key={summary.chatId}
                      className={styles.clickableRow}
                      onClick={() => router.push(`/chats/${summary.chatId}`)}
                    >
                      <img
                        src={summary.otherUser.photo || "/images/default-user.png"}
                        alt={`${summary.otherUser.username} avatar`}
                        className="rounded-circle me-2"
                        style={{ width: "32px", height: "32px", border: "2px solid #9B86BD" }}
                      />
                      <span
                        className="username"
                        style={{ color: "#5A639C", fontWeight: "bold" }}
                      >
                        {summary.otherUser.username}
                      </span>
                    </div>
                    );
                })}
        </div>
    );
}