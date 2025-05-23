"use client"; 

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "@/components/Navbar";



const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const {value: userId} = useLocalStorage<number>("userId", 0);
  const [hasMounted, setHasMounted] = useState(false);
  const { value: token } = useLocalStorage<string>("token", "");
  

    useEffect(() => {
      setHasMounted(true);
    }, []);
  
    useEffect(() => {
      if (hasMounted && !token) {
        router.push("/login");
      }
    }, [hasMounted, token,userId]);
    
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        
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

  const filteredUsers = (users ?? []).filter(
    (u) => u.id !== userId && u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div
        className="card-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          padding: "0",
          boxSizing: "border-box"
        }}
      >
        <div
          className="auth-card"
          style={{
            width: "85vw",
            maxWidth: "1200px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            height: "75vh",     
            boxSizing: "border-box",
            overflow: "visible",
          }}
        >
        <h2 style={{ color: "#5A639C", marginBottom: "2rem" }}>Search Page</h2>
        <input
          type="text"
          placeholder="Search for users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "25vw",
            maxWidth: "400px",
            padding: "0.75rem 1rem",
            margin: "0 auto 1rem",
            borderRadius: "0.75rem",
            background: "rgba(255, 255, 255, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(8px)",
            color: "#5A639C",
            outline: "none",
            fontSize: "1rem",
            boxSizing: "border-box"
          }}
        />
  
        {users && (
          <>
            <div
              style={{
                display: "grid",
                padding: "0.5rem 0",
                width: "100%",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridAutoRows: "8rem",
                gap: "1rem",
                overflowY: "auto",
                overflowX: "visible",
                height: "calc(2 * 8rem + 2rem)",
              }}
            >
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  onMouseEnter={(e) =>{
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) =>{
                    e.currentTarget.style.transform= "none";
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "1rem",
                    padding: "1rem",
                    color: "#5A639C",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    backdropFilter: "blur(8px)"
                  }}
                >
                <img
                  src={user.photo || "/images/default-user.png"}
                  alt={`${user.username} avatar`}
                  style={{
                      width: "3vw",
                      height: "3vw",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "0.5rem"
                    }}
                  />
                <span
                  style={{
                      display: "block",
                      width: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "center",
                      fontSize: "1.2vw",
                    }}
                  >
                 {user.username}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;