"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<number>("userId", 0);

  const handleLogout = (): void => {
    clearToken();
    clearUserId();
    router.push("/login");
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !token) {
      router.push("/login");
    }
  }, [hasMounted, token, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        const matchedUser = users.find((user) => user.id === Number(userId));
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [apiService, userId]);

  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }

  return (
    <div
      className="container-fluid min-vh-100 py-4 px-5"
      style={{ backgroundColor: "#7776B3", color: "#e8e7e8" }}
    >
      <div className="mb-4">
        {currentUser && <h2>Welcome, {currentUser.username}</h2>}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Users</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={() => router.push("/users")}>
            Go to User List
          </button>
          <button className="btn btn-light" onClick={() => router.push("/friends")}>
            Go to Friend List
          </button>
          <button className="btn btn-outline-light" onClick={handleLogout}>
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
              onClick={() => router.push(`/chats/${user.id}`)}
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
