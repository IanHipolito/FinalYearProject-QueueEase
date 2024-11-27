import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Signup.styles';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phoneNumber: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/api/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Signup successful!');
        navigate('/main');
      } else {
        const errorData = await response.json();
        console.error('Signup failed:', errorData);
        alert(`Signup failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during signup:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <form style={styles.formGroup} onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <input 
          name="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required
        />
        <input 
          name="name" 
          placeholder="Name" 
          onChange={handleChange} 
          required 
        />
        <input
          name="phone_number"
          placeholder="Phone Number"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          onChange={handleChange}
          required
        />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
};

export default Signup;
