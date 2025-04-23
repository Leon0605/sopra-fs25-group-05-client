"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const { set: setToken, clear: clearToken } = useLocalStorage<string>("token", "");
  const { set: setUserId, clear: clearUserId } = useLocalStorage<number>("userId", 0);

  useEffect(() => {
    clearToken();
    clearUserId();
  }, [clearToken, clearUserId]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());

    try {
      const response = await apiService.post<User>("/login", values);
      if (response.token) setToken(response.token);
      if (response.id) setUserId(Number(response.id));
      router.push("/main");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed");
    }
    
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2,
      position: "relative"
    }}>
      <form onSubmit={handleLogin} className="auth-card">
        <h2>Login Page</h2>
    
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" name="username" required placeholder="Enter username" />
        </div>
    
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" required placeholder="Enter password" />
        </div>
    
        <div className="auth-buttons">
          <button type="submit" className="btn-primary">Login</button>
          <button type="button" className="btn-secondary" onClick={() => router.push("/register")}> Go to register </button>
        </div>
        
      </form>
    </div>
    
  );
};

export default Login;
