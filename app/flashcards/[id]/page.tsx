"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Flashcard } from "@/types/flashcard";
import { User } from "@/types/user";
import "bootstrap/dist/css/bootstrap.min.css";

const FlashcardSetPage: React.FC = () => {
  const { id: flashcardSetId } = useParams();
  const apiService = useApi();
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  

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

  const handleEditCard = async (flashcardId: string, currentFront: string, currentBack: string) => {
    const newFront = prompt("Enter new front content:", currentFront);
    if (newFront === null) return;
  
    const newBack = prompt("Enter new back content (optional):", currentBack);
    if (newBack === null) return;
  
    try {
      await apiService.put(
        `/flashcards/${flashcardSetId}/${flashcardId}`,
        {
          contentFront: newFront,
          contentBack: newBack,
        },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
  
      // Refresh state (basic way: refetch list or patch state manually)
      const updatedFlashcards = flashcards.map((card) =>
        card.flashcardId === flashcardId
          ? { ...card, contentFront: newFront, contentBack: newBack }
          : card
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


  if (!hasMounted || !token || !users) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }
  

  return (
    <div className="card-container d-flex justify-content-center align-items-center min-vh-100">
      <div className="auth-card" style={{ maxWidth: "800px", width: "100%" }}>
        <h2 style={{ color: "#5A639C", marginBottom: "0.5rem" }}>Flashcards</h2>
  
        {/* Scrollable flashcard list */}
        <div
          style={{
            maxHeight: "240px",
            overflowY: "auto",
            marginBottom: "1rem",
            paddingRight: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {flashcards.map((card) => (
            <div
              key={card.flashcardId}
              className="card shadow-sm mb-1"
              style={{
                backgroundColor: "#f3e9fb",
                border: "1px solid #9B86BD",
                borderRadius: "12px",
              }}
            >
              <div className="card-body py-1 px-2">

                <div className="row">
                  <div className="col-md">
                    <p className="fw-bold text-primary">Front</p>
                    <p>{card.contentFront}</p>
                  </div>
                  <div className="col-md">
                    <p className="fw-bold text-primary">Back</p>
                    <p>{card.contentBack}</p>
                  </div>

                    {isEditing && (
                    <div className="col-md d-flex justify-content-end mt-2" style={{ gap: "10px" }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() =>
                                handleEditCard(card.flashcardId, card.contentFront, card.contentBack)
                            }
                            >
                            Edit
                        </button>

                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCard(card.flashcardId)}>
                        Delete
                        </button>
                    </div>
                    )}

                </div>
              </div>
            </div>
          ))}
        </div>
  
{/* Action Buttons */}
<div className="auth-buttons d-flex flex-column gap-0">
  {!isEditing && (
    <button
      className="btn-primary "
      onClick={handleStartTraining}
    >
      Start Train
    </button>
  )}

  <div className="auth-buttons d-flex justify-content-between w-100">
    {isEditing ? (
      <>
        <button className="btn-primary" onClick={() => setIsEditing(false)}>
          Exit Editing
        </button>
        <button className="btn-primary" onClick={handleAddFlashcard}>
          Add Flashcard
        </button>
      </>
    ) : (
      <>
        <button className="btn-primary" onClick={() => setIsEditing(true)}>
          Edit Cards
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
