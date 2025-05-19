"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import { FlashcardSet } from "@/types/flashcardSet";
import "bootstrap/dist/css/bootstrap.min.css";

const Flashcards: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const [users, setUsers] = useState<User[] | null>(null);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !token) {
      router.push("/login");
    }

    const fetchSets = async () => {
      try {
        console.log("sent token:", token);
        const result = await apiService.get<FlashcardSet[]>("flashcards", {
          headers: {
            Authorization: token,
          },
        });
        
        setFlashcardSets(result);
      } catch (error) {
        console.error("Failed to fetch flashcard sets:", error);
      } 
    };

    if (hasMounted) {fetchSets();}

  }, [hasMounted, token]);

  useEffect(() => {

    const fetchUsers = async () => {
          try {
            const users: User[] = await apiService.get<User[]>("/users");
            if (!users || users.length === 0) {
              router.push("/login");
              return;
            }
            setUsers(users);
          } catch (error) {
            console.error("Error fetching users:", error);
            router.push("/login");
          }
        };


    fetchUsers()
  }, [apiService]);
  

  const handleCreateFlashcardSet = async () => { 
    const name = prompt("Enter a name for the new flashcard set:");
    if (!name || name.trim() === "") {
      alert("Flashcard set name cannot be empty.");
      return;
    }
  
    try {
      console.log("Creating set:", name, "with token:", token);
  
      await apiService.post("flashcards",
        { flashcardSetName: name },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
  
      // Refresh the list of sets
      const updatedSets = await apiService.get<FlashcardSet[]>("flashcards", {
        headers: {
          Authorization: token
        }
      });
  
      setFlashcardSets(updatedSets);
    } catch (err) {
      console.error("Failed to add new set:", err);
      alert("Failed to create set. Please try again.");
    }
  };

  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }

  return (
    <div className="card-container d-flex justify-content-center align-items-center min-vh-100">
      <div className="auth-card" style={{ width: "100%", maxWidth: "10o00px", maxHeight: "800px" }}>
        <h2 style={{ color: "#5A639C", marginBottom: "2rem" }}>Flashcard Sets</h2>
  
        {flashcardSets.length > 0 ? (
          <div
            style={{
              maxHeight: "300px",
              minHeight: "10px",
              overflowY: "auto",
              overflowX: "hidden",
              marginBottom: "1rem",
              paddingRight: "8px",
              width: "100%",
              whiteSpace: "normal",
              backgroundColor:"#9B86BD",
              borderRadius: "12px",

            }}
          >
          
            {flashcardSets.map((set) => (
              <div
                key={set.flashcardSetId}
                className="d-flex justify-content-between align-items-center mb-2 p-2 m-2"
                style={{
                  backgroundColor: "#FFF3F0",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",

                }}
                onClick={() =>
                  router.push(
                    `/flashcards/${set.flashcardSetId}?name=${encodeURIComponent(set.flashcardSetName)}`
                  )
                }
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div 
                  className="col-sm-4 fw-bold"   
                  style={{
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    maxWidth:"200px",
                    color:"#5A639C",
                  }}>{set.flashcardSetName}
                </div>
  
                <div className="col-sm-3">
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    Cards: <strong>{set.flashcardQuantity ?? "0"}</strong>{" "}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    From: <strong>{set.language ?? "-"}</strong>{" "}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    To: <strong>{set.learningLanguage ?? "-"}</strong>
                  </div>
                </div>

                <div className="col-md-4 flex" style={{whiteSpace: "nowrap"}}>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    Not Trained: <strong>{set.statistic.NotTrained.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    Wrong: <strong>{set.statistic.Wrong.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    Correct: <strong>{set.statistic?.Correct.toFixed(1)}%</strong>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center"
            style={{
              borderRadius: "12px", // or "1rem", "50px", etc.
              backgroundColor: "#9B86BD",
              color: "white",
              minHeight: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
            }}
          >
            You do not have any flashcard sets yet.
          </div>
        )}
  
        {/* Action Buttons */}
        <div className="auth-buttons d-flex justify-content-between mt-4">
              <button className="btn-primary" onClick={handleCreateFlashcardSet}>
                Add New Set
              </button>
              <button className="btn-secondary" onClick={() => router.push("/main")}>
                Go to Main Page
              </button>
        </div>
      </div>
    </div>
  );  
  
};

export default Flashcards;
