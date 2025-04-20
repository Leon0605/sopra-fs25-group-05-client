"use client";

import React, { useEffect, useState } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

type Notification = {
  type: "message" | "friend_request";
  content: string;
  fromUserId: string;
};

const Navbar = () => {
  const { notifications, onlineUsers } = useCustomWebsocket();
  const [setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  // useEffect(() => {
  //   socket.on("getNotification", (data) => {
  //     setNotifications((prev) => [...prev, data]);
  //   });
  // }, [socket]);
  const userMap = {
    "1": "Alice",
    "2": "Bob",
    "3": "Charlie",
  };

  const displayNotification = ({ fromUserId, type, content }: Notification) => {
    let action;
  
    if (type === "message") {
      action = "sent you a message";
    } else if (type === "friend_request") {
      action = "sent you a friend request";
    } else {
      action = "performed an action";
    }
  
    return (
      <span className="notification">{`User ${fromUserId} ${action}: ${content}`}</span>
    );
  };

  const handleRead = () => {
    //setNotifications([]);
    setOpen(false);
  };

  return (
    <div className="navbar">
      <span className="logo">Habla! Chat App</span>
      <div className="icons">
        <div className="icon" onClick={() => setOpen(!open)}>
          <img src="/icons/notification.svg" className="iconImg" alt="" />
          {
            notifications.length >0 &&
            <div className="counter">{notifications.length}</div>
          }
        </div>
        <div className="icon" onClick={() => setOpen(!open)}>
          <img src="/icons/message.svg" className="iconImg" alt="" />
        </div>
        <div className="icon" onClick={() => setOpen(!open)}>
          <img src="/icons/settings.svg" className="iconImg" alt="" />
        </div>
      </div>
      {open && (
        <div className="notifications">
          {notifications.map((notification, index) => (
            <div key={index}>{displayNotification(notification)}</div>
          ))}
          <button className="nButton" onClick={handleRead}>
            Mark as read
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;