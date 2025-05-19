"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Flashcard } from "@/types/flashcard";
import "bootstrap/dist/css/bootstrap.min.css";

const FlashcardTraining: React.FC = () => {
  const router = useRouter();
  const { id } = useParams();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const [hasMounted, setHasMounted] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCards, setCurrentCards] = useState<Flashcard[]>([]);
  const [unknownCards, setUnknownCards] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [isFrontToBack, setIsFrontToBack] = useState(true);
  const [shuffleCards, setShuffleCards] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [includeNotTrained, setIncludeNotTrained] = useState(true);
  const [includeWrong, setIncludeWrong] = useState(true);
  const [includeCorrect, setIncludeCorrect] = useState(true);
  const notTrainedCount = flashcards.filter((c) => c.status === "NOTTRAINED").length;
  const wrongCount = flashcards.filter((c) => c.status === "WRONG").length;
  const correctCount = flashcards.filter((c) => c.status === "CORRECT").length;



  const shuffleArray = (array: Flashcard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    const fetchCards = async () => {
      try {
        const result = await apiService.get<Flashcard[]>(`/flashcards/${id}`, {
          headers: {
            Authorization: token,
          },
        });
        setFlashcards(result);
      } catch (err) {
        console.error("Failed to fetch flashcards:", err);
      }
    };

    if (id && token) {
      fetchCards();
    }
  }, [id, token]);

  const handleStart = () => {

    if (!includeNotTrained && !includeWrong && !includeCorrect) {
    alert("Please select at least one category to train.");
    return;
    }


    let filtered = flashcards.filter((card) => {
      if (card.status === "NOTTRAINED" && includeNotTrained) return true;
      if (card.status === "WRONG" && includeWrong) return true;
      if (card.status === "CORRECT" && includeCorrect) return true;
      return false;
    });

    
    if (filtered.length === 0) {
      alert("Please select at least one category with cards to train.");
      return;
    }

    const cards = shuffleCards ? shuffleArray(filtered) : filtered;

    setCurrentCards(cards);
    setCurrentIndex(0);
    setUnknownCards([]);
    setRoundCompleted(false);
    setRoundNumber(1);
    setTrainingCompleted(false);
    setShowSetup(false);
  };


  const handleFlip = () => setFlipped((prev) => !prev);

