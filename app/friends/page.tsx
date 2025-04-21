"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

const FriendsPage: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const { value: userId } = useLocalStorage<number>("userId", 0);
  const { value: token } = useLocalStorage<string>("token", "");

  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId === null) return;

        const [friendsData, incomingData, users] = await Promise.all([
          apiService.get<User[]>(`/users/${userId}/friends`),
          apiService.get<User[]>(`/users/${userId}/friend-request`),
          apiService.get<User[]>(`/users`),
        ]);

        const currentUser = users.find((u) => u.id === userId);
        const pendingIds = currentUser?.sentFriendRequestsList || [];
        const pending = users.filter((u) => pendingIds.includes(u.id || 0));

        setFriends(friendsData);
        setIncomingRequests(incomingData);
        setPendingRequests(pending);
      } catch (err) {
        console.error("Error fetching friends/requests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const acceptRequest = async (senderId: number) => {
    if (!userId) return;

    try {
      await fetch(`http://localhost:8080/users/${userId}/friend-request`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          senderUserId: senderId.toString(),
        },
      
      });

      const acceptedUser = incomingRequests.find((u) => u.id === senderId);
      if (acceptedUser) setFriends((prev) => [...prev, acceptedUser]);
      setIncomingRequests((prev) => prev.filter((u) => u.id !== senderId));
      setPendingRequests((prev) => prev.filter((u) => u.id !== senderId));
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="card-container">
      <div className="auth-card" style={{ maxWidth: "900px", width: "100%", marginTop: "1rem" }}>
        <h2 style={{ color: "#5A639C", marginBottom: "2rem" }}>Friends</h2>
  
        <h4 style={{ color: "#5A639C" }}>Your Friends</h4>
        <div className="mb-4">
          {friends.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {friends.map((user) => (
                <li key={user.id} style={{ marginBottom: "0.75rem", color: "#5A639C", fontWeight: "bold" }}>
                  👤 {user.username}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">You have no friends yet.</p>
          )}
        </div>
  
        <h4 style={{ color: "#5A639C" }}>Incoming Friend Requests</h4>
        <div className="mb-4">
          {incomingRequests.length > 0 ? (
            incomingRequests.map((user) => (
              <div key={user.id} className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ color: "#5A639C", fontWeight: "bold" }}>{user.username}</span>
                <button className="btn btn-primary" onClick={() => acceptRequest(user.id!)}>
                  Accept
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted">No incoming requests.</p>
          )}
        </div>
  
        <h4 style={{ color: "#5A639C" }}>Pending Friend Requests</h4>
        <div className="mb-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((user) => (
              <div key={user.id} className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ color: "#5A639C", fontWeight: "bold" }}>{user.username}</span>
                <span className="badge bg-warning text-dark">Pending</span>
              </div>
            ))
          ) : (
            <p className="text-muted">No pending requests.</p>
          )}
        </div>
  
        <div className="auth-buttons">
          <button className="btn btn-secondary" onClick={() => router.push("/main")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );  
};

export default FriendsPage;
