import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderIDInput: React.FC = () => {
  const [orderID, setOrderID] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/appointment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderID }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/appointment/${data.order_id}`);
      } else {
        setError(data.error || 'Failed to fetch appointment.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h1>Enter Your Order ID</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Order ID"
          value={orderID}
          onChange={(e) => setOrderID(e.target.value)}
          required
        />
        <button type="submit">Find Appointment</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default OrderIDInput;
