import Navbar from "@/components/Navbar";
import ChatSummary from "@/components/ChatSummary";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./page.module.css";


export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div id="chat-page" className={styles["chat-page"]} style={{ height: "calc(100vh - 56px)" }}>
        {/* Left - ChatSummary */}
        <div className={styles["previous-chats"]}>
          <ChatSummary />
        </div>

        {/* middle divider */}
        <div className="middle-divider"></div>

        {/* Right - Chat Detail / children */}
        <div className={styles["chat-container"]}>
          <p
            style={{ color: "#5A639C", fontSize: "17.6px", marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}
          >Chat Messages</p>
          {children}
        </div>
      </div>
    </>
  );
}
