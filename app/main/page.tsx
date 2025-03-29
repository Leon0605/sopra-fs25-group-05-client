"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Typography } from "antd";
//import styles from "@/styles/page.module.css";

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);

  const { clear: clearToken } = useLocalStorage<string>("token", "");

  const handleLogout = (): void => {
    clearToken();
    router.push("/login");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
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
  }, [apiService]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
        <h1>Users</h1>
        <Button onClick={handleLogout} type="primary">Logout</Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "16px",
          padding: "16px",
          justifyItems: "center"
        }}
      >
        {users?.map((user) => (
          <Card
            key={user.id}
            hoverable
            onClick={() => router.push(`/chats/${user.id}`)}
            style={{
              width: 120,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div style={{ fontSize: "24px" }}>👤</div>
            <Text strong>{user.username}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
