"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Chat } from "@/types/chat";
import "bootstrap/dist/css/bootstrap.min.css";
import OrbitDashboard from '@/components/OrbitDashboard';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [friends, setFriends] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<number>("userId", 0);
  const { clear: clearNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);

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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !token) {
      router.push("/login");
    }
  }, [hasMounted, token]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      if (!userId) return;

      const friendsData = await apiService.get<User[]>(
        `users/${userId}/friends`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const usersData = await apiService.get<User[]>(
        `/users`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const current = usersData.find((u) => u.id === userId);
      if (!current) throw new Error("Current user not found");

      setCurrentUser(current);
      setFriends(friendsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  fetchData();
}, [userId, apiService]);



  const handleUserClick = async (clickedUser: User, isCurrentUser: boolean = false) => {
    if (!clickedUser.id || !userId) return;

    if (isCurrentUser) {
      router.push(`/users/${userId}`);
      return;
    }

    try {
      const userChats = await apiService.get<Chat[]>("chats", {
        headers: { userId: String(userId) },
      });

      const privateChat = userChats.find((chat) => {
        const ids = chat.userIds || [];
        return ids.length === 2 && ids.includes(clickedUser.id!) && ids.includes(userId!);
      });

      if (privateChat) {
        router.push(`chats/${privateChat.chatId}`);
      } else {
        alert("No private chat found with this user.");
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
      alert("Error checking chat.");
    }
  };

  if (!hasMounted || !token || !currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }


  return (
    <div className="container-fluid min-vh-100 py-3 px-5" style={{ color: "white" }}>
      <div className="mb-2">
        {currentUser && <h2>Welcome, {currentUser.username}</h2>}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1>Users</h1>
        <div className="d-flex gap-2">
          <button className="btn-primary" onClick={() => router.push("/users")}>
            Go to User List
          </button>
          <button className="btn-primary" onClick={() => router.push("/friends")}>
            Go to Friend List
          </button>
          <button className="btn-primary" onClick={() => router.push("/flashcards")}>
            Go to Flashcard List
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {currentUser && friends && (
        <OrbitDashboard
          currentUser={currentUser}
          users={friends}
          onUserClick={handleUserClick}
        />
      )}




    </div>
  );
};

export default Dashboard;
