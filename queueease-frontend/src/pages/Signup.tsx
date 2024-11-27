import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Signup.styles";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Define the API URLs for local and dev tunnel
    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api/signup/"
        : "https://4f0772zf-8000.eun1.devtunnels.ms/api/signup/";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Signup successful!");
        navigate("/main");
      } else {
        const errorData = await response.json();
        alert(`Signup failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.page as React.CSSProperties}>
        <h1 style={styles.title}>QueueEase</h1>
        <h2 style={styles.subtitle}>Create an account</h2>

        <div style={styles.container}>
            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Name"
                        style={styles.input}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        style={styles.input}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Phone Number"
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
                <button type="submit" style={styles.button}>
                    Sign Up
                </button>
            </form>
        </div>

        <p style={styles.divider}>
            <span>— or sign in as guest —</span>
        </p>

        <button style={styles.guestButton} onClick={() => navigate('/guest')}>
            Continue as guest
        </button>
    </div>
);
};

export default Signup;
