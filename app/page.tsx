"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const router = useRouter();

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="auth-card text-center" style={{ maxWidth: "800px", padding: "1rem" }}>
        <h2 style={{ color: "#5A639C", marginBottom: "1rem" }}>Welcome to Habla 👋</h2>

        <Image
          src="/images/tutorial.png"
          alt="Tutorial steps"
          width={420}
          height={220}
          className="img-fluid rounded"
          style={{ marginBottom: "0rem" }}
        />

        <p style={{ color: "#5A639C", fontSize: "1rem", marginBottom: "1rem" }}>
          Habla is a web application that combines real-time multilingual chat with
          flashcard-based vocabulary learning. Users can chat with friends or in groups,
          automatically translate messages based on their language preferences, and
          instantly convert any message into a flashcard for later training.
        </p>

        <button className="btn-primary" onClick={() => router.push("/login")}>
          Continue to Login
        </button>
      </div>
    </div>
  );
};

export default Home;
