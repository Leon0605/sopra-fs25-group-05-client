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

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

  const { set: setToken, clear: clearToken } = useLocalStorage<string>("token", "");
  const { set: setUserId, clear: clearUserId } = useLocalStorage<number>("userId", 0);

  const handleRegister = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/users", values);

      if (response.token) {
        setToken(response.token);
      }

      if (response.id) {
        setUserId(response.id); // convert to string for storage
      }

      router.push("/main");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the register:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during register.");
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
        name="register"
        size="large"
        onFinish={handleRegister}
        layout="vertical"
      >
        <Typography.Title style={{ textAlign: "center" }}>
          Register Page
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
              Register
            </Button>
            <Button type="default" onClick={() => router.push("/login")} style={{ flex: 1 }}>
              Go to Login
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
    
  );
};

export default Register;
