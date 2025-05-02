"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Chat } from "@/types/chat";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<number>("userId", 0);
  const { clear: clearNotificationsEnabled} = useLocalStorage<boolean>("notificationsEnabled", false);
  

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
    const fetchUsers = async () => {
      try {
        const users: User[] = await apiService.get<User[]>("/users");
        if (!users || users.length === 0) {
          router.push("/login");
          return;
        }
        setUsers(users);

        const matchedUser = users.find((user) => user.id === Number(userId));
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        router.push("/login");
      }
    };

    fetchUsers();
  }, [apiService, userId, router]);

  const handleUserClick = async (clickedUser: User) => {
    if (clickedUser.id === userId) {
      router.push(`/users/${userId}`);
      return;
    }

    try {
      const userChats = await apiService.get<Chat[]>("/chats", {
        headers: { userId: String(userId) },
      });
      console.log("userChats:", userChats);

      if (clickedUser.id == null || userId == null) return;

      const privateChat = userChats.find((chat) => {
        const userIds = chat.userIds || [];
        return (
          userIds.length === 2 &&
          userIds.includes(clickedUser.id!) &&
          userIds.includes(userId!)
        );
      });
      
      if (privateChat) {
        router.push(`/chats/${privateChat.chatId}`);
      } else {
        alert("No private chat found with this user.");
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
      alert("Error checking chat.");
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
    <div className="container-fluid min-vh-100 py-4 px-5" style={{ color: "white" }}>
      <div className="mb-4">
        {currentUser && <h2>Welcome, {currentUser.username}</h2>}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
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

      <div className="row g-3">
        {users.map((user) => (
          <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={user.id}>
            <div
              className="card text-center"
              style={{
                backgroundColor: "#E2BBE9",
                color: "#e8e7e8",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onClick={() => handleUserClick(user)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div
                className="card-body d-flex flex-column justify-content-center align-items-center"
                style={{ height: "120px" }}
              >
                <div style={{ fontSize: "24px" }}>👤</div>
                <strong>{user.username}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
