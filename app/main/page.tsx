"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Typography, Spin } from "antd";
//import styles from "@/styles/page.module.css";

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<string>("userId", "");


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
      console.log("No token : redirected");
      router.push("/login");
    }
  }, [hasMounted, token, router]);

  


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);

        const matchedUser = users.find(user => String(user.id) === userId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
        console.log("Matched current user:", matchedUser);
        
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService, userId]);

  if (!hasMounted || !token || !users) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>

      <div style={{ marginBottom: 16, textAlign: "left" }}>
        {currentUser && <h2>Welcome, {currentUser.username}</h2>}
      </div>
      
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between"}}>
        <h1>Users</h1>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", width: "35%" }}>
          <Button onClick={() => router.push("/users")} type="primary">Go to User List</Button>
          <Button onClick={handleLogout} type="primary">Logout</Button>
        </div>
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
