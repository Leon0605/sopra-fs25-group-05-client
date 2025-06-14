"use client";

import React, { useEffect, useState, useRef } from "react";

import DatePicker from "react-datepicker";
import { Chat } from "@/types/chat";
import { getApiDomain } from "@/utils/domain";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useRouter } from "next/navigation";
import { useAlert } from "@/components/alertContext";
import useLocalStorage from "@/hooks/useLocalStorage";
import Navbar from "../../components/Navbar";
import { useApi } from "@/hooks/useApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";
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
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMounted, setHasMounted] = useState(false);
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<number>("userId", 0);
  const [users, setUsers] = useState<User[] | null>(null);
  const { showAlert } = useAlert();
  const datePickerRef = useRef<DatePicker | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const { value: notificationsEnabled, set: setNotificationsEnabled } = useLocalStorage<boolean>("notificationsEnabled", false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const passWordPopupRef = useRef<HTMLDivElement>(null);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [, setLearningLanguageLoading] = useState(false);

  const languageMap: { [key: string]: string } = {
    en: "English",
    fr: "French",
    de: "German",
    it: "Italian",
    es: "Spanish",

    // Add more as needed
  };

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
        if (!token) {
          router.push("/login");
          return;
        }

        const profileUserData = await apiService.get<User>(`users/${id}`, {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });

        profileUserData.privacy = profileUserData.privacy || "private"; // Default to "private" if undefined

        const currentUserData = await apiService.get<User>(`users/${userId}`, {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
        const users: User[] = await apiService.get<User[]>("users");

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
        alert("Failed to fetch user data from server. Redirecting to login.");
        // redirect to login page
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    if (id && userId) {
      fetchUserData();
    }
  }, [apiService, id, userId]);


  // useEffect so password popup closes if uses clicks outside the element
  useEffect(() => {
    if (!isPasswordFormVisible) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        passWordPopupRef.current &&
        !passWordPopupRef.current.contains(target)
      ) {
        setIsPasswordFormVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPasswordFormVisible]);

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    showAlert(`Notifications ${checked ? "enabled" : "disabled"}`, "success");
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || user.id !== userId) return;

    const file = event.target.files?.[0];
    if (!file) return;


    // Check if the file is a PNG
    if (file.type !== "image/png") {
      showAlert("Profile pictures must be of a PNG format", "danger");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(`${getApiDomain()}users/${id}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      showAlert("Profile picture successfully updated", "success");

      // Fetch the updated user data to display the new photo

      const updatedUser = await apiService.get<User>(`/users/${id}`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
      if (!updatedUser) {
        throw new Error("Failed to fetch updated user data");
      }

      setUser(updatedUser);
    } catch (Error) {
      console.error("Failed to upload photo:", Error);
      showAlert("Failed to upload profile photo", "danger");
    }
  };
  const redirectToChat = async () => {
    if (!user) {
      return;
    }
    const chats = await apiService.get<Chat[]>("chats", {
      headers: { userId: String(userId) },
    })

    const privateChat = chats.find((chat) => {
      const ids = chat.userIds || [];
      return ids.length === 2 && ids.includes(user.id!) && ids.includes(userId!)
    })
    if (privateChat == null) {
      const newChat = await apiService.post<Response>("/chats", {
        userIds: [user.id!, userId!],
        chatName: null
      })
      const newChatId = await newChat.text();
      router.push("/chats/" + newChatId)
    } else {
      router.push("/chats/" + privateChat.chatId)
    }
  }
  const handleDeletePhoto = async () => {
    try {
      await apiService.delete(`users/${id}/photo`, {
        headers: { Token: token },
      });
      showAlert("Profile photo deleted", "success");
      // Optionally fetch updated user data
      const updatedUser = await apiService.get<User>(`users/${id}`, {
        headers: { Token: token },
      });
      setUser(updatedUser);
    } catch (error) {
      showAlert(`Failed to delete profile photo (${error})`, "danger");
    }
  }


  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return;
    const newLanguage = event.target.value;
    setLanguage(newLanguage);

    setLanguageLoading(true);
    showAlert("Updating language...", "success");

    try {
      await apiService.put(`users/${id}`, { language: newLanguage });
      showAlert("Language updated successfully", "success");

      const updatedUser = await apiService.get<User>(`/users/${id}`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });

      setUser(updatedUser);
    } catch (err) {
      showAlert(`Failed to update language: ${err}`, "danger");
    } finally {
      setLanguageLoading(false);
    }
  };

  const handleLearningLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return;
    const newLearningLanguage = event.target.value;
    
    setLearningLanguageLoading(true);
    showAlert("Updating learning language...", "success");

    try {
      await apiService.put(`users/${id}`, { learningLanguage: newLearningLanguage });
      showAlert(`Your learning language was successfully updated`, "success");

      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
      setUser(updatedUser);
    } catch (err) {
      showAlert(`Failed to update learning language: ${err}`, "danger");
    } finally {
      setLearningLanguageLoading(false);
    }
  };

  const handlePrivacyChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    if (!user || user.id !== userId) return; // Ensure the logged-in user is updating their own profile
    const newPrivacy = event.target.value;
    try {
      await apiService.put(`users/${id}`, { privacy: newPrivacy });
      showAlert(`Privacy updated to ${newPrivacy}`, "success");

      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
      showAlert(`Failed to update privacy setting ${err}`, "danger");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      const response: Response = await apiService.post(`users/${id}/friend-request`, {}, {
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

      await apiService.put(`users/${id}`, { birthday: newBirthday });
      // Show a success alert
      showAlert("Birthday updated successfully!", "success");

      // Fetch the updated user data to reflect the changes
      const updatedUser = await apiService.get<User>(`/users/${id}`,
        {
          headers: {
            Token: `${token}`,
            "Content-Type": "application/json",
          },
        });
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

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the default form submission behavior
    // Validate the form fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert("All fields are required.", "danger");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("New passwords do not match!", "danger");
      return;
    }

    try {
      setLoading(true);

     
      

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showAlert("Password changed successfully!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Hide the password form
      setIsPasswordFormVisible(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      showAlert("Failed to change password.", "danger");
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
    <>
      <Navbar notificationsEnabled={notificationsEnabled} />
      <style jsx global>{`
        .info-tooltip-container {
          display: inline-block;
          position: relative;
        }
        .info-circle {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: 22px;
          height: 22px;
          background: #9b86bd;
          color: white;
          border-radius: 50%;
          font-weight: bold;
          font-size: 16px;
          margin-left: 10px;
          cursor: pointer;
          transition: background 0.2s;
          border: 1.5px solid #5A639C;
        }
        .info-circle:hover {
          background: #7a6bb5;
        }
        .info-tooltip {
          visibility: hidden;
          opacity: 0;
          background: white;
          color: #5A639C;
          text-align: left;
          border-radius: 10px;
          border: 1.5px solid #9b86bd;
          padding: 12px 16px;
          position: absolute;
          left: 30px;
          top: 0;
          z-index: 99;
          width: 230px;
          /* Damit der Text umbricht und die Box in der Höhe wächst */
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          box-shadow: 0 4px 16px rgba(120, 80, 170, 0.13);
          font-size: 15px;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
        }
        .info-tooltip-container:hover .info-tooltip,
        .info-tooltip-container:focus-within .info-tooltip {
          visibility: visible;
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
      <div className="card-container" style={{ marginTop: "75px" }}>
        <div className="auth-card" style={{ maxWidth: "900px", maxHeight: "900px", width: "100%", marginTop: "0rem" }}>
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
                top: "3px", // Adjust this to position the dot
                left: "50%", // Adjust this to position the dot
                transform: "translate(30px)", // Center the dot
                zIndex: 1, // Ensure the dot is above the image
              }}
            ></div>

            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={`${user.username}'s profile`}
                  style={{
                    width: "175px",
                    height: "175px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "5px",
                    border: "3px solid #9b86bd",
                  }}
                />
              ) : (
                <img
                  src="/images/default-user.png" // Path to the generic user image
                  alt="Default user profile"
                  style={{
                    width: "175px",
                    height: "175px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "5px",
                    border: "3px solid #9b86bd",
                  }}
                />
              )}

              {user.id === userId && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    id="photo-upload"
                    style={{ display: "none" }}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    style={{
                      position: "absolute",
                      bottom: "0px",
                      left: "80px", // adjust as needed for your design
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      zIndex: 2,
                    }}
                    title="Upload Photo"
                  >
                    <i className="bi bi-camera" />
                  </button>

                  {user.photo && user.photo !== "/images/default-user.png" && (
                    <>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={handleDeletePhoto}
                        style={{
                          position: "absolute",
                          bottom: "0px",
                          right: "80px", // adjust as needed for your design
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          zIndex: 2,
                        }}
                        title="Delete Photo"
                      >
                        <i className="bi bi-trash" style={{ margin: 0 }} />
                      </button>
                    </>
                  )}
                </>
              )}

            </div>
            {/* User views their own profile */}
            {user.id === userId && (
              <div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">Receive Notifications: </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notificationsSwitch"
                        checked={notificationsEnabled}
                        onChange={(e) => handleNotificationsToggle(e.target.checked)}
                        style={{
                          backgroundColor: notificationsEnabled ? "rgb(119, 118, 179)" : "",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label">Birthday:</label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <DatePicker
                      className="custom-date-picker"
                      ref={datePickerRef}
                      selected={user.birthday ? new Date(user.birthday) : null} // Convert birthday to a Date object
                      onChange={(date: Date | null) => handleBirthdayChange(date ? (date) : null)}
                      onChangeRaw={(e) => {
                        if (e && e.target instanceof HTMLInputElement && e.target.value === "") {
                          handleBirthdayChange(null);
                        }
                      }}
                      dateFormat="dd-MMM-yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      popperPlacement="right-start"
                      maxDate={new Date()} // Prevent future dates
                      placeholderText="Select your birthday"
                    />
                  </div>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label text-nowrap" style={{ display: "flex", alignItems: "center" }}>
                    Language:
                    <span className="info-tooltip-container">
                      <span className="info-circle">?</span>
                      <span className="info-tooltip">
                        Select the language you prefer to read and write. Incoming messages will be automatically translated into this language.
                      </span>
                    </span>
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <select className="form-select"
                      value={language}
                      onChange={handleLanguageChange}
                      disabled={user.id !== userId || languageLoading}
                    >
                      {Object.entries(languageMap).map(([code, name]) => (
                        <option key={code} value={code} style={{ color: "black" }}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label text-nowrap" style={{ display: "flex", alignItems: "center" }}>
                    Learning language:
                    <span className="info-tooltip-container">
                      <span className="info-circle">?</span>
                      <span className="info-tooltip">
                        Select the language you want to learn. This determines the target language into which your flashcards will be translated.
                      </span>
                    </span>
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
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
                      {Object.entries(languageMap).map(([code, name]) => (
                        <option key={code} value={code} style={{ color: "black" }}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3 row">
                  <label className="col-sm-4 col-form-label text-nowrap" style={{ display: "flex", alignItems: "center" }}>
                    Privacy:
                    <span className="info-tooltip-container">
                      <span className="info-circle">?</span>
                      <span className="info-tooltip">
                        <b>Private</b>: Only friends can view your profile and start chats with you.<br/>
                        <b>Open</b>: All users can view your profile and initiate chats.
                      </span>
                    </span>
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <select className="form-select"
                      value={user.privacy || "open"}
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
                    {!isPasswordFormVisible && (
                      <button onClick={() => setIsPasswordFormVisible(!isPasswordFormVisible)}
                        className="btn-secondary">Change Password</button>
                    )}
                    <button onClick={() => router.back()} className="btn-secondary">Go back</button>
                  </div>

                  {isPasswordFormVisible && (
                    <div className="passwordChange" ref={passWordPopupRef}>
                      <form onSubmit={handlePasswordChange}>
                        <div>
                          <label htmlFor="oldPassword">Password:</label>
                          <input
                            type="password"
                            id="oldPassword"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            placeholder="Enter old password"
                          />
                        </div>

                        <div>
                          <label htmlFor="newPassword">New Password:</label>
                          <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword">Confirm new Password:</label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button
                            className="btn-secondary"
                            type="submit"
                          >
                            {loading ? "Loading..." : "Change Password"}
                          </button>
                          <button className="btn-secondary" onClick={() => setIsPasswordFormVisible(false)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* End user views their own profile */}

            {/* User views friend page */}
            {(user.id !== userId) && (isFriend) && (
              <div>

                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Birthday:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px" }}>
                      {user.birthday || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Language:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {languageMap[user.language] || user.language || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Learning Language:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {languageMap[user.language] || user.learningLanguage || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Privacy:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {user.privacy}
                    </span>
                  </div>
                </div>

                <div className="auth-buttons" >
                  <button
                    className="btn-secondary"
                    disabled={friendRequestSent}
                    onClick={() => { if (isFriend) { redirectToChat() } else { handleSendFriendRequest() } }}
                  // style={{
                  //   backgroundColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
                  //   borderColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
                  // }}
                  >
                    {isFriend
                      ? "Go to Chat"
                      : friendRequestSent
                        ? "Friend Request Sent"
                        : "Send Friend Request"}
                  </button>

                  <button onClick={() => router.back()} className="btn-secondary">Go back</button>
                </div>
              </div>
            )}
            {/* End user views friend or not-private page */}
            {/* start user views public page */}
            {(user.id !== userId) && (user.privacy !== "private") && (!isFriend) && (
              <div>

                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Birthday:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px" }}>
                      {user.birthday || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Language:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {languageMap[user.language] || user.language || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Learning Language:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {languageMap[user.language] || user.learningLanguage || "Not Set"}
                    </span>
                  </div>
                </div>
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-4 col-form-label text-nowrap">
                    Privacy:
                  </label>
                  <div className="col-sm-8 d-flex justify-content-end">
                    <span className="form-control-plaintext text-end" style={{ color: "#5A639C", fontSize: "17.6px", textTransform: "capitalize" }}>
                      {user.privacy}
                    </span>
                  </div>
                </div>

                <div className="auth-buttons" >
                  <button
                    className="btn-secondary"
                    disabled={friendRequestSent}
                    onClick={() => { handleSendFriendRequest() }}
                  // style={{
                  //   backgroundColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
                  //   borderColor: friendRequestSent || isFriend ? "#ccc" : "#87CEEB",
                  // }}
                  >
                    {friendRequestSent
                      ? "Friend Request Sent"
                      : "Send Friend Request"}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => redirectToChat()}
                  >
                    Go to Chat
                  </button>

                  <button onClick={() => router.back()} className="btn-secondary">Go back</button>
                </div>
              </div>
            )}

            {/* User views not-friend or private page */}
            {(user.id !== userId) && (!isFriend && user.privacy === "private") && (
              <div className="auth-buttons" style={{ justifyContent: "space-between" }}>
                <button
                  className="btn-secondary"
                  disabled={isFriend || friendRequestSent}
                  onClick={() => { handleSendFriendRequest(); }}
                // style={{
                //   backgroundColor: friendRequestSent || isFriend ? "#E2BBE9" : "#87CEEB",
                //   color: "#5A639C",
                //   borderColor: friendRequestSent || isFriend ? "#E2BBE9" : "#87CEEB",
                // }}
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
    </>
  );
};

export default UserProfile;