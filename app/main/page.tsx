"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Chat } from "@/types/chat";
import "bootstrap/dist/css/bootstrap.min.css";
import OrbitDashboard from '@/components/OrbitDashboard';
import Navbar from "@/components/Navbar";


const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [friends, setFriends] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<number>("userId", 0);
  const { clear: clearNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false); //cursor on rocket
  const [isDragging, setIsDragging] = useState(false); //drag in process
  const [isHovered, setIsHovered] = useState(false);



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
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  window.addEventListener("dragstart", handleDragStart);
  window.addEventListener("dragend", handleDragEnd);

  return () => {
    window.removeEventListener("dragstart", handleDragStart);
    window.removeEventListener("dragend", handleDragEnd);
  };
}, []);


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


  const startChat = async () => {
    const chatGroup = groupMembers.map((u) => u.id);
    const groupToUse = (chatGroup.includes(userId)
      ? chatGroup
      : [...chatGroup, userId]
    ).filter((id): id is number => id !== null);

    try {
      if (!userId || groupToUse.length < 2) {
        alert("A minimum of two users are necessary for a chat.");
        return;
      }

      const userChats = await apiService.get<Chat[]>("chats", {
        headers: { userId: String(userId) },
      });

      const existingChat = userChats.find((chat) => {
        const userIds = chat.userIds || [];
        return (
          userIds.length === groupToUse.length &&
          groupToUse.every((id) => userIds.includes(id))
        );
      });

      if (existingChat) {
        router.push(`chats/${existingChat.chatId}`);
      } else {
        let chatName = "";

        if (groupToUse.length > 2) {
          chatName = prompt("Enter a name for the group chat:")?.trim() || "";
          if (!chatName) {
            alert("Group chat name is required.");
            return;
          }
        }

        const newChatId = await apiService.post<string>("chats", {
          userIds: groupToUse,
          chatName,
        });

        router.push(`chats/${newChatId}`);
      }
    } catch (err) {
      console.error("Failed to fetch or create chat:", err);
      alert("Error starting chat.");
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
  <div className="container-fluid min-vh-100 py-3 px-5"   style={{ color: "white", overflowX: "hidden", overflowY: "hidden", height: "100vh" }}>
    <Navbar />

    <div
      className="position-relative d-flex justify-content-center align-items-center"
      style={{ minHeight: "500px",  marginTop: "100px" }}
    >
      {/* Left interactive alien */}
      <img
        src="/images/alien.png"
        alt="Alien"
        draggable={false}
        style={{
          position: "fixed",
          left: "3vw",           // 2% from left edge of viewport
          bottom: "0vh",         // 2% from bottom edge of viewport
          width: "10vw",         // Size also in viewport width
          maxWidth: "140px",     // Prevent it from growing too large
          height: "auto",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          zIndex: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-50%) scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(-50%)")}
        onClick={() => alert("👽 Dont forget to train with your flashcards!")}
      />

      {/* Right drop-zone (Rocket) */}
      <div
        className="rocket-dropzone"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => {
          setIsDraggingOver(false);
          setIsHovered(false);
        }}
        onDrop={(e) => {
          const dropped = JSON.parse(e.dataTransfer.getData("application/json")) as User;
          setGroupMembers((prev) =>
            prev.find((u) => u.id === dropped.id) ? prev : [...prev, dropped]
          );
          setIsDraggingOver(false);
          setIsHovered(false);
        }}
        style={{
          position: "absolute",
          right: "4vw",             // small fixed margin from right edge
          top: "3vh",              // distance from top
          width: "22vw",            // width relative to viewport width
          height: "55vh",           // height relative to viewport height
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDraggingOver ? "rgba(255, 255, 255, 0.1)" : "transparent",
          zIndex: 10,
        }}
      >
        {/* Floating rocket image */}
        <img
          src="/images/rocket.png"
          alt="Rocket"
          className="floating-rocket"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 0,
          }}
        />

        {/* Text stays on top */}
        <span
          style={{
            position: "absolute",
            top: "-10px", // or 0 / 1rem depending on spacing needs
            left: "50%",
            transform: "translateX(-50%)",
            color: "#9B86BD",
            fontWeight: "bold",
            zIndex: 5,
            textAlign: "center",
          }}
        >
          Chat
        </span>

        {/* Overlay preview */}
        {(isDragging || isHovered || groupMembers.length > 0) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              height: "100%", // fill full height of the parent
              width: "100%",
              position: "absolute",
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: "10px",
              borderRadius: "12px",
              zIndex: 20,
              color: "white",
              textAlign: "center",
            }}
          >
            {/* Top section – group members */}
            <div style={{ width: "100%" }}>
              {groupMembers.length === 0 ? (
                <p>Drag friends here to chat with them 🚀</p>
              ) : (
                <ul className="list-inline mb-2">
                  {groupMembers.map((u) => (
                    <li
                      key={u.id}
                      className="list-inline-item badge bg-secondary p-2 me-2"
                    >
                      {u.username}
                      <button
                        className="btn btn-sm btn-light ms-2"
                        onClick={() =>
                          setGroupMembers((prev) =>
                            prev.filter((user) => user.id !== u.id)
                          )
                        }
                      >
                        ✖️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom section – buttons */}
            <div className="d-flex justify-content-center gap-2" style={{ width: "100%" }}>
              <button
                className="btn-primary"
                onClick={startChat}
                disabled={groupMembers.length < 1}
              >
                Go to Chat
              </button>
              <button
                className="btn-secondary"
                onClick={() => setGroupMembers([])}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Orbit */}
      <OrbitDashboard
        currentUser={currentUser}
        users={friends}
        onUserClick={handleUserClick}
      />

    </div>
  </div>
);


};

export default Dashboard;
