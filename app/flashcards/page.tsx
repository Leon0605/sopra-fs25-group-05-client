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
  const [isEditing, setIsEditing] = useState(false);

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

  const handleDelete = async (setId: string) => {
    const confirmed = confirm("Are you sure you want to delete this set?");
    if (!confirmed) return;
  
    try {
      await apiService.delete(`/flashcards/${setId}`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });
  
      setFlashcardSets((prev) => prev.filter((set) => set.flashcardSetId !== setId));
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete the flashcard set. Please try again.");
    }
  };
  

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

  const handleEditSet = (setId: string) => {
    const newFrom = prompt("Enter the new 'From' language:");
    const newTo = prompt("Enter the new 'To' language:");
  
    if (!newFrom || !newTo) {
      alert("Edit cancelled or invalid input.");
      return;
    }
  
    alert(`(Mock) Set ${setId} would be updated:\nFrom: ${newFrom}\nTo: ${newTo}`);
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
              maxHeight: "400px",
              overflowY: "auto",
              overflowX: "hidden", // 💡 disables horizontal scroll
              marginBottom: "1rem",
              paddingRight: "8px",
              width: "100%", // ensures it doesn't overflow container width
              whiteSpace: "normal", // ensures text/content wraps
            }}
          >
          
            {flashcardSets.map((set) => (
              <div
                key={set.flashcardSetId}
                className="d-flex flex-row flex-wrap align-items-center mb-3 p-3 m-1"
                style={{
                  backgroundColor: "#EDF0FF",
                  borderRadius: "12px",
                  cursor: isEditing ? "default" : "pointer",
                  transition: "transform 0.2s ease",
                }}
                onClick={() => {
                  if (!isEditing) {
                    router.push(`/flashcards/${set.flashcardSetId}`);
                  }
                }}
                onMouseEnter={(e) => !isEditing && (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div className="col-sm-3 fw-bold text-primary">{set.flashcardSetName}</div>
  
                <div className="col-md-4">
                <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                  Quantity: <strong>{set.flashcardQuantity ?? "0"}</strong>{" "}
                </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    From: <strong>{set.language ?? "-"}</strong>{" "}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#5A639C" }}>
                    To: <strong>{set.learningLanguage ?? "-"}</strong>
                  </div>
                </div>
                <div className="col-md-3">
                  {isEditing && (

<div className="d-flex p-1">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSet(set.flashcardSetId);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(set.flashcardSetId);
                      }}
                    >
                      Delete
                    </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">You don't have any flashcard sets yet.</p>
        )}
  
        {/* Action Buttons */}
        <div className="auth-buttons d-flex justify-content-between mt-4">
          {isEditing ? (
            <>
              <button className="btn-primary" onClick={() => setIsEditing(false)}>
                Exit Edit Mode
              </button>
              <button className="btn-primary" onClick={handleCreateFlashcardSet}>
                Add New Set
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                Edit Sets
              </button>
              <button className="btn-secondary" onClick={() => router.push("/main")}>
                Go to Main Page
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );  
  
};

export default Flashcards;
