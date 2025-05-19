"use client";

import React, { createContext, useContext, useState } from "react";

type AlertType = "success" | "danger" | null;

interface AlertContextType {
  showAlert: (msg: string, type: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<AlertType>(null);

  const showAlert = (msg: string, type: AlertType) => {
    setAlertMessage(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 3000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertMessage && (
        <div
          className={`bubble-message ${alertType}`}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            border: "3px solid #9B86BD",
            backgroundColor: alertType === "success" ? "#E2BBE9" : "#f44336",
            color: "white",
            padding: "10px 20px",
            borderRadius: "20px",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            zIndex: 2000,
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          {alertMessage}
        </div>
      )}
    </AlertContext.Provider>
  );
};