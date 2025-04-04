"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Card, Typography, Select, Spin, Button, message } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

const UserProfile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);

  const [hasMounted, setHasMounted] = useState(false);
  const { clear: clearToken, value: token } = useLocalStorage<string>("token", "");
  const { clear: clearUserId, value: userId } = useLocalStorage<string>("userId", "");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<User>(`/users/${id}`);
        setUser(userData);
        setLanguage(userData.language || "en");
      } catch (error) {
        console.error("Failed to fetch user:", error);
        message.error("Failed to fetch user data from server.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [apiService, id]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user || String(user.id) !== userId) return;
    setLanguage(newLanguage);
    try {
      await apiService.put(`/users/${id}`, { language: newLanguage });
      message.success("Language updated successfully");
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      message.error("Failed to update language");
    } 
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="card-container">
      <Card
        title={
          <Title level={3} style={{ color: "white" }}>
            {user?.username ? `${user.username}'s Profile` : "User Profile"}
          </Title>
        }
        style={{ backgroundColor: "#1f1f1f", color: "white" }}
      >
        <p>
          <Text strong style={{ color: "white" }}>Username:</Text> {user.username}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          <Text strong style={{ color: "white" }}>Language:</Text>
          <Select
            value={language}
            onChange={handleLanguageChange}
            disabled={String(user.id) !== userId}
            style={{
              width: 200,
              backgroundColor: "white",
              color: "black",
              borderRadius: "8px",
            }}
            dropdownStyle={{
              backgroundColor: "white", // White dropdown background
              color: "black",           // Black text
            }}
            popupClassName="custom-dropdown" // Additional class for more control
          >
            <Option value="en" style={{ color: "black" }}>English</Option>
            <Option value="fr" style={{ color: "black" }}>French</Option>
            <Option value="de" style={{ color: "black" }}>German</Option>
          </Select>
        </div>

        <Button onClick={() => router.push("/users")}>Back to User Overview</Button>
      </Card>
    </div>
  );
};

export default UserProfile;
