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
  const orbitRef = useRef<HTMLUListElement>(null);

  useEffect(() => {

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const rotation = (elapsed / 1000) * 5; // 10 degrees/sec
      const radius = 150;
      const total = users.length;

      if (orbitRef.current) {
        Array.from(orbitRef.current.children).forEach((item, index) => {
          const angle = (360 / total) * index + rotation;
          const radians = (angle * Math.PI) / 180;
          const x = radius * Math.cos(radians);
          const y = radius * Math.sin(radians);

          const element = item as HTMLElement;
          
          element.style.transform = `translate(${x}px, ${y}px)`;
        });
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [users]);

  return (
    <div className={styles.orbitContainer}>
      {/* Center User */}
      <div
        className={styles.centerUser}
        onClick={() => onUserClick(currentUser, true)}
        title="Go to your profile"
        >
        <div className={styles.avatar}>👤</div>
        <p>{currentUser.username}</p>
        </div>


      {/* Friends in Orbit */}
      <ul className={styles.orbit} ref={orbitRef}>
        {users.map((user) => (
          <li
            key={user.id}
            className={styles.orbitItem}
            onClick={() => onUserClick(user)}
          >
            <div className="orbitItemInner">
              <div className={styles.avatar}>👤</div>
              <p>{user.username}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrbitDashboard;
