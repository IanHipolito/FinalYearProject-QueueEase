import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../styles/AppointmentsList.styles';

interface Appointment {
  order_id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  appointment_title: string;
}

const AppointmentsList: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8000/api/appointments/${user.id}/`)
        .then(response => response.json())
        .then(data => setAppointments(data))
        .catch(error => console.error('Error fetching appointments:', error));
    }
  }, [user]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/appointment/${orderId}`);
  };

  const handleRemoveAppointment = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointment/delete/${orderId}/`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Appointment removed successfully");
        setAppointments(appointments.filter(app => app.order_id !== orderId));
      } else {
        const data = await response.json();
        alert(`Failed to remove appointment: ${data.error}`);
      }
    } catch (error) {
      console.error("Error removing appointment:", error);
      alert("An error occurred while removing the appointment.");
    }
  };

  const generateDemoAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-demo/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id }),
      });
  
      if (response.ok) {
        alert('Demo appointments generated!');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Failed to generate demo appointments: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating demo appointments:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header as React.CSSProperties}>Your Appointments</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => navigate('/add-appointment')}>
          Add Appointment
        </button>
        <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={generateDemoAppointments}>
          Generate Demo Appointments
        </button>
      </div>
      {appointments.map(appointment => (
        <div key={appointment.order_id} style={styles.appointmentCard}>
          <h3 style={styles.appointmentTitle}>{appointment.appointment_title}</h3>
          <p style={styles.appointmentDetail}><strong>Service:</strong> {appointment.service_name}</p>
          <p style={styles.appointmentDetail}>
            <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
          </p>
          <p style={styles.appointmentDetail}><strong>Time:</strong> {appointment.appointment_time}</p>
          <div>
            <button style={styles.button} onClick={() => handleViewDetails(appointment.order_id)}>
              View Details
            </button>
            <button style={styles.removeButton} onClick={() => handleRemoveAppointment(appointment.order_id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;
