"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Card, Typography, Select, Spin, Button, message, DatePicker, Modal, Input, Form } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: string;
  username: string;
  name: string;
  photo?: string; // Optional field for the user's photo URL
  birthday?: string; // Optional field for the user's birthday in ISO 8601 format
  email: string;
  language: string;
  learningLanguage?: string; // Optional property
  privacy: "private" | "open"; // Privacy setting
  online: boolean; // New property to indicate online status
}

const UserProfile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || String(user.id) !== userId) return;
  
    const file = event.target.files?.[0];
    if (!file) return;
  
    // Check if the file is a PNG
    if (file.type !== "image/png") {
      message.error("Only PNG files are allowed.");
      return;
    }
  
    const formData = new FormData();
    formData.append("photo", file);
  
    try {
      const response = await fetch(`/users/${id}/photo`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
  
      message.success("Profile photo updated successfully");
  
      // Fetch the updated user data to display the new photo
      const updatedUser = await fetch(`/users/${id}`);
      if (!updatedUser.ok) {
        throw new Error("Failed to fetch updated user data");
      }
  
      const userData = await updatedUser.json();
      setUser(userData);
    } catch (error) {
      console.error("Failed to upload photo:", error);
      message.error("Failed to upload profile photo");
    }
  };

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

  const handleLearningLanguageChange = async (newLearningLanguage: string) => {
    if (!user || String(user.id) !== userId) return;
    try {
      await apiService.put(`/users/${id}`, { learningLanguage: newLearningLanguage });
      message.success("Learning language updated successfully");

      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update learning language:", err);
      message.error("Failed to update learning language");
    }
  };

  const handlePrivacyChange = async (newPrivacy: "private" | "open") => {
    if (!user || String(user.id) !== userId) return; // Ensure the logged-in user is updating their own profile
    try {
      await apiService.put(`/users/${id}`, { privacy: newPrivacy });
      message.success("Privacy setting updated successfully");
  
      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
      message.error("Failed to update privacy setting");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      const response = await fetch(`/users/${id}/friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to send friend request");
      }
  
      message.success("Friend request sent successfully!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
      message.error("Failed to send friend request");
    }
  };

  const handleBirthdayChange = async (date: dayjs.Dayjs | null) => {
    if (!user || String(user.id) !== userId) return;
  
    try {
      const newBirthday = date ? date.format("YYYY-MM-DD") : null; // Format the date as YYYY-MM-DD
      await apiService.put(`/users/${id}`, { birthday: newBirthday });
      message.success("Birthday updated successfully");
  
      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update birthday:", error);
      message.error("Failed to update birthday");
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // Reset the form fields when the modal is closed
  };

  const handlePasswordChange = async () => {
    try {
      const values = await form.validateFields(); // Validate the form fields
      const { oldPassword, newPassword, confirmPassword } = values;

      if (newPassword !== confirmPassword) {
        return message.error("New passwords do not match!");
      }

      setLoading(true);

      // Call the API to change the password
      const response = await fetch(`/users/${id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      message.success("Password changed successfully!");
      setIsModalVisible(false);
      form.resetFields(); // Reset the form fields after successful submission
    } catch (error) {
      console.error("Failed to change password:", error);
      message.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end", // Aligns the Select to the right
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
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: user.online ? "green" : "yellow", // Green if online, yellow if offline
            border: "2px solid white", // Optional border for better visibility
        }}
      ></div>

        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: user.online ? "green" : "yellow", // Green if online, yellow if offline
            border: "2px solid white", // Optional border for better visibility
          }}
        ></div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt={`${user.username}'s profile`}
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "10px",
              }}
            />
          ) : (
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                backgroundColor: "#ccc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ color: "#fff" }}>No Photo</span>
            </div>
          )}

          {String(user.id) === userId && (
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{
                marginTop: "10px",
              }}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          <Text strong style={{ color: "white" }}>Birthday:</Text>
          {String(user.id) === userId ? (
            <DatePicker
              value={user.birthday ? dayjs(user.birthday, "YYYY-MM-DD") : null}
              onChange={handleBirthdayChange}
              format="YYYY-MM-DD"
              style={{
                width: 200,
                backgroundColor: "lightgray",
                color: "black",
                borderRadius: "8px",
              }}
              popupStyle={{
                backgroundColor: "darkgray",
              }}
            />
          ) : (
            <Text style={{ color: "white" }}>
              {user.birthday ? dayjs(user.birthday).format("YYYY-MM-DD") : "Not specified"}
            </Text>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // Aligns the Select to the right
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
        

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // Aligns the Select to the right
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          <Text strong style={{ color: "white" }}>Learning Language:</Text>
          {String(user.id) === userId ? (
            <Select
              value={user.learningLanguage || "en"}
              onChange={handleLearningLanguageChange}
              style={{
                width: 200,
                backgroundColor: "white",
                color: "black",
                borderRadius: "8px",
              }}
              dropdownStyle={{
                backgroundColor: "white",
                color: "black",
              }}
            >
              <Option value="en" style={{ color: "black" }}>English</Option>
              <Option value="fr" style={{ color: "black" }}>French</Option>
              <Option value="de" style={{ color: "black" }}>German</Option>
              <Option value="es" style={{ color: "black" }}>Spanish</Option>
            </Select>
          ) : (
            <Text style={{ color: "white" }}>
              {user.learningLanguage || "Not specified"}
            </Text>
          )}
        </div>
        
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // Aligns the Select to the right
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          <Text strong style={{ color: "white" }}>Privacy:</Text>
          {String(user.id) === userId ? (
            <Select
              value={user.privacy}
              onChange={handlePrivacyChange}
              style={{
                width: 200,
                backgroundColor: "white",
                color: "black",
                borderRadius: "8px",
              }}
              dropdownStyle={{
                backgroundColor: "white",
                color: "black",
              }}
            >
              <Option value="open" style={{ color: "black" }}>Open</Option>
              <Option value="private" style={{ color: "black" }}>Private</Option>
            </Select>
          ) : (
            <Text style={{ color: "white" }}>
              {user.privacy === "private" ? "Private" : "Open"}
            </Text>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center", // Center the buttons horizontally
            gap: "20px", // Add a gap between the buttons
            marginTop: "20px", // Add some space above the buttons
          }}
        >
          {String(user.id) === userId && (
            <Button
              type="primary"
              onClick={showModal}
              style={{
                backgroundColor: "#4caf50", // Green button
                borderColor: "#4caf50",
              }}
            >
              Change Password
            </Button>
          )}

          {/* Password Change Modal */}
          <Modal
            title="Change Password"
            visible={isModalVisible}
            onOk={handlePasswordChange}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Change Password"
            cancelText="Cancel"
          >
            <Form form={form} layout="vertical">
              <Form.Item
                label="Old Password"
                name="oldPassword"
                rules={[{ required: true, message: "Please enter your old password!" }]}
              >
                <Input.Password placeholder="Enter old password" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[{ required: true, message: "Please enter your new password!" }]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                rules={[{ required: true, message: "Please confirm your new password!" }]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>
            </Form>
          </Modal>

          {String(user.id) !== userId && (
            <Button
              type="primary"
              onClick={handleSendFriendRequest}
              style={{
                backgroundColor: "#87CEEB", // Light blue color
                borderColor: "#87CEEB",
              }}
            >
              Send Friend Request
            </Button>
          )}

          <Button onClick={() => router.push("/users")}>
            Back to User Overview
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
