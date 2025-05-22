"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import "bootstrap/dist/css/bootstrap.min.css";
// import { headers } from "next/headers";
import Navbar from "@/components/Navbar";


const FriendsPage: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const { value: userId } = useLocalStorage<number>("userId", 0);
  const { value: token } = useLocalStorage<string>("token", "");
  const [hasMounted, setHasMounted] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [friendSearch, setFriendSearch] = useState<string>("");

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
      if (hasMounted)
{      try {
          if (userId === null) return;

          const [friendsData, incomingData,currentUser, users] = await Promise.all([
            apiService.get<User[]>(`users/${userId}/friends`),
            apiService.get<User[]>(`users/${userId}/friend-request`),
            apiService.get<User>(`users/${userId}`, {
              headers: {
                Token: token,
              },
            }),
            apiService.get<User[]>(`users`),
          ]);
          
          const pendingIds = currentUser?.sentFriendRequestsList || [];
          const pending = users.filter((u) => pendingIds.includes(u.id || 0));
          console.log(pending)
          
          setUsers(users);
          setFriends(friendsData);
          setIncomingRequests(incomingData);
          setPendingRequests(pending);
        } catch (err) {
          console.error("Error fetching friends/requests", err);
      } }
    };

    fetchData();
  }, [userId, apiService]);

  const handleRequest = async (senderId: number,acceptStatus: string) => {
    if (!userId) return;

    try {
      await apiService.put<void>(
        `/users/${userId}/friend-request`,
        null,
        {
          headers: {
            Authorization: token,
            senderUserId: senderId.toString(),
            Accept: acceptStatus, // or "false" depending on logic
          },
        }
      );


      const acceptedUser = incomingRequests.find((u) => u.id === senderId);
      if (acceptedUser && acceptStatus === "true") setFriends((prev) => [...prev, acceptedUser]);
      setIncomingRequests((prev) => prev.filter((u) => u.id !== senderId));
      setPendingRequests((prev) => prev.filter((u) => u.id !== senderId));
    } catch (err) {
      console.error("Failed to accept request:", err);
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
      <Navbar />
      <div className="card-container">
        <div
          className="auth-card"
          style={{
            maxWidth: "900px",
            maxHeight:"28rem",
            width: "100%",
            marginTop: "90px",
            display: "flex",
            flexDirection: "column"
          }}
        >
        <h2 style={{ color: "#5A639C", marginBottom: "1rem" }}>Friends</h2>

        <div className="panels">
          <div className="panel">
            <div className="panel-header">
              <h4 style={{ color: "#5A639C" }}>Your Friends</h4>
              <input
                type="text"
                className="form-control mb-2 search-input"
                placeholder="Search friends..."
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
              />
            </div>
            <div className="panel-list">
              {friends.length > 0 ? (
                friends
                  .filter((user) => user.username?.toLowerCase().includes(friendSearch.toLowerCase()))
                  .map((user) => (
                    <div
                      key={user.id}
                      className="clickable-row d-flex align-items-center mb-2 p-2"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      <img
                        src={user.photo || "/images/default-user.png"}
                        alt={`${user.username} avatar`}
                        className="rounded-circle me-2"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span
                        className="username"
                        style={{ color: "#5A639C", fontWeight: "bold" }}
                      >
                        {user.username}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-muted">You have no friends yet.</p>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h4 style={{ color: "#5A639C" }}>Incoming Friend Requests</h4>
            </div>
            <div className="panel-list">
              {incomingRequests.length > 0 ? (
                incomingRequests.map((user) => (
                  <div
                    key={user.id}
                    className="d-flex align-items-center mb-2 p-2 justify-content-between"
                  >
                    <div
                      className="d-flex align-items-center flex-grow-1 me-2 clickable-row"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      <img
                        src={user.photo || "/images/default-user.png"}
                        alt={`${user.username} avatar`}
                        className="rounded-circle me-2"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span
                        className="username"
                        style={{ color: "#5A639C", fontWeight: "bold" }}
                      >
                        {user.username}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleRequest(user.id? user.id: 0, "true")}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRequest(user.id? user.id: 0, "false")}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No incoming requests.</p>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h4 style={{ color: "#5A639C" }}>Pending Friend Requests</h4>
            </div>
            <div className="panel-list">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((user) => (
                  <div
                    key={user.id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2"
                  >
                    <div
                      className="d-flex align-items-center clickable-row"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      <img
                        src={user.photo || "/images/default-user.png"}
                        alt={`${user.username} avatar`}
                        className="rounded-circle me-2"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span
                        className="username"
                        style={{ color: "#5A639C", fontWeight: "bold" }}
                      >
                        {user.username}
                      </span>
                    </div>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                ))
              ) : (
                <p className="text-muted">No pending requests.</p>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      <style jsx>{`
        .auth-card {
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .panels {
          display: flex;
          gap: 1rem;
          flex: 1;        
          overflow: hidden;
        }
        .panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .panel-list {
          
          height: min(18rem, 80vh);
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .panel-header {
          min-height: 6rem;
          margin-bottom: 0.5rem;
        }
        .clickable-row {
          cursor: pointer;
          box-sizing: border-box;
          border: 1px solid transparent;
          transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
          flex-grow: 1;
          width: 100%;
        }
        .clickable-row:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(90, 99, 156, 0.5);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
        }
        .username {
          max-width: 120px;
          display: inline-block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }
        .auth-buttons {
          margin-top: auto;
        }
        
        :global(.btn-success) {
          background-color:rgb(104, 50, 212) !important;
          border-color: rgb(104, 50, 212) !important;
        }
        :global(.btn-success:hover) {
          background-color: rgb(66, 31, 136) !important;
          border-color: rgb(66, 31, 136)  !important;
        }
        :global(.btn-danger) {
          background-color:rgb(163, 16, 94) !important;
          border-color: rgb(163, 16, 94) !important;
        }
        :global(.btn-danger:hover) {
          background-color: rgb(123, 12, 72) !important;
          border-color: rgb(123, 12, 72) !important;
        }
        .search-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 20px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: inherit;
        }
        .search-input::placeholder {
          color: rgba(90, 99, 156, 0.7);
        }
      `}</style>
    </>
  );
};

export default FriendsPage;