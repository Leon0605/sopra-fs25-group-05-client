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
  otherUser: {
    id: number;
    username: string;
    photo?: string;
  };
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

export default function ContactList({  }: { selectedUserId?: number }) {
    const router = useRouter();
    const apiService = useApi();
    const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
    const { value: token } = useLocalStorage<string>("token", "");

    const fetchChatIdsAndUsers = async (token: string) => {
        const userId = Number(localStorage.getItem("userId"));
        if (!userId || !token) {
            console.error("User ID or token is missing");
            return;
        }

        try {
            const chats = await apiService.get<Chat[]>("chats", {
                headers: { userId: userId.toString() },
            });

            const summaries: ChatSummary[] = await Promise.all(
                chats.map(async (chat) => {
                    // Find the other user's ID
                    const otherUserId = chat.userIds.find((id: number) => id !== userId);
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
                        otherUser: {
                            id: 0,
                            username: chat.userIds.length >= 3
                            ? chat.name ?? "Unnamed Group"
                            : otherUser.username ?? "Unknown",

                            photo: chat.userIds.length >= 3
                            ? "/images/default-group.png"
                            : otherUser.photo || "/images/default-user.png",
                        },
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

    useEffect(() => {
        if (!token) return;
        fetchChatIdsAndUsers(token);
    }, [apiService, token]);


    return (
        <div className={styles.summaryContainer}>
            <p className={styles.previousHeader}>Previous Chats</p>
                {chatSummaries.map((summary) => {
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