const handleAnswer = async (isKnown: boolean) => {
  const currentCard = currentCards[currentIndex];
  setFlipped(false);

  try {
    await apiService.put(
      `/flashcards/${id}/${currentCard.flashcardId}/status`,
      null,
      {
        headers: {
          Authorization: token,
          Status: isKnown.toString(),
        },
      }
    );
  } catch (err) {
    console.error("Failed to update flashcard status:", err);
    alert("Could not save training progress.");
  }

  setTimeout(() => {
    if (!isKnown) {
      setUnknownCards((prev) => [...prev, currentCard.flashcardId]);
    }

    if (currentIndex + 1 < currentCards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setRoundCompleted(true);
      if (unknownCards.length === 0 && isKnown) {
        setTrainingCompleted(true);
      }
    }
  }, 200);
};


  const startNextRound = () => {
    const cardsToRepeat = flashcards.filter((card) =>
      unknownCards.includes(card.flashcardId)
    );

    const nextRoundCards = shuffleCards ? shuffleArray(cardsToRepeat) : cardsToRepeat;

    setCurrentCards(nextRoundCards);
    setCurrentIndex(0);
    setFlipped(false);
    setUnknownCards([]);
    setRoundCompleted(false);
    setRoundNumber((prev) => prev + 1);
  };


  const restartTraining = () => {
    const cards = shuffleArray(flashcards);
    setCurrentCards(cards);
    setCurrentIndex(0);
    setFlipped(false);
    setUnknownCards([]);
    setRoundCompleted(false);
    setRoundNumber(1);
    setTrainingCompleted(false);
    setShowSetup(true);
  };

  const currentCard = currentCards[currentIndex];

  if (showSetup) {
return (
  <div className="auth-card mx-auto" style={{ maxWidth: "500px" }}>
    <h2 className="mb-3">Training Setup</h2>

    {/* Total cards */}
    <p className="text-start mb-3 " style={{ color: "#5A639C", fontWeight: "bold"}}>
      Total Cards: {flashcards.length}
    </p>
    <hr style={{ borderTop: "3px solid #9B86BD" }} />

    {/* Direction Options */}
    <div className="mb-1">
      <label className="d-flex align-items-start gap-2">
        <input
          type="radio"
          name="direction"
          checked={isFrontToBack}
          onChange={() => setIsFrontToBack(true)}
          style={{ width: "18px", height: "18px", margin: "5px"}}
        />
        <span className="ms-1">Front to Back</span>
      </label>

      <label className="d-flex align-items-center gap-2">
        <input
          type="radio"
          name="direction"
          checked={!isFrontToBack}
          onChange={() => setIsFrontToBack(false)}
          style={{ width: "18px", height: "18px", margin: "5px" }}
        />
        <span className="ms-1">Back to Front</span>
      </label>
    </div>

    <hr style={{ borderTop: "3px solid #9B86BD" }} />

    {/* Shuffle Checkbox */}
    <div className="mb-1">
      <label className="d-flex align-items-center gap-2">
        <input
          type="checkbox"
          checked={shuffleCards}
          onChange={() => setShuffleCards(prev => !prev)}
          style={{ width: "18px", height: "18px", margin: "5px", verticalAlign: "middle" }}
        />
        <span className="ms-1">Shuffle Cards</span>
      </label>
    </div>

    <hr style={{ borderTop: "3px solid #9B86BD" }} />

    {/* Status Filters */}
<div className="mb-3">
  <label className="d-flex align-items-center gap-2">
    <input
      type="checkbox"
      checked={includeNotTrained}
      onChange={() => setIncludeNotTrained(prev => !prev)}
      style={{ width: "18px", height: "18px", margin: "5px" }}
    />
    <span className="ms-1">Not Trained Cards ({notTrainedCount})</span>
  </label>

  <label className="d-flex align-items-center gap-2">
    <input
      type="checkbox"
      checked={includeWrong}
      onChange={() => setIncludeWrong(prev => !prev)}
      style={{ width: "18px", height: "18px", margin: "5px" }}
    />
    <span className="ms-1">Wrong Cards ({wrongCount})</span>
  </label>

  <label className="d-flex align-items-center gap-2">
    <input
      type="checkbox"
      checked={includeCorrect}
      onChange={() => setIncludeCorrect(prev => !prev)}
      style={{ width: "18px", height: "18px", margin: "5px" }}
    />
    <span className="ms-1">Correct Cards ({correctCount})</span>
  </label>
</div>


    {/* Buttons */}
    <div className="auth-buttons d-flex justify-content-between mb-2">
      <button className="btn-primary" onClick={handleStart}>Start</button>
      <button className="btn-secondary" onClick={() => router.back()}>Cancel</button>
    </div>
  </div>
);


  }

  return (
    <div className="container-fluid min-vh-100 py-4 px-5" style={{ color: "white" }}>
      <div className="mb-4 justify-content-between d-flex">
        <h4 style={{ fontWeight: "bold", fontSize: "1.6rem" }}>
          Round {roundNumber} — Card {currentIndex + 1} of {currentCards.length}
        </h4>
        <button className="btn-primary" onClick={() => router.back()}>
          Go Back
        </button>
      </div>

      <div className="d-flex flex-column align-items-center justify-content-center" 
        style={{ color:"black", marginTop: "90px" }}>

        {!roundCompleted && !trainingCompleted && (
          <>
            <div className="flip-card mb-4" onClick={handleFlip}>
              <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
                <div className="flip-card-front d-flex flex-column justify-content-center align-items-center">
                  <h5 style={{ color:"#7776B3"}} >{isFrontToBack ? "Front" : "Back"}</h5>
                  <h4 className="mt-2">{isFrontToBack ? currentCard?.contentFront : currentCard?.contentBack}</h4>
                </div>
                <div className="flip-card-back d-flex flex-column justify-content-center align-items-center">
                  <h5 style={{ color:"#7776B3"}}>{isFrontToBack ? "Back" : "Front"}</h5>
                  <h4 className="mt-2">{isFrontToBack ? currentCard?.contentBack : currentCard?.contentFront}</h4>
                </div>
              </div>
            </div>
          </>
        )}

        {trainingCompleted ? (
          <div className="auth-card" style={{maxWidth: "300px", color: "#5A639C"}}>
            <h5>Training Complete! </h5>
            <button className="btn-primary mt-4" onClick={restartTraining}>Restart Training</button>
          </div>
        ) : roundCompleted ? (
          <div className="auth-card" style={{maxWidth: "300px", color: "#5A639C"}}>
            <h5>Round Completed!</h5>
            <p>{unknownCards.length > 0 ? `${unknownCards.length} cards will be repeated.` : "All cards known!"}</p>
            {unknownCards.length > 0 && (
              <button className="btn-primary" onClick={startNextRound}>Start Next Round</button>
            )}
          </div>
        ) : (
          <div className="d-flex gap-3 mt-3" style={{ zIndex: 2, position: "relative" }}>
            <button
              className="btn btn-danger"
              style={{
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onClick={() => handleAnswer(false)}
            >
              Did not Know
            </button>
            <button
              className="btn btn-success"
              style={{
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onClick={() => handleAnswer(true)}
            >
              Knew It
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardTraining;
