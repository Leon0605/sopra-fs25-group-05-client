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
  const { clear: clearNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const [chatGroup, setChatGroup] = useState<number[]>([]);


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
        const users: User[] = await apiService.get<User[]>("users");
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
      router.push(`users/${userId}`);
      return;
    }

    try {
      const userChats = await apiService.get<Chat[]>("chats", {
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
        router.push(`chats/${privateChat.chatId}`);
      } else {
        alert("No private chat found with this user.");
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
      alert("Error checking chat.");
    }
  };

  function handleOnDrag(e: React.DragEvent<HTMLDivElement>, userId: number) {
    e.dataTransfer.setData("text/plain", String(userId));
  }

  function handleOnDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const addedUserId = parseInt(e.dataTransfer.getData("text/plain"), 10);

    setChatGroup((prevChatGroup) => {
      const updatedChatGroup = [...prevChatGroup];
      // Check if the userId already exists in the array
      if (!updatedChatGroup.includes(userId)) {
        updatedChatGroup.push(userId);
        console.log("Updated chatGroup: ", updatedChatGroup); // Log the updated state
      }
      // Check if the addedUserId already exists in the array
      if (!updatedChatGroup.includes(addedUserId)) {
        updatedChatGroup.push(addedUserId);
        console.log("Updated chatGroup: ", updatedChatGroup); // Log the updated state
        return updatedChatGroup;
      }
      return updatedChatGroup; // Return the original array if userId already exists
    });
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  const startChat = async () => {
    // check if userId is in the chatGroup
    if (!chatGroup.includes(userId)) {
      setChatGroup((prevChatGroup) => [...prevChatGroup, userId]);
      console.log("chatGroup after addition: ", chatGroup);
    }
    try {
      console.log("Starting chat with users:", chatGroup);
      // Fetch all chats for the current user
      const userChats = await apiService.get<Chat[]>("chats", {
        headers: { userId: String(userId) },
      });
      console.log("userChats:", userChats);

      if (!userId || chatGroup.length < 2) {
        alert("A minimum of two users are necessary for a chat.");
        return;
      }

      // Check if a chat already exists with all the users in userIds arry
      const existingChat = userChats.find((chat) => {
        const userIds = chat.userIds || [];
        console.log("userIds:", userIds);

        // if length of userIds == chatGroup.length && every user in chatGroup is in userIds
        // return the chat id

        return (userIds.length === chatGroup.length &&
          chatGroup.every((chatGroupUserId) => userIds.includes(chatGroupUserId)));
      });

      console.log("existingChat:", existingChat);
      if (existingChat) {
        console.log("Existing chat within true loop");
        console.log("Chat already exists with ID:", existingChat.chatId);
        // If a chat exists, navigate to it
        router.push(`chats/${existingChat.chatId}`);
      } else {
        // If no chat exists, create a new one
        console.log("From within else loop: ", chatGroup);
        const chatId = await apiService.post<string>("chats", chatGroup);
        console.log("Created chat ID:", chatId);
        //const chatId = await apiService.post<number>("chats", { userIds: widgets });
        router.push(`chats/${chatId}`);
      }
    } catch (err) {
      console.error("Failed to fetch or create chat:", err);
      alert("Error starting chat.");
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
                <div
                  draggable
                  onDragStart={(e) => {
                    if (user.id !== null) {
                      handleOnDrag(e, user.id);
                    }
                  }}
                  style={{ fontSize: "24px" }}>👤</div>
                <strong>{user.username}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="dropZone" onDrop={handleOnDrop} onDragOver={handleDragOver}
        style={{
          height: "200px", // Set a height
          width: "100%", // Set a width
          backgroundColor: "#f0f0f0", // Add a background color
          border: "2px dashed #ccc", // Add a dashed border
          display: "flex", // Center content
          justifyContent: "center",
          alignItems: "center",
          marginTop: "20px", // Add spacing from other elements
        }}>
        {chatGroup.map((member, index) => (
          <div className="member" key={index}>
            {member}
          </div>
        ))}
      </div>
      <button className="btn-secondary" onClick={startChat}>
        Start Chat
      </button>

    </div>
  );
};

export default Dashboard;
