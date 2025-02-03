import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AddAppointment: React.FC = () => {
    const { user } = useAuth();
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
                body: JSON.stringify({ order_id: orderID, user_id: user?.id }),
            });

            let data;
            try {
                data = await response.json();  // Attempt to parse JSON response
            } catch (jsonError) {
                throw new Error('Invalid JSON response from server.');
            }

            if (response.ok) {
                alert('Appointment added successfully!');
                navigate('/appointments');  // Redirect back to appointments list
            } else {
                setError(data.error || 'Failed to add appointment.');
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        }
    };


    return (
        <div>
            <h1>Add Appointment</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="orderID">Order ID:</label>
                <input
                    type="text"
                    id="orderID"
                    value={orderID}
                    onChange={(e) => setOrderID(e.target.value)}
                    required
                />
                <button type="submit">Add Appointment</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default AddAppointment;
