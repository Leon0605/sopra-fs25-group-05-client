"use client";

import React, { useEffect, useState } from "react";

interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  animationDelay: string;
  animationDuration: string;
}


const generateStars = (count: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 2}s`,
    });
  }
  return stars;
};

const Background = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(generateStars(500));
  }, []);

  return (
    <>
      {/* Twinkling Stars Layer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            style={{
              position: "absolute",
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              backgroundColor: "white",
              borderRadius: "50%",
              opacity: 0.8,
              animationName: "twinkle",
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out",
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
            }}
          />
        ))}
      </div>

      {/* Purle Botoom Curve */}
      <svg
        viewBox="0 0 1440 150"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "auto",
          zIndex: 0,
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f456d" />
            <stop offset="100%" stopColor="#5A639C" />
          </linearGradient>
        </defs>
        <path
          fill="url(#purpleGradient)"
          fillOpacity="1"
          d="M0,0 Q720,150 1440,0 L1440,150 L0,150 Z"
        />
      </svg>
    </>
  );
};

export default Background;
