"use client"; 

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Table } from "antd";
import type { TableProps } from "antd"; 

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Id",
    dataIndex: "id",
    key: "id",
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);

  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<string>("userId", "");
  

  const handleLogout = (): void => {
    clearToken();
    clearUserId();
    router.push("/login");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <div className="card-container">
      <div className="auth-card" style={{ maxWidth: "700px", width: "100%", marginTop: "1rem" }}>
        <h2 style={{ color: "#5A639C", marginBottom: "2rem" }}>Search Page</h2>
  
        {users && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  style={{
                    backgroundColor: "#E2BBE9",
                    border: "3px solid #9B86BD",
                    borderRadius: "1rem",
                    padding: "1rem 1.5rem",
                    color: "#5A639C",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d9a8e0")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E2BBE9")}
                >
                  👤 {user.username} <span style={{ fontWeight: "normal", fontSize: "0.9rem" }}>(ID: {user.id})</span>
                </div>
              ))}
            </div>
  
            <div className="auth-buttons" style={{ justifyContent: "space-between" }}>
              <button onClick={handleLogout} className="btn-primary">Logout</button>
              <button onClick={() => router.push("/main")} className="btn-secondary">Go to Main Page</button>
            </div>
          </>
        )}
      </div>
    </div>
  );  
};

export default Dashboard;