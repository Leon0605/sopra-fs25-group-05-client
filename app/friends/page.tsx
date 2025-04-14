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
    <div className="d-flex justify-content-center align-items-start vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: '100%', maxWidth: '1000px' }}>
        <h2 className="mb-4">Your Friends</h2>
        <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
          {friends.length > 0 ? (
            friends.map((user) => (
              <div key={user.id} className="col">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <h5 className="card-title">{user.username}</h5>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">You have no friends yet.</p>
          )}
        </div>
  
        <h3 className="mt-5">Incoming Friend Requests</h3>
        <div className="row row-cols-1 row-cols-md-2 g-3 mb-4">
          {incomingRequests.length > 0 ? (
            incomingRequests.map((user) => (
              <div key={user.id} className="col">
                <div className="card h-100 text-center">
                  <div className="card-body">
                    <h5 className="card-title">{user.username}</h5>
                    <button
                      className="btn btn-success"
                      onClick={() => acceptRequest(user.id!)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No incoming requests.</p>
          )}
        </div>
  
        <h3 className="mt-5">Pending Friend Requests</h3>
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((user) => (
              <div key={user.id} className="col">
                <div className="card h-100 text-center">
                  <div className="card-body">
                    <h5 className="card-title">{user.username}</h5>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No pending requests.</p>
          )}
        </div>
  
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={() => router.push("/main")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );  
};

export default FriendsPage;
