import { useState } from "react";

export type AlertType = "success" | "danger";

export const useAlert = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<AlertType | null>(null);

  const showAlert = (message: string, type: AlertType) => {
    setAlertMessage(message);
    setAlertType(type);

    // Automatically dismiss the alert after 3 seconds
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 3000);
  };

  return { alertMessage, alertType, showAlert };
};