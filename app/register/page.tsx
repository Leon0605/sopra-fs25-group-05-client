"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const { set: setToken, clear: clearToken } = useLocalStorage<string>("token", "");
  const { set: setUserId, clear: clearUserId } = useLocalStorage<number>("userId", 0);
  const { clear: clearNotificationsEnabled} = useLocalStorage<boolean>("notificationsEnabled", false);
  
  useEffect(() => {
    clearToken();
    clearUserId();
    clearNotificationsEnabled();
  }, []);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());

    const username = values.username?.toString().trim();


    if (!username || username.length > 32) {
      alert("Username cannot be longer than 32 characters.");
      return;
    }

    try {
      const response = await apiService.post<User>("/users", values);
      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);
      router.push("/main");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the register:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during register.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
        position: "relative"
      }}
    >
      <form onSubmit={handleRegister} className="auth-card">
        <h2>Register Page</h2>

        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            name="username"
            required
            placeholder="Enter username"
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            name="password"
            required
            placeholder="Enter password"
          />
        </div>

        <div className="auth-buttons">
          <button type="submit" className="btn-primary">Register</button>
          <button type="button" className="btn-secondary" onClick={() => router.push("/login")}>
            Go to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
