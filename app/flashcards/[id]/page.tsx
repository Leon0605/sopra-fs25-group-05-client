"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Flashcard } from "@/types/flashcard";
import { User } from "@/types/user";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";


const FlashcardSetPage: React.FC = () => {
  const { id: flashcardSetId } = useParams();
  const apiService = useApi();
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  const searchParams = useSearchParams();
  const setName = searchParams.get("name") || "Flashcards";
  

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !token) router.push("/login");
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

  useEffect(() => {

    if (token) {
      const fetchFlashcards = async () => {
        try {
          const result = await apiService.get<Flashcard[]>(`/flashcards/${flashcardSetId}`, {
            headers: 
            { 
              Authorization: token,
              "Content-Type": "application/json",
            },
          });
          setFlashcards(result);
        } catch (err) {
          console.error("Failed to load flashcards:", err);
        }
      };
      if (flashcardSetId) fetchFlashcards();
    }
  }, [apiService, token, flashcardSetId]);

  const handleAddFlashcard = async () => {
    const front = prompt("Enter the front content:");
    if (!front) return;
    const back = prompt("Enter the back content (optional, leave empty for translation):");
    try {
      await apiService.post(`/flashcards/${flashcardSetId}`,
        { contentFront: front, ...(back ? { contentBack: back } : {}) },
        {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
      );
      const updated = await apiService.get<Flashcard[]>(`/flashcards/${flashcardSetId}`, {
        headers: { Authorization: token },
      });
      setFlashcards(updated);
    } catch (err) {
      console.error("Failed to add flashcard:", err);
      alert("Error creating flashcard");
    }
  };

  const handleEditCard = async (
  flashcardId: string,
  currentFront: string,
  currentBack: string
) => {
  const newFront = prompt("Enter new front content:", currentFront);
  if (newFront === null || newFront.trim() === "") return;

  const newBack = prompt("Enter new back content or leave empty for auto-translation:", currentBack);
  if (newBack === null) return;

  // Build payload
  const payload =
  newBack.trim() === ""
    ? { contentFront: newFront } // send only front
    : { contentFront: newFront, contentBack: newBack };


  try {
    await apiService.put(
      `/flashcards/${flashcardSetId}/${flashcardId}`,
      payload,
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    
  const updatedFlashcards = await apiService.get<Flashcard[]>(
    `/flashcards/${flashcardSetId}`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

setFlashcards(updatedFlashcards);

  } catch (err) {
    console.error("Failed to edit flashcard:", err);
    alert("Could not update flashcard.");
  }
};

  
  
  const handleDeleteCard = async (flashcardId: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;
  
    try {
      await apiService.delete(`/flashcards/${flashcardSetId}/${flashcardId}`, 
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
    );
  
      // Refresh the list after deletion
      const updatedFlashcards = flashcards.filter((card) => card.flashcardId !== flashcardId);
      setFlashcards(updatedFlashcards);
    } catch (err) {
      console.error("Failed to delete flashcard:", err);
      alert("Could not delete the flashcard.");
    }
  };
  
  const handleStartTraining = () => {
    if (!flashcards || flashcards.length === 0) {
      alert("This set has no flashcards. Please add cards before starting training.");
      return;
    }

    /*
    const direction = prompt("Choose direction:\n1. Front to Back\n2. Back to Front");
    const order = prompt("Choose order:\n1. Ordered\n2. Mixed");
    */

    router.push(`/flashcards/${flashcardSetId}/training`);
  };

  const handleRenameFlashcardSet = async (setId: string, currentName: string) => {
    const newName = prompt("Enter a new name for this flashcard set:", currentName);
    if (!newName || newName.trim() === "") {
      alert("Flashcard set name cannot be empty.");
      return;
    }

    try {
      await apiService.put(
        `/flashcards/${setId}`,
        { flashcardSetName: newName },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      // Optionally update locally or redirect to refresh name in URL
      alert("Set renamed successfully!");
      router.push(`/flashcards/${setId}?name=${encodeURIComponent(newName)}`);
    } catch (err) {
      console.error("Failed to rename flashcard set:", err);
      alert("Renaming failed. Please try again.");
    }
  };



  const handleDeleteSet = async () => {
    const confirmed = confirm("Are you sure you want to delete this set?");
    if (!confirmed) return;

    try {
      await apiService.delete(`/flashcards/${flashcardSetId}`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      alert("Set deleted.");
      router.push("/flashcards"); // Go back to sets page
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Could not delete set. Please try again.");
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
    <Navbar />
    
    <div className="auth-card" style={{ maxWidth: "800px", width: "100%", marginTop:"12vh", paddingTop:"10px" }}>
    <h2 style={{ color: "#5A639C", marginBottom: "0.5rem" }}>{setName}</h2>

      {/* Scrollable flashcard list */}
      <div
        style={{
          maxHeight: "240px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          marginBottom: "1rem",
          marginTop:"1rem", 
          backgroundColor: "#9B86BD",
          borderRadius: "12px",
        }}
      >
        {flashcards.length > 0 ? (
          flashcards.map((card) => (
            <div
              key={card.flashcardId}            >
              <div
                className="card shadow-sm"
                style={{
                  backgroundColor: "#FFF3F0",
                  borderRadius: "12px",
                  margin:"5px"
                }}
              >
                <div className="card-body py-2 px-3">
                  <div className="row">
                    <div className="col-md">
                      <p className="fw-bold" style={{ color: "#5A639C", marginBottom: "4px" }}>
                        Front
                      </p>
                      <p>{card.contentFront}</p>
                    </div>
                    <div className="col-md">
                      <p className="fw-bold" style={{ color: "#5A639C", marginBottom: "4px" }}>
                        Back
                      </p>
                      <p>{card.contentBack}</p>
                    </div>

                    {isEditing ? (
                      <div className="col-md d-flex justify-content-end gap-2 mt-2">
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            handleEditCard(card.flashcardId, card.contentFront, card.contentBack)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteCard(card.flashcardId)}
                        >
                          Delete
                        </button>
                      </div>
                    ): (<div className="col-md d-flex align-items-center">
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            card.status === "CORRECT"
                              ? "#4CAF50"
                              : card.status === "WRONG"
                              ? "#F44336"
                              : "#999999",
                          color: "white",
                          fontSize: "0.8rem",
                          padding: "6px 12px",
                          borderRadius: "12px",
                        }}
                      >
                        {card.status === "CORRECT"
                          ? "✓ Correct"
                          : card.status === "WRONG"
                          ? "✗ Wrong"
                          : "? Not Trained"}
                      </span>
                    </div>)
                    }
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="text-center"
            style={{
              borderRadius: "12px",
              backgroundColor: "#9B86BD",
              color: "white",
              minHeight: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "30px",
            }}
          >
            You do not have any flashcards yet.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="auth-buttons d-flex flex-column gap-0 mb-0">
        <div className="d-flex justify-content-between w-100">
          {isEditing ? (
            <>
              <button
                className="btn-primary"
                onClick={() => handleRenameFlashcardSet(flashcardSetId as string, setName)}
              >
                Rename Set
              </button>
              <button className="btn-primary" onClick={handleDeleteSet}>
                Delete Set
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={handleAddFlashcard}>
                Add Flashcard
              </button>
              <button className="btn-primary" onClick={handleStartTraining}>
                Start Train
              </button>
            </>
          )}
        </div>

        <div className="auth-buttons d-flex justify-content-between w-100 mt-2">
          {isEditing ? (
            <>
              <button className="btn-primary" onClick={() => setIsEditing(false)}>
                Exit Editing
              </button>
              <button className="btn-secondary" onClick={() => router.push("/flashcards")}>
                Back to Sets
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                Editing Mode
              </button>
              <button className="btn-secondary" onClick={() => router.push("/flashcards")}>
                Back to Sets
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

  
};

export default FlashcardSetPage;
