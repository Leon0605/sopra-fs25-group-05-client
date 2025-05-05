"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactDatePicker from "react-datepicker";
import { getApiDomain } from "@/utils/domain";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import Navbar from "../../components/Navbar";
import { useApi } from "@/hooks/useApi";
import { Button, Input, Form } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./UserProfile.module.css";
import dayjs from "dayjs";

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
  const [hasMounted, setHasMounted] = useState(false);
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<number>("userId", 0);
  const [users, setUsers] = useState<User[] | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "danger" | null>(null); // For success or error alerts
  const datePickerRef = useRef<ReactDatePicker | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const { value: notificationsEnabled, set: setNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !token) {
      router.push("/login");
    }
  }, [hasMounted, token]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileUserData = await apiService.get<User>(`/users/${id}`);
        console.log("Fetched user data:", profileUserData);

        const currentUserData = await apiService.get<User>(`/users/${userId}`);
        const users: User[] = await apiService.get<User[]>("/users");
        if (!users || users.length === 0) {
          router.push("/login");
          return;
        }
        setUsers(users);


        setUser(profileUserData);
        setIsFriend(currentUserData.friendsList?.includes(profileUserData.id) || false);
        setFriendRequestSent(currentUserData.sentFriendRequestsList?.includes(profileUserData.id) || false);
        setLanguage(profileUserData.language || "en");

      } catch (error) {
        console.error("Failed to fetch user:", error);
        showAlert("Failed to fetch user data from server.", "danger");
      } finally {
        setLoading(false);
      }
    };

    if (id && userId) {
      fetchUserData();
    }
  }, [apiService, id, userId]);


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
      const response = await fetch(`${getApiDomain()}/users/${id}/photo`, {
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

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return;
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    try {
      await apiService.put(`/users/${id}`, { language: newLanguage });
      showAlert("Language updated successfully", "success");
      const updatedUser = await apiService.get<User>(`/users/${id}`);
      setUser(updatedUser);
    } catch (err) {
      showAlert(`Failed to update language: ${err}`, "danger");
    }
  };

  const handleLearningLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return;
    const newLearningLanguage = event.target.value;
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

  const handlePrivacyChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return; // Ensure the logged-in user is updating their own profile
    const newPrivacy = event.target.value;
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
        `users/${id}/change-password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `${token}`, // Include the token in the Authorization header
            "Content-Type": "application/json",
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

  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
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
      <Navbar />
      <div className="card-container">
        <div className="auth-card" style={{ maxWidth: "900px", width: "100%", marginTop: "1rem" }}>
          <h2 style={{ color: "#5A639C", marginBottom: "2rem" }}>{user.username}</h2>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                position: "absolute",
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                backgroundColor: user.status === "ONLINE" ? "green" : "yellow", // Green if online, yellow if offline
                border: "2px solid white", // Optional border for better visibility
                top: "5px", // Adjust this to position the dot
                left: "50%", // Adjust this to position the dot
                transform: "translate(30px)", // Center the dot
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
                    border: "3px solid #9b86bd",
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
                    border: "3px solid #9b86bd",
                  }}
                />
              )}
            </div>
            {/* User views their own profile */}
            {user.id === userId && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{
                    marginTop: "10px",
                  }}
                />
                
                <div className="form-check form-switch d-flex align-items-center mb-3">
                  <label className="form-check-label me-2">Receive Notifications</label>
                  <input className="form-check-input" type="checkbox" id="notificationsSwitch"
                    checked={notificationsEnabled}
                    onChange={(e) => handleNotificationsToggle(e.target.checked)}/>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label">Birthday:</label>
                  <div className="col-sm-8">

                    <ReactDatePicker
                      ref={datePickerRef}
                      selected={user.birthday ? new Date(user.birthday) : null} // Convert birthday to a Date object
                      onChange={(date: Date | null) => handleBirthdayChange(date ? (date) : null)}
                      dateFormat="dd-MMM-yyyy"
                      className="custom-date-picker"
                    />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label">Language:</label>
                  <div className="col-sm-8">
                    <select className="form-select"
                      value={language}
                      onChange={handleLanguageChange}
                      disabled={user.id !== userId}
                      style={{
                        width: 200,
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "8px",
                      }}
                    >
                      <option value="en" style={{ color: "black" }}>English</option>
                      <option value="fr" style={{ color: "black" }}>French</option>
                      <option value="de" style={{ color: "black" }}>German</option>
                      <option value="es" style={{ color: "black" }}>Spanish</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label">Learning language:</label>
                  <div className="col-sm-8">
                    <select className="form-select"
                      value={user.learningLanguage || "en"}
                      onChange={handleLearningLanguageChange}
                      style={{
                        width: 200,
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "8px",
                      }}
                    >
                      <option value="en" style={{ color: "black" }}>English</option>
                      <option value="fr" style={{ color: "black" }}>French</option>
                      <option value="de" style={{ color: "black" }}>German</option>
                      <option value="es" style={{ color: "black" }}>Spanish</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label">Privacy:</label>
                  <div className="col-sm-8">
                    <select className="form-select"
                      value={user.privacy}
                      onChange={handlePrivacyChange}
                      style={{
                        width: 200,
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "8px",
                      }}
                    >
                      <option value="open" style={{ color: "black" }}>Open</option>
                      <option value="private" style={{ color: "black" }}>Private</option>
                    </select>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end", // Aligns the Select to the right
                  gap: "10px",
                  marginBottom: "30px",
                }}>
                  <div className="auth-buttons" style={{ justifyContent: "space-between" }}>
                    <button onClick={() => setIsPasswordFormVisible(!isPasswordFormVisible)} className="btn-secondary">{isPasswordFormVisible ? "Cancel" : "Change Password"}</button>
                    <button onClick={() => router.back()} className="btn-secondary">Go back</button>
                  </div>

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
                </div>
              </div>
            )}
            {/* End user views their own profile */}

            {/* User views friend or not-private page */}
            {(user.id !== userId) && (isFriend || user.privacy !== "private") && (
              <div>
                <div className={styles["flex-end-container"]}>
                  <p className="text-muted">Birthday: </p> <p className="text-muted">{user.birthday}</p>
                </div>
                <div className={styles["flex-end-container"]}>
                  <p className="text-muted">Language: </p> <p className="text-muted">{user.language}</p>
                </div>
                <div className={styles["flex-end-container"]}>
                  <p className="text-muted">Learning Language: </p> <p className="text-muted">{user.learningLanguage}</p>
                </div>
                <div className={styles["flex-end-container"]}>
                  <p className="text-muted">Privacy: </p> <p className="text-muted">{user.privacy === "private" ? "Private" : "Open"}</p>
                </div>

                <div className="auth-buttons" style={{ justifyContent: "space-between" }}>
                  <button
                    className="btn-secondary"
                    disabled={friendRequestSent || isFriend}
                    onClick={handleSendFriendRequest}
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
                  </button>

                  <button onClick={() => router.back()} className="btn-secondary">Go back</button>
                </div>
              </div>
            )}
            {/* End user views friend or not-private page */}

            {/* User views not-friend or private page */}
            {(user.id !== userId) && (!isFriend && user.privacy === "private") && (
              <div className="auth-buttons" style={{ justifyContent: "space-between" }}>
                <button
                  className="btn-secondary"
                  disabled={friendRequestSent || isFriend}
                  onClick={handleSendFriendRequest}
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
                </button>
                <button onClick={() => router.back()} className="btn-secondary">Go back</button>
              </div>
            )}
            {/* End user views not-friend or private page */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;