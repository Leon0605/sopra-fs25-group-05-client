"use client";

import React, { useState } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const { messages, incomingRequests, onlineUsers } = useCustomWebsocket();
  const [openRequests, setOpenRequests] = useState(false);
  const [openMessages, setOpenMessages] = useState(false);

  console.log("Incoming requests:", incomingRequests);
  console.log("Messages:", messages);
  console.log("Online Users:", onlineUsers);

  // useEffect(() => {
  //   socket.on("getNotification", (data) => {
  //     setNotifications((prev) => [...prev, data]);
  //   });
  // }, [socket]);

  // const displayNotification = ({ fromUserId, type, content }: Notification) => {
  //   let action;
  
  //   if (type === "message") {
  //     action = "sent you a message";
  //   } else if (type === "friend_request") {
  //     action = "sent you a friend request";
  //   } else {
  //     action = "performed an action";
  //   }
  
  //   return (
  //     <span className="notification">{`User ${fromUserId} ${action}: ${content}`}</span>
  //   );
  // };

  return (
    <div className="navbar">
      <span className="logo">Habla! Chat App</span>
      <div className={styles.icons}>
        {/* Incoming Requests Icon */}
        <div
          className={styles.icon}
          onClick={() => {
            setOpenRequests(!openRequests);
            setOpenMessages(false); // Close notifications dropdown if open
          }}
        >
          <img src="/icons/notification.svg" className="iconImg" alt="" />
          {incomingRequests.length > 0 && (
            <div className="counter">{incomingRequests.length}</div>
          )}
        </div>

        {/* Notifications Icon */}
        <div
          className={styles.icon}
          onClick={() => {
            setOpenMessages(!openMessages);
            setOpenRequests(false); // Close incoming requests dropdown if open
          }}
        >
          <img src="/icons/message.svg" className="iconImg" alt="" />
          {messages.length > 0 && (
            <div className="counter">{messages.length}</div>
          )}
        </div>
      </div>

      {/* Incoming Requests Dropdown */}
      {openRequests && (
        <div className={styles.notifications}>
          <p>Incoming Friend Requests</p>
          {incomingRequests.map((request, index) => (
            <div key={index}>
              <span>{request.username}</span>
            </div>
          ))}
          <button className={styles.nButton} onClick={() => setOpenRequests(false)}>
            Close
          </button>
        </div>
      )}

      {/* Messages Dropdown */}
      {openMessages && (
        <div className={styles.notifications}>
          <p>Messages</p>
          {messages.map((message, index) => (
            <div key={index}>
              <span>{message.userId} wrote: {message.originalMessage}</span>
            </div>
          ))}
          <button className={styles.nButton} onClick={() => setOpenMessages(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;