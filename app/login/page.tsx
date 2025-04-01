"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Typography } from "antd";
// import styles from "@/styles/page.module.css";

const { Title } = Typography;

interface FormFieldProps {
  name: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

    const { set: setToken, clear: clearToken } = useLocalStorage<string>("token", "");
    const { set: setUserId, clear: clearUserId } = useLocalStorage<string>("userId", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/login", values);

      if (response.token) {
        setToken(response.token);
      }

      if (response.id) {
        setUserId(String(response.id));
      }
      console.log("Logged in user ID:", response.id);


      router.push("/main");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  useEffect(() => {
    clearToken();
    clearUserId();
  }, []);
  

  return (
    <div className="login-container">
      <Form
        form={form}
        name="login"
        size="large"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Typography.Title style={{ textAlign: "center" }}>
          Login Page
        </Typography.Title>

        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>

        <Form.Item
          name="password"
          label="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input placeholder="Enter password" />
        </Form.Item>

        <Form.Item >
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <Button type="primary" htmlType="submit" style={{ flex: 1 }}>
              Login
            </Button>
            <Button type="default" onClick={() => router.push("/register")} style={{ flex: 1 }}>
              Go to Register
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
    
  );
};

export default Login;
