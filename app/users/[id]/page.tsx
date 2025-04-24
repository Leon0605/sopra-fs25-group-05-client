"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import Navbar from "../../components/Navbar";
import { useApi } from "@/hooks/useApi";
import { Card, Typography, Select, Spin, Button, Input, Form } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import dayjs from "dayjs";
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/js/bootstrap.bundle.min.js" 
  integrity="sha384-k6d4wzSIapyDyv1kpU366/PK5hCdSbCRGRCMv+eplOQJWyd1fbcAu9OCUj5zNLiq" 
  crossOrigin="anonymous"></script>

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  name: string;
  token: string | null;
  status: string | null;
  photo?: string; // Optional field for the user's photo URL
  birthday?: string; // Optional field for the user's birthday in ISO 8601 format
  email: string;
  language: string;
  learningLanguage?: string; // Optional property
  privacy: "private" | "open"; // Privacy setting
  online: boolean; // New property to indicate online status
  sentFriendRequestsList?: number[];
  receivedFriendRequestsList?: number[];
  friendsList?: number[];
}

const UserProfile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);
  const [form] = Form.useForm();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<number>("userId", 0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "danger" | null>(null); // For success or error alerts
  const datePickerRef = useRef<any>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const { value: notificationsEnabled, set: setNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiService.get<User>(`/users/${id}`);
        console.log("Fetched user data:", userData);
        setUser(userData);
        setFriendRequestSent(userData.receivedFriendRequestsList?.includes(Number(userId)) || false);
        setIsFriend(userData.friendsList?.includes(Number(userId)) || false);
        setLanguage(userData.language || "en");
      } catch (error) {
        console.error("Failed to fetch user:", error);
        showAlert("Failed to fetch user data from server.", "danger");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [apiService, id]);

  const showAlert = (message: string, type: "success" | "danger") => {
    setAlertMessage(message);
    setAlertType(type);

    // Automatically dismiss the alert after 3 seconds
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 3000);
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    showAlert(`Notifications ${checked ? "enabled" : "disabled"}`, "success");
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || user.id !== userId) return;
  
    const file = event.target.files?.[0];
    if (!file) return;

    // Log the file type for debugging
    console.log("File type:", file.type);
  
    // Check if the file is a PNG
    if (file.type !== "image/png") {
      showAlert("Profile pictures must be of a PNG format", "danger");
      return;
    }
  
    const formData = new FormData();
    formData.append("photo", file);

    // Log the file and FormData before sending
    console.log("Uploading photo for user:", user.id);
    console.log("File details:", file);
    console.log("Posting data to:", `/users/${id}/photo`);
    console.log("FormData contents:", formData.get("photo"));
  
    try {
      const response = await fetch(`http://localhost:8080/users/${id}/photo`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
  
      showAlert("Profile picture successfully updated", "success");
  
      // Fetch the updated user data to display the new photo
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      if (!updatedUser) {
        throw new Error("Failed to fetch updated user data");
      }
  
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to upload photo:", error);
      showAlert("Failed to upload profile photo", "danger");
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user || user.id !== userId) return;
    setLanguage(newLanguage);
    try {
      await apiService.put(`/users/${id}`, { language: newLanguage });
      showAlert("Language updated successfully", "success");
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      showAlert("Failed to update language", "danger");
    } 
  };

  const handleLearningLanguageChange = async (newLearningLanguage: string) => {
    if (!user || user.id !== userId) return;
    try {
      await apiService.put(`/users/${id}`, { learningLanguage: newLearningLanguage });
      showAlert(`Your learning language was successfully updated`, "success");

      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update learning language:", err);
      showAlert("Failed to update learning language", "danger");
    }
  };

  const handlePrivacyChange = async (newPrivacy: "private" | "open") => {
    if (!user || user.id !== userId) return; // Ensure the logged-in user is updating their own profile
    try {
      await apiService.put(`/users/${id}`, { privacy: newPrivacy });
      showAlert(`Privacy updated to ${newPrivacy}`, "success");
  
      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
      showAlert("Failed to update privacy setting", "danger");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      const response: Response = await apiService.post(`/users/${id}/friend-request`, {}, {
        headers: {
          Authorization: `${token}`,
        },
      });
  
      if (!response.ok) {
        console.error("Token: ", token);
        throw new Error("Failed to send friend request");
      }
      setFriendRequestSent(true);
      showAlert("Friend request sent successfully!", "success");
    } catch (error) {
      console.error("Failed to send friend request:", error);
      showAlert("Failed to send friend request", "danger");
    }
  };
  
  const handleBirthdayChange = async (date: Date | null) => {
    if (!user || user.id !== userId) return;
  
    try {
      const newBirthday = date ? dayjs(date).format("YYYY-MM-DD") : null; // Convert Date to Dayjs and format
      console.log("Selected date:", newBirthday);
    
      await apiService.put(`/users/${id}`, { birthday: newBirthday });
      // Show a success alert
      showAlert("Birthday updated successfully!", "success");
  
      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);

      // Remove focus from the date picker
      if (datePickerRef.current && datePickerRef.current.input) {
        datePickerRef.current.input.blur(); // Access the input element and call blur()
      }
    } catch (error) {
      console.error("Failed to update birthday:", error);
      // Show an error alert
      showAlert("Failed to update birthday.", "danger");
    }
  };

  const handlePasswordChange = async () => {
    try {
      const values = await form.validateFields(); // Validate the form fields
      const { oldPassword, newPassword, confirmPassword } = values;

      if (newPassword !== confirmPassword) {
        return showAlert("New passwords do not match!", "danger");
      }

      setLoading(true);

      const response: Response = await apiService.post(
        `/users/${id}/change-password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `${token}`, // Include the token in the Authorization header
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      showAlert("Password changed successfully!", "success");
      form.resetFields(); // Reset the form fields after successful submission
      setIsPasswordFormVisible(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      showAlert("Failed to change password", "danger");
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
    <div>
      {alertMessage && (
        <div
          className={`bubble-message ${alertType}`}
          style={{
            position: "fixed",
            top: "20px", // Adjust this to position the bubble
            left: "50%",
            transform: "translateX(-50%)", // Center horizontally
            backgroundColor: alertType === "success" ? "#4caf50" : "#f44336", // Green for success, red for danger
            color: "white",
            padding: "10px 20px",
            borderRadius: "20px",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            zIndex: 1050, // Ensure it appears above other elements
            textAlign: "center",
            maxWidth: "80%", // Optional: Limit the width of the bubble
          }}
        >
          {alertMessage}
        </div>
      )}
    <Navbar/>
    <div className="card-container" style={{ display: "flex", position: "relative" }}>
      <Card
        title={
          <Title level={3} style={{ color: "white" }}>
            {user?.username ? `${user.username}'s Profile` : "User Profile"}
          </Title>
        }
        style={{ backgroundColor: "#1f1f1f", color: "white" }}
      >
    
    <div
      style={{
        display: "flex",
        justifyContent: "space-between", // Pushes the switch to the right
        alignItems: "center", // Vertically aligns the text and switch
        marginBottom: "20px", // Optional: Add spacing below the row
      }}
    >
      <p style={{ margin: 0 }}>
        <Text strong style={{ color: "white" }}>Username:</Text> {user.username}
      </p>
      {user.id === userId && (
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="notificationsSwitch"
          checked={notificationsEnabled}
          onChange={(e) => handleNotificationsToggle(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="notificationsSwitch" style={{ color: "white" }}>
          Receive Notifications
        </label>
      </div>
      )}
    </div>

        <div
          style={{
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: user.status === "ONLINE" ? "green" : "yellow", // Green if online, yellow if offline
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
            <img
              src="/images/default-user.png" // Path to the generic user image
              alt="Default user profile"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "10px",
              }}
            />
          )}

          {user.id === userId && (
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
          {
            user.id === userId ? (
              <ReactDatePicker
                ref={datePickerRef}
                selected={user.birthday ? new Date(user.birthday) : null} // Convert birthday to a Date object
                onChange={(date: Date | null) => handleBirthdayChange(date ? (date) : null)}
                dateFormat="dd-MMM-yyyy"
                className="custom-date-picker"
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
            disabled={user.id !== userId}
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
          {user.id === userId ? (
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
          {user.id === userId ? (
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
          {user.id === userId && (
            <Button
              type="primary"
              onClick={() => setIsPasswordFormVisible(!isPasswordFormVisible)} // Toggle visibility
              style={{
                backgroundColor: "#4caf50", // Green button
                borderColor: "#4caf50",
              }}
            >
              {isPasswordFormVisible ? "Cancel" : "Change Password"}
            </Button>
          )}

          {isPasswordFormVisible && (
            <div className="passwordChange">
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <Button
                    type="primary"
                    onClick={handlePasswordChange} // Call the password change logic
                    loading={loading}
                  >
                    Change Password
                  </Button>
                  <Button onClick={() => setIsPasswordFormVisible(false)}>Cancel</Button>
                </div>
              </Form>
            </div>
          )}

          {user.id !== userId && (
            <Button
              type="primary"
              disabled={friendRequestSent || isFriend}
              onClick={handleSendFriendRequest} // ✅ THIS WAS MISSING
              style={{
                backgroundColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
                borderColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
              }}
            >
              {isFriend
                ? "Already Friends"
                : friendRequestSent
                ? "Friend Request Sent"
                : "Send Friend Request"}
            </Button>
          )}


          <Button onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </Card>
    </div>
    </div>
  );
};

export default UserProfile;
