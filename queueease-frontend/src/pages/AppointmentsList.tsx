import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
interface Appointment {
  order_id: string;
  appointment_date: string;
  service: string;
}

const AppointmentsList: React.FC = () => {
  const { user } = useAuth();  // Fetch authenticated user from context
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

  return (
    <div>
      <h1>Appointment Details</h1>
      <button onClick={() => navigate('/add-appointment')}>Add Appointment</button>
      {appointments.map(appointment => (
        <div key={appointment.order_id} style={{ backgroundColor: '#ddd', padding: '10px', margin: '10px 0' }}>
          <h3>Appointment Title</h3>
          <p>ID: {appointment.order_id}</p>
          <button onClick={() => handleViewDetails(appointment.order_id)}>View Details</button>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;
