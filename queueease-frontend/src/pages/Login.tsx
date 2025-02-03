import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Login.styles";
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    keepSignedIn: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api/login/"
        : "https://4f0772zf-8000.eun1.devtunnels.ms/api/login/";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await login(data.email, formData.password);
        alert("Login successful!");
        navigate("/main");
        console.log("User data:", data);
      } else {
        const errorData = await response.json();
        alert(`Login failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div style={styles.page as React.CSSProperties}>
      <h1 style={styles.title}>QueueEase</h1>
      <h2 style={styles.subtitle}>Login</h2>
      <p style={styles.welcomeMessage}>Welcome Back!</p>

      <div style={styles.container}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              style={styles.input}
            />
          </div>
          <div style={styles.formActions}>
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="keepSignedIn"
                name="keepSignedIn"
                checked={formData.keepSignedIn}
                onChange={handleChange}
              />
              <label htmlFor="keepSignedIn">Keep me signed in</label>
            </div>
            <button
              type="button"
              style={styles.forgotPasswordButton}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password/Email
            </button>
          </div>
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>

      <button style={styles.secondaryButton} onClick={() => navigate("/signup")}>
        Create an account
      </button>

      <p style={styles.divider}>
        <span>— or sign in as guest —</span>
      </p>

      <button style={styles.guestButton} onClick={() => navigate("/main")}>
        Continue as guest
      </button>
    </div>
  );
};

export default Login;
