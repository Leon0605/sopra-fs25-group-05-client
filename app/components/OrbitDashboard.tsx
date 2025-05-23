// components/OrbitDashboard.tsx
import React, { useEffect, useRef } from "react";
import { User } from "@/types/user";
import styles from "./OrbitDashboard.module.css";

interface OrbitDashboardProps {
  currentUser: User;
  users: User[]; // Friends
  onUserClick: (user: User, isCurrentUser?: boolean) => void;
}

const OrbitDashboard: React.FC<OrbitDashboardProps> = ({
  currentUser,
  users,
  onUserClick,
}) => {
// Full React component integration (styled with stable orbit layout)

const orbitRef = useRef<HTMLUListElement>(null);

useEffect(() => {
  const start = performance.now();

  const animate = (now: number) => {
    const elapsed = now - start;
    const rotation = (elapsed / 1000) * 5;
    const radiusVw = 25; // radius in viewport width units
    const total = users.length;

    if (orbitRef.current) {
      Array.from(orbitRef.current.children).forEach((item, index) => {
        const angle = (360 / total) * index + rotation;
        const radians = (angle * Math.PI) / 180;
        const x = radiusVw * Math.cos(radians);
        const y = radiusVw * Math.sin(radians);

        const element = item as HTMLElement;
        element.style.transform = `translate(calc(${x}vh), calc(${y}vh))`;
      });
    }

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}, [users]);

return (
  <div
    className={styles.orbitContainer}
    style={{ marginTop: "30px", minHeight: "42vh" }}
  >
    <div
      style={{
        position: "absolute",
        top: "9vh",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg width="300" height="50">
        <defs>
          <path id="orbitTextPath" d="M 50,80 A 100,40 0 0,1 250,80" fill="transparent" />
        </defs>
        <text fill="#9B86BD" fontSize="18" fontWeight="bold">
          <textPath href="#orbitTextPath" startOffset="50%" textAnchor="middle">
            User profile
          </textPath>
        </text>
      </svg>
    </div>

    <div
      className={styles.centerUser}
      onClick={() => onUserClick(currentUser, true)}
      title="Go to your profile"
    >
      <img
        src={currentUser.photo || "/images/default-user.png"}
        alt={currentUser.username ?? "User"}
        className={styles.avatarImageLarge}
      />
      <p>{currentUser.username}</p>
    </div>

    <div
      style={{
        position: "absolute",
        top: "-6vh",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg width="300" height="100">
        <defs>
          <path id="orbitTextPath" d="M 50,80 A 100,40 0 0,1 250,80" fill="transparent" />
        </defs>
        <text fill="#9B86BD" fontSize="18" fontWeight="bold">
          <textPath href="#orbitTextPath" startOffset="50%" textAnchor="middle">
            Friends
          </textPath>
        </text>
      </svg>
    </div>

    <ul className={styles.orbit} ref={orbitRef}>
      {users.map((user) => (
        <li
          key={user.id}
          className={styles.orbitItem}
          onClick={() => onUserClick(user)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/json", JSON.stringify(user));
          }}
        >
          <div className={styles.orbitItemInner}>
            <img
              src={user.photo || "/images/default-user.png"}
              alt={user.username ?? "User"}
              className={styles.avatarImage}
            />
            <p className={styles.orbitUsername}>{user.username}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

}

export default OrbitDashboard;
