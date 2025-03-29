"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Button, List, Typography, Card } from "antd";
import useLocalStorage from "@/hooks/useLocalStorage";

const { TextArea } = Input;
const { Text } = Typography;

const ChatPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  const { clear: clearToken } = useLocalStorage<string>("token", "");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input.trim()]);
      setInput("");
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Chat with User {id}</h2>
        <Button onClick={handleLogout} type="default">Logout</Button>
      </div>

      <Card style={{ marginBottom: 16, height: 300, overflowY: "auto" }}>
        <List
          dataSource={messages}
          renderItem={(msg, index) => (
            <List.Item key={index}>
              <Text>{msg}</Text>
            </List.Item>
          )}
        />
      </Card>

      <div style={{ display: "flex", gap: 8 }}>
        <TextArea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <Button type="primary" onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};

export default ChatPage;
